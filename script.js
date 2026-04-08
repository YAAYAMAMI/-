const MAX_DAY = 365;
const SAVE_KEY = "kamiyama_collection_save_v1";

const characters = [
  {
    id: "aoi",
    name: "葵",
    note: "真面目で読書好き。勉強が伸びやすい。",
    base: { study: 14, sports: 8, art: 10, social: 12, mood: 50 },
    growth: { study: 2, sports: 1, art: 1, social: 1 },
    pixel: ["  🟦🟦  ", " 🟦⬜🟦 ", " 🟫🟦🟫 ", "  ⬛⬛  "]
  },
  {
    id: "rin",
    name: "凛",
    note: "運動神経バツグン。体力勝負に強い。",
    base: { study: 9, sports: 15, art: 8, social: 10, mood: 50 },
    growth: { study: 1, sports: 2, art: 1, social: 1 },
    pixel: ["  🟥🟥  ", " 🟥⬜🟥 ", " 🟫🟥🟫 ", "  ⬛⬛  "]
  },
  {
    id: "yuzu",
    name: "柚",
    note: "絵と音楽が得意。創作で大きく伸びる。",
    base: { study: 8, sports: 9, art: 15, social: 11, mood: 50 },
    growth: { study: 1, sports: 1, art: 2, social: 1 },
    pixel: ["  🟨🟨  ", " 🟨⬜🟨 ", " 🟫🟨🟫 ", "  ⬛⬛  "]
  },
  {
    id: "mei",
    name: "芽衣",
    note: "友達作りが上手。交流イベントに強い。",
    base: { study: 10, sports: 10, art: 9, social: 14, mood: 50 },
    growth: { study: 1, sports: 1, art: 1, social: 2 },
    pixel: ["  🟪🟪  ", " 🟪⬜🟪 ", " 🟫🟪🟫 ", "  ⬛⬛  "]
  }
];

const actions = [
  { id: "study", label: "勉強する", target: "study", moodCost: 4 },
  { id: "sports", label: "運動する", target: "sports", moodCost: 4 },
  { id: "art", label: "創作する", target: "art", moodCost: 4 },
  { id: "social", label: "交流する", target: "social", moodCost: 4 },
  { id: "rest", label: "休む", target: null, moodCost: -10 }
];

let state = null;

const els = {
  start: document.getElementById("start-screen"),
  game: document.getElementById("game-screen"),
  result: document.getElementById("result-screen"),
  characterList: document.getElementById("character-list"),
  selectedName: document.getElementById("selected-name"),
  dayLabel: document.getElementById("day-label"),
  pixelArt: document.getElementById("pixel-art"),
  characterNote: document.getElementById("character-note"),
  stats: document.getElementById("stats"),
  actions: document.getElementById("actions"),
  eventLog: document.getElementById("event-log"),
  resultSummary: document.getElementById("result-summary"),
  resultStats: document.getElementById("result-stats"),
  saveBtn: document.getElementById("save-btn"),
  loadBtn: document.getElementById("load-btn"),
  restartBtn: document.getElementById("restart-btn"),
  playAgainBtn: document.getElementById("play-again-btn")
};

function init() {
  renderCharacterChoices();
  wireButtons();
}

function renderCharacterChoices() {
  els.characterList.innerHTML = "";
  characters.forEach((chara) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "character-card";
    card.innerHTML = `<strong>${chara.name}</strong><p>${chara.note}</p><pre>${chara.pixel.join("\n")}</pre>`;
    card.addEventListener("click", () => startGame(chara.id));
    els.characterList.appendChild(card);
  });
}

function wireButtons() {
  els.saveBtn.addEventListener("click", saveGame);
  els.loadBtn.addEventListener("click", loadGame);
  els.restartBtn.addEventListener("click", showStart);
  els.playAgainBtn.addEventListener("click", showStart);
}

function startGame(characterId) {
  const chara = characters.find((c) => c.id === characterId);
  state = {
    day: 1,
    characterId,
    stats: { ...chara.base },
    log: [`${chara.name}の育成を開始した。`]
  };
  showGame();
  render();
}

function performAction(actionId) {
  if (!state || state.day > MAX_DAY) return;
  const chara = characters.find((c) => c.id === state.characterId);
  const action = actions.find((a) => a.id === actionId);

  if (action.target) {
    const gain = action.id === "rest" ? 0 : chara.growth[action.target] + rand(1, 3);
    state.stats[action.target] += gain;
    state.log.unshift(`Day ${state.day}: ${action.label} → ${labelOf(action.target)} +${gain}`);
  } else {
    state.log.unshift(`Day ${state.day}: しっかり休んだ。`);
  }

  state.stats.mood = clamp(state.stats.mood - action.moodCost + rand(-1, 2), 0, 100);

  if (state.stats.mood <= 15) {
    state.log.unshift(`Day ${state.day}: 疲れ気味…。次は休んだ方が良さそう。`);
  }

  if (state.day % 30 === 0) {
    monthlyEvent(chara);
  }

  state.day += 1;
  if (state.day > MAX_DAY) {
    finishGame();
  } else {
    render();
  }
}

function monthlyEvent(chara) {
  const type = rand(0, 2);
  if (type === 0) {
    state.stats.study += 3;
    state.log.unshift(`月末イベント: 補習が実って学力が上昇！（${chara.name}）`);
  } else if (type === 1) {
    state.stats.social += 3;
    state.log.unshift(`月末イベント: 友達との交流で社交性がアップ！`);
  } else {
    state.stats.mood = clamp(state.stats.mood + 12, 0, 100);
    state.log.unshift(`月末イベント: 休日を満喫して気分回復。`);
  }
}

function finishGame() {
  const total = state.stats.study + state.stats.sports + state.stats.art + state.stats.social;
  const rank = total >= 240 ? "S" : total >= 210 ? "A" : total >= 180 ? "B" : "C";
  els.resultSummary.textContent = `育成完了！総合ランクは ${rank} でした。`;
  renderStats(els.resultStats, state.stats);
  els.start.classList.add("hidden");
  els.game.classList.add("hidden");
  els.result.classList.remove("hidden");
}

function render() {
  const chara = characters.find((c) => c.id === state.characterId);
  els.selectedName.textContent = `${chara.name}を育成中`;
  els.dayLabel.textContent = `Day ${state.day} / ${MAX_DAY}`;
  els.pixelArt.textContent = chara.pixel.join("\n");
  els.characterNote.textContent = chara.note;
  renderStats(els.stats, state.stats);
  renderActions();
  renderLog();
}

function renderStats(container, stats) {
  container.innerHTML = "";
  const entries = [
    ["study", "学力"],
    ["sports", "運動"],
    ["art", "創作"],
    ["social", "社交"],
    ["mood", "気分"]
  ];

  entries.forEach(([key, label]) => {
    const el = document.createElement("div");
    el.className = "stat";
    el.innerHTML = `<div class="label">${label}</div><strong>${Math.floor(stats[key])}</strong>`;
    container.appendChild(el);
  });
}

function renderActions() {
  els.actions.innerHTML = "";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.addEventListener("click", () => performAction(action.id));
    els.actions.appendChild(button);
  });
}

function renderLog() {
  els.eventLog.innerHTML = "";
  state.log.slice(0, 25).forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    els.eventLog.appendChild(li);
  });
}

function saveGame() {
  if (!state) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  state.log.unshift("セーブしました。");
  renderLog();
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    alert("セーブデータがありません。");
    return;
  }
  state = JSON.parse(raw);
  showGame();
  state.log.unshift("ロードしました。");
  render();
}

function showStart() {
  state = null;
  els.start.classList.remove("hidden");
  els.game.classList.add("hidden");
  els.result.classList.add("hidden");
}

function showGame() {
  els.start.classList.add("hidden");
  els.result.classList.add("hidden");
  els.game.classList.remove("hidden");
}

function labelOf(stat) {
  return { study: "学力", sports: "運動", art: "創作", social: "社交" }[stat] || stat;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

init();
