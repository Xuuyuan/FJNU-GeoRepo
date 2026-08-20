const { cloud, db } = require("../lib/cloud-context");
const { ensureCollections } = require("../lib/collections");
const { setDocuments } = require("../lib/database");
const { FUNCTION_VERSION } = require("../lib/version");

async function syncGridStatus(event) {
  const context = cloud.getWXContext();
  const openid = context.OPENID;
  const grids = Array.isArray(event.data && event.data.grids) ? event.data.grids : [];
  const writtenGridIds = new Set();
  const gridDocuments = [];
  let skippedCount = 0;

  await ensureCollections();

  for (const grid of grids) {
    const gridId = grid.grid_id;
    if (!gridId || writtenGridIds.has(gridId)) {
      skippedCount += 1;
      continue;
    }

    gridDocuments.push({
      id: `${openid}_${gridId}`,
      data: {
        user_id: openid,
        grid_id: gridId,
        unlock_time: grid.unlock_time || db.serverDate(),
      },
    });
    writtenGridIds.add(gridId);
  }

  await setDocuments("gridstatus", gridDocuments);

  return {
    success: true,
    function_version: FUNCTION_VERSION,
    count: writtenGridIds.size,
    skipped_count: skippedCount,
  };
}

module.exports = {
  syncGridStatus,
};
