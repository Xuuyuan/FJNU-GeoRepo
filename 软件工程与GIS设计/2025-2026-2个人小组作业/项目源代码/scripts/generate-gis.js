const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SOURCE_DIR = process.env.STAR_POI_SOURCE_DIR || "D:/A_project/spatial/star_poi";
const OUTPUT_FILE = path.join(__dirname, "..", "miniprogram", "data", "gis.generated.js");
const GATE_ICON_FILE = path.join(__dirname, "..", "miniprogram", "images", "icons", "gate.png");
const POI_LAND_ICON_FILES = {
  default: path.join(__dirname, "..", "miniprogram", "images", "icons", "poi-land-default.png"),
  lake: path.join(__dirname, "..", "miniprogram", "images", "icons", "poi-land-lake.png"),
  plaza: path.join(__dirname, "..", "miniprogram", "images", "icons", "poi-land-plaza.png"),
  library: path.join(__dirname, "..", "miniprogram", "images", "icons", "poi-land-library.png"),
  sports: path.join(__dirname, "..", "miniprogram", "images", "icons", "poi-land-sports.png"),
  street: path.join(__dirname, "..", "miniprogram", "images", "icons", "poi-land-street.png"),
  office: path.join(__dirname, "..", "miniprogram", "images", "icons", "poi-land-office.png"),
};
const UTM_ZONE = 50;
const DEFAULT_TRIGGER_RADIUS_METERS = 26;

const FIELD_BUILDING_NAME = "\u5efa\u7b51\u540d";
const FIELD_BUILDING_AREA = "\u6240\u5c5e\u533a";
const FIELD_BUILDING_CATEGORY = "\u5efa\u7b51\u7c7b";

const SHAPE_TYPES = {
  1: "Point",
  3: "PolyLine",
  5: "Polygon",
  11: "PointZ",
  13: "PolyLineZ",
  15: "PolygonZ",
};

const WALKABLE_BUILDING_CATEGORIES = new Set([
  "\u64cd\u573a",
  "\u7f51\u7403\u573a",
  "\u8fd0\u52a8\u573a",
  "\u7530\u5f84\u573a",
  "\u6587\u5316\u8857",
  "\u5a31\u4e50\u533a",
]);

const NON_WALKABLE_OPEN_SPACE_NAMES = [
  "\u6e56",
  "\u6c34",
];

function decodeText(buffer) {
  return buffer.toString("utf8").replace(/\u0000/g, "").trim();
}

function readDbf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const recordCount = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  const fields = [];
  let offset = 32;

  while (offset < headerLength && buffer[offset] !== 0x0d) {
    const rawName = buffer.subarray(offset, offset + 11);
    const nullIndex = rawName.indexOf(0);
    fields.push({
      name: decodeText(rawName.subarray(0, nullIndex >= 0 ? nullIndex : rawName.length)),
      type: String.fromCharCode(buffer[offset + 11]),
      length: buffer[offset + 16],
      decimal: buffer[offset + 17],
    });
    offset += 32;
  }

  const records = [];
  for (let index = 0; index < recordCount; index += 1) {
    const recordOffset = headerLength + index * recordLength;
    if (buffer[recordOffset] === 0x2a) {
      records.push(null);
      continue;
    }

    let fieldOffset = recordOffset + 1;
    const record = {};
    fields.forEach((field) => {
      const rawValue = buffer.subarray(fieldOffset, fieldOffset + field.length);
      fieldOffset += field.length;
      const text = decodeText(rawValue);
      if (field.type === "N" || field.type === "F") {
        const numberValue = Number(text);
        record[field.name] = Number.isFinite(numberValue) && text !== "" ? numberValue : text;
      } else {
        record[field.name] = text;
      }
    });
    records.push(record);
  }

  return { fields, records };
}

function readShp(filePath) {
  const buffer = fs.readFileSync(filePath);
  const shapeType = buffer.readInt32LE(32);
  const bounds = {
    west: buffer.readDoubleLE(36),
    south: buffer.readDoubleLE(44),
    east: buffer.readDoubleLE(52),
    north: buffer.readDoubleLE(60),
  };
  const records = [];
  let offset = 100;

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) {
      break;
    }

    const contentLength = buffer.readInt32BE(offset + 4) * 2;
    const contentOffset = offset + 8;
    const recordType = buffer.readInt32LE(contentOffset);
    const content = buffer.subarray(contentOffset, contentOffset + contentLength);
    records.push(parseShapeContent(content, recordType));
    offset = contentOffset + contentLength;
  }

  return {
    shapeType,
    shapeTypeName: SHAPE_TYPES[shapeType] || String(shapeType),
    bounds,
    records,
  };
}

function parseShapeContent(content, shapeType) {
  if (shapeType === 0) {
    return null;
  }

  if (shapeType === 1 || shapeType === 11) {
    return {
      type: SHAPE_TYPES[shapeType],
      point: {
        x: content.readDoubleLE(4),
        y: content.readDoubleLE(12),
      },
    };
  }

  if (shapeType === 3 || shapeType === 5 || shapeType === 13 || shapeType === 15) {
    const numParts = content.readInt32LE(36);
    const numPoints = content.readInt32LE(40);
    const parts = [];
    const points = [];
    let partsOffset = 44;
    let pointsOffset = partsOffset + numParts * 4;

    for (let index = 0; index < numParts; index += 1) {
      parts.push(content.readInt32LE(partsOffset + index * 4));
    }

    for (let index = 0; index < numPoints; index += 1) {
      points.push({
        x: content.readDoubleLE(pointsOffset + index * 16),
        y: content.readDoubleLE(pointsOffset + index * 16 + 8),
      });
    }

    return {
      type: SHAPE_TYPES[shapeType],
      parts: parts.map((start, index) => {
        const end = index + 1 < parts.length ? parts[index + 1] : points.length;
        return points.slice(start, end);
      }),
    };
  }

  throw new Error(`Unsupported shape type ${shapeType}`);
}

function utmToWgs84(point) {
  const semiMajorAxis = 6378137.0;
  const eccentricitySquared = 0.00669437999014;
  const scaleFactor = 0.9996;
  const eccentricityPrimeSquared = eccentricitySquared / (1 - eccentricitySquared);
  const x = point.x - 500000.0;
  const y = point.y;
  const longitudeOrigin = (UTM_ZONE - 1) * 6 - 180 + 3;
  const meridionalArc = y / scaleFactor;
  const mu = meridionalArc / (
    semiMajorAxis *
    (1 - eccentricitySquared / 4 - 3 * eccentricitySquared ** 2 / 64 - 5 * eccentricitySquared ** 3 / 256)
  );
  const e1 = (1 - Math.sqrt(1 - eccentricitySquared)) / (1 + Math.sqrt(1 - eccentricitySquared));
  const footpointLatitude = mu +
    (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) +
    (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) +
    (151 * e1 ** 3 / 96) * Math.sin(6 * mu) +
    (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const sinFootpoint = Math.sin(footpointLatitude);
  const cosFootpoint = Math.cos(footpointLatitude);
  const tanFootpoint = Math.tan(footpointLatitude);
  const c1 = eccentricityPrimeSquared * cosFootpoint ** 2;
  const t1 = tanFootpoint ** 2;
  const n1 = semiMajorAxis / Math.sqrt(1 - eccentricitySquared * sinFootpoint ** 2);
  const r1 = semiMajorAxis * (1 - eccentricitySquared) /
    Math.pow(1 - eccentricitySquared * sinFootpoint ** 2, 1.5);
  const d = x / (n1 * scaleFactor);

  const latitude = footpointLatitude - (n1 * tanFootpoint / r1) * (
    d ** 2 / 2 -
    (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * eccentricityPrimeSquared) * d ** 4 / 24 +
    (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * eccentricityPrimeSquared - 3 * c1 ** 2) * d ** 6 / 720
  );
  const longitude = longitudeOrigin + (
    d -
    (1 + 2 * t1 + c1) * d ** 3 / 6 +
    (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * eccentricityPrimeSquared + 24 * t1 ** 2) * d ** 5 / 120
  ) / cosFootpoint * 180 / Math.PI;

  return {
    latitude: latitude * 180 / Math.PI,
    longitude,
  };
}

function isOutsideChina(point) {
  return point.longitude < 72.004 || point.longitude > 137.8347 ||
    point.latitude < 0.8293 || point.latitude > 55.8271;
}

function transformLatitude(x, y) {
  let result = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  result += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
  result += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3;
  result += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3;
  return result;
}

function transformLongitude(x, y) {
  let result = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  result += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
  result += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3;
  result += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3;
  return result;
}

function wgs84ToGcj02(point) {
  if (isOutsideChina(point)) {
    return point;
  }

  const semiMajorAxis = 6378245.0;
  const eccentricitySquared = 0.00669342162296594323;
  let deltaLatitude = transformLatitude(point.longitude - 105, point.latitude - 35);
  let deltaLongitude = transformLongitude(point.longitude - 105, point.latitude - 35);
  const radiansLatitude = point.latitude / 180 * Math.PI;
  let magic = Math.sin(radiansLatitude);
  magic = 1 - eccentricitySquared * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  deltaLatitude = (deltaLatitude * 180) /
    ((semiMajorAxis * (1 - eccentricitySquared)) / (magic * sqrtMagic) * Math.PI);
  deltaLongitude = (deltaLongitude * 180) /
    (semiMajorAxis / sqrtMagic * Math.cos(radiansLatitude) * Math.PI);

  return {
    latitude: point.latitude + deltaLatitude,
    longitude: point.longitude + deltaLongitude,
  };
}

function transformUtmPoint(point) {
  const gcjPoint = wgs84ToGcj02(utmToWgs84(point));
  return {
    latitude: roundCoordinate(gcjPoint.latitude),
    longitude: roundCoordinate(gcjPoint.longitude),
  };
}

function roundCoordinate(value) {
  return Number(value.toFixed(6));
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

function createCenter(points) {
  const bounds = createBounds(points);
  return {
    latitude: roundCoordinate((bounds.north + bounds.south) / 2),
    longitude: roundCoordinate((bounds.east + bounds.west) / 2),
  };
}

function flattenParts(parts) {
  return parts.reduce((allPoints, part) => allPoints.concat(part), []);
}

function readLayer(layerName) {
  const shp = readShp(path.join(SOURCE_DIR, `${layerName}.shp`));
  const dbf = readDbf(path.join(SOURCE_DIR, `${layerName}.dbf`));
  return shp.records.map((shape, index) => ({
    shape,
    properties: dbf.records[index] || {},
  }));
}

function cleanProperties(properties) {
  return Object.keys(properties).reduce((nextProperties, key) => {
    const value = properties[key];
    if (value !== "" && value !== null && value !== undefined) {
      nextProperties[key] = value;
    }
    return nextProperties;
  }, {});
}

function getProperty(properties, key, fallback = "") {
  const value = properties[key];
  return value === null || value === undefined || value === "" ? fallback : value;
}

function isBuildingWalkable(category) {
  return WALKABLE_BUILDING_CATEGORIES.has(category);
}

function isOpenSpaceWalkable(name) {
  return !NON_WALKABLE_OPEN_SPACE_NAMES.some((keyword) => name.indexOf(keyword) !== -1);
}

function polygonRecordToFeature(record, id, options) {
  const rings = record.shape.parts.map((part) => part.map(transformUtmPoint));
  const allPoints = flattenParts(rings);
  const properties = cleanProperties(record.properties);
  return {
    id,
    sourceLayer: options.sourceLayer,
    name: options.name(properties),
    type: options.type(properties),
    category: options.category ? options.category(properties) : "",
    areaName: options.areaName ? options.areaName(properties) : "",
    walkable: options.walkable ? options.walkable(properties) : true,
    points: rings[0] || [],
    rings,
    center: createCenter(allPoints),
    bounds: createBounds(allPoints),
    properties,
  };
}

function lineRecordToFeature(record, id) {
  const paths = record.shape.parts.map((part) => part.map(transformUtmPoint));
  const allPoints = flattenParts(paths);
  const properties = cleanProperties(record.properties);
  return {
    id,
    sourceLayer: "star_road",
    name: getProperty(properties, "name", getProperty(properties, "fclass", id)),
    type: getProperty(properties, "fclass", "road"),
    points: paths[0] || [],
    paths,
    center: createCenter(allPoints),
    bounds: createBounds(allPoints),
    properties,
  };
}

function pointRecordToFeature(record, id, options) {
  const point = transformUtmPoint(record.shape.point);
  const properties = cleanProperties(record.properties);
  return {
    id,
    sourceLayer: options.sourceLayer,
    name: options.name(properties),
    type: options.type(properties),
    latitude: point.latitude,
    longitude: point.longitude,
    center: point,
    properties,
  };
}

function createMainPois(triggers) {
  const groups = {};
  triggers.forEach((trigger) => {
    const poiId = trigger.poi_id;
    if (!groups[poiId]) {
      groups[poiId] = {
        id: poiId,
        poi_id: poiId,
        name: trigger.name,
        type: "landmark",
        radius: DEFAULT_TRIGGER_RADIUS_METERS,
        triggerPoints: [],
        properties: {},
      };
    }
    groups[poiId].triggerPoints.push({
      id: trigger.id,
      latitude: trigger.latitude,
      longitude: trigger.longitude,
    });
  });

  return Object.keys(groups).sort().map((poiId) => {
    const poi = groups[poiId];
    const latitude = poi.triggerPoints.reduce((total, point) => total + point.latitude, 0) / poi.triggerPoints.length;
    const longitude = poi.triggerPoints.reduce((total, point) => total + point.longitude, 0) / poi.triggerPoints.length;
    return {
      ...poi,
      latitude: roundCoordinate(latitude),
      longitude: roundCoordinate(longitude),
    };
  });
}

function createGeneratedData() {
  const buildings = readLayer("star_buil").map((record, index) => polygonRecordToFeature(record, `building-${index + 1}`, {
    sourceLayer: "star_buil",
    name: (properties) => getProperty(properties, FIELD_BUILDING_NAME, `建筑 ${index + 1}`),
    type: (properties) => getProperty(properties, FIELD_BUILDING_CATEGORY, "building"),
    category: (properties) => getProperty(properties, FIELD_BUILDING_CATEGORY, ""),
    areaName: (properties) => getProperty(properties, FIELD_BUILDING_AREA, ""),
    walkable: (properties) => isBuildingWalkable(getProperty(properties, FIELD_BUILDING_CATEGORY, "")),
  }));

  const roads = readLayer("star_road").map((record, index) => lineRecordToFeature(record, `road-${index + 1}`));

  const openSpaces = readLayer("star_open_space").map((record, index) => polygonRecordToFeature(record, `open-space-${index + 1}`, {
    sourceLayer: "star_open_space",
    name: (properties) => getProperty(properties, "name", `开放空间 ${index + 1}`),
    type: (properties) => isOpenSpaceWalkable(getProperty(properties, "name", "")) ? "open_space" : "water",
    walkable: (properties) => isOpenSpaceWalkable(getProperty(properties, "name", "")),
  }));

  const gates = readLayer("gate").map((record, index) => pointRecordToFeature(record, `gate-${index + 1}`, {
    sourceLayer: "gate",
    name: (properties) => getProperty(properties, "name", `校门 ${index + 1}`),
    type: () => "gate",
  }));

  const mainPoiTriggers = readLayer("main_poi").map((record, index) => {
    const feature = pointRecordToFeature(record, `main-poi-trigger-${index + 1}`, {
      sourceLayer: "main_poi",
      name: (properties) => getProperty(properties, "name", `POI ${index + 1}`),
      type: () => "landmark",
    });
    const poiId = getProperty(feature.properties, "poi_id", feature.id);
    return {
      ...feature,
      poi_id: poiId,
      radius: DEFAULT_TRIGGER_RADIUS_METERS,
    };
  });

  const poiLands = readLayer("poi_land").map((record, index) => pointRecordToFeature(record, `poi-land-${index + 1}`, {
    sourceLayer: "poi_land",
    name: (properties) => getProperty(properties, "name", `POI Land ${index + 1}`),
    type: (properties) => getProperty(properties, "type", "landmark"),
  }));

  return {
    metadata: {
      sourceDir: SOURCE_DIR,
      coordinateSource: "WGS_1984_UTM_Zone_50N",
      coordinateTarget: "GCJ-02",
      generatedAt: new Date().toISOString(),
      counts: {
        gate: gates.length,
        main_poi: mainPoiTriggers.length,
        poi_land: poiLands.length,
        star_buil: buildings.length,
        star_open_space: openSpaces.length,
        star_road: roads.length,
      },
    },
    buildings,
    roads,
    openSpaces,
    gates,
    poiLands,
    mainPoiTriggers,
    mainPois: createMainPois(mainPoiTriggers),
  };
}

function writeGeneratedFile(data) {
  const content = [
    "// This file is generated by scripts/generate-gis.js.",
    "// Source shapefiles are stored outside the mini program repo.",
    `const GIS_METADATA = ${JSON.stringify(data.metadata, null, 2)};`,
    `const GIS_BUILDINGS = ${JSON.stringify(data.buildings, null, 2)};`,
    `const GIS_ROADS = ${JSON.stringify(data.roads, null, 2)};`,
    `const GIS_OPEN_SPACES = ${JSON.stringify(data.openSpaces, null, 2)};`,
    `const GIS_GATES = ${JSON.stringify(data.gates, null, 2)};`,
    `const GIS_POI_LANDS = ${JSON.stringify(data.poiLands, null, 2)};`,
    `const MAIN_POI_TRIGGERS = ${JSON.stringify(data.mainPoiTriggers, null, 2)};`,
    `const GIS_MAIN_POIS = ${JSON.stringify(data.mainPois, null, 2)};`,
    "",
    "module.exports = {",
    "  GIS_METADATA,",
    "  GIS_BUILDINGS,",
    "  GIS_ROADS,",
    "  GIS_OPEN_SPACES,",
    "  GIS_GATES,",
    "  GIS_POI_LANDS,",
    "  MAIN_POI_TRIGGERS,",
    "  GIS_MAIN_POIS,",
    "};",
    "",
  ].join("\n");
  fs.writeFileSync(OUTPUT_FILE, content, "utf8");
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function createGateIconPng() {
  const width = 32;
  const height = 32;
  const rows = [];

  function isDoorPixel(x, y) {
    const inFrame = x >= 8 && x <= 24 && y >= 6 && y <= 27;
    const border = inFrame && (x <= 10 || x >= 22 || y <= 8 || y >= 25);
    const panel = x >= 12 && x <= 20 && y >= 10 && y <= 25;
    const knob = x >= 18 && x <= 20 && y >= 17 && y <= 19;
    return border || panel || knob;
  }

  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 4;
      const visible = isDoorPixel(x, y);
      row[offset] = visible ? 15 : 0;
      row[offset + 1] = visible ? 118 : 0;
      row[offset + 2] = visible ? 110 : 0;
      row[offset + 3] = visible ? 255 : 0;
      if (x >= 13 && x <= 19 && y >= 11 && y <= 24) {
        row[offset] = 255;
        row[offset + 1] = 255;
        row[offset + 2] = 255;
        row[offset + 3] = 255;
      }
      if (x >= 18 && x <= 20 && y >= 17 && y <= 19) {
        row[offset] = 245;
        row[offset + 1] = 158;
        row[offset + 2] = 11;
        row[offset + 3] = 255;
      }
    }
    rows.push(row);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function ensureGateIcon() {
  fs.writeFileSync(GATE_ICON_FILE, createGateIconPng());
}

function createPoiLandIconPng(kind) {
  const width = 32;
  const height = 32;
  const rows = [];
  const colors = {
    default: [37, 99, 235],
    lake: [14, 165, 233],
    plaza: [245, 158, 11],
    library: [79, 70, 229],
    sports: [22, 163, 74],
    street: [100, 116, 139],
    office: [15, 118, 110],
  };
  const color = colors[kind] || colors.default;

  function inCircle(x, y, cx, cy, radius) {
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
  }

  function glyphVisible(x, y) {
    if (kind === "lake") {
      return (y === 15 || y === 19) && x >= 9 && x <= 23 && (x + y) % 4 < 2;
    }
    if (kind === "plaza") {
      return (x >= 12 && x <= 20 && y >= 12 && y <= 20) && (x === 12 || x === 20 || y === 12 || y === 20);
    }
    if (kind === "library") {
      return (x >= 10 && x <= 13 && y >= 11 && y <= 21) ||
        (x >= 15 && x <= 18 && y >= 11 && y <= 21) ||
        (x >= 20 && x <= 22 && y >= 11 && y <= 21) ||
        (x >= 9 && x <= 23 && y >= 22 && y <= 23);
    }
    if (kind === "sports") {
      return inCircle(x, y, 16, 16, 7) && !inCircle(x, y, 16, 16, 4);
    }
    if (kind === "street") {
      return (x >= 10 && x <= 22 && y >= 14 && y <= 18) || (x >= 15 && x <= 17 && y >= 9 && y <= 23);
    }
    if (kind === "office") {
      return (x >= 10 && x <= 22 && y >= 10 && y <= 23) &&
        (x === 10 || x === 22 || y === 10 || y === 23 || (x % 4 === 0 && y >= 13 && y <= 20));
    }
    return (x >= 13 && x <= 19 && y >= 9 && y <= 21) || (x >= 10 && x <= 22 && y >= 20 && y <= 23);
  }

  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 4;
      const outer = inCircle(x, y, 16, 15, 12);
      const tail = y >= 22 && y <= 29 && Math.abs(x - 16) <= 29 - y;
      const visible = outer || tail;
      row[offset] = visible ? color[0] : 0;
      row[offset + 1] = visible ? color[1] : 0;
      row[offset + 2] = visible ? color[2] : 0;
      row[offset + 3] = visible ? 255 : 0;
      if (glyphVisible(x, y)) {
        row[offset] = 255;
        row[offset + 1] = 255;
        row[offset + 2] = 255;
        row[offset + 3] = 255;
      }
    }
    rows.push(row);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function ensurePoiLandIcons() {
  Object.keys(POI_LAND_ICON_FILES).forEach((kind) => {
    fs.writeFileSync(POI_LAND_ICON_FILES[kind], createPoiLandIconPng(kind));
  });
}

function main() {
  const data = createGeneratedData();
  writeGeneratedFile(data);
  ensureGateIcon();
  ensurePoiLandIcons();
  console.log(JSON.stringify(data.metadata.counts, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  createGeneratedData,
  readDbf,
  readLayer,
  readShp,
  transformUtmPoint,
  utmToWgs84,
  wgs84ToGcj02,
};
