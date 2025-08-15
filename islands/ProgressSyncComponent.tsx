import { useSignal } from "@preact/signals";

interface ProgressSyncProps {
  bookId: string;
  currentChapterUid?: string;
  currentChapterOffset?: number;
  onProgressUpdate?: (progress: any) => void;
}

export default function ProgressSyncComponent({
  bookId,
  currentChapterUid,
  currentChapterOffset,
  onProgressUpdate,
}: ProgressSyncProps) {
  const syncLoading = useSignal(false);
  const updateLoading = useSignal(false);
  const message = useSignal("");
  const lastSyncTime = useSignal<Date | null>(null);
  const progress = useSignal<any>(null);

  // 获取阅读进度
  const syncProgress = async () => {
    const token = localStorage.getItem("weread_token");
    if (!token) {
      message.value = "请先登录";
      return;
    }

    try {
      syncLoading.value = true;
      message.value = "";

      const params = new URLSearchParams({
        token,
        bookId,
      });

      const response = await fetch(`/api/progress?${params}`);
      const data = await response.json();

      if (data.success) {
        progress.value = data.data;
        lastSyncTime.value = new Date();
        message.value = `同步成功：当前进度 ${
          Math.round(data.data.percent || 0)
        }%`;

        if (onProgressUpdate) {
          onProgressUpdate(data.data);
        }
      } else {
        // Handle different types of errors more gracefully
        if (response.status === 404) {
          message.value = "此书籍暂无阅读进度记录";
        } else if (response.status === 401) {
          message.value = "登录已过期，请重新登录";
        } else {
          message.value = data.error || "同步失败";
        }
      }
    } catch (error) {
      console.error("Progress sync error:", error);
      message.value = `同步失败: ${error.message}`;
    } finally {
      syncLoading.value = false;
    }
  };

  // 更新阅读进度到微信读书
  const updateProgress = async () => {
    const token = localStorage.getItem("weread_token");
    if (!token) {
      message.value = "请先登录";
      return;
    }

    if (!currentChapterUid || currentChapterOffset === undefined) {
      message.value = "当前章节信息不完整，无法更新进度";
      return;
    }

    try {
      updateLoading.value = true;
      message.value = "";

      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId,
          chapterUid: currentChapterUid,
          chapterOffset: currentChapterOffset,
          token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.value = "进度更新成功";
        // 更新后重新同步进度
        setTimeout(() => syncProgress(), 1000);
      } else {
        message.value = data.error || "更新失败";
      }
    } catch (error) {
      console.error("Progress update error:", error);
      message.value = `更新失败: ${error.message}`;
    } finally {
      updateLoading.value = false;
    }
  };

  // 自动同步进度（在组件挂载时）
  const autoSync = async () => {
    const lastSync = localStorage.getItem(`progress_sync_${bookId}`);
    const now = Date.now();

    // 如果超过30分钟没有同步，则自动同步
    if (!lastSync || now - parseInt(lastSync) > 30 * 60 * 1000) {
      await syncProgress();
      localStorage.setItem(`progress_sync_${bookId}`, now.toString());
    }
  };

  // 组件挂载时自动同步
  if (typeof window !== "undefined") {
    setTimeout(autoSync, 1000);
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          阅读进度同步
        </h3>

        {lastSyncTime.value && (
          <span className="text-xs text-gray-500">
            上次同步: {lastSyncTime.value.toLocaleTimeString()}
          </span>
        )}
      </div>

      {progress.value && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              当前进度: {Math.round(progress.value.percent || 0)}%
            </span>
            {progress.value.readingTime && (
              <span className="text-xs text-blue-600">
                阅读时长: {Math.round(progress.value.readingTime / 60)}分钟
              </span>
            )}
          </div>
          <div className="bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(progress.value.percent || 0, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <button
          onClick={syncProgress}
          disabled={syncLoading.value}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {syncLoading.value
            ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                同步中...
              </div>
            )
            : (
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                从微信读书同步
              </div>
            )}
        </button>

        <button
          onClick={updateProgress}
          disabled={updateLoading.value || !currentChapterUid}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title={!currentChapterUid ? "需要打开书籍章节才能更新进度" : ""}
        >
          {updateLoading.value
            ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                更新中...
              </div>
            )
            : (
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4 4m0 0l-4 4m4-4H8"
                  />
                </svg>
                更新到微信读书
              </div>
            )}
        </button>
      </div>

      {message.value && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.value.includes("成功")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            <svg
              className={`w-4 h-4 mr-2 ${
                message.value.includes("成功")
                  ? "text-green-400"
                  : "text-red-400"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {message.value.includes("成功")
                ? (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                )
                : (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                )}
            </svg>
            <span className="font-medium">{message.value}</span>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 提示：</p>
        <ul className="mt-1 space-y-1 ml-4">
          <li>• 同步功能会自动获取您在微信读书的最新阅读进度</li>
          <li>• 更新功能会将当前页面进度保存到微信读书</li>
          <li>• 每30分钟会自动同步一次进度</li>
        </ul>
      </div>
    </div>
  );
}
