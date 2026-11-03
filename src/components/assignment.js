import { marked } from "marked";

/*
1. What was the main topic of this video?
2. List three key points the video covered.
3. What is one new term or idea you learned, and what does it mean?
*/

export class Assignment extends HTMLElement {
    constructor(text) {
        super();
        this.text = text;
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
