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
        listContainer.innerHTML = "<div class=\"bg-surface-container-lowest rounded-xl p-8 text-center text-sm text-slate-500\">正在加载消息...</div>";
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
            ShowSuccess(messageBar, "全部已标记为已读");
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "批量处理失败");
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
                buttonElement.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm", "font-semibold");
                buttonElement.classList.remove("text-on-surface-variant", "font-medium");
                return;
            }
            buttonElement.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm", "font-semibold");
            buttonElement.classList.add("text-on-surface-variant", "font-medium");
        });
    }

    /**
     * 渲染通知列表
     */
    function RenderNotificationList(state, listContainer) {
        const filteredList = FilterNotifications(state.notificationList, state.filterType);
        if (filteredList.length === 0) {
            listContainer.innerHTML = "<div class=\"bg-surface-container-lowest rounded-xl p-10 text-center text-slate-500\">暂无符合条件的消息</div>";
            return;
        }
        listContainer.innerHTML = filteredList.map(function BuildNotificationItem(notificationItem) {
            const titleText = notificationItem.title || ResolveNotificationTypeText(notificationItem.notificationType);
            const contentText = notificationItem.content || "-";
            const statusClass = notificationItem.readFlag
                ? "bg-surface-container-high text-on-surface-variant"
                : "bg-secondary-container text-on-secondary-container";
            const statusText = notificationItem.readFlag ? "已读" : "未读";
            const navTarget = ResolveNotificationTarget(notificationItem);
            return [
                `<div class=\"group bg-surface-container-lowest p-6 rounded-xl ${notificationItem.readFlag ? "" : "border-l-4 border-primary"} transition-all hover:bg-white\">`,
                "<div class=\"flex gap-4\">",
                `<div class=\"w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary shrink-0\"><span class=\"material-symbols-outlined\">${ResolveNotificationIcon(notificationItem.notificationType)}</span></div>`,
                "<div class=\"flex-1\">",
                "<div class=\"flex justify-between items-start mb-1\">",
                `<h3 class=\"text-lg font-semibold text-on-surface\">${EscapeHtml(titleText)}</h3>`,
                `<span class=\"text-xs text-on-surface-variant font-medium\">${EscapeHtml(FormatTime(notificationItem.sendTime))}</span>`,
                "</div>",
                `<p class=\"text-on-surface-variant text-sm mb-4\">${EscapeHtml(contentText)}</p>`,
                "<div class=\"flex justify-between items-center gap-2\">",
                `<span class=\"px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusClass}\">${EscapeHtml(statusText)}</span>`,
                "<div class=\"flex items-center gap-2\">",
                notificationItem.readFlag
                    ? ""
                    : `<button data-action=\"mark-read\" data-id=\"${EscapeHtml(String(notificationItem.notificationId || ""))}\" class=\"text-primary text-sm font-bold hover:underline\">标记已读</button>`,
                navTarget
                    ? `<button data-action=\"jump\" data-target=\"${EscapeHtml(navTarget)}\" class=\"text-primary text-sm font-bold hover:underline\">查看详情</button>`
                    : "",
                "</div>",
                "</div>",
                "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
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
        if (bizType === "MATERIAL") {
            return "/pages/my_publish.html";
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
