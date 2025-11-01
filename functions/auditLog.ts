// functions/auditLog.ts
//
// 端點：POST /api/audit
// 功能：接收前端傳來的 JSONL audit log 記錄，保存到 Firestore 和 IPFS
// 返回：audit_id、ipfs_cid（用於前端顯示「已上 audit」和 IPFS CID）

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import FormData = require('form-data');
import fetch from 'node-fetch';
import * as crypto from 'crypto';

// 初始化 Firebase Admin（如果尚未初始化）
if (!admin.apps.length) {
  // 在 emulator 環境中使用 Firestore emulator
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
  } else if (process.env.FUNCTIONS_EMULATOR === 'true') {
    // 如果 FUNCTIONS_EMULATOR 為 true，設置本地 emulator
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  }
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = 'us-central1';
const TIMEOUT_SECONDS = 15;

// IPFS 配置（使用 Pinata API）
const USE_IPFS = process.env.USE_IPFS === 'true';
const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '';
const PINATA_ENABLED = USE_IPFS && PINATA_API_KEY && PINATA_SECRET_KEY;

// 計算 record_hash（不包含 record_hash 本身）
// 注意：需要排除後端添加的欄位（audit_id, ipfs_cid, ipfs_url, created_at 等）
function calculateRecordHash(data: any): string {
  // 排除 record_hash 本身，以及後端添加的欄位
  // 注意：必須與前端 calculateRecordHash 的 excludedFields 完全一致
  const excludedFields = [
    'record_hash',
    'audit_id',
    'ipfs_cid',
    'ipfs_url',
    'audit_saved',
    'audit_error',
    'created_at',
    'source',   // 後端添加的元數據
    'version'   // 後端添加的元數據
  ];
  
  const hashData: any = {};
  Object.keys(data).forEach(key => {
    if (!excludedFields.includes(key)) {
      hashData[key] = data[key];
    }
  });
  
  // 穩定排序的 JSON 字符串（確保相同內容產生相同 hash）
  const sortedKeys = Object.keys(hashData).sort();
  const jsonObj: any = {};
  sortedKeys.forEach(key => jsonObj[key] = hashData[key]);
  const jsonString = JSON.stringify(jsonObj);
  const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
  return '0x' + hash;
}

// 獲取最後一筆 audit log 的 record_hash
async function getLastRecordHash(): Promise<string | null> {
  try {
    const snapshot = await db.collection('audit_logs')
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0];
      const lastData = lastDoc.data();
      return lastData.record_hash || null;
    }
    return null;
  } catch (error: any) {
    console.warn('獲取最後一筆記錄失敗（可能是第一筆記錄）:', error.message);
    return null;
  }
}

// 上傳到 IPFS（使用 Pinata）
async function uploadToIPFS(data: any): Promise<{ ipfs_cid?: string; ipfs_url?: string; error?: string }> {
  if (!PINATA_ENABLED) {
    return { error: 'IPFS_NOT_CONFIGURED' };
  }

  try {
    // 將 audit log 轉為 JSON 字符串
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = Buffer.from(jsonContent, 'utf-8');

    // 構建 FormData（Pinata 需要）
    const formData = new FormData();
    formData.append('file', blob, {
      filename: `audit_${data.timestamp || Date.now()}.json`,
      contentType: 'application/json',
    });

    // Pinata 的 metadata（可選）
    const metadata = JSON.stringify({
      name: `audit-log-${data.capsuleHash || data.timestamp || Date.now()}`,
      keyvalues: {
        scenario: data.scenario || 'unknown',
        action: data.action || 'AUDIT_LOG',
        status: data.status || 'verified',
      },
    });
    formData.append('pinataMetadata', metadata);

    // 設定 Pinata 選項（pin 到 IPFS）
    const options = JSON.stringify({
      cidVersion: 1, // IPFS CIDv1
    });
    formData.append('pinataOptions', options);

    // 發送請求到 Pinata API
    // FormData 的 getHeaders() 方法會自動設置正確的 Content-Type 和 boundary
    const headers: any = {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    };
    
    // 添加 FormData 的 headers（form-data 包提供了 getHeaders() 方法）
    if (formData.getHeaders) {
      const formHeaders = formData.getHeaders();
      Object.assign(headers, formHeaders);
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata API 錯誤:', response.status, errorText);
      return { error: `PINATA_API_ERROR: ${response.status}` };
    }

    const result = await response.json() as { IpfsHash?: string };
    
    if (result.IpfsHash) {
      const ipfsCid = result.IpfsHash;
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
      console.log('✅ IPFS 上傳成功:', ipfsCid);
      return { ipfs_cid: ipfsCid, ipfs_url: ipfsUrl };
    }

    return { error: 'NO_IPFS_CID_RETURNED' };
  } catch (error: any) {
    console.error('IPFS 上傳失敗:', error);
    return { error: `IPFS_UPLOAD_ERROR: ${error.message}` };
  }
}

// CORS
const allowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const setCors = (res: any, origin?: string) => {
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

export const auditLog = onRequest({ region: REGION, timeoutSeconds: TIMEOUT_SECONDS }, async (req, res) => {
  setCors(res, req.headers?.origin);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  // 在函數頂部聲明 ipfsResult，以便在 catch 塊中也能訪問
  let ipfsResult: { ipfs_cid?: string; ipfs_url?: string; error?: string } = {};

  try {
    const body = req.body || {};
    
    // 驗證必要欄位
    if (!body.timestamp && !body.action) {
      res.status(400).json({ 
        error: 'MISSING_REQUIRED_FIELDS',
        message: '至少需要 timestamp 或 action 欄位'
      });
      return;
    }

    // 獲取上一筆記錄的 hash（用於建立鏈式關係）
    const prevHash = body.prev_hash || await getLastRecordHash();
    
    // 構建 audit log 記錄（先不包含 Firestore timestamp 和 record_hash，因為要計算）
    // 注意：source 和 version 在計算 hash 時會被排除（為了與前端一致）
    const auditEntryBase: any = {
      timestamp: body.timestamp || new Date().toISOString(),
      action: body.action || 'AUDIT_LOG',
      status: body.status || 'verified',
      scenario: body.scenario || null,
      policy: body.policy || null,
      capsuleHash: body.capsuleHash || body.capsule_hash || null,
      proof_ref: body.proof_ref || null,
      prev_hash: prevHash || null, // 上一筆的 record_hash
      // 保留其他欄位（但排除 record_hash 和後端添加的欄位）
      ...Object.fromEntries(
        Object.entries(body).filter(([key]) => 
          !['record_hash', 'audit_id', 'ipfs_cid', 'ipfs_url', 'audit_saved', 'audit_error', 'created_at'].includes(key)
        )
      ),
    };
    
    // 計算當前記錄的 record_hash（必須在計算前完成，不包含 record_hash 本身）
    // 注意：計算 hash 時會排除 source 和 version，所以先不添加它們
    const recordHash = calculateRecordHash(auditEntryBase);
    auditEntryBase.record_hash = recordHash;
    
    // 現在添加後端元數據（這些不會影響 record_hash，因為 hash 計算時已排除）
    auditEntryBase.source = 'frontend';
    auditEntryBase.version = '1.0';

    // 1. 先嘗試上傳到 IPFS（可選，失敗不影響 Firestore）
    // 使用 Promise.race 設置超時，避免長時間等待
    if (PINATA_ENABLED) {
      try {
        console.log('📤 開始上傳到 IPFS...');
        // 設置 8 秒超時
        const timeoutPromise = new Promise<{ error: string }>((resolve) => {
          setTimeout(() => resolve({ error: 'IPFS_UPLOAD_TIMEOUT' }), 8000);
        });
        
        ipfsResult = await Promise.race([
          uploadToIPFS(auditEntryBase),
          timeoutPromise,
        ]);
        
        console.log('📥 IPFS 上傳結果:', ipfsResult);
      } catch (error: any) {
        console.warn('IPFS 上傳過程發生錯誤（將繼續使用 Firestore）:', error);
        console.warn('IPFS 錯誤堆疊:', error.stack);
        ipfsResult = { error: error.message || String(error) };
      }
    } else {
      console.log('ℹ️  IPFS 未啟用（USE_IPFS=false 或缺少 API keys）');
    }

    // 2. 保存到 Firestore（audit_logs collection）
    // 在 emulator 環境中使用 ISO 時間戳，避免 FieldValue 問題
    const createdAt = new Date().toISOString();

    const auditEntry: any = {
      ...auditEntryBase,
      // 添加 Firestore 特有的欄位
      created_at: createdAt,
      // 如果 IPFS 成功，保存 CID 和 URL
      ipfs_cid: ipfsResult.ipfs_cid || null,
      ipfs_url: ipfsResult.ipfs_url || null,
      ipfs_enabled: PINATA_ENABLED,
      ipfs_error: ipfsResult.error || null,
    };

    let docRef;
    try {
      // 嘗試保存到 Firestore（即使沒有 Firestore emulator，也應該快速失敗而不是超時）
      docRef = await Promise.race([
        db.collection('audit_logs').add(auditEntry),
        new Promise<any>((_, reject) => {
          setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), 3000);
        }),
      ]);
    } catch (firestoreError: any) {
      // 如果 Firestore 不可用（emulator 未啟動）或超時，僅返回 IPFS 結果
      console.warn('Firestore 保存失敗（可能 emulator 未啟動或超時），僅返回 IPFS 結果:', firestoreError.message);
      const responseData: any = {
        success: true,
        audit_id: `local_${Date.now()}`,
        timestamp: auditEntryBase.timestamp,
        message: 'Audit log processed (Firestore unavailable, IPFS only)',
      };
      
      if (ipfsResult.ipfs_cid) {
        responseData.ipfs_cid = ipfsResult.ipfs_cid;
        responseData.ipfs_url = ipfsResult.ipfs_url;
        responseData.storage = ['ipfs'];
      } else {
        responseData.storage = ['none'];
        responseData.ipfs_error = ipfsResult.error || 'IPFS_NOT_CONFIGURED';
      }
      
      res.status(200).json(responseData);
      return;
    }
    
    // 獲取 audit_id（使用 Firestore document ID）
    const auditId = docRef.id;

    // 3. 返回成功響應（包含 audit_id 和 IPFS CID）
    const responseData: any = {
      success: true,
      audit_id: auditId,
      timestamp: auditEntryBase.timestamp,
      message: 'Audit log saved successfully',
    };

    // 如果 IPFS 成功，添加 CID 和 URL
    if (ipfsResult.ipfs_cid) {
      responseData.ipfs_cid = ipfsResult.ipfs_cid;
      responseData.ipfs_url = ipfsResult.ipfs_url;
      responseData.storage = ['firestore', 'ipfs'];
    } else {
      responseData.storage = ['firestore'];
      if (ipfsResult.error && PINATA_ENABLED) {
        responseData.ipfs_error = ipfsResult.error;
        responseData.ipfs_note = 'IPFS 上傳失敗，但已保存到 Firestore';
      }
    }

    res.status(200).json(responseData);

  } catch (error: any) {
    console.error('❌ 保存 audit log 失敗:', error);
    console.error('錯誤堆疊:', error.stack);
    console.error('錯誤類型:', error.constructor?.name);
    
    // 即使發生錯誤，也嘗試返回基本信息（如果有 IPFS 結果）
    const errorResponse: any = {
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to save audit log',
      error_type: error.constructor?.name || 'Unknown',
    };
    
    // 如果 IPFS 已經成功上傳（但在 Firestore 保存時失敗），返回 IPFS CID
    if (ipfsResult.ipfs_cid) {
      console.log('✅ IPFS 已成功上傳，返回 IPFS CID');
      errorResponse.ipfs_cid = ipfsResult.ipfs_cid;
      errorResponse.ipfs_url = ipfsResult.ipfs_url;
      errorResponse.note = 'IPFS 上傳成功，但 Firestore 保存失敗';
      // 返回 200 而不是 500，因為至少 IPFS 成功了
      res.status(200).json(errorResponse);
      return;
    }
    
    res.status(500).json(errorResponse);
  }
});

