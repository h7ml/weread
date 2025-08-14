import { HttpClient, buildQueryString } from "@/utils";
import { ShelfBook } from "@/types";

const client = new HttpClient("https://weread.qq.com");

/**
 * 获取书架列表
 */
export async function getShelfBooks(cookie: string): Promise<ShelfBook[]> {
  const headers: HeadersInit = { Cookie: cookie };
  
  const params = {
    synckeys: 0,
    teenmode: 0,
    album: 1,
  };
  
  const url = `/web/shelf/sync?${buildQueryString(params)}`;
  const response = await client.get<any>(url, { headers });
  
  if (!response.books || !Array.isArray(response.books)) {
    return [];
  }
  
  return response.books.map((item: any) => ({
    bookId: item.bookId,
    title: item.title,
    author: item.author,
    cover: item.cover,
    readUpdateTime: item.readUpdateTime,
    readProgress: item.progress,
    markedStatus: item.markedStatus,
    totalWords: item.wordCount,
    finishReading: item.finishReading,
  }));
}

/**
 * 添加到书架
 */
export async function addToShelf(bookId: string, cookie: string): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };
  
  const body = {
    bookIds: [bookId],
    source: 0,
  };
  
  try {
    await client.post("/web/shelf/add", body, { headers });
    return true;
  } catch {
    return false;
  }
}

/**
 * 从书架移除
 */
export async function removeFromShelf(bookId: string, cookie: string): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };
  
  const body = {
    bookIds: [bookId],
  };
  
  try {
    await client.post("/web/shelf/remove", body, { headers });
    return true;
  } catch {
    return false;
  }
}

/**
 * 归档书籍
 */
export async function archiveBook(bookId: string, cookie: string): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };
  
  const body = {
    bookIds: [bookId],
    archive: 1,
  };
  
  try {
    await client.post("/web/shelf/archive", body, { headers });
    return true;
  } catch {
    return false;
  }
}

/**
 * 取消归档
 */
export async function unarchiveBook(bookId: string, cookie: string): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };
  
  const body = {
    bookIds: [bookId],
    archive: 0,
  };
  
  try {
    await client.post("/web/shelf/archive", body, { headers });
    return true;
  } catch {
    return false;
  }
}