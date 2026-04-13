/**
 * CampusShare 页面接口封装
 */
(function InitCampusShareApi() {
    const AUTH_TOKEN_STORAGE_KEY = "campusshare.authToken";
    const USER_PROFILE_STORAGE_KEY = "campusshare.currentUser";
    const REQUEST_ID_HEADER = "X-Request-Id";
    const AUTH_TOKEN_HEADER = "X-Auth-Token";

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

    window.CampusShareApi = {
        GetAuthToken,
        SetAuthToken,
        ClearAuthToken,
        GetCurrentUserProfile,
        SetCurrentUserProfile,
        ClearCurrentUserProfile,
        SetSessionFromLogin,
        ClearSession,
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
        }
    };
})();
