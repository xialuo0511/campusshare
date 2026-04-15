/**
 * CampusShare 页面接口封装
 */
(function InitCampusShareApi() {
    const AUTH_TOKEN_STORAGE_KEY = "campusshare.authToken";
    const USER_PROFILE_STORAGE_KEY = "campusshare.currentUser";
    const REQUEST_ID_HEADER = "X-Request-Id";
    const AUTH_TOKEN_HEADER = "X-Auth-Token";
    const ADMINISTRATOR_ROLE = "ADMINISTRATOR";
    const NOTIFICATION_PANEL_ID = "campusshare-notification-panel";
    const NOTIFICATION_PANEL_STYLE_ID = "campusshare-notification-panel-style";
    const NOTIFICATION_MAX_RENDER_COUNT = 20;

    const PAGE_PATH_MAP = {
        AUTH: "/pages/auth_access.html",
        OVERVIEW: "/pages/market_overview.html",
        LISTING: "/pages/market_listing.html",
        DETAIL: "/pages/market_item_detail.html",
        ORDER: "/pages/order_center.html",
        PUBLISH: "/pages/publish_create.html",
        RECRUITMENT: "/pages/recruitment_board.html",
        ADMIN: "/pages/admin_dashboard.html"
    };
    const PUBLIC_PAGE_PATH_SET = new Set([
        PAGE_PATH_MAP.AUTH,
        PAGE_PATH_MAP.OVERVIEW
    ]);

    let notificationPanelElement = null;
    let notificationSummaryElement = null;
    let notificationListElement = null;
    let notificationMarkAllReadButton = null;
    let notificationPanelTriggerElement = null;
    let notificationPanelVisible = false;
    let notificationRequestSequence = 0;
    let notificationDataList = [];

    /**
     * 生成请求ID
     */
    function BuildRequestId() {
        return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    }

    /**
     * 读取令牌
     */
    function GetAuthToken() {
        return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
    }

    /**
     * 保存令牌
     */
    function SetAuthToken(token) {
        if (!token) {
            return;
        }
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    }

    /**
     * 清理令牌
     */
    function ClearAuthToken() {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }

    /**
     * 读取当前用户信息
     */
    function GetCurrentUserProfile() {
        const profileText = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
        if (!profileText) {
            return null;
        }
        try {
            return JSON.parse(profileText);
        } catch (error) {
            return null;
        }
    }

    /**
     * 保存当前用户信息
     */
    function SetCurrentUserProfile(profile) {
        if (!profile) {
            return;
        }
        window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }

    /**
     * 清理当前用户信息
     */
    function ClearCurrentUserProfile() {
        window.localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    }

    /**
     * 保存登录会话信息
     */
    function SetSessionFromLogin(loginData) {
        if (!loginData) {
            return;
        }
        SetAuthToken(loginData.token || "");
        SetCurrentUserProfile({
            userId: loginData.userId,
            account: loginData.account,
            displayName: loginData.displayName,
            userRole: loginData.userRole
        });
    }

    /**
     * 清理登录会话信息
     */
    function ClearSession() {
        ClearAuthToken();
        ClearCurrentUserProfile();
    }

    /**
     * 解析安全页面路径
     */
    function ResolveSafePagePath(path) {
        if (!path || typeof path !== "string") {
            return "";
        }
        const normalizedPath = path.trim();
        if (!normalizedPath.startsWith("/pages/")) {
            return "";
        }
        if (normalizedPath.includes("://") || normalizedPath.startsWith("//")) {
            return "";
        }
        return normalizedPath;
    }

    /**
     * 归一化页面路径
     */
    function NormalizePagePath(path) {
        const safePath = ResolveSafePagePath(path);
        if (!safePath) {
            return "";
        }
        const queryIndex = safePath.indexOf("?");
        if (queryIndex >= 0) {
            return safePath.slice(0, queryIndex);
        }
        return safePath;
    }

    /**
     * 是否为公开页面
     */
    function IsPublicPagePath(path) {
        const normalizedPath = NormalizePagePath(path);
        if (!normalizedPath) {
            return false;
        }
        return PUBLIC_PAGE_PATH_SET.has(normalizedPath);
    }

    /**
     * 是否需要登录
     */
    function IsAuthRequiredPagePath(path) {
        const normalizedPath = NormalizePagePath(path);
        if (!normalizedPath) {
            return false;
        }
        return !IsPublicPagePath(normalizedPath);
    }

    /**
     * 当前页面路径
     */
    function ResolveCurrentPagePathWithQuery() {
        const pathname = window.location.pathname || "";
        const searchText = window.location.search || "";
        const safePathname = ResolveSafePagePath(pathname);
        if (!safePathname) {
            return "";
        }
        return `${safePathname}${searchText}`;
    }

    /**
     * 构建登录页地址
     */
    function BuildAuthPageUrl(redirectPath) {
        const safeRedirectPath = ResolveSafePagePath(redirectPath || "");
        if (!safeRedirectPath || safeRedirectPath.startsWith(PAGE_PATH_MAP.AUTH)) {
            return PAGE_PATH_MAP.AUTH;
        }
        return `${PAGE_PATH_MAP.AUTH}?redirect=${encodeURIComponent(safeRedirectPath)}`;
    }

    /**
     * 解析URL中的重定向路径
     */
    function ResolveRedirectPathFromQuery() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const redirectPath = searchParams.get("redirect");
        return ResolveSafePagePath(redirectPath || "");
    }

    /**
     * 解析默认首页
     */
    function ResolveDefaultHomePathByRole(userRole) {
        if (userRole === ADMINISTRATOR_ROLE) {
            return PAGE_PATH_MAP.ADMIN;
        }
        return PAGE_PATH_MAP.OVERVIEW;
    }

    /**
     * 解析登录成功跳转地址
     */
    function ResolveLoginSuccessRedirect(loginData) {
        const redirectPath = ResolveRedirectPathFromQuery();
        if (redirectPath && !redirectPath.startsWith(PAGE_PATH_MAP.AUTH)) {
            return redirectPath;
        }
        const currentProfile = GetCurrentUserProfile();
        const userRole = loginData && loginData.userRole
            ? loginData.userRole
            : (currentProfile && currentProfile.userRole ? currentProfile.userRole : "");
        return ResolveDefaultHomePathByRole(userRole);
    }

    /**
     * 跳转登录页
     */
    function RedirectToAuthPage(redirectPath) {
        const targetPath = redirectPath || ResolveCurrentPagePathWithQuery();
        window.location.href = BuildAuthPageUrl(targetPath);
    }

    /**
     * 页面跳转
     */
    function NavigateToPage(targetPath) {
        const safePath = ResolveSafePagePath(targetPath);
        if (!safePath) {
            return;
        }
        if (!GetAuthToken() && IsAuthRequiredPagePath(safePath)) {
            RedirectToAuthPage(safePath);
            return;
        }
        window.location.href = safePath;
    }

    /**
     * 解析导航文本对应路径
     */
    function ResolvePathByNavText(navText) {
        const text = (navText || "").trim();
        if (!text) {
            return "";
        }
        if (text.includes("仪表板") || text.includes("工作台")) {
            return PAGE_PATH_MAP.ADMIN;
        }
        if (text.includes("交易市场") || text === "市场" || text.includes("首页")) {
            return PAGE_PATH_MAP.OVERVIEW;
        }
        if (text.includes("订单")) {
            return PAGE_PATH_MAP.ORDER;
        }
        if (text.includes("发布")) {
            return PAGE_PATH_MAP.PUBLISH;
        }
        if (text.includes("招募")) {
            return PAGE_PATH_MAP.RECRUITMENT;
        }
        return "";
    }

    /**
     * 查找图标节点
     */
    function FindMaterialIconElement(iconName) {
        if (!iconName) {
            return null;
        }
        const iconByData = document.querySelector(`[data-icon='${iconName}']`);
        if (iconByData) {
            return iconByData;
        }
        const iconNodeList = Array.from(document.querySelectorAll(".material-symbols-outlined"));
        return iconNodeList.find(function FindMatchedIcon(iconElement) {
            return (iconElement.textContent || "").trim() === iconName;
        }) || null;
    }

    /**
     * 解析图标触发节点
     */
    function ResolveIconTriggerElement(iconElement) {
        if (!iconElement) {
            return null;
        }
        return iconElement.closest("button")
            || iconElement.closest("a")
            || iconElement.closest("[role='button']")
            || iconElement;
    }

    /**
     * 确保节点可点击
     */
    function EnsureInteractiveElement(triggerElement) {
        if (!triggerElement) {
            return;
        }
        const tagName = (triggerElement.tagName || "").toLowerCase();
        if (tagName === "button" || tagName === "a") {
            return;
        }
        if (!triggerElement.hasAttribute("role")) {
            triggerElement.setAttribute("role", "button");
        }
        if (!triggerElement.hasAttribute("tabindex")) {
            triggerElement.setAttribute("tabindex", "0");
        }
        triggerElement.style.cursor = "pointer";
        if (triggerElement.dataset.keyboardClickableBound === "true") {
            return;
        }
        triggerElement.dataset.keyboardClickableBound = "true";
        triggerElement.addEventListener("keydown", function HandleTriggerKeydown(event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                triggerElement.click();
            }
        });
    }

    /**
     * 注入通知面板样式
     */
    function EnsureNotificationPanelStyle() {
        if (document.getElementById(NOTIFICATION_PANEL_STYLE_ID)) {
            return;
        }
        const styleElement = document.createElement("style");
        styleElement.id = NOTIFICATION_PANEL_STYLE_ID;
        styleElement.textContent = `
            .campusshare-notification-panel {
                position: fixed;
                width: min(92vw, 360px);
                max-height: min(70vh, 520px);
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
                z-index: 1200;
                opacity: 0;
                transform: translateY(-6px) scale(0.98);
                transition: opacity 0.2s ease, transform 0.2s ease;
                pointer-events: none;
                overflow: hidden;
            }
            .campusshare-notification-panel.is-visible {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: auto;
            }
            .campusshare-notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 14px 10px;
                border-bottom: 1px solid #f1f5f9;
                background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
            }
            .campusshare-notification-title {
                font-size: 14px;
                font-weight: 700;
                color: #0f172a;
            }
            .campusshare-notification-mark-all {
                border: none;
                background: transparent;
                color: #2563eb;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                padding: 2px 0;
            }
            .campusshare-notification-mark-all:disabled {
                color: #94a3b8;
                cursor: not-allowed;
            }
            .campusshare-notification-summary {
                font-size: 12px;
                color: #64748b;
                padding: 8px 14px;
                border-bottom: 1px solid #f8fafc;
            }
            .campusshare-notification-list {
                max-height: min(54vh, 420px);
                overflow-y: auto;
                padding: 6px 0;
            }
            .campusshare-notification-item {
                padding: 10px 14px;
                border-left: 3px solid transparent;
                transition: background-color 0.15s ease;
            }
            .campusshare-notification-item:hover {
                background: #f8fafc;
            }
            .campusshare-notification-item.is-unread {
                background: #f8fbff;
                border-left-color: #2563eb;
            }
            .campusshare-notification-item-title {
                display: block;
                font-size: 13px;
                font-weight: 600;
                color: #0f172a;
                line-height: 1.4;
                margin-bottom: 4px;
            }
            .campusshare-notification-item-content {
                font-size: 12px;
                color: #475569;
                line-height: 1.5;
                margin-bottom: 6px;
                word-break: break-word;
            }
            .campusshare-notification-item-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }
            .campusshare-notification-item-time {
                font-size: 11px;
                color: #94a3b8;
            }
            .campusshare-notification-item-action {
                border: none;
                background: #e2e8f0;
                color: #0f172a;
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 999px;
                cursor: pointer;
            }
            .campusshare-notification-item-action:disabled {
                color: #94a3b8;
                cursor: not-allowed;
            }
            .campusshare-notification-empty {
                text-align: center;
                color: #94a3b8;
                font-size: 12px;
                padding: 28px 12px;
            }
            .campusshare-notification-badge {
                position: absolute;
                top: -4px;
                right: -6px;
                min-width: 16px;
                height: 16px;
                border-radius: 999px;
                background: #ef4444;
                color: #ffffff;
                font-size: 10px;
                line-height: 16px;
                text-align: center;
                font-weight: 600;
                padding: 0 4px;
                box-shadow: 0 1px 4px rgba(15, 23, 42, 0.3);
            }
        `;
        document.head.appendChild(styleElement);
    }

    /**
     * 构建通知面板节点
     */
    function EnsureNotificationPanelElement() {
        if (notificationPanelElement) {
            return notificationPanelElement;
        }
        EnsureNotificationPanelStyle();
        notificationPanelElement = document.createElement("div");
        notificationPanelElement.id = NOTIFICATION_PANEL_ID;
        notificationPanelElement.className = "campusshare-notification-panel";
        notificationPanelElement.setAttribute("aria-hidden", "true");
        notificationPanelElement.innerHTML = `
            <div class="campusshare-notification-header">
                <span class="campusshare-notification-title">消息通知</span>
                <button type="button" class="campusshare-notification-mark-all" data-action="mark-all-read">全部已读</button>
            </div>
            <div class="campusshare-notification-summary" data-role="notification-summary">正在加载...</div>
            <div class="campusshare-notification-list" data-role="notification-list">
                <div class="campusshare-notification-empty">暂无通知</div>
            </div>
        `;
        document.body.appendChild(notificationPanelElement);
        notificationSummaryElement = notificationPanelElement.querySelector("[data-role='notification-summary']");
        notificationListElement = notificationPanelElement.querySelector("[data-role='notification-list']");
        notificationMarkAllReadButton = notificationPanelElement.querySelector("[data-action='mark-all-read']");
        notificationMarkAllReadButton.addEventListener("click", function HandleMarkAllRead(event) {
            event.preventDefault();
            MarkAllNotificationRead();
        });
        return notificationPanelElement;
    }

    /**
     * 更新面板摘要
     */
    function SetNotificationSummary(totalCount, unreadCount) {
        if (!notificationSummaryElement) {
            return;
        }
        notificationSummaryElement.textContent = `共 ${totalCount} 条，未读 ${unreadCount} 条`;
    }

    /**
     * 更新铃铛角标
     */
    function UpdateNotificationBadge(unreadCount) {
        const notificationIcon = FindMaterialIconElement("notifications");
        const notificationTrigger = ResolveIconTriggerElement(notificationIcon);
        if (!notificationTrigger) {
            return;
        }
        const badgeElement = notificationTrigger.querySelector(".campusshare-notification-badge");
        if (!unreadCount || unreadCount <= 0) {
            if (badgeElement) {
                badgeElement.remove();
            }
            return;
        }
        if (window.getComputedStyle(notificationTrigger).position === "static") {
            notificationTrigger.style.position = "relative";
        }
        const nextBadgeElement = badgeElement || document.createElement("span");
        nextBadgeElement.className = "campusshare-notification-badge";
        nextBadgeElement.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
        if (!badgeElement) {
            notificationTrigger.appendChild(nextBadgeElement);
        }
    }

    /**
     * 关闭通知面板
     */
    function CloseNotificationPanel() {
        if (!notificationPanelElement) {
            return;
        }
        notificationPanelVisible = false;
        notificationPanelElement.classList.remove("is-visible");
        notificationPanelElement.setAttribute("aria-hidden", "true");
    }

    /**
     * 格式化时间
     */
    function FormatNotificationTime(timeText) {
        if (!timeText) {
            return "";
        }
        const parsedDate = new Date(timeText);
        if (Number.isNaN(parsedDate.getTime())) {
            return timeText;
        }
        return parsedDate.toLocaleString("zh-CN", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    /**
     * 渲染通知列表
     */
    function RenderNotificationList() {
        const limitedNotificationList = (notificationDataList || []).slice(0, NOTIFICATION_MAX_RENDER_COUNT);
        const unreadCount = limitedNotificationList.filter(function CountUnread(notificationItem) {
            return !notificationItem.readFlag;
        }).length;
        UpdateNotificationBadge(unreadCount);
        if (!notificationListElement) {
            return;
        }
        notificationListElement.innerHTML = "";
        SetNotificationSummary(limitedNotificationList.length, unreadCount);
        if (notificationMarkAllReadButton) {
            notificationMarkAllReadButton.disabled = unreadCount <= 0;
        }
        if (!limitedNotificationList.length) {
            const emptyElement = document.createElement("div");
            emptyElement.className = "campusshare-notification-empty";
            emptyElement.textContent = "暂无通知";
            notificationListElement.appendChild(emptyElement);
            return;
        }
        limitedNotificationList.forEach(function RenderNotificationItem(notificationItem) {
            const itemElement = document.createElement("div");
            itemElement.className = `campusshare-notification-item${notificationItem.readFlag ? "" : " is-unread"}`;
            const titleElement = document.createElement("span");
            titleElement.className = "campusshare-notification-item-title";
            titleElement.textContent = notificationItem.title || "系统通知";

            const contentElement = document.createElement("div");
            contentElement.className = "campusshare-notification-item-content";
            contentElement.textContent = notificationItem.content || "";

            const footerElement = document.createElement("div");
            footerElement.className = "campusshare-notification-item-footer";
            const timeElement = document.createElement("span");
            timeElement.className = "campusshare-notification-item-time";
            timeElement.textContent = FormatNotificationTime(notificationItem.sendTime);
            footerElement.appendChild(timeElement);

            const readButton = document.createElement("button");
            readButton.type = "button";
            readButton.className = "campusshare-notification-item-action";
            readButton.textContent = notificationItem.readFlag ? "已读" : "标记已读";
            readButton.disabled = !!notificationItem.readFlag;
            readButton.addEventListener("click", function HandleReadNotification() {
                MarkSingleNotificationRead(notificationItem.notificationId);
            });
            footerElement.appendChild(readButton);

            itemElement.appendChild(titleElement);
            itemElement.appendChild(contentElement);
            itemElement.appendChild(footerElement);
            notificationListElement.appendChild(itemElement);
        });
    }

    /**
     * 拉取通知列表
     */
    async function RefreshNotificationData() {
        const currentSequence = ++notificationRequestSequence;
        if (notificationSummaryElement) {
            notificationSummaryElement.textContent = "正在加载...";
        }
        try {
            const notificationList = await RequestApi("/api/v1/notifications", "GET", null, true);
            if (currentSequence !== notificationRequestSequence) {
                return;
            }
            notificationDataList = Array.isArray(notificationList) ? notificationList : [];
            RenderNotificationList();
        } catch (error) {
            if (currentSequence !== notificationRequestSequence) {
                return;
            }
            notificationDataList = [];
            if (notificationListElement) {
                notificationListElement.innerHTML = "";
                const failElement = document.createElement("div");
                failElement.className = "campusshare-notification-empty";
                failElement.textContent = error.message || "通知加载失败";
                notificationListElement.appendChild(failElement);
            }
            UpdateNotificationBadge(0);
            if (notificationSummaryElement) {
                notificationSummaryElement.textContent = "通知加载失败";
            }
        }
    }

    /**
     * 标记单条通知已读
     */
    async function MarkSingleNotificationRead(notificationId) {
        if (!notificationId) {
            return;
        }
        try {
            await RequestApi(`/api/v1/notifications/${notificationId}/read`, "POST", {}, true);
            notificationDataList = (notificationDataList || []).map(function PatchReadFlag(notificationItem) {
                if (notificationItem.notificationId === notificationId) {
                    return Object.assign({}, notificationItem, { readFlag: true });
                }
                return notificationItem;
            });
            RenderNotificationList();
        } catch (error) {
            window.alert(error.message || "标记已读失败");
        }
    }

    /**
     * 全部标记已读
     */
    async function MarkAllNotificationRead() {
        const unreadNotificationList = (notificationDataList || []).filter(function FilterUnread(notificationItem) {
            return !notificationItem.readFlag;
        });
        if (!unreadNotificationList.length) {
            return;
        }
        if (notificationMarkAllReadButton) {
            notificationMarkAllReadButton.disabled = true;
            notificationMarkAllReadButton.textContent = "处理中...";
        }
        try {
            for (const notificationItem of unreadNotificationList) {
                await RequestApi(`/api/v1/notifications/${notificationItem.notificationId}/read`, "POST", {}, true);
            }
            notificationDataList = (notificationDataList || []).map(function MapAllRead(notificationItem) {
                return Object.assign({}, notificationItem, { readFlag: true });
            });
            RenderNotificationList();
        } catch (error) {
            window.alert(error.message || "批量已读失败");
            RenderNotificationList();
        } finally {
            if (notificationMarkAllReadButton) {
                notificationMarkAllReadButton.textContent = "全部已读";
            }
        }
    }

    /**
     * 定位通知面板
     */
    function PositionNotificationPanel(triggerElement) {
        if (!triggerElement || !notificationPanelElement) {
            return;
        }
        const triggerRect = triggerElement.getBoundingClientRect();
        const panelRect = notificationPanelElement.getBoundingClientRect();
        const panelWidth = panelRect.width || 360;
        const panelHeight = panelRect.height || 420;
        const horizontalPadding = 12;
        const verticalPadding = 12;
        let nextLeft = triggerRect.right - panelWidth;
        nextLeft = Math.max(horizontalPadding, Math.min(nextLeft, window.innerWidth - panelWidth - horizontalPadding));
        let nextTop = triggerRect.bottom + 10;
        if (nextTop + panelHeight + verticalPadding > window.innerHeight) {
            nextTop = triggerRect.top - panelHeight - 10;
        }
        if (nextTop < verticalPadding) {
            nextTop = verticalPadding;
        }
        notificationPanelElement.style.left = `${Math.round(nextLeft)}px`;
        notificationPanelElement.style.top = `${Math.round(nextTop)}px`;
    }

    /**
     * 打开通知面板
     */
    async function OpenNotificationPanel(triggerElement) {
        notificationPanelTriggerElement = triggerElement;
        EnsureNotificationPanelElement();
        notificationPanelVisible = true;
        notificationPanelElement.classList.add("is-visible");
        notificationPanelElement.setAttribute("aria-hidden", "false");
        PositionNotificationPanel(triggerElement);
        await RefreshNotificationData();
        PositionNotificationPanel(triggerElement);
    }

    /**
     * 切换通知面板
     */
    async function ToggleNotificationPanel(triggerElement) {
        if (notificationPanelVisible) {
            CloseNotificationPanel();
            return;
        }
        await OpenNotificationPanel(triggerElement);
    }

    /**
     * 文档点击时处理通知面板关闭
     */
    function HandleDocumentClickForNotification(event) {
        if (!notificationPanelVisible || !notificationPanelElement) {
            return;
        }
        const eventTarget = event.target;
        if (notificationPanelElement.contains(eventTarget)) {
            return;
        }
        if (notificationPanelTriggerElement && notificationPanelTriggerElement.contains(eventTarget)) {
            return;
        }
        CloseNotificationPanel();
    }

    /**
     * 键盘关闭通知面板
     */
    function HandleEscapeForNotification(event) {
        if (event.key === "Escape") {
            CloseNotificationPanel();
        }
    }

    /**
     * 绑定页面跳转
     */
    function BindPageNavigation(element, targetPath) {
        const safePath = ResolveSafePagePath(targetPath);
        if (!element || !safePath) {
            return;
        }
        element.setAttribute("href", safePath);
        if (element.dataset.pageNavigationBound === "true") {
            return;
        }
        element.dataset.pageNavigationBound = "true";
        element.addEventListener("click", function HandlePageNavigationClick(event) {
            event.preventDefault();
            NavigateToPage(safePath);
        });
    }

    /**
     * 绑定链接导航
     */
    function BindAnchorNavigation() {
        const anchorList = Array.from(document.querySelectorAll("a"));
        anchorList.forEach(function BindAnchor(anchorElement) {
            const dataTargetPath = anchorElement.getAttribute("data-nav-target") || "";
            if (dataTargetPath) {
                BindPageNavigation(anchorElement, dataTargetPath);
                return;
            }
            const text = anchorElement.textContent ? anchorElement.textContent.trim() : "";
            if (!text) {
                return;
            }
            if (text.includes("登出") || text.toLowerCase().includes("logout")) {
                anchorElement.href = "javascript:void(0)";
                anchorElement.addEventListener("click", function HandleLogoutClick(event) {
                    event.preventDefault();
                    ClearSession();
                    window.location.href = PAGE_PATH_MAP.AUTH;
                });
                return;
            }
            if (text.includes("登录") || text.includes("注册")) {
                anchorElement.href = PAGE_PATH_MAP.AUTH;
                return;
            }
            const currentHref = anchorElement.getAttribute("href") || "";
            const explicitTargetPath = ResolveSafePagePath(currentHref);
            if (explicitTargetPath) {
                BindPageNavigation(anchorElement, explicitTargetPath);
                return;
            }
            if (currentHref !== "#" && currentHref !== "" && currentHref !== "javascript:void(0)") {
                return;
            }
            const targetPath = ResolvePathByNavText(text);
            if (!targetPath) {
                return;
            }
            BindPageNavigation(anchorElement, targetPath);
        });
    }

    /**
     * 绑定按钮导航
     */
    function BindButtonNavigation() {
        const buttonList = Array.from(document.querySelectorAll("button"));
        buttonList.forEach(function BindButton(buttonElement) {
            const dataTargetPath = buttonElement.getAttribute("data-nav-target") || "";
            if (dataTargetPath && buttonElement.dataset.pageNavigationBound !== "true") {
                buttonElement.dataset.pageNavigationBound = "true";
                buttonElement.addEventListener("click", function HandleDataTargetNavigation(event) {
                    event.preventDefault();
                    NavigateToPage(dataTargetPath);
                });
            }
            const buttonText = buttonElement.textContent ? buttonElement.textContent.trim() : "";
            if (!buttonText) {
                return;
            }
            if ((buttonText.includes("发布") || buttonText.includes("去发布"))
                && !dataTargetPath
                && !buttonElement.closest("form")
                && !buttonElement.hasAttribute("data-action")
                && !buttonElement.hasAttribute("data-task-action")
                && !buttonElement.hasAttribute("data-order-action")) {
                buttonElement.addEventListener("click", function HandlePublishJump() {
                    NavigateToPage(PAGE_PATH_MAP.PUBLISH);
                });
            }
            if (buttonText.includes("登出") && !buttonElement.hasAttribute("data-action")) {
                buttonElement.addEventListener("click", function HandleButtonLogout() {
                    ClearSession();
                    window.location.href = PAGE_PATH_MAP.AUTH;
                });
            }
        });
    }

    /**
     * 页面访问控制
     */
    function EnsurePageAccessControl() {
        const currentPagePath = ResolveCurrentPagePathWithQuery();
        const normalizedCurrentPagePath = NormalizePagePath(currentPagePath);
        if (!normalizedCurrentPagePath) {
            return true;
        }
        if (!GetAuthToken() && IsAuthRequiredPagePath(normalizedCurrentPagePath)) {
            RedirectToAuthPage(currentPagePath);
            return false;
        }
        return true;
    }

    /**
     * 绑定图标导航
     */
    function BindIconNavigation() {
        const accountIcon = FindMaterialIconElement("account_circle");
        const accountTrigger = ResolveIconTriggerElement(accountIcon);
        if (accountTrigger && accountTrigger.dataset.accountNavigationBound !== "true") {
            EnsureInteractiveElement(accountTrigger);
            accountTrigger.dataset.accountNavigationBound = "true";
            accountTrigger.addEventListener("click", function HandleAccountClick() {
                const token = GetAuthToken();
                if (!token) {
                    RedirectToAuthPage();
                    return;
                }
                const profile = GetCurrentUserProfile();
                NavigateToPage(ResolveDefaultHomePathByRole(profile && profile.userRole ? profile.userRole : ""));
            });
        }

        const notificationIcon = FindMaterialIconElement("notifications");
        const notificationTrigger = ResolveIconTriggerElement(notificationIcon);
        if (notificationTrigger && notificationTrigger.dataset.notificationNavigationBound !== "true") {
            EnsureInteractiveElement(notificationTrigger);
            notificationTrigger.dataset.notificationNavigationBound = "true";
            notificationTrigger.addEventListener("click", function HandleNotificationClick(event) {
                event.preventDefault();
                if (!GetAuthToken()) {
                    RedirectToAuthPage();
                    return;
                }
                ToggleNotificationPanel(notificationTrigger);
            });
        }
        if (GetAuthToken()) {
            RefreshNotificationData();
        } else {
            UpdateNotificationBadge(0);
        }
    }

    /**
     * 绑定全局壳层导航
     */
    function BindGlobalShellNavigation() {
        BindAnchorNavigation();
        BindButtonNavigation();
        BindIconNavigation();
        document.addEventListener("click", HandleDocumentClickForNotification, true);
        document.addEventListener("keydown", HandleEscapeForNotification);
        window.addEventListener("resize", function HandleNotificationPanelResize() {
            if (notificationPanelVisible && notificationPanelTriggerElement) {
                PositionNotificationPanel(notificationPanelTriggerElement);
            }
        });
        window.addEventListener("scroll", function HandleNotificationPanelScroll() {
            if (notificationPanelVisible && notificationPanelTriggerElement) {
                PositionNotificationPanel(notificationPanelTriggerElement);
            }
        }, true);
    }

    /**
     * 统一请求入口
     */
    async function RequestApi(path, method, payload, needAuth) {
        const headers = {
            "Content-Type": "application/json",
            [REQUEST_ID_HEADER]: BuildRequestId()
        };
        if (needAuth) {
            const token = GetAuthToken();
            if (!token) {
                throw new Error("请先登录后再操作");
            }
            headers[AUTH_TOKEN_HEADER] = token;
        }

        const response = await fetch(path, {
            method,
            headers,
            body: payload ? JSON.stringify(payload) : undefined
        });

        const responseText = await response.text();
        let responseBody = null;
        try {
            responseBody = responseText ? JSON.parse(responseText) : null;
        } catch (error) {
            throw new Error("接口返回格式异常");
        }

        if (!response.ok) {
            throw new Error(`请求失败(${response.status})`);
        }
        if (!responseBody || responseBody.code !== 0) {
            const message = responseBody && responseBody.message
                ? responseBody.message
                : "请求失败";
            throw new Error(message);
        }
        return responseBody.data;
    }

    /**
     * multipart 请求入口
     */
    async function RequestMultipartApi(path, method, formData, needAuth) {
        const headers = {
            [REQUEST_ID_HEADER]: BuildRequestId()
        };
        if (needAuth) {
            const token = GetAuthToken();
            if (!token) {
                throw new Error("请先登录后再操作");
            }
            headers[AUTH_TOKEN_HEADER] = token;
        }

        const response = await fetch(path, {
            method,
            headers,
            body: formData
        });

        const responseText = await response.text();
        let responseBody = null;
        try {
            responseBody = responseText ? JSON.parse(responseText) : null;
        } catch (error) {
            throw new Error("接口返回格式异常");
        }
        if (!response.ok) {
            throw new Error(`请求失败(${response.status})`);
        }
        if (!responseBody || responseBody.code !== 0) {
            const message = responseBody && responseBody.message
                ? responseBody.message
                : "请求失败";
            throw new Error(message);
        }
        return responseBody.data;
    }

    window.CampusShareApi = {
        GetAuthToken,
        SetAuthToken,
        ClearAuthToken,
        GetCurrentUserProfile,
        SetCurrentUserProfile,
        ClearCurrentUserProfile,
        SetSessionFromLogin,
        ClearSession,
        ResolveLoginSuccessRedirect,
        ResolveRedirectPathFromQuery,
        ResolveDefaultHomePathByRole,
        BuildAuthPageUrl,
        RedirectToAuthPage,
        NavigateToPage,
        RegisterUser(payload) {
            return RequestApi("/api/v1/users/register", "POST", payload, false);
        },
        SendRegisterCode(payload) {
            return RequestApi("/api/v1/users/register/code/send", "POST", payload, false);
        },
        LoginUser(payload) {
            return RequestApi("/api/v1/users/login", "POST", payload, false);
        },
        UploadMaterial(payload) {
            return RequestApi("/api/v1/materials", "POST", payload, true);
        },
        PublishProduct(payload) {
            return RequestApi("/api/v1/products", "POST", payload, true);
        },
        UploadMaterialFile(file) {
            const formData = new FormData();
            formData.append("file", file);
            return RequestMultipartApi("/api/v1/materials/files/upload", "POST", formData, true);
        },
        DownloadMaterial(materialId) {
            return RequestApi(`/api/v1/materials/${materialId}/download`, "POST", {}, true);
        },
        ListProducts(query) {
            const searchQuery = query || {};
            const searchParams = new URLSearchParams();
            Object.keys(searchQuery).forEach(function AppendQuery(key) {
                const value = searchQuery[key];
                if (value === null || value === undefined || value === "") {
                    return;
                }
                searchParams.append(key, value);
            });
            return RequestApi(`/api/v1/products?${searchParams.toString()}`, "GET", null, false);
        },
        GetProductDetail(productId) {
            return RequestApi(`/api/v1/products/${productId}`, "GET", null, false);
        },
        GetProductFavoriteState(productId) {
            return RequestApi(`/api/v1/favorites/products/${productId}`, "GET", null, true);
        },
        ToggleProductFavorite(productId) {
            return RequestApi(`/api/v1/favorites/products/${productId}/toggle`, "POST", {}, true);
        },
        GetMarketOverview() {
            return RequestApi("/api/v1/market/overview", "GET", null, false);
        },
        CreateOrder(payload) {
            return RequestApi("/api/v1/orders", "POST", payload, true);
        },
        ListMyOrders(pageNo, pageSize) {
            return RequestApi(`/api/v1/orders/my?pageNo=${pageNo}&pageSize=${pageSize}`, "GET", null, true);
        },
        GetOrderDetail(orderId) {
            return RequestApi(`/api/v1/orders/${orderId}`, "GET", null, true);
        },
        CancelOrder(orderId) {
            return RequestApi(`/api/v1/orders/${orderId}/cancel`, "POST", {}, true);
        },
        ConfirmOrder(orderId) {
            return RequestApi(`/api/v1/orders/${orderId}/confirm`, "POST", {}, true);
        },
        CompleteOrder(orderId) {
            return RequestApi(`/api/v1/orders/${orderId}/complete`, "POST", {}, true);
        },
        CloseOrder(orderId, closeReason) {
            return RequestApi(`/api/v1/orders/${orderId}/close`, "POST", { closeReason }, true);
        },
        ListPointLedger(pageNo, pageSize) {
            return RequestApi(`/api/v1/points/ledger?pageNo=${pageNo}&pageSize=${pageSize}`, "GET", null, true);
        },
        ListTeamRecruitments(query) {
            const searchQuery = query || {};
            const searchParams = new URLSearchParams();
            Object.keys(searchQuery).forEach(function AppendQuery(key) {
                const value = searchQuery[key];
                if (value === null || value === undefined || value === "") {
                    return;
                }
                searchParams.append(key, value);
            });
            return RequestApi(`/api/v1/team/recruitments?${searchParams.toString()}`, "GET", null, false);
        },
        GetTeamRecruitmentDetail(recruitmentId) {
            return RequestApi(`/api/v1/team/recruitments/${recruitmentId}`, "GET", null, false);
        },
        PublishTeamRecruitment(payload) {
            return RequestApi("/api/v1/team/recruitments", "POST", payload, true);
        },
        ApplyTeamRecruitment(recruitmentId, payload) {
            return RequestApi(`/api/v1/team/recruitments/${recruitmentId}/apply`, "POST", payload || {}, true);
        },
        ListTeamRecruitmentApplications(recruitmentId) {
            return RequestApi(`/api/v1/team/recruitments/${recruitmentId}/applications`, "GET", null, true);
        },
        ApproveTeamRecruitmentApplication(recruitmentId, applicationId, reviewRemark) {
            return RequestApi(
                `/api/v1/team/recruitments/${recruitmentId}/applications/${applicationId}/approve`,
                "POST",
                { reviewRemark: reviewRemark || "" },
                true
            );
        },
        RejectTeamRecruitmentApplication(recruitmentId, applicationId, reviewRemark) {
            return RequestApi(
                `/api/v1/team/recruitments/${recruitmentId}/applications/${applicationId}/reject`,
                "POST",
                { reviewRemark: reviewRemark || "" },
                true
            );
        },
        CloseTeamRecruitment(recruitmentId) {
            return RequestApi(`/api/v1/team/recruitments/${recruitmentId}/close`, "POST", {}, true);
        },
        ListMyNotifications() {
            return RequestApi("/api/v1/notifications", "GET", null, true);
        },
        MarkNotificationRead(notificationId) {
            return RequestApi(`/api/v1/notifications/${notificationId}/read`, "POST", {}, true);
        },
        ListPendingUsers() {
            return RequestApi("/api/v1/admin/users/pending", "GET", null, true);
        },
        ReviewUser(userId, approved, reviewRemark) {
            return RequestApi(
                `/api/v1/admin/users/${userId}/review`,
                "POST",
                { approved: !!approved, reviewRemark: reviewRemark || "" },
                true
            );
        },
        ListPendingReports() {
            return RequestApi("/api/v1/admin/reports/pending", "GET", null, true);
        },
        ReviewReport(reportId, approved, dispositionAction, reviewRemark) {
            return RequestApi(
                `/api/v1/admin/reports/${reportId}/review`,
                "POST",
                {
                    approved: !!approved,
                    dispositionAction: dispositionAction || "",
                    reviewRemark: reviewRemark || ""
                },
                true
            );
        },
        SubmitReport(payload) {
            return RequestApi("/api/v1/reports", "POST", payload, true);
        },
        ListPendingTeamRecruitmentApplications() {
            return RequestApi("/api/v1/admin/team/applications/pending", "GET", null, true);
        }
    };

    document.addEventListener("DOMContentLoaded", function InitGlobalShellNavigation() {
        if (!EnsurePageAccessControl()) {
            return;
        }
        BindGlobalShellNavigation();
    });
})();
