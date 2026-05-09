/**
 * 璁㈠崟璇︽儏椤甸潰閫昏緫
 */
(function InitOrderDetailPage() {
    const STEP_ICON_MAP = {
        1: "check",
        2: "check",
        3: "handshake",
        4: "verified"
    };

    const ORDER_STATUS_TEXT_MAP = {
        PENDING_SELLER_CONFIRM: "寰呭崠瀹剁‘璁?,
        PENDING_OFFLINE_TRADE: "寰呯嚎涓嬩氦鏄?,
        PENDING_BUYER_CONFIRM: "寰呬拱瀹剁‘璁?,
        COMPLETED: "宸插畬鎴?,
        CANCELED: "宸插彇娑?,
        CLOSED: "宸插叧闂?
    };

    /**
     * 椤甸潰鍏ュ彛
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
            ShowError(messageBar, "缂哄皯璁㈠崟缂栧彿锛岃浠庤鍗曚腑蹇冭繘鍏?);
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
     * 閲囬泦椤甸潰閿氱偣
     */
    function CollectPageRefs(mainElement) {
        return {
            heading: mainElement.querySelector("[data-role='order-heading']"),
            statusPill: mainElement.querySelector("[data-role='order-status-pill']"),
            terminalBanner: mainElement.querySelector("[data-role='order-terminal-banner']"),
            terminalIcon: mainElement.querySelector("[data-role='order-terminal-icon']"),
            terminalTitle: mainElement.querySelector("[data-role='order-terminal-title']"),
            terminalDescription: mainElement.querySelector("[data-role='order-terminal-description']"),
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
     * 鍔犺浇璁㈠崟
     */
    async function LoadOrderDetail(orderId, pageRefs, messageBar) {
        try {
            const detailResult = await window.CampusShareApi.GetOrderDetail(orderId);
            if (!detailResult || !detailResult.orderId) {
                ShowError(messageBar, "璁㈠崟涓嶅瓨鍦ㄦ垨鏃犳潈闄愯闂?);
                return;
            }
            let productResult = null;
            if (detailResult.productId) {
                try {
                    productResult = await window.CampusShareApi.GetProductDetail(detailResult.productId);
                } catch (error) {
                    productResult = null;
                    ShowError(messageBar, error instanceof Error ? error.message : "鍟嗗搧淇℃伅鍔犺浇澶辫触");
                }
            }

            PatchHeader(detailResult, pageRefs);
            PatchTerminalBanner(detailResult, pageRefs);
            PatchTimeline(detailResult, pageRefs);
            PatchSummary(detailResult, pageRefs);
            PatchProductDetail(detailResult, productResult, pageRefs);
            PatchParticipants(detailResult, productResult, pageRefs);
            PatchOrderMeta(detailResult, pageRefs);
            BindActionPanel(detailResult, pageRefs, messageBar);
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "璁㈠崟鍔犺浇澶辫触");
        }
    }

    /**
     * 澶撮儴鏁版嵁
     */
    function PatchHeader(detailResult, pageRefs) {
        const orderNoText = detailResult.orderNo || detailResult.orderId || "-";
        const statusText = ORDER_STATUS_TEXT_MAP[detailResult.orderStatus] || detailResult.orderStatus || "鏈煡鐘舵€?;
        if (pageRefs.heading) {
            pageRefs.heading.textContent = `璁㈠崟缂栧彿: ${orderNoText}`;
        }
        if (pageRefs.statusPill) {
            pageRefs.statusPill.textContent = statusText;
            PatchStatusPillStyle(pageRefs.statusPill, detailResult.orderStatus);
        }
        if (pageRefs.metaStatusText) {
            pageRefs.metaStatusText.textContent = statusText;
        }
    }

    function PatchStatusPillStyle(statusPill, orderStatus) {
        if (IsTerminalOrderStatus(orderStatus)) {
            statusPill.className = "bg-red-100 text-red-700 ring-1 ring-red-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide";
            return;
        }
        statusPill.className = "bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide";
    }

    function PatchTerminalBanner(detailResult, pageRefs) {
        const orderStatus = detailResult && detailResult.orderStatus ? detailResult.orderStatus : "";
        if (!pageRefs.terminalBanner) {
            return;
        }
        if (!IsTerminalOrderStatus(orderStatus)) {
            pageRefs.terminalBanner.classList.add("hidden");
            return;
        }

        pageRefs.terminalBanner.classList.remove("hidden");
        if (pageRefs.terminalIcon) {
            pageRefs.terminalIcon.textContent = orderStatus === "CANCELED" ? "cancel" : "block";
        }
        if (pageRefs.terminalTitle) {
            pageRefs.terminalTitle.textContent = ORDER_STATUS_TEXT_MAP[orderStatus] || "璁㈠崟宸茬粓姝?;
        }
        if (pageRefs.terminalDescription) {
            const closeReason = detailResult.closeReason ? `鍘熷洜锛?{detailResult.closeReason}` : "璇ヨ鍗曞凡缁堟锛屽悗缁笉浼氱户缁帹杩涖€?;
            const closeTime = detailResult.closeTime || detailResult.updateTime;
            const timeText = closeTime ? `澶勭悊鏃堕棿锛?{FormatTime(closeTime)}` : "";
            pageRefs.terminalDescription.textContent = [closeReason, timeText].filter(Boolean).join(" 路 ");
        }
    }

    /**
     * 鏃堕棿杞?     */
    function PatchTimeline(detailResult, pageRefs) {
        const timelineState = ResolveTimelineState(detailResult);
        if (pageRefs.progressBar) {
            pageRefs.progressBar.style.width = `${timelineState.progressWidth}%`;
            pageRefs.progressBar.className = `h-full ${IsTerminalOrderStatus(detailResult.orderStatus) ? "bg-red-500" : "bg-primary"}`;
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
            if (stepState === "terminal") {
                SetStepTerminalStyle(stepItem);
                return;
            }
            SetStepPendingStyle(stepItem, stepNumber);
        });
    }

    /**
     * 閲戦涓庡湴鐐?     */
    function PatchSummary(detailResult, pageRefs) {
        const amountText = `楼 ${FormatAmount(detailResult.orderAmount)}`;
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
            pageRefs.tradeLocation.textContent = detailResult.tradeLocation || "寰呭崗鍟?;
        }
        if (pageRefs.tradeLocationSub) {
            pageRefs.tradeLocationSub.textContent = detailResult.tradeLocation
                ? "璇锋寜绾﹀畾鏃堕棿鍒拌揪浜ゆ槗鍦扮偣"
                : "璇蜂笌浜ゆ槗瀵规柟娌熼€氬叿浣撳湴鐐?;
        }
    }

    /**
     * 鍟嗗搧淇℃伅
     */
    function PatchProductDetail(detailResult, productResult, pageRefs) {
        if (!productResult) {
            if (pageRefs.productTitle) {
                pageRefs.productTitle.textContent = detailResult.productId
                    ? `鍟嗗搧 #${detailResult.productId}`
                    : "鍟嗗搧淇℃伅涓嶅彲鐢?;
            }
            return;
        }
        if (pageRefs.productTitle) {
            pageRefs.productTitle.textContent = productResult.title || `鍟嗗搧 #${detailResult.productId || "-"}`;
        }
        if (pageRefs.productCondition) {
            pageRefs.productCondition.textContent = productResult.conditionLevel || "-";
        }
        if (pageRefs.productCategory) {
            pageRefs.productCategory.textContent = productResult.category || "-";
        }
        if (pageRefs.productDescription) {
            pageRefs.productDescription.textContent = productResult.description || "鏆傛棤鍟嗗搧鎻忚堪";
        }
        if (pageRefs.productImage) {
            const imageUrl = ResolveProductImageUrl(productResult.imageFileIds);
            if (imageUrl) {
                pageRefs.productImage.src = imageUrl;
            }
        }
    }

    /**
     * 涔板崠鍙屾柟
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
                pageRefs.buyerName.textContent = BuildUserLabel(detailResult.buyerUserId, "涔板");
            }
        }
        if (pageRefs.buyerSubtitle) {
            pageRefs.buyerSubtitle.textContent = `鐢ㄦ埛ID: ${detailResult.buyerUserId || "-"}`;
        }
        if (pageRefs.sellerName) {
            if (sellerNameFromOrder) {
                pageRefs.sellerName.textContent = sellerNameFromOrder;
            } else if (sellerNameFromProduct) {
                pageRefs.sellerName.textContent = sellerNameFromProduct;
            } else if (currentUserId > 0 && currentUserId === Number(detailResult.sellerUserId || 0) && currentUserName) {
                pageRefs.sellerName.textContent = currentUserName;
            } else {
                pageRefs.sellerName.textContent = BuildUserLabel(detailResult.sellerUserId, "鍗栧");
            }
        }
        if (pageRefs.sellerSubtitle) {
            pageRefs.sellerSubtitle.textContent = `鐢ㄦ埛ID: ${detailResult.sellerUserId || "-"}`;
        }
        PatchParticipantAvatar(pageRefs.buyerAvatar, detailResult.buyerUserId, pageRefs.buyerName ? pageRefs.buyerName.textContent : "涔板", profile);
        PatchParticipantAvatar(pageRefs.sellerAvatar, detailResult.sellerUserId, pageRefs.sellerName ? pageRefs.sellerName.textContent : "鍗栧", profile);
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
        avatarNode.textContent = String(displayName || "鐢?).slice(0, 1).toUpperCase();
    }

    /**
     * 鍏冧俊鎭?     */
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
     * 鎿嶄綔闈㈡澘
     */
    function BindActionPanel(detailResult, pageRefs, messageBar) {
        const primaryButton = pageRefs.actionPrimary;
        const secondaryButton = pageRefs.actionSecondary;
        const dangerButton = pageRefs.actionDanger;
        if (!primaryButton || !secondaryButton || !dangerButton) {
            return;
        }

        BindActionButton(secondaryButton, "鑱旂郴浜ゆ槗瀵规柟", function HandleContactClick() {
            ShowSuccess(messageBar, "璇烽€氳繃绔欏唴娑堟伅鑱旂郴浜ゆ槗瀵规柟");
        });

        const profile = window.CampusShareApi.GetCurrentUserProfile() || {};
        const currentUserId = Number(profile.userId || 0);
        const isBuyer = currentUserId > 0 && currentUserId === Number(detailResult.buyerUserId || 0);
        const isSeller = currentUserId > 0 && currentUserId === Number(detailResult.sellerUserId || 0);

        primaryButton.style.display = "none";
        dangerButton.style.display = "none";

        if (detailResult.orderStatus === "PENDING_SELLER_CONFIRM" && isSeller) {
            BindActionButton(primaryButton, "纭璁㈠崟", async function HandleConfirmOrder() {
                await window.CampusShareApi.ConfirmOrder(detailResult.orderId);
                ShowSuccess(messageBar, "璁㈠崟宸茬‘璁?);
                ReloadCurrentPage(detailResult.orderId);
            });
            BindActionButton(dangerButton, "鍙栨秷璁㈠崟", async function HandleCancelOrder() {
                await window.CampusShareApi.CancelOrder(detailResult.orderId);
                ShowSuccess(messageBar, "璁㈠崟宸插彇娑?);
                ReloadCurrentPage(detailResult.orderId);
            }, true);
            return;
        }

        if (detailResult.orderStatus === "PENDING_OFFLINE_TRADE" && isSeller) {
            BindActionButton(primaryButton, "绾夸笅宸蹭氦浠?, async function HandleHandoverOrder() {
                await window.CampusShareApi.HandoverOrder(detailResult.orderId);
                ShowSuccess(messageBar, "璁㈠崟宸茶浆鍏ュ緟涔板纭");
                ReloadCurrentPage(detailResult.orderId);
            });
            BindActionButton(dangerButton, "鍏抽棴璁㈠崟", async function HandleCloseOrder() {
                await window.CampusShareApi.CloseOrder(detailResult.orderId, "鍗栧鎵嬪姩鍏抽棴");
                ShowSuccess(messageBar, "璁㈠崟宸插叧闂?);
                ReloadCurrentPage(detailResult.orderId);
            }, true);
            return;
        }

        if (detailResult.orderStatus === "PENDING_BUYER_CONFIRM" && isBuyer) {
            BindActionButton(primaryButton, "纭鏀惰揣", async function HandleCompleteOrder() {
                await window.CampusShareApi.CompleteOrder(detailResult.orderId);
                ShowSuccess(messageBar, "璁㈠崟宸插畬鎴?);
                ReloadCurrentPage(detailResult.orderId);
            });
            BindActionButton(dangerButton, "鍙栨秷璁㈠崟", async function HandleCancelOrder() {
                await window.CampusShareApi.CancelOrder(detailResult.orderId);
                ShowSuccess(messageBar, "璁㈠崟宸插彇娑?);
                ReloadCurrentPage(detailResult.orderId);
            }, true);
            return;
        }

        if ((detailResult.orderStatus === "PENDING_SELLER_CONFIRM" || detailResult.orderStatus === "PENDING_OFFLINE_TRADE") && isSeller) {
            BindActionButton(dangerButton, "鍏抽棴璁㈠崟", async function HandleCloseOrder() {
                await window.CampusShareApi.CloseOrder(detailResult.orderId, "鍗栧鎵嬪姩鍏抽棴");
                ShowSuccess(messageBar, "璁㈠崟宸插叧闂?);
                ReloadCurrentPage(detailResult.orderId);
            }, true);
            return;
        }

        BindActionButton(primaryButton, "杩斿洖璁㈠崟涓績", function HandleBackToCenter() {
            window.location.href = "/pages/order_center.html";
        });
    }

    /**
     * 缁戝畾鎸夐挳
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
     * 褰撳墠鏃堕棿杞撮樁娈?     */
    function ResolveTimelineState(detailResult) {
        const orderStatus = detailResult && detailResult.orderStatus ? detailResult.orderStatus : "";
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
        if (orderStatus === "CLOSED" || orderStatus === "CANCELED") {
            return ResolveTerminalTimelineState(detailResult);
        }
        return { progressWidth: 0, stepStateList: ["completed", "pending", "pending", "pending"] };
    }

    function ResolveTerminalTimelineState(detailResult) {
        if (detailResult && detailResult.buyerCompleteTime) {
            return { progressWidth: 100, stepStateList: ["completed", "completed", "completed", "completed"] };
        }
        if (detailResult && detailResult.sellerConfirmTime) {
            return { progressWidth: 66, stepStateList: ["completed", "completed", "terminal", "pending"] };
        }
        return { progressWidth: 33, stepStateList: ["completed", "terminal", "pending", "pending"] };
    }

    function IsTerminalOrderStatus(orderStatus) {
        return orderStatus === "CLOSED" || orderStatus === "CANCELED";
    }

    /**
     * 绾夸笅浜ゆ槗鏃堕棿
     */
    function ResolveOfflineTradeTime(detailResult) {
        if (detailResult.orderStatus === "PENDING_BUYER_CONFIRM" || detailResult.orderStatus === "COMPLETED") {
            return FormatTime(detailResult.updateTime);
        }
        return "-";
    }

    /**
     * 宸插畬鎴愭牱寮?     */
    function SetStepCompletedStyle(stepItem) {
        stepItem.circle.className = "w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center";
        stepItem.icon.textContent = "check";
        stepItem.label.classList.remove("text-primary", "text-outline-variant");
        stepItem.label.classList.add("text-on-surface");
        stepItem.time.classList.remove("text-outline-variant");
        stepItem.time.classList.add("text-outline");
    }

    /**
     * 婵€娲绘牱寮?     */
    function SetStepActiveStyle(stepItem, stepNumber) {
        stepItem.circle.className = "w-10 h-10 rounded-full bg-surface-container-lowest border-4 border-primary text-primary flex items-center justify-center";
        stepItem.icon.textContent = STEP_ICON_MAP[stepNumber] || "schedule";
        stepItem.label.classList.remove("text-on-surface", "text-outline-variant");
        stepItem.label.classList.add("text-primary");
        stepItem.time.classList.remove("text-outline-variant");
        stepItem.time.classList.add("text-outline");
    }

    function SetStepTerminalStyle(stepItem) {
        stepItem.circle.className = "w-10 h-10 rounded-full bg-red-50 border-4 border-red-500 text-red-600 flex items-center justify-center";
        stepItem.icon.textContent = "block";
        stepItem.label.classList.remove("text-on-surface", "text-primary", "text-outline-variant");
        stepItem.label.classList.add("text-red-600");
        stepItem.time.classList.remove("text-outline-variant");
        stepItem.time.classList.add("text-outline");
    }

    /**
     * 寰呭鐞嗘牱寮?     */
    function SetStepPendingStyle(stepItem, stepNumber) {
        stepItem.circle.className = "w-10 h-10 rounded-full bg-surface-container-high text-outline-variant flex items-center justify-center";
        stepItem.icon.textContent = STEP_ICON_MAP[stepNumber] || "schedule";
        stepItem.label.classList.remove("text-primary", "text-on-surface");
        stepItem.label.classList.add("text-outline-variant");
        stepItem.time.classList.add("text-outline-variant");
    }

    /**
     * 鍟嗗搧鍥綰RL
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
     * 鍒锋柊椤甸潰
     */
    function ReloadCurrentPage(orderId) {
        window.location.href = `/pages/order_detail.html?orderId=${encodeURIComponent(String(orderId))}`;
    }

    /**
     * 璁㈠崟ID
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
     * 鐢ㄦ埛鍚嶅睍绀?     */
    function BuildUserLabel(userId, roleText) {
        if (!userId) {
            return `${roleText}淇℃伅缂哄け`;
        }
        return `${roleText} #${userId}`;
    }

    /**
     * 閲戦鏍煎紡鍖?     */
    function FormatAmount(orderAmount) {
        const numberValue = Number(orderAmount || 0);
        if (Number.isNaN(numberValue)) {
            return "0.00";
        }
        return numberValue.toFixed(2);
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
     * 娑堟伅鏍?     */
    function BuildMessageBar(mainElement) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4";
        messageBar.style.display = "none";
        mainElement.insertBefore(messageBar, mainElement.firstChild);
        return messageBar;
    }

    /**
     * 鎴愬姛娑堟伅
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4 border border-green-200 bg-green-50 text-green-700";
        messageBar.textContent = message;
    }

    /**
     * 澶辫触娑堟伅
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4 border border-red-200 bg-red-50 text-red-700";
        messageBar.textContent = message;
    }

    /**
     * 娓呯┖娑堟伅
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindOrderDetailPage);
})();

