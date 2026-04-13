/**
 * 招募板页面逻辑
 */
(function InitRecruitmentBoardPage() {
    const DEFAULT_PAGE_NO = 1;
    const DEFAULT_PAGE_SIZE = 12;

    const STATUS_TEXT_MAP = {
        RECRUITING: "招募中",
        FULL: "已满员",
        CLOSED: "已关闭",
        EXPIRED: "已过期"
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

        const state = {
            pageNo: DEFAULT_PAGE_NO,
            pageSize: DEFAULT_PAGE_SIZE,
            keyword: "",
            direction: ""
        };

        BindSearchInput(searchInput, state, function ReloadBySearch() {
            LoadRecruitments(state, recruitmentGrid, currentUserId, messageBar);
        });
        BindDirectionFilter(filterBar, state, function ReloadByFilter() {
            LoadRecruitments(state, recruitmentGrid, currentUserId, messageBar);
        });
        BindPublishButton(publishButton, state, recruitmentGrid, currentUserId, messageBar);
        BindApplyAction(recruitmentGrid, state, currentUserId, messageBar);

        LoadRecruitments(state, recruitmentGrid, currentUserId, messageBar);
    }

    /**
     * 加载招募列表
     */
    async function LoadRecruitments(state, recruitmentGrid, currentUserId, messageBar) {
        try {
            const listResult = await window.CampusShareApi.ListTeamRecruitments({
                pageNo: state.pageNo,
                pageSize: state.pageSize,
                keyword: state.keyword,
                direction: state.direction
            });
            const recruitmentList = Array.isArray(listResult.recruitmentList) ? listResult.recruitmentList : [];
            RenderRecruitmentCards(recruitmentGrid, recruitmentList, currentUserId);
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "招募列表加载失败");
        }
    }

    /**
     * 渲染卡片
     */
    function RenderRecruitmentCards(recruitmentGrid, recruitmentList, currentUserId) {
        if (recruitmentList.length === 0) {
            recruitmentGrid.innerHTML = "<div class=\"col-span-1 md:col-span-2 lg:col-span-3 bg-surface-container-lowest rounded-xl p-10 text-center text-slate-500\">暂无招募信息</div>";
            return;
        }
        recruitmentGrid.innerHTML = recruitmentList.map(function BuildCard(item) {
            const statusText = STATUS_TEXT_MAP[item.recruitmentStatus] || item.recruitmentStatus || "-";
            const currentMemberCount = SafeNumber(item.currentMemberCount);
            const memberLimit = SafeNumber(item.memberLimit);
            const percent = memberLimit <= 0 ? 0 : Math.min(100, Math.floor((currentMemberCount / memberLimit) * 100));
            const deadlineText = ResolveDeadlineText(item.deadline);
            const isOwner = currentUserId !== null && Number(item.publisherUserId) === Number(currentUserId);
            const canApply = !!item.canApply && !isOwner;
            const buttonHtml = BuildActionButton(item.recruitmentId, canApply, isOwner);
            return [
                "<div class=\"bg-surface-container-lowest rounded-xl p-6 flex flex-col hover:shadow-lg transition-shadow border-none group\">",
                "<div class=\"flex justify-between items-start mb-4\">",
                `<span class=\"bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider\">${EscapeHtml(statusText)}</span>`,
                `<span class=\"text-outline text-[10px] font-medium\">${EscapeHtml(deadlineText)}</span>`,
                "</div>",
                `<h3 class="text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-tight mb-2">${EscapeHtml(item.eventName || "未命名招募")}</h3>`,
                `<p class="text-xs text-slate-500 mb-2">方向：${EscapeHtml(item.direction || "-")}</p>`,
                `<p class="text-sm text-outline mb-6 line-clamp-2">${EscapeHtml(item.skillRequirement || "暂无技能要求")}</p>`,
                "<div class=\"mb-6\">",
                "<div class=\"flex justify-between items-center mb-2\"><span class=\"text-xs font-semibold text-on-surface\">人数限制</span>",
                `<span class="text-xs text-primary font-bold">${currentMemberCount}/${memberLimit}</span></div>`,
                "<div class=\"w-full bg-surface-container-high h-2 rounded-full overflow-hidden\">",
                `<div class="bg-primary h-full rounded-full" style="width:${percent}%"></div>`,
                "</div></div>",
                `<div class="mt-auto pt-4 border-t border-surface-container flex items-center justify-between gap-2"><div class="text-[11px] text-slate-500 truncate">发起人：${EscapeHtml(item.publisherDisplayName || "未知用户")}</div>${buttonHtml}</div>`,
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 构建操作按钮
     */
    function BuildActionButton(recruitmentId, canApply, isOwner) {
        if (!window.CampusShareApi.GetAuthToken()) {
            return `<button data-action="goAuth" data-recruitment-id="${recruitmentId}" class="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold">登录后申请</button>`;
        }
        if (isOwner) {
            return "<button disabled class=\"bg-surface-container-high text-slate-500 px-4 py-2 rounded-lg text-xs font-bold\">我发布的</button>";
        }
        if (!canApply) {
            return "<button disabled class=\"bg-surface-container-high text-slate-500 px-4 py-2 rounded-lg text-xs font-bold\">不可申请</button>";
        }
        return `<button data-action="apply" data-recruitment-id="${recruitmentId}" class="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold">申请加入</button>`;
    }

    /**
     * 绑定申请操作
     */
    function BindApplyAction(recruitmentGrid, state, currentUserId, messageBar) {
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
                window.location.href = "/pages/auth_access.html";
                return;
            }
            actionButton.disabled = true;
            try {
                await window.CampusShareApi.ApplyTeamRecruitment(recruitmentId, { applyRemark: "来自招募板申请" });
                ShowSuccess(messageBar, "申请已提交");
                await LoadRecruitments(state, recruitmentGrid, currentUserId, messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "申请失败");
            } finally {
                actionButton.disabled = false;
            }
        });
    }

    /**
     * 绑定发布按钮
     */
    function BindPublishButton(publishButton, state, recruitmentGrid, currentUserId, messageBar) {
        if (!publishButton) {
            return;
        }
        publishButton.addEventListener("click", async function HandlePublishClick() {
            if (!window.CampusShareApi.GetAuthToken()) {
                ShowError(messageBar, "请先登录后再发布招募");
                window.location.href = "/pages/auth_access.html";
                return;
            }
            const payload = BuildPublishPayloadByPrompt();
            if (!payload) {
                return;
            }
            publishButton.disabled = true;
            try {
                await window.CampusShareApi.PublishTeamRecruitment(payload);
                ShowSuccess(messageBar, "招募发布成功");
                await LoadRecruitments(state, recruitmentGrid, currentUserId, messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "发布失败");
            } finally {
                publishButton.disabled = false;
            }
        });
    }

    /**
     * Prompt生成发布参数
     */
    function BuildPublishPayloadByPrompt() {
        const eventName = window.prompt("请输入赛事/项目名称（1-100字）", "");
        if (!eventName) {
            return null;
        }
        const direction = window.prompt("请输入方向（1-50字）", "");
        if (!direction) {
            return null;
        }
        const memberLimitText = window.prompt("请输入人数上限（正整数）", "5");
        const memberLimit = Number(memberLimitText || 0);
        if (!memberLimit || memberLimit < 1) {
            throw new Error("人数上限需为正整数");
        }
        const deadlineText = window.prompt("请输入截止时间（示例：2026-12-31 20:00）", "");
        if (!deadlineText) {
            return null;
        }
        const parsedDeadline = new Date(deadlineText.replace(" ", "T"));
        if (Number.isNaN(parsedDeadline.getTime())) {
            throw new Error("截止时间格式错误");
        }
        const skillRequirement = window.prompt("请输入技能要求（可空）", "") || "";
        return {
            eventName: eventName.trim(),
            direction: direction.trim(),
            memberLimit,
            deadline: parsedDeadline.toISOString(),
            skillRequirement: skillRequirement.trim()
        };
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
                onFilter();
            });
        });
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
            .replace(/"/g, "&quot;")
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

