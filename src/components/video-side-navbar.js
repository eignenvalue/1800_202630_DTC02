class VideoSideNavbar extends HTMLElement {
    /*
    FUTURE: Receive bubbled events dispatched from 
    video-side-navbar-anchor elements for actions 
    such as like and share, where as assignment and
     quiz will act as regular anchors. 
    */

    // Render the navbar with all elements.
    connectedCallback() {
        this.innerHTML = `
            <nav>
                <ul class="list-unstyled d-inline-block bg-danger">
                    <video-side-navbar-anchor label="Like" icon="bi-heart" url="/like"></video-side-navbar-anchor>
                    <video-side-navbar-anchor label="Share" icon="bi-share" url=""></video-side-navbar-anchor> 
                    <video-side-navbar-anchor label="Assignment" icon="bi-envelope" url=""></video-side-navbar-anchor>
                    <video-side-navbar-anchor label="Quiz" icon="bi-question" url=""></video-side-navbar-anchor>
                </ul>
            </nav>
        `;
    }
}

customElements.define('video-side-navbar', VideoSideNavbar);
