// Video element that can be scrolled
// with mwheeldown/mwheelup or touch
// events over 100px long
class VideoContainer extends HTMLElement {

    static get observedAttributes() {
        return ['url'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render(); // not defined, change when ready
        }
    }

    get url() {
        return this.getAttribute('url');
    }

    render() {
        this.innerHTML = `
            <div class="position-relative height-max-content width-max-content">
                
                <!-- Keep in background -->
                <!-- Initial Video -->
                <video-element url="${this.url}"></video-element>
            
                <div class="position-absolute" style="bottom: 30px; right: 0;">
                    <video-side-navbar></video-side-navbar>
                </div>
                
                <!-- Video title/description -->
                <!-- Create a class for description 
                     (to hide summary title when 
                     details visible and whatnot) -->
                <div class="position-absolute" style="bottom: 0; left: 0;">
                    <details>
                        <summary>
                            <h1>this is a video title</h1>
                        </summary>
                        <h1>This is a video title</h1>
                        <p>This is a video description</p>
                    </details>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        this.render();
    }
}

customElements.define('video-container', VideoContainer);