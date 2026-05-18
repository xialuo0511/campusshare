// CampusShare Publish — three-in-one publishing form

const { useState: useStPub, useEffect: useEffPub, useMemo: useMemoPub } = React;

const PUB_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#005d90",
  "kind": "goods",
  "showTips": true
}/*EDITMODE-END*/;

// ───────── Tab definitions ─────────
const PUB_KINDS = [
  {
    id: 'goods', label: '商品', icon: 'storefront',
    title: '发布商品',
    sub: '把宿舍闲置卖给同学，省下打包邮费',
    tone: 'blue',
    c1: '#dbeafe', c2: '#1d6fe0'
  },
  {
    id: 'notes', label: '资料', icon: 'menu_book',
    title: '发布资料',
    sub: '把你的笔记、真题、PPT 分享给学弟学妹',
    tone: 'violet',
    c1: '#f1ebff', c2: '#7c3aed'
  },
  {
    id: 'team', label: '招募', icon: 'groups',
    title: '发布招募',
    sub: '找队友、招新成员、组比赛队',
    tone: 'green',
    c1: '#e7f6ee', c2: '#0a8a4f'
  }
];

const PUB_API = () => window.CampusShareApi;

function pubNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildGoodsPayload(state) {
  if (!state.title.trim()) throw new Error('请填写商品标题');
  if (!state.price) throw new Error('请填写商品售价');
  return {
    title: state.title.trim(),
    category: state.cat || 'other',
    conditionLevel: state.cond || '90',
    price: pubNumber(state.price),
    tradeLocation: state.places && state.places.length ? state.places.join('、') : '校内面交',
    description: [state.desc, state.tags && state.tags.length ? `标签：${state.tags.join('、')}` : ''].filter(Boolean).join('\n'),
    imageFileIds: state.imageFileIds || []
  };
}

function buildMaterialPayload(state) {
  if (!state.title.trim()) throw new Error('请填写资料标题');
  if (!state.uploadedFile || !state.uploadedFile.fileId) throw new Error('请先上传资料文件');
  return {
    courseName: state.title.trim(),
    tags: [state.cat, state.course].concat(state.tags || []).filter(Boolean),
    description: [state.desc, state.teacher ? `任课教师：${state.teacher}` : '', state.college ? `学院：${state.college}` : ''].filter(Boolean).join('\n'),
    fileId: state.uploadedFile.fileId,
    fileType: state.uploadedFile.fileType || 'UNKNOWN',
    fileSizeBytes: state.uploadedFile.fileSizeBytes || 0,
    copyrightDeclared: true
  };
}

function buildRecruitmentPayload(state) {
  if (!state.title.trim()) throw new Error('请填写招募标题');
  const memberLimit = (state.roles || []).reduce((sum, role) => sum + pubNumber(role.n, 0), 0) || 1;
  return {
    eventName: state.title.trim(),
    direction: state.kind || 'other',
    memberLimit,
    deadline: state.deadline ? `${state.deadline}T23:59:59` : undefined,
    skillRequirement: [
      state.desc,
      state.req ? `申请要求：${state.req}` : '',
      state.roles && state.roles.length ? `角色：${state.roles.map(r => `${r.name || '成员'} ${r.n || 1}人 ${r.need || ''}`).join('；')}` : '',
      state.reward ? `回报：${state.reward}` : '',
      state.tags && state.tags.length ? `标签：${state.tags.join('、')}` : ''
    ].filter(Boolean).join('\n')
  };
}

const GOODS_CATS = [
  { id: 'book', label: '教材书籍', icon: 'menu_book' },
  { id: 'elec', label: '电子产品', icon: 'devices' },
  { id: 'life', label: '生活用品', icon: 'home' },
  { id: 'cloth', label: '服饰鞋包', icon: 'checkroom' },
  { id: 'sport', label: '运动器材', icon: 'sports_tennis' },
  { id: 'instr', label: '乐器', icon: 'piano' },
  { id: 'bike', label: '出行/自行车', icon: 'pedal_bike' },
  { id: 'other', label: '其他', icon: 'category' }
];

const GOODS_CONDITIONS = [
  { id: '99', label: '全新未拆', desc: '原封包装' },
  { id: '95', label: '95 新', desc: '极少使用' },
  { id: '90', label: '9 成新', desc: '少量痕迹' },
  { id: '80', label: '8 成新', desc: '常规使用痕迹' },
  { id: '70', label: '7 成新', desc: '明显使用痕迹' }
];

const NOTES_CATS = [
  { id: 'note', label: '课程笔记' },
  { id: 'exam', label: '真题答案' },
  { id: 'ppt',  label: '复习 PPT' },
  { id: 'lab',  label: '实验报告' },
  { id: 'thesis', label: '毕设参考' },
  { id: 'paper', label: '论文/英文文献' },
  { id: 'other', label: '其他资料' }
];

const TEAM_KINDS = [
  { id: 'race',  label: '学科竞赛', icon: 'emoji_events' },
  { id: 'reseq', label: '科研项目', icon: 'science' },
  { id: 'org',   label: '学生组织', icon: 'corporate_fare' },
  { id: 'event', label: '校园活动', icon: 'celebration' },
  { id: 'study', label: '学习小组', icon: 'school' },
  { id: 'sport', label: '运动社团', icon: 'sports_basketball' }
];

const COMMON_TAGS_GOODS = ['九成新', '可面交', '宿舍自提', '原盒齐全', '配件全', '保修内', '可议价'];
const COMMON_TAGS_NOTES = ['期末复习', '考研', '高分笔记', '彩色手写', '含真题', '思维导图', '英文资料'];
const COMMON_TAGS_TEAM  = ['长期', '短期', '可远程', '需打卡', '面向大一', '面向大二+', '欢迎转专业'];

// ───────── Reusable bits ─────────
function FormCard({ icon, title, desc, children, accent }) {
  return (
    <div className="card form-card">
      <div className="fc-head">
        <div className={'fc-icn' + (accent ? ' accent' : '')}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="fc-info">
          <div className="fc-t">{title}</div>
          {desc && <div className="fc-d">{desc}</div>}
        </div>
      </div>
      <div className="fc-body">{children}</div>
    </div>
  );
}

function Field({ label, required, help, children, side }) {
  return (
    <div className="field-row">
      <div className="field-label">
        {label}{required && <em className="req">*</em>}
        {help && <span className="field-help">{help}</span>}
      </div>
      <div className="field-val">
        {children}
        {side}
      </div>
    </div>
  );
}

function ChipChoice({ options, value, onChange, columns }) {
  return (
    <div className="chip-choice" style={{gridTemplateColumns: columns ? `repeat(${columns}, 1fr)` : undefined}}>
      {options.map(o => (
        <button key={o.id}
          className={'chip-opt' + (value === o.id ? ' on' : '')}
          onClick={() => onChange(o.id)}>
          {o.icon && <span className="material-symbols-outlined">{o.icon}</span>}
          <span>
            <b>{o.label}</b>
            {o.desc && <i>{o.desc}</i>}
          </span>
        </button>
      ))}
    </div>
  );
}

function TagPicker({ value, onChange, suggestions }) {
  const [draft, setDraft] = useStPub('');
  const toggle = (t) => {
    if (value.includes(t)) onChange(value.filter(x => x !== t));
    else onChange([...value, t]);
  };
  const submit = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  };
  return (
    <div className="tag-picker">
      <div className="tag-row">
        {value.map(t => (
          <span key={t} className="tag-on" onClick={() => toggle(t)}>
            {t}<span className="material-symbols-outlined">close</span>
          </span>
        ))}
        <div className="tag-input-wrap">
          <input value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
            placeholder={value.length === 0 ? '输入自定义标签，回车添加' : '+ 添加'} />
        </div>
      </div>
      <div className="tag-suggest">
        <span className="tag-suggest-label">推荐</span>
        {suggestions.map(t => (
          <span key={t}
            className={'tag-sug' + (value.includes(t) ? ' on' : '')}
            onClick={() => toggle(t)}>
            {value.includes(t) ? '✓ ' : '+ '}{t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ImageUploader({ slots = 6, kind, uploadedCount = 0, uploading = false, onFilesSelected }) {
  const controlled = typeof onFilesSelected === 'function';
  const [imgs, setImgs] = useStPub([
    { id: 1, ph: '主图' },
    { id: 2, ph: '细节 1' }
  ]);
  const shownImgs = controlled
    ? Array.from({ length: uploadedCount }, (_, i) => ({ id: i + 1, ph: i === 0 ? 'Cover' : `Image ${i + 1}` }))
    : imgs;
  const remain = slots - shownImgs.length;
  const phLabel = kind === 'goods' ? '物品照片'
                : kind === 'notes' ? '资料预览'
                : '招募海报';
  return (
    <div className="img-uploader">
      {controlled && (
        <input
          id={`publish-${kind}-images`}
          type="file"
          accept="image/*"
          multiple
          onChange={onFilesSelected}
          style={{position:'absolute', opacity:0, pointerEvents:'none'}}
        />
      )}
      {shownImgs.map((im, i) => (
        <div key={im.id} className={'img-slot filled' + (i === 0 ? ' cover' : '')}>
          <div className="img-ph">
            <span className="material-symbols-outlined">image</span>
            <span>{im.ph}</span>
          </div>
          {i === 0 && <span className="img-cover-tag">封面</span>}
          {!controlled && <button className="img-rm"
            onClick={() => setImgs(imgs.filter(x => x.id !== im.id))}>
            <span className="material-symbols-outlined">close</span>
          </button>}
        </div>
      ))}
      {remain > 0 && (
        <button className="img-slot empty"
          onClick={() => controlled
            ? document.getElementById(`publish-${kind}-images`)?.click()
            : setImgs([...imgs, { id: Date.now(), ph: `图 ${imgs.length + 1}` }])}>
          <span className="material-symbols-outlined">add_photo_alternate</span>
          <span>{uploading ? 'Uploading...' : `添加 ${phLabel}`}</span>
          <i>{shownImgs.length}/{slots}</i>
        </button>
      )}
    </div>
  );
}

// ───────── Goods form ─────────
function GoodsForm({ state, set }) {
  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const Api = PUB_API();
    if (!Api || !Api.UploadProductImage) {
      window.alert('Product image upload API unavailable');
      return;
    }
    set('uploadingImages', true);
    try {
      const uploadedIds = [];
      for (const file of files) {
        const result = await Api.UploadProductImage(file);
        const fileId = result && (result.fileId ?? result.id ?? (result.data && result.data.fileId));
        if (fileId !== null && fileId !== undefined) uploadedIds.push(fileId);
      }
      set('imageFileIds', [...(state.imageFileIds || []), ...uploadedIds]);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Image upload failed');
    } finally {
      set('uploadingImages', false);
      event.target.value = '';
    }
  };

  return (
    <>
      <FormCard icon="image" title="商品图片" desc="第 1 张为封面，建议 4–6 张，覆盖正面、细节、瑕疵">
        <ImageUploader slots={6} kind="goods" uploadedCount={(state.imageFileIds || []).length} uploading={state.uploadingImages} onFilesSelected={uploadImages} />
        <div className="file-sub">Uploaded {(state.imageFileIds || []).length}/6 images{state.uploadingImages ? ' - uploading...' : ''}</div>
        <button className="btn-sm primary" onClick={() => document.getElementById('publish-goods-images')?.click()}>
          <span className="material-symbols-outlined">add</span>{state.uploadingImages ? 'Uploading...' : 'Select images'}
        </button>
      </FormCard>

      <FormCard icon="title" title="基本信息">
        <Field label="商品标题" required help="20–30 字，包含品牌型号和成色">
          <input className="inp" value={state.title} onChange={e=>set('title', e.target.value)}
            placeholder="例：iPad Air 4 · 64G · 自用一年配触控笔" maxLength={40} />
          <span className="inp-count">{state.title.length}/40</span>
        </Field>
        <Field label="分类" required>
          <div className="cat-grid">
            {GOODS_CATS.map(c => (
              <button key={c.id}
                className={'cat-chip' + (state.cat === c.id ? ' on' : '')}
                onClick={()=>set('cat', c.id)}>
                <span className="material-symbols-outlined">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="商品成色" required>
          <ChipChoice columns={5} options={GOODS_CONDITIONS} value={state.cond} onChange={(v)=>set('cond', v)} />
        </Field>
        <Field label="详细描述" required help="说清来源、使用情况、瑕疵，越具体越好成交">
          <textarea className="inp ta" rows={4}
            value={state.desc} onChange={e=>set('desc', e.target.value)}
            placeholder="自用 8 个月，平时仅在宿舍使用。屏幕无划痕，电池效率 96%，附原装包装盒、充电器、Apple Pencil 二代，已贴磨砂膜。仅限校内当面验机。"></textarea>
        </Field>
        <Field label="标签" help="便于学弟学妹搜到">
          <TagPicker value={state.tags} onChange={(v)=>set('tags', v)} suggestions={COMMON_TAGS_GOODS} />
        </Field>
      </FormCard>

      <FormCard icon="payments" title="价格与交易">
        <Field label="售价" required>
          <div className="price-row">
            <span className="y">¥</span>
            <input className="inp price-inp" inputMode="numeric"
              value={state.price} onChange={e=>set('price', e.target.value.replace(/\D/g,''))}
              placeholder="0" />
            <span className="orig-row">
              原价 ¥
              <input className="inp orig-inp" inputMode="numeric"
                value={state.orig} onChange={e=>set('orig', e.target.value.replace(/\D/g,''))}
                placeholder="可选" />
            </span>
          </div>
        </Field>
        <Field label="是否议价">
          <div className="seg-small">
            {[['no','一口价'],['yes','可小刀'],['ask','面议']].map(([v, l])=>(
              <button key={v} className={state.bargain===v?'on':''} onClick={()=>set('bargain', v)}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="交易方式" required>
          <div className="seg-small">
            {[['meet','线下面交','handshake'],['mail','邮寄','local_shipping'],['both','均可','swap_horiz']].map(([v,l,i])=>(
              <button key={v} className={state.deliver===v?'on':''} onClick={()=>set('deliver', v)}>
                <span className="material-symbols-outlined">{i}</span>{l}
              </button>
            ))}
          </div>
        </Field>
        <Field label="面交地点" help="多选，仅在选择面交时使用">
          <div className="multi-chip">
            {['西门交易点','宿舍楼下','图书馆门口','工学院楼下','体育馆','约定地点'].map(p=>(
              <span key={p}
                className={'mc-chip' + (state.places.includes(p) ? ' on':'')}
                onClick={()=>set('places', state.places.includes(p) ? state.places.filter(x=>x!==p) : [...state.places, p])}>
                <span className="material-symbols-outlined">place</span>{p}
              </span>
            ))}
          </div>
        </Field>
      </FormCard>
    </>
  );
}

// ───────── Notes form ─────────
function NotesForm({ state, set }) {
  const uploadFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const Api = PUB_API();
    if (!Api || !Api.UploadMaterialFile) {
      window.alert('文件上传 API 不可用');
      return;
    }
    set('uploading', true);
    try {
      const result = await Api.UploadMaterialFile(file);
      set('uploadedFile', result);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '文件上传失败');
    } finally {
      set('uploading', false);
      event.target.value = '';
    }
  };

  return (
    <>
      <FormCard icon="upload_file" title="资料文件" desc="支持 PDF / 图片 / Word / PPT，单文件最大 50MB">
        <div className="file-drop">
          <input id="publish-material-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.zip" onChange={uploadFile} style={{position:'absolute', opacity:0, pointerEvents:'none'}} />
          <div className="fd-icn">
            <span className="material-symbols-outlined">upload_file</span>
          </div>
          <div className="fd-text">
            <b>拖拽文件到这里，或</b>
            <button className="btn-sm primary" onClick={() => document.getElementById('publish-material-file')?.click()}><span className="material-symbols-outlined">add</span>{state.uploading ? '上传中...' : '选择文件'}</button>
          </div>
          <div className="fd-formats">
            <span className="ext-chip pdf">PDF</span>
            <span className="ext-chip doc">DOCX</span>
            <span className="ext-chip ppt">PPTX</span>
            <span className="ext-chip img">PNG/JPG</span>
            <span className="ext-chip zip">ZIP</span>
          </div>
        </div>
        {state.uploadedFile && (
          <div className="file-list">
            <div className="file-row">
              <span className="file-thumb pdf"><span className="material-symbols-outlined">description</span></span>
              <div className="file-info">
                <div className="file-name">{state.uploadedFile.fileName || '已上传文件'}</div>
                <div className="file-sub">fileId: {state.uploadedFile.fileId}</div>
              </div>
              <span className="file-status ok">完成</span>
            </div>
          </div>
        )}
        <div className="file-list">
          <div className="file-row">
            <span className="file-thumb pdf"><span className="material-symbols-outlined">picture_as_pdf</span></span>
            <div className="file-info">
              <div className="file-name">机器学习导论 · 全套手写笔记.pdf</div>
              <div className="file-sub">12.4 MB · 28 页 · 已扫描</div>
            </div>
            <div className="file-prog"><div className="bar" style={{width:'100%'}} /></div>
            <span className="file-status ok">完成</span>
            <button className="img-rm"><span className="material-symbols-outlined">close</span></button>
          </div>
          <div className="file-row">
            <span className="file-thumb img"><span className="material-symbols-outlined">image</span></span>
            <div className="file-info">
              <div className="file-name">第 5 章思维导图.png</div>
              <div className="file-sub">2.8 MB · 1080 × 1920</div>
            </div>
            <div className="file-prog"><div className="bar" style={{width:'72%'}} /></div>
            <span className="file-status">72%</span>
            <button className="img-rm"><span className="material-symbols-outlined">close</span></button>
          </div>
        </div>
        <button className="btn-sm" style={{marginTop:8}}><span className="material-symbols-outlined">add</span>继续添加文件</button>
      </FormCard>

      <FormCard icon="title" title="资料信息">
        <Field label="资料标题" required help="包含课程名、类型、范围">
          <input className="inp" value={state.title} onChange={e=>set('title', e.target.value)}
            placeholder="例：高等数学（下）· 期末复习全套手写笔记 + 真题解析" maxLength={50} />
          <span className="inp-count">{state.title.length}/50</span>
        </Field>
        <Field label="资料类型" required>
          <div className="chip-row">
            {NOTES_CATS.map(c => (
              <button key={c.id}
                className={'pill-chip' + (state.cat === c.id ? ' on' : '')}
                onClick={()=>set('cat', c.id)}>{c.label}</button>
            ))}
          </div>
        </Field>
        <Field label="课程 / 科目" required>
          <input className="inp" value={state.course} onChange={e=>set('course', e.target.value)}
            placeholder="例：高等数学（下）" />
        </Field>
        <Field label="所属学院">
          <select className="inp sel" value={state.college} onChange={e=>set('college', e.target.value)}>
            <option>工学院</option><option>理学院</option><option>商学院</option>
            <option>人文学院</option><option>外国语学院</option><option>公共课</option>
          </select>
        </Field>
        <Field label="任课老师" help="选填，便于查找">
          <input className="inp" value={state.teacher} onChange={e=>set('teacher', e.target.value)}
            placeholder="例：张教授" />
        </Field>
        <Field label="适用年级" required>
          <div className="multi-chip">
            {['大一','大二','大三','大四','研究生','考研'].map(g => (
              <span key={g}
                className={'mc-chip' + (state.grades.includes(g) ? ' on' : '')}
                onClick={()=>set('grades', state.grades.includes(g) ? state.grades.filter(x=>x!==g) : [...state.grades, g])}>
                {g}
              </span>
            ))}
          </div>
        </Field>
        <Field label="资料简介" required help="概括内容、范围、用法">
          <textarea className="inp ta" rows={4}
            value={state.desc} onChange={e=>set('desc', e.target.value)}
            placeholder="涵盖第 1–9 章核心公式与典型例题，附 5 套近 5 年期末真题完整解析。手写工整，重点彩色标注，适合期末突击与考研复习。"></textarea>
        </Field>
        <Field label="标签">
          <TagPicker value={state.tags} onChange={(v)=>set('tags', v)} suggestions={COMMON_TAGS_NOTES} />
        </Field>
      </FormCard>

      <FormCard icon="redeem" title="定价方式" desc="选择免费分享，或赚取积分 / 现金">
        <Field label="定价" required>
          <div className="price-mode">
            {[
              ['free','free','免费分享','volunteer_activism'],
              ['point','point','积分下载','workspace_premium'],
              ['paid','paid','付费下载','paid']
            ].map(([id, v, l, i])=>(
              <button key={id}
                className={'pm-card' + (state.priceMode === v ? ' on' : '')}
                onClick={()=>set('priceMode', v)}>
                <span className="material-symbols-outlined">{i}</span>
                <b>{l}</b>
              </button>
            ))}
          </div>
        </Field>
        {state.priceMode === 'point' && (
          <Field label="所需积分" required>
            <input className="inp" style={{maxWidth:200}}
              inputMode="numeric" value={state.points}
              onChange={e=>set('points', e.target.value.replace(/\D/g,''))}
              placeholder="例：200" />
            <span className="inp-suffix">积分 / 次下载</span>
          </Field>
        )}
        {state.priceMode === 'paid' && (
          <Field label="售价" required>
            <div className="price-row">
              <span className="y">¥</span>
              <input className="inp price-inp" inputMode="numeric"
                value={state.price} onChange={e=>set('price', e.target.value.replace(/\D/g,''))}
                placeholder="0" />
              <span className="inp-suffix">每次下载，平台抽取 10%</span>
            </div>
          </Field>
        )}
        <Field label="允许预览" help="买家可查看前 N 页缩略图">
          <div className="seg-small">
            {[['0','不允许'],['3','前 3 页'],['5','前 5 页'],['all','全部']].map(([v,l])=>(
              <button key={v} className={state.preview===v?'on':''} onClick={()=>set('preview', v)}>{l}</button>
            ))}
          </div>
        </Field>
      </FormCard>
    </>
  );
}

// ───────── Team form ─────────
function TeamForm({ state, set }) {
  return (
    <>
      <FormCard icon="image" title="招募封面" desc="选填，建议上传海报或队伍 logo">
        <ImageUploader slots={4} kind="team" />
      </FormCard>

      <FormCard icon="title" title="招募信息">
        <Field label="项目名称" required>
          <input className="inp" value={state.title} onChange={e=>set('title', e.target.value)}
            placeholder="例：挑战杯参赛队 · 校园 AI 助手项目" maxLength={40} />
          <span className="inp-count">{state.title.length}/40</span>
        </Field>
        <Field label="招募类型" required>
          <div className="cat-grid">
            {TEAM_KINDS.map(c => (
              <button key={c.id}
                className={'cat-chip' + (state.kind === c.id ? ' on' : '')}
                onClick={()=>set('kind', c.id)}>
                <span className="material-symbols-outlined">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="项目简介" required help="目标、阶段成果、亮点">
          <textarea className="inp ta" rows={4}
            value={state.desc} onChange={e=>set('desc', e.target.value)}
            placeholder="目标参加 2026 挑战杯，研究方向：基于大模型的校园 AI 助手，已有原型 demo。目前团队 3 人（队长 + 算法 + 产品）。"></textarea>
        </Field>
        <Field label="标签">
          <TagPicker value={state.tags} onChange={(v)=>set('tags', v)} suggestions={COMMON_TAGS_TEAM} />
        </Field>
      </FormCard>

      <FormCard icon="group_add" title="角色与人数">
        <div className="role-list">
          {state.roles.map((r, i) => (
            <div key={i} className="role-row">
              <input className="inp role-name" value={r.name}
                onChange={e=>set('roles', state.roles.map((x,j)=>j===i?{...x, name:e.target.value}:x))}
                placeholder="角色名（如 前端开发）" />
              <input className="inp role-need" value={r.need}
                onChange={e=>set('roles', state.roles.map((x,j)=>j===i?{...x, need:e.target.value}:x))}
                placeholder="要求（如 熟悉 React）" />
              <div className="role-count">
                <button onClick={()=>set('roles', state.roles.map((x,j)=>j===i?{...x, n: Math.max(1, x.n-1)}:x))}>−</button>
                <span>{r.n} 人</span>
                <button onClick={()=>set('roles', state.roles.map((x,j)=>j===i?{...x, n: x.n+1}:x))}>+</button>
              </div>
              <button className="img-rm" onClick={()=>set('roles', state.roles.filter((_,j)=>j!==i))}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ))}
          <button className="btn-sm role-add"
            onClick={()=>set('roles', [...state.roles, { name:'', need:'', n: 1 }])}>
            <span className="material-symbols-outlined">add</span>添加角色
          </button>
        </div>
      </FormCard>

      <FormCard icon="event" title="时间与要求">
        <Field label="项目周期" required>
          <div className="seg-small">
            {[['short','1 个月内'],['mid','1–3 个月'],['long','3–6 个月'],['year','1 学年+'],['ongoing','长期']].map(([v,l])=>(
              <button key={v} className={state.duration===v?'on':''} onClick={()=>set('duration', v)}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="招募截止" required>
          <input type="date" className="inp" style={{maxWidth:200}}
            value={state.deadline} onChange={e=>set('deadline', e.target.value)} />
        </Field>
        <Field label="每周投入" help="预估时间承诺">
          <div className="seg-small">
            {[['<5','< 5 h'],['5-10','5–10 h'],['10-20','10–20 h'],['>20','> 20 h']].map(([v,l])=>(
              <button key={v} className={state.commit===v?'on':''} onClick={()=>set('commit', v)}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="工作模式">
          <div className="seg-small">
            {[['offline','线下'],['online','线上'],['hybrid','混合']].map(([v,l])=>(
              <button key={v} className={state.mode===v?'on':''} onClick={()=>set('mode', v)}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="申请要求" help="选填，会显示在招募卡上">
          <textarea className="inp ta" rows={3}
            value={state.req} onChange={e=>set('req', e.target.value)}
            placeholder="大二及以上，有基础 Python / Web 项目经验，能稳定参与到 7 月项目结题。"></textarea>
        </Field>
        <Field label="激励 / 回报" help="如有，请如实填写">
          <input className="inp" value={state.reward} onChange={e=>set('reward', e.target.value)}
            placeholder="例：校级 / 省级证书、署名论文、可作保研材料" />
        </Field>
      </FormCard>
    </>
  );
}

// ───────── Right side preview ─────────
function PreviewCard({ kind, state }) {
  const k = PUB_KINDS.find(p => p.id === kind);
  const isGoods = kind === 'goods';
  const isNotes = kind === 'notes';
  const isTeam  = kind === 'team';

  return (
    <div className="card preview-card">
      <div className="prev-head">
        <span className={'prev-kind tone-' + k.tone}>
          <span className="material-symbols-outlined">{k.icon}</span>
          {k.label}预览
        </span>
        <button className="btn-sm"><span className="material-symbols-outlined">visibility</span>整页预览</button>
      </div>
      <div className="prev-thumb" style={{background:`linear-gradient(135deg, ${k.c1}, ${k.c2})`}}>
        <span className="prev-thumb-ph">
          <span className="material-symbols-outlined">image</span>
          <span>{isGoods ? '商品封面' : isNotes ? '资料封面' : '招募海报'}</span>
        </span>
        {isGoods && state.cond && <span className="prev-cond">{GOODS_CONDITIONS.find(c=>c.id===state.cond)?.label}</span>}
        {isTeam && state.kind && <span className="prev-cond">{TEAM_KINDS.find(c=>c.id===state.kind)?.label}</span>}
      </div>
      <div className="prev-body">
        <div className="prev-title">{state.title || (isGoods ? '商品标题 · 在左侧填写' : isNotes ? '资料标题 · 在左侧填写' : '招募标题 · 在左侧填写')}</div>

        {isGoods && (
          <>
            <div className="prev-price">
              <span className="y">¥</span>{state.price || '0'}
              {state.orig && <span className="prev-orig">¥{state.orig}</span>}
            </div>
            <div className="prev-meta">
              <span><span className="material-symbols-outlined">category</span>{GOODS_CATS.find(c=>c.id===state.cat)?.label || '未分类'}</span>
              <span><span className="material-symbols-outlined">handshake</span>{state.deliver === 'meet' ? '面交' : state.deliver === 'mail' ? '邮寄' : '面交 / 邮寄'}</span>
            </div>
          </>
        )}
        {isNotes && (
          <>
            <div className="prev-price">
              {state.priceMode === 'free' && <span className="prev-free">免费分享</span>}
              {state.priceMode === 'point' && <span><span className="material-symbols-outlined" style={{fontSize:18, color:'var(--amber)', verticalAlign:-3}}>workspace_premium</span><b>{state.points || 0}</b> 积分</span>}
              {state.priceMode === 'paid' && <><span className="y">¥</span>{state.price || '0'}</>}
            </div>
            <div className="prev-meta">
              <span><span className="material-symbols-outlined">menu_book</span>{state.course || '课程未填'}</span>
              <span><span className="material-symbols-outlined">school</span>{state.college}</span>
            </div>
          </>
        )}
        {isTeam && (
          <>
            <div className="prev-team-stats">
              <div><span>招募</span><b>{state.roles.reduce((s, r)=>s+r.n,0)} 人</b></div>
              <div><span>截止</span><b>{state.deadline || '—'}</b></div>
              <div><span>周期</span><b>{({short:'1月内', mid:'1-3月', long:'3-6月', year:'1学年+', ongoing:'长期'})[state.duration] || '—'}</b></div>
            </div>
          </>
        )}

        {state.tags && state.tags.length > 0 && (
          <div className="prev-tags">
            {state.tags.slice(0,5).map(t => <span key={t} className="prev-tag">{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function TipsCard({ kind }) {
  const tipsMap = {
    goods: [
      ['photo_camera', '清晰多角度照片', '正面、细节、瑕疵各 1 张，光线充足'],
      ['price_check', '合理定价', '参考同类商品历史成交价的 60–80%'],
      ['report', '禁止物品', '不允许出售化妆品、食品、电子代练、账号等']
    ],
    notes: [
      ['copyright', '版权与原创', '资料须为本人整理或已获授权，禁止盗版'],
      ['preview', '展示前几页', '开放预览能显著提升下载转化率'],
      ['report', '不上传真题答案', '当年正在使用的考试真题答案将被驳回']
    ],
    team: [
      ['verified', '认证学籍优先', '认证学籍的招募贴会优先曝光'],
      ['policy', '禁止商业招聘', '兼职日结、刷单等内容将被立即驳回'],
      ['handshake', '诚信履约', '招到后请及时关闭，避免占用他人时间']
    ]
  };
  const tips = tipsMap[kind] || tipsMap.goods;
  return (
    <div className="card tips-card">
      <div className="tips-head">
        <span className="material-symbols-outlined">lightbulb</span>
        <b>发布提示</b>
      </div>
      <ul className="tips-list">
        {tips.map(([icn, t, s], i) => (
          <li key={i}>
            <span className="material-symbols-outlined">{icn}</span>
            <div>
              <b>{t}</b>
              <span>{s}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="tips-foot">
        <span className="material-symbols-outlined">verified_user</span>
        所有内容均会经过人工审核，通常 30 分钟内完成。
      </div>
    </div>
  );
}

// ───────── Main App ─────────
const INIT_GOODS = {
  title: 'iPad Air 4 · 64G · 自用一年配触控笔',
  cat: 'elec',
  cond: '90',
  desc: '自用 8 个月，平时仅在宿舍使用。屏幕无划痕，电池效率 96%，附原装包装盒、充电器、Apple Pencil 二代，已贴磨砂膜。仅限校内当面验机。',
  tags: ['九成新', '可面交', '原盒齐全'],
  price: '2680', orig: '4799',
  bargain: 'yes',
  deliver: 'meet',
  places: ['西门交易点', '工学院楼下'],
  imageFileIds: [],
  uploadingImages: false
};
const INIT_NOTES = {
  title: '机器学习导论 · 全套手写笔记 + 真题解析',
  cat: 'note',
  course: '机器学习导论',
  college: '工学院',
  teacher: '张教授',
  grades: ['大三', '大四', '考研'],
  desc: '涵盖第 1–9 章核心公式与典型例题，附 5 套近 3 年期末真题完整解析。手写工整，重点彩色标注，适合期末突击与考研复习。',
  tags: ['期末复习', '彩色手写', '含真题'],
  priceMode: 'point',
  points: '200', price: '18',
  preview: '3'
};
const INIT_TEAM = {
  title: '挑战杯参赛队 · 校园 AI 助手项目',
  kind: 'race',
  desc: '目标参加 2026 挑战杯，研究方向：基于大模型的校园 AI 助手，已有原型 demo。目前团队 3 人（队长 + 算法 + 产品）。希望招到稳定参与到 7 月项目结题的同学。',
  tags: ['长期', '可远程', '面向大二+'],
  roles: [
    { name: '后端开发', need: '熟悉 Python / FastAPI', n: 2 },
    { name: '前端开发', need: '熟悉 React / TS', n: 1 }
  ],
  duration: 'long',
  deadline: '2026-05-30',
  commit: '5-10',
  mode: 'hybrid',
  req: '大二及以上，有基础 Web 项目经验，能稳定参与到 7 月项目结题。',
  reward: '校级 / 省级证书、署名论文、可作保研材料'
};

function PubApp() {
  const [tweaks, setTweak] = useTweaks(PUB_TWEAK_DEFAULTS);
  const [kind, setKind] = useStPub(tweaks.kind || 'goods');
  const [goods, setGoodsState] = useStPub(INIT_GOODS);
  const [notes, setNotesState] = useStPub(INIT_NOTES);
  const [team, setTeamState]   = useStPub(INIT_TEAM);
  const [submitting, setSubmitting] = useStPub(false);
  const [message, setMessage] = useStPub('');

  useEffPub(() => {
    document.documentElement.style.setProperty('--cs-primary', tweaks.accent);
  }, [tweaks.accent]);

  useEffPub(() => {
    if (tweaks.kind && tweaks.kind !== kind) setKind(tweaks.kind);
    // eslint-disable-next-line
  }, [tweaks.kind]);

  const setG = (k, v) => setGoodsState({ ...goods, [k]: v });
  const setN = (k, v) => setNotesState({ ...notes, [k]: v });
  const setT = (k, v) => setTeamState({ ...team, [k]: v });
  const state = kind === 'goods' ? goods : kind === 'notes' ? notes : team;
  const setState = kind === 'goods' ? setG : kind === 'notes' ? setN : setT;

  const here = PUB_KINDS.find(p => p.id === kind);
  const goHome = () => window.location.href = '/pages/market_overview.html';
  const submitPublish = async () => {
    const Api = PUB_API();
    if (!Api) return;
    if (!Api.GetAuthToken || !Api.GetAuthToken()) {
      if (Api.RedirectToAuthPage) Api.RedirectToAuthPage('/pages/publish_center.html');
      else window.location.href = '/pages/auth_access.html?redirect=%2Fpages%2Fpublish_center.html';
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      if (kind === 'goods') {
        await Api.PublishProduct(buildGoodsPayload(goods));
      } else if (kind === 'notes') {
        await Api.UploadMaterial(buildMaterialPayload(notes));
      } else {
        await Api.PublishTeamRecruitment(buildRecruitmentPayload(team));
      }
      setMessage('提交成功，内容将进入审核流程');
      window.setTimeout(() => { window.location.href = '/pages/user_workspace.html?tab=posts'; }, 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Top nav */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand" onClick={goHome}>
            <div className="logo"><span className="material-symbols-outlined">school</span></div>
            <span className="name">CampusShare</span>
          </div>
          <div className="crumbs">
            <a onClick={goHome}>主页</a>
            <span className="material-symbols-outlined">chevron_right</span>
            <a>发布中心</a>
            <span className="material-symbols-outlined">chevron_right</span>
            <span className="here">发布{here.label}</span>
          </div>
          <div className="nav-right">
            <button className="ghost-btn"><span className="material-symbols-outlined">help_outline</span>发布规范</button>
            <button className="ghost-btn"><span className="material-symbols-outlined">drafts</span>我的草稿 (2)</button>
            <button className="avatar-btn" title="晓璐">晓</button>
          </div>
        </div>
      </header>

      <main className="pub-shell">
        {/* Hero with tabs */}
        <div className="pub-hero">
          <div className="pub-hero-text">
            <div className="pub-eyebrow">
              <span className="material-symbols-outlined">edit_square</span>发布中心
            </div>
            <h1 className="pub-h1">{here.title}</h1>
            <p className="pub-h-sub">{here.sub} · 内容会经审核后展示到校内市场</p>
          </div>
          <div className="kind-tabs">
            {PUB_KINDS.map(k => (
              <button key={k.id}
                className={'kind-tab' + (kind === k.id ? ' on' : '') + ' tone-' + k.tone}
                onClick={() => { setKind(k.id); setTweak('kind', k.id); }}>
                <span className="material-symbols-outlined">{k.icon}</span>
                <span>
                  <b>{k.label}</b>
                  <i>{k.id === 'goods' ? '闲置 / 二手' : k.id === 'notes' ? '笔记 / 真题' : '组队 / 招新'}</i>
                </span>
                {kind === k.id && <span className="kind-check"><span className="material-symbols-outlined">check_circle</span></span>}
              </button>
            ))}
          </div>
        </div>

        {/* Progress strip */}
        <div className="step-strip card">
          {[
            ['photo', kind === 'team' ? '封面' : kind === 'notes' ? '上传文件' : '上传图片'],
            ['edit_note', '基本信息'],
            ['payments', kind === 'team' ? '角色 & 时间' : kind === 'notes' ? '定价' : '价格 & 交易'],
            ['rate_review', '提交审核']
          ].map(([icn, l], i) => (
            <div key={i} className={'step' + (i < 2 ? ' done' : i === 2 ? ' on' : '')}>
              <span className="step-num">
                {i < 2 ? <span className="material-symbols-outlined">check</span> : i + 1}
              </span>
              <span className="step-label"><b>{l}</b></span>
              {i < 3 && <span className="step-line" />}
            </div>
          ))}
        </div>

        <div className="pub-grid">
          <div className="pub-main">
            {kind === 'goods' && <GoodsForm state={goods} set={setG} />}
            {kind === 'notes' && <NotesForm state={notes} set={setN} />}
            {kind === 'team'  && <TeamForm  state={team}  set={setT} />}

            <FormCard icon="contact_mail" title="联系方式" desc="买家 / 申请者将通过站内消息联系你">
              <Field label="允许私信" help="关闭则只能通过订单沟通">
                <div className={'switch on'} />
              </Field>
              <Field label="备用联系方式" help="选填，仅在交易达成后向对方公开">
                <div className="inp-row">
                  <select className="inp sel" style={{maxWidth:140}}>
                    <option>微信</option><option>QQ</option><option>手机</option>
                  </select>
                  <input className="inp" placeholder="例：xiaolu_2026" />
                </div>
              </Field>
            </FormCard>
          </div>

          {tweaks.showTips && (
            <aside className="pub-side">
              <PreviewCard kind={kind} state={state} />
              <TipsCard kind={kind} />
            </aside>
          )}
        </div>

        {/* Sticky footer actions */}
        <div className="pub-foot">
          <div className="foot-left">
            <span className="material-symbols-outlined">save</span>
            {message || '填写完成后提交审核'}
          </div>
          <div className="foot-right">
            <button className="ghost-btn"><span className="material-symbols-outlined">visibility</span>预览</button>
            <button className="ghost-btn"><span className="material-symbols-outlined">drafts</span>保存草稿</button>
            <button className="primary-btn" disabled={submitting} onClick={submitPublish}><span className="material-symbols-outlined">send</span>{submitting ? '提交中...' : '提交审核'}</button>
          </div>
        </div>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="主题">
          <TweakColor label="主色" value={tweaks.accent}
            options={['#005d90', '#0a8a4f', '#7c3aed', '#b45309', '#be123c']}
            onChange={(v) => setTweak('accent', v)} />
        </TweakSection>
        <TweakSection label="切换">
          <TweakRadio label="发布类型" value={tweaks.kind}
            options={[
              { value: 'goods', label: '商品' },
              { value: 'notes', label: '资料' },
              { value: 'team',  label: '招募' }
            ]}
            onChange={(v) => setTweak('kind', v)} />
        </TweakSection>
        <TweakSection label="布局">
          <TweakToggle label="显示侧边预览/提示" value={tweaks.showTips}
            onChange={(v) => setTweak('showTips', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PubApp />);

