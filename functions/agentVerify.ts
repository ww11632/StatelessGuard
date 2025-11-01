// functions/agentVerify.ts
//
// 端點：POST /api/agent/verify
// 功能：AI Agent 場景的驗證（Proof-of-Agent 分支）
// 展示：多重應用場景（Composable）+ Proof-of-Agent

import { onRequest } from 'firebase-functions/v2/https';
import { evaluatePolicy } from './policyEngine';

const REGION = 'us-central1';
const TIMEOUT_SECONDS = 15;

// CORS
const allowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
const setCors = (res: any, origin?: string) => {
  // 開發環境：允許所有 origin（如果 ALLOWED_ORIGINS 未設置）
  const origins = allowedOrigins();
  const isDev = !process.env.ALLOWED_ORIGINS || origins.length === 0;
  const ok = isDev || (origin && origins.includes(origin));
  
  if (ok && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  return Boolean(ok);
};

// Proof-of-Agent 驗證
export const agentVerify = onRequest({ region: REGION, timeoutSeconds: TIMEOUT_SECONDS }, async (req, res) => {
  setCors(res, req.headers?.origin);

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); return; }

  const startTime = Date.now(); // 開始計時（用於性能統計）
  
  const body = req.body || {};
  const agentAddress = body.agentAddress || body.address; // Agent 地址
  const policyName = body.policy || 'agent-policy'; // 默認使用 agent-policy

  if (!agentAddress) {
    res.status(400).json({ error: 'MISSING_AGENT_ADDRESS' });
    return;
  }

  // 構建評估上下文（從請求中獲取 proof 信息，或使用默認值）
  const network = process.env.NETWORK_NAME || process.env.SELF_ENV || 'celo-sepolia';
  const source = network.includes('mainnet') ? 'self.celo.mainnet' : 'self.celo.sepolia';
  
  const evaluationContext = {
    proof: {
      source: body.source || source,
      country: body.country,
      sanctioned: body.sanctioned || false,
      age_verified: body.age_verified,
      age: body.age,
    },
    context: 'agent',
    sandbox_score: body.sandbox_score,
    delegation_scope: body.delegation_scope,
    agent_address: agentAddress,
    whitelist: body.whitelist || [],
  };

  // 拒絕案例：DEMO_FAIL_AGENT_NOT_TRUSTED
  if (agentAddress === 'DEMO_FAIL_AGENT_NOT_TRUSTED' || agentAddress === 'DEMO_REJECTED_AGENT') {
    const crypto = require('crypto');
    
    // 生成 proof_ref（與其他場景一致）
    const proofRef = agentAddress;
    const capsuleHash = '0x' + crypto.createHash('sha256').update(agentAddress + 'agent-rejected').digest('hex').slice(0, 64);
    
    // 即使拒絕，也顯示評估結果（AI safety framing）
    const sandboxScore = 0.41; // 模擬低於閾值的分數
    const threshold = 0.9; // 安全閾值
    
    // 使用 policy 引擎評估（即使被拒絕，也記錄 policy 評估結果）
    evaluationContext.sandbox_score = sandboxScore;
    const policyResult = evaluatePolicy(policyName, evaluationContext);
    
    // 顯示 delegation_scope（權限結構閉環）
    const delegationScope = ['dao:vote', 'dao:propose', 'rwa:precheck'];
    
    // 審計 log entry
    const now = new Date();
    const timestamp1 = new Date(now.getTime() - 5000).toISOString(); // 5秒前
    const timestamp2 = new Date(now.getTime() - 3000).toISOString(); // 3秒前
    const timestamp3 = now.toISOString(); // 現在
    
    // 生成 JSONL Hash（增強鏈感）
    const jsonlContent = JSON.stringify({
      timestamp: timestamp3,
      action: 'AGENT_VERIFICATION',
      status: 'FAIL',
      reason: 'AGENT_NOT_IN_WHITELIST',
      proof_ref: proofRef,
    });
    const jsonlHash = '0x' + crypto.createHash('sha256').update(jsonlContent).digest('hex').slice(0, 64);
    
    const auditEntry = {
      timestamp: timestamp3,
      action: 'AGENT_VERIFICATION',
      status: 'FAIL',
      reason: 'AGENT_NOT_IN_WHITELIST',
      proof_ref: proofRef,
      capsuleHash: capsuleHash,
      sandbox_score: sandboxScore,
      threshold: threshold,
      delegate_scope_denied: delegationScope,
      verifier: 'StatelessGuard',
      policy_module: 'AgentTrustPolicyV1', // 新增：政策模組（模組化可替換）
      trust_policy_version: policyResult.policy_version || '2025.10.1', // 從 policy 引擎獲取版本
      policy_id: policyResult.policy_id, // 從 policy 引擎獲取 policy ID
      matched_rule: policyResult.matched_rule, // 匹配的規則
      jsonl_hash: jsonlHash, // 新增：JSONL Hash（增強鏈感）
      // 新增：AI Agent Trace Capsule（可視化審計鏈）
      trace_capsule: [
        {
          timestamp: timestamp1,
          action: 'AGENT_VERIFICATION',
          details: `sandbox_score=${sandboxScore}`,
        },
        {
          timestamp: timestamp2,
          action: 'TRUST_EVALUATION',
          details: `decision=rejected | threshold=${threshold}`,
        },
        {
          timestamp: timestamp3,
          action: 'DAO_AUTHORIZATION',
          details: `scope=[${delegationScope.join(', ')}] | status=denied`,
        },
      ],
    };
    
    res.status(200).json({
      status: 'rejected',
      reason: 'AGENT_NOT_IN_WHITELIST',
      context: 'agent-verification',
      agentAddress,
      proof_ref: proofRef, // 新增：追溯 proof 引用
      capsuleHash: capsuleHash, // 新增：與 RWA/DAO 一致的格式
      network,
      source,
      verifier: 'StatelessGuard',
      timestamp: new Date().toISOString(),
      // 新增：AI safety framing（即使拒絕也顯示評估結果）
      sandbox_score: sandboxScore,
      threshold: threshold,
      evaluation_result: `此 Agent 的 sandbox 分數（${sandboxScore}）低於安全閾值（${threshold}），因此未獲授權。`,
      // 新增：權限結構閉環
      delegation_scope: delegationScope,
      delegation_note: '此 Agent 尚未被授權在這些範疇執行操作：' + delegationScope.join('、'),
      // 新增：信任政策版本
      trust_policy_version: '2025.10.1',
      // 新增：審計 log entry（包含 trace_capsule）
      audit_log: auditEntry,
      trace_capsule: auditEntry.trace_capsule, // 方便前端直接訪問
      human_readable: '此 AI Agent 已評估，但 sandbox 分數（0.41）低於安全閾值（0.9），因此未獲授權。AI Agent 不是被拒絕，而是被評估不夠安全。此 Agent 尚未被授權在 DAO 投票、DAO 提案、RWA 前置檢查等範疇執行操作。',
    });
    return;
  }

  // Mock Proof-of-Agent 驗證
  // 實際應驗證 agent_address 是否為可信的 AI Agent
  const agentAddressPattern = /^0x[0-9a-fA-F]{40}$/;
  if (!agentAddressPattern.test(agentAddress)) {
    const network = process.env.NETWORK_NAME || process.env.SELF_ENV || 'celo-sepolia';
    res.status(200).json({
      status: 'invalid',
      reason: 'INVALID_AGENT_ADDRESS',
      context: 'agent-verification',
      network,
      source: network.includes('mainnet') ? 'self.celo.mainnet' : 'self.celo.sepolia',
      verifier: 'StatelessGuard',
      human_readable: 'Agent 地址格式不正確，請提供有效的以太坊地址（0x 開頭 42 字元）。',
    });
    return;
  }

  // 模擬 Agent 驗證結果（增強版）
  const crypto = require('crypto');
  
  // 產生 agent signature（模擬）
  const agentSignature = '0x' + crypto.randomBytes(32).toString('hex').slice(0, 64);
  
  // 產生 sandbox_score（模擬）
  const sandboxScore = 0.96; // 模擬 sandbox 分數
  
  // 使用 policy 引擎評估
  evaluationContext.sandbox_score = sandboxScore;
  const policyResult = evaluatePolicy(policyName, evaluationContext);
  
  // Agent → DAO 代理權限
  const canDelegate = true; // 此 Agent 可以代理操作
  const delegateScope = ['dao:vote', 'dao:propose', 'rwa:precheck']; // 代理範圍
  
  // 生成 JSONL Hash（成功案例）
  const jsonlContent = JSON.stringify({
    timestamp: new Date().toISOString(),
    action: 'AGENT_VERIFICATION',
    status: 'VERIFIED',
    agentAddress,
  });
  const jsonlHash = '0x' + crypto.createHash('sha256').update(jsonlContent).digest('hex').slice(0, 64);
  
  res.status(200).json({
    status: 'verified',
    context: 'agent-verification',
    agentAddress,
    agentType: 'ai-agent', // 標記為 AI Agent
    verifiedAt: new Date().toISOString(),
    network, // 新增：網路名稱
    source, // Self 來源
    capsuleHash: '0x' + crypto.createHash('sha256').update(agentAddress + 'agent').digest('hex'),
    note: 'Proof-of-Agent：此 Agent 已通過驗證，可用於 AI Agent 生態',
    // 新增：Proof-of-Agent 詳細資訊
    agent_signature: agentSignature,
    model: 'gpt-4o-mini', // 模擬 AI 模型
    training_cutoff: '2024-10', // 模擬訓練截止日期
    chain_of_trust: ['Self', 'Agent Capsule'], // 信任鏈
    sandbox_score: sandboxScore, // sandbox 分數
    threshold: 0.9, // 安全閾值（用於顯示進度條）
    // 新增：Agent → DAO 代理權限
    can_delegate: canDelegate,
    delegate_scope: delegateScope,
    verifier: 'StatelessGuard', // 團隊名簽進資料
    policy_module: 'AgentTrustPolicyV1', // 新增：政策模組（模組化可替換）
    // 新增：信任政策版本（從 policy 引擎獲取）
    trust_policy_version: policyResult.policy_version || '2025.10.1',
    policy_id: policyResult.policy_id, // 從 policy 引擎獲取 policy ID
    matched_rule: policyResult.matched_rule, // 匹配的規則
    evaluation_details: policyResult.evaluation_details, // 評估詳情
    // 新增：JSONL Hash（增強鏈感）
    jsonl_hash: jsonlHash,
    // 新增：人類可讀描述
    human_readable: 'AI Agent 來源可信（Self proof on Celo），已通過沙盒評估，可在本系統內發起/代理操作。此 Agent 可代表用戶在 DAO 中投票、發起提案，並可進行 RWA 前置檢查。',
    // 性能統計
    verification_time_ms: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
  
  // 記錄性能統計
  try {
    // @ts-ignore
    const { recordPerformance } = require('./performanceStats');
    recordPerformance('/api/agent/verify', Date.now() - startTime, 'proof_of_agent');
  } catch {}
});

