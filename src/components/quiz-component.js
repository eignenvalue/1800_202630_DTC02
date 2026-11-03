let quizCount = 0;

class QuizComponent extends HTMLElement {
  constructor() {
    super();
    this.quizId = "quiz" + quizCount++;
    this._quiz = [];
  }

  set quiz(value) {
    this._quiz = value || [];
    this.render();
  }

  get quiz() {
    return this._quiz;
  }

  render() {
    let html = "<form>";

    this._quiz.forEach((q, qIndex) => {
      const name = `${this.quizId}-q${qIndex}`;
      const type = q.type === "checkbox" ? "checkbox" : "radio";

      html += `<div class="quiz"><hr /><h1 class="question">${q.question}</h1>`;
      q.possibleAnswers.forEach((option, i) => {
        html += `
          <div class="each-quiz form-check">
            <input class="form-check-input" type="${type}" name="${name}" id="${name}-${i}" value="${i}" />
            <label class="form-check-label" for="${name}-${i}">${option}</label>
          </div>`;
      });
      html += `</div>`;
    });

    html += `
  <div class="text-center">
    <button class="btn btn-primary mt-5" type="submit">Submit</button>
    <p class="score mt-3 fs-4"></p>
  </div>
  </form>`;

    this.innerHTML = html;

    this.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      this.checkAnswers();
    });
  }

  checkAnswers() {
    let score = 0;

    this._quiz.forEach((q, qIndex) => {
      const name = `${this.quizId}-q${qIndex}`;
      const picked = [...this.querySelectorAll(`input[name="${name}"]:checked`)]
        .map((input) => Number(input.value))
        .sort((a, b) => a - b);
      const correct = [...q.correctAnswers].sort((a, b) => a - b);

      if (picked.join() === correct.join()) score++;
    });

    this.querySelector(".score").textContent =
      `You got ${score} out of ${this._quiz.length}!`;
  }
}

customElements.define("quiz-component", QuizComponent);
