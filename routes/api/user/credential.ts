import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: FreshContext) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    const kv = await Deno.openKv();

    let userCredentials = null;
    for await (const entry of kv.list({ prefix: ["user"] })) {
      if (entry.value.skey === token) {
        userCredentials = entry.value;
        break;
      }
    }

    if (!userCredentials) {
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

    // 返回用户凭证信息
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          vid: userCredentials.vid,
          skey: userCredentials.skey,
          name: userCredentials.name,
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
    console.error("Get user credential error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "获取用户凭证失败",
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