/* 多主题注册表：公共功能只维护一份，主题仅负责视觉与陪伴角色。 */
const ThemeManager = (function () {
  const THEMES = [
    { id:'xiaoman', name:'小满', fullName:'小满则盈', desc:'原版蓝粉梦境', icon:'🫧', mascot:'xiaoman', modeKey:'xiaomanMode', color:'#66B6FF' },
    { id:'xmer', name:'Xmer', fullName:'Xmer', desc:'奶油森林与猫猫', icon:'🐱', mascot:'xmer', modeKey:'xmerMode', color:'#75866A', preview:'images/xmer/xmer-hero-perch.png' },
    { id:'maple-dream', name:'冒险岛梦幻', fullName:'小满则盈 · 冒险岛梦幻', desc:'浮空村落与品克缤', icon:'🌿', mascot:'none', color:'#67B98B', preview:'design-concepts/maplestory-dream-scene-v2.png' },
    { id:'maple-phantom', name:'冒险岛幻影', fullName:'小满则盈 · 冒险岛幻影', desc:'怪盗幻影与水晶花园', icon:'🎩', mascot:'none', color:'#7567C7', preview:'design-concepts/maplestory-phantom-scene-v2.png' },
    { id:'maple-kerning', name:'冒险岛废弃都市', fullName:'小满则盈 · 废弃都市', desc:'夜城、钢架与三眼章鱼', icon:'🐙', mascot:'none', color:'#263B61', preview:'design-concepts/maplestory-kerning-city-scene-v2.png' },
    { id:'maple-ellinia', name:'冒险岛魔法密林', fullName:'小满则盈 · 魔法密林', desc:'巨木、藤蔓与绿色水灵', icon:'🌳', mascot:'none', color:'#3E8C65', preview:'design-concepts/maplestory-ellinia-scene-v2.png' },
    { id:'maple-perion', name:'冒险岛勇士部落', fullName:'小满则盈 · 勇士部落', desc:'赤岩、图腾与木妖', icon:'🪵', mascot:'none', color:'#A85E3D', preview:'design-concepts/maplestory-perion-scene-v2.png' },
    { id:'maple-henesys', name:'冒险岛射手村', fullName:'小满则盈 · 射手村', desc:'花田、风车与橙蘑菇', icon:'🍄', mascot:'none', color:'#78A955', preview:'design-concepts/maplestory-henesys-scene-v2.png' },
    { id:'maple-lith', name:'冒险岛明珠港', fullName:'小满则盈 · 明珠港', desc:'海港、灯塔与蓝蜗牛', icon:'⚓', mascot:'none', color:'#3F9DBB', preview:'design-concepts/maplestory-lith-harbor-scene-v2.png' },
    { id:'genshin-hutao', name:'原神胡桃', fullName:'小满则盈 · 胡桃', desc:'璃月灯火、梅花与幽灵', icon:'🌸', mascot:'none', color:'#8F353A', preview:'design-concepts/genshin-hutao-scene-v2.png' },
  ];
  const MAP = Object.fromEntries(THEMES.map(t => [t.id, t]));
  let active = null;
  const assetUrl = path => path ? new URL(path, document.baseURI).href : '';

  function current() {
    if (active) return active;
    const id = typeof Store !== 'undefined' ? Store.getSetting('theme', 'xiaoman') : 'xiaoman';
    return MAP[id] || MAP.xiaoman;
  }

  function migrateXmerData() {
    if (typeof Store === 'undefined' || Store.getMeta('xmerMergedV1', false)) return;
    let raw = '';
    try { raw = localStorage.getItem('xmer_data') || ''; } catch (_) {}
    if (!raw) { Store.setMeta('xmerMergedV1', { at:new Date().toISOString(), found:false }); return; }
    try {
      const parsed = JSON.parse(raw);
      /* 只迁移记录，不迁移昵称、头像或任何人物专属设置。原 xmer_data 保留为可恢复备份。 */
      const sanitized = {
        schemaVersion: parsed.schemaVersion || 2,
        collections: parsed.collections || {},
        settings: {},
        settingTimes: {},
      };
      if (Store.mergeAll(JSON.stringify(sanitized))) {
        Store.setMeta('xmerMergedV1', { at:new Date().toISOString(), found:true, bytes:raw.length, sourceKey:'xmer_data' });
      }
    } catch (err) {
      console.warn('Xmer data migration skipped', err);
    }
  }

  function setLabel(selector, value) {
    const el = document.querySelector(selector);
    if (!el) return;
    if (selector === '.dh-title') {
      const img = el.querySelector('img');
      el.textContent = '';
      if (img) el.appendChild(img);
      el.appendChild(document.createTextNode(value));
    } else el.textContent = value;
  }

  function apply(id) {
    active = MAP[id] || MAP.xiaoman;
    document.documentElement.dataset.theme = active.id;
    document.documentElement.dataset.skin = active.id.startsWith('maple-') || active.id === 'genshin-hutao' ? 'adventure' : 'soft';
    document.documentElement.style.setProperty('--theme-color', active.color);
    document.documentElement.style.setProperty('--theme-art', active.preview ? `url("${assetUrl(active.preview)}")` : 'none');
    document.title = active.fullName;
    setLabel('.topbar-app-name', active.fullName);
    setLabel('.dh-title', active.fullName);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = active.color;
    const doll = document.getElementById('xm-doll');
    if (doll) doll.setAttribute('aria-label', active.mascot === 'xmer' ? 'Xmer 猫猫吉祥物' : '小满吉祥物');
    return active;
  }

  function renderHeroDecoration() {
    if (current().id !== 'xmer') return '';
    return `<div class="hero-lifestyle" aria-hidden="true">
      <div class="hero-accent"><b>♥</b><i>✦</i><em>✧</em></div>
      <div class="hero-slow">生活很美<br>慢慢来</div>
      <div class="hero-plant"><i></i><i></i><i></i><b></b></div>
      <div class="hero-books"><span>Good</span><span>Things</span><span>Take Time</span></div>
      <img class="hero-perch-cat" src="images/xmer/xmer-hero-perch.png?v=1" alt="">
    </div>`;
  }

  function renderPicker(selectedId) {
    return `<div class="theme-picker">${THEMES.map(t => `<button type="button" class="theme-choice ${t.id===selectedId?'active':''}" data-theme-choice="${t.id}" aria-pressed="${t.id===selectedId?'true':'false'}" style="--choice-color:${t.color};${t.preview?`--choice-image:url('${assetUrl(t.preview)}')`:''}">
      <span class="theme-choice-preview">${t.preview?'':t.icon}</span>
      <b>${t.name}</b><small>${t.desc}</small>${t.mascot==='none'?'<em>整套皮肤</em>':''}
    </button>`).join('')}</div>`;
  }

  function modeKeyFor(id) { return (MAP[id] || MAP.xiaoman).modeKey || ''; }
  function companionName(id) {
    const t = MAP[id] || current();
    return t.mascot === 'xmer' ? '猫猫' : t.mascot === 'xiaoman' ? '小满' : '';
  }

  function initMascot() {
    const t = current(), wrap = document.getElementById('xiaoman-wrap');
    if (t.mascot === 'xmer' && typeof XmerMascot !== 'undefined') {
      const sleep=document.getElementById('xm-img-sleep'),rub=document.getElementById('xm-img-rubbing'),peek=document.getElementById('xm-img-peek');
      sleep.src = 'images/xmer/xmer-sleeping.png?v=1'; rub.src = 'images/xmer/xmer-rubbing.png?v=1'; peek.src = 'images/xmer/xmer-peek.png?v=1';
      sleep.alt = rub.alt = peek.alt = 'Xmer 猫猫';
      XmerMascot.init();
    } else if (t.mascot === 'xiaoman' && typeof Xiaoman !== 'undefined') {
      Xiaoman.init();
    } else if (wrap) {
      wrap.classList.add('xm-hidden');
    }
  }

  function applyMode(mode) {
    const t = current();
    if (t.mascot === 'xmer' && typeof XmerMascot !== 'undefined') XmerMascot.applyMode(mode);
    if (t.mascot === 'xiaoman' && typeof Xiaoman !== 'undefined') Xiaoman.applyMode(mode);
  }

  function celebrate() {
    const t = current();
    if (t.mascot === 'xmer' && typeof XmerMascot !== 'undefined') XmerMascot.celebrate();
    if (t.mascot === 'xiaoman' && typeof Xiaoman !== 'undefined') Xiaoman.celebrate();
  }

  function init() {
    migrateXmerData();
    apply(Store.getSetting('theme', 'xiaoman'));
  }

  return { init, apply, current, renderHeroDecoration, renderPicker, modeKeyFor, companionName, initMascot, applyMode, celebrate, themes:THEMES };
})();
