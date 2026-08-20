const {
  clearSessionResult,
  loadSessionResult,
} = require("../../utils/storage");
const { createSessionResultView } = require("../../services/page-model-service");

Page({
  data: {
    campusName: "",
    durationText: "--",
    distanceText: "0 m",
    coverageRatio: "0.0%",
    exploredCount: 0,
    unlockedGridCount: 0,
    totalUnlockedGridCount: 0,
    trackPointCount: 0,
    startTimeText: "--",
    endTimeText: "--",
    discoveredPoiText: "本次没有发现新地标",
    completedRouteText: "本次没有完成新路线",
    earnedAchievementText: "本次没有解锁新成就",
    hasSessionResult: false,
  },

  onLoad() {
    const sessionResult = loadSessionResult();
    if (!sessionResult) {
      wx.showToast({
        title: "没有可展示的结算数据",
        icon: "none",
      });

      setTimeout(() => {
        wx.navigateBack({
          delta: 1,
          fail: () => {
            wx.reLaunch({
              url: "/pages/index/index",
            });
          },
        });
      }, 600);
      return;
    }

    this.setData(createSessionResultView(sessionResult));
  },

  handleBackToMap() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.reLaunch({
          url: "/pages/index/index",
        });
      },
    });
  },

  onUnload() {
    clearSessionResult();
  },
});
