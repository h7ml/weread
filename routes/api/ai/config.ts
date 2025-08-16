import { FreshContext, Handlers } from "$fresh/server.ts";

interface AIConfig {
  provider: string; // 改为字符串，支持自定义厂商
  apiUrl: string; // 完整的API地址
  apiKey?: string; // API密钥，可选
  model: string; // 模型名称，必需
  settings: {
    intelligentMode: boolean;
    realTimeSuggestions: boolean;
    literaryAnalysis: boolean;
    historicalContext: boolean;
    detailLevel: "brief" | "standard" | "detailed";
    language: "zh" | "en";
  };
}

// 主流AI厂商配置
interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  requiresKey: boolean;
  models: {
    id: string;
    name: string;
    description: string;
    type: "chat" | "completion" | "both";
  }[];
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    requiresKey: true,
    models: [
      { id: "gpt-4", name: "GPT-4", description: "最强大的通用模型", type: "chat" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "更快速的GPT-4版本", type: "chat" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "高性价比选择", type: "chat" },
      { id: "gpt-4o", name: "GPT-4o", description: "多模态模型", type: "both" }
    ]
  },
  {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    requiresKey: true,
    models: [
      { id: "claude-3-opus", name: "Claude 3 Opus", description: "最强大的Claude模型", type: "chat" },
      { id: "claude-3-sonnet", name: "Claude 3 Sonnet", description: "平衡性能和成本", type: "chat" },
      { id: "claude-3-haiku", name: "Claude 3 Haiku", description: "快速响应", type: "chat" },
      { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", description: "最新版本", type: "chat" }
    ]
  },
  {
    id: "google",
    name: "Google AI",
    baseUrl: "https://generativelanguage.googleapis.com",
    requiresKey: true,
    models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "2025最新旗舰模型，支持思考模式", type: "chat" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "高性价比，速度优化", type: "chat" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "下一代功能，100万上下文", type: "chat" },
      { id: "gemini-pro", name: "Gemini Pro", description: "经典版本", type: "chat" },
      { id: "gemini-pro-vision", name: "Gemini Pro Vision", description: "支持图像的多模态模型", type: "both" }
    ]
  },
  {
    id: "baidu",
    name: "百度文心",
    baseUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop",
    requiresKey: true,
    models: [
      { id: "ernie-4.5-turbo", name: "文心一言 4.5 Turbo", description: "2025最新版本", type: "chat" },
      { id: "ernie-bot-4", name: "文心一言 4.0", description: "旗舰级模型", type: "chat" },
      { id: "ernie-bot", name: "文心一言", description: "百度的对话模型", type: "chat" },
      { id: "ernie-bot-turbo", name: "文心一言 Turbo", description: "更快的响应速度", type: "chat" }
    ]
  },
  {
    id: "alibaba",
    name: "阿里通义",
    baseUrl: "https://dashscope.aliyuncs.com/api/v1",
    requiresKey: true,
    models: [
      { id: "qwen-turbo", name: "通义千问 Turbo", description: "快速响应版本", type: "chat" },
      { id: "qwen-plus", name: "通义千问 Plus", description: "增强版本", type: "chat" },
      { id: "qwen-max", name: "通义千问 Max", description: "最强版本", type: "chat" }
    ]
  },
  {
    id: "zhipu",
    name: "智谱AI",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    requiresKey: true,
    models: [
      { id: "glm-4.5", name: "GLM-4.5", description: "2025最新旗舰模型，支持思考模式", type: "chat" },
      { id: "glm-4.5-air", name: "GLM-4.5 Air", description: "精简设计，高效响应", type: "chat" },
      { id: "glm-4", name: "GLM-4", description: "智谱经典模型", type: "chat" },
      { id: "glm-4-flash", name: "GLM-4 Flash", description: "免费高性价比模型", type: "chat" },
      { id: "glm-3-turbo", name: "GLM-3 Turbo", description: "高性价比版本", type: "chat" }
    ]
  },
  {
    id: "moonshot",
    name: "Moonshot AI",
    baseUrl: "https://api.moonshot.cn/v1",
    requiresKey: true,
    models: [
      { id: "kimi-k2", name: "Kimi K2", description: "2025最新万亿参数模型，强大的工具调用能力", type: "chat" },
      { id: "moonshot-v1-8k", name: "Moonshot v1 8K", description: "8K上下文", type: "chat" },
      { id: "moonshot-v1-32k", name: "Moonshot v1 32K", description: "32K上下文", type: "chat" },
      { id: "moonshot-v1-128k", name: "Moonshot v1 128K", description: "128K上下文", type: "chat" }
    ]
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    requiresKey: true,
    models: [
      { id: "deepseek-r1", name: "DeepSeek R1", description: "2025最新思考模型，671B参数", type: "chat" },
      { id: "deepseek-v3", name: "DeepSeek V3", description: "强大的通用模型", type: "chat" },
      { id: "deepseek-chat", name: "DeepSeek Chat", description: "对话模型", type: "chat" },
      { id: "deepseek-coder", name: "DeepSeek Coder", description: "代码专用模型", type: "chat" }
    ]
  },
  {
    id: "ollama",
    name: "Ollama (本地)",
    baseUrl: "http://localhost:11434/api",
    requiresKey: false,
    models: [
      { id: "llama2", name: "Llama 2", description: "Meta开源模型", type: "chat" },
      { id: "llama2:13b", name: "Llama 2 13B", description: "13B参数版本", type: "chat" },
      { id: "codellama", name: "Code Llama", description: "代码专用模型", type: "chat" },
      { id: "mistral", name: "Mistral", description: "高效开源模型", type: "chat" },
      { id: "qwen", name: "Qwen", description: "通义千问开源版", type: "chat" }
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

interface ConfigResponse {
  success: boolean;
  data?: AIConfig;
  providers?: AIProvider[];
  error?: string;
}

export const handler: Handlers<ConfigResponse> = {
  // 获取AI配置和厂商列表
  async GET(req: Request, _ctx: FreshContext): Promise<Response> {
    try {
      const url = new URL(req.url);
      const action = url.searchParams.get("action");
      
      // 如果请求厂商列表
      if (action === "providers") {
        return Response.json({
          success: true,
          providers: AI_PROVIDERS
        });
      }

      // 获取用户配置
      const token = url.searchParams.get("token") || req.headers.get("Authorization")?.replace("Bearer ", "");
      
      if (!token) {
        return Response.json({
          success: false,
          error: "未授权访问"
        }, { status: 401 });
      }

      const config = await getUserAIConfig(token);

      return Response.json({
        success: true,
        data: config,
        providers: AI_PROVIDERS
      });

    } catch (error) {
      console.error("获取AI配置失败:", error);
      return Response.json({
        success: false,
        error: "获取AI配置失败"
      }, { status: 500 });
    }
  },

  // 更新AI配置
  async POST(req: Request, _ctx: FreshContext): Promise<Response> {
    try {
      const body: { token?: string; config: AIConfig } = await req.json();
      
      if (!body.token) {
        return Response.json({
          success: false,
          error: "未授权访问"
        }, { status: 401 });
      }

      // 验证配置数据
      const validationResult = validateAIConfig(body.config);
      if (!validationResult.valid) {
        return Response.json({
          success: false,
          error: validationResult.error
        }, { status: 400 });
      }

      // 保存用户的AI配置
      await saveUserAIConfig(body.token, body.config);

      return Response.json({
        success: true,
        data: body.config
      });

    } catch (error) {
      console.error("更新AI配置失败:", error);
      return Response.json({
        success: false,
        error: "更新AI配置失败"
      }, { status: 500 });
    }
  }
};

async function getUserAIConfig(token: string): Promise<AIConfig> {
  // 模拟从数据库获取用户配置
  // 实际项目中需要从KV存储或数据库获取
  
  return {
    provider: "anthropic",
    apiUrl: "https://api.anthropic.com/v1",
    model: "claude-3-sonnet",
    settings: {
      intelligentMode: true,
      realTimeSuggestions: false,
      literaryAnalysis: true,
      historicalContext: true,
      detailLevel: "standard",
      language: "zh"
    }
  };
}

async function saveUserAIConfig(token: string, config: AIConfig): Promise<void> {
  // 模拟保存到数据库
  // 实际项目中需要保存到KV存储或数据库
  console.log(`保存用户AI配置: ${token}`, config);
  
  // 可以在这里添加真实的数据库操作
  // const kv = await Deno.openKv();
  // await kv.set([`ai_config_${token}`], config);
}

function validateAIConfig(config: AIConfig): { valid: boolean; error?: string } {
  if (!config.provider) {
    return { valid: false, error: "AI提供商不能为空" };
  }

  if (!config.apiUrl) {
    return { valid: false, error: "API地址不能为空" };
  }

  if (!config.model) {
    return { valid: false, error: "模型不能为空" };
  }

  // 验证URL格式
  try {
    new URL(config.apiUrl);
  } catch {
    return { valid: false, error: "API地址格式无效" };
  }

  if (!config.settings) {
    return { valid: false, error: "AI设置不能为空" };
  }

  if (!["brief", "standard", "detailed"].includes(config.settings.detailLevel)) {
    return { valid: false, error: "详细度设置无效" };
  }

  if (!["zh", "en"].includes(config.settings.language)) {
    return { valid: false, error: "语言设置无效" };
  }

  return { valid: true };
}

// 导出厂商列表供其他地方使用
export { AI_PROVIDERS };