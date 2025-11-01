# Self API 測試指南

## 🚀 快速開始

### 1. 環境變數設定

複製 `env.example` 並設定：

```bash
cd functions
cp env.example .env
# 編輯 .env 填入實際值（CELO_RPC_ENDPOINT, SELF_ENV, etc.）
```

### 2. denylist 設定

複製 `denylist.example.json` 並填入雜湊值：

```bash
cp denylist.example.json denylist.json
# 編輯 denylist.json 填入 sha256(subject/address/did) 雜湊值
```

**產生雜湊範例：**
```javascript
const crypto = require('crypto');
const subject = 'did:web:example.com:user123'; // 或 address
const hash = crypto.createHash('sha256').update(subject).digest('hex');
// 將 hash 加入 denylist.json 陣列
```

## API 端點

### 1. GET /api/self/health

健康檢查，回傳鏈狀態。

**請求：**
```bash
curl -X GET http://localhost:5500/api/self/health
```

**回應（成功）：**
```json
{
  "ok": true,
  "chainId": "44787",
  "blockNumber": "0x1234...",
  "ts": "2025-10-30T12:00:00.000Z",
  "network": "celo-sepolia"
}
```

**回應（失敗）：**
```json
{
  "ok": false,
  "chainId": "celo",
  "ts": "2025-10-30T12:00:00.000Z",
  "network": "celo-sepolia",
  "error": "MISSING_CELO_RPC_ENDPOINT"
}
```

---

### 2. POST /api/self/verify

驗證 Self proof 或 txHash。

**請求（帶 proof）：**
```bash
curl -X POST http://localhost:5500/api/self/verify \
  -H "Content-Type: application/json" \
  -d '{
    "proof": "<JWT 或 Verifiable Credential>"
  }'
```

**請求（帶 txHash）：**
```bash
curl -X POST http://localhost:5500/api/self/verify \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0x8412...804aa"
  }'
```

**回應（成功）：**
```json
{
  "status": "verified",
  "txHash": "0x8412...804aa",
  "explorerUrl": "https://celo-sepolia.blockscout.com/tx/0x8412...804aa",
  "country": "TW",
  "age_verified": true,
  "ofac_checked": true,
  "sanctioned": false,
  "source": "self.celo.sepolia",
  "subject": "<sha256雜湊>",
  "rid": "<請求ID>"
}
```

**回應（失敗）：**
```json
{
  "status": "invalid",
  "reason": "RECEIPT_NOT_FOUND",
  "rid": "<請求ID>"
}
```

**回應（denylist）：**
```json
{
  "status": "invalid",
  "reason": "DENYLISTED_USER",
  "subject": "<sha256雜湊>",
  "rid": "<請求ID>"
}
```

---

### 3. POST /api/self/verify-by-tx

以 txHash 驗證（專用端點，支援 demo txHash）。

**請求：**
```bash
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "DEMO_SUCCESS_TW"
  }'
```

**Demo txHash：**
- `DEMO_SUCCESS_TW`：模擬成功（TW、已驗證）
- `DEMO_SUCCESS_US`：模擬成功（US、已驗證）
- `DEMO_FAIL_NOT_FOUND`：模擬查無交易
- `DEMO_FAIL_DENYLISTED`：模擬封鎖名單

**自訂 demo txHash（固定 0x... 哈希）：**

1) 建立 `functions/demoTxMap.json`（可由 `demoTxMap.example.json` 複製）

```bash
cd functions
cp demoTxMap.example.json demoTxMap.json
# 編輯 demoTxMap.json，將 txHash 改為你準備好的 0x... 並填入屬性
```

2) 之後只要貼上該 `txHash` 即可看到 country/age_verified/OFAC/explorerUrl。

**回應格式：**
```json
{
  "status": "verified",
  "txHash": "0x...",
  "country": "TW",
  "age_verified": true,
  "ofac_checked": true,
  "sanctioned": false,
  "source": "self.celo.sepolia",
  "explorerUrl": "https://celo-sepolia.blockscout.com/tx/0x..."
}
```

---

## 錯誤碼說明

| 錯誤碼 | 說明 | HTTP 狀態碼 |
|--------|------|------------|
| `MISSING_PROOF_OR_TX` | 缺少 proof 或 txHash | 400 |
| `PAYLOAD_TOO_LARGE` | payload 過大 | 413 |
| `RATE_LIMIT_EXCEEDED` | 請求過於頻繁 | 429 |
| `MISSING_SELF_SDK` | Self SDK 未安裝 | 200 (status: invalid) |
| `RECEIPT_NOT_FOUND` | 鏈上找不到交易 | 200 (status: invalid) |
| `TX_FAILED` | 交易失敗 | 200 (status: invalid) |
| `DENYLISTED_USER` | 用戶在封鎖名單 | 200 (status: invalid) |

---

## 限流設定

- 預設：每 IP 每分鐘 30 次請求
- 超過限流回傳 `429 RATE_LIMIT_EXCEEDED`

---

## denylist 使用方式

`functions/denylist.json` 為陣列，內容為 `sha256(subject/address/did)` 的雜湊值（64 位 hex）。

**配置方式：**
```bash
# 1. 複製範例檔案
cp denylist.example.json denylist.json

# 2. 編輯 denylist.json，填入雜湊值
# 範例格式：
[
  "a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5",
  "hash_userA",
  "hash_userB"
]
```

**如何產生雜湊：**
```javascript
const crypto = require('crypto');
const subject = 'did:web:example.com:user123'; // 或 address, did
const hash = crypto.createHash('sha256').update(subject).digest('hex');
// 將 hash 加入 denylist.json 陣列
```

**設計原則：**
- ✅ 不留明文識別（僅存雜湊）
- ✅ 可替換資料來源（可從外部 API 或其他來源載入）
- ✅ 易於維護（JSON 格式）

---

## 📋 Postman / curl 完整範例

### 本地測試（Emulator）

```bash
# 1. 健康檢查
curl -X GET http://localhost:5500/api/self/health

# 2. 驗證（Demo Success）
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash": "DEMO_SUCCESS_TW"}'

# 3. 驗證（Demo Fail）
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash": "DEMO_FAIL_NOT_FOUND"}'

# 4. 驗證（帶 proof）
curl -X POST http://localhost:5500/api/self/verify \
  -H "Content-Type: application/json" \
  -d '{"proof": "<JWT 或 Verifiable Credential>"}'

# 5. 驗證（帶 txHash）
curl -X POST http://localhost:5500/api/self/verify \
  -H "Content-Type: application/json" \
  -d '{"txHash": "0x8412...804aa"}'
```

### 部署環境測試

```bash
# 替換為實際部署的 URL
BASE_URL=https://your-deployed-url.com

# 健康檢查
curl -X GET ${BASE_URL}/api/self/health

# 驗證
curl -X POST ${BASE_URL}/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash": "0x你的交易哈希"}'
```

### Postman Collection 範例

建立 Postman Collection，包含以下請求：

1. **GET /api/self/health**
   - Method: GET
   - URL: `{{baseUrl}}/api/self/health`
   - Headers: 無

2. **POST /api/self/verify-by-tx (Success)**
   - Method: POST
   - URL: `{{baseUrl}}/api/self/verify-by-tx`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "txHash": "DEMO_SUCCESS_TW"
     }
     ```

3. **POST /api/self/verify-by-tx (Fail)**
   - Method: POST
   - URL: `{{baseUrl}}/api/self/verify-by-tx`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "txHash": "DEMO_FAIL_NOT_FOUND"
     }
     ```

**環境變數設定：**
- `baseUrl`: `http://localhost:5500` (本地) 或 `https://your-deployed-url.com` (部署)

