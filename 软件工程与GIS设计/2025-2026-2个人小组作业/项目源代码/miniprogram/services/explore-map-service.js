const { clampPointToBounds } = require("../utils/spatial");

const TRACK_POLYLINE_MAX_POINTS = 240;

function formatCoverageRatio(litCount, totalGridCount) {
  if (!totalGridCount) {
    return "0.0%";
  }

  return `${((litCount / totalGridCount) * 100).toFixed(1)}%`;
}

function formatUserLocation(point) {
  return `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
}

function createUserMarker(point) {
  return {
    id: 1,
    latitude: point.latitude,
    longitude: point.longitude,
    width: 28,
    height: 28,
    iconPath: "/images/icons/avatar.png",
    callout: {
      content: "当前位置",
      display: "ALWAYS",
      padding: 8,
      borderRadius: 12,
      fontSize: 12,
      bgColor: "#ffffff",
      color: "#0f172a",
    },
  };
}

function createDisplayTrackPoints(trackPoints, maxPoints = TRACK_POLYLINE_MAX_POINTS) {
  const safePoints = Array.isArray(trackPoints) ? trackPoints : [];
  const pointLimit = Math.max(2, Number(maxPoints) || TRACK_POLYLINE_MAX_POINTS);

  if (safePoints.length <= pointLimit) {
    return safePoints;
  }

  const middleLimit = pointLimit - 2;
  const step = Math.max(1, Math.ceil((safePoints.length - 2) / middleLimit));
  const sampledPoints = [safePoints[0]];

  for (let index = step; index < safePoints.length - 1; index += step) {
    sampledPoints.push(safePoints[index]);
  }

  sampledPoints.push(safePoints[safePoints.length - 1]);
  return sampledPoints;
}

function createTrackPolyline(trackPoints) {
  if (!Array.isArray(trackPoints) || trackPoints.length < 2) {
    return null;
  }

  return {
    points: createDisplayTrackPoints(trackPoints),
    color: "#0ea5e9",
    width: 6,
    borderColor: "#0369a1",
    borderWidth: 1,
    zIndex: 8,
  };
}

function createMapPolylines(trackPoints, roadPolylines) {
  const trackPolyline = createTrackPolyline(trackPoints);
  return trackPolyline ? roadPolylines.concat([trackPolyline]) : roadPolylines.slice();
}

function buildCoverageState(litGridIdSet, totalGridCount) {
  const exploredCount = litGridIdSet.size;

  return {
    litGridIds: Array.from(litGridIdSet),
    exploredCount,
    coverageRatio: formatCoverageRatio(exploredCount, totalGridCount),
  };
}

function buildLocationViewState({
  point,
  gpsWeak,
  moveCenter,
  currentLatitude,
  currentLongitude,
  displayBounds,
  basePoiMarkers,
  includeMarkers = true,
  clampCenter = true,
}) {
  const safeCenter = clampCenter ? clampPointToBounds(point, displayBounds) : point;
  const state = {
    latitude: moveCenter ? safeCenter.latitude : currentLatitude,
    longitude: moveCenter ? safeCenter.longitude : currentLongitude,
    gpsWeak,
    gpsStatusText: gpsWeak ? "当前 GPS 信号较弱" : "GPS 正常",
    currentLocationText: formatUserLocation(point),
  };

  if (includeMarkers) {
    state.markers = [createUserMarker(point)].concat(basePoiMarkers);
  }

  return state;
}

module.exports = {
  buildCoverageState,
  buildLocationViewState,
  createDisplayTrackPoints,
  createMapPolylines,
  createTrackPolyline,
  formatCoverageRatio,
  formatUserLocation,
};
