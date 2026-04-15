/**
 * 商品详情页面逻辑
 */
(function InitMarketDetailPage() {
    /**
     * 绑定页面行为
     */
    function BindMarketDetailPage() {
        if (!window.CampusShareApi) {
            return;
        }
        const productId = ResolveProductIdFromUrl();
        if (!productId) {
            return;
        }

        const productTitleNode = document.querySelector("main h1.text-3xl");
        const categoryNode = document.querySelector("main span.text-xs.uppercase");
        const conditionNode = document.querySelector("main span.bg-secondary-container, main span.bg-surface-container-high");
        const locationNode = document.querySelector("main div.flex.items-center.gap-1.text-on-surface-variant.text-sm span:last-child");
        const priceNode = document.querySelector("main span.text-4xl");
        const sellerNameNode = document.querySelector("main section span.font-bold.text-on-surface");
        const descriptionNode = document.querySelector("article p.text-on-surface-variant.leading-relaxed.text-body-lg");
        const breadCrumbNode = document.querySelector("nav span.text-on-surface.font-medium");
        const buyButton = FindButtonByText("下单");
        const favoriteButton = FindFavoriteButton();
        const favoriteIcon = favoriteButton ? favoriteButton.querySelector(".material-symbols-outlined") : null;
        const messageBar = BuildMessageBar();

        LoadProductDetail(
            productId,
            productTitleNode,
            categoryNode,
            conditionNode,
            locationNode,
            priceNode,
            sellerNameNode,
            descriptionNode,
            breadCrumbNode,
            messageBar
        );
        LoadFavoriteState(productId, favoriteButton, favoriteIcon);

        if (buyButton) {
            buyButton.addEventListener("click", async function HandleCreateOrder() {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "请先登录后再下单");
                    window.setTimeout(function RedirectToAuthPage() {
                        const currentPath = window.location.pathname + window.location.search;
                        if (window.CampusShareApi.RedirectToAuthPage) {
                            window.CampusShareApi.RedirectToAuthPage(currentPath);
                            return;
                        }
                        window.location.href = "/pages/auth_access.html";
                    }, 700);
                    return;
                }
                buyButton.disabled = true;
                try {
                    const detailResult = await window.CampusShareApi.GetProductDetail(productId);
                    const createOrderResult = await window.CampusShareApi.CreateOrder({
                        productId: productId,
                        tradeLocation: detailResult.tradeLocation || "校园约定地点"
                    });
                    ShowSuccess(messageBar, `下单成功，订单号：${createOrderResult.orderNo}`);
                    window.setTimeout(function RedirectToOrderCenter() {
                        window.location.href = "/pages/order_center.html";
                    }, 1000);
                } catch (error) {
                    ShowError(messageBar, error instanceof Error ? error.message : "下单失败");
                } finally {
                    buyButton.disabled = false;
                }
            });
        }
        if (favoriteButton) {
            favoriteButton.addEventListener("click", async function HandleToggleFavorite() {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "请先登录后再收藏");
                    window.setTimeout(function RedirectToAuthPage() {
                        const currentPath = window.location.pathname + window.location.search;
                        if (window.CampusShareApi.RedirectToAuthPage) {
                            window.CampusShareApi.RedirectToAuthPage(currentPath);
                            return;
                        }
                        window.location.href = "/pages/auth_access.html";
                    }, 700);
                    return;
                }
                favoriteButton.disabled = true;
                try {
                    const favoriteResult = await window.CampusShareApi.ToggleProductFavorite(productId);
                    ApplyFavoriteUi(favoriteResult, favoriteButton, favoriteIcon);
                    if (favoriteResult.favorited) {
                        ShowSuccess(messageBar, "已加入收藏");
                    } else {
                        ShowSuccess(messageBar, "已取消收藏");
                    }
                } catch (error) {
                    ShowError(messageBar, error instanceof Error ? error.message : "收藏操作失败");
                } finally {
                    favoriteButton.disabled = false;
                }
            });
        }
    }

    /**
     * 加载商品详情
     */
    async function LoadProductDetail(
        productId,
        productTitleNode,
        categoryNode,
        conditionNode,
        locationNode,
        priceNode,
        sellerNameNode,
        descriptionNode,
        breadCrumbNode,
        messageBar
    ) {
        try {
            const detailResult = await window.CampusShareApi.GetProductDetail(productId);
            if (productTitleNode) {
                productTitleNode.textContent = detailResult.title || `商品 #${productId}`;
            }
            if (categoryNode) {
                categoryNode.textContent = detailResult.category || "校园商品";
            }
            if (conditionNode) {
                conditionNode.textContent = detailResult.conditionLevel || "状态未知";
            }
            if (locationNode) {
                locationNode.textContent = detailResult.tradeLocation || "-";
            }
            if (priceNode) {
                priceNode.textContent = `￥${FormatAmount(detailResult.price)}`;
            }
            if (sellerNameNode) {
                sellerNameNode.textContent = detailResult.sellerDisplayName || "匿名用户";
            }
            if (descriptionNode) {
                descriptionNode.textContent = detailResult.description || "暂无描述";
            }
            if (breadCrumbNode) {
                breadCrumbNode.textContent = detailResult.title || `商品 #${productId}`;
            }
            document.title = `CampusShare | ${detailResult.title || `商品 #${productId}`}`;
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "商品详情加载失败");
        }
    }

    /**
     * 加载收藏状态
     */
    async function LoadFavoriteState(productId, favoriteButton, favoriteIcon) {
        if (!favoriteButton || !window.CampusShareApi.GetAuthToken()) {
            ApplyFavoriteUi(null, favoriteButton, favoriteIcon);
            return;
        }
        try {
            const favoriteState = await window.CampusShareApi.GetProductFavoriteState(productId);
            ApplyFavoriteUi(favoriteState, favoriteButton, favoriteIcon);
        } catch (error) {
            ApplyFavoriteUi(null, favoriteButton, favoriteIcon);
        }
    }

    /**
     * 应用收藏样式
     */
    function ApplyFavoriteUi(favoriteState, favoriteButton, favoriteIcon) {
        if (!favoriteButton || !favoriteIcon) {
            return;
        }
        const favorited = favoriteState ? !!favoriteState.favorited : false;
        if (favorited) {
            favoriteButton.classList.add("text-primary");
            favoriteIcon.style.fontVariationSettings = "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24";
            favoriteButton.setAttribute("title", "已收藏");
            return;
        }
        favoriteButton.classList.remove("text-primary");
        favoriteIcon.style.fontVariationSettings = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
        favoriteButton.setAttribute("title", "收藏");
    }

    /**
     * 从URL读取商品ID
     */
    function ResolveProductIdFromUrl() {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const productIdText = urlSearchParams.get("productId");
        const productId = Number(productIdText || 0);
        if (Number.isNaN(productId) || productId <= 0) {
            return null;
        }
        return productId;
    }

    /**
     * 创建消息条
     */
    function BuildMessageBar() {
        const mainElement = document.querySelector("main");
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm border mb-4";
        messageBar.style.display = "none";
        if (mainElement) {
            mainElement.insertBefore(messageBar, mainElement.firstChild);
        }
        return messageBar;
    }

    /**
     * 按文本找按钮
     */
    function FindButtonByText(buttonText) {
        const buttonList = Array.from(document.querySelectorAll("button"));
        return buttonList.find(function MatchButton(buttonElement) {
            return buttonElement.textContent && buttonElement.textContent.includes(buttonText);
        }) || null;
    }

    /**
     * 查询收藏按钮
     */
    function FindFavoriteButton() {
        const iconList = Array.from(document.querySelectorAll("button .material-symbols-outlined"));
        const favoriteIcon = iconList.find(function MatchFavoriteIcon(iconElement) {
            return (iconElement.textContent || "").trim() === "favorite";
        });
        return favoriteIcon ? favoriteIcon.closest("button") : null;
    }

    /**
     * 格式化金额
     */
    function FormatAmount(price) {
        const numberValue = Number(price || 0);
        if (Number.isNaN(numberValue)) {
            return "0.00";
        }
        return numberValue.toFixed(2);
    }

    /**
     * 显示成功
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm border border-green-200 bg-green-50 text-green-700 mb-4";
        messageBar.textContent = message;
    }

    /**
     * 显示错误
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm border border-red-200 bg-red-50 text-red-700 mb-4";
        messageBar.textContent = message;
    }

    /**
     * 隐藏消息
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindMarketDetailPage);
})();
