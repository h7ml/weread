import {
  buildQueryString,
  calcHash,
  chk,
  currentTime,
  dH,
  dS,
  dT,
  HttpClient,
  sign,
} from "@/utils";
import { Book, Chapter, ReadProgress } from "@/types";

const client = new HttpClient("https://weread.qq.com");

/**
 * 获取书籍详情（使用公开接口，不需要登录）
 */
export async function getBookInfo(
  bookId: string,
  cookie?: string,
): Promise<Book> {
  try {
    // 首先尝试使用公开接口
    const publicResponse = await client.post<any>("/web/book/publicinfos", {
      bookIds: [bookId],
    });

    if (publicResponse.data && publicResponse.data.length > 0) {
      const bookData = publicResponse.data[0];
      return {
        bookId: bookData.bookId,
        title: bookData.title,
        author: bookData.author,
        cover: bookData.cover,
        intro: bookData.intro,
        category: bookData.category,
        totalWords: bookData.wordCount,
        price: bookData.price,
        rating: bookData.newRating,
        updateTime: bookData.updateTime,
        format: bookData.format || "epub",
      };
    }

    throw new Error("Book not found in public API");
  } catch (error) {
    // 如果公开接口失败，尝试使用登录接口
    if (cookie) {
      const headers: HeadersInit = { Cookie: cookie };
      const response = await client.get<any>(
        `/web/book/info?bookId=${bookId}`,
        { headers },
      );

      return {
        bookId: response.bookId,
        title: response.title,
        author: response.author,
        cover: response.cover,
        intro: response.intro,
        category: response.category,
        totalWords: response.wordCount,
        price: response.price,
        rating: response.newRating,
        updateTime: response.updateTime,
        format: response.format || "epub",
      };
    }

    throw error;
  }
}

/**
 * 获取章节列表（使用新的接口）
 */
export async function getChapterList(
  bookId: string,
  cookie?: string,
): Promise<Chapter[]> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  try {
    // 使用 publicchapterInfos 接口
    const response = await client.post<any>("/web/book/publicchapterInfos", {
      bookIds: [bookId],
    }, { headers });

    // 检查响应格式：{data: [{bookId: "...", updated: [...]}]}
    if (
      !response.data || !Array.isArray(response.data) ||
      response.data.length === 0
    ) {
      return [];
    }

    const bookData = response.data.find((item: any) => item.bookId === bookId);
    if (!bookData || !bookData.updated || !Array.isArray(bookData.updated)) {
      return [];
    }

    return bookData.updated.map((item: any) => ({
      chapterUid: item.chapterUid,
      chapterIdx: item.chapterIdx,
      title: item.title,
      level: item.level,
      wordCount: item.wordCount,
      price: item.price,
      isFree: item.price === 0,
      anchors: item.anchors || [],
    }));
  } catch (_error) {
    // 如果新接口失败，尝试旧接口
    const params = { bookId, star: 0 };
    const url = `/web/book/chapterInfos?${buildQueryString(params)}`;
    const response = await client.get<any>(url, { headers });

    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }

    return response.data.map((item: any) => ({
      chapterUid: item.chapterUid,
      chapterIdx: item.chapterIdx,
      title: item.title,
      level: item.level,
      wordCount: item.wordCount,
      price: item.price,
      isFree: item.free === 1,
    }));
  }
}

/**
 * 获取章节内容的单个分片
 */
async function getChapterFragment(
  endpoint: string,
  bookId: string,
  chapterUid: string,
  st: number,
  cookie?: string,
): Promise<string> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const payload: Record<string, any> = {
    "b": calcHash(bookId),
    "c": calcHash(chapterUid),
    "r": Math.pow(Math.floor(10000 * Math.random()), 2),
    "st": st,
    "ct": currentTime(),
    "ps": "a2b325707a19e580g0186a2",
    "pc": "430321207a19e581g013ab0",
  };

  payload.s = sign(payload);

  const response = await client.post<string>(endpoint, payload, { headers });

  if (typeof response === "string" && response.length > 0) {
    return chk(response);
  }

  return "";
}

/**
 * 获取章节内容（支持epub和txt格式）
 */
export async function getChapterContent(
  bookId: string,
  chapterUid: string,
  cookie?: string,
  format: string = "epub",
): Promise<string> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  try {
    if (format === "epub") {
      // EPUB格式：需要获取4个分片
      const [e0, e1, e2, e3] = await Promise.all([
        getChapterFragment(
          "/web/book/chapter/e_0",
          bookId,
          chapterUid,
          0,
          cookie,
        ),
        getChapterFragment(
          "/web/book/chapter/e_1",
          bookId,
          chapterUid,
          0,
          cookie,
        ),
        getChapterFragment(
          "/web/book/chapter/e_2",
          bookId,
          chapterUid,
          1,
          cookie,
        ),
        getChapterFragment(
          "/web/book/chapter/e_3",
          bookId,
          chapterUid,
          0,
          cookie,
        ),
      ]);

      if (e0 && e1 && e3) {
        const style = dS(e2);
        const html = dH(e0 + e1 + e3);

        // 处理HTML内容
        let processedHtml = html;

        // 移除base64占位图
        processedHtml = processedHtml.replace(
          /(<img[^>]+?)(src="data:[^"]+")/g,
          "$1",
        );

        // 将data-src替换为src
        processedHtml = processedHtml.replace(
          /(<img[^>]+?)data-src="/g,
          '$1src="',
        );

        // 如果有样式，内嵌到HTML中
        if (style) {
          processedHtml = `<style>${style}</style>${processedHtml}`;
        }

        return processedHtml;
      }
    } else {
      // TXT格式：获取2个分片
      const [t0, t1] = await Promise.all([
        getChapterFragment(
          "/web/book/chapter/t_0",
          bookId,
          chapterUid,
          0,
          cookie,
        ),
        getChapterFragment(
          "/web/book/chapter/t_1",
          bookId,
          chapterUid,
          1,
          cookie,
        ),
      ]);

      if (t0 && t1) {
        return dT(t0 + t1);
      }
    }

    throw new Error("Failed to download chapter content");
  } catch (error) {
    console.error("Error getting chapter content:", error);
    throw new Error(`获取章节内容失败: ${error.message}`);
  }
}

/**
 * 搜索书籍
 */
export async function searchBooks(
  keyword: string,
  count = 20,
): Promise<Book[]> {
  const params = {
    keyword,
    maxIdx: 0,
    count,
    fragmentSize: 120,
    onlyBook: 1,
  };

  const url = `/web/search/searchBooks?${buildQueryString(params)}`;
  const response = await client.get<any>(url);

  if (!response.books || !Array.isArray(response.books)) {
    return [];
  }

  return response.books.map((item: any) => ({
    bookId: item.bookInfo.bookId,
    title: item.bookInfo.title,
    author: item.bookInfo.author,
    cover: item.bookInfo.cover,
    intro: item.bookInfo.intro,
    category: item.bookInfo.category,
    price: item.bookInfo.price,
    rating: item.bookInfo.newRating,
  }));
}

/**
 * 获取阅读进度
 */
export async function getReadProgress(
  bookId: string,
  cookie: string,
): Promise<ReadProgress | null> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = {
    bookId,
    readingDetail: 1,
    readingBookIndex: 1,
  };

  const url = `/web/book/read/info?${buildQueryString(params)}`;
  const response = await client.get<any>(url, { headers });

  if (!response.data) {
    return null;
  }

  return {
    bookId,
    chapterUid: response.data.chapterUid,
    chapterIdx: response.data.chapterIdx,
    chapterOffset: response.data.chapterOffset,
    readingTime: response.data.readingTime,
    percent: response.data.progress,
    updateTime: response.data.updateTime,
  };
}

/**
 * 更新阅读进度
 */
export async function updateReadProgress(
  bookId: string,
  chapterUid: string,
  chapterOffset: number,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  const appId = "web";
  const ct = currentTime();

  const params = {
    bookId,
    chapterUid,
    chapterOffset,
    appId,
    ct,
  };

  // 添加签名
  const signData = {
    bookId: calcHash(bookId),
    chapterUid: calcHash(chapterUid),
    chapterOffset,
    appId,
    ct,
  };

  const s = sign(signData);
  const body = { ...params, s };

  try {
    await client.post("/web/book/read/update", body, { headers });
    return true;
  } catch {
    return false;
  }
}
