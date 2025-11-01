# 取得 Sepolia txHash 完整步驟指南

## 🎯 最簡單方法：Self Playground

### 步驟 1：打開 Self Playground

**Staging 環境（推薦測試用）：**
👉 https://playground.staging.self.xyz/

### 步驟 2：選擇網路

在頁面上選擇或確認：
- ✅ **Celo Sepolia**（測試網）

### 步驟 3：開始驗證

1. 頁面會顯示一個 **QR Code**
2. 用手機打開 **Self App**（iOS/Android）
3. 在 Self App 中掃描這個 QR Code
4. 在手機上完成身份驗證流程（可能需要護照或身份證）

### 步驟 4：取得 txHash

驗證完成後，回到 Playground 網頁：
- 頁面會顯示：**✅ Verification successful**
- 會顯示：**📋 Transaction Hash: 0x...**
- **複製這個 txHash**（格式：`0x` + 64 位 hex）

### 步驟 5：測試

複製 txHash 後，執行測試：

```bash
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0x你從Playground複製的txHash"}' | jq .
```

---

## 🔍 替代方法：從 Blockscout 找

### 步驟 1：打開 Blockscout

👉 https://celo-sepolia.blockscout.com/

### 步驟 2：瀏覽交易列表

1. 在首頁找到 **「Latest Transactions」** 區塊
2. 或點擊頂部導覽的 **「Transactions」**

### 步驟 3：選擇交易

- 點擊列表中任意一筆交易（點擊 txHash 或整行）

### 步驟 4：複製 txHash

1. 進入交易詳情頁
2. 在頁面頂部會顯示：
   ```
   Transaction Hash
   0x8412a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2
   ```
3. **複製完整的 txHash**

### 步驟 5：測試

```bash
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0x從Blockscout複製的txHash"}' | jq .
```

---

## 🧪 快速測試（Demo）

如果只是想測試 API 功能，可以用內建 demo：

```bash
# Demo 成功案例（TW）
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"DEMO_SUCCESS_TW"}' | jq .

# Demo 成功案例（US）
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"DEMO_SUCCESS_US"}' | jq .
```

---

## ✅ 驗證 txHash 格式

正確的 txHash 格式：
- ✅ 以 `0x` 開頭
- ✅ 總長度 66 字元（`0x` + 64 hex）
- ✅ 例如：`0x8412a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2`

錯誤範例：
- ❌ `0x123`（太短）
- ❌ `8412...`（缺少 `0x` 前綴）
- ❌ `0xGHIJ...`（包含非 hex 字符）

---

## 📋 測試檢查清單

- [ ] ✅ `.env` 已設定（`CELO_RPC_ENDPOINT` 指向 Sepolia）
- [ ] ✅ Emulator 已啟動並載入環境變數
- [ ] ✅ Health check 成功（`/api/self/health` 回傳正常）
- [ ] ✅ 已取得 Sepolia txHash（任一方法）
- [ ] ✅ 測試 API 成功（回傳 `status: "verified"`）
- [ ] ✅ 前端顯示正常（`self-onchain.html`）

---

## ⚠️ 常見問題

### Q: 為什麼回傳 `RECEIPT_NOT_FOUND`？

**可能原因：**
1. txHash 不在 Sepolia（可能在 mainnet）
2. 交易尚未被確認（等待幾秒後重試）
3. txHash 輸入錯誤（檢查格式）

**解決方法：**
- 確認 txHash 在 Sepolia：打開 `https://celo-sepolia.blockscout.com/tx/0x...`
- 如果能找到 → 交易存在，可能是 RPC 問題
- 如果找不到 → 交易可能在 mainnet 或其他網路

### Q: 如何確認交易在 Sepolia？

**檢查方法：**
1. 打開 Sepolia Explorer：https://celo-sepolia.blockscout.com/tx/0x你的txHash
2. 如果能找到交易詳情 → ✅ 在 Sepolia
3. 如果找不到 → ❌ 可能在 mainnet（用 https://celoscan.io/tx/0x... 檢查）

### Q: Self Playground 打不開？

**替代方案：**
1. 使用 Blockscout 找範例交易
2. 或使用 demo txHash 測試流程

---

## 🎯 推薦流程

**第一次測試建議：**
1. ✅ 用 `DEMO_SUCCESS_TW` 測試（確認 API 正常）
2. ✅ 從 Self Playground 取得真實 txHash
3. ✅ 用真實 txHash 測試完整流程

這樣可以確保：
- API 功能正常
- 真實鏈上查詢正常
- 前端顯示正常

---

## 📞 需要幫助？

如果遇到問題：
1. 檢查 `.env` 設定
2. 確認 emulator 已重啟並載入環境變數
3. 檢查 RPC 連線：`curl http://localhost:5500/api/self/health`
4. 確認 txHash 格式正確（66 字元，以 `0x` 開頭）




