const { cloud, db } = require("../lib/cloud-context");
const { ensureCollections } = require("../lib/collections");
const { resolveDisplayName } = require("../lib/display-name");
const { FUNCTION_VERSION } = require("../lib/version");

const METRIC_FIELD_MAP = {
  poi: "poi_count",
  achievement: "achievement_count",
  grid: "total_grids",
};

function normalizeMetric(metric) {
  return METRIC_FIELD_MAP[metric] ? metric : "grid";
}

function sortByMetric(records, metric) {
  const safeMetric = normalizeMetric(metric);
  const fieldName = METRIC_FIELD_MAP[safeMetric];
  return records.slice().sort((left, right) => {
    const metricDiff = (Number(right[fieldName]) || 0) - (Number(left[fieldName]) || 0);
    if (metricDiff) {
      return metricDiff;
    }

    const gridDiff = (Number(right.total_grids) || 0) - (Number(left.total_grids) || 0);
    if (gridDiff) {
      return gridDiff;
    }

    const poiDiff = (Number(right.poi_count) || 0) - (Number(left.poi_count) || 0);
    if (poiDiff) {
      return poiDiff;
    }

    return `${left.user_id || ""}`.localeCompare(`${right.user_id || ""}`);
  });
}

async function readCollection(collectionName, limitCount) {
  const result = await db.collection(collectionName).where({}).limit(limitCount).get().catch(() => ({ data: [] }));
  return result.data || [];
}

async function getLeaderboard(event) {
  const metric = normalizeMetric(event.data && event.data.metric ? event.data.metric : "grid");
  const limitCount = Math.min(50, Math.max(1, Number(event.data && event.data.limit) || 20));

  await ensureCollections();

  const profiles = await readCollection("userinfo", 1000);
  const context = cloud.getWXContext ? cloud.getWXContext() : {};
  const currentUserId = context.OPENID || "";
  const rankedItems = sortByMetric(profiles.map((profile) => {
    const userId = profile._id || profile.user_id;
    return {
      user_id: userId,
      nick_name: resolveDisplayName({
        userId,
        nickName: profile.nick_name,
      }),
      total_grids: Number(profile.total_grids) || 0,
      explore_ratio: Number(profile.explore_ratio) || 0,
      poi_count: Number(profile.poi_count) || 0,
      route_count: Number(profile.route_count) || 0,
      achievement_count: Number(profile.achievement_count) || 0,
    };
  }).filter((profile) => profile.user_id), metric)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  const currentUserItem = rankedItems.find((item) => item.user_id === currentUserId) || null;

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    metric,
    current_user_id: currentUserId,
    current_user_rank: currentUserItem ? currentUserItem.rank : 0,
    current_user_item: currentUserItem,
    items: rankedItems.slice(0, limitCount),
  };
}

async function getExploreStats() {
  await ensureCollections();

  const profiles = await readCollection("userinfo", 1000);
  const profileSummary = profiles.reduce((summary, profile) => ({
    gridRecordCount: summary.gridRecordCount + (Number(profile.total_grids) || 0),
    poiRecordCount: summary.poiRecordCount + (Number(profile.poi_count) || 0),
    routeRecordCount: summary.routeRecordCount + (Number(profile.route_count) || 0),
    achievementRecordCount: summary.achievementRecordCount + (Number(profile.achievement_count) || 0),
    sessionCount: summary.sessionCount + (Number(profile.session_count) || 0),
  }), {
    gridRecordCount: 0,
    poiRecordCount: 0,
    routeRecordCount: 0,
    achievementRecordCount: 0,
    sessionCount: 0,
  });

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    summary: {
      user_count: profiles.length,
      grid_record_count: profileSummary.gridRecordCount,
      poi_record_count: profileSummary.poiRecordCount,
      route_record_count: profileSummary.routeRecordCount,
      achievement_record_count: profileSummary.achievementRecordCount,
      session_count: profileSummary.sessionCount,
      privacy_note: "当前仅返回用户级汇总后的排行榜与统计计数。",
    },
  };
}

module.exports = {
  getExploreStats,
  getLeaderboard,
};
