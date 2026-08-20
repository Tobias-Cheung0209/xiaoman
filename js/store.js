/* ============================================================
 * 存储引擎：单一 JSON 根对象，localStorage 持久化
 * data = { collections: { key: [records] }, settings: {...} }
 * 导出/导入基于同一根对象
 * V3：getList/CRUD 支持传入 tab 对象，自动取 tab.collection || tab.id
 *     （多 Tab 共享同一集合），向后兼容纯字符串 key。
 * ============================================================ */

const Store = (function () {
  const KEY = 'wb_data';

  /* tab 对象 → collection key；纯字符串原样返回 */
  function keyOf(tabOrId) {
    if (tabOrId && typeof tabOrId === 'object') return tabOrId.collection || tabOrId.id;
    return tabOrId;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { collections: {}, settings: {} };
      const d = JSON.parse(raw);
      if (!d.collections) d.collections = {};
      if (!d.settings) d.settings = {};
      return d;
    } catch (e) {
      console.error('load failed', e);
      return { collections: {}, settings: {} };
    }
  }

  let data = load();

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('persist failed', e);
      alert('保存失败：本地存储空间可能已满（尤其是照片）。请减少图片或清理数据。');
      return false;
    }
  }

  return {
    keyOf,
    /* 集合（列表型模块/子表） */
    getList(tabOrId) {
      return data.collections[keyOf(tabOrId)] || [];
    },
    saveList(tabOrId, arr) {
      data.collections[keyOf(tabOrId)] = arr;
      persist();
    },
    addRecord(tabOrId, rec) {
      const k = keyOf(tabOrId);
      const arr = data.collections[k] || [];
      rec._id = 'r' + Date.now() + Math.floor(Math.random() * 1000);
      rec._created = new Date().toISOString();
      arr.unshift(rec);
      data.collections[k] = arr;
      persist();
      return rec;
    },
    updateRecord(tabOrId, id, rec) {
      const k = keyOf(tabOrId);
      const arr = data.collections[k] || [];
      const i = arr.findIndex(r => r._id === id);
      if (i >= 0) { arr[i] = Object.assign({}, arr[i], rec); data.collections[k] = arr; persist(); }
    },
    deleteRecord(tabOrId, id) {
      const k = keyOf(tabOrId);
      let arr = data.collections[k] || [];
      arr = arr.filter(r => r._id !== id);
      data.collections[k] = arr;
      persist();
    },

    /* 设置（单条记录型，如经期设置、昵称等） */
    getSetting(key, def) {
      return key in data.settings ? data.settings[key] : def;
    },
    setSetting(key, val) {
      data.settings[key] = val;
      persist();
    },

    /* 全部导出 */
    exportAll() {
      return JSON.stringify(data, null, 2);
    },
    /* 导入（覆盖） */
    importAll(json) {
      try {
        const d = JSON.parse(json);
        if (!d.collections) d.collections = {};
        if (!d.settings) d.settings = {};
        data = d;
        persist();
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
  };
})();
