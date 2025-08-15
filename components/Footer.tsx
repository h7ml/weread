/**
 * 微信读书 Web 阅读应用 - 页脚组件
 * 
 * @description 公共页脚组件，显示作者信息、联系方式和项目链接
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

export default function Footer() {
  return (
    <footer class="bg-gray-50 border-t border-gray-200 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 项目信息 */}
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
              </svg>
              微信读书 Web
            </h3>
            <p class="text-sm text-gray-600">
              基于 Fresh (Deno) 构建的现代化微信读书 Web 阅读平台，
              提供优质的在线阅读体验和高级 TTS 功能。
            </p>
            <div class="flex space-x-4">
              <a
                href="https://github.com/h7ml/weread"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-900 text-white hover:bg-gray-700 transition-colors"
              >
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"/>
                </svg>
                GitHub
              </a>
              <a
                href="https://webook.linuxcloudlab.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                在线体验
              </a>
            </div>
          </div>

          {/* 作者信息 */}
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
              </svg>
              作者信息
            </h3>
            <div class="space-y-2">
              <div class="flex items-center">
                <span class="text-sm text-gray-600 w-16">姓名:</span>
                <span class="text-sm font-medium text-gray-900">h7ml</span>
              </div>
              <div class="flex items-center">
                <span class="text-sm text-gray-600 w-16">邮箱:</span>
                <a
                  href="mailto:h7ml@qq.com"
                  class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  h7ml@qq.com
                </a>
              </div>
              <div class="flex items-center">
                <span class="text-sm text-gray-600 w-16">GitHub:</span>
                <a
                  href="https://github.com/h7ml"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  @h7ml
                </a>
              </div>
            </div>
          </div>

          {/* 联系方式 */}
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              联系作者
            </h3>
            <div class="space-y-3">
              <a
                href="mailto:h7ml@qq.com"
                class="flex items-center p-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                发送邮件
              </a>
              <a
                href="https://tech-5g8h9y7s90510d9e-1253666439.tcloudbaseapp.com/wechat.jpg"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center p-2 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.298c-.019.063-.024.094-.024.094-.013.094.083.174.176.133l1.715-.855a.64.64 0 01.596-.016c1.003.462 2.174.728 3.403.728 4.8 0 8.691-3.288 8.691-7.342 0-4.054-3.891-7.342-8.691-7.342zm-.362 11.236l-2.188-2.188-4.275 2.188 4.7-4.975 2.251 2.188 4.212-2.188-4.7 4.975z"/>
                </svg>
                添加微信
              </a>
              <a
                href="https://github.com/h7ml/weread/issues"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center p-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.732L13.732 4.268c-.77-1.064-2.694-1.064-3.464 0L3.34 16.268C2.57 17.333 3.532 19 5.072 19z"/>
                </svg>
                反馈问题
              </a>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div class="mt-8 pt-6 border-t border-gray-200">
          <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div class="text-sm text-gray-500">
              © 2025 h7ml. All rights reserved. Licensed under{" "}
              <a
                href="https://github.com/h7ml/weread/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 hover:text-blue-800 transition-colors"
              >
                MIT License
              </a>
            </div>
            <div class="flex items-center space-x-4 text-sm text-gray-500">
              <span>Made with ❤️ using</span>
              <div class="flex items-center space-x-2">
                <span class="bg-black text-white px-2 py-1 rounded text-xs">Deno</span>
                <span class="bg-green-500 text-white px-2 py-1 rounded text-xs">Fresh</span>
                <span class="bg-blue-500 text-white px-2 py-1 rounded text-xs">TypeScript</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}