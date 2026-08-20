const assert = require("assert");

const {
  GATE_FEATURES,
  GIS_METADATA,
  OPEN_SPACE_FEATURES,
  POI_LAND_FEATURES,
  POI_FEATURES,
  POI_TRIGGER_FEATURES,
  ROAD_FEATURES,
  BUILDING_FEATURES,
  createPoiMarkers,
} = require("../miniprogram/data/campus");
const {
  findMapFeatureAtPoint,
  findMapFeatureByMarkerId,
} = require("../miniprogram/services/gis-map-service");

assert.deepStrictEqual(GIS_METADATA.counts, {
  gate: 4,
  main_poi: 96,
  poi_land: 10,
  star_buil: 214,
  star_open_space: 4,
  star_road: 267,
}, "generated GIS metadata should keep source layer counts");

assert.strictEqual(BUILDING_FEATURES.length, 214, "building layer should load all ArcGIS building records");
assert.strictEqual(ROAD_FEATURES.length, 267, "road layer should load all ArcGIS road records");
assert.strictEqual(OPEN_SPACE_FEATURES.length, 4, "open-space layer should load all ArcGIS open-space records");
assert.strictEqual(GATE_FEATURES.length, 4, "gate layer should load all ArcGIS gate records");
assert.strictEqual(POI_LAND_FEATURES.length, 10, "poi_land layer should load all display POI records");
assert.strictEqual(POI_TRIGGER_FEATURES.length, 96, "main_poi trigger layer should load all trigger points");
assert(POI_FEATURES.length < POI_TRIGGER_FEATURES.length, "main_poi triggers should be grouped by poi_id");

const firstGate = GATE_FEATURES[0];
assert(firstGate.latitude > 26 && firstGate.latitude < 27, "gate latitude should be converted from UTM to GCJ-02");
assert(firstGate.longitude > 119 && firstGate.longitude < 120, "gate longitude should be converted from UTM to GCJ-02");

const duplicatePoi = POI_FEATURES.find((poi) => poi.triggerPoints.length > 1);
assert(duplicatePoi, "at least one imported POI should keep multiple trigger points under one poi_id");

const markers = createPoiMarkers();
assert.strictEqual(
  markers.length,
  GATE_FEATURES.length + OPEN_SPACE_FEATURES.length + POI_LAND_FEATURES.length,
  "default markers should show gates, open spaces, and poi_land only"
);
assert(markers.some((marker) => marker.iconPath === "/images/icons/gate.png"), "gate markers should use the gate icon");
assert(markers.some((marker) => marker.iconPath === "/images/icons/poi-land-lake.png"), "lake poi_land marker should use the lake icon");
assert(markers.some((marker) => marker.iconPath === "/images/icons/poi-land-library.png"), "library poi_land marker should use the library icon");
assert(POI_LAND_FEATURES.some((feature) => feature.name === "星雨湖" && feature.type === "湖泊"), "poi_land should preserve Star Rain Lake fields");
assert(POI_LAND_FEATURES.some((feature) => feature.name === "佘明培楼" && feature.type === "行政楼"), "poi_land should preserve office building fields");

const gateInfo = findMapFeatureByMarkerId(markers[0].id);
assert(gateInfo && gateInfo.kind === "gate", "gate marker tap should resolve gate feature info");
assert(gateInfo.fieldRows.length > 0, "gate feature info should expose ArcGIS fields");

const poiLandMarker = markers.find((marker) => marker.id >= 22000 && marker.id < 23000);
const poiLandInfo = findMapFeatureByMarkerId(poiLandMarker.id);
assert(poiLandInfo && poiLandInfo.kind === "poi_land", "poi_land marker tap should resolve display POI feature info");
assert(poiLandInfo.fieldRows.some((row) => row.label === "类型"), "poi_land feature info should expose type field");

const buildingSample = BUILDING_FEATURES.find((feature) => {
  const info = findMapFeatureAtPoint(feature.center);
  return info && info.kind === "building";
});
const buildingInfo = buildingSample ? findMapFeatureAtPoint(buildingSample.center) : null;
assert(buildingInfo && buildingInfo.kind === "building", "building center tap should resolve building feature info");
assert(buildingInfo.fieldRows.some((row) => row.label === "建筑名"), "building info should expose building name field");

const roadInfo = findMapFeatureAtPoint(ROAD_FEATURES[0].points[0]);
assert(roadInfo && roadInfo.kind === "road", "road point tap should resolve road feature info");

console.log("GIS converter tests passed.");
