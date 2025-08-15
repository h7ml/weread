import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import Navigation from "../components/Navigation.tsx";
import BottomNavigation from "../components/BottomNavigation.tsx";

// 统计卡片配置
const STATS_CARDS_CONFIG = [
  {
    key: "readingTime",
    title: "阅读时长",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    getValue: (stats) =>
      `${Math.floor((stats.total?.readingTime || 0) / 60)}分钟`,
  },
  {
    key: "booksCount",
    title: "阅读书籍",
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
    getValue: (stats) => `${stats.total?.booksCount || 0}本`,
  },
  {
    key: "readWords",
    title: "阅读字数",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
    getValue: (stats) =>
      `${((stats.total?.readWords || 0) / 10000).toFixed(1)}万字`,
  },
  {
    key: "daysCount",
    title: "连续阅读",
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
      />
    ),
    getValue: (stats) => `${stats.total?.daysCount || 0}天`,
  },
];

// Tab配置
const PROFILE_TABS = [
  { key: "overview", label: "概览", icon: "📊" },
  { key: "achievements", label: "成就", icon: "🏆" },
  { key: "goals", label: "目标", icon: "🎯" },
  { key: "settings", label: "设置", icon: "⚙️" },
];

// 本周统计卡片配置
const WEEKLY_STATS_CONFIG = [
  {
    key: "thisWeek",
    title: "本周阅读",
    colorFrom: "blue-50",
    colorTo: "blue-100",
    textColor: "blue-600",
    valueColor: "blue-900",
    icon: "📖",
    getValue: (stats, formatTime) =>
      formatTime(stats.thisWeek?.readingTime || 0),
  },
  {
    key: "today",
    title: "今日阅读",
    colorFrom: "green-50",
    colorTo: "green-100",
    textColor: "green-600",
    valueColor: "green-900",
    icon: "⏰",
    getValue: (stats, formatTime) => formatTime(stats.today?.readingTime || 0),
  },
  {
    key: "readWords",
    title: "阅读进度",
    colorFrom: "purple-50",
    colorTo: "purple-100",
    textColor: "purple-600",
    valueColor: "purple-900",
    icon: "📈",
    getValue: (stats) =>
      `${((stats.today?.readWords || 0) / 1000).toFixed(1)}k字`,
  },
];

export default function ProfileComponent() {
  const userInfo = useSignal(null);
  const userStats = useSignal(null);
  const achievements = useSignal([]);
  const readingGoals = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const activeTab = useSignal("overview");
  const isLoggedIn = useSignal(false);

  useEffect(() => {
    checkLoginAndLoadData();
  }, []);

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

      // 并行加载用户数据
      const [profileRes, statsRes, achievementsRes, goalsRes] = await Promise
        .all([
          fetch(`/api/user/profile?token=${token}`),
          fetch(`/api/user/stats?token=${token}`),
          fetch(`/api/user/achievements?token=${token}`),
          fetch(`/api/user/goals?token=${token}`),
        ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        userInfo.value = profileData.data;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        userStats.value = statsData.data;
      }

      if (achievementsRes.ok) {
        const achievementsData = await achievementsRes.json();
        achievements.value = achievementsData.data || [];
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        readingGoals.value = goalsData.data || [];
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
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 399px) {
              .profile-container {
                padding-bottom: 5rem !important;
              }
            }
          `
        }} />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 399px) {
            .profile-container {
              padding-bottom: 5rem !important;
            }
          }
        `
      }} />
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
              // loadProfileData();
            },
            type: "button",
            variant: "secondary",
          },
        ]}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 用户信息卡片 */}
        {userInfo.value && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={userInfo.value.avatarUrl || "/default-avatar.png"}
                  alt={userInfo.value.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
                {userInfo.value.isVip && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    VIP
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {userInfo.value.name}
                </h2>
                {userInfo.value.signature && (
                  <p className="text-gray-600 mb-3">
                    {userInfo.value.signature}
                  </p>
                )}

                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span>关注 {userInfo.value.followCount || 0}</span>
                  <span>粉丝 {userInfo.value.followerCount || 0}</span>
                  <span>好友 {userInfo.value.friendCount || 0}</span>
                  {userInfo.value.level && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Lv.{userInfo.value.level}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 阅读统计概览 */}
        {userStats.value && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {STATS_CARDS_CONFIG.map((card) => (
              <div
                key={card.key}
                className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6"
              >
                <div className="flex items-center">
                  <div className={`p-3 ${card.bgColor} rounded-lg`}>
                    <svg
                      className={`w-6 h-6 ${card.iconColor}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {card.icon}
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.getValue(userStats.value)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 导航 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {PROFILE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => activeTab.value = tab.key}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab.value === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 概览 Tab */}
            {activeTab.value === "overview" && userStats.value && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  本周阅读情况
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {WEEKLY_STATS_CONFIG.map((stat) => (
                    <div
                      key={stat.key}
                      className={`bg-gradient-to-r from-${stat.colorFrom} to-${stat.colorTo} rounded-lg p-4`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`${stat.textColor} text-sm font-medium`}
                          >
                            {stat.title}
                          </p>
                          <p
                            className={`text-2xl font-bold ${stat.valueColor}`}
                          >
                            {stat.getValue(userStats.value, formatTime)}
                          </p>
                        </div>
                        <div className="text-3xl">{stat.icon}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 成就 Tab */}
            {activeTab.value === "achievements" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  我的成就
                </h3>

                {achievements.value.length > 0
                  ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {achievements.value.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`p-4 rounded-lg border-2 ${
                            achievement.unlocked
                              ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`text-2xl ${
                                achievement.unlocked
                                  ? ""
                                  : "grayscale opacity-50"
                              }`}
                            >
                              {achievement.icon}
                            </div>
                            <div className="flex-1">
                              <h4
                                className={`font-medium ${
                                  achievement.unlocked
                                    ? "text-gray-900"
                                    : "text-gray-500"
                                }`}
                              >
                                {achievement.name}
                              </h4>
                              <p
                                className={`text-sm ${
                                  achievement.unlocked
                                    ? "text-gray-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {achievement.description}
                              </p>
                              {achievement.unlocked &&
                                achievement.unlockedTime && (
                                <p className="text-xs text-yellow-600 mt-1">
                                  {new Date(achievement.unlockedTime)
                                    .toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                  : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏆</div>
                      <p className="text-gray-500">暂无成就记录</p>
                      <p className="text-sm text-gray-400 mt-2">
                        继续阅读来解锁更多成就吧！
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* 目标 Tab */}
            {activeTab.value === "goals" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    阅读目标
                  </h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                    设置新目标
                  </button>
                </div>

                {readingGoals.value.length > 0
                  ? (
                    <div className="space-y-4">
                      {readingGoals.value.map((goal) => (
                        <div
                          key={goal.goalId}
                          className="bg-white rounded-lg border border-gray-200 p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">
                              {goal.type === "time" && "⏱️ 阅读时长目标"}
                              {goal.type === "books" && "📚 阅读书籍目标"}
                              {goal.type === "pages" && "📄 阅读页数目标"}
                              {goal.type === "words" && "📝 阅读字数目标"}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                goal.isCompleted
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {goal.isCompleted ? "已完成" : "进行中"}
                            </span>
                          </div>

                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                              <span>进度: {goal.current} / {goal.target}</span>
                              <span>
                                {Math.round(
                                  (goal.current / goal.target) * 100,
                                )}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  goal.isCompleted
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                }`}
                                style={{
                                  width: `${
                                    Math.min(
                                      (goal.current / goal.target) * 100,
                                      100,
                                    )
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {goal.period === "daily"
                                ? "每日"
                                : goal.period === "weekly"
                                ? "每周"
                                : goal.period === "monthly"
                                ? "每月"
                                : "每年"}目标
                            </span>
                            <span>{goal.startDate} - {goal.endDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                  : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎯</div>
                      <p className="text-gray-500">暂无阅读目标</p>
                      <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                        设置第一个目标
                      </button>
                    </div>
                  )}
              </div>
            )}

            {/* 设置 Tab */}
            {activeTab.value === "settings" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  账户设置
                </h3>

                <div className="space-y-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-medium text-gray-900 mb-2">个人信息</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          昵称
                        </label>
                        <input
                          type="text"
                          value={userInfo.value?.name || ""}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          个性签名
                        </label>
                        <textarea
                          value={userInfo.value?.signature || ""}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          rows={3}
                          placeholder="写下你的个性签名..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-medium text-gray-900 mb-2">隐私设置</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          公开阅读动态
                        </span>
                        <input type="checkbox" className="toggle" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          允许他人查看书架
                        </span>
                        <input type="checkbox" className="toggle" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          接收好友推荐
                        </span>
                        <input type="checkbox" className="toggle" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-red-200 p-4">
                    <h4 className="font-medium text-red-900 mb-2">危险操作</h4>
                    <div className="space-y-3">
                      <button className="w-full bg-red-50 text-red-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-red-100 border border-red-200">
                        清空阅读记录
                      </button>
                      <button className="w-full bg-red-50 text-red-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-red-100 border border-red-200">
                        删除所有笔记
                      </button>
                    </div>
                  </div>
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
