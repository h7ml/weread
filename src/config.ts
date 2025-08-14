/**
 * 项目配置
 */
export interface Config {
  // 环境配置
  env: "local" | "development" | "production";
  port: number;
  
  // 微信读书API配置
  wereadBaseURL: string;
  wereadUserAgent: string;
  
  // 邮件配置
  emailEnabled: boolean;
  emailHost?: string;
  emailPort?: number;
  emailUser?: string;
  emailPass?: string;
  emailFrom?: string;
  
  // 推送配置
  pushplusEnabled: boolean;
  pushplusToken?: string;
  
  // 定时任务配置
  cronEnabled: boolean;
  cronReadInterval: string; // Cron表达式
  cronExchangeInterval: string;
  
  // 系统配置
  logLevel: "debug" | "info" | "warn" | "error";
  kvNamespace?: string;
}

/**
 * 获取配置
 */
export function getConfig(): Config {
  const env = Deno.env.get("DENO_ENV") || "local";
  
  return {
    env: env as Config["env"],
    port: parseInt(Deno.env.get("PORT") || "8888"),
    
    // 微信读书API
    wereadBaseURL: "https://weread.qq.com",
    wereadUserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    
    // 邮件配置
    emailEnabled: Deno.env.get("EMAIL_ENABLED") === "true",
    emailHost: Deno.env.get("EMAIL_HOST"),
    emailPort: parseInt(Deno.env.get("EMAIL_PORT") || "587"),
    emailUser: Deno.env.get("EMAIL_USER"),
    emailPass: Deno.env.get("EMAIL_PASS"),
    emailFrom: Deno.env.get("EMAIL_FROM"),
    
    // 推送配置
    pushplusEnabled: Deno.env.get("PUSHPLUS_ENABLED") === "true",
    pushplusToken: Deno.env.get("PUSHPLUS_TOKEN"),
    
    // 定时任务
    cronEnabled: !Deno.args.includes("no-cron"),
    cronReadInterval: Deno.env.get("CRON_READ_INTERVAL") || "*/30 3-6 * * *",
    cronExchangeInterval: Deno.env.get("CRON_EXCHANGE_INTERVAL") || "30 23 * * 0",
    
    // 系统配置
    logLevel: (Deno.env.get("LOG_LEVEL") || "info") as Config["logLevel"],
    kvNamespace: Deno.env.get("KV_NAMESPACE"),
  };
}

export const config = getConfig();