/***********************
 * Utilities
 ***********************/
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/***********************
 * Password
 ***********************/
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

/***********************
 * State
 ***********************/
let data = {};
let currentSubject = "";
let currentQuestions = [];
let currentIndex = 0;
let answeredStatus = {};
let flaggedQuestions = {};
let shuffledAnswersMap = {};
let startTime = Date.now();

/***********************
 * DOM
 ***********************/
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
const retryWrongBtn = document.getElementById("retryWrongBtn");
const reviewFlaggedBtn = document.getElementById("reviewFlaggedBtn");
const backToFullQuizBtn = document.getElementById("backToFullQuizBtn");
const shuffleToggle = document.getElementById("shuffleToggle");

const feedback = document.createElement("div");
feedback.id = "feedbackMessage";
feedback.style.marginTop = "10px";
feedback.style.fontWeight = "bold";
optionsList.insertAdjacentElement("afterend", feedback);

/***********************
 * Persistence
 ***********************/
function saveState() {
  localStorage.setItem("quizState", JSON.stringify({
    currentSubject,
    currentQuestions,
    currentIndex,
    answeredStatus,
    flaggedQuestions,
    shuffledAnswersMap
  }));
}

function loadState() {
  const saved = JSON.parse(localStorage.getItem("quizState"));
  if (!saved) return false;

  currentSubject = saved.currentSubject;
  currentQuestions = saved.currentQuestions;
  currentIndex = saved.currentIndex;
  answeredStatus = saved.answeredStatus || {};
  flaggedQuestions = saved.flaggedQuestions || {};
  shuffledAnswersMap = saved.shuffledAnswersMap || {};

  subjectSelect.value = currentSubject;
  renderPagination();
  displayQuestion();
  return true;
}

/***********************
 * Load questions
 ***********************/
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

    loadState();
  });

/***********************
 * Subject change
 ***********************/
subjectSelect.addEventListener("change", () => {
  currentSubject = subjectSelect.value;
  currentQuestions = [...data[currentSubject]];
  if (shuffleToggle.checked) shuffleArray(currentQuestions);

  currentIndex = 0;
  answeredStatus = {};
  flaggedQuestions = {};
  shuffledAnswersMap = {};
  startTime = Date.now();

  renderPagination();
  displayQuestion();
  saveState();
});

/***********************
 * Display question
 ***********************/
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

  if (!shuffledAnswersMap[currentIndex]) {
    shuffledAnswersMap[currentIndex] = shuffleArray([...q.choices]);
  }

  shuffledAnswersMap[currentIndex].forEach((choice, i) => {
    const label = document.createElement("label");

    label.innerHTML = `
      <input type="radio" name="option" value="${choice}">
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

      feedback.textContent = isCorrect ? "Correct!" : "Incorrect";
      feedback.style.color = isCorrect ? "green" : "red";

      updatePaginationColors();
      saveState();
      displayQuestion();

      if (isCorrect) {
        setTimeout(() => {
          if (currentIndex < currentQuestions.length - 1) {
            currentIndex++;
            saveState();
            displayQuestion();
          }
        }, 800);
      }
    });

    optionsList.appendChild(label);
  });

  updatePaginationColors();
}

/***********************
 * Navigation
 ***********************/
prevBtn.onclick = () => {
  if (currentIndex > 0) {
    currentIndex--;
    saveState();
    displayQuestion();
  }
};

nextBtn.onclick = () => {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    saveState();
    displayQuestion();
  }
};

/***********************
 * Keyboard
 ***********************/
document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  const radios = document.querySelectorAll(".custom-option-list input");

  if (!answeredStatus[currentIndex] && ["a", "b", "c", "d"].includes(key)) {
    const index = { a: 0, b: 1, c: 2, d: 3 }[key];
    radios[index]?.click();
  }

  if (key === "arrowright") nextBtn.click();
  if (key === "arrowleft") prevBtn.click();
});

/***********************
 * Finish
 ***********************/
finishBtn.onclick = finishBtnSide.onclick = () => {
  resultScreen.classList.remove("hidden");
  localStorage.removeItem("quizState");
};

/***********************
 * Retry wrong
 ***********************/
retryWrongBtn.onclick = () => {
  currentQuestions = Object.entries(answeredStatus)
    .filter(([_, a]) => !a.isCorrect)
    .map(([i]) => currentQuestions[i]);

  currentIndex = 0;
  answeredStatus = {};
  flaggedQuestions = {};
  shuffledAnswersMap = {};

  renderPagination();
  displayQuestion();
  saveState();
};

/***********************
 * Review flagged
 ***********************/
reviewFlaggedBtn.onclick = () => {
  currentQuestions = currentQuestions.filter((_, i) => flaggedQuestions[i]);
  currentIndex = 0;
  answeredStatus = {};
  shuffledAnswersMap = {};

  renderPagination();
  displayQuestion();
  saveState();
};

/***********************
 * Back to full quiz
 ***********************/
backToFullQuizBtn.onclick = () => {
  currentQuestions = [...data[currentSubject]];
  if (shuffleToggle.checked) shuffleArray(currentQuestions);

  currentIndex = 0;
  answeredStatus = {};
  flaggedQuestions = {};
  shuffledAnswersMap = {};

  renderPagination();
  displayQuestion();
  saveState();
};

/***********************
 * Pagination
 ***********************/
function renderPagination() {
  pagination.innerHTML = "";
  currentQuestions.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.onclick = () => {
      currentIndex = i;
      saveState();
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

/***********************
 * Flagging
 ***********************/
flagBtnNav.onclick = () => {
  flaggedQuestions[currentIndex]
    ? delete flaggedQuestions[currentIndex]
    : flaggedQuestions[currentIndex] = true;

  saveState();
  updatePaginationColors();
};

/***********************
 * Theme
 ***********************/
document.getElementById("themeToggle").addEventListener("change", e => {
  document.body.classList.toggle("dark", e.target.checked);
});
