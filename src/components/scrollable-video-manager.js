import { db } from '/src/firebaseConfig.js';
import {
    collection, getDocs, query, where, limit, startAfter, doc, getDoc
} from 'firebase/firestore';
import { VideoContainer } from './video-container.js';
import './video-filters.js';
import { QuizComponent } from "./quiz-component";
import { Assignment } from "./assignment";

const VIDEO_PARAM = 'video'; // ?video=<id>  (not "id", which your assignment/quiz pages already use)

class ScrollableVideoManager extends HTMLElement {

    #assignmentDOM = null;
    #quizDOM = null;

    #queue = [];
    #queuePosition = 0;
    #height = 800; // placeholder; replaced by the measured stack height
    #loadError = '';

    // query state
    #filters = [];
    #cursor = null;
    #hasMore = true;
    #loadingMore = false;
    #requestId = 0;
    #pageSize = 10;

    #stack = null; // the div that holds the three videos

    #lastVideo;
    #currentVideo;
    #nextVideo;

    #dragging = false;
    #animating = false;
    #startY = 0;
    #startX = 0;
    #offsetY = 0;
    #lastTapTime = 0;
    #lastTapX = 0;
    #lastTapY = 0;
    #threshold = 100;
    #animationMs = 250;

    #maxQueueSize = 100;

    #resizeObserver = null;

    #onFiltersChange = (event) => this.setFilters(event.detail?.filters ?? []);

    #onAssignmentRequested = () => this.#assignmentDOM?.show();
    #onQuizRequested = () => this.#quizDOM?.show();

    // desktop keyboard navigation
    #onKey = (event) => {
        if (this.#animating || this.#dragging || !this.#currentVideo) return;
        if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;

        if (event.key === 'ArrowDown' && this.#hasNext) {
            event.preventDefault();
            this.#nextVideo.showVideo();
            this.#commit(1);
        } else if (event.key === 'ArrowUp' && this.#hasLast) {
            event.preventDefault();
            this.#lastVideo.showVideo();
            this.#commit(-1);
        }
    };

    constructor() {
        super();
    }

    goNext() {
        if (this.#animating || this.#dragging || !this.#currentVideo) return;

        if (this.#hasNext) {
            this.#nextVideo.showVideo();
            this.#commit(1);
        }
    }

    goPrevious(){
        if (this.#animating || this.#dragging || !this.#currentVideo) return;
        
        if (this.#hasLast) {
            this.#lastVideo.showVideo();
            this.#commit(-1);
        }
    }

    // ---------- querying ----------

    async setFilters(filters) {
        this.#filters = [...filters];
        await this.#reload();
    }

    #buildQuery() {
        const constraints = [];

        if (this.#filters.length === 1) {
            constraints.push(where('tags', 'array-contains', this.#filters[0]));
        } else if (this.#filters.length > 1) {
            constraints.push(where('tags', 'array-contains-any', this.#filters.slice(0, 30)));
        }

        if (this.#cursor) constraints.push(startAfter(this.#cursor));
        constraints.push(limit(this.#pageSize));

        return query(collection(db, 'videos'), ...constraints);
    }

    async loadQueueByPage() {
        try {
            const snapshot = await getDocs(this.#buildQuery());
            this.#loadError = '';
            this.#hasMore = snapshot.docs.length === this.#pageSize;
            this.#cursor = snapshot.docs.at(-1) ?? this.#cursor;

            return snapshot.docs.map(videoDocument => ({
                id: videoDocument.id,
                ...videoDocument.data(),
            }));
        } catch (error) {
            console.error('Could not load videos from Firestore:', error);
            this.#loadError = 'Videos could not be loaded. Check your Firestore permissions and try again.';
            this.#hasMore = false;
            return [];
        }
    }

    // Fetch one specific video by id; null if missing or unreadable
    async #fetchVideoById(id) {
        if (!id) return null;
        try {
            const snapshot = await getDoc(doc(db, 'videos', id));
            return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
        } catch (error) {
            console.error('Could not load the linked video:', error);
            return null;
        }
    }

    // Mirror the current video into the address bar without adding history entries
    #updateUrl() {
        const id = this.#queue[this.#queuePosition]?.id;
        const url = new URL(window.location.href);

        if (id) {
            url.searchParams.set(VIDEO_PARAM, id);
        } else {
            url.searchParams.delete(VIDEO_PARAM);
        }

        window.history.replaceState(window.history.state, '', url);
    }

    async #reload(pinnedId = null) {
        const requestId = ++this.#requestId;

        this.#queue = [];
        this.#queuePosition = 0;
        this.#cursor = null;
        this.#hasMore = true;

        // fetch the linked video and the first page of the feed in parallel
        const [pinned, firstPage] = await Promise.all([
            this.#fetchVideoById(pinnedId),
            this.loadQueueByPage(),
        ]);

        if (requestId !== this.#requestId) return;

        // linked video goes first; drop it from the feed so it isn't shown twice
        this.#queue = pinned
            ? [pinned, ...firstPage.filter(video => video.id !== pinned.id)]
            : firstPage;

        this.render();
    }

    async #loadMore() {
        if (this.#loadingMore || !this.#hasMore) return;
        this.#loadingMore = true;
        const requestId = this.#requestId;

        const nextPage = await this.loadQueueByPage();
        this.#loadingMore = false;
        if (requestId !== this.#requestId) return;

        // later pages can contain the linked video, so dedupe against the queue
        const have = new Set(this.#queue.map(video => video.id));
        this.#queue = [...this.#queue, ...nextPage.filter(video => !have.has(video.id))];

        this.#trimQueue();
        this.#refreshNext();
    }

    // Drop the oldest items so the queue stays within #maxQueueSize.
    // Always keeps the video just behind the current one, because its
    // element is still in the stack and swiping back needs it.
    #trimQueue() {
        const excess = this.#queue.length - this.#maxQueueSize;
        if (excess <= 0) return;

        const removable = Math.min(excess, Math.max(0, this.#queuePosition - 1));
        if (removable === 0) return;

        this.#queue = this.#queue.slice(removable);
        this.#queuePosition -= removable;
    }

    #refreshNext() {
        if (this.#dragging || this.#animating) return;
        const info = this.#queue[this.#queuePosition + 1];
        if (!info || this.#nextVideo.id === info.id) return;

        const fresh = this.#createVideo(info);
        this.#nextVideo.replaceWith(fresh);
        this.#nextVideo = fresh;
        this.#settle();
    }

    // ---------- assignment / quiz panels ----------

    // Created once; they live next to this element, not inside it
    #buildPanels() {
        this.#assignmentDOM = new Assignment();
        this.#quizDOM = new QuizComponent();
        this.after(this.#assignmentDOM, this.#quizDOM);
    }

    // Push the current video's data into the panels and close any that
    // were left open from the previous video
    #syncPanels() {
        if (!this.#assignmentDOM || !this.#quizDOM) return;

        this.#assignmentDOM.hide?.();
        this.#quizDOM.hide?.();

        const video = this.#queue[this.#queuePosition];
        if (!video) return;

        this.#assignmentDOM.assignmentText = video.assignment;
        this.#quizDOM.quiz = video.quiz;
        this.#quizDOM.quizId = video.id;
    }

    // ---------- layout / gestures ----------

    get #hasLast() {
        return this.#queuePosition > 0;
    }

    get #hasNext() {
        return this.#queuePosition < this.#queue.length - 1;
    }

    #createVideo(info) {
        return new VideoContainer(info ?? {});
    }

    // Keep #height in sync with the real stack height (rotation, URL-bar
    // collapse, window resize, navbar height change)
    #measure() {
        const height = this.#stack?.clientHeight;
        if (!height || height === this.#height) return;
        this.#height = height;
        if (!this.#currentVideo) return;
        if (!this.#dragging && !this.#animating) this.#layout(0);
    }

    #layout(offset = 0, animate = false) {
        const transition = animate ? `transform ${this.#animationMs}ms ease` : 'none';
        const place = (video, base) => {
            video.style.transition = transition;
            video.style.transform = `translateY(${base + offset}px)`;
        };
        place(this.#lastVideo, -this.#height);
        place(this.#currentVideo, 0);
        place(this.#nextVideo, this.#height);
    }

    #settle() {
        this.#lastVideo.hideVideo();
        this.#lastVideo.stopVideo();
        this.#nextVideo.hideVideo();
        this.#nextVideo.stopVideo();

        this.#currentVideo.showVideo();
        this.#currentVideo.playVideo();

        this.#layout(0);
    }

    #onPointerDown(event) {
        if (this.#animating || !this.#currentVideo) return;
        if (event.target.closest('button, a, summary, input, video-side-navbar')) return;

        this.#dragging = true;
        this.#startX = event.clientX;
        this.#startY = event.clientY;
        this.#offsetY = 0;
        this.#stack.setPointerCapture(event.pointerId);
    }

    #onPointerMove(event) {
        if (!this.#dragging) return;

        let offset = event.clientY - this.#startY;
        if (offset > 0 && !this.#hasLast) offset = 0;
        if (offset < 0 && !this.#hasNext) offset = 0;
        this.#offsetY = offset;

        if (offset > 0) {
            this.#lastVideo.showVideo();
            this.#nextVideo.hideVideo();
        } else if (offset < 0) {
            this.#nextVideo.showVideo();
            this.#lastVideo.hideVideo();
        }

        this.#layout(offset);
    }

    #onPointerUp(event) {
        if (!this.#dragging) return;
        this.#dragging = false;

        if (event?.type === 'pointercancel') {
            this.#snapBack();
            return;
        }

        const movedX = Math.abs((event?.clientX ?? this.#startX) - this.#startX);
        const isTap = Math.abs(this.#offsetY) < 15 && movedX < 15;

        if (isTap) {
            this.#layout(0);
            this.#handleTap(event);
            return;
        }

        if (this.#offsetY > this.#threshold) {
            this.#commit(-1);
        } else if (this.#offsetY < -this.#threshold) {
            this.#commit(1);
        } else {
            this.#snapBack();
        }
    }

    #handleTap(event) {
        const now = Date.now();
        const x = event?.clientX ?? this.#startX;
        const y = event?.clientY ?? this.#startY;
        const timeSinceLastTap = now - this.#lastTapTime;
        const distanceFromLastTap = Math.hypot(x - this.#lastTapX, y - this.#lastTapY);

        if (timeSinceLastTap > 0 && timeSinceLastTap <= 350 && distanceFromLastTap <= 60) {
            this.#lastTapTime = 0;
            this.#currentVideo?.likeFromDoubleTap();
            return;
        }

        this.#lastTapTime = now;
        this.#lastTapX = x;
        this.#lastTapY = y;
    }

    #onWheel(event) {
        event.preventDefault();
        if (this.#animating || this.#dragging || !this.#currentVideo) return;

        if (event.deltaY > 0 && this.#hasNext) {
            this.#nextVideo.showVideo();
            this.#commit(1);
        } else if (event.deltaY < 0 && this.#hasLast) {
            this.#lastVideo.showVideo();
            this.#commit(-1);
        }
    }

    #snapBack() {
        this.#animating = true;
        this.#layout(0, true);
        setTimeout(() => {
            this.#animating = false;
            if (!this.#dragging) this.#settle();
        }, this.#animationMs);
    }

    #commit(direction) {
        this.#animating = true;
        void this.#stack.offsetHeight; // flush styles so a just-shown video still animates
        this.#layout(-direction * this.#height, true);

        const requestId = this.#requestId;
        setTimeout(() => {
            if (requestId !== this.#requestId) {
                this.#animating = false;
                return;
            }
            if (direction === 1) {
                this.#rotateForward();
            } else {
                this.#rotateBackward();
            }
            this.#animating = false;
        }, this.#animationMs);
    }

    #rotateForward() {
        this.#lastVideo.remove();
        this.#lastVideo = this.#currentVideo;
        this.#currentVideo = this.#nextVideo;
        this.#queuePosition++;
        this.#nextVideo = this.#createVideo(this.#queue[this.#queuePosition + 1]);
        this.#stack.append(this.#nextVideo);
        this.#settle();
        this.#updateUrl();
        this.#syncPanels();

        if (this.#queue.length - 1 - this.#queuePosition <= 2) this.#loadMore();
    }

    #rotateBackward() {
        this.#nextVideo.remove();
        this.#nextVideo = this.#currentVideo;
        this.#currentVideo = this.#lastVideo;
        this.#queuePosition--;
        this.#lastVideo = this.#createVideo(this.#queue[this.#queuePosition - 1]);
        this.#stack.append(this.#lastVideo);
        this.#settle();
        this.#updateUrl();
        this.#syncPanels();
    }

    // ---------- rendering ----------

    // Built once: a centred column (phone-width cap on desktop) whose height is
    // the viewport minus the bottom navbar. Filters on top, video stack below.
    #buildShell() {
        this.style.display = 'flex';
        this.style.justifyContent = 'center';
        this.style.width = '100%';
        this.style.background = '#000';

        this.innerHTML = `
            <div class="position-relative w-100"
                 style="max-width: 480px;
                        height: calc(100vh - var(--bottom-nav-height, 64px));
                        height: calc(100dvh - var(--bottom-nav-height, 64px));">

                <div class="position-absolute start-0 end-0"
                     style="top: 0; z-index: 10;
                            padding-top: calc(env(safe-area-inset-top, 0px) + 10px);">
                    <video-filters videoElementWidth="100%"></video-filters>
                </div>

                <div data-video-stack class="position-relative w-100 h-100"
                     style="overflow: hidden; touch-action: none;"></div>
            </div>
        `;

        this.#stack = this.querySelector('[data-video-stack]');

        this.#stack.addEventListener('pointerdown', e => this.#onPointerDown(e));
        this.#stack.addEventListener('pointermove', e => this.#onPointerMove(e));
        this.#stack.addEventListener('pointerup', e => this.#onPointerUp(e));
        this.#stack.addEventListener('pointercancel', e => this.#onPointerUp(e));
        this.#stack.addEventListener('wheel', e => this.#onWheel(e), { passive: false });
    }

    // Only touches the stack, so the filter bar keeps its state
    render() {
        if (!this.#stack) return;
        this.#dragging = false;

        if (this.#queue.length === 0) {
            this.#lastVideo = this.#currentVideo = this.#nextVideo = null;
            const message = this.#loadError
                || (this.#filters.length
                    ? `No videos found for: ${this.#filters.join(', ')}.`
                    : 'No videos have been uploaded yet.');

            const alert = document.createElement('div');
            alert.className = 'alert alert-warning m-3';
            alert.setAttribute('role', 'alert');
            alert.textContent = message;
            this.#stack.replaceChildren(alert);
            this.#updateUrl(); // removes ?video= when there's nothing to show
            this.#syncPanels(); // closes any panel left open
            return;
        }

        this.#lastVideo = this.#createVideo(this.#queue[this.#queuePosition - 1]);
        this.#currentVideo = this.#createVideo(this.#queue[this.#queuePosition]);
        this.#nextVideo = this.#createVideo(this.#queue[this.#queuePosition + 1]);

        this.#stack.replaceChildren(this.#lastVideo, this.#currentVideo, this.#nextVideo);
        this.#measure();
        this.#settle();
        this.#updateUrl();
        this.#syncPanels();
    }

    connectedCallback() {
        if (!this.#stack) this.#buildShell();
        if (!this.#assignmentDOM) this.#buildPanels();

        // filters live inside this element, and their event bubbles
        this.addEventListener('video-filters-change', this.#onFiltersChange);
        this.addEventListener('video-assignment-requested', this.#onAssignmentRequested);
        this.addEventListener('video-quiz-requested', this.#onQuizRequested);
        window.addEventListener('keydown', this.#onKey);

        this.#resizeObserver = new ResizeObserver(() => this.#measure());
        this.#resizeObserver.observe(this.#stack);
        this.#measure();

        // a ?video=<id> in the URL is fetched first and shown first
        const linkedId = new URLSearchParams(window.location.search).get(VIDEO_PARAM);
        this.#reload(linkedId);
    }

    disconnectedCallback() {
        this.removeEventListener('video-filters-change', this.#onFiltersChange);
        this.removeEventListener('video-assignment-requested', this.#onAssignmentRequested);
        this.removeEventListener('video-quiz-requested', this.#onQuizRequested);
        window.removeEventListener('keydown', this.#onKey);
        this.#resizeObserver?.disconnect();

        this.#assignmentDOM?.remove();
        this.#quizDOM?.remove();
        this.#assignmentDOM = null;
        this.#quizDOM = null;
    }
}

customElements.define('scrollable-video-manager', ScrollableVideoManager);
