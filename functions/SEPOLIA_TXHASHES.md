# 可用的 Sepolia txHash（測試用）

## ✅ 已測試成功的真實 Sepolia 交易

### 交易 1
```
txHash: 0x1010ac448cbc6f7730b3446fb4ab5cbc8aa8f2c072d7f220f53907c979720a1f
狀態: verified ✅
Explorer: https://celo-sepolia.blockscout.com/tx/0x1010ac448cbc6f7730b3446fb4ab5cbc8aa8f2c072d7f220f53907c979720a1f
```

### 交易 2
```
txHash: 0xac72f876ea75b64a2162e5e667ec597cbac75b847038bc19a9e397e8ac17e0ee
狀態: verified ✅
Explorer: https://celo-sepolia.blockscout.com/tx/0xac72f876ea75b64a2162e5e667ec597cbac75b847038bc19a9e397e8ac17e0ee
```

## 🧪 測試命令

### API 測試
```bash
# 測試交易 1
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0x1010ac448cbc6f7730b3446fb4ab5cbc8aa8f2c072d7f220f53907c979720a1f"}' | jq .

# 測試交易 2
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0xac72f876ea75b64a2162e5e667ec597cbac75b847038bc19a9e397e8ac17e0ee"}' | jq .
```

### 前端測試
1. 打開 `http://localhost:5500/self-onchain.html`
2. 貼上任一 txHash
3. 按「送出驗證」
4. 應該看到驗證成功訊息和 Explorer 連結

## 📊 預期回應

```json
{
  "status": "verified",
  "txHash": "0x...",
  "ofac_checked": true,
  "sanctioned": false,
  "source": "self.celo.sepolia",
  "explorerUrl": "https://celo-sepolia.blockscout.com/tx/0x..."
}
```

## ⚠️ 注意

這些是**一般的 Sepolia 交易**（非 Self 驗證交易），所以：
- ✅ `status: "verified"` - 交易確實存在並成功執行
- ✅ `ofac_checked: true` - 已設定（預設值）
- ✅ `sanctioned: false` - 已設定（預設值）
- ❓ `country: undefined` - 因為不是 Self 驗證交易（正常）
- ❓ `age_verified: undefined` - 因為不是 Self 驗證交易（正常）

要測試**完整的 Self 驗證欄位**（country, age_verified），需要：
- 從 **Self Playground** 取得真實的 Self 驗證交易 txHash
- 或使用 **demoTxMap.json** 建立自訂映射

## 🎯 取得 Self 驗證交易的 txHash

**推薦方法：Self Playground**
1. 打開 https://playground.staging.self.xyz/
2. 選擇「Celo Sepolia」
3. 用手機 Self App 掃描 QR Code
4. 完成驗證後取得 txHash

這樣的 txHash 才會包含完整的 Self 驗證資訊（country, age_verified, etc.）




