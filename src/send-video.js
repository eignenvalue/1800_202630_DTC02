import { app } from '/src/firebaseConfig.js';
import './quiz-builder.js';
import './tag-picker.js';

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // assumes you use Firebase Auth

const db = getFirestore(app);
const auth = getAuth(app);
const videosRef = collection(db, 'videos');

const form = document.getElementById('uploadForm');

async function sendDataToServer(event) {
    event.preventDefault();

    // should check the user type == "creator" after 
    // checking auth.
    // where "creator" is a protected attribute value
    // that only certain accounts are granted 
    // (creator accounts)
    const user = auth.currentUser;
    if (!user) {
        alert('Please sign in before uploading.');
        return;
    }

    const data = new FormData(form);
    const submit = form.querySelector('input[type="submit"]');
    submit.disabled = true; // avoid double uploads

    try {
        const docRef = await addDoc(videosRef, {
            user_id: user.uid,
            // Firestore rejects `undefined`, so only include username if there is one.
            ...(user.displayName ? { username: user.displayName } : {}),
            video_url: data.get('video-url'),
            title: data.get('title'),
            description: data.get('description'),
            tags: data.getAll('tags[]'),
            assignment: data.get('assignment'),
            quiz: form.querySelector('quiz-builder').toJSON(),
            liked_by: [],
            like_count: 0,
            created_at: serverTimestamp(),
        });

        console.log('Saved video', docRef.id);
        form.reset();
    } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed. Please try again.');
    } finally {
        submit.disabled = false;
    }
}

form.addEventListener('submit', sendDataToServer);