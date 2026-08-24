/* ============================================================
 * 小满吉祥物 V5.0：起身揉眼动画（3 图时序）+ 居中弹窗 + 保持醒着
 * 状态机：idle ↔ waking → rubbing → open
 *  - 待机：睡觉图（趴着闭眼），呼吸 + 偶尔轻晃
 *  - 点击：起身(sleep 缩旋转消失) → 揉眼(rubbing 摇) → 探头(peek)+菜单
 *  - 保持醒着：say/modules/settings 不立刻 close；只有选具体模块/填表/dismiss 才睡
 * ============================================================ */
const Xiaoman = (function () {
  const LS_POS = 'wb_mascot_pos_v2';
  const LS_POS_OLD = 'wb_mascot_pos';

  let wrap, doll, bubble, menu, panel, panelMask, grid, search, shock, particlesEl;
  let bubbleTimer = null, wakeTimers = [];

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

  /* ---------------- 点击特效 ---------------- */
  function clickFx() {
    /* 惊讶气泡 */
    shock.classList.remove('show');
    void shock.offsetWidth;
    shock.classList.add('show');
    /* 粒子 */
    spawnParticles(5);
  }
  function spawnParticles(n) {
    const host = $('xm-particles') || particlesEl || wrap;
    if (!host) return;
    const cx = wrap.offsetWidth / 2;
    const cy = wrap.offsetHeight / 2;
    const icons = ['✨', '💗', '✦', '✧', '★', '💖'];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'xm-particle';
      p.textContent = icons[Math.floor(Math.random() * icons.length)];
      const angle = (-90 + (Math.random() - 0.5) * 110) * Math.PI / 180;
      const dist = 50 + Math.random() * 50;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * dist - 20 + 'px');
      p.style.setProperty('--rot', (Math.random() * 80 - 40) + 'deg');
      host.appendChild(p);
      void p.offsetWidth;
      p.classList.add('fly');
      setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 1100);
    }
  }

  /* ---------------- 状态机：起身 / 揉眼 / 探头 / 睡 ---------------- */
  function isAwake() {
    return wrap.classList.contains('xm-open') ||
           wrap.classList.contains('xm-waking') ||
           wrap.classList.contains('xm-rubbing');
  }
  function clearWakeTimers() {
    wakeTimers.forEach(t => clearTimeout(t));
    wakeTimers = [];
  }
  function startWake() {
    clearWakeTimers();
    hideBubble();
    hidePanel();
    wrap.classList.remove('xm-idle', 'xm-waking', 'xm-rubbing', 'xm-open', 'xm-panel-mode', 'xm-speaking');
    wrap.classList.add('xm-waking');
    // 阶段 1：起身（sleep 缩旋转消失 → rubbing 出现）~450ms
    wakeTimers.push(setTimeout(() => {
      if (!wrap.classList.contains('xm-waking')) return;
      wrap.classList.remove('xm-waking');
      wrap.classList.add('xm-rubbing');
      // 阶段 2：揉眼（rubbing 摇两下）~500ms
      wakeTimers.push(setTimeout(() => {
        if (!wrap.classList.contains('xm-rubbing')) return;
        wrap.classList.remove('xm-rubbing');
        wrap.classList.add('xm-open');
        fitMenu();                     // 进入展开态时测量避让
        clickFx();
      }, 500));
    }, 450));
  }
  function open() {
    if (isAwake()) return;
    startWake();
  }
  function close() {
    clearWakeTimers();
    wrap.classList.add('xm-idle');
    wrap.classList.remove('xm-waking', 'xm-rubbing', 'xm-open', 'xm-panel-mode', 'xm-speaking');
    hideBubble();
    hidePanel();
  }
  function toggle() {
    if (wrap.classList.contains('xm-speaking')) {
      // 正在说话（菜单收起中）：再点小满 → 直接恢复菜单
      hideBubble();
      expandMenu();
      return;
    }
    if (isAwake()) close();
    else open();
  }

  /* ---------------- 台词气泡 ---------------- */
  function say(text, options) {
    hideBubble();
    bubble.textContent = text;
    bubble.classList.remove('xm-bubble-reminder');
    bubble.classList.remove('show', 'below');
    bubble.style.removeProperty('right');
    bubble.hidden = false;           // 先布局，才能测量避让
    fitBubble();
    void bubble.offsetWidth;
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    // 气播完后菜单回来（若小满还醒着）
    bubbleTimer = setTimeout(() => {
      hideBubble();
      if (isAwake()) expandMenu();
    }, options && options.duration ? options.duration : 2800);
  }
  function sayReminder(summary) {
    if (!summary || typeof summary === 'string') { say(summary || randomLine()); return; }
    hideBubble();
    bubble.textContent = '';
    bubble.classList.add('xm-bubble-reminder');
    const closeBtn = document.createElement('button');
    closeBtn.className = 'xm-bubble-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.textContent = '×';
    const lead = document.createElement('b');
    lead.textContent = summary.lead;
    const detail = document.createElement('span');
    detail.textContent = summary.detail;
    const viewBtn = document.createElement('button');
    viewBtn.className = 'xm-bubble-view';
    viewBtn.type = 'button';
    viewBtn.textContent = summary.count ? '查看今日提醒' : '知道了';
    closeBtn.onclick = e => { e.stopPropagation(); hideBubble(); if (isAwake()) expandMenu(); };
    viewBtn.onclick = () => {
      hideBubble();
      close();
      if (summary.count && App.focusTodayReminders) App.focusTodayReminders();
    };
    bubble.append(closeBtn, lead);
    if (summary.detail) bubble.append(detail);
    bubble.append(viewBtn);
    bubble.classList.remove('show', 'below');
    bubble.style.removeProperty('right');
    bubble.hidden = false;
    fitBubble();
    void bubble.offsetWidth;
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { hideBubble(); if (isAwake()) expandMenu(); }, 7000);
  }
  function hideBubble() {
    clearTimeout(bubbleTimer);
    bubbleTimer = null;
    bubble.hidden = true;
    bubble.classList.remove('show', 'below', 'xm-bubble-reminder');
  }

  /* ---------------- 菜单收起 / 恢复（说点啥时不与气泡重叠） ---------------- */
  function collapseMenu() { wrap.classList.add('xm-speaking'); }
  function expandMenu() { wrap.classList.remove('xm-speaking'); fitMenu(); }

  /* ---------------- 自动避让：菜单/气泡不超出视口 ---------------- */
  function fitMenu() {
    if (!menu) return;
    menu.classList.remove('below');
    menu.style.removeProperty('right');
    // 上方空间不足 → 切换到小满下方展开
    const dTop = doll.getBoundingClientRect().top;
    const mH = menu.offsetHeight || 190;
    if (dTop < mH + 16) menu.classList.add('below');
    // 水平：贴左缘时右移，保证完整可见
    const mW = menu.offsetWidth || 142;
    const wR = wrap.getBoundingClientRect();
    const leftEdge = wR.right - 6 - mW;   // 默认 right:6px
    if (leftEdge < 8) menu.style.right = (6 - (8 - leftEdge)) + 'px';
  }
  function fitBubble() {
    if (!bubble) return;
    bubble.classList.remove('below');
    bubble.style.removeProperty('right');
    const dTop = doll.getBoundingClientRect().top;
    const bH = bubble.offsetHeight || 64;
    if (dTop < bH + 18) bubble.classList.add('below');
    const bW = bubble.offsetWidth || 180;
    const wR = wrap.getBoundingClientRect();
    const leftEdge = wR.right - 12 - bW;  // 默认 right:12px
    if (leftEdge < 8) bubble.style.right = (12 - (8 - leftEdge)) + 'px';
  }

  /* ---------------- 全部模块面板（v15 居中弹窗） ---------------- */
  function showPanel() {
    hideBubble();
    // 确保小满处于 open 状态（保持醒着）
    if (wrap.classList.contains('xm-idle') || wrap.classList.contains('xm-waking') || wrap.classList.contains('xm-rubbing')) {
      // 用户从 idle/waking 触发？——保持当前进度加速
      // 简单做法：强制进入 open
      clearWakeTimers();
      wrap.classList.remove('xm-idle', 'xm-waking', 'xm-rubbing', 'xm-speaking');
      wrap.classList.add('xm-open');
      fitMenu();
    }
    renderModules('');
    panel.hidden = false;
    panelMask.hidden = false;
    panel.classList.remove('show');
    panelMask.classList.remove('show');
    void panel.offsetWidth;
    panel.classList.add('show');
    panelMask.classList.add('show');
    search.value = '';
    setTimeout(() => search.focus(), 80);
  }
  function hidePanel() {
    panel.classList.remove('show');
    panelMask.classList.remove('show');
    setTimeout(() => {
      panel.hidden = true;
      panelMask.hidden = true;
    }, 260);
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
        close(); // 选定具体模块后小满睡下
        say('走，去「' + name + '」看看');
      };
    });
  }

  /* ---------------- 菜单动作（保持醒着：say/modules/settings 不 close） ---------------- */
  function runAction(act) {
    switch (act) {
      case 'add': {
        close();
        App.openQuickAdd();
        break;
      }
      case 'say':
        // 说点啥：收起菜单，气泡独占，小满保持醒着
        hidePanel();
        wrap.classList.remove('xm-has-reminder');
        collapseMenu();
        sayReminder((App.getReminderSummary && App.getReminderSummary()) || randomLine());
        break;
      case 'modules':
        // 全部模块：弹窗，小满保持醒着
        showPanel();
        break;
      case 'settings':
        // 设置：弹窗，小满保持醒着
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
      if (panelMask && !panelMask.hidden && panel.contains(e.target)) return;
      // App 自身弹窗（设置/表单）打开时不误关小满
      const appModal = $('modal');
      if (appModal && appModal.classList.contains('show')) return;
      if (isAwake()) close();
    });
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    wrap = $('xiaoman-wrap');
    doll = $('xm-doll');
    bubble = $('xm-bubble');
    menu = $('xm-menu');
    panel = $('xm-panel');
    panelMask = $('xm-panel-mask');
    grid = $('xm-mod-grid');
    search = $('xm-search');
    shock = $('xm-shock');
    particlesEl = $('xm-particles');
    if (!wrap || !doll) return;

    // 旧版本的位置记录（底部角落）不再适用，清除
    try { localStorage.removeItem(LS_POS_OLD); } catch (e) {}
    applySavedPos();
    initDrag();
    bindDismiss();

    menu.querySelectorAll('.xm-menu-item').forEach(b => {
      b.onclick = () => runAction(b.dataset.act);
    });
    $('xm-panel-close').onclick = hidePanel;
    if (panelMask) panelMask.onclick = hidePanel;
    search.addEventListener('input', () => renderModules(search.value));
    search.addEventListener('keydown', e => {
      if (e.key === 'Escape') hidePanel();
    });
    // 有提醒时只显示一个安静的小圆点；不再自动唤醒或弹出气泡。
    try { const brief=App.getReminderSummary&&App.getReminderSummary(); if (brief && brief.count) wrap.classList.add('xm-has-reminder'); } catch(_) {}
  }

  return { init };
})();
