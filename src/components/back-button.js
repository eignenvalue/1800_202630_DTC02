class BackButton extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button type="button" class="btn btn-outline-secondary rounded-pill fs-2 px-4 mt-4 ms-4">&larr;</button>
    `;

    this.querySelector("button").addEventListener("click", () => {
      history.back();
    });
  }
}

customElements.define("back-button", BackButton);
 