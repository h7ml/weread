import { HttpClient, buildQueryString, sign, calcHash, currentTime } from "@/utils";
import { Book, Chapter, ReadProgress } from "@/types";

const client = new HttpClient("https://weread.qq.com");

/**
 * 获取书籍详情
 */
export async function getBookInfo(bookId: string, cookie?: string): Promise<Book> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;
  
  const response = await client.get<any>(`/web/book/info`, {
    headers,
  });
  
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
  };
}

/**
 * 获取章节列表
 */
export async function getChapterList(bookId: string, cookie?: string): Promise<Chapter[]> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;
  
  const params = {
    bookId,
    star: 0,
  };
  
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

/**
 * 获取章节内容
 */
export async function getChapterContent(
  bookId: string,
  chapterUid: string,
  cookie?: string
): Promise<string> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;
  
  const params = {
    bookId,
    chapterUid,
  };
  
  const url = `/web/book/chapter/e_${chapterUid}?${buildQueryString(params)}`;
  const response = await client.get<any>(url, { headers });
  
  return response.html || "";
}

/**
 * 搜索书籍
 */
export async function searchBooks(keyword: string, count = 20): Promise<Book[]> {
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
  cookie: string
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
  cookie: string
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