import { getChapterList } from "@/apis";
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
        cookie = `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;
      }
    }
    
    logger.info(`Fetching chapters for bookId: ${bookId}, authenticated: ${!!cookie}`);
    
    // 获取章节列表 - 公共API不需要登录
    const chapters = await getChapterList(bookId, cookie);
    
    logger.info(`Successfully fetched ${chapters.length} chapters for book: ${bookId}`);
    
    return jsonResponse({
      success: true,
      data: {
        bookId,
        chapters,
        total: chapters.length
      },
    });
  } catch (error) {
    logger.error("Failed to get chapters:", error);
    return jsonResponse({
      success: false,
      error: `获取章节列表失败: ${error.message}`,
    }, 500);
  }
}