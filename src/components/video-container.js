import { escapeHtml } from "./quiz-component";

/**
 * Provides a brand-specific video container that plays a video in the background
 * with a video title, creator name, video description, tags, and navigation
 * for taking actions related to the video, such as opening the quiz.
 * 
 * Instead of importing VideoElement and VideoSideNavbar, VideoContainer 
 * uses them both as hard-coded (custom) HTML elements inside {@link render}.
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

        /** Default types for these elements are listed in the constructor */
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

    // Toggle display instead of re-rendering so the <video-element>
    // keeps its state (loaded, playing, etc.)
    hideVideo() {
        this.#hide = true;
        this.style.display = 'none';
    }

    showVideo() {
        this.#hide = false;
        this.style.display = 'block';
    }

    get isHidden() {
        return this.#hide;
    }

    // Finds the <video> inside <video-element> (light DOM or shadow DOM)
    #findVideo() {
        const el = this.querySelector('video-element');
        return el?.querySelector('video') ?? el?.shadowRoot?.querySelector('video') ?? null;
    }

    // <video-element> may build its <video> a moment after it's attached,
    // so retry for a few frames before giving up
    #withVideo(action, tries = 10) {
        const video = this.#findVideo();
        if (video) return action(video);
        if (tries > 0 && this.isConnected) {
            requestAnimationFrame(() => this.#withVideo(action, tries - 1));
        }
    }

    playVideo() {
        this.#active = true;
        this.#paused = false;
        this.#withVideo(video => {
            if (!this.#active) return; // moved out of view while waiting
            video.play().catch(error => console.warn('Could not autoplay video:', error));
        });
        const play = this.querySelector('.pause-icon')
        if (!play) return;
        play.classList.remove('is-visible')
    }

    pauseVideo() {
        this.#paused = true;
        this.#withVideo(video => {
            video.pause();
        });
        const play = this.querySelector('.pause-icon')
        if (!play) return;
        play.classList.add('is-visible')
    }

    handleTap() {
        const play = this.querySelector('.pause-icon');
        if (!play) return;

        if (this.#paused) {
            this.playVideo();
        } else {
            this.pauseVideo();
            play.classList.add('is-visible');
        }

    }

    // Pause and rewind so it starts from the beginning next time it's shown
    stopVideo() {
        this.#active = false;
        this.#withVideo(video => {
            if (this.#active) return; // became current again while waiting
            video.pause();
            video.currentTime = 0;
        });
        const play = this.querySelector('.pause-icon')
        if (!play) return;
        play.classList.remove('is-visible')
    }

    async likeFromDoubleTap() {
        const sideNavbar = this.querySelector('video-side-navbar');
        const liked = await sideNavbar.likeVideo();

        if (!liked) return;

        // [FRONT END] Remove an old animation heart if one is still there.
        const oldHeart = this.querySelector('.video-double-tap-heart');
        if (oldHeart) {
            oldHeart.remove();
        }

        // [FRONT END] Create the heart only when the like happens.
        const heart = document.createElement('div');
        heart.className = 'video-double-tap-heart video-icon-overlay is-visible z-3';
        heart.innerHTML = '<i class="bi bi-heart-fill"></i>';

        const videoWrapper = this.firstElementChild;
        if (!videoWrapper) return;

        videoWrapper.append(heart);

        // [FRONT END] Remove the heart from the DOM after its animation.
        heart.addEventListener('animationend', function () {
            heart.remove();
        }, { once: true });

        // Fallback cleanup in case the animation is interrupted by scrolling.
        setTimeout(function () {
            heart.remove();
        }, 750);

        this.handleTap();
    }

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

    connectedCallback() {
        // each container is stacked on top of the others, fills the stack,
        // and is moved with transform
        this.style.position = 'absolute';
        this.style.inset = '0';
        this.render();
    }

    // Removed from the DOM (e.g. on filter change): detached videos can keep playing audio
    disconnectedCallback() {
        this.stopVideo();
    }
}

customElements.define('video-container', VideoContainer);
