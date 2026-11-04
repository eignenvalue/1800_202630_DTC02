import { marked } from "marked";

export class Assignment extends HTMLElement {
    constructor(text) {
        super();
        this.text = text;
    }

    static get observedAttributes() {
        return ['assignmentText'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render(); // not defined, change when ready
        }
    }

    connectedCallback() {
        const html = marked.parse(this.text.replace(/^\s+/gm, ""));

        this.innerHTML = `
        <div class="popup">
            <button class="close">X</button>
            ${html}
        </div>
    `;

        const closeButton = this.querySelector(".close");
        closeButton.onclick = () => this.hide();

        this.hide();
    }

    show() {
        this.style.display = "block";
    }

    hide() {
        this.style.display = "none";
    }
}

customElements.define("assignment-element", Assignment);