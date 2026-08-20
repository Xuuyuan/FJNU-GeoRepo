const { db } = require("../lib/cloud-context");
const { ensureCollections } = require("../lib/collections");
const { FUNCTION_VERSION } = require("../lib/version");

const CONFIG_DOC_ID = "current";

async function getConfigDoc(collectionName) {
  const result = await db.collection(collectionName).doc(CONFIG_DOC_ID).get().catch(() => null);
  if (!result || !result.data) {
    return null;
  }

  return result.data;
}

async function getRuntimeConfig() {
  await ensureCollections();

  const [runtime, poi, route, achievement] = await Promise.all([
    getConfigDoc("runtime_config"),
    getConfigDoc("poi_config"),
    getConfigDoc("route_config"),
    getConfigDoc("achievement_config"),
  ]);
  const hasCloudConfig = Boolean(runtime || poi || route || achievement);

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    source: hasCloudConfig ? "cloud" : "local-fallback",
    config_doc_id: CONFIG_DOC_ID,
    data: {
      runtime,
      poi,
      route,
      achievement,
    },
  };
}

module.exports = {
  getRuntimeConfig,
};
