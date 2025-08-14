// 工具函数导出
export * from "./index.ts";
export * from "./logger.ts";
export * from "./request.ts";
export * from "./decrypt.ts";

// 分别导出避免冲突
export { md5 as cryptoMd5, sha256 as cryptoSha256 } from "./crypto.ts";
export { md5 as encodeMd5, sha256 as encodeSha256 } from "./encode.ts";

/**
 * 安全获取错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

/**
 * 安全获取错误堆栈
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}
