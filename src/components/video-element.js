
class VideoElement extends HTMLElement {
    #url;

    static get observedAttributes() {
        return ['url'];
    }

    constructor() {
        super();
        this.#url = undefined;
    }

    setUrl(url) {
        this.#url = url;
    }

    getUrl() {
        return this.#url;
    }

    render() {
        this.innerHTML = `
            <video width="400px" height="800px" controls>
                <source src="${this.#url}" type="video/webm"/>
                Video not available.
            </video>
        `;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
    }

}

customElements.define('video-element', VideoElement);