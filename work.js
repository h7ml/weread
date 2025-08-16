/**
 * Cloudflare Worker 反代脚本
 * 反代目标: https://webook.deno.dev/
 * 生成时间: 2025年
 * 
 * 部署说明：
 * 1. 在 Cloudflare Dashboard 创建新的 Worker
 * 2. 复制此代码到 Worker 编辑器
 * 3. 配置自定义域名（可选）
 * 4. 部署
 */

// 目标域名配置
const TARGET_HOST = 'webook.deno.dev';
const TARGET_PROTOCOL = 'https';
const TARGET_URL = `${TARGET_PROTOCOL}://${TARGET_HOST}`;

// 安全配置
const ALLOWED_ORIGINS = [
  // 添加您允许的域名，* 表示允许所有域名
  '*'
];

// 安全防护配置
const SECURITY_CONFIG = {
  // 速率限制配置
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 120,
    REQUESTS_PER_HOUR: 2000,
    BAN_DURATION: 3600000, // 1小时封禁
  },
  
  // 可疑请求模式检测
  SUSPICIOUS_PATTERNS: [
    /\.\.\//g,                    // 路径遍历
    /<script[^>]*>/gi,            // XSS脚本
    /union\s+select/gi,           // SQL注入
    /exec\s*\(/gi,                // 代码执行
    /eval\s*\(/gi,                // 代码执行
    /javascript:/gi,              // JS协议
    /vbscript:/gi,                // VB脚本
    /data:[^;]*;base64/gi,        // Base64数据URI
    /\bwget\b|\bcurl\b|\bpython\b/gi, // 常见下载工具
  ],
  
  // 恶意User-Agent检测
  MALICIOUS_USER_AGENTS: [
    /sqlmap/gi,
    /nikto/gi,
    /masscan/gi,
    /nmap/gi,
    /dirb/gi,
    /dirbuster/gi,
    /gobuster/gi,
    /burpsuite/gi,
    /acunetix/gi,
    /nessus/gi,
  ],
  
  // 封禁的IP范围（示例）
  BLOCKED_IPS: new Set([
    // 添加需要封禁的IP
  ]),
};

// 微信环境优化配置
const WECHAT_CONFIG = {
  // 微信环境下的特殊User-Agent模式
  USER_AGENT_PATTERNS: [
    /MicroMessenger/i,
    /WeChat/i
  ],
  // 微信环境下的SSE连接超时配置
  SSE_TIMEOUT: 30000,
  // 微信环境下的Cookie优化
  COOKIE_OPTIMIZATION: true
};

// 检测微信浏览器的增强函数
function isWeChatEnvironment(userAgent) {
  if (!userAgent) return false;
  return WECHAT_CONFIG.USER_AGENT_PATTERNS.some(pattern => pattern.test(userAgent));
}

// 缓存配置
const CACHE_CONFIG = {
  // 静态资源缓存时间（秒）
  STATIC_CACHE_TTL: 86400, // 24小时
  // API请求缓存时间（秒）
  API_CACHE_TTL: 300, // 5分钟
  // HTML页面缓存时间（秒）
  HTML_CACHE_TTL: 3600, // 1小时
};

// 需要缓存的静态资源文件扩展名
const STATIC_EXTENSIONS = [
   'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 
  'ico', 'woff', 'woff2', 'ttf', 'otf', 'mp3', 'mp4', 'webm'
];

// Worker 主处理函数 - 使用现代语法
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 安全检查 - 防护措施
    const securityCheck = await performSecurityCheck(request);
    if (!securityCheck.allowed) {
      return createSecurityResponse(securityCheck.reason, request);
    }
    
    // 健康检查路由
    if (url.pathname === '/health' || url.pathname === '/_health') {
      return handleHealthCheck(request);
    }
    
    // 特殊处理SSE登录路径
    if (url.pathname === '/api/user/login') {
      return handleSSELogin(request, ctx);
    }
    
    return handleRequest(request, ctx);
  }
};

/**
 * 执行安全检查
 * @param {Request} request - 请求对象
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
async function performSecurityCheck(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  const clientIP = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown';
  
  console.log(`安全检查 - IP: ${clientIP}, UA: ${userAgent.substring(0, 100)}`);
  
  // 1. 检查封禁IP
  if (SECURITY_CONFIG.BLOCKED_IPS.has(clientIP)) {
    console.log(`🚫 封禁IP访问: ${clientIP}`);
    return { allowed: false, reason: 'IP_BLOCKED' };
  }
  
  // 2. 检查恶意User-Agent
  for (const pattern of SECURITY_CONFIG.MALICIOUS_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      console.log(`🚫 检测到扫描工具: ${userAgent}`);
      await logSecurityEvent('MALICIOUS_USER_AGENT', clientIP, userAgent);
      return { allowed: false, reason: 'SCANNER_DETECTED' };
    }
  }
  
  // 3. 检查可疑请求模式
  const fullUrl = request.url;
  const pathname = url.pathname;
  const searchParams = url.search;
  
  for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
    if (pattern.test(fullUrl) || pattern.test(pathname) || pattern.test(searchParams)) {
      console.log(`🚫 检测到可疑模式: ${pathname}${searchParams}`);
      await logSecurityEvent('SUSPICIOUS_PATTERN', clientIP, fullUrl);
      return { allowed: false, reason: 'SUSPICIOUS_REQUEST' };
    }
  }
  
  // 4. 速率限制检查
  const rateLimitCheck = await checkRateLimit(clientIP);
  if (!rateLimitCheck.allowed) {
    console.log(`🚫 速率限制触发: ${clientIP}`);
    return { allowed: false, reason: 'RATE_LIMITED' };
  }
  
  // 5. 检查请求体（如果有）
  if (request.method === 'POST' || request.method === 'PUT') {
    const bodyCheck = await checkRequestBody(request);
    if (!bodyCheck.allowed) {
      console.log(`🚫 请求体检查失败: ${bodyCheck.reason}`);
      return bodyCheck;
    }
  }
  
  return { allowed: true };
}

/**
 * 检查速率限制
 * @param {string} clientIP - 客户端IP
 * @returns {Promise<{allowed: boolean}>}
 */
async function checkRateLimit(clientIP) {
  // 这里实现基于内存的简单速率限制
  // 在生产环境中，建议使用Cloudflare KV存储
  
  const now = Date.now();
  const windowStart = now - 60000; // 1分钟窗口
  
  // 简化的内存存储（在Worker中重启会重置）
  if (!globalThis.rateLimitStore) {
    globalThis.rateLimitStore = new Map();
  }
  
  const requests = globalThis.rateLimitStore.get(clientIP) || [];
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= SECURITY_CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE) {
    return { allowed: false };
  }
  
  recentRequests.push(now);
  globalThis.rateLimitStore.set(clientIP, recentRequests);
  
  return { allowed: true };
}

/**
 * 检查请求体内容
 * @param {Request} request - 请求对象
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
async function checkRequestBody(request) {
  try {
    const body = await request.clone().text();
    
    // 检查请求体大小
    if (body.length > 1024 * 1024) { // 1MB限制
      return { allowed: false, reason: 'BODY_TOO_LARGE' };
    }
    
    // 检查可疑内容
    for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
      if (pattern.test(body)) {
        return { allowed: false, reason: 'MALICIOUS_PAYLOAD' };
      }
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('请求体检查错误:', error);
    return { allowed: true }; // 出错时允许通过，避免误拦截
  }
}

/**
 * 记录安全事件
 * @param {string} type - 事件类型
 * @param {string} clientIP - 客户端IP
 * @param {string} details - 详细信息
 */
async function logSecurityEvent(type, clientIP, details) {
  const event = {
    timestamp: new Date().toISOString(),
    type,
    clientIP,
    details: details.substring(0, 500), // 限制详情长度
  };
  
  console.log('🔒 安全事件:', JSON.stringify(event));
  
  // 这里可以添加到外部日志系统的逻辑
  // 例如发送到Webhook、存储到KV等
}

/**
 * 创建安全响应
 * @param {string} reason - 拒绝原因
 * @param {Request} request - 原始请求
 * @returns {Response}
 */
function createSecurityResponse(reason, request) {
  const messages = {
    'IP_BLOCKED': '访问被拒绝',
    'SCANNER_DETECTED': '检测到自动化工具',
    'SUSPICIOUS_REQUEST': '请求格式不正确',
    'RATE_LIMITED': '请求过于频繁，请稍后重试',
    'BODY_TOO_LARGE': '请求数据过大',
    'MALICIOUS_PAYLOAD': '请求内容不符合规范'
  };
  
  const message = messages[reason] || '访问被拒绝';
  
  // 对于API请求返回JSON，对于页面请求返回HTML
  const isApiRequest = new URL(request.url).pathname.startsWith('/api/');
  
  if (isApiRequest) {
    return new Response(JSON.stringify({
      error: message,
      code: reason,
      timestamp: new Date().toISOString()
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-Security-Block': reason,
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // 返回简洁的错误页面
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>访问被拒绝</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 500px; margin: 0 auto; }
        .error { color: #d32f2f; font-size: 18px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ 访问被拒绝</h1>
        <div class="error">${message}</div>
        <p>如果您认为这是错误，请联系管理员。</p>
    </div>
</body>
</html>`;
  
  return new Response(html, {
    status: 403,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'X-Security-Block': reason,
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * 专门处理SSE登录请求
 * @param {Request} request - 原始请求
 * @param {ExecutionContext} ctx - 执行上下文
 * @returns {Promise<Response>} - 处理后的响应
 */
async function handleSSELogin(request, ctx) {
  try {
    console.log('处理SSE登录请求:', request.url);
    
    const url = new URL(request.url);
    const targetUrl = `${TARGET_URL}${url.pathname}${url.search}`;
    
    // 检测是否是微信浏览器
    const userAgent = request.headers.get('User-Agent') || '';
    const isWeChatBrowser = isWeChatEnvironment(userAgent);
    console.log('SSE登录请求 - 微信环境:', isWeChatBrowser, '- UA片段:', userAgent.substring(0, 50));
    
    // 复制请求头，但做最小修改
    const headers = new Headers(request.headers);
    headers.set('Host', TARGET_HOST);
    
    // 保持原始的Accept头，这对SSE很重要
    if (!headers.has('Accept')) {
      headers.set('Accept', 'text/event-stream');
    }
    
    // 微信环境下的特殊处理
    if (isWeChatBrowser) {
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      // 微信环境特殊头部
      headers.set('X-Requested-With', 'XMLHttpRequest');
      // 微信浏览器兼容性头部
      headers.set('Connection', 'keep-alive');
      // 确保SSE连接稳定性
      headers.set('Keep-Alive', 'timeout=30');
    } else {
      headers.set('Cache-Control', 'no-cache');
    }
    
    console.log('转发SSE登录到:', targetUrl);
    console.log('请求头:', Object.fromEntries(headers.entries()));
    
    // 直接转发请求，不做额外处理
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });
    
    console.log('SSE响应状态:', response.status);
    console.log('SSE响应头:', Object.fromEntries(response.headers.entries()));
    
    // 检查是否是SSE响应
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/event-stream')) {
      console.log('确认SSE响应，处理URL替换，微信环境:', isWeChatBrowser);
      
      // 对于SSE响应，需要替换其中的URL
      const currentHost = new URL(request.url).hostname;
      
      // 创建一个转换流来处理SSE数据
      const { readable, writable } = new TransformStream({
        transform(chunk, controller) {
          try {
            // 将chunk转换为字符串
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let text = decoder.decode(chunk);
            
            // 替换SSE数据中的URL
            text = text.replace(
              new RegExp(`https?://${TARGET_HOST.replace('.', '\\.')}`, 'g'),
              `https://${currentHost}`
            );
            
            console.log('SSE数据处理:', text);
            
            // 重新编码并传递
            controller.enqueue(encoder.encode(text));
            
            // 检查是否是关闭事件，延迟终止让数据先传递
            if (text.includes('event: close') || text.includes('data: close')) {
              console.log('检测到SSE关闭事件，准备结束流');
              setTimeout(() => {
                try {
                  controller.terminate();
                } catch (e) {
                  // 流可能已经关闭，忽略错误
                }
              }, 100);
            }
          } catch (error) {
            console.error('SSE数据处理错误:', error);
            controller.error(error);
          }
        },
        flush(controller) {
          console.log('SSE流处理完成');
          try {
            controller.terminate();
          } catch (e) {
            // 流可能已经关闭，忽略错误
          }
        }
      });
      
      // 使用转换流处理响应体，添加错误处理
      response.body.pipeTo(writable).catch(error => {
        console.error('SSE流传输错误:', error);
      });
      
      const sseHeaders = new Headers(response.headers);
      
      // 微信环境下更严格的CORS设置
      if (isWeChatBrowser) {
        const origin = request.headers.get('Origin') || `https://${new URL(request.url).hostname}`;
        sseHeaders.set('Access-Control-Allow-Origin', origin);
        sseHeaders.set('Access-Control-Allow-Credentials', 'true');
        // 微信环境下添加更多允许的头部
        sseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, token, X-Requested-With, Cache-Control');
        sseHeaders.set('Access-Control-Expose-Headers', 'Set-Cookie');
      } else {
        sseHeaders.set('Access-Control-Allow-Origin', '*');
      }
      
      sseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      // 微信环境已设置，避免重复
      if (!isWeChatBrowser) {
        sseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, token, X-Requested-With');
      }
      sseHeaders.set('Access-Control-Max-Age', '86400');
      
      // 确保SSE头部正确
      sseHeaders.set('Content-Type', 'text/event-stream; charset=utf-8');
      sseHeaders.set('Cache-Control', 'no-cache');
      sseHeaders.set('Connection', 'keep-alive');
      
      // 微信特殊头部
      if (isWeChatBrowser) {
        sseHeaders.set('X-Accel-Buffering', 'no');
        // 微信环境下不设置Transfer-Encoding: chunked，可能导致问题
        sseHeaders.delete('Transfer-Encoding');
        sseHeaders.set('Keep-Alive', 'timeout=30, max=100');
        
        // 创建带超时控制的微信响应
        const createWeChatResponse = () => {
          return new Response(readable, {
            status: response.status,
            statusText: response.statusText,
            headers: sseHeaders,
          });
        };
        
        // 为微信环境添加超时保护
        const timeoutId = setTimeout(() => {
          console.log('微信SSE连接超时保护触发');
        }, WECHAT_CONFIG.SSE_TIMEOUT);
        
        return createWeChatResponse();
      }
      
      return new Response(readable, {
        status: response.status,
        statusText: response.statusText,
        headers: sseHeaders,
      });
    }
    
    // 如果不是SSE响应，按正常方式处理
    return modifyResponse(response, request);
    
  } catch (error) {
    console.error('SSE登录处理错误:', error);
    
    return new Response(JSON.stringify({
      error: 'SSE登录处理失败',
      message: error.message,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('User-Agent')
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

/**
 * 主请求处理函数
 * @param {Request} request - 原始请求
 * @param {ExecutionContext} ctx - 执行上下文
 * @returns {Promise<Response>} - 处理后的响应
 */
async function handleRequest(request, ctx) {
  try {
    // 解析请求URL
    const url = new URL(request.url);
    
    // 构建目标URL
    const targetUrl = `${TARGET_URL}${url.pathname}${url.search}`;
    
    // 检查缓存
    const cache = caches.default;
    const cacheKey = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
    });
    
    // 尝试从缓存获取响应（仅对GET请求）
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        console.log('Cache hit for:', targetUrl);
        return addCorsHeaders(cachedResponse, request);
      }
    }
    
    // 创建新的请求
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: modifyRequestHeaders(request.headers, url.hostname),
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });
    
    // 发送请求到目标服务器
    console.log('Proxying request to:', targetUrl);
    const response = await fetch(modifiedRequest);
    
    // 修改响应
    const modifiedResponse = await modifyResponse(response, request);
    
    // 缓存响应（仅对成功的GET请求）
    if (request.method === 'GET' && response.ok) {
      const cacheResponse = modifiedResponse.clone();
      const cacheTTL = getCacheTTL(url.pathname, response.headers);
      
      if (cacheTTL > 0) {
        // 添加缓存控制头
        const cacheHeaders = new Headers(cacheResponse.headers);
        cacheHeaders.set('Cache-Control', `public, max-age=${cacheTTL}`);
        cacheHeaders.set('CF-Cache-Status', 'MISS');
        
        const responseToCache = new Response(cacheResponse.body, {
          status: cacheResponse.status,
          statusText: cacheResponse.statusText,
          headers: cacheHeaders
        });
        
        // 异步缓存，不阻塞响应
        ctx.waitUntil(cache.put(cacheKey, responseToCache));
        console.log('Cached response for:', targetUrl, 'TTL:', cacheTTL);
      }
    }
    
    return modifiedResponse;
    
  } catch (error) {
    console.error('Worker error:', error);
    
    // 返回错误页面
    return new Response(generateErrorPage(error), {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

/**
 * 修改请求头
 * @param {Headers} headers - 原始请求头
 * @param {string} hostname - 当前主机名
 * @returns {Headers} - 修改后的请求头
 */
function modifyRequestHeaders(headers, hostname) {
  const modifiedHeaders = new Headers(headers);
  
  // 修改Host头
  modifiedHeaders.set('Host', TARGET_HOST);
  
  // 修改Referer（如果存在）
  if (modifiedHeaders.has('Referer')) {
    const referer = modifiedHeaders.get('Referer');
    const newReferer = referer.replace(hostname, TARGET_HOST);
    modifiedHeaders.set('Referer', newReferer);
  }
  
  // 修改Origin（如果存在）
  if (modifiedHeaders.has('Origin')) {
    modifiedHeaders.set('Origin', TARGET_URL);
  }
  
  // 关键修复：处理 Cookie 头部，将当前域名的cookie映射到目标域名
  if (modifiedHeaders.has('Cookie')) {
    let cookieValue = modifiedHeaders.get('Cookie');
    console.log('原始Cookie:', cookieValue);
    
    // 这里Cookie值本身不需要修改，因为Cookie的值是独立于域名的
    // 浏览器会自动发送适合当前域名的Cookie
    modifiedHeaders.set('Cookie', cookieValue);
  }
  
  // 添加真实IP头（如果需要）
  const realIp = headers.get('CF-Connecting-IP');
  if (realIp) {
    modifiedHeaders.set('X-Real-IP', realIp);
    modifiedHeaders.set('X-Forwarded-For', realIp);
  }
  
  // 添加协议头
  modifiedHeaders.set('X-Forwarded-Proto', 'https');
  
  // 添加用户代理转发（保持原样）
  if (headers.has('User-Agent')) {
    modifiedHeaders.set('User-Agent', headers.get('User-Agent'));
  }
  
  // 添加自定义头部，告诉后端实际的访问域名
  modifiedHeaders.set('X-Original-Host', hostname);
  modifiedHeaders.set('X-Forwarded-Host', hostname);
  
  return modifiedHeaders;
}

/**
 * 修改响应
 * @param {Response} response - 原始响应
 * @param {Request} request - 原始请求
 * @returns {Promise<Response>} - 修改后的响应
 */
async function modifyResponse(response, request) {
  const contentType = response.headers.get('Content-Type') || '';
  
  // 处理 SSE (Server-Sent Events) 连接 - 关键修复
  if (contentType.includes('text/event-stream') || 
      contentType.includes('application/x-ndjson') ||
      request.headers.get('Accept') === 'text/event-stream') {
    console.log('检测到SSE连接，直接透传');
    
    // SSE连接需要直接透传，不能修改内容
    const modifiedHeaders = new Headers(response.headers);
    
    // 确保SSE相关头部正确设置
    modifiedHeaders.set('Cache-Control', 'no-cache');
    modifiedHeaders.set('Connection', 'keep-alive');
    modifiedHeaders.set('Content-Type', 'text/event-stream');
    
    const sseResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: modifiedHeaders,
    });
    
    return addCorsHeaders(sseResponse, request);
  }
  
  // 对HTML内容进行替换处理
  if (contentType.includes('text/html')) {
    let html = await response.text();
    
    // 替换HTML中的绝对URL引用
    const currentHost = new URL(request.url).hostname;
    html = html.replace(
      new RegExp(`https?://${TARGET_HOST.replace('.', '\\.')}`, 'g'),
      `https://${currentHost}`
    );
    
    // 添加性能优化和安全头
    const modifiedHeaders = new Headers(response.headers);
    
    // 强化安全头
    modifiedHeaders.set('X-Frame-Options', 'DENY');
    modifiedHeaders.set('X-Content-Type-Options', 'nosniff');
    modifiedHeaders.set('X-XSS-Protection', '1; mode=block');
    modifiedHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    modifiedHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // CSP (内容安全策略)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' wss: https:",
      "frame-ancestors 'none'"
    ].join('; ');
    modifiedHeaders.set('Content-Security-Policy', csp);
    
    // 防止点击劫持
    modifiedHeaders.set('X-Permitted-Cross-Domain-Policies', 'none');
    
    // 移除可能泄露信息的头部
    modifiedHeaders.delete('Server');
    modifiedHeaders.delete('X-Powered-By');
    
    // 处理 Set-Cookie 头，修改域名
    const setCookieHeaders = [];
    for (const [name, value] of response.headers.entries()) {
      if (name.toLowerCase() === 'set-cookie') {
        // 修改 Cookie 域名以匹配当前域名
        let modifiedCookie = value;
        
        // 移除或修改 Domain 属性
        modifiedCookie = modifiedCookie.replace(
          new RegExp(`Domain=${TARGET_HOST.replace('.', '\\.')}`, 'gi'),
          `Domain=${currentHost}`
        ).replace(
          new RegExp(`domain=${TARGET_HOST.replace('.', '\\.')}`, 'gi'),
          `domain=${currentHost}`
        );
        
        // 如果没有显式的 Domain，确保 Cookie 在当前域名下工作
        if (!/domain=/i.test(modifiedCookie)) {
          // 对于没有 domain 的 cookie，浏览器会自动使用当前域名
          // 无需额外处理
        }
        
        setCookieHeaders.push(modifiedCookie);
      }
    }
    
    // 移除原来的 set-cookie 头并添加修改后的
    modifiedHeaders.delete('set-cookie');
    setCookieHeaders.forEach(cookie => {
      modifiedHeaders.append('set-cookie', cookie);
    });
    
    const modifiedResponse = new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: modifiedHeaders,
    });
    
    return addCorsHeaders(modifiedResponse, request);
  }
  
  // 对CSS内容进行URL替换
  if (contentType.includes('text/css')) {
    let css = await response.text();
    const currentHost = new URL(request.url).hostname;
    css = css.replace(
      new RegExp(`https?://${TARGET_HOST.replace('.', '\\.')}`, 'g'),
      `https://${currentHost}`
    );
    
    const modifiedResponse = new Response(css, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    
    return addCorsHeaders(modifiedResponse, request);
  }
  
  // 其他类型直接返回，但要处理Cookie
  const modifiedHeaders = new Headers(response.headers);
  
  // 关键修复：处理所有响应的Set-Cookie头
  const currentHost = new URL(request.url).hostname;
  const userAgent = request.headers.get('User-Agent') || '';
  const isWeChatBrowser = /MicroMessenger/i.test(userAgent);
  const setCookieHeaders = [];
  
  console.log('处理Cookie，微信环境:', isWeChatBrowser);
  
  for (const [name, value] of response.headers.entries()) {
    if (name.toLowerCase() === 'set-cookie') {
      let modifiedCookie = value;
      
      // 移除或修改 Domain 属性，让Cookie适用于当前域名
      modifiedCookie = modifiedCookie.replace(
        new RegExp(`[;\\s]*Domain\\s*=\\s*[^;\\s]*${TARGET_HOST.replace('.', '\\.')}[^;\\s]*`, 'gi'),
        ''
      ).replace(
        new RegExp(`[;\\s]*domain\\s*=\\s*[^;\\s]*${TARGET_HOST.replace('.', '\\.')}[^;\\s]*`, 'gi'),
        ''
      );
      
      // 微信环境下的特殊Cookie处理
      if (isWeChatBrowser) {
        // 确保路径正确
        if (!/[;\\s]path\\s*=/i.test(modifiedCookie)) {
          modifiedCookie += '; Path=/';
        }
        
        // 微信环境下移除可能有问题的属性
        modifiedCookie = modifiedCookie.replace(/[;\\s]*SameSite\\s*=\\s*[^;]*/gi, '');
        
        // 微信环境下Cookie安全性设置
        if (currentHost.includes('linuxcloudlab.com')) {
          // 在HTTPS环境下添加Secure，但不要求太严格
          if (!modifiedCookie.includes('Secure') && !modifiedCookie.includes('secure')) {
            modifiedCookie += '; Secure';
          }
        }
        
        // 微信环境下确保HttpOnly不会阻止前端使用
        if (modifiedCookie.includes('HttpOnly') || modifiedCookie.includes('httponly')) {
          // 对于登录相关的cookie，移除HttpOnly以确保前端可以访问
          if (modifiedCookie.toLowerCase().includes('token') || 
              modifiedCookie.toLowerCase().includes('session') ||
              modifiedCookie.toLowerCase().includes('auth')) {
            modifiedCookie = modifiedCookie.replace(/[;\\s]*HttpOnly[^;]*/gi, '');
            modifiedCookie = modifiedCookie.replace(/[;\\s]*httponly[^;]*/gi, '');
          }
        }
      } else {
        // 非微信环境的标准处理
        if (!/[;\\s]path\\s*=/i.test(modifiedCookie)) {
          modifiedCookie += '; Path=/';
        }
      }
      
      console.log('Cookie转换 (微信:', isWeChatBrowser, '):', value, '=>', modifiedCookie);
      setCookieHeaders.push(modifiedCookie);
    }
  }
  
  // 更新Cookie头
  if (setCookieHeaders.length > 0) {
    modifiedHeaders.delete('set-cookie');
    setCookieHeaders.forEach(cookie => {
      modifiedHeaders.append('set-cookie', cookie);
    });
  }
  
  const finalResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: modifiedHeaders,
  });
  
  return addCorsHeaders(finalResponse, request);
}

/**
 * 添加CORS头
 * @param {Response} response - 响应对象
 * @param {Request} request - 请求对象
 * @returns {Response} - 添加CORS头后的响应
 */
function addCorsHeaders(response, request) {
  const modifiedHeaders = new Headers(response.headers);
  const origin = request.headers.get('Origin');
  
  // 设置CORS头
  if (origin && isOriginAllowed(origin)) {
    modifiedHeaders.set('Access-Control-Allow-Origin', origin);
  } else if (ALLOWED_ORIGINS.includes('*')) {
    modifiedHeaders.set('Access-Control-Allow-Origin', '*');
  }
  
  modifiedHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  modifiedHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, token');
  modifiedHeaders.set('Access-Control-Allow-Credentials', 'true');
  modifiedHeaders.set('Access-Control-Max-Age', '86400');
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: modifiedHeaders,
    });
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: modifiedHeaders,
  });
}

/**
 * 检查Origin是否被允许
 * @param {string} origin - 请求的Origin
 * @returns {boolean} - 是否允许
 */
function isOriginAllowed(origin) {
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed === '*') return true;
    if (allowed === origin) return true;
    // 支持通配符子域名
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2);
      return origin.endsWith('.' + domain) || origin === domain;
    }
    return false;
  });
}

/**
 * 获取缓存TTL
 * @param {string} pathname - 请求路径
 * @param {Headers} headers - 响应头
 * @returns {number} - 缓存时间（秒）
 */
function getCacheTTL(pathname, headers) {
  // 检查响应头中的缓存控制
  const cacheControl = headers.get('Cache-Control');
  if (cacheControl && cacheControl.includes('no-cache')) {
    return 0;
  }
  
  // 检查是否是SSE连接
  const contentType = headers.get('Content-Type') || '';
  if (contentType.includes('text/event-stream') || 
      contentType.includes('application/x-ndjson')) {
    console.log('SSE连接，不缓存');
    return 0; // SSE连接永远不缓存
  }
  
  // 特殊路径不缓存（登录相关）
  if (pathname.includes('/login') || 
      pathname.includes('/auth') ||
      pathname.includes('/api/login') ||
      pathname.includes('/api/auth') ||
      pathname.includes('/api/user/login') ||
      pathname === '/api/user/login' ||  // 精确匹配SSE登录路径
      pathname.includes('sse') ||  // 任何包含sse的路径
      pathname.includes('stream') ||  // 任何包含stream的路径
      pathname.includes('/api/user/')) { // 用户相关API都不缓存
    console.log('登录或流相关路径，不缓存:', pathname);
    return 0;
  }
  
  // 根据文件扩展名确定缓存时间
  const extension = pathname.split('.').pop()?.toLowerCase();
  
  if (STATIC_EXTENSIONS.includes(extension)) {
    return CACHE_CONFIG.STATIC_CACHE_TTL;
  }
  
  // API请求缓存时间缩短
  if (pathname.startsWith('/api/')) {
    return CACHE_CONFIG.API_CACHE_TTL;
  }
  
  if (pathname.endsWith('.html') || pathname === '/' || !extension) {
    return CACHE_CONFIG.HTML_CACHE_TTL;
  }
  
  return 0; // 默认不缓存
}

/**
 * 生成错误页面
 * @param {Error} error - 错误对象
 * @returns {string} - HTML错误页面
 */
function generateErrorPage(error) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>服务暂时不可用</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .error-container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            margin: 1rem;
        }
        .error-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .error-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #e74c3c;
        }
        .error-message {
            color: #666;
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }
        .retry-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            transition: background 0.2s;
        }
        .retry-btn:hover {
            background: #5a67d8;
        }
        .error-details {
            margin-top: 1rem;
            font-size: 0.875rem;
            color: #888;
            border-top: 1px solid #eee;
            padding-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <div class="error-title">服务暂时不可用</div>
        <div class="error-message">
            抱歉，服务器遇到了一些问题。请稍后重试，或联系管理员。
        </div>
        <button class="retry-btn" onclick="location.reload()">重新加载</button>
        <div class="error-details">
            错误信息: ${error.message}
            <br>
            时间: ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * 处理健康检查请求
 * @param {Request} request - 请求对象
 * @returns {Response} - 健康检查响应
 */
function handleHealthCheck(request) {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    target: TARGET_URL,
    worker: 'webook-proxy',
    version: '1.0.0'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
