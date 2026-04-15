/**
 * CampusShare 椤甸潰鎺ュ彛灏佽
 */
(function InitCampusShareApi() {
    const AUTH_TOKEN_STORAGE_KEY = "campusshare.authToken";
    const USER_PROFILE_STORAGE_KEY = "campusshare.currentUser";
    const AUTH_NOTICE_STORAGE_KEY = "campusshare.authNotice";
    const REQUEST_ID_HEADER = "X-Request-Id";
    const AUTH_TOKEN_HEADER = "X-Auth-Token";
    const REQUEST_TIMEOUT_MS = 15000;
    const BIZ_CODE_SUCCESS = 0;
    const BIZ_CODE_UNAUTHORIZED = 1002;
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
        ORDER_DETAIL: "/pages/order_detail.html",
        PUBLISH: "/pages/publish_create.html",
        RECRUITMENT: "/pages/recruitment_board.html",
        NOTIFICATION: "/pages/notification_center.html",
        PROFILE: "/pages/user_profile.html",
        MY_PUBLISH: "/pages/my_publish.html",
        ADMIN: "/pages/admin_dashboard.html",
        ADMIN_BATCH_REVIEW: "/pages/admin_batch_review.html",
        ERROR_STATUS: "/pages/error_status.html"
    };
    const PUBLIC_PAGE_PATH_SET = new Set([
        PAGE_PATH_MAP.AUTH,
        PAGE_PATH_MAP.OVERVIEW,
        PAGE_PATH_MAP.ERROR_STATUS
    ]);

    let notificationPanelElement = null;
    let notificationSummaryElement = null;
    let notificationListElement = null;
    let notificationMarkAllReadButton = null;
    let notificationPanelTriggerElement = null;
    let notificationPanelVisible = false;
    let notificationRequestSequence = 0;
    let notificationDataList = [];
    let authRedirecting = false;

    /**
     * 鐢熸垚璇锋眰ID
     */
    function BuildRequestId() {
        return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    }

    /**
     * 璇诲彇浠ょ墝
     */
    function GetAuthToken() {
        return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
    }

    /**
     * 淇濆瓨浠ょ墝
     */
    function SetAuthToken(token) {
        if (!token) {
            return;
        }
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    }

    /**
     * 娓呯悊浠ょ墝
     */
    function ClearAuthToken() {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }

    /**
     * 璇诲彇褰撳墠鐢ㄦ埛淇℃伅
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
     * 淇濆瓨褰撳墠鐢ㄦ埛淇℃伅
     */
    function SetCurrentUserProfile(profile) {
        if (!profile) {
            return;
        }
        window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }

    /**
     * 娓呯悊褰撳墠鐢ㄦ埛淇℃伅
     */
    function ClearCurrentUserProfile() {
        window.localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    }

    /**
     * 淇濆瓨鐧诲綍浼氳瘽淇℃伅
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
     * 娓呯悊鐧诲綍浼氳瘽淇℃伅
     */
    function ClearSession() {
        ClearAuthToken();
        ClearCurrentUserProfile();
    }

    /**
     * 鍐欏叆鐧诲綍鎻愮ず
     */
    function SetAuthNotice(noticeText) {
        const safeNoticeText = noticeText == null ? "" : String(noticeText).trim();
        if (!safeNoticeText) {
            return;
        }
        try {
            window.sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, safeNoticeText);
        } catch (error) {
            // 浼氳瘽瀛樺偍涓嶅彲鐢ㄦ椂蹇界暐
        }
    }

    /**
     * 璇诲彇骞舵竻鐞嗙櫥褰曟彁绀?     */
    function ConsumeAuthNotice() {
        try {
            const noticeText = window.sessionStorage.getItem(AUTH_NOTICE_STORAGE_KEY) || "";
            window.sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
            return noticeText;
        } catch (error) {
            return "";
        }
    }

    /**
     * 瑙ｆ瀽瀹夊叏椤甸潰璺緞
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
     * 鏋勫缓鍏紑鏂囦欢璁块棶鍦板潃
     */
    function BuildPublicFileUrl(fileId) {
        const safeFileId = fileId == null ? "" : String(fileId).trim();
        if (!safeFileId) {
            return "";
        }
        return `/api/v1/files/${encodeURIComponent(safeFileId)}`;
    }

    /**
     * 褰掍竴鍖栭〉闈㈣矾寰?     */
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
     * 鏄惁涓哄叕寮€椤甸潰
     */
    function IsPublicPagePath(path) {
        const normalizedPath = NormalizePagePath(path);
        if (!normalizedPath) {
            return false;
        }
        return PUBLIC_PAGE_PATH_SET.has(normalizedPath);
    }

    /**
     * 鏄惁闇€瑕佺櫥褰?     */
    function IsAuthRequiredPagePath(path) {
        const normalizedPath = NormalizePagePath(path);
        if (!normalizedPath) {
            return false;
        }
        return !IsPublicPagePath(normalizedPath);
    }

    /**
     * 褰撳墠椤甸潰璺緞
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
     * 鏋勫缓鐧诲綍椤靛湴鍧€
     */
    function BuildAuthPageUrl(redirectPath) {
        const safeRedirectPath = ResolveSafePagePath(redirectPath || "");
        if (!safeRedirectPath || safeRedirectPath.startsWith(PAGE_PATH_MAP.AUTH)) {
            return PAGE_PATH_MAP.AUTH;
        }
        return `${PAGE_PATH_MAP.AUTH}?redirect=${encodeURIComponent(safeRedirectPath)}`;
    }

    /**
     * 瑙ｆ瀽URL涓殑閲嶅畾鍚戣矾寰?     */
    function ResolveRedirectPathFromQuery() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const redirectPath = searchParams.get("redirect");
        return ResolveSafePagePath(redirectPath || "");
    }

    /**
     * 瑙ｆ瀽榛樿棣栭〉
     */
    function ResolveDefaultHomePathByRole(userRole) {
        if (userRole === ADMINISTRATOR_ROLE) {
            return PAGE_PATH_MAP.ADMIN;
        }
        return PAGE_PATH_MAP.OVERVIEW;
    }

    /**
     * 瑙ｆ瀽鐧诲綍鎴愬姛璺宠浆鍦板潃
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
     * 璺宠浆鐧诲綍椤?     */
    function RedirectToAuthPage(redirectPath, noticeText) {
        const targetPath = redirectPath || ResolveCurrentPagePathWithQuery();
        SetAuthNotice(noticeText);
        window.location.href = BuildAuthPageUrl(targetPath);
    }

    /**
     * 椤甸潰璺宠浆
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
     * 瑙ｆ瀽瀵艰埅鏂囨湰瀵瑰簲璺緞
     */
    function ResolvePathByNavText(navText) {
        const text = (navText || "").trim();
        if (!text) {
            return "";
        }
        const lowerText = text.toLowerCase();
        if (
            text.includes("管理员")
            || lowerText.includes("dashboard")
            || lowerText.includes("admin")
        ) {
            return PAGE_PATH_MAP.ADMIN;
        }
        if (
            text.includes("交易市场")
            || text.includes("首页")
            || lowerText.includes("marketplace")
            || lowerText.includes("home")
        ) {
            return PAGE_PATH_MAP.OVERVIEW;
        }
        if (text.includes("订单") || text.includes("交易请求") || lowerText.includes("trade requests")) {
            return PAGE_PATH_MAP.ORDER;
        }
        if (text.includes("发布") || lowerText.includes("publish") || lowerText.includes("upload")) {
            return PAGE_PATH_MAP.PUBLISH;
        }
        if (text.includes("招募") || lowerText.includes("recruitment")) {
            return PAGE_PATH_MAP.RECRUITMENT;
        }
        if (text.includes("我的发布") || lowerText.includes("my listings")) {
            return PAGE_PATH_MAP.MY_PUBLISH;
        }
        if (text.includes("消息") || lowerText.includes("message")) {
            return PAGE_PATH_MAP.NOTIFICATION;
        }
        if (text.includes("设置") || lowerText.includes("setting")) {
            return PAGE_PATH_MAP.PROFILE;
        }
        if (lowerText.includes("textbook") || lowerText.includes("equipment") || lowerText.includes("lab")) {
            return PAGE_PATH_MAP.LISTING;
        }
        return "";
    }

    /**
     * 鏌ユ壘鍥炬爣鑺傜偣
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
     * 瑙ｆ瀽鍥炬爣瑙﹀彂鑺傜偣
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
     * 纭繚鑺傜偣鍙偣鍑?     */
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
     * 娉ㄥ叆閫氱煡闈㈡澘鏍峰紡
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
     * 鏋勫缓閫氱煡闈㈡澘鑺傜偣
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
                <span class="campusshare-notification-title">娑堟伅閫氱煡</span>
                <button type="button" class="campusshare-notification-mark-all" data-action="mark-all-read">鍏ㄩ儴宸茶</button>
            </div>
            <div class="campusshare-notification-summary" data-role="notification-summary">姝ｅ湪鍔犺浇...</div>
            <div class="campusshare-notification-list" data-role="notification-list">
                <div class="campusshare-notification-empty">鏆傛棤閫氱煡</div>
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
     * 鏇存柊闈㈡澘鎽樿
     */
    function SetNotificationSummary(totalCount, unreadCount) {
        if (!notificationSummaryElement) {
            return;
        }
        notificationSummaryElement.textContent = `鍏?${totalCount} 鏉★紝鏈 ${unreadCount} 鏉;
    }

    /**
     * 鏇存柊閾冮摏瑙掓爣
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
     * 鍏抽棴閫氱煡闈㈡澘
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
     * 鏍煎紡鍖栨椂闂?     */
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
     * 娓叉煋閫氱煡鍒楄〃
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
            emptyElement.textContent = "鏆傛棤閫氱煡";
            notificationListElement.appendChild(emptyElement);
            return;
        }
        limitedNotificationList.forEach(function RenderNotificationItem(notificationItem) {
            const itemElement = document.createElement("div");
            itemElement.className = `campusshare-notification-item${notificationItem.readFlag ? "" : " is-unread"}`;
            const titleElement = document.createElement("span");
            titleElement.className = "campusshare-notification-item-title";
            titleElement.textContent = notificationItem.title || "绯荤粺閫氱煡";

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
            readButton.textContent = notificationItem.readFlag ? "宸茶" : "鏍囪宸茶";
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
     * 鎷夊彇閫氱煡鍒楄〃
     */
    async function RefreshNotificationData() {
        const currentSequence = ++notificationRequestSequence;
        if (notificationSummaryElement) {
            notificationSummaryElement.textContent = "姝ｅ湪鍔犺浇...";
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
                failElement.textContent = error.message || "閫氱煡鍔犺浇澶辫触";
                notificationListElement.appendChild(failElement);
            }
            UpdateNotificationBadge(0);
            if (notificationSummaryElement) {
                notificationSummaryElement.textContent = "閫氱煡鍔犺浇澶辫触";
            }
        }
    }

    /**
     * 鏍囪鍗曟潯閫氱煡宸茶
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
            window.alert(error.message || "鏍囪宸茶澶辫触");
        }
    }

    /**
     * 鍏ㄩ儴鏍囪宸茶
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
            notificationMarkAllReadButton.textContent = "澶勭悊涓?..";
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
            window.alert(error.message || "鎵归噺宸茶澶辫触");
            RenderNotificationList();
        } finally {
            if (notificationMarkAllReadButton) {
                notificationMarkAllReadButton.textContent = "鍏ㄩ儴宸茶";
            }
        }
    }

    /**
     * 瀹氫綅閫氱煡闈㈡澘
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
     * 鎵撳紑閫氱煡闈㈡澘
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
     * 鍒囨崲閫氱煡闈㈡澘
     */
    async function ToggleNotificationPanel(triggerElement) {
        if (notificationPanelVisible) {
            CloseNotificationPanel();
            return;
        }
        await OpenNotificationPanel(triggerElement);
    }

    /**
     * 鏂囨。鐐瑰嚮鏃跺鐞嗛€氱煡闈㈡澘鍏抽棴
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
     * 閿洏鍏抽棴閫氱煡闈㈡澘
     */
    function HandleEscapeForNotification(event) {
        if (event.key === "Escape") {
            CloseNotificationPanel();
        }
    }

    /**
     * 缁戝畾椤甸潰璺宠浆
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
     * 澶勭悊浼氳瘽澶辨晥
     */
    function HandleUnauthorizedState(messageText, needAuth) {
        ClearSession();
        const currentPathWithQuery = ResolveCurrentPagePathWithQuery();
        const currentNormalizedPath = NormalizePagePath(currentPathWithQuery);
        if (currentNormalizedPath === PAGE_PATH_MAP.AUTH) {
            return;
        }
        if (!needAuth && !IsAuthRequiredPagePath(currentNormalizedPath)) {
            return;
        }
        if (authRedirecting) {
            return;
        }
        authRedirecting = true;
        const noticeText = (messageText || "").trim() || "鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍";
        window.setTimeout(function RedirectAfterUnauthorized() {
            RedirectToAuthPage(currentPathWithQuery, noticeText);
        }, 80);
    }

    /**
     * 閫€鍑哄苟璺宠浆鐧诲綍椤?     */
    async function PerformLogoutAndRedirect() {
        const token = GetAuthToken();
        if (token) {
            try {
                await RequestApi("/api/v1/users/logout", "POST", {}, true);
            } catch (error) {
                // 鐧诲嚭澶辫触鏃剁户缁竻鐞嗘湰鍦颁細璇?            }
        }
        ClearSession();
        window.location.href = PAGE_PATH_MAP.AUTH;
    }

    /**
     * 鍚屾褰撳墠浼氳瘽璧勬枡
     */
    async function SyncSessionProfile() {
        const token = GetAuthToken();
        if (!token) {
            return null;
        }
        const profileResponse = await RequestApi("/api/v1/users/me/profile", "GET", null, true);
        if (!profileResponse || !profileResponse.userId) {
            return null;
        }
        SetCurrentUserProfile({
            userId: profileResponse.userId,
            account: profileResponse.account,
            displayName: profileResponse.displayName,
            userRole: profileResponse.userRole
        });
        return profileResponse;
    }

    /**
     * 缁戝畾閾炬帴瀵艰埅
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
            if (text.includes("鐧诲嚭") || text.toLowerCase().includes("logout")) {
                anchorElement.href = "javascript:void(0)";
                if (anchorElement.dataset.logoutNavigationBound === "true") {
                    return;
                }
                anchorElement.dataset.logoutNavigationBound = "true";
                anchorElement.addEventListener("click", async function HandleLogoutClick(event) {
                    event.preventDefault();
                    await PerformLogoutAndRedirect();
                });
                return;
            }
            if (text.includes("鐧诲綍") || text.includes("娉ㄥ唽")) {
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
     * 缁戝畾鎸夐挳瀵艰埅
     */
    function BindButtonNavigation() {
        const buttonList = Array.from(document.querySelectorAll("button"));
        buttonList.forEach(function BindButton(buttonElement) {
            const dataTargetPath = buttonElement.getAttribute("data-nav-target") || "";
            if (dataTargetPath && buttonElement.dataset.pageNavigationBound !== "true") {
                buttonElement.dataset.pageNavigationBound = "true";
                buttonElement.addEventListener("click", function HandleDataTargetNavigation(event) {
                    event.preventDefault();
                    const currentTargetPath = buttonElement.getAttribute("data-nav-target") || "";
                    NavigateToPage(currentTargetPath);
                });
            }
            const buttonText = buttonElement.textContent ? buttonElement.textContent.trim() : "";
            if (!buttonText) {
                return;
            }
            if ((buttonText.includes("鍙戝竷") || buttonText.includes("鍘诲彂甯?))
                && !dataTargetPath
                && !buttonElement.closest("form")
                && !buttonElement.hasAttribute("data-action")
                && !buttonElement.hasAttribute("data-task-action")
                && !buttonElement.hasAttribute("data-order-action")) {
                buttonElement.addEventListener("click", function HandlePublishJump() {
                    NavigateToPage(PAGE_PATH_MAP.PUBLISH);
                });
            }
            if (buttonText.includes("鐧诲嚭") && !buttonElement.hasAttribute("data-action")) {
                if (buttonElement.dataset.logoutNavigationBound === "true") {
                    return;
                }
                buttonElement.dataset.logoutNavigationBound = "true";
                buttonElement.addEventListener("click", async function HandleButtonLogout() {
                    await PerformLogoutAndRedirect();
                });
            }
        });
    }

    /**
     * 椤甸潰璁块棶鎺у埗
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
     * 缁戝畾鍥炬爣瀵艰埅
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
     * 缁戝畾鍏ㄥ眬澹冲眰瀵艰埅
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
     * 缁熶竴璇锋眰鍏ュ彛
     */
    async function FetchWithTimeout(path, requestInit) {
        const abortController = new AbortController();
        const timeoutId = window.setTimeout(function HandleRequestTimeout() {
            abortController.abort();
        }, REQUEST_TIMEOUT_MS);
        try {
            return await fetch(path, {
                ...requestInit,
                signal: abortController.signal
            });
        } catch (error) {
            if (error && error.name === "AbortError") {
                throw new Error("璇锋眰瓒呮椂锛岃绋嶅悗閲嶈瘯");
            }
            throw new Error("缃戠粶寮傚父锛岃妫€鏌ョ綉缁滆繛鎺?);
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    /**
     * 瑙ｆ瀽鎺ュ彛鍝嶅簲浣?     */
    function ParseApiResponseBody(responseText) {
        if (!responseText) {
            return null;
        }
        try {
            return JSON.parse(responseText);
        } catch (error) {
            throw new Error("鎺ュ彛杩斿洖鏍煎紡寮傚父");
        }
    }

    /**
     * 瑙ｆ瀽鎺ュ彛閿欒鏂囨
     */
    function ResolveApiErrorMessage(responseBody, fallbackMessage) {
        if (responseBody && responseBody.message) {
            return responseBody.message;
        }
        return fallbackMessage;
    }

    /**
     * 澶勭悊涓氬姟澶辫触
     */
    function HandleApiBusinessFailure(responseBody, needAuth) {
        const codeValue = responseBody ? Number(responseBody.code) : -1;
        const messageText = ResolveApiErrorMessage(responseBody, "璇锋眰澶辫触");
        if (codeValue === BIZ_CODE_UNAUTHORIZED) {
            HandleUnauthorizedState(messageText, needAuth);
        }
        throw new Error(messageText);
    }

    /**
     * 缁熶竴瑙ｆ瀽鎺ュ彛鎴愬姛鍝嶅簲
     */
    async function ResolveApiData(response, needAuth) {
        const responseText = await response.text();
        const responseBody = ParseApiResponseBody(responseText);
        if (!response.ok) {
            throw new Error(ResolveApiErrorMessage(responseBody, `璇锋眰澶辫触(${response.status})`));
        }
        if (!responseBody || Number(responseBody.code) !== BIZ_CODE_SUCCESS) {
            HandleApiBusinessFailure(responseBody, needAuth);
        }
        return responseBody.data;
    }

    /**
     * 缁熶竴璇锋眰鍏ュ彛
     */
    async function RequestApi(path, method, payload, needAuth) {
        const headers = {
            "Content-Type": "application/json",
            [REQUEST_ID_HEADER]: BuildRequestId()
        };
        if (needAuth) {
            const token = GetAuthToken();
            if (!token) {
                HandleUnauthorizedState("璇峰厛鐧诲綍鍚庡啀鎿嶄綔", true);
                throw new Error("璇峰厛鐧诲綍鍚庡啀鎿嶄綔");
            }
            headers[AUTH_TOKEN_HEADER] = token;
        }

        const response = await FetchWithTimeout(path, {
            method,
            headers,
            body: payload ? JSON.stringify(payload) : undefined
        });
        return ResolveApiData(response, needAuth);
    }

    /**
     * multipart 璇锋眰鍏ュ彛
     */
    async function RequestMultipartApi(path, method, formData, needAuth) {
        const headers = {
            [REQUEST_ID_HEADER]: BuildRequestId()
        };
        if (needAuth) {
            const token = GetAuthToken();
            if (!token) {
                HandleUnauthorizedState("璇峰厛鐧诲綍鍚庡啀鎿嶄綔", true);
                throw new Error("璇峰厛鐧诲綍鍚庡啀鎿嶄綔");
            }
            headers[AUTH_TOKEN_HEADER] = token;
        }

        const response = await FetchWithTimeout(path, {
            method,
            headers,
            body: formData
        });
        return ResolveApiData(response, needAuth);
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
        ConsumeAuthNotice,
        ResolveLoginSuccessRedirect,
        ResolveRedirectPathFromQuery,
        ResolveDefaultHomePathByRole,
        BuildAuthPageUrl,
        BuildPublicFileUrl,
        GetPagePathMap() {
            return Object.assign({}, PAGE_PATH_MAP);
        },
        RedirectToAuthPage,
        NavigateToPage,
        SyncSessionProfile,
        RegisterUser(payload) {
            return RequestApi("/api/v1/users/register", "POST", payload, false);
        },
        SendRegisterCode(payload) {
            return RequestApi("/api/v1/users/register/code/send", "POST", payload, false);
        },
        LoginUser(payload) {
            return RequestApi("/api/v1/users/login", "POST", payload, false);
        },
        LogoutUser() {
            return RequestApi("/api/v1/users/logout", "POST", {}, true);
        },
        LogoutAndRedirect() {
            return PerformLogoutAndRedirect();
        },
        UploadMaterial(payload) {
            return RequestApi("/api/v1/materials", "POST", payload, true);
        },
        ListMyMaterials(query) {
            const searchQuery = query || {};
            const searchParams = new URLSearchParams();
            Object.keys(searchQuery).forEach(function AppendQuery(key) {
                const value = searchQuery[key];
                if (value === null || value === undefined || value === "") {
                    return;
                }
                searchParams.append(key, value);
            });
            return RequestApi(`/api/v1/materials/my?${searchParams.toString()}`, "GET", null, true);
        },
        OfflineMaterial(materialId, offlineRemark) {
            return RequestApi(
                `/api/v1/materials/${materialId}/offline`,
                "POST",
                { offlineRemark: offlineRemark || "" },
                true
            );
        },
        PublishProduct(payload) {
            return RequestApi("/api/v1/products", "POST", payload, true);
        },
        ListMyProducts(query) {
            const searchQuery = query || {};
            const searchParams = new URLSearchParams();
            Object.keys(searchQuery).forEach(function AppendQuery(key) {
                const value = searchQuery[key];
                if (value === null || value === undefined || value === "") {
                    return;
                }
                searchParams.append(key, value);
            });
            return RequestApi(`/api/v1/products/my?${searchParams.toString()}`, "GET", null, true);
        },
        OfflineProduct(productId, offlineRemark) {
            return RequestApi(
                `/api/v1/products/${productId}/offline`,
                "POST",
                { offlineRemark: offlineRemark || "" },
                true
            );
        },
        UploadMaterialFile(file) {
            const formData = new FormData();
            formData.append("file", file);
            return RequestMultipartApi("/api/v1/materials/files/upload", "POST", formData, true);
        },
        DownloadMaterial(materialId) {
            return RequestApi(`/api/v1/materials/${materialId}/download`, "POST", {}, true);
        },
        GetMaterialDetail(materialId) {
            return RequestApi(`/api/v1/materials/${materialId}`, "GET", null, true);
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
        ListProductComments(productId, pageNo, pageSize) {
            return RequestApi(
                `/api/v1/products/${productId}/comments?pageNo=${pageNo}&pageSize=${pageSize}`,
                "GET",
                null,
                false
            );
        },
        CreateProductComment(productId, payload) {
            return RequestApi(`/api/v1/products/${productId}/comments`, "POST", payload, true);
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
        UpdateMyProfile(payload) {
            const currentProfile = GetCurrentUserProfile();
            if (!currentProfile || !currentProfile.userId) {
                return Promise.reject(new Error("请先登录后再操作"));
            }
            return RequestApi(`/api/v1/users/${currentProfile.userId}/profile`, "PUT", payload || {}, true);
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
        if (GetAuthToken()) {
            SyncSessionProfile().catch(function IgnoreProfileSyncError() {
                // 鏈櫥褰曟垨浼氳瘽澶辨晥鐢辩粺涓€璇锋眰灞傚鐞?            });
        }
    });
})();

