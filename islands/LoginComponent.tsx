import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

declare global {
  interface Window {
    QRCode: any;
  }
}

export default function LoginComponent() {
  const qrCodeUrl = useSignal("");
  const loginStatus = useSignal("initial"); // initial, loading, waiting, scanning, success, failed, expired
  const statusMessage = useSignal(""); // 状态消息
  const userName = useSignal("");
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const showLargeQR = useSignal(false); // 控制大图二维码显示
  const largeQRRef = useRef<HTMLDivElement>(null); // 大图二维码容器

  // 在组件挂载时加载QRCode库
  useEffect(() => {
    // 动态加载本地QRCode.js库
    if (typeof window !== "undefined" && !globalThis.QRCode) {
      const script = document.createElement("script");
      script.src = "/qrcode.min.js";
      script.async = false; // 同步加载确保库可用
      script.onerror = () => {
        console.error("Failed to load QRCode.js library from /qrcode.min.js");
      };
      document.head.appendChild(script);
    }

    // 清理函数 - 关闭EventSource连接
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // 生成大图二维码
  const generateLargeQRCode = (url: string) => {
    console.log("generateLargeQRCode called with URL:", url);
    if (!largeQRRef.current) {
      console.log("largeQRRef.current is null");
      return;
    }

    console.log("largeQRRef.current found, generating QR code");
    // 清空之前的二维码
    largeQRRef.current.innerHTML = "";

    try {
      if (globalThis.QRCode && largeQRRef.current) {
        console.log("Using QRCode library for large QR");
        // 生成更大的二维码，使用更小的尺寸以适应容器
        new globalThis.QRCode(largeQRRef.current, {
          text: url,
          width: 280,
          height: 280,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: globalThis.QRCode?.CorrectLevel?.H || 3, // 使用最高纠错等级
        });
        console.log("QRCode generated successfully");

        // 为大图二维码添加微信长按识别支持
        setTimeout(() => {
          const qrImage = largeQRRef.current?.querySelector("img");
          if (qrImage) {
            qrImage.setAttribute("data-qr-text", url);
            qrImage.setAttribute("data-miniprogram-type", "text");
            qrImage.style.userSelect = "none";
            qrImage.style.webkitUserSelect = "none";
            qrImage.style.webkitTouchCallout = "default";
            qrImage.style.webkitUserDrag = "none";
            // 确保图片可以长按
            qrImage.style.pointerEvents = "auto";
            qrImage.style.touchAction = "manipulation";
          }
        }, 100);
      } else {
        console.log("Using fallback QR generation for large QR");
        // 使用备用方案生成大图二维码
        const img = document.createElement("img");
        img.src =
          `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${
            encodeURIComponent(
              url,
            )
          }`;
        img.alt = "登录二维码（大图）";
        img.style.width = "280px";
        img.style.height = "280px";
        img.style.borderRadius = "8px";

        // 为备用二维码也添加微信支持
        img.setAttribute("data-qr-text", url);
        img.setAttribute("data-miniprogram-type", "text");
        img.style.userSelect = "none";
        img.style.webkitUserSelect = "none";
        img.style.webkitTouchCallout = "default";
        img.style.webkitUserDrag = "none";
        img.style.pointerEvents = "auto";
        img.style.touchAction = "manipulation";

        largeQRRef.current.appendChild(img);
      }
    } catch (error) {
      console.error("Error generating large QR code:", error);
      // 备用方案
      if (largeQRRef.current) {
        const img = document.createElement("img");
        img.src =
          `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${
            encodeURIComponent(
              url,
            )
          }`;
        img.alt = "登录二维码（大图）";
        img.style.width = "280px";
        img.style.height = "280px";
        img.style.borderRadius = "8px";

        img.setAttribute("data-qr-text", url);
        img.setAttribute("data-miniprogram-type", "text");
        img.style.userSelect = "none";
        img.style.webkitUserSelect = "none";
        img.style.webkitTouchCallout = "default";
        img.style.webkitUserDrag = "none";
        img.style.pointerEvents = "auto";
        img.style.touchAction = "manipulation";

        largeQRRef.current.appendChild(img);
      }
    }
  };

  // 显示大图二维码
  const showLargeQRCode = () => {
    console.log("showLargeQRCode called", {
      qrCodeUrl: qrCodeUrl.value,
      showLargeQR: showLargeQR.value,
    });
    if (qrCodeUrl.value) {
      showLargeQR.value = true;
      console.log("showLargeQR set to true");
      // 延迟生成，确保DOM已渲染
      setTimeout(() => {
        console.log("Generating large QR code");
        generateLargeQRCode(qrCodeUrl.value);
      }, 100);
    } else {
      console.log("No QR code URL available");
    }
  };

  // 隐藏大图二维码
  const hideLargeQRCode = () => {
    showLargeQR.value = false;
  };

  // 生成二维码
  const generateQRCode = (url: string) => {
    if (!qrCodeRef.current) {
      console.error("QRCode ref not ready, retrying...");
      // 等待DOM更新后重试
      setTimeout(() => generateQRCode(url), 200);
      return;
    }

    // 清空之前的二维码
    qrCodeRef.current.innerHTML = "";

    // 直接使用QRCode库生成
    if (typeof window !== "undefined") {
      // 使用setTimeout确保DOM已经准备好
      setTimeout(() => {
        try {
          if (globalThis.QRCode && qrCodeRef.current) {
            qrCodeInstance.current = new globalThis.QRCode(qrCodeRef.current, {
              text: url,
              width: 200,
              height: 200,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: globalThis.QRCode?.CorrectLevel?.M || 2,
            });

            // 为二维码添加微信长按识别支持
            const qrImage = qrCodeRef.current.querySelector("img");
            if (qrImage) {
              // 添加微信二维码识别相关属性
              qrImage.setAttribute("data-qr-text", url);
              qrImage.setAttribute("data-miniprogram-type", "text");
              qrImage.style.userSelect = "none";
              qrImage.style.webkitUserSelect = "none";
              qrImage.style.webkitTouchCallout = "default";
              qrImage.style.webkitUserDrag = "none";

              // 添加长按事件处理（针对微信浏览器）
              let longPressTimer: number;
              qrImage.addEventListener("touchstart", (e) => {
                longPressTimer = globalThis.setTimeout(() => {
                  // 在微信中触发长按菜单
                  e.preventDefault();
                }, 500);
              });

              qrImage.addEventListener("touchend", () => {
                if (longPressTimer) {
                  clearTimeout(longPressTimer);
                }
              });

              qrImage.addEventListener("touchmove", () => {
                if (longPressTimer) {
                  clearTimeout(longPressTimer);
                }
              });
            }
          } else {
            // 如果库还未加载，等待一下再试
            const checkAndGenerate = (retries = 0) => {
              if (globalThis.QRCode && qrCodeRef.current) {
                qrCodeInstance.current = new globalThis.QRCode(
                  qrCodeRef.current,
                  {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: globalThis.QRCode?.CorrectLevel?.M || 2,
                  },
                );

                // 为二维码添加微信长按识别支持
                const qrImage = qrCodeRef.current.querySelector("img");
                if (qrImage) {
                  qrImage.setAttribute("data-qr-text", url);
                  qrImage.setAttribute("data-miniprogram-type", "text");
                  qrImage.style.userSelect = "none";
                  qrImage.style.webkitUserSelect = "none";
                  qrImage.style.webkitTouchCallout = "default";
                  qrImage.style.webkitUserDrag = "none";
                }
              } else if (retries < 10) {
                setTimeout(() => checkAndGenerate(retries + 1), 300);
              } else {
                // 使用备用方案
                if (qrCodeRef.current) {
                  const img = document.createElement("img");
                  img.src =
                    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${
                      encodeURIComponent(
                        url,
                      )
                    }`;
                  img.alt = "登录二维码";
                  img.style.width = "200px";
                  img.style.height = "200px";

                  // 为备用二维码也添加微信支持
                  img.setAttribute("data-qr-text", url);
                  img.setAttribute("data-miniprogram-type", "text");
                  img.style.userSelect = "none";
                  img.style.webkitUserSelect = "none";
                  img.style.webkitTouchCallout = "default";
                  img.style.webkitUserDrag = "none";

                  qrCodeRef.current.appendChild(img);
                }
              }
            };
            checkAndGenerate();
          }
        } catch (error) {
          console.error("Error generating QR code:", error);
          // 备用方案
          if (qrCodeRef.current) {
            const img = document.createElement("img");
            img.src =
              `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${
                encodeURIComponent(
                  url,
                )
              }`;
            img.alt = "登录二维码";
            img.style.width = "200px";
            img.style.height = "200px";

            // 为备用二维码也添加微信支持
            img.setAttribute("data-qr-text", url);
            img.setAttribute("data-miniprogram-type", "text");
            img.style.userSelect = "none";
            img.style.webkitUserSelect = "none";
            img.style.webkitTouchCallout = "default";
            img.style.webkitUserDrag = "none";

            qrCodeRef.current.appendChild(img);
          }
        }
      }, 100);
    }
  };

  // 开始登录流程
  const startLogin = () => {
    loginStatus.value = "loading";
    statusMessage.value = "正在连接服务器...";

    // 关闭之前的连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // 创建SSE连接
    const eventSource = new EventSource("/api/login/sse");
    eventSourceRef.current = eventSource;

    // 监听状态更新事件
    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data);
      statusMessage.value = data.message;
    });

    // 监听二维码事件
    eventSource.addEventListener("qrcode", (event) => {
      const data = JSON.parse(event.data);
      qrCodeUrl.value = data.url;
      loginStatus.value = "waiting";
      statusMessage.value = "请用微信扫描二维码";

      // 生成二维码
      generateQRCode(data.url);
    });

    // 监听登录成功事件
    eventSource.addEventListener("success", async (event) => {
      const data = JSON.parse(event.data);
      
      // 保存基本登录信息
      localStorage.setItem("weread_token", data.token);
      localStorage.setItem("weread_vid", data.vid?.toString() || "");
      
      // 优先使用SSE返回的用户信息
      userName.value = data.name || "微信读书用户";
      localStorage.setItem("weread_user", data.name || "");
      
      // 如果SSE返回了avatar，直接使用
      if (data.avatar) {
        localStorage.setItem("weread_avatar", data.avatar);
      } else {
        // 如果没有avatar，尝试调用API获取
        try {
          const userResponse = await fetch(`/api/user/weread?userVid=${data.vid}&skey=${data.token}&vid=${data.vid}`);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.success && userData.data && userData.data.transformed) {
              const userInfo = userData.data.transformed;
              if (userInfo.avatarUrl) {
                localStorage.setItem("weread_avatar", userInfo.avatarUrl);
              }
              // 更新用户名为更准确的信息
              if (userInfo.name) {
                userName.value = userInfo.name;
                localStorage.setItem("weread_user", userInfo.name);
              }
            }
          }
        } catch (error) {
          console.warn("Failed to fetch additional user info:", error);
        }
      }
      
      loginStatus.value = "success";
      statusMessage.value = "登录成功！";

      // 关闭连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // 跳转到首页（仪表板）
      setTimeout(() => {
        globalThis.location.href = "/";
      }, 2000);
    });

    // 监听错误事件
    eventSource.addEventListener("error", (event) => {
      console.error("SSE error event:", event);
      const data = event.data ? JSON.parse(event.data) : {};
      loginStatus.value = "failed";
      statusMessage.value = data.message || "登录过程中发生错误";

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    });

    // 监听过期事件（如果有的话）
    eventSource.addEventListener("expired", (_event) => {
      loginStatus.value = "expired";
      statusMessage.value = "二维码已过期";

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    });

    // 连接错误处理
    eventSource.onerror = (error) => {
      console.error("EventSource connection error:", error);
      loginStatus.value = "failed";
      statusMessage.value = "连接服务器失败，请检查网络";

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  };

  // 重新登录
  const retry = () => {
    // 关闭之前的连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    qrCodeUrl.value = "";
    loginStatus.value = "initial";
    statusMessage.value = "";
    userName.value = "";

    if (qrCodeInstance.current) {
      qrCodeInstance.current = null;
    }

    // 清空二维码容器
    if (qrCodeRef.current) {
      qrCodeRef.current.innerHTML = "";
    }
  };

  // 刷新二维码（直接重新开始登录流程）
  const refreshQRCode = () => {
    // 关闭之前的连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // 清空当前二维码
    if (qrCodeRef.current) {
      qrCodeRef.current.innerHTML = "";
    }

    if (qrCodeInstance.current) {
      qrCodeInstance.current = null;
    }

    // 重新开始登录流程
    startLogin();
  };

  return (
    <div className="w-full max-w-md">
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20 relative overflow-hidden">
        {/* 卡片装饰元素 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full -translate-y-16 translate-x-16">
        </div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/20 to-violet-600/20 rounded-full translate-y-12 -translate-x-12">
        </div>

        <div className="relative z-10">
          {/* 初始状态 */}
          {loginStatus.value === "initial" && (
            <div className="text-center transform transition-all duration-500 animate-slideUp">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/10">
                  <svg
                    className="w-10 h-10 text-blue-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">安全登录</h3>
                <p className="text-blue-100/80 text-sm leading-relaxed">
                  使用微信扫码快速登录
                  <br />
                  安全便捷，一键即可
                </p>
              </div>

              <button
                onClick={startLogin}
                className="group w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000">
                </div>
                <div className="flex items-center justify-center space-x-3 relative z-10">
                  <svg
                    className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 16H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
                    />
                  </svg>
                  <span>开始登录</span>
                </div>
              </button>
            </div>
          )}

          {/* 加载中状态 */}
          {loginStatus.value === "loading" && (
            <div className="text-center transform transition-all duration-500">
              <div className="mb-8">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200/30">
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin">
                  </div>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm">
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  正在连接微信读书
                </h3>
                <p className="text-blue-100/70 text-sm">
                  {statusMessage.value || "正在初始化登录流程..."}
                </p>
              </div>
            </div>
          )}

          {/* 等待扫码状态 */}
          {loginStatus.value === "waiting" && (
            <div className="text-center transform transition-all duration-500">
              <div className="mb-8">
                {/* 二维码容器 */}
                <div className="relative mx-auto mb-6">
                  <div
                    className="w-56 h-56 bg-white rounded-3xl p-4 shadow-2xl mx-auto relative overflow-hidden cursor-pointer hover:shadow-3xl transition-shadow duration-300"
                    onClick={showLargeQRCode}
                    title="点击查看大图二维码"
                  >
                    {/* 二维码装饰边框 */}
                    <div className="absolute inset-2 rounded-2xl border-2 border-gray-100">
                    </div>
                    <div className="absolute top-2 left-2 w-6 h-6 border-l-4 border-t-4 border-blue-500 rounded-tl-lg">
                    </div>
                    <div className="absolute top-2 right-2 w-6 h-6 border-r-4 border-t-4 border-blue-500 rounded-tr-lg">
                    </div>
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-l-4 border-b-4 border-blue-500 rounded-bl-lg">
                    </div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-r-4 border-b-4 border-blue-500 rounded-br-lg">
                    </div>

                    {/* 放大镜图标提示 */}
                    <div className="absolute top-3 right-3 w-8 h-8 bg-blue-500/90 rounded-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    <div
                      ref={qrCodeRef}
                      className="w-full h-full flex items-center justify-center rounded-2xl"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin">
                        </div>
                        <div className="absolute inset-0 w-12 h-12 border-4 border-purple-300 border-b-transparent rounded-full animate-spin animation-delay-150">
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 扫码状态指示器 */}
                  <div
                    className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full items-center justify-center shadow-lg border-4 border-white hidden"
                    id="scan-indicator"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  请扫描二维码
                </h3>
                <p className="text-blue-100/70 text-sm mb-2">
                  {statusMessage.value || "打开微信扫一扫，扫描上方二维码"}
                </p>
                <p className="text-blue-100/50 text-xs mb-4">
                  💡 提示：点击二维码可查看大图，长按识别更容易
                </p>

                {/* 操作按钮组 */}
                <div className="space-y-3">
                  <button
                    onClick={refreshQRCode}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20 group"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>刷新二维码</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 登录成功状态 */}
          {loginStatus.value === "success" && (
            <div className="text-center transform transition-all duration-500">
              <div className="mb-8">
                {/* 用户头像或成功图标 */}
                {localStorage.getItem("weread_avatar") ? (
                  <div className="w-20 h-20 mx-auto mb-6 relative">
                    <img
                      src={localStorage.getItem("weread_avatar")}
                      alt="用户头像"
                      className="w-20 h-20 rounded-full object-cover border-4 border-green-400 shadow-lg"
                      onError={(e) => {
                        // 如果头像加载失败，显示默认的成功图标
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full items-center justify-center mx-auto animate-pulse hidden">
                      <svg
                        className="w-10 h-10 text-white animate-bounce"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    {/* 成功标识小圆点 */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <svg
                      className="w-10 h-10 text-white animate-bounce"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  登录成功！
                </h3>
                <p className="text-green-100 text-sm mb-2">
                  欢迎，{userName.value}
                </p>
                <p className="text-blue-100/70 text-sm">正在跳转到书架...</p>
              </div>

              {/* 进度条 */}
              <div className="w-full bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full animate-pulse w-full transition-all duration-2000">
                </div>
              </div>
            </div>
          )}

          {/* 登录失败状态 */}
          {loginStatus.value === "failed" && (
            <div className="text-center transform transition-all duration-500">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  登录失败
                </h3>
                <p className="text-red-100 text-sm mb-6">请重新尝试登录</p>
              </div>

              <button
                onClick={retry}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                重新登录
              </button>
            </div>
          )}

          {/* 二维码过期状态 */}
          {loginStatus.value === "expired" && (
            <div className="text-center transform transition-all duration-500">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  二维码已过期
                </h3>
                <p className="text-yellow-100 text-sm mb-6">请重新生成二维码</p>
              </div>

              <button
                onClick={retry}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                重新生成
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 大图二维码模态框 */}
      {showLargeQR.value && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={hideLargeQRCode}
        >
          {console.log("Rendering large QR modal")}
          <div
            className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-md mx-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={hideLargeQRCode}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl z-10"
              title="关闭大图"
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
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* 标题 */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                微信扫码登录
              </h3>
              <p className="text-gray-600 text-sm">大图二维码更便于长按识别</p>
            </div>

            {/* 大图二维码容器 */}
            <div className="flex justify-center mb-6">
              <div
                ref={largeQRRef}
                className="w-80 h-80 flex items-center justify-center bg-white rounded-xl p-4 shadow-lg border border-gray-200"
              >
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin">
                  </div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-purple-300 border-b-transparent rounded-full animate-spin animation-delay-150">
                  </div>
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="text-center">
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-blue-800 font-medium text-sm mb-1">
                      扫码提示
                    </p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      1. 打开微信，点击右上角 "+" 号<br />
                      2. 选择 "扫一扫" 功能
                      <br />
                      3. 对准二维码进行扫描
                      <br />
                      4. 在微信中确认登录
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-amber-800 font-medium text-sm mb-1">
                      长按识别
                    </p>
                    <p className="text-amber-700 text-xs leading-relaxed">
                      如果扫码有问题，可以长按二维码选择 "识别图中二维码" 功能
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          .animate-scaleIn {
            animation: scaleIn 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
}
