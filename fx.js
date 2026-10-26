/* ===== 节日彩蛋 =====
   - 冬天（12-2 月）：飘雪
   - 春节前后（小年到元宵）：挂灯笼
   - 生日当天：全站撒花（把 BIRTHDAY 改成你的生日，格式 "MM-DD"）
   想提前看看效果：网址后面加 ?fx=snow / ?fx=newyear / ?fx=birthday
*/
const BIRTHDAY = "11-09"; // 生日，格式 "MM-DD"
const SPRING_FESTIVAL = ["2027-02-06", "2028-01-26", "2029-02-13", "2030-02-03", "2031-01-23", "2032-02-11"];

(() => {
  const now = new Date();
  const force = new URLSearchParams(location.search).get("fx");
  const mmdd = String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const dayMs = 864e5;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nearNewYear = SPRING_FESTIVAL.some((d) => {
    const diff = (today - new Date(d + "T00:00:00")) / dayMs;
    return diff >= -7 && diff <= 15;
  });
  const fx = {
    snow: force ? force === "snow" : [11, 0, 1].includes(now.getMonth()),
    newyear: force ? force === "newyear" : nearNewYear,
    birthday: force ? force === "birthday" : BIRTHDAY === mmdd,
  };
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const greet = document.getElementById("greet");

  /* ---------- 一块共用的画布：雪花和彩纸 ---------- */
  let cv, ctx, parts = [], running = false;
  const canvas = () => {
    if (cv) return;
    cv = document.createElement("canvas");
    cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:25";
    document.body.appendChild(cv);
    ctx = cv.getContext("2d");
    const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * d; cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    fit(); addEventListener("resize", fit);
  };
  const dark = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  };
  const loop = () => {
    if (!parts.length) { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); return; }
    running = true;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const W = innerWidth, H = innerHeight;
    parts = parts.filter((p) => {
      p.t += 1;
      if (p.kind === "snow") {
        p.y += p.vy; p.x += Math.sin((p.t + p.seed) / 40) * 0.4;
        if (p.y > H + 8) { p.y = -8; p.x = Math.random() * W; }
        ctx.globalAlpha = p.a;
        ctx.fillStyle = dark() ? "#fff8ee" : "#c3d1df";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        return true;
      }
      p.vy += 0.12; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.globalAlpha = Math.max(0, 1 - p.t / 220);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      return p.y < H + 20 && p.t < 220;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  };
  const kick = () => { if (!running) requestAnimationFrame(loop); };

  /* ---------- 冬天飘雪 ---------- */
  if (fx.snow && !calm) {
    canvas();
    const n = innerWidth < 600 ? 28 : 55;
    for (let i = 0; i < n; i++) {
      parts.push({ kind: "snow", x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 1 + Math.random() * 2.4, vy: 0.3 + Math.random() * 0.7, a: 0.5 + Math.random() * 0.5, seed: Math.random() * 300, t: 0 });
    }
    kick();
  }

  /* ---------- 生日撒花 ---------- */
  const confetti = (x, y, n = 140) => {
    canvas();
    const cs = ["#e8b4b0", "#d9837d", "#f1dca7", "#b9c8b0", "#bcd0de", "#d9c8e6", "#e0a95f"];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8, v = 6 + Math.random() * 8;
      parts.push({ kind: "c", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 5, h: 3 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: cs[i % cs.length], t: 0 });
    }
    kick();
  };
  if (fx.birthday) {
    if (greet) greet.textContent = "Today is Yuna's birthday 🎂";
    const h1 = document.querySelector(".hero h1");
    if (!calm) {
      setTimeout(() => { confetti(innerWidth * 0.25, innerHeight * 0.75); confetti(innerWidth * 0.75, innerHeight * 0.75); }, 600);
      if (h1) { h1.style.cursor = "pointer"; h1.title = "再撒一次"; h1.addEventListener("click", (e) => confetti(e.clientX, e.clientY, 90)); }
    }
    const motto = document.querySelector(".motto");
    if (motto) motto.textContent = "今天是我的生日，谢谢你来陪我过 ✿ 点我的名字还能再撒一次花";
    const b = document.getElementById("dogBubble");
    if (b) setTimeout(() => { b.textContent = "今天是 Yuna 的生日！汪！"; }, 2500);
  }

  /* ---------- 春节灯笼 ---------- */
  if (fx.newyear) {
    if (greet) greet.textContent = "新年快乐 · Happy Lunar New Year 🧧";
    const style = document.createElement("style");
    style.textContent = `.lantern{position:absolute;top:0;z-index:2;width:58px;transform-origin:50% 0;animation:swing 3.6s ease-in-out infinite}
      .lantern.l{left:6%}.lantern.r{right:6%;animation-delay:-1.8s}
      @keyframes swing{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
      @media(prefers-reduced-motion:reduce){.lantern{animation:none}}`;
    document.head.appendChild(style);
    const svg = (word) => `<svg viewBox="0 0 60 130"><line x1="30" y1="0" x2="30" y2="26" stroke="#b7724f" stroke-width="2"/>
      <rect x="20" y="24" width="20" height="8" rx="2" fill="#e0a95f"/>
      <ellipse cx="30" cy="62" rx="28" ry="32" fill="#d9534f"/><ellipse cx="30" cy="62" rx="14" ry="32" fill="none" stroke="#f1a08f" stroke-width="1.5" opacity=".7"/>
      <ellipse cx="30" cy="62" rx="24" ry="32" fill="none" stroke="#f1a08f" stroke-width="1" opacity=".4"/>
      <text x="30" y="70" text-anchor="middle" font-size="20" fill="#f6dfa4" font-family="serif">${word}</text>
      <rect x="20" y="92" width="20" height="8" rx="2" fill="#e0a95f"/>
      <path d="M24 100 v22 M28 100 v26 M32 100 v26 M36 100 v22" stroke="#e0a95f" stroke-width="1.6"/></svg>`;
    const hero = document.querySelector(".hero");
    if (hero) {
      ["l", "r"].forEach((side, i) => {
        const d = document.createElement("div");
        d.className = "lantern " + side; d.setAttribute("aria-hidden", "true");
        d.innerHTML = svg(i ? "春" : "福");
        hero.appendChild(d);
      });
    }
  }
})();
