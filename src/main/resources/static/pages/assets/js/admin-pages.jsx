﻿// CampusShare Admin page renderers
const { useState: useStateAdm, useMemo: useMemoAdm, useEffect: useEffectAdm } = React;

/**
 * 管理员图片组件：通过 fetch 携带 X-Auth-Token 加载待审核商品图片
 */
function AdminImage({ fileId, alt, className }) {
  const [src, setSrc] = useStateAdm(null);
  const [status, setStatus] = useStateAdm('loading'); // loading | ok | err

  useEffectAdm(() => {
    if (!fileId) { setStatus('err'); return; }
    let revoked = false;
    const Api = window.CampusShareApi;
    const token = Api && Api.GetAuthToken ? Api.GetAuthToken() : null;
    const headers = token ? { 'X-Auth-Token': token } : {};
    fetch('/api/v1/admin/files/' + fileId, { headers })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var ct = res.headers.get('content-type') || '';
        if (!ct.startsWith('image/')) throw new Error('非图片响应: ' + ct);
        return res.blob();
      })
      .then(function(blob) {
        if (revoked) return;
        const url = URL.createObjectURL(blob);
        setSrc(url);
        setStatus('ok');
      })
      .catch(function() {
        if (!revoked) setStatus('err');
      });
    return function() {
      revoked = true;
      if (src) URL.revokeObjectURL(src);
    };
  }, [fileId]);

  if (status === 'loading') return (
    <div className={className} style={{display:'flex',alignItems:'center',justifyContent:'center',background:'var(--cs-bg-2)',borderRadius:10,border:'1px solid var(--cs-line)'}}>
      <span className="material-symbols-outlined" style={{fontSize:22,color:'var(--cs-muted)',animation:'spin 1s linear infinite'}}>sync</span>
    </div>
  );
  if (status === 'err') return (
    <div className={className} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,background:'var(--cs-bg-2)',borderRadius:10,border:'1px dashed var(--cs-line)'}}>
      <span className="material-symbols-outlined" style={{fontSize:20,color:'var(--cs-muted)'}}>broken_image</span>
      <span style={{fontSize:11,color:'var(--cs-muted)'}}>加载失败</span>
    </div>
  );
  return <img src={src} alt={alt} className={className} style={{objectFit:'cover',borderRadius:10,border:'1px solid var(--cs-line)',display:'block'}} />;
}

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
  const s = summary || {};
  return [
    { k: 'users',   label: '用户总数',   value: String(s.totalUserCount ?? '-'),           delta: '', up: true, hint: '活跃 ' + (s.activeUserCount ?? '-'),       icon: 'group',           tone: 'primary' },
    { k: 'content', label: '商品总数',   value: String(s.totalProductCount ?? '-'),         delta: '', up: true, hint: '已发布 ' + (s.publishedProductCount ?? '-'), icon: 'storefront',      tone: 'green'   },
    { k: 'pending', label: '待审核资料', value: String(s.pendingMaterialReviewCount ?? '-'), delta: '', up: true, hint: '审核队列',                                  icon: 'pending_actions', tone: 'amber'   },
    { k: 'reports', label: '待处理举报', value: String(s.pendingReportCount ?? '-'),         delta: '', up: true, hint: '举报队列',                                  icon: 'report',          tone: 'rose'    },
    { k: 'orders',  label: '订单总数',   value: String(s.totalOrderCount ?? '-'),            delta: '', up: true, hint: '进行中 ' + (s.ongoingOrderCount ?? '-'),    icon: 'trending_up',     tone: 'blue'    }
  ];
}

function adminPageCalcWaited(createTime) {
  if (!createTime) return '-';
  const created = new Date(createTime);
  if (isNaN(created.getTime())) return '-';
  const diffMs = Date.now() - created.getTime();
  if (diffMs < 0) return '刚刚';
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return diffMinutes + ' 分钟';
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return diffHours + ' 小时';
  return Math.floor(diffHours / 24) + ' 天';
}

function adminPageMapProduct(item) {
  const mapper = window.admMapProduct;
  if (typeof mapper === 'function') return mapper(item);
  const title = adminPageFirst(item.title, adminPageFirst(item.productTitle, 'Product'));
  const seller = adminPageFirst(item.sellerDisplayName, 'User');
  return { id: 'P-' + adminPageFirst(item.productId, adminPageFirst(item.id, '')), kind: 'goods', title, desc: adminPageFirst(item.description, ''), user: { name: seller, school: adminPageFirst(item.school, ''), letter: adminPageFirst(seller[0], 'U'), av1: '#ffd089', av2: '#f0a35a' }, waited: adminPageCalcWaited(item.createTime), flags: [], risk: 'low', price: item.price == null ? '-' : String(item.price), meta: adminPageFirst(item.category, 'Product'), ph: String(title).slice(0, 2), c1: '#dbeafe', c2: '#1d6fe0', raw: item };
}

function adminPageMapMaterial(item) {
  const mapper = window.admMapMaterial;
  if (typeof mapper === 'function') return mapper(item);
  const title = adminPageFirst(item.courseName, adminPageFirst(item.title, adminPageFirst(item.materialTitle, 'Material')));
  const owner = adminPageFirst(item.uploaderDisplayName, 'User');
  return { id: 'M-' + adminPageFirst(item.materialId, adminPageFirst(item.id, '')), kind: 'notes', title, desc: adminPageFirst(item.description, ''), user: { name: owner, school: adminPageFirst(item.school, ''), letter: adminPageFirst(owner[0], 'U'), av1: '#c4b5fd', av2: '#7c3aed' }, waited: adminPageCalcWaited(item.createTime), flags: [], risk: 'low', price: adminPageFirst(item.fileType, 'Material'), meta: adminPageFirst(item.category, 'Material'), ph: String(title).slice(0, 2), c1: '#c4b5fd', c2: '#7c3aed', raw: item };
}

function adminPageMapRecruitment(item) {
  const mapper = window.admMapRecruitment;
  if (typeof mapper === 'function') return mapper(item);
  const title = adminPageFirst(item.eventName, adminPageFirst(item.title, 'Team'));
  const publisher = adminPageFirst(item.publisherDisplayName, 'User');
  return { id: 'T-' + adminPageFirst(item.recruitmentId, adminPageFirst(item.id, '')), kind: 'team', title, desc: adminPageFirst(item.skillRequirement, adminPageFirst(item.description, '')), user: { name: publisher, school: '', letter: adminPageFirst(publisher[0], 'U'), av1: '#a7f3d0', av2: '#0a8a4f' }, waited: adminPageCalcWaited(item.createTime), flags: [], risk: 'low', price: adminPageFirst(item.direction, 'Team'), meta: adminPageFirst(item.direction, 'Team'), ph: String(title).slice(0, 2), c1: '#a7f3d0', c2: '#0a8a4f', raw: item };
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
  const name = adminPageFirst(item.displayName, adminPageFirst(item.nickname, adminPageFirst(item.realName, 'User')));
  const roleLabels = { VISITOR: '访客', STUDENT: '学生', VERIFIED_SELLER: '认证卖家', ADMINISTRATOR: '管理员' };
  const statusKeys = { ACTIVE: 'active', FROZEN: 'restricted', PENDING_REVIEW: 'pending', REJECTED: 'restricted' };
  const rawStatus = String(item.userStatus || '').toUpperCase();
  return {
    id: adminPageFirst(item.userId, adminPageFirst(item.id, '-')),
    name,
    letter: adminPageFirst(name[0], 'U'),
    av1: '#9ec5e8',
    av2: '#5b87c0',
    school: adminPageFirst(item.college, adminPageFirst(item.schoolName, adminPageFirst(item.school, ''))),
    grade: adminPageFirst(item.grade, ''),
    level: roleLabels[String(item.userRole || '').toUpperCase()] || adminPageFirst(item.userRole, 'USER'),
    verified: item.userRole === 'VERIFIED_SELLER' || item.userRole === 'ADMINISTRATOR',
    joined: adminPageFirst(item.lastLoginTime, adminPageFirst(item.createTime, '-')),
    status: statusKeys[rawStatus] || 'active',
    raw: item
  };
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
  if (!data || !data.length) {
    return (
      <div style={{padding: '40px 0', textAlign: 'center', color: 'var(--cs-muted)', fontSize: 13}}>
        暂无趋势数据
      </div>
    );
  }
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
  const [expanded, setExpanded] = useStateAdm(false);
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

  const raw = item.raw || {};
  const imageFileIds = Array.isArray(raw.imageFileIds) ? raw.imageFileIds : [];

  return (
    <div className={'review-row' + (compact ? ' compact' : '') + (expanded ? ' rv-has-detail' : '')}>
      <div className="rv-thumb" style={{'--c1': item.c1, '--c2': item.c2}}>{item.ph}</div>
      <div className="rv-body">
        <div className="rv-top">
          <KindTag kind={item.kind} />
          {item.flags.map((f, i) => <span key={i} className="flag-tag">提示 · {f}</span>)}
          <RiskTag risk={item.risk} />
        </div>
        <div className="rv-title">{item.title}</div>
        {!compact && <div className="rv-desc">{item.desc}</div>}
        <div className="rv-meta">
          <span className="rv-user">
            <span className="rv-av" style={{background: `linear-gradient(135deg, ${item.user.av1}, ${item.user.av2})`}}>{item.user.letter}</span>
            {item.user.name}{item.user.school ? ' · ' + item.user.school : ''}
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
          已等待 <b>{item.waited}</b>
        </div>
        {!compact && (
          <button className="btn-sm rv-toggle-btn" onClick={() => setExpanded(function(e) { return !e; })}>
            <span className="material-symbols-outlined">{expanded ? 'expand_less' : 'image_search'}</span>
            {expanded ? '收起详情' : '查看详情'}
          </button>
        )}
        <div className="rv-actions">
          <button className="btn-sm danger" onClick={() => reviewItem(false)}><span className="material-symbols-outlined">close</span>驳回</button>
          <button className="btn-sm"><span className="material-symbols-outlined">flag</span>需修改</button>
          <button className="btn-sm primary" onClick={() => reviewItem(true)}><span className="material-symbols-outlined">check</span>通过</button>
        </div>
      </div>

      {!compact && expanded && (
        <div className="rv-detail-panel">
          {item.kind === 'goods' && (
            <div className="rv-detail-images">
              {imageFileIds.length > 0 ? imageFileIds.map(function(fid, i) {
                return (
                  <div key={i} className="rv-img-slot">
                    <AdminImage
                      fileId={fid}
                      alt={i === 0 ? '封面' : '图片' + (i + 1)}
                      className="rv-img-thumb"
                    />
                    <div className="rv-img-caption">{i === 0 ? '封面' : '图片 ' + (i + 1)}</div>
                  </div>
                );
              }) : (
                <div className="rv-img-none">
                  <span className="material-symbols-outlined">hide_image</span>
                  暂无图片
                </div>
              )}
            </div>
          )}
          <div className="rv-detail-fields">
            {item.kind === 'goods' && [
              ['分类', raw.category],
              ['成色', raw.conditionLevel],
              ['定价', raw.price != null ? '¥' + raw.price : null],
              ['交易地点', raw.tradeLocation],
              ['卖家', item.user.name],
              ['提交时间', raw.createTime ? String(raw.createTime).replace('T', ' ').slice(0, 16) : null]
            ].map(function(pair, i) {
              var k = pair[0], v = pair[1];
              return (
                <div key={i} className="rv-df-item">
                  <span className="rv-df-k">{k}</span>
                  <span style={k === '定价' ? {color:'var(--cs-primary)',fontWeight:700} : {}}>{v || '-'}</span>
                </div>
              );
            })}
            {item.kind === 'notes' && [
              ['课程名', raw.courseName],
              ['标签', Array.isArray(raw.tags) ? raw.tags.join('、') : raw.tags],
              ['文件类型', raw.fileType],
              ['上传者', item.user.name],
              ['提交时间', raw.createTime ? String(raw.createTime).replace('T', ' ').slice(0, 16) : null]
            ].map(function(pair, i) {
              var k = pair[0], v = pair[1];
              return (
                <div key={i} className="rv-df-item">
                  <span className="rv-df-k">{k}</span>
                  <span>{v || '-'}</span>
                </div>
              );
            })}
            {item.kind === 'team' && [
              ['活动名称', raw.eventName],
              ['方向', raw.direction],
              ['截止日期', raw.deadline ? String(raw.deadline).slice(0, 10) : null],
              ['技能要求', raw.skillRequirement],
              ['发布者', item.user.name],
              ['提交时间', raw.createTime ? String(raw.createTime).replace('T', ' ').slice(0, 16) : null]
            ].map(function(pair, i) {
              var k = pair[0], v = pair[1];
              return (
                <div key={i} className="rv-df-item">
                  <span className="rv-df-k">{k}</span>
                  <span>{v || '-'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Pages
// -----------------------------------------------------------------------------
function OverviewPage({ goReview, goReports }) {
  const [loading, setLoading] = useStateAdm(true);
  const [kpis, setKpis] = useStateAdm([]);
  const [summary, setSummary] = useStateAdm(null);

  useEffectAdm(() => {
    let alive = true;
    const Api = window.CampusShareApi;
    if (!Api || !Api.GetAdminDashboardSummary) {
      setLoading(false);
      return () => { alive = false; };
    }
    Api.GetAdminDashboardSummary()
      .then(s => { if (alive) { setSummary(s); setKpis(adminPageSummaryKpis(s)); } })
      .catch(() => { if (alive) { setSummary(null); setKpis([]); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return adminPageLoading('Overview');

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">&#x8FD0;&#x8425;&#x603B;&#x89C8;</div>
          <div className="sub">CampusShare &#x5E73;&#x53F0;&#x5065;&#x5EB7;&#x5EA6; &#x00B7; {new Date().toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})} &#x66F4;&#x65B0;</div>
        </div>
        <div className="actions">
          <button className="ghost-btn" onClick={() => alert('敬请期待')}><span className="material-symbols-outlined">download</span>&#x5BFC;&#x51FA;&#x65E5;&#x62A5;</button>
          <button className="primary-btn" onClick={() => alert('敬请期待')}><span className="material-symbols-outlined">campaign</span>&#x53D1;&#x5E03;&#x516C;&#x544A;</button>
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
            <div><span className="lab">7日新增用户</span><span className="val">{summary ? (summary.sevenDayNewUserCount ?? '-') : '-'}</span></div>
            <div><span className="lab">订单总数</span><span className="val">{summary ? (summary.totalOrderCount ?? '-') : '-'}</span></div>
            <div><span className="lab">活跃用户</span><span className="val">{summary ? (summary.activeUserCount ?? '-') : '-'}</span></div>
            <div><span className="lab">7日新增订单</span><span className="val">{summary ? (summary.sevenDayNewOrderCount ?? '-') : '-'}</span></div>
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
            <button className="qa-btn" onClick={goReview}><span className="material-symbols-outlined">verified</span><b>批量审核</b><i>{ADM_REVIEW_QUEUE.length} 项待处理</i></button>
            <button className="qa-btn" onClick={goReports}><span className="material-symbols-outlined">flag</span><b>处理举报</b><i>{ADM_REPORTS.length} 项待处理</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">block</span><b>违禁词词库</b><i>规则配置</i></button>
            <button className="qa-btn" onClick={() => alert('敬请期待')}><span className="material-symbols-outlined">campaign</span><b>发布公告</b><i>系统公告管理</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">redeem</span><b>积分活动</b><i>积分规则配置</i></button>
            <button className="qa-btn"><span className="material-symbols-outlined">support_agent</span><b>客服工单</b><i>工单管理</i></button>
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
  const [queue, setQueue] = useStateAdm([]);
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
      setQueue([]);
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
    }).catch(() => { if (alive) setQueue([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">&#x5185;&#x5BB9;&#x5BA1;&#x6838;</div>
          <div className="sub">共 <b style={{color:'var(--cs-ink)'}}>{queue.length}</b> 项待审核</div>
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
  const [reports, setReports] = useStateAdm([]);
  const filtered = useMemoAdm(() => {
    if (sev === 'all') return reports;
    return reports.filter(r => r.severity === sev);
  }, [sev, reports]);

  useEffectAdm(() => {
    let alive = true;
    const Api = window.CampusShareApi;
    if (!Api || !Api.ListPendingReports) {
      setReports([]);
      setLoading(false);
      return () => { alive = false; };
    }
    Api.ListPendingReports()
      .then(result => { if (alive) setReports(adminPageListOf(result).map(adminPageMapReport)); })
      .catch(() => { if (alive) setReports([]); })
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
          <div className="sub">用户提交与系统检测的违规线索</div>
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
              <button className="btn-sm">查看</button>
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
  const [users, setUsers] = useStateAdm([]);
  const filtered = useMemoAdm(() => {
    if (scope === 'all') return users;
    return users.filter(u => u.status === scope);
  }, [scope, users]);

  useEffectAdm(() => {
    let alive = true;
    const Api = window.CampusShareApi;
    if (!Api || !Api.ListUsersByAdmin) {
      setUsers([]);
      setLoading(false);
      return () => { alive = false; };
    }
    Api.ListUsersByAdmin(1, 50)
      .then(result => { if (alive) setUsers(adminPageListOf(result).map(adminPageMapUser)); })
      .catch(() => { if (alive) setUsers([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const statusLabel = { active: '正常', pending: '待审核', restricted: '冻结' };
  const statusTone  = { active: 'green', pending: 'amber', restricted: 'rose' };

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">&#x7528;&#x6237;&#x7BA1;&#x7406;</div>
          <div className="sub">累计注册 <b style={{color:'var(--cs-ink)'}}>{ADM_SUMMARY ? (ADM_SUMMARY.totalUserCount ?? '-') : '-'}</b> · 7 日新增 <b style={{color:'var(--cs-ink)'}}>+{ADM_SUMMARY ? (ADM_SUMMARY.sevenDayNewUserCount ?? '-') : '-'}</b> · 活跃 <b style={{color:'var(--cs-ink)'}}>{ADM_SUMMARY ? (ADM_SUMMARY.activeUserCount ?? '-') : '-'}</b></div>
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
          ['pending', '待审核', users.filter(u => u.status === 'pending').length],
          ['restricted', '冻结', users.filter(u => u.status === 'restricted').length]
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
          <span>用户</span>
          <span>学院 / 角色</span>
          <span>积分</span>
          <span>账号</span>
          <span>邮箱</span>
          <span>末次登录</span>
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
            <span>{u.raw ? (u.raw.pointBalance ?? '-') : '-'}</span>
            <span className="mono">{u.raw ? (u.raw.account ?? '-') : '-'}</span>
            <span>{u.raw ? (u.raw.email ?? '-') : '-'}</span>
            <span className="mono ut-date">{u.joined ? String(u.joined).replace('T', ' ').slice(0, 16) : '-'}</span>
            <span><span className={'st-pill ' + statusTone[u.status]}>{statusLabel[u.status]}</span></span>
            <span className="ut-acts">
              <button className="btn-sm" onClick={() => { const info = u.raw || {}; window.alert("昵称: " + u.name + "\nID: " + u.id + "\n学院: " + u.school + (u.grade ? " " + u.grade : "") + "\n角色: " + u.level + "\n状态: " + (info.userStatus || u.status) + "\n积分: " + (info.pointBalance ?? "-") + "\n邮箱: " + (info.email || info.account || "-")); }}>详情</button>
              {u.status !== "restricted" ? (
                <button className="btn-sm danger" onClick={() => { const Api = window.CampusShareApi; if (!Api || !Api.FreezeUserByAdmin) return; if (!window.confirm("确认冻结用户 " + u.name + "？")) return; Api.FreezeUserByAdmin(u.id).then(() => window.location.reload()).catch(e => window.alert("操作失败: " + e.message)); }}>冻结</button>
              ) : (
                <button className="btn-sm" onClick={() => { const Api = window.CampusShareApi; if (!Api || !Api.UnfreezeUserByAdmin) return; if (!window.confirm("确认解冻用户 " + u.name + "？")) return; Api.UnfreezeUserByAdmin(u.id).then(() => window.location.reload()).catch(e => window.alert("操作失败: " + e.message)); }}>解冻</button>
              )}
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
  const [loading, setLoading] = useStateAdm(true);
  const [summary, setSummary] = useStateAdm(null);

  useEffectAdm(() => {
    let alive = true;
    const Api = window.CampusShareApi;
    if (!Api || !Api.GetAdminDashboardSummary) {
      setLoading(false);
      return () => { alive = false; };
    }
    Api.GetAdminDashboardSummary()
      .then(s => { if (alive) setSummary(s); })
      .catch(() => { if (alive) setSummary(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const v = (field) => summary && summary[field] != null ? String(summary[field]) : '-';

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block">
          <div className="ttl">交易监控</div>
          <div className="sub">平台交易订单状态总览</div>
        </div>
      </div>
      {loading ? adminPageLoading('交易监控') : (
        <div className="kpi-grid">
          <KpiCard k="ord" label="订单总数" value={v('totalOrderCount')} delta="" up hint={'进行中 ' + v('ongoingOrderCount')} icon="receipt_long" tone="primary" />
          <KpiCard k="done" label="已完成订单" value={v('completedOrderCount')} delta="" up hint="交易完成" icon="handshake" tone="green" />
          <KpiCard k="cancel" label="已取消订单" value={v('canceledOrderCount')} delta="" up={false} hint="买家取消" icon="cancel" tone="amber" />
          <KpiCard k="close" label="已关闭订单" value={v('closedOrderCount')} delta="" up={false} hint="纠纷关闭" icon="lock" tone="rose" />
        </div>
      )}
      <div className="card panel" style={{marginTop:18, padding:24}}>
        <div className="placeholder-block">
          <div className="ph-icn"><span className="material-symbols-outlined">timeline</span></div>
          <div>
            <div className="ph-t">实时交易流 · 占位</div>
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
  const [kpis, setKpis] = useStateAdm([]);

  useEffectAdm(() => {
    let alive = true;
    const Api = window.CampusShareApi;
    if (!Api || !Api.GetAdminDashboardSummary) {
      setLoading(false);
      return () => { alive = false; };
    }
    Api.GetAdminDashboardSummary()
      .then(summary => { if (alive) setKpis(adminPageSummaryKpis(summary)); })
      .catch(() => { if (alive) setKpis([]); })
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
