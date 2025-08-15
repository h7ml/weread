/**
 * PWA 组件 - 渐进式 Web 应用功能集成
 *
 * @description 提供 PWA 功能集成，包括 Service Worker 注册、安装提示等
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

import { Head } from "$fresh/runtime.ts";

export interface PWAConfig {
  // Service Worker 配置
  serviceWorker?: {
    enabled: boolean;
    path?: string;
    scope?: string;
    updateViaCache?: "imports" | "all" | "none";
  };
  
  // 安装提示配置
  installPrompt?: {
    enabled: boolean;
    autoShow?: boolean;
    showAfterDays?: number;
    showAfterVisits?: number;
  };
  
  // 主题配置
  theme?: {
    color: string;
    backgroundColor: string;
  };
  
  // 其他PWA特性
  features?: {
    enableNotifications?: boolean;
    enableBackgroundSync?: boolean;
    enablePeriodicSync?: boolean;
  };
}

interface PWAProps {
  config?: PWAConfig;
  enabled?: boolean;
}

const defaultConfig: PWAConfig = {
  serviceWorker: {
    enabled: true,
    path: "/sw.js",
    scope: "/",
    updateViaCache: "none"
  },
  installPrompt: {
    enabled: true,
    autoShow: false,
    showAfterDays: 3,
    showAfterVisits: 5
  },
  theme: {
    color: "#3b82f6",
    backgroundColor: "#ffffff"
  },
  features: {
    enableNotifications: true,
    enableBackgroundSync: true,
    enablePeriodicSync: false
  }
};

export default function PWA({ config, enabled = true }: PWAProps) {
  if (!enabled) {
    return null;
  }

  const pwaConfig = { ...defaultConfig, ...config };

  return (
    <>
      <Head>
        {/* PWA Meta 标签 */}
        <meta name="theme-color" content={pwaConfig.theme?.color} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="微信读书 Web" />
        <meta name="application-name" content="微信读书 Web" />
        <meta name="msapplication-TileColor" content={pwaConfig.theme?.backgroundColor} />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* iOS Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-152x152.svg" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icons/icon-32x32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icons/icon-16x16.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        
        {/* Windows */}
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.svg" />
        <meta name="msapplication-square70x70logo" content="/icons/icon-72x72.svg" />
        <meta name="msapplication-square150x150logo" content="/icons/icon-152x152.svg" />
        <meta name="msapplication-wide310x150logo" content="/icons/icon-310x150.svg" />
        <meta name="msapplication-square310x310logo" content="/icons/icon-310x310.svg" />
      </Head>
      
      {/* PWA 初始化脚本 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              'use strict';
              
              const pwaConfig = ${JSON.stringify(pwaConfig)};
              let deferredPrompt;
              let isInstalled = false;
              
              // 检查是否已安装
              function checkIfInstalled() {
                if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
                  isInstalled = true;
                  document.body.classList.add('pwa-installed');
                }
                
                if (window.navigator && window.navigator.standalone === true) {
                  isInstalled = true;
                  document.body.classList.add('pwa-installed');
                }
              }
              
              // Service Worker 注册
              function registerServiceWorker() {
                if ('serviceWorker' in navigator && pwaConfig.serviceWorker.enabled) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register(pwaConfig.serviceWorker.path, {
                      scope: pwaConfig.serviceWorker.scope,
                      updateViaCache: pwaConfig.serviceWorker.updateViaCache
                    })
                    .then((registration) => {
                      console.log('SW registered: ', registration);
                      
                      // 监听 Service Worker 更新
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              // 新版本可用，显示更新提示
                              showUpdateAvailable(registration);
                            }
                          });
                        }
                      });
                    })
                    .catch((error) => {
                      console.log('SW registration failed: ', error);
                    });
                  });
                }
              }
              
              // 显示更新可用提示
              function showUpdateAvailable(registration) {
                const updateBanner = document.createElement('div');
                updateBanner.className = 'pwa-update-banner';
                updateBanner.innerHTML = \`
                  <div class="pwa-update-content">
                    <span>新版本可用</span>
                    <button onclick="window.pwaUpdate()" class="pwa-update-btn">更新</button>
                    <button onclick="this.parentElement.parentElement.remove()" class="pwa-update-close">×</button>
                  </div>
                \`;
                
                // 添加样式
                const style = document.createElement('style');
                style.textContent = \`
                  .pwa-update-banner {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: #3b82f6;
                    color: white;
                    z-index: 9999;
                    padding: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  .pwa-update-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    max-width: 500px;
                    margin: 0 auto;
                  }
                  .pwa-update-btn {
                    background: white;
                    color: #3b82f6;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-weight: 500;
                    cursor: pointer;
                  }
                  .pwa-update-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0 8px;
                  }
                \`;
                
                document.head.appendChild(style);
                document.body.insertBefore(updateBanner, document.body.firstChild);
                
                // 全局更新函数
                window.pwaUpdate = () => {
                  const waiting = registration.waiting;
                  if (waiting) {
                    waiting.postMessage({ type: 'SKIP_WAITING' });
                    waiting.addEventListener('statechange', () => {
                      if (waiting.state === 'activated') {
                        window.location.reload();
                      }
                    });
                  }
                };
              }
              
              // 安装提示处理
              function handleInstallPrompt() {
                if (!pwaConfig.installPrompt.enabled || isInstalled) return;
                
                window.addEventListener('beforeinstallprompt', (e) => {
                  e.preventDefault();
                  deferredPrompt = e;
                  
                  // 根据配置决定是否自动显示
                  if (pwaConfig.installPrompt.autoShow) {
                    setTimeout(showInstallPrompt, 3000);
                  } else {
                    // 显示安装按钮或其他UI提示
                    document.body.classList.add('pwa-installable');
                  }
                });
                
                // 监听安装成功事件
                window.addEventListener('appinstalled', () => {
                  console.log('PWA was installed');
                  isInstalled = true;
                  document.body.classList.remove('pwa-installable');
                  document.body.classList.add('pwa-installed');
                  deferredPrompt = null;
                });
              }
              
              // 显示安装提示
              function showInstallPrompt() {
                if (!deferredPrompt) return;
                
                const installModal = document.createElement('div');
                installModal.className = 'pwa-install-modal';
                installModal.innerHTML = \`
                  <div class="pwa-install-content">
                    <h3>安装微信读书 Web</h3>
                    <p>将应用添加到主屏幕，获得更好的使用体验</p>
                    <div class="pwa-install-buttons">
                      <button onclick="window.pwaInstall()" class="pwa-install-yes">安装</button>
                      <button onclick="window.pwaInstallCancel()" class="pwa-install-no">取消</button>
                    </div>
                  </div>
                \`;
                
                // 添加样式
                const style = document.createElement('style');
                style.textContent = \`
                  .pwa-install-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                  }
                  .pwa-install-content {
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    max-width: 320px;
                    width: 90%;
                    text-align: center;
                  }
                  .pwa-install-content h3 {
                    margin: 0 0 12px;
                    font-size: 18px;
                  }
                  .pwa-install-content p {
                    margin: 0 0 20px;
                    color: #666;
                    line-height: 1.5;
                  }
                  .pwa-install-buttons {
                    display: flex;
                    gap: 12px;
                  }
                  .pwa-install-buttons button {
                    flex: 1;
                    padding: 10px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                  }
                  .pwa-install-yes {
                    background: #3b82f6;
                    color: white;
                  }
                  .pwa-install-no {
                    background: #f3f4f6;
                    color: #374151;
                  }
                \`;
                
                document.head.appendChild(style);
                document.body.appendChild(installModal);
                
                // 全局安装函数
                window.pwaInstall = async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log('Install outcome:', outcome);
                    deferredPrompt = null;
                    installModal.remove();
                  }
                };
                
                window.pwaInstallCancel = () => {
                  installModal.remove();
                  // 记录用户拒绝安装
                  localStorage.setItem('pwa-install-declined', Date.now().toString());
                };
              }
              
              // 权限请求
              function requestPermissions() {
                if (!pwaConfig.features.enableNotifications) return;
                
                // 请求通知权限
                if ('Notification' in window && Notification.permission === 'default') {
                  setTimeout(() => {
                    Notification.requestPermission().then(permission => {
                      console.log('Notification permission:', permission);
                    });
                  }, 5000);
                }
              }
              
              // 初始化
              document.addEventListener('DOMContentLoaded', () => {
                checkIfInstalled();
                registerServiceWorker();
                handleInstallPrompt();
                requestPermissions();
              });
              
              // 导出全局函数
              window.pwaShowInstallPrompt = showInstallPrompt;
              
            })();
          `,
        }}
      />
    </>
  );
}

// 安装按钮组件
export function PWAInstallButton({ className = "", children = "安装应用" }: { className?: string; children?: string }) {
  return (
    <button
      className={`pwa-install-trigger ${className}`}
      onClick={() => {
        if (window.pwaShowInstallPrompt) {
          window.pwaShowInstallPrompt();
        }
      }}
      style={{ display: "none" }}
    >
      {children}
    </button>
  );
}

// 类型声明
declare global {
  interface Window {
    pwaShowInstallPrompt?: () => void;
    pwaInstall?: () => void;
    pwaInstallCancel?: () => void;
    pwaUpdate?: () => void;
  }
}