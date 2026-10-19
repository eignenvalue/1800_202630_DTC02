class VideoSideNavbar extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['video-id'];
    }

    get videoId() {
        return this.getAttribute('videoId');
    }

    set videoId(value) {
        this.setAttribute('videoId', value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Only re-render after the element is in the DOM
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    render() {
        const id = encodeURIComponent(this.videoId);

        this.innerHTML = `
            <nav>
                <ul class="list-unstyled d-inline-block">
                    <video-side-navbar-anchor label="Like" icon="bi-heart" url="#"></video-side-navbar-anchor>
                    <video-side-navbar-anchor label="Share" icon="bi-share" url="#"></video-side-navbar-anchor>
                    <video-side-navbar-anchor label="Assignment" icon="bi-envelope" url="/assignment.html?id=${id}"></video-side-navbar-anchor>
                    <video-side-navbar-anchor label="Quiz" icon="bi-question" url="/quiz.html?id=${id}"></video-side-navbar-anchor>
                </ul>
            </nav>
        `;
    }

    connectedCallback() {
        this.render();
    }
}

customElements.define('video-side-navbar', VideoSideNavbar);