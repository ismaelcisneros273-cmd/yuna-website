/* ===== 点阵屏 + 小交互 =====
   - 唱片机底座的点阵屏：放歌时滚动显示歌名，停着显示 YUNA'S MIX
   - 电视换台时，屏幕角落闪一下点阵台号
   - 点 ♡ 时冒一圈小爱心
*/
(() => {
  // 5x7 点阵字模（只有大写英文、数字和几个符号；别的字会被跳过）
  const F = {
    A:"01110100011000111111100011000110001",B:"11110100011000111110100011000111110",C:"01110100011000010000100001000101110",
    D:"11110100011000110001100011000111110",E:"11111100001000011110100001000011111",F:"11111100001000011110100001000010000",
    G:"01110100011000010111100011000101111",H:"10001100011000111111100011000110001",I:"01110001000010000100001000010001110",
    J:"00111000100001000010000101001001100",K:"10001100101010011000101001001010001",L:"10000100001000010000100001000011111",
    M:"10001110111010110101100011000110001",N:"10001100011100110101100111000110001",O:"01110100011000110001100011000101110",
    P:"11110100011000111110100001000010000",Q:"01110100011000110001101011001001101",R:"11110100011000111110101001001010001",
    S:"01111100001000001110000010000111110",T:"11111001000010000100001000010000100",U:"10001100011000110001100011000101110",
    V:"10001100011000110001100010101000100",W:"10001100011000110101101011010101010",X:"10001100010101000100010101000110001",
    Y:"10001100010101000100001000010000100",Z:"11111000010001000100010001000011111",
    "0":"01110100011001110101110011000101110","1":"00100011000010000100001000010001110","2":"01110100010000100010001000100011111",
    "3":"11111000100010000010000011000101110","4":"00010001100101010010111110001000010","5":"11111100001111000001000011000101110",
    "6":"00110010001000011110100011000101110","7":"11111000010001000100010000100001000","8":"01110100011000101110100011000101110",
    "9":"01110100011000101111000010001001100"," ":"00000000000000000000000000000000000",".":"00000000000000000000000000110001100",
    "(":"00010001000100001000010000010000010",")":"01000001000001000010000100010001000","'":"01100001000100000000000000000000000",
    "-":"00000000000000011111000000000000000","&":"01100100101010001000101011001001101",",":"00000000000000000000011000010001000",
    "!":"00100001000010000100001000000000100",
  };
  const NAMES = { "方大同": "KHALIL FONG" };

  // 把一段文字变成点阵的列
  function columns(text) {
    const cols = [];
    for (const ch of String(text).toUpperCase()) {
      const g = F[ch]; if (!g) continue;
      for (let x = 0; x < 5; x++) { const col = []; for (let y = 0; y < 7; y++) col.push(g[y * 5 + x] === "1"); cols.push(col); }
      cols.push([0, 0, 0, 0, 0, 0, 0].map(() => false));
    }
    return cols;
  }

  // 一块点阵屏：canvas + 文字；文字比屏幕宽时就滚动
  function DotScreen(canvas, opts) {
    const o = Object.assign({ cols: 48, on: "#F1E2B8", off: "rgba(241,226,184,.12)", bg: "#2E323C", speed: 85 }, opts);
    const ctx = canvas.getContext("2d");
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let data = [], offset = 0, timer = null;
    const rows = 9;
    function fit() {
      const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * d)); canvas.height = Math.max(1, Math.round(r.width * d * rows / o.cols));
      canvas.style.height = (r.width * rows / o.cols) + "px";
      draw();
    }
    function draw() {
      const W = canvas.width, H = canvas.height, p = W / o.cols, rad = p * 0.36;
      ctx.fillStyle = o.bg; ctx.fillRect(0, 0, W, H);
      const scroll = data.length > o.cols;
      const start = scroll ? offset : -Math.floor((o.cols - data.length) / 2);
      for (let x = 0; x < o.cols; x++) {
        let col = null;
        if (scroll) { const i = (start + x) % (data.length + 8); col = data[i] || null; }
        else { col = data[x + start] || null; }
        for (let y = 0; y < rows; y++) {
          const lit = col && y >= 1 && y <= 7 && col[y - 1];
          ctx.fillStyle = lit ? o.on : o.off;
          ctx.beginPath(); ctx.arc(x * p + p / 2, y * p + p / 2, rad, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    function set(text) {
      data = columns(text); offset = 0; clearInterval(timer); timer = null;
      if (data.length > o.cols && !calm) timer = setInterval(() => { offset = (offset + 1) % (data.length + 8); draw(); }, o.speed);
      draw();
    }
    addEventListener("resize", fit);
    requestAnimationFrame(fit);
    return { set };
  }
  window.DotScreen = DotScreen;

  /* ---------- 唱片机底座的点阵屏 ---------- */
  const deck = document.getElementById("deckLed"), player = document.getElementById("player");
  if (deck && player) {
    const scr = DotScreen(deck, { cols: 62 });
    const update = () => {
      const cur = document.querySelector("#tracks button.cur");
      if (player.classList.contains("playing") && cur) {
        const t = cur.children[1].textContent, a = cur.children[2].textContent;
        scr.set(t + "  -  " + (NAMES[a] || a) + "     ");
      } else scr.set("YUNA'S MIX");
    };
    update();
    new MutationObserver(update).observe(player, { attributes: true, subtree: true, attributeFilter: ["class"] });
  }

  /* ---------- 电视换台：角落闪一下点阵台号 ---------- */
  const osd = document.getElementById("tvOsd");
  if (osd) {
    const scr = DotScreen(osd, { cols: 26, on: "#B8E0A8", off: "rgba(184,224,168,.0)", bg: "rgba(0,0,0,0)" });
    let t;
    document.querySelectorAll(".knob-btn").forEach((b) => b.addEventListener("click", () => {
      scr.set("CH " + b.dataset.ch); osd.classList.add("show");
      clearTimeout(t); t = setTimeout(() => osd.classList.remove("show"), 1400);
    }));
  }

  /* ---------- ♡：冒一圈小爱心 ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".like");
    if (!b || b.classList.contains("on")) return;   // 已经点过的不再放
    const r = b.getBoundingClientRect(), cx = r.left + 18, cy = r.top + r.height / 2;
    for (let i = 0; i < 8; i++) {
      const s = document.createElement("span"); s.className = "burst"; s.textContent = "♥";
      const a = (Math.PI * 2 * i) / 8, d = 26 + Math.random() * 10;
      s.style.left = cx + "px"; s.style.top = cy + "px";
      s.style.setProperty("--x", (Math.cos(a) * d).toFixed(1) + "px"); s.style.setProperty("--y", (Math.sin(a) * d).toFixed(1) + "px");
      document.body.appendChild(s); setTimeout(() => s.remove(), 700);
    }
    const c = b.querySelector(".c"); if (c) { c.classList.remove("roll"); void c.offsetWidth; c.classList.add("roll"); }
  }, true);
})();
