import Dexie from 'dexie';

export const db = new Dexie('EduManageOfflineDB');

db.version(1).stores({
  apiCache: 'url, data, timestamp', // Caches GET responses
  syncQueue: '++id, url, method, data, timestamp' // Stores pending POST/PUT/DELETE
});

export const cacheApiResponse = async (url, data) => {
  try {
    await db.apiCache.put({ url, data, timestamp: Date.now() });
  } catch (e) {
    console.error('Failed to cache API response', e);
  }
};

export const getCachedApiResponse = async (url) => {
  try {
    const cached = await db.apiCache.get(url);
    return cached ? cached.data : null;
  } catch (e) {
    console.error('Failed to get cached API response', e);
    return null;
  }
};

export const addToSyncQueue = async (url, method, data) => {
  try {
    await db.syncQueue.add({ url, method, data, timestamp: Date.now() });
  } catch (e) {
    console.error('Failed to add to sync queue', e);
  }
};

export const getSyncQueue = async () => {
  return await db.syncQueue.toArray();
};

export const removeFromSyncQueue = async (id) => {
  await db.syncQueue.delete(id);
};
