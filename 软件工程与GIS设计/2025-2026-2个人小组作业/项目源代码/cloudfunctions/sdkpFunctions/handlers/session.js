const { cloud, db } = require("../lib/cloud-context");
const { ensureCollections } = require("../lib/collections");
const { setDocument } = require("../lib/database");
const { FUNCTION_VERSION } = require("../lib/version");

async function syncExploreSession(event) {
  const context = cloud.getWXContext();
  const openid = context.OPENID;
  const payload = event.data || {};
  const sessionId = payload.session_id || `session_${Date.now()}`;

  await ensureCollections();

  await setDocument("track_sessions", `${openid}_${sessionId}`, {
    user_id: openid,
    session_id: sessionId,
    start_time: payload.start_time || "",
    end_time: payload.end_time || "",
    duration_seconds: typeof payload.duration_seconds === "number" ? payload.duration_seconds : 0,
    duration_text: payload.duration_text || "",
    track_point_count: typeof payload.track_point_count === "number" ? payload.track_point_count : 0,
    distance_meters: typeof payload.distance_meters === "number" ? payload.distance_meters : 0,
    distance_text: payload.distance_text || "",
    track_points_sampled: Array.isArray(payload.track_points_sampled) ? payload.track_points_sampled : [],
    track_privacy_level: payload.track_privacy_level || "sampled",
    session_unlocked_grid_count: typeof payload.session_unlocked_grid_count === "number"
      ? payload.session_unlocked_grid_count
      : 0,
    unlocked_grid_count: typeof payload.unlocked_grid_count === "number" ? payload.unlocked_grid_count : 0,
    total_unlocked_grid_count: typeof payload.total_unlocked_grid_count === "number"
      ? payload.total_unlocked_grid_count
      : 0,
    explore_ratio: typeof payload.explore_ratio === "number" ? payload.explore_ratio : 0,
    coverage_ratio_text: payload.coverage_ratio_text || "",
    discovered_poi_ids: Array.isArray(payload.discovered_poi_ids) ? payload.discovered_poi_ids : [],
    total_discovered_poi_ids: Array.isArray(payload.total_discovered_poi_ids)
      ? payload.total_discovered_poi_ids
      : [],
    completed_route_ids: Array.isArray(payload.completed_route_ids) ? payload.completed_route_ids : [],
    total_completed_route_ids: Array.isArray(payload.total_completed_route_ids)
      ? payload.total_completed_route_ids
      : [],
    earned_achievement_ids: Array.isArray(payload.earned_achievement_ids) ? payload.earned_achievement_ids : [],
    total_earned_achievement_ids: Array.isArray(payload.total_earned_achievement_ids)
      ? payload.total_earned_achievement_ids
      : [],
    updated_at: db.serverDate(),
  });

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    session_id: sessionId,
  };
}

module.exports = {
  syncExploreSession,
};
