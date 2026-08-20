Component({
  properties: {
    exploring: Boolean,
    exploreStatusText: String,
    coverageRatio: String,
    syncStatusText: String,
    exploredCount: Number,
    totalGridCount: Number,
    trackPointCount: Number,
    visitedPoiCount: Number,
    currentLocationText: String,
    lastDiscoverPoiName: String,
    lastDiscoverPoiKnowledge: String,
    lastAchievementName: String,
    debugLatitude: String,
    debugLongitude: String,
    debugModeEnabled: Boolean,
    locating: Boolean,
    panelCollapsed: Boolean,
  },

  methods: {
    emitLocate() {
      this.triggerEvent("locate");
    },

    emitManualSync() {
      this.triggerEvent("manualsync");
    },

    emitClearTrack() {
      this.triggerEvent("cleartrack");
    },

    emitDismissDiscover() {
      this.triggerEvent("dismissdiscover");
    },

    emitDismissAchievement() {
      this.triggerEvent("dismissachievement");
    },

    emitToggleExplore() {
      this.triggerEvent("toggleexplore");
    },

    emitTogglePanel() {
      this.triggerEvent("togglepanel");
    },

    emitPanelTouchStart(event) {
      const touch = event.touches && event.touches.length ? event.touches[0] : null;
      this.triggerEvent("paneltouchstart", {
        clientY: touch ? touch.clientY : null,
      }, {
        bubbles: true,
        composed: true,
      });
    },

    emitPanelTouchMove(event) {
      const touch = event.touches && event.touches.length ? event.touches[0] : null;
      this.triggerEvent("paneltouchmove", {
        clientY: touch ? touch.clientY : null,
      }, {
        bubbles: true,
        composed: true,
      });
    },

    emitPanelTouchEnd() {
      this.triggerEvent("paneltouchend", {}, {
        bubbles: true,
        composed: true,
      });
    },
  },
});
