import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyData, normalizeData, recordValuation } from '../lib/model.mjs';
import { synchronize } from '../lib/sync.mjs';
import { remotePortfolio } from '../lib/cloud';

export function usePortfolio(userId) {
  const key = `myportfolio-mobile-v1:${userId || 'guest'}`;
  const snapshot = useRef(null);
  const locked = useRef(false);
  const active = useRef(true);
  const [state, setState] = useState({ data: null, busy: true, ready: false, status: 'Loading portfolio…', error: '', conflict: false });
  const publish = (patch) => { if (active.current) setState((prev) => ({ ...prev, ...patch })); };
  const persist = async (next) => {
    await AsyncStorage.setItem(key, JSON.stringify(next));
    snapshot.current = next;
    publish({ data: next.data });
  };
  const sync = async (replaceLocal = false) => {
    if (!userId) { publish({ status: 'Saved on this device', error: '', conflict: false }); return; }
    publish({ status: 'Syncing…' });
    try {
      const next = await synchronize(snapshot.current, remotePortfolio(userId), { replaceLocal });
      await persist(next);
      publish({ status: 'Synced with your account', error: '', conflict: false });
    } catch (problem) {
      publish({ status: snapshot.current.dirty ? 'Saved on device · sync pending' : 'Cloud unavailable · showing saved data',
        error: problem.message, conflict: problem.name === 'SyncConflict' });
    }
  };
  const operate = async (action) => {
    if (locked.current) return false;
    locked.current = true; publish({ busy: true, error: '' });
    try { await action(); return true; }
    catch (problem) { publish({ error: problem.message || 'Could not save portfolio.' }); return false; }
    finally { locked.current = false; publish({ busy: false }); }
  };
  const initialize = () => operate(async () => {
    const raw = await AsyncStorage.getItem(key);
    const saved = raw ? JSON.parse(raw) : { data: emptyData(), dirty: false, baseVersion: null };
    if (!saved.data || typeof saved.data !== 'object') throw new Error('Saved portfolio could not be read.');
    snapshot.current = { ...saved, data: normalizeData(saved.data) };
    publish({ data: snapshot.current.data, ready: true });
    await sync();
  });
  useEffect(() => {
    active.current = true;
    initialize();
    return () => { active.current = false; };
  }, [key]);
  const update = (change, quotes = {}) => operate(async () => {
    if (!snapshot.current) throw new Error('Wait for your portfolio to finish loading.');
    await persist({ ...snapshot.current, data: recordValuation(change(snapshot.current.data), quotes), dirty: true });
    await sync();
  });
  const refresh = (replaceLocal = false) => snapshot.current
    ? operate(() => sync(replaceLocal)) : initialize();
  return { ...state, update, refresh };
}
