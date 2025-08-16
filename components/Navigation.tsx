import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { quickLogout } from "../utils/logout.ts";

interface NavigationProps {
  title: string;
  icon?: "home" | "search" | "shelf" | "book";
  showUser?: boolean;
  currentPath?: string;
  actions?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    type?: "button" | "link";
    variant?: "primary" | "secondary" | "danger";
    icon?: string;
  }>;
}

export default function Navigation({ title, icon = "home", showUser = false, currentPath, actions = [] }: NavigationProps) {
  const user = useSignal<{ name: string; vid: string; avatar?: string } | null>(null);
  const loading = useSignal(false);

  useEffect(() => {
    // 检查用户登录状态并获取用户信息
    if (showUser) {
      loadUserInfo();
    }
  }, [showUser]);

  const loadUserInfo = async () => {
    const token = localStorage.getItem("weread_token");
    const savedVid = localStorage.getItem("weread_vid");
    
    if (!token || !savedVid) {
      user.value = null;
      return;
    }

    // 首先从localStorage获取已缓存的用户信息
    const savedUser = localStorage.getItem("weread_user");
    const savedAvatar = localStorage.getItem("weread_avatar");
    
    if (savedUser) {
      user.value = {
        name: savedUser,
        vid: savedVid,
        avatar: savedAvatar || undefined,
      };
    }

    // 然后尝试从API获取最新的用户信息
    try {
      loading.value = true;
      const response = await fetch(`/api/user/weread?userVid=${savedVid}&skey=${token}&vid=${savedVid}`);
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.data && userData.data.transformed) {
          const userInfo = userData.data.transformed;
          const updatedUser = {
            name: userInfo.name || savedUser || "微信读书用户",
            vid: savedVid,
            avatar: userInfo.avatarUrl || savedAvatar || undefined,
          };
          
          user.value = updatedUser;
          
          // 更新localStorage
          localStorage.setItem("weread_user", updatedUser.name);
          if (updatedUser.avatar) {
            localStorage.setItem("weread_avatar", updatedUser.avatar);
          }
        }
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
      // 如果API调用失败，保持使用localStorage中的信息
    } finally {
      loading.value = false;
    }
  };

  // 获取当前路径
  const getCurrentPath = () => {
    if (currentPath) return currentPath;
    return globalThis.location?.pathname || "";
  };

  const activePath = getCurrentPath();

  // 图标映射
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "search":
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        );
      case "shelf":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        );
      case "book":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        );
      default: // home
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        );
    }
  };

  // 默认导航链接
  const defaultNavLinks = [
    { label: "首页", href: "/" },
    { label: "搜索书籍", href: "/search" },
    { label: "我的书架", href: "/shelf" },
  ];

  // 过滤掉与自定义actions重复的链接，但保留所有默认导航链接用于显示
  const navLinks = defaultNavLinks.filter(link => {
    // 过滤掉与自定义actions中href重复的链接
    const hasActionWithSameHref = actions.some(action => action.href === link.href);
    return !hasActionWithSameHref;
  });

  // 判断链接是否为激活状态
  const isActiveLink = (href: string) => {
    if (href === "/" && activePath === "/") return true;
    if (href !== "/" && activePath === href) return true;
    // 对于嵌套路径的判断，例如 /book/123 应该激活 /book
    if (href !== "/" && href !== "/search" && href !== "/shelf" && activePath.startsWith(href + "/")) return true;
    return false;
  };

  // 判断action是否为激活状态
  const isActiveAction = (action: any) => {
    if (!action.href) return false;
    return isActiveLink(action.href);
  };

  return (
    <>
      <nav className="nav-full-hide-mobile bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* 左侧品牌区域 */}
            <div className="flex items-center space-x-6">
              {/* Logo和标题 */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {getIcon(icon)}
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {title}
                </h1>
              </div>
              
              {/* 用户信息 - 只在PC端显示 */}
              {showUser && user.value && (
                <div className="nav-pc-only items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                  {user.value.avatar ? (
                    <img
                      src={user.value.avatar}
                      alt="用户头像"
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        // 如果头像加载失败，显示默认图标
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center ${user.value.avatar ? 'hidden' : ''}`}>
                    <svg
                      className="w-4 h-4 text-white"
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
                  <div className="text-gray-700">
                    <div className="text-xs text-gray-500">欢迎</div>
                    <div className="text-sm font-medium">{user.value.name}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧导航区域 - 只在PC端显示 */}
            <div className="nav-pc-only items-center space-x-1">
              {/* 默认导航链接 */}
              {navLinks.map((link) => {
                const isActive = isActiveLink(link.href);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 font-medium transition-colors rounded-md ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}

              {/* 自定义操作按钮 */}
              {actions.map((action, index) => {
                if (action.type === "link" || action.href) {
                  const isActive = isActiveAction(action);
                  return (
                    <a
                      key={index}
                      href={action.href}
                      className={`px-3 py-2 font-medium transition-colors rounded-md ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : action.variant === "primary"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : action.variant === "danger"
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {action.label}
                    </a>
                  );
                } else {
                  return (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={`p-2 font-medium transition-colors rounded-md ${
                        action.variant === "primary"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : action.variant === "danger"
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                      title={action.label}
                    >
                      {action.icon ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          dangerouslySetInnerHTML={{ __html: action.icon }}
                        />
                      ) : (
                        action.label
                      )}
                    </button>
                  );
                }
              })}

              {/* 退出按钮 */}
              {showUser && user.value && (
                <button
                  onClick={() => quickLogout()}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-md"
                  title="退出登录"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}