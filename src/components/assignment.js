import { marked } from "marked";

export class Assignment extends HTMLElement {
  #assignmentText = "";
  #content = null;

  get assignmentText() {
    return this.#assignmentText;
  }

  set assignmentText(value) {
    this.#assignmentText = typeof value === "string" ? value : "";
    if (this.#content) this.#renderContent();
  }

  #buildShell() {
    this.classList.add("position-fixed", "top-0", "start-0", "w-100", "h-100");
    this.style.zIndex = "100";

    const url = new URL(window.location);
    if (!url.searchParams.get("assignmentOpen")) {
      this.style.display = "none";
    };
    this.innerHTML = `
            <style>
                assignment-element strong { font-weight: 800; }
                assignment-element h1 { font-weight: 1000; }
                assignment-element h2 { font-weight: 800; }
            </style>
            <div style = "font-family: 'Nunito', sans-serif;">
                <button class="close" style = "  background-color: #fe2c55;
                                                 margin: 20px;
                                                 color: white;
                                                 border: none;
                                                 border-radius: 5px;
                                                 padding: 5px 12px;
                                                 font-size: 20px;
                                                 font-weight: bold;" type="button">X</button>
                <div data-content style = "color: White; margin-top: 20px;
                 background-color: Black; border-radius: 10px;
                 padding: 20px; margin-bottom: 15px; margin: 20px; font-weight: bold; background-color: #232323;"></div>
            </div>
        `;
    this.style.backgroundColor = "Black";
    this.style.overflowY = "auto";
    this.style.paddingBottom = "70px";
    this.#content = this.querySelector("[data-content]");
    this.querySelector(".close").onclick = () => this.hide();
  }

  #renderContent() {
    const text = this.#assignmentText.replace(/^\s+/gm, "").trim();
    this.#content.innerHTML = text
      ? marked.parse(text)
      : "<p>No assignment for this video.</p>";
  }

  connectedCallback() {
    if (!this.#content) {
      this.#buildShell();
    }
    this.#renderContent();
  }

  show() {
    const url = new URL(window.location);
    url.searchParams.set("assignmentOpen", 1);
    window.history.replaceState({}, "", url);
    this.style.display = "block";
  }

  hide() {
    const url = new URL(window.location);
    url.searchParams.delete("assignmentOpen");
    window.history.replaceState({}, "", url);
    this.style.display = "none";
  }
}

customElements.define("assignment-element", Assignment);
