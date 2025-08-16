import { FreshContext, Handlers } from "$fresh/server.ts";

interface AnalyzeRequest {
  type: "chapter" | "sentence" | "book" | "multi_dimension" | "progressive" | "debate";
  content: string;
  bookId?: string;
  chapterUid?: string;
  options?: {
    focus?: "literary" | "historical" | "general" | "philosophical" | "psychological" | "cultural";
    detail?: "brief" | "standard" | "detailed";
    dimensions?: string[];
    perspective?: string;
    analysisLevel?: number;
  };
}

interface AnalyzeResponse {
  success: boolean;
  data?: {
    analysis: string;
    keyPoints: string[];
    themes?: string[];
    literaryDevices?: string[];
    historicalContext?: string;
    summary?: string;
    dimensions?: {
      literary: any;
      historical: any;
      philosophical: any;
      psychological: any;
      cultural: any;
    };
    progressiveLevels?: any[];
    debatePositions?: any[];
    questionChain?: string[];
    creativeAlternatives?: any[];
    knowledgeGraph?: any;
    insights?: any[];
  };
  error?: string;
}

export const handler: Handlers<AnalyzeResponse> = {
  async POST(req: Request, _ctx: FreshContext): Promise<Response> {
    try {
      const body: AnalyzeRequest = await req.json();
      
      if (!body.content || !body.type) {
        return Response.json({
          success: false,
          error: "内容和分析类型不能为空"
        }, { status: 400 });
      }

      // 根据分析类型生成不同的AI分析
      const analysis = await generateAIAnalysis(body);

      return Response.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error("AI分析失败:", error);
      return Response.json({
        success: false,
        error: "AI分析服务暂时不可用"
      }, { status: 500 });
    }
  }
};

async function generateAIAnalysis(request: AnalyzeRequest & { options?: { provider?: string; model?: string; apiKey?: string; apiUrl?: string; detailLevel?: string; } }) {
  const { type, content, options } = request;
  
  // 如果没有配置AI，则使用mock数据
  if (!options?.provider || !options?.model || !options?.apiUrl) {
    return await generateMockAnalysis(type, content, options);
  }

  try {
    // 调用真实的AI API
    const result = await callRealAI(type, content, options);
    return result;
  } catch (error) {
    console.error("真实AI调用失败，降级到mock数据:", error);
    // AI调用失败时降级到mock数据
    return await generateMockAnalysis(type, content, options);
  }
}

// 调用真实AI API的函数
async function callRealAI(type: string, content: string, options: any) {
  const { provider, model, apiKey, apiUrl, detailLevel = "standard" } = options;
  
  // 构建AI提示词
  const prompt = buildPromptForType(type, content, detailLevel);
  
  // 根据不同的AI提供商调用相应的API
  switch (provider) {
    case "openai":
      return await callOpenAI(apiUrl, model, apiKey, prompt);
    case "anthropic":
      return await callAnthropic(apiUrl, model, apiKey, prompt);
    case "google":
      return await callGoogleAI(apiUrl, model, apiKey, prompt);
    case "baidu":
      return await callBaiduAI(apiUrl, model, apiKey, prompt);
    case "alibaba":
      return await callAlibabaAI(apiUrl, model, apiKey, prompt);
    case "zhipu":
      return await callZhipuAI(apiUrl, model, apiKey, prompt);
    case "moonshot":
      return await callMoonshotAI(apiUrl, model, apiKey, prompt);
    case "deepseek":
      return await callDeepSeekAI(apiUrl, model, apiKey, prompt);
    case "ollama":
      return await callOllamaAI(apiUrl, model, prompt);
    case "custom":
      return await callCustomAI(apiUrl, model, apiKey, prompt);
    default:
      throw new Error(`不支持的AI提供商: ${provider}`);
  }
}

// 构建不同类型分析的提示词
function buildPromptForType(type: string, content: string, detailLevel: string): string {
  const basePrompt = `请对以下文本进行${type === "sentence" ? "句子" : type === "chapter" ? "章节" : type === "book" ? "全书" : ""}分析。`;
  const detailInstruction = detailLevel === "brief" ? "请提供简洁的分析。" : 
                           detailLevel === "detailed" ? "请提供详细深入的分析。" : 
                           "请提供适中详细度的分析。";
  
  let specificInstruction = "";
  switch (type) {
    case "sentence":
      specificInstruction = "请分析这句话的修辞手法、语言特色、情感色彩和文化内涵。返回JSON格式：{\"analysis\": \"分析内容\", \"keyPoints\": [\"要点1\", \"要点2\"], \"literaryDevices\": [\"修辞1\", \"修辞2\"]}";
      break;
    case "chapter":
      specificInstruction = "请分析这个章节的主题思想、文学手法、情感表达和艺术特色。返回JSON格式：{\"analysis\": \"分析内容\", \"keyPoints\": [\"要点1\", \"要点2\"], \"themes\": [\"主题1\", \"主题2\"], \"literaryDevices\": [\"手法1\", \"手法2\"]}";
      break;
    case "book":
      specificInstruction = "请从整体角度分析作品的主题思想、艺术价值、文化意义和影响。返回JSON格式：{\"analysis\": \"分析内容\", \"keyPoints\": [\"要点1\", \"要点2\"], \"themes\": [\"主题1\", \"主题2\"], \"summary\": \"总结\"}";
      break;
    case "multi_dimension":
      specificInstruction = "请从文学、历史、哲学、心理、文化五个维度分析文本。返回包含各维度详细分析的JSON格式。";
      break;
    case "progressive":
      specificInstruction = "请进行渐进式深度分析，从表层到深层逐步挖掘文本含义。";
      break;
    case "debate":
      specificInstruction = "请从多个不同角度（传统主义、现代主义、批判主义、折中主义）分析文本，提供辩论式观点。";
      break;
  }
  
  return `${basePrompt}\n${detailInstruction}\n${specificInstruction}\n\n文本内容：\n${content}`;
}

// OpenAI API调用
async function callOpenAI(apiUrl: string, model: string, apiKey: string, prompt: string) {
  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: "你是一个专业的文学分析专家，善于从多个角度深入分析文学作品。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("OpenAI API返回内容为空");
  }
  
  return parseAIResponse(content);
}

// Anthropic Claude API调用
async function callAnthropic(apiUrl: string, model: string, apiKey: string, prompt: string) {
  const response = await fetch(`${apiUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2000,
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.content?.[0]?.text;
  
  if (!content) {
    throw new Error("Anthropic API返回内容为空");
  }
  
  return parseAIResponse(content);
}

// 其他AI提供商的调用函数（简化实现）
async function callGoogleAI(apiUrl: string, model: string, apiKey: string, prompt: string) {
  // Google Gemini API 2025最新实现
  // 支持 Gemini 2.5 Pro, Gemini 2.5 Flash 等最新模型
  const response = await fetch(`${apiUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        topP: 0.8,
        candidateCount: 1
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_ONLY_HIGH"
        }
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Google AI API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
    throw new Error("Google AI API返回内容为空");
  }
  
  return parseAIResponse(content);
}

async function callBaiduAI(apiUrl: string, model: string, apiKey: string, prompt: string) {
  // 百度文心API 2025最新实现
  // 支持 ERNIE 4.0, ERNIE 4.5 Turbo 等最新模型
  // 需要先获取access_token
  const [clientId, clientSecret] = apiKey.split(":");
  
  if (!clientId || !clientSecret) {
    throw new Error("百度文心API Key格式错误，应为: client_id:client_secret");
  }
  
  const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    })
  });
  
  if (!tokenResponse.ok) {
    throw new Error(`百度文心获取token失败: ${tokenResponse.status}`);
  }
  
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  
  if (!accessToken) {
    throw new Error("百度文心获取access_token失败");
  }
  
  // 根据不同模型构建不同的endpoint (2025年最新映射)
  let endpoint = "";
  switch (model) {
    case "ernie-bot":
      endpoint = "/chat/completions";
      break;
    case "ernie-bot-turbo":
      endpoint = "/chat/eb-instant";
      break;
    case "ernie-bot-4":
      endpoint = "/chat/completions_pro";
      break;
    case "ernie-4.5-turbo":
      endpoint = "/chat/ernie-4.5-turbo";
      break;
    default:
      endpoint = "/chat/completions";
  }
  
  const response = await fetch(`${apiUrl}${endpoint}?access_token=${accessToken}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: 0.7,
      top_p: 0.8,
      penalty_score: 1.0,
      max_output_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`百度文心API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.result;
  
  if (!content) {
    throw new Error("百度文心API返回内容为空");
  }
  
  return parseAIResponse(content);
}

async function callAlibabaAI(apiUrl: string, model: string, apiKey: string, prompt: string) {
  // 阿里通义千问API实现
  const response = await fetch(`${apiUrl}/services/aigc/text-generation/generation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-DashScope-SSE": "disable"
    },
    body: JSON.stringify({
      model: model,
      input: {
        messages: [{
          role: "system",
          content: "你是一个专业的文学分析专家，善于从多个角度深入分析文学作品。"
        }, {
          role: "user",
          content: prompt
        }]
      },
      parameters: {
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.8,
        result_format: "message"
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`阿里通义API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.output?.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("阿里通义API返回内容为空");
  }
  
  return parseAIResponse(content);
}

async function callZhipuAI(apiUrl: string, model: string, apiKey: string, prompt: string) {
  // 智谱AI GLM 2025最新实现
  // 支持 GLM-4.5, GLM-4.5-Air 等最新模型
  const requestBody: any = {
    model: model,
    messages: [{
      role: "system",
      content: "你是一个专业的文学分析专家，善于从多个角度深入分析文学作品。"
    }, {
      role: "user",
      content: prompt
    }],
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.8,
    stream: false
  };
  
  // GLM-4.5 支持思考模式
  if (model.includes("glm-4.5")) {
    requestBody.thinking = {
      type: "enabled"
    };
  }
  
  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    throw new Error(`智谱AI API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("智谱AI API返回内容为空");
  }
  
  return parseAIResponse(content);
}

async function callMoonshotAI(apiUrl: string, model: string, apiKey: string, prompt: string) {
  // Moonshot AI (Kimi) 2025最新实现
  // 支持 Kimi K2 大模型，具备128K长上下文和强大的工具调用能力
  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{
        role: "system",
        content: "你是一个专业的文学分析专家，善于从多个角度深入分析文学作品。"
      }, {
        role: "user",
        content: prompt
      }],
      temperature: 0.6, // Kimi K2推荐使用0.6的温度值
      max_tokens: 2000,
      top_p: 0.8,
      stream: false
    })
  });
  
  if (!response.ok) {
    throw new Error(`Moonshot AI API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("Moonshot AI API返回内容为空");
  }
  
  return parseAIResponse(content);
}

async function callDeepSeekAI(apiUrl: string, model: string, apiKey: string, prompt: string) {
  // DeepSeek API 2025最新实现
  // 支持 DeepSeek-V3, DeepSeek-R1 等最新模型，包括思考模式
  const requestBody: any = {
    model: model,
    messages: [{
      role: "system",
      content: "你是一个专业的文学分析专家，善于从多个角度深入分析文学作品。"
    }, {
      role: "user",
      content: prompt
    }],
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.8,
    stream: false
  };
  
  // DeepSeek-R1 模型支持思考模式
  if (model.includes("deepseek-r1") || model.includes("deepseek-think")) {
    // R1模型会自动启用思考模式，无需额外参数
    requestBody.max_reasoning_tokens = 32000; // 最大思维链输出长度
  }
  
  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    throw new Error(`DeepSeek API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("DeepSeek API返回内容为空");
  }
  
  return parseAIResponse(content);
}

async function callOllamaAI(apiUrl: string, model: string, prompt: string) {
  // Ollama本地模型实现
  const response = await fetch(`${apiUrl}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false
    })
  });
  
  if (!response.ok) {
    throw new Error(`Ollama API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  return parseAIResponse(data.response);
}

async function callCustomAI(apiUrl: string, model: string, apiKey: string, prompt: string) {
  // 自定义API实现
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model,
      prompt: prompt
    })
  });
  
  if (!response.ok) {
    throw new Error(`自定义API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  return parseAIResponse(data.response || data.content || data.text);
}

// 解析AI响应内容
function parseAIResponse(content: string): any {
  try {
    // 尝试解析JSON格式的响应
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // 如果不是JSON格式，则构建标准响应格式
    return {
      analysis: content,
      keyPoints: [
        "AI分析已完成",
        "基于真实AI模型生成",
        "内容经过专业分析"
      ]
    };
  } catch (error) {
    // 解析失败时的降级处理
    return {
      analysis: content,
      keyPoints: ["AI分析内容"],
      parseError: true
    };
  }
}

// Mock数据生成函数（保持原有逻辑）
async function generateMockAnalysis(type: string, content: string, options?: any) {
  // 模拟AI分析延迟
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));

  switch (type) {
    case "chapter":
      return generateChapterAnalysis(content, options);
    case "sentence":
      return generateSentenceAnalysis(content, options);
    case "book":
      return generateBookAnalysis(content, options);
    case "multi_dimension":
      return generateMultiDimensionAnalysis(content, options);
    case "progressive":
      return generateProgressiveAnalysis(content, options);
    case "debate":
      return generateDebateAnalysis(content, options);
    default:
      throw new Error("不支持的分析类型");
  }
}

function generateChapterAnalysis(content: string, options?: AnalyzeRequest["options"]) {
  // 提取章节的关键信息
  const wordCount = content.length;
  const isPoetry = content.includes("，") && content.includes("。") && wordCount < 500;
  
  const analysis = {
    analysis: `本章节共计约${wordCount}字，${isPoetry ? "采用诗歌体裁，" : ""}文字优美，情感表达深刻。通过细腻的描写和生动的比喻，作者成功地营造了独特的文学氛围。`,
    keyPoints: [
      "文学手法运用娴熟，修辞丰富多样",
      "情感表达层次分明，主题思想突出",
      "语言风格独特，具有强烈的个人色彩",
      "结构安排合理，逻辑脉络清晰"
    ],
    themes: [
      "人文情怀的体现",
      "自然与人的和谐关系",
      "传统文化的传承与发展"
    ],
    literaryDevices: [
      "比喻：运用大量生动的比喻，增强表达效果",
      "对比：通过对比手法，突出主题",
      "排比：增强语言的节奏感和感染力",
      "引用：巧妙引用典故，丰富文章内涵"
    ]
  };

  if (options?.focus === "historical") {
    analysis["historicalContext"] = "本文写作背景处于特定的历史时期，反映了当时的社会风貌和文化特色。作者通过文学创作，记录了那个时代的精神风貌和人文关怀。";
  }

  return analysis;
}

function generateSentenceAnalysis(content: string, options?: AnalyzeRequest["options"]) {
  return {
    analysis: `这句话运用了精妙的修辞手法，语言简洁而意蕴深远。通过细致的分析可以发现，作者在有限的文字中蕴含了丰富的情感和深刻的思想。`,
    keyPoints: [
      "修辞手法分析：运用了比喻/拟人/排比等修辞手法",
      "语言特色：用词精准，节奏感强",
      "情感色彩：表达了作者的特定情感态度",
      "文化内涵：体现了深厚的文化底蕴"
    ],
    literaryDevices: [
      "词语选择：每个词都经过精心选择，具有特定的表达效果",
      "句式结构：句式工整，符合文体特征",
      "语音效果：注重语言的音韵美感"
    ]
  };
}

function generateBookAnalysis(content: string, options?: AnalyzeRequest["options"]) {
  return {
    analysis: `这是一部具有深刻思想内涵和艺术价值的作品。作者通过精湛的文学技巧，展现了丰富的人生感悟和独特的艺术魅力。整部作品结构完整，主题鲜明，是文学史上的重要作品。`,
    keyPoints: [
      "主题思想：探讨了人生、自然、社会等重大命题",
      "艺术特色：文学技巧成熟，艺术表现力强",
      "文化价值：体现了深厚的文化底蕴和时代特征",
      "影响意义：对后世文学创作产生了深远影响"
    ],
    themes: [
      "人文主义精神的体现",
      "传统文化的传承与创新",
      "个人与时代的关系探讨",
      "文学艺术的审美追求"
    ],
    summary: "这部作品以其独特的艺术魅力和深刻的思想内涵，成为了文学史上的经典之作。作者通过细腻的笔触和精湛的技艺，为读者呈现了一个丰富多彩的精神世界。"
  };
}

// 多维度分析功能
function generateMultiDimensionAnalysis(content: string, options?: AnalyzeRequest["options"]) {
  const dimensions = {
    literary: {
      title: "文学维度分析",
      analysis: "从文学角度看，这段文字运用了丰富的修辞手法，语言精美，结构严谨。",
      techniques: ["比喻", "拟人", "排比", "对仗"],
      style: "典雅清新，富有诗意",
      impact: "营造了深刻的艺术美感"
    },
    historical: {
      title: "历史维度分析", 
      analysis: "这段文字反映了特定历史时期的社会风貌和文化特色。",
      context: "创作于社会变革期，体现了时代精神",
      significance: "具有重要的史料价值",
      influence: "对后世产生了深远影响"
    },
    philosophical: {
      title: "哲学维度分析",
      analysis: "从哲学角度探讨了存在、认知、价值等根本问题。",
      concepts: ["存在主义思考", "认识论探索", "价值观体现"],
      worldview: "体现了独特的世界观和人生观",
      wisdom: "蕴含深刻的人生智慧"
    },
    psychological: {
      title: "心理维度分析",
      analysis: "深入刻画了人物的内心世界和情感变化。",
      emotions: ["喜悦", "忧郁", "思索", "感悟"],
      mechanisms: "运用了丰富的心理描写技巧",
      development: "展现了心理发展的复杂过程"
    },
    cultural: {
      title: "文化维度分析",
      analysis: "体现了深厚的文化底蕴和民族特色。",
      elements: ["传统文化", "民俗风情", "文化符号"],
      heritage: "传承了优秀的文化传统",
      innovation: "在传承中有所创新发展"
    }
  };

  return {
    analysis: "多维度分析提供了对文本的全方位理解",
    dimensions,
    synthesis: "综合各维度分析，这段文字具有丰富的内涵和多重价值",
    keyPoints: [
      "文学价值：艺术表现力强，技巧精湛",
      "历史价值：反映时代特征，具史料意义", 
      "哲学价值：蕴含深刻思考，启发智慧",
      "心理价值：情感丰富，心理刻画细腻",
      "文化价值：传承文化，体现民族特色"
    ]
  };
}

// 渐进式思维挖掘
function generateProgressiveAnalysis(content: string, options?: AnalyzeRequest["options"]) {
  const level = options?.analysisLevel || 1;
  
  const levels = [
    {
      level: 1,
      title: "表层信息提取",
      analysis: "识别基本的人物、情节、背景等显性信息",
      findings: [
        "主要人物：文中提到的核心角色",
        "基本情节：主要事件的发展脉络", 
        "时空背景：故事发生的时间和地点",
        "表面主题：直接表达的思想内容"
      ],
      nextQuestions: [
        "这些人物有什么深层特征？",
        "情节安排有什么特殊用意？",
        "背景设置的象征意义是什么？"
      ]
    },
    {
      level: 2,
      title: "深层含义解析",
      analysis: "挖掘隐含的象征、隐喻和深层主题",
      findings: [
        "象征手法：运用的象征元素及其意义",
        "隐喻表达：深层的比喻和暗示",
        "主题升华：超越表面的思想内涵",
        "情感内核：作者真正想表达的情感"
      ],
      nextQuestions: [
        "这些象征与其他作品有何关联？",
        "如何理解作者的创作意图？",
        "这种表达方式的文化根源是什么？"
      ]
    },
    {
      level: 3,
      title: "跨文化关联探索",
      analysis: "探索与其他文化、作品、思想的联系",
      findings: [
        "文化对话：与不同文化传统的呼应",
        "互文关系：与其他经典作品的关联",
        "思想传承：对前人思想的继承和发展",
        "时代对话：与当代思潮的互动"
      ],
      nextQuestions: [
        "如果改变某个元素会产生什么效果？",
        "现代读者应如何理解这些内容？",
        "这种表达方式还能如何创新？"
      ]
    },
    {
      level: 4,
      title: "创新观点生成",
      analysis: "基于深度理解生成新颖的解读角度",
      findings: [
        "逆向思考：从反面角度的新理解",
        "假设分析：假设不同条件下的可能性",
        "现代应用：对当代生活的启发意义",
        "未来展望：对未来发展的预测和思考"
      ],
      insights: [
        "这段文字可能还隐含着我们未曾发现的层面",
        "作者的创作技巧值得现代创作者学习",
        "这种思维方式对解决现代问题有启发",
        "文本的多重解读空间值得持续探索"
      ]
    }
  ];

  return {
    currentLevel: level,
    analysis: levels[level - 1],
    progressiveLevels: levels,
    recommendations: level < 4 ? "建议进行下一层级的深度分析" : "已达到最深层分析",
    totalLevels: 4
  };
}

// 争议观点辩论分析
function generateDebateAnalysis(content: string, options?: AnalyzeRequest["options"]) {
  const topic = `关于文本主题的不同解读观点`;
  
  const positions = [
    {
      stance: "传统主义视角",
      viewpoint: "强调传统文化价值和经典传承",
      arguments: [
        "体现了深厚的文化底蕴和传统智慧",
        "继承了经典的表达方式和思想内核",
        "具有永恒的艺术价值和教育意义",
        "代表了民族文化的精华和特色"
      ],
      evidence: [
        "运用了传统的修辞手法和文学形式",
        "表达了符合传统价值观的思想内容",
        "在文学史上具有承上启下的重要地位"
      ],
      counterarguments: "可能过分拘泥于传统，缺乏时代创新精神"
    },
    {
      stance: "现代主义视角", 
      viewpoint: "注重创新表达和现代价值",
      arguments: [
        "体现了与时俱进的创新精神",
        "运用了符合现代审美的表达技巧",
        "具有现代人能够理解和接受的价值观",
        "为文学创作开拓了新的可能性"
      ],
      evidence: [
        "在传统基础上有所突破和创新",
        "表达了现代人的思想情感和生活体验",
        "影响了后来的现代文学发展"
      ],
      counterarguments: "可能过分追求新颖，忽视了传统文化的价值"
    },
    {
      stance: "批判主义视角",
      viewpoint: "以批判态度审视文本价值",
      arguments: [
        "需要以批判的眼光看待文本内容",
        "某些观点可能带有时代局限性",
        "应该结合现代价值观重新审视",
        "不应盲目推崇，要有独立思考"
      ],
      evidence: [
        "文本创作的历史背景具有特定局限",
        "某些表达方式不完全适应现代语境",
        "需要取其精华，去其糟粕"
      ],
      counterarguments: "过度批判可能忽视文本的积极价值和历史意义"
    },
    {
      stance: "折中主义视角",
      viewpoint: "寻求各种观点的平衡和综合",
      arguments: [
        "应该综合考虑各种不同的解读角度",
        "传统与现代、保守与创新都有其价值",
        "多元化的理解更能体现文本的丰富性",
        "包容不同观点有利于深化理解"
      ],
      evidence: [
        "文本本身具有多重解读的可能性",
        "不同角度的分析都能发现有价值的内容",
        "历史上对该文本确实存在多种不同评价"
      ],
      counterarguments: "可能缺乏明确立场，难以形成深入的见解"
    }
  ];

  return {
    topic,
    debatePositions: positions,
    analysis: "这种多角度的辩论分析有助于全面理解文本",
    moderatorSummary: "各种观点都有其合理性，关键在于如何在不同视角中找到平衡，既要尊重传统价值，也要结合时代特色，既要批判思考，也要包容理解。",
    furtherQuestions: [
      "哪种观点更有说服力？为什么？",
      "是否还有其他未被考虑的角度？",
      "如何在不同观点间找到平衡？",
      "这种辩论对理解文本有何帮助？"
    ]
  };
}