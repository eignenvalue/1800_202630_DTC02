import { QuizBuilder } from "../quiz-builder";
import { Assignment } from "./assignment";

export class VideoContainer extends HTMLElement {

    #width;
    #height;
    #assignmentDOM;
    #quizDOM;
    #hide;
    #active = false; // true while this is the current, playing video

    constructor({
        id = "",
        assignment = "",
        created_at = "",
        description = "",
        like_count = 0,
        liked_by = 0,
        quiz = [],
        tags = [],
        title = "",
        user_id = "",
        username = "",
        video_url = "",
    } = {}, width = 400, height = 800) {
        super();

        this.#width = width;
        this.#height = height;
        this.#hide = false;

        this.id = id;
        this.assignment = assignment;
        this.createdAt = created_at;
        this.description = description;
        this.likeCount = like_count;
        this.likedBy = liked_by;
        this.quiz = quiz;
        this.tags = tags;
        this.title = title;
        this.userId = user_id;
        this.username = username;
        this.video_url = video_url;

        this.#assignmentDOM = new Assignment();
        this.#quizDOM = new QuizBuilder();
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
        this.#withVideo(video => {
            if (!this.#active) return; // moved out of view while waiting
            video.play().catch(error => console.warn('Could not autoplay video:', error));
        });
    }

    // Pause and rewind so it starts from the beginning next time it's shown
    stopVideo() {
        this.#active = false;
        this.#withVideo(video => {
            if (this.#active) return; // became current again while waiting
            video.pause();
            video.currentTime = 0;
        });
    }

    render() {
        this.innerHTML = `
            <div
                 style="width: ${this.#width}px; height: ${this.#height}px;">

                <video-element
                    width="${this.#width}"
                    height="${this.#height}"
                    url="${this.video_url}"
                ></video-element>

                <div class="position-absolute" style="bottom: 30px; right: 0;">
                    <video-side-navbar video-id="${this.id}"></video-side-navbar>
                </div>

                <div class="position-absolute" style="bottom: 0; left: 0;">
                    <details class="text-white">
                        <summary>
                            <h2>${this.username}</h2>
                            <h3>${this.title}</h3>
                        </summary>
                        <p>${this.description}</p>
                        <ul class="list-unstyled d-flex flex-wrap gap-2 m-0">
                            ${this.tags.map(tag => `<li class="border rounded px-2">${tag}</li>`).join('')}
                        </ul>
                    </details>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        // each container is stacked on top of the others and moved with transform
        this.style.position = 'absolute';
        this.style.top = '0';
        this.style.left = '0';
        this.style.width = `${this.#width}px`;
        this.style.height = `${this.#height}px`;
        this.render();
    }

    // Removed from the DOM (e.g. on filter change): detached videos can keep playing audio
    disconnectedCallback() {
        this.stopVideo();
    }
}

customElements.define('video-container', VideoContainer);