import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

// 配置数据
const THEME_OPTIONS = [
  {
    key: "light",
    name: "默认",
    bg: "bg-white",
    text: "text-gray-900",
    ring: "ring-gray-300",
  },
  {
    key: "sepia",
    name: "护眼",
    bg: "bg-amber-50",
    text: "text-amber-900",
    ring: "ring-amber-300",
  },
  {
    key: "dark",
    name: "夜间",
    bg: "bg-gray-800",
    text: "text-gray-100",
    ring: "ring-gray-600",
  },
  {
    key: "night",
    name: "深邃",
    bg: "bg-gray-900",
    text: "text-gray-200",
    ring: "ring-gray-700",
  },
  {
    key: "green",
    name: "清新",
    bg: "bg-green-50",
    text: "text-green-900",
    ring: "ring-green-300",
  },
  {
    key: "blue",
    name: "海洋",
    bg: "bg-blue-50",
    text: "text-blue-900",
    ring: "ring-blue-300",
  },
  {
    key: "purple",
    name: "神秘",
    bg: "bg-purple-50",
    text: "text-purple-900",
    ring: "ring-purple-300",
  },
  {
    key: "pink",
    name: "温柔",
    bg: "bg-pink-50",
    text: "text-pink-900",
    ring: "ring-pink-300",
  },
];

const FONT_OPTIONS = [
  { key: "system", name: "系统", desc: "无衬线" },
  { key: "serif", name: "衬线", desc: "易读性" },
  { key: "reading", name: "等宽", desc: "代码风格" },
];

const PAGE_WIDTH_OPTIONS = [
  { key: "narrow", name: "窄", desc: "专注阅读" },
  { key: "medium", name: "中", desc: "平衡体验" },
  { key: "wide", name: "宽", desc: "大屏优化" },
];

const SETTINGS_TABS = [
  { key: "display", name: "显示", icon: "🎨" },
  { key: "voice", name: "语音", icon: "🔊" },
  { key: "reading", name: "阅读", icon: "📖" },
  { key: "ai", name: "AI助手", icon: "🤖" },
];

export default function WeReadStyleReaderComponent() {
  // 默认设置配置
  const defaultSettings = {
    fontSize: 18,
    lineHeight: 1.8,
    theme: "light",
    fontFamily: "system",
    pageWidth: "narrow",
    ttsSettings: {
      rate: 1,
      volume: 0.8,
      pitch: 1,
      autoNext: true,
      background: true,
      engine: "browser", // browser | leftsite | openxing
      voiceURI: "",
      style: "", // 默认为空，不传递给官网
      ttsProvider: "leftsite",
    },
    autoReading: {
      isActive: false,
      isPaused: false,
      scrollSpeed: 50,
      autoNext: true,
      smoothScroll: true,
    },
  };

  const bookId = useSignal("");
  const chapterUid = useSignal("");
  const content = useSignal("");
  const chapterTitle = useSignal("");
  const chapters = useSignal([] as any[]);
  const currentChapterIndex = useSignal(0);
  const loading = useSignal(true);
  const error = useSignal("");

  // 阅读设置 - 使用默认值初始化
  const fontSize = useSignal(defaultSettings.fontSize);
  const lineHeight = useSignal(defaultSettings.lineHeight);
  const theme = useSignal(defaultSettings.theme);
  const fontFamily = useSignal(defaultSettings.fontFamily);
  const pageWidth = useSignal(defaultSettings.pageWidth);

  // UI状态
  const showTopBar = useSignal(true);
  const showBottomBar = useSignal(true);
  const showSettings = useSignal(false);
  const showChapterList = useSignal(false);
  const activeSettingsTab = useSignal("display"); // display | voice | reading

  // TTS功能状态 - 使用默认值初始化
  const ttsSettings = useSignal({ ...defaultSettings.ttsSettings });
  const ttsState = useSignal({
    isPlaying: false,
    isPaused: false,
    sentences: [] as string[],
    sentenceElements: [] as Element[],
    currentSentenceIndex: 0,
    utterance: null as SpeechSynthesisUtterance | null,
    startTime: 0,
    azureVoices: [],
    currentAudio: null as HTMLAudioElement | null,
    serviceStatus: "checking" as "checking" | "available" | "unavailable",
    isPreviewPlaying: false, // 试听状态
    previewAudio: null as HTMLAudioElement | null, // 试听音频
    isPreviewLoading: false, // 试听加载状态
    // 语音预加载队列
    preloadQueue: {} as Record<number, string>, // 句子索引 -> 音频URL
    isPreloading: false, // 是否正在预加载
    preloadCount: 3, // 预加载数量
  });

  // 自动阅读状态 - 使用默认值初始化
  const autoReading = useSignal({ ...defaultSettings.autoReading });

  // AI设置状态
  const aiSettings = useSignal({
    detailLevel: "standard" as "brief" | "standard" | "detailed",
    language: "zh" as "zh" | "en"
  });

  // 头脑风暴状态
  const brainstormState = useSignal({
    active: false,
    mode: "off" as "off" | "sentence_click" | "insights_bubble" | "question_chain" | "multi_ai" | "debate",
    selectedSentence: "",
    selectedElement: null as Element | null,
    currentInsights: [] as any[],
    questionChain: [] as string[],
    currentQuestionIndex: 0,
    multiAIResults: [] as any[],
    debatePositions: [] as any[],
    knowledgeGraph: null as any,
    creativeSuggestions: [] as any[],
    showMindMap: false,
    showInsightPanel: false,
    collectedInsights: [] as any[],
    savedNotes: [] as any[]
  });

  // 登录状态管理
  const loginState = useSignal({
    showExpiredDialog: false,
    isLoggingOut: false
  });

  // 获取API密钥指导信息
  const getApiKeyGuide = (providerId: string) => {
    const guides = {
      openai: {
        url: "https://platform.openai.com/api-keys",
        guide: "访问 OpenAI 官网 → 登录账户 → API Keys → Create new secret key"
      },
      anthropic: {
        url: "https://console.anthropic.com/",
        guide: "访问 Anthropic 控制台 → 登录账户 → API Keys → Create Key"
      },
      google: {
        url: "https://ai.google.dev/",
        guide: "访问 Google AI Studio → 获取 API 密钥"
      },
      baidu: {
        url: "https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application",
        guide: "百度云控制台 → 千帆大模型平台 → 应用接入 → 创建应用"
      },
      alibaba: {
        url: "https://dashscope.console.aliyun.com/api-key",
        guide: "阿里云控制台 → DashScope → API-KEY 管理 → 创建新的API-KEY"
      },
      zhipu: {
        url: "https://open.bigmodel.cn/usercenter/apikeys",
        guide: "智谱AI开放平台 → 用户中心 → API Keys → 添加新的API Key"
      },
      moonshot: {
        url: "https://platform.moonshot.cn/console/api-keys",
        guide: "Moonshot AI 控制台 → API Keys → 新建"
      },
      deepseek: {
        url: "https://platform.deepseek.com/api_keys",
        guide: "DeepSeek 开放平台 → API Keys → 创建API Key"
      },
      ollama: {
        url: "https://ollama.ai/download",
        guide: "本地安装 Ollama → 下载并运行模型 → 无需API密钥"
      }
    };
    
    return guides[providerId] || { url: "", guide: "请查阅服务提供商官方文档" };
  };

  // 处理高级选项变化
  const handleDetailLevelChange = (level: "brief" | "standard" | "detailed") => {
    aiSettings.value = {
      ...aiSettings.value,
      detailLevel: level
    };
    // 保存设置
    localStorage.setItem("weread_aiSettings", JSON.stringify(aiSettings.value));
    console.log("分析详细度已设置为:", level);
  };

  const handleLanguageChange = (language: "zh" | "en") => {
    aiSettings.value = {
      ...aiSettings.value,
      language: language
    };
    // 保存设置
    localStorage.setItem("weread_aiSettings", JSON.stringify(aiSettings.value));
    console.log("输出语言已设置为:", language);
  };

  // 加载AI高级设置
  const loadAISettings = () => {
    const saved = localStorage.getItem("weread_aiSettings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        aiSettings.value = settings;
        console.log("已加载AI高级设置:", aiSettings.value);
      } catch (error) {
        console.warn("AI高级设置解析失败:", error);
      }
    }
  };

  // AI配置状态 - 支持多厂商-模型的API key映射
  const aiConfig = useSignal({
    provider: "",
    apiUrl: "",
    model: "",
    availableModels: [] as any[],
    // 厂商-模型的API key映射关系
    apiKeys: {} as Record<string, Record<string, string>>, // provider -> model -> apiKey
    currentApiKey: "" // 当前选中模型的API key
  });

  // 右键菜单状态
  const contextMenu = useSignal({
    show: false,
    x: 0,
    y: 0,
    selectedText: "",
    selectedElement: null as Element | null
  });

  // AI请求状态
  const aiRequestState = useSignal({
    loading: false,
    error: "",
    result: null as any
  });

  // AI厂商配置数据
  const AI_PROVIDERS = [
    {
      id: "openai",
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      requiresKey: true,
      models: [
        { id: "gpt-4", name: "GPT-4", description: "最强大的通用模型" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "更快速的GPT-4版本" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "高性价比选择" },
        { id: "gpt-4o", name: "GPT-4o", description: "多模态模型" }
      ]
    },
    {
      id: "anthropic", 
      name: "Anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      requiresKey: true,
      models: [
        { id: "claude-3-opus", name: "Claude 3 Opus", description: "最强大的Claude模型" },
        { id: "claude-3-sonnet", name: "Claude 3 Sonnet", description: "平衡性能和成本" },
        { id: "claude-3-haiku", name: "Claude 3 Haiku", description: "快速响应" },
        { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", description: "最新版本" }
      ]
    },
    {
      id: "google",
      name: "Google AI", 
      baseUrl: "https://generativelanguage.googleapis.com/v1",
      requiresKey: true,
      models: [
        { id: "gemini-pro", name: "Gemini Pro", description: "Google的旗舰模型" },
        { id: "gemini-pro-vision", name: "Gemini Pro Vision", description: "支持图像的多模态模型" },
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "最新版本" }
      ]
    },
    {
      id: "baidu",
      name: "百度文心",
      baseUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop",
      requiresKey: true,
      models: [
        { id: "ernie-bot", name: "文心一言", description: "百度的对话模型" },
        { id: "ernie-bot-turbo", name: "文心一言 Turbo", description: "更快的响应速度" },
        { id: "ernie-bot-4", name: "文心一言 4.0", description: "最新版本" }
      ]
    },
    {
      id: "alibaba",
      name: "阿里通义",
      baseUrl: "https://dashscope.aliyuncs.com/api/v1", 
      requiresKey: true,
      models: [
        { id: "qwen-turbo", name: "通义千问 Turbo", description: "快速响应版本" },
        { id: "qwen-plus", name: "通义千问 Plus", description: "增强版本" },
        { id: "qwen-max", name: "通义千问 Max", description: "最强版本" }
      ]
    },
    {
      id: "zhipu",
      name: "智谱AI",
      baseUrl: "https://open.bigmodel.cn/api/paas/v4",
      requiresKey: true,
      models: [
        { id: "glm-4", name: "GLM-4", description: "智谱最新模型" },
        { id: "glm-3-turbo", name: "GLM-3 Turbo", description: "高性价比版本" },
        { id: "chatglm_pro", name: "ChatGLM Pro", description: "专业版本" }
      ]
    },
    {
      id: "moonshot",
      name: "Moonshot AI",
      baseUrl: "https://api.moonshot.cn/v1",
      requiresKey: true,
      models: [
        { id: "moonshot-v1-8k", name: "Moonshot v1 8K", description: "8K上下文" },
        { id: "moonshot-v1-32k", name: "Moonshot v1 32K", description: "32K上下文" },
        { id: "moonshot-v1-128k", name: "Moonshot v1 128K", description: "128K上下文" }
      ]
    },
    {
      id: "deepseek",
      name: "DeepSeek", 
      baseUrl: "https://api.deepseek.com/v1",
      requiresKey: true,
      models: [
        { id: "deepseek-chat", name: "DeepSeek Chat", description: "对话模型" },
        { id: "deepseek-coder", name: "DeepSeek Coder", description: "代码专用模型" }
      ]
    },
    {
      id: "ollama",
      name: "Ollama (本地)",
      baseUrl: "http://localhost:11434/api",
      requiresKey: false,
      models: [
        { id: "llama2", name: "Llama 2", description: "Meta开源模型" },
        { id: "llama2:13b", name: "Llama 2 13B", description: "13B参数版本" },
        { id: "codellama", name: "Code Llama", description: "代码专用模型" },
        { id: "mistral", name: "Mistral", description: "高效开源模型" },
        { id: "qwen", name: "Qwen", description: "通义千问开源版" }
      ]
    },
    {
      id: "custom",
      name: "自定义",
      baseUrl: "",
      requiresKey: false,
      models: []
    }
  ];

  // 快速配置预设 - 支持API key映射，切换时不清空
  const applyQuickConfig = (providerId: string) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      const defaultModel = provider.models.length > 0 ? provider.models[0] : null;
      
      // 获取当前厂商的API key映射
      const providerApiKeys = aiConfig.value.apiKeys[providerId] || {};
      const modelApiKey = defaultModel ? (providerApiKeys[defaultModel.id] || "") : "";
      
      aiConfig.value = {
        ...aiConfig.value,
        provider: providerId,
        apiUrl: provider.baseUrl,
        model: defaultModel ? defaultModel.id : "",
        availableModels: provider.models,
        currentApiKey: modelApiKey
      };
      
      // 实时保存配置
      saveAIConfig();
      
      console.log("应用快速配置:", {
        provider: providerId,
        model: defaultModel?.id,
        hasApiKey: !!modelApiKey
      });
    }
  };

  // 保存AI配置
  const saveAIConfig = () => {
    localStorage.setItem("weread_aiConfig", JSON.stringify(aiConfig.value));
  };

  // 加载AI配置
  const loadAIConfig = () => {
    const saved = localStorage.getItem("weread_aiConfig");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        const provider = AI_PROVIDERS.find(p => p.id === config.provider);
        aiConfig.value = {
          ...aiConfig.value,
          ...config,
          // 确保apiKeys结构存在
          apiKeys: config.apiKeys || {},
          availableModels: provider ? provider.models : [],
          // 设置当前API key
          currentApiKey: config.apiKeys && config.provider && config.model 
            ? (config.apiKeys[config.provider]?.[config.model] || "")
            : (config.apiKey || "")
        };
        console.log("已加载AI配置:", aiConfig.value);
      } catch (error) {
        console.warn("AI配置解析失败:", error);
      }
    }
  };

  // 更新API key - 按厂商-模型映射存储
  const updateApiKey = (providerId: string, modelId: string, apiKey: string) => {
    const newApiKeys = { ...aiConfig.value.apiKeys };
    if (!newApiKeys[providerId]) {
      newApiKeys[providerId] = {};
    }
    newApiKeys[providerId][modelId] = apiKey;
    
    aiConfig.value = {
      ...aiConfig.value,
      apiKeys: newApiKeys,
      currentApiKey: (providerId === aiConfig.value.provider && modelId === aiConfig.value.model) ? apiKey : aiConfig.value.currentApiKey
    };
    
    saveAIConfig();
  };

  // 切换模型时自动加载对应API key
  const handleModelChange = (modelId: string) => {
    const providerId = aiConfig.value.provider;
    const modelApiKey = aiConfig.value.apiKeys[providerId]?.[modelId] || "";
    
    aiConfig.value = {
      ...aiConfig.value,
      model: modelId,
      currentApiKey: modelApiKey
    };
    
    saveAIConfig();
  };

  // 真实的AI请求函数
  const makeAIRequest = async (type: string, content: string, options: any = {}) => {
    if (!aiConfig.value.provider || !aiConfig.value.model) {
      throw new Error("请先配置AI模型");
    }

    if (!aiConfig.value.currentApiKey && AI_PROVIDERS.find(p => p.id === aiConfig.value.provider)?.requiresKey) {
      throw new Error("请先设置API密钥");
    }

    aiRequestState.value = {
      loading: true,
      error: "",
      result: null
    };

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          content,
          options: {
            ...options,
            provider: aiConfig.value.provider,
            model: aiConfig.value.model,
            apiKey: aiConfig.value.currentApiKey,
            apiUrl: aiConfig.value.apiUrl,
            detailLevel: aiSettings.value.detailLevel,
            language: aiSettings.value.language
          }
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "AI分析失败");
      }

      aiRequestState.value = {
        loading: false,
        error: "",
        result: result.data
      };

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "网络错误";
      aiRequestState.value = {
        loading: false,
        error: errorMessage,
        result: null
      };
      throw error;
    }
  };

  // 头脑风暴AI请求
  const makeBrainstormRequest = async (type: string, content: string, options: any = {}) => {
    if (!aiConfig.value.provider || !aiConfig.value.model) {
      throw new Error("请先配置AI模型");
    }

    try {
      const response = await fetch('/api/ai/brainstorm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          content,
          options: {
            ...options,
            provider: aiConfig.value.provider,
            model: aiConfig.value.model,
            apiKey: aiConfig.value.currentApiKey,
            apiUrl: aiConfig.value.apiUrl
          }
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "头脑风暴生成失败");
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "网络错误";
      throw new Error(errorMessage);
    }
  };

  // 长按检测
  const longPressTimer = useRef<number>(0);
  const isLongPress = useRef(false);

  // 处理文本选择和右键菜单
  const handleTextInteraction = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      contextMenu.value = {
        show: true,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 5,
        selectedText: selectedText,
        selectedElement: range.commonAncestorContainer.parentElement
      };
    }
  };

  // 隐藏右键菜单
  const hideContextMenu = () => {
    contextMenu.value = {
      ...contextMenu.value,
      show: false
    };
  };

  // AI功能菜单选项
  const aiMenuOptions = [
    { id: "sentence", label: "句子分析", icon: "📝" },
    { id: "insights", label: "智能洞察", icon: "💡" },
    { id: "question_chain", label: "提问链", icon: "❓" },
    { id: "multi_ai", label: "多AI分析", icon: "🤖" },
    { id: "debate", label: "观点辩论", icon: "⚖️" },
    { id: "creative", label: "创意拓展", icon: "🎨" }
  ];

  // 处理AI菜单选择
  const handleAIMenuSelect = async (optionId: string) => {
    if (!contextMenu.value.selectedText) return;
    
    hideContextMenu();
    
    try {
      let result;
      
      switch (optionId) {
        case "sentence":
          result = await makeAIRequest("sentence", contextMenu.value.selectedText);
          showAIResult("句子分析", result);
          break;
        case "insights":
          result = await makeBrainstormRequest("insights_bubble", contextMenu.value.selectedText);
          showInsightsBubbles(result.insights || []);
          break;
        case "question_chain":
          result = await makeBrainstormRequest("question_chain", contextMenu.value.selectedText);
          startQuestionChain(result.questionChain || []);
          break;
        case "multi_ai":
          result = await makeBrainstormRequest("multi_ai", contextMenu.value.selectedText);
          showMultiAIResults(result.multiAIResults || []);
          break;
        case "debate":
          result = await makeAIRequest("debate", contextMenu.value.selectedText);
          showDebateAnalysis(result.debatePositions || []);
          break;
        case "creative":
          result = await makeBrainstormRequest("creative_alternatives", contextMenu.value.selectedText);
          showCreativeAlternatives(result.creativeAlternatives || []);
          break;
        default:
          break;
      }
    } catch (error) {
      showNotification("AI分析失败: " + (error instanceof Error ? error.message : "未知错误"), "error");
    }
  };

  // 显示AI分析结果（替代alert）
  const showAIResult = (title: string, result: any) => {
    brainstormState.value = {
      ...brainstormState.value,
      active: true,
      mode: "insights_bubble",
      showInsightPanel: true,
      currentInsights: [{
        type: "AI分析",
        icon: "🤖",
        title: title,
        content: result.analysis || "分析完成",
        confidence: 0.9,
        expandable: true,
        details: result.keyPoints?.join("\n") || "详细信息"
      }]
    };
  };

  // 显示通知（替代alert）
  const notification = useSignal({
    show: false,
    message: "",
    type: "info" as "info" | "success" | "error" | "warning"
  });

  const showNotification = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    notification.value = {
      show: true,
      message,
      type
    };
    
    // 3秒后自动隐藏
    setTimeout(() => {
      notification.value = {
        ...notification.value,
        show: false
      };
    }, 3000);
  };

  // 显示洞察气泡
  const showInsightsBubbles = (insights: any[]) => {
    brainstormState.value = {
      ...brainstormState.value,
      active: true,
      mode: "insights_bubble",
      showInsightPanel: true,
      currentInsights: insights
    };
  };

  // 开始问题链
  const startQuestionChain = (questions: string[]) => {
    brainstormState.value = {
      ...brainstormState.value,
      active: true,
      mode: "question_chain",
      showInsightPanel: true,
      questionChain: questions,
      currentQuestionIndex: 0
    };
  };

  // 显示多AI结果
  const showMultiAIResults = (results: any[]) => {
    brainstormState.value = {
      ...brainstormState.value,
      active: true,
      mode: "multi_ai",
      showInsightPanel: true,
      multiAIResults: results
    };
  };

  // 显示辩论分析
  const showDebateAnalysis = (positions: any[]) => {
    brainstormState.value = {
      ...brainstormState.value,
      active: true,
      mode: "debate",
      showInsightPanel: true,
      debatePositions: positions
    };
  };

  // 显示创意替代方案
  const showCreativeAlternatives = (alternatives: any[]) => {
    brainstormState.value = {
      ...brainstormState.value,
      active: true,
      mode: "insights_bubble",
      showInsightPanel: true,
      creativeSuggestions: alternatives
    };
  };
  

  // 处理厂商选择变化 - 支持API key映射，切换时不清空
  const handleProviderChange = (providerId: string) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      const defaultModel = provider.models.length > 0 ? provider.models[0] : null;
      
      // 获取当前厂商的API key映射
      const providerApiKeys = aiConfig.value.apiKeys[providerId] || {};
      const modelApiKey = defaultModel ? (providerApiKeys[defaultModel.id] || "") : "";
      
      aiConfig.value = {
        ...aiConfig.value,
        provider: providerId,
        apiUrl: provider.baseUrl,
        model: defaultModel ? defaultModel.id : "",
        availableModels: provider.models,
        currentApiKey: modelApiKey
      };
      
      saveAIConfig();
      console.log("切换到厂商:", provider.name, "API地址:", provider.baseUrl, "默认模型:", defaultModel?.name || "无");
    }
  };

  // 处理API地址变化
  const handleApiUrlChange = (apiUrl: string) => {
    aiConfig.value = {
      ...aiConfig.value,
      apiUrl: apiUrl
    };
    saveAIConfig();
  };

  // 处理API密钥变化 - 支持厂商-模型映射
  const handleApiKeyChange = (apiKey: string) => {
    const providerId = aiConfig.value.provider;
    const modelId = aiConfig.value.model;
    
    if (providerId && modelId) {
      updateApiKey(providerId, modelId, apiKey);
    }
    
    // 也更新当前API key
    aiConfig.value = {
      ...aiConfig.value,
      currentApiKey: apiKey
    };
  };

  // 头脑风暴相关功能
  const triggerSentenceAnalysis = async (sentence: string, element: Element) => {
    if (!sentence.trim()) return;
    
    try {
      brainstormState.value = {
        ...brainstormState.value,
        selectedSentence: sentence,
        selectedElement: element,
        showInsightPanel: true
      };
      
      // 高亮选中的句子
      highlightSelectedSentence(element);
      
      // 生成灵感气泡
      const response = await fetch("/api/ai/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "insights_bubble",
          content: sentence,
          options: {
            depth: 3
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          brainstormState.value = {
            ...brainstormState.value,
            currentInsights: data.data.insights || []
          };
        }
      }
    } catch (error) {
      console.error("句子分析失败:", error);
    }
  };

  const generateQuestionChain = async (content: string) => {
    if (!aiConfig.value.provider || !aiConfig.value.model) {
      showNotification("请先在AI设置中配置模型", "warning");
      return;
    }
    
    try {
      showNotification("正在生成深度思考问题链...", "info");
      
      const response = await fetch("/api/ai/brainstorm", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "question_chain",
          content: content,
          options: { 
            depth: 8,
            provider: aiConfig.value.provider,
            model: aiConfig.value.model,
            apiKey: aiConfig.value.currentApiKey,
            apiUrl: aiConfig.value.apiUrl,
            detailLevel: aiSettings.value.detailLevel
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          brainstormState.value = {
            ...brainstormState.value,
            questionChain: data.data.questionChain || [],
            currentQuestionIndex: 0,
            mode: "question_chain",
            showInsightPanel: true
          };
          showNotification("深度思考问题链已生成", "success");
        } else {
          showNotification("生成失败: " + (data.error || "未知错误"), "error");
        }
      } else {
        showNotification("请求失败，请检查网络连接", "error");
      }
    } catch (error) {
      console.error("问题链生成失败:", error);
      showNotification("问题链生成失败: " + (error instanceof Error ? error.message : "未知错误"), "error");
    }
  };

  const generateMultiAIAnalysis = async (content: string) => {
    if (!aiConfig.value.provider || !aiConfig.value.model) {
      showNotification("请先在AI设置中配置模型", "warning");
      return;
    }
    
    try {
      showNotification("正在进行文章分析...", "info");
      
      const response = await fetch("/api/ai/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "multi_ai",
          content: content,
          options: {
            aiProviders: ["gpt-4", "claude-3", "gemini-pro", "qwen-max"],
            provider: aiConfig.value.provider,
            model: aiConfig.value.model,
            apiKey: aiConfig.value.currentApiKey,
            apiUrl: aiConfig.value.apiUrl,
            detailLevel: aiSettings.value.detailLevel
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          brainstormState.value = {
            ...brainstormState.value,
            multiAIResults: data.data.multiAIResults || [],
            mode: "multi_ai",
            showInsightPanel: true
          };
          showNotification("文章分析已完成", "success");
        } else {
          showNotification("分析失败: " + (data.error || "未知错误"), "error");
        }
      } else {
        showNotification("请求失败，请检查网络连接", "error");
      }
    } catch (error) {
      console.error("多AI分析失败:", error);
      showNotification("文章分析失败: " + (error instanceof Error ? error.message : "未知错误"), "error");
    }
  };

  const generateDebateAnalysis = async (content: string) => {
    if (!aiConfig.value.provider || !aiConfig.value.model) {
      showNotification("请先在AI设置中配置模型", "warning");
      return;
    }
    
    try {
      showNotification("正在生成观点辩论分析...", "info");
      
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "debate",
          content: content,
          options: { 
            focus: "philosophical",
            provider: aiConfig.value.provider,
            model: aiConfig.value.model,
            apiKey: aiConfig.value.currentApiKey,
            apiUrl: aiConfig.value.apiUrl,
            detailLevel: aiSettings.value.detailLevel
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          brainstormState.value = {
            ...brainstormState.value,
            debatePositions: data.data.debatePositions || [],
            mode: "debate", 
            showInsightPanel: true
          };
          showNotification("观点辩论分析已完成", "success");
        } else {
          showNotification("辩论分析失败: " + (data.error || "未知错误"), "error");
        }
      } else {
        showNotification("请求失败，请检查网络连接", "error");
      }
    } catch (error) {
      console.error("辩论分析失败:", error);
      showNotification("观点辩论分析失败: " + (error instanceof Error ? error.message : "未知错误"), "error");
    }
  };

  const highlightSelectedSentence = (element: Element) => {
    // 移除之前的高亮
    const prevHighlight = contentRef.current?.querySelector(".brainstorm-highlight");
    if (prevHighlight) {
      prevHighlight.classList.remove("brainstorm-highlight");
    }
    
    // 添加新的高亮
    element.classList.add("brainstorm-highlight");
  };

  const collectInsight = (insight: any) => {
    const newInsight = {
      ...insight,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      source: brainstormState.value.selectedSentence.substring(0, 50) + "..."
    };
    
    brainstormState.value = {
      ...brainstormState.value,
      collectedInsights: [...brainstormState.value.collectedInsights, newInsight]
    };
    
    // 保存到localStorage
    localStorage.setItem("weread_collectedInsights", JSON.stringify(brainstormState.value.collectedInsights));
  };

  const saveNote = (content: string, type: string = "note") => {
    const note = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date().toISOString(),
      bookId: bookId.value,
      chapterUid: chapterUid.value,
      relatedSentence: brainstormState.value.selectedSentence.substring(0, 100) + "..."
    };
    
    brainstormState.value = {
      ...brainstormState.value,
      savedNotes: [...brainstormState.value.savedNotes, note]
    };
    
    localStorage.setItem("weread_savedNotes", JSON.stringify(brainstormState.value.savedNotes));
  };

  const loadBrainstormData = () => {
    const savedInsights = localStorage.getItem("weread_collectedInsights");
    const savedNotes = localStorage.getItem("weread_savedNotes");
    
    if (savedInsights) {
      try {
        const insights = JSON.parse(savedInsights);
        brainstormState.value = {
          ...brainstormState.value,
          collectedInsights: insights
        };
      } catch (error) {
        console.warn("收集的洞察解析失败:", error);
      }
    }
    
    if (savedNotes) {
      try {
        const notes = JSON.parse(savedNotes);
        brainstormState.value = {
          ...brainstormState.value,
          savedNotes: notes
        };
      } catch (error) {
        console.warn("保存的笔记解析失败:", error);
      }
    }
  };

  // 测试AI连接
  const testConnection = async () => {
    if (!aiConfig.value.apiUrl || !aiConfig.value.model) {
      showNotification("请先配置API地址和模型", "warning");
      return;
    }

    const button = document.querySelector('.test-connection-btn') as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = "测试中...";
    }

    try {
      // 这里模拟连接测试
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 随机成功或失败（实际项目中应该真实测试API）
      const success = Math.random() > 0.3;
      
      if (success) {
        showNotification("✅ 连接测试成功！", "success");
      } else {
        showNotification("❌ 连接测试失败，请检查配置", "error");
      }
    } catch (error) {
      showNotification("❌ 连接测试出错：" + (error instanceof Error ? error.message : "未知错误"), "error");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "测试连接";
      }
    }
  };

  // 语音搜索状态
  const voiceSearchQuery = useSignal("");

  // 引用
  const contentRef = useRef<HTMLDivElement>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const availableVoices = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("weread_token");
    if (!token) {
      globalThis.location.href = "/login";
      return;
    }

    // 从URL获取参数
    const path = globalThis.location.pathname;
    const parts = path.split("/");
    const bookIdFromUrl = parts[2];
    const chapterUidFromUrl = parts[3];

    if (!bookIdFromUrl || !chapterUidFromUrl) {
      error.value = "缺少必要参数";
      loading.value = false;
      return;
    }

    bookId.value = bookIdFromUrl;
    chapterUid.value = chapterUidFromUrl;

    // 加载数据
    loadChapterContent(token, bookIdFromUrl, chapterUidFromUrl);
    loadChapterList(token, bookIdFromUrl);

    // 加载设置
    loadSettings();

    // 加载AI配置
    loadAIConfig();

    // 加载AI高级设置
    loadAISettings();

    // 加载头脑风暴数据
    loadBrainstormData();

    // 初始化TTS
    initializeTTS();

    // 设置自动隐藏定时器
    resetHideTimer();

    // 监听用户活动
    const handleUserActivity = () => {
      showTopBar.value = true;
      showBottomBar.value = true;
      resetHideTimer();
    };

    // 句子点击监听器（头脑风暴功能）
    const handleSentenceClick = (event: MouseEvent) => {
      if (brainstormState.value.mode !== "sentence_click") return;
      
      const target = event.target as Element;
      if (!target || !contentRef.current?.contains(target)) return;
      
      // 查找最近的包含文本的元素
      let textElement = target;
      while (textElement && textElement !== contentRef.current) {
        if (textElement.nodeType === Node.ELEMENT_NODE && textElement.textContent?.trim()) {
          const text = textElement.textContent.trim();
          if (text.length > 10) { // 至少10个字符才处理
            triggerSentenceAnalysis(text, textElement);
            break;
          }
        }
        textElement = textElement.parentElement || textElement;
      }
    };

    // 长按文本选择监听器
    const handleMouseDown = (event: MouseEvent) => {
      isLongPress.current = false;
      longPressTimer.current = window.setTimeout(() => {
        isLongPress.current = true;
      }, 500); // 500ms判定为长按
    };

    const handleMouseUp = (event: MouseEvent) => {
      window.clearTimeout(longPressTimer.current);
      
      // 如果是长按且有选中文本，显示右键菜单
      if (isLongPress.current) {
        setTimeout(() => {
          handleTextInteraction();
        }, 100);
      }
    };

    // 触摸设备长按支持
    const handleTouchStart = (event: TouchEvent) => {
      isLongPress.current = false;
      longPressTimer.current = window.setTimeout(() => {
        isLongPress.current = true;
      }, 500);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      window.clearTimeout(longPressTimer.current);
      
      if (isLongPress.current) {
        setTimeout(() => {
          handleTextInteraction();
        }, 100);
      }
    };

    // 右键菜单
    const handleContextMenu = (event: MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        event.preventDefault();
        handleTextInteraction();
      }
    };

    // 点击隐藏右键菜单
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.ai-context-menu')) {
        hideContextMenu();
      }
    };

    document.addEventListener("mousemove", handleUserActivity);
    document.addEventListener("click", handleUserActivity);
    document.addEventListener("touchstart", handleUserActivity);
    document.addEventListener("click", handleSentenceClick);
    
    // 文本选择和AI菜单事件监听
    if (contentRef.current) {
      contentRef.current.addEventListener("mousedown", handleMouseDown);
      contentRef.current.addEventListener("mouseup", handleMouseUp);
      contentRef.current.addEventListener("touchstart", handleTouchStart);
      contentRef.current.addEventListener("touchend", handleTouchEnd);
      contentRef.current.addEventListener("contextmenu", handleContextMenu);
    }
    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("mousemove", handleUserActivity);
      document.removeEventListener("click", handleUserActivity);
      document.removeEventListener("touchstart", handleUserActivity);
      document.removeEventListener("click", handleSentenceClick);
      document.removeEventListener("click", handleDocumentClick);
      
      if (contentRef.current) {
        contentRef.current.removeEventListener("mousedown", handleMouseDown);
        contentRef.current.removeEventListener("mouseup", handleMouseUp);
        contentRef.current.removeEventListener("touchstart", handleTouchStart);
        contentRef.current.removeEventListener("touchend", handleTouchEnd);
        contentRef.current.removeEventListener("contextmenu", handleContextMenu);
      }
      
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    stopTTS();
    stopPreview(); // 清理试听
    stopAutoReading();
  };

  const resetHideTimer = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (
        !showSettings.value && !showChapterList.value &&
        !ttsState.value.isPlaying
      ) {
        showTopBar.value = false;
        showBottomBar.value = false;
      }
    }, 3000);
  };

  const loadSettings = () => {
    // 加载基础阅读设置，如果没有保存的值则使用默认值
    fontSize.value = parseInt(
      localStorage.getItem("weread_fontSize") ||
        defaultSettings.fontSize.toString(),
    );
    lineHeight.value = parseFloat(
      localStorage.getItem("weread_lineHeight") ||
        defaultSettings.lineHeight.toString(),
    );
    theme.value = localStorage.getItem("weread_theme") || defaultSettings.theme;
    fontFamily.value = localStorage.getItem("weread_fontFamily") ||
      defaultSettings.fontFamily;
    pageWidth.value = localStorage.getItem("weread_pageWidth") ||
      defaultSettings.pageWidth;

    // 加载TTS设置，智能合并默认值和保存的值
    const savedTtsSettings = localStorage.getItem("weread_ttsSettings");
    if (savedTtsSettings) {
      try {
        const parsed = JSON.parse(savedTtsSettings);
        ttsSettings.value = { ...defaultSettings.ttsSettings, ...parsed };
      } catch (error) {
        console.warn("TTS设置解析失败，使用默认设置:", error);
        ttsSettings.value = { ...defaultSettings.ttsSettings };
      }
    }

    // 加载自动阅读设置
    const savedAutoReading = localStorage.getItem("weread_autoReading");
    if (savedAutoReading) {
      try {
        const parsed = JSON.parse(savedAutoReading);
        autoReading.value = { ...defaultSettings.autoReading, ...parsed };
      } catch (error) {
        console.warn("自动阅读设置解析失败，使用默认设置:", error);
        autoReading.value = { ...defaultSettings.autoReading };
      }
    }

    console.log("设置加载完成:", {
      fontSize: fontSize.value,
      ttsEngine: ttsSettings.value.engine,
      ttsVoice: ttsSettings.value.voiceURI,
    });
  };

  const saveSettings = () => {
    // 实时保存所有设置到localStorage
    localStorage.setItem("weread_fontSize", fontSize.value.toString());
    localStorage.setItem("weread_lineHeight", lineHeight.value.toString());
    localStorage.setItem("weread_theme", theme.value);
    localStorage.setItem("weread_fontFamily", fontFamily.value);
    localStorage.setItem("weread_pageWidth", pageWidth.value);
    localStorage.setItem(
      "weread_ttsSettings",
      JSON.stringify(ttsSettings.value),
    );
    localStorage.setItem(
      "weread_autoReading",
      JSON.stringify(autoReading.value),
    );

    console.log("设置已保存:", {
      ttsEngine: ttsSettings.value.engine,
      ttsVoice: ttsSettings.value.voiceURI,
    });
  };

  // 实时保存设置的辅助函数
  const updateTTSSettings = (
    updates: Partial<typeof defaultSettings.ttsSettings>,
  ) => {
    ttsSettings.value = { ...ttsSettings.value, ...updates };
    saveSettings();
  };

  const updateReadingSettings = (key: string, value: any) => {
    switch (key) {
      case "fontSize":
        fontSize.value = value;
        break;
      case "lineHeight":
        lineHeight.value = value;
        break;
      case "theme":
        theme.value = value;
        break;
      case "fontFamily":
        fontFamily.value = value;
        break;
      case "pageWidth":
        pageWidth.value = value;
        break;
    }
    saveSettings();
  };

  const initializeTTS = async () => {
    if (typeof window !== "undefined" && globalThis.speechSynthesis) {
      speechSynthesis.current = globalThis.speechSynthesis;

      // 初始化浏览器语音列表
      const loadVoices = () => {
        const voices = speechSynthesis.current?.getVoices() || [];
        availableVoices.current = voices;
        console.log("可用浏览器语音数量:", voices.length);
      };

      loadVoices();
      speechSynthesis.current.addEventListener("voiceschanged", loadVoices);

      // 加载外部TTS语音列表
      await loadExternalVoices();
    }
  };

  const loadExternalVoices = async () => {
    try {
      const response = await fetch("/api/tts/voices?engine=all");
      if (response.ok) {
        const voices = await response.json();
        ttsState.value = { ...ttsState.value, azureVoices: voices };
        console.log("外部TTS语音加载完成:", voices.length, "个语音");

        // 检查服务状态
        const hasLeftsite = voices.some((v: any) => v.provider === "leftsite");
        const hasOpenxing = voices.some((v: any) => v.provider === "openxing");

        if (hasLeftsite || hasOpenxing) {
          ttsState.value = { ...ttsState.value, serviceStatus: "available" };
          console.log("外部TTS服务可用");

          // 智能设置默认语音
          setDefaultVoiceForEngine();
        } else {
          ttsState.value = { ...ttsState.value, serviceStatus: "unavailable" };
          console.log("外部TTS服务不可用，回退到浏览器TTS");
        }
      } else {
        throw new Error("语音列表加载失败");
      }
    } catch (error) {
      console.warn("外部TTS语音加载失败:", error);
      ttsState.value = { ...ttsState.value, serviceStatus: "unavailable" };
    }
  };

  // 为当前引擎设置默认语音（如果还没有设置的话）
  const setDefaultVoiceForEngine = () => {
    const currentEngine = ttsSettings.value.engine;
    const currentVoice = ttsSettings.value.voiceURI;

    // 如果已经设置了语音且该语音适合当前引擎，则不需要更改
    if (currentVoice) {
      const availableVoices = getAvailableVoicesForEngine(currentEngine);
      const voiceExists = availableVoices.some((v) =>
        (v.short_name || v.name) === currentVoice
      );
      if (voiceExists) {
        return; // 当前语音仍然有效
      }
    }

    // 设置引擎的第一个可用语音作为默认
    const firstVoice = getFirstVoiceForEngine(currentEngine);
    if (firstVoice) {
      updateTTSSettings({ voiceURI: firstVoice.short_name || firstVoice.name });
      console.log(
        `为 ${currentEngine} 引擎设置默认语音:`,
        firstVoice.display_name || firstVoice.name,
      );
    }
  };

  // 获取指定引擎的可用语音列表
  const getAvailableVoicesForEngine = (engine: string) => {
    if (engine === "browser") {
      return availableVoices.current;
    } else if (engine === "leftsite") {
      return ttsState.value.azureVoices.filter((v: any) =>
        v.provider === "leftsite"
      );
    } else if (engine === "openxing") {
      return ttsState.value.azureVoices.filter((v: any) =>
        v.provider === "openxing"
      );
    }
    return [];
  };

  // 获取指定引擎的第一个语音
  const getFirstVoiceForEngine = (engine: string) => {
    const voices = getAvailableVoicesForEngine(engine);
    return voices.length > 0 ? voices[0] : null;
  };

  // 智能引擎切换函数
  const switchTTSEngine = (newEngine: string) => {
    const updates: any = { engine: newEngine };

    // 根据引擎设置提供商
    if (newEngine === "leftsite") {
      updates.ttsProvider = "leftsite";
    } else if (newEngine === "openxing") {
      updates.ttsProvider = "openxing";
    }

    // 设置该引擎的第一个可用语音
    const firstVoice = getFirstVoiceForEngine(newEngine);
    if (firstVoice) {
      updates.voiceURI = firstVoice.short_name || firstVoice.name;
      console.log(
        `切换到 ${newEngine} 引擎，默认语音:`,
        firstVoice.display_name || firstVoice.name,
      );
    } else {
      updates.voiceURI = "";
      console.log(`切换到 ${newEngine} 引擎，无可用语音`);
    }

    updateTTSSettings(updates);
    
    // 如果正在播放TTS，则重新开始播放以应用新引擎
    if (ttsState.value.isPlaying) {
      // 记住当前播放位置
      const currentIndex = ttsState.value.currentSentenceIndex;
      
      // 停止当前播放
      stopTTS();
      
      // 短暂延迟后重新开始播放
      setTimeout(() => {
        // 恢复播放位置
        ttsState.value = {
          ...ttsState.value,
          currentSentenceIndex: currentIndex
        };
        startTTS();
      }, 500);
    }
  };

  const loadChapterContent = async (
    token: string,
    bookId: string,
    chapterUid: string,
  ) => {
    try {
      const response = await fetch(
        `/api/book/content?bookId=${bookId}&chapterUid=${chapterUid}&token=${token}`,
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          globalThis.location.href = "/login";
          return;
        }
        
        if (response.status === 500) {
          // 处理500错误，检查是否是登录相关的错误
          try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes("Failed to download chapter content")) {
              // 显示登录过期提示
              showLoginExpiredDialog();
              return;
            }
          } catch (e) {
            // 如果无法解析错误信息，仍然按500错误处理
          }
        }
        
        throw new Error(`加载章节失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        content.value = processContentForDisplay(data.data.content);
      } else {
        // 检查错误信息是否包含登录相关错误
        if (data.error && data.error.includes("Failed to download chapter content")) {
          showLoginExpiredDialog();
          return;
        }
        error.value = data.error || "加载失败";
      }
    } catch (err) {
      console.error("Failed to load chapter content:", err);
      error.value = `加载章节内容失败: ${err.message}`;
    }
  };

  // 显示登录过期对话框
  const showLoginExpiredDialog = () => {
    loginState.value = {
      ...loginState.value,
      showExpiredDialog: true
    };
  };

  // 关闭登录过期对话框
  const closeLoginExpiredDialog = () => {
    loginState.value = {
      ...loginState.value,
      showExpiredDialog: false
    };
  };

  // 执行退出登录
  const handleLogout = async () => {
    try {
      loginState.value = {
        ...loginState.value,
        isLoggingOut: true
      };

      // 调用退出接口
      const response = await fetch('/api/user/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: localStorage.getItem("weread_token")
        })
      });

      // 无论接口调用是否成功，都清除本地token
      localStorage.removeItem("weread_token");
      
      // 关闭对话框
      closeLoginExpiredDialog();
      
      // 跳转到登录页
      globalThis.location.href = "/login";
      
    } catch (error) {
      console.error("退出登录失败:", error);
      // 即使退出接口失败，仍然清除本地token并跳转
      localStorage.removeItem("weread_token");
      closeLoginExpiredDialog();
      globalThis.location.href = "/login";
    } finally {
      loginState.value = {
        ...loginState.value,
        isLoggingOut: false
      };
    }
  };

  const processContentForDisplay = (rawContent: string) => {
    let processedContent = rawContent;

    // 如果内容包含完整的HTML文档结构，提取body内容
    const htmlMatch = processedContent.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
    if (htmlMatch) {
      const htmlContent = htmlMatch[1];

      // 提取style标签中的样式
      const styleMatch = processedContent.match(
        /<style[^>]*>([\s\S]*?)<\/style>/i,
      );
      let styles = "";
      if (styleMatch) {
        styles = `<style>${styleMatch[1]}</style>`;
      }

      // 提取body内容
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        processedContent = styles + bodyMatch[1];
      } else {
        // 如果没有body标签，使用html内容但去掉head部分
        const headEndIndex = htmlContent.indexOf("</head>");
        if (headEndIndex !== -1) {
          processedContent = styles + htmlContent.substring(headEndIndex + 7);
        } else {
          processedContent = styles + htmlContent;
        }
      }
    }

    // 处理图片URL
    processedContent = processedContent.replace(
      /<img([^>]*?)src="([^"]*)"([^>]*?)>/g,
      (_match, before, src, after) => {
        let finalSrc = src;
        if (src.startsWith("//")) {
          finalSrc = "https:" + src;
        } else if (src.startsWith("/") && !src.startsWith("//")) {
          finalSrc = "https://res.weread.qq.com" + src;
        }
        return `<img${before}src="${finalSrc}"${after} loading="lazy">`;
      },
    );

    return processedContent;
  };

  const loadChapterList = async (token: string, bookId: string) => {
    try {
      const response = await fetch(
        `/api/book/chapters?bookId=${bookId}&token=${token}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          chapters.value = data.data.chapters || [];

          const index = chapters.value.findIndex((ch) =>
            ch.chapterUid === chapterUid.value
          );
          if (index >= 0) {
            currentChapterIndex.value = index;
            chapterTitle.value = chapters.value[index].title;
          }
        }
      }
    } catch (err) {
      console.error("Failed to load chapters:", err);
    } finally {
      loading.value = false;
    }
  };

  const navigateToChapter = async (direction: "prev" | "next") => {
    let newIndex;
    if (direction === "prev") {
      newIndex = Math.max(0, currentChapterIndex.value - 1);
    } else {
      newIndex = Math.min(
        chapters.value.length - 1,
        currentChapterIndex.value + 1,
      );
    }

    if (newIndex !== currentChapterIndex.value) {
      const newChapter = chapters.value[newIndex];

      // 停止当前的TTS和自动滚动
      stopTTS();
      stopAutoReading();

      currentChapterIndex.value = newIndex;
      chapterUid.value = newChapter.chapterUid;
      chapterTitle.value = newChapter.title;
      loading.value = true;
      content.value = "";

      globalThis.history.pushState(
        {},
        "",
        `/reader/${bookId.value}/${newChapter.chapterUid}`,
      );

      const token = localStorage.getItem("weread_token");
      if (token) {
        await loadChapterContent(token, bookId.value, newChapter.chapterUid);
      }
      loading.value = false;

      // 滚动到顶部
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  // TTS相关功能
  const extractTextContent = (
    element: Element,
  ): { sentences: string[]; elements: Element[] } => {
    const sentences: string[] = [];
    const elements: Element[] = [];

    const walkNode = (node: Node, parentElement?: Element) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          // 过滤掉不应该朗读的内容
          if (shouldSkipText(text, node.parentElement)) {
            return;
          }
          
          // 按句号、问号、感叹号分句
          const sentenceArray = text.split(/[。！？；]\s*/).filter((s) =>
            s.trim().length > 0
          );
          sentenceArray.forEach((sentence) => {
            if (sentence.trim().length > 0) {
              sentences.push(sentence.trim() + "。");
              elements.push(parentElement || element);
            }
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as Element;
        // 跳过不应该朗读的元素
        if (shouldSkipElement(elem)) {
          return;
        }
        Array.from(elem.childNodes).forEach((child) => walkNode(child, elem));
      }
    };

    walkNode(element, element);
    return { sentences, elements };
  };

  // 判断是否应该跳过某个元素
  const shouldSkipElement = (element: Element): boolean => {
    const tagName = element.tagName?.toLowerCase();
    const className = element.className || '';
    
    // 跳过脚本、样式等元素
    if (['script', 'style', 'meta', 'link', 'head', 'title'].includes(tagName)) {
      return true;
    }
    
    // 跳过隐藏元素
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return true;
    }
    
    return false;
  };

  // 判断是否应该跳过某段文本
  const shouldSkipText = (text: string, parentElement: Element | null): boolean => {
    const trimmedText = text.trim();
    
    // 跳过空文本或太短的文本
    if (trimmedText.length < 2) {
      return true;
    }
    
    // 跳过看起来像JSON的文本
    if ((trimmedText.startsWith('{') || trimmedText.startsWith('[')) && 
        (trimmedText.includes('"') || trimmedText.includes(':'))) {
      return true;
    }
    
    // 跳过看起来像URL的文本
    if (trimmedText.startsWith('http') || trimmedText.includes('://')) {
      return true;
    }
    
    // 跳过纯数字、日期或ID
    if (/^[\d\-_]+$/.test(trimmedText)) {
      return true;
    }
    
    // 跳过包含大量特殊字符的文本（可能是数据或代码）
    const specialCharsCount = (trimmedText.match(/[{}[\]"':;,]/g) || []).length;
    if (specialCharsCount > trimmedText.length * 0.2) {
      return true;
    }
    
    return false;
  };

  const startTTS = async () => {
    if (!speechSynthesis.current || !contentRef.current) return;

    // 停止现有播放
    stopTTS();

    // 提取文本内容
    const result = extractTextContent(contentRef.current);
    
    // 调试：输出提取的句子
    console.log("TTS 提取的句子数量:", result.sentences.length);
    console.log("前5个句子:", result.sentences.slice(0, 5));

    if (result.sentences.length === 0) {
      showNotification("没有可朗读的文本内容", "warning");
      return;
    }

    // 更新TTS状态
    ttsState.value = {
      ...ttsState.value,
      isPlaying: true,
      isPaused: false,
      sentences: result.sentences,
      sentenceElements: result.elements,
      currentSentenceIndex: 0,
      startTime: Date.now(),
    };

    console.log("TTS开始播放，共", result.sentences.length, "个句子");

    // 启动初始预加载（异步进行，不阻塞播放）
    if ((ttsSettings.value.engine === "leftsite" || ttsSettings.value.engine === "openxing") &&
        ttsState.value.serviceStatus === "available") {
      setTimeout(() => {
        preloadNextSentences();
      }, 100);
    }

    // 开始朗读第一句
    await speakCurrentSentence();
  };

  const speakCurrentSentence = async () => {
    const state = ttsState.value;

    if (state.currentSentenceIndex >= state.sentences.length) {
      // 章节结束，检查是否自动翻页
      if (
        ttsSettings.value.autoNext &&
        currentChapterIndex.value < chapters.value.length - 1
      ) {
        console.log("TTS自动翻页到下一章");
        
        try {
          // 记住当前TTS设置状态
          const shouldContinueTTS = ttsState.value.isPlaying;
          
          // 导航到下一章
          await navigateToChapter("next");
          
          // 等待内容加载完成后重新启动TTS
          if (shouldContinueTTS && ttsSettings.value.autoNext) {
            // 等待DOM更新和内容渲染
            setTimeout(() => {
              if (ttsSettings.value.autoNext && contentRef.current) {
                console.log("TTS自动翻页后重新开始播放");
                startTTS();
              }
            }, 1500); // 增加延迟时间确保内容完全加载
          }
        } catch (error) {
          console.error("TTS自动翻页失败:", error);
          stopTTS();
        }
      } else {
        console.log("TTS播放完成，无下一章或未启用自动翻页");
        stopTTS();
      }
      return;
    }

    const sentence = state.sentences[state.currentSentenceIndex];
    if (!sentence?.trim()) {
      // 跳过空句子
      ttsState.value = {
        ...state,
        currentSentenceIndex: state.currentSentenceIndex + 1,
      };
      await speakCurrentSentence();
      return;
    }

    // 高亮当前句子对应的元素
    highlightCurrentSentence();

    // 根据引擎选择播放方式
    if (
      (ttsSettings.value.engine === "leftsite" ||
        ttsSettings.value.engine === "openxing") &&
      ttsState.value.serviceStatus === "available"
    ) {
      await speakWithExternalTTS(sentence);
    } else {
      await speakWithBrowserTTS(sentence);
    }
  };

  const speakWithBrowserTTS = async (sentence: string) => {
    if (!speechSynthesis.current) return;

    // 停止之前的语音合成
    if (speechSynthesis.current && ttsState.value.utterance) {
      speechSynthesis.current.cancel();
    }

    // 创建语音合成utterance
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = ttsSettings.value.rate;
    utterance.volume = ttsSettings.value.volume;
    utterance.pitch = ttsSettings.value.pitch;

    // 选择中文语音
    const chineseVoice = availableVoices.current.find((voice) =>
      voice.lang.includes("zh") || voice.lang.includes("CN")
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    // 设置播放完成回调
    utterance.onend = () => {
      if (ttsState.value.isPlaying) {
        ttsState.value = {
          ...ttsState.value,
          currentSentenceIndex: ttsState.value.currentSentenceIndex + 1,
        };

        // 延迟一点再播放下一句
        setTimeout(() => {
          if (ttsState.value.isPlaying) {
            speakCurrentSentence();
          }
        }, 200);
      }
    };

    utterance.onerror = (event) => {
      console.error("语音合成错误:", event);
      stopTTS();
    };

    // 更新utterance引用并开始播放
    ttsState.value = {
      ...ttsState.value,
      utterance: utterance,
    };

    speechSynthesis.current.speak(utterance);
    console.log("浏览器TTS播放句子:", sentence.substring(0, 50) + "...");
  };

  const speakWithExternalTTS = async (sentence: string) => {
    try {
      const currentIndex = ttsState.value.currentSentenceIndex;
      const voice = ttsSettings.value.voiceURI || "Dylan";
      
      // 停止之前的音频并清除其回调
      if (ttsState.value.currentAudio) {
        const prevAudio = ttsState.value.currentAudio;
        prevAudio.pause();
        prevAudio.onended = null; // 清除回调防止重复调用
        prevAudio.onerror = null;
      }

      let audioUrl = "";
      
      // 检查是否有预加载的音频
      if (ttsState.value.preloadQueue[currentIndex]) {
        audioUrl = ttsState.value.preloadQueue[currentIndex];
        console.log(`使用预加载音频: 句子 ${currentIndex}`, sentence.substring(0, 30) + "...");
      } else {
        // 没有预加载，实时生成
        console.log(`实时生成音频: 句子 ${currentIndex}`, sentence.substring(0, 30) + "...");
        audioUrl = await generateAudioUrl(sentence, voice);
      }

      // 创建音频元素
      const audio = new Audio(audioUrl);
      audio.volume = ttsSettings.value.volume;
      
      audio.onended = () => {
        // 清理临时URL
        if (ttsSettings.value.engine === "openxing" && audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
        
        // 播放下一句
        if (ttsState.value.isPlaying) {
          ttsState.value = {
            ...ttsState.value,
            currentSentenceIndex: ttsState.value.currentSentenceIndex + 1,
          };
          
          // 清理过期的预加载项目
          cleanupPreloadQueue();
          
          // 异步触发下一批预加载
          setTimeout(() => {
            if (ttsState.value.isPlaying) {
              preloadNextSentences();
            }
          }, 100);
          
          setTimeout(() => {
            if (ttsState.value.isPlaying) {
              speakCurrentSentence();
            }
          }, 200);
        }
      };

      audio.onerror = (error) => {
        console.error(
          `${ttsSettings.value.engine.toUpperCase()} TTS播放错误:`,
          error,
        );
        console.log("降级到浏览器TTS");

        // 清理临时URL
        if (ttsSettings.value.engine === "openxing" && audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }

        speakWithBrowserTTS(sentence);
      };

      // 更新当前音频引用
      ttsState.value = {
        ...ttsState.value,
        currentAudio: audio,
      };

      await audio.play();
      console.log(
        `${ttsSettings.value.engine.toUpperCase()} TTS播放句子:`,
        sentence.substring(0, 50) + "...",
      );
    } catch (error) {
      console.error(
        `${ttsSettings.value.engine.toUpperCase()} TTS完全失败，降级到浏览器TTS:`,
        error,
      );
      await speakWithBrowserTTS(sentence);
    }
  };

  const highlightCurrentSentence = () => {
    // 移除之前的高亮
    const prevHighlight = contentRef.current?.querySelector(
      ".tts-current-sentence",
    );
    if (prevHighlight) {
      prevHighlight.classList.remove("tts-current-sentence");
    }

    // 高亮当前句子
    const currentElement =
      ttsState.value.sentenceElements[ttsState.value.currentSentenceIndex];
    if (currentElement) {
      currentElement.classList.add("tts-current-sentence");

      // 滚动到当前句子
      currentElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const stopTTS = () => {
    // 停止浏览器TTS
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
    }

    // 停止外部TTS音频并清除回调
    if (ttsState.value.currentAudio) {
      const audio = ttsState.value.currentAudio;
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null; // 清除回调防止重复调用
      audio.onerror = null;
    }

    // 移除所有高亮
    const highlights = contentRef.current?.querySelectorAll(
      ".tts-current-sentence",
    );
    highlights?.forEach((el) => el.classList.remove("tts-current-sentence"));

    // 清理预加载队列中的临时URL
    Object.values(ttsState.value.preloadQueue).forEach(url => {
      if (typeof url === 'string' && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });

    ttsState.value = {
      ...ttsState.value,
      isPlaying: false,
      isPaused: false,
      utterance: null,
      currentAudio: null,
      preloadQueue: {}, // 清空预加载队列
    };

    console.log("TTS已停止");
  };

  // 语音试听功能
  const previewVoice = async (voiceId?: string) => {
    const testText = "壬戌之秋，七月既望，苏子与客泛舟游于赤壁之下。清风徐来，水波不兴。";
    const currentVoice = voiceId || ttsSettings.value.voiceURI;
    
    if (!currentVoice) {
      showNotification("请先选择一个语音", "warning");
      return;
    }

    // 停止当前试听
    stopPreview();

    try {
      // 设置加载状态
      ttsState.value = { 
        ...ttsState.value, 
        isPreviewLoading: true,
        isPreviewPlaying: false 
      };

      // 根据引擎选择不同的试听方式
      if (
        (ttsSettings.value.engine === "leftsite" ||
          ttsSettings.value.engine === "openxing") &&
        ttsState.value.serviceStatus === "available"
      ) {
        await previewWithExternalTTS(testText, currentVoice);
      } else {
        await previewWithBrowserTTS(testText);
      }
    } catch (error) {
      console.error("语音试听失败:", error);
      showNotification("语音试听失败，请重试", "error");
      stopPreview();
    }
  };

  const previewWithExternalTTS = async (text: string, voice: string) => {
    try {
      let audioUrl = "";
      
      if (ttsSettings.value.engine === "openxing") {
        // OpenXing TTS 使用POST请求
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            voice: voice,
            engine: "openxing",
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenXing TTS请求失败: ${response.status}`);
        }

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
      } else {
        // Leftsite TTS 使用GET请求，完全按照官网逻辑构建参数
        const params = new URLSearchParams({
          t: text,
          v: voice,
          r: Math.round((ttsSettings.value.rate - 1) * 50).toString(),
          p: "0", // 固定为0，与官网一致
          engine: "leftsite",
        });

        // 只有当style不为空时才添加，完全按照官网逻辑
        if (ttsSettings.value.style && ttsSettings.value.style.trim()) {
          params.append("s", ttsSettings.value.style);
        }

        const proxyUrl = `/api/tts?${params.toString()}`;
        
        // 首先尝试代理URL
        try {
          const response = await fetch(proxyUrl);
          
          if (response.ok) {
            // 代理成功
            audioUrl = proxyUrl;
          } else {
            // 代理失败，检查是否有直接URL
            const errorData = await response.json().catch(() => ({}));
            if (errorData.directUrl) {
              console.log("试听：代理失败，使用直接URL:", errorData.directUrl);
              audioUrl = errorData.directUrl;
            } else {
              throw new Error(`代理请求失败: ${response.status}`);
            }
          }
        } catch (error) {
          console.warn("试听：代理请求失败，使用直接URL:", error);
          
          // 如果代理完全失败，构建直接URL
          const directParams = new URLSearchParams({
            t: text,
            v: voice,
            r: Math.round((ttsSettings.value.rate - 1) * 50).toString(),
            p: "0",
          });

          if (ttsSettings.value.style && ttsSettings.value.style.trim()) {
            directParams.append("s", ttsSettings.value.style);
          }

          audioUrl = `https://t.leftsite.cn/tts?${directParams.toString()}`;
          console.log("试听：使用直接URL:", audioUrl);
        }
      }

      // 创建试听音频元素
      const audio = new Audio(audioUrl);
      audio.volume = ttsSettings.value.volume;

      audio.onended = () => {
        // 清理临时URL
        if (ttsSettings.value.engine === "openxing") {
          URL.revokeObjectURL(audioUrl);
        }
        stopPreview();
      };

      audio.onerror = (error) => {
        console.error("试听音频播放错误:", error);
        // 清理临时URL
        if (ttsSettings.value.engine === "openxing") {
          URL.revokeObjectURL(audioUrl);
        }
        // 降级到浏览器TTS试听
        previewWithBrowserTTS(text);
      };

      // 更新试听音频引用
      ttsState.value = {
        ...ttsState.value,
        previewAudio: audio,
        isPreviewLoading: false, // 加载完成
        isPreviewPlaying: true,  // 开始播放
      };

      await audio.play();
      console.log(`${ttsSettings.value.engine.toUpperCase()} TTS试听播放:`, text);
    } catch (error) {
      console.error(`${ttsSettings.value.engine.toUpperCase()} TTS试听失败:`, error);
      throw error;
    }
  };

  const previewWithBrowserTTS = async (text: string) => {
    if (!speechSynthesis.current) return;

    // 结束加载状态，开始播放
    ttsState.value = {
      ...ttsState.value,
      isPreviewLoading: false,
      isPreviewPlaying: true,
    };

    // 创建语音合成utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsSettings.value.rate;
    utterance.volume = ttsSettings.value.volume;
    utterance.pitch = ttsSettings.value.pitch;

    // 选择中文语音
    const chineseVoice = availableVoices.current.find((voice) =>
      voice.lang.includes("zh") || voice.lang.includes("CN")
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    // 设置播放完成回调
    utterance.onend = () => {
      stopPreview();
    };

    utterance.onerror = (event) => {
      console.error("浏览器TTS试听错误:", event);
      stopPreview();
    };

    speechSynthesis.current.speak(utterance);
    console.log("浏览器TTS试听播放:", text);
  };

  const stopPreview = () => {
    // 停止试听音频
    if (ttsState.value.previewAudio) {
      ttsState.value.previewAudio.pause();
      ttsState.value.previewAudio.currentTime = 0;
    }

    // 停止浏览器TTS（只停止试听，不影响正在进行的阅读）
    if (speechSynthesis.current && !ttsState.value.isPlaying) {
      speechSynthesis.current.cancel();
    }

    ttsState.value = {
      ...ttsState.value,
      isPreviewPlaying: false,
      isPreviewLoading: false, // 重置加载状态
      previewAudio: null,
    };

    console.log("语音试听已停止");
  };

  // 生成音频URL（提取公共逻辑）
  const generateAudioUrl = async (sentence: string, voice: string): Promise<string> => {
    if (ttsSettings.value.engine === "openxing") {
      // OpenXing TTS 使用POST请求
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sentence,
          voice: voice,
          engine: "openxing",
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenXing TTS请求失败: ${response.status}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } else {
      // Leftsite TTS 使用GET请求，完全按照官网逻辑构建参数
      const params = new URLSearchParams({
        t: sentence,
        v: voice,
        r: Math.round((ttsSettings.value.rate - 1) * 50).toString(),
        p: "0", // 固定为0，与官网一致
        engine: "leftsite",
      });

      // 只有当style不为空时才添加，完全按照官网逻辑
      if (ttsSettings.value.style && ttsSettings.value.style.trim()) {
        params.append("s", ttsSettings.value.style);
      }

      const proxyUrl = `/api/tts?${params.toString()}`;
      
      // 首先尝试代理URL
      try {
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
          // 代理成功，返回代理URL
          return proxyUrl;
        } else {
          // 代理失败，检查是否有直接URL
          const errorData = await response.json().catch(() => ({}));
          if (errorData.directUrl) {
            console.log("代理失败，使用直接URL:", errorData.directUrl);
            return errorData.directUrl;
          }
          throw new Error(`代理请求失败: ${response.status}`);
        }
      } catch (error) {
        console.warn("代理请求失败，尝试构建直接URL:", error);
        
        // 如果代理完全失败，构建直接URL
        const directParams = new URLSearchParams({
          t: sentence,
          v: voice,
          r: Math.round((ttsSettings.value.rate - 1) * 50).toString(),
          p: "0",
        });

        if (ttsSettings.value.style && ttsSettings.value.style.trim()) {
          directParams.append("s", ttsSettings.value.style);
        }

        const directUrl = `https://t.leftsite.cn/tts?${directParams.toString()}`;
        console.log("使用直接URL:", directUrl);
        return directUrl;
      }
    }
  };

  // 预加载接下来的语音
  const preloadNextSentences = async () => {
    if (ttsState.value.isPreloading || 
        ttsState.value.serviceStatus !== "available" ||
        (ttsSettings.value.engine !== "leftsite" && ttsSettings.value.engine !== "openxing")) {
      return;
    }

    const currentIndex = ttsState.value.currentSentenceIndex;
    const sentences = ttsState.value.sentences;
    const voice = ttsSettings.value.voiceURI;

    if (!voice) return;

    try {
      ttsState.value = { ...ttsState.value, isPreloading: true };

      // 预加载接下来的3个句子
      const preloadPromises: Promise<void>[] = [];
      
      for (let i = 1; i <= ttsState.value.preloadCount; i++) {
        const nextIndex = currentIndex + i;
        
        // 跳过已经预加载的或超出范围的句子
        if (nextIndex >= sentences.length || ttsState.value.preloadQueue[nextIndex]) {
          continue;
        }

        const sentence = sentences[nextIndex];
        if (!sentence?.trim()) continue;

        const preloadPromise = (async () => {
          try {
            const audioUrl = await generateAudioUrl(sentence, voice);
            
            // 更新预加载队列
            ttsState.value = {
              ...ttsState.value,
              preloadQueue: {
                ...ttsState.value.preloadQueue,
                [nextIndex]: audioUrl
              }
            };

            console.log(`预加载完成: 句子 ${nextIndex}`, sentence.substring(0, 30) + "...");
          } catch (error) {
            console.error(`预加载失败: 句子 ${nextIndex}:`, error);
          }
        })();

        preloadPromises.push(preloadPromise);
      }

      // 等待所有预加载完成
      await Promise.all(preloadPromises);
      
    } catch (error) {
      console.error("预加载过程发生错误:", error);
    } finally {
      ttsState.value = { ...ttsState.value, isPreloading: false };
    }
  };

  // 清理预加载队列中过期的项目
  const cleanupPreloadQueue = () => {
    const currentIndex = ttsState.value.currentSentenceIndex;
    const newQueue = { ...ttsState.value.preloadQueue };
    
    // 清理已经播放过的音频URL（保留当前播放的）
    Object.keys(newQueue).forEach(indexStr => {
      const index = parseInt(indexStr);
      if (index < currentIndex) {
        // 释放临时URL
        if (ttsSettings.value.engine === "openxing" && newQueue[index].startsWith("blob:")) {
          URL.revokeObjectURL(newQueue[index]);
        }
        delete newQueue[index];
      }
    });

    ttsState.value = {
      ...ttsState.value,
      preloadQueue: newQueue
    };
  };

  const toggleTTS = () => {
    if (ttsState.value.isPlaying) {
      stopTTS();
    } else {
      startTTS();
    }
  };

  // 自动滚动功能
  const startAutoReading = () => {
    if (autoReading.value.isActive) return;

    stopTTS(); // 停止TTS

    autoReading.value = {
      ...autoReading.value,
      isActive: true,
      isPaused: false,
    };

    startAutoScroll();
    console.log("自动阅读已开始");
  };

  const stopAutoReading = () => {
    autoReading.value = {
      ...autoReading.value,
      isActive: false,
      isPaused: false,
    };

    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }

    console.log("自动阅读已停止");
  };

  const startAutoScroll = () => {
    if (!autoReading.value.isActive || autoReading.value.isPaused) return;
    if (!contentRef.current) return;

    const scrollStep = Math.max(1, autoReading.value.scrollSpeed / 10);

    autoScrollTimer.current = setInterval(() => {
      if (
        !autoReading.value.isActive || autoReading.value.isPaused ||
        !contentRef.current
      ) {
        if (autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
          autoScrollTimer.current = null;
        }
        return;
      }

      const element = contentRef.current;
      const currentScrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;

      // 检查是否到达底部
      if (currentScrollTop + clientHeight >= scrollHeight - 50) {
        if (
          autoReading.value.autoNext &&
          currentChapterIndex.value < chapters.value.length - 1
        ) {
          console.log("自动滚动翻页到下一章");
          navigateToChapter("next").then(() => {
            // 翻页后继续自动滚动
            setTimeout(() => {
              if (autoReading.value.isActive) {
                startAutoScroll();
              }
            }, 1000);
          });
        } else {
          stopAutoReading();
        }
        return;
      }

      // 继续滚动
      if (autoReading.value.smoothScroll) {
        element.scrollTo({
          top: currentScrollTop + scrollStep,
          behavior: "smooth",
        });
      } else {
        element.scrollTop = currentScrollTop + scrollStep;
      }

      // 强制更新进度条显示
      autoReading.value = { ...autoReading.value };
    }, 100);
  };

  const toggleAutoReading = () => {
    if (autoReading.value.isActive) {
      stopAutoReading();
    } else {
      startAutoReading();
    }
  };

  const getThemeClasses = () => {
    const themes = {
      light: "bg-white text-gray-900",
      sepia: "bg-amber-50 text-amber-900",
      dark: "bg-gray-800 text-gray-100",
      night: "bg-gray-900 text-gray-200",
      green: "bg-green-50 text-green-900",
      blue: "bg-blue-50 text-blue-900",
      purple: "bg-purple-50 text-purple-900",
      pink: "bg-pink-50 text-pink-900",
    };
    return themes[theme.value] || themes.light;
  };

  const getFontFamilyClass = () => {
    const fonts = {
      system: "font-sans",
      serif: "font-serif",
      reading: "font-mono",
    };
    return fonts[fontFamily.value] || fonts.system;
  };

  const getPageWidthClass = () => {
    const widths = {
      narrow: "max-w-2xl",
      medium: "max-w-4xl",
      wide: "max-w-6xl",
    };
    return widths[pageWidth.value] || widths.narrow;
  };

  if (loading.value) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${getThemeClasses()}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-current mx-auto">
          </div>
          <p className="mt-4 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${getThemeClasses()}`}
      >
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">{error.value}</p>
          <button
            onClick={() => globalThis.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${getThemeClasses()}`}
    >
      {/* 顶部工具栏 */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-current/5 backdrop-blur-sm border-b border-current/10 transition-transform duration-300 ${
          showTopBar.value ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => globalThis.location.href = "/"}
              className="p-2 rounded-lg hover:bg-current/10 transition-colors"
              title="返回首页"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </button>

            <button
              onClick={() => globalThis.location.href = "/shelf"}
              className="p-2 rounded-lg hover:bg-current/10 transition-colors"
              title="返回书架"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
            </button>

            <button
              onClick={() => showChapterList.value = !showChapterList.value}
              className="p-2 rounded-lg hover:bg-current/10 transition-colors"
              title="章节目录"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 text-center">
            <h1 className="text-lg font-medium truncate px-4">
              {chapterTitle.value}
            </h1>
            <p className="text-sm opacity-60">
              {currentChapterIndex.value + 1} / {chapters.value.length}
            </p>
          </div>

          <button
            onClick={() => {
              showSettings.value = !showSettings.value;
              resetHideTimer();
            }}
            className="p-2 rounded-lg hover:bg-current/10 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* TTS进度条 */}
      {ttsState.value.isPlaying && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-blue-600/10 backdrop-blur-sm border-b border-blue-300/20">
          <div className="px-4 py-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTTS}
                className="p-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title={ttsState.value.isPlaying ? "停止朗读" : "开始朗读"}
              >
                {ttsState.value.isPlaying
                  ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )
                  : (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
              </button>

              <div className="flex-1 bg-current/20 rounded-full h-3 overflow-hidden relative progress-bar-container">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full relative progress-bar-fill"
                  style={{
                    width: `${
                      (ttsState.value.currentSentenceIndex /
                        Math.max(1, ttsState.value.sentences.length)) * 100
                    }%`,
                  }}
                >
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-medium text-blue-900/80 drop-shadow-sm">
                    {Math.round(
                      (ttsState.value.currentSentenceIndex /
                        Math.max(1, ttsState.value.sentences.length)) * 100,
                    )}%
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end text-right min-w-max">
                <span className="text-sm font-medium opacity-90">
                  {ttsState.value.currentSentenceIndex + 1} /{" "}
                  {ttsState.value.sentences.length}
                </span>
                <span className="text-xs opacity-70">
                  语音朗读中
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 自动滚动进度条 */}
      {autoReading.value.isActive && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-green-600/10 backdrop-blur-sm border-b border-green-300/20">
          <div className="px-4 py-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleAutoReading}
                className="p-1 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                title={autoReading.value.isActive
                  ? "停止自动滚动"
                  : "开始自动滚动"}
              >
                {autoReading.value.isActive
                  ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )
                  : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19V5m0 0l-7 7m7-7l7 7"
                      />
                    </svg>
                  )}
              </button>

              <div className="flex-1 bg-current/20 rounded-full h-3 overflow-hidden relative progress-bar-container">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 ease-linear rounded-full relative progress-bar-fill"
                  style={{
                    width: contentRef.current
                      ? `${
                        Math.min(
                          100,
                          (contentRef.current.scrollTop /
                            Math.max(
                              1,
                              contentRef.current.scrollHeight -
                                contentRef.current.clientHeight,
                            )) * 100,
                        )
                      }%`
                      : "0%",
                  }}
                >
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-medium text-green-900/80 drop-shadow-sm">
                    {contentRef.current
                      ? Math.round(
                        (contentRef.current.scrollTop /
                          Math.max(
                            1,
                            contentRef.current.scrollHeight -
                              contentRef.current.clientHeight,
                          )) * 100,
                      )
                      : 0}%
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end text-right min-w-max">
                <span className="text-sm font-medium opacity-90">
                  速度: {autoReading.value.scrollSpeed}
                </span>
                <span className="text-xs opacity-70">
                  自动滚动中
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div
        className={`${
          (ttsState.value.isPlaying || autoReading.value.isActive)
            ? "pt-32"
            : showTopBar.value
            ? "pt-20"
            : "pt-0"
        } ${showBottomBar.value ? "pb-20" : "pb-0"}`}
      >
        <div className={`mx-auto px-6 ${getPageWidthClass()}`}>
          <div
            ref={contentRef}
            className={`${getFontFamilyClass()} reader-content max-w-none overflow-y-auto max-h-screen`}
            style={{
              fontSize: `${fontSize.value}px`,
              lineHeight: lineHeight.value,
            }}
            dangerouslySetInnerHTML={{ __html: content.value }}
          />
        </div>
      </div>

      {/* 底部工具栏 */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-current/5 backdrop-blur-sm border-t border-current/10 transition-transform duration-300 ${
          showBottomBar.value ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateToChapter("prev")}
              disabled={currentChapterIndex.value === 0}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-current/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>上一章</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                // 切换AI设置显示
                activeSettingsTab.value = "ai";
                showSettings.value = !showSettings.value;
                resetHideTimer();
              }}
              className="p-2 rounded-lg hover:bg-current/10 transition-colors"
              title="AI助手"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
                <circle cx="12" cy="9" r="2" strokeWidth={2}/>
              </svg>
            </button>

            <button
              onClick={toggleAutoReading}
              className={`p-2 rounded-lg transition-colors ${
                autoReading.value.isActive
                  ? "bg-green-600 text-white"
                  : "hover:bg-current/10"
              }`}
              title="自动滚动阅读"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19V5m0 0l-7 7m7-7l7 7"
                />
              </svg>
            </button>

            <button
              onClick={toggleTTS}
              className={`p-2 rounded-lg transition-colors ${
                ttsState.value.isPlaying
                  ? "bg-blue-600 text-white"
                  : "hover:bg-current/10"
              }`}
              title="语音朗读"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728m-9.192-9.192L7.05 7.05A7 7 0 105 12a7 7 0 002.05-4.95l2.122-2.122z"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateToChapter("next")}
              disabled={currentChapterIndex.value === chapters.value.length - 1}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-current/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <span>下一章</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 全屏设置面板 */}
      {showSettings.value && (
        <div className={`fixed inset-0 z-50 ${getThemeClasses()}`}>
          {/* 设置头部 */}
          <div className="sticky top-0 z-10 bg-current/5 backdrop-blur-sm border-b border-current/10">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() =>
                  showSettings.value = false}
                className="p-2 rounded-full hover:bg-current/10 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-bold">阅读设置</h1>
              <div className="w-10 h-10"></div>
            </div>

            {/* 标签切换 */}
            <div className="flex border-b border-current/10">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => activeSettingsTab.value = tab.key}
                  className={`flex-1 py-4 px-2 text-center font-medium transition-colors relative ${
                    activeSettingsTab.value === tab.key
                      ? "text-blue-600"
                      : "text-current/70 hover:text-current"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </div>
                  {activeSettingsTab.value === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600">
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 设置内容区域 */}
          <div className="flex-1 overflow-y-auto p-6 pb-32 settings-scrollbar max-h-screen">{/* 添加最大高度限制 */}
            {/* 显示设置 */}
            {activeSettingsTab.value === "display" && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🎨</span>
                    主题风格
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => updateReadingSettings("theme", t.key)}
                        className={`${t.bg} ${t.text} p-4 rounded-xl border-2 transition-all btn-scale ${
                          theme.value === t.key
                            ? `border-blue-500 ring-2 ${t.ring} scale-105`
                            : "border-current/20 hover:border-current/40 hover:scale-102"
                        }`}
                      >
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs opacity-60 mt-1">Aa</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🔤</span>
                    字体设置
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium">字体大小</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="12"
                            max="32"
                            value={fontSize.value}
                            onChange={(e) => {
                              const value = Math.max(
                                12,
                                Math.min(
                                  32,
                                  parseInt(e.currentTarget.value) || 12,
                                ),
                              );
                              updateReadingSettings("fontSize", value);
                            }}
                            className="number-input"
                          />
                          <span className="text-xs opacity-70">px</span>
                        </div>
                      </div>
                      <div
                        className="range-slider"
                        style={{
                          "--slider-value": `${
                            ((fontSize.value - 12) / (32 - 12)) * 100
                          }%`,
                        } as any}
                      >
                        <input
                          type="range"
                          min="12"
                          max="32"
                          step="1"
                          value={fontSize.value}
                          onInput={(e) => {
                            const value = parseInt(e.currentTarget.value);
                            updateReadingSettings("fontSize", value);
                            // 更新滑块填充
                            const percentage = ((value - 12) / (32 - 12)) * 100;
                            const parent = e.currentTarget
                              .parentElement as HTMLElement;
                            if (parent) {
                              parent.style.setProperty(
                                "--slider-value",
                                `${percentage}%`,
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-current/60 mt-2">
                        <span>小</span>
                        <span>中</span>
                        <span>大</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium">行间距</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="1.2"
                            max="2.5"
                            step="0.1"
                            value={lineHeight.value}
                            onChange={(e) => {
                              const value = Math.max(
                                1.2,
                                Math.min(
                                  2.5,
                                  parseFloat(e.currentTarget.value) || 1.2,
                                ),
                              );
                              updateReadingSettings("lineHeight", value);
                            }}
                            className="number-input"
                          />
                        </div>
                      </div>
                      <div
                        className="range-slider"
                        style={{
                          "--slider-value": `${
                            ((lineHeight.value - 1.2) / (2.5 - 1.2)) * 100
                          }%`,
                        } as any}
                      >
                        <input
                          type="range"
                          min="1.2"
                          max="2.5"
                          step="0.1"
                          value={lineHeight.value}
                          onInput={(e) => {
                            const value = parseFloat(e.currentTarget.value);
                            updateReadingSettings("lineHeight", value);
                            // 更新滑块填充
                            const percentage = ((value - 1.2) / (2.5 - 1.2)) *
                              100;
                            const parent = e.currentTarget
                              .parentElement as HTMLElement;
                            if (parent) {
                              parent.style.setProperty(
                                "--slider-value",
                                `${percentage}%`,
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-current/60 mt-2">
                        <span>紧密</span>
                        <span>适中</span>
                        <span>宽松</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium mb-3">字体类型</label>
                      <div className="grid grid-cols-3 gap-3">
                        {FONT_OPTIONS.map((font) => (
                          <button
                            key={font.key}
                            onClick={() =>
                              updateReadingSettings("fontFamily", font.key)}
                            className={`p-3 rounded-xl border-2 transition-all btn-scale ${
                              fontFamily.value === font.key
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-current/20 hover:bg-current/5"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              {font.name}
                            </div>
                            <div className="text-xs opacity-60">
                              {font.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium mb-3">页面宽度</label>
                      <div className="grid grid-cols-3 gap-3">
                        {PAGE_WIDTH_OPTIONS.map((width) => (
                          <button
                            key={width.key}
                            onClick={() =>
                              updateReadingSettings("pageWidth", width.key)}
                            className={`p-3 rounded-xl border-2 transition-all btn-scale ${
                              pageWidth.value === width.key
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-current/20 hover:bg-current/5"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              {width.name}
                            </div>
                            <div className="text-xs opacity-60">
                              {width.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 语音设置 */}
            {activeSettingsTab.value === "voice" && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <span className="mr-2">🔊</span>
                      语音引擎
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          ttsState.value.serviceStatus === "available"
                            ? "bg-green-500"
                            : ttsState.value.serviceStatus === "checking"
                            ? "bg-yellow-500 animate-pulse"
                            : "bg-red-500"
                        }`}
                      >
                      </div>
                      <span className="text-xs opacity-70">
                        {ttsState.value.serviceStatus === "available"
                          ? "服务正常"
                          : ttsState.value.serviceStatus === "checking"
                          ? "检测中..."
                          : "服务异常"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => switchTTSEngine("browser")}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left btn-scale ${
                        ttsSettings.value.engine === "browser"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-current/20 hover:bg-current/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">浏览器 TTS</div>
                          <div className="text-sm opacity-70">
                            免费使用，无需配置
                          </div>
                        </div>
                        <div className="text-2xl">🌐</div>
                      </div>
                    </button>

                    <button
                      onClick={() => switchTTSEngine("leftsite")}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                        ttsSettings.value.engine === "leftsite"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-current/20 hover:bg-current/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Leftsite TTS</div>
                          <div className="text-sm opacity-70">
                            {ttsState.value.serviceStatus === "available"
                              ? "高音质，多语音选择"
                              : "服务不可用"}
                          </div>
                        </div>
                        <div className="text-2xl">🎯</div>
                      </div>
                      {ttsState.value.serviceStatus === "unavailable" && (
                        <div className="absolute inset-0 bg-gray-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-sm text-red-600 font-medium">
                            服务不可用
                          </span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => switchTTSEngine("openxing")}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                        ttsSettings.value.engine === "openxing"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-current/20 hover:bg-current/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">OpenXing TTS</div>
                          <div className="text-sm opacity-70">
                            {ttsState.value.serviceStatus === "available"
                              ? "超拟人语音体验"
                              : "服务不可用"}
                          </div>
                        </div>
                        <div className="text-2xl">⭐</div>
                      </div>
                      {ttsState.value.serviceStatus === "unavailable" && (
                        <div className="absolute inset-0 bg-gray-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-sm text-red-600 font-medium">
                            服务不可用
                          </span>
                        </div>
                      )}
                    </button>
                  </div>

                  {(ttsSettings.value.engine === "leftsite" ||
                    ttsSettings.value.engine === "openxing") &&
                    ttsState.value.serviceStatus === "unavailable" && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-sm text-orange-700 flex items-center">
                        <span className="mr-2">⚠️</span>
                        云端TTS服务当前不可用，将自动降级到浏览器TTS
                      </div>
                    </div>
                  )}
                </div>

                {/* 所有引擎的试听功能 */}
                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🎧</span>
                    语音试听
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-current/5 rounded-xl">
                      <div className="text-sm text-current/70 mb-2">
                        试听内容：前赤壁赋片段
                      </div>
                      <div className="text-sm italic text-current/60">
                        "壬戌之秋，七月既望，苏子与客泛舟游于赤壁之下。清风徐来，水波不兴。"
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        当前引擎：{ttsSettings.value.engine === "browser" ? "浏览器 TTS" : 
                                  ttsSettings.value.engine === "leftsite" ? "Leftsite TTS" : 
                                  ttsSettings.value.engine === "openxing" ? "OpenXing TTS" : "未选择"}
                      </span>
                      <button
                        onClick={() => previewVoice()}
                        disabled={ttsState.value.isPreviewPlaying || ttsState.value.isPreviewLoading}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                          ttsState.value.isPreviewLoading
                            ? "bg-yellow-500 text-white cursor-not-allowed"
                            : ttsState.value.isPreviewPlaying
                            ? "bg-orange-500 text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {ttsState.value.isPreviewLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>加载中...</span>
                          </div>
                        ) : ttsState.value.isPreviewPlaying ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>试听中...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            <span>试听语音</span>
                          </div>
                        )}
                      </button>
                    </div>
                    
                    {(ttsState.value.isPreviewPlaying || ttsState.value.isPreviewLoading) && (
                      <button
                        onClick={stopPreview}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        停止试听
                      </button>
                    )}
                  </div>
                </div>

                {(ttsSettings.value.engine === "leftsite" ||
                  ttsSettings.value.engine === "openxing") &&
                  ttsState.value.serviceStatus === "available" && (
                  <div className="bg-current/3 rounded-2xl p-6 settings-card">
                    <h3 className="text-lg font-semibold mb-6 flex items-center">
                      <span className="mr-3 text-2xl">🎤</span>
                      语音选择
                    </h3>
                    <div className="space-y-6">
                      {/* 语音搜索框 - 优化设计 */}
                      <div className="relative group">
                        <div className="absolute inset-y-0 pl-4 flex items-center pointer-events-none z-10" style="left:20px;top:20px">
                          <svg className="h-5 w-5 text-current/50 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="搜索语音 (支持名称、描述、性别)"
                          value={voiceSearchQuery.value}
                          onChange={(e) => voiceSearchQuery.value = e.currentTarget.value}
                          className="w-full pl-12 pr-12 py-4 border-2 border-current/10 rounded-xl bg-current/5 backdrop-blur-sm text-base placeholder-current/50 focus:outline-none focus:ring-0 focus:border-blue-500/50 focus:bg-blue-50/30 transition-all duration-200 hover:border-current/20"
                        />
                        {voiceSearchQuery.value && (
                          <button
                            onClick={() => voiceSearchQuery.value = ""}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-current/40 hover:text-red-500 transition-colors z-10"
                            title="清除搜索"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* 搜索结果统计 - 优化样式 */}
                      {voiceSearchQuery.value && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200/50">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-600">🔍</span>
                              <span className="text-blue-800 font-medium">搜索关键词: "{voiceSearchQuery.value}"</span>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                              {(() => {
                                const filteredVoices = ttsState.value.azureVoices.filter((voice: any) => {
                                  if (ttsSettings.value.engine === "leftsite") {
                                    return voice.provider === "leftsite";
                                  } else if (ttsSettings.value.engine === "openxing") {
                                    return voice.provider === "openxing";
                                  }
                                  return false;
                                });

                                const searchFiltered = filteredVoices.filter((voice: any) => {
                                  const searchTerm = voiceSearchQuery.value.toLowerCase();
                                  const voiceName = (voice.local_name || voice.display_name || voice.displayName || voice.name || "").toLowerCase();
                                  const voiceDesc = (voice.description || "").toLowerCase();
                                  const localeName = (voice.locale_name || "").toLowerCase();
                                  
                                  return voiceName.includes(searchTerm) || 
                                         voiceDesc.includes(searchTerm) || 
                                         localeName.includes(searchTerm) ||
                                         (voice.gender === "Female" && ("女声".includes(searchTerm) || "female".includes(searchTerm))) ||
                                         (voice.gender === "Male" && ("男声".includes(searchTerm) || "male".includes(searchTerm)));
                                });

                                return `${searchFiltered.length} 个语音`;
                              })()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 语音选择下拉框 - 重新设计 */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-current/80 mb-2">
                          选择语音角色
                        </label>
                        <select
                          value={ttsSettings.value.voiceURI}
                          onChange={(e) => {
                            const newVoice = e.currentTarget.value;
                            updateTTSSettings({ voiceURI: newVoice });
                            
                            // 如果正在播放TTS，则重新开始播放以应用新语音
                            if (ttsState.value.isPlaying) {
                              // 记住当前播放位置
                              const currentIndex = ttsState.value.currentSentenceIndex;
                              
                              // 停止当前播放
                              stopTTS();
                              
                              // 短暂延迟后重新开始播放
                              setTimeout(() => {
                                // 恢复播放位置
                                ttsState.value = {
                                  ...ttsState.value,
                                  currentSentenceIndex: currentIndex
                                };
                                startTTS();
                              }, 500);
                            }
                          }}
                          className="w-full p-4 border-2 border-current/10 rounded-xl bg-current/5 backdrop-blur-sm text-base focus:outline-none focus:ring-0 focus:border-blue-500/50 focus:bg-blue-50/30 transition-all duration-200 hover:border-current/20 cursor-pointer"
                          size={voiceSearchQuery.value ? Math.min(10, Math.max(5, (() => {
                            const filteredVoices = ttsState.value.azureVoices.filter((voice: any) => {
                              if (ttsSettings.value.engine === "leftsite") {
                                return voice.provider === "leftsite";
                              } else if (ttsSettings.value.engine === "openxing") {
                                return voice.provider === "openxing";
                              }
                              return false;
                            });
                            const searchFiltered = filteredVoices.filter((voice: any) => {
                              const searchTerm = voiceSearchQuery.value.toLowerCase();
                              const voiceName = (voice.local_name || voice.display_name || voice.displayName || voice.name || "").toLowerCase();
                              const voiceDesc = (voice.description || "").toLowerCase();
                              const localeName = (voice.locale_name || "").toLowerCase();
                              
                              return voiceName.includes(searchTerm) || 
                                     voiceDesc.includes(searchTerm) || 
                                     localeName.includes(searchTerm) ||
                                     (voice.gender === "Female" && ("女声".includes(searchTerm) || "female".includes(searchTerm))) ||
                                     (voice.gender === "Male" && ("男声".includes(searchTerm) || "male".includes(searchTerm)));
                            });
                            return Object.keys(searchFiltered.reduce((groups: any, voice: any) => {
                              const localeName = voice.locale_name || "其他";
                              groups[localeName] = (groups[localeName] || []).concat(voice);
                              return groups;
                            }, {})).length + searchFiltered.length;
                          })())) : undefined}
                        >
                          <option value="" className="text-current/60">🎯 请选择语音角色...</option>
                          {(() => {
                            // 过滤当前引擎的语音
                            const filteredVoices = ttsState.value.azureVoices.filter((voice: any) => {
                              if (ttsSettings.value.engine === "leftsite") {
                                return voice.provider === "leftsite";
                              } else if (ttsSettings.value.engine === "openxing") {
                                return voice.provider === "openxing";
                              }
                              return false;
                            });

                            // 应用搜索过滤
                            const searchFiltered = voiceSearchQuery.value 
                              ? filteredVoices.filter((voice: any) => {
                                  const searchTerm = voiceSearchQuery.value.toLowerCase();
                                  const voiceName = (voice.local_name || voice.display_name || voice.displayName || voice.name || "").toLowerCase();
                                  const voiceDesc = (voice.description || "").toLowerCase();
                                  const localeName = (voice.locale_name || "").toLowerCase();
                                  
                                  return voiceName.includes(searchTerm) || 
                                         voiceDesc.includes(searchTerm) || 
                                         localeName.includes(searchTerm) ||
                                         (voice.gender === "Female" && ("女声".includes(searchTerm) || "female".includes(searchTerm))) ||
                                         (voice.gender === "Male" && ("男声".includes(searchTerm) || "male".includes(searchTerm)));
                                })
                              : filteredVoices;

                            // 按 locale_name 分组
                            const groupedVoices = searchFiltered.reduce((groups: any, voice: any) => {
                              const localeName = voice.locale_name || "其他";
                              if (!groups[localeName]) {
                                groups[localeName] = [];
                              }
                              groups[localeName].push(voice);
                              return groups;
                            }, {});

                            // 如果有搜索结果但没有分组，显示提示
                            if (voiceSearchQuery.value && Object.keys(groupedVoices).length === 0) {
                              return (
                                <option disabled className="text-red-500">
                                  🔍 未找到匹配的语音，请尝试其他关键词
                                </option>
                              );
                            }

                            // 生成分组选项
                            return Object.entries(groupedVoices).map(([localeName, voices]: [string, any]) => (
                              <optgroup key={localeName} label={`🌍 ${localeName}${voiceSearchQuery.value ? ` (${voices.length}个匹配)` : ""}`}>
                                {(voices as any[]).map((voice: any) => (
                                  <option
                                    key={voice.short_name || voice.name}
                                    value={voice.short_name || voice.name}
                                    className="py-2"
                                  >
                                    🎭 {voice.local_name || voice.display_name || voice.displayName || voice.name}
                                    {voice.description ? ` - ${voice.description}` : ""}
                                    ({voice.gender === "Female" ? "👩 女声" : "👨 男声"})
                                  </option>
                                ))}
                              </optgroup>
                            ));
                          })()}
                        </select>
                      </div>

                      {/* 试听功能 - 美化设计 */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200/50">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🎧</span>
                            <div>
                              <h4 className="font-semibold text-purple-900">语音试听</h4>
                              <p className="text-sm text-purple-700/80">试听内容：前赤壁赋片段</p>
                            </div>
                          </div>
                          
                          <div className="bg-white/70 rounded-lg p-4 border border-purple-200/30">
                            <p className="text-sm italic text-purple-800 leading-relaxed">
                              "壬戌之秋，七月既望，苏子与客泛舟游于赤壁之下。清风徐来，水波不兴。"
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-purple-700">
                              <span className="font-medium">当前引擎:</span> 
                              <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                                {ttsSettings.value.engine === "browser" ? "🌐 浏览器 TTS" : 
                                 ttsSettings.value.engine === "leftsite" ? "🎯 Leftsite TTS" : 
                                 ttsSettings.value.engine === "openxing" ? "⭐ OpenXing TTS" : "未选择"}
                              </span>
                            </div>
                            <button
                              onClick={() => previewVoice()}
                              disabled={ttsState.value.isPreviewPlaying || ttsState.value.isPreviewLoading}
                              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg ${
                                ttsState.value.isPreviewLoading
                                  ? "bg-yellow-400 text-yellow-900 cursor-not-allowed shadow-yellow-200"
                                  : ttsState.value.isPreviewPlaying
                                  ? "bg-orange-400 text-orange-900 shadow-orange-200"
                                  : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-blue-200"
                              }`}
                            >
                              {ttsState.value.isPreviewLoading ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-yellow-900 border-t-transparent rounded-full animate-spin"></div>
                                  <span>生成中...</span>
                                </div>
                              ) : ttsState.value.isPreviewPlaying ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-orange-900 border-t-transparent rounded-full animate-spin"></div>
                                  <span>试听中...</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                  <span>🎵 试听语音</span>
                                </div>
                              )}
                            </button>
                          </div>
                          
                          {(ttsState.value.isPreviewPlaying || ttsState.value.isPreviewLoading) && (
                            <button
                              onClick={stopPreview}
                              className="w-full px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                            >
                              ⏹️ 停止试听
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">⚙️</span>
                    语音控制
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium">语音语速</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={ttsSettings.value.rate}
                            onChange={(e) => {
                              const value = Math.max(
                                0.5,
                                Math.min(
                                  2,
                                  parseFloat(e.currentTarget.value) || 1,
                                ),
                              );
                              updateTTSSettings({ rate: value });
                            }}
                            className="number-input"
                          />
                          <span className="text-xs opacity-70">x</span>
                        </div>
                      </div>
                      <div
                        className="range-slider"
                        style={{
                          "--slider-value": `${
                            ((ttsSettings.value.rate - 0.5) / (2 - 0.5)) * 100
                          }%`,
                        } as any}
                      >
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={ttsSettings.value.rate}
                          onInput={(e) => {
                            const value = parseFloat(e.currentTarget.value);
                            updateTTSSettings({ rate: value });
                            // 更新滑块填充
                            const percentage = ((value - 0.5) / (2 - 0.5)) *
                              100;
                            const parent = e.currentTarget
                              .parentElement as HTMLElement;
                            if (parent) {
                              parent.style.setProperty(
                                "--slider-value",
                                `${percentage}%`,
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-current/60 mt-2">
                        <span>慢</span>
                        <span>正常</span>
                        <span>快</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium">语音音量</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="10"
                            max="100"
                            step="5"
                            value={Math.round(ttsSettings.value.volume * 100)}
                            onChange={(e) => {
                              const value = Math.max(
                                10,
                                Math.min(
                                  100,
                                  parseInt(e.currentTarget.value) || 80,
                                ),
                              );
                              updateTTSSettings({ volume: value / 100 });
                            }}
                            className="number-input"
                          />
                          <span className="text-xs opacity-70">%</span>
                        </div>
                      </div>
                      <div
                        className="range-slider"
                        style={{
                          "--slider-value": `${
                            ((ttsSettings.value.volume - 0.1) / (1 - 0.1)) * 100
                          }%`,
                        } as any}
                      >
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={ttsSettings.value.volume}
                          onInput={(e) => {
                            const value = parseFloat(e.currentTarget.value);
                            updateTTSSettings({ volume: value });
                            // 更新滑块填充
                            const percentage = ((value - 0.1) / (1 - 0.1)) *
                              100;
                            const parent = e.currentTarget
                              .parentElement as HTMLElement;
                            if (parent) {
                              parent.style.setProperty(
                                "--slider-value",
                                `${percentage}%`,
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-current/60 mt-2">
                        <span>🔇</span>
                        <span>🔊</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-current/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">📖</span>
                        <div>
                          <div className="font-medium">自动翻页</div>
                          <div className="text-sm opacity-70">
                            章节读完自动跳转
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={ttsSettings.value.autoNext}
                        onChange={(e) => {
                          ttsSettings.value = {
                            ...ttsSettings.value,
                            autoNext: e.currentTarget.checked,
                          };
                          saveSettings();
                        }}
                        className="w-5 h-5 accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 阅读设置 */}
            {activeSettingsTab.value === "reading" && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📖</span>
                    自动滚动
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium">滚动速度</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="10"
                            max="100"
                            step="5"
                            value={autoReading.value.scrollSpeed}
                            onChange={(e) => {
                              const value = Math.max(
                                10,
                                Math.min(
                                  100,
                                  parseInt(e.currentTarget.value) || 50,
                                ),
                              );
                              autoReading.value = {
                                ...autoReading.value,
                                scrollSpeed: value,
                              };
                              saveSettings();
                            }}
                            className="number-input"
                          />
                        </div>
                      </div>
                      <div
                        className="range-slider"
                        style={{
                          "--slider-value": `${
                            ((autoReading.value.scrollSpeed - 10) /
                              (100 - 10)) * 100
                          }%`,
                        } as any}
                      >
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={autoReading.value.scrollSpeed}
                          onInput={(e) => {
                            const value = parseInt(e.currentTarget.value);
                            autoReading.value = {
                              ...autoReading.value,
                              scrollSpeed: value,
                            };
                            saveSettings();
                            // 更新滑块填充
                            const percentage = ((value - 10) / (100 - 10)) *
                              100;
                            const parent = e.currentTarget
                              .parentElement as HTMLElement;
                            if (parent) {
                              parent.style.setProperty(
                                "--slider-value",
                                `${percentage}%`,
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-current/60 mt-2">
                        <span>慢</span>
                        <span>适中</span>
                        <span>快</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-current/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">✨</span>
                          <div>
                            <div className="font-medium">平滑滚动</div>
                            <div className="text-sm opacity-70">
                              启用丝滑的滚动效果
                            </div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoReading.value.smoothScroll}
                          onChange={(e) => {
                            autoReading.value = {
                              ...autoReading.value,
                              smoothScroll: e.currentTarget.checked,
                            };
                            saveSettings();
                          }}
                          className="w-5 h-5 accent-blue-600"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-current/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">➡️</span>
                          <div>
                            <div className="font-medium">自动翻页</div>
                            <div className="text-sm opacity-70">
                              滚动到底部自动下一章
                            </div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoReading.value.autoNext}
                          onChange={(e) => {
                            autoReading.value = {
                              ...autoReading.value,
                              autoNext: e.currentTarget.checked,
                            };
                            saveSettings();
                          }}
                          className="w-5 h-5 accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI设置 */}
            {activeSettingsTab.value === "ai" && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🤖</span>
                    AI智能助手
                  </h3>
                  <div className="text-sm text-current/70 mb-6">
                    为您的阅读提供AI驱动的智能分析和辅助功能
                  </div>
                  
                  {/* AI功能卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-5 border border-blue-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => generateMultiAIAnalysis(content.value)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">📝</span>
                        <h4 className="font-semibold text-blue-900">文章分析</h4>
                      </div>
                      <p className="text-sm text-blue-800/80 mb-3">
                        智能分析当前章节内容，提取关键信息、主题思想和文学手法
                      </p>
                      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        分析当前章节
                      </button>
                    </div>

                    <div 
                      className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-5 border border-green-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        brainstormState.value = {
                          ...brainstormState.value,
                          mode: brainstormState.value.mode === "sentence_click" ? "off" : "sentence_click",
                          active: brainstormState.value.mode !== "sentence_click"
                        };
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">💡</span>
                        <h4 className="font-semibold text-green-900">句子解释</h4>
                      </div>
                      <p className="text-sm text-green-800/80 mb-3">
                        点击任意句子获得AI解释，理解深层含义、修辞手法和背景知识
                      </p>
                      <button className={`w-full py-2 px-4 rounded-lg transition-colors text-sm font-medium ${
                        brainstormState.value.mode === "sentence_click" 
                          ? "bg-orange-600 text-white hover:bg-orange-700" 
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}>
                        {brainstormState.value.mode === "sentence_click" ? "关闭句子解释" : "启用句子解释"}
                      </button>
                    </div>

                    <div 
                      className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-5 border border-purple-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => generateQuestionChain(content.value)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">📚</span>
                        <h4 className="font-semibold text-purple-900">深度思考</h4>
                      </div>
                      <p className="text-sm text-purple-800/80 mb-3">
                        生成递进式问题链，引导深度思考和多角度分析
                      </p>
                      <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                        开始深度思考
                      </button>
                    </div>

                    <div 
                      className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-5 border border-orange-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => generateDebateAnalysis(content.value)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">🎯</span>
                        <h4 className="font-semibold text-orange-900">观点辩论</h4>
                      </div>
                      <p className="text-sm text-orange-800/80 mb-3">
                        生成多角度观点辩论，探索不同的理解视角和争议话题
                      </p>
                      <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                        开始观点辩论
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">⚙️</span>
                    AI设置选项
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-current/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">🚀</span>
                        <div>
                          <div className="font-medium">智能模式</div>
                          <div className="text-sm opacity-70">
                            启用更深度的AI分析和理解
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 accent-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-current/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">💬</span>
                        <div>
                          <div className="font-medium">实时建议</div>
                          <div className="text-sm opacity-70">
                            阅读时显示AI的实时见解和建议
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={false}
                        className="w-5 h-5 accent-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-current/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">🎨</span>
                        <div>
                          <div className="font-medium">文学分析</div>
                          <div className="text-sm opacity-70">
                            重点关注文学技巧和艺术表现
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 accent-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-current/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">📖</span>
                        <div>
                          <div className="font-medium">历史背景</div>
                          <div className="text-sm opacity-70">
                            提供相关的历史文化背景信息
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🔧</span>
                    AI模型配置
                  </h3>
                  
                  <div className="space-y-6">
                    {/* AI厂商选择 */}
                    <div>
                      <label className="block font-medium mb-3">AI厂商</label>
                      <select 
                        className="w-full p-3 border-2 border-current/10 rounded-xl bg-current/5 backdrop-blur-sm text-base focus:outline-none focus:ring-0 focus:border-blue-500/50 focus:bg-blue-50/30 transition-all duration-200 hover:border-current/20"
                        value={aiConfig.value.provider}
                        onChange={(e) => handleProviderChange(e.currentTarget.value)}
                      >
                        <option value="">请选择AI厂商...</option>
                        <optgroup label="🌍 国际厂商">
                          <option value="openai">OpenAI (GPT系列)</option>
                          <option value="anthropic">Anthropic (Claude系列)</option>
                          <option value="google">Google AI (Gemini系列)</option>
                        </optgroup>
                        <optgroup label="🇨🇳 国内厂商">
                          <option value="baidu">百度文心一言</option>
                          <option value="alibaba">阿里通义千问</option>
                          <option value="zhipu">智谱AI (ChatGLM)</option>
                          <option value="moonshot">Moonshot AI</option>
                          <option value="deepseek">DeepSeek</option>
                        </optgroup>
                        <optgroup label="🏠 本地部署">
                          <option value="ollama">Ollama (本地)</option>
                          <option value="custom">自定义接口</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* API地址配置 */}
                    <div>
                      <label className="block font-medium mb-3 flex items-center">
                        <span>API地址</span>
                        <span className="ml-2 text-red-500">*</span>
                        <span className="ml-auto text-xs text-current/60">必填</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://api.example.com/v1"
                        value={aiConfig.value.apiUrl}
                        onChange={(e) => handleApiUrlChange(e.currentTarget.value)}
                        className="w-full p-3 border-2 border-current/10 rounded-xl bg-current/5 backdrop-blur-sm text-base placeholder-current/50 focus:outline-none focus:ring-0 focus:border-blue-500/50 focus:bg-blue-50/30 transition-all duration-200 hover:border-current/20"
                      />
                      <div className="mt-2 text-xs text-current/60">
                        完整的API端点地址，例如：https://api.openai.com/v1
                      </div>
                    </div>

                    {/* API密钥配置 */}
                    <div>
                      <label className="block font-medium mb-3 flex items-center">
                        <span>API密钥</span>
                        <span className="ml-auto text-xs text-current/60">
                          {aiConfig.value.provider && AI_PROVIDERS.find(p => p.id === aiConfig.value.provider)?.requiresKey 
                            ? "必填" : "可选"}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          value={aiConfig.value.currentApiKey}
                          onChange={(e) => handleApiKeyChange(e.currentTarget.value)}
                          className="w-full p-3 pr-12 border-2 border-current/10 rounded-xl bg-current/5 backdrop-blur-sm text-base placeholder-current/50 focus:outline-none focus:ring-0 focus:border-blue-500/50 focus:bg-blue-50/30 transition-all duration-200 hover:border-current/20"
                        />
                        <button 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-current/50 hover:text-current transition-colors"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            input.type = input.type === "password" ? "text" : "password";
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* API密钥获取指导 */}
                      {aiConfig.value.provider && aiConfig.value.provider !== "custom" && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <span className="text-blue-600 mt-0.5">💡</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-blue-900 mb-1">
                                如何获取 {AI_PROVIDERS.find(p => p.id === aiConfig.value.provider)?.name} API密钥：
                              </div>
                              <div className="text-sm text-blue-800 mb-2">
                                {getApiKeyGuide(aiConfig.value.provider).guide}
                              </div>
                              {getApiKeyGuide(aiConfig.value.provider).url && (
                                <a 
                                  href={getApiKeyGuide(aiConfig.value.provider).url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <span>🔗 前往获取</span>
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-current/60">
                        {aiConfig.value.provider && AI_PROVIDERS.find(p => p.id === aiConfig.value.provider)?.requiresKey 
                          ? "此服务需要API密钥进行身份验证" 
                          : "部分服务需要API密钥进行身份验证，本地模型可留空"}
                      </div>
                    </div>

                    {/* 模型选择 */}
                    <div>
                      <label className="block font-medium mb-3 flex items-center">
                        <span>模型名称</span>
                        <span className="ml-2 text-red-500">*</span>
                        <span className="ml-auto text-xs text-current/60">必填</span>
                      </label>
                      
                      {/* 预设模型选择 */}
                      <div className="space-y-3">
                        <select 
                          className="w-full p-3 border-2 border-current/10 rounded-xl bg-current/5 backdrop-blur-sm text-base focus:outline-none focus:ring-0 focus:border-blue-500/50 focus:bg-blue-50/30 transition-all duration-200 hover:border-current/20"
                          value={aiConfig.value.model}
                          onChange={(e) => handleModelChange(e.currentTarget.value)}
                        >
                          <option value="">选择预设模型...</option>
                          {aiConfig.value.availableModels.map((model: any) => (
                            <option key={model.id} value={model.id}>
                              {model.name} - {model.description}
                            </option>
                          ))}
                          {aiConfig.value.availableModels.length === 0 && aiConfig.value.provider && (
                            <option disabled>请先选择AI厂商</option>
                          )}
                        </select>
                        
                        {/* 自定义模型输入 */}
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-current/70 whitespace-nowrap">或手动输入：</span>
                          <input
                            type="text"
                            placeholder="gpt-4, claude-3-sonnet, llama2..."
                            value={aiConfig.value.model}
                            onChange={(e) => handleModelChange(e.currentTarget.value)}
                            className="flex-1 p-3 border-2 border-current/10 rounded-xl bg-current/5 backdrop-blur-sm text-base placeholder-current/50 focus:outline-none focus:ring-0 focus:border-blue-500/50 focus:bg-blue-50/30 transition-all duration-200 hover:border-current/20"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-current/60">
                        {aiConfig.value.provider 
                          ? "当前厂商支持的模型已显示在下拉列表中" 
                          : "请先选择AI厂商以显示支持的模型"}
                      </div>
                    </div>

                    {/* 连接测试 */}
                    <div className="bg-current/5 rounded-xl p-4 border border-current/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">🔗</span>
                          <div>
                            <div className="font-medium">连接测试</div>
                            <div className="text-sm opacity-70">
                              验证API配置是否正确
                            </div>
                          </div>
                        </div>
                        <button 
                          className="test-connection-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={testConnection}
                        >
                          测试连接
                        </button>
                      </div>
                    </div>

                    {/* 配置预设 */}
                    <div>
                      <label className="block font-medium mb-3">快速配置</label>
                      <div className="grid grid-cols-2 gap-3">
                        {AI_PROVIDERS.filter(provider => provider.id !== "custom").map((provider) => (
                          <button 
                            key={provider.id}
                            className={`p-3 rounded-xl border-2 transition-all text-left relative ${
                              aiConfig.value.provider === provider.id
                                ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200"
                                : "border-current/20 hover:bg-current/5"
                            }`}
                            onClick={() => applyQuickConfig(provider.id)}
                          >
                            {/* 选中标识 */}
                            {aiConfig.value.provider === provider.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <div className="text-sm font-medium pr-6">{provider.name}</div>
                            <div className="text-xs opacity-60 mt-1">
                              {provider.models.length > 0 ? provider.models[0].name : "配置API"}
                            </div>
                            {/* 当前选中的模型指示 */}
                            {aiConfig.value.provider === provider.id && aiConfig.value.model && (
                              <div className="text-xs text-blue-600 mt-1 font-medium">
                                当前模型: {provider.models.find(m => m.id === aiConfig.value.model)?.name || aiConfig.value.model}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">⚙️</span>
                    高级选项
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block font-medium mb-3">分析详细度</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button 
                          className={`p-3 rounded-xl border-2 transition-all ${
                            aiSettings.value.detailLevel === "brief"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-current/20 hover:bg-current/5"
                          }`}
                          onClick={() => handleDetailLevelChange("brief")}
                        >
                          <div className="text-sm font-medium">简洁</div>
                          <div className="text-xs opacity-60">核心要点</div>
                        </button>
                        <button 
                          className={`p-3 rounded-xl border-2 transition-all ${
                            aiSettings.value.detailLevel === "standard"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-current/20 hover:bg-current/5"
                          }`}
                          onClick={() => handleDetailLevelChange("standard")}
                        >
                          <div className="text-sm font-medium">标准</div>
                          <div className="text-xs opacity-60">平衡详细</div>
                        </button>
                        <button 
                          className={`p-3 rounded-xl border-2 transition-all ${
                            aiSettings.value.detailLevel === "detailed"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-current/20 hover:bg-current/5"
                          }`}
                          onClick={() => handleDetailLevelChange("detailed")}
                        >
                          <div className="text-sm font-medium">详细</div>
                          <div className="text-xs opacity-60">深度分析</div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium mb-3">输出语言</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          className={`p-3 rounded-xl border-2 transition-all ${
                            aiSettings.value.language === "zh"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-current/20 hover:bg-current/5"
                          }`}
                          onClick={() => handleLanguageChange("zh")}
                        >
                          <div className="text-sm font-medium">中文</div>
                          <div className="text-xs opacity-60">简体中文输出</div>
                        </button>
                        <button 
                          className={`p-3 rounded-xl border-2 transition-all ${
                            aiSettings.value.language === "en"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-current/20 hover:bg-current/5"
                          }`}
                          onClick={() => handleLanguageChange("en")}
                        >
                          <div className="text-sm font-medium">English</div>
                          <div className="text-xs opacity-60">英文输出</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 章节列表 */}
      {showChapterList.value && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => showChapterList.value = false}
        >
          <div
            className={`fixed left-0 top-0 bottom-0 w-80 ${getThemeClasses()} p-6 overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6">目录</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {chapters.value.map((chapter, index) => (
                <button
                  key={chapter.chapterUid}
                  onClick={async () => {
                    showChapterList.value = false;
                    if (index !== currentChapterIndex.value) {
                      await navigateToChapter(
                        index > currentChapterIndex.value ? "next" : "prev",
                      );
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === currentChapterIndex.value
                      ? "bg-blue-100 text-blue-900 font-medium"
                      : "hover:bg-current/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{chapter.title}</span>
                    {index === currentChapterIndex.value && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  {chapter.wordCount && (
                    <div className="text-xs text-current/60 mt-1">
                      {chapter.wordCount} 字
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 头脑风暴洞察面板 */}
      {brainstormState.value.showInsightPanel && (
        <div className="fixed inset-0 z-60 bg-black/50" onClick={() => {
          brainstormState.value = { ...brainstormState.value, showInsightPanel: false };
        }}>
          <div 
            className={`fixed right-0 top-0 bottom-0 w-96 ${getThemeClasses()} p-6 overflow-y-auto border-l border-current/10`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 面板头部 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <span className="mr-2">🧠</span>
                AI洞察面板
              </h2>
              <button
                onClick={() => {
                  brainstormState.value = { ...brainstormState.value, showInsightPanel: false };
                }}
                className="p-2 rounded-full hover:bg-current/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 选中的句子显示 */}
            {brainstormState.value.selectedSentence && (
              <div className="mb-6 p-4 bg-current/5 rounded-xl border border-current/10">
                <h3 className="font-medium mb-2 text-sm text-current/70">选中的文本</h3>
                <p className="text-sm italic">"{brainstormState.value.selectedSentence}"</p>
              </div>
            )}

            {/* 灵感气泡模式 */}
            {brainstormState.value.mode === "insights_bubble" && brainstormState.value.currentInsights.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold flex items-center">
                  <span className="mr-2">💡</span>
                  智能洞察
                </h3>
                {brainstormState.value.currentInsights.map((insight, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{insight.icon}</span>
                        <span className="font-medium text-sm">{insight.title}</span>
                      </div>
                      <button
                        onClick={() => collectInsight(insight)}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                      >
                        收藏
                      </button>
                    </div>
                    <p className="text-sm text-current/80 mb-2">{insight.content}</p>
                    {insight.expandable && (
                      <details className="text-xs text-current/60">
                        <summary className="cursor-pointer hover:text-current">详细信息</summary>
                        <p className="mt-2">{insight.details}</p>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 问题链模式 */}
            {brainstormState.value.mode === "question_chain" && brainstormState.value.questionChain.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold flex items-center">
                  <span className="mr-2">🤔</span>
                  深度思考问题链
                </h3>
                {brainstormState.value.questionChain.map((question, index) => (
                  <div key={index} className={`p-4 rounded-xl border transition-all ${
                    index === brainstormState.value.currentQuestionIndex
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300"
                      : index < brainstormState.value.currentQuestionIndex
                      ? "bg-green-50 border-green-200"
                      : "bg-current/5 border-current/10"
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-xs text-current/60 block mb-1">问题 {index + 1}</span>
                        <p className="text-sm font-medium mb-3">{question}</p>
                        {index === brainstormState.value.currentQuestionIndex && (
                          <div className="mt-3">
                            <div className="relative">
                              <textarea
                                placeholder="在这里记录你的思考和回答..."
                                className="w-full p-3 border border-current/20 rounded-lg bg-white/80 text-sm resize-none pr-20"
                                rows={2}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    const content = e.currentTarget.value.trim();
                                    if (content) {
                                      // 保存回答
                                      saveNote(`问题${index + 1}回答: ${content}`);
                                      e.currentTarget.value = "";
                                      // 移动到下一个问题
                                      const nextIndex = Math.min(brainstormState.value.currentQuestionIndex + 1, brainstormState.value.questionChain.length - 1);
                                      brainstormState.value = {
                                        ...brainstormState.value,
                                        currentQuestionIndex: nextIndex
                                      };
                                      showNotification("回答已保存", "success");
                                    }
                                  }
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  const textarea = e.currentTarget.parentElement?.querySelector('textarea') as HTMLTextAreaElement;
                                  if (textarea) {
                                    const content = textarea.value.trim();
                                    if (content) {
                                      saveNote(`问题${index + 1}回答: ${content}`);
                                      textarea.value = "";
                                      const nextIndex = Math.min(brainstormState.value.currentQuestionIndex + 1, brainstormState.value.questionChain.length - 1);
                                      brainstormState.value = {
                                        ...brainstormState.value,
                                        currentQuestionIndex: nextIndex
                                      };
                                      showNotification("回答已保存", "success");
                                    }
                                  }
                                }}
                                className="absolute right-2 top-2 bg-orange-600 text-white px-3 py-1 rounded-md text-xs hover:bg-orange-700 transition-colors md:hidden"
                              >
                                保存
                              </button>
                            </div>
                            <div className="text-xs text-current/60 mt-1">
                              <span className="hidden md:inline">按 Enter 保存回答并进入下一题，Shift + Enter 换行</span>
                              <span className="md:hidden">点击保存按钮或按 Enter 保存回答</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {index === brainstormState.value.currentQuestionIndex && (
                        <button
                          onClick={() => {
                            const nextIndex = Math.min(brainstormState.value.currentQuestionIndex + 1, brainstormState.value.questionChain.length - 1);
                            brainstormState.value = {
                              ...brainstormState.value,
                              currentQuestionIndex: nextIndex
                            };
                          }}
                          className="ml-2 text-xs px-3 py-1 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
                        >
                          跳过
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      const prevIndex = Math.max(brainstormState.value.currentQuestionIndex - 1, 0);
                      brainstormState.value = {
                        ...brainstormState.value,
                        currentQuestionIndex: prevIndex
                      };
                    }}
                    disabled={brainstormState.value.currentQuestionIndex === 0}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    上一题
                  </button>
                  <button
                    onClick={() => {
                      const nextIndex = Math.min(brainstormState.value.currentQuestionIndex + 1, brainstormState.value.questionChain.length - 1);
                      brainstormState.value = {
                        ...brainstormState.value,
                        currentQuestionIndex: nextIndex
                      };
                    }}
                    disabled={brainstormState.value.currentQuestionIndex === brainstormState.value.questionChain.length - 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    下一题
                  </button>
                </div>
              </div>
            )}

            {/* 多AI分析模式 */}
            {brainstormState.value.mode === "multi_ai" && brainstormState.value.multiAIResults.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold flex items-center">
                  <span className="mr-2">🤖</span>
                  多AI协同分析
                </h3>
                {brainstormState.value.multiAIResults.map((result, index) => (
                  <div key={index} className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{result.provider}</span>
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">{result.style}</span>
                      </div>
                      <button
                        onClick={() => collectInsight({...result, type: "多AI分析"})}
                        className="text-xs px-2 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                      >
                        收藏
                      </button>
                    </div>
                    <p className="text-sm text-current/80 mb-2">{result.analysis}</p>
                    <div className="text-xs text-current/60">
                      <div className="mb-1"><strong>专长：</strong>{result.strengths.join("、")}</div>
                      <details>
                        <summary className="cursor-pointer hover:text-current">查看洞察</summary>
                        <ul className="mt-2 space-y-1">
                          {result.insights.map((insight: string, i: number) => (
                            <li key={i}>• {insight}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 辩论模式 */}
            {brainstormState.value.mode === "debate" && brainstormState.value.debatePositions.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold flex items-center">
                  <span className="mr-2">⚔️</span>
                  观点辩论
                </h3>
                {brainstormState.value.debatePositions.map((position, index) => (
                  <div key={index} className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{position.stance}</span>
                      <button
                        onClick={() => collectInsight({...position, type: "辩论观点"})}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        收藏
                      </button>
                    </div>
                    <p className="text-sm text-current/80 mb-2">{position.viewpoint}</p>
                    <details className="text-xs text-current/60">
                      <summary className="cursor-pointer hover:text-current">查看论据</summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <strong>支持论据：</strong>
                          <ul className="mt-1 space-y-1">
                            {position.arguments.map((arg: string, i: number) => (
                              <li key={i}>• {arg}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>反驳观点：</strong> {position.counterarguments}
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}

            {/* 收藏的洞察 */}
            {brainstormState.value.collectedInsights.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <span className="mr-2">⭐</span>
                  收藏的洞察 ({brainstormState.value.collectedInsights.length})
                </h3>
                {brainstormState.value.collectedInsights.slice(-5).map((insight, index) => (
                  <div key={insight.id} className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-200/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-amber-800 font-medium">{insight.type}</span>
                      <span className="text-xs text-current/60">
                        {new Date(insight.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{insight.title || insight.content}</p>
                    <div className="text-xs text-current/60 mt-1">来源: {insight.source}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 笔记输入 */}
            <div className="mt-6 pt-6 border-t border-current/10">
              <h3 className="font-medium mb-3">添加笔记</h3>
              <div className="relative">
                <textarea
                  ref={(el) => {
                    if (el) {
                      // 检测是否为移动设备
                      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                      if (!isMobile) {
                        el.dataset.desktop = "true";
                      }
                    }
                  }}
                  placeholder="记录你的思考和感悟..."
                  className="w-full p-3 border border-current/20 rounded-lg bg-current/5 text-sm resize-none pr-20"
                  rows={3}
                  onKeyDown={(e) => {
                    // 桌面端：Enter保存，Shift+Enter换行
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const content = e.currentTarget.value.trim();
                      if (content) {
                        saveNote(content);
                        e.currentTarget.value = "";
                        showNotification("笔记已保存", "success");
                      }
                    }
                  }}
                />
                {/* 移动端保存按钮 */}
                <button
                  onClick={(e) => {
                    const textarea = e.currentTarget.parentElement?.querySelector('textarea') as HTMLTextAreaElement;
                    if (textarea) {
                      const content = textarea.value.trim();
                      if (content) {
                        saveNote(content);
                        textarea.value = "";
                        showNotification("笔记已保存", "success");
                      }
                    }
                  }}
                  className="absolute right-2 top-2 bg-blue-600 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-700 transition-colors md:hidden"
                >
                  保存
                </button>
              </div>
              <div className="text-xs text-current/60 mt-1">
                <span className="hidden md:inline">按 Enter 保存笔记，Shift + Enter 换行</span>
                <span className="md:hidden">点击保存按钮或按 Enter 保存笔记</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 通知组件 */}
      {notification.value.show && (
        <div 
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.value.type === "success" ? "bg-green-500 text-white" :
            notification.value.type === "error" ? "bg-red-500 text-white" :
            notification.value.type === "warning" ? "bg-yellow-500 text-white" :
            "bg-blue-500 text-white"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {notification.value.type === "success" ? "✅" :
               notification.value.type === "error" ? "❌" :
               notification.value.type === "warning" ? "⚠️" :
               "ℹ️"}
            </span>
            <span>{notification.value.message}</span>
            <button
              onClick={() => notification.value = { ...notification.value, show: false }}
              className="ml-2 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 登录过期对话框 */}
      {loginState.value.showExpiredDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 mx-4 max-w-md w-full">
            <div className="text-center">
              {/* 图标 */}
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* 标题和内容 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                登录已过期
              </h3>
              <p className="text-gray-600 mb-6">
                您的登录状态已过期，无法加载章节内容。请重新登录以继续阅读。
              </p>
              
              {/* 按钮组 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={closeLoginExpiredDialog}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loginState.value.isLoggingOut}
                >
                  稍后再说
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loginState.value.isLoggingOut}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loginState.value.isLoggingOut ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      退出中...
                    </>
                  ) : (
                    "重新登录"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
