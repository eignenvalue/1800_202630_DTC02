import { onAuthReady } from "/src/authentication.js";
import { showLoginModal } from "./login-modal.js";
import { db } from "/src/firebaseConfig.js";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { escapeHtml } from "../app.js";

/** @type {number} @global */
let quizCount = 0;

/**
 * The QuizComponent provides an overlay for the home/video page
 * that appears when the user requests to take a quiz.
 * 
 * This class is to be used as a singleton and has public methods
 * for updating the quiz content.
 * 
 * @extends HTMLElement
 */
export class QuizComponent extends HTMLElement {

  /**
   * A random unique ID for each quiz instance that 'passes through' this element.
   * 
   * Uses to identify input names.
   * 
   * @private
   * @type {string}
   */
  #uid = `quiz${quizCount++}`;

  /**
   * An array of quiz questions as objects.
   * 
   * @private
   * @type {Array<object> | Array}
   */
  #quiz = [];

  /**
   * An object containing information about the 
   * authenticated user.
   * 
   * @private
   * @type {object | undefined}
   */
  #currentUser = undefined;

  /**
   * A boolean indicating whether the quiz has been requested or not. 
   * 
   * @private
   * @type {boolean}
   */
  #quizRequested = false;

  /**
   * 
   * @type {import("firebase/auth").Unsubscribe | null}
   */
  #stopAuthCheck = null;

  /** 
   * Is set from outside by a video manager.
   * 
   * @public
   * @type {string | null}
  */
  quizId = null; // the video id; plain data, no longer used for input names

  /**
   * Get the current array of quiz questions.
   */
  get quiz() {
    return this.#quiz;
  }

  /**
   * Update the current quiz questions by passing a new Array of questions.
   * 
   * Sets private member {@link #quiz}.
   *
   * @public
   * @type {Array<object> | Array}
   */
  set quiz(value) {
    this.#quiz = Array.isArray(value) ? value : [];
    if (this.isConnected) this.#render();
  }

  #render() {
    const questions = this.#quiz;

    const body = questions.length ? questions.map((q, qIndex) => {
      const name = `${this.#uid}-q${qIndex}`;
      const type = q.type === "checkbox" ? "checkbox" : "radio";
      const options = (q.possibleAnswers ?? []).map((option, i) => `
        <div class="each-quiz form-check">
          <input class="form-check-input" type="${type}" name="${name}" id="${name}-${i}" value="${i}" />
          <label class="form-check-label" for="${name}-${i}">${escapeHtml(option)}</label>
        </div>`,
      ).join("");

      return `
            <div class="quiz">
              <h1 class="question">${escapeHtml(q.question)}</h1>
              ${options}
            </div>`;
    }).join("") + `
          <div class="text-center">
            <button class="btn btn-primary mt-5" type="submit">Submit</button>
            <p class="score mt-3 fs-4"></p>
          </div>`
      : '<p class="m-3">No quiz for this video.</p>';

    this.innerHTML = `
      <form novalidate>
        <button type="button" class="close">x</button>
        ${body}
      </form>`;

    this.querySelector(".close").onclick = () => {
      this.hide();
    }

    this.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      this.checkAnswers();
    });

    const url = new URL(window.location);
    if (!url.searchParams.get("quizOpen")) {
      this.style.display = "none";
    }
  }

  /**
   * Check the users quiz answers against the correct answers, and add their
   * quiz submission to the database.
   * 
   * Note:
   * 1) The quiz is not cleared when it is submitted
   * 2) you can keep clicking submit infinitely to make requests to firebase 
   *    and upload more of the same results.
   * 
   * Deter the user from trying the quiz too many times by disabling the quiz button until
   * they scroll away from the video and the quiz is reinitialized.
   * 
   * @public
   * @returns {void}
   */
  checkAnswers() {
    let score = 0;

    this.#quiz.forEach((q, qIndex) => {
      const name = `${this.#uid}-q${qIndex}`;
      const picked = [...this.querySelectorAll(`input[name="${name}"]:checked`)]
        .map((input) => Number(input.value))
        .sort((a, b) => a - b);
      const correct = [...(q.correctAnswers ?? [])].sort((a, b) => a - b);

      if (picked.join() === correct.join()) score++;
    });

    const scoreEl = this.querySelector(".score");
    if (scoreEl) {
      if (score == this.#quiz.length) {
        scoreEl.textContent = `You got ${score} out of ${this.#quiz.length} 🎉`;
      } else {
        scoreEl.textContent = `You got ${score} out of ${this.#quiz.length} !`;
      }
    }
    const user = getAuth().currentUser;
    console.log('here here', this.quizId);
    const videoId = this.quizId || new URLSearchParams(window.location).get("video");

    if (user && videoId) {
      updateDoc(doc(db, "users", user.uid), {
        [`completed_quizzes.${videoId}`]: {
          score: score,
          total: this.#quiz.length,
          completedAt: serverTimestamp(),
        },
      }).catch((err) => console.error("Could not save quiz grade:", err));
    }
  }

  /**
   * Applies styles to this element and then creates an onAuthReady callback
   * that populates {@link #stopAuthCheck} as a Firebase Unsubscribe function.
   * 
   * @public
   * @returns {void}
   */
  connectedCallback() {
    /** Apply classes and styles to this element. */
    this.style.display = "none";
    this.style.backgroundColor = "Black";
    this.style.zIndex = "100";
    this.style.overflowY = "auto";
    this.classList.add("position-fixed", "top-0", "start-0", "w-100", "h-100", "pb-5");

    /**
     * Change quiz visibility when authentication state changes.
     * 
     * ScrollableVideoManager shows the login modal on it's own.
     * 
     * This callback fires once immediatley so checking {@link #quizRequested}
     * is false is required so the quiz isn't immediatley shown to a logged in user.
     */
    this.#stopAuthCheck = onAuthReady((user) => {
      this.#currentUser = user;

      if (!this.#quizRequested) return;

      user ? this.show() : this.hide();
    });

    this.#render();

    /** 
     * If the quiz is meant to be open try to open it, {@link show} 
     * will block the request if the user is not logged in. 
     */
    const url = new URL(window.location);
    if (url.searchParams.get("quizOpen")) {
      this.show();
    }
  }

  /**
   * Check if the user is logged in before opening the quiz page.
   * 
   * If the user is not logged in this method will show a modal telling
   * the user to login before starting the quiz.
   * 
   * @public
   * @returns {void}
   */
  show() {
    this.#quizRequested = true;

    // undefined means Firebase is still checking the login state.
    if (this.#currentUser === undefined) return;

    if (!this.#currentUser) {
      showLoginModal("Please log in before starting this quiz.");
      return;
    }

    this.#openQuiz();
  }

  /**
   * Open the quiz by settings the display style of this element to "block".
   * 
   * This method mutates global state by updating the URL to reflect the quiz being open.
   * This is for subsequent page reloads where the user might want to quiz 'page' to stay open.
   * 
   * This method is to be called from {@link show}
   * 
   * @private
   * @returns {void}
   */
  #openQuiz() {
    const url = new URL(window.location);
    url.searchParams.set("quizOpen", 1);
    window.history.replaceState({}, "", url);
    this.style.display = "block";
  }

  /**
   * Hide the quiz by setting the display style of this element to "block".
   * 
   * This method mutates global state by updating the URL to reflect the quiz being open.
   * This is for subsequent page reloads where the user might want to quiz 'page' to stay open.
   * 
   * @private
   * @returns {void}
   */
  hide() {
    this.#quizRequested = false;
    const url = new URL(window.location);
    url.searchParams.delete("quizOpen", 1);
    window.history.replaceState({}, "", url);
    this.style.display = "none";
  }

  /**
   * Call Unsubscribe on the auth check callback, and lose reference to the
   * Unsubscribe method and current user.
   * 
   * @public
   * @returns {void}
   */
  disconnectedCallback() {
    this.#stopAuthCheck?.();
    this.#stopAuthCheck = null;
    this.#currentUser = undefined;
  }
}

// Define the custom element with CustomElementRegistry.
customElements.define("quiz-component", QuizComponent);
