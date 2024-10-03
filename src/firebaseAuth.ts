import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, UserCredential, getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from './firebaseClient';

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Successfully set persistence to local
    console.log("Persistence set to local.");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
});

export { auth };

export async function signUp(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Send email verification
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        alert('Verification email sent!');
      }
  
      return userCredential;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
}

// Function to sign in a user with email and password
export async function signIn(email: string, password: string): Promise<UserCredential> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}