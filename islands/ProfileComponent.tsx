import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import Navigation from "../components/Navigation.tsx";
import BottomNavigation from "../components/BottomNavigation.tsx";
import { logout } from "../utils/logout.ts";

// 现代化个人主页统计卡片配置
const PROFILE_STATS_CONFIG = [
  {
    key: "readingTime",
    title: "阅读时长",
    gradient: "from-blue-500 to-indigo-600",
    textGradient: "from-blue-600 to-indigo-700",
    icon: "⏱️",
    getValue: (stats) => {
      const hours = Math.floor((stats.total?.readingTime || 0) / 60);
      return hours > 0 ? `${hours}小时` : `${stats.total?.readingTime || 0}分钟`;
    },
    getSubValue: (stats) => `今日 ${stats.today?.readingTime || 0}分钟`,
  },
  {
    key: "booksCount",
    title: "阅读书籍",
    gradient: "from-emerald-500 to-teal-600",
    textGradient: "from-emerald-600 to-teal-700",
    icon: "📚",
    getValue: (stats) => `${stats.total?.booksCount || 0}本`,
    getSubValue: (stats) => `完成 ${stats.finished?.booksCount || 0}本`,
  },
  {
    key: "readWords",
    title: "阅读字数",
    gradient: "from-purple-500 to-pink-600",
    textGradient: "from-purple-600 to-pink-700",
    icon: "📝",
    getValue: (stats) => `${((stats.total?.readWords || 0) / 10000).toFixed(1)}万字`,
    getSubValue: (stats) => `本周 ${((stats.thisWeek?.readWords || 0) / 1000).toFixed(1)}k字`,
  },
  {
    key: "streak",
    title: "连续阅读",
    gradient: "from-orange-500 to-red-600",
    textGradient: "from-orange-600 to-red-700",
    icon: "🔥",
    getValue: (stats) => `${stats.total?.daysCount || 0}天`,
    getSubValue: (stats) => `最长 ${stats.longest?.daysCount || 0}天`,
  },
];

// 现代化Tab配置
const PROFILE_TABS = [
  { 
    key: "library", 
    label: "书库", 
    icon: "📚",
    description: "管理我的图书收藏"
  },
  { 
    key: "achievements", 
    label: "成就", 
    icon: "🏆",
    description: "查看阅读成就和里程碑"
  },
  { 
    key: "goals", 
    label: "目标", 
    icon: "🎯",
    description: "设置和跟踪阅读目标"
  },
  { 
    key: "settings", 
    label: "设置", 
    icon: "⚙️",
    description: "个人偏好和隐私设置"
  },
];

// 现代化快速操作配置
const QUICK_ACTIONS = [
  {
    key: "shelf",
    title: "我的书架",
    icon: "📚",
    description: "查看和管理收藏的图书",
    color: "bg-gradient-to-r from-green-500 to-emerald-500",
    action: "my_shelf"
  },
  {
    key: "search",
    title: "搜索图书",
    icon: "🔍",
    description: "探索和发现新的好书",
    color: "bg-gradient-to-r from-blue-500 to-indigo-600",
    action: "search_books"
  },
];

export default function ProfileComponent() {
  const userInfo = useSignal(null);
  const userStats = useSignal(null);
  const achievements = useSignal([]);
  const readingGoals = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const activeTab = useSignal("library");
  const isLoggedIn = useSignal(false);
  const isLoggingOut = useSignal(false);

  useEffect(() => {
    checkLoginAndLoadData();
  }, []);

  // 退出登录功能
  const handleLogout = async () => {
    if (isLoggingOut.value) return;
    
    try {
      isLoggingOut.value = true;
      
      const success = await logout({
        showConfirm: true,
        redirectTo: "/login",
        silent: false
      });
      
      if (success) {
        // 清除本地状态
        userInfo.value = null;
        userStats.value = null;
        achievements.value = [];
        readingGoals.value = [];
        isLoggedIn.value = false;
        error.value = "";
      }
      
    } catch (err) {
      console.error("Logout error:", err);
      alert("退出登录时发生错误，请刷新页面重试。");
    } finally {
      isLoggingOut.value = false;
    }
  };

  const checkLoginAndLoadData = async () => {
    const token = localStorage.getItem("weread_token");
    if (!token) {
      isLoggedIn.value = false;
      loading.value = false;
      return;
    }
    
    isLoggedIn.value = true;
    await loadUserProfile(token);
  };

  const loadUserProfile = async (token: string) => {

    try {
      loading.value = true;

      // 首先获取用户凭证
      const credentialRes = await fetch(`/api/user/credential?token=${token}`);
      
      let userCredentials = null;
      if (credentialRes.ok) {
        const credentialData = await credentialRes.json();
        userCredentials = credentialData.data;
      }

      if (!userCredentials) {
        error.value = "无法获取用户凭证";
        return;
      }

      // 使用可以正常工作的 WeRead API 接口
      const wereadRes = await fetch(
        `/api/user/weread?userVid=${userCredentials.vid}&skey=${userCredentials.skey}&vid=${userCredentials.vid}`
      );

      if (wereadRes.ok) {
        const wereadData = await wereadRes.json();
        console.log('WeRead API Response:', wereadData);
        
        if (wereadData.success && wereadData.data) {
          // 使用转换后的用户信息
          userInfo.value = wereadData.data.transformed;
          
          // 打印原始数据用于调试
          console.log('Raw WeRead User:', wereadData.data.raw);
          console.log('Transformed User:', wereadData.data.transformed);
        }
      } else {
        const errorData = await wereadRes.json();
        error.value = errorData.error || "获取微信读书用户信息失败";
      }

      // 尝试获取阅读统计
      try {
        const statsRes = await fetch(`/api/user/stats?token=${token}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          userStats.value = statsData.data;
        } else {
          // 使用模拟统计数据
          userStats.value = {
            total: {
              readingTime: 3600, // 60小时
              booksCount: 25,
              readWords: 500000,
              daysCount: 15
            },
            today: {
              readingTime: 45,
              readWords: 2500
            },
            thisWeek: {
              readingTime: 320,
              readWords: 18000
            }
          };
        }
      } catch (statsError) {
        console.warn('Failed to load stats:', statsError);
        // 使用模拟统计数据
        userStats.value = {
          total: {
            readingTime: 3600, // 60小时
            booksCount: 25,
            readWords: 500000,
            daysCount: 15
          },
          today: {
            readingTime: 45,
            readWords: 2500
          },
          thisWeek: {
            readingTime: 320,
            readWords: 18000
          }
        };
      }

      // 使用模拟数据获取成就和目标
      try {
        const mockAchievements = [
          {
            id: "achievement_1",
            name: "阅读新手",
            description: "完成第一本书的阅读",
            icon: "🏆",
            unlocked: true,
            unlockedTime: Date.now() - 86400000,
          },
          {
            id: "achievement_2", 
            name: "坚持阅读",
            description: "连续阅读7天",
            icon: "📚",
            unlocked: true,
            unlockedTime: Date.now() - 172800000,
          },
          {
            id: "achievement_3",
            name: "深度阅读",
            description: "单日阅读超过2小时",
            icon: "⭐",
            unlocked: false,
          }
        ];
        achievements.value = mockAchievements;

        const mockGoals = [
          {
            goalId: "goal_1",
            type: "time",
            target: 60,
            current: 45,
            period: "daily",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            isCompleted: false,
          },
          {
            goalId: "goal_2",
            type: "books",
            target: 50,
            current: 25,
            period: "yearly",
            startDate: "2024-01-01", 
            endDate: "2024-12-31",
            isCompleted: false,
          }
        ];
        readingGoals.value = mockGoals;
      } catch (mockError) {
        console.warn('Failed to load mock data:', mockError);
      }

    } catch (err) {
      console.error("Failed to load user profile:", err);
      error.value = "加载用户资料失败";
    } finally {
      loading.value = false;
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const formatStreak = (days) => {
    if (days === 0) return "今日尚未阅读";
    if (days === 1) return "连续阅读1天";
    return `连续阅读${days}天`;
  };

  // 未登录状态
  if (!loading.value && !isLoggedIn.value) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="profile-container">
            <Navigation
              title="个人中心"
              icon="home"
              showUser={false}
              currentPath="/profile"
            />
            
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-indigo-600"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  访问个人中心
                </h2>
                <p className="text-gray-600 mb-8">
                  登录后可查看个人资料、阅读成就和个性化设置
                </p>
                <div className="space-y-4">
                  <a
                    href="/login"
                    className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
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
                    立即登录
                  </a>
                  <a
                    href="/"
                    className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    返回首页
                  </a>
                </div>
              </div>
            </div>
            
            {/* 底部导航 */}
            <BottomNavigation currentPath="/profile" />
          </div>
        </div>
      </>
    );
  }

  if (loading.value) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4">
          </div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="profile-container">
      <Navigation
        title="个人中心"
        icon="home"
        showUser={true}
        currentPath="/profile"
        actions={[
          {
            label: "刷新数据",
            onClick: () => {
              const token = localStorage.getItem("weread_token");
              if (token) loadUserProfile(token);
            },
            type: "button",
            variant: "secondary",
          },
        ]}
      />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 微信读书用户信息卡片 */}
        {userInfo.value && (
          <div className="glass-card rounded-3xl shadow-xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-1">
                  <img
                    src={userInfo.value.avatarUrl || "/default-avatar.png"}
                    alt={userInfo.value.name}
                    className="w-full h-full rounded-full object-cover border-4 border-white"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA0OEM3MS43MzIgNDggNzggNTQuMjY4IDc4IDYyQzc4IDY5LjczMiA3MS43MzIgNzYgNjQgNzZDNTYuMjY4IDc2IDUwIDY5LjczMiA1MCA2MkM1MCA1NC4yNjggNTYuMjY4IDQ4IDY0IDQ4WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNjQgODRDNDcuNDMxIDg0IDM0IDk3LjQzMSAzNCAxMTRIMTRDMTQgODYuMzg2IDM1LjM4NiA2NSA2NCA2NVM5NCA4Ni4zODYgOTQgMTE0Vjg0WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
                    }}
                  />
                </div>
                {userInfo.value.isVip && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                    VIP
                  </div>
                )}
                {userInfo.value.medalInfo && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg" title={userInfo.value.medalInfo.desc}>
                      {userInfo.value.medalInfo.title}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                  {userInfo.value.name}
                </h1>
                {userInfo.value.signature && (
                  <p className="text-gray-600 text-lg mb-4 max-w-md">
                    "{userInfo.value.signature}"
                  </p>
                )}

                {/* 用户基本信息 */}
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      用户ID: {userInfo.value.vid}
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      {userInfo.value.gender === 1 ? '男' : userInfo.value.gender === 2 ? '女' : '未知'}
                    </span>
                    {userInfo.value.isVip && (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                        VIP用户
                      </span>
                    )}
                  </div>
                  
                  {userInfo.value.location && (
                    <div className="text-gray-500">
                      📍 {userInfo.value.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 成就徽章显示 */}
            {userInfo.value.medalInfo && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">当前成就</h3>
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">🏆</div>
                      <div>
                        <h4 className="font-bold text-purple-900">{userInfo.value.medalInfo.title}</h4>
                        <p className="text-sm text-purple-700">{userInfo.value.medalInfo.desc}</p>
                        <p className="text-xs text-purple-600">等级 {userInfo.value.medalInfo.level}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 现代化统计卡片 */}
        {userStats.value && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {PROFILE_STATS_CONFIG.map((card) => (
              <div
                key={card.key}
                className="glass-card rounded-2xl shadow-lg p-6 stat-card-hover transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.gradient} flex items-center justify-center text-white text-xl shadow-lg`}>
                    {card.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {card.title}
                    </p>
                    <p className={`text-2xl font-bold bg-gradient-to-r ${card.textGradient} bg-clip-text text-transparent`}>
                      {card.getValue(userStats.value)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {card.getSubValue(userStats.value)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 快速操作区域 */}
        <div className="glass-card rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">快速操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.key}
                className={`${action.color} text-white rounded-xl p-6 text-center hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
                onClick={() => {
                  // 实现对应的操作逻辑
                  switch(action.action) {
                    case 'my_shelf':
                      window.location.href = '/shelf';
                      break;
                    case 'search_books':
                      window.location.href = '/search';
                      break;
                  }
                }}
              >
                <div className="text-3xl mb-3">{action.icon}</div>
                <h4 className="font-semibold text-lg mb-2">{action.title}</h4>
                <p className="text-sm opacity-90">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 现代化 Tab 导航 */}
        <div className="glass-card rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-100">
            <nav className="flex">
              {PROFILE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => activeTab.value = tab.key}
                  className={`flex-1 py-4 px-2 border-b-2 font-medium text-sm transition-all duration-300 ${
                    activeTab.value === tab.key
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  title={tab.description}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-xs lg:text-sm">{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 书库 Tab - 去掉笔记 */}
            {activeTab.value === "library" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                    我的书库
                  </h3>
                  <p className="text-gray-600">管理您的图书收藏和阅读列表</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <a href="/shelf" className="glass-card rounded-xl p-6 hover:scale-105 transition-all duration-300 block">
                    <div className="text-center">
                      <div className="text-4xl mb-3">📚</div>
                      <h4 className="font-semibold text-gray-900 mb-2">我的书架</h4>
                      <p className="text-sm text-gray-600">查看和管理收藏的图书</p>
                    </div>
                  </a>
                  
                  <a href="/search" className="glass-card rounded-xl p-6 hover:scale-105 transition-all duration-300 block">
                    <div className="text-center">
                      <div className="text-4xl mb-3">🔍</div>
                      <h4 className="font-semibold text-gray-900 mb-2">发现图书</h4>
                      <p className="text-sm text-gray-600">探索和搜索新的好书</p>
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* 成就 Tab - 优化设计 */}
            {activeTab.value === "achievements" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-700 bg-clip-text text-transparent mb-2">
                    我的成就
                  </h3>
                  <p className="text-gray-600">解锁阅读成就，记录您的阅读里程碑</p>
                </div>

                {achievements.value.length > 0
                  ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {achievements.value.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`glass-card rounded-xl p-6 transition-all duration-300 ${
                            achievement.unlocked
                              ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg hover:scale-105"
                              : "opacity-60 hover:opacity-80"
                          }`}
                        >
                          <div className="text-center">
                            <div
                              className={`text-4xl mb-3 ${
                                achievement.unlocked
                                  ? ""
                                  : "grayscale opacity-50"
                              }`}
                            >
                              {achievement.icon}
                            </div>
                            <h4
                              className={`font-bold text-lg mb-2 ${
                                achievement.unlocked
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              {achievement.name}
                            </h4>
                            <p
                              className={`text-sm mb-3 ${
                                achievement.unlocked
                                  ? "text-gray-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {achievement.description}
                            </p>
                            {achievement.unlocked && achievement.unlockedTime && (
                              <p className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                                {new Date(achievement.unlockedTime).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                  : (
                    <div className="text-center py-16">
                      <div className="text-8xl mb-6">🏆</div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">暂无成就记录</h4>
                      <p className="text-gray-500 mb-6">继续阅读来解锁更多成就吧！</p>
                      <a
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-full font-medium hover:scale-105 transition-all duration-300 shadow-lg"
                      >
                        开始阅读
                      </a>
                    </div>
                  )}
              </div>
            )}

            {/* 目标 Tab - 优化设计 */}
            {activeTab.value === "goals" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent mb-2">
                      阅读目标
                    </h3>
                    <p className="text-gray-600">设置并跟踪您的阅读目标</p>
                  </div>
                  <button className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:scale-105 transition-all duration-300 shadow-lg">
                    + 设置新目标
                  </button>
                </div>

                {readingGoals.value.length > 0
                  ? (
                    <div className="space-y-6">
                      {readingGoals.value.map((goal) => (
                        <div
                          key={goal.goalId}
                          className="glass-card rounded-xl p-6 hover:scale-105 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-lg text-gray-900 flex items-center">
                              {goal.type === "time" && "⏱️"}
                              {goal.type === "books" && "📚"}
                              {goal.type === "pages" && "📄"}
                              {goal.type === "words" && "📝"}
                              <span className="ml-2">
                                {goal.type === "time" && "阅读时长目标"}
                                {goal.type === "books" && "阅读书籍目标"}
                                {goal.type === "pages" && "阅读页数目标"}
                                {goal.type === "words" && "阅读字数目标"}
                              </span>
                            </h4>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                goal.isCompleted
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {goal.isCompleted ? "✅ 已完成" : "🎯 进行中"}
                            </span>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                              <span>进度: {goal.current} / {goal.target}</span>
                              <span className="font-semibold">
                                {Math.round((goal.current / goal.target) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  goal.isCompleted
                                    ? "bg-gradient-to-r from-green-400 to-green-600"
                                    : "bg-gradient-to-r from-blue-400 to-blue-600"
                                }`}
                                style={{
                                  width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded-full">
                              {goal.period === "daily"
                                ? "📅 每日"
                                : goal.period === "weekly"
                                ? "📅 每周"
                                : goal.period === "monthly"
                                ? "📅 每月"
                                : "📅 每年"}目标
                            </span>
                            <span>{goal.startDate} - {goal.endDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                  : (
                    <div className="text-center py-16">
                      <div className="text-8xl mb-6">🎯</div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">暂无阅读目标</h4>
                      <p className="text-gray-500 mb-6">设置目标让您的阅读更有动力！</p>
                      <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-full font-medium hover:scale-105 transition-all duration-300 shadow-lg">
                        设置第一个目标
                      </button>
                    </div>
                  )}
              </div>
            )}

            {/* 设置 Tab - 简化为列表 */}
            {activeTab.value === "settings" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-2">
                    设置
                  </h3>
                  <p className="text-gray-600">管理您的个人偏好和应用设置</p>
                </div>

                {/* 设置列表 */}
                <div className="space-y-2">
                  {/* 个人信息 */}
                  <div className="glass-card rounded-xl">
                    <button className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">个人信息</h4>
                          <p className="text-sm text-gray-500">编辑昵称和个性签名</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* 隐私设置 */}
                  <div className="glass-card rounded-xl">
                    <button className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">🔒</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">隐私设置</h4>
                          <p className="text-sm text-gray-500">管理阅读动态和数据共享</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* 阅读偏好 */}
                  <div className="glass-card rounded-xl">
                    <button className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">📖</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">阅读偏好</h4>
                          <p className="text-sm text-gray-500">字体、主题和阅读设置</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* 通知设置 */}
                  <div className="glass-card rounded-xl">
                    <button className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">🔔</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">通知设置</h4>
                          <p className="text-sm text-gray-500">阅读提醒和推送通知</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* 账号管理 */}
                  <div className="glass-card rounded-xl">
                    <button className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">⚙️</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">账号管理</h4>
                          <p className="text-sm text-gray-500">登录状态和账号安全</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* 关于应用 */}
                  <div className="glass-card rounded-xl">
                    <button className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">ℹ️</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">关于应用</h4>
                          <p className="text-sm text-gray-500">版本信息和使用帮助</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 底部操作 */}
                <div className="pt-4">
                  <button 
                    onClick={handleLogout}
                    disabled={isLoggingOut.value}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 border ${
                      isLoggingOut.value
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-lg"
                    }`}
                  >
                    {isLoggingOut.value ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>正在退出...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>退出登录</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 底部导航 */}
      <BottomNavigation currentPath="/profile" />
      </div>
    </div>
  );
}
