import { logger } from "@/utils";

/**
 * 退出登录API
 * 清除服务端会话和客户端存储
 */
export async function handler(req: Request): Promise<Response> {
  try {
    logger.info("User logout request");

    // 获取用户token（从query参数或Authorization header）
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || 
                  req.headers.get("Authorization")?.replace("Bearer ", "");

    if (token) {
      try {
        // 如果有token，尝试清除服务端KV存储中的用户会话数据
        const kv = await Deno.openKv();
        
        // 清除所有可能的用户相关数据
        // 注意：这里我们无法直接通过token找到vid，但可以清除一些通用数据
        await kv.delete(["session", token]);
        await kv.delete(["user_token", token]);
        
        logger.info(`Cleared server session for token: ${token.substring(0, 8)}...`);
      } catch (kvError) {
        logger.warn("Failed to clear server session:", kvError);
        // 继续执行，不阻塞登出过程
      }
    }

    // 返回成功响应，客户端会清除localStorage
    return new Response(
      JSON.stringify({
        success: true,
        message: "退出登录成功",
        data: {
          logoutTime: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    logger.error("Logout error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "退出登录失败",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}