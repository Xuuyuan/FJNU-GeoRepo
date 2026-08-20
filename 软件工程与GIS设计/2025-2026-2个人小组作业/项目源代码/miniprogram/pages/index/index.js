const {
  CAMPUS_BOUNDS,
  CAMPUS_CENTER,
  DISPLAY_BOUNDS,
  GRID_FEATURES,
  MAP_LIMITS,
  createCampusPolygonsFromGridPolygons,
  createGridPolygon,
  createPoiMarkers,
  createRoadPolylines,
} = require("../../data/campus");
const {
  REACHABLE_GRID_COUNT,
  UNREACHABLE_GRID_ID_SET,
  evaluateAchievements,
  evaluateRouteCompletions,
} = require("../../data/game-config");
const {
  createGridFeatureSpatialIndex,
  findBufferedGridIds,
  getDistanceInMeters,
  isPointInBounds,
} = require("../../utils/spatial");
const {
  clearLocalUserData,
  clearSessionDraft,
  clearPendingPoiQuiz,
  clearPoiQuizResult,
  createDefaultProfile,
  loadDebugModeEnabled,
  loadDemoModeEnabled,
  loadGameProgress,
  loadGridStatus,
  loadPoiQuizResult,
  loadRuntimeConfigCache,
  loadSessionDraft,
  loadUserProfile,
  saveGameProgress,
  saveGridStatus,
  savePendingPoiQuiz,
  saveRuntimeConfigCache,
  saveSessionDraft,
  saveSessionResult,
  saveUserProfile,
} = require("../../utils/storage");
const cloudService = require("../../services/cloud");
const {
  buildCoverageState,
  buildLocationViewState,
  createMapPolylines,
  createTrackPolyline,
} = require("../../services/explore-map-service");
const {
  ensureLocationPermission,
  startGpsWatchdog: startGpsWatchdogTimer,
  startLocationService,
  stopGpsWatchdog: stopGpsWatchdogTimer,
} = require("../../services/location-service");
const {
  buildSessionResult,
  buildSessionSummary,
  createSessionId,
  createSessionRuntime,
  resetSessionRuntime,
  trackSessionAchievement,
  trackSessionGridUnlocks,
  trackSessionPoiDiscovery,
  trackSessionRouteCompletion,
} = require("../../services/explore-session-service");
const {
  applyPoiRuntimeConfig,
  createPoiDiscovery,
  findDiscoverablePoiRule,
  getQuizConfig,
  isQuizPoi,
} = require("../../services/poi-service");

const TRACK_POINT_INTERVAL = 3000;
const TRACK_POINT_MIN_DISTANCE = 6;
const GPS_WEAK_ACCURACY = 60;
const GPS_GRID_UNLOCK_RADIUS_METERS = 20;
const LOCATION_STALE_MS = 15000;
const LOCATION_VIEW_UPDATE_INTERVAL = 1500;
const GRID_SYNC_BATCH_SIZE = 6;
const PANEL_COLLAPSE_RATIO = 0.48;
const PANEL_MIN_COLLAPSE_RPX = 260;
const PANEL_MAX_COLLAPSE_RPX = 420;
const PANEL_HOST_BOTTOM_RPX = 28;
const PANEL_DRAG_UPDATE_INTERVAL = 32;
const MAP_2D_SKEW = 0;
const MAP_3D_SKEW = 55;
const MAP_2D_ROTATE = 0;
const MAP_3D_ROTATE = 0;
const MAP_3D_MIN_SCALE = 17;
const BASE_MAP_CONFIG = {
  enablePoi: false,
  enableBuilding: true,
};

function normalizeCloudTime(value) {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object" && typeof value.getTime === "function") {
    return new Date(value.getTime()).toISOString();
  }

  return new Date().toISOString();
}

Page({
  data: {
    latitude: CAMPUS_CENTER.latitude,
    longitude: CAMPUS_CENTER.longitude,
    scale: MAP_LIMITS.defaultScale,
    minScale: MAP_LIMITS.minScale,
    maxScale: MAP_LIMITS.maxScale,
    map3dEnabled: true,
    baseMapPoiEnabled: BASE_MAP_CONFIG.enablePoi,
    baseMapBuildingEnabled: BASE_MAP_CONFIG.enableBuilding,
    mapSkew: MAP_3D_SKEW,
    mapRotate: MAP_3D_ROTATE,
    markers: createPoiMarkers(),
    polygons: [],
    polyline: createRoadPolylines(),
    trackPoints: [],
    trackPointCount: 0,
    litGridIds: [],
    visitedPoiIds: [],
    exploring: false,
    locating: false,
    gpsWeak: false,
    gpsStatusText: "等待定位",
    syncStatusText: "本地模式",
    exploreStatusText: "未探索",
    exploredCount: 0,
    totalGridCount: REACHABLE_GRID_COUNT,
    coverageRatio: "0.0%",
    debugLatitude: "",
    debugLongitude: "",
    lastDiscoverPoiName: "",
    lastDiscoverPoiKnowledge: "",
    lastAchievementName: "",
    currentLocationText: "待定位",
    campusName: "福建师范大学旗山校区",
    panelOffsetRpx: 0,
    panelHostBottomRpx: PANEL_HOST_BOTTOM_RPX,
    panelTransitionEnabled: true,
    panelCollapsed: false,
    debugModeEnabled: false,
    demoModeEnabled: false,
    showNativeLocation: true,
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.rpxPerPx = 750 / systemInfo.windowWidth;
    this.maxPanelOffsetRpx = Math.min(
      PANEL_MAX_COLLAPSE_RPX,
      Math.max(PANEL_MIN_COLLAPSE_RPX, Math.round(systemInfo.windowHeight * this.rpxPerPx * PANEL_COLLAPSE_RATIO))
    );

    this.basePoiMarkers = createPoiMarkers();
    this.baseRoadPolylines = createRoadPolylines();
    this.trackPolylineDataKey = `polyline[${this.baseRoadPolylines.length}]`;

    const storedGridStatusMap = loadGridStatus();
    this.gridStatusMap = Object.keys(storedGridStatusMap).reduce((nextMap, gridId) => {
      if (!UNREACHABLE_GRID_ID_SET.has(gridId)) {
        nextMap[gridId] = storedGridStatusMap[gridId];
      }
      return nextMap;
    }, {});

    this.litGridIdSet = new Set(Object.keys(this.gridStatusMap));
    const debugModeEnabled = loadDebugModeEnabled();
    const demoModeEnabled = loadDemoModeEnabled();
    this.setData({
      debugModeEnabled,
      demoModeEnabled,
      showNativeLocation: !(debugModeEnabled || demoModeEnabled),
    });
    this.visitedPoiIdSet = new Set();
    this.pendingGridSyncMap = {};
    this.pendingPoiSyncMap = {};
    this.pendingQuizPoiIdSet = new Set();
    this.sessionRuntime = createSessionRuntime();
    this.gridSpatialIndex = createGridFeatureSpatialIndex(GRID_FEATURES);
    this.gridFeatureMap = GRID_FEATURES.reduce((map, feature) => {
      map[feature.id] = feature;
      return map;
    }, {});
    this.litGridPolygons = [];
    this.rebuildLitGridPolygons();
    this.lastTrackRecordTime = 0;
    this.lastLocationTimestamp = 0;
    this.currentSessionId = "";
    this.sessionStartedAt = 0;

    this.userProfile = loadUserProfile(REACHABLE_GRID_COUNT);
    this.gameProgress = loadGameProgress();
    this.runtimeConfigCache = loadRuntimeConfigCache();
    this.completedRouteIdSet = new Set(this.gameProgress.completedRouteIds);
    this.earnedAchievementIdSet = new Set(this.gameProgress.earnedAchievementIds);
    this.locationChangeHandler = this.onLocationChange.bind(this);
    this.mapContext = wx.createMapContext("campusMap", this);
    this.userMarkerInitialized = false;

    this.restoreLocalState();
    wx.onLocationChange(this.locationChangeHandler);
    this.initLocation();
    this.bootstrapCloudState();
  },

  onShow() {
    this.refreshInteractionModeState();

    if (this.locationChangeHandler) {
      wx.offLocationChange(this.locationChangeHandler);
      wx.onLocationChange(this.locationChangeHandler);
    }

    if (this.data.exploring) {
      this.startGpsWatchdog();
    }

    this.applyPoiQuizResultIfNeeded();
  },

  onHide() {
    if (!this.data.exploring) {
      this.stopGpsWatchdog();
    }
  },

  onUnload() {
    if (this.locationChangeHandler) {
      wx.offLocationChange(this.locationChangeHandler);
    }

    this.stopGpsWatchdog();
    this.stopExploring({ silent: true });
  },

  createCampusPolygonsForMode(debugModeEnabled = this.data.debugModeEnabled) {
    const litGridPolygons = this.litGridPolygons || [];
    return debugModeEnabled
      ? createCampusPolygonsFromGridPolygons(litGridPolygons)
      : litGridPolygons;
  },

  rebuildLitGridPolygons() {
    const litGridIdSet = this.litGridIdSet || new Set();
    this.litGridPolygons = Array.from(litGridIdSet)
      .map((gridId) => this.gridFeatureMap && this.gridFeatureMap[gridId])
      .filter(Boolean)
      .map(createGridPolygon);
  },

  appendLitGridPolygons(gridIds) {
    if (!Array.isArray(gridIds) || !gridIds.length) {
      return;
    }

    if (!this.litGridPolygons) {
      this.rebuildLitGridPolygons();
      return;
    }

    gridIds.forEach((gridId) => {
      const feature = this.gridFeatureMap && this.gridFeatureMap[gridId];
      if (feature) {
        this.litGridPolygons.push(createGridPolygon(feature));
      }
    });
  },

  isManualLocationModeEnabled() {
    return this.data.debugModeEnabled || this.data.demoModeEnabled;
  },

  refreshInteractionModeState() {
    const debugModeEnabled = loadDebugModeEnabled();
    const demoModeEnabled = loadDemoModeEnabled();
    const nextState = {
      debugModeEnabled,
      demoModeEnabled,
      showNativeLocation: !(debugModeEnabled || demoModeEnabled),
      polygons: this.createCampusPolygonsForMode(debugModeEnabled),
    };

    this.setData(nextState);
  },

  restoreLocalState() {
    const sessionDraft = loadSessionDraft();
    const lastLocation = sessionDraft && sessionDraft.lastLocation ? sessionDraft.lastLocation : CAMPUS_CENTER;
    const draftTrackPoints = sessionDraft && Array.isArray(sessionDraft.trackPoints) ? sessionDraft.trackPoints : [];
    const draftVisitedPoiIds = sessionDraft && Array.isArray(sessionDraft.visitedPoiIds) ? sessionDraft.visitedPoiIds : [];
    const coverageState = buildCoverageState(this.litGridIdSet, REACHABLE_GRID_COUNT);

    this.lastValidLocation = lastLocation;
    this.trackPoints = draftTrackPoints.slice();
    this.visitedPoiIdSet = new Set(draftVisitedPoiIds);
    this.userProfile.totalGrids = coverageState.exploredCount;
    this.userProfile.exploreRatio = Number(coverageState.coverageRatio.replace("%", ""));
    this.userProfile.updatedAt = this.userProfile.updatedAt || "";
    saveUserProfile(this.userProfile);

    this.setData({
      ...buildLocationViewState({
        point: lastLocation,
        gpsWeak: false,
        moveCenter: true,
        currentLatitude: this.data.latitude,
        currentLongitude: this.data.longitude,
        displayBounds: DISPLAY_BOUNDS,
        basePoiMarkers: this.basePoiMarkers,
      }),
      polygons: this.createCampusPolygonsForMode(),
      polyline: createMapPolylines(draftTrackPoints, this.baseRoadPolylines),
      trackPoints: draftTrackPoints,
      trackPointCount: draftTrackPoints.length,
      visitedPoiIds: draftVisitedPoiIds,
      ...coverageState,
      syncStatusText: cloudService.isCloudReady() ? "云端待同步" : "云端未启用，已切本地",
    });
    this.userMarkerInitialized = true;
  },

  async bootstrapCloudState() {
    if (!cloudService.isCloudReady()) {
      return;
    }

    const configResult = await cloudService.getRuntimeConfig();
    if (configResult.success && configResult.data) {
      this.runtimeConfigCache = {
        source: configResult.source,
        configDocId: configResult.config_doc_id,
        data: configResult.data,
      };
      saveRuntimeConfigCache(this.runtimeConfigCache);
    } else {
      console.warn("getRuntimeConfig failed", configResult);
    }

    const progressResult = await cloudService.getUserProgress();
    if (progressResult.success) {
      console.info("getUserProgress success", progressResult.function_version || "unknown-version");
      this.applyCloudProgress(progressResult);
    } else {
      console.warn("getUserProgress failed", progressResult);
    }

    const summaryResult = await cloudService.initUserProfile({
      total_grids: this.userProfile.totalGrids,
      explore_ratio: this.userProfile.exploreRatio,
      nick_name: this.userProfile.nickName || "",
      poi_count: this.visitedPoiIdSet.size,
      route_count: this.completedRouteIdSet.size,
      achievement_count: this.earnedAchievementIdSet.size,
    });

    if (summaryResult.success) {
      console.info("initUserProfile success", summaryResult.function_version || "unknown-version");
    } else {
      console.warn("initUserProfile failed", summaryResult);
    }

    this.setData({
      syncStatusText: summaryResult.success ? "云端已连接" : "本地已保存，云端稍后重试",
    });
  },

  applyCloudProgress(progressResult) {
    const cloudGrids = Array.isArray(progressResult.grids) ? progressResult.grids : [];
    const cloudPoiRecords = Array.isArray(progressResult.poi_records) ? progressResult.poi_records : [];
    let hasGridChanges = false;

    cloudGrids.forEach((record) => {
      const gridId = record && record.grid_id;
      if (!gridId || UNREACHABLE_GRID_ID_SET.has(gridId) || this.gridStatusMap[gridId]) {
        return;
      }

      this.gridStatusMap[gridId] = normalizeCloudTime(record.unlock_time);
      this.litGridIdSet.add(gridId);
      hasGridChanges = true;
    });

    cloudPoiRecords.forEach((record) => {
      if (record && record.poi_id) {
        this.visitedPoiIdSet.add(record.poi_id);
      }
    });

    const coverageState = buildCoverageState(this.litGridIdSet, REACHABLE_GRID_COUNT);
    this.userProfile = {
      ...this.userProfile,
      totalGrids: coverageState.exploredCount,
      exploreRatio: Number(coverageState.coverageRatio.replace("%", "")),
      updatedAt: new Date().toISOString(),
    };

    if (hasGridChanges) {
      saveGridStatus(this.gridStatusMap);
      this.rebuildLitGridPolygons();
    }
    saveUserProfile(this.userProfile);

    this.setData({
      polygons: this.createCampusPolygonsForMode(),
      visitedPoiIds: Array.from(this.visitedPoiIdSet),
      ...coverageState,
    });
  },

  initLocation() {
    this.setData({
      locating: true,
    });

    if (this.isManualLocationModeEnabled()) {
      const point = this.lastValidLocation || {
        latitude: this.data.latitude,
        longitude: this.data.longitude,
      };
      this.lastValidLocation = point;
      this.lastLocationTimestamp = Date.now();
      this.updateLocationView(point, false, true, { clampCenter: false });
      this.setData({
        locating: false,
        gpsStatusText: this.data.debugModeEnabled ? "调试定位模式" : "演示定位模式",
      });
      return;
    }

    wx.getLocation({
      type: "gcj02",
      success: ({ latitude, longitude, accuracy }) => {
        const point = { latitude, longitude };
        this.lastValidLocation = point;
        this.lastLocationTimestamp = Date.now();
        this.updateLocationView(point, accuracy > GPS_WEAK_ACCURACY, true);
      },
      fail: () => {
        this.updateLocationView(CAMPUS_CENTER, true, true);
        wx.showToast({
          title: "定位失败，已回到校区中心",
          icon: "none",
        });
      },
      complete: () => {
        this.setData({
          locating: false,
        });
      },
    });
  },

  shouldUpdateLocationView(gpsWeak, moveCenter, includeMarkers) {
    if (includeMarkers) {
      return true;
    }

    const now = Date.now();
    if (gpsWeak !== this.lastLocationViewGpsWeak) {
      return true;
    }

    if (!moveCenter) {
      return true;
    }

    return now - (this.lastLocationViewUpdateAt || 0) >= LOCATION_VIEW_UPDATE_INTERVAL;
  },

  updateLocationView(point, gpsWeak, moveCenter, options = {}) {
    const includeMarkers = !this.userMarkerInitialized;
    const shouldUpdateView = this.shouldUpdateLocationView(gpsWeak, moveCenter, includeMarkers);

    if (shouldUpdateView) {
      this.setData(buildLocationViewState({
        point,
        gpsWeak,
        moveCenter,
        currentLatitude: this.data.latitude,
        currentLongitude: this.data.longitude,
        displayBounds: DISPLAY_BOUNDS,
        basePoiMarkers: this.basePoiMarkers,
        includeMarkers,
        clampCenter: options.clampCenter !== false,
      }));
      this.lastLocationViewUpdateAt = Date.now();
      this.lastLocationViewGpsWeak = gpsWeak;
    }

    if (includeMarkers) {
      this.userMarkerInitialized = true;
      return;
    }

    this.moveUserMarker(point);
  },

  moveUserMarker(point) {
    if (!this.mapContext || typeof this.mapContext.translateMarker !== "function") {
      return;
    }

    this.mapContext.translateMarker({
      markerId: 1,
      destination: point,
      duration: 350,
      autoRotate: false,
      fail: () => {
        this.userMarkerInitialized = false;
      },
    });
  },

  handleStartExplore() {
    if (this.data.exploring) {
      this.stopExploring();
      return;
    }

    this.startExploring();
  },

  handleLocate() {
    this.initLocation();
  },

  toggleMapPerspective() {
    const nextEnabled = !this.data.map3dEnabled;
    this.setData({
      map3dEnabled: nextEnabled,
      mapSkew: nextEnabled ? MAP_3D_SKEW : MAP_2D_SKEW,
      mapRotate: nextEnabled ? MAP_3D_ROTATE : MAP_2D_ROTATE,
      scale: nextEnabled ? Math.max(this.data.scale, MAP_3D_MIN_SCALE) : this.data.scale,
    });
  },

  handleManualSync() {
    this.flushPendingSync({
      showFeedback: true,
      forceSummary: true,
    });
  },

  handleOpenHistory() {
    wx.navigateTo({
      url: "/pages/history/index",
    });
  },

  handleOpenPoiGallery() {
    wx.navigateTo({
      url: "/pages/poi-gallery/index",
    });
  },

  handleOpenAchievements() {
    wx.navigateTo({
      url: "/pages/achievements/index",
    });
  },

  handleOpenDashboard() {
    wx.navigateTo({
      url: "/pages/dashboard/index",
    });
  },

  handleClearTrack() {
    if (this.data.exploring) {
      this.stopExploring({ silent: true });
    }

    this.clearTrackSession();
    wx.showToast({
      title: "本次轨迹已清空",
      icon: "none",
    });
  },

  handleDismissDiscoverNotice() {
    this.setData({
      lastDiscoverPoiName: "",
      lastDiscoverPoiKnowledge: "",
    });
  },

  handleDismissAchievementNotice() {
    this.setData({
      lastAchievementName: "",
    });
  },

  handleClearAllData() {
    if (!this.data.debugModeEnabled) {
      return;
    }

    wx.showModal({
      title: "确认清空数据",
      content: "将清空当前用户的网格、图鉴、路线、成就和探索历史。该操作不可恢复。",
      confirmText: "清空",
      confirmColor: "#dc2626",
      success: (result) => {
        if (result.confirm) {
          this.clearAllUserData();
        }
      },
    });
  },

  async clearAllUserData() {
    wx.showLoading({
      title: "正在清空",
      mask: true,
    });

    if (cloudService.isCloudReady()) {
      const clearResult = await cloudService.clearUserData();
      if (!clearResult.success) {
        wx.hideLoading();
        const message = clearResult.message === "unsupported-event:clearUserData"
          ? "请先上传新版云函数"
          : (clearResult.message || "云端清空失败");
        wx.showToast({
          title: message,
          icon: "none",
        });
        return;
      }
    }

    clearLocalUserData();
    this.resetUserRuntimeStateAfterClear();
    wx.hideLoading();
    wx.showToast({
      title: cloudService.isCloudReady() ? "用户数据已清空" : "本机数据已清空",
      icon: "none",
    });
  },

  resetUserRuntimeStateAfterClear() {
    this.stopGpsWatchdog();
    wx.stopLocationUpdate({
      complete: () => {},
    });

    this.gridStatusMap = {};
    this.litGridIdSet = new Set();
    this.litGridPolygons = [];
    this.visitedPoiIdSet = new Set();
    this.pendingGridSyncMap = {};
    this.pendingPoiSyncMap = {};
    this.pendingQuizPoiIdSet = new Set();
    this.sessionRuntime = createSessionRuntime();
    this.completedRouteIdSet = new Set();
    this.earnedAchievementIdSet = new Set();
    this.trackPoints = [];
    this.lastTrackRecordTime = 0;
    this.currentSessionId = "";
    this.sessionStartedAt = 0;
    this.userProfile = createDefaultProfile(REACHABLE_GRID_COUNT);

    this.setData({
      exploring: false,
      exploreStatusText: "未探索",
      syncStatusText: cloudService.isCloudReady() ? "云端已清空" : "本地模式",
      gpsStatusText: this.data.debugModeEnabled
        ? "调试定位已暂停"
        : (this.data.demoModeEnabled ? "演示定位已暂停" : "等待定位"),
      gpsWeak: false,
      polygons: this.createCampusPolygonsForMode(),
      polyline: createMapPolylines([], this.baseRoadPolylines || []),
      trackPoints: [],
      trackPointCount: 0,
      litGridIds: [],
      visitedPoiIds: [],
      exploredCount: 0,
      coverageRatio: "0.0%",
      lastDiscoverPoiName: "",
      lastDiscoverPoiKnowledge: "",
      lastAchievementName: "",
      debugLatitude: "",
      debugLongitude: "",
    });
  },

  handleMapTap(event) {
    if (this.lastMarkerTapAt && Date.now() - this.lastMarkerTapAt < 200) {
      return;
    }

    const { latitude, longitude } = event.detail;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return;
    }
    const point = { latitude, longitude };

    if (!this.isManualLocationModeEnabled()) {
      this.setData({
        debugLatitude: "",
        debugLongitude: "",
      });
      return;
    }

    this.applyMapTapLocation(point);

    if (this.data.debugModeEnabled) {
      this.setData({
        debugLatitude: latitude.toFixed(6),
        debugLongitude: longitude.toFixed(6),
      });
    }
  },

  handleMarkerTap(event) {
    const markerId = event.detail && event.detail.markerId;
    if (typeof markerId !== "number") {
      return;
    }
    this.lastMarkerTapAt = Date.now();
  },

  togglePanel() {
    if (this.panelTouchMoved) {
      this.panelTouchMoved = false;
      return;
    }

    this.snapPanel(!this.data.panelCollapsed);
  },

  handlePanelTouchStart(event) {
    const clientY = event.detail && typeof event.detail.clientY === "number" ? event.detail.clientY : null;
    if (clientY === null) {
      return;
    }

    this.panelTouchStartY = clientY;
    this.panelStartOffsetRpx = this.data.panelOffsetRpx;
    this.panelTouchMoved = false;
    this.panelCurrentOffsetRpx = this.panelStartOffsetRpx;
    this.lastPanelDragUpdateAt = 0;
    this.setData({
      panelTransitionEnabled: false,
    });
  },

  handlePanelTouchMove(event) {
    const clientY = event.detail && typeof event.detail.clientY === "number" ? event.detail.clientY : null;
    if (typeof this.panelTouchStartY !== "number" || clientY === null) {
      return;
    }

    const deltaYpx = clientY - this.panelTouchStartY;
    const deltaYrpx = deltaYpx * this.rpxPerPx;
    const nextOffsetRpx = Math.min(
      this.maxPanelOffsetRpx,
      Math.max(0, this.panelStartOffsetRpx + deltaYrpx)
    );

    if (Math.abs(deltaYpx) > 4) {
      this.panelTouchMoved = true;
    }

    this.panelCurrentOffsetRpx = nextOffsetRpx;
    const now = Date.now();
    if (now - (this.lastPanelDragUpdateAt || 0) < PANEL_DRAG_UPDATE_INTERVAL) {
      return;
    }

    this.lastPanelDragUpdateAt = now;
    this.setPanelOffset(nextOffsetRpx);
  },

  handlePanelTouchEnd() {
    if (typeof this.panelTouchStartY !== "number") {
      return;
    }

    const currentOffsetRpx = typeof this.panelCurrentOffsetRpx === "number"
      ? this.panelCurrentOffsetRpx
      : this.data.panelOffsetRpx;
    const shouldCollapse = currentOffsetRpx > this.maxPanelOffsetRpx / 3;
    this.snapPanel(shouldCollapse);
    this.panelTouchStartY = null;
    this.panelStartOffsetRpx = 0;
    this.panelCurrentOffsetRpx = 0;
  },

  setPanelOffset(panelOffsetRpx) {
    this.setData({
      panelOffsetRpx,
      panelHostBottomRpx: PANEL_HOST_BOTTOM_RPX - panelOffsetRpx,
    });
  },

  snapPanel(collapsed) {
    const panelOffsetRpx = collapsed ? this.maxPanelOffsetRpx : 0;
    this.setData({
      panelOffsetRpx,
      panelHostBottomRpx: PANEL_HOST_BOTTOM_RPX - panelOffsetRpx,
      panelTransitionEnabled: true,
      panelCollapsed: collapsed,
    });
  },

  handleRegionChange(event) {
    if (!event.detail || event.detail.type !== "end" || !this.mapContext) {
      return;
    }

    this.mapContext.getCenterLocation({
      success: (location) => {
        const point = {
          latitude: location.latitude,
          longitude: location.longitude,
        };

        if (this.isManualLocationModeEnabled()) {
          if (this.data.debugModeEnabled && this.data.exploring) {
            this.applyMapTapLocation(point);
          }
          return;
        }

        if (isPointInBounds(point, DISPLAY_BOUNDS)) {
          return;
        }

        this.setData({
          latitude: Math.min(DISPLAY_BOUNDS.north, Math.max(DISPLAY_BOUNDS.south, point.latitude)),
          longitude: Math.min(DISPLAY_BOUNDS.east, Math.max(DISPLAY_BOUNDS.west, point.longitude)),
        });

        const now = Date.now();
        if (!this.lastBoundsToastAt || now - this.lastBoundsToastAt > 4000) {
          this.lastBoundsToastAt = now;
          wx.showToast({
            title: "浏览范围限制在学校校区内！",
            icon: "none",
          });
        }
      },
    });
  },

  applyMapTapLocation(point) {
    if (!this.isManualLocationModeEnabled() || !point) {
      return;
    }

    this.lastValidLocation = point;
    this.lastLocationTimestamp = Date.now();
    this.updateLocationView(point, false, true, { clampCenter: false });

    if (!this.data.exploring) {
      this.setData({
        gpsStatusText: this.data.debugModeEnabled ? "调试定位点已更新" : "演示定位点已更新",
      });
      return;
    }

    if (!isPointInBounds(point, CAMPUS_BOUNDS, 0.0012)) {
      wx.showToast({
        title: "模拟点位不在校区范围内",
        icon: "none",
      });
      return;
    }

    this.setData({
      gpsStatusText: this.data.debugModeEnabled ? "调试定位模拟中" : "演示定位中",
    });
    this.recordTrackPoint(point, true);
  },

  async startExploring() {
    if (!this.isManualLocationModeEnabled()) {
      const hasPermission = await ensureLocationPermission();
      if (!hasPermission) {
        return;
      }

      const started = await startLocationService();
      if (!started) {
        return;
      }
    }

    this.clearTrackSession();
    this.currentSessionId = createSessionId();
    this.sessionStartedAt = Date.now();
    this.lastTrackRecordTime = 0;
    this.lastLocationTimestamp = Date.now();
    if (!this.isManualLocationModeEnabled()) {
      this.startGpsWatchdog();
    }

    this.setData({
      exploring: true,
      exploreStatusText: "探索中",
      gpsStatusText: this.data.debugModeEnabled
        ? "调试定位模式"
        : (this.data.demoModeEnabled ? "演示定位模式" : "GPS 已连接"),
      gpsWeak: false,
      lastDiscoverPoiName: "",
      lastDiscoverPoiKnowledge: "",
      lastAchievementName: "",
    });

    const currentPoint = {
      latitude: this.lastValidLocation ? this.lastValidLocation.latitude : this.data.latitude,
      longitude: this.lastValidLocation ? this.lastValidLocation.longitude : this.data.longitude,
    };

    this.recordTrackPoint(currentPoint, true);

    wx.showToast({
      title: "开始探索",
      icon: "none",
    });
  },

  stopExploring({ silent = false } = {}) {
    if (!this.data.exploring) {
      return;
    }

    this.stopGpsWatchdog();
    if (!this.isManualLocationModeEnabled()) {
      wx.stopLocationUpdate({
        complete: () => {},
      });
    }

    this.setData({
      exploring: false,
      exploreStatusText: "未探索",
      gpsStatusText: this.data.debugModeEnabled
        ? "调试定位已暂停"
        : (this.data.demoModeEnabled ? "演示定位已暂停" : (this.data.gpsWeak ? "当前 GPS 信号较弱" : "探索已结束")),
    });

    clearSessionDraft();

    const sessionSummary = buildSessionSummary({
      sessionId: this.currentSessionId,
      sessionStartedAt: this.sessionStartedAt,
      trackPoints: this.trackPoints || [],
      userProfile: this.userProfile,
      sessionRuntime: this.sessionRuntime,
      litGridIdSet: this.litGridIdSet,
      visitedPoiIdSet: this.visitedPoiIdSet,
      completedRouteIdSet: this.completedRouteIdSet,
      earnedAchievementIdSet: this.earnedAchievementIdSet,
    });

    if (!silent && sessionSummary) {
      const sessionResult = buildSessionResult({
        campusName: this.data.campusName,
        exploredCount: this.litGridIdSet.size,
        coverageRatio: this.data.coverageRatio,
        sessionSummary,
        sessionRuntime: this.sessionRuntime,
      });

      if (sessionResult) {
        saveSessionResult(sessionResult);
      }
    }

    this.flushPendingSync({
      showFeedback: !silent,
      forceSummary: true,
      sessionSummary,
    });

    if (!silent) {
      wx.showToast({
        title: "探索结束",
        icon: "none",
      });

      if (sessionSummary) {
        setTimeout(() => {
          wx.navigateTo({
            url: "/pages/session-result/index",
          });
        }, 250);
      }
    }
  },

  clearTrackSession() {
    this.visitedPoiIdSet = new Set();
    this.trackPoints = [];
    resetSessionRuntime(this.sessionRuntime);
    clearSessionDraft();

    this.setData({
      trackPoints: [],
      trackPointCount: 0,
      polyline: createMapPolylines([], this.baseRoadPolylines || []),
      visitedPoiIds: [],
      lastDiscoverPoiName: "",
      lastDiscoverPoiKnowledge: "",
      lastAchievementName: "",
    });
  },

  onLocationChange(location) {
    const { latitude, longitude, accuracy } = location;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return;
    }

    if (this.isManualLocationModeEnabled()) {
      return;
    }

    const point = { latitude, longitude };
    const gpsWeak = typeof accuracy === "number" ? accuracy > GPS_WEAK_ACCURACY : false;
    this.lastValidLocation = point;
    this.lastLocationTimestamp = Date.now();
    this.updateLocationView(point, gpsWeak, true);

    if (!this.data.exploring) {
      return;
    }

    if (!isPointInBounds(point, CAMPUS_BOUNDS, 0.0012)) {
      const now = Date.now();
      if (!this.lastOutOfCampusToastAt || now - this.lastOutOfCampusToastAt > 5000) {
        this.lastOutOfCampusToastAt = now;
        wx.showToast({
          title: "已离开校区范围，请返回继续探索~",
          icon: "none",
        });
      }
      return;
    }

    this.recordTrackPoint(point);
  },

  recordTrackPoint(point, forceRecord = false) {
    const trackPoints = this.trackPoints || [];
    const lastPoint = trackPoints[trackPoints.length - 1];
    const now = Date.now();

    if (!forceRecord && lastPoint) {
      const distance = getDistanceInMeters(lastPoint, point);
      const tooFrequent = now - (this.lastTrackRecordTime || 0) < TRACK_POINT_INTERVAL;

      if (distance < TRACK_POINT_MIN_DISTANCE || tooFrequent) {
        return;
      }
    }

    trackPoints.push(point);
    this.trackPoints = trackPoints;
    this.lastTrackRecordTime = now;

    const trackPolyline = createTrackPolyline(trackPoints);
    const nextState = {
      trackPointCount: trackPoints.length,
    };

    if (trackPolyline) {
      nextState[this.trackPolylineDataKey] = trackPolyline;
    }

    let reachableNewGridIds = [];
    if (lastPoint) {
      reachableNewGridIds = findBufferedGridIds(
        lastPoint,
        point,
        this.gridSpatialIndex,
        this.litGridIdSet,
        GPS_GRID_UNLOCK_RADIUS_METERS
      ).filter((gridId) => !UNREACHABLE_GRID_ID_SET.has(gridId));
    } else if (forceRecord) {
      reachableNewGridIds = findBufferedGridIds(
        point,
        point,
        this.gridSpatialIndex,
        this.litGridIdSet,
        GPS_GRID_UNLOCK_RADIUS_METERS
      ).filter((gridId) => !UNREACHABLE_GRID_ID_SET.has(gridId));
    }

    if (reachableNewGridIds.length) {
      this.unlockGridBatch(reachableNewGridIds, now);
      this.appendLitGridPolygons(reachableNewGridIds);
      nextState.polygons = this.createCampusPolygonsForMode();
      Object.assign(nextState, buildCoverageState(this.litGridIdSet, REACHABLE_GRID_COUNT));
    }

    const discoveredPoi = this.tryDiscoverPoiFromUnlockedGrids(reachableNewGridIds);
    if (discoveredPoi) {
      nextState.visitedPoiIds = Array.from(this.visitedPoiIdSet);
      nextState.lastDiscoverPoiName = discoveredPoi.name;
      nextState.lastDiscoverPoiKnowledge = discoveredPoi.knowledge;
    }

    const newAchievement = this.evaluateGameRules();
    if (newAchievement) {
      nextState.lastAchievementName = newAchievement.name;
    }

    this.persistSessionDraft(trackPoints, point);
    this.setData(nextState);
  },

  unlockGridBatch(gridIds, unlockTimestamp) {
    const freshRecords = [];

    gridIds.forEach((gridId) => {
      if (this.gridStatusMap[gridId]) {
        return;
      }

      const unlockTime = new Date(unlockTimestamp).toISOString();
      this.gridStatusMap[gridId] = unlockTime;
      this.litGridIdSet.add(gridId);
      this.pendingGridSyncMap[gridId] = {
        grid_id: gridId,
        unlock_time: unlockTime,
      };
      freshRecords.push(gridId);
    });

    if (!freshRecords.length) {
      return;
    }

    trackSessionGridUnlocks(this.sessionRuntime, freshRecords);

    this.userProfile = {
      ...this.userProfile,
      totalGrids: this.litGridIdSet.size,
      exploreRatio: Number((((this.litGridIdSet.size / REACHABLE_GRID_COUNT) * 100)).toFixed(1)),
      updatedAt: new Date(unlockTimestamp).toISOString(),
    };

    saveGridStatus(this.gridStatusMap);
    saveUserProfile(this.userProfile);

    if (Object.keys(this.pendingGridSyncMap).length >= GRID_SYNC_BATCH_SIZE) {
      this.flushPendingSync();
    }

    wx.showToast({
      title: `点亮 ${freshRecords.length} 个网格`,
      icon: "none",
    });
  },

  tryDiscoverPoiFromUnlockedGrids(candidateGridIds) {
    const litGridIds = candidateGridIds && candidateGridIds.length
      ? candidateGridIds
      : Array.from(this.litGridIdSet);
    const poiRule = applyPoiRuntimeConfig(
      findDiscoverablePoiRule(litGridIds, this.visitedPoiIdSet),
      this.runtimeConfigCache
    );

    if (!poiRule) {
      return null;
    }

    if (isQuizPoi(poiRule)) {
      this.startPoiQuiz(poiRule);
      return null;
    }

    return this.confirmPoiDiscovery(poiRule);

  },

  startPoiQuiz(poiRule) {
    if (this.pendingQuizPoiIdSet.has(poiRule.poi_id)) {
      return;
    }

    const quiz = getQuizConfig(poiRule);
    if (!quiz || quiz.options.length < 2) {
      return;
    }

    this.pendingQuizPoiIdSet.add(poiRule.poi_id);
    savePendingPoiQuiz({
      poiRule,
      quiz,
      triggerTime: new Date().toISOString(),
    });
    wx.navigateTo({
      url: `/pages/poi-quiz/index?poiId=${poiRule.poi_id}`,
      fail: () => {
        this.pendingQuizPoiIdSet.delete(poiRule.poi_id);
        clearPendingPoiQuiz();
        wx.showToast({
          title: "答题页打开失败",
          icon: "none",
        });
      },
    });
  },

  applyPoiQuizResultIfNeeded() {
    const quizResult = loadPoiQuizResult();
    if (!quizResult || !quizResult.poiRule || !quizResult.poiRule.poi_id) {
      return;
    }

    clearPoiQuizResult();
    clearPendingPoiQuiz();
    this.pendingQuizPoiIdSet.delete(quizResult.poiRule.poi_id);

    if (!quizResult.passed) {
      wx.showToast({
        title: quizResult.failureText || "答题未通过，稍后可再试",
        icon: "none",
      });
      return;
    }

    const discoveredPoi = this.confirmPoiDiscovery(quizResult.poiRule);
    const newAchievement = this.evaluateGameRules();
    const nextState = {
      visitedPoiIds: Array.from(this.visitedPoiIdSet),
    };

    if (discoveredPoi) {
      nextState.lastDiscoverPoiName = discoveredPoi.name;
      nextState.lastDiscoverPoiKnowledge = discoveredPoi.knowledge;
    }

    if (newAchievement) {
      nextState.lastAchievementName = newAchievement.name;
    }

    this.setData(nextState);
    this.persistSessionDraft(
      this.trackPoints || [],
      this.lastValidLocation || {
        latitude: this.data.latitude,
        longitude: this.data.longitude,
      }
    );

    wx.showToast({
      title: quizResult.successText || "答题通过，地标已发现",
      icon: "none",
    });
  },

  confirmPoiDiscovery(poiRule) {
    const discoveredPoi = createPoiDiscovery({
      poiRule,
      visitedPoiIdSet: this.visitedPoiIdSet,
      sessionRuntime: this.sessionRuntime,
      pendingPoiSyncMap: this.pendingPoiSyncMap,
      trackSessionPoiDiscovery,
    });

    if (!discoveredPoi) {
      return null;
    }

    wx.showToast({
      title: `发现 ${poiRule.name}`,
      icon: "none",
    });

    return discoveredPoi;
  },

  evaluateGameRules() {
    const completedRoutes = evaluateRouteCompletions(this.litGridIdSet, this.completedRouteIdSet);

    completedRoutes.forEach((routeRule) => {
      this.completedRouteIdSet.add(routeRule.route_id);
      trackSessionRouteCompletion(this.sessionRuntime, routeRule.route_id, routeRule.name);
      wx.showToast({
        title: `路线达成：${routeRule.name}`,
        icon: "none",
      });
    });

    const achievements = evaluateAchievements({
      litGridIdSet: this.litGridIdSet,
      visitedPoiIdSet: this.visitedPoiIdSet,
      completedRouteIdSet: this.completedRouteIdSet,
      earnedAchievementIdSet: this.earnedAchievementIdSet,
    });

    achievements.forEach((achievement) => {
      this.earnedAchievementIdSet.add(achievement.achievement_id);
      trackSessionAchievement(this.sessionRuntime, achievement.achievement_id, achievement.name);
    });

    if (completedRoutes.length || achievements.length) {
      saveGameProgress({
        completedRouteIds: Array.from(this.completedRouteIdSet),
        earnedAchievementIds: Array.from(this.earnedAchievementIdSet),
      });
    }

    const firstAchievement = achievements[0];
    if (firstAchievement) {
      wx.showToast({
        title: `成就达成：${firstAchievement.name}`,
        icon: "none",
      });
    }

    return firstAchievement || null;
  },

  persistSessionDraft(trackPoints, point) {
    saveSessionDraft({
      trackPoints: trackPoints.slice(-80),
      visitedPoiIds: Array.from(this.visitedPoiIdSet),
      lastLocation: point,
      updatedAt: new Date().toISOString(),
    });
  },

  startGpsWatchdog() {
    this.stopGpsWatchdog();
    this.gpsWatchdogTimer = startGpsWatchdogTimer({
      locationStaleMs: LOCATION_STALE_MS,
      isExploring: () => this.data.exploring,
      isGpsWeak: () => this.data.gpsWeak,
      getLastLocationTimestamp: () => this.lastLocationTimestamp,
      onWeakSignal: () => {
        this.setData({
          gpsWeak: true,
          gpsStatusText: "当前 GPS 信号较弱",
        });
      },
    });
  },

  stopGpsWatchdog() {
    stopGpsWatchdogTimer(this.gpsWatchdogTimer);
    this.gpsWatchdogTimer = null;
  },

  async flushPendingSync({ showFeedback = false, forceSummary = false, sessionSummary = null } = {}) {
    if (this.syncInFlight) {
      return false;
    }

    if (!cloudService.isCloudReady()) {
      this.setData({
        syncStatusText: "云端未启用，已保存到本地",
      });

      if (showFeedback) {
        wx.showToast({
          title: "云端未配置，本地已保存",
          icon: "none",
        });
      }
      return false;
    }

    this.syncInFlight = true;
    const pendingGridRecords = Object.keys(this.pendingGridSyncMap).map((gridId) => this.pendingGridSyncMap[gridId]);
    const pendingPoiRecords = Object.keys(this.pendingPoiSyncMap).map((poiId) => this.pendingPoiSyncMap[poiId]);

    try {
      let gridSyncSuccess = true;
      if (pendingGridRecords.length) {
        const gridResult = await cloudService.syncGridStatus(pendingGridRecords);
        gridSyncSuccess = Boolean(gridResult.success);
        if (!gridSyncSuccess) {
          console.warn("syncGridStatus failed", gridResult);
        }
      }

      let poiSyncSuccess = true;
      if (pendingPoiRecords.length) {
        const poiResult = await cloudService.syncPoiRecords(pendingPoiRecords);
        poiSyncSuccess = Boolean(poiResult.success);
        if (!poiSyncSuccess) {
          console.warn("syncPoiRecords failed", poiResult);
        }
      }

      let sessionSyncSuccess = true;
      if (sessionSummary) {
        const sessionResult = await cloudService.syncExploreSession(sessionSummary);
        sessionSyncSuccess = Boolean(sessionResult.success);
        if (!sessionSyncSuccess) {
          console.warn("syncExploreSession failed", sessionResult);
        }
      }

      let gameProgressSuccess = true;
      if (forceSummary || this.completedRouteIdSet.size || this.earnedAchievementIdSet.size) {
        const gameProgressResult = await cloudService.syncGameProgress({
          completed_route_ids: Array.from(this.completedRouteIdSet),
          earned_achievement_ids: Array.from(this.earnedAchievementIdSet),
          completed_at: new Date().toISOString(),
          earned_at: new Date().toISOString(),
        });
        gameProgressSuccess = Boolean(gameProgressResult.success);
        if (!gameProgressSuccess) {
          console.warn("syncGameProgress failed", gameProgressResult);
        }
      }

      let summarySuccess = true;
      if (forceSummary || pendingGridRecords.length) {
        const summaryResult = await cloudService.syncExploreSummary({
          total_grids: this.userProfile.totalGrids,
          explore_ratio: this.userProfile.exploreRatio,
          nick_name: this.userProfile.nickName || "",
          poi_count: this.visitedPoiIdSet.size,
          route_count: this.completedRouteIdSet.size,
          achievement_count: this.earnedAchievementIdSet.size,
          session_count_delta: sessionSummary ? 1 : 0,
        });
        summarySuccess = Boolean(summaryResult.success);
        if (!summarySuccess) {
          console.warn("syncExploreSummary failed", summaryResult);
        }
      }

      if (gridSyncSuccess && poiSyncSuccess && sessionSyncSuccess && gameProgressSuccess && summarySuccess) {
        this.pendingGridSyncMap = {};
        this.pendingPoiSyncMap = {};
        if (sessionSummary) {
          this.currentSessionId = "";
          this.sessionStartedAt = 0;
        }

        this.setData({
          syncStatusText: "云端已同步",
        });

        if (showFeedback) {
          wx.showToast({
            title: "探索数据已同步",
            icon: "none",
          });
        }
        return true;
      }

      this.setData({
        syncStatusText: "本地已保存，云端稍后重试",
      });

      if (showFeedback) {
        wx.showToast({
          title: "本地已保存，云端同步失败",
          icon: "none",
        });
      }
      return false;
    } finally {
      this.syncInFlight = false;
    }
  },
});
