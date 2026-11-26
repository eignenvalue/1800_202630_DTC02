import { auth, db } from '/src/firebaseConfig.js';
import { showLoginModal } from './login-modal.js';
import { onAuthStateChanged } from 'firebase/auth';
import {
    arrayRemove,
    arrayUnion,
    doc,
    getDoc,
    increment,
    setDoc,
} from 'firebase/firestore';

/**
 * The VideoSideNavbar is an element that displays options for a user
 * to take while watching a video, such as liking a video, or opening a
 * quiz.
 * 
 * Each VideoContainer uses a VideoElement as well as a VideoSideNavbar.
 * This is to complete the scrolling effect where the VideoSideNavbar travels
 * upward with the video as the user scrolls to the next/past video.
 * 
 * @extends HTMLElement
 */
class VideoSideNavbar extends HTMLElement {

    constructor() {
        super();

        /** @type {User} @public */
        this.user = null;

        /** @type {boolean} @public */
        this.isLiked = false;

        /** @type {boolean} @public */
        this.quizDone = false;

        /** @type {number} @public */
        this.likeCount = 0;

        /** @type {boolean} @public */
        this.isLoading = true;

        /** @type {function | null} @public */
        this.unsubscribeFromAuth = null;

        /** @type {function} @public */
        this.handleNavAction = this.handleNavAction.bind(this);
    }

    /**
     * Returns a list of attributes to watch for changes. 
     * 
     * @public
     * @returns {Array<string>}
     */
    static get observedAttributes() {
        return ['video-id'];
    }

    /**
     * The video ID as a string.
     * 
     * @public
     * @type {string | null} 
     */
    get videoId() {
        return this.getAttribute('video-id');
    }

    /**
     * Set the video ID attribute.
     * 
     * @public
     * @type {string}
     */
    set videoId(value) {
        this.setAttribute('video-id', value);
    }

    /**
     * If the video-id happens to change then update the like and quiz completion state, 
     * but this shouldn't happen.
     * 
     * @param {string} name the name of the attribute that has changed
     * @param {string | null} oldValue the old value of the attribute as a string or null
     * @param {string | null} newValue the new value of the attribute as a string or null
     * @public
     * @returns {void} 
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.loadLikeState();
            this.loadQuizState();
        }
    }

    /**
     * Load the like state for the logged in user.
     * 
     * Query the Firestore database using getDoc to obtain a document refernce to the document
     * within the videos collection using the {@link videoId} (videos/123j123j1312J) .
     * 
     * If the {@link user} is not logged-in the check for a currently liked video will not be run.
     * 
     * @public
     * @returns {void}
     */
    async loadLikeState() {
        if (!this.videoId) return;

        this.isLoading = true;

        try {

            const videoSnapshot = await getDoc(doc(db, 'videos', this.videoId));

            if (!videoSnapshot.exists()) {
                throw new Error(`Video ${this.videoId} does not exist in Firestore.`);
            }

            const video = videoSnapshot.data();

            this.likeCount = Number.isInteger(video.like_count) ? video.like_count : 0;
            this.isLiked = this.user ? await this.checkIfUserHasLikedCurrentVideo() : false;
        } catch (error) {
            console.error('Could not load the video like state:', error);
            this.isLiked = false;
            this.likeCount = 0;
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    /**
     * Check if the user has liked the curretn {@link video}.
     * 
     * Attempts to get the users liked videos array by reading a snapshot of the
     * users document from the database.
     * 
     * @public
     * @returns {boolean} if the video exists in the users likedVideo array
     */
    async checkIfUserHasLikedCurrentVideo() {
        let likedVideos = [];

        if (this.user) {
            const userSnapshot = await getDoc(doc(db, 'users', this.user.uid));
            likedVideos = userSnapshot.data()?.liked_videos || [];
        }

        return likedVideos.includes(this.videoId);
    }

    /**
     * Emit custom events from this element.
     * 
     * @param {string} name the name of the event
     * @param {object} detail information the event will carry and provide to the listener that catches it
     * @public
     * @returns {void}
     */
    emit(name, detail = {}) {
        this.dispatchEvent(new CustomEvent(name, {
            bubbles: true,
            composed: true,
            detail: { videoId: this.videoId, ...detail },
        }));
    }

    /**
     * The 'video-nav-action' event is handled by this method.
     * 
     * This function expects specific types of actions to be tried, and
     * will try to complete the corresponding action to satisfy the user.
     * 
     * event.detail.action is used without question here because the VideoSideNavbarAnchor
     * emitter always emits with the key action.
     * 
     * @param {CustomEvent} event a 'video-nav-action' event with details containing an 
     *                            action type
     * @public
     * @returns {void}
     */
    async handleNavAction(event) {
        event.preventDefault();

        if (this.isLoading) return;

        if (event.detail.action === 'like' && !this.user) {
            showLoginModal('Please log in to like this video and save it to your profile.');
            return;
        }

        this.isLoading = true;

        switch (event.detail.action) {
            case 'like':
                await this.handleLikeAction();
                break;
            case 'share':
                await this.handleShareAction();
                break;
            case 'practice':
                this.emit('video-practice-requested');
                break;
            case 'quiz':
                this.emit('video-quiz-requested'); // send with no data, use close button on element to close this is just for opening
                break;
            default:
                break;
        }

        this.isLoading = false;
        this.render();
    }

    /**
     * 
     * @
     * @returns {void}
     */
    async handleShareAction() {
        try {
            // Start with a clean URL so none of the current URL parameters can
            // accidentally be carried into the copied link.
            const shareUrl = new URL(window.location.pathname, window.location.origin);

            // Create a new query string containing only the video ID.
            const shareParameters = new URLSearchParams();
            shareParameters.set('videoId', this.videoId);
            shareUrl.search = shareParameters.toString();

            // Ask the browser to copy the completed link to the clipboard.
            await navigator.clipboard.writeText(shareUrl.toString());
            window.alert('Video link copied to your clipboard.');
        } catch (error) {
            console.error('Could not copy the video link:', error);
            window.alert('The link could not be copied. Please check your browser clipboard permissions.');
        }
    }

    // Used by a double tap on the video. Double tapping can add a like,
    // but it does not remove an existing like.
    async likeVideo() {
        if (this.isLoading) return false;

        if (!this.user) {
            showLoginModal('Please log in to like this video and save it to your profile.');
            return false;
        }

        if (this.isLiked) return true;

        this.isLoading = true;
        this.render();
        const saved = await this.handleLikeAction();
        this.isLoading = false;
        this.render();

        return saved && this.isLiked;
    }

    async handleLikeAction() {
        try {
            const videoRef = doc(db, 'videos', this.videoId);
            const userRef = doc(db, 'users', this.user.uid);
            const change = this.isLiked ? -1 : 1;

            await setDoc(userRef, {
                liked_videos: this.isLiked ? arrayRemove(this.videoId) : arrayUnion(this.videoId),
            }, { merge: true });
            await setDoc(videoRef, { like_count: increment(change) }, { merge: true });

            this.isLiked = !this.isLiked;
            this.likeCount = Math.max(0, this.likeCount + change);

            return true;
        } catch (error) {
            console.error('Could not update the video like:', error);
            window.alert('Your like could not be saved. Please try again.');
            return false;
        }
    }

    async loadQuizState() {
        if (!this.user || !this.videoId) {
            this.quizDone = false;
            this.render();
            return;
        }
        try {
            const userSnapshot = await getDoc(doc(db, 'users', this.user.uid));
            const completed = userSnapshot.exists() ? userSnapshot.data().completed_quizzes : null;
            this.quizDone = Boolean(completed && completed[this.videoId]);
        }
        catch (error) {
            console.error('Could not load the quiz state:', error);
            this.quizDone = false;
        }
        this.render();
    }

    render() {
        this.innerHTML = `
            <nav>
                <ul class="list-unstyled d-inline-block mb-0">
                    <video-side-navbar-anchor
                        label=""
                        icon="${this.isLiked ? 'bi-heart-fill' : 'bi-heart'}"
                        action="like"
                        count="${this.likeCount}"
                        ${this.isLiked ? 'active' : ''}
                        ${this.isLoading ? 'disabled' : ''}
                    ></video-side-navbar-anchor>
                    <video-side-navbar-anchor action="share" label="Share" icon="bi-link" url="#"></video-side-navbar-anchor>
                    <video-side-navbar-anchor action="practice" label="Practice" icon="bi-file-earmark" url="#"></video-side-navbar-anchor>
                    <video-side-navbar-anchor action="quiz" label="Quiz" icon="bi-question" url="#" ${this.quizDone ? 'badge="✅"' : ''}></video-side-navbar-anchor>
                </ul>
            </nav>
        `;
    }

    /**
     * If the user is not logged in the anonymous function passed to onAuthStateChanged
     * will set {@link user} to null.
     * 
     * The video-nav-action event is an event sent by VideoSideNavbarAnchors indicating that
     * the user wants to take a specific action such as liking a video or opening an assignment popup.
     *  
     * Rather than pipe-drill different methods, this listener will catch those events and do
     * something with the data inside {@link handleNavAction}.
     * 
     * {@link unsubscribeFromAuth} is also assigned a Unsubscribe 
     * 
     * @public
     * @returns {void}
     */
    connectedCallback() {
        this.addEventListener('video-nav-action', this.handleNavAction);
        this.unsubscribeFromAuth = onAuthStateChanged(auth, (user) => {
            this.user = user;
            this.loadLikeState();
            this.loadQuizState();
        });

        this.render();
    }

    /**
     * Removes the video-nav-action event listener, 
     * and calls unsubscribeFromAuth (if it is not null)
     * 
     * @public
     * @returns {void}
     */
    disconnectedCallback() {
        this.removeEventListener('video-nav-action', this.handleNavAction);
        this.unsubscribeFromAuth?.();
    }
}

// Define the custom element with CustomElementRegistry.
customElements.define('video-side-navbar', VideoSideNavbar);
