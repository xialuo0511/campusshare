// CampusShare Admin — initial state (populated from real APIs at startup by LoadAdminConsoleData)

window.ADM_USER = { name: '-', role: '管理员', letter: '管', avatarC1: '#9ec5e8', avatarC2: '#5b87c0' };

window.ADM_NAV = [
  { id: 'overview', label: '运营总览',  icon: 'dashboard' },
  { id: 'review',   label: '内容审核',  icon: 'fact_check', badge: '', badgeKind: 'amber' },
  { id: 'reports',  label: '举报处理',  icon: 'report',     badge: '', badgeKind: 'red' },
  { id: 'users',    label: '用户管理',  icon: 'group' },
  { id: 'trades',   label: '交易监控',  icon: 'paid' },
  { id: 'stats',    label: '数据分析',  icon: 'insights' },
  { id: 'system',   label: '系统设置',  icon: 'tune' }
];

window.ADM_KPIS = [];
window.ADM_TREND = [];
window.ADM_REVIEW_TABS = [
  { id: 'all',   label: '全部',     n: 0 },
  { id: 'goods', label: '商品',     n: 0 },
  { id: 'notes', label: '资料',     n: 0 },
  { id: 'team',  label: '招募',     n: 0 },
  { id: 'cmt',   label: '评论举报', n: 0 }
];
window.ADM_REVIEW_QUEUE = [];
window.ADM_REPORTS = [];
window.ADM_USERS = [];
window.ADM_LOG = [];
window.ADM_OPS = null;
window.ADM_SUMMARY = null;
