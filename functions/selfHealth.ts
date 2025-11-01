// functions/selfHealth.ts
//
// 端點：GET /api/self/health
// 回應 JSON：{ ok: boolean, chainId: string, blockNumber?: string, ts: string, network?: string }

import { onRequest } from 'firebase-functions/v2/https';

const REGION = 'us-central1';
const TIMEOUT_SECONDS = 10;

// CORS
const allowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
const setCors = (res: any, origin?: string) => {
  const ok = origin && allowedOrigins().includes(origin);
  if (ok) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  return Boolean(ok);
};

export const selfHealth = onRequest({ region: REGION, timeoutSeconds: TIMEOUT_SECONDS }, async (req, res) => {
  setCors(res, req.headers?.origin);

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' }); return; }

  const endpoint = process.env.CELO_RPC_ENDPOINT || process.env.CELO_RPC_URL;
  const network = process.env.NETWORK_NAME || process.env.SELF_ENV || 'local';
  const chainId = network.includes('sepolia') ? '44787' : network.includes('mainnet') ? '42220' : 'celo';

  if (!endpoint) {
    res.status(200).json({
      ok: false,
      chainId,
      ts: new Date().toISOString(),
      network,
      error: 'MISSING_CELO_RPC_ENDPOINT',
    });
    return;
  }

  try {
    const rpcRequest = { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] };
    const httpResp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rpcRequest),
    });

    if (!httpResp.ok) throw new Error('HTTP_' + httpResp.status);
    const body = await httpResp.json();
    if (body.result === undefined) throw new Error('RPC_ERROR_' + JSON.stringify(body.error || body));

    res.status(200).json({
      ok: true,
      chainId,
      blockNumber: body.result,
      ts: new Date().toISOString(),
      network,
    });
  } catch (e: any) {
    res.status(200).json({
      ok: false,
      chainId,
      ts: new Date().toISOString(),
      network,
      error: String(e?.message || e),
    });
  }
});

