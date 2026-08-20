function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceInMeters(pointA, pointB) {
  const radLat1 = toRadians(pointA.latitude);
  const radLat2 = toRadians(pointB.latitude);
  const deltaLat = radLat1 - radLat2;
  const deltaLng = toRadians(pointA.longitude - pointB.longitude);
  const distance = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin(deltaLat / 2), 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)
  ));

  return distance * 6378137;
}

function isPointInBounds(point, bounds, margin = 0) {
  return (
    point.latitude <= bounds.north + margin &&
    point.latitude >= bounds.south - margin &&
    point.longitude <= bounds.east + margin &&
    point.longitude >= bounds.west - margin
  );
}

function doBoundsIntersect(boundsA, boundsB, margin = 0) {
  return !(
    boundsA.east < boundsB.west - margin ||
    boundsA.west > boundsB.east + margin ||
    boundsA.north < boundsB.south - margin ||
    boundsA.south > boundsB.north + margin
  );
}

function createSegmentBounds(startPoint, endPoint) {
  return {
    north: Math.max(startPoint.latitude, endPoint.latitude),
    south: Math.min(startPoint.latitude, endPoint.latitude),
    east: Math.max(startPoint.longitude, endPoint.longitude),
    west: Math.min(startPoint.longitude, endPoint.longitude),
  };
}

function createBufferedSegmentBounds(startPoint, endPoint, radiusMeters) {
  const segmentBounds = createSegmentBounds(startPoint, endPoint);
  const referenceLatitude = (startPoint.latitude + endPoint.latitude) / 2;
  const meterPerDegreeLatitude = 111320;
  const meterPerDegreeLongitude = 111320 * Math.cos(toRadians(referenceLatitude));

  return {
    north: segmentBounds.north + radiusMeters / meterPerDegreeLatitude,
    south: segmentBounds.south - radiusMeters / meterPerDegreeLatitude,
    east: segmentBounds.east + radiusMeters / meterPerDegreeLongitude,
    west: segmentBounds.west - radiusMeters / meterPerDegreeLongitude,
  };
}

function createGridFeatureSpatialIndex(gridFeatures) {
  const safeFeatures = Array.isArray(gridFeatures) ? gridFeatures : [];
  const boundedFeatures = safeFeatures.filter((feature) => feature && feature.bounds);
  const fallbackFeatures = safeFeatures.filter((feature) => !feature || !feature.bounds);

  if (!boundedFeatures.length) {
    return {
      queryBounds: () => safeFeatures,
    };
  }

  const indexBounds = boundedFeatures.reduce((bounds, feature) => ({
    north: Math.max(bounds.north, feature.bounds.north),
    south: Math.min(bounds.south, feature.bounds.south),
    east: Math.max(bounds.east, feature.bounds.east),
    west: Math.min(bounds.west, feature.bounds.west),
  }), {
    north: -Infinity,
    south: Infinity,
    east: -Infinity,
    west: Infinity,
  });
  const averageLatSpan = boundedFeatures.reduce((total, feature) => {
    return total + Math.max(feature.bounds.north - feature.bounds.south, 1e-9);
  }, 0) / boundedFeatures.length;
  const averageLngSpan = boundedFeatures.reduce((total, feature) => {
    return total + Math.max(feature.bounds.east - feature.bounds.west, 1e-9);
  }, 0) / boundedFeatures.length;
  const latBinSize = averageLatSpan * 4;
  const lngBinSize = averageLngSpan * 4;
  const bins = {};

  function getLatBin(latitude) {
    return Math.floor((latitude - indexBounds.south) / latBinSize);
  }

  function getLngBin(longitude) {
    return Math.floor((longitude - indexBounds.west) / lngBinSize);
  }

  function addFeatureToBin(latBin, lngBin, feature) {
    const key = `${latBin}:${lngBin}`;
    if (!bins[key]) {
      bins[key] = [];
    }
    bins[key].push(feature);
  }

  boundedFeatures.forEach((feature) => {
    const minLatBin = getLatBin(feature.bounds.south);
    const maxLatBin = getLatBin(feature.bounds.north);
    const minLngBin = getLngBin(feature.bounds.west);
    const maxLngBin = getLngBin(feature.bounds.east);

    for (let latBin = minLatBin; latBin <= maxLatBin; latBin += 1) {
      for (let lngBin = minLngBin; lngBin <= maxLngBin; lngBin += 1) {
        addFeatureToBin(latBin, lngBin, feature);
      }
    }
  });

  return {
    queryBounds(bounds) {
      const candidates = [];
      const seenIds = {};
      const minLatBin = getLatBin(bounds.south);
      const maxLatBin = getLatBin(bounds.north);
      const minLngBin = getLngBin(bounds.west);
      const maxLngBin = getLngBin(bounds.east);

      for (let latBin = minLatBin; latBin <= maxLatBin; latBin += 1) {
        for (let lngBin = minLngBin; lngBin <= maxLngBin; lngBin += 1) {
          const binFeatures = bins[`${latBin}:${lngBin}`] || [];
          binFeatures.forEach((feature) => {
            const featureKey = feature.id || `${feature.row}:${feature.column}`;
            if (!seenIds[featureKey]) {
              seenIds[featureKey] = true;
              candidates.push(feature);
            }
          });
        }
      }

      return candidates.concat(fallbackFeatures);
    },
  };
}

function getGridFeatureCandidates(gridFeaturesOrIndex, bounds) {
  if (gridFeaturesOrIndex && typeof gridFeaturesOrIndex.queryBounds === "function") {
    return gridFeaturesOrIndex.queryBounds(bounds);
  }

  return Array.isArray(gridFeaturesOrIndex) ? gridFeaturesOrIndex : [];
}

function clampPointToBounds(point, bounds) {
  return {
    latitude: Math.min(bounds.north, Math.max(bounds.south, point.latitude)),
    longitude: Math.min(bounds.east, Math.max(bounds.west, point.longitude)),
  };
}

function projectPoint(point, referenceLatitude) {
  const meterPerDegreeLatitude = 111320;
  const meterPerDegreeLongitude = 111320 * Math.cos(toRadians(referenceLatitude));

  return {
    x: point.longitude * meterPerDegreeLongitude,
    y: point.latitude * meterPerDegreeLatitude,
  };
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

function orientation(pointA, pointB, pointC) {
  const value =
    (pointB.y - pointA.y) * (pointC.x - pointB.x) -
    (pointB.x - pointA.x) * (pointC.y - pointB.y);

  if (Math.abs(value) < 1e-7) {
    return 0;
  }

  return value > 0 ? 1 : 2;
}

function onSegment(pointA, pointB, pointC) {
  return (
    pointB.x <= Math.max(pointA.x, pointC.x) &&
    pointB.x >= Math.min(pointA.x, pointC.x) &&
    pointB.y <= Math.max(pointA.y, pointC.y) &&
    pointB.y >= Math.min(pointA.y, pointC.y)
  );
}

function segmentsIntersect(startA, endA, startB, endB) {
  const orientation1 = orientation(startA, endA, startB);
  const orientation2 = orientation(startA, endA, endB);
  const orientation3 = orientation(startB, endB, startA);
  const orientation4 = orientation(startB, endB, endA);

  if (orientation1 !== orientation2 && orientation3 !== orientation4) {
    return true;
  }

  if (orientation1 === 0 && onSegment(startA, startB, endA)) {
    return true;
  }
  if (orientation2 === 0 && onSegment(startA, endB, endA)) {
    return true;
  }
  if (orientation3 === 0 && onSegment(startB, startA, endB)) {
    return true;
  }
  if (orientation4 === 0 && onSegment(startB, endA, endB)) {
    return true;
  }

  return false;
}

function doesSegmentIntersectPolygon(startPoint, endPoint, polygonPoints) {
  if (isPointInPolygon(startPoint, polygonPoints) || isPointInPolygon(endPoint, polygonPoints)) {
    return true;
  }

  const referenceLatitude = (startPoint.latitude + endPoint.latitude) / 2;
  const projectedStart = projectPoint(startPoint, referenceLatitude);
  const projectedEnd = projectPoint(endPoint, referenceLatitude);
  const projectedPolygon = polygonPoints.map((point) => projectPoint(point, referenceLatitude));

  for (let index = 0; index < projectedPolygon.length; index += 1) {
    const edgeStart = projectedPolygon[index];
    const edgeEnd = projectedPolygon[(index + 1) % projectedPolygon.length];

    if (segmentsIntersect(projectedStart, projectedEnd, edgeStart, edgeEnd)) {
      return true;
    }
  }

  return false;
}

function getPointToSegmentDistanceInMeters(point, startPoint, endPoint) {
  const referenceLatitude = (startPoint.latitude + endPoint.latitude + point.latitude) / 3;
  const projectedPoint = projectPoint(point, referenceLatitude);
  const projectedStart = projectPoint(startPoint, referenceLatitude);
  const projectedEnd = projectPoint(endPoint, referenceLatitude);
  const deltaX = projectedEnd.x - projectedStart.x;
  const deltaY = projectedEnd.y - projectedStart.y;
  const segmentLengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (segmentLengthSquared === 0) {
    return getDistanceInMeters(point, startPoint);
  }

  const rawRatio = (
    ((projectedPoint.x - projectedStart.x) * deltaX) +
    ((projectedPoint.y - projectedStart.y) * deltaY)
  ) / segmentLengthSquared;
  const ratio = Math.max(0, Math.min(1, rawRatio));
  const closestPoint = {
    x: projectedStart.x + ratio * deltaX,
    y: projectedStart.y + ratio * deltaY,
  };
  const distanceX = projectedPoint.x - closestPoint.x;
  const distanceY = projectedPoint.y - closestPoint.y;

  return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
}

function findIntersectedGridIds(startPoint, endPoint, gridFeatures, litGridIdSet) {
  const segmentBounds = createSegmentBounds(startPoint, endPoint);

  return getGridFeatureCandidates(gridFeatures, segmentBounds)
    .filter((feature) => !litGridIdSet.has(feature.id))
    .filter((feature) => !feature.bounds || doBoundsIntersect(feature.bounds, segmentBounds, 0.00006))
    .filter((feature) => doesSegmentIntersectPolygon(startPoint, endPoint, feature.points))
    .map((feature) => feature.id);
}

function findBufferedGridIds(startPoint, endPoint, gridFeatures, litGridIdSet, radiusMeters) {
  const bufferedSegmentBounds = createBufferedSegmentBounds(startPoint, endPoint, radiusMeters);

  return getGridFeatureCandidates(gridFeatures, bufferedSegmentBounds)
    .filter((feature) => !litGridIdSet.has(feature.id))
    .filter((feature) => !feature.bounds || doBoundsIntersect(feature.bounds, bufferedSegmentBounds))
    .filter((feature) => getPointToSegmentDistanceInMeters(feature.center, startPoint, endPoint) <= radiusMeters)
    .map((feature) => feature.id);
}

function findPoiInRange(point, poiFeatures, visitedPoiIdSet) {
  return poiFeatures.find((poi) => {
    if (visitedPoiIdSet.has(poi.id)) {
      return false;
    }

    const triggerPoints = Array.isArray(poi.triggerPoints) && poi.triggerPoints.length
      ? poi.triggerPoints
      : [poi];
    return triggerPoints.some((triggerPoint) => {
      return getDistanceInMeters(point, triggerPoint) <= poi.radius;
    });
  }) || null;
}

module.exports = {
  clampPointToBounds,
  createGridFeatureSpatialIndex,
  doBoundsIntersect,
  doesSegmentIntersectPolygon,
  findBufferedGridIds,
  findIntersectedGridIds,
  findPoiInRange,
  getDistanceInMeters,
  getPointToSegmentDistanceInMeters,
  isPointInBounds,
  isPointInPolygon,
};
