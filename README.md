 StatelessGuard · 跨人類與 AI 的模組化信任協議

> StatelessGuard 是一個用於 RWA、DAO、Social、AI Agent 等多領域的信任驗證與審計追蹤框架。

 🚀 快速開始

詳細說明請參考 [HANDOFF.md](./HANDOFF.md)。

 快速啟動

```bash
 1. 安裝依賴
cd functions && npm install && cd ..

 2. 配置環境變量
cp functions/env.example functions/.env
 編輯 functions/.env，設置 CELO_RPC_ENDPOINT 和可選的 Pinata API keys

 3. 啟動 Firebase Emulator
firebase emulators:start --only functions,hosting,firestore --project demo-self-gate

 4. 訪問 http://localhost:5500/scenarios.html
```

 📖 核心功能

- ✅ 多場景驗證：RWA、DAO、Social、AI Agent
- ✅ Policy Engine：可配置的信任政策（YAML）
- ✅ Capsule Trace：視覺化信任鏈追蹤
- ✅ 後端儲存：Firestore + IPFS 持久化
- ✅ Hash Chain Integrity：鏈完整性驗證
- ✅ 真實鏈上數據：Celo RPC 整合

 📚 文檔

- [HANDOFF.md](./HANDOFF.md) - 完整的項目交接說明
- [PROOF_OF_AGENT_GUIDE.md](./PROOF_OF_AGENT_GUIDE.md) - Proof-of-Agent 說明
- `functions/IPFS_SETUP.md` - IPFS 配置說明
- `functions/SETUP_PINATA.md` - Pinata 設置說明

 🛠️ 技術棧

- 前端：HTML + JavaScript（原生）
- 後端：Firebase Cloud Functions (TypeScript)
- 儲存：Firestore + IPFS (Pinata)
- 區塊鏈：Celo Sepolia Testnet
