import 'bootstrap-icons/font/bootstrap-icons.css';
import { navigationItems, isCurrentPage } from './navigation-items.js';

/**
 * Create a user-facing desktop sidebar that allows the user to access
 * the home/video page, and the profile page, where the LearnTok logo is 
 * also a link to the home/video page.
 *
 * @extends HTMLElement 
 */
class DesktopNavbar extends HTMLElement {

    /**
     * Mutates global state of document.body to add a class that creates a more
     * visually appealing layout for the user (more specifically, adding 220px 
     * padding-left to the body).
     * 
     * @public
     * @returns {void}
     */
    connectedCallback() {
        document.body.classList.add('has-desktop-navbar');

        this.innerHTML = `
            <aside class="desktop-sidebar" aria-label="Desktop navigation">
                <a class="desktop-brand" href="/">
                    <i class="bi bi-mortarboard-fill" aria-hidden="true"></i>
                    <span>Learn Tok</span>
                </a>
                <nav class="d-flex flex-column gap-2">
                    ${navigationItems.map(item => `
                        <a class="desktop-nav-link ${isCurrentPage(item.href) ? 'active' : ''}"
                           href="${item.href}"
                           ${isCurrentPage(item.href) ? 'aria-current="page"' : ''}>
                            <i class="bi ${item.icon}" aria-hidden="true"></i>
                            <span>${item.label}</span>
                        </a>`).join('')}
                </nav>
            </aside>`;
    }

    /**
     * Remove the class that adds 220px padding the body.
     * 
     * This disconnectedCallback will be called if the element is removed,
     * but the element would only be removed if the screen size has changed,
     * either because of the user changing their screen-orientation or 
     * resizing the browser window
     * 
     * @public
     * @returns {void}
     */
    disconnectedCallback() {
        document.body.classList.remove('has-desktop-navbar');
    }
}

// Register the custom element with the CustomElementRegistry.
customElements.define('desktop-navbar', DesktopNavbar);
