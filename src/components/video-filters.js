class VideoFilters extends HTMLElement {
    #filters;

    constructor() {
        super();

        this.startDragging = 0;
        this.currentOffset = 0;

        this.mouseDownLeft = 0;
        this.dragging = false;

        // each could have an icon
        this.#filters = ['Science', 'Math', 'Art', 'Technology', 'Graphic Design', 'Programming', 'Engineering']
    }

    static get observedAttributes() {
        return ['videoElementWidth'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    initDrag(event) {
        this.dragging = true;
        this.startDragging = event.clientX - this.currentOffset;
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    isDragging(event) {
        if (!this.dragging) return;

        let listWidth = this.querySelector('ul').clientWidth;
        const minimum = 10;
        const maximum = -(listWidth - Number(this.videoElementWidth))

        let lval = -(this.startDragging - event.clientX);

        if (lval > minimum) {
            lval = minimum;
        }

        if (lval < maximum) {
            lval = maximum;
        }

        this.currentOffset = lval;

        this.parentElement.style.left = `${lval}px`;
    }

    get videoElementWidth() {
        return this.getAttribute('videoElementWidth');
    }

    stopDragging(event) {
        this.dragging = false;
    }

    render() {

        let parent = document.createElement('ul');
        parent.id = 'scrollableVideoFilters';
        parent.classList.add('width-max-content', 'd-flex', 'flex-row', 'list-unstyled', 'm-0', 'p-0');

        for (let i = 0; i < this.#filters.length; i++) {
            let li = document.createElement('li');
            let element = document.createElement('a');
            li.appendChild(element);
            element.role = 'button';
            element.innerText = this.#filters[i];
            element.classList.add('border', 'rounded', 'p-2', 'text-white', 'text-decoration-none', 'user-select-none')
            element.style.marginRight = '1rem';
            parent.appendChild(li);
        }

        this.replaceChildren()
        this.append(parent);

        parent.addEventListener('pointerdown', this.initDrag.bind(this));
        parent.addEventListener('pointermove', this.isDragging.bind(this));
        parent.addEventListener('pointerup', this.stopDragging.bind(this));
        parent.addEventListener('pointercancel', this.stopDragging.bind(this));
    }

    connectedCallback() {
        this.render()
    }
}

customElements.define('video-filters', VideoFilters);
