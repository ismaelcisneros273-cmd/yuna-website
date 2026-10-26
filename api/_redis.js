// 共用的小工具：连接 Upstash Redis（在 Vercel 的 Storage 里添加后会自动注入环境变量）
const crypto = require("crypto");

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const ready = () => Boolean(URL_ && TOKEN);

async function pipe(cmds) {
  const r = await fetch(URL_.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).map((x) => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}

// 访客 IP 只做成短哈希用来限流，不保存原始 IP
function who(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "anon").split(",")[0].trim();
  return crypto.createHash("sha256").update("yuna:" + ip).digest("hex").slice(0, 16);
}

// 限流：同一个人在 sec 秒内只能做一次 action
async function allow(req, action, sec) {
  const [ok] = await pipe([["SET", `rl:${action}:${who(req)}`, "1", "NX", "EX", String(sec)]]);
  return ok === "OK";
}

// 管理员：请求头 x-admin-key 要和 Vercel 环境变量 ADMIN_KEY 一致
function isAdmin(req) {
  const key = process.env.ADMIN_KEY;
  const given = req.headers["x-admin-key"];
  if (!key || !given || String(given).length !== key.length) return false;
  return crypto.timingSafeEqual(Buffer.from(String(given)), Buffer.from(key));
}

function handler(fn) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!ready()) return res.status(503).json({ error: "not_configured" });
    try {
      await fn(req, res);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "server_error" });
    }
  };
}

module.exports = { pipe, allow, who, handler, isAdmin };
