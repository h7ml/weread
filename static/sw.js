/**
 * Service Worker - PWA 缓存和离线支持
 *
 * @description 提供应用缓存、离线支持和后台同步功能
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

const CACHE_NAME = 'weread-v1.0.0';
const STATIC_CACHE = 'weread-static-v1.0.0';
const DYNAMIC_CACHE = 'weread-dynamic-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/styles.css',
  '/reader.css',
  '/weread-reader.css',
  '/logo.svg',
  '/manifest.json',
  '/offline.html',
  // 图标文件（如果存在）
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// 需要动态缓存的路径模式 - 仅缓存必要的静态API
const CACHE_PATTERNS = [
  /^\/api\/book\/info/,
  /^\/api\/book\/chapters/
];

// 不需要缓存的路径模式 - 扩大不缓存范围
const NO_CACHE_PATTERNS = [
  /^\/api\/tts/,
  /^\/api\/login/,
  /^\/api\/progress/,
  /^\/api\/user/,
  /^\/api\/stats/,
  /^\/api\/search/,
  /^\/api\/notes/
];

// Service Worker 安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker: 正在安装...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: 缓存静态资源失败', error);
      })
  );
  
  // 强制激活新的 Service Worker
  self.skipWaiting();
});

// Service Worker 激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker: 正在激活...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: 删除旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // 立即控制所有客户端
  self.clients.claim();
});

// 网络请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过外部资源
  if (url.origin !== location.origin) {
    return;
  }
  
  // 检查是否需要跳过缓存
  const shouldSkipCache = NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
  if (shouldSkipCache) {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

// 处理网络请求的策略
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 静态资源：缓存优先策略
    if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // API 请求：网络优先策略
    if (url.pathname.startsWith('/api/')) {
      const shouldCache = CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
      if (shouldCache) {
        return await networkFirst(request, DYNAMIC_CACHE);
      } else {
        return await networkOnly(request);
      }
    }
    
    // 页面请求：网络优先策略，失败时显示离线页面
    return await networkFirstWithOffline(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('Service Worker: 请求处理失败', error);
    return await handleOffline(request);
  }
}

// 缓存优先策略
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // 后台更新缓存
    fetch(request).then(response => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // 静默失败
    });
    
    return cachedResponse;
  }
  
  const response = await fetch(request);
  if (response.status === 200) {
    cache.put(request, response.clone());
  }
  return response;
}

// 网络优先策略
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    // 设置请求超时为10秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw new Error('Network and cache failed');
  }
}

// 仅网络策略
async function networkOnly(request) {
  return await fetch(request);
}

// 网络优先策略（带离线页面回退）
async function networkFirstWithOffline(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    // 设置请求超时为8秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回离线页面
    return await handleOffline(request);
  }
}

// 处理离线情况
async function handleOffline(request) {
  const url = new URL(request.url);
  
  // 如果是导航请求（页面请求），返回离线页面
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // 其他请求返回简单的离线响应
  return new Response(
    JSON.stringify({ 
      error: '网络连接失败，请检查网络设置', 
      offline: true 
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// 后台同步事件
self.addEventListener('sync', (event) => {
  console.log('Service Worker: 后台同步', event.tag);
  
  if (event.tag === 'background-sync-progress') {
    event.waitUntil(syncReadingProgress());
  }
});

// 同步阅读进度
async function syncReadingProgress() {
  try {
    // 从 IndexedDB 或其他存储获取待同步的进度数据
    const pendingProgress = await getPendingProgress();
    
    for (const progress of pendingProgress) {
      try {
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progress)
        });
        
        if (response.ok) {
          // 同步成功，移除待同步数据
          await removePendingProgress(progress.id);
        }
      } catch (error) {
        console.error('同步进度失败:', error);
      }
    }
  } catch (error) {
    console.error('后台同步失败:', error);
  }
}

// 推送通知事件
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  const { action, data } = event.notification;
  
  event.notification.close();
  
  let url = '/';
  if (data && data.url) {
    url = data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 查找已经打开的窗口
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 如果没有找到，打开新窗口
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// 辅助函数（需要根据实际存储实现）
async function getPendingProgress() {
  // 实现获取待同步进度的逻辑
  return [];
}

async function removePendingProgress(id) {
  // 实现移除已同步进度的逻辑
}

// 错误处理
self.addEventListener('error', (event) => {
  console.error('Service Worker 错误:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker 未处理的 Promise 拒绝:', event.reason);
});