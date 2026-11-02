import "bootstrap-icons/font/bootstrap-icons.css";

class BottomNavbar extends HTMLElement {
    constructor() {
        super();

        this.innerHTML = `
            <nav class="navbar navbar-dark bg-dark fixed-bottom bottom-navbar" aria-label="Main navigation">
                <div class="container-fluid d-flex justify-content-around flex-nowrap px-0">
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
    }
}

customElements.define("bottom-navbar", BottomNavbar);
