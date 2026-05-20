// CampusShare Admin page renderers
const { useState: useStateAdm, useMemo: useMemoAdm, useEffect: useEffectAdm } = React;

function adminPageListOf(result) {
  if (Array.isArray(result)) return result;
  if (!result || typeof result !== 'object') return [];
  const direct = result.items || result.records || result.list || result.rows || result.content || result.data;
  if (Array.isArray(direct)) return direct;
  if (result.data) return adminPageListOf(result.data);
  return Object.keys(result).reduce((acc, key) => Array.isArray(result[key]) ? acc.concat(result[key]) : acc, []);
}

function adminPageFirst(value, fallback) {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function adminPageLoading(label) {
  return (
    <div className="card panel" style={{padding:24}}>
      <div className="placeholder-block">
        <div className="ph-icn"><span className="material-symbols-outlined">sync</span></div>
        <div>
          <div className="ph-t">{label || 'Loading'}</div>
          <div className="ph-s">CampusShare API</div>
        </div>
      </div>
    </div>
  );
}

function adminPageSummaryKpis(summary) {
  const source = summary || {};
  return [
    { k: 'users', label: 'Users', value: String(adminPageFirst(source.totalUsers, '-')), delta: '', up: true, hint: 'Admin summary', icon: 'group', tone: 'primary' },
    { k: 'content', label: 'Content', value: String(adminPageFirst(source.totalContents, '-')), delta: '', up: true, hint: 'Products / materials / teams', icon: 'note_add', tone: 'green' },
    { k: 'pending', label: 'Pending review', value: String(adminPageFirst(source.pendingReviewCount, adminPageFirst(source.pendingContents, '-'))), delta: '', up: true, hint: 'Review queue', icon: 'pending_actions', tone: 'amber' },
    { k: 'reports', label: 'Pending reports', value: String(adminPageFirst(source.pendingReportCount, '-')), delta: '', up: true, hint: 'Report queue', icon: 'report', tone: 'rose' },
    { k: 'orders', label: 'Orders', value: String(adminPageFirst(source.totalOrders, '-')), delta: '', up: true, hint: 'Trade monitor', icon: 'trending_up', tone: 'blue' }
  ];
}

function adminPageMapProduct(item) {
  const mapper = window.admMapProduct;
  if (typeof mapper === 'function') return mapper(item);
  const title = adminPageFirst(item.title, adminPageFirst(item.productTitle, 'Product'));
  const seller = adminPageFirst(item.sellerNickname, adminPageFirst(item.sellerName, 'User'));
  return { id: 'P-' + adminPageFirst(item.productId, adminPageFirst(item.id, '')), kind: 'goods', title, desc: adminPageFirst(item.description, ''), user: { name: seller, school: adminPageFirst(item.school, ''), letter: adminPageFirst(seller[0], 'U'), av1: '#ffd089', av2: '#f0a35a' }, waited: '-', flags: [], risk: 'low', price: item.price == null ? '-' : String(item.price), meta: adminPageFirst(item.category, 'Product'), ph: String(title).slice(0, 2), c1: '#dbeafe', c2: '#1d6fe0', raw: item };
}

function adminPageMapMaterial(item) {
  const mapper = window.admMapMaterial;
  if (typeof mapper === 'function') return mapper(item);
  const title = adminPageFirst(item.courseName, adminPageFirst(item.title, adminPageFirst(item.materialTitle, 'Material')));
  const owner = adminPageFirst(item.uploaderName, adminPageFirst(item.ownerName, 'User'));
  return { id: 'M-' + adminPageFirst(item.materialId, adminPageFirst(item.id, '')), kind: 'notes', title, desc: adminPageFirst(item.description, ''), user: { name: owner, school: adminPageFirst(item.school, ''), letter: adminPageFirst(owner[0], 'U'), av1: '#c4b5fd', av2: '#7c3aed' }, waited: '-', flags: [], risk: 'low', price: adminPageFirst(item.fileType, 'Material'), meta: adminPageFirst(item.category, 'Material'), ph: String(title).slice(0, 2), c1: '#c4b5fd', c2: '#7c3aed', raw: item };
}

function adminPageMapRecruitment(item) {
  const mapper = window.admMapRecruitment;
  if (typeof mapper === 'function') return mapper(item);
  const title = adminPageFirst(item.eventName, adminPageFirst(item.title, 'Team'));
  const publisher = adminPageFirst(item.publisherName, 'User');
  return { id: 'T-' + adminPageFirst(item.recruitmentId, adminPageFirst(item.id, '')), kind: 'team', title, desc: adminPageFirst(item.skillRequirement, adminPageFirst(item.description, '')), user: { name: publisher, school: '', letter: adminPageFirst(publisher[0], 'U'), av1: '#a7f3d0', av2: '#0a8a4f' }, waited: '-', flags: [], risk: 'low', price: adminPageFirst(item.direction, 'Team'), meta: adminPageFirst(item.direction, 'Team'), ph: String(title).slice(0, 2), c1: '#a7f3d0', c2: '#0a8a4f', raw: item };
}

function adminPageMapReport(item) {
  const mapper = window.admMapReport;
  if (typeof mapper === 'function') return mapper(item);
  const reporter = adminPageFirst(item.reporterName, 'User');
  return { id: adminPageFirst(item.reportId, adminPageFirst(item.id, '-')), severity: String(adminPageFirst(item.severity, 'low')).toLowerCase(), type: adminPageFirst(item.reportType, adminPageFirst(item.type, 'Report')), targetKind: String(adminPageFirst(item.targetType, 'goods')).toLowerCase(), target: adminPageFirst(item.targetTitle, adminPageFirst(item.targetId, '-')), reporter: { name: reporter, letter: adminPageFirst(reporter[0], 'U') }, reportedAt: adminPageFirst(item.createTime, '-'), desc: adminPageFirst(item.reason, adminPageFirst(item.description, '')), raw: item };
}

function adminPageMapUser(item) {
  const mapper = window.admMapUser;
  if (typeof mapper === 'function') return mapper(item);
  const name = adminPageFirst(item.nickname, adminPageFirst(item.realName, adminPageFirst(item.username, adminPageFirst(item.userName, 'User'))));
  return { id: adminPageFirst(item.userId, adminPageFirst(item.id, '-')), name, letter: adminPageFirst(name[0], 'U'), av1: '#9ec5e8', av2: '#5b87c0', school: adminPageFirst(item.schoolName, adminPageFirst(item.school, '')), level: adminPageFirst(item.userRole, adminPageFirst(item.role, 'USER')), verified: !!(item.verified || item.sellerVerified || item.realNameVerified), posts: adminPageFirst(item.postCount, 0), sold: adminPageFirst(item.soldCount, 0), rating: adminPageFirst(item.rating, 0), reports: adminPageFirst(item.reportCount, 0), joined: adminPageFirst(item.createTime, '-'), status: String(adminPageFirst(item.userStatus, adminPageFirst(item.status, 'active'))).toLowerCase(), raw: item };
}

// Reusable bits
function KpiCard({ k, label, value, delta, up, hint, icon, tone }) {
  return (
    <div className="card kpi-card">
      <div className={'kpi-icn tone-' + tone}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-foot">
          <span className={'kpi-delta ' + (up ? 'up' : 'down')}>
            <span className="material-symbols-outlined">{up ? 'arrow_upward' : 'arrow_downward'}</span>
            {delta}
          </span>
          <span className="kpi-hint">{hint}</span>
        </div>
      </div>
    </div>
  );
}

function RiskTag({ risk }) {
  const map = { low: ['低', 'green'], med: ['中', 'amber'], high: ['高', 'rose'] };
  const [t, c] = map[risk] || map.low;
  return <span className={'risk-tag ' + c}>风险 · {t}</span>;
}

function KindTag({ kind }) {
  const map = {
    goods: ['商品', 'storefront', 'blue'],
    notes: ['资料', 'menu_book', 'violet'],
    team:  ['招募', 'groups',  'green'],
    cmt:   ['\u8bc4\u8bba', 'forum',   'amber']
  };
  const [label, icon, tone] = map[kind] || map.goods;
  return (
    <span className={'kind-tag tone-' + tone}>
      <span className="material-symbols-outlined">{icon}</span>{label}
    </span>
  );
}

// Activity chart
function ActivityChart() {
  const data = ADM_TREND;
  const W = 720, H = 220, P = { l: 36, r: 16, t: 16, b: 28 };
  const innerW = W - P.l - P.r, innerH = H - P.t - P.b;
  const maxV = Math.max(...data.map(d => d.goods + d.notes + d.team));
  const bw = innerW / data.length;
  const barW = bw * 0.45;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:'100%', height: 240}}>
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <g key={i}>
            <line x1={P.l} y1={P.t + innerH * (1 - t)} x2={W - P.r} y2={P.t + innerH * (1 - t)}
              stroke="rgba(120,133,150,0.16)" strokeDasharray={i === 0 ? '0' : '3 4'} />
            <text x={P.l - 6} y={P.t + innerH * (1 - t) + 4} fill="#94a3b8" fontSize="10" textAnchor="end"
              fontFamily="JetBrains Mono, monospace">{Math.round(maxV * t)}</text>
          </g>
        ))}
        {/* stacked bars */}
        {data.map((d, i) => {
          const x = P.l + bw * i + (bw - barW) / 2;
          const g = innerH * (d.goods / maxV);
          const n = innerH * (d.notes / maxV);
          const t = innerH * (d.team / maxV);
          const y3 = P.t + innerH - g;
          const y2 = y3 - n;
          const y1 = y2 - t;
          return (
            <g key={i}>
              <rect x={x} y={y1} width={barW} height={t} fill="#0a8a4f" rx="3" />
              <rect x={x} y={y2} width={barW} height={n} fill="#7c3aed" rx="0" />
              <rect x={x} y={y3} width={barW} height={g} fill="url(#barGrad)" rx="0" />
              <text x={x + barW/2} y={H - 10} fill="#94a3b8" fontSize="10" textAnchor="middle"
                fontFamily="JetBrains Mono, monospace">{d.d}</text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3454d1" />
            <stop offset="100%" stopColor="#005d90" />
          </linearGradient>
        </defs>
      </svg>
      <div className="chart-legend">
        <span><i style={{background:'#005d90'}} />商品</span>
        <span><i style={{background:'#7c3aed'}} />资料</span>
        <span><i style={{background:'#0a8a4f'}} />招募</span>
      </div>
    </div>
  );
}

// Review queue row
function ReviewRow({ item, compact }) {
  const reviewItem = async (approved) => {
    const Api = window.CampusShareApi;
    if (!Api) return;
    const remark = approved ? '通过' : (window.prompt('请输入驳回原因', '内容不符合发布规范') || '');
    if (!approved && !remark) return;
    const raw = item.raw || {};
    const numericId = raw.productId || raw.materialId || raw.recruitmentId || raw.id || String(item.id).replace(/^[A-Z]-/, '');
    if (item.kind === 'goods' && Api.ReviewProductByAdmin) {
      await Api.ReviewProductByAdmin(numericId, approved, remark);
    } else if (item.kind === 'notes' && Api.ReviewMaterial) {
      await Api.ReviewMaterial(numericId, approved, remark);
    } else if (item.kind === 'team' && Api.ReviewTeamRecruitmentByAdmin) {
      await Api.ReviewTeamRecruitmentByAdmin(numericId, approved, remark);
    } else {
      window.alert('\u5f53\u524d\u7c7b\u578b\u6682\u672a\u914d\u7f6e\u5ba1\u6838\u63a5\u53e3');
      return;
    }
    window.location.reload();
  };

  return (
    <div className={'review-row' + (compact ? ' compact' : '')}>
      <div className="rv-thumb" style={{'--c1': item.c1, '--c2': item.c2}}>{item.ph}</div>
      <div className="rv-body">
        <div className="rv-top">
          <KindTag kind={item.kind} />
          {item.flags.map((f, i) => <span key={i} className="flag-tag">&#x63D0;&#x793A; &#x00B7; {f}</span>)}
          <RiskTag risk={item.risk} />
        </div>
        <div className="rv-title">{item.title}</div>
        {!compact && <div className="rv-desc">{item.desc}</div>}
        <div className="rv-meta">
          <span className="rv-user">
            <span className="rv-av" style={{background: `linear-gradient(135deg, ${item.user.av1}, ${item.user.av2})`}}>{item.user.letter}</span>
            {item.user.name} &#x00B7; {item.user.school}
          </span>
          <span className="rv-dot" />
          <span>{item.meta}</span>
          <span className="rv-dot" />
          <span>{item.price}</span>
          <span className="rv-dot" />
          <span className="rv-mono">{item.id}</span>
        </div>
      </div>
      <div className="rv-side">
        <div className="rv-waited">
          <span className="material-symbols-outlined">schedule</span>
          &#x5DF2;&#x7B49;&#x5F85; <b>{item.waited}</b>
        </div>
        <div className="rv-actions">
          <button className="btn-sm danger" onClick={() => reviewItem(false)}><span className="material-symbols-outlined">close</span>驳回</button>
          <button className="btn-sm"><span className="material-symbols-outlined">flag</span>&#x9700;&#x4FEE;&#x6539;</button>
          <button className="btn-sm primary" onClick={() => reviewItem(true)}><span className="material-symbols-outlined">check</span>通过</button>
        </div>
      </div>
    </div>
  );
}

// Pages
// -----------------------------------------------------------------------------
function OverviewPage({ goReview, goReports }) {
  const [loading, setLoading] = useStateAdm(true);
  const [kpis, setKpis] = useStateAdm(ADM_KPIS);

  useEffectAdm(() => {
    let alive = true;
    const Api = window.CampusShareApi;
    if (!Api || !Api.GetAdminDashboardSummary) {
      setKpis(ADM_KPIS);
      setLoading(false);
      return () => { alive = false; };
    }
    Api.GetAdminDashboardSummary()
      .then(summary => { if (alive) setKpis(adminPageSummaryKpis(summary)); })
      .catch(() => { if (alive) setKpis(ADM_KPIS); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return adminPageLoading('Overview');

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">&#x8FD0;&#x8425;&#x603B;&#x89C8;</div>
          <div className="sub">CampusShare &#x5E73;&#x53F0;&#x5065;&#x5EB7;&#x5EA6; &#x00B7; 2026-05-16 &#x00B7; 14:24 &#x66F4;&#x65B0;</div>
        </div>
        <div className="actions">
          <button className="ghost-btn"><span className="material-symbols-outlined">download</span>&#x5BFC;&#x51FA;&#x65E5;&#x62A5;</button>
          <button className="primary-btn"><span className="material-symbols-outlined">campaign</span>&#x53D1;&#x5E03;&#x516C;&#x544A;</button>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map(k => <KpiCard key={k.k} {...k} />)}
      </div>

      <div className="ov-grid">
        <div className="card panel">
          <div className="panel-head">
            <div>
              <div className="panel-t">近 7 日内容发布趋势</div>
              <div className="panel-s">&#x5546;&#x54C1; &#x00B7; &#x8D44;&#x6599; &#x00B7; &#x62DB;&#x52DF; &#x4E09;&#x7C7B;&#x5806;&#x53E0;</div>
            </div>
            <div className="seg" style={{padding:3}}>
              <button className="on">日</button>
              <button>周</button>
              <button>月</button>
            </div>
          </div>
          <ActivityChart />
          <div className="trend-stats">
            <div><span className="lab">&#x672C;&#x5468;&#x65B0;&#x589E;</span><span className="val">1,612</span><span className="dlt up">+18.3%</span></div>
            <div><span className="lab">&#x672C;&#x5468;&#x6210;&#x4EA4;</span><span className="val">&#x00A5;284k</span><span className="dlt up">+22.1%</span></div>
            <div><span className="lab">&#x6D3B;&#x8DC3;&#x4E70;&#x5BB6;</span><span className="val">3,284</span><span className="dlt up">+6.1%</span></div>
            <div><span className="lab">人均会话</span><span className="val">4.8</span><span className="dlt up">+0.4</span></div>
          </div>
        </div>

        <div className="card panel quick-actions">
          <div className="panel-head">
            <div>
              <div className="panel-t">&#x5FEB;&#x6377;&#x64CD;&#x4F5C;</div>
              <div className="panel-s">&#x65E5;&#x5E38;&#x8FD0;&#x8425;&#x5E38;&#x7528;&#x52A8;&#x4F5C;</div>
            </div>
          </div>
          <div className="qa-grid">
            <button className="qa-btn"><span className="material-symbols-outlined">verified</span><b>&#x6279;&#x91CF;&#x5BA1;&#x6838;</b><i>38 &#x9879;&#x5F85;&#x5904;&#x7406;</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">flag</span><b>处理举报</b><i>7 项待处理</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">block</span><b>违禁词词库</b><i>当前 184 条</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">campaign</span><b>发布公告</b><i>已发布 12 条</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">redeem</span><b>&#x79EF;&#x5206;&#x6D3B;&#x52A8;</b><i>2 &#x4E2A;&#x8FDB;&#x884C;&#x4E2D;</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">support_agent</span><b>&#x5BA2;&#x670D;&#x5DE5;&#x5355;</b><i>4 &#x4E2A;&#x5F85;&#x56DE;&#x590D;</i></button>
          </div>
        </div>

        <div className="card panel">
          <div className="panel-head">
            <div>
              <div className="panel-t">&#x5F85;&#x5BA1;&#x6838; &#x00B7; &#x4F18;&#x5148;&#x961F;&#x5217;</div>
              <div className="panel-s">按等待时长与风险等级排序</div>
            </div>
            <button className="ghost-btn" onClick={goReview}>&#x67E5;&#x770B;&#x5168;&#x90E8; ({ADM_REVIEW_QUEUE.length})<span className="material-symbols-outlined">arrow_forward</span></button>
          </div>
          <div className="review-list">
            {ADM_REVIEW_QUEUE.slice(0, 3).map(item => (
              <ReviewRow key={item.id} item={item} compact />
            ))}
          </div>
        </div>

        <div className="card panel">
          <div className="panel-head">
            <div>
              <div className="panel-t">最近操作日志</div>
              <div className="panel-s">管理员动作流</div>
            </div>
            <button className="ghost-btn">&#x5168;&#x90E8;&#x65E5;&#x5FD7;<span className="material-symbols-outlined">arrow_forward</span></button>
          </div>
          <div className="log-list">
            {ADM_LOG.map((l, i) => (
              <div key={i} className="log-item">
                <span className={'log-dot tone-' + l.kind} />
                <span className="log-who">{l.who}</span>
                <span className={'log-act tone-' + l.kind}>{l.act}</span>
                <span className="log-tgt">{l.target}</span>
                <span className="log-t">{l.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Review page
// -----------------------------------------------------------------------------
function ReviewPage() {
  const [tab, setTab] = useStateAdm('all');
  const [selected, setSelected] = useStateAdm(new Set());
  const [loading, setLoading] = useStateAdm(true);
  const [queue, setQueue] = useStateAdm(ADM_REVIEW_QUEUE);
  const filtered = useMemoAdm(() => {
    if (tab === 'all') return queue;
    return queue.filter(r => r.kind === tab);
  }, [tab, queue]);
  const tabs = useMemoAdm(() => ADM_REVIEW_TABS.map(t => ({
    ...t,
    n: t.id === 'all' ? queue.length : queue.filter(item => item.kind === t.id).length
  })), [queue]);

  useEffectAdm(() => {
    let alive = true;
    const Api = window.CampusShareApi;
    if (!Api || !Api.ListPendingProductsByAdmin || !Api.ListPendingMaterials || !Api.ListPendingTeamRecruitmentsByAdmin) {
      setQueue(ADM_REVIEW_QUEUE);
      setLoading(false);
      return () => { alive = false; };
    }
    Promise.all([
      Api.ListPendingProductsByAdmin(1, 30),
      Api.ListPendingMaterials(1, 30),
      Api.ListPendingTeamRecruitmentsByAdmin(1, 30)
    ]).then(([products, materials, teams]) => {
      const nextQueue = adminPageListOf(products).map(adminPageMapProduct)
        .concat(adminPageListOf(materials).map(adminPageMapMaterial))
        .concat(adminPageListOf(teams).map(adminPageMapRecruitment));
      if (alive) setQueue(nextQueue);
    }).catch(() => { if (alive) setQueue(ADM_REVIEW_QUEUE); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">&#x5185;&#x5BB9;&#x5BA1;&#x6838;</div>
          <div className="sub">&#x5171; <b style={{color:'var(--cs-ink)'}}>{queue.length}</b> &#x9879;&#x5F85;&#x5BA1; &#x00B7; &#x5E73;&#x5747;&#x5904;&#x7406;&#x65F6;&#x957F; <b style={{color:'var(--cs-ink)'}}>4.2 min</b></div>
        </div>
        <div className="actions">
          <button className="ghost-btn"><span className="material-symbols-outlined">history</span>&#x5386;&#x53F2;&#x5BA1;&#x6838;</button>
          <button className="ghost-btn"><span className="material-symbols-outlined">rule</span>&#x5BA1;&#x6838;&#x89C4;&#x5219;</button>
        </div>
      </div>

      <div className="seg">
        {tabs.map(t => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}<span className="n">{t.n}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-mini">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="搜索标题、用户、ID" />
        </div>
        <div className="toolbar-right">
          <button className="ghost-btn"><span className="material-symbols-outlined">sort</span>等待时长</button>
          <button className="ghost-btn"><span className="material-symbols-outlined">tune</span>风险等级</button>
          <button className="ghost-btn"><span className="material-symbols-outlined">checklist</span>批量处理</button>
        </div>
      </div>

      <div className="review-list">
        {loading ? adminPageLoading('Review queue') : filtered.map(item => (
          <div key={item.id} className="card">
            <ReviewRow item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Reports page
// -----------------------------------------------------------------------------
function ReportsPage() {
  const [sev, setSev] = useStateAdm('all');
  const [loading, setLoading] = useStateAdm(true);
  const [reports, setReports] = useStateAdm(ADM_REPORTS);
  const filtered = useMemoAdm(() => {
    if (sev === 'all') return reports;
    return reports.filter(r => r.severity === sev);
  }, [sev, reports]);

  useEffectAdm(() => {
    let alive = true;
    const Api = window.CampusShareApi;
    if (!Api || !Api.ListPendingReports) {
      setReports(ADM_REPORTS);
      setLoading(false);
      return () => { alive = false; };
    }
    Api.ListPendingReports()
      .then(result => { if (alive) setReports(adminPageListOf(result).map(adminPageMapReport)); })
      .catch(() => { if (alive) setReports(ADM_REPORTS); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const reviewReport = async (report, approved) => {
    const Api = window.CampusShareApi;
    if (!Api || !Api.ReviewReport) return;
    const raw = report.raw || {};
    const reportId = raw.reportId || raw.id || report.id;
    const remark = approved ? 'processed' : (window.prompt('Review remark', '') || '');
    if (!approved && !remark) return;
    await Api.ReviewReport(reportId, approved, approved ? 'WARNING' : 'IGNORE', remark);
    setReports(prev => prev.filter(item => item.id !== report.id));
  };

  const sevLabel = { high: '高优先', med: '中', low: '低' };
  const counts = {
    all: reports.length,
    high: reports.filter(r => r.severity === 'high').length,
    med: reports.filter(r => r.severity === 'med').length,
    low: reports.filter(r => r.severity === 'low').length
  };

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">举报处理</div>
          <div className="sub">&#x7528;&#x6237;&#x63D0;&#x4EA4;&#x4E0E;&#x7CFB;&#x7EDF;&#x68C0;&#x6D4B;&#x7684;&#x8FDD;&#x89C4;&#x7EBF;&#x7D22; &#x00B7; 24h &#x5185;&#x54CD;&#x5E94; <b style={{color:'var(--cs-ink)'}}>96.4%</b></div>
        </div>
        <div className="actions">
          <button className="ghost-btn"><span className="material-symbols-outlined">policy</span>处理规范</button>
        </div>
      </div>

      <div className="seg">
        {[
          ['all',  '\u5168\u90e8', counts.all],
          ['high', '高优先', counts.high],
          ['med',  '中', counts.med],
          ['low',  '低', counts.low]
        ].map(([id, lab, n]) => (
          <button key={id} className={sev === id ? 'on' : ''} onClick={() => setSev(id)}>
            {lab}<span className="n">{n}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-mini">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="搜索举报 ID、目标、举报人" />
        </div>
        <div className="toolbar-right">
          <button className="ghost-btn"><span className="material-symbols-outlined">date_range</span>近 7 天</button>
        </div>
      </div>

      <div className="report-table card">
        <div className="rt-head">
          <span>举报 ID</span>
          <span>类别</span>
          <span>&#x76EE;&#x6807;</span>
          <span>举报人</span>
          <span>时间</span>
          <span>操作</span>
        </div>
        {loading ? (
          <div className="rt-row"><span>Loading</span><span></span><span>CampusShare API</span><span></span><span></span><span></span></div>
        ) : filtered.map(r => (
          <div key={r.id} className="rt-row">
            <span className="mono">{r.id}</span>
            <span>
              <span className={'sev-pill ' + r.severity}>{sevLabel[r.severity]}</span>
              <span className="rt-type">{r.type}</span>
            </span>
            <span className="rt-target">
              <KindTag kind={r.targetKind} />
              <span>{r.target}</span>
            </span>
            <span className="rt-reporter">
              <span className="rt-av">{r.reporter.letter}</span>
              {r.reporter.name}
            </span>
            <span className="rt-time">{r.reportedAt}</span>
            <span className="rt-acts">
              <button className="btn-sm">鏌ョ湅</button>
              <button className="btn-sm primary" onClick={() => reviewReport(r, true)}><span className="material-symbols-outlined">gavel</span>处理</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Users page
// -----------------------------------------------------------------------------
function UsersPage() {
  const [scope, setScope] = useStateAdm('all');
  const [loading, setLoading] = useStateAdm(true);
  const [users, setUsers] = useStateAdm(ADM_USERS);
  const filtered = useMemoAdm(() => {
    if (scope === 'all') return users;
    return users.filter(u => u.status === scope);
  }, [scope, users]);

  useEffectAdm(() => {
    let alive = true;
    const Api = window.CampusShareApi;
    if (!Api || !Api.ListUsersByAdmin) {
      setUsers(ADM_USERS);
      setLoading(false);
      return () => { alive = false; };
    }
    Api.ListUsersByAdmin(1, 50)
      .then(result => { if (alive) setUsers(adminPageListOf(result).map(adminPageMapUser)); })
      .catch(() => { if (alive) setUsers(ADM_USERS); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const statusLabel = { active: '正常', warned: '已警告', restricted: '受限' };
  const statusTone  = { active: 'green', warned: 'amber', restricted: 'rose' };

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">&#x7528;&#x6237;&#x7BA1;&#x7406;</div>
          <div className="sub">&#x7D2F;&#x8BA1;&#x6CE8;&#x518C; <b style={{color:'var(--cs-ink)'}}>12,648</b> &#x00B7; 7 &#x65E5;&#x65B0;&#x589E; <b style={{color:'var(--cs-ink)'}}>+486</b> &#x00B7; &#x8BA4;&#x8BC1;&#x7387; <b style={{color:'var(--cs-ink)'}}>93.2%</b></div>
        </div>
        <div className="actions">
          <button className="ghost-btn"><span className="material-symbols-outlined">file_download</span>导出</button>
          <button className="ghost-btn"><span className="material-symbols-outlined">verified_user</span>&#x8BA4;&#x8BC1;&#x5BA1;&#x6838;</button>
        </div>
      </div>

      <div className="seg">
        {[
          ['all', '\u5168\u90e8', users.length],
          ['active', '正常', users.filter(u => u.status === 'active').length],
          ['warned', '已警告', users.filter(u => u.status === 'warned').length],
          ['restricted', '受限', users.filter(u => u.status === 'restricted').length]
        ].map(([id, lab, n]) => (
          <button key={id} className={scope === id ? 'on' : ''} onClick={() => setScope(id)}>
            {lab}<span className="n">{n}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-mini">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="搜索昵称、学院、用户 ID" />
        </div>
        <div className="toolbar-right">
          <button className="ghost-btn"><span className="material-symbols-outlined">sort</span>&#x6CE8;&#x518C;&#x65F6;&#x95F4;</button>
        </div>
      </div>

      <div className="user-table card">
        <div className="ut-head">
          <span>鐢ㄦ埛</span>
          <span>&#x5B66;&#x9662; / &#x7B49;&#x7EA7;</span>
          <span>发布 / 成交</span>
          <span>评分</span>
          <span>举报</span>
          <span>&#x6CE8;&#x518C;&#x65F6;&#x95F4;</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        {loading ? (
          <div className="ut-row"><span>Loading</span><span>CampusShare API</span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        ) : filtered.map(u => (
          <div key={u.id} className="ut-row">
            <span className="ut-user">
              <span className="ut-av" style={{background:`linear-gradient(135deg, ${u.av1}, ${u.av2})`}}>{u.letter}</span>
              <span>
                <b>{u.name}</b>
                <em className="mono">{u.id}</em>
              </span>
            </span>
            <span>
              {u.school}
              <em className="ut-lv">{u.level}{u.verified && <span className="material-symbols-outlined" style={{fontSize:13,color:'var(--green)',marginLeft:4,verticalAlign:-2,fontVariationSettings:"'FILL' 1"}}>verified</span>}</em>
            </span>
            <span><b>{u.posts}</b> / <b>{u.sold}</b></span>
            <span>{u.rating > 0 ? <span className="ut-rating">★ {u.rating}</span> : <em>-</em>}</span>
            <span>{u.reports > 0 ? <span className="ut-rep">{u.reports}</span> : <em>0</em>}</span>
            <span className="mono ut-date">{u.joined}</span>
            <span><span className={'st-pill ' + statusTone[u.status]}>{statusLabel[u.status]}</span></span>
            <span className="ut-acts">
              <button className="btn-sm">璇︽儏</button>
              <button className="btn-sm">···</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Trades page
// -----------------------------------------------------------------------------
function TradesPage() {
  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">&#x4EA4;&#x6613;&#x76D1;&#x63A7;</div>
          <div className="sub">实时观察平台交易、面交与退款情况</div>
        </div>
      </div>
      <div className="kpi-grid">
        <KpiCard k="gmv" label="今日 GMV" value="¥48,260" delta="+22.1%" up hint="昨日 ¥39,520" icon="paid" tone="blue" />
        <KpiCard k="ord" label="今日订单" value="184" delta="+18" up hint="均价 ¥262" icon="receipt_long" tone="primary" />
        <KpiCard k="meet" label="今日面交" value="142" delta="+12.6%" up hint="完成率 96.3%" icon="handshake" tone="green" />
        <KpiCard k="ref" label="今日退款" value="3" delta="-2" up={false} hint="退款率 1.6%" icon="undo" tone="amber" />
      </div>
      <div className="card panel" style={{marginTop:18, padding:24}}>
        <div className="placeholder-block">
          <div className="ph-icn"><span className="material-symbols-outlined">timeline</span></div>
          <div>
            <div className="ph-t">&#x5B9E;&#x65F6;&#x4EA4;&#x6613;&#x6D41; &#x00B7; &#x5360;&#x4F4D;</div>
            <div className="ph-s">此处将展示按时间排序的交易事件流、退款工单、异常订单告警。</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats page
// -----------------------------------------------------------------------------
function StatsPage() {
  const [loading, setLoading] = useStateAdm(true);
  const [kpis, setKpis] = useStateAdm(ADM_KPIS);

  useEffectAdm(() => {
    let alive = true;
    const Api = window.CampusShareApi;
    if (!Api || !Api.GetAdminDashboardSummary) {
      setKpis(ADM_KPIS);
      setLoading(false);
      return () => { alive = false; };
    }
    Api.GetAdminDashboardSummary()
      .then(summary => { if (alive) setKpis(adminPageSummaryKpis(summary)); })
      .catch(() => { if (alive) setKpis(ADM_KPIS); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">数据分析</div>
          <div className="sub">&#x957F;&#x5468;&#x671F;&#x8D8B;&#x52BF;&#x3001;&#x7559;&#x5B58;&#x3001;&#x8F6C;&#x5316;&#x6F0F;&#x6597;&#x7B49;</div>
        </div>
      </div>
      <div className="kpi-grid">
        {loading ? adminPageLoading('Stats') : kpis.map(k => <KpiCard key={k.k} {...k} />)}
      </div>
      <div className="card panel" style={{padding:24}}>
        <div className="placeholder-block">
          <div className="ph-icn"><span className="material-symbols-outlined">insights</span></div>
          <div>
            <div className="ph-t">&#x6DF1;&#x5EA6;&#x6570;&#x636E;&#x770B;&#x677F; &#x00B7; &#x5360;&#x4F4D;</div>
            <div className="ph-s">此处规划：DAU/WAU/MAU 留存曲线、品类转化漏斗、面交成功率热力图、学院间互通矩阵。</div>
          </div>
        </div>
      </div>
    </div>
  );
}
// System page

// -----------------------------------------------------------------------------
function SystemPage() {
  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">系统设置</div>
          <div className="sub">&#x5E73;&#x53F0;&#x7EA7;&#x914D;&#x7F6E; &#x00B7; &#x4EC5;&#x8D85;&#x7EA7;&#x7BA1;&#x7406;&#x5458;&#x53EF;&#x89C1;</div>
        </div>
      </div>
      <div className="sys-grid">
        {[
          ['psychology_alt', '审核策略', '自动审核阈值、关键词触发、人工兜底'],
          ['block', '违禁词词库', '当前 184 条 · 上次更新 5/14'],
          ['category', '分类与标签', '商品 14 类、资料 9 类、招募 6 类'],
          ['redeem', '\u79ef\u5206\u89c4\u5219', '\u53d1\u5e03 / \u8bc4\u4ef7 / \u4e0b\u8f7d\u79ef\u5206\u5956\u52b1\u914d\u7f6e'],
          ['campaign', '公告与横幅', '官方推送与首页 banner 管理'],
          ['groups', '管理员与权限', '4 个角色 · 12 名运营成员']
        ].map(([icn, t, s], i) => (
          <div key={i} className="card sys-card">
            <div className="sys-icn"><span className="material-symbols-outlined">{icn}</span></div>
            <div className="sys-t">{t}</div>
            <div className="sys-s">{s}</div>
            <button className="ghost-btn" style={{marginTop:14}}><span className="material-symbols-outlined">arrow_forward</span>打开</button>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { OverviewPage, ReviewPage, ReportsPage, UsersPage, TradesPage, StatsPage, SystemPage });
