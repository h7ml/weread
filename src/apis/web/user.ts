import { buildQueryString, HttpClient } from "../../utils/mod.ts";

const client = new HttpClient("https://weread.qq.com");

/**
 * 用户相关接口类型定义
 */
export interface UserInfo {
  vid: number;
  name: string;
  avatarUrl: string;
  wechatName?: string;
  gender: number;
  location?: string;
  signature?: string;
  level?: number;
  experience?: number;
  followCount?: number;
  followerCount?: number;
  friendCount?: number;
  isVip?: boolean;
  vipLevel?: number;
}

export interface UserProfile {
  userInfo: UserInfo;
  readingData: {
    totalReadingTime: number;
    totalBooks: number;
    finishedBooks: number;
    daysCount: number;
    averageSpeed: number;
  };
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedTime?: number;
}

export interface Friend {
  vid: number;
  name: string;
  avatarUrl: string;
  signature?: string;
  isFollowing: boolean;
  isFollower: boolean;
  isFriend: boolean;
  lastReadBook?: {
    bookId: string;
    title: string;
    cover: string;
  };
}

export interface ReadingStats {
  today: {
    readingTime: number;
    readPages: number;
    readWords: number;
  };
  thisWeek: {
    readingTime: number;
    readPages: number;
    readWords: number;
    daysCount: number;
  };
  thisMonth: {
    readingTime: number;
    readPages: number;
    readWords: number;
    daysCount: number;
  };
  total: {
    readingTime: number;
    readPages: number;
    readWords: number;
    daysCount: number;
    booksCount: number;
  };
}

/**
 * 获取用户基本信息
 */
export async function getUserInfo(
  vid: number,
  cookie: string,
): Promise<UserInfo> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>(`/web/user/info?userVid=${vid}`, {
    headers,
  });

  return {
    vid: response.vid,
    name: response.name,
    avatarUrl: response.avatarUrl,
    wechatName: response.wechatName,
    gender: response.gender,
    location: response.location,
    signature: response.signature,
    level: response.level,
    experience: response.experience,
    followCount: response.followCount,
    followerCount: response.followerCount,
    friendCount: response.friendCount,
    isVip: response.isVip,
    vipLevel: response.vipLevel,
  };
}

/**
 * 获取用户详细档案
 */
export async function getUserProfile(
  vid: number,
  cookie: string,
): Promise<UserProfile> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>(`/web/user/profile?userVid=${vid}`, {
    headers,
  });

  return {
    userInfo: response.userInfo,
    readingData: response.readingData,
    achievements: response.achievements || [],
  };
}

/**
 * 获取用户阅读统计
 */
export async function getReadingStats(cookie: string): Promise<ReadingStats> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>("/web/user/reading/stats", {
    headers,
  });

  return response;
}

/**
 * 获取好友列表
 */
export async function getFriends(
  cookie: string,
  page = 1,
  pageSize = 20,
): Promise<{ friends: Friend[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { page, pageSize };
  const url = `/web/user/friends?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    friends: response.friends || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取关注列表
 */
export async function getFollowing(
  cookie: string,
  page = 1,
  pageSize = 20,
): Promise<{ users: Friend[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { page, pageSize };
  const url = `/web/user/following?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    users: response.users || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取粉丝列表
 */
export async function getFollowers(
  cookie: string,
  page = 1,
  pageSize = 20,
): Promise<{ users: Friend[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = { Cookie: cookie };

  const params = { page, pageSize };
  const url = `/web/user/followers?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    users: response.users || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 关注用户
 */
export async function followUser(
  vid: number,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/user/follow", { userVid: vid }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to follow user ${vid}:`, error);
    throw error;
  }
}

/**
 * 取消关注用户
 */
export async function unfollowUser(
  vid: number,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/user/unfollow", { userVid: vid }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to unfollow user ${vid}:`, error);
    throw error;
  }
}

/**
 * 更新用户签名
 */
export async function updateSignature(
  signature: string,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/user/signature", { signature }, { headers });
    return true;
  } catch (error) {
    console.error("Failed to update signature:", error);
    throw error;
  }
}

/**
 * 获取用户成就列表
 */
export async function getUserAchievements(
  cookie: string,
): Promise<Achievement[]> {
  const headers: HeadersInit = { Cookie: cookie };

  const response = await client.get<any>("/web/user/achievements", { headers });

  return response.achievements || [];
}

/**
 * 搜索用户
 */
export async function searchUsers(
  keyword: string,
  page = 1,
  pageSize = 20,
): Promise<{ users: UserInfo[]; hasMore: boolean; total: number }> {
  const params = { keyword, page, pageSize };
  const url = `/web/user/search?${buildQueryString(params)}`;

  const response = await client.get<any>(url);

  return {
    users: response.users || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}
