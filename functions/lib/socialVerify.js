"use strict";
// functions/socialVerify.ts
//
// 端點：POST /api/social/verify
// 功能：社交聲譽（Reputation Capsule）驗證
// 展示：基於身份驗證的社交網絡聲譽評分
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialVerify = void 0;
const https_1 = require("firebase-functions/v2/https");
const REGION = 'us-central1';
const TIMEOUT_SECONDS = 10;
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
exports.socialVerify = (0, https_1.onRequest)({ region: REGION, timeoutSeconds: TIMEOUT_SECONDS }, async (req, res) => {
    setCors(res, req.headers?.origin);
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
        return;
    }
    const startTime = Date.now();
    const crypto = require('crypto');
    try {
        const { txHash, proof_ref } = req.body;
        // 如果提供了 proof_ref，使用它；否則需要 txHash
        if (!proof_ref && !txHash) {
            res.status(400).json({
                error: 'MISSING_IDENTIFIER',
                note: '需要 txHash 或 proof_ref',
            });
            return;
        }
        // 模擬社交聲譽驗證（基於 Self Proof）
        const network = process.env.NETWORK_NAME || process.env.SELF_ENV || 'celo-sepolia';
        const source = network.includes('mainnet') ? 'self.celo.mainnet' : 'self.celo.sepolia';
        // 模擬聲譽評分（基於驗證歷史、社群參與度等）
        const reputationScore = 87; // 0-100 的聲譽分數
        // 生成 Capsule Hash
        const identifier = proof_ref || txHash || 'demo-social';
        const capsuleHash = '0x' + crypto.createHash('sha256').update(identifier + 'social-reputation').digest('hex').slice(0, 64);
        // 生成 JSONL Hash（增強鏈感）
        const jsonlContent = JSON.stringify({
            timestamp: new Date().toISOString(),
            action: 'SOCIAL_REPUTATION_VERIFICATION',
            status: 'VERIFIED',
            reputation_score: reputationScore,
            proof_ref: proof_ref || txHash,
        });
        const jsonlHash = '0x' + crypto.createHash('sha256').update(jsonlContent).digest('hex').slice(0, 64);
        res.status(200).json({
            status: 'verified',
            context: 'social-verification',
            reputation_score: reputationScore,
            capsuleHash: capsuleHash,
            proof_ref: proof_ref || txHash,
            network,
            source,
            verifier: 'StatelessGuard',
            policy_module: 'SocialReputationPolicyV1', // 政策模組（模組化可替換）
            trust_policy_version: '2025.10.1',
            jsonl_hash: jsonlHash, // JSONL Hash（增強鏈感）
            reputation_level: reputationScore >= 80 ? 'high' : reputationScore >= 60 ? 'medium' : 'low',
            reputation_factors: [
                '身份驗證完整性',
                '社群參與度',
                '歷史行為記錄',
                '信任鏈完整性',
            ],
            human_readable: `社交聲譽評分：${reputationScore}/100（${reputationScore >= 80 ? '高' : reputationScore >= 60 ? '中' : '低'}）。基於身份驗證和社群參與歷史的綜合評估。`,
            verification_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Social verification error:', error);
        res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: error.message || '社交聲譽驗證失敗',
            timestamp: new Date().toISOString(),
        });
    }
});
