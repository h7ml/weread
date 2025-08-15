/**
 * 退出登录工具函数
 * 统一处理退出登录逻辑，包括清除本地存储和服务端会话
 */

export interface LogoutOptions {
  showConfirm?: boolean;
  redirectTo?: string;
  silent?: boolean;
}

export async function logout(options: LogoutOptions = {}) {
  const {
    showConfirm = true,
    redirectTo = "/login", 
    silent = false
  } = options;

  // 显示确认对话框
  if (showConfirm && !silent) {
    const confirmed = globalThis.confirm(
      "确定要退出登录吗？\n\n退出后您需要重新扫码登录才能访问个人数据。"
    );
    
    if (!confirmed) return false;
  }

  try {
    // 获取当前token
    const token = localStorage.getItem("weread_token");
    
    // 调用退出登录API
    if (token) {
      try {
        const response = await fetch(`/api/logout?token=${encodeURIComponent(token)}`);
        const result = await response.json();
        
        if (result.success) {
          console.log("Server logout successful:", result.message);
        } else {
          console.warn("Server logout failed:", result.error);
        }
      } catch (apiError) {
        console.warn("API logout failed:", apiError);
        // 继续执行客户端清除，不阻塞登出过程
      }
    }
    
    // 清除所有本地存储的用户数据
    const keysToRemove = [
      "weread_token",
      "weread_vid", 
      "weread_user",
      "weread_avatar",
      "weread_user_data",
      "weread_credentials",
      "weread_session"
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log("Logout completed successfully");
    
    // 显示成功消息
    if (!silent) {
      alert("退出登录成功！");
    }
    
    // 跳转到指定页面
    if (redirectTo) {
      globalThis.location.href = redirectTo;
    }
    
    return true;
    
  } catch (err) {
    console.error("Logout error:", err);
    if (!silent) {
      alert("退出登录时发生错误，请刷新页面重试。");
    }
    return false;
  }
}

/**
 * 快速退出登录（不显示确认对话框）
 */
export async function quickLogout(redirectTo = "/login") {
  return logout({
    showConfirm: false,
    redirectTo,
    silent: true
  });
}