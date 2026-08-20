const assert = require("assert");

const {
  createAchievementCenterView,
  createDashboardView,
  createHistoryView,
  createLeaderboardView,
  createPoiGalleryView,
  createRouteGalleryView,
  createSessionResultView,
  formatDateTime,
  formatDistance,
  formatHistoryDuration,
  formatResultDuration,
} = require("../miniprogram/services/page-model-service");
const { createUserStats } = require("../miniprogram/services/progress-service");
const { POI_FEATURES } = require("../miniprogram/data/campus");
const {
  ACHIEVEMENT_RULES,
  ROUTE_GRID_GROUPS,
  applyAchievementRuntimeConfig,
  applyRouteRuntimeConfig,
} = require("../miniprogram/data/game-config");

const samplePoiIds = POI_FEATURES.slice(0, 2).map((poi) => poi.id);
const sampleRouteId = ROUTE_GRID_GROUPS[0] ? ROUTE_GRID_GROUPS[0].route_id : "route-central-landmarks";

assert.strictEqual(formatDistance(1200), "1.20 km", "distance over 1000m should use km text");
assert.strictEqual(formatDistance(-5), "0 m", "negative distance should be clamped");
assert.strictEqual(formatHistoryDuration(3661), "1小时 1分", "history duration should use compact hour text");
assert.strictEqual(formatResultDuration(3661), "1小时 1分 1秒", "result duration should include seconds");
assert.strictEqual(formatDateTime({ $date: "2026-05-13T12:18:43.470Z" }).length, 11, "CloudBase date objects should format");
assert.strictEqual(formatDateTime("bad-date"), "--", "invalid dates should fall back safely");

assert.strictEqual(createSessionResultView(null), null, "missing session result should return null for page redirect flow");
const sessionResultView = createSessionResultView({
  campusName: "旗山校区",
  durationSeconds: 65,
  distanceMeters: 1234,
  totalUnlockedGridCount: 70,
  sessionUnlockedGridCount: 5,
  trackPointCount: 8,
  startTime: "2026-05-13T12:00:00.000Z",
  endTime: "2026-05-13T12:01:05.000Z",
  discoveredPoiNames: ["宝琛广场", "图书馆"],
  completedRouteNames: [],
  earnedAchievementNames: ["初识旗山"],
});
assert.strictEqual(sessionResultView.distanceText, "1.23 km", "session result should format fallback distance");
assert.strictEqual(sessionResultView.durationText, "1分 5秒", "session result should format fallback duration");
assert.strictEqual(sessionResultView.discoveredPoiText, "宝琛广场、图书馆", "session result should join POI names");
assert.strictEqual(sessionResultView.completedRouteText, "本次没有完成新路线", "empty route text should be explicit");
assert.strictEqual(sessionResultView.hasSessionResult, true, "session result view should mark data as present");

const historyRecords = [
  {
    session_id: "older",
    start_time: "2026-05-13T12:00:00.000Z",
    end_time: "2026-05-13T12:05:00.000Z",
    duration_seconds: 300,
    distance_meters: 250,
    session_unlocked_grid_count: 3,
    discovered_poi_ids: ["poi-a"],
  },
  {
    session_id: "newer",
    start_time: "2026-05-13T12:10:00.000Z",
    end_time: "2026-05-13T12:20:00.000Z",
    duration_seconds: 600,
    distance_meters: 1000,
    session_unlocked_grid_count: 7,
    completed_route_ids: ["route-a"],
    earned_achievement_ids: ["ach-a", "ach-b"],
    track_point_count: 12,
    track_points_sampled: [{ latitude: 26.1, longitude: 119.1 }],
  },
];
const historyView = createHistoryView(historyRecords);
assert.strictEqual(historyView.sessions[0].id, "newer", "history sessions should sort newest first");
assert.strictEqual(historyView.sessions[1].poiText, "发现 1 个地标", "history should summarize POI count");
assert.strictEqual(historyView.sessions[0].routeText, "完成 1 条路线", "history should summarize route count");
assert.strictEqual(historyView.sessions[0].achievementText, "解锁 2 个成就", "history should summarize achievement count");
assert.strictEqual(historyView.sessions[0].detailText, "轨迹点 12 · 采样保存 1 点", "history should expose sampled track detail");
assert.strictEqual(historyView.totalDistanceText, "累计 1.25 km", "history should summarize total distance");
assert.strictEqual(createHistoryView(historyRecords, "route").sessions.length, 1, "history route filter should keep route sessions");
const emptyPoiHistoryView = createHistoryView([historyRecords[1]], "poi");
assert.strictEqual(emptyPoiHistoryView.allSessionCount, 1, "history empty filters should keep original session count");
assert.strictEqual(emptyPoiHistoryView.historyEmptyTitle, "当前筛选暂无记录", "history empty filter should use filtered empty title");

const poiGalleryView = createPoiGalleryView({
  poiFeatures: [
    { id: "poi-a", name: "本地 A", type: "study", radius: 20, latitude: 26.1, longitude: 119.1, knowledge: "本地知识 A" },
    { id: "poi-b", name: "本地 B", type: "unknown", radius: 30, latitude: 26.2, longitude: 119.2 },
  ],
  poiRecords: [
    { poi_id: "poi-a", trigger_time: { $date: "2026-05-13T12:18:43.470Z" } },
  ],
  runtimeConfigCache: {
    data: {
      poi: {
        items: [
          { poi_id: "poi-b", name: "云端 B" },
        ],
      },
    },
  },
});
assert.strictEqual(poiGalleryView.totalCount, 2, "gallery should keep all local POIs");
assert.strictEqual(poiGalleryView.discoveredCount, 1, "gallery should count discovered records");
assert.strictEqual(poiGalleryView.progressPercent, 50, "gallery should calculate progress percent");
assert.strictEqual(poiGalleryView.poiItems[0].typeText, "学习空间", "gallery should map known POI type");
assert.strictEqual(poiGalleryView.poiItems[0].discovered, true, "gallery should mark discovered POI");
assert.strictEqual(poiGalleryView.poiItems[0].knowledge, "本地知识 A", "gallery should show knowledge for discovered POIs");
assert.strictEqual(poiGalleryView.poiItems[0].locationText, "", "gallery should hide coordinates outside debug mode");
assert.strictEqual(poiGalleryView.poiItems[1].knowledge, "", "gallery should hide knowledge for locked POIs");
assert.strictEqual(poiGalleryView.poiItems[1].name, "云端 B", "gallery should apply runtime POI name override");
const debugPoiGalleryView = createPoiGalleryView({
  poiFeatures: [
    { id: "poi-a", name: "本地 A", type: "study", radius: 20, latitude: 26.1, longitude: 119.1 },
  ],
  poiRecords: [
    { poi_id: "poi-a" },
  ],
  runtimeConfigCache: null,
  debugModeEnabled: true,
});
assert.strictEqual(debugPoiGalleryView.poiItems[0].locationText, "26.100000, 119.100000", "gallery should show coordinates in debug mode");
const lockedPoiGalleryView = createPoiGalleryView({
  poiFeatures: [
    { id: "poi-a", name: "本地 A", type: "study", radius: 20, latitude: 26.1, longitude: 119.1 },
    { id: "poi-b", name: "本地 B", type: "landmark", radius: 30, latitude: 26.2, longitude: 119.2 },
  ],
  poiRecords: [
    { poi_id: "poi-a" },
  ],
  runtimeConfigCache: {
    data: {
      poi: {
        items: [
          {
            poi_id: "poi-b",
            name: "云端 B",
            description: "云端简介",
            knowledge: "云端知识",
            unlock_mode: "quiz",
            quiz: { question: "云端题目" },
          },
        ],
      },
    },
  },
  filterKey: "locked",
});
assert.strictEqual(lockedPoiGalleryView.visibleCount, 1, "gallery locked filter should hide discovered POIs");
assert.strictEqual(lockedPoiGalleryView.poiItems[0].description, "云端简介", "gallery should show cloud POI description");
assert.strictEqual(lockedPoiGalleryView.poiItems[0].unlockModeText, "答题解锁", "gallery should show quiz unlock mode");

const routeGalleryView = createRouteGalleryView({
  routeRules: [
    {
      route_id: "route-a",
      name: "路线 A",
      description: "路线说明",
      complete_ratio: 0.5,
      poi_ids: samplePoiIds,
      grid_ids: ["grid-a", "grid-b"],
    },
  ],
  poiFeatures: POI_FEATURES,
  cloudProgress: {
    grids: [
      { grid_id: "grid-a" },
    ],
    route_records: [],
    track_sessions: [],
  },
  localGameProgress: {},
  localGridStatus: {},
});
assert.strictEqual(routeGalleryView.totalRouteCount, 1, "route gallery should count configured routes");
assert.strictEqual(routeGalleryView.completedRouteCount, 1, "route gallery should mark routes complete when progress reaches threshold");
assert.strictEqual(routeGalleryView.routeItems[0].poiNames.length, samplePoiIds.length, "route gallery should expose route POI names");
assert.strictEqual(routeGalleryView.routeItems[0].progressPercent, 50, "route gallery should calculate route grid progress");

const localGridStatus = Array.from({ length: 125 }).reduce((map, _, index) => {
  map[`grid-${index}`] = "2026-05-13T12:00:00.000Z";
  return map;
}, {});
const achievementCenterView = createAchievementCenterView({
  achievementRules: ACHIEVEMENT_RULES,
  routeRules: ROUTE_GRID_GROUPS,
  poiFeatures: POI_FEATURES,
  cloudProgress: {
    grids: [
      { grid_id: "grid-cloud-a" },
    ],
    poi_records: [
      { poi_id: samplePoiIds[0] },
      { poi_id: samplePoiIds[1] },
    ],
    track_sessions: [
      {
        earned_achievement_ids: ["poi-first"],
        total_earned_achievement_ids: ["route-first"],
        completed_route_ids: [sampleRouteId],
      },
    ],
  },
  localGameProgress: {
    completedRouteIds: [sampleRouteId],
    earnedAchievementIds: ["grid-first-step"],
  },
  localGridStatus,
});
assert.strictEqual(achievementCenterView.totalCount, ACHIEVEMENT_RULES.length, "achievement center should expose configured achievements");
assert.strictEqual(achievementCenterView.achievementItems[0].id, "grid-first-step", "achievement center should sort by sort_order");
const gridHundred = achievementCenterView.achievementItems.find((item) => item.id === "grid-hundred");
const gridFiveHundred = achievementCenterView.achievementItems.find((item) => item.id === "grid-five-hundred");
const poiThree = achievementCenterView.achievementItems.find((item) => item.id === "poi-first-three");
const routeFirst = achievementCenterView.achievementItems.find((item) => item.id === "route-first");
assert(gridHundred.unlocked, "125 local grids plus cloud grids should unlock hundred-grid achievement");
assert.strictEqual(gridFiveHundred.progressText, "126 / 500 格", "locked grid achievement should show current progress");
assert.strictEqual(poiThree.progressText, "2 / 3 个地标", "locked POI achievement should show POI progress");
assert(routeFirst.unlocked, "local and cloud route completion should unlock route count achievement");
assert(achievementCenterView.unlockedCount >= 5, "achievement center should merge local and cloud unlocked states");

const cloudRouteRules = applyRouteRuntimeConfig(ROUTE_GRID_GROUPS, {
  data: {
    route: {
      items: [{ route_id: sampleRouteId, name: "云端路线名" }],
    },
  },
});
const cloudAchievementRules = applyAchievementRuntimeConfig(ACHIEVEMENT_RULES, {
  data: {
    achievement: {
      items: [{ achievement_id: "grid-first-step", name: "云端成就名" }],
    },
  },
});
assert.strictEqual(cloudRouteRules[0].name, "云端路线名", "route runtime config should override display name");
assert.strictEqual(cloudAchievementRules[0].name, "云端成就名", "achievement runtime config should override display name");

const emptyAchievementCenterView = createAchievementCenterView({
  achievementRules: [],
  routeRules: [],
  poiFeatures: [],
  cloudProgress: {
    track_sessions: [
      {
        earned_achievement_ids: "bad",
      },
    ],
  },
  localGameProgress: {},
  localGridStatus: null,
});
assert.strictEqual(emptyAchievementCenterView.totalCount, 0, "empty achievement rules should be safe");
assert.strictEqual(emptyAchievementCenterView.progressPercent, 0, "empty achievement progress should be zero");

const dashboardView = createDashboardView({
  userStats: createUserStats({
    gridCount: 125,
    totalGridCount: 1000,
    poiCount: 3,
    totalPoiCount: 10,
    routeCount: 1,
    achievementCount: 4,
    totalAchievementCount: 12,
  }),
  recentSessions: [
    { session_id: "recent", end_time: "2026-05-13T12:00:00.000Z", distance_meters: 100, duration_seconds: 10 },
  ],
  statsSummary: {
    user_count: 2,
    session_count: 3,
  },
  leaderboardItems: [
    { rank: 1, user_id: "u1", nick_name: "A", total_grids: 10, poi_count: 2, achievement_count: 1, explore_ratio: 1.2 },
    { rank: 2, user_id: "u2", nick_name: "B", total_grids: 8, poi_count: 1, achievement_count: 0, explore_ratio: 0.8 },
  ],
});
assert(dashboardView.score > 0, "dashboard should expose calculated score");
assert.strictEqual(dashboardView.recentSessions.length, 1, "dashboard should expose recent sessions");
assert.strictEqual(dashboardView.leaderboardRows.length, 2, "dashboard should expose leaderboard preview rows");
assert.strictEqual(dashboardView.leaderboardRows[0].metricText, "10 网格", "dashboard leaderboard should use grid metric");

const leaderboardView = createLeaderboardView({
  metric: "poi",
  currentUserId: "u1",
  currentUserRank: 1,
  currentUserItem: { rank: 1, user_id: "u1", nick_name: "A", total_grids: 10, poi_count: 2, achievement_count: 1, explore_ratio: 1.2 },
  items: [
    { rank: 1, user_id: "u1", nick_name: "A", total_grids: 10, poi_count: 2, achievement_count: 1, explore_ratio: 1.2 },
  ],
});
assert.strictEqual(leaderboardView.rows[0].metricText, "2 地标", "leaderboard should format selected metric");
assert.strictEqual(leaderboardView.rows[0].isCurrentUser, true, "leaderboard should mark current user row");
assert.strictEqual(leaderboardView.currentUserRow.metricText, "2 地标", "leaderboard should expose current user rank card");

console.log("Page model tests passed.");
