/**
 * 订单详情页面逻辑
 */
(function InitOrderDetailPage() {
    const ORDER_STATUS_TEXT_MAP = {
        PENDING_SELLER_CONFIRM: "待卖家确认",
        PENDING_OFFLINE_TRADE: "待线下交易",
        PENDING_BUYER_CONFIRM: "待买家确认",
        COMPLETED: "已完成",
        CANCELED: "已取消",
        CLOSED: "已关闭"
    };

    /**
     * 绑定页面
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
        const actionPanel = mainElement.querySelector("div.bg-surface-container-lowest.rounded-xl.p-8.shadow-sm");
        const headingNode = mainElement.querySelector("h1.text-3xl");
        const statusNode = mainElement.querySelector("div.bg-secondary-container");
        const messageBar = BuildMessageBar(mainElement);

        if (!orderId) {
            ShowError(messageBar, "缺少订单编号，请从订单中心进入");
            return;
        }

        if (!window.CampusShareApi.GetAuthToken()) {
            window.CampusShareApi.RedirectToAuthPage(`/pages/order_detail.html?orderId=${encodeURIComponent(String(orderId))}`);
            return;
        }

        LoadOrderDetail(orderId, actionPanel, headingNode, statusNode, messageBar);
    }

    /**
     * 加载订单详情
     */
    async function LoadOrderDetail(orderId, actionPanel, headingNode, statusNode, messageBar) {
        try {
            const detailResult = await window.CampusShareApi.GetOrderDetail(orderId);
            if (!detailResult || !detailResult.orderId) {
                ShowError(messageBar, "订单不存在或无权限访问");
                return;
            }

            PatchHeader(detailResult, headingNode, statusNode);
            PatchSummary(detailResult);
            PatchProductDetail(detailResult, messageBar);
            PatchOrderMeta(detailResult);
            BindActionPanel(detailResult, actionPanel, messageBar);
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "订单加载失败");
        }
    }

    /**
     * 更新头部
     */
    function PatchHeader(detailResult, headingNode, statusNode) {
        if (headingNode) {
            headingNode.textContent = `订单编号: ${detailResult.orderNo || detailResult.orderId}`;
        }
        if (statusNode) {
            const statusText = ORDER_STATUS_TEXT_MAP[detailResult.orderStatus] || detailResult.orderStatus || "未知状态";
            statusNode.textContent = statusText;
        }
    }

    /**
     * 更新金额摘要
     */
    function PatchSummary(detailResult) {
        const amountText = `¥ ${FormatAmount(detailResult.orderAmount)}`;
        const amountNodeList = Array.from(document.querySelectorAll("span.text-2xl.font-bold, span.text-primary.font-bold.text-lg, span.text-on-surface-variant"));
        amountNodeList.forEach(function PatchAmount(node) {
            if (!node || !node.textContent) {
                return;
            }
            if (node.textContent.includes("楼") || node.textContent.includes("¥") || node.textContent.includes("$") || node.textContent.includes("3,200")) {
                node.textContent = amountText;
            }
        });

        const locationNodeList = Array.from(document.querySelectorAll("span, p"));
        locationNodeList.forEach(function PatchLocation(node) {
            if (!node || !node.textContent) {
                return;
            }
            if (node.textContent.includes("交易地点") || node.textContent.includes("理科楼")) {
                if (node.tagName.toLowerCase() === "span" && node.textContent.length < 40) {
                    node.textContent = detailResult.tradeLocation || "待协商";
                }
            }
        });
    }

    /**
     * 更新商品信息
     */
    async function PatchProductDetail(detailResult, messageBar) {
        const productTitleNode = document.querySelector("section.bg-surface-container-lowest h3.text-xl");
        const productPriceNode = document.querySelector("section.bg-surface-container-lowest span.text-2xl");

        if (productPriceNode) {
            productPriceNode.textContent = `¥ ${FormatAmount(detailResult.orderAmount)}`;
        }

        if (!detailResult.productId) {
            if (productTitleNode) {
                productTitleNode.textContent = "商品信息不可用";
            }
            return;
        }

        try {
            const productResult = await window.CampusShareApi.GetProductDetail(detailResult.productId);
            if (productTitleNode) {
                productTitleNode.textContent = productResult.title || `商品 #${detailResult.productId}`;
            }
            const subInfoNodeList = Array.from(document.querySelectorAll("section.bg-surface-container-lowest div.flex.items-center.text-sm.text-on-surface-variant span"));
            if (subInfoNodeList.length >= 4) {
                subInfoNodeList[1].textContent = productResult.conditionLevel || "-";
                subInfoNodeList[3].textContent = productResult.category || "-";
            }
        } catch (error) {
            if (productTitleNode) {
                productTitleNode.textContent = `商品 #${detailResult.productId}`;
            }
            ShowError(messageBar, error instanceof Error ? error.message : "商品信息加载失败");
        }
    }

    /**
     * 更新订单元信息
     */
    function PatchOrderMeta(detailResult) {
        const metaValueList = Array.from(document.querySelectorAll("div.bg-surface-container-high\/50 div.text-xs.font-semibold.text-on-surface"));
        if (metaValueList.length >= 1) {
            metaValueList[0].textContent = FormatTime(detailResult.createTime);
        }

        const roleNameNodeList = Array.from(document.querySelectorAll("div.grid.grid-cols-2 div.font-bold.text-on-surface"));
        if (roleNameNodeList.length >= 2) {
            roleNameNodeList[0].textContent = BuildUserLabel(detailResult.buyerUserId, "买家");
            roleNameNodeList[1].textContent = BuildUserLabel(detailResult.sellerUserId, "卖家");
        }
    }

    /**
     * 绑定操作面板
     */
    function BindActionPanel(detailResult, actionPanel, messageBar) {
        if (!actionPanel) {
            return;
        }

        const buttonList = Array.from(actionPanel.querySelectorAll("button"));
        if (buttonList.length < 3) {
            return;
        }

        const primaryButton = buttonList[0];
        const secondaryButton = buttonList[1];
        const dangerButton = buttonList[2];
        secondaryButton.addEventListener("click", function HandleContactClick() {
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
            BindActionButton(primaryButton, "确认完成", async function HandleCompleteOrder() {
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
     * 绑定按钮行为
     */
    function BindActionButton(buttonElement, text, onClick, isDanger) {
        if (!buttonElement) {
            return;
        }
        buttonElement.style.display = "flex";
        buttonElement.textContent = text;
        if (isDanger) {
            buttonElement.classList.remove("text-error");
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
     * 重新加载页面
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
     * 用户展示名
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
     * 构建消息栏
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

    document.addEventListener("DOMContentLoaded", BindOrderDetailPage);
})();
