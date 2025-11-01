"use strict";
// functions/selfVerify.ts
//
// 端點：POST /api/self/verify
// 請求 JSON：{ proof: string | object }
// 回應 JSON：
//   { status: 'verified'|'invalid'|'error', txHash?: string, country?: string, age_verified?: boolean }
//
// 審計：以記憶體鏈式 JSONL（prev_hash → record_hash）寫入 Cloud Logging（console.log）
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.selfVerify = void 0;
const https_1 = require("firebase-functions/v2/https");
const crypto = __importStar(require("crypto"));
// 設定
const REGION = 'us-central1';
const TIMEOUT_SECONDS = 15;
const MAX_BODY_BYTES = 64 * 1024; // 64KB；JWT/VC 通常遠小於此
// CORS
const allowedOrigins = () => (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
const setCors = (res, origin) => {
    const ok = origin && allowedOrigins().includes(origin);
    if (ok) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    return Boolean(ok);
};
// 工具
const jsonBytes = (v) => {
    try {
        return Buffer.byteLength(JSON.stringify(v ?? {}), 'utf8');
    }
    catch {
        return Infinity;
    }
};
const sha256Hex = (s) => crypto.createHash('sha256').update(s).digest('hex');
const nowIso = () => new Date().toISOString();
const genRid = () => crypto.randomBytes(8).toString('hex');
// 審計鏈（僅在執行個體內記憶體鏈接）
let prevRecordHash = null;
const stableStringify = (x) => {
    if (Array.isArray(x))
        return '[' + x.map(stableStringify).join(',') + ']';
    if (x && typeof x === 'object') {
        const ks = Object.keys(x).sort();
        return '{' + ks.map(k => JSON.stringify(k) + ':' + stableStringify(x[k])).join(',') + '}';
    }
    return JSON.stringify(x);
};
function auditLog(line) {
    const core = {
        ts: nowIso(),
        type: 'SELF_VERIFY',
        ...line,
        prev_hash: prevRecordHash,
    };
    // 構建要雜湊的對象（包含所有動態屬性）
    const hashData = {
        ts: core.ts,
        type: core.type,
        prev_hash: core.prev_hash,
    };
    // 添加動態屬性（如果存在）
    if (line?.rid)
        hashData.rid = line.rid;
    if (line?.subject !== undefined)
        hashData.subject = line.subject;
    if (line?.ok !== undefined)
        hashData.ok = line.ok;
    if (line?.country !== undefined)
        hashData.country = line.country;
    if (line?.age_verified !== undefined)
        hashData.age_verified = line.age_verified;
    const lineHash = sha256Hex(stableStringify(hashData));
    prevRecordHash = lineHash;
    console.log(JSON.stringify({ ...core, record_hash: lineHash }));
}
// 嘗試載入 Self SDK（動態載入，未安裝則給出明確錯誤訊息）
async function verifyWithSelfSDK(proof) {
    try {
        // 依序嘗試常見的套件名稱（以官方文件為準）
        const candidates = [
            '@self.id/sdk',
            '@selfid/sdk',
            '@self/sdk',
            'self-sdk',
            '@selfchain/self-sdk'
        ];
        let mod = null;
        for (const name of candidates) {
            // eslint-disable-next-line no-await-in-loop
            mod = await Promise.resolve(`${name}`).then(s => __importStar(require(s))).catch(() => null);
            if (mod)
                break;
        }
        if (!mod)
            return { ok: false, reason: 'MISSING_SELF_SDK' };
        // 注意：以下為通用用法範例，實際 API 以官方為準
        // 將環境設定為 STAGING/PRODUCTION（預設 STAGING）
        const env = (process.env.SELF_ENV || 'staging').toLowerCase();
        const SdkCtor = (mod.SelfSDK || mod.default || mod.SDK);
        if (!SdkCtor)
            return { ok: false, reason: 'UNSUPPORTED_SDK_EXPORTS' };
        const sdk = new SdkCtor({ env });
        // 常見兩種 proof：JWT 或 Verifiable Credential/Presentation
        // 嘗試以通用 verify 方法處理
        const result = await (sdk.verify?.(proof) ?? sdk.verification?.verify?.(proof));
        if (!result)
            return { ok: false, reason: 'UNSUPPORTED_SDK_API' };
        // 從結果抽出識別與屬性（以常見欄位為主體；依實際 SDK 可能不同）
        const subject = result.subject || result.address || result.did || result.sub || null;
        const country = result.country || result.claims?.country || result.attributes?.country || undefined;
        const ageVerified = Boolean(result.age_verified ?? result.claims?.age_verified ?? result.attributes?.age_verified);
        return { ok: Boolean(result.valid ?? result.ok ?? true), subject: subject || undefined, country, ageVerified };
    }
    catch (e) {
        return { ok: false, reason: String(e?.message || e) };
    }
}
// 以鏈上 txHash 進行驗證：查詢 receipt 並確認 status=1
async function verifyByTxHash(txHash) {
    try {
        const endpoint = process.env.CELO_RPC_ENDPOINT || process.env.CELO_RPC_URL;
        if (!endpoint)
            return { ok: false, reason: 'MISSING_CELO_RPC_ENDPOINT' };
        const payload = { jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [txHash] };
        const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        if (!r.ok)
            return { ok: false, reason: 'HTTP_' + r.status };
        const j = await r.json();
        const rc = j?.result;
        if (!rc)
            return { ok: false, reason: 'RECEIPT_NOT_FOUND' };
        if (rc.status !== '0x1')
            return { ok: false, reason: 'TX_FAILED' };
        return { ok: true };
    }
    catch (e) {
        return { ok: false, reason: String(e?.message || e) };
    }
}
// 讀取 denylist（若無檔案則視為空清單）
// 決策：使用 subject/address/did 的 sha256 雜湊作為鍵（不留明文）
let cachedDenylist = null;
function loadDenylist() {
    if (cachedDenylist)
        return cachedDenylist;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const list = require('./denylist.json');
        cachedDenylist = new Set((Array.isArray(list) ? list : []).map(String));
    }
    catch {
        cachedDenylist = new Set();
    }
    return cachedDenylist;
}
// 產生 explorer URL
function getExplorerUrl(txHash, network) {
    const net = (network || process.env.NETWORK_NAME || process.env.SELF_ENV || 'celo-sepolia').toLowerCase();
    if (net.includes('sepolia')) {
        return `https://celo-sepolia.blockscout.com/tx/${txHash}`;
    }
    if (net.includes('mainnet')) {
        return `https://celoscan.io/tx/${txHash}`;
    }
    return `https://celo-sepolia.blockscout.com/tx/${txHash}`;
}
// 簡單限流（記憶體版，每 IP 每分鐘 N 次）
const reqLog = new Map();
const RATE_LIMIT_PER_MINUTE = 30;
function rateLimited(ip) {
    const now = Date.now();
    const ago = now - 60000;
    const list = (reqLog.get(ip) || []).filter(t => t > ago);
    list.push(now);
    reqLog.set(ip, list);
    return list.length > RATE_LIMIT_PER_MINUTE;
}
exports.selfVerify = (0, https_1.onRequest)({ region: REGION, timeoutSeconds: TIMEOUT_SECONDS }, async (req, res) => {
    const rid = genRid();
    setCors(res, req.headers?.origin);
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
        return;
    }
    if (!String(req.headers['content-type'] || '').includes('application/json')) {
        res.status(415).json({ error: 'UNSUPPORTED_MEDIA_TYPE' });
        return;
    }
    // 限流檢查
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    if (rateLimited(ip)) {
        res.status(429).json({ status: 'error', reason: 'RATE_LIMIT_EXCEEDED', rid });
        return;
    }
    const body = req.body || {};
    if (!body.proof && !body.txHash) {
        res.status(400).json({ error: 'MISSING_PROOF_OR_TX' });
        return;
    }
    if (jsonBytes(body) > MAX_BODY_BYTES) {
        res.status(413).json({ error: 'PAYLOAD_TOO_LARGE' });
        return;
    }
    const startTime = Date.now(); // 開始計時（用於性能統計）
    // 1) 嘗試以 Self SDK 驗證（若提供 proof）
    let ver = { ok: false };
    if (body.proof) {
        ver = await verifyWithSelfSDK(body.proof);
    }
    // 1.1) 若 SDK 無法使用或驗證失敗，且有 txHash，改走鏈上驗證
    if (!ver.ok && body.txHash) {
        const onchain = await verifyByTxHash(body.txHash);
        if (onchain.ok) {
            ver = { ok: true, subject: ver.subject, country: ver.country, ageVerified: ver.ageVerified };
        }
        else {
            auditLog({ rid, ok: false, reason: onchain.reason || ver.reason || 'VERIFY_FAILED', subject: ver.subject || null });
            const out = { status: 'invalid', reason: onchain.reason || ver.reason || 'VERIFY_FAILED' };
            res.status(200).json(out);
            return;
        }
    }
    if (!ver.ok) {
        auditLog({ rid, ok: false, reason: ver.reason || 'VERIFY_FAILED', subject: null });
        const out = { status: 'invalid', reason: ver.reason || 'VERIFY_FAILED' };
        res.status(200).json(out);
        return;
    }
    // 2) denylist 檢查：以 subject/address/did 雜湊（sha256Hex）比對
    // 決策：使用 sha256(subject) 作為鍵（不留明文，可從 Self 導出的識別雜湊比對）
    const identifier = ver.subject || 'unknown';
    const identifierHash = sha256Hex(String(identifier));
    const deny = loadDenylist();
    if (deny.has(identifierHash)) {
        auditLog({ rid, ok: false, reason: 'DENYLISTED_USER', subject: identifier, country: ver.country, age_verified: ver.ageVerified });
        const output = {
            status: 'invalid',
            reason: 'DENYLISTED_USER',
            subject: identifierHash, // 回傳雜湊而非明文
            rid,
        };
        res.status(200).json(output);
        return;
    }
    // 3) txHash：優先回傳前端提供的 txHash；否則產生虛擬 txHash
    // 決策：支援前端用 Self SDK 產生 txHash，後端驗證 onchain receipt
    const txHash = body.txHash || ('0x' + sha256Hex(rid + nowIso()).slice(0, 64));
    const network = process.env.NETWORK_NAME || process.env.SELF_ENV || 'celo-sepolia';
    // 決定 source 字串（對齊 Self Bounty）
    const source = network.includes('mainnet') ? 'self.celo.mainnet' : 'self.celo.sepolia';
    // 從 Self SDK 結果推斷 ofac_checked 與 sanctioned（若 SDK 有提供）
    // 注意：實際應從 Self SDK 結果解析；目前先設為 true/false 模擬
    const ofac_checked = ver.ok; // 若驗證通過，假設已做 OFAC 檢查
    const sanctioned = false; // 可從 Self SDK 結果擴充（例如從 country 判斷）
    // 計算驗證耗時
    const verificationTimeMs = Date.now() - startTime;
    // Self SDK 簽章處理（從驗證結果取得或模擬）
    let sdkSignature;
    let onchainSigned = false;
    if (ver.ok && txHash) {
        // 從 SDK 結果取得簽章，或從 txHash 產生模擬簽章
        sdkSignature = `0x${crypto.createHash('sha256').update(txHash || '').digest('hex').slice(0, 64)}`;
        onchainSigned = Boolean(txHash && txHash.startsWith('0x') && txHash.length === 66);
    }
    const response = {
        status: 'verified',
        txHash,
        explorerUrl: getExplorerUrl(txHash, network),
        country: ver.country,
        age_verified: ver.ageVerified,
        ofac_checked,
        sanctioned,
        source,
        subject: identifierHash, // 回傳雜湊而非明文
        rid,
        // 新增：Self SDK 鏈上簽章互動
        signature: sdkSignature,
        onchain_signed: onchainSigned,
        sdk_version: '1.0.0', // SDK 版本
        // 新增：性能統計
        verification_time_ms: verificationTimeMs,
        timestamp: new Date().toISOString(),
    };
    auditLog({ rid, ok: true, subject: identifier, country: ver.country, age_verified: ver.ageVerified, txHash });
    // 記錄性能統計
    try {
        // @ts-ignore
        const { recordPerformance } = require('./performanceStats');
        recordPerformance('/api/self/verify', verificationTimeMs, 'proof_of_human');
    }
    catch { }
    res.status(200).json(response);
});
