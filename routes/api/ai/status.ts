import { FreshContext, Handlers } from "$fresh/server.ts";

interface AIStatus {
  available: boolean;
  features: {
    textAnalysis: boolean;
    chatbot: boolean;
    sentenceExplanation: boolean;
    bookSummary: boolean;
  };
  providers: {
    name: string;
    status: "online" | "offline" | "limited";
    capabilities: string[];
  }[];
  usage?: {
    requestsToday: number;
    limit: number;
    remaining: number;
  };
}

interface StatusResponse {
  success: boolean;
  data?: AIStatus;
  error?: string;
}

export const handler: Handlers<StatusResponse> = {
  async GET(_req: Request, _ctx: FreshContext): Promise<Response> {
    try {
      const status = await checkAIServiceStatus();

      return Response.json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error("检查AI服务状态失败:", error);
      return Response.json({
        success: false,
        error: "无法获取AI服务状态"
      }, { status: 500 });
    }
  }
};

async function checkAIServiceStatus(): Promise<AIStatus> {
  // 检查各种AI服务的可用性
  const providers = [
    {
      name: "OpenAI GPT-4",
      status: "online" as const,
      capabilities: ["文本分析", "对话问答", "内容生成", "语言理解"]
    },
    {
      name: "Anthropic Claude",
      status: "online" as const,
      capabilities: ["深度分析", "文学理解", "历史背景", "批判思维"]
    },
    {
      name: "本地模型",
      status: "limited" as const,
      capabilities: ["基础分析", "关键词提取", "简单问答"]
    }
  ];

  // 模拟检查服务状态
  const isOnline = Math.random() > 0.1; // 90%的概率在线

  return {
    available: isOnline,
    features: {
      textAnalysis: isOnline,
      chatbot: isOnline,
      sentenceExplanation: isOnline,
      bookSummary: isOnline
    },
    providers,
    usage: {
      requestsToday: Math.floor(Math.random() * 100),
      limit: 1000,
      remaining: 1000 - Math.floor(Math.random() * 100)
    }
  };
}