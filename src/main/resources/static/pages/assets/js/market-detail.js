/**
 * 商品详情页面逻辑
 */
(function InitMarketDetailPage() {
    /** 评论默认页码 */
    const COMMENT_PAGE_NO = 1;
    /** 评论默认页大小 */
    const COMMENT_PAGE_SIZE = 20;

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
        const reportButton = document.querySelector("button[data-action='report-product']");
        const messageBar = BuildMessageBar();
        const reportModal = BuildReportModal();
        document.body.appendChild(reportModal.wrapper);
        BindReportModalActions(reportModal, productId, messageBar);

        const reviewSection = FindSectionByHeading("社区反馈");
        const reviewListContainer = reviewSection ? reviewSection.querySelector("div.flex.flex-col.gap-6") : null;
        const writeReviewButton = reviewSection ? FindButtonByTextInScope(reviewSection, "撰写评价") : null;
        const reviewTabButton = FindReviewTabButton();

        let currentProductDetail = null;
        let refreshCommentList = function Noop() {};

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
        ).then(function HandleLoadedDetail(detailResult) {
            currentProductDetail = detailResult;
            const canLoadCommentData = CanLoadCommentData(detailResult);
            if (canLoadCommentData) {
                LoadProductComments(productId, reviewListContainer, reviewTabButton, sellerNameNode, messageBar);
            } else {
                RenderCommentList(reviewListContainer, []);
                UpdateReviewTabText(reviewTabButton, 0);
            }
            LoadFavoriteState(productId, favoriteButton, favoriteIcon);
            if (reviewSection && writeReviewButton && canLoadCommentData) {
                refreshCommentList = BindCommentComposer(
                    reviewSection,
                    writeReviewButton,
                    messageBar,
                    productId,
                    function ResolveToUserId() {
                        return currentProductDetail && currentProductDetail.sellerUserId
                            ? currentProductDetail.sellerUserId
                            : null;
                    },
                    function ReloadCommentList() {
                        LoadProductComments(
                            productId,
                            reviewListContainer,
                            reviewTabButton,
                            sellerNameNode,
                            messageBar
                        );
                    }
                );
            } else if (writeReviewButton && !canLoadCommentData) {
                writeReviewButton.disabled = true;
                writeReviewButton.classList.add("opacity-50", "cursor-not-allowed");
                writeReviewButton.textContent = "暂不可评价";
            }
        }).catch(function HandleDetailError(error) {
            currentProductDetail = null;
            const errorMessage = error instanceof Error ? error.message : "商品详情加载失败";
            DisableActionButton(buyButton);
            DisableActionButton(favoriteButton);
            DisableActionButton(reportButton);
            RenderUnavailableState(errorMessage);
            ShowError(messageBar, errorMessage);
        });

        if (buyButton) {
            buyButton.addEventListener("click", async function HandleCreateOrder() {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "请先登录后再下单");
                    RedirectToAuthWithCurrentPage();
                    return;
                }
                buyButton.disabled = true;
                try {
                    const detailResult = currentProductDetail || await window.CampusShareApi.GetProductDetail(productId);
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
                    RedirectToAuthWithCurrentPage();
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
        if (reportButton) {
            reportButton.addEventListener("click", function HandleReportProduct() {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "请先登录后再举报");
                    RedirectToAuthWithCurrentPage();
                    return;
                }
                OpenReportModal(reportModal);
            });
        }

        if (typeof refreshCommentList === "function") {
            refreshCommentList();
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
        RenderProductGallery(detailResult.imageFileIds);
        RenderProductReviewHint(detailResult, messageBar);
        return detailResult;
    }

    /**
     * 渲染不可用状态
     */
    function RenderUnavailableState(messageText) {
        const mainElement = document.querySelector("main");
        if (!mainElement) {
            return;
        }
        const safeMessageText = EscapeHtml(messageText || "商品不存在或暂不可见");
        mainElement.innerHTML = [
            "<section class=\"max-w-3xl mx-auto py-16\">",
            "<div class=\"rounded-2xl border border-surface-container bg-surface-container-lowest p-8 text-center\">",
            "<div class=\"material-symbols-outlined text-5xl text-outline mb-4\">inventory_2</div>",
            "<h1 class=\"text-2xl font-bold text-on-surface mb-3\">商品暂不可查看</h1>",
            `<p class=\"text-on-surface-variant mb-6\">${safeMessageText}</p>`,
            "<p class=\"text-sm text-on-surface-variant mb-6\">若该商品为你本人发布，可能处于审核中，请前往我的发布查看状态</p>",
            "<div class=\"flex flex-wrap items-center justify-center gap-3\">",
            "<a href=\"/pages/my_publish.html\" class=\"px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold\">我的发布</a>",
            "<a href=\"/pages/market_listing.html\" class=\"px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-semibold\">返回市场</a>",
            "</div>",
            "</div>",
            "</section>"
        ].join("");
    }

    /**
     * 禁用按钮
     */
    function DisableActionButton(buttonElement) {
        if (!buttonElement) {
            return;
        }
        buttonElement.disabled = true;
        buttonElement.classList.add("opacity-60", "cursor-not-allowed");
    }

    /**
     * 渲染审核提示
     */
    function RenderProductReviewHint(detailResult, messageBar) {
        const productStatus = String(detailResult && detailResult.productStatus ? detailResult.productStatus : "").toUpperCase();
        if (productStatus === "PENDING_REVIEW") {
            ShowInfo(messageBar, "该商品正在审核中，仅发布者和管理员可见");
            return;
        }
        if (productStatus === "REJECTED") {
            ShowInfo(messageBar, "该商品审核未通过，当前仅发布者和管理员可见");
            return;
        }
        HideMessage(messageBar);
    }

    /**
     * 是否允许加载评论数据
     */
    function CanLoadCommentData(detailResult) {
        const productStatus = String(detailResult && detailResult.productStatus ? detailResult.productStatus : "").toUpperCase();
        if (productStatus === "PENDING_REVIEW" || productStatus === "REJECTED") {
            return false;
        }
        return !!(detailResult && detailResult.onShelf);
    }

    /**
     * 渲染商品图片
     */
    function RenderProductGallery(imageFileIds) {
        const galleryImageList = Array.from(document.querySelectorAll("main div.lg\\:col-span-7 img"));
        if (!galleryImageList.length) {
            return;
        }
        const previewUrlList = BuildProductPreviewUrlList(imageFileIds);
        if (!previewUrlList.length) {
            return;
        }
        galleryImageList.forEach(function UpdateGalleryImage(imageElement, index) {
            const previewUrl = previewUrlList[index % previewUrlList.length];
            if (!previewUrl) {
                return;
            }
            imageElement.src = previewUrl;
        });
    }

    /**
     * 构建预览地址列表
     */
    function BuildProductPreviewUrlList(imageFileIds) {
        const safeImageFileIdList = Array.isArray(imageFileIds) ? imageFileIds : [];
        return safeImageFileIdList
            .map(function ResolveFileUrl(fileId) {
                if (!window.CampusShareApi || !window.CampusShareApi.BuildPublicFileUrl) {
                    return "";
                }
                return window.CampusShareApi.BuildPublicFileUrl(fileId);
            })
            .filter(function FilterValidUrl(fileUrl) {
                return !!fileUrl;
            });
    }

    /**
     * 加载商品评论
     */
    async function LoadProductComments(
        productId,
        reviewListContainer,
        reviewTabButton,
        sellerNameNode,
        messageBar
    ) {
        if (!reviewListContainer) {
            return;
        }
        try {
            const listResult = await window.CampusShareApi.ListProductComments(
                productId,
                COMMENT_PAGE_NO,
                COMMENT_PAGE_SIZE
            );
            RenderCommentList(reviewListContainer, listResult.commentList || []);
            UpdateReviewTabText(reviewTabButton, Number(listResult.totalCount || 0));
            RenderSellerCreditSummary(listResult, sellerNameNode);
        } catch (error) {
            RenderCommentList(reviewListContainer, []);
            ShowError(messageBar, error instanceof Error ? error.message : "评论加载失败");
        }
    }

    /**
     * 绑定评论编辑器
     */
    function BindCommentComposer(
        reviewSection,
        writeReviewButton,
        messageBar,
        productId,
        resolveToUserIdFunction,
        onSuccess
    ) {
        const composePanel = document.createElement("div");
        composePanel.className = "hidden rounded-xl border border-surface-container bg-surface-container-low p-4 mb-4";
        composePanel.innerHTML = [
            "<div class=\"flex items-center gap-3 mb-3\">",
            "<label class=\"text-sm text-on-surface-variant\">评分</label>",
            "<select data-role=\"score\" class=\"bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm\">",
            "<option value=\"5\">5 分</option>",
            "<option value=\"4\">4 分</option>",
            "<option value=\"3\">3 分</option>",
            "<option value=\"2\">2 分</option>",
            "<option value=\"1\">1 分</option>",
            "</select>",
            "</div>",
            "<textarea data-role=\"content\" rows=\"4\" maxlength=\"500\" ",
            "class=\"w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-3 text-sm resize-none\" ",
            "placeholder=\"请填写你的使用体验（1-500字）\"></textarea>",
            "<div class=\"flex justify-end items-center gap-3 mt-3\">",
            "<button type=\"button\" data-role=\"cancel\" class=\"px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container\">取消</button>",
            "<button type=\"button\" data-role=\"submit\" class=\"px-4 py-2 rounded-lg text-sm bg-primary text-on-primary font-semibold\">提交评价</button>",
            "</div>"
        ].join("");
        reviewSection.insertBefore(composePanel, reviewSection.querySelector("div.flex.flex-col.gap-6"));

        const scoreSelect = composePanel.querySelector("[data-role='score']");
        const contentTextArea = composePanel.querySelector("[data-role='content']");
        const submitButton = composePanel.querySelector("[data-role='submit']");
        const cancelButton = composePanel.querySelector("[data-role='cancel']");

        writeReviewButton.addEventListener("click", function HandleWriteReviewClick() {
            if (!window.CampusShareApi.GetAuthToken()) {
                ShowError(messageBar, "请先登录后再评价");
                RedirectToAuthWithCurrentPage();
                return;
            }
            composePanel.classList.toggle("hidden");
            if (!composePanel.classList.contains("hidden") && contentTextArea) {
                contentTextArea.focus();
            }
        });
        cancelButton.addEventListener("click", function HandleCancelClick() {
            composePanel.classList.add("hidden");
            if (contentTextArea) {
                contentTextArea.value = "";
            }
        });
        submitButton.addEventListener("click", async function HandleSubmitComment() {
            if (!window.CampusShareApi.GetAuthToken()) {
                ShowError(messageBar, "请先登录后再评价");
                RedirectToAuthWithCurrentPage();
                return;
            }
            const score = Number(scoreSelect ? scoreSelect.value : 5);
            const content = contentTextArea && contentTextArea.value ? contentTextArea.value.trim() : "";
            if (!content) {
                ShowError(messageBar, "评论内容不能为空");
                return;
            }
            if (content.length > 500) {
                ShowError(messageBar, "评论内容长度不能超过500");
                return;
            }
            submitButton.disabled = true;
            try {
                const payload = {
                    score: score,
                    content: content
                };
                const toUserId = resolveToUserIdFunction();
                if (toUserId) {
                    payload.toUserId = toUserId;
                }
                await window.CampusShareApi.CreateProductComment(productId, payload);
                ShowSuccess(messageBar, "评价提交成功");
                composePanel.classList.add("hidden");
                if (contentTextArea) {
                    contentTextArea.value = "";
                }
                onSuccess();
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "评价提交失败");
            } finally {
                submitButton.disabled = false;
            }
        });

        return function RefreshCommentList() {
            if (!composePanel.classList.contains("hidden")) {
                return;
            }
            onSuccess();
        };
    }

    /**
     * 渲染评论列表
     */
    function RenderCommentList(reviewListContainer, commentList) {
        if (!Array.isArray(commentList) || commentList.length === 0) {
            reviewListContainer.innerHTML = [
                "<div class=\"p-6 bg-surface-container-lowest rounded-xl border border-surface-container text-sm text-on-surface-variant\">",
                "暂无评论，欢迎发布第一条评价",
                "</div>"
            ].join("");
            return;
        }
        reviewListContainer.innerHTML = commentList.map(function BuildCommentItem(commentItem) {
            const displayName = commentItem.fromUserDisplayName || "匿名用户";
            const initials = ResolveInitials(displayName);
            return [
                "<div class=\"p-6 bg-surface-container-lowest rounded-xl border border-transparent hover:border-surface-container transition-all\">",
                "<div class=\"flex justify-between items-start mb-4\">",
                "<div class=\"flex items-center gap-3\">",
                `<div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-outline">${EscapeHtml(initials)}</div>`,
                "<div>",
                `<div class="font-bold text-on-surface">${EscapeHtml(displayName)}</div>`,
                `<div class="text-xs text-outline">${EscapeHtml(FormatRelativeTime(commentItem.createTime))}</div>`,
                "</div>",
                "</div>",
                `<div class="flex text-primary">${BuildStarHtml(Number(commentItem.score || 0))}</div>`,
                "</div>",
                `<p class="text-on-surface-variant text-sm leading-relaxed">${EscapeHtml(commentItem.content || "")}</p>`,
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 更新评价页签文案
     */
    function UpdateReviewTabText(reviewTabButton, totalCount) {
        if (!reviewTabButton) {
            return;
        }
        reviewTabButton.textContent = `评价 (${totalCount})`;
    }

    /**
     * 渲染卖家信用汇总
     */
    function RenderSellerCreditSummary(listResult, sellerNameNode) {
        const sellerSection = FindSectionByHeading("机构公信力");
        if (!sellerSection || !listResult) {
            return;
        }

        const scoreValueNodeList = sellerSection.querySelectorAll(
            "div.grid.grid-cols-3 span.text-xl.font-bold.text-primary"
        );
        if (scoreValueNodeList.length >= 3) {
            scoreValueNodeList[0].textContent = FormatScore(listResult.sellerAverageScore);
            scoreValueNodeList[1].textContent = String(Number(listResult.sellerScoreCount || 0));
            scoreValueNodeList[2].textContent = `${FormatRate(listResult.sellerPositiveRate)}%`;
        }

        const sellerNameNodeInSection = sellerSection.querySelector("div.flex.flex-col span.font-bold.text-on-surface");
        if (sellerNameNodeInSection) {
            sellerNameNodeInSection.textContent = listResult.sellerDisplayName
                || (sellerNameNode ? sellerNameNode.textContent : "认证卖家");
        }
        const sellerMetaNodeInSection = sellerSection.querySelector("div.flex.flex-col span.text-xs.text-outline");
        if (sellerMetaNodeInSection) {
            const scoreCount = Number(listResult.sellerScoreCount || 0);
            sellerMetaNodeInSection.textContent = scoreCount > 0
                ? `累计 ${scoreCount} 条交易评价`
                : "暂无交易评价";
        }
    }

    /**
     * 构建星级HTML
     */
    function BuildStarHtml(score) {
        const clampedScore = Math.max(0, Math.min(5, score));
        const stars = [];
        for (let index = 1; index <= 5; index += 1) {
            const filled = index <= clampedScore;
            stars.push(
                `<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' ${filled ? 1 : 0};">star</span>`
            );
        }
        return stars.join("");
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
     * 构建消息条
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
     * 构建举报弹层
     */
    function BuildReportModal() {
        const wrapper = document.createElement("div");
        wrapper.className = "hidden fixed inset-0 z-[1300] bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-4";
        wrapper.innerHTML = [
            "<div class=\"w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-xl p-6\">",
            "<div class=\"flex items-center justify-between mb-4\">",
            "<h3 class=\"text-lg font-bold text-on-surface\">举报商品</h3>",
            "<button type=\"button\" data-role=\"close\" class=\"material-symbols-outlined text-slate-500 hover:text-slate-700\">close</button>",
            "</div>",
            "<div class=\"space-y-4\">",
            "<label class=\"block\">",
            "<span class=\"text-xs text-slate-500 font-semibold\">举报原因</span>",
            "<select data-role=\"reason\" class=\"mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm\">",
            "<option value=\"涉嫌虚假信息\">涉嫌虚假信息</option>",
            "<option value=\"疑似欺诈交易\">疑似欺诈交易</option>",
            "<option value=\"违规商品发布\">违规商品发布</option>",
            "<option value=\"人身攻击或骚扰\">人身攻击或骚扰</option>",
            "<option value=\"其他违规行为\">其他违规行为</option>",
            "</select>",
            "</label>",
            "<label class=\"block\">",
            "<span class=\"text-xs text-slate-500 font-semibold\">补充说明</span>",
            "<textarea data-role=\"detail\" maxlength=\"500\" rows=\"4\" ",
            "class=\"mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-sm resize-none\" ",
            "placeholder=\"可填写更详细的情况说明（最多500字）\"></textarea>",
            "</label>",
            "</div>",
            "<div class=\"flex justify-end items-center gap-3 mt-5\">",
            "<button type=\"button\" data-role=\"cancel\" class=\"px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container\">取消</button>",
            "<button type=\"button\" data-role=\"submit\" class=\"px-4 py-2 rounded-lg text-sm bg-red-600 text-white font-semibold\">提交举报</button>",
            "</div>",
            "</div>"
        ].join("");
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
     * 绑定举报弹层事件
     */
    function BindReportModalActions(reportModal, productId, messageBar) {
        reportModal.closeButton.addEventListener("click", function HandleCloseClick() {
            CloseReportModal(reportModal);
        });
        reportModal.cancelButton.addEventListener("click", function HandleCancelClick() {
            CloseReportModal(reportModal);
        });
        reportModal.wrapper.addEventListener("click", function HandleWrapperClick(event) {
            if (event.target === reportModal.wrapper) {
                CloseReportModal(reportModal);
            }
        });
        reportModal.submitButton.addEventListener("click", async function HandleSubmitClick() {
            const reasonCategory = reportModal.reasonSelect && reportModal.reasonSelect.value
                ? reportModal.reasonSelect.value.trim()
                : "";
            const detail = reportModal.detailTextArea && reportModal.detailTextArea.value
                ? reportModal.detailTextArea.value.trim()
                : "";
            if (!reasonCategory) {
                ShowError(messageBar, "举报原因不能为空");
                return;
            }
            if (reasonCategory.length > 50) {
                ShowError(messageBar, "举报原因长度不能超过50");
                return;
            }
            if (detail.length > 500) {
                ShowError(messageBar, "补充说明长度不能超过500");
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
                ShowSuccess(messageBar, "举报已提交，平台将尽快处理");
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "举报提交失败");
            } finally {
                reportModal.submitButton.disabled = false;
            }
        });
    }

    /**
     * 打开举报弹层
     */
    function OpenReportModal(reportModal) {
        if (reportModal.reasonSelect) {
            reportModal.reasonSelect.selectedIndex = 0;
        }
        if (reportModal.detailTextArea) {
            reportModal.detailTextArea.value = "";
        }
        reportModal.wrapper.classList.remove("hidden");
        if (reportModal.reasonSelect) {
            reportModal.reasonSelect.focus();
        }
    }

    /**
     * 关闭举报弹层
     */
    function CloseReportModal(reportModal) {
        reportModal.wrapper.classList.add("hidden");
    }

    /**
     * 查找指定标题所在区块
     */
    function FindSectionByHeading(titleText) {
        const headingList = Array.from(document.querySelectorAll("h2, h3"));
        const headingNode = headingList.find(function MatchHeading(item) {
            return (item.textContent || "").includes(titleText);
        });
        return headingNode ? headingNode.closest("section") : null;
    }

    /**
     * 查询评价页签按钮
     */
    function FindReviewTabButton() {
        const buttonList = Array.from(document.querySelectorAll("main button"));
        return buttonList.find(function MatchReviewTab(buttonElement) {
            const text = buttonElement.textContent || "";
            return text.includes("评价");
        }) || null;
    }

    /**
     * 在范围内按文本查按钮
     */
    function FindButtonByTextInScope(scopeElement, buttonText) {
        if (!scopeElement) {
            return null;
        }
        const buttonList = Array.from(scopeElement.querySelectorAll("button"));
        return buttonList.find(function MatchButton(buttonElement) {
            return (buttonElement.textContent || "").includes(buttonText);
        }) || null;
    }

    /**
     * 按文本查按钮
     */
    function FindButtonByText(buttonText) {
        const buttonList = Array.from(document.querySelectorAll("button"));
        return buttonList.find(function MatchButton(buttonElement) {
            return (buttonElement.textContent || "").includes(buttonText);
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
     * 跳转登录
     */
    function RedirectToAuthWithCurrentPage() {
        window.setTimeout(function RedirectToAuthPage() {
            const currentPath = window.location.pathname + window.location.search;
            if (window.CampusShareApi.RedirectToAuthPage) {
                window.CampusShareApi.RedirectToAuthPage(currentPath);
                return;
            }
            window.location.href = "/pages/auth_access.html";
        }, 700);
    }

    /**
     * 解析昵称缩写
     */
    function ResolveInitials(displayName) {
        const trimmedName = (displayName || "").trim();
        if (!trimmedName) {
            return "U";
        }
        if (trimmedName.length === 1) {
            return trimmedName.toUpperCase();
        }
        return trimmedName.slice(0, 2).toUpperCase();
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
     * 格式化评分
     */
    function FormatScore(scoreValue) {
        const scoreNumber = Number(scoreValue || 0);
        if (Number.isNaN(scoreNumber) || scoreNumber <= 0) {
            return "0.0";
        }
        return scoreNumber.toFixed(1);
    }

    /**
     * 格式化比率
     */
    function FormatRate(rateValue) {
        const rateNumber = Number(rateValue || 0);
        if (Number.isNaN(rateNumber) || rateNumber <= 0) {
            return "0.00";
        }
        return rateNumber.toFixed(2);
    }

    /**
     * 格式化相对时间
     */
    function FormatRelativeTime(timeText) {
        if (!timeText) {
            return "-";
        }
        const createdTime = new Date(timeText).getTime();
        if (Number.isNaN(createdTime)) {
            return "-";
        }
        const diffMinutes = Math.floor((Date.now() - createdTime) / (1000 * 60));
        if (diffMinutes < 1) {
            return "刚刚";
        }
        if (diffMinutes < 60) {
            return `${diffMinutes} 分钟前`;
        }
        if (diffMinutes < 60 * 24) {
            return `${Math.floor(diffMinutes / 60)} 小时前`;
        }
        if (diffMinutes < 60 * 24 * 30) {
            return `${Math.floor(diffMinutes / (60 * 24))} 天前`;
        }
        return new Date(createdTime).toLocaleDateString("zh-CN");
    }

    /**
     * HTML转义
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
     * 显示提示
     */
    function ShowInfo(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm border border-blue-200 bg-blue-50 text-blue-700 mb-4";
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
