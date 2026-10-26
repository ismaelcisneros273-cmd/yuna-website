// 电影角的 ♡：GET 读所有电影的喜欢数，POST {film} 给一部电影点喜欢
const { pipe, allow, handler } = require("./_redis");

const FILMS = ["robot-dreams", "la-la-land", "about-time", "soul"]; // 新增电影时在这里加上对应的 id

module.exports = handler(async (req, res) => {
  if (req.method === "POST") {
    const film = String((req.body || {}).film || "");
    if (!FILMS.includes(film)) return res.status(400).json({ error: "bad_film" });
    if (await allow(req, "like:" + film, 60 * 60 * 24)) {
      await pipe([["HINCRBY", "likes", film, "1"]]);
    }
  }
  const [flat] = await pipe([["HGETALL", "likes"]]);
  const likes = {};
  for (let i = 0; i < (flat || []).length; i += 2) likes[flat[i]] = Number(flat[i + 1]);
  res.json({ likes });
});
