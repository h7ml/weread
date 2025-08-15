import { buildQueryString, HttpClient } from "../../utils/mod.ts";

const client = new HttpClient("https://weread.qq.com");

/**
 * 笔记相关接口类型定义
 */
export interface Note {
  noteId: string;
  bookId: string;
  chapterUid: string;
  chapterIdx: number;
  chapterTitle: string;
  content: string;
  originalText: string;
  noteType: number; // 1-划线 2-想法 3-书签
  style: number; // 1-直线 2-背景色 3-波浪线
  colorStyle: number; // 颜色样式 0-7
  range: string;
  createTime: number;
  reviewId?: string;
  abstract?: string;
  isFavorite?: boolean;
  isPublic?: boolean;
  isTop?: boolean;
  location?: {
    chapterUid: string;
    chapterOffset: number;
    chapterLength: number;
  };
}

export interface Bookmark {
  bookmarkId: string;
  bookId: string;
  chapterUid: string;
  chapterIdx: number;
  chapterTitle: string;
  chapterOffset: number;
  createTime: number;
  content?: string;
}

export interface Review {
  reviewId: string;
  bookId: string;
  content: string;
  rating: number; // 1-5星
  createTime: number;
  updateTime: number;
  isPublic: boolean;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  abstract?: string;
  noteCount?: number;
}

export interface NoteStats {
  totalNotes: number;
  underlineCount: number;
  thoughtCount: number;
  bookmarkCount: number;
  reviewCount: number;
  publicNoteCount: number;
  favoriteNoteCount: number;
}

/**
 * 获取书籍笔记列表
 */
export async function getBookNotes(
  bookId: string,
  cookie: string,
  noteType?: number,
): Promise<Note[]> {
  const headers: HeadersInit = { Cookie: cookie };

  const params: any = { bookId };
  if (noteType !== undefined) {
    params.noteType = noteType;
  }

  const url = `/web/book/notes?${buildQueryString(params)}`;
  const response = await client.get<any>(url, { headers });

  return response.notes || [];
}

/**
 * 获取用户所有笔记
 */
export async function getAllNotes(
  cookie: string,
  page = 1,
  pageSize = 20,
  noteType?: number,
): Promise<{ notes: Note[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params: any = { page, pageSize };
  if (noteType !== undefined) {
    params.noteType = noteType;
  }

  const url = `/web/user/notes?${buildQueryString(params)}`;
  const response = await client.get<any>(url, { headers });

  return {
    notes: response.notes || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 添加笔记
 */
export async function addNote(
  bookId: string,
  chapterUid: string,
  range: string,
  content: string,
  noteType: number,
  style: number,
  colorStyle: number,
  cookie: string,
): Promise<string> {
  const headers: HeadersInit = { Cookie: cookie };

  const body = {
    bookId,
    chapterUid,
    range,
    content,
    noteType,
    style,
    colorStyle,
  };

  try {
    const response = await client.post<any>("/web/book/note/add", body, {
      headers,
    });
    return response.noteId;
  } catch (error) {
    console.error("Failed to add note:", error);
    throw error;
  }
}

/**
 * 更新笔记
 */
export async function updateNote(
  noteId: string,
  content: string,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  const body = {
    noteId,
    content,
  };

  try {
    await client.post("/web/book/note/update", body, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to update note ${noteId}:`, error);
    throw error;
  }
}

/**
 * 删除笔记
 */
export async function deleteNote(
  noteId: string,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/book/note/delete", { noteId }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to delete note ${noteId}:`, error);
    throw error;
  }
}

/**
 * 收藏/取消收藏笔记
 */
export async function toggleNoteFavorite(
  noteId: string,
  isFavorite: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/book/note/favorite", { noteId, isFavorite }, {
      headers,
    });
    return true;
  } catch (error) {
    console.error(`Failed to toggle note ${noteId} favorite:`, error);
    throw error;
  }
}

/**
 * 设置笔记公开性
 */
export async function setNotePublic(
  noteId: string,
  isPublic: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/book/note/public", { noteId, isPublic }, {
      headers,
    });
    return true;
  } catch (error) {
    console.error(`Failed to set note ${noteId} public:`, error);
    throw error;
  }
}

/**
 * 获取书签列表
 */
export async function getBookmarks(
  bookId?: string,
  cookie?: string,
): Promise<Bookmark[]> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const params: any = {};
  if (bookId) params.bookId = bookId;

  const url = `/web/user/bookmarks?${buildQueryString(params)}`;
  const response = await client.get<any>(url, { headers });

  return response.bookmarks || [];
}

/**
 * 添加书签
 */
export async function addBookmark(
  bookId: string,
  chapterUid: string,
  chapterOffset: number,
  content: string,
  cookie: string,
): Promise<string> {
  const headers: HeadersInit = { Cookie: cookie };

  const body = {
    bookId,
    chapterUid,
    chapterOffset,
    content,
  };

  try {
    const response = await client.post<any>("/web/book/bookmark/add", body, {
      headers,
    });
    return response.bookmarkId;
  } catch (error) {
    console.error("Failed to add bookmark:", error);
    throw error;
  }
}

/**
 * 删除书签
 */
export async function deleteBookmark(
  bookmarkId: string,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/book/bookmark/delete", { bookmarkId }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to delete bookmark ${bookmarkId}:`, error);
    throw error;
  }
}

/**
 * 获取书评列表
 */
export async function getBookReviews(
  bookId: string,
  page = 1,
  pageSize = 20,
  sort = "hot", // hot, new, rating
): Promise<{ reviews: Review[]; hasMore: boolean; total: number }> {
  const params = { bookId, page, pageSize, sort };
  const url = `/web/book/reviews?${buildQueryString(params)}`;

  const response = await client.get<any>(url);

  return {
    reviews: response.reviews || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取用户书评
 */
export async function getUserReviews(
  cookie: string,
  page = 1,
  pageSize = 20,
): Promise<{ reviews: Review[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { page, pageSize };
  const url = `/web/user/reviews?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    reviews: response.reviews || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 添加书评
 */
export async function addReview(
  bookId: string,
  content: string,
  rating: number,
  isPublic: boolean,
  cookie: string,
): Promise<string> {
  const headers: HeadersInit = { Cookie: cookie };

  const body = {
    bookId,
    content,
    rating,
    isPublic,
  };

  try {
    const response = await client.post<any>("/web/book/review/add", body, {
      headers,
    });
    return response.reviewId;
  } catch (error) {
    console.error("Failed to add review:", error);
    throw error;
  }
}

/**
 * 更新书评
 */
export async function updateReview(
  reviewId: string,
  content: string,
  rating: number,
  isPublic: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  const body = {
    reviewId,
    content,
    rating,
    isPublic,
  };

  try {
    await client.post("/web/book/review/update", body, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to update review ${reviewId}:`, error);
    throw error;
  }
}

/**
 * 删除书评
 */
export async function deleteReview(
  reviewId: string,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/book/review/delete", { reviewId }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to delete review ${reviewId}:`, error);
    throw error;
  }
}

/**
 * 点赞/取消点赞书评
 */
export async function toggleReviewLike(
  reviewId: string,
  isLiked: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/book/review/like", { reviewId, isLiked }, {
      headers,
    });
    return true;
  } catch (error) {
    console.error(`Failed to toggle review ${reviewId} like:`, error);
    throw error;
  }
}

/**
 * 获取笔记统计
 */
export async function getNoteStats(cookie: string): Promise<NoteStats> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>("/web/user/note/stats", { headers });

  return response.stats || {
    totalNotes: 0,
    underlineCount: 0,
    thoughtCount: 0,
    bookmarkCount: 0,
    reviewCount: 0,
    publicNoteCount: 0,
    favoriteNoteCount: 0,
  };
}

/**
 * 搜索笔记
 */
export async function searchNotes(
  keyword: string,
  cookie: string,
  bookId?: string,
  noteType?: number,
  page = 1,
  pageSize = 20,
): Promise<{ notes: Note[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params: any = { keyword, page, pageSize };
  if (bookId) params.bookId = bookId;
  if (noteType !== undefined) params.noteType = noteType;

  const url = `/web/user/notes/search?${buildQueryString(params)}`;
  const response = await client.get<any>(url, { headers });

  return {
    notes: response.notes || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}
