// Video element that can be scrolled
// with mwheeldown/mwheelup or touch
// events over 100px long
class VideoContainer extends HTMLElement {

    #width;
    #height;

    constructor(width = 400, height = 800) {
        super();

        this.#width = width;
        this.#height = height;
    }

    static get observedAttributes() {
        return ['id', 'url', 'creatorName', 'creatorId', 'title', 'description'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render(); // not defined, change when ready
        }
    }

    // write get s and it'll work :)
    // then finish styling and add the fake filters
    get id() {
        return this.getAttribute('id');
    }

    get url() {
        return this.getAttribute('url');
    }

    get creatorName() {
        return this.getAttribute('creatorName');
    }

    get creatorId() {
        return this.getAttribute('creatorId');
    }

    get title() {
        return this.getAttribute('title');
    }

    get description() {
        return this.getAttribute('description');
    }

    render() {
        this.innerHTML = `
            <div class="overflow-hidden position-relative height-max-content width-max-content">
                
                <video-element 
                    width="${this.#width}"
                    height="${this.#height}"
                    url="${this.url}"
                ></video-element>

                <div class="position-absolute" style="bottom: 30px; right: 0;">
                    <video-side-navbar videoId="${this.id}"></video-side-navbar>
                </div>

                <div class="position-absolute" style="bottom: 0; left: 0;">
                    <!-- move into component -->
                    <details class="text-white ">
                        <summary>
                            <h2>${this.creatorName}<h2>
                            <h3>${this.title}</h3>
                        </summary>
                        <p>${this.description}</p>
                    </details>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        this.render();
    }
}

customElements.define('video-container', VideoContainer);