/* ============================================================
 * 主应用（V3）：导航 / 路由 / 通用列表-表单 / Hero 首页 / 特例视图 / 设置
 * ============================================================ */

const App = (function () {
  const state = { module: 'home', tab: null };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function dateKey(d) { const x = d || new Date(); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; }
  function todayKey() { return dateKey(new Date()); }
  function money(v, cur) { const n = parseFloat(v); return (isNaN(n) ? 0 : n).toFixed(2) + (cur || '€'); }

  /* 状态灯（学习区三态配色） */
  function statusDot(status) {
    const c = (typeof STATUS_COLORS !== 'undefined' && STATUS_COLORS[status]) || '#B8C2D0';
    return `<span class="status-dot" style="background:${c}" title="${esc(status)}"></span>`;
  }
  /* 卡片右上角「⋯」三点菜单（编辑 / 删除） */
  function cardOpsMenu(id) {
    return `<div class="card-menu-wrap">
      <button class="card-menu-btn" type="button" aria-label="更多操作">⋯</button>
      <div class="card-menu">
        <button data-edit="${id}">编辑</button>
        <button class="danger" data-del="${id}">删除</button>
      </div></div>`;
  }

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
    const content = document.getElementById('content');
    if (content) content.scrollTop = 0;
    window.scrollTo(0, 0);
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
    root.classList.remove('group-work', 'group-life');
    if (mod.render === 'home') { root.innerHTML = renderHome(); bindHome(root); return; }
    if (mod.render === 'tabs') {
      root.classList.add('group-' + mod.group);
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
    const budgetTarget=document.getElementById('bud-target'); if(budgetTarget)budgetTarget.onchange=()=>{Store.setSetting('budgetTarget',parseFloat(budgetTarget.value)||0);renderContent();};
  }

  /* ---------------- 单个 Tab 内容 ---------------- */
  function renderTabBody(tab) {
    if (tab.type === 'settings') return renderSettings(tab);
    if (tab.type === 'budget') return renderBudget(tab);
    if (tab.type === 'filter') return renderFilterView(tab);
    // 特例渲染由 populateList 填充
    if (tab.special) return '';
    // 通用列表（新增入口统一用头部「+」，不再另放浮动按钮）
    return `<div class="card-grid" id="list-grid"></div>`;
  }

  /* ---------------- 通用列表 ---------------- */
  function renderList(tab) {
    const grid = document.getElementById('list-grid');
    const mod = MODULE_MAP[state.module];
    const grp = mod ? mod.group : 'work';
    if (!grid) return;
    const list = Store.getList(tab);
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state" id="empty-add" style="cursor:pointer;">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">暂无，点击新增</div></div>`;
      const ea = document.getElementById('empty-add');
      if (ea) ea.onclick = () => openForm(tab, null);
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
    if (f.type === 'selectOther') {
      const opts = Array.from(new Set((f.options || []).concat(['其他'])));
      const isOther = val != null && val !== '' && !f.options.includes(val);
      const selVal = isOther ? '其他' : v;
      return `<select id="f_${f.key}" data-select-other>${opts.map(o =>
        `<option value="${o}" ${o === selVal ? 'selected' : ''}>${o}</option>`).join('')}</select>` +
        `<input type="text" id="f_${f.key}_other" placeholder="请输入自定义内容" value="${isOther ? esc(val) : ''}" style="margin-top:8px;${isOther ? '' : 'display:none;'}">`;
    }
    if (f.type === 'checkbox') return `<input type="checkbox" id="f_${f.key}" ${v ? 'checked' : ''}>`;
    if (f.type === 'multicheck') return `<div class="multi">${f.options.map(o => {
      const arr = Array.isArray(val) ? val : [];
      return `<label class="chk"><input type="checkbox" data-mc="${f.key}" value="${o}" ${arr.includes(o) ? 'checked' : ''}>${o}</label>`;
    }).join('')}</div>`;
    if (f.type === 'image') return `<div class="img-up" data-image-field="${f.key}"><input type="file" accept="image/*" id="f_${f.key}_file">
      <input type="hidden" id="f_${f.key}" value="${esc(v)}">
      <img src="${esc(v)}" class="thumb-prev" ${v ? '' : 'hidden'}><button type="button" class="btn-secondary image-remove" ${v ? '' : 'hidden'}>删除照片</button></div>`;
    if (f.type === 'date') return `<input type="date" id="f_${f.key}" value="${esc(v)}" ${f.required ? 'required' : ''}>`;
    if (f.type === 'number') return `<input type="number" step="any" id="f_${f.key}" value="${esc(v)}" ${f.required ? 'required' : ''}>`;
    return `<input type="text" id="f_${f.key}" value="${esc(v)}" ${f.required ? 'required' : ''}>`;
  }

  function openForm(tab, editId, preset, afterSave) {
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
    if (Store.keyOf(tab) === 'flows') {
      const preview=document.createElement('div'); preview.className='predict'; preview.id='flow-budget-preview'; document.getElementById('rec-form').prepend(preview);
      const updatePreview=()=>{const cat=document.getElementById('f_category')?.value,amount=parseFloat(document.getElementById('f_amount')?.value)||0,currency=document.getElementById('f_currency')?.value||'€',budgets=Store.getList('moneyBudget'),b=budgets.find(x=>x.cat===cat)||budgets.find(x=>x.cat==='总预算');if(!b){preview.textContent='此分类暂无预算，将计入「无预算」';return;}const used=budgetSpent(b,Store.getList('flows')),limit=baseAmount(b.limit??b.monthlyLimit,b.currency);preview.textContent=`命中 ${b.cat} ${b.period||'月'}预算：已用 ${baseSymbol()}${used.toFixed(0)}，本笔后约 ${baseSymbol()}${(used+baseAmount(amount,currency)).toFixed(0)} / ${baseSymbol()}${limit.toFixed(0)}`;};
      ['f_category','f_amount','f_currency'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('input',updatePreview);}); updatePreview();
    }
    // 图片上传压缩
    tab.fields.filter(f => f.type === 'image').forEach(f => {
      const file = document.getElementById(`f_${f.key}_file`);
      if (file) file.onchange = () => {
        const f0 = file.files[0];
        if (!f0) return;
        resizeImage(f0, 1280, data => {
          document.getElementById(`f_${f.key}`).value = data;
          const host = file.closest('.img-up'), prev = host.querySelector('.thumb-prev'), remove = host.querySelector('.image-remove');
          if (prev) { prev.src = data; prev.hidden = false; } if (remove) remove.hidden = false;
        });
      };
      const remove = file && file.closest('.img-up').querySelector('.image-remove');
      if (remove) remove.onclick = () => { const host = remove.closest('.img-up'); document.getElementById(`f_${f.key}`).value = ''; file.value = ''; host.querySelector('.thumb-prev').hidden = true; remove.hidden = true; };
    });
    // selectOther：选「其他」时显示自定义输入框
    tab.fields.filter(f => f.type === 'selectOther').forEach(f => {
      const sel = document.getElementById(`f_${f.key}`);
      const other = document.getElementById(`f_${f.key}_other`);
      if (sel && other) sel.onchange = () => { other.style.display = sel.value === '其他' ? '' : 'none'; };
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
        else if (f.type === 'selectOther') {
          const sel = document.getElementById(`f_${f.key}`);
          obj[f.key] = sel.value === '其他'
            ? (document.getElementById(`f_${f.key}_other`).value || '').trim()
            : sel.value;
        } else obj[f.key] = document.getElementById(`f_${f.key}`).value;
      });
      const missing = tab.fields.find(f => f.required && (obj[f.key] == null || String(obj[f.key]).trim() === ''));
      if (missing) { alert('请填写：' + missing.label); return; }
      let saved;
      if (editId) { Store.updateRecord(tab, editId, obj); saved = Store.getList(tab).find(r => r._id === editId); }
      else saved = Store.addRecord(tab, obj);
      if (tab.collection === 'daily' && obj.done && obj.date) ensureExerciseHabit(obj.date);
      if (typeof afterSave === 'function') afterSave(saved, obj);
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
      'life:homeThings': renderHomeThings,
      'life:people': renderPeople,
      'study:today': renderStudyToday,
      'study:history': renderStudyHistory,
      'travel:overview': renderTravelOverview,
      'travel:destinations': renderTravelDest,
      'fun:items': renderFunList,
      'files:files': renderFilesIdx,
      'discipline:plans': renderPlans,
      'discipline:habits': renderHabits,
      'discipline:fitDaily': renderFitnessDaily,
      'discipline:skincare': renderSkincare,
      'discipline:weight': renderWeightTab,
      'rigong:overview': renderRigongOverview,
      'money:overview': renderMoneyOverview,
      'money:flows': renderMoneyFlows,
      'money:goals': renderMoneyGoals,
      'jikui:todos': renderJikuiTodos,
      'jikui:board': renderJikuiBoard,
      'jikui:analyze': renderJikuiAnalyze,
      'toolbox:youzi': renderYouzi,
      'invest:market': renderInvestMarket,
      'invest:logs': renderStockLog,
      'money:budget': renderMoneyBudget,
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
    root.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => { selectModule(b.dataset.goto); if (b.dataset.tabTarget) selectTab(b.dataset.tabTarget); });
    // 「明日提醒」（plan 集合）并入每日待办后的编辑/删除
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
          if ((colKey.collection === 'todos' || Store.keyOf(colKey) === 'todos') && key === 'status') rec.completedDate = rec.status === '完成' ? todayKey() : '';
          Store.updateRecord(colKey, rec._id, rec);
          // 心愿清单 ↔ 购物清单 双向联动：购物项标记已买 → 回写心愿状态
          if ((colKey.collection === 'items' || (tab.collection === 'items')) && rec.linkWish && rec.status === '已买') {
            const wish = Store.getList({ collection: 'wishes' }).find(w => w._id === rec.linkWish);
            if (wish && wish.status !== '已买') { wish.status = '已买'; Store.updateRecord({ collection: 'wishes' }, wish._id, wish); }
          }
          renderContent();
        }
      };
      if (b.tagName === 'BUTTON') b.onclick = handler;
      else b.onchange = handler;
    });
    const addBtn = document.getElementById('add-btn') || document.getElementById('special-add');
    if (addBtn) addBtn.onclick = () => openForm(tab, null);
    // 「⋯」三点菜单展开 / 收起
    root.querySelectorAll('.card-menu-btn').forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        const menu = b.parentElement.querySelector('.card-menu');
        const wasOpen = menu && menu.classList.contains('open');
        root.querySelectorAll('.card-menu.open').forEach(m => m.classList.remove('open'));
        if (menu && !wasOpen) menu.classList.add('open');
      };
    });
    root.onclick = (e) => {
      if (!e.target.closest('.card-menu-wrap')) root.querySelectorAll('.card-menu.open').forEach(m => m.classList.remove('open'));
    };
    // 特殊模块的内置绑定
    if (modId === 'life' && tab.id === 'homeThings') bindHomeThings(tab);
    else if (modId === 'life' && tab.id === 'items') bindShopping(tab);
    else if (modId === 'life' && tab.id === 'people') bindPeople(tab);
    else if (modId === 'toolbox' && tab.id === 'youzi') bindYouzi(tab);
    else if (modId === 'discipline' && tab.id === 'plans') bindPlans(tab);
    else if (modId === 'discipline' && tab.id === 'habits') bindHabits(tab);
    else if (modId === 'invest' && tab.id === 'market') bindInvestMarket();
    else if (modId === 'invest' && tab.id === 'logs') bindStockLog(tab);
    else if (modId === 'jikui' && tab.id === 'board') bindJikuiBoard();
    else if (modId === 'travel' && tab.id === 'overview') bindTravelMap();
    const funRandom=document.getElementById('fun-random'); if(funRandom)funRandom.onclick=()=>{const want=Store.getList('funItems').filter(r=>r.status==='想看'),el=document.getElementById('fun-random-result');if(want.length&&el)el.textContent='🎯 今天看：'+want[Math.floor(Math.random()*want.length)].name;};
    const addBar = document.getElementById('quick-add-bar');
    if (addBar && !(modId === 'discipline' && tab.id === 'plans')) addBar.onkeydown = e => {
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

  /* 子项顶部预览热力（习惯/运动/待办等通用） */
  function previewHeat(list, dateKey, label) {
    if (!list || !list.length) return '';
    const data = list.map(r => ({ date: r[dateKey], value: 1 }));
    return `<div class="habit-section">
      <div class="habit-section-head"><span class="habit-section-title">🔥 ${esc(label)}</span><span class="habit-section-stat">${list.length} 次</span></div>
      ${heatmapHtml(data, 'value', '')}</div>`;
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
    const pending = items.filter(r => (r.status || '未买') === '未买');
    const done = items.filter(r => r.status === '已买');
    const cancelledItems = items.filter(r => r.status === '已取消');
    const row = it => `<div class="shop-simple-row ${it.status === '已买' ? 'done' : ''} ${it.status === '已取消' ? 'cancelled' : ''}">
      <input type="checkbox" aria-label="${esc(it.name)}" data-toggle="${it._id}" data-key="status" data-on="已买" data-off="未买" ${it.status === '已买' ? 'checked' : ''}>
      <button type="button" class="shop-simple-main" data-edit="${it._id}"><b>${esc(it.name)}</b>${it.qty && Number(it.qty)!==1 ? `<small>×${esc(it.qty)}</small>`:''}${it.price ? `<small>€${parseFloat(it.price).toFixed(2)}</small>`:''}</button>
      <button type="button" class="shop-simple-more" data-edit="${it._id}" aria-label="编辑 ${esc(it.name)}">···</button>
      <button type="button" class="shop-simple-delete" data-del="${it._id}" aria-label="删除 ${esc(it.name)}">×</button>
    </div>`;
    return `<div class="shop-simple">
      <form id="shop-quick-form" class="shop-simple-add"><span>＋</span><input id="shop-quick-input" autocomplete="off" placeholder="添加物品，回车保存" aria-label="添加购物物品"><button type="submit">添加</button></form>
      <div class="shop-simple-meta"><span>${pending.length} 项待买</span><span>已买 ${bought}/${total}${cancelled ? ` · 取消 ${cancelled}`:''}</span><span>已花 €${spent.toFixed(2)}${target ? ` / €${target}`:''}</span></div>
      <section class="shop-simple-list">${pending.length ? pending.map(row).join('') : '<div class="shop-simple-empty">没有待买物品，想起什么就记下来吧</div>'}</section>
      ${done.length ? `<details class="shop-simple-completed"><summary>已完成（${done.length}）</summary>${done.map(row).join('')}</details>`:''}
      ${cancelledItems.length ? `<details class="shop-simple-completed"><summary>已取消（${cancelledItems.length}）</summary>${cancelledItems.map(row).join('')}</details>`:''}
      <p class="shop-simple-hint">点击物品可补充或修改分类、价格、数量、链接等完整信息。</p>
    </div>`;
  }

  function bindShopping(tab) {
    const form=document.getElementById('shop-quick-form'), input=document.getElementById('shop-quick-input');
    if(!form||!input)return;
    const saveQuick=e=>{if(e)e.preventDefault();const name=input.value.trim();if(!name)return;Store.addRecord(tab,{name,cat:'其他',price:'',buyLink:'',priority:'想要',status:'未买',qty:1,note:''});input.value='';renderContent();};
    form.onsubmit=saveQuick;input.onkeydown=e=>{if(e.key==='Enter')saveQuick(e);};
  }

  /* ============================================================
   * 重要日期卡片（原「纪念日」，支持重复周期 + 类型自定义）
   * ============================================================ */
  function computeNextEvent(r, today) {
    const parts = (r.date || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const cyc = r.repeatCycle || '每年';
    const dayMs = 86400000;
    if (cyc === '每日') return today;
    if (cyc === '每周') {
      //  nearest future same weekday as the original date
      const wd = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
      let d = new Date(today);
      while (d.getDay() !== wd) d.setDate(d.getDate() + 1);
      return d;
    }
    if (cyc === '每月') {
      let d = new Date(today.getFullYear(), today.getMonth(), parts[2]);
      if (d < today) d = new Date(today.getFullYear(), today.getMonth() + 1, parts[2]);
      return d;
    }
    // 每年 / 不重复
    let d = new Date(today.getFullYear(), parts[1] - 1, parts[2]);
    if (d < today) {
      if (cyc === '不重复') return null;
      d = new Date(today.getFullYear() + 1, parts[1] - 1, parts[2]);
    }
    return d;
  }
  function renderEventsCard(tab) {
    const list = Store.getList(tab);
    if (!list.length) return `<div class="empty-state"><div class="empty-state-icon">💝</div><div class="empty-state-text">还没有重要日期，点击 + 添加</div></div>`;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const items = list.map(r => {
      const next = computeNextEvent(r, today);
      let days = next ? Math.round((next - today) / 86400000) : Infinity;
      let tail = days === Infinity ? '已过' : days === 0 ? '今天' : days === 1 ? '明天' : `还有${days}天`;
      const cycLabel = { '每日': '每天', '每周': '每周', '每月': '每月', '每年': '每年', '不重复': '' }[r.repeatCycle] || '';
      return `<div class="app-card">
        <div class="app-card-head">
          <span class="app-card-title">${esc(r.name)}</span>
          <span class="app-card-ops"><button data-edit="${r._id}">编辑</button><button class="danger" data-del="${r._id}">删</button></span>
        </div>
        <div class="app-card-body">
          <p><span class="tag">${esc(r.type || '重要日期')}</span> ${r.date || ''} ${cycLabel ? '· ' + cycLabel : ''}</p>
          <p style="font-size:16px;font-weight:700;color:var(--life-deep);">${tail}</p>
          ${r.note ? `<p>${esc(r.note)}</p>` : ''}
        </div>
      </div>`;
    }).join('');
    return items;
  }
  function upcomingImportantEvents(limit) {
    const today=new Date();today.setHours(0,0,0,0);
    return Store.getList({collection:'events'}).map(r=>{const next=computeNextEvent(r,today);return next?{r,next,days:Math.round((next-today)/86400000)}:null;}).filter(Boolean).sort((a,b)=>a.days-b.days).slice(0,limit||3);
  }
  function renderHomeImportantEvents() {
    const list=upcomingImportantEvents(3);
    const rows=list.length?list.map(({r,next,days})=>`<span class="home-event-row"><i>${esc(r.type||'重要日期')}</i><b>${days===0?`${esc(r.name)}就是今天`:`距离${esc(r.name)}还有${days}天`}</b><small>（${next.getMonth()+1}月${next.getDate()}日）</small></span>`).join(''):`<span class="home-event-row empty"><i>＋</i><b>还没有即将到来的重要日子</b><small>点击添加</small></span>`;
    return `<div class="section-title home-event-title">💝 重要日子 <button data-goto="life" data-tab-target="events">查看全部</button></div><button class="home-event-card" data-goto="life" data-tab-target="events">${rows}</button>`;
  }

  /* ============================================================
   * 学习区（原「学习专区」）
   * ============================================================ */
  function renderStudyToday(tab) {
    const all = Store.getList(tab);
    const tk = todayKey();
    const today = all.filter(r => r.date === tk);
    const active = all.filter(r => r.status === '进行中' || r.status === '计划');
    const totalH = today.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
    const focus=today.length?today:active,done=focus.filter(r=>r.status==='已完成').length,pct=focus.length?Math.round(done/focus.length*100):0,current=active[0];
    const stats = `<section class="study-overview"><div class="study-overview-head"><div><small>📘 今日学习</small><strong>${done} / ${focus.length} 项完成</strong></div><b>${pct}%</b></div><div class="study-progress"><i style="width:${pct}%"></i></div><div class="study-overview-meta"><span>已学习 <b>${Math.round(totalH*10)/10}h</b></span><span>进行中 <b>${active.length}</b></span></div>${current?`<button type="button" data-edit="${current._id}" class="study-current"><small>正在进行</small><b>${esc(current.topic||'学习')} · ${esc(current.goal||'继续积累')}</b></button>`:'<div class="study-current empty"><small>今天还没有安排学习</small><b>保持一点输入，也算向前一步</b></div>'}</section>`;
    const empty = !active.length ? `<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">还没有学习任务，点击 + 添加</div></div>` : '';
    const cards = active.map(r => `<div class="app-card">
      <div class="app-card-head">
        <span class="app-card-title">${statusDot(r.status)} ${esc(r.topic || '学习')} · ${esc(r.goal || '今日目标')}</span>
        ${cardOpsMenu(r._id)}
      </div>
      <div class="app-card-body">
        <p><span class="tag">${esc(r.status)}</span> ${r.duration ? '已学 ' + r.duration + ' 小时' : ''} ${r.ref ? '· 资料 ' + esc(r.ref) : ''}</p>
        ${r.summary ? `<p>${esc(r.summary)}</p>` : ''}
      </div>
    </div>`).join('');
    return stats + empty + cards;
  }

  function studyWeeklySummary() {
    const all = Store.getList({ collection: 'studyTasks' });
    const tk = todayKey();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayMs = 86400000;
    let curWeekSum = 0, prevWeekSum = 0;
    const topTopics = {};
    const weekHeat = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() - i * dayMs);
      const key = d.toISOString().slice(0, 10);
      const recs = all.filter(r => r.date === key);
      const sum = recs.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
      curWeekSum += sum;
      weekHeat.push({ date: key, value: sum });
      const pd = new Date(today.getTime() - (i + 7) * dayMs);
      const pkey = pd.toISOString().slice(0, 10);
      prevWeekSum += all.filter(r => r.date === pkey).reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
      recs.forEach(r => { const t = r.topic || '其他'; topTopics[t] = (topTopics[t] || 0) + (parseFloat(r.duration) || 0); });
    }
    weekHeat.reverse();
    const max = Math.max(1, ...weekHeat.map(w => w.value));
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const cells = weekHeat.map(w => {
      const dt = new Date(w.date + 'T00:00:00');
      const lvl = w.value > 0 ? Math.min(4, Math.ceil((w.value / max) * 4)) : 0;
      return `<div class="wk-cell"><div class="wk-bar l${lvl}"></div><div class="wk-day">${days[dt.getDay()]}</div></div>`;
    }).join('');
    const topicEntries = Object.entries(topTopics).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxT = Math.max(1, ...topicEntries.map(e => e[1]));
    const bars = topicEntries.map(([k, v]) =>
      `<div class="mbar"><span>${esc(k)}</span><div class="mbar-track"><div class="mbar-fill" style="width:${(v / maxT) * 100}%"></div></div><b>${v}h</b></div>`).join('');
    const diff = curWeekSum - prevWeekSum;
    const diffTxt = diff === 0 ? '与上周持平' : (diff > 0 ? `较上周 +${Math.round(diff * 10) / 10}h` : `较上周 ${Math.round(diff * 10) / 10}h`);
    return `<div class="habit-section">
      <div class="habit-section-head"><span class="habit-section-title">📅 本周学习</span><span class="habit-section-stat">${Math.round(curWeekSum * 10) / 10}h · ${diffTxt}</span></div>
      <div class="wk-heat">${cells}</div>
      ${bars ? `<div class="mini-bars" style="margin-top:10px;">${bars}</div>` : ''}
    </div>`;
  }

  function renderStudyHistory(tab) {
    const all = Store.getList(tab).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const totalH = all.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
    const topics = {};
    all.forEach(r => { const t = r.topic || '其他'; topics[t] = (topics[t] || 0) + (parseFloat(r.duration) || 0); });
    const recent=all[0];
    const stats = `<section class="study-overview history"><div class="study-overview-head"><div><small>📚 学习积累</small><strong>${all.length} 次记录 · 累计 ${Math.round(totalH*10)/10}h</strong></div><b>${Object.keys(topics).length}</b></div><div class="study-overview-meta"><span>主题 <b>${Object.keys(topics).length}</b></span><span>最近 <b>${esc(recent?.topic||'暂无')}</b></span></div></section>`;
    if (!all.length) return stats + `<div class="empty-state"><div class="empty-state-icon">📜</div><div class="empty-state-text">还没有学习记录</div></div>`;
    const heat = `<div class="habit-section">
      <div class="habit-section-head"><span class="habit-section-title">📅 学习热力图</span><span class="habit-section-stat">累计 ${all.length} 次</span></div>
      ${heatmapHtml(all, 'duration', '')}
    </div>`;
    return stats + studyWeeklySummary() + heat + `<div class="habit-section"><div class="habit-section-title" style="margin-bottom:10px;">各主题时长</div>${miniBars(Object.entries(topics).map(([k, v]) => ({ label: k, value: Math.round(v) })), Math.max(...Object.values(topics), 1))}</div>` +
      all.slice(0, 30).map(r => `<div class="app-card">
        <div class="app-card-head">
          <span class="app-card-title">${statusDot(r.status)} ${esc(r.topic || '学习')} · ${r.date || ''}</span>
          ${cardOpsMenu(r._id)}
        </div>
        <div class="app-card-body">
          <p><span class="tag">${esc(r.status)}</span> ${r.duration ? r.duration + ' 小时' : ''}</p>
          ${r.goal ? `<p>目标：${esc(r.goal)}</p>` : ''}
          ${r.summary ? `<p>${esc(r.summary)}</p>` : ''}
        </div>
      </div>`).join('');
  }

  /* ============================================================
   * 旅行目的地（三态 + 三点菜单 + 复古双地图）
   * ============================================================ */
  function travelStatusPill(status) {
    const c = (typeof TRAVEL_PIN_COLOR !== 'undefined' && TRAVEL_PIN_COLOR[status]) || '#B8C2D0';
    return `<span class="travel-status" style="background:${c}22;color:${c};">${esc(status)}</span>`;
  }
  function renderTravelDest(tab) {
    const list = Store.getList(tab);
    list.forEach(r => { if (r.status === '待打卡') r._norm = '想去'; });
    const visited = list.filter(r => r.status === '已打卡').length;
    const stats = `<div class="stat-row">
      <div class="stat-card group-life"><div class="stat-value">${list.length}</div><div class="stat-label">目的地</div></div>
      <div class="stat-card group-life"><div class="stat-value">${list.filter(r => r.status === '计划中').length}</div><div class="stat-label">计划中</div></div>
      <div class="stat-card group-life"><div class="stat-value">${visited}</div><div class="stat-label">已打卡</div></div>
    </div>`;
    if (!list.length) return stats + `<div class="empty-state"><div class="empty-state-icon">✈️</div><div class="empty-state-text">还没有想去的地方，点击 + 添加</div></div>`;
    const cards = list.map(r => {
      const status = r.status === '待打卡' ? '想去' : r.status;
      return `<div class="travel-card">
        <div class="travel-card-head">
          <div class="travel-city">${esc(r.city)} ${travelStatusPill(status)}</div>
          ${cardOpsMenu(r._id)}
        </div>
        <div class="travel-details">
          ${r.spots ? `<div class="travel-detail"><span class="travel-detail-icon">📍</span><span class="travel-detail-label">景点</span><span class="travel-detail-value">${esc(r.spots)}</span></div>` : ''}
          ${r.food ? `<div class="travel-detail"><span class="travel-detail-icon">🍜</span><span class="travel-detail-label">美食</span><span class="travel-detail-value">${esc(r.food)}</span></div>` : ''}
          ${r.goDate ? `<div class="travel-detail"><span class="travel-detail-icon">📅</span><span class="travel-detail-label">出行</span><span class="travel-detail-value">${r.goDate}</span></div>` : ''}
          ${r.travelDays ? `<div class="travel-detail"><span class="travel-detail-icon">🌙</span><span class="travel-detail-label">天数</span><span class="travel-detail-value">${esc(r.travelDays)} 天</span></div>` : ''}
          ${r.budget ? `<div class="travel-detail"><span class="travel-detail-icon">💰</span><span class="travel-detail-label">预算</span><span class="travel-detail-value">€${parseFloat(r.budget).toFixed(0)}</span></div>` : ''}
        </div>
        ${r.feishu ? `<a href="${esc(r.feishu)}" target="_blank" rel="noopener" class="feishu-link">📄 详细攻略</a>` : ''}
        <div class="app-card-ops" style="margin-top:10px;justify-content:flex-end;">
          <button class="travel-check" data-toggle="${r._id}" data-key="status" data-on="已打卡" data-off="计划中">${r.status === '已打卡' ? '✓ 已打卡' : '打卡'}</button>
        </div>
      </div>`;
    }).join('');
    return stats + cards;
  }

  /* ============================================================
   * 旅行总览（复古双地图 + 图钉，纯 SVG 自绘，无外部图片）
   * ============================================================ */
  function travelMapSVG(title, box, pins) {
    const W = 320, H = Math.round(W * (box.latMax - box.latMin) / (box.lonMax - box.lonMin) * 0.8);
    const proj = (lon, lat) => [
      ((lon - box.lonMin) / (box.lonMax - box.lonMin)) * W,
      (1 - (lat - box.latMin) / (box.latMax - box.latMin)) * H,
    ];
    let grid = '';
    for (let gx = 0; gx <= 8; gx++) grid += `<line x1="${gx * W / 8}" y1="0" x2="${gx * W / 8}" y2="${H}" stroke="#e7dcc8" stroke-width="1"/>`;
    for (let gy = 0; gy <= 5; gy++) grid += `<line x1="0" y1="${gy * H / 5}" x2="${W}" y2="${gy * H / 5}" stroke="#e7dcc8" stroke-width="1"/>`;
    const dots = pins.map(p => {
      const [x, y] = proj(p.lon, p.lat);
      return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
        <circle r="6" fill="${p.color}" stroke="#fff" stroke-width="1.5"/>
        <title>${esc(p.city)} · ${esc(p.status)}</title></g>`;
    }).join('');
    return `<div class="travel-map">
      <div class="travel-map-title">${esc(title)}</div>
      <svg viewBox="0 0 ${W} ${H}" class="travel-map-svg" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="#f6efdd" stroke="#caa46a" stroke-width="6"/>
        ${grid}${dots}
      </svg></div>`;
  }
  function renderTravelOverview(tab) {
    const list = Store.getList({ collection: 'destinations' });
    const chinaBox = { lonMin: 73, lonMax: 136, latMin: 3, latMax: 54 };
    const worldBox = { lonMin: -180, lonMax: 180, latMin: -60, latMax: 90 };
    const chinaPins = [], worldPins = [], noGeo = [];
    list.forEach(r => {
      const status = r.status === '待打卡' ? '想去' : (r.status || '想去');
      const geo = typeof resolveTravelGeo === 'function' ? resolveTravelGeo(r.city, r.longitude, r.latitude) : null;
      const color = (typeof TRAVEL_PIN_COLOR !== 'undefined' && TRAVEL_PIN_COLOR[status]) || '#B8C2D0';
      if (geo) {
        const target = geo.scope === 'china' ? chinaPins : worldPins;
        const samePlaceCount = target.filter(p => p.lon === geo.lon && p.lat === geo.lat).length;
        const p = { city: r.city, canonical: geo.canonical, status, lon: geo.lon, lat: geo.lat, color, offset: samePlaceCount, spots: r.spots || '', food: r.food || '', goDate: r.goDate || '', travelDays: r.travelDays || '' };
        target.push(p);
      } else if (r.city) noGeo.push(r.city);
    });
    const groups = {
      '想去': list.filter(r => r.status === '想去' || r.status === '待打卡'),
      '计划中': list.filter(r => r.status === '计划中'),
      '已打卡': list.filter(r => r.status === '已打卡'),
    };
    const latestName = rows => rows.slice().sort((a,b) => String(b._updatedAt || b.goDate || '').localeCompare(String(a._updatedAt || a.goDate || '')))[0]?.city || '';
    const nextPlan = groups['计划中'].filter(r => r.goDate).sort((a,b) => r.goDate.localeCompare(b.goDate))[0];
    const total = list.length, visited = groups['已打卡'].length, pct = total ? Math.round(visited / total * 100) : 0;
    const statusCards = [
      ['想去','🧡','#fb923c',latestName(groups['想去']) || '等待灵感'],
      ['计划中','💙','#3b82f6',nextPlan ? nextPlan.goDate.slice(5).replace('-','月') + '日' : (latestName(groups['计划中']) || '还没排期')],
      ['已打卡','💚','#4ade80',latestName(groups['已打卡']) || '等待出发'],
    ];
    const stats = `<section class="travel-dashboard"><div class="travel-dashboard-head"><div><small>我的旅行足迹</small><strong>已探索 ${visited} / ${total} 个目的地</strong></div><b>${pct}%</b></div><div class="travel-progress"><i style="width:${pct}%"></i></div><div class="travel-status-grid">${statusCards.map(([status,icon,color,summary]) => `<button type="button" class="travel-status-card" data-goto="travel" data-tab-target="destinations" style="--travel-status:${color}" aria-label="查看${status}目的地"><span>${icon}</span><strong>${groups[status].length}</strong><small>${status}</small><em>${esc(summary)}</em></button>`).join('')}</div></section>`;
    const imageMap = (title, src, box, pins) => `<div class="travel-map" data-map-title="${title}"><div class="travel-map-head"><div class="travel-map-title">${title}</div><button type="button" class="travel-map-expand" aria-label="放大${title}地图">⛶ 放大</button></div><div class="travel-map-viewport"><div class="travel-map-stage"><img src="${src}" alt="${title}地图">${pins.map(p=>{ const left=((p.lon-box.lonMin)/(box.lonMax-box.lonMin)*100), top=(1-(p.lat-box.latMin)/(box.latMax-box.latMin))*100, shift=(p.offset||0)*7; return `<button type="button" class="map-pin" style="left:calc(${left.toFixed(2)}% + ${shift}px);top:calc(${top.toFixed(2)}% + ${shift}px);--pin-color:${p.color}" title="${esc(p.city)} · ${esc(p.status)}" aria-label="${esc(p.city)}，${esc(p.status)}" aria-expanded="false" data-city="${esc(p.city)}" data-canonical="${esc(p.canonical)}" data-status="${esc(p.status)}" data-date="${esc(p.goDate)}" data-days="${esc(p.travelDays)}" data-spots="${esc(p.spots)}" data-food="${esc(p.food)}"><span></span></button>`; }).join('')}</div><div class="travel-pin-card" hidden><button type="button" class="travel-pin-close" aria-label="关闭地点信息">×</button><strong data-pin-city></strong><span data-pin-location></span><em data-pin-status></em><div data-pin-details></div></div></div><div class="travel-map-controls" hidden><button type="button" data-map-zoom="out" aria-label="缩小地图">−</button><button type="button" data-map-reset>复位</button><button type="button" data-map-zoom="in" aria-label="放大地图">＋</button><button type="button" data-map-close>关闭</button></div></div>`;
    const maps = `<div class="travel-maps">${imageMap('中国','images/china-map.png?v=34',chinaBox,chinaPins)}${imageMap('世界','images/world-map.png?v=34',worldBox,worldPins)}</div>`;
    const note = noGeo.length ? `<div class="travel-nogeo">以下地点无法自动识别，请编辑记录补充经纬度：${esc(noGeo.join('、'))}</div>` : '';
    const hint = !list.length ? `<div class="empty-state"><div class="empty-state-icon">🗺️</div><div class="empty-state-text">还没有旅行记录，去「目的地」添加吧</div></div>` : '';
    return stats + maps + note + hint;
  }

  function bindTravelMap() {
    document.querySelectorAll('.travel-map').forEach(map => {
      const viewport = map.querySelector('.travel-map-viewport');
      const stage = map.querySelector('.travel-map-stage');
      const card = map.querySelector('.travel-pin-card');
      if (!card) return;
      stage.querySelectorAll('.map-pin').forEach(pin => pin.onclick = event => {
        event.stopPropagation();
        stage.querySelectorAll('.map-pin').forEach(item => item.setAttribute('aria-expanded', String(item === pin)));
        card.querySelector('[data-pin-city]').textContent = pin.dataset.city;
        card.querySelector('[data-pin-location]').textContent = pin.dataset.canonical && pin.dataset.canonical !== pin.dataset.city ? `定位：${pin.dataset.canonical}` : '';
        card.querySelector('[data-pin-status]').textContent = pin.dataset.status;
        card.querySelector('[data-pin-status]').style.color = getComputedStyle(pin).getPropertyValue('--pin-color');
        const details = [];
        if (pin.dataset.date) details.push(`📅 ${pin.dataset.date}`);
        if (pin.dataset.days) details.push(`🌙 ${pin.dataset.days} 天`);
        if (pin.dataset.spots) details.push(`📍 ${pin.dataset.spots}`);
        if (pin.dataset.food) details.push(`🍜 ${pin.dataset.food}`);
        card.querySelector('[data-pin-details]').textContent = details.join(' · ') || '暂无更多行程信息';
        card.hidden = false;
      });
      const close = card.querySelector('.travel-pin-close');
      close.onclick = event => { event.stopPropagation(); card.hidden = true; stage.querySelectorAll('.map-pin').forEach(pin => pin.setAttribute('aria-expanded', 'false')); };

      let scale = 1, x = 0, y = 0;
      const pointers = new Map();
      let gesture = null;
      const clamp = () => {
        const vw = viewport.clientWidth, vh = viewport.clientHeight;
        const sw = stage.offsetWidth * scale, sh = stage.offsetHeight * scale;
        x = sw <= vw ? (vw - sw) / 2 : Math.min(0, Math.max(vw - sw, x));
        y = sh <= vh ? (vh - sh) / 2 : Math.min(0, Math.max(vh - sh, y));
      };
      const apply = () => { clamp(); stage.style.transform = `translate(${x}px,${y}px) scale(${scale})`; };
      const reset = () => { scale = 1; x = 0; y = 0; apply(); };
      const zoomAt = (next, cx, cy) => {
        const old = scale;
        scale = Math.max(1, Math.min(4, next));
        const ratio = scale / old;
        x = cx - (cx - x) * ratio;
        y = cy - (cy - y) * ratio;
        apply();
      };
      const closeExpanded = () => {
        map.classList.remove('is-expanded');
        map.querySelector('.travel-map-controls').hidden = true;
        document.body.classList.remove('travel-map-open');
        pointers.clear(); gesture = null; reset();
      };
      map.querySelector('.travel-map-expand').onclick = () => {
        document.querySelectorAll('.travel-map.is-expanded').forEach(other => { if (other !== map) other.querySelector('[data-map-close]').click(); });
        map.classList.add('is-expanded');
        map.querySelector('.travel-map-controls').hidden = false;
        document.body.classList.add('travel-map-open');
        requestAnimationFrame(reset);
      };
      map.querySelector('[data-map-close]').onclick = closeExpanded;
      map.querySelector('[data-map-reset]').onclick = reset;
      map.querySelectorAll('[data-map-zoom]').forEach(button => button.onclick = () => {
        const rect = viewport.getBoundingClientRect();
        zoomAt(scale + (button.dataset.mapZoom === 'in' ? .5 : -.5), rect.width / 2, rect.height / 2);
      });
      viewport.onwheel = event => {
        if (!map.classList.contains('is-expanded')) return;
        event.preventDefault();
        const rect = viewport.getBoundingClientRect();
        zoomAt(scale * (event.deltaY < 0 ? 1.15 : .87), event.clientX - rect.left, event.clientY - rect.top);
      };
      stage.onpointerdown = event => {
        if (!map.classList.contains('is-expanded') || event.target.closest('.map-pin')) return;
        event.preventDefault(); stage.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
        if (pointers.size === 1) gesture = { type:'pan', px:event.clientX, py:event.clientY };
        else if (pointers.size === 2) {
          const [a,b] = [...pointers.values()], dx=b.x-a.x, dy=b.y-a.y;
          gesture = { type:'pinch', distance:Math.hypot(dx,dy), scale, x, y, mx:(a.x+b.x)/2, my:(a.y+b.y)/2 };
        }
      };
      stage.onpointermove = event => {
        if (!pointers.has(event.pointerId) || !gesture) return;
        event.preventDefault(); pointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
        if (pointers.size === 1 && gesture.type === 'pan') {
          x += event.clientX - gesture.px; y += event.clientY - gesture.py;
          gesture.px = event.clientX; gesture.py = event.clientY; apply();
        } else if (pointers.size >= 2) {
          const [a,b] = [...pointers.values()], distance=Math.hypot(b.x-a.x,b.y-a.y), next=Math.max(1,Math.min(4,gesture.scale*distance/Math.max(1,gesture.distance))), ratio=next/gesture.scale;
          scale=next; x=gesture.mx-(gesture.mx-gesture.x)*ratio; y=gesture.my-(gesture.my-gesture.y)*ratio; apply();
        }
      };
      const pointerEnd = event => {
        pointers.delete(event.pointerId);
        if (pointers.size === 1) { const p=[...pointers.values()][0]; gesture={type:'pan',px:p.x,py:p.y}; }
        else if (!pointers.size) gesture=null;
      };
      stage.onpointerup = pointerEnd;
      stage.onpointercancel = pointerEnd;
      map.onkeydown = event => { if (event.key === 'Escape' && map.classList.contains('is-expanded')) closeExpanded(); };
    });
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
        <p><span class="tag">${esc(r.cat || '其他')}</span> <span class="tag" style="background:rgba(255,154,174,.12);color:var(--life-deep);">${esc(r.status)}</span> ${r.rating ? '⭐ ' + r.rating : ''}</p>
        ${r.review ? `<p>${esc(r.review)}</p>` : ''}
      </div>
    </div>`).join('');
    return stats + recommend + list;
  }

  /* 投资：行情是可选增强，日志始终离线可用。 */
  const MARKET_SYMBOLS = [
    ['^GSPC','标普500'],['^IXIC','纳斯达克'],['^HSI','恒生指数'],['^GDAXI','德国DAX'],['GC=F','黄金'],['CNY=X','USD/CNY'],['EURCNY=X','EUR/CNY'],['EURUSD=X','EUR/USD']
  ];
  function renderInvestMarket() {
    let cache={}; try{cache=JSON.parse(localStorage.getItem('xiaoman:marketCache')||'{}');}catch(_){}
    const cards=MARKET_SYMBOLS.map(([s,n])=>{const q=cache[s]; return `<div class="market-card" data-market="${esc(s)}"><b>${esc(n)}</b><small>${esc(s)}</small><strong>${q?q.price:'—'}</strong><span class="${q&&q.change>=0?'market-up':'market-down'}">${q?(q.change>=0?'▲ ':'▼ ')+Math.abs(q.change).toFixed(2)+'%':'等待刷新'}</span></div>`;}).join('');
    return `<div class="market-head"><div><h3>全球市场</h3><small id="market-time">${cache._at?'缓存于 '+esc(cache._at):'行情仅供参考'}</small></div><button class="btn-primary" id="market-refresh">刷新行情</button></div><div class="market-grid">${cards}</div><div id="market-error" class="empty-hint"></div>`;
  }
  async function loadQuote(symbol) {
    const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),8000);
    try { const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d`,{signal:ctl.signal}); if(!r.ok) throw new Error('HTTP '+r.status); const j=await r.json(), x=j.chart?.result?.[0], m=x?.meta; if(!m) throw new Error('empty'); const prev=m.chartPreviousClose||m.previousClose||m.regularMarketPrice, price=m.regularMarketPrice, change=prev?((price-prev)/prev*100):0; return {price:Number(price).toFixed(price<10?4:2),change}; } finally {clearTimeout(timer);}
  }
  function bindInvestMarket(){ const b=document.getElementById('market-refresh'); if(!b)return; b.onclick=async()=>{b.disabled=true; const err=document.getElementById('market-error'), cache={}; const results=await Promise.allSettled(MARKET_SYMBOLS.map(async([s])=>[s,await loadQuote(s)])); results.forEach(x=>{if(x.status==='fulfilled')cache[x.value[0]]=x.value[1];}); cache._at=new Date().toLocaleString('zh-CN'); if(Object.keys(cache).length>1){localStorage.setItem('xiaoman:marketCache',JSON.stringify(cache));renderContent();}else err.textContent='行情加载失败，请检查网络'; b.disabled=false;}; }
  function renderStockLog(tab){ const list=Store.getList(tab).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')); const filters=`<div class="filter-row"><select id="stock-type"><option value="">全部类型</option>${['复盘','操作','想法'].map(x=>`<option>${x}</option>`).join('')}</select><input id="stock-symbol" placeholder="筛选标的"></div>`; return filters+(list.length?list.map(r=>`<div class="app-card stock-log" data-type="${esc(r.type)}" data-symbol="${esc(r.symbol||'')}"><div class="app-card-head"><span class="app-card-title">${esc(r.date)} · ${esc(r.type)} ${r.symbol?'· '+esc(r.symbol):''}</span>${cardOpsMenu(r._id)}</div><div class="app-card-body"><p>${esc(r.content)}</p>${r.photo?`<img class="thumb-prev" src="${esc(r.photo)}">`:''}</div></div>`).join(''):'<div class="empty-state"><div class="empty-state-icon">📈</div><div class="empty-state-text">还没有投资日志</div></div>'); }
  function bindStockLog(){ const apply=()=>{const t=document.getElementById('stock-type').value,s=document.getElementById('stock-symbol').value.trim().toLowerCase();document.querySelectorAll('.stock-log').forEach(x=>x.hidden=!!t&&x.dataset.type!==t||!!s&&!x.dataset.symbol.toLowerCase().includes(s));}; const t=document.getElementById('stock-type'),s=document.getElementById('stock-symbol'); if(t)t.onchange=apply;if(s)s.oninput=apply; }

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

  /* 统一计划：无日期=待办，有日期=日程；重复记录只在显示时计算。 */
  function planOccurs(r, key) {
    if (!r.date) return false; if (r.date === key) return true; if (!r.repeat || r.repeat === '不重复' || r.date > key) return false;
    const a = new Date(r.date + 'T00:00:00'), b = new Date(key + 'T00:00:00'), days = Math.round((b - a) / 86400000);
    return r.repeat === '每天' || (r.repeat === '每周' && days % 7 === 0) || (r.repeat === '每月' && a.getDate() === b.getDate());
  }
  let planMonthCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let selectedPlanDate = todayKey();
  function planAgendaRow(r, virtualDate) {
    const done=r.status==='完成', meta=[r.time||'全天',r.domain||'生活',r.priority||'中'];
    if(r.repeat&&r.repeat!=='不重复')meta.push(r.repeat);
    return `<div class="plan-agenda-row ${done?'done':''}"><input type="checkbox" data-toggle="${r._id}" data-key="status" data-on="完成" data-off="计划" ${done?'checked':''}><button type="button" class="plan-agenda-main" data-edit="${r._id}"><b>${esc(r.title)}</b><small>${meta.map(esc).join(' · ')}</small></button><button class="shop-item-del" data-edit="${r._id}">✎</button><button class="shop-item-del" data-del="${r._id}">×</button></div>`;
  }
  function renderPlans(tab) {
    const plans=Store.getList(tab),total=plans.length,done=plans.filter(r=>r.status==='完成').length,tk=todayKey();
    const y=planMonthCursor.getFullYear(),m=planMonthCursor.getMonth(),first=new Date(y,m,1),offset=(first.getDay()+6)%7,gridStart=new Date(y,m,1-offset);
    const monthPlans=plans.filter(r=>r.date&&r.date.startsWith(`${y}-${String(m+1).padStart(2,'0')}`));
    let cells='';
    for(let i=0;i<42;i++){
      const d=new Date(gridStart);d.setDate(gridStart.getDate()+i);const key=dateKey(d),inMonth=d.getMonth()===m,events=plans.filter(r=>planOccurs(r,key)).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
      const chips=events.slice(0,2).map(r=>`<span class="plan-chip domain-${esc(r.domain||'其他')} priority-${esc(r.priority||'中')} ${r.status==='完成'?'done':''}">${r.time?`<i>${esc(r.time)}</i> `:''}${esc(r.title)}</span>`).join('');
      cells+=`<button type="button" class="plan-calendar-day ${inMonth?'':'outside'} ${key===tk?'today':''} ${key===selectedPlanDate?'selected':''}" data-plan-date="${key}"><b>${d.getDate()}</b><span class="plan-day-events">${chips}${events.length>2?`<em>+${events.length-2}</em>`:''}</span></button>`;
    }
    const agenda=plans.filter(r=>planOccurs(r,selectedPlanDate)).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    const unscheduled=plans.filter(r=>!r.date&&r.status!=='完成');
    const selected=new Date(selectedPlanDate+'T00:00:00'),week='日一二三四五六'[selected.getDay()];
    return `<div class="plan-summary">本月 ${monthPlans.length} 项 · 共 ${total} 项 · 已完成 ${done} 项 · ${total?Math.round(done/total*100):0}%</div>
      <form class="plan-quick" id="plan-quick-form"><span>＋</span><input type="text" id="quick-add-input" placeholder="添加计划，回车保存" autocomplete="off"><input type="date" id="quick-add-date" value="${selectedPlanDate}"><button type="button" id="special-add">详细</button></form>
      <div class="plan-layout"><section class="plan-calendar-card"><header><button type="button" data-plan-prev aria-label="上个月">‹</button><h3>${y} 年 ${m+1} 月</h3><button type="button" data-plan-next aria-label="下个月">›</button><button type="button" class="plan-today-btn" data-plan-today>今天</button></header><div class="plan-weekdays">${'一二三四五六日'.split('').map(x=>`<span>${x}</span>`).join('')}</div><div class="plan-calendar-grid">${cells}</div></section>
      <aside class="plan-side"><section class="plan-agenda"><header><h3>${selected.getMonth()+1} 月 ${selected.getDate()} 日 · 周${week}</h3><button type="button" id="plan-day-add">＋</button></header>${agenda.length?agenda.map(r=>planAgendaRow(r,selectedPlanDate)).join(''):'<div class="empty-hint">当天没有计划</div>'}</section>
      <section class="plan-unscheduled"><h3>未排期待办 <small>${unscheduled.length}</small></h3>${unscheduled.length?unscheduled.map(r=>planAgendaRow(r,'')).join(''):'<div class="empty-hint">没有未排期待办</div>'}</section></aside></div>`;
  }
  function bindPlans(tab) {
    const form=document.getElementById('plan-quick-form'),input=document.getElementById('quick-add-input');
    const saveQuick=e=>{if(e)e.preventDefault();const title=input?.value.trim();if(!title)return;Store.addRecord(tab,{title,date:document.getElementById('quick-add-date').value,time:'',priority:'中',domain:'生活',repeat:'不重复',status:'计划',note:''});renderContent();};
    if(form&&input){form.onsubmit=saveQuick;input.onkeydown=e=>{if(e.key==='Enter')saveQuick(e);};}
    document.querySelectorAll('[data-plan-date]').forEach(b=>b.onclick=()=>{selectedPlanDate=b.dataset.planDate;renderContent();});
    document.querySelector('[data-plan-prev]')?.addEventListener('click',()=>{planMonthCursor=new Date(planMonthCursor.getFullYear(),planMonthCursor.getMonth()-1,1);selectedPlanDate=dateKey(planMonthCursor);renderContent();});
    document.querySelector('[data-plan-next]')?.addEventListener('click',()=>{planMonthCursor=new Date(planMonthCursor.getFullYear(),planMonthCursor.getMonth()+1,1);selectedPlanDate=dateKey(planMonthCursor);renderContent();});
    document.querySelector('[data-plan-today]')?.addEventListener('click',()=>{const n=new Date();planMonthCursor=new Date(n.getFullYear(),n.getMonth(),1);selectedPlanDate=todayKey();renderContent();});
    const detail=document.getElementById('special-add'),dayAdd=document.getElementById('plan-day-add');
    if(detail)detail.onclick=()=>openForm(tab,null,{date:document.getElementById('quick-add-date').value});
    if(dayAdd)dayAdd.onclick=()=>openForm(tab,null,{date:selectedPlanDate});
  }

  /* ============================================================
   * 习惯热力
   * ============================================================ */
  function renderHabits(tab) {
    const logs = Store.getList(tab);
    const habits = Array.from(new Set(['看书', '早睡早起', '运动打卡', '学习'].concat(logs.map(r => r.habit).filter(Boolean))));
    const tk = todayKey(), now = new Date(), monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); const weekStart = dateKey(monday);
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">${logs.length}</div><div class="stat-label">总打卡</div></div>
      <div class="stat-card group-work"><div class="stat-value">${new Set(logs.map(r => r.date).filter(Boolean)).size}</div><div class="stat-label">打卡天数</div></div>
    </div>`;
    const quick = `<div class="habit-quick">${habits.map(h => `<button data-habit-check="${esc(h)}" ${logs.some(r => r.habit === h && r.date === tk) ? 'disabled' : ''}>${logs.some(r => r.habit === h && r.date === tk) ? '✓' : '+'} ${esc(h)}</button>`).join('')}</div>`;
    return stats + quick + habits.map(h => {
      const hl = logs.filter(r => r.habit === h);
      const dates = new Set(hl.map(r => r.date)); let streak = 0; for (let i=0;i<366;i++){ const d=new Date(); d.setDate(d.getDate()-i); if(dates.has(dateKey(d))) streak++; else if(i>0) break; }
      const weeklyGoal = parseInt(hl[0]?.weeklyGoal) || 3, weekCount = hl.filter(r => r.date >= weekStart && r.date <= tk).length;
      return `<div class="habit-section">
        <div class="habit-section-head"><span class="habit-section-title">${esc(h)}</span><span class="habit-section-stat">🔥 ${streak}天 · 本周 ${weekCount}/${weeklyGoal}</span></div>
        ${heatmapHtml(hl, 'note', '')}
      </div>`;
    }).join('');
  }
  function bindHabits(tab) { document.querySelectorAll('[data-habit-check]').forEach(b => b.onclick = () => { Store.addRecord(tab, { habit:b.dataset.habitCheck, date:todayKey(), weeklyGoal:3, note:'' }); renderContent(); }); }
  function ensureExerciseHabit(date) { if (!Store.getList('habitLogs').some(r => r.habit === '运动打卡' && r.date === date)) Store.addRecord('habitLogs', { habit:'运动打卡', date, weeklyGoal:3, note:'由运动记录自动生成' }); }

  /* ============================================================
   * 运动每日打卡
   * ============================================================ */
  function renderFitnessDaily(tab) {
    const list = Store.getList(tab);
    const completed = list.filter(r => r.done).length;
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">${list.length}</div><div class="stat-label">运动项目</div></div>
      <div class="stat-card group-work"><div class="stat-value">${completed}</div><div class="stat-label">已完成</div></div>
      <div class="stat-card group-work"><div class="stat-value">${list.filter(r => (r.date || '').startsWith(todayKey().slice(0, 7))).length}</div><div class="stat-label">本月</div></div>
    </div>` + previewHeat(list, 'date', '近 30 天运动打卡');
    const gallery = renderGallery(tab);
    if (!list.length) return stats + `<div class="empty-state"><div class="empty-state-icon">🏃</div><div class="empty-state-text">还没有运动记录，点击 + 添加</div></div>`;
    const items = list.map(r => `<div class="todo-item">
      <input type="checkbox" class="todo-check" data-toggle="${r._id}" data-key="done" ${r.done ? 'checked' : ''}>
      <div class="todo-main">
        <div class="todo-title" style="${r.done ? 'text-decoration:line-through;opacity:.55;' : ''}">${esc(r.item)}</div>
        <div class="todo-meta">${r.date || ''} · ${r.duration ? esc(r.duration) : '未填时长'} · ${r.calories || 0} kcal</div>
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
      <div class="app-card-body"><p>${r.bodyfat ? '体脂 ' + esc(r.bodyfat) : ''} ${r.goal ? '· 目标 ' + r.goal + 'kg' : ''}</p></div>
    </div>`).join('');
    return chart + items;
  }

  /* ============================================================
   * 个人护理记录（原「护肤打卡」）
   * ============================================================ */
  function chips(arr, color) {
    if (!arr || !arr.length) return '';
    return `<div class="care-chips">` + arr.map(x => `<span class="care-chip" style="background:${color}">${esc(x)}</span>`).join('') + `</div>`;
  }
  function renderSkincare(tab) {
    const list = Store.getList(tab).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">${list.length}</div><div class="stat-label">记录天数</div></div>
      <div class="stat-card group-work"><div class="stat-value">${list.filter(r => (r.morning || []).length).length}</div><div class="stat-label">早间护理</div></div>
      <div class="stat-card group-work"><div class="stat-value">${list.filter(r => (r.night || []).length).length}</div><div class="stat-label">晚间护理</div></div>
    </div>` + previewHeat(list, 'date', '近 30 天护理打卡');
    if (!list.length) return stats + `<div class="empty-state"><div class="empty-state-icon">🧴</div><div class="empty-state-text">还没有护理记录，点击 + 添加</div></div>`;
    const items = list.map(r => `<div class="app-card">
      <div class="app-card-head">
        <span class="app-card-title">${esc(r.date || '')}</span>
        ${cardOpsMenu(r._id)}
      </div>
      <div class="app-card-body">
        <p style="font-weight:600;color:var(--work-deep);margin:2px 0;">🌅 早间</p>
        ${chips(r.morning, 'rgba(255,210,120,.25)') || '<span class="care-none">未记录</span>'}
        <p style="font-weight:600;color:var(--work-deep);margin:8px 0 2px;">🌙 晚间</p>
        ${chips(r.night, 'rgba(150,130,255,.18)') || '<span class="care-none">未记录</span>'}
        ${r.extra ? `<p style="margin-top:8px;">➕ 其他：${esc(r.extra)}</p>` : ''}
        ${chips(r.conditions, 'rgba(255,154,174,.18)')}
        ${r.note ? `<p>${esc(r.note)}</p>` : ''}
      </div>
    </div>`).join('');
    return stats + items;
  }

  /* ============================================================
   * 日拱一卒 - 进度总览
   * ============================================================ */
  function renderRigongOverview(tab) {
    const study = Store.getList({ collection: 'studyTasks' });
    const habits = Store.getList({ collection: 'habitLogs' });
    const daily = Store.getList({ collection: 'daily' }).filter(r => r.done);
    const diary = Store.getList({ collection: 'rigongLogs' });
    const books = Store.getList({ collection: 'bookLogs' }), skincare = Store.getList({ collection:'skincare' });
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
    const totalH = study.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value">🔥 ${streak}</div><div class="stat-label">连续天数</div></div>
      <div class="stat-card group-work"><div class="stat-value">${allDates.length}</div><div class="stat-label">拱卒天数</div></div>
      <div class="stat-card group-work"><div class="stat-value">${yearPct}%</div><div class="stat-label">年度进度</div></div>
      <div class="stat-card group-work"><div class="stat-value">${Math.round(totalH * 10) / 10}h</div><div class="stat-label">学习时长</div></div>
    </div>`;
    const heatData = allDates.map(d => ({ date: d, value: archDates[d] }));
    const heat = `<div class="habit-section">
      <div class="habit-section-head"><span class="habit-section-title">📅 年度拱卒热力图</span><span class="habit-section-stat">${allDates.length} 天有进益</span></div>
      ${heatmapHtml(heatData, 'value', '')}
    </div>`;
    // 名言墙（固定座右铭）
    const motto = (typeof MOTTO !== 'undefined') ? MOTTO : '日拱一卒无有尽，功不唐捐终入海。';
    const quoteWall = `<div class="app-card" style="text-align:center;background:var(--card-work);">
      <div style="font-size:16px;font-weight:700;line-height:1.6;">"${esc(motto)}"</div>
    </div>`;
    // 今日一得预览
    const tk = todayKey();
    const todayDiary = diary.filter(r => r.date === tk);
    const diaryPreview = todayDiary.length ? `<div class="app-card"><div class="app-card-body"><p>📝 今日一得：${esc(todayDiary[0].note)}</p></div></div>` : '';
    const signals=`<div class="signal-grid"><button data-goto="rigong" data-tab-target="books">📚 读书<b>${books.length}</b></button><button data-goto="study" data-tab-target="history">🎓 学习<b>${study.length}</b></button><button data-goto="discipline" data-tab-target="fitDaily">🏃 运动<b>${daily.length}</b></button><button data-goto="discipline" data-tab-target="skincare">🧴 护理<b>${skincare.length}</b></button></div>`;
    return stats + signals + heat + quoteWall + diaryPreview;
  }

  /* ============================================================
   * 资金管理
   * ============================================================ */
  function moneySettings() { return Store.getSetting('moneySettings', { base:'€', rates:{'€':1,'$':0.92,'¥':0.13} }); }
  function baseAmount(v, currency) { const s = moneySettings(), rate = parseFloat(s.rates[currency || '€']), baseRate=parseFloat(s.rates[s.base||'€'])||1; return (parseFloat(v)||0) * (Number.isFinite(rate) ? rate : 1) / baseRate; }
  function baseSymbol() { return moneySettings().base || '€'; }
  function budgetWindow(period, now = new Date()) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let end;
    if (period === '周') {
      const offset = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - offset);
      end = new Date(start); end.setDate(end.getDate() + 7);
    } else if (period === '季') {
      start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
      end = new Date(start); end.setMonth(end.getMonth() + 3);
    } else if (period === '年') {
      start.setMonth(0, 1);
      end = new Date(start); end.setFullYear(end.getFullYear() + 1);
    } else {
      start.setDate(1);
      end = new Date(start); end.setMonth(end.getMonth() + 1);
    }
    return { start: dateKey(start), end: dateKey(end) };
  }
  function budgetSpent(budget, flows) {
    const window = budgetWindow(budget.period || '月');
    return flows.filter(f => f.direction === '支出' && f.budgetStatus !== '预算外' &&
      f.date >= window.start && f.date < window.end &&
      ((budget.cat || '总预算') === '总预算' || f.category === budget.cat))
      .reduce((sum, f) => sum + baseAmount(f.amount, f.currency), 0);
  }
  function compactMoney(value) {
    const n = Math.abs(Number(value) || 0), sign = value < 0 ? '-' : '';
    if (n >= 1000000) return `${sign}${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}m`;
    if (n >= 1000) return `${sign}${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
    return `${sign}${n.toFixed(n >= 100 ? 0 : 1)}`;
  }
  function moneyBar(label, value, max, tone, suffix) {
    const pct = max > 0 ? Math.min(100, Math.max(0, value / max * 100)) : 0;
    return `<button class="money-bar-row" type="button" ${suffix?.goto ? `data-goto="money" data-tab-target="${suffix.goto}"` : ''}>
      <span class="money-bar-label">${esc(label)}</span><span class="money-bar-track"><i class="tone-${tone}" style="width:${pct.toFixed(1)}%"></i></span>
      <span class="money-bar-value">${suffix?.text || `${baseSymbol()}${compactMoney(value)}`}</span></button>`;
  }
  function renderMoneyOverview(tab) {
    const assets = Store.getList({ collection: 'moneyAssets' });
    const flows = Store.getList({ collection: 'flows' });
    const ym = todayKey().slice(0, 7);
    const month = flows.filter(r => (r.date || '').startsWith(ym));
    const inc = month.filter(r => r.direction === '收入').reduce((s, r) => s + baseAmount(r.amount,r.currency), 0);
    const exp = month.filter(r => r.direction === '支出').reduce((s, r) => s + baseAmount(r.amount,r.currency), 0);
    const assetTotal = assets.reduce((s, r) => s + baseAmount(r.amount,r.currency), 0), bs = baseSymbol();
    const subs = Store.getList({ collection: 'moneySubs' });
    const fixedMonthly = subs.reduce((sum, r) => {
      const amount = baseAmount(r.amount, r.currency);
      return sum + amount * ({ 周:52/12, 月:1, 季:1/3, 年:1/12 }[r.cycle || '月'] || 1);
    }, 0) + Store.getList('homeBills').filter(r=>r.enabled!==false).reduce((sum,r)=>{
      const amount=baseAmount(r.amount,r.currency);
      return sum+amount*({'每月':1,'每季度':1/3,'每半年':1/6,'每年':1/12}[r.cycle||'每月']||1);
    },0);
    const cards = [
      ['assets', assetTotal, '资产总额', 'asset'], ['flows', inc, '本月收入', 'income'],
      ['flows', exp, '本月支出', 'expense'], ['flows', inc-exp, '本月结余', 'balance'],
      ['subs', fixedMonthly, '固定支出/月', 'fixed']
    ].map(([target,value,label,tone]) => `<button class="money-kpi tone-${tone}" data-goto="money" data-tab-target="${target}"><b>${bs}${compactMoney(value)}</b><span>${label}</span><i>›</i></button>`).join('');

    const assetGroups = {};
    assets.forEach(r => { const key=r.type||'其他'; assetGroups[key]=(assetGroups[key]||0)+baseAmount(r.amount,r.currency); });
    const assetRows = Object.entries(assetGroups).sort((a,b)=>b[1]-a[1]);
    const assetMax = Math.max(1,...assetRows.map(r=>r[1]));
    const assetHtml = assetRows.length ? assetRows.map((r,i)=>moneyBar(r[0],r[1],assetMax,['blue','navy','teal','gray'][i%4],{goto:'assets'})).join('') : '<p class="money-empty">暂无资产记录</p>';

    const expenseGroups={};
    month.filter(r=>r.direction==='支出').forEach(r=>{const key=r.category||'其他';expenseGroups[key]=(expenseGroups[key]||0)+baseAmount(r.amount,r.currency);});
    let expenseRows=Object.entries(expenseGroups).sort((a,b)=>b[1]-a[1]);
    if(expenseRows.length>5){const other=expenseRows.slice(5).reduce((s,r)=>s+r[1],0);expenseRows=expenseRows.slice(0,5).concat([['其他杂项',other]]);}
    const expenseMax=Math.max(1,...expenseRows.map(r=>r[1]));
    const expenseHtml=expenseRows.length?expenseRows.map((r,i)=>moneyBar(r[0],r[1],expenseMax,['pink','blue','amber','gray','teal'][i%5],{goto:'flows'})).join(''):'<p class="money-empty">本月暂无支出</p>';

    const budgets=Store.getList('moneyBudget').filter(b=>(b.period||'月')==='月').slice(0,5);
    const budgetHtml=budgets.length?budgets.map(b=>{const limit=baseAmount(b.limit??b.monthlyLimit,b.currency),used=budgetSpent(b,flows),pct=limit?used/limit*100:0,tone=pct>=100?'danger':pct>=80?'warn':'good';return moneyBar(b.cat||'总预算',used,Math.max(limit,used),tone,{goto:'budget',text:`${bs}${compactMoney(used)} / ${bs}${compactMoney(limit)} · ${pct.toFixed(0)}%${pct>=100?' 超支':''}`});}).join(''):'<p class="money-empty">暂无月度预算</p>';

    const goals=Store.getList('moneyGoals').filter(g=>(g.status||'进行中')==='进行中').slice(0,5);
    const goalHtml=goals.length?goals.map(g=>{const cur=baseAmount(g.current,g.currency),target=baseAmount(g.target,g.currency),pct=target?cur/target*100:0;return moneyBar(g.name||'未命名目标',cur,Math.max(target,cur),'blue',{goto:'goals',text:`${pct.toFixed(0)}%`});}).join(''):'<p class="money-empty">暂无进行中的储蓄目标</p>';

    const trend=[];
    for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const key=dateKey(d).slice(0,7),rows=flows.filter(r=>(r.date||'').startsWith(key)),income=rows.filter(r=>r.direction==='收入').reduce((s,r)=>s+baseAmount(r.amount,r.currency),0),expense=rows.filter(r=>r.direction==='支出').reduce((s,r)=>s+baseAmount(r.amount,r.currency),0);trend.push({label:`${d.getMonth()+1}月`,value:income-expense,has:rows.length>0});}
    const vals=trend.map(r=>r.value),lo=Math.min(0,...vals),hi=Math.max(0,...vals),range=hi-lo||1;
    const points=trend.map((r,i)=>`${(i/5*100).toFixed(1)},${(44-(r.value-lo)/range*36).toFixed(1)}`).join(' ');
    const dots=trend.map((r,i)=>r.has?`<circle cx="${(i/5*100).toFixed(1)}" cy="${(44-(r.value-lo)/range*36).toFixed(1)}" r="1.8"/>`:'').join('');
    const trendHtml=`<div class="money-trend"><svg viewBox="-2 0 104 50" preserveAspectRatio="none"><line x1="0" y1="${(44-(0-lo)/range*36).toFixed(1)}" x2="100" y2="${(44-(0-lo)/range*36).toFixed(1)}" class="zero"/><polyline points="${points}"/>${dots}</svg><div>${trend.map(r=>`<span>${r.label}<b>${r.has?(r.value>=0?'+':'')+bs+compactMoney(r.value):'无数据'}</b></span>`).join('')}</div></div>`;

    return `<div class="money-dashboard"><div class="money-kpis">${cards}</div>
      <section><h3>资产构成 <small>按类型</small></h3>${assetHtml}</section>
      <section><h3>本月支出去向</h3>${expenseHtml}</section>
      <section><h3>预算状态 <small>月度真实对账</small></h3>${budgetHtml}</section>
      <section><h3>储蓄目标</h3>${goalHtml}</section>
      <section><h3>近 6 月结余趋势</h3>${trendHtml}</section></div>`;
  }

  function renderMoneyFlows(tab) {
    const flows = Store.getList(tab);
    const ym = todayKey().slice(0, 7);
    const month = flows.filter(r => (r.date || '').startsWith(ym));
    const inc = month.filter(r => r.direction === '收入').reduce((s, r) => s + baseAmount(r.amount,r.currency), 0);
    const exp = month.filter(r => r.direction === '支出').reduce((s, r) => s + baseAmount(r.amount,r.currency), 0), bs=baseSymbol();
    const stats = `<div class="stat-row">
      <div class="stat-card group-work"><div class="stat-value" style="color:var(--life-deep);">${bs}${inc.toFixed(0)}</div><div class="stat-label">本月收入</div></div>
      <div class="stat-card group-work"><div class="stat-value" style="color:#16a34a;">${bs}${exp.toFixed(0)}</div><div class="stat-label">本月支出</div></div>
      <div class="stat-card group-work"><div class="stat-value">${bs}${(inc - exp).toFixed(0)}</div><div class="stat-label">结余</div></div>
    </div>`;
    if (!flows.length) return stats + `<div class="empty-state"><div class="empty-state-icon">💶</div><div class="empty-state-text">还没有收支记录，点击 + 添加</div></div>`;
    const recent = flows.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 30);
    const list = recent.map(r => `<div class="app-card">
      <div class="app-card-head">
        <span class="app-card-title">${esc(r.category || '其他')}</span>
        <span class="app-card-ops"><button data-edit="${r._id}">编辑</button><button class="danger" data-del="${r._id}">删</button></span>
      </div>
      <div class="app-card-body">
         <p><span class="tag" style="background:${r.direction === '收入' ? 'rgba(255,154,174,.12)' : 'rgba(110,184,255,.12)'};color:${r.direction === '收入' ? 'var(--life-deep)' : 'var(--work-deep)'}">${esc(r.direction)}</span> <b>${esc(r.currency||'€')}${parseFloat(r.amount || 0).toFixed(2)}</b> · ${esc(r.account || '未分类')} ${r.categoryDetail ? '· '+esc(r.categoryDetail):''}</p>
        ${r.date ? `<p>${r.date}</p>` : ''} ${r.note ? `<p>${esc(r.note)}</p>` : ''}
      </div>
    </div>`).join('');
    return stats + list;
  }

  function renderMoneyBudget(tab) {
    const budgets = Store.getList(tab), flows = Store.getList('flows'), bs=baseSymbol();
    if (!budgets.length) return `<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">还没有预算，点击 + 添加</div></div>`;
    return budgets.map(b => { const limit=baseAmount(b.limit ?? b.monthlyLimit,b.currency), spent=budgetSpent(b,flows), pct=limit?Math.min(150,spent/limit*100):0;
      return `<div class="app-card"><div class="app-card-head"><span class="app-card-title">${esc(b.cat||'总预算')} · ${esc(b.period||'月')}</span><span class="app-card-ops"><button data-edit="${b._id}">编辑</button><button data-del="${b._id}">删</button></span></div><div class="app-card-body"><p>${bs}${spent.toFixed(0)} / ${bs}${limit.toFixed(0)} · 剩余 ${bs}${(limit-spent).toFixed(0)}</p><div class="progress"><div class="progress-bar" style="width:${Math.min(100,pct)}%;background:${spent>limit?'#ef4444':'var(--work)'}"></div></div></div></div>`;
    }).join('');
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
      const months = r.deadline ? Math.max(1, Math.ceil((new Date(r.deadline+'T00:00:00')-new Date())/(86400000*30.44))) : 0;
      const monthly = months ? Math.max(0,(target-cur)/months) : 0;
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
          <div class="app-card-body"><p>${esc(r.currency||'€')}${cur.toFixed(0)} / ${esc(r.currency||'€')}${target.toFixed(0)} · ${Math.round(pct)}%</p>${monthly?`<p>每月需存约 ${esc(r.currency||'€')}${monthly.toFixed(0)} · 截止 ${r.deadline}</p>`:''}<p>${esc(r.goalType||'目标')} · ${esc(r.status||'进行中')} · ${esc(r.priority||'中')}优先级</p></div>
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
  function renderJikuiBoard(){ const list=Store.getList('todos'), states=['待办','进行','完成']; return `<div class="kanban">${states.map((s,i)=>`<section><h3>${s}<small>${list.filter(r=>r.status===s).length}</small></h3>${list.filter(r=>r.status===s).map(r=>`<div class="kanban-card"><b>${esc(r.item)}</b><small>${esc(r.due||'无截止日')} · ${esc(r.priority||'中')}</small><div>${i?`<button data-board-move="${r._id}" data-status="${states[i-1]}">←</button>`:''}${i<2?`<button data-board-move="${r._id}" data-status="${states[i+1]}">→</button>`:''}</div></div>`).join('')||'<div class="empty-hint">暂无</div>'}</section>`).join('')}</div>`; }
  function bindJikuiBoard(){ document.querySelectorAll('[data-board-move]').forEach(b=>b.onclick=()=>{const status=b.dataset.status;Store.updateRecord('todos',b.dataset.boardMove,{status,completedDate:status==='完成'?todayKey():''});renderContent();}); }
  function renderJikuiAnalyze(){ const list=Store.getList('todos'), tk=todayKey(), overdue=list.filter(r=>r.due&&r.due<tk&&r.status!=='完成'), completed=list.filter(r=>r.status==='完成'); const trend=[]; for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const ym=dateKey(d).slice(0,7);trend.push(completed.filter(r=>(r.completedDate||'').startsWith(ym)).length);} return `<div class="stat-row"><div class="stat-card group-work"><div class="stat-value">${overdue.length}</div><div class="stat-label">逾期</div></div><div class="stat-card group-work"><div class="stat-value">${completed.length}</div><div class="stat-label">已完成</div></div></div>${previewHeat(completed,'completedDate','完成热力')}${miniLine(trend)}`; }

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
       return { body: miniProgress(0, `${active} 进行中`), foot: `累计 ${Math.round(totalMin * 10) / 10}h` };
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
      const todos = Store.getList({ collection: 'plans' });
      const daily = Store.getList({ collection: 'daily' });
      const total = todos.length;
      const done = todos.filter(r => r.status === '完成').length;
      const today= todos.filter(r=>r.status!=='完成' && planOccurs(r,tk)).length, pending=todos.filter(r=>r.status!=='完成'&&!r.date).length;
      if (!total && !daily.length) return { body: miniProgress(0, ''), foot: '还没有自律记录' };
      return { body: miniProgress(total ? (done / total) * 100 : 0, `今日 ${today} · 待办 ${pending}`), foot: `${daily.length} 次运动` };
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
      return { body: emptyHint('通讯录 · 柚子'), foot: `${contacts.length} 位联系人` };
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
        ${renderNoticeBanner()}
        <div class="section-title">📌 今日提醒</div>
        <div class="reminder-card">${reminders}</div>
        ${renderHomeImportantEvents()}
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
      c.onclick = () => { selectModule(c.dataset.goto); if(c.dataset.tabTarget)selectTab(c.dataset.tabTarget); });
    const exp = document.getElementById('btn-export-home');
    if (exp) exp.onclick = exportBackup;
    const set = document.getElementById('btn-settings-home');
    if (set) set.onclick = openSettings;
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

  function buildReminders() {
    const tk = todayKey();
    const items = [];
    Store.getList({ collection: 'plans' }).filter(r => r.status !== '完成' && (!r.date || planOccurs(r, tk) || r.date < tk)).slice(0, 4).forEach(r =>
      items.push({ icon: '📋', text: r.title, meta: r.date || '待办' }));
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
    const habitNames=Array.from(new Set(Store.getList('habitLogs').filter(r=>r.date>=dateKey(new Date(Date.now()-6*86400000))).map(r=>r.habit)));
    habitNames.filter(h=>!Store.getList('habitLogs').some(r=>r.habit===h&&r.date===tk)).slice(0,2).forEach(h=>items.push({icon:'🔥',text:h,meta:'今日未打卡'}));
    if(Store.getList('daily').length && !Store.getList('daily').some(r=>r.date===tk)) items.push({icon:'🏃',text:'运动',meta:'今日未记录'});
    if(Store.getList('skincare').length && !Store.getList('skincare').some(r=>r.date===tk)) items.push({icon:'🧴',text:'个人护理',meta:'今日未记录'});
    Store.getList('homeCleanings').filter(r=>r.enabled!==false&&daysUntil(maintenanceDue(r))<=Math.max(7,parseInt(r.remindDays)||0)).sort((a,b)=>daysUntil(maintenanceDue(a))-daysUntil(maintenanceDue(b))).slice(0,2).forEach(r=>items.push({icon:'🔧',text:`${r.name} · ${r.task||'设备养护'}`,meta:dueLabel(maintenanceDue(r))}));
    Store.getList('homeStocks').filter(r=>r.enabled!==false&&((Number(r.count)||0)<=(Number(r.minCount)||0)||daysUntil(stockDue(r))<=Math.max(7,parseInt(r.remindDays)||0))).slice(0,2).forEach(r=>items.push({icon:'🧴',text:r.name,meta:(Number(r.count)||0)<=(Number(r.minCount)||0)?'库存偏低':`检查存量 · ${dueLabel(stockDue(r))}`}));
    Store.getList('homeBills').filter(r=>r.enabled!==false&&daysUntil(r.nextDate||r.dueDate)<=Math.max(3,parseInt(r.remindDays)||0)).sort((a,b)=>daysUntil(a.nextDate||a.dueDate)-daysUntil(b.nextDate||b.dueDate)).slice(0,2).forEach(r=>items.push({icon:'💳',text:`${r.name}待入账`,meta:dueLabel(r.nextDate||r.dueDate)}));
    const ps=Store.getSetting('periodSettings',{});
    if(ps.remind&&ps.cycleStart){const phase=periodPhase(tk,ps),start=new Date(ps.cycleStart+'T00:00:00'),now=new Date(tk+'T00:00:00'),len=parseInt(ps.cycleLen)||28,diff=Math.floor((now-start)/86400000),inCycle=((diff%len)+len)%len,until=len-inCycle;const meta=phase==='经期'?`经期第 ${inCycle+1} 天`:phase==='排卵期'?'预计排卵期':phase==='易孕期'?'易孕期':`预计经期还有 ${until} 天`;if(phase!=='安全期'||until<=3)items.push({icon:'🌸',text:'柚子 · 周期状态',meta});}
    upcomingImportantEvents(10).filter(ev=>ev.days<=Math.max(7,parseInt(ev.r.remindDays)||0)).slice(0,3).forEach(ev=>items.push({icon:'💝',text:ev.r.name,meta:ev.days===0?'就是今天':ev.days===1?'明天':`还有${ev.days}天`}));
    if (!items.length) return `<div class="reminder-empty">今天没有待办，享受当下吧～</div>`;
    return `<div class="reminder-list">` + items.map(it =>
      `<div class="reminder-item"><span>${esc(it.icon)}</span><span>${esc(it.text)}</span><small>${esc(it.meta)}</small></div>`
    ).join('') + `</div>`;
  }

  /* ---------------- 首页应用内提醒横幅（方案②） ---------------- */
  function renderNoticeBanner() {
    const today = todayKey();
    const out = [];
    // 重要日期：未来 remindDays 窗口内（含今天）
    const evs = (typeof Topbar !== 'undefined' && Topbar.getUpcomingEvents) ? Topbar.getUpcomingEvents() : [];
    evs.forEach(({ r, days }) => {
      const tail = days === 0 ? '就是今天' : days === 1 ? '明天' : `还有 ${days} 天`;
      out.push(`<div class="notice-banner notice-event">
        <span class="notice-icon">💝</span>
        <div class="notice-text"><b>${esc(r.name)}</b> · ${esc(r.type || '重要日期')} · ${tail}</div>
      </div>`);
    });
    // 经期提醒（柚子设置「提前提醒」开启后）
    const ps = Store.getSetting('periodSettings', {});
    if (ps.remind) {
      const phase = periodPhase(today, ps);
      const tip = phase === '经期' ? '经期进行中，注意保暖休息'
        : phase === '排卵期' ? '排卵期，受孕几率高'
        : phase === '易孕期' ? '易孕期，留意身体信号'
        : '安全期';
      out.push(`<div class="notice-banner notice-period">
        <span class="notice-icon">🌸</span>
        <div class="notice-text"><b>周期提醒</b> · 当前：${esc(phase)} · ${tip}</div>
      </div>`);
    }
    return out.join('');
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
    const ms = moneySettings();
    openModal('设置与备份', `<div class="form-row"><label>昵称</label><input type="text" id="set-name" value="${esc(name)}"></div>
      <div class="form-row"><label>头像</label><div class="avatar-picker"><button type="button" id="avatar-pick" class="avatar-preview" ${avatar?`style="background-image:url(${esc(avatar)})"`:''}>${avatar?'':esc(name.slice(0,1))}</button><span>点击头像，从设备选择图片</span><input type="file" id="set-avatar-file" accept="image/*" hidden><input type="hidden" id="set-avatar" value="${esc(avatar)}"></div></div>
      <div class="backup-block"><div class="backup-subtitle">资金基准币种与手动汇率（1 单位币种 = 多少 EUR）</div><div class="rate-grid"><label>基准<select id="money-base"><option ${ms.base==='€'?'selected':''}>€</option><option ${ms.base==='$'?'selected':''}>$</option><option ${ms.base==='¥'?'selected':''}>¥</option></select></label><label>USD→EUR<input id="rate-usd" type="number" step="any" value="${ms.rates['$']||0.92}"></label><label>CNY→EUR<input id="rate-cny" type="number" step="any" value="${ms.rates['¥']||0.13}"></label></div></div>
      <div class="backup-block">
        <div class="backup-subtitle">JSON 备份（按记录修改时间合并，不整库覆盖）</div>
        <div class="backup-ops">
          <button class="btn-primary" id="btn-export">导出备份(JSON)</button>
          <label class="btn-secondary">导入备份(合并)<input type="file" id="btn-import" accept=".json" hidden></label>
        </div>
        <div class="short-msg">当前备份约 ${(Store.backupSize()/1024/1024).toFixed(2)} MB；照片会包含在 JSON 中。</div>
      </div>
      <div class="form-actions" style="margin-top:14px;">
        <button type="button" class="btn-secondary" id="settings-cancel">取消</button>
        <button class="btn-primary" id="settings-confirm">确认保存</button>
      </div>`);
    document.getElementById('btn-export').onclick = exportBackup;
    document.getElementById('btn-import').onchange = importBackup;
    const avatarFile=document.getElementById('set-avatar-file'), avatarPick=document.getElementById('avatar-pick'); avatarPick.onclick=()=>avatarFile.click();
    avatarFile.onchange=()=>{const f=avatarFile.files[0];if(f)resizeImage(f,512,data=>{document.getElementById('set-avatar').value=data;avatarPick.style.backgroundImage=`url(${data})`;avatarPick.textContent='';});};
    document.getElementById('settings-cancel').onclick = closeModal;
    document.getElementById('settings-confirm').onclick = () => {
      Store.setSetting('nickname', document.getElementById('set-name').value);
      Store.setSetting('avatar', document.getElementById('set-avatar').value);
      Store.setSetting('moneySettings',{base:document.getElementById('money-base').value,rates:{'€':1,'$':parseFloat(document.getElementById('rate-usd').value)||0.92,'¥':parseFloat(document.getElementById('rate-cny').value)||0.13}});
      Topbar.renderProfile();
      closeModal();
      renderContent();
    };
  }
  function openQuickAdd() {
    openModal('小满 · 快捷新建', `<div class="quick-menu"><button data-quick="plans">📝 记待办</button><button data-quick="flows">💶 记一笔收支</button><button data-quick="daily">🏃 记运动打卡</button><button data-quick="skincare">🧴 记护理</button><button data-quick="stockLog">📈 写投资复盘</button></div>`);
    const targets={plans:['discipline','plans'],flows:['money','flows'],daily:['discipline','fitDaily'],skincare:['discipline','skincare'],stockLog:['invest','logs']};
    document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{const [m,t]=targets[b.dataset.quick],mod=MODULE_MAP[m],tab=mod.tabs.find(x=>x.id===t);closeModal();openForm(tab,null,{date:todayKey()});});
  }
  function getReminderSummary(){ const box=document.createElement('div'); box.innerHTML=buildReminders(); return box.textContent.replace(/\s+/g,' ').trim(); }
  async function exportBackup() {
    const blob = new Blob([Store.exportAll()], { type: 'application/json' });
    const file = new File([blob], 'xiaoman-backup-' + todayKey() + '.json', {type:'application/json'});
    if (navigator.canShare && navigator.canShare({files:[file]})) { try { await navigator.share({title:'小满则盈 JSON 备份',files:[file]}); return; } catch(e) { if(e.name==='AbortError') return; } }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function importBackup(e) {
    const f0 = e.target.files[0]; if (!f0) return;
    const r = new FileReader();
    r.onload = ev => {
      if (Store.mergeAll(ev.target.result)) { const s=Store.lastMergeStats||{}; alert(`合并完成：新增 ${s.added||0}，更新 ${s.updated||0}，保留本地新版 ${s.keptLocal||0}，冲突副本 ${s.conflicts||0}`); closeModal(); selectModule(state.module); }
      else alert('导入失败：文件格式不正确');
    };
    r.readAsText(f0);
  }

  /* ---------------- 抽屉（移动端） ---------------- */
  function openDrawer() { document.getElementById('sidebar').classList.add('open'); document.getElementById('backdrop').classList.add('show'); document.body.style.overflow = 'hidden'; document.body.classList.add('drawer-open'); }
  function closeDrawer() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('backdrop').classList.remove('show'); document.body.style.overflow = ''; document.body.classList.remove('drawer-open'); }

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

  /* ============================================================
   * 居家事项（设备养护 / 固定账单 / 日化库存 + 状态总览）
   * ============================================================ */
  const homeCleanTab = { id: 'homeCleanings', name: '设备养护', collection: 'homeCleanings', fields: [
    { key: 'name', label: '设备名称', type: 'text', required: true },
    { key: 'task', label: '养护项目', type: 'text', required: true },
    { key: 'location', label: '所在位置', type: 'selectOther', options: ['厨房','浴室','卧室','客厅','阳台','其他'], def: '厨房' },
    { key: 'cycle', label: '周期', type: 'select', options: ['每周','每月','每三个月','每半年','每年','自定义','按需'], def: '每月' },
    { key: 'cycleDays', label: '自定义周期（天）', type: 'number' },
    { key: 'lastDate', label: '上次完成日期', type: 'date' },
    { key: 'nextDate', label: '下次日期（可手动调整）', type: 'date' },
    { key: 'remindDays', label: '提前提醒（天）', type: 'number', def: 7 },
    { key: 'instructions', label: '操作说明', type: 'textarea' },
    { key: 'enabled', label: '启用提醒', type: 'checkbox', def: true },
  ] };
  const homeBillTab = { id: 'homeBills', name: '固定账单', collection: 'homeBills', fields: [
    { key: 'name', label: '账单名称', type: 'text', required: true },
    { key: 'amount', label: '金额', type: 'number' },
    { key: 'currency', label: '币种', type: 'select', options: ['€','$','¥'], def: '€' },
    { key: 'category', label: '流水分类', type: 'select', options: MONEY_CATEGORIES, def: '房租水电' },
    { key: 'cycle', label: '周期', type: 'select', options: ['每月','每季度','每半年','每年'], def: '每月' },
    { key: 'entryRule', label: '入账规则', type: 'select', options: ['固定日期','当月月末','下月月初'], def: '下月月初' },
    { key: 'nextDate', label: '下次入账日期', type: 'date', required: true },
    { key: 'remindDays', label: '提前提醒（天）', type: 'number', def: 3 },
    { key: 'account', label: '支付账户', type: 'text' },
    { key: 'enabled', label: '启用提醒', type: 'checkbox', def: true },
    { key: 'note', label: '备注', type: 'text' },
  ] };
  const homeStockTab = { id: 'homeStocks', name: '日化库存', collection: 'homeStocks', fields: [
    { key: 'name', label: '物品', type: 'text', required: true },
    { key: 'category', label: '分类', type: 'selectOther', options: ['厨房','清洁','洗护','卫生间','食品','其他'], def: '厨房' },
    { key: 'count', label: '数量', type: 'number' },
    { key: 'unit', label: '单位', type: 'text' },
    { key: 'minCount', label: '最低库存', type: 'number', def: 1 },
    { key: 'checkCycle', label: '检查周期', type: 'select', options: ['每周','每两周','每月','自定义'], def: '每月' },
    { key: 'checkDays', label: '自定义周期（天）', type: 'number' },
    { key: 'lastCheck', label: '上次检查日期', type: 'date' },
    { key: 'nextCheck', label: '下次检查日期', type: 'date' },
    { key: 'remindDays', label: '提前提醒（天）', type: 'number', def: 7 },
    { key: 'enabled', label: '启用提醒', type: 'checkbox', def: true },
    { key: 'note', label: '备注', type: 'text' },
  ] };
  function homeSection(title, icon, addId, list, colKey, editAttr, delAttr, renderRow) {
    const rows = list.length ? list.map(renderRow).join('') :
      `<div class="empty-hint">暂无，点击「添加」</div>`;
    return `<div class="home-thing-block">
      <div class="home-thing-head"><span>${icon} ${esc(title)}</span><button class="mini-add" id="${addId}">+ 添加</button></div>
      <div class="todo-list">${rows}</div></div>`;
  }
  function addHomeCycle(dateStr, cycle, customDays) {
    const d = new Date((dateStr || todayKey()) + 'T00:00:00');
    if (isNaN(d)) return '';
    const days = cycle === '每周' ? 7 : cycle === '每两周' ? 14 : cycle === '自定义' ? (parseInt(customDays) || 30) : 0;
    if (days) d.setDate(d.getDate() + days);
    else {
      const months=({ '每月':1, '每三个月':3, '每季度':3, '每半年':6, '每年':12 }[cycle] || 1),day=d.getDate(),wasMonthEnd=day===new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
      d.setDate(1); d.setMonth(d.getMonth()+months); d.setDate(wasMonthEnd?new Date(d.getFullYear(),d.getMonth()+1,0).getDate():Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));
    }
    return dateKey(d);
  }
  function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const d = new Date(dateStr + 'T00:00:00'), now = new Date(todayKey() + 'T00:00:00');
    return isNaN(d) ? Infinity : Math.round((d - now) / 86400000);
  }
  function maintenanceDue(r) { return r.nextDate || (r.lastDate && r.cycle !== '按需' ? addHomeCycle(r.lastDate, r.cycle || (r.cycleDays ? '自定义' : '每月'), r.cycleDays) : ''); }
  function stockDue(r) { return r.nextCheck || (r.lastCheck ? addHomeCycle(r.lastCheck, r.checkCycle || '每月', r.checkDays) : ''); }
  function dueLabel(dateStr) { const d=daysUntil(dateStr); return d===Infinity?'未设置日期':d<0?`已逾期 ${-d} 天`:d===0?'今天到期':d===1?'明天':`${d} 天后`; }
  function renderHomeThings(tab) {
    const clean = Store.getList({ collection: 'homeCleanings' });
    const bills = Store.getList({ collection: 'homeBills' });
    const stocks = Store.getList({ collection: 'homeStocks' });
    const maintenanceAlerts=clean.filter(r=>r.enabled!==false&&daysUntil(maintenanceDue(r))<=Math.max(7,parseInt(r.remindDays)||0));
    const stockAlerts=stocks.filter(r=>r.enabled!==false&&((Number(r.count)||0)<=(Number(r.minCount)||0)||daysUntil(stockDue(r))<=Math.max(7,parseInt(r.remindDays)||0)));
    const billAlerts=bills.filter(r=>r.enabled!==false&&daysUntil(r.nextDate||r.dueDate)<=Math.max(3,parseInt(r.remindDays)||0));
    const actions=[...maintenanceAlerts.map(r=>({kind:'养护',name:`${r.name} · ${r.task||'设备养护'}`,date:maintenanceDue(r)})),...stockAlerts.map(r=>({kind:'库存',name:r.name,date:stockDue(r)})),...billAlerts.map(r=>({kind:'账单',name:r.name,date:r.nextDate||r.dueDate}))].sort((a,b)=>daysUntil(a.date)-daysUntil(b.date));
    const next=actions[0];
    const fixedTotal=bills.reduce((s,r)=>s+(parseFloat(r.amount)||0),0);
    const stats = `<section class="home-dashboard-card"><div class="home-status-head"><div><small>居家状态</small><strong>${actions.length?`有 ${actions.length} 项需要留意`:'整体状态良好'}</strong></div><span>${actions.some(x=>daysUntil(x.date)<0)?'有逾期':'本周'}</span></div>${next?`<div class="home-next"><i>${next.kind==='养护'?'🔧':next.kind==='库存'?'🧴':'💳'}</i><div><small>下一项 · ${next.kind}</small><b>${esc(next.name)}</b><em>${dueLabel(next.date)}</em></div></div>`:'<div class="home-next empty"><i>🏠</i><div><b>暂时没有待处理事项</b><em>添加设备、用品或固定账单后自动提醒</em></div></div>'}<div class="home-overview-grid"><button data-home-jump="hc-add"><i>🔧</i><b>${maintenanceAlerts.length}</b><span>养护待处理</span><small>${clean.length} 项计划</small></button><button data-home-jump="hs-add"><i>🧴</i><b>${stockAlerts.length}</b><span>库存需关注</span><small>${stocks.length} 种用品</small></button><button data-home-jump="hb-add"><i>💳</i><b>${bills.length}</b><span>固定账单</span><small>${baseSymbol()}${fixedTotal.toFixed(0)} 预计</small></button></div></section>`;
    const cleanSec = homeSection('设备养护', '🔧', 'hc-add', clean, 'homeCleanings', 'edit-hc', 'del-hc', r => `
      <div class="todo-item"><div class="todo-main">
        <div class="todo-title">${esc(r.name)} · ${esc(r.task||'设备养护')}</div>
        <div class="todo-meta">${esc(r.cycle||(r.cycleDays?`每 ${r.cycleDays} 天`:'按需'))} · ${dueLabel(maintenanceDue(r))}${r.instructions?' · '+esc(r.instructions):''}</div>
      </div>
      <button class="mini" data-complete-hc="${r._id}">完成</button>
      <button class="shop-item-del" data-${'edit-hc'}="${r._id}">✎</button>
      <button class="shop-item-del" data-${'del-hc'}="${r._id}">×</button></div>`);
    const billSec = homeSection('固定账单', '💳', 'hb-add', bills, 'homeBills', 'edit-hb', 'del-hb', r => `
      <div class="todo-item"><div class="todo-main">
        <div class="todo-title">${esc(r.name)} ${r.amount ? esc(r.currency||'€') + parseFloat(r.amount).toFixed(2) : '金额待确认'}</div>
        <div class="todo-meta">${dueLabel(r.nextDate||r.dueDate)} · ${esc(r.cycle||'每月')}${r.note?' · '+esc(r.note):''}</div>
      </div>
      <button class="mini" data-book-hb="${r._id}">确认入账</button>
      <button class="shop-item-del" data-${'edit-hb'}="${r._id}">✎</button>
      <button class="shop-item-del" data-${'del-hb'}="${r._id}">×</button></div>`);
    const stockSec = homeSection('日化库存', '🧴', 'hs-add', stocks, 'homeStocks', 'edit-hs', 'del-hs', r => `
      <div class="todo-item"><div class="todo-main">
        <div class="todo-title">${esc(r.name)} ${r.count ? '×' + r.count + (r.unit ? r.unit : '') : ''}</div>
        <div class="todo-meta">最低库存 ${r.minCount??1}${esc(r.unit||'')} · ${dueLabel(stockDue(r))}${r.note?' · '+esc(r.note):''}</div>
      </div>
      <button class="mini" data-check-hs="${r._id}">已检查</button><button class="mini" data-shop-hs="${r._id}">补货</button>
      <button class="shop-item-del" data-${'edit-hs'}="${r._id}">✎</button>
      <button class="shop-item-del" data-${'del-hs'}="${r._id}">×</button></div>`);
    const templateBar=`<div class="home-template-bar"><span>已有养护清单可选，不会自动写入</span><button type="button" id="hc-templates">选择模板</button></div>`;
    return stats + templateBar + cleanSec + billSec + stockSec;
  }
  function bindHomeThings(tab) {
    const root = document.getElementById('tab-body'); if (!root) return;
    const map = [
      ['hc-add', 'edit-hc', 'del-hc', homeCleanTab, 'homeCleanings'],
      ['hb-add', 'edit-hb', 'del-hb', homeBillTab, 'homeBills'],
      ['hs-add', 'edit-hs', 'del-hs', homeStockTab, 'homeStocks'],
    ];
    map.forEach(([addId, editAttr, delAttr, t, col]) => {
      const add = document.getElementById(addId);
      if (add) add.onclick = () => openForm(t, null);
      root.querySelectorAll(`[data-${editAttr}]`).forEach(b => b.onclick = () => openForm(t, b.getAttribute('data-' + editAttr)));
      root.querySelectorAll(`[data-${delAttr}]`).forEach(b => b.onclick = () => { if (confirm('确定删除？')) { Store.deleteRecord({ collection: col }, b.getAttribute('data-' + delAttr)); renderContent(); } });
    });
    root.querySelectorAll('[data-home-jump]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.homeJump)?.scrollIntoView({behavior:'smooth',block:'center'}));
    root.querySelectorAll('[data-complete-hc]').forEach(b=>b.onclick=()=>{const r=Store.getList('homeCleanings').find(x=>x._id===b.dataset.completeHc);if(!r)return;const now=todayKey();Store.updateRecord('homeCleanings',r._id,{lastDate:now,nextDate:r.cycle==='按需'?'':addHomeCycle(now,r.cycle||(r.cycleDays?'自定义':'每月'),r.cycleDays)});renderContent();});
    root.querySelectorAll('[data-check-hs]').forEach(b=>b.onclick=()=>{const r=Store.getList('homeStocks').find(x=>x._id===b.dataset.checkHs);if(!r)return;const now=todayKey();Store.updateRecord('homeStocks',r._id,{lastCheck:now,nextCheck:addHomeCycle(now,r.checkCycle||'每月',r.checkDays)});renderContent();});
    root.querySelectorAll('[data-shop-hs]').forEach(b=>b.onclick=()=>{const r=Store.getList('homeStocks').find(x=>x._id===b.dataset.shopHs);if(!r)return;const exists=Store.getList('items').some(x=>x.sourceType==='homeStock'&&x.sourceId===r._id&&x.status==='未买');if(!exists)Store.addRecord('items',{name:r.name,cat:'家居',qty:Math.max(1,(Number(r.minCount)||1)-(Number(r.count)||0)+1),status:'未买',priority:'必买',sourceType:'homeStock',sourceId:r._id,note:'来自居家库存提醒'});renderContent();});
    root.querySelectorAll('[data-book-hb]').forEach(b=>b.onclick=()=>bookHomeBill(b.dataset.bookHb));
    const templates=document.getElementById('hc-templates'); if(templates)templates.onclick=()=>{
      const rows=[
        {name:'洗衣机',task:'滚筒清洁档加约 2g 洗衣粉空载清洁',cycle:'每月',location:'浴室',instructions:'使用 Trommel Reinigen 档位'},
        {name:'洗衣机',task:'清洁排水过滤器和排水管',cycle:'每半年',location:'浴室'},
        {name:'除湿机',task:'清理滤网',cycle:'每三个月',location:'浴室'},
        {name:'除湿机',task:'清理面板灰尘并倒掉水箱积水',cycle:'按需',location:'浴室'},
        {name:'洗碗机',task:'清洁上下喷淋臂和下水滤网',cycle:'每周',location:'厨房',instructions:'同时观察进水与洗碗机盐提示'},
        {name:'洗碗机',task:'Machine Care 档空载清洗',cycle:'每月',location:'厨房',instructions:'一般使用洗碗片；重油污或异味时使用专用清洁剂'},
        {name:'温湿度计',task:'更换 CR2032 纽扣电池',cycle:'按需',location:'浴室',instructions:'无显示、联动失效或米家提示时更换；慢慢取下背胶'},
      ];
      openModal('选择设备养护模板',`<div class="quick-menu">${rows.map((r,i)=>`<button type="button" data-maint-template="${i}"><b>${r.name}</b><small>${r.task}</small></button>`).join('')}</div>`);
      document.querySelectorAll('[data-maint-template]').forEach(b=>b.onclick=()=>{const preset=Object.assign({remindDays:7,enabled:true},rows[Number(b.dataset.maintTemplate)]);closeModal();openForm(homeCleanTab,null,preset);});
    };
  }

  function bookHomeBill(id) {
    const bill=Store.getList('homeBills').find(r=>r._id===id); if(!bill)return;
    const due=bill.nextDate||bill.dueDate||todayKey(),period=due.slice(0,7);
    if(Store.getList('flows').some(r=>r.sourceType==='homeBill'&&r.sourceId===id&&r.billingPeriod===period)){alert('这个账期已经入账');return;}
    const flowTab=MODULE_MAP.money.tabs.find(t=>t.id==='flows'),legacyCategory={'住房':'房租水电','水电能源':'房租水电','通信网络':'订阅','保险':'其他'};
    openForm(flowTab,null,{account:bill.account||'',currency:bill.currency||'€',direction:'支出',category:legacyCategory[bill.category]||bill.category||'房租水电',categoryDetail:legacyCategory[bill.category]?bill.category:'',budgetStatus:'自动匹配',amount:bill.amount||'',date:todayKey(),note:`${bill.name} · ${period}`},saved=>{
      if(saved)Store.updateRecord('flows',saved._id,{sourceType:'homeBill',sourceId:id,billingPeriod:period});
      Store.updateRecord('homeBills',id,{lastBookedPeriod:period,lastBookedAmount:saved?.amount||bill.amount||'',nextDate:addHomeCycle(due,bill.cycle||'每月')});
    });
  }

  /* ============================================================
   * 人物档案（原「尺寸档案」+ 礼物计划并入 + 心愿双向联动）
   * ============================================================ */
  function renderPeople(tab) {
    const people = Store.getList(tab);
    if (!people.length) return `<div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">还没有人物档案，点击 + 添加</div></div>`;
    return people.map(p => {
      const wishes = Store.getList({ collection: 'wishes' }).filter(w => w.personId === p._id);
      const wishHtml = wishes.length ? wishes.map(w => `<div class="wish-row">
        <span class="wish-name">${esc(w.name)}</span>
        ${w.price ? `<span class="wish-price">€${parseFloat(w.price).toFixed(0)}</span>` : ''}
        <span class="tag" style="background:${w.status === '已买' ? 'rgba(74,222,128,.18)' : 'rgba(255,154,174,.18)'};">${esc(w.status || '想要')}</span>
        <button class="mini" data-buy-wish="${w._id}" ${w.status === '已买' ? 'disabled' : ''}>${w.status === '已买' ? '已购' : '加入购物'}</button>
        <button class="mini" data-edit-wish="${w._id}">编辑</button>
        <button class="mini danger" data-del-wish="${w._id}">删</button>
      </div>`).join('') : '<div class="empty-hint">暂无心愿，点击下方添加</div>';
      return `<div class="app-card">
        <div class="app-card-head">
          <span class="app-card-title">${esc(p.name)} <span class="tag">${esc(p.relation || '')}</span></span>
          ${cardOpsMenu(p._id)}
        </div>
        <div class="app-card-body">
          <p>${[p.height && ('身高 ' + p.height), p.weight && ('体重 ' + p.weight), p.shoe && ('鞋码 ' + p.shoe), p.clothesSize && ('尺码 ' + p.clothesSize)].filter(Boolean).join(' · ') || '—'}</p>
          ${p.prefer ? `<p>偏好：${esc(p.prefer)}</p>` : ''}
          ${p.note ? `<p>${esc(p.note)}</p>` : ''}
          <div class="wish-head">🎁 心愿清单 <button class="mini-add" data-add-wish="${p._id}">+ 添加</button></div>
          ${wishHtml}
        </div>
      </div>`;
    }).join('');
  }
  function bindPeople(tab) {
    const root = document.getElementById('tab-body'); if (!root) return;
    root.querySelectorAll('[data-add-wish]').forEach(b => b.onclick = () => {
      const pid = b.dataset.addWish;
      const t = { id: 'wishes', name: '心愿', collection: 'wishes', fields: [
        { key: 'name', label: '心愿名称', type: 'text', required: true },
        { key: 'price', label: '预估价格', type: 'number' },
        { key: 'status', label: '状态', type: 'select', options: ['想要', '已买'], def: '想要' },
        { key: 'link', label: '参考链接', type: 'text' },
      ] };
      openForm(t, null, { personId: pid });
    });
    root.querySelectorAll('[data-edit-wish]').forEach(b => b.onclick = () => {
      const w = Store.getList({ collection: 'wishes' }).find(x => x._id === b.dataset.editWish);
      const t = { id: 'wishes', name: '心愿', collection: 'wishes', fields: [
        { key: 'name', label: '心愿名称', type: 'text', required: true },
        { key: 'price', label: '预估价格', type: 'number' },
        { key: 'status', label: '状态', type: 'select', options: ['想要', '已买'], def: '想要' },
        { key: 'link', label: '参考链接', type: 'text' },
      ] };
      openForm(t, b.dataset.editWish);
    });
    root.querySelectorAll('[data-del-wish]').forEach(b => b.onclick = () => { if (confirm('确定删除心愿？')) { Store.deleteRecord({ collection: 'wishes' }, b.dataset.delWish); renderContent(); } });
    root.querySelectorAll('[data-buy-wish]').forEach(b => b.onclick = () => {
      const w = Store.getList({ collection: 'wishes' }).find(x => x._id === b.dataset.buyWish);
      const p = Store.getList(tab).find(x => x._id === w.personId);
      if (!w) return;
      Store.addRecord({ collection: 'items' }, {
        name: w.name, cat: '其他', price: w.price || '', status: '未买',
        note: '礼物' + (p ? '：' + p.name : '') + (w.link ? ' ' + w.link : ''),
        linkWish: w._id, linkPerson: w.personId,
      });
      w.status = '已买'; Store.updateRecord({ collection: 'wishes' }, w._id, w);
      renderContent();
    });
  }

  /* ============================================================
   * 柚子（原「我们❤️」女性健康模块）
   * ============================================================ */
  let youziView = 'period';
  const periodTab = { id: 'periodLogs', name: '经期记录', collection: 'periodLogs', fields: [
    { key: 'date', label: '日期', type: 'date', required: true },
    { key: 'flow', label: '流量', type: 'select', options: ['多', '中', '少', '点滴'], def: '中' },
    { key: 'color', label: '颜色', type: 'select', options: ['鲜红', '暗红', '粉', '棕', '黑'], def: '鲜红' },
    { key: 'symptoms', label: '症状', type: 'multicheck', options: ['痛经', '头痛', '胸胀', '腰酸', '疲劳', '怕冷', '其他'] },
    { key: 'mood', label: '心情', type: 'select', options: ['平静', '愉悦', '烦躁', '低落', '其他'], def: '平静' },
    { key: 'note', label: '备注', type: 'textarea' },
  ] };
  const pregnancyTab = { id: 'pregnancy', name: '备孕计划', collection: 'pregnancy', fields: [
    { key: 'date', label: '日期', type: 'date', required: true },
    { key: 'note', label: '备注', type: 'text' },
  ] };
  function periodPhase(dateStr, set) {
    if (!set || !set.cycleStart) return '未设置';
    const start = new Date(set.cycleStart + 'T00:00:00');
    const len = parseInt(set.cycleLen) || 28;
    const today = new Date(dateStr + 'T00:00:00');
    const diff = Math.floor((today - start) / 86400000);
    if (diff < 0) return '安全期';
    const inCycle = ((diff % len) + len) % len;
    if (inCycle < 5) return '经期';
    if (inCycle >= len - 16 && inCycle <= len - 12) return '排卵期';
    if (inCycle >= len - 19 && inCycle <= len - 10) return '易孕期';
    return '安全期';
  }
  function renderYouzi(tab) {
    const set = Store.getSetting('periodSettings', { cycleStart: '', cycleLen: 28, remind: false });
    const views = [['period', '经期记录'], ['pregnancy', '备孕计划'], ['calendar', '周期日历'], ['settings', '设置']];
    const tabs = `<div class="tab-bar" style="margin-bottom:14px;">` + views.map(v =>
      `<button class="tab-btn ${youziView === v[0] ? 'active' : ''} group-work" data-youzi-view="${v[0]}">${v[1]}</button>`).join('') + `</div>`;
    let body = '';
    if (youziView === 'period') {
      const logs = Store.getList({ collection: 'periodLogs' }).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      body = !logs.length ? `<div class="empty-state"><div class="empty-state-icon">🌸</div><div class="empty-state-text">还没有经期记录，点击 + 添加</div></div>` :
        logs.map(r => `<div class="app-card">
          <div class="app-card-head"><span class="app-card-title">${esc(r.date || '')} · ${esc(r.flow || '')} · ${esc(r.color || '')}</span>${cardOpsMenu(r._id)}</div>
          <div class="app-card-body">
            ${r.symptoms && r.symptoms.length ? `<p>症状：${r.symptoms.join('、')}</p>` : ''}
            ${r.mood ? `<p>心情：${esc(r.mood)}</p>` : ''}
            ${r.note ? `<p>${esc(r.note)}</p>` : ''}
          </div></div>`).join('');
      body = `<button class="mini-add" id="yz-period-add" style="margin-bottom:12px;">+ 添加经期记录</button>` + body;
    } else if (youziView === 'pregnancy') {
      const logs = Store.getList({ collection: 'pregnancy' }).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const phase = periodPhase(todayKey(), set);
      const chance = phase === '排卵期' ? '受孕几率：高' : phase === '易孕期' ? '受孕几率：中' : phase === '经期' ? '经期，几率低' : '安全期，几率低';
      body = `<div class="predict" style="margin-bottom:12px;">当前阶段：<b>${esc(phase)}</b> · ${chance}</div>`;
      body += !logs.length ? `<div class="empty-state"><div class="empty-state-icon">💞</div><div class="empty-state-text">还没有备孕记录，点击 + 添加</div></div>` :
        logs.map(r => `<div class="app-card">
          <div class="app-card-head"><span class="app-card-title">${esc(r.date || '')}</span>
            <span class="app-card-ops"><button data-edit-preg="${r._id}">编辑</button><button class="danger" data-del-preg="${r._id}">删</button></span></div>
          <div class="app-card-body">${r.note ? `<p>${esc(r.note)}</p>` : ''}</div></div>`).join('');
      body = `<button class="mini-add" id="yz-preg-add" style="margin-bottom:12px;">+ 添加备孕记录</button>` + body;
    } else if (youziView === 'calendar') {
      const now = new Date();
      const y = now.getFullYear(), m = now.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      let cells = '';
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const ph = periodPhase(ds, set);
        const colors = { '经期': '#FF9AB2', '排卵期': '#FFD56B', '易孕期': '#7FD18A', '安全期': '#E2E8F0', '未设置': '#E2E8F0' };
        cells += `<div class="yz-cell" style="background:${colors[ph] || '#E2E8F0'}" title="${ds}：${ph}"><span>${d}</span></div>`;
      }
      body = `<div class="yz-cal">${cells}</div>
        <div class="travel-legend" style="margin-top:10px;">
          <span><i style="background:#FF9AB2"></i>经期</span>
          <span><i style="background:#FFD56B"></i>排卵期</span>
          <span><i style="background:#7FD18A"></i>易孕期</span>
          <span><i style="background:#E2E8F0"></i>安全期</span>
        </div>
        ${!set.cycleStart ? '<div class="empty-hint">先在「设置」里填写上次经期开始日与周期长度</div>' : ''}`;
    } else if (youziView === 'settings') {
      body = `<div class="settings-box">
        <div class="form-row"><label>上次经期开始日</label><input type="date" id="yz-cycleStart" value="${esc(set.cycleStart || '')}"></div>
        <div class="form-row"><label>周期长度(天)</label><input type="number" id="yz-cycleLen" value="${set.cycleLen || 28}"></div>
        <div class="form-row"><label>提前提醒</label><input type="checkbox" id="yz-remind" ${set.remind ? 'checked' : ''}></div>
        <div class="form-actions"><button type="button" class="btn-primary" id="yz-set-save">保存设置</button></div>
      </div>`;
    }
    return tabs + body;
  }
  function bindYouzi(tab) {
    const root = document.getElementById('tab-body'); if (!root) return;
    root.querySelectorAll('[data-youzi-view]').forEach(b => b.onclick = () => { youziView = b.dataset.youziView; renderContent(); });
    const pa = document.getElementById('yz-period-add'); if (pa) pa.onclick = () => openForm(periodTab, null);
    const pra = document.getElementById('yz-preg-add'); if (pra) pra.onclick = () => openForm(pregnancyTab, null);
    root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
      const col = b.closest('[data-youzi-view]') ? null : null;
      openForm(periodTab, b.dataset.edit);
    });
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      if (confirm('确定删除？')) { Store.deleteRecord({ collection: 'periodLogs' }, b.dataset.del); renderContent(); }
    });
    // 备孕记录的编辑 / 删除（专属属性，避免与经期记录共用 data-edit/data-del）
    root.querySelectorAll('[data-edit-preg]').forEach(b => b.onclick = () => openForm(pregnancyTab, b.dataset.editPreg));
    root.querySelectorAll('[data-del-preg]').forEach(b => b.onclick = () => {
      if (confirm('确定删除？')) { Store.deleteRecord({ collection: 'pregnancy' }, b.dataset.delPreg); renderContent(); }
    });
    const save = document.getElementById('yz-set-save');
    if (save) save.onclick = () => {
      Store.setSetting('periodSettings', {
        cycleStart: document.getElementById('yz-cycleStart').value,
        cycleLen: parseInt(document.getElementById('yz-cycleLen').value) || 28,
        remind: document.getElementById('yz-remind').checked,
      });
      renderContent();
    };
  }

  function init() {
    Store.migrateOnce('plansV1', d => {
      const out=d.collections.plans||[], uid=()=>crypto.randomUUID?crypto.randomUUID():'p'+Date.now()+Math.random(); const now=new Date().toISOString();
      (d.collections.lifeTodos||[]).filter(r=>!r.deletedAt).forEach(r=>out.push({_id:uid(),title:r.item||'未命名待办',date:r.due||'',time:r.timeRange||'',priority:r.priority||'中',domain:r.domain||'生活',repeat:'不重复',status:r.status==='完成'?'完成':'计划',note:r.note||'',createdAt:r.createdAt||r._created||now,updatedAt:r.updatedAt||now,deletedAt:null,schemaVersion:2,migratedFrom:r._id}));
      (d.collections.calendarPlans||[]).filter(r=>!r.deletedAt).forEach(r=>out.push({_id:uid(),title:r.title||'未命名日程',date:r.date||'',time:r.time||'',priority:r.priority||'中',domain:r.domain||'生活',repeat:r.repeat||'不重复',status:r.status==='完成'?'完成':(r.status||'计划'),note:r.note||'',createdAt:r.createdAt||r._created||now,updatedAt:r.updatedAt||now,deletedAt:null,schemaVersion:2,migratedFrom:r._id}));
      (d.collections.plan||[]).filter(r=>!r.deletedAt).forEach(r=>out.push({_id:uid(),title:r.plan||'未命名计划',date:r.date||'',time:'',priority:'中',domain:'生活',repeat:'不重复',status:'计划',note:r.durationGoal?`时长目标 ${r.durationGoal} 分钟`:'',createdAt:r.createdAt||r._created||now,updatedAt:r.updatedAt||now,deletedAt:null,schemaVersion:2,migratedFrom:r._id})); d.collections.plans=out;
    });
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

  return { init, selectModule, selectTab, openForm, openSettings, openQuickAdd, getReminderSummary };
})();
