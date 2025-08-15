import {
  getLoginInfo,
  getLoginUid,
  getQRCodeUrl,
  initSession,
  webLogin,
} from "@/apis";
import { logger } from "@/utils";

/**
 * 处理SSE登录 - 真实的微信读书登录
 */
export async function handler(_req: Request): Promise<Response> {
  logger.info("=== WeRead SSE login endpoint called ===");

  try {
    // 设置SSE响应头
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const body = new ReadableStream({
      start: async (controller) => {
        logger.info("WeRead login process started");

        const encoder = new TextEncoder();
        let isClosed = false;
        let pollInterval: number | undefined;

        const safeClose = () => {
          if (!isClosed) {
            try {
              if (pollInterval) {
                clearInterval(pollInterval);
              }
              controller.close();
              isClosed = true;
            } catch (error) {
              logger.warn("Controller already closed:", error.message);
            }
          }
        };

        const sendEvent = (event: string, data: any) => {
          if (!isClosed) {
            try {
              const message = `event: ${event}\ndata: ${
                JSON.stringify(data)
              }\n\n`;
              controller.enqueue(encoder.encode(message));
              logger.debug(`Sent ${event} event:`, data);
            } catch (error) {
              logger.error(`Failed to send ${event} event:`, error);
            }
          }
        };

        try {
          // 1. 获取登录UID
          sendEvent("status", { message: "正在获取登录ID..." });
          const uid = await getLoginUid();
          logger.info("Got login UID:", uid);

          // 2. 生成二维码URL
          const qrUrl = getQRCodeUrl(uid);
          sendEvent("qrcode", { uid, url: qrUrl });
          logger.info("Generated QR code URL:", qrUrl);

          // 3. 开始轮询扫码状态
          sendEvent("status", { message: "请用微信扫描二维码登录..." });

          let pollCount = 0;
          const maxPolls = 60; // 2分钟超时 (60 * 2秒)

          pollInterval = setInterval(async () => {
            if (isClosed || pollCount >= maxPolls) {
              if (pollCount >= maxPolls) {
                sendEvent("error", { message: "二维码已过期，请重新获取" });
              }
              safeClose();
              return;
            }

            pollCount++;

            try {
              const loginInfo = await getLoginInfo(uid);
              logger.info(
                "Login info poll result (详细):",
                JSON.stringify(loginInfo, null, 2),
              );

              // 检查各种可能的登录成功条件
              if (loginInfo.userInfo) {
                sendEvent("status", { message: "登录成功，正在初始化会话..." });
                logger.info(
                  "User scanned and confirmed login:",
                  loginInfo.userInfo,
                );

                // 4. 完成登录
                const webLoginResult = await webLogin(loginInfo);
                logger.info("Web login completed:", webLoginResult);

                // 5. 初始化会话
                await initSession({
                  vid: webLoginResult.vid,
                  skey: webLoginResult.accessToken,
                  rt: webLoginResult.refreshToken,
                });
                logger.info("Session initialized successfully");

                // 6. 发送成功事件
                sendEvent("success", {
                  token: webLoginResult.accessToken,
                  name: webLoginResult.name,
                  vid: webLoginResult.vid,
                });

                // 延迟关闭连接
                setTimeout(safeClose, 1000);
                return;
              } else if (loginInfo.code || loginInfo.vid) {
                // 检查其他可能的登录成功标志
                sendEvent("status", { message: "检测到登录，正在处理..." });
                logger.info("Alternative login success detected:", loginInfo);

                try {
                  // 4. 完成登录
                  const webLoginResult = await webLogin(loginInfo);
                  logger.info("Web login completed:", webLoginResult);

                  // 准备用户信息，优先使用loginInfo中的数据
                  const userInfo = {
                    vid: loginInfo.vid || webLoginResult.vid,
                    skey: loginInfo.skey || webLoginResult.accessToken,
                    rt: loginInfo.rt || webLoginResult.refreshToken,
                    name: webLoginResult.name || "微信读书用户",
                  };

                  // 5. 初始化会话
                  await initSession({
                    vid: userInfo.vid,
                    skey: userInfo.skey,
                    rt: userInfo.rt,
                  });
                  logger.info("Session initialized successfully");

                  // 6. 存储用户信息到KV数据库
                  try {
                    const kv = await Deno.openKv();
                    await kv.set(["user", userInfo.vid.toString()], {
                      vid: userInfo.vid,
                      skey: userInfo.skey,
                      rt: userInfo.rt,
                      name: userInfo.name,
                      loginTime: new Date().toISOString(),
                      isActive: true,
                    });
                    logger.info(
                      "User info saved to KV database:",
                      userInfo.vid,
                    );
                  } catch (kvError) {
                    logger.error("Failed to save user info to KV:", kvError);
                  }

                  // 7. 发送成功事件
                  sendEvent("success", {
                    token: userInfo.skey,
                    name: userInfo.name,
                    vid: userInfo.vid,
                    message: "登录成功！正在跳转...",
                  });

                  // 延迟关闭连接
                  setTimeout(safeClose, 1000);
                  return;
                } catch (loginError) {
                  logger.error(
                    "Failed to complete login with alternative method:",
                    loginError,
                  );
                  // 继续轮询
                }
              }

              // 更新状态提示
              if (pollCount % 5 === 0) { // 每10秒更新一次状态（5 * 2秒）
                const remainingTime = Math.max(0, maxPolls - pollCount);
                sendEvent("status", {
                  message: `请扫描二维码登录 (${
                    Math.ceil((remainingTime * 2) / 60)
                  }:${String((remainingTime * 2) % 60).padStart(2, "0")})`,
                });
              }
            } catch (error) {
              logger.error("Error polling login status:", error);
              if (pollCount % 15 === 0) { // 每30秒报告一次错误（15 * 2秒）
                sendEvent("status", {
                  message: "检查登录状态时发生错误，正在重试...",
                });
              }
            }
          }, 2000); // 每2秒检查一次，减少轮询频率
        } catch (error) {
          logger.error("Error in WeRead login process:", error);
          sendEvent("error", {
            message: "登录过程中发生错误",
            detail: error.message,
          });
          safeClose();
        }
      },
      cancel() {
        logger.info("WeRead SSE connection cancelled");
      },
    });

    return new Response(body, { headers });
  } catch (error) {
    logger.error("=== WeRead SSE Handler Error ===", error);

    return new Response(
      JSON.stringify({
        error: "WeRead login failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
