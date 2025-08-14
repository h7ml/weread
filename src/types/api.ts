// API响应类型定义

/**
 * 通用API响应
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

/**
 * 分页数据
 */
export interface PageData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 书籍信息
 */
export interface Book {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  intro?: string;
  category?: string;
  totalWords?: number;
  readingCount?: number;
  price?: number;
  rating?: number;
  updateTime?: number;
  finishReading?: number;
  bookStatus?: number;
  format?: string; // 书籍格式：epub, txt 等
}

/**
 * 章节信息
 */
export interface Chapter {
  chapterUid: string;
  chapterIdx: number;
  title: string;
  level: number;
  wordCount?: number;
  price?: number;
  isFree?: boolean;
  content?: string;
}

/**
 * 用户信息
 */
export interface UserInfo {
  vid: number;
  name: string;
  avatar?: string;
  gender?: number;
  vipLevel?: number;
  totalReadingTime?: number;
  booksCount?: number;
  followingCount?: number;
  followerCount?: number;
}

/**
 * 阅读进度
 */
export interface ReadProgress {
  bookId: string;
  chapterUid?: string;
  chapterIdx?: number;
  chapterOffset?: number;
  readingTime?: number;
  percent?: number;
  updateTime?: number;
}

/**
 * 书架信息
 */
export interface ShelfBook extends Book {
  readUpdateTime?: number;
  readProgress?: number;
  markedStatus?: number;
}

/**
 * TTS 语音信息
 */
export interface TTSVoice {
  name: string;
  display_name: string;
  local_name: string;
  short_name: string;
  gender: string;
  locale: string;
  locale_name: string;
  provider: string;
  description?: string;
  sample_rate_hertz?: string;
}

/**
 * 书架同步响应
 */
export interface ShelfSyncResponse {
  books: ShelfBook[];
}

/**
 * 微信读书原始书籍数据
 */
export interface WereadBookItem {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  readUpdateTime?: number;
  progress?: number;
  markedStatus?: number;
  wordCount?: number;
  finishReading?: number;
}

/**
 * 会话初始化响应
 */
export interface SessionInitResponse {
  succ: number;
  [key: string]: unknown;
}
