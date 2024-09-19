import express, { Request, Response } from 'express';
import next from 'next';
import admin from 'firebase-admin';

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

  // Handling all Next.js pages
  server.all('*', (req: Request, res: Response) => {
    return handle(req, res);
  });

  server.listen(port, (err?: any) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});


// import express, { Request, Response } from 'express';
// import next from 'next';
// import { getAuth } from 'firebase-admin/auth';
// import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
// import { getFirestore } from 'firebase-admin/firestore';

// // import { getAuth, createUserWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';

// const dev = process.env.NODE_ENV !== 'production';
// const app = next({ dev });
// const handle = app.getRequestHandler();

// const port = process.env.PORT || 3000;

// const auth = getAuth();

// app.prepare().then(() => {
//   const server = express();
//   server.use(express.json());

//   server.post('/api/signup', async (req: Request, res: Response) => {
//       const { name, username, password, phoneNumber } = req.body;

//       try {
//           const userRecord = await createUserWithEmailAndPassword(auth, username, password);
//           res.status(200).json({ message: 'User created successfully', uid: userRecord.user?.uid });
//       } catch (error: any) {
//           res.status(400).json({ error: error.message })
//       }
//   });

//   server.post('/api/sendPhoneVerification', async (phoneNumber: string) => {
//       const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {}, auth);

//       try {
//           const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {}, auth);
//           const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
          
//           res.status(200).json({ message: 'Verification code sent', verificationId: confirmationResult.verificationId });
//       } catch (error: any) {
//         res.status(400).json({ error: error.message });
//       }
//   });

//   server.post('/api/verifyPhoneNumber', async (req: Request, res: Response) => {
//     const { verificationId, verificationCode } = req.body;

//       try {
//         const confirmationResult = auth.confirmationResult(verificationId);
//         const result = await confirmationResult.confirm(verificationCode);

//         res.status(200).json({ message: 'Phone number verified', uid: result.user.uid });
//       } catch (error: any) {
//           res.status(400).json({ error: error.message })
//       }
//   });

//   // Handling all Next.js pages
//   server.all('*', (req: Request, res: Response) => {
//     return handle(req, res);
//   });

//   server.listen(port, (err?: any) => {
//     if (err) throw err;
//     console.log(`> Ready on http://localhost:${port}`);
//   });
// });