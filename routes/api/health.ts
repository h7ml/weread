/**
 * Health Check API - 健康状态检查
 *
 * @description 提供应用健康状态检查，用于Service Worker和监控
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

import { FreshContext } from "$fresh/server.ts";

export const handler = {
  GET(_req: Request, _ctx: FreshContext): Response {
    // 简单的健康检查
    const healthStatus = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Date.now(),
      version: "1.0.0"
    };

    return new Response(JSON.stringify(healthStatus), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  },
  
  HEAD(_req: Request, _ctx: FreshContext): Response {
    // HEAD 请求用于快速检查服务可用性
    return new Response(null, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  },
};