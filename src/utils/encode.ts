// 编码相关工具函数
import CryptoJS from "crypto-js";

export function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

export function base64Decode(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    // 如果上面的方法失败，尝试直接解码
    try {
      return atob(str);
    } catch {
      return str; // 如果都失败就返回原字符串
    }
  }
}

export function md5(str: string): string {
  return CryptoJS.MD5(str).toString();
}

export function sha256(str: string): string {
  return CryptoJS.SHA256(str).toString();
}