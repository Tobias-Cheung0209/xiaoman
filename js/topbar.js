/* ============================================================
 * 顶部状态栏：头像昵称 / 日期天气 / 名言 / 状态标签 / 股票概况
 * ============================================================ */

const Topbar = (function () {
  /* ---------- 日期 ---------- */
  function renderDate() {
    const now = new Date();
    const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('tb-date').textContent =
      `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${wk} ${hh}:${mm}`;
  }
  setInterval(renderDate, 30000);
  setInterval(() => { Topbar.refreshStock(); }, 60000); // 股票每分钟刷新

  /* ---------- 头像昵称 ---------- */
  function renderProfile() {
    const name = Store.getSetting('nickname', '我');
    const avatar = Store.getSetting('avatar', '');
    document.getElementById('tb-name').textContent = name;
    const av = document.getElementById('tb-avatar');
    if (avatar) { av.style.backgroundImage = `url(${avatar})`; av.textContent = ''; }
    else { av.textContent = name.slice(0, 1); }
  }

  /* ---------- 名言 ---------- */
  function dayIndex() {
    const start = new Date(new Date().getFullYear(), 0, 0);
    return Math.floor((new Date() - start) / 86400000);
  }
  function pickQuote(forceRandom) {
    let i;
    if (forceRandom) {
      do { i = Math.floor(Math.random() * QUOTES.length); }
      while (i === Store.getSetting('quoteIdx', -1) && QUOTES.length > 1);
    } else {
      i = dayIndex() % QUOTES.length;
    }
    Store.setSetting('quoteIdx', i);
    const q = QUOTES[i];
    document.getElementById('tb-quote').innerHTML =
      `“${q.t}” <span class="q-author">—— ${q.a}</span>`;
  }
  function refreshQuote() { pickQuote(true); }

  /* ---------- 纪念日/生日提醒 ---------- */
  function renderEvents() {
    const el = document.getElementById('tb-event');
    if (!el) return;
    const list = Store.getList('events');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysTo = (dateStr, type) => {
      if (!dateStr) return Infinity;
      const parts = dateStr.split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return Infinity;
      const [y, m, d] = parts;
      let next = new Date(today.getFullYear(), m - 1, d);
      if (type === '生日' && next < today) next.setFullYear(today.getFullYear() + 1);
      else if (next < today) return Infinity;
      return Math.round((next - today) / 86400000);
    };
    const scored = list
      .map(r => ({ r, days: daysTo(r.date, r.type) }))
      .filter(x => x.days !== Infinity && x.days >= 0)
      .sort((a, b) => a.days - b.days);
    if (!scored.length) { el.style.display = 'none'; return; }
    el.style.display = '';
    const top = scored[0];
    const icon = top.r.type === '生日' ? '🎂' : (top.r.type === '纪念日' ? '💍' : '🎉');
    let tail;
    if (top.days === 0) tail = '今天';
    else if (top.days === 1) tail = '明天';
    else tail = `还有${top.days}天`;
    el.textContent = `${icon} ${top.r.name} ${tail}`;
    el.title = `${top.r.date} · ${top.r.type}`;
  }

  /* ---------- 今日状态标签 ---------- */
  function renderStatus() {
    const sel = document.getElementById('tb-status');
    sel.innerHTML = STATUS_TAGS.map(t =>
      `<option value="${t}">${t}</option>`).join('');
    const cur = Store.getSetting('statusTag', '普通日');
    sel.value = cur;
    sel.onchange = () => Store.setSetting('statusTag', sel.value);
  }

  /* ---------- 天气（Open-Meteo，自动定位） ---------- */
  const WMO = {
    0: ['晴', '☀️'], 1: ['晴间多云', '🌤️'], 2: ['多云', '⛅'], 3: ['阴', '☁️'],
    45: ['雾', '🌫️'], 48: ['雾凇', '🌫️'], 51: ['毛毛雨', '🌦️'], 53: ['小雨', '🌦️'],
    55: ['中雨', '🌧️'], 61: ['小雨', '🌧️'], 63: ['中雨', '🌧️'], 65: ['大雨', '🌧️'],
    71: ['小雪', '🌨️'], 73: ['中雪', '🌨️'], 75: ['大雪', '❄️'], 80: ['阵雨', '🌦️'],
    81: ['阵雨', '🌧️'], 82: ['强阵雨', '⛈️'], 95: ['雷阵雨', '⛈️'], 96: ['雷阵雨', '⛈️'],
    99: ['雷暴', '⛈️'],
  };
  function renderWeather(temp, code) {
    const info = WMO[code] || ['—', '🌡️'];
    document.getElementById('tb-weather').innerHTML =
      `${info[1]} ${info[0]} ${Math.round(temp)}°C`;
  }
  function loadWeather() {
    document.getElementById('tb-weather').textContent = '🌍 定位中…';
    const ok = (lat, lon) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code`;
      fetch(url).then(r => r.json()).then(d => {
        if (d && d.current) renderWeather(d.current.temperature_2m, d.current.weather_code);
      }).catch(() => {
        document.getElementById('tb-weather').textContent = '🌡️ 天气获取失败';
      });
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => ok(p.coords.latitude, p.coords.longitude),
        () => ok(52.52, 13.405), // 默认定位柏林
        { timeout: 8000 }
      );
    } else { ok(52.52, 13.405); }
  }

  /* ---------- 股票概况（实时，中美重点/日韩其次/其他一笔带过） ---------- */
  function colorFor(pct) {
    // 中国市场习惯：涨红跌绿
    if (pct > 0) return 'up';   // 红
    if (pct < 0) return 'down'; // 绿
    return 'flat';
  }
  async function refreshStock() {
    const box = document.getElementById('tb-stock');
    const cached = Store.getSetting('stockCache', null);
    const cacheTime = Store.getSetting('stockCacheTime', 0);
    const now = Date.now();
    if (cached && now - cacheTime < 120000) {
      renderStock(cached);
      return;
    }
    box.innerHTML = '<span class="stock-loading">行情加载中…</span>';
    const symbols = STOCK_WATCH.map(s => s.symbol).join(',');
    const api = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(symbols);
    const proxy = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(api);
    try {
      const res = await fetch(proxy);
      const json = await res.json();
      const arr = (json && json.quoteResponse && json.quoteResponse.result) || [];
      const map = {};
      arr.forEach(q => {
        map[q.symbol] = {
          price: q.regularMarketPrice,
          pct: q.regularMarketChangePercent,
        };
      });
      Store.setSetting('stockCache', map);
      Store.setSetting('stockCacheTime', now);
      renderStock(map);
    } catch (e) {
      if (cached) renderStock(cached);
      else box.innerHTML = '<span class="stock-loading">行情暂不可用</span>';
    }
  }
  function renderStock(map) {
    const groups = { cn: [], us: [], jp: [], kr: [], other: [] };
    STOCK_WATCH.forEach(s => {
      const d = map[s.symbol];
      if (!d) return;
      groups[s.group].push({ name: s.name, pct: d.pct });
    });
    function chip(g) {
      if (!g.length) return '';
      return g.map(s => {
        const c = colorFor(s.pct);
        const sign = s.pct > 0 ? '+' : '';
        return `<span class="stock-chip ${c}">${s.name} ${sign}${s.pct.toFixed(2)}%</span>`;
      }).join('');
    }
    const main = chip(groups.cn.concat(groups.us));
    const sub = chip(groups.jp.concat(groups.kr));
    const other = chip(groups.other);
    document.getElementById('tb-stock').innerHTML =
      `<span class="stock-main">${main}</span>` +
      (sub ? `<span class="stock-sub">${sub}</span>` : '') +
      (other ? `<span class="stock-other">${other}</span>` : '');
  }

  function init() {
    renderDate();
    renderProfile();
    renderEvents();
    renderStatus();
    pickQuote(false);
    loadWeather();
    refreshStock();
    document.getElementById('tb-quote-refresh').onclick = refreshQuote;
  }

  return { init, refreshStock, renderProfile, renderEvents };
})();
