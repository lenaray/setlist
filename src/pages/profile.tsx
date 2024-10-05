import React, { useState, useEffect } from 'react';
import { db } from '../firebaseClient';
import { auth } from '../firebaseAuth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, sendSignInLinkToEmail, sendEmailVerification, sendPasswordResetEmail } from '@firebase/auth';
import styles from '../styles/Profile.module.css';
import { useRouter } from 'next/router';
import { UserMetadata } from 'firebase-admin/lib/auth/user-record';

const ProfileScreen = () => {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: '',
        schoolVerified: false,
        schoolName: '',
        schoolEmail: '',
    });

    const router = useRouter();
    const authInstance = getAuth();

    useEffect(() => {
        const fetchUserData = async () => {
          const user = auth.currentUser;
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              setUserData(userDoc.data());
            }
          }
        };
        fetchUserData();
    }, []); 
    
    const handlePasswordChange = async () => {
        const user = auth.currentUser;
        const newPassword = prompt('Enter your new password:');
        if (user && newPassword) {
          await user.updatePassword(newPassword);
          alert('Password updated successfully');
        }
    };

    const goToMainPage = () => {
        router.push('/main');
    };

    return (
        <div className={styles.profileScreen}>
            <a onClick={goToMainPage} className={styles.logo}>setlist</a>
            <div className={styles.profileBox}>
                <h2 className={styles.title}>Your Profile</h2>
                <form>
                    <label>Email</label>
                    <input type="email" className={styles.input} value={userData.email} readOnly />

                    {/* {!userData.schoolVerified && (
                        <>
                            <p>Verify your school email to access community features.</p>
                            <button type="button" className={styles.button} onClick={handleVerifyEmail}>Verify School Email</button>
                        </>
                    )} */}
                </form>

                {userData.schoolVerified && <p>Community chat unlocked!</p>}
            </div>
        </div>
    );
}

export default ProfileScreen;