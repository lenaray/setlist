import React, { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import { useRouter } from 'next/router';
import axios from 'axios';
import { loadGetInitialProps } from 'next/dist/shared/lib/utils';
import styles from '../styles/MainPage.module.css';
import AuthProvider from "./AuthProvider";

const MainScreen = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [concerts, setConcerts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [followedArtists, setFollowedArtists] = useState([]);
    const [accessToken, setAccesstoken] = useState(null);
    const router = useRouter();

    const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;

    const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-follow-read`;

    // useEffect(() => {
    //     const isNewUser = true;
    //     console.error("new user: ", isNewUser);
    //     if (isNewUser) {
    //         setShowPopup(true);
    //         console.log("new user: ", showPopup);
    //         // requestLocation();
    //     }
    // }, []);

    useEffect(() => {
        const token = localStorage.getItem('spotify_access_token');
        if (token) {
            fetchFollowedArtists(token);
        } else {
            setShowPopup(true); // Show the popup to link Spotify
        }
    }, []);

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
            console.log('Followed Artists:', followedArtists);
        } catch (error) {
            console.error('Error fetching followed artists:', error);
        }
    };

    // const linkSpotify = async () => {
    //     console.log("linking spotify");
    //     try {
    //         const storedAccessToken = sessionStorage.getItem('spotify_access_token');
    //         if (storedAccessToken) {
    //             await fetchFollowedArtists(storedAccessToken);
    //         } else {
    //             console.log(window.location.href);
    //             window.location.href = 'http://localhost:3000/api/auth/spotify';
    //         }
    //     } catch (error) {
    //         console.error('Error linking Spotify:', error);
    //     }
    // };

    const linkSpotify = async () => {
        window.location.href = AUTH_URL;
    }
    
    const closePopup = () => {
        setShowPopup(false);
    };

    return (
        <div>
            <Popup open={showPopup} closeOnDocumentClick={false}>
                    <div className={styles.popup}>
                        <h2>Link your Spotify account</h2>
                        <button onClick={linkSpotify} className={styles.spotifyButton}>Link Spotify</button>
                        <button className={styles.closeButton} onClick={closePopup}>x</button>
                    </div>
            </Popup>

            <div className={styles.mainScreen}>
                <input
                    type="text"
                    placeholder="Search concerts"
                    value={searchQuery}
                    onChange={handleSearch}
                    className={styles.searchBar}
                />
            </div>

            <div className={styles.concertListings}>
            {filteredConcerts.length > 0 ? (
                filteredConcerts.map((concert) => (
                <div key={concert.id} className={styles.concertItem}>
                    <h3>{concert.name}</h3>
                    <p>{concert.date}</p>
                    <p>{concert.venue}</p>
                </div>
                ))
            ) : (
                <p>No concerts found</p>
            )}
            </div>

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