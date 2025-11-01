#!/bin/bash
# 取得 Celo Sepolia txHash 的腳本

echo "🔍 取得 Celo Sepolia txHash"
echo "============================"
echo ""

echo "方法 1: 使用 Self Playground（推薦）"
echo "-----------------------------------"
echo "1. 打開瀏覽器：https://playground.staging.self.xyz/"
echo "2. 選擇「Celo Sepolia」網路"
echo "3. 用手機 Self App 掃描 QR Code"
echo "4. 完成驗證後，頁面會顯示 txHash（格式：0x...）"
echo "5. 複製 txHash 後，執行測試："
echo ""
echo "   curl -X POST http://localhost:5500/api/self/verify-by-tx \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"txHash\":\"0x你的txHash\"}' | jq ."
echo ""

echo "方法 2: 從 Blockscout 找範例交易"
echo "-----------------------------------"
echo "1. 打開瀏覽器：https://celo-sepolia.blockscout.com/"
echo "2. 瀏覽「Latest Transactions」列表"
echo "3. 點擊任意交易"
echo "4. 複製頁面頂部的 txHash"
echo ""

echo "方法 3: 使用已知的 Sepolia 交易（測試用）"
echo "-------------------------------------------"
echo "如果只是想測試 API 功能，可以用 Blockscout 上最新的交易："
echo ""
echo "打開：https://celo-sepolia.blockscout.com/"
echo "複製任意交易的 txHash 測試"
echo ""

echo "方法 4: 使用 demoTxMap.json（自訂映射）"
echo "---------------------------------------"
echo "1. 建立映射檔："
echo "   cd functions"
echo "   cp demoTxMap.example.json demoTxMap.json"
echo ""
echo "2. 編輯 demoTxMap.json，填入任意 0x... txHash（格式正確即可）"
echo "3. 測試該 txHash"
echo ""

echo "✅ 測試命令："
echo "curl -X POST http://localhost:5500/api/self/verify-by-tx \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"txHash\":\"0x你的txHash\"}' | jq ."
echo ""




