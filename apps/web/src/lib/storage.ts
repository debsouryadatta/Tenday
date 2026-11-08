import { useCallback, useEffect, useRef, useState } from 'react';

export function operationId() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(b, (v) => v.toString(16).padStart(2, '0')).join('');
}
export function useDraft<T>(key: string, initial: T) {
  const [value, setValue] = useState(initial);
  const [loadedKey, setLoadedKey] = useState('');
  const latest = useRef(value);
  const first = useRef(initial);
  first.current = initial;
  useEffect(() => {
    let restored = first.current;
    try {
      const raw = localStorage.getItem(key);
      if (raw) restored = JSON.parse(raw) as T;
    } catch {
      /* A corrupt draft must not affect server records. */
    }
    latest.current = restored;
    setValue(restored);
    setLoadedKey(key);
  }, [key]);
  const change = useCallback(
    (next: T | ((old: T) => T)) => {
      const updated =
        typeof next === 'function'
          ? (next as (old: T) => T)(latest.current)
          : next;
      localStorage.setItem(key, JSON.stringify(updated));
      latest.current = updated;
      setValue(updated);
    },
    [key],
  );
  const clear = useCallback(() => localStorage.removeItem(key), [key]);
  return { value, change, ready: loadedKey === key, clear };
}

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('tenday-web-drafts', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function draftFile(
  key: string,
  value?: File | null,
): Promise<File | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(
        'files',
        value === undefined ? 'readonly' : 'readwrite',
      );
      const store = tx.objectStore('files');
      const request =
        value === undefined
          ? store.get(key)
          : value === null
            ? store.delete(key)
            : store.put(value, key);
      let result: File | undefined;
      request.onsuccess = () => {
        result =
          value === undefined
            ? (request.result as File | undefined)
            : undefined;
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
