import React, { useState } from 'react';
import { signUp } from '../firebaseAuth';
import { UserCredential } from 'firebase/auth';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  return (
    <div>
      <h1>Sign Up</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignUp}>Sign Up</button>
    </div>
  );
};

export default SignUpPage;