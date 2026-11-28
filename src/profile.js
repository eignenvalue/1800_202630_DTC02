import { onAuthReady, logoutUser } from '/src/authentication.js';
import { showLoginModal } from '/src/components/login-modal.js';
import { db } from '/src/firebaseConfig.js';
import { doc, getDoc } from 'firebase/firestore';

async function displayLikedVideosDynamically(user) {
    const userSnapshot = await getDoc(doc(db, 'users', user.uid));
    const likedVideoIds = userSnapshot.data()?.liked_videos || [];

    // The template already exists on the DOM. We query it and make copies 
    // here to print more videos.
    const cardTemplate = document.getElementById('videoCardTemplate');
    const status = document.getElementById('saved-likes-status');

    for (const videoId of likedVideoIds) {
        const videoSnapshot = await getDoc(doc(db, 'videos', videoId));
        if (!videoSnapshot.exists()) continue;

        const video = videoSnapshot.data();
        const newcard = cardTemplate.content.cloneNode(true);
        newcard.querySelector('.card-title').textContent = video.title || 'Untitled video';
        newcard.querySelector('.card-text').textContent = video.username || 'Unknown creator';
        newcard.querySelector('.card-likes').textContent = video.like_count || 0;
        newcard.querySelector('.card-image').src = `/videos/${video.video_url}`;
        newcard.querySelector('.read-more').href = `video-side-navbar.html?videoId=${videoId}`;
        document.getElementById('saved-likes-grid').appendChild(newcard);
    }

    status.textContent = likedVideoIds.length ? '' : 'You have not liked any videos yet.';
    status.style.display = likedVideoIds.length ? 'none' : 'block';
}

// Run once Firebase knows who is logged in.
onAuthReady(async function (user) {
    if (!user) {
        document.getElementById('saved-likes-status').textContent = 'Sign in to see liked videos.';
        showLoginModal('Please log in to view your profile.');
    } else {
        document.getElementById('profile-name').textContent = user.displayName || 'Your Profile';
        document.getElementById('profile-email').textContent = user.email || '';

        // Connect the logout button to the Firebase logout function.
        const logoutButton = document.getElementById('logout-button');
        logoutButton.classList.remove('d-none');
        logoutButton.onclick = logoutUser;
        await displayLikedVideosDynamically(user);
    }
});
