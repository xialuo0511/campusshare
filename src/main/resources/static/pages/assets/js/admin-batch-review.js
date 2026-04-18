/**
 * 管理批量审核页面逻辑
 */
(function InitAdminBatchReviewPage() {
    /**
     * 绑定页面
     */
    async function BindAdminBatchReviewPage() {
        if (!window.CampusShareApi) {
            return;
        }
        const hasToken = !!window.CampusShareApi.GetAuthToken();
        if (!hasToken) {
            window.CampusShareApi.RedirectToAuthPage("/pages/admin_batch_review.html");
            return;
        }

        const hasAdminAccess = await window.CampusShareApi.EnsureAdminSession();
        if (!hasAdminAccess) {
            window.location.href = "/pages/market_overview.html";
            return;
        }

        const mainElement = document.querySelector("main");
        if (!mainElement) {
            return;
        }

        const tableBody = mainElement.querySelector("tbody");
        const statValueNodeList = Array.from(mainElement.querySelectorAll(".grid.grid-cols-4 .text-2xl.font-bold"));
        const refreshButton = mainElement.querySelector("button.bg-primary");
        const messageBar = BuildMessageBar(mainElement, tableBody);

        if (!tableBody || statValueNodeList.length < 4) {
            return;
        }

        tableBody.addEventListener("click", async function HandleActionClick(event) {
            const actionButton = event.target.closest("button[data-action]");
            if (!actionButton) {
                return;
            }
            const action = actionButton.getAttribute("data-action") || "";
            const itemType = actionButton.getAttribute("data-type") || "";
            const itemId = Number(actionButton.getAttribute("data-id") || "0");
            const recruitmentId = Number(actionButton.getAttribute("data-recruitment-id") || "0");
            if (!itemId && action !== "detail") {
                return;
            }

            actionButton.disabled = true;
            try {
                if (action === "approve-user" && itemType === "USER") {
                    await window.CampusShareApi.ReviewUser(itemId, true, "批量审核通过");
                    ShowSuccess(messageBar, "用户已通过审核");
                } else if (action === "reject-user" && itemType === "USER") {
                    await window.CampusShareApi.ReviewUser(itemId, false, "批量审核驳回");
                    ShowSuccess(messageBar, "用户已驳回");
                } else if (action === "approve-report" && itemType === "REPORT") {
                    await window.CampusShareApi.ReviewReport(itemId, true, "", "批量审核通过");
                    ShowSuccess(messageBar, "举报已处理");
                } else if (action === "reject-report" && itemType === "REPORT") {
                    await window.CampusShareApi.ReviewReport(itemId, false, "", "批量审核驳回");
                    ShowSuccess(messageBar, "举报已驳回");
                } else if (action === "approve-application" && itemType === "TEAM_APPLICATION") {
                    await window.CampusShareApi.ApproveTeamRecruitmentApplication(recruitmentId, itemId, "批量审核通过");
                    ShowSuccess(messageBar, "招募申请已通过");
                } else if (action === "reject-application" && itemType === "TEAM_APPLICATION") {
                    await window.CampusShareApi.RejectTeamRecruitmentApplication(recruitmentId, itemId, "批量审核驳回");
                    ShowSuccess(messageBar, "招募申请已驳回");
                } else if (action === "approve-material" && itemType === "MATERIAL") {
                    await window.CampusShareApi.ReviewMaterial(itemId, true, "批量审核通过");
                    ShowSuccess(messageBar, "资料已通过审核");
                } else if (action === "reject-material" && itemType === "MATERIAL") {
                    await window.CampusShareApi.ReviewMaterial(itemId, false, "批量审核驳回");
                    ShowSuccess(messageBar, "资料已驳回");
                } else if (action === "detail") {
                    if (itemType === "USER") {
                        window.location.href = "/pages/admin_dashboard.html";
                    } else if (itemType === "REPORT") {
                        window.location.href = "/pages/admin_dashboard.html";
                    } else if (itemType === "TEAM_APPLICATION") {
                        window.location.href = "/pages/recruitment_board.html";
                    } else if (itemType === "MATERIAL") {
                        window.location.href = "/pages/admin_dashboard.html";
                    }
                    return;
                }

                await LoadReviewData(tableBody, statValueNodeList, messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "审核操作失败");
            } finally {
                actionButton.disabled = false;
            }
        });

        if (refreshButton) {
            refreshButton.addEventListener("click", function HandleRefreshClick() {
                LoadReviewData(tableBody, statValueNodeList, messageBar);
            });
        }

        LoadReviewData(tableBody, statValueNodeList, messageBar);
    }

    /**
     * 加载审核数据
     */
    async function LoadReviewData(tableBody, statValueNodeList, messageBar) {
        try {
            const resultList = await Promise.all([
                window.CampusShareApi.ListPendingUsers(),
                window.CampusShareApi.ListPendingReports(),
                window.CampusShareApi.ListPendingTeamRecruitmentApplications(),
                window.CampusShareApi.ListPendingMaterials(1, 100)
            ]);
            const pendingUserList = Array.isArray(resultList[0]) ? resultList[0] : [];
            const pendingReportList = Array.isArray(resultList[1]) ? resultList[1] : [];
            const pendingApplicationList = Array.isArray(resultList[2]) ? resultList[2] : [];
            const pendingMaterialList = resultList[3] && Array.isArray(resultList[3].materialList)
                ? resultList[3].materialList
                : [];

            PatchStats(statValueNodeList, pendingUserList, pendingReportList, pendingApplicationList, pendingMaterialList);
            RenderTable(tableBody, pendingUserList, pendingReportList, pendingApplicationList, pendingMaterialList);
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "审核数据加载失败");
            tableBody.innerHTML = "<tr><td colspan=\"6\" class=\"px-6 py-8 text-center text-red-600\">加载失败，请稍后重试</td></tr>";
        }
    }

    /**
     * 更新统计
     */
    function PatchStats(
        statValueNodeList,
        pendingUserList,
        pendingReportList,
        pendingApplicationList,
        pendingMaterialList
    ) {
        const totalCount = pendingUserList.length
            + pendingReportList.length
            + pendingApplicationList.length
            + pendingMaterialList.length;
        statValueNodeList[0].textContent = String(totalCount);
        statValueNodeList[1].textContent = String(pendingUserList.length);
        statValueNodeList[2].textContent = String(pendingApplicationList.length);
        statValueNodeList[3].textContent = String(pendingReportList.length + pendingMaterialList.length);
    }

    /**
     * 渲染表格
     */
    function RenderTable(
        tableBody,
        pendingUserList,
        pendingReportList,
        pendingApplicationList,
        pendingMaterialList
    ) {
        const rowList = [];

        pendingUserList.forEach(function BuildUserRow(userItem) {
            rowList.push({
                type: "USER",
                icon: "person",
                title: `${userItem.displayName || userItem.account || "未知用户"}（${userItem.account || "-"}）`,
                subtitle: userItem.contact || "无联系方式",
                category: "User",
                timeText: FormatTime(userItem.registerTime),
                statusText: "Pending",
                id: userItem.userId,
                recruitmentId: 0
            });
        });

        pendingReportList.forEach(function BuildReportRow(reportItem) {
            rowList.push({
                type: "REPORT",
                icon: "report_problem",
                title: reportItem.reportReason || "未填写举报原因",
                subtitle: `目标 ${reportItem.targetType || "-"} #${reportItem.targetId || "-"}`,
                category: "Report",
                timeText: FormatTime(reportItem.createTime),
                statusText: "Urgent",
                id: reportItem.reportId,
                recruitmentId: 0
            });
        });

        pendingApplicationList.forEach(function BuildApplicationRow(applicationItem) {
            rowList.push({
                type: "TEAM_APPLICATION",
                icon: "groups",
                title: applicationItem.applicantDisplayName || `申请人 #${applicationItem.applicantUserId || "-"}`,
                subtitle: applicationItem.applicationReason || "未填写申请说明",
                category: "Recruitment",
                timeText: FormatTime(applicationItem.applyTime),
                statusText: "Under Review",
                id: applicationItem.applicationId,
                recruitmentId: applicationItem.recruitmentId || 0
            });
        });

        pendingMaterialList.forEach(function BuildMaterialRow(materialItem) {
            rowList.push({
                type: "MATERIAL",
                icon: "description",
                title: materialItem.courseName || `资料 #${materialItem.materialId || "-"}`,
                subtitle: `上传者 #${materialItem.uploaderUserId || "-"} · ${materialItem.fileType || "-"}`,
                category: "Material",
                timeText: FormatTime(materialItem.createTime),
                statusText: "Pending",
                id: materialItem.materialId,
                recruitmentId: 0
            });
        });

        if (!rowList.length) {
            tableBody.innerHTML = "<tr><td colspan=\"6\" class=\"px-6 py-8 text-center text-slate-500\">暂无待审核数据</td></tr>";
            return;
        }

        tableBody.innerHTML = rowList.map(function BuildRow(rowItem) {
            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors\">",
                "<td class=\"px-6 py-4\"><input type=\"checkbox\" class=\"rounded-sm border-outline-variant focus:ring-primary text-primary\"/></td>",
                "<td class=\"px-6 py-4\">",
                "<div class=\"flex items-center gap-3\">",
                `<div class=\"w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center text-primary\"><span class=\"material-symbols-outlined text-sm\">${rowItem.icon}</span></div>`,
                "<div>",
                `<div class=\"font-semibold text-on-surface\">${EscapeHtml(rowItem.title)}</div>`,
                `<div class=\"text-xs text-on-surface-variant\">${EscapeHtml(rowItem.subtitle)}</div>`,
                "</div>",
                "</div>",
                "</td>",
                `<td class=\"px-6 py-4 text-on-surface-variant italic\">${EscapeHtml(rowItem.category)}</td>`,
                `<td class=\"px-6 py-4 text-on-surface-variant\">${EscapeHtml(rowItem.timeText)}</td>`,
                `<td class=\"px-6 py-4\"><span class=\"px-2 py-1 rounded-full text-[10px] font-bold ${ResolveStatusClass(rowItem.statusText)}\">${EscapeHtml(rowItem.statusText)}</span></td>`,
                "<td class=\"px-6 py-4\">",
                "<div class=\"flex items-center gap-2\">",
                `<button data-action=\"detail\" data-type=\"${rowItem.type}\" data-id=\"${rowItem.id}\" data-recruitment-id=\"${rowItem.recruitmentId}\" class=\"text-primary hover:underline font-medium\">详情</button>`,
                `<button data-action=\"${ResolveApproveAction(rowItem.type)}\" data-type=\"${rowItem.type}\" data-id=\"${rowItem.id}\" data-recruitment-id=\"${rowItem.recruitmentId}\" class=\"text-green-700 hover:underline font-medium\">通过</button>`,
                `<button data-action=\"${ResolveRejectAction(rowItem.type)}\" data-type=\"${rowItem.type}\" data-id=\"${rowItem.id}\" data-recruitment-id=\"${rowItem.recruitmentId}\" class=\"text-red-700 hover:underline font-medium\">驳回</button>`,
                "</div>",
                "</td>",
                "</tr>"
            ].join("");
        }).join("");
    }

    /**
     * 通过动作
     */
    function ResolveApproveAction(itemType) {
        if (itemType === "USER") {
            return "approve-user";
        }
        if (itemType === "REPORT") {
            return "approve-report";
        }
        if (itemType === "MATERIAL") {
            return "approve-material";
        }
        return "approve-application";
    }

    /**
     * 驳回动作
     */
    function ResolveRejectAction(itemType) {
        if (itemType === "USER") {
            return "reject-user";
        }
        if (itemType === "REPORT") {
            return "reject-report";
        }
        if (itemType === "MATERIAL") {
            return "reject-material";
        }
        return "reject-application";
    }

    /**
     * 状态样式
     */
    function ResolveStatusClass(statusText) {
        if (statusText === "Urgent") {
            return "bg-error-container text-on-error-container";
        }
        if (statusText === "Under Review") {
            return "bg-surface-container-high text-on-surface-variant";
        }
        return "bg-secondary-container text-on-secondary-container";
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
        return `${timeValue.getFullYear()}-${PadTime(timeValue.getMonth() + 1)}-${PadTime(timeValue.getDate())} ${PadTime(timeValue.getHours())}:${PadTime(timeValue.getMinutes())}`;
    }

    /**
     * 时间补零
     */
    function PadTime(value) {
        return value < 10 ? `0${value}` : `${value}`;
    }

    /**
     * 转义
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
     * 构建消息栏
     */
    function BuildMessageBar(mainElement, tableBody) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4";
        messageBar.style.display = "none";
        const tableWrapper = tableBody.closest("div.bg-surface-container-lowest.rounded-xl");
        if (tableWrapper) {
            mainElement.insertBefore(messageBar, tableWrapper);
        } else {
            mainElement.insertBefore(messageBar, mainElement.firstChild);
        }
        return messageBar;
    }

    /**
     * 成功消息
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4 border border-green-200 bg-green-50 text-green-700";
        messageBar.textContent = message;
    }

    /**
     * 错误消息
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4 border border-red-200 bg-red-50 text-red-700";
        messageBar.textContent = message;
    }

    /**
     * 隐藏消息
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindAdminBatchReviewPage);
})();
