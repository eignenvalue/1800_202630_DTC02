class VideoSideNavbarAnchor extends HTMLElement {
    static get observedAttributes() {
        return ['icon', 'label', 'url', 'action', 'active', 'disabled', 'count'];
    }

    get icon() { return this.getAttribute('icon') || 'bi-0-circle-fill'; }
    get label() { return this.getAttribute('label') || ''; }
    get url() { return this.getAttribute('url'); }
    get action() { return this.getAttribute('action'); }
    get active() { return this.hasAttribute('active'); }
    get disabled() { return this.hasAttribute('disabled'); }
    get count() { return this.getAttribute('count'); }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.renderIcon();
        }
    }

    connectedCallback() {
        this.renderIcon();
    }

    renderIcon() {
        const iconClasses = `bi fs-3 ${this.icon} ${this.active ? 'text-danger' : 'text-white'}`;
        const count = this.count === null
            ? ''
            : `<span class="video-nav-count" aria-label="${this.count} likes">${this.count}</span>`;
        const content = `
            <i class="${iconClasses}" aria-hidden="true"></i>
            ${count}
            <span>${this.label}</span>
        `;

        this.innerHTML = `
            <li class="mb-3">
                ${this.action
                    ? `<button type="button"
                            class="video-nav-action d-flex flex-column align-items-center text-center text-white text-decoration-none bg-transparent border-0 p-0"
                            aria-label="${this.label}"
                            aria-pressed="${this.active}"
                            ${this.disabled ? 'disabled aria-busy="true"' : ''}>${content}</button>`
                    : `<a class="d-flex flex-column text-center text-white text-decoration-none"
                            href="${this.url || '#'}" rel="noreferrer noopener">${content}</a>`
                }
            </li>
        `;

        this.querySelector('button')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('video-nav-action', {
                bubbles: true,
                detail: { action: this.action },
            }));
        });
    }
}

customElements.define('video-side-navbar-anchor', VideoSideNavbarAnchor);
