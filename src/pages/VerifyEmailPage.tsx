import React, { useEffect, useState } from 'react';
import { getAuth, applyActionCode } from 'firebase/auth';
import { useRouter } from 'next/router';

const VerifyEmailPage = () => {
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { oobCode } = router.query; // The verification code from the email link

  useEffect(() => {
    if (oobCode) {
      const auth = getAuth();
      applyActionCode(auth, oobCode as string)
        .then(() => {
          setMessage('Email verified successfully! You can now sign in.');
        })
        .catch((error) => {
          console.error('Error verifying email:', error);
          setMessage('Error verifying email. Please try again.');
        });
    }
  }, [oobCode]);

  return (
    <div>
      <h1>Email Verification</h1>
      <p>{message}</p>
    </div>
  );
};

export default VerifyEmailPage;