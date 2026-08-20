/* ============================================================
 * 小满吉祥物（V3.1）：全局导航入口
 * - 待机：趴在屏幕边缘呼吸/眨眼/头发轻晃
 * - 单击：探头弹出快捷菜单（快速新建/一句话/全部模块/设置）
 * - 长按拖拽：可自由移动，位置记忆在 localStorage
 * - 「全部模块」二级面板带实时搜索，点击跳转
 * - 同一时间只有一个浮层（菜单 / 气泡 / 面板）
 * ============================================================ */
const Xiaoman = (function () {
  const LS_POS = 'wb_mascot_pos';

  let wrap, doll, bubble, menu, panel, grid, search;
  let bubbleTimer = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function randomLine() {
    const L = (typeof XIAOMAN_LINES !== 'undefined') ? XIAOMAN_LINES : [];
    return L.length ? L[Math.floor(Math.random() * L.length)] : '小满未满，刚刚好';
  }

  /* ---------------- 状态控制 ---------------- */
  function open() {
    hideBubble();
    hidePanel();
    wrap.classList.remove('xm-idle');
    wrap.classList.add('xm-open');
  }
  function close() {
    wrap.classList.add('xm-idle');
    wrap.classList.remove('xm-open', 'xm-panel-mode');
    hideBubble();
    hidePanel();
  }
  function toggle() {
    if (wrap.classList.contains('xm-open')) close();
    else open();
  }

  /* ---------------- 台词气泡 ---------------- */
  function say(text) {
    hideBubble();
    bubble.textContent = text;
    bubble.classList.remove('show');
    void bubble.offsetWidth;
    bubble.hidden = false;
    bubble.classList.add('show');
    doll.classList.add('xm-talk', 'xm-happy');
    setTimeout(() => doll.classList.remove('xm-happy'), 650);
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hideBubble, 2800);
  }
  function hideBubble() {
    clearTimeout(bubbleTimer);
    bubbleTimer = null;
    bubble.hidden = true;
    bubble.classList.remove('show');
    doll.classList.remove('xm-talk');
  }

  /* ---------------- 全部模块面板（带搜索） ---------------- */
  function showPanel() {
    hideBubble();
    wrap.classList.add('xm-open', 'xm-panel-mode');
    renderModules('');
    panel.hidden = false;
    panel.classList.remove('show');
    void panel.offsetWidth;
    panel.classList.add('show');
    search.value = '';
    setTimeout(() => search.focus(), 80);
  }
  function hidePanel() {
    panel.hidden = true;
    panel.classList.remove('show');
    wrap.classList.remove('xm-panel-mode');
  }
  function renderModules(q) {
    const kw = (q || '').trim();
    const list = (typeof MODULES !== 'undefined' ? MODULES : []).filter(m =>
      !kw || m.name.includes(kw) || (m.desc || '').includes(kw));
    grid.innerHTML = list.length ? list.map(m => `
      <button class="xm-mod" data-mod="${esc(m.id)}">
        <span class="xm-mod-icon">${m.icon}</span>
        <span class="xm-mod-name">${esc(m.name)}</span>
      </button>`).join('')
      : '<div class="xm-mod-empty">没找到「' + esc(kw) + '」呀</div>';
    grid.querySelectorAll('.xm-mod').forEach(b => {
      b.onclick = () => {
        const name = b.querySelector('.xm-mod-name').textContent;
        App.selectModule(b.dataset.mod);
        close();
        say('走，去「' + name + '」看看');
      };
    });
  }

  /* ---------------- 菜单动作 ---------------- */
  function runAction(act) {
    switch (act) {
      case 'add': {
        const mod = (typeof MODULE_MAP !== 'undefined') ? MODULE_MAP['discipline'] : null;
        const tab = mod ? mod.tabs.find(t => t.id === 'lifeTodos') : null;
        close();
        if (tab) App.openForm(tab, null, { domain: '生活', status: '待办', priority: '中' });
        break;
      }
      case 'say':
        close();
        say(randomLine());
        break;
      case 'modules':
        showPanel();
        break;
      case 'settings':
        close();
        App.openSettings();
        break;
    }
  }

  /* ---------------- 长按拖拽 ---------------- */
  function initDrag() {
    let downX = 0, downY = 0, dragging = false, moved = false, pressed = false, timer = null;

    doll.addEventListener('pointerdown', e => {
      e.preventDefault();
      pressed = true; moved = false; dragging = false;
      downX = e.clientX; downY = e.clientY;
      clearTimeout(timer);
      timer = setTimeout(() => { dragging = true; }, 260);
    });
    window.addEventListener('pointermove', e => {
      if (!pressed) return;
      const dx = e.clientX - downX, dy = e.clientY - downY;
      if (!dragging && Math.hypot(dx, dy) > 7) { clearTimeout(timer); timer = null; dragging = true; }
      if (dragging) { moved = true; positionAt(e.clientX, e.clientY); }
    });
    window.addEventListener('pointerup', e => {
      if (!pressed) return;
      pressed = false;
      clearTimeout(timer); timer = null;
      if (dragging) { dragging = false; savePos(e.clientX, e.clientY); return; }
      if (!moved) toggle();
    });
    doll.addEventListener('contextmenu', e => e.preventDefault());
  }

  function positionAt(clientX, clientY) {
    const w = wrap.offsetWidth, h = wrap.offsetHeight;
    let x = clientX - w / 2, y = clientY - h * 0.55;
    x = Math.max(4, Math.min(window.innerWidth - w - 4, x));
    y = Math.max(4, Math.min(window.innerHeight - h - 4, y));
    wrap.style.left = x + 'px';
    wrap.style.top = y + 'px';
    wrap.style.right = 'auto';
    wrap.style.bottom = 'auto';
  }
  function savePos(clientX, clientY) {
    const x = Math.round(clientX / window.innerWidth * 1000) / 10;
    const y = Math.round(clientY / window.innerHeight * 1000) / 10;
    try { localStorage.setItem(LS_POS, JSON.stringify({ x: x, y: y })); } catch (e) {}
  }
  function applySavedPos() {
    try {
      const raw = localStorage.getItem(LS_POS);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (typeof o.x !== 'number' || typeof o.y !== 'number') return;
      positionAt(o.x / 100 * window.innerWidth, o.y / 100 * window.innerHeight);
    } catch (e) {}
  }

  /* ---------------- 点击他处收起 ---------------- */
  function bindDismiss() {
    document.addEventListener('pointerdown', e => {
      if (wrap.contains(e.target)) return;
      if (wrap.classList.contains('xm-open')) close();
    });
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    wrap = $('xiaoman-wrap');
    doll = $('xm-doll');
    bubble = $('xm-bubble');
    menu = $('xm-menu');
    panel = $('xm-panel');
    grid = $('xm-mod-grid');
    search = $('xm-search');
    if (!wrap || !doll) return;

    applySavedPos();
    initDrag();
    bindDismiss();

    menu.querySelectorAll('.xm-menu-item').forEach(b => {
      b.onclick = () => runAction(b.dataset.act);
    });
    $('xm-panel-close').onclick = hidePanel;
    search.addEventListener('input', () => renderModules(search.value));
    search.addEventListener('keydown', e => {
      if (e.key === 'Escape') hidePanel();
    });
  }

  return { init };
})();
