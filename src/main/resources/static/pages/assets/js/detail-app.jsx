// CampusShare Detail — API-integrated version.
// Reads ?type=product|material|recruit&id=<n> from URL; falls back to tweaks preview mode.

const { useState, useEffect, useRef, useMemo } = React;

// ─── URL params ───
const _urlParams  = new URLSearchParams(window.location.search);
const URL_TYPE    = _urlParams.get('type');   // 'product' | 'material' | 'recruit'
const URL_ID      = parseInt(_urlParams.get('id'), 10) || null;
const IS_PREVIEW  = !URL_TYPE || !URL_ID;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "product",
  "showCountdown": true,
  "showRelated": true,
  "favored": false
}/*EDITMODE-END*/;

// ─── API config ───
const API_BASE = '/api/v1';

// ─── Helpers ───
const CATEGORY_PALETTE = {
  '教材书籍':    { c1: '#9ec5e8', c2: '#5b87c0' },
  '电子产品':    { c1: '#e6cf94', c2: '#b88a3e' },
  '生活用品':    { c1: '#cbd5e1', c2: '#64748b' },
  '服饰鞋包':    { c1: '#fda4af', c2: '#be123c' },
  '运动器材':    { c1: '#a7f3d0', c2: '#0a8a4f' },
  '乐器':        { c1: '#c4b5fd', c2: '#7c3aed' },
  '出行/自行车': { c1: '#fdba74', c2: '#c2410c' },
};

const FILE_TYPE_ICON = {
  PDF: 'picture_as_pdf', WORD: 'description', PPT: 'slideshow',
  EXCEL: 'table_chart', IMAGE: 'image', ZIP: 'folder_zip', OTHER: 'attach_file',
};

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatRelTime(iso) {
  if (!iso) return '刚刚';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

function formatDeadline(iso) {
  if (!iso) return '待定';
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function daysUntil(iso) {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

// ─── Preview mock data (used only when no URL params) ───
const PREVIEW_DATA = {
  product: {
    title: 'iPad Air 4 · 64G · 自用一年 · 配 Apple Pencil 二代',
    status: { kind: 'open', label: '在售中' },
    meta: { cat: '电子产品', city: '独墅湖校区', posted: '2 天前发布', views: 1248, fav: 87 },
    tags: ['九成新', '可面交', '含 Apple Pencil 二代'],
    price: 2680, orig: 4799,
    desc: '自用一年，期间一直贴膜带壳，外观接近九成新。随机附赠原装充电器、Type-C 数据线、Apple Pencil 二代（盒装无损）。',
    specs: [
      { l: '型号', v: 'iPad Air (第 4 代)' },
      { l: '存储', v: '64 GB · Wi-Fi' },
      { l: '成色', v: '九成新' },
      { l: '交货方式', v: '面交' },
    ],
    gallery: [
      { c1: '#e6cf94', c2: '#b88a3e', glyph: 'iPad' },
      { c1: '#9ec5e8', c2: '#5b87c0', glyph: '正面' },
    ],
    seller: { name: '林同学', avBg: 'linear-gradient(135deg,#fda4af,#be123c)', initial: '林' },
    imageFileIds: [],
    stockCount: 1,
  },
  material: {
    title: '数据结构与算法 · 历年真题（2018 – 2024）含详解',
    status: { kind: 'open', label: '可下载' },
    meta: { cat: '工学院 · 计算机科学', course: 'CS101 · 数据结构', posted: '2026.03.14 上传', views: 3260, fav: 412 },
    tags: ['期末真题', '考研常考', '配套源码', '已通过审核'],
    cost: 10,
    desc: '本资料汇编了 2018 – 2024 共 7 年校内期末试卷及考研真题，包含原题影印 + 全部题目的详细解答。',
    cover: { c1: '#dcfce7', c2: '#16a34a', kind: 'PDF · 学习资料', icon: 'description', pages: 234, title: '数据结构与算法' },
    uploader: { name: '何同学', avBg: 'linear-gradient(135deg,#6ed3d7,#2a8d99)', initial: '何' },
    fileId: null,
    fileSizeBytes: 0,
    downloadCount: 1240,
  },
  recruit: {
    title: '挑战杯参赛队组队 · 智能家居方向',
    status: { kind: 'few', label: '名额紧张' },
    meta: { cat: '竞赛 · 校级 → 国赛', org: '工学院 · 张同学', posted: '5 天前发布', views: 884, fav: 64 },
    tags: ['可计实践学分', '需嵌入式基础'],
    desc: '项目方向：基于多模态感知的智能家居控制系统。还需要 1 位前端同学，1 位负责论文与答辩 PPT 的同学。',
    roles: [
      { name: '前端 / iOS 工程师', req: '熟悉 SwiftUI 或 React Native', slots: '1 / 1', icon: 'phone_iphone' },
      { name: '论文 & 答辩负责', req: '有过商赛/科创经验，熟悉 LaTeX 或 Keynote', slots: '1 / 1', icon: 'description' },
    ],
    timeline: [
      { date: '已完成 · 04.20', t: '初步立项', sub: '完成赛题方向与导师确认', done: true },
      { date: '进行中 · 05.16', t: '硬件原型搭建', sub: '本周开始协同开发', done: false },
      { date: '截止 · 05.20', t: '组队报名截止', sub: '提交完整 5 人名单', done: false },
    ],
    publisher: { name: '张同学', avBg: 'linear-gradient(135deg,#c4b5fd,#7c3aed)', initial: '张' },
    memberLimit: 5, currentMemberCount: 3, deadline: null,
    canApply: true, hasApplied: false,
  },
};

const PREVIEW_COMMENTS = [
  { id: 1, fromUserDisplayName: '陈同学', score: 5, content: '请问还有别的颜色吗？', createTime: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, fromUserDisplayName: '林同学', score: 4, content: '电池健康不错，可以约这周末面交吗？', createTime: new Date(Date.now() - 10800000).toISOString() },
];

// ─── Nav ───
function Nav() {
  const searchRef = useRef(null);
  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent),
    []
  );

  useEffect(() => {
    const onDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, []);

  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand">
          <div className="logo"><span className="material-symbols-outlined">school</span></div>
          <span className="name">CampusShare</span>
        </div>

        <div className="search-wrap">
          <span className="material-symbols-outlined">search</span>
          <input ref={searchRef} type="text" placeholder="搜索二手商品、学习资料、组队项目…" />
          <span className="kbd" aria-hidden="true">
            <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
            <kbd>K</kbd>
          </span>
        </div>

        <nav className="nav-links">
          <button className="nav-link" onClick={() => window.location.href = '/pages/market_overview.html'}>主页</button>
          <button className="nav-link active">交易市场</button>
          <button className="nav-link">学术资源</button>
          <button className="nav-link">校园论坛</button>
        </nav>

        <div className="nav-right">
          <button className="icon-btn" title="消息">
            <span className="material-symbols-outlined">notifications</span>
            <span className="dot-badge">3</span>
          </button>
          <button className="icon-btn" title="收藏">
            <span className="material-symbols-outlined">favorite</span>
          </button>
          <button className="primary-btn">
            <span className="material-symbols-outlined">add</span>
            发布
          </button>
          <button className="avatar-btn" title="我的">我</button>
        </div>
      </div>
    </header>
  );
}

// ─── Crumb row ───
function Crumb({ mode, title }) {
  const catLabel = { product: '交易市场', material: '学习资源', recruit: '组队招募' }[mode];
  const shortTitle = title ? title.slice(0, 20) + (title.length > 20 ? '…' : '') : '详情';
  return (
    <div className="crumb">
      <div className="crumb-left">
        <a onClick={() => window.location.href = '/pages/market_overview.html'} style={{ cursor: 'pointer' }}>主页</a>
        <span className="material-symbols-outlined">chevron_right</span>
        <a onClick={() => window.location.href = '/pages/market_listing.html'} style={{ cursor: 'pointer' }}>{catLabel}</a>
        <span className="material-symbols-outlined">chevron_right</span>
        <span className="cur">{shortTitle}</span>
      </div>
      <button className="back-btn" onClick={() => window.history.back()}>
        <span className="material-symbols-outlined">arrow_back</span>
        返回列表
      </button>
    </div>
  );
}

// ─── Hero visuals ───
function ProductGallery({ imageFileIds, category, title }) {
  const [idx, setIdx] = useState(0);
  const palette = CATEGORY_PALETTE[category] || { c1: '#e2e8f0', c2: '#cbd5e1' };
  const hasImages = imageFileIds && imageFileIds.length > 0;
  const count = hasImages ? imageFileIds.length : 1;
  const go = (d) => setIdx((idx + d + count) % count);

  return (
    <div className="hero-visual">
      <div className="gallery-main" style={{ '--g1': palette.c1, '--g2': palette.c2 }}>
        {hasImages ? (
          <img
            src={`${API_BASE}/files/${imageFileIds[idx]}`}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="glyph">{(category || '品')[0]}</div>
        )}
        {count > 1 && (
          <>
            <button className="img-nav left" onClick={() => go(-1)} aria-label="上一张">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="img-nav right" onClick={() => go(1)} aria-label="下一张">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <div className="img-counter">{(idx + 1).toString().padStart(2, '0')} / {count.toString().padStart(2, '0')}</div>
          </>
        )}
      </div>
      {hasImages && imageFileIds.length > 1 && (
        <div className="gallery-thumbs">
          {imageFileIds.map((fid, i) => (
            <div
              key={fid}
              className={'thumb' + (i === idx ? ' active' : '')}
              style={{ '--c1': palette.c1, '--c2': palette.c2 }}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialCover({ data }) {
  const icon = FILE_TYPE_ICON[data.fileType] || 'description';
  const c1 = '#dcfce7', c2 = '#16a34a';
  return (
    <div className="hero-visual">
      <div className="material-cover" style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}>
        <div className="doc-icon">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div style={{ width: '100%' }}>
          <span className="meta-tag">{data.fileType || 'FILE'} · 学习资料</span>
          <h1 className="headline" style={{
            margin: '14px 0 4px', fontWeight: 800,
            fontSize: 'clamp(22px, 2.3vw, 28px)', color: '#fff',
            lineHeight: 1.25, letterSpacing: '-0.02em', maxWidth: 520,
          }}>
            {data.courseName || data.title}
          </h1>
          <div className="toc-preview">
            <span><span className="material-symbols-outlined">folder_zip</span>{formatBytes(data.fileSizeBytes)}</span>
            <span><span className="material-symbols-outlined">download</span>{(data.downloadCount || 0).toLocaleString()} 次下载</span>
            {data.copyrightDeclared && (
              <span><span className="material-symbols-outlined">verified</span>已声明版权 · 审核通过</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecruitBanner({ data }) {
  const dirIcon = { 科研: 'science', 竞赛: 'emoji_events', 项目: 'work', 实习: 'business_center' };
  const filled = data.currentMemberCount || 0;
  const total = data.memberLimit || 1;
  return (
    <div className="hero-visual">
      <div className="recruit-banner">
        <span className="type-pill">
          <span className="material-symbols-outlined">{dirIcon[data.direction] || 'groups'}</span>
          {data.direction || '组队'}
        </span>
        <h1 className="headline" style={{
          margin: '16px 0 10px', fontWeight: 800,
          fontSize: 'clamp(24px, 2.6vw, 32px)', color: '#fff',
          lineHeight: 1.2, letterSpacing: '-0.02em',
        }}>
          {data.eventName}
        </h1>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: 620 }}>
          {data.skillRequirement}
        </div>
        <div style={{ marginTop: 22, display: 'flex', gap: 28, fontSize: 13, color: 'rgba(255,255,255,0.92)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
            已组 {filled} / {total} 人
          </span>
          {data.deadline && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>event</span>
              {formatDeadline(data.deadline)} 截止
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>how_to_reg</span>
            {data.applicationCount || 0} 人申请中
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Title block ───
function TitleBlock({ data, mode }) {
  const showTitle = mode === 'product';
  return (
    <div className="title-block">
      <div className="title-row">
        {showTitle && <h1 className="h1">{data.title}</h1>}
        {!showTitle && (
          <div style={{ flex: 1, fontFamily: 'Manrope', fontWeight: 700, fontSize: 15, color: 'var(--cs-muted)' }}>
            {data.meta?.cat}
          </div>
        )}
        <span className={'status-pill ' + (data.status.kind === 'few' ? 'few' : 'open')}>
          <span className="dot" />
          {data.status.label}
        </span>
      </div>

      <div className="meta-row">
        {showTitle && data.meta?.cat && <span><span className="material-symbols-outlined">category</span>{data.meta.cat}</span>}
        {data.meta?.city && (
          <>
            <span className="dot" />
            <span><span className="material-symbols-outlined">place</span>{data.meta.city}</span>
          </>
        )}
        {data.meta?.course && (
          <span><span className="material-symbols-outlined">school</span>{data.meta.course}</span>
        )}
        {data.meta?.org && (
          <span><span className="material-symbols-outlined">apartment</span>{data.meta.org}</span>
        )}
        {data.meta?.posted && (
          <>
            <span className="dot" />
            <span><span className="material-symbols-outlined">schedule</span>{data.meta.posted}</span>
          </>
        )}
        {data.meta?.views > 0 && (
          <>
            <span className="dot" />
            <span><span className="material-symbols-outlined">visibility</span>{data.meta.views.toLocaleString()} 次浏览</span>
          </>
        )}
      </div>

      <div className="tags-row">
        {(data.tags || []).map(t => <span key={t} className="tag-chip">{t}</span>)}
      </div>
    </div>
  );
}

// ─── Content sections ───
function DescriptionSection({ text }) {
  if (!text) return null;
  return (
    <section className="section">
      <h2><span className="material-symbols-outlined">description</span>详情描述</h2>
      <div className="body-text">
        {text.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </section>
  );
}

function SpecsSection({ specs }) {
  if (!specs?.length) return null;
  return (
    <section className="section">
      <h2><span className="material-symbols-outlined">list_alt</span>规格参数</h2>
      <div className="specs-grid">
        {specs.map(s => (
          <div key={s.l} className="spec-cell">
            <div className="l">{s.l}</div>
            <div className="v">{s.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MaterialInfoSection({ data }) {
  const rows = [
    data.fileType      && { l: '文件类型', v: data.fileType },
    data.fileSizeBytes && { l: '文件大小', v: formatBytes(data.fileSizeBytes) },
    data.tags          && { l: '标签',     v: data.tags },
    data.downloadCostPoints != null && { l: '下载积分', v: data.downloadCostPoints === 0 ? '免费' : `${data.downloadCostPoints} 积分` },
    data.copyrightDeclared != null && { l: '版权声明', v: data.copyrightDeclared ? '已声明' : '未声明' },
  ].filter(Boolean);
  if (!rows.length) return null;
  return (
    <section className="section">
      <h2><span className="material-symbols-outlined">list_alt</span>资料信息</h2>
      <div className="specs-grid">
        {rows.map(s => (
          <div key={s.l} className="spec-cell">
            <div className="l">{s.l}</div>
            <div className="v">{s.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RolesSection({ roles }) {
  if (!roles?.length) return null;
  return (
    <section className="section">
      <h2><span className="material-symbols-outlined">badge</span>招募岗位</h2>
      <div className="roles-list">
        {roles.map(r => (
          <div className="role-card" key={r.name}>
            <div className="icn"><span className="material-symbols-outlined">{r.icon || 'person'}</span></div>
            <div className="info">
              <div className="name">{r.name}</div>
              <div className="req">{r.req}</div>
            </div>
            <span className="slots"><span className="num">{r.slots.split(' / ')[0]}</span>/ {r.slots.split(' / ')[1]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineSection({ timeline }) {
  if (!timeline?.length) return null;
  return (
    <section className="section">
      <h2><span className="material-symbols-outlined">timeline</span>项目时间线</h2>
      <div className="timeline">
        {timeline.map((t, i) => (
          <div key={i} className={'timeline-row' + (t.done ? ' done' : '')}>
            <div className="t-date">{t.date}</div>
            <div className="t-text">{t.t}</div>
            <div className="t-sub">{t.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Comments section ───
function StarInput({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: n <= value ? '#f59e0b' : '#d1d5db', padding: '0 2px',
          }}
          title={`${n} 分`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function CommentsSection({ productId, comments, totalCount, averageScore, onCommentPosted }) {
  const [text, setText] = useState('');
  const [score, setScore] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, content: text.trim() }),
      });
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.message || '发布失败');
      setText('');
      setScore(5);
      onCommentPosted?.();
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
  };

  return (
    <section className="section">
      <h2>
        <span className="material-symbols-outlined">forum</span>
        评价与留言
        <span style={{
          marginLeft: 4, fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12, fontWeight: 600, color: 'var(--cs-muted-2)',
        }}>· {totalCount || comments.length}</span>
        {averageScore > 0 && (
          <span style={{ marginLeft: 8, fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
            ★ {averageScore.toFixed(1)}
          </span>
        )}
      </h2>

      {productId && (
        <div className="comment-input">
          <div className="av">我</div>
          <div className="comment-input-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--cs-muted)' }}>评分：</span>
              <StarInput value={score} onChange={setScore} />
            </div>
            <textarea
              placeholder="提一个友好的问题，或者留下你的看法…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
            />
            <div className="comment-input-actions">
              <span className="hint">⌘ + Enter 发送 · 留言将公开显示</span>
              <button onClick={submit} disabled={submitting || !text.trim()}>
                {submitting ? '发布中…' : '发布'}
              </button>
            </div>
            {submitError && (
              <div style={{ color: 'var(--cs-error, #dc2626)', fontSize: 12, marginTop: 4 }}>{submitError}</div>
            )}
          </div>
        </div>
      )}

      {comments.map(c => (
        <div className="comment" key={c.commentId || c.id}>
          <div className="av">{(c.fromUserDisplayName || '?')[0]}</div>
          <div className="comment-body">
            <div className="comment-head">
              <span className="name">{c.fromUserDisplayName}</span>
              {c.score > 0 && (
                <span style={{ fontSize: 12, color: '#f59e0b', marginLeft: 4 }}>{'★'.repeat(c.score)}</span>
              )}
              <span className="when">{formatRelTime(c.createTime)}</span>
            </div>
            <div className="comment-text">{c.content}</div>
            <div className="comment-actions">
              <button><span className="material-symbols-outlined">thumb_up</span>有用</button>
              <button><span className="material-symbols-outlined">reply</span>回复</button>
              <button><span className="material-symbols-outlined">flag</span>举报</button>
            </div>
          </div>
        </div>
      ))}

      {totalCount > comments.length && (
        <div className="comment-more">
          <button>查看全部 {totalCount} 条评价 ↓</button>
        </div>
      )}
    </section>
  );
}

// ─── Side cards ───
function ProductPriceCard({ data, favored, setFavored, onBuy }) {
  const price = data.price || 0;
  const orig = data.orig;
  const save = orig ? orig - price : 0;
  const pct = orig ? Math.round((save / orig) * 100) : 0;
  const [favLoading, setFavLoading] = useState(false);

  const toggleFav = async () => {
    if (favLoading || !data.id) return;
    setFavLoading(true);
    const prev = favored;
    setFavored(!favored);
    try {
      const res = await fetch(`${API_BASE}/favorites/products/${data.id}/toggle`, { method: 'POST' });
      const json = await res.json();
      if (json.code === 0) setFavored(json.data.favorited);
      else setFavored(prev);
    } catch {
      setFavored(prev);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="side-card price-card">
      <div className="price-tag">
        <span className="y">¥</span>
        <span className="v">{price.toLocaleString()}</span>
        {orig > 0 && <span className="orig">¥{orig.toLocaleString()}</span>}
      </div>
      {save > 0 && (
        <div className="price-save">
          <span className="material-symbols-outlined">savings</span>
          校园价 · 较新品节省 ¥{save.toLocaleString()} ({pct}% off)
        </div>
      )}

      <div className="cta-row">
        <button className="cta-primary" onClick={onBuy}>
          <span className="material-symbols-outlined">shopping_bag</span>
          立即购买
        </button>
        <div className="cta-secondary-row">
          <button className="cta-secondary">
            <span className="material-symbols-outlined">forum</span>
            联系卖家
          </button>
          <button
            className={'cta-secondary fav' + (favored ? ' on' : '')}
            onClick={toggleFav}
            disabled={favLoading}
          >
            <span className="material-symbols-outlined">{favored ? 'favorite' : 'favorite_border'}</span>
            {favored ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>

      <div className="trust-strip">
        <div className="trust-cell">
          <div className="ic"><span className="material-symbols-outlined">verified_user</span></div>
          <div className="l">实名担保</div>
        </div>
        <div className="trust-cell">
          <div className="ic"><span className="material-symbols-outlined">handshake</span></div>
          <div className="l">校内面交</div>
        </div>
        <div className="trust-cell">
          <div className="ic"><span className="material-symbols-outlined">undo</span></div>
          <div className="l">3 日无忧</div>
        </div>
      </div>
    </div>
  );
}

function MaterialDownloadCard({ data, favored, setFavored }) {
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState(null);
  const [dlDone, setDlDone] = useState(false);

  const doDownload = async () => {
    if (!data.id || downloading || dlDone) return;
    setDownloading(true);
    setDlError(null);
    try {
      const res = await fetch(`${API_BASE}/materials/${data.id}/download`, { method: 'POST' });
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.message || '下载失败');
      setDlDone(true);
      if (json.data?.downloadUrl) {
        window.open(json.data.downloadUrl, '_blank');
      } else if (data.fileId) {
        window.open(`${API_BASE}/materials/${data.id}/file`, '_blank');
      }
    } catch (e) {
      setDlError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="side-card price-card">
      <div className="price-tag">
        <span className="v" style={{ fontSize: 38 }}>{data.cost || 0}</span>
        <span className="y" style={{ fontSize: 17, fontWeight: 700, color: 'var(--amber)' }}>积分</span>
      </div>
      <div className="price-save" style={{ color: 'var(--cs-muted)' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--amber)' }}>paid</span>
        {data.cost === 0 ? '免费下载' : `支付 ${data.cost} 积分下载`}
      </div>

      <div className="cta-row">
        <button className="cta-primary" onClick={doDownload} disabled={downloading || dlDone}>
          <span className="material-symbols-outlined">download</span>
          {dlDone ? '下载成功' : downloading ? '处理中…' : `支付 ${data.cost} 积分下载`}
        </button>
        {dlError && <div style={{ color: 'var(--cs-error,#dc2626)', fontSize: 12, marginTop: 4 }}>{dlError}</div>}
        <div className="cta-secondary-row">
          <button
            className={'cta-secondary fav' + (favored ? ' on' : '')}
            onClick={() => setFavored(!favored)}
          >
            <span className="material-symbols-outlined">{favored ? 'bookmark' : 'bookmark_border'}</span>
            {favored ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>

      <div className="trust-strip">
        <div className="trust-cell">
          <div className="ic"><span className="material-symbols-outlined">task_alt</span></div>
          <div className="l">审核通过</div>
        </div>
        <div className="trust-cell">
          <div className="ic"><span className="material-symbols-outlined">picture_as_pdf</span></div>
          <div className="l">正版资料</div>
        </div>
        <div className="trust-cell">
          <div className="ic"><span className="material-symbols-outlined">refresh</span></div>
          <div className="l">7 日复下</div>
        </div>
      </div>
    </div>
  );
}

function RecruitApplyCard({ data, favored, setFavored }) {
  const filled = data.currentMemberCount || 0;
  const total = data.memberLimit || 1;
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(data.hasApplied || false);
  const [applyError, setApplyError] = useState(null);

  const doApply = async () => {
    if (!data.id || applying || applied || !data.canApply) return;
    setApplying(true);
    setApplyError(null);
    try {
      const res = await fetch(`${API_BASE}/team/recruitments/${data.id}/apply`, { method: 'POST' });
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.message || '申请失败');
      setApplied(true);
    } catch (e) {
      setApplyError(e.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="side-card price-card">
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cs-muted)' }}>
        组队进度
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
        <span style={{ fontFamily: 'Manrope', fontWeight: 900, fontSize: 40, color: 'var(--cs-ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {filled}
        </span>
        <span style={{ fontFamily: 'Manrope', fontSize: 18, color: 'var(--cs-muted-2)', fontWeight: 700 }}>/ {total}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--cs-muted)' }}>
          还差 <strong style={{ color: 'var(--cs-primary)' }}>{total - filled}</strong> 位队员
        </span>
      </div>
      <div style={{ marginTop: 12, height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{
          width: `${(filled / total) * 100}%`, height: '100%',
          background: 'linear-gradient(90deg, var(--cs-primary), var(--cs-accent))',
          borderRadius: 999,
        }} />
      </div>

      <div className="cta-row">
        <button
          className="cta-primary"
          onClick={doApply}
          disabled={applying || applied || !data.canApply}
        >
          <span className="material-symbols-outlined">how_to_reg</span>
          {applied ? '申请已提交' : applying ? '申请中…' : !data.canApply ? '无法申请' : '立即申请加入'}
        </button>
        {applyError && <div style={{ color: 'var(--cs-error,#dc2626)', fontSize: 12, marginTop: 4 }}>{applyError}</div>}
        <div className="cta-secondary-row">
          <button className="cta-secondary">
            <span className="material-symbols-outlined">forum</span>
            联系发起人
          </button>
          <button
            className={'cta-secondary fav' + (favored ? ' on' : '')}
            onClick={() => setFavored(!favored)}
          >
            <span className="material-symbols-outlined">{favored ? 'bookmark' : 'bookmark_border'}</span>
            {favored ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>

      <div className="trust-strip">
        <div className="trust-cell">
          <div className="ic"><span className="material-symbols-outlined">verified</span></div>
          <div className="l">实名发起</div>
        </div>
        <div className="trust-cell">
          <div className="ic"><span className="material-symbols-outlined">school</span></div>
          <div className="l">校内组队</div>
        </div>
        <div className="trust-cell">
          <div className="ic"><span className="material-symbols-outlined">military_tech</span></div>
          <div className="l">积分激励</div>
        </div>
      </div>
    </div>
  );
}

function AuthorCard({ author, mode }) {
  if (!author) return null;
  const roleLabel = { product: '卖家', material: '上传者', recruit: '发起人' }[mode];
  return (
    <div className="side-card author-card">
      <div className="author-head">
        <div className="author-avatar" style={{ background: author.avBg || 'linear-gradient(135deg,#9ec5e8,#5b87c0)' }}>
          {author.initial || (author.name || '?')[0]}
        </div>
        <div className="info">
          <div className="name">
            {author.name}
            <span className="material-symbols-outlined" title="已实名" style={{ fontSize: 16, marginLeft: 4, color: 'var(--cs-primary)' }}>verified</span>
          </div>
          <div className="sub">{roleLabel}</div>
        </div>
      </div>
      {mode === 'material' && author.downloadCount > 0 && (
        <div className="author-stats">
          <div className="author-stat">
            <div className="v">{author.downloadCount}</div>
            <div className="l">总下载</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownCard({ mode, data }) {
  if (mode === 'product') {
    const stock = data?.stockCount;
    return (
      <div className="side-card countdown-card">
        <div className="l">
          <span className="material-symbols-outlined">inventory_2</span>
          库存状态
        </div>
        <div className="num">
          <div className="cell">
            <div className="n">{stock != null ? stock : '—'}</div>
            <div className="ut">件在售</div>
          </div>
        </div>
        <div className="countdown-progress">
          <div className="fill" style={{ width: stock > 0 ? '60%' : '0%' }} />
        </div>
        <div className="countdown-spots">
          {stock === 0 ? '已售罄' : stock === 1 ? '仅剩 1 件 · 建议尽快下单' : `共 ${stock} 件`}
        </div>
      </div>
    );
  }

  if (mode === 'recruit') {
    const days = data?.deadline ? daysUntil(data.deadline) : null;
    return (
      <div className="side-card countdown-card">
        <div className="l">
          <span className="material-symbols-outlined">timer</span>
          报名截止倒计时
        </div>
        <div className="num">
          {days != null ? (
            <>
              <div className="cell"><div className="n">{days}</div><div className="ut">Days</div></div>
            </>
          ) : (
            <div className="cell"><div className="n">—</div><div className="ut">待定</div></div>
          )}
        </div>
        <div className="countdown-progress">
          <div className="fill" style={{ width: days != null && days < 30 ? `${100 - (days / 30) * 100}%` : '30%' }} />
        </div>
        <div className="countdown-spots">
          还剩 <strong>{(data?.memberLimit || 0) - (data?.currentMemberCount || 0)}</strong> 个名额
          · 已有 <strong>{data?.applicationCount || 0}</strong> 人申请中
        </div>
      </div>
    );
  }

  // material
  const dlCount = data?.downloadCount || 0;
  return (
    <div className="side-card countdown-card">
      <div className="l">
        <span className="material-symbols-outlined">trending_up</span>
        下载热度
      </div>
      <div className="num">
        <div className="cell"><div className="n">{dlCount.toLocaleString()}</div><div className="ut">总下载</div></div>
      </div>
      <div className="countdown-progress"><div className="fill" style={{ width: Math.min(dlCount / 20, 100) + '%' }} /></div>
      <div className="countdown-spots">积分下载 · 下载后永久可用</div>
    </div>
  );
}

// ─── Loading state ───
function LoadingShell() {
  return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--cs-muted)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>hourglass_empty</span>
      加载中…
    </div>
  );
}

function ErrorShell({ message }) {
  return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--cs-error,#dc2626)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>error_outline</span>
      {message || '加载失败，请刷新重试'}
    </div>
  );
}

// ─── Root ───
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const mode = IS_PREVIEW ? tweaks.mode : URL_TYPE;

  const [detail, setDetail]       = useState(IS_PREVIEW ? PREVIEW_DATA[tweaks.mode] : null);
  const [comments, setComments]   = useState(IS_PREVIEW ? PREVIEW_COMMENTS : []);
  const [commentTotal, setCommentTotal] = useState(IS_PREVIEW ? PREVIEW_COMMENTS.length : 0);
  const [avgScore, setAvgScore]   = useState(0);
  const [loading, setLoading]     = useState(!IS_PREVIEW);
  const [error, setError]         = useState(null);
  const [favored, setFavored]     = useState(tweaks.favored);

  useEffect(() => {
    if (IS_PREVIEW) {
      setDetail(PREVIEW_DATA[tweaks.mode]);
      setComments(PREVIEW_COMMENTS);
      setCommentTotal(PREVIEW_COMMENTS.length);
      setFavored(tweaks.favored);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      try {
        let detailUrl;
        if (URL_TYPE === 'product')  detailUrl = `${API_BASE}/products/${URL_ID}`;
        if (URL_TYPE === 'material') detailUrl = `${API_BASE}/materials/${URL_ID}`;
        if (URL_TYPE === 'recruit')  detailUrl = `${API_BASE}/team/recruitments/${URL_ID}`;

        const detailRes = await fetch(detailUrl);
        if (detailRes.status === 401) throw new Error('请先登录后查看详情');
        const detailJson = await detailRes.json();
        if (detailJson.code !== 0) throw new Error(detailJson.message || '加载失败');
        if (cancelled) return;

        const dto = detailJson.data;
        let adapted;

        if (URL_TYPE === 'product') {
          adapted = {
            id: dto.productId,
            title: dto.title,
            status: {
              kind: dto.productStatus === 'ON_SHELF' ? 'open' : 'closed',
              label: dto.productStatus === 'ON_SHELF' ? '在售中' : '已下架',
            },
            meta: {
              cat: dto.category,
              city: dto.tradeLocation,
              posted: formatRelTime(dto.createTime),
              views: 0, fav: 0,
            },
            tags: [dto.conditionLevel, dto.category, dto.tradeLocation].filter(Boolean),
            price: dto.price,
            orig: 0,
            desc: dto.description,
            specs: [
              dto.category      && { l: '分类',   v: dto.category },
              dto.conditionLevel && { l: '成色',   v: dto.conditionLevel },
              dto.tradeLocation  && { l: '交货方式', v: dto.tradeLocation },
              dto.stockCount != null && { l: '库存', v: `${dto.stockCount} 件` },
            ].filter(Boolean),
            imageFileIds: dto.imageFileIds || [],
            stockCount: dto.stockCount,
            seller: {
              name: dto.sellerDisplayName,
              initial: (dto.sellerDisplayName || '卖')[0],
              avBg: 'linear-gradient(135deg,#9ec5e8,#5b87c0)',
            },
          };

          const cRes = await fetch(`${API_BASE}/products/${URL_ID}/comments?pageNo=1&pageSize=10`);
          if (!cancelled && cRes.ok) {
            const cJson = await cRes.json();
            if (cJson.code === 0) {
              setComments(cJson.data.commentList || []);
              setCommentTotal(cJson.data.totalCount || 0);
              setAvgScore(cJson.data.averageScore || 0);
            }
          }

          try {
            const fRes = await fetch(`${API_BASE}/favorites/products/${URL_ID}`);
            if (!cancelled && fRes.ok) {
              const fJson = await fRes.json();
              if (fJson.code === 0) setFavored(fJson.data.favorited);
            }
          } catch {}

        } else if (URL_TYPE === 'material') {
          adapted = {
            id: dto.materialId,
            title: dto.courseName || dto.description?.slice(0, 40) || '学习资料',
            status: { kind: 'open', label: '可下载' },
            meta: {
              cat: dto.uploaderDisplayName,
              course: dto.courseName,
              posted: formatRelTime(dto.createTime),
              views: 0, fav: 0,
            },
            tags: dto.tags ? dto.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            cost: dto.downloadCostPoints || 0,
            desc: dto.description,
            fileType: dto.fileType,
            fileSizeBytes: dto.fileSizeBytes,
            fileId: dto.fileId,
            downloadCount: dto.downloadCount || 0,
            copyrightDeclared: dto.copyrightDeclared,
            downloadCostPoints: dto.downloadCostPoints,
            courseName: dto.courseName,
            uploader: {
              name: dto.uploaderDisplayName,
              initial: (dto.uploaderDisplayName || '上')[0],
              avBg: 'linear-gradient(135deg,#6ed3d7,#2a8d99)',
              downloadCount: dto.downloadCount,
            },
          };

        } else if (URL_TYPE === 'recruit') {
          const filled = dto.currentMemberCount || 0;
          const total = dto.memberLimit || 1;
          const statusKind = dto.recruitmentStatus === 'RECRUITING'
            ? (total - filled <= 1 ? 'few' : 'open')
            : 'closed';
          const statusLabel = statusKind === 'open' ? '招募中' : statusKind === 'few' ? '名额紧张' : '已关闭';
          adapted = {
            id: dto.recruitmentId,
            title: dto.eventName,
            status: { kind: statusKind, label: statusLabel },
            meta: {
              cat: `${dto.direction || '组队'} · 招募`,
              org: dto.publisherDisplayName,
              posted: formatRelTime(dto.createTime),
              views: 0, fav: 0,
            },
            tags: [dto.direction].filter(Boolean),
            desc: dto.skillRequirement,
            roles: [],
            timeline: [],
            memberLimit: dto.memberLimit,
            currentMemberCount: dto.currentMemberCount,
            deadline: dto.deadline,
            applicationCount: dto.applicationCount,
            canApply: dto.canApply,
            hasApplied: dto.hasApplied,
            direction: dto.direction,
            eventName: dto.eventName,
            skillRequirement: dto.skillRequirement,
            publisher: {
              name: dto.publisherDisplayName,
              initial: (dto.publisherDisplayName || '发')[0],
              avBg: 'linear-gradient(135deg,#c4b5fd,#7c3aed)',
            },
          };
        }

        if (!cancelled) setDetail(adapted);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [IS_PREVIEW ? tweaks.mode : URL_ID]);

  useEffect(() => {
    if (IS_PREVIEW) {
      setDetail(PREVIEW_DATA[tweaks.mode]);
      setComments(PREVIEW_COMMENTS);
      setFavored(tweaks.favored);
    }
  }, [tweaks.mode, tweaks.favored]);

  const reloadComments = async () => {
    if (!URL_ID || URL_TYPE !== 'product') return;
    try {
      const res = await fetch(`${API_BASE}/products/${URL_ID}/comments?pageNo=1&pageSize=10`);
      const json = await res.json();
      if (json.code === 0) {
        setComments(json.data.commentList || []);
        setCommentTotal(json.data.totalCount || 0);
        setAvgScore(json.data.averageScore || 0);
      }
    } catch {}
  };

  const effectiveMode = IS_PREVIEW ? tweaks.mode : URL_TYPE;
  const title = detail?.title || '';

  return (
    <>
      <Nav />

      <div className="detail-shell">
        <Crumb mode={effectiveMode} title={title} />

        {loading && <LoadingShell />}
        {!loading && error && <ErrorShell message={error} />}

        {!loading && !error && detail && (
          <div className="layout">
            {/* Main column */}
            <div className="main">
              {effectiveMode === 'product'  && (
                <ProductGallery
                  imageFileIds={detail.imageFileIds || []}
                  category={detail.meta?.cat || detail.specs?.[0]?.v}
                  title={title}
                />
              )}
              {effectiveMode === 'material' && <MaterialCover data={detail} />}
              {effectiveMode === 'recruit'  && <RecruitBanner data={detail} />}

              <TitleBlock data={detail} mode={effectiveMode} />
              <DescriptionSection text={detail.desc} />

              {effectiveMode === 'product'  && <SpecsSection specs={detail.specs} />}
              {effectiveMode === 'material' && <MaterialInfoSection data={detail} />}
              {effectiveMode === 'recruit'  && <RolesSection roles={detail.roles} />}
              {effectiveMode === 'recruit'  && <TimelineSection timeline={detail.timeline} />}

              {effectiveMode === 'product' && (
                <CommentsSection
                  productId={IS_PREVIEW ? null : URL_ID}
                  comments={comments}
                  totalCount={commentTotal}
                  averageScore={avgScore}
                  onCommentPosted={reloadComments}
                />
              )}

              <div className="report-row">
                <span>觉得不对劲？</span>
                <button>
                  <span className="material-symbols-outlined">flag</span>
                  举报此{effectiveMode === 'product' ? '商品' : effectiveMode === 'material' ? '资料' : '招募'}
                </button>
                <button>
                  <span className="material-symbols-outlined">share</span>
                  分享链接
                </button>
              </div>
            </div>

            {/* Side column */}
            <aside className="side">
              {effectiveMode === 'product'  && (
                <ProductPriceCard
                  data={detail}
                  favored={favored}
                  setFavored={setFavored}
                  onBuy={() => alert('购买功能即将上线')}
                />
              )}
              {effectiveMode === 'material' && (
                <MaterialDownloadCard
                  data={detail}
                  favored={favored}
                  setFavored={setFavored}
                />
              )}
              {effectiveMode === 'recruit'  && (
                <RecruitApplyCard
                  data={detail}
                  favored={favored}
                  setFavored={setFavored}
                />
              )}

              <AuthorCard
                mode={effectiveMode}
                author={
                  effectiveMode === 'product' ? detail.seller :
                  effectiveMode === 'material' ? detail.uploader :
                  detail.publisher
                }
              />

              {tweaks.showCountdown && <CountdownCard mode={effectiveMode} data={detail} />}
            </aside>
          </div>
        )}
      </div>

      <footer>
        <span style={{ fontFamily: 'Manrope', fontWeight: 800, color: 'var(--cs-ink)' }}>CampusShare</span>
        <span>© 2026 CampusShare · 校园资源共享平台</span>
        <div className="links">
          <a>隐私政策</a>
          <a>服务条款</a>
          <a>支持中心</a>
        </div>
      </footer>

      <TweaksPanel title="Tweaks">
        <TweakSection label="预览 (仅无 URL 参数时生效)">
          <TweakRadio
            label="详情类型"
            value={tweaks.mode}
            options={[
              { value: 'product',  label: '商品' },
              { value: 'material', label: '资料' },
              { value: 'recruit',  label: '招募' },
            ]}
            onChange={(v) => setTweak('mode', v)}
          />
        </TweakSection>

        <TweakSection label="模块">
          <TweakToggle label="热度/倒计时卡片" value={tweaks.showCountdown} onChange={(v) => setTweak('showCountdown', v)} />
          <TweakToggle label="已收藏状态 (预览)" value={tweaks.favored} onChange={(v) => setTweak('favored', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
