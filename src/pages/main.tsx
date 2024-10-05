import React, { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import { useRouter } from 'next/router';
import { db } from '../firebaseClient';
import { auth } from '../firebaseAuth';
import { setDoc, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from '@firebase/firestore';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { MenuItem, Select, FormControl, InputLabel, InputAdornment, TextField, IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import 'react-datepicker/dist/react-datepicker.css';
import styles from '../styles/MainPage.module.css';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ProfileButton from '../components/ProfileButton.js';

const MainScreen = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [concerts, setConcerts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [followedArtists, setFollowedArtists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedArtist, setSelectedArtist] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [savedConcerts, setSavedConcerts] = useState([]);
    const [filteredConcerts, setFilteredConcerts] = useState([]);
    const [playingArtist, setPlayingArtist] = useState('')
    const router = useRouter();

    const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;

    const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-follow-read`;

    // fetch concerts & followed artists initially
    useEffect(() => {
        const storedArtists = localStorage.getItem('followedArtists');
        const storedConcerts = localStorage.getItem('concerts');

        // fetch data from local storage if available
        if (storedArtists) {
            console.log("stored artists");
            console.log("followed:", followedArtists[0]);
            setFollowedArtists(JSON.parse(storedArtists));
        }

        if (storedConcerts) {
            console.log("stored concerts");
            setConcerts(JSON.parse(storedConcerts));
            setIsLoading(false);
        } else {
            const token = localStorage.getItem('spotify_access_token');
            const tokenExpiry = Number(localStorage.getItem('spotify_token_expiry'));
            const refreshToken = localStorage.getItem('spotify_refresh_token');

            const isTokenExpired = tokenExpiry && new Date().getTime() > tokenExpiry;

            if (token && !isTokenExpired) {
                setAccessToken(token);
                // console.log("not expired");
                fetchFollowedArtists(token);
            } else if (refreshToken) {
                fetchNewAccessToken(refreshToken);
            } else {
                setShowPopup(true);
                fetchPopularConcerts();
            }

            setIsLoading(false);
        }

        const unsubscribe = auth.onAuthStateChanged(user => {
            if (!user) {
                router.push('/'); // Redirect to home if user is not logged in
            }
        });

        return () => unsubscribe();
    }, []);

    // if local followed artists is empty, fetch again
    useEffect(() => {
        if (accessToken && followedArtists.length == 0) {
            fetchFollowedArtists(accessToken);
        }
    }, [accessToken]);

    // filter concerts when the search query changes
    const filterConcerts = () => {
        if (!searchQuery) {
            setFilteredConcerts(concerts);
            return;
        }

        const lowerCaseQuery = searchQuery.toLowerCase();
        console.log("search:", lowerCaseQuery);
        const matchedConcerts = concerts.filter((concert) =>
            concert.name.toLowerCase().includes(lowerCaseQuery)
        );

        console.log("match:", matchedConcerts);

        // show exact matches
        if (matchedConcerts.length > 0) {
            setFilteredConcerts(matchedConcerts);
        } else {
            // show concerts with closest matches
            setFilteredConcerts(concerts.sort((a, b) => a.name.localeCompare(b.name)));
        }
    };

    const filterConcertsByCriteria = () => {
        let filtered = concerts;

        if (selectedDate) {
            const selectedDateObj = new Date(selectedDate);
            filtered = filtered.filter((concert) => {
                const concertDate = new Date(concert.dates.start.localDate);
                return concerDate >= selectedDateObj;
            });
        }

        if (selectedArtist) {
            filtered = filtered.filter((concert) =>
                concert.name.toLowerCase().includes(selectedArtist.toLowerCase())
            );
        }

        setFilteredConcerts(filtered);

        if (filtered.length === 0) {
            setNoResultsMessage('No concerts found matching your criteria');
        } else {
            setNoResultsMessage('');
        }
    };

    const handleApplyFilters = () => {
        filterConcertsByCriteria();
        setShowFilters(false);
    };

    const handleRemoveFilter = (filterType) => {
        if (filterType === 'date') {
          setSelectedDate(null);
        } else if (filterType === 'artist') {
          setSelectedArtist('');
        }
        filterConcertsByCriteria(); // Re-apply filters without the removed one
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchQuery(''); // Reset the search query
    };

    const handleEnterSearch = () => {
        filterConcerts();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            filterConcerts();
        }
    }

    const fetchNewAccessToken = async (refreshToken) => {
        try {
            const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
            const SPOTIFY_CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
    
            const response = await axios.post('https://accounts.spotify.com/api/token', null, {
                params: {
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                },
                headers: {
                    Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
    
            const { access_token, refresh_token, expires_in } = response.data;
            const expiryTime = new Date().getTime() + expires_in * 1000; // Calculate the expiration time
    
            // Update local storage with the new token and expiration time
            localStorage.setItem('spotify_access_token', access_token);
            localStorage.setItem('spotify_token_expiry', expiryTime);
            localStorage.setItem('spotify_refresh_token', refresh_token);

            setAccessToken(access_token);
    
            // Continue fetching followed artists after refreshing the token
            await fetchFollowedArtists(access_token);
        } catch (error) {
            console.error('Error fetching new access token:', error);
            setShowPopup(true); // Show the popup to reauthorize if refresh fails
        }
    };

    const fetchConcertsForFollowed = async (artists) => {
        setIsLoading(true);

        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
            console.error('No user is currently logged in.');
            return;
        }

        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists() && userDoc.data().concerts) {
                console.log("Using cached concert data");
                setConcerts(userDoc.data().concerts); // Use cached concerts
                console.log(userDoc.data().concerts);
                console.log("concerts:", concerts);
            } else {
                console.log("No cached data found, fetching from Ticketmaster");
            
                const concerts = [];
                const limitedArtists = artists.slice(0, 5);

                for (const artist of limitedArtists) {
                    console.log(`Fetching concerts for artist: ${artist.name}`);
                    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
                        params: {
                            apikey: process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY,
                            countryCode: 'US',
                            sort: 'date,asc',
                            size: 2,
                            keyword: artist.name, // Search by each artist's name separately
                        },
                    });

                    console.log(`Response for ${artist.name}:`, response.data);

                    // Check if the events data is present and append it to the concerts array
                    if (response.data._embedded && response.data._embedded.events) {
                        concerts.push(...response.data._embedded.events);
                    }
                }

                if (concerts.length > 0) {
                    setConcerts(concerts); // Set all found concerts
                    localStorage.setItem('concerts', JSON.stringify(concerts));
                }
            }

            setIsLoading(false);

        } catch (error) {
            console.error('Error fetching concerts for followed artists:', error);
        }
    };

    const fetchPopularConcerts = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
                params: {
                    apikey: process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY,
                    countryCode: 'US',
                    sort: 'date,asc',
                    size: 10,
                    classificationName: 'Pop',
                },
            });
            setConcerts(response.data._embedded.events);
        } catch (error) {
            console.error('Error fetching popular concerts:', error);
        }
    };

    const requestLocation = () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchConcertsNearby(latitude, longitude);
            },
            (error) => {
                alert('Error fetching location. Please allow access to show concerts near you.');
            }
        )
    };

    const fetchConcertsNearby = async (latitude, longitude) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/concerts?lat=${latitude}&lon=${longitude}`);
            setConcerts(response.data.events);
        } catch (error) {
            console.error('Error fetching concert data:', error);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
    }

    const handleArtistChange = (event) => {
        setSelectedArtist(event.target.value);
    }

    const handleFilterToggle = () => {
        setShowFilters(prev => !prev);
        console.log(showFilters);
    }

    const handleBookmarkClick = () => {
        router.push('/saved');
    };

    const fetchFollowedArtists = async (accessToken) => {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me/following?type=artist&limit=20', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const followedArtists = response.data.artists.items;
            setFollowedArtists(followedArtists);
            localStorage.setItem('followedArtists', JSON.stringify(followedArtists));

            fetchConcertsForFollowed(followedArtists);
        } catch (error) {
            console.error('Error fetching followed artists:', error);
        }
    };

    const saveFollowedArtists = async (userId, followedArtists) => {
        try {
            const userRef = doc(db, 'users', userId);

            await setDoc(userRef, { followedArtists }, { merge: true });
            console.log('Followed artists saved');
        } catch (error) {
            console.error('Error saving followed artists:', error);
        }
    };

    const handleSaveConcert = async (concert) => {
        console.log("saving concert");
        const userId = auth.currentUser ? auth.currentUser.uid : null;
    
        if (!userId) {
            console.error('No user is currently logged in');
            return;
        }
    
        const userRef = doc(db, 'users', userId);
        const isSaved = savedConcerts.find(saved => saved.id === concert.id);
    
        try {
            if (isSaved) {
                // Remove the concert from saved concerts
                const updatedSavedConcerts = savedConcerts.filter(saved => saved.id !== concert.id);
                setSavedConcerts(updatedSavedConcerts);
    
                // Update Firestore to remove the concert
                await updateDoc(userRef, {
                    savedConcerts: arrayRemove(concert)
                });
            } else {
                // Add the concert to saved concerts
                setSavedConcerts([...savedConcerts, concert]);
    
                // Update Firestore to add the concert
                await updateDoc(userRef, {
                    savedConcerts: arrayUnion(concert)
                });
            }
            console.log("concert saved");
        } catch (error) {
            console.error('Error saving concert:', error);
        }
    };

    const isConcertSaved = (concertId) => {
        return savedConcerts.some(saved => saved.id === concertId);
    };

    const linkSpotify = async () => {
        window.location.href = AUTH_URL;
    }

    const closePopup = () => {
        setShowPopup(false);
    };

    const handleProfileClick = () => {
        console.log('Profile icon clicked');
    };

    const changeSpotifyPlayer = (artistId) => {
        setPlayingArtist(artistId);
    };

    useEffect(() => {
        let currentIndex = 0;

        const cycleArtists = () => {
            if (followedArtists.length > 0) {
                setPlayingArtist(followedArtists[currentIndex].id);
                currentIndex = (currentIndex + 1) % followedArtists.length; // Move to the next artist
            }
        };

        const intervalId = setInterval(cycleArtists, 300000);

        return () => clearInterval(intervalId); // Cleanup the interval on component unmount
    }, [followedArtists]);

    return (
        <div className={styles.mainScreen}>
            <Popup open={showPopup} closeOnDocumentClick={false}>
                    <div className={styles.popup}>
                        <h2>Link your Spotify account</h2>
                        <button onClick={linkSpotify} className={styles.spotifyButton}>Link Spotify</button>
                        <button className={styles.closeButton} onClick={closePopup}>x</button>
                    </div>
            </Popup>

            <div className={styles.leftSection}>
                <p className={styles.logo}>setlist</p>

                <div className={styles.spotifyPlayer}>
                {accessToken && !playingArtist ? (
                    <iframe
                        src={`https://open.spotify.com/embed/artist/${followedArtists[0]?.id}`}
                        width="450"
                        height="750"
                        frameBorder="0"
                        allow="encrypted-media"
                        allowTransparency="true"
                    ></iframe>
                ) : (
                    accessToken && playingArtist && (
                        <iframe
                            style={{ borderRadius: '12px' }}
                            src={`https://open.spotify.com/embed/artist/${playingArtist}`}
                            width="450"
                            height="750"
                            frameBorder="0"
                            allow="encrypted-media; autoplay"
                        ></iframe>
                    )
                )}
                </div>
            </div>

            <div className={styles.centerSection}>
                <TextField
                    variant="outlined"
                    placeholder="Search for events..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}
                    className={styles.searchBar}
                    InputProps={{
                        // startAdornment: (
                        //     <InputAdornment position="start">
                        //         <IconButton onClick={handleFilterToggle}>
                        //             <MenuIcon className={styles.filters} />
                        //         </IconButton>
                        //     </InputAdornment>
                        // ),
                        endAdornment: searchQuery && (
                            <InputAdornment position="end">
                                {searchQuery && (
                                    <IconButton onClick={handleClearSearch}>
                                        <ClearIcon />
                                    </IconButton>
                                )}

                                <SearchIcon onClick={handleEnterSearch} />
                            </InputAdornment>
                        ),
                    }}
                />

                {searchQuery ? (
                isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <div>
                    {filteredConcerts.length > 0 ? (
                        filteredConcerts.map((concert) => (
                        <div className={styles.concertListings}>
                            <div key={concert.id} className={styles.concertItem}>
                                <h3>{concert.name}</h3>
                                <div className="date">
                                    <CalendarMonthIcon className="calendarIcon" />
                                    {new Date(concert.dates.start.localDate).toLocaleDateString()}
                                </div>
                                <div className="venueInfo">
                                    <LocationOnIcon className="locationIcon" />
                                    {concert._embedded.venues[0].name}
                                </div>
                                <a href={concert.url} target="_blank" rel="noopener noreferrer">
                                    View Tickets
                                </a>
                            </div>
                        </div>
                        ))
                    ) : (
                        <p>No concerts found. Showing closest matches...</p>
                    )}
                    </div>
                )
                ) : (
                <>
                    {isLoading && <div className={styles.loading}>Loading...</div>}
                    {!isLoading && (
                    <div className={styles.concertListings}>
                        {concerts.length > 0 ? (
                        concerts.map((concert) => (
                            <div key={concert.id} className={styles.concertItem}>
                            <div
                                className={styles.bookmarkIcon}
                                onClick={() => handleSaveConcert(concert)}
                            >
                                {isConcertSaved(concert.id) ? (
                                <BookmarkIcon className={styles.filledBookmark} />
                                ) : (
                                <BookmarkBorderIcon className={styles.outlinedBookmark} />
                                )}
                            </div>
                            <h3 className="concertName">{concert.name}</h3>
                            <div className="date">
                                <p className="concertDate">
                                <CalendarMonthIcon className="calendarIcon" />
                                {new Date(concert.dates.start.localDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="venueInfo">
                                <p className="venue">
                                <LocationOnIcon className="locationIcon" />
                                {concert._embedded.venues[0].name}
                                </p>
                            </div>
                            <a href={concert.url} target="_blank" rel="noopener noreferrer">
                                View Tickets
                            </a>
                            </div>
                        ))
                        ) : (
                        <p>No concerts found</p>
                        )}
                    </div>
                    )}
                </>
                )}
            </div>

            {/* Followed artists section */}
            <div className={styles.sideContent}>
                <h3 className={styles.followedArtists}>Followed Artists</h3>
                <div className={styles.artistListings}>
                    {followedArtists.map((artist) => (
                        <div key={artist.id} className={styles.artistItems}>
                            <span>{artist.name}</span>
                            <IconButton
                                onClick={() => changeSpotifyPlayer(artist.id)}
                                className={styles.playIcon}
                            >
                                <PlayArrowIcon />
                            </IconButton>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.topBar}>
                <div className={styles.relinkButtonWrapper}>
                    <BookmarkIcon
                        className={styles.bookmarkIcon}
                        onClick={handleBookmarkClick}
                    />
                    {/* <ProfileButton /> */}
                </div>
            </div>

            {showFilters && (
                <div className={styles.filterOptions}>
                    <div className={styles.filterGroup}>
                        <DatePicker selected={selectedDate} onChange={handleDateChange} />
                    </div>
                    <div className={styles.filterGroup}>
                        <FormControl fullWidth>
                            <InputLabel>Artist</InputLabel>
                            <Select value={selectedArtist} onChange={handleArtistChange}>
                                {followedArtists.map(artist => (
                                    <MenuItem key={artist.id} value={artist.name}>{artist.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                    <button onClick={handleApplyFilters}>Apply Filters</button>
                </div>
            )}

        </div>
    )
};


export default MainScreen;