const { getRuntimeConfig } = require("./handlers/config");
const { syncGameProgress } = require("./handlers/game-progress");
const { syncGridStatus } = require("./handlers/grid");
const { submitPoiQuiz, syncPoiRecords } = require("./handlers/poi");
const { clearUserData, getOpenId, getUserProgress, initUserProfile, syncExploreSummary } = require("./handlers/profile");
const { syncExploreSession } = require("./handlers/session");
const { getExploreStats, getLeaderboard } = require("./handlers/stats");
const { FUNCTION_VERSION } = require("./lib/version");

const handlers = {
  getOpenId,
  clearUserData,
  getExploreStats,
  getLeaderboard,
  getRuntimeConfig,
  getUserProgress,
  initUserProfile,
  submitPoiQuiz,
  syncGameProgress,
  syncGridStatus,
  syncExploreSummary,
  syncPoiRecords,
  syncExploreSession,
};

exports.main = async (event = {}) => {
  try {
    const handler = handlers[event.type];
    if (!handler) {
      return {
        success: false,
        function_version: FUNCTION_VERSION,
        message: `unsupported-event:${event.type || "unknown"}`,
      };
    }

    return await handler(event);
  } catch (error) {
    return {
      success: false,
      function_version: FUNCTION_VERSION,
      message: error && error.errMsg ? error.errMsg : "cloud-function-failed",
      error,
    };
  }
};
