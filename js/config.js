/* ============================================================
 * 配置中心：模块、字段、名言库、股票自选
 * group: 'work' => 蓝色系（打工相关）
 *        'life' => 红色系（生活相关）
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

/* 字段类型：text/textarea/number/date/select/checkbox/multicheck/image */
const MODULES = [
  {
    id: 'home', name: '首页', icon: '🏠', group: 'work', render: 'home',
    desc: '今日总览',
  },
  {
    id: 'shopping', name: '购物', icon: '🛒', group: 'life', render: 'tabs',
    tabs: [
      {
        id: 'items', name: '清单', type: 'list',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'cat', label: '分类', type: 'select', options: ['宿舍', '文具', '护肤', '数码', '其他'] },
          { key: 'price', label: '预估价格', type: 'number' },
          { key: 'qty', label: '数量', type: 'number', def: 1 },
          { key: 'priority', label: '优先级', type: 'select', options: ['必买', '想要'] },
          { key: 'done', label: '状态', type: 'select', options: ['未买', '已买'], def: '未买' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      { id: 'budget', name: '预算', type: 'budget', currency: '€' },
    ],
  },
  {
    id: 'study', name: '学习专区', icon: '📚', group: 'work', render: 'tabs',
    tabs: [
      {
        id: 'courses', name: '课程资料', type: 'list',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'type', label: '类型', type: 'select', options: ['网课', '书', '笔记'] },
          { key: 'progress', label: '进度(%)', type: 'number' },
          { key: 'due', label: '截止日', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: ['进行', '完成'], def: '进行' },
          { key: 'link', label: '链接', type: 'text' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'money', name: '资金管理', icon: '💶', group: 'work', render: 'tabs',
    tabs: [
      {
        id: 'flows', name: '收支流水', type: 'list',
        fields: [
          { key: 'account', label: '账户', type: 'text' },
          { key: 'currency', label: '币种', type: 'select', options: ['€', '$', '¥'], def: '€' },
          { key: 'direction', label: '方向', type: 'select', options: ['收入', '支出'], def: '支出' },
          { key: 'category', label: '分类', type: 'select', options: ['工资', '日常开销', '股票', '理财', '其他'], def: '日常开销' },
          { key: 'amount', label: '金额', type: 'number', required: true },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'travel', name: '旅行', icon: '✈️', group: 'life', render: 'tabs',
    tabs: [
      {
        id: 'destinations', name: '目的地', type: 'list',
        fields: [
          { key: 'city', label: '城市/国家', type: 'text', required: true },
          { key: 'want', label: '状态', type: 'select', options: ['想去', '去过'], def: '想去' },
          { key: 'rating', label: '想去指数', type: 'number' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
      {
        id: 'plans', name: '旅行计划', type: 'list',
        fields: [
          { key: 'name', label: '行程名', type: 'text', required: true },
          { key: 'place', label: '地点', type: 'text' },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'transport', label: '交通', type: 'text' },
          { key: 'hotel', label: '住宿', type: 'text' },
          { key: 'budget', label: '预算', type: 'number' },
          { key: 'status', label: '状态', type: 'select', options: ['计划', '进行', '完成'], def: '计划' },
        ],
      },
      {
        id: 'foods', name: '美食推荐', type: 'list',
        fields: [
          { key: 'shop', label: '店名', type: 'text', required: true },
          { key: 'city', label: '城市', type: 'text' },
          { key: 'cuisine', label: '菜系', type: 'select', options: ['中餐', '日料', '西餐', '其他'] },
          { key: 'reason', label: '推荐理由', type: 'textarea' },
          { key: 'status', label: '状态', type: 'select', options: ['想吃', '吃过'], def: '想吃' },
        ],
      },
    ],
  },
  {
    id: 'rigong', name: '日拱一卒', icon: '📖', group: 'work', render: 'tabs',
    tabs: [
      {
        id: 'books', name: '看书记录', type: 'list',
        fields: [
          { key: 'title', label: '书名', type: 'text', required: true },
          { key: 'author', label: '作者', type: 'text' },
          { key: 'progress', label: '进度(页/%)', type: 'text' },
          { key: 'start', label: '开始日', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: ['在读', '读完'], def: '在读' },
          { key: 'rating', label: '评分', type: 'number' },
          { key: 'note', label: '笔记', type: 'textarea' },
        ],
      },
      {
        id: 'studylog', name: '学习记录', type: 'list',
        fields: [
          { key: 'topic', label: '主题', type: 'text', required: true },
          { key: 'duration', label: '时长(分)', type: 'number' },
          { key: 'date', label: '日期', type: 'date' },
          { key: 'content', label: '内容', type: 'textarea' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'files', name: '文件区', icon: '🗂️', group: 'work', render: 'tabs',
    tabs: [
      {
        id: 'files', name: '我的文件', type: 'list',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'category', label: '分类', type: 'select', options: ['证件', '财务', '学习', '工作', '图片'], def: '证件' },
          { key: 'uploaddate', label: '上传日', type: 'date' },
          { key: 'filelink', label: '文件链接/路径', type: 'text' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'jikui', name: '积跬', icon: '🌱', group: 'work', render: 'tabs',
    tabs: [
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
      {
        id: 'todos', name: '公司待办', type: 'list',
        fields: [
          { key: 'item', label: '事项', type: 'text', required: true },
          { key: 'due', label: '截止日', type: 'date' },
          { key: 'priority', label: '优先级', type: 'select', options: ['高', '中', '低'], def: '中' },
          { key: 'status', label: '状态', type: 'select', options: ['待办', '进行', '完成'], def: '待办' },
        ],
      },
    ],
  },
  {
    id: 'image', name: '形象管理', icon: '💄', group: 'life', render: 'tabs',
    tabs: [
      {
        id: 'skincare', name: '护肤打卡', type: 'list',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'morningC', label: '早C', type: 'checkbox' },
          { key: 'nightA', label: '晚A', type: 'checkbox' },
          { key: 'conditions', label: '皮肤状态(可多选)', type: 'multicheck', options: ['干燥', '出油', '痘痘', '敏感', '好'] },
          { key: 'photo', label: '照片', type: 'image' },
          { key: 'note', label: '笔记', type: 'textarea' },
        ],
      },
      {
        id: 'weight', name: '体重记录', type: 'list', special: 'weight',
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
  {
    id: 'fitness', name: '运动健身', icon: '🏃', group: 'work', render: 'tabs',
    tabs: [
      {
        id: 'daily', name: '每日打卡', type: 'list', special: 'gallery',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'item', label: '运动项目', type: 'text', required: true },
          { key: 'duration', label: '时长(分)', type: 'number' },
          { key: 'calories', label: '消耗(kcal)', type: 'number' },
          { key: 'done', label: '完成', type: 'checkbox' },
          { key: 'photo', label: '运动对比照', type: 'image' },
        ],
      },
      {
        id: 'plan', name: '明日提醒', type: 'list',
        fields: [
          { key: 'date', label: '计划日', type: 'date', required: true },
          { key: 'plan', label: '计划内容', type: 'text', required: true },
          { key: 'durationGoal', label: '时长目标(分)', type: 'number' },
        ],
      },
      {
        id: 'diet', name: '减脂饮食', type: 'list',
        fields: [
          { key: 'meal', label: '餐次', type: 'select', options: ['早餐', '午餐', '晚餐', '加餐'], def: '早餐' },
          { key: 'food', label: '食物', type: 'text', required: true },
          { key: 'calories', label: '热量(kcal)', type: 'number' },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'fun', name: '娱乐', icon: '🎬', group: 'life', render: 'tabs',
    tabs: [
      {
        id: 'items', name: '想看/在玩', type: 'list',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'type', label: '类型', type: 'select', options: ['电影', '动漫', '游戏', '其他'], def: '电影' },
          { key: 'status', label: '状态', type: 'select', options: ['想看', '在看', '看完'], def: '想看' },
          { key: 'rating', label: '评分', type: 'number' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'tools', name: '其它工具', icon: '🧰', group: 'life', render: 'tabs',
    tabs: [
      {
        id: 'period', name: '生理期设置', type: 'settings',
        fields: [
          { key: 'cycleStart', label: '上次开始日', type: 'date' },
          { key: 'cycleLen', label: '周期长度(天)', type: 'number', def: 28 },
          { key: 'remind', label: '提前提醒', type: 'checkbox' },
        ],
      },
      {
        id: 'periodlog', name: '经期记录', type: 'list',
        fields: [
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'flow', label: '流量', type: 'select', options: ['多', '中', '少'], def: '中' },
          { key: 'symptom', label: '症状', type: 'text' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
      {
        id: 'events', name: '纪念日/生日', type: 'list',
        fields: [
          { key: 'name', label: '名称', type: 'text', required: true },
          { key: 'type', label: '类型', type: 'select', options: ['生日', '纪念日'], def: '生日' },
          { key: 'date', label: '日期', type: 'date', required: true },
          { key: 'remindDays', label: '提前提醒(天)', type: 'number', def: 0 },
          { key: 'note', label: '备注', type: 'text' },
        ],
      },
      {
        id: 'contacts', name: '朋友通讯录', type: 'list',
        fields: [
          { key: 'name', label: '姓名', type: 'text', required: true },
          { key: 'phone', label: '电话', type: 'text' },
          { key: 'address', label: '地址', type: 'text' },
          { key: 'relation', label: '关系', type: 'text' },
          { key: 'note', label: '备注', type: 'textarea' },
        ],
      },
    ],
  },
];

/* 便于按 id 查模块 */
const MODULE_MAP = {};
MODULES.forEach(m => { MODULE_MAP[m.id] = m; });
