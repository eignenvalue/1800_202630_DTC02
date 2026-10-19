class VideoFilters extends HTMLElement {
    #left;
    #filters;

    constructor() {
        super();

        this.startDragging = 0;
        this.currentOffset = 0;

        this.mouseDownLeft = 0;
        this.dragging = false;

        this.#filters = ['Science', 'Math', 'Art', 'Technology', 'Graphic Design', 'Programming', 'Engineering']
    }

    initDrag(event) {
        console.log(event);
        this.dragging = true;
        this.startDragging = event.clientX - this.currentOffset;
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    isDragging(event) {
        if (!this.dragging) return;
        console.log('dragon balls', event);
        const minimum = 0;

        let lval = -(this.startDragging - event.clientX);

        if (lval > minimum) {
            lval = minimum;
        }

        this.currentOffset = lval;

        this.parentElement.style.left = `${lval}px`;
    }

    stopDragging(event) {
        this.dragging = false;
    }

    render() {

        let parent = document.createElement('ul');
        parent.classList.add('width-max-content', 'd-flex', 'flex-row', 'list-style-none', 'm-0', 'p-0')
        parent.style.left = this.#left;

        for (let i = 0; i < this.#filters.length; i++) {
            let li = document.createElement('li');
            let element = document.createElement('a');
            li.appendChild(element);
            element.role = 'button';
            element.innerText = this.#filters[i];
            element.classList.add('border', 'rounded', 'p-2', 'text-white', 'text-decoration-none')
            element.style.marginRight = '1rem';
            parent.appendChild(element);
        }

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
