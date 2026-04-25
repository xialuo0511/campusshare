/**
 * 消息中心页面逻辑
 */
(function InitNotificationCenterPage() {
    const FILTER_TYPE_ALL = "ALL";
    const FILTER_TYPE_UNREAD = "UNREAD";
    const FILTER_TYPE_READ = "READ";

    const NOTIFICATION_TYPE_TEXT_MAP = {
        SYSTEM: "系统通知",
        REVIEW: "审核通知",
        ORDER: "订单通知",
        POINT: "积分通知",
        REPORT: "举报通知",
        TEAM: "组队通知"
    };

    /**
     * 绑定页面
     */
    function BindNotificationCenterPage() {
        if (!window.CampusShareApi) {
            return;
        }
        if (!window.CampusShareApi.GetAuthToken()) {
            window.CampusShareApi.RedirectToAuthPage("/pages/notification_center.html");
            return;
        }

        const mainElement = document.querySelector("main");
        if (!mainElement) {
            return;
        }

        const listContainer = mainElement.querySelector("[data-notification-list]");
        const filterButtonList = Array.from(mainElement.querySelectorAll("[data-notification-filter]"));
        const markAllButton = mainElement.querySelector("[data-notification-mark-all]");
        if (!listContainer || filterButtonList.length < 3) {
            return;
        }

        const messageBar = BuildMessageBar(mainElement, listContainer);
        listContainer.innerHTML = [
            "<div class=\"rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center text-sm text-outline shadow-sm\">",
            "正在加载消息...",
            "</div>"
        ].join("");
        const state = {
            filterType: FILTER_TYPE_ALL,
            notificationList: []
        };

        BindFilterButtons(filterButtonList, state, function HandleFilterChange() {
            RenderNotificationList(state, listContainer);
        });

        if (markAllButton) {
            markAllButton.addEventListener("click", async function HandleMarkAllClick() {
                await MarkAllAsRead(state, listContainer, messageBar);
            });
        }

        listContainer.addEventListener("click", async function HandleListClick(event) {
            const markButton = event.target.closest("button[data-action='mark-read']");
            if (markButton) {
                const notificationId = Number(markButton.getAttribute("data-id") || "0");
                if (!notificationId) {
                    return;
                }
                markButton.disabled = true;
                try {
                    await window.CampusShareApi.MarkNotificationRead(notificationId);
                    state.notificationList = state.notificationList.map(function PatchReadFlag(notificationItem) {
                        if (Number(notificationItem.notificationId) === notificationId) {
                            return Object.assign({}, notificationItem, { readFlag: true });
                        }
                        return notificationItem;
                    });
                    RenderNotificationList(state, listContainer);
                    RefreshShellNotificationBadge();
                    ShowSuccess(messageBar, "已标记为已读");
                } catch (error) {
                    ShowError(messageBar, error instanceof Error ? error.message : "操作失败");
                } finally {
                    markButton.disabled = false;
                }
                return;
            }

            const jumpButton = event.target.closest("button[data-action='jump']");
            if (!jumpButton) {
                return;
            }
            const navTarget = jumpButton.getAttribute("data-target") || "";
            if (navTarget) {
                window.location.href = navTarget;
            }
        });

        RefreshNotifications(state, listContainer, messageBar);
    }

    /**
     * 刷新通知
     */
    async function RefreshNotifications(state, listContainer, messageBar) {
        try {
            const listResult = await window.CampusShareApi.ListMyNotifications();
            state.notificationList = SortNotificationsBySendTime(Array.isArray(listResult) ? listResult : []);
            RenderNotificationList(state, listContainer);
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "消息加载失败");
            listContainer.innerHTML = "<div class=\"bg-red-50 text-red-700 rounded-xl p-6\">消息加载失败，请稍后重试</div>";
        }
    }

    /**
     * 全部已读
     */
    async function MarkAllAsRead(state, listContainer, messageBar) {
        const unreadList = state.notificationList.filter(function FilterUnread(notificationItem) {
            return !notificationItem.readFlag;
        });
        if (unreadList.length === 0) {
            ShowSuccess(messageBar, "当前没有未读消息");
            return;
        }
        try {
            await window.CampusShareApi.MarkAllNotificationRead();
            state.notificationList = state.notificationList.map(function PatchAllRead(notificationItem) {
                return Object.assign({}, notificationItem, { readFlag: true });
            });
            RenderNotificationList(state, listContainer);
            RefreshShellNotificationBadge();
            ShowSuccess(messageBar, "全部已标记为已读");
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "批量处理失败");
        }
    }

    function RefreshShellNotificationBadge() {
        RefreshNotificationBadgeInWindow(window);
        try {
            if (window.parent && window.parent !== window) {
                RefreshNotificationBadgeInWindow(window.parent);
            }
        } catch (error) {
            // Cross-frame access may be blocked outside the same-origin workspace shell.
        }
    }

    function RefreshNotificationBadgeInWindow(targetWindow) {
        const targetApi = targetWindow && targetWindow.CampusShareApi ? targetWindow.CampusShareApi : null;
        if (targetApi && typeof targetApi.RefreshNotificationBadge === "function") {
            targetApi.RefreshNotificationBadge();
        }
    }

    /**
     * 绑定筛选按钮
     */
    function BindFilterButtons(filterButtonList, state, onFilterChanged) {
        filterButtonList.forEach(function BindFilterButton(buttonElement, index) {
            const filterType = buttonElement.getAttribute("data-notification-filter") || FILTER_TYPE_ALL;
            buttonElement.addEventListener("click", function HandleFilterClick() {
                state.filterType = filterType;
                UpdateFilterButtonStyle(filterButtonList, index);
                onFilterChanged();
            });
        });
    }

    /**
     * 更新筛选样式
     */
    function UpdateFilterButtonStyle(filterButtonList, activeIndex) {
        filterButtonList.forEach(function PatchFilterButton(buttonElement, index) {
            if (index === activeIndex) {
                buttonElement.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm", "font-bold");
                buttonElement.classList.remove("text-on-surface-variant");
                return;
            }
            buttonElement.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm", "font-bold");
            buttonElement.classList.add("text-on-surface-variant");
        });
    }

    /**
     * 渲染通知列表
     */
    function RenderNotificationList(state, listContainer) {
        UpdateNotificationSummary(state.notificationList);
        const filteredList = FilterNotifications(state.notificationList, state.filterType);
        if (filteredList.length === 0) {
            listContainer.innerHTML = [
                "<div class=\"rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center shadow-sm\">",
                "<div class=\"mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container text-outline\">",
                "<span class=\"material-symbols-outlined text-3xl\">inbox</span>",
                "</div>",
                "<h3 class=\"text-base font-bold text-on-surface\">暂无符合条件的消息</h3>",
                "<p class=\"mt-1 text-sm text-outline\">切换筛选条件后可查看其他消息状态</p>",
                "</div>"
            ].join("");
            return;
        }
        listContainer.innerHTML = filteredList.map(function BuildNotificationItem(notificationItem) {
            const titleText = notificationItem.title || ResolveNotificationTypeText(notificationItem.notificationType);
            const contentText = notificationItem.content || "-";
            const typeText = ResolveNotificationTypeText(notificationItem.notificationType);
            const iconName = ResolveNotificationIcon(notificationItem.notificationType);
            const toneClass = ResolveNotificationToneClass(notificationItem.notificationType);
            const statusClass = notificationItem.readFlag
                ? "border-outline-variant bg-surface-container text-on-surface-variant"
                : "border-primary/20 bg-primary/10 text-primary";
            const statusText = notificationItem.readFlag ? "已读" : "未读";
            const navTarget = ResolveNotificationTarget(notificationItem);
            return [
                `<article class=\"group relative overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md\">`,
                notificationItem.readFlag ? "" : "<div class=\"absolute inset-y-0 left-0 w-1 bg-primary\"></div>",
                "<div class=\"flex flex-col gap-4 md:flex-row md:items-start\">",
                `<div class=\"flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneClass}\"><span class=\"material-symbols-outlined text-2xl\">${iconName}</span></div>`,
                "<div class=\"min-w-0 flex-1\">",
                "<div class=\"mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between\">",
                "<div class=\"min-w-0\">",
                `<div class=\"mb-1 flex flex-wrap items-center gap-2\"><span class=\"rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant\">${EscapeHtml(typeText)}</span>${notificationItem.readFlag ? "" : "<span class=\"h-2 w-2 rounded-full bg-primary\"></span>"}</div>`,
                `<h3 class=\"truncate text-base font-extrabold text-on-surface\">${EscapeHtml(titleText)}</h3>`,
                "</div>",
                `<span class=\"shrink-0 text-xs font-semibold text-outline\">${EscapeHtml(FormatTime(notificationItem.sendTime))}</span>`,
                "</div>",
                `<p class=\"mb-4 text-sm leading-6 text-on-surface-variant\">${EscapeHtml(contentText)}</p>`,
                "<div class=\"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between\">",
                `<span class=\"w-fit rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass}\">${EscapeHtml(statusText)}</span>`,
                "<div class=\"flex flex-wrap items-center gap-2\">",
                notificationItem.readFlag
                    ? ""
                    : `<button data-action=\"mark-read\" data-id=\"${EscapeHtml(String(notificationItem.notificationId || ""))}\" class=\"inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-bold text-primary transition hover:border-primary hover:bg-primary/5\"><span class=\"material-symbols-outlined text-base\">done</span>标记已读</button>`,
                navTarget
                    ? `<button data-action=\"jump\" data-target=\"${EscapeHtml(navTarget)}\" class=\"inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary transition hover:bg-primary-container\"><span class=\"material-symbols-outlined text-base\">open_in_new</span>查看详情</button>`
                    : "",
                "</div>",
                "</div>",
                "</div>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");
    }

    function UpdateNotificationSummary(notificationList) {
        const totalCount = notificationList.length;
        const unreadCount = notificationList.filter(function CountUnread(notificationItem) {
            return !notificationItem.readFlag;
        }).length;
        const readCount = totalCount - unreadCount;
        PatchSummaryText("[data-notification-total]", totalCount);
        PatchSummaryText("[data-notification-unread]", unreadCount);
        PatchSummaryText("[data-notification-read]", readCount);
    }

    function PatchSummaryText(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = String(value);
        }
    }

    /**
     * 过滤通知
     */
    function FilterNotifications(notificationList, filterType) {
        if (filterType === FILTER_TYPE_UNREAD) {
            return notificationList.filter(function FilterUnread(notificationItem) {
                return !notificationItem.readFlag;
            });
        }
        if (filterType === FILTER_TYPE_READ) {
            return notificationList.filter(function FilterRead(notificationItem) {
                return !!notificationItem.readFlag;
            });
        }
        return notificationList;
    }

    /**
     * 类型文案
     */
    function ResolveNotificationTypeText(notificationType) {
        return NOTIFICATION_TYPE_TEXT_MAP[notificationType] || "系统通知";
    }

    /**
     * 类型图标
     */
    function ResolveNotificationIcon(notificationType) {
        if (notificationType === "ORDER") {
            return "shopping_cart";
        }
        if (notificationType === "POINT") {
            return "stars";
        }
        if (notificationType === "REVIEW") {
            return "rate_review";
        }
        if (notificationType === "REPORT") {
            return "warning";
        }
        if (notificationType === "TEAM") {
            return "groups";
        }
        return "notifications";
    }

    function ResolveNotificationToneClass(notificationType) {
        if (notificationType === "ORDER") {
            return "bg-sky-50 text-primary";
        }
        if (notificationType === "POINT") {
            return "bg-amber-50 text-amber-700";
        }
        if (notificationType === "REVIEW") {
            return "bg-indigo-50 text-indigo-700";
        }
        if (notificationType === "REPORT") {
            return "bg-red-50 text-red-700";
        }
        if (notificationType === "TEAM") {
            return "bg-cyan-50 text-cyan-700";
        }
        return "bg-surface-container text-primary";
    }

    /**
     * 详情跳转
     */
    function ResolveNotificationTarget(notificationItem) {
        const bizType = String(notificationItem.relatedBizType || "").toUpperCase();
        const bizId = notificationItem.relatedBizId;
        if (bizType === "PRODUCT" && bizId) {
            return `/pages/market_item_detail.html?productId=${encodeURIComponent(String(bizId))}`;
        }
        if (bizType === "ORDER" && bizId) {
            return `/pages/order_detail.html?orderId=${encodeURIComponent(String(bizId))}`;
        }
        if (bizType === "MATERIAL" && bizId) {
            return `/pages/market_listing.html?view=MATERIAL&materialId=${encodeURIComponent(String(bizId))}`;
        }
        if (bizType === "MATERIAL") {
            return "/pages/market_listing.html?view=MATERIAL";
        }
        if (bizType === "SELLER_VERIFICATION" || bizType === "USER") {
            return "/pages/user_profile.html";
        }
        if (bizType === "TEAM_RECRUITMENT") {
            return "/pages/recruitment_board.html";
        }
        if (bizType === "REPORT") {
            return "/pages/admin_batch_review.html";
        }
        return "";
    }

    /**
     * 通知按时间倒序
     */
    function SortNotificationsBySendTime(notificationList) {
        return notificationList.slice().sort(function CompareNotificationTime(leftItem, rightItem) {
            const leftTime = ResolveTimeValue(leftItem.sendTime);
            const rightTime = ResolveTimeValue(rightItem.sendTime);
            return rightTime - leftTime;
        });
    }

    /**
     * 时间戳解析
     */
    function ResolveTimeValue(timeText) {
        const timeValue = new Date(timeText || "");
        if (Number.isNaN(timeValue.getTime())) {
            return 0;
        }
        return timeValue.getTime();
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
    function BuildMessageBar(mainElement, listContainer) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4";
        messageBar.style.display = "none";
        const containerParent = listContainer.parentElement || mainElement;
        containerParent.insertBefore(messageBar, listContainer);
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

    document.addEventListener("DOMContentLoaded", BindNotificationCenterPage);
})();
