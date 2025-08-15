import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import Navigation from "../components/Navigation.tsx";
import BottomNavigation from "../components/BottomNavigation.tsx";

export default function BookDetailComponent() {
  const bookInfo = useSignal(null);
  const chapters = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const chaptersLoading = useSignal(false);
  const showChapters = useSignal(true); // 默认显示章节列表
  const chapterSearchQuery = useSignal("");
  const filteredChapters = useSignal([]);
  const isLoggedIn = useSignal(false);
  const currentPage = useSignal(1);
  const chaptersPerPage = 20;
  const showAllChapters = useSignal(false);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("weread_token");
    isLoggedIn.value = !!token;

    // 从URL获取书籍ID
    const path = globalThis.location.pathname;
    const bookId = path.split("/").pop();

    if (!bookId) {
      error.value = "缺少书籍ID";
      loading.value = false;
      return;
    }

    // 加载书籍详情
    loadBookDetail(token || "", bookId);
  }, []);

  // 更新过滤后的章节列表
  useEffect(() => {
    if (!chapterSearchQuery.value) {
      filteredChapters.value = chapters.value;
    } else {
      const query = chapterSearchQuery.value.toLowerCase();
      filteredChapters.value = chapters.value.filter((chapter) =>
        chapter.title?.toLowerCase().includes(query)
      );
    }
    currentPage.value = 1; // 重置到第一页
  }, [chapters.value, chapterSearchQuery.value]);

  // 分页计算
  const totalPages = Math.ceil(filteredChapters.value.length / chaptersPerPage);
  const startIndex = (currentPage.value - 1) * chaptersPerPage;
  const endIndex = startIndex + chaptersPerPage;
  const currentChapters = filteredChapters.value.slice(startIndex, endIndex);

  const loadBookDetail = async (token: string, bookId: string) => {
    try {
      loading.value = true;

      const response = await fetch(
        `/api/book/info?bookId=${bookId}&token=${token}`,
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          globalThis.location.href = "/login";
          return;
        }
        throw new Error(`获取书籍详情失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        bookInfo.value = data.data;
        // 默认加载章节列表
        loadChapters(token, data.data.bookId);
      } else {
        error.value = data.error || "加载失败";
      }
    } catch (err) {
      console.error("Failed to load book detail:", err);
      error.value = `加载书籍详情失败: ${err.message}`;
    } finally {
      loading.value = false;
    }
  };

  const loadChapters = async (token: string, bookId: string) => {
    try {
      chaptersLoading.value = true;

      const response = await fetch(
        `/api/book/chapters?bookId=${bookId}&token=${token}`,
      );

      if (!response.ok) {
        throw new Error(`获取章节列表失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        chapters.value = data.data.chapters || [];
      } else {
        throw new Error(data.error || "加载失败");
      }
    } catch (err) {
      console.error("Failed to load chapters:", err);
      // 章节加载失败不影响主流程，只显示console错误
    } finally {
      chaptersLoading.value = false;
    }
  };

  const openReader = (chapterUid: string) => {
    globalThis.location.href = `/reader/${bookInfo.value.bookId}/${chapterUid}`;
  };

  const downloadChapter = async (chapter) => {
    try {
      const token = localStorage.getItem("weread_token");
      const response = await fetch(
        `/api/book/content?bookId=${bookInfo.value.bookId}&chapterUid=${chapter.chapterUid}&token=${token}`,
      );

      if (!response.ok) {
        throw new Error("下载失败");
      }

      const data = await response.json();

      if (data.success) {
        // 创建下载链接
        const content = `${chapter.title}\n\n${
          data.data.content.replace(/<[^>]*>/g, "")
        }`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${bookInfo.value.title} - ${chapter.title}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error(data.error || "下载失败");
      }
    } catch (err) {
      alert(`下载章节失败: ${err.message}`);
    }
  };

  const downloadAllChapters = async () => {
    if (!confirm(`确定要下载《${bookInfo.value.title}》的所有章节吗？`)) {
      return;
    }

    try {
      const token = localStorage.getItem("weread_token");
      let allContent =
        `${bookInfo.value.title}\n作者: ${bookInfo.value.author}\n\n`;

      for (let i = 0; i < chapters.value.length; i++) {
        const chapter = chapters.value[i];
        console.log(`下载进度: ${i + 1}/${chapters.value.length}`);

        const response = await fetch(
          `/api/book/content?bookId=${bookInfo.value.bookId}&chapterUid=${chapter.chapterUid}&token=${token}`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            allContent += `\n\n第${i + 1}章 ${chapter.title}\n\n${
              data.data.content.replace(/<[^>]*>/g, "")
            }`;
          }
        }

        // 添加延迟避免请求过于频繁
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // 创建下载链接
      const blob = new Blob([allContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookInfo.value.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      alert("下载完成！");
    } catch (err) {
      alert(`批量下载失败: ${err.message}`);
    }
  };

  if (loading.value) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 mx-auto text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            >
            </circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            >
            </path>
          </svg>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg">{error.value}</div>
          <button
            onClick={() => globalThis.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 767px) {
            .book-detail-container {
              padding-bottom: 5rem !important;
            }
            .mobile-layout {
              display: block !important;
            }
            .desktop-layout {
              display: none !important;
            }
          }
          @media (min-width: 768px) {
            .mobile-layout {
              display: none !important;
            }
            .desktop-layout {
              display: block !important;
            }
          }
        `
      }} />
      
      <Navigation
        title="书籍详情"
        icon="book"
        showUser={isLoggedIn.value}
        currentPath={bookInfo.value ? `/book/${bookInfo.value.bookId}` : "/book"}
        actions={isLoggedIn.value ? [
          {
            label: "返回",
            onClick: () => globalThis.history.back(),
            type: "button",
          },
        ] : [
          {
            label: "登录",
            href: "/login",
            type: "link",
            variant: "primary",
          },
          {
            label: "返回",
            onClick: () => globalThis.history.back(),
            type: "button",
          },
        ]}
      />

      <main className="book-detail-container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {bookInfo.value && (
          <div>
            {/* PC端布局 */}
            <div className="desktop-layout">
              {/* PC端书籍信息卡片 */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
                <div className="flex gap-8">
                  <div className="flex-shrink-0">
                    <div className="relative group">
                      <img
                        src={bookInfo.value.cover}
                        alt={bookInfo.value.title}
                        className="w-56 h-80 object-cover rounded-xl shadow-lg transform group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDE5MiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA2NEgxMjhWMTkySDY0VjY0WiIgZmlsbD0iI0Q1RDVENY0+Cjx0ZXh0IHg9Ijk2IiB5PSIyMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjcyODAiIGZvbnQtc2l6ZT0iMTYiPuaXoOaaguWwgTwvdGV4dD4KPC9zdmc+Cg==";
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">
                      {bookInfo.value.title}
                    </h1>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-blue-600 text-sm font-medium block">作者</span>
                            <span className="text-gray-900 font-semibold">{bookInfo.value.author}</span>
                          </div>
                        </div>
                      </div>

                      {bookInfo.value.category && (
                        <div className="bg-purple-50 rounded-xl p-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-purple-600 text-sm font-medium block">分类</span>
                              <span className="text-gray-900 font-semibold">{bookInfo.value.category}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {bookInfo.value.price && (
                        <div className="bg-emerald-50 rounded-xl p-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-4">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-emerald-600 text-sm font-medium block">价格</span>
                              <span className="text-gray-900 font-semibold">¥{(bookInfo.value.price / 100).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {bookInfo.value.rating ? (
                        <div className="bg-yellow-50 rounded-xl p-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-yellow-600 text-sm font-medium block">评分</span>
                              <span className="text-gray-900 font-semibold">{(bookInfo.value.rating / 100).toFixed(1)} ★</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center mr-4">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-gray-600 text-sm font-medium block">评分</span>
                              <span className="text-gray-900 font-semibold">暂无评分</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {bookInfo.value.format && (
                        <div className="bg-indigo-50 rounded-xl p-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mr-4">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-indigo-600 text-sm font-medium block">格式</span>
                              <span className="text-gray-900 font-semibold">{bookInfo.value.format.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {bookInfo.value.updateTime && (
                        <div className="bg-rose-50 rounded-xl p-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center mr-4">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-rose-600 text-sm font-medium block">更新时间</span>
                              <span className="text-gray-900 font-semibold">{new Date(bookInfo.value.updateTime * 1000).toLocaleDateString('zh-CN')}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PC端操作按钮 */}
                    <div className="flex gap-4">
                      {isLoggedIn.value ? (
                        <>
                          <button
                            onClick={() => loadChapters(localStorage.getItem("weread_token"), bookInfo.value.bookId)}
                            disabled={chaptersLoading.value}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg disabled:opacity-50"
                          >
                            {chaptersLoading.value ? "加载中..." : "刷新章节"}
                          </button>
                          {chapters.value.length > 0 && (
                            <button
                              onClick={downloadAllChapters}
                              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
                            >
                              下载全书
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <a
                            href="/login"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg text-center"
                          >
                            登录后阅读
                          </a>
                          <button
                            onClick={() => alert("请先登录以使用此功能")}
                            className="px-8 py-4 bg-gray-300 text-gray-600 rounded-xl font-semibold text-lg cursor-not-allowed"
                          >
                            下载全书
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* PC端简介部分 - 单独一行 */}
              {bookInfo.value.intro && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">简介</h3>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-gray-700 leading-relaxed text-base">
                      {bookInfo.value.intro}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 移动端布局 */}
            <div className="mobile-layout">
              {/* 移动端书籍信息卡片 */}
              <div className="bg-gradient-to-br from-white/95 to-blue-50/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 p-6 mb-6 relative overflow-hidden">
                {/* 移动端装饰背景 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full transform translate-x-16 -translate-y-16 blur-xl"></div>
                
                <div className="relative">
                  <div className="text-center mb-6">
                    <div className="inline-block relative group">
                      <img
                        src={bookInfo.value.cover}
                        alt={bookInfo.value.title}
                        className="w-40 h-56 object-cover rounded-2xl shadow-lg ring-4 ring-white/70 mx-auto"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDE5MiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA2NEgxMjhWMTkySDY0VjY0WiIgZmlsbD0iI0Q1RDVENY0+Cjx0ZXh0IHg9Ijk2IiB5PSIyMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjcyODAiIGZvbnQtc2l6ZT0iMTYiPuaXoOaaguWwgTwvdGV4dD4KPC9zdmc+Cg==";
                        }}
                      />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
                      {bookInfo.value.title}
                    </h1>
                  </div>

                  {/* 移动端信息卡片 */}
                  <div className="space-y-3 mb-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 flex items-center shadow-sm">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">作者</span>
                        <span className="font-semibold text-gray-800">{bookInfo.value.author}</span>
                      </div>
                    </div>

                    {bookInfo.value.category && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 flex items-center shadow-sm">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs block">分类</span>
                          <span className="font-semibold text-gray-800">{bookInfo.value.category}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {bookInfo.value.price && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <span className="text-gray-500 text-xs block">价格</span>
                              <span className="font-semibold text-gray-800 text-sm">¥{(bookInfo.value.price / 100).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {bookInfo.value.rating ? (
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-yellow-500 rounded-lg flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <span className="text-gray-500 text-xs block">评分</span>
                              <span className="font-semibold text-gray-800 text-sm">{(bookInfo.value.rating / 100).toFixed(1)} ★</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-gray-500 rounded-lg flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <span className="text-gray-500 text-xs block">评分</span>
                              <span className="font-semibold text-gray-800 text-sm">暂无评分</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {bookInfo.value.format && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <span className="text-gray-500 text-xs block">格式</span>
                              <span className="font-semibold text-gray-800 text-sm">{bookInfo.value.format.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {bookInfo.value.updateTime && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-rose-500 rounded-lg flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <span className="text-gray-500 text-xs block">更新时间</span>
                              <span className="font-semibold text-gray-800 text-sm">{new Date(bookInfo.value.updateTime * 1000).toLocaleDateString('zh-CN')}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {bookInfo.value.intro && (
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        简介
                      </h3>
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {bookInfo.value.intro}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 移动端操作按钮 */}
                  <div className="space-y-3">
                    {isLoggedIn.value ? (
                      <>
                        <button
                          onClick={() => loadChapters(localStorage.getItem("weread_token"), bookInfo.value.bookId)}
                          disabled={chaptersLoading.value}
                          className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg disabled:opacity-50"
                        >
                          {chaptersLoading.value ? "加载中..." : "刷新章节"}
                        </button>
                        {chapters.value.length > 0 && (
                          <button
                            onClick={downloadAllChapters}
                            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
                          >
                            下载全书
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <a
                          href="/login"
                          className="block w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg text-center"
                        >
                          登录后阅读
                        </a>
                        <button
                          onClick={() => alert("请先登录以使用此功能")}
                          className="w-full px-6 py-4 bg-gray-300 text-gray-600 rounded-xl font-semibold cursor-not-allowed"
                        >
                          下载全书
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 章节列表 */}
            {showChapters.value && (
              <div className={`bg-gradient-to-br from-white/90 to-purple-50/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 p-6 md:p-8 ${showAllChapters.value ? 'max-h-[48rem] overflow-y-auto custom-scrollbar' : ''}`}>
                <div className="flex flex-col gap-6 mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text flex items-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                      </div>
                      章节列表
                      <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {filteredChapters.value.length}
                      </span>
                    </h2>
                    
                    <div className="flex items-center gap-4">
                      {/* 分页/全部显示切换按钮 */}
                      <button
                        onClick={() => {
                          showAllChapters.value = !showAllChapters.value;
                          currentPage.value = 1; // 重置到第一页
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-black rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          {showAllChapters.value ? (
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 6.707 6.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          )}
                        </svg>
                        {showAllChapters.value ? "分页显示" : "全部显示"}
                      </button>
                      
                      {!showAllChapters.value && totalPages > 1 && (
                        <div className="text-sm text-gray-500">
                          第 {currentPage.value} / {totalPages} 页
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 章节搜索 */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={chapterSearchQuery.value}
                      onInput={(e) =>
                        chapterSearchQuery.value = e.currentTarget.value}
                      placeholder="    搜索章节..."
                      className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                    />
                  </div>
                </div>

                {filteredChapters.value.length === 0
                  ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-lg font-medium">
                        {chapterSearchQuery.value
                          ? "没有找到匹配的章节"
                          : "暂无章节"}
                      </p>
                      {chapterSearchQuery.value && (
                        <p className="text-gray-400 text-sm mt-2">
                          试试其他关键词或清空搜索条件
                        </p>
                      )}
                    </div>
                  )
                  : (
                    <>
                      <div className="space-y-3">
                        {(showAllChapters.value ? filteredChapters.value : currentChapters).map((chapter, index) => {
                          const actualIndex = showAllChapters.value ? index : startIndex + index;
                          return (
                            <div
                              key={chapter.chapterUid}
                              className="group bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 p-4 hover:bg-white"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 mr-4">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-lg">
                                      {String(actualIndex + 1).padStart(3, "0")}
                                    </span>
                                    {!chapter.isFree && (
                                      <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-medium rounded-lg flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        付费
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors duration-300 line-clamp-2 text-sm md:text-base leading-relaxed">
                                    {chapter.title}
                                  </h3>
                                  {chapter.wordCount && (
                                    <p className="text-xs text-gray-600 mt-1 flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                      </svg>
                                      约 {chapter.wordCount.toLocaleString()} 字
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {isLoggedIn.value ? (
                                    <>
                                      <button
                                        onClick={() => openReader(chapter.chapterUid)}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center text-sm"
                                      >
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                        阅读
                                      </button>
                                      <button
                                        onClick={() => downloadChapter(chapter)}
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center text-sm"
                                      >
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        下载
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <a
                                        href="/login"
                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center text-sm"
                                      >
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                        阅读
                                      </a>
                                      <button
                                        onClick={() => alert("请先登录以使用下载功能")}
                                        className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed flex items-center text-sm"
                                      >
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        下载
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 分页控件 - 只在非全部显示模式下显示 */}
                      {!showAllChapters.value && totalPages > 1 && (
                        <div className="flex items-center justify-between mt-8 pt-6">
                          <div className="text-sm text-gray-600">
                            显示 {startIndex + 1} - {Math.min(endIndex, filteredChapters.value.length)} 共 {filteredChapters.value.length} 个章节
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => currentPage.value = Math.max(1, currentPage.value - 1)}
                              disabled={currentPage.value === 1}
                              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                              上一页
                            </button>
                            
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage.value <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage.value >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage.value - 2 + i;
                                }
                                
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => currentPage.value = pageNum}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                                      currentPage.value === pageNum
                                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <button
                              onClick={() => currentPage.value = Math.min(totalPages, currentPage.value + 1)}
                              disabled={currentPage.value === totalPages}
                              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                              下一页
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 底部导航 */}
      <BottomNavigation currentPath={bookInfo.value ? `/book/${bookInfo.value.bookId}` : "/book"} />

      {/* 添加CSS样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 767px) {
            .book-detail-container {
              padding-bottom: 5rem !important;
            }
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          /* 自定义滚动条样式 */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #a855f7 #f1f5f9;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 12px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #a855f7, #3b82f6);
            border-radius: 6px;
            border: 2px solid #f1f5f9;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #9333ea, #2563eb);
          }
          
          .custom-scrollbar::-webkit-scrollbar-corner {
            background: #f1f5f9;
          }
          
          /* 移动端触摸优化 */
          @media (max-width: 640px) {
            .hover\\:bg-gray-50:hover {
              background-color: rgb(249 250 251);
            }
            .hover\\:bg-blue-50:hover {
              background-color: rgb(239 246 255);
            }
            .hover\\:bg-green-50:hover {
              background-color: rgb(240 253 244);
            }
          }
        `
      }} />
    </div>
  );
}
