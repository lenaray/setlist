import express, { Request, Response } from 'express';
import next from 'next';
import admin from 'firebase-admin';
import axios from 'axios';
import querystring from 'querystring';

// Initialize Firebase Admin
const serviceAccount = require('./setlist-4f90f-firebase-adminsdk-a4hwf-b779be5170.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();
const auth = admin.auth();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

app.prepare().then(() => {
  const server = express();
  server.use(express.json());

  server.post('/api/saveUserInfo', async (req: Request, res: Response) => {
    const { uid, username, password } = req.body;

    try {
      // Save additional user info in Firestore
      await firestore.collection('users').doc(uid).set({
        username,
        password // Consider hashing the password before storing
      });

      res.status(200).json({ message: 'User info saved successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  server.get('/api/auth/spotify', (req: Request, res: Response) => {
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_REDIRECT_URI = process.env.REDIRECT_URI;

    console.log(SPOTIFY_CLIENT_ID);

    const scope = 'user-follow-read';
    console.log(scope);
    const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: SPOTIFY_REDIRECT_URI,
      scope: scope,
    })}`;
    res.redirect(authUrl);
  });

  server.get('/callback/spotify', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    console.log("code: ", code);

    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const REDIRECT_URI = process.env.REDIRECT_URI;
  
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          client_id: SPOTIFY_CLIENT_ID,
          client_secret: SPOTIFY_CLIENT_SECRET,
      }), {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Store tokens in session, cookies, or database, if needed
      console.log("Access Token: ", access_token);

      // Redirect to the main page, passing the token as a query parameter or session
      res.redirect(`/main?access_token=${access_token}`);
    } catch (error) {
        console.error('Error exchanging code for token: ', error);
        res.status(500).json({ error: 'Failed to exchange code for token' });
    }
  
    // try {
    //   const params = new URLSearchParams();
    //   params.append('grant_type', 'authorization_code');
    //   params.append('code', code as string); // ensure code is a string
    //   params.append('redirect_uri', SPOTIFY_REDIRECT_URI || ''); // ensure redirect_uri is a string
    //   params.append('client_id', SPOTIFY_CLIENT_ID || ''); // ensure client_id is a string
    //   params.append('client_secret', SPOTIFY_CLIENT_SECRET || ''); // ensure client_secret is a string
  
    //   const response = await axios.post('https://accounts.spotify.com/api/token', params, {
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    //   });
  
    //   const { access_token } = response.data;
  
    //   // Save the access token to your database if necessary
    //   res.redirect(`/main?access_token=${access_token}`);
    // } catch (error) {
    //   console.error(error);
    //   res.status(400).json({ error: 'Failed to fetch access token' });
    // }
  });

  // Handling all Next.js pages
  server.all('*', (req: Request, res: Response) => {
    return handle(req, res);
  });

  server.listen(port, (err?: any) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });

  server.use((err: any, req: Request, res: Response, next: Function) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });
});
