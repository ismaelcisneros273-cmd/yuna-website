// 便利贴留言墙
// GET            读最近的留言
// POST {name, text, color}  贴一张便利贴（每人 60 秒一张）
// DELETE ?id=xxx&key=你的管理密码   删除一张（管理密码在 Vercel 环境变量 ADMIN_KEY 里设置）
const crypto = require("crypto");
const { pipe, allow, handler } = require("./_redis");

const KEEP = 300;   // 最多保存多少张
const SHOW = 80;    // 页面上显示多少张

const clean = (s, max) =>
  String(s || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

module.exports = handler(async (req, res) => {
  if (req.method === "DELETE") {
    const key = process.env.ADMIN_KEY;
    if (!key || req.query.key !== key) return res.status(403).json({ error: "forbidden" });
    const [all] = await pipe([["LRANGE", "notes", "0", "-1"]]);
    const hit = (all || []).find((s) => {
      try { return JSON.parse(s).id === req.query.id; } catch { return false; }
    });
    if (hit) await pipe([["LREM", "notes", "1", hit]]);
    return res.json({ ok: Boolean(hit) });
  }

  if (req.method === "POST") {
    const b = req.body || {};
    const text = clean(b.text, 120);
    const name = clean(b.name, 12) || "路过的朋友";
    const color = Math.max(0, Math.min(4, Number(b.color) || 0));
    if (text.length < 1) return res.status(400).json({ error: "empty" });
    if (/https?:\/\/|www\.|\.com\b/i.test(text + name)) return res.status(400).json({ error: "no_links" });
    if (!(await allow(req, "note", 60))) return res.status(429).json({ error: "cooldown", wait: 60 });
    const note = {
      id: crypto.randomBytes(6).toString("hex"),
      name, text, color,
      rot: Math.round((Math.random() * 6 - 3) * 10) / 10,
      t: Date.now(),
    };
    await pipe([["LPUSH", "notes", JSON.stringify(note)], ["LTRIM", "notes", "0", String(KEEP - 1)]]);
  }

  const [list] = await pipe([["LRANGE", "notes", "0", String(SHOW - 1)]]);
  const notes = (list || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
  res.json({ notes });
});
