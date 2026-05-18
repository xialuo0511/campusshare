// CampusShare Workspace — main shell, nav, sidebar, and page switcher.
// Adapted from workspace-export for project integration.

const { useState: useStateApp, useEffect: useEffectApp } = React;
const Api = window.CampusShareApi;

const WS_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#005d90",
  "density": "comfortable",
  "showPoints": true,
  "userName": "同学"
}/*EDITMODE-END*/;

const WS_PAGES = [
  { id: 'posts',    label: '我的发布', icon: 'format_list_bulleted', Comp: () => <MyPostsPage /> },
  { id: 'orders',   label: '订单中心', icon: 'receipt_long', Comp: () => <OrdersPage /> },
  { id: 'messages', label: '消息通知', icon: 'forum', badgeKind: 'red', Comp: () => <MessagesPage /> },
  { id: 'favs',     label: '收藏夹', icon: 'favorite', Comp: () => <FavoritesPage /> },
  { id: 'settings', label: '个人设置', icon: 'settings', Comp: () => <SettingsPage /> }
];

function goHome() {
  window.location.href = '/pages/market_overview.html';
}

// ─────────────────────────────────────────────────────────────
function TopNav({ activeId, userName, unreadCount }) {
  const here = WS_PAGES.find(p => p.id === activeId);
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand" onClick={goHome}>
          <div className="logo"><span className="material-symbols-outlined">school</span></div>
          <span className="name">CampusShare</span>
        </div>
        <div className="crumbs">
          <a onClick={goHome}>主页</a>
          <span className="material-symbols-outlined">chevron_right</span>
          <a>个人工作台</a>
          {here && (
            <>
              <span className="material-symbols-outlined">chevron_right</span>
              <span className="here">{here.label}</span>
            </>
          )}
        </div>
        <div className="nav-right">
          <button className="icon-btn" title="消息通知" onClick={() => window.location.href = '/pages/notification_center.html'}>
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && <span className="dot-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          <button className="primary-btn" onClick={() => window.location.href = '/pages/publish_center.html'}>
            <span className="material-symbols-outlined">add</span>
            发布
          </button>
          <button className="avatar-btn" title={userName}>{(userName || '同')[0]}</button>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
function WorkspaceRail({ activeId, onChange, showPoints, user, unreadCount, pendingOrders }) {
  const u = user || window.WS_USER;
  const pages = WS_PAGES.map(p => {
    if (p.id === 'messages') return { ...p, badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null };
    if (p.id === 'orders')   return { ...p, badge: pendingOrders > 0 ? String(pendingOrders) : null };
    return p;
  });

  return (
    <aside className="ws-rail">
      <div className="glass ws-profile">
        <div className="ws-prof-row">
          <div className="ws-avatar">{u.letter}</div>
          <div className="ws-prof-info">
            <div className="name">{u.name}</div>
            <div className="role">
              {u.verified && <span className="material-symbols-outlined">verified</span>}
              {u.role}
            </div>
          </div>
        </div>
        <div className="ws-mini-stats">
          <span><b>{u.stats.posts}</b>发布</span>
          <span><b>{u.stats.sold}</b>成交</span>
          <span><b>{u.stats.rating}</b>评分</span>
        </div>
      </div>

      <div className="glass ws-nav">
        {pages.map(p => (
          <button
            key={p.id}
            className={'ws-link' + (activeId === p.id ? ' active' : '')}
            onClick={() => onChange(p.id)}>
            <span className="material-symbols-outlined">{p.icon}</span>
            <span>{p.label}</span>
            {p.badge
              ? <span className={'badge' + (p.badgeKind === 'red' ? ' red' : '')}>{p.badge}</span>
              : <span />}
          </button>
        ))}
        <div className="ws-divider" />
        <div className="ws-label">快捷入口</div>
        <button className="ws-link" onClick={goHome}>
          <span className="material-symbols-outlined">home</span>
          <span>回到主页</span>
          <span />
        </button>
        <button className="ws-link" onClick={() => Api && Api.LogoutAndRedirect && Api.LogoutAndRedirect()}>
          <span className="material-symbols-outlined" style={{color:'var(--rose)'}}>logout</span>
          <span style={{color:'var(--rose)'}}>退出登录</span>
          <span />
        </button>
      </div>

      {showPoints && (
        <div className="glass" style={{padding: 16}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color:'var(--cs-muted-2)', textTransform: 'uppercase'}}>积分</div>
              <div style={{fontFamily:'Manrope, sans-serif', fontWeight: 800, fontSize: 22, color:'var(--cs-ink)', letterSpacing:'-0.01em', marginTop:4}}>
                {u.stats.points.toLocaleString()}<span style={{fontFamily:'Inter, sans-serif', fontSize:11, color:'var(--cs-muted)', marginLeft:4, fontWeight: 600}}>pts</span>
              </div>
            </div>
            <button className="ghost-btn" style={{height:30, padding:'0 12px', fontSize:12}}
              onClick={() => window.location.href = '/pages/user_workspace.html?tab=settings'}>兑换</button>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
function WSApp() {
  const [tweaks, setTweak] = useTweaks(WS_TWEAK_DEFAULTS);
  const resolveInitialPage = () => {
    const hashId = (window.location.hash || '').replace(/^#/, '');
    if (WS_PAGES.some(p => p.id === hashId)) return hashId;
    const searchParams = new URLSearchParams(window.location.search || '');
    const explicitTab = searchParams.get('tab') || searchParams.get('view') || searchParams.get('section') || '';
    if (WS_PAGES.some(p => p.id === explicitTab)) return explicitTab;
    const target = searchParams.get('target') || '';
    let targetPath = '';
    try {
      targetPath = target ? new URL(target, window.location.origin).pathname : '';
    } catch (e) {
      targetPath = target.split('?')[0];
    }
    const targetMap = {
      '/pages/my_publish.html': 'posts',
      '/pages/order_center.html': 'orders',
      '/pages/order_detail.html': 'orders',
      '/pages/notification_center.html': 'messages',
      '/pages/user_profile.html': 'settings',
      '/pages/publish_create.html': 'posts',
      '/pages/publish_center.html': 'posts'
    };
    return targetMap[targetPath] || 'posts';
  };
  const initial = resolveInitialPage();
  const validInitial = WS_PAGES.some(p => p.id === initial) ? initial : 'posts';
  const [activeId, setActiveId] = useStateApp(validInitial);
  const [user, setUser] = useStateApp(null);
  const [unreadCount, setUnreadCount] = useStateApp(0);
  const [pendingOrders, setPendingOrders] = useStateApp(0);

  useEffectApp(() => {
    if (!Api) return;
    if (!Api.GetAuthToken || !Api.GetAuthToken()) {
      window.location.href = '/pages/auth_access.html?redirect=' + encodeURIComponent('/pages/user_workspace.html');
      return;
    }

    // Load real user profile
    const cached = Api.GetCurrentUserProfile ? Api.GetCurrentUserProfile() : null;
    const applyProfile = (profile) => {
      if (!profile) return;
      const displayName = profile.displayName || profile.account || window.WS_USER.name;
      setUser({
        name: displayName,
        letter: displayName[0] || '用',
        role: [profile.college, profile.major].filter(Boolean).join(' · ') || window.WS_USER.role,
        verified: profile.userRole === 'VERIFIED_SELLER' || profile.userRole === 'ADMINISTRATOR',
        stats: { posts: window.WS_USER.stats.posts, sold: window.WS_USER.stats.sold, rating: window.WS_USER.stats.rating, points: window.WS_USER.stats.points }
      });
      setTweak('userName', displayName);
    };
    if (cached) applyProfile(cached);
    if (Api.SyncSessionProfile) {
      Api.SyncSessionProfile().then(applyProfile).catch(() => {});
    }

    // Load real notification count
    if (Api.ListMyNotifications) {
      Api.ListMyNotifications().then(result => {
        const listOf = (value) => Array.isArray(value) ? value
          : (value && Array.isArray(value.list) ? value.list
          : (value && Array.isArray(value.records) ? value.records
          : (value && Array.isArray(value.items) ? value.items
          : (value && Array.isArray(value.notificationList) ? value.notificationList
          : (value && value.data ? listOf(value.data) : [])))));
        const readOf = (item) => item && (
          item.readFlag === true || item.readFlag === 1 || item.readFlag === '1' || item.readFlag === 'true'
          || item.readStatus === true || item.readStatus === 1 || item.readStatus === '1' || item.readStatus === 'READ'
          || item.isRead === true || item.isRead === 1 || item.isRead === '1' || item.isRead === 'true'
        );
        setUnreadCount(listOf(result).filter(n => !readOf(n)).length);
      }).catch(() => {});
    }

    // Load real points balance
    if (Api.GetPointBalance) {
      Api.GetPointBalance().then(result => {
        if (result && result.availablePoints != null) {
          setUser(u => u ? { ...u, stats: { ...u.stats, points: result.availablePoints } } : null);
        }
      }).catch(() => {});
    }

    // Load pending orders count
    if (Api.ListMyOrders) {
      Api.ListMyOrders(1, 20).then(result => {
        const list = Array.isArray(result) ? result
          : (result && Array.isArray(result.orderList) ? result.orderList
          : (result && Array.isArray(result.list) ? result.list : []));
        const pending = list.filter(o => ['PENDING_SELLER_CONFIRM','PENDING_OFFLINE_TRADE','PENDING_BUYER_CONFIRM'].includes(o.orderStatus));
        setPendingOrders(pending.length);
      }).catch(() => {});
    }
  }, []);

  useEffectApp(() => {
    document.documentElement.style.setProperty('--cs-primary', tweaks.accent);
  }, [tweaks.accent]);

  useEffectApp(() => {
    window.location.hash = activeId;
    const params = new URLSearchParams(window.location.search || '');
    if (params.get('tab') !== activeId) {
      params.set('tab', activeId);
      window.history.replaceState(null, '', `/pages/user_workspace.html?${params.toString()}#${activeId}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeId]);

  useEffectApp(() => {
    const onHash = () => {
      const h = (window.location.hash || '#posts').slice(1);
      if (WS_PAGES.some(p => p.id === h)) setActiveId(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const active = WS_PAGES.find(p => p.id === activeId) || WS_PAGES[0];
  const Page = active.Comp;

  return (
    <>
      <TopNav activeId={activeId} userName={(user || window.WS_USER).name} unreadCount={unreadCount} />
      <main className="shell">
        <WorkspaceRail
          activeId={activeId}
          onChange={setActiveId}
          showPoints={tweaks.showPoints}
          user={user}
          unreadCount={unreadCount}
          pendingOrders={pendingOrders} />
        <section style={{minWidth: 0}} key={activeId}>
          <Page />
        </section>
      </main>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<WSApp />);
