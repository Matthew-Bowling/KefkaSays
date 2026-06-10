// ════════════════════════════════════════════════════════════
//  DIFFICULTY
// ════════════════════════════════════════════════════════════
let selectedDifficulty = 'normal';
let TIMER_DURATION = 30;

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedDifficulty = btn.dataset.diff;
    TIMER_DURATION = TIMER_BY_DIFFICULTY[selectedDifficulty];
    updateQuestionCountLabel();
  });
});

// ════════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════════
let currentQ = 0;
let currentSlot = 0;
let slotResults = [];
let score = 0;
let questionsAttempted = 0;
let debuffsAnswered = 0;
let answered = false;
let activeQuestions = [];
let timerInterval = null;
let autoNextTimer = null;
let timeLeft = 0;

// ════════════════════════════════════════════════════════════
//  SCREENS
// ════════════════════════════════════════════════════════════
const screens = {
  title: document.getElementById('title-screen'),
  quiz:  document.getElementById('quiz-screen'),
  score: document.getElementById('score-screen'),
  stats: document.getElementById('stats-screen'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ════════════════════════════════════════════════════════════
//  TITLE UI
// ════════════════════════════════════════════════════════════
function updateQuestionCountLabel() {
  let count;
  if (selectedDifficulty === 'normal') count = '∞';
  else if (selectedDifficulty === 'chaos') count = '∞';
  else count = IMAGE_DATA.length * 2;
  document.getElementById('question-count-label').textContent = count;
}
updateQuestionCountLabel();

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);
document.getElementById('quit-btn').addEventListener('click', () => showScreen('title'));
document.getElementById('clear-stats-btn').addEventListener('click', () => {
  clearStats();
  renderStatsBreakdown();
});
document.getElementById('view-stats-btn').addEventListener('click', () => {
  renderStatsPage();
  showScreen('stats');
});
document.getElementById('stats-back-btn').addEventListener('click', () => showScreen('title'));
document.getElementById('clear-stats-page-btn').addEventListener('click', () => {
  clearStats();
  renderStatsPage();
});

// ════════════════════════════════════════════════════════════
//  TIMER
// ════════════════════════════════════════════════════════════
function startTimer() {
  timeLeft = TIMER_DURATION;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearTimer();
      autoFail();
    }
  }, 1000);
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function clearAutoNext() {
  if (autoNextTimer !== null) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }
}

function updateTimerDisplay() {
  const fill = document.getElementById('timer-fill');
  const num  = document.getElementById('timer-number');
  const pct  = (timeLeft / TIMER_DURATION) * 100;

  fill.style.width = pct + '%';
  num.textContent  = timeLeft;

  fill.className = 'timer-bar-fill';
  num.className  = 'timer-number';
  if (pct <= 25) {
    fill.classList.add('danger');
    num.classList.add('danger');
  } else if (pct <= 50) {
    fill.classList.add('warning');
    num.classList.add('warning');
  }
}

function autoFail() {
  if (answered) return;
  answered = true;
  questionsAttempted++;

  const q = activeQuestions[currentQ];

  // Mark current and remaining slots visually
  if (q.slots.length > 1) {
    for (let step = currentSlot; step < q.answerOrder.length; step++) {
      const slotEl = document.getElementById(`slot-${q.answerOrder[step]}`);
      if (slotEl) {
        slotEl.classList.remove('active');
        slotEl.classList.add(selectedDifficulty === 'chaos' ? 'slot-done' : 'slot-wrong');
      }
    }
  }

  // Reveal correct answer for the slot that was active when time ran out
  const activeIdx = q.answerOrder[currentSlot] ?? q.answerOrder[q.answerOrder.length - 1];
  const slot = q.slots[activeIdx];

  // Record all unanswered slots as wrong
  for (let step = currentSlot; step < q.answerOrder.length; step++) {
    const s = q.slots[q.answerOrder[step]];
    debuffsAnswered++;
    if (s.type === 'combined') {
      recordAnswer(s.colorFile, false);
      recordAnswer(s.lifeFile, false);
    } else {
      recordAnswer(s.file, false);
    }
  }

  document.querySelectorAll('.choice-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === slot.correctIndex) btn.classList.add('reveal-correct');
  });

  kefkaWrong();

  const reaction = document.getElementById('kefka-reaction');
  reaction.className = 'kefka-reaction wrong-reaction';
  document.getElementById('reaction-text').textContent = pick(TIME_UP_REACTIONS);

  document.getElementById('next-btn').style.display = 'block';
  autoNextTimer = setTimeout(() => {
    autoNextTimer = null;
    currentQ++;
    if (selectedDifficulty === 'chaos') activeQuestions.push(buildChaosQuestion());
    if (selectedDifficulty === 'normal') activeQuestions.push(buildWretchQuestion());
    if (currentQ >= activeQuestions.length) {
      showScore();
    } else {
      loadQuestion();
    }
  }, 7000);
}

// ════════════════════════════════════════════════════════════
//  GAME FLOW
// ════════════════════════════════════════════════════════════
function setChaosUI(isChaos) {
  document.getElementById('progress-wrap').style.display   = isChaos ? 'none' : 'block';
  document.getElementById('chaos-score-row').classList.toggle('visible', isChaos);
  document.getElementById('chaos-flee-btn').style.display  = 'block';
}

function startGame() {
  TIMER_DURATION = TIMER_BY_DIFFICULTY[selectedDifficulty];
  currentQ = 0;
  score = 0;
  questionsAttempted = 0;
  debuffsAnswered = 0;
  activeQuestions = shuffle(buildQuestions());
  setChaosUI(selectedDifficulty === 'chaos' || selectedDifficulty === 'normal');
  showScreen('quiz');
  loadQuestion();
}

document.getElementById('chaos-flee-btn').addEventListener('click', showScore);

// ════════════════════════════════════════════════════════════
//  RENDERING
// ════════════════════════════════════════════════════════════
function renderImageArea(q) {
  const area = document.getElementById('image-area');
  area.innerHTML = '';

  if (q.slots.length === 1) {
    const slot = q.slots[0];
    if (slot.withQMark) {
      area.className = 'image-area dual';
      const debuffRow = document.createElement('div');
      debuffRow.className = 'debuff-row';
      const qmarkImg = document.createElement('img');
      qmarkImg.src = 'images/QuestionMark.png';
      qmarkImg.alt = 'Question Mark';
      debuffRow.appendChild(qmarkImg);
      const mainSlot = document.createElement('div');
      mainSlot.className = 'main-slot';
      const mainImg = document.createElement('img');
      mainImg.src = slot.file;
      mainImg.alt = 'Subject';
      mainSlot.appendChild(mainImg);
      area.appendChild(debuffRow);
      area.appendChild(mainSlot);
    } else {
      area.className = 'image-area single';
      const img = document.createElement('img');
      img.src = slot.file;
      img.alt = 'Subject';
      area.appendChild(img);
    }
  } else {
    area.className = 'image-area multi';
    q.slots.forEach((slot, i) => {
      const isFirstActive = selectedDifficulty !== 'chaos' && q.answerOrder[0] === i;
      const slotEl = document.createElement('div');
      const isCombined = slot.type === 'combined';
      slotEl.className = 'image-slot'
        + (isFirstActive ? ' active' : '')
        + (isCombined ? ' combined-slot-wrap' : '')
        + (isCombined && selectedDifficulty !== 'chaos' ? ' combined-slot-highlight' : '');
      slotEl.id = `slot-${i}`;

      if (isCombined) {
        if (slot.withQMark) {
          const qm = document.createElement('img');
          qm.src = 'images/QuestionMark.png';
          qm.className = 'slot-qmark';
          slotEl.appendChild(qm);
        } else {
          const sp = document.createElement('div');
          sp.className = 'slot-qmark-spacer';
          slotEl.appendChild(sp);
        }
        const combinedIcons = document.createElement('div');
        combinedIcons.className = 'combined-icons';
        for (const file of [slot.colorFile, slot.lifeFile]) {
          const img = document.createElement('img');
          img.src = file;
          img.className = 'combined-slot-img';
          combinedIcons.appendChild(img);
        }
        slotEl.appendChild(combinedIcons);
      } else {
        if (slot.withQMark) {
          const qmark = document.createElement('img');
          qmark.src = 'images/QuestionMark.png';
          qmark.alt = 'QMark';
          qmark.className = 'slot-qmark';
          slotEl.appendChild(qmark);
        } else {
          const spacer = document.createElement('div');
          spacer.className = 'slot-qmark-spacer';
          slotEl.appendChild(spacer);
        }
        const img = document.createElement('img');
        img.src = slot.file;
        img.alt = `Slot ${i + 1}`;
        img.className = 'slot-img';
        slotEl.appendChild(img);
      }

      if (slot.timerValue !== null && slot.timerValue !== undefined) {
        const timerLabel = document.createElement('div');
        timerLabel.className = 'slot-timer';
        timerLabel.textContent = slot.timerValue < 60 ? slot.timerValue : (slot.timerValue / 10 - 5) + 'm';
        slotEl.appendChild(timerLabel);
      }

      area.appendChild(slotEl);
    });
  }
}

function updateQuestionHeader(q, slotIdx) {
  const slot = q.slots[slotIdx];
  const badge = document.getElementById('type-badge');
  const isMulti = q.slots.length > 1;

  if (isMulti) {
    if (slot.type === 'combined') {
      badge.textContent = 'COMBINED';
      badge.className = 'type-badge combined';
      document.getElementById('q-text').textContent = 'What is the value of the two debuffs that are together?';
    } else {
      badge.textContent = `${slotIdx + 1} OF ${q.slots.length}`;
      badge.className = 'type-badge ' + (slot.withQMark ? 'modified' : 'primary');
      document.getElementById('q-text').textContent = slot.withQMark
        ? `Image ${slotIdx + 1}: The Question Mark has changed this. What is its value?`
        : `Image ${slotIdx + 1}: What is the value of this debuff?`;
    }
  } else {
    badge.textContent = slot.withQMark ? '? MODIFIED' : 'BASE VALUE';
    badge.className = 'type-badge ' + (slot.withQMark ? 'modified' : 'primary');
    document.getElementById('q-text').textContent = slot.withQMark
      ? 'The Question Mark has changed this image. What is its new value?'
      : 'What is the value of this debuff?';
  }
}

function renderChoices(slot) {
  const choicesWrap = document.getElementById('choices-wrap');
  choicesWrap.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];
  slot.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<span class="choice-label">${labels[i]}</span> ${opt}`;
    btn.addEventListener('click', () => selectAnswer(i));
    choicesWrap.appendChild(btn);
  });
}

// ════════════════════════════════════════════════════════════
//  KEFKA GIF ANIMATIONS
// ════════════════════════════════════════════════════════════
let kefkaTimer = null;

function clearKefkaTimer() {
  if (kefkaTimer !== null) {
    clearTimeout(kefkaTimer);
    clearInterval(kefkaTimer);
    kefkaTimer = null;
  }
}

function kefkaLaugh() {
  clearKefkaTimer();
  document.getElementById('kefka-gif').src = 'images/KefkaLaugh.gif';
}

function kefkaCorrect() {
  clearKefkaTimer();
  const gif = document.getElementById('kefka-gif');
  const frames = ['KefkaShocked', 'KefkaAngry', 'KefkaShocked', 'KefkaAngry', 'KefkaShocked', 'KefkaAngry', 'KefkaLaugh'];
  let step = 0;
  gif.src = 'images/' + frames[step++] + '.gif';
  kefkaTimer = setInterval(function() {
    gif.src = 'images/' + frames[step++] + '.gif';
    if (step >= frames.length) { clearInterval(kefkaTimer); kefkaTimer = null; }
  }, 450);
}

function kefkaWrong() {
  clearKefkaTimer();
  document.getElementById('kefka-gif').src = 'images/KefkaWrong.gif';
  kefkaTimer = setTimeout(kefkaLaugh, 2000);
}

// ════════════════════════════════════════════════════════════
//  QUESTION LIFECYCLE
// ════════════════════════════════════════════════════════════
function loadQuestion() {
  clearAutoNext();
  answered = false;
  currentSlot = 0;
  slotResults = [];
  const q = activeQuestions[currentQ];
  const total = activeQuestions.length;

  if (selectedDifficulty === 'chaos' || selectedDifficulty === 'normal') {
    document.getElementById('chaos-survived').textContent = score;
  } else {
    const pct = (currentQ / total) * 100;
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-label').textContent = `${currentQ} / ${total}`;
  }
  document.getElementById('q-number').textContent = `QUESTION ${currentQ + 1}`;

  renderImageArea(q);
  updateQuestionHeader(q, q.answerOrder[0]);
  renderChoices(q.slots[q.answerOrder[0]]);

  document.getElementById('kefka-reaction').className = 'kefka-reaction';
  document.getElementById('reaction-text').textContent = '';
  document.getElementById('next-btn').style.display = 'none';

  kefkaLaugh();
  startTimer();
}

function selectAnswer(chosen) {
  if (answered) return;

  const q = activeQuestions[currentQ];
  const slotIdx = q.answerOrder[currentSlot];
  const slot = q.slots[slotIdx];
  const correct = slot.correctIndex;
  const isCorrect = chosen === correct;

  slotResults.push(isCorrect);
  debuffsAnswered++;
  isCorrect ? kefkaCorrect() : kefkaWrong();

  if (slot.type === 'combined') {
    recordAnswer(slot.colorFile, isCorrect);
    recordAnswer(slot.lifeFile, isCorrect);
  } else {
    recordAnswer(slot.file, isCorrect);
  }

  const buttons = document.querySelectorAll('.choice-btn');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct && !isCorrect) btn.classList.add('reveal-correct');
  });
  buttons[chosen].classList.add(isCorrect ? 'correct' : 'wrong');

  if (q.slots.length > 1) {
    const slotEl = document.getElementById(`slot-${slotIdx}`);
    if (slotEl) {
      slotEl.classList.remove('active');
      if (selectedDifficulty === 'chaos') {
        slotEl.classList.add('slot-done');
      } else {
        slotEl.classList.add(isCorrect ? 'slot-correct' : 'slot-wrong');
      }
    }
  }

  currentSlot++;

  if (currentSlot < q.answerOrder.length) {
    if (selectedDifficulty === 'chaos' && isCorrect) {
      timeLeft += 3;
      updateTimerDisplay();
    }
    setTimeout(() => {
      const nextSlotIdx = q.answerOrder[currentSlot];
      if (selectedDifficulty !== 'chaos') {
        const nextEl = document.getElementById(`slot-${nextSlotIdx}`);
        if (nextEl) nextEl.classList.add('active');
      }
      updateQuestionHeader(q, nextSlotIdx);
      renderChoices(q.slots[nextSlotIdx]);
    }, 600);
  } else {
    answered = true;
    clearTimer();
    questionsAttempted++;

    const allCorrect = slotResults.every(r => r);
    if (allCorrect) score++;

    const reaction = document.getElementById('kefka-reaction');
    reaction.className = 'kefka-reaction ' + (allCorrect ? 'right-reaction' : 'wrong-reaction');
    document.getElementById('reaction-text').textContent = allCorrect
      ? pick(RIGHT_REACTIONS)
      : pick(WRONG_REACTIONS);

    document.getElementById('next-btn').style.display = 'block';
  }
}

document.getElementById('next-btn').addEventListener('click', () => {
  clearAutoNext();
  currentQ++;
  if (selectedDifficulty === 'chaos') activeQuestions.push(buildChaosQuestion());
  if (selectedDifficulty === 'normal') activeQuestions.push(buildWretchQuestion());
  if (currentQ >= activeQuestions.length) {
    showScore();
  } else {
    loadQuestion();
  }
});

// ════════════════════════════════════════════════════════════
//  SCORE SCREEN
// ════════════════════════════════════════════════════════════
function showScore() {
  clearTimer();
  let verdict;

  document.getElementById('final-attempted').textContent = debuffsAnswered;

  if (selectedDifficulty === 'chaos' || selectedDifficulty === 'normal') {
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-denom').textContent = '';
    document.getElementById('final-score-label').textContent = 'CORRECT';
    verdict = CHAOS_FINAL_REACTIONS.find(r => score >= r.minScore && score <= r.maxScore)
      || CHAOS_FINAL_REACTIONS[CHAOS_FINAL_REACTIONS.length - 1];
  } else {
    const total = activeQuestions.length;
    const pct = Math.round((score / total) * 100);
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-denom').textContent = `/ ${total}`;
    document.getElementById('final-score-label').textContent = 'CORRECT';
    verdict = FINAL_REACTIONS.find(r => pct >= r.minPct && pct <= r.maxPct)
      || FINAL_REACTIONS[FINAL_REACTIONS.length - 1];
    document.getElementById('progress-fill').style.width = '100%';
    document.getElementById('progress-label').textContent = `${total} / ${total}`;
  }

  document.getElementById('score-verdict').textContent = verdict.verdict;
  document.getElementById('score-verdict').style.color = verdict.color;
  document.getElementById('final-reaction-text').textContent = verdict.text;

  renderStatsBreakdown();
  showScreen('score');
}
