import { db } from '/src/firebaseConfig.js';
import {
    collection, getDocs, query, where, limit, startAfter
} from 'firebase/firestore';
import { VideoContainer } from './video-container.js';
import './video-filters.js'; // adjust the path/name to your file

class ScrollableVideoManager extends HTMLElement {

    #queue = [];
    #queuePosition = 0;
    #width;
    #height;
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
    #offsetY = 0;
    #threshold = 100;
    #animationMs = 250;

    #onFiltersChange = (event) => this.setFilters(event.detail?.filters ?? []);

    constructor(width = 400, height = 800) {
        super();
        this.#width = width;
        this.#height = height;
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

    async #reload() {
        const requestId = ++this.#requestId;

        this.#queue = [];
        this.#queuePosition = 0;
        this.#cursor = null;
        this.#hasMore = true;

        const firstPage = await this.loadQueueByPage();
        if (requestId !== this.#requestId) return;

        this.#queue = firstPage;
        this.render();
    }

    async #loadMore() {
        if (this.#loadingMore || !this.#hasMore) return;
        this.#loadingMore = true;
        const requestId = this.#requestId;

        const nextPage = await this.loadQueueByPage();
        this.#loadingMore = false;
        if (requestId !== this.#requestId) return;

        this.#queue = [...this.#queue, ...nextPage];
        this.#refreshNext();
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

    // ---------- layout / gestures ----------

    get #hasLast() {
        return this.#queuePosition > 0;
    }

    get #hasNext() {
        return this.#queuePosition < this.#queue.length - 1;
    }

    #createVideo(info) {
        return new VideoContainer(info ?? {}, this.#width, this.#height);
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
        this.#nextVideo.hideVideo();
        this.#currentVideo.showVideo();
        this.#layout(0);
    }

    #onPointerDown(event) {
        if (this.#animating || !this.#currentVideo) return;
        if (event.target.closest('button, a, summary, input, video-side-navbar')) return;

        this.#dragging = true;
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

    #onPointerUp() {
        if (!this.#dragging) return;
        this.#dragging = false;

        if (this.#offsetY > this.#threshold) {
            this.#commit(-1);
        } else if (this.#offsetY < -this.#threshold) {
            this.#commit(1);
        } else {
            this.#snapBack();
        }
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
    }

    // ---------- rendering ----------

    // Built once: filters on top, video stack below
    #buildShell() {
        this.style.display = 'block';
        this.style.width = `${this.#width}px`;

        this.innerHTML = `
            <div class="position-absolute" style="width: ${this.#width}px; top: 20px; left: 10px;">
                <div>
                    <video-filters videoElementWidth="${this.#width}"></video-filters>
                </div>        
            </div>

            <div data-video-stack
                 style="position: relative; overflow: hidden; touch-action: none;
                        width: ${this.#width}px; height: ${this.#height}px;"></div>
        `;

        this.#stack = this.querySelector('[data-video-stack]');

        this.#stack.addEventListener('pointerdown', e => this.#onPointerDown(e));
        this.#stack.addEventListener('pointermove', e => this.#onPointerMove(e));
        this.#stack.addEventListener('pointerup', () => this.#onPointerUp());
        this.#stack.addEventListener('pointercancel', () => this.#onPointerUp());
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
            return;
        }

        this.#lastVideo = this.#createVideo(this.#queue[this.#queuePosition - 1]);
        this.#currentVideo = this.#createVideo(this.#queue[this.#queuePosition]);
        this.#nextVideo = this.#createVideo(this.#queue[this.#queuePosition + 1]);

        this.#stack.replaceChildren(this.#lastVideo, this.#currentVideo, this.#nextVideo);
        this.#settle();
    }

    connectedCallback() {
        if (!this.#stack) this.#buildShell();

        // filters now live inside this element, and their event bubbles
        this.addEventListener('video-filters-change', this.#onFiltersChange);

        this.#reload();
    }

    disconnectedCallback() {
        this.removeEventListener('video-filters-change', this.#onFiltersChange);
    }
}

customElements.define('scrollable-video-manager', ScrollableVideoManager);