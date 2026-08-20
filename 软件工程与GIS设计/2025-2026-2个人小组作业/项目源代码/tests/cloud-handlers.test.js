const assert = require("assert");
const path = require("path");

const FUNCTION_ROOT = path.join(__dirname, "..", "cloudfunctions", "sdkpFunctions");
const CONTEXT_PATH = path.join(FUNCTION_ROOT, "lib", "cloud-context.js");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createCloudMock(initialStore = {}) {
  const store = {};
  Object.keys(initialStore).forEach((collectionName) => {
    store[collectionName] = {};
    Object.keys(initialStore[collectionName]).forEach((documentId) => {
      store[collectionName][documentId] = clone(initialStore[collectionName][documentId]);
    });
  });
  const createdCollections = [];

  function getCollectionStore(collectionName) {
    if (!store[collectionName]) {
      store[collectionName] = {};
    }
    return store[collectionName];
  }

  const db = {
    createCollection(collectionName) {
      createdCollections.push(collectionName);
      getCollectionStore(collectionName);
      return Promise.resolve({});
    },
    serverDate() {
      return { $date: "SERVER_DATE" };
    },
    collection(collectionName) {
      return {
        doc(documentId) {
          return {
            get() {
              const collectionStore = getCollectionStore(collectionName);
              if (!collectionStore[documentId]) {
                return Promise.reject(new Error("document not found"));
              }

              return Promise.resolve({
                data: {
                  _id: documentId,
                  ...clone(collectionStore[documentId]),
                },
              });
            },
            set({ data }) {
              const collectionStore = getCollectionStore(collectionName);
              collectionStore[documentId] = clone(data);
              return Promise.resolve({});
            },
            remove() {
              const collectionStore = getCollectionStore(collectionName);
              delete collectionStore[documentId];
              return Promise.resolve({});
            },
          };
        },
        where(query) {
          return {
            limit(limitCount) {
              return {
                get() {
                  const collectionStore = getCollectionStore(collectionName);
                  const records = Object.keys(collectionStore)
                    .map((documentId) => ({
                      _id: documentId,
                      ...clone(collectionStore[documentId]),
                    }))
                    .filter((record) => {
                      return Object.keys(query || {}).every((key) => record[key] === query[key]);
                    })
                    .slice(0, limitCount);

                  return Promise.resolve({
                    data: records,
                  });
                },
              };
            },
          };
        },
      };
    },
  };

  const cloud = {
    getWXContext() {
      return {
        OPENID: "openid-test",
        APPID: "appid-test",
        UNIONID: "unionid-test",
      };
    },
  };

  return {
    cloud,
    createdCollections,
    db,
    store,
  };
}

function clearCloudFunctionModules() {
  const rootPrefix = `${FUNCTION_ROOT}${path.sep}`;
  Object.keys(require.cache).forEach((cacheKey) => {
    if (cacheKey.startsWith(rootPrefix)) {
      delete require.cache[cacheKey];
    }
  });
}

function loadHandlers(mock) {
  clearCloudFunctionModules();
  const contextModulePath = require.resolve(CONTEXT_PATH);
  require.cache[contextModulePath] = {
    id: contextModulePath,
    filename: contextModulePath,
    loaded: true,
    exports: {
      cloud: mock.cloud,
      db: mock.db,
    },
  };

  return {
    config: require(path.join(FUNCTION_ROOT, "handlers", "config.js")),
    grid: require(path.join(FUNCTION_ROOT, "handlers", "grid.js")),
    index: require(path.join(FUNCTION_ROOT, "index.js")),
    poi: require(path.join(FUNCTION_ROOT, "handlers", "poi.js")),
    profile: require(path.join(FUNCTION_ROOT, "handlers", "profile.js")),
    session: require(path.join(FUNCTION_ROOT, "handlers", "session.js")),
    gameProgress: require(path.join(FUNCTION_ROOT, "handlers", "game-progress.js")),
    stats: require(path.join(FUNCTION_ROOT, "handlers", "stats.js")),
  };
}

async function run() {
  let mock = createCloudMock();
  let handlers = loadHandlers(mock);
  const runtimeConfig = await handlers.config.getRuntimeConfig();
  assert.strictEqual(runtimeConfig.success, true, "runtime config should return success without cloud docs");
  assert.strictEqual(runtimeConfig.source, "local-fallback", "empty config collections should use local fallback");
  assert.strictEqual(runtimeConfig.data.poi, null, "missing POI config should be null");
  assert(mock.createdCollections.includes("runtime_config"), "runtime config read should ensure collections");

  mock = createCloudMock({
    runtime_config: {
      current: { version: "test-version" },
    },
    poi_config: {
      current: { items: [{ poi_id: "poi-a", name: "云端地标" }] },
    },
  });
  handlers = loadHandlers(mock);
  const cloudConfig = await handlers.config.getRuntimeConfig();
  assert.strictEqual(cloudConfig.source, "cloud", "present config docs should mark source as cloud");
  assert.strictEqual(cloudConfig.data.runtime.version, "test-version", "runtime config should return current document");
  assert.strictEqual(cloudConfig.data.poi.items[0].name, "云端地标", "POI config should return current document");

  mock = createCloudMock();
  handlers = loadHandlers(mock);
  const profileResultWithDefaultName = await handlers.profile.initUserProfile({
    data: {
      total_grids: 0,
      nick_name: "",
    },
  });
  assert.match(profileResultWithDefaultName.data.nick_name, / [A-Z0-9]{4}$/, "profile should generate anonymous campus display name");
  assert.notStrictEqual(profileResultWithDefaultName.data.nick_name, "校园探索者", "profile should not use generic display name");

  const gridResult = await handlers.grid.syncGridStatus({
    data: {
      grids: [
        { grid_id: "grid-1", unlock_time: "2026-05-13T12:00:00.000Z" },
        { grid_id: "grid-1", unlock_time: "2026-05-13T12:01:00.000Z" },
        { not_grid_id: "skip-me" },
      ],
    },
  });
  assert.strictEqual(gridResult.count, 1, "duplicate grid ids should only write once");
  assert.strictEqual(gridResult.skipped_count, 2, "duplicate and malformed grids should be counted as skipped");
  assert.strictEqual(Object.keys(mock.store.gridstatus).length, 1, "grid sync should keep one user-grid document");
  assert.strictEqual(mock.store.gridstatus["openid-test_grid-1"].unlock_time, "2026-05-13T12:00:00.000Z");

  const emptyGridResult = await handlers.grid.syncGridStatus({});
  assert.strictEqual(emptyGridResult.count, 0, "empty grid payload should be accepted");

  const poiResult = await handlers.poi.syncPoiRecords({
    data: {
      records: [
        { poi_id: "poi-a", poi_name: "A", poi_type: "touch", trigger_time: "2026-05-13T12:00:00.000Z" },
        { poi_id: "poi-a", poi_name: "A again", poi_type: "touch" },
        { poi_name: "missing id" },
      ],
    },
  });
  assert.strictEqual(poiResult.count, 1, "duplicate POI ids should only write once");
  assert.strictEqual(poiResult.skipped_count, 2, "duplicate and malformed POIs should be counted as skipped");
  assert.strictEqual(Object.keys(mock.store.poi_records).length, 1, "POI sync should keep one user-POI document");
  assert.strictEqual(mock.store.poi_records["openid-test_poi-a"].poi_name, "A");

  const failedQuizResult = await handlers.poi.submitPoiQuiz({
    data: {
      poi_id: "poi-library",
      poi_name: "图书馆",
      selected_option_id: "no",
      passed: false,
    },
  });
  assert.strictEqual(failedQuizResult.success, true, "failed quiz submission should be recorded as handled");
  assert.strictEqual(failedQuizResult.passed, false, "failed quiz submission should not pass");
  assert.strictEqual(mock.store.poi_records["openid-test_poi-library"], undefined, "failed quiz should not unlock POI");

  const passedQuizResult = await handlers.poi.submitPoiQuiz({
    data: {
      poi_id: "poi-library",
      poi_name: "图书馆",
      poi_category: "study",
      quiz_question: "这里是图书馆吗？",
      selected_option_id: "yes",
      passed: true,
    },
  });
  assert.strictEqual(passedQuizResult.passed, true, "passed quiz should unlock POI");
  assert.strictEqual(mock.store.poi_records["openid-test_poi-library"].poi_type, "quiz", "passed quiz should write quiz POI record");

  const gameProgressResult = await handlers.gameProgress.syncGameProgress({
    data: {
      completed_route_ids: ["route-a", "route-a"],
      earned_achievement_ids: ["ach-a"],
    },
  });
  assert.strictEqual(gameProgressResult.route_count, 1, "game progress should deduplicate route ids");
  assert.strictEqual(gameProgressResult.achievement_count, 1, "game progress should write achievements");
  assert.strictEqual(Object.keys(mock.store.route_records).length, 1, "route records should persist independently");
  assert.strictEqual(Object.keys(mock.store.achievement_records).length, 1, "achievement records should persist independently");

  const sessionResult = await handlers.session.syncExploreSession({
    data: {
      duration_seconds: 12,
      track_points_sampled: [{ latitude: 26.1, longitude: 119.1 }],
      discovered_poi_ids: "bad-shape",
      total_completed_route_ids: ["route-a"],
      earned_achievement_ids: ["ach-a"],
    },
  });
  assert.strictEqual(sessionResult.success, true, "session sync should tolerate missing session_id");
  const sessionDocId = Object.keys(mock.store.track_sessions)[0];
  assert(sessionDocId.startsWith("openid-test_session_"), "missing session_id should generate a stable document prefix");
  assert.deepStrictEqual(mock.store.track_sessions[sessionDocId].discovered_poi_ids, [], "malformed session arrays should default empty");
  assert.deepStrictEqual(mock.store.track_sessions[sessionDocId].total_completed_route_ids, ["route-a"], "valid session arrays should persist");
  assert.deepStrictEqual(mock.store.track_sessions[sessionDocId].earned_achievement_ids, ["ach-a"], "achievement ids should persist");
  assert.strictEqual(mock.store.track_sessions[sessionDocId].track_points_sampled.length, 1, "sampled track points should persist");

  const progressResult = await handlers.profile.getUserProgress();
  assert.strictEqual(progressResult.route_records.length, 1, "user progress should include route records");
  assert.strictEqual(progressResult.achievement_records.length, 1, "user progress should include achievement records");

  mock.store.userinfo["openid-test"] = {
    nick_name: "测试用户",
    total_grids: 88,
    explore_ratio: 1.4,
    poi_count: 2,
    route_count: 1,
    achievement_count: 1,
    session_count: 1,
  };
  const leaderboardResult = await handlers.stats.getLeaderboard({
    data: {
      metric: "poi",
      limit: 5,
    },
  });
  assert.strictEqual(leaderboardResult.success, true, "leaderboard should return success");
  assert.strictEqual(leaderboardResult.items[0].poi_count, 2, "leaderboard should use cached POI count");
  assert.notStrictEqual(leaderboardResult.items[0].nick_name, "校园探索者", "leaderboard should avoid generic display name");
  assert.strictEqual(leaderboardResult.current_user_rank, 1, "leaderboard should expose current user rank");
  assert.strictEqual(leaderboardResult.current_user_item.user_id, "openid-test", "leaderboard should expose current user item");

  const summarySyncResult = await handlers.profile.syncExploreSummary({
    data: {
      total_grids: 90,
      explore_ratio: 1.5,
      poi_count: 3,
      route_count: 2,
      achievement_count: 2,
      session_count_delta: 1,
    },
  });
  assert.strictEqual(summarySyncResult.success, true, "summary sync should refresh cached stat fields");
  assert.strictEqual(mock.store.userinfo["openid-test"].poi_count, 3, "summary sync should cache POI count");
  assert.strictEqual(mock.store.userinfo["openid-test"].session_count, 2, "summary sync should accumulate session count");

  mock.store.gridstatus["openid-other_grid-a"] = {
    user_id: "openid-other",
    grid_id: "grid-a",
  };
  mock.store.poi_records["openid-other_poi-a"] = {
    user_id: "openid-other",
    poi_id: "poi-a",
  };
  const clearResult = await handlers.profile.clearUserData();
  assert.strictEqual(clearResult.success, true, "clear user data should return success");
  assert.strictEqual(mock.store.userinfo["openid-test"], undefined, "clear user data should remove current profile");
  assert.strictEqual(Object.keys(mock.store.gridstatus).filter((id) => id.startsWith("openid-test")).length, 0, "clear user data should remove current grids");
  assert.strictEqual(Object.keys(mock.store.poi_records).filter((id) => id.startsWith("openid-test")).length, 0, "clear user data should remove current POIs");
  assert.strictEqual(Object.keys(mock.store.track_sessions).filter((id) => id.startsWith("openid-test")).length, 0, "clear user data should remove current sessions");
  assert.strictEqual(Object.keys(mock.store.route_records).filter((id) => id.startsWith("openid-test")).length, 0, "clear user data should remove current routes");
  assert.strictEqual(Object.keys(mock.store.achievement_records).filter((id) => id.startsWith("openid-test")).length, 0, "clear user data should remove current achievements");
  assert.strictEqual(mock.store.gridstatus["openid-other_grid-a"].user_id, "openid-other", "clear user data should keep other users' grids");
  assert.strictEqual(mock.store.poi_records["openid-other_poi-a"].user_id, "openid-other", "clear user data should keep other users' POIs");

  const statsResult = await handlers.stats.getExploreStats();
  assert.strictEqual(statsResult.summary.grid_record_count, 0, "stats should reflect cleared current profile grid count");
  assert.strictEqual(statsResult.summary.poi_record_count, 0, "stats should reflect cleared current profile counts");

  const unsupported = await handlers.index.main({ type: "unknown" });
  assert.strictEqual(unsupported.success, false, "unsupported events should fail explicitly");
  assert.strictEqual(unsupported.message, "unsupported-event:unknown");

  console.log("Cloud handler tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
