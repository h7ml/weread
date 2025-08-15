import { FreshContext } from "$fresh/server.ts";
import {
  addBookmark,
  addNote,
  addReview,
  deleteBookmark,
  deleteNote,
  deleteReview,
  getAllNotes,
  getBookmarks,
  getUserReviews,
  updateNote,
  updateReview,
} from "../../src/apis/web/note.ts";

export async function handler(req: Request, ctx: FreshContext) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token") ||
    req.headers.get("Authorization")?.replace("Bearer ", "");
  const type = url.searchParams.get("type") || "notes";

  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "需要登录凭证",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    // 使用与现有API相同的KV查询方式
    const kv = await Deno.openKv();

    let userInfo = null;
    for await (const entry of kv.list({ prefix: ["user"] })) {
      if (entry.value.skey === token) {
        userInfo = entry.value;
        break;
      }
    }

    if (!userInfo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "无效的登录凭证",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 构建cookie字符串
    const cookie =
      `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;

    if (req.method === "GET") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const bookId = url.searchParams.get("bookId");

      let data;

      if (type === "notes") {
        data = await getAllNotes(cookie, page, 20);
      } else if (type === "bookmarks") {
        const bookmarks = await getBookmarks(bookId || undefined, cookie);
        data = {
          bookmarks,
          total: bookmarks.length,
          hasMore: false,
        };
      } else if (type === "reviews") {
        data = await getUserReviews(cookie, page, 20);
      }

      return new Response(
        JSON.stringify({
          success: true,
          data,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      let result;

      if (type === "notes") {
        const {
          bookId,
          chapterUid,
          range,
          content,
          noteType,
          style,
          colorStyle,
        } = body;
        const noteId = await addNote(
          bookId,
          chapterUid,
          range,
          content,
          noteType,
          style,
          colorStyle,
          cookie,
        );
        result = { noteId, message: "笔记创建成功" };
      } else if (type === "bookmarks") {
        const { bookId, chapterUid, chapterOffset, content } = body;
        const bookmarkId = await addBookmark(
          bookId,
          chapterUid,
          chapterOffset,
          content,
          cookie,
        );
        result = { bookmarkId, message: "书签创建成功" };
      } else if (type === "reviews") {
        const { bookId, content, rating, isPublic } = body;
        const reviewId = await addReview(
          bookId,
          content,
          rating,
          isPublic,
          cookie,
        );
        result = { reviewId, message: "书评创建成功" };
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (req.method === "PUT") {
      const body = await req.json();
      let result;

      if (type === "notes") {
        const { noteId, content } = body;
        await updateNote(noteId, content, cookie);
        result = { message: "笔记更新成功" };
      } else if (type === "reviews") {
        const { reviewId, content, rating, isPublic } = body;
        await updateReview(reviewId, content, rating, isPublic, cookie);
        result = { message: "书评更新成功" };
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (req.method === "DELETE") {
      const body = await req.json();
      let result;

      if (type === "notes") {
        const { noteId } = body;
        await deleteNote(noteId, cookie);
        result = { message: "笔记删除成功" };
      } else if (type === "bookmarks") {
        const { bookmarkId } = body;
        await deleteBookmark(bookmarkId, cookie);
        result = { message: "书签删除成功" };
      } else if (type === "reviews") {
        const { reviewId } = body;
        await deleteReview(reviewId, cookie);
        result = { message: "书评删除成功" };
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "不支持的请求方法",
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Notes API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "操作失败",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
