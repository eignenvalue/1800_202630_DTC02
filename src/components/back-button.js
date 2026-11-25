class BackButton extends HTMLElement {

  /**
   * The connectedCallback is a part of the Lifecycle methods for HTMLElements,
   * it runs every time the element is added to the Document Object Model (DOM).
   * 
   * Here it setups a few things:
   * 1) Sets the innerHTML content of the BackButton element to be a HTMLButtonElement.
   * 2) Runs a querySelector for the first "button" found within the BackButton element
   *    and adds a "click" event listener to it that is passed an anonymous callback function
   *  2a) The anonymous callback function does NOT use the event parameter
   *  2b) The History API is used to navigate back one page (to the previous page)
   * 
   * @public
   * @returns {void}
   */
  connectedCallback() {
    this.innerHTML = `
      <button type="button" style="background-color: #fe2c55; border: none; width: 75px; border-radius: 10px; padding-buttom: 10px; margin-left: 10px; font-size: 15px; font-weight: bold; color: white;">⇦ Back</button>
    `;

    this.querySelector("button").addEventListener("click", () => {
      history.back();
    });
  }
}

// Register the custom element with the CustomElementRegistry.
customElements.define("back-button", BackButton);
