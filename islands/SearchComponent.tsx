import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function SearchComponent() {
  const searchQuery = useSignal("");
  const searchResults = useSignal([]);
  const loading = useSignal(false);
  const error = useSignal("");
  const searchHistory = useSignal([]);
  const showHistory = useSignal(true);

  // 热门搜索关键词
  const hotKeywords = [
    "人工智能",
    "心理学",
    "历史",
    "小说",
    "编程",
    "商业",
    "哲学",
    "文学",
    "科技",
    "投资",
  ];

  useEffect(() => {
    // 从 localStorage 加载搜索历史
    const saved = localStorage.getItem("weread_search_history");
    if (saved) {
      try {
        searchHistory.value = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse search history:", e);
      }
    }
  }, []);

  const saveSearchHistory = (keyword: string) => {
    const history = [...searchHistory.value];
    // 移除重复的关键词
    const index = history.indexOf(keyword);
    if (index > -1) {
      history.splice(index, 1);
    }
    // 添加到开头
    history.unshift(keyword);
    // 限制历史记录数量
    if (history.length > 10) {
      history.splice(10);
    }

    searchHistory.value = history;
    localStorage.setItem("weread_search_history", JSON.stringify(history));
  };

  const clearSearchHistory = () => {
    searchHistory.value = [];
    localStorage.removeItem("weread_search_history");
  };

  const performSearch = async (keyword: string = searchQuery.value) => {
    if (!keyword.trim()) {
      error.value = "请输入搜索关键词";
      return;
    }

    try {
      loading.value = true;
      error.value = "";
      showHistory.value = false;

      const params = new URLSearchParams({
        q: keyword.trim(),
        count: "50",
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (data.success) {
        searchResults.value = data.data.books || [];
        saveSearchHistory(keyword.trim());

        if (searchResults.value.length === 0) {
          error.value = "没有找到相关书籍，试试其他关键词";
        }
      } else {
        error.value = data.error || "搜索失败";
        searchResults.value = [];
      }
    } catch (err) {
      console.error("Search error:", err);
      error.value = `搜索失败: ${err.message}`;
      searchResults.value = [];
    } finally {
      loading.value = false;
    }
  };

  const handleSearch = () => {
    performSearch();
  };

  const selectKeyword = (keyword: string) => {
    searchQuery.value = keyword;
    performSearch(keyword);
  };

  const openBookDetail = (bookId: string) => {
    globalThis.location.href = `/book/${bookId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  书籍搜索
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                首页
              </a>
              <a
                href="/shelf"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                书架
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 搜索区域 */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              发现你的
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                下一本好书
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              搜索海量书籍，找到最适合你的阅读内容
            </p>
          </div>

          {/* 搜索框 */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000">
              </div>
              <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-2 shadow-xl border border-white/50">
                <div className="flex items-center">
                  <div className="flex-shrink-0 pl-6">
                    <svg
                      className="h-8 w-8 text-gray-400"
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
                  <input
                    type="text"
                    value={searchQuery.value}
                    onInput={(e) => {
                      searchQuery.value = e.currentTarget.value;
                      if (!e.currentTarget.value.trim()) {
                        showHistory.value = true;
                        searchResults.value = [];
                        error.value = "";
                      }
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="搜索书名、作者或关键词..."
                    className="flex-1 px-6 py-4 text-lg bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-gray-400"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading.value}
                    className="flex-shrink-0 mr-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.value
                      ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full">
                          </div>
                          <span>搜索中</span>
                        </div>
                      )
                      : (
                        "搜索"
                      )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索历史和热门推荐 */}
        {showHistory.value && (
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 搜索历史 */}
              {searchHistory.value.length > 0 && (
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                      <svg
                        className="w-6 h-6 mr-3 text-blue-600"
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
                      搜索历史
                    </h3>
                    <button
                      onClick={clearSearchHistory}
                      className="text-sm text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      清除
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {searchHistory.value.slice(0, 8).map((keyword, index) => (
                      <button
                        key={index}
                        onClick={() => selectKeyword(keyword)}
                        className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-100 hover:to-purple-100 text-gray-700 hover:text-blue-700 rounded-2xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 热门搜索 */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/50">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg
                    className="w-6 h-6 mr-3 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
                    />
                  </svg>
                  热门搜索
                </h3>
                <div className="flex flex-wrap gap-3">
                  {hotKeywords.map((keyword, index) => (
                    <button
                      key={index}
                      onClick={() => selectKeyword(keyword)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-blue-700 hover:text-purple-700 rounded-2xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error.value && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="bg-red-50/80 backdrop-blur-lg border border-red-200/50 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
              <div className="flex items-center">
                <svg
                  className="h-6 w-6 text-red-400 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{error.value}</span>
              </div>
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        {!showHistory.value && searchResults.value.length > 0 && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                搜索结果
              </h2>
              <p className="text-gray-600">
                找到 {searchResults.value.length} 本相关书籍
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {searchResults.value.map((book) => (
                <div
                  key={book.bookId}
                  onClick={() => openBookDetail(book.bookId)}
                  className="group bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 hover:shadow-2xl transition-all duration-500 cursor-pointer hover:scale-105 overflow-hidden"
                >
                  <div className="aspect-w-3 aspect-h-4 relative overflow-hidden">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDIwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03MC41IDcwSDEyOS41VjE3MEg3MC41VjcwWiIgZmlsbD0iI0Q1RDVENS8+Cjx0ZXh0IHg9IjEwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LXNpemU9IjE0Ij7ml6DmmYLlsIE+PC90ZXh0Pgo8L3N2Zz4K";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                  </div>
                  <div className="p-4">
                    <h3
                      className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors"
                      title={book.title}
                    >
                      {book.title}
                    </h3>
                    <p
                      className="text-xs text-gray-500 mb-3 line-clamp-1"
                      title={book.author}
                    >
                      {book.author}
                    </p>

                    {/* 评分和额外信息 */}
                    {book.rating && (
                      <div className="flex items-center mb-2">
                        <div className="flex items-center mr-2">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(book.rating / 2)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {(book.rating / 100).toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* 阅读统计 */}
                    {book.readingCount && (
                      <div className="flex items-center mb-2">
                        <svg
                          className="w-3 h-3 text-blue-500 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs text-gray-500">
                          {book.readingCount}人在读
                        </span>
                      </div>
                    )}

                    {/* 是否在书架 */}
                    {book.inshelf && (
                      <div className="flex items-center mb-2">
                        <svg
                          className="w-3 h-3 text-green-500 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs text-green-600">已收藏</span>
                      </div>
                    )}

                    {/* 价格 */}
                    {book.price !== undefined && (
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold ${
                            book.price === 0
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {book.price === 0 ? "免费" : `¥${book.price}`}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `,
        }}
      />
    </div>
  );
}
