import { db } from '/src/firebaseConfig.js';
import { onAuthReady } from '/src/authentication.js';
import {
    collection, getDocs, query, where, limit, startAfter, doc, getDoc,
    QueryDocumentSnapshot,
    Query
} from 'firebase/firestore';
import { VideoContainer } from './video-container.js';
import './video-filters.js';
import { QuizComponent } from "./quiz-component";
import { Assignment } from "./assignment";
import { hideLoginModal, onAuthReadyUserCallback, showLoginModal } from './login-modal.js';

/** 
 * The video parameter name for adding the video ID to the URL.
 * 
 * @type {string} 
 * @global
 */
const VIDEO_PARAM = 'videoId';

/**
 * Provide the user with a video watching interface where they can
 * infinitely scroll through educational content uploaded by 'creators.'
 * 
 * All of the data for the videos is fetched from Firestore and managed
 * by this element. 
 * 
 * @extends HTMLElement
 */
class ScrollableVideoManager extends HTMLElement {

    /**
     * The assignment element singleton that is a child of this element.
     *  
     * @type {Assignment | null} 
     * @private 
     */
    #assignmentDOM = null;

    /** 
     * The quiz element singleton that is a child of this element.
     * 
     * @type {QuizComponent | null} 
     * @private 
     */
    #quizDOM = null;

    /** 
     * Holds a queue of video objects.
     * 
     * @type {Array<object<any, any>>} 
     * @private 
     */
    #queue = [];

    /**
     * The current position in the queue.
     * 
     * @type {number}
     * @private
     */
    #queuePosition = 0;

    /**
     * The height of the stack, set using value from .clientHeight property.
     * 
     * Placeholder value is replaced inside {@link measure}
     * 
     * @type {number}
     * @private
     */
    #height = 800;

    /**
     * Holds a load error message
     * 
     * @type {string}
     * @private
     */
    #loadError = '';

    /**
     * Boolean indicating whether the user has interacted
     * with the application or not.
     * 
     * The user must interact with the application before a 
     * video can autoplay with sound.
     * 
     * @type {boolean}
     * @private
     */
    #interacted = false;

    /**
     * An array of the currently selected video filters.
     * 
     * @type {Array<string>}
     * @private
     */
    #filters = [];

    /**
     * The current cursor position in videos collection.
     * 
     * Holds the snap
     * 
     * @type {QueryDocumentSnapshot | null}
     */
    #cursor = null;

    /**
     * A boolean indicating whether there are more videos
     * available to be fetched from the database.
     * 
     * @type {boolean}
     * @private
     */
    #hasMore = true;

    /**
     * A boolean indicating whether this element is currently
     * loading more content from the database.
     * 
     * @type {boolean}
     * @private
     */
    #loadingMore = false;

    /**
     * A number representing the amount of requests made to 
     * Firestore.
     * 
     * This number is only incremented; it is incremented in 
     * .#reload().
     * 
     * @type {number}
     * @private
     */
    #requestId = 0;

    /**
     * The limit of the amount of video documents to get in one
     * query to the database. Default is 10.
     * 
     * @type {number} 
     * @private
     */
    #pageSize = 10;

    /**
     * The div that holds the three <video-container> elements.
     * 
     * It's height is the height of one video.
     * 
     * @type {HTMLElement | null}
     * @private
     */
    #stack = null;

    /**
     * The last video watched by the user.
     * 
     * @type {VideoContainer}
     * @private
     */
    #lastVideo;

    /**
     * The current video being watched by the user.
     * 
     * @type {VideoContainer}
     * @private
     */
    #currentVideo;

    /**
     * The next video in the queue that is already on the DOM
     * waiting for the user to scroll.
     * 
     * @type {VideoContainer}
     * @private
     */
    #nextVideo;

    /**
     * A boolean indicating whether the user is currently dragging 
     * or not.
     * 
     * @type {boolean}
     * @private
     */
    #dragging = false;

    /**
     * A boolean indicating whether this element is currently waiting
     * for a video container to stop animating.
     * 
     * @type {boolean}
     * @private
     */
    #animating = false;

    /**
     * The start position of a user drag on the Y axis.
     * 
     * Recorded in {@link #onPointerDown} when the user places their finger
     * on the video or presses their mouse-1 key down.
     * 
     * @type {number}
     * @private
     */
    #startY = 0;

    /**
     * The start position of a user drag on the X axis.
     * 
     * Recorded in {@link #onPointerDown} when the user places their finger
     * on the video or presses their mouse-1 key down.
     * 
     * @type {number}
     * @private
     */
    #startX = 0;

    /**
     * The current client position on the Y axis minus {@link #startX}.
     * 
     * Updated inside {@link #onPointerMove}, every time the user moves their
     * finger to drag the video up or down.
     * 
     * @type {number}
     * @private
     */
    #offsetY = 0;

    /**
     * The amount of time it has been since the user last tapped the screen.
     * 
     * Used to calculate whether a double-tap to like is happening, or other
     * actions.
     * 
     * @type {number}
     * @private
     */
    #lastTapTime = 0;

    /**
     * The x-axis coordinate of the last tap position.
     * 
     * @type {number}
     * @private
     */
    #lastTapX = 0;

    /**
     * The y-axis coordinate of the last tap position.
     * 
     * @type {number}
     * @private
     */
    #lastTapY = 0;

    /**
     * The threshold 
     */
    #threshold = 100;

    /**
     * Amount of time to animate the video for when it 
     * is switched.
     * 
     * @type {number}
     * @private
     */
    #animationMs = 250;

    /**
     * The maximum amount of videos to hold in the {@link #queue} list.
     * 
     * @type {number}
     * @private
     */
    #maxQueueSize = 100;

    /**
     * A resize observer to watch for size changes in the 
     * {@link #stack}.
     * 
     * @type {ResizeObserver | null}
     * @private
     */
    #resizeObserver = null;

    /**
     * Store a Unsubscribe function to disconnect the authentication listener
     * when this element is removed from the DOM.
     * 
     * @type {import('firebase/auth').Unsubscribe | null}
     * @private
     */
    #stopAuthCheck = null;

    /**
     * Catch the 'video-filters-change' event and see if the
     * event details contains an updated filters array.
     * 
     * If so set the filters to the new array, otherwise clear
     * the filters.
     * 
     * @param {CustomEvent} event 
     * @private
     * @returns {void}
     */
    #onFiltersChange = (event) => {
        this.setFilters(event.detail?.filters ?? []);
    }

    /**
     * Pauses the video and shows the assignment popup.
     * 
     * @param {CustomEvent} _event 'video-practice-requested', 
     *                             event parameter is unused
     * @private
     * @returns {void}
     */
    #onAssignmentRequested = (_event) => {
        this.#currentVideo.pauseVideo();
        this.#assignmentDOM.show();
    }

    /**
     * Pauses the video and shows the quiz popup.
     * 
     * @param {CustomEvent} _event 'video-quiz-requested',
     *                             event parameter is unused
     * @private
     * @returns {void}
     */
    #onQuizRequested = (_event) => {
        this.#currentVideo.pauseVideo();
        this.#quizDOM.show();
    }

    /**
     * Event handler for any desktop keyboard navigation of
     * the application. Changes the current video on-screen 
     * to the next, or last video.
     * 
     * event.preventDefault() is used to prevent any default 
     * scrolling behaviour caused by pressing 'ArrowUp' or
     * 'ArrowDown'.
     * 
     * @param {Event} event 
     * @private
     * @returns {void}
     */
    #onKey = (event) => {
        if (this.#animating || this.#dragging || !this.#currentVideo) return;
        if (event.target.closest?.('input, textarea, select')) return;

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

    /**
     * Set {@link #interacted} to a different value (true/false).
     * 
     * The value passed will be coverted to a Boolean before assigning
     * to {@link #interacted}.
     * 
     * @param {boolean} value 
     * @private
     * @returns {void}
     */
    #setInteracted(value) {
        this.#interacted = Boolean(value);
    }

    /**
     * Check if the user has interacted with the application.
     * 
     * @private
     * @returns {boolean} a boolean indicating whether the user has interacted
     *                    with the screen application yet
     */
    #getInteracted() {
        return this.#interacted;
    }

    /**
     * Go to the next video, if it is available.
     * 
     * @public
     * @returns {void}
     */
    goNext() {
        this.#setInteracted(true);

        if (this.#animating || this.#dragging || !this.#currentVideo) return;

        if (this.#hasNext) {
            this.#nextVideo.showVideo();
            this.#commit(1);
        }
    }

    /**
     * Go to the previous video, it it is available.
     * 
     * @public
     * @returns {void}
     */
    goPrevious() {
        this.#setInteracted(true);

        if (this.#animating || this.#dragging || !this.#currentVideo) return;

        if (this.#hasLast) {
            this.#lastVideo.showVideo();
            this.#commit(-1);
        }
    }

    // ---------- querying ----------

    /**
     * Assign {@link #filters} to a shallow copy of the Array
     * passed as {@link filters}.
     * 
     * @param {Array<string>} filters
     * @public
     * @returns {Promise<void>} 
     */
    async setFilters(filters) {
        this.#filters = [...filters];
        await this.#reload();
    }

    /**
     * Build a query based on the selected filters.
     * 
     * Use the {@link cursor} to identify where the query should start
     * in the database (i.e. after the cursor document). The cursor
     * is the last document that was fetched (and that this element must 
     * already have the data for).
     * 
     * @private
     * @returns {Query} a query for videos with specific constraints
     */
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

    /**
     * Load a {@link #pageSize} list of videos to add to
     * the queue.
     * 
     * The {@link cursor} position is updated if there is at least
     * one video found from the query.
     * 
     * {@link #hasMore} will be updated to indicate whether there
     * are more posts available in the database, based on if
     * there were {@link #pageSize} elements returned in the last 
     * query.
     * 
     * @public
     * @returns {Promise<Array<object> | Array>} An empty array is returned if no
     *                                           videos are found in the database 
     */
    async loadQueueByPage() {
        try {
            const snapshot = await getDocs(this.#buildQuery());
            this.#loadError = '';
            this.#hasMore = snapshot.docs.length === this.#pageSize;

            /** Sets the cursor to the last element in this batch of videos. */
            this.#cursor = snapshot.docs.at(-1) ?? this.#cursor;

            return snapshot.docs.map(videoDocument => ({
                id: videoDocument.id,
                ...videoDocument.data(),
            }));
        } catch (error) {
            this.#loadError = 'Could not load videos. Please try again later.';
            window.alert(this.#loadError);
            this.#hasMore = false;
            return [];
        }
    }

    /**
     * Fetch one specific video by ID.
     * 
     * @param {string} id the video id as a string
     * @returns {Promise<object | null>} null if the video document cannot be 
     *                                   found
     */
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

    /**
     * Update the URL to reflect the video the user is currently watching.
     * 
     * .replaceState makes it so that you cannot navigate forward
     * or backward through past video pages by using the backward/forward
     * browser navigation buttons, the page state is replaced each time a 
     * new/past video is shown on the video player.
     * 
     * @private
     * @returns {void}
     */
    #updateUrl() {
        const id = this.#queue[this.#queuePosition]?.id;
        const url = new URL(window.location.href);

        if (id) {
            url.searchParams.set(VIDEO_PARAM, id);
        } else {
            url.searchParams.delete(VIDEO_PARAM);
        }

        /** Exit if the URL already reflects the current video. */
        if (url == window.location.href) return;

        window.history.replaceState(window.history.state, '', url);
    }

    /**
     * Clear the queue and fetch new content to be displayed
     * to the user.
     * 
     * If there is a pinned video it will be fetched specifically so that
     * it can be displayed to the user first.
     * 
     * Called when the element is added to the DOM in {@link connectedCallback},
     * and when the user changes their selected video filters.
     * 
     * @param {string} pinnedId the id that was already in the URL, if present
     * @private
     * @returns {Promise<void>}
     */
    async #reload(pinnedId = null) {
        /** 
         * Prepend {@link #requestId} so that the value stored 
         * inside is the same as {@link requestId} 
         */
        const requestId = ++this.#requestId;

        /** Clear any recorded data related to the queue. */
        this.#queue = [];
        this.#queuePosition = 0;
        this.#cursor = null;
        this.#hasMore = true;

        /** 
         * Fetch the pinned video, and a list videos related to the specified
         * filters...unpack the results from the array eventually returned by 
         * Promise.all().
         */
        const [pinned, firstPage] = await Promise.all([
            this.#fetchVideoById(pinnedId),
            this.loadQueueByPage(),
        ]);

        /** 
         * If the user has since updated the filters {@link #reload} may have
         * been called again, where {@link #requestId} would have been reassigned
         * a new value.
         */
        if (requestId !== this.#requestId) return;

        /**
         * Add the videos the queue.
         * 
         * If pinned is not undefined, ensure that the pinned video is removed 
         * from the list of videos if present so that the user is not shown 
         * the same video twice.
         */
        this.#queue = pinned
            ? [pinned, ...firstPage.filter(video => video.id !== pinned.id)]
            : firstPage;

        /** Re-render the page with the new content. */
        this.render();
    }

    /**
     * Load more videos into the queue, while keeping
     * repeats from being presented to the user.
     * 
     * @private
     * @returns {Promise<void>}
     */
    async #loadMore() {
        if (this.#loadingMore || !this.#hasMore) return;

        /** 
         * If the {@link #requestId} has changed, stop the operation. 
         * 
         * This could really only happen if this call has set {@link #loadingMore}
         * to false, and inside {@link loadQueueByPage} {@link #hasMore} is set to
         * true. Since this call sets loadingMore to true, which would block the
         * subsequent call from doing any fetching.
        */
        this.#loadingMore = true;
        const requestId = this.#requestId;
        const nextPage = await this.loadQueueByPage();
        this.#loadingMore = false;
        if (requestId !== this.#requestId) return;

        /** A set of video IDs that are already in the queue. */
        const have = new Set(this.#queue.map(video => video.id));

        /** 
         * Filter the new videos into the queue by checking if they are NOT in {@link have} set.
         * Spread the {@link #queue} and filtered array into a new {@link #queue} array.
         */
        this.#queue = [...this.#queue, ...nextPage.filter(video => !have.has(video.id))];

        this.#trimQueue();
        this.#refreshNext();
    }

    /**
     * Keep the queue at length {@link #maxQueueSize} or less.
     * 
     * This method will always keep the last video because the user needs
     * it for swiping backward.
     * 
     * @private
     * @returns {void} 
     */
    #trimQueue() {
        const excess = this.#queue.length - this.#maxQueueSize;
        if (excess <= 0) return;

        /** The amount of videos that are removable from the front of the array. */
        const removable = Math.min(excess, Math.max(0, this.#queuePosition - 1));
        if (removable === 0) return;

        /** 
         * Create a new array without removable videos. 
         * {@link removable} is the start index. 
         */
        this.#queue = this.#queue.slice(removable);

        /** Offset the queue position to account for the NOW missing videos. */
        this.#queuePosition -= removable;
    }

    /**
     * Refresh the {@link #nextVideo} element to display the video in 
     * the {@link #queue}.
     * 
     * @private
     * @returns {void}
     */
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
    /**
     * Build Assignment and QuizComponent panels to be reused with all
     * VideoContainers. Place them in the DOM after the ScrollableVideoManager.
     * 
     * @private
     * @returns {void}
     */
    #buildPanels() {
        this.#assignmentDOM = new Assignment();
        this.#quizDOM = new QuizComponent();
        this.after(this.#assignmentDOM, this.#quizDOM);
    }

    /**
     * Push the current video's data into the panels and close any panels
     * that were left open from the previous video.
     * 
     * @private
     * @returns {void} 
     */
    #syncPanels() {
        if (!this.#assignmentDOM || !this.#quizDOM) return;

        const video = this.#queue[this.#queuePosition];
        if (!video) return;

        this.#assignmentDOM.assignmentText = video.assignment;
        this.#quizDOM.quiz = video.quiz;
        this.#quizDOM.quizId = video.id;
    }

    // ---------- layout / gestures ----------

    /**
     * Check if there is a 'last video' in the queue (i.e. A video before the current video).
     * 
     * @private
     * @type {boolean} true is the queuePosition is greater than 0, false otherwise
     */
    get #hasLast() {
        return this.#queuePosition > 0;
    }

    /**
     * Check if there is a 'next video' in the queue (i.e. A video after the current video).
     * 
     * @private
     * @type {boolean} true if the queue position is less than the length of the queue minus 1,
     *                 false otherwise
     */
    get #hasNext() {
        return this.#queuePosition < this.#queue.length - 1;
    }

    /**
     * Create a new video container with info, or an empty object if
     * info is nullish.
     * 
     * @param {object} info a well-formed video object
     * @private 
     * @returns {VideoContainer} a new video container instantiated with {@link info}
     */
    #createVideo(info) {
        return new VideoContainer(info ?? {});
    }

    /**
     * Keep {@link #height} in sync with the real stack height.
     * 
     * Screen rotation, URL-bar collapse, window resize, and navbar height change
     * all affect how the video player should be presented.
     * 
     * @private
     * @returns {void}
     */
    #measure() {
        const height = this.#stack?.clientHeight;

        /** If the height is undefined or hasn't changed, exit. */
        if (!height || height === this.#height) return;

        /** Update the recorded height of the {@link stack} for VideoContainers. */
        this.#height = height;

        /** 
         * If there is no current video then {@link #queue} is empty and 
         * there is nothing to adjust below. 
         */
        if (!this.#currentVideo) return;

        /** 
         * If measuring has occurred and the videos are not currently being 
         * dragged or animated, set the last, next, and current video positions 
         * with no offset or animation.
         */
        if (!this.#dragging && !this.#animating) this.#layout(0);
    }

    /**
     * Handle placing videos from the stack on the DOM.
     * 
     * @param {number} offset the amount of offset, in pixels to apply to the elements Y position
     *                        during user dragging, or after mwheeldown scroll, or a desktop video navigation
     *                        button click
     * @param {boolean} animate if true a transform animation is applied to all videos 
     *                          so that the video can move to their positions automatically 
     * @private
     * @returns {void}
     */
    #layout(offset = 0, animate = false) {
        const transition = animate ? `transform ${this.#animationMs}ms ease` : 'none';

        /**
         * Place the videos in their proper positions on the DOM using a transition 
         * and translateY, either with or without animation.
         * 
         * @param {VideoContainer} video the video to apply the styles too
         * @param {number} base the height of the video stack as one component of the ending 
         *                      Y position of the video after the position translation
         * @private
         * @returns {void}
         */
        const place = (video, base) => {
            video.style.transition = transition;
            console.log('placed with this transition ', transition);
            video.style.transform = `translateY(${base + offset}px)`;
        };

        /** Place each video in it's proper position. */
        place(this.#lastVideo, -this.#height);
        place(this.#currentVideo, 0);
        place(this.#nextVideo, this.#height);
    }

    /**
     * 
     * 
     * @private
     * @returns {void}
     */
    #settle() {
        console.log('settling');

        this.#layout(0);
        this.#lastVideo.hideVideo();
        this.#lastVideo.stopVideo();
        this.#nextVideo.hideVideo();
        this.#nextVideo.stopVideo();

        this.#currentVideo.showVideo();

        /** Only play the video if the user has interacted with the application. */
        if (this.#getInteracted()) {
            this.#playCurrentVideo();
        }
    }

    /**
     * Handle a user pointerdown event.
     * 
     * This method will begin the tracking of where the users finger is in relation
     * to where they started the drag, if they endup dragging the page.
     * 
     * Sets {@link #interacted} to true, so that other methods can function, and
     * videos can be played.
     * 
     * @param {PointerEvent} event the event containing important details about where
     *                             the user put their pointer down on the screen (i.e. 
     *                             event.clientX, event.clientY)
     * @private
     * @returns {void}
     */
    #onPointerDown(event) {
        this.#setInteracted(true);
        if (this.#animating || !this.#currentVideo) return;
        if (event.target.closest('button, a, summary, input, video-side-navbar')) return;

        this.#dragging = true;
        this.#startX = event.clientX;
        this.#startY = event.clientY;
        this.#offsetY = 0;
        this.#stack.setPointerCapture(event.pointerId);
    }

    /**
     * Handle updating the video positions when the user moves their pointer.
     * 
     * If the user decides to move their 'pointer' then this function will handle updating the
     * position of the videos to reflect how far the user has dragged upward or downward on the
     * screen, based on the positions recorded during the 'pointerdown' event.
     * 
     * @param {PointerEvent} event 
     * @private
     * @returns {void} 
     */
    #onPointerMove(event) {
        /** 
         * Only handle the event if the user is currently pressing down.
         * 
         * If another method has marked the user as having released their pointer
         * then exit.
         */
        if (!this.#dragging) return;

        /** 
         * Dragging toward the bottom of the screen produces a positive offset,
         * so all elements are move downward.
         * 
         * Dragging upward produces a negative offset and the videos are moved (minus 
         * some amount of pixels) upward.
         */
        let offset = event.clientY - this.#startY;
        console.log(offset, event.clientY, this.#startY)

        /** Check if there is a last of next video before assigning any offset above 0. */
        if (offset > 0 && !this.#hasLast) offset = 0;
        if (offset < 0 && !this.#hasNext) offset = 0;
        this.#offsetY = offset;

        if (offset > 0) {
            /** Drag downward */
            this.#lastVideo.showVideo();
            this.#nextVideo.hideVideo();
        } else if (offset < 0) {
            /** Drag upward */
            this.#nextVideo.showVideo();
            this.#lastVideo.hideVideo();
        }

        /** 
         * Call layout every time the user moves their pointer so that 
         * the videos are in the correctly offset position. 
         */
        this.#layout(offset);
    }

    /**
     * Determine where to place the videos after the user stops
     * clicking or dragging the video player.
     * 
     * @param {PointerEvent} event 
     * @private
     * @returns {void} 
     */
    #onPointerUp(event) {
        if (!this.#dragging) return;
        this.#dragging = false;

        /** 
         * If it happens to be a pointercancel event
         * then keep displaying the current video. 
         */
        if (event?.type === 'pointercancel') {
            this.#snapBack();
            return;
        }

        /** Determine how many pixels the user moved their finger/cursor. */
        const movedX = Math.abs((event?.clientX ?? this.#startX) - this.#startX);

        /** If the user moved less than 15 pixels call the action a tap. */
        const isTap = Math.abs(this.#offsetY) < 15 && movedX < 15;

        /** Reset the layout */
        if (isTap) {
            /** Reset the video positions and visibility. */
            this.#layout(0);
            this.#handleTap(event);
            return;
        }

        /** 
         * Use the threshold to determine if the user has scrolled far enough for 
         * the video to switch. 
         */
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

        this.#currentVideo.handleTap();

        this.#lastTapTime = now;
        this.#lastTapX = x;
        this.#lastTapY = y;
    }

    #onWheel(event) {
        this.#setInteracted(true);
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

    #flushStyles() {
        // Reading a layout property forces a synchronous style/layout recalculation.
        void this.#stack.offsetWidth;
    }

    #commit(direction) {
        this.#animating = true;
        this.#flushStyles();

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

    /**
     * Build the HTML shell for this element, this includes adding the video stack
     * element to the DOM, and attaching event listeners for 'pointerdown', 
     * 'pointermove', etc, to control the state of the video player.
     * 
     * This method is only called one time when the element is first added to the DOM,
     * in {@link connectedCallback}.
     * 
     * @private
     * @returns {void}
     */
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
                <div class="position-absolute start-0 end-0" style="
                        background: linear-gradient(to bottom, rgba(0,0,0,.65), transparent);
                        text-shadow: 0 1px 3px rgba(0,0,0,.6);
                        top: 0; 
                        z-index: 10; 
                        padding-top: calc(env(safe-area-inset-top, 0px) + 10px);
                    ">
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

    /**
     * Render the video stack contained inside this element.
     * 
     * {@link #buildShell} must be called before this function so that {@link #stack} is defined
     * when .replaceChildren is called.
     * 
     * {@link render} is only called inside of {@link #reload} when the user changes the selected
     * filters.
     * 
     * @public
     * @returns {void} 
     */
    render() {
        if (!this.#stack) return;

        /** Try to stop any animations that may occur before the component 'reloads.' */
        this.#dragging = false;

        /** Alert the user on screen (inside the DOM) that there are no videos. */
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

            /** Remove any videoId from the URL. */
            this.#updateUrl();

            /** Closes any open panels (Quiz or Assignment components). */
            this.#syncPanels();
            return;
        }

        /** 
         * Create a new VideoContainer for each video. Defining the videos here 
         * allows them to be used by {@link #settle}. 
         */
        this.#lastVideo = this.#createVideo(this.#queue[this.#queuePosition - 1]);
        this.#currentVideo = this.#createVideo(this.#queue[this.#queuePosition]);
        this.#nextVideo = this.#createVideo(this.#queue[this.#queuePosition + 1]);

        /** Replace any content inside the stack with the three videos. */
        this.#stack.replaceChildren(this.#lastVideo, this.#currentVideo, this.#nextVideo);

        /** Call helper methods to setup proper UI state. */
        this.#measure();
        this.#settle();
        this.#updateUrl();
        this.#syncPanels();
    }

    /**
     * Play the video currently being shown to the user if 
     * the function to do so is available.
     * 
     * @param {Event} event unused
     * @private
     * @returns {void} 
     */
    #playCurrentVideo(_event) {
        this.#currentVideo?.playVideo();
    }

    /**
     * Setup the ScrollableVideoManager when it is added to the DOM.
     * 
     * Mutates global state by adding a 'keydown' event listener directly 
     * to the window.
     * 
     * @public
     * @returns {void}
     */
    connectedCallback() {
        /** Filters live inside this element, and their events bubble to this element. */
        this.addEventListener('video-filters-change', this.#onFiltersChange);

        /** These events bubble from the VideoSideNavbar inside a videos VideoContainer. */
        this.addEventListener('video-practice-requested', this.#onAssignmentRequested);
        this.addEventListener('video-quiz-requested', this.#onQuizRequested);

        /** Attach a global window event listener for 'keydown' events. */
        window.addEventListener('keydown', this.#onKey);

        if (!this.#stack) this.#buildShell();
        if (!this.#assignmentDOM || !this.#quizDOM) this.#buildPanels();

        /**
         * Create a new ResizeObserver and pass an anonymous callback function
         * to retain 'this' context (without binding 'this' or other tricks.)
         */
        this.#resizeObserver = new ResizeObserver(() => this.#measure());

        /**
         * Tell the {@link #resizeObserver} to watch the video stack for changes in height.
         */
        this.#resizeObserver.observe(this.#stack);

        /** Call {@link #measure} to get the initial stack measurements. */
        this.#measure();

        /** Firebase's internals manage the reference to the callback function. */
        this.#stopAuthCheck = onAuthReady(onAuthReadyUserCallback);

        const parameters = new URLSearchParams(window.location.search);

        /** Get the current video ID from the URL so that it can be displayed first. */
        const linkedId = parameters.get(VIDEO_PARAM);

        /** Pass the video ID (if any) to reload and (re)load the video player. */
        this.#reload(linkedId);
    }

    /**
     * Runs when the element is removed from the DOM, does cleanup
     * of the onAuthReady/onAuthStateChanged listener.
     * 
     * If the element is moved on the DOM disconnectedCallback is run 
     * before connectedCallback is run, essentially re-initializing the element.
     * 
     * This can be prevented (if-needed) by introducing a connectedMoveCallback where 
     * you can stop that behaviour. 
     * 
     * @public
     * @returns {void}
     */
    disconnectedCallback() {
        /** Cleanup event listeners */
        this.removeEventListener('video-filters-change', this.#onFiltersChange);
        this.removeEventListener('video-practice-requested', this.#onAssignmentRequested);
        this.removeEventListener('video-quiz-requested', this.#onQuizRequested);
        window.removeEventListener('keydown', this.#onKey);
        this.#resizeObserver?.disconnect();

        /** Call the Unsubscribe function if it exists. */
        this.#stopAuthCheck?.();

        /** 
         * Manually remove the quizzes and assignments
         * because they are placed outside of this element
         * and have not been removed from the DOM with this 
         * element. 
         */
        this.#assignmentDOM?.remove();
        this.#quizDOM?.remove();

        /** Set to null to remove references to the DOM elements. */
        this.#assignmentDOM = null;
        this.#quizDOM = null;
    }
}

// Define the custom element with CustomElementRegistry.
customElements.define('scrollable-video-manager', ScrollableVideoManager);
