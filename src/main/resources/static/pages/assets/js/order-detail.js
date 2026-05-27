const { useState, useEffect, useMemo } = React;

const TIMELINE_NODES = [
  { key: "create", label: "提交订单", icon: "receipt_long" },
  { key: "confirm", label: "卖家确认", icon: "task_alt" },
  { key: "deliver", label: "线下交付", icon: "handshake" },
  { key: "receive", label: "买家确认", icon: "verified" },
  { key: "done", label: "交易完成", icon: "workspace_premium" }
];

function MapOrderStatus(orderStatus) {
  const safeStatus = String(orderStatus || "").toUpperCase();
  if (safeStatus === "PENDING_SELLER_CONFIRM") return "ship";
  if (safeStatus === "PENDING_OFFLINE_TRADE") return "meet";
  if (safeStatus === "PENDING_BUYER_CONFIRM") return "confirm_wait";
  if (safeStatus === "COMPLETED") return "done";
  if (safeStatus === "CANCELED" || safeStatus === "CLOSED") return "cancelled";
  return "ship";
}

function FormatTime(timeText) {
  if (!timeText) return "-";
  const timeValue = new Date(timeText);
  if (Number.isNaN(timeValue.getTime())) return String(timeText);
  const pad = (value) => (value < 10 ? `0${value}` : String(value));
  return `${timeValue.getFullYear()}-${pad(timeValue.getMonth() + 1)}-${pad(timeValue.getDate())} ${pad(timeValue.getHours())}:${pad(timeValue.getMinutes())}`;
}

function FormatAmount(amount) {
  const numberValue = Number(amount || 0);
  if (Number.isNaN(numberValue)) return "¥ 0.00";
  return `¥ ${numberValue.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function GetInitial(name) {
  const safeName = String(name || "").trim();
  if (!safeName) return "C";
  return safeName.slice(0, 1).toUpperCase();
}

function GetGradient(name) {
  const palette = [
    ["#005d90", "#3454d1"],
    ["#0a8a4f", "#2dd4bf"],
    ["#7c3aed", "#ec4899"],
    ["#b45309", "#f59e0b"],
    ["#1d6fe0", "#38bdf8"],
    ["#be123c", "#fb7185"]
  ];
  const safeName = String(name || "CampusShare");
  let hash = 0;
  for (let i = 0; i < safeName.length; i += 1) {
    hash = (hash * 31 + safeName.charCodeAt(i)) >>> 0;
  }
  const [c1, c2] = palette[hash % palette.length];
  return { c1, c2, background: `linear-gradient(135deg, ${c1}, ${c2})` };
}

function BuildTimestamps(order) {
  const safeOrder = order || {};
  const deliveredAt = safeOrder.deliveredAt
    || safeOrder.handoverTime
    || safeOrder.deliveryTime
    || (["PENDING_BUYER_CONFIRM", "COMPLETED"].includes(String(safeOrder.orderStatus || "").toUpperCase()) ? safeOrder.updateTime : null);
  return {
    createdAt: safeOrder.createdAt || safeOrder.createTime || null,
    confirmedAt: safeOrder.confirmedAt || safeOrder.sellerConfirmTime || null,
    deliveredAt,
    completedAt: safeOrder.completedAt || safeOrder.buyerCompleteTime || null,
    cancelledAt: safeOrder.cancelledAt || safeOrder.canceledAt || safeOrder.closeTime || null
  };
}

function BuildAuditLog(order) {
  const safeOrder = order || {};
  const timestamps = BuildTimestamps(safeOrder);
  const entries = [];
  const pushEntry = (who, text, time) => {
    if (!time) return;
    entries.push({ who, text, time: FormatTime(time) });
  };
  pushEntry("买家", "提交订单", timestamps.createdAt);
  pushEntry("卖家", "确认订单，进入线下交易", timestamps.confirmedAt);
  pushEntry("卖家", "确认线下交付", timestamps.deliveredAt);
  pushEntry("买家", "确认收货，交易完成", timestamps.completedAt);
  if (timestamps.cancelledAt) {
    pushEntry("系统", safeOrder.closeReason || "订单已取消或关闭", timestamps.cancelledAt);
  }
  if (!entries.length) {
    entries.push({ who: "系统", text: "暂无操作记录", time: "-" });
  }
  return entries;
}

function BuildStateCfg(order, role, actionHandlers) {
  const safeRole = role || "viewer";
  const working = !!(actionHandlers && actionHandlers.workingAction);
  const disabled = (key) => working && actionHandlers.workingAction !== key;
  const baseActions = {
    contact: { label: "联系对方", icon: "chat", kind: "ghost", disabled: disabled("contactParty"), onClick: actionHandlers.contactParty },
    back: { label: "返回订单中心", icon: "arrow_back", kind: "ghost", disabled: disabled("backToCenter"), onClick: actionHandlers.backToCenter }
  };
  const makeAction = (label, icon, kind, key, onClick) => ({
    label,
    icon,
    kind,
    disabled: disabled(key),
    onClick
  });
  const cancelledTimeline = {
    create: "done",
    confirm: order && order.sellerConfirmTime ? "done" : "branch-cancel",
    deliver: order && order.sellerConfirmTime ? "branch-cancel" : "pending",
    receive: "pending",
    done: "pending"
  };
  const states = {
    ship: {
      label: "待确认",
      pill: "amber",
      tone: "amber",
      icon: "pending_actions",
      title: {
        buyer: "订单已提交，等待卖家确认",
        seller: "有新的订单待确认",
        viewer: "订单等待卖家确认"
      },
      desc: {
        buyer: "卖家确认后，双方即可按约定地点进行线下交付。",
        seller: "请核对商品与交易地点，确认后订单会进入线下交易阶段。",
        viewer: "当前订单尚未进入线下交易阶段。"
      },
      help: "卖家确认前，买卖双方都可以取消订单。",
      timeline: { create: "done", confirm: "now", deliver: "pending", receive: "pending", done: "pending" },
      actions: {
        buyer: [
          baseActions.contact,
          makeAction("取消订单", "cancel", "danger", "cancelOrder", actionHandlers.cancelOrder),
          baseActions.back
        ],
        seller: [
          makeAction("确认订单", "task_alt", "primary", "confirmOrder", actionHandlers.confirmOrder),
          makeAction("取消订单", "cancel", "danger", "cancelOrder", actionHandlers.cancelOrder),
          baseActions.back
        ],
        viewer: [baseActions.back]
      },
      stamps: ["createdAt"]
    },
    meet: {
      label: "交易中",
      pill: "review",
      tone: "violet",
      icon: "handshake",
      title: {
        buyer: "线下交易进行中",
        seller: "请完成线下交付",
        viewer: "订单正在进行线下交易"
      },
      desc: {
        buyer: "请按约定地点见面，确认物品无误后等待卖家标记交付。",
        seller: "完成线下交付后，请点击“线下已交付”，等待买家确认收货。",
        viewer: "双方正在推进线下交付流程。"
      },
      help: "请通过站内消息约定具体见面位置，避免脱离平台沟通。",
      timeline: { create: "done", confirm: "done", deliver: "now", receive: "pending", done: "pending" },
      actions: {
        buyer: [
          baseActions.contact,
          makeAction("取消订单", "cancel", "danger", "cancelOrder", actionHandlers.cancelOrder),
          baseActions.back
        ],
        seller: [
          makeAction("线下已交付", "inventory_2", "primary", "handoverOrder", actionHandlers.handoverOrder),
          makeAction("关闭订单", "block", "danger", "closeOrder", actionHandlers.closeOrder),
          baseActions.back
        ],
        viewer: [baseActions.back]
      },
      stamps: ["createdAt", "confirmedAt"]
    },
    confirm_wait: {
      label: "待确认收货",
      pill: "sold",
      tone: "blue",
      icon: "verified",
      title: {
        buyer: "请确认是否已收到物品",
        seller: "等待买家确认收货",
        viewer: "订单等待买家确认"
      },
      desc: {
        buyer: "确认商品无误后完成订单；如交易异常，请先联系卖家或取消订单。",
        seller: "买家确认后订单会进入完成状态。",
        viewer: "卖家已标记交付，等待买家确认。"
      },
      help: "买家确认收货后，本次校园线下交易即完成。",
      timeline: { create: "done", confirm: "done", deliver: "done", receive: "now", done: "pending" },
      actions: {
        buyer: [
          makeAction("确认收货", "verified", "primary", "completeOrder", actionHandlers.completeOrder),
          makeAction("取消订单", "cancel", "danger", "cancelOrder", actionHandlers.cancelOrder),
          baseActions.contact
        ],
        seller: [
          baseActions.contact,
          makeAction("关闭订单", "block", "danger", "closeOrder", actionHandlers.closeOrder),
          baseActions.back
        ],
        viewer: [baseActions.back]
      },
      stamps: ["createdAt", "confirmedAt", "deliveredAt"]
    },
    done: {
      label: "已完成",
      pill: "live",
      tone: "green",
      icon: "workspace_premium",
      title: {
        buyer: "订单已完成",
        seller: "交易已完成",
        viewer: "订单已完成"
      },
      desc: {
        buyer: "感谢使用 CampusShare，后续可在订单中心查看历史记录。",
        seller: "本次交易已经完成，商品订单流程已闭环。",
        viewer: "该订单已完成。"
      },
      help: "已完成订单会保留在订单中心，便于后续追溯。",
      timeline: { create: "done", confirm: "done", deliver: "done", receive: "done", done: "done" },
      actions: {
        buyer: [baseActions.contact, baseActions.back],
        seller: [baseActions.contact, baseActions.back],
        viewer: [baseActions.back]
      },
      stamps: ["createdAt", "confirmedAt", "deliveredAt", "completedAt"]
    },
    cancelled: {
      label: "已取消",
      pill: "off",
      tone: "muted",
      icon: "do_not_disturb_on",
      title: {
        buyer: "订单已取消或关闭",
        seller: "订单已取消或关闭",
        viewer: "订单已取消或关闭"
      },
      desc: {
        buyer: "该订单已终止，后续不会继续推进。",
        seller: "该订单已终止，商品可根据平台状态重新处理。",
        viewer: "该订单已终止。"
      },
      help: "订单已进入终止状态，操作记录会保留用于追溯。",
      timeline: cancelledTimeline,
      actions: {
        buyer: [baseActions.back],
        seller: [baseActions.back],
        viewer: [baseActions.back]
      },
      stamps: ["createdAt", "confirmedAt", "deliveredAt", "cancelledAt"]
    }
  };
  const state = MapOrderStatus(order && order.orderStatus);
  const cfg = states[state] || states.ship;
  return Object.assign({}, cfg, {
    state,
    actions: Object.assign({}, cfg.actions, {
      [safeRole]: cfg.actions[safeRole] || cfg.actions.viewer
    }),
    allStates: states
  });
}

function buildActionHandlers(orderData, orderId, role, isBuyer, isSeller, makeAction, setToast) {
  return {
    workingAction: makeAction.workingAction || "",
    confirmOrder: makeAction("confirmOrder", () => window.CampusShareApi.ConfirmOrder(orderId), "订单已确认"),
    cancelOrder: makeAction("cancelOrder", () => window.CampusShareApi.CancelOrder(orderId), "订单已取消"),
    handoverOrder: makeAction("handoverOrder", () => window.CampusShareApi.HandoverOrder(orderId), "已标记线下交付"),
    completeOrder: makeAction("completeOrder", () => window.CampusShareApi.CompleteOrder(orderId), "订单已完成"),
    closeOrder: makeAction("closeOrder", () => window.CampusShareApi.CloseOrder(orderId, "用户手动关闭订单"), "订单已关闭"),
    backToCenter() {
      window.location.href = "/pages/order_center.html";
    },
    contactParty() {
      const partyName = role === "buyer"
        ? (orderData && orderData.sellerDisplayName ? orderData.sellerDisplayName : "卖家")
        : (orderData && orderData.buyerDisplayName ? orderData.buyerDisplayName : "买家");
      setToast({ type: "success", message: `请通过站内消息联系${partyName}` });
    }
  };
}

function btnClass(action) {
  const parts = ["od-btn"];
  if (action && action.kind && action.kind.includes("primary")) parts.push("primary");
  if (action && action.kind && action.kind.includes("danger")) parts.push("danger");
  if (action && action.kind && action.kind.includes("ghost")) parts.push("ghost");
  return parts.join(" ");
}

function ResolveOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search || "");
  return params.get("orderId") || params.get("id") || "";
}

function ResolveProductImageUrl(productData) {
  const imageFileIds = productData && Array.isArray(productData.imageFileIds) ? productData.imageFileIds : [];
  const firstFileId = imageFileIds.find((fileId) => !!fileId);
  if (!firstFileId) return "";
  const safeFileId = String(firstFileId);
  if (/^https?:\/\//i.test(safeFileId) || safeFileId.startsWith("/")) return safeFileId;
  if (window.CampusShareApi.BuildPublicFileUrl) {
    return window.CampusShareApi.BuildPublicFileUrl(safeFileId);
  }
  return "";
}

function BuildDisplayName(orderData, productData, role) {
  if (role === "buyer") {
    return orderData.buyerDisplayName || `买家 #${orderData.buyerUserId || "-"}`;
  }
  if (role === "seller") {
    return orderData.sellerDisplayName || (productData && productData.sellerDisplayName) || `卖家 #${orderData.sellerUserId || "-"}`;
  }
  return "CampusShare 用户";
}

function TopNav({ orderData, profile }) {
  const profileName = profile && (profile.displayName || profile.account) ? (profile.displayName || profile.account) : "用户";
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand" onClick={() => { window.location.href = "/pages/market_overview.html"; }}>
          <div className="logo"><span className="material-symbols-outlined">school</span></div>
          <span className="name">CampusShare</span>
        </div>
        <div className="crumbs">
          <a href="/pages/market_overview.html">首页</a>
          <span className="material-symbols-outlined">chevron_right</span>
          <a href="/pages/order_center.html">订单中心</a>
          <span className="material-symbols-outlined">chevron_right</span>
          <span className="here">订单详情</span>
        </div>
        <div className="nav-right">
          <button className="ghost-btn" type="button" onClick={() => { window.location.href = "/pages/order_center.html"; }}>
            <span className="material-symbols-outlined">arrow_back</span>
            返回订单中心
          </button>
          <button className="avatar-btn" type="button" title={profileName}>{GetInitial(profileName)}</button>
        </div>
      </div>
    </header>
  );
}

function HeroBanner({ state, role, cfg }) {
  const actions = (cfg.actions && (cfg.actions[role] || cfg.actions.viewer)) || [];
  return (
    <div className={`od-hero od-tone-${cfg.tone}`}>
      <div className="od-hero-grid">
        <div className="od-hero-icn">
          <span className="material-symbols-outlined">{cfg.icon}</span>
        </div>
        <div className="od-hero-main">
          <div className="od-hero-meta">
            <span className={`pill ${cfg.pill}`}>{cfg.label}</span>
            <span className="od-hero-id mono">订单号 {cfg.orderNo}</span>
          </div>
          <h1 className="od-hero-title">{cfg.title[role] || cfg.title.viewer}</h1>
          <p className="od-hero-desc">{cfg.desc[role] || cfg.desc.viewer}</p>
        </div>
        <div className="od-hero-count">
          <div className="lab">当前角色</div>
          <div className="val mono">{role === "seller" ? "SELLER" : role === "buyer" ? "BUYER" : "VIEW"}</div>
        </div>
      </div>
      <div className="od-hero-actions">
        <div className="od-action-help">
          <span className="material-symbols-outlined">info</span>
          {cfg.help}
        </div>
        <div className="od-hero-buttons">
          {actions.map((action, index) => (
            <button
              key={`${action.label}-${index}`}
              type="button"
              className={btnClass(action)}
              disabled={!!action.disabled}
              onClick={action.onClick}
            >
              {action.icon && <span className="material-symbols-outlined">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineStrip({ cfg }) {
  return (
    <div className="od-strip">
      {TIMELINE_NODES.map((node, index) => {
        const status = cfg.timeline[node.key] || "pending";
        const branchKind = status.startsWith("branch") ? status.replace("branch-", "") : null;
        const icon = status === "done" ? "check" : branchKind === "cancel" ? "close" : status === "now" ? node.icon : "";
        const label = branchKind === "cancel" ? "订单已取消" : node.label;
        return (
          <React.Fragment key={node.key}>
            <div className={`strip-step ${branchKind ? `branch ${branchKind}` : status}`}>
              <div className="dot">
                <span className="material-symbols-outlined">{icon}</span>
              </div>
              <div className="lab">{label}</div>
            </div>
            {index < TIMELINE_NODES.length - 1 && (
              <div className={`strip-bar ${status === "done" ? "done" : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Timeline({ cfg, timestamps }) {
  const stampMap = {
    create: "createdAt",
    confirm: "confirmedAt",
    deliver: "deliveredAt",
    receive: "completedAt",
    done: "completedAt"
  };
  return (
    <ol className="od-timeline">
      {TIMELINE_NODES.map((node, index) => {
        const status = cfg.timeline[node.key] || "pending";
        const branchKind = status.startsWith("branch") ? status.replace("branch-", "") : null;
        const cls = branchKind ? `branch ${branchKind}` : status;
        const detail = branchKind === "cancel" ? FormatTime(timestamps.cancelledAt) : FormatTime(timestamps[stampMap[node.key]]);
        const isLast = index === TIMELINE_NODES.length - 1;
        return (
          <li key={node.key} className={`od-tl-item ${cls}`}>
            {!isLast && <span className="od-tl-bar" />}
            <span className="od-tl-dot">
              <span className="material-symbols-outlined">
                {status === "done" ? "check" : branchKind === "cancel" ? "close" : node.icon}
              </span>
            </span>
            <div className="od-tl-body">
              <div className="od-tl-label">
                {branchKind === "cancel" ? "订单取消" : node.label}
                {status === "now" && <span className="chip primary tiny">进行中</span>}
              </div>
              <div className="od-tl-detail mono">{detail}</div>
              {node.key === "create" && <div className="od-tl-sub">买家提交订单</div>}
              {node.key === "confirm" && status !== "pending" && <div className="od-tl-sub">卖家确认交易信息</div>}
              {node.key === "deliver" && status !== "pending" && <div className="od-tl-sub">线下交付节点</div>}
              {branchKind === "cancel" && <div className="od-tl-sub">原因：订单已取消或关闭</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function MainColumn({ state, role, cfg, orderData, productData, timestamps }) {
  const productTitle = productData && productData.title ? productData.title : `商品 #${orderData.productId || "-"}`;
  const productCategory = productData && productData.category ? productData.category : "校园商品";
  const productCondition = productData && productData.conditionLevel ? productData.conditionLevel : "状态未知";
  const productDescription = productData && productData.description ? productData.description : "暂无商品描述";
  const productImageUrl = ResolveProductImageUrl(productData);
  const productGradient = GetGradient(productTitle);
  const auditLog = BuildAuditLog(orderData);
  const amountText = FormatAmount(orderData.orderAmount);
  return (
    <div className="od-main">
      <section className="card od-section">
        <header className="od-sec-head">
          <h2>商品信息</h2>
          {orderData.productId && (
            <a className="od-sec-link" href={`/pages/market_item_detail.html?productId=${encodeURIComponent(String(orderData.productId))}`}>
              <span className="material-symbols-outlined">open_in_new</span>
              查看商品页
            </a>
          )}
        </header>
        <div className="od-prod">
          <div className="od-prod-thumb" style={{ "--c1": productGradient.c1, "--c2": productGradient.c2 }}>
            {productImageUrl ? <img alt={productTitle} src={productImageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "16px" }} /> : GetInitial(productTitle)}
          </div>
          <div className="od-prod-body">
            <h3 className="od-prod-title">{productTitle}</h3>
            <div className="od-prod-tags">
              <span className="chip">{productCategory}</span>
              <span className="chip green">成色 · {productCondition}</span>
              <span className="chip">数量 ×1</span>
            </div>
            <ul className="od-spec">
              <li><span>商品编号</span><b>#{orderData.productId || "-"}</b></li>
              <li><span>交易地点</span><b>{orderData.tradeLocation || (productData && productData.tradeLocation) || "待协商"}</b></li>
              <li><span>卖家</span><b>{orderData.sellerDisplayName || `#${orderData.sellerUserId || "-"}`}</b></li>
              <li><span>状态</span><b>{cfg.label}</b></li>
            </ul>
            <p className="od-sec-sub" style={{ marginTop: "12px", lineHeight: 1.6 }}>{productDescription}</p>
          </div>
          <div className="od-prod-price">
            <span className="y">¥</span>{Number(orderData.orderAmount || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="unit">订单金额</span>
          </div>
        </div>
      </section>

      {state === "cancelled" && <CancelPanel orderData={orderData} />}

      <section className="card od-section">
        <header className="od-sec-head">
          <h2>价格明细</h2>
          <span className="od-sec-sub">校园线下交易订单金额</span>
        </header>
        <div className="od-price-grid">
          <div className="row">
            <span>商品金额</span>
            <span className="mono">{amountText}</span>
          </div>
          <div className="row">
            <span>平台服务费<small>当前阶段暂不收取</small></span>
            <span className="mono">¥ 0.00</span>
          </div>
          <div className="row total">
            <span>订单金额</span>
            <span className="mono price">{amountText}</span>
          </div>
        </div>
      </section>

      <section className="card od-section">
        <header className="od-sec-head">
          <h2>订单进度</h2>
          <span className="od-sec-sub">系统会在节点完成后更新记录</span>
        </header>
        <Timeline cfg={cfg} timestamps={timestamps} />
      </section>

      <section className="card od-section">
        <header className="od-sec-head">
          <h2>操作记录</h2>
          <span className="od-sec-sub">由订单状态与时间字段生成</span>
        </header>
        <ul className="od-audit">
          {auditLog.map((entry, index) => (
            <li key={`${entry.text}-${index}`}>
              <span className={`who ${entry.who === "系统" ? "sys" : entry.who === "买家" ? "b" : "s"}`}>{entry.who}</span>
              <span className="t">{entry.text}</span>
              <span className="time mono">{entry.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SideColumn({ state, role, cfg, orderData, productData, timestamps }) {
  const buyerName = orderData.buyerDisplayName || `买家 #${orderData.buyerUserId || "-"}`;
  const sellerName = orderData.sellerDisplayName || (productData && productData.sellerDisplayName) || `卖家 #${orderData.sellerUserId || "-"}`;
  const counterRole = role === "seller" ? "buyer" : "seller";
  const counterName = counterRole === "seller" ? sellerName : buyerName;
  const counterLabel = counterRole === "seller" ? "卖家" : "买家";
  const gradient = GetGradient(counterName);
  const tradeLocation = orderData.tradeLocation || (productData && productData.tradeLocation) || "待协商";
  return (
    <div className="od-side">
      <section className="card od-section od-side-card">
        <header className="od-sec-head">
          <h2>{counterLabel}信息</h2>
        </header>
        <div className="od-party">
          <div className="party-av" style={{ background: gradient.background }}>{GetInitial(counterName)}</div>
          <div className="party-body">
            <div className="party-name">
              {counterName}
              <span className="material-symbols-outlined verified-icn" title="校园用户">verified</span>
            </div>
            <div className="party-school">CampusShare 校园交易用户</div>
            <div className="party-stats">
              <span><b>{counterRole === "seller" ? orderData.sellerUserId || "-" : orderData.buyerUserId || "-"}</b>ID</span>
              <span><b>{role === "viewer" ? "查看" : "我方"}</b>{role === counterRole ? "身份" : "对方"}</span>
            </div>
          </div>
        </div>
        <ul className="od-meta-list compact" style={{ marginTop: "14px" }}>
          <li><span className="k">买家</span><span className="v">{buyerName}</span></li>
          <li><span className="k">卖家</span><span className="v">{sellerName}</span></li>
        </ul>
      </section>

      <section className="card od-section od-side-card">
        <header className="od-sec-head">
          <h2>交易信息</h2>
          {state === "meet" && <span className="chip primary"><span className="material-symbols-outlined">schedule</span>进行中</span>}
        </header>
        <ul className="od-meta-list">
          <li>
            <span className="material-symbols-outlined">place</span>
            <div>
              <span className="k">交易地点</span>
              <span className="v">{tradeLocation}</span>
              <span className="hint">请以双方站内沟通确认的具体位置为准</span>
            </div>
          </li>
          <li>
            <span className="material-symbols-outlined">receipt_long</span>
            <div>
              <span className="k">订单编号</span>
              <span className="v mono">{orderData.orderNo || `#${orderData.orderId || "-"}`}</span>
            </div>
          </li>
          <li>
            <span className="material-symbols-outlined">payments</span>
            <div>
              <span className="k">订单金额</span>
              <span className="v mono">{FormatAmount(orderData.orderAmount)}</span>
            </div>
          </li>
        </ul>
      </section>

      <section className="card od-section od-side-card">
        <header className="od-sec-head">
          <h2>时间信息</h2>
        </header>
        <ul className="od-meta-list compact">
          {cfg.stamps.map((key) => {
            const labelMap = {
              createdAt: "创建时间",
              confirmedAt: "确认时间",
              deliveredAt: "交付时间",
              completedAt: "完成时间",
              cancelledAt: "终止时间"
            };
            return (
              <li key={key}>
                <span className="k">{labelMap[key]}</span>
                <span className="v mono">{FormatTime(timestamps[key])}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function CancelPanel({ orderData }) {
  return (
    <section className="card od-anomaly od-anomaly-muted">
      <div className="anomaly-head">
        <span className="material-symbols-outlined">do_not_disturb_on</span>
        <div>
          <h3>订单取消信息</h3>
          <p>{FormatTime(orderData.closeTime || orderData.updateTime)}</p>
        </div>
      </div>
      <div className="anomaly-body">
        <div className="anomaly-row">
          <span className="k">取消/关闭原因</span>
          <span className="v">{orderData.closeReason || "订单已取消或关闭"}</span>
        </div>
        <div className="anomaly-row">
          <span className="k">处理说明</span>
          <span className="v">该订单已终止，后续不会继续推进。</span>
        </div>
      </div>
    </section>
  );
}

function LoadingScreen() {
  return (
    <div className="od-shell" style={{ minHeight: "70vh", alignItems: "center", justifyContent: "center" }}>
      <span className="material-symbols-outlined" style={{ fontSize: "44px", color: "var(--cs-primary)" }}>hourglass_top</span>
      <div style={{ fontWeight: 800, marginTop: "12px" }}>订单详情加载中</div>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div className="od-shell" style={{ minHeight: "70vh", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--rose)" }}>error_outline</span>
      <h1 className="od-hero-title" style={{ marginTop: "12px" }}>订单加载失败</h1>
      <p className="od-hero-desc">{message || "请返回订单中心后重试。"}</p>
      <button className="od-btn primary" type="button" onClick={() => { window.location.href = "/pages/order_center.html"; }}>
        <span className="material-symbols-outlined">arrow_back</span>
        返回订单中心
      </button>
    </div>
  );
}

function ToastBanner({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: "82px",
        right: "24px",
        zIndex: 80,
        maxWidth: "360px",
        background: "#fff",
        border: `1px solid ${isError ? "var(--rose)" : "var(--green)"}`,
        color: isError ? "var(--rose)" : "var(--green)",
        borderRadius: "14px",
        boxShadow: "var(--cs-shadow-lg)",
        padding: "12px 14px",
        display: "flex",
        gap: "10px",
        alignItems: "center"
      }}
    >
      <span className="material-symbols-outlined">{isError ? "error_outline" : "check_circle"}</span>
      <span style={{ color: "var(--cs-ink)", fontSize: "13px", fontWeight: 700 }}>{toast.message}</span>
      <button className="icon-btn" type="button" onClick={onClose} style={{ width: "28px", height: "28px", marginLeft: "auto" }}>
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}

function OrderDetailApp() {
  const [orderData, setOrderData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [workingAction, setWorkingAction] = useState("");
  const orderId = useMemo(() => ResolveOrderIdFromUrl(), []);

  useEffect(() => {
    let active = true;
    async function LoadDetail() {
      if (!window.CampusShareApi || !window.CampusShareApi.GetAuthToken()) {
        const redirectPath = `/pages/order_detail.html${orderId ? `?orderId=${encodeURIComponent(String(orderId))}` : ""}`;
        if (window.CampusShareApi && window.CampusShareApi.RedirectToAuthPage) {
          window.CampusShareApi.RedirectToAuthPage(redirectPath);
        } else if (window.CampusShareApi && window.CampusShareApi.BuildAuthPageUrl) {
          window.location.href = window.CampusShareApi.BuildAuthPageUrl(redirectPath);
        } else {
          window.location.href = `/pages/auth_access.html?redirect=${encodeURIComponent(redirectPath)}`;
        }
        return;
      }
      if (!orderId) {
        setError("缺少订单编号，请从订单中心进入。");
        setLoading(false);
        return;
      }
      try {
        let profileResult = window.CampusShareApi.GetCurrentUserProfile ? window.CampusShareApi.GetCurrentUserProfile() : null;
        if (window.CampusShareApi.SyncSessionProfile) {
          try {
            profileResult = await window.CampusShareApi.SyncSessionProfile();
          } catch (ignoreError) {
            profileResult = profileResult || null;
          }
        }
        const detailResult = await window.CampusShareApi.GetOrderDetail(orderId);
        let productResult = null;
        if (detailResult && detailResult.productId) {
          try {
            productResult = await window.CampusShareApi.GetProductDetail(detailResult.productId);
          } catch (productError) {
            productResult = null;
          }
        }
        if (!active) return;
        setProfile(profileResult || null);
        setOrderData(detailResult || null);
        setProductData(productResult);
        setLoading(false);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "订单详情加载失败");
        setLoading(false);
      }
    }
    LoadDetail();
    return () => {
      active = false;
    };
  }, [orderId]);

  const currentUserId = Number(profile && profile.userId ? profile.userId : 0);
  const isBuyer = !!(orderData && currentUserId > 0 && currentUserId === Number(orderData.buyerUserId || 0));
  const isSeller = !!(orderData && currentUserId > 0 && currentUserId === Number(orderData.sellerUserId || 0));
  const role = isBuyer ? "buyer" : isSeller ? "seller" : "viewer";

  const makeAction = useMemo(() => {
    const factory = (actionKey, runner, successMessage) => async () => {
      if (workingAction) return;
      setWorkingAction(actionKey);
      try {
        await runner();
        setToast({ type: "success", message: successMessage });
        window.setTimeout(() => {
          window.location.href = `/pages/order_detail.html?orderId=${encodeURIComponent(String(orderId))}`;
        }, 450);
      } catch (actionError) {
        setToast({ type: "error", message: actionError instanceof Error ? actionError.message : "操作失败，请稍后重试" });
        setWorkingAction("");
      }
    };
    factory.workingAction = workingAction;
    return factory;
  }, [orderId, workingAction]);

  const actionHandlers = useMemo(() => buildActionHandlers(orderData, orderId, role, isBuyer, isSeller, makeAction, setToast), [orderData, orderId, role, isBuyer, isSeller, makeAction]);
  const timestamps = useMemo(() => BuildTimestamps(orderData), [orderData]);
  const cfg = useMemo(() => {
    const stateCfg = BuildStateCfg(orderData, role, actionHandlers);
    return Object.assign({}, stateCfg, {
      orderNo: orderData ? (orderData.orderNo || `#${orderData.orderId || orderId}`) : `#${orderId}`
    });
  }, [orderData, role, actionHandlers, orderId]);
  const state = cfg.state;

  if (loading) {
    return (
      <>
        <TopNav orderData={orderData} profile={profile} />
        <LoadingScreen />
      </>
    );
  }

  if (error || !orderData) {
    return (
      <>
        <TopNav orderData={orderData} profile={profile} />
        <ErrorScreen message={error} />
      </>
    );
  }

  return (
    <>
      <TopNav orderData={orderData} profile={profile} />
      <main className="od-shell">
        <HeroBanner state={state} role={role} cfg={cfg} />
        <TimelineStrip cfg={cfg} />
        <div className="od-grid">
          <MainColumn state={state} role={role} cfg={cfg} orderData={orderData} productData={productData} timestamps={timestamps} />
          <SideColumn state={state} role={role} cfg={cfg} orderData={orderData} productData={productData} timestamps={timestamps} />
        </div>
      </main>
      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<OrderDetailApp />);
