import { buildQueryString, HttpClient } from "../../utils/mod.ts";

const client = new HttpClient("https://weread.qq.com");

/**
 * 评论相关接口类型定义
 */
export interface Comment {
  commentId: string;
  parentId?: string; // 父评论ID，用于回复
  targetType: number; // 1-书评 2-笔记 3-想法
  targetId: string; // 目标ID（书评ID、笔记ID等）
  content: string;
  authorVid: number;
  authorName: string;
  authorAvatar: string;
  createTime: number;
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  replies?: Comment[];
}

export interface Topic {
  topicId: string;
  title: string;
  description: string;
  cover?: string;
  createTime: number;
  authorVid: number;
  authorName: string;
  authorAvatar: string;
  participantCount: number;
  postCount: number;
  isFollowing: boolean;
  isHot: boolean;
  tags: string[];
}

export interface Post {
  postId: string;
  topicId?: string;
  content: string;
  images?: string[];
  authorVid: number;
  authorName: string;
  authorAvatar: string;
  createTime: number;
  updateTime?: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  relatedBook?: {
    bookId: string;
    title: string;
    cover: string;
    author: string;
  };
  location?: string;
  isTop: boolean;
  isHot: boolean;
}

export interface Circle {
  circleId: string;
  name: string;
  description: string;
  avatar: string;
  cover?: string;
  memberCount: number;
  postCount: number;
  isPublic: boolean;
  isJoined: boolean;
  createTime: number;
  adminVid: number;
  tags: string[];
  rules?: string[];
}

/**
 * 获取评论列表
 */
export async function getComments(
  targetType: number,
  targetId: string,
  page = 1,
  pageSize = 20,
  sort = "hot", // hot, new
): Promise<{ comments: Comment[]; hasMore: boolean; total: number }> {
  const params = { targetType, targetId, page, pageSize, sort };
  const url = `/web/comment/list?${buildQueryString(params)}`;

  const response = await client.get<any>(url);

  return {
    comments: response.comments || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 添加评论
 */
export async function addComment(
  targetType: number,
  targetId: string,
  content: string,
  parentId: string | undefined,
  cookie: string,
): Promise<string> {
  const headers: HeadersInit = { Cookie: cookie };

  const body = {
    targetType,
    targetId,
    content,
    parentId,
  };

  try {
    const response = await client.post<any>("/web/comment/add", body, {
      headers,
    });
    return response.commentId;
  } catch (error) {
    console.error("Failed to add comment:", error);
    throw error;
  }
}

/**
 * 删除评论
 */
export async function deleteComment(
  commentId: string,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/comment/delete", { commentId }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to delete comment ${commentId}:`, error);
    throw error;
  }
}

/**
 * 点赞/取消点赞评论
 */
export async function toggleCommentLike(
  commentId: string,
  isLiked: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/comment/like", { commentId, isLiked }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to toggle comment ${commentId} like:`, error);
    throw error;
  }
}

/**
 * 获取话题列表
 */
export async function getTopics(
  category?: string,
  sort = "hot", // hot, new, popular
  page = 1,
  pageSize = 20,
): Promise<{ topics: Topic[]; hasMore: boolean; total: number }> {
  const params: any = { sort, page, pageSize };
  if (category) params.category = category;

  const url = `/web/topic/list?${buildQueryString(params)}`;
  const response = await client.get<any>(url);

  return {
    topics: response.topics || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取话题详情
 */
export async function getTopicDetail(topicId: string): Promise<Topic | null> {
  const response = await client.get<any>(`/web/topic/${topicId}`);
  return response.topic || null;
}

/**
 * 关注/取消关注话题
 */
export async function toggleTopicFollow(
  topicId: string,
  isFollowing: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/topic/follow", { topicId, isFollowing }, {
      headers,
    });
    return true;
  } catch (error) {
    console.error(`Failed to toggle topic ${topicId} follow:`, error);
    throw error;
  }
}

/**
 * 获取动态列表
 */
export async function getPosts(
  type = "recommend", // recommend, following, hot, new
  topicId?: string,
  page = 1,
  pageSize = 20,
  cookie?: string,
): Promise<{ posts: Post[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const params: any = { type, page, pageSize };
  if (topicId) params.topicId = topicId;

  const url = `/web/post/list?${buildQueryString(params)}`;
  const response = await client.get<any>(url, { headers });

  return {
    posts: response.posts || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取动态详情
 */
export async function getPostDetail(
  postId: string,
  cookie?: string,
): Promise<Post | null> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const response = await client.get<any>(`/web/post/${postId}`, { headers });
  return response.post || null;
}

/**
 * 发布动态
 */
export async function createPost(
  content: string,
  images: string[],
  topicId: string | undefined,
  bookId: string | undefined,
  location: string | undefined,
  cookie: string,
): Promise<string> {
  const headers: HeadersInit = { Cookie: cookie };

  const body = {
    content,
    images,
    topicId,
    bookId,
    location,
  };

  try {
    const response = await client.post<any>("/web/post/create", body, {
      headers,
    });
    return response.postId;
  } catch (error) {
    console.error("Failed to create post:", error);
    throw error;
  }
}

/**
 * 删除动态
 */
export async function deletePost(
  postId: string,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/post/delete", { postId }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to delete post ${postId}:`, error);
    throw error;
  }
}

/**
 * 点赞/取消点赞动态
 */
export async function togglePostLike(
  postId: string,
  isLiked: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/post/like", { postId, isLiked }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to toggle post ${postId} like:`, error);
    throw error;
  }
}

/**
 * 收藏/取消收藏动态
 */
export async function togglePostBookmark(
  postId: string,
  isBookmarked: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/post/bookmark", { postId, isBookmarked }, {
      headers,
    });
    return true;
  } catch (error) {
    console.error(`Failed to toggle post ${postId} bookmark:`, error);
    throw error;
  }
}

/**
 * 分享动态
 */
export async function sharePost(
  postId: string,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/post/share", { postId }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to share post ${postId}:`, error);
    throw error;
  }
}

/**
 * 获取圈子列表
 */
export async function getCircles(
  type = "recommend", // recommend, joined, hot
  page = 1,
  pageSize = 20,
  cookie?: string,
): Promise<{ circles: Circle[]; hasMore: boolean; total: number }> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const params = { type, page, pageSize };
  const url = `/web/circle/list?${buildQueryString(params)}`;

  const response = await client.get<any>(url, { headers });

  return {
    circles: response.circles || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}

/**
 * 获取圈子详情
 */
export async function getCircleDetail(
  circleId: string,
  cookie?: string,
): Promise<Circle | null> {
  const headers: HeadersInit = {};
  if (cookie) headers.Cookie = cookie;

  const response = await client.get<any>(`/web/circle/${circleId}`, {
    headers,
  });
  return response.circle || null;
}

/**
 * 加入/退出圈子
 */
export async function toggleCircleJoin(
  circleId: string,
  isJoined: boolean,
  cookie: string,
): Promise<boolean> {
  const headers: HeadersInit = { Cookie: cookie };

  try {
    await client.post("/web/circle/join", { circleId, isJoined }, { headers });
    return true;
  } catch (error) {
    console.error(`Failed to toggle circle ${circleId} join:`, error);
    throw error;
  }
}

/**
 * 搜索内容
 */
export async function searchContent(
  keyword: string,
  type = "all", // all, post, topic, circle, user
  page = 1,
  pageSize = 20,
): Promise<{
  posts: Post[];
  topics: Topic[];
  circles: Circle[];
  users: any[];
  hasMore: boolean;
  total: number;
}> {
  const params = { keyword, type, page, pageSize };
  const url = `/web/search/content?${buildQueryString(params)}`;

  const response = await client.get<any>(url);

  return {
    posts: response.posts || [],
    topics: response.topics || [],
    circles: response.circles || [],
    users: response.users || [],
    hasMore: response.hasMore || false,
    total: response.total || 0,
  };
}
