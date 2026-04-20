/**
 * 商品详情页脚本
 */
(function InitMarketDetailPage() {
    const COMMENT_PAGE_NO = 1;
    const COMMENT_PAGE_SIZE = 20;
    const STATUS_PENDING = "PENDING_REVIEW";
    const STATUS_REJECTED = "REJECTED";
    const STATUS_OFFLINE = "OFFLINE";
    const STATUS_FORCE_OFFLINE = "FORCE_OFFLINE";
    const STATUS_CLOSED = "CLOSED";
    const STATUS_LOCKED = "LOCKED";
    const STATUS_PUBLISHED = "PUBLISHED";

    const REVIEW_RESTRICT_STATUS = new Set([
        STATUS_PENDING,
        STATUS_REJECTED,
        STATUS_OFFLINE,
        STATUS_FORCE_OFFLINE,
        STATUS_CLOSED,
        STATUS_LOCKED
    ]);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", BindMarketDetailPage);
    } else {
        BindMarketDetailPage();
    }

    /**
     * 绑定详情页主逻辑
     */
    function BindMarketDetailPage() {
        if (!window.CampusShareApi) {
            return;
        }

        const productId = ResolveProductIdFromUrl();
        if (!productId) {
            RenderUnavailableState("商品参数缺失，请返回列表重新进入。");
            return;
        }

        const view = BuildViewNodes();
        const messageBar = BuildMessageBar();
        view.mainElement.insertBefore(messageBar, view.mainElement.firstChild);

        InitializeDetailTabs();
        InitializeStaticText(view);

        const reportModal = BuildReportModal();
        document.body.appendChild(reportModal.wrapper);
        BindReportModalActions(reportModal, productId, messageBar);

        const state = {
            productId: productId,
            currentDetail: null,
            currentContext: null
        };

        BindActionButtons(state, view, messageBar, reportModal);

        LoadAndRenderDetail(state, view, messageBar).catch(function HandleError(error) {
            const message = ResolveErrorMessage(error, "商品不存在或暂不可见");
            ApplyUnavailableMode(view);
            RenderUnavailableState(message);
        });
    }

    /**
     * 读取页面节点
     */
    function BuildViewNodes() {
        const reviewSection = document.querySelector("[data-tab-panel='review']");
        return {
            mainElement: document.querySelector("main"),
            titleNode: document.querySelector("main h1.text-3xl"),
            categoryNode: document.querySelector("main span.text-xs.uppercase"),
            conditionNode: document.querySelector("main span.bg-secondary-container, main span.bg-surface-container-high"),
            locationNode: document.querySelector("main div.flex.items-center.gap-1.text-on-surface-variant.text-sm span:last-child"),
            priceNode: document.querySelector("main span.text-4xl"),
            breadcrumbNode: document.querySelector("nav span.text-on-surface.font-medium"),
            descriptionNode: document.querySelector("[data-role='product-description']"),
            sellerNameNode: document.querySelector("[data-section='seller-credit'] span.font-bold.text-on-surface"),
            sellerMetaNode: document.querySelector("[data-section='seller-credit'] span.text-xs.text-outline"),
            sellerSection: document.querySelector("[data-section='seller-credit']"),
            sellerScoreNodeList: Array.from(
                document.querySelectorAll("[data-section='seller-credit'] div.grid.grid-cols-3 span.text-xl.font-bold.text-primary")
            ),
            reviewSection: reviewSection,
            reviewListNode: reviewSection ? reviewSection.querySelector("div.flex.flex-col.gap-6") : null,
            reviewTabNode: document.querySelector("[data-tab-target='review']"),
            reviewButtonNode: reviewSection ? FindButtonByTextInScope(reviewSection, "撰写评价") : null,
            buyButton: FindButtonByText("下单"),
            contactButton: FindButtonByText("联系卖家"),
            favoriteButton: FindFavoriteButton(),
            favoriteIcon: FindFavoriteIcon(),
            shareButton: document.querySelector("button[data-action='share-product']"),
            reportButton: document.querySelector("button[data-action='report-product']")
        };
    }

    /**
     * 页面静态中文兜底
     */
    function InitializeStaticText(view) {
        const tabDescription = document.querySelector("[data-tab-target='description']");
        const tabReview = document.querySelector("[data-tab-target='review']");
        const tabPolicy = document.querySelector("[data-tab-target='policy']");
        const reviewTitle = view.reviewSection ? view.reviewSection.querySelector("h2") : null;
        if (tabDescription) {
            tabDescription.textContent = "描述";
        }
        if (tabReview && !tabReview.textContent.includes("评价")) {
            tabReview.textContent = "评价 (0)";
        }
        if (tabPolicy) {
            tabPolicy.textContent = "政策";
        }
        if (reviewTitle) {
            reviewTitle.textContent = "社区反馈";
        }
        if (view.reviewButtonNode) {
            view.reviewButtonNode.textContent = "撰写评价";
        }
    }

    /**
     * 加载并渲染详情
     */
    async function LoadAndRenderDetail(state, view, messageBar) {
        const detailResult = await LoadProductDetailWithFallback(state.productId);
        state.currentDetail = detailResult;

        ApplyProductDetailView(detailResult, view);
        const statusContext = ResolveStatusContext(detailResult);
        state.currentContext = statusContext;

        ApplyStatusContext(statusContext, view, messageBar);
        await LoadFavoriteState(state.productId, view.favoriteButton, view.favoriteIcon);

        if (statusContext.canLoadCommentData) {
            await LoadProductComments(state.productId, view, detailResult, messageBar);
        } else {
            RenderCommentList(view.reviewListNode, []);
            UpdateReviewTabText(view.reviewTabNode, 0);
            RenderSellerCreditByDetail(view, detailResult);
        }
    }

    /**
     * 优先读取公开详情，失败后回退到“我的发布”
     */
    async function LoadProductDetailWithFallback(productId) {
        try {
            return await window.CampusShareApi.GetProductDetail(productId);
        } catch (error) {
            const fallbackDetail = await TryLoadMyProductFallback(productId);
            if (fallbackDetail) {
                return fallbackDetail;
            }
            throw error;
        }
    }

    /**
     * 从我的发布中回退读取详情
     */
    async function TryLoadMyProductFallback(productId) {
        if (!window.CampusShareApi.GetAuthToken()) {
            return null;
        }
        const statusList = [STATUS_PENDING, STATUS_REJECTED, STATUS_OFFLINE, STATUS_FORCE_OFFLINE, STATUS_LOCKED, STATUS_CLOSED];
        for (const status of statusList) {
            try {
                const listResult = await window.CampusShareApi.ListMyProducts({
                    pageNo: 1,
                    pageSize: 100,
                    productStatus: status
                });
                const productList = Array.isArray(listResult && listResult.productList) ? listResult.productList : [];
                const matched = productList.find(function FindById(item) {
                    return Number(item && item.productId) === Number(productId);
                });
                if (matched) {
                    return {
                        productId: matched.productId,
                        title: matched.title,
                        category: matched.category,
                        conditionLevel: matched.conditionLevel,
                        tradeLocation: matched.tradeLocation,
                        price: matched.price,
                        sellerUserId: matched.sellerUserId,
                        sellerDisplayName: matched.sellerDisplayName,
                        imageFileIds: Array.isArray(matched.imageFileIds) ? matched.imageFileIds : [],
                        productStatus: matched.productStatus || status,
                        onShelf: !!matched.onShelf,
                        description: matched.description || "商品正在审核或已下线，仅发布者和管理员可查看。"
                    };
                }
            } catch (ignoreError) {
                // 忽略单个状态查询失败
            }
        }
        return null;
    }

    /**
     * 渲染详情字段
     */
    function ApplyProductDetailView(detailResult, view) {
        const safeTitle = detailResult && detailResult.title ? detailResult.title : `商品 #${detailResult.productId || ""}`;
        const safeCategory = detailResult && detailResult.category ? detailResult.category : "校园商品";
        const safeCondition = detailResult && detailResult.conditionLevel ? detailResult.conditionLevel : "状态未知";
        const safeLocation = detailResult && detailResult.tradeLocation ? detailResult.tradeLocation : "-";
        const safeSellerName = detailResult && detailResult.sellerDisplayName ? detailResult.sellerDisplayName : "未知用户";
        const safeDescription = detailResult && detailResult.description ? detailResult.description : "暂无商品描述";

        if (view.titleNode) {
            view.titleNode.textContent = safeTitle;
        }
        if (view.categoryNode) {
            view.categoryNode.textContent = safeCategory;
        }
        if (view.conditionNode) {
            view.conditionNode.textContent = safeCondition;
        }
        if (view.locationNode) {
            view.locationNode.textContent = safeLocation;
        }
        if (view.priceNode) {
            view.priceNode.textContent = `¥${FormatAmount(detailResult && detailResult.price)}`;
        }
        if (view.breadcrumbNode) {
            view.breadcrumbNode.textContent = safeTitle;
        }
        if (view.descriptionNode) {
            view.descriptionNode.textContent = safeDescription;
        }
        if (view.sellerNameNode) {
            view.sellerNameNode.textContent = safeSellerName;
        }
        if (view.sellerMetaNode) {
            view.sellerMetaNode.textContent = "暂无信誉数据";
        }
        document.title = `CampusShare | ${safeTitle}`;
        RenderProductGallery(detailResult && detailResult.imageFileIds);
    }

    /**
     * 解析状态上下文
     */
    function ResolveStatusContext(detailResult) {
        const status = NormalizeStatus(detailResult && detailResult.productStatus);
        const onShelf = !!(detailResult && detailResult.onShelf);
        const isPublishedAndOnShelf = status === STATUS_PUBLISHED && onShelf;
        const isForceOrOffline = status === STATUS_OFFLINE || status === STATUS_FORCE_OFFLINE;
        return {
            status: status,
            canTrade: isPublishedAndOnShelf,
            canLoadCommentData: isPublishedAndOnShelf,
            showSellerCredit: !isForceOrOffline,
            notice: ResolveStatusNotice(status, onShelf),
            disableMainActions: !isPublishedAndOnShelf
        };
    }

    /**
     * 应用状态上下文到界面
     */
    function ApplyStatusContext(statusContext, view, messageBar) {
        if (statusContext.disableMainActions) {
            SetButtonDisabled(view.buyButton, true, "当前状态不可下单");
            SetButtonDisabled(view.contactButton, true, "当前状态不可联系");
            SetButtonDisabled(view.shareButton, true, "当前状态不可分享");
            SetButtonDisabled(view.reportButton, true, "当前状态不可举报");
        } else {
            SetButtonDisabled(view.buyButton, false);
            SetButtonDisabled(view.contactButton, false);
            SetButtonDisabled(view.shareButton, false);
            SetButtonDisabled(view.reportButton, false);
        }

        if (statusContext.notice) {
            ShowInfo(messageBar, statusContext.notice);
        } else {
            HideMessage(messageBar);
        }

        if (statusContext.showSellerCredit) {
            SetSellerCreditVisibility(view, true, "");
        } else {
            SetSellerCreditVisibility(view, false, "该商品已下线，信誉信息暂不展示");
        }
        RenderReviewAccessHint(view.reviewSection, statusContext);
    }

    /**
     * 状态提示文案
     */
    function ResolveStatusNotice(status, onShelf) {
        if (status === STATUS_PENDING) {
            return "该商品正在审核中，仅发布者或管理员可查看。";
        }
        if (status === STATUS_REJECTED) {
            return "该商品审核未通过，仅发布者或管理员可查看。";
        }
        if (status === STATUS_FORCE_OFFLINE) {
            return "该商品已强制下线，仅发布者或管理员可查看。";
        }
        if (status === STATUS_OFFLINE) {
            return "该商品已下架，当前不可交易。";
        }
        if (status === STATUS_CLOSED) {
            return "该商品已关闭，当前不可交易。";
        }
        if (status === STATUS_LOCKED) {
            return "该商品订单处理中，暂不可重复下单。";
        }
        if (status === STATUS_PUBLISHED && !onShelf) {
            return "该商品当前不可交易。";
        }
        return "";
    }

    /**
     * 渲染图集
     */
    function RenderProductGallery(imageFileIds) {
        const mainImageNode = document.querySelector("[data-role='gallery-main-image']");
        const thumbContainer = document.querySelector("[data-role='gallery-thumbs']");
        if (!mainImageNode || !thumbContainer) {
            return;
        }
        const urlList = BuildImageUrlList(imageFileIds);
        if (!urlList.length) {
            thumbContainer.classList.add("hidden");
            return;
        }

        mainImageNode.src = urlList[0];
        mainImageNode.setAttribute("data-gallery-index", "0");
        if (urlList.length <= 1) {
            thumbContainer.classList.add("hidden");
            thumbContainer.innerHTML = "";
            return;
        }

        thumbContainer.classList.remove("hidden");
        thumbContainer.innerHTML = urlList.slice(0, 4).map(function BuildThumbHtml(url, index) {
            return [
                `<button type="button" data-role="gallery-thumb" data-thumb-index="${index}" class="aspect-square rounded-lg overflow-hidden ${index === 0 ? "border-2 border-primary" : "ring-1 ring-outline-variant/40 hover:ring-primary/60"} transition-all">`,
                `<img class="w-full h-full object-cover" src="${EscapeHtml(url)}" alt="商品图片缩略图"/>`,
                "</button>"
            ].join("");
        }).join("");

        if (urlList.length > 4) {
            thumbContainer.insertAdjacentHTML(
                "beforeend",
                `<div class="aspect-square rounded-lg bg-surface-container flex items-center justify-center text-xs font-semibold text-on-surface-variant">+${urlList.length - 4}</div>`
            );
        }

        const thumbButtonList = Array.from(thumbContainer.querySelectorAll("[data-role='gallery-thumb']"));
        thumbButtonList.forEach(function BindThumbClick(buttonNode) {
            buttonNode.addEventListener("click", function HandleThumbClick() {
                const thumbIndex = Number(buttonNode.getAttribute("data-thumb-index"));
                if (Number.isNaN(thumbIndex) || !urlList[thumbIndex]) {
                    return;
                }
                mainImageNode.src = urlList[thumbIndex];
                thumbButtonList.forEach(function UpdateThumbClass(item) {
                    item.classList.remove("border-2", "border-primary");
                    item.classList.add("ring-1", "ring-outline-variant/40");
                });
                buttonNode.classList.remove("ring-1", "ring-outline-variant/40");
                buttonNode.classList.add("border-2", "border-primary");
            });
        });
    }

    /**
     * 构建图片预览地址
     */
    function BuildImageUrlList(imageFileIds) {
        const safeFileIdList = Array.isArray(imageFileIds) ? imageFileIds : [];
        return safeFileIdList
            .map(function MapFileId(fileId) {
                if (!window.CampusShareApi.BuildPublicFileUrl) {
                    return "";
                }
                return window.CampusShareApi.BuildPublicFileUrl(fileId);
            })
            .filter(function FilterEmpty(url) {
                return !!url;
            });
    }

    /**
     * 初始化页签
     */
    function InitializeDetailTabs() {
        const tabListNode = document.querySelector("[data-role='detail-tab-list']");
        if (!tabListNode) {
            return;
        }
        const tabButtonList = Array.from(tabListNode.querySelectorAll("[data-tab-button]"));
        const tabPanelList = Array.from(document.querySelectorAll("[data-tab-panel]"));
        if (!tabButtonList.length || !tabPanelList.length) {
            return;
        }

        const firstButton = tabButtonList[0];
        if (firstButton) {
            SetActiveTab(firstButton.getAttribute("data-tab-target"), tabButtonList, tabPanelList);
        }
        tabButtonList.forEach(function BindTabClick(buttonNode) {
            buttonNode.addEventListener("click", function HandleTabClick() {
                SetActiveTab(buttonNode.getAttribute("data-tab-target"), tabButtonList, tabPanelList);
            });
        });
    }

    /**
     * 切换页签
     */
    function SetActiveTab(tabTarget, tabButtonList, tabPanelList) {
        const safeTarget = tabTarget || "description";
        tabButtonList.forEach(function UpdateButton(buttonNode) {
            const active = buttonNode.getAttribute("data-tab-target") === safeTarget;
            buttonNode.classList.toggle("border-b-2", active);
            buttonNode.classList.toggle("border-primary", active);
            buttonNode.classList.toggle("font-bold", active);
            buttonNode.classList.toggle("text-primary", active);
            buttonNode.classList.toggle("text-outline", !active);
            buttonNode.classList.toggle("font-medium", !active);
        });
        tabPanelList.forEach(function UpdatePanel(panelNode) {
            const active = panelNode.getAttribute("data-tab-panel") === safeTarget;
            panelNode.classList.toggle("hidden", !active);
        });
    }

    /**
     * 加载评论列表
     */
    async function LoadProductComments(productId, view, detailResult, messageBar) {
        if (!view.reviewListNode) {
            return;
        }
        try {
            const listResult = await window.CampusShareApi.ListProductComments(
                productId,
                COMMENT_PAGE_NO,
                COMMENT_PAGE_SIZE
            );
            const commentList = Array.isArray(listResult && listResult.commentList) ? listResult.commentList : [];
            RenderCommentList(view.reviewListNode, commentList);
            UpdateReviewTabText(view.reviewTabNode, Number(listResult && listResult.totalCount ? listResult.totalCount : 0));
            RenderSellerCreditSummary(view, detailResult, listResult);
        } catch (error) {
            RenderCommentList(view.reviewListNode, []);
            RenderSellerCreditByDetail(view, detailResult);
            ShowError(messageBar, ResolveErrorMessage(error, "评论加载失败"));
        }
    }

    /**
     * 渲染评论列表
     */
    function RenderCommentList(reviewListNode, commentList) {
        if (!reviewListNode) {
            return;
        }
        if (!Array.isArray(commentList) || !commentList.length) {
            reviewListNode.innerHTML = [
                "<div class=\"p-6 bg-surface-container-lowest rounded-xl border border-surface-container text-sm text-on-surface-variant\">",
                "暂无评价",
                "</div>"
            ].join("");
            return;
        }

        reviewListNode.innerHTML = commentList.map(function BuildCommentItem(comment) {
            const displayName = comment.fromUserDisplayName || "匿名用户";
            return [
                "<div class=\"p-6 bg-surface-container-lowest rounded-xl border border-transparent hover:border-surface-container transition-all\">",
                "<div class=\"flex justify-between items-start mb-4\">",
                "<div class=\"flex items-center gap-3\">",
                `<div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-outline">${EscapeHtml(ResolveInitials(displayName))}</div>`,
                "<div>",
                `<div class="font-bold text-on-surface">${EscapeHtml(displayName)}</div>`,
                `<div class="text-xs text-outline">${EscapeHtml(FormatRelativeTime(comment.createTime))}</div>`,
                "</div>",
                "</div>",
                `<div class="flex text-primary">${BuildStarHtml(Number(comment.score || 0))}</div>`,
                "</div>",
                `<p class="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">${EscapeHtml(comment.content || "")}</p>`,
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 更新评价页签文案
     */
    function UpdateReviewTabText(reviewTabNode, totalCount) {
        if (!reviewTabNode) {
            return;
        }
        reviewTabNode.textContent = `评价 (${Math.max(0, Number(totalCount || 0))})`;
    }

    /**
     * 渲染评价入口提示
     */
    function RenderReviewAccessHint(reviewSection, statusContext) {
        if (!reviewSection) {
            return;
        }
        const writeButton = FindButtonByTextInScope(reviewSection, "撰写评价");
        if (writeButton) {
            writeButton.disabled = true;
            writeButton.classList.add("opacity-50", "cursor-not-allowed");
            writeButton.textContent = "订单完成后可评价";
        }

        let hintNode = reviewSection.querySelector("[data-role='review-access-hint']");
        if (!hintNode) {
            hintNode = document.createElement("p");
            hintNode.className = "text-xs text-slate-500 mb-4";
            hintNode.setAttribute("data-role", "review-access-hint");
            reviewSection.insertBefore(hintNode, reviewSection.firstChild);
        }

        if (statusContext.canLoadCommentData) {
            hintNode.textContent = "仅展示历史评价，新的评价请在订单中心“已完成订单”中提交。";
        } else {
            hintNode.textContent = "当前商品状态不可评价，交易完成后可在订单中心提交评价。";
        }
    }

    /**
     * 渲染信誉汇总
     */
    function RenderSellerCreditSummary(view, detailResult, commentListResult) {
        if (!view.sellerSection) {
            return;
        }
        const scoreCount = Number(commentListResult && commentListResult.sellerScoreCount ? commentListResult.sellerScoreCount : 0);
        const avgScore = Number(commentListResult && commentListResult.sellerAverageScore ? commentListResult.sellerAverageScore : 0);
        const positiveRate = Number(commentListResult && commentListResult.sellerPositiveRate ? commentListResult.sellerPositiveRate : 0);

        if (view.sellerScoreNodeList.length >= 3) {
            view.sellerScoreNodeList[0].textContent = scoreCount > 0 ? FormatScore(avgScore) : "--";
            view.sellerScoreNodeList[1].textContent = String(Math.max(0, scoreCount));
            view.sellerScoreNodeList[2].textContent = scoreCount > 0 ? `${FormatRate(positiveRate)}%` : "--";
        }
        if (view.sellerNameNode) {
            view.sellerNameNode.textContent = commentListResult && commentListResult.sellerDisplayName
                ? commentListResult.sellerDisplayName
                : (detailResult && detailResult.sellerDisplayName ? detailResult.sellerDisplayName : "未知用户");
        }
        if (view.sellerMetaNode) {
            view.sellerMetaNode.textContent = scoreCount > 0
                ? `累计 ${scoreCount} 条交易评价`
                : "暂无信誉数据";
        }
    }

    /**
     * 无评论时使用详情兜底
     */
    function RenderSellerCreditByDetail(view, detailResult) {
        if (!view.sellerSection) {
            return;
        }
        if (view.sellerNameNode) {
            view.sellerNameNode.textContent = detailResult && detailResult.sellerDisplayName
                ? detailResult.sellerDisplayName
                : "未知用户";
        }
        if (view.sellerMetaNode) {
            view.sellerMetaNode.textContent = "暂无信誉数据";
        }
        if (view.sellerScoreNodeList.length >= 3) {
            view.sellerScoreNodeList[0].textContent = "--";
            view.sellerScoreNodeList[1].textContent = "0";
            view.sellerScoreNodeList[2].textContent = "--";
        }
    }

    /**
     * 信誉区显示与隐藏
     */
    function SetSellerCreditVisibility(view, visible, message) {
        if (!view.sellerSection) {
            return;
        }
        let hintNode = document.querySelector("[data-role='seller-credit-hint']");
        if (visible) {
            view.sellerSection.classList.remove("hidden");
            if (hintNode) {
                hintNode.remove();
            }
            return;
        }
        view.sellerSection.classList.add("hidden");
        if (!hintNode) {
            hintNode = document.createElement("div");
            hintNode.setAttribute("data-role", "seller-credit-hint");
            hintNode.className = "rounded-xl border border-surface-container bg-surface-container-low p-4 text-sm text-on-surface-variant";
            view.sellerSection.parentElement.appendChild(hintNode);
        }
        hintNode.textContent = message || "信誉信息暂不可展示";
    }

    /**
     * 绑定右侧操作按钮
     */
    function BindActionButtons(state, view, messageBar, reportModal) {
        if (view.buyButton) {
            view.buyButton.addEventListener("click", async function HandleBuyClick() {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "请先登录后再下单");
                    RedirectToAuthWithCurrentPage();
                    return;
                }
                if (!state.currentContext || !state.currentContext.canTrade) {
                    ShowError(messageBar, "当前商品状态不可下单");
                    return;
                }
                view.buyButton.disabled = true;
                try {
                    const detail = state.currentDetail || {};
                    const result = await window.CampusShareApi.CreateOrder({
                        productId: state.productId,
                        tradeLocation: detail.tradeLocation || "线下约定地点"
                    });
                    ShowSuccess(messageBar, `下单成功，订单号：${result.orderNo || result.orderId || ""}`);
                    window.setTimeout(function GoOrderCenter() {
                        window.location.href = "/pages/order_center.html";
                    }, 900);
                } catch (error) {
                    ShowError(messageBar, ResolveErrorMessage(error, "下单失败"));
                } finally {
                    view.buyButton.disabled = false;
                }
            });
        }

        if (view.favoriteButton) {
            view.favoriteButton.addEventListener("click", async function HandleFavoriteClick() {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "请先登录后再收藏");
                    RedirectToAuthWithCurrentPage();
                    return;
                }
                view.favoriteButton.disabled = true;
                try {
                    const result = await window.CampusShareApi.ToggleProductFavorite(state.productId);
                    ApplyFavoriteUi(result, view.favoriteButton, view.favoriteIcon);
                    ShowSuccess(messageBar, result && result.favorited ? "已加入收藏" : "已取消收藏");
                } catch (error) {
                    ShowError(messageBar, ResolveErrorMessage(error, "收藏操作失败"));
                } finally {
                    view.favoriteButton.disabled = false;
                }
            });
        }

        if (view.shareButton) {
            view.shareButton.addEventListener("click", function HandleShareClick() {
                if (state.currentContext && state.currentContext.disableMainActions) {
                    ShowInfo(messageBar, "当前商品状态不可分享");
                    return;
                }
                const url = `${window.location.origin}/pages/market_item_detail.html?productId=${encodeURIComponent(String(state.productId))}`;
                if (!navigator.clipboard || !navigator.clipboard.writeText) {
                    ShowInfo(messageBar, "请手动复制地址栏链接进行分享");
                    return;
                }
                navigator.clipboard.writeText(url).then(function HandleCopied() {
                    ShowSuccess(messageBar, "商品链接已复制");
                }).catch(function HandleCopyFailed() {
                    ShowInfo(messageBar, "复制失败，请手动复制地址栏链接");
                });
            });
        }

        if (view.reportButton) {
            view.reportButton.addEventListener("click", function HandleReportClick() {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "请先登录后再举报");
                    RedirectToAuthWithCurrentPage();
                    return;
                }
                if (state.currentContext && state.currentContext.disableMainActions) {
                    ShowInfo(messageBar, "当前商品状态不可举报");
                    return;
                }
                OpenReportModal(reportModal);
            });
        }
    }

    /**
     * 加载收藏状态
     */
    async function LoadFavoriteState(productId, favoriteButton, favoriteIcon) {
        if (!favoriteButton || !favoriteIcon) {
            return;
        }
        if (!window.CampusShareApi.GetAuthToken()) {
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
        const favorited = !!(favoriteState && favoriteState.favorited);
        favoriteButton.classList.toggle("text-primary", favorited);
        favoriteIcon.style.fontVariationSettings = favorited
            ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
            : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
        favoriteButton.title = favorited ? "已收藏" : "收藏";
    }

    /**
     * 构建消息条
     */
    function BuildMessageBar() {
        const messageBar = document.createElement("div");
        messageBar.className = "hidden mb-4 rounded-lg border px-4 py-3 text-sm";
        return messageBar;
    }

    /**
     * 构建举报弹窗
     */
    function BuildReportModal() {
        const wrapper = document.createElement("div");
        wrapper.className = "fixed inset-0 z-[70] hidden bg-black/45 backdrop-blur-sm flex items-center justify-center p-4";
        wrapper.innerHTML = [
            "<div class=\"w-full max-w-lg rounded-xl bg-surface-container-lowest shadow-xl border border-surface-container\">",
            "<div class=\"px-5 py-4 border-b border-surface-container flex items-center justify-between\">",
            "<h3 class=\"text-base font-bold text-on-surface\">提交举报</h3>",
            "<button type=\"button\" data-role=\"close\" class=\"material-symbols-outlined text-outline hover:text-on-surface\">close</button>",
            "</div>",
            "<div class=\"p-5 space-y-4\">",
            "<label class=\"block text-sm font-medium text-on-surface\">举报原因</label>",
            "<select data-role=\"reason\" class=\"w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm\">",
            "<option value=\"商品信息不实\">商品信息不实</option>",
            "<option value=\"疑似诈骗\">疑似诈骗</option>",
            "<option value=\"违规广告\">违规广告</option>",
            "<option value=\"侵权内容\">侵权内容</option>",
            "<option value=\"其他违规\">其他违规</option>",
            "</select>",
            "<label class=\"block text-sm font-medium text-on-surface\">补充说明</label>",
            "<textarea data-role=\"detail\" rows=\"4\" maxlength=\"500\" class=\"w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm resize-none\" placeholder=\"可填写补充说明（最多500字）\"></textarea>",
            "</div>",
            "<div class=\"px-5 py-4 border-t border-surface-container flex justify-end gap-3\">",
            "<button type=\"button\" data-role=\"cancel\" class=\"px-4 py-2 rounded-lg text-sm bg-surface-container text-on-surface-variant\">取消</button>",
            "<button type=\"button\" data-role=\"submit\" class=\"px-4 py-2 rounded-lg text-sm bg-primary text-on-primary font-semibold\">提交举报</button>",
            "</div>",
            "</div>"
        ].join("");

        if (window.CampusShareApi.EnhanceSelectElements) {
            window.CampusShareApi.EnhanceSelectElements(wrapper);
        }
        return {
            wrapper: wrapper,
            closeButton: wrapper.querySelector("[data-role='close']"),
            cancelButton: wrapper.querySelector("[data-role='cancel']"),
            submitButton: wrapper.querySelector("[data-role='submit']"),
            reasonSelect: wrapper.querySelector("[data-role='reason']"),
            detailTextArea: wrapper.querySelector("[data-role='detail']")
        };
    }

    /**
     * 绑定举报弹窗事件
     */
    function BindReportModalActions(reportModal, productId, messageBar) {
        reportModal.closeButton.addEventListener("click", function HandleClose() {
            CloseReportModal(reportModal);
        });
        reportModal.cancelButton.addEventListener("click", function HandleCancel() {
            CloseReportModal(reportModal);
        });
        reportModal.wrapper.addEventListener("click", function HandleBackdropClick(event) {
            if (event.target === reportModal.wrapper) {
                CloseReportModal(reportModal);
            }
        });
        reportModal.submitButton.addEventListener("click", async function HandleSubmit() {
            const reasonCategory = reportModal.reasonSelect.value ? reportModal.reasonSelect.value.trim() : "";
            const detail = reportModal.detailTextArea.value ? reportModal.detailTextArea.value.trim() : "";
            if (!reasonCategory) {
                ShowError(messageBar, "举报原因不能为空");
                return;
            }
            if (detail.length > 500) {
                ShowError(messageBar, "补充说明长度不能超过500字");
                return;
            }
            reportModal.submitButton.disabled = true;
            try {
                await window.CampusShareApi.SubmitReport({
                    targetType: "RESOURCE",
                    targetId: productId,
                    reasonCategory: reasonCategory,
                    detail: detail,
                    evidenceFileIds: [`PRODUCT_${productId}`]
                });
                CloseReportModal(reportModal);
                ShowSuccess(messageBar, "举报已提交，平台会尽快处理。");
            } catch (error) {
                ShowError(messageBar, ResolveErrorMessage(error, "举报提交失败"));
            } finally {
                reportModal.submitButton.disabled = false;
            }
        });
    }

    function OpenReportModal(reportModal) {
        reportModal.reasonSelect.selectedIndex = 0;
        reportModal.detailTextArea.value = "";
        reportModal.wrapper.classList.remove("hidden");
    }

    function CloseReportModal(reportModal) {
        reportModal.wrapper.classList.add("hidden");
    }

    /**
     * 不可用态渲染
     */
    function RenderUnavailableState(messageText) {
        const mainElement = document.querySelector("main");
        if (!mainElement) {
            return;
        }
        mainElement.innerHTML = [
            "<section class=\"max-w-3xl mx-auto py-16\">",
            "<div class=\"rounded-2xl border border-surface-container bg-surface-container-lowest p-8 text-center\">",
            "<div class=\"material-symbols-outlined text-5xl text-outline mb-4\">inventory_2</div>",
            "<h1 class=\"text-2xl font-bold text-on-surface mb-3\">商品暂不可查看</h1>",
            `<p class=\"text-on-surface-variant mb-6\">${EscapeHtml(messageText || "商品不存在或已下线")}</p>`,
            "<div class=\"flex flex-wrap items-center justify-center gap-3\">",
            "<a href=\"/pages/my_publish.html\" class=\"px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold\">我的发布</a>",
            "<a href=\"/pages/market_listing.html\" class=\"px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-semibold\">返回市场</a>",
            "</div>",
            "</div>",
            "</section>"
        ].join("");
    }

    function ApplyUnavailableMode(view) {
        SetButtonDisabled(view.buyButton, true);
        SetButtonDisabled(view.contactButton, true);
        SetButtonDisabled(view.favoriteButton, true);
        SetButtonDisabled(view.shareButton, true);
        SetButtonDisabled(view.reportButton, true);
    }

    function SetButtonDisabled(buttonNode, disabled, titleText) {
        if (!buttonNode) {
            return;
        }
        buttonNode.disabled = !!disabled;
        buttonNode.classList.toggle("opacity-60", !!disabled);
        buttonNode.classList.toggle("cursor-not-allowed", !!disabled);
        if (titleText) {
            buttonNode.title = titleText;
        }
    }

    function ResolveProductIdFromUrl() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const productIdValue = searchParams.get("productId");
        const productId = Number(productIdValue);
        if (!productIdValue || Number.isNaN(productId) || productId <= 0) {
            return null;
        }
        return productId;
    }

    function FindFavoriteButton() {
        const buttonList = Array.from(document.querySelectorAll("button"));
        return buttonList.find(function MatchButton(buttonNode) {
            const iconNode = buttonNode.querySelector(".material-symbols-outlined");
            return iconNode && (iconNode.textContent || "").trim() === "favorite";
        }) || null;
    }

    function FindFavoriteIcon() {
        const favoriteButton = FindFavoriteButton();
        return favoriteButton ? favoriteButton.querySelector(".material-symbols-outlined") : null;
    }

    function FindButtonByText(text) {
        const buttonList = Array.from(document.querySelectorAll("button"));
        return buttonList.find(function MatchByText(buttonNode) {
            return (buttonNode.textContent || "").replace(/\s+/g, "").includes(text);
        }) || null;
    }

    function FindButtonByTextInScope(scopeNode, text) {
        if (!scopeNode) {
            return null;
        }
        const buttonList = Array.from(scopeNode.querySelectorAll("button"));
        return buttonList.find(function MatchByText(buttonNode) {
            return (buttonNode.textContent || "").replace(/\s+/g, "").includes(text);
        }) || null;
    }

    function RedirectToAuthWithCurrentPage() {
        if (window.CampusShareApi && window.CampusShareApi.RedirectToAuthPage) {
            window.CampusShareApi.RedirectToAuthPage(window.location.pathname + window.location.search);
            return;
        }
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/pages/auth_access.html?redirect=${redirect}`;
    }

    function NormalizeStatus(productStatus) {
        if (!productStatus) {
            return "";
        }
        return String(productStatus).toUpperCase();
    }

    function ResolveInitials(name) {
        const safe = (name || "").trim();
        if (!safe) {
            return "匿";
        }
        const partList = safe.split(/\s+/).filter(Boolean);
        if (partList.length >= 2) {
            return `${partList[0][0]}${partList[1][0]}`.toUpperCase();
        }
        if (safe.length >= 2) {
            return safe.slice(0, 2);
        }
        return safe;
    }

    function BuildStarHtml(score) {
        const safeScore = Math.max(0, Math.min(5, score));
        const starList = [];
        for (let index = 1; index <= 5; index += 1) {
            const filled = index <= safeScore;
            starList.push(
                `<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' ${filled ? 1 : 0};">star</span>`
            );
        }
        return starList.join("");
    }

    function FormatAmount(amount) {
        const numberValue = Number(amount);
        if (Number.isNaN(numberValue)) {
            return "0.00";
        }
        return numberValue.toFixed(2);
    }

    function FormatScore(score) {
        const numberValue = Number(score);
        if (Number.isNaN(numberValue)) {
            return "--";
        }
        return numberValue.toFixed(1);
    }

    function FormatRate(rate) {
        const numberValue = Number(rate);
        if (Number.isNaN(numberValue)) {
            return "--";
        }
        return numberValue.toFixed(0);
    }

    function FormatRelativeTime(timeText) {
        if (!timeText) {
            return "-";
        }
        const dateValue = new Date(timeText);
        if (Number.isNaN(dateValue.getTime())) {
            return String(timeText);
        }
        const diff = Date.now() - dateValue.getTime();
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        if (diff < minute) {
            return "刚刚";
        }
        if (diff < hour) {
            return `${Math.floor(diff / minute)} 分钟前`;
        }
        if (diff < day) {
            return `${Math.floor(diff / hour)} 小时前`;
        }
        return `${Math.floor(diff / day)} 天前`;
    }

    function EscapeHtml(text) {
        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function ResolveErrorMessage(error, fallbackMessage) {
        if (!error) {
            return fallbackMessage;
        }
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return fallbackMessage;
    }

    function ShowSuccess(messageBar, message) {
        ShowMessage(messageBar, message, "border-emerald-200 bg-emerald-50 text-emerald-700");
    }

    function ShowError(messageBar, message) {
        ShowMessage(messageBar, message, "border-red-200 bg-red-50 text-red-700");
    }

    function ShowInfo(messageBar, message) {
        ShowMessage(messageBar, message, "border-blue-200 bg-blue-50 text-blue-700");
    }

    function ShowMessage(messageBar, message, styleClassName) {
        if (!messageBar) {
            return;
        }
        messageBar.className = `mb-4 rounded-lg border px-4 py-3 text-sm ${styleClassName}`;
        messageBar.textContent = message || "";
        messageBar.classList.remove("hidden");
    }

    function HideMessage(messageBar) {
        if (!messageBar) {
            return;
        }
        messageBar.classList.add("hidden");
    }
})();
