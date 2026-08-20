const DEFAULT_POI_TYPE_LABELS = {
  gate: "校门入口",
  landmark: "校园地标",
  landscape: "景观空间",
  life: "生活服务",
  sport: "运动空间",
  study: "学习空间",
};

const { POI_KNOWLEDGE_MAP } = require("../data/game-config");

const ACHIEVEMENT_CATEGORY_LABELS = {
  grid: "探索",
  poi: "地标",
  route: "路线",
};

const FILTER_LABELS = {
  all: "全部",
  discovered: "已发现",
  locked: "未发现",
};

const HISTORY_FILTER_EMPTY_TEXT = {
  all: "完成一次探索并同步后，这里会显示历史记录。",
  poi: "当前还没有发现地标的探索记录。",
  route: "当前还没有完成路线的探索记录。",
  achievement: "当前还没有解锁成就的探索记录。",
};

function normalizeDateValue(value) {
  if (value && typeof value === "object" && typeof value.$date === "string") {
    return value.$date;
  }

  return value;
}

function formatDateTime(value, emptyText = "--") {
  const normalizedValue = normalizeDateValue(value);
  if (!normalizedValue) {
    return emptyText;
  }

  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) {
    return emptyText;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${month}-${day} ${hours}:${minutes}`;
}

function formatResultDuration(durationSeconds) {
  const safeSeconds = Math.max(0, Number(durationSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours) {
    return `${hours}小时 ${minutes}分 ${seconds}秒`;
  }

  if (minutes) {
    return `${minutes}分 ${seconds}秒`;
  }

  return `${seconds}秒`;
}

function formatHistoryDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}小时 ${minutes % 60}分`;
  }

  if (minutes) {
    return `${minutes}分 ${restSeconds}秒`;
  }

  return `${restSeconds}秒`;
}

function formatDistance(meters) {
  const safeMeters = Math.max(0, Number(meters) || 0);
  if (safeMeters >= 1000) {
    return `${(safeMeters / 1000).toFixed(2)} km`;
  }

  return `${Math.round(safeMeters)} m`;
}

function formatListText(values, emptyText) {
  if (!Array.isArray(values) || !values.length) {
    return emptyText;
  }

  return values.join("、");
}

function createSessionResultView(sessionResult) {
  if (!sessionResult || typeof sessionResult !== "object") {
    return null;
  }

  return {
    campusName: sessionResult.campusName || "校园探索",
    durationText: sessionResult.durationText || formatResultDuration(sessionResult.durationSeconds || 0),
    distanceText: sessionResult.distanceText || formatDistance(sessionResult.distanceMeters),
    coverageRatio: sessionResult.coverageRatio || "0.0%",
    exploredCount: sessionResult.totalUnlockedGridCount || sessionResult.exploredCount || 0,
    unlockedGridCount: sessionResult.sessionUnlockedGridCount || sessionResult.unlockedGridCount || 0,
    totalUnlockedGridCount: sessionResult.totalUnlockedGridCount || sessionResult.exploredCount || 0,
    trackPointCount: sessionResult.trackPointCount || 0,
    startTimeText: formatDateTime(sessionResult.startTime),
    endTimeText: formatDateTime(sessionResult.endTime),
    discoveredPoiText: formatListText(sessionResult.discoveredPoiNames, "本次没有发现新地标"),
    completedRouteText: formatListText(sessionResult.completedRouteNames, "本次没有完成新路线"),
    earnedAchievementText: formatListText(sessionResult.earnedAchievementNames, "本次没有解锁新成就"),
    hasSessionResult: true,
  };
}

function normalizeHistorySession(record, index) {
  const safeRecord = record || {};
  const discoveredPoiIds = Array.isArray(safeRecord.discovered_poi_ids) ? safeRecord.discovered_poi_ids : [];
  const achievementIds = Array.isArray(safeRecord.earned_achievement_ids) ? safeRecord.earned_achievement_ids : [];
  const routeIds = Array.isArray(safeRecord.completed_route_ids) ? safeRecord.completed_route_ids : [];
  const sampledTrackPoints = Array.isArray(safeRecord.track_points_sampled) ? safeRecord.track_points_sampled : [];
  const unlockedGridCount = typeof safeRecord.session_unlocked_grid_count === "number"
    ? safeRecord.session_unlocked_grid_count
    : 0;

  return {
    id: safeRecord.session_id || safeRecord._id || `session-${index}`,
    title: `第 ${index + 1} 次探索`,
    timeText: `${formatDateTime(safeRecord.start_time)} - ${formatDateTime(safeRecord.end_time)}`,
    coverageText: safeRecord.coverage_ratio_text || `${safeRecord.explore_ratio || 0}%`,
    distanceMeters: Number(safeRecord.distance_meters) || 0,
    distanceText: safeRecord.distance_text || formatDistance(safeRecord.distance_meters),
    durationText: safeRecord.duration_text || formatHistoryDuration(safeRecord.duration_seconds),
    unlockedGridText: `${unlockedGridCount} 格`,
    poiText: discoveredPoiIds.length ? `发现 ${discoveredPoiIds.length} 个地标` : "",
    routeText: routeIds.length ? `完成 ${routeIds.length} 条路线` : "",
    achievementText: achievementIds.length ? `解锁 ${achievementIds.length} 个成就` : "",
    detailText: `轨迹点 ${safeRecord.track_point_count || 0} · 采样保存 ${sampledTrackPoints.length} 点`,
    hasPoi: discoveredPoiIds.length > 0,
    hasRoute: routeIds.length > 0,
    hasAchievement: achievementIds.length > 0,
    sortTime: new Date(normalizeDateValue(safeRecord.end_time || safeRecord.start_time || 0)).getTime() || 0,
  };
}

function filterHistorySessions(sessions, filterKey) {
  if (filterKey === "poi") {
    return sessions.filter((session) => session.hasPoi);
  }

  if (filterKey === "route") {
    return sessions.filter((session) => session.hasRoute);
  }

  if (filterKey === "achievement") {
    return sessions.filter((session) => session.hasAchievement);
  }

  return sessions;
}

function createHistoryView(trackSessions, filterKey = "all") {
  const allSessions = (Array.isArray(trackSessions) ? trackSessions : [])
    .map(normalizeHistorySession)
    .sort((left, right) => right.sortTime - left.sortTime);
  const safeFilterKey = ["all", "poi", "route", "achievement"].indexOf(filterKey) !== -1 ? filterKey : "all";
  const sessions = filterHistorySessions(allSessions, safeFilterKey);
  const totalDistance = allSessions.reduce((sum, session) => sum + session.distanceMeters, 0);

  return {
    sessions,
    allSessionCount: allSessions.length,
    filterKey: safeFilterKey,
    historyTabs: [
      { key: "all", label: "全部", active: safeFilterKey === "all" },
      { key: "poi", label: "地标", active: safeFilterKey === "poi" },
      { key: "route", label: "路线", active: safeFilterKey === "route" },
      { key: "achievement", label: "成就", active: safeFilterKey === "achievement" },
    ],
    historyEmptyTitle: safeFilterKey === "all" ? "还没有云端探索记录" : "当前筛选暂无记录",
    historyEmptyText: HISTORY_FILTER_EMPTY_TEXT[safeFilterKey],
    totalDistanceText: `累计 ${formatDistance(totalDistance)}`,
  };
}

function getRuntimePoiItems(runtimeConfigCache) {
  const poiConfig = runtimeConfigCache &&
    runtimeConfigCache.data &&
    runtimeConfigCache.data.poi;
  return poiConfig && Array.isArray(poiConfig.items) ? poiConfig.items : [];
}

function createRuntimePoiMap(runtimeConfigCache) {
  return getRuntimePoiItems(runtimeConfigCache).reduce((map, item) => {
    if (item && item.poi_id) {
      map[item.poi_id] = item;
    }
    return map;
  }, {});
}

function createPoiItems({ poiFeatures, poiRecords, runtimeConfigCache, debugModeEnabled = false, typeLabels = DEFAULT_POI_TYPE_LABELS }) {
  const runtimePoiMap = createRuntimePoiMap(runtimeConfigCache);
  const recordMap = (Array.isArray(poiRecords) ? poiRecords : []).reduce((map, record) => {
    if (record && record.poi_id) {
      map[record.poi_id] = record;
    }
    return map;
  }, {});

  return (Array.isArray(poiFeatures) ? poiFeatures : []).map((poi, index) => {
    const runtimePoi = runtimePoiMap[poi.id] || {};
    const record = recordMap[poi.id] || null;
    const discovered = Boolean(record);
    const displayType = runtimePoi.type || poi.type || "landmark";

    return {
      id: poi.id,
      indexText: `${index + 1}`,
      name: runtimePoi.name || poi.name,
      type: displayType,
      typeText: typeLabels[displayType] || displayType || "校园地标",
      radius: poi.radius || 0,
      unlockMode: runtimePoi.unlock_mode || runtimePoi.unlockMode || "",
      unlockModeText: (runtimePoi.unlock_mode || runtimePoi.unlockMode) === "quiz" ? "答题解锁" : "到达发现",
      description: runtimePoi.description || poi.description || "靠近该地点后会记录到地标图鉴。",
      knowledge: discovered ? (runtimePoi.knowledge || POI_KNOWLEDGE_MAP[poi.id] || poi.knowledge || "") : "",
      quizText: runtimePoi.quiz && runtimePoi.quiz.question ? runtimePoi.quiz.question : "",
      discovered,
      locationText: debugModeEnabled ? `${poi.latitude.toFixed(6)}, ${poi.longitude.toFixed(6)}` : "",
      discoveredTimeText: discovered ? formatDateTime(record.trigger_time || record.updated_at, "") : "",
    };
  });
}

function filterPoiItems(poiItems, filterKey) {
  if (filterKey === "discovered") {
    return poiItems.filter((item) => item.discovered);
  }

  if (filterKey === "locked") {
    return poiItems.filter((item) => !item.discovered);
  }

  return poiItems;
}

function createPoiGalleryView({ poiFeatures, poiRecords, runtimeConfigCache, debugModeEnabled = false, errorText = "", filterKey = "all" }) {
  const poiItems = createPoiItems({
    poiFeatures,
    poiRecords,
    runtimeConfigCache,
    debugModeEnabled,
  });
  const safeFilterKey = FILTER_LABELS[filterKey] ? filterKey : "all";
  const filteredPoiItems = filterPoiItems(poiItems, safeFilterKey);
  const discoveredCount = poiItems.filter((item) => item.discovered).length;
  const totalCount = poiItems.length;

  return {
    loading: false,
    errorText,
    poiItems: filteredPoiItems,
    filterKey: safeFilterKey,
    filterText: FILTER_LABELS[safeFilterKey],
    filterTabs: Object.keys(FILTER_LABELS).map((key) => ({
      key,
      label: FILTER_LABELS[key],
      active: key === safeFilterKey,
    })),
    discoveredCount,
    totalCount,
    visibleCount: filteredPoiItems.length,
    progressPercent: totalCount ? Math.round((discoveredCount / totalCount) * 100) : 0,
  };
}

function createPoiNameMap(poiFeatures) {
  return (Array.isArray(poiFeatures) ? poiFeatures : []).reduce((map, poi) => {
    if (poi && poi.id) {
      map[poi.id] = poi.name;
    }
    return map;
  }, {});
}

function createRouteGalleryView({
  routeRules,
  poiFeatures,
  cloudProgress,
  localGameProgress,
  localGridStatus,
  errorText = "",
}) {
  const safeRouteRules = Array.isArray(routeRules) ? routeRules : [];
  const safeCloudProgress = cloudProgress || {};
  const litGridIdSet = createGridIdSetFromProgress(safeCloudProgress.grids, localGridStatus);
  const completedRouteIdSet = createCompletedRouteIdSet(safeCloudProgress.track_sessions, localGameProgress || {});
  addRecordIds(completedRouteIdSet, safeCloudProgress.route_records, "route_id");
  const poiNameMap = createPoiNameMap(poiFeatures);

  const routeItems = safeRouteRules.map((routeRule, index) => {
    const gridIds = Array.isArray(routeRule.grid_ids) ? routeRule.grid_ids : [];
    const litCount = gridIds.filter((gridId) => litGridIdSet.has(gridId)).length;
    const rawRatio = gridIds.length ? litCount / gridIds.length : 0;
    const requiredRatio = typeof routeRule.complete_ratio === "number" ? routeRule.complete_ratio : 1;
    const completed = completedRouteIdSet.has(routeRule.route_id) || rawRatio >= requiredRatio;
    const poiNames = (Array.isArray(routeRule.poi_ids) ? routeRule.poi_ids : [])
      .map((poiId) => poiNameMap[poiId])
      .filter(Boolean);

    return {
      id: routeRule.route_id,
      indexText: `${index + 1}`,
      name: routeRule.name,
      description: routeRule.description || "完成该路线覆盖区域即可解锁路线进度。",
      completed,
      statusText: completed ? "已完成" : "探索中",
      cardClass: completed ? "unlocked" : "locked",
      poiNames,
      poiText: poiNames.length ? poiNames.join(" · ") : "暂无地标清单",
      gridText: `${litCount} / ${gridIds.length} 路线网格`,
      thresholdText: `完成 ${(requiredRatio * 100).toFixed(0)}% 可解锁`,
      progressPercent: Math.min(100, Math.round(rawRatio * 100)),
    };
  });
  const completedRouteCount = routeItems.filter((item) => item.completed).length;
  const totalRouteCount = routeItems.length;

  return {
    loading: false,
    errorText,
    routeItems,
    completedRouteCount,
    totalRouteCount,
    routeProgressPercent: totalRouteCount ? Math.round((completedRouteCount / totalRouteCount) * 100) : 0,
  };
}

function addArrayValues(targetSet, values) {
  if (!Array.isArray(values)) {
    return;
  }

  values.forEach((value) => {
    if (value) {
      targetSet.add(value);
    }
  });
}

function collectSessionIds(trackSessions, fieldNames) {
  const idSet = new Set();
  (Array.isArray(trackSessions) ? trackSessions : []).forEach((session) => {
    const safeSession = session || {};
    fieldNames.forEach((fieldName) => {
      addArrayValues(idSet, safeSession[fieldName]);
    });
  });
  return idSet;
}

function createGridIdSetFromProgress(grids, localGridStatus) {
  const gridIdSet = new Set(Object.keys(localGridStatus || {}));
  (Array.isArray(grids) ? grids : []).forEach((record) => {
    if (record && record.grid_id) {
      gridIdSet.add(record.grid_id);
    }
  });
  return gridIdSet;
}

function createPoiIdSetFromRecords(poiRecords) {
  const poiIdSet = new Set();
  (Array.isArray(poiRecords) ? poiRecords : []).forEach((record) => {
    if (record && record.poi_id) {
      poiIdSet.add(record.poi_id);
    }
  });
  return poiIdSet;
}

function createCompletedRouteIdSet(trackSessions, localGameProgress) {
  const routeIdSet = collectSessionIds(trackSessions, [
    "completed_route_ids",
    "total_completed_route_ids",
  ]);
  addArrayValues(routeIdSet, localGameProgress && localGameProgress.completedRouteIds);
  return routeIdSet;
}

function createEarnedAchievementIdSet(trackSessions, localGameProgress) {
  const achievementIdSet = collectSessionIds(trackSessions, [
    "earned_achievement_ids",
    "total_earned_achievement_ids",
  ]);
  addArrayValues(achievementIdSet, localGameProgress && localGameProgress.earnedAchievementIds);
  return achievementIdSet;
}

function addRecordIds(targetSet, records, fieldName) {
  (Array.isArray(records) ? records : []).forEach((record) => {
    if (record && record[fieldName]) {
      targetSet.add(record[fieldName]);
    }
  });
}

function getRouteName(routeRules, routeId) {
  const route = (Array.isArray(routeRules) ? routeRules : []).find((item) => item.route_id === routeId);
  return route ? route.name : "指定路线";
}

function getAchievementProgress(rule, { litGridIdSet, visitedPoiIdSet, completedRouteIdSet }) {
  if (rule.type === "grid_count") {
    return {
      current: litGridIdSet.size,
      target: rule.required_count || 1,
      unit: "格",
    };
  }

  if (rule.type === "poi_count") {
    return {
      current: visitedPoiIdSet.size,
      target: rule.required_count || 1,
      unit: "个地标",
    };
  }

  if (rule.type === "poi_collection") {
    const requiredPoiIds = Array.isArray(rule.required_poi_ids) ? rule.required_poi_ids : [];
    return {
      current: requiredPoiIds.filter((poiId) => visitedPoiIdSet.has(poiId)).length,
      target: requiredPoiIds.length,
      unit: "个地标",
    };
  }

  if (rule.type === "route_count") {
    return {
      current: completedRouteIdSet.size,
      target: rule.required_count || 1,
      unit: "条路线",
    };
  }

  if (rule.type === "route_completion") {
    return {
      current: completedRouteIdSet.has(rule.route_id) ? 1 : 0,
      target: 1,
      unit: "条路线",
    };
  }

  return {
    current: 0,
    target: 1,
    unit: "",
  };
}

function getAchievementConditionText(rule, routeRules) {
  if (rule.type === "grid_count") {
    return `累计点亮 ${rule.required_count || 1} 个网格`;
  }

  if (rule.type === "poi_count") {
    return `累计发现 ${rule.required_count || 1} 个地标`;
  }

  if (rule.type === "poi_collection") {
    return "发现全部校园地标";
  }

  if (rule.type === "route_count") {
    return `完成 ${rule.required_count || 1} 条路线`;
  }

  if (rule.type === "route_completion") {
    return `完成${getRouteName(routeRules, rule.route_id)}`;
  }

  return "继续探索校园";
}

function createAchievementItem(rule, context) {
  const progress = getAchievementProgress(rule, context);
  const target = Math.max(1, Number(progress.target) || 1);
  const progressPercent = Math.min(100, Math.round((progress.current / target) * 100));
  const unlocked = context.earnedAchievementIdSet.has(rule.achievement_id) || progress.current >= target;
  const category = rule.category || "grid";

  return {
    id: rule.achievement_id,
    name: rule.name,
    description: rule.description || getAchievementConditionText(rule, context.routeRules),
    category,
    categoryText: ACHIEVEMENT_CATEGORY_LABELS[category] || "成就",
    statusText: unlocked ? "已解锁" : "未解锁",
    unlocked,
    cardClass: unlocked ? "unlocked" : "locked",
    progressText: unlocked ? "已解锁" : `${progress.current} / ${target} ${progress.unit}`,
    progressPercent,
    conditionText: getAchievementConditionText(rule, context.routeRules),
    sortOrder: typeof rule.sort_order === "number" ? rule.sort_order : 999,
  };
}

function createAchievementCenterView({
  achievementRules,
  routeRules,
  poiFeatures,
  cloudProgress,
  localGameProgress,
  localGridStatus,
  errorText = "",
}) {
  const safeCloudProgress = cloudProgress || {};
  const trackSessions = Array.isArray(safeCloudProgress.track_sessions) ? safeCloudProgress.track_sessions : [];
  const litGridIdSet = createGridIdSetFromProgress(safeCloudProgress.grids, localGridStatus);
  const visitedPoiIdSet = createPoiIdSetFromRecords(safeCloudProgress.poi_records);
  const completedRouteIdSet = createCompletedRouteIdSet(trackSessions, localGameProgress || {});
  const earnedAchievementIdSet = createEarnedAchievementIdSet(trackSessions, localGameProgress || {});
  addRecordIds(completedRouteIdSet, safeCloudProgress.route_records, "route_id");
  addRecordIds(earnedAchievementIdSet, safeCloudProgress.achievement_records, "achievement_id");
  const rules = (Array.isArray(achievementRules) ? achievementRules : []).slice();

  const achievementItems = rules
    .map((rule) => createAchievementItem(rule, {
      litGridIdSet,
      visitedPoiIdSet,
      completedRouteIdSet,
      earnedAchievementIdSet,
      routeRules,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const unlockedCount = achievementItems.filter((item) => item.unlocked).length;
  const totalCount = achievementItems.length;
  const categoryStats = ["grid", "poi", "route"].map((category) => {
    const items = achievementItems.filter((item) => item.category === category);
    const unlockedItems = items.filter((item) => item.unlocked);
    return {
      key: category,
      label: ACHIEVEMENT_CATEGORY_LABELS[category],
      unlockedCount: unlockedItems.length,
      totalCount: items.length,
      progressText: `${unlockedItems.length} / ${items.length}`,
    };
  });

  return {
    loading: false,
    errorText,
    achievementItems,
    categoryStats,
    unlockedCount,
    totalCount,
    progressPercent: totalCount ? Math.round((unlockedCount / totalCount) * 100) : 0,
    totalPoiCount: Array.isArray(poiFeatures) ? poiFeatures.length : 0,
  };
}

function createDashboardView({
  userStats,
  recentSessions,
  statsSummary,
  leaderboardItems,
  errorText = "",
}) {
  const sessions = (Array.isArray(recentSessions) ? recentSessions : [])
    .map(normalizeHistorySession)
    .sort((left, right) => right.sortTime - left.sortTime)
    .slice(0, 3);
  const safeStats = userStats || {};
  const summary = statsSummary || {};

  return {
    loading: false,
    errorText,
    score: safeStats.score || 0,
    levelText: `Lv.${safeStats.level || 1} ${safeStats.levelName || "新手探路者"}`,
    nextLevelText: `${safeStats.levelProgressPercent || 0}% -> ${safeStats.nextLevelName || "下一等级"}`,
    levelProgressPercent: safeStats.levelProgressPercent || 0,
    statCards: [
      { key: "grid", label: "点亮网格", value: `${safeStats.gridCount || 0}` },
      { key: "poi", label: "发现地标", value: `${safeStats.poiCount || 0} / ${safeStats.totalPoiCount || 0}` },
      { key: "route", label: "完成路线", value: `${safeStats.routeCount || 0}` },
      { key: "achievement", label: "成就", value: `${safeStats.achievementCount || 0} / ${safeStats.totalAchievementCount || 0}` },
    ],
    recentSessions: sessions,
    cloudStatText: summary.user_count
      ? `云端 ${summary.user_count} 人、${summary.session_count || 0} 次探索`
      : "云端统计待同步",
    leaderboardRows: createLeaderboardRows(leaderboardItems, "grid").slice(0, 3),
    leaderboardEmptyText: summary.user_count ? "当前暂无可展示的排行榜记录" : "同步探索进度后，这里会显示网格排行榜前三名。",
  };
}

function getLeaderboardMetricLabels() {
  return {
    grid: "网格",
    poi: "地标",
    achievement: "成就",
  };
}

function getLeaderboardMetricValue(item, metric) {
  if (metric === "poi") {
    return item.poi_count;
  }

  if (metric === "achievement") {
    return item.achievement_count;
  }

  return item.total_grids;
}

function createLeaderboardRows(items, metric = "grid", currentUserId = "") {
  const metricLabels = getLeaderboardMetricLabels();
  const safeMetric = metricLabels[metric] ? metric : "grid";
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const metricValue = getLeaderboardMetricValue(item || {}, safeMetric);
    const rank = item.rank || index + 1;
    const isCurrentUser = Boolean(currentUserId && item.user_id === currentUserId);
    return {
      rank,
      rankText: rank <= 3 ? `TOP ${rank}` : `${rank}`,
      rowClass: `${rank <= 3 ? `rank-top-${rank}` : ""}${isCurrentUser ? " rank-current" : ""}`,
      userId: item.user_id,
      nickName: item.nick_name || "匿名探索者",
      metricValue: Number(metricValue) || 0,
      metricText: `${Number(metricValue) || 0} ${metricLabels[safeMetric]}`,
      subText: `地标 ${item.poi_count || 0} · 成就 ${item.achievement_count || 0} · 探索 ${item.explore_ratio || 0}%`,
      isCurrentUser,
    };
  });
}

function createLeaderboardView({ items, metric = "grid", currentUserId = "", currentUserRank = 0, currentUserItem = null, errorText = "" }) {
  const metricLabels = {
    grid: "网格",
    poi: "地标",
    achievement: "成就",
  };
  const safeMetric = metricLabels[metric] ? metric : "grid";
  const rows = createLeaderboardRows(items, safeMetric, currentUserId);
  const currentRows = createLeaderboardRows(currentUserItem ? [currentUserItem] : [], safeMetric, currentUserId);
  const currentRow = currentRows[0] || null;

  return {
    loading: false,
    errorText,
    metric: safeMetric,
    metricTabs: Object.keys(metricLabels).map((key) => ({
      key,
      label: metricLabels[key],
      active: key === safeMetric,
    })),
    rows,
    currentUserRank: Number(currentUserRank) || 0,
    currentUserRow: currentRow,
    hasCurrentUserRank: Boolean(currentRow),
  };
}

module.exports = {
  createAchievementCenterView,
  createDashboardView,
  createHistoryView,
  createLeaderboardView,
  createPoiGalleryView,
  createPoiItems,
  createRouteGalleryView,
  createSessionResultView,
  formatDateTime,
  formatDistance,
  formatHistoryDuration,
  formatListText,
  formatResultDuration,
  normalizeHistorySession,
};
