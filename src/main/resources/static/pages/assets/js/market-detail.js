/**
 * 鍟嗗搧璇︽儏椤佃剼鏈? */
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
     * 缁戝畾璇︽儏椤典富閫昏緫
     */
    function BindMarketDetailPage() {
        if (!window.CampusShareApi) {
            return;
        }

        const productId = ResolveProductIdFromUrl();
        if (!productId) {
            RenderUnavailableState("鍟嗗搧鍙傛暟缂哄け锛岃杩斿洖鍒楄〃閲嶆柊杩涘叆銆?);
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
            const message = ResolveErrorMessage(error, "鍟嗗搧涓嶅瓨鍦ㄦ垨鏆備笉鍙");
            ApplyUnavailableMode(view);
            RenderUnavailableState(message);
        });
    }

    /**
     * 璇诲彇椤甸潰鑺傜偣
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
            reviewButtonNode: reviewSection ? FindButtonByTextInScope(reviewSection, "鎾板啓璇勪环") : null,
            buyButton: FindButtonByText("涓嬪崟"),
            contactButton: FindButtonByText("鑱旂郴鍗栧"),
            favoriteButton: FindFavoriteButton(),
            favoriteIcon: FindFavoriteIcon(),
            shareButton: document.querySelector("button[data-action='share-product']"),
            reportButton: document.querySelector("button[data-action='report-product']")
        };
    }

    /**
     * 椤甸潰闈欐€佷腑鏂囧厹搴?     */
    function InitializeStaticText(view) {
        const tabDescription = document.querySelector("[data-tab-target='description']");
        const tabReview = document.querySelector("[data-tab-target='review']");
        const tabPolicy = document.querySelector("[data-tab-target='policy']");
        const reviewTitle = view.reviewSection ? view.reviewSection.querySelector("h2") : null;
        if (tabDescription) {
            tabDescription.textContent = "鎻忚堪";
        }
        if (tabReview && !tabReview.textContent.includes("璇勪环")) {
            tabReview.textContent = "璇勪环 (0)";
        }
        if (tabPolicy) {
            tabPolicy.textContent = "鏀跨瓥";
        }
        if (reviewTitle) {
            reviewTitle.textContent = "绀惧尯鍙嶉";
        }
        if (view.reviewButtonNode) {
            view.reviewButtonNode.textContent = "鎾板啓璇勪环";
        }
    }

    /**
     * 鍔犺浇骞舵覆鏌撹鎯?     */
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
     * 浼樺厛璇诲彇鍏紑璇︽儏锛屽け璐ュ悗鍥為€€鍒扳€滄垜鐨勫彂甯冣€?     */
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
     * 浠庢垜鐨勫彂甯冧腑鍥為€€璇诲彇璇︽儏
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
                        description: matched.description || "鍟嗗搧姝ｅ湪瀹℃牳鎴栧凡涓嬬嚎锛屼粎鍙戝竷鑰呭拰绠＄悊鍛樺彲鏌ョ湅銆?
                    };
                }
            } catch (ignoreError) {
                // 蹇界暐鍗曚釜鐘舵€佹煡璇㈠け璐?            }
        }
        return null;
    }

    /**
     * 娓叉煋璇︽儏瀛楁
     */
    function ApplyProductDetailView(detailResult, view) {
        const safeTitle = detailResult && detailResult.title ? detailResult.title : `鍟嗗搧 #${detailResult.productId || ""}`;
        const safeCategory = detailResult && detailResult.category ? detailResult.category : "鏍″洯鍟嗗搧";
        const safeCondition = detailResult && detailResult.conditionLevel ? detailResult.conditionLevel : "鐘舵€佹湭鐭?;
        const safeLocation = detailResult && detailResult.tradeLocation ? detailResult.tradeLocation : "-";
        const safeSellerName = detailResult && detailResult.sellerDisplayName ? detailResult.sellerDisplayName : "鏈煡鐢ㄦ埛";
        const safeDescription = detailResult && detailResult.description ? detailResult.description : "鏆傛棤鍟嗗搧鎻忚堪";

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
            view.priceNode.textContent = `楼${FormatAmount(detailResult && detailResult.price)}`;
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
            view.sellerMetaNode.textContent = "鏆傛棤淇¤獕鏁版嵁";
        }
        document.title = `CampusShare | ${safeTitle}`;
        RenderProductGallery(detailResult && detailResult.imageFileIds);
    }

    /**
     * 瑙ｆ瀽鐘舵€佷笂涓嬫枃
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
     * 搴旂敤鐘舵€佷笂涓嬫枃鍒扮晫闈?     */
    function ApplyStatusContext(statusContext, view, messageBar) {
        if (statusContext.disableMainActions) {
            SetButtonDisabled(view.buyButton, true, "褰撳墠鐘舵€佷笉鍙笅鍗?);
            SetButtonDisabled(view.contactButton, true, "褰撳墠鐘舵€佷笉鍙仈绯?);
            SetButtonDisabled(view.shareButton, true, "褰撳墠鐘舵€佷笉鍙垎浜?);
            SetButtonDisabled(view.reportButton, true, "褰撳墠鐘舵€佷笉鍙妇鎶?);
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
            SetSellerCreditVisibility(view, false, "璇ュ晢鍝佸凡涓嬬嚎锛屼俊瑾変俊鎭殏涓嶅睍绀?);
        }
        RenderReviewAccessHint(view.reviewSection, statusContext);
    }

    /**
     * 鐘舵€佹彁绀烘枃妗?     */
    function ResolveStatusNotice(status, onShelf) {
        if (status === STATUS_PENDING) {
            return "璇ュ晢鍝佹鍦ㄥ鏍镐腑锛屼粎鍙戝竷鑰呮垨绠＄悊鍛樺彲鏌ョ湅銆?;
        }
        if (status === STATUS_REJECTED) {
            return "璇ュ晢鍝佸鏍告湭閫氳繃锛屼粎鍙戝竷鑰呮垨绠＄悊鍛樺彲鏌ョ湅銆?;
        }
        if (status === STATUS_FORCE_OFFLINE) {
            return "璇ュ晢鍝佸凡寮哄埗涓嬬嚎锛屼粎鍙戝竷鑰呮垨绠＄悊鍛樺彲鏌ョ湅銆?;
        }
        if (status === STATUS_OFFLINE) {
            return "璇ュ晢鍝佸凡涓嬫灦锛屽綋鍓嶄笉鍙氦鏄撱€?;
        }
        if (status === STATUS_CLOSED) {
            return "璇ュ晢鍝佸凡鍏抽棴锛屽綋鍓嶄笉鍙氦鏄撱€?;
        }
        if (status === STATUS_LOCKED) {
            return "璇ュ晢鍝佽鍗曞鐞嗕腑锛屾殏涓嶅彲閲嶅涓嬪崟銆?;
        }
        if (status === STATUS_PUBLISHED && !onShelf) {
            return "璇ュ晢鍝佸綋鍓嶄笉鍙氦鏄撱€?;
        }
        return "";
    }

    /**
     * 娓叉煋鍥鹃泦
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
                `<img class="w-full h-full object-cover" src="${EscapeHtml(url)}" alt="鍟嗗搧鍥剧墖缂╃暐鍥?/>`,
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
     * 鏋勫缓鍥剧墖棰勮鍦板潃
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
     * 鍒濆鍖栭〉绛?     */
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
     * 鍒囨崲椤电
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
     * 鍔犺浇璇勮鍒楄〃
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
            ShowError(messageBar, ResolveErrorMessage(error, "璇勮鍔犺浇澶辫触"));
        }
    }

    /**
     * 娓叉煋璇勮鍒楄〃
     */
    function RenderCommentList(reviewListNode, commentList) {
        if (!reviewListNode) {
            return;
        }
        if (!Array.isArray(commentList) || !commentList.length) {
            reviewListNode.innerHTML = [
                "<div class=\"p-6 bg-surface-container-lowest rounded-xl border border-surface-container text-sm text-on-surface-variant\">",
                "鏆傛棤璇勪环",
                "</div>"
            ].join("");
            return;
        }

        reviewListNode.innerHTML = commentList.map(function BuildCommentItem(comment) {
            const displayName = comment.fromUserDisplayName || "鍖垮悕鐢ㄦ埛";
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
     * 鏇存柊璇勪环椤电鏂囨
     */
    function UpdateReviewTabText(reviewTabNode, totalCount) {
        if (!reviewTabNode) {
            return;
        }
        reviewTabNode.textContent = `璇勪环 (${Math.max(0, Number(totalCount || 0))})`;
    }

    /**
     * 娓叉煋璇勪环鍏ュ彛鎻愮ず
     */
    function RenderReviewAccessHint(reviewSection, statusContext) {
        if (!reviewSection) {
            return;
        }
        const writeButton = FindButtonByTextInScope(reviewSection, "鎾板啓璇勪环");
        if (writeButton) {
            writeButton.disabled = true;
            writeButton.classList.add("opacity-50", "cursor-not-allowed");
            writeButton.textContent = "璁㈠崟瀹屾垚鍚庡彲璇勪环";
        }

        let hintNode = reviewSection.querySelector("[data-role='review-access-hint']");
        if (!hintNode) {
            hintNode = document.createElement("p");
            hintNode.className = "text-xs text-slate-500 mb-4";
            hintNode.setAttribute("data-role", "review-access-hint");
            reviewSection.insertBefore(hintNode, reviewSection.firstChild);
        }

        if (statusContext.canLoadCommentData) {
            hintNode.textContent = "浠呭睍绀哄巻鍙茶瘎浠凤紝鏂扮殑璇勪环璇峰湪璁㈠崟涓績鈥滃凡瀹屾垚璁㈠崟鈥濅腑鎻愪氦銆?;
        } else {
            hintNode.textContent = "褰撳墠鍟嗗搧鐘舵€佷笉鍙瘎浠凤紝浜ゆ槗瀹屾垚鍚庡彲鍦ㄨ鍗曚腑蹇冩彁浜よ瘎浠枫€?;
        }
    }

    /**
     * 娓叉煋淇¤獕姹囨€?     */
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
                : (detailResult && detailResult.sellerDisplayName ? detailResult.sellerDisplayName : "鏈煡鐢ㄦ埛");
        }
        if (view.sellerMetaNode) {
            view.sellerMetaNode.textContent = scoreCount > 0
                ? `绱 ${scoreCount} 鏉′氦鏄撹瘎浠穈
                : "鏆傛棤淇¤獕鏁版嵁";
        }
    }

    /**
     * 鏃犺瘎璁烘椂浣跨敤璇︽儏鍏滃簳
     */
    function RenderSellerCreditByDetail(view, detailResult) {
        if (!view.sellerSection) {
            return;
        }
        if (view.sellerNameNode) {
            view.sellerNameNode.textContent = detailResult && detailResult.sellerDisplayName
                ? detailResult.sellerDisplayName
                : "鏈煡鐢ㄦ埛";
        }
        if (view.sellerMetaNode) {
            view.sellerMetaNode.textContent = "鏆傛棤淇¤獕鏁版嵁";
        }
        if (view.sellerScoreNodeList.length >= 3) {
            view.sellerScoreNodeList[0].textContent = "--";
            view.sellerScoreNodeList[1].textContent = "0";
            view.sellerScoreNodeList[2].textContent = "--";
        }
    }

    /**
     * 淇¤獕鍖烘樉绀轰笌闅愯棌
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
        hintNode.textContent = message || "淇¤獕淇℃伅鏆備笉鍙睍绀?;
    }

    /**
     * 缁戝畾鍙充晶鎿嶄綔鎸夐挳
     */
    function BindActionButtons(state, view, messageBar, reportModal) {
        if (view.buyButton) {
            view.buyButton.addEventListener("click", async function HandleBuyClick() {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "璇峰厛鐧诲綍鍚庡啀涓嬪崟");
                    RedirectToAuthWithCurrentPage();
                    return;
                }
                if (!state.currentContext || !state.currentContext.canTrade) {
                    ShowError(messageBar, "褰撳墠鍟嗗搧鐘舵€佷笉鍙笅鍗?);
                    return;
                }
                view.buyButton.disabled = true;
                try {
                    const detail = state.currentDetail || {};
                    const result = await window.CampusShareApi.CreateOrder({
                        productId: state.productId,
                        tradeLocation: detail.tradeLocation || "绾夸笅绾﹀畾鍦扮偣"
                    });
                    ShowSuccess(messageBar, `涓嬪崟鎴愬姛锛岃鍗曞彿锛?{result.orderNo || result.orderId || ""}`);
                    window.setTimeout(function GoOrderCenter() {
                        window.location.href = "/pages/order_center.html";
                    }, 900);
                } catch (error) {
                    ShowError(messageBar, ResolveErrorMessage(error, "涓嬪崟澶辫触"));
                } finally {
                    view.buyButton.disabled = false;
                }
            });
        }

        if (view.favoriteButton) {
            view.favoriteButton.addEventListener("click", async function HandleFavoriteClick() {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "璇峰厛鐧诲綍鍚庡啀鏀惰棌");
                    RedirectToAuthWithCurrentPage();
                    return;
                }
                view.favoriteButton.disabled = true;
                try {
                    const result = await window.CampusShareApi.ToggleProductFavorite(state.productId);
                    ApplyFavoriteUi(result, view.favoriteButton, view.favoriteIcon);
                    ShowSuccess(messageBar, result && result.favorited ? "宸插姞鍏ユ敹钘? : "宸插彇娑堟敹钘?);
                } catch (error) {
                    ShowError(messageBar, ResolveErrorMessage(error, "鏀惰棌鎿嶄綔澶辫触"));
                } finally {
                    view.favoriteButton.disabled = false;
                }
            });
        }

        if (view.shareButton) {
            view.shareButton.addEventListener("click", function HandleShareClick() {
                if (state.currentContext && state.currentContext.disableMainActions) {
                    ShowInfo(messageBar, "褰撳墠鍟嗗搧鐘舵€佷笉鍙垎浜?);
                    return;
                }
                const url = `${window.location.origin}/pages/market_item_detail.html?productId=${encodeURIComponent(String(state.productId))}`;
                if (!navigator.clipboard || !navigator.clipboard.writeText) {
                    ShowInfo(messageBar, "璇锋墜鍔ㄥ鍒跺湴鍧€鏍忛摼鎺ヨ繘琛屽垎浜?);
                    return;
                }
                navigator.clipboard.writeText(url).then(function HandleCopied() {
                    ShowSuccess(messageBar, "鍟嗗搧閾炬帴宸插鍒?);
                }).catch(function HandleCopyFailed() {
                    ShowInfo(messageBar, "澶嶅埗澶辫触锛岃鎵嬪姩澶嶅埗鍦板潃鏍忛摼鎺?);
                });
            });
        }

        if (view.reportButton) {
            view.reportButton.addEventListener("click", function HandleReportClick() {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "璇峰厛鐧诲綍鍚庡啀涓炬姤");
                    RedirectToAuthWithCurrentPage();
                    return;
                }
                if (state.currentContext && state.currentContext.disableMainActions) {
                    ShowInfo(messageBar, "褰撳墠鍟嗗搧鐘舵€佷笉鍙妇鎶?);
                    return;
                }
                OpenReportModal(reportModal);
            });
        }
    }

    /**
     * 鍔犺浇鏀惰棌鐘舵€?     */
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
     * 搴旂敤鏀惰棌鏍峰紡
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
        favoriteButton.title = favorited ? "宸叉敹钘? : "鏀惰棌";
    }

    /**
     * 鏋勫缓娑堟伅鏉?     */
    function BuildMessageBar() {
        const messageBar = document.createElement("div");
        messageBar.className = "hidden mb-4 rounded-lg border px-4 py-3 text-sm";
        return messageBar;
    }

    /**
     * 鏋勫缓涓炬姤寮圭獥
     */
    function BuildReportModal() {
        const wrapper = document.createElement("div");
        wrapper.className = "fixed inset-0 z-[70] hidden bg-black/45 backdrop-blur-sm flex items-center justify-center p-4";
        wrapper.innerHTML = [
            "<div class=\"w-full max-w-lg rounded-xl bg-surface-container-lowest shadow-xl border border-surface-container\">",
            "<div class=\"px-5 py-4 border-b border-surface-container flex items-center justify-between\">",
            "<h3 class=\"text-base font-bold text-on-surface\">鎻愪氦涓炬姤</h3>",
            "<button type=\"button\" data-role=\"close\" class=\"material-symbols-outlined text-outline hover:text-on-surface\">close</button>",
            "</div>",
            "<div class=\"p-5 space-y-4\">",
            "<label class=\"block text-sm font-medium text-on-surface\">涓炬姤鍘熷洜</label>",
            "<select data-role=\"reason\" class=\"w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm\">",
            "<option value=\"鍟嗗搧淇℃伅涓嶅疄\">鍟嗗搧淇℃伅涓嶅疄</option>",
            "<option value=\"鐤戜技璇堥獥\">鐤戜技璇堥獥</option>",
            "<option value=\"杩濊骞垮憡\">杩濊骞垮憡</option>",
            "<option value=\"渚垫潈鍐呭\">渚垫潈鍐呭</option>",
            "<option value=\"鍏朵粬杩濊\">鍏朵粬杩濊</option>",
            "</select>",
            "<label class=\"block text-sm font-medium text-on-surface\">琛ュ厖璇存槑</label>",
            "<textarea data-role=\"detail\" rows=\"4\" maxlength=\"500\" class=\"w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm resize-none\" placeholder=\"鍙～鍐欒ˉ鍏呰鏄庯紙鏈€澶?00瀛楋級\"></textarea>",
            "</div>",
            "<div class=\"px-5 py-4 border-t border-surface-container flex justify-end gap-3\">",
            "<button type=\"button\" data-role=\"cancel\" class=\"px-4 py-2 rounded-lg text-sm bg-surface-container text-on-surface-variant\">鍙栨秷</button>",
            "<button type=\"button\" data-role=\"submit\" class=\"px-4 py-2 rounded-lg text-sm bg-primary text-on-primary font-semibold\">鎻愪氦涓炬姤</button>",
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
     * 缁戝畾涓炬姤寮圭獥浜嬩欢
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
                ShowError(messageBar, "涓炬姤鍘熷洜涓嶈兘涓虹┖");
                return;
            }
            if (detail.length > 500) {
                ShowError(messageBar, "琛ュ厖璇存槑闀垮害涓嶈兘瓒呰繃500瀛?);
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
                ShowSuccess(messageBar, "涓炬姤宸叉彁浜わ紝骞冲彴浼氬敖蹇鐞嗐€?);
            } catch (error) {
                ShowError(messageBar, ResolveErrorMessage(error, "涓炬姤鎻愪氦澶辫触"));
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
     * 涓嶅彲鐢ㄦ€佹覆鏌?     */
    function RenderUnavailableState(messageText) {
        const mainElement = document.querySelector("main");
        if (!mainElement) {
            return;
        }
        mainElement.innerHTML = [
            "<section class=\"max-w-3xl mx-auto py-16\">",
            "<div class=\"rounded-2xl border border-surface-container bg-surface-container-lowest p-8 text-center\">",
            "<div class=\"material-symbols-outlined text-5xl text-outline mb-4\">inventory_2</div>",
            "<h1 class=\"text-2xl font-bold text-on-surface mb-3\">鍟嗗搧鏆備笉鍙煡鐪?/h1>",
            `<p class=\"text-on-surface-variant mb-6\">${EscapeHtml(messageText || "鍟嗗搧涓嶅瓨鍦ㄦ垨宸蹭笅绾?)}</p>`,
            "<div class=\"flex flex-wrap items-center justify-center gap-3\">",
            "<a href=\"/pages/my_publish.html\" class=\"px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold\">鎴戠殑鍙戝竷</a>",
            "<a href=\"/pages/market_listing.html\" class=\"px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-semibold\">杩斿洖甯傚満</a>",
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
            return "鍖?;
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
            return "鍒氬垰";
        }
        if (diff < hour) {
            return `${Math.floor(diff / minute)} 鍒嗛挓鍓峘;
        }
        if (diff < day) {
            return `${Math.floor(diff / hour)} 灏忔椂鍓峘;
        }
        return `${Math.floor(diff / day)} 澶╁墠`;
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

