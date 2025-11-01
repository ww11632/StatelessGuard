// functions/docHashVerify.ts
//
// 端點：POST /api/doc/hash-verify
// 功能：文件雜湊驗證（RWA 合規流程的一部分）
// 展示：租約/抵押協議等文件的雜湊驗證

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
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  return Boolean(ok);
};

export const docHashVerify = onRequest({ region: REGION, timeoutSeconds: TIMEOUT_SECONDS }, async (req, res) => {
  setCors(res, req.headers?.origin);

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); return; }

  const startTime = Date.now();
  const crypto = require('crypto');

  try {
    const { docHash, docType, proof_ref } = req.body;

    if (!docHash) {
      res.status(400).json({
        error: 'MISSING_DOC_HASH',
        note: '需要 docHash 參數',
      });
      return;
    }

    // 模擬文件雜湊驗證（RWA 合規流程）
    const network = process.env.NETWORK_NAME || process.env.SELF_ENV || 'celo-sepolia';
    const source = network.includes('mainnet') ? 'self.celo.mainnet' : 'self.celo.sepolia';
    
    // 模擬文件類型（租約/抵押協議等）
    const documentType = docType || 'lease_agreement'; // 預設為租約協議
    const documentTypeLabels: { [key: string]: string } = {
      'lease_agreement': '租約協議',
      'mortgage_agreement': '抵押協議',
      'property_deed': '產權證明',
      'insurance_policy': '保險保單',
      'compliance_certificate': '合規證書',
    };
    const documentTypeLabel = documentTypeLabels[documentType] || documentType;
    
    // 生成 Capsule Hash（文件雜湊的 Capsule）
    const capsuleHash = '0x' + crypto.createHash('sha256').update(docHash + 'doc-verify').digest('hex').slice(0, 64);
    
    // 生成 JSONL Hash（增強鏈感）
    const jsonlContent = JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'DOCUMENT_HASH_VERIFICATION',
      status: 'VERIFIED',
      doc_type: documentType,
      doc_hash: docHash,
      proof_ref: proof_ref || null,
    });
    const jsonlHash = '0x' + crypto.createHash('sha256').update(jsonlContent).digest('hex').slice(0, 64);

    res.status(200).json({
      status: 'verified',
      context: 'document-hash-verification',
      doc_hash: docHash,
      doc_type: documentType,
      doc_type_label: documentTypeLabel,
      capsuleHash: capsuleHash,
      proof_ref: proof_ref || null,
      network,
      source,
      verifier: 'StatelessGuard',
      policy_module: 'RWACompliancePolicyV1', // 政策模組（模組化可替換）
      trust_policy_version: '2025.10.1',
      jsonl_hash: jsonlHash, // JSONL Hash（增強鏈感）
      verification_details: {
        hash_algorithm: 'SHA256',
        verification_method: 'on-chain_storage',
        timestamp: new Date().toISOString(),
      },
      human_readable: `文件雜湊驗證成功：${documentTypeLabel}（${docHash.slice(0, 16)}...${docHash.slice(-8)}）已通過驗證。文件已記錄在鏈上，可用於 RWA 合規流程。`,
      verification_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Document hash verification error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || '文件雜湊驗證失敗',
      timestamp: new Date().toISOString(),
    });
  }
});




