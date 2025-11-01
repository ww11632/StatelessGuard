# Pinata API Keys 設置指南

## 🔑 獲取 Pinata API Keys

### 步驟 1：註冊 Pinata 帳號

1. 訪問 https://www.pinata.cloud/
2. 點擊 "Sign Up" 註冊（免費帳號即可）
3. 完成郵箱驗證

### 步驟 2：創建 API Key

1. 登入後，點擊右上角頭像 → **"API Keys"**
2. 點擊 **"New Key"**
3. 設置：
   - **Key Name**: `StatelessGuard-Audit`（任意名稱）
   - **Admin**: 勾選（允許 pin 文件）
   - **Pin Policies**: 可選（限制可 pin 的 CID）
4. 點擊 **"Create Key"**
5. 重要：**立即複製並保存**：
   - `pinata_api_key`（類似：`abc123def456...`）
   - `pinata_secret_api_key`（類似：`xyz789...`）
   - ⚠️ Secret Key **只顯示一次**，之後無法再查看

## 📝 配置到項目

### 方法 A：手動編輯（推薦）

```bash
# 打開 .env 文件
code functions/.env
# 或
nano functions/.env
```

在文件末尾添加或修改：

```bash
USE_IPFS=true
PINATA_API_KEY=你的_api_key_這裡
PINATA_SECRET_KEY=你的_secret_key_這裡
```

### 方法 B：使用命令行（如果已有 keys）

```bash
cd functions

# 追加到 .env（替換 YOUR_API_KEY 和 YOUR_SECRET_KEY）
echo "" >> .env
echo "USE_IPFS=true" >> .env
echo "PINATA_API_KEY=YOUR_API_KEY" >> .env
echo "PINATA_SECRET_KEY=YOUR_SECRET_KEY" >> .env
```

## ✅ 驗證配置

1. 檢查 `.env` 文件：
   ```bash
   cat functions/.env | grep PINATA
   ```

2. 重啟 Firebase Emulator：
   ```bash
   # 停止舊的
   pkill -f "firebase emulators:start"
   
   # 重新啟動
   cd functions
   npm run serve
   ```

3. 測試驗證場景：
   - 打開 `http://localhost:5500/scenarios.html`
   - 選擇任意場景並點擊「測試此場景」
   - 如果配置成功，應該能看到：
     ```
     ✅ 已保存到後端儲存
     Firestore ID: abc123...
     🌐 IPFS CID: QmXXXX... 🔗 查看
     ```

## 🔒 安全注意事項

- ⚠️ **`.env` 文件已在 `.gitignore` 中，不會被提交到 Git**
- ⚠️ **不要在公開場合分享你的 API keys**
- ⚠️ **如果 keys 洩露，立即在 Pinata 後台撤銷並重新創建**

## 🐛 故障排除

### IPFS 上傳失敗，只顯示 Firestore ID

檢查：
1. `USE_IPFS=true` 是否設定正確
2. API keys 是否有空格或引號（不需要引號）
3. Firebase Functions 日誌是否有錯誤：
   ```bash
   # 查看 emulator 輸出中的錯誤訊息
   ```

### 編譯錯誤

確保已安裝依賴：
```bash
cd functions
npm install
npm run build
```

## 📞 獲取幫助

如果遇到問題：
1. 檢查 Pinata 後台的 API Keys 狀態
2. 確認免費額度是否用完
3. 查看 Firebase Functions 日誌中的錯誤訊息




