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
      hour < 6 ? "Still up? welcome to my little corner" :
      hour < 12 ? "Good morning · welcome to my little corner" :
      hour < 18 ? "Good afternoon · welcome to my little corner" :
      "Good evening · welcome to my little corner";
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
    $("#lotNo").textContent = "No." + String(idx + 1).padStart(2, "0") + " · " + today.replace(/-/g, ".");
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
    if (pets == null) return;
    say(pets ? "摸摸我 🐾" : "还没人摸过小暖，你来当第一个吧 🐾");
  };
  // 第一次来的访客：让小暖先打个招呼
  if (dog && !store.get("metNuan")) {
    setTimeout(() => {
      bubble.textContent = "你好呀，我是小暖 🐾";
      dog.classList.add("hello");
      setTimeout(() => { dog.classList.remove("hello"); showCount(); }, 4500);
    }, 1800);
    store.set("metNuan", "1");
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
    dog.classList.add("petted");
    clearTimeout(petTimer);
    petTimer = setTimeout(() => dog.classList.remove("petted"), 1400);
    const r = dog.getBoundingClientRect();
    heart(e && e.clientX ? e.clientX : r.left + r.width / 2, e && e.clientY ? e.clientY : r.top + 20);
    local++;
    let line = PET_LINES[Math.floor(Math.random() * PET_LINES.length)];
    if (local === 1) line = "汪！我是小暖";
    if (pets != null) {
      pets++; say(line);
      api("pet", {}).then((d) => { pets = Math.max(pets, d.count); say(line); }).catch(() => {});
    } else {
      say(line);
    }
  };
  if (dog) {
    dog.addEventListener("click", pet);
    dog.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pet(); } });
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
      api("notes", { name: nameIn.value, text, color })
        .then((d) => { render(d.notes); textIn.value = ""; count(); msg.textContent = "贴好啦，谢谢你来过 ✿"; })
        .catch((err) => {
          const m = { no_links: "留言里不能带链接哦", cooldown: "一分钟只能贴一张，喝口水再来～", empty: "写点什么再贴吧" };
          msg.textContent = (err.data && m[err.data.error]) || "没贴上，稍后再试试";
        })
        .finally(() => { gbBtn.disabled = false; });
    });
  }
})();
