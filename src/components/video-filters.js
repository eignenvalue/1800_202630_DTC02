class VideoFilters extends HTMLElement {
    #filters;
    #selected = new Set();

    constructor() {
        super();

        this.startDragging = 0;
        this.currentOffset = 0;
        this.downX = 0;
        this.dragging = false;

        // must match the strings stored in each video's `tags` array
        this.#filters = ['Science', 'Math', 'Art', 'Technology', 'Graphic Design', 'Programming', 'Engineering'];
    }

    static get observedAttributes() {
        return ['videoElementWidth'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    get videoElementWidth() {
        return this.getAttribute('videoElementWidth');
    }

    get selectedFilters() {
        return [...this.#selected];
    }

    initDrag(event) {
        this.dragging = true;
        this.downX = event.clientX;
        this.startDragging = event.clientX - this.currentOffset;
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    isDragging(event) {
        if (!this.dragging) return;

        const listWidth = this.querySelector('ul').clientWidth;
        const minimum = 10;
        const maximum = -(listWidth - Number(this.videoElementWidth));

        let lval = -(this.startDragging - event.clientX);
        if (lval > minimum) lval = minimum;
        if (lval < maximum) lval = maximum;

        this.currentOffset = lval;
        this.parentElement.style.left = `${lval}px`;
    }

    stopDragging(event) {
        if (!this.dragging) return;
        this.dragging = false;

        // barely moved = a tap, not a drag. Pointer capture retargets the
        // click to the <ul>, so find the chip under the pointer ourselves.
        if (event.type === 'pointerup' && Math.abs(event.clientX - this.downX) < 5) {
            const chip = document.elementFromPoint(event.clientX, event.clientY)?.closest('a[data-filter]');
            if (chip) this.toggleFilter(chip);
        }
    }

    toggleFilter(chip) {
        const name = chip.dataset.filter;

        if (this.#selected.has(name)) {
            this.#selected.delete(name);
        } else {
            this.#selected.add(name);
        }

        chip.classList.toggle('bg-primary', this.#selected.has(name));
        chip.setAttribute('aria-pressed', String(this.#selected.has(name)));

        this.dispatchEvent(new CustomEvent('video-filters-change', {
            detail: { filters: this.selectedFilters },
            bubbles: true,
            composed: true,
        }));
    }

    render() {
        const parent = document.createElement('ul');
        parent.id = 'scrollableVideoFilters';
        parent.classList.add('width-max-content', 'd-flex', 'flex-row', 'm-0', 'gap-3', 'list-unstyled');
        parent.style.paddingLeft = parent.style.paddingRight = '10px';

        for (const filter of this.#filters) {
            const li = document.createElement('li');
            const element = document.createElement('a');
            li.appendChild(element);
            element.role = 'button';
            element.style.display = 'inline-block';
            element.dataset.filter = filter;
            element.setAttribute('aria-pressed', String(this.#selected.has(filter)));
            element.innerText = filter;
            element.classList.add('border', 'rounded', 'p-2', 'text-white', 'text-decoration-none', 'user-select-none');
            if (this.#selected.has(filter)) element.classList.add('bg-primary');
            parent.appendChild(li);
        }

        this.replaceChildren(parent);

        parent.addEventListener('pointerdown', this.initDrag.bind(this));
        parent.addEventListener('pointermove', this.isDragging.bind(this));
        parent.addEventListener('pointerup', this.stopDragging.bind(this));
        parent.addEventListener('pointercancel', this.stopDragging.bind(this));
    }

    connectedCallback() {
        this.render();

        const wrapper = this.parentElement;
        if (wrapper) {
            if (getComputedStyle(wrapper).position === 'static') {
                wrapper.style.position = 'relative';
            }
            wrapper.style.zIndex = '10';
        }
    }
}

customElements.define('video-filters', VideoFilters);