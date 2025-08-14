/** @jsx h */
import { h } from "preact";
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

  // 在组件挂载时加载QRCode库
  useEffect(() => {
    console.log("Component mounted, checking QRCode library...");

    // 动态加载本地QRCode.js库
    if (typeof window !== "undefined" && !window.QRCode) {
      console.log("Loading QRCode library from /qrcode.min.js");
      const script = document.createElement("script");
      script.src = "/qrcode.min.js";
      script.async = false; // 同步加载确保库可用
      script.onload = () => {
        console.log("QRCode.js library loaded successfully");
        console.log("QRCode object:", typeof window.QRCode);
      };
      script.onerror = () => {
        console.error("Failed to load QRCode.js library from /qrcode.min.js");
      };
      document.head.appendChild(script);
    } else {
      console.log("QRCode library already available:", typeof window.QRCode);
    }

    // 清理函数 - 关闭EventSource连接
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

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
          if (window.QRCode && qrCodeRef.current) {
            console.log("Generating QR code with QRCode.js for URL:", url);
            qrCodeInstance.current = new window.QRCode(qrCodeRef.current, {
              text: url,
              width: 200,
              height: 200,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: window.QRCode?.CorrectLevel?.M || 2,
            });
          } else {
            // 如果库还未加载，等待一下再试
            const checkAndGenerate = (retries = 0) => {
              if (window.QRCode && qrCodeRef.current) {
                console.log("QRCode library ready, generating QR code");
                qrCodeInstance.current = new window.QRCode(qrCodeRef.current, {
                  text: url,
                  width: 200,
                  height: 200,
                  colorDark: "#000000",
                  colorLight: "#ffffff",
                  correctLevel: window.QRCode?.CorrectLevel?.M || 2,
                });
              } else if (retries < 10) {
                console.log(
                  `Waiting for QRCode library... retry ${retries + 1}/10`,
                );
                setTimeout(() => checkAndGenerate(retries + 1), 300);
              } else {
                console.warn(
                  "QRCode library not available, using backup solution",
                );
                // 使用备用方案
                if (qrCodeRef.current) {
                  const img = document.createElement("img");
                  img.src =
                    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${
                      encodeURIComponent(url)
                    }`;
                  img.alt = "登录二维码";
                  img.style.width = "200px";
                  img.style.height = "200px";
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
                encodeURIComponent(url)
              }`;
            img.alt = "登录二维码";
            img.style.width = "200px";
            img.style.height = "200px";
            qrCodeRef.current.appendChild(img);
          }
        }
      }, 100);
    }
  };

  // 开始登录流程
  const startLogin = () => {
    console.log("Starting WeRead login process...");
    console.log("Current loginStatus:", loginStatus.value);
    loginStatus.value = "loading";
    statusMessage.value = "正在连接服务器...";

    // 关闭之前的连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // 创建SSE连接
    const eventSource = new EventSource("/api/login/sse");
    eventSourceRef.current = eventSource;
    console.log("Created EventSource for /api/login/sse");

    // 监听状态更新事件
    eventSource.addEventListener("status", (event) => {
      console.log("Received status event:", event.data);
      const data = JSON.parse(event.data);
      statusMessage.value = data.message;
    });

    // 监听二维码事件
    eventSource.addEventListener("qrcode", (event) => {
      console.log("Received qrcode event:", event.data);
      const data = JSON.parse(event.data);
      qrCodeUrl.value = data.url;
      loginStatus.value = "waiting";
      statusMessage.value = "请用微信扫描二维码";

      // 生成二维码
      generateQRCode(data.url);
    });

    // 监听登录成功事件
    eventSource.addEventListener("success", (event) => {
      console.log("Login success:", event.data);
      const data = JSON.parse(event.data);
      userName.value = data.name || "微信读书用户";
      loginStatus.value = "success";
      statusMessage.value = "登录成功！";

      // 保存用户信息到localStorage
      localStorage.setItem("weread_token", data.token);
      localStorage.setItem("weread_vid", data.vid?.toString() || "");
      localStorage.setItem("weread_user", data.name || "");

      // 关闭连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // 跳转到首页（仪表板）
      setTimeout(() => {
        window.location.href = "/";
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
    eventSource.addEventListener("expired", (event) => {
      console.log("QR code expired:", event.data);
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
                  使用微信扫码快速登录<br />
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

              {/* 测试按钮 */}
              <button
                onClick={() => {
                  console.log("Test button clicked!");
                  alert(
                    "Test button works! Current status: " + loginStatus.value,
                  );
                }}
                className="w-full mt-3 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 font-medium py-2 px-4 rounded-xl transition-all duration-300 text-sm"
              >
                🔧 测试按钮 (点击测试)
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
                  <div className="w-56 h-56 bg-white rounded-3xl p-4 shadow-2xl mx-auto relative overflow-hidden">
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
                <p className="text-blue-100/70 text-sm mb-4">
                  {statusMessage.value || "打开微信扫一扫，扫描上方二维码"}
                </p>

                {/* 操作按钮组 */}
                <div className="space-y-3">
                  <button
                    onClick={retry}
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
    </div>
  );
}
