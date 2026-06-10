function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildCombinedSlot(colorFile, lifeFile, withQMark) {
  const colorData = IMAGE_DATA.find(d => d.file === colorFile);
  const lifeData  = IMAGE_DATA.find(d => d.file === lifeFile);
  const colorValue = withQMark ? colorData.modified : colorData.primary;
  const lifeValue  = withQMark ? lifeData.modified  : lifeData.primary;
  const answer = `${colorValue} ${lifeValue}`;
  return {
    type: 'combined',
    colorFile, lifeFile, withQMark,
    answer,
    options: [...COMBINED_CHOICES],
    correctIndex: COMBINED_CHOICES.indexOf(answer),
    timerValue: null,
  };
}

// Collapses a color slot + life slot into one combined slot (placed at position 0)
function mergeColorLifePair(slots) {
  const colorSlot = slots.find(s => COLOR_FILES.has(s.file));
  const lifeSlot  = slots.find(s => LIFE_FILES.has(s.file));
  if (!colorSlot || !lifeSlot) return slots;
  const combined = buildCombinedSlot(colorSlot.file, lifeSlot.file, colorSlot.withQMark);
  return [combined, ...slots.filter(s => s !== colorSlot && s !== lifeSlot)];
}

function hasCoOccurrenceViolation(set) {
  const files = new Set(set.map(s => s.file));
  const hasColor = [...COLOR_FILES].some(f => files.has(f));
  const hasLife  = [...LIFE_FILES].some(f => files.has(f));
  return hasColor !== hasLife;
}

function sortSlots(slots) {
  return [...slots].sort((a, b) =>
    (FILE_DISPLAY_ORDER[a.file] ?? 99) - (FILE_DISPLAY_ORDER[b.file] ?? 99)
  );
}

// Assigns shuffled timer values to numbered slots and returns the updated slots
// plus an answerOrder array (slot indices in ascending timer order).
function assignTimerOrder(slots) {
  const numberedIdx = slots
    .map((s, i) => i)
    .filter(i => slots[i].type === 'combined' || !NO_TIMER_FILES.has(slots[i].file));

  const timerValues = shuffle(numberedIdx.map((_, k) => (k + 1) * 10));

  const updatedSlots = slots.map(s => ({ ...s, timerValue: null }));
  numberedIdx.forEach((slotIdx, k) => {
    updatedSlots[slotIdx] = { ...updatedSlots[slotIdx], timerValue: timerValues[k] };
  });

  const answerOrder = [...numberedIdx].sort(
    (a, b) => updatedSlots[a].timerValue - updatedSlots[b].timerValue
  );

  return { slots: updatedSlots, answerOrder };
}

function hasConflict(slots) {
  const files = slots.map(s => s.file);
  return CONFLICTING_PAIRS.some(([a, b]) => files.includes(a) && files.includes(b));
}

// All unique values across all images, used to generate wrong answer choices
const ALL_VALUES = [...new Set(IMAGE_DATA.flatMap(d => [d.primary, d.modified]))];

function generateChoices(correctAnswer) {
  const wrong = ALL_VALUES.filter(v => v !== correctAnswer);
  shuffle(wrong);
  const chosen = wrong.slice(0, 3);
  const all = shuffle([correctAnswer, ...chosen]);
  return { options: all, correctIndex: all.indexOf(correctAnswer) };
}

function buildSlot(file, withQMark) {
  const data = IMAGE_DATA.find(d => d.file === file);
  const answer = withQMark ? data.modified : data.primary;
  const { options, correctIndex } = generateChoices(answer);
  return { file, withQMark, answer, options, correctIndex };
}

function buildChaosQuestion() {
  let pool = [...IMAGE_DATA];
  for (const [fileA, fileB] of CONFLICTING_PAIRS) {
    const hasA = pool.some(d => d.file === fileA);
    const hasB = pool.some(d => d.file === fileB);
    if (hasA && hasB) {
      const drop = Math.random() < 0.5 ? fileA : fileB;
      pool = pool.filter(d => d.file !== drop);
    }
  }
  const combinedWithQMark = Math.random() < 0.5;
  const rawSlots = mergeColorLifePair(
    sortSlots(pool.map(entry => {
      const isColorOrLife = COLOR_FILES.has(entry.file) || LIFE_FILES.has(entry.file);
      return buildSlot(entry.file, isColorOrLife ? combinedWithQMark : Math.random() < 0.5);
    }))
  );
  const { slots, answerOrder } = assignTimerOrder(rawSlots);
  return { slots, answerOrder };
}

function buildChaosQuestions() {
  return [buildChaosQuestion()];
}

const VALID_WRETCH_SETS = WRETCH_QUESTIONS.filter(set => !hasConflict(set) && !hasCoOccurrenceViolation(set));

function buildWretchQuestion() {
  const set = VALID_WRETCH_SETS[Math.floor(Math.random() * VALID_WRETCH_SETS.length)];
  const rawSlots = mergeColorLifePair(sortSlots(set.map(s => buildSlot(s.file, s.withQMark))));
  const { slots, answerOrder } = assignTimerOrder(rawSlots);
  return { slots, answerOrder };
}

function buildQuestions() {
  if (selectedDifficulty === 'normal') {
    return [buildWretchQuestion()];
  }
  if (selectedDifficulty === 'chaos') {
    return buildChaosQuestions();
  }

  // Fool: single-slot questions (one per image, primary + modified)
  const pool = [];
  IMAGE_DATA.forEach(entry => {
    pool.push({ slots: [buildSlot(entry.file, false)], answerOrder: [0] });
    pool.push({ slots: [buildSlot(entry.file, true)],  answerOrder: [0] });
  });
  return pool;
}
