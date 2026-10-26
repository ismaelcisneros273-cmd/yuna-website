// 一起画像素画：GET 读整张画，POST {i, c} 涂一格（每人 20 秒一格），DELETE 清空画布（需要管理密码）
const { pipe, allow, handler, isAdmin } = require("./_redis");

const SIZE = 24;        // 24 x 24 的画布
const COLORS = 10;      // 调色盘颜色数，和前端保持一致
const COOLDOWN = 20;    // 秒

module.exports = handler(async (req, res) => {
  if (req.method === "DELETE") {
    if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });
    await pipe([["DEL", "pixels"], ["DEL", "pixels:count"]]);
    return res.json({ ok: true });
  }
  if (req.method === "POST") {
    const i = Number((req.body || {}).i);
    const c = Number((req.body || {}).c);
    if (!Number.isInteger(i) || i < 0 || i >= SIZE * SIZE || !Number.isInteger(c) || c < 0 || c >= COLORS) {
      return res.status(400).json({ error: "bad_pixel" });
    }
    if (!(await allow(req, "pixel", COOLDOWN))) {
      return res.status(429).json({ error: "cooldown", wait: COOLDOWN });
    }
    await pipe([["HSET", "pixels", String(i), String(c)], ["INCR", "pixels:count"]]);
  }
  const [flat, count] = await pipe([["HGETALL", "pixels"], ["GET", "pixels:count"]]);
  const grid = {};
  for (let k = 0; k < (flat || []).length; k += 2) grid[flat[k]] = Number(flat[k + 1]);
  res.json({ size: SIZE, grid, count: Number(count) || 0, cooldown: COOLDOWN });
});
