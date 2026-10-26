// 访客编号：POST 领一个「第 N 位来串门的朋友」编号；GET 读总人数
const { pipe, allow, handler } = require("./_redis");

module.exports = handler(async (req, res) => {
  if (req.method === "POST") {
    if (await allow(req, "visit", 60 * 60 * 12)) {
      const [n] = await pipe([["INCR", "visits"]]);
      return res.json({ n, total: n });
    }
    const [t] = await pipe([["GET", "visits"]]);
    return res.json({ n: Number(t) || 1, total: Number(t) || 1 });
  }
  const [t] = await pipe([["GET", "visits"]]);
  res.json({ total: Number(t) || 0 });
});
