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

        const url = new URL(window.location);
        const result = url.searchParams.getAll('filter');
        result.forEach(item => this.#selected.add(item));

        // must match the strings stored in each video's `tags` array
        this.#filters = [
            { title: 'Science', icon: 'bi-flask' },
            { title: 'Math', icon: 'bi-calculator' },
            { title: 'Art', icon: 'bi-palette' },
            { title: 'Technology', icon: 'bi-cpu' },
            { title: 'Graphic Design', icon: 'bi-vector-pen' },
            { title: 'Programming', icon: 'bi-code-slash' },
            { title: 'Engineering', icon: 'bi-gear' }
        ];

    }

    get selectedFilters() {
        return [...this.#selected];
    }

    dispatchUpdateEvent() {
        this.dispatchEvent(new CustomEvent('video-filters-change', {
            detail: { filters: this.selectedFilters },
            bubbles: true,
            composed: true,
        }));
    }

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

    render() {
        this.style.display = 'block';

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
            video-filters .video-filter-off { background-color: rgb(0, 0, 0, 0.2); }
            video-filters .video-filters-scroller.dragging { cursor: grabbing; }
        `;

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
        this.dispatchUpdateEvent();
    }
}

customElements.define('video-filters', VideoFilters);