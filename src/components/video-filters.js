/**
 * Display available filters the user in a scrollable element, where more filters
 * can be revealed by scrolling to the left.
 * 
 * When a filter is clicked on it highlighted so that the user can see what filters
 * they have selected at all times.
 * 
 * When a filter is clicked on a custom 'video-filters-change' event is fired
 * with bubbling, and the expectation is that a parent element that contains 
 * VideoFilters is ready to handle it.
 * 
 * Event listeners defined inside this class are not explicitly cleaned up
 * with disconnectedCallback when the element is removed from the DOM. This 
 * is 'okay' as the lifetime of the element is the lifetime of the home/video 
 * page.
 * 
 * @extends HTMLElement
 */
class VideoFilters extends HTMLElement {

    /** 
     * Must match the strings stored in each video's `tags` array so that
     * the user can select from all available filters.
     * 
     * The video's tags array would be defined by a creator upload form, but
     * since we did not get around to 'creators', this is the only definition
     * of the filters.
     */
    #filters = [
        { title: 'Science', icon: 'bi-flask' },
        { title: 'Math', icon: 'bi-calculator' },
        { title: 'Art', icon: 'bi-palette' },
        { title: 'Technology', icon: 'bi-cpu' },
        { title: 'Graphic Design', icon: 'bi-vector-pen' },
        { title: 'Programming', icon: 'bi-code-slash' },
        { title: 'Engineering', icon: 'bi-gear' }
    ];

    #selected = new Set();

    /**
     * The starting point of the scroll on the X axis.
     * 
     * @type {number}
     */
    #dragStartX = 0;

    /**
     * Will eventually be defined as the distance that the 'video-filters-scroller'
     * has been scrolled left from it's edge at the moment of the user caused the
     * 'pointerdown' event.
     * 
     * @type {number}
     */
    #dragStartScroll = 0;

    /**
     * Track whether the pointer is down or not (i.e. user is clicking with 
     * mouse or tapping/pressing with finger).
     * 
     * @type {boolean} true if it is down, false otherwise
     */
    #pointerIsDown = false;

    /**
     * Track whether the user recently dragged or if it was perhaps instead 
     * a click.
     * 
     * @type {boolean} true if the user did drag, false otherwise
     */
    #didDrag = false;

    /**
     * Get the users currently selected filters.
     * 
     * @public
     * @type {Array<string>}
     */
    get selectedFilters() {
        return [...this.#selected];
    }

    /**
     * Dispatch a 'video-filters-change' event containing the currently
     * selected filters.
     * 
     * The selected filters are expected to have been updated by
     * another method in this element.
     * 
     * composed: true allows the event to escape the Shadow DOM in the case
     * that it is included as a child of another components Shadow DOM.
     * 
     * The shadow DOM is isolated HTML and CSS that only applies to the 
     * element whos shadow DOM it is included in.
     * 
     * @public
     * @returns {void}
     */
    dispatchUpdateEvent() {
        this.dispatchEvent(new CustomEvent('video-filters-change', {
            detail: { filters: this.selectedFilters },
            bubbles: true,
            composed: true,
        }));
    }

    /**
     * Toggle a filter on/off.
     * 
     * This function does a few things:
     * 1) Gets the name of the filter from the {@link chip}'s dataset.
     * 2) Creates a new URL with window.location and either removes or
     *    attaches the filter depending on if it was already selected 
     *    or not.
     * 3) Replaces the global URL state with the updated URL.
     * 4) Toggles classes on the chip element to represent that it is selected.
     * 5) Dispatches and event with the updated list of selected filters so that
     *    a parent (i.e. ScrollableVideoManager) can catch the event and update
     *    the content accordingly
     * 
     * @param {HTMLElement} chip the filter that was pressed on by the user
     * @returns {void}
     */
    #toggleFilter(chip) {
        const name = chip.dataset.filter;
        const url = new URL(window.location);

        if (this.#selected.has(name)) {
            this.#selected.delete(name);
            url.searchParams.delete('filter', name);
        } else {
            this.#selected.add(name);
            url.searchParams.append('filter', name);
        }

        window.history.replaceState({}, '', url);

        const isOn = this.#selected.has(name);
        chip.classList.toggle('bg-actual-primary', isOn);
        chip.classList.toggle('video-filter-off', !isOn);
        chip.setAttribute('aria-pressed', String(isOn));

        this.dispatchUpdateEvent();
    }

    /**
     * Render the filters and attach event listeners to respond to user actions.
     * 
     * This function should be further broken down, but its arguably fine
     * since, as mentioned in the ClassDoc, the lifetime of this element
     * matches that of the page load, and {@link render} is only called one time
     * in {@link connectedCallback}.
     * 
     * @public
     * @returns {void}
     */
    render() {
        this.style.display = 'block';

        /** Add a style block to the DOM. Keeps styles for this element connected to this element. */
        const style = document.createElement('style');
        style.textContent = `
            video-filters .video-filters-scroller {
                overflow-x: auto;
                overflow-y: hidden;
                -webkit-overflow-scrolling: touch;
                touch-action: pan-x;                /* horizontal swipes scroll the chips */
                padding: 0 10px 7px 10px;
            }
            video-filters .video-filters-scroller::-webkit-scrollbar { height: 4px; }
            video-filters .video-filters-scroller::-webkit-scrollbar-track { background: #22222225; margin: 0 10px; }
            video-filters .video-filters-scroller.dragging { cursor: grabbing; }

            video-filters .video-filter-off { background-color: rgb(0, 0, 0, 0.2); }
        `;

        /** A div that contains the filters list and has a styled scrollbar. */
        const scroller = document.createElement('div');
        scroller.className = 'video-filters-scroller';

        const list = document.createElement('ul');
        list.className = 'd-flex flex-row flex-nowrap m-0 p-0 gap-2 list-unstyled bg-red-500';
        list.style.width = 'max-content';

        for (const filter of this.#filters) {
            const isOn = this.#selected.has(filter.title);

            const li = document.createElement('li');
            const chip = document.createElement('button');
            const icon = document.createElement('i');
            icon.classList.add('bi', filter.icon)
            icon.style.marginRight = '8px';
            chip.type = 'button';
            chip.dataset.filter = filter.title;
            chip.textContent = filter.title;
            chip.setAttribute('aria-pressed', String(isOn));
            chip.className = 'border-0 px-2 py-1 text-white user-select-none text-nowrap rounded fw-semibold '
                + (isOn ? 'bg-actual-primary' : 'video-filter-off');

            chip.prepend(icon);
            li.appendChild(chip);
            list.appendChild(li);
        }

        scroller.appendChild(list);
        this.replaceChildren(style, scroller);

        // mouse drag-to-scroll (touch already scrolls natively)
        /**
         * Use pointerdown to track the potential for a drag.
         * 
         * mouse drag-to-scroll (touch already scrolls natively)
         */
        scroller.addEventListener('pointerdown', (event) => {
            if (event.pointerType != 'mouse') return;
            this.#pointerIsDown = true;
            this.#didDrag = false;
            this.#dragStartX = event.clientX;
            this.#dragStartScroll = scroller.scrollLeft;
        });

        /**
         * Add a click event to the scroller element that will
         * check if the user clicked a filter and toggle that filter
         * on/off.
         */
        scroller.addEventListener('click', (event) => {
            // Find the closest element that sports the data-filter attribute.
            const chip = event.target.closest('button[data-filter]');
            if (chip) this.#toggleFilter(chip);
        });

        /**
         * Only consider it a drag event if the scroller has been dragged more than 5 pixels.
         * 
         * Adds class 'dragging' to scroller which turns the users pointer into cursor: 'grabbing'.
         */
        scroller.addEventListener('pointermove', (event) => {
            if (!this.#pointerIsDown) return;

            /** 
             * Calculate the difference between the position where the drag 
             * started and where the current clientX is during this event.
             */
            const dx = event.clientX - this.#dragStartX;

            if (!this.#didDrag && Math.abs(dx) > 5) {
                this.#didDrag = true;
                scroller.classList.add('dragging');

                /** 
                 * setPointerCapture is used here to allow the user to keep scrolling the filters
                 * even if their cursor has exited the elements bounds.
                 * 
                 * The 'pointerup' event on {@link scroller} releases the pointer capture, instead
                 * of manually calling scroller.releasePointerCapture().
                 */
                scroller.setPointerCapture(event.pointerId);
            }

            /**
             * Explicitly update and control the horizontal scroll position based on
             * the values found in the 'pointerdown' and 'pointermove' events.
             * 
             * Without this line the scrollLeft position of the 'scroller' <div>
             * does not change.
             */
            if (this.#didDrag) scroller.scrollLeft = this.#dragStartScroll - dx;
        });

        /**
         * End the dragging state by resetting properties to their inactive
         * states.
         * 
         * @returns {void}
         */
        const endDrag = () => {
            if (!this.#pointerIsDown) return;
            this.#pointerIsDown = false;
            scroller.classList.remove('dragging');
            this.#didDrag = false;
        };

        scroller.addEventListener('pointerup', endDrag);
        scroller.addEventListener('pointercancel', endDrag);

        /**
         * Wheel Event: Vertical mouse wheel scrolls the chips sideways
         * 
         * passive: false tells the browser that "I might use event.preventDefault()"
         * setting it to true means that you will NOT use event.preventDefault()
         * it is used here because the default behaviour of scrolling is scrolling 
         * downward on the main page axis. 
         */
        scroller.addEventListener('wheel', (event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            event.preventDefault(); // <- uses .preventDefault()
            scroller.scrollLeft += event.deltaY;
        }, { passive: false });
    }

    /**
     * Setup the VideoFilters after they are added to the DOM.
     * 
     * Get any 'pre-selected' filters from the URL and record them
     * before rendering the filters.
     * 
     * This method dispatches an update event so that the filter data
     * can be passed to the parent as soon as it is available.
     * 
     * @public
     * @returns {void}
     */
    connectedCallback() {
        const url = new URL(window.location);
        const result = url.searchParams.getAll('filter');
        result.forEach(item => this.#selected.add(item));

        this.dispatchUpdateEvent();
        this.render();
    }
}

// Define the custom element with CustomElementRegistry.
customElements.define('video-filters', VideoFilters);
