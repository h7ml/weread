import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: FreshContext) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json();
    const { vid, skey, name } = body;

    if (!vid || !skey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "缺少必要参数: vid, skey",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const kv = await Deno.openKv();

    // 更新用户凭证
    const userKey = ["user", vid];
    const userData = {
      vid: parseInt(vid),
      skey: skey,
      name: name || "微信读书用户",
      rt: "test", // 可以根据需要设置
      loginTime: Date.now(),
    };

    await kv.set(userKey, userData);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: "用户凭证更新成功",
          user: userData,
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
    console.error("Update credential error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "更新用户凭证失败",
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