"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selfVerify = void 0;
// functions/self-verify.ts
const https_1 = require("firebase-functions/v2/https");
/** 把 promise 包成「有結果就回、有錯就給簡訊息」的小幫手 */
async function tryGet(work) {
    try {
        return { ok: true, value: await work() };
    }
    catch (e) {
        return { ok: false, error: String(e?.message || e) };
    }
}
exports.selfVerify = (0, https_1.onRequest)({ region: "asia-east1", timeoutSeconds: 10 }, async (req, res) => {
    const rpc = process.env.CELO_RPC_URL;
    if (!rpc)
        return res.status(500).json({ ok: false, error: "MISSING_CELO_RPC_URL" });
    // 直接丟原生 JSON-RPC（避免外部套件爭議）
    const payload = { jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] };
    const out = await tryGet(async () => {
        const r = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        if (!r.ok)
            throw new Error(`HTTP_${r.status}`);
        const j = await r.json();
        if (!j.result)
            throw new Error(`RPC_ERROR:${JSON.stringify(j.error || j)}`);
        return parseInt(j.result, 16);
    });
    if (!out.ok)
        return res.status(502).json({ ok: false, error: out.error });
    res.json({
        ok: true,
        network: process.env.SELF_CONTRACTS_NETWORK || "unknown",
        block: out.value
    });
});
