/** @jsx h */
import { h } from "preact";
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function ReaderComponent() {
  const bookId = useSignal("");
  const chapterUid = useSignal("");
  const content = useSignal("");
  const chapterTitle = useSignal("");
  const chapters = useSignal([]);
  const currentChapterIndex = useSignal(0);
  const loading = useSignal(true);
  const error = useSignal("");
  const fontSize = useSignal(16);
  const lineHeight = useSignal(1.8);
  const theme = useSignal("light"); // light, dark, sepia
  const showSettings = useSignal(false);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("weread_token");
    if (!token) {
      globalThis.location.href = "/login";
      return;
    }

    // 从URL获取参数
    const path = globalThis.location.pathname;
    const parts = path.split("/");
    const bookIdFromUrl = parts[2];
    const chapterUidFromUrl = parts[3];

    if (!bookIdFromUrl || !chapterUidFromUrl) {
      error.value = "缺少必要参数";
      loading.value = false;
      return;
    }

    bookId.value = bookIdFromUrl;
    chapterUid.value = chapterUidFromUrl;

    // 加载数据
    loadChapterContent(token, bookIdFromUrl, chapterUidFromUrl);
    loadChapterList(token, bookIdFromUrl);

    // 加载阅读设置
    loadReaderSettings();
  }, []);

  const loadChapterContent = async (
    token: string,
    bookId: string,
    chapterUid: string,
  ) => {
    try {
      const response = await fetch(
        `/api/book/content?bookId=${bookId}&chapterUid=${chapterUid}&token=${token}`,
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          globalThis.location.href = "/login";
          return;
        }
        throw new Error(`加载章节失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        content.value = processContentForDisplay(data.data.content);
      } else {
        error.value = data.error || "加载失败";
      }
    } catch (err) {
      console.error("Failed to load chapter content:", err);
      error.value = `加载章节内容失败: ${err.message}`;
    }
  };

  const processContentForDisplay = (rawContent: string) => {
    // 处理HTML内容以优化显示
    let processedContent = rawContent;

    // 处理图片：确保图片正确加载
    processedContent = processedContent.replace(
      /<img([^>]*?)src="([^"]*)"([^>]*?)>/g,
      (_match, before, src, after) => {
        let finalSrc = src;

        // 处理各种图片URL格式
        if (src.startsWith("//")) {
          // 协议相对URL：//res.weread.qq.com/...
          finalSrc = "https:" + src;
        } else if (src.startsWith("/") && !src.startsWith("//")) {
          // 绝对路径：/weread/cover/...
          finalSrc = "https://res.weread.qq.com" + src;
        } else if (
          src.startsWith("https://res.weread.qq.com/") ||
          src.startsWith("https://cdn.weread.qq.com/") ||
          src.startsWith("https://weread-1258476243.file.myqcloud.com/")
        ) {
          // 已经是完整的WeRead URL，保持不变
          finalSrc = src;
        } else if (!src.startsWith("http")) {
          // 相对路径，添加WeRead域名
          finalSrc = "https://res.weread.qq.com/" + src.replace(/^\.\//, "");
        }

        // 添加图片加载优化属性
        return `<img${before}src="${finalSrc}"${after} style="max-width: 100%; height: auto; margin: 1em auto; display: block;" onerror="console.warn('Image failed to load:', this.src); this.style.opacity='0.5'; this.alt='图片加载失败';" loading="lazy">`;
      },
    );

    // 移除空白图片占位符
    processedContent = processedContent.replace(/<img[^>]*src=""[^>]*>/g, "");

    // 处理data-src属性（延迟加载的图片）
    processedContent = processedContent.replace(
      /data-src="([^"]*)"/g,
      'src="$1"',
    );

    // 增强CSS样式
    if (processedContent.includes("<style>")) {
      processedContent = processedContent.replace(
        "</style>",
        `
        /* 图片增强样式 */
        .bodyPic, .qrbodyPic {
          text-align: center !important;
          margin: 1.5em auto !important;
          padding: 0.5em;
        }
        .bodyPic img, .qrbodyPic img {
          max-width: 100% !important;
          height: auto !important;
          margin: 0 auto !important;
          display: block !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-radius: 8px;
          transition: transform 0.2s ease;
        }
        .bodyPic img:hover, .qrbodyPic img:hover {
          transform: scale(1.02);
        }
        .frontCover {
          text-align: center !important;
          margin: 2em auto !important;
        }
        .frontCover img {
          max-width: 400px !important;
          width: 80% !important;
          margin: 2em auto !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          border-radius: 8px;
        }
        /* 图片标题样式 */
        .imgtitle {
          text-align: center !important;
          font-size: 0.9em !important;
          color: #666 !important;
          margin-top: 0.5em !important;
          font-style: italic;
        }
        </style>`,
      );
    } else {
      // 如果没有<style>标签，添加一个基本的样式块
      processedContent = `<style>
        .reader-content img {
          max-width: 100% !important;
          height: auto !important;
          margin: 1em auto !important;
          display: block !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-radius: 8px;
        }
        .frontCover img {
          max-width: 400px !important;
          width: 80% !important;
        }
      </style>` + processedContent;
    }

    return processedContent;
  };

  const loadChapterList = async (token: string, bookId: string) => {
    try {
      const response = await fetch(
        `/api/book/chapters?bookId=${bookId}&token=${token}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          chapters.value = data.data.chapters || [];

          // 找到当前章节的索引和标题
          const index = chapters.value.findIndex((ch) =>
            ch.chapterUid === chapterUid.value
          );
          if (index >= 0) {
            currentChapterIndex.value = index;
            chapterTitle.value = chapters.value[index].title;
          }
        }
      }
    } catch (err) {
      console.error("Failed to load chapters:", err);
    } finally {
      loading.value = false;
    }
  };

  const loadReaderSettings = () => {
    const savedFontSize = localStorage.getItem("reader_fontSize");
    const savedLineHeight = localStorage.getItem("reader_lineHeight");
    const savedTheme = localStorage.getItem("reader_theme");

    if (savedFontSize) fontSize.value = parseInt(savedFontSize);
    if (savedLineHeight) lineHeight.value = parseFloat(savedLineHeight);
    if (savedTheme) theme.value = savedTheme;
  };

  const saveReaderSettings = () => {
    localStorage.setItem("reader_fontSize", fontSize.value.toString());
    localStorage.setItem("reader_lineHeight", lineHeight.value.toString());
    localStorage.setItem("reader_theme", theme.value);
  };

  const navigateToChapter = async (direction: "prev" | "next") => {
    let newIndex;
    if (direction === "prev") {
      newIndex = Math.max(0, currentChapterIndex.value - 1);
    } else {
      newIndex = Math.min(
        chapters.value.length - 1,
        currentChapterIndex.value + 1,
      );
    }

    if (newIndex !== currentChapterIndex.value) {
      const newChapter = chapters.value[newIndex];

      // 更新当前状态
      currentChapterIndex.value = newIndex;
      chapterUid.value = newChapter.chapterUid;
      chapterTitle.value = newChapter.title;
      loading.value = true;
      content.value = "";

      // 更新URL但不重新加载页面
      globalThis.history.pushState(
        {},
        "",
        `/reader/${bookId.value}/${newChapter.chapterUid}`,
      );

      // 加载新章节内容
      const token = localStorage.getItem("weread_token");
      if (token) {
        await loadChapterContent(token, bookId.value, newChapter.chapterUid);
      }
      loading.value = false;
    }
  };

  const getThemeClasses = () => {
    switch (theme.value) {
      case "dark":
        return "bg-gray-900 text-gray-100";
      case "sepia":
        return "bg-yellow-50 text-gray-800";
      default:
        return "bg-white text-gray-900";
    }
  };

  const getReaderContentStyle = () => {
    return {
      fontSize: `${fontSize.value}px`,
      lineHeight: lineHeight.value.toString(),
    };
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
          <div className="mt-4 space-x-4">
            <button
              onClick={() => globalThis.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回
            </button>
            <button
              onClick={() => globalThis.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${getThemeClasses()}`}>
      {/* 阅读器工具栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => globalThis.history.back()}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              ← 返回
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {chapterTitle.value && (
                <span className="font-medium">{chapterTitle.value}</span>
              )}
              {chapters.value.length > 0 && (
                <span className="ml-2">
                  ({currentChapterIndex.value + 1}/{chapters.value.length})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 章节导航 */}
            <button
              onClick={() => navigateToChapter("prev")}
              disabled={currentChapterIndex.value === 0}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一章
            </button>
            <button
              onClick={() => navigateToChapter("next")}
              disabled={currentChapterIndex.value === chapters.value.length - 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一章
            </button>

            {/* 设置按钮 */}
            <button
              onClick={() => showSettings.value = !showSettings.value}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              设置
            </button>
          </div>
        </div>

        {/* 设置面板 */}
        {showSettings.value && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 字体大小 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  字体大小: {fontSize.value}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  value={fontSize.value}
                  onInput={(e) => {
                    fontSize.value = parseInt(e.currentTarget.value);
                    saveReaderSettings();
                  }}
                  className="w-full"
                />
              </div>

              {/* 行高 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  行高: {lineHeight.value}
                </label>
                <input
                  type="range"
                  min="1.2"
                  max="3.0"
                  step="0.1"
                  value={lineHeight.value}
                  onInput={(e) => {
                    lineHeight.value = parseFloat(e.currentTarget.value);
                    saveReaderSettings();
                  }}
                  className="w-full"
                />
              </div>

              {/* 主题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  阅读主题
                </label>
                <div className="flex space-x-2">
                  {["light", "dark", "sepia"].map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => {
                        theme.value = themeOption;
                        saveReaderSettings();
                      }}
                      className={`px-3 py-1 text-sm border rounded ${
                        theme.value === themeOption
                          ? "bg-blue-600 text-white border-blue-600"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {themeOption === "light"
                        ? "明亮"
                        : themeOption === "dark"
                        ? "夜间"
                        : "护眼"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 阅读内容 */}
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {chapterTitle.value && (
            <h1 className="text-2xl font-bold mb-8 text-center">
              {chapterTitle.value}
            </h1>
          )}

          <div
            className="reader-content max-w-none"
            style={{
              ...getReaderContentStyle(),
              lineHeight: lineHeight.value,
              fontSize: `${fontSize.value}px`,
            }}
            dangerouslySetInnerHTML={{ __html: content.value }}
          />

          {/* 章节导航 */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigateToChapter("prev")}
              disabled={currentChapterIndex.value === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 上一章
            </button>

            <div className="text-sm text-gray-500">
              第 {currentChapterIndex.value + 1} 章 / 共 {chapters.value.length}
              {" "}
              章
            </div>

            <button
              onClick={() => navigateToChapter("next")}
              disabled={currentChapterIndex.value === chapters.value.length - 1}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一章 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
