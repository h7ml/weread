import { getShelfBooks } from "@/apis";
import { jsonResponse } from "@/utils";
import { logger } from "@/utils";

export async function handler(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
  const search = url.searchParams.get("search") || "";

  if (!token) {
    return jsonResponse({
      success: false,
      error: "未登录",
    }, 401);
  }

  try {
    // 从KV数据库获取用户信息
    const kv = await Deno.openKv();

    logger.info("Looking for user with token:", token.substring(0, 8) + "...");

    // 查找匹配token的用户
    let userInfo = null;
    for await (const entry of kv.list({ prefix: ["user"] })) {
      logger.debug(
        "Checking user entry:",
        entry.key,
        "skey:",
        entry.value.skey?.substring(0, 8) + "...",
      );
      if (entry.value.skey === token) {
        userInfo = entry.value;
        logger.info("Found matching user:", userInfo.vid);
        break;
      }
    }

    if (!userInfo) {
      logger.warn("User not found for token:", token.substring(0, 8) + "...");

      // 列出所有用户用于调试
      logger.info("Available users in KV:");
      for await (const entry of kv.list({ prefix: ["user"] })) {
        logger.info(
          "- User:",
          entry.value.vid,
          "skey:",
          entry.value.skey?.substring(0, 8) + "...",
        );
      }

      return jsonResponse({
        success: false,
        error: "登录已过期，请重新登录",
      }, 401);
    }

    logger.info("Found user for shelf request:", userInfo.vid);

    // 构建cookie字符串
    const cookie =
      `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;
    logger.info("Using cookie:", cookie.substring(0, 100) + "...");

    // 获取书架数据
    logger.info("Fetching shelf books...");
    const allBooks = await getShelfBooks(cookie);

    // 搜索过滤
    let filteredBooks = allBooks || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBooks = filteredBooks.filter((book) =>
        book.title?.toLowerCase().includes(searchLower) ||
        book.author?.toLowerCase().includes(searchLower)
      );
    }

    // 分页处理
    const total = filteredBooks.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

    logger.info(
      `Successfully fetched ${total} books (showing ${paginatedBooks.length} on page ${page}/${totalPages}) for user ${userInfo.vid}`,
    );

    return jsonResponse({
      success: true,
      data: {
        books: paginatedBooks,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        user: {
          vid: userInfo.vid,
          name: userInfo.name,
          loginTime: userInfo.loginTime,
        },
      },
    });
  } catch (error) {
    logger.error("Failed to get shelf:", error);
    logger.error("Error stack:", error.stack);
    return jsonResponse({
      success: false,
      error: `获取书架失败: ${error.message}`,
      details: error.stack,
    }, 500);
  }
}
