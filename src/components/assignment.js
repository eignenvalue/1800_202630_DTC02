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
            this.hide(); // start closed, only on first build
        }
        this.#renderContent();
    }

    show() {
        this.style.display = 'block';
    }

    hide() {
        this.style.display = 'none';
    }
}

customElements.define("assignment-element", Assignment);