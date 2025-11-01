// functions/scenariosDemo.ts
//
// 端點：GET /api/scenarios/:scenario
// 功能：多場景 demo（RWA / DAO / Social / AI Agent）
// 展示：跨場景應用與 demo

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

// 多場景 demo 配置
const SCENARIOS: Record<string, any> = {
  rwa: {
    name: 'RWA 合規入口',
    description: '不動產代幣化合規驗證',
    steps: [
      'Self Proof 驗證（身份/國籍/年齡/OFAC）',
      '文件雜湊驗證（租約/抵押協議）',
      '撥款前核驗',
      'JSONL 審計日誌',
    ],
    endpoints: ['/api/self/verify-by-tx', '/api/self/verify'],
    demo_txHash: 'DEMO_SUCCESS_TW',
  },
  dao: {
    name: 'DAO 治理',
    description: '去中心化自治組織治理與投票',
    steps: [
      '身份驗證（Proof-of-Human / Proof-of-Agent）',
      '一鍵驗證與授權',
      '投票權限授予',
      '提案發起權限',
    ],
    endpoints: ['/api/dao/verify', '/api/dao/auth'],
    demo_txHash: 'DEMO_SUCCESS_TW',
  },
  social: {
    name: 'Social Network',
    description: '基於身份驗證的社交網絡',
    steps: [
      '身份驗證（國籍/年齡）',
      '社群准入檢查',
      '內容發布權限',
      '信任評分',
    ],
    endpoints: ['/api/self/verify', '/api/social/verify'],
    demo_txHash: 'DEMO_SUCCESS_TW',
  },
  agent: {
    name: 'AI Agent Ecosystem',
    description: 'AI Agent 信任與驗證生態',
    steps: [
      'Proof-of-Agent 驗證',
      'Sandbox 分數檢查',
      'Agent 信任鏈驗證',
      'AI Agent 白名單',
    ],
    endpoints: ['/api/agent/verify'],
    demo_agentAddress: '0x1234567890abcdef1234567890abcdef12345678',
  },
};

export const scenariosDemo = onRequest({ region: REGION, timeoutSeconds: TIMEOUT_SECONDS }, async (req, res) => {
  setCors(res, req.headers?.origin);

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); return; }

  // 從 URL path 取得 scenario（例如 /api/scenarios/rwa）
  const url = req.url || '';
  const match = url.match(/\/api\/scenarios\/([^/?]+)/);
  const scenario = match ? match[1] : null;

  if (!scenario || !SCENARIOS[scenario]) {
    // 返回所有場景列表
    res.status(200).json({
      scenarios: Object.keys(SCENARIOS),
      available_scenarios: SCENARIOS,
      note: '使用 /api/scenarios/:scenario 取得特定場景資訊',
    });
    return;
  }

  const scenarioData = SCENARIOS[scenario];
  res.status(200).json({
    scenario,
    ...scenarioData,
    timestamp: new Date().toISOString(),
    verifier: 'StatelessGuard',
  });
});




