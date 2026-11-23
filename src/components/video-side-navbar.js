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

class VideoSideNavbar extends HTMLElement {
    constructor() {
        super();
        this.user = null;
        this.isLiked = false;
        this.quizDone = false;
        this.likeCount = 0;
        this.isLoading = true;
        this.unsubscribeFromAuth = null;
        this.handleNavAction = this.handleNavAction.bind(this);
    }

    static get observedAttributes() {
        return ['video-id'];
    }

    get videoId() {
        return this.getAttribute('video-id');
    }

    set videoId(value) {
        this.setAttribute('video-id', value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Only re-render after the element is in the DOM
        if (oldValue !== newValue && this.isConnected) {
            this.loadLikeState();
            this.loadQuizState();
        }
    }

    async loadLikeState() {
        if (!this.videoId) return;

        this.isLoading = true;
        this.render();

        try {
            const videoSnapshot = await getDoc(doc(db, 'videos', this.videoId));

            if (!videoSnapshot.exists()) {
                throw new Error(`Video ${this.videoId} does not exist in Firestore.`);
            }

            const video = videoSnapshot.data();
            let likedVideos = [];
            if (this.user) {
                const userSnapshot = await getDoc(doc(db, 'users', this.user.uid));
                likedVideos = userSnapshot.data()?.liked_videos || [];
            }
            this.isLiked = likedVideos.includes(this.videoId);
            this.likeCount = Number.isInteger(video.like_count)
                ? video.like_count
                : 0;
        } catch (error) {
            console.error('Could not load the video like state:', error);
            this.isLiked = false;
            this.likeCount = 0;
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    emit(name, detail = {}) {
        this.dispatchEvent(new CustomEvent(name, {
            bubbles: true,
            composed: true,
            detail: { videoId: this.videoId, ...detail },
        }));
    }

    async handleNavAction(event) {
        event.preventDefault();

        if (this.isLoading) return;

        if (event.detail.action === 'like' && !this.user) {
            showLoginModal('Please log in to like this video and save it to your profile.');
            return;
        }

        this.isLoading = true;
        this.render();

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

    connectedCallback() {
        this.addEventListener('video-nav-action', this.handleNavAction);
        this.render();

        this.unsubscribeFromAuth = onAuthStateChanged(auth, (user) => {
            this.user = user;
            this.loadLikeState();
            this.loadQuizState();
        });
    }

    disconnectedCallback() {
        this.removeEventListener('video-nav-action', this.handleNavAction);
        this.unsubscribeFromAuth?.();
    }
}

customElements.define('video-side-navbar', VideoSideNavbar);
