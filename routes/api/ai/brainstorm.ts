import { FreshContext, Handlers } from "$fresh/server.ts";

interface BrainstormRequest {
  type: "question_chain" | "multi_ai" | "creative_alternatives" | "knowledge_graph" | "insights_bubble";
  content: string;
  context?: string;
  bookId?: string;
  chapterUid?: string;
  options?: {
    depth?: number;
    aiProviders?: string[];
    creativityLevel?: "conservative" | "moderate" | "bold";
    graphDepth?: number;
  };
}

interface BrainstormResponse {
  success: boolean;
  data?: {
    questionChain?: string[];
    multiAIResults?: any[];
    creativeAlternatives?: any[];
    knowledgeGraph?: any;
    insights?: any[];
    recommendations?: string[];
  };
  error?: string;
}

export const handler: Handlers<BrainstormResponse> = {
  async POST(req: Request, _ctx: FreshContext): Promise<Response> {
    try {
      const body: BrainstormRequest = await req.json();
      
      if (!body.content || !body.type) {
        return Response.json({
          success: false,
          error: "内容和类型不能为空"
        }, { status: 400 });
      }

      const result = await generateBrainstormContent(body);

      return Response.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error("头脑风暴生成失败:", error);
      return Response.json({
        success: false,
        error: "头脑风暴服务暂时不可用"
      }, { status: 500 });
    }
  }
};

async function generateBrainstormContent(request: BrainstormRequest & { options?: { provider?: string; model?: string; apiKey?: string; apiUrl?: string; depth?: number; aiProviders?: string[]; creativityLevel?: "conservative" | "moderate" | "bold"; graphDepth?: number; } }) {
  const { type, content, options } = request;
  
  // 如果配置了AI，则尝试使用真实AI生成更智能的头脑风暴内容
  const useRealAI = options?.provider && options?.model && options?.apiUrl;
  
  switch (type) {
    case "question_chain":
      if (useRealAI) {
        return await generateAIQuestionChain(content, options);
      }
      return { questionChain: generateQuestionChain(content, options?.depth || 6) };
      
    case "multi_ai":
      if (useRealAI) {
        return await generateRealMultiAIAnalysis(content, options);
      }
      return { multiAIResults: await generateMultiAIAnalysis(content, options?.aiProviders) };
      
    case "creative_alternatives":
      if (useRealAI) {
        return await generateAICreativeAlternatives(content, options);
      }
      return { creativeAlternatives: generateCreativeAlternatives(content, options?.creativityLevel) };
      
    case "knowledge_graph":
      if (useRealAI) {
        return await generateAIKnowledgeGraph(content, options);
      }
      return { knowledgeGraph: generateKnowledgeGraph(content, options?.graphDepth) };
      
    case "insights_bubble":
      if (useRealAI) {
        return await generateAIInsightsBubbles(content, options);
      }
      return { insights: generateInsightsBubbles(content) };
      
    default:
      throw new Error("不支持的头脑风暴类型");
  }
}

// 使用AI生成问题链
async function generateAIQuestionChain(content: string, options: any) {
  try {
    const prompt = `请基于以下文本生成一个递进式的问题链，帮助读者深入思考。生成${options.depth || 6}个问题，从浅层理解到深层思考，每个问题都应该引导读者进一步思考。

请返回JSON格式：
{
  "questionChain": ["问题1", "问题2", "问题3", ...]
}

文本内容：
${content}`;

    const result = await callAIAPI(options, prompt);
    
    if (result && result.questionChain) {
      return { questionChain: result.questionChain };
    }
    
    // 如果AI返回格式不正确，降级到默认实现
    return { questionChain: generateQuestionChain(content, options.depth || 6) };
    
  } catch (error) {
    console.error("AI问题链生成失败:", error);
    // 降级到默认实现
    return { questionChain: generateQuestionChain(content, options.depth || 6) };
  }
}

// 使用AI生成创意替代方案
async function generateAICreativeAlternatives(content: string, options: any) {
  try {
    const creativityLevel = options.creativityLevel || "moderate";
    const prompt = `请基于以下文本生成创意写作的替代方案。创意水平: ${creativityLevel}。

请从以下几个维度提供创意方案：
1. 续写方向（悬念发展、情感深化、环境渲染等）
2. 视角转换（第一人称、旁观者、全知视角等）
3. 体裁变换（诗歌、对话、剧本等）
${creativityLevel === "bold" ? "4. 时空转换（现代都市、未来世界、历史穿越等）" : ""}

请返回JSON格式的创意方案数组。

文本内容：
${content}`;

    const result = await callAIAPI(options, prompt);
    
    if (result && Array.isArray(result.creativeAlternatives)) {
      return { creativeAlternatives: result.creativeAlternatives };
    }
    
    // 降级到默认实现
    return { creativeAlternatives: generateCreativeAlternatives(content, creativityLevel) };
    
  } catch (error) {
    console.error("AI创意方案生成失败:", error);
    return { creativeAlternatives: generateCreativeAlternatives(content, options.creativityLevel) };
  }
}

// 使用AI生成洞察气泡
async function generateAIInsightsBubbles(content: string, options: any) {
  try {
    const prompt = `请深入分析以下文本，生成多个洞察点。每个洞察点应该包含类型、标题、内容、置信度等信息。

请从以下几个维度分析：
- 文学技巧（修辞手法、写作技巧等）
- 深层含义（象征意义、隐喻等）
- 情感色彩（情感基调、情感变化等）
- 文化内涵（文化背景、传统元素等）
- 创新观点（独特视角、新颖想法等）
- 跨文本联系（与其他作品的关联等）

请返回JSON格式：
{
  "insights": [
    {
      "type": "类型",
      "icon": "表情符号",
      "title": "洞察标题",
      "content": "洞察内容",
      "confidence": 0.8,
      "expandable": true,
      "details": "详细说明"
    }
  ]
}

文本内容：
${content}`;

    const result = await callAIAPI(options, prompt);
    
    if (result && Array.isArray(result.insights)) {
      return { insights: result.insights };
    }
    
    // 降级到默认实现
    return { insights: generateInsightsBubbles(content) };
    
  } catch (error) {
    console.error("AI洞察生成失败:", error);
    return { insights: generateInsightsBubbles(content) };
  }
}

// 使用AI生成多AI分析（模拟不同AI的观点）
async function generateRealMultiAIAnalysis(content: string, options: any) {
  try {
    const providers = options.aiProviders || ["gpt-4", "claude-3", "gemini-pro", "qwen-max"];
    const prompt = `请模拟${providers.join("、")}等不同AI模型的分析风格，对以下文本进行多角度分析。

每个AI模型应该展现不同的分析特点：
- GPT-4: 逻辑严密，结构分析和逻辑推理
- Claude-3: 人文关怀，文学鉴赏和情感理解  
- Gemini Pro: 跨文化视角，多元文化和创新思维
- 通义千问: 中华文化，传统文化和现代价值

请返回JSON格式：
{
  "multiAIResults": [
    {
      "provider": "AI名称",
      "style": "分析风格",
      "focus": "关注重点", 
      "analysis": "分析内容",
      "strengths": ["优势1", "优势2"],
      "insights": ["洞察1", "洞察2"]
    }
  ]
}

文本内容：
${content}`;

    const result = await callAIAPI(options, prompt);
    
    if (result && Array.isArray(result.multiAIResults)) {
      return { multiAIResults: result.multiAIResults };
    }
    
    // 降级到默认实现
    return { multiAIResults: await generateMultiAIAnalysis(content, providers) };
    
  } catch (error) {
    console.error("AI多模型分析失败:", error);
    return { multiAIResults: await generateMultiAIAnalysis(content, options.aiProviders) };
  }
}

// 使用AI生成知识图谱
async function generateAIKnowledgeGraph(content: string, options: any) {
  try {
    const depth = options.graphDepth || 3;
    const prompt = `请基于以下文本构建一个知识图谱，识别关键实体和它们之间的关系。

图谱深度: ${depth}层

请识别以下类型的实体：
- 概念（concept）
- 人物（person）
- 属性（attribute）
- 背景（context）
- 影响（impact）
- 参考（reference）

请返回JSON格式：
{
  "knowledgeGraph": {
    "nodes": [
      {
        "id": "实体ID",
        "label": "实体名称",
        "type": "实体类型",
        "importance": 0.8
      }
    ],
    "edges": [
      {
        "source": "源实体ID",
        "target": "目标实体ID",
        "type": "关系类型",
        "strength": 0.7
      }
    ],
    "metadata": {
      "totalNodes": 6,
      "totalEdges": 5,
      "depth": ${depth},
      "centerNode": "main_topic"
    }
  }
}

文本内容：
${content}`;

    const result = await callAIAPI(options, prompt);
    
    if (result && result.knowledgeGraph) {
      return { knowledgeGraph: result.knowledgeGraph };
    }
    
    // 降级到默认实现
    return { knowledgeGraph: generateKnowledgeGraph(content, depth) };
    
  } catch (error) {
    console.error("AI知识图谱生成失败:", error);
    return { knowledgeGraph: generateKnowledgeGraph(content, options.graphDepth) };
  }
}

// 调用AI API的通用函数
async function callAIAPI(options: any, prompt: string) {
  const { provider, model, apiKey, apiUrl } = options;
  
  // 根据不同提供商调用相应的API
  switch (provider) {
    case "openai":
      return await callOpenAIBrainstorm(apiUrl, model, apiKey, prompt);
    case "anthropic":
      return await callAnthropicBrainstorm(apiUrl, model, apiKey, prompt);
    case "ollama":
      return await callOllamaBrainstorm(apiUrl, model, prompt);
    default:
      throw new Error(`不支持的AI提供商: ${provider}`);
  }
}

// OpenAI API调用（头脑风暴专用）
async function callOpenAIBrainstorm(apiUrl: string, model: string, apiKey: string, prompt: string) {
  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: "你是一个创意思维专家，善于激发灵感和生成创新想法。请严格按照JSON格式返回结果。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 3000
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
  
  return parseAIBrainstormResponse(content);
}

// Anthropic API调用（头脑风暴专用）
async function callAnthropicBrainstorm(apiUrl: string, model: string, apiKey: string, prompt: string) {
  const response = await fetch(`${apiUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 3000,
      messages: [
        { role: "user", content: `作为创意思维专家，请严格按照JSON格式返回结果。\n\n${prompt}` }
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
  
  return parseAIBrainstormResponse(content);
}

// Ollama API调用（头脑风暴专用）
async function callOllamaBrainstorm(apiUrl: string, model: string, prompt: string) {
  const response = await fetch(`${apiUrl}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      prompt: `作为创意思维专家，请严格按照JSON格式返回结果。\n\n${prompt}`,
      stream: false
    })
  });
  
  if (!response.ok) {
    throw new Error(`Ollama API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  return parseAIBrainstormResponse(data.response);
}

// 解析AI头脑风暴响应
function parseAIBrainstormResponse(content: string): any {
  try {
    // 尝试解析JSON格式的响应
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    
    // 如果不是JSON格式，返回null表示解析失败
    return null;
  } catch (error) {
    console.error("解析AI头脑风暴响应失败:", error);
    return null;
  }
}

// 互动式问题链生成
function generateQuestionChain(content: string, depth: number = 6): string[] {
  const baseQuestions = [
    `这段文字的核心信息是什么？`,
    `作者为什么选择这样的表达方式？`,
    `这种表达方式产生了什么效果？`,
    `如果改变表达方式会如何？`,
    `这与其他作品有什么联系？`,
    `现代读者应该如何理解这一点？`,
    `这给我们什么启发？`,
    `我们可以如何应用这种思维？`
  ];

  // 根据内容特征生成定制化问题
  const customQuestions = [];
  const text = content.toLowerCase();
  
  if (text.includes("人物") || text.includes("角色")) {
    customQuestions.push(
      "这个人物的性格特征有哪些？",
      "人物的行为动机是什么？",
      "这个人物代表了什么？",
      "如果你是这个人物会怎么做？"
    );
  }
  
  if (text.includes("情节") || text.includes("故事")) {
    customQuestions.push(
      "这个情节的转折点在哪里？",
      "情节发展是否合理？",
      "还有其他可能的发展方向吗？",
      "这个情节的象征意义是什么？"
    );
  }
  
  if (text.includes("环境") || text.includes("背景")) {
    customQuestions.push(
      "环境描写有什么作用？",
      "背景设置的用意是什么？",
      "环境与人物的关系如何？",
      "不同环境会产生什么影响？"
    );
  }

  // 生成递进式问题链
  const questionChain = [];
  const allQuestions = [...baseQuestions, ...customQuestions];
  
  for (let i = 0; i < Math.min(depth, allQuestions.length); i++) {
    if (i < allQuestions.length) {
      questionChain.push(allQuestions[i]);
    }
  }
  
  // 添加深度思考问题
  questionChain.push(
    "这个问题还可以从哪些角度思考？",
    "如果站在不同立场会有什么看法？",
    "这种思考方式可以应用到其他地方吗？"
  );

  return questionChain.slice(0, depth);
}

// 多AI模型协同分析
async function generateMultiAIAnalysis(content: string, providers?: string[]) {
  const defaultProviders = ["gpt-4", "claude-3", "gemini-pro", "qwen-max"];
  const targetProviders = providers || defaultProviders;
  
  const analyses = [];
  
  for (const provider of targetProviders) {
    // 模拟不同AI的分析风格
    let analysis;
    switch (provider) {
      case "gpt-4":
        analysis = {
          provider: "GPT-4",
          style: "逻辑严密",
          focus: "结构分析和逻辑推理",
          analysis: "从逻辑结构角度分析，这段文字层次分明，论证清晰。运用了演绎推理的方法，从一般到特殊，逐层深入。",
          strengths: ["逻辑性强", "结构清晰", "推理严密"],
          insights: ["文本采用了经典的论证结构", "逻辑链条完整", "适合理性分析"]
        };
        break;
      case "claude-3":
        analysis = {
          provider: "Claude-3",
          style: "人文关怀",
          focus: "文学鉴赏和情感理解",
          analysis: "这段文字充满了人文情怀，展现了作者深刻的情感体验。语言优美，富有诗意，体现了深厚的文学功底。",
          strengths: ["情感丰富", "文学性强", "富有美感"],
          insights: ["体现了深层的人文关怀", "具有很强的感染力", "适合情感体验"]
        };
        break;
      case "gemini-pro":
        analysis = {
          provider: "Gemini Pro",
          style: "跨文化视角",
          focus: "多元文化和创新思维",
          analysis: "从跨文化的角度看，这段文字体现了东西方思维的融合，既有传统文化的底蕴，又有现代思维的创新。",
          strengths: ["视野开阔", "思维创新", "文化包容"],
          insights: ["展现了文化的多元性", "具有国际化视野", "促进文化交流"]
        };
        break;
      case "qwen-max":
        analysis = {
          provider: "通义千问",
          style: "中华文化",
          focus: "传统文化和现代价值",
          analysis: "这段文字深深植根于中华文化传统，体现了深厚的文化底蕴。同时又结合了现代价值观，实现了传统与现代的完美结合。",
          strengths: ["文化底蕴", "时代特色", "价值传承"],
          insights: ["传承了优秀传统文化", "体现了时代精神", "具有教育价值"]
        };
        break;
      default:
        analysis = {
          provider: provider,
          style: "综合分析",
          focus: "多角度综合解读",
          analysis: "这是一个多角度的综合分析，综合考虑了各种因素和观点。",
          strengths: ["全面性", "平衡性", "实用性"],
          insights: ["提供了全面的视角", "平衡了不同观点", "具有实用价值"]
        };
    }
    
    analyses.push(analysis);
  }
  
  return analyses;
}

// 创意写作激发
function generateCreativeAlternatives(content: string, creativityLevel: string = "moderate") {
  const alternatives = [];
  
  // 续写方向
  alternatives.push({
    type: "续写挑战",
    title: "多种续写可能",
    options: [
      {
        direction: "悬念发展",
        description: "在当前基础上增加悬念和冲突",
        preview: "如果在这里加入一个意外转折..."
      },
      {
        direction: "情感深化", 
        description: "深入挖掘人物内心情感",
        preview: "从人物内心独白的角度继续..."
      },
      {
        direction: "环境渲染",
        description: "通过环境描写推进情节",
        preview: "通过周围环境的变化来暗示..."
      }
    ]
  });
  
  // 视角转换
  alternatives.push({
    type: "视角切换",
    title: "不同视角的重述",
    options: [
      {
        perspective: "第一人称",
        description: "从主人公的角度重新叙述",
        sample: "我感受到..."
      },
      {
        perspective: "旁观者视角",
        description: "从旁观者的角度描述",
        sample: "在一旁观察的人会看到..."
      },
      {
        perspective: "全知视角",
        description: "以全知全能的视角展开",
        sample: "在更大的背景下..."
      }
    ]
  });
  
  // 体裁变换
  alternatives.push({
    type: "体裁重构",
    title: "不同体裁的表达",
    options: [
      {
        genre: "诗歌",
        description: "改写为诗歌形式",
        sample: "用诗歌的韵律和意象..."
      },
      {
        genre: "对话",
        description: "转换为对话形式",
        sample: "通过人物对话来表达..."
      },
      {
        genre: "剧本",
        description: "改编为戏剧脚本",
        sample: "场景：... 人物：..."
      }
    ]
  });
  
  // 时空转换
  if (creativityLevel === "bold") {
    alternatives.push({
      type: "时空穿越",
      title: "不同时空的演绎",
      options: [
        {
          setting: "现代都市",
          description: "将故事背景转移到现代城市",
          adaptation: "在现代社会中这个故事会..."
        },
        {
          setting: "未来世界",
          description: "设想在未来世界的发展",
          adaptation: "在科技发达的未来..."
        },
        {
          setting: "历史穿越",
          description: "放置在不同的历史时期",
          adaptation: "如果发生在古代..."
        }
      ]
    });
  }
  
  return alternatives;
}

// 知识图谱构建
function generateKnowledgeGraph(content: string, depth: number = 3) {
  // 提取关键实体
  const entities = [
    { id: "main_topic", label: "主要话题", type: "concept", importance: 1.0 },
    { id: "author", label: "作者", type: "person", importance: 0.9 },
    { id: "theme", label: "主题思想", type: "concept", importance: 0.8 },
    { id: "style", label: "文学风格", type: "attribute", importance: 0.7 },
    { id: "context", label: "历史背景", type: "context", importance: 0.6 },
    { id: "influence", label: "影响意义", type: "impact", importance: 0.5 }
  ];
  
  // 构建关系网络
  const relationships = [
    { source: "author", target: "main_topic", type: "creates", strength: 0.9 },
    { source: "main_topic", target: "theme", type: "expresses", strength: 0.8 },
    { source: "author", target: "style", type: "employs", strength: 0.7 },
    { source: "context", target: "main_topic", type: "influences", strength: 0.6 },
    { source: "theme", target: "influence", type: "generates", strength: 0.5 },
    { source: "style", target: "influence", type: "contributes", strength: 0.4 }
  ];
  
  // 扩展知识节点
  const extensions = [
    { id: "similar_works", label: "相似作品", type: "reference", importance: 0.4 },
    { id: "literary_movement", label: "文学流派", type: "movement", importance: 0.3 },
    { id: "cultural_impact", label: "文化影响", type: "impact", importance: 0.3 },
    { id: "modern_relevance", label: "现代意义", type: "relevance", importance: 0.2 }
  ];
  
  return {
    nodes: [...entities, ...extensions],
    edges: relationships,
    metadata: {
      totalNodes: entities.length + extensions.length,
      totalEdges: relationships.length,
      depth: depth,
      centerNode: "main_topic"
    },
    interactive: true,
    searchable: true,
    filters: ["person", "concept", "attribute", "context", "impact", "reference", "movement", "relevance"]
  };
}

// 灵感气泡生成
function generateInsightsBubbles(content: string) {
  const insights = [
    {
      type: "文学技巧",
      icon: "🎨",
      title: "修辞手法发现",
      content: "发现了巧妙的比喻和拟人手法",
      confidence: 0.9,
      expandable: true,
      details: "这种修辞手法增强了表达的生动性和感染力"
    },
    {
      type: "深层含义", 
      icon: "💡",
      title: "象征意义解读",
      content: "文中的意象可能具有深层的象征意义",
      confidence: 0.8,
      expandable: true,
      details: "通过象征手法表达了更深层的思想内容"
    },
    {
      type: "情感色彩",
      icon: "❤️",
      title: "情感基调分析",
      content: "整体呈现出淡淡的忧郁和深深的思考",
      confidence: 0.7,
      expandable: true,
      details: "这种情感基调与主题思想高度契合"
    },
    {
      type: "文化内涵",
      icon: "🏛️", 
      title: "文化底蕴挖掘",
      content: "体现了深厚的传统文化底蕴",
      confidence: 0.8,
      expandable: true,
      details: "融合了古典文化与现代思维"
    },
    {
      type: "创新观点",
      icon: "⚡",
      title: "独特视角发现",
      content: "提供了一个全新的观察角度",
      confidence: 0.6,
      expandable: true,
      details: "这种角度可能启发读者的新思考"
    },
    {
      type: "跨文本联系",
      icon: "🔗",
      title: "互文关系识别",
      content: "与其他经典作品存在呼应关系",
      confidence: 0.7,
      expandable: true,
      details: "这种联系丰富了文本的内涵层次"
    }
  ];
  
  return insights;
}