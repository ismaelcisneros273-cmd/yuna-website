/* ===== 新板块的小脚本 =====
   想改文字的话，主要改这几个地方：
   - LOTS：每日一签的签文
   - LUCKY：幸运色
*/

const LOTS = [
  "今天适合慢慢来，走路也是。",
  "会有一个小小的好消息，在你不注意的时候出现。",
  "适合给很久没联系的人发一句「在吗」。",
  "今天的天空值得抬头看一眼。",
  "宜：喝热的东西。忌：跟自己较劲。",
  "有人正在想念你，只是还没说出口。",
  "把一件拖了很久的小事做完，会轻松很多。",
  "今天的你，比昨天多懂了一点点。",
  "适合早点睡，梦会很好。",
  "出门的时候，留意一下路边的小狗。",
  "宜：听一首很久没听的老歌。",
  "你担心的那件事，结果会比想象中好。",
  "今天适合对自己说一句「辛苦了」。",
  "会遇到一个让你笑出声的瞬间。",
  "宜：散步，最好是日落前后。",
  "慢一点也没关系，花也不是同一天开的。",
];
const LUCKY = [["樱花粉", "#f3c6c1"], ["奶油黄", "#f1dca7"], ["抹茶绿", "#b9c8b0"], ["雾霾蓝", "#bcd0de"], ["薰衣草紫", "#d9c8e6"], ["焦糖色", "#e0a95f"]];

// 摸小暖时他会说的话，想加就往里加
const PET_LINES = [
  "汪！", "再摸一下嘛", "好舒服～", "尾巴停不下来了", "你的手好暖", "嘿嘿，再来再来",
  "耳朵也要摸摸", "小暖最喜欢你啦", "汪呜～", "下巴也痒痒的", "今天也要开心哦", "我会乖乖看家的",
];

const PIXEL_COLORS = ["#fffdf9", "#f3c6c1", "#d9837d", "#f1dca7", "#e0a95f", "#b9c8b0", "#6f9a7a", "#bcd0de", "#8fa8d6", "#3b3230"];
const STICKERS = ["🐶", "☕", "🌙", "🌸", "⭐", "🎵", "📷", "🍰"];
const NOTE_COLORS = ["var(--n0)", "var(--n1)", "var(--n2)", "var(--n3)", "var(--n4)"];

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  // 和后端说话；没连数据库（503）或本地没有接口（404）都当作「还没开放」
  async function api(path, body, method) {
    let r;
    try {
      r = await fetch("/api/" + path, {
        method: method || (body ? "POST" : "GET"),
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) { throw Object.assign(new Error("offline"), { offline: true }); }
    let data = {};
    try { data = await r.json(); } catch (e) {}
    if (r.status === 503 || r.status === 404 || r.status === 405) throw Object.assign(new Error("offline"), { offline: true });
    if (!r.ok) throw Object.assign(new Error(data.error || "error"), { status: r.status, data });
    return data;
  }

  const hour = new Date().getHours();
  const night = hour >= 19 || hour < 6;

  /* ---------- 问候语 + 夜空 ---------- */
  const greet = $("#greet");
  if (greet) {
    greet.textContent =
      hour < 6 ? "这么晚还没睡呀。" :
      hour < 12 ? "早上好。" :
      hour < 18 ? "下午好。" :
      "晚上好。";
  }
  const stars = $("#stars");
  if (stars) {
    for (let i = 0; i < 46; i++) {
      const s = el("i");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 80 + "%";
      s.style.animationDelay = -Math.random() * 3 + "s";
      const z = 1 + Math.random() * 2.2;
      s.style.width = s.style.height = z + "px";
      stars.appendChild(s);
    }
  }

  /* ---------- 我的房间：窗外跟着时间变，点东西有小动静 ---------- */
  const room = $("#roomCard"), roomTime = $("#roomTime");
  if (room) {
    const phase = () => {
      const d = new Date(), h = d.getHours();
      const p = h >= 19 || h < 5 ? "night" : (h >= 17 || h < 7) ? "dusk" : "day";
      room.classList.toggle("night", p === "night");
      room.classList.toggle("dusk", p === "dusk");
      if (p === "night" && !room.dataset.touched) room.classList.add("lit");
      const words = {
        night: h < 5 ? "窗外已经满天星星了，早点睡呀" : "窗外月亮出来了",
        dusk: h < 12 ? "窗外天刚亮，粉粉的" : "窗外正好是日落",
        day: h < 12 ? "窗外是上午的蓝天" : "窗外是下午的晴天",
      }[p];
      const t = d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
      if (roomTime) roomTime.innerHTML = `你那边现在是 <b>${t}</b>，${words}。点点台灯和相机试试 ✨`;
    };
    phase();
    setInterval(phase, 30000);
    const flash = $(".flash", room);
    const react = (o) => {
      const k = o.dataset.k;
      if (k === "lamp") { room.dataset.touched = "1"; room.classList.toggle("lit"); return; }
      if (k === "camera") { flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); }
      if (k === "coffee") { room.classList.add("puff"); setTimeout(() => room.classList.remove("puff"), 2000); }
      o.classList.remove("wiggle"); void o.getBBox(); o.classList.add("wiggle");
    };
    $$(".obj", room).forEach((o) => {
      o.addEventListener("click", () => react(o));
      o.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); react(o); } });
      o.addEventListener("animationend", () => o.classList.remove("wiggle"));
    });
  }

  /* 唱片机和背景音乐在 music.js 里 */

  /* ---------- 每日一签 ---------- */
  const lot = $("#lot"), drawBtn = $("#draw-lot");
  if (lot && drawBtn) {
    const today = new Date().toLocaleDateString("sv");
    let vid = store.get("vid");
    if (!vid) { vid = Math.random().toString(36).slice(2); store.set("vid", vid); }
    let h = 2166136261;
    for (const c of today + vid) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    h >>>= 0;
    const idx = h % LOTS.length, [cname, chex] = LUCKY[(h >>> 8) % LUCKY.length];
    $("#lotNo").textContent = "第 " + (idx + 1) + " 签，" + today.replace(/-/g, ".");
    $("#lotMsg").textContent = LOTS[idx];
    $("#lotSw").style.background = chex;
    $("#lotColor").textContent = cname;
    const open = () => {
      lot.classList.add("open");
      drawBtn.disabled = true;
      drawBtn.textContent = "今天已经抽过啦";
      $("#lotAgain").textContent = "明天再来，会是新的一支";
      store.set("lot", today);
    };
    if (store.get("lot") === today) open();
    drawBtn.addEventListener("click", open);
  }

  /* ---------- 摸摸小狗 ---------- */
  const dog = $("#dog"), bubble = $("#dogBubble");
  let pets = null, local = 0, petTimer;
  const say = (line) => {
    bubble.textContent = line;
    if (pets) { bubble.appendChild(el("small", null, "小暖被摸了 " + pets.toLocaleString() + " 次")); }
  };
  const showCount = () => {
    if (pets == null || dog.classList.contains("asleep")) return;
    say(pets ? "摸摸我 🐾" : "还没人摸过小暖，你来当第一个吧 🐾");
  };
  // 访客编号：第一次来领一个号，之后一直记着
  const visitor = $("#visitor");
  const showVisit = (n) => {
    if (!visitor || !n) return;
    visitor.innerHTML = "";
    visitor.append("你是第 ", el("b", null, Number(n).toLocaleString()), " 位来串门的朋友 ✿");
  };
  let visitNo = Number(store.get("visitNo")) || null;
  const visitReady = visitNo ? Promise.resolve(visitNo)
    : api("visit", {}).then((d) => { visitNo = d.n; store.set("visitNo", String(d.n)); return d.n; }).catch(() => null);
  visitReady.then(showVisit);

  // 小暖的作息：22:00-7:00 打瞌睡，摸一下会醒，过一会儿又睡着
  const sleepy = () => { const h = new Date().getHours(); return h >= 22 || h < 7; };
  let napTimer;
  const doze = () => {
    clearTimeout(napTimer);
    napTimer = setTimeout(() => { if (sleepy()) { dog.classList.add("asleep"); bubble.textContent = "zzz……小暖睡着了"; } }, 9000);
  };
  if (dog && sleepy()) { dog.classList.add("asleep"); bubble.textContent = "zzz……小暖睡着了，摸摸他？"; }

  // 第一次来的访客：让小暖先打个招呼
  if (dog && !store.get("metNuan") && !sleepy()) {
    setTimeout(() => {
      bubble.textContent = visitNo ? `你好呀，第 ${visitNo} 位朋友！我是小暖 🐾` : "你好呀，我是小暖 🐾";
      dog.classList.add("hello");
      setTimeout(() => { dog.classList.remove("hello"); showCount(); }, 5000);
    }, 2000);
    store.set("metNuan", "1");
  }

  // 白天：头和眼睛跟着鼠标转
  const look = dog && $(".look", dog), eyes = dog && $(".open", dog);
  if (look && matchMedia("(pointer:fine)").matches) {
    let raf = 0, mx = 0, my = 0;
    window.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (dog.classList.contains("asleep")) { look.style.transform = ""; eyes.style.transform = ""; return; }
        const r = dog.getBoundingClientRect();
        const dx = Math.max(-1, Math.min(1, (mx - (r.left + r.width / 2)) / 400));
        const dy = Math.max(-1, Math.min(1, (my - (r.top + r.height * 0.4)) / 400));
        look.style.transform = `translate(${dx * 3}px, ${dy * 2}px) rotate(${dx * 7}deg)`;
        eyes.style.transform = `translate(${dx * 1.6}px, ${dy * 1.4}px)`;
      });
    }, { passive: true });
  }
  api("pet").then((d) => { pets = d.count; showCount(); }).catch(() => {});
  const heart = (x, y) => {
    const s = el("span", "heart", Math.random() < 0.7 ? "♥" : "🐾");
    s.style.left = x - 8 + "px"; s.style.top = y - 16 + "px";
    s.style.color = "#d9837d";
    s.style.setProperty("--dx", (Math.random() * 50 - 25).toFixed(0) + "px");
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1200);
  };
  const pet = (e) => {
    const wasAsleep = dog.classList.contains("asleep");
    dog.classList.remove("asleep");
    if (sleepy()) doze();
    dog.classList.add("petted");
    clearTimeout(petTimer);
    petTimer = setTimeout(() => dog.classList.remove("petted"), 1400);
    const r = dog.getBoundingClientRect();
    heart(e && e.clientX ? e.clientX : r.left + r.width / 2, e && e.clientY ? e.clientY : r.top + 20);
    local++;
    let line = PET_LINES[Math.floor(Math.random() * PET_LINES.length)];
    if (local === 1) line = "汪！我是小暖";
    if (wasAsleep) line = ["唔……你来啦", "（揉眼睛）汪？", "被你摸醒了……", "再睡五分钟嘛"][Math.floor(Math.random() * 4)];
    if (pets != null) {
      pets++; say(line);
      api("pet", {}).then((d) => { pets = Math.max(pets, d.count); say(line); }).catch(() => {});
    } else {
      say(line);
    }
  };
  if (dog) {
    // Mac Safari 有时不把 click 交给固定在角落的元素，所以同时听 pointerup，并避免一次点击算两次
    let lastPet = 0;
    const petOnce = (e) => { const now = Date.now(); if (now - lastPet < 350) return; lastPet = now; pet(e); };
    dog.addEventListener("pointerup", petOnce);
    dog.addEventListener("click", petOnce);
    dog.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); petOnce(); } });
  }

  /* ---------- 彩蛋：连点 logo 五下，小狗跑过屏幕 ---------- */
  const logo = $("#logo");
  let clicks = [];
  if (logo && dog) {
    logo.addEventListener("click", () => {
      const now = Date.now();
      clicks = clicks.filter((t) => now - t < 2500).concat(now);
      if (clicks.length >= 5) {
        clicks = [];
        const run = el("div", "runner");
        run.innerHTML = $("svg", dog).outerHTML;
        document.body.appendChild(run);
        setTimeout(() => run.remove(), 3800);
      }
    });
  }
  console.log("%c✿ 你发现了这里！试试连点左上角的 Yuna 五下。", "color:#c98b86;font-size:14px");

  /* ---------- 动画角：小电视的画面 + 换台 ---------- */
  const SCREENS = {
    "s-portal": `<svg viewBox="0 0 160 120"><rect width="160" height="120" fill="#0c2417"/>
      <g class="spin"><circle cx="80" cy="60" r="46" fill="#2f9e44"/><circle cx="80" cy="60" r="36" fill="#7ee05a"/><circle cx="80" cy="60" r="26" fill="#3fb54f"/><circle cx="80" cy="60" r="15" fill="#c8f7a0"/>
      <path d="M80 60 m0 -40 a40 40 0 0 1 34 58 M80 60 m0 34 a34 34 0 0 1 -30 -50 M80 60 m22 6 a22 22 0 0 1 -30 10" stroke="#e9ffd2" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/></g>
      <circle cx="20" cy="18" r="1.2" fill="#fff" class="twinkle"/><circle cx="140" cy="100" r="1.4" fill="#fff" class="twinkle"/><circle cx="135" cy="20" r="1" fill="#fff"/></svg>`,
    "s-forest": `<svg viewBox="0 0 160 120"><defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#231a45"/><stop offset=".7" stop-color="#6a4a8c"/><stop offset="1" stop-color="#e7a3a0"/></linearGradient></defs>
      <rect width="160" height="120" fill="url(#fg)"/><circle cx="118" cy="30" r="12" fill="#fff1c9"/>
      <g fill="#fff"><circle cx="20" cy="20" r="1.2" class="twinkle"/><circle cx="60" cy="12" r="1"/><circle cx="85" cy="34" r="1.3" class="twinkle"/><circle cx="145" cy="58" r="1"/></g>
      <g fill="#1a1330"><polygon points="0,120 14,62 28,120"/><polygon points="20,120 38,48 56,120"/><polygon points="48,120 62,74 76,120"/><polygon points="96,120 112,56 128,120"/><polygon points="120,120 140,66 160,120"/><rect y="112" width="160" height="8"/></g>
      <rect x="74" y="98" width="14" height="10" fill="#f1dca7" opacity=".9"/><polygon points="72,99 81,90 90,99" fill="#3a2a55"/></svg>`,
    "s-secret": `<svg viewBox="0 0 160 120"><rect width="160" height="120" fill="#1b2232"/>
      <path d="M0 20 H160 M0 40 H160 M0 60 H160 M0 80 H160 M0 100 H160 M20 0 V120 M40 0 V120 M60 0 V120 M80 0 V120 M100 0 V120 M120 0 V120 M140 0 V120" stroke="#2c3850" stroke-width="1"/>
      <g transform="rotate(-6 80 62)"><rect x="34" y="30" width="92" height="64" rx="4" fill="#e9d8b4"/><rect x="34" y="24" width="36" height="10" rx="3" fill="#e9d8b4"/>
      <path d="M44 48 h50 M44 56 h62 M44 64 h40" stroke="#b9a37c" stroke-width="2.5"/>
      <g transform="rotate(-14 92 76)"><rect x="62" y="66" width="62" height="20" rx="3" fill="none" stroke="#d64541" stroke-width="2.5"/><text x="93" y="81" text-anchor="middle" font-size="11" font-weight="700" fill="#d64541" font-family="sans-serif">TOP SECRET</text></g></g></svg>`,
    "s-planet": `<svg viewBox="0 0 160 120"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1846"/><stop offset="1" stop-color="#d9707a"/></linearGradient></defs>
      <rect width="160" height="120" fill="url(#pg)"/>
      <g fill="#fff"><circle cx="18" cy="24" r="1.2" class="twinkle"/><circle cx="140" cy="16" r="1.4"/><circle cx="128" cy="96" r="1" class="twinkle"/><circle cx="40" cy="100" r="1"/></g>
      <ellipse cx="74" cy="66" rx="52" ry="12" fill="none" stroke="#f6c9a0" stroke-width="3" opacity=".6"/>
      <circle cx="74" cy="64" r="28" fill="#f29b5b"/><path d="M50 56 q24 -8 48 0 M48 68 q26 8 52 0" stroke="#e07a3f" stroke-width="3" fill="none"/>
      <path d="M22 66 a52 12 0 0 0 104 0" fill="none" stroke="#f6c9a0" stroke-width="3"/>
      <g transform="translate(122 36) rotate(-12)"><ellipse rx="14" ry="4" fill="#cfd8e6"/><ellipse cy="-3" rx="6" ry="4" fill="#9ad7e8"/></g></svg>`,
  };
  $$(".tv").forEach((tv) => {
    const sc = $(".screen", tv);
    const key = [...sc.classList].find((c) => SCREENS[c]);
    if (key && !$("img", sc)) sc.insertAdjacentHTML("afterbegin", SCREENS[key]);
    let t;
    $(".set", tv).addEventListener("click", () => {
      tv.classList.add("zap"); clearTimeout(t);
      t = setTimeout(() => tv.classList.remove("zap"), 420);
    });
  });

  /* ---------- 电影 ♡ ---------- */
  const likes = $$(".like");
  const setLike = (b, n) => { b.dataset.n = n; $(".c", b).textContent = n; $(".h", b).textContent = b.classList.contains("on") ? "♥" : "♡"; };
  if (likes.length) {
    api("likes").then((d) => {
      likes.forEach((b) => {
        const film = b.dataset.film;
        if (store.get("like:" + film)) b.classList.add("on");
        setLike(b, d.likes[film] || 0);
        b.hidden = false;
        b.addEventListener("click", () => {
          if (b.classList.contains("on")) return;
          b.classList.add("on");
          store.set("like:" + film, "1");
          setLike(b, Number(b.dataset.n) + 1);
          api("likes", { film }).then((r) => setLike(b, Math.max(Number(b.dataset.n), r.likes[film] || 0))).catch(() => {});
        });
      });
    }).catch(() => {});
  }

  /* ---------- 一起画像素画 ---------- */
  const drawSec = $("#draw"), board = $("#board"), palBox = $("#pal"), pixStatus = $("#pixStatus");
  if (drawSec && board) {
    let size = 24, sel = 2, cooldownUntil = 0, count = 0, cdTimer;
    const cells = [];
    const build = () => {
      board.innerHTML = "";
      board.style.gridTemplateColumns = `repeat(${size},1fr)`;
      cells.length = 0;
      for (let i = 0; i < size * size; i++) {
        const c = el("i"); c.dataset.i = i; cells.push(c); board.appendChild(c);
      }
    };
    build();
    PIXEL_COLORS.forEach((hex, i) => {
      const b = el("button"); b.type = "button"; b.style.background = hex; b.setAttribute("aria-label", "颜色 " + (i + 1));
      if (i === sel) b.classList.add("sel");
      b.addEventListener("click", () => { sel = i; $$("button", palBox).forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); });
      palBox.appendChild(b);
    });
    const status = () => {
      const left = Math.ceil((cooldownUntil - Date.now()) / 1000);
      pixStatus.textContent = left > 0
        ? `涂好啦 ✿ ${left} 秒后可以再涂一格`
        : `这幅画上已经落了 ${count.toLocaleString()} 笔，挑个格子吧`;
      if (left <= 0) clearInterval(cdTimer);
    };
    const startCooldown = (sec) => { cooldownUntil = Date.now() + sec * 1000; clearInterval(cdTimer); cdTimer = setInterval(status, 1000); status(); };
    const render = (d) => {
      if (d.size && d.size !== size) { size = d.size; build(); }
      cells.forEach((c, i) => { const v = d.grid[i]; c.style.background = v == null ? "" : PIXEL_COLORS[v]; });
      count = d.count; status();
    };
    const load = () => api("pixels").then(render).catch((e) => { if (e.offline) drawSec.classList.add("offline"); });
    load();
    setInterval(() => { if (document.visibilityState === "visible" && !drawSec.classList.contains("offline")) load(); }, 20000);
    board.addEventListener("click", (e) => {
      const c = e.target.closest("i"); if (!c) return;
      if (Date.now() < cooldownUntil) { status(); pixStatus.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], 260); return; }
      const prev = c.style.background;
      c.style.background = PIXEL_COLORS[sel];
      c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop");
      api("pixels", { i: Number(c.dataset.i), c: sel })
        .then((d) => { render(d); startCooldown(d.cooldown || 20); })
        .catch((err) => {
          c.style.background = prev;
          if (err.status === 429) startCooldown((err.data && err.data.wait) || 20);
          else pixStatus.textContent = "画笔好像卡住了，稍后再试试";
        });
    });
  }

  /* ---------- 便利贴留言墙 ---------- */
  const gbSec = $("#guestbook"), wall = $("#wall"), form = $("#gbForm");
  if (gbSec && wall && form) {
    const nameIn = $("#gbName"), textIn = $("#gbText"), msg = $("#gbMsg"), gbBtn = $("#gbBtn"), swBox = $("#gbSw");
    let color = Math.floor(Math.random() * NOTE_COLORS.length);
    NOTE_COLORS.forEach((c, i) => {
      const b = el("button"); b.type = "button"; b.style.background = c; b.setAttribute("aria-label", "便利贴颜色 " + (i + 1));
      if (i === color) b.classList.add("sel");
      b.addEventListener("click", () => { color = i; $$("button", swBox).forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); });
      swBox.appendChild(b);
    });
    let sticker = -1;
    const stBox = $("#gbSt");
    [-1, ...STICKERS.keys()].forEach((i) => {
      const b = el("button", i === -1 ? "sel none" : null, i === -1 ? "不要" : STICKERS[i]);
      b.type = "button";
      b.setAttribute("aria-label", i === -1 ? "不要贴纸" : "贴纸 " + STICKERS[i]);
      b.addEventListener("click", () => { sticker = i; $$("button", stBox).forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); });
      stBox.appendChild(b);
    });
    nameIn.value = store.get("gbName") || "";
    const count = () => { msg.textContent = textIn.value.length + " / 120"; };
    textIn.addEventListener("input", count);
    const fmt = (t) => { const d = new Date(t); return `${d.getMonth() + 1}月${d.getDate()}日`; };
    const render = (notes) => {
      wall.innerHTML = "";
      if (!notes.length) { wall.appendChild(el("div", "wall-empty", "还没有人留言，来当第一个吧 ✿")); return; }
      notes.forEach((n, i) => {
        const d = el("div", "note");
        d.style.background = NOTE_COLORS[n.color] || NOTE_COLORS[0];
        d.style.transform = `rotate(${Number(n.rot) || 0}deg)`;
        d.style.animationDelay = Math.min(i, 20) * 40 + "ms";
        const by = el("div", "by");
        by.append(el("span", null, "— " + n.name), el("span", null, fmt(n.t)));
        d.append(el("p", null, n.text), by);
        if (n.st >= 0 && STICKERS[n.st]) {
          const k = el("span", "stk", STICKERS[n.st]);
          k.style.transform = `rotate(${(n.rot || 0) * -3}deg)`;
          d.appendChild(k);
        }
        wall.appendChild(d);
      });
    };
    api("notes").then((d) => render(d.notes)).catch((e) => { if (e.offline) gbSec.classList.add("offline"); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = textIn.value.trim();
      if (!text) { textIn.focus(); return; }
      gbBtn.disabled = true;
      store.set("gbName", nameIn.value.trim());
      api("notes", { name: nameIn.value, text, color, sticker })
        .then((d) => { render(d.notes); textIn.value = ""; count(); msg.textContent = "贴好啦，谢谢你来过 ✿"; })
        .catch((err) => {
          const m = { no_links: "留言里不能带链接哦", cooldown: "一分钟只能贴一张，喝口水再来～", empty: "写点什么再贴吧" };
          msg.textContent = (err.data && m[err.data.error]) || "没贴上，稍后再试试";
        })
        .finally(() => { gbBtn.disabled = false; });
    });
  }
})();
