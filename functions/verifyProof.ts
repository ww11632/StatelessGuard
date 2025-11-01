// functions/verifyProof.ts
// 功能 X：教練模式診斷強化 + 相容既有輸出（不落地 PII）
//
// 介面：POST /api/verifyProof
// 請求 JSON：{ proofData: {...}, requirements: string[] }
// 回應 JSON：{
//   ok: boolean,
//   results: { rule: string, pass: boolean, reason?: string }[],
//   proofHash: string,        // 舊欄位相容（= stableKey 前 16 碼）
//   stableKey: string,        // 完整去重鍵（64 hex）
//   rid: string,              // 本次請求 ID（8-byte hex）
//   meta: {
//     network: string,
//     limits: { perMinute: number, maxBodyBytes: number },
//     receivedAt: string,
//     elapsedMs: number,
//     diag: { originMatched: boolean, bodyBytes: number }
//   }
// }
// 備註：新增 HTTP 標頭 X-Request-Id / X-Proof-Slice 協助前端對照。

import { onRequest } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';

// 參數集中
const REGION = 'us-central1';
const TIMEOUT_SECONDS = 10;
const MAX_BODY_BYTES = 10 * 1024;
const RATE_LIMIT_PER_MINUTE = 30;
const STABLEKEY_SLICE = 16;
const KNOWN_RULES = new Set(['age>=18']);

// 工具
const stableStringify = (x: any): string => {
  if (Array.isArray(x)) return '[' + x.map(stableStringify).join(',') + ']';
  if (x && typeof x === 'object') {
    const ks = Object.keys(x).sort();
    return '{' + ks.map(k => JSON.stringify(k) + ':' + stableStringify(x[k])).join(',') + '}';
  }
  return JSON.stringify(x);
};
const sha256Hex = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const nowIso = () => new Date().toISOString();
const genRid = () => crypto.randomBytes(8).toString('hex');
const jsonBytes = (v: unknown) => {
  try { return Buffer.byteLength(JSON.stringify(v ?? {}), 'utf8'); } catch { return Infinity; }
};
const allowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const setCors = (res: any, origin?: string) => {
  const ok = origin && allowedOrigins().includes(origin);
  if (ok) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Idempotency-Key');
  }
  return Boolean(ok);
};

// 每 IP / 分鐘 節流（單機記憶體版）
const reqLog = new Map<string, number[]>();
const rateLimited = (ip: string) => {
  const now = Date.now(), ago = now - 60_000;
  const list = (reqLog.get(ip) || []).filter(t => t > ago);
  list.push(now); reqLog.set(ip, list);
  return list.length > RATE_LIMIT_PER_MINUTE;
};

// 規則檢查
type RuleResult = { rule: string; pass: boolean; reason?: string };
const evalRules = (data: any, reqs: string[]): RuleResult[] => {
  const out: RuleResult[] = [];
  for (const r of reqs) {
    if (!KNOWN_RULES.has(r)) { out.push({ rule: r, pass: false, reason: '未知規則' }); continue; }
    if (r === 'age>=18') {
      const age = Number((data && data.age) ?? NaN);
      const pass = Number.isFinite(age) && age >= 18;
      out.push({ rule: r, pass, reason: pass ? undefined : 'age 不足 18 或格式錯誤' });
    }
  }
  return out;
};

// 主要處理
export const verifyProof = onRequest({ region: REGION, timeoutSeconds: TIMEOUT_SECONDS }, async (req, res) => {
  const rid = genRid();
  const t0 = Date.now();
  const originMatched = setCors(res, req.headers?.origin);

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, message: '僅接受 POST', rid }); return; }

  const ctype = String(req.headers['content-type'] || '');
  if (!ctype.includes('application/json')) {
    res.status(415).json({ ok: false, message: '僅接受 application/json', rid }); return;
  }

  const body = req.body;
  const bodyBytes = jsonBytes(body);
  if (bodyBytes > MAX_BODY_BYTES) {
    res.status(413).json({ ok:false, message:`payload 過大（${bodyBytes} > ${MAX_BODY_BYTES} bytes）`, rid }); return;
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  if (rateLimited(ip)) { res.status(429).json({ ok:false, message:'太多請求，請稍後再試', rid }); return; }

  const proofData = body?.proofData;
  const requirements = body?.requirements;
  if (!proofData || !Array.isArray(requirements)) {
    res.status(400).json({ ok:false, message:'缺少 proofData 或 requirements', rid }); return;
  }

  const canonical = stableStringify({ proofData, requirements });
  const stableKey = sha256Hex(canonical);
  const results = evalRules(proofData, requirements);
  const okAll = results.every(r => r.pass);

  // 額外提醒（不擋流程）
  const idem = String(req.headers['x-idempotency-key'] || '').trim();
  const warnings = idem && !stableKey.startsWith(idem) ? ['X-Idempotency-Key 與內容不一致：已忽略此標頭'] : undefined;

  // 診斷用 Response Headers（台上對照超好用）
  res.setHeader('X-Request-Id', rid);
  res.setHeader('X-Proof-Slice', stableKey.slice(0, STABLEKEY_SLICE));

  res.status(200).json({
    ok: okAll,
    results,
    proofHash: stableKey.slice(0, STABLEKEY_SLICE),
    stableKey,
    rid,
    meta: {
      network: process.env.NETWORK_NAME || process.env.SELF_ENV || 'local',
      limits: { perMinute: RATE_LIMIT_PER_MINUTE, maxBodyBytes: MAX_BODY_BYTES },
      receivedAt: nowIso(),
      elapsedMs: Date.now() - t0,
      diag: { originMatched, bodyBytes },
      warnings
    }
  });
});
