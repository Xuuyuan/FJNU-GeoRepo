const { getDistanceInMeters } = require("../utils/spatial");

function createSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function summarizeTrackDistance(trackPoints) {
  let distance = 0;

  for (let index = 1; index < trackPoints.length; index += 1) {
    distance += getDistanceInMeters(trackPoints[index - 1], trackPoints[index]);
  }

  return Math.round(distance);
}

function formatDuration(durationSeconds) {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function formatDistance(distanceMeters) {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  }

  return `${distanceMeters} m`;
}

function createSampledTrackPoints(trackPoints, maxPoints = 60) {
  const safePoints = Array.isArray(trackPoints) ? trackPoints : [];
  if (!safePoints.length) {
    return [];
  }

  const step = Math.max(1, Math.ceil(safePoints.length / maxPoints));
  return safePoints
    .filter((_, index) => index === 0 || index === safePoints.length - 1 || index % step === 0)
    .map((point) => ({
      latitude: Number(Number(point.latitude).toFixed(6)),
      longitude: Number(Number(point.longitude).toFixed(6)),
    }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
}

function createSessionRuntime() {
  return {
    unlockedGridIdSet: new Set(),
    discoveredPoiIdSet: new Set(),
    discoveredPoiNames: [],
    completedRouteIdSet: new Set(),
    completedRouteNames: [],
    earnedAchievementIdSet: new Set(),
    earnedAchievementNames: [],
  };
}

function resetSessionRuntime(sessionRuntime) {
  sessionRuntime.unlockedGridIdSet = new Set();
  sessionRuntime.discoveredPoiIdSet = new Set();
  sessionRuntime.discoveredPoiNames = [];
  sessionRuntime.completedRouteIdSet = new Set();
  sessionRuntime.completedRouteNames = [];
  sessionRuntime.earnedAchievementIdSet = new Set();
  sessionRuntime.earnedAchievementNames = [];
}

function trackSessionGridUnlocks(sessionRuntime, gridIds) {
  gridIds.forEach((gridId) => sessionRuntime.unlockedGridIdSet.add(gridId));
}

function trackSessionPoiDiscovery(sessionRuntime, poiId, poiName) {
  if (sessionRuntime.discoveredPoiIdSet.has(poiId)) {
    return;
  }

  sessionRuntime.discoveredPoiIdSet.add(poiId);
  sessionRuntime.discoveredPoiNames.push(poiName);
}

function trackSessionRouteCompletion(sessionRuntime, routeId, routeName) {
  if (sessionRuntime.completedRouteIdSet.has(routeId)) {
    return;
  }

  sessionRuntime.completedRouteIdSet.add(routeId);
  sessionRuntime.completedRouteNames.push(routeName);
}

function trackSessionAchievement(sessionRuntime, achievementId, achievementName) {
  if (sessionRuntime.earnedAchievementIdSet.has(achievementId)) {
    return;
  }

  sessionRuntime.earnedAchievementIdSet.add(achievementId);
  sessionRuntime.earnedAchievementNames.push(achievementName);
}

function buildSessionSummary({
  sessionId,
  sessionStartedAt,
  trackPoints,
  userProfile,
  sessionRuntime,
  litGridIdSet,
  visitedPoiIdSet,
  completedRouteIdSet,
  earnedAchievementIdSet,
}) {
  if (!sessionId || !sessionStartedAt) {
    return null;
  }

  const now = Date.now();
  const durationSeconds = Math.max(0, Math.round((now - sessionStartedAt) / 1000));
  const distanceMeters = summarizeTrackDistance(trackPoints);
  const sessionUnlockedGridIds = Array.from(sessionRuntime.unlockedGridIdSet);

  return {
    session_id: sessionId,
    start_time: new Date(sessionStartedAt).toISOString(),
    end_time: new Date(now).toISOString(),
    duration_seconds: durationSeconds,
    duration_text: formatDuration(durationSeconds),
    track_point_count: trackPoints.length,
    distance_meters: distanceMeters,
    distance_text: formatDistance(distanceMeters),
    track_points_sampled: createSampledTrackPoints(trackPoints),
    track_privacy_level: "sampled",
    session_unlocked_grid_count: sessionUnlockedGridIds.length,
    unlocked_grid_count: sessionUnlockedGridIds.length,
    total_unlocked_grid_count: litGridIdSet ? litGridIdSet.size : 0,
    explore_ratio: userProfile.exploreRatio,
    coverage_ratio_text: `${Number(userProfile.exploreRatio || 0).toFixed(1)}%`,
    discovered_poi_ids: Array.from(sessionRuntime.discoveredPoiIdSet),
    total_discovered_poi_ids: visitedPoiIdSet ? Array.from(visitedPoiIdSet) : [],
    completed_route_ids: Array.from(sessionRuntime.completedRouteIdSet),
    total_completed_route_ids: completedRouteIdSet ? Array.from(completedRouteIdSet) : [],
    earned_achievement_ids: Array.from(sessionRuntime.earnedAchievementIdSet),
    total_earned_achievement_ids: earnedAchievementIdSet ? Array.from(earnedAchievementIdSet) : [],
  };
}

function buildSessionResult({
  campusName,
  exploredCount,
  coverageRatio,
  sessionSummary,
  sessionRuntime,
}) {
  if (!sessionSummary) {
    return null;
  }

  return {
    campusName,
    sessionId: sessionSummary.session_id,
    startTime: sessionSummary.start_time,
    endTime: sessionSummary.end_time,
    durationSeconds: sessionSummary.duration_seconds,
    trackPointCount: sessionSummary.track_point_count,
    distanceMeters: sessionSummary.distance_meters,
    distanceText: sessionSummary.distance_text,
    durationText: sessionSummary.duration_text,
    unlockedGridCount: sessionSummary.session_unlocked_grid_count,
    sessionUnlockedGridCount: sessionSummary.session_unlocked_grid_count,
    totalUnlockedGridCount: sessionSummary.total_unlocked_grid_count || exploredCount,
    exploredCount: sessionSummary.total_unlocked_grid_count || exploredCount,
    coverageRatio: sessionSummary.coverage_ratio_text || coverageRatio,
    discoveredPoiIds: sessionSummary.discovered_poi_ids || [],
    completedRouteIds: sessionSummary.completed_route_ids || [],
    earnedAchievementIds: sessionSummary.earned_achievement_ids || [],
    totalDiscoveredPoiIds: sessionSummary.total_discovered_poi_ids || [],
    totalCompletedRouteIds: sessionSummary.total_completed_route_ids || [],
    totalEarnedAchievementIds: sessionSummary.total_earned_achievement_ids || [],
    discoveredPoiNames: sessionRuntime.discoveredPoiNames.slice(),
    completedRouteNames: sessionRuntime.completedRouteNames.slice(),
    earnedAchievementNames: sessionRuntime.earnedAchievementNames.slice(),
  };
}

module.exports = {
  buildSessionResult,
  buildSessionSummary,
  createSampledTrackPoints,
  createSessionId,
  createSessionRuntime,
  resetSessionRuntime,
  trackSessionAchievement,
  trackSessionGridUnlocks,
  trackSessionPoiDiscovery,
  trackSessionRouteCompletion,
};
