/* ═══════════════════════════════════════════════════
   MERISHA'S STUDY CLOCK — script.js
   Full Pomodoro timer, stats, todos, animations
═══════════════════════════════════════════════════ */

/* ── CONSTANTS ── */
let DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const DAILY_GOAL = 4; // sessions

/* Rotating brand names shown in the header (splash always says "Merisha's Study Clock") */
const BRAND_NAMES = [
  "Padhai Karo ",
  "K xa didi📖",
  "Study  ✨",
  "Aru kaam xa vane go",
  "CNook ☕",
  "Panipuri Lelo😏",
  "Kya hal he",
];
let brandIndex = 0;
const QUOTES = [
  "Padho vane Ng aaudeina hai didi 📚",
  "Ajhei padhum, tespaxi break linu 😏",
  "67 67 67 ",
  "Alu dhaniya piyaj bhindi",
  "Best of luck for whatever you are preparing for didi",
];
const CELEBRATION_MSGS = [
  "You crushed it, Didi! 💪",
  "That's another session down!",
  "Look at you go! Keep shining ✨",
  "Barcelona > Madrid",
  "6 7",
];
const COLORS_CONFETTI = ["#f4a7c0","#c4a8e0","#f5c9a0","#e87ea1","#d4b8f0","#f0c8dc","#b8d8f8"];

/* ── STATE ── */
let state = {
  mode: "focus",
  isRunning: false,
  timeLeft: DURATIONS.focus,
  totalTime: DURATIONS.focus,
  sessionCount: 0,
  totalFocusSessions: 0,
  totalStudyMinutes: 0,
  streak: 0,
  lastStudyDate: null,
  isDark: false,
  soundEnabled: false,
  activeAmbient: null,
  volume: 0.4,
  todos: [],
  quoteIndex: 0,
};
let intervalId = null;
let quoteTimer = null;
let audioCtx = null;
let ambientOsc = null; // simple synthetic ambient (no external files)

/* ── DOM REFS ── */
const $ = id => document.getElementById(id);
const brandName         = $("brandName");
const customTimerBtn    = $("customTimerBtn");
const customTimerModal  = $("customTimerModal");
const customTimerClose  = $("customTimerClose");
const customFocusInput  = $("customFocus");
const customShortInput  = $("customShort");
const customLongInput   = $("customLong");
const applyCustomTimer  = $("applyCustomTimer");
const app             = $("app");
const themeToggle     = $("themeToggle");
const soundToggle     = $("soundToggle");
const greeting        = $("greeting");
const currentDate     = $("currentDate");
const liveClock       = $("liveClock");
const quoteText       = $("quoteText");
const timerDisplay    = $("timerDisplay");
const timerLabel      = $("timerLabel");
const progressPct     = $("progressPct");
const ringProgress    = $("ringProgress");
const ringGlow        = $("ringGlow");
const timerRingWrap   = $("timerRingWrap");
const sessionEmoji    = $("sessionEmoji");
const startBtn        = $("startBtn");
const startBtnText    = $("startBtnText");
const startIcon       = $("startIcon");
const resetBtn        = $("resetBtn");
const skipBtn         = $("skipBtn");
const counterDots     = $("counterDots");
const sessionCountNum = $("sessionCountNum");
const totalSessions   = $("totalSessions");
const totalTime       = $("totalTime");
const streakCount     = $("streakCount");
const goalBar         = $("goalBar");
const goalPct         = $("goalPct");
const goalSub         = $("goalSub");
const prodScore       = $("prodScore");
const todoInput       = $("todoInput");
const todoAddBtn      = $("todoAddBtn");
const todoList        = $("todoList");
const todoCount       = $("todoCount");
const clearDone       = $("clearDone");
const volumeSlider    = $("volumeSlider");
const celebrationOverlay = $("celebrationOverlay");
const celeTitle       = $("celeTitle");
const celeMsg         = $("celeMsg");
const celeEmoji       = $("celeEmoji");
const celeClose       = $("celeClose");
const confettiWrap    = $("confettiWrap");
const particleCanvas  = $("particleCanvas");

/* ════════════════════════════════════
   SPLASH SCREEN
════════════════════════════════════ */
setTimeout(() => {
  splash.classList.add("fade-out");
  setTimeout(() => {
    splash.style.display = "none";
    app.classList.remove("hidden");
    app.style.animation = "appFadeIn 0.8s ease forwards";
    init();
  }, 800);
}, 2400);

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
function init() {
  loadFromStorage();
  injectSVGDefs();
  updateClockAndGreeting();
  setInterval(updateClockAndGreeting, 1000);
  startQuoteRotation();
  startBrandRotation();
  buildParticles();
  updateTimerDisplay();
  updateRing(1); // full ring = 0% progress shown
  updateSessionDots();
  updateStats();
  renderTodos();
  setupListeners();
  checkStreak();
}

/* ════════════════════════════════════
   SVG GRADIENT DEFS
════════════════════════════════════ */
function injectSVGDefs() {
  const svgNS = "http://www.w3.org/2000/svg";
  const timerSvg = document.querySelector(".timer-svg");

  const defs = document.createElementNS(svgNS, "defs");

  // Ring gradient
  const grad = document.createElementNS(svgNS, "linearGradient");
  grad.setAttribute("id", "ringGrad");
  grad.setAttribute("x1", "0%"); grad.setAttribute("y1", "0%");
  grad.setAttribute("x2", "100%"); grad.setAttribute("y2", "100%");
  const s1 = document.createElementNS(svgNS, "stop");
  s1.setAttribute("offset", "0%"); s1.setAttribute("stop-color", "#e87ea1");
  const s2 = document.createElementNS(svgNS, "stop");
  s2.setAttribute("offset", "100%"); s2.setAttribute("stop-color", "#c47ee0");
  grad.appendChild(s1); grad.appendChild(s2);
  defs.appendChild(grad);
  timerSvg.insertBefore(defs, timerSvg.firstChild);

  // Stat ring gradient (shared)
  const statSvgs = document.querySelectorAll(".stat-ring-svg");
  statSvgs.forEach((svg, i) => {
    const d = document.createElementNS(svgNS, "defs");
    const g = document.createElementNS(svgNS, "linearGradient");
    g.setAttribute("id", "statGrad");
    g.setAttribute("x1", "0%"); g.setAttribute("y1", "0%");
    g.setAttribute("x2", "100%"); g.setAttribute("y2", "100%");
    const c1 = document.createElementNS(svgNS, "stop");
    c1.setAttribute("offset", "0%"); c1.setAttribute("stop-color", "#f4a7c0");
    const c2 = document.createElementNS(svgNS, "stop");
    c2.setAttribute("offset", "100%"); c2.setAttribute("stop-color", "#c4a8e0");
    g.appendChild(c1); g.appendChild(c2);
    d.appendChild(g);
    svg.insertBefore(d, svg.firstChild);
    // Fix: each needs its own unique id
    g.setAttribute("id", `statGrad${i}`);
    svg.querySelector(".stat-ring-fill").setAttribute("stroke", `url(#statGrad${i})`);
  });
}

/* ════════════════════════════════════
   CLOCK & GREETING
════════════════════════════════════ */
function updateClockAndGreeting() {
  const now = new Date();
  const h = now.getHours();
  const hh = String(h).padStart(2,"0");
  const mm = String(now.getMinutes()).padStart(2,"0");
  const ss = String(now.getSeconds()).padStart(2,"0");
  liveClock.textContent = `${hh}:${mm}:${ss}`;

  let greet = "Hello, Merisha 🌸";
  if (h >= 5  && h < 12) greet = "Good Morning, Merisha ☀️";
  else if (h >= 12 && h < 17) greet = "Good Afternoon, Merisha 🌤️";
  else if (h >= 17 && h < 21) greet = "Good Evening, Merisha 🌆";
  else greet = "Study Night, Merisha 🌙";
  greeting.textContent = greet;

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  currentDate.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

/* ════════════════════════════════════
   BRAND NAME ROTATION (header only)
════════════════════════════════════ */
function startBrandRotation() {
  if (!brandName) return;
  // Show first alternative immediately
  brandName.textContent = BRAND_NAMES[0];
  setInterval(() => {
    brandName.style.opacity = "0";
    brandName.style.transform = "translateY(-6px)";
    setTimeout(() => {
      brandIndex = (brandIndex + 1) % BRAND_NAMES.length;
      brandName.textContent = BRAND_NAMES[brandIndex];
      brandName.style.opacity = "1";
      brandName.style.transform = "translateY(0)";
    }, 350);
  }, 9000);
}

/* ════════════════════════════════════
   QUOTES
════════════════════════════════════ */
function startQuoteRotation() {
  quoteText.textContent = QUOTES[state.quoteIndex];
  quoteTimer = setInterval(() => {
    quoteText.classList.add("fade");
    setTimeout(() => {
      state.quoteIndex = (state.quoteIndex + 1) % QUOTES.length;
      quoteText.textContent = QUOTES[state.quoteIndex];
      quoteText.classList.remove("fade");
    }, 500);
  }, 7000);
}

/* ════════════════════════════════════
   PARTICLE CANVAS
════════════════════════════════════ */
function buildParticles() {
  const canvas = particleCanvas;
  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const SYMBOLS = ["✦","✧","⋆","·","✿","❀","˙"];
  const COUNT = 60;

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 20;
      this.size = 8 + Math.random() * 10;
      this.speed = 0.3 + Math.random() * 0.7;
      this.opacity = 0.08 + Math.random() * 0.25;
      this.drift  = (Math.random() - 0.5) * 0.4;
      this.symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.01 + Math.random() * 0.02;
    }
    update() {
      this.y  -= this.speed;
      this.wobble += this.wobbleSpeed;
      this.x  += this.drift + Math.sin(this.wobble) * 0.3;
      if (this.y < -20) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.font = `${this.size}px serif`;
      ctx.fillStyle = document.body.classList.contains("dark-mode") ? "#d0a0e0" : "#e090c0";
      ctx.fillText(this.symbol, this.x, this.y);
      ctx.restore();
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
}

/* ════════════════════════════════════
   TIMER CORE
════════════════════════════════════ */
function setMode(mode) {
  if (state.isRunning) pauseTimer();
  state.mode = mode;
  state.timeLeft = DURATIONS[mode];
  state.totalTime = DURATIONS[mode];

  document.querySelectorAll(".mode-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.mode === mode);
  });

  const modeConfig = {
    focus: { label: "FOCUS TIME",  emoji: "🎯" },
    short: { label: "SHORT BREAK", emoji: "☕" },
    long:  { label: "LONG BREAK",  emoji: "🌸" },
  };
  timerLabel.textContent  = modeConfig[mode].label;
  sessionEmoji.textContent = modeConfig[mode].emoji;
  sessionEmoji.style.animation = "none";
  requestAnimationFrame(() => sessionEmoji.style.animation = "");

  updateTimerDisplay();
  updateRing(1); // reset ring to full (no progress)
  timerRingWrap.classList.remove("running","near-end");
  startBtnText.textContent = "Start";
  showStartIcon(true);
  saveToStorage();
}

function startTimer() {
  state.isRunning = true;
  timerRingWrap.classList.add("running");
  startBtnText.textContent = "Pause";
  showStartIcon(false);

  intervalId = setInterval(() => {
    state.timeLeft--;

    // Near-end pulsing (last 10%)
    const pct = state.timeLeft / state.totalTime;
    timerRingWrap.classList.toggle("near-end", pct <= 0.1 && pct > 0);

    updateTimerDisplay();
    updateRing(pct);

    if (state.timeLeft <= 0) {
      clearInterval(intervalId);
      onSessionComplete();
    }
  }, 1000);
}

function pauseTimer() {
  state.isRunning = false;
  clearInterval(intervalId);
  timerRingWrap.classList.remove("running","near-end");
  startBtnText.textContent = "Resume";
  showStartIcon(true);
}

function resetTimer() {
  clearInterval(intervalId);
  state.isRunning = false;
  state.timeLeft  = DURATIONS[state.mode];
  state.totalTime = DURATIONS[state.mode];
  timerRingWrap.classList.remove("running","near-end");
  startBtnText.textContent = "Start";
  showStartIcon(true);
  updateTimerDisplay();
  updateRing(1);
}

function skipSession() {
  clearInterval(intervalId);
  state.isRunning = false;
  advanceSession();
}

function onSessionComplete() {
  playBell();
  timerRingWrap.classList.remove("running","near-end");
  startBtnText.textContent = "Start";
  showStartIcon(true);
  state.isRunning = false;

  if (state.mode === "focus") {
    state.sessionCount++;
    state.totalFocusSessions++;
    state.totalStudyMinutes += DURATIONS.focus / 60;
    updateStreak();
    updateStats();
    saveToStorage();
    showCelebration();
  } else {
    advanceSession();
  }
}

function advanceSession() {
  if (state.mode === "focus") {
    // After focus: short break; every 4th = long break
    setMode(state.sessionCount % 4 === 0 ? "long" : "short");
  } else {
    setMode("focus");
  }
}

function showStartIcon(show) {
  startIcon.innerHTML = show
    ? `<path d="M5 3l14 9-14 9V3z" fill="currentColor"/>`
    : `<rect x="6" y="4" width="4" height="16" rx="2" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="2" fill="currentColor"/>`;
}

/* ════════════════════════════════════
   RING + DISPLAY
════════════════════════════════════ */
function updateTimerDisplay() {
  const m = Math.floor(state.timeLeft / 60);
  const s = state.timeLeft % 60;
  timerDisplay.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

  const pct = Math.round((1 - state.timeLeft / state.totalTime) * 100);
  progressPct.textContent = `${pct}%`;
}

function updateRing(pctRemaining) {
  const circumference = 2 * Math.PI * 130; // 817
  const offset = circumference * pctRemaining;
  ringProgress.style.strokeDashoffset = offset;
}

/* ════════════════════════════════════
   SESSION DOTS
════════════════════════════════════ */
function updateSessionDots() {
  counterDots.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement("div");
    dot.className = "counter-dot" + (i < state.sessionCount % 4 ? " filled" : "");
    counterDots.appendChild(dot);
  }
  sessionCountNum.textContent = `${state.sessionCount % 4} / 4`;
}

/* ════════════════════════════════════
   STATS
════════════════════════════════════ */
function updateStats() {
  // Session ring (goal 8 max display)
  animateCounter(totalSessions, state.totalFocusSessions);
  const sessPct = Math.min(state.totalFocusSessions / 8, 1);
  animateStatRing("focusRing", sessPct);

  // Time ring
  const timeLabel = state.totalStudyMinutes >= 60
    ? `${Math.floor(state.totalStudyMinutes / 60)}h${state.totalStudyMinutes % 60}m`
    : `${state.totalStudyMinutes}m`;
  totalTime.textContent = timeLabel;
  const timePct = Math.min(state.totalStudyMinutes / 120, 1);
  animateStatRing("timeRing", timePct);

  // Streak
  streakCount.textContent = `🔥${state.streak}`;
  animateStatRing("streakRing", Math.min(state.streak / 7, 1));

  // Goal
  const gPct = Math.min((state.sessionCount % DAILY_GOAL) / DAILY_GOAL * 100, 100);
  // Use total sessions for daily goal
  const todaySessions = Math.min(state.totalFocusSessions, DAILY_GOAL);
  const gPctFull = (todaySessions / DAILY_GOAL) * 100;
  goalBar.style.width = `${gPctFull}%`;
  goalPct.textContent  = `${Math.round(gPctFull)}%`;
  goalSub.textContent  = `${todaySessions} / ${DAILY_GOAL} sessions completed`;

  // Productivity (sessions vs hours of day)
  const hour = new Date().getHours();
  const expectedSessions = Math.max(1, Math.floor(hour / 3));
  const prod = Math.min(Math.round((state.totalFocusSessions / expectedSessions) * 100), 100);
  prodScore.textContent = `${prod}%`;

  updateSessionDots();
}

function animateStatRing(id, pct) {
  const el = $(id);
  if (!el) return;
  const circ = 2 * Math.PI * 24; // 150.8
  el.style.strokeDashoffset = circ * (1 - pct);
}

let counterAnimFrames = {};
function animateCounter(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  let start = current, startTime = null;
  const dur = 600;
  function step(ts) {
    if (!startTime) startTime = ts;
    const p = Math.min((ts - startTime) / dur, 1);
    el.textContent = Math.round(start + (target - start) * p);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ════════════════════════════════════
   STREAK
════════════════════════════════════ */
function updateStreak() {
  const today = new Date().toDateString();
  if (state.lastStudyDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  state.streak = state.lastStudyDate === yesterday ? state.streak + 1 : 1;
  state.lastStudyDate = today;
  saveToStorage();
}
function checkStreak() {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (state.lastStudyDate && state.lastStudyDate !== today && state.lastStudyDate !== yesterday) {
    state.streak = 0;
    saveToStorage();
  }
}

/* ════════════════════════════════════
   CELEBRATION
════════════════════════════════════ */
function showCelebration() {
  celeMsg.textContent = CELEBRATION_MSGS[Math.floor(Math.random() * CELEBRATION_MSGS.length)];
  celeTitle.textContent = state.totalFocusSessions % 4 === 0 ? "Long Break Time! 🌸" : "Session Complete! 🎉";
  celeEmoji.textContent = state.totalFocusSessions % 4 === 0 ? "🌸" : "🎉";
  celebrationOverlay.classList.remove("hidden");
  launchConfetti();
}
function launchConfetti() {
  confettiWrap.innerHTML = "";
  for (let i = 0; i < 60; i++) {
    const c = document.createElement("div");
    c.className = "confetto";
    c.style.left     = `${Math.random() * 100}%`;
    c.style.background = COLORS_CONFETTI[Math.floor(Math.random() * COLORS_CONFETTI.length)];
    c.style.width    = `${4 + Math.random() * 8}px`;
    c.style.height   = `${4 + Math.random() * 8}px`;
    c.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    c.style.animationDuration = `${0.8 + Math.random() * 1.5}s`;
    c.style.animationDelay   = `${Math.random() * 0.6}s`;
    confettiWrap.appendChild(c);
  }
}

/* ════════════════════════════════════
   SOUND: SIMPLE WEB AUDIO
════════════════════════════════════ */
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playBell() {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(state.volume * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.6);
  } catch(e) {}
}

/* Synthetic ambient sounds using Web Audio oscillators + noise */
let ambientNodes = [];
function stopAmbient() {
  ambientNodes.forEach(n => { try { n.stop(); } catch(e){} });
  ambientNodes = [];
}
function playAmbient(type) {
  stopAmbient();
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const vol = state.volume * 0.3;

    if (type === "rain") {
      // White noise filtered
      const bufSize = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass"; filter.frequency.value = 400;
      const gain = ctx.createGain(); gain.gain.value = vol;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start();
      ambientNodes.push(src);
    } else if (type === "cafe") {
      // Multiple oscillators for café murmur
      [180, 220, 160, 200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = freq + i * 15;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.value = vol * 0.15;
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start();
        ambientNodes.push(osc);
      });
    } else if (type === "lofi") {
      const notes = [261, 293, 329, 349, 392];
      let t = ctx.currentTime;
      const playNote = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const note = notes[Math.floor(Math.random() * notes.length)];
        osc.type = "triangle"; osc.frequency.value = note;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol * 0.3, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 1.3);
        t += 0.5 + Math.random() * 1;
        if (ambientNodes.includes(osc) || ambientNodes.length < 20) {
          ambientNodes.push(osc);
          setTimeout(playNote, 600);
        }
      };
      playNote();
    } else if (type === "forest") {
      // Chirping: random high-freq bursts
      const bufSize = ctx.sampleRate;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass"; filter.frequency.value = 1800;
      const gain = ctx.createGain(); gain.gain.value = vol * 0.5;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start();
      ambientNodes.push(src);
    }
  } catch(e) {}
}

/* ════════════════════════════════════
   TO-DO LIST
════════════════════════════════════ */
function addTodo(text) {
  if (!text.trim()) return;
  state.todos.push({ id: Date.now(), text: text.trim(), done: false });
  renderTodos();
  saveToStorage();
}
function toggleTodo(id) {
  const item = state.todos.find(t => t.id === id);
  if (item) { item.done = !item.done; renderTodos(); saveToStorage(); }
}
function deleteTodo(id) {
  state.todos = state.todos.filter(t => t.id !== id);
  renderTodos();
  saveToStorage();
}
function renderTodos() {
  todoList.innerHTML = "";
  state.todos.forEach(todo => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " done" : "");
    li.innerHTML = `
      <div class="todo-checkbox" onclick="toggleTodo(${todo.id})"></div>
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <button class="todo-delete" onclick="deleteTodo(${todo.id})" aria-label="Delete">×</button>
    `;
    todoList.appendChild(li);
  });
  const done = state.todos.filter(t => t.done).length;
  todoCount.textContent = `${state.todos.length} task${state.todos.length !== 1 ? "s" : ""}${done > 0 ? ` · ${done} done` : ""}`;
}
function escapeHtml(text) {
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ════════════════════════════════════
   LOCAL STORAGE
════════════════════════════════════ */
const STORAGE_KEY = "merisha_study_clock_v2";
function saveToStorage() {
  const data = {
    totalFocusSessions: state.totalFocusSessions,
    totalStudyMinutes: state.totalStudyMinutes,
    streak: state.streak,
    lastStudyDate: state.lastStudyDate,
    isDark: state.isDark,
    todos: state.todos,
    volume: state.volume,
    soundEnabled: state.soundEnabled,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.totalFocusSessions = data.totalFocusSessions || 0;
    state.totalStudyMinutes  = data.totalStudyMinutes  || 0;
    state.streak             = data.streak             || 0;
    state.lastStudyDate      = data.lastStudyDate      || null;
    state.isDark             = data.isDark             || false;
    state.todos              = data.todos              || [];
    state.volume             = data.volume             ?? 0.4;
    state.soundEnabled       = data.soundEnabled       || false;

    if (state.isDark) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    }
    volumeSlider.value = state.volume * 100;
    volumeSlider.style.setProperty("--vol", `${state.volume * 100}%`);
    if (state.soundEnabled) {
      soundToggle.style.color = "var(--accent-rose)";
    }
  } catch(e) {}
}

/* ════════════════════════════════════
   THEME TOGGLE
════════════════════════════════════ */
function toggleTheme() {
  state.isDark = !state.isDark;
  document.body.classList.toggle("dark-mode", state.isDark);
  document.body.classList.toggle("light-mode", !state.isDark);
  saveToStorage();
}

/* ════════════════════════════════════
   SOUND TOGGLE
════════════════════════════════════ */
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  soundToggle.style.color = state.soundEnabled ? "var(--accent-rose)" : "";
  if (!state.soundEnabled) stopAmbient();
  else if (state.activeAmbient) playAmbient(state.activeAmbient);
  saveToStorage();
}

/* ════════════════════════════════════
   EVENT LISTENERS
════════════════════════════════════ */
function setupListeners() {
  // NEW: Visibility logic to stop sounds when leaving tab
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAmbient();
    } else {
      if (state.soundEnabled && state.activeAmbient) playAmbient(state.activeAmbient);
    }
  });

  // Mode tabs
  document.querySelectorAll(".mode-tab").forEach(btn => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  // Start / Pause
  startBtn.addEventListener("click", () => {
    if (state.isRunning) pauseTimer();
    else startTimer();
  });
  resetBtn.addEventListener("click", resetTimer);
  skipBtn.addEventListener("click", skipSession);

  // Theme & Sound
  themeToggle.addEventListener("click", toggleTheme);
  soundToggle.addEventListener("click", toggleSound);

  // Volume
  volumeSlider.addEventListener("input", e => {
    state.volume = e.target.value / 100;
    volumeSlider.style.setProperty("--vol", `${e.target.value}%`);
    saveToStorage();
  });

  // Ambient buttons
  document.querySelectorAll(".amb-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.sound;
      if (state.activeAmbient === type) {
        // Toggle off
        state.activeAmbient = null;
        stopAmbient();
        btn.classList.remove("active");
      } else {
        document.querySelectorAll(".amb-btn").forEach(b => b.classList.remove("active"));
        state.activeAmbient = type;
        btn.classList.add("active");
        if (state.soundEnabled) playAmbient(type);
        else {
          // Auto-enable sound when ambient chosen
          state.soundEnabled = true;
          soundToggle.style.color = "var(--accent-rose)";
          playAmbient(type);
        }
      }
    });
  });

  // Todo
  todoAddBtn.addEventListener("click", () => {
    addTodo(todoInput.value);
    todoInput.value = "";
  });
  todoInput.addEventListener("keydown", e => {
    if (e.key === "Enter") { addTodo(todoInput.value); todoInput.value = ""; }
  });
  clearDone.addEventListener("click", () => {
    state.todos = state.todos.filter(t => !t.done);
    renderTodos(); saveToStorage();
  });

  // Celebration close
  celeClose.addEventListener("click", () => {
    celebrationOverlay.classList.add("hidden");
    advanceSession();
  });
  celebrationOverlay.addEventListener("click", e => {
    if (e.target === celebrationOverlay) {
      celebrationOverlay.classList.add("hidden");
      advanceSession();
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", e => {
    // Ignore when typing in input
    if (e.target.tagName === "INPUT") return;
    if (e.code === "Space") { e.preventDefault(); startBtn.click(); }
    if (e.code === "KeyR")  resetBtn.click();
    if (e.code === "KeyS")  skipBtn.click();
  });

  // Custom Timer modal open/close
  customTimerBtn.addEventListener("click", () => {
    customFocusInput.value = DURATIONS.focus / 60;
    customShortInput.value = DURATIONS.short / 60;
    customLongInput.value  = DURATIONS.long  / 60;
    syncPresetHighlight();
    customTimerModal.classList.remove("hidden");
  });
  customTimerClose.addEventListener("click", () => customTimerModal.classList.add("hidden"));
  customTimerModal.addEventListener("click", e => {
    if (e.target === customTimerModal) customTimerModal.classList.add("hidden");
  });

  // Spinner +/- buttons
  document.querySelectorAll(".spin-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = $(btn.dataset.target);
      const delta = parseInt(btn.dataset.delta);
      const min   = parseInt(input.min) || 1;
      const max   = parseInt(input.max) || 999;
      input.value = Math.max(min, Math.min(max, parseInt(input.value || 0) + delta));
      syncPresetHighlight();
    });
  });
  [customFocusInput, customShortInput, customLongInput].forEach(inp => {
    inp.addEventListener("input", syncPresetHighlight);
  });

  // Preset pills
  document.querySelectorAll(".preset-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      customFocusInput.value = pill.dataset.focus;
      customShortInput.value = pill.dataset.short;
      customLongInput.value  = pill.dataset.long;
      syncPresetHighlight();
    });
  });

  // Apply custom timer
  applyCustomTimer.addEventListener("click", () => {
    const f = Math.max(1, Math.min(180, parseInt(customFocusInput.value)  || 25));
    const s = Math.max(1, Math.min(60,  parseInt(customShortInput.value) || 5));
    const l = Math.max(1, Math.min(90,  parseInt(customLongInput.value)  || 15));
    DURATIONS.focus = f * 60;
    DURATIONS.short = s * 60;
    DURATIONS.long  = l * 60;
    customTimerModal.classList.add("hidden");
    resetTimer();
    setMode(state.mode);
    flashApplied();
  });
}

/* ════════════════════════════════════
   CUSTOM TIMER HELPERS
════════════════════════════════════ */
function syncPresetHighlight() {
  const f = String(customFocusInput.value);
  const s = String(customShortInput.value);
  const l = String(customLongInput.value);
  document.querySelectorAll(".preset-pill").forEach(pill => {
    pill.classList.toggle("selected",
      pill.dataset.focus === f && pill.dataset.short === s && pill.dataset.long === l);
  });
}
function flashApplied() {
  customTimerBtn.innerHTML = `✅ Applied!`;
  customTimerBtn.style.borderColor = "var(--accent-purple)";
  customTimerBtn.style.color = "var(--accent-purple)";
  setTimeout(() => {
    customTimerBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" width="15"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Custom Timer`;
    customTimerBtn.style.borderColor = "";
    customTimerBtn.style.color = "";
  }, 2000);
}
