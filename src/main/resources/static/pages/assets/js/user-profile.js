/**
 * 个人资料页面逻辑
 */
(function InitUserProfilePage() {
    const LEDGER_PREVIEW_SIZE = 6;

    const pageState = {
        profile: null,
        messageTimer: null
    };

    /**
     * 页面入口
     */
    function BindUserProfilePage() {
        if (!window.CampusShareApi) {
            return;
        }

        if (!window.CampusShareApi.GetAuthToken()) {
            window.CampusShareApi.RedirectToAuthPage("/pages/user_profile.html");
            return;
        }

        BindQuickActions();
        BindEditModal();
        BindSellerVerificationAction();

        LoadInitialData();
    }

    /**
     * 加载首屏数据
     */
    async function LoadInitialData() {
        try {
            await Promise.all([
                LoadProfileData(),
                LoadPointLedger(),
                LoadProfileStats()
            ]);
            HideMessage();
        } catch (error) {
            ShowError(error instanceof Error ? error.message : "个人资料加载失败");
        }
    }

    /**
     * 绑定快捷动作
     */
    function BindQuickActions() {
        const logoutButton = GetElementByAction("logout");
        if (logoutButton) {
            logoutButton.addEventListener("click", async function HandleLogout() {
                logoutButton.disabled = true;
                try {
                    if (window.CampusShareApi.LogoutUser) {
                        await window.CampusShareApi.LogoutUser();
                    }
                } catch (error) {
                    // 登出失败不阻塞本地清理
                } finally {
                    if (window.CampusShareApi.ClearSession) {
                        window.CampusShareApi.ClearSession();
                    }
                    window.location.href = "/pages/auth_access.html";
                }
            });
        }
    }

    /**
     * 加载用户资料
     */
    async function LoadProfileData() {
        const profileResult = await window.CampusShareApi.SyncSessionProfile();
        if (!profileResult || !profileResult.userId) {
            throw new Error("用户信息获取失败");
        }

        pageState.profile = profileResult;
        RenderProfile(profileResult);
        FillProfileForm(profileResult);
        await RefreshSellerVerificationState(profileResult);
    }

    /**
     * 渲染资料
     */
    function RenderProfile(profile) {
        const displayName = String(profile.displayName || profile.account || "未命名用户");
        const account = String(profile.account || "-");
        const roleText = ResolveUserRoleText(profile.userRole);
        const statusText = ResolveUserStatusText(profile.userStatus);

        SetText("display-name", displayName);
        SetText("account", account);
        SetText("role-text", roleText);
        SetText("status-text", statusText);
        SetText("email", profile.email || profile.contact || "未设置");
        SetText("phone", profile.phone || "未设置");
        SetText("college", profile.college || "未设置");
        SetText("grade", profile.grade || "未设置");
        SetText("last-login-time", FormatTime(profile.lastLoginTime));

        const initialsNode = GetElementByRole("avatar-initials");
        if (initialsNode) {
            initialsNode.textContent = ResolveInitials(displayName);
        }

        if (profile.pointBalance !== undefined && profile.pointBalance !== null) {
            SetText("point-balance", String(profile.pointBalance));
        }
    }

    /**
     * 加载积分流水
     */
    async function LoadPointLedger() {
        const ledgerResult = await window.CampusShareApi.ListPointLedger(1, LEDGER_PREVIEW_SIZE);
        if (ledgerResult && ledgerResult.availablePoints !== undefined && ledgerResult.availablePoints !== null) {
            SetText("point-balance", String(ledgerResult.availablePoints));
        }

        const listContainer = GetElementByRole("ledger-list");
        if (!listContainer) {
            return;
        }

        const transactionList = Array.isArray(ledgerResult && ledgerResult.transactionList)
            ? ledgerResult.transactionList
            : [];

        if (!transactionList.length) {
            listContainer.innerHTML = "<div class=\"rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500\">暂无积分流水</div>";
            return;
        }

        listContainer.innerHTML = transactionList.map(function BuildLedgerItem(transactionItem) {
            const changeAmount = Number(transactionItem.changeAmount || 0);
            const positive = changeAmount >= 0;
            const amountClass = positive ? "text-emerald-600" : "text-rose-600";
            const iconName = positive ? "add_circle" : "remove_circle";
            const amountText = positive ? `+${changeAmount}` : `${changeAmount}`;
            const remarkText = transactionItem.transactionRemark || ResolveTransactionTypeText(transactionItem.transactionType);
            return [
                "<div class=\"flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3\">",
                "<div class=\"min-w-0\">",
                `<p class=\"truncate text-sm font-semibold text-slate-800\">${EscapeHtml(remarkText)}</p>`,
                `<p class=\"mt-1 text-xs text-slate-500\">${EscapeHtml(FormatTime(transactionItem.transactionTime))}</p>`,
                "</div>",
                `<div class=\"ml-4 flex items-center gap-2 ${amountClass}\"><span class=\"material-symbols-outlined text-base\">${iconName}</span><span class=\"text-sm font-bold\">${EscapeHtml(amountText)}</span></div>`,
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 加载统计数据
     */
    async function LoadProfileStats() {
        const resultList = await Promise.all([
            window.CampusShareApi.ListMyProducts({ pageNo: 1, pageSize: 1 }),
            window.CampusShareApi.ListMyMaterials({ pageNo: 1, pageSize: 1 })
        ]);

        const productCount = Number(resultList[0] && resultList[0].totalCount ? resultList[0].totalCount : 0);
        const materialCount = Number(resultList[1] && resultList[1].totalCount ? resultList[1].totalCount : 0);

        SetText("product-count", String(productCount));
        SetText("material-count", String(materialCount));
    }

    /**
     * 绑定资料编辑弹窗
     */
    function BindEditModal() {
        const modal = GetElementByRole("profile-edit-modal");
        const openButton = GetElementByAction("open-edit");
        const closeButton = GetElementByAction("close-edit");
        const cancelButton = GetElementByAction("cancel-edit");
        const overlay = GetElementByRole("modal-overlay");
        const form = GetElementByRole("profile-edit-form");

        if (!modal || !openButton || !form) {
            return;
        }

        function OpenModal() {
            modal.classList.remove("hidden");
            modal.classList.add("flex");
        }

        function CloseModal() {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
        }

        openButton.addEventListener("click", function HandleOpenModal() {
            FillProfileForm(pageState.profile);
            OpenModal();
        });

        if (closeButton) {
            closeButton.addEventListener("click", CloseModal);
        }
        if (cancelButton) {
            cancelButton.addEventListener("click", CloseModal);
        }
        if (overlay) {
            overlay.addEventListener("click", CloseModal);
        }

        form.addEventListener("submit", async function HandleSubmit(event) {
            event.preventDefault();

            const payload = {
                displayName: ReadFormField("displayName"),
                college: ReadFormField("college"),
                grade: ReadFormField("grade"),
                phone: ReadFormField("phone"),
                email: ReadFormField("email")
            };

            if (!payload.displayName) {
                ShowError("昵称不能为空");
                return;
            }
            if (!payload.college) {
                ShowError("学院不能为空");
                return;
            }
            if (!payload.grade) {
                ShowError("年级不能为空");
                return;
            }

            const submitButton = form.querySelector("button[type='submit']");
            if (submitButton) {
                submitButton.disabled = true;
            }

            try {
                await window.CampusShareApi.UpdateMyProfile(payload);
                ShowSuccess("资料保存成功");
                CloseModal();
                await LoadProfileData();
            } catch (error) {
                ShowError(error instanceof Error ? error.message : "资料保存失败");
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        });
    }

    /**
     * 绑定卖家认证
     */
    function BindSellerVerificationAction() {
        const verifyButton = GetElementByAction("seller-verify");
        if (!verifyButton || !window.CampusShareApi.ApplySellerVerification) {
            return;
        }

        verifyButton.addEventListener("click", async function HandleSellerVerifyApply() {
            verifyButton.disabled = true;
            try {
                const latestProfile = await ResolveCurrentProfile();
                const payload = {
                    realName: String((latestProfile && latestProfile.displayName) || "").trim() || "未命名用户",
                    contactPhone: String((latestProfile && latestProfile.phone) || "").trim(),
                    qualificationDesc: "申请开通认证卖家权限",
                    credentialFileIds: []
                };
                await window.CampusShareApi.ApplySellerVerification(payload);
                ShowSuccess("认证申请已提交，请等待管理员审核");
            } catch (error) {
                ShowError(error instanceof Error ? error.message : "认证申请提交失败");
            } finally {
                const refreshedProfile = await ResolveCurrentProfile();
                await RefreshSellerVerificationState(refreshedProfile);
            }
        });
    }

    /**
     * 刷新卖家认证状态
     */
    async function RefreshSellerVerificationState(profile) {
        const verifyButton = GetElementByAction("seller-verify");
        const statusNode = GetElementByRole("seller-verify-status");
        if (!verifyButton || !statusNode || !window.CampusShareApi) {
            return;
        }

        const currentUserRole = profile && profile.userRole ? String(profile.userRole) : "";
        if (currentUserRole === "VERIFIED_SELLER" || currentUserRole === "ADMINISTRATOR") {
            verifyButton.disabled = true;
            verifyButton.classList.add("opacity-60", "cursor-not-allowed");
            verifyButton.textContent = "已完成认证";
            statusNode.textContent = "当前账号已具备卖家发布权限";
            return;
        }

        try {
            const latestApplication = await window.CampusShareApi.GetMyLatestSellerVerification();
            const applicationStatus = latestApplication && latestApplication.applicationStatus
                ? String(latestApplication.applicationStatus)
                : "";

            if (applicationStatus === "PENDING_REVIEW") {
                verifyButton.disabled = true;
                verifyButton.classList.add("opacity-60", "cursor-not-allowed");
                verifyButton.textContent = "审核中";
                statusNode.textContent = "认证申请审核中，请耐心等待";
                return;
            }
            if (applicationStatus === "APPROVED") {
                verifyButton.disabled = true;
                verifyButton.classList.add("opacity-60", "cursor-not-allowed");
                verifyButton.textContent = "已完成认证";
                statusNode.textContent = "认证审核已通过";
                return;
            }
            if (applicationStatus === "REJECTED") {
                verifyButton.disabled = false;
                verifyButton.classList.remove("opacity-60", "cursor-not-allowed");
                verifyButton.textContent = "重新申请认证";
                statusNode.textContent = "认证申请已驳回，可修改信息后重新提交";
                return;
            }
        } catch (error) {
            // 无历史申请时忽略
        }

        verifyButton.disabled = false;
        verifyButton.classList.remove("opacity-60", "cursor-not-allowed");
        verifyButton.textContent = "申请认证卖家";
        statusNode.textContent = "未发起认证申请";
    }

    /**
     * 同步并返回当前用户
     */
    async function ResolveCurrentProfile() {
        if (!window.CampusShareApi) {
            return null;
        }
        try {
            const syncedProfile = await window.CampusShareApi.SyncSessionProfile();
            if (syncedProfile && syncedProfile.userId) {
                pageState.profile = syncedProfile;
                return syncedProfile;
            }
        } catch (error) {
            // 会话同步失败时回退本地缓存
        }

        const localProfile = window.CampusShareApi.GetCurrentUserProfile
            ? window.CampusShareApi.GetCurrentUserProfile()
            : null;
        return localProfile || null;
    }

    /**
     * 回填编辑表单
     */
    function FillProfileForm(profile) {
        const safeProfile = profile || {};
        WriteFormField("displayName", safeProfile.displayName || safeProfile.account || "");
        WriteFormField("college", safeProfile.college || "");
        WriteFormField("grade", safeProfile.grade || "");
        WriteFormField("phone", safeProfile.phone || "");
        WriteFormField("email", safeProfile.email || safeProfile.contact || "");
    }

    /**
     * 读取表单字段
     */
    function ReadFormField(fieldName) {
        const input = document.querySelector(`[data-field='${fieldName}']`);
        return input ? String(input.value || "").trim() : "";
    }

    /**
     * 写入表单字段
     */
    function WriteFormField(fieldName, value) {
        const input = document.querySelector(`[data-field='${fieldName}']`);
        if (input) {
            input.value = String(value || "");
        }
    }

    /**
     * 获取动作节点
     */
    function GetElementByAction(actionName) {
        return document.querySelector(`[data-action='${actionName}']`);
    }

    /**
     * 获取角色节点
     */
    function GetElementByRole(roleName) {
        return document.querySelector(`[data-role='${roleName}']`);
    }

    /**
     * 设置文案
     */
    function SetText(roleName, text) {
        const node = GetElementByRole(roleName);
        if (node) {
            node.textContent = text == null ? "" : String(text);
        }
    }

    /**
     * 用户角色文案
     */
    function ResolveUserRoleText(userRole) {
        const role = String(userRole || "").toUpperCase();
        if (role === "ADMINISTRATOR") {
            return "管理员";
        }
        if (role === "VERIFIED_SELLER") {
            return "认证卖家";
        }
        if (role === "STUDENT") {
            return "学生";
        }
        if (role === "VISITOR") {
            return "访客";
        }
        return "普通用户";
    }

    /**
     * 用户状态文案
     */
    function ResolveUserStatusText(userStatus) {
        const status = String(userStatus || "").toUpperCase();
        if (status === "ACTIVE") {
            return "正常";
        }
        if (status === "PENDING_REVIEW") {
            return "待审核";
        }
        if (status === "FROZEN") {
            return "已冻结";
        }
        if (status === "REJECTED") {
            return "已驳回";
        }
        return "未知";
    }

    /**
     * 流水类型文案
     */
    function ResolveTransactionTypeText(transactionType) {
        const normalizedType = String(transactionType || "").toUpperCase();
        if (normalizedType === "UPLOAD_REWARD") {
            return "资料上传奖励";
        }
        if (normalizedType === "DOWNLOAD_COST") {
            return "资料下载扣减";
        }
        if (normalizedType === "SYSTEM_COMPENSATE") {
            return "系统补偿";
        }
        if (normalizedType === "MANUAL_ADJUST") {
            return "人工调整";
        }
        return "积分变动";
    }

    /**
     * 时间格式化
     */
    function FormatTime(timeText) {
        if (!timeText) {
            return "-";
        }
        const timeValue = new Date(timeText);
        if (Number.isNaN(timeValue.getTime())) {
            return String(timeText);
        }
        const year = timeValue.getFullYear();
        const month = String(timeValue.getMonth() + 1).padStart(2, "0");
        const day = String(timeValue.getDate()).padStart(2, "0");
        const hour = String(timeValue.getHours()).padStart(2, "0");
        const minute = String(timeValue.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hour}:${minute}`;
    }

    /**
     * 首字母头像
     */
    function ResolveInitials(displayName) {
        const text = String(displayName || "").trim();
        if (!text) {
            return "--";
        }
        const charList = text.replace(/\s+/g, "").slice(0, 2);
        return charList.toUpperCase();
    }

    /**
     * HTML 转义
     */
    function EscapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * 显示成功消息
     */
    function ShowSuccess(message) {
        ShowMessage("success", message);
    }

    /**
     * 显示错误消息
     */
    function ShowError(message) {
        ShowMessage("error", message);
    }

    /**
     * 显示消息
     */
    function ShowMessage(messageType, messageText) {
        const bar = GetElementByRole("message-bar");
        if (!bar) {
            return;
        }

        if (pageState.messageTimer) {
            window.clearTimeout(pageState.messageTimer);
            pageState.messageTimer = null;
        }

        const safeText = String(messageText || "").trim() || "操作完成";
        bar.textContent = safeText;
        bar.classList.remove("hidden", "border-emerald-200", "bg-emerald-50", "text-emerald-700", "border-rose-200", "bg-rose-50", "text-rose-700");
        if (messageType === "success") {
            bar.classList.add("border", "border-emerald-200", "bg-emerald-50", "text-emerald-700");
        } else {
            bar.classList.add("border", "border-rose-200", "bg-rose-50", "text-rose-700");
        }

        pageState.messageTimer = window.setTimeout(function HideMessageLater() {
            HideMessage();
        }, 3500);
    }

    /**
     * 隐藏消息
     */
    function HideMessage() {
        const bar = GetElementByRole("message-bar");
        if (!bar) {
            return;
        }
        bar.classList.add("hidden");
        bar.textContent = "";
        if (pageState.messageTimer) {
            window.clearTimeout(pageState.messageTimer);
            pageState.messageTimer = null;
        }
    }

    document.addEventListener("DOMContentLoaded", BindUserProfilePage);
})();
