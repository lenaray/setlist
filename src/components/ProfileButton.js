import React, { useState } from 'react';
import { auth } from '../firebaseClient';
import { useRouter } from 'next/router';
import styles from '../styles/ProfileButton.module.css';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const ProfileButton = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();

    const handleProfileClick = () => {
        router.push('/profile');
    }

    return (
        <div className={styles.profileButton}>
            <AccountCircleIcon onClick={handleProfileClick} className={styles.profileIcon} />
        </div>
    );
};

export default ProfileButton;