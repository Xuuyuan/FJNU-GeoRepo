const { getPoiRuleByGridId } = require("../data/game-config");

function getPoiRuntimeItems(runtimeConfigCache) {
  const poiConfig = runtimeConfigCache &&
    runtimeConfigCache.data &&
    runtimeConfigCache.data.poi;
  return poiConfig && Array.isArray(poiConfig.items) ? poiConfig.items : [];
}

function mergeQuizText(localQuiz, cloudQuiz) {
  if (!localQuiz || !cloudQuiz || typeof cloudQuiz !== "object") {
    return localQuiz;
  }

  return {
    ...localQuiz,
    question: cloudQuiz.question || localQuiz.question,
    options: Array.isArray(cloudQuiz.options) && cloudQuiz.options.length >= 2
      ? cloudQuiz.options
      : localQuiz.options,
    success_text: cloudQuiz.success_text || localQuiz.success_text,
    failure_text: cloudQuiz.failure_text || localQuiz.failure_text,
  };
}

function mergeTextValue(localValue, cloudValue) {
  return typeof cloudValue === "string" && cloudValue.trim() ? cloudValue : localValue;
}

function applyPoiRuntimeConfig(poiRule, runtimeConfigCache) {
  if (!poiRule) {
    return null;
  }

  const cloudPoi = getPoiRuntimeItems(runtimeConfigCache)
    .find((item) => item && item.poi_id === poiRule.poi_id);
  if (!cloudPoi) {
    return poiRule;
  }

  return {
    ...poiRule,
    name: cloudPoi.name || poiRule.name,
    type: cloudPoi.type || poiRule.type,
    description: mergeTextValue(poiRule.description, cloudPoi.description),
    knowledge: mergeTextValue(poiRule.knowledge, cloudPoi.knowledge),
    unlock_mode: cloudPoi.unlock_mode || poiRule.unlock_mode,
    quiz: mergeQuizText(poiRule.quiz, cloudPoi.quiz),
  };
}

function findDiscoverablePoiRule(gridIds, visitedPoiIdSet) {
  const candidateGridIds = Array.isArray(gridIds) ? gridIds : [];

  for (let index = 0; index < candidateGridIds.length; index += 1) {
    const poiRule = getPoiRuleByGridId(candidateGridIds[index], visitedPoiIdSet);
    if (poiRule) {
      return poiRule;
    }
  }

  return null;
}

function isQuizPoi(poiRule) {
  return Boolean(poiRule && poiRule.unlock_mode === "quiz");
}

function getQuizConfig(poiRule) {
  if (!isQuizPoi(poiRule) || !poiRule.quiz) {
    return null;
  }

  const options = Array.isArray(poiRule.quiz.options) ? poiRule.quiz.options : [];
  return {
    question: poiRule.quiz.question || "",
    options: options.map((option) => ({
      ...option,
      label: option.label || option.text || "",
    })),
    successText: poiRule.quiz.success_text || "答题通过，地标已发现",
    failureText: poiRule.quiz.failure_text || "答题未通过，稍后可再试",
  };
}

function resolveQuizAnswer(poiRule, selectedOptionId) {
  const quiz = getQuizConfig(poiRule);
  if (!quiz) {
    return {
      passed: false,
      selectedOption: null,
      correctOption: null,
      successText: "",
      failureText: "",
    };
  }

  const selectedOption = quiz.options.find((option) => option.option_id === selectedOptionId) || null;
  const correctOption = quiz.options.find((option) => option.is_correct) || null;

  return {
    passed: Boolean(selectedOption && selectedOption.is_correct),
    selectedOption,
    correctOption,
    successText: quiz.successText,
    failureText: quiz.failureText,
  };
}

function buildPoiSyncRecord(poiRule, triggerTime = new Date()) {
  return {
    poi_id: poiRule.poi_id,
    poi_name: poiRule.name,
    poi_type: poiRule.unlock_mode || "",
    poi_category: poiRule.type || "",
    description: poiRule.description || "",
    knowledge: poiRule.knowledge || "",
    trigger_time: triggerTime.toISOString(),
  };
}

function createPoiDiscovery({ poiRule, visitedPoiIdSet, sessionRuntime, pendingPoiSyncMap, trackSessionPoiDiscovery }) {
  if (!poiRule || visitedPoiIdSet.has(poiRule.poi_id)) {
    return null;
  }

  visitedPoiIdSet.add(poiRule.poi_id);
  trackSessionPoiDiscovery(sessionRuntime, poiRule.poi_id, poiRule.name);
  pendingPoiSyncMap[poiRule.poi_id] = buildPoiSyncRecord(poiRule);

  return {
    id: poiRule.poi_id,
    name: poiRule.name,
    knowledge: poiRule.knowledge || "",
  };
}

module.exports = {
  applyPoiRuntimeConfig,
  buildPoiSyncRecord,
  createPoiDiscovery,
  findDiscoverablePoiRule,
  getQuizConfig,
  isQuizPoi,
  resolveQuizAnswer,
};
