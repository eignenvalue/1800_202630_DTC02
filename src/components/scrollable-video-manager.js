// Video element that can be scrolled
// with mwheeldown/mwheelup or touch
// events over 100px long
class ScrollableVideoManager extends HTMLElement {

    #queue;
    #queuePosition;
    #page;

    constructor() {
        super();
        this.#queue = [] // use set so no repeat urls
        this.#queuePosition = 0
        this.#page = 0

        this.#queue = [];
    }


    async loadQueueByPage() {
        try {
            // ... use fetch API to fetch video urls
            // to create the queue

            /*
            const response = await fetch('https://www..com', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page: this.#page
                }),
                credentials: 'include',
            });

            if (response.status != 200) {
                // error on server
            }

            const data = await response.json();

            if (!data.status) {
                // error in query
            }

            return data.videoQueue;
            */

            return [
                '/videos/1.webm',
                '/videos/2.webm',
                '/videos/3.webm',
                '/videos/4.webm',
                '/videos/5.webm',
                '/videos/6.webm',
                '/videos/7.webm',
                '/videos/8.webm',
            ]
        } catch (error) {
            // don't console.error(error);

            /* handle the error */
        } finally {
            console.log('request complete')
        }
    }

    /*
    getQueuePosition() {
        return this.#queuePosition;
    }

    setQueuePosition(queuePosition) {
        this.#queuePosition = queuePosition;
    }
    */

    handleChangeQueuePosition() {

    }

    #increaseQueuePosition() {
        this.#queuePosition++;
    }

    #decreaseQueuePosition() {
        if (this.#queuePosition > 0) {
            this.#queuePosition--;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render(); // not defined, change when ready
        }
    }

    #handleMWheelDown() {


    }

    #handleMWheelUp() {

    }

    #handleTouchDrag() {


        // use switch for direction
    }

    async render() {
        if (this.#queue.length == 0) {
            await this.loadQueueByPage(this.#page)
        }

        this.innerHTML = `
            <div class="">
                <video-container url="${this.#queue[this.#queuePosition]}"></video-container>
            </div>
        `;

        this.addEventListener('mwheeldown', this.#handleMWheelDown);
        this.addEventListener('mwheelup', this.#handleMWheelUp);

        // do a click listener (or nothing cause details/summary) on the
        // description section keep it above the video
        this.addEventListener('touch', this.#handleTouchDrag);
    }

    connectedCallback() {
        this.render();
    }
}

customElements.define('scrollable-video-manager', ScrollableVideoManager);