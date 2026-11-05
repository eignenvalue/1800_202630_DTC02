class VideoFilters extends HTMLElement {
    #filters;
    #selected = new Set();

    // mouse drag-to-scroll state
    #dragStartX = 0;
    #dragStartScroll = 0;
    #pointerIsDown = false;
    #didDrag = false;

    constructor() {
        super();

        // must match the strings stored in each video's `tags` array
        this.#filters = ['Science', 'Math', 'Art', 'Technology', 'Graphic Design', 'Programming', 'Engineering'];
    }

    get selectedFilters() {
        return [...this.#selected];
    }

    #toggleFilter(chip) {
        const name = chip.dataset.filter;

        if (this.#selected.has(name)) {
            this.#selected.delete(name);
        } else {
            this.#selected.add(name);
        }

        const isOn = this.#selected.has(name);
        chip.classList.toggle('bg-primary', isOn);
        chip.classList.toggle('video-filter-off', !isOn);
        chip.setAttribute('aria-pressed', String(isOn));

        this.dispatchEvent(new CustomEvent('video-filters-change', {
            detail: { filters: this.selectedFilters },
            bubbles: true,
            composed: true,
        }));
    }

    render() {
        this.style.display = 'block';

        const style = document.createElement('style');
        style.textContent = `
            video-filters .video-filters-scroller {
                overflow-x: auto;
                overflow-y: hidden;
                scrollbar-width: none;              /* Firefox */
                -webkit-overflow-scrolling: touch;
                touch-action: pan-x;                /* horizontal swipes scroll the chips */
                padding: 0 10px;
            }
            video-filters .video-filters-scroller::-webkit-scrollbar { display: none; }
            video-filters .video-filter-off { background: rgba(0, 0, 0, .45); }
            video-filters .video-filters-scroller.dragging { cursor: grabbing; }
        `;

        const scroller = document.createElement('div');
        scroller.className = 'video-filters-scroller';

        const list = document.createElement('ul');
        list.className = 'd-flex flex-row flex-nowrap m-0 p-0 gap-2 list-unstyled';
        list.style.width = 'max-content';

        for (const filter of this.#filters) {
            const isOn = this.#selected.has(filter);

            const li = document.createElement('li');
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.dataset.filter = filter;
            chip.textContent = filter;
            chip.setAttribute('aria-pressed', String(isOn));
            chip.className = 'border rounded px-3 py-2 text-white user-select-none text-nowrap '
                + (isOn ? 'bg-primary' : 'video-filter-off');

            li.appendChild(chip);
            list.appendChild(li);
        }

        scroller.appendChild(list);
        this.replaceChildren(style, scroller);

        // taps and clicks
        scroller.addEventListener('click', (event) => {
            if (this.#didDrag) return; // that was a drag, not a click
            const chip = event.target.closest('button[data-filter]');
            if (chip) this.#toggleFilter(chip);
        });

        // mouse drag-to-scroll (touch already scrolls natively)
        scroller.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'mouse') return;
            this.#pointerIsDown = true;
            this.#didDrag = false;
            this.#dragStartX = event.clientX;
            this.#dragStartScroll = scroller.scrollLeft;
        });

        scroller.addEventListener('pointermove', (event) => {
            if (!this.#pointerIsDown) return;
            const dx = event.clientX - this.#dragStartX;

            if (!this.#didDrag && Math.abs(dx) > 5) {
                this.#didDrag = true;
                scroller.classList.add('dragging');
                scroller.setPointerCapture(event.pointerId);
            }
            if (this.#didDrag) scroller.scrollLeft = this.#dragStartScroll - dx;
        });

        const endDrag = () => {
            if (!this.#pointerIsDown) return;
            this.#pointerIsDown = false;
            scroller.classList.remove('dragging');
            // let the click event that follows a drag be ignored, then reset
            setTimeout(() => { this.#didDrag = false; }, 0);
        };
        scroller.addEventListener('pointerup', endDrag);
        scroller.addEventListener('pointercancel', endDrag);

        // vertical mouse wheel scrolls the chips sideways
        scroller.addEventListener('wheel', (event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            event.preventDefault();
            scroller.scrollLeft += event.deltaY;
        }, { passive: false });
    }

    connectedCallback() {
        this.render();
    }
}

customElements.define('video-filters', VideoFilters);