// CampusShare Listing — API-integrated version.
// Mode tabs swap content; filter rail adapts; real data from backend REST APIs.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "products",
  "view": "grid",
  "showApplied": true,
  "density": "comfortable"
}/*EDITMODE-END*/;

// ─── API config ───
const API_BASE = '/api/v1';
const PAGE_SIZE = 12;

// ─── Palettes & value maps ───
const CATEGORY_PALETTE = {
  '教材书籍':    { c1: '#9ec5e8', c2: '#5b87c0' },
  '电子产品':    { c1: '#e6cf94', c2: '#b88a3e' },
  '生活用品':    { c1: '#cbd5e1', c2: '#64748b' },
  '服饰鞋包':    { c1: '#fda4af', c2: '#be123c' },
  '运动器材':    { c1: '#a7f3d0', c2: '#0a8a4f' },
  '乐器':        { c1: '#c4b5fd', c2: '#7c3aed' },
  '出行/自行车': { c1: '#fdba74', c2: '#c2410c' },
};

const CATEGORY_VALUE_MAP = {
  book: '教材书籍', digital: '电子产品', life: '生活用品',
  cloth: '服饰鞋包', sport: '运动器材', instr: '乐器', bike: '出行/自行车',
};
const CONDITION_VALUE_MAP = {
  new: '全新', '99': '九五新及以上', '9': '九成新', '8': '八成新',
};
const DELIVERY_VALUE_MAP = { meet: '面交', mail: '邮寄' };
const RECRUIT_TYPE_MAP = { research: '科研', contest: '竞赛', project: '项目', intern: '实习' };
const PRODUCT_SORT_MAP = {
  '最新发布': 'NEWEST', '价格升序': 'PRICE_ASC', '价格降序': 'PRICE_DESC',
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

function formatDeadline(iso) {
  if (!iso) return '待定';
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// ─── Data adapters ───
function adaptProduct(dto) {
  const palette = CATEGORY_PALETTE[dto.category] || { c1: '#e2e8f0', c2: '#94a3b8' };
  return {
    id: dto.productId,
    title: dto.title,
    price: dto.price,
    c1: palette.c1,
    c2: palette.c2,
    ph: (dto.category || '品')[0],
    seller: dto.sellerDisplayName || '卖家',
    badge: dto.conditionLevel || '',
    tags: [dto.category, dto.tradeLocation].filter(Boolean),
    fav: false,
    imageFileId: dto.imageFileIds?.[0] || null,
  };
}

function adaptMaterial(dto) {
  return {
    id: dto.materialId,
    title: dto.courseName || (dto.description || '').slice(0, 40) || '学习资料',
    author: dto.uploaderDisplayName || '上传者',
    size: formatBytes(dto.fileSizeBytes),
    dl: dto.downloadCount || 0,
    cost: dto.downloadCostPoints || 0,
    icon: FILE_TYPE_ICON[dto.fileType] || 'description',
    c1: '#dbeafe', c2: '#3b82f6',
    tags: dto.tags ? dto.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 2) : [],
  };
}

function adaptRecruit(dto) {
  const filled = dto.currentMemberCount || 0;
  const total = dto.memberLimit || 1;
  const need = total - filled;
  let status = 'open';
  if (dto.recruitmentStatus === 'CLOSED' || dto.recruitmentStatus === 'EXPIRED') status = 'closed';
  else if (need <= 1) status = 'closing';
  else if (need <= Math.ceil(total * 0.4)) status = 'few';
  return {
    id: dto.recruitmentId,
    title: dto.eventName,
    desc: dto.skillRequirement || '',
    tags: [dto.direction].filter(Boolean),
    who: dto.publisherDisplayName || '发起人',
    need,
    total,
    deadline: formatDeadline(dto.deadline),
    status,
    points: 0,
    type: dto.direction,
    canApply: dto.canApply,
    hasApplied: dto.hasApplied,
  };
}

// ─── URL builders ───
function buildProductUrl(filters, priceRange, sort, keyword, page) {
  const p = new URLSearchParams();
  if (keyword) p.set('keyword', keyword);
  if (filters.category?.length) p.set('category', CATEGORY_VALUE_MAP[filters.category[0]] || filters.category[0]);
  if (filters.condition?.length) p.set('conditionLevel', CONDITION_VALUE_MAP[filters.condition[0]] || filters.condition[0]);
  if (filters.delivery?.length) p.set('tradeType', DELIVERY_VALUE_MAP[filters.delivery[0]] || filters.delivery[0]);
  if (priceRange.min) p.set('priceMin', priceRange.min);
  if (priceRange.max) p.set('priceMax', priceRange.max);
  const sortType = PRODUCT_SORT_MAP[sort];
  if (sortType) p.set('sortType', sortType);
  p.set('pageNo', page);
  p.set('pageSize', PAGE_SIZE);
  return `${API_BASE}/products?${p}`;
}

function buildMaterialUrl(keyword, page) {
  const p = new URLSearchParams();
  if (keyword) p.set('keyword', keyword);
  p.set('pageNo', page);
  p.set('pageSize', PAGE_SIZE);
  return `${API_BASE}/materials/public?${p}`;
}

function buildRecruitUrl(filters, keyword, page) {
  const p = new URLSearchParams();
  if (keyword) p.set('keyword', keyword);
  if (filters.type?.length) p.set('direction', RECRUIT_TYPE_MAP[filters.type[0]] || filters.type[0]);
  p.set('pageNo', page);
  p.set('pageSize', PAGE_SIZE);
  return `${API_BASE}/team/recruitments?${p}`;
}

// ─── Mode metadata ───
const MODE_META = {
  products:     { label: '商品',     icon: 'storefront', sub: '来自校内同学的闲置 · 实名审核 · 平台担保交易' },
  materials:    { label: '学习资料', icon: 'menu_book',  sub: '积分下载 · 上传可赚积分 · 涵盖各院系课程' },
  recruitments: { label: '组队招募', icon: 'groups',     sub: '科研 · 竞赛 · 项目 · 实习 — 校内可信组队' },
};

// ─── Filter schemas ───
const FILTERS = {
  products: [
    {
      key: 'category', title: '分类', collapsible: true,
      options: [
        { v: 'book',    l: '教材书籍' },
        { v: 'digital', l: '电子产品' },
        { v: 'life',    l: '生活用品' },
        { v: 'cloth',   l: '服饰鞋包' },
        { v: 'sport',   l: '运动器材' },
        { v: 'instr',   l: '乐器'     },
        { v: 'bike',    l: '出行/自行车' },
      ],
    },
    {
      key: 'condition', title: '成色',
      options: [
        { v: 'new', l: '全新'       },
        { v: '99',  l: '九五新及以上' },
        { v: '9',   l: '九成新'     },
        { v: '8',   l: '八成新'     },
      ],
    },
    {
      key: 'delivery', title: '交付方式',
      options: [
        { v: 'meet', l: '面交' },
        { v: 'mail', l: '邮寄' },
      ],
    },
  ],
  materials: [
    {
      key: 'type', title: '资料类型',
      options: [
        { v: 'note',       l: '课程笔记' },
        { v: 'exam',       l: '历年真题' },
        { v: 'summary',    l: '考点汇总' },
        { v: 'mindmap',    l: '思维导图' },
        { v: 'experiment', l: '实验报告' },
      ],
    },
  ],
  recruitments: [
    {
      key: 'type', title: '招募类型',
      options: [
        { v: 'research', l: '科研' },
        { v: 'contest',  l: '竞赛' },
        { v: 'project',  l: '项目' },
        { v: 'intern',   l: '实习' },
      ],
    },
  ],
};

const SORT_OPTIONS = {
  products:     ['综合推荐', '最新发布', '价格升序', '价格降序'],
  materials:    ['综合推荐', '下载最多', '最新上传'],
  recruitments: ['综合推荐', '截止最近', '最新发布'],
};

// ─── Nav ───
function Nav({ keyword, onKeyword }) {
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
          <input
            ref={searchRef}
            type="text"
            placeholder="搜索二手商品、学习资料、组队项目…"
            value={keyword}
            onChange={(e) => onKeyword(e.target.value)}
          />
          <span className="kbd" title={isMac ? '按 ⌘+K 快速聚焦搜索' : '按 Ctrl+K 快速聚焦搜索'} aria-hidden="true">
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

// ─── Filter section ───
function FilterSection({ schema, value, onToggle }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={'filter-section' + (collapsed ? ' collapsed' : '')}>
      <div className="filter-section-h" onClick={() => setCollapsed(!collapsed)}>
        {schema.title}
        <span className="material-symbols-outlined chev">expand_more</span>
      </div>
      <div className="filter-section-body">
        {schema.options.map(o => (
          <label key={o.v} className="filter-opt">
            <input
              type="checkbox"
              checked={value.includes(o.v)}
              onChange={() => onToggle(schema.key, o.v)}
            />
            <span className="box" />
            <span>{o.l}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FilterRail({ mode, filters, setFilters, priceRange, setPriceRange }) {
  const schemas = FILTERS[mode];

  const toggle = (key, value) => {
    setFilters(prev => {
      const cur = prev[key] || [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  };

  const total = Object.values(filters).reduce((a, b) => a + (b?.length || 0), 0)
    + (mode === 'products' && (priceRange.min || priceRange.max) ? 1 : 0);

  const clearAll = () => {
    setFilters({});
    setPriceRange({ min: '', max: '' });
  };

  return (
    <aside className="filter-rail">
      <div className="filter-head">
        <div className="t">
          <span className="material-symbols-outlined">tune</span>
          筛选
        </div>
        <button className="clear" onClick={clearAll} disabled={total === 0}>
          {total > 0 ? `清除 (${total})` : '清除全部'}
        </button>
      </div>

      <div className="filter-section">
        <div className="switch-row">
          <span className="l">
            <span className="material-symbols-outlined">schedule</span>
            7 天内{mode === 'recruitments' ? '新发布' : '上新'}
          </span>
          <input
            type="checkbox"
            className="switch"
            checked={!!filters._recent}
            onChange={(e) => setFilters({ ...filters, _recent: e.target.checked })}
          />
        </div>
      </div>

      {mode === 'products' && (
        <div className="filter-section">
          <div className="filter-section-h">价格区间 (¥)</div>
          <div className="filter-section-body">
            <div className="range-row">
              <input
                className="range-input"
                type="number"
                placeholder="最低"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              />
              <span className="sep">—</span>
              <input
                className="range-input"
                type="number"
                placeholder="最高"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {schemas.map(s => (
        <FilterSection
          key={s.key}
          schema={s}
          value={filters[s.key] || []}
          onToggle={toggle}
        />
      ))}
    </aside>
  );
}

// ─── Cards ───
function ProductCard({ p, onClick }) {
  const [fav, setFav] = useState(p.fav);
  const [favLoading, setFavLoading] = useState(false);

  const toggleFav = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    const prev = fav;
    setFav(!fav);
    try {
      const res = await fetch(`${API_BASE}/favorites/products/${p.id}/toggle`, { method: 'POST' });
      const json = await res.json();
      if (json.code === 0) setFav(json.data.favorited);
      else setFav(prev);
    } catch {
      setFav(prev);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="product" onClick={() => onClick && onClick(p.id)} style={{ cursor: 'pointer' }}>
      <div className="thumb" style={{ '--c1': p.c1, '--c2': p.c2 }}>
        {p.imageFileId
          ? <img
              src={`${API_BASE}/files/${p.imageFileId}`}
              alt={p.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          : <div className="ph">{p.ph}</div>
        }
        {p.badge && (
          <span className="badge">{p.badge}</span>
        )}
        <button className={'fav' + (fav ? ' on' : '')} onClick={toggleFav} disabled={favLoading}>
          <span className="material-symbols-outlined">{fav ? 'favorite' : 'favorite_border'}</span>
        </button>
      </div>
      <div className="product-body">
        <div className="title">{p.title}</div>
        <div className="meta">
          <div className="price">
            <span className="y">¥</span>{p.price}
          </div>
          <div className="seller">
            <span className="av">{(p.seller || '卖')[0]}</span>
            {p.seller}
          </div>
        </div>
        <div className="tags">
          {p.tags.map(t => <span key={t} className="tag-mini">{t}</span>)}
        </div>
      </div>
    </div>
  );
}

function MaterialRow({ m, onClick }) {
  return (
    <div className="material-row" onClick={() => onClick && onClick(m.id)} style={{ cursor: 'pointer' }}>
      <div className="icn" style={{ background: m.c1, color: m.c2 }}>
        <span className="material-symbols-outlined">{m.icon}</span>
      </div>
      <div className="body">
        <div className="ttl">{m.title}</div>
        <div className="sub">
          <span><span className="material-symbols-outlined">person</span>{m.author}</span>
          <span><span className="material-symbols-outlined">folder_zip</span>{m.size}</span>
          {m.tags.map(t => <span key={t}><span className="material-symbols-outlined">tag</span>{t}</span>)}
        </div>
      </div>
      <div className="stats">
        <span className="material-symbols-outlined">download</span>
        {m.dl.toLocaleString()}
      </div>
      <span className="cost">
        <span className="material-symbols-outlined">paid</span>
        {m.cost === 0 ? '免费' : `${m.cost} 积分`}
      </span>
      <button className="dl-btn" title="查看详情" onClick={(e) => { e.stopPropagation(); onClick && onClick(m.id); }}>
        <span className="material-symbols-outlined">download</span>
      </button>
    </div>
  );
}

function MaterialCard({ m, onClick }) {
  return (
    <div className="material-card" onClick={() => onClick && onClick(m.id)} style={{ cursor: 'pointer' }}>
      <div className="top-row">
        <div className="icn" style={{ background: m.c1, color: m.c2 }}>
          <span className="material-symbols-outlined">{m.icon}</span>
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11.5, fontWeight: 700, color: 'var(--amber)',
          background: 'var(--amber-soft)', padding: '4px 9px', borderRadius: 999,
        }}>
          {m.cost === 0 ? '免费' : `${m.cost} 积分`}
        </span>
      </div>
      <div className="ttl">{m.title}</div>
      <div className="footer">
        <div className="info">
          <span><span className="material-symbols-outlined">person</span>{m.author}</span>
          <span><span className="material-symbols-outlined">download</span>{m.dl}</span>
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--cs-muted-2)' }}>{m.size}</span>
      </div>
    </div>
  );
}

function RecruitCard({ r, onClick }) {
  const statusLabel = r.status === 'open' ? '招募中' : r.status === 'few' ? '名额紧张' : r.status === 'closing' ? '即将截止' : '已关闭';
  return (
    <div className="recruit" onClick={() => onClick && onClick(r.id)} style={{ cursor: 'pointer' }}>
      <div className="head">
        <div className="ttl">{r.title}</div>
        <span className={'status ' + r.status}>
          <span className="dot" />
          {statusLabel}
        </span>
      </div>
      <div className="desc">{r.desc}</div>
      <div className="tags">
        {r.tags.map(t => <span key={t} className="tag">{t}</span>)}
      </div>
      <div className="meta">
        <div>
          <div className="ml">发起方</div>
          <div className="mv">{r.who}</div>
        </div>
        <div>
          <div className="ml">截止</div>
          <div className="mv"><span className="material-symbols-outlined">event</span>{r.deadline}</div>
        </div>
        <div>
          <div className="ml">招募</div>
          <div className="mv"><span className="material-symbols-outlined">group</span>{r.total - r.need}/{r.total} 人</div>
        </div>
      </div>
      <div className="progress">
        <div className="bar"><div className="fill" style={{ width: `${((r.total - r.need) / r.total) * 100}%` }} /></div>
        <div className="pct">{r.total - r.need}/{r.total}</div>
      </div>
      <div className="recruit-actions">
        <button
          className="apply"
          disabled={r.hasApplied || r.status === 'closed'}
          onClick={(e) => { e.stopPropagation(); onClick && onClick(r.id); }}
        >
          {r.hasApplied ? '已申请' : '查看详情'}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

// ─── Applied filter chips ───
function AppliedChips({ mode, filters, setFilters, priceRange, setPriceRange }) {
  const chips = [];
  FILTERS[mode].forEach(s => {
    const arr = filters[s.key] || [];
    arr.forEach(v => {
      const opt = s.options.find(o => o.v === v);
      if (opt) chips.push({ k: s.key, v, label: opt.l });
    });
  });
  if (filters._recent) chips.push({ k: '_recent', v: true, label: '7 天内' });
  if (mode === 'products' && (priceRange.min || priceRange.max)) {
    chips.push({ k: '_price', v: true, label: `¥${priceRange.min || '0'} — ¥${priceRange.max || '∞'}` });
  }

  const remove = (chip) => {
    if (chip.k === '_price') return setPriceRange({ min: '', max: '' });
    if (chip.k === '_recent') return setFilters({ ...filters, _recent: false });
    setFilters({ ...filters, [chip.k]: (filters[chip.k] || []).filter(v => v !== chip.v) });
  };
  const clearAll = () => { setFilters({}); setPriceRange({ min: '', max: '' }); };

  if (chips.length === 0) return null;
  return (
    <div className="applied-row">
      <span className="applied-lbl">已筛选：</span>
      {chips.map((c, i) => (
        <span key={i} className="applied-chip">
          {c.label}
          <button onClick={() => remove(c)} aria-label="移除"><span className="material-symbols-outlined">close</span></button>
        </span>
      ))}
      <button className="applied-clear" onClick={clearAll}>清除全部</button>
    </div>
  );
}

// ─── Loading skeleton ───
function Skeleton({ mode, view }) {
  const count = 6;
  if (mode === 'products') {
    return (
      <div className="product-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="product" style={{ opacity: 0.5 }}>
            <div className="thumb" style={{ '--c1': '#e2e8f0', '--c2': '#cbd5e1', background: 'var(--cs-surface-2)' }} />
            <div className="product-body">
              <div style={{ height: 14, background: 'var(--cs-surface-2)', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 12, background: 'var(--cs-surface-2)', borderRadius: 6, width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (mode === 'materials') {
    return view === 'grid'
      ? (
        <div className="material-grid">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="material-card" style={{ opacity: 0.5, minHeight: 130 }} />
          ))}
        </div>
      )
      : (
        <div className="material-list">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="material-row" style={{ opacity: 0.5, height: 64 }} />
          ))}
        </div>
      );
  }
  return (
    <div className="recruit-grid">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="recruit" style={{ opacity: 0.5, minHeight: 200 }} />
      ))}
    </div>
  );
}

// ─── Main content area ───
function ContentArea({ mode, view, items, loading, onProductClick, onMaterialClick, onRecruitClick }) {
  if (loading && items.length === 0) {
    return <Skeleton mode={mode} view={view} />;
  }

  if (!loading && items.length === 0) {
    return (
      <div className="empty-state">
        <div className="icn">
          <span className="material-symbols-outlined">filter_alt_off</span>
        </div>
        <h3>没有匹配的{MODE_META[mode].label}</h3>
        <p>当前筛选条件太严格了。试着删除几个条件，或浏览全部内容。</p>
      </div>
    );
  }

  if (mode === 'products') {
    return (
      <div className="product-grid">
        {items.map(p => <ProductCard key={p.id} p={p} onClick={onProductClick} />)}
      </div>
    );
  }
  if (mode === 'materials') {
    if (view === 'grid') {
      return (
        <div className="material-grid">
          {items.map(m => <MaterialCard key={m.id} m={m} onClick={onMaterialClick} />)}
        </div>
      );
    }
    return (
      <div className="material-list">
        {items.map(m => <MaterialRow key={m.id} m={m} onClick={onMaterialClick} />)}
      </div>
    );
  }
  return (
    <div className="recruit-grid">
      {items.map(r => <RecruitCard key={r.id} r={r} onClick={onRecruitClick} />)}
    </div>
  );
}

// ─── Root ───
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const mode = tweaks.mode;

  const [filters, setFilters] = useState({});
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sort, setSort] = useState(SORT_OPTIONS.products[0]);
  const [keyword, setKeyword] = useState('');

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // Reset on mode change
  useEffect(() => {
    setFilters({});
    setPriceRange({ min: '', max: '' });
    setSort(SORT_OPTIONS[mode][0]);
    setKeyword('');
    setItems([]);
    setPage(1);
    setTotalCount(0);
  }, [mode]);

  // Fetch function
  const fetchPage = useCallback(async (pageNo, append) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    append ? setLoadingMore(true) : setLoading(true);
    setError(null);

    try {
      let url;
      if (mode === 'products') url = buildProductUrl(filters, priceRange, sort, keyword, pageNo);
      else if (mode === 'materials') url = buildMaterialUrl(keyword, pageNo);
      else url = buildRecruitUrl(filters, keyword, pageNo);

      const res = await fetch(url, { signal: ctrl.signal });
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.message || '请求失败');

      const d = json.data;
      let newItems, total;

      if (mode === 'products') {
        newItems = (d.productList || []).map(adaptProduct);
        total = d.totalCount || 0;
      } else if (mode === 'materials') {
        newItems = (d.materialList || []).map(adaptMaterial);
        total = d.totalCount || 0;
      } else {
        newItems = (d.recruitmentList || []).map(adaptRecruit);
        total = d.totalCount || 0;
      }

      setItems(prev => append ? [...prev, ...newItems] : newItems);
      setTotalCount(total);
      setHasMore(pageNo * PAGE_SIZE < total);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [mode, filters, priceRange, sort, keyword]);

  // Debounced re-fetch on dependency changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const delay = keyword ? 400 : 0;
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchPage(1, false);
    }, delay);
    return () => clearTimeout(debounceRef.current);
  }, [fetchPage]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  };

  const navigate = (type, id) => {
    window.location.href = `/pages/market_item_detail.html?type=${type}&id=${id}`;
  };

  const setMode = (m) => setTweak('mode', m);
  const setView = (v) => setTweak('view', v);
  const meta = MODE_META[mode];

  return (
    <>
      <Nav keyword={keyword} onKeyword={setKeyword} />

      <div className="page-header">
        <div className="crumb">
          <a onClick={() => window.location.href = '/pages/market_overview.html'} style={{ cursor: 'pointer' }}>主页</a>
          <span className="material-symbols-outlined">chevron_right</span>
          <span className="cur">{meta.label}</span>
        </div>
        <h1 className="page-title">{meta.label}</h1>
        <p className="page-subtitle">
          {totalCount > 0 && <><strong>{totalCount.toLocaleString()}</strong> {meta.label} · </>}
          {meta.sub}
        </p>

        <div className="mode-tabs" role="tablist">
          {Object.entries(MODE_META).map(([k, v]) => (
            <button
              key={k}
              role="tab"
              className={'mode-tab' + (mode === k ? ' active' : '')}
              onClick={() => setMode(k)}
            >
              <span className="material-symbols-outlined">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <main className="shell">
        <FilterRail
          mode={mode}
          filters={filters}
          setFilters={setFilters}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
        />

        <div className="main">
          {tweaks.showApplied && (
            <AppliedChips
              mode={mode}
              filters={filters}
              setFilters={setFilters}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
            />
          )}

          <div className="toolbar">
            <div className="count">
              {loading
                ? '加载中…'
                : error
                  ? <span style={{ color: 'var(--cs-error, #dc2626)' }}>加载失败：{error}</span>
                  : <>共 <strong>{totalCount.toLocaleString()}</strong> 个{meta.label}</>
              }
            </div>
            <div className="right">
              <div className="sort-wrap">
                <span className="material-symbols-outlined">swap_vert</span>
                <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORT_OPTIONS[mode].map(o => <option key={o}>{o}</option>)}
                </select>
                <span className="material-symbols-outlined chev">expand_more</span>
              </div>
              {mode === 'materials' && (
                <div className="view-toggle">
                  <button className={tweaks.view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} title="网格视图">
                    <span className="material-symbols-outlined">grid_view</span>
                  </button>
                  <button className={tweaks.view === 'list' ? 'on' : ''} onClick={() => setView('list')} title="列表视图">
                    <span className="material-symbols-outlined">view_list</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <ContentArea
            mode={mode}
            view={tweaks.view}
            items={items}
            loading={loading}
            onProductClick={(id) => navigate('product', id)}
            onMaterialClick={(id) => navigate('material', id)}
            onRecruitClick={(id) => navigate('recruit', id)}
          />

          {hasMore && (
            <div className="load-more">
              <button onClick={loadMore} disabled={loadingMore}>
                <span className="material-symbols-outlined">expand_more</span>
                {loadingMore ? '加载中…' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      </main>

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
        <TweakSection label="预览">
          <TweakRadio
            label="当前页面"
            value={tweaks.mode}
            options={[
              { value: 'products',     label: '商品' },
              { value: 'materials',    label: '资料' },
              { value: 'recruitments', label: '招募' },
            ]}
            onChange={(v) => setTweak('mode', v)}
          />
          {mode === 'materials' && (
            <TweakRadio
              label="资料视图"
              value={tweaks.view}
              options={[
                { value: 'list', label: '列表' },
                { value: 'grid', label: '网格' },
              ]}
              onChange={(v) => setTweak('view', v)}
            />
          )}
        </TweakSection>

        <TweakSection label="行为">
          <TweakToggle
            label="显示已筛选 chip"
            value={tweaks.showApplied}
            onChange={(v) => setTweak('showApplied', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
