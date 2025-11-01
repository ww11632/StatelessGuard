"use strict";
// functions/index.ts
//
// 此檔案為 Firebase Cloud Functions 的進入點。它匯出兩個
// HTTP 端點：rpcHealthCheck 用於檢查 Celo RPC 節點的健康，
// verifyProof 用於驗證使用者提交的 proof。
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = exports.performanceStats = exports.scenariosDemo = exports.docHashVerify = exports.socialVerify = exports.daoProposalVerify = exports.daoAuth = exports.agentVerify = exports.daoVerify = exports.generateCapsule = exports.selfHealth = exports.verifyByTx = exports.selfVerify = exports.verifyProof = exports.rpcHealthCheck = void 0;
var rpcHealthCheck_1 = require("./rpcHealthCheck");
Object.defineProperty(exports, "rpcHealthCheck", { enumerable: true, get: function () { return rpcHealthCheck_1.rpcHealthCheck; } });
var verifyProof_1 = require("./verifyProof");
Object.defineProperty(exports, "verifyProof", { enumerable: true, get: function () { return verifyProof_1.verifyProof; } });
var selfVerify_1 = require("./selfVerify");
Object.defineProperty(exports, "selfVerify", { enumerable: true, get: function () { return selfVerify_1.selfVerify; } });
var verifyByTx_1 = require("./verifyByTx");
Object.defineProperty(exports, "verifyByTx", { enumerable: true, get: function () { return verifyByTx_1.verifyByTx; } });
var selfHealth_1 = require("./selfHealth");
Object.defineProperty(exports, "selfHealth", { enumerable: true, get: function () { return selfHealth_1.selfHealth; } });
var generateCapsule_1 = require("./generateCapsule");
Object.defineProperty(exports, "generateCapsule", { enumerable: true, get: function () { return generateCapsule_1.generateCapsule; } });
var daoVerify_1 = require("./daoVerify");
Object.defineProperty(exports, "daoVerify", { enumerable: true, get: function () { return daoVerify_1.daoVerify; } });
var agentVerify_1 = require("./agentVerify");
Object.defineProperty(exports, "agentVerify", { enumerable: true, get: function () { return agentVerify_1.agentVerify; } });
var daoAuth_1 = require("./daoAuth");
Object.defineProperty(exports, "daoAuth", { enumerable: true, get: function () { return daoAuth_1.daoAuth; } });
var daoProposalVerify_1 = require("./daoProposalVerify");
Object.defineProperty(exports, "daoProposalVerify", { enumerable: true, get: function () { return daoProposalVerify_1.daoProposalVerify; } });
var socialVerify_1 = require("./socialVerify");
Object.defineProperty(exports, "socialVerify", { enumerable: true, get: function () { return socialVerify_1.socialVerify; } });
var docHashVerify_1 = require("./docHashVerify");
Object.defineProperty(exports, "docHashVerify", { enumerable: true, get: function () { return docHashVerify_1.docHashVerify; } });
var scenariosDemo_1 = require("./scenariosDemo");
Object.defineProperty(exports, "scenariosDemo", { enumerable: true, get: function () { return scenariosDemo_1.scenariosDemo; } });
var performanceStats_1 = require("./performanceStats");
Object.defineProperty(exports, "performanceStats", { enumerable: true, get: function () { return performanceStats_1.performanceStats; } });
var auditLog_1 = require("./auditLog");
Object.defineProperty(exports, "auditLog", { enumerable: true, get: function () { return auditLog_1.auditLog; } });
