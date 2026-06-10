const STATS_KEY = 'kefkasays_stats';

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function recordAnswer(file, isCorrect) {
  const stats = loadStats();
  if (!stats[file]) stats[file] = { correct: 0, wrong: 0 };
  if (isCorrect) stats[file].correct++;
  else stats[file].wrong++;
  saveStats(stats);
}

function clearStats() {
  localStorage.removeItem(STATS_KEY);
}

function buildStatsEntries() {
  const stats = loadStats();
  return IMAGE_DATA
    .map(d => {
      const s = stats[d.file] || { correct: 0, wrong: 0 };
      const total = s.correct + s.wrong;
      const pct = total > 0 ? Math.round((s.correct / total) * 100) : null;
      return { file: d.file, name: d.primary, correct: s.correct, wrong: s.wrong, total, pct };
    })
    .filter(e => e.total > 0)
    .sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));
}

function renderStatsInto(rowsEl) {
  const entries = buildStatsEntries();

  if (entries.length === 0) {
    rowsEl.innerHTML = '<div style="font-size:0.8rem; color:var(--dim); letter-spacing:1px;">No data yet — answer some questions to see your breakdown.</div>';
    return;
  }

  rowsEl.innerHTML = '';
  entries.forEach(e => {
    const row = document.createElement('div');
    row.className = 'stat-row';

    const img = document.createElement('img');
    img.src = e.file;
    img.className = 'stat-img';

    const info = document.createElement('div');
    info.className = 'stat-info';

    const header = document.createElement('div');
    header.className = 'stat-header';

    const name = document.createElement('span');
    name.className = 'stat-name';
    name.textContent = e.name;

    const pctLabel = document.createElement('span');
    pctLabel.className = 'stat-pct' + (e.pct >= 70 ? ' good' : e.pct >= 40 ? ' mid' : ' bad');
    pctLabel.textContent = e.pct + '%';

    header.appendChild(name);
    header.appendChild(pctLabel);

    const bar = document.createElement('div');
    bar.className = 'stat-bar';
    const fill = document.createElement('div');
    fill.className = 'stat-bar-fill' + (e.pct >= 70 ? ' good' : e.pct >= 40 ? ' mid' : ' bad');
    fill.style.width = e.pct + '%';
    bar.appendChild(fill);

    const counts = document.createElement('div');
    counts.className = 'stat-counts';
    counts.innerHTML = `<span class="stat-correct">${e.correct} correct</span><span class="stat-wrong">${e.wrong} wrong</span>`;

    info.appendChild(header);
    info.appendChild(bar);
    info.appendChild(counts);
    row.appendChild(img);
    row.appendChild(info);
    rowsEl.appendChild(row);
  });
}

function renderStatsBreakdown() {
  const el = document.getElementById('stats-rows');
  if (el) renderStatsInto(el);
}

function renderStatsPage() {
  const el = document.getElementById('stats-rows-page');
  if (el) renderStatsInto(el);
}
