# IPFS 整合說明

## 📋 功能概述

`/api/audit` 端點現在支援**雙重儲存**：
1. **Firestore**（主要儲存，始終啟用）
2. **IPFS**（可選，使用 Pinata API）

當 IPFS 啟用時，每次 audit log 都會同時保存到 Firestore 和 IPFS，返回 `ipfs_cid` 和 `ipfs_url`。

## 🚀 快速設置

### 1. 獲取 Pinata API Keys

1. 訪問 [Pinata](https://www.pinata.cloud/)
2. 註冊帳號（免費額度足夠 demo 使用）
3. 進入 API Keys 頁面
4. 創建新的 API Key，獲得：
   - `PINATA_API_KEY`
   - `PINATA_SECRET_KEY`

### 2. 配置環境變數

編輯 `functions/.env`：

```bash
# 啟用 IPFS（設為 true）
USE_IPFS=true

# Pinata API 憑證
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here
```

### 3. 重啟 Firebase Emulator

```bash
# 停止舊的 emulator
pkill -f "firebase emulators:start"

# 重新啟動（會載入新的 .env）
cd functions
npm run serve
```

## ✅ 驗證是否生效

測試一個驗證場景，在測試結果中應該看到：

```
✅ 已保存到後端儲存
Firestore ID: abc123...
🌐 IPFS CID: QmXXXX... 🔗 查看
```

如果沒有顯示 IPFS CID，檢查：
- `USE_IPFS=true` 是否設定正確
- Pinata API keys 是否正確
- Firebase Functions 日誌是否有錯誤訊息

## 🔧 工作原理

1. **前端發送 audit log** → `POST /api/audit`
2. **後端處理**：
   - 如果 `USE_IPFS=true` 且 keys 已設定，先上傳到 IPFS（獲取 CID）
   - 無論 IPFS 是否成功，都會保存到 Firestore
   - 返回 `audit_id` 和 `ipfs_cid`（如果成功）
3. **前端顯示**：
   - Firestore ID（始終顯示）
   - IPFS CID（如果有）
   - IPFS URL（可點擊查看）

## 💡 Demo 展示要點

可以向評審說明：

> 「我們的 audit log 同時保存到 Firestore（用於快速查詢）和 IPFS（用於去中心化存檔）。每個 log 都有一個 IPFS CID，任何人都可以通過 CID 驗證 log 的完整性，這符合 StatelessGuard 的去中心化信任理念。」

## ⚠️ 故障排除

### IPFS 上傳失敗，但 Firestore 成功

這是正常的後備機制。檢查：
- Pinata API keys 是否正確
- 網路連線是否正常
- Pinata 免費額度是否用完

### 編譯錯誤

如果遇到 TypeScript 錯誤，確保已安裝：
```bash
cd functions
npm install form-data node-fetch@2 @types/node-fetch@2
```

## 📝 環境變數參考

完整配置（`functions/.env`）：

```bash
# IPFS 配置（使用 Pinata）
USE_IPFS=true                    # 啟用 IPFS（設為 false 或留空則僅使用 Firestore）
PINATA_API_KEY=                  # Pinata API Key（必填，如果 USE_IPFS=true）
PINATA_SECRET_KEY=               # Pinata Secret Key（必填，如果 USE_IPFS=true）
```

如果沒有設定 Pinata keys，系統會自動降級為僅使用 Firestore（不影響功能）。




