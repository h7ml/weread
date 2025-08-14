/** @jsx h */
import { h } from "preact";
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function BookDetailComponent() {
  const bookInfo = useSignal(null);
  const chapters = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const chaptersLoading = useSignal(false);
  const showChapters = useSignal(false);
  const chapterSearchQuery = useSignal("");
  const filteredChapters = useSignal([]);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("weread_token");
    if (!token) {
      globalThis.location.href = "/login";
      return;
    }

    // 从URL获取书籍ID
    const path = globalThis.location.pathname;
    const bookId = path.split("/").pop();

    if (!bookId) {
      error.value = "缺少书籍ID";
      loading.value = false;
      return;
    }

    // 加载书籍详情
    loadBookDetail(token, bookId);
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
  }, [chapters.value, chapterSearchQuery.value]);

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

  const loadChapters = async () => {
    if (!bookInfo.value) return;

    try {
      chaptersLoading.value = true;
      const token = localStorage.getItem("weread_token");

      const response = await fetch(
        `/api/book/chapters?bookId=${bookInfo.value.bookId}&token=${token}`,
      );

      if (!response.ok) {
        throw new Error(`获取章节列表失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        chapters.value = data.data.chapters || [];
        showChapters.value = true;
      } else {
        throw new Error(data.error || "加载失败");
      }
    } catch (err) {
      console.error("Failed to load chapters:", err);
      alert(`加载章节列表失败: ${err.message}`);
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
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => globalThis.history.back()}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← 返回
              </button>
              <h1 className="text-xl font-semibold">书籍详情</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/shelf" className="text-gray-600 hover:text-gray-900">
                书架
              </a>
              <button
                onClick={() => {
                  localStorage.clear();
                  globalThis.location.href = "/login";
                }}
                className="text-red-600 hover:text-red-900"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {bookInfo.value && (
          <div>
            {/* 书籍信息卡片 */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={bookInfo.value.cover}
                    alt={bookInfo.value.title}
                    className="w-48 h-64 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.currentTarget.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDE5MiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA2NEgxMjhWMTkySDY0VjY0WiIgZmlsbD0iI0Q1RDVENCY+Cjx0ZXh0IHg9Ijk2IiB5PSIyMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjcyODAiIGZvbnQtc2l6ZT0iMTYiPuaXoOaaguWwgTwvdGV4dD4KPC9zdmc+Cg==";
                    }}
                  />
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {bookInfo.value.title}
                  </h1>

                  <div className="space-y-3 text-gray-600">
                    <div className="flex items-center">
                      <span className="font-medium w-16">作者:</span>
                      <span>{bookInfo.value.author}</span>
                    </div>

                    {bookInfo.value.category && (
                      <div className="flex items-center">
                        <span className="font-medium w-16">分类:</span>
                        <span>{bookInfo.value.category}</span>
                      </div>
                    )}

                    {bookInfo.value.totalWords && (
                      <div className="flex items-center">
                        <span className="font-medium w-16">字数:</span>
                        <span>
                          {bookInfo.value.totalWords.toLocaleString()} 字
                        </span>
                      </div>
                    )}

                    {bookInfo.value.rating && (
                      <div className="flex items-center">
                        <span className="font-medium w-16">评分:</span>
                        <span>{bookInfo.value.rating} 分</span>
                      </div>
                    )}
                  </div>

                  {bookInfo.value.intro && (
                    <div className="mt-4">
                      <h3 className="font-medium text-gray-900 mb-2">简介</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {bookInfo.value.intro}
                      </p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="mt-6 flex flex-wrap gap-4">
                    <button
                      onClick={loadChapters}
                      disabled={chaptersLoading.value}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {chaptersLoading.value
                        ? "加载中..."
                        : showChapters.value
                        ? "刷新章节"
                        : "查看章节"}
                    </button>

                    {chapters.value.length > 0 && (
                      <button
                        onClick={downloadAllChapters}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        下载全书
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 章节列表 */}
            {showChapters.value && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    章节列表 ({filteredChapters.value.length})
                  </h2>

                  {/* 章节搜索 */}
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      value={chapterSearchQuery.value}
                      onInput={(e) =>
                        chapterSearchQuery.value = e.currentTarget.value}
                      placeholder="搜索章节..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {filteredChapters.value.length === 0
                  ? (
                    <div className="text-center py-8 text-gray-500">
                      {chapterSearchQuery.value
                        ? "没有找到匹配的章节"
                        : "暂无章节"}
                    </div>
                  )
                  : (
                    <div className="grid gap-2">
                      {filteredChapters.value.map((chapter, index) => (
                        <div
                          key={chapter.chapterUid}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500 w-12">
                                {String(index + 1).padStart(3, "0")}
                              </span>
                              <h3 className="font-medium text-gray-900">
                                {chapter.title}
                              </h3>
                              {!chapter.isFree && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                  付费
                                </span>
                              )}
                            </div>
                            {chapter.wordCount && (
                              <p className="text-sm text-gray-500 mt-1 ml-15">
                                约 {chapter.wordCount} 字
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openReader(chapter.chapterUid)}
                              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              阅读
                            </button>
                            <button
                              onClick={() => downloadChapter(chapter)}
                              className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              下载
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
