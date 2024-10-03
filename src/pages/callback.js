import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const Callback = () => {
    const router = useRouter();
  
    useEffect(() => {
      const { code } = router.query; // Extract the code from query parameters
      if (code) {
        const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
        const SPOTIFY_CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
        const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;
  
        const fetchAccessToken = async () => {
          try {
            const response = await axios.post('https://accounts.spotify.com/api/token', null, {
              params: {
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
              },
              headers: {
                Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            });
  
            const { access_token, refresh_token, expires_in } = response.data; // Extract the access token
            const expiryTime = new Date().getTime() + expires_in * 1000;

            localStorage.setItem('spotify_access_token', access_token); // Store the token
            localStorage.setItem('spotify_refresh_token', refresh_token);
            localStorage.setItem('spotify_token_expiry', expiryTime);

            router.push('/main'); // Redirect to the home page
          } catch (error) {
            console.error('Error fetching access token:', error);
          }
        };
  
        fetchAccessToken(); // Call the function to fetch the access token
      }
    }, [router.query]);

  return <h1>Logging you in...</h1>;
};

export default Callback;