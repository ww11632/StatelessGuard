# Proof-of-Agent 使用指南

## 🎯 功能說明

Proof-of-Agent 是 StatelessGuard 的 AI Agent 信任延伸功能，用於驗證 AI Agent 的身份與合規性。與 Proof-of-Human 並列，展示系統的可組合性與多場景支援。

---

## 🖥️ 前端使用（推薦）

### 步驟 1：打開驗證頁面

打開瀏覽器：
```
http://localhost:5500/self-onchain.html
```

### 步驟 2：選擇驗證模式

在頁面上選擇：
- ✅ **Proof-of-Agent**（AI Agent 驗證）

頁面會自動切換到 Agent 輸入模式。

### 步驟 3：輸入 Agent Address

在「輸入 Agent Address」欄位貼上：
- 格式：`0x` + 40 位 hex 字符（總共 42 字元）
- 範例：`0xAgentAddress1234567890abcdef1234567890abcdef`

或使用 Demo Agent Address：
```
0x1234567890abcdef1234567890abcdef12345678
```

### 步驟 4：送出驗證

1. 按「送出驗證」按鈕
2. 頁面會顯示：`⏳ Agent 驗證中...`
3. 等待驗證完成（通常 < 1 秒）

### 步驟 5：查看結果

驗證成功會顯示：
```
✅ Agent 驗證成功：0xAgentAd...（X 秒完成）
🤖 ai-agent | self.celo.sepolia
```

驗證失敗會顯示錯誤訊息。

---

## 🔧 API 測試（命令列）

### 方法 1：使用 curl

```bash
curl -X POST http://localhost:5500/api/agent/verify \
  -H "Content-Type: application/json" \
  -d '{"agentAddress":"0x1234567890abcdef1234567890abcdef12345678"}'
```

### 方法 2：使用 jq 美化輸出

```bash
curl -X POST http://localhost:5500/api/agent/verify \
  -H "Content-Type: application/json" \
  -d '{"agentAddress":"0x1234567890abcdef1234567890abcdef12345678"}' | jq .
```

### 預期回應（成功）

```json
{
  "status": "verified",
  "context": "agent-verification",
  "agentAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "agentType": "ai-agent",
  "verifiedAt": "2025-01-31T02:00:00.000Z",
  "source": "self.celo.sepolia",
  "capsuleHash": "0x...",
  "note": "Proof-of-Agent：此 Agent 已通過驗證，可用於 AI Agent 生態"
}
```

### 預期回應（失敗）

```json
{
  "status": "invalid",
  "reason": "INVALID_AGENT_ADDRESS",
  "context": "agent-verification"
}
```

---

## 📋 測試案例

### 案例 1：有效的 Agent Address

```bash
curl -X POST http://localhost:5500/api/agent/verify \
  -H "Content-Type: application/json" \
  -d '{"agentAddress":"0x1234567890abcdef1234567890abcdef12345678"}'
```

預期：✅ `status: "verified"`

### 案例 2：無效的 Agent Address（格式錯誤）

```bash
curl -X POST http://localhost:5500/api/agent/verify \
  -H "Content-Type: application/json" \
  -d '{"agentAddress":"invalid"}'
```

預期：❌ `status: "invalid"`, `reason: "INVALID_AGENT_ADDRESS"`

### 案例 3：缺少 Agent Address

```bash
curl -X POST http://localhost:5500/api/agent/verify \
  -H "Content-Type: application/json" \
  -d '{}'
```

預期：❌ `error: "MISSING_AGENT_ADDRESS"`

---

## 🔍 驗證流程

### 後端驗證邏輯

1. **檢查 Agent Address 格式**
   - 必須以 `0x` 開頭
   - 總長度 42 字元（`0x` + 40 hex）
   - 格式：`/^0x[0-9a-fA-F]{40}$/`

2. **產生驗證結果**
   - 標記為 `agentType: "ai-agent"`
   - 產生 `capsuleHash`（可用於上鏈審計）
   - 記錄 `verifiedAt` 時間戳

3. **回傳結果**
   - 成功：`status: "verified"` + Agent 資訊
   - 失敗：`status: "invalid"` + 錯誤原因

---

## 🎨 前端 UI 說明

### 模式切換

- **Proof-of-Human**：人類身份驗證（預設）
- **Proof-of-Agent**：AI Agent 驗證（切換後顯示 Agent Address 輸入欄位）

### 顯示內容

驗證成功時顯示：
- ✅ Agent 驗證成功訊息
- 🤖 Agent 類型（ai-agent）
- 📊 來源（self.celo.sepolia）
- ⏱️ 驗證時間（X 秒完成）

---

## 💡 使用場景

### 場景 1：AI Agent 生態系統

- AI Agent 需要證明身份與合規性
- 使用 Proof-of-Agent 驗證 Agent 地址
- 驗證通過後，Agent 可參與合規的 DeFi 或 RWA 操作

### 場景 2：DAO 治理

- AI Agent 參與 DAO 投票前需要驗證身份
- 使用 `/api/agent/verify` 端點驗證
- 驗證通過後，Agent 可執行投票操作

### 場景 3：多場景展示（簡報 Demo）

- 展示系統的可組合性
- 同時支援 Proof-of-Human 和 Proof-of-Agent
- 呼應簡報中的「AI Agent Ecosystem」部分

---

## 🔗 相關端點

### Agent 驗證端點

- `POST /api/agent/verify` - AI Agent 驗證

### 其他相關端點

- `POST /api/self/verify` - SDK 驗證（Proof-of-Human）
- `POST /api/self/verify-by-tx` - txHash 驗證（Proof-of-Human）
- `POST /api/dao/verify` - DAO 治理場景驗證

---

## ⚙️ 技術細節

### 後端實作

- 檔案：`functions/agentVerify.ts`
- 驗證邏輯：格式檢查 + Mock 驗證
- 回應格式：標準化 JSON

### 前端實作

- 檔案：`public/js/self-onchain.js`
- UI 切換：Radio button 模式選擇
- API 呼叫：`/api/agent/verify`

---

## 🧪 快速測試腳本

```bash
#!/bin/bash
# 快速測試 Proof-of-Agent

echo "🧪 測試 Proof-of-Agent 驗證"
echo ""

# 測試 1：有效 Agent Address
echo "測試 1：有效 Agent Address"
curl -s -X POST http://localhost:5500/api/agent/verify \
  -H "Content-Type: application/json" \
  -d '{"agentAddress":"0xAgentAddress1234567890abcdef1234567890abcdef"}' | jq .
echo ""

# 測試 2：格式錯誤
echo "測試 2：格式錯誤"
curl -s -X POST http://localhost:5500/api/agent/verify \
  -H "Content-Type: application/json" \
  -d '{"agentAddress":"invalid"}' | jq .
echo ""

# 測試 3：缺少欄位
echo "測試 3：缺少欄位"
curl -s -X POST http://localhost:5500/api/agent/verify \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

---

## 📝 注意事項

1. **Agent Address 格式**
   - 必須是有效的 Ethereum 地址格式（42 字元）
   - 僅支援 `0x` 開頭的 hex 字符串

2. **驗證結果**
   - 目前是 Mock 驗證（所有格式正確的地址都會通過）
   - 未來可整合真實的 Agent 註冊表或信任清單

3. **前端切換**
   - 切換模式時，輸入欄位會自動隱藏/顯示
   - Human 模式：顯示 txHash 輸入
   - Agent 模式：顯示 Agent Address 輸入

---

## ✅ 檢查清單

使用前確認：
- [ ] Emulator 已啟動（`npm run serve`）
- [ ] Agent 驗證端點可用（`/api/agent/verify`）
- [ ] Agent Address 格式正確（42 字元，`0x` 開頭）

測試步驟：
- [ ] 前端模式切換正常
- [ ] Agent Address 輸入欄位顯示
- [ ] 驗證成功顯示結果
- [ ] API 測試回應正確

---

## 🎯 下一步

1. **整合真實 Agent 註冊表**
   - 從外部 API 載入可信 Agent 列表
   - 檢查 Agent Address 是否在註冊表中

2. **擴充 Agent 資訊**
   - Agent 類型（LLM Agent, Trading Bot, etc.）
   - Agent 權限等級
   - Agent 歷史記錄

3. **治理整合**
   - 將 Agent 驗證整合到 DAO 治理流程
   - 支援 Agent 投票與提案

