const assert = require("assert");

const { DISPLAY_BOUNDS, ROAD_FEATURES, createRoadPolylines } = require("../miniprogram/data/campus");
const {
  buildLocationViewState,
  createDisplayTrackPoints,
  createMapPolylines,
} = require("../miniprogram/services/explore-map-service");

const point = { latitude: 26.026254, longitude: 119.209651 };
const basePoiMarkers = [{ id: 1000, latitude: 26.028164, longitude: 119.210532 }];

const initialState = buildLocationViewState({
  point,
  gpsWeak: false,
  moveCenter: true,
  currentLatitude: 0,
  currentLongitude: 0,
  displayBounds: DISPLAY_BOUNDS,
  basePoiMarkers,
});

assert(Array.isArray(initialState.markers), "initial location state should include markers");
assert.strictEqual(initialState.markers[0].id, 1, "first marker should be the user marker");
assert.strictEqual(initialState.markers[1], basePoiMarkers[0], "base POI markers should be reused");

const lightweightState = buildLocationViewState({
  point,
  gpsWeak: false,
  moveCenter: true,
  currentLatitude: 0,
  currentLongitude: 0,
  displayBounds: DISPLAY_BOUNDS,
  basePoiMarkers,
  includeMarkers: false,
});

assert(!Object.prototype.hasOwnProperty.call(lightweightState, "markers"), "location updates can skip marker rebuilds");
assert.strictEqual(lightweightState.currentLocationText, "26.026254, 119.209651", "location text should still update");

const outsideDisplayPoint = {
  latitude: DISPLAY_BOUNDS.north + 0.01,
  longitude: DISPLAY_BOUNDS.east + 0.01,
};
const clampedState = buildLocationViewState({
  point: outsideDisplayPoint,
  gpsWeak: false,
  moveCenter: true,
  currentLatitude: 0,
  currentLongitude: 0,
  displayBounds: DISPLAY_BOUNDS,
  basePoiMarkers,
  includeMarkers: false,
});
const manualState = buildLocationViewState({
  point: outsideDisplayPoint,
  gpsWeak: false,
  moveCenter: true,
  currentLatitude: 0,
  currentLongitude: 0,
  displayBounds: DISPLAY_BOUNDS,
  basePoiMarkers,
  includeMarkers: false,
  clampCenter: false,
});

assert.strictEqual(clampedState.latitude, DISPLAY_BOUNDS.north, "normal location view should clamp map center to display bounds");
assert.strictEqual(clampedState.longitude, DISPLAY_BOUNDS.east, "normal location view should clamp longitude to display bounds");
assert.strictEqual(manualState.latitude, outsideDisplayPoint.latitude, "manual location view should keep the simulated latitude");
assert.strictEqual(manualState.longitude, outsideDisplayPoint.longitude, "manual location view should keep the simulated longitude");

const longTrack = Array.from({ length: 1000 }, (_, index) => ({
  latitude: 26 + index * 0.000001,
  longitude: 119 + index * 0.000001,
}));
const sampledTrack = createDisplayTrackPoints(longTrack);
const polylines = createMapPolylines(longTrack, []);
const roadPolylines = createRoadPolylines();

assert(ROAD_FEATURES.length > 0, "imported road data should remain available for route logic");
assert.strictEqual(roadPolylines.length, ROAD_FEATURES.length, "imported road polylines should be visible on the default map display");
assert(sampledTrack.length <= 240, "display track sampling should cap long tracks");
assert.strictEqual(sampledTrack[0], longTrack[0], "display track sampling should keep the first point");
assert.strictEqual(sampledTrack[sampledTrack.length - 1], longTrack[longTrack.length - 1], "display track sampling should keep the last point");
assert.strictEqual(polylines[0].points.length, sampledTrack.length, "map polyline should use sampled display points");

console.log("Explore map service tests passed.");
