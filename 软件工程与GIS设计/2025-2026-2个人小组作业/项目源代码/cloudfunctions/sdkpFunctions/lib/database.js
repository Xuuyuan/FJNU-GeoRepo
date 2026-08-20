const { db } = require("./cloud-context");

function stripReservedFields(data) {
  const nextData = {
    ...(data || {}),
  };
  delete nextData._id;
  return nextData;
}

function setDocument(collectionName, documentId, data) {
  return db.collection(collectionName).doc(documentId).set({
    data: stripReservedFields(data),
  });
}

function setDocuments(collectionName, documents) {
  const safeDocuments = Array.isArray(documents) ? documents : [];
  return Promise.all(safeDocuments.map((document) => {
    return setDocument(collectionName, document.id, document.data);
  }));
}

async function removeDocument(collectionName, documentId) {
  const document = db.collection(collectionName).doc(documentId);
  if (typeof document.remove === "function") {
    return document.remove();
  }
  if (typeof document.delete === "function") {
    return document.delete();
  }
  return null;
}

function getRemovedCount(result) {
  if (result && result.stats && typeof result.stats.removed === "number") {
    return result.stats.removed;
  }
  if (result && typeof result.deleted === "number") {
    return result.deleted;
  }
  if (result && typeof result.removed === "number") {
    return result.removed;
  }
  return 0;
}

async function removeRecordsInChunks(collectionName, records, chunkSize = 20) {
  for (let index = 0; index < records.length; index += chunkSize) {
    const chunk = records.slice(index, index + chunkSize);
    await Promise.all(chunk.map((record) => removeDocument(collectionName, record._id)));
  }
}

async function removeDocumentsByUserId(collectionName, userId, limit = 100) {
  const collection = db.collection(collectionName);
  const query = collection.where({
    user_id: userId,
  });

  if (typeof query.remove === "function") {
    const result = await query.remove();
    return getRemovedCount(result);
  }

  let removedCount = 0;
  let hasMore = true;
  while (hasMore) {
    const result = await collection
      .where({
        user_id: userId,
      })
      .limit(limit)
      .get();
    const records = Array.isArray(result.data) ? result.data : [];
    if (!records.length) {
      hasMore = false;
      continue;
    }

    await removeRecordsInChunks(collectionName, records);
    removedCount += records.length;
    hasMore = records.length >= limit;
  }

  return removedCount;
}

module.exports = {
  getRemovedCount,
  removeDocument,
  removeDocumentsByUserId,
  setDocument,
  setDocuments,
  stripReservedFields,
};
