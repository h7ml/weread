import { getKv } from "./db.ts";

/**
 * 用户设置
 */
export interface UserSetting {
  vid: number;
  email?: string;
  emailVerified?: boolean;
  pushplusToken?: string;
  enableEmailNotify?: boolean;
  enablePushNotify?: boolean;
  autoReadEnabled?: boolean;
  autoExchangeEnabled?: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * 获取用户设置
 */
export async function getUserSetting(vid: number): Promise<UserSetting | null> {
  const kv = await getKv();
  const entry = await kv.get<UserSetting>(["settings", vid]);
  return entry.value;
}

/**
 * 保存用户设置
 */
export async function saveUserSetting(setting: UserSetting): Promise<void> {
  const kv = await getKv();
  setting.updatedAt = Date.now();

  if (!setting.createdAt) {
    setting.createdAt = Date.now();
  }

  await kv.set(["settings", setting.vid], setting);
}

/**
 * 更新邮箱
 */
export async function updateEmail(
  vid: number,
  email: string,
  verified = false,
): Promise<void> {
  let setting = await getUserSetting(vid);

  if (!setting) {
    setting = {
      vid,
      email,
      emailVerified: verified,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } else {
    setting.email = email;
    setting.emailVerified = verified;
  }

  await saveUserSetting(setting);
}

/**
 * 更新推送Token
 */
export async function updatePushplusToken(
  vid: number,
  token: string,
): Promise<void> {
  let setting = await getUserSetting(vid);

  if (!setting) {
    setting = {
      vid,
      pushplusToken: token,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } else {
    setting.pushplusToken = token;
  }

  await saveUserSetting(setting);
}

/**
 * 获取所有启用邮件通知的用户
 */
export async function getEmailEnabledUsers(): Promise<UserSetting[]> {
  const kv = await getKv();
  const users: UserSetting[] = [];
  const iter = kv.list<UserSetting>({ prefix: ["settings"] });

  for await (const entry of iter) {
    if (entry.value?.enableEmailNotify && entry.value.emailVerified) {
      users.push(entry.value);
    }
  }

  return users;
}

/**
 * 获取所有启用推送通知的用户
 */
export async function getPushEnabledUsers(): Promise<UserSetting[]> {
  const kv = await getKv();
  const users: UserSetting[] = [];
  const iter = kv.list<UserSetting>({ prefix: ["settings"] });

  for await (const entry of iter) {
    if (entry.value?.enablePushNotify && entry.value.pushplusToken) {
      users.push(entry.value);
    }
  }

  return users;
}
