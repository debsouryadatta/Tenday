import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDraft<T>(key: string, initial: T) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const latest = useRef(value);
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    setReady(false);
    void AsyncStorage.getItem(key).then((raw) => {
      if (active) {
        let restored = initialRef.current;
        if (raw) {
          try {
            restored = JSON.parse(raw) as T;
          } catch {
            /* Corrupt local draft can be replaced. */
          }
        }
        latest.current = restored;
        setValue(restored);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [key]);
  const change = useCallback(
    (next: T | ((old: T) => T)) => {
      const updated =
        typeof next === 'function'
          ? (next as (old: T) => T)(latest.current)
          : next;
      latest.current = updated;
      setValue(updated);
      writes.current = writes.current
        .catch(() => {})
        .then(() => AsyncStorage.setItem(key, JSON.stringify(updated)));
      return writes.current;
    },
    [key],
  );
  const clear = useCallback(async () => {
    await writes.current;
    await AsyncStorage.removeItem(key);
  }, [key]);
  return { value, change, ready, clear };
}
