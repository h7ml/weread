import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function DashboardComponent() {
  const overallStats = useSignal(null);
  const readingTrend = useSignal([]);
  const categoryStats = useSignal([]);
  const heatmapData = useSignal(null);
  const bookStats = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const selectedPeriod = useSignal("month");
  const selectedYear = useSignal(new Date().getFullYear());

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod.value, selectedYear.value]);

  const loadDashboardData = async () => {
    const token = localStorage.getItem("weread_token");
    if (!token) {
      globalThis.location.href = "/login";
      return;
    }

    try {
      loading.value = true;

      const [
        overallRes,
        trendRes,
        categoryRes,
        heatmapRes,
        booksRes,
      ] = await Promise.all([
        fetch(`/api/stats/overall?token=${token}`),
        fetch(`/api/stats/trend?token=${token}&period=${selectedPeriod.value}`),
        fetch(`/api/stats/categories?token=${token}`),
        fetch(`/api/stats/heatmap?token=${token}&year=${selectedYear.value}`),
        fetch(`/api/stats/books?token=${token}&limit=10&sortBy=readingTime`),
      ]);

      if (overallRes.ok) {
        const data = await overallRes.json();
        overallStats.value = data.data;
      }

      if (trendRes.ok) {
        const data = await trendRes.json();
        readingTrend.value = data.data || [];
      }

      if (categoryRes.ok) {
        const data = await categoryRes.json();
        categoryStats.value = data.data || [];
      }

      if (heatmapRes.ok) {
        const data = await heatmapRes.json();
        heatmapData.value = data.data;
      }

      if (booksRes.ok) {
        const data = await booksRes.json();
        bookStats.value = data.data?.books || [];
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      error.value = "加载统计数据失败";
    } finally {
      loading.value = false;
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  const getHeatmapColor = (level) => {
    const colors = [
      "bg-gray-100",
      "bg-green-200",
      "bg-green-300",
      "bg-green-400",
      "bg-green-500",
    ];
    return colors[level] || colors[0];
  };

  const generateHeatmapGrid = () => {
    if (!heatmapData.value?.data) return [];

    const year = selectedYear.value;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const grid = [];

    const dataMap = new Map();
    heatmapData.value.data.forEach((item) => {
      dataMap.set(item.date, item);
    });

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      const data = dataMap.get(dateStr);
      grid.push({
        date: dateStr,
        level: data?.level || 0,
        count: data?.count || 0,
      });
    }

    return grid;
  };

  if (loading.value) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4">
          </div>
          <p className="text-gray-600">正在生成统计报告...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* 顶部导航 */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a
                href="/"
                className="text-purple-600 hover:text-purple-800 mr-6"
              >
                ← 返回首页
              </a>
              <h1 className="text-xl font-bold text-gray-900">阅读统计</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod.value}
                onChange={(e) => selectedPeriod.value = e.currentTarget.value}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="quarter">本季度</option>
                <option value="year">本年</option>
              </select>
              <select
                value={selectedYear.value}
                onChange={(e) =>
                  selectedYear.value = parseInt(e.currentTarget.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((year) => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 总体统计卡片 */}
        {overallStats.value && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    总阅读时长
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(overallStats.value.totalReadingTime || 0)}
                  </p>
                  <p className="text-xs text-gray-400">
                    平均 {formatTime(
                      (overallStats.value.totalReadingTime || 0) /
                        Math.max(overallStats.value.totalBooks || 1, 1),
                    )} / 本
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-green-400 to-green-600 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">阅读书籍</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.value.totalBooks || 0}
                  </p>
                  <p className="text-xs text-gray-400">
                    完成 {overallStats.value.finishedBooks || 0} 本
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">笔记数量</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.value.totalNotes || 0}
                  </p>
                  <p className="text-xs text-gray-400">
                    书签 {overallStats.value.totalBookmarks || 0} 个
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
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
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">连续阅读</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.value.currentStreak || 0}天
                  </p>
                  <p className="text-xs text-gray-400">
                    最长 {overallStats.value.longestStreak || 0} 天
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：阅读趋势和热力图 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 阅读趋势图 */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                阅读趋势
              </h3>

              {readingTrend.value.length > 0
                ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>阅读时长 (分钟)</span>
                      <span>日期</span>
                    </div>

                    <div className="space-y-2">
                      {readingTrend.value.slice(0, 7).map((day, index) => {
                        const maxTime = Math.max(
                          ...readingTrend.value.map((d) => d.readingTime),
                        );
                        const percentage = maxTime > 0
                          ? (day.readingTime / maxTime) * 100
                          : 0;

                        return (
                          <div
                            key={index}
                            className="flex items-center space-x-4"
                          >
                            <div className="w-16 text-sm text-gray-600">
                              {new Date(day.date).toLocaleDateString("zh-CN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                              <div
                                className="bg-gradient-to-r from-purple-400 to-purple-600 h-4 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                {day.readingTime}分钟
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
                : (
                  <div className="text-center py-8 text-gray-500">
                    暂无趋势数据
                  </div>
                )}
            </div>

            {/* 阅读热力图 */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  阅读热力图
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>少</span>
                  <div className="flex space-x-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`w-3 h-3 rounded-sm ${
                          getHeatmapColor(level)
                        }`}
                      />
                    ))}
                  </div>
                  <span>多</span>
                </div>
              </div>

              <div className="grid grid-cols-53 gap-1">
                {generateHeatmapGrid().map((day, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-sm ${
                      getHeatmapColor(day.level)
                    } hover:ring-2 hover:ring-purple-300 cursor-pointer transition-all`}
                    title={`${day.date}: ${day.count}分钟`}
                  />
                ))}
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                {selectedYear.value}年阅读活动
              </div>
            </div>
          </div>

          {/* 右侧：分类统计和热门书籍 */}
          <div className="space-y-8">
            {/* 分类统计 */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                阅读分类
              </h3>

              {categoryStats.value.length > 0
                ? (
                  <div className="space-y-4">
                    {categoryStats.value.slice(0, 5).map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {category.categoryName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {category.bookCount}本
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-pink-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatTime(category.totalReadingTime)}</span>
                          <span>{category.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
                : (
                  <div className="text-center py-8 text-gray-500">
                    暂无分类数据
                  </div>
                )}
            </div>

            {/* 热门书籍 */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                最爱书籍
              </h3>

              {bookStats.value.length > 0
                ? (
                  <div className="space-y-4">
                    {bookStats.value.slice(0, 5).map((book, index) => (
                      <div
                        key={book.bookId}
                        className="flex items-center space-x-3"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : index === 2
                              ? "bg-orange-400"
                              : "bg-gray-300"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-10 h-12 object-cover rounded shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {book.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {book.author}
                          </p>
                          <p className="text-xs text-purple-600">
                            {formatTime(book.totalReadingTime)} •{" "}
                            {Math.round(book.readProgress)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
                : (
                  <div className="text-center py-8 text-gray-500">
                    暂无书籍数据
                  </div>
                )}
            </div>

            {/* 快速操作 */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                快速操作
              </h3>

              <div className="space-y-3">
                <a
                  href="/notes"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center"
                >
                  📝 查看笔记
                </a>
                <a
                  href="/profile"
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center"
                >
                  👤 个人资料
                </a>
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center">
                  📊 导出报告
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
