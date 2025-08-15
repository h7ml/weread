import { jsonResponse } from "../../src/utils/mod.ts";
import { logger } from "../../src/utils/mod.ts";
import { HttpClient } from "../../src/utils/mod.ts";

const client = new HttpClient("https://weread.qq.com");

export async function handler(req: Request) {
  const url = new URL(req.url);
  const keyword = url.searchParams.get("q");
  const count = Math.min(parseInt(url.searchParams.get("count") || "10"), 20); // 最大20条
  const type = url.searchParams.get("type") || "mixed"; // mixed, global, suggest

  if (!keyword || keyword.trim().length === 0) {
    return jsonResponse({
      success: false,
      error: "请输入搜索关键词",
    }, 400);
  }

  // 获取认证信息（如果有）
  const token = url.searchParams.get("token") ||
    req.headers.get("Authorization")?.replace("Bearer ", "");

  let cookie = "";
  if (token) {
    try {
      const kv = await Deno.openKv();
      for await (const entry of kv.list({ prefix: ["user"] })) {
        if (entry.value.skey === token) {
          const userInfo = entry.value;
          cookie =
            `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;
          break;
        }
      }
      kv.close();
    } catch (error) {
      logger.warn("Failed to get user info for search:", error);
    }
  }

  try {
    logger.info(
      `Unified search - type: ${type}, keyword: ${keyword}, count: ${count}`,
    );

    let result = {
      suggestions: [],
      globalResults: [],
      totalCount: 0,
    };

    // 构建通用请求头
    const headers: HeadersInit = {
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Referer": "https://weread.qq.com/web/search/books",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    };

    if (cookie) {
      headers.Cookie = cookie;
    }

    // 如果是建议类型或混合类型，获取搜索建议
    if (type === "suggest" || type === "mixed") {
      try {
        const suggestParams = new URLSearchParams({
          keyword: keyword.trim(),
          count: Math.min(count, 10).toString(), // 建议最多10条
        });

        const suggestResponse = await client.get<any>(
          `/web/search/search_suggest?${suggestParams}`,
          { headers },
        );

        if (suggestResponse?.books) {
          result.suggestions = suggestResponse.books.slice(0, 5).map((
            item: any,
          ) => ({
            bookId: item.bookId || "",
            title: item.title || "",
            author: item.author || "",
            cover: item.cover || "",
            rating: item.newRating || item.rating || 0,
            type: "book",
          }));
        }
      } catch (error) {
        logger.warn("Search suggest failed:", error);
      }
    }

    // 如果是全局搜索或混合类型，获取全局搜索结果
    if (type === "global" || type === "mixed") {
      try {
        const globalParams = new URLSearchParams({
          keyword: keyword.trim(),
          maxIdx: "0",
          fragmentSize: "120",
          count: count.toString(),
          sid: Math.random().toString(36).substring(2, 15), // 随机 sid
        });

        const globalResponse = await client.get<any>(
          `/web/search/global?${globalParams}`,
          { headers },
        );

        if (globalResponse?.books) {
          result.globalResults = globalResponse.books.slice(0, count).map((
            item: any,
          ) => ({
            bookId: item.bookInfo?.bookId || "",
            title: item.bookInfo?.title || "",
            author: item.bookInfo?.author || "",
            cover: item.bookInfo?.cover || "",
            intro: item.bookInfo?.intro || "",
            rating: item.bookInfo?.newRating || 0,
            fragments: (item.fragments || []).slice(0, 2).map((
              fragment: any,
            ) => ({
              text: fragment.text || "",
              chapterTitle: fragment.chapterTitle || "",
            })),
          }));

          result.totalCount = globalResponse.totalCount ||
            result.globalResults.length;
        }
      } catch (error) {
        logger.warn("Global search failed:", error);
      }
    }

    // 如果是纯建议类型，只返回建议
    if (type === "suggest") {
      return jsonResponse({
        success: true,
        data: {
          suggestions: result.suggestions,
          keyword,
          type,
        },
      });
    }

    // 混合结果或全局搜索结果
    const responseData = {
      books: result.globalResults,
      suggestions: type === "mixed" ? result.suggestions : [],
      keyword,
      type,
      total: result.totalCount,
      hasMore: result.totalCount > count,
    };

    logger.info(
      `Search completed - found ${result.globalResults.length} books, ${result.suggestions.length} suggestions`,
    );

    return jsonResponse({
      success: true,
      data: responseData,
    });
  } catch (error) {
    logger.error("Unified search error:", error);
    return jsonResponse({
      success: false,
      error: `搜索失败: ${error.message}`,
    }, 500);
  }
}
