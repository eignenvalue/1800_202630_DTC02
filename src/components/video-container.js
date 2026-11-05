import { QuizBuilder } from "../quiz-builder";
import { Assignment } from "./assignment";

export class VideoContainer extends HTMLElement {

    #width;
    #height;
    #assignmentDOM;
    #quizDOM;
    #hide;

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
}

customElements.define('video-container', VideoContainer);