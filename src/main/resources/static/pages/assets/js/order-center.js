/**
 * 璁㈠崟涓績椤甸潰閫昏緫
 */
(function InitOrderCenterPage() {
    const DEFAULT_PAGE_NO = 1;
    const DEFAULT_PAGE_SIZE = 10;
    const LEDGER_PREVIEW_SIZE = 5;

    const STATUS_TEXT_MAP = {
        PENDING_SELLER_CONFIRM: "寰呭崠瀹剁‘璁?,
        PENDING_OFFLINE_TRADE: "寰呯嚎涓嬩氦鏄?,
        PENDING_BUYER_CONFIRM: "寰呬拱瀹剁‘璁?,
        COMPLETED: "宸插畬鎴?,
        CANCELED: "宸插彇娑?,
        CLOSED: "宸插叧闂?
    };

    /**
     * 缁戝畾椤甸潰琛屼负
     */
    function BindOrderCenterPage() {
        if (!window.CampusShareApi) {
            return;
        }

        const tableBody = document.querySelector("tbody.divide-y");
        const summaryNumberList = document.querySelectorAll("main .grid p.text-3xl");
        const filterButtonList = document.querySelectorAll(".px-6.py-4.border-b button");
        const paginationText = document.querySelector(".bg-surface-container-low p.text-xs");
        const historyCard = document.querySelector("main .bg-surface-container-lowest.rounded-xl.shadow-sm.overflow-hidden");
        if (!tableBody || summaryNumberList.length < 4 || !historyCard) {
            return;
        }

        const profile = window.CampusShareApi.GetCurrentUserProfile();
        const currentUserId = profile && profile.userId ? Number(profile.userId) : null;

        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant mb-4";
        messageBar.style.display = "none";
        historyCard.parentElement.insertBefore(messageBar, historyCard);

        const pointPanel = BuildPointPanel();
        historyCard.insertAdjacentElement("afterend", pointPanel.panel);

        if (!window.CampusShareApi.GetAuthToken()) {
            ShowError(messageBar, "璇峰厛鐧诲綍鍚庡啀鏌ョ湅璁㈠崟涓績");
            window.setTimeout(function RedirectToAuthPage() {
                if (window.CampusShareApi.RedirectToAuthPage) {
                    window.CampusShareApi.RedirectToAuthPage("/pages/order_center.html");
                    return;
                }
                window.location.href = "/pages/auth_access.html?redirect=%2Fpages%2Forder_center.html";
            }, 700);
            return;
        }

        const state = {
            pageNo: DEFAULT_PAGE_NO,
            pageSize: DEFAULT_PAGE_SIZE,
            statusFilter: "ALL"
        };

        BindFilterButtons(filterButtonList, state, function ReloadByFilter() {
            LoadOrderList(state, currentUserId, summaryNumberList, tableBody, paginationText, messageBar);
        });

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
                    ShowSuccess(messageBar, `璁㈠崟 ${orderId} 宸茬‘璁);
                } else if (action === "complete") {
                    await window.CampusShareApi.CompleteOrder(orderId);
                    ShowSuccess(messageBar, `璁㈠崟 ${orderId} 宸插畬鎴恅);
                } else if (action === "cancel") {
                    await window.CampusShareApi.CancelOrder(orderId);
                    ShowSuccess(messageBar, `璁㈠崟 ${orderId} 宸插彇娑坄);
                } else if (action === "close") {
                    await window.CampusShareApi.CloseOrder(orderId, "鐢ㄦ埛涓诲姩鍏抽棴");
                    ShowSuccess(messageBar, `璁㈠崟 ${orderId} 宸插叧闂璥);
                } else if (action === "detail") {
                    window.location.href = `/pages/order_detail.html?orderId=${encodeURIComponent(String(orderId))}`;
                    return;
                } else {
                    return;
                }
                await LoadOrderList(state, currentUserId, summaryNumberList, tableBody, paginationText, messageBar);
                await LoadPointLedger(pointPanel, summaryNumberList, messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "璁㈠崟鎿嶄綔澶辫触");
            } finally {
                actionButton.disabled = false;
            }
        });

        LoadOrderList(state, currentUserId, summaryNumberList, tableBody, paginationText, messageBar);
        LoadPointLedger(pointPanel, summaryNumberList, messageBar);
    }

    /**
     * 鍔犺浇绉垎娴佹按
     */
    async function LoadPointLedger(pointPanel, summaryNumberList, messageBar) {
        try {
            const ledgerResult = await window.CampusShareApi.ListPointLedger(DEFAULT_PAGE_NO, LEDGER_PREVIEW_SIZE);
            RenderPointSummary(summaryNumberList, ledgerResult);
            RenderPointLedgerList(pointPanel, ledgerResult);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "绉垎娴佹按鍔犺浇澶辫触");
        }
    }

    /**
     * 鏋勫缓绉垎闈㈡澘
     */
    function BuildPointPanel() {
        const panel = document.createElement("section");
        panel.className = "bg-surface-container-lowest rounded-xl shadow-sm p-6 mt-8";
        panel.innerHTML = [
            "<div class=\"flex items-center justify-between mb-4\">",
            "<h3 class=\"text-lg font-bold text-on-surface\">鏈€杩戠Н鍒嗘祦姘?/h3>",
            "<span class=\"text-xs text-slate-500\">鏈€杩?5 鏉?/span>",
            "</div>",
            "<div class=\"overflow-x-auto\">",
            "<table class=\"w-full text-left border-collapse\">",
            "<thead><tr class=\"bg-surface-container-low/50\">",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest\">鏃堕棿</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest\">绫诲瀷</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right\">鍙樺姩</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right\">浣欓</th>",
            "<th class=\"px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest\">澶囨敞</th>",
            "</tr></thead>",
            "<tbody class=\"divide-y divide-surface-container\"></tbody>",
            "</table>",
            "</div>"
        ].join("");
        const listBody = panel.querySelector("tbody");
        return { panel, listBody };
    }

    /**
     * 娓叉煋绉垎鎽樿
     */
    function RenderPointSummary(summaryNumberList, ledgerResult) {
        summaryNumberList[3].textContent = `${SafeNumber(ledgerResult.availablePoints)}`;

        const summaryCardList = document.querySelectorAll("main .max-w-6xl > .grid > div");
        if (summaryCardList.length < 4) {
            return;
        }
        const pointCard = summaryCardList[3];
        const labelNode = pointCard.querySelector("p.text-xs");
        const helperNode = pointCard.querySelector("div.text-xs");
        if (labelNode) {
            labelNode.textContent = "褰撳墠绉垎";
        }
        if (helperNode) {
            helperNode.className = "mt-2 text-xs text-slate-500 font-medium";
            helperNode.textContent = `绱鑾峰緱 ${SafeNumber(ledgerResult.totalEarnedPoints)} / 绱娑堣€?${SafeNumber(ledgerResult.totalConsumedPoints)}`;
        }
    }

    /**
     * 娓叉煋绉垎娴佹按鍒楄〃
     */
    function RenderPointLedgerList(pointPanel, ledgerResult) {
        const transactionList = Array.isArray(ledgerResult.transactionList) ? ledgerResult.transactionList : [];
        if (transactionList.length === 0) {
            pointPanel.listBody.innerHTML = "<tr><td colspan=\"5\" class=\"px-4 py-6 text-sm text-slate-400 text-center\">鏆傛棤绉垎娴佹按</td></tr>";
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
     * 缁戝畾绛涢€夋寜閽?     */
    function BindFilterButtons(filterButtonList, state, onFilterChanged) {
        if (!filterButtonList || filterButtonList.length < 3) {
            return;
        }
        const filterKeyList = ["ALL", "ONGOING", "COMPLETED"];
        filterButtonList.forEach(function BindFilter(button, index) {
            button.setAttribute("data-filter-key", filterKeyList[index] || "ALL");
            button.addEventListener("click", function HandleFilterClick() {
                state.statusFilter = button.getAttribute("data-filter-key") || "ALL";
                state.pageNo = DEFAULT_PAGE_NO;
                filterButtonList.forEach(function ResetButtonStyle(itemButton) {
                    itemButton.classList.remove("text-slate-500", "bg-surface-container-low");
                    itemButton.classList.add("text-slate-400");
                });
                button.classList.remove("text-slate-400");
                button.classList.add("text-slate-500", "bg-surface-container-low");
                onFilterChanged();
            });
        });
    }

    /**
     * 鍔犺浇璁㈠崟鍒楄〃
     */
    async function LoadOrderList(
        state,
        currentUserId,
        summaryNumberList,
        tableBody,
        paginationText,
        messageBar
    ) {
        try {
            const listResult = await window.CampusShareApi.ListMyOrders(state.pageNo, state.pageSize);
            RenderSummary(listResult, summaryNumberList);

            const sourceList = Array.isArray(listResult.orderList) ? listResult.orderList : [];
            const filteredList = FilterOrderListByStatus(sourceList, state.statusFilter);
            RenderOrderTable(filteredList, currentUserId, tableBody);
            RenderPaginationText(listResult.totalCount, filteredList.length, state.pageNo, state.pageSize, paginationText);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "璁㈠崟鍒楄〃鍔犺浇澶辫触");
        }
    }

    /**
     * 娓叉煋椤堕儴缁熻
     */
    function RenderSummary(listResult, summaryNumberList) {
        summaryNumberList[0].textContent = `${SafeNumber(listResult.totalCount)}`;
        summaryNumberList[1].textContent = `${SafeNumber(listResult.ongoingCount)}`;
        summaryNumberList[2].textContent = `${SafeNumber(listResult.completedCount)}`;
    }

    /**
     * 鎸夌瓫閫夋潯浠惰繃婊よ鍗?     */
    function FilterOrderListByStatus(orderList, statusFilter) {
        if (statusFilter === "COMPLETED") {
            return orderList.filter(function FilterCompleted(orderItem) {
                return orderItem.orderStatus === "COMPLETED";
            });
        }
        if (statusFilter === "ONGOING") {
            return orderList.filter(function FilterOngoing(orderItem) {
                return orderItem.orderStatus === "PENDING_SELLER_CONFIRM"
                    || orderItem.orderStatus === "PENDING_OFFLINE_TRADE"
                    || orderItem.orderStatus === "PENDING_BUYER_CONFIRM";
            });
        }
        return orderList;
    }

    /**
     * 娓叉煋璁㈠崟琛ㄦ牸
     */
    function RenderOrderTable(orderList, currentUserId, tableBody) {
        if (!orderList || orderList.length === 0) {
            tableBody.innerHTML = "<tr><td colspan=\"7\" class=\"px-6 py-8 text-center text-sm text-slate-400\">鏆傛棤璁㈠崟鏁版嵁</td></tr>";
            return;
        }

        tableBody.innerHTML = orderList.map(function BuildOrderRow(orderItem) {
            const statusText = STATUS_TEXT_MAP[orderItem.orderStatus] || orderItem.orderStatus;
            const statusClass = ResolveStatusClass(orderItem.orderStatus);
            const counterpartText = BuildCounterpartText(orderItem, currentUserId);
            const actionButtons = BuildActionButtons(orderItem, currentUserId);

            return [
                "<tr class=\"hover:bg-surface-container-low transition-colors group\">",
                `<td class="px-6 py-4 text-xs font-mono text-slate-500">#${EscapeHtml(orderItem.orderNo || "")}</td>`,
                `<td class="px-6 py-4"><p class="text-sm font-bold text-on-surface">鍟嗗搧ID: ${EscapeHtml(String(orderItem.productId || ""))}</p>`,
                `<p class="text-[10px] text-slate-400">浜ゆ槗鍦扮偣: ${EscapeHtml(orderItem.tradeLocation || "-")}</p></td>`,
                `<td class="px-6 py-4 text-sm text-on-surface">${EscapeHtml(counterpartText)}</td>`,
                `<td class="px-6 py-4 text-xs text-slate-500">${EscapeHtml(FormatTime(orderItem.updateTime))}</td>`,
                `<td class="px-6 py-4 text-sm font-bold text-on-surface text-right">锟?{EscapeHtml(FormatAmount(orderItem.orderAmount))}</td>`,
                `<td class="px-6 py-4 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${statusClass}">${EscapeHtml(statusText)}</span></td>`,
                `<td class="px-6 py-4 text-right">${actionButtons}</td>`,
                "</tr>"
            ].join("");
        }).join("");
    }

    /**
     * 娓叉煋鍒嗛〉鎻愮ず
     */
    function RenderPaginationText(totalCount, currentCount, pageNo, pageSize, paginationText) {
        if (!paginationText) {
            return;
        }
        const safeTotalCount = SafeNumber(totalCount);
        const start = safeTotalCount === 0 ? 0 : ((pageNo - 1) * pageSize + 1);
        const end = safeTotalCount === 0 ? 0 : (start + currentCount - 1);
        paginationText.textContent = `鏄剧ず ${safeTotalCount} 涓鍗曚腑鐨?${start}-${end} 椤筦;
    }

    /**
     * 鏋勫缓瀵规柟淇℃伅
     */
    function BuildCounterpartText(orderItem, currentUserId) {
        if (!currentUserId) {
            return `涔板ID:${orderItem.buyerUserId} / 鍗栧ID:${orderItem.sellerUserId}`;
        }
        if (Number(orderItem.buyerUserId) === Number(currentUserId)) {
            return `鎴戞槸涔板 / 鍗栧ID:${orderItem.sellerUserId}`;
        }
        if (Number(orderItem.sellerUserId) === Number(currentUserId)) {
            return `鎴戞槸鍗栧 / 涔板ID:${orderItem.buyerUserId}`;
        }
        return `涔板ID:${orderItem.buyerUserId} / 鍗栧ID:${orderItem.sellerUserId}`;
    }

    /**
     * 鏋勫缓鎿嶄綔鎸夐挳
     */
    function BuildActionButtons(orderItem, currentUserId) {
        const buttonClass = "text-xs font-bold px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-all";
        const currentUserIdNumber = currentUserId ? Number(currentUserId) : null;
        const isBuyer = currentUserIdNumber !== null && Number(orderItem.buyerUserId) === currentUserIdNumber;
        const isSeller = currentUserIdNumber !== null && Number(orderItem.sellerUserId) === currentUserIdNumber;

        if (orderItem.orderStatus === "PENDING_SELLER_CONFIRM" && isSeller) {
            return [
                `<button data-order-action="confirm" data-order-id="${orderItem.orderId}" class="${buttonClass} text-primary">纭</button>`,
                `<button data-order-action="cancel" data-order-id="${orderItem.orderId}" class="${buttonClass} ml-2 text-slate-600">鍙栨秷</button>`
            ].join("");
        }
        if ((orderItem.orderStatus === "PENDING_OFFLINE_TRADE" || orderItem.orderStatus === "PENDING_BUYER_CONFIRM") && isBuyer) {
            return [
                `<button data-order-action="complete" data-order-id="${orderItem.orderId}" class="${buttonClass} text-secondary">瀹屾垚</button>`,
                `<button data-order-action="cancel" data-order-id="${orderItem.orderId}" class="${buttonClass} ml-2 text-slate-600">鍙栨秷</button>`
            ].join("");
        }
        if ((orderItem.orderStatus === "PENDING_SELLER_CONFIRM" || orderItem.orderStatus === "PENDING_OFFLINE_TRADE") && isSeller) {
            return `<button data-order-action="close" data-order-id="${orderItem.orderId}" class="${buttonClass} text-slate-600">鍏抽棴</button>`;
        }
        return `<button data-order-action="detail" data-order-id="${orderItem.orderId}" class="${buttonClass} text-slate-600">鏌ョ湅</button>`;
    }

    /**
     * 瑙ｆ瀽鐘舵€佹牱寮?     */
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
     * 瑙ｆ瀽绉垎鍙樺姩鏍峰紡
     */
    function ResolvePointChangeClass(changeAmount) {
        if (Number(changeAmount) >= 0) {
            return "text-green-700";
        }
        return "text-red-700";
    }

    /**
     * 鏍煎紡鍖栫Н鍒嗗彉鍔?     */
    function FormatChangeAmount(changeAmount) {
        const numericAmount = Number(changeAmount || 0);
        if (numericAmount >= 0) {
            return `+${numericAmount}`;
        }
        return `${numericAmount}`;
    }

    /**
     * 鏍煎紡鍖栨祦姘寸被鍨?     */
    function FormatTransactionType(transactionType) {
        if (transactionType === "UPLOAD_REWARD") {
            return "涓婁紶濂栧姳";
        }
        if (transactionType === "DOWNLOAD_COST") {
            return "涓嬭浇鎵ｅ噺";
        }
        if (transactionType === "MANUAL_ADJUST") {
            return "浜哄伐璋冩暣";
        }
        if (transactionType === "SYSTEM_COMPENSATE") {
            return "绯荤粺琛ュ伩";
        }
        return transactionType || "-";
    }

    /**
     * 閲戦鏍煎紡鍖?     */
    function FormatAmount(orderAmount) {
        const numericAmount = Number(orderAmount || 0);
        if (Number.isNaN(numericAmount)) {
            return "0.00";
        }
        return numericAmount.toFixed(2);
    }

    /**
     * 鏃堕棿鏍煎紡鍖?     */
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
     * 鏃堕棿琛ラ浂
     */
    function PadTime(value) {
        return value < 10 ? `0${value}` : `${value}`;
    }

    /**
     * HTML杞箟
     */
    function EscapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * 鍏滃簳鏁板€?     */
    function SafeNumber(value) {
        const numberValue = Number(value || 0);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }

    /**
     * 鏄剧ず鎴愬姛淇℃伅
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 mb-4";
        messageBar.textContent = message;
    }

    /**
     * 鏄剧ず閿欒淇℃伅
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 mb-4";
        messageBar.textContent = message;
    }

    document.addEventListener("DOMContentLoaded", BindOrderCenterPage);
})();

