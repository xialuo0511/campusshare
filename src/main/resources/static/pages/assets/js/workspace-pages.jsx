const { useState, useMemo, useEffect, useRef } = React;

function EmptyState({ icon, title, body, actionLabel, onAction }) {
  return (
    <div className="empty">
      <div className="icn"><span className="material-symbols-outlined">{icon}</span></div>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {actionLabel && (
        <button className="ghost-btn" onClick={onAction}>
          <span className="material-symbols-outlined">add</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function listOf(result) {
  if (Array.isArray(result)) return result;
  if (!result || typeof result !== 'object') return [];
  const direct = result.items || result.records || result.list || result.rows || result.notificationList || result.notifications || result.noticeList || result.orderList || result.transactionList;
  if (Array.isArray(direct)) return direct;
  if (result.data) return listOf(result.data);
  return Object.keys(result).reduce((acc, key) => Array.isArray(result[key]) ? acc.concat(result[key]) : acc, []);
}

function textOf(item, fields) {
  for (let i = 0; i < fields.length; i += 1) {
    const value = item && item[fields[i]];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  const nested = item && (item.payload || item.extra || item.ext || item.bizData || item.data);
  if (!nested) return '';
  if (typeof nested === 'string') {
    try { return textOf(JSON.parse(nested), fields) || nested; }
    catch (error) { return nested; }
  }
  return textOf(nested, fields);
}

function readFlagOf(item) {
  if (!item) return false;
  if (item.readFlag !== undefined) return item.readFlag === true || item.readFlag === 1 || item.readFlag === '1' || item.readFlag === 'true';
  if (item.readStatus !== undefined) return item.readStatus === true || item.readStatus === 1 || item.readStatus === '1' || item.readStatus === 'READ';
  if (item.isRead !== undefined) return item.isRead === true || item.isRead === 1 || item.isRead === '1' || item.isRead === 'true';
  return false;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function MyPostsPage() {
  const Api = window.CampusShareApi;
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const statusText = { live: '\u5728\u552e', review: '\u5ba1\u6838\u4e2d', sold: '\u5df2\u552e\u51fa', off: '\u5df2\u4e0b\u67b6', draft: '\u8349\u7a3f' };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      Api.ListMyProducts ? Api.ListMyProducts({ pageNo: 1, pageSize: 100 }) : Promise.resolve([]),
      Api.ListMyMaterials ? Api.ListMyMaterials({ pageNo: 1, pageSize: 100 }) : Promise.resolve([])
    ]).then(([productsResult, materialsResult]) => {
      const productStatus = { ON_SALE: 'live', SOLD: 'sold', PENDING_REVIEW: 'review', OFFLINE: 'off', DRAFT: 'draft' };
      const materialStatus = { ON_SALE: 'live', OFFLINE: 'off', PENDING_REVIEW: 'review', DRAFT: 'draft' };
      const products = listOf(productsResult).map(item => ({
        id: `p-${item.productId || item.id}`,
        title: item.productTitle || item.title || '\u672a\u547d\u540d\u5546\u54c1',
        type: '\u5546\u54c1',
        price: item.askingPrice,
        status: productStatus[item.productStatus] || 'draft',
        time: item.createTime || item.updateTime
      }));
      const materials = listOf(materialsResult).map(item => ({
        id: `m-${item.materialId || item.id}`,
        title: item.materialTitle || item.title || '\u672a\u547d\u540d\u8d44\u6599',
        type: '\u8d44\u6599',
        price: item.pointCost,
        status: materialStatus[item.materialStatus] || 'review',
        time: item.createTime || item.updateTime
      }));
      setItems(products.concat(materials).sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)));
      setError('');
    }).catch(err => setError(err && err.message ? err.message : '\u6211\u7684\u53d1\u5e03\u52a0\u8f7d\u5931\u8d25'))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    ['all', '\u5168\u90e8'],
    ['live', '\u5728\u552e'],
    ['review', '\u5ba1\u6838\u4e2d'],
    ['sold', '\u5df2\u552e'],
    ['off', '\u5df2\u4e0b\u67b6'],
    ['draft', '\u8349\u7a3f']
  ];
  const filtered = tab === 'all' ? items : items.filter(item => item.status === tab);

  return (
    <div className="page-fade">
      <div className="page-head">
        <div className="ttl-block"><div className="ttl">{'\u6211\u7684\u53d1\u5e03'}</div><div className="sub">{'\u67e5\u770b\u5546\u54c1\u548c\u8d44\u6599\u7684\u53d1\u5e03\u72b6\u6001'}</div></div>
        <button className="primary-btn" onClick={() => window.location.href = '/pages/publish_center.html'}><span className="material-symbols-outlined">add</span>{'\u53d1\u5e03'}</button>
      </div>
      <div className="seg">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}<span className="n">{id === 'all' ? items.length : items.filter(item => item.status === id).length}</span></button>)}</div>
      {loading ? <div className="card"><EmptyState icon="hourglass_empty" title={'\u6b63\u5728\u52a0\u8f7d'} /></div>
        : error ? <div className="card"><EmptyState icon="error" title={error} /></div>
        : filtered.length === 0 ? <div className="card"><EmptyState icon="inventory_2" title={'\u6682\u65e0\u53d1\u5e03'} body={'\u5207\u6362\u7b5b\u9009\u6216\u53d1\u5e03\u65b0\u5185\u5bb9'} /></div>
        : <div style={{display:'flex', flexDirection:'column', gap:12}}>{filtered.map(item => (
          <div className="card order-card" key={item.id}>
            <div className="order-head"><span className="id">{item.type}</span><span className="sep" /><span>{formatDate(item.time)}</span><span className="pill live status">{statusText[item.status] || item.status}</span></div>
            <div className="order-body"><div className="order-thumb">{item.title.slice(0, 1)}</div><div className="order-info"><div className="t">{item.title}</div></div><div className="order-side"><div className="post-price">{item.price == null ? '-' : Number(item.price).toLocaleString()}</div></div></div>
          </div>
        ))}</div>}
    </div>
  );
}

function OrdersPage() {
  const Api = window.CampusShareApi;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setLoading(true);
    (Api.ListMyOrders ? Api.ListMyOrders(1, 100) : Promise.resolve([]))
      .then(result => { setOrders(listOf(result)); setError(''); })
      .catch(err => setError(err && err.message ? err.message : '\u8ba2\u5355\u52a0\u8f7d\u5931\u8d25'))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="page-fade">
      <div className="page-head"><div className="ttl-block"><div className="ttl">{'\u8ba2\u5355\u4e2d\u5fc3'}</div><div className="sub">{'\u67e5\u770b\u6211\u7684\u4ea4\u6613\u8ba2\u5355'}</div></div></div>
      {loading ? <div className="card"><EmptyState icon="hourglass_empty" title={'\u6b63\u5728\u52a0\u8f7d'} /></div>
        : error ? <div className="card"><EmptyState icon="error" title={error} /></div>
        : orders.length === 0 ? <div className="card"><EmptyState icon="receipt_long" title={'\u6682\u65e0\u8ba2\u5355'} /></div>
        : <div style={{display:'flex', flexDirection:'column', gap:12}}>{orders.map(order => {
          const id = order.orderId || order.id;
          const title = order.productTitle || order.materialTitle || order.itemTitle || '\u8ba2\u5355\u9879\u76ee';
          return <div className="card order-card" key={id}><div className="order-head"><span className="id">#{id}</span><span className="sep" /><span>{formatDate(order.createTime)}</span><span className="pill review status">{order.orderStatus || '-'}</span></div><div className="order-body"><div className="order-thumb">{title.slice(0, 1)}</div><div className="order-info"><div className="t">{title}</div></div><div className="order-side"><button className="btn-sm" onClick={() => window.location.href = `/pages/order_detail.html?orderId=${encodeURIComponent(id)}`}>{'\u8be6\u60c5'}</button></div></div></div>;
        })}</div>}
    </div>
  );
}

function MessagesPage() {
  const Api = window.CampusShareApi;
  const filterRef = useRef(null);
  const [cat, setCat] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const kindMap = { ORDER: 'order', ORDER_UPDATE: 'order', TRADE: 'order', TEAM: 'team', TEAM_UPDATE: 'team', RECRUITMENT: 'team', SYSTEM: 'system', REVIEW: 'system', POINT: 'system', REPORT: 'system' };
  const labelMap = { order: '\u8ba2\u5355\u901a\u77e5', team: '\u7ec4\u961f\u901a\u77e5', system: '\u7cfb\u7edf\u516c\u544a' };
  const iconMap = { order: 'receipt_long', team: 'group_add', system: 'campaign' };
  const colors = { order: ['#fef3c7', '#d97706'], team: ['#dcfce7', '#16a34a'], system: ['#e0f2fe', '#2563eb'] };

  const loadMessages = () => {
    setLoading(true);
    (Api.ListMyNotifications ? Api.ListMyNotifications() : Promise.resolve([]))
      .then(result => {
        const mapped = listOf(result).map((item, index) => {
          const type = String(item.notificationType || item.type || '').toUpperCase();
          const kind = kindMap[type] || 'system';
          const title = textOf(item, ['title', 'notificationTitle', 'noticeTitle', 'announcementTitle', 'subject']) || labelMap[kind];
          const body = textOf(item, ['content', 'notificationContent', 'noticeContent', 'announcementContent', 'contentText', 'message', 'messageContent', 'messageText', 'body', 'description', 'detail', 'details', 'summary', 'remark']) || title;
          const id = item.notificationId || item.id || item.noticeId || `${kind}-${item.sendTime || item.createTime || index}`;
          return { id, kind, title, body, unread: !readFlagOf(item), time: item.sendTime || item.createTime || '', c1: colors[kind][0], c2: colors[kind][1], icn: iconMap[kind] };
        });
        setMessages(mapped);
        setSelectedId(current => current || (mapped[0] && mapped[0].id) || null);
        setError('');
      }).catch(err => setError(err && err.message ? err.message : '\u6d88\u606f\u52a0\u8f7d\u5931\u8d25'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadMessages(); }, []);
  useEffect(() => {
    const el = filterRef.current;
    if (!el) return undefined;
    const onWheel = (event) => {
      if (!event.deltaY || el.scrollWidth <= el.clientWidth) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const cats = [
    ['all', '\u5168\u90e8', 'inbox'],
    ['order', '\u8ba2\u5355', 'receipt_long'],
    ['team', '\u7ec4\u961f', 'group_add'],
    ['system', '\u7cfb\u7edf', 'campaign']
  ];
  const filtered = cat === 'all' ? messages : messages.filter(item => item.kind === cat);
  const categoryCounts = useMemo(() => cats.reduce((acc, [id]) => {
    acc[id] = id === 'all' ? messages.length : messages.filter(item => item.kind === id).length;
    return acc;
  }, {}), [messages]);
  const groupedMessages = useMemo(() => {
    const visibleKinds = cat === 'all' ? cats.map(([id]) => id).filter(id => id !== 'all') : [cat];
    return visibleKinds.map(kind => ({
      kind,
      label: labelMap[kind] || kind,
      items: filtered.filter(item => item.kind === kind)
    })).filter(group => group.items.length > 0);
  }, [cat, filtered]);
  const selected = filtered.find(item => item.id === selectedId) || filtered[0];
  const markRead = (message) => {
    setSelectedId(message.id);
    if (!message.unread || !Api.MarkNotificationRead) return;
    Api.MarkNotificationRead(message.id).then(() => {
      setMessages(items => items.map(item => item.id === message.id ? Object.assign({}, item, { unread: false }) : item));
    }).catch(() => {});
  };
  const markAllRead = () => {
    if (!Api.MarkAllNotificationRead) return;
    Api.MarkAllNotificationRead().then(() => setMessages(items => items.map(item => Object.assign({}, item, { unread: false })))).catch(() => {});
  };

  return (
    <div className="page-fade">
      <div className="page-head"><div className="ttl-block"><div className="ttl">{'\u6d88\u606f\u901a\u77e5'}</div><div className="sub">{'\u6309\u7c7b\u578b\u67e5\u770b\u8ba2\u5355\u3001\u7ec4\u961f\u548c\u7cfb\u7edf\u6d88\u606f'}</div></div><button className="ghost-btn" onClick={markAllRead}><span className="material-symbols-outlined">done_all</span>{'\u5168\u90e8\u5df2\u8bfb'}</button></div>
      <div className="msg-layout">
        <div className="msg-list">
          <div className="msg-list-head"><div className="msg-filter" ref={filterRef}>{cats.map(([id, label, icon]) => <button key={id} className={cat === id ? 'on' : ''} onClick={() => setCat(id)}><span className="material-symbols-outlined" style={{fontSize:14}}>{icon}</span>{label}<span className="n">{categoryCounts[id] || 0}</span></button>)}</div></div>
          <div className="msg-items">
            {loading ? <EmptyState icon="hourglass_empty" title={'\u6b63\u5728\u52a0\u8f7d'} />
              : error ? <EmptyState icon="error" title={error} />
              : filtered.length === 0 ? <EmptyState icon="forum" title={'\u6682\u65e0\u6d88\u606f'} />
              : groupedMessages.map(group => <div className="msg-group" key={group.kind}><div className="msg-group-title">{group.label}<span>{group.items.length}</span></div>{group.items.map(message => <div key={message.id} className={'msg-item' + (message.unread ? ' unread' : '') + (selected && selected.id === message.id ? ' selected' : '')} onClick={() => markRead(message)}><div className="msg-icn" style={{background: message.c1, color: message.c2}}><span className="material-symbols-outlined">{message.icn}</span></div><div className="msg-text-block"><div className="msg-name">{message.title}</div><div className="msg-preview">{message.body}</div></div><div className="msg-time">{formatDate(message.time)}</div></div>)}</div>)}
          </div>
        </div>
        <div className="msg-detail">{selected ? <><div className="msg-detail-head"><div className="icn" style={{background:selected.c1, color:selected.c2}}><span className="material-symbols-outlined">{selected.icn}</span></div><div className="info"><h4 className="t">{selected.title}</h4><div className="s">{labelMap[selected.kind]}</div></div></div><div className="msg-detail-body"><div className="msg-bubble"><div className="who"><b>{selected.title}</b><span> {formatDate(selected.time)}</span></div><div className="bb">{selected.body}</div></div></div></> : <EmptyState icon="forum" title={'\u9009\u62e9\u4e00\u6761\u6d88\u606f'} />}</div>
      </div>
    </div>
  );
}

function FavoritesPage() {
  const Api = window.CampusShareApi;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setLoading(true);
    Promise.all([
      Api.ListMyFavoriteProducts ? Api.ListMyFavoriteProducts(1, 100) : Promise.resolve([]),
      Api.ListMyFavoriteMaterials ? Api.ListMyFavoriteMaterials(1, 100) : Promise.resolve([])
    ]).then(([productsResult, materialsResult]) => {
      const products = listOf(productsResult).map(item => ({ id: `p-${item.productId || item.id}`, title: item.productTitle || item.title || '\u5546\u54c1', type: '\u5546\u54c1', price: item.askingPrice, c1:'#e0f2fe', c2:'#2563eb' }));
      const materials = listOf(materialsResult).map(item => ({ id: `m-${item.materialId || item.id}`, title: item.materialTitle || item.title || '\u8d44\u6599', type: '\u8d44\u6599', price: item.pointCost, c1:'#dcfce7', c2:'#16a34a' }));
      setItems(products.concat(materials));
      setError('');
    }).catch(err => setError(err && err.message ? err.message : '\u6536\u85cf\u52a0\u8f7d\u5931\u8d25'))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="page-fade">
      <div className="page-head"><div className="ttl-block"><div className="ttl">{'\u6536\u85cf\u5939'}</div><div className="sub">{'\u67e5\u770b\u5df2\u6536\u85cf\u7684\u5546\u54c1\u548c\u8d44\u6599'}</div></div></div>
      {loading ? <div className="card"><EmptyState icon="hourglass_empty" title={'\u6b63\u5728\u52a0\u8f7d'} /></div>
        : error ? <div className="card"><EmptyState icon="error" title={error} /></div>
        : items.length === 0 ? <div className="card"><EmptyState icon="favorite_border" title={'\u6682\u65e0\u6536\u85cf'} /></div>
        : <div className="fav-grid">{items.map(item => <div className="card fav-card" key={item.id}><div className="fav-thumb" style={{'--c1': item.c1, '--c2': item.c2}}><div className="ph">{item.title.slice(0, 1)}</div></div><div className="fav-body"><div className="title">{item.title}</div><div className="meta"><div>{item.type}</div><div className="price">{item.price == null ? '-' : Number(item.price).toLocaleString()}</div></div></div></div>)}</div>}
    </div>
  );
}

function SettingsPage() {
  const Api = window.CampusShareApi;
  const SETTINGS_STORAGE_KEY = 'campusshare.workspaceSettings';
  const defaultVals = { name:'', school:'', major:'', year:'', email:'', phone:'', showSchool:true, showStats:true, allowChat:true, notif_order:true, notif_chat:true, notif_team:true, notif_system:false, notif_email:false, theme:'light', lang:'zh-CN' };
  const readStoredSettings = () => { try { return JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}') || {}; } catch (error) { return {}; } };
  const [active, setActive] = useState('profile');
  const [vals, setVals] = useState(Object.assign({}, defaultVals, readStoredSettings()));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const persistLocalSettings = (nextVals) => window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ showSchool:nextVals.showSchool, showStats:nextVals.showStats, allowChat:nextVals.allowChat, notif_order:nextVals.notif_order, notif_chat:nextVals.notif_chat, notif_team:nextVals.notif_team, notif_system:nextVals.notif_system, notif_email:nextVals.notif_email }));
  const set = (key, value) => setVals(prev => { const next = Object.assign({}, prev, { [key]: value }); persistLocalSettings(next); return next; });
  useEffect(() => {
    let alive = true;
    const applyProfile = (profile) => {
      if (!alive || !profile) return;
      setVals(prev => Object.assign({}, prev, { name: profile.displayName || profile.nickname || profile.userName || profile.account || prev.name, school: profile.college || profile.school || prev.school, major: profile.major || prev.major, year: profile.grade || profile.enrollmentYear || prev.year, email: profile.email || profile.contact || profile.mail || prev.email, phone: profile.phone || profile.mobile || profile.contactPhone || prev.phone }));
    };
    applyProfile(Api && Api.GetCurrentUserProfile ? Api.GetCurrentUserProfile() : null);
    if (Api && Api.SyncSessionProfile) Api.SyncSessionProfile().then(applyProfile).catch(() => setNotice('\u7528\u6237\u4fe1\u606f\u52a0\u8f7d\u5931\u8d25'));
    return () => { alive = false; };
  }, []);
  const saveSettings = () => {
    setSaving(true);
    persistLocalSettings(vals);
    const payload = { displayName: vals.name, college: vals.school, major: vals.major, grade: vals.year, email: vals.email, phone: vals.phone };
    const request = Api && Api.UpdateMyProfile ? Api.UpdateMyProfile(payload) : Promise.resolve();
    request.then(() => { setNotice('\u8bbe\u7f6e\u5df2\u4fdd\u5b58'); if (Api && Api.SyncSessionProfile) Api.SyncSessionProfile().catch(() => {}); })
      .catch(err => setNotice(err && err.message ? err.message : '\u4fdd\u5b58\u5931\u8d25'))
      .finally(() => setSaving(false));
  };
  const sections = [['profile','\u57fa\u672c\u4fe1\u606f'], ['account','\u8d26\u53f7\u5b89\u5168'], ['notif','\u901a\u77e5\u8bbe\u7f6e'], ['privacy','\u9690\u79c1\u8bbe\u7f6e'], ['appearance','\u5916\u89c2'], ['danger','\u5371\u9669\u64cd\u4f5c']];
  const scrollTo = (id) => { setActive(id); const el = document.getElementById('section-' + id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior:'smooth' }); };
  const switchRow = (key, label, help) => <div className="settings-row" key={key}><div className="settings-label">{label}{help && <div className="help">{help}</div>}</div><div className="settings-value"><button type="button" aria-pressed={!!vals[key]} className={'switch' + (vals[key] ? ' on' : '')} onClick={() => set(key, !vals[key])} /></div></div>;
  const disabledNote = <span className="settings-disabled-note"><span className="material-symbols-outlined" style={{fontSize:14}}>block</span>{'\u6682\u4e0d\u652f\u6301'}</span>;
  return (
    <div className="page-fade">
      <div className="page-head"><div className="ttl-block"><div className="ttl">{'\u4e2a\u4eba\u8bbe\u7f6e'}</div><div className="sub">{'\u7ba1\u7406\u8d26\u53f7\u3001\u9690\u79c1\u548c\u901a\u77e5\u504f\u597d'}</div></div><div className="actions"><button className="primary-btn" onClick={saveSettings} disabled={saving}><span className="material-symbols-outlined">check</span>{saving ? '\u4fdd\u5b58\u4e2d' : '\u4fdd\u5b58\u4fee\u6539'}</button></div></div>
      {notice && <div className="card" style={{padding:'10px 14px', marginBottom:14, color: notice.includes('\u5931\u8d25') ? 'var(--rose)' : 'var(--green)', fontSize:13, fontWeight:700}}>{notice}</div>}
      <div className="settings-layout">
        <aside className="settings-anchor-nav">{sections.map(([id, label]) => <a key={id} className={active === id ? 'active' : ''} onClick={() => scrollTo(id)}>{label}</a>)}</aside>
        <div>
          <div id="section-profile" className="card settings-card"><div className="head"><h3>{'\u57fa\u672c\u4fe1\u606f'}</h3><p>{'\u4ece\u5f53\u524d\u7528\u6237\u8d44\u6599\u63a5\u53e3\u540c\u6b65\u5e76\u53ef\u4fdd\u5b58\u4fee\u6539\u3002'}</p></div><div className="settings-row"><div className="settings-label">{'\u6635\u79f0'}</div><div className="settings-value"><input className="input-line" value={vals.name} onChange={e => set('name', e.target.value)} /></div></div><div className="settings-row"><div className="settings-label">{'\u5b66\u9662\u4e0e\u4e13\u4e1a'}</div><div className="settings-value"><input className="input-line" value={vals.school} onChange={e => set('school', e.target.value)} placeholder={'\u5b66\u9662'} /><input className="input-line" style={{maxWidth:260}} value={vals.major} onChange={e => set('major', e.target.value)} placeholder={'\u4e13\u4e1a'} /></div></div><div className="settings-row"><div className="settings-label">{'\u5165\u5b66\u5e74\u4efd'}</div><div className="settings-value"><input className="input-line" style={{maxWidth:180}} value={vals.year} onChange={e => set('year', e.target.value)} /></div></div></div>
          <div id="section-account" className="card settings-card"><div className="head"><h3>{'\u8d26\u53f7\u5b89\u5168'}</h3><p>{'\u8054\u7cfb\u65b9\u5f0f\u5c06\u4fdd\u5b58\u5230\u7528\u6237\u8d44\u6599\u3002'}</p></div><div className="settings-row"><div className="settings-label">{'\u90ae\u7bb1'}</div><div className="settings-value"><input className="input-line" value={vals.email} onChange={e => set('email', e.target.value)} /></div></div><div className="settings-row"><div className="settings-label">{'\u624b\u673a\u53f7'}</div><div className="settings-value"><input className="input-line" value={vals.phone} onChange={e => set('phone', e.target.value)} /></div></div></div>
          <div id="section-notif" className="card settings-card"><div className="head"><h3>{'\u901a\u77e5\u8bbe\u7f6e'}</h3><p>{'\u5f00\u5173\u72b6\u6001\u4f1a\u81ea\u52a8\u6301\u4e45\u5316\u5230\u672c\u5730\u3002'}</p></div>{[['notif_order','\u8ba2\u5355\u901a\u77e5','\u652f\u4ed8\u3001\u53d1\u8d27\u3001\u9762\u4ea4\u53ca\u72b6\u6001\u53d8\u66f4'], ['notif_chat','\u79c1\u4fe1\u6d88\u606f','\u6765\u81ea\u5176\u4ed6\u540c\u5b66\u7684\u79c1\u4fe1'], ['notif_team','\u7ec4\u961f\u62db\u52df','\u7533\u8bf7\u5ba1\u6279\u7ed3\u679c\u901a\u77e5'], ['notif_system','\u7cfb\u7edf\u516c\u544a','\u5e73\u53f0\u66f4\u65b0\u4e0e\u6d3b\u52a8\u63a8\u9001'], ['notif_email','\u90ae\u4ef6\u6458\u8981','\u6bcf\u5468\u6d3b\u52a8\u6c47\u603b\u90ae\u4ef6']].map(([key, label, help]) => switchRow(key, label, help))}</div>
          <div id="section-privacy" className="card settings-card"><div className="head"><h3>{'\u9690\u79c1\u8bbe\u7f6e'}</h3><p>{'\u63a7\u5236\u5176\u4ed6\u4eba\u53ef\u4ee5\u770b\u5230\u7684\u4fe1\u606f\u3002'}</p></div>{[['showSchool','\u663e\u793a\u5b66\u9662\u4fe1\u606f'], ['showStats','\u663e\u793a\u4ea4\u6613\u6570\u636e'], ['allowChat','\u5141\u8bb8\u4ed6\u4eba\u53d1\u79c1\u4fe1']].map(([key, label]) => switchRow(key, label))}</div>
          <div id="section-appearance" className="card settings-card" aria-disabled="true"><div className="head"><h3>{'\u5916\u89c2'}</h3><p>{'\u5916\u89c2\u81ea\u5b9a\u4e49\u6682\u4e0d\u652f\u6301\uff0c\u540e\u7eed\u7248\u672c\u5f00\u653e\u3002'}</p></div><div className="settings-row"><div className="settings-label">{'\u4e3b\u9898'}<div className="help">{'\u6682\u4e0d\u652f\u6301\u4fee\u6539\u4e3b\u9898'}</div></div><div className="settings-value"><div className="seg" style={{background:'rgba(0,0,0,0.04)', opacity:.62, cursor:'not-allowed'}}>{[['light','\u6d45\u8272'], ['dark','\u6df1\u8272'], ['auto','\u8ddf\u968f\u7cfb\u7edf']].map(([value, label]) => <button key={value} className={vals.theme === value ? 'on' : ''} disabled title={'\u6682\u4e0d\u652f\u6301\u5916\u89c2\u8bbe\u7f6e'}>{label}</button>)}</div>{disabledNote}</div></div><div className="settings-row"><div className="settings-label">{'\u8bed\u8a00'}<div className="help">{'\u6682\u4e0d\u652f\u6301\u5207\u6362\u8bed\u8a00'}</div></div><div className="settings-value"><select className="select-line" value={vals.lang} disabled title={'\u6682\u4e0d\u652f\u6301\u5916\u89c2\u8bbe\u7f6e'}><option value="zh-CN">{'\u4e2d\u6587'}</option><option value="en-US">English</option></select>{disabledNote}</div></div></div>
          <div id="section-danger" className="card settings-card danger-zone"><div className="head"><h3>{'\u5371\u9669\u64cd\u4f5c'}</h3><p>{'\u4ee5\u4e0b\u64cd\u4f5c\u8bf7\u8c28\u614e\u5904\u7406\u3002'}</p></div><div className="settings-row"><div className="settings-label">{'\u9000\u51fa\u767b\u5f55'}</div><div className="settings-value"><button className="btn-sm" onClick={() => Api && Api.LogoutAndRedirect && Api.LogoutAndRedirect()}><span className="material-symbols-outlined">logout</span>{'\u9000\u51fa\u767b\u5f55'}</button></div></div></div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MyPostsPage, OrdersPage, MessagesPage, FavoritesPage, SettingsPage });
