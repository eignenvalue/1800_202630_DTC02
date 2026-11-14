import { marked } from "marked";

export class Assignment extends HTMLElement {
    #assignmentText = '';
    #content = null;

    get assignmentText() {
        return this.#assignmentText;
    }

    set assignmentText(value) {
        this.#assignmentText = typeof value === 'string' ? value : '';
        if (this.#content) this.#renderContent();
    }

    #buildShell() {
        this.classList.add('position-fixed', 'top-0', 'start-0', 'bg-white', 'w-100', 'h-100');
        this.style.zIndex = '100';

        const url = new URL(window.location);
        if (!url.searchParams.get('assignmentOpen')) {
            this.style.display = 'none';
        }

        this.innerHTML = `
            <div>
                <button class="close" type="button">X</button>
                <div data-content></div>
            </div>
        `;

        this.#content = this.querySelector('[data-content]');
        this.querySelector('.close').onclick = () => this.hide();
    }

    #renderContent() {
        const text = this.#assignmentText.replace(/^\s+/gm, '').trim();
        this.#content.innerHTML = text
            ? marked.parse(text)
            : '<p>No assignment for this video.</p>';
    }

    connectedCallback() {
        if (!this.#content) {
            this.#buildShell();
        }
        this.#renderContent();
    }

    show() {
        const url = new URL(window.location);
        url.searchParams.set('assignmentOpen', 1);
        window.history.replaceState({}, '', url);
        this.style.display = 'block';
    }

    hide() {
        const url = new URL(window.location);
        url.searchParams.delete('assignmentOpen');
        window.history.replaceState({}, '', url);
        this.style.display = 'none';
    }
}

customElements.define("assignment-element", Assignment);