/* 小满则盈数据引擎：localStorage 真源、JSON 备份、按时间合并、删除墓碑。 */
const Store = (function () {
  const KEY = 'wb_data', META_KEY = 'xiaoman:meta', SNAP_KEY = 'xiaoman:importSnapshots', SCHEMA_VERSION = 2;
  const emptyData = () => ({ schemaVersion: SCHEMA_VERSION, collections: {}, settings: {}, settingTimes: {} });
  const keyOf = x => x && typeof x === 'object' ? (x.collection || x.id) : x;
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'r' + Date.now() + Math.random().toString(36).slice(2);
  const parsedIso = v => { const n = Date.parse(v || ''); return Number.isFinite(n) ? new Date(n).toISOString() : ''; };
  const stamp = r => Date.parse(r.updatedAt || r._updatedAt || r.createdAt || r._created || 0) || 0;
  function normalizeRecord(rec) {
    const r = Object.assign({}, rec || {}), created = parsedIso(r.createdAt || r._created) || new Date().toISOString();
    r._id = r._id || uuid(); r.createdAt = created; r.updatedAt = parsedIso(r.updatedAt || r._updatedAt) || created;
    r.deletedAt = r.deletedAt ? (parsedIso(r.deletedAt) || r.updatedAt) : null; r.schemaVersion = SCHEMA_VERSION; delete r._updatedAt; return r;
  }
  function normalizeData(input) {
    const d = input && typeof input === 'object' && !Array.isArray(input) ? input : emptyData(), out = emptyData();
    Object.keys(d.collections || {}).forEach(k => { if (Array.isArray(d.collections[k])) out.collections[k] = d.collections[k].map(normalizeRecord); });
    out.settings = d.settings && typeof d.settings === 'object' && !Array.isArray(d.settings) ? Object.assign({}, d.settings) : {};
    out.settingTimes = d.settingTimes && typeof d.settingTimes === 'object' ? Object.assign({}, d.settingTimes) : {}; return out;
  }
  function load() { try { const raw = localStorage.getItem(KEY); return raw ? normalizeData(JSON.parse(raw)) : emptyData(); } catch (e) { console.error('load failed', e); return emptyData(); } }
  let data = load();
  function persist(next) { try { localStorage.setItem(KEY, JSON.stringify(next)); data = next; return true; } catch (e) { console.error('persist failed', e); alert('保存失败：浏览器本地空间可能已满。请先导出 JSON 备份并减少照片。'); return false; } }
  function mutate(fn) { const next = normalizeData(JSON.parse(JSON.stringify(data))); fn(next); return persist(next); }
  const visible = arr => (arr || []).filter(r => !r.deletedAt);
  function snapshot() { try { const list = JSON.parse(localStorage.getItem(SNAP_KEY) || '[]'); list.unshift({ at: new Date().toISOString(), json: JSON.stringify(data) }); localStorage.setItem(SNAP_KEY, JSON.stringify(list.slice(0, 3))); } catch (e) { console.warn('snapshot failed', e); } }
  function mergeRecords(local, incoming, stats) {
    const map = new Map(); (local || []).forEach(r => map.set(r._id, normalizeRecord(r)));
    (incoming || []).forEach(raw => { const r = normalizeRecord(raw), old = map.get(r._id); if (!old) { map.set(r._id, r); stats.added++; return; }
      const nt = stamp(r), ot = stamp(old); if (nt > ot) { map.set(r._id, r); stats.updated++; } else if (nt < ot) stats.keptLocal++;
      else if (JSON.stringify(r) !== JSON.stringify(old)) { const c = normalizeRecord(Object.assign({}, r, { _id: uuid(), conflictOf: r._id, conflictAt: new Date().toISOString() })); map.set(c._id, c); stats.conflicts++; }
    }); return Array.from(map.values());
  }
  const api = {
    keyOf,
    getList(x, opts) { const arr = data.collections[keyOf(x)] || []; return opts && opts.includeDeleted ? arr : visible(arr); },
    saveList(x, arr) { return mutate(d => { d.collections[keyOf(x)] = (arr || []).map(normalizeRecord); }); },
    addRecord(x, rec) { const r = normalizeRecord(rec), now = new Date().toISOString(); r.createdAt = now; r.updatedAt = now; return mutate(d => { const k = keyOf(x); d.collections[k] = d.collections[k] || []; d.collections[k].unshift(r); }) ? r : null; },
    updateRecord(x, id, rec) { return mutate(d => { const k = keyOf(x), arr = d.collections[k] || [], i = arr.findIndex(r => r._id === id); if (i >= 0) arr[i] = normalizeRecord(Object.assign({}, arr[i], rec, { updatedAt: new Date().toISOString(), deletedAt: null })); }); },
    deleteRecord(x, id) { return mutate(d => { const k = keyOf(x), r = (d.collections[k] || []).find(v => v._id === id); if (r) { r.deletedAt = new Date().toISOString(); r.updatedAt = r.deletedAt; } }); },
    getSetting(k, def) { return Object.prototype.hasOwnProperty.call(data.settings, k) ? data.settings[k] : def; },
    setSetting(k, val) { return mutate(d => { d.settings[k] = val; d.settingTimes[k] = new Date().toISOString(); }); },
    getMeta(k, def) { try { const m = JSON.parse(localStorage.getItem(META_KEY) || '{}'); return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : def; } catch (_) { return def; } },
    setMeta(k, val) { try { const m = JSON.parse(localStorage.getItem(META_KEY) || '{}'); m[k] = val; localStorage.setItem(META_KEY, JSON.stringify(m)); return true; } catch (_) { return false; } },
    exportAll() { return JSON.stringify(data, null, 2); },
    importAll(json) { try { const next = normalizeData(JSON.parse(json)); snapshot(); return persist(next); } catch (e) { console.error(e); return false; } },
    mergeAll(json) { try { const incoming = normalizeData(JSON.parse(json)), next = normalizeData(data), stats = { added: 0, updated: 0, keptLocal: 0, conflicts: 0, settings: 0 };
        Object.keys(incoming.collections).forEach(k => { next.collections[k] = mergeRecords(next.collections[k] || [], incoming.collections[k], stats); });
        Object.keys(incoming.settings).forEach(k => { const nt = Date.parse(incoming.settingTimes[k] || 0) || 0, ot = Date.parse(next.settingTimes[k] || 0) || 0; if (!Object.prototype.hasOwnProperty.call(next.settings, k) || nt > ot) { next.settings[k] = incoming.settings[k]; next.settingTimes[k] = incoming.settingTimes[k] || new Date().toISOString(); stats.settings++; } });
        snapshot(); if (!persist(next)) return false; api.lastMergeStats = stats; return true; } catch (e) { console.error(e); return false; } },
    migrateOnce(k, fn) { if (api.getMeta(k, false)) return false; const ok = mutate(fn); if (ok) api.setMeta(k, true); return ok; },
    backupSize() { return new Blob([JSON.stringify(data)]).size; },
    lastMergeStats: null,
  };
  return api;
})();
