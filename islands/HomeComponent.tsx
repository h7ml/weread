import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import Navigation from "../components/Navigation.tsx";

// 数据配置
const STATS_CONFIG = [
  {
    title: "书架藏书",
    key: "booksCount",
    unit: "本书籍",
    color: "blue",
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    title: "阅读时长",
    key: "readingTime",
    unit: "小时",
    color: "green",
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "已完成",
    key: "finishedBooks",
    unit: "本书籍",
    color: "purple",
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

const FEATURE_CARDS = [
  {
    id: "tts",
    title: "智能语音朗读",
    description:
      "支持浏览器TTS、Leftsite TTS、OpenXing TTS三种引擎，包含超拟人语音，让阅读更轻松",
    colorFrom: "blue-500",
    colorTo: "cyan-500",
    hoverColor: "blue-600",
    features: ["三种TTS引擎可选", "语速、音量精准调节", "智能断句与高亮显示"],
    icon: (
      <svg
        className="w-8 h-8 text-white"
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
    ),
  },
  {
    id: "scroll",
    title: "自动滚动阅读",
    description: "设置滚动速度，解放双手，享受沉浸式阅读体验，支持自动翻页功能",
    colorFrom: "green-500",
    colorTo: "emerald-500",
    hoverColor: "green-600",
    features: ["可调节滚动速度", "平滑滚动效果", "智能自动翻页"],
    icon: (
      <svg
        className="w-8 h-8 text-white"
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
    ),
  },
  {
    id: "theme",
    title: "多主题定制",
    description:
      "8种精美主题，护眼模式、夜间模式等，保护视力，个性化您的阅读界面",
    colorFrom: "purple-500",
    colorTo: "pink-500",
    hoverColor: "purple-600",
    features: ["8种精美主题", "字体大小与行距调节", "页面宽度自适应"],
    icon: (
      <svg
        className="w-8 h-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5z"
        />
      </svg>
    ),
  },
  {
    id: "shelf",
    title: "书架同步",
    description: "同步微信读书书架，支持按分类浏览，快速找到想读的书籍",
    colorFrom: "indigo-500",
    colorTo: "blue-500",
    hoverColor: "indigo-600",
    features: ["实时书架同步", "分类管理书籍", "阅读进度显示"],
    icon: (
      <svg
        className="w-8 h-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    title: "全屏设置界面",
    description: "专业的全屏设置面板，分类清晰，操作简便，精确调节每个参数",
    colorFrom: "orange-500",
    colorTo: "red-500",
    hoverColor: "orange-600",
    features: ["全屏设置界面", "实时设置保存", "智能默认配置"],
    icon: (
      <svg
        className="w-8 h-8 text-white"
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
    ),
  },
  {
    id: "shortcuts",
    title: "快捷操作",
    description:
      "键盘快捷键支持，快速切换功能，提升操作效率，专为重度阅读用户设计",
    colorFrom: "teal-500",
    colorTo: "cyan-500",
    hoverColor: "teal-600",
    features: ["键盘快捷键", "快捷导航栏", "沉浸式阅读模式"],
    icon: (
      <svg
        className="w-8 h-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
];

const USAGE_STEPS = [
  {
    step: 1,
    title: "登录账号",
    description: "使用您的微信读书账号登录，同步书架和阅读记录",
    colorFrom: "blue-500",
    colorTo: "cyan-500",
  },
  {
    step: 2,
    title: "选择书籍",
    description: "从书架中选择要阅读的书籍，继续上次的阅读进度",
    colorFrom: "purple-500",
    colorTo: "pink-500",
  },
  {
    step: 3,
    title: "享受阅读",
    description: "开启语音朗读或自动滚动，沉浸在知识的海洋中",
    colorFrom: "green-500",
    colorTo: "emerald-500",
  },
];

export default function HomeComponent() {
  const isLoggedIn = useSignal(false);
  const user = useSignal(null);
  const loading = useSignal(true);
  const userStats = useSignal({
    booksCount: 0,
    readingTime: 0,
    finishedBooks: 0,
  });

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("weread_token");
    const savedUser = localStorage.getItem("weread_user");
    const savedVid = localStorage.getItem("weread_vid");

    if (token && savedUser && savedVid) {
      isLoggedIn.value = true;
      user.value = {
        name: savedUser,
        vid: savedVid,
      };

      // 验证token是否还有效并获取用户统计数据
      verifyTokenAndLoadStats(token);
    } else {
      loading.value = false;
    }
  }, []);

  const verifyTokenAndLoadStats = async (token: string) => {
    try {
      const response = await fetch(
        `/api/shelf?token=${token}&page=1&pageSize=20`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          isLoggedIn.value = true;
          // 更新用户信息
          if (data.data.user) {
            user.value = data.data.user;
            localStorage.setItem("weread_user", data.data.user.name);
            localStorage.setItem("weread_vid", data.data.user.vid.toString());
          }

          // 更新用户统计数据
          if (data.data.books) {
            const books = data.data.books;
            userStats.value = {
              booksCount: books.length,
              readingTime: Math.floor(Math.random() * 100) + 20, // 模拟阅读时长
              finishedBooks: books.filter((book: any) =>
                book.readProgress >= 100
              ).length,
            };
          }
        } else {
          // Token失效，清理本地存储
          localStorage.clear();
          isLoggedIn.value = false;
        }
      } else if (response.status === 401) {
        // Token失效，清理本地存储
        localStorage.clear();
        isLoggedIn.value = false;
      }
    } catch (error) {
      console.error("Failed to verify token:", error);
      // 网络错误但不清除token，让用户自己重试
      isLoggedIn.value = true;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    localStorage.clear();
    isLoggedIn.value = false;
    user.value = null;
    userStats.value = { booksCount: 0, readingTime: 0, finishedBooks: 0 };
  };

  if (loading.value) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <svg
              className="animate-spin h-16 w-16 mx-auto text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              >
              </circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              >
              </path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <p className="mt-6 text-gray-600 text-lg">正在检查登录状态...</p>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse">
            </div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            >
            </div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            >
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoggedIn.value && user.value) {
    // 已登录用户 - 显示增强版仪表板
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation
          title="微信读书助手"
          icon="home"
          showUser={true}
          currentPath="/"
          actions={[
            {
              label: "搜索书籍",
              href: "/search",
              type: "link",
            },
            {
              label: "我的书架",
              href: "/shelf",
              type: "link",
            },
          ]}
        />

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* 欢迎区域 */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                欢迎回来！
                <span className="wave ml-2 text-2xl">👋</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                继续您的阅读之旅，探索知识的海洋
              </p>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {STATS_CONFIG.map((stat) => (
                <div
                  key={stat.key}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p
                        className={`text-3xl font-bold text-${stat.color}-600`}
                      >
                        {userStats
                          .value[stat.key as keyof typeof userStats.value]}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{stat.unit}</p>
                    </div>
                    <div
                      className={`w-12 h-12 bg-${stat.color}-600 rounded-lg flex items-center justify-center`}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {
              /* <a
              href="/shelf"
              className="group bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">
                我的书架
              </h3>
              <p className="text-gray-600 mb-4">
                查看和管理您的所有书籍，继续上次的阅读
              </p>
              <div className="flex items-center text-blue-600 group-hover:translate-x-1 transition-transform duration-300">
                <span className="text-sm font-medium">立即前往</span>
                <svg
                  className="ml-1 w-4 h-4"
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
              </div>
            </a> */
            }

            {
              /* 暂时隐藏 - dashboard 功能有问题
            <a
              href="/dashboard"
              className="group bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="text-green-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-green-600 transition-colors">
                阅读统计
              </h3>
              <p className="text-gray-600 mb-4">
                查看详细的阅读数据和进度统计信息
              </p>
              <div className="flex items-center text-green-600 group-hover:translate-x-1 transition-transform duration-300">
                <span className="text-sm font-medium">查看统计</span>
                <svg
                  className="ml-1 w-4 h-4"
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
              </div>
            </a>
            */
            }

            {
              /* 暂时隐藏 - notes 功能有问题
            <a
              href="/notes"
              className="group bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-purple-600 transition-colors">
                笔记管理
              </h3>
              <p className="text-gray-600 mb-4">
                管理您的阅读笔记、书签和书评
              </p>
              <div className="flex items-center text-purple-600 group-hover:translate-x-1 transition-transform duration-300">
                <span className="text-sm font-medium">管理笔记</span>
                <svg
                  className="ml-1 w-4 h-4"
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
              </div>
            </a>
            */
            }

            {
              /* 暂时隐藏 - profile 功能有问题
            <a
              href="/profile"
              className="group bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors">
                个人中心
              </h3>
              <p className="text-gray-600 mb-4">
                查看个人资料、成就和阅读目标
              </p>
              <div className="flex items-center text-indigo-600 group-hover:translate-x-1 transition-transform duration-300">
                <span className="text-sm font-medium">个人中心</span>
                <svg
                  className="ml-1 w-4 h-4"
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
              </div>
            </a>
            */
            }
          </div>

          {/* 阅读设置 */}
          {
            /* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="group bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-teal-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-12 h-12"
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
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-teal-600 transition-colors">
                阅读设置
              </h3>
              <p className="text-gray-600 mb-4">
                个性化您的阅读体验，调整字体、主题等
              </p>
              <div className="flex items-center text-teal-600 group-hover:translate-x-1 transition-transform duration-300">
                <span className="text-sm font-medium">个性定制</span>
                <svg
                  className="ml-1 w-4 h-4"
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
              </div>
            </div>
          </div> */
          }

          {/* 使用提示 */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                💡 使用小贴士
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    🎧 智能语音朗读
                  </h4>
                  <p className="text-gray-600 text-sm">
                    支持三种TTS引擎，包括超拟人语音，让阅读更轻松
                  </p>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    📖 自动滚动阅读
                  </h4>
                  <p className="text-gray-600 text-sm">
                    设置自动滚动速度，解放双手，沉浸式阅读体验
                  </p>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    🎨 多主题切换
                  </h4>
                  <p className="text-gray-600 text-sm">
                    护眼、夜间等多种主题，保护视力，舒适阅读
                  </p>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    ⚙️ 全屏设置界面
                  </h4>
                  <p className="text-gray-600 text-sm">
                    专业的设置面板，精确调节字体、语音等参数
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes wave {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(20deg); }
              75% { transform: rotate(-10deg); }
            }
            .wave {
              animation: wave 2s infinite;
              display: inline-block;
              transform-origin: bottom center;
            }
          `,
          }}
        />
      </div>
    );
  }

  // 未登录用户 - 显示增强版欢迎页面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation
        title="微信读书助手"
        icon="home"
        showUser={false}
        currentPath="/"
        actions={[
          {
            label: "登录",
            href: "/login",
            type: "link",
          },
        ]}
      />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* 英雄区域 */}
        <div className="text-center mb-20">
          <div className="relative mb-8">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              重新定义
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                阅读体验
              </span>
            </h2>
            <div className="absolute -top-4 -left-4 w-32 h-32 bg-blue-200/30 rounded-full blur-xl">
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-200/30 rounded-full blur-xl">
            </div>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            智能语音朗读、自动滚动、多主题切换，让每一次阅读都成为享受
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a
              href="/login"
              className="group inline-flex items-center px-8 py-4 text-lg font-medium rounded-2xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <svg
                className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              开始阅读之旅
            </a>
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>需要微信读书账号</span>
            </div>
          </div>

          {/* 功能预览 */}
          <div className="relative bg-white/60 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/50 max-w-4xl mx-auto">
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-red-400 rounded-full">
            </div>
            <div className="absolute -top-3 left-3 w-6 h-6 bg-yellow-400 rounded-full">
            </div>
            <div className="absolute -top-3 left-9 w-6 h-6 bg-green-400 rounded-full">
            </div>
            <div className="mt-4 bg-gray-900 text-green-400 text-left p-6 rounded-2xl font-mono text-sm overflow-x-auto">
              <div className="flex items-center mb-2">
                <span className="text-blue-400">$</span>
                <span className="ml-2 typing-animation">
                  启动微信读书助手...
                </span>
              </div>
              <div className="text-gray-500 mb-1">✅ 智能语音引擎加载完成</div>
              <div className="text-gray-500 mb-1">✅ 自动滚动模块就绪</div>
              <div className="text-gray-500 mb-1">✅ 多主题系统激活</div>
              <div className="text-green-400">
                🚀 准备就绪，开始您的极致阅读体验！
              </div>
            </div>
          </div>
        </div>

        {/* 核心功能介绍 */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              强大功能，一应俱全
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              从智能语音到个性定制，每一个细节都为了更好的阅读体验
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURE_CARDS.map((feature) => (
              <div
                key={feature.id}
                className="group bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/50 hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br from-${feature.colorFrom} to-${feature.colorTo} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h4
                  className={`text-2xl font-bold mb-4 text-gray-900 group-hover:text-${feature.hoverColor} transition-colors`}
                >
                  {feature.title}
                </h4>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <div className="space-y-2">
                  {feature.features.map((featureItem, index) => (
                    <div
                      key={index}
                      className="flex items-center text-sm text-gray-500"
                    >
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {featureItem}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 使用指南 */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              简单三步，开始使用
            </h3>
            <p className="text-xl text-gray-600">轻松上手，享受极致阅读体验</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {USAGE_STEPS.map((step) => (
              <div key={step.step} className="text-center group">
                <div
                  className={`w-20 h-20 bg-gradient-to-r from-${step.colorFrom} to-${step.colorTo} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-3xl font-bold text-white">
                    {step.step}
                  </span>
                </div>
                <h4 className="text-2xl font-bold mb-4 text-gray-900">
                  {step.title}
                </h4>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 底部CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            准备开始您的阅读之旅了吗？
          </h3>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            加入数千名用户，体验前所未有的智能阅读方式
          </p>
          <a
            href="/login"
            className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-2xl text-blue-600 bg-white hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            <svg
              className="mr-3 w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            立即登录体验
          </a>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 项目信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                微信读书 Web
              </h3>
              <p className="text-sm text-gray-600">
                基于 Fresh (Deno) 构建的现代化微信读书 Web
                阅读平台，提供优质的在线阅读体验和高级 TTS 功能。
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/h7ml/weread"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GitHub
                </a>
                <a
                  href="https://webook.linuxcloudlab.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  在线体验
                </a>
              </div>
            </div>

            {/* 作者信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                作者信息
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 w-16">姓名:</span>
                  <span className="text-sm font-medium text-gray-900">
                    h7ml
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 w-16">邮箱:</span>
                  <a
                    href="mailto:h7ml@qq.com"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    h7ml@qq.com
                  </a>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 w-16">GitHub:</span>
                  <a
                    href="https://github.com/h7ml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    @h7ml
                  </a>
                </div>
              </div>
            </div>

            {/* 联系方式 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                联系作者
              </h3>
              <div className="space-y-3">
                <a
                  href="mailto:h7ml@qq.com"
                  className="flex items-center p-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  发送邮件
                </a>
                <a
                  href="https://tech-5g8h9y7s90510d9e-1253666439.tcloudbaseapp.com/wechat.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.298c-.019.063-.024.094-.024.094-.013.094.083.174.176.133l1.715-.855a.64.64 0 01.596-.016c1.003.462 2.174.728 3.403.728 4.8 0 8.691-3.288 8.691-7.342 0-4.054-3.891-7.342-8.691-7.342zm-.362 11.236l-2.188-2.188-4.275 2.188 4.7-4.975 2.251 2.188 4.212-2.188-4.7 4.975z" />
                  </svg>
                  添加微信
                </a>
                <a
                  href="https://github.com/h7ml/weread/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.732L13.732 4.268c-.77-1.064-2.694-1.064-3.464 0L3.34 16.268C2.57 17.333 3.532 19 5.072 19z"
                    />
                  </svg>
                  反馈问题
                </a>
              </div>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-500">
                © 2025 h7ml. All rights reserved. Licensed under{" "}
                <a
                  href="https://github.com/h7ml/weread/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  MIT License
                </a>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Made with ❤️ using</span>
                <div className="flex items-center space-x-2">
                  <span className="bg-black text-white px-2 py-1 rounded text-xs">
                    Deno
                  </span>
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                    Fresh
                  </span>
                  <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                    TypeScript
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes typing {
            from { width: 0; }
            to { width: 100%; }
          }
          .typing-animation {
            overflow: hidden;
            white-space: nowrap;
            animation: typing 3s steps(20, end) infinite;
          }
        `,
        }}
      />
    </div>
  );
}
