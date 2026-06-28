import {
  LOCAL_LIBRARY_DB_NAME,
  LOCAL_LIBRARY_DB_VERSION,
  LOCAL_LIBRARY_HANDLE_KEY,
  LOCAL_LIBRARY_HANDLE_STORE,
} from './local-library-service.const';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_LIBRARY_DB_NAME, LOCAL_LIBRARY_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(LOCAL_LIBRARY_HANDLE_STORE)) {
        db.createObjectStore(LOCAL_LIBRARY_HANDLE_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

export async function saveDirectoryHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LOCAL_LIBRARY_HANDLE_STORE, 'readwrite');
      tx.objectStore(LOCAL_LIBRARY_HANDLE_STORE).put(handle, LOCAL_LIBRARY_HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
    });
  } finally {
    db.close();
  }
}

export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDatabase();

  try {
    return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction(LOCAL_LIBRARY_HANDLE_STORE, 'readonly');
      const request = tx.objectStore(LOCAL_LIBRARY_HANDLE_STORE).get(LOCAL_LIBRARY_HANDLE_KEY);

      request.onsuccess = () => {
        const value = request.result;

        if (value && typeof value === 'object' && 'kind' in value) {
          resolve(value as FileSystemDirectoryHandle);
          return;
        }

        resolve(null);
      };

      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
    });
  } finally {
    db.close();
  }
}

export async function clearDirectoryHandle(): Promise<void> {
  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LOCAL_LIBRARY_HANDLE_STORE, 'readwrite');
      tx.objectStore(LOCAL_LIBRARY_HANDLE_STORE).delete(LOCAL_LIBRARY_HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
    });
  } finally {
    db.close();
  }
}
