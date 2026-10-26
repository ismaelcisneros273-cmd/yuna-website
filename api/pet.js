// 摸摸小狗：GET 读次数，POST 摸一下
const { pipe, allow, handler } = require("./_redis");

module.exports = handler(async (req, res) => {
  if (req.method === "POST") {
    if (!(await allow(req, "pet", 1))) {
      const [n] = await pipe([["GET", "pets"]]);
      return res.json({ count: Number(n) || 0, throttled: true });
    }
    const [n] = await pipe([["INCR", "pets"]]);
    return res.json({ count: n });
  }
  const [n] = await pipe([["GET", "pets"]]);
  res.json({ count: Number(n) || 0 });
});
