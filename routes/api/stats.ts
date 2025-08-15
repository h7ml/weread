import { FreshContext } from "$fresh/server.ts";
import {
  getBookStatsList,
  getCategoryStats,
  getOverallStats,
  getReadingAchievements,
  getReadingHeatmap,
  getReadingTrend,
  getTimeDistribution,
} from "@/apis";

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
      JSON.stringify({
        success: false,
        error: "不支持的请求方法",
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token") ||
    req.headers.get("Authorization")?.replace("Bearer ", "");
  const type = url.searchParams.get("type") || "overview";
  const timeRange = url.searchParams.get("timeRange") || "month";

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

    const cookie =
      `wr_vid=${userInfo.vid}; wr_skey=${userInfo.skey}; wr_rt=${userInfo.rt}`;
    let data;

    if (type === "overview") {
      // 并行获取总体统计、分类统计和成就
      const [overallStats, categoryStats, achievements, heatmapData] =
        await Promise.all([
          getOverallStats(cookie).catch(() => null),
          getCategoryStats(cookie).catch(() => []),
          getReadingAchievements(cookie).catch(() => ({
            unlocked: [],
            available: [],
            categories: [],
          })),
          getReadingHeatmap(new Date().getFullYear(), cookie).catch(() => ({
            year: new Date().getFullYear(),
            data: [],
          })),
        ]);

      data = {
        overview: overallStats,
        favoriteCategories: categoryStats.slice(0, 5),
        achievements,
        heatmapData,
      };
    } else if (type === "history") {
      const page = parseInt(url.searchParams.get("page") || "1");
      data = await getBookStatsList(cookie, "readingTime", "desc", page, 20);
    } else if (type === "timeline") {
      // 获取阅读趋势数据作为时间线
      const trendData = await getReadingTrend(
        timeRange as any,
        undefined,
        undefined,
        cookie,
      );

      data = {
        timeline: trendData.map((trend) => ({
          date: trend.date,
          events: [
            {
              type: "reading",
              time: "全天",
              content: `阅读了 ${trend.readingTime} 分钟`,
              duration: trend.readingTime,
            },
          ],
        })),
      };
    } else if (type === "trends") {
      data = await getReadingTrend(
        timeRange as any,
        undefined,
        undefined,
        cookie,
      );
    } else if (type === "distribution") {
      data = await getTimeDistribution(timeRange as any, cookie);
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
  } catch (error) {
    console.error("Reading stats API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "获取阅读统计失败",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
