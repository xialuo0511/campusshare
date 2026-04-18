/**
 * 管理后台页面逻辑
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
     * 绑定页面行为
     */
    async function BindAdminDashboardPage() {
        if (!window.CampusShareApi) {
            return;
        }

        const pageHeader = document.querySelector("main > header");
        const statCardList = document.querySelectorAll("section.grid.grid-cols-1.md\\:grid-cols-4 > div");
        const reviewPanel = document.querySelector("section.lg\\:col-span-2.bg-surface-container-lowest");
        const reviewTableBody = reviewPanel ? reviewPanel.querySelector("table tbody.divide-y") : null;
        if (!pageHeader || statCardList.length < 3 || !reviewPanel || !reviewTableBody) {
            return;
        }

        const messageBar = CreateMessageBar(pageHeader);
        const governanceWorkspace = CreateGovernanceWorkspace();
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

        const taskToolbar = CreateTaskToolbar(reviewPanel);
        const taskPager = CreateTaskPager(reviewPanel);
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
            governanceWorkspace
        );
        BindGovernanceWorkspaceActions(governanceWorkspace, messageBar, function ReloadDashboardData() {
            return LoadDashboardData(
                statCardList,
                reviewTableBody,
                reviewState,
                taskPager,
                messageBar,
                governanceWorkspace
            );
        });
        LoadDashboardData(statCardList, reviewTableBody, reviewState, taskPager, messageBar, governanceWorkspace);
    }

    /**
     * 加载后台数据
     */
    async function LoadDashboardData(
        statCardList,
        reviewTableBody,
        reviewState,
        taskPager,
        messageBar,
        governanceWorkspace
    ) {
        try {
            const [
                dashboardSummary,
                marketOverview,
                teamRecruitmentList,
                pendingReportList,
                pendingUserList,
                pendingTeamApplicationList,
                pendingMaterialListResult,
                pendingProductListResult,
                orderListResult,
                ruleConfigList,
                productListResult,
                adminOrderListResult,
                auditLogListResult,
                opsSummary
            ] = await Promise.all([
                window.CampusShareApi.GetAdminDashboardSummary(),
                window.CampusShareApi.GetMarketOverview(),
                window.CampusShareApi.ListTeamRecruitments({ pageNo: 1, pageSize: 1 }),
                window.CampusShareApi.ListPendingReports(),
                window.CampusShareApi.ListPendingUsers(),
                window.CampusShareApi.ListPendingTeamRecruitmentApplications(),
                window.CampusShareApi.ListPendingMaterials(1, DEFAULT_PENDING_MATERIAL_FETCH_SIZE),
                window.CampusShareApi.ListPendingProductsByAdmin(1, DEFAULT_PENDING_PRODUCT_FETCH_SIZE),
                window.CampusShareApi.ListOrdersByAdmin(1, DEFAULT_ORDER_PAGE_SIZE, "ALL"),
                window.CampusShareApi.ListSystemRulesByAdmin(),
                window.CampusShareApi.ListProductsByAdmin({ pageNo: 1, pageSize: 6 }),
                window.CampusShareApi.ListOrdersByAdmin(1, 6, "ALL"),
                window.CampusShareApi.ListAuditLogsByAdmin({ pageNo: 1, pageSize: 8 }),
                window.CampusShareApi.GetAdminOpsSummary()
            ]);

            RenderStats(
                statCardList,
                dashboardSummary,
                marketOverview,
                teamRecruitmentList,
                pendingReportList,
                orderListResult
            );
            RenderGovernanceWorkspace(
                governanceWorkspace,
                dashboardSummary,
                ruleConfigList,
                productListResult,
                adminOrderListResult,
                auditLogListResult,
                opsSummary
            );

            reviewState.reviewTaskList = BuildReviewTaskList(
                pendingReportList,
                pendingUserList,
                pendingTeamApplicationList,
                pendingMaterialListResult,
                pendingProductListResult
            );
            reviewState.pageNo = 1;
            RenderReviewTableByState(reviewTableBody, reviewState, taskPager);
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "后台数据加载失败");
        }
    }

    /**
     * 渲染统计卡片
     */
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

    /**
     * 构建审核任务
     */
    function BuildReviewTaskList(
        pendingReportList,
        pendingUserList,
        pendingTeamApplicationList,
        pendingMaterialListResult,
        pendingProductListResult
    ) {
        const reportTaskList = BuildReportReviewTaskList(pendingReportList);
        const userTaskList = BuildUserReviewTaskList(pendingUserList);
        const teamTaskList = BuildTeamApplicationReviewTaskList(pendingTeamApplicationList);
        const materialTaskList = BuildMaterialReviewTaskList(pendingMaterialListResult);
        const productTaskList = BuildProductReviewTaskList(pendingProductListResult);
        return reportTaskList.concat(userTaskList).concat(teamTaskList).concat(materialTaskList).concat(productTaskList)
            .sort(function SortReviewTask(a, b) {
                return ResolveTimeValue(b.createTime) - ResolveTimeValue(a.createTime);
            });
    }

    /**
     * 按状态渲染审核表
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
            const resourceTitle = taskItem.taskType === "REPORT"
                ? `举报 #${taskItem.taskId} (${taskItem.reason})`
                : (taskItem.taskType === "USER"
                    ? `用户审核 #${taskItem.taskId} (${taskItem.account})`
                    : (taskItem.taskType === "TEAM"
                        ? `组队申请 #${taskItem.taskId} (招募 #${taskItem.recruitmentId})`
                        : (taskItem.taskType === "MATERIAL"
                            ? `资料审核 #${taskItem.taskId} (${taskItem.courseName || "-"})`
                            : `商品审核 #${taskItem.taskId} (${taskItem.title || "-"})`)));
            const resourceMeta = taskItem.taskType === "REPORT"
                ? `${taskItem.targetType} #${taskItem.targetId}`
                : (taskItem.taskType === "USER"
                    ? `${taskItem.college || "-"} · ${taskItem.grade || "-"}`
                    : (taskItem.taskType === "TEAM"
                        ? (taskItem.applyRemark || "未填写申请备注")
                        : (taskItem.taskType === "MATERIAL"
                            ? `文件: ${taskItem.fileType || "-"} · ${SafeNumber(taskItem.fileSizeBytes)} bytes`
                            : `${taskItem.category || "-"} · ${taskItem.conditionLevel || "-"} · ¥${FormatPrice(taskItem.price)}`)));
            const contributor = taskItem.taskType === "REPORT"
                ? `举报人ID: ${taskItem.reporterUserId}`
                : (taskItem.taskType === "USER"
                    ? (taskItem.displayName || taskItem.account || `用户#${taskItem.taskId}`)
                    : (taskItem.taskType === "TEAM"
                        ? (taskItem.applicantDisplayName || `申请人#${taskItem.applicantUserId}`)
                        : (taskItem.taskType === "MATERIAL"
                            ? `上传者ID: ${taskItem.uploaderUserId || "-"}`
                            : (taskItem.sellerDisplayName || `卖家ID: ${taskItem.sellerUserId || "-"}`))));
            const statusText = taskItem.taskType === "REPORT"
                ? "举报待审"
                : (taskItem.taskType === "USER"
                    ? "用户待审"
                    : (taskItem.taskType === "TEAM" ? "申请待审" : (taskItem.taskType === "MATERIAL" ? "资料待审" : "商品待审")));
            const statusClass = taskItem.taskType === "REPORT"
                ? "bg-secondary-container text-on-secondary-container"
                : (taskItem.taskType === "USER"
                    ? "bg-surface-container text-slate-600"
                    : (taskItem.taskType === "TEAM"
                        ? "bg-primary/10 text-primary"
                        : (taskItem.taskType === "MATERIAL" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")));
            const iconName = taskItem.taskType === "REPORT"
                ? "gavel"
                : (taskItem.taskType === "USER"
                    ? "badge"
                    : (taskItem.taskType === "TEAM" ? "groups" : (taskItem.taskType === "MATERIAL" ? "description" : "storefront")));
            const recruitmentIdValue = taskItem.recruitmentId || "";

            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors group\">",
                "<td class=\"px-6 py-4\">",
                "<div class=\"flex items-center gap-3\">",
                "<div class=\"w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center\">",
                `<span class=\"material-symbols-outlined text-outline\">${iconName}</span>`,
                "</div>",
                "<div>",
                `<p class=\"text-sm font-semibold text-on-surface\">${EscapeHtml(resourceTitle)}</p>`,
                `<p class=\"text-xs text-slate-400\">${EscapeHtml(resourceMeta)}</p>`,
                "</div></div></td>",
                `<td class=\"px-6 py-4 text-sm text-on-surface-variant\">${EscapeHtml(contributor)}</td>`,
                `<td class=\"px-6 py-4 text-sm text-on-surface-variant\">${EscapeHtml(FormatTime(taskItem.createTime))}</td>`,
                `<td class=\"px-6 py-4\"><span class=\"${statusClass} text-[10px] font-bold px-2 py-0.5 rounded-full\">${EscapeHtml(statusText)}</span></td>`,
                "<td class=\"px-6 py-4 text-right\">",
                "<div class=\"flex justify-end gap-2\">",
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
     * 过滤任务
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
                String(taskItem.sellerUserId || "")
            ].join(" ").toLowerCase();
            return searchText.includes(keyword);
        });
    }

    /**
     * 绑定审核操作
     */
    function BindReviewTableActions(
        reviewTableBody,
        statCardList,
        reviewState,
        taskPager,
        messageBar,
        governanceWorkspace
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
                    governanceWorkspace
                );
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "审核操作失败");
            } finally {
                actionButton.disabled = false;
            }
        });
    }

    /**
     * 创建工具栏
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
            "<option value=\"MATERIAL\">资料审核</option>",
            "<option value=\"PRODUCT\">商品审核</option>",
            "</select>",
            "</div>",
            "<div class=\"flex items-center gap-2\">",
            "<input data-task-keyword-input type=\"text\" class=\"px-3 py-1.5 text-xs rounded-md bg-white border border-slate-200 w-52\" placeholder=\"按ID/账号/分类搜索\"/>",
            "<button data-task-refresh class=\"px-3 py-1.5 text-xs rounded-md bg-surface-container text-slate-700 font-semibold hover:bg-surface-container-high\">重置</button>",
            "</div>"
        ].join("");
        panelHeader.insertAdjacentElement("afterend", toolbar);
        return {
            wrapper: toolbar,
            typeFilterSelect: toolbar.querySelector("[data-task-type-filter]"),
            keywordInput: toolbar.querySelector("[data-task-keyword-input]"),
            refreshButton: toolbar.querySelector("[data-task-refresh]")
        };
    }

    /**
     * 绑定工具栏
     */
    function BindTaskToolbarActions(taskToolbar, reviewState, onChange) {
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
     * 创建分页栏
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
     * 绑定分页栏
     */
    function BindTaskPagerActions(taskPager, reviewState, onPageChange) {
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
     * 更新分页信息
     */
    function UpdateTaskPager(taskPager, pageNo, pageTotal, totalCount, startNo, endNo) {
        taskPager.pageInfo.textContent = totalCount <= 0
            ? "暂无记录"
            : `显示 ${totalCount} 条中的 ${startNo}-${endNo}，第 ${pageNo}/${pageTotal} 页`;
        taskPager.prevButton.disabled = pageNo <= 1;
        taskPager.nextButton.disabled = pageNo >= pageTotal;
        taskPager.prevButton.classList.toggle("opacity-50", taskPager.prevButton.disabled);
        taskPager.nextButton.classList.toggle("opacity-50", taskPager.nextButton.disabled);
    }

    /**
     * 构建举报任务列表
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
     * 构建用户任务列表
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
     * 构建组队申请任务列表
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
     * 构建资料审核任务列表
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
     * 构建商品审核任务列表
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
     * 创建治理工作区
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
            "<div class=\"rounded-lg bg-surface-container-low p-3\"><p class=\"text-slate-500\">待审核用户</p><p data-role=\"summary-user-pending\" class=\"text-lg font-bold text-primary\">0</p></div>",
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
            "<div class=\"max-h-80 overflow-auto\">",
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
            "<div class=\"max-h-80 overflow-auto\">",
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
            "<div class=\"max-h-80 overflow-auto\">",
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
            "<div class=\"max-h-80 overflow-auto\">",
            "<table class=\"w-full text-left border-collapse\">",
            "<thead class=\"bg-surface-container-low text-xs uppercase tracking-widest text-on-surface-variant\"><tr><th class=\"px-4 py-3\">动作</th><th class=\"px-4 py-3\">对象</th><th class=\"px-4 py-3\">时间</th></tr></thead>",
            "<tbody data-role=\"audit-table\" class=\"divide-y divide-surface-container\"></tbody>",
            "</table>",
            "</div>",
            "</div>"
        ].join("");
        mainElement.appendChild(workspaceElement);
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
     * 绑定治理工作区事件
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
     * 渲染治理工作区
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
     * 解析规则说明
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
     * 渲染规则表
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
     * 渲染商品治理表
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
            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors\">",
                `<td class=\"px-4 py-3 text-xs text-on-surface\">#${SafeNumber(productItem.productId)} ${EscapeHtml(productItem.title || "-")}</td>`,
                `<td class=\"px-4 py-3 text-xs text-on-surface-variant\">${EscapeHtml(productStatus)}</td>`,
                "<td class=\"px-4 py-3 text-right\">",
                canOffline
                    ? `<button data-governance-action=\"product-offline\" data-product-id=\"${SafeNumber(productItem.productId)}\" class=\"px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100\">强制下架</button>`
                    : "<span class=\"text-xs text-slate-400\">已下架</span>",
                "</td>",
                "</tr>"
            ].join("");
        }).join("");
    }

    /**
     * 渲染订单治理表
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
     * 渲染审计表
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
     * 处理规则更新
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
     * 处理商品强制下架
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
     * 处理订单强制关闭
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
     * 是否可关闭订单
     */
    function IsOrderClosable(orderStatus) {
        return orderStatus === "PENDING_SELLER_CONFIRM"
            || orderStatus === "PENDING_OFFLINE_TRADE"
            || orderStatus === "PENDING_BUYER_CONFIRM";
    }

    /**
     * 格式化运行态健康文本
     */
    function FormatOpsHealthStatus(opsSummary) {
        const overallStatus = String(opsSummary && opsSummary.overallStatus ? opsSummary.overallStatus : "UNKNOWN");
        const databaseStatus = String(opsSummary && opsSummary.databaseStatus ? opsSummary.databaseStatus : "UNKNOWN");
        const redisStatus = String(opsSummary && opsSummary.redisStatus ? opsSummary.redisStatus : "UNKNOWN");
        return `${overallStatus} (DB:${databaseStatus} / Redis:${redisStatus})`;
    }

    /**
     * 创建提示栏
     */
    function CreateMessageBar(pageHeader) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant mb-6";
        messageBar.style.display = "none";
        pageHeader.insertAdjacentElement("afterend", messageBar);
        return messageBar;
    }

    /**
     * 显示成功提示
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 mb-6";
        messageBar.textContent = message;
    }

    /**
     * 显示错误提示
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 mb-6";
        messageBar.textContent = message;
    }

    /**
     * 隐藏提示
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    /**
     * 格式化时间
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
     * 补零
     */
    function PadTime(value) {
        return value < 10 ? `0${value}` : `${value}`;
    }

    /**
     * 时间值
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
     * 安全数值
     */
    function SafeNumber(value) {
        const numberValue = Number(value || 0);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }

    /**
     * 数字格式化
     */
    function FormatNumber(value) {
        return SafeNumber(value).toLocaleString("zh-CN");
    }

    /**
     * 金额格式化
     */
    function FormatPrice(value) {
        const priceValue = Number(value || 0);
        if (Number.isNaN(priceValue)) {
            return "0.00";
        }
        return priceValue.toFixed(2);
    }

    /**
     * 文本转义
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
