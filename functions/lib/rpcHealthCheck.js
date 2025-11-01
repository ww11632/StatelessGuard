"use strict";
// functions/rpcHealthCheck.ts
//
// 這個模組提供一個 HTTP 端點，用來檢查區塊鏈節點是否正常工作。
// 它會向設定的 RPC 端點發出簡單的 `eth_blockNumber` 呼叫，解析回傳
// 的區塊高度，並回應 JSON 給前端。若環境變數沒有設定 RPC 端
// 點，或是 RPC 回傳錯誤，會回傳錯誤訊息。
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpcHealthCheck = void 0;
// functions/rpcHealthCheck.ts
const https_1 = require("firebase-functions/v2/https");
// 以逗號清單建立簡單白名單
function allowedOrigins() {
    return (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}
function allowCors(res, origin) {
    const list = allowedOrigins();
    if (origin && list.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
}
exports.rpcHealthCheck = (0, https_1.onRequest)({ region: 'us-central1', timeoutSeconds: 10 }, async (req, res) => {
    allowCors(res, req.headers?.origin);
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    const endpoint = process.env.CELO_RPC_ENDPOINT || process.env.CELO_RPC_URL; // 舊名保底
    if (!endpoint) {
        res.status(500).json({ ok: false, message: '缺少 CELO_RPC_ENDPOINT 設定' });
        return;
    }
    try {
        const rpcRequest = { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] };
        const httpResp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rpcRequest),
        });
        if (!httpResp.ok)
            throw new Error('HTTP_' + httpResp.status);
        const body = await httpResp.json();
        if (body.result === undefined)
            throw new Error('RPC_ERROR_' + JSON.stringify(body.error || body));
        res.status(200).json({
            ok: true,
            endpoint,
            blockNumberHex: body.result,
            network: process.env.NETWORK_NAME || process.env.SELF_ENV || 'local',
        });
    }
    catch (e) {
        res.status(502).json({ ok: false, message: String(e?.message || e) });
    }
});
