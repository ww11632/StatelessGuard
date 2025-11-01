#!/bin/bash
# Self API 測試腳本

BASE_URL="${BASE_URL:-http://localhost:5500}"

echo "🧪 Self API 測試"
echo "================"
echo ""

echo "1️⃣  測試 GET /api/self/health"
echo "----------------------------"
curl -s -X GET "${BASE_URL}/api/self/health" | jq . || echo "❌ 失敗或未安裝 jq（可用 curl 查看原始回應）"
echo ""
echo ""

echo "2️⃣  測試 POST /api/self/verify-by-tx (Demo Success TW)"
echo "---------------------------------------------------"
curl -s -X POST "${BASE_URL}/api/self/verify-by-tx" \
  -H "Content-Type: application/json" \
  -d '{"txHash": "DEMO_SUCCESS_TW"}' | jq . || echo "❌ 失敗"
echo ""
echo ""

echo "3️⃣  測試 POST /api/self/verify-by-tx (Demo Fail)"
echo "---------------------------------------------"
curl -s -X POST "${BASE_URL}/api/self/verify-by-tx" \
  -H "Content-Type: application/json" \
  -d '{"txHash": "DEMO_FAIL_NOT_FOUND"}' | jq . || echo "❌ 失敗"
echo ""
echo ""

echo "4️⃣  測試 POST /api/self/verify (帶 txHash)"
echo "----------------------------------------"
curl -s -X POST "${BASE_URL}/api/self/verify" \
  -H "Content-Type: application/json" \
  -d '{"txHash": "DEMO_SUCCESS_TW"}' | jq . || echo "❌ 失敗"
echo ""
echo ""

echo "✅ 測試完成！"
echo ""
echo "💡 提示："
echo "   - 如果所有測試都失敗，請確認 emulator 是否運行："
echo "     cd functions && npm run serve"
echo "   - 如果回應格式錯誤，可能是 jq 未安裝，可以查看原始回應"
echo "   - 可設定 BASE_URL 環境變數測試不同環境："
echo "     BASE_URL=https://your-deployed-url.com ./test-api.sh"




