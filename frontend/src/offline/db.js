import Dexie from 'dexie';

export const db = new Dexie('EvaCrmOfflineDB');

db.version(1).stores({
  collections: '++id, clientGeneratedId, status, customerId',
  dashboardCache: 'key, data, timestamp',
  customerCache: 'id, name, phone'
});

export const saveOfflineCollection = async (collection) => {
  return await db.collections.add({
    ...collection,
    status: 'PENDING_SYNC',
    createdAt: new Date().toISOString()
  });
};

export const getPendingCollections = async () => {
  return await db.collections.where('status').equals('PENDING_SYNC').toArray();
};

export const updateCollectionStatus = async (id, status) => {
  return await db.collections.update(id, { status });
};

export const deleteCollection = async (id) => {
  return await db.collections.delete(id);
};

export const cleanupOldCache = async () => {
  const ONE_WEEK_AGO = Date.now() - (7 * 24 * 60 * 60 * 1000);
  await db.dashboardCache.where('timestamp').below(ONE_WEEK_AGO).delete();
  console.log('IndexedDB: Cleaned up old dashboard cache');
};
