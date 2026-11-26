import { escapeHtml } from "./quiz-component";

/**
 * Provides a brand-specific video container that plays a video in the background
 * with a video title, creator name, video description, tags, and navigation
 * for taking actions related to the video, such as liking the video or opening 
 * the quiz.
 * 
 * Instead of importing VideoElement and VideoSideNavbar, VideoContainer 
 * uses them both as hard-coded HTML elements inside {@link render}.
 * 
 * @extends HTMLElement
 */
export class VideoContainer extends HTMLElement {

    /**
     * Whether to hide the VideoContainer or not.
     *  
     * @private
     * @type {boolean} 
     */
    #hide;

    /**
     * Whether the video is active or not/
     * 
     * @private
     * @type {boolean}
     */
    #active = false; // true while this is the current, playing video

    /**
     * Whether the <video> inside VideoElement is paused or not.
     * 
     * @private
     * @type {boolean}
     */
    #paused = true;

    constructor({
        id = "",
        assignment = "",
        created_at = "",
        description = "",
        like_count = 0,
        quiz = [],
        tags = [],
        title = "",
        user_id = "",
        username = "",
        video_url = "",
    }) {
        super();

        this.#hide = false;

        /** Default types and values for below elements are listed in the constructor. */
        this.id = id;
        this.assignment = assignment;
        this.createdAt = created_at;
        this.description = description;
        this.likeCount = like_count;
        this.quiz = quiz;
        this.tags = tags;
        this.title = title;
        this.userId = user_id;
        this.username = username;
        this.video_url = video_url;
    }

    /**
     * Hide the video without changing video state.
     * 
     * @public
     * @returns {void}
     */
    hideVideo() {
        this.#hide = true;
        this.style.display = 'none';
    }

    /**
     * Show the video.
     * 
     * @public
     * @returns {void}
     */
    showVideo() {
        this.#hide = false;
        this.style.display = 'block';
    }

    /**
     * Get the private field member this.#hide which
     * represent whether the video is currently hidden 
     * or not.
     * 
     * @public
     * @type {boolean}
     */
    get isHidden() {
        return this.#hide;
    }

    // Finds the <video> inside <video-element> (light DOM or shadow DOM)

    /**
     * Find the video element on the page using a querySelector 
     * for 'video'.
     * 
     * @private
     * @returns {HTMLVideoElement | null}
     */
    #findVideo() {
        return this.querySelector('video') ?? null;
    }

    /**
     * Display the pause icon in the center of the video container element.
     * 
     * @param {boolean} display display the icon if true, don't if false
     * @returns 
     */
    displayPauseIcon(display = true) {
        const play = this.querySelector('.pause-icon')
        if (!play) return;
        play.classList.toggle('is-visible', display)
    }

    /**
     * Play the video inside the video element.
     * 
     * If the video is not found or play() fails, the user
     * will be shown an alert box.
     * 
     * @public
     * @returns {void}
     */
    playVideo() {
        this.#active = true;
        this.#paused = false;

        try {
            this.#findVideo().play();
        } catch (error) {
            window.alert('Error: Could not autoplay video. Please reload the page.')
        }

        this.displayPauseIcon(false);
    }

    /**
     * Pause the video inside the video element.
     * 
     * If the video is not found or pause() fails, the user
     * will be shown an alert box.
     * 
     * @public
     * @returns {void}
     */
    pauseVideo() {
        this.#paused = true;
        try {
            this.#findVideo().pause();
        } catch (error) {
            window.alert('Error: Could not pause the video. Please reload the page.')
        }

        this.displayPauseIcon();
    }

    /**
     * Stop the video inside the video element, and reset
     * it's time position to the beginning of the video.
     * 
     * If the video is not found or pause() fails, the user
     * will be shown an alert box.
     * 
     * @public
     * @returns {void}
     */
    stopVideo() {
        this.#active = false;
        try {
            const video = this.#findVideo();
            video.pause();
            video.currentTime = 0;
        } catch (error) {
            window.alert('Error: Could not stop the video. Please reload the page.')
        }

        this.displayPauseIcon(true)
    }

    /**
     * Handle a tap by pausing/unpausing the video.
     * 
     * @public
     * @returns {void}
     */
    handleTap() {
        if (this.#paused) {
            this.playVideo();
            this.displayPauseIcon(false)
        } else {
            this.pauseVideo();
            this.displayPauseIcon();
        }
    }

    /**
     * Likes the video and displays a popup heart animation.
     * 
     * A setTimeout call is made for the heart element to be removed from the
     * DOM after 750ms.
     * 
     * This function does a few things:
     * 1) Likes the video through use of video-side-navbar's public method
     *    .likeVideo().
     * 2) Attempts to remove any old hearts if they are still on the screen
     *    when this method has been called again, such as if the user 
     *    double-tapped multiple times.
     * 3) Create a new heart and attaches the appropriate classes, the most important
     *    being 'video-icon-overlay' because it 'gives' the element a keyframes animation
     *    to do, which means that there will be an 'animationend' event from the element 
     *    at some point.
     * 4) A setTimeout call is made for the heart element to be removed from the DOM 
     *    after 750ms.
     * 5) {@link handleTap} is called to return the video back to the state it was before
     *    the double-tap, as it is paused/unpaused inside the parent when the first tap 
     *    happens. 
     * 
     * @public
     * @returns {Promise<void>}
     */
    async likeFromDoubleTap() {
        const sideNavbar = this.querySelector('video-side-navbar');
        const liked = await sideNavbar.likeVideo();

        if (!liked) return;

        // Remove an old heart if one is still there.
        const oldHeart = this.querySelector('.video-double-tap-heart');
        if (oldHeart) {
            oldHeart.remove();
        }

        // Create the heart only when the like happens.
        const heart = document.createElement('div');
        heart.className = 'video-double-tap-heart video-icon-overlay is-visible z-3';
        heart.innerHTML = '<i class="bi bi-heart-fill"></i>';

        const videoWrapper = this.firstElementChild;
        if (!videoWrapper) return;

        videoWrapper.append(heart);

        // [FRONT END] Remove the heart from the DOM after its animation.
        /**
         * Create an event listener that waits for the 'animationend'
         * event on the heart element.
         * 
         * once: true means that the event listener will be removed
         * after the event happens 1 time.
         */
        heart.addEventListener('animationend', function () {
            heart.remove();
        }, { once: true });

        /** 
         * Fallback cleanup in case the animation is interrupted by scrolling.
         * 
         * Without this, if the user double-taps to like the screen and scrolls 
         * away before the animation completes, the heart will be ready, waiting to
         * complete it's animation if the user happens to scroll back to that video.
         */
        setTimeout(function () {
            heart.remove();
        }, 750);

        /**
         * Pause the video!?
         */
        this.handleTap();
    }

    /**
     * Set the inner HTML content of this element.
     * 
     * @public
     * @returns {void}
     */
    render() {
        this.innerHTML = `
            <div class="position-relative w-100 h-100 overflow-hidden">

                <video-element url="${escapeHtml(this.video_url)}"></video-element>

                <div class="pause-icon is-visible">
                    <i class="bi bi-play"></i>
                </div>

                <div class="position-absolute"
                     style="bottom: 1rem; right: 0.5rem; z-index: 2;">
                    <video-side-navbar video-id="${escapeHtml(this.id)}"></video-side-navbar>
                </div>

                <div class="position-absolute bottom-0 start-0 end-0 text-white"
                     style="z-index: 1; padding: 3rem 4.5rem 1rem 1rem;
                            background: linear-gradient(to top, rgba(0,0,0,.65), transparent);
                            text-shadow: 0 1px 3px rgba(0,0,0,.6);">
                    <details>
                        <summary style="list-style-position: inside;">
                            <h2 class="fs-6 fw-bold d-inline">${escapeHtml(this.username)}</h2>
                            <h3 class="fs-6 fw-normal m-0">${escapeHtml(this.title)}</h3>
                        </summary>
                        <div style="max-height: 30vh; overflow-y: auto;">
                            <p class="small mb-2">${escapeHtml(this.description)}</p>
                            <ul class="list-unstyled d-flex flex-wrap gap-2 m-0 small">
                                ${this.tags.map(tag => `<li class="border rounded px-2">${escapeHtml(tag)}</li>`).join('')}
                            </ul>
                        </div>
                    </details>
                </div>
            </div>
        `;
    }

    /**
     * Setup styles and call {@link render} when the element
     * is added to the DOM.
     * 
     * @public
     * @returns {void}
     */
    connectedCallback() {
        // each container is stacked on top of the others, fills the stack,
        // and is moved with transform
        this.style.position = 'absolute';
        this.style.inset = '0';
        this.render();
    }

    /**
     * Stop the video when the element is removed from the DOM.
     * 
     * @public
     * @returns {void}
     */
    disconnectedCallback() {
        this.stopVideo();
    }
}

// Define the custom element with CustomElementRegistry.
customElements.define('video-container', VideoContainer);
