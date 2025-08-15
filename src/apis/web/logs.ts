import { buildQueryString, HttpClient } from "../../utils/mod.ts";

const client = new HttpClient("https://weread.qq.com");

/**
 * 日志相关接口类型定义
 */
export interface ReadingLog {
  logId: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  bookAuthor: string;
  chapterUid: string;
  chapterTitle: string;
  chapterIdx: number;
  startTime: number;
  endTime: number;
  readingTime: number; // 秒
  readProgress: number; // 0-100
  wordCount: number;
  pageCount: number;
  device: string; // web, ios, android
  actionType: number; // 1-开始阅读 2-结束阅读 3-暂停 4-恢复
  date: string; // YYYY-MM-DD
}

export interface DailyStats {
  date: string;
  totalReadingTime: number;
  totalWords: number;
  totalPages: number;
  bookCount: number;
  sessionCount: number;
  books: {
    bookId: string;
    title: string;
    cover: string;
    readingTime: number;
    wordCount: number;
    progress: number;
  }[];
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  totalReadingTime: number;
  totalWords: number;
  totalPages: number;
  bookCount: number;
  dailyStats: DailyStats[];
  mostReadBook?: {
    bookId: string;
    title: string;
    cover: string;
    readingTime: number;
  };
}

export interface MonthlyStats {
  year: number;
  month: number;
  totalReadingTime: number;
  totalWords: number;
  totalPages: number;
  bookCount: number;
  finishedBooks: number;
  averageDaily: number;
  streak: number; // 连续阅读天数
  dailyStats: DailyStats[];
  topBooks: {
    bookId: string;
    title: string;
    cover: string;
    author: string;
    readingTime: number;
    wordCount: number;
  }[];
}

export interface YearlyStats {
  year: number;
  totalReadingTime: number;
  totalWords: number;
  totalPages: number;
  bookCount: number;
  finishedBooks: number;
  averageDaily: number;
  longestStreak: number;
  monthlyStats: MonthlyStats[];
  achievements: {
    id: string;
    name: string;
    description: string;
    unlockedDate: string;
  }[];
}

export interface ReadingStreak {
  currentStreak: number;
  longestStreak: number;
  streakStart: string;
  streakEnd: string;
  isActive: boolean;
  lastReadDate: string;
}

export interface ReadingGoal {
  goalId: string;
  type: "time" | "books" | "pages" | "words";
  target: number;
  current: number;
  period: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  completedDate?: string;
}

/**
 * 获取阅读日志
 */
export async function getReadingLogs(
  cookie: string,
  startDate?: string,
  endDate?: string,
  bookId?: string,
  page = 1,
  pageSize = 50,
): Promise<{ logs: ReadingLog[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params: any = { page, pageSize };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (bookId) params.bookId = bookId;

  const url = `/web/user/reading/logs?${buildQueryString(params)}`;
  const response = await client.get<any>(url, { headers });

  return {
    logs: response.logs || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 记录阅读行为
 */
export async function logReadingAction(
  bookId: string,
  chapterUid: string,
  actionType: number,
  readingTime: number,
  wordCount: number,
  pageCount: number,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  const body = {
    bookId,
    chapterUid,
    actionType,
    readingTime,
    wordCount,
    pageCount,
    timestamp: Date.now(),
    device: "web",
  };

  try {
    await client.post("/web/user/reading/log", body, { headers });
    return true;
  } catch (error) {
    console.error("Failed to log reading action:", error);
    throw error;
  }
}

/**
 * 获取每日统计
 */
export async function getDailyStats(
  date: string,
  cookie: string,
): Promise<DailyStats | null> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>(`/web/user/stats/daily?date=${date}`, {
    headers,
  });
  return response.stats || null;
}

/**
 * 获取周统计
 */
export async function getWeeklyStats(
  weekStart: string,
  cookie: string,
): Promise<WeeklyStats | null> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>(
    `/web/user/stats/weekly?weekStart=${weekStart}`,
    { headers },
  );
  return response.stats || null;
}

/**
 * 获取月统计
 */
export async function getMonthlyStats(
  year: number,
  month: number,
  cookie: string,
): Promise<MonthlyStats | null> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { year, month };
  const url = `/web/user/stats/monthly?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });
  return response.stats || null;
}

/**
 * 获取年统计
 */
export async function getYearlyStats(
  year: number,
  cookie: string,
): Promise<YearlyStats | null> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>(
    `/web/user/stats/yearly?year=${year}`,
    { headers },
  );
  return response.stats || null;
}

/**
 * 获取阅读连续天数
 */
export async function getReadingStreak(cookie: string): Promise<ReadingStreak> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>("/web/user/reading/streak", {
    headers,
  });

  return response.streak || {
    currentStreak: 0,
    longestStreak: 0,
    streakStart: "",
    streakEnd: "",
    isActive: false,
    lastReadDate: "",
  };
}

/**
 * 获取阅读时长排行榜
 */
export async function getReadingRanking(
  type = "time", // time, books, pages, words
  period = "monthly", // daily, weekly, monthly, yearly
  page = 1,
  pageSize = 50,
): Promise<{
  rankings: {
    rank: number;
    vid: number;
    name: string;
    avatar: string;
    value: number;
    isCurrentUser: boolean;
  }[];
  currentUserRank?: number;
  hasMore: boolean;
  total: number;
}> {
  const params = { type, period, page, pageSize };
  const url = `/web/user/reading/ranking?${buildQueryString(params)}`;

  const response = await client.get<any>(url);

  return {
    rankings: response.rankings || [],
    currentUserRank: response.currentUserRank,
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取阅读目标
 */
export async function getReadingGoals(cookie: string): Promise<ReadingGoal[]> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>("/web/user/reading/goals", {
    headers,
  });
  return response.goals || [];
}

/**
 * 设置阅读目标
 */
export async function setReadingGoal(
  type: "time" | "books" | "pages" | "words",
  target: number,
  period: "daily" | "weekly" | "monthly" | "yearly",
  cookie: string,
): Promise<string> {
  const headers: HeadersInit = { Cookie: cookie };

  const body = {
    type,
    target,
    period,
    startDate: new Date().toISOString().split("T")[0],
  };

  try {
    const response = await client.post<any>("/web/user/reading/goal", body, {
      headers,
    });
    return response.goalId;
  } catch (error) {
    console.error("Failed to set reading goal:", error);
    throw error;
  }
}

/**
 * 更新阅读目标
 */
export async function updateReadingGoal(
  goalId: string,
  target: number,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/user/reading/goal/update", { goalId, target }, {
      headers,
    });
    return true;
  } catch (error) {
    console.error(`Failed to update reading goal ${goalId}:`, error);
    throw error;
  }
}

/**
 * 删除阅读目标
 */
export async function deleteReadingGoal(
  goalId: string,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/user/reading/goal/delete", { goalId }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to delete reading goal ${goalId}:`, error);
    throw error;
  }
}

/**
 * 获取阅读习惯分析
 */
export async function getReadingHabits(cookie: string): Promise<{
  preferredTimes: { hour: number; count: number }[];
  preferredDuration: { range: string; percentage: number }[];
  deviceUsage: { device: string; percentage: number }[];
  readingSpeed: { avgWordsPerMinute: number; trend: "up" | "down" | "stable" };
  weeklyPattern: { day: number; avgTime: number }[];
  monthlyTrend: { month: string; time: number; books: number }[];
}> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>("/web/user/reading/habits", {
    headers,
  });

  return response.habits || {
    preferredTimes: [],
    preferredDuration: [],
    deviceUsage: [],
    readingSpeed: { avgWordsPerMinute: 0, trend: "stable" },
    weeklyPattern: [],
    monthlyTrend: [],
  };
}

/**
 * 导出阅读数据
 */
export async function exportReadingData(
  format: "json" | "csv" | "xlsx",
  startDate: string,
  endDate: string,
  cookie: string,
): Promise<Blob> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { format, startDate, endDate };
  const url = `/web/user/reading/export?${buildQueryString(params)}`;

  const response = await fetch(`https://weread.qq.com${url}`, { headers });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return await response.blob();
}
