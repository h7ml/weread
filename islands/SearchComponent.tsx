import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import Navigation from "../components/Navigation.tsx";

export default function SearchComponent() {
  const searchQuery = useSignal("");
  const searchResults = useSignal([]);
  const suggestions = useSignal([]);
  const loading = useSignal(false);
  const loadingMore = useSignal(false);
  const error = useSignal("");
  const searchHistory = useSignal([]);
  const showHistory = useSignal(true);
  const viewMode = useSignal("grid"); // "grid" 或 "list"
  const hasMore = useSignal(false);
  const maxIdx = useSignal(0);
  const totalCount = useSignal(0);

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
    // 从 localStorage 加载搜索历史和视图模式
    const savedHistory = localStorage.getItem("weread_search_history");
    const savedViewMode = localStorage.getItem("weread_search_view_mode");
    
    if (savedHistory) {
      try {
        searchHistory.value = JSON.parse(savedHistory);
      } catch (e) {
        console.error("Failed to parse search history:", e);
      }
    }
    
    if (savedViewMode && (savedViewMode === "grid" || savedViewMode === "list")) {
      viewMode.value = savedViewMode;
    }

    // 添加滚动监听
    const handleScroll = () => {
      if (loadingMore.value || !hasMore.value) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMoreResults();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const saveSearchHistory = (keyword: string) => {
    const history = [...searchHistory.value];
    const index = history.indexOf(keyword);
    if (index > -1) {
      history.splice(index, 1);
    }
    history.unshift(keyword);
    if (history.length > 10) {
      history.splice(10);
    }

    searchHistory.value = history;
    localStorage.setItem("weread_search_history", JSON.stringify(history));
  };

  const toggleViewMode = () => {
    viewMode.value = viewMode.value === "grid" ? "list" : "grid";
    localStorage.setItem("weread_search_view_mode", viewMode.value);
  };

  const clearSearchHistory = () => {
    searchHistory.value = [];
    localStorage.removeItem("weread_search_history");
  };

  const performSearch = async (keyword: string = searchQuery.value, isLoadMore = false) => {
    if (!keyword.trim()) {
      error.value = "请输入搜索关键词";
      return;
    }

    try {
      if (isLoadMore) {
        loadingMore.value = true;
      } else {
        loading.value = true;
        error.value = "";
        showHistory.value = false;
        maxIdx.value = 0;
        searchResults.value = [];
        suggestions.value = [];
      }

      const params = new URLSearchParams({
        q: keyword.trim(),
        type: "mixed",
        count: "15",
        maxIdx: maxIdx.value.toString(),
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (data.success) {
        const newBooks = data.data.books || [];
        const newSuggestions = data.data.suggestions || [];
        
        if (isLoadMore) {
          searchResults.value = [...searchResults.value, ...newBooks];
        } else {
          searchResults.value = newBooks;
          suggestions.value = newSuggestions;
          saveSearchHistory(keyword.trim());
        }

        totalCount.value = data.data.total || 0;
        hasMore.value = data.data.hasMore || false;
        maxIdx.value += newBooks.length;

        if (!isLoadMore && searchResults.value.length === 0) {
          error.value = "没有找到相关书籍，试试其他关键词";
        }
      } else {
        error.value = data.error || "搜索失败";
        if (!isLoadMore) {
          searchResults.value = [];
          suggestions.value = [];
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      error.value = `搜索失败: ${err.message}`;
      if (!isLoadMore) {
        searchResults.value = [];
        suggestions.value = [];
      }
    } finally {
      if (isLoadMore) {
        loadingMore.value = false;
      } else {
        loading.value = false;
      }
    }
  };

  const loadMoreResults = () => {
    if (searchQuery.value.trim() && hasMore.value && !loadingMore.value) {
      performSearch(searchQuery.value, true);
    }
  };

  const handleSearch = () => {
    performSearch();
  };

  const handleKeywordClick = (keyword: string) => {
    searchQuery.value = keyword;
    performSearch(keyword);
  };

  const resetSearch = () => {
    searchQuery.value = "";
    searchResults.value = [];
    suggestions.value = [];
    error.value = "";
    showHistory.value = true;
    hasMore.value = false;
    maxIdx.value = 0;
    totalCount.value = 0;
  };

  const renderBookCard = (book: any, index: number) => {
    const isGridMode = viewMode.value === "grid";
    
    if (isGridMode) {
      // 网格模式
      return (
        <div
          key={`${book.bookId}-${index}`}
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
        >
          <div className="relative">
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {book.rating > 0 && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                ⭐ {book.rating.toFixed(1)}
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {book.title}
            </h3>
            <p className="text-gray-600 text-sm mb-2">{book.author}</p>
            {book.intro && (
              <p className="text-gray-500 text-xs line-clamp-2 mb-3">{book.intro}</p>
            )}
            {book.fragments && book.fragments.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">内容片段:</div>
                {book.fragments.slice(0, 1).map((fragment: any, fragIndex: number) => (
                  <div key={fragIndex} className="bg-gray-50 p-2 rounded text-xs">
                    <div className="text-gray-500 mb-1">{fragment.chapterTitle}</div>
                    <div className="text-gray-700 line-clamp-2">{fragment.text}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <a
                href={`/book/${book.bookId}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                查看详情
              </a>
              <a
                href={`/reader/${book.bookId}/1`}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                开始阅读
              </a>
            </div>
          </div>
        </div>
      );
    } else {
      // 列表模式
      return (
        <div
          key={`${book.bookId}-${index}`}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-4 flex gap-4"
        >
          <div className="flex-shrink-0">
            <img
              src={book.cover}
              alt={book.title}
              className="w-20 h-28 object-cover rounded-lg"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-gray-900 text-lg line-clamp-2 hover:text-blue-600 transition-colors">
                {book.title}
              </h3>
              {book.rating > 0 && (
                <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium ml-2">
                  ⭐ {book.rating.toFixed(1)}
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-2">{book.author}</p>
            {book.intro && (
              <p className="text-gray-500 text-sm line-clamp-2 mb-3">{book.intro}</p>
            )}
            {book.fragments && book.fragments.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">相关内容:</div>
                {book.fragments.map((fragment: any, fragIndex: number) => (
                  <div key={fragIndex} className="bg-gray-50 p-3 rounded mb-2">
                    <div className="text-gray-500 text-xs mb-1">{fragment.chapterTitle}</div>
                    <div className="text-gray-700 text-sm line-clamp-3">{fragment.text}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <a
                href={`/book/${book.bookId}`}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                查看详情
              </a>
              <a
                href={`/reader/${book.bookId}/1`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                开始阅读
              </a>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation
        title="书籍搜索"
        icon="search"
        showUser={false}
      />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 搜索区域 */}
        <div className="mb-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl focus-within:shadow-xl transition-all duration-300">
              {/* 搜索图标 */}
              <div className="pl-6 pr-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* 输入框 */}
              <input
                type="text"
                value={searchQuery.value}
                onInput={(e) => searchQuery.value = (e.target as HTMLInputElement).value}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜索书名、作者或关键词..."
                className="flex-1 py-4 text-lg bg-transparent border-none outline-none focus:ring-0 placeholder-gray-500"
              />
              
              {/* 清除按钮 */}
              {searchQuery.value && (
                <button
                  onClick={resetSearch}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  title="清空"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* 分割线 */}
              <div className="h-8 w-px bg-gray-200 mx-3"></div>
              
              {/* 搜索按钮 */}
              <button
                onClick={handleSearch}
                disabled={loading.value || !searchQuery.value.trim()}
                className="mr-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-full transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center"
              >
                {loading.value ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    搜索中
                  </>
                ) : (
                  "搜索"
                )}
              </button>
            </div>
          </div>

          {/* 搜索建议显示 */}
          {!showHistory.value && suggestions.value.length > 0 && (
            <div className="max-w-2xl mx-auto mt-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  相关推荐
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.value.map((suggestion: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleKeywordClick(suggestion.title)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm font-medium transition-all hover:scale-105"
                    >
                      {suggestion.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {showHistory.value && (
          <div className="max-w-4xl mx-auto">
            {/* 搜索历史 */}
            {searchHistory.value.length > 0 && (
              <div className="mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      搜索历史
                    </h2>
                    <button
                      onClick={clearSearchHistory}
                      className="text-gray-400 hover:text-gray-600 text-sm hover:bg-gray-50 px-2 py-1 rounded-md transition-all"
                    >
                      清空历史
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.value.map((keyword: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleKeywordClick(keyword)}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-sm font-medium transition-all hover:scale-105"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 热门搜索 */}
            <div className="mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                  热门搜索
                </h2>
                <div className="flex flex-wrap gap-2">
                  {hotKeywords.map((keyword: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleKeywordClick(keyword)}
                      className="px-3 py-1.5 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 text-orange-700 rounded-full text-sm font-medium transition-all border border-transparent hover:border-orange-200 hover:scale-105"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        {!showHistory.value && (
          <div>
            {/* 结果头部 - 统计信息和视图切换 */}
            {(searchResults.value.length > 0 || loading.value) && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    搜索结果
                    {totalCount.value > 0 && (
                      <span className="text-gray-500 font-normal ml-2">
                        共找到 {totalCount.value} 个结果
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleViewMode}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode.value === "grid"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title="网格视图"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={toggleViewMode}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode.value === "list"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title="列表视图"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {error.value && (
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700">{error.value}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 加载状态 */}
            {loading.value && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600">搜索中...</span>
              </div>
            )}

            {/* 搜索结果展示 */}
            {searchResults.value.length > 0 && (
              <>
                <div className={viewMode.value === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
                  : "space-y-4 mb-8"
                }>
                  {searchResults.value.map((book: any, index: number) => renderBookCard(book, index))}
                </div>

                {/* 加载更多指示器 */}
                {hasMore.value && (
                  <div className="flex justify-center py-8">
                    {loadingMore.value ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        <span className="text-gray-600">加载更多...</span>
                      </div>
                    ) : (
                      <button
                        onClick={loadMoreResults}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-medium transition-colors"
                      >
                        点击加载更多
                      </button>
                    )}
                  </div>
                )}

                {!hasMore.value && searchResults.value.length > 10 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">已显示全部 {searchResults.value.length} 个结果</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}