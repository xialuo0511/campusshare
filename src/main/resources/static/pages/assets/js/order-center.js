/**
 * 订单中心页面逻辑
 */
(function InitOrderCenterPage() {
    const DEFAULT_PAGE_NO = 1;
    const DEFAULT_PAGE_SIZE = 10;
    const LEDGER_PREVIEW_SIZE = 5;

    const STATUS_TEXT_MAP = {
        PENDING_SELLER_CONFIRM: "待卖家确认",
        PENDING_OFFLINE_TRADE: "待线下交易",
        PENDING_BUYER_CONFIRM: "待买家确认",
        COMPLETED: "已完成",
        CANCELED: "已取消",
        CLOSED: "已关闭"
    };

    /**
     * 页面初始化
     */
    function BindOrderCenterPage() {
        if (!window.CampusShareApi) {
            return;
        }

        const tableBody = document.querySelector("tbody.divide-y");
        const summaryNumberList = document.querySelectorAll("main .grid p.text-3xl");
        const filterButtonList = document.querySelectorAll(".px-6.py-4.border-b button");
        const historyCard = document.querySelector("main .bg-surface-container-lowest.rounded-xl.shadow-sm.overflow-hidden");
        const paginationBar = document.querySelector(".bg-surface-container-low.p-4.flex.justify-between.items-center.px-6");
        const paginationText = paginationBar ? paginationBar.querySelector("p.text-xs") : null;
        const paginationButtonContainer = paginationBar ? paginationBar.querySelector("div.flex.gap-1") : null;
        if (!tableBody || summaryNumberList.length < 4 || !historyCard || !paginationBar || !paginationText || !paginationButtonContainer) {
            return;
        }

        const profile = window.CampusShareApi.GetCurrentUserProfile();
        const currentUserId = profile && profile.userId ? Number(profile.userId) : null;
        const messageBar = BuildMessageBar(historyCard);
        const pointPanel = BuildPointPanel();
        historyCard.insertAdjacentElement("afterend", pointPanel.panel);

        if (!window.CampusShareApi.GetAuthToken()) {
            ShowError(messageBar, "请先登录后再查看订单中心");
            window.setTimeout(function RedirectToAuthPage() {
                window.CampusShareApi.RedirectToAuthPage("/pages/order_center.html");
            }, 700);
            return;
        }

        const state = {
            pageNo: DEFAULT_PAGE_NO,
            pageSize: DEFAULT_PAGE_SIZE,
            totalCount: 0,
            totalPages: 1,
            statusFilter: "ALL"
        };

        BindFilterButtons(filterButtonList, state, function ReloadFromFilter() {
            LoadOrderList(state, currentUserId, summaryNumberList, tableBody, paginationText, paginationButtonContainer, messageBar);
        });
        BindActionButtons(tableBody, state, currentUserId, summaryNumberList, pointPanel, paginationText, paginationButtonContainer, messageBar);
        BindPaginationButtons(paginationButtonContainer, state, function ReloadFromPage() {
            LoadOrderList(state, currentUserId, summaryNumberList, tableBody, paginationText, paginationButtonContainer, messageBar);
        });

        LoadOrderList(state, currentUserId, summaryNumberList, tableBody, paginationText, paginationButtonContainer, messageBar);
        LoadPointLedger(pointPanel, summaryNumberList, messageBar);
    }

    /**
     * 绑定筛选按钮
     */
    function BindFilterButtons(filterButtonList, state, onFilterChanged) {
        if (!filterButtonList || filterButtonList.length < 3) {
            return;
        }
        const filterKeyList = ["ALL", "ONGOING", "COMPLETED"];
        filterButtonList.forEach(function BindFilter(button, index) {
            const filterKey = filterKeyList[index] || "ALL";
            button.setAttribute("data-filter-key", filterKey);
            button.addEventListener("click", function HandleFilterClick() {
                if (state.statusFilter === filterKey) {
                    return;
                }
                state.statusFilter = filterKey;
                state.pageNo = DEFAULT_PAGE_NO;
                ApplyFilterButtonState(filterButtonList, button);
                onFilterChanged();
            });
        });
        ApplyFilterButtonState(filterButtonList, filterButtonList[0]);
    }

    /**
     * 绑定订单动作按钮
     */
    function BindActionButtons(
        tableBody,
        state,
        currentUserId,
        summaryNumberList,
        pointPanel,
        paginationText,
        paginationButtonContainer,
        messageBar
    ) {
        tableBody.addEventListener("click", async function HandleActionClick(event) {
            const actionButton = event.target.closest("button[data-order-action]");
            if (!actionButton) {
                return;
            }
            const orderId = Number(actionButton.getAttribute("data-order-id"));
            const action = actionButton.getAttribute("data-order-action");
            if (!orderId || !action) {
                return;
            }

            actionButton.disabled = true;
            try {
                if (action === "confirm") {
                    await window.CampusShareApi.ConfirmOrder(orderId);
                    ShowSuccess(messageBar, `订单 #${orderId} 已确认`);
                } else if (action === "complete") {
                    await window.CampusShareApi.CompleteOrder(orderId);
                    ShowSuccess(messageBar, `订单 #${orderId} 已完成`);
                } else if (action === "cancel") {
                    await window.CampusShareApi.CancelOrder(orderId);
                    ShowSuccess(messageBar, `订单 #${orderId} 已取消`);
                } else if (action === "close") {
                    await window.CampusShareApi.CloseOrder(orderId, "用户手动关闭");
                    ShowSuccess(messageBar, `订单 #${orderId} 已关闭`);
                } else if (action === "detail") {
                    window.location.href = `/pages/order_detail.html?orderId=${encodeURIComponent(String(orderId))}`;
                    return;
                } else {
                    return;
                }
                await LoadOrderList(
                    state,
                    currentUserId,
                    summaryNumberList,
                    tableBody,
                    paginationText,
                    paginationButtonContainer,
                    messageBar
                );
                await LoadPointLedger(pointPanel, summaryNumberList, messageBar);
            } catch (error) {
                ShowError(messageBar, ResolveErrorText(error, "订单操作失败"));
            } finally {
                actionButton.disabled = false;
            }
        });
    }

    /**
     * 绑定分页按钮
     */
    function BindPaginationButtons(paginationButtonContainer, state, onPageChanged) {
        paginationButtonContainer.addEventListener("click", function HandlePaginationClick(event) {
            const pageButton = event.target.closest("button[data-page-action]");
            if (!pageButton || pageButton.disabled) {
                return;
            }
            const action = pageButton.getAttribute("data-page-action");
            const targetPageNo = Number(pageButton.getAttribute("data-page-no") || state.pageNo);
            let nextPageNo = state.pageNo;

            if (action === "prev") {
                nextPageNo = Math.max(1, state.pageNo - 1);
            } else if (action === "next") {
                nextPageNo = Math.min(state.totalPages, state.pageNo + 1);
            } else if (action === "jump" && !Number.isNaN(targetPageNo)) {
                nextPageNo = Math.max(1, Math.min(state.totalPages, targetPageNo));
            }

            if (nextPageNo === state.pageNo) {
                return;
            }
            state.pageNo = nextPageNo;
            onPageChanged();
        });
    }

    /**
     * 加载订单列表
     */
    async function LoadOrderList(
        state,
        currentUserId,
        summaryNumberList,
        tableBody,
        paginationText,
        paginationButtonContainer,
        messageBar
    ) {
        try {
            const listResult = await window.CampusShareApi.ListMyOrders(state.pageNo, state.pageSize, state.statusFilter);
            const filteredCount = listResult.filteredCount === undefined || listResult.filteredCount === null
                ? SafeNumber(listResult.totalCount)
                : SafeNumber(listResult.filteredCount);
            state.totalCount = filteredCount;
            state.totalPages = Math.max(1, Math.ceil(filteredCount / state.pageSize));
            if (state.pageNo > state.totalPages) {
                state.pageNo = state.totalPages;
            }

            RenderSummaryCards(summaryNumberList, listResult);
            const orderList = Array.isArray(listResult.orderList) ? listResult.orderList : [];
            RenderOrderTable(orderList, currentUserId, tableBody);
            RenderPaginationArea(state, orderList.length, paginationText, paginationButtonContainer);
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, ResolveErrorText(error, "订单列表加载失败"));
            RenderOrderTable([], currentUserId, tableBody);
        }
    }

    /**
     * 加载积分流水
     */
    async function LoadPointLedger(pointPanel, summaryNumberList, messageBar) {
        try {
            const ledgerResult = await window.CampusShareApi.ListPointLedger(DEFAULT_PAGE_NO, LEDGER_PREVIEW_SIZE);
            RenderPointSummary(summaryNumberList, ledgerResult);
            RenderPointLedgerList(pointPanel, ledgerResult);
        } catch (error) {
            ShowError(messageBar, ResolveErrorText(error, "积分流水加载失败"));
        }
    }

    /**
     * 渲染统计卡
     */
    function RenderSummaryCards(summaryNumberList, listResult) {
        summaryNumberList[0].textContent = String(SafeNumber(listResult.totalCount));
        summaryNumberList[1].textContent = String(SafeNumber(listResult.ongoingCount));
        summaryNumberList[2].textContent = String(SafeNumber(listResult.completedCount));
    }

    /**
     * 渲染分页区域
     */
    function RenderPaginationArea(state, currentCount, paginationText, paginationButtonContainer) {
        const startIndex = state.totalCount === 0 ? 0 : ((state.pageNo - 1) * state.pageSize + 1);
        const endIndex = state.totalCount === 0 ? 0 : (startIndex + Math.max(0, currentCount - 1));
        paginationText.textContent = `显示 ${state.totalCount} 个订单中的 ${startIndex}-${endIndex} 项`;

        const pageButtonList = BuildPageButtonList(state.pageNo, state.totalPages);
        const pageButtonHtml = pageButtonList.map(function BuildPageButton(item) {
            if (item === "...") {
                return "<span class=\"w-8 h-8 flex items-center justify-center text-slate-400 text-xs\">...</span>";
            }
            const activeClass = item === state.pageNo
                ? "bg-white text-primary font-bold"
                : "text-slate-500 hover:bg-white";
            return `<button data-page-action="jump" data-page-no="${item}" class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-xs ${activeClass}">${item}</button>`;
        }).join("");

        paginationButtonContainer.innerHTML = [
            `<button data-page-action="prev" ${state.pageNo <= 1 ? "disabled" : ""} class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant ${state.pageNo <= 1 ? "text-slate-300 cursor-not-allowed" : "hover:bg-white transition-colors"}"><span class="material-symbols-outlined text-sm">chevron_left</span></button>`,
            pageButtonHtml,
            `<button data-page-action="next" ${state.pageNo >= state.totalPages ? "disabled" : ""} class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant ${state.pageNo >= state.totalPages ? "text-slate-300 cursor-not-allowed" : "hover:bg-white transition-colors"}"><span class="material-symbols-outlined text-sm">chevron_right</span></button>`
        ].join("");
    }

    /**
     * 渲染订单表格
     */
    function RenderOrderTable(orderList, currentUserId, tableBody) {
        if (!orderList || orderList.length === 0) {
            tableBody.innerHTML = "<tr><td colspan=\"7\" class=\"px-6 py-8 text-center text-sm text-slate-400\">暂无订单数据</td></tr>";
            return;
        }

        tableBody.innerHTML = orderList.map(function BuildOrderRow(orderItem) {
            const statusText = STATUS_TEXT_MAP[orderItem.orderStatus] || orderItem.orderStatus || "-";
            const statusClass = ResolveStatusClass(orderItem.orderStatus);
            const counterpartText = BuildCounterpartText(orderItem, currentUserId);
            const actionButtons = BuildActionButtons(orderItem, currentUserId);

            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors group\">",
                `<td class="px-6 py-4 text-xs font-mono text-slate-500">#${EscapeHtml(orderItem.orderNo || "")}</td>`,
                "<td class=\"px-6 py-4\">",
                `<p class="text-sm font-bold text-on-surface">商品ID: ${EscapeHtml(String(orderItem.productId || ""))}</p>`,
                `<p class="text-[10px] text-slate-400">交易地点: ${EscapeHtml(orderItem.tradeLocation || "-")}</p>`,
                "</td>",
                `<td class="px-6 py-4 text-sm text-on-surface">${EscapeHtml(counterpartText)}</td>`,
                `<td class="px-6 py-4 text-xs text-slate-500">${EscapeHtml(FormatTime(orderItem.updateTime))}</td>`,
                `<td class="px-6 py-4 text-sm font-bold text-on-surface text-right">¥${EscapeHtml(FormatAmount(orderItem.orderAmount))}</td>`,
                `<td class="px-6 py-4 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${statusClass}">${EscapeHtml(statusText)}</span></td>`,
                `<td class="px-6 py-4 text-right">${actionButtons}</td>`,
                "</tr>"
            ].join("");
        }).join("");
    }

    /**
     * 构建对方信息
     */
    function BuildCounterpartText(orderItem, currentUserId) {
        if (!currentUserId) {
            return `买家ID:${orderItem.buyerUserId} / 卖家ID:${orderItem.sellerUserId}`;
        }
        if (Number(orderItem.buyerUserId) === Number(currentUserId)) {
            return `我是买家 / 卖家ID:${orderItem.sellerUserId}`;
        }
        if (Number(orderItem.sellerUserId) === Number(currentUserId)) {
            return `我是卖家 / 买家ID:${orderItem.buyerUserId}`;
        }
        return `买家ID:${orderItem.buyerUserId} / 卖家ID:${orderItem.sellerUserId}`;
    }

    /**
     * 构建操作按钮
     */
    function BuildActionButtons(orderItem, currentUserId) {
        const buttonClass = "text-xs font-bold px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-all";
        const currentUserIdNumber = currentUserId ? Number(currentUserId) : null;
        const isBuyer = currentUserIdNumber !== null && Number(orderItem.buyerUserId) === currentUserIdNumber;
        const isSeller = currentUserIdNumber !== null && Number(orderItem.sellerUserId) === currentUserIdNumber;

        if (orderItem.orderStatus === "PENDING_SELLER_CONFIRM" && isSeller) {
            return [
                `<button data-order-action="confirm" data-order-id="${orderItem.orderId}" class="${buttonClass} text-primary">确认</button>`,
                `<button data-order-action="cancel" data-order-id="${orderItem.orderId}" class="${buttonClass} ml-2 text-slate-600">取消</button>`
            ].join("");
        }
        if ((orderItem.orderStatus === "PENDING_OFFLINE_TRADE" || orderItem.orderStatus === "PENDING_BUYER_CONFIRM") && isBuyer) {
            return [
                `<button data-order-action="complete" data-order-id="${orderItem.orderId}" class="${buttonClass} text-secondary">完成</button>`,
                `<button data-order-action="cancel" data-order-id="${orderItem.orderId}" class="${buttonClass} ml-2 text-slate-600">取消</button>`
            ].join("");
        }
        if ((orderItem.orderStatus === "PENDING_SELLER_CONFIRM" || orderItem.orderStatus === "PENDING_OFFLINE_TRADE") && isSeller) {
            return `<button data-order-action="close" data-order-id="${orderItem.orderId}" class="${buttonClass} text-slate-600">关闭</button>`;
        }
        return `<button data-order-action="detail" data-order-id="${orderItem.orderId}" class="${buttonClass} text-slate-600">查看</button>`;
    }

    /**
     * 构建积分面板
     */
    function BuildPointPanel() {
        const panel = document.createElement("section");
        panel.className = "bg-surface-container-lowest rounded-xl shadow-sm p-6 mt-8";
        panel.innerHTML = [
            "<div class=\"flex items-center justify-between mb-4\">",
            "<h3 class=\"text-lg font-bold text-on-surface\">最近积分流水</h3>",
            "<span class=\"text-xs text-slate-500\">最近 5 条</span>",
            "</div>",
            "<div class=\"overflow-x-auto\">",
            "<table class=\"w-full text-left border-collapse\">",
            "<thead><tr class=\"bg-surface-container-low/50\">",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest\">时间</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest\">类型</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right\">变动</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right\">余额</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest\">备注</th>",
            "</tr></thead>",
            "<tbody class=\"divide-y divide-surface-container\"></tbody>",
            "</table>",
            "</div>"
        ].join("");
        return {
            panel,
            listBody: panel.querySelector("tbody")
        };
    }

    /**
     * 渲染积分摘要
     */
    function RenderPointSummary(summaryNumberList, ledgerResult) {
        summaryNumberList[3].textContent = String(SafeNumber(ledgerResult.availablePoints));
        const summaryCardList = document.querySelectorAll("main .max-w-6xl > .grid > div");
        if (summaryCardList.length < 4) {
            return;
        }
        const pointCard = summaryCardList[3];
        const labelNode = pointCard.querySelector("p.text-xs");
        const helperNode = pointCard.querySelector("div.text-xs");
        if (labelNode) {
            labelNode.textContent = "当前积分";
        }
        if (helperNode) {
            helperNode.className = "mt-2 text-xs text-slate-500 font-medium";
            helperNode.textContent = `累计获得 ${SafeNumber(ledgerResult.totalEarnedPoints)} / 累计消耗 ${SafeNumber(ledgerResult.totalConsumedPoints)}`;
        }
    }

    /**
     * 渲染积分流水
     */
    function RenderPointLedgerList(pointPanel, ledgerResult) {
        const transactionList = Array.isArray(ledgerResult.transactionList) ? ledgerResult.transactionList : [];
        if (!transactionList.length) {
            pointPanel.listBody.innerHTML = "<tr><td colspan=\"5\" class=\"px-4 py-6 text-sm text-slate-400 text-center\">暂无积分流水</td></tr>";
            return;
        }
        pointPanel.listBody.innerHTML = transactionList.map(function BuildLedgerRow(item) {
            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors\">",
                `<td class="px-4 py-3 text-xs text-slate-500">${EscapeHtml(FormatTime(item.transactionTime))}</td>`,
                `<td class="px-4 py-3 text-xs text-on-surface">${EscapeHtml(FormatTransactionType(item.transactionType))}</td>`,
                `<td class="px-4 py-3 text-xs text-right ${ResolvePointChangeClass(item.changeAmount)}">${EscapeHtml(FormatChangeAmount(item.changeAmount))}</td>`,
                `<td class="px-4 py-3 text-xs text-right text-on-surface">${EscapeHtml(String(SafeNumber(item.balanceAfterChange)))}</td>`,
                `<td class="px-4 py-3 text-xs text-slate-500">${EscapeHtml(item.transactionRemark || "-")}</td>`,
                "</tr>"
            ].join("");
        }).join("");
    }

    /**
     * 应用筛选按钮样式
     */
    function ApplyFilterButtonState(buttonList, activeButton) {
        buttonList.forEach(function ResetButtonStyle(button) {
            button.classList.remove("text-slate-500", "bg-surface-container-low");
            button.classList.add("text-slate-400");
        });
        activeButton.classList.remove("text-slate-400");
        activeButton.classList.add("text-slate-500", "bg-surface-container-low");
    }

    /**
     * 构建分页按钮集合
     */
    function BuildPageButtonList(pageNo, totalPages) {
        if (totalPages <= 5) {
            return BuildRange(1, totalPages);
        }
        if (pageNo <= 3) {
            return [1, 2, 3, "...", totalPages];
        }
        if (pageNo >= totalPages - 2) {
            return [1, "...", totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, "...", pageNo - 1, pageNo, pageNo + 1, "...", totalPages];
    }

    /**
     * 构建区间列表
     */
    function BuildRange(start, end) {
        const result = [];
        for (let value = start; value <= end; value += 1) {
            result.push(value);
        }
        return result;
    }

    /**
     * 状态样式
     */
    function ResolveStatusClass(orderStatus) {
        if (orderStatus === "COMPLETED") {
            return "bg-green-100 text-green-700";
        }
        if (orderStatus === "CANCELED") {
            return "bg-red-100 text-red-700";
        }
        if (orderStatus === "CLOSED") {
            return "bg-slate-200 text-slate-600";
        }
        return "bg-yellow-100 text-yellow-700";
    }

    /**
     * 积分变动颜色
     */
    function ResolvePointChangeClass(changeAmount) {
        if (Number(changeAmount) >= 0) {
            return "text-green-700";
        }
        return "text-red-700";
    }

    /**
     * 积分变动格式化
     */
    function FormatChangeAmount(changeAmount) {
        const amount = Number(changeAmount || 0);
        if (amount >= 0) {
            return `+${amount}`;
        }
        return String(amount);
    }

    /**
     * 流水类型格式化
     */
    function FormatTransactionType(transactionType) {
        if (transactionType === "UPLOAD_REWARD") {
            return "上传奖励";
        }
        if (transactionType === "DOWNLOAD_COST") {
            return "下载扣减";
        }
        if (transactionType === "MANUAL_ADJUST") {
            return "人工调整";
        }
        if (transactionType === "SYSTEM_COMPENSATE") {
            return "系统补偿";
        }
        return transactionType || "-";
    }

    /**
     * 金额格式化
     */
    function FormatAmount(orderAmount) {
        const amount = Number(orderAmount || 0);
        if (Number.isNaN(amount)) {
            return "0.00";
        }
        return amount.toFixed(2);
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
        return value < 10 ? `0${value}` : String(value);
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
     * 数字兜底
     */
    function SafeNumber(value) {
        const numberValue = Number(value || 0);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }

    /**
     * 统一错误文案
     */
    function ResolveErrorText(error, fallback) {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return fallback;
    }

    /**
     * 构建消息条
     */
    function BuildMessageBar(historyCard) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant mb-4";
        messageBar.style.display = "none";
        historyCard.parentElement.insertBefore(messageBar, historyCard);
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
     * 隐藏消息
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindOrderCenterPage);
})();
