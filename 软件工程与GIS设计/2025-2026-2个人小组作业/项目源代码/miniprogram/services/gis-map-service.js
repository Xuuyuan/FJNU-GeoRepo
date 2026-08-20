const {
  BUILDING_FEATURES,
  GATE_FEATURES,
  MAP_MARKER_ID,
  OPEN_SPACE_FEATURES,
  POI_LAND_FEATURES,
  ROAD_FEATURES,
} = require("../data/campus");
const {
  doBoundsIntersect,
  getPointToSegmentDistanceInMeters,
  isPointInPolygon,
} = require("../utils/spatial");

const ROAD_HIT_TOLERANCE_METERS = 12;

const FEATURE_KIND_TEXT = {
  building: "建筑与场地",
  gate: "校门",
  open_space: "开放空间",
  poi_land: "兴趣点",
  road: "道路",
};

const FIELD_LABELS = {
  Id: "ID",
  Shape_Area: "面积",
  Shape_Leng: "长度",
  bridge: "桥梁",
  code: "道路编码",
  fclass: "道路类型",
  layer: "图层",
  maxspeed: "限速",
  name: "名称",
  oneway: "单行",
  osm_id: "OSM ID",
  ref: "参考编号",
  tunnel: "隧道",
  type: "类型",
  建筑名: "建筑名",
  所属区: "所属区",
  建筑类: "建筑类",
};

function createPointBounds(point, toleranceMeters) {
  const meterPerDegreeLatitude = 111320;
  const meterPerDegreeLongitude = 111320 * Math.cos((point.latitude * Math.PI) / 180);
  return {
    north: point.latitude + toleranceMeters / meterPerDegreeLatitude,
    south: point.latitude - toleranceMeters / meterPerDegreeLatitude,
    east: point.longitude + toleranceMeters / meterPerDegreeLongitude,
    west: point.longitude - toleranceMeters / meterPerDegreeLongitude,
  };
}

function isPointInFeatureRings(point, feature) {
  const rings = Array.isArray(feature.rings) && feature.rings.length ? feature.rings : [feature.points];
  return rings.some((ring) => Array.isArray(ring) && ring.length >= 3 && isPointInPolygon(point, ring));
}

function getDistanceToLineFeature(point, feature) {
  const paths = Array.isArray(feature.paths) && feature.paths.length ? feature.paths : [feature.points];
  let minDistance = Infinity;

  paths.forEach((path) => {
    if (!Array.isArray(path) || path.length < 2) {
      return;
    }

    for (let index = 1; index < path.length; index += 1) {
      minDistance = Math.min(
        minDistance,
        getPointToSegmentDistanceInMeters(point, path[index - 1], path[index])
      );
    }
  });

  return minDistance;
}

function buildFieldRows(properties) {
  const safeProperties = properties && typeof properties === "object" ? properties : {};
  return Object.keys(safeProperties)
    .filter((key) => safeProperties[key] !== "" && safeProperties[key] !== null && safeProperties[key] !== undefined)
    .map((key) => ({
      label: FIELD_LABELS[key] || key,
      value: String(safeProperties[key]),
    }));
}

function createMapFeatureInfo(feature, kind) {
  if (!feature) {
    return null;
  }

  const fieldRows = buildFieldRows(feature.properties);
  const subtitleParts = [
    FEATURE_KIND_TEXT[kind] || kind,
    feature.category || feature.type || "",
    feature.areaName || "",
  ].filter(Boolean);

  return {
    visible: true,
    id: feature.id,
    kind,
    kindText: FEATURE_KIND_TEXT[kind] || kind,
    title: feature.name || feature.id,
    subtitle: subtitleParts.join(" · "),
    sourceLayer: feature.sourceLayer || "",
    fieldRows,
  };
}

function findRoadFeature(point, toleranceMeters = ROAD_HIT_TOLERANCE_METERS) {
  const pointBounds = createPointBounds(point, toleranceMeters);
  return ROAD_FEATURES
    .filter((feature) => !feature.bounds || doBoundsIntersect(feature.bounds, pointBounds))
    .map((feature) => ({
      feature,
      distance: getDistanceToLineFeature(point, feature),
    }))
    .filter((candidate) => candidate.distance <= toleranceMeters)
    .sort((left, right) => left.distance - right.distance)[0];
}

function findPolygonFeature(point, features) {
  return features.find((feature) => {
    if (feature.bounds && !doBoundsIntersect(feature.bounds, {
      north: point.latitude,
      south: point.latitude,
      east: point.longitude,
      west: point.longitude,
    })) {
      return false;
    }
    return isPointInFeatureRings(point, feature);
  }) || null;
}

function findMapFeatureAtPoint(point) {
  const roadCandidate = findRoadFeature(point);
  if (roadCandidate) {
    return createMapFeatureInfo(roadCandidate.feature, "road");
  }

  const openSpace = findPolygonFeature(point, OPEN_SPACE_FEATURES);
  if (openSpace) {
    return createMapFeatureInfo(openSpace, "open_space");
  }

  const building = findPolygonFeature(point, BUILDING_FEATURES);
  if (building) {
    return createMapFeatureInfo(building, "building");
  }

  return null;
}

function findMapFeatureByMarkerId(markerId) {
  if (markerId >= MAP_MARKER_ID.gate && markerId < MAP_MARKER_ID.openSpace) {
    const gate = GATE_FEATURES[markerId - MAP_MARKER_ID.gate];
    return createMapFeatureInfo(gate, "gate");
  }

  if (markerId >= MAP_MARKER_ID.openSpace && markerId < MAP_MARKER_ID.poiLand) {
    const openSpace = OPEN_SPACE_FEATURES[markerId - MAP_MARKER_ID.openSpace];
    return createMapFeatureInfo(openSpace, "open_space");
  }

  if (markerId >= MAP_MARKER_ID.poiLand && markerId < MAP_MARKER_ID.poi) {
    const poiLand = POI_LAND_FEATURES[markerId - MAP_MARKER_ID.poiLand];
    return createMapFeatureInfo(poiLand, "poi_land");
  }

  return null;
}

module.exports = {
  ROAD_HIT_TOLERANCE_METERS,
  createMapFeatureInfo,
  findMapFeatureAtPoint,
  findMapFeatureByMarkerId,
  getDistanceToLineFeature,
  isPointInFeatureRings,
};
