const { cloud, db } = require("../lib/cloud-context");
const { ensureCollections } = require("../lib/collections");
const { setDocuments } = require("../lib/database");
const { FUNCTION_VERSION } = require("../lib/version");

function normalizeIdList(values) {
  return Array.isArray(values)
    ? values.filter((value, index, array) => value && array.indexOf(value) === index)
    : [];
}

async function syncGameProgress(event) {
  const context = cloud.getWXContext();
  const openid = context.OPENID;
  const payload = event.data || {};
  const routeIds = normalizeIdList(payload.completed_route_ids);
  const achievementIds = normalizeIdList(payload.earned_achievement_ids);

  await ensureCollections();

  const routeDocuments = routeIds.map((routeId) => ({
    id: `${openid}_${routeId}`,
    data: {
      user_id: openid,
      route_id: routeId,
      route_name: payload.route_name_map && payload.route_name_map[routeId] ? payload.route_name_map[routeId] : "",
      completed_at: payload.completed_at || db.serverDate(),
      updated_at: db.serverDate(),
    },
  }));

  const achievementDocuments = achievementIds.map((achievementId) => ({
    id: `${openid}_${achievementId}`,
    data: {
      user_id: openid,
      achievement_id: achievementId,
      achievement_name: payload.achievement_name_map && payload.achievement_name_map[achievementId]
        ? payload.achievement_name_map[achievementId]
        : "",
      earned_at: payload.earned_at || db.serverDate(),
      updated_at: db.serverDate(),
    },
  }));

  await Promise.all([
    setDocuments("route_records", routeDocuments),
    setDocuments("achievement_records", achievementDocuments),
  ]);

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    route_count: routeIds.length,
    achievement_count: achievementIds.length,
  };
}

module.exports = {
  syncGameProgress,
};
