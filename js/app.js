/* ============================================================
 * 主应用：导航 / 路由 / 通用列表-表单 / 首页 / 特例视图 / 设置备份
 * ============================================================ */

const App = (function () {
  const state = { module: 'home', tab: null };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
    document.getElementById('content-title').textContent = mod.name;
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
    if (tab.type === 'list') {
      renderList(tab);
      const add = document.getElementById('add-btn');
      if (add) add.onclick = () => openForm(tab, null);
    }
  }

  /* ---------------- 顶部 Tab 栏 ---------------- */
  function renderTabs(mod) {
    const tabs = mod.tabs.map(t =>
      `<button class="tab-btn ${t.id === state.tab ? 'active' : ''} group-${mod.group}" data-tab="${t.id}">${esc(t.name)}</button>`
    ).join('');
    const tab = mod.tabs.find(t => t.id === state.tab) || mod.tabs[0];
    return `<div class="tab-bar">${tabs}</div><div id="tab-body">${renderTabBody(tab)}</div>`;
  }
  function bindTabs(root, mod) {
    root.querySelectorAll('.tab-btn').forEach(b =>
      b.onclick = () => { selectTab(b.dataset.tab); renderContent(); });
  }

  /* ---------------- 单个 Tab 内容 ---------------- */
  function renderTabBody(tab) {
    if (tab.type === 'settings') return renderSettings(tab);
    if (tab.type === 'budget') return renderBudget(tab);
    // list 型
    let html = `<div class="list-tools"><button class="btn-primary" id="add-btn">+ 新增</button></div>`;
    if (tab.special === 'weight') html += renderWeightChart();
    if (tab.special === 'gallery') html += renderGallery(tab);
    html += `<div class="card-grid" id="list-grid"></div>`;
    return html;
  }

  /* ---------------- 通用列表 ---------------- */
  function renderList(tab) {
    const grid = document.getElementById('list-grid');
    const mod = MODULE_MAP[state.module];
    const grp = mod ? mod.group : 'work';
    if (!grid) return;
    const list = Store.getList(tab.id);
    if (!list.length) {
      grid.innerHTML = `<div class="empty">还没有记录，点上方“+ 新增”开始吧～</div>`;
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
      b.onclick = () => { if (confirm('确定删除这条记录？')) { Store.deleteRecord(tab.id, b.dataset.del); Topbar.renderEvents(); renderContent(); } });
  }

  /* ---------------- 表单弹窗 ---------------- */
  function fieldInput(f, val) {
    const v = val == null ? (f.def != null ? f.def : '') : val;
    if (f.type === 'textarea') return `<textarea id="f_${f.key}">${esc(v)}</textarea>`;
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

  function openForm(tab, editId) {
    const rec = editId ? Store.getList(tab.id).find(r => r._id === editId) : null;
    const title = rec ? '编辑' : '新增';
    const body = tab.fields.map(f =>
      `<div class="form-row"><label>${esc(f.label)}${f.required ? '<i>*</i>' : ''}</label>${fieldInput(f, rec ? rec[f.key] : undefined)}</div>`
    ).join('');
    openModal(`${esc(tab.name)} · ${title}`, `<form id="rec-form">${body}</form>`);
    // 图片上传压缩
    tab.fields.filter(f => f.type === 'image').forEach(f => {
      const file = document.getElementById(`f_${f.key}_file`);
      file.onchange = () => {
        const f0 = file.files[0];
        if (!f0) return;
        resizeImage(f0, 900, data => {
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
      if (editId) Store.updateRecord(tab.id, editId, obj);
      else Store.addRecord(tab.id, obj);
      closeModal();
      Topbar.renderEvents();
      renderContent();
    };
  }

  /* ---------------- 预算 Tab ---------------- */
  function renderBudget(tab) {
    const mod = MODULE_MAP[state.module];
    const grp = mod ? mod.group : 'work';
    const items = Store.getList('items');
    const spent = items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 1), 0);
    const target = Store.getSetting('budgetTarget', 0);
    const left = target - spent;
    const pct = target > 0 ? Math.min(100, (spent / target) * 100) : 0;
    const barGrad = grp === 'life'
      ? 'linear-gradient(90deg, var(--life), #FFAFB8)'
      : 'linear-gradient(90deg, var(--work), #8FD3FF)';
    return `<div class="budget-card group-${grp}">
      <div class="budget-row"><span>总预算(${tab.currency})</span>
        <input type="number" id="bud-target" value="${target}"></div>
      <div class="budget-row"><span>已花(估算)</span><b>${tab.currency}${spent.toFixed(2)}</b></div>
      <div class="budget-row"><span>剩余</span><b class="${left < 0 ? 'down' : 'up'}">${tab.currency}${left.toFixed(2)}</b></div>
      <div class="progress"><div class="progress-bar" style="width:${pct}%; background: ${barGrad}"></div></div>
    </div>`;
  }

  /* ---------------- 体重折线图 ---------------- */
  function renderWeightChart() {
    const list = Store.getList('weight').slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
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
    const list = Store.getList(tab.id).filter(r => r.photo);
    if (!list.length) return '';
    return `<div class="gallery"><h4>运动对比照</h4><div class="gallery-grid">` +
      list.map(r => `<figure><img src="${esc(r.photo)}"><figcaption>${esc(r.date)} · ${esc(r.item)}</figcaption></figure>`).join('') +
      `</div></div>`;
  }

  /* ---------------- 生理期设置 ---------------- */
  function renderSettings(tab) {
    const rec = Store.getSetting('period', {});
    const body = tab.fields.map(f => `<div class="form-row"><label>${esc(f.label)}</label>${fieldInput(f, rec[f.key])}</div>`).join('');
    const predict = rec.cycleStart && rec.cycleLen
      ? (() => { const d = new Date(rec.cycleStart); d.setDate(d.getDate() + parseInt(rec.cycleLen)); return `<div class="predict">预计下次：<b>${d.toISOString().slice(0, 10)}</b></div>`; })()
      : '';
    return `<div class="settings-box">${body}${predict}<button class="btn-primary" id="save-settings">保存设置</button></div>`;
  }

  /* ---------------- 首页 mini 可视化 ---------------- */
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
    const todayKey = new Date().toISOString().slice(0, 10);
    if (m.id === 'shopping') {
      const items = Store.getList('items');
      const total = items.length;
      const bought = items.filter(r => r.done === '已买').length;
      const spent = items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 1), 0);
      const target = Store.getSetting('budgetTarget', 0);
      const pct = target > 0 ? (spent / target) * 100 : 0;
      if (!total) return { body: miniProgress(0, ''), foot: '还没有购物记录，点我添加' };
      return { body: miniProgress(pct, `预算 ${fmtNum(target)} · 已花 ${spent.toFixed(0)}`), foot: `${bought}/${total} 已买 · ${total - bought} 待买` };
    }
    if (m.id === 'study') {
      const courses = Store.getList('courses');
      if (!courses.length) return { body: miniProgress(0, ''), foot: '还没有课程，点我添加' };
      const active = courses.filter(r => r.status === '进行').length;
      const done = courses.filter(r => r.status === '完成').length;
      const avg = courses.reduce((s, r) => s + (parseFloat(r.progress) || 0), 0) / courses.length;
      const urgent = courses.filter(r => r.due && r.due >= todayKey).sort((a, b) => (a.due || '').localeCompare(b.due || ''))[0];
      let foot = `${active} 进行中 · ${done} 已完成`;
      if (urgent) foot += ` · 最近截止 ${urgent.due.slice(5)}`;
      return { body: miniProgress(avg, `平均进度 ${avg.toFixed(0)}%`), foot };
    }
    if (m.id === 'money') {
      const flows = Store.getList('flows');
      if (!flows.length) return { body: miniBars([], 1), foot: '还没有收支，点我记账' };
      const ym = todayKey.slice(0, 7);
      const month = flows.filter(r => (r.date || '').startsWith(ym));
      const inc = month.filter(r => r.direction === '收入').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      const exp = month.filter(r => r.direction === '支出').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      const max = Math.max(inc, exp, 1);
      return { body: miniBars([{ label: '收入', value: inc }, { label: '支出', value: exp }], max), foot: `本月结余 ${(inc - exp).toFixed(0)}` };
    }
    if (m.id === 'travel') {
      const dest = Store.getList('destinations');
      const plans = Store.getList('plans');
      if (!dest.length && !plans.length) return { body: miniBars([], 1), foot: '还没有旅行计划' };
      const max = Math.max(dest.filter(r => r.want === '想去').length, plans.length, 1);
      return { body: miniBars([{ label: '想去', value: dest.filter(r => r.want === '想去').length }, { label: '计划', value: plans.length }, { label: '完成', value: plans.filter(r => r.status === '完成').length }], max), foot: `${dest.length} 目的地 · ${plans.length} 计划` };
    }
    if (m.id === 'rigong') {
      const books = Store.getList('books');
      const logs = Store.getList('studylog');
      if (!books.length && !logs.length) return { body: miniHeatmap([]), foot: '还没有记录，点我开始日拱一卒' };
      const heat = logs.map(r => ({ date: r.date, value: parseFloat(r.duration) || 30 }));
      return { body: miniHeatmap(heat), foot: `${books.filter(r => r.status === '在读').length} 本在读 · ${logs.length} 次学习` };
    }
    if (m.id === 'files') {
      const files = Store.getList('files');
      if (!files.length) return { body: miniBars([], 1), foot: '还没有文件' };
      const cats = ['证件', '财务', '学习', '工作', '图片'];
      const counts = cats.map(c => ({ label: c, value: files.filter(r => r.category === c).length }));
      const max = Math.max(...counts.map(c => c.value), 1);
      return { body: miniBars(counts, max), foot: `共 ${files.length} 个文件` };
    }
    if (m.id === 'jikui') {
      const todos = Store.getList('todos');
      const total = todos.length;
      const done = todos.filter(r => r.status === '完成').length;
      if (!total) return { body: miniProgress(0, ''), foot: '还没有公司待办' };
      return { body: miniProgress((done / total) * 100, `${done}/${total} 完成`), foot: '积跬步以至千里' };
    }
    if (m.id === 'image') {
      const wl = Store.getList('weight').slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const sk = Store.getList('skincare').slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const latest = wl.length ? wl[wl.length - 1].weight : null;
      const recent = sk.slice(0, 7).reverse();
      const onCount = recent.filter(r => r.morningC || r.nightA).length;
      let body = '';
      if (wl.length >= 2) body = miniLine(wl.map(r => parseFloat(r.weight)).filter(v => !isNaN(v)));
      else body = miniDots(7, onCount);
      const foot = latest ? `最新 ${latest}kg · 近7天护肤 ${onCount} 次` : `近7天护肤 ${onCount} 次`;
      return { body, foot };
    }
    if (m.id === 'fitness') {
      const daily = Store.getList('daily').slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      if (!daily.length) return { body: miniLine([]), foot: '还没有运动记录' };
      const vals = daily.map(r => parseFloat(r.duration) || 0).filter(v => !isNaN(v));
      return { body: miniLine(vals), foot: `累计 ${(vals.reduce((a, b) => a + b, 0) / 60).toFixed(1)} 小时` };
    }
    if (m.id === 'fun') {
      const items = Store.getList('items');
      if (!items.length) return { body: miniBars([], 1), foot: '还没有娱乐记录' };
      const statuses = ['想看', '在看', '看完'];
      const counts = statuses.map(s => ({ label: s, value: items.filter(r => r.status === s).length }));
      const max = Math.max(...counts.map(c => c.value), 1);
      return { body: miniBars(counts, max), foot: `共 ${items.length} 条` };
    }
    if (m.id === 'tools') {
      const events = Store.getList('events').slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      if (!events.length) return { body: emptyHint('添加纪念日/生日'), foot: '还没有重要日子' };
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let next = null;
      for (const e of events) {
        const d = new Date(e.date);
        if (isNaN(d)) continue;
        const y = today.getFullYear();
        d.setFullYear(y);
        if (d < today) d.setFullYear(y + 1);
        if (!next || d < next.date) next = { name: e.name, date: d, orig: e.date };
      }
      if (!next) return { body: emptyHint(''), foot: '' };
      const days = Math.ceil((next.date - today) / 86400000);
      return { body: `<div style="text-align:center;font-size:24px;font-weight:700;">${days}<span style="font-size:12px;font-weight:400;color:var(--muted);"> 天后</span></div>`, foot: `${next.name} · ${next.orig}` };
    }
    return { body: emptyHint('点击进入模块'), foot: m.desc || '' };
  }

  function renderHome() {
    const cards = MODULES.filter(m => m.id !== 'home').map(m => {
      const w = homeWidget(m);
      return `<div class="home-card group-${m.group}" data-goto="${m.id}">
        <div class="home-card-head"><span class="hc-icon">${m.icon}</span>${esc(m.name)}</div>
        <div class="home-card-body">${w.body}</div>
        ${w.foot ? `<div class="home-card-foot">${esc(w.foot)}</div>` : ''}
      </div>`;
    }).join('');
    return `<div class="home-grid">${cards}</div><div class="home-tip">点任意卡片进入对应模块 · 数据仅存本地，记得定期导出备份</div>`;
  }
  function bindHome(root) {
    root.querySelectorAll('[data-goto]').forEach(c =>
      c.onclick = () => selectModule(c.dataset.goto));
  }

  /* ---------------- 弹窗 ---------------- */
  function openModal(title, html) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal').classList.add('show');
    const form = document.getElementById('rec-form');
    if (form) { const b = document.createElement('button'); b.type = 'submit'; b.className = 'btn-primary'; b.textContent = '保存'; b.style.marginTop = '10px'; form.appendChild(b); }
    const sb = document.getElementById('save-settings');
    if (sb) sb.onclick = saveSettings;
    const at = document.getElementById('bud-target');
    if (at) at.onchange = () => { Store.setSetting('budgetTarget', parseFloat(at.value) || 0); renderContent(); };
  }
  function closeModal() { document.getElementById('modal').classList.remove('show'); }
  function saveSettings() {
    const tab = MODULE_MAP['tools'].tabs.find(t => t.id === 'period');
    const obj = {};
    tab.fields.forEach(f => {
      if (f.type === 'checkbox') obj[f.key] = document.getElementById(`f_${f.key}`).checked;
      else if (f.type === 'number') obj[f.key] = document.getElementById(`f_${f.key}`).value === '' ? '' : parseFloat(document.getElementById(`f_${f.key}`).value);
      else obj[f.key] = document.getElementById(`f_${f.key}`).value;
    });
    Store.setSetting('period', obj);
    closeModal();
    Topbar.renderEvents();
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

  /* ---------------- 设置 / 备份 ---------------- */
  function openSettings() {
    const name = Store.getSetting('nickname', '我');
    const avatar = Store.getSetting('avatar', '');
    openModal('设置与备份', `<div class="form-row"><label>昵称</label><input type="text" id="set-name" value="${esc(name)}"></div>
      <div class="form-row"><label>头像链接</label><input type="text" id="set-avatar" value="${esc(avatar)}"></div>
      <div class="backup-ops">
        <button class="btn-primary" id="btn-export">导出备份(JSON)</button>
        <label class="btn-secondary">导入备份<input type="file" id="btn-import" accept=".json" hidden></label>
      </div>`);
    document.getElementById('set-name').onchange = e => { Store.setSetting('nickname', e.target.value); Topbar.renderProfile(); };
    document.getElementById('set-avatar').onchange = e => { Store.setSetting('avatar', e.target.value); Topbar.renderProfile(); };
    document.getElementById('btn-export').onclick = () => {
      const blob = new Blob([Store.exportAll()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'workbench-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
    };
    document.getElementById('btn-import').onchange = e => {
      const f0 = e.target.files[0]; if (!f0) return;
      const r = new FileReader();
      r.onload = ev => {
        if (Store.importAll(ev.target.result)) { alert('导入成功！'); Topbar.renderEvents(); closeModal(); selectModule(state.module); }
        else alert('导入失败：文件格式不正确');
      };
      r.readAsText(f0);
    };
  }

  /* ---------------- 抽屉（移动端） ---------------- */
  function openDrawer() { document.getElementById('sidebar').classList.add('open'); document.getElementById('backdrop').classList.add('show'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('backdrop').classList.remove('show'); document.body.style.overflow = ''; }

  /* 动态测量顶部状态栏真实高度，避免「首页」被状态栏遮挡（硬编码数字在不同设备会失效） */
  function syncTopbarH() {
    const tb = document.getElementById('topbar');
    if (tb) document.documentElement.style.setProperty('--topbar-h', Math.ceil(tb.getBoundingClientRect().height) + 'px');
  }

  /* ---------------- 绑定 ---------------- */
  function bindStatic() {
    document.getElementById('menu-toggle').onclick = openDrawer;
    document.getElementById('drawer-close').onclick = closeDrawer;
    document.getElementById('backdrop').onclick = closeDrawer;
    document.getElementById('modal-close').onclick = closeModal;
    document.getElementById('modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
    document.getElementById('tb-gear').onclick = openSettings;
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
