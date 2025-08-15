import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import Navigation from "../components/Navigation.tsx";

// 工具函数
const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
};

// 统计卡片配置
const STATS_CARDS_CONFIG = [
  {
    key: "totalReadingTime",
    title: "总阅读时长",
    colorFrom: "blue-400",
    colorTo: "blue-600",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    valueFormat: (stats) => ({
      main: formatTime(stats.totalReadingTime || 0),
      sub: `平均 ${
        formatTime(
          (stats.totalReadingTime || 0) / Math.max(stats.totalBooks || 1, 1),
        )
      } / 本`,
    }),
  },
  {
    key: "totalBooks",
    title: "阅读书籍",
    colorFrom: "green-400",
    colorTo: "green-600",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
    valueFormat: (stats) => ({
      main: `${stats.totalBooks || 0}`,
      sub: `完成 ${stats.finishedBooks || 0} 本`,
    }),
  },
  {
    key: "totalNotes",
    title: "笔记数量",
    colorFrom: "purple-400",
    colorTo: "purple-600",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
    valueFormat: (stats) => ({
      main: `${stats.totalNotes || 0}`,
      sub: `书签 ${stats.totalBookmarks || 0} 个`,
    }),
  },
  {
    key: "currentStreak",
    title: "连续阅读",
    colorFrom: "orange-400",
    colorTo: "orange-600",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
      />
    ),
    valueFormat: (stats) => ({
      main: `${stats.currentStreak || 0}天`,
      sub: `最长 ${stats.longestStreak || 0} 天`,
    }),
  },
];

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
        bookStats.value = data.data || [];
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      error.value = "加载统计数据失败";
    } finally {
      loading.value = false;
    }
  };

  const generateDaysInYear = (year) => {
    const days = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      days.push(new Date(d));
    }
    return days;
  };

  const getHeatmapIntensity = (date) => {
    if (!heatmapData.value || !heatmapData.value.dailyData) return 0;

    const dateString = date.toISOString().split("T")[0];
    const dayData = heatmapData.value.dailyData[dateString];

    if (!dayData || !dayData.readingTime) return 0;

    // 根据阅读时长计算强度等级 (0-4)
    if (dayData.readingTime >= 120) return 4; // 2小时以上
    if (dayData.readingTime >= 60) return 3; // 1-2小时
    if (dayData.readingTime >= 30) return 2; // 30分钟-1小时
    if (dayData.readingTime >= 10) return 1; // 10-30分钟
    return 0;
  };

  if (loading.value) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4">
          </div>
          <p className="text-gray-600">加载统计数据中...</p>
        </div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error.value}</p>
          <button
            onClick={loadDashboardData}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      <Navigation
        title="阅读统计"
        icon="dashboard"
        showUser={true}
        actions={[
          {
            label: "刷新数据",
            onClick: () => {
              loadDashboardData();
            },
            type: "button",
            variant: "secondary",
          },
        ]}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 总体统计卡片 */}
        {overallStats.value && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {STATS_CARDS_CONFIG.map((card) => {
              const values = card.valueFormat(overallStats.value);
              return (
                <div
                  key={card.key}
                  className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-6"
                >
                  <div className="flex items-center">
                    <div
                      className={`p-3 bg-gradient-to-r from-${card.colorFrom} to-${card.colorTo} rounded-lg`}
                    >
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {card.icon}
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {values.main}
                      </p>
                      <p className="text-xs text-gray-400">
                        {values.sub}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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
                            <div className="w-20 text-sm text-gray-600">
                              {new Date(day.date).toLocaleDateString("zh-CN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                              <div
                                className="bg-gradient-to-r from-purple-400 to-blue-500 h-4 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                {formatTime(day.readingTime)}
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
                <select
                  value={selectedYear.value}
                  onChange={(e) =>
                    selectedYear.value = parseInt(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              {heatmapData.value
                ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-53 gap-1">
                      {generateDaysInYear(selectedYear.value).map(
                        (date, index) => {
                          const intensity = getHeatmapIntensity(date);
                          const intensityColors = [
                            "bg-gray-100", // 0
                            "bg-green-200", // 1
                            "bg-green-300", // 2
                            "bg-green-500", // 3
                            "bg-green-700", // 4
                          ];

                          return (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-sm ${
                                intensityColors[intensity]
                              }`}
                              title={`${date.toLocaleDateString()}: ${
                                heatmapData.value.dailyData?.[
                                  date.toISOString().split("T")[0]
                                ]?.readingTime || 0
                              }分钟`}
                            />
                          );
                        },
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                      <span>少</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-100 rounded-sm" />
                        <div className="w-2 h-2 bg-green-200 rounded-sm" />
                        <div className="w-2 h-2 bg-green-300 rounded-sm" />
                        <div className="w-2 h-2 bg-green-500 rounded-sm" />
                        <div className="w-2 h-2 bg-green-700 rounded-sm" />
                      </div>
                      <span>多</span>
                    </div>
                  </div>
                )
                : (
                  <div className="text-center py-8 text-gray-500">
                    暂无热力图数据
                  </div>
                )}
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
                  <div className="space-y-3">
                    {categoryStats.value.slice(0, 8).map((category, index) => {
                      const colors = [
                        "bg-blue-500",
                        "bg-green-500",
                        "bg-purple-500",
                        "bg-yellow-500",
                        "bg-red-500",
                        "bg-indigo-500",
                        "bg-pink-500",
                        "bg-gray-500",
                      ];
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                colors[index % colors.length]
                              }`}
                            />
                            <span className="text-sm text-gray-700">
                              {category.category}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {category.count}本
                          </span>
                        </div>
                      );
                    })}
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
                阅读最多的书籍
              </h3>

              {bookStats.value.length > 0
                ? (
                  <div className="space-y-4">
                    {bookStats.value.slice(0, 5).map((book, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <img
                            src={book.cover}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                            onError={(e) => {
                              e.target.src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA0OCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAyNEgzMlY0MEgxNlYyNFoiIGZpbGw9IiNENUQ1RDUiLz4KPC9zdmc+Cg==";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {book.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {book.author}
                          </p>
                          <p className="text-xs text-gray-400">
                            阅读 {formatTime(book.readingTime || 0)}
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
          </div>
        </div>
      </div>
    </div>
  );
}
