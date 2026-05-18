// CampusShare Admin — mock data

window.ADM_USER = {
  name: '王老师',
  role: '平台运营 · 超级管理员',
  letter: '王',
  avatarC1: '#5b87c0', avatarC2: '#1e3a5f'
};

// ───── Sidebar ─────
window.ADM_NAV = [
  { id: 'overview',  label: '运营总览',  icon: 'dashboard' },
  { id: 'review',    label: '内容审核',  icon: 'fact_check', badge: '38', badgeKind: 'amber' },
  { id: 'reports',   label: '举报处理',  icon: 'report',     badge: '7',  badgeKind: 'red' },
  { id: 'users',     label: '用户管理',  icon: 'group' },
  { id: 'trades',    label: '交易监控',  icon: 'paid' },
  { id: 'stats',     label: '数据分析',  icon: 'insights' },
  { id: 'system',    label: '系统设置',  icon: 'tune' }
];

// ───── Overview KPIs ─────
window.ADM_KPIS = [
  { k: 'dau',     label: '今日活跃用户', value: '8,432',   delta: '+12.4%', up: true,  hint: '昨日 7,503', icon: 'group', tone: 'primary' },
  { k: 'new',     label: '今日新增内容', value: '264',     delta: '+8.6%',  up: true,  hint: '商品 142 / 资料 78 / 招募 44', icon: 'note_add', tone: 'green' },
  { k: 'pending', label: '待审核',       value: '38',      delta: '+15',    up: true,  hint: '其中 6 项超过 2h', icon: 'pending_actions', tone: 'amber' },
  { k: 'reports', label: '待处理举报',   value: '7',       delta: '+2',     up: true,  hint: '高优先级 2 条', icon: 'report', tone: 'rose' },
  { k: 'gmv',     label: '今日成交额',   value: '¥48,260', delta: '+22.1%', up: true,  hint: '订单 184 笔', icon: 'trending_up', tone: 'blue' }
];

// ───── 7-day activity (for SVG chart) ─────
window.ADM_TREND = [
  { d: '05-10', goods: 92,  notes: 48, team: 32, gmv: 32400 },
  { d: '05-11', goods: 108, notes: 56, team: 28, gmv: 36800 },
  { d: '05-12', goods: 124, notes: 62, team: 36, gmv: 41200 },
  { d: '05-13', goods: 96,  notes: 52, team: 22, gmv: 28600 },
  { d: '05-14', goods: 138, notes: 70, team: 40, gmv: 45800 },
  { d: '05-15', goods: 156, notes: 82, team: 38, gmv: 51200 },
  { d: '05-16', goods: 142, notes: 78, team: 44, gmv: 48260 }
];

// ───── Content review queue ─────
window.ADM_REVIEW_TABS = [
  { id: 'all',   label: '全部',   n: 38 },
  { id: 'goods', label: '商品',   n: 19 },
  { id: 'notes', label: '资料',   n: 11 },
  { id: 'team',  label: '招募',   n: 5 },
  { id: 'cmt',   label: '评论举报', n: 3 }
];

window.ADM_REVIEW_QUEUE = [
  {
    id: 'R-2026051609',
    kind: 'goods', kindLabel: '商品',
    title: '罗技 MX Keys 键盘 · 95新带原盒',
    desc: '自用 8 个月，背光正常，键帽无明显磨损，包装齐全可面交。',
    user: { name: '晓璐', school: '工学院 · 计科 22', letter: '晓', av1: '#ffd089', av2: '#f0a35a' },
    submittedAt: '14 分钟前', waited: '14m',
    flags: ['首次发布', '价格异常'], risk: 'low',
    price: '¥480', meta: '电子产品', ph: 'MX', c1: '#fda4af', c2: '#be123c'
  },
  {
    id: 'R-2026051608',
    kind: 'notes', kindLabel: '资料',
    title: '机器学习导论 · 全套手写笔记 + 思维导图（28 页）',
    desc: 'PDF · 12.4MB · 涵盖第 1–9 章，附 5 套历年真题解析。',
    user: { name: '陈同学', school: '工学院 · 软件 21', letter: '陈', av1: '#a8d5b0', av2: '#3f8c5c' },
    submittedAt: '32 分钟前', waited: '32m',
    flags: ['含真题资料'], risk: 'med',
    price: '¥18 / 200 积分', meta: '工学院 · 公选课', ph: 'ML', c1: '#c4b5fd', c2: '#7c3aed'
  },
  {
    id: 'R-2026051607',
    kind: 'team', kindLabel: '招募',
    title: '挑战杯参赛队 · 招后端 2 人 / 前端 1 人',
    desc: '研究方向：校园 AI 助手。要求大二及以上，每周至少 8h 投入，截止 5/30。',
    user: { name: '林同学', school: '商学院 · 信管 22', letter: '林', av1: '#9ec5e8', av2: '#5b87c0' },
    submittedAt: '1 小时前', waited: '1h',
    flags: [], risk: 'low',
    price: '校级比赛', meta: '科技竞赛', ph: '挑', c1: '#a7f3d0', c2: '#0a8a4f'
  },
  {
    id: 'R-2026051606',
    kind: 'goods', kindLabel: '商品',
    title: '宿舍冰箱 50L · 大三毕业转',
    desc: '大三毕业出，宿舍可用，制冷正常，西门交易。',
    user: { name: '张同学', school: '工学院 · 计科 21', letter: '张', av1: '#fda4af', av2: '#be123c' },
    submittedAt: '2 小时前', waited: '2h 12m',
    flags: ['超时未审'], risk: 'med',
    price: '¥260', meta: '宿舍家电', ph: '冰', c1: '#9ec5e8', c2: '#5b87c0'
  },
  {
    id: 'R-2026051605',
    kind: 'goods', kindLabel: '商品',
    title: 'iPhone 13 Pro · 256G · 远峰蓝',
    desc: '电池效率 89%，无划痕，原装配件齐全，仅限校内当面验机。',
    user: { name: '匿名用户#7821', school: '未认证学籍', letter: '?', av1: '#e2e8f0', av2: '#64748b' },
    submittedAt: '3 小时前', waited: '3h 04m',
    flags: ['未认证学籍', '高价值商品', '关键词命中'], risk: 'high',
    price: '¥3,280', meta: '电子产品', ph: 'iP', c1: '#e6cf94', c2: '#b88a3e'
  }
];

// ───── Reports queue ─────
window.ADM_REPORTS = [
  {
    id: 'RP-1024',
    severity: 'high',
    type: '虚假信息',
    targetKind: 'goods', target: 'iPhone 13 Pro · 256G',
    reporter: { name: '李同学', letter: '李' },
    reportedAt: '8 分钟前',
    desc: '商品图与详情页描述不一致，疑似翻新机。'
  },
  {
    id: 'RP-1023',
    severity: 'high',
    type: '辱骂他人',
    targetKind: 'cmt', target: '评论于「高数全套笔记」',
    reporter: { name: '陈同学', letter: '陈' },
    reportedAt: '26 分钟前',
    desc: '在评论区使用侮辱性词汇攻击其他用户。'
  },
  {
    id: 'RP-1022',
    severity: 'med',
    type: '内容重复',
    targetKind: 'notes', target: '操作系统笔记（重复 3 次）',
    reporter: { name: '系统自动', letter: 'S' },
    reportedAt: '1 小时前',
    desc: '该用户 24h 内重复发布 3 次相同资料。'
  },
  {
    id: 'RP-1021',
    severity: 'med',
    type: '价格异常',
    targetKind: 'goods', target: 'Apple Watch Ultra · 1 元',
    reporter: { name: '系统自动', letter: 'S' },
    reportedAt: '2 小时前',
    desc: '价格低于市场价 95%，可能为引流或诈骗。'
  },
  {
    id: 'RP-1020',
    severity: 'low',
    type: '违规招募',
    targetKind: 'team', target: '兼职日结 100/h 在家可做',
    reporter: { name: '王同学', letter: '王' },
    reportedAt: '昨天 22:14',
    desc: '疑似商业广告 / 兼职诈骗，不属于校内组队。'
  },
  {
    id: 'RP-1019',
    severity: 'low',
    type: '其他',
    targetKind: 'goods', target: '宿舍蓝牙音箱',
    reporter: { name: '赵同学', letter: '赵' },
    reportedAt: '昨天 18:42',
    desc: '描述与到手不符，已尝试与卖家协商无果。'
  },
  {
    id: 'RP-1018',
    severity: 'low',
    type: '其他',
    targetKind: 'cmt', target: '评论于「挑战杯参赛队」',
    reporter: { name: '林同学', letter: '林' },
    reportedAt: '昨天 14:08',
    desc: '在招募贴下骚扰询问无关私人信息。'
  }
];

// ───── User management ─────
window.ADM_USERS = [
  {
    id: 'U001', name: '晓璐', letter: '晓', av1: '#ffd089', av2: '#f0a35a',
    school: '工学院 · 计科 22', level: 'L4', verified: true,
    posts: 12, sold: 8, rating: 4.9, reports: 0,
    joined: '2024-09-01', status: 'active'
  },
  {
    id: 'U002', name: '陈同学', letter: '陈', av1: '#a8d5b0', av2: '#3f8c5c',
    school: '工学院 · 软件 21', level: 'L5', verified: true,
    posts: 28, sold: 22, rating: 4.8, reports: 1,
    joined: '2023-09-01', status: 'active'
  },
  {
    id: 'U003', name: '林同学', letter: '林', av1: '#9ec5e8', av2: '#5b87c0',
    school: '商学院 · 信管 22', level: 'L3', verified: true,
    posts: 6, sold: 4, rating: 5.0, reports: 0,
    joined: '2024-09-01', status: 'active'
  },
  {
    id: 'U004', name: '张同学', letter: '张', av1: '#fda4af', av2: '#be123c',
    school: '工学院 · 计科 21', level: 'L4', verified: true,
    posts: 18, sold: 12, rating: 4.6, reports: 2,
    joined: '2023-09-01', status: 'warned'
  },
  {
    id: 'U005', name: '匿名用户#7821', letter: '?', av1: '#e2e8f0', av2: '#64748b',
    school: '未认证学籍', level: 'L1', verified: false,
    posts: 1, sold: 0, rating: 0, reports: 3,
    joined: '2026-05-15', status: 'restricted'
  },
  {
    id: 'U006', name: '李同学', letter: '李', av1: '#c4b5fd', av2: '#7c3aed',
    school: '人文学院 · 中文 23', level: 'L2', verified: true,
    posts: 4, sold: 2, rating: 4.7, reports: 0,
    joined: '2025-09-01', status: 'active'
  },
  {
    id: 'U007', name: '王同学', letter: '王', av1: '#fcd34d', av2: '#b45309',
    school: '工学院 · 电信 22', level: 'L3', verified: true,
    posts: 9, sold: 5, rating: 4.5, reports: 0,
    joined: '2024-09-01', status: 'active'
  },
  {
    id: 'U008', name: '赵同学', letter: '赵', av1: '#a7f3d0', av2: '#0a8a4f',
    school: '理学院 · 数学 21', level: 'L4', verified: true,
    posts: 15, sold: 11, rating: 4.9, reports: 0,
    joined: '2023-09-01', status: 'active'
  }
];

// ───── Latest actions log ─────
window.ADM_LOG = [
  { who: '王老师',   act: '通过', target: '商品「iPad Air 4 · 64G」', t: '2 分钟前', kind: 'pass' },
  { who: '系统',     act: '自动拦截', target: '招募「日结兼职」(违规关键词)', t: '14 分钟前', kind: 'block' },
  { who: '王老师',   act: '驳回', target: '资料「考试答案 期末必看」', t: '32 分钟前', kind: 'reject' },
  { who: '李老师',   act: '警告用户', target: '@匿名用户#7821', t: '1 小时前', kind: 'warn' },
  { who: '王老师',   act: '通过', target: '资料「机器学习导论笔记」', t: '1 小时前', kind: 'pass' },
  { who: '系统',     act: '处理举报', target: 'RP-1019 已转人工', t: '2 小时前', kind: 'flag' },
  { who: '李老师',   act: '上架', target: '官方公告「期末交易高峰提示」', t: '今天 09:14', kind: 'pass' }
];
