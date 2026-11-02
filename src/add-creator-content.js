import { app } from '/src/firebaseConfig.js';
import { getFirestore } from 'firebase/firestore';
const db = getFirestore(app);

import {
    doc, collection, getDoc, getDocs,
    onSnapshot, setDoc, addDoc, updateDoc,
    deleteDoc, deleteField
} from "firebase/firestore";

/*

Make videos collection

Add videos document for a video.

{
    user_id: '...', // uuid
    username?: '...', // string
    filename: '1.webm',
    title: '...', // string
    description: '...', // string
    quiz: [
        {
            question: 'What is 2 + 2?', // string
            possibleAnswers: [
                1, 2, 3, 4
            ] // list of integers
        }, // object
        {
            ...
        } // object
    ], // list of objects
    liked_by: [
        'jk3h4kjl23h4kjh34jk...',
        '...'
    ], // list of strings (UUIDs)
    like_count: 100 // integer
}, // object

*/

// const videosRef = collection(db, "videos");

// https://claude.ai/chat/23d5292e-0f6d-4323-8ac2-6aa5f893cfc5

async function sendDataToServer(event) {
    event.preventDefault();

    let data = new FormData(event.target);

    data.forEach(item => {
        console.log(item);
    });

    console.log(event);
    /*

    const docRef = await addDoc(videosRef, {
        text: "Hello",
        sender: "Alice"
    }, { merge: true });
    */

    console.log(docRef.id);
}