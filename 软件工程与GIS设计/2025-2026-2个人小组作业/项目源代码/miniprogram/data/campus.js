const {
  GIS_BUILDINGS,
  GIS_GATES,
  GIS_MAIN_POIS,
  GIS_METADATA,
  GIS_OPEN_SPACES,
  GIS_POI_LANDS,
  GIS_ROADS,
  MAIN_POI_TRIGGERS,
} = require("./gis.generated");

const CAMPUS_CENTER = {
  latitude: 26.026254,
  longitude: 119.209651,
};

const CAMPUS_AREA_POINTS = [
  { latitude: 26.039423, longitude: 119.207668 },
  { latitude: 26.039052, longitude: 119.206874 },
  { latitude: 26.038191, longitude: 119.206197 },
  { latitude: 26.037667, longitude: 119.206018 },
  { latitude: 26.031603, longitude: 119.205797 },
  { latitude: 26.027633, longitude: 119.203777 },
  { latitude: 26.025654, longitude: 119.205981 },
  { latitude: 26.021726, longitude: 119.207519 },
  { latitude: 26.020575, longitude: 119.208324 },
  { latitude: 26.019861, longitude: 119.209793 },
  { latitude: 26.019658, longitude: 119.211005 },
  { latitude: 26.02166, longitude: 119.2184 },
];

const MAP_LIMITS = {
  minScale: 15,
  maxScale: 20,
  defaultScale: 19,
};

const GRID_CELL_SIZE_METERS = 5;
const METERS_PER_DEGREE_LATITUDE = 111320;
const BUILDING_POLYGON_DISPLAY_LIMIT = 0;
const BUILDING_POLYGONS_VISIBLE = true;
const ROAD_POLYLINES_VISIBLE = true;
const OPEN_SPACE_POLYGONS_VISIBLE = true;
const GATE_MARKERS_VISIBLE = true;
const OPEN_SPACE_MARKERS_VISIBLE = true;
const POI_LAND_MARKERS_VISIBLE = true;
const POI_MARKERS_VISIBLE = false;

const MAP_MARKER_ID = {
  gate: 20000,
  openSpace: 21000,
  poiLand: 22000,
  poi: 23000,
};

function createBounds(points, margin = 0) {
  const bounds = points.reduce((nextBounds, point) => ({
    north: Math.max(nextBounds.north, point.latitude),
    south: Math.min(nextBounds.south, point.latitude),
    east: Math.max(nextBounds.east, point.longitude),
    west: Math.min(nextBounds.west, point.longitude),
  }), {
    north: -Infinity,
    south: Infinity,
    east: -Infinity,
    west: Infinity,
  });

  return {
    north: bounds.north + margin,
    south: bounds.south - margin,
    east: bounds.east + margin,
    west: bounds.west - margin,
  };
}

const CAMPUS_BOUNDS = createBounds(CAMPUS_AREA_POINTS);
const DISPLAY_BOUNDS = createBounds(CAMPUS_AREA_POINTS, 0.003);

function roundCoordinate(value) {
  return Number(value.toFixed(6));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function isPointInPolygon(point, polygonPoints) {
  let inside = false;

  for (let index = 0, lastIndex = polygonPoints.length - 1; index < polygonPoints.length; lastIndex = index, index += 1) {
    const current = polygonPoints[index];
    const previous = polygonPoints[lastIndex];
    const intersects = ((current.latitude > point.latitude) !== (previous.latitude > point.latitude)) &&
      (point.longitude < ((previous.longitude - current.longitude) * (point.latitude - current.latitude)) /
        ((previous.latitude - current.latitude) || 1e-9) + current.longitude);

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function createFeatureBounds(points) {
  return createBounds(points);
}

function normalizePolygonFeature(feature) {
  const rings = Array.isArray(feature.rings) && feature.rings.length
    ? feature.rings
    : [feature.points || []];
  const allPoints = rings.reduce((points, ring) => points.concat(ring), []);
  return {
    ...feature,
    rings,
    points: feature.points || rings[0] || [],
    bounds: feature.bounds || createFeatureBounds(allPoints),
  };
}

function normalizeLineFeature(feature) {
  const paths = Array.isArray(feature.paths) && feature.paths.length
    ? feature.paths
    : [feature.points || []];
  const allPoints = paths.reduce((points, path) => points.concat(path), []);
  return {
    ...feature,
    paths,
    points: feature.points || paths[0] || [],
    bounds: feature.bounds || createFeatureBounds(allPoints),
  };
}

const BUILDING_FEATURES = GIS_BUILDINGS.map(normalizePolygonFeature);
const OPEN_SPACE_FEATURES = GIS_OPEN_SPACES.map(normalizePolygonFeature);
const POI_LAND_FEATURES = GIS_POI_LANDS;
const ROAD_FEATURES = GIS_ROADS.map(normalizeLineFeature);
const GATE_FEATURES = GIS_GATES;
const POI_TRIGGER_FEATURES = MAIN_POI_TRIGGERS;
const CUSTOM_MAIN_POIS = [
  {
    id: "poi-liyuan-5-test",
    poi_id: "poi-liyuan-5-test",
    name: "李苑5号楼（测试地标）",
    type: "landmark",
    radius: 26,
    description: "位于李苑5号楼学生公寓的测试地标，用于验证图鉴、触发和调试探索流程。",
    knowledge: "李苑5号楼是北区学生宿舍的一部分，该测试地标用于检查指定建筑点位能否独立进入图鉴。",
    triggerPoints: [
      {
        id: "custom-main-poi-trigger-liyuan-5-test",
        latitude: 26.036945,
        longitude: 119.206821,
      },
    ],
    properties: {},
    latitude: 26.036945,
    longitude: 119.206821,
  },
];
const POI_FEATURES = GIS_MAIN_POIS.concat(CUSTOM_MAIN_POIS).map((poi) => ({
  ...poi,
  id: poi.poi_id,
  radius: poi.radius || 26,
  triggerPoints: Array.isArray(poi.triggerPoints) && poi.triggerPoints.length
    ? poi.triggerPoints
    : [{ latitude: poi.latitude, longitude: poi.longitude }],
}));

function createGridFeatures() {
  const features = [];
  const metersPerDegreeLongitude = METERS_PER_DEGREE_LATITUDE * Math.cos(toRadians(CAMPUS_CENTER.latitude));
  const latStep = GRID_CELL_SIZE_METERS / METERS_PER_DEGREE_LATITUDE;
  const lngStep = GRID_CELL_SIZE_METERS / metersPerDegreeLongitude;
  const rowCount = Math.ceil((CAMPUS_BOUNDS.north - CAMPUS_BOUNDS.south) / latStep);
  const columnCount = Math.ceil((CAMPUS_BOUNDS.east - CAMPUS_BOUNDS.west) / lngStep);

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const south = CAMPUS_BOUNDS.south + row * latStep;
      const north = south + latStep;
      const west = CAMPUS_BOUNDS.west + column * lngStep;
      const east = west + lngStep;
      const center = {
        latitude: roundCoordinate((south + north) / 2),
        longitude: roundCoordinate((west + east) / 2),
      };
      const points = [
        { latitude: roundCoordinate(south), longitude: roundCoordinate(west) },
        { latitude: roundCoordinate(south), longitude: roundCoordinate(east) },
        { latitude: roundCoordinate(north), longitude: roundCoordinate(east) },
        { latitude: roundCoordinate(north), longitude: roundCoordinate(west) },
      ];

      if (!isPointInPolygon(center, CAMPUS_AREA_POINTS) || !points.every((point) => isPointInPolygon(point, CAMPUS_AREA_POINTS))) {
        continue;
      }

      features.push({
        id: `grid-${String(row).padStart(2, "0")}-${String(column).padStart(2, "0")}`,
        row,
        column,
        center,
        points,
        bounds: createFeatureBounds(points),
      });
    }
  }

  return features;
}

const GRID_FEATURES = createGridFeatures();

function createGridPolygon(feature) {
  return {
    points: feature.points,
    strokeWidth: 1,
    strokeColor: "#86EFACFF",
    fillColor: "#22C55E99",
    zIndex: 6,
  };
}

function createGridPolygons(litGridIdSet) {
  return GRID_FEATURES
    .filter((feature) => litGridIdSet.has(feature.id))
    .map(createGridPolygon);
}

function createFeaturePolygons(features, style) {
  return features.reduce((polygons, feature) => {
    const rings = Array.isArray(feature.rings) ? feature.rings : [feature.points];
    rings.forEach((points, ringIndex) => {
      if (!Array.isArray(points) || points.length < 3) {
        return;
      }

      polygons.push({
        points,
        strokeWidth: style.strokeWidth,
        strokeColor: style.strokeColor,
        fillColor: style.fillColor,
        zIndex: style.zIndex,
        featureId: feature.id,
        ringIndex,
      });
    });
    return polygons;
  }, []);
}

function createBuildingPolygons(options = {}) {
  if (!BUILDING_POLYGONS_VISIBLE) {
    return [];
  }

  const displayLimit = typeof options.limit === "number" ? options.limit : BUILDING_POLYGON_DISPLAY_LIMIT;
  const features = displayLimit > 0 ? BUILDING_FEATURES.slice(0, displayLimit) : BUILDING_FEATURES;
  return createFeaturePolygons(features, {
    strokeWidth: 1,
    strokeColor: "#334155CC",
    fillColor: "#47556966",
    zIndex: 3,
  });
}

function createOpenSpacePolygons() {
  if (!OPEN_SPACE_POLYGONS_VISIBLE) {
    return [];
  }

  return createFeaturePolygons(OPEN_SPACE_FEATURES, {
    strokeWidth: 2,
    strokeColor: "#0D9488CC",
    fillColor: "#14B8A633",
    zIndex: 2,
  });
}

function createCampusBoundaryPolygons() {
  return [
    {
      points: CAMPUS_AREA_POINTS,
      strokeWidth: 3,
      strokeColor: "#0F766EFF",
      fillColor: "#00000040",
      zIndex: 1,
    },
  ];
}

const CACHED_CAMPUS_BOUNDARY_POLYGONS = createCampusBoundaryPolygons();
const CACHED_OPEN_SPACE_POLYGONS = createOpenSpacePolygons();
const CACHED_BUILDING_POLYGONS = createBuildingPolygons();

function createCampusPolygonsFromGridPolygons(gridPolygons) {
  return CACHED_CAMPUS_BOUNDARY_POLYGONS
    .concat(CACHED_OPEN_SPACE_POLYGONS)
    .concat(CACHED_BUILDING_POLYGONS)
    .concat(Array.isArray(gridPolygons) ? gridPolygons : []);
}

function createCampusPolygons(litGridIdSet) {
  return createCampusPolygonsFromGridPolygons(createGridPolygons(litGridIdSet));
}

function createRoadPolylines() {
  if (!ROAD_POLYLINES_VISIBLE) {
    return [];
  }

  return ROAD_FEATURES.reduce((polylines, feature) => {
    feature.paths.forEach((points, pathIndex) => {
      if (!Array.isArray(points) || points.length < 2) {
        return;
      }

      polylines.push({
        points,
        color: "#2563EBCC",
        width: 3,
        dottedLine: false,
        arrowLine: false,
        borderColor: "#FFFFFFCC",
        borderWidth: 1,
        zIndex: 5,
        featureId: feature.id,
        pathIndex,
      });
    });
    return polylines;
  }, []);
}

function createGateMarkers() {
  if (!GATE_MARKERS_VISIBLE) {
    return [];
  }

  return GATE_FEATURES.map((gate, index) => ({
    id: MAP_MARKER_ID.gate + index,
    latitude: gate.latitude,
    longitude: gate.longitude,
    width: 30,
    height: 30,
    iconPath: "/images/icons/gate.png",
    callout: {
      content: gate.name,
      display: "BYCLICK",
      padding: 6,
      borderRadius: 12,
      fontSize: 12,
      bgColor: "#0f766e",
      color: "#ffffff",
    },
  }));
}

function createOpenSpaceMarkers() {
  if (!OPEN_SPACE_MARKERS_VISIBLE) {
    return [];
  }

  return OPEN_SPACE_FEATURES.map((space, index) => ({
    id: MAP_MARKER_ID.openSpace + index,
    latitude: space.center.latitude,
    longitude: space.center.longitude,
    width: 22,
    height: 22,
    iconPath: "/images/icons/business.png",
    callout: {
      content: space.name,
      display: "BYCLICK",
      padding: 6,
      borderRadius: 12,
      fontSize: 12,
      bgColor: "#115e59",
      color: "#ffffff",
    },
  }));
}

function getPoiLandIconPath(type) {
  if (type === "湖泊") {
    return "/images/icons/poi-land-lake.png";
  }
  if (type === "广场") {
    return "/images/icons/poi-land-plaza.png";
  }
  if (type === "图书馆") {
    return "/images/icons/poi-land-library.png";
  }
  if (type === "操场") {
    return "/images/icons/poi-land-sports.png";
  }
  if (type === "街道") {
    return "/images/icons/poi-land-street.png";
  }
  if (type === "行政楼") {
    return "/images/icons/poi-land-office.png";
  }
  return "/images/icons/poi-land-default.png";
}

function createPoiLandMarkers() {
  if (!POI_LAND_MARKERS_VISIBLE) {
    return [];
  }

  return POI_LAND_FEATURES.map((poiLand, index) => ({
    id: MAP_MARKER_ID.poiLand + index,
    latitude: poiLand.latitude,
    longitude: poiLand.longitude,
    width: 28,
    height: 28,
    iconPath: getPoiLandIconPath(poiLand.type),
    callout: {
      content: poiLand.name,
      display: "BYCLICK",
      padding: 6,
      borderRadius: 12,
      fontSize: 12,
      bgColor: "#1f2937",
      color: "#ffffff",
    },
  }));
}

function createMainPoiMarkers() {
  if (!POI_MARKERS_VISIBLE) {
    return [];
  }

  return POI_FEATURES.map((poi, index) => ({
    id: MAP_MARKER_ID.poi + index,
    latitude: poi.latitude,
    longitude: poi.longitude,
    width: 24,
    height: 24,
    iconPath: "/images/icons/business.png",
    callout: {
      content: poi.name,
      display: "BYCLICK",
      padding: 6,
      borderRadius: 12,
      fontSize: 12,
      bgColor: "#0f172a",
      color: "#ffffff",
    },
  }));
}

function createPoiMarkers() {
  return createGateMarkers()
    .concat(createOpenSpaceMarkers())
    .concat(createPoiLandMarkers())
    .concat(createMainPoiMarkers());
}

module.exports = {
  BUILDING_FEATURES,
  BUILDING_POLYGON_DISPLAY_LIMIT,
  BUILDING_POLYGONS_VISIBLE,
  CAMPUS_AREA_POINTS,
  CAMPUS_BOUNDS,
  CAMPUS_CENTER,
  DISPLAY_BOUNDS,
  GATE_FEATURES,
  GATE_MARKERS_VISIBLE,
  GIS_METADATA,
  GRID_CELL_SIZE_METERS,
  GRID_FEATURES,
  MAP_LIMITS,
  MAP_MARKER_ID,
  OPEN_SPACE_FEATURES,
  OPEN_SPACE_MARKERS_VISIBLE,
  OPEN_SPACE_POLYGONS_VISIBLE,
  POI_FEATURES,
  POI_LAND_FEATURES,
  POI_LAND_MARKERS_VISIBLE,
  POI_MARKERS_VISIBLE,
  POI_TRIGGER_FEATURES,
  ROAD_FEATURES,
  ROAD_POLYLINES_VISIBLE,
  createBuildingPolygons,
  createCampusBoundaryPolygons,
  createCampusPolygons,
  createCampusPolygonsFromGridPolygons,
  createGateMarkers,
  createGridPolygon,
  createGridPolygons,
  createOpenSpaceMarkers,
  createOpenSpacePolygons,
  createPoiLandMarkers,
  createPoiMarkers,
  createRoadPolylines,
};
