// functions/index.ts
//
// 此檔案為 Firebase Cloud Functions 的進入點。它匯出兩個
// HTTP 端點：rpcHealthCheck 用於檢查 Celo RPC 節點的健康，
// verifyProof 用於驗證使用者提交的 proof。

export { rpcHealthCheck } from './rpcHealthCheck';
export { verifyProof } from './verifyProof';
export { selfVerify } from './selfVerify';
export { verifyByTx } from './verifyByTx';
export { selfHealth } from './selfHealth';
export { generateCapsule } from './generateCapsule';
export { daoVerify } from './daoVerify';
export { agentVerify } from './agentVerify';
export { daoAuth } from './daoAuth';
export { daoProposalVerify } from './daoProposalVerify';
export { socialVerify } from './socialVerify';
export { docHashVerify } from './docHashVerify';
export { scenariosDemo } from './scenariosDemo';
export { performanceStats } from './performanceStats';
export { auditLog } from './auditLog';