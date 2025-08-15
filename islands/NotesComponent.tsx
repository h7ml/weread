import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

// Tab配置
const TABS_CONFIG = [
  { key: "notes", label: "笔记", icon: "📝" },
  { key: "bookmarks", label: "书签", icon: "🔖" },
  { key: "reviews", label: "书评", icon: "✍️" },
];

// 笔记类型配置
const NOTE_TYPE_OPTIONS = [
  { value: "all", label: "全部类型" },
  { value: "underline", label: "划线", typeValue: "1" },
  { value: "thought", label: "想法", typeValue: "2" },
  { value: "bookmark", label: "书签", typeValue: "3" },
];

// 笔记类型图标映射
const NOTE_TYPE_ICONS = {
  1: "🖍️", // 划线
  2: "💭", // 想法
  3: "🔖", // 书签
  default: "📝",
};

// 颜色样式配置
const COLOR_STYLES = [
  "border-l-yellow-400 bg-yellow-50",
  "border-l-green-400 bg-green-50",
  "border-l-blue-400 bg-blue-50",
  "border-l-purple-400 bg-purple-50",
  "border-l-pink-400 bg-pink-50",
  "border-l-red-400 bg-red-50",
  "border-l-indigo-400 bg-indigo-50",
  "border-l-gray-400 bg-gray-50",
];

// 导航链接配置
const NAV_LINKS = [
  { href: "/shelf", label: "我的书架" },
  { href: "/dashboard", label: "阅读统计" },
];

// 空状态配置
const EMPTY_STATES = {
  notes: {
    icon: "📝",
    title: "暂无笔记",
    description: "开始阅读并做笔记吧！",
  },
  bookmarks: {
    icon: "🔖", 
    title: "暂无书签",
    description: "在阅读时添加书签标记重要位置！",
  },
  reviews: {
    icon: "✍️",
    title: "暂无书评", 
    description: "读完书籍后写下你的感受吧！",
  },
};

export default function NotesComponent() {
  const notes = useSignal([]);
  const bookmarks = useSignal([]);
  const reviews = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const activeTab = useSignal("notes");
  const searchQuery = useSignal("");
  const selectedNoteType = useSignal("all"); // all, underline, thought, bookmark
  const selectedBook = useSignal("");
  const currentPage = useSignal(1);
  const hasMore = useSignal(true);

  useEffect(() => {
    loadNotesData();
  }, [
    activeTab.value,
    selectedNoteType.value,
    selectedBook.value,
    currentPage.value,
  ]);

  const loadNotesData = async () => {
    const token = localStorage.getItem("weread_token");
    if (!token) {
      globalThis.location.href = "/login";
      return;
    }

    try {
      loading.value = true;

      if (activeTab.value === "notes") {
        const params = new URLSearchParams({
          token,
          page: currentPage.value.toString(),
          pageSize: "20",
        });

        if (selectedNoteType.value !== "all") {
          const noteTypeOption = NOTE_TYPE_OPTIONS.find(opt => opt.value === selectedNoteType.value);
          if (noteTypeOption?.typeValue) {
            params.append("noteType", noteTypeOption.typeValue);
          }
        }

        if (selectedBook.value) {
          params.append("bookId", selectedBook.value);
        }

        const response = await fetch(`/api/notes/all?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (currentPage.value === 1) {
            notes.value = data.data?.notes || [];
          } else {
            notes.value = [...notes.value, ...(data.data?.notes || [])];
          }
          hasMore.value = data.data?.hasMore || false;
        }
      } else if (activeTab.value === "bookmarks") {
        const response = await fetch(`/api/notes/bookmarks?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          bookmarks.value = data.data || [];
        }
      } else if (activeTab.value === "reviews") {
        const response = await fetch(
          `/api/notes/reviews?token=${token}&page=${currentPage.value}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (currentPage.value === 1) {
            reviews.value = data.data?.reviews || [];
          } else {
            reviews.value = [...reviews.value, ...(data.data?.reviews || [])];
          }
          hasMore.value = data.data?.hasMore || false;
        }
      }
    } catch (err) {
      console.error("Failed to load notes data:", err);
      error.value = "加载笔记数据失败";
    } finally {
      loading.value = false;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.value.trim()) {
      currentPage.value = 1;
      loadNotesData();
      return;
    }

    const token = localStorage.getItem("weread_token");
    try {
      loading.value = true;

      const params = new URLSearchParams({
        token,
        keyword: searchQuery.value,
        page: "1",
        pageSize: "20",
      });

      const response = await fetch(`/api/notes/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        notes.value = data.data?.notes || [];
        hasMore.value = data.data?.hasMore || false;
        currentPage.value = 1;
      }
    } catch (err) {
      console.error("Search failed:", err);
      error.value = "搜索失败";
    } finally {
      loading.value = false;
    }
  };

  const toggleNoteFavorite = async (noteId, isFavorite) => {
    const token = localStorage.getItem("weread_token");
    try {
      const response = await fetch("/api/notes/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, isFavorite: !isFavorite, token }),
      });

      if (response.ok) {
        // 更新本地状态
        notes.value = notes.value.map((note) =>
          note.noteId === noteId ? { ...note, isFavorite: !isFavorite } : note
        );
      }
    } catch (err) {
      console.error("Toggle favorite failed:", err);
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm("确定要删除这条笔记吗？")) return;

    const token = localStorage.getItem("weread_token");
    try {
      const response = await fetch("/api/notes/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, token }),
      });

      if (response.ok) {
        notes.value = notes.value.filter((note) => note.noteId !== noteId);
      }
    } catch (err) {
      console.error("Delete note failed:", err);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNoteTypeIcon = (noteType) => {
    return NOTE_TYPE_ICONS[noteType] || NOTE_TYPE_ICONS.default;
  };

  const getColorStyleClass = (colorStyle) => {
    return COLOR_STYLES[colorStyle] || COLOR_STYLES[0];
  };

  const loadMore = () => {
    currentPage.value += 1;
  };

  // 渲染空状态的辅助函数
  const renderEmptyState = (tabKey: string) => {
    const emptyState = EMPTY_STATES[tabKey];
    if (!emptyState) return null;
    
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{emptyState.icon}</div>
        <p className="text-gray-500">{emptyState.title}</p>
        <p className="text-sm text-gray-400 mt-2">{emptyState.description}</p>
      </div>
    );
  };

  if (loading.value && currentPage.value === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4">
          </div>
          <p className="text-gray-600">加载笔记中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* 顶部导航 */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-green-600 hover:text-green-800 mr-6">
                ← 返回首页
              </a>
              <h1 className="text-xl font-bold text-gray-900">笔记管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="text-gray-600 hover:text-gray-900">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 搜索和筛选区域 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* 搜索框 */}
            <div className="flex-1 max-w-md">
              <div className="flex rounded-lg shadow-sm">
                <input
                  type="text"
                  value={searchQuery.value}
                  onInput={(e) => searchQuery.value = e.currentTarget.value}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="搜索笔记内容..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                >
                  搜索
                </button>
              </div>
            </div>

            {/* 筛选器 */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedNoteType.value}
                onChange={(e) => {
                  selectedNoteType.value = e.currentTarget.value;
                  currentPage.value = 1;
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {NOTE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab导航 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {TABS_CONFIG.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    activeTab.value = tab.key;
                    currentPage.value = 1;
                  }}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab.value === tab.key
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 笔记列表 */}
            {activeTab.value === "notes" && (
              <div className="space-y-4">
                {notes.value.length > 0
                  ? (
                    <>
                      {notes.value.map((note) => (
                        <div
                          key={note.noteId}
                          className={`border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                            getColorStyleClass(note.colorStyle)
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">
                                  {getNoteTypeIcon(note.noteType)}
                                </span>
                                <h4 className="font-medium text-gray-900">
                                  {note.chapterTitle}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  #{note.chapterIdx}
                                </span>
                              </div>

                              {note.originalText && (
                                <blockquote className="border-l-2 border-gray-300 pl-3 mb-3 text-gray-600 italic">
                                  "{note.originalText}"
                                </blockquote>
                              )}

                              {note.content && (
                                <p className="text-gray-800 mb-3">
                                  {note.content}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{formatDate(note.createTime)}</span>
                                <div className="flex items-center space-x-2">
                                  {note.isPublic && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      公开
                                    </span>
                                  )}
                                  {note.isFavorite && (
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                      收藏
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() =>
                                  toggleNoteFavorite(
                                    note.noteId,
                                    note.isFavorite,
                                  )}
                                className={`p-1 rounded ${
                                  note.isFavorite
                                    ? "text-yellow-500"
                                    : "text-gray-400 hover:text-yellow-500"
                                }`}
                              >
                                ⭐
                              </button>
                              <button
                                onClick={() => deleteNote(note.noteId)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {hasMore.value && (
                        <div className="text-center py-6">
                          <button
                            onClick={loadMore}
                            disabled={loading.value}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {loading.value ? "加载中..." : "加载更多"}
                          </button>
                        </div>
                      )}
                    </>
                  )
                  : renderEmptyState("notes")}
              </div>
            )}

            {/* 书签列表 */}
            {activeTab.value === "bookmarks" && (
              <div className="space-y-4">
                {bookmarks.value.length > 0
                  ? (
                    bookmarks.value.map((bookmark) => (
                      <div
                        key={bookmark.bookmarkId}
                        className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">🔖</span>
                              <h4 className="font-medium text-gray-900">
                                {bookmark.chapterTitle}
                              </h4>
                              <span className="text-xs text-gray-500">
                                #{bookmark.chapterIdx}
                              </span>
                            </div>

                            {bookmark.content && (
                              <p className="text-gray-600 mb-2">
                                {bookmark.content}
                              </p>
                            )}

                            <p className="text-xs text-gray-500">
                              {formatDate(bookmark.createTime)}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              // 跳转到书籍对应位置
                              globalThis.location.href =
                                `/book/${bookmark.bookId}?chapter=${bookmark.chapterUid}&offset=${bookmark.chapterOffset}`;
                            }}
                            className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            查看
                          </button>
                        </div>
                      </div>
                    ))
                  )
                  : renderEmptyState("bookmarks")}
              </div>
            )}

            {/* 书评列表 */}
            {activeTab.value === "reviews" && (
              <div className="space-y-4">
                {reviews.value.length > 0
                  ? (
                    <>
                      {reviews.value.map((review) => (
                        <div
                          key={review.reviewId}
                          className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-3">
                                <span className="text-lg">✍️</span>
                                <div className="flex items-center">
                                  {Array.from(
                                    { length: 5 },
                                    (_, i) => (
                                      <span
                                        key={i}
                                        className={`text-sm ${
                                          i < review.rating
                                            ? "text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      >
                                        ⭐
                                      </span>
                                    ),
                                  )}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {review.rating}/5
                                </span>
                                {review.isPublic && (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    公开
                                  </span>
                                )}
                              </div>

                              <p className="text-gray-800 mb-4 leading-relaxed">
                                {review.content}
                              </p>

                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>{formatDate(review.createTime)}</span>
                                <div className="flex items-center space-x-4">
                                  <span>👍 {review.likeCount}</span>
                                  <span>💬 {review.commentCount}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {hasMore.value && (
                        <div className="text-center py-6">
                          <button
                            onClick={loadMore}
                            disabled={loading.value}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {loading.value ? "加载中..." : "加载更多"}
                          </button>
                        </div>
                      )}
                    </>
                  )
                  : renderEmptyState("reviews")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
