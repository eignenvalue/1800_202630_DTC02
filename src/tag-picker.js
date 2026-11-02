// <tag-picker> renders one checkbox per tag, all named "tags[]" so they
// arrive together in FormData. Set the list with the `tags` property:
//
//   document.querySelector('tag-picker').tags = ['Science', 'Mathematics'];
//
// or declaratively: <tag-picker tags="Science,Mathematics"></tag-picker>

const DEFAULT_TAGS = ['Science', 'Math', 'Art', 'Technology', 'Graphic Design', 'Programming', 'Engineering', 'Geology'];

class TagPicker extends HTMLElement {
    #tags = null; // null = fall back to the attribute, then the defaults
    #rendered = false;

    static get observedAttributes() {
        return ['tags'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.#tags === null && this.#rendered) this.render();
    }

    get tags() {
        if (this.#tags) return this.#tags;
        const attr = this.getAttribute('tags');
        return attr ? attr.split(',').map((t) => t.trim()).filter(Boolean) : DEFAULT_TAGS;
    }

    set tags(list) {
        this.#tags = Array.isArray(list) ? [...list] : null;
        if (this.#rendered) this.render();
    }

    get selected() {
        return [...this.querySelectorAll('input:checked')].map((input) => input.value);
    }

    connectedCallback() {
        this.#rendered = true;
        this.render();
    }

    render() {
        // Keep ticks if the list is re-rendered.
        const previous = new Set(this.selected);

        const wrapper = document.createElement('div');
        wrapper.className = 'd-flex flex-column';

        const heading = document.createElement('h2');
        heading.textContent = 'Tags:';
        wrapper.append(heading);

        this.tags.forEach((tag, i) => {
            const id = `tag-checkbox-${i + 1}`;

            const label = document.createElement('label');
            label.htmlFor = id;

            const input = document.createElement('input');
            input.id = id;
            input.type = 'checkbox';
            input.name = 'tags[]';
            input.value = tag;
            input.checked = previous.has(tag);

            // textContent, not innerHTML: tags may come from a database.
            label.append(input, ` ${tag}`);
            wrapper.append(label);
        });

        this.replaceChildren(wrapper);
    }
}

customElements.define('tag-picker', TagPicker);

export { TagPicker };