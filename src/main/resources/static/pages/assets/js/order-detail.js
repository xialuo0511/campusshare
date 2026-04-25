/**
 * 订单详情页面逻辑
 */
(function InitOrderDetailPage() {
    const STEP_ICON_MAP = {
        1: "check",
        2: "check",
        3: "handshake",
        4: "verified"
    };

    const ORDER_STATUS_TEXT_MAP = {
        PENDING_SELLER_CONFIRM: "待卖家确认",
        PENDING_OFFLINE_TRADE: "待线下交易",
        PENDING_BUYER_CONFIRM: "待买家确认",
        COMPLETED: "已完成",
        CANCELED: "已取消",
        CLOSED: "已关闭"
    };

    /**
     * 页面入口
     */
    function BindOrderDetailPage() {
        if (!window.CampusShareApi) {
            return;
        }
        const mainElement = document.querySelector("main");
        if (!mainElement) {
            return;
        }
        const orderId = ResolveOrderId();
        const messageBar = BuildMessageBar(mainElement);
        if (!orderId) {
            ShowError(messageBar, "缺少订单编号，请从订单中心进入");
            return;
        }
        if (!window.CampusShareApi.GetAuthToken()) {
            window.CampusShareApi.RedirectToAuthPage(`/pages/order_detail.html?orderId=${encodeURIComponent(String(orderId))}`);
            return;
        }

        const pageRefs = CollectPageRefs(mainElement);
        LoadOrderDetail(orderId, pageRefs, messageBar);
    }

    /**
     * 采集页面锚点
     */
    function CollectPageRefs(mainElement) {
        return {
            heading: mainElement.querySelector("[data-role='order-heading']"),
            statusPill: mainElement.querySelector("[data-role='order-status-pill']"),
            progressBar: mainElement.querySelector("[data-role='order-timeline-progress']"),
            actionPrimary: mainElement.querySelector("[data-role='order-action-primary']"),
            actionSecondary: mainElement.querySelector("[data-role='order-action-secondary']"),
            actionDanger: mainElement.querySelector("[data-role='order-action-danger']"),
            productImage: mainElement.querySelector("[data-role='order-product-image']"),
            productTitle: mainElement.querySelector("[data-role='order-product-title']"),
            productPrice: mainElement.querySelector("[data-role='order-product-price']"),
            productCondition: mainElement.querySelector("[data-role='order-product-condition']"),
            productCategory: mainElement.querySelector("[data-role='order-product-category']"),
            productDescription: mainElement.querySelector("[data-role='order-product-description']"),
            buyerAvatar: mainElement.querySelector("[data-role='order-buyer-avatar']"),
            buyerName: mainElement.querySelector("[data-role='order-buyer-name']"),
            buyerSubtitle: mainElement.querySelector("[data-role='order-buyer-subtitle']"),
            sellerAvatar: mainElement.querySelector("[data-role='order-seller-avatar']"),
            sellerName: mainElement.querySelector("[data-role='order-seller-name']"),
            sellerSubtitle: mainElement.querySelector("[data-role='order-seller-subtitle']"),
            tradeLocation: mainElement.querySelector("[data-role='order-trade-location']"),
            tradeLocationSub: mainElement.querySelector("[data-role='order-trade-location-sub']"),
            amountMain: mainElement.querySelector("[data-role='order-amount-main']"),
            amountItem: mainElement.querySelector("[data-role='order-amount-item']"),
            metaOrderNo: mainElement.querySelector("[data-role='order-meta-order-no']"),
            metaCreateTime: mainElement.querySelector("[data-role='order-meta-create-time']"),
            metaUpdateTime: mainElement.querySelector("[data-role='order-meta-update-time']"),
            metaSellerConfirmTime: mainElement.querySelector("[data-role='order-meta-seller-confirm-time']"),
            metaBuyerConfirmTime: mainElement.querySelector("[data-role='order-meta-buyer-confirm-time']"),
            metaStatusText: mainElement.querySelector("[data-role='order-meta-status-text']"),
            metaCloseReason: mainElement.querySelector("[data-role='order-meta-close-reason']"),
            stepList: [1, 2, 3, 4].map(function BuildStepRef(index) {
                return {
                    circle: mainElement.querySelector(`[data-role='order-step-circle-${index}']`),
                    icon: mainElement.querySelector(`[data-role='order-step-icon-${index}']`),
                    label: mainElement.querySelector(`[data-role='order-step-label-${index}']`),
                    time: mainElement.querySelector(`[data-role='order-step-time-${index}']`)
                };
            })
        };
    }

    /**
     * 加载订单
     */
    async function LoadOrderDetail(orderId, pageRefs, messageBar) {
        try {
            const detailResult = await window.CampusShareApi.GetOrderDetail(orderId);
            if (!detailResult || !detailResult.orderId) {
                ShowError(messageBar, "订单不存在或无权限访问");
                return;
            }
            let productResult = null;
            if (detailResult.productId) {
                try {
                    productResult = await window.CampusShareApi.GetProductDetail(detailResult.productId);
                } catch (error) {
                    productResult = null;
                    ShowError(messageBar, error instanceof Error ? error.message : "商品信息加载失败");
                }
            }

            PatchHeader(detailResult, pageRefs);
            PatchTimeline(detailResult, pageRefs);
            PatchSummary(detailResult, pageRefs);
            PatchProductDetail(detailResult, productResult, pageRefs);
            PatchParticipants(detailResult, productResult, pageRefs);
            PatchOrderMeta(detailResult, pageRefs);
            BindActionPanel(detailResult, pageRefs, messageBar);
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "订单加载失败");
        }
    }

    /**
     * 头部数据
     */
    function PatchHeader(detailResult, pageRefs) {
        const orderNoText = detailResult.orderNo || detailResult.orderId || "-";
        const statusText = ORDER_STATUS_TEXT_MAP[detailResult.orderStatus] || detailResult.orderStatus || "未知状态";
        if (pageRefs.heading) {
            pageRefs.heading.textContent = `订单编号: ${orderNoText}`;
        }
        if (pageRefs.statusPill) {
            pageRefs.statusPill.textContent = statusText;
        }
        if (pageRefs.metaStatusText) {
            pageRefs.metaStatusText.textContent = statusText;
        }
    }

    /**
     * 时间轴
     */
    function PatchTimeline(detailResult, pageRefs) {
        const timelineState = ResolveTimelineState(detailResult.orderStatus);
        if (pageRefs.progressBar) {
            pageRefs.progressBar.style.width = `${timelineState.progressWidth}%`;
        }
        const stepTimeList = [
            FormatTime(detailResult.createTime),
            FormatTime(detailResult.sellerConfirmTime),
            ResolveOfflineTradeTime(detailResult),
            FormatTime(detailResult.buyerCompleteTime)
        ];

        pageRefs.stepList.forEach(function RenderStep(stepItem, index) {
            const stepNumber = index + 1;
            const stepState = timelineState.stepStateList[index];
            if (!stepItem) {
                return;
            }
            if (stepItem.time) {
                stepItem.time.textContent = stepTimeList[index] || "-";
            }
            if (!stepItem.circle || !stepItem.icon || !stepItem.label) {
                return;
            }
            if (stepState === "completed") {
                SetStepCompletedStyle(stepItem);
                return;
            }
            if (stepState === "active") {
                SetStepActiveStyle(stepItem, stepNumber);
                return;
            }
            SetStepPendingStyle(stepItem, stepNumber);
        });
    }

    /**
     * 金额与地点
     */
    function PatchSummary(detailResult, pageRefs) {
        const amountText = `¥ ${FormatAmount(detailResult.orderAmount)}`;
        if (pageRefs.amountMain) {
            pageRefs.amountMain.textContent = amountText;
        }
        if (pageRefs.amountItem) {
            pageRefs.amountItem.textContent = amountText;
        }
        if (pageRefs.productPrice) {
            pageRefs.productPrice.textContent = amountText;
        }
        if (pageRefs.tradeLocation) {
            pageRefs.tradeLocation.textContent = detailResult.tradeLocation || "待协商";
        }
        if (pageRefs.tradeLocationSub) {
            pageRefs.tradeLocationSub.textContent = detailResult.tradeLocation
                ? "请按约定时间到达交易地点"
                : "请与交易对方沟通具体地点";
        }
    }

    /**
     * 商品信息
     */
    function PatchProductDetail(detailResult, productResult, pageRefs) {
        if (!productResult) {
            if (pageRefs.productTitle) {
                pageRefs.productTitle.textContent = detailResult.productId
                    ? `商品 #${detailResult.productId}`
                    : "商品信息不可用";
            }
            return;
        }
        if (pageRefs.productTitle) {
            pageRefs.productTitle.textContent = productResult.title || `商品 #${detailResult.productId || "-"}`;
        }
        if (pageRefs.productCondition) {
            pageRefs.productCondition.textContent = productResult.conditionLevel || "-";
        }
        if (pageRefs.productCategory) {
            pageRefs.productCategory.textContent = productResult.category || "-";
        }
        if (pageRefs.productDescription) {
            pageRefs.productDescription.textContent = productResult.description || "暂无商品描述";
        }
        if (pageRefs.productImage) {
            const imageUrl = ResolveProductImageUrl(productResult.imageFileIds);
            if (imageUrl) {
                pageRefs.productImage.src = imageUrl;
            }
        }
    }

    /**
     * 买卖双方
     */
    function PatchParticipants(detailResult, productResult, pageRefs) {
        const profile = window.CampusShareApi.GetCurrentUserProfile() || {};
        const currentUserId = Number(profile.userId || 0);
        const currentUserName = profile.displayName || profile.account || "";
        const buyerNameFromOrder = detailResult && detailResult.buyerDisplayName ? String(detailResult.buyerDisplayName).trim() : "";
        const sellerNameFromOrder = detailResult && detailResult.sellerDisplayName ? String(detailResult.sellerDisplayName).trim() : "";
        const sellerNameFromProduct = productResult && productResult.sellerDisplayName ? productResult.sellerDisplayName : "";

        if (pageRefs.buyerName) {
            if (buyerNameFromOrder) {
                pageRefs.buyerName.textContent = buyerNameFromOrder;
            } else if (currentUserId > 0 && currentUserId === Number(detailResult.buyerUserId || 0) && currentUserName) {
                pageRefs.buyerName.textContent = currentUserName;
            } else {
                pageRefs.buyerName.textContent = BuildUserLabel(detailResult.buyerUserId, "买家");
            }
        }
        if (pageRefs.buyerSubtitle) {
            pageRefs.buyerSubtitle.textContent = `用户ID: ${detailResult.buyerUserId || "-"}`;
        }
        if (pageRefs.sellerName) {
            if (sellerNameFromOrder) {
                pageRefs.sellerName.textContent = sellerNameFromOrder;
            } else if (sellerNameFromProduct) {
                pageRefs.sellerName.textContent = sellerNameFromProduct;
            } else if (currentUserId > 0 && currentUserId === Number(detailResult.sellerUserId || 0) && currentUserName) {
                pageRefs.sellerName.textContent = currentUserName;
            } else {
                pageRefs.sellerName.textContent = BuildUserLabel(detailResult.sellerUserId, "卖家");
            }
        }
        if (pageRefs.sellerSubtitle) {
            pageRefs.sellerSubtitle.textContent = `用户ID: ${detailResult.sellerUserId || "-"}`;
        }
        PatchParticipantAvatar(pageRefs.buyerAvatar, detailResult.buyerUserId, pageRefs.buyerName ? pageRefs.buyerName.textContent : "买家", profile);
        PatchParticipantAvatar(pageRefs.sellerAvatar, detailResult.sellerUserId, pageRefs.sellerName ? pageRefs.sellerName.textContent : "卖家", profile);
    }

    function PatchParticipantAvatar(avatarNode, participantUserId, displayName, currentProfile) {
        if (!avatarNode) {
            return;
        }
        const currentUserId = Number(currentProfile && currentProfile.userId ? currentProfile.userId : 0);
        const isCurrentUser = currentUserId > 0 && currentUserId === Number(participantUserId || 0);
        const avatarProfile = isCurrentUser ? currentProfile : { displayName };
        if (window.CampusShareApi.RenderUserAvatar) {
            window.CampusShareApi.RenderUserAvatar(avatarNode, avatarProfile, displayName);
            return;
        }
        avatarNode.textContent = String(displayName || "用").slice(0, 1).toUpperCase();
    }

    /**
     * 元信息
     */
    function PatchOrderMeta(detailResult, pageRefs) {
        if (pageRefs.metaOrderNo) {
            pageRefs.metaOrderNo.textContent = detailResult.orderNo || `#${detailResult.orderId || "-"}`;
        }
        if (pageRefs.metaCreateTime) {
            pageRefs.metaCreateTime.textContent = FormatTime(detailResult.createTime);
        }
        if (pageRefs.metaUpdateTime) {
            pageRefs.metaUpdateTime.textContent = FormatTime(detailResult.updateTime);
        }
        if (pageRefs.metaSellerConfirmTime) {
            pageRefs.metaSellerConfirmTime.textContent = FormatTime(detailResult.sellerConfirmTime);
        }
        if (pageRefs.metaBuyerConfirmTime) {
            pageRefs.metaBuyerConfirmTime.textContent = FormatTime(detailResult.buyerCompleteTime);
        }
        if (pageRefs.metaCloseReason) {
            pageRefs.metaCloseReason.textContent = detailResult.closeReason || "-";
        }
    }

    /**
     * 操作面板
     */
    function BindActionPanel(detailResult, pageRefs, messageBar) {
        const primaryButton = pageRefs.actionPrimary;
        const secondaryButton = pageRefs.actionSecondary;
        const dangerButton = pageRefs.actionDanger;
        if (!primaryButton || !secondaryButton || !dangerButton) {
            return;
        }

        BindActionButton(secondaryButton, "联系交易对方", function HandleContactClick() {
            ShowSuccess(messageBar, "请通过站内消息联系交易对方");
        });

        const profile = window.CampusShareApi.GetCurrentUserProfile() || {};
        const currentUserId = Number(profile.userId || 0);
        const isBuyer = currentUserId > 0 && currentUserId === Number(detailResult.buyerUserId || 0);
        const isSeller = currentUserId > 0 && currentUserId === Number(detailResult.sellerUserId || 0);

        primaryButton.style.display = "none";
        dangerButton.style.display = "none";

        if (detailResult.orderStatus === "PENDING_SELLER_CONFIRM" && isSeller) {
            BindActionButton(primaryButton, "确认订单", async function HandleConfirmOrder() {
                await window.CampusShareApi.ConfirmOrder(detailResult.orderId);
                ShowSuccess(messageBar, "订单已确认");
                ReloadCurrentPage(detailResult.orderId);
            });
            BindActionButton(dangerButton, "取消订单", async function HandleCancelOrder() {
                await window.CampusShareApi.CancelOrder(detailResult.orderId);
                ShowSuccess(messageBar, "订单已取消");
                ReloadCurrentPage(detailResult.orderId);
            }, true);
            return;
        }

        if (detailResult.orderStatus === "PENDING_OFFLINE_TRADE" && isSeller) {
            BindActionButton(primaryButton, "线下已交付", async function HandleHandoverOrder() {
                await window.CampusShareApi.HandoverOrder(detailResult.orderId);
                ShowSuccess(messageBar, "订单已转入待买家确认");
                ReloadCurrentPage(detailResult.orderId);
            });
            BindActionButton(dangerButton, "关闭订单", async function HandleCloseOrder() {
                await window.CampusShareApi.CloseOrder(detailResult.orderId, "卖家手动关闭");
                ShowSuccess(messageBar, "订单已关闭");
                ReloadCurrentPage(detailResult.orderId);
            }, true);
            return;
        }

        if (detailResult.orderStatus === "PENDING_BUYER_CONFIRM" && isBuyer) {
            BindActionButton(primaryButton, "确认收货", async function HandleCompleteOrder() {
                await window.CampusShareApi.CompleteOrder(detailResult.orderId);
                ShowSuccess(messageBar, "订单已完成");
                ReloadCurrentPage(detailResult.orderId);
            });
            BindActionButton(dangerButton, "取消订单", async function HandleCancelOrder() {
                await window.CampusShareApi.CancelOrder(detailResult.orderId);
                ShowSuccess(messageBar, "订单已取消");
                ReloadCurrentPage(detailResult.orderId);
            }, true);
            return;
        }

        if ((detailResult.orderStatus === "PENDING_SELLER_CONFIRM" || detailResult.orderStatus === "PENDING_OFFLINE_TRADE") && isSeller) {
            BindActionButton(dangerButton, "关闭订单", async function HandleCloseOrder() {
                await window.CampusShareApi.CloseOrder(detailResult.orderId, "卖家手动关闭");
                ShowSuccess(messageBar, "订单已关闭");
                ReloadCurrentPage(detailResult.orderId);
            }, true);
            return;
        }

        BindActionButton(primaryButton, "返回订单中心", function HandleBackToCenter() {
            window.location.href = "/pages/order_center.html";
        });
    }

    /**
     * 绑定按钮
     */
    function BindActionButton(buttonElement, text, onClick, isDanger) {
        if (!buttonElement) {
            return;
        }
        buttonElement.style.display = "flex";
        if (isDanger) {
            buttonElement.classList.add("text-error");
        } else {
            buttonElement.classList.remove("text-error");
        }
        const textNode = buttonElement.querySelector("[data-role$='-text']");
        if (textNode) {
            textNode.textContent = text;
        } else {
            buttonElement.textContent = text;
        }
        const nextButtonElement = buttonElement.cloneNode(true);
        buttonElement.parentNode.replaceChild(nextButtonElement, buttonElement);
        nextButtonElement.addEventListener("click", async function HandleActionClick() {
            nextButtonElement.disabled = true;
            try {
                await onClick();
            } finally {
                nextButtonElement.disabled = false;
            }
        });
    }

    /**
     * 当前时间轴阶段
     */
    function ResolveTimelineState(orderStatus) {
        if (orderStatus === "PENDING_SELLER_CONFIRM") {
            return { progressWidth: 33, stepStateList: ["completed", "active", "pending", "pending"] };
        }
        if (orderStatus === "PENDING_OFFLINE_TRADE") {
            return { progressWidth: 66, stepStateList: ["completed", "completed", "active", "pending"] };
        }
        if (orderStatus === "PENDING_BUYER_CONFIRM") {
            return { progressWidth: 100, stepStateList: ["completed", "completed", "completed", "active"] };
        }
        if (orderStatus === "COMPLETED") {
            return { progressWidth: 100, stepStateList: ["completed", "completed", "completed", "completed"] };
        }
        return { progressWidth: 0, stepStateList: ["completed", "pending", "pending", "pending"] };
    }

    /**
     * 线下交易时间
     */
    function ResolveOfflineTradeTime(detailResult) {
        if (detailResult.orderStatus === "PENDING_BUYER_CONFIRM" || detailResult.orderStatus === "COMPLETED") {
            return FormatTime(detailResult.updateTime);
        }
        return "-";
    }

    /**
     * 已完成样式
     */
    function SetStepCompletedStyle(stepItem) {
        stepItem.circle.className = "w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center";
        stepItem.icon.textContent = "check";
        stepItem.label.classList.remove("text-primary", "text-outline-variant");
        stepItem.label.classList.add("text-on-surface");
        stepItem.time.classList.remove("text-outline-variant");
        stepItem.time.classList.add("text-outline");
    }

    /**
     * 激活样式
     */
    function SetStepActiveStyle(stepItem, stepNumber) {
        stepItem.circle.className = "w-10 h-10 rounded-full bg-surface-container-lowest border-4 border-primary text-primary flex items-center justify-center";
        stepItem.icon.textContent = STEP_ICON_MAP[stepNumber] || "schedule";
        stepItem.label.classList.remove("text-on-surface", "text-outline-variant");
        stepItem.label.classList.add("text-primary");
        stepItem.time.classList.remove("text-outline-variant");
        stepItem.time.classList.add("text-outline");
    }

    /**
     * 待处理样式
     */
    function SetStepPendingStyle(stepItem, stepNumber) {
        stepItem.circle.className = "w-10 h-10 rounded-full bg-surface-container-high text-outline-variant flex items-center justify-center";
        stepItem.icon.textContent = STEP_ICON_MAP[stepNumber] || "schedule";
        stepItem.label.classList.remove("text-primary", "text-on-surface");
        stepItem.label.classList.add("text-outline-variant");
        stepItem.time.classList.add("text-outline-variant");
    }

    /**
     * 商品图URL
     */
    function ResolveProductImageUrl(imageFileIds) {
        if (!Array.isArray(imageFileIds) || imageFileIds.length === 0) {
            return "";
        }
        const firstFileId = imageFileIds.find(function FindFileId(item) {
            return !!item;
        });
        if (!firstFileId) {
            return "";
        }
        if (/^https?:\/\//i.test(firstFileId)) {
            return firstFileId;
        }
        if (firstFileId.startsWith("/")) {
            return firstFileId;
        }
        return `/api/v1/files/${encodeURIComponent(firstFileId)}`;
    }

    /**
     * 刷新页面
     */
    function ReloadCurrentPage(orderId) {
        window.location.href = `/pages/order_detail.html?orderId=${encodeURIComponent(String(orderId))}`;
    }

    /**
     * 订单ID
     */
    function ResolveOrderId() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const orderId = Number(searchParams.get("orderId") || "0");
        if (!orderId || Number.isNaN(orderId)) {
            return 0;
        }
        return orderId;
    }

    /**
     * 用户名展示
     */
    function BuildUserLabel(userId, roleText) {
        if (!userId) {
            return `${roleText}信息缺失`;
        }
        return `${roleText} #${userId}`;
    }

    /**
     * 金额格式化
     */
    function FormatAmount(orderAmount) {
        const numberValue = Number(orderAmount || 0);
        if (Number.isNaN(numberValue)) {
            return "0.00";
        }
        return numberValue.toFixed(2);
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
     * 消息栏
     */
    function BuildMessageBar(mainElement) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4";
        messageBar.style.display = "none";
        mainElement.insertBefore(messageBar, mainElement.firstChild);
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
     * 失败消息
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4 border border-red-200 bg-red-50 text-red-700";
        messageBar.textContent = message;
    }

    /**
     * 清空消息
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindOrderDetailPage);
})();
