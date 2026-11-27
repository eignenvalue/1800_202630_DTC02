/**
 * The VideoSideNavbarAnchor element is intended to be used by a VideoSideNavbar, 
 * which is listenning for 'video-nav-action' events from it's children.
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
     * Render the icon initially by calling {@link renderIcon}
     * 
     * @public
     * @returns {void}
     */
    connectedCallback() {
        this.renderIcon();
    }

    /**
     * Dynamically render the icon based on the elements attributes.
     * 
     * Adds an event listener if a button must be added for the intended
     * action type.
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

    /**
     * Cleanup a potential button event listener.
     * 
     * @public
     * @returns {void}
     */
    disconnectedCallback() {
        const buttonAvailable = this.querySelector('button');
        if (buttonAvailable) {
            buttonAvailable.removeEventListener('click', this.sendVideoNavActionEvent);
        }
    }

    /**
     * Prevent any default behaviour of the button and call {@link sendVideoNavAction}
     * to dispatch a custom event.
     * 
     * @param {Event} event the event object describing the users click
     * @public
     * @returns {void}
     */
    sendVideoNavActionEvent(event) {
        event.preventDefault();
        this.sendVideoNavAction();
    }

    /**
     * Dispatch a 'video-nav-action' event that includes details
     * about the action the user would like to take.
     * 
     * The event must be caught and handled by a parent.
     * 
     * {@link VideoSideNavbarAnchor} will not try to do the action at all.
     * 
     * @public
     * @returns {void}
     */
    sendVideoNavAction() {
        this.dispatchEvent(new CustomEvent('video-nav-action', {
            bubbles: true,
            detail: { action: this.action },
        }));
    }
}

// Define the custom element with CustomElementRegistry.
customElements.define('video-side-navbar-anchor', VideoSideNavbarAnchor);
