import { db } from "/src/firebaseConfig.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const answers = {}; // filled in from Firestore

async function loadQuestions() {
  const snapshot = await getDocs(
    query(collection(db, "quiz"), orderBy("order")),
  );
  const box = document.getElementById("questions");

  snapshot.forEach((docSnap) => {
    const q = docSnap.data();
    const name = docSnap.id;
    answers[name] = q.answer;

    let html = `<div class="quiz"><hr /><h1 class="question">${q.question}</h1>`;
    q.options.forEach((option, i) => {
      html += `
        <div class="each-quiz form-check">
          <input class="form-check-input" type="radio" name="${name}" id="${name}-${i}" value="${option}" />
          <label class="form-check-label" for="${name}-${i}">${option}</label>
        </div>`;
    });
    html += `</div>`;
    box.innerHTML += html;
  });
}

loadQuestions();

document
  .getElementById("quizForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    let score = 0;

    for (const name in answers) {
      const picked = document.querySelector(`input[name="${name}"]:checked`);
      if (picked && picked.value === answers[name]) score++;
    }

    document.getElementById("score").textContent =
      `You got ${score} out of ${Object.keys(answers).length}!`;
  });
