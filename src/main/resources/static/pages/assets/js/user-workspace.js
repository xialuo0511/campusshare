/**
 * Unified user workspace shell.
 */
(function InitUserWorkspacePage() {
    const HOME_TARGET = "/pages/market_overview.html";
    const DEFAULT_TARGET = "/pages/my_publish.html";
    const ADMINISTRATOR_ROLE = "ADMINISTRATOR";
    const TARGET_ATTRIBUTE = "data-workspace-target";
    const TITLE_BY_PATH = {
        "/pages/my_publish.html": "我的发布",
        "/pages/order_center.html": "订单中心",
        "/pages/recruitment_board.html": "组队招募",
        "/pages/notification_center.html": "消息通知",
        "/pages/user_profile.html": "个人设置",
        "/pages/publish_create.html": "发布内容",
        "/pages/publish_center.html": "发布内容",
        "/pages/market_overview.html": "首页",
        "/pages/market_listing.html": "交易市场"
    };

    /**
     * Bind workspace behavior.
     */
    async function BindUserWorkspacePage() {
        if (!window.CampusShareApi) {
            return;
        }
        if (!window.CampusShareApi.GetAuthToken()) {
            window.CampusShareApi.RedirectToAuthPage("/pages/user_workspace.html");
            return;
        }

        const frameElement = document.querySelector("[data-workspace-frame]");
        if (!frameElement) {
            return;
        }

        await SyncWorkspaceProfile();
        RefreshWorkspaceSummary();
        BindWorkspaceNavigation(frameElement);
        BindWorkspaceActions(frameElement);
        frameElement.addEventListener("load", function HandleFrameLoad() {
            ApplyEmbeddedChildShellStyle(frameElement);
            SyncActiveState(ResolveFramePath(frameElement));
        });
        NavigateWorkspaceFrame(frameElement, ResolveInitialTarget());
    }

    /**
     * Sync shell user profile.
     */
    async function SyncWorkspaceProfile() {
        let profile = window.CampusShareApi.GetCurrentUserProfile();
        try {
            profile = await window.CampusShareApi.SyncSessionProfile() || profile;
        } catch (error) {
            profile = profile || null;
        }
        const displayNameNode = document.querySelector("[data-role='workspace-display-name']");
        const roleNode = document.querySelector("[data-role='workspace-role-text']");
        const avatarNode = document.querySelector("[data-role='workspace-avatar']");
        const avatarMiniNode = document.querySelector("[data-role='workspace-avatar-mini']");
        const displayName = profile && profile.displayName ? String(profile.displayName) : "个人中心";
        if (displayNameNode) {
            displayNameNode.textContent = displayName;
        }
        if (roleNode) {
            roleNode.textContent = profile && profile.userRole === ADMINISTRATOR_ROLE ? "管理员" : "校园认证用户";
        }
        if (avatarMiniNode) {
            avatarMiniNode.textContent = displayName.slice(0, 1) || "用";
        }
        if (avatarNode) {
            avatarNode.textContent = displayName.slice(0, 1) || "用";
        }
        if (avatarNode && window.CampusShareApi.RenderUserAvatar) {
            window.CampusShareApi.RenderUserAvatar(avatarNode, profile, displayName);
        }
        const adminButton = document.querySelector("[data-workspace-admin]");
        if (adminButton) {
            const isAdministrator = !!(profile && profile.userRole === ADMINISTRATOR_ROLE);
            adminButton.classList.toggle("hidden", !isAdministrator);
            adminButton.classList.toggle("flex", isAdministrator);
        }
    }

    /**
     * Bind sidebar and topbar navigation.
     */
    function BindWorkspaceNavigation(frameElement) {
        const navigationElementList = Array.from(document.querySelectorAll(`[${TARGET_ATTRIBUTE}]`));
        navigationElementList.forEach(function BindNavigationElement(element) {
            element.addEventListener("click", function HandleNavigationClick(event) {
                event.preventDefault();
                const targetPath = element.getAttribute(TARGET_ATTRIBUTE) || DEFAULT_TARGET;
                if (NormalizeWorkspaceTarget(targetPath) === HOME_TARGET) {
                    window.location.href = HOME_TARGET;
                    return;
                }
                NavigateWorkspaceFrame(frameElement, targetPath);
            });
        });
        const homeButton = document.querySelector("[data-workspace-home]");
        if (homeButton) {
            homeButton.addEventListener("click", function HandleHomeClick(event) {
                event.preventDefault();
                window.location.href = HOME_TARGET;
            });
        }
        const brandButton = document.querySelector("[data-workspace-brand]");
        if (brandButton) {
            brandButton.addEventListener("click", function HandleBrandClick(event) {
                event.preventDefault();
                window.location.href = HOME_TARGET;
            });
        }
    }

    /**
     * Bind shell actions.
     */
    function BindWorkspaceActions(frameElement) {
        const adminButton = document.querySelector("[data-workspace-admin]");
        if (adminButton) {
            adminButton.addEventListener("click", function HandleAdminClick(event) {
                event.preventDefault();
                window.location.href = "/pages/admin_console.html";
            });
        }
        const logoutButton = document.querySelector("[data-workspace-logout]");
        if (logoutButton) {
            logoutButton.addEventListener("click", function HandleLogoutClick(event) {
                event.preventDefault();
                window.CampusShareApi.LogoutAndRedirect();
            });
        }
    }

    /**
     * Resolve initial child target from query.
     */
    function ResolveInitialTarget() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const targetPath = searchParams.get("target") || "";
        return ResolveSafeWorkspaceTarget(targetPath) || DEFAULT_TARGET;
    }

    /**
     * Navigate iframe to a child page.
     */
    function NavigateWorkspaceFrame(frameElement, targetPath) {
        const safeTarget = ResolveSafeWorkspaceTarget(targetPath) || DEFAULT_TARGET;
        frameElement.src = BuildEmbeddedTarget(safeTarget);
        window.history.replaceState(null, "", `/pages/user_workspace.html?target=${encodeURIComponent(safeTarget)}`);
        SyncActiveState(safeTarget);
    }

    /**
     * Build embedded child URL.
     */
    function BuildEmbeddedTarget(targetPath) {
        const safeTarget = ResolveSafeWorkspaceTarget(targetPath) || DEFAULT_TARGET;
        const splitIndex = safeTarget.indexOf("?");
        const pathname = splitIndex >= 0 ? safeTarget.slice(0, splitIndex) : safeTarget;
        const searchText = splitIndex >= 0 ? safeTarget.slice(splitIndex + 1) : "";
        const searchParams = new URLSearchParams(searchText);
        searchParams.set("embedded", "1");
        searchParams.set("shellVersion", "20260424");
        return `${pathname}?${searchParams.toString()}`;
    }

    /**
     * Apply embedded style from parent shell to avoid stale child script cache.
     */
    function ApplyEmbeddedChildShellStyle(frameElement) {
        const childDocument = frameElement && frameElement.contentDocument ? frameElement.contentDocument : null;
        if (!childDocument || childDocument.getElementById("campusshare-workspace-child-style")) {
            return;
        }
        const styleElement = childDocument.createElement("style");
        styleElement.id = "campusshare-workspace-child-style";
        styleElement.textContent = [
            "html,body{width:100%!important;height:100%!important;min-height:0!important;background:transparent!important;overflow:hidden!important;}",
            "body>header,[data-user-topbar],[data-user-sidebar],footer{display:none!important;}",
            "body>main,[data-user-shell]{display:block!important;width:100%!important;max-width:none!important;height:100%!important;min-height:0!important;margin:0!important;background:transparent!important;overflow:hidden!important;}",
            "[data-user-main],body>main{height:100%!important;min-height:0!important;margin:0!important;padding:1.5rem!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-gutter:stable!important;}",
            "body>main>aside:first-child{display:none!important;}",
            "body>main>section{width:100%!important;max-width:none!important;}",
            ".mx-auto.max-w-6xl,.mx-auto.max-w-7xl{max-width:none!important;}",
            ".overflow-x-auto{max-width:100%!important;}",
            "table{min-width:max-content;}",
            ".bg-surface-container-lowest:first-child,body>main>section>div:first-child{background:rgba(255,255,255,.72)!important;}",
            "@media(max-width:760px){[data-user-main],body>main{padding:1rem!important;}.cs-page-header{flex-direction:column!important;align-items:flex-start!important;}.grid{min-width:0!important;}}"
        ].join("");
        childDocument.head.appendChild(styleElement);
    }

    /**
     * Resolve current iframe path.
     */
    function ResolveFramePath(frameElement) {
        try {
            const locationObject = frameElement.contentWindow && frameElement.contentWindow.location;
            if (!locationObject) {
                return "";
            }
            return `${locationObject.pathname}${locationObject.search || ""}`;
        } catch (error) {
            return "";
        }
    }

    /**
     * Sync active state for sidebar and topbar.
     */
    function SyncActiveState(targetPath) {
        const normalizedTarget = NormalizeWorkspaceTarget(targetPath);
        SyncCurrentTitle(normalizedTarget);
        const navigationElementList = Array.from(document.querySelectorAll(`[${TARGET_ATTRIBUTE}]`));
        navigationElementList.forEach(function ToggleNavigation(element) {
            const itemTarget = NormalizeWorkspaceTarget(element.getAttribute(TARGET_ATTRIBUTE) || "");
            if (itemTarget && itemTarget === normalizedTarget) {
                element.setAttribute("aria-current", "page");
            } else {
                element.removeAttribute("aria-current");
            }
        });
        SyncTopNavigationState(normalizedTarget);
    }

    /**
     * Sync title in top breadcrumb.
     */
    function SyncCurrentTitle(normalizedTarget) {
        const titleNode = document.querySelector("[data-workspace-current-title]");
        if (!titleNode) {
            return;
        }
        titleNode.textContent = TITLE_BY_PATH[normalizedTarget] || "个人工作台";
    }

    /**
     * Sync top nav state.
     */
    function SyncTopNavigationState(normalizedTarget) {
        const topNavigationList = Array.from(document.querySelectorAll("[data-workspace-top-nav]"));
        topNavigationList.forEach(function ToggleTopNavigation(element) {
            const itemTarget = NormalizeWorkspaceTarget(element.getAttribute(TARGET_ATTRIBUTE) || "");
            if (itemTarget && itemTarget === normalizedTarget) {
                element.setAttribute("aria-current", "page");
            } else {
                element.removeAttribute("aria-current");
            }
        });
    }

    /**
     * Normalize target for matching.
     */
    function NormalizeWorkspaceTarget(targetPath) {
        const safeTarget = ResolveSafeWorkspaceTarget(targetPath);
        if (!safeTarget) {
            return "";
        }
        const splitIndex = safeTarget.indexOf("?");
        const pathname = splitIndex >= 0 ? safeTarget.slice(0, splitIndex) : safeTarget;
        const searchParams = new URLSearchParams(splitIndex >= 0 ? safeTarget.slice(splitIndex + 1) : "");
        searchParams.delete("embedded");
        if (pathname === "/pages/market_listing.html") {
            const viewName = (searchParams.get("view") || "MARKET").toUpperCase();
            if (viewName === "MATERIAL") {
                return "/pages/market_listing.html?view=MATERIAL";
            }
            if (viewName === "FORUM") {
                return "/pages/market_listing.html?view=FORUM";
            }
            return "/pages/market_listing.html";
        }
        return pathname;
    }

    /**
     * Fill lightweight workspace counters without blocking navigation.
     */
    async function RefreshWorkspaceSummary() {
        if (!window.CampusShareApi) {
            return;
        }
        SetWorkspaceNumber("workspace-order-badge", 0);
        SetWorkspaceNumber("workspace-message-badge", 0);
        SetWorkspaceNumber("workspace-notification-badge", 0);
        const requestList = [];
        if (window.CampusShareApi.ListMyProducts) {
            requestList.push(
                window.CampusShareApi.ListMyProducts({ pageNo: 1, pageSize: 1 })
                    .then(function HandleProducts(result) {
                        SetWorkspaceNumber("workspace-product-count", ResolveTotalCount(result));
                    })
                    .catch(function IgnoreProducts() {})
            );
        }
        if (window.CampusShareApi.ListMyMaterials) {
            requestList.push(
                window.CampusShareApi.ListMyMaterials({ pageNo: 1, pageSize: 1 })
                    .then(function HandleMaterials(result) {
                        SetWorkspaceNumber("workspace-material-count", ResolveTotalCount(result));
                    })
                    .catch(function IgnoreMaterials() {})
            );
        }
        if (window.CampusShareApi.ListMyOrders) {
            requestList.push(
                window.CampusShareApi.ListMyOrders(1, 1)
                    .then(function HandleOrders(result) {
                        const totalCount = ResolveTotalCount(result);
                        SetWorkspaceNumber("workspace-order-count", totalCount);
                        SetWorkspaceNumber("workspace-order-badge", totalCount);
                    })
                    .catch(function IgnoreOrders() {})
            );
        }
        if (window.CampusShareApi.ListMyNotifications) {
            requestList.push(
                window.CampusShareApi.ListMyNotifications()
                    .then(function HandleNotifications(result) {
                        const list = ResolveList(result);
                        const unreadCount = list.filter(function CountUnread(item) {
                            return item && item.readFlag !== true && item.readStatus !== true && item.isRead !== true;
                        }).length;
                        SetWorkspaceNumber("workspace-message-badge", unreadCount);
                        SetWorkspaceNumber("workspace-notification-badge", unreadCount);
                    })
                    .catch(function IgnoreNotifications() {})
            );
        }
        if (window.CampusShareApi.GetPointBalance) {
            requestList.push(
                window.CampusShareApi.GetPointBalance()
                    .then(function HandlePoints(result) {
                        const balance = result && result.pointBalance != null
                            ? result.pointBalance
                            : result && result.balance != null
                                ? result.balance
                                : result && result.currentBalance != null
                                    ? result.currentBalance
                                    : result && result.availablePoints != null
                                        ? result.availablePoints
                                        : 0;
                        SetWorkspaceNumber("workspace-point-balance", balance);
                    })
                    .catch(function IgnorePoints() {})
            );
        }
        await Promise.allSettled(requestList);
    }

    function ResolveTotalCount(result) {
        if (!result) {
            return 0;
        }
        if (typeof result.totalCount === "number") {
            return result.totalCount;
        }
        if (typeof result.total === "number") {
            return result.total;
        }
        if (typeof result.count === "number") {
            return result.count;
        }
        const list = ResolveList(result);
        return list.length;
    }

    function ResolveList(result) {
        if (!result) {
            return [];
        }
        if (Array.isArray(result)) {
            return result;
        }
        if (Array.isArray(result.records)) {
            return result.records;
        }
        if (Array.isArray(result.list)) {
            return result.list;
        }
        if (Array.isArray(result.items)) {
            return result.items;
        }
        if (Array.isArray(result.data)) {
            return result.data;
        }
        return [];
    }

    function SetWorkspaceNumber(roleName, value) {
        const numericValue = Number(value);
        const displayValue = Number.isFinite(numericValue) ? numericValue : 0;
        document.querySelectorAll(`[data-role='${roleName}']`).forEach(function SetText(element) {
            element.textContent = String(displayValue);
            if ((roleName === "workspace-order-badge"
                || roleName === "workspace-message-badge"
                || roleName === "workspace-notification-badge")
                && displayValue <= 0) {
                element.style.display = "none";
            } else {
                element.style.display = "";
            }
        });
    }

    /**
     * Validate workspace target.
     */
    function ResolveSafeWorkspaceTarget(targetPath) {
        if (!targetPath || typeof targetPath !== "string") {
            return "";
        }
        const safeTarget = targetPath.trim();
        if (!safeTarget.startsWith("/pages/") || safeTarget.includes("://") || safeTarget.startsWith("//")) {
            return "";
        }
        if (safeTarget.startsWith("/pages/auth_access.html") || safeTarget.startsWith("/pages/user_workspace.html")) {
            return "";
        }
        return safeTarget;
    }

    document.addEventListener("DOMContentLoaded", BindUserWorkspacePage);
})();

