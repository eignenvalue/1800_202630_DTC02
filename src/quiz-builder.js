// Dynamic quiz form built from three custom elements:
//
//   <quiz-builder>            Add Question button + list of questions
//     <quiz-question>         one question (type="radio" | "checkbox")
//       <quiz-answer>         one possible answer + "is answer" control
//
// Everything renders into the light DOM (no shadow root) so the inputs
// take part in the surrounding <form>, Bootstrap classes apply, and
// FormData / native validation keep working.

const MIN_ANSWERS = 2;
let uid = 0; // stable ids: they never change when siblings are removed

const QUESTION_TYPES = {
    radio: 'Single choice',
    checkbox: 'Multiple choice',
};

class QuizAnswer extends HTMLElement {
    #id = `a${++uid}`;
    #questionId = '';
    #multiple = false;
    #rendered = false;

    static get observedAttributes() {
        return ['position'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Only touch the label: a full re-render would wipe what the user typed.
        if (oldValue !== newValue && this.#rendered) this.#updateLabel();
    }

    // The parent sets these before appending the element.
    get answerId() { return this.#id; }

    get questionId() { return this.#questionId; }
    set questionId(value) { this.#questionId = value; }

    get multiple() { return this.#multiple; }
    set multiple(value) { this.#multiple = Boolean(value); }

    get position() { return Number(this.getAttribute('position')) || 1; }
    set position(value) { this.setAttribute('position', String(value)); }

    set removable(value) {
        const button = this.querySelector('[data-action="remove"]');
        if (button) button.disabled = !value;
    }

    get text() {
        return this.querySelector('[data-role="text"]')?.value.trim() ?? '';
    }

    get correctInput() {
        return this.querySelector('[data-role="is-answer"]');
    }

    get isCorrect() {
        return this.correctInput?.checked ?? false;
    }

    connectedCallback() {
        if (this.#rendered) return;
        this.#rendered = true;

        const id = `${this.#questionId}-${this.#id}`;
        const inputType = this.#multiple ? 'checkbox' : 'radio';
        // One shared name per question makes the radios a real group.
        const groupName = `${this.#questionId}-is-answer`;

        this.innerHTML = `
            <div class="d-flex flex-row justify-content-between">
                <label for="${id}-text">
                    <span data-role="label"></span>
                    <input id="${id}-text" name="${id}-text" data-role="text"
                        type="text" placeholder="Write possible answer here" required>
                </label>
                <label for="${id}-is-answer">
                    Is answer?
                    <input id="${id}-is-answer" name="${groupName}" data-role="is-answer"
                        type="${inputType}" value="${this.#id}" ${this.#multiple ? '' : 'required'}>
                </label>
                <button type="button" data-action="remove">- Remove answer</button>
            </div>
        `;

        this.querySelector('[data-action="remove"]').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('answer-remove-request', { bubbles: true }));
        });

        this.#updateLabel();
    }

    #updateLabel() {
        const label = this.querySelector('[data-role="label"]');
        if (label) label.textContent = `Answer ${this.position}`;
    }
}

class QuizQuestion extends HTMLElement {
    #id = `q${++uid}`;
    #rendered = false;

    static get observedAttributes() {
        return ['position'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.#rendered) this.#updateHeading();
    }

    get questionId() { return this.#id; }

    // Set `type` before the element is connected; it decides the answer controls.
    get type() { return this.getAttribute('type') === 'checkbox' ? 'checkbox' : 'radio'; }
    set type(value) { this.setAttribute('type', value === 'checkbox' ? 'checkbox' : 'radio'); }

    get multiple() { return this.type === 'checkbox'; }

    get position() { return Number(this.getAttribute('position')) || 1; }
    set position(value) { this.setAttribute('position', String(value)); }

    get answers() { return [...this.querySelectorAll('quiz-answer')]; }

    get text() {
        return this.querySelector('[data-role="question"]')?.value.trim() ?? '';
    }

    connectedCallback() {
        if (this.#rendered) return;
        this.#rendered = true;

        this.innerHTML = `
            <div class="mb-4">
                <h2 data-role="heading"></h2>
                <div class="d-flex flex-row gap-5 bg-danger text-white">
                    <div>
                        <span>Type:</span>
                        <span id="${this.#id}-type">${QUESTION_TYPES[this.type]}</span>
                    </div>
                    <label for="${this.#id}-question">
                        <input id="${this.#id}-question" name="${this.#id}-question"
                            data-role="question" type="text"
                            placeholder="Write question here" required>
                    </label>
                    <button type="button" data-action="remove-question">X (Remove)</button>
                </div>
                <div>
                    <div class="d-flex flex-row justify-content-between">
                        <h3>Possible Answers</h3>
                        <button type="button" data-action="add-answer">+ Add Answer</button>
                    </div>
                    <div data-role="answers"></div>
                </div>
            </div>
        `;

        this.addEventListener('click', (event) => {
            const action = event.target.closest('[data-action]')?.dataset.action;
            if (action === 'add-answer') this.addAnswer().querySelector('input')?.focus();
            if (action === 'remove-question') {
                this.dispatchEvent(new CustomEvent('question-remove-request', { bubbles: true }));
            }
        });

        this.addEventListener('answer-remove-request', (event) => {
            event.stopPropagation();
            if (this.answers.length <= MIN_ANSWERS) return;
            event.target.remove();
            this.#refresh();
        });

        this.addEventListener('change', () => this.#syncValidity());

        this.#updateHeading();
        for (let i = 0; i < MIN_ANSWERS; i++) this.addAnswer();
    }

    addAnswer() {
        const answer = document.createElement('quiz-answer');
        answer.questionId = this.#id;
        answer.multiple = this.multiple;
        this.querySelector('[data-role="answers"]').append(answer);
        this.#refresh();
        return answer;
    }

    toJSON() {
        const answers = this.answers;
        return {
            question: this.text,
            type: this.type,
            possibleAnswers: answers.map((a) => a.text),
            correctAnswers: answers.flatMap((a, i) => (a.isCorrect ? [i] : [])),
        };
    }

    #updateHeading() {
        const heading = this.querySelector('[data-role="heading"]');
        if (heading) heading.textContent = `Question ${this.position}`;
    }

    #refresh() {
        const answers = this.answers;
        answers.forEach((answer, i) => {
            answer.position = i + 1;
            answer.removable = answers.length > MIN_ANSWERS;
        });
        this.#syncValidity();
    }

    // Radios use `required`; checkbox groups need "at least one" checked.
    #syncValidity() {
        if (!this.multiple) return;
        const inputs = this.answers.map((a) => a.correctInput).filter(Boolean);
        const noneChecked = !inputs.some((input) => input.checked);
        inputs.forEach((input, i) => {
            input.setCustomValidity(i === 0 && noneChecked ? 'Mark at least one correct answer' : '');
        });
    }
}

class QuizBuilder extends HTMLElement {
    #rendered = false;

    get questions() { return [...this.querySelectorAll('quiz-question')]; }

    connectedCallback() {
        if (this.#rendered) return;
        this.#rendered = true;

        this.innerHTML = `
            <div class="d-flex flex-row gap-2 mb-3">
                <label>
                    Type
                    <select data-role="new-type">
                        ${Object.entries(QUESTION_TYPES)
                .map(([value, label]) => `<option value="${value}">${label}</option>`)
                .join('')}
                    </select>
                </label>
                <button type="button" data-action="add-question">Add Question</button>
            </div>
            <div data-role="questions"></div>
        `;

        this.addEventListener('click', (event) => {
            if (event.target.closest('[data-action="add-question"]')) {
                const type = this.querySelector('[data-role="new-type"]').value;
                this.addQuestion(type).querySelector('[data-role="question"]')?.focus();
            }
        });

        this.addEventListener('question-remove-request', (event) => {
            event.target.remove();
            this.#renumber();
        });

        this.addQuestion('radio');
    }

    addQuestion(type = 'radio') {
        const question = document.createElement('quiz-question');
        question.type = type;
        this.querySelector('[data-role="questions"]').append(question);
        this.#renumber();
        return question;
    }

    // Value to store, e.g. in Firestore: an array of plain objects.
    toJSON() {
        return this.questions.map((q) => q.toJSON());
    }

    #renumber() {
        this.questions.forEach((q, i) => { q.position = i + 1; });
    }
}

customElements.define('quiz-answer', QuizAnswer);
customElements.define('quiz-question', QuizQuestion);
customElements.define('quiz-builder', QuizBuilder);

export { QuizBuilder, QuizQuestion, QuizAnswer };