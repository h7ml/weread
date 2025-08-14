// deno-lint-ignore-file no-explicit-any
import { md5 } from "./crypto.ts";

/**
 * 生成唯一ID（使用crypto.randomUUID）
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 根据 UA 生成 AppID
 * 微信读书API需要的特定算法
 */
export function getAppId(ua: string): string {
  let rnd1 = "";
  const uaParts = ua.split(" ");
  const uaPartCount = Math.min(uaParts.length, 12);

  for (let i = 0; i < uaPartCount; i++) {
    rnd1 += uaParts[i].length % 10;
  }

  let rnd2 = function (ua: string) {
    let num = 0;
    const len = ua.length;

    for (let i = 0; i < len; i++) {
      num = (131 * num + ua.charCodeAt(i)) & 0x7fffffff;
    }
    return num.toString();
  }(ua);
  
  if (rnd2.length > 16) {
    rnd2 = rnd2.slice(0, 16);
  }
  
  return "wb" + rnd1 + "h" + rnd2;
}

/**
 * 微信读书API签名算法 - 内部实现
 */
function _sign(data: string): string {
  let n1 = 0x15051505;
  let n2 = 0x15051505;
  const strlen = data.length;

  for (let i = strlen - 1; i > 0; i -= 2) {
    n1 = 0x7fffffff & (n1 ^ (data.charCodeAt(i) << ((strlen - i) % 30)));
    n2 = 0x7fffffff & (n2 ^ (data.charCodeAt(i - 1) << (i % 30)));
  }
  
  return (n1 + n2).toString(16).toLowerCase();
}

/**
 * 将对象转换为查询字符串
 */
function _stringify(data: Record<string, any>, keys: string[] = []): string {
  let result = "";
  const all = keys.length === 0;
  const objKeys = Object.keys(data).sort();

  for (let i = 0; i < objKeys.length; i++) {
    const key = objKeys[i];
    if (all || keys.indexOf(key) !== -1) {
      const value = data[key];
      result += key + "=" + encodeURIComponent(value);
      result += "&";
    }
  }
  
  if (result.length > 0 && result.charAt(result.length - 1) === "&") {
    result = result.slice(0, result.length - 1);
  }
  
  return result;
}

/**
 * 计算微信读书API请求的签名
 */
export function sign(data: Record<string, any>): string {
  return _sign(_stringify(data));
}

/**
 * 计算参数的哈希值（微信读书特定算法）
 */
export function calcHash(data: string | number): string {
  if (typeof data === "number") {
    data = data.toString();
  }
  if (typeof data !== "string") {
    return data;
  }

  const dataMd5 = md5(data);
  let result = dataMd5.substring(0, 3);
  
  const processData = function (data: string): [string, string[]] {
    if (/^\d*$/.test(data)) {
      const dataLen = data.length;
      const chunks: string[] = [];
      for (let i = 0; i < dataLen; i += 9) {
        const chunk = data.slice(i, Math.min(i + 9, dataLen));
        chunks.push(parseInt(chunk).toString(16));
      }
      return ["3", chunks];
    }

    let hexStr = "";
    for (let i = 0; i < data.length; i++) {
      hexStr += data.charCodeAt(i).toString(16);
    }
    return ["4", [hexStr]];
  }(data);

  result += processData[0];
  result += 2 + dataMd5.substring(dataMd5.length - 2, dataMd5.length);

  const chunks = processData[1];
  for (let i = 0; i < chunks.length; i++) {
    let lenHex = chunks[i].length.toString(16);
    if (lenHex.length === 1) {
      lenHex = "0" + lenHex;
    }
    result += lenHex;
    result += chunks[i];
    if (i < chunks.length - 1) {
      result += "g";
    }
  }

  if (result.length < 20) {
    result += dataMd5.substring(0, 20 - result.length);
  }

  return result + md5(result).substring(0, 3);
}

/**
 * 获取当前时间戳（秒）
 */
export function currentTime(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * 获取当前时间戳（毫秒）
 */
export function timestamp(): number {
  return Date.now();
}

/**
 * 生成二维码URL
 */
export function generateQRCode(data: string): string {
  const query = new URLSearchParams({
    cht: "qr",
    chs: "300x300",
    chl: data,
  });
  return "https://chart.googleapis.com/chart?" + query.toString();
}

/**
 * 检查是否在 Deno Deploy 环境中运行
 */
export function runInDenoDeploy(): boolean {
  const deploymentId = Deno.env.get("DENO_DEPLOYMENT_ID");
  return !!deploymentId;
}

/**
 * 睡眠指定时间
 * @param duration 毫秒
 */
export function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

/**
 * 获取当前时间的格式化字符串（中国时区）
 */
export function now(): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Shanghai",
  }).format(new Date());
}

/**
 * 创建JSON响应
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

/**
 * 生成随机整数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 */
export function randomInteger(min: number, max: number): number {
  const rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}

/**
 * 格式化秒数为可读字符串
 */
export function formatSeconds(seconds: number): string {
  if (typeof seconds !== "number") {
    return String(seconds);
  }
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const second = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m${second}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hours}h${minute}m${second}s`;
}

/**
 * 解析Cookie字符串
 */
export function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;
  
  cookieString.split(";").forEach((cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  });
  
  return cookies;
}

/**
 * 将对象转换为Cookie字符串
 */
export function stringifyCookies(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("; ");
}