import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import Navigation from "../components/Navigation.tsx";
import BottomNavigation from "../components/BottomNavigation.tsx";

export default function DashboardComponent() {
  const loading = useSignal(false);
  const isLoggedIn = useSignal(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const token = localStorage.getItem("weread_token");
    if (!token) {
      isLoggedIn.value = false;
      return;
    }
    isLoggedIn.value = true;
  };

  // 未登录状态
  if (!isLoggedIn.value) {
    return (
      <>
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 399px) {
              .dashboard-container {
                padding-bottom: 5rem !important;
              }
            }
          `
        }} />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
          <div className="dashboard-container">
            <Navigation
              title="阅读统计"
              icon="home"
              showUser={false}
              currentPath="/dashboard"
            />
            
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-purple-600"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  查看阅读统计
                </h2>
                <p className="text-gray-600 mb-8">
                  登录后可查看详细的阅读数据、趋势分析和个人成就
                </p>
                <div className="space-y-4">
                  <a
                    href="/login"
                    className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
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
                    className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    返回首页
                  </a>
                </div>
              </div>
            </div>
            
            {/* 底部导航 */}
            <BottomNavigation currentPath="/dashboard" />
          </div>
        </div>
      </>
    );
  }

  // 登录状态 - 正在开发中页面
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 399px) {
            .dashboard-container {
              padding-bottom: 5rem !important;
            }
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .development-animation {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .gear-rotate {
            animation: rotate 3s linear infinite;
          }
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `
      }} />
      <div className="dashboard-container">
        <Navigation
          title="阅读统计"
          icon="home"
          showUser={true}
          currentPath="/dashboard"
        />

        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* 正在开发中的主要内容 */}
          <div className="text-center py-16">
            <div className="glass-card rounded-3xl shadow-xl p-12 mb-8">
              {/* 动画图标 */}
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                  <svg
                    className="w-16 h-16 text-white gear-rotate"
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
                {/* 装饰性圆环 */}
                <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-purple-200 rounded-full development-animation" />
                <div className="absolute inset-2 w-28 h-28 mx-auto border-2 border-blue-200 rounded-full development-animation" style={{animationDelay: '0.5s'}} />
              </div>

              {/* 标题和描述 */}
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-700 bg-clip-text text-transparent mb-4">
                统计功能开发中
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                我们正在为您打造全新的阅读统计体验，包含详细的数据分析、趋势图表和个人阅读报告
              </p>

              {/* 开发进度 */}
              <div className="max-w-md mx-auto mb-8">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>开发进度</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full transition-all duration-1000" style={{width: '75%'}} />
                </div>
              </div>

              {/* 预期功能 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card rounded-xl p-6">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-2">数据概览</h3>
                  <p className="text-sm text-gray-600">阅读时长、书籍数量等核心数据统计</p>
                </div>
                <div className="glass-card rounded-xl p-6">
                  <div className="text-3xl mb-3">📈</div>
                  <h3 className="font-semibold text-gray-900 mb-2">趋势分析</h3>
                  <p className="text-sm text-gray-600">阅读习惯趋势和热力图可视化</p>
                </div>
                <div className="glass-card rounded-xl p-6">
                  <div className="text-3xl mb-3">🏆</div>
                  <h3 className="font-semibold text-gray-900 mb-2">成就系统</h3>
                  <p className="text-sm text-gray-600">阅读成就和个人阅读报告</p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-blue-700 rounded-full hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  开始阅读
                </a>
                <a
                  href="/profile"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-purple-600 bg-purple-50 rounded-full hover:bg-purple-100 transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  个人中心
                </a>
              </div>
            </div>

            {/* 开发时间线 */}
            <div className="glass-card rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">开发时间线</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">基础框架 ✅</h3>
                    <p className="text-sm text-gray-600">页面结构和导航系统</p>
                  </div>
                  <span className="text-sm text-green-600 font-medium">已完成</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 development-animation" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">数据统计 🔄</h3>
                    <p className="text-sm text-gray-600">阅读数据收集和分析</p>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">进行中</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-gray-300 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-500">图表可视化 ⏳</h3>
                    <p className="text-sm text-gray-600">趋势图表和热力图</p>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">计划中</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-gray-300 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-500">个性化报告 ⏳</h3>
                    <p className="text-sm text-gray-600">智能分析和建议</p>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">计划中</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 底部导航 */}
        <BottomNavigation currentPath="/dashboard" />
      </div>
    </div>
  );
}
