const USER_PROFILE_KEY = "sdkp:user-profile";
const GRID_STATUS_KEY = "sdkp:grid-status";
const SESSION_DRAFT_KEY = "sdkp:session-draft";
const GAME_PROGRESS_KEY = "sdkp:game-progress";
const SESSION_RESULT_KEY = "sdkp:session-result";
const RUNTIME_CONFIG_KEY = "sdkp:runtime-config";
const PENDING_POI_QUIZ_KEY = "sdkp:pending-poi-quiz";
const POI_QUIZ_RESULT_KEY = "sdkp:poi-quiz-result";
const DEBUG_MODE_KEY = "sdkp:debug-mode";
const DEMO_MODE_KEY = "sdkp:demo-mode";

function safeGetStorageSync(key, fallbackValue) {
  try {
    const value = wx.getStorageSync(key);
    return value === "" || value === undefined ? fallbackValue : value;
  } catch (error) {
    return fallbackValue;
  }
}

function safeSetStorageSync(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function createDefaultProfile(totalGridCount) {
  return {
    nickName: "",
    totalGrids: 0,
    exploreRatio: 0,
    totalGridCount,
    updatedAt: "",
  };
}

function loadUserProfile(totalGridCount) {
  const storedProfile = safeGetStorageSync(USER_PROFILE_KEY, {});
  return {
    ...createDefaultProfile(totalGridCount),
    ...(storedProfile || {}),
    totalGridCount,
  };
}

function saveUserProfile(profile) {
  return safeSetStorageSync(USER_PROFILE_KEY, profile);
}

function loadGridStatus() {
  const gridStatus = safeGetStorageSync(GRID_STATUS_KEY, {});
  return gridStatus && typeof gridStatus === "object" ? gridStatus : {};
}

function saveGridStatus(gridStatus) {
  return safeSetStorageSync(GRID_STATUS_KEY, gridStatus);
}

function loadSessionDraft() {
  const draft = safeGetStorageSync(SESSION_DRAFT_KEY, null);
  return draft && typeof draft === "object" ? draft : null;
}

function saveSessionDraft(draft) {
  return safeSetStorageSync(SESSION_DRAFT_KEY, draft);
}

function clearSessionDraft() {
  try {
    wx.removeStorageSync(SESSION_DRAFT_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

function loadSessionResult() {
  const result = safeGetStorageSync(SESSION_RESULT_KEY, null);
  return result && typeof result === "object" ? result : null;
}

function saveSessionResult(result) {
  return safeSetStorageSync(SESSION_RESULT_KEY, result);
}

function clearSessionResult() {
  try {
    wx.removeStorageSync(SESSION_RESULT_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

function loadGameProgress() {
  const progress = safeGetStorageSync(GAME_PROGRESS_KEY, {});
  return {
    completedRouteIds: Array.isArray(progress.completedRouteIds) ? progress.completedRouteIds : [],
    earnedAchievementIds: Array.isArray(progress.earnedAchievementIds) ? progress.earnedAchievementIds : [],
  };
}

function saveGameProgress(progress) {
  return safeSetStorageSync(GAME_PROGRESS_KEY, {
    completedRouteIds: Array.isArray(progress.completedRouteIds) ? progress.completedRouteIds : [],
    earnedAchievementIds: Array.isArray(progress.earnedAchievementIds) ? progress.earnedAchievementIds : [],
  });
}

function loadRuntimeConfigCache() {
  const config = safeGetStorageSync(RUNTIME_CONFIG_KEY, null);
  return config && typeof config === "object" ? config : null;
}

function saveRuntimeConfigCache(config) {
  return safeSetStorageSync(RUNTIME_CONFIG_KEY, {
    ...(config || {}),
    cachedAt: new Date().toISOString(),
  });
}

function loadPendingPoiQuiz() {
  const quiz = safeGetStorageSync(PENDING_POI_QUIZ_KEY, null);
  return quiz && typeof quiz === "object" ? quiz : null;
}

function savePendingPoiQuiz(quiz) {
  return safeSetStorageSync(PENDING_POI_QUIZ_KEY, quiz);
}

function clearPendingPoiQuiz() {
  try {
    wx.removeStorageSync(PENDING_POI_QUIZ_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

function loadPoiQuizResult() {
  const result = safeGetStorageSync(POI_QUIZ_RESULT_KEY, null);
  return result && typeof result === "object" ? result : null;
}

function savePoiQuizResult(result) {
  return safeSetStorageSync(POI_QUIZ_RESULT_KEY, result);
}

function clearPoiQuizResult() {
  try {
    wx.removeStorageSync(POI_QUIZ_RESULT_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

function removeStorageKey(key) {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (error) {
    return false;
  }
}

function clearLocalUserData() {
  [
    USER_PROFILE_KEY,
    GRID_STATUS_KEY,
    SESSION_DRAFT_KEY,
    GAME_PROGRESS_KEY,
    SESSION_RESULT_KEY,
    PENDING_POI_QUIZ_KEY,
    POI_QUIZ_RESULT_KEY,
  ].forEach(removeStorageKey);
  return true;
}

function loadDebugModeEnabled() {
  return safeGetStorageSync(DEBUG_MODE_KEY, false) === true;
}

function saveDebugModeEnabled(enabled) {
  return safeSetStorageSync(DEBUG_MODE_KEY, enabled === true);
}

function loadDemoModeEnabled() {
  return safeGetStorageSync(DEMO_MODE_KEY, false) === true;
}

function saveDemoModeEnabled(enabled) {
  return safeSetStorageSync(DEMO_MODE_KEY, enabled === true);
}

module.exports = {
  clearLocalUserData,
  clearPendingPoiQuiz,
  clearPoiQuizResult,
  clearSessionResult,
  clearSessionDraft,
  createDefaultProfile,
  loadDebugModeEnabled,
  loadDemoModeEnabled,
  loadGameProgress,
  loadGridStatus,
  loadPendingPoiQuiz,
  loadPoiQuizResult,
  loadRuntimeConfigCache,
  loadSessionDraft,
  loadSessionResult,
  loadUserProfile,
  saveGameProgress,
  saveDebugModeEnabled,
  saveDemoModeEnabled,
  saveGridStatus,
  savePendingPoiQuiz,
  savePoiQuizResult,
  saveRuntimeConfigCache,
  saveSessionDraft,
  saveSessionResult,
  saveUserProfile,
};
