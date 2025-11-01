// functions/policyEngine.ts
//
// Policy Engine：輕量版政策評估引擎
// 功能：讀取 YAML/JSON policy，按照規則順序評估，返回 allow/deny 決定

import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

interface PolicyRule {
  id: string;
  when: string; // 條件表達式（簡化版）
  effect: 'allow' | 'deny';
  description?: string;
}

interface Policy {
  version: string;
  default_action: 'allow' | 'deny';
  rules: PolicyRule[];
}

interface EvaluationContext {
  // Proof 相關
  proof?: {
    source?: string;
    country?: string;
    sanctioned?: boolean;
    age_verified?: boolean;
    age?: number;
  };
  // Context
  context?: string;
  // Agent 相關
  sandbox_score?: number;
  delegation_scope?: string[];
  agent_address?: string;
  whitelist?: string[];
  // 其他
  doc_hash?: string;
  [key: string]: any;
}

// 載入 policy 文件
function loadPolicy(policyName: string): Policy | null {
  try {
    // 嘗試多個路徑（適配不同運行環境）
    const possiblePaths = [
      join(__dirname, '..', 'policies', `${policyName}.yaml`), // 開發環境（從 functions/ 目錄運行）
      join(process.cwd(), 'policies', `${policyName}.yaml`), // 從項目根目錄運行
      join(__dirname, 'policies', `${policyName}.yaml`), // 編譯後的 lib/ 目錄
    ];
    
    for (const yamlPath of possiblePaths) {
      try {
        const yamlContent = readFileSync(yamlPath, 'utf-8');
        const policy = yaml.load(yamlContent) as Policy;
        return policy;
      } catch (e) {
        // 繼續嘗試下一個路徑
      }
    }
    
    // 嘗試載入 JSON（後備方案）
    const jsonPaths = [
      join(__dirname, '..', 'policies', `${policyName}.json`),
      join(process.cwd(), 'policies', `${policyName}.json`),
      join(__dirname, 'policies', `${policyName}.json`),
    ];
    
    for (const jsonPath of jsonPaths) {
      try {
        const jsonContent = readFileSync(jsonPath, 'utf-8');
        const policy = JSON.parse(jsonContent) as Policy;
        return policy;
      } catch (e2) {
        // 繼續嘗試下一個路徑
      }
    }
    
    console.error(`無法載入 policy: ${policyName}，已嘗試所有路徑`);
    return null;
  } catch (e) {
    console.error(`載入 policy 時發生錯誤: ${policyName}`, e);
    return null;
  }
}

// 簡化的條件評估器（支援基本表達式）
function evaluateCondition(condition: string, context: EvaluationContext): boolean {
  try {
    // 替換變數：proof.source -> context.proof?.source
    let expr = condition;
    
    // 處理 proof.* 訪問
    expr = expr.replace(/proof\.(\w+)/g, (match, field) => {
      const value = (context.proof as any)?.[field];
      if (value === undefined) return 'undefined';
      if (typeof value === 'string') return `"${value}"`;
      if (typeof value === 'boolean') return String(value);
      return String(value);
    });
    
    // 處理 context.* 訪問
    expr = expr.replace(/context\.(\w+)/g, (match, field) => {
      const value = context[field];
      if (value === undefined) return 'undefined';
      if (typeof value === 'string') return `"${value}"`;
      if (typeof value === 'boolean') return String(value);
      return String(value);
    });
    
    // 處理直接變數訪問
    Object.keys(context).forEach(key => {
      if (key !== 'proof') {
        const value = context[key];
        if (typeof value === 'string') {
          expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), `"${value}"`);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
        }
      }
    });
    
    // 處理 in 運算符（簡化版）
    const inMatch = expr.match(/(\w+)\s+in\s+\[(.*?)\]/);
    if (inMatch) {
      const varName = inMatch[1];
      const arrStr = inMatch[2];
      const arr = arrStr.split(',').map(s => s.trim().replace(/"/g, ''));
      const value = (context as any)[varName] || (context.proof as any)?.[varName];
      const result = arr.includes(String(value));
      return result;
    }
    
    // 處理 == 和 >= 等運算符（簡化版）
    if (expr.includes('==')) {
      const [left, right] = expr.split('==').map(s => s.trim());
      const leftValue = eval(left) || left;
      const rightValue = eval(right) || right;
      return String(leftValue) === String(rightValue);
    }
    
    if (expr.includes('>=')) {
      const [left, right] = expr.split('>=').map(s => s.trim());
      const leftNum = parseFloat(String(eval(left) || left));
      const rightNum = parseFloat(String(eval(right) || right));
      return !isNaN(leftNum) && !isNaN(rightNum) && leftNum >= rightNum;
    }
    
    if (expr.includes('!=')) {
      const [left, right] = expr.split('!=').map(s => s.trim());
      const leftValue = eval(left) || left;
      const rightValue = eval(right) || right;
      return String(leftValue) !== String(rightValue);
    }
    
    if (expr.includes('||')) {
      const parts = expr.split('||').map(s => s.trim());
      return parts.some(part => evaluateCondition(part, context));
    }
    
    if (expr.includes('&&')) {
      const parts = expr.split('&&').map(s => s.trim());
      return parts.every(part => evaluateCondition(part, context));
    }
    
    // 簡單的 true/false 檢查
    if (expr.trim() === 'true') return true;
    if (expr.trim() === 'false') return false;
    
    // 嘗試直接評估（注意安全性）
    try {
      return Boolean(eval(expr));
    } catch {
      return false;
    }
  } catch (e) {
    console.error('條件評估錯誤:', condition, e);
    return false;
  }
}

// 評估 policy
export function evaluatePolicy(
  policyName: string,
  context: EvaluationContext
): {
  status: 'allowed' | 'denied';
  reason?: string;
  policy_id?: string;
  policy_version?: string;
  matched_rule?: string;
  evaluation_details?: any;
} {
  const policy = loadPolicy(policyName);
  
  if (!policy) {
    // 如果無法載入 policy，使用默認行為
    return {
      status: 'denied',
      reason: 'POLICY_NOT_FOUND',
      policy_id: policyName,
    };
  }
  
  // 按照規則順序評估
  for (const rule of policy.rules) {
    const conditionMet = evaluateCondition(rule.when, context);
    
    if (conditionMet) {
      // 如果條件滿足，執行 effect
      if (rule.effect === 'deny') {
        return {
          status: 'denied',
          reason: rule.id,
          policy_id: policyName,
          policy_version: policy.version,
          matched_rule: rule.id,
          evaluation_details: {
            rule_description: rule.description,
            condition: rule.when,
          },
        };
      } else if (rule.effect === 'allow') {
        return {
          status: 'allowed',
          reason: rule.id,
          policy_id: policyName,
          policy_version: policy.version,
          matched_rule: rule.id,
          evaluation_details: {
            rule_description: rule.description,
            condition: rule.when,
          },
        };
      }
    }
  }
  
  // 如果沒有規則匹配，返回默認行為
  return {
    status: policy.default_action === 'allow' ? 'allowed' : 'denied',
    reason: 'DEFAULT_ACTION',
    policy_id: policyName,
    policy_version: policy.version,
  };
}

// 獲取 policy 信息（用於前端顯示）
export function getPolicyInfo(policyName: string): {
  version?: string;
  policy_id?: string;
} | null {
  const policy = loadPolicy(policyName);
  if (!policy) return null;
  
  return {
    version: policy.version,
    policy_id: policyName,
  };
}
