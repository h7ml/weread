/**
 * KV数据库实例管理
 */

let kvInstance: Deno.Kv | null = null;

/**
 * 获取KV数据库实例
 */
export async function getKv(): Promise<Deno.Kv> {
  if (!kvInstance) {
    const kvPath = Deno.env.get("KV_PATH");
    kvInstance = await Deno.openKv(kvPath);
  }
  return kvInstance;
}

/**
 * 关闭KV数据库连接
 */
export function closeKv(): void {
  if (kvInstance) {
    kvInstance.close();
    kvInstance = null;
  }
}
