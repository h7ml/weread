import { getKv } from "./db.ts";

/**
 * 用户凭证
 */
export interface Credential {
  token: string;
  vid: number;
  name: string;
  skey: string;
  rt: string;
  updatedAt: number;
}

/**
 * 根据 token 获取用户凭证
 */
export async function getByToken(token: string): Promise<Credential | null> {
  const kv = await getKv();
  const entry = await kv.get<Credential>(["credentials", token]);
  return entry.value;
}

/**
 * 根据 vid 获取用户 token
 */
export async function getTokenByVid(vid: number): Promise<string | null> {
  const kv = await getKv();
  const entry = await kv.get<string>(["vid", vid]);
  return entry.value;
}

/**
 * 将凭证转换为Cookie字符串
 */
export function getCookieByCredential(credential: Credential): string {
  const { vid, skey, rt } = credential;
  return `wr_vid=${vid};wr_skey=${skey};wr_rt=${rt};`;
}

/**
 * 更新用户凭证
 */
export async function updateCredential(credential: Credential): Promise<void> {
  const kv = await getKv();
  credential.updatedAt = Date.now();
  
  await kv.atomic()
    .set(["credentials", credential.token], credential)
    .set(["vid", credential.vid], credential.token)
    .commit();
}

/**
 * 删除用户凭证
 */
export async function deleteCredential(token: string): Promise<void> {
  const kv = await getKv();
  const credential = await getByToken(token);
  
  if (credential) {
    await kv.atomic()
      .delete(["credentials", token])
      .delete(["vid", credential.vid])
      .commit();
  }
}

/**
 * 获取所有用户凭证
 */
export async function getAllCredentials(): Promise<Credential[]> {
  const kv = await getKv();
  const credentials: Credential[] = [];
  const iter = kv.list<Credential>({ prefix: ["credentials"] });
  
  for await (const entry of iter) {
    if (entry.value) {
      credentials.push(entry.value);
    }
  }
  
  return credentials;
}

/**
 * 检查凭证是否需要刷新
 * @param credential 用户凭证
 * @param maxAge 最大有效期（毫秒），默认7天
 */
export function needsRefresh(credential: Credential, maxAge = 7 * 24 * 60 * 60 * 1000): boolean {
  return Date.now() - credential.updatedAt > maxAge;
}