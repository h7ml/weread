import { FreshContext } from "$fresh/server.ts";
import {
  getReadingStats,
  getUserInfo,
  getUserProfile,
} from "../../../src/apis/web/user.ts";

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
      // 并行获取用户信息、档案和阅读统计
      const [userInfoData, userProfile, readingStatsData] = await Promise.all([
        getUserInfo(userInfo.vid, cookie).catch(() => null),
        getUserProfile(userInfo.vid, cookie).catch(() => null),
        getReadingStats(cookie).catch(() => null),
      ]);

      const responseData = {
        user: userInfoData || {
          vid: userInfo.vid,
          name: userInfo.name || "用户",
          avatarUrl: "",
          gender: 0,
        },
        profile: userProfile,
        stats: readingStatsData,
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: responseData,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (req.method === "PUT") {
      const body = await req.json();

      // 这里可以添加更新用户信息的逻辑
      // 目前只是返回成功响应
      return new Response(
        JSON.stringify({
          success: true,
          data: { message: "用户信息更新成功" },
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
    console.error("User profile API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "获取用户信息失败",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
