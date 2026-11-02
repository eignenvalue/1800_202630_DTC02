class VideoSideNavbarAnchor extends HTMLElement {
    
    // Arguments the element accepts:
    static get observedAttributes() {
        return ['icon', 'label', 'url'];
    }

    // Re-render if items change (not really useful here).
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.renderIcon();
        }
    }

    // Use fallbacks if the attributes are not specified.
    get icon() { return this.getAttribute('icon') || 'bi-0-circle-fill'; }
    get label() { return this.getAttribute('label') || 'Like'; }
    get url() { return this.getAttribute('url') || '#' } // '#' cause don't make people like random videos

    // Render the icon (use seperate function so 
    // that you can rerender from other methods in class)
    connectedCallback() {
        this.renderIcon();
    }

    // Need an eventListener for 'click' on any of these nav elements.
    // Each should have a callback function for something else that needs to happen.
    // For instance 'like' will not lead anywhere, it will just add a like to the video
    // so we need to tell firebase that.

    // use dispatchEvent to send events for 'like', 'share' and event bubbling to get
    // the infomration to the parent (VideoSideNavbar) which will decide what to do with it.

    // Render the element and attach event listeners
    renderIcon() {
        this.innerHTML = `
            <li class="mb-3">
                <a class="d-flex flex-column text-center text-white text-decoration-none" href="${this.url}" rel="noreferrer noopener">
                    <!-- icon -->
                    <i class="bi fs-3 ${this.icon}"></i>    
                    
                    <!-- label -->
                    <span class="">${this.label}</span>
                </a>
            </li>
        `;

        this.addEventListener('click', () => console.log('works'));
    }
}

customElements.define('video-side-navbar-anchor', VideoSideNavbarAnchor);
