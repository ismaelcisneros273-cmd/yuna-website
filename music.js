/* ===== 背景音乐 + 唱片机 =====
   歌单：把 mp3 放进仓库的 music 文件夹，然后在下面加一行，例如
   { title: "歌名", artist: "歌手", src: "music/song1.mp3" },
   src 写 null 的是网页自己弹出来的八音盒小曲，不需要文件。
*/
const TRACKS = [
  { title: "小暖的八音盒", artist: "原创小曲", src: null },
];

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const player = $("#player"), np = $("#np"), list = $("#tracks"), btn = $("#music"), txt = $("#musicTxt");
  if (!btn) return;

  /* ---------- 八音盒：用 Web Audio 现场弹出来的一小段旋律 ---------- */
  const MEL = [
    [76, 79, 84, 79, 76, 79, 74, 76],   // C
    [72, 76, 81, 76, 72, 76, 79, 76],   // Am
    [69, 72, 77, 72, 74, 72, 69, 72],   // F
    [71, 74, 79, 74, 76, 74, 71, 74],   // G
  ];
  const BASS = [48, 45, 41, 43];
  class MusicBox {
    constructor() {
      const C = window.AudioContext || window.webkitAudioContext;
      const c = (this.ctx = new C());
      this.out = c.createGain(); this.out.gain.value = 0.2;
      const dl = c.createDelay(), fb = c.createGain(), wet = c.createGain();
      dl.delayTime.value = 0.3; fb.gain.value = 0.3; wet.gain.value = 0.35;
      this.out.connect(c.destination); this.out.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(c.destination);
      this.step = 0; this.timer = null;
    }
    note(m, t, v, dur) {
      const c = this.ctx, f = 440 * Math.pow(2, (m - 69) / 12), g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      for (const [mul, amp, type] of [[1, 1, "sine"], [2, 0.25, "sine"], [3.01, 0.07, "triangle"]]) {
        const o = c.createOscillator(), a = c.createGain();
        o.type = type; o.frequency.value = f * mul; a.gain.value = amp;
        o.connect(a); a.connect(g); o.start(t); o.stop(t + dur + 0.05);
      }
      g.connect(this.out);
    }
    tick() {
      const spb = 60 / 84 / 2, c = this.ctx;
      while (this.next < c.currentTime + 1.5) {
        const bar = Math.floor(this.step / 8) % 4, i = this.step % 8;
        this.note(MEL[bar][i], this.next, 0.5, 1.4);
        if (i === 0 || i === 4) this.note(BASS[bar], this.next, 0.32, 2.2);
        this.step++; this.next += spb;
      }
    }
    start() {
      this.ctx.resume();
      if (this.timer) return;
      this.next = this.ctx.currentTime + 0.1;
      this.tick();
      this.timer = setInterval(() => this.tick(), 200);
    }
    stop() { clearInterval(this.timer); this.timer = null; this.ctx.suspend(); }
  }

  /* ---------- 播放控制 ---------- */
  const audio = new Audio();
  audio.preload = "none"; audio.volume = 0.55;
  let box = null, cur = 0, playing = false;
  const buttons = [];

  TRACKS.forEach((t, i) => {
    const li = document.createElement("li"), b = document.createElement("button");
    const n = document.createElement("span"); n.className = "n"; n.textContent = String(i + 1).padStart(2, "0");
    const ti = document.createElement("span"); ti.textContent = t.title;
    const ar = document.createElement("span"); ar.className = "ar"; ar.textContent = t.artist;
    b.append(n, ti, ar); li.appendChild(b); list && list.appendChild(li); buttons.push(b);
    b.addEventListener("click", () => (i === cur && playing ? pause() : play(i)));
  });

  const ui = () => {
    const t = TRACKS[cur];
    player && player.classList.toggle("playing", playing);
    buttons.forEach((b, i) => b.classList.toggle("cur", playing && i === cur));
    if (np) np.textContent = playing ? `${t.title} — ${t.artist}` : "唱片停下来了，点一首歌继续";
    btn.classList.toggle("on", playing);
    txt.textContent = playing ? `${t.title}，点我暂停` : "音乐停了，点我继续";
  };
  const stopAll = () => { audio.pause(); if (box) box.stop(); };
  function play(i) {
    stopAll();
    cur = i;
    const t = TRACKS[i];
    playing = true;
    if (!t.src) {
      box = box || new MusicBox();
      box.start();
    } else {
      audio.src = t.src;
      audio.loop = TRACKS.length === 1;
      audio.play().catch(() => { playing = false; ui(); });
    }
    store.set("music", "on");
    ui();
  }
  function pause() { stopAll(); playing = false; store.set("music", "off"); ui(); }
  audio.addEventListener("ended", () => play((cur + 1) % TRACKS.length));
  audio.addEventListener("error", () => {
    if (!TRACKS[cur].src) return;
    buttons[cur].classList.add("missing");
    playing = false; ui();
    if (np) np.textContent = "这首歌的文件还没放进来";
  });

  btn.addEventListener("click", () => (playing ? pause() : play(cur)));

  // 浏览器不允许一打开就出声：访客第一次点页面时开始播放（之前关掉过的就不自动放）
  const off = store.get("music") === "off";
  txt.textContent = off ? "音乐关着，点我打开" : "点一下页面就会放音乐";
  if (!off) {
    const first = (e) => {
      window.removeEventListener("pointerdown", first, true);
      window.removeEventListener("keydown", first, true);
      if (e.target.closest && e.target.closest("#music, #tracks")) return;
      if (!playing) play(cur);
    };
    window.addEventListener("pointerdown", first, true);
    window.addEventListener("keydown", first, true);
  }
})();
