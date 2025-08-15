import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function NotFound404Island() {
  const searchQuery = useSignal("");
  const currentTime = useSignal("");
  const showEasterEgg = useSignal(false);
  const easterEggCount = useSignal(0);

  // 更新当前时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      currentTime.value = now.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 彩蛋功能：点击404数字
  const handleNumberClick = () => {
    easterEggCount.value++;
    if (easterEggCount.value >= 5) {
      showEasterEgg.value = true;
      setTimeout(() => {
        showEasterEgg.value = false;
        easterEggCount.value = 0;
      }, 3000);
    }
  };

  // 搜索功能
  const handleSearch = () => {
    if (searchQuery.value.trim()) {
      globalThis.location.href = `/?search=${
        encodeURIComponent(searchQuery.value)
      }`;
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 随机书籍推荐
  const bookSuggestions = [
    "三体",
    "红楼梦",
    "活着",
    "百年孤独",
    "小王子",
    "哈利波特",
    "围城",
    "平凡的世界",
    "白夜行",
    "解忧杂货店",
  ];

  const getRandomBook = () => {
    const randomIndex = Math.floor(Math.random() * bookSuggestions.length);
    return bookSuggestions[randomIndex];
  };

  const handleRandomBook = () => {
    const randomBook = getRandomBook();
    searchQuery.value = randomBook;
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* 背景装饰动画 */}
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse">
        </div>
        <div
          class="absolute top-3/4 right-1/4 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          style="animation-delay: 2s;"
        >
        </div>
        <div
          class="absolute top-1/2 left-1/2 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          style="animation-delay: 4s;"
        >
        </div>
      </div>

      <div class="max-w-2xl mx-auto text-center relative z-10">
        {/* 顶部时间显示 */}
        <div class="absolute -top-12 right-0 text-sm text-gray-500 font-mono">
          {currentTime.value}
        </div>

        {/* 主要视觉元素 */}
        <div class="relative mb-8">
          {/* 可点击的404数字 */}
          <div
            class="text-8xl md:text-9xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer select-none transition-transform duration-300 hover:scale-105"
            onClick={handleNumberClick}
            title="点击我试试 😉"
          >
            404
          </div>

          {/* 彩蛋显示 */}
          {showEasterEgg.value && (
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-lg font-semibold animate-bounce shadow-lg">
                🎉 你发现了彩蛋！
              </div>
            </div>
          )}

          {/* 装饰性的书本图标 */}
          <div class="absolute -top-4 -right-4 md:-top-6 md:-right-6 transform rotate-12 opacity-20 hover:opacity-40 transition-opacity duration-300">
            <svg
              class="w-20 h-20 md:w-24 md:h-24 text-purple-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>

          {/* 飘浮的装饰元素 */}
          <div class="absolute top-0 left-0 transform -translate-x-8 -translate-y-8 animate-bounce">
            <div class="w-4 h-4 bg-yellow-400 rounded-full opacity-70"></div>
          </div>
          <div class="absolute top-8 right-0 transform translate-x-12 animate-ping">
            <div class="w-3 h-3 bg-blue-400 rounded-full opacity-60"></div>
          </div>
          <div
            class="absolute bottom-0 left-8 transform -translate-y-4 animate-bounce"
            style="animation-delay: 1s;"
          >
            <div class="w-2 h-2 bg-purple-400 rounded-full opacity-80"></div>
          </div>
        </div>

        {/* 标题和描述 */}
        <div class="mb-8 space-y-4">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            这页书好像被风吹走了...
          </h1>
          <p class="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
            您访问的页面可能已经被移除、重命名，或者暂时不可访问。
            <br />
            让我们一起回到书海中探索吧！
          </p>
        </div>

        {/* 搜索栏 */}
        <div class="mb-8">
          <div class="flex max-w-md mx-auto">
            <input
              type="text"
              placeholder="搜索您想读的书..."
              value={searchQuery.value}
              onInput={(e) =>
                searchQuery.value = (e.target as HTMLInputElement).value}
              onKeyPress={handleKeyPress}
              class="flex-1 px-4 py-3 rounded-l-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300"
            />
            <button
              onClick={handleSearch}
              class="px-6 py-3 bg-blue-600 text-white rounded-r-full hover:bg-blue-700 transition-colors duration-300 focus:ring-2 focus:ring-blue-200 outline-none"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
          <button
            onClick={handleRandomBook}
            class="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors duration-300"
          >
            🎲 随机推荐一本书
          </button>
        </div>

        {/* 操作按钮 */}
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <a
            href="/"
            class="group relative inline-flex items-center px-8 py-3 overflow-hidden text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span class="relative flex items-center">
              <svg
                class="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              回到首页
            </span>
          </a>

          <a
            href="/shelf"
            class="group relative inline-flex items-center px-8 py-3 text-lg font-medium text-gray-700 bg-white rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-gray-200"
          >
            <span class="relative flex items-center">
              <svg
                class="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              我的书架
            </span>
          </a>
        </div>

        {/* 快捷分类 */}
        <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center">
            <svg
              class="w-5 h-5 mr-2 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            热门分类
          </h3>
          <div class="flex flex-wrap gap-2 justify-center">
            {[
              "热门小说",
              "经典文学",
              "科幻奇幻",
              "历史传记",
              "商业财经",
              "心理励志",
            ].map((category) => (
              <button
                key={category}
                onClick={() => searchQuery.value = category}
                class="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 rounded-full text-sm hover:from-blue-200 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 底部装饰 */}
        <div class="mt-12 opacity-40">
          <div class="flex justify-center space-x-8">
            {[4, 8, 6, 10, 5].map((height, index) => (
              <div
                key={index}
                class={`w-2 h-${height} bg-gradient-to-t from-blue-400 to-transparent rounded-full animate-pulse`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
              </div>
            ))}
          </div>
        </div>

        {/* 提示文字 */}
        <p class="text-xs text-gray-400 mt-4">
          提示：多点几次404数字试试 😉
        </p>
      </div>
    </div>
  );
}
