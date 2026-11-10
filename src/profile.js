import { onAuthReady } from '/src/authentication.js';
import { db } from '/src/firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';

let currentUser = null;

async function displayLikedVideosDynamically() {
    // Reference to the videos collection.
    const videosRef = collection(db, 'videos');

    // Get the card template from the front end.
    let cardTemplate = document.getElementById('videoCardTemplate');

    // Read the videos collection.
    const querySnapShot = await getDocs(videosRef);
    let likedVideoCount = 0;

    // Loop through every video, just like displayHikesDynamically().
    querySnapShot.forEach(doc => {
        const thisVideo = doc.data();

        // Only display videos liked by the logged-in user.
        if (thisVideo.liked_by && thisVideo.liked_by.includes(currentUser.uid)) {
            let newcard = cardTemplate.content.cloneNode(true);

            // Populate the copied template with this video's data.
            newcard.querySelector('.card-title').textContent = thisVideo.title || 'Untitled video';
            newcard.querySelector('.card-text').textContent = thisVideo.username || 'Unknown creator';
            newcard.querySelector('.card-likes').textContent = thisVideo.like_count || 0;
            newcard.querySelector('.card-image').src = `/videos/${thisVideo.video_url}`;

            // Add the link with the Firestore document ID.
            newcard.querySelector('.read-more').href = `video-side-navbar.html?video=${doc.id}`;

            // Attach the completed card to the profile page.
            document.getElementById('saved-likes-grid').appendChild(newcard);
            likedVideoCount++;
        }
    });

    if (likedVideoCount == 0) {
        document.getElementById('saved-likes-status').textContent = 'You have not liked any videos yet.';
    } else {
        document.getElementById('saved-likes-status').style.display = 'none';
    }
}

// Run once Firebase knows who is logged in.
onAuthReady(async function (user) {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        currentUser = user;
        document.getElementById('profile-name').textContent = user.displayName || 'Your Profile';
        document.getElementById('profile-email').textContent = user.email || '';
        displayLikedVideosDynamically();
    }
});
