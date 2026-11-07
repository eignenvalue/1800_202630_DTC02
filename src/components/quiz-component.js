let quizCount = 0;

export class QuizComponent extends HTMLElement {
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
    let html = "<form><button class='close'>x</button>";

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

    this.hide();

    const closeButton = this.querySelector(".close");
    closeButton.onclick = this.hide.bind(this);

    this.classList.add('position-fixed', 'top-0', 'left-0', 'bg-white', 'w-100', 'h-100')
    this.style.zIndex = '100';
  }

  checkAnswers() {
    let score = 0;

    this._quiz.forEach((q, qIndex) => {
      const name = `${this.quizId}-q${qIndex}`;
      const picked = [...this.querySelectorAll(`input[name="${name}"]:checked`)]
        .map((input) => Number(input.value))
        .sort((a, b) => a - b);
      console.log(picked);
      const correct = [...q.correctAnswers].sort((a, b) => a - b);
      console.log(correct);

      if (picked.join() === correct.join()) score++;
    });

    this.querySelector(".score").textContent =
      `You got ${score} out of ${this._quiz.length}!`;
  }

  show() {
    this.style.display = 'block';
  }

  hide() {
    this.style.display = 'none';
  }
}

customElements.define("quiz-component", QuizComponent);
