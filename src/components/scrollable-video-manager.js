import { db } from '/src/firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';

// Video element that can be scrolled
// with mwheeldown/mwheelup or touch
// events over 100px long

import { app } from '/src/firebaseConfig.js';
import { getFirestore } from 'firebase/firestore';
const db = getFirestore(app);

import {
    doc, collection, getDoc, getDocs,
    onSnapshot, setDoc, addDoc, updateDoc,
    deleteDoc, deleteField
} from "firebase/firestore";

class ScrollableVideoManager extends HTMLElement {

    #queue;
    #queuePosition;
    #page;
    #width;
    #height;
    #loadError;

    // Firebase related variables
    #collection;

    constructor(width = 400, height = 800) {
        super();
        this.#queue = [] // use set so no repeat urls
        this.#queuePosition = 0;
        this.#page = 0;

        this.#width = width;
        this.#height = height;
        this.#loadError = '';

        this.#queue = [];
    }

    async loadQueueByPage() {
        try {
            // ... use fetch API to fetch video urls
            // to create the queue
            // this.#page

            // const data = getDoc(usersRef, );

            // return data;

            let thing = [
                {
                    id: 0,
                    url: '5.webm',
                    creatorName: 'user0',
                    creatorId: 0,
                    title: 'this is the title',
                    description: 'this is the description'
                },
                {
                    id: 1,
                    filename: '1.webm',
                    username: 'user1',
                    user_id: 1,
                    title: 'this is the title',
                    description: 'this is the description'
                },
                {
                    id: 2,
                    url: '/videos/2.webm',
                    creatorName: 'user2',
                    creatorId: 2,
                    title: 'this is the title',
                    description: 'this is the description'
                },
            ]
            
            const videosSnapshot = await getDocs(collection(db, 'videos'));
            this.#loadError = '';

            return videosSnapshot.docs.map((videoDocument) => {
                const video = videoDocument.data();

                return {
                    // Firestore's real document ID is required by the like button.
                    id: videoDocument.id,
                    url: video.video_url || video.url || '',
                    creatorName: video.username || 'Unknown creator',
                    creatorId: video.user_id || '',
                    title: video.title || 'Untitled video',
                    description: video.description || '',
                };
            });
        } catch (error) {
            console.error('Could not load videos from Firestore:', error);
            this.#loadError = 'Videos could not be loaded. Check your Firestore permissions and try again.';
            return [];
        } finally {
            console.log('request complete');
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

    #handleMWheelDown(event) {

    }

    #handleMWheelUp(event) {

    }

    #handleTouchDrag(event) {


        // use switch for direction
    }


    /*

    To create the intended scrolling functionality (like 2 or more videos)
    I need 3 video elements always on the DOM.

    like so

    - <-- this is the last video in the queue
    - <-- this is the only visible part of the dom in the video player.
    - <-- this is the next video in the queue

    when the user scrolls the current video up or down to go back or forward
    the video coming in should be locked to the top of bottom of the current
    video.



    */

    async render() {
        if (this.#queue.length == 0 || this.#queue.length - 1 == this.#queuePosition) {
            this.#queue = await this.loadQueueByPage(this.#page)
            this.#page++;
        }

        const pastVideoInfo = this.#queue[this.#queuePosition - 1] || {}
        if (this.#queue.length === 0) {
            this.innerHTML = `
                <div class="alert alert-warning m-3" role="alert">
                    ${this.#loadError || 'No videos have been uploaded yet.'}
                </div>
            `;
            return;
        }

        const currentVideoInfo = this.#queue[this.#queuePosition];

        this.innerHTML = `
            <div class="position-relative width-max-content overflow-hidden">
            
                <video-container 
                    id="${currentVideoInfo?.id || ""}"
                    url="${currentVideoInfo?.url || ""}"
                    creatorName="${currentVideoInfo.creatorName || ""}"
                    creatorId="${currentVideoInfo.creatorId || ""}"
                    title="${currentVideoInfo.title || ""}"
                    description="${currentVideoInfo.description || ""}"
                    width="${this.#width}"
                    height="${this.#height}"
                ></video-container>

                <div class="position-absolute" style="top: 20px; left: 10px;">
                    <video-filters videoElementWidth="${this.#width}"></video-filters>
                </div>
            </div>
        `;

        this.addEventListener('mwheeldown', this.#handleMWheelDown);
        this.addEventListener('mwheelup', this.#handleMWheelUp);

        // could also do drag using pointer events (for both kbm and mobile)
        // as well as mwheelup/down

        // do a click listener (or nothing cause details/summary) on the
        // description section keep it above the video
        this.addEventListener('touch', this.#handleTouchDrag);
    }

    connectedCallback() {
        this.render();
    }
}

customElements.define('scrollable-video-manager', ScrollableVideoManager);
