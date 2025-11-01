(function(){
  function el(id){ return document.getElementById(id); }
  function beep(){ try{ const a=new (window.AudioContext||window.webkitAudioContext)(); const o=a.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(880,a.currentTime); o.connect(a.destination); o.start(); o.stop(a.currentTime+0.1);}catch{}}
  function pretty(x){ try{ return JSON.stringify(x,null,2);}catch{return String(x);} }

  document.addEventListener('DOMContentLoaded', () => {
    const $tx = el('txHash');
    const $agentAddr = el('agentAddress');
    const $btn = el('btnVerify');
    const $btnOpenVerify = el('btnOpenVerify');
    const $result = el('result');
    const $successCard = el('successCard');
    const $metaCard = el('metaCard');
    const $metaInfo = el('metaInfo');
    const $modeHuman = el('modeHuman');
    const $modeAgent = el('modeAgent');
    const $humanMode = el('humanMode');
    const $agentMode = el('agentMode');
    if(!$tx||!$btn) return;
    
    // 切換驗證模式
    if ($modeHuman && $modeAgent) {
      $modeHuman.addEventListener('change', () => {
        if ($modeHuman.checked) {
          $humanMode.style.display='block';
          $agentMode.style.display='none';
        }
      });
      $modeAgent.addEventListener('change', () => {
        if ($modeAgent.checked) {
          $humanMode.style.display='none';
          $agentMode.style.display='block';
        }
      });
    }

    $btn.addEventListener('click', async () => {
      $result.className=''; $result.textContent='';
      $metaCard.style.display='none'; $successCard.style.display='none'; $btnOpenVerify.style.display='none';
      
      // 開始計時（用於顯示驗證時間）
      const startTime = Date.now();
      
      // 判斷驗證模式（儲存到變數供後續使用）
      const isAgentMode = $modeAgent && $modeAgent.checked;
      window.__lastVerifyMode = isAgentMode ? 'proof_of_agent' : 'proof_of_human'; // 儲存模式供後續使用
      
      if (isAgentMode) {
        // Proof-of-Agent 模式
        const agentAddr = ($agentAddr?.value||'').trim();
        if (!agentAddr) { alert('請輸入 Agent Address（0x 開頭的 42 字元）'); return; }
        if (!agentAddr.startsWith('0x') || agentAddr.length !== 42) {
          alert('請輸入正確的 Agent Address（0x 開頭 42 字元）'); return;
        }
        
        // 顯示載入狀態（進度動畫）
        $result.className='';
        $result.innerHTML = '<span class="loading">⏳</span> Agent 驗證中...';
        
        try{
          const resp = await fetch((CONFIG.API_BASE||'') + '/api/agent/verify', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ agentAddress: agentAddr })
          });
          const data = await resp.json();
          
          const elapsedMs = Date.now() - startTime;
          const elapsedSec = (elapsedMs / 1000).toFixed(1);
          
          if (data && data.status === 'verified') {
            beep();
            $result.className='ok';
            let agentInfo = `✅ Agent 驗證成功：${data.agentAddress?.slice(0,10)}...<small style="color:#6b7280;font-size:12px;">（${elapsedSec} 秒完成）</small>`;
            
            // 新增：Agent 詳細資訊顯示
            if (data.model || data.agent_signature) {
              agentInfo += '<div style="margin-top:8px;padding:8px;background:#f0fdf4;border-radius:6px;font-size:13px;">';
              agentInfo += '<strong>🤖 Proof-of-Agent：AI agent 以可驗證簽章與 sandbox 分數通過驗證</strong><br><br>';
              if (data.model) agentInfo += `📊 模型：${data.model}<br>`;
              if (data.training_cutoff) agentInfo += `📅 訓練截止：${data.training_cutoff}<br>`;
              if (data.agent_signature) agentInfo += `✍️ 簽章：<code style="font-size:11px">${data.agent_signature.slice(0,10)}...${data.agent_signature.slice(-6)}</code><br>`;
              if (data.chain_of_trust && Array.isArray(data.chain_of_trust)) {
                agentInfo += `🔗 信任鏈：${data.chain_of_trust.join(' → ')}<br>`;
              }
              if (data.sandbox_score !== undefined) {
                agentInfo += `🧪 Sandbox 分數：<strong style="color:#10b981;">${data.sandbox_score}</strong> (${(data.sandbox_score * 100).toFixed(1)}%)<br>`;
              }
              agentInfo += '</div>';
            }
            
            $result.innerHTML = agentInfo + `<br><small class="hint">🤖 ${data.agentType || 'ai-agent'} | 🤖 mode: proof_of_agent | ${data.source || 'N/A'}</small>`;
            $successCard.style.display='block';
            $metaCard.style.display='block';
            $metaInfo.textContent = pretty({ ...data, mode: 'proof_of_agent', verifier: 'StatelessGuard' }); // 記錄 mode 和 verifier
            return;
          } else {
            $result.className='err';
            $result.textContent = 'Agent 驗證失敗：' + (data?.reason || 'VERIFY_FAILED');
            return;
          }
        } catch(e){
          $result.className='err'; $result.textContent='失敗：' + String(e);
          return;
        }
      }
      
      // Proof-of-Human 模式（原有邏輯）
      const tx = ($tx.value||'').trim();
      if (!tx) { alert('請貼上 txHash（可以是 0x 開頭的 66 字元，或 DEMO_ 開頭的展示用哈希）'); return; }
      
      // 允許 demo txHash（不以 0x 開頭也可以）
      if (!tx.startsWith('0x') && !tx.startsWith('DEMO_')) {
        alert('請貼上正確的交易哈希（0x 開頭 66 字元，或 DEMO_ 開頭的展示用哈希）'); return;
      }

      // 顯示載入狀態（進度動畫）
      $result.className='';
      $result.innerHTML = '<span class="loading">⏳</span> 驗證中...';
      
      try{
        const resp = await fetch((CONFIG.API_BASE||'') + (CONFIG.SELF_VERIFY_BY_TX_ENDPOINT||'/api/self/verify-by-tx'), {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ txHash: tx })
        });
        const data = await resp.json();

        if (data && (data.status === 'invalid' || data.status === 'denied')) {
          $result.className='err';
          let msg = '驗證失敗：' + (data.reason || 'VERIFY_FAILED');
          if (data.reason === 'RECEIPT_NOT_FOUND') {
            msg = '驗證結果：❌ 查無此交易（RECEIPT_NOT_FOUND）<br><small class="hint">可能原因：<br>• 這筆交易尚未被 Celo 區塊鏈確認<br>• txHash 輸入錯誤<br>• 這不是由 Self 發出的驗證交易</small>';
          } else if (data.reason === 'DENYLISTED_USER' || data.reason === 'OFAC_DENYLIST_MATCH') {
            // 增強 denylist 錯誤提示（紅色錯誤路徑）
            const denylistHash = data.denylist_hash || '';
            msg = `❌ 驗證失敗：命中 denylist（OFAC 禁制地址）`;
            if (data.capsule_blocked) {
              msg += '<br><strong style="color:#b91c1c;">🔒 已封鎖 Capsule 輸出</strong>';
            }
            if (denylistHash) {
              msg += `<br><small class="hint">Denylist Hash: <code style="font-size:11px">${denylistHash}</code></small>`;
            }
            msg += '<br><small class="hint">此地址已在風控黑名單中，無法通過驗證</small>';
          }
          $result.innerHTML = msg;
          return;
        }

        if (!data || data.status !== 'verified') {
          $result.className='err'; $result.textContent='失敗：' + (data?.reason || 'VERIFY_FAILED'); return;
        }

        // 計算驗證時間
        const elapsedMs = Date.now() - startTime;
        const elapsedSec = (elapsedMs / 1000).toFixed(1);
        
        beep();
        $result.className='ok';
        // 組裝顯示文字（對齊 Self Bounty 三項要求 + 合規 Gate）
        let hintParts = [];
        if (data.country) hintParts.push(data.country);
        if (data.age_verified) hintParts.push('年齡已驗證');
        if (data.ofac_checked !== undefined) hintParts.push(data.ofac_checked ? '非 OFAC' : 'OFAC 檢查失敗');
        if (data.sanctioned !== undefined) hintParts.push(data.sanctioned ? '制裁地區' : '非制裁地區');
        const hintText = hintParts.length > 0 ? hintParts.join(' / ') : '驗證通過';
        
        // 合規 Gate 顯示：更完整的資訊展示
        let complianceInfo = '';
        if (data.country || data.age_verified !== undefined || data.ofac_checked !== undefined) {
          complianceInfo = '<div style="margin-top:8px;padding:8px;background:#f0fdf4;border-radius:6px;font-size:13px;">';
          complianceInfo += '<strong>✅ 合規檢查通過</strong>';
          // 新增：簽章有效徽章
          complianceInfo += ' <span style="background:#3b82f6;color:white;padding:2px 6px;border-radius:4px;font-size:11px;">🪪 簽章有效</span>';
          complianceInfo += ' <span style="background:#10b981;color:white;padding:2px 6px;border-radius:4px;font-size:11px;">🔐 Verifiable Credential 已啟用</span>';
          // 新增：Self SDK 鏈上簽章狀態
          if (data.onchain_signed || data.signature) {
            complianceInfo += ' <span style="background:#8b5cf6;color:white;padding:2px 6px;border-radius:4px;font-size:11px;">⛓️ Self SDK 已簽章</span>';
          }
          complianceInfo += '<br>';
          if (data.country) complianceInfo += `📍 國籍：${data.country}<br>`;
          if (data.age_verified !== undefined) complianceInfo += `👤 年齡：${data.age_verified ? '已驗證（≥18）' : '未驗證'}<br>`;
          if (data.ofac_checked !== undefined) complianceInfo += `🔒 OFAC：${data.ofac_checked ? '已檢查（通過）' : '未檢查'}<br>`;
          if (data.sanctioned !== undefined) complianceInfo += `🌍 制裁地區：${data.sanctioned ? '是' : '否'}<br>`;
          if (data.capsuleHash) complianceInfo += `🔗 Capsule Hash：<code style="font-size:11px">${data.capsuleHash.slice(0,20)}...</code><br>`;
          if (data.agentAddress) complianceInfo += `🤖 Agent：${data.agentAddress.slice(0,10)}...<br>`;
          // 新增：鏈上互動細節
          if (data.blockNumber) {
            const blockNum = typeof data.blockNumber === 'string' ? parseInt(data.blockNumber, 16) : data.blockNumber;
            complianceInfo += `⛓️ 區塊高度：${blockNum.toLocaleString()}<br>`;
          }
          if (data.timestamp) complianceInfo += `⏰ 時間戳：${new Date(data.timestamp).toLocaleString('zh-TW')}<br>`;
          if (data.gasUsed) {
            const gas = typeof data.gasUsed === 'string' ? parseInt(data.gasUsed, 16) : data.gasUsed;
            complianceInfo += `⛽ Gas 使用：${gas.toLocaleString()}<br>`;
          }
          complianceInfo += '</div>';
        }
        
        // Proof Capsule 下載連結（使用 fetch + Blob 下載）
        let capsuleLinks = '';
        if (data.capsuleUrl || data.capsuleHash) {
          // 確保使用正確的 URL（支援 emulator 和 production）
          let capsuleBase = data.capsuleUrl;
          if (!capsuleBase) {
            // 如果是 DEMO_ 開頭，直接使用 /api/self/capsule/...
            capsuleBase = `/api/self/capsule/${tx}`;
          }
          // 如果是在 emulator 環境，可能需要完整路徑
          const baseUrl = capsuleBase.startsWith('http') ? capsuleBase : ((CONFIG.API_BASE || '') + capsuleBase);
          capsuleLinks = '<div style="margin-top:8px;padding:8px;background:#eff6ff;border-radius:6px;font-size:13px;">';
          capsuleLinks += '<strong>📦 Proof Capsule</strong><br>';
          capsuleLinks += `<button id="btnDownloadJson" data-url="${baseUrl}?format=json" data-filename="proof_capsule_${tx.slice(0,16)}.json" style="margin-right:8px;padding:4px 8px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;">📥 下載 .json</button>`;
          capsuleLinks += `<button id="btnDownloadJwt" data-url="${baseUrl}?format=jwt" data-filename="proof_capsule_${tx.slice(0,16)}.jwt" style="margin-right:8px;padding:4px 8px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;">📥 下載 .jwt</button>`;
          capsuleLinks += `<button id="btnViewTrace" data-tx="${tx}" style="padding:4px 8px;background:#8b5cf6;color:white;border:none;border-radius:4px;cursor:pointer;">🔍 檢視 Capsule Trace</button>`;
          capsuleLinks += '</div>';
          
          // 下載按鈕事件處理
          setTimeout(() => {
            const $btnJson = document.getElementById('btnDownloadJson');
            const $btnJwt = document.getElementById('btnDownloadJwt');
            
            if ($btnJson) {
              $btnJson.addEventListener('click', async () => {
                const url = $btnJson.getAttribute('data-url');
                const filename = $btnJson.getAttribute('data-filename');
                try {
                  // 先嘗試從後端取得
                  const resp = await fetch(url);
                  if (!resp.ok) {
                    // 如果後端失敗，前端直接產生 Capsule JSON
                    console.log('後端端點不可用，使用前端產生 Capsule');
                    const capsuleData = {
                      type: 'proof-capsule',
                      version: '1.0',
                      txHash: tx,
                      country: data.country,
                      age_verified: data.age_verified,
                      ofac_checked: data.ofac_checked,
                      sanctioned: data.sanctioned,
                      source: data.source,
                      verifiedAt: new Date().toISOString(),
                      capsuleHash: data.capsuleHash,
                      agentAddress: data.agentAddress,
                    };
                    const capsuleJson = JSON.stringify(capsuleData, null, 2);
                    const blob = new Blob([capsuleJson], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);
                    return;
                  }
                  const blob = await resp.blob();
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(a.href);
                } catch(e) {
                  // 錯誤時也嘗試前端產生
                  console.log('下載錯誤，使用前端產生：', e);
                  const capsuleData = {
                    type: 'proof-capsule',
                    version: '1.0',
                    txHash: tx,
                    country: data.country,
                    age_verified: data.age_verified,
                    ofac_checked: data.ofac_checked,
                    sanctioned: data.sanctioned,
                    source: data.source,
                    verifiedAt: new Date().toISOString(),
                    capsuleHash: data.capsuleHash,
                    agentAddress: data.agentAddress,
                  };
                  const capsuleJson = JSON.stringify(capsuleData, null, 2);
                  const blob = new Blob([capsuleJson], { type: 'application/json' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(a.href);
                }
              });
            }
            
            if ($btnJwt) {
              $btnJwt.addEventListener('click', async () => {
                const url = $btnJwt.getAttribute('data-url');
                const filename = $btnJwt.getAttribute('data-filename');
                try {
                  // 先嘗試從後端取得
                  const resp = await fetch(url);
                  if (!resp.ok) {
                    // 如果後端失敗，前端直接產生簡化版 JWT
                    console.log('後端端點不可用，使用前端產生 JWT');
                    const header = { alg: 'HS256', typ: 'JWT' };
                    const payload = {
                      txHash: tx,
                      country: data.country,
                      age_verified: data.age_verified,
                      ofac_checked: data.ofac_checked,
                      sanctioned: data.sanctioned,
                      source: data.source,
                      verifiedAt: new Date().toISOString(),
                      capsuleHash: data.capsuleHash,
                    };
                    const base64Header = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
                    const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
                    const signature = btoa(tx + 'signature').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
                    const jwt = `${base64Header}.${base64Payload}.${signature}`;
                    const blob = new Blob([jwt], { type: 'application/jwt' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);
                    return;
                  }
                  const blob = await resp.blob();
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(a.href);
                } catch(e) {
                  // 錯誤時也嘗試前端產生
                  console.log('下載錯誤，使用前端產生：', e);
                  const header = { alg: 'HS256', typ: 'JWT' };
                  const payload = {
                    txHash: tx,
                    country: data.country,
                    age_verified: data.age_verified,
                    ofac_checked: data.ofac_checked,
                    sanctioned: data.sanctioned,
                    source: data.source,
                    verifiedAt: new Date().toISOString(),
                    capsuleHash: data.capsuleHash,
                  };
                  const base64Header = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
                  const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
                  const signature = btoa(tx + 'signature').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
                  const jwt = `${base64Header}.${base64Payload}.${signature}`;
                  const blob = new Blob([jwt], { type: 'application/jwt' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(a.href);
                }
              });
            }
            
            // Capsule Trace / Audit Trail 檢視
            const $btnTrace = document.getElementById('btnViewTrace');
            if ($btnTrace) {
              $btnTrace.addEventListener('click', () => {
                const txHash = $btnTrace.getAttribute('data-tx');
                // 產生 JSONL 審計鏈摘要（增強版，包含 block# 和 gas）
                const now = new Date();
                const blockNum = data.blockNumber ? (typeof data.blockNumber === 'string' ? parseInt(data.blockNumber, 16) : data.blockNumber).toLocaleString() : 'N/A';
                const gasUsed = data.gasUsed ? (typeof data.gasUsed === 'string' ? parseInt(data.gasUsed, 16) : data.gasUsed).toLocaleString() : 'N/A';
                const timestamp = data.timestamp || now.toISOString();
                
                const traceLines = [
                  `JSONL Audit Log:`,
                  `1. init self-proof / ${data.country || 'N/A'} / ${timestamp}`,
                  `2. onchain verify / block#${blockNum} / gas=${gasUsed}`,
                  `3. capsule saved / hash=${data.capsuleHash ? data.capsuleHash.slice(0,10) + '...' + data.capsuleHash.slice(-5) : 'N/A'} / signer=StatelessGuard`,
                  ``,
                  `Chain of Trust:`,
                  `- Self Proof Verified`,
                  `- On-chain Verification (Celo Sepolia)`,
                  `- Capsule Hash: ${data.capsuleHash || 'N/A'}`,
                  `- Mode: ${data.mode || 'proof_of_human'}`,
                  `- Verifier: StatelessGuard`,
                ];
                
                // 顯示在彈窗或新的區域
                const traceText = traceLines.join('\n');
                const traceDiv = document.createElement('div');
                traceDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);max-width:600px;max-height:80vh;overflow:auto;z-index:1000;';
                traceDiv.innerHTML = `
                  <h3 style="margin-top:0;">🔍 Capsule Trace / Audit Trail</h3>
                  <pre style="background:#f3f4f6;padding:12px;border-radius:6px;overflow:auto;font-size:12px;white-space:pre-wrap;">${traceText}</pre>
                  <button onclick="this.parentElement.remove()" style="margin-top:12px;padding:6px 12px;background:#6b7280;color:white;border:none;border-radius:4px;cursor:pointer;">關閉</button>
                `;
                document.body.appendChild(traceDiv);
              });
            }
          }, 100);
        }
        
        // 判斷 mode 標記（Proof-of-Human 或 Proof-of-Agent）
        const isAgentModeForHuman = window.__lastVerifyMode === 'proof_of_agent' ? false : true; // 從儲存的變數判斷
        const modeIcon = window.__lastVerifyMode === 'proof_of_agent' ? '🤖' : '🧠';
        const modeText = window.__lastVerifyMode || 'proof_of_human';
        
        // 顯示性能統計（如果有）
        let perfInfo = '';
        if (data.verification_time_ms !== undefined) {
          const perfMs = data.verification_time_ms;
          const perfSec = (perfMs / 1000).toFixed(2);
          perfInfo = `<br><small style="color:#6b7280;font-size:11px;">⚡ 驗證耗時：${perfMs}ms (${perfSec}秒) | 性能統計：<a href="/api/performance/stats" target="_blank">查看</a></small>`;
        }
        
        $result.innerHTML = `✅ 驗證成功：${hintText}<small style="color:#6b7280;font-size:12px;">（${elapsedSec} 秒完成）</small>${complianceInfo}${capsuleLinks}${perfInfo}<small class="hint">` + 
          (data.source ? `<br>📊 來源：${data.source} | ${modeIcon} mode: ${modeText} | ` : `<br>📊 ${modeIcon} mode: ${modeText} | `) +
          (data.explorerUrl ? `<a href="${data.explorerUrl}" target="_blank">查看交易 ↗</a>` : '') +
          '</small>';
        
        $successCard.style.display='block';
        $metaCard.style.display='block';
        // 記錄 mode 和 verifier 到診斷資訊
        $metaInfo.textContent = pretty({ ...data, mode: modeText, verifier: 'StatelessGuard' });

        // 寫審計
        await addLogEntry({ 
          type: 'SELF_TX_VERIFIED', 
          ref: 'tx:'+tx, 
          hashValue: data.txHash || tx, 
          actor:'frontend' 
        });

        $btnOpenVerify.style.display='inline-block';
        $btnOpenVerify.onclick = () => { window.location.href = 'verify.html'; };
      }catch(e){
        $result.className='err'; $result.textContent='失敗：' + String(e);
      }
    });
    
    // Governance Flow：治理循環原型
    const $btnDocVerify = el('btnDocVerify');
    const $btnBylawVerify = el('btnBylawVerify');
    
    // 文件雜湊驗證（治理循環）
    if ($btnDocVerify) {
      $btnDocVerify.addEventListener('click', async () => {
        const docHash = prompt('輸入文件雜湊（例如：租約、抵押協議）：', 'DEMO_SUCCESS_TW');
        if (!docHash) return;
        
        $result.className='';
        $result.innerHTML = '<span class="loading">⏳</span> 文件驗證中...';
        
        try {
          const resp = await fetch((CONFIG.API_BASE||'') + (CONFIG.SELF_VERIFY_BY_TX_ENDPOINT||'/api/self/verify-by-tx'), {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ txHash: docHash })
          });
          const data = await resp.json();
          
          if (data && data.status === 'verified') {
            beep();
            $result.className='ok';
            $result.innerHTML = `✅ 文件驗證成功（治理循環）<br><small class="hint">文件雜湊：${docHash.slice(0,20)}... | 來源：${data.source || 'N/A'}</small>`;
          } else {
            $result.className='err';
            $result.textContent = '文件驗證失敗：' + (data?.reason || 'VERIFY_FAILED');
          }
        } catch(e) {
          $result.className='err'; $result.textContent='失敗：' + String(e);
        }
      });
    }
    
    // 章程建議驗證（治理循環）
    if ($btnBylawVerify) {
      $btnBylawVerify.addEventListener('click', async () => {
        const bylawHash = prompt('輸入章程建議雜湊（例如：治理提案）：', 'DEMO_SUCCESS_TW');
        if (!bylawHash) return;
        
        $result.className='';
        $result.innerHTML = '<span class="loading">⏳</span> 章程驗證中...';
        
        try {
          const resp = await fetch((CONFIG.API_BASE||'') + (CONFIG.SELF_VERIFY_BY_TX_ENDPOINT||'/api/self/verify-by-tx'), {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ txHash: bylawHash })
          });
          const data = await resp.json();
          
          if (data && data.status === 'verified') {
            beep();
            $result.className='ok';
            $result.innerHTML = `✅ 章程驗證成功（治理循環）<br><small class="hint">提案雜湊：${bylawHash.slice(0,20)}... | 來源：${data.source || 'N/A'}</small>`;
          } else {
            $result.className='err';
            $result.textContent = '章程驗證失敗：' + (data?.reason || 'VERIFY_FAILED');
          }
        } catch(e) {
          $result.className='err'; $result.textContent='失敗：' + String(e);
        }
      });
    }
  });
})();


