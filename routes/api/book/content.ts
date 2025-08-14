import { getChapterContent, getBookInfo } from "@/apis";
import { jsonResponse } from "@/utils";
import { logger } from "@/utils";

export async function handler(req: Request) {
  const url = new URL(req.url);
  const bookId = url.searchParams.get("bookId");
  const chapterUid = url.searchParams.get("chapterUid");
  const token = url.searchParams.get("token");
  
  if (!bookId || !chapterUid) {
    return jsonResponse({
      success: false,
      error: "缺少书籍ID或章节ID",
    }, 400);
  }
  
  if (!token) {
    return jsonResponse({
      success: false,
      error: "未登录",
    }, 401);
  }
  
  try {
    // 从KV数据库获取用户信息
    const kv = await Deno.openKv();
    
    // 查找匹配token的用户
    let userInfo = null;
    for await (const entry of kv.list({ prefix: ["user"] })) {
      if (entry.value.skey === token) {
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
    const cookie = `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;
    
    logger.info(`Fetching chapter content for bookId: ${bookId}, chapterUid: ${chapterUid}`);
    
    // 获取书籍信息以确定格式
    let format = "epub";
    try {
      const bookInfo = await getBookInfo(bookId, cookie);
      format = bookInfo.format || "epub";
      logger.info(`Book format detected: ${format}`);
    } catch (error) {
      logger.warn("Failed to get book format, using default epub:", error.message);
    }
    
    // 获取章节内容
    const content = await getChapterContent(bookId, chapterUid, cookie, format);
    
    logger.info(`Successfully fetched chapter content for: ${chapterUid} (${content.length} chars)`);
    
    return jsonResponse({
      success: true,
      data: {
        bookId,
        chapterUid,
        content,
        format
      },
    });
  } catch (error) {
    logger.error("Failed to get chapter content:", error);
    return jsonResponse({
      success: false,
      error: `获取章节内容失败: ${error.message}`,
    }, 500);
  }
}