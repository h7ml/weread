import { Handlers } from "fresh";

export const handler: Handlers = {
  async POST(req: Request): Promise<Response> {
    const { text, voice = "Dylan" } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({
          error: "Missing text parameter",
          message: "缺少文本参数",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 检查文本长度
    if (text.length > 1000) {
      return new Response(
        JSON.stringify({
          error: "Text too long",
          message: "文本长度不能超过1000字符",
          fallback: "browser",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      console.log(
        "使用 OpenXing TTS 服务，语音:",
        voice,
        "文本:",
        text.substring(0, 50) + "...",
      );

      // 设置超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时，因为需要生成音频

      try {
        const response = await fetch(
          "https://tts.openxing.top/api/synthesize",
          {
            method: "POST",
            headers: {
              "Accept": "*/*",
              "Accept-Language": "zh-CN,zh;q=0.9",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
              "Content-Type": "application/json",
              "Origin": "https://tts.openxing.top",
              "Pragma": "no-cache",
              "Referer": "https://tts.openxing.top/",
              "Sec-Fetch-Dest": "empty",
              "Sec-Fetch-Mode": "cors",
              "Sec-Fetch-Site": "same-origin",
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
              "sec-ch-ua":
                '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"macOS"',
            },
            body: JSON.stringify({
              text: text,
              voices: [voice],
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(
            "OpenXing TTS 服务响应错误:",
            response.status,
            response.statusText,
          );
          return new Response(
            JSON.stringify({
              error: "OpenXing TTS service unavailable",
              message: `服务返回状态 ${response.status}`,
              fallback: "browser",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const result = await response.json();
        console.log("OpenXing TTS 响应:", result);

        if (result.results && result.results.length > 0) {
          const audioResult = result.results[0];
          if (audioResult.status === "completed" && audioResult.filename) {
            // 构建音频文件URL
            const audioUrl = `https://tts.openxing.top/api/audio/${
              encodeURIComponent(audioResult.filename)
            }`;

            // 获取音频文件
            const audioResponse = await fetch(audioUrl);
            if (audioResponse.ok) {
              const audioData = await audioResponse.arrayBuffer();

              return new Response(audioData, {
                status: 200,
                headers: {
                  "Content-Type": "audio/wav",
                  "Content-Length": audioData.byteLength.toString(),
                  "Access-Control-Allow-Origin": "*",
                  "Cache-Control": "public, max-age=3600",
                },
              });
            }
          }
        }

        // 如果没有成功生成音频
        return new Response(
          JSON.stringify({
            error: "Audio generation failed",
            message: "音频生成失败",
            fallback: "browser",
            details: result,
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError.name === "AbortError") {
          console.warn("OpenXing TTS 请求超时");
          return new Response(
            JSON.stringify({
              error: "TTS request timeout",
              message: "OpenXing TTS 服务请求超时",
              fallback: "browser",
            }),
            {
              status: 504,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        throw fetchError;
      }
    } catch (error) {
      console.error("OpenXing TTS API error:", error);
      return new Response(
        JSON.stringify({
          error: "OpenXing TTS service error",
          message: error.message || "OpenXing TTS 服务暂时不可用",
          fallback: "browser",
          data: {
            fallbackToWebSpeech: true,
            originalText: text,
            voice: voice,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
