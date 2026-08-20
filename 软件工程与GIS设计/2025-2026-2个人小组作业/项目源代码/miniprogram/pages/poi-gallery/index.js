const { POI_FEATURES } = require("../../data/campus");
const {
  ROUTE_GRID_GROUPS,
  applyRouteRuntimeConfig,
} = require("../../data/game-config");
const {
  loadDemoModeEnabled,
  loadDebugModeEnabled,
  loadGameProgress,
  loadGridStatus,
  loadRuntimeConfigCache,
  saveDemoModeEnabled,
} = require("../../utils/storage");
const cloudService = require("../../services/cloud");
const {
  createPoiGalleryView,
  createRouteGalleryView,
} = require("../../services/page-model-service");

const ALBUM_LABELS = {
  poi: "地标图鉴",
  route: "路线图鉴",
};
const DEMO_MODE_TRIGGER_TAP_COUNT = 5;
const DEMO_MODE_TRIGGER_RESET_MS = 1500;

function buildGalleryState({
  cloudProgress = null,
  errorText = "",
  filterKey = "all",
  activeAlbumKey = "poi",
  debugModeEnabled = false,
} = {}) {
  const runtimeConfigCache = loadRuntimeConfigCache();
  const safeCloudProgress = cloudProgress || {};
  const poiRecords = Array.isArray(safeCloudProgress.poi_records) ? safeCloudProgress.poi_records : [];
  const poiGallery = createPoiGalleryView({
    poiFeatures: POI_FEATURES,
    poiRecords,
    runtimeConfigCache,
    debugModeEnabled,
    errorText,
    filterKey,
  });
  const routeGallery = createRouteGalleryView({
    routeRules: applyRouteRuntimeConfig(ROUTE_GRID_GROUPS, runtimeConfigCache),
    poiFeatures: POI_FEATURES,
    cloudProgress: safeCloudProgress,
    localGameProgress: loadGameProgress(),
    localGridStatus: loadGridStatus(),
    errorText,
  });
  const safeAlbumKey = ALBUM_LABELS[activeAlbumKey] ? activeAlbumKey : "poi";

  return {
    ...poiGallery,
    ...routeGallery,
    activeAlbumKey: safeAlbumKey,
    albumTabs: Object.keys(ALBUM_LABELS).map((key) => ({
      key,
      label: ALBUM_LABELS[key],
      active: key === safeAlbumKey,
    })),
    heroTitle: "图鉴",
    heroSubtitle: safeAlbumKey === "route"
      ? `已完成 ${routeGallery.completedRouteCount} / ${routeGallery.totalRouteCount} 条探索路线`
      : `已发现 ${poiGallery.discoveredCount} / ${poiGallery.totalCount} 个校园地标`,
    heroProgressPercent: safeAlbumKey === "route"
      ? routeGallery.routeProgressPercent
      : poiGallery.progressPercent,
  };
}

Page({
  data: {
    loading: false,
    errorText: "",
    filterKey: "all",
    activeAlbumKey: "poi",
    debugModeEnabled: false,
    cloudProgress: null,
    ...buildGalleryState(),
  },

  onLoad() {
    this.setData({
      debugModeEnabled: loadDebugModeEnabled(),
    });
    this.loadGallery();
  },

  onShow() {
    const debugModeEnabled = loadDebugModeEnabled();
    if (debugModeEnabled !== this.data.debugModeEnabled) {
      this.applyGalleryState({
        cloudProgress: this.data.cloudProgress,
        errorText: this.data.errorText,
        debugModeEnabled,
      });
    }
  },

  async loadGallery() {
    if (!cloudService.isCloudReady()) {
      this.applyGalleryState({
        cloudProgress: null,
        errorText: "云开发未启用，当前展示本机缓存进度。",
      });
      return;
    }

    this.setData({
      loading: true,
      errorText: "",
    });

    const result = await cloudService.getUserProgress();
    if (!result.success) {
      this.applyGalleryState({
        cloudProgress: null,
        errorText: result.message || "云端图鉴状态读取失败，当前展示本机缓存进度。",
      });
      return;
    }

    this.applyGalleryState({
      cloudProgress: result,
      errorText: "",
    });
  },

  applyGalleryState({
    cloudProgress = null,
    errorText = "",
    activeAlbumKey = this.data.activeAlbumKey,
    filterKey = this.data.filterKey,
    debugModeEnabled = this.data.debugModeEnabled,
  } = {}) {
    this.setData({
      cloudProgress,
      debugModeEnabled,
      ...buildGalleryState({
        cloudProgress,
        errorText,
        filterKey,
        activeAlbumKey,
        debugModeEnabled,
      }),
    });
  },

  handleAlbumTap(event) {
    const activeAlbumKey = event.currentTarget.dataset.albumKey;
    this.applyGalleryState({
      cloudProgress: this.data.cloudProgress,
      errorText: this.data.errorText,
      activeAlbumKey,
    });
  },

  handleFilterTap(event) {
    const filterKey = event.currentTarget.dataset.filterKey;
    this.applyGalleryState({
      cloudProgress: this.data.cloudProgress,
      errorText: this.data.errorText,
      filterKey,
    });
  },

  handleDemoModeTriggerTap() {
    clearTimeout(this.demoModeTapTimer);
    this.demoModeTapCount = (this.demoModeTapCount || 0) + 1;

    if (this.demoModeTapCount >= DEMO_MODE_TRIGGER_TAP_COUNT) {
      this.demoModeTapCount = 0;
      const nextEnabled = !loadDemoModeEnabled();
      saveDemoModeEnabled(nextEnabled);
      wx.showToast({
        title: nextEnabled ? "已开启演示模式" : "已关闭演示模式",
        icon: "none",
      });
      return;
    }

    this.demoModeTapTimer = setTimeout(() => {
      this.demoModeTapCount = 0;
    }, DEMO_MODE_TRIGGER_RESET_MS);
  },

  onUnload() {
    clearTimeout(this.demoModeTapTimer);
  },
});
