# 🚀 StatelessGuard 項目交接說明

## 📖 項目概述

**StatelessGuard** 是一個**跨人類與 AI 的模組化信任協議框架**，用於 RWA、DAO、Social、AI Agent 等多領域的信任驗證與審計追蹤。

### 核心概念

- **Capsule Trace（信任鏈追蹤）**：將 Proof、VC、Audit、Onchain 驗證封裝成可追蹤的 capsule，形成完整的信任路徑
- **模組化設計**：Core Flow、Governance、Scenarios、Chain & Audit 四大模組，可插拔式信任引擎
- **JSONL 審計鏈**：所有驗證操作都會生成 JSONL 格式的審計日誌，支援鏈上追溯

---

## 🚀 快速開始

### 前置需求

- Node.js 20+ 
- npm 或 yarn
- Firebase CLI（或使用 npx）
- **Java JDK 21+**（用於 Firestore Emulator，可選）

### 環境變量配置

1. **複製環境變量範例**：
```bash
cd functions
cp env.example .env
```

2. **編輯 `.env` 文件**（至少需要以下配置）：
```bash
# Celo RPC Endpoint
CELO_RPC_ENDPOINT=https://forno.celo-sepolia.celo-testnet.org

# IPFS 配置（可選，但建議設置）
USE_IPFS=true
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here
```

> **注意**：如果沒有設置 Pinata API keys，系統將僅使用 Firestore，IPFS 功能會被禁用。

### 啟動步驟

```bash
# 1. 進入項目目錄
cd RWA-Hackathon-Self-Gate-Handoff-Capsule-feat-self-gate-bootstrap

# 2. 安裝 Firebase Functions 依賴
cd functions
npm install
cd ..

# 3. 啟動 Firebase Emulator（包含 Firestore）
firebase emulators:start --only functions,hosting,firestore --project demo-self-gate

# 或僅啟動 Functions 和 Hosting（不包含 Firestore）
firebase emulators:start --only functions,hosting --project demo-self-gate

# 或使用 npx（無需安裝 Firebase CLI）
npx --yes firebase-tools emulators:start --only functions,hosting,firestore --project demo-self-gate
```

### 訪問地址

- **多場景 Demo**：http://localhost:5500/scenarios.html
- **治理總覽**：http://localhost:5500/governance.html
- **首頁**：http://localhost:5500/index.html

---

## 📂 項目結構

```
├── functions/              # Firebase Cloud Functions（後端 API）
│   ├── agentVerify.ts      # AI Agent 驗證
│   ├── daoAuth.ts          # DAO 授權
│   ├── daoProposalVerify.ts # DAO 提案驗證（DAO → RWA → Audit 鏈）
│   ├── docHashVerify.ts    # 文件雜湊驗證（RWA）
│   ├── socialVerify.ts    # 社交聲譽驗證
│   └── index.ts            # 函數入口
│
├── public/                 # 前端頁面
│   ├── scenarios.html      # 多場景 Demo（主要頁面）
│   ├── governance.html     # 治理總覽 Dashboard
│   ├── js/
│   │   ├── nav.js          # 導航列（兩層架構）
│   │   ├── statusSummary.js # 狀態摘要組件
│   │   └── audit.js        # 審計日誌工具
│   └── [其他功能頁面]
│
└── firebase.json           # Firebase 配置
```

---

## 🎯 核心功能演示

### 1. 多場景 Demo (`scenarios.html`)

**四大驗證場景**：
- 🏠 **RWA 合規入口**：身份驗證 → 文件雜湊驗證
- 🏛️ **DAO 治理**：授權 → 提案驗證（含文件審計）
- 👥 **Social Network**：社交聲譽評分
- 🤖 **AI Agent Ecosystem**：Proof-of-Agent 驗證

**特色功能**：
- 🔍 **Capsule Trace**：點擊「檢視 Capsule Trace」可查看視覺化信任鏈
- 🧩 **信任路徑層**：從 audit_log.jsonl 自動生成信任鏈（最多 5 筆）
- 📊 **性能統計**：驗證請求的響應時間統計
- ✅ **動態狀態**：Block Height、Latency、Last Verified 實時更新

### 2. 治理總覽 (`governance.html`)

**功能**：
- ⚙️ **模組狀態**：Core Flow / Governance / Chain Sync 狀態卡片
- 📊 **治理統計**：章程提案、會議決議、里程碑、驗證次數
- 🔗 **最近 JSONL Hash**：顯示 Record 和 Capsule 連結
- 📜 **審計表格**：提案狀態、會議決議摘要

### 3. 導航系統

**兩層架構**：
- **第一層**：🏗️ Core Flow · ⚖️ Governance · 🎯 Scenarios · 🔗 Chain & Audit
- **第二層**（hover 展開）：顯示各模組的子功能

---

## 🔍 Capsule Trace 說明

### 什麼是 Capsule Trace？

**Capsule Trace** 是「信任驗證鏈條」的可追蹤封裝單位。每一次 Proof 驗證、VC 簽章、或 Audit Log 審核，都會生成一個加密摘要（hash capsule），而 Capsule Trace 就是把這些「封裝後的驗證事件」串成一條完整的信任路徑。

### 信任鏈格式

```
Proof Capsule ✅
    ↓
VC Capsule ✅
    ↓
Audit Capsule ✅
    ↓
Onchain Capsule ✅
```

每個 Capsule 包含：
- `capsule_id`：唯一標識（C-001, C-002...）
- `capsule_hash`：當前步驟的唯一雜湊
- `prev_hash`：前一個 capsule 的 hash（形成鏈）
- `module`：類型（Proof/VC/Audit/Onchain）
- `actor`：簽發者
- `timestamp`：時間戳

### 如何使用

1. 在 `scenarios.html` 測試任一場景
2. 測試完成後，點擊「🔍 檢視 Capsule Trace」按鈕
3. 查看視覺化信任鏈（從 `localStorage` 的 `audit_log_jsonl` 自動生成）
4. **點擊任意 Capsule 節點**可查看完整 JSON 數據

---

## 💡 Demo 展示要點

### 向評審展示時可以這樣說：

1. **「這是一個模組化信任協議框架，而非單一應用」**
   - 展示導航列的兩層架構
   - 說明 Core Flow / Governance / Scenarios / Chain & Audit 的模組化設計

2. **「信任是被一步步推導出來的，不只是被判定」**
   - 點擊「🔍 檢視 Capsule Trace」展示信任鏈
   - 說明每個驗證步驟都生成 capsule，形成可追溯的信任路徑

3. **「這是活的系統，而非展示頁」**
   - 展示右上角的動態狀態：Block Height、Latency、Last Verified
   - 說明狀態會根據實際請求動態更新

4. **「所有跨域驗證 trace 都會最終歸檔於治理層」**
   - 打開 `governance.html` Dashboard
   - 展示模組狀態、治理統計、JSONL Hash 追蹤

5. **「信任政策是版本化的，可治理、可審計」**
   - 展示 `trust_policy_version: 2025.10.1`
   - 展示 `verifier` 和 `policy_module`（可插拔式信任引擎）

---

## 🛠️ 技術棧

- **前端**：HTML + JavaScript（原生，無框架）
- **後端**：Firebase Cloud Functions (TypeScript)
- **儲存**：
  - **前端**：localStorage（audit_log.jsonl，本地備份）
  - **後端**：Firestore（持久化） + IPFS（去中心化備份，可選）
- **部署**：Firebase Hosting + Functions + Firestore + IPFS (Pinata)

---

## 📝 重要文件

- `firebase.json`：Firebase 配置（包含 rewrites 規則）
- `functions/index.ts`：所有 API 端點的導出
- `public/js/nav.js`：導航列邏輯（兩層架構）
- `public/js/statusSummary.js`：狀態摘要組件

---

## ⚠️ 注意事項

1. **端口衝突**：如果 5500 或 4001 端口被佔用，需要：
   - 殺掉佔用端口的進程，或
   - 修改 `firebase.json` 中的端口配置

2. **Firebase CLI**：如果沒有安裝，使用 `npx firebase-tools` 或設置 PATH：
   ```bash
   export PATH="$HOME/.npm-global/bin:$PATH"
   ```

3. **瀏覽器緩存**：如果頁面沒有更新，使用 Cmd+Shift+R（Mac）強制刷新

---

## 🎨 視覺特色

- **統一的設計語言**：所有頁面使用相同的容器、卡片、字體樣式
- **狀態指示器**：右上角顯示 Connected Chain、Block Height、Latency
- **兩層導航**：第一層簡潔，第二層 hover 展開
- **信任鏈視覺化**：垂直鏈條，帶連接線，節點可點擊

---

## 🔗 API 端點列表

### 驗證端點

- `/api/agent/verify` - AI Agent 驗證
- `/api/dao/auth` - DAO 授權
- `/api/dao/proposal-verify` - DAO 提案驗證（含文件審計）
- `/api/doc/hash-verify` - 文件雜湊驗證（RWA）
- `/api/social/verify` - 社交聲譽驗證
- `/api/self/verify-by-tx` - 身份驗證（透過交易 hash）

### 審計端點

- `/api/audit` - **POST**：保存 audit log 到 Firestore 和 IPFS
  - **請求體**：完整的 audit entry JSON（包含 `record_hash` 和 `prev_hash`）
  - **響應**：
    ```json
    {
      "success": true,
      "audit_id": "document_id_from_firestore",
      "ipfs_cid": "bafkreixxx...",
      "ipfs_url": "https://gateway.pinata.cloud/ipfs/...",
      "prev_hash": "0x...",
      "record_hash": "0x..."
    }
    ```

---

## ⚙️ Policy Engine（輕量版）

**StatelessGuard 已實現可配置的 Policy 引擎**，讓不同的場景可以使用不同的信任政策。

### Policy 文件位置

- `policies/rwa-policy.yaml`：RWA 場景的信任政策
- `policies/agent-policy.yaml`：AI Agent 場景的信任政策

### Policy 格式

```yaml
version: 2025-10-31
default_action: deny
rules:
  - id: require-self-proof
    when: proof.source == "self.celo.sepolia" || proof.source == "self.celo.mainnet"
    effect: allow
    description: "必須使用 Self proof 來源"
  
  - id: agent-mode-sandbox-threshold
    when: context == "agent" && sandbox_score >= 0.9
    effect: allow
    description: "Agent 模式需通過 sandbox 安全閾值"
```

### 使用方法

1. **後端**：在驗證函數中調用 `evaluatePolicy(policyName, context)`
2. **前端**：在 API 請求中添加 `policy` 參數（例如：`{ policy: 'agent-policy' }`）

### 特色

- ✅ **無需重新編譯**：修改 YAML 文件即可更新規則
- ✅ **可審計**：返回 `policy_id`、`policy_version`、`matched_rule` 等詳情
- ✅ **模組化**：每個場景可以使用不同的 policy
- ✅ **符合 Self Bounty 精神**：同一筆 Self proof 在不同場景可跑不同 policy

### Demo 展示要點

可以向評審說明：

> 「同一筆 Self proof，透過不同的 policy，就能被授權到 RWA、DAO、Agent 三種場景，這就是我們叫它 StatelessGuard 的原因。」

---

## 📊 後端儲存（Firestore + IPFS）

### 功能說明

**StatelessGuard 已實現後端持久化儲存**，包括：

1. **Firestore**：Firebase NoSQL 數據庫，用於持久化 audit log
2. **IPFS**：去中心化儲存（透過 Pinata API），用於審計追蹤

### Audit Log 流程

1. **前端**：創建 audit entry，計算 `record_hash` 和 `prev_hash`
2. **前端**：先保存到 localStorage（本地備份）
3. **前端**：發送到後端 `/api/audit` 端點
4. **後端**：
   - 上傳到 IPFS（如果已配置 Pinata keys）
   - 保存到 Firestore
   - 返回 `audit_id` 和 `ipfs_cid`
5. **前端**：更新 localStorage 中的記錄，添加 `audit_id` 和 `ipfs_cid`

### Hash Chain Integrity（鏈完整性驗證）

**所有 audit log 都支援鏈完整性驗證**：

- `record_hash`：當前記錄的 SHA-256 hash（排除後端添加的欄位）
- `prev_hash`：指向上一筆記錄的 `record_hash`（形成鏈）

**驗證邏輯**（在「🔄 重播驗證流程」中）：
1. 計算每筆記錄的 `record_hash`，與記錄中的 `record_hash` 比較
2. 檢查 `prev_hash` 是否與上一筆記錄的 `record_hash` 匹配
3. 顯示驗證結果（✅ 通過 / ❌ 失敗）

**排除的欄位**（不參與 hash 計算）：
- `record_hash`（自身）
- `audit_id`
- `ipfs_cid`
- `ipfs_url`
- `audit_saved`
- `audit_error`
- `created_at`
- `source`
- `version`

### IPFS 配置

詳細說明請參考 `functions/IPFS_SETUP.md` 或 `functions/SETUP_PINATA.md`。

**快速設置**：
1. 註冊 [Pinata](https://www.pinata.cloud/) 帳號
2. 創建 API Key 和 Secret Key
3. 更新 `functions/.env`：
   ```bash
   USE_IPFS=true
   PINATA_API_KEY=your_api_key
   PINATA_SECRET_KEY=your_secret_key
   ```

---

## 📚 下一步開發建議

1. ✅ **真實區塊鏈整合**：已完成，`verifyByTx` 已使用真實的 Celo RPC 查詢
2. ✅ **後端儲存**：已完成，支援 Firestore 和 IPFS
3. ✅ **Hash Chain Integrity**：已完成，支援 `prev_hash` 和 `record_hash` 驗證
4. **Policy Engine 增強**：可擴展支援更多運算符、嵌套條件、policy 鏈等
5. **Capsule 視覺化增強**：可添加更多互動效果、動畫等
6. **部署到生產環境**：配置 Firebase 生產環境，設置安全規則

---

## 💬 Demo 時的推薦流程

1. **開場**：展示首頁和導航列，說明「模組化信任協議框架」
2. **核心場景**：進入 `scenarios.html`，選擇「🤖 AI Agent Ecosystem」
3. **測試驗證**：點擊「測試此場景」，展示動態狀態更新
4. **信任鏈**：點擊「🔍 檢視 Capsule Trace」，展示視覺化信任鏈
5. **治理總覽**：切換到 `governance.html`，展示 Dashboard 和統計
6. **技術細節**：可以點擊任意 Capsule 節點查看 JSON，說明可審計性

---

**祝 Demo 順利！** 🚀

---

## 🔧 快速故障排除

### 問題 1：`localhost` 拒絕連線

**原因**：Firebase Emulator 未啟動或端口衝突

**解決方法**：
```bash
# 1. 停止所有 emulator 進程
pkill -f "firebase emulators:start"
pkill -f "java.*firestore"

# 2. 重新啟動
firebase emulators:start --only functions,hosting,firestore --project demo-self-gate
```

### 問題 2：`Function xxx does not exist`

**原因**：Functions 未完全載入

**解決方法**：
1. 等待 emulator 完全啟動（看到 `✔ All emulators ready!`）
2. 檢查 `functions/index.ts` 是否正確導出
3. 檢查 TypeScript 編譯是否有錯誤：
   ```bash
   cd functions
   npm run build
   ```

### 問題 3：鏈完整性驗證失敗（record_hash 不匹配）

**原因**：舊的 localStorage 數據使用了不一致的 hash 計算邏輯

**解決方法**：
1. 打開開發者工具 (F12) → Application → Local Storage
2. 刪除 `audit_log_jsonl` 條目
3. 刷新頁面（Cmd+Shift+R）
4. 重新測試場景

### 問題 4：IPFS 上傳失敗

**原因**：Pinata API keys 未設置或錯誤

**解決方法**：
1. 檢查 `functions/.env` 中的 `PINATA_API_KEY` 和 `PINATA_SECRET_KEY`
2. 確認 keys 沒有引號或空格
3. 確認 Pinata 帳號狀態和額度
4. **注意**：IPFS 失敗不影響 Firestore 儲存，系統仍可正常運作

### 問題 5：Firestore Emulator 無法啟動

**原因**：Java JDK 版本過舊或未安裝

**解決方法**：
1. 安裝 Java JDK 21+（`brew install openjdk@21` on Mac）
2. 或僅啟動 Functions 和 Hosting（不使用 Firestore）：
   ```bash
   firebase emulators:start --only functions,hosting --project demo-self-gate
   ```
   （audit log 仍會保存到 localStorage）

### 問題 6：瀏覽器緩存導致頁面未更新

**解決方法**：
- Mac：`Cmd+Shift+R`（強制刷新）
- Windows/Linux：`Ctrl+Shift+R`
- 或清除瀏覽器緩存

### 問題 7：CORS 錯誤

**原因**：API 請求的 origin 不在允許列表中

**解決方法**：
- 確認從 `http://localhost:5500` 訪問
- 檢查 `functions/.env` 中的 `ALLOWED_ORIGINS`

---

## 📞 獲取幫助

如遇到其他問題：

1. **檢查 Firebase Functions 日誌**：
   - 查看終端中的 emulator 輸出
   - 查找 `ERROR` 或 `❌` 標記

2. **檢查瀏覽器控制台**：
   - 打開開發者工具 (F12) → Console
   - 查看是否有 JavaScript 錯誤

3. **檢查 Network 請求**：
   - 開發者工具 → Network
   - 查看 API 請求的狀態碼和響應

4. **重啟 Emulator**：
   - 停止所有進程並重新啟動通常能解決大部分問題

---

**祝 Demo 順利！** 🚀

