import { FreshContext } from "$fresh/server.ts";
import {
  getReadingStats,
  getUserInfo,
  getUserProfile,
  getWeReadUserInfo,
  transformUserInfo,
} from "@/apis";
import { logger } from "@/utils";

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

    if (req.method === "GET") {
      try {
        // 优先检查KV中是否有完整的用户信息
        if (userInfo.raw && userInfo.transformed) {
          logger.info("Using cached complete user info from KV");
          
          // 构建cookie字符串用于其他API调用
          const cookie = `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;

          // 并行获取统计数据
          const [readingStatsData] = await Promise.all([
            getReadingStats(cookie).catch(() => null),
          ]);

          const responseData = {
            user: userInfo.transformed, // 使用KV中的transformed数据
            profile: userInfo.profileData || null, // 使用KV中的profileData
            stats: readingStatsData,
            raw: userInfo.raw, // 原始数据
            fromCache: true, // 标识来自缓存
            cacheTime: userInfo.loginTime,
          };

          return new Response(
            JSON.stringify({
              success: true,
              data: responseData,
            }),
            {
              status: 200,
              headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            },
          );
        }

        // 如果KV中没有完整信息，使用新的微信读书API获取用户信息
        logger.info("Fetching fresh user info from WeRead API");
        const wereadUser = await getWeReadUserInfo(
          userInfo.vid,
          userInfo.skey,
          userInfo.vid.toString()
        );

        // 转换为项目内部格式
        const transformedUserInfo = transformUserInfo(wereadUser);

        // 更新KV中的完整用户信息
        try {
          const updatedUserData = {
            ...userInfo,
            raw: wereadUser,
            transformed: transformedUserInfo,
            profileData: {
              avatarUrl: transformedUserInfo.avatarUrl,
              wechatName: transformedUserInfo.wechatName,
              gender: transformedUserInfo.gender,
              signature: transformedUserInfo.signature,
              isVip: transformedUserInfo.isVip,
              vipLevel: transformedUserInfo.vipLevel,
              medalInfo: transformedUserInfo.medalInfo,
              location: wereadUser.location,
            },
            lastUpdated: new Date().toISOString(),
          };
          
          await kv.set(["user", userInfo.vid.toString()], updatedUserData);
          logger.info("Updated complete user info in KV");
        } catch (kvUpdateError) {
          logger.warn("Failed to update user info in KV:", kvUpdateError);
        }

        // 构建cookie字符串用于其他API调用
        const cookie = `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;

        // 并行获取其他数据（使用兼容接口）
        const [readingStatsData] = await Promise.all([
          getReadingStats(cookie).catch(() => null),
        ]);

        const responseData = {
          user: transformedUserInfo,
          profile: null, // 暂时不支持，可以后续扩展
          stats: readingStatsData,
          // 包含原始微信读书数据以便调试
          rawWereadUser: wereadUser,
          fromCache: false, // 标识来自API
        };

        return new Response(
          JSON.stringify({
            success: true,
            data: responseData,
          }),
          {
            status: 200,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      } catch (apiError) {
        console.error("WeRead API error:", apiError);
        
        // 如果新API失败，回退到原有方式
        const cookie = `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;
        
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
          fallback: true, // 标识使用了回退方案
        };

        return new Response(
          JSON.stringify({
            success: true,
            data: responseData,
          }),
          {
            status: 200,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }
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
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
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
        details: error.message,
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}
