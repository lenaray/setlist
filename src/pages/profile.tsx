import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseClient;
import styles from '../styles/Profile.module.css';

const ProfileScreen = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUser(currentUser);
        }
    }, []);

    return (
        <div className={styles.profileContainer}>
            {user ? (
                <div>
                    <h1>Profile</h1>
                    <div className={styles.profileDetails}>
                        <p><strong>Name:</strong> {user.displayName}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Username:</strong> {user.username || 'No username available'}</p>
                    </div>
                    <button className={styles.logoutButton} onClick={async () => await auth.signOut()}>
                        Logout
                    </button>
                </div>
            ) : (
                <h1>Loading...</h1>
            )}
        </div>
    );
}