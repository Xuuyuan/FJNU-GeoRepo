const cloudService = require("../../services/cloud");
const { createLeaderboardView } = require("../../services/page-model-service");

Page({
  data: {
    loading: false,
    ...createLeaderboardView({ items: [], metric: "grid" }),
  },

  onLoad() {
    this.loadLeaderboard("grid");
  },

  async loadLeaderboard(metric = this.data.metric) {
    if (!cloudService.isCloudReady()) {
      this.setData(createLeaderboardView({
        items: [],
        metric,
        errorText: "云开发未启用，排行榜需要云端 userinfo 与记录集合。",
      }));
      return;
    }

    this.setData({
      loading: true,
      errorText: "",
    });

    const result = await cloudService.getLeaderboard(metric);
    if (!result.success) {
      this.setData(createLeaderboardView({
        items: [],
        metric,
        errorText: result.message || "排行榜读取失败。",
      }));
      return;
    }

    this.setData(createLeaderboardView({
      items: result.items,
      metric: result.metric,
      currentUserId: result.current_user_id,
      currentUserRank: result.current_user_rank,
      currentUserItem: result.current_user_item,
    }));
  },

  handleMetricTap(event) {
    const metric = event.currentTarget.dataset.metric;
    this.loadLeaderboard(metric);
  },
});
