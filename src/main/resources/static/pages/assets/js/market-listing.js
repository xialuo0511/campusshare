/**
 * 市场列表页面逻辑
 */
(function InitMarketListingPage() {
    const DEFAULT_PAGE_NO = 1;
    const DEFAULT_PAGE_SIZE = 12;

    /**
     * 绑定页面行为
     */
    function BindMarketListingPage() {
        if (!window.CampusShareApi) {
            return;
        }
        const productGrid = document.querySelector("main div.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4.gap-6");
        if (!productGrid) {
            return;
        }

        const summaryText = document.querySelector("main p.text-on-surface-variant.text-sm.font-medium");
        const searchInput = document.querySelector("header input[placeholder='搜索市场...']");
        const sortSelect = FindSortSelect();
        const categoryCheckboxList = Array.from(document.querySelectorAll("aside input[type='checkbox']"));
        const minPriceInput = document.querySelector("aside input[placeholder='最低']");
        const maxPriceInput = document.querySelector("aside input[placeholder='最高']");
        const conditionButtonList = Array.from(document.querySelectorAll("aside section:nth-of-type(3) button"));
        const locationSelect = FindLocationSelect();
        const clearFilterButton = FindButtonByText("清除所有筛选");
        const paginationArea = document.querySelector("main div.mt-16.flex.justify-center");

        const messageBar = BuildMessageBar(productGrid);
        const pageText = BuildPaginationText(paginationArea);

        const state = {
            pageNo: DEFAULT_PAGE_NO,
            pageSize: DEFAULT_PAGE_SIZE,
            totalCount: 0,
            totalPages: 1,
            keyword: "",
            category: "",
            conditionLevel: ResolveConditionText(conditionButtonList.find(IsConditionSelected)),
            tradeLocation: "",
            minPrice: "",
            maxPrice: "",
            sortType: ResolveSortType(sortSelect)
        };

        BindSearchInput(searchInput, state, function ReloadFromSearch() {
            LoadProductList(state, productGrid, summaryText, pageText, messageBar);
        });
        BindSortSelect(sortSelect, state, function ReloadFromSort() {
            LoadProductList(state, productGrid, summaryText, pageText, messageBar);
        });
        BindCategoryFilters(categoryCheckboxList, state, function ReloadFromCategory() {
            LoadProductList(state, productGrid, summaryText, pageText, messageBar);
        });
        BindPriceFilters(minPriceInput, maxPriceInput, state, function ReloadFromPrice() {
            LoadProductList(state, productGrid, summaryText, pageText, messageBar);
        });
        BindConditionFilters(conditionButtonList, state, function ReloadFromCondition() {
            LoadProductList(state, productGrid, summaryText, pageText, messageBar);
        });
        BindLocationFilter(locationSelect, state, function ReloadFromLocation() {
            LoadProductList(state, productGrid, summaryText, pageText, messageBar);
        });
        BindClearFilter(
            clearFilterButton,
            categoryCheckboxList,
            conditionButtonList,
            minPriceInput,
            maxPriceInput,
            locationSelect,
            sortSelect,
            searchInput,
            state,
            function ReloadFromReset() {
                LoadProductList(state, productGrid, summaryText, pageText, messageBar);
            }
        );
        BindPagination(state, paginationArea, function ReloadFromPage() {
            LoadProductList(state, productGrid, summaryText, pageText, messageBar);
        });
        BindProductClick(productGrid);

        LoadProductList(state, productGrid, summaryText, pageText, messageBar);
    }

    /**
     * 加载商品列表
     */
    async function LoadProductList(state, productGrid, summaryText, pageText, messageBar) {
        try {
            const listResult = await window.CampusShareApi.ListProducts({
                pageNo: state.pageNo,
                pageSize: state.pageSize,
                keyword: state.keyword,
                category: state.category,
                conditionLevel: state.conditionLevel,
                tradeLocation: state.tradeLocation,
                minPrice: state.minPrice,
                maxPrice: state.maxPrice,
                sortType: state.sortType
            });
            state.totalCount = Number(listResult.totalCount || 0);
            state.totalPages = Math.max(1, Math.ceil(state.totalCount / state.pageSize));
            RenderProductGrid(Array.isArray(listResult.productList) ? listResult.productList : [], productGrid);
            RenderSummary(state, summaryText);
            RenderPageText(state, pageText);
            HideMessage(messageBar);
        } catch (error) {
            RenderProductGrid([], productGrid);
            ShowError(messageBar, error instanceof Error ? error.message : "商品列表加载失败");
        }
    }

    /**
     * 渲染商品卡片
     */
    function RenderProductGrid(productList, productGrid) {
        if (!productList || productList.length === 0) {
            productGrid.innerHTML = "<div class=\"col-span-full text-center text-sm text-slate-400 py-16\">暂无符合条件的商品</div>";
            return;
        }
        productGrid.innerHTML = productList.map(function BuildCard(item) {
            const badgeClass = ResolveConditionBadgeClass(item.conditionLevel);
            return [
                `<div class="group bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer" data-product-id="${EscapeHtml(String(item.productId))}">`,
                "<div class=\"relative h-56 overflow-hidden\">",
                `<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${ResolveCardImage(item.productId)}" alt="商品图片"/>`,
                "<div class=\"absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center\">",
                `<button type="button" data-product-id="${EscapeHtml(String(item.productId))}" data-role="quick-view" class="bg-surface-container-lowest text-primary px-4 py-2 rounded-md font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform">快速查看</button>`,
                "</div>",
                `<span class="absolute top-3 left-3 px-2 py-1 text-[10px] font-bold rounded-sm uppercase tracking-tighter ${badgeClass}">${EscapeHtml(item.conditionLevel || "-")}</span>`,
                "</div>",
                "<div class=\"p-5\">",
                "<div class=\"flex justify-between items-start mb-2\">",
                `<h3 class="text-sm font-bold text-on-surface line-clamp-1">${EscapeHtml(item.title || "-")}</h3>`,
                `<span class="text-primary font-bold text-lg leading-none">￥${EscapeHtml(FormatAmount(item.price))}</span>`,
                "</div>",
                "<div class=\"flex items-center gap-2 mb-4\">",
                "<span class=\"material-symbols-outlined text-[14px] text-outline\">location_on</span>",
                `<span class="text-xs text-on-surface-variant font-medium">${EscapeHtml(item.tradeLocation || "-")}</span>`,
                "</div>",
                "<div class=\"flex items-center justify-between\">",
                "<div class=\"flex items-center gap-2\">",
                "<div class=\"w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] text-slate-500\">U</div>",
                `<span class="text-[11px] font-semibold text-outline">${EscapeHtml(item.sellerDisplayName || "匿名用户")}</span>`,
                "</div>",
                `<span class="text-[11px] text-outline">${EscapeHtml(FormatRelativeTime(item.createTime))}</span>`,
                "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 绑定商品点击
     */
    function BindProductClick(productGrid) {
        productGrid.addEventListener("click", function HandleGridClick(event) {
            const quickButton = event.target.closest("button[data-role='quick-view']");
            if (quickButton) {
                const productId = quickButton.getAttribute("data-product-id");
                if (productId) {
                    JumpToDetail(productId);
                }
                return;
            }
            const productCard = event.target.closest("[data-product-id]");
            if (!productCard) {
                return;
            }
            const productId = productCard.getAttribute("data-product-id");
            if (productId) {
                JumpToDetail(productId);
            }
        });
    }

    /**
     * 跳转详情页
     */
    function JumpToDetail(productId) {
        window.location.href = `/pages/market_item_detail.html?productId=${encodeURIComponent(productId)}`;
    }

    /**
     * 绑定搜索输入
     */
    function BindSearchInput(searchInput, state, onChange) {
        if (!searchInput) {
            return;
        }
        searchInput.addEventListener("keydown", function HandleSearch(event) {
            if (event.key !== "Enter") {
                return;
            }
            state.keyword = searchInput.value ? searchInput.value.trim() : "";
            state.pageNo = DEFAULT_PAGE_NO;
            onChange();
        });
    }

    /**
     * 绑定排序选择
     */
    function BindSortSelect(sortSelect, state, onChange) {
        if (!sortSelect) {
            return;
        }
        sortSelect.addEventListener("change", function HandleSortChange() {
            state.sortType = ResolveSortType(sortSelect);
            state.pageNo = DEFAULT_PAGE_NO;
            onChange();
        });
    }

    /**
     * 绑定分类过滤
     */
    function BindCategoryFilters(categoryCheckboxList, state, onChange) {
        if (!categoryCheckboxList || categoryCheckboxList.length === 0) {
            return;
        }
        categoryCheckboxList.forEach(function BindCategoryCheckbox(categoryCheckbox) {
            categoryCheckbox.addEventListener("change", function HandleCategoryChange() {
                state.category = ResolveSelectedCategory(categoryCheckboxList);
                state.pageNo = DEFAULT_PAGE_NO;
                onChange();
            });
        });
        state.category = ResolveSelectedCategory(categoryCheckboxList);
    }

    /**
     * 绑定价格过滤
     */
    function BindPriceFilters(minPriceInput, maxPriceInput, state, onChange) {
        if (!minPriceInput || !maxPriceInput) {
            return;
        }
        [minPriceInput, maxPriceInput].forEach(function BindPriceInput(priceInput) {
            priceInput.addEventListener("change", function HandlePriceChange() {
                state.minPrice = minPriceInput.value ? minPriceInput.value.trim() : "";
                state.maxPrice = maxPriceInput.value ? maxPriceInput.value.trim() : "";
                state.pageNo = DEFAULT_PAGE_NO;
                onChange();
            });
        });
    }

    /**
     * 绑定成色过滤
     */
    function BindConditionFilters(conditionButtonList, state, onChange) {
        if (!conditionButtonList || conditionButtonList.length === 0) {
            return;
        }
        conditionButtonList.forEach(function BindConditionButton(conditionButton) {
            conditionButton.addEventListener("click", function HandleConditionClick() {
                conditionButtonList.forEach(function ResetCondition(itemButton) {
                    itemButton.classList.remove("bg-secondary-container", "text-on-secondary-container");
                    itemButton.classList.add("bg-surface-container", "text-on-surface-variant");
                });
                conditionButton.classList.remove("bg-surface-container", "text-on-surface-variant");
                conditionButton.classList.add("bg-secondary-container", "text-on-secondary-container");
                state.conditionLevel = ResolveConditionText(conditionButton);
                state.pageNo = DEFAULT_PAGE_NO;
                onChange();
            });
        });
    }

    /**
     * 绑定地点过滤
     */
    function BindLocationFilter(locationSelect, state, onChange) {
        if (!locationSelect) {
            return;
        }
        locationSelect.addEventListener("change", function HandleLocationChange() {
            state.tradeLocation = locationSelect.value ? locationSelect.value.trim() : "";
            state.pageNo = DEFAULT_PAGE_NO;
            onChange();
        });
    }

    /**
     * 绑定清空筛选
     */
    function BindClearFilter(
        clearFilterButton,
        categoryCheckboxList,
        conditionButtonList,
        minPriceInput,
        maxPriceInput,
        locationSelect,
        sortSelect,
        searchInput,
        state,
        onChange
    ) {
        if (!clearFilterButton) {
            return;
        }
        clearFilterButton.addEventListener("click", function HandleResetFilter() {
            if (searchInput) {
                searchInput.value = "";
            }
            if (sortSelect) {
                sortSelect.selectedIndex = 0;
            }
            if (minPriceInput) {
                minPriceInput.value = "";
            }
            if (maxPriceInput) {
                maxPriceInput.value = "";
            }
            if (locationSelect) {
                locationSelect.selectedIndex = 0;
            }
            categoryCheckboxList.forEach(function ResetCategory(checkbox, index) {
                checkbox.checked = index === 0;
            });
            conditionButtonList.forEach(function ResetCondition(button, index) {
                button.classList.remove("bg-secondary-container", "text-on-secondary-container");
                button.classList.add("bg-surface-container", "text-on-surface-variant");
                if (index === 0) {
                    button.classList.remove("bg-surface-container", "text-on-surface-variant");
                    button.classList.add("bg-secondary-container", "text-on-secondary-container");
                }
            });

            state.pageNo = DEFAULT_PAGE_NO;
            state.keyword = "";
            state.category = ResolveSelectedCategory(categoryCheckboxList);
            state.conditionLevel = ResolveConditionText(conditionButtonList[0]);
            state.tradeLocation = "";
            state.minPrice = "";
            state.maxPrice = "";
            state.sortType = ResolveSortType(sortSelect);
            onChange();
        });
    }

    /**
     * 绑定分页
     */
    function BindPagination(state, paginationArea, onChange) {
        if (!paginationArea) {
            return;
        }
        const previousButton = paginationArea.querySelector("button .material-symbols-outlined");
        const nextButton = paginationArea.querySelector("button:last-child");
        const buttonList = paginationArea.querySelectorAll("button");
        const previousPageButton = buttonList[0];
        const nextPageButton = buttonList[buttonList.length - 1];

        if (previousButton && previousPageButton) {
            previousPageButton.addEventListener("click", function HandlePreviousPage() {
                if (state.pageNo <= 1) {
                    return;
                }
                state.pageNo -= 1;
                onChange();
            });
        }
        if (nextButton && nextPageButton) {
            nextPageButton.addEventListener("click", function HandleNextPage() {
                if (state.pageNo >= state.totalPages) {
                    return;
                }
                state.pageNo += 1;
                onChange();
            });
        }
    }

    /**
     * 渲染摘要
     */
    function RenderSummary(state, summaryText) {
        if (!summaryText) {
            return;
        }
        summaryText.textContent = `显示 ${state.totalCount} 个精选校园商品`;
    }

    /**
     * 渲染页码文本
     */
    function RenderPageText(state, pageText) {
        if (!pageText) {
            return;
        }
        pageText.textContent = `第 ${state.pageNo} / ${state.totalPages} 页`;
    }

    /**
     * 构建消息条
     */
    function BuildMessageBar(productGrid) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 mb-4";
        messageBar.style.display = "none";
        productGrid.parentElement.insertBefore(messageBar, productGrid);
        return messageBar;
    }

    /**
     * 构建分页文本
     */
    function BuildPaginationText(paginationArea) {
        if (!paginationArea) {
            return null;
        }
        const pageText = document.createElement("p");
        pageText.className = "text-xs text-slate-500 mt-3 text-center";
        pageText.textContent = "第 1 / 1 页";
        paginationArea.insertAdjacentElement("afterend", pageText);
        return pageText;
    }

    /**
     * 查找排序选择框
     */
    function FindSortSelect() {
        const selectList = Array.from(document.querySelectorAll("main select"));
        return selectList.find(function MatchSortSelect(selectElement) {
            return Array.from(selectElement.options || []).some(function MatchOption(option) {
                return option.textContent && option.textContent.includes("最新发布");
            });
        }) || null;
    }

    /**
     * 查找地点选择框
     */
    function FindLocationSelect() {
        const selectList = Array.from(document.querySelectorAll("aside select"));
        return selectList.find(function MatchLocationSelect(selectElement) {
            return Array.from(selectElement.options || []).some(function MatchOption(option) {
                return option.textContent && option.textContent.includes("北校区图书馆");
            });
        }) || null;
    }

    /**
     * 查找按钮
     */
    function FindButtonByText(buttonText) {
        const buttonList = Array.from(document.querySelectorAll("button"));
        return buttonList.find(function MatchButton(buttonElement) {
            return buttonElement.textContent && buttonElement.textContent.includes(buttonText);
        }) || null;
    }

    /**
     * 是否为默认成色
     */
    function IsConditionSelected(conditionButton) {
        return conditionButton.classList.contains("bg-secondary-container");
    }

    /**
     * 解析成色文本
     */
    function ResolveConditionText(conditionButton) {
        return conditionButton && conditionButton.textContent
            ? conditionButton.textContent.trim()
            : "";
    }

    /**
     * 解析已选分类
     */
    function ResolveSelectedCategory(categoryCheckboxList) {
        const checkedCheckbox = categoryCheckboxList.find(function FindChecked(itemCheckbox) {
            return itemCheckbox.checked;
        });
        if (!checkedCheckbox) {
            return "";
        }
        const labelElement = checkedCheckbox.closest("label");
        if (!labelElement) {
            return "";
        }
        const labelText = labelElement.textContent ? labelElement.textContent.trim() : "";
        return labelText === "电子产品" ? labelText : labelText;
    }

    /**
     * 解析排序类型
     */
    function ResolveSortType(sortSelect) {
        if (!sortSelect || !sortSelect.value) {
            return "NEWEST";
        }
        if (sortSelect.value.includes("由低到高")) {
            return "PRICE_ASC";
        }
        if (sortSelect.value.includes("由高到低")) {
            return "PRICE_DESC";
        }
        return "NEWEST";
    }

    /**
     * 解析成色标签样式
     */
    function ResolveConditionBadgeClass(conditionLevel) {
        const text = (conditionLevel || "").trim();
        if (text.includes("新")) {
            return "bg-secondary-container text-on-secondary-container";
        }
        if (text.includes("使用")) {
            return "bg-surface-container-high text-on-surface-variant";
        }
        return "bg-surface-container-high text-on-surface-variant";
    }

    /**
     * 获取卡片图片
     */
    function ResolveCardImage(productId) {
        const imageList = [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDdRciXYPG_0I3qG9AGP_J4jfenW3c1vBhvcdDnEpWcWo2ywroUVy4IPdY-tZQ_qSCMCDdyR5_Cv9Zg_rf7DKY69DZQABJTXU_BswsJHwSDCqdmhJyVlaTdiveT1m1Yn5dzOmovFYttlydiXYJR2-GDaen-zPsNXZz6HUJYVHqCIC5Buwt4WOM0gLUC7bC55JHRTsdqR-2TzjaDlM9z4fjOvbsxCNZe2kvhMUgt9QKAeDFz3g1C3jox5HJ16_tdg3a5q6jg3Z_SAeA",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBYIkPr2Ah3pV1fsi2LZ4hD9OrqAmPzQSyctjdJuY4CvneFGqvc7cK4ANHHv3meRULg2r_FzuKNYsxUSSCCkLf9yQZXXGQoFHqYkH6_P3qsPCxdi5GHM1TL2cVe4JbdvwenST1mcjTREI8wDz8FMrb1KpKdMAnreU3jnkHIT3Q3uNeTJusl-7M6IZnBeeT9kq_SPH3mIOi5dFmY_1xS_NcuPZGs8L4ikQfyVjCenfBt2ex3uPpyDVhXhbgiZZDxCLnkgzMtHoUdwIs",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1gjCJANPVWwZY31ys1Yffl0_V--fofIOapVFDizZ4Q8EpMTjZcaYSeW9xpc8y9U-VqodxFSzCgqeXpvyLq-EXwJmQKGMSdRlTo9_Ry6JC_qGU56h9E7ZnqOevBSTcJ3EMI7BMWFj9zI_-IonKzdf_3TcbNpgZnMvQNBPXL0hJfE_afsOw_4f9JR4z0oztrwjWbV3KpkhE1M0fLi-J2EixHR5Svj7KJfdOtYma8sGrM7-QeOJ1GCqpOZHhnOdbXezJy2geIoW9eg",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBA4uyVyMmmQfwFuzHBRwK5l6V9901a2RpeqE2U8Z9CEaKGctEYwUgGsUojRHRE15IEUOpB8YlfGIboq7zfV0qfhVJuC1_9fUA9oX-3FVerVtl_FtPxTXn903hVaRZ0Pq2pxFMJ3ZSQDlORmD8qi8eV_RhmZjKQIkrc47D-svhotNXR_ovXjI4-1exfSxfT3cN94FFAoyZhWpcokr26Qi9pzTQ1wM4q7R-Id3CRv0T-DrBFrGPoZmzNd7tjdp2UKHoDRXEiM7BexG4"
        ];
        const numericId = Number(productId || 0);
        const imageIndex = Number.isNaN(numericId) ? 0 : Math.abs(numericId) % imageList.length;
        return imageList[imageIndex];
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
        return `${Math.floor(diffMinutes / (60 * 24))} 天前`;
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
     * 显示错误
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.textContent = message;
    }

    /**
     * 隐藏错误
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindMarketListingPage);
})();
