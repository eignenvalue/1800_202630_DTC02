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
        // fill whatever box the parent gives us
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%';

        // object-fit: contain shows the whole frame (black bars if the aspect
        // ratio differs); playsinline is essential on iOS
        this.innerHTML = `
            <video class="bg-black" loop autoplay muted playsinline preload="auto"
                   style="display: block; width: 100%; height: 100%; object-fit: contain;">
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