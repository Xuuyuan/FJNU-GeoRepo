function ensureLocationPermission() {
  return new Promise((resolve) => {
    wx.getSetting({
      success: ({ authSetting = {} }) => {
        if (authSetting["scope.userLocation"]) {
          resolve(true);
          return;
        }

        wx.authorize({
          scope: "scope.userLocation",
          success: () => resolve(true),
          fail: () => {
            wx.showModal({
              title: "需要定位权限",
              content: "开启定位后，才能记录你的校园探索轨迹。",
              confirmText: "去设置",
              success: (modalResult) => {
                if (!modalResult.confirm) {
                  resolve(false);
                  return;
                }

                wx.openSetting({
                  success: ({ authSetting: nextAuthSetting = {} }) => {
                    resolve(Boolean(nextAuthSetting["scope.userLocation"]));
                  },
                  fail: () => resolve(false),
                });
              },
              fail: () => resolve(false),
            });
          },
        });
      },
      fail: () => resolve(false),
    });
  });
}

function startLocationService() {
  return new Promise((resolve) => {
    const onSuccess = () => resolve(true);
    const onFail = () => {
      wx.showToast({
        title: "无法开启连续定位",
        icon: "none",
      });
      resolve(false);
    };

    if (typeof wx.startLocationUpdateBackground === "function") {
      wx.startLocationUpdateBackground({
        success: onSuccess,
        fail: () => {
          wx.startLocationUpdate({
            success: onSuccess,
            fail: onFail,
          });
        },
      });
      return;
    }

    wx.startLocationUpdate({
      success: onSuccess,
      fail: onFail,
    });
  });
}

function startGpsWatchdog({
  locationStaleMs,
  isExploring,
  isGpsWeak,
  getLastLocationTimestamp,
  onWeakSignal,
}) {
  return setInterval(() => {
    if (!isExploring()) {
      return;
    }

    const lastLocationTimestamp = getLastLocationTimestamp();
    const isStale = !lastLocationTimestamp || Date.now() - lastLocationTimestamp > locationStaleMs;
    if (!isStale || isGpsWeak()) {
      return;
    }

    onWeakSignal();
  }, 5000);
}

function stopGpsWatchdog(timer) {
  if (timer) {
    clearInterval(timer);
  }
}

module.exports = {
  ensureLocationPermission,
  startGpsWatchdog,
  startLocationService,
  stopGpsWatchdog,
};
