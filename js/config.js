/* ============================================================
 * 配置中心（V3）：模块、字段、名言库、股票自选
 * group: 'work' => 蓝色系（工作 / 自律·成长 / 核心）
 *        'life' => 红色系（生活 / 旅行 / 娱乐 / 文件区）
 * 字段类型：text/textarea/number/date/select/selectOther/checkbox/multicheck/image
 *   selectOther：下拉含「其他」，选「其他」后下方出现文本框，可手写自定义值
 * tab.collection：多 Tab 共享同一 Store 集合（覆盖 tab.id）
 * tab.special：特例渲染标识（对应 app.js 渲染函数）
 * ============================================================ */

const APP_NAME = '小满则盈';

const MONEY_CURRENCIES = ['€', '$', '¥'];
const MONEY_CATEGORIES = ['工资', '副业', '奖金', '退款', '日常开销', '房租水电', '交通', '餐饮', '购物', '娱乐支出', '旅行', '医疗', '学习', '股票', '理财', '订阅', '税费', '跨境生活', '其他'];

/* 固定座右铭（不再轮换词库） */
const MOTTO = '日拱一卒无有尽，功不唐捐终入海。';

/* 状态灯配色（已定） */
const STATUS_COLORS = {
  '计划': '#fa60e0',   /* 粉紫 */
  '进行中': '#facc15', /* 黄 */
  '已完成': '#4ade80', /* 绿 */
};

/* 购物分类配色（v20） */
const SHOP_CAT_COLORS = {
  '护肤': '#FF9AB2',
  '数码': '#6EB8FF',
  '家居': '#9D8DF1',
  '服饰': '#FFB36B',
  '食品': '#7FD18A',
  '其他': '#B8C2D0',
};

/* 旅行状态（三态）与图钉配色 */
const TRAVEL_STATUS = ['想去', '计划中', '已打卡'];
const TRAVEL_PIN_COLOR = {
  '想去': '#fb923c',   /* 橙 */
  '计划中': '#3b82f6', /* 蓝 */
  '已打卡': '#4ade80', /* 绿 */
};

/* 股票自选：group cn/us 重点，jp/kr 其次，other 一笔带过 */
const STOCK_WATCH = [
  { symbol: '000001.SS', name: '上证', group: 'cn' },
  { symbol: '399001.SZ', name: '深证', group: 'cn' },
  { symbol: '000300.SS', name: '沪深300', group: 'cn' },
  { symbol: '^GSPC', name: '标普500', group: 'us' },
  { symbol: '^IXIC', name: '纳斯达克', group: 'us' },
  { symbol: '^DJI', name: '道琼斯', group: 'us' },
  { symbol: '^N225', name: '日经', group: 'jp' },
  { symbol: '^KS11', name: '韩国', group: 'kr' },
  { symbol: '^GDAXI', name: '德国DAX', group: 'other' },
];

const STATUS_TAGS = ['普通日', '专注日', '元气日', '松弛日', '疲惫日', '焦虑日'];

/* 小满吉祥物台词（安静温柔型，触发功能时随机说一句） */
const XIAOMAN_LINES = [
  '今天也要慢慢来呀',
  '小满未满，刚刚好',
  '想记点什么吗？我陪你',
  '你回来啦，今天过得还好吗',
  '累了就歇一歇，我在的',
  '日拱一卒，功不唐捐',
  '慢慢来，比较快',
  '记得喝水，也记得开心',
  '路还长，天总会亮',
  '把小事做好，就是了不起',
  '凡心所向，素履以往',
  '未满，才是刚刚好的状态',
  '有我在，别忘了重要的事哦',
  '要不要先记下这一件小事？',
  '今天有没有什么想和我说的呀',
];

/* ============================================================
 * V3 模块定义
 * ============================================================ */
const MODULES = [
  /* ---- 首页 ---- */
  {
    id: 'home', name: '首页', icon: '🏠', group: 'work', render: 'home',
    desc: '今日总览',
  },

  {
    id: 'calendar', name: '总览日历', icon: '📅', group: 'work', render: 'tabs',
    desc: '全部安排 · 一处看清',
    tabs: [
      { id: 'overview', name: '总览', type: 'list', special: 'globalCalendar', fields: [] },
    ],
  },

  /* ---- 积跬（工作·蓝，独立不并入） ---- */
  {
    id: 'jikui', name: '积跬', icon: '🌱', group: 'work', render: 'tabs',
    desc: '公司事务 · 独立',
    tabs: [
      { id: 'board', name: '看板', type: 'list', collection: 'todos', special: 'jikuiBoard', fields: [] },
      {
        id: 'todos', name: '公司待办', type: 'list', special: 'jikuiTodos',
        fields: [
          { key: 'item', label: '事项', type: 'text', required: true },
          { key: 'due', label: '截止日', type: 'date' },
          { key: 'priority', label: '优先级', type: 'select', options: ['高', '中', '低'], def: '中' },
          { key: 'status', label: '状态', type: 'select', options: ['待办', '进行', '完成'], def: '待办' },
        ],
      },
      { id: 'analyze', name: '统计分析', type: 'list', collection: 'todos', special: 'jikuiAnalyze', fields: [] },
      {
        id: 'docs', name: '文档索引', type: 'list',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'type', label: '类型', type: 'selectOther', options: ['执照', '章程', '税务', '合同', '发票', '记账', '报告', '资料'], def: '合同' },
          { key: 'status', label: '状态', type: 'select', options: ['待阅读', '待处理', '已归档'], def: '待处理' },
          { key: 'date', label: '收集日期', type: 'date' },
          { key: 'reviewDate', label: '复查日期', type: 'date' },
          { key: 'filelink', label: '云盘链接/本机路径', type: 'text', ph: '只保存索引，不上传 PDF 文件' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
    ],
  },

  /* ---- 学习区（工作·蓝，原「学习专区」改名） ---- */
  {
    id: 'study', name: '学习区', icon: '📚', group: 'work', render: 'tabs',
    desc: '下班后 · 股票/摄影/音乐',
    tabs: [
      {
        id: 'today', name: '今日内容', type: 'list', collection: 'studyTasks', special: 'studyToday',
        fields: [
          { key: 'topic', label: '主题', type: 'selectOther', options: ['股票', '摄影', '音乐', '其他'], def: '股票' },
          { key: 'goal', label: '今日目标', type: 'textarea' },
          { key: 'summary', label: '学习小结', type: 'textarea', ph: '3-2-1 法 → ① 3 个收获 ② 2 个疑问 ③ 1 个行动' },
          { key: 'ref', label: '资料参考', type: 'text' },
          { key: 'duration', label: '时长(小时)', type: 'number', ph: '如 1.5 表示 1.5 小时' },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'cycle', label: '周期', type: 'select', options: ['不重复', '每天', '每周1次', '每周2次', '每周3次'], def: '不重复' },
          { key: 'status', label: '状态', type: 'select', options: ['计划', '进行中', '已完成'], def: '计划' },
        ],
      },
      {
        id: 'books', name: '读书', type: 'list', collection: 'bookLogs',
        fields: [
          { key: 'book', label: '书名', type: 'text', required: true },
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'cycle', label: '周期', type: 'select', options: ['不重复', '每天', '每周1次', '每周2次', '每周3次'], def: '不重复' },
          { key: 'status', label: '状态', type: 'select', options: ['在读', '暂停', '读完'], def: '在读' },
          { key: 'progress', label: '阅读进度', type: 'text', ph: '如 120页 / 60%' },
          { key: 'note', label: '读书心得', type: 'textarea', ph: '写下一点收获即可' },
        ],
      },
      {
        id: 'history', name: '历史记录', type: 'list', collection: 'studyTasks', special: 'studyHistory',
        fields: [
          { key: 'topic', label: '主题', type: 'selectOther', options: ['股票', '摄影', '音乐', '其他'], def: '股票' },
          { key: 'goal', label: '今日目标', type: 'textarea' },
          { key: 'summary', label: '学习小结', type: 'textarea', ph: '3-2-1 法 → ① 3 个收获 ② 2 个疑问 ③ 1 个行动' },
          { key: 'ref', label: '资料参考', type: 'text' },
          { key: 'duration', label: '时长(小时)', type: 'number', ph: '如 1.5 表示 1.5 小时' },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'cycle', label: '周期', type: 'select', options: ['不重复', '每天', '每周1次', '每周2次', '每周3次'], def: '不重复' },
          { key: 'status', label: '状态', type: 'select', options: ['计划', '进行中', '已完成'], def: '计划' },
        ],
      },
    ],
  },

  /* ---- 生活（生活·红） ---- */
  {
    id: 'life', name: '生活', icon: '🌸', group: 'life', render: 'tabs',
    desc: '采购开销 · 清单 · 重要日子 · 居家 · 人物',
    tabs: [
      {
        id: 'expenses', name: '采购开销', type: 'list', collection: 'shoppingLists', special: 'procurement', fields: [],
      },
      {
        id: 'items', name: '购物清单', type: 'list', collection: 'items', special: 'shopping',
        fields: [],
      },
      {
        id: 'events', name: '重要日期', type: 'list', collection: 'events', special: 'eventsCard',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'type', label: '类型', type: 'selectOther', options: ['生日', '恋爱', '家人生日', '重要日期', '其他'], def: '生日' },
          { key: 'repeatCycle', label: '重复周期', type: 'select', options: ['不重复', '每日', '每周', '每月', '每年'], def: '每年' },
          { key: 'remindDays', label: '提前提醒(天)', type: 'number', def: 0 },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'homeThings', name: '居家事项', type: 'list', special: 'homeThings',
        fields: [],
      },
      {
        id: 'people', name: '人物档案', type: 'list', special: 'people',
        fields: [
          { key: 'name', label: '姓名', type: 'text', required: true },
          { key: 'relation', label: '关系', type: 'selectOther', options: ['我', '恋人', '家人', '朋友', '同事', '其他'], def: '朋友' },
          { key: 'height', label: '身高(cm)', type: 'text' },
          { key: 'weight', label: '体重(kg)', type: 'text' },
          { key: 'shoe', label: '鞋码', type: 'text' },
          { key: 'clothesSize', label: '衣物尺码', type: 'text' },
          { key: 'prefer', label: '偏好/禁忌', type: 'textarea', ph: '喜欢颜色/风格、材质过敏、尺码偏好等' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
    ],
  },

  /* ---- 旅行（生活·红） ---- */
  {
    id: 'travel', name: '旅行', icon: '✈️', group: 'life', render: 'tabs',
    desc: '打卡清单 · 旅行总览',
    tabs: [
      {
        id: 'overview', name: '旅行总览', type: 'list', special: 'travelOverview',
        fields: [],
      },
      {
        id: 'destinations', name: '目的地', type: 'list', collection: 'destinations', special: 'travelDest',
        fields: [
          { key: 'city', label: '城市/国家', type: 'text', required: true },
          { key: 'longitude', label: '经度（可选，无法识别时填写）', type: 'number', ph: '范围 -180 至 180' },
          { key: 'latitude', label: '纬度（可选）', type: 'number', ph: '范围 -90 至 90' },
          { key: 'status', label: '状态', type: 'select', options: ['想去', '计划中', '已打卡'], def: '想去' },
          { key: 'spots', label: '必打卡景点', type: 'textarea' },
          { key: 'food', label: '美食', type: 'text' },
          { key: 'goDate', label: '计划出行日期', type: 'date' },
          { key: 'travelDays', label: '旅行天数', type: 'number' },
          { key: 'budget', label: '预算', type: 'number' },
          { key: 'feishu', label: '详细攻略(链接)', type: 'text' },
        ],
      },
    ],
  },

  /* ---- 娱乐（生活·红） ---- */
  {
    id: 'fun', name: '娱乐', icon: '🎬', group: 'life', render: 'tabs',
    desc: '想看 · 随机推荐',
    tabs: [
      {
        id: 'items', name: '清单', type: 'list', collection: 'funItems', special: 'funList',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'cat', label: '分类', type: 'select', options: ['影视', '动漫', '游戏', '演出', '播客', '其他'], def: '影视' },
          { key: 'status', label: '状态', type: 'select', options: ['想看', '在看', '看完', '弃了'], def: '想看' },
          { key: 'rating', label: '评分', type: 'number' },
          { key: 'tags', label: '类型标签', type: 'multicheck', options: ['科幻', '悬疑', '治愈', '搞笑', '热血', '其他'] },
          { key: 'len', label: '时长/集数', type: 'text' },
          { key: 'review', label: '短评', type: 'textarea' },
          { key: 'date', label: '日期', type: 'date' },
        ],
      },
    ],
  },

  /* ---- 文件区（生活·红，文件/证件索引） ---- */
  {
    id: 'files', name: '文件区', icon: '🗂️', group: 'life', render: 'tabs',
    desc: '文件 / 证件索引',
    tabs: [
      {
        id: 'files', name: '我的文件', type: 'list', collection: 'files', special: 'filesIdx',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'cat', label: '分类', type: 'select', options: ['证件', '合同', '财务', '保单', '学习', '工作', '图片'], def: '证件' },
          { key: 'location', label: '存放位置', type: 'text' },
          { key: 'upload', label: '上传日', type: 'date' },
          { key: 'expire', label: '到期日', type: 'date' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
    ],
  },

  /* ---- 日程自律（自律·成长·蓝，合并运动/形象） ---- */
  {
    id: 'discipline', name: '日程自律', icon: '💪', group: 'work', render: 'tabs',
    desc: '待办 · 日历 · 运动 · 形象',
    tabs: [
      {
        id: 'plans', name: '计划', type: 'list', collection: 'plans', special: 'plans',
        fields: [
          { key: 'title', label: '标题', type: 'text', required: true },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'time', label: '时间', type: 'text' },
          { key: 'priority', label: '优先级', type: 'select', options: ['高', '中', '低'], def: '中' },
          { key: 'domain', label: '领域', type: 'select', options: ['生活', '家务', '工作', '学习', '其他'], def: '生活' },
          { key: 'repeat', label: '重复', type: 'select', options: ['不重复', '每天', '每周', '每月'], def: '不重复' },
          { key: 'note', label: '备注', type: 'textarea' },
          { key: 'status', label: '状态', type: 'select', options: ['计划', '进行', '完成'], def: '计划' },
        ],
      },
      {
        id: 'fitDaily', name: '运动打卡', type: 'list', collection: 'daily', special: 'fitnessDaily',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'item', label: '运动项目', type: 'text', required: true },
          { key: 'duration', label: '时长', type: 'text', ph: '如 30分钟 / 1.5小时' },
          { key: 'calories', label: '消耗(kcal)', type: 'number' },
          { key: 'done', label: '完成', type: 'checkbox' },
          { key: 'photo', label: '运动照', type: 'image' },
        ],
      },
      {
        id: 'fitDiet', name: '减脂饮食', type: 'list', collection: 'diet', special: 'fitDiet',
        fields: [
          { key: 'kind', label: '方案类型', type: 'select', options: ['固定减脂餐', '备选食谱'], def: '固定减脂餐' },
          { key: 'name', label: '方案名称', type: 'text', required: true },
          { key: 'meal', label: '餐次', type: 'select', options: ['早餐', '午餐', '晚餐', '加餐'], def: '早餐' },
          { key: 'food', label: '食材/组合', type: 'textarea' },
          { key: 'calories', label: '热量(kcal)', type: 'number' },
          { key: 'protein', label: '蛋白质(g)', type: 'number' },
          { key: 'minutes', label: '准备时间(分钟)', type: 'number' },
          { key: 'tags', label: '标签', type: 'multicheck', options: ['高蛋白', '低脂', '快手', '适合带饭', '中餐', '西餐'] },
          { key: 'link', label: '购买/参考链接', type: 'text' },
          { key: 'photo', label: '照片', type: 'image' },
          { key: 'note', label: '做法/备注', type: 'textarea' },
        ],
      },
      {
        id: 'skincare', name: '个人护理记录', type: 'list', collection: 'skincare', special: 'skincare',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'morning', label: '早间护理', type: 'multicheck', options: ['清洁', '补水', '烟酰胺', '维C', '日霜'], def: ['清洁', '补水', '烟酰胺', '维C', '日霜'] },
          { key: 'night', label: '晚间护理', type: 'multicheck', options: ['清洁', '面膜', '补水', 'A醇/去红斑', '夜霜'], def: ['清洁', '面膜', '补水', 'A醇/去红斑', '夜霜'] },
          { key: 'extra', label: '其他(手动录入)', type: 'text', ph: '如 二硫化硒洗头' },
          { key: 'conditions', label: '皮肤状态', type: 'multicheck', options: ['干燥', '出油', '痘痘', '敏感', '好'] },
          { key: 'photo', label: '照片', type: 'image' },
          { key: 'note', label: '笔记', type: 'textarea' },
        ],
      },
      {
        id: 'weight', name: '体重记录', type: 'list', collection: 'weight', special: 'weight',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'weight', label: '体重(kg)', type: 'number', required: true },
          { key: 'bodyfat', label: '体脂', type: 'text', ph: '可填 22.5% 或 高于25% 等' },
          { key: 'goal', label: '目标体重', type: 'number' },
          { key: 'photo', label: '每周体型照片（可选）', type: 'image' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
    ],
  },

  /* ---- 日拱一卒（自律·成长·蓝） ---- */
  {
    id: 'rigong', name: '日拱一卒', icon: '📖', group: 'work', render: 'tabs',
    desc: '每日回望 · 温柔收束',
    tabs: [
      {
        id: 'overview', name: '今日回望', type: 'list', special: 'rigongOverview',
        fields: [],
      },
      {
        id: 'diary', name: '往日记录', type: 'list', collection: 'rigongLogs',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'note', label: '今日回望', type: 'textarea', ph: '今天整体状态如何？工作学习是否努力、高效？有什么值得保持或调整？' },
          { key: 'tags', label: '状态标签', type: 'multicheck', options: ['努力', '高效', '有学习', '有锻炼', '饮食自律', '需要调整'] },
        ],
      },
    ],
  },

  /* ---- 资金管理（核心·蓝） ---- */
  {
    id: 'money', name: '资金管理', icon: '💶', group: 'work', render: 'tabs',
    desc: '资产 · 收支 · 预算 · 目标',
    tabs: [
      {
        id: 'overview', name: '总览', type: 'list', special: 'moneyOverview',
        fields: [],
      },
      {
        id: 'assets', name: '账户与资产', type: 'list', collection: 'moneyAssets', special: 'moneyAccounts',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'type', label: '类型', type: 'selectOther', options: ['现金', '储蓄', '投资', '其他'], def: '储蓄' },
          { key: 'owner', label: '资产归属', type: 'select', options: ['股市投资', '德国账户', '副业资金', '其他资产'], def: '德国账户' },
          { key: 'amount', label: '金额', type: 'number', required: true },
          { key: 'currency', label: '币种', type: 'select', options: MONEY_CURRENCIES, def: '€' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'flows', name: '收支流水', type: 'list', collection: 'flows', special: 'moneyFlows',
        fields: [
          { key: 'account', label: '账户', type: 'text' },
          { key: 'currency', label: '币种', type: 'select', options: MONEY_CURRENCIES, def: '€' },
          { key: 'direction', label: '方向', type: 'select', options: ['收入', '支出'], def: '支出' },
          { key: 'category', label: '分类', type: 'select', options: MONEY_CATEGORIES, def: '日常开销' },
          { key: 'categoryDetail', label: '其他明细', type: 'text' },
          { key: 'budgetStatus', label: '预算状态', type: 'select', options: ['自动匹配', '预算内', '预算外'], def: '自动匹配' },
          { key: 'amount', label: '金额', type: 'number', required: true },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
      {
        id: 'budget', name: '预算', type: 'list', collection: 'moneyBudget',
        fields: [
          { key: 'cat', label: '分类', type: 'select', options: ['总预算'].concat(MONEY_CATEGORIES), def: '总预算' },
          { key: 'limit', label: '预算上限', type: 'number', required: true },
          { key: 'currency', label: '币种', type: 'select', options: MONEY_CURRENCIES, def: '€' },
          { key: 'period', label: '周期', type: 'select', options: ['周', '月', '季', '年'], def: '月' },
        ],
      },
      {
        id: 'goals', name: '储蓄目标', type: 'list', collection: 'moneyGoals', special: 'moneyGoals',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'target', label: '目标', type: 'number', required: true },
          { key: 'current', label: '已存', type: 'number', def: 0 },
          { key: 'currency', label: '币种', type: 'select', options: MONEY_CURRENCIES, def: '€' },
          { key: 'deadline', label: '目标日期', type: 'date' },
          { key: 'goalType', label: '目标类型', type: 'selectOther', options: ['应急', '旅行', '购房', '学习', '其他'], def: '应急' },
          { key: 'priority', label: '优先级', type: 'select', options: ['高', '中', '低'], def: '中' },
          { key: 'status', label: '状态', type: 'select', options: ['进行中', '暂停', '已完成'], def: '进行中' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'subs', name: '固定支出/订阅', type: 'list', collection: 'moneySubs',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'amount', label: '金额', type: 'number', required: true },
          { key: 'currency', label: '币种', type: 'select', options: MONEY_CURRENCIES, def: '€' },
          { key: 'cycle', label: '周期', type: 'select', options: ['周', '月', '季', '年'], def: '月' },
          { key: 'nextDate', label: '下次日期', type: 'date' },
          { key: 'method', label: '支付方式', type: 'text' },
        ],
      },
    ],
  },

  {
    id: 'invest', name: '投资', icon: '📈', group: 'work', render: 'tabs', desc: '持仓 · 检查 · 复盘',
    tabs: [
      { id: 'overview', name: '总览', type: 'list', special: 'investOverview', fields: [] },
      { id: 'holdings', name: '持仓', type: 'list', collection: 'investHoldings', special: 'investHoldings', fields: [
        { key: 'name', label: '名称', type: 'text', required: true },
        { key: 'symbol', label: '代码', type: 'text', ph: '如 688981.SH / AAPL' },
        { key: 'market', label: '市场', type: 'selectOther', options: ['A股', '港股', '美股', '欧洲', '其他'], def: 'A股' },
        { key: 'quantity', label: '持仓数量', type: 'number' },
        { key: 'cost', label: '成本价', type: 'number' },
        { key: 'price', label: '当前价（手动）', type: 'number' },
        { key: 'riskPrice', label: '风险价', type: 'number' },
        { key: 'maxWeight', label: '仓位上限(%)', type: 'number' },
        { key: 'role', label: '组合角色', type: 'select', options: ['核心', '卫星', '观察'], def: '观察' },
        { key: 'thesis', label: '为什么持有', type: 'textarea' },
        { key: 'risks', label: '主要风险 / 证伪条件', type: 'textarea' },
        { key: 'reviewDate', label: '下次复核日期', type: 'date' },
        { key: 'status', label: '状态', type: 'select', options: ['持有', '观察', '已清仓'], def: '观察' },
      ] },
      { id: 'checks', name: '待检查', type: 'list', collection: 'investChecks', special: 'investChecks', fields: [
        { key: 'title', label: '检查事项', type: 'text', required: true },
        { key: 'symbol', label: '关联标的', type: 'text' },
        { key: 'date', label: '计划日期', type: 'date', required: true },
        { key: 'remindDays', label: '提前提醒(天)', type: 'number', def: 3 },
        { key: 'result', label: '检查结果', type: 'textarea' },
        { key: 'status', label: '状态', type: 'select', options: ['待检查', '已完成', '已归档'], def: '待检查' },
      ] },
      { id: 'logs', name: '投资日志', type: 'list', collection: 'stockLog', special: 'stockLog', fields: [
        { key: 'date', label: '日期', type: 'date', required: true },
        { key: 'type', label: '类型', type: 'select', options: ['复盘', '操作', '想法'], def: '复盘' },
        { key: 'symbol', label: '关联标的', type: 'text', ph: '如 中芯国际 / 688981.SH / AAPL' },
        { key: 'content', label: '内容', type: 'textarea', required: true, ph: '记录判断、依据、风险和下一步（不强制模板）' },
        { key: 'photo', label: '截图', type: 'image' },
      ] },
      { id: 'snapshots', name: '组合快照', type: 'list', collection: 'investSnapshots', fields: [
        { key: 'date', label: '日期', type: 'date', required: true },
        { key: 'value', label: '组合市值', type: 'number', required: true },
        { key: 'cost', label: '组合成本', type: 'number' },
        { key: 'note', label: '备注', type: 'text' },
      ] },
      { id: 'market', name: '全球行情', type: 'list', special: 'investMarket', fields: [] },
    ],
  },

  /* ---- 工具箱（核心·蓝） ---- */
  {
    id: 'toolbox', name: '工具箱', icon: '🧰', group: 'work', render: 'tabs',
    desc: '通讯录 · 柚子',
    tabs: [
      {
        id: 'contacts', name: '朋友通讯录', type: 'list', collection: 'contacts',
        fields: [
          { key: 'name', label: '姓名', type: 'text', required: true },
          { key: 'phone', label: '电话', type: 'text' },
          { key: 'address', label: '地址', type: 'text' },
          { key: 'relation', label: '关系', type: 'text' },
          { key: 'group', label: '分组', type: 'select', options: ['医生', '律师', '朋友', '其他'], def: '朋友' },
          { key: 'lastContact', label: '上次联系', type: 'date' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
      {
        id: 'youzi', name: '柚子', type: 'list', special: 'youzi',
        fields: [],
      },
    ],
  },
];

/* 便于按 id 查模块 */
const MODULE_MAP = {};
MODULES.forEach(m => { MODULE_MAP[m.id] = m; });
