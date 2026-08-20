/* ============================================================
 * 主应用（V3）：导航 / 路由 / 通用列表-表单 / Hero 首页 / 特例视图 / 设置
 * ============================================================ */

const App = (function () {
  const state = { module: 'home', tab: null };
  let focusState = null; // 学习专注计时器状态

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function todayKey() { return new Date().toISOString().slice(0, 10); }
  function money(v, cur) { const n = parseFloat(v); return (isNaN(n) ? 0 : n).toFixed(2) + (cur || '€'); }

  /* ---------------- 导航 ---------------- */
  function renderNav() {
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = MODULES.map(m => `
      <button class="nav-item group-${m.group}" data-mod="${m.id}">
        <span class="nav-icon">${m.icon}</span>
        <span class="nav-label">${esc(m.name)}</span>
      </button>`).join('');
    nav.querySelectorAll('.nav-item').forEach(b => {
      b.onclick = () => { selectModule(b.dataset.mod); closeDrawer(); };
    });
  }

  function selectModule(id) {
    state.module = id;
    const mod = MODULE_MAP[id];
    state.tab = (mod.tabs && mod.tabs[0]) ? mod.tabs[0].id : null;
    document.querySelectorAll('.nav-item').forEach(b =>
      b.classList.toggle('active', b.dataset.mod === id));
    renderContent();
  }

  function selectTab(tabId) {
    state.tab = tabId;
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tabId));
    renderContent();
  }

  /* ---------------- 内容路由 ---------------- */
  function renderContent() {
    const mod = MODULE_MAP[state.module];
    const root = document.getElementById('content-body');
    if (mod.render === 'home') { root.innerHTML = renderHome(); bindHome(root); return; }
    if (mod.render === 'tabs') {
      root.innerHTML = renderTabs(mod);
      bindTabs(root, mod);
      populateList(mod);
      return;
    }
  }

  function populateList(mod) {
    const tab = mod.tabs.find(t => t.id === state.tab);
    if (!tab) return;
    const special = getSpecialRenderer(mod.id, tab.id);
    if (special) {
      const container = document.getElementById('tab-body');
      if (container) container.innerHTML = special(tab);
      bindSpecial(mod.id, tab);
      return;
    }
    if (tab.type === 'list') {
      renderList(tab);
      const add = document.getElementById('add-btn');
      if (add) add.onclick = () => openForm(tab, null);
    }
  }

  /* ---------------- 模块头部 + Tab 栏 ---------------- */
  function renderTabs(mod) {
    const tabs = mod.tabs.map(t =>
      `<button class="tab-btn ${t.id === state.tab ? 'active' : ''} group-${mod.group}" data-tab="${t.id}">${esc(t.name)}</button>`
    ).join('');
    const tab = mod.tabs.find(t => t.id === state.tab) || mod.tabs[0];
    return `
      <div class="mod-header">
        <button class="mod-header-back" data-goto="home">←</button>
        <div class="mod-header-info">
          <h2>${esc(mod.icon + ' ' + mod.name)}</h2>
          <p>${esc(mod.desc || '')}</p>
        </div>
        <div class="mod-actions">
          ${tab.type === 'list' && tab.fields.length ? '<button id="add-btn" title="新增">+</button>' : ''}
          <button id="mod-settings" title="设置">⚙</button>
        </div>
      </div>
      <div class="tab-bar">${tabs}</div>
      <div id="tab-body">${renderTabBody(tab)}</div>`;
  }
  function bindTabs(root, mod) {
    root.querySelectorAll('.tab-btn').forEach(b =>
      b.onclick = () => { selectTab(b.dataset.tab); });
    root.querySelectorAll('[data-goto="home"]').forEach(b =>
      b.onclick = () => selectModule('home'));
    const add = document.getElementById('add-btn');
    const tab = mod.tabs.find(t => t.id === state.tab);
    if (add && tab) add.onclick = () => openForm(tab, null);
    const set = document.getElementById('mod-settings');
    if (set) set.onclick = openSettings;
  }

  /* ---------------- 单个 Tab 内容 ---------------- */
  function renderTabBody(tab) {
    if (tab.type === 'settings') return renderSettings(tab);
    if (tab.type === 'budget') return renderBudget(tab);
    if (tab.type === 'filter') return renderFilterView(tab);
    // 特例渲染由 populateList 填充
    if (tab.special) return '';
    // 通用列表
    let html = `<div class="list-tools"><button class="btn-primary" id="add-btn">+ 新增</button></div>`;
    html += `<div class="card-grid" id="list-grid"></div>`;
    return html;
  }

  /* ---------------- 通用列表 ---------------- */
  function renderList(tab) {
    const grid = document.getElementById('list-grid');
    const mod = MODULE_MAP[state.module];
    const grp = mod ? mod.group : 'work';
    if (!grid) return;
    const list = Store.getList(tab);
    if (!list.length) {
      grid.innerHTML = `<div class="empty">还没有记录，点上方"+ 新增"开始吧～</div>`;
      return;
    }
    const primary = (tab.fields.find(f => f.required) || tab.fields[0]).key;
    grid.innerHTML = list.map(rec => {
      const others = tab.fields.filter(f => f.key !== primary);
      const body = others.map(f => {
        let v = rec[f.key];
        if (f.type === 'checkbox') v = v ? '✓' : '—';
        else if (f.type === 'multicheck') v = Array.isArray(v) ? v.join('、') : (v || '');
        else if (f.type === 'image' && v) return `<div class="fld img"><label>${esc(f.label)}</label><img src="${esc(v)}" class="thumb"></div>`;
        return `<div class="fld"><label>${esc(f.label)}</label><span>${esc(v)}</span></div>`;
      }).join('');
      return `<div class="card group-${grp}">
        <div class="card-head"><strong>${esc(rec[primary])}</strong>
          <span class="card-ops">
            <button class="mini" data-edit="${rec._id}">编辑</button>
            <button class="mini danger" data-del="${rec._id}">删</button>
          </span></div>
        <div class="card-body">${body}</div></div>`;
    }).join('');
    grid.querySelectorAll('[data-edit]').forEach(b =>
      b.onclick = () => openForm(tab, b.dataset.edit));
    grid.querySelectorAll('[data-del]').forEach(b =>
      b.onclick = () => { if (confirm('确定删除这条记录？')) { Store.deleteRecord(tab, b.dataset.del); renderContent(); } });
  }

  /* ---------------- 过滤视图（家居待办等只读视图） ---------------- */
  function renderFilterView(tab) {
    const source = tab.source || tab.id;
    const domains = tab.domains || [];
    const all = Store.getList({ collection: source });
    const list = domains.length ? all.filter(r => domains.includes(r.domain)) : all;
    if (!list.length) return `<div class="empty-state"><div class="empty-state-icon">🏠</div><div class="empty-state-text">还没有家居待办</div></div>`;
    const items = list.map(r => `<div class="todo-item">
      <input type="checkbox" class="todo-check" data-toggle="${r._id}" data-key="status" data-on="完成" data-off="待办" data-col="${source}" ${r.status === '完成' ? 'checked' : ''}>
      <div class="todo-main">
        <div class="todo-title" style="${r.status === '完成' ? 'text-decoration:line-through;opacity:.55;' : ''}">${esc(r.item)}</div>
        <div class="todo-meta">${esc(r.domain || '')} ${r.due ? '· 截止 ' + r.due : ''}</div>
      </div>
    </div>`).join('');
    return `<div class="todo-list">${items}</div>`;
  }

  /* ---------------- 表单弹窗 ---------------- */
  function fieldInput(f, val) {
    const v = val == null ? (f.def != null ? f.def : '') : val;
    if (f.type === 'textarea') return `<textarea id="f_${f.key}" ${f.ph ? 'placeholder="' + esc(f.ph) + '"' : ''}>${esc(v)}</textarea>`;
    if (f.type === 'select') return `<select id="f_${f.key}">${f.options.map(o =>
      `<option value="${o}" ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    if (f.type === 'checkbox') return `<input type="checkbox" id="f_${f.key}" ${v ? 'checked' : ''}>`;
    if (f.type === 'multicheck') return `<div class="multi">${f.options.map(o => {
      const arr = Array.isArray(val) ? val : [];
      return `<label class="chk"><input type="checkbox" data-mc="${f.key}" value="${o}" ${arr.includes(o) ? 'checked' : ''}>${o}</label>`;
    }).join('')}</div>`;
    if (f.type === 'image') return `<div class="img-up"><input type="file" accept="image/*" id="f_${f.key}_file">
      <input type="hidden" id="f_${f.key}" value="${esc(v)}">
      ${v ? `<img src="${esc(v)}" class="thumb-prev">` : ''}</div>`;
    if (f.type === 'date') return `<input type="date" id="f_${f.key}" value="${esc(v)}">`;
    if (f.type === 'number') return `<input type="number" step="any" id="f_${f.key}" value="${esc(v)}">`;
    return `<input type="text" id="f_${f.key}" value="${esc(v)}">`;
  }

  function openForm(tab, editId, preset) {
    const rec = editId ? Store.getList(tab).find(r => r._id === editId) : null;
    const title = rec ? '编辑' : '新增';
    const body = tab.fields.map(f =>
      `<div class="form-row"><label>${esc(f.label)}${f.required ? '<i>*</i>' : ''}</label>${fieldInput(f, rec ? rec[f.key] : (preset ? preset[f.key] : undefined))}</div>`
    ).join('');
    openModal(`${esc(tab.name)} · ${title}`, `<form id="rec-form">${body}
      <div class="form-actions">
        <button type="button" class="btn-secondary" id="form-cancel">取消</button>
        <button type="submit" class="btn-primary">确认保存</button>
      </div></form>`);
    document.getElementById('form-cancel').onclick = closeModal;
    // 图片上传压缩
    tab.fields.filter(f => f.type === 'image').forEach(f => {
      const file = document.getElementById(`f_${f.key}_file`);
      if (file) file.onchange = () => {
        const f0 = file.files[0];
        if (!f0) return;
        resizeImage(f0, 1280, data => {
          document.getElementById(`f_${f.key}`).value = data;
          const prev = document.querySelector('.img-up .thumb-prev');
          if (prev) prev.src = data;
        });
      };
    });
    document.getElementById('rec-form').onsubmit = (e) => {
      e.preventDefault();
      const obj = {};
      tab.fields.forEach(f => {
        if (f.type === 'checkbox') obj[f.key] = document.getElementById(`f_${f.key}`).checked;
        else if (f.type === 'multicheck') {
          obj[f.key] = Array.from(document.querySelectorAll(`[data-mc="${f.key}"]:checked`)).map(x => x.value);
        } else if (f.type === 'image') obj[f.key] = document.getElementById(`f_${f.key}`).value;
        else if (f.type === 'number') obj[f.key] = document.getElementById(`f_${f.key}`).value === '' ? '' : parseFloat(document.getElementById(`f_${f.key}`).value);
        else obj[f.key] = document.getElementById(`f_${f.key}`).value;
      });
      if (preset) Object.assign(obj, preset);
      if (editId) Store.updateRecord(tab, editId, obj);
      else Store.addRecord(tab, obj);
      closeModal();
      renderContent();
    };
  }

  /* ---------------- 预算 Tab ---------------- */
  function renderBudget(tab) {
    const mod = MODULE_MAP[state.module];
    const grp = mod ? mod.group : 'life';
    const items = Store.getList({ collection: 'items' });
    const spent = items.filter(r => r.status === '已买').reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 1), 0);
    const target = Store.getSetting('budgetTarget', 0);
    const left = target - spent;
    const pct = target > 0 ? Math.min(100, (spent / target) * 100) : 0;
    const over = left < 0;
    return `<div class="budget-card group-${grp}">
      <div class="budget-row"><span>总预算(${tab.currency})</span>
        <input type="number" id="bud-target" value="${target}"></div>
      <div class="budget-row"><span>已花(已买)</span><b>${tab.currency}${spent.toFixed(2)}</b></div>
      <div class="budget-row"><span>剩余</span><b class="${over ? 'down' : 'up'}">${tab.currency}${left.toFixed(2)}</b></div>
      <div class="progress"><div class="progress-bar" style="width:${pct}%; background:${over ? 'linear-gradient(90deg,var(--life),#FFAFB8)' : 'linear-gradient(90deg,var(--work),#8FD3FF)'}"></div></div>
    </div>`;
  }

  /* ---------------- 体重折线图 ---------------- */
  function renderWeightChart() {
    const list = Store.getList({ collection: 'weight' }).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    if (list.length < 2) return '';
    const w = list.map(r => parseFloat(r.weight)).filter(x => !isNaN(x));
    const min = Math.min(...w), max = Math.max(...w);
    const pad = (max - min) * 0.15 || 1;
    const lo = min - pad, hi = max + pad;
    const W = 600, H = 180, ml = 36, mb = 24;
    const n = list.length;
    const pts = list.map((r, i) => {
      const x = ml + (W - ml) * (i / (n - 1));
      const y = mb + (H - mb) * (1 - (parseFloat(r.weight) - lo) / (hi - lo));
      return [x, y, r.date, r.weight];
    });
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const dots = pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" class="dot"/><title>${p[2]}: ${p[3]}kg</title>`).join('');
    return `<div class="chart-box"><svg viewBox="0 0 ${W} ${H}" class="line-chart">
      <line x1="${ml}" y1="${H - mb}" x2="${W}" y2="${H - mb}" class="axis"/>
      <line x1="${ml}" y1="0" x2="${ml}" y2="${H - mb}" class="axis"/>
      <path d="${line}" class="line"/>
      ${dots}</svg></div>`;
  }

  /* ---------------- 运动对比画廊 ---------------- */
  function renderGallery(tab) {
    const list = Store.getList(tab).filter(r => r.photo);
    if (!list.length) return '';
    return `<div class="gallery"><h4>运动对比照</h4><div class="gallery-grid">` +
      list.map(r => `<figure><img src="${esc(r.photo)}"><figcaption>${esc(r.date)} · ${esc(r.item)}</figcaption></figure>`).join('') +
      `</div></div>`;
  }

  /* ============================================================
   * 特例渲染分发
   * ============================================================ */
  function getSpecialRenderer(modId, tabId) {
    const map = {
      'life:items': renderShopping,
      'life:events': renderEventsCard,
      'study:today': renderStudyToday,
      'study:history': renderStudyHistory,
      'travel:destinations': renderTravelDest,
      'fun:items': renderFunList,
      'files:files': renderFilesIdx,
      'discipline:lifeTodos': renderLifeTodos,
      'discipline:habits': renderHabits,
      'discipline:fitDaily': renderFitnessDaily,
      'discipline:weight': renderWeightTab,
      'rigong:overview': renderRigongOverview,
      'money:overview': renderMoneyOverview,
      'money:flows': renderMoneyFlows,
      'money:goals': renderMoneyGoals,
      'jikui:todos': renderJikuiTodos,
    };
    return map[modId + ':' + tabId] || null;
  }

  function bindSpecial(modId, tab) {
    const root = document.getElementById('tab-body');
    if (!root) return;
    root.querySelectorAll('[data-edit]').forEach(b =>
      b.onclick = () => openForm(tab, b.dataset.edit));
    root.querySelectorAll('[data-del]').forEach(b =>
      b.onclick = () => { if (confirm('确定删除这条记录？')) { Store.deleteRecord(tab, b.dataset.del); renderContent(); } });
    root.querySelectorAll('[data-toggle]').forEach(b => {
      const handler = () => {
        const colKey = b.dataset.col ? { collection: b.dataset.col } : tab;
        const rec = Store.getList(colKey).find(r => r._id === b.dataset.toggle);
        if (rec) {
          const key = b.dataset.key;
          const on = b.dataset.on || '完成';
          const off = b.dataset.off || '待办';
          if (key === 'done') rec[key] = b.checked;
          else if (b.tagName === 'BUTTON') rec[key] = rec[key] === on ? off : on;
          else rec[key] = b.checked ? on : off;
          Store.updateRecord(colKey, rec._id, rec);
          renderContent();
        }
      };
      if (b.tagName === 'BUTTON') b.onclick = handler;
      else b.onchange = handler;
    });
    const addBtn = document.getElementById('add-btn') || document.getElementById('special-add');
    if (addBtn) addBtn.onclick = () => openForm(tab, null);
    const addBar = document.getElementById('quick-add-bar');
    if (addBar) addBar.onkeydown = e => {
      if (e.key === 'Enter') {
        const input = document.getElementById('quick-add-input');
        if (!input || !input.value.trim()) return;
        const obj = {};
        tab.fields.forEach(f => { obj[f.key] = f.def != null ? f.def : (f.type === 'checkbox' ? false : ''); });
        obj[tab.fields.find(f => f.required)?.key || tab.fields[0].key] = input.value.trim();
        if (!obj.date) obj.date = todayKey();
        Store.addRecord(tab, obj);
        input.value = '';
        renderContent();
      }
    };
  }

  /* ---------------- 热力图 HTML ---------------- */
  function heatmapHtml(dates, valueKey, colorClass) {
    const map = {};
    (dates || []).forEach(d => { if (d.date) map[d.date] = (map[d.date] || 0) + (parseFloat(d[valueKey]) || 1); });
    const max = Math.max(1, ...Object.values(map));
    const today = new Date(); const dayMs = 86400000;
    let html = `<div class="habit-heatmap ${esc(colorClass || '')}">`;
    for (let w = 0; w < 14; w++) {
      for (let d = 0; d < 7; d++) {
        const offset = (13 - w) * 7 + (6 - d);
        const dt = new Date(today.getTime() - offset * dayMs);
        const key = dt.toISOString().slice(0, 10);
        const val = map[key] || 0;
        let level = 0;
        if (val > 0) level = Math.min(4, Math.ceil((val / max) * 4));
        html += `<div class="habit-day l${level}" title="${key}: ${val}"></div>`;
      }
    }
    return html + `</div>`;
  }

  /* ============================================================
   * 购物清单
   * ============================================================ */
  function renderShopping(tab) {
    const items = Store.getList(tab);
    const total = items.length;
    const bought = items.filter(r => r.status === '已买').length;
    const cancelled = items.filter(r => r.status === '已取消').length;
    const spent = items.filter(r => r.status === '已买').reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 1), 0);
    const target = Store.getSetting('budgetTarget', 0);
    const pct = target > 0 ? Math.min(100, (spent / target) * 100) : 0;
    const completePct = total ? Math.round((bought / total) * 100) : 0;
    const cats = {};
    items.forEach(it => { const c = it.cat || '其他'; (cats[c] = cats[c] || []).push(it); });
    let groups = '';
    Object.entries(cats).forEach(([cat, list]) => {
      groups += `<div class="shop-group">
        <div class="shop-group-head">${esc(cat)} <span style="margin-left:auto;color:var(--text-3);font-size:12px;font-weight:500;">${list.filter(r => r.status === '已买').length}/${list.length}</span></div>
        ${list.map(it => `
          <div class="shop-item">
            <input type="checkbox" data-toggle="${it._id}" data-key="status" data-on="已买" data-off="未买" ${it.status === '已买' ? 'checked' : ''}>
            <span class="shop-item-name" style="${it.status === '已买' ? 'text-decoration:line-through;opacity:.55;' : ''}${it.status === '已取消' ? 'opacity:.4;' : ''}">${esc(it.name)}</span>
            ${it.price ? `<span class="shop-item-price">€${parseFloat(it.price).toFixed(0)}</span>` : ''}
            <button class="shop-item-del" data-edit="${it._id}">✎</button>
            <button class="shop-item-del" data-del="${it._id}">×</button>
          </div>`).join('')}
      </div>`;
    });
    const empty = !items.length ? `<div class="empty-state"><div class="empty-state-icon">🛒</div><div class="empty-state-text">还没有购物记录，点击右上角 + 添加</div></div>` : '';
    return `
      <div class="shop-progress">
        <div class="shop-progress-row">
          <div><div class="shop-progress-big">${completePct}%<small>完成进度</small></div></div>
          <div><div class="shop-progress-big">€${spent.toFixed(0)}<small>已花 / 预算 €${target || 0}</small></div></div>
        </div>
        <div class="shop-budget-bar"><div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
        <div class="shop-budget-info"><span>已买 ${bought}/${total} · 取消 ${cancelled}</span><span>${target > 0 ? '剩余 €' + (target - spent).toFixed(0) : '未设预算'}</span></div></div>
      </div>
      ${empty}
      ${groups}`;
  }

  /* ============================================================
   * 纪念日卡片
   * ============================================================ */
  function renderEventsCard(tab) {
    const list = Store.getList(tab);
    if (!list.length) return `<div class="empty-state"><div class="empty-state-icon">💝</div><div class="empty-state-text">还没有纪念日，点击 + 添加</div></div>`;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const items = list.map(r => {
      const parts = (r.date || '').split('-').map(Number);
      let days = Infinity;
      if (parts.length === 3 && !parts.some(isNaN)) {
        let next = new Date(today.getFullYear(), parts[1] - 1, parts[2]);
        if (r.repeatYearly && next < today) next.setFullYear(today.getFullYear() + 1);
        else if (next < today) next = null;
        if (next) days = Math.round((next - today) / 86400000);
      }
      let tail = days === Infinity ? '已过' : days === 0 ? '今天' : days === 1 ? '明天' : `还有${days}天`;
      return `<div class="app-card">
        <div class="app-card-head">
          <span class="app-card-title">${esc(r.name)}</span>
          <span class="app-card-ops"><button data-edit="${r._id}">编辑</button><button class="danger" data-del="${r._id}">删</button></span>
        </div>
        <div class="app-card-body">
          <p><span class="tag">${esc(r.type || '纪念日')}</span> ${r.date || ''} ${r.repeatYearly ? '· 每年' : ''}</p>
          <p style="font-size:16px;font-weight:700;color:var(--life-deep);">${tail}</p>
        </div>
      </div>`;
    }).join('');
    return items;
  }

  /* ============================================================
   * 学习专区
   * ============================================================ */
  function renderStudyToday(tab) {
    const all = Store.getList(tab);
    const tk = todayKey();
    const today = all.filter(r => r.date === tk);
    const active = all.filter(r => r.status === '进行中' || r.status === '计划');
    const totalMin = today.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">${today.length}</div><div class="stat-label">今日任务</div></div>
      <div class="stat-card group-work"><div class="stat-value">${active.length}</div><div class="stat-label">进行中</div></div>
      <div class="stat-card group-work"><div class="stat-value">${Math.round(totalMin)}</div><div class="stat-label">今日分钟</div></div>
    </div>`;
    const timerHtml = `<div class="focus-timer" id="focus-timer">
      <div class="focus-timer-display" id="timer-display">00:00</div>
      <button class="btn-primary" id="timer-start">▶ 开始专注</button>
      <span class="focus-timer-task" id="timer-task"></span>
    </div>`;
    const empty = !active.length ? `<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">还没有学习任务，点击 + 添加</div></div>` : '';
    const cards = active.map(r => `<div class="app-card">
      <div class="app-card-head">
        <span class="app-card-title">${esc(r.topic || '学习')} · ${esc(r.goal || '今日目标')}</span>
        <span class="app-card-ops">
          <button data-focus="${r._id}">专注</button>
          <button data-complete="${r._id}">完成</button>
          <button data-edit="${r._id}">编辑</button>
          <button class="danger" data-del="${r._id}">删</button>
        </span>
      </div>
      <div class="app-card-body">
        <p><span class="tag">${esc(r.status)}</span> ${r.duration ? '已学 ' + r.duration + ' 分' : ''} ${r.ref ? '· 资料 ' + esc(r.ref) : ''}</p>
        ${r.summary ? `<p>${esc(r.summary)}</p>` : ''}
      </div>
    </div>`).join('');
    return stats + timerHtml + empty + cards;
  }

  function renderStudyHistory(tab) {
    const all = Store.getList(tab).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const totalMin = all.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
    const topics = {};
    all.forEach(r => { const t = r.topic || '其他'; topics[t] = (topics[t] || 0) + (parseFloat(r.duration) || 0); });
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">${all.length}</div><div class="stat-label">总记录</div></div>
      <div class="stat-card group-work"><div class="stat-value">${Math.round(totalMin / 60 * 10) / 10}</div><div class="stat-label">总小时</div></div>
      <div class="stat-card group-work"><div class="stat-value">${Object.keys(topics).length}</div><div class="stat-label">主题数</div></div>
    </div>`;
    if (!all.length) return stats + `<div class="empty-state"><div class="empty-state-icon">📜</div><div class="empty-state-text">还没有学习记录</div></div>`;
    const heat = `<div class="habit-section">
      <div class="habit-section-head"><span class="habit-section-title">📅 学习热力图</span><span class="habit-section-stat">累计 ${all.length} 次</span></div>
      ${heatmapHtml(all, 'duration', '')}
    </div>`;
    const topicBars = miniBars(Object.entries(topics).map(([k, v]) => ({ label: k, value: Math.round(v) })), Math.max(...Object.values(topics), 1));
    const topicHtml = `<div class="habit-section"><div class="habit-section-title" style="margin-bottom:10px;">各主题时长</div>${topicBars}</div>`;
    const cards = all.slice(0, 30).map(r => `<div class="app-card">
      <div class="app-card-head">
        <span class="app-card-title">${esc(r.topic || '学习')} · ${r.date || ''}</span>
        <span class="app-card-ops"><button data-edit="${r._id}">编辑</button><button class="danger" data-del="${r._id}">删</button></span>
      </div>
      <div class="app-card-body">
        <p><span class="tag">${esc(r.status)}</span> ${r.duration ? r.duration + ' 分' : ''}</p>
        ${r.goal ? `<p>目标：${esc(r.goal)}</p>` : ''}
        ${r.summary ? `<p>${esc(r.summary)}</p>` : ''}
      </div>
    </div>`).join('');
    return stats + heat + topicHtml + cards;
  }

  /* ============================================================
   * 旅行目的地
   * ============================================================ */
  function renderTravelDest(tab) {
    const list = Store.getList(tab);
    const visited = list.filter(r => r.status === '已打卡').length;
    const stats = `<div class="stat-row">
      <div class="stat-card group-life"><div class="stat-value">${list.length}</div><div class="stat-label">目的地</div></div>
      <div class="stat-card group-life"><div class="stat-value">${visited}</div><div class="stat-label">已打卡</div></div>
      <div class="stat-card group-life"><div class="stat-value">${list.length - visited}</div><div class="stat-label">待打卡</div></div>
    </div>`;
    if (!list.length) return stats + `<div class="empty-state"><div class="empty-state-icon">✈️</div><div class="empty-state-text">还没有想去的地方，点击 + 添加</div></div>`;
    const cards = list.map(r => `<div class="travel-card">
      <div class="travel-card-head">
        <div style="display:flex;gap:10px;align-items:center;">
          ${r.thumb ? `<img src="${esc(r.thumb)}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;">` : ''}
          <div><div class="travel-city">${esc(r.city)}</div></div>
        </div>
        <span class="travel-status" style="${r.status === '已打卡' ? 'background:rgba(22,163,74,.12);color:#16a34a;' : ''}">${esc(r.status)}</span>
      </div>
      <div class="travel-details">
        ${r.spots ? `<div class="travel-detail"><span class="travel-detail-icon">📍</span><span class="travel-detail-label">景点</span><span class="travel-detail-value">${esc(r.spots)}</span></div>` : ''}
        ${r.ticket ? `<div class="travel-detail"><span class="travel-detail-icon">🎫</span><span class="travel-detail-label">票价</span><span class="travel-detail-value">${esc(r.ticket)}</span></div>` : ''}
        ${r.transport ? `<div class="travel-detail"><span class="travel-detail-icon">🚆</span><span class="travel-detail-label">交通</span><span class="travel-detail-value">${esc(r.transport)}</span></div>` : ''}
        ${r.food ? `<div class="travel-detail"><span class="travel-detail-icon">🍜</span><span class="travel-detail-label">美食</span><span class="travel-detail-value">${esc(r.food)}</span></div>` : ''}
        ${r.goDate ? `<div class="travel-detail"><span class="travel-detail-icon">📅</span><span class="travel-detail-label">出行</span><span class="travel-detail-value">${r.goDate}</span></div>` : ''}
        ${r.budget ? `<div class="travel-detail"><span class="travel-detail-icon">💰</span><span class="travel-detail-label">预算</span><span class="travel-detail-value">€${parseFloat(r.budget).toFixed(0)}</span></div>` : ''}
      </div>
      ${r.feishu ? `<a href="${esc(r.feishu)}" target="_blank" rel="noopener" class="feishu-link">📄 飞书完整攻略</a>` : ''}
      <div class="app-card-ops" style="margin-top:10px;justify-content:flex-end;">
        <button data-toggle="${r._id}" data-key="status" data-on="已打卡" data-off="待打卡" style="appearance:none;border:none;background:rgba(220,230,245,.4);border-radius:8px;padding:4px 10px;font-size:12px;cursor:pointer;">${r.status === '已打卡' ? '✓ 已打卡' : '打卡'}</button>
        <button data-edit="${r._id}">编辑</button>
        <button class="danger" data-del="${r._id}">删</button>
      </div>
    </div>`).join('');
    return stats + cards;
  }

  /* ============================================================
   * 娱乐清单
   * ============================================================ */
  function renderFunList(tab) {
    const items = Store.getList(tab);
    const year = new Date().getFullYear();
    const watched = items.filter(r => r.status === '看完' && (r.date || '').startsWith(year));
    const avgRating = watched.length ? (watched.reduce((s, r) => s + (parseFloat(r.rating) || 0), 0) / watched.length).toFixed(1) : '—';
    const stats = `<div class="stat-row">
      <div class="stat-card group-life"><div class="stat-value">${items.filter(r => r.status === '想看').length}</div><div class="stat-label">想看</div></div>
      <div class="stat-card group-life"><div class="stat-value">${items.filter(r => r.status === '在看').length}</div><div class="stat-label">在看</div></div>
      <div class="stat-card group-life"><div class="stat-value">${watched.length}</div><div class="stat-label">今年看完</div></div>
      <div class="stat-card group-life"><div class="stat-value">${avgRating}</div><div class="stat-label">平均评分</div></div>
    </div>`;
    const wantItems = items.filter(r => r.status === '想看');
    const recommend = wantItems.length ? `<div class="habit-section" style="text-align:center;">
      <button class="btn-primary" id="fun-random">🎲 今天看什么？</button>
      <div id="fun-random-result" style="margin-top:10px;font-size:18px;font-weight:700;"></div>
    </div>` : '';
    if (!items.length) return stats + recommend + `<div class="empty-state"><div class="empty-state-icon">🎬</div><div class="empty-state-text">还没有娱乐记录，点击 + 添加</div></div>`;
    const list = items.map(r => `<div class="app-card">
      <div class="app-card-head">
        <span class="app-card-title">${esc(r.name)}</span>
        <span class="app-card-ops"><button data-edit="${r._id}">编辑</button><button class="danger" data-del="${r._id}">删</button></span>
      </div>
      <div class="app-card-body">
        <p><span class="tag">${esc(r.cat || '其他')}</span> <span class="tag" style="background:rgba(255,154,174,.12);color:var(--life-deep);">${esc(r.status)}</span> ${r.rating ? '⭐ ' + r.rating : ''} ${r.platform ? '· ' + esc(r.platform) : ''}</p>
        ${r.review ? `<p>${esc(r.review)}</p>` : ''}
      </div>
    </div>`).join('');
    return stats + recommend + list;
  }

  /* ============================================================
   * 文件区 / 证件索引
   * ============================================================ */
  function renderFilesIdx(tab) {
    const list = Store.getList(tab);
    const cats = ['证件', '合同', '财务', '保单', '学习', '工作', '图片'];
    const tk = todayKey();
    const expiring = list.filter(r => r.expire && r.expire >= tk).sort((a, b) => (a.expire || '').localeCompare(b.expire || ''));
    const stats = `<div class="stat-row">
      <div class="stat-card group-life"><div class="stat-value">${list.length}</div><div class="stat-label">文件总数</div></div>
      <div class="stat-card group-life"><div class="stat-value">${cats.length}</div><div class="stat-label">分类</div></div>
      <div class="stat-card group-life"><div class="stat-value">${expiring.length}</div><div class="stat-label">有到期日</div></div>
    </div>`;
    if (!list.length) return stats + `<div class="empty-state"><div class="empty-state-icon">🗂️</div><div class="empty-state-text">还没有文件记录，点击 + 添加</div></div>`;
    let html = stats;
    cats.forEach(cat => {
      const cl = list.filter(r => r.cat === cat);
      if (!cl.length) return;
      html += `<div class="shop-group">
        <div class="shop-group-head">${cat} <span style="margin-left:auto;color:var(--text-3);font-size:12px;">${cl.length}</span></div>
        ${cl.map(r => `<div class="shop-item">
          <span class="shop-item-name">${esc(r.name)}</span>
          ${r.expire ? `<span class="shop-item-price" style="background:${r.expire < tk ? 'rgba(255,154,174,.25);color:var(--life-deep)' : 'rgba(220,230,245,.4)'}">到期 ${r.expire}</span>` : ''}
          <button class="shop-item-del" data-edit="${r._id}">✎</button>
          <button class="shop-item-del" data-del="${r._id}">×</button>
        </div>`).join('')}
      </div>`;
    });
    return html;
  }

  /* ============================================================
   * 每日待办（discipline lifeTodos）
   * ============================================================ */
  function renderLifeTodos(tab) {
    const todos = Store.getList(tab);
    const total = todos.length;
    const done = todos.filter(r => r.status === '完成').length;
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">${total}</div><div class="stat-label">待办总数</div></div>
      <div class="stat-card group-work"><div class="stat-value">${done}</div><div class="stat-label">已完成</div></div>
      <div class="stat-card group-work"><div class="stat-value">${Math.round((total ? done / total : 0) * 100)}%</div><div class="stat-label">完成率</div></div>
    </div>`;
    if (!todos.length) return stats + `<div class="add-bar"><input type="text" id="quick-add-input" placeholder="添加待办…回车确认"><button id="special-add">+</button></div>`;
    const items = todos.map(r => `<div class="todo-item">
      <input type="checkbox" class="todo-check" data-toggle="${r._id}" data-key="status" data-on="完成" data-off="待办" ${r.status === '完成' ? 'checked' : ''}>
      <div class="todo-main">
        <div class="todo-title" style="${r.status === '完成' ? 'text-decoration:line-through;opacity:.55;' : ''}">${esc(r.item)}</div>
        <div class="todo-meta">${esc(r.domain || '')} ${r.due ? '· 截止 ' + r.due : ''} ${r.priority ? '· ' + r.priority : ''}</div>
      </div>
      <button class="shop-item-del" data-edit="${r._id}">✎</button>
      <button class="shop-item-del" data-del="${r._id}">×</button>
    </div>`).join('');
    return stats + `<div class="todo-list">${items}</div>` + `<div class="add-bar"><input type="text" id="quick-add-input" placeholder="添加待办…回车确认"><button id="special-add">+</button></div>`;
  }

  /* ============================================================
   * 习惯热力
   * ============================================================ */
  function renderHabits(tab) {
    const logs = Store.getList(tab);
    const habits = ['看书', '早睡早起', '运动打卡', '学习', '其他'];
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">${logs.length}</div><div class="stat-label">总打卡</div></div>
      <div class="stat-card group-work"><div class="stat-value">${new Set(logs.map(r => r.date).filter(Boolean)).size}</div><div class="stat-label">打卡天数</div></div>
    </div>`;
    if (!logs.length) return stats + `<div class="empty-state"><div class="empty-state-icon">🔥</div><div class="empty-state-text">还没有习惯打卡，点击 + 添加</div></div>`;
    return stats + habits.map(h => {
      const hl = logs.filter(r => r.habit === h);
      if (!hl.length) return '';
      return `<div class="habit-section">
        <div class="habit-section-head"><span class="habit-section-title">${esc(h)}</span><span class="habit-section-stat">${hl.length} 次</span></div>
        ${heatmapHtml(hl, 'note', '')}
      </div>`;
    }).join('');
  }

  /* ============================================================
   * 运动每日打卡
   * ============================================================ */
  function renderFitnessDaily(tab) {
    const list = Store.getList(tab);
    const totalMin = list.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
    const completed = list.filter(r => r.done).length;
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">${list.length}</div><div class="stat-label">运动项目</div></div>
      <div class="stat-card group-work"><div class="stat-value">${Math.round(totalMin)}</div><div class="stat-label">总分钟</div></div>
      <div class="stat-card group-work"><div class="stat-value">${completed}</div><div class="stat-label">已完成</div></div>
    </div>`;
    const gallery = renderGallery(tab);
    if (!list.length) return stats + `<div class="empty-state"><div class="empty-state-icon">🏃</div><div class="empty-state-text">还没有运动记录，点击 + 添加</div></div>`;
    const items = list.map(r => `<div class="todo-item">
      <input type="checkbox" class="todo-check" data-toggle="${r._id}" data-key="done" ${r.done ? 'checked' : ''}>
      <div class="todo-main">
        <div class="todo-title" style="${r.done ? 'text-decoration:line-through;opacity:.55;' : ''}">${esc(r.item)}</div>
        <div class="todo-meta">${r.date || ''} · ${r.duration || 0} 分钟 · ${r.calories || 0} kcal</div>
      </div>
      <button class="shop-item-del" data-edit="${r._id}">✎</button>
      <button class="shop-item-del" data-del="${r._id}">×</button>
    </div>`).join('');
    return stats + gallery + `<div class="todo-list">${items}</div>`;
  }

  /* ============================================================
   * 体重 Tab（图表 + 列表）
   * ============================================================ */
  function renderWeightTab(tab) {
    const chart = renderWeightChart();
    const list = Store.getList(tab).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!list.length) return chart + `<div class="empty-state"><div class="empty-state-icon">⚖️</div><div class="empty-state-text">还没有体重记录，点击 + 添加</div></div>`;
    const items = list.map(r => `<div class="app-card">
      <div class="app-card-head">
        <span class="app-card-title">${r.date || ''} · ${esc(r.weight)}kg</span>
        <span class="app-card-ops"><button data-edit="${r._id}">编辑</button><button class="danger" data-del="${r._id}">删</button></span>
      </div>
      <div class="app-card-body"><p>${r.bodyfat ? '体脂 ' + r.bodyfat + '%' : ''} ${r.goal ? '· 目标 ' + r.goal + 'kg' : ''}</p></div>
    </div>`).join('');
    return chart + items;
  }

  /* ============================================================
   * 日拱一卒 - 进度总览
   * ============================================================ */
  function renderRigongOverview(tab) {
    const study = Store.getList({ collection: 'studyTasks' });
    const habits = Store.getList({ collection: 'habitLogs' });
    const daily = Store.getList({ collection: 'daily' }).filter(r => r.done);
    const diary = Store.getList({ collection: 'rigongLogs' });
    // 聚合拱卒日期
    const archDates = {};
    [...study, ...habits, ...daily].forEach(r => { if (r.date) archDates[r.date] = (archDates[r.date] || 0) + 1; });
    const allDates = Object.keys(archDates);
    // Streak
    const today = new Date(); const dayMs = 86400000;
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const dt = new Date(today.getTime() - i * dayMs);
      const key = dt.toISOString().slice(0, 10);
      if (archDates[key]) streak++;
      else if (i > 0) break;
    }
    // 年度进度
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / dayMs);
    const yearPct = Math.round((allDates.length / dayOfYear) * 100);
    const totalMin = study.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">🔥 ${streak}</div><div class="stat-label">连续天数</div></div>
      <div class="stat-card group-work"><div class="stat-value">${allDates.length}</div><div class="stat-label">拱卒天数</div></div>
      <div class="stat-card group-work"><div class="stat-value">${yearPct}%</div><div class="stat-label">年度进度</div></div>
      <div class="stat-card group-work"><div class="stat-value">${Math.round(totalMin / 60 * 10) / 10}h</div><div class="stat-label">学习时长</div></div>
    </div>`;
    const heatData = allDates.map(d => ({ date: d, value: archDates[d] }));
    const heat = `<div class="habit-section">
      <div class="habit-section-head"><span class="habit-section-title">📅 年度拱卒热力图</span><span class="habit-section-stat">${allDates.length} 天有进益</span></div>
      ${heatmapHtml(heatData, 'value', '')}
    </div>`;
    // 名言墙
    const qIdx = Store.getSetting('quoteIdx', 0);
    const q = QUOTES[qIdx] || QUOTES[0];
    const quoteWall = `<div class="app-card" style="text-align:center;background:var(--card-work);">
      <div style="font-size:16px;font-weight:700;line-height:1.6;">"${esc(q.t)}"</div>
      <div style="color:var(--text-3);margin-top:6px;">—— ${esc(q.a)}</div>
    </div>`;
    // 今日一得预览
    const tk = todayKey();
    const todayDiary = diary.filter(r => r.date === tk);
    const diaryPreview = todayDiary.length ? `<div class="app-card"><div class="app-card-body"><p>📝 今日一得：${esc(todayDiary[0].note)}</p></div></div>` : '';
    return stats + heat + quoteWall + diaryPreview;
  }

  /* ============================================================
   * 资金管理
   * ============================================================ */
  function renderMoneyOverview(tab) {
    const assets = Store.getList({ collection: 'moneyAssets' });
    const invest = Store.getList({ collection: 'moneyInvest' });
    const flows = Store.getList({ collection: 'flows' });
    const ym = todayKey().slice(0, 7);
    const month = flows.filter(r => (r.date || '').startsWith(ym));
    const inc = month.filter(r => r.direction === '收入').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const exp = month.filter(r => r.direction === '支出').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const assetTotal = assets.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const investTotal = invest.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0), 0);
    const netWorth = assetTotal + investTotal;
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">€${netWorth.toFixed(0)}</div><div class="stat-label">净资产</div></div>
      <div class="stat-card group-work"><div class="stat-value" style="color:var(--life-deep);">€${inc.toFixed(0)}</div><div class="stat-label">本月收入</div></div>
      <div class="stat-card group-work"><div class="stat-value" style="color:#16a34a;">€${exp.toFixed(0)}</div><div class="stat-label">本月支出</div></div>
      <div class="stat-card group-work"><div class="stat-value">€${(inc - exp).toFixed(0)}</div><div class="stat-label">结余</div></div>
    </div>`;
    const subs = Store.getList({ collection: 'moneySubs' });
    const tk = todayKey();
    const upcomingSubs = subs.filter(r => r.nextDate && r.nextDate >= tk).sort((a, b) => (a.nextDate || '').localeCompare(b.nextDate || ''));
    const subsHtml = upcomingSubs.length ? `<div class="habit-section"><div class="habit-section-title" style="margin-bottom:10px;">🔔 即将到期订阅</div>${upcomingSubs.slice(0, 5).map(r => `<div class="reminder-item"><span>💳</span><span>${esc(r.name)}</span><small>${r.nextDate} · €${parseFloat(r.amount || 0).toFixed(0)}</small></div>`).join('')}</div>` : '';
    return stats + subsHtml + `<div class="empty-state"><div class="empty-state-text">切换上方 Tab 查看资产、投资、流水、预算、目标等详情</div></div>`;
  }

  function renderMoneyFlows(tab) {
    const flows = Store.getList(tab);
    const ym = todayKey().slice(0, 7);
    const month = flows.filter(r => (r.date || '').startsWith(ym));
    const inc = month.filter(r => r.direction === '收入').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const exp = month.filter(r => r.direction === '支出').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value" style="color:var(--life-deep);">€${inc.toFixed(0)}</div><div class="stat-label">本月收入</div></div>
      <div class="stat-card group-work"><div class="stat-value" style="color:#16a34a;">€${exp.toFixed(0)}</div><div class="stat-label">本月支出</div></div>
      <div class="stat-card group-work"><div class="stat-value">€${(inc - exp).toFixed(0)}</div><div class="stat-label">结余</div></div>
    </div>`;
    if (!flows.length) return stats + `<div class="empty-state"><div class="empty-state-icon">💶</div><div class="empty-state-text">还没有收支记录，点击 + 添加</div></div>`;
    const recent = flows.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 30);
    const list = recent.map(r => `<div class="app-card">
      <div class="app-card-head">
        <span class="app-card-title">${esc(r.category || '其他')}</span>
        <span class="app-card-ops"><button data-edit="${r._id}">编辑</button><button class="danger" data-del="${r._id}">删</button></span>
      </div>
      <div class="app-card-body">
        <p><span class="tag" style="background:${r.direction === '收入' ? 'rgba(255,154,174,.12)' : 'rgba(110,184,255,.12)'};color:${r.direction === '收入' ? 'var(--life-deep)' : 'var(--work-deep)'}">${esc(r.direction)}</span> <b>€${parseFloat(r.amount || 0).toFixed(2)}</b> · ${esc(r.account || '未分类')}</p>
        ${r.date ? `<p>${r.date}</p>` : ''} ${r.note ? `<p>${esc(r.note)}</p>` : ''}
      </div>
    </div>`).join('');
    return stats + list;
  }

  function renderMoneyGoals(tab) {
    const goals = Store.getList(tab);
    if (!goals.length) return `<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">还没有储蓄目标，点击 + 添加</div></div>`;
    return goals.map(r => {
      const target = parseFloat(r.target) || 0;
      const cur = parseFloat(r.current) || 0;
      const pct = target > 0 ? Math.min(100, (cur / target) * 100) : 0;
      const r2 = 52, cx = 60, cy = 60;
      const circ = 2 * Math.PI * r2;
      const dash = (pct / 100) * circ;
      return `<div class="app-card" style="display:flex;align-items:center;gap:16px;">
        <svg viewBox="0 0 120 120" style="width:80px;height:80px;flex-shrink:0;">
          <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="rgba(220,230,245,.4)" stroke-width="10"/>
          <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="var(--work)" stroke-width="10"
            stroke-dasharray="${dash} ${circ}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
        </svg>
        <div style="flex:1;">
          <div class="app-card-head">
            <span class="app-card-title">${esc(r.name)}</span>
            <span class="app-card-ops"><button data-edit="${r._id}">编辑</button><button class="danger" data-del="${r._id}">删</button></span>
          </div>
          <div class="app-card-body"><p>€${cur.toFixed(0)} / €${target.toFixed(0)} · ${Math.round(pct)}%</p></div>
        </div>
      </div>`;
    }).join('');
  }

  /* ============================================================
   * 积跬公司待办
   * ============================================================ */
  function renderJikuiTodos(tab) {
    const todos = Store.getList(tab);
    const total = todos.length;
    const done = todos.filter(r => r.status === '完成').length;
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">${total}</div><div class="stat-label">待办总数</div></div>
      <div class="stat-card group-work"><div class="stat-value">${done}</div><div class="stat-label">已完成</div></div>
      <div class="stat-card group-work"><div class="stat-value">${Math.round((total ? done / total : 0) * 100)}%</div><div class="stat-label">完成率</div></div>
    </div>`;
    if (!todos.length) return stats + `<div class="empty-state"><div class="empty-state-icon">🌱</div><div class="empty-state-text">还没有待办，点击 + 添加</div></div>`;
    const items = todos.map(r => `<div class="todo-item">
      <input type="checkbox" class="todo-check" data-toggle="${r._id}" data-key="status" data-on="完成" data-off="待办" ${r.status === '完成' ? 'checked' : ''}>
      <div class="todo-main">
        <div class="todo-title" style="${r.status === '完成' ? 'text-decoration:line-through;opacity:.55;' : ''}">${esc(r.item)}</div>
        <div class="todo-meta">${r.due ? '截止 ' + r.due : ''} ${r.priority ? '· ' + r.priority : ''}</div>
      </div>
      <button class="shop-item-del" data-edit="${r._id}">✎</button>
      <button class="shop-item-del" data-del="${r._id}">×</button>
    </div>`).join('');
    return stats + `<div class="todo-list">${items}</div>`;
  }

  /* ============================================================
   * 经期设置（settings 型 Tab）
   * ============================================================ */
  function renderSettings(tab) {
    const settingKey = tab.id === 'womenSettings' ? 'womenSettings' : 'period';
    const rec = Store.getSetting(settingKey, {});
    const body = tab.fields.map(f => `<div class="form-row"><label>${esc(f.label)}</label>${fieldInput(f, rec[f.key])}</div>`).join('');
    let predict = '';
    if (rec.cycleStart && rec.cycleLen) {
      const d = new Date(rec.cycleStart);
      d.setDate(d.getDate() + parseInt(rec.cycleLen));
      predict = `<div class="predict">预计下次：<b>${d.toISOString().slice(0, 10)}</b></div>`;
    }
    return `<div class="settings-box">${body}${predict}
      <div class="form-actions">
        <button type="button" class="btn-secondary" id="settings-cancel">取消</button>
        <button class="btn-primary" id="save-settings">确认保存</button>
      </div></div>`;
  }

  /* ============================================================
   * 首页 mini 可视化
   * ============================================================ */
  function miniProgress(pct, text) {
    return `<div class="mini-progress"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>` +
      (text ? `<div class="home-card-foot">${esc(text)}</div>` : '');
  }
  function miniBars(items, max) {
    const m = max || Math.max(1, ...items.map(i => i.value || 0));
    return `<div class="mini-bars">` + items.map(i => {
      const v = i.value || 0;
      const pct = m ? (v / m) * 100 : 0;
      return `<div class="mbar"><span>${esc(i.label)}</span><div class="mbar-track"><div class="mbar-fill" style="width:${pct}%"></div></div><b>${v}</b></div>`;
    }).join('') + `</div>`;
  }
  function miniDots(n, onCount) {
    return `<div class="mini-dots">` + Array.from({ length: n }, (_, i) =>
      `<span class="mdot ${i < onCount ? 'on' : ''}"></span>`).join('') + `</div>`;
  }
  function miniHeatmap(dates) {
    const map = {};
    (dates || []).forEach(d => { if (d.date) map[d.date] = (map[d.date] || 0) + (d.value || 1); });
    const max = Math.max(1, ...Object.values(map));
    const today = new Date(); const dayMs = 86400000;
    let rects = '';
    for (let w = 0; w < 10; w++) {
      for (let d = 0; d < 7; d++) {
        const offset = (9 - w) * 7 + (6 - d);
        const dt = new Date(today.getTime() - offset * dayMs);
        const key = dt.toISOString().slice(0, 10);
        const val = map[key] || 0;
        const op = 0.12 + (val / max) * 0.78;
        rects += `<rect x="${w * 9 + 1}" y="${d * 9 + 1}" width="7" height="7" fill="currentColor" fill-opacity="${op.toFixed(2)}"/>`;
      }
    }
    return `<div class="mini-heatmap"><svg viewBox="0 0 91 64" preserveAspectRatio="xMidYMid meet">${rects}</svg></div>`;
  }
  function miniLine(values) {
    const vals = (values || []).map(v => typeof v === 'number' ? v : parseFloat(v)).filter(v => !isNaN(v));
    if (vals.length < 2) return miniDots(7, vals.length ? 1 : 0);
    const min = Math.min(...vals), max = Math.max(...vals);
    const pad = (max - min) * 0.2 || 1;
    const lo = min - pad, hi = max + pad;
    const W = 100, H = 40;
    const pts = vals.map((v, i) => {
      const x = (vals.length === 1 ? 50 : (i / (vals.length - 1)) * W).toFixed(1);
      const y = (H - ((v - lo) / (hi - lo)) * H).toFixed(1);
      return `${i ? 'L' : 'M'}${x} ${y}`;
    }).join(' ');
    const area = `${pts} L${W} ${H} L0 ${H} Z`;
    return `<div class="mini-line"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${area}" class="area"/><path d="${pts}" class="line"/></svg></div>`;
  }
  function emptyHint(text) {
    return `<div class="empty-hint">${esc(text || '点击进入模块')}</div>`;
  }
  function fmtNum(n) {
    const v = parseFloat(n); return isNaN(v) ? '—' : v.toFixed(0);
  }

  function homeWidget(m) {
    const tk = todayKey();
    if (m.id === 'life') {
      const items = Store.getList({ collection: 'items' });
      const total = items.length;
      const bought = items.filter(r => r.status === '已买').length;
      const spent = items.filter(r => r.status === '已买').reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 1), 0);
      if (!total) return { body: miniProgress(0, ''), foot: '还没有购物记录' };
      return { body: miniProgress(total ? (bought / total) * 100 : 0, `已花 €${spent.toFixed(0)}`), foot: `${bought}/${total} 已买` };
    }
    if (m.id === 'study') {
      const tasks = Store.getList({ collection: 'studyTasks' });
      if (!tasks.length) return { body: miniProgress(0, ''), foot: '还没有学习任务' };
      const active = tasks.filter(r => r.status === '进行中' || r.status === '计划').length;
      const totalMin = tasks.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
      return { body: miniProgress(0, `${active} 进行中`), foot: `累计 ${Math.round(totalMin / 60 * 10) / 10}h` };
    }
    if (m.id === 'money') {
      const flows = Store.getList({ collection: 'flows' });
      const ym = tk.slice(0, 7);
      const month = flows.filter(r => (r.date || '').startsWith(ym));
      const inc = month.filter(r => r.direction === '收入').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      const exp = month.filter(r => r.direction === '支出').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      if (!flows.length) return { body: miniBars([], 1), foot: '还没有收支记录' };
      return { body: miniBars([{ label: '收入', value: inc }, { label: '支出', value: exp }], Math.max(inc, exp, 1)), foot: `本月结余 €${(inc - exp).toFixed(0)}` };
    }
    if (m.id === 'travel') {
      const dest = Store.getList({ collection: 'destinations' });
      if (!dest.length) return { body: miniBars([], 1), foot: '还没有目的地' };
      const visited = dest.filter(r => r.status === '已打卡').length;
      return { body: miniBars([{ label: '已打卡', value: visited }, { label: '待打卡', value: dest.length - visited }], dest.length), foot: `${dest.length} 个目的地` };
    }
    if (m.id === 'rigong') {
      const study = Store.getList({ collection: 'studyTasks' });
      const habits = Store.getList({ collection: 'habitLogs' });
      const daily = Store.getList({ collection: 'daily' }).filter(r => r.done);
      const archDates = [...study, ...habits, ...daily].filter(r => r.date).map(r => r.date);
      if (!archDates.length) return { body: miniHeatmap([]), foot: '还没有拱卒记录' };
      return { body: miniHeatmap(archDates.map(d => ({ date: d, value: 1 }))), foot: `${new Set(archDates).size} 天有进益` };
    }
    if (m.id === 'files') {
      const files = Store.getList({ collection: 'files' });
      if (!files.length) return { body: miniBars([], 1), foot: '还没有文件' };
      const cats = ['证件', '合同', '财务', '保单', '学习', '工作', '图片'];
      const counts = cats.map(c => ({ label: c, value: files.filter(r => r.cat === c).length }));
      return { body: miniBars(counts, Math.max(...counts.map(c => c.value), 1)), foot: `共 ${files.length} 个文件` };
    }
    if (m.id === 'jikui') {
      const todos = Store.getList({ collection: 'todos' });
      const total = todos.length;
      const done = todos.filter(r => r.status === '完成').length;
      if (!total) return { body: miniProgress(0, ''), foot: '还没有公司待办' };
      return { body: miniProgress((done / total) * 100, `${done}/${total} 完成`), foot: '积跬步以至千里' };
    }
    if (m.id === 'discipline') {
      const todos = Store.getList({ collection: 'lifeTodos' });
      const daily = Store.getList({ collection: 'daily' });
      const total = todos.length;
      const done = todos.filter(r => r.status === '完成').length;
      if (!total && !daily.length) return { body: miniProgress(0, ''), foot: '还没有自律记录' };
      return { body: miniProgress(total ? (done / total) * 100 : 0, `${done}/${total} 待办`), foot: `${daily.length} 次运动` };
    }
    if (m.id === 'fun') {
      const items = Store.getList({ collection: 'funItems' });
      if (!items.length) return { body: miniBars([], 1), foot: '还没有娱乐记录' };
      const statuses = ['想看', '在看', '看完'];
      const counts = statuses.map(s => ({ label: s, value: items.filter(r => r.status === s).length }));
      return { body: miniBars(counts, Math.max(...counts.map(c => c.value), 1)), foot: `共 ${items.length} 条` };
    }
    if (m.id === 'toolbox') {
      const contacts = Store.getList({ collection: 'contacts' });
      return { body: emptyHint('通讯录 · 我们❤️'), foot: `${contacts.length} 位联系人` };
    }
    return { body: emptyHint('点击进入模块'), foot: m.desc || '' };
  }

  /* ============================================================
   * 首页 Hero + 提醒 + 板块磁贴
   * ============================================================ */
  function renderHome() {
    const name = Store.getSetting('nickname', '我');
    const avatar = Store.getSetting('avatar', '');
    const now = new Date();
    const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${wk} ${hh}:${mm}`;
    const weather = Topbar.getWeatherText();
    const quote = Topbar.getQuoteHtml();
    const reminders = buildReminders();
    const tiles = MODULES.filter(m => m.id !== 'home').map(m => {
      const w = homeWidget(m);
      return `<div class="module-tile group-${m.group}" data-goto="${m.id}">
        <div class="module-tile-icon">${m.icon}</div>
        <div class="module-tile-name">${esc(m.name)}</div>
        <div class="module-tile-desc">${esc(m.desc || '')}</div>
        <div class="module-tile-body">${w.body}</div>
        ${w.foot ? `<div class="module-tile-foot">${esc(w.foot)}</div>` : ''}
      </div>`;
    }).join('');
    return `
      <div class="home-dashboard">
        <div class="hero-card">
          <div class="hero-top">
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="hero-avatar" ${avatar ? `style="background-image:url(${esc(avatar)})"` : ''}>${avatar ? '' : esc(name.slice(0, 1))}</div>
              <div>
                <h1 class="hero-greeting">✨ 你好，${esc(name)}</h1>
                <div class="hero-meta">${dateStr}</div>
              </div>
            </div>
            <div class="hero-weather"><b id="hero-weather">${esc(weather)}</b></div>
          </div>
          <div class="hero-quote" id="hero-quote">${quote}</div>
        </div>
        <div class="section-title">📌 今日提醒</div>
        <div class="reminder-card">${reminders}</div>
        <div class="section-title">📦 全部板块</div>
        <div class="module-grid">${tiles}</div>
        <div class="home-actions">
          <button id="btn-export-home">导出备份</button>
          <button class="primary" id="btn-settings-home">设置</button>
        </div>
        <div id="pwa-guide"></div>
      </div>`;
  }

  function bindHome(root) {
    root.querySelectorAll('[data-goto]').forEach(c =>
      c.onclick = () => selectModule(c.dataset.goto));
    const exp = document.getElementById('btn-export-home');
    if (exp) exp.onclick = exportBackup;
    const set = document.getElementById('btn-settings-home');
    if (set) set.onclick = openSettings;
    // 学习专注计时器
    const timerStart = document.getElementById('timer-start');
    if (timerStart) timerStart.onclick = toggleFocusTimer;
    root.querySelectorAll('[data-focus]').forEach(b =>
      b.onclick = () => startFocus(b.dataset.focus));
    root.querySelectorAll('[data-complete]').forEach(b =>
      b.onclick = () => { Store.updateRecord({ collection: 'studyTasks' }, b.dataset.complete, { status: '已完成' }); renderContent(); });
    // 娱乐随机推荐
    const randomBtn = document.getElementById('fun-random');
    if (randomBtn) randomBtn.onclick = () => {
      const want = Store.getList({ collection: 'funItems' }).filter(r => r.status === '想看');
      if (!want.length) return;
      const pick = want[Math.floor(Math.random() * want.length)];
      const el = document.getElementById('fun-random-result');
      if (el) el.textContent = '🎯 今天看：' + pick.name;
    };
    // PWA 引导
    showPwaGuide();
  }

  /* 学习专注计时器 */
  function startFocus(taskId) {
    focusState = { taskId, startTime: Date.now(), intervalId: null };
    const display = document.getElementById('timer-display');
    const taskEl = document.getElementById('timer-task');
    const btn = document.getElementById('timer-start');
    const rec = Store.getList({ collection: 'studyTasks' }).find(r => r._id === taskId);
    if (taskEl) taskEl.textContent = rec ? '专注中：' + (rec.topic || '') : '';
    if (btn) { btn.textContent = '⏸ 停止并记录'; btn.onclick = stopFocus; }
    focusState.intervalId = setInterval(() => {
      const sec = Math.floor((Date.now() - focusState.startTime) / 1000);
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      if (display) display.textContent = `${m}:${s}`;
    }, 1000);
  }
  function stopFocus() {
    if (!focusState) return;
    clearInterval(focusState.intervalId);
    const min = Math.max(1, Math.round((Date.now() - focusState.startTime) / 60000));
    const rec = Store.getList({ collection: 'studyTasks' }).find(r => r._id === focusState.taskId);
    if (rec) {
      const oldDur = parseFloat(rec.duration) || 0;
      Store.updateRecord({ collection: 'studyTasks' }, rec._id, { duration: oldDur + min, status: '进行中' });
    }
    focusState = null;
    renderContent();
  }
  function toggleFocusTimer() {
    if (focusState) stopFocus();
    else {
      const tasks = Store.getList({ collection: 'studyTasks' }).filter(r => r.status === '进行中' || r.status === '计划');
      if (tasks.length) startFocus(tasks[0]._id);
    }
  }

  function buildReminders() {
    const tk = todayKey();
    const items = [];
    Store.getList({ collection: 'lifeTodos' }).filter(r => r.status !== '完成').slice(0, 3).forEach(r =>
      items.push({ icon: '📋', text: r.item, meta: r.due || '待办' }));
    Store.getList({ collection: 'todos' }).filter(r => r.status !== '完成').slice(0, 3).forEach(r =>
      items.push({ icon: '🏢', text: r.item, meta: r.due || '待办' }));
    Store.getList({ collection: 'items' }).filter(r => r.status === '未买').slice(0, 3).forEach(r =>
      items.push({ icon: '🛒', text: r.name, meta: r.cat || '购物' }));
    Store.getList({ collection: 'daily' }).filter(r => !r.done).slice(0, 3).forEach(r =>
      items.push({ icon: '🏃', text: r.item, meta: (r.duration || '') + '分' }));
    Store.getList({ collection: 'studyTasks' }).filter(r => r.status === '进行中').slice(0, 3).forEach(r =>
      items.push({ icon: '📚', text: r.topic || '学习', meta: '进行中' }));
    Store.getList({ collection: 'moneySubs' }).filter(r => r.nextDate && r.nextDate >= tk).sort((a, b) => (a.nextDate || '').localeCompare(b.nextDate || '')).slice(0, 2).forEach(r =>
      items.push({ icon: '💳', text: r.name, meta: r.nextDate }));
    const ev = Topbar.getNextEvent();
    if (ev) {
      const tail = ev.days === 0 ? '今天' : ev.days === 1 ? '明天' : `还有${ev.days}天`;
      items.push({ icon: '💝', text: ev.r.name, meta: tail });
    }
    if (!items.length) return `<div class="reminder-empty">今天没有待办，享受当下吧～</div>`;
    return `<div class="reminder-list">` + items.map(it =>
      `<div class="reminder-item"><span>${esc(it.icon)}</span><span>${esc(it.text)}</span><small>${esc(it.meta)}</small></div>`
    ).join('') + `</div>`;
  }

  /* ---------------- PWA 引导 ---------------- */
  function showPwaGuide() {
    const el = document.getElementById('pwa-guide');
    if (!el) return;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) { el.innerHTML = ''; return; }
    const dismissed = Store.getSetting('pwaGuideDismissed', false);
    if (dismissed) return;
    el.innerHTML = `<div class="pwa-guide-bar">
      <span>📱 添加到主屏幕，获得原生 App 体验</span>
      <button id="pwa-dismiss">×</button>
    </div>`;
    const btn = document.getElementById('pwa-dismiss');
    if (btn) btn.onclick = () => { Store.setSetting('pwaGuideDismissed', true); el.innerHTML = ''; };
  }

  /* ---------------- 弹窗 ---------------- */
  function openModal(title, html) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal').classList.add('show');
    const sb = document.getElementById('save-settings');
    if (sb) sb.onclick = saveSettings;
    const sc = document.getElementById('settings-cancel');
    if (sc) sc.onclick = closeModal;
    const at = document.getElementById('bud-target');
    if (at) at.onchange = () => { Store.setSetting('budgetTarget', parseFloat(at.value) || 0); renderContent(); };
  }
  function closeModal() { document.getElementById('modal').classList.remove('show'); }
  function saveSettings() {
    const tab = MODULE_MAP['toolbox'].tabs.find(t => t.id === 'womenSettings');
    if (!tab) return;
    const obj = {};
    tab.fields.forEach(f => {
      if (f.type === 'checkbox') obj[f.key] = document.getElementById(`f_${f.key}`).checked;
      else if (f.type === 'number') obj[f.key] = document.getElementById(`f_${f.key}`).value === '' ? '' : parseFloat(document.getElementById(`f_${f.key}`).value);
      else obj[f.key] = document.getElementById(`f_${f.key}`).value;
    });
    Store.setSetting('womenSettings', obj);
    closeModal();
    renderContent();
  }

  /* ---------------- 图片压缩 ---------------- */
  function resizeImage(file, maxDim, cb) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = height * maxDim / width; width = maxDim; }
        else if (height > maxDim) { width = width * maxDim / height; height = maxDim; }
        const c = document.createElement('canvas');
        c.width = width; c.height = height;
        c.getContext('2d').drawImage(img, 0, 0, width, height);
        cb(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------------- 设置 / 备份（确认/取消） ---------------- */
  function openSettings() {
    const name = Store.getSetting('nickname', '我');
    const avatar = Store.getSetting('avatar', '');
    openModal('设置与备份', `<div class="form-row"><label>昵称</label><input type="text" id="set-name" value="${esc(name)}"></div>
      <div class="form-row"><label>头像链接</label><input type="text" id="set-avatar" value="${esc(avatar)}"></div>
      <div class="backup-ops">
        <button class="btn-primary" id="btn-export">导出备份(JSON)</button>
        <label class="btn-secondary">导入备份<input type="file" id="btn-import" accept=".json" hidden></label>
      </div>
      <div class="form-actions" style="margin-top:14px;">
        <button type="button" class="btn-secondary" id="settings-cancel">取消</button>
        <button class="btn-primary" id="settings-confirm">确认保存</button>
      </div>`);
    document.getElementById('btn-export').onclick = exportBackup;
    document.getElementById('btn-import').onchange = importBackup;
    document.getElementById('settings-cancel').onclick = closeModal;
    document.getElementById('settings-confirm').onclick = () => {
      Store.setSetting('nickname', document.getElementById('set-name').value);
      Store.setSetting('avatar', document.getElementById('set-avatar').value);
      Topbar.renderProfile();
      closeModal();
      renderContent();
    };
  }
  function exportBackup() {
    const blob = new Blob([Store.exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'xiaoman-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
  }
  function importBackup(e) {
    const f0 = e.target.files[0]; if (!f0) return;
    const r = new FileReader();
    r.onload = ev => {
      if (Store.importAll(ev.target.result)) { alert('导入成功！'); closeModal(); selectModule(state.module); }
      else alert('导入失败：文件格式不正确');
    };
    r.readAsText(f0);
  }

  /* ---------------- 抽屉（移动端） ---------------- */
  function openDrawer() { document.getElementById('sidebar').classList.add('open'); document.getElementById('backdrop').classList.add('show'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('backdrop').classList.remove('show'); document.body.style.overflow = ''; }

  /* 动态测量顶部栏高度 */
  function syncTopbarH() {
    const tb = document.getElementById('topbar');
    if (tb) document.documentElement.style.setProperty('--topbar-h', Math.ceil(tb.getBoundingClientRect().height) + 'px');
  }

  /* ---------------- 绑定 ---------------- */
  function bindStatic() {
    const mt = document.getElementById('menu-toggle');
    if (mt) mt.onclick = () => {
      if (window.innerWidth <= 820) openDrawer();
      else selectModule('home');
    };
    document.getElementById('drawer-close').onclick = closeDrawer;
    document.getElementById('backdrop').onclick = closeDrawer;
    document.getElementById('modal-close').onclick = closeModal;
    document.getElementById('modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
    const gear = document.getElementById('tb-gear');
    if (gear) gear.onclick = openSettings;
  }

  function init() {
    renderNav();
    bindStatic();
    selectModule('home');
    syncTopbarH();
    if ('ResizeObserver' in window) {
      new ResizeObserver(syncTopbarH).observe(document.getElementById('topbar'));
    }
    window.addEventListener('resize', syncTopbarH);
    window.addEventListener('orientationchange', () => setTimeout(syncTopbarH, 200));
  }

  return { init, selectModule };
})();
