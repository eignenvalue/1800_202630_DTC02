
class Video extends HTMLElement {
    #url;

    constructor() {
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
            <video src="${this.#url}" width="" height="">
            
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

customElements.define('video-with-url', Video);