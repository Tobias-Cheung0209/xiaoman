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
      if (i >= 0) { arr[i] = Object.assign({}, arr[i], rec, { updatedAt: new Date().toISOString() }); data.collections[k] = arr; persist(); }
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
    /* 合并导入（v19-①）：按 _id 去重，取 updatedAt/_created 较新者；无 _id 视为新记录；设置浅合并（导入覆盖本地） */
    mergeAll(json) {
      try {
        const d = JSON.parse(json);
        if (!d.collections) d.collections = {};
        if (!d.settings) d.settings = {};
        Object.keys(d.collections).forEach(k => {
          const incoming = d.collections[k] || [];
          const cur = data.collections[k] || [];
          const map = {};
          cur.forEach(r => { if (r && r._id) map[r._id] = r; });
          incoming.forEach(r => {
            if (r && r._id && map[r._id]) {
              const tNew = new Date(r.updatedAt || r._created || 0).getTime();
              const tOld = new Date(map[r._id].updatedAt || map[r._id]._created || 0).getTime();
              if (tNew >= tOld) map[r._id] = r;
            } else if (r && r._id) {
              map[r._id] = r;
            } else {
              const nr = Object.assign({}, r);
              nr._id = 'r' + Date.now() + Math.floor(Math.random() * 100000);
              nr._created = nr._created || new Date().toISOString();
              map[nr._id] = nr;
            }
          });
          data.collections[k] = Object.values(map);
        });
        data.settings = Object.assign({}, data.settings, d.settings);
        persist();
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    /* 导出 XMS1 短码：deflate-raw + base64，前缀 XMS1: */
    async encodeShort() {
      const json = JSON.stringify(data);
      const bytes = new TextEncoder().encode(json);
      const compressed = await deflateBytes(bytes);
      return 'XMS1:' + bytesToBase64(compressed);
    },
    /* 解析 XMS1 短码，返回 JSON 字符串（供 mergeAll 消费）
     * 修复①：去除全部空白（IM 粘贴常混入中间换行/空格）
     * 修复②：前缀大小写不敏感（xms1: / XMS1: 均可） */
    async decodeShort(str) {
      let s = (str || '').replace(/\s+/g, '').trim();
      if (/^xms1:/i.test(s)) s = s.slice(5);
      const bytes = base64ToBytes(s);
      const json = await inflateBytes(bytes);
      return json;
    },
    /* 当前浏览器是否支持 XMS1 短码（CompressionStream/DecompressionStream，iOS 16.4+） */
    shortSupported() {
      return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
    },
  };

  /* ---- 压缩 / 编码辅助（基于原生 CompressionStream，无依赖） ----
   * 注意：不要手动 writer/reader 配对——writer.close() 在部分实现（Node/WebKit）
   * 中会等 readable 消费完才 resolve，先 await close 再读 reader 会背压死锁。
   * 统一用 pipeThrough + Response.arrayBuffer()，由引擎处理背压与关闭。
   * 错误分类：no-compression / deflate-fail / inflate-fail / bad-base64 */
  async function deflateBytes(bytes) {
    if (typeof CompressionStream === 'undefined') throw new Error('no-compression');
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      const buf = await new Response(stream).arrayBuffer();
      return new Uint8Array(buf);
    } catch (e) {
      throw new Error('deflate-fail');
    }
  }
  async function inflateBytes(bytes) {
    if (typeof DecompressionStream === 'undefined') throw new Error('no-compression');
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      const buf = await new Response(stream).arrayBuffer();
      return new TextDecoder().decode(new Uint8Array(buf));
    } catch (e) {
      throw new Error('inflate-fail');
    }
  }
  function bytesToBase64(bytes) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }
  function base64ToBytes(b64) {
    let bin;
    try { bin = atob(b64); } catch (e) { throw new Error('bad-base64'); }
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
})();
