/**
 * CampusShare 主页脚本
 */
(function InitMarketOverviewPage() {
    const Api = window.CampusShareApi;
    const ADMIN_ROLE = "ADMINISTRATOR";
    const SELLER_ROLE = "VERIFIED_SELLER";

    const THUMB_PALETTES = [
        ["#9ec5e8", "#5b87c0"],
        ["#e6cf94", "#b88a3e"],
        ["#cbd5e1", "#64748b"],
        ["#a8d5b0", "#3f8c5c"],
        ["#c4b5fd", "#7c3aed"],
        ["#fcd34d", "#b45309"],
        ["#fda4af", "#be123c"],
        ["#a7f3d0", "#0a8a4f"]
    ];

    const NOTIF_TYPE_CONFIG = {
        ORDER: { icon: "receipt_long", c1: "#dbeafe", c2: "#3b82f6" },
        TRADE: { icon: "handshake", c1: "#dbeafe", c2: "#3b82f6" },
        TEAM: { icon: "group_add", c1: "#f3e8ff", c2: "#7c3aed" },
        RECRUITMENT: { icon: "group_add", c1: "#f3e8ff", c2: "#7c3aed" },
        COMMENT: { icon: "forum", c1: "#dcfce7", c2: "#0a8a4f" },
        REVIEW: { icon: "rate_review", c1: "#dcfce7", c2: "#0a8a4f" },
        POINT: { icon: "paid", c1: "#fef3c7", c2: "#b45309" },
        POINTS: { icon: "paid", c1: "#fef3c7", c2: "#b45309" },
        SYSTEM: { icon: "campaign", c1: "#f0f9ff", c2: "#0284c7" }
    };

    const ORDER_TODO_CONFIG = {
        PENDING_SELLER_CONFIRM: { tag: "待发货", tagKind: "warn", icon: "local_shipping", text: "待确认" },
        PENDING_OFFLINE_TRADE: { tag: "待面交", tagKind: "info", icon: "handshake", text: "线下交易中" },
        PENDING_BUYER_CONFIRM: { tag: "待确认", tagKind: "info", icon: "check_circle", text: "待买家确认" }
    };

    const SEARCH_HINTS = {
        trending: ["六级真题", "iPad Air", "组队招募", "电子书", "九成新教材"],
        recent: ["操作系统第八版", "高数笔记"]
    };

    let currentSearchQuery = "";

    function H(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
        });
    }

    function SetText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    }

    function Show(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = "";
        }
    }

    function Hide(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = "none";
        }
    }

    function GetThumbColors(seed) {
        return THUMB_PALETTES[(Math.abs(Number(seed) || 0) % THUMB_PALETTES.length)];
    }

    function FormatRelativeTime(timeValue) {
        if (!timeValue) {
            return "";
        }
        const ts = typeof timeValue === "number" ? timeValue : new Date(timeValue).getTime();
        const diff = Date.now() - ts;
        if (diff < 60000) {
            return "刚刚";
        }
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)} 分钟前`;
        }
        if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)} 小时前`;
        }
        if (diff < 7 * 86400000) {
            return `${Math.floor(diff / 86400000)} 天前`;
        }
        const d = new Date(ts);
        return `${d.getMonth() + 1}月${d.getDate()}日`;
    }

    function FormatDeadline(dateStr) {
        if (!dateStr) {
            return "";
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            return dateStr;
        }
        return `${d.getMonth() + 1}月${d.getDate()}日截止`;
    }

    function GetMaterialTypeIcon(fileType) {
        const t = String(fileType || "").toLowerCase();
        if (t.includes("pdf")) { return "picture_as_pdf"; }
        if (t.includes("zip") || t.includes("rar") || t.includes("7z")) { return "folder_zip"; }
        if (t.includes("doc")) { return "description"; }
        if (t.includes("xls") || t.includes("csv")) { return "table_chart"; }
        if (t.includes("ppt")) { return "slideshow"; }
        if (t.includes("mp4") || t.includes("avi")) { return "play_circle"; }
        return "description";
    }

    function GetMaterialTypeColors(fileType) {
        const t = String(fileType || "").toLowerCase();
        if (t.includes("pdf")) { return { c1: "#fee2e2", c2: "#ef4444" }; }
        if (t.includes("zip") || t.includes("rar")) { return { c1: "#fef3c7", c2: "#b45309" }; }
        if (t.includes("doc")) { return { c1: "#dbeafe", c2: "#3b82f6" }; }
        if (t.includes("xls")) { return { c1: "#dcfce7", c2: "#16a34a" }; }
        if (t.includes("ppt")) { return { c1: "#ffe4e9", c2: "#be123c" }; }
        return { c1: "#f3e8ff", c2: "#7c3aed" };
    }

    function BuildHeroTime() {
        const d = new Date();
        const h = d.getHours();
        const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        let greet = "晚上好";
        if (h < 5) { greet = "夜深了"; }
        else if (h < 11) { greet = "早上好"; }
        else if (h < 13) { greet = "中午好"; }
        else if (h < 18) { greet = "下午好"; }
        SetText("hp-weekday", weekdays[d.getDay()]);
        return greet;
    }

    function RenderTodos(orders) {
        const todosArea = document.getElementById("hp-todos-area");
        if (!todosArea) {
            return;
        }
        const activeTodos = (orders || []).filter(function (o) {
            return ORDER_TODO_CONFIG[o.orderStatus];
        }).slice(0, 3);

        if (activeTodos.length === 0) {
            todosArea.innerHTML = [
                "<div class=\"todo-empty\">",
                "<div class=\"icn\"><span class=\"material-symbols-outlined\">check_circle</span></div>",
                "<div class=\"empty-body\">",
                "<div class=\"empty-t\">一切处理完毕，状态良好</div>",
                "<div class=\"empty-s\">没有待处理的订单或任务，去看看有什么新上架的好东西？</div>",
                "</div>",
                "<div class=\"empty-actions\">",
                "<button type=\"button\" id=\"hp-todo-empty-publish\"><span class=\"material-symbols-outlined\">add_circle</span>发布商品</button>",
                "<button type=\"button\" id=\"hp-todo-empty-browse\"><span class=\"material-symbols-outlined\">storefront</span>浏览市场</button>",
                "</div>",
                "</div>"
            ].join("");
            const publishBtn = document.getElementById("hp-todo-empty-publish");
            const browseBtn = document.getElementById("hp-todo-empty-browse");
            if (publishBtn) {
                publishBtn.addEventListener("click", function () {
                    Api.NavigateToPage("/pages/publish_center.html");
                });
            }
            if (browseBtn) {
                browseBtn.addEventListener("click", function () {
                    Api.NavigateToPage("/pages/market_listing.html");
                });
            }
            return;
        }

        const html = "<div class=\"todo-row-grid\">" + activeTodos.map(function (order) {
            const config = ORDER_TODO_CONFIG[order.orderStatus] || { tag: "待处理", tagKind: "info", icon: "info" };
            const tagColor = config.tagKind === "warn" ? "var(--amber)" : "var(--cs-muted)";
            const iconBg = config.tagKind === "warn"
                ? "background:var(--amber-soft);color:var(--amber);"
                : "background:rgba(0,93,144,0.08);color:var(--cs-primary);";
            const title = H(order.productTitle || `订单 ${order.orderNo ? "#" + order.orderNo : "#" + (order.orderId || "")}`);
            const priceText = order.orderAmount != null ? ` · ¥${Number(order.orderAmount).toFixed(0)}` : "";
            const timeText = FormatRelativeTime(order.updateTime || order.createTime);
            return [
                `<div class="todo-card" data-order-id="${H(String(order.orderId || ""))}" style="cursor:pointer;">`,
                `<div class="icn" style="${iconBg}"><span class="material-symbols-outlined">${config.icon}</span></div>`,
                "<div class=\"body\">",
                `<div class="tag" style="color:${tagColor};">${H(config.tag)}<span class="when">${H(timeText)}</span></div>`,
                `<div class="ttl">${title}${H(priceText)}</div>`,
                "</div>",
                "</div>"
            ].join("");
        }).join("") + "</div>";

        todosArea.innerHTML = html;

        todosArea.querySelectorAll(".todo-card[data-order-id]").forEach(function (card) {
            card.addEventListener("click", function () {
                Api.NavigateToPage("/pages/order_center.html");
            });
        });
    }

    function RenderProducts(products) {
        const grid = document.getElementById("hp-products");
        if (!grid) {
            return;
        }
        if (!products || products.length === 0) {
            grid.innerHTML = "<div style=\"grid-column:1/-1;padding:40px;text-align:center;color:var(--cs-muted);\">暂无商品数据</div>";
            return;
        }
        grid.innerHTML = products.map(function (p, idx) {
            const colors = GetThumbColors(p.productId || idx);
            const initial = H(String(p.title || "商").slice(0, 1));
            const condText = H(p.conditionLevel || "");
            const sellerText = H(p.sellerDisplayName || "卖家");
            const sellerInitial = H(String(p.sellerDisplayName || "卖").slice(0, 1));
            const titleText = H(p.title || "商品");
            const productId = H(String(p.productId || ""));
            return [
                `<div class="card product" data-product-id="${productId}">`,
                `<div class="thumb" style="background:linear-gradient(135deg,${colors[0]},${colors[1]});">`,
                `<div class="ph">${initial}</div>`,
                condText ? `<div class="badge">${condText}</div>` : "",
                `<button class="fav" type="button" data-product-id="${productId}" aria-label="收藏"><span class="material-symbols-outlined">favorite_border</span></button>`,
                "</div>",
                "<div class=\"product-body\">",
                `<div class="title">${titleText}</div>`,
                "<div class=\"meta\">",
                `<div class="price"><span class="y">¥</span>${H(String(p.price != null ? Number(p.price).toFixed(0) : "—"))}</div>`,
                `<div class="seller"><div class="av">${sellerInitial}</div>${sellerText}</div>`,
                "</div>",
                "<div class=\"tags\">",
                condText ? `<span class="tag-mini cond">${condText}</span>` : "",
                p.category ? `<span class="tag-mini">${H(p.category)}</span>` : "",
                "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");

        grid.querySelectorAll(".product[data-product-id]").forEach(function (card) {
            card.addEventListener("click", function (e) {
                if (e.target.closest(".fav")) {
                    return;
                }
                const pid = card.getAttribute("data-product-id");
                if (pid) {
                    Api.NavigateToPage(`/pages/market_item_detail.html?productId=${encodeURIComponent(pid)}`);
                }
            });
        });

        grid.querySelectorAll(".fav[data-product-id]").forEach(function (btn) {
            btn.addEventListener("click", async function (e) {
                e.stopPropagation();
                const pid = btn.getAttribute("data-product-id");
                if (!pid || !Api || !Api.GetAuthToken || !Api.GetAuthToken()) {
                    if (Api) {
                        Api.NavigateToPage("/pages/auth_access.html");
                    }
                    return;
                }
                if (!Api.ToggleProductFavorite) {
                    return;
                }
                try {
                    await Api.ToggleProductFavorite(pid);
                    const icon = btn.querySelector(".material-symbols-outlined");
                    const isOn = btn.classList.toggle("on");
                    if (icon) {
                        icon.textContent = isOn ? "favorite" : "favorite_border";
                    }
                } catch (err) { /* ignore */ }
            });
        });
    }

    function RenderMaterials(materials) {
        const list = document.getElementById("hp-materials");
        if (!list) {
            return;
        }
        if (!materials || materials.length === 0) {
            list.innerHTML = "<div style=\"padding:20px;text-align:center;color:var(--cs-muted);font-size:13px;\">暂无资料数据</div>";
            return;
        }
        list.innerHTML = materials.slice(0, 5).map(function (m) {
            const colors = GetMaterialTypeColors(m.fileType);
            const iconName = GetMaterialTypeIcon(m.fileType);
            const titleText = H(m.courseName || m.title || "资料");
            const cost = Number(m.downloadCostPoints || 0);
            const dlCount = Number(m.downloadCount || 0);
            const mid = H(String(m.materialId || ""));
            return [
                `<div class="material-item" data-material-id="${mid}">`,
                `<div class="material-icon" style="background:${colors.c1};color:${colors.c2};">`,
                `<span class="material-symbols-outlined">${iconName}</span>`,
                "</div>",
                "<div class=\"material-meta\">",
                `<div class="t">${titleText}</div>`,
                "<div class=\"s\">",
                dlCount > 0 ? `<span><span class="material-symbols-outlined">download</span>${dlCount}</span>` : "",
                "</div>",
                "</div>",
                cost > 0
                    ? `<div class="material-cost"><span class="material-symbols-outlined">paid</span>${cost}</div>`
                    : `<div class="material-cost" style="background:var(--green-soft);color:var(--green);"><span class="material-symbols-outlined">lock_open</span>免费</div>`,
                "</div>"
            ].join("");
        }).join("");

        list.querySelectorAll(".material-item[data-material-id]").forEach(function (item) {
            item.addEventListener("click", function () {
                Api.NavigateToPage("/pages/market_listing.html?view=MATERIAL");
            });
        });
    }

    function RenderRecruits(recruits) {
        const container = document.getElementById("hp-recruits");
        if (!container) {
            return;
        }
        const visible = (recruits || []).filter(function (r) {
            return r.recruitmentStatus !== "CLOSED" && r.recruitmentStatus !== "EXPIRED";
        }).slice(0, 3);

        if (visible.length === 0) {
            container.innerHTML = "<div style=\"padding:20px;text-align:center;color:var(--cs-muted);font-size:13px;\">暂无招募信息</div>";
            return;
        }
        container.innerHTML = visible.map(function (r) {
            const statusClass = r.recruitmentStatus === "FULL" ? "few" : "open";
            const statusText = { RECRUITING: "招募中", FULL: "已满员", PENDING_REVIEW: "审核中" }[r.recruitmentStatus] || "招募中";
            const current = Number(r.currentMemberCount || 0);
            const limit = Number(r.memberLimit || 1);
            const pct = Math.min(100, Math.round((current / limit) * 100));
            const tags = Array.isArray(r.tags) ? r.tags.slice(0, 2) : [];
            const tagHtml = tags.map(function (t) {
                return `<span class="tag-mini">${H(t)}</span>`;
            }).join("");
            return [
                `<div class="recruit-item" data-recruit-id="${H(String(r.recruitmentId || ""))}">`,
                "<div class=\"recruit-top\">",
                `<div class="recruit-title">${H(r.eventName || "组队招募")}</div>`,
                `<span class="recruit-status ${statusClass}">${H(statusText)}</span>`,
                "</div>",
                "<div class=\"recruit-meta\">",
                r.publisherDisplayName ? `<span><span class="material-symbols-outlined">person</span>${H(r.publisherDisplayName)}</span>` : "",
                r.deadline ? `<span><span class="material-symbols-outlined">schedule</span>${H(FormatDeadline(r.deadline))}</span>` : "",
                "</div>",
                tags.length > 0 ? `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">${tagHtml}</div>` : "",
                "<div class=\"recruit-progress\">",
                `<div class="bar"><div class="fill" style="width:${pct}%;"></div></div>`,
                `<div class="pct">${current}/${limit}</div>`,
                "</div>",
                "</div>"
            ].join("");
        }).join("");

        container.querySelectorAll(".recruit-item[data-recruit-id]").forEach(function (item) {
            item.addEventListener("click", function () {
                Api.NavigateToPage("/pages/recruitment_board.html");
            });
        });
    }

    function RenderNotifications(notifList) {
        const listEl = document.getElementById("hp-notif-list");
        const countEl = document.getElementById("hp-notif-count");
        const badgeEl = document.getElementById("hp-notif-badge");
        const sideBadgeEl = document.getElementById("hp-msg-badge");

        const unreadCount = (notifList || []).filter(function (n) {
            return n.readFlag !== true;
        }).length;

        if (countEl) {
            if (unreadCount > 0) {
                countEl.textContent = String(unreadCount);
                countEl.style.display = "";
            } else {
                countEl.style.display = "none";
            }
        }
        if (badgeEl) {
            if (unreadCount > 0) {
                badgeEl.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
                badgeEl.style.display = "";
            } else {
                badgeEl.style.display = "none";
            }
        }
        if (sideBadgeEl) {
            if (unreadCount > 0) {
                sideBadgeEl.className = "side-badge red";
                sideBadgeEl.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
            } else {
                sideBadgeEl.textContent = "";
            }
        }

        if (!listEl) {
            return;
        }
        const displayList = (notifList || []).slice(0, 4);
        if (displayList.length === 0) {
            listEl.innerHTML = "<div style=\"padding:12px 8px;font-size:13px;color:var(--cs-muted);\">暂无消息</div>";
            return;
        }
        listEl.innerHTML = displayList.map(function (n) {
            const typeKey = String(n.notificationType || "SYSTEM").toUpperCase();
            const config = NOTIF_TYPE_CONFIG[typeKey] || NOTIF_TYPE_CONFIG.SYSTEM;
            const isUnread = n.readFlag !== true;
            const titleText = H(n.title || n.content || "新消息");
            const contentText = n.content && n.content !== n.title ? H(n.content) : "";
            const timeText = H(FormatRelativeTime(n.sendTime || n.createTime));
            return [
                `<div class="notif-item${isUnread ? " unread" : ""}" data-notif-id="${H(String(n.notificationId || n.id || ""))}">`,
                `<div class="notif-icon" style="background:${config.c1};color:${config.c2};">`,
                `<span class="material-symbols-outlined">${config.icon}</span>`,
                "</div>",
                "<div class=\"notif-body\">",
                `<div class="t">${titleText}</div>`,
                contentText ? `<div class="t" style="color:var(--cs-muted);margin-top:2px;">${contentText}</div>` : "",
                `<div class="when">${timeText}</div>`,
                "</div>",
                "</div>"
            ].join("");
        }).join("");

        listEl.querySelectorAll(".notif-item[data-notif-id]").forEach(function (item) {
            item.addEventListener("click", function () {
                Api.NavigateToPage("/pages/notification_center.html");
            });
        });
    }

    function ApplyGuestState() {
        const greet = BuildHeroTime();
        SetText("hp-greet", "欢迎来到 CampusShare");
        SetText("hp-summary", "把校园交易、资料共享和团队协作放进一个清爽入口。");

        const heroActions = document.getElementById("hp-hero-actions");
        if (heroActions) {
            heroActions.innerHTML = [
                "<button class=\"ha-btn primary\" id=\"hp-btn-hero-browse\" type=\"button\">浏览市场</button>",
                "<button class=\"ha-btn secondary\" id=\"hp-btn-hero-secondary\" type=\"button\">登录 / 注册</button>"
            ].join("");
            const browseBtn = document.getElementById("hp-btn-hero-browse");
            const loginBtn = document.getElementById("hp-btn-hero-secondary");
            if (browseBtn) {
                browseBtn.addEventListener("click", function () {
                    Api.NavigateToPage("/pages/market_listing.html");
                });
            }
            if (loginBtn) {
                loginBtn.addEventListener("click", function () {
                    Api.NavigateToPage("/pages/auth_access.html");
                });
            }
        }

        const todosArea = document.getElementById("hp-todos-area");
        if (todosArea) {
            todosArea.innerHTML = "";
        }

        SetText("hp-profile-name", "未登录用户");
        const certNode = document.getElementById("hp-cert-badge");
        if (certNode) {
            certNode.innerHTML = "<span class=\"material-symbols-outlined\" style=\"font-size:13px;\">info</span>游客模式";
            certNode.style.color = "var(--cs-muted)";
        }

        Hide("hp-profile-stats");
        Hide("hp-btn-notify");
        Hide("hp-btn-fav");
        Hide("hp-avatar-nav");
        Hide("hp-auth-nav");
        Hide("hp-logout-divider");
        Hide("hp-btn-logout");
        Show("hp-login-cta");
        Show("hp-quick-links");

        const primaryBtn = document.getElementById("hp-btn-primary");
        if (primaryBtn) {
            primaryBtn.style.display = "";
            primaryBtn.innerHTML = "<span class=\"material-symbols-outlined\">login</span>登录";
            primaryBtn.onclick = function () {
                Api.NavigateToPage("/pages/auth_access.html");
            };
        }

        SetText("hp-points-hint", "登录后查看积分余额");
        const pointsVal = document.getElementById("hp-points-val");
        if (pointsVal) {
            pointsVal.innerHTML = "—<span class=\"u\">积分</span>";
        }

        const notifList = document.getElementById("hp-notif-list");
        if (notifList) {
            notifList.innerHTML = "<div style=\"padding:12px 8px;font-size:13px;color:var(--cs-muted);\">登录后查看消息</div>";
        }
        const notifCount = document.getElementById("hp-notif-count");
        if (notifCount) {
            notifCount.style.display = "none";
        }
    }

    async function ApplyUserState(profile) {
        const displayName = profile && (profile.displayName || profile.account) || "同学";
        const initial = displayName.slice(0, 1) || "用";
        const college = (profile && profile.college) || "";
        const nameText = college ? `${displayName} · ${college}` : displayName;

        SetText("hp-profile-name", nameText);

        const avatarLeft = document.getElementById("hp-avatar-left");
        const avatarNav = document.getElementById("hp-avatar-nav");
        if (avatarLeft) {
            avatarLeft.className = "profile-avatar";
            avatarLeft.textContent = initial;
        }
        if (avatarNav) {
            avatarNav.textContent = initial;
        }
        if (Api && Api.RenderUserAvatar) {
            if (avatarLeft) { Api.RenderUserAvatar(avatarLeft, profile, displayName); }
            if (avatarNav) { Api.RenderUserAvatar(avatarNav, profile, displayName); }
        }

        const greet = BuildHeroTime();
        SetText("hp-greet", `${greet}，${displayName} 👋`);
        SetText("hp-summary", "把握好手头的任务，今天也是充实的一天。");

        const heroActions = document.getElementById("hp-hero-actions");
        if (heroActions) {
            heroActions.innerHTML = [
                "<button class=\"ha-btn primary\" id=\"hp-btn-hero-publish\" type=\"button\"><span class=\"material-symbols-outlined\" style=\"font-size:16px;vertical-align:middle;\">add_circle</span>发布商品</button>",
                "<button class=\"ha-btn secondary\" id=\"hp-btn-hero-browse\" type=\"button\">浏览市场</button>"
            ].join("");
            const publishBtn = document.getElementById("hp-btn-hero-publish");
            const browseBtn = document.getElementById("hp-btn-hero-browse");
            if (publishBtn) {
                publishBtn.addEventListener("click", function () {
                    Api.NavigateToPage("/pages/publish_center.html");
                });
            }
            if (browseBtn) {
                browseBtn.addEventListener("click", function () {
                    Api.NavigateToPage("/pages/market_listing.html");
                });
            }
        }

        Show("hp-profile-stats");
        Show("hp-btn-notify");
        Show("hp-btn-fav");
        Show("hp-avatar-nav");
        Show("hp-auth-nav");
        Show("hp-logout-divider");
        Show("hp-btn-logout");
        Hide("hp-login-cta");
        Hide("hp-quick-links");
        Hide("hp-btn-primary");

        if (profile && profile.userRole === ADMIN_ROLE) {
            Show("hp-btn-admin");
        }
    }

    async function LoadSellerCertification(profile) {
        const certNode = document.getElementById("hp-cert-badge");
        if (!certNode) {
            return;
        }
        let certStatus = "none";

        if (profile && (profile.userRole === SELLER_ROLE || profile.userRole === ADMIN_ROLE)) {
            certStatus = "approved";
        } else if (Api && Api.GetMyLatestSellerVerification) {
            try {
                const verif = await Api.GetMyLatestSellerVerification();
                const appStatus = String((verif && verif.applicationStatus) || "").toUpperCase();
                if (appStatus === "APPROVED") {
                    certStatus = "approved";
                } else if (appStatus === "PENDING_REVIEW") {
                    certStatus = "pending";
                } else if (appStatus === "REJECTED") {
                    certStatus = "rejected";
                }
            } catch (e) { /* no prior application */ }
        }

        if (certStatus === "approved") {
            certNode.innerHTML = "<span class=\"material-symbols-outlined\" style=\"font-size:13px;color:var(--green);font-variation-settings:'FILL' 1;\">verified</span>已实名认证";
            certNode.style.color = "var(--green)";
        } else if (certStatus === "pending") {
            certNode.innerHTML = "<span class=\"material-symbols-outlined\" style=\"font-size:13px;color:var(--amber);\">schedule</span>认证审核中";
            certNode.style.color = "var(--amber)";
        } else if (certStatus === "rejected") {
            certNode.innerHTML = "<span class=\"material-symbols-outlined\" style=\"font-size:13px;color:var(--rose);\">cancel</span>认证已驳回";
            certNode.style.color = "var(--rose)";
        } else {
            certNode.innerHTML = "<span class=\"material-symbols-outlined\" style=\"font-size:13px;color:var(--cs-muted);\">info</span>未通过卖家认证";
            certNode.style.color = "var(--cs-muted)";
        }
    }

    async function LoadProfileStats() {
        try {
            const [productResult, favResult] = await Promise.allSettled([
                Api.ListMyProducts({ pageNo: 1, pageSize: 1 }),
                Api.ListMyFavoriteProducts ? Api.ListMyFavoriteProducts(1, 1) : Promise.reject(new Error("no api"))
            ]);
            if (productResult.status === "fulfilled" && productResult.value) {
                const v = productResult.value;
                const total = v.total || v.totalCount || (Array.isArray(v.list) ? v.list.length : null);
                if (total != null) { SetText("hp-stat-publish", String(total)); }
            }
            if (favResult.status === "fulfilled" && favResult.value) {
                const v = favResult.value;
                const total = v.total || v.totalCount || (Array.isArray(v.list) ? v.list.length : null);
                if (total != null) { SetText("hp-stat-fav", String(total)); }
            }
        } catch (e) { /* ignore */ }
    }

    async function LoadPoints() {
        if (!Api || !Api.GetPointBalance) {
            return;
        }
        try {
            const result = await Api.GetPointBalance();
            const balance = result && (result.availablePoints != null ? result.availablePoints : (result.currentPointBalance != null ? result.currentPointBalance : (result.pointBalance || result.balance || 0)));
            const pointsVal = document.getElementById("hp-points-val");
            if (pointsVal) {
                pointsVal.innerHTML = `${Number(balance).toFixed(0)}<span class="u">积分</span>`;
            }
            SetText("hp-points-hint", "可用于兑换资料下载");
        } catch (e) {
            SetText("hp-points-hint", "积分加载失败");
        }
    }

    async function LoadProducts(query) {
        try {
            const params = Object.assign({ pageNo: 1, pageSize: 8 }, query || {});
            const result = await Api.ListProducts(params);
            const list = Array.isArray(result) ? result : (result && Array.isArray(result.list) ? result.list : []);
            RenderProducts(list);
        } catch (e) {
            const grid = document.getElementById("hp-products");
            if (grid) {
                grid.innerHTML = "<div style=\"grid-column:1/-1;padding:40px;text-align:center;color:var(--cs-muted);\">商品加载失败，请刷新重试</div>";
            }
        }
    }

    async function LoadMaterials() {
        try {
            const result = await Api.ListPublishedMaterials({ pageNo: 1, pageSize: 5 });
            const list = Array.isArray(result) ? result : (result && Array.isArray(result.list) ? result.list : []);
            RenderMaterials(list);
        } catch (e) {
            const el = document.getElementById("hp-materials");
            if (el) {
                el.innerHTML = "<div style=\"padding:12px;font-size:13px;color:var(--cs-muted);\">资料加载失败</div>";
            }
        }
    }

    async function LoadRecruits() {
        try {
            const result = await Api.ListTeamRecruitments({ pageNo: 1, pageSize: 6 });
            const list = Array.isArray(result) ? result : (result && Array.isArray(result.list) ? result.list : []);
            RenderRecruits(list);
        } catch (e) {
            const el = document.getElementById("hp-recruits");
            if (el) {
                el.innerHTML = "<div style=\"padding:12px;font-size:13px;color:var(--cs-muted);\">招募数据加载失败</div>";
            }
        }
    }

    async function LoadNotifications() {
        try {
            const result = await Api.ListMyNotifications();
            const list = Array.isArray(result) ? result : (result && Array.isArray(result.list) ? result.list : []);
            RenderNotifications(list);
        } catch (e) { /* ignore */ }
    }

    async function LoadPendingOrders() {
        try {
            const result = await Api.ListMyOrders(1, 10);
            const list = Array.isArray(result) ? result
                : (result && Array.isArray(result.orderList) ? result.orderList
                    : (result && Array.isArray(result.list) ? result.list : []));
            const pendingList = list.filter(function (o) {
                return ORDER_TODO_CONFIG[o.orderStatus];
            });
            RenderTodos(pendingList);
            const orderBadge = document.getElementById("hp-order-badge");
            if (orderBadge && pendingList.length > 0) {
                orderBadge.className = "side-badge";
                orderBadge.textContent = String(pendingList.length);
            }
        } catch (e) {
            RenderTodos([]);
        }
    }

    async function LoadProductsByCategory(catId) {
        const categoryMap = {
            book: "TEXTBOOK",
            digital: "ELECTRONICS",
            life: "DAILY",
            cloth: "CLOTHING",
            sport: "SPORTS",
            note: "NOTES",
            instr: "INSTRUMENTS"
        };
        const query = { pageNo: 1, pageSize: 8 };
        if (categoryMap[catId]) {
            query.category = categoryMap[catId];
        }
        await LoadProducts(query);
    }

    function BindNavigation() {
        document.querySelectorAll("[data-nav-path]").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                const path = btn.getAttribute("data-nav-path");
                if (path) {
                    Api.NavigateToPage(path);
                }
            });
        });

        const brandBtn = document.getElementById("hp-btn-brand");
        if (brandBtn) {
            brandBtn.addEventListener("click", function () {
                window.location.reload();
            });
        }

        const notifyBtn = document.getElementById("hp-btn-notify");
        if (notifyBtn) {
            notifyBtn.addEventListener("click", function () {
                Api.NavigateToPage("/pages/notification_center.html");
            });
        }

        const favBtn = document.getElementById("hp-btn-fav");
        if (favBtn) {
            favBtn.addEventListener("click", function () {
                Api.NavigateToPage("/pages/user_workspace.html?tab=favs");
            });
        }

        const avatarNavBtn = document.getElementById("hp-avatar-nav");
        if (avatarNavBtn) {
            avatarNavBtn.addEventListener("click", function () {
                Api.NavigateToPage("/pages/user_profile.html");
            });
        }

        const loginCtaBtn = document.getElementById("hp-btn-login-cta");
        if (loginCtaBtn) {
            loginCtaBtn.addEventListener("click", function () {
                Api.NavigateToPage("/pages/auth_access.html");
            });
        }

        const logoutBtn = document.getElementById("hp-btn-logout");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function () {
                Api.LogoutAndRedirect();
            });
        }

        const markAllBtn = document.getElementById("hp-btn-mark-all");
        if (markAllBtn) {
            markAllBtn.addEventListener("click", async function () {
                try {
                    if (Api.MarkAllNotificationRead) {
                        await Api.MarkAllNotificationRead();
                    }
                    await LoadNotifications();
                } catch (e) { /* ignore */ }
            });
        }

        const pointsDetailBtn = document.getElementById("hp-btn-points-detail");
        if (pointsDetailBtn) {
            pointsDetailBtn.addEventListener("click", function () {
                Api.NavigateToPage("/pages/order_center.html");
            });
        }

        const pointsRedeemBtn = document.getElementById("hp-btn-points-redeem");
        if (pointsRedeemBtn) {
            pointsRedeemBtn.addEventListener("click", function () {
                Api.NavigateToPage("/pages/market_listing.html?view=MATERIAL");
            });
        }

        const favoritesBtn = document.getElementById("hp-btn-favorites");
        if (favoritesBtn) {
            favoritesBtn.addEventListener("click", function () {
                Api.NavigateToPage("/pages/user_workspace.html?tab=favs");
            });
        }
    }

    function BindCategories() {
        document.querySelectorAll(".cat[data-cat-id]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                document.querySelectorAll(".cat").forEach(function (c) {
                    c.classList.remove("active");
                });
                btn.classList.add("active");
                const catId = btn.getAttribute("data-cat-id");
                if (catId === "all") {
                    LoadProducts();
                } else {
                    LoadProductsByCategory(catId);
                }
            });
        });
    }

    function BindSearch() {
        const input = document.getElementById("hp-search-input");
        const dropdown = document.getElementById("hp-search-dropdown");
        const wrap = document.getElementById("hp-search-wrap");
        if (!input || !dropdown) {
            return;
        }

        input.addEventListener("focus", function () {
            dropdown.style.display = "";
        });

        input.addEventListener("input", function () {
            currentSearchQuery = input.value.trim();
            UpdateSearchDropdown(currentSearchQuery);
        });

        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && currentSearchQuery) {
                dropdown.style.display = "none";
                Api.NavigateToPage(`/pages/market_listing.html?q=${encodeURIComponent(currentSearchQuery)}`);
            }
            if (e.key === "Escape") {
                dropdown.style.display = "none";
                input.blur();
            }
        });

        dropdown.querySelectorAll(".sd-item[data-search-hint]").forEach(function (item) {
            item.addEventListener("click", function () {
                const hint = item.getAttribute("data-search-hint");
                Api.NavigateToPage(`/pages/market_listing.html?q=${encodeURIComponent(hint)}`);
            });
        });

        document.addEventListener("click", function (e) {
            if (wrap && wrap.parentElement && !wrap.parentElement.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });

        window.addEventListener("keydown", function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                input.focus();
                input.select();
            }
        });
    }

    function UpdateSearchDropdown(query) {
        const dropdown = document.getElementById("hp-search-dropdown");
        if (!dropdown) {
            return;
        }
        if (!query) {
            dropdown.innerHTML = [
                "<div class=\"sd-label\">热门搜索</div>",
                SEARCH_HINTS.trending.map(function (h) {
                    return `<div class="sd-item" data-search-hint="${H(h)}"><span class="material-symbols-outlined">trending_up</span>${H(h)}</div>`;
                }).join(""),
                "<div class=\"sd-label\" style=\"margin-top:6px;\">最近搜索</div>",
                SEARCH_HINTS.recent.map(function (h) {
                    return `<div class="sd-item" data-search-hint="${H(h)}"><span class="material-symbols-outlined">history</span>${H(h)}</div>`;
                }).join("")
            ].join("");
        } else {
            dropdown.innerHTML = `<div class="sd-item" data-search-hint="${H(query)}"><span class="material-symbols-outlined">search</span>搜索「${H(query)}」· 在所有分类中</div>`;
        }

        dropdown.querySelectorAll(".sd-item[data-search-hint]").forEach(function (item) {
            item.addEventListener("click", function () {
                const hint = item.getAttribute("data-search-hint");
                Api.NavigateToPage(`/pages/market_listing.html?q=${encodeURIComponent(hint)}`);
            });
        });

        dropdown.style.display = "";
    }

    async function InitPage() {
        if (!Api) {
            return;
        }

        BindNavigation();
        BindSearch();
        BindCategories();

        const isLoggedIn = !!(Api.GetAuthToken && Api.GetAuthToken());

        if (!isLoggedIn) {
            ApplyGuestState();
            LoadProducts();
            LoadMaterials();
            LoadRecruits();
            return;
        }

        let profile = Api.GetCurrentUserProfile ? Api.GetCurrentUserProfile() : null;
        try {
            profile = (Api.SyncSessionProfile && await Api.SyncSessionProfile()) || profile;
        } catch (e) { /* use cached profile */ }

        await ApplyUserState(profile);

        Promise.all([
            LoadSellerCertification(profile),
            LoadProfileStats(),
            LoadPendingOrders(),
            LoadProducts(),
            LoadMaterials(),
            LoadRecruits(),
            LoadNotifications(),
            LoadPoints()
        ]).catch(function (e) {
            console.warn("[CampusShare] Homepage data load error:", e);
        });
    }

    document.addEventListener("DOMContentLoaded", InitPage);
})();
