import { useEffect, useRef, useState } from 'react';
import { createInitialState, transition } from './domain.ts';
import type { Action, State } from './domain.ts';
import { decodeState, STORAGE_KEY } from './storage.ts';

function load(): { state: State; raw: string | null; error: string } {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    return { state: raw ? decodeState(raw) : createInitialState(), raw, error: '' };
  } catch (error) {
    return { state: createInitialState(Date.now(), false), raw, error: (error as Error).message };
  }
}

export function useWorkspace() {
  const [initial] = useState(load);
  const [state, setState] = useState(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const current = useRef(state);
  const savedRaw = useRef(initial.raw);
  const storageBlocked = useRef(!!initial.error);

  useEffect(() => {
    if (initial.error || initial.raw !== null) return;
    try {
      const raw = JSON.stringify(current.current);
      localStorage.setItem(STORAGE_KEY, raw); savedRaw.current = raw;
    } catch {
      storageBlocked.current = true;
      setStorageError('Browser storage is unavailable. Enable site storage and reload before changing the workspace.');
    }
  }, [initial]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        storageBlocked.current = true;
        setStorageError('This workspace changed in another tab. Reload to use the latest saved version.');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function persist(next: State) {
    const raw = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, raw);
    savedRaw.current = raw; current.current = next; setState(next);
  }

  function act(action: Action) {
    if (storageBlocked.current) throw new Error('Resolve the workspace storage notice before making changes.');
    if (localStorage.getItem(STORAGE_KEY) !== savedRaw.current) {
      storageBlocked.current = true;
      setStorageError('A newer workspace was saved in another tab. Reload before continuing.');
      throw new Error('Workspace changed. Reload to avoid overwriting another tab.');
    }
    const next = transition(current.current, action);
    try { persist(next); }
    catch { throw new Error('Could not save this change. Free browser storage and retry. The change was not applied.'); }
    return next;
  }

  function reset() {
    const next = createInitialState();
    persist(next); storageBlocked.current = false; setStorageError('');
  }

  return { state, storageError, rawBackup: savedRaw.current, act, reset };
}
