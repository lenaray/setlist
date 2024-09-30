import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { loadGetInitialProps } from 'next/dist/shared/lib/utils';
import styles from '../styles/MainPage.module.css';

const MainScreen = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [concerts, setConcerts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;

    useEffect(() => {
        const isNewUser = true;
        if (isNewUser) {
            setShowPopup(true);
            requestLocation();
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
            const response = await axios.get(`/api/concerts`);
            setConcerts(response.data.events);
        } catch (error) {
            console.error('Error fetching concert data:', error);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }

    const filteredConcerts = concerts.filter((concert) =>
        concert.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const linkSpotify = async () => {
        const accessToken = await getSpotifyAccessToken();
        
        if (!accessToken) {
            alert('Failed to link Spotify account. Please try again.');
            return;
        }

        try {
            const response = await axios.get('https://api.spotify.com/v1/me/following?type=artist&limit=20', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
            });

            const followedArtists = response.data.artists.items;
            console.log('Followed Artists:', followedArtists);
            alert('Spotify linked successfully!');
        } catch (error) {
            console.error("Error fetching followed artists:", error);
            alert('Failed to fetch followed artists. Please ensure you have granted permission.');
        } finally {
            closePopup();
        }
    };

    const getSpotifyAccessToken = async () => {
        const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-follow-read`;
        
        // Check if there is an authorization code already present in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        console.log('Authorization Code:', code);

        if (!code) {
            // If no code is present, redirect the user to the Spotify authorization URL
            window.location.href = AUTH_URL;
            return null;
        } else {
            // If code is present, exchange it for an access token
            try {
                const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    client_id: SPOTIFY_CLIENT_ID,
                    client_secret: SPOTIFY_CLIENT_SECRET,
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });

                // Remove the code from the URL
                window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
                console.log("returning access token");
                return response.data.access_token; // Return the access token
            } catch (error) {
                console.error('Error getting access token:', error);
                return null;
            }
        }
    };

    const closePopup = () => {
        setShowPopup(false);
    };

    return (
        <div>
            {showPopup && (
                <div className={styles.popuOverlay}>
                    <div className={styles.popup}>
                        <h2>Link your Spotify account</h2>
                        <button onClick={linkSpotify}>Link Spotify</button>
                        <button className={styles.closeButton} onClick={closePopup}>x</button>
                    </div>
                </div>
            )}

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
        </div>
    )
};


export default MainScreen;