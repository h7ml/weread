import { buildQueryString, HttpClient } from "../../utils/mod.ts";

const client = new HttpClient("https://weread.qq.com");

/**
 * 公众号相关接口类型定义
 */
export interface MPAccount {
  mpId: string;
  name: string;
  avatar: string;
  description: string;
  isVerified: boolean;
  followerCount: number;
  articleCount: number;
  isFollowed: boolean;
  createTime: number;
  categories: string[];
  tags: string[];
}

export interface MPArticle {
  articleId: string;
  mpId: string;
  mpName: string;
  mpAvatar: string;
  title: string;
  content: string;
  summary: string;
  cover?: string;
  images?: string[];
  publishTime: number;
  readCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isOriginal: boolean;
  author?: string;
  url: string;
  wordCount: number;
  readingTime: number; // 预估阅读时间（分钟）
  categories: string[];
  tags: string[];
  relatedBooks?: {
    bookId: string;
    title: string;
    cover: string;
    author: string;
  }[];
}

export interface MPRecommendation {
  mpId: string;
  name: string;
  avatar: string;
  description: string;
  followerCount: number;
  recentArticles: MPArticle[];
  reason: string; // 推荐理由
  similarity: number; // 相似度
  categories: string[];
}

export interface ReadingList {
  listId: string;
  title: string;
  description: string;
  cover?: string;
  articleCount: number;
  followerCount: number;
  isPublic: boolean;
  isFollowed: boolean;
  createTime: number;
  updateTime: number;
  authorVid: number;
  authorName: string;
  authorAvatar: string;
  categories: string[];
  articles: MPArticle[];
}

/**
 * 获取关注的公众号列表
 */
export async function getFollowedMPAccounts(
  cookie: string,
  page = 1,
  pageSize = 20,
): Promise<{ accounts: MPAccount[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { page, pageSize };
  const url = `/web/mp/following?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    accounts: response.accounts || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 搜索公众号
 */
export async function searchMPAccounts(
  keyword: string,
  page = 1,
  pageSize = 20,
): Promise<{ accounts: MPAccount[]; hasMore: boolean; total: number }> {
  const params = { keyword, page, pageSize };
  const url = `/web/mp/search?${buildQueryString(params)}`;

  const response = await client.get<any>(url);

  return {
    accounts: response.accounts || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取公众号详情
 */
export async function getMPAccountDetail(
  mpId: string,
  cookie?: string,
): Promise<MPAccount | null> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const response = await client.get<any>(`/web/mp/${mpId}`, { headers });
  return response.account || null;
}

/**
 * 关注/取消关注公众号
 */
export async function toggleMPFollow(
  mpId: string,
  isFollowed: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/mp/follow", { mpId, isFollowed }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to toggle MP ${mpId} follow:`, error);
    throw error;
  }
}

/**
 * 获取公众号文章列表
 */
export async function getMPArticles(
  mpId: string,
  page = 1,
  pageSize = 20,
  cookie?: string,
): Promise<{ articles: MPArticle[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const params = { page, pageSize };
  const url = `/web/mp/${mpId}/articles?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    articles: response.articles || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取推荐文章流
 */
export async function getRecommendedArticles(
  type = "recommend", // recommend, following, hot, latest
  page = 1,
  pageSize = 20,
  cookie?: string,
): Promise<{ articles: MPArticle[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const params = { type, page, pageSize };
  const url = `/web/mp/articles?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    articles: response.articles || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取文章详情
 */
export async function getArticleDetail(
  articleId: string,
  cookie?: string,
): Promise<MPArticle | null> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const response = await client.get<any>(`/web/mp/article/${articleId}`, {
    headers,
  });
  return response.article || null;
}

/**
 * 点赞/取消点赞文章
 */
export async function toggleArticleLike(
  articleId: string,
  isLiked: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/mp/article/like", { articleId, isLiked }, {
      headers,
    });
    return true;
  } catch (error) {
    console.error(`Failed to toggle article ${articleId} like:`, error);
    throw error;
  }
}

/**
 * 收藏/取消收藏文章
 */
export async function toggleArticleBookmark(
  articleId: string,
  isBookmarked: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/mp/article/bookmark", { articleId, isBookmarked }, {
      headers,
    });
    return true;
  } catch (error) {
    console.error(`Failed to toggle article ${articleId} bookmark:`, error);
    throw error;
  }
}

/**
 * 分享文章
 */
export async function shareArticle(
  articleId: string,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/mp/article/share", { articleId }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to share article ${articleId}:`, error);
    throw error;
  }
}

/**
 * 搜索文章
 */
export async function searchArticles(
  keyword: string,
  mpId?: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  pageSize = 20,
): Promise<{ articles: MPArticle[]; hasMore: boolean; total: number }> {
  const params: any = { keyword, page, pageSize };
  if (mpId) params.mpId = mpId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const url = `/web/mp/articles/search?${buildQueryString(params)}`;
  const response = await client.get<any>(url);

  return {
    articles: response.articles || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取收藏的文章
 */
export async function getBookmarkedArticles(
  cookie: string,
  page = 1,
  pageSize = 20,
): Promise<{ articles: MPArticle[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { page, pageSize };
  const url = `/web/mp/bookmarks?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    articles: response.articles || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取阅读历史
 */
export async function getArticleHistory(
  cookie: string,
  page = 1,
  pageSize = 20,
): Promise<{ articles: MPArticle[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { page, pageSize };
  const url = `/web/mp/history?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    articles: response.articles || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取推荐公众号
 */
export async function getRecommendedMPAccounts(
  cookie: string,
  limit = 10,
): Promise<MPRecommendation[]> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { limit };
  const url = `/web/mp/recommendations?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });
  return response.recommendations || [];
}

/**
 * 获取热门公众号
 */
export async function getHotMPAccounts(
  category?: string,
  page = 1,
  pageSize = 20,
): Promise<{ accounts: MPAccount[]; hasMore: boolean; total: number }> {
  const params: any = { page, pageSize };
  if (category) params.category = category;

  const url = `/web/mp/hot?${buildQueryString(params)}`;
  const response = await client.get<any>(url);

  return {
    accounts: response.accounts || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取分类列表
 */
export async function getMPCategories(): Promise<{
  id: string;
  name: string;
  accountCount: number;
  articleCount: number;
}[]> {
  const response = await client.get<any>("/web/mp/categories");
  return response.categories || [];
}

/**
 * 创建阅读清单
 */
export async function createReadingList(
  title: string,
  description: string,
  isPublic: boolean,
  cover: string | undefined,
  articleIds: string[],
  cookie: string,
): Promise<string> {
  const headers: HeadersInit = { Cookie: cookie };

  const body = {
    title,
    description,
    isPublic,
    cover,
    articleIds,
  };

  try {
    const response = await client.post<any>("/web/mp/reading-list", body, {
      headers,
    });
    return response.listId;
  } catch (error) {
    console.error("Failed to create reading list:", error);
    throw error;
  }
}

/**
 * 获取阅读清单
 */
export async function getReadingLists(
  type = "my", // my, following, hot
  page = 1,
  pageSize = 20,
  cookie?: string,
): Promise<{ lists: ReadingList[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const params = { type, page, pageSize };
  const url = `/web/mp/reading-lists?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    lists: response.lists || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 关注/取消关注阅读清单
 */
export async function toggleReadingListFollow(
  listId: string,
  isFollowed: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/mp/reading-list/follow", { listId, isFollowed }, {
      headers,
    });
    return true;
  } catch (error) {
    console.error(`Failed to toggle reading list ${listId} follow:`, error);
    throw error;
  }
}
