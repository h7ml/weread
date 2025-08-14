import { getBookInfo } from "@/apis";
import { jsonResponse } from "@/utils";
import { logger } from "@/utils";

export async function handler(req: Request) {
  const url = new URL(req.url);
  const bookId = url.searchParams.get("bookId");
  const token = url.searchParams.get("token");

  if (!bookId) {
    return jsonResponse({
      success: false,
      error: "缺少书籍ID",
    }, 400);
  }

  try {
    let cookie = "";

    // 如果提供了token，尝试获取用户信息
    if (token) {
      const kv = await Deno.openKv();

      // 查找匹配token的用户
      let userInfo = null;
      for await (const entry of kv.list({ prefix: ["user"] })) {
        if (entry.value.skey === token) {
          userInfo = entry.value;
          break;
        }
      }

      if (userInfo) {
        cookie =
          `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;
      }
    }

    logger.info(
      `Fetching book info for bookId: ${bookId}, authenticated: ${!!cookie}`,
    );

    // 获取书籍详情 - 先尝试公共API，失败后再尝试已登录API
    const bookInfo = await getBookInfo(bookId, cookie);

    logger.info(`Successfully fetched book info:`, bookInfo.title);

    return jsonResponse({
      success: true,
      data: bookInfo,
    });
  } catch (error) {
    logger.error("Failed to get book info:", error);
    return jsonResponse({
      success: false,
      error: `获取书籍详情失败: ${error.message}`,
    }, 500);
  }
}
