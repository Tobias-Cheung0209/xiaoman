/* ============================================================
 * 配置中心（V3）：模块、字段、名言库、股票自选
 * group: 'work' => 蓝色系（工作 / 自律·成长 / 核心）
 *        'life' => 红色系（生活 / 旅行 / 娱乐 / 文件区）
 * 字段类型：text/textarea/number/date/select/checkbox/multicheck/image
 * tab.collection：多 Tab 共享同一 Store 集合（覆盖 tab.id）
 * tab.special：特例渲染标识（对应 app.js 渲染函数）
 * ============================================================ */

const APP_NAME = '小满';

/* 励志名言（古体诗文 / 格言为主，每日轮换，可手动刷新） */
const QUOTES = [
  { t: '日拱一卒无有尽，功不唐捐终入海。', a: '古风' },
  { t: '功不唐捐，玉汝于成。', a: '古语' },
  { t: '天将降大任于是人也，必先苦其心志，劳其筋骨。', a: '孟子' },
  { t: '路漫漫其修远兮，吾将上下而求索。', a: '屈原' },
  { t: '不积跬步，无以至千里；不积小流，无以成江海。', a: '荀子' },
  { t: '锲而不舍，金石可镂。', a: '荀子' },
  { t: '青，取之于蓝，而青于蓝；冰，水为之，而寒于水。', a: '荀子' },
  { t: '古之立大事者，不惟有超世之才，亦必有坚忍不拔之志。', a: '苏轼' },
  { t: '博观而约取，厚积而薄发。', a: '苏轼' },
  { t: '粗缯大布裹生涯，腹有诗书气自华。', a: '苏轼' },
  { t: '业精于勤，荒于嬉；行成于思，毁于随。', a: '韩愈' },
  { t: '宝剑锋从磨砺出，梅花香自苦寒来。', a: '《警世贤文》' },
  { t: '长风破浪会有时，直挂云帆济沧海。', a: '李白' },
  { t: '大鹏一日同风起，扶摇直上九万里。', a: '李白' },
  { t: '千磨万击还坚劲，任尔东西南北风。', a: '郑燮' },
  { t: '咬定青山不放松，立根原在破岩中。', a: '郑燮' },
  { t: '会当凌绝顶，一览众山小。', a: '杜甫' },
  { t: '读书破万卷，下笔如有神。', a: '杜甫' },
  { t: '纸上得来终觉浅，绝知此事要躬行。', a: '陆游' },
  { t: '三更灯火五更鸡，正是男儿读书时。', a: '颜真卿' },
  { t: '黑发不知勤学早，白首方悔读书迟。', a: '颜真卿' },
  { t: '莫道桑榆晚，为霞尚满天。', a: '刘禹锡' },
  { t: '沉舟侧畔千帆过，病树前头万木春。', a: '刘禹锡' },
  { t: '不畏浮云遮望眼，自缘身在最高层。', a: '王安石' },
  { t: '老骥伏枥，志在千里；烈士暮年，壮心不已。', a: '曹操' },
  { t: '非淡泊无以明志，非宁静无以致远。', a: '诸葛亮' },
  { t: '士不可以不弘毅，任重而道远。', a: '《论语》' },
  { t: '学而不思则罔，思而不学则殆。', a: '《论语》' },
  { t: '岁寒，然后知松柏之后凋也。', a: '《论语》' },
  { t: '博学之，审问之，慎思之，明辨之，笃行之。', a: '《礼记》' },
  { t: '操千曲而后晓声，观千剑而后识器。', a: '刘勰' },
  { t: '精诚所至，金石为开。', a: '《后汉书》' },
  { t: '有志者事竟成。', a: '《后汉书》' },
  { t: '少壮不努力，老大徒伤悲。', a: '《汉乐府》' },
  { t: '穷且益坚，不坠青云之志。', a: '王勃' },
  { t: '莫等闲，白了少年头，空悲切。', a: '岳飞' },
  { t: '苟利国家生死以，岂因祸福避趋之。', a: '林则徐' },
];

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

/* ============================================================
 * V3 模块定义
 * ============================================================ */
const MODULES = [
  /* ---- 首页 ---- */
  {
    id: 'home', name: '首页', icon: '🏠', group: 'work', render: 'home',
    desc: '今日总览',
  },

  /* ---- 积跬（工作·蓝，独立不并入） ---- */
  {
    id: 'jikui', name: '积跬', icon: '🌱', group: 'work', render: 'tabs',
    desc: '公司事务 · 独立',
    tabs: [
      {
        id: 'todos', name: '公司待办', type: 'list', special: 'jikuiTodos',
        fields: [
          { key: 'item', label: '事项', type: 'text', required: true },
          { key: 'due', label: '截止日', type: 'date' },
          { key: 'priority', label: '优先级', type: 'select', options: ['高', '中', '低'], def: '中' },
          { key: 'status', label: '状态', type: 'select', options: ['待办', '进行', '完成'], def: '待办' },
        ],
      },
      {
        id: 'docs', name: '文档收集', type: 'list',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'type', label: '类型', type: 'select', options: ['执照', '章程', '税务', '合同', '发票', '记账'], def: '合同' },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'filelink', label: '文件链接/路径', type: 'text' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
    ],
  },

  /* ---- 学习专区（工作·蓝） ---- */
  {
    id: 'study', name: '学习专区', icon: '📚', group: 'work', render: 'tabs',
    desc: '下班后 · 股票/摄影/音乐',
    tabs: [
      {
        id: 'today', name: '今日内容', type: 'list', collection: 'studyTasks', special: 'studyToday',
        fields: [
          { key: 'topic', label: '主题', type: 'select', options: ['股票', '摄影', '音乐', '其他'], def: '股票' },
          { key: 'goal', label: '今日目标', type: 'textarea' },
          { key: 'summary', label: '学习小结', type: 'textarea', ph: '3-2-1 法 → ① 3 个收获 ② 2 个疑问 ③ 1 个行动' },
          { key: 'ref', label: '资料参考', type: 'text' },
          { key: 'duration', label: '时长(分)', type: 'number' },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: ['计划', '进行中', '已完成'], def: '计划' },
        ],
      },
      {
        id: 'history', name: '历史记录', type: 'list', collection: 'studyTasks', special: 'studyHistory',
        fields: [
          { key: 'topic', label: '主题', type: 'select', options: ['股票', '摄影', '音乐', '其他'], def: '股票' },
          { key: 'goal', label: '今日目标', type: 'textarea' },
          { key: 'summary', label: '学习小结', type: 'textarea', ph: '3-2-1 法 → ① 3 个收获 ② 2 个疑问 ③ 1 个行动' },
          { key: 'ref', label: '资料参考', type: 'text' },
          { key: 'duration', label: '时长(分)', type: 'number' },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: ['计划', '进行中', '已完成'], def: '计划' },
        ],
      },
    ],
  },

  /* ---- 生活（生活·红，原「生活购物」改名+整合） ---- */
  {
    id: 'life', name: '生活', icon: '🌸', group: 'life', render: 'tabs',
    desc: '购物 · 纪念日 · 家居 · 礼物',
    tabs: [
      {
        id: 'items', name: '购物清单', type: 'list', collection: 'items', special: 'shopping',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'cat', label: '分类', type: 'select', options: ['护肤', '数码', '家居', '服饰', '食品', '其他'], def: '其他' },
          { key: 'price', label: '预估价', type: 'number' },
          { key: 'buyLink', label: '购买链接', type: 'text' },
          { key: 'priority', label: '优先级', type: 'select', options: ['必买', '想要'], def: '想要' },
          { key: 'status', label: '状态', type: 'select', options: ['未买', '已买', '已取消'], def: '未买' },
          { key: 'qty', label: '数量', type: 'number', def: 1 },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'budget', name: '收支情况', type: 'budget', currency: '€',
      },
      {
        id: 'events', name: '纪念日', type: 'list', collection: 'events', special: 'eventsCard',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'type', label: '类型', type: 'select', options: ['生日', '恋爱', '家人生日', '重要日期'], def: '生日' },
          { key: 'repeatYearly', label: '每年重复', type: 'checkbox' },
          { key: 'remindDays', label: '提前提醒(天)', type: 'number', def: 0 },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'homeTodos', name: '家居待办', type: 'filter', source: 'lifeTodos', domains: ['生活', '家务'],
        fields: [
          { key: 'item', label: '事项', type: 'text', required: true },
          { key: 'domain', label: '领域', type: 'select', options: ['生活', '家务', '其他'], def: '家务' },
          { key: 'due', label: '截止日', type: 'date' },
          { key: 'priority', label: '优先级', type: 'select', options: ['高', '中', '低'], def: '中' },
          { key: 'status', label: '状态', type: 'select', options: ['待办', '完成'], def: '待办' },
        ],
      },
      {
        id: 'gifts', name: '礼物计划', type: 'list', collection: 'gifts',
        fields: [
          { key: 'to', label: '送给谁', type: 'text', required: true },
          { key: 'idea', label: '想法', type: 'textarea' },
          { key: 'budget', label: '预算', type: 'number' },
          { key: 'bought', label: '购买状态', type: 'select', options: ['未买', '已买'], def: '未买' },
          { key: 'linkEvent', label: '关联纪念日', type: 'text' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'sizes', name: '尺寸档案', type: 'list', collection: 'sizes',
        fields: [
          { key: 'part', label: '部位', type: 'select', options: ['衣', '鞋', '戒指', '裤', '其他'], def: '衣' },
          { key: 'size', label: '尺寸', type: 'text', required: true },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
    ],
  },

  /* ---- 旅行（生活·红） ---- */
  {
    id: 'travel', name: '旅行', icon: '✈️', group: 'life', render: 'tabs',
    desc: '打卡清单 · 飞书攻略',
    tabs: [
      {
        id: 'destinations', name: '目的地', type: 'list', collection: 'destinations', special: 'travelDest',
        fields: [
          { key: 'city', label: '城市/国家', type: 'text', required: true },
          { key: 'thumb', label: '缩略图(url)', type: 'text' },
          { key: 'status', label: '状态', type: 'select', options: ['待打卡', '已打卡'], def: '待打卡' },
          { key: 'spots', label: '必打卡景点', type: 'textarea' },
          { key: 'ticket', label: '票价', type: 'text' },
          { key: 'transport', label: '交通', type: 'text' },
          { key: 'food', label: '美食', type: 'text' },
          { key: 'goDate', label: '出行日期', type: 'date' },
          { key: 'budget', label: '预算', type: 'number' },
          { key: 'feishu', label: '完整攻略(飞书链接)', type: 'text' },
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
          { key: 'platform', label: '平台', type: 'select', options: ['Netflix', 'B站', 'PS5', 'Steam', '其他'], def: '其他' },
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
    desc: '待办 · 日历 · 习惯 · 运动 · 形象',
    tabs: [
      {
        id: 'lifeTodos', name: '每日待办', type: 'list', collection: 'lifeTodos', special: 'lifeTodos',
        fields: [
          { key: 'item', label: '事项', type: 'text', required: true },
          { key: 'domain', label: '领域', type: 'select', options: ['生活', '家务', '其他'], def: '生活' },
          { key: 'due', label: '截止日', type: 'date' },
          { key: 'priority', label: '优先级', type: 'select', options: ['高', '中', '低'], def: '中' },
          { key: 'status', label: '状态', type: 'select', options: ['待办', '完成'], def: '待办' },
        ],
      },
      {
        id: 'calendar', name: '日历计划', type: 'list', collection: 'calendarPlans',
        fields: [
          { key: 'title', label: '标题', type: 'text', required: true },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'time', label: '时间', type: 'text' },
          { key: 'note', label: '备注', type: 'textarea' },
          { key: 'status', label: '状态', type: 'select', options: ['计划', '进行', '完成'], def: '计划' },
        ],
      },
      {
        id: 'habits', name: '习惯热力', type: 'list', collection: 'habitLogs', special: 'habits',
        fields: [
          { key: 'habit', label: '习惯', type: 'select', options: ['看书', '早睡早起', '运动打卡', '学习', '其他'], def: '看书' },
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'fitDaily', name: '运动打卡', type: 'list', collection: 'daily', special: 'fitnessDaily',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'item', label: '运动项目', type: 'text', required: true },
          { key: 'duration', label: '时长(分)', type: 'number' },
          { key: 'calories', label: '消耗(kcal)', type: 'number' },
          { key: 'done', label: '完成', type: 'checkbox' },
          { key: 'photo', label: '运动照', type: 'image' },
        ],
      },
      {
        id: 'fitPlan', name: '明日提醒', type: 'list', collection: 'plan',
        fields: [
          { key: 'date', label: '计划日', type: 'date', required: true },
          { key: 'plan', label: '计划内容', type: 'text', required: true },
          { key: 'durationGoal', label: '时长目标(分)', type: 'number' },
        ],
      },
      {
        id: 'fitDiet', name: '减脂饮食', type: 'list', collection: 'diet',
        fields: [
          { key: 'meal', label: '餐次', type: 'select', options: ['早餐', '午餐', '晚餐', '加餐'], def: '早餐' },
          { key: 'food', label: '食物', type: 'text', required: true },
          { key: 'calories', label: '热量(kcal)', type: 'number' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'skincare', name: '护肤打卡', type: 'list', collection: 'skincare',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'morningC', label: '早C', type: 'checkbox' },
          { key: 'nightA', label: '晚A', type: 'checkbox' },
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
          { key: 'bodyfat', label: '体脂(%)', type: 'number' },
          { key: 'goal', label: '目标体重', type: 'number' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
    ],
  },

  /* ---- 日拱一卒（自律·成长·蓝，方案 B） ---- */
  {
    id: 'rigong', name: '日拱一卒', icon: '📖', group: 'work', render: 'tabs',
    desc: '拱卒热力 · 今日一得',
    tabs: [
      {
        id: 'overview', name: '进度', type: 'list', special: 'rigongOverview',
        fields: [],
      },
      {
        id: 'diary', name: '今日一得', type: 'list', collection: 'rigongLogs',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'note', label: '今日一得', type: 'textarea', ph: '3-2-1 法 → ① 3 个收获 ② 2 个疑问 ③ 1 个行动' },
          { key: 'source', label: '来源标记', type: 'text' },
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
        id: 'assets', name: '资产', type: 'list', collection: 'moneyAssets',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'type', label: '类型', type: 'select', options: ['现金', '储蓄', '投资', '其他'], def: '储蓄' },
          { key: 'amount', label: '金额', type: 'number', required: true },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'invest', name: '投资市值', type: 'list', collection: 'moneyInvest',
        fields: [
          { key: 'code', label: '代码', type: 'text' },
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'qty', label: '数量', type: 'number' },
          { key: 'cost', label: '成本', type: 'number' },
          { key: 'price', label: '现价', type: 'number' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'flows', name: '收支流水', type: 'list', collection: 'flows', special: 'moneyFlows',
        fields: [
          { key: 'account', label: '账户', type: 'text' },
          { key: 'currency', label: '币种', type: 'select', options: ['€', '$', '¥'], def: '€' },
          { key: 'direction', label: '方向', type: 'select', options: ['收入', '支出'], def: '支出' },
          { key: 'category', label: '分类', type: 'select', options: ['工资', '日常开销', '购物', '娱乐支出', '股票', '理财', '订阅', '其他'], def: '日常开销' },
          { key: 'amount', label: '金额', type: 'number', required: true },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
      {
        id: 'budget', name: '预算', type: 'list', collection: 'moneyBudget',
        fields: [
          { key: 'cat', label: '分类', type: 'text', required: true },
          { key: 'monthlyLimit', label: '月度上限', type: 'number', required: true },
        ],
      },
      {
        id: 'goals', name: '储蓄目标', type: 'list', collection: 'moneyGoals', special: 'moneyGoals',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'target', label: '目标', type: 'number', required: true },
          { key: 'current', label: '已存', type: 'number', def: 0 },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'subs', name: '固定支出/订阅', type: 'list', collection: 'moneySubs',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'amount', label: '金额', type: 'number', required: true },
          { key: 'cycle', label: '周期', type: 'select', options: ['月', '年', '周'], def: '月' },
          { key: 'nextDate', label: '下次日期', type: 'date' },
          { key: 'method', label: '支付方式', type: 'text' },
        ],
      },
    ],
  },

  /* ---- 工具箱（核心·蓝，原「其它工具」改名） ---- */
  {
    id: 'toolbox', name: '工具箱', icon: '🧰', group: 'work', render: 'tabs',
    desc: '通讯录 · 我们❤️ · 经期',
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
        id: 'women', name: '我们❤️', type: 'list', collection: 'women',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'item', label: '项目', type: 'select', options: ['经期', '同房', '其它'], def: '经期' },
          { key: 'flow', label: '流量', type: 'select', options: ['多', '中', '少', '—'], def: '—' },
          { key: 'symptom', label: '症状', type: 'text' },
          { key: 'mood', label: '心情', type: 'select', options: ['平静', '愉悦', '烦躁', '低落', '其他'], def: '平静' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
      {
        id: 'womenSettings', name: '经期设置', type: 'settings',
        fields: [
          { key: 'cycleStart', label: '上次开始日', type: 'date' },
          { key: 'cycleLen', label: '周期长度(天)', type: 'number', def: 28 },
          { key: 'remind', label: '提前提醒', type: 'checkbox' },
        ],
      },
    ],
  },
];

/* 便于按 id 查模块 */
const MODULE_MAP = {};
MODULES.forEach(m => { MODULE_MAP[m.id] = m; });
