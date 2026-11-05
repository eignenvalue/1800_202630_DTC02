class ObservableElement extends HTMLElement {
    static get observedAttributes() {
        return this.observedAttributes;
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


class VideoElement extends HTMLElement {

    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['url', 'width', 'height'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    get width() {
        return this.getAttribute('width');
    }

    get height() {
        return this.getAttribute('height');
    }

    get url() {
        return this.getAttribute('url');
    }

    set url(value) {
        this.setAttribute('url', value);
    }

    render() {
        this.innerHTML = `
            <video width="${this.width}px" height="${this.height}px" class="bg-black" loop autoplay muted>
                <source src="/videos/${this.url}" type="video/webm"/>
                Video not available.
            </video>
        `;
    }

    connectedCallback() {
        this.render();
    }

}

customElements.define('video-element', VideoElement);