// public/js/config.js
//
// 這個檔案定義前端用到的全域設定。您可以依環境需求調整。

const CONFIG = {
  // 後端基礎路徑，通常設定為與前端同源。若部署到不同主機，請修改此值。
  API_BASE:'',
  // proof 驗證端點路徑（不含 API_BASE），必須與後端設定一致。
  VERIFY_ENDPOINT: '/api/verifyProof',
  SELF_VERIFY_ENDPOINT: '/api/self/verify',
  SELF_VERIFY_BY_TX_ENDPOINT: '/api/self/verify-by-tx',
  // 功能旗標，可在開發環境開啟模擬模式。
  FLAGS: {
    MOCK_VERIFICATION: false,
  },
};