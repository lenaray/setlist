import React from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/WelcomePage.module.css';

const HomePage = () => {
  const router = useRouter();

  const handleLogin = () => {
    console.log("handling login");
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <h1 className={styles.title}>Welcome to Setlist</h1>
        <div className={styles.buttonContainer}>
          <button className={styles.button} onClick={handleLogin}>Login</button>
          <button className={styles.button} onClick={handleSignUp}>Sign Up</button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;