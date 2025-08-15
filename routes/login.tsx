import { define } from "../utils.ts";
import LoginComponent from "../islands/LoginComponent.tsx";

export default define.page(function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 动态渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]">
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.3),transparent_50%)]">
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_70%,rgba(59,130,246,0.2),transparent_50%)]">
        </div>
      </div>

      {/* 动态粒子背景 */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-white/20 rounded-full animate-pulse`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen px-4 py-8">
        {/* 头部标题区域 */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="mb-6 relative">
            <div className="text-8xl animate-bounce-slow">📚</div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping">
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
              微信读书助手
            </span>
          </h1>
          <p className="text-blue-100/80 text-lg font-medium">
            智能阅读，轻松管理
          </p>
        </div>

        {/* 主登录卡片 - 使用 Island 组件 */}
        <LoginComponent />

        {/* 底部信息 */}
        <div className="text-center mt-8 animate-fadeIn animation-delay-500">
          <p className="text-white/60 text-sm">
            微信读书增强工具 · 让阅读更美好
          </p>
        </div>
      </div>

      {/* 自定义样式 */}
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5px); }
          50% { transform: translateY(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animation-delay-150 {
          animation-delay: 0.15s;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
      `}
      </style>
    </div>
  );
});
