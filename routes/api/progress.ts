import {
  getReadProgress,
  updateReadProgress,
} from "../../src/apis/web/book.ts";
import { jsonResponse } from "../../src/utils/mod.ts";
import { logger } from "../../src/utils/mod.ts";

export async function handler(req: Request) {
  const url = new URL(req.url);
  const method = req.method;

  // 获取用户认证信息
  const token = url.searchParams.get("token") || "";
  if (!token) {
    return jsonResponse({
      success: false,
      error: "缺少认证令牌",
    }, 401);
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

  try {
    if (method === "GET") {
      // 获取阅读进度
      const bookId = url.searchParams.get("bookId");
      if (!bookId) {
        return jsonResponse({
          success: false,
          error: "缺少书籍ID",
        }, 400);
      }

      logger.info(
        `Getting read progress for book ${bookId} by user ${userInfo.vid}`,
      );

      try {
        const progress = await getReadProgress(bookId, cookie);

        if (progress) {
          logger.info(
            `Found read progress for book ${bookId}: ${progress.percent}%`,
          );
          return jsonResponse({
            success: true,
            data: progress,
          });
        } else {
          logger.warn(`No progress found for book ${bookId}`);
          return jsonResponse({
            success: false,
            error: "无法获取阅读进度",
          }, 404);
        }
      } catch (error) {
        logger.error(`Progress fetch error for book ${bookId}:`, error);
        return jsonResponse({
          success: false,
          error: `获取进度失败: ${error.message}`,
        }, 500);
      }
    } else if (method === "POST") {
      // 更新阅读进度
      const { bookId, chapterUid, chapterOffset } = await req.json();

      if (!bookId || !chapterUid || chapterOffset === undefined) {
        return jsonResponse({
          success: false,
          error: "缺少必要参数",
        }, 400);
      }

      logger.info(
        `Updating read progress for book ${bookId} by user ${userInfo.vid}`,
      );

      try {
        const result = await updateReadProgress(
          bookId,
          chapterUid,
          chapterOffset,
          cookie,
        );

        if (result) {
          logger.info(`Updated read progress for book ${bookId} successfully`);
          return jsonResponse({
            success: true,
            message: "阅读进度更新成功",
          });
        } else {
          logger.warn(`Failed to update progress for book ${bookId}`);
          return jsonResponse({
            success: false,
            error: "阅读进度更新失败",
          }, 500);
        }
      } catch (error) {
        logger.error(`Progress update error for book ${bookId}:`, error);
        return jsonResponse({
          success: false,
          error: `更新进度失败: ${error.message}`,
        }, 500);
      }
    } else {
      return jsonResponse({
        success: false,
        error: "不支持的请求方法",
      }, 405);
    }
  } catch (error) {
    logger.error("Progress sync error:", error);
    return jsonResponse({
      success: false,
      error: `操作失败: ${error.message}`,
    }, 500);
  }
}
