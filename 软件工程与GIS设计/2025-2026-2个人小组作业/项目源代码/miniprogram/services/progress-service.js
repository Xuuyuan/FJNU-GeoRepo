const LEVEL_RULES = [
  { level: 1, name: "新手探路者", minScore: 0 },
  { level: 2, name: "校园熟客", minScore: 120 },
  { level: 3, name: "旗山行者", minScore: 320 },
  { level: 4, name: "空间探索家", minScore: 720 },
  { level: 5, name: "校园全景师", minScore: 1500 },
];

const SCORE_RULE = {
  grid: 1,
  poi: 25,
  route: 80,
  achievement: 60,
};

function clampCount(value) {
  return Math.max(0, Number(value) || 0);
}

function calculateScore({ gridCount = 0, poiCount = 0, routeCount = 0, achievementCount = 0 } = {}) {
  return clampCount(gridCount) * SCORE_RULE.grid +
    clampCount(poiCount) * SCORE_RULE.poi +
    clampCount(routeCount) * SCORE_RULE.route +
    clampCount(achievementCount) * SCORE_RULE.achievement;
}

function getLevelByScore(score) {
  const safeScore = clampCount(score);
  return LEVEL_RULES.reduce((matched, rule) => {
    return safeScore >= rule.minScore ? rule : matched;
  }, LEVEL_RULES[0]);
}

function getNextLevel(currentLevel) {
  const currentIndex = LEVEL_RULES.findIndex((rule) => rule.level === currentLevel.level);
  return currentIndex >= 0 && currentIndex < LEVEL_RULES.length - 1
    ? LEVEL_RULES[currentIndex + 1]
    : null;
}

function createUserStats({
  gridCount = 0,
  totalGridCount = 0,
  poiCount = 0,
  totalPoiCount = 0,
  routeCount = 0,
  achievementCount = 0,
  totalAchievementCount = 0,
} = {}) {
  const score = calculateScore({ gridCount, poiCount, routeCount, achievementCount });
  const level = getLevelByScore(score);
  const nextLevel = getNextLevel(level);
  const levelProgressPercent = nextLevel
    ? Math.min(100, Math.round(((score - level.minScore) / (nextLevel.minScore - level.minScore)) * 100))
    : 100;

  return {
    score,
    level: level.level,
    levelName: level.name,
    nextLevelName: nextLevel ? nextLevel.name : "已满级",
    nextLevelScore: nextLevel ? nextLevel.minScore : score,
    levelProgressPercent,
    gridCount: clampCount(gridCount),
    totalGridCount: clampCount(totalGridCount),
    poiCount: clampCount(poiCount),
    totalPoiCount: clampCount(totalPoiCount),
    routeCount: clampCount(routeCount),
    achievementCount: clampCount(achievementCount),
    totalAchievementCount: clampCount(totalAchievementCount),
  };
}

module.exports = {
  LEVEL_RULES,
  SCORE_RULE,
  calculateScore,
  createUserStats,
  getLevelByScore,
};
