import React from 'react';
import { useRouter } from 'next/router';
import '../styles/WelcomePage.module.css'; // Ensure you create this CSS module file

const HomePage = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login'); // Navigate to login page
  };

  const handleSignUp = () => {
    router.push('/signup'); // Navigate to sign-up page
  };

  return (
    <div className="container">
      <div className="overlay">
        <h1 className="title">Welcome to Setlist</h1>
        <div className="buttonContainer">
          <button className="button" onClick={handleLogin}>Login</button>
          <button className="button" onClick={handleSignUp}>Sign Up</button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;