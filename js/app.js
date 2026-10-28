/* Fuchs-Einmaleins
   Eine kleine Web-App (PWA) ohne Bibliotheken: alles in dieser Datei.
   Aufbau:  1 Einstellungen  2 Speicherstand  3 Aufgaben erzeugen  4 Fuchs-Tipps
            5 Zeichnungen (SVG)  6 Bildschirme  7 Ablauf  8 Eingaben  9 Start      */
(() => {
  'use strict';

  /* ================= 1  Einstellungen ================= */
  const STORE_KEY = 'fuchs1x1.v1';
  const TASKS_PER_ROUND = 10;   // Aufgaben pro Stufe
  const TEST_TASKS = 20;        // Aufgaben im Fuchs-Test
  const TEST_LIVES = 3;         // Leben im Fuchs-Test

  const LEVELS = [
    { n: 1, name: 'Fuchsjunges',    rows: [1, 2, 5, 10],                 chips: ['1er', '2er', '5er', '10er'] },
    { n: 2, name: 'Schlauer Fuchs', rows: [1, 2, 3, 4, 5, 6, 10],         chips: ['1er bis 6er', '10er'] },
    { n: 3, name: 'Meisterfuchs',   rows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], chips: ['alle Reihen 1er bis 10er'] }
  ];

  // Sterne-Regel: so viele richtige Antworten (von 10) braucht man für Stern 1 bis 5
  const STAR_MIN = [5, 7, 8, 9, 10];
  const starsFor = (correct) => STAR_MIN.filter((m) => correct >= m).length;

  /* ================= 2  Speicherstand ================= */
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  let save = loadSave();

  function loadSave() {
    const d = { stars: [0, 0, 0], testBest: 0, testPassed: false };
    try {
      const p = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (p) {
        if (Array.isArray(p.stars)) d.stars = [0, 1, 2].map((i) => clamp(+p.stars[i] || 0, 0, 5));
        d.testBest = clamp(+p.testBest || 0, 0, TEST_TASKS);
        d.testPassed = !!p.testPassed;
      }
    } catch (e) { /* Speicher nicht verfügbar: App läuft trotzdem */ }
    return d;
  }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(save)); } catch (e) { /* ignorieren */ }
  }

  /* ================= 3  Aufgaben erzeugen ================= */
  const rand = (n) => Math.floor(Math.random() * n);
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = rand(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  const pairKey = (t) => Math.min(t.a, t.b) + 'x' + Math.max(t.a, t.b);

  // Üben: 10 verschiedene Aufgaben aus den Reihen der Stufe, Reihenfolge der Faktoren zufällig
  function genPractice(levelIndex) {
    const rows = LEVELS[levelIndex].rows;
    const seen = new Set();
    const out = [];
    let guard = 0;
    while (out.length < TASKS_PER_ROUND && guard++ < 5000) {
      const r = rows[rand(rows.length)];
      const b = 1 + rand(10);
      // Aufgaben mit Faktor 1 sind sehr leicht: sie kommen vor, aber nicht ständig
      if ((r === 1 || b === 1) && Math.random() < 0.65) continue;
      const t = Math.random() < 0.5 ? { a: r, b } : { a: b, b: r };
      const key = pairKey(t);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out;
  }

  // Test: 20 schwere Aufgaben (Faktoren 3 bis 9 ohne 5, Ergebnis mindestens 24)
  function genTest() {
    const unique = [];
    for (let a = 3; a <= 9; a++) {
      for (let b = a; b <= 9; b++) {
        if (a === 5 || b === 5 || a * b < 24) continue;
        unique.push({ a, b });
      }
    }
    const flip = (t) => (Math.random() < 0.5 ? { a: t.a, b: t.b } : { a: t.b, b: t.a });
    let picked = [];
    for (let attempt = 0; attempt < 100; attempt++) {
      picked = unique.map(flip);
      const extra = shuffle(unique.filter((t) => t.a !== t.b)).slice(0, TEST_TASKS - unique.length).map(flip);
      picked = shuffle(picked.concat(extra));
      if (picked.every((t, i) => i === 0 || pairKey(t) !== pairKey(picked[i - 1]))) break;
    }
    return picked.slice(0, TEST_TASKS);
  }

  /* ================= 4  Fuchs-Tipps ================= */
  // Liefert zwei Tipps (leicht → konkreter). eq = Rechenhilfe in Zeilen.
  function tipsFor(a, b) {
    const has = (x) => a === x || b === x;
    const other = (x) => (a === x ? b : a);
    const big = Math.max(a, b);
    const small = Math.min(a, b);

    if (has(1)) {
      return [
        { t: 'Mal 1 ändert nichts: Die Zahl bleibt, wie sie ist.' },
        { t: `Schau dir die ${other(1)} an. Sie ist schon deine Antwort!` }
      ];
    }
    if (has(10)) {
      const o = other(10);
      return [
        { t: 'Bei Mal 10 hängst du hinten eine 0 an die andere Zahl.' },
        { t: `Die andere Zahl ist ${o}. Schreib sie hin und setz eine 0 dahinter!` }
      ];
    }
    if (has(2)) {
      const o = other(2);
      return [
        { t: 'Mal 2 heißt: doppelt so viel. Verdopple die andere Zahl!' },
        { t: `Rechne ${o} + ${o}.`, eq: [`${o} + ${o} = ?`] }
      ];
    }
    if (has(5)) {
      const o = other(5);
      return [
        { t: 'Die 5er-Reihe endet immer auf 0 oder 5.' },
        { t: `Rechne erst mal 10. Dann nimm die Hälfte davon!`, eq: [`10 × ${o} = ${10 * o}`, 'Die Hälfte = ?'] }
      ];
    }
    if (has(9)) {
      const o = other(9);
      return [
        { t: `Rechne erst 10 × ${o} und nimm dann einmal ${o} weg.` },
        { t: 'Zieh ab!', eq: [`10 × ${o} = ${10 * o}`, `${10 * o} − ${o} = ?`] }
      ];
    }
    if (big > 5) {
      return [
        { t: `Zerlege die ${big} in 5 + ${big - 5}. Rechne beides mit der ${small} und zähle zusammen.` },
        { t: 'Zähle die beiden Ergebnisse zusammen!', eq: [`5 × ${small} = ${5 * small}`, `${big - 5} × ${small} = ${(big - 5) * small}`, 'Zusammen = ?'] }
      ];
    }
    // nur noch 3 × 3, 3 × 4, 4 × 4: Schritt für Schritt addieren
    return [
      { t: `${a} × ${b} heißt: ${a} Mal die ${b} zusammenzählen.` },
      { t: `Fang an: ${b} + ${b}. Dann kommt noch ${a - 2} Mal die ${b} dazu.`, eq: [`${b} + ${b} = ${2 * b}`] }
    ];
  }

  /* ================= 5  Zeichnungen (SVG) ================= */
  const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z';
  const HEART_PATH = 'M12 20.5C6 16.3 3 13 3 9.2 3 6.6 5 4.8 7.3 4.8c1.8 0 3.6 1 4.7 2.8 1.1-1.8 2.9-2.8 4.7-2.8C19 4.8 21 6.6 21 9.2c0 3.8-3 7.1-9 11.3z';

  const starSvg = (on, size) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}" fill="${on ? '#FFC21A' : '#F6E3C2'}" stroke="${on ? '#D98E04' : '#E3C99B'}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

  const heartSvg = (full, size, id) =>
    `<svg ${id ? `id="${id}" ` : ''}width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">` +
    (full
      ? `<path d="${HEART_PATH}" fill="#FF6B6B"/>`
      : `<path d="${HEART_PATH}" fill="none" stroke="#8FA0C0" stroke-width="1.8" stroke-dasharray="3 2.5" stroke-linejoin="round"/>`) +
    '</svg>';

  const ICON = {
    close: '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    back: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    del: '<svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    next: '<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cross: '<svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#C8372D"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>'
  };

  // Fuchskopf: mood = 'happy' | 'think' | 'cheer'
  function foxHeadParts(mood) {
    const y = mood === 'think' ? 64 : 62;
    const eyes = mood === 'cheer'
      ? '<path d="M34 66 Q42 55 50 66" stroke="#3A2012" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M70 66 Q78 55 86 66" stroke="#3A2012" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
      : `<ellipse cx="42" cy="${y}" rx="6" ry="7.5" fill="#3A2012"/><ellipse cx="78" cy="${y}" rx="6" ry="7.5" fill="#3A2012"/><circle cx="44" cy="${y - 3}" r="2.2" fill="#fff"/><circle cx="80" cy="${y - 3}" r="2.2" fill="#fff"/>`;
    const brows = mood === 'think'
      ? '<path d="M34 51 Q42 46 50 50" stroke="#3A2012" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M70 50 Q78 46 86 51" stroke="#3A2012" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      : '';
    const nose = mood === 'cheer'
      ? '<path d="M52 89 Q60 83 68 89 Q64 97 60 97 Q56 97 52 89 Z" fill="#3A2012"/>'
      : '<path d="M52 91 Q60 85 68 91 Q64 99 60 99 Q56 99 52 91 Z" fill="#3A2012"/>';
    const mouth = mood === 'cheer'
      ? '<path d="M50 99 Q60 112 70 99 Z" fill="#8B2B2B" stroke="#3A2012" stroke-width="2" stroke-linejoin="round"/>'
      : '<path d="M53 103 Q60 108 67 103" stroke="#3A2012" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    return '<path d="M12 50 L18 4 L54 28 Z" fill="#E8710A"/><path d="M108 50 L102 4 L66 28 Z" fill="#E8710A"/>' +
      '<path d="M24 38 L26 16 L42 28 Z" fill="#4A2C17"/><path d="M96 38 L94 16 L78 28 Z" fill="#4A2C17"/>' +
      '<path d="M60 108 C28 108 6 80 8 54 C10 36 36 26 60 26 C84 26 110 36 112 54 C114 80 92 108 60 108 Z" fill="#F08A24"/>' +
      '<path d="M9 60 C28 62 46 78 60 108 C30 108 10 86 9 60 Z" fill="#FFF8EC"/><path d="M111 60 C92 62 74 78 60 108 C90 108 110 86 111 60 Z" fill="#FFF8EC"/>' +
      brows + eyes +
      '<circle cx="27" cy="80" r="6" fill="#F4978E" opacity=".55"/><circle cx="93" cy="80" r="6" fill="#F4978E" opacity=".55"/>' +
      nose + mouth;
  }
  const foxHead = (mood, label, cls) =>
    `<svg ${cls ? `class="${cls}" ` : ''}viewBox="0 0 120 112" role="img" aria-label="${label}">${foxHeadParts(mood)}</svg>`;

  function foxSitting() {
    return '<svg viewBox="0 0 240 240" role="img" aria-label="Ein freundlicher Fuchs sitzt auf der Wiese">' +
      '<ellipse cx="190" cy="172" rx="22" ry="54" transform="rotate(35 190 172)" fill="#F08A24"/>' +
      '<ellipse cx="216" cy="133" rx="15" ry="19" transform="rotate(35 216 133)" fill="#FFF8EC"/>' +
      '<path d="M68 236 C56 176 80 140 120 140 C160 140 184 176 172 236 Z" fill="#F08A24"/>' +
      '<path d="M94 236 C90 192 104 166 120 166 C136 166 150 192 146 236 Z" fill="#FFF8EC"/>' +
      '<ellipse cx="96" cy="232" rx="17" ry="8" fill="#4A2C17"/><ellipse cx="144" cy="232" rx="17" ry="8" fill="#4A2C17"/>' +
      `<g transform="translate(63 38) scale(.95)">${foxHeadParts('happy')}</g></svg>`;
  }

  function medalSvg() {
    return '<svg width="150" height="150" viewBox="0 0 120 120" role="img" aria-label="Goldmedaille">' +
      '<path d="M38 4 L52 46 L68 46 L82 4 Z" fill="#E5484D"/>' +
      '<circle cx="60" cy="74" r="38" fill="#FFC21A" stroke="#D98E04" stroke-width="5"/>' +
      `<g transform="translate(36 50) scale(2)"><path d="${STAR_PATH}" fill="#FFF3DF" stroke="#D98E04" stroke-width="1.2" stroke-linejoin="round"/></g></svg>`;
  }

  /* ================= 6  Bildschirme ================= */
  const appEl = document.getElementById('app');
  const screenEl = document.getElementById('screen');
  const modalEl = document.getElementById('modal');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function show(html, cls, dusk) {
    appEl.classList.toggle('dusk', !!dusk);
    if (themeMeta) themeMeta.setAttribute('content', dusk ? '#27364F' : '#F08A24');
    screenEl.className = 'screen' + (cls ? ' ' + cls : '');
    screenEl.innerHTML = html;
    screenEl.scrollTop = 0;
  }
  const $ = (sel) => screenEl.querySelector(sel);

  const GREETINGS = ['Hallo! Üben wir zusammen?', 'Schön, dass du da bist!', 'Los geht’s! Welche Reihe ist dran?'];

  function homeScreen() {
    cancelTimer();
    round = null;
    const total = save.stars.reduce((a, b) => a + b, 0);
    show(
      '<div class="hill"></div><div class="hill2"></div>' +
      `<div class="pill-row"><div class="pill" role="img" aria-label="${total} von 15 Sternen">${starSvg(true, 24)}<span>${total} / 15</span></div></div>` +
      '<div class="titleblock"><h1>Fuchs-Einmaleins</h1><p>Üben, Sterne sammeln, Test schaffen</p></div>' +
      `<div class="foxstage"><div class="speech">${GREETINGS[rand(GREETINGS.length)]}</div>${foxSitting()}</div>` +
      '<div class="actions">' +
      `<button class="btn btn-primary big" data-act="levels">${ICON.play}<span>Üben</span></button>` +
      `<button class="btn btn-secondary big" data-act="test-intro">${heartSvg(true, 30).replace('#FF6B6B', '#E5484D')}<span>Fuchs-Test</span></button>` +
      '</div>',
      'home'
    );
  }

  function levelsScreen() {
    cancelTimer();
    round = null;
    const cards = LEVELS.map((lv, i) => {
      const s = save.stars[i];
      const stars = [0, 1, 2, 3, 4].map((k) => starSvg(k < s, 30)).join('');
      const chips = lv.chips.map((c) => `<span class="chip">${c}</span>`).join('');
      return `<button class="level" data-act="start-level" data-level="${i}" aria-label="Stufe ${lv.n}, ${lv.name}, ${s} von 5 Sternen">` +
        `<div class="level-top"><div class="badge">${lv.n}</div><div><div class="level-name">${lv.name}</div><div class="chips">${chips}</div></div></div>` +
        `<div class="level-bottom"><div class="stars">${stars}</div><span>${TASKS_PER_ROUND} Aufgaben</span></div></button>`;
    }).join('');
    show(
      `<div class="topbar"><button class="icon-btn" data-act="home" aria-label="Zurück zum Start">${ICON.back}</button><h1>Wähle deine Stufe</h1></div>` +
      `<div class="levels">${cards}</div>` +
      `<div class="levelfox">${foxHead('happy', 'Der Fuchs lächelt')}<div class="bubble">Wie viele Sterne schaffst du?</div></div>`,
      'levels'
    );
  }

  /* ---- gemeinsame Teile für Aufgaben-Bildschirme ---- */
  function progressHtml(R, markCurrent) {
    return `<div class="progress" role="img" aria-label="Fortschritt: ${R.results.filter((r) => r !== undefined).length} von ${R.tasks.length} Aufgaben erledigt">` +
      R.tasks.map((_, i) => {
        const r = R.results[i];
        return `<i class="${r === true ? 'ok' : r === false ? 'bad' : (markCurrent && i === R.i ? 'cur' : '')}"></i>`;
      }).join('') + '</div>';
  }
  function heartsHtml(R) {
    let h = '';
    for (let i = 0; i < TEST_LIVES; i++) h += heartSvg(i < R.lives, 26);
    return `<div class="hearts" id="hearts" role="img" aria-label="${R.lives} von ${TEST_LIVES} Leben übrig">${h}</div>`;
  }
  function topbarHtml(R) {
    const test = R.mode === 'test';
    const title = test ? 'Fuchs-Test' : LEVELS[R.level].name;
    return `<div class="topbar"><button class="icon-btn" data-act="quit" aria-label="${test ? 'Test abbrechen' : 'Üben beenden'}">${ICON.close}</button>` +
      `<div class="topbar-title">${title}<small>Aufgabe ${Math.min(R.i + 1, R.tasks.length)} von ${R.tasks.length}</small></div>` +
      (test ? heartsHtml(R) : '<div class="spacer"></div>') + '</div>';
  }

  function taskScreen() {
    const R = round;
    const t = R.tasks[R.i];
    const test = R.mode === 'test';
    R.input = '';
    R.locked = false;
    R.tipLevel = 0;
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="key" data-key="${d}" aria-label="${d}">${d}</button>`).join('');
    show(
      topbarHtml(R) + progressHtml(R, true) +
      '<div class="qcard">' +
      `<div class="q" aria-label="${t.a} mal ${t.b}">${t.a} × ${t.b}</div>` +
      '<div class="answer-row"><span class="eq">=</span><div class="answer" id="answer" role="status"></div></div>' +
      '<div class="feedback" id="feedback" role="status"></div></div>' +
      (test ? '' :
        `<button class="foxrow" data-act="tip" aria-label="Den Fuchs antippen für einen Tipp">${foxHead('happy', '')}` +
        '<div class="bubble">Brauchst du Hilfe? Tipp mich an!</div></button>') +
      `<div class="numpad">${keys}` +
      `<button class="key del" data-act="del" aria-label="Letzte Ziffer löschen">${ICON.del}</button>` +
      '<button class="key" data-key="0" aria-label="0">0</button>' +
      `<button class="key go" data-act="submit" aria-label="Antwort prüfen">${ICON.check}</button></div>` +
      '<div id="sheetHost"></div>',
      'task',
      test
    );
    renderAnswer();
  }

  function renderAnswer() {
    const el = $('#answer');
    if (!el || !round) return;
    el.innerHTML = round.input + (round.locked ? '' : '<span class="caret"></span>');
  }

  function tipSheet() {
    const R = round;
    const t = R.tasks[R.i];
    const tips = tipsFor(t.a, t.b);
    const k = Math.min(R.tipLevel, tips.length);
    const tip = tips[k - 1];
    const eq = tip.eq ? `<div class="eqbox">${tip.eq.map((l) => `<div>${l}</div>`).join('')}</div>` : '';
    const more = k < tips.length ? '<button class="btn btn-secondary" data-act="tip-more">Noch ein Tipp</button>' : '';
    $('#sheetHost').innerHTML =
      '<div class="scrim" data-act="tip-close"><div class="sheet" role="dialog" aria-label="Tipp vom Fuchs">' +
      `<div class="sheet-head">${foxHead('think', 'Der Fuchs denkt mit')}` +
      `<div class="bubble"><div class="label">Fuchs-Tipp ${k} von ${tips.length}</div><div class="text">${tip.t}</div></div></div>` +
      eq + `<div class="row2">${more}<button class="btn btn-primary" data-act="tip-close">Weiter rechnen</button></div></div></div>`;
  }

  function explainScreen() {
    const R = round;
    const t = R.tasks[R.i];
    const per = t.b;
    // Punktgröße so wählen, dass die Reihen möglichst ohne Scrollen auf den Bildschirm passen
    const room = window.innerHeight - 486;
    const dot = clamp(Math.floor(room / t.a) - 6, 12, per > 7 ? 20 : 24);
    const rows = [];
    for (let r = 1; r <= t.a; r++) rows.push(`<div class="dotrow"><div class="d">${'<i></i>'.repeat(per)}</div><b>${r * per}</b></div>`);
    show(
      topbarHtml(R) + progressHtml(R, false) +
      `<div class="verdict">${ICON.cross}<div><small>Nicht ganz! Richtig ist:</small><div class="big">${t.a} × ${t.b} = ${t.a * t.b}</div></div></div>` +
      `<div class="explain-fox">${foxHead('think', 'Der Fuchs erklärt')}` +
      `<div class="bubble">Kein Problem! <b>${t.a} × ${t.b}</b> heißt: ${t.a} Mal die ${t.b}. Schau mal:</div></div>` +
      `<div class="dots" style="--dot:${dot}px"><div class="cap">${t.a === 1 ? '1 Reihe' : t.a + ' Reihen'} mit je ${t.b} ${t.b === 1 ? 'Punkt' : 'Punkten'}</div>${rows.join('')}</div>` +
      `<div class="actions"><button class="btn btn-primary big" data-act="next"><span>Weiter</span>${ICON.next}</button></div>`,
      'task'
    );
  }

  function confettiHtml() {
    const colors = ['#F08A24', '#2F7D4F', '#FFC21A', '#F4978E'];
    let h = '';
    for (let i = 0; i < 16; i++) {
      // Konfetti nur an den Seiten, damit der Text lesbar bleibt
      const left = i % 2 === 0 ? rand(7) : 92 + rand(5);
      h += `<i style="left:${left}%;top:${rand(75)}%;width:${8 + rand(10)}px;height:${8 + rand(10)}px;background:${colors[rand(4)]};transform:rotate(${rand(90) - 45}deg)"></i>`;
    }
    return `<div class="confetti" aria-hidden="true">${h}</div>`;
  }

  function resultScreen(stars, newRecord) {
    const R = round;
    const title = stars >= 4 ? 'Geschafft!' : stars >= 2 ? 'Gut gemacht!' : 'Weiter üben!';
    const need = STAR_MIN[stars] - R.correct;
    const sub = stars >= 5
      ? 'Perfekt! Du hast alle Aufgaben richtig gelöst.'
      : `${LEVELS[R.level].name} · noch ${need} richtige ${need === 1 ? 'Antwort' : 'Antworten'} bis zum nächsten Stern!`;
    const big = [0, 1, 2, 3, 4].map((k) => starSvg(k < stars, 56)).join('');
    show(
      (stars >= 3 ? confettiHtml() : '') +
      `<h1>${title}</h1>` +
      foxHead(stars >= 3 ? 'cheer' : 'happy', stars >= 3 ? 'Der Fuchs freut sich' : 'Der Fuchs macht dir Mut', 'fox') +
      `<div class="big-stars" role="img" aria-label="${stars} von 5 Sternen">${big}</div>` +
      (newRecord ? '<div class="newrecord">Neuer Rekord!</div>' : '') +
      `<div class="score">${R.correct} von ${R.tasks.length} richtig</div>` +
      `<div class="sub">${sub}</div>` +
      '<div class="actions"><button class="btn btn-primary big" data-act="levels"><span>Zu den Stufen</span></button>' +
      `<button class="btn btn-secondary" data-act="start-level" data-level="${R.level}">Nochmal versuchen</button></div>`,
      'result'
    );
  }

  /* ---- Fuchs-Test ---- */
  function testIntroScreen() {
    cancelTimer();
    round = null;
    const sparks = [[10, 7, 4], [28, 3, 3], [48, 9, 5], [64, 4, 3], [92, 14, 4], [84, 19, 3], [38, 15, 3], [5, 17, 3]]
      .map(([x, y, s]) => `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px"></i>`).join('');
    const best = save.testBest > 0
      ? `<div class="best">${save.testPassed ? 'Bestanden! ' : ''}Bestes Ergebnis: ${save.testBest} von ${TEST_TASKS}</div>` : '';
    show(
      '<div class="moon"></div><div class="moon2"></div>' +
      `<div class="sparkles" aria-hidden="true">${sparks}</div><div class="nhill"></div><div class="nhill2"></div>` +
      `<div class="topbar"><button class="icon-btn" data-act="home" aria-label="Zurück zum Start">${ICON.back}</button></div>` +
      '<div><h1>Fuchs-Test</h1><p class="lead">Zeig, was du kannst!</p></div>' +
      '<div class="rules">' +
      '<div class="rule"><div class="ic" style="background:#F08A24"><svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9" fill="none" stroke="#4A2C17" stroke-width="2.8" stroke-linecap="round"/></svg></div>' +
      `<div><b>${TEST_TASKS} schwere Aufgaben</b><span>aus dem ganzen Einmaleins</span></div></div>` +
      `<div class="rule"><div class="ic" style="background:#FBE1DD">${heartSvg(true, 30).replace('#FF6B6B', '#E5484D')}</div>` +
      `<div class="grow"><b>${TEST_LIVES} Leben</b><span>Jeder Fehler kostet 1 Leben</span></div></div>` +
      '<div class="rule"><div class="ic" style="background:#DFE6F3"><svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" fill="none" stroke="#27364F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 4l16 16" stroke="#C8372D" stroke-width="2.6" stroke-linecap="round"/></svg></div>' +
      '<div><b>Kein Fuchs-Tipp</b><span>Hier rechnest du ganz allein</span></div></div></div>' +
      `<div class="actions">${best}<button class="btn btn-primary big" data-act="start-test"><span>Test starten</span></button></div>`,
      'night',
      true
    );
  }

  function testWinScreen() {
    const R = round;
    show(
      '<div class="nhill"></div><div class="nhill2"></div>' + confettiHtml() +
      `<div class="medal">${medalSvg()}</div>` +
      '<h1>Test bestanden!</h1>' +
      `<p class="lead">${R.correct} von ${TEST_TASKS} richtig${R.lives === TEST_LIVES ? ' und kein Leben verloren' : ''}. Du bist ein echter Meisterfuchs!</p>` +
      `<div class="hearts-inline big-hearts" role="img" aria-label="${R.lives} von ${TEST_LIVES} Leben übrig" style="display:flex;gap:8px">${[0, 1, 2].map((i) => heartSvg(i < R.lives, 44)).join('')}</div>` +
      '<div class="actions"><button class="btn btn-primary big" data-act="home"><span>Zum Start</span></button>' +
      '<button class="btn btn-secondary" data-act="start-test">Noch mal testen</button></div>',
      'night over',
      true
    );
  }

  function testOverScreen() {
    const R = round;
    const w = R.lastWrong;
    show(
      '<div class="nhill"></div><div class="nhill2"></div>' +
      `<div class="big-hearts" role="img" aria-label="0 von ${TEST_LIVES} Leben übrig" style="display:flex;gap:10px">${[0, 1, 2].map(() => heartSvg(false, 68)).join('')}</div>` +
      '<h1>Alle Leben weg</h1>' +
      `<p class="lead">Du hast ${R.correct} von ${TEST_TASKS} Aufgaben geschafft. ${R.correct >= 13 ? 'Das war schon richtig stark!' : R.correct >= 5 ? 'Das ist ein guter Anfang!' : 'Übe noch ein bisschen, dann klappt es!'}</p>` +
      progressHtml(R, false) +
      `<div class="last"><small>Die letzte Aufgabe</small><div class="big">${w.a} × ${w.b} = ${w.a * w.b}</div><div class="you">Deine Antwort war ${w.given}</div></div>` +
      '<div class="actions"><button class="btn btn-primary big" data-act="start-test"><span>Nochmal versuchen</span></button>' +
      '<button class="btn btn-secondary" data-act="levels">Erst noch üben</button></div>',
      'night over',
      true
    );
  }

  /* ---- Dialog ---- */
  function confirmDialog(title, text, yesLabel, noLabel, onYes) {
    modalEl.hidden = false;
    modalEl.innerHTML =
      `<div class="modal" role="alertdialog" aria-label="${title}"><h2>${title}</h2><p>${text}</p>` +
      `<button class="btn btn-primary" data-modal="no">${noLabel}</button>` +
      `<button class="btn btn-secondary" data-modal="yes">${yesLabel}</button></div>`;
    modalEl._onYes = onYes;
  }
  function closeDialog() { modalEl.hidden = true; modalEl.innerHTML = ''; modalEl._onYes = null; }

  /* ================= 7  Ablauf ================= */
  let round = null;

  function cancelTimer() { if (round && round.timer) { clearTimeout(round.timer); round.timer = null; } }
  function later(fn, ms) { cancelTimer(); round.timer = setTimeout(() => { round && (round.timer = null); fn(); }, ms); }

  function startPractice(levelIndex) {
    cancelTimer();
    round = { mode: 'practice', level: levelIndex, tasks: genPractice(levelIndex), i: 0, input: '', results: [], correct: 0, locked: false, tipLevel: 0, timer: null };
    taskScreen();
  }
  function startTest() {
    cancelTimer();
    round = { mode: 'test', tasks: genTest(), i: 0, input: '', results: [], correct: 0, lives: TEST_LIVES, locked: false, tipLevel: 0, timer: null, lastWrong: null };
    taskScreen();
  }

  function nextTask() {
    const R = round;
    R.i++;
    if (R.i >= R.tasks.length) return finishRound();
    taskScreen();
  }

  function finishRound() {
    const R = round;
    if (R.mode === 'practice') {
      const stars = starsFor(R.correct);
      const newRecord = stars > save.stars[R.level];
      if (newRecord) save.stars[R.level] = stars;
      persist();
      resultScreen(stars, newRecord);
    } else {
      save.testBest = Math.max(save.testBest, R.correct);
      save.testPassed = true;
      persist();
      testWinScreen();
    }
  }

  function submit() {
    const R = round;
    if (!R || R.locked || !$('#answer')) return;
    const answerEl = $('#answer');
    if (R.input === '') {
      answerEl.classList.remove('bad'); void answerEl.offsetWidth; answerEl.classList.add('bad');
      setTimeout(() => answerEl.classList.remove('bad'), 450);
      return;
    }
    const t = R.tasks[R.i];
    const given = parseInt(R.input, 10);
    const ok = given === t.a * t.b;
    R.results[R.i] = ok;
    R.locked = true;
    if (ok) R.correct++;
    answerEl.classList.add(ok ? 'ok' : 'bad');
    renderAnswer();
    const fb = $('#feedback');

    if (R.mode === 'practice') {
      if (ok) {
        fb.textContent = 'Richtig!'; fb.className = 'feedback ok';
        later(nextTask, 800);
      } else {
        if (navigator.vibrate) navigator.vibrate(80);
        later(explainScreen, 500);
      }
      return;
    }
    // Fuchs-Test
    if (ok) {
      fb.textContent = 'Richtig!'; fb.className = 'feedback ok';
      later(nextTask, 650);
    } else {
      R.lives--;
      R.lastWrong = { a: t.a, b: t.b, given };
      if (navigator.vibrate) navigator.vibrate(120);
      fb.textContent = `Richtig wäre ${t.a * t.b}`; fb.className = 'feedback bad';
      const hearts = $('#hearts');
      if (hearts) {
        hearts.innerHTML = [0, 1, 2].map((i) => heartSvg(i < R.lives, 26)).join('');
        hearts.setAttribute('aria-label', `${R.lives} von ${TEST_LIVES} Leben übrig`);
        const lost = hearts.children[R.lives];
        if (lost) lost.classList.add('heart-pop');
      }
      later(() => {
        if (R.lives <= 0) {
          save.testBest = Math.max(save.testBest, R.correct);
          persist();
          testOverScreen();
        } else nextTask();
      }, 1500);
    }
  }

  /* ================= 8  Eingaben ================= */
  function pressKey(d) {
    const R = round;
    if (!R || R.locked || !$('#answer')) return;
    if (R.input.length >= 3) return;
    R.input = R.input === '0' ? d : R.input + d;
    renderAnswer();
  }
  function pressDel() {
    const R = round;
    if (!R || R.locked || !$('#answer')) return;
    R.input = R.input.slice(0, -1);
    renderAnswer();
  }

  document.addEventListener('click', (e) => {
    const modalBtn = e.target.closest('[data-modal]');
    if (modalBtn) {
      const yes = modalBtn.dataset.modal === 'yes';
      const fn = modalEl._onYes;
      closeDialog();
      if (yes && fn) fn();
      return;
    }
    if (!modalEl.hidden) return;

    const keyBtn = e.target.closest('[data-key]');
    if (keyBtn) return pressKey(keyBtn.dataset.key);

    const actEl = e.target.closest('[data-act]');
    if (!actEl) return;
    const act = actEl.dataset.act;
    // Klick auf den dunklen Hintergrund des Tipp-Fensters schließt es, Klick im Fenster nicht
    if (actEl.classList.contains('scrim') && e.target !== actEl) return;

    switch (act) {
      case 'home': homeScreen(); break;
      case 'levels': levelsScreen(); break;
      case 'start-level': startPractice(+actEl.dataset.level); break;
      case 'test-intro': testIntroScreen(); break;
      case 'start-test': startTest(); break;
      case 'del': pressDel(); break;
      case 'submit': submit(); break;
      case 'next': nextTask(); break;
      case 'tip':
        if (round && !round.locked) { round.tipLevel = 1; tipSheet(); }
        break;
      case 'tip-more':
        if (round) { round.tipLevel++; tipSheet(); }
        break;
      case 'tip-close': {
        const host = $('#sheetHost');
        if (host) host.innerHTML = '';
        break;
      }
      case 'quit': {
        const test = round && round.mode === 'test';
        confirmDialog(
          test ? 'Test abbrechen?' : 'Üben beenden?',
          test ? 'Dann zählt dieser Versuch nicht.' : 'Deine Sterne bleiben, aber diese Runde geht verloren.',
          test ? 'Abbrechen' : 'Beenden', 'Weitermachen',
          () => { if (test) testIntroScreen(); else levelsScreen(); }
        );
        break;
      }
      default: break;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!modalEl.hidden || !round || !$('#answer')) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === 'Backspace') pressDel();
    else if (e.key === 'Enter') submit();
    else if (e.key === 'Escape') { const host = $('#sheetHost'); if (host) host.innerHTML = ''; }
  });

  /* ================= 9  Start ================= */
  window.__fuchs = { tipsFor, genPractice, genTest, starsFor, LEVELS }; // nur zum Testen
  homeScreen();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
