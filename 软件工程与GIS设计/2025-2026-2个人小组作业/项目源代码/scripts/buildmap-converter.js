const fs = require("fs");

const WEB_MERCATOR_RADIUS = 6378137;
const MAX_WEB_MERCATOR_LATITUDE = 85.05112878;
const COORDINATE_PRECISION = 6;
const GEOREFERENCE_IDW_POWER = 2;
const DEFAULT_TARGET_BOUNDS = {
  north: 26.029,
  south: 26.022,
  east: 119.212,
  west: 119.207,
};

const DEFAULT_GEOREFERENCE_CONTROL_POINTS = [
  { sourceId: "11171", name: "又玄图书馆", latitude: 26.028407, longitude: 119.211305 },
  { sourceId: "64231", name: "体育馆", latitude: 26.025922, longitude: 119.215321 },
  { sourceId: "24408", name: "东大门门卫室", latitude: 26.027414, longitude: 119.214591 },
  { sourceId: "24409", name: "南大门门卫室", latitude: 26.021026, longitude: 119.215929 },
  { sourceId: "24411", name: "西大门门卫室", latitude: 26.032429, longitude: 119.205888 },
  { sourceId: "19308", name: "师生活动中心A区", latitude: 26.025772, longitude: 119.212678 },
  { sourceId: "1245", name: "音乐厅", latitude: 26.022936, longitude: 119.2111 },
  { sourceId: "1309", name: "音乐琴房", latitude: 26.022358, longitude: 119.210905 },
  { sourceId: "36304", name: "桂苑1号楼学生公寓", latitude: 26.035063, longitude: 119.206653 },
  { sourceId: "36309", name: "嘉树园餐厅", latitude: 26.034976, longitude: 119.207284 },
  { sourceId: "36310", name: "李苑1号楼学生公寓", latitude: 26.034484, longitude: 119.209148 },
];

const LANDMARK_BUILDINGS = [
  { sourceId: "1029", id: "poi-ligong-1", type: "study", radius: 26 },
  { sourceId: "1030", id: "poi-ligong-2", type: "study", radius: 26 },
  { sourceId: "1031", id: "poi-ligong-3", type: "study", radius: 26 },
  { sourceId: "1032", id: "poi-ligong-4", type: "study", radius: 26 },
  { sourceId: "1054", id: "poi-music-teaching", type: "study", radius: 26 },
  { sourceId: "1181", id: "poi-music-office", type: "study", radius: 26 },
  { sourceId: "1245", id: "poi-music-hall", type: "landmark", radius: 28 },
  { sourceId: "1309", id: "poi-music-practice", type: "study", radius: 24 },
  { sourceId: "11171", id: "poi-youxuan-library", type: "study", radius: 30 },
  { sourceId: "18145", id: "poi-sports-complex", type: "sport", radius: 30 },
  { sourceId: "64230", id: "poi-stadium", type: "sport", radius: 34 },
  { sourceId: "64231", id: "poi-real-gym", type: "sport", radius: 30 },
  { sourceId: "19308", id: "poi-activity-center-a", type: "life", radius: 28 },
  { sourceId: "19453", id: "poi-youth-theater", type: "landmark", radius: 28 },
  { sourceId: "26872", id: "poi-culture-street-1", type: "life", radius: 26 },
  { sourceId: "65406", id: "poi-culture-street-2", type: "life", radius: 26 },
  { sourceId: "36309", id: "poi-jiashuyuan-canteen", type: "life", radius: 26 },
  { sourceId: "36270", id: "poi-rongyuan-dormitory", type: "life", radius: 26 },
  { sourceId: "36304", id: "poi-guiyuan-dormitory", type: "life", radius: 26 },
  { sourceId: "37959", id: "poi-lanyuan-dormitory", type: "life", radius: 26 },
];

function roundCoordinate(value, precision = COORDINATE_PRECISION) {
  return Number(value.toFixed(precision));
}

function parseCoordinateString(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function webMercatorToWgs84(x, y) {
  const longitude = (x / WEB_MERCATOR_RADIUS) * (180 / Math.PI);
  const latitude = (2 * Math.atan(Math.exp(y / WEB_MERCATOR_RADIUS)) - Math.PI / 2) * (180 / Math.PI);

  return {
    latitude: roundCoordinate(Math.max(-MAX_WEB_MERCATOR_LATITUDE, Math.min(MAX_WEB_MERCATOR_LATITUDE, latitude))),
    longitude: roundCoordinate((((longitude + 180) % 360) + 360) % 360 - 180),
  };
}

function createSourcePoint(coord) {
  if (!Array.isArray(coord) || coord.length < 2) {
    return null;
  }

  const x = Number(coord[0]);
  const y = Number(coord[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return { x, y };
}

function createBounds(points) {
  return points.reduce((bounds, point) => ({
    north: Math.max(bounds.north, point.latitude),
    south: Math.min(bounds.south, point.latitude),
    east: Math.max(bounds.east, point.longitude),
    west: Math.min(bounds.west, point.longitude),
  }), {
    north: -Infinity,
    south: Infinity,
    east: -Infinity,
    west: Infinity,
  });
}

function createCollectionBounds(buildings) {
  return buildings.reduce((bounds, building) => ({
    north: Math.max(bounds.north, building.bounds.north),
    south: Math.min(bounds.south, building.bounds.south),
    east: Math.max(bounds.east, building.bounds.east),
    west: Math.min(bounds.west, building.bounds.west),
  }), {
    north: -Infinity,
    south: Infinity,
    east: -Infinity,
    west: Infinity,
  });
}

function isSamePoint(pointA, pointB) {
  return pointA &&
    pointB &&
    pointA.latitude === pointB.latitude &&
    pointA.longitude === pointB.longitude;
}

function isSameSourcePoint(pointA, pointB) {
  return pointA &&
    pointB &&
    pointA.x === pointB.x &&
    pointA.y === pointB.y;
}

function normalizePolygonPoints(rawCoords) {
  const points = (Array.isArray(rawCoords) ? rawCoords : [])
    .filter((coord) => Array.isArray(coord) && coord.length >= 2)
    .map((coord) => webMercatorToWgs84(Number(coord[0]), Number(coord[1])))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    .reduce((nextPoints, point) => {
      if (!isSamePoint(nextPoints[nextPoints.length - 1], point)) {
        nextPoints.push(point);
      }
      return nextPoints;
    }, []);

  while (points.length > 1 && isSamePoint(points[0], points[points.length - 1])) {
    points.pop();
  }

  return points;
}

function normalizeSourcePolygonPoints(rawCoords) {
  const points = (Array.isArray(rawCoords) ? rawCoords : [])
    .map(createSourcePoint)
    .filter(Boolean)
    .reduce((nextPoints, point) => {
      if (!isSameSourcePoint(nextPoints[nextPoints.length - 1], point)) {
        nextPoints.push(point);
      }
      return nextPoints;
    }, []);

  while (points.length > 1 && isSameSourcePoint(points[0], points[points.length - 1])) {
    points.pop();
  }

  return points;
}

function getSignedPolygonArea(points) {
  if (!Array.isArray(points) || points.length < 3) {
    return 0;
  }

  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.longitude * next.latitude - next.longitude * current.latitude;
  }
  return area / 2;
}

function extractBuildMapItems(rawBuildMap) {
  if (Array.isArray(rawBuildMap)) {
    return rawBuildMap;
  }

  if (!rawBuildMap || typeof rawBuildMap !== "object") {
    return [];
  }

  if (Array.isArray(rawBuildMap.RECORDS)) {
    return rawBuildMap.RECORDS;
  }

  if (Array.isArray(rawBuildMap.data)) {
    return rawBuildMap.data;
  }

  return Object.keys(rawBuildMap)
    .map((key) => rawBuildMap[key])
    .find((value) => Array.isArray(value)) || [];
}

function getMedian(values) {
  const sortedValues = values
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (!sortedValues.length) {
    return 0;
  }

  return sortedValues.length % 2
    ? sortedValues[middleIndex]
    : (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
}

function filterSpatialOutliers(buildings) {
  const medianLatitude = getMedian(buildings.map((building) => building.center.latitude));
  const medianLongitude = getMedian(buildings.map((building) => building.center.longitude));

  return buildings.filter((building) => {
    return Math.abs(building.center.latitude - medianLatitude) <= 1 &&
      Math.abs(building.center.longitude - medianLongitude) <= 1;
  });
}

function normalizeBuilding(record) {
  const sourceId = String(record && record.id);
  const name = String((record && record.buildName) || "").trim();
  const rawCenter = parseCoordinateString(record && record.center);
  const rawCoords = parseCoordinateString(record && record.coords);
  const points = normalizePolygonPoints(rawCoords);
  const sourcePoints = normalizeSourcePolygonPoints(rawCoords);

  if (
    !sourceId ||
    !name ||
    points.length < 3 ||
    sourcePoints.length < 3 ||
    Math.abs(getSignedPolygonArea(points)) < 1e-12
  ) {
    return null;
  }

  const center = rawCenter.length >= 2
    ? webMercatorToWgs84(Number(rawCenter[0]), Number(rawCenter[1]))
    : {
      latitude: roundCoordinate(points.reduce((sum, point) => sum + point.latitude, 0) / points.length),
      longitude: roundCoordinate(points.reduce((sum, point) => sum + point.longitude, 0) / points.length),
    };
  const sourceCenter = createSourcePoint(rawCenter) || {
    x: sourcePoints.reduce((sum, point) => sum + point.x, 0) / sourcePoints.length,
    y: sourcePoints.reduce((sum, point) => sum + point.y, 0) / sourcePoints.length,
  };

  return {
    id: `building-${sourceId}`,
    sourceId,
    name,
    areaId: record && record.areaId ? String(record.areaId) : "",
    center,
    points,
    bounds: createBounds(points),
    sourceCenter,
    sourcePoints,
  };
}

function createLandmarkPois(buildings) {
  return LANDMARK_BUILDINGS
    .map((landmark) => {
      const building = buildings.find((item) => item.sourceId === landmark.sourceId);
      if (!building) {
        return null;
      }

      return {
        id: landmark.id,
        sourceBuildingId: building.id,
        name: building.name,
        type: landmark.type,
        latitude: building.center.latitude,
        longitude: building.center.longitude,
        radius: landmark.radius,
        description: `${building.name}是校园地标图鉴候选点，可结合实地到达完成发现。`,
        knowledge: "该点位来自 BuildMap 建筑面数据，后续可在云端补充更细的校园知识文案。",
      };
    })
    .filter(Boolean);
}

function alignPointToBounds(point, sourceBounds, targetBounds) {
  const latitudeRatio = (point.latitude - sourceBounds.south) / (sourceBounds.north - sourceBounds.south);
  const longitudeRatio = (point.longitude - sourceBounds.west) / (sourceBounds.east - sourceBounds.west);

  return {
    latitude: roundCoordinate(targetBounds.south + latitudeRatio * (targetBounds.north - targetBounds.south)),
    longitude: roundCoordinate(targetBounds.west + longitudeRatio * (targetBounds.east - targetBounds.west)),
  };
}

function alignBuildingToBounds(building, sourceBounds, targetBounds) {
  const points = building.points.map((point) => alignPointToBounds(point, sourceBounds, targetBounds));

  return {
    ...building,
    center: alignPointToBounds(building.center, sourceBounds, targetBounds),
    points,
    bounds: createBounds(points),
  };
}

function alignBuildingsToProjectBounds(buildings, targetBounds = DEFAULT_TARGET_BOUNDS) {
  if (!Array.isArray(buildings) || !buildings.length) {
    return [];
  }

  const sourceBounds = createCollectionBounds(buildings);
  if (
    sourceBounds.north <= sourceBounds.south ||
    sourceBounds.east <= sourceBounds.west ||
    !Number.isFinite(sourceBounds.north) ||
    !Number.isFinite(sourceBounds.east)
  ) {
    return buildings;
  }

  return buildings.map((building) => alignBuildingToBounds(building, sourceBounds, targetBounds));
}

function solveLinearSystem(matrix, vector) {
  const size = matrix.length;
  const augmented = matrix.map((row, index) => row.concat(vector[index]));

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) {
        pivot = row;
      }
    }

    if (Math.abs(augmented[pivot][column]) < 1e-12) {
      return null;
    }

    const current = augmented[column];
    augmented[column] = augmented[pivot];
    augmented[pivot] = current;

    const divisor = augmented[column][column];
    for (let index = column; index <= size; index += 1) {
      augmented[column][index] /= divisor;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === column) {
        continue;
      }

      const factor = augmented[row][column];
      for (let index = column; index <= size; index += 1) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }

  return augmented.map((row) => row[size]);
}

function fitAffineTransform(controlPairs) {
  const sourceOrigin = controlPairs.reduce((origin, pair) => ({
    x: origin.x + pair.source.x / controlPairs.length,
    y: origin.y + pair.source.y / controlPairs.length,
  }), { x: 0, y: 0 });
  const matrix = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const latitudeVector = [0, 0, 0];
  const longitudeVector = [0, 0, 0];

  controlPairs.forEach((pair) => {
    const rowValues = [
      pair.source.x - sourceOrigin.x,
      pair.source.y - sourceOrigin.y,
      1,
    ];

    for (let row = 0; row < rowValues.length; row += 1) {
      latitudeVector[row] += rowValues[row] * pair.target.latitude;
      longitudeVector[row] += rowValues[row] * pair.target.longitude;

      for (let column = 0; column < rowValues.length; column += 1) {
        matrix[row][column] += rowValues[row] * rowValues[column];
      }
    }
  });

  const latitudeCoefficients = solveLinearSystem(matrix, latitudeVector);
  const longitudeCoefficients = solveLinearSystem(matrix, longitudeVector);
  if (!latitudeCoefficients || !longitudeCoefficients) {
    return null;
  }

  return {
    sourceOrigin,
    transform(point) {
      const x = point.x - sourceOrigin.x;
      const y = point.y - sourceOrigin.y;
      return {
        latitude: latitudeCoefficients[0] * x + latitudeCoefficients[1] * y + latitudeCoefficients[2],
        longitude: longitudeCoefficients[0] * x + longitudeCoefficients[1] * y + longitudeCoefficients[2],
      };
    },
  };
}

function createBuildMapGeoreference(buildings, controlPoints = DEFAULT_GEOREFERENCE_CONTROL_POINTS) {
  const buildingBySourceId = (Array.isArray(buildings) ? buildings : []).reduce((map, building) => {
    map[building.sourceId] = building;
    return map;
  }, {});
  const controlPairs = (Array.isArray(controlPoints) ? controlPoints : [])
    .map((controlPoint) => {
      const building = buildingBySourceId[String(controlPoint.sourceId)];
      if (!building || !building.sourceCenter) {
        return null;
      }

      const latitude = Number(controlPoint.latitude);
      const longitude = Number(controlPoint.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return {
        sourceId: building.sourceId,
        name: controlPoint.name || building.name,
        source: building.sourceCenter,
        target: {
          latitude,
          longitude,
        },
      };
    })
    .filter(Boolean);

  if (controlPairs.length < 3) {
    return null;
  }

  const affineTransform = fitAffineTransform(controlPairs);
  if (!affineTransform) {
    return null;
  }

  const residuals = controlPairs.map((pair) => {
    const basePoint = affineTransform.transform(pair.source);
    return {
      ...pair,
      residual: {
        latitude: pair.target.latitude - basePoint.latitude,
        longitude: pair.target.longitude - basePoint.longitude,
      },
    };
  });

  return {
    controlPairs,
    transformSourcePoint(point) {
      const basePoint = affineTransform.transform(point);
      let weightedLatitudeResidual = 0;
      let weightedLongitudeResidual = 0;
      let totalWeight = 0;

      for (let index = 0; index < residuals.length; index += 1) {
        const pair = residuals[index];
        const distance = Math.hypot(point.x - pair.source.x, point.y - pair.source.y);
        if (distance < 1e-6) {
          return {
            latitude: roundCoordinate(pair.target.latitude),
            longitude: roundCoordinate(pair.target.longitude),
          };
        }

        const weight = 1 / (distance ** GEOREFERENCE_IDW_POWER);
        weightedLatitudeResidual += pair.residual.latitude * weight;
        weightedLongitudeResidual += pair.residual.longitude * weight;
        totalWeight += weight;
      }

      return {
        latitude: roundCoordinate(basePoint.latitude + weightedLatitudeResidual / totalWeight),
        longitude: roundCoordinate(basePoint.longitude + weightedLongitudeResidual / totalWeight),
      };
    },
  };
}

function stripSourceGeometry(building) {
  const {
    sourceCenter,
    sourcePoints,
    ...publicBuilding
  } = building;
  return publicBuilding;
}

function georeferenceBuilding(building, georeference) {
  const points = building.sourcePoints.map((point) => georeference.transformSourcePoint(point));
  return stripSourceGeometry({
    ...building,
    center: georeference.transformSourcePoint(building.sourceCenter),
    points,
    bounds: createBounds(points),
  });
}

function georeferenceBuildingsToProject(buildings, controlPoints = DEFAULT_GEOREFERENCE_CONTROL_POINTS) {
  const georeference = createBuildMapGeoreference(buildings, controlPoints);
  if (!georeference) {
    return buildings.map(stripSourceGeometry);
  }

  return buildings.map((building) => georeferenceBuilding(building, georeference));
}

function convertBuildMap(rawBuildMap, options = {}) {
  const rawBuildings = extractBuildMapItems(rawBuildMap)
    .map(normalizeBuilding)
    .filter(Boolean)
    .sort((left, right) => Number(left.sourceId) - Number(right.sourceId));
  const validBuildings = filterSpatialOutliers(rawBuildings);
  let buildings;

  if (options.alignToProjectBounds === false) {
    buildings = validBuildings.map(stripSourceGeometry);
  } else if (options.georeference === false) {
    buildings = alignBuildingsToProjectBounds(validBuildings, options.targetBounds || DEFAULT_TARGET_BOUNDS)
      .map(stripSourceGeometry);
  } else {
    buildings = georeferenceBuildingsToProject(
      validBuildings,
      options.georeferenceControlPoints || DEFAULT_GEOREFERENCE_CONTROL_POINTS
    );
  }

  return {
    buildings,
    landmarkPois: createLandmarkPois(buildings),
  };
}

function convertBuildMapFile(inputPath) {
  return convertBuildMap(JSON.parse(fs.readFileSync(inputPath, "utf8")));
}

module.exports = {
  DEFAULT_GEOREFERENCE_CONTROL_POINTS,
  LANDMARK_BUILDINGS,
  alignBuildingsToProjectBounds,
  convertBuildMap,
  convertBuildMapFile,
  createBuildMapGeoreference,
  createBounds,
  createCollectionBounds,
  extractBuildMapItems,
  filterSpatialOutliers,
  georeferenceBuildingsToProject,
  normalizeBuilding,
  normalizePolygonPoints,
  normalizeSourcePolygonPoints,
  parseCoordinateString,
  webMercatorToWgs84,
};
