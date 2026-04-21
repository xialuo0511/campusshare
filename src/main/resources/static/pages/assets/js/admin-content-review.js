/**
 * Admin content review page logic:
 * - pending product review
 * - pending team recruitment review
 * - pending material review
 */
(function InitAdminContentReviewPage() {
    const FILTER_VALUE_LIST = ["ALL", "PRODUCT", "TEAM_RECRUITMENT", "MATERIAL", "HIGH_RISK", "RECENT"];
    const REJECT_TEMPLATE_LIST = [
        { value: "", text: "请选择意见模板" },
        { value: "内容信息不完整，请补充关键信息后重新提交。", text: "信息不完整" },
        { value: "存在潜在风险表述，请删除后重新提交。", text: "风险表述" },
        { value: "描述与分类不匹配，请修正后重新提交。", text: "分类不匹配" },
        { value: "请补充更清晰的说明后重新提交。", text: "说明不清晰" }
    ];
    const RISK_KEYWORD_LIST = ["代装", "预装", "私聊", "vx", "微信", "导流"];
    const DAY_MS = 24 * 60 * 60 * 1000;

    async function BindPage() {
        if (!window.CampusShareApi) {
            return;
        }
        if (!window.CampusShareApi.GetAuthToken()) {
            window.CampusShareApi.RedirectToAuthPage("/pages/admin_content_review.html");
            return;
        }
        const hasAdminAccess = await window.CampusShareApi.EnsureAdminSession();
        if (!hasAdminAccess) {
            window.location.href = "/pages/market_overview.html";
            return;
        }

        const pageMain = document.querySelector("[data-review-page-main]");
        if (!pageMain) {
            return;
        }

        const refs = CollectPageRefs(pageMain);
        if (!refs.queueListNode || !refs.detailHeaderNode || !refs.detailBodyNode) {
            return;
        }

        const messageBar = BuildMessageBar(pageMain);
        const state = {
            taskList: [],
            filteredTaskList: [],
            selectedTaskKey: "",
            filterType: "ALL",
            keyword: "",
            processedCount: 0,
            detailCacheMap: new Map(),
            detailRenderToken: 0
        };

        PrepareRejectTemplateSelect(refs);
        BindFilterControls(refs, state);
        BindSearchControls(refs, state);
        BindQueueClick(refs, state);
        BindActionButtons(refs, state, messageBar);

        await ReloadTaskQueue(refs, state, messageBar);
        ApplyInitialFocusFromQuery(state);
        RenderAll(refs, state);
    }

    function CollectPageRefs(pageMain) {
        return {
            statCardList: Array.from(pageMain.querySelectorAll("[data-review-stat-grid] article")),
            filterButtonList: Array.from(pageMain.querySelectorAll("[data-review-filter-group] button")),
            queueSearchInput: pageMain.querySelector("[data-review-queue-search]"),
            globalSearchInput: pageMain.querySelector("[data-review-global-search]"),
            queueListNode: pageMain.querySelector("[data-review-queue-list]"),
            detailHeaderNode: pageMain.querySelector("[data-review-detail-header]"),
            detailBodyNode: pageMain.querySelector("[data-review-detail-body]"),
            currentStatusNode: pageMain.querySelector("[data-review-current-status]"),
            rejectTemplateSelect: document.getElementById("reject-template"),
            reviewNoteInput: document.getElementById("review-note"),
            prevButton: pageMain.querySelector("[data-review-prev]"),
            nextButton: pageMain.querySelector("[data-review-next]"),
            approveButton: pageMain.querySelector("[data-review-approve]"),
            rejectButton: pageMain.querySelector("[data-review-reject]")
        };
    }

    function PrepareRejectTemplateSelect(refs) {
        if (!refs.rejectTemplateSelect) {
            return;
        }
        refs.rejectTemplateSelect.innerHTML = REJECT_TEMPLATE_LIST.map(function BuildOption(item) {
            return `<option value="${EscapeHtml(item.value)}">${EscapeHtml(item.text)}</option>`;
        }).join("");
        refs.rejectTemplateSelect.addEventListener("change", function HandleTemplateChange() {
            if (!refs.reviewNoteInput) {
                return;
            }
            const nextValue = String(refs.rejectTemplateSelect.value || "");
            if (!nextValue) {
                return;
            }
            const currentValue = String(refs.reviewNoteInput.value || "").trim();
            if (!currentValue || IsTemplateValue(currentValue)) {
                refs.reviewNoteInput.value = nextValue;
            }
        });
        if (window.CampusShareApi.EnhanceSelectElements) {
            window.CampusShareApi.EnhanceSelectElements(refs.rejectTemplateSelect.parentElement || refs.rejectTemplateSelect);
        }
    }

    function IsTemplateValue(text) {
        return REJECT_TEMPLATE_LIST.some(function MatchTemplate(item) {
            return item.value && item.value === text;
        });
    }

    function BindFilterControls(refs, state) {
        refs.filterButtonList.forEach(function BindFilter(buttonNode, index) {
            buttonNode.addEventListener("click", function HandleFilterClick() {
                state.filterType = FILTER_VALUE_LIST[index] || "ALL";
                RenderAll(refs, state);
            });
        });
    }

    function BindSearchControls(refs, state) {
        function BindInput(sourceInput, mirrorInput) {
            if (!sourceInput) {
                return;
            }
            sourceInput.addEventListener("input", function HandleInput() {
                const nextKeyword = String(sourceInput.value || "").trim().toLowerCase();
                state.keyword = nextKeyword;
                if (mirrorInput && mirrorInput.value !== sourceInput.value) {
                    mirrorInput.value = sourceInput.value;
                }
                RenderAll(refs, state);
            });
        }
        BindInput(refs.queueSearchInput, refs.globalSearchInput);
        BindInput(refs.globalSearchInput, refs.queueSearchInput);
    }

    function BindQueueClick(refs, state) {
        if (!refs.queueListNode) {
            return;
        }
        refs.queueListNode.addEventListener("click", function HandleQueueClick(event) {
            const cardNode = event.target.closest("[data-task-key]");
            if (!cardNode) {
                return;
            }
            const taskKey = cardNode.getAttribute("data-task-key");
            if (!taskKey) {
                return;
            }
            state.selectedTaskKey = taskKey;
            RenderAll(refs, state);
        });
    }

    function BindActionButtons(refs, state, messageBar) {
        if (refs.prevButton) {
            refs.prevButton.addEventListener("click", function HandlePrevClick() {
                SwitchSelectionByOffset(state, -1);
                RenderAll(refs, state);
            });
        }
        if (refs.nextButton) {
            refs.nextButton.addEventListener("click", function HandleNextClick() {
                SwitchSelectionByOffset(state, 1);
                RenderAll(refs, state);
            });
        }
        if (refs.approveButton) {
            refs.approveButton.addEventListener("click", function HandleApproveClick() {
                SubmitDecision(refs, state, messageBar, true);
            });
        }
        if (refs.rejectButton) {
            refs.rejectButton.addEventListener("click", function HandleRejectClick() {
                SubmitDecision(refs, state, messageBar, false);
            });
        }
    }

    async function ReloadTaskQueue(refs, state, messageBar) {
        try {
            const resultList = await Promise.all([
                window.CampusShareApi.ListPendingProductsByAdmin(1, 300),
                window.CampusShareApi.ListPendingTeamRecruitmentsByAdmin(1, 300),
                window.CampusShareApi.ListPendingMaterials(1, 300)
            ]);
            const pendingProductList = resultList[0] && Array.isArray(resultList[0].productList)
                ? resultList[0].productList
                : [];
            const pendingRecruitmentList = resultList[1] && Array.isArray(resultList[1].recruitmentList)
                ? resultList[1].recruitmentList
                : [];
            const pendingMaterialList = resultList[2] && Array.isArray(resultList[2].materialList)
                ? resultList[2].materialList
                : [];

            state.taskList = BuildTaskList(pendingProductList, pendingRecruitmentList, pendingMaterialList);
            if (!state.selectedTaskKey && state.taskList.length) {
                state.selectedTaskKey = BuildTaskKey(state.taskList[0]);
            }
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "加载审核任务失败");
            state.taskList = [];
            state.selectedTaskKey = "";
        }
    }

    function BuildTaskList(productList, recruitmentList, materialList) {
        const productTaskList = (Array.isArray(productList) ? productList : []).map(function MapProduct(item) {
            const productId = SafeNumber(item.productId);
            return {
                taskType: "PRODUCT",
                taskId: productId,
                title: item.title || `商品 #${productId}`,
                ownerText: item.sellerDisplayName || `卖家ID ${SafeNumber(item.sellerUserId)}`,
                metaText: `${item.category || "-"} · ${item.conditionLevel || "-"} · ￥${FormatPrice(item.price)}`,
                createTime: item.createTime,
                rawItem: item
            };
        });
        const recruitmentTaskList = (Array.isArray(recruitmentList) ? recruitmentList : []).map(function MapRecruitment(item) {
            const recruitmentId = SafeNumber(item.recruitmentId);
            return {
                taskType: "TEAM_RECRUITMENT",
                taskId: recruitmentId,
                title: item.eventName || `帖子 #${recruitmentId}`,
                ownerText: item.publisherDisplayName || `发布者ID ${SafeNumber(item.publisherUserId)}`,
                metaText: `${item.direction || "-"} · ${SafeNumber(item.currentMemberCount)}/${SafeNumber(item.memberLimit)}`,
                createTime: item.createTime,
                rawItem: item
            };
        });
        const materialTaskList = (Array.isArray(materialList) ? materialList : []).map(function MapMaterial(item) {
            const materialId = SafeNumber(item.materialId);
            const tagText = Array.isArray(item.tags) ? item.tags.join("/") : "";
            return {
                taskType: "MATERIAL",
                taskId: materialId,
                title: item.courseName || `资料 #${materialId}`,
                ownerText: item.uploaderDisplayName || `上传者ID ${SafeNumber(item.uploaderUserId)}`,
                metaText: `${item.fileType || "-"} · ${SafeNumber(item.fileSizeBytes)}B${tagText ? ` · ${tagText}` : ""}`,
                createTime: item.createTime,
                rawItem: item
            };
        });
        return productTaskList.concat(recruitmentTaskList, materialTaskList).sort(function SortByTimeDesc(leftItem, rightItem) {
            return ResolveTimeValue(rightItem.createTime) - ResolveTimeValue(leftItem.createTime);
        });
    }

    function ApplyInitialFocusFromQuery(state) {
        const searchParams = new URLSearchParams(window.location.search);
        const taskType = String(searchParams.get("taskType") || "").toUpperCase();
        const taskId = SafeNumber(searchParams.get("taskId"));
        if (taskType && taskId > 0) {
            const focusedTask = state.taskList.find(function MatchTask(item) {
                return item.taskType === taskType && item.taskId === taskId;
            });
            if (focusedTask) {
                state.selectedTaskKey = BuildTaskKey(focusedTask);
            }
        }
    }

    function RenderAll(refs, state) {
        const filteredTaskList = FilterTaskList(state);
        state.filteredTaskList = filteredTaskList;
        if (!filteredTaskList.length) {
            state.selectedTaskKey = "";
        } else if (!filteredTaskList.some(function HasSelected(item) {
            return BuildTaskKey(item) === state.selectedTaskKey;
        })) {
            state.selectedTaskKey = BuildTaskKey(filteredTaskList[0]);
        }
        RenderFilterButtons(refs, state);
        RenderStats(refs, state, filteredTaskList);
        RenderQueue(refs, state, filteredTaskList);
        RenderDecisionPanel(refs, state, filteredTaskList);
        RenderTaskDetail(refs, state);
    }

    function FilterTaskList(state) {
        return state.taskList.filter(function FilterTask(taskItem) {
            if (state.filterType === "PRODUCT" && taskItem.taskType !== "PRODUCT") return false;
            if (state.filterType === "TEAM_RECRUITMENT" && taskItem.taskType !== "TEAM_RECRUITMENT") return false;
            if (state.filterType === "MATERIAL" && taskItem.taskType !== "MATERIAL") return false;
            if (state.filterType === "HIGH_RISK" && !IsHighRiskTask(taskItem)) return false;
            if (state.filterType === "RECENT" && (Date.now() - ResolveTimeValue(taskItem.createTime)) > DAY_MS) return false;
            if (!state.keyword) return true;
            const searchText = [taskItem.taskType, taskItem.taskId, taskItem.title, taskItem.ownerText, taskItem.metaText]
                .join(" ")
                .toLowerCase();
            return searchText.includes(state.keyword);
        });
    }

    function IsHighRiskTask(taskItem) {
        const fullText = `${taskItem.title || ""} ${taskItem.metaText || ""}`.toLowerCase();
        return RISK_KEYWORD_LIST.some(function MatchKeyword(word) {
            return fullText.includes(word);
        });
    }

    function RenderFilterButtons(refs, state) {
        refs.filterButtonList.forEach(function PatchButton(buttonNode, index) {
            const isActive = (FILTER_VALUE_LIST[index] || "ALL") === state.filterType;
            buttonNode.classList.toggle("bg-primary", isActive);
            buttonNode.classList.toggle("text-white", isActive);
            buttonNode.classList.toggle("bg-surface-low", !isActive);
            buttonNode.classList.toggle("text-slate-600", !isActive);
        });
    }

    function RenderStats(refs, state, filteredTaskList) {
        if (!refs.statCardList || refs.statCardList.length < 4) return;
        const pendingCount = filteredTaskList.length;
        const productCount = state.taskList.filter(item => item.taskType === "PRODUCT").length;
        const recruitmentCount = state.taskList.filter(item => item.taskType === "TEAM_RECRUITMENT").length;
        const materialCount = state.taskList.filter(item => item.taskType === "MATERIAL").length;
        const avgWaitHours = pendingCount
            ? filteredTaskList.reduce((total, item) => total + (Date.now() - ResolveTimeValue(item.createTime)), 0) / pendingCount / 1000 / 60 / 60
            : 0;
        PatchStatCard(refs.statCardList[0], String(pendingCount), `筛选: ${MapFilterText(state.filterType)}`);
        PatchStatCard(refs.statCardList[1], String(state.processedCount), "当前会话累计");
        PatchStatCard(refs.statCardList[2], `${avgWaitHours.toFixed(1)}h`, "按当前队列估算");
        PatchStatCard(refs.statCardList[3], `商品 ${productCount} / 帖子 ${recruitmentCount} / 资料 ${materialCount}`, "全量待审");
    }

    function MapFilterText(filterType) {
        if (filterType === "PRODUCT") return "商品";
        if (filterType === "TEAM_RECRUITMENT") return "帖子";
        if (filterType === "MATERIAL") return "资料";
        if (filterType === "HIGH_RISK") return "高风险";
        if (filterType === "RECENT") return "最新";
        return "全部";
    }

    function PatchStatCard(cardNode, valueText, tipText) {
        if (!cardNode) return;
        const valueNode = cardNode.querySelector("h2");
        const tipNode = cardNode.querySelector("p:last-child");
        if (valueNode) valueNode.textContent = valueText;
        if (tipNode) tipNode.textContent = tipText;
    }

    function RenderQueue(refs, state, filteredTaskList) {
        if (!refs.queueListNode) return;
        if (!filteredTaskList.length) {
            refs.queueListNode.innerHTML = "<div class=\"p-4 rounded-xl bg-surface-low text-sm text-slate-500\">暂无待审核任务</div>";
            return;
        }
        refs.queueListNode.innerHTML = filteredTaskList.map(function BuildTaskCard(taskItem) {
            const taskKey = BuildTaskKey(taskItem);
            const isSelected = state.selectedTaskKey === taskKey;
            const tagClass = taskItem.taskType === "PRODUCT"
                ? "bg-blue-50 text-blue-700"
                : (taskItem.taskType === "MATERIAL" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700");
            const iconName = taskItem.taskType === "PRODUCT" ? "inventory_2" : (taskItem.taskType === "MATERIAL" ? "description" : "forum");
            const typeText = taskItem.taskType === "PRODUCT" ? "商品" : (taskItem.taskType === "MATERIAL" ? "资料" : "帖子");
            return [
                `<button type="button" data-task-key="${EscapeHtml(taskKey)}" class="w-full text-left rounded-xl p-4 border transition-colors ${isSelected ? "border-primary bg-blue-50/50" : "border-outline/20 bg-white hover:border-primary/40"}">`,
                "<div class=\"flex items-start justify-between gap-3\">",
                "<div class=\"flex items-start gap-2\">",
                `<span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-low text-slate-700"><span class="material-symbols-outlined text-base">${iconName}</span></span>`,
                "<div>",
                `<p class="text-sm font-bold text-slate-800 leading-5">${EscapeHtml(taskItem.title)}</p>`,
                `<p class="text-xs text-slate-500 mt-1">${EscapeHtml(taskItem.ownerText)}</p>`,
                `<p class="text-xs text-slate-500">${EscapeHtml(taskItem.metaText)}</p>`,
                "</div>",
                "</div>",
                `<span class="px-2 py-1 rounded-full text-[10px] font-bold ${tagClass}">${typeText}</span>`,
                "</div>",
                `<p class="text-xs text-slate-400 mt-3">提交: ${EscapeHtml(FormatTime(taskItem.createTime))}</p>`,
                "</button>"
            ].join("");
        }).join("");
    }

    function RenderDecisionPanel(refs, state, filteredTaskList) {
        const hasTask = !!GetSelectedTask(state, filteredTaskList);
        [refs.prevButton, refs.nextButton, refs.approveButton, refs.rejectButton].filter(Boolean).forEach(function PatchButton(buttonNode) {
            buttonNode.disabled = !hasTask;
        });
        if (refs.currentStatusNode) {
            refs.currentStatusNode.textContent = hasTask ? "待审核" : "无任务";
        }
    }

    async function RenderTaskDetail(refs, state) {
        const selectedTask = GetSelectedTask(state, state.filteredTaskList);
        if (!selectedTask) {
            refs.detailHeaderNode.innerHTML = "<h2 class=\"text-xl font-bold\">暂无任务</h2><p class=\"text-sm text-slate-500 mt-2\">请调整筛选条件。</p>";
            refs.detailBodyNode.innerHTML = "<article class=\"rounded-xl bg-surface-low p-5 text-sm text-slate-600\">当前没有可展示的审核详情。</article>";
            return;
        }
        const currentRenderToken = ++state.detailRenderToken;
        refs.detailBodyNode.innerHTML = "<article class=\"rounded-xl bg-surface-low p-5 text-sm text-slate-600\">正在加载详情...</article>";
        try {
            const detailResult = await LoadTaskDetail(state, selectedTask);
            if (currentRenderToken !== state.detailRenderToken || state.selectedTaskKey !== BuildTaskKey(selectedTask)) return;
            PatchDetailHeader(refs.detailHeaderNode, selectedTask, detailResult);
            PatchDetailBody(refs.detailBodyNode, selectedTask, detailResult);
        } catch (error) {
            if (currentRenderToken !== state.detailRenderToken) return;
            PatchDetailHeader(refs.detailHeaderNode, selectedTask, null);
            refs.detailBodyNode.innerHTML = `<article class="rounded-xl bg-red-50 text-red-700 p-5 text-sm">加载详情失败：${EscapeHtml(error instanceof Error ? error.message : "未知错误")}</article>`;
        }
    }

    async function LoadTaskDetail(state, taskItem) {
        const cacheKey = BuildTaskKey(taskItem);
        if (state.detailCacheMap.has(cacheKey)) return state.detailCacheMap.get(cacheKey);
        let detailResult = null;
        if (taskItem.taskType === "PRODUCT") detailResult = await window.CampusShareApi.GetProductDetail(taskItem.taskId);
        else if (taskItem.taskType === "MATERIAL") detailResult = await window.CampusShareApi.GetMaterialDetail(taskItem.taskId);
        else detailResult = await window.CampusShareApi.GetTeamRecruitmentDetail(taskItem.taskId);
        state.detailCacheMap.set(cacheKey, detailResult);
        return detailResult;
    }

    function PatchDetailHeader(headerNode, taskItem, detailItem) {
        const typeText = taskItem.taskType === "PRODUCT" ? "商品发布" : (taskItem.taskType === "MATERIAL" ? "资料发布" : "组队帖子");
        const idText = taskItem.taskType === "PRODUCT"
            ? `商品ID: ${taskItem.taskId}`
            : (taskItem.taskType === "MATERIAL" ? `资料ID: ${taskItem.taskId}` : `帖子ID: ${taskItem.taskId}`);
        const createTimeText = FormatTime((detailItem && detailItem.createTime) || taskItem.createTime);
        headerNode.innerHTML = [
            "<div class=\"flex items-start justify-between gap-6\">",
            "<div>",
            `<div class="flex items-center gap-2 mb-2"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">${typeText}</span><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-low text-slate-600">待审核</span></div>`,
            `<h2 class="text-2xl font-bold">${EscapeHtml(taskItem.title)}</h2>`,
            `<p class="text-sm text-slate-500 mt-1">${EscapeHtml(idText)} · 发布者 ${EscapeHtml(taskItem.ownerText || "-")}</p>`,
            "</div>",
            "<div class=\"text-right\">",
            "<p class=\"text-xs uppercase tracking-widest text-slate-500 font-semibold\">提交时间</p>",
            `<p class="text-sm font-semibold mt-1">${EscapeHtml(createTimeText)}</p>`,
            "</div>",
            "</div>"
        ].join("");
    }

    function PatchDetailBody(bodyNode, taskItem, detailItem) {
        if (taskItem.taskType === "PRODUCT") {
            bodyNode.innerHTML = BuildProductDetailHtml(taskItem, detailItem || {});
            return;
        }
        if (taskItem.taskType === "MATERIAL") {
            bodyNode.innerHTML = BuildMaterialDetailHtml(taskItem, detailItem || {});
            return;
        }
        bodyNode.innerHTML = BuildRecruitmentDetailHtml(taskItem, detailItem || {});
    }

    function BuildProductDetailHtml(taskItem, detailItem) {
        const summaryFieldMap = {
            productId: detailItem.productId,
            title: detailItem.title,
            category: detailItem.category,
            conditionLevel: detailItem.conditionLevel,
            price: detailItem.price,
            tradeLocation: detailItem.tradeLocation,
            sellerUserId: detailItem.sellerUserId,
            sellerDisplayName: detailItem.sellerDisplayName,
            productStatus: detailItem.productStatus,
            createTime: detailItem.createTime
        };
        return [
            BuildFieldGridSection("核心字段", summaryFieldMap),
            BuildTextSection("内容描述", detailItem.description || "暂无描述"),
            BuildObjectSection("完整字段（详情接口）", detailItem),
            BuildObjectSection("完整字段（待审快照）", taskItem.rawItem || {})
        ].join("");
    }

    function BuildRecruitmentDetailHtml(taskItem, detailItem) {
        const summaryFieldMap = {
            recruitmentId: detailItem.recruitmentId,
            eventName: detailItem.eventName,
            direction: detailItem.direction,
            skillRequirement: detailItem.skillRequirement,
            memberLimit: detailItem.memberLimit,
            currentMemberCount: detailItem.currentMemberCount,
            recruitmentStatus: detailItem.recruitmentStatus,
            publisherUserId: detailItem.publisherUserId,
            publisherDisplayName: detailItem.publisherDisplayName,
            createTime: detailItem.createTime
        };
        return [
            BuildFieldGridSection("核心字段", summaryFieldMap),
            BuildTextSection("技能要求", detailItem.skillRequirement || "未填写"),
            BuildObjectSection("完整字段（详情接口）", detailItem),
            BuildObjectSection("完整字段（待审快照）", taskItem.rawItem || {})
        ].join("");
    }

    function BuildMaterialDetailHtml(taskItem, detailItem) {
        const summaryFieldMap = {
            materialId: detailItem.materialId,
            courseName: detailItem.courseName,
            uploaderUserId: detailItem.uploaderUserId,
            uploaderDisplayName: detailItem.uploaderDisplayName,
            materialStatus: detailItem.materialStatus,
            fileType: detailItem.fileType,
            fileSizeBytes: detailItem.fileSizeBytes,
            downloadCostPoints: detailItem.downloadCostPoints,
            downloadCount: detailItem.downloadCount,
            createTime: detailItem.createTime
        };
        const tagText = Array.isArray(detailItem.tags) ? detailItem.tags.join(" / ") : "";
        return [
            BuildFieldGridSection("核心字段", summaryFieldMap),
            BuildTextSection("资料简介", detailItem.description || "暂无资料简介"),
            BuildTextSection("标签", tagText || "-"),
            BuildObjectSection("完整字段（详情接口）", detailItem),
            BuildObjectSection("完整字段（待审快照）", taskItem.rawItem || {})
        ].join("");
    }

    function BuildFieldGridSection(title, fieldMap) {
        const safeFieldMap = fieldMap || {};
        const rowHtml = Object.keys(safeFieldMap).map(function BuildRow(key) {
            return [
                "<div class=\"py-2 border-b border-outline/20 grid grid-cols-[180px_1fr] gap-3 text-sm\">",
                `<dt class="text-slate-500 break-all">${EscapeHtml(key)}</dt>`,
                `<dd class="font-semibold text-slate-800 break-all">${EscapeHtml(FormatValue(safeFieldMap[key]))}</dd>`,
                "</div>"
            ].join("");
        }).join("");
        return [
            "<article class=\"rounded-xl bg-surface-low p-5 ring-1 ring-outline/20\">",
            `<h3 class="text-sm font-bold mb-3">${EscapeHtml(title)}</h3>`,
            "<dl>",
            rowHtml || "<div class=\"text-sm text-slate-500\">无数据</div>",
            "</dl>",
            "</article>"
        ].join("");
    }

    function BuildTextSection(title, textValue) {
        return [
            "<article class=\"rounded-xl bg-surface-low p-5 ring-1 ring-outline/20\">",
            `<h3 class="text-sm font-bold mb-3">${EscapeHtml(title)}</h3>`,
            `<p class="text-sm text-slate-700 leading-7 whitespace-pre-wrap">${EscapeHtml(textValue || "-")}</p>`,
            "</article>"
        ].join("");
    }

    function BuildObjectSection(title, objectValue) {
        const normalizedObject = objectValue && typeof objectValue === "object" ? objectValue : {};
        const keyList = Object.keys(normalizedObject).sort();
        const keyValueRows = keyList.map(function BuildRow(key) {
            return [
                "<div class=\"py-2 border-b border-outline/20 grid grid-cols-[180px_1fr] gap-3 text-sm\">",
                `<div class="text-slate-500 break-all">${EscapeHtml(key)}</div>`,
                `<div class="font-semibold text-slate-800 break-all">${EscapeHtml(FormatValue(normalizedObject[key]))}</div>`,
                "</div>"
            ].join("");
        }).join("");
        const jsonText = JSON.stringify(normalizedObject, null, 2);
        return [
            "<article class=\"rounded-xl bg-surface-low p-5 ring-1 ring-outline/20\">",
            `<h3 class="text-sm font-bold mb-3">${EscapeHtml(title)}</h3>`,
            "<div class=\"mb-4\">",
            keyValueRows || "<div class=\"text-sm text-slate-500\">无字段</div>",
            "</div>",
            "<details class=\"rounded-lg bg-white ring-1 ring-outline/20 p-3\">",
            "<summary class=\"cursor-pointer text-sm font-semibold text-slate-700\">查看完整 JSON</summary>",
            `<pre class="mt-3 text-xs text-slate-700 whitespace-pre-wrap break-all">${EscapeHtml(jsonText || "{}")}</pre>`,
            "</details>",
            "</article>"
        ].join("");
    }

    async function SubmitDecision(refs, state, messageBar, approved) {
        const selectedTask = GetSelectedTask(state, state.filteredTaskList);
        if (!selectedTask) {
            ShowError(messageBar, "请先选择审核任务");
            return;
        }
        const reviewRemark = String(refs.reviewNoteInput ? refs.reviewNoteInput.value || "" : "").trim();
        if (!approved && !reviewRemark) {
            ShowError(messageBar, "驳回时请填写审核意见");
            return;
        }
        if (!window.confirm(approved ? "确认通过该任务？" : "确认驳回该任务？")) {
            return;
        }
        ToggleActionDisabled(refs, true);
        try {
            if (selectedTask.taskType === "PRODUCT") {
                await window.CampusShareApi.ReviewProductByAdmin(selectedTask.taskId, approved, reviewRemark || (approved ? "内容审核通过" : "内容审核驳回"));
            } else if (selectedTask.taskType === "MATERIAL") {
                await window.CampusShareApi.ReviewMaterial(selectedTask.taskId, approved, reviewRemark || (approved ? "内容审核通过" : "内容审核驳回"));
            } else {
                await window.CampusShareApi.ReviewTeamRecruitmentByAdmin(selectedTask.taskId, approved, reviewRemark || (approved ? "内容审核通过" : "内容审核驳回"));
            }
            state.processedCount += 1;
            RemoveTaskAndSelectNext(state, selectedTask);
            if (refs.reviewNoteInput) refs.reviewNoteInput.value = "";
            if (refs.rejectTemplateSelect) refs.rejectTemplateSelect.value = "";
            ShowSuccess(messageBar, approved ? "审核已通过" : "审核已驳回");
            RenderAll(refs, state);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "审核操作失败");
        } finally {
            ToggleActionDisabled(refs, false);
        }
    }

    function RemoveTaskAndSelectNext(state, selectedTask) {
        const selectedKey = BuildTaskKey(selectedTask);
        const currentFilteredList = FilterTaskList(state);
        const selectedIndex = currentFilteredList.findIndex(item => BuildTaskKey(item) === selectedKey);
        state.taskList = state.taskList.filter(item => BuildTaskKey(item) !== selectedKey);
        state.detailCacheMap.delete(selectedKey);
        const nextFilteredList = FilterTaskList(state);
        if (!nextFilteredList.length) {
            state.selectedTaskKey = "";
            return;
        }
        const fallbackIndex = selectedIndex < 0 ? 0 : Math.min(selectedIndex, nextFilteredList.length - 1);
        state.selectedTaskKey = BuildTaskKey(nextFilteredList[fallbackIndex]);
    }

    function SwitchSelectionByOffset(state, offset) {
        const list = state.filteredTaskList;
        if (!Array.isArray(list) || !list.length || !state.selectedTaskKey) return;
        const currentIndex = list.findIndex(item => BuildTaskKey(item) === state.selectedTaskKey);
        if (currentIndex < 0) return;
        const targetIndex = currentIndex + offset;
        if (targetIndex < 0 || targetIndex >= list.length) return;
        state.selectedTaskKey = BuildTaskKey(list[targetIndex]);
    }

    function GetSelectedTask(state, taskList) {
        const safeList = Array.isArray(taskList) ? taskList : [];
        if (!state.selectedTaskKey) return null;
        return safeList.find(item => BuildTaskKey(item) === state.selectedTaskKey) || null;
    }

    function BuildTaskKey(taskItem) {
        return `${taskItem.taskType}:${taskItem.taskId}`;
    }

    function ToggleActionDisabled(refs, disabled) {
        [refs.prevButton, refs.nextButton, refs.approveButton, refs.rejectButton]
            .filter(Boolean)
            .forEach(buttonNode => { buttonNode.disabled = !!disabled; });
    }

    function FormatValue(value) {
        if (value == null) return "-";
        if (Array.isArray(value)) return value.length ? value.map(item => (typeof item === "object" ? JSON.stringify(item) : String(item))).join(", ") : "[]";
        if (typeof value === "object") return JSON.stringify(value);
        if (value === "") return "(空)";
        return String(value);
    }

    function FormatPrice(value) {
        const numberValue = Number(value);
        return Number.isNaN(numberValue) ? "0.00" : numberValue.toFixed(2);
    }

    function ResolveTimeValue(timeText) {
        const dateValue = new Date(timeText || "");
        return Number.isNaN(dateValue.getTime()) ? 0 : dateValue.getTime();
    }

    function FormatTime(timeText) {
        if (!timeText) return "-";
        const dateValue = new Date(timeText);
        if (Number.isNaN(dateValue.getTime())) return String(timeText);
        return `${dateValue.getFullYear()}-${PadTime(dateValue.getMonth() + 1)}-${PadTime(dateValue.getDate())} ${PadTime(dateValue.getHours())}:${PadTime(dateValue.getMinutes())}`;
    }

    function PadTime(value) {
        return value < 10 ? `0${value}` : `${value}`;
    }

    function SafeNumber(value) {
        const numberValue = Number(value);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }

    function BuildMessageBar(pageMain) {
        const messageBar = document.createElement("div");
        messageBar.className = "hidden mx-8 mt-4 px-4 py-3 rounded-xl text-sm font-semibold";
        const anchorNode = pageMain.children.length > 1 ? pageMain.children[1] : null;
        pageMain.insertBefore(messageBar, anchorNode);
        return messageBar;
    }

    function ShowSuccess(messageBar, messageText) {
        ShowMessage(messageBar, messageText, "success");
    }

    function ShowError(messageBar, messageText) {
        ShowMessage(messageBar, messageText, "error");
    }

    function ShowMessage(messageBar, messageText, messageType) {
        if (!messageBar) return;
        messageBar.classList.remove("hidden", "bg-red-50", "text-red-700", "bg-green-50", "text-green-700");
        if (messageType === "error") messageBar.classList.add("bg-red-50", "text-red-700");
        else messageBar.classList.add("bg-green-50", "text-green-700");
        messageBar.textContent = messageText || "";
    }

    function HideMessage(messageBar) {
        if (!messageBar) return;
        messageBar.classList.add("hidden");
        messageBar.textContent = "";
    }

    function EscapeHtml(text) {
        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    document.addEventListener("DOMContentLoaded", function HandlePageReady() {
        BindPage().catch(function HandleInitError(error) {
            window.console.error(error);
        });
    });
})();
