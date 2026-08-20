const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  DEFAULT_GEOREFERENCE_CONTROL_POINTS,
  convertBuildMap,
  createCollectionBounds,
  normalizePolygonPoints,
  parseCoordinateString,
  webMercatorToWgs84,
} = require("../scripts/buildmap-converter");
const {
  BUILDING_FEATURES,
  BUILDING_LANDMARK_POIS,
} = require("../miniprogram/data/buildings.generated");

const origin = webMercatorToWgs84(0, 0);
assert.strictEqual(origin.latitude, 0, "EPSG:3857 origin should convert to WGS84 latitude 0");
assert.strictEqual(origin.longitude, 0, "EPSG:3857 origin should convert to WGS84 longitude 0");

const parsedCenter = parseCoordinateString("[13344479.843857678,3008637.8159036054,0]");
assert.deepStrictEqual(
  parsedCenter.map((value) => Math.round(value)),
  [13344480, 3008638, 0],
  "coordinate string parser should return numeric array values"
);
assert.deepStrictEqual(parseCoordinateString("bad-json"), [], "bad coordinate strings should fall back to empty arrays");

const cleanedPoints = normalizePolygonPoints([
  [0, 0, 0],
  [0, 0, 0],
  [10, 0, 0],
  [10, 10, 0],
  [0, 0, 0],
]);
assert.strictEqual(cleanedPoints.length, 3, "polygon cleanup should remove consecutive and closing duplicate points");

const buildMapPath = path.join(__dirname, "..", "docs", "BuildMap.json");
const converted = convertBuildMap(JSON.parse(fs.readFileSync(buildMapPath, "utf8")));
assert.strictEqual(converted.buildings.length, 183, "BuildMap conversion should filter the obvious spatial outlier");
assert(converted.landmarkPois.length >= 12, "BuildMap conversion should expose a curated landmark POI subset");
const convertedBounds = createCollectionBounds(converted.buildings);
assert(
  convertedBounds.north - convertedBounds.south > 0.02,
  "georeferenced buildings should not be vertically collapsed into a tiny campus-center strip"
);
assert(
  convertedBounds.east - convertedBounds.west > 0.01,
  "georeferenced buildings should not be horizontally collapsed into a tiny campus-center strip"
);

const sampleBuilding = converted.buildings[0];
assert(sampleBuilding.id.indexOf("building-") === 0, "building id should be namespaced");
assert(sampleBuilding.sourceId, "building should keep sourceId");
assert(sampleBuilding.name, "building should keep name");
assert(sampleBuilding.areaId, "building should keep areaId");
assert(sampleBuilding.center && typeof sampleBuilding.center.latitude === "number", "building should expose map center");
assert(sampleBuilding.points.length >= 3, "building should expose at least three polygon points");
assert(sampleBuilding.bounds && Number.isFinite(sampleBuilding.bounds.north), "building should expose bounds");
assert(!sampleBuilding.sourceCenter && !sampleBuilding.sourcePoints, "internal source geometry should not leak into generated buildings");

const convertedBySourceId = converted.buildings.reduce((map, building) => {
  map[building.sourceId] = building;
  return map;
}, {});
DEFAULT_GEOREFERENCE_CONTROL_POINTS.forEach((controlPoint) => {
  const building = convertedBySourceId[controlPoint.sourceId];
  assert(building, `control building ${controlPoint.sourceId} should exist`);
  assert.strictEqual(building.center.latitude, controlPoint.latitude, `control ${controlPoint.sourceId} latitude should be exact`);
  assert.strictEqual(building.center.longitude, controlPoint.longitude, `control ${controlPoint.sourceId} longitude should be exact`);
});

const convertedLibrary = convertedBySourceId["11171"];
assert(convertedLibrary.bounds.east - convertedLibrary.bounds.west > 0.0005, "library polygon should keep a visible footprint");
assert(convertedLibrary.bounds.north - convertedLibrary.bounds.south > 0.002, "library polygon should keep a visible footprint");

assert.strictEqual(BUILDING_FEATURES.length, 183, "generated mini program data should contain valid converted buildings");
assert(BUILDING_FEATURES.every((building) => building.points.length >= 3), "generated buildings should all have valid polygons");
assert(BUILDING_LANDMARK_POIS.length >= 12, "generated mini program data should contain curated POIs");
const generatedBySourceId = BUILDING_FEATURES.reduce((map, building) => {
  map[building.sourceId] = building;
  return map;
}, {});
DEFAULT_GEOREFERENCE_CONTROL_POINTS.forEach((controlPoint) => {
  const building = generatedBySourceId[controlPoint.sourceId];
  assert(building, `generated control building ${controlPoint.sourceId} should exist`);
  assert.strictEqual(building.center.latitude, controlPoint.latitude, `generated control ${controlPoint.sourceId} latitude should be exact`);
  assert.strictEqual(building.center.longitude, controlPoint.longitude, `generated control ${controlPoint.sourceId} longitude should be exact`);
});

console.log(`BuildMap converter tests passed: ${BUILDING_FEATURES.length} buildings.`);
