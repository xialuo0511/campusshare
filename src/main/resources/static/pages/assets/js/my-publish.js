/**
 * 我的发布页面逻辑
 */
(function InitMyPublishPage() {
    const DEFAULT_PAGE_NO = 1;
    const DEFAULT_PAGE_SIZE = 6;
    const TAB_TYPE_PRODUCT = "PRODUCT";
    const TAB_TYPE_MATERIAL = "MATERIAL";

    const PRODUCT_STATUS_TEXT_MAP = {
        PENDING_REVIEW: "待审核",
        PUBLISHED: "上架中",
        OFFLINE: "已下架",
        LOCKED: "交易锁定",
        CLOSED: "已关闭"
    };
    const MATERIAL_STATUS_TEXT_MAP = {
        DRAFT: "草稿",
        PENDING_REVIEW: "待审核",
        PUBLISHED: "已发布",
        REJECTED: "已驳回",
        OFFLINE: "已下架",
        CLOSED: "已关闭"
    };

    /**
     * 绑定页面
     */
    function BindMyPublishPage() {
        if (!window.CampusShareApi) {
            return;
        }

        const mainElement = document.querySelector("main");
        if (!mainElement) {
            return;
        }

        const listContainer = mainElement.querySelector("div.space-y-4");
        const tabButtonList = Array.from(mainElement.querySelectorAll("div.flex.bg-surface.rounded-lg.p-1 > button"));
        const searchInput = mainElement.querySelector("div.relative input");
        const statusSelect = mainElement.querySelector("div.flex.items-center.gap-4 select");
        const paginationContainer = mainElement.querySelector("div.mt-12.flex.justify-between.items-center");
        const statsCardList = Array.from(mainElement.querySelectorAll("div.grid.grid-cols-1.md\\:grid-cols-3 > div"));

        if (!listContainer || tabButtonList.length < 2 || !paginationContainer) {
            return;
        }

        const messageBar = BuildMessageBar(mainElement, listContainer);

        const state = {
            tabType: TAB_TYPE_PRODUCT,
            pageNo: DEFAULT_PAGE_NO,
            pageSize: DEFAULT_PAGE_SIZE,
            keyword: "",
            statusFilter: ""
        };

        BindTabButtons(tabButtonList, state, function HandleTabChanged() {
            state.pageNo = DEFAULT_PAGE_NO;
            LoadMyPublishList(state, listContainer, paginationContainer, messageBar);
            LoadStats(statsCardList, messageBar);
        });

        if (searchInput) {
            searchInput.addEventListener("input", function HandleSearchInput() {
                state.keyword = (searchInput.value || "").trim();
                state.pageNo = DEFAULT_PAGE_NO;
                LoadMyPublishList(state, listContainer, paginationContainer, messageBar);
            });
        }

        if (statusSelect) {
            statusSelect.addEventListener("change", function HandleStatusChange() {
                state.statusFilter = ResolveStatusFilter(statusSelect.value || "", state.tabType);
                state.pageNo = DEFAULT_PAGE_NO;
                LoadMyPublishList(state, listContainer, paginationContainer, messageBar);
            });
        }

        listContainer.addEventListener("click", async function HandleListClick(event) {
            const actionButton = event.target.closest("button[data-action]");
            if (!actionButton) {
                return;
            }
            const action = actionButton.getAttribute("data-action") || "";
            const itemId = Number(actionButton.getAttribute("data-id") || "0");
            if (!itemId) {
                return;
            }

            actionButton.disabled = true;
            try {
                if (action === "view-product") {
                    window.location.href = `/pages/market_item_detail.html?productId=${encodeURIComponent(String(itemId))}`;
                    return;
                }
                if (action === "edit-product") {
                    window.location.href = `/pages/publish_create.html?productId=${encodeURIComponent(String(itemId))}`;
                    return;
                }
                if (action === "offline-product") {
                    await window.CampusShareApi.OfflineProduct(itemId, "用户手动下架");
                    ShowSuccess(messageBar, "商品已下架");
                } else if (action === "offline-material") {
                    await window.CampusShareApi.OfflineMaterial(itemId, "用户手动下架");
                    ShowSuccess(messageBar, "资料已下架");
                } else if (action === "view-material") {
                    const downloadResult = await window.CampusShareApi.DownloadMaterial(itemId);
                    await TriggerMaterialFileDownload(downloadResult, itemId);
                    return;
                } else if (action === "go-publish") {
                    window.location.href = "/pages/publish_create.html";
                    return;
                }

                await LoadMyPublishList(state, listContainer, paginationContainer, messageBar);
                await LoadStats(statsCardList, messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "操作失败");
            } finally {
                actionButton.disabled = false;
            }
        });

        LoadMyPublishList(state, listContainer, paginationContainer, messageBar);
        LoadStats(statsCardList, messageBar);
    }

    /**
     * 加载列表
     */
    async function LoadMyPublishList(state, listContainer, paginationContainer, messageBar) {
        try {
            if (state.tabType === TAB_TYPE_PRODUCT) {
                const query = {
                    pageNo: state.pageNo,
                    pageSize: state.pageSize,
                    productStatus: state.statusFilter
                };
                const listResult = await window.CampusShareApi.ListMyProducts(query);
                const sourceList = Array.isArray(listResult.productList) ? listResult.productList : [];
                const filteredList = FilterProductListByKeyword(sourceList, state.keyword);
                RenderProductList(filteredList, listContainer);
                RenderPagination(
                    paginationContainer,
                    state,
                    Number(listResult.totalCount || 0),
                    function HandlePageChange(nextPageNo) {
                        state.pageNo = nextPageNo;
                        LoadMyPublishList(state, listContainer, paginationContainer, messageBar);
                    }
                );
                HideMessage(messageBar);
                return;
            }

            const materialQuery = {
                pageNo: state.pageNo,
                pageSize: state.pageSize,
                materialStatus: state.statusFilter
            };
            const materialResult = await window.CampusShareApi.ListMyMaterials(materialQuery);
            const sourceMaterialList = Array.isArray(materialResult.materialList) ? materialResult.materialList : [];
            const filteredMaterialList = FilterMaterialListByKeyword(sourceMaterialList, state.keyword);
            RenderMaterialList(filteredMaterialList, listContainer);
            RenderPagination(
                paginationContainer,
                state,
                Number(materialResult.totalCount || 0),
                function HandlePageChange(nextPageNo) {
                    state.pageNo = nextPageNo;
                    LoadMyPublishList(state, listContainer, paginationContainer, messageBar);
                }
            );
            HideMessage(messageBar);
        } catch (error) {
            listContainer.innerHTML = "<div class=\"text-sm text-red-600 p-4 bg-red-50 rounded-lg\">加载失败，请稍后重试</div>";
            RenderPagination(paginationContainer, state, 0, function IgnorePageChange() {});
            ShowError(messageBar, error instanceof Error ? error.message : "列表加载失败");
        }
    }

    /**
     * 加载统计
     */
    async function LoadStats(statsCardList, messageBar) {
        if (!statsCardList || statsCardList.length < 3) {
            return;
        }
        try {
            const resultList = await Promise.all([
                window.CampusShareApi.ListMyProducts({ pageNo: 1, pageSize: 1, productStatus: "PUBLISHED" }),
                window.CampusShareApi.ListMyProducts({ pageNo: 1, pageSize: 1, productStatus: "OFFLINE" }),
                window.CampusShareApi.ListMyMaterials({ pageNo: 1, pageSize: 1 })
            ]);
            const publishedCount = Number(resultList[0].totalCount || 0);
            const offlineCount = Number(resultList[1].totalCount || 0);
            const materialCount = Number(resultList[2].totalCount || 0);

            PatchStatCard(statsCardList[0], publishedCount, `总上架 ${publishedCount} 条`);
            PatchStatCard(statsCardList[1], offlineCount, `已下架 ${offlineCount} 条`);
            PatchStatCard(statsCardList[2], materialCount, `资料总数 ${materialCount} 条`);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "统计加载失败");
        }
    }

    /**
     * 绑定Tab
     */
    function BindTabButtons(tabButtonList, state, onTabChanged) {
        tabButtonList[0].addEventListener("click", function HandleProductTabClick() {
            if (state.tabType === TAB_TYPE_PRODUCT) {
                return;
            }
            state.tabType = TAB_TYPE_PRODUCT;
            UpdateTabButtonStyle(tabButtonList, 0);
            onTabChanged();
        });

        tabButtonList[1].addEventListener("click", function HandleMaterialTabClick() {
            if (state.tabType === TAB_TYPE_MATERIAL) {
                return;
            }
            state.tabType = TAB_TYPE_MATERIAL;
            UpdateTabButtonStyle(tabButtonList, 1);
            onTabChanged();
        });
    }

    /**
     * 更新Tab样式
     */
    function UpdateTabButtonStyle(tabButtonList, activeIndex) {
        tabButtonList.forEach(function PatchTabButton(buttonElement, index) {
            if (index === activeIndex) {
                buttonElement.classList.add("bg-primary-container", "text-on-primary-container", "font-semibold");
                buttonElement.classList.remove("text-on-surface-variant", "font-medium");
                return;
            }
            buttonElement.classList.remove("bg-primary-container", "text-on-primary-container", "font-semibold");
            buttonElement.classList.add("text-on-surface-variant", "font-medium");
        });
    }

    /**
     * 渲染商品列表
     */
    function RenderProductList(productList, listContainer) {
        if (!Array.isArray(productList) || productList.length === 0) {
            listContainer.innerHTML = "<div class=\"bg-surface-container-lowest rounded-xl p-10 text-center text-slate-500\">暂无商品发布，去发布页创建第一条吧</div>";
            return;
        }

        listContainer.innerHTML = productList.map(function BuildProductRow(productItem) {
            const statusText = PRODUCT_STATUS_TEXT_MAP[productItem.productStatus] || (productItem.productStatus || "未知状态");
            const statusClass = ResolveStatusClass(productItem.productStatus, true);
            const imageUrl = ResolveProductImage(productItem);
            const canOffline = productItem.productStatus === "PUBLISHED";
            return [
                "<div class=\"bg-surface-container-lowest rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 group hover:bg-surface-container-low transition-all\">",
                "<div class=\"w-32 h-32 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0\">",
                `<img class=\"w-full h-full object-cover\" src=\"${EscapeHtml(imageUrl)}\" alt=\"商品图\"/>`,
                "</div>",
                "<div class=\"flex-1 min-w-0\">",
                "<div class=\"flex items-center gap-2 mb-1\">",
                `<span class=\"px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusClass}\">${EscapeHtml(statusText)}</span>`,
                `<span class=\"text-xs text-outline font-medium\">ID: #${EscapeHtml(String(productItem.productId || ""))}</span>`,
                "</div>",
                `<h3 class=\"text-lg font-bold text-on-surface mb-1 truncate\">${EscapeHtml(productItem.title || "未命名商品")}</h3>`,
                `<p class=\"text-sm text-on-surface-variant mb-2\">${EscapeHtml(BuildProductSubLine(productItem))}</p>`,
                "<div class=\"flex items-center gap-4\">",
                `<span class=\"text-primary font-bold text-lg\">¥ ${EscapeHtml(FormatAmount(productItem.price))}</span>`,
                `<span class=\"text-xs text-outline\">发布时间 ${EscapeHtml(FormatTime(productItem.createTime))}</span>`,
                "</div>",
                "</div>",
                "<div class=\"flex md:flex-col gap-2 w-full md:w-auto\">",
                `<button data-action=\"view-product\" data-id=\"${EscapeHtml(String(productItem.productId || ""))}\" class=\"flex-1 md:w-32 py-2 px-4 bg-primary text-on-primary text-xs font-semibold rounded-md hover:bg-primary-container transition-all\">查看</button>`,
                `<button data-action=\"edit-product\" data-id=\"${EscapeHtml(String(productItem.productId || ""))}\" class=\"flex-1 md:w-32 py-2 px-4 bg-surface-container-high text-on-surface text-xs font-semibold rounded-md hover:bg-surface-container-highest transition-all\">编辑</button>`,
                `<button data-action=\"offline-product\" data-id=\"${EscapeHtml(String(productItem.productId || ""))}\" ${canOffline ? "" : "disabled"} class=\"flex-1 md:w-32 py-2 px-4 ${canOffline ? "bg-error/10 text-error hover:bg-error hover:text-on-error" : "bg-surface-container text-outline cursor-not-allowed"} text-xs font-semibold rounded-md transition-all\">下架</button>`,
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 渲染资料列表
     */
    function RenderMaterialList(materialList, listContainer) {
        if (!Array.isArray(materialList) || materialList.length === 0) {
            listContainer.innerHTML = "<div class=\"bg-surface-container-lowest rounded-xl p-10 text-center text-slate-500\">暂无资料发布，去发布页上传第一份资料吧</div>";
            return;
        }

        listContainer.innerHTML = materialList.map(function BuildMaterialRow(materialItem) {
            const statusText = MATERIAL_STATUS_TEXT_MAP[materialItem.materialStatus] || (materialItem.materialStatus || "未知状态");
            const statusClass = ResolveStatusClass(materialItem.materialStatus, false);
            const canOffline = materialItem.materialStatus === "PUBLISHED";
            return [
                "<div class=\"bg-surface-container-lowest rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 group hover:bg-surface-container-low transition-all\">",
                "<div class=\"w-32 h-32 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0\">",
                `<span class=\"material-symbols-outlined text-4xl\">${ResolveFileIcon(materialItem.fileType)}</span>`,
                "</div>",
                "<div class=\"flex-1 min-w-0\">",
                "<div class=\"flex items-center gap-2 mb-1\">",
                `<span class=\"px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusClass}\">${EscapeHtml(statusText)}</span>`,
                `<span class=\"text-xs text-outline font-medium\">ID: #${EscapeHtml(String(materialItem.materialId || ""))}</span>`,
                "</div>",
                `<h3 class=\"text-lg font-bold text-on-surface mb-1 truncate\">${EscapeHtml(materialItem.courseName || "未命名资料")}</h3>`,
                `<p class=\"text-sm text-on-surface-variant mb-2\">文件 ${EscapeHtml(BuildFileTypeText(materialItem.fileType))} · ${EscapeHtml(FormatFileSize(materialItem.fileSizeBytes))} · 下载 ${EscapeHtml(String(SafeNumber(materialItem.downloadCount)))} 次</p>`,
                "<div class=\"flex items-center gap-4 text-xs text-outline\">",
                `<span>发布时间 ${EscapeHtml(FormatTime(materialItem.createTime))}</span>`,
                `<span>标签 ${EscapeHtml((materialItem.tags || []).join(" / ") || "-")}</span>`,
                "</div>",
                "</div>",
                "<div class=\"flex md:flex-col gap-2 w-full md:w-auto\">",
                `<button data-action=\"view-material\" data-id=\"${EscapeHtml(String(materialItem.materialId || ""))}\" class=\"flex-1 md:w-32 py-2 px-4 bg-primary text-on-primary text-xs font-semibold rounded-md hover:bg-primary-container transition-all\">查看</button>`,
                `<button data-action=\"go-publish\" class=\"flex-1 md:w-32 py-2 px-4 bg-surface-container-high text-on-surface text-xs font-semibold rounded-md hover:bg-surface-container-highest transition-all\">编辑</button>`,
                `<button data-action=\"offline-material\" data-id=\"${EscapeHtml(String(materialItem.materialId || ""))}\" ${canOffline ? "" : "disabled"} class=\"flex-1 md:w-32 py-2 px-4 ${canOffline ? "bg-error/10 text-error hover:bg-error hover:text-on-error" : "bg-surface-container text-outline cursor-not-allowed"} text-xs font-semibold rounded-md transition-all\">下架</button>`,
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    async function TriggerMaterialFileDownload(downloadResult, materialId) {
        const fileAccessUrl = downloadResult && downloadResult.fileAccessUrl
            ? String(downloadResult.fileAccessUrl).trim()
            : "";
        if (!fileAccessUrl) {
            throw new Error("下载地址缺失，请稍后重试");
        }
        const token = window.CampusShareApi.GetAuthToken ? window.CampusShareApi.GetAuthToken() : "";
        if (!token) {
            throw new Error("登录状态已失效，请重新登录");
        }
        const fileResponse = await fetch(fileAccessUrl, {
            method: "GET",
            headers: {
                "X-Auth-Token": token
            }
        });
        if (!fileResponse.ok) {
            throw new Error(`文件下载失败(${fileResponse.status})`);
        }
        const fileBlob = await fileResponse.blob();
        const blobUrl = window.URL.createObjectURL(fileBlob);
        const linkElement = document.createElement("a");
        linkElement.href = blobUrl;
        linkElement.download = ResolveMaterialFileName(downloadResult, materialId);
        document.body.appendChild(linkElement);
        linkElement.click();
        linkElement.remove();
        window.setTimeout(function CleanupBlobUrl() {
            window.URL.revokeObjectURL(blobUrl);
        }, 1000);
    }

    function ResolveMaterialFileName(downloadResult, materialId) {
        const fileId = downloadResult && downloadResult.fileId ? String(downloadResult.fileId).trim() : "";
        if (fileId) {
            return fileId;
        }
        return `material-${materialId || "file"}`;
    }

    /**
     * 渲染分页
     */
    function RenderPagination(paginationContainer, state, totalCount, onPageChange) {
        if (!paginationContainer) {
            return;
        }
        const summaryText = paginationContainer.querySelector("span");
        const buttonContainer = paginationContainer.querySelector("div");
        const totalPageCount = Math.max(1, Math.ceil(Math.max(0, totalCount) / state.pageSize));
        const safePageNo = Math.min(Math.max(1, state.pageNo), totalPageCount);
        state.pageNo = safePageNo;

        const startIndex = totalCount <= 0 ? 0 : (safePageNo - 1) * state.pageSize + 1;
        const endIndex = totalCount <= 0 ? 0 : Math.min(totalCount, safePageNo * state.pageSize);
        if (summaryText) {
            summaryText.textContent = `显示 ${startIndex}-${endIndex} / 共 ${totalCount} 条`;
        }

        if (!buttonContainer) {
            return;
        }
        buttonContainer.innerHTML = "";

        const previousButton = BuildPaginationButton("chevron_left", safePageNo > 1, function HandlePreviousClick() {
            onPageChange(safePageNo - 1);
        }, true);
        buttonContainer.appendChild(previousButton);

        const visiblePageList = BuildVisiblePageList(safePageNo, totalPageCount);
        visiblePageList.forEach(function AppendPageButton(pageNo) {
            const pageButton = document.createElement("button");
            pageButton.className = pageNo === safePageNo
                ? "w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-xs font-bold"
                : "w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface text-xs font-medium hover:bg-white transition-all";
            pageButton.textContent = String(pageNo);
            if (pageNo !== safePageNo) {
                pageButton.addEventListener("click", function HandlePageClick() {
                    onPageChange(pageNo);
                });
            }
            buttonContainer.appendChild(pageButton);
        });

        const nextButton = BuildPaginationButton("chevron_right", safePageNo < totalPageCount, function HandleNextClick() {
            onPageChange(safePageNo + 1);
        }, true);
        buttonContainer.appendChild(nextButton);
    }

    /**
     * 构建分页按钮
     */
    function BuildPaginationButton(iconName, enabled, onClick, iconOnly) {
        const buttonElement = document.createElement("button");
        buttonElement.className = iconOnly
            ? "w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-lowest text-outline hover:bg-white transition-all"
            : "px-3 py-1 rounded-lg text-xs";
        if (!enabled) {
            buttonElement.disabled = true;
            buttonElement.classList.add("opacity-40", "cursor-not-allowed");
        } else {
            buttonElement.addEventListener("click", onClick);
        }
        const iconElement = document.createElement("span");
        iconElement.className = "material-symbols-outlined text-[18px]";
        iconElement.textContent = iconName;
        buttonElement.appendChild(iconElement);
        return buttonElement;
    }

    /**
     * 构建可见页码
     */
    function BuildVisiblePageList(currentPageNo, totalPageCount) {
        const pageList = [];
        const startPageNo = Math.max(1, currentPageNo - 1);
        const endPageNo = Math.min(totalPageCount, currentPageNo + 1);
        for (let pageNo = startPageNo; pageNo <= endPageNo; pageNo += 1) {
            pageList.push(pageNo);
        }
        if (pageList.length < 3 && totalPageCount > pageList.length) {
            if (startPageNo > 1) {
                pageList.unshift(startPageNo - 1);
            } else if (endPageNo < totalPageCount) {
                pageList.push(endPageNo + 1);
            }
        }
        return pageList;
    }

    /**
     * 状态筛选值
     */
    function ResolveStatusFilter(statusText, tabType) {
        const text = (statusText || "").toLowerCase();
        if (text.includes("all") || text.includes("全部")) {
            return "";
        }
        if (tabType === TAB_TYPE_PRODUCT) {
            if (text.includes("active") || text.includes("上架")) {
                return "PUBLISHED";
            }
            if (text.includes("offline") || text.includes("下架")) {
                return "OFFLINE";
            }
            return "";
        }
        if (text.includes("active") || text.includes("发布")) {
            return "PUBLISHED";
        }
        if (text.includes("offline") || text.includes("下架")) {
            return "OFFLINE";
        }
        if (text.includes("review") || text.includes("审核")) {
            return "PENDING_REVIEW";
        }
        return "";
    }

    /**
     * 关键字过滤商品
     */
    function FilterProductListByKeyword(productList, keyword) {
        const safeKeyword = (keyword || "").trim().toLowerCase();
        if (!safeKeyword) {
            return productList;
        }
        return productList.filter(function MatchProduct(productItem) {
            return [
                productItem.title,
                productItem.category,
                productItem.tradeLocation,
                productItem.conditionLevel,
                productItem.sellerDisplayName
            ].some(function MatchField(fieldValue) {
                return String(fieldValue || "").toLowerCase().includes(safeKeyword);
            });
        });
    }

    /**
     * 关键字过滤资料
     */
    function FilterMaterialListByKeyword(materialList, keyword) {
        const safeKeyword = (keyword || "").trim().toLowerCase();
        if (!safeKeyword) {
            return materialList;
        }
        return materialList.filter(function MatchMaterial(materialItem) {
            return [
                materialItem.courseName,
                materialItem.description,
                (materialItem.tags || []).join(" ")
            ].some(function MatchField(fieldValue) {
                return String(fieldValue || "").toLowerCase().includes(safeKeyword);
            });
        });
    }

    /**
     * 状态样式
     */
    function ResolveStatusClass(statusCode, isProduct) {
        if (statusCode === "PUBLISHED") {
            return isProduct
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-green-100 text-green-700";
        }
        if (statusCode === "OFFLINE") {
            return "bg-surface-container-highest text-on-surface-variant";
        }
        if (statusCode === "PENDING_REVIEW") {
            return "bg-yellow-100 text-yellow-700";
        }
        if (statusCode === "REJECTED") {
            return "bg-red-100 text-red-700";
        }
        if (statusCode === "LOCKED") {
            return "bg-orange-100 text-orange-700";
        }
        return "bg-surface-container text-outline";
    }

    /**
     * 统计卡片赋值
     */
    function PatchStatCard(cardElement, countValue, helperText) {
        if (!cardElement) {
            return;
        }
        const numberNode = cardElement.querySelector("p.text-3xl");
        const helperNode = cardElement.querySelector("p.text-xs");
        if (numberNode) {
            numberNode.textContent = String(SafeNumber(countValue));
        }
        if (helperNode) {
            helperNode.textContent = helperText;
        }
    }

    /**
     * 构建商品副标题
     */
    function BuildProductSubLine(productItem) {
        const categoryText = productItem.category || "未分类";
        const conditionText = productItem.conditionLevel || "成色未知";
        const locationText = productItem.tradeLocation || "地点未填写";
        return `${categoryText} · ${conditionText} · ${locationText}`;
    }

    /**
     * 商品图片
     */
    function ResolveProductImage(productItem) {
        const imageFileIdList = Array.isArray(productItem.imageFileIds) ? productItem.imageFileIds : [];
        const firstImageFileId = imageFileIdList.find(function MatchFileId(fileId) {
            return String(fileId || "").trim();
        });
        if (firstImageFileId && window.CampusShareApi.BuildPublicFileUrl) {
            const fileUrl = window.CampusShareApi.BuildPublicFileUrl(firstImageFileId);
            if (fileUrl) {
                return fileUrl;
            }
        }
        return "https://picsum.photos/seed/campusshare/320/320";
    }

    /**
     * 文件图标
     */
    function ResolveFileIcon(fileType) {
        const lowerType = String(fileType || "").toLowerCase();
        if (lowerType.includes("pdf")) {
            return "picture_as_pdf";
        }
        if (lowerType.includes("sheet") || lowerType.includes("excel")) {
            return "table_chart";
        }
        if (lowerType.includes("zip")) {
            return "folder_zip";
        }
        return "description";
    }

    /**
     * 文件类型文本
     */
    function BuildFileTypeText(fileType) {
        const lowerType = String(fileType || "").toLowerCase();
        if (lowerType.includes("pdf")) {
            return "PDF";
        }
        if (lowerType.includes("word") || lowerType.includes("doc")) {
            return "Word";
        }
        if (lowerType.includes("sheet") || lowerType.includes("excel")) {
            return "Excel";
        }
        return fileType || "未知";
    }

    /**
     * 金额格式化
     */
    function FormatAmount(price) {
        const numberValue = Number(price || 0);
        if (Number.isNaN(numberValue)) {
            return "0.00";
        }
        return numberValue.toFixed(2);
    }

    /**
     * 文件大小格式化
     */
    function FormatFileSize(fileSizeBytes) {
        const size = Number(fileSizeBytes || 0);
        if (Number.isNaN(size) || size <= 0) {
            return "0 KB";
        }
        if (size >= 1024 * 1024) {
            return `${(size / (1024 * 1024)).toFixed(1)} MB`;
        }
        return `${Math.max(1, Math.round(size / 1024))} KB`;
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
     * 安全数字
     */
    function SafeNumber(value) {
        const numberValue = Number(value || 0);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }

    /**
     * 转义
     */
    function EscapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * 构建消息栏
     */
    function BuildMessageBar(mainElement, listContainer) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4";
        messageBar.style.display = "none";
        mainElement.insertBefore(messageBar, listContainer);
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

    document.addEventListener("DOMContentLoaded", BindMyPublishPage);
})();
