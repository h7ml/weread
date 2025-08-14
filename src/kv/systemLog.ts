import { getKv } from "./db.ts";

/**
 * 系统日志
 */
export interface SystemLog {
  id: string;
  type: "info" | "warn" | "error" | "cron" | "api";
  module: string;
  message: string;
  data?: unknown;
  createdAt: number;
}

/**
 * 写入系统日志
 */
export async function writeSystemLog(
  type: SystemLog["type"],
  module: string,
  message: string,
  data?: unknown,
): Promise<void> {
  const kv = await getKv();
  const log: SystemLog = {
    id: crypto.randomUUID(),
    type,
    module,
    message,
    data,
    createdAt: Date.now(),
  };

  // 使用时间戳作为key的一部分，便于按时间查询
  await kv.set(["logs", log.createdAt, log.id], log);
}

/**
 * 获取最近的日志
 * @param limit 返回数量
 * @param type 日志类型筛选
 */
export async function getRecentLogs(
  limit = 100,
  type?: SystemLog["type"],
): Promise<SystemLog[]> {
  const kv = await getKv();
  const logs: SystemLog[] = [];
  const iter = kv.list<SystemLog>({ prefix: ["logs"] }, { reverse: true });

  for await (const entry of iter) {
    if (entry.value) {
      if (!type || entry.value.type === type) {
        logs.push(entry.value);
        if (logs.length >= limit) break;
      }
    }
  }

  return logs;
}

/**
 * 清理旧日志
 * @param daysToKeep 保留天数
 */
export async function cleanOldLogs(daysToKeep = 30): Promise<number> {
  const kv = await getKv();
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  let deletedCount = 0;

  const iter = kv.list<SystemLog>({ prefix: ["logs"] });
  const toDelete: Deno.KvKey[] = [];

  for await (const entry of iter) {
    if (entry.value && entry.value.createdAt < cutoffTime) {
      toDelete.push(entry.key);
    }
  }

  // 批量删除
  for (const key of toDelete) {
    await kv.delete(key);
    deletedCount++;
  }

  return deletedCount;
}

/**
 * 获取指定模块的日志
 */
export async function getLogsByModule(
  module: string,
  limit = 100,
): Promise<SystemLog[]> {
  const kv = await getKv();
  const logs: SystemLog[] = [];
  const iter = kv.list<SystemLog>({ prefix: ["logs"] }, { reverse: true });

  for await (const entry of iter) {
    if (entry.value && entry.value.module === module) {
      logs.push(entry.value);
      if (logs.length >= limit) break;
    }
  }

  return logs;
}
