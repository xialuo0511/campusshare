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
        if (!view.noticeListNode || !api.GetAuthToken || !api.GetAuthToken()) {
            return;
        }
        try {
            if (!api.ListNotifications) {
                return;
            }
            const result = await api.ListNotifications({ pageNo: 1, pageSize: 3 });
            const records = result.records || result.list || [];
            if (!records.length) {
                view.noticeListNode.innerHTML = "<p class=\"text-xs text-slate-500\">暂无消息提醒</p>";
                return;
            }
            view.noticeListNode.innerHTML = records.slice(0, 3).map(function BuildNotice(item) {
                return `<article class="rounded-xl bg-white p-3 text-xs text-slate-600">${EscapeHtml(item.title || item.content || "新消息")}</article>`;
            }).join("");
        } catch (error) {
            view.noticeListNode.innerHTML = "<p class=\"text-xs text-red-500\">消息加载失败</p>";
        }
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
