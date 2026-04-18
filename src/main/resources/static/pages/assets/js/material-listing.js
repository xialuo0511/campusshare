/**
 * 学术资源列表页面逻辑
 */
(function InitMaterialListingPage() {
    const DEFAULT_PAGE_NO = 1;
    const DEFAULT_PAGE_SIZE = 12;

    /**
     * 页面绑定
     */
    function BindMaterialListingPage() {
        if (!window.CampusShareApi) {
            return;
        }
        const materialGrid = document.querySelector("[data-role='material-grid']");
        const summaryText = document.querySelector("[data-role='summary-text']");
        const keywordInput = document.querySelector("[data-role='keyword-input']");
        const tagSelect = document.querySelector("[data-role='tag-select']");
        const resetFilterButton = document.querySelector("[data-role='reset-filter']");
        const pager = document.querySelector("[data-role='pager']");
        const pagerText = document.querySelector("[data-role='pager-text']");
        if (!materialGrid || !summaryText || !keywordInput || !tagSelect || !resetFilterButton || !pager || !pagerText) {
            return;
        }

        const messageBar = BuildMessageBar(materialGrid);
        const state = {
            pageNo: DEFAULT_PAGE_NO,
            pageSize: DEFAULT_PAGE_SIZE,
            totalCount: 0,
            totalPages: 1,
            keyword: "",
            tagKeyword: ""
        };

        keywordInput.addEventListener("keydown", function HandleSearch(event) {
            if (event.key !== "Enter") {
                return;
            }
            state.keyword = keywordInput.value ? keywordInput.value.trim() : "";
            state.pageNo = DEFAULT_PAGE_NO;
            LoadMaterialList(state, materialGrid, summaryText, pagerText, messageBar, tagSelect);
        });

        tagSelect.addEventListener("change", function HandleTagFilter() {
            state.tagKeyword = tagSelect.value ? tagSelect.value.trim() : "";
            state.pageNo = DEFAULT_PAGE_NO;
            LoadMaterialList(state, materialGrid, summaryText, pagerText, messageBar, tagSelect);
        });

        resetFilterButton.addEventListener("click", function HandleReset() {
            keywordInput.value = "";
            tagSelect.selectedIndex = 0;
            state.keyword = "";
            state.tagKeyword = "";
            state.pageNo = DEFAULT_PAGE_NO;
            LoadMaterialList(state, materialGrid, summaryText, pagerText, messageBar, tagSelect);
        });

        pager.addEventListener("click", function HandlePagerClick(event) {
            const pageButton = event.target.closest("button[data-page-action]");
            if (!pageButton) {
                return;
            }
            const pageAction = pageButton.getAttribute("data-page-action");
            let nextPageNo = state.pageNo;
            if (pageAction === "prev") {
                nextPageNo = Math.max(1, state.pageNo - 1);
            } else if (pageAction === "next") {
                nextPageNo = Math.min(state.totalPages, state.pageNo + 1);
            }
            if (nextPageNo === state.pageNo) {
                return;
            }
            state.pageNo = nextPageNo;
            LoadMaterialList(state, materialGrid, summaryText, pagerText, messageBar, tagSelect);
        });

        materialGrid.addEventListener("click", async function HandleMaterialAction(event) {
            const actionButton = event.target.closest("button[data-action]");
            if (!actionButton) {
                return;
            }
            const action = actionButton.getAttribute("data-action");
            const materialId = Number(actionButton.getAttribute("data-material-id") || 0);
            if (!materialId) {
                return;
            }
            if (action === "detail") {
                try {
                    const detailResult = await window.CampusShareApi.GetMaterialDetail(materialId);
                    window.alert(detailResult.description || "暂无资料说明");
                } catch (error) {
                    ShowError(messageBar, error instanceof Error ? error.message : "资料详情加载失败");
                }
                return;
            }
            if (action === "download") {
                if (!window.CampusShareApi.GetAuthToken()) {
                    ShowError(messageBar, "请先登录后再下载资料");
                    if (window.CampusShareApi.RedirectToAuthPage) {
                        window.CampusShareApi.RedirectToAuthPage("/pages/material_listing.html");
                    }
                    return;
                }
                actionButton.disabled = true;
                try {
                    await window.CampusShareApi.DownloadMaterial(materialId);
                    ShowSuccess(messageBar, "下载请求已提交，请在浏览器下载列表查看");
                    LoadMaterialList(state, materialGrid, summaryText, pagerText, messageBar, tagSelect);
                } catch (error) {
                    ShowError(messageBar, error instanceof Error ? error.message : "资料下载失败");
                } finally {
                    actionButton.disabled = false;
                }
            }
        });

        LoadMaterialList(state, materialGrid, summaryText, pagerText, messageBar, tagSelect);
    }

    /**
     * 拉取资料列表
     */
    async function LoadMaterialList(state, materialGrid, summaryText, pagerText, messageBar, tagSelect) {
        try {
            const listResult = await window.CampusShareApi.ListPublishedMaterials({
                pageNo: state.pageNo,
                pageSize: state.pageSize,
                keyword: state.keyword,
                tagKeyword: state.tagKeyword
            });
            const materialList = listResult && Array.isArray(listResult.materialList)
                ? listResult.materialList
                : [];
            state.totalCount = Number(listResult && listResult.totalCount ? listResult.totalCount : 0);
            state.totalPages = Math.max(1, Math.ceil(state.totalCount / state.pageSize));
            if (state.pageNo > state.totalPages) {
                state.pageNo = state.totalPages;
                await LoadMaterialList(state, materialGrid, summaryText, pagerText, messageBar, tagSelect);
                return;
            }

            RenderMaterialGrid(materialGrid, materialList);
            RenderSummary(summaryText, state.totalCount);
            RenderPagerText(pagerText, state.pageNo, state.totalPages);
            UpdatePagerButtonState(state.pageNo, state.totalPages);
            SyncTagOptions(tagSelect, materialList, state.tagKeyword);
            HideMessage(messageBar);
        } catch (error) {
            RenderMaterialGrid(materialGrid, []);
            ShowError(messageBar, error instanceof Error ? error.message : "学术资源加载失败");
        }
    }

    /**
     * 渲染列表
     */
    function RenderMaterialGrid(materialGrid, materialList) {
        if (!Array.isArray(materialList) || materialList.length === 0) {
            materialGrid.innerHTML = "<div class=\"col-span-full py-16 text-center text-sm text-slate-400\">暂无符合条件的学术资源</div>";
            return;
        }
        materialGrid.innerHTML = materialList.map(function BuildMaterialCard(materialItem) {
            const tagList = Array.isArray(materialItem.tags) ? materialItem.tags : [];
            const tagHtml = tagList.length
                ? tagList.slice(0, 4).map(function BuildTag(tagText) {
                    return `<span class="px-2 py-1 rounded-full bg-surface-container text-[10px] text-on-surface-variant">${EscapeHtml(tagText)}</span>`;
                }).join("")
                : "<span class=\"px-2 py-1 rounded-full bg-surface-container text-[10px] text-on-surface-variant\">无标签</span>";
            return [
                "<article class=\"bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 flex flex-col gap-4\">",
                `<h3 class="text-base font-bold text-on-surface line-clamp-2">${EscapeHtml(materialItem.courseName || "未命名资料")}</h3>`,
                `<p class="text-sm text-on-surface-variant line-clamp-3 min-h-[60px]">${EscapeHtml(materialItem.description || "暂无资料说明")}</p>`,
                `<div class="flex flex-wrap gap-2">${tagHtml}</div>`,
                "<div class=\"text-xs text-slate-500 space-y-1\">",
                `<p>格式：${EscapeHtml(materialItem.fileType || "-")} · 大小：${EscapeHtml(FormatFileSize(materialItem.fileSizeBytes))}</p>`,
                `<p>下载：${EscapeHtml(String(Number(materialItem.downloadCount || 0)))} 次 · 积分：${EscapeHtml(String(Number(materialItem.downloadCostPoints || 0)))} 分</p>`,
                "</div>",
                "<div class=\"pt-2 flex items-center gap-2\">",
                `<button type="button" data-action="detail" data-material-id="${EscapeHtml(String(materialItem.materialId || 0))}" class="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high">查看详情</button>`,
                `<button type="button" data-action="download" data-material-id="${EscapeHtml(String(materialItem.materialId || 0))}" class="px-3 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container">下载资料</button>`,
                "</div>",
                "</article>"
            ].join("");
        }).join("");
    }

    /**
     * 同步标签筛选项
     */
    function SyncTagOptions(tagSelect, materialList, selectedTag) {
        const currentOptionList = Array.from(tagSelect.options || []).map(function MapOption(optionElement) {
            return optionElement.value;
        });
        const tagSet = new Set();
        materialList.forEach(function CollectTag(materialItem) {
            const tagList = Array.isArray(materialItem.tags) ? materialItem.tags : [];
            tagList.forEach(function AddTag(tagText) {
                const safeTag = String(tagText || "").trim();
                if (safeTag) {
                    tagSet.add(safeTag);
                }
            });
        });
        const tagList = Array.from(tagSet.values()).sort();
        const nextOptionList = [""].concat(tagList);
        if (JSON.stringify(currentOptionList) === JSON.stringify(nextOptionList)) {
            tagSelect.value = selectedTag || "";
            return;
        }
        tagSelect.innerHTML = "<option value=\"\">全部标签</option>";
        tagList.forEach(function AppendTagOption(tagText) {
            const optionElement = document.createElement("option");
            optionElement.value = tagText;
            optionElement.textContent = tagText;
            tagSelect.appendChild(optionElement);
        });
        tagSelect.value = selectedTag || "";
    }

    /**
     * 更新分页按钮状态
     */
    function UpdatePagerButtonState(pageNo, totalPages) {
        const prevButton = document.querySelector("button[data-page-action='prev']");
        const nextButton = document.querySelector("button[data-page-action='next']");
        if (prevButton) {
            prevButton.disabled = pageNo <= 1;
            prevButton.classList.toggle("opacity-40", pageNo <= 1);
            prevButton.classList.toggle("cursor-not-allowed", pageNo <= 1);
        }
        if (nextButton) {
            nextButton.disabled = pageNo >= totalPages;
            nextButton.classList.toggle("opacity-40", pageNo >= totalPages);
            nextButton.classList.toggle("cursor-not-allowed", pageNo >= totalPages);
        }
    }

    /**
     * 渲染摘要
     */
    function RenderSummary(summaryText, totalCount) {
        summaryText.textContent = `显示 ${Number(totalCount || 0)} 份公开资料`;
    }

    /**
     * 渲染页码文案
     */
    function RenderPagerText(pagerText, pageNo, totalPages) {
        pagerText.textContent = `第 ${pageNo} / ${totalPages} 页`;
    }

    /**
     * 构建消息条
     */
    function BuildMessageBar(materialGrid) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm border mb-4";
        messageBar.style.display = "none";
        materialGrid.parentElement.insertBefore(messageBar, materialGrid);
        return messageBar;
    }

    /**
     * 格式化文件大小
     */
    function FormatFileSize(fileSizeBytes) {
        const sizeNumber = Number(fileSizeBytes || 0);
        if (Number.isNaN(sizeNumber) || sizeNumber <= 0) {
            return "-";
        }
        if (sizeNumber < 1024) {
            return `${sizeNumber} B`;
        }
        if (sizeNumber < 1024 * 1024) {
            return `${(sizeNumber / 1024).toFixed(1)} KB`;
        }
        return `${(sizeNumber / (1024 * 1024)).toFixed(1)} MB`;
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
     * 错误提示
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm border border-red-200 bg-red-50 text-red-700 mb-4";
        messageBar.textContent = message;
    }

    /**
     * 成功提示
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm border border-green-200 bg-green-50 text-green-700 mb-4";
        messageBar.textContent = message;
    }

    /**
     * 隐藏提示
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindMaterialListingPage);
})();
