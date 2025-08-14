export const handler = {
  async GET(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const text = url.searchParams.get("t"); // text
    const voice = url.searchParams.get("v") || "zh-CN-XiaoxiaoNeural"; // voice
    const rate = url.searchParams.get("r") || "0"; // rate (-100 to 100)
    const pitch = url.searchParams.get("p") || "0"; // pitch (-100 to 100)
    const style = url.searchParams.get("s") || ""; // style - 可以为空
    const apiKey = url.searchParams.get("api_key") || ""; // API Key支持
    const engine = url.searchParams.get("engine") || "leftsite"; // TTS引擎选择

    if (!text) {
      return new Response("Missing text parameter", { status: 400 });
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
      // 根据引擎选择不同的TTS服务
      if (engine === "openxing") {
        return await handleOpenXingTTS(text, voice);
      } else {
        // 默认使用 leftsite TTS
        return await handleLeftsiteTTS(text, voice, rate, pitch, style, apiKey);
      }
    } catch (error) {
      console.error("TTS API error:", error);
      return new Response(
        JSON.stringify({
          error: "TTS service error",
          message: error.message || "TTS服务暂时不可用",
          fallback: "browser",
          data: {
            fallbackToWebSpeech: true,
            originalText: text,
            voice: voice,
          },
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

  async POST(req: Request): Promise<Response> {
    // POST 请求用于 OpenXing TTS
    const { text, voice = "Dylan", engine = "openxing" } = await req.json();

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

    if (engine === "openxing") {
      return await handleOpenXingTTS(text, voice);
    }

    return new Response(
      JSON.stringify({
        error: "Invalid engine",
        message: "不支持的TTS引擎",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
};

// 处理 Leftsite TTS
async function handleLeftsiteTTS(
  text: string,
  voice: string,
  rate: string,
  pitch: string,
  style: string,
  apiKey: string,
): Promise<Response> {
  // 构建请求到 t.leftsite.cn TTS服务
  const ttsUrl = new URL("https://t.leftsite.cn/tts");
  ttsUrl.searchParams.set("t", text);
  ttsUrl.searchParams.set("v", voice);
  ttsUrl.searchParams.set("r", rate);
  ttsUrl.searchParams.set("p", pitch);

  // 只有当style不为空时才添加
  if (style) {
    ttsUrl.searchParams.set("s", style);
  }

  // 添加API Key参数（如果有）
  if (apiKey) {
    ttsUrl.searchParams.set("api_key", apiKey);
  }

  console.log("代理 Leftsite TTS 请求到:", ttsUrl.toString());

  // 设置超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

  try {
    const response = await fetch(ttsUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://t.leftsite.cn/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Priority": "u=1, i",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 根据官方实现，401状态需要特殊处理
    if (response.status === 401) {
      return new Response(
        JSON.stringify({
          error: "API Key required",
          message: "请输入有效的API Key以继续操作",
          fallback: "browser",
          requiresApiKey: true,
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!response.ok) {
      console.error(
        "Leftsite TTS服务响应错误:",
        response.status,
        response.statusText,
      );
      return new Response(
        JSON.stringify({
          error: "TTS service unavailable",
          message: `Service returned ${response.status}`,
          fallback: "browser",
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 检查响应类型
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.startsWith("audio/")) {
      // 获取音频数据
      const audioData = await response.arrayBuffer();

      // 返回音频流
      return new Response(audioData, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": audioData.byteLength.toString(),
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600", // 缓存1小时
        },
      });
    } else {
      // 不是音频响应，可能是错误信息
      const text = await response.text();
      console.error("Leftsite TTS服务返回非音频内容:", text);
      return new Response(
        JSON.stringify({
          error: "Invalid response from TTS service",
          message: "Service did not return audio content",
          fallback: "browser",
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  } catch (fetchError) {
    clearTimeout(timeoutId);

    if (fetchError.name === "AbortError") {
      console.warn("Leftsite TTS请求超时");
      return new Response(
        JSON.stringify({
          error: "TTS request timeout",
          message: "外部TTS服务请求超时",
          fallback: "browser",
        }),
        {
          status: 504,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    throw fetchError; // 重新抛出非超时错误
  }
}

// 处理 OpenXing TTS
async function handleOpenXingTTS(
  text: string,
  voice: string,
): Promise<Response> {
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
    const response = await fetch("https://tts.openxing.top/api/synthesize", {
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
    });

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
}
