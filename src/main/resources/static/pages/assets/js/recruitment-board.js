/**
 * 招募板页面逻辑
 */
(function InitRecruitmentBoardPage() {
    const DEFAULT_PAGE_NO = 1;
    const DEFAULT_PAGE_SIZE = 12;
    const ADMINISTRATOR_ROLE = "ADMINISTRATOR";

    const STATUS_TEXT_MAP = {
        RECRUITING: "招募中",
        FULL: "已满员",
        CLOSED: "已关闭",
        EXPIRED: "已过期"
    };

    const APPLICATION_STATUS_TEXT_MAP = {
        PENDING: "待审批",
        APPROVED: "已通过",
        REJECTED: "已拒绝"
    };

    /**
     * 绑定页面行为
     */
    function BindRecruitmentBoardPage() {
        if (!window.CampusShareApi) {
            return;
        }
        const heroSection = document.querySelector("main section.px-8.pt-8.pb-4");
        const recruitmentGrid = document.querySelector("main section.px-8.py-6.grid");
        if (!heroSection || !recruitmentGrid) {
            return;
        }

        const publishButton = document.querySelector("header button.bg-primary.text-on-primary");
        const searchInput = document.querySelector("header input[placeholder*='搜索招募信息']");
        const filterBar = heroSection.querySelector(".mt-8.flex.flex-wrap.items-center.gap-3");
        const messageBar = CreateMessageBar(heroSection);
        const profile = window.CampusShareApi.GetCurrentUserProfile();
        const currentUserId = profile && profile.userId ? Number(profile.userId) : null;
        const currentUserRole = profile && profile.userRole ? String(profile.userRole) : "";

        const applicationModal = BuildApplicationModal();
        const publishModal = BuildPublishModal();
        const reviewRemarkModal = BuildReviewRemarkModal();
        document.body.appendChild(applicationModal.wrapper);
        document.body.appendChild(publishModal.wrapper);
        document.body.appendChild(reviewRemarkModal.wrapper);

        const state = {
            pageNo: DEFAULT_PAGE_NO,
            pageSize: DEFAULT_PAGE_SIZE,
            keyword: "",
            direction: ""
        };

        BindSearchInput(searchInput, state, function ReloadBySearch() {
            LoadRecruitments(state, recruitmentGrid, currentUserId, currentUserRole, messageBar);
        });
        BindDirectionFilter(filterBar, state, function ReloadByFilter() {
            LoadRecruitments(state, recruitmentGrid, currentUserId, currentUserRole, messageBar);
        });
        BindPublishModalActions(publishModal, messageBar);
        BindReviewRemarkModalActions(reviewRemarkModal);
        BindPublishButton(
            publishButton,
            publishModal,
            state,
            recruitmentGrid,
            currentUserId,
            currentUserRole,
            messageBar
        );
        BindRecruitmentGridActions(
            recruitmentGrid,
            applicationModal,
            state,
            currentUserId,
            currentUserRole,
            messageBar
        );
        BindApplicationModalActions(
            applicationModal,
            reviewRemarkModal,
            state,
            recruitmentGrid,
            currentUserId,
            currentUserRole,
            messageBar
        );

        LoadRecruitments(state, recruitmentGrid, currentUserId, currentUserRole, messageBar);
    }

    /**
     * 加载招募列表
     */
    async function LoadRecruitments(state, recruitmentGrid, currentUserId, currentUserRole, messageBar) {
        try {
            const listResult = await window.CampusShareApi.ListTeamRecruitments({
                pageNo: state.pageNo,
                pageSize: state.pageSize,
                keyword: state.keyword,
                direction: state.direction
            });
            const recruitmentList = Array.isArray(listResult.recruitmentList)
                ? listResult.recruitmentList
                : [];
            RenderRecruitmentCards(recruitmentGrid, recruitmentList, currentUserId, currentUserRole);
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "招募列表加载失败");
        }
    }

    /**
     * 渲染卡片
     */
    function RenderRecruitmentCards(recruitmentGrid, recruitmentList, currentUserId, currentUserRole) {
        if (recruitmentList.length === 0) {
            recruitmentGrid.innerHTML = "<div class=\"col-span-1 md:col-span-2 lg:col-span-3 bg-surface-container-lowest rounded-xl p-10 text-center text-slate-500\">暂无招募信息</div>";
            return;
        }
        recruitmentGrid.innerHTML = recruitmentList.map(function BuildCard(item) {
            const statusText = STATUS_TEXT_MAP[item.recruitmentStatus] || item.recruitmentStatus || "-";
            const currentMemberCount = SafeNumber(item.currentMemberCount);
            const memberLimit = SafeNumber(item.memberLimit);
            const percent = memberLimit <= 0
                ? 0
                : Math.min(100, Math.floor((currentMemberCount / memberLimit) * 100));
            const deadlineText = ResolveDeadlineText(item.deadline);
            const isOwner = currentUserId !== null && Number(item.publisherUserId) === Number(currentUserId);
            const isAdministrator = currentUserRole === ADMINISTRATOR_ROLE;
            const canApply = !!item.canApply && !isOwner;

            const applyButtonHtml = BuildApplyActionButton(item.recruitmentId, canApply, isOwner);
            const manageButtonHtml = BuildManageActionButtons(
                item.recruitmentId,
                item.recruitmentStatus,
                isOwner || isAdministrator
            );

            return [
                "<div class=\"bg-surface-container-lowest rounded-xl p-6 flex flex-col hover:shadow-lg transition-shadow border-none group\">",
                "<div class=\"flex justify-between items-start mb-4\">",
                `<span class=\"bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider\">${EscapeHtml(statusText)}</span>`,
                `<span class=\"text-outline text-[10px] font-medium\">${EscapeHtml(deadlineText)}</span>`,
                "</div>",
                `<h3 class=\"text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-tight mb-2\">${EscapeHtml(item.eventName || "未命名招募")}</h3>`,
                `<p class=\"text-xs text-slate-500 mb-2\">方向：${EscapeHtml(item.direction || "-")}</p>`,
                `<p class=\"text-sm text-outline mb-6 line-clamp-2\">${EscapeHtml(item.skillRequirement || "暂无技能要求")}</p>`,
                "<div class=\"mb-6\">",
                "<div class=\"flex justify-between items-center mb-2\"><span class=\"text-xs font-semibold text-on-surface\">人数限制</span>",
                `<span class=\"text-xs text-primary font-bold\">${currentMemberCount}/${memberLimit}</span></div>`,
                "<div class=\"w-full bg-surface-container-high h-2 rounded-full overflow-hidden\">",
                `<div class=\"bg-primary h-full rounded-full\" style=\"width:${percent}%\"></div>`,
                "</div></div>",
                `<div class=\"mt-auto pt-4 border-t border-surface-container flex items-center justify-between gap-2\"><div class=\"text-[11px] text-slate-500 truncate\">发起人：${EscapeHtml(item.publisherDisplayName || "未知用户")}</div><div class=\"flex items-center gap-2\">${manageButtonHtml}${applyButtonHtml}</div></div>`,
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 构建申请按钮
     */
    function BuildApplyActionButton(recruitmentId, canApply, isOwner) {
        if (!window.CampusShareApi.GetAuthToken()) {
            return `<button data-action=\"goAuth\" data-recruitment-id=\"${recruitmentId}\" class=\"bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold\">登录后申请</button>`;
        }
        if (isOwner) {
            return "<button disabled class=\"bg-surface-container-high text-slate-500 px-4 py-2 rounded-lg text-xs font-bold\">我发布的</button>";
        }
        if (!canApply) {
            return "<button disabled class=\"bg-surface-container-high text-slate-500 px-4 py-2 rounded-lg text-xs font-bold\">不可申请</button>";
        }
        return `<button data-action=\"apply\" data-recruitment-id=\"${recruitmentId}\" class=\"bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold\">申请加入</button>`;
    }

    /**
     * 构建管理按钮
     */
    function BuildManageActionButtons(recruitmentId, recruitmentStatus, canManage) {
        if (!canManage) {
            return "";
        }
        const manageButton = `<button data-action=\"manage\" data-recruitment-id=\"${recruitmentId}\" class=\"bg-surface-container-low text-slate-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-surface-container-high\">管理申请</button>`;
        if (recruitmentStatus === "CLOSED" || recruitmentStatus === "EXPIRED") {
            return manageButton;
        }
        const closeButton = `<button data-action=\"close\" data-recruitment-id=\"${recruitmentId}\" class=\"bg-surface-container-low text-slate-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-surface-container-high\">关闭招募</button>`;
        return `${manageButton}${closeButton}`;
    }

    /**
     * 绑定卡片动作
     */
    function BindRecruitmentGridActions(
        recruitmentGrid,
        applicationModal,
        state,
        currentUserId,
        currentUserRole,
        messageBar
    ) {
        recruitmentGrid.addEventListener("click", async function HandleGridAction(event) {
            const actionButton = event.target.closest("button[data-action]");
            if (!actionButton) {
                return;
            }
            const action = actionButton.getAttribute("data-action");
            const recruitmentId = Number(actionButton.getAttribute("data-recruitment-id"));
            if (!recruitmentId || !action) {
                return;
            }
            if (action === "goAuth") {
                if (window.CampusShareApi.RedirectToAuthPage) {
                    window.CampusShareApi.RedirectToAuthPage("/pages/recruitment_board.html");
                } else {
                    window.location.href = "/pages/auth_access.html?redirect=%2Fpages%2Frecruitment_board.html";
                }
                return;
            }
            if (!window.CampusShareApi.GetAuthToken()) {
                ShowError(messageBar, "请先登录后再操作");
                window.setTimeout(function RedirectToAuthPage() {
                    if (window.CampusShareApi.RedirectToAuthPage) {
                        window.CampusShareApi.RedirectToAuthPage("/pages/recruitment_board.html");
                        return;
                    }
                    window.location.href = "/pages/auth_access.html?redirect=%2Fpages%2Frecruitment_board.html";
                }, 700);
                return;
            }

            actionButton.disabled = true;
            try {
                if (action === "apply") {
                    await window.CampusShareApi.ApplyTeamRecruitment(recruitmentId, {
                        applyRemark: "来自招募板申请"
                    });
                    ShowSuccess(messageBar, "申请已提交");
                    await LoadRecruitments(state, recruitmentGrid, currentUserId, currentUserRole, messageBar);
                    return;
                }
                if (action === "manage") {
                    await OpenApplicationModal(applicationModal, recruitmentId);
                    return;
                }
                if (action === "close") {
                    if (!window.confirm("确定要关闭该招募吗？")) {
                        return;
                    }
                    await window.CampusShareApi.CloseTeamRecruitment(recruitmentId);
                    ShowSuccess(messageBar, "招募已关闭");
                    await LoadRecruitments(state, recruitmentGrid, currentUserId, currentUserRole, messageBar);
                }
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "操作失败");
            } finally {
                actionButton.disabled = false;
            }
        });
    }

    /**
     * 绑定发布按钮
     */
    function BindPublishButton(
        publishButton,
        publishModal,
        state,
        recruitmentGrid,
        currentUserId,
        currentUserRole,
        messageBar
    ) {
        if (!publishButton) {
            return;
        }
        publishButton.addEventListener("click", async function HandlePublishClick() {
            if (!window.CampusShareApi.GetAuthToken()) {
                ShowError(messageBar, "请先登录后再发布招募");
                window.setTimeout(function RedirectToAuthPage() {
                    if (window.CampusShareApi.RedirectToAuthPage) {
                        window.CampusShareApi.RedirectToAuthPage("/pages/recruitment_board.html");
                        return;
                    }
                    window.location.href = "/pages/auth_access.html?redirect=%2Fpages%2Frecruitment_board.html";
                }, 700);
                return;
            }
            const payload = await OpenPublishModal(publishModal);
            if (!payload) {
                return;
            }
            publishButton.disabled = true;
            try {
                await window.CampusShareApi.PublishTeamRecruitment(payload);
                ShowSuccess(messageBar, "招募发布成功");
                await LoadRecruitments(state, recruitmentGrid, currentUserId, currentUserRole, messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "发布失败");
            } finally {
                publishButton.disabled = false;
            }
        });
    }

    /**
     * 绑定发布弹层动作
     */
    function BindPublishModalActions(publishModal, messageBar) {
        publishModal.closeButton.addEventListener("click", function HandleCloseClick() {
            ResolvePublishModal(publishModal, null);
        });
        publishModal.cancelButton.addEventListener("click", function HandleCancelClick() {
            ResolvePublishModal(publishModal, null);
        });
        publishModal.wrapper.addEventListener("click", function HandleWrapperClick(event) {
            if (event.target === publishModal.wrapper) {
                ResolvePublishModal(publishModal, null);
            }
        });
        publishModal.submitButton.addEventListener("click", function HandleSubmitClick() {
            try {
                const payload = BuildPublishPayloadFromModal(publishModal);
                ResolvePublishModal(publishModal, payload);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "发布参数校验失败");
            }
        });
    }

    /**
     * 打开发布弹层
     */
    function OpenPublishModal(publishModal) {
        if (publishModal.eventNameInput) {
            publishModal.eventNameInput.value = "";
        }
        if (publishModal.directionInput) {
            publishModal.directionInput.value = "";
        }
        if (publishModal.memberLimitInput) {
            publishModal.memberLimitInput.value = "5";
        }
        if (publishModal.skillRequirementInput) {
            publishModal.skillRequirementInput.value = "";
        }
        if (publishModal.deadlineInput) {
            publishModal.deadlineInput.value = ResolveDefaultDeadlineLocalText();
        }
        publishModal.wrapper.classList.remove("hidden");
        if (publishModal.eventNameInput) {
            publishModal.eventNameInput.focus();
        }
        return new Promise(function WaitModalResult(resolve) {
            publishModal.resolveCallback = resolve;
        });
    }

    /**
     * 关闭发布弹层并返回结果
     */
    function ResolvePublishModal(publishModal, payload) {
        publishModal.wrapper.classList.add("hidden");
        const resolveCallback = publishModal.resolveCallback;
        publishModal.resolveCallback = null;
        if (typeof resolveCallback === "function") {
            resolveCallback(payload);
        }
    }

    /**
     * 从发布弹层构建参数
     */
    function BuildPublishPayloadFromModal(publishModal) {
        const eventName = publishModal.eventNameInput && publishModal.eventNameInput.value
            ? publishModal.eventNameInput.value.trim()
            : "";
        const direction = publishModal.directionInput && publishModal.directionInput.value
            ? publishModal.directionInput.value.trim()
            : "";
        const memberLimitText = publishModal.memberLimitInput && publishModal.memberLimitInput.value
            ? publishModal.memberLimitInput.value.trim()
            : "";
        const skillRequirement = publishModal.skillRequirementInput && publishModal.skillRequirementInput.value
            ? publishModal.skillRequirementInput.value.trim()
            : "";
        const deadlineLocalText = publishModal.deadlineInput && publishModal.deadlineInput.value
            ? publishModal.deadlineInput.value.trim()
            : "";

        if (!eventName) {
            throw new Error("赛事或项目名称不能为空");
        }
        if (eventName.length > 100) {
            throw new Error("赛事或项目名称长度不能超过100");
        }
        if (!direction) {
            throw new Error("方向不能为空");
        }
        if (direction.length > 50) {
            throw new Error("方向长度不能超过50");
        }
        const memberLimit = Number(memberLimitText);
        if (!memberLimit || memberLimit < 1 || !Number.isInteger(memberLimit)) {
            throw new Error("人数上限需为正整数");
        }
        if (!deadlineLocalText) {
            throw new Error("截止时间不能为空");
        }
        const deadlineDate = new Date(deadlineLocalText);
        if (Number.isNaN(deadlineDate.getTime())) {
            throw new Error("截止时间格式错误");
        }
        if (deadlineDate.getTime() <= Date.now()) {
            throw new Error("截止时间必须晚于当前时间");
        }
        if (skillRequirement.length > 500) {
            throw new Error("技能要求长度不能超过500");
        }

        return {
            eventName: eventName,
            direction: direction,
            memberLimit: memberLimit,
            deadline: deadlineDate.toISOString(),
            skillRequirement: skillRequirement
        };
    }

    /**
     * 默认截止时间
     */
    function ResolveDefaultDeadlineLocalText() {
        const nextDay = new Date(Date.now() + (24 * 60 * 60 * 1000));
        const year = nextDay.getFullYear();
        const month = PadTime(nextDay.getMonth() + 1);
        const day = PadTime(nextDay.getDate());
        const hour = PadTime(nextDay.getHours());
        const minute = PadTime(nextDay.getMinutes());
        return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    /**
     * 绑定搜索
     */
    function BindSearchInput(searchInput, state, onSearch) {
        if (!searchInput) {
            return;
        }
        searchInput.addEventListener("keydown", function HandleSearchKeydown(event) {
            if (event.key !== "Enter") {
                return;
            }
            event.preventDefault();
            state.keyword = searchInput.value ? searchInput.value.trim() : "";
            state.pageNo = DEFAULT_PAGE_NO;
            onSearch();
        });
    }

    /**
     * 绑定方向筛选
     */
    function BindDirectionFilter(filterBar, state, onFilter) {
        if (!filterBar) {
            return;
        }
        const buttonList = Array.from(filterBar.querySelectorAll("button"))
            .filter(function FilterButton(button) {
                return !button.querySelector(".material-symbols-outlined");
            });
        buttonList.forEach(function BindButton(button, index) {
            const direction = index === 0 ? "" : (button.textContent || "").trim();
            button.addEventListener("click", function HandleClick() {
                state.direction = direction;
                state.pageNo = DEFAULT_PAGE_NO;
                onFilter();
            });
        });
    }

    /**
     * 打开申请弹层
     */
    async function OpenApplicationModal(applicationModal, recruitmentId) {
        const applicationList = await window.CampusShareApi.ListTeamRecruitmentApplications(recruitmentId);
        applicationModal.currentRecruitmentId = recruitmentId;
        applicationModal.title.textContent = `申请管理 #${recruitmentId}`;
        applicationModal.tableBody.innerHTML = BuildApplicationRows(applicationList);
        applicationModal.wrapper.classList.remove("hidden");
    }

    /**
     * 绑定申请弹层动作
     */
    function BindApplicationModalActions(
        applicationModal,
        reviewRemarkModal,
        state,
        recruitmentGrid,
        currentUserId,
        currentUserRole,
        messageBar
    ) {
        applicationModal.closeButton.addEventListener("click", function HandleCloseModal() {
            applicationModal.wrapper.classList.add("hidden");
        });

        applicationModal.wrapper.addEventListener("click", function HandleBackdropClick(event) {
            if (event.target !== applicationModal.wrapper) {
                return;
            }
            applicationModal.wrapper.classList.add("hidden");
        });

        applicationModal.tableBody.addEventListener("click", async function HandleReviewClick(event) {
            const actionButton = event.target.closest("button[data-review-action]");
            if (!actionButton) {
                return;
            }
            const reviewAction = actionButton.getAttribute("data-review-action");
            const applicationId = Number(actionButton.getAttribute("data-application-id"));
            if (!reviewAction || !applicationId || !applicationModal.currentRecruitmentId) {
                return;
            }
            const reviewRemark = await OpenReviewRemarkModal(reviewRemarkModal, reviewAction);
            if (reviewRemark === null) {
                return;
            }

            actionButton.disabled = true;
            try {
                if (reviewAction === "approve") {
                    await window.CampusShareApi.ApproveTeamRecruitmentApplication(
                        applicationModal.currentRecruitmentId,
                        applicationId,
                        reviewRemark
                    );
                    ShowSuccess(messageBar, "已审批通过");
                } else if (reviewAction === "reject") {
                    await window.CampusShareApi.RejectTeamRecruitmentApplication(
                        applicationModal.currentRecruitmentId,
                        applicationId,
                        reviewRemark
                    );
                    ShowSuccess(messageBar, "已审批驳回");
                }
                await OpenApplicationModal(applicationModal, applicationModal.currentRecruitmentId);
                await LoadRecruitments(state, recruitmentGrid, currentUserId, currentUserRole, messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "审批失败");
            } finally {
                actionButton.disabled = false;
            }
        });
    }

    /**
     * 绑定审批备注弹层动作
     */
    function BindReviewRemarkModalActions(reviewRemarkModal) {
        reviewRemarkModal.closeButton.addEventListener("click", function HandleCloseClick() {
            ResolveReviewRemarkModal(reviewRemarkModal, null);
        });
        reviewRemarkModal.cancelButton.addEventListener("click", function HandleCancelClick() {
            ResolveReviewRemarkModal(reviewRemarkModal, null);
        });
        reviewRemarkModal.wrapper.addEventListener("click", function HandleWrapperClick(event) {
            if (event.target === reviewRemarkModal.wrapper) {
                ResolveReviewRemarkModal(reviewRemarkModal, null);
            }
        });
        reviewRemarkModal.submitButton.addEventListener("click", function HandleSubmitClick() {
            const reviewRemark = reviewRemarkModal.remarkInput && reviewRemarkModal.remarkInput.value
                ? reviewRemarkModal.remarkInput.value.trim()
                : "";
            if (reviewRemark.length > 200) {
                return;
            }
            ResolveReviewRemarkModal(reviewRemarkModal, reviewRemark);
        });
    }

    /**
     * 打开审批备注弹层
     */
    function OpenReviewRemarkModal(reviewRemarkModal, reviewAction) {
        const actionText = reviewAction === "approve" ? "通过" : "驳回";
        if (reviewRemarkModal.title) {
            reviewRemarkModal.title.textContent = `审批备注（${actionText}）`;
        }
        if (reviewRemarkModal.remarkInput) {
            reviewRemarkModal.remarkInput.value = "";
        }
        reviewRemarkModal.wrapper.classList.remove("hidden");
        if (reviewRemarkModal.remarkInput) {
            reviewRemarkModal.remarkInput.focus();
        }
        return new Promise(function WaitModalResult(resolve) {
            reviewRemarkModal.resolveCallback = resolve;
        });
    }

    /**
     * 关闭审批备注弹层并返回结果
     */
    function ResolveReviewRemarkModal(reviewRemarkModal, reviewRemark) {
        reviewRemarkModal.wrapper.classList.add("hidden");
        const resolveCallback = reviewRemarkModal.resolveCallback;
        reviewRemarkModal.resolveCallback = null;
        if (typeof resolveCallback === "function") {
            resolveCallback(reviewRemark);
        }
    }

    /**
     * 构建申请行
     */
    function BuildApplicationRows(applicationList) {
        if (!Array.isArray(applicationList) || applicationList.length === 0) {
            return "<tr><td colspan=\"5\" class=\"px-4 py-6 text-center text-sm text-slate-400\">暂无申请记录</td></tr>";
        }
        return applicationList.map(function BuildApplicationRow(applicationItem) {
            const applicationStatusText = APPLICATION_STATUS_TEXT_MAP[applicationItem.applicationStatus]
                || applicationItem.applicationStatus
                || "-";
            const actionHtml = applicationItem.applicationStatus === "PENDING"
                ? [
                    `<button data-review-action=\"approve\" data-application-id=\"${applicationItem.applicationId}\" class=\"px-2 py-1 rounded-md text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200\">通过</button>`,
                    `<button data-review-action=\"reject\" data-application-id=\"${applicationItem.applicationId}\" class=\"px-2 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 ml-2\">驳回</button>`
                ].join("")
                : "<span class=\"text-[11px] text-slate-400\">已处理</span>";

            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors\">",
                `<td class=\"px-4 py-3 text-xs text-slate-500\">${EscapeHtml(FormatTime(applicationItem.createTime))}</td>`,
                `<td class=\"px-4 py-3 text-xs text-on-surface\">${EscapeHtml(applicationItem.applicantDisplayName || `用户#${applicationItem.applicantUserId || "-"}`)}</td>`,
                `<td class=\"px-4 py-3 text-xs text-slate-500\">${EscapeHtml(applicationStatusText)}</td>`,
                `<td class=\"px-4 py-3 text-xs text-slate-500\">${EscapeHtml(applicationItem.applyRemark || "-")}</td>`,
                `<td class=\"px-4 py-3 text-right\">${actionHtml}</td>`,
                "</tr>"
            ].join("");
        }).join("");
    }

    /**
     * 构建发布弹层
     */
    function BuildPublishModal() {
        const wrapper = document.createElement("div");
        wrapper.className = "hidden fixed inset-0 z-[1300] bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-4";
        wrapper.innerHTML = [
            "<div class=\"w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-xl p-6\">",
            "<div class=\"flex items-center justify-between mb-4\">",
            "<h3 class=\"text-lg font-bold text-on-surface\">发布招募</h3>",
            "<button type=\"button\" data-publish-close class=\"material-symbols-outlined text-slate-500 hover:text-slate-700\">close</button>",
            "</div>",
            "<div class=\"grid grid-cols-1 gap-4\">",
            "<label class=\"block\">",
            "<span class=\"text-xs font-semibold text-slate-500\">赛事或项目名称</span>",
            "<input data-publish-event-name type=\"text\" maxlength=\"100\" class=\"mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm\" placeholder=\"例如：数学建模竞赛组队\"/>",
            "</label>",
            "<label class=\"block\">",
            "<span class=\"text-xs font-semibold text-slate-500\">方向</span>",
            "<input data-publish-direction type=\"text\" maxlength=\"50\" class=\"mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm\" placeholder=\"例如：算法 / 前端 / 后端\"/>",
            "</label>",
            "<div class=\"grid grid-cols-2 gap-3\">",
            "<label class=\"block\">",
            "<span class=\"text-xs font-semibold text-slate-500\">人数上限</span>",
            "<input data-publish-member-limit type=\"number\" min=\"1\" step=\"1\" class=\"mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm\"/>",
            "</label>",
            "<label class=\"block\">",
            "<span class=\"text-xs font-semibold text-slate-500\">截止时间</span>",
            "<input data-publish-deadline type=\"datetime-local\" class=\"mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm\"/>",
            "</label>",
            "</div>",
            "<label class=\"block\">",
            "<span class=\"text-xs font-semibold text-slate-500\">技能要求（可空）</span>",
            "<textarea data-publish-skill rows=\"4\" maxlength=\"500\" class=\"mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-sm resize-none\" placeholder=\"例如：熟悉 React，能参与每周线下讨论\"></textarea>",
            "</label>",
            "</div>",
            "<div class=\"flex justify-end items-center gap-3 mt-5\">",
            "<button type=\"button\" data-publish-cancel class=\"px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container\">取消</button>",
            "<button type=\"button\" data-publish-submit class=\"px-4 py-2 rounded-lg text-sm bg-primary text-on-primary font-semibold\">发布招募</button>",
            "</div>",
            "</div>"
        ].join("");

        return {
            wrapper: wrapper,
            closeButton: wrapper.querySelector("[data-publish-close]"),
            cancelButton: wrapper.querySelector("[data-publish-cancel]"),
            submitButton: wrapper.querySelector("[data-publish-submit]"),
            eventNameInput: wrapper.querySelector("[data-publish-event-name]"),
            directionInput: wrapper.querySelector("[data-publish-direction]"),
            memberLimitInput: wrapper.querySelector("[data-publish-member-limit]"),
            deadlineInput: wrapper.querySelector("[data-publish-deadline]"),
            skillRequirementInput: wrapper.querySelector("[data-publish-skill]"),
            resolveCallback: null
        };
    }

    /**
     * 构建审批备注弹层
     */
    function BuildReviewRemarkModal() {
        const wrapper = document.createElement("div");
        wrapper.className = "hidden fixed inset-0 z-[1310] bg-black/45 backdrop-blur-[1px] flex items-center justify-center px-4";
        wrapper.innerHTML = [
            "<div class=\"w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-6\">",
            "<div class=\"flex items-center justify-between mb-4\">",
            "<h3 class=\"text-lg font-bold text-on-surface\" data-review-title>审批备注</h3>",
            "<button type=\"button\" data-review-close class=\"material-symbols-outlined text-slate-500 hover:text-slate-700\">close</button>",
            "</div>",
            "<textarea data-review-remark rows=\"4\" maxlength=\"200\" class=\"w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-sm resize-none\" placeholder=\"可填写审批备注（最多200字）\"></textarea>",
            "<div class=\"flex justify-end items-center gap-3 mt-5\">",
            "<button type=\"button\" data-review-cancel class=\"px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container\">取消</button>",
            "<button type=\"button\" data-review-submit class=\"px-4 py-2 rounded-lg text-sm bg-primary text-on-primary font-semibold\">确认</button>",
            "</div>",
            "</div>"
        ].join("");

        return {
            wrapper: wrapper,
            title: wrapper.querySelector("[data-review-title]"),
            closeButton: wrapper.querySelector("[data-review-close]"),
            cancelButton: wrapper.querySelector("[data-review-cancel]"),
            submitButton: wrapper.querySelector("[data-review-submit]"),
            remarkInput: wrapper.querySelector("[data-review-remark]"),
            resolveCallback: null
        };
    }

    /**
     * 构建申请弹层
     */
    function BuildApplicationModal() {
        const wrapper = document.createElement("div");
        wrapper.className = "hidden fixed inset-0 z-[1300] bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-4";
        wrapper.innerHTML = [
            "<div class=\"w-full max-w-4xl bg-surface-container-lowest rounded-xl shadow-xl p-6\">",
            "<div class=\"flex items-center justify-between mb-4\">",
            "<h3 class=\"text-lg font-bold text-on-surface\" data-application-title>申请管理</h3>",
            "<button type=\"button\" data-application-close class=\"material-symbols-outlined text-slate-500 hover:text-slate-700\">close</button>",
            "</div>",
            "<div class=\"overflow-x-auto\">",
            "<table class=\"w-full text-left border-collapse\">",
            "<thead><tr class=\"bg-surface-container-low/70\">",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest\">申请时间</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest\">申请人</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest\">状态</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest\">申请备注</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right\">操作</th>",
            "</tr></thead>",
            "<tbody data-application-body class=\"divide-y divide-surface-container\"></tbody>",
            "</table>",
            "</div>",
            "</div>"
        ].join("");

        return {
            wrapper,
            title: wrapper.querySelector("[data-application-title]"),
            closeButton: wrapper.querySelector("[data-application-close]"),
            tableBody: wrapper.querySelector("[data-application-body]"),
            currentRecruitmentId: null
        };
    }

    /**
     * 解析截止时间文字
     */
    function ResolveDeadlineText(deadlineText) {
        const deadlineDate = new Date(deadlineText || "");
        if (Number.isNaN(deadlineDate.getTime())) {
            return "截止时间待定";
        }
        const diffHours = Math.floor((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60));
        if (diffHours <= 0) {
            return "已截止";
        }
        if (diffHours >= 24) {
            return `剩余 ${Math.floor(diffHours / 24)} 天`;
        }
        return `剩余 ${diffHours} 小时`;
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
     * 创建提示栏
     */
    function CreateMessageBar(heroSection) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant mb-4";
        messageBar.style.display = "none";
        heroSection.insertAdjacentElement("afterend", messageBar);
        return messageBar;
    }

    /**
     * 显示成功
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 mb-4";
        messageBar.textContent = message;
    }

    /**
     * 显示错误
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 mb-4";
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
     * HTML转义
     */
    function EscapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * 安全数值
     */
    function SafeNumber(value) {
        const numberValue = Number(value || 0);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }

    document.addEventListener("DOMContentLoaded", BindRecruitmentBoardPage);
})();
