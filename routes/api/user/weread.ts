import { FreshContext } from "$fresh/server.ts";
import { getWeReadUserInfo, transformUserInfo } from "@/apis";

export async function handler(req: Request, ctx: FreshContext) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const url = new URL(req.url);
  const userVid = url.searchParams.get("userVid");
  const skey = url.searchParams.get("skey");
  const vid = url.searchParams.get("vid");

  if (!userVid || !skey || !vid) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "缺少必要参数: userVid, skey, vid",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    // 调用微信读书API
    const wereadUser = await getWeReadUserInfo(
      parseInt(userVid),
      skey,
      vid
    );

    // 转换为项目内部格式
    const transformedUserInfo = transformUserInfo(wereadUser);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          raw: wereadUser,           // 原始API响应
          transformed: transformedUserInfo,  // 转换后的格式
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("WeRead API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "调用微信读书API失败",
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