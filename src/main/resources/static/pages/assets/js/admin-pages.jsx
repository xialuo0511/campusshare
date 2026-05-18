// CampusShare Admin 鈥?page renderers
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

// 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ Reusable bits 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
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
  const map = { low: ['浣?, 'green'], med: ['涓?, 'amber'], high: ['楂?, 'rose'] };
  const [t, c] = map[risk] || map.low;
  return <span className={'risk-tag ' + c}>椋庨櫓 路 {t}</span>;
}

function KindTag({ kind }) {
  const map = {
    goods: ['鍟嗗搧', 'storefront', 'blue'],
    notes: ['璧勬枡', 'menu_book', 'violet'],
    team:  ['鎷涘嫙', 'groups',  'green'],
    cmt:   ['璇勮', 'forum',   'amber']
  };
  const [label, icon, tone] = map[kind] || map.goods;
  return (
    <span className={'kind-tag tone-' + tone}>
      <span className="material-symbols-outlined">{icon}</span>{label}
    </span>
  );
}

// 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ Activity chart 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
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
        <span><i style={{background:'#005d90'}} />鍟嗗搧</span>
        <span><i style={{background:'#7c3aed'}} />璧勬枡</span>
        <span><i style={{background:'#0a8a4f'}} />鎷涘嫙</span>
      </div>
    </div>
  );
}

// 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ Review queue row 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
function ReviewRow({ item, compact }) {
  const reviewItem = async (approved) => {
    const Api = window.CampusShareApi;
    if (!Api) return;
    const remark = approved ? '閫氳繃' : (window.prompt('璇疯緭鍏ラ┏鍥炲師鍥?, '鍐呭涓嶇鍚堝彂甯冭鑼?) || '');
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
      window.alert('褰撳墠绫诲瀷鏆傛湭閰嶇疆瀹℃牳鎺ュ彛');
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
          {item.flags.map((f, i) => <span key={i} className="flag-tag">鈿?{f}</span>)}
          <RiskTag risk={item.risk} />
        </div>
        <div className="rv-title">{item.title}</div>
        {!compact && <div className="rv-desc">{item.desc}</div>}
        <div className="rv-meta">
          <span className="rv-user">
            <span className="rv-av" style={{background: `linear-gradient(135deg, ${item.user.av1}, ${item.user.av2})`}}>{item.user.letter}</span>
            {item.user.name} 路 {item.user.school}
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
          宸茬瓑寰?<b>{item.waited}</b>
        </div>
        <div className="rv-actions">
          <button className="btn-sm danger" onClick={() => reviewItem(false)}><span className="material-symbols-outlined">close</span>椹冲洖</button>
          <button className="btn-sm"><span className="material-symbols-outlined">flag</span>闇€淇敼</button>
          <button className="btn-sm primary" onClick={() => reviewItem(true)}><span className="material-symbols-outlined">check</span>閫氳繃</button>
        </div>
      </div>
    </div>
  );
}

// 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
// 1) Overview
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
          <div className="ttl">杩愯惀鎬昏</div>
          <div className="sub">CampusShare 骞冲彴鍋ュ悍搴?路 2026-05-16 路 14:24 鏇存柊</div>
        </div>
        <div className="actions">
          <button className="ghost-btn"><span className="material-symbols-outlined">download</span>瀵煎嚭鏃ユ姤</button>
          <button className="primary-btn"><span className="material-symbols-outlined">campaign</span>鍙戝竷鍏憡</button>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map(k => <KpiCard key={k.k} {...k} />)}
      </div>

      <div className="ov-grid">
        <div className="card panel">
          <div className="panel-head">
            <div>
              <div className="panel-t">杩?7 鏃ュ唴瀹瑰彂甯冭秼鍔?/div>
              <div className="panel-s">鍟嗗搧 路 璧勬枡 路 鎷涘嫙 涓夌被鍫嗗彔</div>
            </div>
            <div className="seg" style={{padding:3}}>
              <button className="on">鏃?/button>
              <button>鍛?/button>
              <button>鏈?/button>
            </div>
          </div>
          <ActivityChart />
          <div className="trend-stats">
            <div><span className="lab">鏈懆鏂板</span><span className="val">1,612</span><span className="dlt up">+18.3%</span></div>
            <div><span className="lab">鏈懆鎴愪氦</span><span className="val">楼284k</span><span className="dlt up">+22.1%</span></div>
            <div><span className="lab">娲昏穬涔板</span><span className="val">3,284</span><span className="dlt up">+6.1%</span></div>
            <div><span className="lab">浜哄潎浼氳瘽</span><span className="val">4.8</span><span className="dlt up">+0.4</span></div>
          </div>
        </div>

        <div className="card panel quick-actions">
          <div className="panel-head">
            <div>
              <div className="panel-t">蹇嵎鎿嶄綔</div>
              <div className="panel-s">鏃ュ父杩愯惀甯哥敤鍔ㄤ綔</div>
            </div>
          </div>
          <div className="qa-grid">
            <button className="qa-btn"><span className="material-symbols-outlined">verified</span><b>鎵归噺瀹℃牳</b><i>38 椤瑰緟澶勭悊</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">flag</span><b>澶勭悊涓炬姤</b><i>7 椤瑰緟澶勭悊</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">block</span><b>杩濈璇嶈瘝搴?/b><i>褰撳墠 184 涓?/i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">campaign</span><b>鍙戝竷鍏憡</b><i>宸插彂甯?12 鏉?/i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">redeem</span><b>绉垎娲诲姩</b><i>2 涓繘琛屼腑</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">support_agent</span><b>瀹㈡湇宸ュ崟</b><i>4 涓緟鍥炲</i></button>
          </div>
        </div>

        <div className="card panel">
          <div className="panel-head">
            <div>
              <div className="panel-t">寰呭鏍?路 浼樺厛闃熷垪</div>
              <div className="panel-s">鎸夌瓑寰呮椂闀夸笌椋庨櫓绛夌骇鎺掑簭</div>
            </div>
            <button className="ghost-btn" onClick={goReview}>鏌ョ湅鍏ㄩ儴 ({ADM_REVIEW_QUEUE.length})<span className="material-symbols-outlined">arrow_forward</span></button>
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
              <div className="panel-t">鏈€杩戞搷浣滄棩蹇?/div>
              <div className="panel-s">绠＄悊鍛樺姩浣滄祦</div>
            </div>
            <button className="ghost-btn">鍏ㄩ儴鏃ュ織<span className="material-symbols-outlined">arrow_forward</span></button>
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

// 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
// 2) Review
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
          <div className="ttl">鍐呭瀹℃牳</div>
          <div className="sub">鍏?<b style={{color:'var(--cs-ink)'}}>{queue.length}</b> 椤瑰緟瀹?路 骞冲潎澶勭悊鏃堕暱 <b style={{color:'var(--cs-ink)'}}>4.2 min</b></div>
        </div>
        <div className="actions">
          <button className="ghost-btn"><span className="material-symbols-outlined">history</span>鍘嗗彶瀹℃牳</button>
          <button className="ghost-btn"><span className="material-symbols-outlined">rule</span>瀹℃牳瑙勫垯</button>
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
          <input placeholder="鎼滅储鏍囬銆佺敤鎴枫€両D鈥? />
        </div>
        <div className="toolbar-right">
          <button className="ghost-btn"><span className="material-symbols-outlined">sort</span>绛夊緟鏃堕暱</button>
          <button className="ghost-btn"><span className="material-symbols-outlined">tune</span>椋庨櫓绛夌骇</button>
          <button className="ghost-btn"><span className="material-symbols-outlined">checklist</span>鎵归噺澶勭悊</button>
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

// 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
// 3) Reports
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

  const sevLabel = { high: '楂樹紭鍏?, med: '涓?, low: '浣? };
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
          <div className="ttl">涓炬姤澶勭悊</div>
          <div className="sub">鐢ㄦ埛鎻愪氦涓庣郴缁熸娴嬬殑杩濊绾跨储 路 24h 鍐呭搷搴?<b style={{color:'var(--cs-ink)'}}>96.4%</b></div>
        </div>
        <div className="actions">
          <button className="ghost-btn"><span className="material-symbols-outlined">policy</span>澶勭悊瑙勮寖</button>
        </div>
      </div>

      <div className="seg">
        {[
          ['all',  '鍏ㄩ儴', counts.all],
          ['high', '楂樹紭鍏?, counts.high],
          ['med',  '涓?, counts.med],
          ['low',  '浣?, counts.low]
        ].map(([id, lab, n]) => (
          <button key={id} className={sev === id ? 'on' : ''} onClick={() => setSev(id)}>
            {lab}<span className="n">{n}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-mini">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="鎼滅储涓炬姤 ID銆佺洰鏍囥€佷妇鎶ヤ汉鈥? />
        </div>
        <div className="toolbar-right">
          <button className="ghost-btn"><span className="material-symbols-outlined">date_range</span>杩?7 澶?/button>
        </div>
      </div>

      <div className="report-table card">
        <div className="rt-head">
          <span>涓炬姤 ID</span>
          <span>绫诲埆</span>
          <span>鐩爣</span>
          <span>涓炬姤浜?/span>
          <span>鏃堕棿</span>
          <span>鎿嶄綔</span>
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
              <button className="btn-sm primary" onClick={() => reviewReport(r, true)}><span className="material-symbols-outlined">gavel</span>澶勭悊</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
// 4) Users
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

  const statusLabel = { active: '姝ｅ父', warned: '宸茶鍛?, restricted: '鍙楅檺' };
  const statusTone  = { active: 'green', warned: 'amber', restricted: 'rose' };

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">鐢ㄦ埛绠＄悊</div>
          <div className="sub">绱娉ㄥ唽 <b style={{color:'var(--cs-ink)'}}>12,648</b> 路 7 鏃ユ柊澧?<b style={{color:'var(--cs-ink)'}}>+486</b> 路 璁よ瘉鐜?<b style={{color:'var(--cs-ink)'}}>93.2%</b></div>
        </div>
        <div className="actions">
          <button className="ghost-btn"><span className="material-symbols-outlined">file_download</span>瀵煎嚭</button>
          <button className="ghost-btn"><span className="material-symbols-outlined">verified_user</span>璁よ瘉瀹℃牳</button>
        </div>
      </div>

      <div className="seg">
        {[
          ['all', '鍏ㄩ儴', users.length],
          ['active', '姝ｅ父', users.filter(u => u.status === 'active').length],
          ['warned', '宸茶鍛?, users.filter(u => u.status === 'warned').length],
          ['restricted', '鍙楅檺', users.filter(u => u.status === 'restricted').length]
        ].map(([id, lab, n]) => (
          <button key={id} className={scope === id ? 'on' : ''} onClick={() => setScope(id)}>
            {lab}<span className="n">{n}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-mini">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="鎼滅储鏄电О銆佸闄€佺敤鎴?ID鈥? />
        </div>
        <div className="toolbar-right">
          <button className="ghost-btn"><span className="material-symbols-outlined">sort</span>娉ㄥ唽鏃堕棿</button>
        </div>
      </div>

      <div className="user-table card">
        <div className="ut-head">
          <span>鐢ㄦ埛</span>
          <span>瀛﹂櫌 / 绛夌骇</span>
          <span>鍙戝竷 / 鎴愪氦</span>
          <span>璇勫垎</span>
          <span>涓炬姤</span>
          <span>娉ㄥ唽鏃堕棿</span>
          <span>鐘舵€?/span>
          <span>鎿嶄綔</span>
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
            <span>{u.rating > 0 ? <span className="ut-rating">鈽?{u.rating}</span> : <em>鈥?/em>}</span>
            <span>{u.reports > 0 ? <span className="ut-rep">{u.reports}</span> : <em>0</em>}</span>
            <span className="mono ut-date">{u.joined}</span>
            <span><span className={'st-pill ' + statusTone[u.status]}>{statusLabel[u.status]}</span></span>
            <span className="ut-acts">
              <button className="btn-sm">璇︽儏</button>
              <button className="btn-sm">路路路</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
// 5) Trades (lightweight)
function TradesPage() {
  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">浜ゆ槗鐩戞帶</div>
          <div className="sub">瀹炴椂瑙傛祴骞冲彴浜ゆ槗銆侀潰浜や笌閫€娆炬儏鍐?/div>
        </div>
      </div>
      <div className="kpi-grid">
        <KpiCard k="gmv" label="浠婃棩 GMV" value="楼48,260" delta="+22.1%" up hint="鏄ㄦ棩 楼39,520" icon="paid" tone="blue" />
        <KpiCard k="ord" label="浠婃棩璁㈠崟" value="184" delta="+18" up hint="鍧囦环 楼262" icon="receipt_long" tone="primary" />
        <KpiCard k="meet" label="浠婃棩闈氦" value="142" delta="+12.6%" up hint="瀹屾垚鐜?96.3%" icon="handshake" tone="green" />
        <KpiCard k="ref" label="浠婃棩閫€娆? value="3" delta="-2" up={false} hint="閫€娆剧巼 1.6%" icon="undo" tone="amber" />
      </div>
      <div className="card panel" style={{marginTop:18, padding:24}}>
        <div className="placeholder-block">
          <div className="ph-icn"><span className="material-symbols-outlined">timeline</span></div>
          <div>
            <div className="ph-t">瀹炴椂浜ゆ槗娴?路 鍗犱綅</div>
            <div className="ph-s">姝ゅ灏嗗睍绀烘寜鏃堕棿鎺掑簭鐨勪氦鏄撲簨浠舵祦銆侀€€娆惧伐鍗曘€佸紓甯歌鍗曞憡璀︺€?/div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6) Stats (placeholder)
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
          <div className="ttl">鏁版嵁鍒嗘瀽</div>
          <div className="sub">闀垮懆鏈熻秼鍔裤€佺暀瀛樸€佽浆鍖栨紡鏂楃瓑</div>
        </div>
      </div>
      <div className="kpi-grid">
        {loading ? adminPageLoading('Stats') : kpis.map(k => <KpiCard key={k.k} {...k} />)}
      </div>
      <div className="card panel" style={{padding:24}}>
        <div className="placeholder-block">
          <div className="ph-icn"><span className="material-symbols-outlined">insights</span></div>
          <div>
            <div className="ph-t">娣卞害鏁版嵁鐪嬫澘 路 鍗犱綅</div>
            <div className="ph-s">姝ゅ瑙勫垝锛欴AU/WAU/MAU 鐣欏瓨鏇茬嚎銆佸搧绫昏浆鍖栨紡鏂椼€侀潰浜ゆ垚鍔熺巼鐑姏鍥俱€佸闄㈤棿浜掗€氱煩闃点€?/div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 7) System (placeholder)
function SystemPage() {
  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">绯荤粺璁剧疆</div>
          <div className="sub">骞冲彴绾ч厤缃?路 浠呰秴绾х鐞嗗憳鍙</div>
        </div>
      </div>
      <div className="sys-grid">
        {[
          ['psychology_alt', '瀹℃牳绛栫暐', '鑷姩瀹℃牳闃堝€笺€佸叧閿瘝瑙﹀彂銆佷汉宸ュ厹搴?],
          ['block', '杩濈璇嶈瘝搴?, '褰撳墠 184 涓?路 涓婃鏇存柊 5/14'],
          ['category', '鍒嗙被涓庢爣绛?, '鍟嗗搧 14 绫汇€佽祫鏂?9 绫汇€佹嫑鍕?6 绫?],
          ['redeem', '绉垎瑙勫垯', '鍙戝竷 / 璇勪环 / 涓嬭浇绉垎濂栧姳閰嶇疆'],
          ['campaign', '鍏憡涓庢í骞?, '瀹樻柟鎺ㄩ€佷笌棣栭〉 banner 绠＄悊'],
          ['groups', '绠＄悊鍛樹笌鏉冮檺', '4 涓鑹?路 12 鍚嶈繍钀ユ垚鍛?]
        ].map(([icn, t, s], i) => (
          <div key={i} className="card sys-card">
            <div className="sys-icn"><span className="material-symbols-outlined">{icn}</span></div>
            <div className="sys-t">{t}</div>
            <div className="sys-s">{s}</div>
            <button className="ghost-btn" style={{marginTop:14}}><span className="material-symbols-outlined">arrow_forward</span>鎵撳紑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { OverviewPage, ReviewPage, ReportsPage, UsersPage, TradesPage, StatsPage, SystemPage });
