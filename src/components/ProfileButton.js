import React, { useState } from 'react';
import { auth } from '../firebaseClient';
import styles from '../styles/ProfileButton.module.css';

const ProfileButton = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            window.location.href = '/';
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return (
        <div className={styles.profileButton}>
            <button onClick={toggleDropdown} className={styles.profileIcon}>
            👤
            </button>
            {dropdownOpen && (
                <div className={styles.dropdown}>
                    <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                </div>
            )}
        </div>
    );
};

export default ProfileButton;