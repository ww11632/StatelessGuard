"use strict";
// functions/performanceStats.ts
//
// 端點：GET /api/performance/stats
// 功能：時間指標展示（實際性能統計）
// 展示：X 秒完成驗證的實際數據
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceStats = void 0;
exports.recordPerformance = recordPerformance;
const https_1 = require("firebase-functions/v2/https");
const REGION = 'us-central1';
const TIMEOUT_SECONDS = 10;
// CORS
const allowedOrigins = () => (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
const setCors = (res, origin) => {
    const ok = origin && allowedOrigins().includes(origin);
    if (ok) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    return Boolean(ok);
};
// 性能統計（記憶體版，實際應用應使用資料庫）
const perfStats = [];
exports.performanceStats = (0, https_1.onRequest)({ region: REGION, timeoutSeconds: TIMEOUT_SECONDS }, async (req, res) => {
    setCors(res, req.headers?.origin);
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
        return;
    }
    // 計算統計數據
    if (perfStats.length === 0) {
        // 如果沒有數據，返回預設統計
        res.status(200).json({
            total_requests: 0,
            average_time_ms: 0,
            average_time_sec: 0,
            min_time_ms: 0,
            max_time_ms: 0,
            p50_time_ms: 0,
            p95_time_ms: 0,
            p99_time_ms: 0,
            by_endpoint: {},
            by_mode: {},
            note: '等待更多驗證請求以產生統計數據',
        });
        return;
    }
    const sorted = [...perfStats].sort((a, b) => a.time_ms - b.time_ms);
    const total = perfStats.length;
    const sum = perfStats.reduce((acc, x) => acc + x.time_ms, 0);
    const avg = sum / total;
    const p50 = sorted[Math.floor(total * 0.5)]?.time_ms || 0;
    const p95 = sorted[Math.floor(total * 0.95)]?.time_ms || 0;
    const p99 = sorted[Math.floor(total * 0.99)]?.time_ms || 0;
    // 按端點統計
    const byEndpoint = {};
    perfStats.forEach(stat => {
        if (!byEndpoint[stat.endpoint])
            byEndpoint[stat.endpoint] = [];
        byEndpoint[stat.endpoint].push(stat.time_ms);
    });
    // 按模式統計
    const byMode = {};
    perfStats.forEach(stat => {
        if (stat.mode) {
            if (!byMode[stat.mode])
                byMode[stat.mode] = [];
            byMode[stat.mode].push(stat.time_ms);
        }
    });
    // 計算各端點平均值
    const endpointStats = {};
    Object.keys(byEndpoint).forEach(endpoint => {
        const times = byEndpoint[endpoint];
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        endpointStats[endpoint] = {
            count: times.length,
            average_ms: avgTime,
            average_sec: (avgTime / 1000).toFixed(2),
            min_ms: Math.min(...times),
            max_ms: Math.max(...times),
        };
    });
    // 計算各模式平均值
    const modeStats = {};
    Object.keys(byMode).forEach(mode => {
        const times = byMode[mode];
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        modeStats[mode] = {
            count: times.length,
            average_ms: avgTime,
            average_sec: (avgTime / 1000).toFixed(2),
            min_ms: Math.min(...times),
            max_ms: Math.max(...times),
        };
    });
    res.status(200).json({
        total_requests: total,
        average_time_ms: Math.round(avg),
        average_time_sec: (avg / 1000).toFixed(2),
        min_time_ms: sorted[0]?.time_ms || 0,
        max_time_ms: sorted[sorted.length - 1]?.time_ms || 0,
        p50_time_ms: p50,
        p95_time_ms: p95,
        p99_time_ms: p99,
        by_endpoint: endpointStats,
        by_mode: modeStats,
        recent_10: perfStats.slice(-10).reverse(),
        timestamp: new Date().toISOString(),
    });
});
// 匯出函數以記錄性能數據（供其他端點使用）
function recordPerformance(endpoint, timeMs, mode) {
    perfStats.push({
        timestamp: new Date().toISOString(),
        endpoint,
        time_ms: timeMs,
        mode,
    });
    // 只保留最近 1000 筆
    if (perfStats.length > 1000) {
        perfStats.shift();
    }
}
