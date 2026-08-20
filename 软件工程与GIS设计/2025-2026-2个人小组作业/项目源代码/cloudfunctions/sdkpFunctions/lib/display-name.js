const TITLE_POOL = [
  "旗山探路者",
  "校园漫游者",
  "湖畔记录员",
  "地标收集家",
  "路线观察员",
  "榕荫行者",
  "晨光探索者",
  "书香巡游者",
];

function hashText(text) {
  return `${text || ""}`.split("").reduce((hash, char) => {
    return ((hash * 31) + char.charCodeAt(0)) >>> 0;
  }, 0);
}

function getShortCode(userId) {
  const normalized = `${userId || ""}`.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (normalized.length >= 4) {
    return normalized.slice(-4);
  }

  const hash = hashText(userId).toString(36).toUpperCase();
  return hash.slice(-4).padStart(4, "0");
}

function createAnonymousDisplayName(userId) {
  const hash = hashText(userId);
  const title = TITLE_POOL[hash % TITLE_POOL.length];
  return `${title} ${getShortCode(userId)}`;
}

function isGeneratedPlaceholder(name) {
  return !name || name === "校园探索者";
}

function resolveDisplayName({ userId, nickName, existingNickName }) {
  const safeNickName = typeof nickName === "string" ? nickName.trim() : "";
  const safeExistingNickName = typeof existingNickName === "string" ? existingNickName.trim() : "";

  if (!isGeneratedPlaceholder(safeNickName)) {
    return safeNickName;
  }

  if (!isGeneratedPlaceholder(safeExistingNickName)) {
    return safeExistingNickName;
  }

  return createAnonymousDisplayName(userId);
}

module.exports = {
  createAnonymousDisplayName,
  resolveDisplayName,
};
