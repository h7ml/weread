/**
 * Analytics 组件 - 统计代码注入管理
 *
 * @description 提供统一的网站分析工具集成，支持Google Analytics、百度统计等
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

import { Head } from "$fresh/runtime.ts";

export interface AnalyticsConfig {
  // Google Analytics 4
  googleAnalytics?: {
    measurementId: string;
    debug?: boolean;
  };
  
  // Google Tag Manager
  googleTagManager?: {
    containerId: string;
  };
  
  // 百度统计
  baiduAnalytics?: {
    siteId: string;
  };
  
  // Clarity (Microsoft)
  microsoftClarity?: {
    projectId: string;
  };
  
  // Hotjar
  hotjar?: {
    siteId: string;
    version: number;
  };
  
  // 自定义脚本
  customScripts?: Array<{
    src?: string;
    innerHTML?: string;
    async?: boolean;
    defer?: boolean;
    type?: string;
  }>;
}

interface AnalyticsProps {
  config?: AnalyticsConfig;
  enabled?: boolean;
  debugMode?: boolean;
}

export default function Analytics({ config, enabled = true, debugMode = false }: AnalyticsProps) {
  if (!enabled || !config) {
    return null;
  }

  return (
    <Head>
      {/* Google Analytics 4 */}
      {config.googleAnalytics && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${config.googleAnalytics.measurementId}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${config.googleAnalytics.measurementId}', {
                  ${config.googleAnalytics.debug ? "'debug_mode': true," : ""}
                  'anonymize_ip': true,
                  'cookie_flags': 'secure;samesite=none'
                });
                ${debugMode ? "console.log('Google Analytics loaded');" : ""}
              `,
            }}
          />
        </>
      )}

      {/* Google Tag Manager */}
      {config.googleTagManager && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${config.googleTagManager.containerId}');
                ${debugMode ? "console.log('Google Tag Manager loaded');" : ""}
              `,
            }}
          />
        </>
      )}

      {/* 百度统计 */}
      {config.baiduAnalytics && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var _hmt = _hmt || [];
              (function() {
                var hm = document.createElement("script");
                hm.src = "https://hm.baidu.com/hm.js?${config.baiduAnalytics.siteId}";
                var s = document.getElementsByTagName("script")[0]; 
                s.parentNode.insertBefore(hm, s);
                ${debugMode ? "console.log('Baidu Analytics loaded');" : ""}
              })();
            `,
          }}
        />
      )}

      {/* Microsoft Clarity */}
      {config.microsoftClarity && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${config.microsoftClarity.projectId}");
              ${debugMode ? "console.log('Microsoft Clarity loaded');" : ""}
            `,
          }}
        />
      )}

      {/* Hotjar */}
      {config.hotjar && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${config.hotjar.siteId},hjsv:${config.hotjar.version}};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
                ${debugMode ? "console.log('Hotjar loaded');" : ""}
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `,
          }}
        />
      )}

      {/* 自定义脚本 */}
      {config.customScripts?.map((script, index) => (
        <script
          key={index}
          src={script.src}
          async={script.async}
          defer={script.defer}
          type={script.type || "text/javascript"}
          dangerouslySetInnerHTML={script.innerHTML ? { __html: script.innerHTML } : undefined}
        />
      ))}
    </Head>
  );
}

// GTM Body 标签（需要在 body 开始标签后立即插入）
export function GTMBody({ containerId, enabled = true }: { containerId?: string; enabled?: boolean }) {
  if (!enabled || !containerId) {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}

// Analytics 事件追踪助手
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window === "undefined") return;
  
  // Google Analytics 4
  if (window.gtag) {
    window.gtag("event", eventName, parameters);
  }
  
  // 百度统计
  if (window._hmt) {
    window._hmt.push(["_trackEvent", eventName, JSON.stringify(parameters)]);
  }
  
  // Microsoft Clarity
  if (window.clarity) {
    window.clarity("event", eventName);
  }
  
  // Hotjar
  if (window.hj) {
    window.hj("event", eventName);
  }
};

// 页面浏览追踪
export const trackPageView = (path: string, title?: string) => {
  if (typeof window === "undefined") return;
  
  // Google Analytics 4
  if (window.gtag) {
    window.gtag("config", window.GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title,
    });
  }
  
  // 百度统计
  if (window._hmt) {
    window._hmt.push(["_trackPageview", path]);
  }
};

// 类型声明
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    _hmt: any[];
    clarity: (...args: any[]) => void;
    hj: (...args: any[]) => void;
    GA_MEASUREMENT_ID: string;
  }
}