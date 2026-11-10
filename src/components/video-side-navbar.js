import { auth, db } from '/src/firebaseConfig.js';
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
            const likedBy = Array.isArray(video.liked_by) ? video.liked_by : [];
            this.isLiked = Boolean(this.user && likedBy.includes(this.user.uid));
            this.likeCount = Number.isInteger(video.like_count)
                ? video.like_count
                : likedBy.length;
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
            window.alert('Please sign in to like videos.');
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
            case 'assignment':
                console.log('assignment');
                this.emit('video-assignment-requested');
                break;
            case 'quiz':
                console.log('quiz');
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
            // Build a link to this specific video, even if the address bar has
            // not finished updating after the user scrolls to a new video.
            const shareUrl = new URL(window.location.href);
            shareUrl.searchParams.set('video', this.videoId);

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
            window.alert('Please sign in to like videos.');
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
            // The Firestore address of the current video.
            const videoRef = doc(db, 'videos', this.videoId);

            if (this.isLiked) {
                // Filled heart: remove this user's ID from the video.
                await setDoc(videoRef, {
                    liked_by: arrayRemove(this.user.uid),
                    like_count: increment(-1),
                }, { merge: true });

                // Update the front end after Firestore saves successfully.
                this.isLiked = false;
                this.likeCount = Math.max(0, this.likeCount - 1);
            } else {
                // Empty heart: add this user's ID to the video.
                await setDoc(videoRef, {
                    liked_by: arrayUnion(this.user.uid),
                    like_count: increment(1),
                }, { merge: true });

                // Update the front end after Firestore saves successfully.
                this.isLiked = true;
                this.likeCount += 1;
            }

            return true;
        } catch (error) {
            console.error('Could not update the video like:', error);
            window.alert('Your like could not be saved. Please try again.');
            return false;
        }
    }

    render() {
        const id = encodeURIComponent(this.videoId || '');

        this.innerHTML = `
            <nav>
                <ul class="list-unstyled d-inline-block mb-0">
                    <video-side-navbar-anchor
                        label="Like"
                        icon="${this.isLiked ? 'bi-heart-fill' : 'bi-heart'}"
                        action="like"
                        count="${this.likeCount}"
                        ${this.isLiked ? 'active' : ''}
                        ${this.isLoading ? 'disabled' : ''}
                    ></video-side-navbar-anchor>
                    <video-side-navbar-anchor action="share" label="Share" icon="bi-share" url="#"></video-side-navbar-anchor>
                    <video-side-navbar-anchor action="assignment" label="Assignment" icon="bi-envelope" url="/assignment.html?id=${id}"></video-side-navbar-anchor>
                    <video-side-navbar-anchor action="quiz" label="Quiz" icon="bi-question" url="/quiz.html?id=${id}"></video-side-navbar-anchor>
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
        });
    }

    disconnectedCallback() {
        this.removeEventListener('video-nav-action', this.handleNavAction);
        this.unsubscribeFromAuth?.();
    }
}

customElements.define('video-side-navbar', VideoSideNavbar);
