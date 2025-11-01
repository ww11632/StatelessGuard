Demo Checklist

這份清單列出如何在本專案中進行示範測試。請依序完成步驟以確保功能正常。

後端準備

進入 functions 目錄：

cd functions
npm install
npm run typecheck

建立 .env 文件，並依 env.example 填入環境變數，例如：

CELO_RPC_ENDPOINT=https://forno.celo-sepolia.celo-testnet.org
NETWORK_NAME=demo
ALLOWED_ORIGINS=http://localhost:8080

使用 Firebase Emulator 或其他框架掛載匯出的函式，確保 rpcHealthCheck 和 verifyProof 端點可透過 /api/rpcHealthCheck、/api/verifyProof 或類似路徑存取。

前端測試

在專案根目錄啟動靜態伺服器服務 public/：

npx http-server public -p 8080

開啟瀏覽器並造訪 http://localhost:8080/self-gate.html。

在 textarea 中輸入假想的 proof JSON，例如：

{ "proofData": { "user": "alice", "timestamp": "2025-10-28" }, "extra": 42 }

按下「驗證並寫入日誌」，觀察頁面回應成功訊息。

打開瀏覽器開發者工具的 Local Storage 查看 audit_log_jsonl，確認新增兩筆紀錄：TERMS_HASHED 與 PROOF_ACCEPTED。

如需進一步驗證日誌，可至 verify.html 上傳從 Local Storage 匯出的 JSONL 檔案，檢查雜湊是否匹配。
