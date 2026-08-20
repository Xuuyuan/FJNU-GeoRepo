const cloudService = require("../../services/cloud");
const { createHistoryView } = require("../../services/page-model-service");
const {
  loadDebugModeEnabled,
  saveDebugModeEnabled,
} = require("../../utils/storage");

const DEBUG_MODE_TRIGGER_TAP_COUNT = 5;
const DEBUG_MODE_TRIGGER_RESET_MS = 1500;

Page({
  data: {
    loading: false,
    errorText: "",
    filterKey: "all",
    trackSessions: [],
    sessions: [],
    allSessionCount: 0,
    historyTabs: [],
    historyEmptyTitle: "还没有云端探索记录",
    historyEmptyText: "完成一次探索并同步后，这里会显示历史记录。",
    totalDistanceText: "0 m",
  },

  onLoad() {
    this.loadHistory();
  },

  handleDebugModeTriggerTap() {
    clearTimeout(this.debugModeTapTimer);
    this.debugModeTapCount = (this.debugModeTapCount || 0) + 1;

    if (this.debugModeTapCount >= DEBUG_MODE_TRIGGER_TAP_COUNT) {
      this.debugModeTapCount = 0;
      const nextEnabled = !loadDebugModeEnabled();
      saveDebugModeEnabled(nextEnabled);
      wx.showToast({
        title: nextEnabled ? "已开启调试模式" : "已关闭调试模式",
        icon: "none",
      });
      return;
    }

    this.debugModeTapTimer = setTimeout(() => {
      this.debugModeTapCount = 0;
    }, DEBUG_MODE_TRIGGER_RESET_MS);
  },

  onUnload() {
    clearTimeout(this.debugModeTapTimer);
  },

  async loadHistory() {
    if (!cloudService.isCloudReady()) {
      this.setData({
        loading: false,
        errorText: "云开发未启用，无法读取云端历史记录。",
        sessions: [],
        totalDistanceText: "0 m",
      });
      return;
    }

    this.setData({
      loading: true,
      errorText: "",
    });

    const result = await cloudService.getUserProgress();
    if (!result.success) {
      this.setData({
        loading: false,
        errorText: result.message || "云端历史读取失败，请稍后重试。",
        sessions: [],
        totalDistanceText: "0 m",
      });
      return;
    }

    const historyView = createHistoryView(result.track_sessions, this.data.filterKey);

    this.setData({
      loading: false,
      errorText: "",
      trackSessions: result.track_sessions || [],
      ...historyView,
    });
  },

  handleFilterTap(event) {
    const filterKey = event.currentTarget.dataset.filterKey;
    this.setData(createHistoryView(this.data.trackSessions, filterKey));
  },
});
