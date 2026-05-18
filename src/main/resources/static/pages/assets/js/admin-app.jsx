// CampusShare Admin — main shell

const { useState: useStAdm, useEffect: useEffAdm } = React;

const ADM_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#005d90",
  "showHealthBar": true,
  "compactDensity": false
}/*EDITMODE-END*/;

const ADM_PAGES = {
  overview: { Comp: (p) => <OverviewPage {...p} /> },
  review:   { Comp: () => <ReviewPage /> },
  reports:  { Comp: () => <ReportsPage /> },
  users:    { Comp: () => <UsersPage /> },
  trades:   { Comp: () => <TradesPage /> },
  stats:    { Comp: () => <StatsPage /> },
  system:   { Comp: () => <SystemPage /> }
};

function admListOf(result) {
  if (Array.isArray(result)) return result;
  if (!result || typeof result !== 'object') return [];
  const direct = result.items || result.records || result.list || result.rows || result.content || result.data;
  if (Array.isArray(direct)) return direct;
  if (result.data) return admListOf(result.data);
  return Object.keys(result).reduce((acc, key) => Array.isArray(result[key]) ? acc.concat(result[key]) : acc, []);
}

function admFirst(value, fallback) {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function admMapProduct(item) {
  const title = admFirst(item.title, admFirst(item.productTitle, '未命名商品'));
  const seller = admFirst(item.sellerNickname, admFirst(item.sellerName, '发布者'));
  return {
    id: 'P-' + admFirst(item.productId, admFirst(item.id, '')),
    kind: 'goods',
    kindLabel: '商品',
    title,
    desc: admFirst(item.description, '待审核商品'),
    user: { name: seller, school: admFirst(item.school, ''), letter: admFirst(seller[0], '商'), av1: '#ffd089', av2: '#f0a35a' },
    submittedAt: admFirst(item.createTime, admFirst(item.submitTime, '-')),
    waited: '-',
    flags: [],
    risk: 'low',
    price: item.price == null ? '-' : '¥' + item.price,
    meta: admFirst(item.category, '商品'),
    ph: String(title).slice(0, 2),
    c1: '#dbeafe',
    c2: '#1d6fe0',
    raw: item
  };
}

function admMapRecruitment(item) {
  const title = admFirst(item.eventName, admFirst(item.title, '未命名招募'));
  const publisher = admFirst(item.publisherName, '发布者');
  return {
    id: 'T-' + admFirst(item.recruitmentId, admFirst(item.id, '')),
    kind: 'team',
    kindLabel: '招募',
    title,
    desc: admFirst(item.skillRequirement, admFirst(item.description, '待审核招募')),
    user: { name: publisher, school: '', letter: admFirst(publisher[0], '招'), av1: '#a7f3d0', av2: '#0a8a4f' },
    submittedAt: admFirst(item.createTime, admFirst(item.submitTime, '-')),
    waited: '-',
    flags: [],
    risk: 'low',
    price: admFirst(item.direction, '招募'),
    meta: admFirst(item.direction, '招募'),
    ph: String(title).slice(0, 2),
    c1: '#a7f3d0',
    c2: '#0a8a4f',
    raw: item
  };
}

function admMapMaterial(item) {
  const title = admFirst(item.courseName, admFirst(item.title, admFirst(item.materialTitle, '未命名资料')));
  const owner = admFirst(item.uploaderName, admFirst(item.ownerName, '发布者'));
  return {
    id: 'M-' + admFirst(item.materialId, admFirst(item.id, '')),
    kind: 'notes',
    kindLabel: '资料',
    title,
    desc: admFirst(item.description, '待审核资料'),
    user: { name: owner, school: admFirst(item.school, ''), letter: admFirst(owner[0], '资'), av1: '#c4b5fd', av2: '#7c3aed' },
    submittedAt: admFirst(item.createTime, admFirst(item.submitTime, '-')),
    waited: '-',
    flags: [],
    risk: 'low',
    price: admFirst(item.fileType, '资料'),
    meta: (item.tags && Array.isArray(item.tags) ? item.tags.join('、') : admFirst(item.category, '资料')),
    ph: String(title).slice(0, 2),
    c1: '#c4b5fd',
    c2: '#7c3aed',
    raw: item
  };
}

function admMapReport(item) {
  const reporter = admFirst(item.reporterName, '举报人');
  return {
    id: admFirst(item.reportId, admFirst(item.id, '-')),
    severity: String(admFirst(item.severity, 'low')).toLowerCase(),
    type: admFirst(item.reportType, admFirst(item.type, '举报')),
    targetKind: String(admFirst(item.targetType, 'goods')).toLowerCase(),
    target: admFirst(item.targetTitle, admFirst(item.targetId, '-')),
    reporter: { name: reporter, letter: admFirst(reporter[0], '举') },
    reportedAt: admFirst(item.createTime, '-'),
    desc: admFirst(item.reason, admFirst(item.description, '待处理举报')),
    raw: item
  };
}

function admMapUser(item) {
  const name = admFirst(item.nickname, admFirst(item.realName, admFirst(item.username, admFirst(item.userName, 'User'))));
  return {
    id: admFirst(item.userId, admFirst(item.id, '-')),
    name,
    letter: admFirst(name[0], 'U'),
    av1: '#9ec5e8',
    av2: '#5b87c0',
    school: admFirst(item.schoolName, admFirst(item.school, '')),
    level: admFirst(item.userRole, admFirst(item.role, 'USER')),
    verified: !!(item.verified || item.sellerVerified || item.realNameVerified),
    posts: admFirst(item.postCount, 0),
    sold: admFirst(item.soldCount, 0),
    rating: admFirst(item.rating, '-'),
    reports: admFirst(item.reportCount, 0),
    joined: admFirst(item.createTime, '-'),
    status: String(admFirst(item.userStatus, admFirst(item.status, 'active'))).toLowerCase()
  };
}

async function LoadAdminConsoleData() {
  const Api = window.CampusShareApi;
  if (!Api) return;
  if (Api.EnsureAdminSession) await Api.EnsureAdminSession();
  const [summaryResult, pendingProductsResult, pendingMaterialsResult, pendingTeamsResult, reportsResult, usersResult, logsResult] = await Promise.allSettled([
    Api.GetAdminDashboardSummary ? Api.GetAdminDashboardSummary() : Promise.resolve(null),
    Api.ListPendingProductsByAdmin ? Api.ListPendingProductsByAdmin(1, 30) : Promise.resolve([]),
    Api.ListPendingMaterials ? Api.ListPendingMaterials(1, 30) : Promise.resolve([]),
    Api.ListPendingTeamRecruitmentsByAdmin ? Api.ListPendingTeamRecruitmentsByAdmin(1, 30) : Promise.resolve([]),
    Api.ListPendingReports ? Api.ListPendingReports() : Promise.resolve([]),
    Api.ListUsersByAdmin ? Api.ListUsersByAdmin(1, 50) : Promise.resolve([]),
    Api.ListAuditLogsByAdmin ? Api.ListAuditLogsByAdmin({ pageNo: 1, pageSize: 20 }) : Promise.resolve([])
  ]);
  const pendingProducts = pendingProductsResult.status === 'fulfilled' ? admListOf(pendingProductsResult.value).map(admMapProduct) : [];
  const pendingMaterials = pendingMaterialsResult.status === 'fulfilled' ? admListOf(pendingMaterialsResult.value).map(admMapMaterial) : [];
  const pendingTeams = pendingTeamsResult.status === 'fulfilled' ? admListOf(pendingTeamsResult.value).map(admMapRecruitment) : [];
  const reports = reportsResult.status === 'fulfilled' ? admListOf(reportsResult.value).map(admMapReport) : [];
  const users = usersResult.status === 'fulfilled' ? admListOf(usersResult.value).map(admMapUser) : [];
  const logs = logsResult.status === 'fulfilled' ? admListOf(logsResult.value).map(log => ({
    who: admFirst(log.operatorName, admFirst(log.operatorUserId, '系统')),
    act: admFirst(log.actionType, '操作'),
    target: `${admFirst(log.targetType, '')} ${admFirst(log.targetId, '')}`,
    t: admFirst(log.createTime, '-'),
    kind: String(admFirst(log.actionResult, 'pass')).toLowerCase()
  })) : [];
  if (pendingProducts.length || pendingMaterials.length || pendingTeams.length) window.ADM_REVIEW_QUEUE = pendingProducts.concat(pendingMaterials, pendingTeams);
  if (reports.length) window.ADM_REPORTS = reports;
  if (users.length) window.ADM_USERS = users;
  if (logs.length) window.ADM_LOG = logs;
  const summary = summaryResult.status === 'fulfilled' && summaryResult.value ? summaryResult.value : {};
  const pendingCount = window.ADM_REVIEW_QUEUE.length;
  const reportCount = window.ADM_REPORTS.length;
  window.ADM_KPIS = [
    { k: 'users', label: '用户总数', value: String(admFirst(summary.totalUsers, users.length || '-')), delta: '', up: true, hint: '管理员统计', icon: 'group', tone: 'primary' },
    { k: 'content', label: '内容总数', value: String(admFirst(summary.totalContents, '-')), delta: '', up: true, hint: '商品 / 资料 / 招募', icon: 'note_add', tone: 'green' },
    { k: 'pending', label: '待审核', value: String(pendingCount), delta: '', up: true, hint: '商品与招募', icon: 'pending_actions', tone: 'amber' },
    { k: 'reports', label: '待处理举报', value: String(reportCount), delta: '', up: true, hint: '举报队列', icon: 'report', tone: 'rose' },
    { k: 'orders', label: '订单总数', value: String(admFirst(summary.totalOrders, '-')), delta: '', up: true, hint: '交易监控', icon: 'trending_up', tone: 'blue' }
  ];
  window.ADM_REVIEW_TABS = [
    { id: 'all', label: '全部', n: pendingCount },
    { id: 'goods', label: '商品', n: pendingProducts.length },
    { id: 'notes', label: '资料', n: pendingMaterials.length },
    { id: 'team', label: '招募', n: pendingTeams.length },
    { id: 'cmt', label: '评论举报', n: reportCount }
  ];
  window.ADM_NAV = window.ADM_NAV.map(item => {
    if (item.id === 'review') return { ...item, badge: pendingCount ? String(pendingCount) : '' };
    if (item.id === 'reports') return { ...item, badge: reportCount ? String(reportCount) : '' };
    return item;
  });
}

// ─────────────────────────────────────────────────────────────
function AdminTopNav({ activeId, onGoHome, showHealthBar }) {
  const here = ADM_NAV.find(p => p.id === activeId);
  return (
    <header className="nav adm-nav">
      <div className="nav-inner">
        <div className="brand" onClick={onGoHome}>
          <div className="logo"><span className="material-symbols-outlined">school</span></div>
          <span className="name">CampusShare</span>
          <span className="adm-badge"><span className="material-symbols-outlined">shield_person</span>管理工作台</span>
        </div>
        <div className="crumbs">
          <a onClick={onGoHome}>主页</a>
          <span className="material-symbols-outlined">chevron_right</span>
          <a>管理工作台</a>
          {here && (
            <>
              <span className="material-symbols-outlined">chevron_right</span>
              <span className="here">{here.label}</span>
            </>
          )}
        </div>
        {showHealthBar && (
          <div className="health-bar">
            <span className="hb-item">
              <span className="hb-dot ok" />
              <span>API</span>
              <b>98ms</b>
            </span>
            <span className="hb-item">
              <span className="hb-dot ok" />
              <span>消息</span>
              <b>正常</b>
            </span>
            <span className="hb-item">
              <span className="hb-dot warn" />
              <span>支付</span>
              <b>偶发延迟</b>
            </span>
          </div>
        )}
        <div className="nav-right">
          <button className="icon-btn" title="工单">
            <span className="material-symbols-outlined">support_agent</span>
            <span className="dot-badge">4</span>
          </button>
          <button className="icon-btn" title="日志">
            <span className="material-symbols-outlined">notifications</span>
            <span className="dot-badge">9</span>
          </button>
          <button className="avatar-btn" style={{background:'linear-gradient(135deg, #5b87c0, #1e3a5f)'}} title={ADM_USER.name}>{ADM_USER.letter}</button>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
function AdminRail({ activeId, onChange }) {
  return (
    <aside className="ws-rail">
      <div className="glass ws-profile adm-profile">
        <div className="ws-prof-row">
          <div className="ws-avatar" style={{background:'linear-gradient(135deg, #5b87c0, #1e3a5f)'}}>{ADM_USER.letter}</div>
          <div className="ws-prof-info">
            <div className="name">{ADM_USER.name}</div>
            <div className="role">
              <span className="material-symbols-outlined" style={{color:'var(--cs-primary)'}}>shield_person</span>
              {ADM_USER.role}
            </div>
          </div>
        </div>
        <div className="ws-mini-stats" style={{flexWrap:'wrap', gap: 10}}>
          <span><b>184</b>今日审核</span>
          <span><b>4.2m</b>平均时长</span>
          <span><b>99.1%</b>准确率</span>
        </div>
      </div>

      <div className="glass ws-nav">
        {ADM_NAV.map(p => (
          <button
            key={p.id}
            className={'ws-link' + (activeId === p.id ? ' active' : '')}
            onClick={() => onChange(p.id)}>
            <span className="material-symbols-outlined">{p.icon}</span>
            <span>{p.label}</span>
            {p.badge ? <span className={'badge ' + (p.badgeKind || '')}>{p.badge}</span> : <span />}
          </button>
        ))}
        <div className="ws-divider" />
        <div className="ws-label">值班</div>
        <div style={{padding: '4px 12px 8px'}}>
          <div className="duty-row">
            <span className="duty-av" style={{background:'linear-gradient(135deg, #5b87c0, #1e3a5f)'}}>王</span>
            <div className="duty-info">
              <div className="duty-name">王老师 <span className="duty-tag">值班中</span></div>
              <div className="duty-sub">09:00 – 21:00</div>
            </div>
          </div>
          <div className="duty-row">
            <span className="duty-av" style={{background:'linear-gradient(135deg, #f0a35a, #b45309)'}}>李</span>
            <div className="duty-info">
              <div className="duty-name">李老师 <span className="duty-tag off">休息</span></div>
              <div className="duty-sub">21:00 – 次日 09:00</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
function AdminApp() {
  const [tweaks, setTweak] = useTweaks(ADM_TWEAK_DEFAULTS);
  const initial = (window.location.hash || '#overview').slice(1);
  const validInitial = ADM_PAGES[initial] ? initial : 'overview';
  const [activeId, setActiveId] = useStAdm(validInitial);
  const [dataVersion, setDataVersion] = useStAdm(0);

  useEffAdm(() => {
    document.documentElement.style.setProperty('--cs-primary', tweaks.accent);
  }, [tweaks.accent]);

  useEffAdm(() => {
    window.location.hash = activeId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeId]);

  useEffAdm(() => {
    const onHash = () => {
      const h = (window.location.hash || '#overview').slice(1);
      if (ADM_PAGES[h]) setActiveId(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffAdm(() => {
    let alive = true;
    LoadAdminConsoleData()
      .then(() => { if (alive) setDataVersion(v => v + 1); })
      .catch(error => console.warn('[CampusShare] admin console data load failed', error));
    return () => { alive = false; };
  }, []);

  const Page = ADM_PAGES[activeId].Comp;

  return (
    <>
      <AdminTopNav activeId={activeId}
        showHealthBar={tweaks.showHealthBar}
        onGoHome={() => window.location.href = '/pages/market_overview.html'} />
      <main className={'shell' + (tweaks.compactDensity ? ' compact-density' : '')}>
        <AdminRail activeId={activeId} onChange={setActiveId} />
        <section style={{minWidth: 0}} key={`${activeId}-${dataVersion}`}>
          <Page goReview={() => setActiveId('review')} goReports={() => setActiveId('reports')} />
        </section>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="主题">
          <TweakColor label="主色" value={tweaks.accent}
            options={['#005d90', '#0a8a4f', '#7c3aed', '#b45309', '#be123c']}
            onChange={(v) => setTweak('accent', v)} />
        </TweakSection>
        <TweakSection label="布局">
          <TweakToggle label="顶栏健康监测条" value={tweaks.showHealthBar}
            onChange={(v) => setTweak('showHealthBar', v)} />
          <TweakToggle label="紧凑密度" value={tweaks.compactDensity}
            onChange={(v) => setTweak('compactDensity', v)} />
        </TweakSection>
        <TweakSection label="跳转">
          <TweakSelect label="当前子页面" value={activeId}
            options={ADM_NAV.map(p => ({ value: p.id, label: p.label }))}
            onChange={(v) => setActiveId(v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp />);
