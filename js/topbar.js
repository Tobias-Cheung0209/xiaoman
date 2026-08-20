/* ============================================================
 * 顶部状态栏（V3 极简版）
 * 顶栏仅显示头像 + 昵称；日期/天气/名言迁入 Hero 卡。
 * 本模块负责：加载天气、轮换名言，并暴露 getWeatherText/getQuoteHtml
 * 供 app.js renderHome() 取用；天气异步加载完直接更新 #hero-weather。
 * ============================================================ */

const Topbar = (function () {
  let weatherText = '🌡️ 定位中…';
  let quoteHtml = '';

  /* ---------- 头像昵称 ---------- */
  function renderProfile() {
    const name = Store.getSetting('nickname', '我');
    const avatar = Store.getSetting('avatar', '');
    const nameEl = document.getElementById('tb-name');
    const avEl = document.getElementById('tb-avatar');
    if (nameEl) nameEl.textContent = name;
    if (avEl) {
      if (avatar) { avEl.style.backgroundImage = `url(${avatar})`; avEl.textContent = ''; }
      else { avEl.style.backgroundImage = ''; avEl.textContent = name.slice(0, 1); }
    }
  }

  /* ---------- 名言（固定座右铭，不再轮换） ---------- */
  function renderQuote() {
    const t = (typeof MOTTO !== 'undefined') ? MOTTO : '日拱一卒无有尽，功不唐捐终入海。';
    quoteHtml = `“${t}”`;
    const el = document.getElementById('hero-quote');
    if (el) el.innerHTML = quoteHtml;
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
  function setWeather(temp, code) {
    const info = WMO[code] || ['—', '🌡️'];
    weatherText = `${info[1]} ${info[0]} ${Math.round(temp)}°C`;
    const el = document.getElementById('hero-weather');
    if (el) el.textContent = weatherText;
  }
  function loadWeather() {
    const ok = (lat, lon) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code`;
      fetch(url).then(r => r.json()).then(d => {
        if (d && d.current) setWeather(d.current.temperature_2m, d.current.weather_code);
      }).catch(() => { weatherText = '🌡️ 天气获取失败'; const el = document.getElementById('hero-weather'); if (el) el.textContent = weatherText; });
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => ok(p.coords.latitude, p.coords.longitude),
        () => ok(52.52, 13.405),
        { timeout: 8000 }
      );
    } else { ok(52.52, 13.405); }
  }

  /* ---------- 最近纪念日/生日（供 Hero/首页提醒） ---------- */
  /* 计算单个重要日期的下次发生日（支持 repeatCycle：不重复/每日/每周/每月/每年） */
  function nextOccurrence(dateStr, repeatCycle, today) {
    const parts = (dateStr || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const cyc = repeatCycle || '每年';
    const [y, m, d] = parts;
    if (cyc === '每日') return new Date(today);
    if (cyc === '每周') {
      const wd = new Date(y, m - 1, d).getDay(); // 原日期的星期几
      let dd = new Date(today);
      while (dd.getDay() !== wd) dd.setDate(dd.getDate() + 1);
      return dd;
    }
    if (cyc === '每月') {
      let dd = new Date(today.getFullYear(), today.getMonth(), d);
      if (dd < today) dd = new Date(today.getFullYear(), today.getMonth() + 1, d);
      return dd;
    }
    // 每年 / 不重复
    let dd = new Date(today.getFullYear(), m - 1, d);
    if (dd < today) {
      if (cyc === '不重复') return null;
      dd = new Date(today.getFullYear() + 1, m - 1, d);
    }
    return dd;
  }
  function getNextEvent() {
    const list = Store.getList('events');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const scored = list
      .map(r => {
        const occ = nextOccurrence(r.date, r.repeatCycle, today);
        if (!occ) return null;
        const days = Math.round((occ - today) / 86400000);
        return (days >= 0) ? { r, days } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.days - b.days);
    return scored.length ? scored[0] : null;
  }
  /* 首页横幅：返回未来 remindDays 窗口内（含今天）的所有重要日期 */
  function getUpcomingEvents() {
    const list = Store.getList('events');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const out = [];
    list.forEach(r => {
      const occ = nextOccurrence(r.date, r.repeatCycle, today);
      if (!occ) return;
      const days = Math.round((occ - today) / 86400000);
      const remind = parseInt(r.remindDays) || 0;
      // remindDays=0 → 仅当天提醒；否则提前 remind 天起提醒
      if (days >= 0 && days <= Math.max(remind, 0)) out.push({ r, days });
    });
    return out.sort((a, b) => a.days - b.days);
  }

  /* ---------- 暴露 ---------- */
  function getWeatherText() { return weatherText; }
  function getQuoteHtml() { return quoteHtml; }

  function init() {
    renderProfile();
    renderQuote();
    loadWeather();
  }

  return { init, renderProfile, getWeatherText, getQuoteHtml, getNextEvent, getUpcomingEvents };
})();
