import { TTSVoice } from "@/types";

export const handler = {
  async GET(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const engine = url.searchParams.get("engine") || "all"; // 引擎选择：leftsite, openxing, all

    try {
      let allVoices: TTSVoice[] = [];

      // 根据引擎参数返回不同的语音列表
      if (engine === "leftsite" || engine === "all") {
        // 首先尝试从 t.leftsite.cn 获取语音列表
        try {
          console.log("获取 Leftsite 语音列表");

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch("https://t.leftsite.cn/voices", {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
              "Accept": "application/json",
              "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const leftsiteVoices = await response.json();
            console.log(
              "成功获取 Leftsite 语音列表:",
              leftsiteVoices.length,
              "个语音",
            );

            // 为每个语音添加provider标识
            const processedVoices = leftsiteVoices.map((voice: TTSVoice) => ({
              ...voice,
              provider: "leftsite",
            }));

            allVoices = allVoices.concat(processedVoices);
          }
        } catch (fetchError) {
          console.warn("获取 Leftsite 语音列表失败:", fetchError);
        }
      }

      if (engine === "openxing" || engine === "all") {
        // 添加 OpenXing 语音列表
        const openxingVoices = [
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

        allVoices = allVoices.concat(openxingVoices);
        console.log("添加 OpenXing 语音列表:", openxingVoices.length, "个语音");
      }

      // 如果没有获取到任何语音，提供备用列表
      if (allVoices.length === 0) {
        console.log("使用备用语音列表");
        allVoices = [
          {
            "name":
              "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)",
            "display_name": "晓晓",
            "local_name": "晓晓",
            "short_name": "zh-CN-XiaoxiaoNeural",
            "gender": "Female",
            "locale": "zh-CN",
            "locale_name": "Chinese (Mandarin, Simplified)",
            "sample_rate_hertz": "48000",
            "provider": "leftsite",
          },
        ];
      }

      return new Response(JSON.stringify(allVoices), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600", // 缓存1小时
        },
      });
    } catch (error) {
      console.error("TTS voices API error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to load voices",
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  },
};
