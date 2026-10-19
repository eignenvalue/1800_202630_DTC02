
class VideoElement extends HTMLElement {

    static get observedAttributes() {
        return ['url'];
    }

    constructor() {
        super();
    }

    render() {
        this.innerHTML = `
            <video width="400px" height="800px" class="bg-black" loop autoplay muted controls>
                <source src="${this.url}" type="video/webm"/>
                Video not available.
            </video>
        `;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    get url() {
        return this.getAttribute('url');
    }

    connectedCallback() {
        this.render();
    }

}

customElements.define('video-element', VideoElement);