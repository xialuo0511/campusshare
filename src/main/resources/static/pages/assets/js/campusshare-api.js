/**
 * CampusShare 页面接口封装
 */
(function InitCampusShareApi() {
    const AUTH_TOKEN_STORAGE_KEY = "campusshare.authToken";
    const USER_PROFILE_STORAGE_KEY = "campusshare.currentUser";
    const REQUEST_ID_HEADER = "X-Request-Id";
    const AUTH_TOKEN_HEADER = "X-Auth-Token";
    const ADMINISTRATOR_ROLE = "ADMINISTRATOR";

    const PAGE_PATH_MAP = {
        AUTH: "/pages/auth_access.html",
        OVERVIEW: "/pages/market_overview.html",
        LISTING: "/pages/market_listing.html",
        DETAIL: "/pages/market_item_detail.html",
        ORDER: "/pages/order_center.html",
        PUBLISH: "/pages/publish_create.html",
        RECRUITMENT: "/pages/recruitment_board.html",
        ADMIN: "/pages/admin_dashboard.html",
        NAV_INDEX: "/pages/index.html"
    };

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
     * 绑定链接导航
     */
    function BindAnchorNavigation() {
        const anchorList = Array.from(document.querySelectorAll("a"));
        anchorList.forEach(function BindAnchor(anchorElement) {
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
            if (currentHref !== "#" && currentHref !== "" && currentHref !== "javascript:void(0)") {
                return;
            }
            const targetPath = ResolvePathByNavText(text);
            if (!targetPath) {
                return;
            }
            anchorElement.href = targetPath;
        });
    }

    /**
     * 绑定按钮导航
     */
    function BindButtonNavigation() {
        const buttonList = Array.from(document.querySelectorAll("button"));
        buttonList.forEach(function BindButton(buttonElement) {
            const buttonText = buttonElement.textContent ? buttonElement.textContent.trim() : "";
            if (!buttonText) {
                return;
            }
            if ((buttonText.includes("发布") || buttonText.includes("去发布"))
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
     * 绑定图标导航
     */
    function BindIconNavigation() {
        const accountIcon = document.querySelector("[data-icon='account_circle']");
        if (accountIcon && accountIcon.closest("button")) {
            accountIcon.closest("button").addEventListener("click", function HandleAccountClick() {
                const token = GetAuthToken();
                if (!token) {
                    window.location.href = PAGE_PATH_MAP.AUTH;
                    return;
                }
                const profile = GetCurrentUserProfile();
                NavigateToPage(ResolveDefaultHomePathByRole(profile && profile.userRole ? profile.userRole : ""));
            });
        }

        const notificationIcon = document.querySelector("[data-icon='notifications']");
        if (notificationIcon && notificationIcon.closest("button")) {
            notificationIcon.closest("button").addEventListener("click", function HandleNotificationClick() {
                if (!GetAuthToken()) {
                    RedirectToAuthPage(PAGE_PATH_MAP.ORDER);
                    return;
                }
                NavigateToPage(PAGE_PATH_MAP.ORDER);
            });
        }
    }

    /**
     * 绑定全局壳层导航
     */
    function BindGlobalShellNavigation() {
        BindAnchorNavigation();
        BindButtonNavigation();
        BindIconNavigation();
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
        ListPendingTeamRecruitmentApplications() {
            return RequestApi("/api/v1/admin/team/applications/pending", "GET", null, true);
        }
    };

    document.addEventListener("DOMContentLoaded", BindGlobalShellNavigation);
})();
