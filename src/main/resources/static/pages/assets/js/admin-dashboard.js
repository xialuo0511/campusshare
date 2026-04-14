/**
 * 管理后台页面逻辑
 */
(function InitAdminDashboardPage() {
    const DEFAULT_ORDER_PAGE_SIZE = 10;
    const DEFAULT_TASK_PAGE_SIZE = 8;

    /**
     * 绑定页面行为
     */
    function BindAdminDashboardPage() {
        if (!window.CampusShareApi) {
            return;
        }

        const pageHeader = document.querySelector("main > header");
        const statCardList = document.querySelectorAll("section.grid.grid-cols-1.md\\:grid-cols-4 > div");
        const reviewPanel = document.querySelector("section.lg\\:col-span-2.bg-surface-container-lowest");
        const reviewTableBody = reviewPanel ? reviewPanel.querySelector("table tbody.divide-y") : null;
        if (!pageHeader || statCardList.length < 4 || !reviewPanel || !reviewTableBody) {
            return;
        }

        const messageBar = CreateMessageBar(pageHeader);
        const profile = window.CampusShareApi.GetCurrentUserProfile();
        if (!profile || !profile.userId) {
            ShowError(messageBar, "请先登录管理员账号后再访问后台");
            window.location.href = "/pages/auth_access.html";
            return;
        }
        if (profile.userRole !== "ADMINISTRATOR") {
            ShowError(messageBar, "当前账号不是管理员，无法访问后台");
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

        BindReviewTableActions(reviewTableBody, statCardList, reviewState, taskPager, messageBar);
        LoadDashboardData(statCardList, reviewTableBody, reviewState, taskPager, messageBar);
    }

    /**
     * 加载后台数据
     */
    async function LoadDashboardData(statCardList, reviewTableBody, reviewState, taskPager, messageBar) {
        try {
            const [
                marketOverview,
                teamRecruitmentList,
                pendingReportList,
                pendingUserList,
                pendingTeamApplicationList,
                orderListResult
            ] = await Promise.all([
                window.CampusShareApi.GetMarketOverview(),
                window.CampusShareApi.ListTeamRecruitments({ pageNo: 1, pageSize: 1 }),
                window.CampusShareApi.ListPendingReports(),
                window.CampusShareApi.ListPendingUsers(),
                window.CampusShareApi.ListPendingTeamRecruitmentApplications(),
                window.CampusShareApi.ListMyOrders(1, DEFAULT_ORDER_PAGE_SIZE)
            ]);

            RenderStats(
                statCardList,
                marketOverview,
                teamRecruitmentList,
                pendingReportList,
                orderListResult
            );

            reviewState.reviewTaskList = BuildReviewTaskList(
                pendingReportList,
                pendingUserList,
                pendingTeamApplicationList
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
        marketOverview,
        teamRecruitmentList,
        pendingReportList,
        orderListResult
    ) {
        const publishedProductCount = SafeNumber(marketOverview && marketOverview.publishedProductCount);
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

        const pendingReportCount = Array.isArray(pendingReportList) ? pendingReportList.length : 0;
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

        const totalOrderCount = SafeNumber(orderListResult && orderListResult.totalCount);
        const recentOrderNumber = recentOrderCard.querySelector("h2");
        if (recentOrderNumber) {
            recentOrderNumber.textContent = FormatNumber(totalOrderCount);
        }
        const recentOrderHint = recentOrderCard.querySelector("p.text-xs");
        if (recentOrderHint) {
            const ongoingCount = SafeNumber(orderListResult && orderListResult.ongoingCount);
            const completedCount = SafeNumber(orderListResult && orderListResult.completedCount);
            recentOrderHint.innerHTML = `进行中：<span class=\"font-semibold\">${ongoingCount}</span>，已完成：<span class=\"font-semibold\">${completedCount}</span>`;
        }
    }

    /**
     * 构建审核任务
     */
    function BuildReviewTaskList(pendingReportList, pendingUserList, pendingTeamApplicationList) {
        const reportTaskList = BuildReportReviewTaskList(pendingReportList);
        const userTaskList = BuildUserReviewTaskList(pendingUserList);
        const teamTaskList = BuildTeamApplicationReviewTaskList(pendingTeamApplicationList);
        return reportTaskList.concat(userTaskList).concat(teamTaskList)
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
                    : `组队申请 #${taskItem.taskId} (招募 #${taskItem.recruitmentId})`);
            const resourceMeta = taskItem.taskType === "REPORT"
                ? `${taskItem.targetType} #${taskItem.targetId}`
                : (taskItem.taskType === "USER"
                    ? `${taskItem.college || "-"} · ${taskItem.grade || "-"}`
                    : (taskItem.applyRemark || "未填写申请备注"));
            const contributor = taskItem.taskType === "REPORT"
                ? `举报人ID: ${taskItem.reporterUserId}`
                : (taskItem.taskType === "USER"
                    ? (taskItem.displayName || taskItem.account || `用户#${taskItem.taskId}`)
                    : (taskItem.applicantDisplayName || `申请人#${taskItem.applicantUserId}`));
            const statusText = taskItem.taskType === "REPORT"
                ? "举报待审"
                : (taskItem.taskType === "USER" ? "用户待审" : "申请待审");
            const statusClass = taskItem.taskType === "REPORT"
                ? "bg-secondary-container text-on-secondary-container"
                : (taskItem.taskType === "USER"
                    ? "bg-surface-container text-slate-600"
                    : "bg-primary/10 text-primary");
            const iconName = taskItem.taskType === "REPORT"
                ? "gavel"
                : (taskItem.taskType === "USER" ? "badge" : "groups");
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
                taskItem.grade || ""
            ].join(" ").toLowerCase();
            return searchText.includes(keyword);
        });
    }

    /**
     * 绑定审核操作
     */
    function BindReviewTableActions(reviewTableBody, statCardList, reviewState, taskPager, messageBar) {
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
                        approved ? "保留" : "驳回",
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
                } else {
                    return;
                }
                ShowSuccess(messageBar, approved ? "审核已通过" : "审核已驳回");
                await LoadDashboardData(statCardList, reviewTableBody, reviewState, taskPager, messageBar);
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
