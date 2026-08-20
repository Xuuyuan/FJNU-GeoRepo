const { POI_FEATURES } = require("../../data/campus");
const { ACHIEVEMENT_RULES, REACHABLE_GRID_COUNT } = require("../../data/game-config");
const { loadGameProgress, loadGridStatus } = require("../../utils/storage");
const cloudService = require("../../services/cloud");
const { createUserStats } = require("../../services/progress-service");
const { createDashboardView } = require("../../services/page-model-service");

function createLocalStats() {
  const progress = loadGameProgress();
  return createUserStats({
    gridCount: Object.keys(loadGridStatus()).length,
    totalGridCount: REACHABLE_GRID_COUNT,
    poiCount: 0,
    totalPoiCount: POI_FEATURES.length,
    routeCount: progress.completedRouteIds.length,
    achievementCount: progress.earnedAchievementIds.length,
    totalAchievementCount: ACHIEVEMENT_RULES.length,
  });
}

function createStatsFromCloud(progress) {
  const safeProgress = progress || {};
  return createUserStats({
    gridCount: Array.isArray(safeProgress.grids) ? safeProgress.grids.length : Object.keys(loadGridStatus()).length,
    totalGridCount: REACHABLE_GRID_COUNT,
    poiCount: Array.isArray(safeProgress.poi_records) ? safeProgress.poi_records.length : 0,
    totalPoiCount: POI_FEATURES.length,
    routeCount: Array.isArray(safeProgress.route_records) ? safeProgress.route_records.length : 0,
    achievementCount: Array.isArray(safeProgress.achievement_records) ? safeProgress.achievement_records.length : 0,
    totalAchievementCount: ACHIEVEMENT_RULES.length,
  });
}

Page({
  data: {
    loading: false,
    ...createDashboardView({
      userStats: createLocalStats(),
      recentSessions: [],
      statsSummary: null,
      leaderboardItems: [],
    }),
  },

  onLoad() {
    this.loadDashboard();
  },

  async loadDashboard() {
    if (!cloudService.isCloudReady()) {
      this.setData(createDashboardView({
        userStats: createLocalStats(),
        recentSessions: [],
        statsSummary: null,
        leaderboardItems: [],
        errorText: "云开发未启用，当前展示本机缓存看板。",
      }));
      return;
    }

    this.setData({
      loading: true,
      errorText: "",
    });

    const [progressResult, statsResult, leaderboardResult] = await Promise.all([
      cloudService.getUserProgress(),
      cloudService.getExploreStats(),
      cloudService.getLeaderboard("grid", 3),
    ]);
    const leaderboardItems = leaderboardResult && leaderboardResult.success ? leaderboardResult.items : [];

    if (!progressResult.success) {
      this.setData(createDashboardView({
        userStats: createLocalStats(),
        recentSessions: [],
        statsSummary: statsResult.summary,
        leaderboardItems,
        errorText: progressResult.message || "云端进度读取失败，当前展示本机缓存看板。",
      }));
      return;
    }

    this.setData(createDashboardView({
      userStats: createStatsFromCloud(progressResult),
      recentSessions: progressResult.track_sessions,
      statsSummary: statsResult.summary,
      leaderboardItems,
    }));
  },

  handleOpenLeaderboard() {
    wx.navigateTo({
      url: "/pages/leaderboard/index",
    });
  },
});
