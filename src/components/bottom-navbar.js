import "bootstrap-icons/font/bootstrap-icons.css";

class BottomNavbar extends HTMLElement {
    #observer = null;

    connectedCallback() {
        this.innerHTML = `
            <nav class="navbar navbar-dark bg-dark fixed-bottom bottom-navbar"
                 style="padding-bottom: env(safe-area-inset-bottom, 0px); z-index: 1030;"
                 aria-label="Main navigation">
                <div class="container-fluid d-flex justify-content-around flex-nowrap px-0"
                     style="max-width: 480px;">
                    <a href="main.html" class="nav-link flex-fill text-center text-white">
                        <i class="bi bi-house-fill fs-4 d-block"></i>
                        <small>Home</small>
                    </a>

                    <a href="messages.html" class="nav-link flex-fill text-center text-white">
                        <i class="bi bi-chat-dots fs-4 d-block"></i>
                        <small>Messages</small>
                    </a>

                    <a href="liked.html" class="nav-link flex-fill text-center text-white">
                        <i class="bi bi-heart-fill fs-4 d-block"></i>
                        <small>Liked</small>
                    </a>

                    <a href="/profile" class="nav-link flex-fill text-center text-white">
                        <i class="bi bi-person-circle fs-4 d-block"></i>
                        <small>Profile</small>
                    </a>
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