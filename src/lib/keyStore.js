const DB_NAME = "aura-connect-keys";
const DB_VERSION = 1;

let currentUserId = null;
let dbPromise = null;

export function setCurrentUser(userId) {
  currentUserId = userId;
}

export function closeDB() {
  dbPromise = null;
}

function scoped(key, userId) {
  const uid = userId ?? currentUserId;
  return uid ? `${uid}:${key}` : key;
}

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dbPromise = null; reject(req.error); };
  });
  return dbPromise;
}

function tx(mode, cb) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction("keys", mode);
    cb(t.objectStore("keys"), resolve, reject);
    t.onerror = () => reject(t.error);
  }));
}

export async function storeKey(keyName, value, userId) {
  return tx("readwrite", (store, resolve, reject) => {
    const req = store.put(value, scoped(keyName, userId));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getKey(keyName, userId) {
  return tx("readonly", (store, resolve, reject) => {
    const req = store.get(scoped(keyName, userId));
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function removeKey(keyName, userId) {
  return tx("readwrite", (store, resolve, reject) => {
    const req = store.delete(scoped(keyName, userId));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllKeys() {
  return tx("readwrite", (store, resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
