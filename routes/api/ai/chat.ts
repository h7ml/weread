import { FreshContext, Handlers } from "$fresh/server.ts";

interface ChatRequest {
  question: string;
  context?: string;
  bookId?: string;
  chapterUid?: string;
  conversationId?: string;
}

interface ChatResponse {
  success: boolean;
  data?: {
    answer: string;
    sources?: string[];
    suggestions?: string[];
    conversationId: string;
  };
  error?: string;
}

export const handler: Handlers<ChatResponse> = {
  async POST(req: Request, _ctx: FreshContext): Promise<Response> {
    try {
      const body: ChatRequest = await req.json();
      
      if (!body.question?.trim()) {
        return Response.json({
          success: false,
          error: "问题内容不能为空"
        }, { status: 400 });
      }

      // 生成AI回答
      const response = await generateAIResponse(body);

      return Response.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error("AI问答失败:", error);
      return Response.json({
        success: false,
        error: "AI问答服务暂时不可用"
      }, { status: 500 });
    }
  }
};

async function generateAIResponse(request: ChatRequest & { options?: { provider?: string; model?: string; apiKey?: string; apiUrl?: string; } }) {
  const { question, context, conversationId, options } = request;
  
  // 如果配置了AI，则使用真实AI API
  if (options?.provider && options?.model && options?.apiUrl) {
    try {
      const result = await callRealAIChat(question, context, options);
      return {
        ...result,
        conversationId: conversationId || generateConversationId()
      };
    } catch (error) {
      console.error("真实AI聊天失败，降级到mock模式:", error);
      // 降级到mock模式
    }
  }
  
  // Mock模式处理
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));

  const answer = generateAnswer(question, context);
  const suggestions = generateSuggestions(question);
  
  return {
    answer,
    sources: context ? ["当前阅读内容", "相关文学知识库"] : ["通用知识库"],
    suggestions,
    conversationId: conversationId || generateConversationId()
  };
}

// 调用真实AI进行聊天
async function callRealAIChat(question: string, context: string | undefined, options: any) {
  const { provider, model, apiKey, apiUrl } = options;
  
  // 构建聊天提示词
  const prompt = buildChatPrompt(question, context);
  
  // 根据不同提供商调用API
  switch (provider) {
    case "openai":
      return await callOpenAIChat(apiUrl, model, apiKey, prompt, question, context);
    case "anthropic":
      return await callAnthropicChat(apiUrl, model, apiKey, prompt, question, context);
    case "ollama":
      return await callOllamaChat(apiUrl, model, prompt, question, context);
    default:
      throw new Error(`不支持的AI提供商: ${provider}`);
  }
}

// 构建聊天提示词
function buildChatPrompt(question: string, context?: string): string {
  let prompt = `你是一个专业的文学阅读助手，擅长回答关于文学作品的问题，提供深入的分析和见解。

请遵循以下回答原则：
1. 提供准确、有见地的分析
2. 结合文学理论和文化背景
3. 语言生动有趣，适合普通读者理解
4. 如果涉及主观解读，请说明这是一种可能的理解
5. 可以适当引用相关的文学作品或理论

用户问题：${question}`;

  if (context) {
    prompt += `\n\n当前阅读的文本内容：\n${context}\n\n请结合这段文本内容来回答问题。`;
  }

  return prompt;
}

// OpenAI聊天API调用
async function callOpenAIChat(apiUrl: string, model: string, apiKey: string, prompt: string, question: string, context?: string) {
  const messages = [
    {
      role: "system" as const,
      content: "你是一个专业的文学阅读助手，擅长回答关于文学作品的问题，提供深入的分析和见解。"
    },
    {
      role: "user" as const,
      content: prompt
    }
  ];

  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content;
  
  if (!answer) {
    throw new Error("OpenAI API返回内容为空");
  }
  
  return {
    answer: answer,
    sources: context ? ["当前阅读内容", "AI知识库"] : ["AI知识库"],
    suggestions: generateSmartSuggestions(question, answer)
  };
}

// Anthropic聊天API调用
async function callAnthropicChat(apiUrl: string, model: string, apiKey: string, prompt: string, question: string, context?: string) {
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
  const answer = data.content?.[0]?.text;
  
  if (!answer) {
    throw new Error("Anthropic API返回内容为空");
  }
  
  return {
    answer: answer,
    sources: context ? ["当前阅读内容", "AI知识库"] : ["AI知识库"],
    suggestions: generateSmartSuggestions(question, answer)
  };
}

// Ollama聊天API调用
async function callOllamaChat(apiUrl: string, model: string, prompt: string, question: string, context?: string) {
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
  const answer = data.response;
  
  if (!answer) {
    throw new Error("Ollama API返回内容为空");
  }
  
  return {
    answer: answer,
    sources: context ? ["当前阅读内容", "本地AI模型"] : ["本地AI模型"],
    suggestions: generateSmartSuggestions(question, answer)
  };
}

// 基于AI回答生成智能建议
function generateSmartSuggestions(question: string, answer: string): string[] {
  const suggestions = [];
  
  // 基于问题类型生成相关建议
  const q = question.toLowerCase();
  const a = answer.toLowerCase();
  
  if (q.includes("主题") || a.includes("主题")) {
    suggestions.push("这个主题在其他作品中是如何体现的？");
    suggestions.push("作者如何通过情节发展来突出主题？");
  }
  
  if (q.includes("人物") || a.includes("人物")) {
    suggestions.push("这个人物的成长轨迹是怎样的？");
    suggestions.push("人物之间的关系如何推动情节发展？");
  }
  
  if (q.includes("技巧") || q.includes("手法") || a.includes("技巧")) {
    suggestions.push("这种写作技巧在其他地方还有运用吗？");
    suggestions.push("为什么作者要选择这种表达方式？");
  }
  
  if (q.includes("意义") || a.includes("意义")) {
    suggestions.push("这种意义在当代还有什么价值？");
    suggestions.push("我们应该如何理解这种深层含义？");
  }
  
  // 添加一些通用的延伸问题
  suggestions.push("能否从不同角度来理解这个问题？");
  suggestions.push("这让你联想到了什么？");
  
  // 返回前5个建议，避免重复
  return [...new Set(suggestions)].slice(0, 5);
}

function generateAnswer(question: string, context?: string): string {
  const q = question.toLowerCase();
  
  // 基于问题关键词生成回答
  if (q.includes("主题") || q.includes("思想")) {
    return "这个问题涉及到作品的核心主题。从文本中可以看出，作者主要探讨了人与自然、传统与现代、个人与社会等重要主题。这些主题通过精妙的文学手法得到了深刻的表达，体现了作者深厚的人文关怀和哲学思考。";
  }
  
  if (q.includes("人物") || q.includes("角色")) {
    return "作品中的人物塑造十分精彩，每个角色都有其独特的性格特征和发展脉络。作者通过细致的心理描写和生动的对话，成功地展现了人物的内心世界，使读者能够深刻理解人物的思想和行为动机。";
  }
  
  if (q.includes("写作手法") || q.includes("技巧") || q.includes("修辞")) {
    return "作者在写作技巧上颇具匠心，运用了多种修辞手法如比喻、拟人、排比等，同时在结构安排上也很有特色。通过对比、递进、层层深入等手法，增强了作品的艺术感染力和表达效果。";
  }
  
  if (q.includes("背景") || q.includes("历史") || q.includes("时代")) {
    return "这部作品的创作背景与特定的历史时期密切相关，反映了当时的社会风貌和文化特色。作者通过文学创作，记录了那个时代的精神追求和价值观念，具有重要的史料价值和文化意义。";
  }
  
  if (q.includes("意义") || q.includes("价值") || q.includes("影响")) {
    return "这部作品具有深远的文学价值和社会意义。它不仅在艺术表现上达到了很高的水准，而且在思想内容上也具有启发性。对后世的文学创作和文化发展都产生了积极的影响。";
  }
  
  // 默认回答
  return `关于您提出的问题"${question}"，这是一个很有深度的问题。${context ? "结合当前的阅读内容，" : ""}我认为这个问题涉及到多个层面的思考。文学作品往往具有多重含义，不同的读者可能会有不同的理解和感悟。建议您可以从文本细节、文化背景、作者意图等多个角度来深入思考这个问题。`;
}

function generateSuggestions(question: string): string[] {
  const suggestions = [
    "这段文字的深层含义是什么？",
    "作者想要表达什么思想感情？",
    "这种写作手法有什么特别之处？",
    "这部作品在文学史上的地位如何？",
    "如何理解作品中的象征意义？"
  ];
  
  // 根据问题内容提供相关建议
  const q = question.toLowerCase();
  if (q.includes("人物")) {
    suggestions.unshift("这个人物的性格特征有哪些？", "人物关系是如何发展的？");
  } else if (q.includes("主题")) {
    suggestions.unshift("还有哪些隐含的主题？", "这个主题是如何体现的？");
  } else if (q.includes("技巧")) {
    suggestions.unshift("还用了哪些写作技巧？", "这种技巧的效果如何？");
  }
  
  return suggestions.slice(0, 5);
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}