import {
  addToShelf,
  archiveBook,
  removeFromShelf,
  unarchiveBook,
} from "@/apis";
import { jsonResponse, logger } from "@/utils";

export async function handler(req: Request) {
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const { action, bookId, token } = await req.json();

    if (!token || !bookId || !action) {
      return jsonResponse({
        success: false,
        error: "缺少必要参数",
      }, 400);
    }

    // 从KV数据库获取用户信息
    const kv = await Deno.openKv();
    let userInfo: any = null;

    for await (const entry of kv.list({ prefix: ["user"] })) {
      if ((entry.value as any).skey === token) {
        userInfo = entry.value;
        break;
      }
    }

    if (!userInfo) {
      return jsonResponse({
        success: false,
        error: "登录已过期，请重新登录",
      }, 401);
    }

    // 构建cookie字符串
    const cookie =
      `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;

    let result = false;
    let message = "";

    switch (action) {
      case "add":
        try {
          result = await addToShelf(bookId, cookie);
          message = result ? "添加到书架成功" : "添加到书架失败";
        } catch (error) {
          logger.error(`Add to shelf error for book ${bookId}:`, error);
          result = false;
          message = `添加到书架失败: ${error.message}`;
        }
        break;

      case "remove":
        try {
          result = await removeFromShelf(bookId, cookie);
          message = result ? "从书架移除成功" : "从书架移除失败";
        } catch (error) {
          logger.error(`Remove from shelf error for book ${bookId}:`, error);
          result = false;
          message = `从书架移除失败: ${error.message}`;
        }
        break;

      case "archive":
        try {
          result = await archiveBook(bookId, cookie);
          message = result ? "归档成功" : "归档失败";
        } catch (error) {
          logger.error(`Archive book error for book ${bookId}:`, error);
          result = false;
          message = `归档失败: ${error.message}`;
        }
        break;

      case "unarchive":
        try {
          result = await unarchiveBook(bookId, cookie);
          message = result ? "取消归档成功" : "取消归档失败";
        } catch (error) {
          logger.error(`Unarchive book error for book ${bookId}:`, error);
          result = false;
          message = `取消归档失败: ${error.message}`;
        }
        break;

      default:
        return jsonResponse({
          success: false,
          error: "不支持的操作",
        }, 400);
    }

    logger.info(
      `Shelf ${action} for book ${bookId} by user ${userInfo.vid}: ${result}`,
    );

    return jsonResponse({
      success: result,
      message,
    });
  } catch (error) {
    logger.error("Shelf management error:", error);
    return jsonResponse({
      success: false,
      error: `操作失败: ${error.message}`,
    }, 500);
  }
}
