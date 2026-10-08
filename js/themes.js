/* 多主题注册表：公共功能只维护一份，主题仅负责视觉与陪伴角色。 */
const ThemeManager = (function () {
  const THEMES = [
    { id:'xiaoman', name:'小满', fullName:'小满则盈', desc:'原版蓝粉梦境', icon:'🫧', mascot:'xiaoman', companion:'小满', modeKey:'xiaomanMode', color:'#66B6FF', mascotThumb:'images/xiaoman-peek.png', navIcons:{home:'🏠',settings:'⚙️'} },
    { id:'xmer', name:'Xmer', fullName:'Xmer', desc:'奶油森林与猫猫', icon:'🐱', mascot:'xmer', companion:'猫猫', modeKey:'xmerMode', color:'#75866A', preview:'images/xmer/xmer-hero-perch.png', mascotThumb:'images/xmer/xmer-idle.png', navIcons:{home:'🏡',settings:'🌿'} },
    { id:'maple-dream', name:'冒险岛梦幻', fullName:'小满则盈 · 冒险岛梦幻', desc:'浮空村落与品克缤', icon:'🎧', mascot:'xiaoman', companion:'品克缤', modeKey:'xiaomanMode', color:'#67B98B', preview:'design-concepts/maplestory-dream-scene-v2.png', navIcons:{home:'🏡',settings:'🍃'}, moduleIcons:{discipline:'📜',kitchen:'🧁',jikui:'🌱',study:'📚',money:'💎',life:'🌼',rigong:'📔',invest:'🪙',travel:'🗺️',fun:'🎈',files:'🧺',toolbox:'🧰'} },
    { id:'maple-phantom', name:'冒险岛幻影', fullName:'小满则盈 · 冒险岛幻影', desc:'怪盗幻影与水晶花园', icon:'🎩', mascot:'xiaoman', mascotFlow:'character', companion:'小幻影', modeKey:'xiaomanMode', color:'#7567C7', preview:'design-concepts/maplestory-phantom-scene-v2.png', mascotThumb:'design-concepts/mascot-v2-phantom-idle.png', mascotAssets:{sleep:'design-concepts/mascot-v2-phantom-idle.png',rub:'design-concepts/mascot-v2-phantom-react.png',peek:'design-concepts/mascot-v2-phantom-open.png'}, navIcons:{home:'🃏',settings:'⚙️'}, moduleIcons:{discipline:'🃏',kitchen:'☕',jikui:'💠',study:'📖',money:'💰',life:'🎭',rigong:'✒️',invest:'🔮',travel:'🧭',fun:'🎩',files:'🗂️',toolbox:'🛠️'} },
    { id:'maple-kerning', name:'冒险岛废弃都市', fullName:'小满则盈 · 废弃都市', desc:'夜城、钢架与三眼章鱼', icon:'🐙', mascot:'xiaoman', companion:'三眼章鱼', modeKey:'xiaomanMode', color:'#263B61', preview:'design-concepts/maplestory-kerning-city-scene-v2.png', mascotThumb:'design-concepts/mascot-v3-three-eyed-octopus.png', mascotAssets:{sleep:'design-concepts/mascot-v3-three-eyed-octopus.png',rub:'design-concepts/mascot-v3-three-eyed-octopus.png',peek:'design-concepts/mascot-v3-three-eyed-octopus.png'}, navIcons:{home:'🚇',settings:'🔧'}, moduleIcons:{discipline:'📋',kitchen:'🥫',jikui:'🚧',study:'💾',money:'💵',life:'💡',rigong:'🗒️',invest:'📟',travel:'🚇',fun:'🎧',files:'🗄️',toolbox:'🧰'} },
    { id:'maple-ellinia', name:'冒险岛魔法密林', fullName:'小满则盈 · 魔法密林', desc:'巨木、藤蔓与绿色水灵', icon:'🟢', mascot:'xiaoman', companion:'绿水灵', modeKey:'xiaomanMode', color:'#3E8C65', preview:'design-concepts/maplestory-ellinia-scene-v2.png', mascotThumb:'design-concepts/mascot-v4-green-slime-final.png', mascotAssets:{sleep:'design-concepts/mascot-v4-green-slime-final.png',rub:'design-concepts/mascot-v4-green-slime-final.png',peek:'design-concepts/mascot-v4-green-slime-final.png'}, navIcons:{home:'🌳',settings:'🪄'}, moduleIcons:{discipline:'🍃',kitchen:'🍵',jikui:'🌱',study:'📗',money:'💚',life:'🪷',rigong:'📜',invest:'🔮',travel:'🧚',fun:'✨',files:'🍂',toolbox:'🧪'} },
    { id:'maple-perion', name:'冒险岛勇士部落', fullName:'小满则盈 · 勇士部落', desc:'赤岩、图腾与木妖', icon:'🪵', mascot:'xiaoman', companion:'木妖', modeKey:'xiaomanMode', color:'#A85E3D', preview:'design-concepts/maplestory-perion-scene-v2.png', mascotThumb:'design-concepts/mascot-v5-stump.png', mascotAssets:{sleep:'design-concepts/mascot-v5-stump.png',rub:'design-concepts/mascot-v5-stump.png',peek:'design-concepts/mascot-v5-stump.png'}, navIcons:{home:'🗿',settings:'🔨'}, moduleIcons:{discipline:'📜',kitchen:'🔥',jikui:'🌵',study:'🪨',money:'🪙',life:'🏕️',rigong:'🪶',invest:'💎',travel:'🧭',fun:'🥁',files:'🗺️',toolbox:'🪓'} },
    { id:'maple-henesys', name:'冒险岛射手村', fullName:'小满则盈 · 射手村', desc:'花田、风车与花蘑菇', icon:'🍄', mascot:'xiaoman', companion:'花蘑菇', modeKey:'xiaomanMode', color:'#78A955', preview:'design-concepts/maplestory-henesys-scene-v2.png', mascotThumb:'design-concepts/mascot-v6-flower-mushroom-v2.png', mascotAssets:{sleep:'design-concepts/mascot-v6-flower-mushroom-v2.png',rub:'design-concepts/mascot-v6-flower-mushroom-v2.png',peek:'design-concepts/mascot-v6-flower-mushroom-v2.png'}, navIcons:{home:'🍄',settings:'🎯'}, moduleIcons:{discipline:'🎯',kitchen:'🥧',jikui:'🌱',study:'📚',money:'🧺',life:'🌻',rigong:'📔',invest:'🍀',travel:'🏹',fun:'🪁',files:'📮',toolbox:'🧰'} },
    { id:'maple-lith', name:'冒险岛明珠港', fullName:'小满则盈 · 明珠港', desc:'海港、灯塔与蓝蜗牛', icon:'🐌', mascot:'xiaoman', companion:'蓝蜗牛', modeKey:'xiaomanMode', color:'#3F9DBB', preview:'design-concepts/maplestory-lith-harbor-scene-v2.png', mascotThumb:'design-concepts/mascot-v7-blue-snail.png', mascotAssets:{sleep:'design-concepts/mascot-v7-blue-snail.png',rub:'design-concepts/mascot-v7-blue-snail.png',peek:'design-concepts/mascot-v7-blue-snail.png'}, navIcons:{home:'⚓',settings:'🧭'}, moduleIcons:{discipline:'📋',kitchen:'🐟',jikui:'🌱',study:'📘',money:'🪙',life:'🛟',rigong:'📓',invest:'⚓',travel:'⛵',fun:'🐚',files:'🗺️',toolbox:'🧰'} },
    { id:'genshin-hutao', name:'原神胡桃', fullName:'小满则盈 · 胡桃', desc:'璃月灯火、梅花与幽灵', icon:'👻', mascot:'xiaoman', mascotFlow:'character', companion:'小胡桃', modeKey:'xiaomanMode', color:'#8F353A', preview:'design-concepts/genshin-hutao-scene-v2.png', mascotThumb:'design-concepts/mascot-v8-hutao.png', mascotAssets:{sleep:'design-concepts/mascot-v8-hutao.png',rub:'design-concepts/mascot-v8-hutao-react.png',peek:'design-concepts/mascot-v8-hutao-open.png'}, navIcons:{home:'🏮',settings:'🌸'}, moduleIcons:{discipline:'📜',kitchen:'🍲',jikui:'🦋',study:'📕',money:'💰',life:'🏮',rigong:'📔',invest:'🧿',travel:'🧭',fun:'👻',files:'🗂️',toolbox:'🪄'} },
    { id:'genshin-ayaka', name:'原神神里绫华', fullName:'小满则盈 · 神里绫华', desc:'稻妻樱庭、冰华与白鹭', icon:'❄️', mascot:'xiaoman', mascotFlow:'character', companion:'小神里绫华', modeKey:'xiaomanMode', color:'#6689C9', preview:'design-concepts/genshin-ayaka-scene-v9.png', mascotThumb:'design-concepts/mascot-v9-ayaka.png', mascotAssets:{sleep:'design-concepts/mascot-v9-ayaka.png',rub:'design-concepts/mascot-v9-ayaka-react.png',peek:'design-concepts/mascot-v9-ayaka-open.png'}, navIcons:{home:'🏯',settings:'❄️'}, moduleIcons:{discipline:'🌸',kitchen:'🍵',jikui:'❄️',study:'📘',money:'👛',life:'🪭',rigong:'📔',invest:'💎',travel:'🕊️',fun:'🎐',files:'📜',toolbox:'🧰'} },
    { id:'genshin-yae', name:'原神八重神子', fullName:'小满则盈 · 八重神子', desc:'鸣神大社、樱夜与狐灵', icon:'🦊', mascot:'xiaoman', mascotFlow:'character', companion:'小八重神子', modeKey:'xiaomanMode', color:'#B34E83', preview:'design-concepts/genshin-yae-scene-v10.png', mascotThumb:'design-concepts/mascot-v10-yae.png', mascotAssets:{sleep:'design-concepts/mascot-v10-yae.png',rub:'design-concepts/mascot-v10-yae-react.png',peek:'design-concepts/mascot-v10-yae-open.png'}, navIcons:{home:'⛩️',settings:'🦊'}, moduleIcons:{discipline:'⛩️',kitchen:'🍡',jikui:'🌸',study:'📚',money:'👛',life:'🏮',rigong:'🦊',invest:'🔮',travel:'🧭',fun:'📖',files:'📜',toolbox:'🪄'} },
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
    document.documentElement.dataset.skin = active.id.startsWith('maple-') || active.id.startsWith('genshin-') ? 'adventure' : 'soft';
    document.documentElement.dataset.mascotFlow = active.mascotFlow || 'sleep';
    document.documentElement.style.setProperty('--theme-color', active.color);
    document.documentElement.style.setProperty('--theme-art', active.preview ? `url("${assetUrl(active.preview)}")` : 'none');
    document.title = active.fullName;
    setLabel('.topbar-app-name', active.fullName);
    setLabel('.dh-title', active.fullName);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = active.color;
    const homeButton = document.getElementById('menu-toggle');
    const settingsButton = document.getElementById('tb-gear');
    if (homeButton) homeButton.textContent = active.navIcons?.home || '🏠';
    if (settingsButton) settingsButton.textContent = active.navIcons?.settings || '⚙️';
    const doll = document.getElementById('xm-doll');
    if (doll) doll.setAttribute('aria-label', `${active.companion || '小满'}吉祥物`);
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
    return `<div class="theme-picker">${THEMES.map(t => `<button type="button" class="theme-choice ${t.id===selectedId?'active':''}" data-theme-choice="${t.id}" aria-pressed="${t.id===selectedId?'true':'false'}" style="--choice-color:${t.color}">
      <span class="theme-choice-preview">${t.mascotThumb?`<img src="${assetUrl(t.mascotThumb)}" alt="${t.companion||t.name}">`:`<i>${t.icon}</i>`}</span>
      <b>${t.name}</b><small>${t.desc}</small>
    </button>`).join('')}</div>`;
  }

  function modeKeyFor(id) { return (MAP[id] || MAP.xiaoman).modeKey || ''; }
  function companionName(id) {
    const t = MAP[id] || current();
    return t.companion || (t.mascot === 'xmer' ? '猫猫' : '小满');
  }

  function iconFor(moduleId, fallback) {
    return current().moduleIcons?.[moduleId] || fallback;
  }

  function initMascot() {
    const t = current(), wrap = document.getElementById('xiaoman-wrap');
    if (t.mascot === 'xmer' && typeof XmerMascot !== 'undefined') {
      const sleep=document.getElementById('xm-img-sleep'),rub=document.getElementById('xm-img-rubbing'),peek=document.getElementById('xm-img-peek');
      sleep.src = 'images/xmer/xmer-sleeping.png?v=1'; rub.src = 'images/xmer/xmer-rubbing.png?v=1'; peek.src = 'images/xmer/xmer-peek.png?v=1';
      sleep.alt = rub.alt = peek.alt = 'Xmer 猫猫';
      XmerMascot.init();
    } else if (t.mascot === 'xiaoman' && typeof Xiaoman !== 'undefined') {
      const sleep=document.getElementById('xm-img-sleep'),rub=document.getElementById('xm-img-rubbing'),peek=document.getElementById('xm-img-peek');
      const assets=t.mascotAssets||{};
      sleep.src=assetUrl(assets.sleep||'images/xiaoman-sleeping.png');rub.src=assetUrl(assets.rub||'images/xiaoman-rubbing.png');peek.src=assetUrl(assets.peek||'images/xiaoman-peek.png');
      sleep.alt=rub.alt=peek.alt=t.companion||'小满';
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

  return { init, apply, current, renderHeroDecoration, renderPicker, modeKeyFor, companionName, iconFor, initMascot, applyMode, celebrate, themes:THEMES };
})();
