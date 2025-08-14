import { Handlers } from "fresh/server";

export const handler: Handlers = {
  async GET(_req: Request): Promise<Response> {
    try {
      // OpenXing TTS 支持的语音列表
      const voices = [
        {
          "name": "晓东",
          "short_name": "Dylan",
          "display_name": "晓东",
          "local_name": "晓东",
          "description": "北京胡同里长大的少年",
          "gender": "Male",
          "locale": "zh-CN",
          "locale_name": "中文",
          "provider": "openxing",
        },
        {
          "name": "阿珍",
          "short_name": "Jada",
          "display_name": "阿珍",
          "local_name": "阿珍",
          "description": "风风火火的沪上阿姐",
          "gender": "Female",
          "locale": "zh-CN",
          "locale_name": "中文",
          "provider": "openxing",
        },
        {
          "name": "晴儿",
          "short_name": "Sunny",
          "display_name": "晴儿",
          "local_name": "晴儿",
          "description": "甜到你心里的川妹子",
          "gender": "Female",
          "locale": "zh-CN",
          "locale_name": "中文",
          "provider": "openxing",
        },
        {
          "name": "芊悦",
          "short_name": "Cherry",
          "display_name": "芊悦",
          "local_name": "芊悦",
          "description": "阳光积极、亲切自然的小姐姐",
          "gender": "Female",
          "locale": "zh-CN",
          "locale_name": "中英双语",
          "provider": "openxing",
        },
        {
          "name": "晨煦",
          "short_name": "Ethan",
          "display_name": "晨煦",
          "local_name": "晨煦",
          "description": "阳光、温暖、活力、朝气的北方男孩",
          "gender": "Male",
          "locale": "zh-CN",
          "locale_name": "中英双语",
          "provider": "openxing",
        },
        {
          "name": "千雪",
          "short_name": "Chelsie",
          "display_name": "千雪",
          "local_name": "千雪",
          "description": "二次元虚拟女友",
          "gender": "Female",
          "locale": "zh-CN",
          "locale_name": "中英双语",
          "provider": "openxing",
        },
        {
          "name": "苏瑶",
          "short_name": "Serena",
          "display_name": "苏瑶",
          "local_name": "苏瑶",
          "description": "温柔小姐姐",
          "gender": "Female",
          "locale": "zh-CN",
          "locale_name": "中英双语",
          "provider": "openxing",
        },
      ];

      return new Response(JSON.stringify(voices), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600", // 缓存1小时
        },
      });
    } catch (error) {
      console.error("OpenXing voices API error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to load OpenXing voices",
          message: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
