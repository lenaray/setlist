import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../firebaseClient';
import { auth } from '../firebaseAuth';
import { arrayRemove, doc, getDoc, updateDoc } from '@firebase/firestore';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import styles from '../styles/Saved.module.css';

const SavedConcerts = () => {
    const [savedConcerts, setSavedConcerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSavedConcerts = async () => {
            const userId = auth.currentUser ? auth.currentUser.uid : null;
            if (!userId) {
                console.error('No user is currently logged in');
                router.push ('/');
                return;
            }

            try {
                const userRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists() && userDoc.data().savedConcerts) {
                    setSavedConcerts(userDoc.data().savedConcerts);
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching saved concerts:', error);
            }
        };

        fetchSavedConcerts();
    }, []);

    const handleRemoveConcert = async (concert) => {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
            console.error('No user is currently logged in');
            return;
        }

        try {
            const userRef = doc(db, 'users', userId);

            // update Firestore to remove the concert
            await updateDoc(userRef, {
                savedConcerts: arrayRemove(concert)
            });

            // update the local state to remove the concert
            setSavedConcerts(savedConcerts.filter(saved => saved.id !== concert.id));
        } catch (error) {
            console.error('Error removing concert:', error);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const goToMainPage = () => {
        router.push('/main');
    };

    return (
        <div className={styles.savedScreen}>
            <a onClick={goToMainPage} className={styles.logo}>setlist</a>
            <div className={styles.savedBox}>
                <h2>Your Saved Concerts</h2>
                {savedConcerts.length > 0 ? (
                    savedConcerts.map((concert) => (
                        <div key={concert.id} className={styles.concertItem}>
                            <h2>{concert.name}</h2>
                            <p><CalendarMonthIcon /> {new Date(concert.dates.start.localDate).toLocaleDateString()}</p>
                            <p><LocationOnIcon /> {concert._embedded.venues[0].name}, {concert._embedded.venues[0].city.name}</p>
                            <BookmarkIcon className={styles.bookmarkIcon} onClick={() => handleRemoveConcert(concert)} />
                        </div>
                    ))
                ) : (
                    <p>You have no saved concerts yet.</p>
                )}
            </div>
        </div>
    )
}

export default SavedConcerts;