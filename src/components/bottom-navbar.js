import "bootstrap-icons/font/bootstrap-icons.css";
import { navigationItems, isCurrentPage } from './navigation-items.js';

class BottomNavbar extends HTMLElement {

    /** A private reference to the ResizeObserver. */
    #observer = null;

    /**
     * 
     */
    connectedCallback() {
        this.innerHTML = `
            <nav class="navbar navbar-dark bg-dark fixed-bottom bottom-navbar"
                 style="padding-bottom: env(safe-area-inset-bottom, 0px); z-index: 1030;"
                 aria-label="Main navigation">
                <div class="container-fluid d-flex justify-content-around flex-nowrap px-0"
                     style="max-width: 480px;">
                    ${navigationItems.map(item => `
                        <a href="${item.href}"
                           class="nav-link flex-fill text-center text-white ${isCurrentPage(item.href) ? 'fw-bold' : ''}"
                           ${isCurrentPage(item.href) ? 'aria-current="page"' : ''}>
                            <i class="bi ${item.icon} fs-4 d-block"></i>
                            <small>${item.label}</small>
                        </a>`).join('')}
                </div>
            </nav>
        `;

        // Publish the real height (including safe-area padding) so the feed can subtract it
        const nav = this.querySelector('nav');
        const publish = () =>
            document.documentElement.style.setProperty('--bottom-nav-height', `${nav.offsetHeight}px`);

        publish();
        this.#observer = new ResizeObserver(publish);
        this.#observer.observe(nav);
    }

    disconnectedCallback() {
        this.#observer?.disconnect();
        document.documentElement.style.removeProperty('--bottom-nav-height');
    }
}

customElements.define("bottom-navbar", BottomNavbar);
