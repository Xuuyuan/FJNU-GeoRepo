const { db } = require("./cloud-context");

const COLLECTION_NAMES = [
  "userinfo",
  "gridstatus",
  "track_sessions",
  "poi_records",
  "route_records",
  "achievement_records",
  "runtime_config",
  "poi_config",
  "route_config",
  "achievement_config",
];

async function ensureCollections(collectionNames = COLLECTION_NAMES) {
  const names = Array.isArray(collectionNames) && collectionNames.length
    ? collectionNames
    : COLLECTION_NAMES;

  for (const collectionName of names) {
    try {
      await db.createCollection(collectionName);
    } catch (error) {
      if (!String(error && error.errMsg ? error.errMsg : error).includes("already exists")) {
        continue;
      }
    }
  }
}

module.exports = {
  COLLECTION_NAMES,
  ensureCollections,
};
