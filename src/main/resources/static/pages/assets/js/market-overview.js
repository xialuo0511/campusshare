/**
 * 主页概览逻辑
 */
(function InitMarketOverviewPage() {
    function BindMarketOverviewPage() {
        const api = window.CampusShareApi || null;
        const view = BuildView();
        SyncPrimaryAction(api, view);
        SyncProfile(api, view);
        LoadOverviewData(api, view);
    }

    function BuildView() {
        return {
            actionButton: document.querySelector("[data-role='overview-primary-action']"),
            profileAvatarNode: document.querySelector("[data-role='overview-profile-avatar']"),
            profileNameNode: document.querySelector("[data-role='overview-profile-name']"),
            profileRoleNode: document.querySelector("[data-role='overview-profile-role']"),
            adminLink: document.querySelector("[data-admin-only='true']"),
            noticeListNode: document.querySelector("[data-role='overview-notice-list']"),
            favoriteSummaryNode: document.querySelector("[data-role='overview-favorite-summary']"),
            pointBalanceNode: document.querySelector("[data-role='overview-point-balance']"),
            recommendedSummaryNode: document.querySelector("[data-role='overview-recommended-summary']"),
            productGridNode: document.querySelector("[data-role='overview-product-grid']"),
            materialListNode: document.querySelector("[data-role='overview-material-list']"),
            recruitmentListNode: document.querySelector("[data-role='overview-recruitment-list']")
        };
    }

    function SyncPrimaryAction(api, view) {
        if (!view.actionButton) {
            return;
        }
        if (api && api.GetAuthToken && api.GetAuthToken()) {
            view.actionButton.textContent = "发布";
            view.actionButton.setAttribute("data-nav-target", "/pages/publish_create.html");
            return;
        }
        view.actionButton.textContent = "登录";
        view.actionButton.setAttribute("data-nav-target", "/pages/auth_access.html");
    }

    function SyncProfile(api, view) {
        const profile = api && api.GetCurrentUserProfile ? api.GetCurrentUserProfile() : null;
        if (!profile) {
            SetText(view.profileAvatarNode, "未");
            SetText(view.profileNameNode, "未登录用户");
            SetText(view.profileRoleNode, "游客模式");
            if (view.adminLink) {
                view.adminLink.classList.add("hidden");
            }
            return;
        }
        const displayName = profile.displayName || profile.account || "已登录用户";
        SetText(view.profileNameNode, displayName);
        SetText(view.profileRoleNode, profile.userRole === "ADMINISTRATOR" ? "管理员" : "普通用户");
        SetText(view.profileAvatarNode, String(displayName).slice(0, 1) || "用");
        if (view.profileAvatarNode && api.RenderUserAvatar) {
            api.RenderUserAvatar(view.profileAvatarNode, profile, displayName);
        }
        if (view.adminLink) {
            view.adminLink.classList.toggle("hidden", profile.userRole !== "ADMINISTRATOR");
        }
    }

    async function LoadOverviewData(api, view) {
        if (!api) {
            return;
        }
        await TrySyncProfile(api, view);
        LoadUserData(api, view);
        LoadNotifications(api, view);
        LoadCards(api, view);
    }

    async function TrySyncProfile(api, view) {
        if (!api.GetAuthToken || !api.GetAuthToken() || !api.SyncSessionProfile) {
            return;
        }
        try {
            await api.SyncSessionProfile();
            SyncProfile(api, view);
        } catch (error) {
            // 首页允许以本地缓存继续展示。
        }
    }

    async function LoadUserData(api, view) {
        if (!api.GetAuthToken || !api.GetAuthToken()) {
            SetText(view.favoriteSummaryNode, "登录后查看");
            SetText(view.pointBalanceNode, "0");
            return;
        }
        try {
            if (api.GetFavoriteSummary) {
                const favoriteSummary = await api.GetFavoriteSummary();
                SetText(view.favoriteSummaryNode, `商品 ${SafeNumber(favoriteSummary.productCount)} · 资料 ${SafeNumber(favoriteSummary.materialCount)}`);
            }
            if (api.GetPointBalance) {
                const pointBalance = await api.GetPointBalance();
                SetText(view.pointBalanceNode, SafeNumber(pointBalance.currentPointBalance || pointBalance.pointBalance));
            }
        } catch (error) {
            SetText(view.favoriteSummaryNode, "加载失败");
        }
    }

    async function LoadNotifications(api, view) {
        if (!view.noticeListNode) {
            return;
        }
        if (!api.GetAuthToken || !api.GetAuthToken()) {
            RenderNoticeState(view.noticeListNode, "登录后查看消息", "login");
            return;
        }
        try {
            const loader = api.ListNotifications || api.ListMyNotifications;
            if (!loader) {
                RenderNoticeState(view.noticeListNode, "消息接口暂不可用", "empty");
                return;
            }
            const result = await loader.call(api);
            const records = NormalizeNotificationList(result);
            if (!records.length) {
                RenderNoticeState(view.noticeListNode, "暂无新消息", "empty");
                return;
            }
            const unreadCount = records.filter(function CountUnread(item) {
                return item && item.readFlag !== true;
            }).length;
            view.noticeListNode.innerHTML = [
                "<div class=\"mb-2 flex items-center justify-between gap-2\">",
                "<span class=\"text-[11px] font-semibold text-slate-400\">最近消息</span>",
                `<span class="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-[#005d90] ring-1 ring-[rgba(0,93,144,0.10)]">${unreadCount} 未读</span>`,
                "</div>",
                records.slice(0, 3).map(BuildNoticePreviewHtml).join(""),
                "<a class=\"mt-2 block w-full rounded-full bg-white/80 px-3 py-2 text-center text-[12px] font-bold text-[#005d90] ring-1 ring-[rgba(0,93,144,0.10)] transition hover:bg-white\" href=\"/pages/notification_center.html\">查看全部消息</a>"
            ].join("");
        } catch (error) {
            RenderNoticeState(view.noticeListNode, "消息加载失败", "error");
        }
    }

    function NormalizeNotificationList(result) {
        if (Array.isArray(result)) {
            return result;
        }
        if (!result || typeof result !== "object") {
            return [];
        }
        if (Array.isArray(result.records)) {
            return result.records;
        }
        if (Array.isArray(result.list)) {
            return result.list;
        }
        if (Array.isArray(result.data)) {
            return result.data;
        }
        return [];
    }

    function BuildNoticePreviewHtml(item) {
        const isUnread = item && item.readFlag !== true;
        const title = EscapeHtml((item && (item.title || item.content)) || "新消息");
        const content = EscapeHtml((item && item.content && item.content !== item.title) ? item.content : "");
        const timeText = FormatRelativeTime(item && (item.sendTime || item.createTime || item.updateTime));
        const dotClass = isUnread ? "bg-[#005d90]" : "bg-slate-300";
        const cardClass = isUnread ? "bg-white/90 ring-[rgba(0,93,144,0.12)]" : "bg-white/55 ring-[rgba(120,133,150,0.12)]";
        return [
            `<article class="mb-2 rounded-xl ${cardClass} px-3 py-2.5 ring-1 backdrop-blur transition hover:bg-white">`,
            "<div class=\"flex items-start gap-2\">",
            `<span class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}"></span>`,
            "<div class=\"min-w-0 flex-1\">",
            `<div class="flex items-center gap-2"><p class="truncate text-[12px] font-bold leading-5 text-slate-700">${title}</p>${timeText ? `<span class="shrink-0 text-[10px] text-slate-400">${EscapeHtml(timeText)}</span>` : ""}</div>`,
            content ? `<p class="mt-0.5 truncate text-[11px] leading-5 text-slate-400">${content}</p>` : "",
            "</div>",
            "</div>",
            "</article>"
        ].join("");
    }

    function RenderNoticeState(container, text, type) {
        const icon = type === "error" ? "error" : type === "login" ? "lock" : "notifications";
        const colorClass = type === "error" ? "text-red-400" : "text-slate-400";
        container.innerHTML = [
            "<div class=\"rounded-xl bg-white/55 px-3 py-3 text-center ring-1 ring-[rgba(120,133,150,0.12)]\">",
            `<span class="material-symbols-outlined mb-1 text-[18px] ${colorClass}">${icon}</span>`,
            `<p class="text-[12px] leading-relaxed ${colorClass}">${EscapeHtml(text)}</p>`,
            "</div>"
        ].join("");
    }

    function FormatRelativeTime(timeText) {
        if (!timeText) {
            return "";
        }
        const date = new Date(timeText);
        if (Number.isNaN(date.getTime())) {
            return "";
        }
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) {
            return "刚刚";
        }
        if (diffMin < 60) {
            return diffMin + "分钟前";
        }
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) {
            return diffHours + "小时前";
        }
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) {
            return diffDays + "天前";
        }
        return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
    }

    async function LoadCards(api, view) {
        try {
            if (api.GetMarketOverview) {
                const overview = await api.GetMarketOverview();
                SetText(
                    view.recommendedSummaryNode,
                    `当前在架商品 ${SafeNumber(overview.publishedProductCount)} 件 · 公开资料 ${SafeNumber(overview.publishedMaterialCount)} 份`
                );
            }
        } catch (error) {
            SetText(view.recommendedSummaryNode, "暂无推荐交易");
        }
    }

    function SetText(node, text) {
        if (node) {
            node.textContent = text;
        }
    }

    function SafeNumber(value) {
        const numberValue = Number(value || 0);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }

    function EscapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    document.addEventListener("DOMContentLoaded", BindMarketOverviewPage);
})();
