// === Utility Functions ===
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// === Password Check ===
function checkPassword() {
  const correctPassword = "bier";
  const input = document.getElementById("accessInput").value;
  const error = document.getElementById("errorMsg");

  if (input === correctPassword) {
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("quizApp").style.display = "block";
  } else {
    error.textContent = "Incorrect password. Try again.";
  }
}

// === Variables ===
let data = {};
let currentIndex = 0;
let currentSubject = "";
let currentQuestions = [];
let answeredStatus = {};
let flaggedQuestions = {};
let shuffledChoicesMap = {}; // ✅ stores shuffled answers per question
let startTime = Date.now();

const subjectSelect = document.getElementById("subjectSelect");
const questionIndex = document.getElementById("questionIndex");
const questionText = document.getElementById("questionText");
const optionsList = document.getElementById("optionsList");
const questionContainer = document.getElementById("questionContainer");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const finishBtn = document.getElementById("finishBtn");
const finishBtnSide = document.getElementById("finishBtnSide");
const flagBtnNav = document.getElementById("flagBtnNav");
const pagination = document.getElementById("pagination");
const resultScreen = document.getElementById("resultScreen");
const scoreText = document.getElementById("scoreText");
const restartBtn = document.getElementById("restartBtn");
const retryWrongBtn = document.getElementById("retryWrongBtn");
const reviewFlaggedBtn = document.getElementById("reviewFlaggedBtn");
const backToFullQuizBtn = document.getElementById("backToFullQuizBtn");
const shuffleToggle = document.getElementById("shuffleToggle");

const feedback = document.createElement("div");
feedback.id = "feedbackMessage";
feedback.style.marginTop = "10px";
feedback.style.fontWeight = "bold";
optionsList.insertAdjacentElement("afterend", feedback);

// === Load Questions ===
fetch("questions.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    for (let subject in data) {
      const opt = document.createElement("option");
      opt.value = subject;
      opt.textContent = subject;
      subjectSelect.appendChild(opt);
    }
  });

// === Subject Change ===
subjectSelect.addEventListener("change", () => {
  currentSubject = subjectSelect.value;
  currentQuestions = [...data[currentSubject]];
  if (shuffleToggle.checked) shuffle(currentQuestions);

  currentIndex = 0;
  answeredStatus = {};
  flaggedQuestions = {};
  shuffledChoicesMap = {}; // reset shuffled answers

  resultScreen.classList.add("hidden");
  startTime = Date.now();
  renderPagination();
  displayQuestion();
});

// === Shuffle Questions ===
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// === Save Progress ===
function saveProgress() {
  localStorage.setItem("quizState", JSON.stringify({
    currentSubject,
    currentIndex,
    answeredStatus,
    flaggedQuestions
  }));
}

// === Display Question ===
function displayQuestion() {
  const q = currentQuestions[currentIndex];
  questionIndex.textContent = `${currentIndex + 1} / ${currentQuestions.length}`;
  questionText.textContent = q.question;
  optionsList.innerHTML = "";
  feedback.textContent = "";

  questionContainer.classList.remove("correct", "wrong");
  if (answeredStatus[currentIndex]) {
    questionContainer.classList.add(
      answeredStatus[currentIndex].isCorrect ? "correct" : "wrong"
    );
  }

  // ✅ Shuffle answers ONCE per question
  if (!shuffledChoicesMap[currentIndex]) {
    shuffledChoicesMap[currentIndex] = shuffleArray([...q.choices]);
  }

  const choices = shuffledChoicesMap[currentIndex];

  choices.forEach((choice, i) => {
    const id = `opt${i}`;
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.innerHTML = `
      <input type="radio" name="option" id="${id}" value="${choice}" />
      ${choice}
    `;

    if (answeredStatus[currentIndex]) {
      const selected = answeredStatus[currentIndex].selected;
      if (choice === q.answer) label.classList.add("correct");
      if (choice === selected && choice !== q.answer) label.classList.add("wrong");
      label.querySelector("input").disabled = true;
    }

    label.querySelector("input").addEventListener("change", () => {
      if (answeredStatus[currentIndex]) return;

      const isCorrect = choice === q.answer;
      answeredStatus[currentIndex] = { selected: choice, isCorrect };
      saveProgress();

      feedback.textContent = isCorrect ? "Correct!" : "Incorrect";
      feedback.style.color = isCorrect ? "green" : "red";

      displayQuestion();
      updatePaginationColors();

      if (isCorrect) {
        setTimeout(() => {
          if (currentIndex < currentQuestions.length - 1) {
            currentIndex++;
            displayQuestion();
          }
        }, 800);
      }
    });

    optionsList.appendChild(label);
  });

  updatePaginationColors();
}

// === Navigation Buttons ===
prevBtn.onclick = () => {
  if (currentIndex > 0) {
    currentIndex--;
    displayQuestion();
  }
};

nextBtn.onclick = () => {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    displayQuestion();
  }
};

// === Keyboard Support (FIXED & WORKING) ===
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const options = optionsList.querySelectorAll("input[type='radio']");
  const hasAnswered = answeredStatus[currentIndex];

  // A / B / C / D selection
  if (!hasAnswered && ["a", "b", "c", "d"].includes(key)) {
    const index = { a: 0, b: 1, c: 2, d: 3 }[key];
    if (options[index]) options[index].click();
  }

  // Arrow navigation
  if (key === "arrowright" && currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    displayQuestion();
  }

  if (key === "arrowleft" && currentIndex > 0) {
    currentIndex--;
    displayQuestion();
  }
});

// === Pagination ===
function renderPagination() {
  pagination.innerHTML = "";
  currentQuestions.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.onclick = () => {
      currentIndex = i;
      displayQuestion();
    };
    pagination.appendChild(btn);
  });
  updatePaginationColors();
}

function updatePaginationColors() {
  const buttons = pagination.querySelectorAll("button");
  buttons.forEach((btn, i) => {
    btn.classList.remove("correct", "wrong", "flagged");
    if (answeredStatus[i]?.isCorrect) btn.classList.add("correct");
    if (answeredStatus[i] && !answeredStatus[i].isCorrect) btn.classList.add("wrong");
    if (flaggedQuestions[i]) btn.classList.add("flagged");
  });
}

// === Flag Question ===
flagBtnNav.onclick = () => {
  flaggedQuestions[currentIndex] = !flaggedQuestions[currentIndex];
  saveProgress();
  updatePaginationColors();
};
