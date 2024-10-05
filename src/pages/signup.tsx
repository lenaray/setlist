import React, { useState } from 'react';
import { signUp } from '../firebaseAuth';
import { UserCredential } from 'firebase/auth';
import { useRouter } from 'next/router';
import styles from '../styles/AuthPage.module.css';
import { Router } from 'express';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    try {
      const result: UserCredential = await signUp(email, password);
      const user = result.user;

      if (user && !user.emailVerified) {
        alert('Please verify your email before logging in.');
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

  const handleVerifySchoolEmail = () => {
    router.push('/verify');
  };

  const goToHomePage = () => {
    router.push('/');
  };

  return (
    <div className={styles.authContainer}>
      <a onClick={goToHomePage} className={styles.logo}>setlist</a>
      <div className={styles.authBox}>
        <h1>Sign Up</h1>
        <input
          type="email"
          placeholder="Email"
          className={styles.authInput}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className={styles.authInput}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className={styles.authButton} onClick={handleSignUp}>
          Sign Up
        </button>

        {/* <p>or verify your school email to unlock community features</p>

        <button className={styles.authButton} onClick={handleVerifySchoolEmail}>
          Verify School Email
        </button> */}

        <a href="/login">Already have an account? Login</a>
      </div>
    </div>
  );
};

export default SignUpPage;