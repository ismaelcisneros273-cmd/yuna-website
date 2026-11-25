// 测试付费自动解锁：测试页带着一个「解锁编号」跳到爱发电付款，
// 付完回来时问这里；这里去爱发电查最近的订单，留言里带着这个编号、金额对得上、状态是已支付，就放行。
// 需要在 Vercel 环境变量里放 AFDIAN_TOKEN（爱发电「开发者」页生成的 API Token）。
const crypto = require("crypto");
const { pipe, handler } = require("./_redis");

const AFDIAN_USER = "1d783448c94511f19e0f52540025c377";
const PRODUCTS = {
  fb: { plan: "2bc15332e8c011f185315254001e7c00", min: 1.9 }, // 哲学副本 · 进阶报告
  xt: { plan: "61cef380e8c011f1b4d752540025c377", min: 3.9 }, // 引力观测站 · 双人合盘
};
const ORIGINS = ["https://fuben.yunachen.cn", "https://xingti.yunachen.cn"];
const ID_RE = /[A-HJ-NP-Z2-9]{8}/;
const KEEP = String(60 * 60 * 24 * 365); // 记一年

async function recentOrders(token) {
  const params = JSON.stringify({ page: 1 });
  const ts = Math.floor(Date.now() / 1000);
  const sign = crypto.createHash("md5").update(`${token}params${params}ts${ts}user_id${AFDIAN_USER}`).digest("hex");
  const r = await fetch("https://afdian.com/api/open/query-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: AFDIAN_USER, params, ts, sign }),
  });
  const d = await r.json();
  if (d.ec !== 200) throw new Error("afdian " + d.ec + " " + d.em);
  return (d.data && d.data.list) || [];
}

module.exports = handler(async (req, res) => {
  const origin = req.headers.origin;
  if (ORIGINS.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.status(204).end();

  const p = String(req.query.p || "");
  const id = String(req.query.id || "").toUpperCase();
  if (!PRODUCTS[p] || id.length !== 8 || !ID_RE.test(id)) return res.status(400).json({ error: "bad_request" });

  const [hit] = await pipe([["GET", `paid:${p}:${id}`]]);
  if (hit) return res.json({ paid: true });

  const token = process.env.AFDIAN_TOKEN;
  if (!token) return res.json({ paid: false, error: "not_configured" });

  // 同一个编号 3 秒内只真去爱发电查一次
  const [go] = await pipe([["SET", `afdq:${id}`, "1", "NX", "EX", "3"]]);
  if (go !== "OK") return res.json({ paid: false });

  const list = await recentOrders(token);
  const writes = [];
  for (const o of list) {
    if (Number(o.status) !== 2) continue;
    const key = Object.keys(PRODUCTS).find((k) => PRODUCTS[k].plan === o.plan_id);
    if (!key || Number(o.total_amount) + 0.001 < PRODUCTS[key].min) continue;
    const ids = new Set();
    const c = String(o.custom_order_id || "").toUpperCase();
    if (c.length === 8 && ID_RE.test(c)) ids.add(c);
    const r = String(o.remark || "").toUpperCase().match(/编号\s*([A-HJ-NP-Z2-9]{8})/);
    if (r) ids.add(r[1]);
    for (const x of ids) writes.push(["SET", `paid:${key}:${x}`, o.out_trade_no || "1", "EX", KEEP]);
  }
  if (writes.length) await pipe(writes);
  res.json({ paid: writes.some((w) => w[1] === `paid:${p}:${id}`) });
});
