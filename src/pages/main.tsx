import React, { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import { useRouter } from 'next/router';
import { auth, db } from '../firebaseClient';
import { setDoc, doc, getDoc } from '@firebase/firestore';
import axios from 'axios';
import { loadGetInitialProps } from 'next/dist/shared/lib/utils';
import styles from '../styles/MainPage.module.css';
import AuthProvider from "./AuthProvider";
import ProfileButton from '../components/ProfileButton';
import SpotifyMusicPlayer from '../components/WebPlayer';
import { getToken } from 'next-auth/jwt';

const MainScreen = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [concerts, setConcerts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [followedArtists, setFollowedArtists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null);
    const router = useRouter();

    const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;

    const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-follow-read`;

    useEffect(() => {
        const token = localStorage.getItem('spotify_access_token');
        const tokenExpiry = Number(localStorage.getItem('spotify_token_expiry'));
        const refreshToken = localStorage.getItem('spotify_refresh_token');

        const isTokenExpired = tokenExpiry && new Date().getTime() > tokenExpiry;

        if (token && !isTokenExpired) {
            setAccessToken(token);
            // console.log("not expired");
            fetchFollowedArtists(token).then(() => {
                if (followedArtists.length > 0) {
                    fetchConcertsForFollowed(followedArtists);
                }
                setIsLoading(false);
            });
        } else if (refreshToken) {
            fetchNewAccessToken(refreshToken);
            setIsLoading(false);
        } else {
            setShowPopup(true);
            fetchPopularConcerts();
            setIsLoading(false);
        }

        const unsubscribe = auth.onAuthStateChanged(user => {
            if (!user) {
                router.push('/'); // Redirect to home if user is not logged in
            }
        });

        return () => unsubscribe();
    }, [followedArtists]);

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
    
            const { access_token, expires_in } = response.data;
            const expiryTime = new Date().getTime() + expires_in * 1000; // Calculate the expiration time
    
            // Update local storage with the new token and expiration time
            localStorage.setItem('spotify_access_token', access_token);
            localStorage.setItem('spotify_token_expiry', expiryTime);

            setAccessToken(access_token);
    
            // Continue fetching followed artists after refreshing the token
            fetchFollowedArtists(access_token);
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
                            size: 5,
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
                    await saveConcerts(userId, concerts);
                } else {
                    console.log("No events found for the followed artists.");
                    setConcerts([]); // Set concerts to an empty array if no events found
                }
            }

        } catch (error) {
            console.error('Error fetching concerts for followed artists:', error);
        }
    };

    const saveConcerts = async (userId, concerts) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
    
            // Merge new concerts with the existing ones
            if (userDoc.exists()) {
                const existingConcerts = userDoc.data().concerts || [];
                const updatedConcerts = [...existingConcerts, ...concerts];
                await setDoc(userRef, { concerts: updatedConcerts }, { merge: true });
            } else {
                await setDoc(userRef, { concerts }, { merge: true });
            }
    
            console.log('Concerts saved successfully');
        } catch (error) {
            console.error('Error saving concerts:', error);
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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }

    const filteredConcerts = concerts.filter((concert) =>
        concert.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchFollowedArtists = async (accessToken) => {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me/following?type=artist&limit=20', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const followedArtists = response.data.artists.items;
            setFollowedArtists(followedArtists);
            // console.log('Followed Artists:', followedArtists);

            const userId = auth.currentUser ? auth.currentUser.uid : null;

            if (userId) {
                await saveFollowedArtists(userId, followedArtists); // Save to Firestore
            } else {
                console.error('No user is currently logged in.');
            }
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

    const linkSpotify = async () => {
        window.location.href = AUTH_URL;
    }

    const closePopup = () => {
        setShowPopup(false);
    };

    return (
        <div className={styles.mainScreen}>
            <Popup open={showPopup} closeOnDocumentClick={false}>
                    <div className={styles.popup}>
                        <h2>Link your Spotify account</h2>
                        <button onClick={linkSpotify} className={styles.spotifyButton}>Link Spotify</button>
                        <button className={styles.closeButton} onClick={closePopup}>x</button>
                    </div>
            </Popup>

            {/* <div className={styles.sideContent}>
                {accessToken && <SpotifyMusicPlayer accessToken={accessToken} followedArtists={followedArtists} /> }
                {followedArtists.length > 0 && (
                    <div className={styles.artistListings}>
                        <h3>Your Followed Artists:</h3>
                        {followedArtists.map((artist: any) => (
                            <div key={artist.id} className={styles.artistItem}>
                                <h4>{artist.name}</h4>
                            </div>
                        ))}
                    </div>
                )}
            </div> */}

            <div className={styles.header}>
                <input
                    type="text"
                    placeholder="Search concerts"
                    value={searchQuery}
                    onChange={handleSearch}
                    className={styles.searchBar}
                />
                <div className={styles.relinkButtonWrapper}>
                    <button onClick={linkSpotify} className={styles.relinkButton}>
                        Relink Spotify
                    </button>
                    <ProfileButton />
                </div>
            </div>

            {isLoading && <div className={styles.loading}>Loading...</div>}
            {!isLoading && (
                <div className={styles.concertListings}>
                {filteredConcerts.length > 0 ? (
                    filteredConcerts.map((concert) => (
                    <div key={concert.id} className={styles.concertItem}>
                        <h3 className="concertName">{concert.name}</h3>
                        <p className="date">{new Date(concert.dates.start.localDate).toLocaleDateString()}</p>
                        <p className="venue">{concert._embedded.venues[0].name}</p>
                        <a href={concert.url} target="_blank" rel="noopener noreferrer">View Tickets</a>
                    </div>
                    ))
                ) : (
                    <p>No concerts found</p>
                )}
                </div>
            )}

            {followedArtists.length > 0 && (
                <div className={styles.artistListings}>
                    <h3>Your Followed Artists:</h3>
                    {followedArtists.map((artist: any) => (
                        <div key={artist.id} className={styles.artistItem}>
                            <h4>{artist.name}</h4>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
};


export default MainScreen;