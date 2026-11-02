class VideoFilter extends HTMLElement {
    #filter;

    constructor(filter) {
        super();
        this.#filter = filter;
    }
}

customElements.define('video-filter', VideoFilter);