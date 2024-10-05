import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/AuthPage.module.css';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { signUp } from '../firebaseAuth';
import { UserCredential } from 'firebase/auth';

const VerifySchoolEmailPage = () => {
    const [schoolName, setSchoolName] = useState('');
    const [schoolEmail, setSchoolEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleVerifyEmail = async () => {
        // Validate the school email
        if (!schoolEmail.endsWith('.edu')) {
            alert('Please enter a valid school email ending with .edu');
            return;
        }
        
        try {
            const result: userCredential = await signUp(schoolEmail, password);
            const user = result.user;

            if (user && !user.emailVerified) {
                alert('Please verify your email before logging in');
                return;
            }

            alert(`User signed up! User ID: ${user.uid}`);
        } catch (error) {
            if (error instanceof Error) {
                alert('Error: ' + error.message);
            } else {
                alert('An unexpected error occurred.');
            }
        }
    };

    const goToSignUpPage = () => {
        router.push('/signup');
    };

    return (
        <div className={styles.authContainer}>
            <a onClick={goToSignUpPage} className={styles.logo}>setlist</a>
            <div className={styles.authBox}>
                <p onClick={goToSignUpPage} className={styles.backText}>Back</p>
                <h1>Verify School Email</h1>
                <input
                    type="text"
                    placeholder="School Name"
                    className={styles.authInput}
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="School Email"
                    className={styles.authInput}
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className={styles.authInput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button className={styles.authButton} onClick={handleVerifyEmail}>
                    Verify School Email
                </button>
                <a href="/login">Already have an account? Login</a>
            </div>
        </div>
    );
};

export default VerifySchoolEmailPage;