import { marked } from "marked";

export class Assignment extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['assignmentText'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render(); // not defined, change when ready
        }
    }

    render() {
        console.log(this.assignmentText)
        const html = marked.parse(this.assignmentText.replace(/^\s+/gm, ""));

        this.innerHTML = `
            <div>
                <button class="close">X</button>
                ${html}
            </div>
        `;

        const closeButton = this.querySelector(".close");
        closeButton.onclick = this.hide.bind(this);

        this.classList.add('position-fixed', 'top-0', 'left-0', 'bg-white', 'w-100', 'h-100')
        this.style.zIndex = '100';

        this.hide();
    }

    connectedCallback() {
        this.render();
    }

    show() {
        this.style.display = "block";
    }

    hide() {
        this.style.display = "none";
    }
}

customElements.define("assignment-element", Assignment);