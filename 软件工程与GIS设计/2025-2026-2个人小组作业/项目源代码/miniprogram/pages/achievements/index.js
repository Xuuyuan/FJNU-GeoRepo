const {
  ACHIEVEMENT_RULES,
  ROUTE_GRID_GROUPS,
  applyAchievementRuntimeConfig,
  applyRouteRuntimeConfig,
} = require("../../data/game-config");
const { POI_FEATURES } = require("../../data/campus");
const {
  loadGameProgress,
  loadGridStatus,
  loadRuntimeConfigCache,
} = require("../../utils/storage");
const cloudService = require("../../services/cloud");
const { createAchievementCenterView } = require("../../services/page-model-service");

function buildAchievementState({ cloudProgress = null, errorText = "" } = {}) {
  const runtimeConfigCache = loadRuntimeConfigCache();
  return createAchievementCenterView({
    achievementRules: applyAchievementRuntimeConfig(ACHIEVEMENT_RULES, runtimeConfigCache),
    routeRules: applyRouteRuntimeConfig(ROUTE_GRID_GROUPS, runtimeConfigCache),
    poiFeatures: POI_FEATURES,
    cloudProgress,
    localGameProgress: loadGameProgress(),
    localGridStatus: loadGridStatus(),
    errorText,
  });
}

Page({
  data: {
    loading: false,
    errorText: "",
    ...buildAchievementState(),
  },

  onLoad() {
    this.loadAchievements();
  },

  async loadAchievements() {
    if (!cloudService.isCloudReady()) {
      this.setData(buildAchievementState({
        errorText: "云开发未启用，当前展示本机缓存进度。",
      }));
      return;
    }

    this.setData({
      loading: true,
      errorText: "",
    });

    const result = await cloudService.getUserProgress();
    if (!result.success) {
      this.setData(buildAchievementState({
        errorText: result.message || "云端成就状态读取失败，当前展示本机缓存进度。",
      }));
      return;
    }

    this.setData(buildAchievementState({
      cloudProgress: result,
    }));
  },
});
