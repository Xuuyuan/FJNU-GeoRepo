const { cloud, db } = require("../lib/cloud-context");
const { ensureCollections } = require("../lib/collections");
const { setDocument, setDocuments } = require("../lib/database");
const { FUNCTION_VERSION } = require("../lib/version");

async function syncPoiRecords(event) {
  const context = cloud.getWXContext();
  const openid = context.OPENID;
  const records = Array.isArray(event.data && event.data.records) ? event.data.records : [];
  const writtenPoiIds = new Set();
  const poiDocuments = [];
  let skippedCount = 0;

  await ensureCollections();

  for (const record of records) {
    const poiId = record.poi_id;
    if (!poiId || writtenPoiIds.has(poiId)) {
      skippedCount += 1;
      continue;
    }

    poiDocuments.push({
      id: `${openid}_${poiId}`,
      data: {
        user_id: openid,
        poi_id: poiId,
        poi_name: record.poi_name || "",
        poi_type: record.poi_type || "",
        poi_category: record.poi_category || "",
        description: record.description || "",
        trigger_time: record.trigger_time || db.serverDate(),
        updated_at: db.serverDate(),
      },
    });
    writtenPoiIds.add(poiId);
  }

  await setDocuments("poi_records", poiDocuments);

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    count: writtenPoiIds.size,
    skipped_count: skippedCount,
  };
}

async function submitPoiQuiz(event) {
  const context = cloud.getWXContext();
  const openid = context.OPENID;
  const payload = event.data || {};
  const poiId = payload.poi_id;
  const passed = Boolean(payload.passed);

  await ensureCollections();

  if (!poiId) {
    return {
      success: false,
      function_version: FUNCTION_VERSION,
      message: "missing-poi-id",
    };
  }

  const quizRecord = {
    user_id: openid,
    poi_id: poiId,
    poi_name: payload.poi_name || "",
    poi_type: "quiz",
    poi_category: payload.poi_category || "",
    description: payload.description || "",
    quiz_question: payload.quiz_question || "",
    selected_option_id: payload.selected_option_id || "",
    passed,
    trigger_time: payload.trigger_time || db.serverDate(),
    updated_at: db.serverDate(),
  };

  if (passed) {
    await setDocument("poi_records", `${openid}_${poiId}`, quizRecord);
  }

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    passed,
    poi_id: poiId,
  };
}

module.exports = {
  submitPoiQuiz,
  syncPoiRecords,
};
