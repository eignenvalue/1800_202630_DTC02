import { auth, db } from '/src/firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, runTransaction } from 'firebase/firestore';

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

        if (!this.user) {
            window.alert('Please sign in to like videos.');
            return;
        }

        this.isLoading = true;
        this.render();

        switch (event.detail.action) {
            case 'like':
                await this.handleLikeAction();
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

    async handleLikeAction() {
        try {
            const videoRef = doc(db, 'videos', this.videoId);
            const result = await runTransaction(db, async (transaction) => {
                const videoSnapshot = await transaction.get(videoRef);

                if (!videoSnapshot.exists()) {
                    throw new Error('This video no longer exists.');
                }

                const video = videoSnapshot.data();
                const likedBy = Array.isArray(video.liked_by) ? video.liked_by : [];
                const wasLiked = likedBy.includes(this.user.uid);
                const updatedLikedBy = wasLiked
                    ? likedBy.filter((userId) => userId !== this.user.uid)
                    : [...likedBy, this.user.uid];

                transaction.update(videoRef, {
                    liked_by: updatedLikedBy,
                    like_count: updatedLikedBy.length,
                });

                return {
                    isLiked: !wasLiked,
                    likeCount: updatedLikedBy.length,
                };
            });

            // Only update the UI after Firestore confirms the write.
            this.isLiked = result.isLiked;
            this.likeCount = result.likeCount;
        } catch (error) {
            console.error('Could not update the video like:', error);
            window.alert('Your like could not be saved. Please try again.');
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
