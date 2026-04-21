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

    const TRACKING_STAGE_LIST = [
        { key: "PENDING_SELLER_CONFIRM", label: "已下单" },
        { key: "PENDING_OFFLINE_TRADE", label: "卖家确认" },
        { key: "PENDING_BUYER_CONFIRM", label: "待买家确认" },
        { key: "COMPLETED", label: "已完成" }
    ];

    /**
     * 页面初始化
     */
    function BindOrderCenterPage() {
        if (!window.CampusShareApi) {
            return;
        }

        const tableBody = document.querySelector("tbody.divide-y");
        const historyCard = document.querySelector("main .bg-surface-container-lowest.rounded-xl.shadow-sm.overflow-hidden");
        const filterButtonList = document.querySelectorAll(".px-6.py-4.border-b button");
        const paginationBar = document.querySelector(".bg-surface-container-low.p-4.flex.justify-between.items-center.px-6");
        const paginationText = paginationBar ? paginationBar.querySelector("p.text-xs") : null;
        const paginationButtonContainer = paginationBar ? paginationBar.querySelector("div.flex.gap-1") : null;
        const summaryNodeMap = {
            total: document.querySelector("[data-role='order-summary-total']"),
            ongoing: document.querySelector("[data-role='order-summary-ongoing']"),
            completed: document.querySelector("[data-role='order-summary-completed']"),
            point: document.querySelector("[data-role='order-summary-point']")
        };
        const trackingSection = document.querySelector("[data-role='order-tracking-section']");

        if (!tableBody || !historyCard || !paginationText || !paginationButtonContainer || !trackingSection) {
            return;
        }

        if (!window.CampusShareApi.GetAuthToken()) {
            window.CampusShareApi.RedirectToAuthPage("/pages/order_center.html");
            return;
        }

        const profile = window.CampusShareApi.GetCurrentUserProfile() || {};
        const currentUserId = Number(profile.userId || 0);
        const messageBar = BuildMessageBar(historyCard);
        const pointPanel = BuildPointPanel();
        historyCard.insertAdjacentElement("afterend", pointPanel.panel);
        const reviewModal = BuildReviewModal();
        document.body.appendChild(reviewModal.wrapper);

        const state = {
            pageNo: DEFAULT_PAGE_NO,
            pageSize: DEFAULT_PAGE_SIZE,
            totalCount: 0,
            totalPages: 1,
            statusFilter: "ALL",
            orderMap: new Map()
        };

        BindFilterButtons(filterButtonList, state, function ReloadFromFilter() {
            LoadOrderList(
                state,
                currentUserId,
                summaryNodeMap,
                tableBody,
                trackingSection,
                paginationText,
                paginationButtonContainer,
                messageBar
            );
        });
        BindActionButtons(
            tableBody,
            state,
            currentUserId,
            summaryNodeMap,
            pointPanel,
            trackingSection,
            paginationText,
            paginationButtonContainer,
            messageBar,
            reviewModal
        );
        BindTrackingActions(trackingSection);
        BindPaginationButtons(paginationButtonContainer, state, function ReloadFromPage() {
            LoadOrderList(
                state,
                currentUserId,
                summaryNodeMap,
                tableBody,
                trackingSection,
                paginationText,
                paginationButtonContainer,
                messageBar
            );
        });

        LoadOrderList(
            state,
            currentUserId,
            summaryNodeMap,
            tableBody,
            trackingSection,
            paginationText,
            paginationButtonContainer,
            messageBar
        );
        LoadPointLedger(pointPanel, summaryNodeMap, messageBar);
    }

    /**
     * 绑定追踪区域动作
     */
    function BindTrackingActions(trackingSection) {
        if (!trackingSection) {
            return;
        }
        trackingSection.addEventListener("click", function HandleTrackingClick(event) {
            const actionButton = event.target.closest("button[data-order-action='detail']");
            if (!actionButton) {
                return;
            }
            const orderId = Number(actionButton.getAttribute("data-order-id") || "0");
            if (!orderId) {
                return;
            }
            window.location.href = `/pages/order_detail.html?orderId=${encodeURIComponent(String(orderId))}`;
        });
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
        summaryNodeMap,
        pointPanel,
        trackingSection,
        paginationText,
        paginationButtonContainer,
        messageBar,
        reviewModal
    ) {
        tableBody.addEventListener("click", async function HandleActionClick(event) {
            const actionButton = event.target.closest("button[data-order-action]");
            if (!actionButton) {
                return;
            }
            const action = actionButton.getAttribute("data-order-action");
            const orderId = Number(actionButton.getAttribute("data-order-id") || "0");
            if (!action || !orderId) {
                return;
            }

            if (action === "detail") {
                window.location.href = `/pages/order_detail.html?orderId=${encodeURIComponent(String(orderId))}`;
                return;
            }

            if (action === "review") {
                const targetOrder = state.orderMap.get(orderId);
                if (!targetOrder) {
                    ShowError(messageBar, "未找到可评价订单");
                    return;
                }
                OpenReviewModal(reviewModal, targetOrder, messageBar, async function AfterReviewSubmitted() {
                    await LoadOrderList(
                        state,
                        currentUserId,
                        summaryNodeMap,
                        tableBody,
                        trackingSection,
                        paginationText,
                        paginationButtonContainer,
                        messageBar
                    );
                });
                return;
            }

            actionButton.disabled = true;
            try {
                if (action === "confirm") {
                    await window.CampusShareApi.ConfirmOrder(orderId);
                    ShowSuccess(messageBar, `订单 #${orderId} 已确认`);
                } else if (action === "handover") {
                    await window.CampusShareApi.HandoverOrder(orderId);
                    ShowSuccess(messageBar, `订单 #${orderId} 已转为待买家确认`);
                } else if (action === "complete") {
                    await window.CampusShareApi.CompleteOrder(orderId);
                    ShowSuccess(messageBar, `订单 #${orderId} 已完成`);
                } else if (action === "cancel") {
                    await window.CampusShareApi.CancelOrder(orderId);
                    ShowSuccess(messageBar, `订单 #${orderId} 已取消`);
                } else if (action === "close") {
                    await window.CampusShareApi.CloseOrder(orderId, "用户手动关闭");
                    ShowSuccess(messageBar, `订单 #${orderId} 已关闭`);
                } else {
                    return;
                }
                await LoadOrderList(
                    state,
                    currentUserId,
                    summaryNodeMap,
                    tableBody,
                    trackingSection,
                    paginationText,
                    paginationButtonContainer,
                    messageBar
                );
                await LoadPointLedger(pointPanel, summaryNodeMap, messageBar);
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
        summaryNodeMap,
        tableBody,
        trackingSection,
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

            const orderList = Array.isArray(listResult.orderList) ? listResult.orderList : [];
            state.orderMap = new Map(orderList.map(function MapOrder(item) {
                return [Number(item.orderId), item];
            }));

            RenderSummaryCards(summaryNodeMap, listResult);
            RenderOrderTracking(trackingSection, orderList, currentUserId);
            RenderOrderTable(orderList, currentUserId, tableBody);
            RenderPaginationArea(state, orderList.length, paginationText, paginationButtonContainer);
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, ResolveErrorText(error, "订单列表加载失败"));
            RenderOrderTracking(trackingSection, [], currentUserId);
            RenderOrderTable([], currentUserId, tableBody);
        }
    }

    /**
     * 加载积分流水
     */
    async function LoadPointLedger(pointPanel, summaryNodeMap, messageBar) {
        try {
            const ledgerResult = await window.CampusShareApi.ListPointLedger(DEFAULT_PAGE_NO, LEDGER_PREVIEW_SIZE);
            RenderPointSummary(summaryNodeMap, ledgerResult);
            RenderPointLedgerList(pointPanel, ledgerResult);
        } catch (error) {
            ShowError(messageBar, ResolveErrorText(error, "积分流水加载失败"));
        }
    }

    /**
     * 渲染统计卡
     */
    function RenderSummaryCards(summaryNodeMap, listResult) {
        if (summaryNodeMap.total) {
            summaryNodeMap.total.textContent = String(SafeNumber(listResult.totalCount));
        }
        if (summaryNodeMap.ongoing) {
            summaryNodeMap.ongoing.textContent = String(SafeNumber(listResult.ongoingCount));
        }
        if (summaryNodeMap.completed) {
            summaryNodeMap.completed.textContent = String(SafeNumber(listResult.completedCount));
        }
    }

    /**
     * 渲染订单追踪
     */
    function RenderOrderTracking(trackingSection, orderList, currentUserId) {
        if (!trackingSection) {
            return;
        }
        const ongoingOrder = (orderList || []).find(function FindOngoing(item) {
            return item.orderStatus === "PENDING_SELLER_CONFIRM"
                || item.orderStatus === "PENDING_OFFLINE_TRADE"
                || item.orderStatus === "PENDING_BUYER_CONFIRM";
        });
        const targetOrder = ongoingOrder || (orderList && orderList.length ? orderList[0] : null);
        if (!targetOrder) {
            trackingSection.innerHTML = "<div class=\"text-center text-sm text-slate-400 py-6\">暂无可追踪订单</div>";
            return;
        }

        const stageIndex = ResolveTrackingStageIndex(targetOrder.orderStatus);
        const progressWidth = Math.max(0, Math.min(100, (stageIndex / (TRACKING_STAGE_LIST.length - 1)) * 100));
        const statusText = STATUS_TEXT_MAP[targetOrder.orderStatus] || targetOrder.orderStatus || "未知状态";
        const counterpartText = BuildCounterpartText(targetOrder, currentUserId);
        const stepsHtml = TRACKING_STAGE_LIST.map(function BuildStep(step, index) {
            const reached = index <= stageIndex;
            return [
                "<div class=\"relative z-10 flex flex-col items-center\">",
                `<div class="w-10 h-10 rounded-full flex items-center justify-center ${reached ? "bg-primary text-white" : "bg-surface-container text-slate-300 border-4 border-white"}">`,
                `<span class="material-symbols-outlined">${reached ? "check" : "circle"}</span>`,
                "</div>",
                `<span class="mt-3 text-xs font-bold ${reached ? "text-on-surface" : "text-slate-400"}">${EscapeHtml(step.label)}</span>`,
                `<span class="text-[10px] text-slate-400">${EscapeHtml(index === stageIndex ? FormatTime(targetOrder.updateTime) : "--")}</span>`,
                "</div>"
            ].join("");
        }).join("");

        trackingSection.innerHTML = [
            "<div class=\"flex justify-between items-center mb-6\">",
            "<h2 class=\"text-xl font-bold text-on-surface\">订单追踪</h2>",
            `<span class="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-widest">${EscapeHtml(statusText)}</span>`,
            "</div>",
            "<div class=\"flex items-center justify-between relative mb-12\">",
            "<div class=\"absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0\"></div>",
            `<div class="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0" style="width:${progressWidth}%"></div>`,
            stepsHtml,
            "</div>",
            "<div class=\"bg-surface-container-low p-5 rounded-lg flex items-center justify-between gap-4 flex-wrap\">",
            "<div class=\"min-w-0\">",
            `<p class="text-sm font-bold text-on-surface">订单号: #${EscapeHtml(targetOrder.orderNo || targetOrder.orderId)}</p>`,
            `<p class="text-xs text-slate-500 mt-1">商品ID: ${EscapeHtml(String(targetOrder.productId || "-"))} · ${EscapeHtml(counterpartText)}</p>`,
            "</div>",
            "<div class=\"flex gap-3\">",
            `<button class="bg-white text-on-surface border border-outline-variant text-xs font-bold px-5 py-2 rounded-lg hover:bg-surface-container transition-all" data-order-action="detail" data-order-id="${EscapeHtml(String(targetOrder.orderId))}">查看详情</button>`,
            "</div>",
            "</div>"
        ].join("");
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
        if (orderItem.orderStatus === "PENDING_OFFLINE_TRADE" && isSeller) {
            return [
                `<button data-order-action="handover" data-order-id="${orderItem.orderId}" class="${buttonClass} text-primary">线下已交付</button>`,
                `<button data-order-action="close" data-order-id="${orderItem.orderId}" class="${buttonClass} ml-2 text-slate-600">关闭</button>`
            ].join("");
        }
        if (orderItem.orderStatus === "PENDING_BUYER_CONFIRM" && isBuyer) {
            return [
                `<button data-order-action="complete" data-order-id="${orderItem.orderId}" class="${buttonClass} text-secondary">完成</button>`,
                `<button data-order-action="cancel" data-order-id="${orderItem.orderId}" class="${buttonClass} ml-2 text-slate-600">取消</button>`
            ].join("");
        }
        if (orderItem.orderStatus === "COMPLETED" && isBuyer) {
            return [
                `<button data-order-action="review" data-order-id="${orderItem.orderId}" class="${buttonClass} text-primary">去评价</button>`,
                `<button data-order-action="detail" data-order-id="${orderItem.orderId}" class="${buttonClass} ml-2 text-slate-600">详情</button>`
            ].join("");
        }
        return `<button data-order-action="detail" data-order-id="${orderItem.orderId}" class="${buttonClass} text-slate-600">查看</button>`;
    }

    /**
     * 构建评价弹窗
     */
    function BuildReviewModal() {
        const wrapper = document.createElement("div");
        wrapper.className = "hidden fixed inset-0 z-[1300] bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-4";
        wrapper.innerHTML = [
            "<div class=\"w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-xl p-6\">",
            "<div class=\"flex items-center justify-between mb-4\">",
            "<h3 class=\"text-lg font-bold text-on-surface\">订单评价</h3>",
            "<button type=\"button\" data-role=\"close\" class=\"material-symbols-outlined text-slate-500 hover:text-slate-700\">close</button>",
            "</div>",
            "<p class=\"text-sm text-slate-500 mb-4\" data-role=\"order-label\">-</p>",
            "<label class=\"block mb-4\">",
            "<span class=\"text-xs text-slate-500 font-semibold\">评分</span>",
            "<select data-role=\"score\" class=\"mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm\">",
            "<option value=\"5\">5 分</option>",
            "<option value=\"4\">4 分</option>",
            "<option value=\"3\">3 分</option>",
            "<option value=\"2\">2 分</option>",
            "<option value=\"1\">1 分</option>",
            "</select>",
            "</label>",
            "<label class=\"block\">",
            "<span class=\"text-xs text-slate-500 font-semibold\">评价内容</span>",
            "<textarea data-role=\"content\" maxlength=\"500\" rows=\"4\" class=\"mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-sm resize-none\" placeholder=\"请输入本次交易体验\"></textarea>",
            "</label>",
            "<div class=\"flex justify-end items-center gap-3 mt-5\">",
            "<button type=\"button\" data-role=\"cancel\" class=\"px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container\">取消</button>",
            "<button type=\"button\" data-role=\"submit\" class=\"px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold\">提交评价</button>",
            "</div>",
            "</div>"
        ].join("");

        return {
            wrapper,
            closeButton: wrapper.querySelector("[data-role='close']"),
            cancelButton: wrapper.querySelector("[data-role='cancel']"),
            submitButton: wrapper.querySelector("[data-role='submit']"),
            orderLabel: wrapper.querySelector("[data-role='order-label']"),
            scoreSelect: wrapper.querySelector("[data-role='score']"),
            contentInput: wrapper.querySelector("[data-role='content']"),
            currentOrder: null
        };
    }

    /**
     * 打开评价弹窗
     */
    function OpenReviewModal(reviewModal, orderItem, messageBar, onSubmitted) {
        if (!reviewModal || !orderItem) {
            return;
        }
        reviewModal.currentOrder = orderItem;
        reviewModal.orderLabel.textContent = `订单 #${orderItem.orderNo || orderItem.orderId} · 商品ID ${orderItem.productId || "-"}`;
        reviewModal.scoreSelect.value = "5";
        reviewModal.contentInput.value = "";
        reviewModal.wrapper.classList.remove("hidden");

        const closeModal = function CloseModal() {
            reviewModal.wrapper.classList.add("hidden");
            reviewModal.currentOrder = null;
        };

        reviewModal.closeButton.onclick = closeModal;
        reviewModal.cancelButton.onclick = closeModal;
        reviewModal.wrapper.onclick = function HandleOverlayClick(event) {
            if (event.target === reviewModal.wrapper) {
                closeModal();
            }
        };

        reviewModal.submitButton.onclick = async function HandleSubmitReview() {
            const currentOrder = reviewModal.currentOrder;
            if (!currentOrder || !currentOrder.productId) {
                ShowError(messageBar, "当前订单缺少商品信息，无法评价");
                return;
            }
            const score = Number(reviewModal.scoreSelect.value || "0");
            const content = reviewModal.contentInput.value ? reviewModal.contentInput.value.trim() : "";
            if (!score || score < 1 || score > 5) {
                ShowError(messageBar, "评分需在 1 到 5 分之间");
                return;
            }
            if (!content) {
                ShowError(messageBar, "评价内容不能为空");
                return;
            }

            reviewModal.submitButton.disabled = true;
            try {
                await window.CampusShareApi.CreateProductComment(currentOrder.productId, {
                    score: score,
                    content: content,
                    toUserId: currentOrder.sellerUserId || null
                });
                closeModal();
                ShowSuccess(messageBar, "评价已提交");
                if (typeof onSubmitted === "function") {
                    await onSubmitted();
                }
            } catch (error) {
                ShowError(messageBar, ResolveErrorText(error, "评价提交失败"));
            } finally {
                reviewModal.submitButton.disabled = false;
            }
        };
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
            panel: panel,
            listBody: panel.querySelector("tbody")
        };
    }

    /**
     * 渲染积分摘要
     */
    function RenderPointSummary(summaryNodeMap, ledgerResult) {
        if (summaryNodeMap.point) {
            summaryNodeMap.point.textContent = String(SafeNumber(ledgerResult.availablePoints));
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
     * 筛选按钮样式
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
     * 构建区间
     */
    function BuildRange(start, end) {
        const result = [];
        for (let value = start; value <= end; value += 1) {
            result.push(value);
        }
        return result;
    }

    /**
     * 追踪阶段索引
     */
    function ResolveTrackingStageIndex(orderStatus) {
        if (orderStatus === "PENDING_SELLER_CONFIRM") {
            return 0;
        }
        if (orderStatus === "PENDING_OFFLINE_TRADE") {
            return 1;
        }
        if (orderStatus === "PENDING_BUYER_CONFIRM") {
            return 2;
        }
        if (orderStatus === "COMPLETED") {
            return 3;
        }
        return 0;
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
     * 积分变动样式
     */
    function ResolvePointChangeClass(changeAmount) {
        return Number(changeAmount) >= 0 ? "text-green-700" : "text-red-700";
    }

    /**
     * 积分变动格式
     */
    function FormatChangeAmount(changeAmount) {
        const amount = Number(changeAmount || 0);
        return amount >= 0 ? `+${amount}` : String(amount);
    }

    /**
     * 流水类型格式
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
     * 金额格式
     */
    function FormatAmount(orderAmount) {
        const amount = Number(orderAmount || 0);
        if (Number.isNaN(amount)) {
            return "0.00";
        }
        return amount.toFixed(2);
    }

    /**
     * 时间格式
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
     * HTML 转义
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
     * 错误文案
     */
    function ResolveErrorText(error, fallback) {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return fallback;
    }

    /**
     * 构建消息栏
     */
    function BuildMessageBar(historyCard) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant mb-4";
        messageBar.style.display = "none";
        historyCard.parentElement.insertBefore(messageBar, historyCard);
        return messageBar;
    }

    /**
     * 成功提示
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 mb-4";
        messageBar.textContent = message;
    }

    /**
     * 错误提示
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
