const {
  BUILDING_FEATURES,
  GRID_FEATURES,
  OPEN_SPACE_FEATURES,
  POI_FEATURES,
} = require("./campus");
const {
  doBoundsIntersect,
  doesSegmentIntersectPolygon,
  getDistanceInMeters,
  isPointInPolygon,
} = require("../utils/spatial");
const GENERATED_GRID_DATA = require("./game-grid-data.generated");

const POI_REACHABLE_FALLBACK_RADIUS_METERS = 180;
const POI_REACHABLE_FALLBACK_GRID_LIMIT = 12;

const MANUAL_UNREACHABLE_AREAS = [];
const POI_KNOWLEDGE_MAP = {
  "poi-art-college": "美术学院楼群位于校园南侧艺术教学片区，周边常见写生、展陈与创作课程活动。",
  "poi-baochen-plaza": "宝琛广场处在校园核心中轴附近，是集会、活动和日常通行的重要开放空间。",
  "poi-checkin-lawn": "打卡点草坪视野开阔，适合观察校园开放绿地与主要步行流线的关系。",
  "poi-clinic": "校医院服务北区生活圈，是校园日常医疗保障和健康咨询的重要节点。",
  "poi-college-buildings": "学院楼群集中承载院系办公与教学活动，是校园学术单元分布的缩影。",
  "poi-cuizhuyuan-canteen": "翠竹园餐厅服务周边宿舍与教学区，是北侧生活补给动线上的常用餐饮点。",
  "poi-culture-street": "文化街连接餐饮、生活服务与宿舍区，体现校园公共生活的烟火气。",
  "poi-culture-street-canteen": "文化街食堂靠近北区生活服务带，是学生日常用餐和社交停留的高频地点。",
  "poi-duxing-building": "笃行楼名称取意踏实实践，位于核心教学片区，周边学习通行密度较高。",
  "poi-east-track": "东区田径场承担跑步、球类训练和体育课程，是校园东侧重要运动空间。",
  "poi-gongqingtuan-plaza": "共青团广场常承载社团展示与公共活动，是校园青年文化表达的开放节点。",
  "poi-guiyuan-dorm": "桂苑宿舍楼群位于北侧生活区，周边与食堂、文化街形成日常生活闭环。",
  "poi-huaxiangyuan-canteen": "花香园餐厅靠近宿舍和学院楼群，是学生早晚高峰常用的餐饮补给点。",
  "poi-humanities-buildings": "人文楼群聚集人文社科相关教学空间，建筑周边常见安静阅读和课间交流场景。",
  "poi-indoor-pool": "室内游泳馆提供不受天气影响的游泳训练条件，是校园体育设施的重要补充。",
  "poi-indoor-track": "室内田径场适合雨天训练和体育教学，体现校园运动空间的全天候设计。",
  "poi-jiashuyuan-canteen": "嘉树园食堂服务北区宿舍群，名称带有树木意象，呼应校园绿化环境。",
  "poi-lanyuan-dorm": "兰苑宿舍楼群位于校园南侧生活片区，靠近艺术与运动空间。",
  "poi-library": "又玄图书馆是校园知识资源中心，也是自习、检索资料和学术交流的重要场所。",
  "poi-licheng-building": "立诚楼名称强调诚信立身，周边连接教学楼群与校园核心开放空间。",
  "poi-lingxian-building": "领先楼位于南侧教学片区，名称体现创新进取的校园精神。",
  "poi-liyuan-dorm": "李苑宿舍楼群靠近文化街和校医院，是北区生活服务网络的一部分。",
  "poi-liyuan-5-test": "李苑5号楼是北区学生宿舍的一部分，该测试地标用于检查指定建筑点位能否独立进入图鉴。",
  "poi-music-college": "音乐学院楼承载排练、演奏和音乐教学活动，是校园艺术氛围的重要来源。",
  "poi-new-liyuan-dorm": "新李苑宿舍楼群扩展了北区住宿空间，周边生活配套较为集中。",
  "poi-outdoor-pool": "室外游泳馆与运动场地相邻，构成校园体育活动的开放场景。",
  "poi-rongyuan-dorm": "榕苑宿舍楼群靠近餐饮与北侧通行动线，是学生生活区的重要组成。",
  "poi-science-engineering-buildings": "理工楼群聚合理工科教学与实验场景，周边空间更强调通达与功能效率。",
  "poi-shemingpei-building": "佘明培楼位于体育与教学片区之间，是校园建筑命名纪念传统的体现。",
  "poi-south-track": "南区田径场靠近南侧宿舍与艺术片区，是南部学生运动休闲的重要场地。",
  "poi-sports-college": "体育学院连接多个运动场馆，是体育教学、训练与校园赛事组织的核心节点。",
  "poi-suolaida-building": "索莱达大楼位于东南侧教学片区，周边与体育学院和场馆联系紧密。",
  "poi-taoyuan-dorm": "桃苑宿舍楼群位于校园北侧，周边靠近文化街和生活服务设施。",
  "poi-teaching-buildings": "教学楼群承担大量公共课程教学，是校园学习活动最密集的区域之一。",
  "poi-west-track": "西区田径场位于校园西侧边缘，可观察运动空间与宿舍生活区的衔接。",
  "poi-xingyu-lake": "星雨湖是校园景观水体节点，调节空间节奏，也提供休憩和观景体验。",
  "poi-zhiguang-building": "致广楼名称寓意拓展视野，位置靠近图书馆与核心教学区。",
  "poi-zhiming-building": "知明楼位于教学楼群附近，名称呼应求知明理的校园学习精神。",
};

const POI_QUIZ_CONFIG_MAP = {
  "poi-library": {
    question: "又玄图书馆在本项目中主要代表哪类校园空间？",
    options: [
      { option_id: "study", text: "学习与学术资源空间", is_correct: true },
      { option_id: "sports", text: "运动训练空间", is_correct: false },
      { option_id: "dorm", text: "学生住宿空间", is_correct: false },
    ],
    success_text: "答题通过，又玄图书馆已加入你的地标图鉴。",
    failure_text: "还差一点点。提示：这里和自习、检索资料、学术交流有关。",
  },
  "poi-baochen-plaza": {
    question: "宝琛广场更适合作为哪种校园活动节点来理解？",
    options: [
      { option_id: "public", text: "集会与日常通行的开放空间", is_correct: true },
      { option_id: "medical", text: "医疗健康服务点", is_correct: false },
      { option_id: "canteen", text: "餐饮补给点", is_correct: false },
    ],
    success_text: "答题通过，宝琛广场已发现。",
    failure_text: "再观察一下空间功能：它位于校园核心中轴附近。",
  },
  "poi-xingyu-lake": {
    question: "星雨湖在校园空间中最接近哪类地理要素？",
    options: [
      { option_id: "water-landscape", text: "景观水体与休憩节点", is_correct: true },
      { option_id: "traffic-gate", text: "校园出入口", is_correct: false },
      { option_id: "teaching-building", text: "公共教学楼", is_correct: false },
    ],
    success_text: "答题通过，星雨湖已点亮。",
    failure_text: "提示：它是校园景观水体，也提供观景和停留体验。",
  },
  "poi-sports-college": {
    question: "体育学院周边 POI 主要对应哪类探索主题？",
    options: [
      { option_id: "sports", text: "体育教学、训练与赛事组织", is_correct: true },
      { option_id: "library", text: "文献检索与自习", is_correct: false },
      { option_id: "dining", text: "餐饮消费与生活服务", is_correct: false },
    ],
    success_text: "答题通过，体育学院已发现。",
    failure_text: "提示：这里连接多个运动场馆，是校园运动空间的重要节点。",
  },
};

const POI_RULES = POI_FEATURES.map((poi) => ({
  poi_id: poi.id,
  name: poi.name,
  type: poi.type,
  description: poi.description || "校园探索地标。",
  knowledge: POI_KNOWLEDGE_MAP[poi.id] || poi.knowledge || "到达该地标后会记录到图鉴与探索进度中。",
  unlock_mode: POI_QUIZ_CONFIG_MAP[poi.id] ? "quiz" : (poi.unlock_mode || "touch"),
  trigger_radius: Math.max(poi.radius || 20, 24),
  trigger_points: Array.isArray(poi.triggerPoints) && poi.triggerPoints.length
    ? poi.triggerPoints
    : [{ latitude: poi.latitude, longitude: poi.longitude }],
  quiz: POI_QUIZ_CONFIG_MAP[poi.id] || poi.quiz || null,
}));

function getPoiPoint(poiId) {
  const poi = POI_FEATURES.find((feature) => feature.id === poiId);
  return poi ? { latitude: poi.latitude, longitude: poi.longitude } : null;
}

function createRouteRule({ route_id, name, description, complete_ratio, poi_ids }) {
  return {
    route_id,
    name,
    description,
    complete_ratio,
    poi_ids,
    path: poi_ids.map(getPoiPoint).filter(Boolean),
  };
}

const ROUTE_RULES = [
  createRouteRule({
    route_id: "route-central-landmarks",
    name: "中轴地标线",
    description: "从宝琛广场串联教学区、图书馆与星雨湖，适合快速熟悉校园核心区。",
    complete_ratio: 0.65,
    poi_ids: [
      "poi-baochen-plaza",
      "poi-duxing-building",
      "poi-teaching-buildings",
      "poi-library",
      "poi-xingyu-lake",
    ],
  }),
  createRouteRule({
    route_id: "route-study-loop",
    name: "学习楼宇环线",
    description: "覆盖理工、人文、艺术与公共教学楼群，适合按学院楼宇打卡。",
    complete_ratio: 0.6,
    poi_ids: [
      "poi-science-engineering-buildings",
      "poi-teaching-buildings",
      "poi-zhiming-building",
      "poi-humanities-buildings",
      "poi-art-college",
      "poi-music-college",
    ],
  }),
  createRouteRule({
    route_id: "route-sports-energy",
    name: "运动活力线",
    description: "串联体育学院、游泳馆与田径场，适合测试运动场馆周边探索。",
    complete_ratio: 0.6,
    poi_ids: [
      "poi-sports-college",
      "poi-indoor-track",
      "poi-south-track",
      "poi-indoor-pool",
      "poi-outdoor-pool",
      "poi-east-track",
    ],
  }),
  createRouteRule({
    route_id: "route-life-canteen",
    name: "生活补给线",
    description: "连接宿舍楼群与食堂，覆盖日常生活高频区域。",
    complete_ratio: 0.6,
    poi_ids: [
      "poi-rongyuan-dorm",
      "poi-huaxiangyuan-canteen",
      "poi-cuizhuyuan-canteen",
      "poi-guiyuan-dorm",
      "poi-jiashuyuan-canteen",
      "poi-lanyuan-dorm",
    ],
  }),
  createRouteRule({
    route_id: "route-north-culture",
    name: "北区文化街线",
    description: "围绕文化街、校医院与北区宿舍生活圈展开，适合北侧区域探索。",
    complete_ratio: 0.6,
    poi_ids: [
      "poi-culture-street",
      "poi-culture-street-canteen",
      "poi-clinic",
      "poi-liyuan-dorm",
      "poi-taoyuan-dorm",
      "poi-new-liyuan-dorm",
    ],
  }),
].filter((routeRule) => routeRule.path.length >= 2);

const ACHIEVEMENT_RULES = [
  {
    achievement_id: "grid-first-step",
    name: "校园第一格",
    description: "点亮第一片校园空间。",
    category: "grid",
    type: "grid_count",
    required_count: 1,
    sort_order: 10,
  },
  {
    achievement_id: "grid-hundred",
    name: "百格起跑",
    description: "累计点亮 100 个探索网格。",
    category: "grid",
    type: "grid_count",
    required_count: 100,
    sort_order: 20,
  },
  {
    achievement_id: "grid-five-hundred",
    name: "小有版图",
    description: "累计点亮 500 个探索网格。",
    category: "grid",
    type: "grid_count",
    required_count: 500,
    sort_order: 30,
  },
  {
    achievement_id: "grid-thousand",
    name: "千格巡游",
    description: "累计点亮 1000 个探索网格。",
    category: "grid",
    type: "grid_count",
    required_count: 1000,
    sort_order: 40,
  },
  {
    achievement_id: "grid-three-thousand",
    name: "三千步幅",
    description: "累计点亮 3000 个探索网格。",
    category: "grid",
    type: "grid_count",
    required_count: 3000,
    sort_order: 50,
  },
  {
    achievement_id: "grid-five-thousand",
    name: "半校行迹",
    description: "累计点亮 5000 个探索网格。",
    category: "grid",
    type: "grid_count",
    required_count: 5000,
    sort_order: 60,
  },
  {
    achievement_id: "grid-ten-thousand",
    name: "旗山漫游家",
    description: "累计点亮 10000 个探索网格。",
    category: "grid",
    type: "grid_count",
    required_count: 10000,
    sort_order: 70,
  },
  {
    achievement_id: "poi-first",
    name: "遇见校园",
    description: "发现第一个校园地标。",
    category: "poi",
    type: "poi_count",
    required_count: 1,
    sort_order: 110,
  },
  {
    achievement_id: "poi-first-three",
    name: "初识旗山",
    description: "累计发现 3 个校园地标。",
    category: "poi",
    type: "poi_count",
    required_count: 3,
    sort_order: 120,
  },
  {
    achievement_id: "poi-five",
    name: "地标熟人",
    description: "累计发现 5 个校园地标。",
    category: "poi",
    type: "poi_count",
    required_count: 5,
    sort_order: 130,
  },
  {
    achievement_id: "poi-eight",
    name: "旗山探访者",
    description: "累计发现 8 个校园地标。",
    category: "poi",
    type: "poi_count",
    required_count: 8,
    sort_order: 140,
  },
  {
    achievement_id: "poi-twelve",
    name: "地标观察员",
    description: "累计发现 12 个校园地标。",
    category: "poi",
    type: "poi_count",
    required_count: 12,
    sort_order: 150,
  },
  {
    achievement_id: "poi-twenty",
    name: "校园通识者",
    description: "累计发现 20 个校园地标。",
    category: "poi",
    type: "poi_count",
    required_count: 20,
    sort_order: 160,
  },
  {
    achievement_id: "poi-thirty",
    name: "图鉴收藏家",
    description: "累计发现 30 个校园地标。",
    category: "poi",
    type: "poi_count",
    required_count: 30,
    sort_order: 170,
  },
  {
    achievement_id: "all-poi",
    name: "全图鉴探索",
    description: "发现当前全部校园地标。",
    category: "poi",
    type: "poi_collection",
    required_poi_ids: POI_FEATURES.map((poi) => poi.id),
    sort_order: 180,
  },
  {
    achievement_id: "route-first",
    name: "路线初达",
    description: "完成第一条校园探索路线。",
    category: "route",
    type: "route_count",
    required_count: 1,
    sort_order: 210,
  },
  {
    achievement_id: "route-three",
    name: "路线成网",
    description: "累计完成 3 条校园探索路线。",
    category: "route",
    type: "route_count",
    required_count: 3,
    sort_order: 215,
  },
  {
    achievement_id: "route-all",
    name: "全线贯通",
    description: "完成当前全部校园探索路线。",
    category: "route",
    type: "route_count",
    required_count: ROUTE_RULES.length,
    sort_order: 218,
  },
  {
    achievement_id: "route-central-landmarks",
    name: "核心区巡礼",
    description: "完成中轴地标线。",
    category: "route",
    type: "route_completion",
    route_id: "route-central-landmarks",
    sort_order: 220,
  },
  {
    achievement_id: "route-sports-energy",
    name: "运动场漫游",
    description: "完成运动活力线。",
    category: "route",
    type: "route_completion",
    route_id: "route-sports-energy",
    sort_order: 230,
  },
  {
    achievement_id: "route-life-canteen",
    name: "生活圈熟人",
    description: "完成生活补给线。",
    category: "route",
    type: "route_completion",
    route_id: "route-life-canteen",
    sort_order: 240,
  },
  {
    achievement_id: "route-study-loop",
    name: "学楼巡访",
    description: "完成学习楼宇环线。",
    category: "route",
    type: "route_completion",
    route_id: "route-study-loop",
    sort_order: 250,
  },
  {
    achievement_id: "route-north-culture",
    name: "北区烟火",
    description: "完成北区文化街线。",
    category: "route",
    type: "route_completion",
    route_id: "route-north-culture",
    sort_order: 260,
  },
];

const BUILDING_UNREACHABLE_AREAS = BUILDING_FEATURES
  .filter((building) => !building.walkable)
  .map((building) => ({
    id: `area-${building.id}`,
    name: building.name,
    type: "building",
    points: building.points,
    bounds: building.bounds,
  }));

const OPEN_SPACE_UNREACHABLE_AREAS = OPEN_SPACE_FEATURES
  .filter((space) => !space.walkable)
  .map((space) => ({
    id: `area-${space.id}`,
    name: space.name,
    type: space.type || "open_space",
    points: space.points,
    bounds: space.bounds,
  }));

const UNREACHABLE_AREAS = MANUAL_UNREACHABLE_AREAS
  .concat(BUILDING_UNREACHABLE_AREAS)
  .concat(OPEN_SPACE_UNREACHABLE_AREAS);

function createGridIdSet(gridIds) {
  return new Set(gridIds);
}

function collectUnreachableGridIds() {
  const gridIds = [];

  GRID_FEATURES.forEach((grid) => {
    const isUnreachable = UNREACHABLE_AREAS.some((area) => {
      if (area.bounds && !doBoundsIntersect(grid.bounds, area.bounds)) {
        return false;
      }

      return isPointInPolygon(grid.center, area.points);
    });
    if (isUnreachable) {
      gridIds.push(grid.id);
    }
  });

  return gridIds;
}

function getPoiTriggerPoints(poiRule, poi) {
  if (Array.isArray(poiRule.trigger_points) && poiRule.trigger_points.length) {
    return poiRule.trigger_points;
  }

  return Array.isArray(poi.triggerPoints) && poi.triggerPoints.length
    ? poi.triggerPoints
    : [poi];
}

function getMinimumDistanceToPoi(grid, triggerPoints) {
  return triggerPoints.reduce((minDistance, triggerPoint) => {
    return Math.min(minDistance, getDistanceInMeters(grid.center, triggerPoint));
  }, Infinity);
}

function collectPoiGridIds(poiRule) {
  const poi = POI_FEATURES.find((feature) => feature.id === poiRule.poi_id);
  if (!poi) {
    return [];
  }

  const triggerPoints = getPoiTriggerPoints(poiRule, poi);
  const reachableGridIds = GRID_FEATURES
    .map((grid) => ({
      id: grid.id,
      distance: getMinimumDistanceToPoi(grid, triggerPoints),
    }))
    .filter((grid) => grid.distance <= poiRule.trigger_radius)
    .filter((grid) => !UNREACHABLE_GRID_ID_SET.has(grid.id))
    .map((grid) => grid.id);
  if (reachableGridIds.length) {
    return reachableGridIds;
  }

  return GRID_FEATURES
    .filter((grid) => !UNREACHABLE_GRID_ID_SET.has(grid.id))
    .map((grid) => ({
      id: grid.id,
      distance: getMinimumDistanceToPoi(grid, triggerPoints),
    }))
    .filter((grid) => grid.distance <= POI_REACHABLE_FALLBACK_RADIUS_METERS)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, POI_REACHABLE_FALLBACK_GRID_LIMIT)
    .map((grid) => grid.id);
}

function collectRouteGridIds(routeRule) {
  const routeGridIds = new Set();

  for (let index = 1; index < routeRule.path.length; index += 1) {
    const startPoint = routeRule.path[index - 1];
    const endPoint = routeRule.path[index];
    GRID_FEATURES
      .filter((grid) => doesSegmentIntersectPolygon(startPoint, endPoint, grid.points))
      .forEach((grid) => routeGridIds.add(grid.id));
  }

  return Array.from(routeGridIds);
}

function createGridIdMap(groups, idFieldName) {
  return (Array.isArray(groups) ? groups : []).reduce((map, group) => {
    if (group && group[idFieldName] && Array.isArray(group.grid_ids)) {
      map[group[idFieldName]] = group.grid_ids;
    }
    return map;
  }, {});
}

const GENERATED_POI_GRID_ID_MAP = createGridIdMap(GENERATED_GRID_DATA.poi_grid_groups, "poi_id");
const GENERATED_ROUTE_GRID_ID_MAP = createGridIdMap(GENERATED_GRID_DATA.route_grid_groups, "route_id");
const UNREACHABLE_GRID_IDS = Array.isArray(GENERATED_GRID_DATA.unreachable_grid_ids)
  ? GENERATED_GRID_DATA.unreachable_grid_ids
  : [];
const UNREACHABLE_GRID_ID_SET = createGridIdSet(UNREACHABLE_GRID_IDS);
const REACHABLE_GRID_COUNT = GRID_FEATURES.length - UNREACHABLE_GRID_IDS.length;

const POI_GRID_GROUPS = POI_RULES.map((rule) => ({
  ...rule,
  grid_ids: GENERATED_POI_GRID_ID_MAP[rule.poi_id] || [],
}));
const ROUTE_GRID_GROUPS = ROUTE_RULES.map((rule) => ({
  ...rule,
  grid_ids: (GENERATED_ROUTE_GRID_ID_MAP[rule.route_id] || [])
    .filter((gridId) => !UNREACHABLE_GRID_ID_SET.has(gridId)),
})).filter((routeRule) => routeRule.grid_ids.length > 0);

function getPoiRuleByGridId(gridId, visitedPoiIdSet) {
  return POI_GRID_GROUPS.find((poiRule) => {
    if (visitedPoiIdSet.has(poiRule.poi_id)) {
      return false;
    }

    return poiRule.grid_ids.indexOf(gridId) !== -1;
  }) || null;
}

function evaluateRouteCompletions(litGridIdSet, completedRouteIdSet) {
  return ROUTE_GRID_GROUPS
    .map((routeRule) => {
      const litCount = routeRule.grid_ids.filter((gridId) => litGridIdSet.has(gridId)).length;
      const ratio = routeRule.grid_ids.length ? litCount / routeRule.grid_ids.length : 0;
      return {
        ...routeRule,
        lit_count: litCount,
        complete_ratio_value: ratio,
      };
    })
    .filter((routeRule) => !completedRouteIdSet.has(routeRule.route_id))
    .filter((routeRule) => routeRule.complete_ratio_value >= routeRule.complete_ratio);
}

function evaluateAchievements({ litGridIdSet, visitedPoiIdSet, completedRouteIdSet, earnedAchievementIdSet }) {
  const safeLitGridIdSet = litGridIdSet || new Set();
  const safeVisitedPoiIdSet = visitedPoiIdSet || new Set();
  const safeCompletedRouteIdSet = completedRouteIdSet || new Set();
  const safeEarnedAchievementIdSet = earnedAchievementIdSet || new Set();

  return ACHIEVEMENT_RULES.filter((rule) => {
    if (safeEarnedAchievementIdSet.has(rule.achievement_id)) {
      return false;
    }

    if (rule.type === "grid_count") {
      return safeLitGridIdSet.size >= rule.required_count;
    }

    if (rule.type === "route_count") {
      return safeCompletedRouteIdSet.size >= rule.required_count;
    }

    if (rule.type === "route_completion") {
      return safeCompletedRouteIdSet.has(rule.route_id);
    }

    if (rule.type === "poi_count") {
      return safeVisitedPoiIdSet.size >= rule.required_count;
    }

    if (rule.type === "poi_collection") {
      return rule.required_poi_ids.every((poiId) => safeVisitedPoiIdSet.has(poiId));
    }

    return false;
  });
}

function isAchievementRuleComplete(rule, { litGridIdSet, visitedPoiIdSet, completedRouteIdSet }) {
  const safeLitGridIdSet = litGridIdSet || new Set();
  const safeVisitedPoiIdSet = visitedPoiIdSet || new Set();
  const safeCompletedRouteIdSet = completedRouteIdSet || new Set();

  if (rule.type === "grid_count") {
    return safeLitGridIdSet.size >= rule.required_count;
  }

  if (rule.type === "route_count") {
    return safeCompletedRouteIdSet.size >= rule.required_count;
  }

  if (rule.type === "route_completion") {
    return safeCompletedRouteIdSet.has(rule.route_id);
  }

  if (rule.type === "poi_count") {
    return safeVisitedPoiIdSet.size >= rule.required_count;
  }

  if (rule.type === "poi_collection") {
    return rule.required_poi_ids.every((poiId) => safeVisitedPoiIdSet.has(poiId));
  }

  return false;
}

function getAchievementRuleProgress(rule, { litGridIdSet, visitedPoiIdSet, completedRouteIdSet }) {
  const safeLitGridIdSet = litGridIdSet || new Set();
  const safeVisitedPoiIdSet = visitedPoiIdSet || new Set();
  const safeCompletedRouteIdSet = completedRouteIdSet || new Set();

  if (rule.type === "grid_count") {
    return {
      current: Math.min(safeLitGridIdSet.size, rule.required_count),
      target: rule.required_count,
      unit: "格",
    };
  }

  if (rule.type === "route_count") {
    return {
      current: Math.min(safeCompletedRouteIdSet.size, rule.required_count),
      target: rule.required_count,
      unit: "条路线",
    };
  }

  if (rule.type === "route_completion") {
    return {
      current: safeCompletedRouteIdSet.has(rule.route_id) ? 1 : 0,
      target: 1,
      unit: "条路线",
    };
  }

  if (rule.type === "poi_count") {
    return {
      current: Math.min(safeVisitedPoiIdSet.size, rule.required_count),
      target: rule.required_count,
      unit: "个地标",
    };
  }

  if (rule.type === "poi_collection") {
    const requiredPoiIds = Array.isArray(rule.required_poi_ids) ? rule.required_poi_ids : [];
    return {
      current: requiredPoiIds.filter((poiId) => safeVisitedPoiIdSet.has(poiId)).length,
      target: requiredPoiIds.length,
      unit: "个地标",
    };
  }

  return {
    current: 0,
    target: 1,
    unit: "",
  };
}

function getRuntimeItems(runtimeConfigCache, configKey) {
  const config = runtimeConfigCache &&
    runtimeConfigCache.data &&
    runtimeConfigCache.data[configKey];
  return config && Array.isArray(config.items) ? config.items : [];
}

function applyRouteRuntimeConfig(routeRules, runtimeConfigCache) {
  const runtimeRoutes = getRuntimeItems(runtimeConfigCache, "route");
  return (Array.isArray(routeRules) ? routeRules : []).map((routeRule) => {
    const cloudRoute = runtimeRoutes.find((item) => item && item.route_id === routeRule.route_id);
    if (!cloudRoute) {
      return routeRule;
    }
    return {
      ...routeRule,
      name: cloudRoute.name || routeRule.name,
      description: cloudRoute.description || routeRule.description || "",
      complete_ratio: typeof cloudRoute.complete_ratio === "number"
        ? cloudRoute.complete_ratio
        : routeRule.complete_ratio,
    };
  });
}

function applyAchievementRuntimeConfig(achievementRules, runtimeConfigCache) {
  const runtimeAchievements = getRuntimeItems(runtimeConfigCache, "achievement");
  return (Array.isArray(achievementRules) ? achievementRules : []).map((achievementRule) => {
    const cloudAchievement = runtimeAchievements.find((item) => {
      return item && item.achievement_id === achievementRule.achievement_id;
    });
    if (!cloudAchievement) {
      return achievementRule;
    }
    return {
      ...achievementRule,
      name: cloudAchievement.name || achievementRule.name,
      description: cloudAchievement.description || achievementRule.description,
      category: cloudAchievement.category || achievementRule.category,
      sort_order: typeof cloudAchievement.sort_order === "number"
        ? cloudAchievement.sort_order
        : achievementRule.sort_order,
    };
  });
}

module.exports = {
  ACHIEVEMENT_RULES,
  BUILDING_UNREACHABLE_AREAS,
  MANUAL_UNREACHABLE_AREAS,
  OPEN_SPACE_UNREACHABLE_AREAS,
  POI_KNOWLEDGE_MAP,
  POI_GRID_GROUPS,
  REACHABLE_GRID_COUNT,
  ROUTE_GRID_GROUPS,
  UNREACHABLE_AREAS,
  UNREACHABLE_GRID_ID_SET,
  UNREACHABLE_GRID_IDS,
  applyAchievementRuntimeConfig,
  applyRouteRuntimeConfig,
  evaluateAchievements,
  evaluateRouteCompletions,
  getAchievementRuleProgress,
  isAchievementRuleComplete,
  getPoiRuleByGridId,
};
