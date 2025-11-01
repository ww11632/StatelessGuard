// public/js/audit.js
//
// 提供一組簡單的工具函式，用來管理瀏覽器中存放的 JSONL 審計日誌。
// 每一筆日誌包含以下欄位：
//   ts        ── ISO 時間戳記
//   actor     ── 行為發出者（預設為 'frontend'）
//   type      ── 行為類型，如 TERMS_HASHED、PROOF_ACCEPTED 等
//   ref       ── 與本次行為相關的參考字串
//   hashValue ── 與行為相關的雜湊值
//   prevHash  ── 前一筆紀錄的整行雜湊
//   lineHash  ── 當前紀錄本身的整行雜湊

// 計算字串或物件的 SHA-256 雜湊，回傳十六進位字串。
async function computeHash(input) {
  let data;
  if (input instanceof ArrayBuffer) {
    data = input;
  } else if (typeof input === 'string') {
    data = new TextEncoder().encode(input);
  } else {
    // 物件則先以排序後的 JSON 序列化
    data = new TextEncoder().encode(sortedJson(input));
  }
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 將物件穩定排序後轉為 JSON 字串，確保相同內容產生相同的序列化結果。
function sortedJson(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return JSON.stringify(obj);
  }
  const keys = Object.keys(obj).sort();
  let out = '{';
  keys.forEach((k, i) => {
    if (i > 0) out += ',';
    out += JSON.stringify(k) + ':' + sortedJson(obj[k]);
  });
  out += '}';
  return out;
}

// 讀取 localStorage 中的 audit_log_jsonl，並以陣列形式回傳。
function loadLog() {
  const raw = localStorage.getItem('audit_log_jsonl') || '';
  if (!raw.trim()) return [];
  return raw.split(/\r?\n/).filter(Boolean).map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

// 將給定的日誌陣列儲存回 localStorage。
function saveLog(lines) {
  const text = lines.map(l => JSON.stringify(l)).join('\n');
  localStorage.setItem('audit_log_jsonl', text);
}

// 計算單行紀錄的 lineHash，忽略 lineHash 本身。
async function calculateLineHash(record) {
  const plain = JSON.stringify({
    ts: record.ts,
    actor: record.actor,
    type: record.type,
    ref: record.ref,
    hashValue: record.hashValue,
    prevHash: record.prevHash,
  });
  return await computeHash(plain);
}

// 新增一筆日誌：會自動補上 ts、prevHash 與 lineHash，並避免重複。
async function addLogEntry({ type, ref, hashValue, actor = 'frontend' }) {
  const lines = loadLog();
  const prevHash = lines.length ? await computeHash(JSON.stringify(lines[lines.length - 1])) : null;
  const entry = {
    ts: new Date().toISOString(),
    actor,
    type,
    ref,
    hashValue,
    prevHash,
    lineHash: null,
  };
  entry.lineHash = await calculateLineHash(entry);
  const signature = `${entry.type}|${entry.ref}|${entry.hashValue}`;
  const signatures = new Set(lines.map(l => `${l.type}|${l.ref}|${l.hashValue}`));
  if (!signatures.has(signature)) {
    lines.push(entry);
    saveLog(lines);
  }
}