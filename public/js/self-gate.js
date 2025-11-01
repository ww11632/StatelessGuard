// public/js/self-gate.js
// 功能 X：教練模式 UI + 診斷顯示 + 單表單化（不改你原本審計鏈）
(function () {
  function beep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.1);
  }
  function el(id){ return document.getElementById(id); }
  function pretty(x){ try { return JSON.stringify(x, null, 2); } catch { return String(x); } }

  document.addEventListener('DOMContentLoaded', () => {
    const $txt = el('proofInput');
    const $btnDemo = el('btnDemo');
    const $btnVerify = el('btnVerify');
    const $btnOpenVerify = el('btnOpenVerify');
    const $result = el('result');
    const $metaCard = el('metaCard');
    const $metaInfo = el('metaInfo');
    if (!$txt || !$btnVerify || !$result) return;

    // 1) 一鍵示例：讓你不用找資料就能演
    $btnDemo.addEventListener('click', () => {
      $txt.value = JSON.stringify({ proofData:{ age: 20 }, requirements:['age>=18'] }, null, 2);
      $result.className=''; $result.textContent = '';
      $metaCard.style.display='none'; $btnOpenVerify.style.display='none';
    });

    // 2) 提交驗證
    $btnVerify.addEventListener('click', async () => {
      $result.className=''; $result.textContent = '';
      $metaCard.style.display='none'; $btnOpenVerify.style.display='none';

      const raw = $txt.value.trim();
      if (!raw) { alert('請先貼上 Proof JSON'); return; }

      let parsed;
      try { parsed = JSON.parse(raw); }
      catch { alert('JSON 格式錯誤'); return; }

      // 組合 payload（向後相容）
      const payload = {
        proofData: parsed.proofData || parsed,
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : []
      };

      try {
        const resp = await fetch((CONFIG.API_BASE || '') + (CONFIG.VERIFY_ENDPOINT || '/api/verifyProof'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': 'demo-' + Date.now().toString(16) },
          body: JSON.stringify(payload),
        });
        const data = await resp.json();

        if (!data || !data.ok) {
          $result.className='err';
          $result.textContent = '失敗：' + (data && (data.message || data.error) || '驗證未通過');
          return;
        }

        // 嗶一聲＋顯示綠字
        beep();
        $result.className='ok';
        $result.textContent = '成功：已驗證並寫入日誌';

        // 顯示診斷（rid/stableKey/meta）
        $metaCard.style.display='block';
        $metaInfo.textContent = pretty({
          rid: data.rid,
          proofHash: data.proofHash,
          stableKey: data.stableKey,
          meta: data.meta
        });

        // 日誌兩筆：條款可選；Proof 一定寫
        const termsText = 'RWA Demo Terms v1';
        const termsHash = await computeHash(termsText);
        await addLogEntry({ type: 'TERMS_HASHED', ref: 'terms:v1', hashValue: termsHash });

        // 用後端切片做 ref，讓人一眼看懂這筆對應到哪個 proof
        await addLogEntry({ type: 'PROOF_VERIFIED', ref: 'proof:' + data.proofHash, hashValue: data.stableKey });

        // 引導：開啟驗鍊器
        $btnOpenVerify.style.display='inline-block';
        $btnOpenVerify.onclick = () => { window.location.href = 'verify.html'; };

      } catch (e) {
        $result.className='err';
        $result.textContent = '失敗：' + String(e);
      }
    });
  });
})();
