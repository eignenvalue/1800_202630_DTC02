let quizCount = 0;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export class QuizComponent extends HTMLElement {
  #uid = `quiz${quizCount++}`; // unique per instance, used for input names
  #quiz = [];
  #styled = false;

  quizId = null; // the video id; plain data, no longer used for input names

  get quiz() {
    return this.#quiz;
  }

  set quiz(value) {
    this.#quiz = Array.isArray(value) ? value : [];
    if (this.isConnected) this.#render();
  }

  #render() {
    const questions = this.#quiz;

    const body = questions.length
      ? questions
          .map((q, qIndex) => {
            const name = `${this.#uid}-q${qIndex}`;
            const type = q.type === "checkbox" ? "checkbox" : "radio";
            const options = (q.possibleAnswers ?? [])
              .map(
                (option, i) => `
            <div class="each-quiz form-check">
              <input class="form-check-input" type="${type}" name="${name}" id="${name}-${i}" value="${i}" />
              <label class="form-check-label" for="${name}-${i}">${escapeHtml(option)}</label>
            </div>`,
              )
              .join("");

            return `
            <div class="quiz">
              <h1 class="question">${escapeHtml(q.question)}</h1>
              ${options}
            </div>`;
          })
          .join("") +
        `
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

    this.querySelector(".close").onclick = () => this.hide();
    this.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      this.checkAnswers();
    });

    this.hide(); // a fresh render always starts closed
  }

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
    if (scoreEl){
      if (score == this.#quiz.length){
        scoreEl.textContent = `You got ${score} out of ${this.#quiz.length} 🎉`;
      } 
      else {
        scoreEl.textContent = `You got ${score} out of ${this.#quiz.length} !`;
      }
    }
  }

  connectedCallback() {
    if (!this.#styled) {
      this.classList.add("position-fixed", "top-0", "start-0", "w-100", "bg-secondary");
      this.style.height = "calc(100% - 72px)";
      this.style.zIndex = "100";
      this.style.overflowY = "auto";
      this.#styled = true;
    }
    this.#render(); // renders the empty state and hides, even if quiz was never set
  }

  show() {
    this.style.display = "block";
  }

  hide() {
    this.style.display = "none";
  }
}

customElements.define("quiz-component", QuizComponent);
