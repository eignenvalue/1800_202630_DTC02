// Video element that can be scrolled
// with mwheeldown/mwheelup or touch
// events over 100px long

class ScrollableVideoManager extends HTMLElement {

    #queue;
    #queuePosition;
    #page;
    #currentVideo;

    super() {
        this.#queue = Set(); // use set so no repeat urls
        this.#queuePosition = 0
        this.#page = 0
        this.#currentVideo = '';

        this.#loadQueueByPage(this.#page)
    }

    #loadQueueByPage() {
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
                'https://www..com/video0.mp4',
                'https://www..com/video1.mp4',
                'https://www..com/video2.mp4',
                'https://www..com/video3.mp4',
                'https://www..com/video4.mp4',
                'https://www..com/video5.mp4',
                'https://www..com/video6.mp4',
                'https://www..com/video7.mp4',
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

    render() {
        this.innerHTML = `
            <div>
                
                <!-- Keep in background -->
                <video-with-url url="${this.#currentVideo}"></video-with-url>
            
                <video-side-navbar></video-side-navbar>

                <!-- Video title/description -->
                <!-- Create a class for description (to hide summary title and whatnot) -->
                <details>
                    <summary>
                        <h1>this is a video title</h1>
                    </summary>
                    <h1>This is a video title</h1>
                    <p>This is a video description</p>
                </details>
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

customElements.define('scrollable-video', ScrollableVideoManager);