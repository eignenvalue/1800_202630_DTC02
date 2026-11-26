/**
 * The VideoElement displays a video of any size (possibly with black bars),
 * and will expand to any size of parent element.
 * 
 * The video element leaves all of its controls to parent elements. 
 * 
 * @extends HTMLElement
 */
class VideoElement extends HTMLElement {

    /**
     * Returns a list of attributes to be observed for changes.
     * 
     * Define observedAttributes, a lifecycle method that is used as a callback
     * to get an array of all the attributes that should be observed.
     * 
     * Static class methods are available to use even without instantiating an 
     * instance of the class. 
     * 
     * @public
     * @returns {Array<string>}
     */
    static get observedAttributes() {
        return ['url', 'width', 'height'];
    }

    /**
     * Re-render this element if an attribute has changed.
     * 
     * Will be called for the attributes defined in {@link observedAttributes}.
     * 
     * @param {string} name the name of the attribute
     * @param {String | null} oldValue the old attribute value
     * @param {String | null} newValue the new attribute value
     * @public
     * @returns {void}
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    /**
     * The width of the video as a string.
     * 
     * @public
     */
    get width() {
        return this.getAttribute('width');
    }

    /**
     * The current height of the video as a string.
     * 
     * @public
     */
    get height() {
        return this.getAttribute('height');
    }

    /**
     * Get the current video filename with the extension.
     * 
     * @public
     */
    get url() {
        return this.getAttribute('url');
    }

    /**
     * The current video filename with the .webm extension.
     * 
     * This file must exist in /public/videos/ in order for it to be played on the site.
     * 
     * @public
     * @type {String}
     */
    set url(value) {
        this.setAttribute('url', value);
    }

    /**
     * Render a video element with the current URL.
     * 
     * @public
     * @returns {void}
     */
    render() {
        // fill whatever box the parent gives us
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%';

        // object-fit: contain shows the whole frame (black bars if the aspect
        // ratio differs); playsinline is essential on iOS (tells browser to 
        // play the video inside its designated element rather than automatically 
        // expand to fullscreen)
        this.innerHTML = `
            <video class="bg-black" loop playsinline preload="auto"
                   style="display: block; width: 100%; height: 100%; object-fit: contain;">
                <source src="/videos/${this.url}" type="video/webm"/>
                Video not available.
            </video>
        `;
    }

    /**
     * Render the element using {@link render}.
     * 
     * @public
     * @return {void}
     */
    connectedCallback() {
        this.render();
    }

}

// Register the custom element with the CustomElementRegistry.
customElements.define('video-element', VideoElement);
