import { HttpClient } from "@/utils";
import { Credential } from "@/kv";

const client = new HttpClient("https://weread.qq.com");

/**
 * 登录相关接口响应
 */
export interface LoginUidResponse {
  uid: string;
}

export interface LoginInfoResponse {
  code?: string;
  userInfo?: {
    vid: number;
    name: string;
    avatarUrl: string;
  };
}

export interface WebLoginResponse {
  vid: number;
  accessToken: string;
  refreshToken: string;
  name: string;
}

/**
 * 获取登录用的UID
 */
export async function getLoginUid(): Promise<string> {
  const data = await client.post<LoginUidResponse>("/web/login/getuid");
  return data.uid;
}

/**
 * 生成二维码登录链接
 */
export function getQRCodeUrl(uid: string): string {
  return `https://weread.qq.com/web/confirm?pf=2&uid=${uid}`;
}

/**
 * 查询扫码状态
 */
export async function getLoginInfo(uid: string): Promise<LoginInfoResponse> {
  return await client.post<LoginInfoResponse>("/web/login/getinfo", { uid });
}

/**
 * 完成登录
 */
export async function webLogin(info: Record<string, any>): Promise<WebLoginResponse> {
  // 清理不需要的字段
  const loginInfo = { ...info };
  delete loginInfo.redirect_uri;
  delete loginInfo.expireMode;
  delete loginInfo.pf;
  loginInfo.fp = "";
  
  return await client.post<WebLoginResponse>("/web/login/weblogin", loginInfo);
}

/**
 * 初始化会话
 */
export async function initSession(credential: Partial<Credential>): Promise<any> {
  const params = {
    vid: credential.vid,
    pf: 0,
    skey: credential.skey,
    rt: credential.rt,
  };
  
  return await client.post("/web/login/session/init", params);
}

/**
 * 刷新Token
 */
export async function renewalToken(url: string, cookie: string): Promise<Partial<Credential> | null> {
  try {
    const response = await fetch("https://weread.qq.com/web/login/renewal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookie,
      },
      body: JSON.stringify({
        rq: encodeURIComponent(url),
      }),
    });
    
    const data = await response.json();
    
    if (data.succ === 1) {
      const cookies = response.headers.getSetCookie();
      const result: Partial<Credential> = {};
      
      cookies.forEach(cookie => {
        const [item] = cookie.split(";");
        const [name, value] = item.split("=");
        
        if (name === "wr_vid") {
          result.vid = parseInt(value);
        } else if (name === "wr_skey") {
          result.skey = value;
        } else if (name === "wr_rt") {
          result.rt = value;
        }
      });
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error("Token renewal failed:", error);
    return null;
  }
}