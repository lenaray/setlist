import React, { useState, useEffect } from 'react';
import { signIn } from '../firebaseAuth';
import { UserCredential } from 'firebase/auth';
import { useRouter } from 'next/router';
import styles from '../styles/AuthPage.module.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const result: UserCredential = await signIn(email, password);
      const user = result.user;

      if (user && !user.emailVerified) {
        alert('Please verify your email before logging in.');
        return;
      }
      
      router.push('/main');
    } catch (error) {
      if (error instanceof Error) {
        alert('Error: ' + error.message);
      } else {
        alert('An unexpected error occurred.');
      }
    }
  };

  const goToHomePage = () => {
    router.push('/');
  };

  return (
    <div className={styles.authContainer}>
      <a onClick={goToHomePage} className={styles.logo}>setlist</a>
      <div className={styles.authBox}>
        <h1>Login</h1>
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
        <button className={styles.authButton} onClick={handleLogin}>
          Login
        </button>
        <a href="/signup">Don't have an account? Sign Up</a>
      </div>
    </div>
  );
};

export default LoginPage;