import CryptoJS from "crypto-js";

/**
 * 计算字符串的 MD5 哈希值
 */
export function md5(data: string): string {
  return CryptoJS.MD5(data).toString();
}

/**
 * 计算字符串的 SHA256 哈希值
 */
export function sha256(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * AES 加密
 */
export function aesEncrypt(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * AES 解密
 */
export function aesDecrypt(encrypted: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}