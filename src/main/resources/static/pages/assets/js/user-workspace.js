/**
 * Unified user workspace shell.
 */
(function InitUserWorkspacePage() {
    const DEFAULT_TARGET = "/pages/market_overview.html";
    const ADMINISTRATOR_ROLE = "ADMINISTRATOR";
    const TARGET_ATTRIBUTE = "data-workspace-target";

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
        const roleNode = document.querySelector("[data-role='workspace-role']");
        const avatarNode = document.querySelector("[data-role='workspace-avatar']");
        const displayName = profile && profile.displayName ? String(profile.displayName) : "个人中心";
        if (displayNameNode) {
            displayNameNode.textContent = displayName;
        }
        if (roleNode) {
            roleNode.textContent = profile && profile.userRole === ADMINISTRATOR_ROLE ? "管理员" : "校园认证用户";
        }
        if (avatarNode) {
            avatarNode.textContent = displayName.slice(0, 1) || "用";
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
                NavigateWorkspaceFrame(frameElement, element.getAttribute(TARGET_ATTRIBUTE) || DEFAULT_TARGET);
            });
        });
        const brandButton = document.querySelector("[data-workspace-brand]");
        if (brandButton) {
            brandButton.addEventListener("click", function HandleBrandClick(event) {
                event.preventDefault();
                NavigateWorkspaceFrame(frameElement, DEFAULT_TARGET);
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
                window.location.href = "/pages/admin_dashboard.html";
            });
        }
        const logoutButton = document.querySelector("[data-workspace-logout]");
        if (logoutButton) {
            logoutButton.addEventListener("click", function HandleLogoutClick(event) {
                event.preventDefault();
                window.CampusShareApi.LogoutAndRedirect();
            });
        }
        const helpButton = document.querySelector("[data-workspace-help]");
        if (helpButton) {
            helpButton.addEventListener("click", function HandleHelpClick(event) {
                event.preventDefault();
                NavigateWorkspaceFrame(frameElement, "/pages/notification_center.html");
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
            "html,body{min-height:100%!important;background:#f8fafc!important;}",
            "body>header,[data-user-topbar],[data-user-sidebar],footer{display:none!important;}",
            "body>main{display:block!important;width:100%!important;max-width:none!important;min-height:100vh!important;margin:0!important;padding:2rem!important;}",
            "body>main>aside:first-child{display:none!important;}",
            "body>main>section{width:100%!important;max-width:none!important;}"
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
