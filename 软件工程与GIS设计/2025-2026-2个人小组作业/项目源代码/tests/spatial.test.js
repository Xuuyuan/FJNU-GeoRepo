const assert = require("assert");

const {
  CAMPUS_BOUNDS,
  CAMPUS_AREA_POINTS,
  GATE_FEATURES,
  GRID_CELL_SIZE_METERS,
  GRID_FEATURES,
  OPEN_SPACE_FEATURES,
  POI_LAND_FEATURES,
  POI_FEATURES,
  POI_MARKERS_VISIBLE,
  createCampusPolygons,
  createPoiMarkers,
} = require("../miniprogram/data/campus");
const {
  ACHIEVEMENT_RULES,
  POI_GRID_GROUPS,
  ROUTE_GRID_GROUPS,
  UNREACHABLE_GRID_ID_SET,
  evaluateAchievements,
  evaluateRouteCompletions,
  getPoiRuleByGridId,
} = require("../miniprogram/data/game-config");
const {
  createGridFeatureSpatialIndex,
  findBufferedGridIds,
  findIntersectedGridIds,
  findPoiInRange,
  getDistanceInMeters,
  getPointToSegmentDistanceInMeters,
  isPointInBounds,
  isPointInPolygon,
} = require("../miniprogram/utils/spatial");
const {
  createPoiDiscovery,
  getQuizConfig,
} = require("../miniprogram/services/poi-service");

const GPS_GRID_UNLOCK_RADIUS_METERS = 20;
const GRID_SPATIAL_INDEX = createGridFeatureSpatialIndex(GRID_FEATURES);

const demoRouteRule = ROUTE_GRID_GROUPS[0];
const demoRoute = demoRouteRule.path;
const demoRouteAchievement = ACHIEVEMENT_RULES.find((rule) => {
  return rule.type === "route_completion" && rule.route_id === demoRouteRule.route_id;
});

function collectUnlockedGridIds(route) {
  const litGridIdSet = new Set();
  for (let index = 1; index < route.length; index += 1) {
    const ids = findBufferedGridIds(
      route[index - 1],
      route[index],
      GRID_FEATURES,
      litGridIdSet,
      GPS_GRID_UNLOCK_RADIUS_METERS
    );
    ids.forEach((id) => litGridIdSet.add(id));
  }
  return litGridIdSet;
}

function collectIndexedUnlockedGridIds(route) {
  const litGridIdSet = new Set();
  for (let index = 1; index < route.length; index += 1) {
    const ids = findBufferedGridIds(
      route[index - 1],
      route[index],
      GRID_SPATIAL_INDEX,
      litGridIdSet,
      GPS_GRID_UNLOCK_RADIUS_METERS
    );
    ids.forEach((id) => litGridIdSet.add(id));
  }
  return litGridIdSet;
}

function collectStrictIntersectedGridIds(route) {
  const litGridIdSet = new Set();
  for (let index = 1; index < route.length; index += 1) {
    const ids = findIntersectedGridIds(route[index - 1], route[index], GRID_FEATURES, litGridIdSet);
    ids.forEach((id) => litGridIdSet.add(id));
  }
  return litGridIdSet;
}

function collectDiscoveredPoiIds(route) {
  const visitedPoiIdSet = new Set();
  route.forEach((point) => {
    const poi = findPoiInRange(point, POI_FEATURES, visitedPoiIdSet);
    if (poi) {
      visitedPoiIdSet.add(poi.id);
    }
  });
  return visitedPoiIdSet;
}

assert.strictEqual(GRID_CELL_SIZE_METERS, 5, "logical exploration grid should use 5m cells");
assert(GRID_FEATURES.length > 50000, "5m campus-only grid should contain fine-grained exploration cells");
assert(UNREACHABLE_GRID_ID_SET.size > 0, "unreachable areas should mark at least one grid");
assert(
  GRID_FEATURES.every((feature) => feature.points.every((point) => isPointInPolygon(point, CAMPUS_AREA_POINTS))),
  "every grid corner should stay inside the campus polygon"
);
const sampleGrid = GRID_FEATURES[Math.floor(GRID_FEATURES.length / 2)];
const sampleWidth = getDistanceInMeters(sampleGrid.points[0], sampleGrid.points[1]);
const sampleHeight = getDistanceInMeters(sampleGrid.points[0], sampleGrid.points[3]);
assert(Math.abs(sampleWidth - 5) < 0.4, "sample grid width should be close to 5m");
assert(Math.abs(sampleHeight - 5) < 0.2, "sample grid height should be close to 5m");
assert(POI_FEATURES.length >= 10, "MVP should expose at least 10 POIs for demo and extension");
assert.strictEqual(POI_MARKERS_VISIBLE, false, "POI marker display should be hidden on the default map");
assert.strictEqual(
  createPoiMarkers().length,
  GATE_FEATURES.length + OPEN_SPACE_FEATURES.length + POI_LAND_FEATURES.length,
  "default map markers should show gates, open spaces, and poi_land while keeping main POI triggers hidden"
);
assert(demoRoute.every((point) => isPointInBounds(point, CAMPUS_BOUNDS, 0.0012)), "configured route should stay in campus bounds");

const unlockedGridIds = collectUnlockedGridIds(demoRoute);
const indexedUnlockedGridIds = collectIndexedUnlockedGridIds(demoRoute);
const strictGridIds = collectStrictIntersectedGridIds(demoRoute);
assert.deepStrictEqual(
  Array.from(indexedUnlockedGridIds).sort(),
  Array.from(unlockedGridIds).sort(),
  "spatial index should preserve buffered grid matching results"
);
assert(unlockedGridIds.size > strictGridIds.size, "20m GPS buffer should light more cells than strict line intersection");
assert(unlockedGridIds.size >= 1000, "20m buffered demo route should light a realistic corridor of 5m cells");
assert.strictEqual(
  Math.round(getPointToSegmentDistanceInMeters(demoRoute[0], demoRoute[0], demoRoute[1])),
  0,
  "point-to-segment distance should be 0 for a segment endpoint"
);

const secondPassGridIds = collectUnlockedGridIds(demoRoute);
assert.deepStrictEqual(
  Array.from(secondPassGridIds).sort(),
  Array.from(unlockedGridIds).sort(),
  "same configured route should produce stable grid unlock results"
);

const discoveredPoiIds = collectDiscoveredPoiIds(POI_FEATURES.slice(0, 4).map((poi) => poi.triggerPoints[0]));
assert(discoveredPoiIds.size >= 3, "POI trigger points should discover imported main_poi features");

assert(POI_GRID_GROUPS.every((poiRule) => poiRule.grid_ids.length > 0), "each POI should bind to at least one logical grid");
assert(ROUTE_GRID_GROUPS.every((routeRule) => routeRule.grid_ids.length > 0), "each route should bind to at least one logical grid");
const liyuanTestPoi = POI_GRID_GROUPS.find((poiRule) => poiRule.poi_id === "poi-liyuan-5-test");
assert(liyuanTestPoi, "custom Liyuan 5 test landmark should be configured");
assert(liyuanTestPoi.grid_ids.length > 0, "custom Liyuan 5 test landmark should bind to reachable grids");

const visitedPoiIdSet = new Set();
for (const gridId of unlockedGridIds) {
  const poiRule = getPoiRuleByGridId(gridId, visitedPoiIdSet);
  if (poiRule) {
    visitedPoiIdSet.add(poiRule.poi_id);
  }
}
assert(visitedPoiIdSet.size >= 3, "grid-trigger POI logic should discover imported main_poi features");

const touchPoiRule = POI_GRID_GROUPS.find((poiRule) => visitedPoiIdSet.has(poiRule.poi_id));
assert(touchPoiRule, "grid-trigger POI logic should find a discoverable imported main_poi rule");

const quizPoiIds = ["poi-library", "poi-baochen-plaza", "poi-xingyu-lake", "poi-sports-college"];
quizPoiIds.forEach((poiId) => {
  const quizPoiRule = POI_GRID_GROUPS.find((poiRule) => poiRule.poi_id === poiId);
  assert(quizPoiRule, `${poiId} should be configured as a POI rule`);
  assert.strictEqual(quizPoiRule.unlock_mode, "quiz", `${poiId} should require quiz discovery`);
  assert(quizPoiRule.quiz && Array.isArray(quizPoiRule.quiz.options), `${poiId} should include quiz options`);
  assert(quizPoiRule.quiz.options.length >= 2, `${poiId} should include at least two quiz options`);
  assert(quizPoiRule.quiz.options.some((option) => option.is_correct), `${poiId} should include a correct quiz option`);
  assert(
    getQuizConfig(quizPoiRule).options.every((option) => option.label),
    `${poiId} should expose display labels for quiz options`
  );
});

assert(
  POI_GRID_GROUPS.some((poiRule) => poiRule.unlock_mode === "touch"),
  "non-quiz POIs should still support touch discovery"
);

const duplicateTriggerPoi = POI_FEATURES.find((poi) => poi.triggerPoints.length > 1);
assert(duplicateTriggerPoi, "imported main_poi data should preserve duplicate trigger points under one poi_id");

const duplicateVisitedPoiIdSet = new Set();
const duplicateSessionRuntime = {
  discoveredPoiIdSet: new Set(),
  discoveredPoiNames: [],
};
const duplicatePendingPoiSyncMap = {};
const trackPoiDiscovery = (runtime, poiId, poiName) => {
  runtime.discoveredPoiIdSet.add(poiId);
  runtime.discoveredPoiNames.push(poiName);
};
const duplicatePoiRule = POI_GRID_GROUPS.find((poiRule) => poiRule.poi_id === duplicateTriggerPoi.id);
createPoiDiscovery({
  poiRule: duplicatePoiRule,
  visitedPoiIdSet: duplicateVisitedPoiIdSet,
  sessionRuntime: duplicateSessionRuntime,
  pendingPoiSyncMap: duplicatePendingPoiSyncMap,
  trackSessionPoiDiscovery: trackPoiDiscovery,
});
const duplicateDiscovery = createPoiDiscovery({
  poiRule: duplicatePoiRule,
  visitedPoiIdSet: duplicateVisitedPoiIdSet,
  sessionRuntime: duplicateSessionRuntime,
  pendingPoiSyncMap: duplicatePendingPoiSyncMap,
  trackSessionPoiDiscovery: trackPoiDiscovery,
});
assert.strictEqual(duplicateDiscovery, null, "same poi_id should not be discovered twice");
assert.strictEqual(duplicateSessionRuntime.discoveredPoiNames.length, 1, "duplicate trigger points should only record one discovery");

const completedRouteIdSet = new Set();
const completedRoutes = evaluateRouteCompletions(unlockedGridIds, completedRouteIdSet);
completedRoutes.forEach((routeRule) => completedRouteIdSet.add(routeRule.route_id));
assert(completedRouteIdSet.has(demoRouteRule.route_id), "configured route should complete its route achievement target");

const earnedAchievementIdSet = new Set();
const achievements = evaluateAchievements({
  litGridIdSet: unlockedGridIds,
  visitedPoiIdSet,
  completedRouteIdSet,
  earnedAchievementIdSet,
});
assert(achievements.some((achievement) => achievement.achievement_id === "grid-first-step"), "first lit grid should unlock first grid achievement");
assert(achievements.some((achievement) => achievement.achievement_id === "grid-hundred"), "100 lit grids should unlock hundred-grid achievement");
assert(demoRouteAchievement, "configured route should have a route completion achievement");
assert(achievements.some((achievement) => achievement.achievement_id === demoRouteAchievement.achievement_id), "route completion should unlock route achievement");
assert(achievements.some((achievement) => achievement.achievement_id === "poi-first-three"), "three POIs should unlock first POI achievement");

const firstGridOnlyAchievements = evaluateAchievements({
  litGridIdSet: new Set([Array.from(unlockedGridIds)[0]]),
  visitedPoiIdSet: new Set(),
  completedRouteIdSet: new Set(),
  earnedAchievementIdSet: new Set(),
});
assert(firstGridOnlyAchievements.some((achievement) => achievement.achievement_id === "grid-first-step"), "one lit grid should unlock first-step achievement");
assert(!firstGridOnlyAchievements.some((achievement) => achievement.achievement_id === "grid-hundred"), "one lit grid should not unlock hundred-grid achievement");

const alreadyEarnedAchievements = evaluateAchievements({
  litGridIdSet: unlockedGridIds,
  visitedPoiIdSet,
  completedRouteIdSet,
  earnedAchievementIdSet: new Set(["grid-first-step"]),
});
assert(!alreadyEarnedAchievements.some((achievement) => achievement.achievement_id === "grid-first-step"), "earned achievements should not be returned again");

const emptyCampusPolygons = createCampusPolygons(new Set());
const litCampusPolygons = createCampusPolygons(new Set([sampleGrid.id]));
assert.strictEqual(emptyCampusPolygons[0], litCampusPolygons[0], "campus boundary polygon should be reused across map refreshes");
assert.strictEqual(
  emptyCampusPolygons.length > 1,
  true,
  "default map display should include campus boundary and imported GIS polygons before grid unlocks"
);
assert.strictEqual(
  litCampusPolygons.length,
  emptyCampusPolygons.length + 1,
  "lit map display should add newly lit grid polygons on top of imported GIS polygons"
);

console.log(`Spatial tests passed: ${unlockedGridIds.size} grids, ${discoveredPoiIds.size} POIs.`);
