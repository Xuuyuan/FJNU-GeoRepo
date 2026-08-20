const { cloud, db } = require("../lib/cloud-context");
const { ensureCollections } = require("../lib/collections");
const {
  removeDocument,
  removeDocumentsByUserId,
  setDocument,
} = require("../lib/database");
const { resolveDisplayName } = require("../lib/display-name");
const { FUNCTION_VERSION } = require("../lib/version");

const USER_DATA_COLLECTIONS = [
  "userinfo",
  "gridstatus",
  "track_sessions",
  "poi_records",
  "route_records",
  "achievement_records",
];

function getOpenId() {
  const context = cloud.getWXContext();
  return {
    success: true,
    function_version: FUNCTION_VERSION,
    openid: context.OPENID,
    appid: context.APPID,
    unionid: context.UNIONID,
  };
}

async function initUserProfile(event) {
  const context = cloud.getWXContext();
  const openid = context.OPENID;
  const payload = event.data || {};
  await ensureCollections();

  const collection = db.collection("userinfo");
  const existing = await collection.doc(openid).get().catch(() => null);
  const existingData = existing && existing.data ? existing.data : {};
  const nextProfile = {
    nick_name: resolveDisplayName({
      userId: openid,
      nickName: payload.nick_name,
      existingNickName: existingData.nick_name,
    }),
    total_grids: typeof payload.total_grids === "number"
      ? payload.total_grids
      : (existingData.total_grids || 0),
    explore_ratio: typeof payload.explore_ratio === "number"
      ? payload.explore_ratio
      : (existingData.explore_ratio || 0),
    poi_count: typeof payload.poi_count === "number" ? payload.poi_count : (existingData.poi_count || 0),
    route_count: typeof payload.route_count === "number" ? payload.route_count : (existingData.route_count || 0),
    achievement_count: typeof payload.achievement_count === "number"
      ? payload.achievement_count
      : (existingData.achievement_count || 0),
    session_count: typeof payload.session_count === "number" ? payload.session_count : (existingData.session_count || 0),
    updated_at: db.serverDate(),
  };

  await setDocument("userinfo", openid, nextProfile);

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    data: nextProfile,
  };
}

async function getUserProgress() {
  const context = cloud.getWXContext();
  const openid = context.OPENID;

  await ensureCollections();

  const profileResult = await db.collection("userinfo").doc(openid).get().catch(() => null);
  const gridResult = await db.collection("gridstatus")
    .where({
      user_id: openid,
    })
    .limit(1000)
    .get();
  const poiResult = await db.collection("poi_records")
    .where({
      user_id: openid,
    })
    .limit(1000)
    .get();
  const sessionResult = await db.collection("track_sessions")
    .where({
      user_id: openid,
    })
    .limit(100)
    .get();
  const routeResult = await db.collection("route_records")
    .where({
      user_id: openid,
    })
    .limit(1000)
    .get();
  const achievementResult = await db.collection("achievement_records")
    .where({
      user_id: openid,
    })
    .limit(1000)
    .get();

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    profile: profileResult && profileResult.data ? profileResult.data : null,
    grids: gridResult.data || [],
    poi_records: poiResult.data || [],
    track_sessions: sessionResult.data || [],
    route_records: routeResult.data || [],
    achievement_records: achievementResult.data || [],
  };
}

async function syncExploreSummary(event) {
  const context = cloud.getWXContext();
  const openid = context.OPENID;
  const payload = event.data || {};

  await ensureCollections();

  const collection = db.collection("userinfo");
  const existing = await collection.doc(openid).get().catch(() => null);
  const existingData = existing && existing.data ? existing.data : {};
  const sessionCountDelta = typeof payload.session_count_delta === "number" ? payload.session_count_delta : 0;

  await setDocument("userinfo", openid, {
    nick_name: resolveDisplayName({
      userId: openid,
      nickName: payload.nick_name,
      existingNickName: existingData.nick_name,
    }),
    total_grids: typeof payload.total_grids === "number" ? payload.total_grids : (existingData.total_grids || 0),
    explore_ratio: typeof payload.explore_ratio === "number" ? payload.explore_ratio : (existingData.explore_ratio || 0),
    poi_count: typeof payload.poi_count === "number" ? payload.poi_count : (existingData.poi_count || 0),
    route_count: typeof payload.route_count === "number" ? payload.route_count : (existingData.route_count || 0),
    achievement_count: typeof payload.achievement_count === "number"
      ? payload.achievement_count
      : (existingData.achievement_count || 0),
    session_count: Math.max(0, (Number(existingData.session_count) || 0) + sessionCountDelta),
    updated_at: db.serverDate(),
  });

  return {
    success: true,
    function_version: FUNCTION_VERSION,
  };
}

async function clearUserData() {
  const context = cloud.getWXContext();
  const openid = context.OPENID;

  await ensureCollections(USER_DATA_COLLECTIONS);

  const removedCounts = {};
  removedCounts.gridstatus = await removeDocumentsByUserId("gridstatus", openid);
  removedCounts.track_sessions = await removeDocumentsByUserId("track_sessions", openid);
  removedCounts.poi_records = await removeDocumentsByUserId("poi_records", openid);
  removedCounts.route_records = await removeDocumentsByUserId("route_records", openid);
  removedCounts.achievement_records = await removeDocumentsByUserId("achievement_records", openid);
  await removeDocument("userinfo", openid);
  removedCounts.userinfo = 1;

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    removed_counts: removedCounts,
  };
}

module.exports = {
  clearUserData,
  getOpenId,
  getUserProgress,
  initUserProfile,
  syncExploreSummary,
};
