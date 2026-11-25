import "bootstrap-icons/font/bootstrap-icons.css";
import { navigationItems, isCurrentPage } from './navigation-items.js';

/**
 * The BottomNavbar is a component intended for the mobile view of LearnTok.
 * 
 * It adds a global stylesheet property called '--bottom-nav-height' that is
 * intended to tell other components the current height of the bottom navbar
 * 
 * This value will be automatically updated by the component as the program
 * progresses.
 * 
 * The global element is intended to be utilized by the ScrollableVideoManager
 * so that the videos are not overlapped by the navbar.
 * 
 * @extends HTMLElement
 */
class BottomNavbar extends HTMLElement {

    /** A private reference to the ResizeObserver. */
    #observer = null;

    /**
     * This connectedCallback call sets up a few things:
     * 1) Creates the HTML structure for the BottomNavbar so that there is content, and 
     *    sets it to this elements innerHTML.
     * 2) Runs a query selector looking for the first <nav> inside this element, which
     *    should be the nav that is placed in (1).
     * 3) Creates a ResizeObserver to watch for geometrical changes in the <nav>
     * 4) Calls publish() to initially add the '--bottom-nav-height' to the CSS properties
     * 
     * @public
     * @returns {void}
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

        /**
         * Update the global style property '--bottom-nav-height' to be the current <nav> offsetHeight.
         * 
         * @returns {void}
         */
        const publish = () =>
            document.documentElement.style.setProperty('--bottom-nav-height', `${nav.offsetHeight}px`);

        // Run publish to initiate '--bottom-nav-height' property state!
        publish();

        /** Create a new ResizeObserver with publishas the callback function */
        this.#observer = new ResizeObserver(publish);

        /** Tell the observer to observe the <nav> element. 
         *  Note: the ResizeObserver can observe any number of elements. */
        this.#observer.observe(nav);
    }

    /**
     * The disconnectedCallback is a part of the Lifecycle methods for HTMLElements,
     * it runs every time this element is removed from the DOM.
     * 
     * In this method:
     * 1) The optional chaining operator is used to see if an #observer is available to be disconnected
     *    using .disconnect()
     * 2) The style property '--bottom-nav-height' is removed from the documents styles, mutating global state.
     * 
     * @public
     * @returns {void}
     */
    disconnectedCallback() {
        this.#observer?.disconnect();
        document.documentElement.style.removeProperty('--bottom-nav-height');
    }
}

// Register the custom element with the CustomElementRegistry.
customElements.define("bottom-navbar", BottomNavbar);
