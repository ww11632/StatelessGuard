//js/statusSummary.js（狀態摘要組件）
// 在所有頁面顯示 Capsule Hash 和 JSONL 記錄數等狀態資訊

(function () {
  // 讀取 JSONL 記錄
  function readAuditLog() {
    const raw = localStorage.getItem('audit_log_jsonl') || '';
    if (!raw.trim()) return [];
    try {
      return raw.split(/\r?\n/).filter(Boolean).map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);
    } catch {
      return [];
    }
  }

  // 獲取最後的 Capsule Hash（從最後一條記錄中提取，或從 localStorage 的特殊鍵）
  function getLastCapsuleHash(entries) {
    // 優先從 localStorage 獲取最新保存的 capsuleHash（來自當前頁面的驗證結果）
    const lastCapsuleHash = localStorage.getItem('last_capsule_hash');
    if (lastCapsuleHash) return lastCapsuleHash;
    
    // 否則從 audit log 中提取
    if (!entries || entries.length === 0) return null;
    const lastEntry = entries[entries.length - 1];
    return lastEntry.capsuleHash || lastEntry.capsule_hash || lastEntry.record_hash || null;
  }

  // 生成狀態摘要 HTML
  function generateStatusSummary() {
    const entries = readAuditLog();
    const entryCount = entries.length;
    const lastCapsuleHash = getLastCapsuleHash(entries);
    
    const html = [];
    html.push('<div style="padding:12px 16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; margin:16px 0; font-size:12px; color:#6b7280;">');
    html.push('<div style="display:flex; gap:20px; flex-wrap:wrap; align-items:center;">');
    
    // JSONL 記錄數（動態計算）
    const savedCount = entries.filter(e => e.audit_saved === true || e.audit_id).length;
    html.push('<div>');
    html.push(`<span style="font-weight:600; color:#1f2937;">JSONL:</span> `);
    html.push(`<code style="background:#fff; padding:2px 6px; border-radius:4px; font-family:ui-monospace; font-size:11px;">audit_log.jsonl</code> `);
    html.push(`<span style="color:#10b981;">(${entryCount} entries</span>`);
    if (savedCount > 0) {
      html.push(`<span style="color:#2563eb;">, ${savedCount} saved</span>`);
    }
    html.push(`<span style="color:#10b981;">)</span>`);
    html.push('</div>');
    
    // Capsule Hash
    if (lastCapsuleHash) {
      const shortHash = lastCapsuleHash.length > 20 
        ? lastCapsuleHash.slice(0, 10) + '...' + lastCapsuleHash.slice(-8)
        : lastCapsuleHash;
      html.push('<div>');
      html.push(`<span style="font-weight:600; color:#1f2937;">Capsule Hash:</span> `);
      html.push(`<code style="background:#fff; padding:2px 6px; border-radius:4px; font-family:ui-monospace; font-size:11px; color:#2563eb;">${shortHash}</code>`);
      html.push('</div>');
    } else {
      html.push('<div>');
      html.push(`<span style="font-weight:600; color:#1f2937;">Capsule Hash:</span> `);
      html.push(`<span style="color:#9ca3af;">—</span>`);
      html.push('</div>');
    }
    
    html.push('</div>');
    html.push('</div>');
    
    return html.join('');
  }

  // 在所有頁面底部插入狀態摘要
  function init() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    // 找到 container（確保狀態摘要框與其他卡片對齊）
    const container = document.querySelector('.container');
    
    // 檢查是否已經存在 statusSummary（避免重複創建）
    let statusContainer = document.getElementById('statusSummary');
    
    if (!statusContainer) {
      // 如果不存在，創建新的容器
      statusContainer = document.createElement('div');
      statusContainer.id = 'statusSummary';
      
      // 如果找到 container，插入到 container 內（在 nav 之前）
      // 這樣可以確保與其他卡片對齊
      if (container && nav.parentElement === container) {
        container.insertBefore(statusContainer, nav);
      } else {
        // 後備方案：插入到 nav 之前
        nav.parentNode.insertBefore(statusContainer, nav);
      }
    }
    
    // 更新內容
    statusContainer.innerHTML = generateStatusSummary();
    
    // 定期更新狀態（每 2 秒）
    setInterval(() => {
      const container = document.getElementById('statusSummary');
      if (container) {
        container.innerHTML = generateStatusSummary();
      }
    }, 2000);
    
    // 監聽 audit log 更新事件
    window.addEventListener('auditLogUpdated', () => {
      const container = document.getElementById('statusSummary');
      if (container) {
        container.innerHTML = generateStatusSummary();
      }
    });
  }

  // DOM 準備好後初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
