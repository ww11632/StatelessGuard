//js/nav.js（協議控制台導覽｜兩層架構）
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;

  // 找到標題所在的容器（通常是 container 或第一個 h1 的父元素）
  const findTitleContainer = () => {
    const container = document.querySelector('.container');
    if (container) {
      const h1 = container.querySelector('h1');
      if (h1) {
        // 找到 h1 後的第一個兄弟元素或 h1 的父元素
        const titleWrapper = h1.parentElement;
        if (titleWrapper) {
          return { container: container, insertAfter: titleWrapper };
        }
      }
    }
    // 如果找不到，就插入到 nav 原本的位置之前（作為後備方案）
    return { container: nav.parentElement, insertAfter: nav.previousElementSibling || null };
  };

  const ui = [];
  
  // ===== Tagline =====
  ui.push('<div style="padding:8px 0; margin-bottom:12px; border-bottom:1px solid #e5e7eb;">');
  ui.push('<p style="margin:0; font-size:11px; color:#888; font-weight:400; letter-spacing:0.2px;">StatelessGuard · 跨人類與 AI 的模組化信任協議</p>');
  ui.push('</div>');
  
  // ===== 導航列（兩層結構）=====
  ui.push('<nav style="padding:12px 0; border-bottom:2px solid #e5e7eb; margin-bottom:16px;">');
  
  // ===== 第一層：主要模組 =====
  ui.push('<div style="display:flex; gap:16px; flex-wrap:wrap; align-items:center; margin-bottom:8px;">');
  ui.push('<span style="font-weight:700; color:#1f2937; font-size:14px;">🏗️ Core Flow</span>');
  ui.push('<span style="opacity:.3; margin:0 4px;">·</span>');
  ui.push('<span style="font-weight:700; color:#1f2937; font-size:14px;">⚖️ Governance</span>');
  ui.push('<span style="opacity:.3; margin:0 4px;">·</span>');
  ui.push('<span style="font-weight:700; color:#1f2937; font-size:14px;">🎯 Scenarios</span>');
  ui.push('<span style="opacity:.3; margin:0 4px;">·</span>');
  ui.push('<span style="font-weight:700; color:#1f2937; font-size:14px;">🔗 Chain & Audit</span>');
  ui.push('</div>');
  
  // ===== 第二層：子模組（hover 展開）=====
  ui.push('<div id="navSubmodules" style="display:none; padding:8px 0; gap:12px; flex-wrap:wrap; align-items:baseline; font-size:12px; color:#6b7280; border-top:1px solid #f3f4f6;">');
  
  // Core Flow 子模組
  ui.push('<div class="nav-group" data-module="core" style="display:inline-flex; align-items:center; gap:8px; margin-right:16px;">');
  ui.push('<span style="font-weight:600; color:#1f2937;">Core Flow →</span>');
  ui.push('<a href="self-gate.html" style="font-size:12px; color:#6b7280; text-decoration:none;">Gate</a>');
  ui.push('<span style="opacity:.3;">·</span>');
  ui.push('<a href="members.html" style="font-size:12px; color:#6b7280; text-decoration:none;">VC</a>');
  ui.push('<span style="opacity:.3;">·</span>');
  ui.push('<a href="rent.html" style="font-size:12px; color:#6b7280; text-decoration:none;">Contract</a>');
  ui.push('<span style="opacity:.3;">·</span>');
  ui.push('<a href="payout_verify.html" style="font-size:12px; color:#6b7280; text-decoration:none;">Pre-Payout</a>');
  ui.push('<span style="opacity:.3;">·</span>');
  ui.push('<a href="verify.html" style="font-size:12px; color:#6b7280; text-decoration:none;">Logs</a>');
  ui.push('</div>');
  
  // Governance 子模組
  ui.push('<div class="nav-group" data-module="governance" style="display:inline-flex; align-items:center; gap:8px; margin-right:16px;">');
  ui.push('<span style="font-weight:600; color:#1f2937;">Governance →</span>');
  ui.push('<a href="governance.html" style="font-size:12px; color:#6b7280; text-decoration:none; font-weight:600;">Dashboard</a>');
  ui.push('<span style="opacity:.3;">·</span>');
  ui.push('<a href="anchor.html" style="font-size:12px; color:#6b7280; text-decoration:none;">Hash</a>');
  ui.push('<span style="opacity:.3;">·</span>');
  ui.push('<a href="bylaws.html" style="font-size:12px; color:#6b7280; text-decoration:none;">Proposal</a>');
  ui.push('<span style="opacity:.3;">·</span>');
  ui.push('<a href="meetings.html" style="font-size:12px; color:#6b7280; text-decoration:none;">Meeting</a>');
  ui.push('<span style="opacity:.3;">·</span>');
  ui.push('<a href="milestones.html" style="font-size:12px; color:#6b7280; text-decoration:none;">Milestone</a>');
  ui.push('</div>');
  
  // Scenarios 子模組
  ui.push('<div class="nav-group" data-module="scenarios" style="display:inline-flex; align-items:center; gap:8px; margin-right:16px;">');
  ui.push('<span style="font-weight:600; color:#1f2937;">Scenarios →</span>');
  ui.push('<a href="scenarios.html" style="font-size:12px; color:#6b7280; text-decoration:none; font-weight:600;">Multi-Domain (RWA / DAO / Social / Agent)</a>');
  ui.push('</div>');
  
  // Chain & Audit 子模組
  ui.push('<div class="nav-group" data-module="chain" style="display:inline-flex; align-items:center; gap:8px;">');
  ui.push('<span style="font-weight:600; color:#1f2937;">Chain & Audit →</span>');
  ui.push('<a href="self-onchain.html" style="font-size:12px; color:#6b7280; text-decoration:none;">Onchain Verify</a>');
  ui.push('<span style="opacity:.3;">·</span>');
  ui.push('<a href="verify.html" style="font-size:12px; color:#6b7280; text-decoration:none;">JSONL Logs</a>');
  ui.push('</div>');
  
  ui.push('</div>');
  ui.push('</nav>');
  
  // 添加樣式和交互邏輯
  const style = document.createElement('style');
  style.textContent = `
    #nav nav { position: relative; }
    #navSubmodules { transition: all 0.3s ease; }
    #navSubmodules.show { display: flex !important; }
    nav:hover #navSubmodules { display: flex !important; }
    .nav-group a:hover { color: #2563eb !important; text-decoration: underline; }
  `;
  document.head.appendChild(style);
  
  nav.innerHTML = ui.join('');
  
  // 移動導航列到標題下方
  setTimeout(() => {
    const container = document.querySelector('.container');
    if (!container) return;
    
    const h1 = container.querySelector('h1');
    if (!h1) return;
    
    // 找到包含 h1 的 div（通常是標題和副標題的包裝）
    let titleWrapper = h1.parentElement;
    
    // 如果 h1 的父元素不是 container，嘗試找到合適的插入點
    if (titleWrapper && titleWrapper !== container) {
      // 檢查 nav 是否已經在 titleWrapper 之後
      const titleWrapperNextSibling = titleWrapper.nextElementSibling;
      if (titleWrapperNextSibling !== nav) {
        // 如果 nav 還在其他地方，移動它到 titleWrapper 之後
        if (nav.parentElement) {
          container.insertBefore(nav, titleWrapperNextSibling);
        }
      }
    } else {
      // 如果 h1 直接在 container 下，將 nav 插入到 h1 之後
      const h1NextSibling = h1.nextElementSibling;
      if (h1NextSibling !== nav) {
        if (nav.parentElement) {
          container.insertBefore(nav, h1NextSibling);
        }
      }
    }
  }, 0);
  
  // 添加 hover 顯示邏輯
  const navEl = nav.querySelector('nav');
  const submodulesEl = nav.querySelector('#navSubmodules');
  if (navEl && submodulesEl) {
    navEl.addEventListener('mouseenter', () => {
      submodulesEl.classList.add('show');
    });
    navEl.addEventListener('mouseleave', () => {
      submodulesEl.classList.remove('show');
    });
  }

  // 當前頁面高亮
  const here = location.pathname.split('/').pop();
  nav.querySelectorAll('a').forEach(a => {
    const key = a.getAttribute('href');
    if (key && key.endsWith(here)) {
      a.style.fontWeight = '700';
      a.style.textDecoration = 'underline';
      a.style.color = '#2563eb';
    }
  });

})();