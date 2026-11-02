import { app } from '/src/firebaseConfig.js';
import { getFirestore } from 'firebase/firestore';
const db = getFirestore(app);

import {
    doc, collection, getDoc, getDocs,
    onSnapshot, setDoc, addDoc, updateDoc,
    deleteDoc, deleteField
} from "firebase/firestore";

// const postRef = doc(db, "posts", "firstPost");
/*
const usersRef = collection(db, "users");

const videosRef = collection(db, "videos");

const snap = await getDocs(usersRef);
console.log(snap);
snap.forEach(item => {
    console.log(item.data());
});
*/

[
    {
        userId: '',
        title: 'this is the title',
        description: 'this is the description',
    }
]

/*

Make videos collection

Add videos document for a video.

{
    user_id: '...', // uuid
    username?: '...', // string
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
    ] // list
}, // object

*/

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

sendMessageToUserForm.addEventListener('submit', sendDataToServer)