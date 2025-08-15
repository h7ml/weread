import { buildQueryString, HttpClient } from "../../utils/mod.ts";

const client = new HttpClient("https://weread.qq.com");

/**
 * 统计相关接口类型定义
 */
export interface BookStats {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  totalReadingTime: number;
  totalSessions: number;
  averageSessionTime: number;
  readProgress: number;
  wordCount: number;
  pageCount: number;
  noteCount: number;
  bookmarkCount: number;
  firstReadDate: string;
  lastReadDate: string;
  isFinished: boolean;
  finishDate?: string;
  rating?: number;
  reviewCount: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  bookCount: number;
  finishedBooks: number;
  totalReadingTime: number;
  totalWords: number;
  averageRating: number;
  percentage: number;
  topBooks: {
    bookId: string;
    title: string;
    cover: string;
    readingTime: number;
  }[];
}

export interface AuthorStats {
  authorName: string;
  bookCount: number;
  finishedBooks: number;
  totalReadingTime: number;
  totalWords: number;
  averageRating: number;
  books: {
    bookId: string;
    title: string;
    cover: string;
    readingTime: number;
    isFinished: boolean;
    rating?: number;
  }[];
}

export interface ReadingTrend {
  date: string;
  readingTime: number;
  wordCount: number;
  pageCount: number;
  bookCount: number;
  sessionCount: number;
}

export interface ComparisonStats {
  user: {
    totalTime: number;
    totalBooks: number;
    totalWords: number;
    averageRating: number;
  };
  peers: {
    averageTime: number;
    averageBooks: number;
    averageWords: number;
    averageRating: number;
  };
  percentile: {
    time: number; // 超过了x%的用户
    books: number;
    words: number;
  };
}

export interface OverallStats {
  totalReadingTime: number;
  totalBooks: number;
  finishedBooks: number;
  totalWords: number;
  totalPages: number;
  totalNotes: number;
  totalBookmarks: number;
  totalReviews: number;
  averageRating: number;
  longestStreak: number;
  currentStreak: number;
  firstReadDate: string;
  favoriteCategory: string;
  favoriteAuthor: string;
  readingSpeed: number; // 字/分钟
  mostReadBook: {
    bookId: string;
    title: string;
    cover: string;
    readingTime: number;
  };
}

export interface ReadingHeatmap {
  year: number;
  data: {
    date: string; // YYYY-MM-DD
    count: number; // 阅读时长（分钟）
    level: number; // 0-4 热力等级
  }[];
}

export interface TimeDistribution {
  hours: { hour: number; minutes: number; percentage: number }[];
  weekdays: { day: number; minutes: number; percentage: number }[];
  months: { month: number; minutes: number; percentage: number }[];
}

/**
 * 获取总体统计
 */
export async function getOverallStats(cookie: string): Promise<OverallStats> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>("/web/user/stats/overall", {
    headers,
  });

  return response.stats || {
    totalReadingTime: 0,
    totalBooks: 0,
    finishedBooks: 0,
    totalWords: 0,
    totalPages: 0,
    totalNotes: 0,
    totalBookmarks: 0,
    totalReviews: 0,
    averageRating: 0,
    longestStreak: 0,
    currentStreak: 0,
    firstReadDate: "",
    favoriteCategory: "",
    favoriteAuthor: "",
    readingSpeed: 0,
    mostReadBook: null,
  };
}

/**
 * 获取书籍统计列表
 */
export async function getBookStatsList(
  cookie: string,
  sortBy = "readingTime", // readingTime, progress, sessions, notes
  order = "desc", // desc, asc
  page = 1,
  pageSize = 20,
): Promise<{ books: BookStats[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { sortBy, order, page, pageSize };
  const url = `/web/user/stats/books?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    books: response.books || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取单本书籍详细统计
 */
export async function getBookDetailStats(
  bookId: string,
  cookie: string,
): Promise<
  BookStats & {
    readingSessions: {
      sessionId: string;
      startTime: number;
      endTime: number;
      readingTime: number;
      chapterUid: string;
      chapterTitle: string;
      progressStart: number;
      progressEnd: number;
    }[];
    readingTrend: ReadingTrend[];
  }
> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>(`/web/user/stats/book/${bookId}`, {
    headers,
  });
  return response.stats;
}

/**
 * 获取分类统计
 */
export async function getCategoryStats(
  cookie: string,
): Promise<CategoryStats[]> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>("/web/user/stats/categories", {
    headers,
  });
  return response.categories || [];
}

/**
 * 获取作者统计
 */
export async function getAuthorStats(
  cookie: string,
  page = 1,
  pageSize = 20,
): Promise<{ authors: AuthorStats[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { page, pageSize };
  const url = `/web/user/stats/authors?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    authors: response.authors || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取阅读趋势
 */
export async function getReadingTrend(
  period: "week" | "month" | "quarter" | "year",
  startDate?: string,
  endDate?: string,
  cookie?: string,
): Promise<ReadingTrend[]> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const params: any = { period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const url = `/web/user/stats/trend?${buildQueryString(params)}`;
  const response = await client.get<any>(url, { headers });

  return response.trend || [];
}

/**
 * 获取对比统计
 */
export async function getComparisonStats(
  cookie: string,
): Promise<ComparisonStats> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>("/web/user/stats/comparison", {
    headers,
  });

  return response.comparison || {
    user: { totalTime: 0, totalBooks: 0, totalWords: 0, averageRating: 0 },
    peers: {
      averageTime: 0,
      averageBooks: 0,
      averageWords: 0,
      averageRating: 0,
    },
    percentile: { time: 0, books: 0, words: 0 },
  };
}

/**
 * 获取阅读热力图数据
 */
export async function getReadingHeatmap(
  year: number,
  cookie: string,
): Promise<ReadingHeatmap> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>(
    `/web/user/stats/heatmap?year=${year}`,
    { headers },
  );

  return response.heatmap || { year, data: [] };
}

/**
 * 获取时间分布统计
 */
export async function getTimeDistribution(
  period: "month" | "quarter" | "year",
  cookie: string,
): Promise<TimeDistribution> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>(
    `/web/user/stats/time-distribution?period=${period}`,
    { headers },
  );

  return response.distribution || {
    hours: [],
    weekdays: [],
    months: [],
  };
}

/**
 * 获取阅读成就
 */
export async function getReadingAchievements(cookie: string): Promise<{
  unlocked: {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedDate: string;
    category: string;
  }[];
  available: {
    id: string;
    name: string;
    description: string;
    icon: string;
    progress: number;
    target: number;
    category: string;
  }[];
  categories: string[];
}> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>("/web/user/stats/achievements", {
    headers,
  });

  return {
    unlocked: response.unlocked || [],
    available: response.available || [],
    categories: response.categories || [],
  };
}

/**
 * 获取推荐书籍（基于统计数据）
 */
export async function getRecommendedBooks(
  cookie: string,
  limit = 10,
): Promise<{
  bookId: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  category: string;
  reason: string; // 推荐理由
  similarity: number; // 相似度
}[]> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { limit };
  const url = `/web/user/stats/recommendations?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });
  return response.recommendations || [];
}

/**
 * 导出统计报告
 */
export async function exportStatsReport(
  format: "pdf" | "html" | "json",
  period: "month" | "quarter" | "year",
  cookie: string,
): Promise<Blob> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { format, period };
  const url = `/web/user/stats/export?${buildQueryString(params)}`;

  const response = await fetch(`https://weread.qq.com${url}`, { headers });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return await response.blob();
}

/**
 * 获取全站统计（公开数据）
 */
export async function getGlobalStats(): Promise<{
  totalUsers: number;
  totalBooks: number;
  totalReadingTime: number;
  totalNotes: number;
  totalReviews: number;
  popularCategories: { name: string; count: number }[];
  topBooks: {
    bookId: string;
    title: string;
    author: string;
    cover: string;
    readCount: number;
    rating: number;
  }[];
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}> {
  const response = await client.get<any>("/web/stats/global");

  return response.stats || {
    totalUsers: 0,
    totalBooks: 0,
    totalReadingTime: 0,
    totalNotes: 0,
    totalReviews: 0,
    popularCategories: [],
    topBooks: [],
    activeUsers: { daily: 0, weekly: 0, monthly: 0 },
  };
}
