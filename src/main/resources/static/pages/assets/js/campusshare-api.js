/**
 * CampusShare 椤甸潰鎺ュ彛灏佽
 */
(function InitCampusShareApi() {
    const AUTH_TOKEN_STORAGE_KEY = "campusshare.authToken";
    const AUTH_TOKEN_LEGACY_STORAGE_KEY = "campusshare.authToken";
    const USER_PROFILE_STORAGE_KEY = "campusshare.currentUser";
    const AUTH_NOTICE_STORAGE_KEY = "campusshare.authNotice";
    const REQUEST_ID_HEADER = "X-Request-Id";
    const AUTH_TOKEN_HEADER = "X-Auth-Token";
    const REQUEST_TIMEOUT_MS = 15000;
    const BIZ_CODE_UNAUTHORIZED = 1002;
    const ADMINISTRATOR_ROLE = "ADMINISTRATOR";
    const NOTIFICATION_PANEL_ID = "campusshare-notification-panel";
    const NOTIFICATION_PANEL_STYLE_ID = "campusshare-notification-panel-style";
    const NOTIFICATION_MAX_RENDER_COUNT = 20;

    const PAGE_PATH_MAP = {
        AUTH: "/pages/auth_access.html",
        USER_WORKSPACE: "/pages/user_workspace.html",
        OVERVIEW: "/pages/market_overview.html",
        LISTING: "/pages/market_listing.html",
        FORUM_SUBVIEW: "/pages/market_listing.html?view=FORUM",
        MATERIAL_LISTING: "/pages/market_listing.html?view=MATERIAL",
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
    const USER_WORKSPACE_CHILD_PATH_SET = new Set([
        PAGE_PATH_MAP.LISTING,
        PAGE_PATH_MAP.FORUM_SUBVIEW,
        PAGE_PATH_MAP.MATERIAL_LISTING,
        PAGE_PATH_MAP.ORDER,
        PAGE_PATH_MAP.ORDER_DETAIL,
        PAGE_PATH_MAP.PUBLISH,
        PAGE_PATH_MAP.RECRUITMENT,
        PAGE_PATH_MAP.NOTIFICATION,
        PAGE_PATH_MAP.PROFILE,
        PAGE_PATH_MAP.MY_PUBLISH
    ].map(NormalizePagePath));
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
    let selectEnhanceObserver = null;

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
        const sessionToken = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
        if (sessionToken) {
            return sessionToken;
        }
        const legacyToken = window.localStorage.getItem(AUTH_TOKEN_LEGACY_STORAGE_KEY) || "";
        if (legacyToken) {
            window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, legacyToken);
            window.localStorage.removeItem(AUTH_TOKEN_LEGACY_STORAGE_KEY);
        }
        return legacyToken;
    }

    /**
     * 淇濆瓨浠ょ墝
     */
    function SetAuthToken(token) {
        if (!token) {
            return;
        }
        window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
        window.localStorage.removeItem(AUTH_TOKEN_LEGACY_STORAGE_KEY);
    }

    /**
     * 娓呯悊浠ょ墝
     */
    function ClearAuthToken() {
        window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(AUTH_TOKEN_LEGACY_STORAGE_KEY);
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
        RenderKnownUserAvatarNodes(profile);
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
            userRole: loginData.userRole,
            email: loginData.email || loginData.contact || "",
            contact: loginData.contact || loginData.email || "",
            college: loginData.college || "",
            grade: loginData.grade || "",
            avatarUrl: loginData.avatarUrl || "",
            pendingAvatarUrl: loginData.pendingAvatarUrl || "",
            avatarReviewStatus: loginData.avatarReviewStatus || ""
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
            // 蹇界暐浼氳瘽瀛樺偍寮傚父
        }
    }

    /**
     * 璇诲彇骞舵竻鐞嗙櫥褰曟彁绀?
     */
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
     * 褰掍竴鍖栭〉闈㈣矾寰?
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
     * 鏄惁闇€瑕佺櫥褰?
     */
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
    /**
     * Whether current page is rendered inside the user workspace.
     */
    function IsEmbeddedUserPage() {
        if (window.self !== window.top) {
            return true;
        }
        const searchParams = new URLSearchParams(window.location.search || "");
        return searchParams.get("embedded") === "1";
    }

    /**
     * Whether a target should open in user workspace at top level.
     */
    function ShouldRouteToUserWorkspace(targetPath) {
        if (IsEmbeddedUserPage()) {
            return false;
        }
        const normalizedPath = NormalizePagePath(targetPath);
        if (!normalizedPath || normalizedPath === PAGE_PATH_MAP.USER_WORKSPACE) {
            return false;
        }
        if (normalizedPath === PAGE_PATH_MAP.ADMIN || normalizedPath === PAGE_PATH_MAP.AUTH) {
            return false;
        }
        return USER_WORKSPACE_CHILD_PATH_SET.has(normalizedPath);
    }

    /**
     * Build workspace URL for a child page.
     */
    function BuildUserWorkspacePath(targetPath) {
        const safePath = ResolveSafePagePath(targetPath);
        if (!safePath) {
            return PAGE_PATH_MAP.USER_WORKSPACE;
        }
        return `${PAGE_PATH_MAP.USER_WORKSPACE}?target=${encodeURIComponent(safePath)}`;
    }

    function BuildAuthPageUrl(redirectPath) {
        const safeRedirectPath = ResolveSafePagePath(redirectPath || "");
        if (!safeRedirectPath || safeRedirectPath.startsWith(PAGE_PATH_MAP.AUTH)) {
            return PAGE_PATH_MAP.AUTH;
        }
        return `${PAGE_PATH_MAP.AUTH}?redirect=${encodeURIComponent(safeRedirectPath)}`;
    }

    /**
     * 瑙ｆ瀽URL涓殑閲嶅畾鍚戣矾寰?
     */
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
     * 璺宠浆鐧诲綍椤?
     */
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
        if (ShouldRouteToUserWorkspace(safePath)) {
            NavigateToPage(BuildUserWorkspacePath(safePath));
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
            text.includes("绠＄悊鍛?)
            || text.includes("浠〃鏉?)
            || text.includes("宸ヤ綔鍙?)
            || lowerText.includes("dashboard")
            || lowerText.includes("admin")
        ) {
            return PAGE_PATH_MAP.ADMIN;
        }
        if (
            text.includes("浜ゆ槗甯傚満")
            || text === "甯傚満"
            || text.includes("棣栭〉")
            || lowerText.includes("marketplace")
            || lowerText.includes("home")
        ) {
            return PAGE_PATH_MAP.OVERVIEW;
        }
        if (
            text.includes("瀛︽湳璧勬簮")
            || text.includes("瀛︿範璧勬枡")
            || text.includes("璧勬簮涓績")
            || lowerText.includes("resource")
            || lowerText.includes("material")
        ) {
            return PAGE_PATH_MAP.MATERIAL_LISTING;
        }
        if (text.includes("璁㈠崟") || text.includes("浜ゆ槗璇锋眰") || lowerText.includes("trade requests")) {
            return PAGE_PATH_MAP.ORDER;
        }
        if (text.includes("鎴戠殑鍙戝竷") || lowerText.includes("my listings")) {
            return PAGE_PATH_MAP.MY_PUBLISH;
        }
        if (
            text === "鍙戝竷"
            || text === "寮€濮嬪彂甯?
            || text === "鍘诲彂甯?
            || lowerText === "publish"
            || lowerText.includes("upload")
        ) {
            return PAGE_PATH_MAP.PUBLISH;
        }
        if (
            text.includes("鏍″洯璁哄潧")
            || text.includes("璁哄潧")
            || lowerText.includes("forum")
        ) {
            return PAGE_PATH_MAP.FORUM_SUBVIEW;
        }
        if (
            text.includes("鎷涘嫙")
            || text.includes("缁勯槦")
            || lowerText.includes("recruitment")
        ) {
            return PAGE_PATH_MAP.RECRUITMENT;
        }
        if (text.includes("娑堟伅") || lowerText.includes("message")) {
            return PAGE_PATH_MAP.NOTIFICATION;
        }
        if (text.includes("璁剧疆") || lowerText.includes("setting")) {
            return PAGE_PATH_MAP.PROFILE;
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
     * 纭繚鑺傜偣鍙偣鍑?
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
     * 娉ㄥ叆鍏ㄧ珯涓嬫媺妗嗘牱寮?
     */
    function EnsureCustomSelectStyle() {
        if (document.getElementById("campusshare-select-style")) {
            return;
        }
        const styleElement = document.createElement("style");
        styleElement.id = "campusshare-select-style";
        styleElement.textContent = `
            .campusshare-select {
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                min-height: 2.375rem;
                border: 1px solid #cbd5e1;
                border-radius: 0.5rem;
                padding: 0.5rem 2.25rem 0.5rem 0.75rem;
                background-color: #ffffff;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5.5 7.5L10 12l4.5-4.5' stroke='%2364758b' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.65rem center;
                background-size: 1rem;
                color: #0f172a;
                transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease;
            }
            .campusshare-select:hover {
                border-color: #94a3b8;
                background-color: #f8fafc;
            }
            .campusshare-select:focus {
                outline: none;
                border-color: #0ea5e9;
                box-shadow: 0 0 0 3px rgba(14, 165, 233, .14);
            }
            .campusshare-select.campusshare-select-has-icon {
                background-image: none;
                padding-right: 2rem;
            }
            .campusshare-select[disabled] {
                background-color: #f1f5f9;
                color: #94a3b8;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(styleElement);
    }

    /**
     * 缁熶竴澧炲己涓嬫媺妗嗘牱寮?
     */
    function EnhanceSelectElements(rootElement) {
        EnsureCustomSelectStyle();
        const queryRoot = rootElement && rootElement.querySelectorAll ? rootElement : document;
        const selectNodeList = Array.from(queryRoot.querySelectorAll("select"));
        selectNodeList.forEach(function PatchSelectStyle(selectElement) {
            if (!selectElement || selectElement.dataset.selectStyled === "true") {
                return;
            }
            const parentElement = selectElement.parentElement;
            const hasIconSibling = !!(parentElement && Array.from(parentElement.children || []).some(function FindIcon(child) {
                return child !== selectElement
                    && child.classList
                    && child.classList.contains("material-symbols-outlined");
            }));
            selectElement.classList.add("campusshare-select");
            if (hasIconSibling) {
                selectElement.classList.add("campusshare-select-has-icon");
            }
            selectElement.dataset.selectStyled = "true";
        });
    }

    /**
     * 鐩戝惉鍔ㄦ€佽妭鐐瑰苟澧炲己涓嬫媺妗?
     */
    function ObserveDynamicSelectElements() {
        if (selectEnhanceObserver || !document.body || typeof MutationObserver === "undefined") {
            return;
        }
        selectEnhanceObserver = new MutationObserver(function HandleNodeMutation(mutationList) {
            mutationList.forEach(function HandleMutation(mutationItem) {
                const addedNodeList = Array.from(mutationItem.addedNodes || []);
                addedNodeList.forEach(function EnhanceAddedNode(addedNode) {
                    if (!addedNode || addedNode.nodeType !== 1) {
                        return;
                    }
                    if (addedNode.tagName && addedNode.tagName.toLowerCase() === "select") {
                        EnhanceSelectElements(addedNode.parentElement || document);
                        return;
                    }
                    if (addedNode.querySelectorAll) {
                        EnhanceSelectElements(addedNode);
                    }
                });
            });
        });
        selectEnhanceObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 淇閫氱煡瑙﹀彂鑺傜偣鍩虹鏍峰紡
     */
    function EnsureNotificationTriggerStyle(triggerElement) {
        if (!triggerElement) {
            return null;
        }
        let normalizedTriggerElement = triggerElement;
        let createdTriggerShell = false;
        const tagName = (normalizedTriggerElement.tagName || "").toLowerCase();
        if (tagName !== "button" && tagName !== "a") {
            const iconElement = normalizedTriggerElement.classList
                && normalizedTriggerElement.classList.contains("material-symbols-outlined")
                ? normalizedTriggerElement
                : null;
            if (iconElement) {
                const parentElement = iconElement.parentElement;
                if (parentElement && parentElement.dataset.notificationTriggerShell === "true") {
                    normalizedTriggerElement = parentElement;
                } else if (parentElement) {
                    const triggerShellElement = document.createElement("button");
                    triggerShellElement.type = "button";
                    triggerShellElement.setAttribute("aria-label", "娑堟伅閫氱煡");
                    triggerShellElement.dataset.notificationTriggerShell = "true";
                    parentElement.insertBefore(triggerShellElement, iconElement);
                    triggerShellElement.appendChild(iconElement);
                    normalizedTriggerElement = triggerShellElement;
                    createdTriggerShell = true;
                }
            }
        }
        normalizedTriggerElement.classList.add("campusshare-notification-trigger");
        const isUserSidebarTrigger = !!normalizedTriggerElement.closest("[data-user-sidebar]")
            || !!normalizedTriggerElement.closest("[data-workspace-nav]");
        const computedStyle = window.getComputedStyle(normalizedTriggerElement);
        if (computedStyle.position === "static") {
            normalizedTriggerElement.style.position = "relative";
        }
        normalizedTriggerElement.dataset.notificationTriggerPatched = "true";
        normalizedTriggerElement.style.cursor = "pointer";
        if (isUserSidebarTrigger) {
            normalizedTriggerElement.style.display = "";
            normalizedTriggerElement.style.alignItems = "";
            normalizedTriggerElement.style.justifyContent = "";
            normalizedTriggerElement.style.width = "";
            normalizedTriggerElement.style.height = "";
            normalizedTriggerElement.style.borderRadius = "";
            normalizedTriggerElement.style.padding = "";
            normalizedTriggerElement.style.border = "";
            normalizedTriggerElement.style.background = "";
        } else {
            normalizedTriggerElement.style.display = "inline-flex";
            normalizedTriggerElement.style.alignItems = "center";
            normalizedTriggerElement.style.justifyContent = "center";
            normalizedTriggerElement.style.width = "40px";
            normalizedTriggerElement.style.height = "40px";
            normalizedTriggerElement.style.borderRadius = "12px";
        }
        if (createdTriggerShell) {
            normalizedTriggerElement.style.padding = "0";
            normalizedTriggerElement.style.border = "none";
            normalizedTriggerElement.style.background = "transparent";
        }
        const triggerIcon = normalizedTriggerElement.querySelector(".material-symbols-outlined");
        if (triggerIcon) {
            triggerIcon.style.pointerEvents = "none";
        }
        return normalizedTriggerElement;
    }

    function ResolveNotificationBadgeHost(notificationTrigger, notificationIcon) {
        if (!notificationTrigger) {
            return null;
        }
        const isUserSidebarTrigger = IsSidebarNotificationTrigger(notificationTrigger);
        if (!isUserSidebarTrigger || !notificationIcon) {
            return notificationTrigger;
        }
        const parentElement = notificationIcon.parentElement;
        if (parentElement && parentElement.classList && parentElement.classList.contains("campusshare-notification-icon-shell")) {
            return parentElement;
        }
        const iconShellElement = document.createElement("span");
        iconShellElement.className = "campusshare-notification-icon-shell";
        if (parentElement) {
            parentElement.insertBefore(iconShellElement, notificationIcon);
            iconShellElement.appendChild(notificationIcon);
        } else {
            notificationTrigger.insertBefore(iconShellElement, notificationTrigger.firstChild || null);
            iconShellElement.appendChild(notificationIcon);
        }
        return iconShellElement;
    }

    function IsSidebarNotificationTrigger(notificationTrigger) {
        return !!notificationTrigger
            && (!!notificationTrigger.closest("[data-user-sidebar]")
                || !!notificationTrigger.closest("[data-workspace-nav]"));
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
            .campusshare-notification-actions {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .campusshare-notification-center-link {
                border: none;
                background: #2563eb;
                color: #ffffff;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 8px;
                transition: background-color 0.15s ease, transform 0.15s ease;
            }
            .campusshare-notification-center-link:hover {
                background: #1d4ed8;
                transform: translateY(-1px);
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
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #ef4444;
                color: #ffffff;
                font-size: 10px;
                font-weight: 700;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                line-height: 1 !important;
                box-shadow: 0 1px 4px rgba(15, 23, 42, 0.3);
                pointer-events: none;
                border: 1.5px solid #ffffff;
            }
            .campusshare-notification-icon-shell {
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 1.25rem;
                height: 1.25rem;
                flex: 0 0 1.25rem;
            }
            [data-user-sidebar] .campusshare-notification-icon-shell > .campusshare-notification-badge {
                top: -6px;
                right: -8px;
            }
            [data-workspace-nav] .campusshare-notification-icon-shell > .campusshare-notification-badge {
                top: -6px;
                right: -8px;
            }
            .campusshare-notification-trigger {
                position: relative;
                line-height: 1;
                border-radius: 9999px;
                transition: background-color 0.15s ease, color 0.15s ease;
            }
            [data-user-sidebar] .campusshare-notification-trigger,
            [data-workspace-nav].campusshare-notification-trigger {
                border-radius: 0.5rem;
                line-height: 1.25rem;
            }
            .campusshare-notification-trigger .material-symbols-outlined {
                pointer-events: none;
            }
            .campusshare-notification-trigger:hover {
                background-color: rgba(148, 163, 184, 0.16);
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
        const notificationHeaderElement = notificationPanelElement.querySelector(".campusshare-notification-header");
        const notificationCenterButton = document.createElement("a");
        const notificationActionsElement = document.createElement("div");
        notificationCenterButton.className = "campusshare-notification-center-link";
        notificationCenterButton.href = BuildUserWorkspacePath(PAGE_PATH_MAP.NOTIFICATION);
        notificationCenterButton.textContent = "娑堟伅涓績";
        notificationActionsElement.className = "campusshare-notification-actions";
        notificationActionsElement.appendChild(notificationCenterButton);
        if (notificationMarkAllReadButton) {
            notificationActionsElement.appendChild(notificationMarkAllReadButton);
        }
        if (notificationHeaderElement) {
            notificationHeaderElement.appendChild(notificationActionsElement);
        }
        notificationCenterButton.addEventListener("click", OpenNotificationCenterFromPanel);
        notificationMarkAllReadButton.addEventListener("click", function HandleMarkAllRead(event) {
            event.preventDefault();
            MarkAllNotificationRead();
        });
        return notificationPanelElement;
    }

    function OpenNotificationCenterFromPanel(event) {
        if (event) {
            event.stopPropagation();
        }
        HideNotificationPanel();
        const notificationCenterPath = BuildUserWorkspacePath(PAGE_PATH_MAP.NOTIFICATION);
        if (!GetAuthToken()) {
            if (event) {
                event.preventDefault();
            }
            RedirectToAuthPage(notificationCenterPath);
        }
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
        const notificationTrigger = EnsureNotificationTriggerStyle(ResolveIconTriggerElement(notificationIcon));
        if (!notificationTrigger) {
            return;
        }
        const badgeHost = ResolveNotificationBadgeHost(notificationTrigger, notificationIcon) || notificationTrigger;
        const badgeElement = badgeHost.querySelector(".campusshare-notification-badge");
        if (!unreadCount || unreadCount <= 0) {
            if (badgeElement) {
                badgeElement.remove();
            }
            return;
        }
        const nextBadgeElement = badgeElement || document.createElement("span");
        nextBadgeElement.className = "campusshare-notification-badge";
        nextBadgeElement.textContent = unreadCount >= 10 ? "9+" : String(unreadCount);
        if (!badgeElement) {
            badgeHost.appendChild(nextBadgeElement);
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
     * 鏍煎紡鍖栨椂闂?
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
            await RequestApi("/api/v1/notifications/read/all", "POST", {}, true);
            notificationDataList = (notificationDataList || []).map(function MapAllRead(notificationItem) {
                return Object.assign({}, notificationItem, { readFlag: true });
            });
            RenderNotificationList();
        } catch (error) {
            window.alert(error.message || "鎵归噺宸茶澶辫触");
            RenderNotificationList();
        } finally {
            if (notificationMarkAllReadButton) {
                notificationMarkAllReadButton.disabled = false;
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
     * 鎵ц鐧诲嚭骞惰烦杞?
     */
    async function PerformLogoutAndRedirect() {
        const token = GetAuthToken();
        if (token) {
            try {
                await RequestApi("/api/v1/users/logout", "POST", {}, true);
            } catch (error) {
                // 鐧诲嚭澶辫触涓嶉樆濉炴湰鍦版竻鐞?
            }
        }
        ClearSession();
        window.location.href = PAGE_PATH_MAP.AUTH;
    }

    /**
     * 缁戝畾閾炬帴瀵艰埅
     */
    function BindAnchorNavigation() {
        const anchorList = Array.from(document.querySelectorAll("a"));
        anchorList.forEach(function BindAnchor(anchorElement) {
            const dataTargetPath = anchorElement.getAttribute("data-nav-target") || "";
            if (dataTargetPath === "local") {
                anchorElement.href = "javascript:void(0)";
                return;
            }
            if (dataTargetPath) {
                BindPageNavigation(anchorElement, dataTargetPath);
                return;
            }
            const text = anchorElement.textContent ? anchorElement.textContent.trim() : "";
            if (!text) {
                return;
            }
            if (text.includes("鐧诲嚭") || text.includes("閫€鍑?) || text.toLowerCase().includes("logout")) {
                anchorElement.href = "javascript:void(0)";
                if (anchorElement.dataset.logoutNavigationBound === "true") {
                    return;
                }
                anchorElement.dataset.logoutNavigationBound = "true";
                anchorElement.addEventListener("click", function HandleLogoutClick(event) {
                    event.preventDefault();
                    PerformLogoutAndRedirect();
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
            if (dataTargetPath === "local") {
                return;
            }
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
            if (buttonText.includes("鎴戠殑鍙戝竷")
                && !dataTargetPath
                && !buttonElement.closest("form")
                && !buttonElement.hasAttribute("data-action")
                && !buttonElement.hasAttribute("data-task-action")
                && !buttonElement.hasAttribute("data-order-action")) {
                buttonElement.addEventListener("click", function HandleMyPublishJump() {
                    NavigateToPage(PAGE_PATH_MAP.MY_PUBLISH);
                });
            }
            if ((buttonText === "鍙戝竷" || buttonText === "寮€濮嬪彂甯? || buttonText === "鍘诲彂甯?)
                && !dataTargetPath
                && !buttonElement.closest("form")
                && !buttonElement.hasAttribute("data-action")
                && !buttonElement.hasAttribute("data-task-action")
                && !buttonElement.hasAttribute("data-order-action")) {
                buttonElement.addEventListener("click", function HandlePublishJump() {
                    NavigateToPage(PAGE_PATH_MAP.PUBLISH);
                });
            }
            if ((buttonText.includes("鐧诲嚭") || buttonText.includes("閫€鍑?)) && !buttonElement.hasAttribute("data-action")) {
                if (buttonElement.dataset.logoutNavigationBound === "true") {
                    return;
                }
                buttonElement.dataset.logoutNavigationBound = "true";
                buttonElement.addEventListener("click", function HandleButtonLogout() {
                    PerformLogoutAndRedirect();
                });
            }
        });
    }

    /**
     * 缁戝畾鍝佺墝鏍囬瀵艰埅
     */
    function BindBrandNavigation() {
        const brandElementList = Array.from(document.querySelectorAll("a, span, div, h1, h2"));
        brandElementList.forEach(function BindBrandElement(brandElement) {
            if (!brandElement || brandElement.dataset.brandNavigationBound === "true") {
                return;
            }
            const brandText = (brandElement.textContent || "").replace(/\s+/g, "").trim().toLowerCase();
            if (brandText !== "campusshare") {
                return;
            }

            const shellContainer = brandElement.closest("header, nav, aside");
            if (!shellContainer) {
                return;
            }
            const elementRect = brandElement.getBoundingClientRect();
            if (elementRect.top > 260) {
                return;
            }

            brandElement.dataset.brandNavigationBound = "true";
            brandElement.style.cursor = "pointer";
            brandElement.style.userSelect = "none";
            if (brandElement.style.webkitUserSelect !== undefined) {
                brandElement.style.webkitUserSelect = "none";
            }

            const tagName = (brandElement.tagName || "").toLowerCase();
            if (tagName === "a") {
                BindPageNavigation(brandElement, PAGE_PATH_MAP.OVERVIEW);
                return;
            }

            EnsureInteractiveElement(brandElement);
            brandElement.addEventListener("click", function HandleBrandClick(event) {
                event.preventDefault();
                NavigateToPage(PAGE_PATH_MAP.OVERVIEW);
            });
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
        const notificationTrigger = EnsureNotificationTriggerStyle(ResolveIconTriggerElement(notificationIcon));
        EnsureNotificationPanelStyle();
        const shouldBindNotificationPanel = notificationTrigger && !IsSidebarNotificationTrigger(notificationTrigger);
        if (shouldBindNotificationPanel && notificationTrigger.dataset.notificationNavigationBound !== "true") {
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
     * 鍚屾鍩轰簬瑙掕壊灞曠ず鐨勫３灞傚叆鍙?     */
    function SyncRoleAwareShellItems() {
        const profile = GetCurrentUserProfile();
        const isAdministrator = profile && profile.userRole === ADMINISTRATOR_ROLE;
        const adminOnlyElementList = Array.from(document.querySelectorAll("[data-admin-only='true']"));
        adminOnlyElementList.forEach(function ToggleAdminOnlyElement(element) {
            element.classList.toggle("hidden", !isAdministrator);
            element.setAttribute("aria-hidden", isAdministrator ? "false" : "true");
        });
    }

    /**
     * 娉ㄥ叆缁熶竴鐢ㄦ埛渚ф爮甯冨眬
     */
    /**
     * Hide duplicated page shell when rendered inside user workspace.
     */
    /**
     * 瑙ｆ瀽澶村儚棣栧瓧
     */
    function ResolveUserInitial(profile, fallbackName) {
        const safeProfile = profile || {};
        const nameText = String(
            fallbackName
            || safeProfile.displayName
            || safeProfile.account
            || ""
        ).trim();
        if (!nameText) {
            return "U";
        }
        return nameText.replace(/\s+/g, "").slice(0, 1).toUpperCase();
    }

    /**
     * 娓叉煋鐢ㄦ埛澶村儚
     */
    function RenderUserAvatar(element, profile, fallbackName) {
        if (!element) {
            return;
        }
        const safeProfile = profile || {};
        const avatarUrl = String(safeProfile.avatarUrl || "").trim();
        element.innerHTML = "";
        if (avatarUrl) {
            const imageElement = document.createElement("img");
            imageElement.src = avatarUrl;
            imageElement.alt = "鐢ㄦ埛澶村儚";
            imageElement.className = "h-full w-full object-cover";
            element.appendChild(imageElement);
            return;
        }
        element.textContent = ResolveUserInitial(safeProfile, fallbackName);
    }

    function RenderKnownUserAvatarNodes(profile) {
        const safeProfile = profile || GetCurrentUserProfile() || {};
        const fallbackName = safeProfile.displayName || safeProfile.account || "";
        [
            "sidebar-avatar",
            "workspace-avatar",
            "admin-sidebar-avatar",
            "admin-header-avatar"
        ].forEach(function RenderRoleAvatar(roleName) {
            document.querySelectorAll(`[data-role='${roleName}']`).forEach(function RenderAvatarNode(element) {
                RenderUserAvatar(element, safeProfile, fallbackName);
            });
        });
    }

    function EnsureEmbeddedUserPageStyle() {
        if (!IsEmbeddedUserPage() || document.getElementById("campusshare-embedded-user-page-style")) {
            return;
        }
        const styleElement = document.createElement("style");
        styleElement.id = "campusshare-embedded-user-page-style";
        styleElement.textContent = [
            "html,body{min-height:100%!important;background:#f8fafc!important;}",
            "html.campusshare-embedded-page body>header{display:none!important;}",
            "[data-user-topbar],[data-user-sidebar],footer{display:none!important;}",
            "html.campusshare-embedded-page body>main{display:block!important;width:100%!important;max-width:none!important;min-height:100vh!important;margin:0!important;padding:2rem!important;}",
            "html.campusshare-embedded-page body>main>aside:first-child{display:none!important;}",
            "html.campusshare-embedded-page body>main>section{width:100%!important;max-width:none!important;}",
            "[data-user-shell]{display:block!important;width:100%!important;max-width:none!important;min-height:100vh!important;margin:0!important;}",
            "[data-user-main]{margin-left:0!important;width:100%!important;max-width:none!important;min-height:100vh!important;}",
            "body>main{margin-left:0!important;width:100%!important;max-width:none!important;}",
            "body{overflow-x:hidden!important;}"
        ].join("");
        document.head.appendChild(styleElement);
        document.documentElement.classList.add("campusshare-embedded-page");
    }

    function EnsureUserSidebarStyle() {
        if (document.getElementById("campusshare-user-sidebar-style")) {
            return;
        }
        const styleElement = document.createElement("style");
        styleElement.id = "campusshare-user-sidebar-style";
        styleElement.textContent = [
            "[data-user-topbar]{position:sticky!important;top:0!important;z-index:50!important;height:4rem!important;background:#f8fafc!important;border-bottom:1px solid #e2e8f0!important;display:flex!important;align-items:center!important;box-sizing:border-box!important;}",
            "[data-user-topbar]>div{width:100%!important;max-width:none!important;height:4rem!important;margin:0!important;padding:0 2rem!important;display:flex!important;align-items:center!important;justify-content:space-between!important;box-sizing:border-box!important;}",
            "[data-user-topbar] nav{display:flex!important;align-items:center!important;gap:1.5rem!important;font-family:Manrope,Inter,sans-serif!important;}",
            "[data-user-topbar] nav a{padding:.375rem 0!important;border-radius:0!important;border-bottom:2px solid transparent!important;color:#475569!important;font-size:.875rem!important;font-weight:700!important;line-height:1.25rem!important;text-decoration:none!important;background:transparent!important;}",
            "[data-user-topbar] nav a:hover,[data-user-topbar] nav a[aria-current='page'],[data-user-topbar] nav a.font-bold{color:#075985!important;border-bottom-color:#075985!important;}",
            "[data-user-shell]{display:flex!important;min-height:calc(100vh - 4rem)!important;width:100%!important;max-width:none!important;margin:0!important;}",
            "[data-user-sidebar]{position:fixed!important;left:0!important;top:4rem!important;z-index:40!important;width:16rem!important;height:calc(100vh - 4rem)!important;padding:1.5rem 1rem!important;background:#f8fafc!important;border-right:1px solid #e2e8f0!important;display:flex!important;flex-direction:column!important;box-sizing:border-box!important;}",
            "[data-user-sidebar]>div:first-child{margin:0 0 2rem 0!important;padding:0 .5rem!important;display:flex!important;align-items:center!important;gap:.75rem!important;}",
            "[data-user-sidebar]>div:first-child img,[data-user-sidebar]>div:first-child>div:first-child{width:2.5rem!important;height:2.5rem!important;border-radius:9999px!important;flex:0 0 auto!important;}",
            "[data-user-sidebar]>div:first-child p{line-height:1.2!important;white-space:nowrap!important;}",
            "[data-user-sidebar]>div:first-child>div:last-child{min-width:0!important;flex:1 1 auto!important;}",
            "[data-user-sidebar] nav{flex:1!important;display:flex!important;flex-direction:column!important;gap:.25rem!important;}",
            "[data-user-sidebar] nav a,[data-user-sidebar] [data-user-sidebar-footer] a{display:flex!important;align-items:center!important;gap:.75rem!important;width:100%!important;box-sizing:border-box!important;border-radius:.5rem!important;margin:0!important;padding:.625rem .75rem!important;color:#475569!important;font-size:.875rem!important;font-weight:600!important;line-height:1.25rem!important;text-decoration:none!important;transform:none!important;box-shadow:none!important;white-space:nowrap!important;}",
            "[data-user-sidebar] nav a span:not(.material-symbols-outlined),[data-user-sidebar] [data-user-sidebar-footer] a span:not(.material-symbols-outlined){white-space:nowrap!important;min-width:max-content!important;}",
            "[data-user-sidebar] nav a:hover,[data-user-sidebar] [data-user-sidebar-footer] a:hover{background:#eef2f7!important;color:#075985!important;}",
            "[data-user-sidebar] nav a[aria-current='page']{background:#ffffff!important;color:#075985!important;box-shadow:0 1px 2px rgba(15,23,42,.08)!important;font-weight:800!important;}",
            "[data-user-sidebar] .material-symbols-outlined{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 1.25rem!important;width:1.25rem!important;min-width:1.25rem!important;max-width:1.25rem!important;overflow:hidden!important;text-align:center!important;font-size:1.25rem!important;}",
            "[data-user-sidebar] [data-user-sidebar-footer]{margin-top:auto!important;border-top:1px solid #e2e8f0!important;padding-top:1rem!important;display:flex!important;flex-direction:column!important;gap:.25rem!important;}",
            "[data-user-sidebar] [data-admin-only='true'].hidden{display:none!important;}",
            "[data-user-main]{margin-left:16rem!important;min-height:calc(100vh - 4rem)!important;}",
            "@media(max-width:1023px){[data-user-sidebar]{display:none!important;}[data-user-main]{margin-left:0!important;}}"
        ].join("");
        document.head.appendChild(styleElement);
    }

    /**
     * 鍚屾鐢ㄦ埛渚ф爮褰撳墠椤甸珮浜?     */
    function SyncUserSidebarActiveState() {
        const sidebarElement = document.querySelector("[data-user-sidebar]");
        if (!sidebarElement) {
            return;
        }
        const currentPath = ResolveCurrentPagePathWithQuery();
        const currentNormalizedPath = NormalizePagePath(currentPath);
        const linkList = Array.from(sidebarElement.querySelectorAll("nav a[data-nav-target]"));
        linkList.forEach(function ToggleUserSidebarLink(linkElement) {
            const targetPath = linkElement.getAttribute("data-nav-target") || "";
            const targetNormalizedPath = NormalizePagePath(targetPath);
            const isCurrent = !!targetNormalizedPath && targetNormalizedPath === currentNormalizedPath;
            if (isCurrent) {
                linkElement.setAttribute("aria-current", "page");
                return;
            }
            linkElement.removeAttribute("aria-current");
        });
    }

    /**
     * 缁戝畾鍏ㄥ眬澹冲眰瀵艰埅
     */
    function BindGlobalShellNavigation() {
        EnsureEmbeddedUserPageStyle();
        EnhanceSelectElements(document);
        ObserveDynamicSelectElements();
        SyncRoleAwareShellItems();
        if (!IsEmbeddedUserPage()) {
            EnsureUserSidebarStyle();
        }
        SyncUserSidebarActiveState();
        BindBrandNavigation();
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
            userRole: profileResponse.userRole,
            email: profileResponse.email || profileResponse.contact || "",
            contact: profileResponse.contact || profileResponse.email || "",
            college: profileResponse.college || "",
            grade: profileResponse.grade || "",
            userStatus: profileResponse.userStatus || "",
            phone: profileResponse.phone || "",
            avatarUrl: profileResponse.avatarUrl || "",
            pendingAvatarUrl: profileResponse.pendingAvatarUrl || "",
            avatarReviewStatus: profileResponse.avatarReviewStatus || "",
            avatarReviewRemark: profileResponse.avatarReviewRemark || "",
            avatarReviewSubmitTime: profileResponse.avatarReviewSubmitTime || null,
            lastLoginTime: profileResponse.lastLoginTime || null
        });
        return profileResponse;
    }

    /**
     * 纭繚绠＄悊鍛樹細璇濆彲鐢?
     */
    async function EnsureAdminSession() {
        const token = GetAuthToken();
        if (!token) {
            return false;
        }
        let profile = GetCurrentUserProfile();
        if (!profile || !profile.userId) {
            try {
                profile = await SyncSessionProfile();
            } catch (error) {
                return false;
            }
        }
        return !!(profile && profile.userRole === ADMINISTRATOR_ROLE);
    }

    /**
     * 甯﹁秴鏃剁殑璇锋眰
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
     * 缁熶竴璇锋眰鍏ュ彛
     */
    async function RequestApi(path, method, payload, needAuth) {
        const headers = {
            "Content-Type": "application/json",
            [REQUEST_ID_HEADER]: BuildRequestId()
        };
        const token = GetAuthToken();
        if (needAuth) {
            if (!token) {
                HandleUnauthorizedState("璇峰厛鐧诲綍鍚庡啀鎿嶄綔", true);
                throw new Error("璇峰厛鐧诲綍鍚庡啀鎿嶄綔");
            }
        }
        if (token) {
            headers[AUTH_TOKEN_HEADER] = token;
        }

        const response = await FetchWithTimeout(path, {
            method,
            headers,
            body: payload ? JSON.stringify(payload) : undefined
        });

        const responseText = await response.text();
        let responseBody = null;
        try {
            responseBody = responseText ? JSON.parse(responseText) : null;
        } catch (error) {
            throw new Error("鎺ュ彛杩斿洖鏍煎紡寮傚父");
        }

        if (!response.ok) {
            if (needAuth && (response.status === 401 || response.status === 403)) {
                HandleUnauthorizedState("鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍", true);
                throw new Error("鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍");
            }
            throw new Error(`璇锋眰澶辫触(${response.status})`);
        }
        if (!responseBody || responseBody.code !== 0) {
            const message = responseBody && responseBody.message
                ? responseBody.message
                : "璇锋眰澶辫触";
            if (responseBody && responseBody.code === BIZ_CODE_UNAUTHORIZED) {
                HandleUnauthorizedState(message, needAuth);
            }
            throw new Error(message);
        }
        return responseBody.data;
    }

    /**
     * multipart 璇锋眰鍏ュ彛
     */
    async function RequestMultipartApi(path, method, formData, needAuth) {
        const headers = {
            [REQUEST_ID_HEADER]: BuildRequestId()
        };
        const token = GetAuthToken();
        if (needAuth) {
            if (!token) {
                HandleUnauthorizedState("璇峰厛鐧诲綍鍚庡啀鎿嶄綔", true);
                throw new Error("璇峰厛鐧诲綍鍚庡啀鎿嶄綔");
            }
        }
        if (token) {
            headers[AUTH_TOKEN_HEADER] = token;
        }

        const response = await FetchWithTimeout(path, {
            method,
            headers,
            body: formData
        });

        const responseText = await response.text();
        let responseBody = null;
        try {
            responseBody = responseText ? JSON.parse(responseText) : null;
        } catch (error) {
            throw new Error("鎺ュ彛杩斿洖鏍煎紡寮傚父");
        }
        if (!response.ok) {
            if (needAuth && (response.status === 401 || response.status === 403)) {
                HandleUnauthorizedState("鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍", true);
                throw new Error("鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍");
            }
            throw new Error(`璇锋眰澶辫触(${response.status})`);
        }
        if (!responseBody || responseBody.code !== 0) {
            const message = responseBody && responseBody.message
                ? responseBody.message
                : "璇锋眰澶辫触";
            if (responseBody && responseBody.code === BIZ_CODE_UNAUTHORIZED) {
                HandleUnauthorizedState(message, needAuth);
            }
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
        RenderUserAvatar,
        ResolveUserInitial,
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
        EnhanceSelectElements,
        SyncSessionProfile,
        EnsureAdminSession,
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
        PublishProduct(payload) {
            return RequestApi("/api/v1/products", "POST", payload, true);
        },
        UpdateProduct(productId, payload) {
            return RequestApi(`/api/v1/products/${productId}`, "PUT", payload, true);
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
        ListPublishedMaterials(query) {
            const searchQuery = query || {};
            const searchParams = new URLSearchParams();
            Object.keys(searchQuery).forEach(function AppendQuery(key) {
                const value = searchQuery[key];
                if (value === null || value === undefined || value === "") {
                    return;
                }
                searchParams.append(key, value);
            });
            return RequestApi(`/api/v1/materials/public?${searchParams.toString()}`, "GET", null, false);
        },
        OfflineMaterial(materialId, offlineRemark) {
            return RequestApi(
                `/api/v1/materials/${materialId}/offline`,
                "POST",
                { offlineRemark: offlineRemark || "" },
                true
            );
        },
        ListPendingMaterials(pageNo, pageSize) {
            return RequestApi(`/api/v1/admin/materials/pending?pageNo=${pageNo}&pageSize=${pageSize}`, "GET", null, true);
        },
        ReviewMaterial(materialId, approved, reviewRemark) {
            return RequestApi(
                `/api/v1/admin/materials/${materialId}/review`,
                "POST",
                { approved: !!approved, reviewRemark: reviewRemark || "" },
                true
            );
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
        ListMyFavoriteProducts(pageNo, pageSize) {
            return RequestApi(`/api/v1/favorites/products/my?pageNo=${pageNo}&pageSize=${pageSize}`, "GET", null, true);
        },
        GetMaterialFavoriteState(materialId) {
            return RequestApi(`/api/v1/favorites/materials/${materialId}`, "GET", null, true);
        },
        ToggleMaterialFavorite(materialId) {
            return RequestApi(`/api/v1/favorites/materials/${materialId}/toggle`, "POST", {}, true);
        },
        ListMyFavoriteMaterials(pageNo, pageSize) {
            return RequestApi(`/api/v1/favorites/materials/my?pageNo=${pageNo}&pageSize=${pageSize}`, "GET", null, true);
        },
        GetMarketOverview() {
            return RequestApi("/api/v1/market/overview", "GET", null, false);
        },
        CreateOrder(payload) {
            return RequestApi("/api/v1/orders", "POST", payload, true);
        },
        ListMyOrders(pageNo, pageSize, statusFilter) {
            const searchParams = new URLSearchParams();
            searchParams.set("pageNo", pageNo);
            searchParams.set("pageSize", pageSize);
            if (statusFilter) {
                searchParams.set("statusFilter", statusFilter);
            }
            return RequestApi(`/api/v1/orders/my?${searchParams.toString()}`, "GET", null, true);
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
        HandoverOrder(orderId) {
            return RequestApi(`/api/v1/orders/${orderId}/handover`, "POST", {}, true);
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
        MarkAllNotificationRead() {
            return RequestApi("/api/v1/notifications/read/all", "POST", {}, true);
        },
        RefreshNotificationBadge() {
            return RefreshNotificationData();
        },
        UpdateMyProfile(payload) {
            const currentProfile = GetCurrentUserProfile();
            if (!currentProfile || !currentProfile.userId) {
                return Promise.reject(new Error("璇峰厛鐧诲綍鍚庡啀鎿嶄綔"));
            }
            return RequestApi(`/api/v1/users/${currentProfile.userId}/profile`, "PUT", payload || {}, true);
        },
        SubmitMyAvatar(avatarDataUrl) {
            const currentProfile = GetCurrentUserProfile();
            if (!currentProfile || !currentProfile.userId) {
                return Promise.reject(new Error("璇峰厛鐧诲綍鍚庡啀鎿嶄綔"));
            }
            return RequestApi(
                `/api/v1/users/${currentProfile.userId}/avatar`,
                "POST",
                { avatarDataUrl: avatarDataUrl || "" },
                true
            );
        },
        ApplySellerVerification(payload) {
            return RequestApi("/api/v1/users/seller-verifications", "POST", payload || {}, true);
        },
        GetMyLatestSellerVerification() {
            return RequestApi("/api/v1/users/seller-verifications/me/latest", "GET", null, true);
        },
        ListUsersByAdmin(pageNo, pageSize, keyword, userStatus, userRole) {
            const queryList = [];
            if (pageNo) {
                queryList.push(`pageNo=${encodeURIComponent(String(pageNo))}`);
            }
            if (pageSize) {
                queryList.push(`pageSize=${encodeURIComponent(String(pageSize))}`);
            }
            if (keyword) {
                queryList.push(`keyword=${encodeURIComponent(String(keyword))}`);
            }
            if (userStatus) {
                queryList.push(`userStatus=${encodeURIComponent(String(userStatus))}`);
            }
            if (userRole) {
                queryList.push(`userRole=${encodeURIComponent(String(userRole))}`);
            }
            const queryText = queryList.length ? `?${queryList.join("&")}` : "";
            return RequestApi(`/api/v1/admin/users${queryText}`, "GET", null, true);
        },
        ListPendingUsers() {
            return RequestApi("/api/v1/admin/users/pending", "GET", null, true);
        },
        ListPendingAvatarReviews() {
            return RequestApi("/api/v1/admin/users/avatars/pending", "GET", null, true);
        },
        ReviewUser(userId, approved, reviewRemark) {
            return RequestApi(
                `/api/v1/admin/users/${userId}/review`,
                "POST",
                {
                    userId: Number(userId),
                    approved: !!approved,
                    reviewRemark: reviewRemark || ""
                },
                true
            );
        },
        ReviewUserAvatar(userId, approved, reviewRemark) {
            return RequestApi(
                `/api/v1/admin/users/${userId}/avatar/review`,
                "POST",
                { approved: !!approved, reviewRemark: reviewRemark || "" },
                true
            );
        },
        FreezeUserByAdmin(userId) {
            return RequestApi(`/api/v1/admin/users/${userId}/freeze`, "POST", {}, true);
        },
        UnfreezeUserByAdmin(userId) {
            return RequestApi(`/api/v1/admin/users/${userId}/unfreeze`, "POST", {}, true);
        },
        ListPendingSellerVerifications() {
            return RequestApi("/api/v1/admin/users/seller-verifications/pending", "GET", null, true);
        },
        ReviewSellerVerification(applicationId, approved, reviewRemark) {
            return RequestApi(
                `/api/v1/admin/users/seller-verifications/${applicationId}/review`,
                "POST",
                { approved: !!approved, reviewRemark: reviewRemark || "" },
                true
            );
        },
        ListSystemRulesByAdmin() {
            return RequestApi("/api/v1/admin/rules", "GET", null, true);
        },
        GetAdminDashboardSummary() {
            return RequestApi("/api/v1/admin/dashboard/summary", "GET", null, true);
        },
        GetAdminOpsSummary() {
            return RequestApi("/api/v1/admin/ops/summary", "GET", null, true);
        },
        GetSystemRuleByAdmin(ruleKey) {
            return RequestApi(`/api/v1/admin/rules/${encodeURIComponent(String(ruleKey))}`, "GET", null, true);
        },
        UpdateSystemRuleByAdmin(ruleKey, ruleValue) {
            return RequestApi(
                `/api/v1/admin/rules/${encodeURIComponent(String(ruleKey))}`,
                "POST",
                { ruleValue: ruleValue == null ? "" : String(ruleValue) },
                true
            );
        },
        ListProductsByAdmin(query) {
            const safeQuery = query || {};
            const queryList = [];
            if (safeQuery.pageNo) {
                queryList.push(`pageNo=${encodeURIComponent(String(safeQuery.pageNo))}`);
            }
            if (safeQuery.pageSize) {
                queryList.push(`pageSize=${encodeURIComponent(String(safeQuery.pageSize))}`);
            }
            if (safeQuery.keyword) {
                queryList.push(`keyword=${encodeURIComponent(String(safeQuery.keyword))}`);
            }
            if (safeQuery.category) {
                queryList.push(`category=${encodeURIComponent(String(safeQuery.category))}`);
            }
            if (safeQuery.productStatus) {
                queryList.push(`productStatus=${encodeURIComponent(String(safeQuery.productStatus))}`);
            }
            if (safeQuery.sellerUserId) {
                queryList.push(`sellerUserId=${encodeURIComponent(String(safeQuery.sellerUserId))}`);
            }
            const queryText = queryList.length ? `?${queryList.join("&")}` : "";
            return RequestApi(`/api/v1/admin/products${queryText}`, "GET", null, true);
        },
        ListPendingProductsByAdmin(pageNo, pageSize) {
            const queryList = [];
            if (pageNo) {
                queryList.push(`pageNo=${encodeURIComponent(String(pageNo))}`);
            }
            if (pageSize) {
                queryList.push(`pageSize=${encodeURIComponent(String(pageSize))}`);
            }
            const queryText = queryList.length ? `?${queryList.join("&")}` : "";
            return RequestApi(`/api/v1/admin/products/pending${queryText}`, "GET", null, true);
        },
        ReviewProductByAdmin(productId, approved, reviewRemark) {
            return RequestApi(
                `/api/v1/admin/products/${productId}/review`,
                "POST",
                { approved: !!approved, reviewRemark: reviewRemark || "" },
                true
            );
        },
        OfflineProductByAdmin(productId, offlineRemark) {
            return RequestApi(
                `/api/v1/admin/products/${productId}/offline`,
                "POST",
                { offlineRemark: offlineRemark || "" },
                true
            );
        },
        ListOrdersByAdmin(pageNo, pageSize, statusFilter) {
            const queryList = [];
            if (pageNo) {
                queryList.push(`pageNo=${encodeURIComponent(String(pageNo))}`);
            }
            if (pageSize) {
                queryList.push(`pageSize=${encodeURIComponent(String(pageSize))}`);
            }
            if (statusFilter) {
                queryList.push(`statusFilter=${encodeURIComponent(String(statusFilter))}`);
            }
            const queryText = queryList.length ? `?${queryList.join("&")}` : "";
            return RequestApi(`/api/v1/admin/orders${queryText}`, "GET", null, true);
        },
        GetOrderDetailByAdmin(orderId) {
            return RequestApi(`/api/v1/admin/orders/${orderId}`, "GET", null, true);
        },
        CloseOrderByAdmin(orderId, closeReason) {
            return RequestApi(
                `/api/v1/admin/orders/${orderId}/close`,
                "POST",
                { closeReason: closeReason || "" },
                true
            );
        },
        ListAuditLogsByAdmin(query) {
            const safeQuery = query || {};
            const queryList = [];
            if (safeQuery.pageNo) {
                queryList.push(`pageNo=${encodeURIComponent(String(safeQuery.pageNo))}`);
            }
            if (safeQuery.pageSize) {
                queryList.push(`pageSize=${encodeURIComponent(String(safeQuery.pageSize))}`);
            }
            if (safeQuery.operatorUserId) {
                queryList.push(`operatorUserId=${encodeURIComponent(String(safeQuery.operatorUserId))}`);
            }
            if (safeQuery.actionType) {
                queryList.push(`actionType=${encodeURIComponent(String(safeQuery.actionType))}`);
            }
            if (safeQuery.targetType) {
                queryList.push(`targetType=${encodeURIComponent(String(safeQuery.targetType))}`);
            }
            if (safeQuery.actionResult) {
                queryList.push(`actionResult=${encodeURIComponent(String(safeQuery.actionResult))}`);
            }
            const queryText = queryList.length ? `?${queryList.join("&")}` : "";
            return RequestApi(`/api/v1/admin/audit/logs${queryText}`, "GET", null, true);
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
        },
        ListPendingTeamRecruitmentsByAdmin(pageNo, pageSize) {
            const queryList = [];
            if (pageNo) {
                queryList.push(`pageNo=${encodeURIComponent(String(pageNo))}`);
            }
            if (pageSize) {
                queryList.push(`pageSize=${encodeURIComponent(String(pageSize))}`);
            }
            const queryText = queryList.length ? `?${queryList.join("&")}` : "";
            return RequestApi(`/api/v1/admin/team/recruitments/pending${queryText}`, "GET", null, true);
        },
        ReviewTeamRecruitmentByAdmin(recruitmentId, approved, reviewRemark) {
            return RequestApi(
                `/api/v1/admin/team/recruitments/${recruitmentId}/review`,
                "POST",
                { approved: !!approved, reviewRemark: reviewRemark || "" },
                true
            );
        }
    };

    document.addEventListener("DOMContentLoaded", function InitGlobalShellNavigation() {
        if (!EnsurePageAccessControl()) {
            return;
        }
        BindGlobalShellNavigation();
        if (GetAuthToken()) {
            SyncSessionProfile().catch(function IgnoreProfileSyncError() {
                // 浼氳瘽澶辨晥鐢遍〉闈㈣姹傚眰鎻愮ず
            });
        }
    });
})();

