/* ===== 背景音乐 + 唱片机 =====
   歌单在下面的 TRACKS 里改。每首歌放的是苹果音乐官方提供的 30 秒试听片段，
   appleId 是这首歌在苹果音乐里的编号（想换歌的话告诉 Claude 歌名就行）。
   如果以后有自己的音频文件，也可以写 src: "music/xxx.mp3"，会优先用 src。
   试听片段一时加载不到时：唱片照样会转，只是没声音，左下角的音乐按钮也会先藏起来。
*/
const PLAYLIST = "Yuna 的歌单";
const TRACKS = [
  { title: "Dilemma", artist: "Nelly, Kelly Rowland", appleId: 1440735612 },
  { title: "Luv(sic.) pt3", artist: "Nujabes, Shing02", appleId: 1078914488 },
  { title: "BB88", artist: "方大同", appleId: 577983302 },
  { title: "Almost", artist: "Tamia", appleId: 599214101 },
  { title: "September", artist: "Earth, Wind & Fire", appleId: 1456623340 },
];

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const player = $("#player"), np = $("#np"), list = $("#tracks"), btn = $("#music"), txt = $("#musicTxt");
  const label = $("#playlistName"), full = $("#fullLink");
  if (label) label.textContent = PLAYLIST;

  const audio = new Audio();
  audio.preload = "none"; audio.volume = 0.55;
  let cur = 0, playing = false;
  const ready = TRACKS.map(() => false);   // 哪些歌的文件已经放进来了
  const buttons = [];

  TRACKS.forEach((t, i) => {
    const li = document.createElement("li"), b = document.createElement("button");
    b.type = "button";
    const n = document.createElement("span"); n.className = "n"; n.textContent = String(i + 1);
    const ti = document.createElement("span"); ti.textContent = t.title;
    const ar = document.createElement("span"); ar.className = "ar"; ar.textContent = t.artist;
    b.append(n, ti, ar); li.appendChild(b); list && list.appendChild(li); buttons.push(b);
    b.addEventListener("click", () => (i === cur && playing ? pause() : play(i)));
  });

  const anyReady = () => ready.some(Boolean);
  const nextReady = (from) => {
    for (let k = 1; k <= TRACKS.length; k++) { const j = (from + k) % TRACKS.length; if (ready[j]) return j; }
    return from;
  };

  const ui = () => {
    const t = TRACKS[cur];
    player && player.classList.toggle("playing", playing);
    buttons.forEach((b, i) => { b.classList.toggle("cur", playing && i === cur); b.classList.toggle("missing", !ready[i]); });
    if (np) np.textContent = playing
      ? `${t.title} — ${t.artist}${ready[cur] ? "" : "（音频还在路上，先看唱片转）"}`
      : "点一首歌，唱片就转起来";
    btn.classList.toggle("on", playing && ready[cur]);
    if (full) {
      full.hidden = !t.view;
      if (t.view) { full.href = t.view; full.textContent = `这是 30 秒试听，完整版《${t.title}》去 Apple Music 听`; }
    }
    txt.textContent = playing && ready[cur] ? `${t.title}，点我暂停` : "音乐停了，点我继续";
  };

  function play(i) {
    audio.pause();
    cur = i; playing = true;
    if (ready[i]) {
      audio.src = TRACKS[i].src;
      audio.play().catch(() => { playing = false; ui(); });
      store.set("music", "on");
    }
    ui();
  }
  function pause() { audio.pause(); playing = false; store.set("music", "off"); ui(); }
  audio.addEventListener("ended", () => play(nextReady(cur)));
  audio.addEventListener("error", () => { ready[cur] = false; if (playing) { playing = false; ui(); } refreshButton(); });
  btn.addEventListener("click", () => (playing && ready[cur] ? pause() : play(ready[cur] ? cur : nextReady(cur))));

  // 先看看哪些歌的文件已经在了；一首都没有就把左下角按钮藏起来
  const refreshButton = () => { btn.hidden = !anyReady(); };
  btn.hidden = true;
  // 先向苹果音乐要试听片段的地址；有自己的 src 文件就先看文件在不在
  const ids = TRACKS.filter((t) => t.appleId).map((t) => t.appleId).join(",");
  const lookup = ids
    ? fetch("https://itunes.apple.com/lookup?country=US&id=" + ids).then((r) => r.json()).catch(() => ({ results: [] }))
    : Promise.resolve({ results: [] });
  lookup.then((d) => {
    const byId = {};
    (d.results || []).forEach((x) => { byId[x.trackId] = x; });
    return Promise.all(TRACKS.map((t, i) => {
      const a = byId[t.appleId];
      if (a) { t.view = a.trackViewUrl; if (!t.src && a.previewUrl) { t.src = a.previewUrl; ready[i] = true; } }
      if (t.src && !ready[i]) {
        return fetch(t.src, { method: "HEAD" }).then((r) => { ready[i] = r.ok; }).catch(() => {});
      }
    }));
  }).then(() => {
    refreshButton(); ui();
    if (!anyReady()) return;
    if (!ready[cur]) cur = nextReady(cur);
    // 浏览器不允许一打开就出声：访客第一次点页面时开始播放（之前关掉过的就不自动放）
    const off = store.get("music") === "off";
    txt.textContent = off ? "音乐关着，点我打开" : "点一下页面就会放音乐";
    if (off) return;
    const first = (e) => {
      window.removeEventListener("pointerdown", first, true);
      window.removeEventListener("keydown", first, true);
      if (e.target.closest && e.target.closest("#music, #tracks")) return;
      if (!playing) play(cur);
    };
    window.addEventListener("pointerdown", first, true);
    window.addEventListener("keydown", first, true);
  });
})();
