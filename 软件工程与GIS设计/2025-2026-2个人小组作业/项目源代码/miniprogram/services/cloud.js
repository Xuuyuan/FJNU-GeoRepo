const FUNCTION_NAME = "sdkpFunctions";

function isCloudReady() {
  try {
    const app = getApp();
    return Boolean(wx.cloud && app && app.globalData && app.globalData.env);
  } catch (error) {
    return false;
  }
}

function normalizeFailure(error) {
  return {
    success: false,
    message: error && error.errMsg ? error.errMsg : "cloud-disabled",
    error,
  };
}

function callFunction(type, data = {}) {
  if (!isCloudReady()) {
    return Promise.resolve(normalizeFailure({ errMsg: "cloud-disabled" }));
  }

  const startedAt = Date.now();
  return wx.cloud
    .callFunction({
      name: FUNCTION_NAME,
      data: {
        type,
        data,
      },
    })
    .then((response) => {
      const result = response.result || {};
      if (!result.success) {
        console.warn(`[cloud:${type}] failed`, result);
      }
      return result;
    })
    .catch((error) => {
      const failure = normalizeFailure(error);
      console.warn(`[cloud:${type}] error after ${Date.now() - startedAt}ms`, failure);
      return failure;
    });
}

function getOpenId() {
  return callFunction("getOpenId");
}

function getRuntimeConfig() {
  return callFunction("getRuntimeConfig");
}

function initUserProfile(profile) {
  return callFunction("initUserProfile", profile);
}

function getUserProgress() {
  return callFunction("getUserProgress");
}

function clearUserData() {
  return callFunction("clearUserData");
}

function syncGridStatus(grids) {
  return callFunction("syncGridStatus", { grids });
}

function syncExploreSummary(summary) {
  return callFunction("syncExploreSummary", summary);
}

function syncExploreSession(session) {
  return callFunction("syncExploreSession", session);
}

function syncPoiRecords(records) {
  return callFunction("syncPoiRecords", { records });
}

function submitPoiQuiz(payload) {
  return callFunction("submitPoiQuiz", payload);
}

function syncGameProgress(progress) {
  return callFunction("syncGameProgress", progress);
}

function getLeaderboard(metric = "grid", limit = 20) {
  return callFunction("getLeaderboard", { metric, limit });
}

function getExploreStats() {
  return callFunction("getExploreStats");
}

module.exports = {
  clearUserData,
  getExploreStats,
  getLeaderboard,
  getUserProgress,
  getOpenId,
  getRuntimeConfig,
  initUserProfile,
  isCloudReady,
  submitPoiQuiz,
  syncExploreSession,
  syncExploreSummary,
  syncGameProgress,
  syncGridStatus,
  syncPoiRecords,
};
