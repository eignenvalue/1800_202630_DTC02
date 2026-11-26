/**
 * 
 * 
 * @extends HTMLElement
 */
class VideoSideNavbarAnchor extends HTMLElement {

    /** @type {string} @public */
    get icon() { return this.getAttribute('icon') || 'bi-0-circle-fill'; }

    /** @type {string} @public */
    get label() { return this.getAttribute('label') || ''; }

    /** @type {string} @public */
    get url() { return this.getAttribute('url'); }

    /** @type {string} @public */
    get action() { return this.getAttribute('action'); }

    /** @type {string} @public */
    get active() { return this.hasAttribute('active'); }

    /** @type {string} @public */
    get disabled() { return this.hasAttribute('disabled'); }

    /** @type {string} @public */
    get count() { return this.getAttribute('count'); }

    /** @type {string} @public */
    get badge() { return this.getAttribute('badge'); }

    /**
     * Returns a list of attributes to watch for changes. 
     * 
     * @public
     * @returns {Array<string>}
     */
    static get observedAttributes() {
        return ['icon', 'label', 'url', 'action', 'active', 'disabled', 'count', 'badge'];
    }

    /**
     * If an attribute related to the anchor changes then the element will be re-rendered.
     * 
     * @param {string} name the name of the attribute that has changed
     * @param {string | null} oldValue the old value of the attribute as a string or null
     * @param {string | null} newValue the new value of the attribute as a string or null
     * @public
     * @returns {void} 
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.renderIcon();
        }
    }

    /**
     * Render the icon initially
     * 
     * @public
     * @returns {void}
     */
    connectedCallback() {
        this.renderIcon();
    }

    /**
     * 
     * 
     * @public
     * @returns {void}
     */
    renderIcon() {
        const iconClasses = `bi fs-3 ${this.icon} ${this.active ? 'text-danger' : 'text-white'}`;
        const count = this.count === null ? '' : `<span class="video-nav-count" aria-label="${this.count} likes">${this.count}</span>`;
        const content = `
            <span class="position-relative">
                <i class="${iconClasses}" aria-hidden="true"></i>
                ${this.badge ? `<span class="position-absolute top-0 start-100 translate-middle">${this.badge}</span>` : ''}
                </span>
                ${count}
            <span>${this.label}</span>
        `;

        this.innerHTML = `
            <li class="mb-3">
                ${this.action ? `<button type="button"
                    class="video-nav-action d-flex flex-column align-items-center text-center text-white text-decoration-none bg-transparent border-0 p-0" 
                    aria-label="${this.label}"
                    aria-pressed="${this.active}"
                    ${this.disabled ? 'disabled aria-busy="true"' : ''}>${content}
                </button>` : `<a class="d-flex flex-column text-center text-white text-decoration-none" 
                    href="${this.url || '#'}" 
                    rel="noreferrer noopener">${content}
                </a>`}
            </li>
    `;

        // Only the button is query selected because the anchor element acts as a hyperlink.
        const buttonAdded = this.querySelector('button');
        if (buttonAdded) {
            buttonAdded.addEventListener('click', this.sendVideoNavActionEvent.bind(this))
        }
    }

    disconnectedCallback() {
        const buttonAvailable = this.querySelector('button');
        if (buttonAvailable) {
            buttonAvailable.removeEventListener('click', this.sendVideoNavActionEvent);
        }
    }

    sendVideoNavActionEvent(event) {
        event.preventDefault();
        this.sendVideoNavAction();
    }

    sendVideoNavAction() {
        this.dispatchEvent(new CustomEvent('video-nav-action', {
            bubbles: true,
            detail: { action: this.action },
        }));
    }
}

customElements.define('video-side-navbar-anchor', VideoSideNavbarAnchor);
