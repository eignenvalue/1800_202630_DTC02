class BackButton extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button type="button" style = "background-color: #fe2c55; border: none; width: 75px; border-radius: 10px; padding-buttom: 10px; margin-left: 10px; font-size: 15px; font-weight: bold; color: white;">⇦ Back</button>
    `;

    this.querySelector("button").addEventListener("click", () => {
      history.back();
    });
  }
}

customElements.define("back-button", BackButton);
 