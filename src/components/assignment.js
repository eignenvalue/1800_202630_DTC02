import { marked } from "marked";

/**
 * The Assignment class is an 'overlay' in this application. For the user
 * this feature is called 'Practice.'
 * 
 * When a user presses the 'Practice' button the .show() method will be called
 * on some instance of this class and the element will be visible on the DOM.
 * 
 * It is positioned absolutely in the top-left and covers the screen from there 
 * to the bottom-right of the screen.
 * 
 * The content of the page is formatted in markdown and parsed into HTML before
 * rendering using the 'marked' library.
 * 
 * @extends HTMLElement
 */
export class Assignment extends HTMLElement {

  /** The assignment text as a string (Markdown) */
  #assignmentText = "";

  /** A reference to the container holding the content on the DOM */
  #content = null;

  /** Get the assignment text. */
  get assignmentText() {
    return this.#assignmentText;
  }

  /**
   * Set the private field #assignmentText to a new string, or an
   * empty string if the argument passed is NOT a string.
   * 
   * Setter
   * @type {string} 
   */
  set assignmentText(value) {
    this.#assignmentText = typeof value === "string" ? value : "";

    if (this.#content) {
      this.#renderContent();
    }

  }

  /**
   * Build the HTML shell for the assignment.
   * 
   * @private
   * @returns {void}
   */
  #buildShell() {

    // Add classes.
    this.classList.add("position-fixed", "top-0", "start-0", "w-100", "h-100");

    // Set the HTML content of this element.
    this.innerHTML = `
            <style>
                assignment-element strong { font-weight: 800; }
                assignment-element h1 { font-weight: 1000; }
                assignment-element h2 { font-weight: 800; }
                [data-content] {
                 color: White; margin-top: 20px; max-width: 700px; margin:auto; 
                 background-color: Black; border-radius: 10px;
                 padding: 20px; margin-bottom: 15px; font-weight: bold; background-color: #232323;
                }
                @media(max-width: 568px){
                  [data-content]{
                    margin: 20px
                  }
                }
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
                
                <!-- This is what the querySelector grabs, and where page content is stored -->
                <!-- this.#content = this.querySelector("[data-content]"); -->
                <div data-content></div>
            </div>
        `;

    // Update styles directly.
    this.style.zIndex = "100";
    this.style.backgroundColor = "Black";
    this.style.overflowY = "auto";
    this.style.paddingBottom = "70px";

    // Find the <div> where assignment content should be displayed.
    this.#content = this.querySelector("[data-content]");

    // Find the first element inside the Assignment element that has the class '.close' and
    // update its onclick callback to be an anonymous function that calls this.hide()
    this.querySelector(".close").onclick = () => {
      this.hide();
    };
  }

  /**
   * Parse the assignment text into markdown using the marked
   * library, or appends paragraph text to tell the user there is
   * no assignment available.
   * 
   * @private
   * @returns {void}
   */
  #renderContent() {

    // Use the 'getter' to access the assignmentText
    // instead of directly accessing private property
    // this.#assignmentText
    const text = this.assignmentText.trim();
    this.#content.innerHTML = text
      ? marked.parse(text)
      : "<p>No assignment for this video.</p>";
  }

  /**
   * The connectedCallback is a part of the Lifecycle methods for HTMLElements,
   * it runs every time the element is added to the Document Object Model (DOM).
   * 
   * This function does 3 things:
   * 1) Checks if the assignmentOpen param is available in the URL, if it is then the
   *    user must be expecting the assignment to be open, if is not then the assignment
   *    should remain invisible.
   * 2) Checks if the private field #content has been defined (through use of #buildShell()),
   *    if it hasn't then buildShell() is called so that it can define this.#content.
   * 3) Renders the content using the private method #renderContent()
   *
   * @public
   * @returns {void}
   */
  connectedCallback() {
    const url = new URL(window.location);
    if (!url.searchParams.get("assignmentOpen")) {
      this.style.display = "none";
    };

    if (!this.#content) {
      this.#buildShell();
    }
    this.#renderContent();
  }

  /**
   * Show the assignment popup/page/modal <3 to the user.
   * 
   * This function does 3 things:
   * 1) Creates a new URL from the current URL that includes the param
   *    ?assignmentOpen=1
   * 2) Uses the History API to directly replace the URL state
   * 3) Updates the styles directly for this element to make the element 
   *    visible with display: 'block';
   * 
   * @public
   * @returns {void}
   */
  show() {
    const url = new URL(window.location);
    url.searchParams.set("assignmentOpen", 1);
    window.history.replaceState({}, "", url);
    this.hidden = false;
  }

  /**
   * Hide the assignment popup from the user.
   * 
   * This function does 3 things:
   * 1) Creates a new URL object from the current window.location,
   *    that has the param assignmentOpen deleted from it
   * 2) Uses the History API to directly replace the URL state
   * 3) Updates the styles directly for this element to make the element 
   *    invisible with display: 'none';
   * 
  * @public
  * @returns {void}
  */
  hide() {
    const url = new URL(window.location);
    url.searchParams.delete("assignmentOpen");
    window.history.replaceState({}, "", url);
    this.hidden = true;
  }
}

// Register the custom element with the CustomElementRegistry.
customElements.define("assignment-element", Assignment);
