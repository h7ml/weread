import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function ShelfComponent() {
  const books = useSignal([]);
  const user = useSignal(null);
  const loading = useSignal(true);
  const error = useSignal("");
  const viewMode = useSignal("card"); // card or table
  const searchQuery = useSignal("");
  const currentPage = useSignal(1);
  const pageSize = useSignal(20);
  const pagination = useSignal({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const selectedBooks = useSignal(new Set());
  const isManageMode = useSignal(false);
  const actionLoading = useSignal("");

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("weread_token");
    const savedUser = localStorage.getItem("weread_user");
    const savedVid = localStorage.getItem("weread_vid");

    if (!token) {
      globalThis.location.href = "/login";
      return;
    }

    // 如果有本地保存的用户信息，先显示
    if (savedUser && savedVid) {
      user.value = {
        name: savedUser,
        vid: savedVid,
      };
    }

    // 加载书架数据
    loadShelf(token);
  }, []);

  const loadShelf = async (token: string, page = 1, search = "") => {
    try {
      loading.value = true;
      console.log("Loading shelf with token:", token?.substring(0, 8) + "...");

      const params = new URLSearchParams({
        token,
        page: page.toString(),
        pageSize: pageSize.value.toString(),
      });

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/shelf?${params}`);

      console.log("Shelf API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shelf API error:", errorText);

        if (response.status === 401) {
          localStorage.clear();
          globalThis.location.href = "/login";
          return;
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Shelf API response data:", data);

      if (data.success) {
        books.value = data.data.books || [];
        pagination.value = data.data.pagination || pagination.value;
        currentPage.value = page;
        console.log("Loaded books:", books.value.length);

        // 更新用户信息
        if (data.data.user) {
          user.value = data.data.user;
          localStorage.setItem("weread_user", data.data.user.name);
          localStorage.setItem("weread_vid", data.data.user.vid.toString());
        }
      } else {
        console.error("Shelf API returned error:", data.error);
        error.value = data.error || "加载失败";
      }
    } catch (err) {
      console.error("Failed to load shelf:", err);
      error.value = `加载书架失败: ${err.message}`;
    } finally {
      loading.value = false;
    }
  };

  const handleSearch = () => {
    currentPage.value = 1;
    loadShelf(localStorage.getItem("weread_token"), 1, searchQuery.value);
  };

  const handlePageChange = (page: number) => {
    loadShelf(localStorage.getItem("weread_token"), page, searchQuery.value);
  };

  const openBookDetail = (bookId: string) => {
    globalThis.location.href = `/book/${bookId}`;
  };

  // 书架管理操作
  const performShelfAction = async (
    action: string,
    bookId: string,
    bookTitle: string = "",
  ) => {
    const token = localStorage.getItem("weread_token");
    if (!token) {
      error.value = "请先登录";
      return;
    }

    try {
      actionLoading.value = `${action}-${bookId}`;

      const response = await fetch("/api/shelf/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          bookId,
          token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 成功后刷新书架
        await loadShelf(token, currentPage.value, searchQuery.value);

        // 显示成功消息
        const messages = {
          remove: `《${bookTitle}》已从书架移除`,
          add: `《${bookTitle}》已添加到书架`,
          archive: `《${bookTitle}》已归档`,
          unarchive: `《${bookTitle}》已取消归档`,
        };

        // 简单的成功提示
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
        alertDiv.textContent = messages[action] || data.message;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
          document.body.removeChild(alertDiv);
        }, 3000);
      } else {
        // Better error messaging
        let errorMessage = data.message || data.error || "操作失败";
        if (errorMessage.includes("HTTP 403")) {
          errorMessage = "没有权限执行此操作";
        } else if (errorMessage.includes("HTTP 404")) {
          errorMessage = "书籍不存在或已被移除";
        } else if (errorMessage.includes("HTTP 401")) {
          errorMessage = "登录已过期，请重新登录";
        }
        error.value = errorMessage;
      }
    } catch (err) {
      console.error("Shelf action error:", err);
      error.value = `操作失败: ${err.message}`;
    } finally {
      actionLoading.value = "";
    }
  };

  // 切换管理模式
  const toggleManageMode = () => {
    isManageMode.value = !isManageMode.value;
    selectedBooks.value = new Set();
  };

  // 切换书籍选择
  const toggleBookSelection = (bookId: string) => {
    const newSelected = new Set(selectedBooks.value);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    selectedBooks.value = newSelected;
  };

  // 批量操作
  const performBatchAction = async (action: string) => {
    if (selectedBooks.value.size === 0) {
      error.value = "请先选择要操作的书籍";
      return;
    }

    const token = localStorage.getItem("weread_token");
    if (!token) {
      error.value = "请先登录";
      return;
    }

    try {
      actionLoading.value = `batch-${action}`;

      const promises = Array.from(selectedBooks.value).map((bookId) =>
        fetch("/api/shelf/manage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            bookId,
            token,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map((r) => r.json()));

      const successCount = results.filter((r) => r.success).length;
      const totalCount = selectedBooks.value.size;

      if (successCount > 0) {
        await loadShelf(token, currentPage.value, searchQuery.value);

        const alertDiv = document.createElement("div");
        alertDiv.className =
          "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
        alertDiv.textContent = `成功操作 ${successCount}/${totalCount} 本书`;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
          document.body.removeChild(alertDiv);
        }, 3000);
      }

      if (successCount < totalCount) {
        error.value = `部分操作失败，成功 ${successCount}/${totalCount}`;
      }

      selectedBooks.value = new Set();
      isManageMode.value = false;
    } catch (err) {
      console.error("Batch action error:", err);
      error.value = `批量操作失败: ${err.message}`;
    } finally {
      actionLoading.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">我的书架</h1>
              {user.value && (
                <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {user.value.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900">首页</a>
              <button
                onClick={toggleManageMode}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  isManageMode.value
                    ? "bg-blue-600 text-white"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                {isManageMode.value ? "取消管理" : "管理书架"}
              </button>
              <button
                onClick={() =>
                  loadShelf(
                    localStorage.getItem("weread_token"),
                    currentPage.value,
                    searchQuery.value,
                  )}
                className="text-blue-600 hover:text-blue-900"
              >
                刷新
              </button>
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

      {/* 内容区域 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 搜索和控制区域 */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* 搜索区域 */}
            <div className="flex-1 max-w-md">
              <div className="flex rounded-lg shadow-sm">
                <input
                  type="text"
                  value={searchQuery.value}
                  onInput={(e) => searchQuery.value = e.currentTarget.value}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="搜索书名或作者..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  搜索
                </button>
              </div>
            </div>

            {/* 视图切换 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">显示模式:</span>
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => viewMode.value = "card"}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode.value === "card"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-600"
                  }`}
                >
                  卡片
                </button>
                <button
                  onClick={() => viewMode.value = "table"}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode.value === "table"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-600"
                  }`}
                >
                  列表
                </button>
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          {!loading.value && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共 {pagination.value.total} 本书
                {searchQuery.value && ` | 搜索结果: ${books.value.length} 本`}
                {pagination.value.totalPages > 1 &&
                  ` | 第 ${pagination.value.page}/${pagination.value.totalPages} 页`}
              </div>

              {/* 批量操作按钮 */}
              {isManageMode.value && selectedBooks.value.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    已选择 {selectedBooks.value.size} 本书:
                  </span>
                  <button
                    onClick={() => performBatchAction("remove")}
                    disabled={actionLoading.value.startsWith("batch")}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    {actionLoading.value === "batch-remove"
                      ? "移除中..."
                      : "批量移除"}
                  </button>
                  <button
                    onClick={() => performBatchAction("archive")}
                    disabled={actionLoading.value.startsWith("batch")}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {actionLoading.value === "batch-archive"
                      ? "归档中..."
                      : "批量归档"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {loading.value && (
          <div className="text-center py-12">
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
            <p className="mt-4 text-gray-600">加载书架中...</p>
          </div>
        )}

        {error.value && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">加载失败</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error.value}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      error.value = "";
                      loadShelf(
                        localStorage.getItem("weread_token"),
                        currentPage.value,
                        searchQuery.value,
                      );
                    }}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    重试
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading.value && !error.value && books.value.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="w-24 h-24 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              >
              </path>
            </svg>
            <p className="mt-4 text-xl text-gray-600">
              {searchQuery.value ? "没有找到匹配的书籍" : "书架空空如也"}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {searchQuery.value
                ? "尝试调整搜索条件"
                : "去微信读书添加一些书籍吧"}
            </p>
            {searchQuery.value && (
              <button
                onClick={() => {
                  searchQuery.value = "";
                  handleSearch();
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                清除搜索
              </button>
            )}
          </div>
        )}

        {/* 书籍展示区域 */}
        {!loading.value && !error.value && books.value.length > 0 && (
          <div>
            {viewMode.value === "card"
              ? (
                // 卡片模式
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {books.value.map((book) => (
                    <div
                      key={book.bookId}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 relative group"
                    >
                      {/* 管理模式选择框 */}
                      {isManageMode.value && (
                        <div className="absolute top-2 left-2 z-10">
                          <input
                            type="checkbox"
                            checked={selectedBooks.value.has(book.bookId)}
                            onChange={() => toggleBookSelection(book.bookId)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {/* 书籍封面和信息 */}
                      <div
                        onClick={() =>
                          !isManageMode.value && openBookDetail(book.bookId)}
                        className={isManageMode.value ? "" : "cursor-pointer"}
                      >
                        <div className="aspect-w-3 aspect-h-4">
                          <img
                            src={book.cover}
                            alt={book.title}
                            className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.currentTarget.src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDIwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03MC41IDcwSDEyOS41VjE3MEg3MC41VjcwWiIgZmlsbD0iI0Q1RDVENS8+Cjx0ZXh0IHg9IjEwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LXNpemU9IjE0Ij7ml6DmmYLlsIE+PC90ZXh0Pgo8L3N2Zz4K";
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <h3
                            className="font-medium text-sm text-gray-900 truncate"
                            title={book.title}
                          >
                            {book.title}
                          </h3>
                          <p
                            className="text-xs text-gray-500 truncate mt-1"
                            title={book.author}
                          >
                            {book.author}
                          </p>
                          {book.readProgress !== undefined &&
                            book.readProgress > 0 && (
                            <div className="mt-2">
                              <div className="bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${
                                      Math.min(book.readProgress, 100)
                                    }%`,
                                  }}
                                >
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                已读 {Math.round(book.readProgress)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 管理按钮 */}
                      {!isManageMode.value && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white rounded-lg shadow-lg p-1 flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                performShelfAction(
                                  "remove",
                                  book.bookId,
                                  book.title,
                                );
                              }}
                              disabled={actionLoading.value ===
                                `remove-${book.bookId}`}
                              className="p-1 text-red-500 hover:bg-red-50 rounded text-xs"
                              title="移除"
                            >
                              {actionLoading.value === `remove-${book.bookId}`
                                ? "..."
                                : "🗑️"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                performShelfAction(
                                  "archive",
                                  book.bookId,
                                  book.title,
                                );
                              }}
                              disabled={actionLoading.value ===
                                `archive-${book.bookId}`}
                              className="p-1 text-yellow-500 hover:bg-yellow-50 rounded text-xs"
                              title="归档"
                            >
                              {actionLoading.value === `archive-${book.bookId}`
                                ? "..."
                                : "📦"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
              : (
                // 表格模式
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {/* 选择框列 */}
                        {isManageMode.value && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedBooks.value.size ===
                                  books.value.length && books.value.length > 0}
                              onChange={() => {
                                if (
                                  selectedBooks.value.size ===
                                    books.value.length
                                ) {
                                  selectedBooks.value = new Set();
                                } else {
                                  selectedBooks.value = new Set(
                                    books.value.map((b) => b.bookId),
                                  );
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          书籍
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          作者
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          阅读进度
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {books.value.map((book) => (
                        <tr
                          key={book.bookId}
                          className="hover:bg-gray-50"
                        >
                          {/* 选择框 */}
                          {isManageMode.value && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedBooks.value.has(book.bookId)}
                                onChange={() =>
                                  toggleBookSelection(book.bookId)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                          )}

                          <td
                            className={`px-6 py-4 whitespace-nowrap ${
                              !isManageMode.value ? "cursor-pointer" : ""
                            }`}
                            onClick={() =>
                              !isManageMode.value &&
                              openBookDetail(book.bookId)}
                          >
                            <div className="flex items-center">
                              <img
                                src={book.cover}
                                alt={book.title}
                                className="h-12 w-8 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMSAxNkgyMVYzMkgxMVYxNloiIGZpbGw9IiNENUQ1RDUiLz4KPC9zdmc+Cg==";
                                }}
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {book.title}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {book.author}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {book.readProgress !== undefined &&
                                book.readProgress > 0
                              ? (
                                <div className="flex items-center">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{
                                        width: `${
                                          Math.min(book.readProgress, 100)
                                        }%`,
                                      }}
                                    >
                                    </div>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {Math.round(book.readProgress)}%
                                  </span>
                                </div>
                              )
                              : (
                                <span className="text-sm text-gray-400">
                                  未开始
                                </span>
                              )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              {!isManageMode.value && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openBookDetail(book.bookId);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  查看详情
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  performShelfAction(
                                    "remove",
                                    book.bookId,
                                    book.title,
                                  );
                                }}
                                disabled={actionLoading.value ===
                                  `remove-${book.bookId}`}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                {actionLoading.value === `remove-${book.bookId}`
                                  ? "移除中..."
                                  : "移除"}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  performShelfAction(
                                    "archive",
                                    book.bookId,
                                    book.title,
                                  );
                                }}
                                disabled={actionLoading.value ===
                                  `archive-${book.bookId}`}
                                className="text-yellow-600 hover:text-yellow-800 disabled:opacity-50"
                              >
                                {actionLoading.value ===
                                    `archive-${book.bookId}`
                                  ? "归档中..."
                                  : "归档"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* 分页 */}
            {pagination.value.totalPages > 1 && (
              <div className="mt-6 bg-white rounded-lg shadow px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    显示第{" "}
                    {((pagination.value.page - 1) * pagination.value.pageSize) +
                      1} - {Math.min(
                        pagination.value.page * pagination.value.pageSize,
                        pagination.value.total,
                      )} 项， 共 {pagination.value.total} 项
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handlePageChange(pagination.value.page - 1)}
                      disabled={!pagination.value.hasPrev}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      上一页
                    </button>
                    <span className="text-sm text-gray-700">
                      第 {pagination.value.page} 页，共{" "}
                      {pagination.value.totalPages} 页
                    </span>
                    <button
                      onClick={() =>
                        handlePageChange(pagination.value.page + 1)}
                      disabled={!pagination.value.hasNext}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
