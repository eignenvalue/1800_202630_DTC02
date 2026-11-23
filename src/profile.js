import { onAuthReady, logoutUser } from '/src/authentication.js';
import { showLoginModal } from '/src/components/login-modal.js';
import { db } from '/src/firebaseConfig.js';
import { collection, getDocs, query, where, startAfter, limit } from 'firebase/firestore';

let currentUser = null;
let lastVisible = null;
let isLoading = false;
let noMoreVideos = false;
let likedVideoCount = 0;
let observer = null;

async function displayLikedVideosDynamically() {
    if (isLoading || noMoreVideos) return;
    isLoading = true;
    // Reference to the videos collection.
    const videosRef = collection(db, 'videos');

    // Get the card template from the front end.
    let cardTemplate = document.getElementById('videoCardTemplate');

    let q;
    if (lastVisible) {
        q = query(videosRef, where('liked_by', 'array-contains', currentUser.uid), startAfter(lastVisible), limit(2));
    } else{
        q = query(videosRef, where('liked_by', 'array-contains', currentUser.uid), limit(2))
    }
    // Read the videos collection.
    const querySnapShot = await getDocs(q);

    // Loop through every video, just like displayHikesDynamically().
    querySnapShot.forEach(doc => {
        const thisVideo = doc.data();

        // Only display videos liked by the logged-in user.
            let newcard = cardTemplate.content.cloneNode(true);

            // Populate the copied template with this video's data.
            newcard.querySelector('.card-title').textContent = thisVideo.title || 'Untitled video';
            newcard.querySelector('.card-text').textContent = thisVideo.username || 'Unknown creator';
            newcard.querySelector('.card-likes').textContent = thisVideo.like_count || 0;
            newcard.querySelector('.card-image').src = `/videos/${thisVideo.video_url}`;

            // Add the link with the Firestore document ID.
            newcard.querySelector('.read-more').href = `video-side-navbar.html?videoId=${doc.id}`;

            // Attach the completed card to the profile page.
            document.getElementById('saved-likes-grid').appendChild(newcard);
            likedVideoCount++;
        
    });
    if (querySnapShot.docs.length > 0){
        lastVisible = querySnapShot.docs[querySnapShot.docs.length -1];
    }
    if (querySnapShot.docs.length < 2) {
        noMoreVideos = true;
    }
    if (likedVideoCount == 0) {
        document.getElementById('saved-likes-status').textContent = 'You have not liked any videos yet.';
    } else {
        document.getElementById('saved-likes-status').style.display = 'none';
    }
    isLoading = false;
    if (!noMoreVideos) {
        const sential = document.getElementById('saved-likes-sentinel');
        observer.unobserve(sential);
        observer.observe(sential);
    }
}

// Run once Firebase knows who is logged in.
onAuthReady(async function (user) {
    if (!user) {
        document.getElementById('saved-likes-status').textContent = 'Sign in to see liked videos.';
        showLoginModal('Please log in to view your profile.');
    } else {
        currentUser = user;
        document.getElementById('profile-name').textContent = user.displayName || 'Your Profile';
        document.getElementById('profile-email').textContent = user.email || '';

        // Connect the logout button to the Firebase logout function.
        const logoutButton = document.getElementById('logout-button');
        logoutButton.classList.remove('d-none');
        logoutButton.addEventListener('click', logoutUser);

        observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting){
                displayLikedVideosDynamically();
            }
        });
        observer.observe(document.getElementById('saved-likes-sentinel'));
    }
});
