// CampusShare Workspace — fallback/initial data.
// WS_USER is overridden by real API profile on mount (workspace-app.jsx).
// All list data starts empty; pages load real data via API.

window.WS_USER = {
  name: '同学',
  role: '',
  verified: false,
  letter: '用',
  stats: { posts: 0, sold: 0, rating: 0, points: 0 }
};

// ───── 我的发布 / My Posts ─────
window.WS_POSTS = [];

window.WS_POST_TABS = [
  { id: 'all', label: '全部', n: 0 },
  { id: 'live', label: '在售', n: 0 },
  { id: 'review', label: '审核中', n: 0 },
  { id: 'sold', label: '已售出', n: 0 },
  { id: 'draft', label: '草稿', n: 0 },
  { id: 'off', label: '已下架', n: 0 }
];

// ───── 订单中心 / Orders ─────
window.WS_ORDERS = [];

window.WS_ORDER_TABS = [
  { id: 'all', label: '全部', n: 0 },
  { id: 'pay', label: '待付款', n: 0 },
  { id: 'ship', label: '待发货', n: 0 },
  { id: 'meet', label: '待面交', n: 0 },
  { id: 'done', label: '已完成', n: 0 },
  { id: 'refund', label: '退款/售后', n: 0 }
];

window.WS_ORDER_STATUS = {
  pay: { label: '待付款', color: 'amber' },
  ship: { label: '待发货', color: 'amber' },
  meet: { label: '待面交', color: 'review' },
  done: { label: '已完成', color: 'live' },
  refund: { label: '退款中', color: 'sold' }
};

// ───── 消息通知 / Messages ─────
window.WS_MSG_CATS = [
  { id: 'all', label: '全部', icon: 'inbox', n: 0 },
  { id: 'chat', label: '私信', icon: 'forum', n: 0 },
  { id: 'order', label: '订单', icon: 'receipt_long', n: 0 },
  { id: 'team', label: '组队', icon: 'group_add', n: 0 },
  { id: 'system', label: '系统', icon: 'campaign', n: 0 }
];

window.WS_MESSAGES = [];

// ───── 收藏夹 / Favorites ─────
window.WS_FAV_TABS = [
  { id: 'all', label: '全部', n: 0 },
  { id: 'goods', label: '商品', n: 0 },
  { id: 'docs', label: '学习资料', n: 0 },
  { id: 'team', label: '组队招募', n: 0 }
];

window.WS_FAVS = [];
