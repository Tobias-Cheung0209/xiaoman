/* ============================================================
 * 存储引擎：单一 JSON 根对象，localStorage 持久化
 * data = { collections: { modId: [records] }, settings: {...} }
 * 导出/导入基于同一根对象
 * ============================================================ */

const Store = (function () {
  const KEY = 'wb_data';

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
    /* 集合（列表型模块/子表） */
    getList(modId) {
      return data.collections[modId] || [];
    },
    saveList(modId, arr) {
      data.collections[modId] = arr;
      persist();
    },
    addRecord(modId, rec) {
      const arr = this.getList(modId);
      rec._id = 'r' + Date.now() + Math.floor(Math.random() * 1000);
      rec._created = new Date().toISOString();
      arr.unshift(rec);
      this.saveList(modId, arr);
      return rec;
    },
    updateRecord(modId, id, rec) {
      const arr = this.getList(modId);
      const i = arr.findIndex(r => r._id === id);
      if (i >= 0) { arr[i] = Object.assign({}, arr[i], rec); this.saveList(modId, arr); }
    },
    deleteRecord(modId, id) {
      let arr = this.getList(modId);
      arr = arr.filter(r => r._id !== id);
      this.saveList(modId, arr);
    },

    /* 设置（单条记录型，如生理期设置、昵称等） */
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
