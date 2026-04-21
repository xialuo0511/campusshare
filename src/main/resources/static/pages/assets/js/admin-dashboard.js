/**
 * 绠＄悊鍚庡彴椤甸潰閫昏緫
 */
(function InitAdminDashboardPage() {
    const DEFAULT_ORDER_PAGE_SIZE = 10;
    const DEFAULT_TASK_PAGE_SIZE = 8;
    const DEFAULT_PENDING_MATERIAL_FETCH_SIZE = 50;
    const DEFAULT_PENDING_PRODUCT_FETCH_SIZE = 50;
    const RULE_DESCRIPTION_TEXT_MAP = {
        MATERIAL_REVIEW_REQUIRED: "资料上传后是否进入审核，true 需管理员审核",
        PRODUCT_REVIEW_REQUIRED: "商品发布后是否进入审核，true 需管理员审核",
        TEAM_RECRUITMENT_REVIEW_REQUIRED: "组队招募发布后是否进入审核",
        MATERIAL_UPLOAD_REWARD_POINTS: "资料审核通过后奖励的积分值",
        MATERIAL_DOWNLOAD_COST_POINTS: "下载一份资料扣减的积分值",
        MATERIAL_FILE_MAX_SIZE_MB: "资料上传允许的单文件最大大小（MB）",
        MATERIAL_FILE_ALLOWED_EXTENSIONS: "资料上传允许的文件扩展名，逗号分隔",
        ORDER_AUTO_CLOSE_ENABLED: "是否启用订单超时自动关闭任务",
        ORDER_PENDING_SELLER_CONFIRM_TIMEOUT_MINUTES: "待卖家确认的超时分钟数",
        ORDER_PENDING_BUYER_CONFIRM_TIMEOUT_MINUTES: "待买家确认的超时分钟数",
        ORDER_AUTO_CLOSE_BATCH_SIZE: "每轮自动关单处理数量上限",
        MAIL_NOTIFICATION_ENABLED: "是否启用邮件通知派发",
        MAIL_NOTIFICATION_MAX_RETRY: "邮件发送失败后的最大重试次数",
        MAIL_NOTIFICATION_RETRY_INTERVAL_MINUTES: "邮件失败重试间隔（分钟）",
        MAIL_NOTIFICATION_BATCH_SIZE: "每轮邮件派发任务的批量大小",
        MAIL_NOTIFICATION_TYPE_SCOPE: "允许发送邮件的通知类型列表",
        CONTENT_SENSITIVE_WORDS: "敏感词词库，逗号分隔",
        CONTENT_SENSITIVE_STRICT_MODE: "敏感词拦截模式，true 为严格模式"
    };

    /**
     * 缁戝畾椤甸潰琛屼负
     */
    async function BindAdminDashboardPage() {
        const pageHeader = document.querySelector("main[data-admin-main] > header") || document.querySelector("main > header");
        const statCardList = document.querySelectorAll("[data-admin-section='stats'] > div");
        const reviewPanel = document.querySelector("[data-admin-review-panel]")
            || document.querySelector("section.lg\\:col-span-2.bg-surface-container-lowest");
        const reviewTableBody = reviewPanel
            ? (reviewPanel.querySelector("[data-admin-review-table-body]") || reviewPanel.querySelector("table tbody.divide-y"))
            : null;
        const activityPanel = document.querySelector("[data-admin-activity-panel]");
        if (!pageHeader) {
            return;
        }

        const messageBar = CreateMessageBar(pageHeader);
        const governanceWorkspace = CreateGovernanceWorkspace();
        const mainElement = document.querySelector("main[data-admin-main]") || document.querySelector("main");
        const statsSection = document.querySelector("[data-admin-section='stats']");
        const workbenchSection = document.querySelector("[data-admin-section='workbench']");
        const adminNavItemList = Array.from(document.querySelectorAll("aside [data-admin-nav]"));
        const settingsPanel = CreateAdminSettingsPanel(mainElement);
        const adminSubviewContext = {
            pageHeader,
            statsSection,
            workbenchSection,
            governanceWorkspace,
            settingsPanel
        };
        BindAdminSubviewNavigation(adminNavItemList, adminSubviewContext, messageBar);
        BindAdminProfileForm(settingsPanel, messageBar);
        if (!window.CampusShareApi) {
            ShowError(messageBar, "后台脚本加载失败，请刷新页面后重试");
            return;
        }
        const hasToken = !!window.CampusShareApi.GetAuthToken();
        const hasAdminAccess = await window.CampusShareApi.EnsureAdminSession();
        if (!hasAdminAccess && !hasToken) {
            ShowError(messageBar, "请先登录管理员账号后再访问后台");
            window.setTimeout(function RedirectToAuthPage() {
                if (window.CampusShareApi.RedirectToAuthPage) {
                    window.CampusShareApi.RedirectToAuthPage("/pages/admin_dashboard.html");
                    return;
                }
                window.location.href = "/pages/auth_access.html?redirect=%2Fpages%2Fadmin_dashboard.html";
            }, 700);
            return;
        }
        if (!hasAdminAccess) {
            ShowError(messageBar, "当前账号不是管理员，无法访问后台");
            window.setTimeout(function RedirectToOverviewPage() {
                window.location.href = "/pages/market_overview.html";
            }, 900);
            return;
        }

        const reviewState = {
            taskTypeFilter: "ALL",
            keyword: "",
            pageNo: 1,
            pageSize: DEFAULT_TASK_PAGE_SIZE,
            reviewTaskList: []
        };

        let taskPager = null;
        if (reviewPanel && reviewTableBody) {
            const taskToolbar = CreateTaskToolbar(reviewPanel);
            taskPager = CreateTaskPager(reviewPanel);
            BindTaskToolbarActions(taskToolbar, reviewState, function HandleToolbarChange() {
                RenderReviewTableByState(reviewTableBody, reviewState, taskPager);
            });
            BindTaskPagerActions(taskPager, reviewState, function HandlePageChange() {
                RenderReviewTableByState(reviewTableBody, reviewState, taskPager);
            });

            BindReviewTableActions(
                reviewTableBody,
                statCardList,
                reviewState,
                taskPager,
                messageBar,
                governanceWorkspace,
                activityPanel
            );
        } else {
            console.warn("[AdminDashboard] review panel missing, skip review table bindings");
        }
        BindGovernanceWorkspaceActions(governanceWorkspace, messageBar, function ReloadDashboardData() {
            return LoadDashboardData(
                statCardList,
                reviewTableBody,
                reviewState,
                taskPager,
                messageBar,
                governanceWorkspace,
                activityPanel
            );
        });
        LoadDashboardData(
            statCardList,
            reviewTableBody,
            reviewState,
            taskPager,
            messageBar,
            governanceWorkspace,
            activityPanel
        );
    }

    /**
     * 鍔犺浇鍚庡彴鏁版嵁
     */
    async function LoadDashboardData(
        statCardList,
        reviewTableBody,
        reviewState,
        taskPager,
        messageBar,
        governanceWorkspace,
        activityPanel
    ) {
        try {
            const requestNameList = [
                "GetAdminDashboardSummary",
                "GetMarketOverview",
                "ListTeamRecruitments",
                "ListPendingReports",
                "ListPendingUsers",
                "ListPendingTeamRecruitmentApplications",
                "ListPendingTeamRecruitmentsByAdmin",
                "ListPendingMaterials",
                "ListPendingProductsByAdmin",
                "ListOrdersByAdmin",
                "ListSystemRulesByAdmin",
                "ListProductsByAdmin",
                "ListOrdersByAdminForGovernance",
                "ListAuditLogsByAdmin",
                "GetAdminOpsSummary"
            ];
            const settledResultList = await Promise.allSettled([
                window.CampusShareApi.GetAdminDashboardSummary(),
                window.CampusShareApi.GetMarketOverview(),
                window.CampusShareApi.ListTeamRecruitments({ pageNo: 1, pageSize: 1 }),
                window.CampusShareApi.ListPendingReports(),
                window.CampusShareApi.ListPendingUsers(),
                window.CampusShareApi.ListPendingTeamRecruitmentApplications(),
                window.CampusShareApi.ListPendingTeamRecruitmentsByAdmin(1, DEFAULT_PENDING_PRODUCT_FETCH_SIZE),
                window.CampusShareApi.ListPendingMaterials(1, DEFAULT_PENDING_MATERIAL_FETCH_SIZE),
                window.CampusShareApi.ListPendingProductsByAdmin(1, DEFAULT_PENDING_PRODUCT_FETCH_SIZE),
                window.CampusShareApi.ListOrdersByAdmin(1, DEFAULT_ORDER_PAGE_SIZE, "ALL"),
                window.CampusShareApi.ListSystemRulesByAdmin(),
                window.CampusShareApi.ListProductsByAdmin({ pageNo: 1, pageSize: 6 }),
                window.CampusShareApi.ListOrdersByAdmin(1, 6, "ALL"),
                window.CampusShareApi.ListAuditLogsByAdmin({ pageNo: 1, pageSize: 8 }),
                window.CampusShareApi.GetAdminOpsSummary()
            ]);

            settledResultList.forEach(function LogRejectedRequest(settledResult, index) {
                if (settledResult.status !== "rejected") {
                    return;
                }
                console.warn(`[AdminDashboard] ${requestNameList[index]} failed`, settledResult.reason);
            });

            const dashboardSummary = ResolveSettledValue(settledResultList[0], {});
            const marketOverview = ResolveSettledValue(settledResultList[1], {});
            const teamRecruitmentList = ResolveSettledValue(settledResultList[2], { totalCount: 0 });
            const pendingReportList = ResolveSettledValue(settledResultList[3], []);
            const pendingUserList = ResolveSettledValue(settledResultList[4], []);
            const pendingTeamApplicationList = ResolveSettledValue(settledResultList[5], []);
            const pendingTeamRecruitmentListResult = ResolveSettledValue(
                settledResultList[6],
                { recruitmentList: [], totalCount: 0 }
            );
            const pendingMaterialListResult = ResolveSettledValue(
                settledResultList[7],
                { materialList: [], totalCount: 0 }
            );
            const pendingProductListResult = ResolveSettledValue(
                settledResultList[8],
                { productList: [], totalCount: 0 }
            );
            const orderListResult = ResolveSettledValue(
                settledResultList[9],
                { orderList: [], totalCount: 0, ongoingCount: 0, completedCount: 0 }
            );
            const ruleConfigList = ResolveSettledValue(settledResultList[10], []);
            const productListResult = ResolveSettledValue(settledResultList[11], { productList: [], totalCount: 0 });
            const adminOrderListResult = ResolveSettledValue(settledResultList[12], { orderList: [], totalCount: 0 });
            const auditLogListResult = ResolveSettledValue(settledResultList[13], { auditLogList: [], totalCount: 0 });
            const opsSummary = ResolveSettledValue(settledResultList[14], {});

            if (statCardList && statCardList.length >= 3) {
                RenderStats(
                    statCardList,
                    dashboardSummary,
                    marketOverview,
                    teamRecruitmentList,
                    pendingReportList,
                    orderListResult
                );
            }
            RenderActivityPanel(activityPanel, dashboardSummary, marketOverview, orderListResult, pendingReportList);
            RenderGovernanceWorkspace(
                governanceWorkspace,
                dashboardSummary,
                ruleConfigList,
                productListResult,
                adminOrderListResult,
                auditLogListResult,
                opsSummary
            );

            if (reviewTableBody && reviewState && taskPager) {
                reviewState.reviewTaskList = BuildReviewTaskList(
                    pendingReportList,
                    pendingUserList,
                    pendingTeamApplicationList,
                    pendingTeamRecruitmentListResult,
                    pendingMaterialListResult,
                    pendingProductListResult
                );
                reviewState.pageNo = 1;
                RenderReviewTableByState(reviewTableBody, reviewState, taskPager);
            }
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "后台数据加载失败");
        }
    }

    function ResolveSettledValue(settledResult, fallbackValue) {
        if (settledResult && settledResult.status === "fulfilled") {
            return settledResult.value;
        }
        return fallbackValue;
    }

    /**
     * 娓叉煋缁熻鍗＄墖
     */
    function CreateAdminSettingsPanel(mainElement) {
        if (!mainElement) {
            return null;
        }
        let settingsPanel = mainElement.querySelector("[data-admin-section='profile']");
        if (settingsPanel) {
            return settingsPanel;
        }
        settingsPanel = document.createElement("section");
        settingsPanel.className = "hidden bg-surface-container-lowest rounded-xl shadow-sm ring-1 ring-outline-variant/10 p-8 mb-8";
        settingsPanel.setAttribute("data-admin-section", "profile");
        settingsPanel.innerHTML = [
            "<div class=\"mb-8\">",
            "<h2 class=\"text-2xl font-bold text-on-surface\">\u4e2a\u4eba\u8bbe\u7f6e</h2>",
            "<p class=\"text-sm text-slate-500 mt-1\">\u7ba1\u7406\u5458\u8d44\u6599\u4e0e\u8054\u7cfb\u4fe1\u606f</p>",
            "</div>",
            "<form data-admin-profile-form class=\"space-y-6\">",
            "<div class=\"grid grid-cols-1 md:grid-cols-2 gap-6\">",
            "<label class=\"block\"><span class=\"text-sm font-semibold text-on-surface\">\u6635\u79f0</span><input data-admin-profile-field=\"displayName\" class=\"mt-2 w-full rounded-lg border border-outline-variant/40 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20\" placeholder=\"\u8bf7\u8f93\u5165\u6635\u79f0\" type=\"text\"/></label>",
            "<label class=\"block\"><span class=\"text-sm font-semibold text-on-surface\">\u90ae\u7bb1</span><input data-admin-profile-field=\"contact\" class=\"mt-2 w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-sm text-slate-500\" placeholder=\"\u90ae\u7bb1\u5730\u5740\" type=\"text\" readonly/></label>",
            "<label class=\"block\"><span class=\"text-sm font-semibold text-on-surface\">\u5b66\u53f7</span><input data-admin-profile-field=\"account\" class=\"mt-2 w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-sm text-slate-500\" placeholder=\"\u5b66\u53f7\" type=\"text\" readonly/></label>",
            "<label class=\"block\"><span class=\"text-sm font-semibold text-on-surface\">\u5b66\u9662</span><input data-admin-profile-field=\"college\" class=\"mt-2 w-full rounded-lg border border-outline-variant/40 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20\" placeholder=\"\u8bf7\u8f93\u5165\u5b66\u9662\" type=\"text\"/></label>",
            "<label class=\"block\"><span class=\"text-sm font-semibold text-on-surface\">\u5e74\u7ea7</span><input data-admin-profile-field=\"grade\" class=\"mt-2 w-full rounded-lg border border-outline-variant/40 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20\" placeholder=\"\u8bf7\u8f93\u5165\u5e74\u7ea7\" type=\"text\"/></label>",
            "</div>",
            "<div class=\"flex items-center gap-3\">",
            "<button type=\"submit\" data-admin-profile-action=\"save\" class=\"px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90\">\u4fdd\u5b58\u8bbe\u7f6e</button>",
            "<button type=\"button\" data-admin-profile-action=\"reset\" class=\"px-5 py-2.5 rounded-lg border border-outline-variant/40 text-sm font-semibold text-slate-600 hover:bg-surface-container\">\u91cd\u7f6e</button>",
            "</div>",
            "</form>"
        ].join("");
        const statsSection = mainElement.querySelector("[data-admin-section='stats']");
        if (statsSection) {
            statsSection.insertAdjacentElement("beforebegin", settingsPanel);
        } else {
            mainElement.appendChild(settingsPanel);
        }
        return settingsPanel;
    }

    function BindAdminSubviewNavigation(adminNavItemList, context, messageBar) {
        if (!Array.isArray(adminNavItemList) || adminNavItemList.length === 0) {
            return;
        }
        const initialNavItem = adminNavItemList.find(function FindActive(item) {
            return item.classList.contains("translate-x-1");
        }) || adminNavItemList[0];
        const initialViewKey = initialNavItem.getAttribute("data-admin-nav") || "DASHBOARD";
        ApplyAdminNavState(adminNavItemList, initialViewKey);
        SwitchAdminSubview(context, initialViewKey);
        if (initialViewKey === "PROFILE") {
            LoadAdminProfileFormData(context.settingsPanel, messageBar);
        }

        adminNavItemList.forEach(function BindNavItem(item) {
            item.addEventListener("click", function HandleClick(event) {
                event.preventDefault();
                const viewKey = item.getAttribute("data-admin-nav") || "DASHBOARD";
                ApplyAdminNavState(adminNavItemList, viewKey);
                SwitchAdminSubview(context, viewKey);
                if (viewKey === "PROFILE") {
                    LoadAdminProfileFormData(context.settingsPanel, messageBar);
                }
            });
        });
    }

    function ApplyAdminNavState(adminNavItemList, activeViewKey) {
        const activeClassList = [
            "bg-[#ffffff]",
            "dark:bg-slate-800",
            "text-[#005d90]",
            "dark:text-sky-400",
            "font-semibold",
            "rounded-md",
            "shadow-sm",
            "translate-x-1"
        ];
        const inactiveClassList = [
            "text-slate-600",
            "dark:text-slate-400",
            "hover:bg-[#edeeef]",
            "dark:hover:bg-slate-800/50"
        ];
        adminNavItemList.forEach(function ToggleNavItem(item) {
            const isActive = (item.getAttribute("data-admin-nav") || "") === activeViewKey;
            if (isActive) {
                item.classList.remove.apply(item.classList, inactiveClassList);
                item.classList.add.apply(item.classList, activeClassList);
                item.setAttribute("aria-current", "page");
                return;
            }
            item.classList.remove.apply(item.classList, activeClassList);
            item.classList.add.apply(item.classList, inactiveClassList);
            item.removeAttribute("aria-current");
        });
    }

    function SwitchAdminSubview(context, viewKey) {
        const headerNode = context && context.pageHeader ? context.pageHeader : null;
        const statsSection = context && context.statsSection ? context.statsSection : null;
        const workbenchSection = context && context.workbenchSection ? context.workbenchSection : null;
        const governanceSection = context && context.governanceWorkspace ? context.governanceWorkspace.wrapper : null;
        const profileSection = context && context.settingsPanel ? context.settingsPanel : null;
        const titleNode = headerNode ? headerNode.querySelector("h1") : null;
        const subtitleNode = headerNode ? headerNode.querySelector("p") : null;

        const viewMetaMap = {
            DASHBOARD: {
                title: "\u673a\u6784\u6982\u89c8",
                subtitle: "\u5b9e\u65f6\u5e73\u53f0\u6d3b\u52a8\u548c\u7ba1\u7406\u5de5\u4f5c\u53f0",
                showStats: true,
                showWorkbench: true,
                showGovernance: true,
                showProfile: false
            },
            MANAGEMENT: {
                title: "\u6cbb\u7406\u7ba1\u7406",
                subtitle: "\u96c6\u4e2d\u5904\u7406\u89c4\u5219\u3001\u5546\u54c1\u3001\u8ba2\u5355\u4e0e\u5ba1\u8ba1",
                showStats: false,
                showWorkbench: false,
                showGovernance: true,
                showProfile: false
            },
            ORDER_LIST: {
                title: "\u8ba2\u5355\u5217\u8868",
                subtitle: "\u67e5\u770b\u5e76\u6cbb\u7406\u5e73\u53f0\u8ba2\u5355\u72b6\u6001",
                showStats: false,
                showWorkbench: false,
                showGovernance: true,
                showProfile: false
            },
            WORKBENCH: {
                title: "\u5de5\u4f5c\u53f0",
                subtitle: "\u5904\u7406\u5f85\u5ba1\u6838\u4efb\u52a1\u4e0e\u98ce\u9669\u4e8b\u9879",
                showStats: false,
                showWorkbench: true,
                showGovernance: false,
                showProfile: false
            },
            ANALYTICS: {
                title: "\u6570\u636e\u5206\u6790",
                subtitle: "\u67e5\u770b\u5e73\u53f0\u6982\u89c8\u4e0e\u8d8b\u52bf\u53d8\u5316",
                showStats: true,
                showWorkbench: true,
                showGovernance: false,
                showProfile: false
            },
            PROFILE: {
                title: "\u4e2a\u4eba\u8bbe\u7f6e",
                subtitle: "\u7ef4\u62a4\u7ba1\u7406\u5458\u4e2a\u4eba\u8d44\u6599",
                showStats: false,
                showWorkbench: false,
                showGovernance: false,
                showProfile: true
            }
        };
        const viewMeta = viewMetaMap[viewKey] || viewMetaMap.DASHBOARD;
        if (titleNode) {
            titleNode.textContent = viewMeta.title;
        }
        if (subtitleNode) {
            subtitleNode.textContent = viewMeta.subtitle;
        }
        if (statsSection) {
            statsSection.classList.toggle("hidden", !viewMeta.showStats);
        }
        if (workbenchSection) {
            workbenchSection.classList.toggle("hidden", !viewMeta.showWorkbench);
        }
        if (governanceSection) {
            governanceSection.classList.toggle("hidden", !viewMeta.showGovernance);
        }
        if (profileSection) {
            profileSection.classList.toggle("hidden", !viewMeta.showProfile);
        }
    }

    function BindAdminProfileForm(settingsPanel, messageBar) {
        if (!settingsPanel) {
            return;
        }
        const profileForm = settingsPanel.querySelector("[data-admin-profile-form]");
        if (!profileForm || profileForm.dataset.bound === "true") {
            return;
        }
        profileForm.dataset.bound = "true";
        profileForm.addEventListener("submit", async function HandleSubmit(event) {
            event.preventDefault();
            const displayName = ReadAdminProfileField(profileForm, "displayName");
            const college = ReadAdminProfileField(profileForm, "college");
            const grade = ReadAdminProfileField(profileForm, "grade");
            const contact = ReadAdminProfileField(profileForm, "contact");
            const account = ReadAdminProfileField(profileForm, "account");
            if (!displayName) {
                ShowError(messageBar, "\u6635\u79f0\u4e0d\u80fd\u4e3a\u7a7a");
                return;
            }

            const saveButton = profileForm.querySelector("[data-admin-profile-action='save']");
            if (saveButton) {
                saveButton.disabled = true;
            }
            try {
                const payload = { displayName };
                if (college) {
                    payload.college = college;
                }
                if (grade) {
                    payload.grade = grade;
                }
                if (contact) {
                    payload.contact = contact;
                }
                await window.CampusShareApi.UpdateMyProfile(payload);
                const currentUser = window.CampusShareApi.GetCurrentUserProfile();
                if (currentUser) {
                    currentUser.displayName = displayName;
                    currentUser.college = college;
                    currentUser.grade = grade;
                    if (contact) {
                        currentUser.contact = contact;
                    }
                    window.CampusShareApi.SetCurrentUserProfile(currentUser);
                }
                WriteAdminProfileSnapshot(profileForm, { displayName, college, grade, contact, account });
                ShowSuccess(messageBar, "\u4e2a\u4eba\u8bbe\u7f6e\u5df2\u4fdd\u5b58");
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "\u4e2a\u4eba\u8bbe\u7f6e\u4fdd\u5b58\u5931\u8d25");
            } finally {
                if (saveButton) {
                    saveButton.disabled = false;
                }
            }
        });

        const resetButton = profileForm.querySelector("[data-admin-profile-action='reset']");
        if (resetButton) {
            resetButton.addEventListener("click", function HandleReset() {
                RestoreAdminProfileSnapshot(profileForm);
            });
        }
    }

    async function LoadAdminProfileFormData(settingsPanel, messageBar) {
        if (!settingsPanel) {
            return;
        }
        const profileForm = settingsPanel.querySelector("[data-admin-profile-form]");
        if (!profileForm || profileForm.dataset.loading === "true") {
            return;
        }
        profileForm.dataset.loading = "true";
        try {
            let profileData = null;
            try {
                profileData = await window.CampusShareApi.SyncSessionProfile();
            } catch (error) {
                profileData = window.CampusShareApi.GetCurrentUserProfile();
            }
            const cachedProfile = window.CampusShareApi.GetCurrentUserProfile() || {};
            const safeProfile = profileData || cachedProfile;
            SetAdminProfileField(profileForm, "displayName", safeProfile.displayName || "");
            SetAdminProfileField(profileForm, "contact", safeProfile.contact || cachedProfile.contact || "");
            SetAdminProfileField(profileForm, "account", safeProfile.account || cachedProfile.account || "");
            SetAdminProfileField(profileForm, "college", safeProfile.college || "");
            SetAdminProfileField(profileForm, "grade", safeProfile.grade || "");
            WriteAdminProfileSnapshot(profileForm, {
                displayName: safeProfile.displayName || "",
                contact: safeProfile.contact || cachedProfile.contact || "",
                account: safeProfile.account || cachedProfile.account || "",
                college: safeProfile.college || "",
                grade: safeProfile.grade || ""
            });
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "\u4e2a\u4eba\u8bbe\u7f6e\u52a0\u8f7d\u5931\u8d25");
        } finally {
            profileForm.dataset.loading = "false";
        }
    }

    function ReadAdminProfileField(profileForm, fieldName) {
        const fieldNode = profileForm.querySelector(`[data-admin-profile-field='${fieldName}']`);
        if (!fieldNode) {
            return "";
        }
        return (fieldNode.value || "").trim();
    }

    function SetAdminProfileField(profileForm, fieldName, value) {
        const fieldNode = profileForm.querySelector(`[data-admin-profile-field='${fieldName}']`);
        if (!fieldNode) {
            return;
        }
        fieldNode.value = value == null ? "" : String(value);
    }

    function WriteAdminProfileSnapshot(profileForm, profileData) {
        profileForm.dataset.originalProfile = JSON.stringify(profileData || {});
    }

    function RestoreAdminProfileSnapshot(profileForm) {
        let snapshot = {};
        try {
            snapshot = profileForm.dataset.originalProfile
                ? JSON.parse(profileForm.dataset.originalProfile)
                : {};
        } catch (error) {
            snapshot = {};
        }
        SetAdminProfileField(profileForm, "displayName", snapshot.displayName || "");
        SetAdminProfileField(profileForm, "contact", snapshot.contact || "");
        SetAdminProfileField(profileForm, "account", snapshot.account || "");
        SetAdminProfileField(profileForm, "college", snapshot.college || "");
        SetAdminProfileField(profileForm, "grade", snapshot.grade || "");
    }

    function RenderStats(
        statCardList,
        dashboardSummary,
        marketOverview,
        teamRecruitmentList,
        pendingReportList,
        orderListResult
    ) {
        const publishedProductCount = SafeNumber(
            dashboardSummary && dashboardSummary.publishedProductCount != null
                ? dashboardSummary.publishedProductCount
                : (marketOverview && marketOverview.publishedProductCount)
        );
        const publishedMaterialCount = SafeNumber(marketOverview && marketOverview.publishedMaterialCount);
        const recruitmentCount = SafeNumber(teamRecruitmentList && teamRecruitmentList.totalCount);
        const activePublishTotal = publishedProductCount + publishedMaterialCount + recruitmentCount;

        const totalPublishCard = statCardList[0];
        const pendingReportCard = statCardList[1];
        const recentOrderCard = statCardList[2];

        const totalPublishNumber = totalPublishCard.querySelector("h2");
        if (totalPublishNumber) {
            totalPublishNumber.textContent = FormatNumber(activePublishTotal);
        }
        const totalPublishHelper = totalPublishCard.querySelector(".mt-4.flex.items-center.gap-2.text-sm");
        if (totalPublishHelper) {
            totalPublishHelper.innerHTML = [
                `<span class=\"text-slate-600 font-semibold\">商品 ${publishedProductCount}</span>`,
                "<span class=\"text-slate-400\">/</span>",
                `<span class=\"text-slate-600 font-semibold\">资料 ${publishedMaterialCount}</span>`,
                "<span class=\"text-slate-400\">/</span>",
                `<span class=\"text-slate-600 font-semibold\">招募 ${recruitmentCount}</span>`
            ].join("");
        }

        const pendingReportCount = SafeNumber(
            dashboardSummary && dashboardSummary.pendingReportCount != null
                ? dashboardSummary.pendingReportCount
                : (Array.isArray(pendingReportList) ? pendingReportList.length : 0)
        );
        const pendingReportNumber = pendingReportCard.querySelector("h2");
        if (pendingReportNumber) {
            pendingReportNumber.textContent = FormatNumber(pendingReportCount);
        }
        const pendingBadge = pendingReportCard.querySelector("span");
        if (pendingBadge) {
            if (pendingReportCount >= 10) {
                pendingBadge.textContent = "紧急";
            } else if (pendingReportCount > 0) {
                pendingBadge.textContent = "处理中";
            } else {
                pendingBadge.textContent = "正常";
            }
        }
        const pendingProgress = pendingReportCard.querySelector(".h-1 > div");
        if (pendingProgress) {
            const progressPercent = Math.min(100, Math.max(5, pendingReportCount * 5));
            pendingProgress.style.width = `${progressPercent}%`;
        }

        const totalOrderCount = SafeNumber(
            dashboardSummary && dashboardSummary.totalOrderCount != null
                ? dashboardSummary.totalOrderCount
                : (orderListResult && orderListResult.totalCount)
        );
        const recentOrderNumber = recentOrderCard.querySelector("h2");
        if (recentOrderNumber) {
            recentOrderNumber.textContent = FormatNumber(totalOrderCount);
        }
        const recentOrderHint = recentOrderCard.querySelector("p.text-xs");
        if (recentOrderHint) {
            const ongoingCount = SafeNumber(
                dashboardSummary && dashboardSummary.ongoingOrderCount != null
                    ? dashboardSummary.ongoingOrderCount
                    : (orderListResult && orderListResult.ongoingCount)
            );
            const completedCount = SafeNumber(
                dashboardSummary && dashboardSummary.completedOrderCount != null
                    ? dashboardSummary.completedOrderCount
                    : (orderListResult && orderListResult.completedCount)
            );
            recentOrderHint.innerHTML = `进行中：<span class=\"font-semibold\">${ongoingCount}</span>，已完成：<span class=\"font-semibold\">${completedCount}</span>`;
        }
    }

    function RenderActivityPanel(activityPanel, dashboardSummary, marketOverview, orderListResult, pendingReportList) {
        if (!activityPanel) {
            return;
        }

        const userGrowthRateNode = activityPanel.querySelector("[data-role='activity-user-growth-rate']");
        const userGrowthBarsNode = activityPanel.querySelector("[data-role='activity-user-growth-bars']");
        const resourceExchangeTextNode = activityPanel.querySelector("[data-role='activity-resource-exchange-text']");
        const resourceExchangeProgressNode = activityPanel.querySelector("[data-role='activity-resource-exchange-progress']");
        const activityNoteNode = activityPanel.querySelector("[data-role='activity-note']");

        const totalUserCount = SafeNumber(dashboardSummary && dashboardSummary.totalUserCount);
        const sevenDayNewUserCount = SafeNumber(dashboardSummary && dashboardSummary.sevenDayNewUserCount);
        const todayNewUserCount = SafeNumber(dashboardSummary && dashboardSummary.todayNewUserCount);
        const userGrowthPercent = totalUserCount > 0
            ? (sevenDayNewUserCount / totalUserCount) * 100
            : 0;

        if (userGrowthRateNode) {
            userGrowthRateNode.textContent = `${userGrowthPercent >= 0 ? "+" : ""}${userGrowthPercent.toFixed(1)}%`;
        }
        if (userGrowthBarsNode) {
            const userTrendSeed = Math.max(1, Math.round(sevenDayNewUserCount / 7));
            const userTrendList = [0.68, 0.76, 0.84, 0.93, 1.02, 1.1, 1.18].map(function BuildTrend(seed) {
                return Math.max(1, Math.round(userTrendSeed * seed + todayNewUserCount * 0.08));
            });
            const userTrendMax = Math.max.apply(null, userTrendList.concat([1]));
            userGrowthBarsNode.innerHTML = userTrendList.map(function BuildBar(value, index) {
                const heightPercent = Math.max(18, Math.round((value / userTrendMax) * 95));
                const barClass = index === userTrendList.length - 1 ? "bg-primary" : "bg-primary/20";
                return `<div class="w-full ${barClass} rounded-sm" style="height:${heightPercent}%"></div>`;
            }).join("");
        }

        const sevenDayNewOrderCount = SafeNumber(dashboardSummary && dashboardSummary.sevenDayNewOrderCount);
        const exchangePerDay = Math.round(sevenDayNewOrderCount / 7);
        if (resourceExchangeTextNode) {
            resourceExchangeTextNode.textContent = `${FormatNumber(exchangePerDay)} 次操作/天`;
        }

        const totalOrderCount = SafeNumber(
            dashboardSummary && dashboardSummary.totalOrderCount != null
                ? dashboardSummary.totalOrderCount
                : (orderListResult && orderListResult.totalCount)
        );
        const activeOrderCount = SafeNumber(
            dashboardSummary && dashboardSummary.ongoingOrderCount != null
                ? dashboardSummary.ongoingOrderCount
                : (orderListResult && orderListResult.ongoingCount)
        );
        if (resourceExchangeProgressNode) {
            const activityPercent = totalOrderCount > 0
                ? Math.round((activeOrderCount / totalOrderCount) * 100)
                : 0;
            resourceExchangeProgressNode.style.width = `${Math.min(100, Math.max(8, activityPercent))}%`;
        }

        if (activityNoteNode) {
            const publishedProductCount = SafeNumber(marketOverview && marketOverview.publishedProductCount);
            const publishedMaterialCount = SafeNumber(marketOverview && marketOverview.publishedMaterialCount);
            const pendingReportCount = Array.isArray(pendingReportList) ? pendingReportList.length : 0;
            activityNoteNode.textContent = `最近7天新增用户 ${FormatNumber(sevenDayNewUserCount)}，新增订单 ${FormatNumber(sevenDayNewOrderCount)}，当前待处理举报 ${FormatNumber(pendingReportCount)}。在架商品 ${FormatNumber(publishedProductCount)}，已发布资料 ${FormatNumber(publishedMaterialCount)}。`;
        }
    }

    /**
     * 鏋勫缓瀹℃牳浠诲姟
     */
    function BuildReviewTaskList(
        pendingReportList,
        pendingUserList,
        pendingTeamApplicationList,
        pendingTeamRecruitmentListResult,
        pendingMaterialListResult,
        pendingProductListResult
    ) {
        const reportTaskList = BuildReportReviewTaskList(pendingReportList);
        const userTaskList = BuildUserReviewTaskList(pendingUserList);
        const teamTaskList = BuildTeamApplicationReviewTaskList(pendingTeamApplicationList);
        const teamRecruitmentTaskList = BuildTeamRecruitmentReviewTaskList(pendingTeamRecruitmentListResult);
        const materialTaskList = BuildMaterialReviewTaskList(pendingMaterialListResult);
        const productTaskList = BuildProductReviewTaskList(pendingProductListResult);
        return reportTaskList
            .concat(userTaskList)
            .concat(teamTaskList)
            .concat(teamRecruitmentTaskList)
            .concat(materialTaskList)
            .concat(productTaskList)
            .sort(function SortReviewTask(a, b) {
                return ResolveTimeValue(b.createTime) - ResolveTimeValue(a.createTime);
            });
    }

    function ResolveTaskResourceTitle(taskItem) {
        if (taskItem.taskType === "REPORT") {
            return `举报 #${taskItem.taskId} (${taskItem.reason || "未分类"})`;
        }
        if (taskItem.taskType === "USER") {
            return `用户审核 #${taskItem.taskId} (${taskItem.account || "-"})`;
        }
        if (taskItem.taskType === "TEAM") {
            return `组队申请 #${taskItem.taskId} (招募 #${taskItem.recruitmentId || "-"})`;
        }
        if (taskItem.taskType === "TEAM_RECRUITMENT") {
            return `帖子审核 #${taskItem.taskId} (${taskItem.title || "-"})`;
        }
        if (taskItem.taskType === "MATERIAL") {
            return `资料审核 #${taskItem.taskId} (${taskItem.courseName || "-"})`;
        }
        return `商品审核 #${taskItem.taskId} (${taskItem.title || "-"})`;
    }

    function ResolveTaskResourceMeta(taskItem) {
        if (taskItem.taskType === "REPORT") {
            return `${taskItem.targetType || "UNKNOWN"} #${taskItem.targetId || "-"}`;
        }
        if (taskItem.taskType === "USER") {
            return `${taskItem.college || "-"} · ${taskItem.grade || "-"}`;
        }
        if (taskItem.taskType === "TEAM") {
            return taskItem.applyRemark || "未填写申请备注";
        }
        if (taskItem.taskType === "TEAM_RECRUITMENT") {
            return `${taskItem.category || "-"} · ${taskItem.recruitmentStatus || "PENDING_REVIEW"}`;
        }
        if (taskItem.taskType === "MATERIAL") {
            return `文件: ${taskItem.fileType || "-"} · ${SafeNumber(taskItem.fileSizeBytes)} bytes`;
        }
        return `${taskItem.category || "-"} · ${taskItem.conditionLevel || "-"} · ￥${FormatPrice(taskItem.price)}`;
    }

    function ResolveTaskContributor(taskItem) {
        if (taskItem.taskType === "REPORT") {
            return `举报人ID: ${taskItem.reporterUserId || "-"}`;
        }
        if (taskItem.taskType === "USER") {
            return taskItem.displayName || taskItem.account || `用户#${taskItem.taskId || "-"}`;
        }
        if (taskItem.taskType === "TEAM") {
            return taskItem.applicantDisplayName || `申请人#${taskItem.applicantUserId || "-"}`;
        }
        if (taskItem.taskType === "TEAM_RECRUITMENT") {
            return taskItem.publisherDisplayName || `发布者ID: ${taskItem.publisherUserId || "-"}`;
        }
        if (taskItem.taskType === "MATERIAL") {
            return `上传者ID: ${taskItem.uploaderUserId || "-"}`;
        }
        return taskItem.sellerDisplayName || `卖家ID: ${taskItem.sellerUserId || "-"}`;
    }

    function ResolveTaskStatusText(taskItem) {
        if (taskItem.taskType === "REPORT") {
            return "举报待审";
        }
        if (taskItem.taskType === "USER") {
            return "用户待审";
        }
        if (taskItem.taskType === "TEAM") {
            return "申请待审";
        }
        if (taskItem.taskType === "TEAM_RECRUITMENT") {
            return "帖子待审";
        }
        if (taskItem.taskType === "MATERIAL") {
            return "资料待审";
        }
        return "商品待审";
    }

    function ResolveTaskStatusClass(taskItem) {
        if (taskItem.taskType === "REPORT") {
            return "bg-secondary-container text-on-secondary-container";
        }
        if (taskItem.taskType === "USER") {
            return "bg-surface-container text-slate-600";
        }
        if (taskItem.taskType === "TEAM") {
            return "bg-primary/10 text-primary";
        }
        if (taskItem.taskType === "TEAM_RECRUITMENT") {
            return "bg-indigo-100 text-indigo-700";
        }
        if (taskItem.taskType === "MATERIAL") {
            return "bg-amber-100 text-amber-700";
        }
        return "bg-blue-100 text-blue-700";
    }

    function ResolveTaskIconName(taskItem) {
        if (taskItem.taskType === "REPORT") {
            return "gavel";
        }
        if (taskItem.taskType === "USER") {
            return "badge";
        }
        if (taskItem.taskType === "TEAM") {
            return "groups";
        }
        if (taskItem.taskType === "TEAM_RECRUITMENT") {
            return "forum";
        }
        if (taskItem.taskType === "MATERIAL") {
            return "description";
        }
        return "storefront";
    }

    /**
     * 鎸夌姸鎬佹覆鏌撳鏍歌〃
     */
    function RenderReviewTableByState(reviewTableBody, reviewState, taskPager) {
        const filteredTaskList = FilterReviewTasks(reviewState.reviewTaskList, reviewState);
        const pageTotal = Math.max(1, Math.ceil(filteredTaskList.length / reviewState.pageSize));
        if (reviewState.pageNo > pageTotal) {
            reviewState.pageNo = pageTotal;
        }
        const startIndex = (reviewState.pageNo - 1) * reviewState.pageSize;
        const pageTaskList = filteredTaskList.slice(startIndex, startIndex + reviewState.pageSize);

        if (pageTaskList.length === 0) {
            reviewTableBody.innerHTML = "<tr><td colspan=\"5\" class=\"px-6 py-8 text-center text-sm text-slate-400\">暂无待审核任务</td></tr>";
            UpdateTaskPager(taskPager, reviewState.pageNo, pageTotal, filteredTaskList.length, 0, 0);
            return;
        }

        reviewTableBody.innerHTML = pageTaskList.map(function BuildTaskRow(taskItem) {
            const resourceTitle = ResolveTaskResourceTitle(taskItem);
            const resourceMeta = ResolveTaskResourceMeta(taskItem);
            const contributor = ResolveTaskContributor(taskItem);
            const statusText = ResolveTaskStatusText(taskItem);
            const statusClass = ResolveTaskStatusClass(taskItem);
            const iconName = ResolveTaskIconName(taskItem);
            const recruitmentIdValue = taskItem.recruitmentId || "";
            const productIdValue = taskItem.taskType === "PRODUCT" ? taskItem.taskId : "";
            const productDetailPath = `/pages/market_item_detail.html?productId=${encodeURIComponent(String(taskItem.taskId || ""))}`;
            const recruitmentDetailPath = `/pages/recruitment_board.html?focusRecruitmentId=${encodeURIComponent(String(taskItem.taskId || ""))}`;
            const resourceTitleHtml = taskItem.taskType === "PRODUCT"
                ? `<a href="${productDetailPath}" target="_blank" class="text-sm font-semibold text-primary hover:underline">${EscapeHtml(resourceTitle)}</a>`
                : (taskItem.taskType === "TEAM_RECRUITMENT"
                    ? `<a href="${recruitmentDetailPath}" target="_blank" class="text-sm font-semibold text-primary hover:underline">${EscapeHtml(resourceTitle)}</a>`
                    : `<p class="text-sm font-semibold text-on-surface">${EscapeHtml(resourceTitle)}</p>`);
            const viewProductButton = taskItem.taskType === "PRODUCT"
                ? `<button data-task-action=\"view-product\" data-task-type=\"${taskItem.taskType}\" data-task-id=\"${productIdValue}\" class=\"p-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100\" title=\"查看商品详情\"><span class=\"material-symbols-outlined text-sm\">visibility</span></button>`
                : "";
            const viewRecruitmentButton = taskItem.taskType === "TEAM_RECRUITMENT"
                ? `<button data-task-action=\"view-recruitment\" data-task-type=\"${taskItem.taskType}\" data-task-id=\"${taskItem.taskId}\" class=\"p-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100\" title=\"查看帖子详情\"><span class=\"material-symbols-outlined text-sm\">visibility</span></button>`
                : "";

            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors group\">",
                "<td class=\"px-6 py-4\">",
                "<div class=\"flex items-center gap-3\">",
                "<div class=\"w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center\">",
                `<span class=\"material-symbols-outlined text-outline\">${iconName}</span>`,
                "</div>",
                "<div>",
                resourceTitleHtml,
                `<p class=\"text-xs text-slate-400\">${EscapeHtml(resourceMeta)}</p>`,
                "</div></div></td>",
                `<td class=\"px-6 py-4 text-sm text-on-surface-variant\">${EscapeHtml(contributor)}</td>`,
                `<td class=\"px-6 py-4 text-sm text-on-surface-variant\">${EscapeHtml(FormatTime(taskItem.createTime))}</td>`,
                `<td class=\"px-6 py-4\"><span class=\"${statusClass} text-[10px] font-bold px-2 py-0.5 rounded-full\">${EscapeHtml(statusText)}</span></td>`,
                "<td class=\"px-6 py-4 text-right\">",
                "<div class=\"flex justify-end gap-2\">",
                viewProductButton,
                viewRecruitmentButton,
                `<button data-task-action=\"approve\" data-task-type=\"${taskItem.taskType}\" data-task-id=\"${taskItem.taskId}\" data-recruitment-id=\"${recruitmentIdValue}\" class=\"p-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100\"><span class=\"material-symbols-outlined text-sm\">check</span></button>`,
                `<button data-task-action=\"reject\" data-task-type=\"${taskItem.taskType}\" data-task-id=\"${taskItem.taskId}\" data-recruitment-id=\"${recruitmentIdValue}\" class=\"p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100\"><span class=\"material-symbols-outlined text-sm\">close</span></button>`,
                "</div></td></tr>"
            ].join("");
        }).join("");

        UpdateTaskPager(
            taskPager,
            reviewState.pageNo,
            pageTotal,
            filteredTaskList.length,
            startIndex + 1,
            startIndex + pageTaskList.length
        );
    }

    /**
     * 杩囨护浠诲姟
     */
    function FilterReviewTasks(reviewTaskList, reviewState) {
        return reviewTaskList.filter(function FilterTask(taskItem) {
            if (reviewState.taskTypeFilter !== "ALL" && taskItem.taskType !== reviewState.taskTypeFilter) {
                return false;
            }
            if (!reviewState.keyword) {
                return true;
            }
            const keyword = reviewState.keyword.toLowerCase();
            const searchText = [
                String(taskItem.taskId || ""),
                taskItem.reason || "",
                taskItem.account || "",
                taskItem.displayName || "",
                taskItem.targetType || "",
                String(taskItem.targetId || ""),
                String(taskItem.recruitmentId || ""),
                String(taskItem.applicantUserId || ""),
                taskItem.applicantDisplayName || "",
                taskItem.applyRemark || "",
                taskItem.college || "",
                taskItem.grade || "",
                taskItem.courseName || "",
                taskItem.fileType || "",
                String(taskItem.uploaderUserId || ""),
                taskItem.title || "",
                taskItem.category || "",
                taskItem.conditionLevel || "",
                taskItem.tradeLocation || "",
                taskItem.sellerDisplayName || "",
                String(taskItem.sellerUserId || ""),
                taskItem.publisherDisplayName || "",
                String(taskItem.publisherUserId || ""),
                taskItem.recruitmentStatus || "",
                taskItem.contactInfo || ""
            ].join(" ").toLowerCase();
            return searchText.includes(keyword);
        });
    }

    /**
     * 缁戝畾瀹℃牳鎿嶄綔
     */
    function BindReviewTableActions(
        reviewTableBody,
        statCardList,
        reviewState,
        taskPager,
        messageBar,
        governanceWorkspace,
        activityPanel
    ) {
        reviewTableBody.addEventListener("click", async function HandleReviewAction(event) {
            const actionButton = event.target.closest("button[data-task-action]");
            if (!actionButton) {
                return;
            }
            const taskAction = actionButton.getAttribute("data-task-action");
            const taskType = actionButton.getAttribute("data-task-type");
            const taskId = Number(actionButton.getAttribute("data-task-id"));
            const recruitmentId = Number(actionButton.getAttribute("data-recruitment-id"));
            if (!taskAction || !taskType || !taskId) {
                return;
            }
            if (taskAction === "view-product" && taskType === "PRODUCT") {
                window.open(`/pages/market_item_detail.html?productId=${encodeURIComponent(String(taskId))}`, "_blank");
                return;
            }
            if (taskAction === "view-recruitment" && taskType === "TEAM_RECRUITMENT") {
                window.open(`/pages/recruitment_board.html?focusRecruitmentId=${encodeURIComponent(String(taskId))}`, "_blank");
                return;
            }
            const approved = taskAction === "approve";
            const confirmText = approved ? "确定执行通过操作吗？" : "确定执行驳回操作吗？";
            if (!window.confirm(confirmText)) {
                return;
            }

            actionButton.disabled = true;
            try {
                if (taskType === "REPORT") {
                    await window.CampusShareApi.ReviewReport(
                        taskId,
                        approved,
                        "",
                        approved ? "后台快速通过" : "后台快速驳回"
                    );
                } else if (taskType === "USER") {
                    await window.CampusShareApi.ReviewUser(
                        taskId,
                        approved,
                        approved ? "后台快速通过" : "后台快速驳回"
                    );
                } else if (taskType === "TEAM") {
                    if (!recruitmentId) {
                        throw new Error("组队申请缺少招募ID");
                    }
                    if (approved) {
                        await window.CampusShareApi.ApproveTeamRecruitmentApplication(
                            recruitmentId,
                            taskId,
                            "后台快速通过"
                        );
                    } else {
                        await window.CampusShareApi.RejectTeamRecruitmentApplication(
                            recruitmentId,
                            taskId,
                            "后台快速驳回"
                        );
                    }
                } else if (taskType === "TEAM_RECRUITMENT") {
                    await window.CampusShareApi.ReviewTeamRecruitmentByAdmin(
                        taskId,
                        approved,
                        approved ? "后台快速通过" : "后台快速驳回"
                    );
                } else if (taskType === "MATERIAL") {
                    await window.CampusShareApi.ReviewMaterial(
                        taskId,
                        approved,
                        approved ? "后台快速通过" : "后台快速驳回"
                    );
                } else if (taskType === "PRODUCT") {
                    await window.CampusShareApi.ReviewProductByAdmin(
                        taskId,
                        approved,
                        approved ? "后台快速通过" : "后台快速驳回"
                    );
                } else {
                    return;
                }
                ShowSuccess(messageBar, approved ? "审核已通过" : "审核已驳回");
                await LoadDashboardData(
                    statCardList,
                    reviewTableBody,
                    reviewState,
                    taskPager,
                    messageBar,
                    governanceWorkspace,
                    activityPanel
                );
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "审核操作失败");
            } finally {
                actionButton.disabled = false;
            }
        });
    }

    /**
     * 鍒涘缓宸ュ叿鏍?
     */
    function CreateTaskToolbar(reviewPanel) {
        const panelHeader = reviewPanel.querySelector(".px-6.py-4.border-b");
        const toolbar = document.createElement("div");
        toolbar.className = "px-6 py-3 border-b border-surface-container bg-surface-container-low/40 flex flex-col md:flex-row gap-3 md:items-center md:justify-between";
        toolbar.innerHTML = [
            "<div class=\"flex items-center gap-2\">",
            "<label class=\"text-xs text-slate-500\">任务类型</label>",
            "<select data-task-type-filter class=\"px-2 py-1.5 text-xs rounded-md bg-white border border-slate-200\">",
            "<option value=\"ALL\">全部</option>",
            "<option value=\"REPORT\">举报</option>",
            "<option value=\"USER\">用户审核</option>",
            "<option value=\"TEAM\">组队申请</option>",
            "<option value=\"TEAM_RECRUITMENT\">帖子审核</option>",
            "<option value=\"MATERIAL\">资料审核</option>",
            "<option value=\"PRODUCT\">商品审核</option>",
            "</select>",
            "</div>",
            "<div class=\"flex items-center gap-2\">",
            "<input data-task-keyword-input type=\"text\" class=\"px-3 py-1.5 text-xs rounded-md bg-white border border-slate-200 w-52\" placeholder=\"按ID/账号/分类搜索\"/>",
            "<button data-task-refresh class=\"px-3 py-1.5 text-xs rounded-md bg-surface-container text-slate-700 font-semibold hover:bg-surface-container-high\">重置</button>",
            "</div>"
        ].join("");
        if (panelHeader) {
            panelHeader.insertAdjacentElement("afterend", toolbar);
        } else {
            reviewPanel.prepend(toolbar);
        }
        if (window.CampusShareApi && typeof window.CampusShareApi.EnhanceSelectElements === "function") {
            window.CampusShareApi.EnhanceSelectElements(toolbar);
        }
        return {
            wrapper: toolbar,
            typeFilterSelect: toolbar.querySelector("[data-task-type-filter]"),
            keywordInput: toolbar.querySelector("[data-task-keyword-input]"),
            refreshButton: toolbar.querySelector("[data-task-refresh]")
        };
    }

    /**
     * 缁戝畾宸ュ叿鏍?
     */
    function BindTaskToolbarActions(taskToolbar, reviewState, onChange) {
        if (!taskToolbar || !taskToolbar.typeFilterSelect || !taskToolbar.keywordInput || !taskToolbar.refreshButton) {
            return;
        }
        taskToolbar.typeFilterSelect.addEventListener("change", function HandleTypeChange() {
            reviewState.taskTypeFilter = taskToolbar.typeFilterSelect.value || "ALL";
            reviewState.pageNo = 1;
            onChange();
        });
        taskToolbar.keywordInput.addEventListener("keydown", function HandleKeywordSearch(event) {
            if (event.key !== "Enter") {
                return;
            }
            reviewState.keyword = taskToolbar.keywordInput.value ? taskToolbar.keywordInput.value.trim() : "";
            reviewState.pageNo = 1;
            onChange();
        });
        taskToolbar.keywordInput.addEventListener("blur", function HandleKeywordBlur() {
            reviewState.keyword = taskToolbar.keywordInput.value ? taskToolbar.keywordInput.value.trim() : "";
            reviewState.pageNo = 1;
            onChange();
        });
        taskToolbar.refreshButton.addEventListener("click", function HandleReset() {
            reviewState.taskTypeFilter = "ALL";
            reviewState.keyword = "";
            reviewState.pageNo = 1;
            taskToolbar.typeFilterSelect.value = "ALL";
            taskToolbar.keywordInput.value = "";
            onChange();
        });
    }

    /**
     * 鍒涘缓鍒嗛〉鏍?
     */
    function CreateTaskPager(reviewPanel) {
        const pager = document.createElement("div");
        pager.className = "px-6 py-3 border-t border-surface-container flex items-center justify-between text-xs";
        pager.innerHTML = [
            "<p data-task-page-info class=\"text-slate-500\">-</p>",
            "<div class=\"flex items-center gap-2\">",
            "<button data-task-prev class=\"px-2 py-1 rounded-md bg-surface-container text-slate-600 hover:bg-surface-container-high\">上一页</button>",
            "<button data-task-next class=\"px-2 py-1 rounded-md bg-surface-container text-slate-600 hover:bg-surface-container-high\">下一页</button>",
            "</div>"
        ].join("");
        reviewPanel.appendChild(pager);
        return {
            wrapper: pager,
            pageInfo: pager.querySelector("[data-task-page-info]"),
            prevButton: pager.querySelector("[data-task-prev]"),
            nextButton: pager.querySelector("[data-task-next]")
        };
    }

    /**
     * 缁戝畾鍒嗛〉鏍?
     */
    function BindTaskPagerActions(taskPager, reviewState, onPageChange) {
        if (!taskPager || !taskPager.prevButton || !taskPager.nextButton) {
            return;
        }
        taskPager.prevButton.addEventListener("click", function HandlePrevPage() {
            if (reviewState.pageNo <= 1) {
                return;
            }
            reviewState.pageNo -= 1;
            onPageChange();
        });
        taskPager.nextButton.addEventListener("click", function HandleNextPage() {
            reviewState.pageNo += 1;
            onPageChange();
        });
    }

    /**
     * 鏇存柊鍒嗛〉淇℃伅
     */
    function UpdateTaskPager(taskPager, pageNo, pageTotal, totalCount, startNo, endNo) {
        if (!taskPager || !taskPager.pageInfo || !taskPager.prevButton || !taskPager.nextButton) {
            return;
        }
        taskPager.pageInfo.textContent = totalCount <= 0
            ? "暂无记录"
            : `显示 ${totalCount} 条中的 ${startNo}-${endNo}，第 ${pageNo}/${pageTotal} 页`;
        taskPager.prevButton.disabled = pageNo <= 1;
        taskPager.nextButton.disabled = pageNo >= pageTotal;
        taskPager.prevButton.classList.toggle("opacity-50", taskPager.prevButton.disabled);
        taskPager.nextButton.classList.toggle("opacity-50", taskPager.nextButton.disabled);
    }

    /**
     * 鏋勫缓涓炬姤浠诲姟鍒楄〃
     */
    function BuildReportReviewTaskList(pendingReportList) {
        if (!Array.isArray(pendingReportList)) {
            return [];
        }
        return pendingReportList.map(function MapReport(reportItem) {
            return {
                taskType: "REPORT",
                taskId: SafeNumber(reportItem.reportId),
                reporterUserId: SafeNumber(reportItem.reporterUserId),
                targetType: reportItem.targetType || "UNKNOWN",
                targetId: SafeNumber(reportItem.targetId),
                reason: reportItem.reasonCategory || "未分类",
                createTime: reportItem.createTime || null
            };
        });
    }

    /**
     * 鏋勫缓鐢ㄦ埛浠诲姟鍒楄〃
     */
    function BuildUserReviewTaskList(pendingUserList) {
        if (!Array.isArray(pendingUserList)) {
            return [];
        }
        return pendingUserList.map(function MapUser(userItem) {
            return {
                taskType: "USER",
                taskId: SafeNumber(userItem.userId),
                account: userItem.account || "-",
                displayName: userItem.displayName || "-",
                college: userItem.college || "-",
                grade: userItem.grade || "-",
                createTime: userItem.lastLoginTime || null
            };
        });
    }

    /**
     * 鏋勫缓缁勯槦鐢宠浠诲姟鍒楄〃
     */
    function BuildTeamApplicationReviewTaskList(pendingTeamApplicationList) {
        if (!Array.isArray(pendingTeamApplicationList)) {
            return [];
        }
        return pendingTeamApplicationList.map(function MapApplication(applicationItem) {
            return {
                taskType: "TEAM",
                taskId: SafeNumber(applicationItem.applicationId),
                recruitmentId: SafeNumber(applicationItem.recruitmentId),
                applicantUserId: SafeNumber(applicationItem.applicantUserId),
                applicantDisplayName: applicationItem.applicantDisplayName || "-",
                applyRemark: applicationItem.applyRemark || "",
                createTime: applicationItem.createTime || null
            };
        });
    }

    /**
     * 鏋勫缓缁勯槦鍙戝竷瀹℃牳浠诲姟鍒楄〃
     */
    function BuildTeamRecruitmentReviewTaskList(pendingTeamRecruitmentListResult) {
        const recruitmentList = pendingTeamRecruitmentListResult
            && Array.isArray(pendingTeamRecruitmentListResult.recruitmentList)
            ? pendingTeamRecruitmentListResult.recruitmentList
            : [];
        return recruitmentList.map(function MapRecruitment(recruitmentItem) {
            return {
                taskType: "TEAM_RECRUITMENT",
                taskId: SafeNumber(recruitmentItem.recruitmentId),
                publisherUserId: SafeNumber(recruitmentItem.publisherUserId),
                publisherDisplayName: recruitmentItem.publisherDisplayName || "",
                title: recruitmentItem.title || recruitmentItem.eventName || "",
                category: recruitmentItem.category || "",
                contactInfo: recruitmentItem.contactInfo || "",
                recruitmentStatus: recruitmentItem.recruitmentStatus || "",
                createTime: recruitmentItem.createTime || null
            };
        });
    }

    /**
     * 鏋勫缓璧勬枡瀹℃牳浠诲姟鍒楄〃
     */
    function BuildMaterialReviewTaskList(pendingMaterialListResult) {
        const materialList = pendingMaterialListResult && Array.isArray(pendingMaterialListResult.materialList)
            ? pendingMaterialListResult.materialList
            : [];
        return materialList.map(function MapMaterial(materialItem) {
            return {
                taskType: "MATERIAL",
                taskId: SafeNumber(materialItem.materialId),
                uploaderUserId: SafeNumber(materialItem.uploaderUserId),
                courseName: materialItem.courseName || "",
                fileType: materialItem.fileType || "",
                fileSizeBytes: SafeNumber(materialItem.fileSizeBytes),
                createTime: materialItem.createTime || null
            };
        });
    }

    /**
     * 鏋勫缓鍟嗗搧瀹℃牳浠诲姟鍒楄〃
     */
    function BuildProductReviewTaskList(pendingProductListResult) {
        const productList = pendingProductListResult && Array.isArray(pendingProductListResult.productList)
            ? pendingProductListResult.productList
            : [];
        return productList.map(function MapProduct(productItem) {
            return {
                taskType: "PRODUCT",
                taskId: SafeNumber(productItem.productId),
                sellerUserId: SafeNumber(productItem.sellerUserId),
                sellerDisplayName: productItem.sellerDisplayName || "",
                title: productItem.title || "",
                category: productItem.category || "",
                conditionLevel: productItem.conditionLevel || "",
                tradeLocation: productItem.tradeLocation || "",
                price: SafeNumber(productItem.price),
                createTime: productItem.createTime || null
            };
        });
    }

    /**
     * 鍒涘缓娌荤悊宸ヤ綔鍖?
     */
    function CreateGovernanceWorkspace() {
        const mainElement = document.querySelector("main");
        if (!mainElement) {
            return null;
        }
        const workspaceElement = document.createElement("section");
        workspaceElement.className = "mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6";
        workspaceElement.innerHTML = [
            "<div class=\"xl:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm ring-1 ring-outline-variant/10 p-5\">",
            "<div class=\"flex items-center justify-between gap-3 mb-4\">",
            "<div>",
            "<h3 class=\"text-lg font-semibold text-on-surface\">治理总览</h3>",
            "<p class=\"text-xs text-slate-500\">规则、商品、订单与审计日志联动面板</p>",
            "</div>",
            "<button data-governance-action=\"refresh\" class=\"px-3 py-1.5 text-xs rounded-md bg-surface-container text-slate-700 font-semibold hover:bg-surface-container-high\">刷新治理数据</button>",
            "</div>",
            "<div class=\"grid grid-cols-2 md:grid-cols-4 gap-3 text-xs\">",
            "<div class=\"rounded-lg bg-surface-container-low p-3\"><p class=\"text-slate-500\">待审用户</p><p data-role=\"summary-user-pending\" class=\"text-lg font-bold text-primary\">0</p></div>",
            "<div class=\"rounded-lg bg-surface-container-low p-3\"><p class=\"text-slate-500\">待处理举报</p><p data-role=\"summary-report-pending\" class=\"text-lg font-bold text-primary\">0</p></div>",
            "<div class=\"rounded-lg bg-surface-container-low p-3\"><p class=\"text-slate-500\">进行中订单</p><p data-role=\"summary-order-ongoing\" class=\"text-lg font-bold text-primary\">0</p></div>",
            "<div class=\"rounded-lg bg-surface-container-low p-3\"><p class=\"text-slate-500\">近7天审计</p><p data-role=\"summary-audit-seven\" class=\"text-lg font-bold text-primary\">0</p></div>",
            "</div>",
            "<div class=\"mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs\">",
            "<div class=\"rounded-lg bg-surface-container-low p-3\"><p class=\"text-slate-500\">系统运行状态</p><p data-role=\"summary-ops-health\" class=\"text-sm font-semibold text-on-surface\">-</p></div>",
            "<div class=\"rounded-lg bg-surface-container-low p-3\"><p class=\"text-slate-500\">邮件待派发/失败</p><p data-role=\"summary-ops-mail\" class=\"text-sm font-semibold text-on-surface\">0 / 0</p></div>",
            "<div class=\"rounded-lg bg-surface-container-low p-3\"><p class=\"text-slate-500\">超时待卖家确认</p><p data-role=\"summary-ops-timeout-seller\" class=\"text-sm font-semibold text-on-surface\">0</p></div>",
            "<div class=\"rounded-lg bg-surface-container-low p-3\"><p class=\"text-slate-500\">超时待买家确认</p><p data-role=\"summary-ops-timeout-buyer\" class=\"text-sm font-semibold text-on-surface\">0</p></div>",
            "</div>",
            "</div>",

            "<div class=\"bg-surface-container-lowest rounded-xl shadow-sm ring-1 ring-outline-variant/10 overflow-hidden\">",
            "<div class=\"px-5 py-4 border-b border-surface-container flex items-center justify-between\">",
            "<h3 class=\"text-base font-semibold text-on-surface\">规则配置</h3>",
            "<span class=\"text-xs text-slate-500\">可在线修改</span>",
            "</div>",
            "<div class=\"overflow-x-auto\">",
            "<table class=\"w-full text-left border-collapse\">",
            "<thead class=\"bg-surface-container-low text-xs uppercase tracking-widest text-on-surface-variant\"><tr><th class=\"px-4 py-3\">规则键</th><th class=\"px-4 py-3\">规则说明</th><th class=\"px-4 py-3\">规则值</th><th class=\"px-4 py-3 text-right\">操作</th></tr></thead>",
            "<tbody data-role=\"rule-table\" class=\"divide-y divide-surface-container\"></tbody>",
            "</table>",
            "</div>",
            "</div>",

            "<div class=\"bg-surface-container-lowest rounded-xl shadow-sm ring-1 ring-outline-variant/10 overflow-hidden\">",
            "<div class=\"px-5 py-4 border-b border-surface-container flex items-center justify-between\">",
            "<h3 class=\"text-base font-semibold text-on-surface\">商品治理</h3>",
            "<span class=\"text-xs text-slate-500\">可强制下架</span>",
            "</div>",
            "<div class=\"overflow-x-auto\">",
            "<table class=\"w-full text-left border-collapse\">",
            "<thead class=\"bg-surface-container-low text-xs uppercase tracking-widest text-on-surface-variant\"><tr><th class=\"px-4 py-3\">商品</th><th class=\"px-4 py-3\">状态</th><th class=\"px-4 py-3 text-right\">操作</th></tr></thead>",
            "<tbody data-role=\"product-table\" class=\"divide-y divide-surface-container\"></tbody>",
            "</table>",
            "</div>",
            "</div>",

            "<div class=\"bg-surface-container-lowest rounded-xl shadow-sm ring-1 ring-outline-variant/10 overflow-hidden\">",
            "<div class=\"px-5 py-4 border-b border-surface-container flex items-center justify-between\">",
            "<h3 class=\"text-base font-semibold text-on-surface\">订单治理</h3>",
            "<span class=\"text-xs text-slate-500\">可强制关闭</span>",
            "</div>",
            "<div class=\"overflow-x-auto\">",
            "<table class=\"w-full text-left border-collapse\">",
            "<thead class=\"bg-surface-container-low text-xs uppercase tracking-widest text-on-surface-variant\"><tr><th class=\"px-4 py-3\">订单号</th><th class=\"px-4 py-3\">状态</th><th class=\"px-4 py-3 text-right\">操作</th></tr></thead>",
            "<tbody data-role=\"order-table\" class=\"divide-y divide-surface-container\"></tbody>",
            "</table>",
            "</div>",
            "</div>",

            "<div class=\"bg-surface-container-lowest rounded-xl shadow-sm ring-1 ring-outline-variant/10 overflow-hidden\">",
            "<div class=\"px-5 py-4 border-b border-surface-container flex items-center justify-between\">",
            "<h3 class=\"text-base font-semibold text-on-surface\">审计日志</h3>",
            "<span class=\"text-xs text-slate-500\">最近操作</span>",
            "</div>",
            "<div class=\"overflow-x-auto\">",
            "<table class=\"w-full text-left border-collapse\">",
            "<thead class=\"bg-surface-container-low text-xs uppercase tracking-widest text-on-surface-variant\"><tr><th class=\"px-4 py-3\">动作</th><th class=\"px-4 py-3\">对象</th><th class=\"px-4 py-3\">时间</th></tr></thead>",
            "<tbody data-role=\"audit-table\" class=\"divide-y divide-surface-container\"></tbody>",
            "</table>",
            "</div>",
            "</div>"
        ].join("");
        mainElement.appendChild(workspaceElement);
        if (window.CampusShareApi && typeof window.CampusShareApi.EnhanceSelectElements === "function") {
            window.CampusShareApi.EnhanceSelectElements(workspaceElement);
        }
        return {
            wrapper: workspaceElement,
            refreshButton: workspaceElement.querySelector("[data-governance-action='refresh']"),
            summaryPendingUserNode: workspaceElement.querySelector("[data-role='summary-user-pending']"),
            summaryPendingReportNode: workspaceElement.querySelector("[data-role='summary-report-pending']"),
            summaryOngoingOrderNode: workspaceElement.querySelector("[data-role='summary-order-ongoing']"),
            summarySevenDayAuditNode: workspaceElement.querySelector("[data-role='summary-audit-seven']"),
            summaryOpsHealthNode: workspaceElement.querySelector("[data-role='summary-ops-health']"),
            summaryOpsMailNode: workspaceElement.querySelector("[data-role='summary-ops-mail']"),
            summaryOpsTimeoutSellerNode: workspaceElement.querySelector("[data-role='summary-ops-timeout-seller']"),
            summaryOpsTimeoutBuyerNode: workspaceElement.querySelector("[data-role='summary-ops-timeout-buyer']"),
            ruleTableBody: workspaceElement.querySelector("[data-role='rule-table']"),
            productTableBody: workspaceElement.querySelector("[data-role='product-table']"),
            orderTableBody: workspaceElement.querySelector("[data-role='order-table']"),
            auditTableBody: workspaceElement.querySelector("[data-role='audit-table']")
        };
    }

    /**
     * 缁戝畾娌荤悊宸ヤ綔鍖轰簨浠?
     */
    function BindGovernanceWorkspaceActions(governanceWorkspace, messageBar, reloadDashboardDataFunction) {
        if (!governanceWorkspace || !governanceWorkspace.wrapper) {
            return;
        }
        if (governanceWorkspace.refreshButton) {
            governanceWorkspace.refreshButton.addEventListener("click", function HandleRefreshClick() {
                reloadDashboardDataFunction();
            });
        }
        governanceWorkspace.wrapper.addEventListener("click", async function HandleGovernanceAction(event) {
            const actionButton = event.target.closest("[data-governance-action]");
            if (!actionButton) {
                return;
            }
            const action = actionButton.getAttribute("data-governance-action");
            if (!action || action === "refresh") {
                return;
            }
            actionButton.disabled = true;
            try {
                if (action === "update-rule") {
                    await HandleRuleUpdateAction(actionButton);
                    ShowSuccess(messageBar, "规则已更新");
                } else if (action === "product-offline") {
                    await HandleProductOfflineAction(actionButton);
                    ShowSuccess(messageBar, "商品已强制下架");
                } else if (action === "order-close") {
                    await HandleOrderCloseAction(actionButton);
                    ShowSuccess(messageBar, "订单已强制关闭");
                } else {
                    return;
                }
                await reloadDashboardDataFunction();
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "治理操作失败");
            } finally {
                actionButton.disabled = false;
            }
        });
    }

    /**
     * 娓叉煋娌荤悊宸ヤ綔鍖?
     */
    function RenderGovernanceWorkspace(
        governanceWorkspace,
        dashboardSummary,
        ruleConfigList,
        productListResult,
        adminOrderListResult,
        auditLogListResult,
        opsSummary
    ) {
        if (!governanceWorkspace) {
            return;
        }
        if (governanceWorkspace.summaryPendingUserNode) {
            governanceWorkspace.summaryPendingUserNode.textContent = FormatNumber(
                dashboardSummary && dashboardSummary.pendingUserReviewCount
            );
        }
        if (governanceWorkspace.summaryPendingReportNode) {
            governanceWorkspace.summaryPendingReportNode.textContent = FormatNumber(
                dashboardSummary && dashboardSummary.pendingReportCount
            );
        }
        if (governanceWorkspace.summaryOngoingOrderNode) {
            governanceWorkspace.summaryOngoingOrderNode.textContent = FormatNumber(
                dashboardSummary && dashboardSummary.ongoingOrderCount
            );
        }
        if (governanceWorkspace.summarySevenDayAuditNode) {
            governanceWorkspace.summarySevenDayAuditNode.textContent = FormatNumber(
                dashboardSummary && dashboardSummary.sevenDayAuditCount
            );
        }
        if (governanceWorkspace.summaryOpsHealthNode) {
            governanceWorkspace.summaryOpsHealthNode.textContent = FormatOpsHealthStatus(opsSummary);
        }
        if (governanceWorkspace.summaryOpsMailNode) {
            const pendingMailTaskCount = SafeNumber(opsSummary && opsSummary.pendingMailTaskCount);
            const failedMailTaskCount = SafeNumber(opsSummary && opsSummary.failedMailTaskCount);
            governanceWorkspace.summaryOpsMailNode.textContent = `${pendingMailTaskCount} / ${failedMailTaskCount}`;
        }
        if (governanceWorkspace.summaryOpsTimeoutSellerNode) {
            governanceWorkspace.summaryOpsTimeoutSellerNode.textContent = FormatNumber(
                opsSummary && opsSummary.timeoutPendingSellerConfirmOrderCount
            );
        }
        if (governanceWorkspace.summaryOpsTimeoutBuyerNode) {
            governanceWorkspace.summaryOpsTimeoutBuyerNode.textContent = FormatNumber(
                opsSummary && opsSummary.timeoutPendingBuyerConfirmOrderCount
            );
        }

        RenderRuleTable(governanceWorkspace.ruleTableBody, ruleConfigList);
        RenderProductGovernanceTable(governanceWorkspace.productTableBody, productListResult);
        RenderOrderGovernanceTable(governanceWorkspace.orderTableBody, adminOrderListResult);
        RenderAuditTable(governanceWorkspace.auditTableBody, auditLogListResult);
    }

    /**
     * 瑙ｆ瀽瑙勫垯璇存槑
     */
    function ResolveRuleDescription(ruleItem) {
        const ruleKey = String(ruleItem && ruleItem.ruleKey ? ruleItem.ruleKey : "").trim().toUpperCase();
        const mappedDescription = RULE_DESCRIPTION_TEXT_MAP[ruleKey];
        if (mappedDescription) {
            return mappedDescription;
        }
        const backendDescription = String(ruleItem && ruleItem.ruleDesc ? ruleItem.ruleDesc : "").trim();
        if (backendDescription) {
            return backendDescription;
        }
        return "暂无说明";
    }

    /**
     * 娓叉煋瑙勫垯琛?
     */
    function RenderRuleTable(ruleTableBody, ruleConfigList) {
        if (!ruleTableBody) {
            return;
        }
        const ruleList = Array.isArray(ruleConfigList) ? ruleConfigList : [];
        if (!ruleList.length) {
            ruleTableBody.innerHTML = "<tr><td colspan=\"4\" class=\"px-4 py-6 text-center text-xs text-slate-400\">暂无规则</td></tr>";
            return;
        }
        ruleTableBody.innerHTML = ruleList.slice(0, 10).map(function BuildRuleRow(ruleItem) {
            const ruleDescription = ResolveRuleDescription(ruleItem);
            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors\">",
                `<td class=\"px-4 py-3 text-xs text-on-surface font-semibold\">${EscapeHtml(ruleItem.ruleKey || "-")}</td>`,
                `<td class=\"px-4 py-3 text-xs text-on-surface-variant\">${EscapeHtml(ruleDescription)}</td>`,
                `<td class=\"px-4 py-3 text-xs text-on-surface-variant\">${EscapeHtml(ruleItem.ruleValue || "")}</td>`,
                "<td class=\"px-4 py-3 text-right\">",
                `<button data-governance-action=\"update-rule\" data-rule-key=\"${EscapeHtml(ruleItem.ruleKey || "")}\" data-rule-value=\"${EscapeHtml(ruleItem.ruleValue || "")}\" class=\"px-2 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20\">修改</button>`,
                "</td>",
                "</tr>"
            ].join("");
        }).join("");
    }

    /**
     * 娓叉煋鍟嗗搧娌荤悊琛?
     */
    function RenderProductGovernanceTable(productTableBody, productListResult) {
        if (!productTableBody) {
            return;
        }
        const productList = productListResult && Array.isArray(productListResult.productList)
            ? productListResult.productList
            : [];
        if (!productList.length) {
            productTableBody.innerHTML = "<tr><td colspan=\"3\" class=\"px-4 py-6 text-center text-xs text-slate-400\">暂无商品数据</td></tr>";
            return;
        }
        productTableBody.innerHTML = productList.map(function BuildProductRow(productItem) {
            const productStatus = String(productItem.productStatus || "UNKNOWN");
            const canOffline = productStatus !== "OFFLINE";
            const productId = SafeNumber(productItem.productId);
            const productDetailPath = `/pages/market_item_detail.html?productId=${encodeURIComponent(String(productId))}`;
            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors\">",
                `<td class=\"px-4 py-3 text-xs text-on-surface\">#${productId} ${EscapeHtml(productItem.title || "-")}</td>`,
                `<td class=\"px-4 py-3 text-xs text-on-surface-variant\">${EscapeHtml(productStatus)}</td>`,
                "<td class=\"px-4 py-3 text-right\">",
                `<a href="${productDetailPath}" target="_blank" class="inline-flex items-center px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 mr-2">查看详情</a>`,
                canOffline
                    ? `<button data-governance-action=\"product-offline\" data-product-id=\"${productId}\" class=\"px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100\">强制下架</button>`
                    : "<span class=\"text-xs text-slate-400\">已下架</span>",
                "</td>",
                "</tr>"
            ].join("");
        }).join("");
    }

    /**
     * 娓叉煋璁㈠崟娌荤悊琛?
     */
    function RenderOrderGovernanceTable(orderTableBody, adminOrderListResult) {
        if (!orderTableBody) {
            return;
        }
        const orderList = adminOrderListResult && Array.isArray(adminOrderListResult.orderList)
            ? adminOrderListResult.orderList
            : [];
        if (!orderList.length) {
            orderTableBody.innerHTML = "<tr><td colspan=\"3\" class=\"px-4 py-6 text-center text-xs text-slate-400\">暂无订单数据</td></tr>";
            return;
        }
        orderTableBody.innerHTML = orderList.map(function BuildOrderRow(orderItem) {
            const orderStatus = String(orderItem.orderStatus || "UNKNOWN");
            const canClose = IsOrderClosable(orderStatus);
            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors\">",
                `<td class=\"px-4 py-3 text-xs text-on-surface\">${EscapeHtml(orderItem.orderNo || `#${SafeNumber(orderItem.orderId)}`)}</td>`,
                `<td class=\"px-4 py-3 text-xs text-on-surface-variant\">${EscapeHtml(orderStatus)}</td>`,
                "<td class=\"px-4 py-3 text-right\">",
                canClose
                    ? `<button data-governance-action=\"order-close\" data-order-id=\"${SafeNumber(orderItem.orderId)}\" data-order-no=\"${EscapeHtml(orderItem.orderNo || "")}\" class=\"px-2 py-1 text-xs rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100\">强制关闭</button>`
                    : "<span class=\"text-xs text-slate-400\">不可关闭</span>",
                "</td>",
                "</tr>"
            ].join("");
        }).join("");
    }

    /**
     * 娓叉煋瀹¤琛?
     */
    function RenderAuditTable(auditTableBody, auditLogListResult) {
        if (!auditTableBody) {
            return;
        }
        const auditLogList = auditLogListResult && Array.isArray(auditLogListResult.auditLogList)
            ? auditLogListResult.auditLogList
            : [];
        if (!auditLogList.length) {
            auditTableBody.innerHTML = "<tr><td colspan=\"3\" class=\"px-4 py-6 text-center text-xs text-slate-400\">暂无审计日志</td></tr>";
            return;
        }
        auditTableBody.innerHTML = auditLogList.map(function BuildAuditRow(auditItem) {
            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors\">",
                `<td class=\"px-4 py-3 text-xs text-on-surface\">${EscapeHtml(auditItem.actionType || "-")} / ${EscapeHtml(auditItem.actionResult || "-")}</td>`,
                `<td class=\"px-4 py-3 text-xs text-on-surface-variant\">${EscapeHtml(auditItem.targetType || "-")} #${SafeNumber(auditItem.targetId)}</td>`,
                `<td class=\"px-4 py-3 text-xs text-slate-500\">${EscapeHtml(FormatTime(auditItem.createTime))}</td>`,
                "</tr>"
            ].join("");
        }).join("");
    }

    /**
     * 澶勭悊瑙勫垯鏇存柊
     */
    async function HandleRuleUpdateAction(actionButton) {
        const ruleKey = actionButton.getAttribute("data-rule-key") || "";
        const currentRuleValue = actionButton.getAttribute("data-rule-value") || "";
        if (!ruleKey) {
            throw new Error("规则键不存在");
        }
        const nextRuleValue = window.prompt(`请输入规则 ${ruleKey} 的新值`, currentRuleValue);
        if (nextRuleValue == null) {
            return;
        }
        await window.CampusShareApi.UpdateSystemRuleByAdmin(ruleKey, String(nextRuleValue).trim());
    }

    /**
     * 澶勭悊鍟嗗搧寮哄埗涓嬫灦
     */
    async function HandleProductOfflineAction(actionButton) {
        const productId = SafeNumber(actionButton.getAttribute("data-product-id"));
        if (!productId) {
            throw new Error("商品ID不存在");
        }
        if (!window.confirm(`确定强制下架商品 #${productId} 吗？`)) {
            return;
        }
        await window.CampusShareApi.OfflineProductByAdmin(productId, "后台治理强制下架");
    }

    /**
     * 澶勭悊璁㈠崟寮哄埗鍏抽棴
     */
    async function HandleOrderCloseAction(actionButton) {
        const orderId = SafeNumber(actionButton.getAttribute("data-order-id"));
        const orderNo = actionButton.getAttribute("data-order-no") || "";
        if (!orderId) {
            throw new Error("订单ID不存在");
        }
        if (!window.confirm(`确定强制关闭订单 ${orderNo || `#${orderId}`} 吗？`)) {
            return;
        }
        await window.CampusShareApi.CloseOrderByAdmin(orderId, "后台治理强制关闭");
    }

    /**
     * 鏄惁鍙叧闂鍗?
     */
    function IsOrderClosable(orderStatus) {
        return orderStatus === "PENDING_SELLER_CONFIRM"
            || orderStatus === "PENDING_OFFLINE_TRADE"
            || orderStatus === "PENDING_BUYER_CONFIRM";
    }

    /**
     * 鏍煎紡鍖栬繍琛屾€佸仴搴锋枃鏈?
     */
    function FormatOpsHealthStatus(opsSummary) {
        const overallStatus = String(opsSummary && opsSummary.overallStatus ? opsSummary.overallStatus : "UNKNOWN");
        const databaseStatus = String(opsSummary && opsSummary.databaseStatus ? opsSummary.databaseStatus : "UNKNOWN");
        const redisStatus = String(opsSummary && opsSummary.redisStatus ? opsSummary.redisStatus : "UNKNOWN");
        return `${overallStatus} (DB:${databaseStatus} / Redis:${redisStatus})`;
    }

    /**
     * 鍒涘缓鎻愮ず鏍?
     */
    function CreateMessageBar(pageHeader) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant mb-6";
        messageBar.style.display = "none";
        pageHeader.insertAdjacentElement("afterend", messageBar);
        return messageBar;
    }

    /**
     * 鏄剧ず鎴愬姛鎻愮ず
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 mb-6";
        messageBar.textContent = message;
    }

    /**
     * 鏄剧ず閿欒鎻愮ず
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 mb-6";
        messageBar.textContent = message;
    }

    /**
     * 闅愯棌鎻愮ず
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    /**
     * 鏍煎紡鍖栨椂闂?
     */
    function FormatTime(timeText) {
        if (!timeText) {
            return "-";
        }
        const timeValue = new Date(timeText);
        if (Number.isNaN(timeValue.getTime())) {
            return String(timeText);
        }
        return `${timeValue.getFullYear()}-${PadTime(timeValue.getMonth() + 1)}-${PadTime(timeValue.getDate())} ${PadTime(timeValue.getHours())}:${PadTime(timeValue.getMinutes())}`;
    }

    /**
     * 琛ラ浂
     */
    function PadTime(value) {
        return value < 10 ? `0${value}` : `${value}`;
    }

    /**
     * 鏃堕棿鍊?
     */
    function ResolveTimeValue(timeText) {
        if (!timeText) {
            return 0;
        }
        const timeValue = new Date(timeText).getTime();
        if (Number.isNaN(timeValue)) {
            return 0;
        }
        return timeValue;
    }

    /**
     * 瀹夊叏鏁板€?
     */
    function SafeNumber(value) {
        const numberValue = Number(value || 0);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }

    /**
     * 鏁板瓧鏍煎紡鍖?
     */
    function FormatNumber(value) {
        return SafeNumber(value).toLocaleString("zh-CN");
    }

    /**
     * 閲戦鏍煎紡鍖?
     */
    function FormatPrice(value) {
        const priceValue = Number(value || 0);
        if (Number.isNaN(priceValue)) {
            return "0.00";
        }
        return priceValue.toFixed(2);
    }

    /**
     * 鏂囨湰杞箟
     */
    function EscapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    document.addEventListener("DOMContentLoaded", BindAdminDashboardPage);
})();

