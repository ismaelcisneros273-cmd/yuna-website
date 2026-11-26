// 引力观测站 · 合盘邀请的中转站
// 邀请人的链接里带一个「房间号」；被邀请的人测完后 POST 自己的结果到这个房间，
// 邀请人下次打开网站时 GET 这个房间，就能直接看到和对方的合盘。
// 只存天体、两个分数和（选填的）生日，一年后自动过期。
const { pipe, allow, handler } = require("./_redis");

const ORIGINS = ["https://xingti.yunachen.cn", "https://xingti.vercel.app"];
const IDS = ["moon", "rogue", "comet", "binary", "earth", "lag", "saturn", "pulsar"];
const CODE = /^[A-HJ-NP-Z2-9]{8}$/;
const KEEP = String(60 * 60 * 24 * 365);
const MAX_PER_ROOM = 50;

const num = (x) => {
  const n = Math.round(Number(x));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
};

module.exports = handler(async (req, res) => {
  const origin = req.headers.origin;
  if (ORIGINS.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const room = String((req.method === "POST" ? body.room : req.query.room) || "").toUpperCase();
  if (!CODE.test(room)) return res.status(400).json({ error: "bad_room" });
  const key = `xtroom:${room}`;

  if (req.method === "POST") {
    const who = String(body.who || "").toUpperCase();
    const id = String(body.id || "");
    const a = num(body.a), v = num(body.v);
    const bd = /^\d{8}$/.test(String(body.bd || "")) ? String(body.bd) : "";
    if (!CODE.test(who) || !IDS.includes(id) || a === null || v === null) return res.status(400).json({ error: "bad_request" });
    if (!(await allow(req, "xtroom", 2))) return res.status(429).json({ error: "slow_down" });
    const [len, has] = await pipe([["HLEN", key], ["HEXISTS", key, who]]);
    if (Number(len) >= MAX_PER_ROOM && !Number(has)) return res.status(409).json({ error: "room_full" });
    await pipe([
      ["HSET", key, who, JSON.stringify({ id, a, v, bd, t: Date.now() })],
      ["EXPIRE", key, KEEP],
    ]);
    return res.json({ ok: true });
  }

  const [flat] = await pipe([["HGETALL", key]]);
  const list = [];
  for (let i = 0; i < (flat || []).length; i += 2) {
    try { list.push({ who: flat[i], ...JSON.parse(flat[i + 1]) }); } catch (e) {}
  }
  res.json({ list });
});
