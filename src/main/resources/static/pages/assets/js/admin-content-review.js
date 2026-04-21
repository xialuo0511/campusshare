/**
 * 内容审核工作台页面逻辑（商品审核 + 帖子审核）
 */
(function InitAdminContentReviewPage() {
    const FILTER_VALUE_LIST = ["ALL", "PRODUCT", "TEAM_RECRUITMENT", "HIGH_RISK", "RECENT"];
    const DECISION_OPTION_LIST = [
        { value: "", text: "请选择审核结论" },
        { value: "APPROVE", text: "通过并发布" },
        { value: "REJECT", text: "驳回并退回修改" }
    ];
    const REJECT_TEMPLATE_LIST = [
        { value: "", text: "请选择意见模板" },
        { value: "内容信息不完整，请补充关键信息后重新提交。", text: "信息不完整" },
        { value: "存在潜在风险表述，请删除后重新提交。", text: "风险表述" },
        { value: "描述与分类不匹配，请修正后重新提交。", text: "分类不匹配" },
        { value: "请补充更清晰的说明后重新提交。", text: "说明不清晰" }
    ];

    async function BindPage() {
        if (!window.CampusShareApi) {
            return;
        }
        const hasToken = !!window.CampusShareApi.GetAuthToken();
        if (!hasToken) {
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

        const pageRefs = CollectPageRefs(pageMain);
        if (!pageRefs.queueListNode || !pageRefs.detailHeaderNode || !pageRefs.detailBodyNode) {
            return;
        }

        const messageBar = BuildMessageBar(pageMain);
        const reviewState = {
            taskList: [],
            filteredTaskList: [],
            selectedTaskKey: "",
            filterType: "ALL",
            keyword: "",
            processedCount: 0,
            detailCacheMap: new Map()
        };

        PrepareDecisionControls(pageRefs);
        BindFilterControls(pageRefs, reviewState);
        BindKeywordControls(pageRefs, reviewState);
        BindQueueSelection(pageRefs, reviewState);
        BindActionButtons(pageRefs, reviewState, messageBar);

        await ReloadTaskQueue(pageRefs, reviewState, messageBar);
        ApplyInitialFocusFromQuery(pageRefs, reviewState);
        RenderAll(pageRefs, reviewState);
    }

    function CollectPageRefs(pageMain) {
        const filterButtonList = Array.from(
            pageMain.querySelectorAll("[data-review-filter-group] button")
        );
        return {
            statCardList: Array.from(pageMain.querySelectorAll("[data-review-stat-grid] article")),
            filterButtonList,
            queueSearchInput: pageMain.querySelector("[data-review-queue-search]"),
            globalSearchInput: pageMain.querySelector("[data-review-global-search]"),
            queueListNode: pageMain.querySelector("[data-review-queue-list]"),
            detailHeaderNode: pageMain.querySelector("[data-review-detail-header]"),
            detailBodyNode: pageMain.querySelector("[data-review-detail-body]"),
            currentStatusNode: pageMain.querySelector("[data-review-current-status]"),
            decisionSelect: document.getElementById("review-decision"),
            rejectTemplateSelect: document.getElementById("reject-template"),
            reviewNoteInput: document.getElementById("review-note"),
            prevButton: pageMain.querySelector("[data-review-prev]"),
            nextButton: pageMain.querySelector("[data-review-next]"),
            approveButton: pageMain.querySelector("[data-review-approve]"),
            rejectButton: pageMain.querySelector("[data-review-reject]")
        };
    }

    function PrepareDecisionControls(pageRefs) {
        if (pageRefs.decisionSelect) {
            pageRefs.decisionSelect.innerHTML = DECISION_OPTION_LIST.map(function BuildOption(optionItem) {
                return `<option value="${EscapeHtml(optionItem.value)}">${EscapeHtml(optionItem.text)}</option>`;
            }).join("");
            if (window.CampusShareApi.EnhanceSelectElements) {
                window.CampusShareApi.EnhanceSelectElements(pageRefs.decisionSelect.parentElement || pageRefs.decisionSelect);
            }
        }
        if (pageRefs.rejectTemplateSelect) {
            pageRefs.rejectTemplateSelect.innerHTML = REJECT_TEMPLATE_LIST.map(function BuildOption(optionItem) {
                return `<option value="${EscapeHtml(optionItem.value)}">${EscapeHtml(optionItem.text)}</option>`;
            }).join("");
            pageRefs.rejectTemplateSelect.addEventListener("change", function HandleTemplateChange() {
                if (!pageRefs.reviewNoteInput) {
                    return;
                }
                const templateText = pageRefs.rejectTemplateSelect.value || "";
                if (!templateText) {
                    return;
                }
                const currentText = String(pageRefs.reviewNoteInput.value || "").trim();
                if (!currentText || REJECT_TEMPLATE_LIST.some(function MatchTemplate(item) {
                    return item.value && item.value === currentText;
                })) {
                    pageRefs.reviewNoteInput.value = templateText;
                }
            });
            if (window.CampusShareApi.EnhanceSelectElements) {
                window.CampusShareApi.EnhanceSelectElements(pageRefs.rejectTemplateSelect.parentElement || pageRefs.rejectTemplateSelect);
            }
        }
    }

    function BindFilterControls(pageRefs, reviewState) {
        pageRefs.filterButtonList.forEach(function BindFilterButton(buttonNode, index) {
            buttonNode.addEventListener("click", function HandleFilterClick() {
                reviewState.filterType = FILTER_VALUE_LIST[index] || "ALL";
                RenderAll(pageRefs, reviewState);
            });
        });
    }

    function BindKeywordControls(pageRefs, reviewState) {
        function HandleKeywordInput(sourceInput, syncInput) {
            if (!sourceInput) {
                return;
            }
            sourceInput.addEventListener("input", function HandleInput() {
                reviewState.keyword = String(sourceInput.value || "").trim().toLowerCase();
                if (syncInput && syncInput.value !== sourceInput.value) {
                    syncInput.value = sourceInput.value;
                }
                RenderAll(pageRefs, reviewState);
            });
        }
        HandleKeywordInput(pageRefs.queueSearchInput, pageRefs.globalSearchInput);
        HandleKeywordInput(pageRefs.globalSearchInput, pageRefs.queueSearchInput);
    }

    function BindQueueSelection(pageRefs, reviewState) {
        if (!pageRefs.queueListNode) {
            return;
        }
        pageRefs.queueListNode.addEventListener("click", function HandleQueueClick(event) {
            const cardNode = event.target.closest("[data-task-key]");
            if (!cardNode) {
                return;
            }
            const taskKey = cardNode.getAttribute("data-task-key");
            if (!taskKey) {
                return;
            }
            reviewState.selectedTaskKey = taskKey;
            RenderAll(pageRefs, reviewState);
        });
    }

    function BindActionButtons(pageRefs, reviewState, messageBar) {
        if (pageRefs.prevButton) {
            pageRefs.prevButton.addEventListener("click", function HandlePrevClick() {
                SwitchSelectionByOffset(reviewState, -1);
                RenderAll(pageRefs, reviewState);
            });
        }
        if (pageRefs.nextButton) {
            pageRefs.nextButton.addEventListener("click", function HandleNextClick() {
                SwitchSelectionByOffset(reviewState, 1);
                RenderAll(pageRefs, reviewState);
            });
        }
        if (pageRefs.approveButton) {
            pageRefs.approveButton.addEventListener("click", function HandleApproveClick() {
                SubmitDecision(pageRefs, reviewState, messageBar, true);
            });
        }
        if (pageRefs.rejectButton) {
            pageRefs.rejectButton.addEventListener("click", function HandleRejectClick() {
                SubmitDecision(pageRefs, reviewState, messageBar, false);
            });
        }
    }

    async function ReloadTaskQueue(pageRefs, reviewState, messageBar) {
        try {
            const resultList = await Promise.all([
                window.CampusShareApi.ListPendingProductsByAdmin(1, 200),
                window.CampusShareApi.ListPendingTeamRecruitmentsByAdmin(1, 200)
            ]);
            const pendingProductList = resultList[0] && Array.isArray(resultList[0].productList)
                ? resultList[0].productList
                : [];
            const pendingRecruitmentList = resultList[1] && Array.isArray(resultList[1].recruitmentList)
                ? resultList[1].recruitmentList
                : [];

            reviewState.taskList = BuildTaskList(pendingProductList, pendingRecruitmentList);
            if (!reviewState.selectedTaskKey) {
                reviewState.selectedTaskKey = reviewState.taskList.length
                    ? BuildTaskKey(reviewState.taskList[0])
                    : "";
            }
            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "加载审核任务失败");
            reviewState.taskList = [];
            reviewState.selectedTaskKey = "";
        }
    }

    function BuildTaskList(pendingProductList, pendingRecruitmentList) {
        const productTaskList = pendingProductList.map(function MapProduct(item) {
            return {
                taskType: "PRODUCT",
                taskId: SafeNumber(item.productId),
                title: item.title || `商品 #${SafeNumber(item.productId)}`,
                ownerText: item.sellerDisplayName || `卖家ID ${SafeNumber(item.sellerUserId)}`,
                metaText: `${item.category || "-"} · ${item.conditionLevel || "-"} · ￥${FormatPrice(item.price)}`,
                createTime: item.createTime,
                rawItem: item
            };
        });
        const recruitmentTaskList = pendingRecruitmentList.map(function MapRecruitment(item) {
            return {
                taskType: "TEAM_RECRUITMENT",
                taskId: SafeNumber(item.recruitmentId),
                title: item.eventName || `招募 #${SafeNumber(item.recruitmentId)}`,
                ownerText: item.publisherDisplayName || `发布者ID ${SafeNumber(item.publisherUserId)}`,
                metaText: `${item.direction || "-"} · ${SafeNumber(item.currentMemberCount)}/${SafeNumber(item.memberLimit)}`,
                createTime: item.createTime,
                rawItem: item
            };
        });
        return productTaskList.concat(recruitmentTaskList).sort(function SortTask(leftItem, rightItem) {
            return ResolveTimeValue(rightItem.createTime) - ResolveTimeValue(leftItem.createTime);
        });
    }

    function ApplyInitialFocusFromQuery(pageRefs, reviewState) {
        const searchParams = new URLSearchParams(window.location.search);
        let taskType = String(searchParams.get("taskType") || "").toUpperCase();
        let taskId = SafeNumber(searchParams.get("taskId"));

        if (!taskType) {
            const focusRecruitmentId = SafeNumber(searchParams.get("focusRecruitmentId"));
            if (focusRecruitmentId > 0) {
                taskType = "TEAM_RECRUITMENT";
                taskId = focusRecruitmentId;
            }
        }
        if (!taskType && SafeNumber(searchParams.get("productId")) > 0) {
            taskType = "PRODUCT";
            taskId = SafeNumber(searchParams.get("productId"));
        }

        if (taskType && taskId > 0) {
            const targetTask = reviewState.taskList.find(function MatchTask(item) {
                return item.taskType === taskType && item.taskId === taskId;
            });
            if (targetTask) {
                reviewState.selectedTaskKey = BuildTaskKey(targetTask);
            }
        }

        const intendedDecision = String(searchParams.get("intendedDecision") || "").toUpperCase();
        if (pageRefs.decisionSelect && (intendedDecision === "APPROVE" || intendedDecision === "REJECT")) {
            pageRefs.decisionSelect.value = intendedDecision;
        }
    }

    function RenderAll(pageRefs, reviewState) {
        const filteredTaskList = FilterTaskList(reviewState);
        reviewState.filteredTaskList = filteredTaskList;

        if (!filteredTaskList.length) {
            reviewState.selectedTaskKey = "";
        } else if (!filteredTaskList.some(function HasSelected(item) {
            return BuildTaskKey(item) === reviewState.selectedTaskKey;
        })) {
            reviewState.selectedTaskKey = BuildTaskKey(filteredTaskList[0]);
        }

        RenderFilterButtons(pageRefs, reviewState);
        RenderStats(pageRefs, reviewState, filteredTaskList);
        RenderQueue(pageRefs, reviewState, filteredTaskList);
        RenderDecisionPanel(pageRefs, reviewState, filteredTaskList);
        RenderTaskDetail(pageRefs, reviewState);
    }

    function FilterTaskList(reviewState) {
        return reviewState.taskList.filter(function FilterTask(item) {
            if (reviewState.filterType === "PRODUCT" && item.taskType !== "PRODUCT") {
                return false;
            }
            if (reviewState.filterType === "TEAM_RECRUITMENT" && item.taskType !== "TEAM_RECRUITMENT") {
                return false;
            }
            if (reviewState.filterType === "HIGH_RISK" && !IsHighRiskTask(item)) {
                return false;
            }
            if (reviewState.filterType === "RECENT") {
                const dayValue = 24 * 60 * 60 * 1000;
                if ((Date.now() - ResolveTimeValue(item.createTime)) > dayValue) {
                    return false;
                }
            }
            if (!reviewState.keyword) {
                return true;
            }
            const searchText = [
                item.taskType,
                item.taskId,
                item.title,
                item.ownerText,
                item.metaText
            ].join(" ").toLowerCase();
            return searchText.includes(reviewState.keyword);
        });
    }

    function IsHighRiskTask(taskItem) {
        const contentText = `${taskItem.title || ""} ${taskItem.metaText || ""}`.toLowerCase();
        return ["代装", "预装", "vx", "微信", "私聊", "导流"].some(function MatchWord(word) {
            return contentText.includes(word);
        });
    }

    function RenderFilterButtons(pageRefs, reviewState) {
        pageRefs.filterButtonList.forEach(function RenderButton(buttonNode, index) {
            const isActive = (FILTER_VALUE_LIST[index] || "ALL") === reviewState.filterType;
            buttonNode.classList.toggle("bg-primary", isActive);
            buttonNode.classList.toggle("text-white", isActive);
            buttonNode.classList.toggle("bg-surface-low", !isActive);
            buttonNode.classList.toggle("text-slate-600", !isActive);
        });
    }

    function RenderStats(pageRefs, reviewState, filteredTaskList) {
        const statCardList = pageRefs.statCardList;
        if (statCardList.length < 4) {
            return;
        }
        const pendingCount = filteredTaskList.length;
        const productCount = reviewState.taskList.filter(function MatchTask(item) {
            return item.taskType === "PRODUCT";
        }).length;
        const recruitmentCount = reviewState.taskList.filter(function MatchTask(item) {
            return item.taskType === "TEAM_RECRUITMENT";
        }).length;
        const waitHours = pendingCount
            ? (filteredTaskList.reduce(function SumHours(total, item) {
                return total + (Date.now() - ResolveTimeValue(item.createTime));
            }, 0) / pendingCount / 1000 / 60 / 60)
            : 0;

        PatchStatCardValue(statCardList[0], String(pendingCount), `当前筛选: ${reviewState.filterType}`);
        PatchStatCardValue(statCardList[1], String(reviewState.processedCount), "当前会话累计");
        PatchStatCardValue(statCardList[2], `${waitHours.toFixed(1)}h`, "待审任务平均等待");
        PatchStatCardValue(statCardList[3], `商品 ${productCount} / 帖子 ${recruitmentCount}`, "全量队列");
    }

    function PatchStatCardValue(cardNode, valueText, tipText) {
        if (!cardNode) {
            return;
        }
        const valueNode = cardNode.querySelector("h2");
        const tipNode = cardNode.querySelector("p:last-child");
        if (valueNode) {
            valueNode.textContent = valueText;
        }
        if (tipNode) {
            tipNode.textContent = tipText;
        }
    }

    function RenderQueue(pageRefs, reviewState, filteredTaskList) {
        if (!pageRefs.queueListNode) {
            return;
        }
        if (!filteredTaskList.length) {
            pageRefs.queueListNode.innerHTML = "<div class=\"p-4 rounded-xl bg-surface-low text-sm text-slate-500\">暂无待审核任务</div>";
            return;
        }
        pageRefs.queueListNode.innerHTML = filteredTaskList.map(function BuildCard(taskItem) {
            const taskKey = BuildTaskKey(taskItem);
            const isSelected = reviewState.selectedTaskKey === taskKey;
            const iconName = taskItem.taskType === "PRODUCT" ? "inventory_2" : "forum";
            const tagClass = taskItem.taskType === "PRODUCT"
                ? "bg-blue-50 text-blue-700"
                : "bg-indigo-50 text-indigo-700";
            return [
                `<button type="button" data-task-key="${EscapeHtml(taskKey)}" class="w-full text-left rounded-xl p-4 border transition-colors ${isSelected ? "border-primary bg-blue-50/50" : "border-outline/20 bg-white hover:border-primary/40"}">`,
                "<div class=\"flex items-start justify-between gap-3\">",
                "<div class=\"flex items-start gap-2\">",
                `<span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-low text-slate-700"><span class="material-symbols-outlined text-base">${iconName}</span></span>`,
                "<div>",
                `<p class="text-sm font-bold text-slate-800 leading-5">${EscapeHtml(taskItem.title)}</p>`,
                `<p class="text-xs text-slate-500 mt-1">${EscapeHtml(taskItem.ownerText)}</p>`,
                `<p class="text-xs text-slate-500">${EscapeHtml(taskItem.metaText)}</p>`,
                "</div></div>",
                `<span class="px-2 py-1 rounded-full text-[10px] font-bold ${tagClass}">${taskItem.taskType === "PRODUCT" ? "商品" : "帖子"}</span>`,
                "</div>",
                `<p class="text-xs text-slate-400 mt-3">提交时间：${EscapeHtml(FormatTime(taskItem.createTime))}</p>`,
                "</button>"
            ].join("");
        }).join("");
    }

    function RenderDecisionPanel(pageRefs, reviewState, filteredTaskList) {
        const selectedTask = GetSelectedTask(reviewState, filteredTaskList);
        const hasTask = !!selectedTask;
        if (pageRefs.prevButton) {
            pageRefs.prevButton.disabled = !hasTask;
        }
        if (pageRefs.nextButton) {
            pageRefs.nextButton.disabled = !hasTask;
        }
        if (pageRefs.approveButton) {
            pageRefs.approveButton.disabled = !hasTask;
        }
        if (pageRefs.rejectButton) {
            pageRefs.rejectButton.disabled = !hasTask;
        }
        if (pageRefs.currentStatusNode) {
            pageRefs.currentStatusNode.textContent = hasTask ? "待审核" : "无任务";
        }
    }

    async function RenderTaskDetail(pageRefs, reviewState) {
        const selectedTask = GetSelectedTask(reviewState, reviewState.filteredTaskList);
        if (!selectedTask) {
            pageRefs.detailHeaderNode.innerHTML = "<h2 class=\"text-xl font-bold\">暂无任务</h2><p class=\"text-sm text-slate-500 mt-2\">请调整筛选条件。</p>";
            pageRefs.detailBodyNode.innerHTML = "<article class=\"rounded-xl bg-surface-low p-5 text-sm text-slate-600\">当前没有可展示的审核详情。</article>";
            return;
        }
        const taskKey = BuildTaskKey(selectedTask);

        try {
            const detailResult = await LoadTaskDetail(reviewState, selectedTask);
            if (reviewState.selectedTaskKey !== taskKey) {
                return;
            }
            PatchDetailHeader(pageRefs.detailHeaderNode, selectedTask, detailResult);
            PatchDetailBody(pageRefs.detailBodyNode, selectedTask, detailResult);
        } catch (error) {
            if (reviewState.selectedTaskKey !== taskKey) {
                return;
            }
            PatchDetailHeader(pageRefs.detailHeaderNode, selectedTask, null);
            pageRefs.detailBodyNode.innerHTML = `<article class="rounded-xl bg-red-50 text-red-700 p-5 text-sm">加载详情失败：${EscapeHtml(error instanceof Error ? error.message : "未知错误")}</article>`;
        }
    }

    async function LoadTaskDetail(reviewState, taskItem) {
        const cacheKey = BuildTaskKey(taskItem);
        if (reviewState.detailCacheMap.has(cacheKey)) {
            return reviewState.detailCacheMap.get(cacheKey);
        }
        let detailResult = null;
        if (taskItem.taskType === "PRODUCT") {
            detailResult = await window.CampusShareApi.GetProductDetail(taskItem.taskId);
        } else {
            detailResult = await window.CampusShareApi.GetTeamRecruitmentDetail(taskItem.taskId);
        }
        reviewState.detailCacheMap.set(cacheKey, detailResult);
        return detailResult;
    }

    function PatchDetailHeader(headerNode, taskItem, detailResult) {
        const typeTag = taskItem.taskType === "PRODUCT" ? "商品发布" : "组队帖子";
        const ownerText = taskItem.ownerText || "-";
        const idText = `ID: ${taskItem.taskId}`;
        const timeText = FormatTime((detailResult && detailResult.createTime) || taskItem.createTime);
        headerNode.innerHTML = [
            "<div class=\"flex items-start justify-between gap-6\">",
            "<div>",
            `<div class="flex items-center gap-2 mb-2"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">${EscapeHtml(typeTag)}</span><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-low text-slate-600">待审核</span></div>`,
            `<h2 class="text-2xl font-bold">${EscapeHtml(taskItem.title)}</h2>`,
            `<p class="text-sm text-slate-500 mt-1">${EscapeHtml(idText)} · 发布者: ${EscapeHtml(ownerText)}</p>`,
            "</div>",
            "<div class=\"text-right\">",
            "<p class=\"text-xs uppercase tracking-widest text-slate-500 font-semibold\">提交时间</p>",
            `<p class="text-sm font-semibold mt-1">${EscapeHtml(timeText)}</p>`,
            "</div></div>"
        ].join("");
    }

    function PatchDetailBody(bodyNode, taskItem, detailResult) {
        if (taskItem.taskType === "PRODUCT") {
            bodyNode.innerHTML = BuildProductDetailHtml(taskItem, detailResult || {});
            return;
        }
        bodyNode.innerHTML = BuildRecruitmentDetailHtml(taskItem, detailResult || {});
    }

    function BuildProductDetailHtml(taskItem, detailItem) {
        const imageUrlList = BuildImageUrlList(detailItem.imageFileIds || taskItem.rawItem.imageFileIds);
        const firstImageUrl = imageUrlList[0] || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";
        return [
            `<div class="rounded-xl overflow-hidden bg-surface-low ring-1 ring-outline/20"><img class="w-full max-h-[360px] object-cover" src="${EscapeHtml(firstImageUrl)}" alt="商品图片"/></div>`,
            "<div class=\"grid grid-cols-2 gap-4\">",
            "<article class=\"bg-surface-low rounded-xl p-4 ring-1 ring-outline/20\">",
            "<h3 class=\"text-sm font-bold mb-3\">发布信息</h3>",
            "<dl class=\"space-y-2 text-sm\">",
            `<div class="flex justify-between gap-4"><dt class="text-slate-500">分类</dt><dd class="font-semibold">${EscapeHtml(detailItem.category || taskItem.rawItem.category || "-")}</dd></div>`,
            `<div class="flex justify-between gap-4"><dt class="text-slate-500">价格</dt><dd class="font-semibold text-primary">￥${FormatPrice(detailItem.price || taskItem.rawItem.price)}</dd></div>`,
            `<div class="flex justify-between gap-4"><dt class="text-slate-500">成色</dt><dd class="font-semibold">${EscapeHtml(detailItem.conditionLevel || taskItem.rawItem.conditionLevel || "-")}</dd></div>`,
            `<div class="flex justify-between gap-4"><dt class="text-slate-500">交易地点</dt><dd class="font-semibold">${EscapeHtml(detailItem.tradeLocation || taskItem.rawItem.tradeLocation || "-")}</dd></div>`,
            "</dl></article>",
            "<article class=\"bg-surface-low rounded-xl p-4 ring-1 ring-outline/20\">",
            "<h3 class=\"text-sm font-bold mb-3\">发布者信息</h3>",
            "<dl class=\"space-y-2 text-sm\">",
            `<div class="flex justify-between gap-4"><dt class="text-slate-500">昵称</dt><dd class="font-semibold">${EscapeHtml(detailItem.sellerDisplayName || taskItem.ownerText)}</dd></div>`,
            `<div class="flex justify-between gap-4"><dt class="text-slate-500">用户ID</dt><dd class="font-semibold">${SafeNumber(detailItem.sellerUserId || taskItem.rawItem.sellerUserId)}</dd></div>`,
            `<div class="flex justify-between gap-4"><dt class="text-slate-500">状态</dt><dd class="font-semibold">${EscapeHtml(MapProductStatus(detailItem.productStatus || taskItem.rawItem.productStatus))}</dd></div>`,
            "</dl></article></div>",
            "<article class=\"bg-surface-low rounded-xl p-5 ring-1 ring-outline/20\">",
            "<h3 class=\"text-sm font-bold mb-3\">内容描述</h3>",
            `<p class="text-sm leading-7 text-slate-700 whitespace-pre-wrap">${EscapeHtml(detailItem.description || "暂无描述")}</p>`,
            "</article>"
        ].join("");
    }

    function BuildRecruitmentDetailHtml(taskItem, detailItem) {
        return [
            "<article class=\"bg-surface-low rounded-xl p-4 ring-1 ring-outline/20\">",
            "<h3 class=\"text-sm font-bold mb-3\">招募信息</h3>",
            "<dl class=\"grid grid-cols-2 gap-3 text-sm\">",
            `<div><dt class="text-slate-500">赛事/主题</dt><dd class="font-semibold mt-1">${EscapeHtml(detailItem.eventName || taskItem.title)}</dd></div>`,
            `<div><dt class="text-slate-500">方向</dt><dd class="font-semibold mt-1">${EscapeHtml(detailItem.direction || taskItem.rawItem.direction || "-")}</dd></div>`,
            `<div><dt class="text-slate-500">成员规模</dt><dd class="font-semibold mt-1">${SafeNumber(detailItem.currentMemberCount || taskItem.rawItem.currentMemberCount)}/${SafeNumber(detailItem.memberLimit || taskItem.rawItem.memberLimit)}</dd></div>`,
            `<div><dt class="text-slate-500">截止时间</dt><dd class="font-semibold mt-1">${EscapeHtml(FormatTime(detailItem.deadline || taskItem.rawItem.deadline))}</dd></div>`,
            `<div><dt class="text-slate-500">申请数</dt><dd class="font-semibold mt-1">${SafeNumber(detailItem.applicationCount)}</dd></div>`,
            `<div><dt class="text-slate-500">状态</dt><dd class="font-semibold mt-1">${EscapeHtml(MapRecruitmentStatus(detailItem.recruitmentStatus || taskItem.rawItem.recruitmentStatus))}</dd></div>`,
            "</dl></article>",
            "<article class=\"bg-surface-low rounded-xl p-5 ring-1 ring-outline/20\">",
            "<h3 class=\"text-sm font-bold mb-3\">技能需求</h3>",
            `<p class="text-sm leading-7 text-slate-700 whitespace-pre-wrap">${EscapeHtml(detailItem.skillRequirement || taskItem.rawItem.skillRequirement || "未填写")}</p>`,
            "</article>"
        ].join("");
    }

    async function SubmitDecision(pageRefs, reviewState, messageBar, approved) {
        const selectedTask = GetSelectedTask(reviewState, reviewState.filteredTaskList);
        if (!selectedTask) {
            ShowError(messageBar, "请先选择审核任务");
            return;
        }

        if (pageRefs.decisionSelect) {
            pageRefs.decisionSelect.value = approved ? "APPROVE" : "REJECT";
        }
        const reviewRemark = pageRefs.reviewNoteInput
            ? String(pageRefs.reviewNoteInput.value || "").trim()
            : "";
        if (!approved && !reviewRemark) {
            ShowError(messageBar, "驳回时请填写审核意见");
            return;
        }

        const confirmText = approved ? "确认通过该任务？" : "确认驳回该任务？";
        if (!window.confirm(confirmText)) {
            return;
        }

        ToggleActionDisabled(pageRefs, true);
        try {
            if (selectedTask.taskType === "PRODUCT") {
                await window.CampusShareApi.ReviewProductByAdmin(
                    selectedTask.taskId,
                    approved,
                    reviewRemark || (approved ? "内容审核通过" : "内容审核驳回")
                );
            } else {
                await window.CampusShareApi.ReviewTeamRecruitmentByAdmin(
                    selectedTask.taskId,
                    approved,
                    reviewRemark || (approved ? "内容审核通过" : "内容审核驳回")
                );
            }

            reviewState.processedCount += 1;
            reviewState.taskList = reviewState.taskList.filter(function FilterTask(item) {
                return BuildTaskKey(item) !== BuildTaskKey(selectedTask);
            });
            reviewState.detailCacheMap.delete(BuildTaskKey(selectedTask));
            SwitchSelectionAfterProcessed(reviewState);
            ShowSuccess(messageBar, approved ? "审核已通过" : "审核已驳回");
            RenderAll(pageRefs, reviewState);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "审核操作失败");
        } finally {
            ToggleActionDisabled(pageRefs, false);
        }
    }

    function SwitchSelectionAfterProcessed(reviewState) {
        if (!reviewState.filteredTaskList.length) {
            reviewState.selectedTaskKey = "";
            return;
        }
        const nextTask = reviewState.taskList[0];
        reviewState.selectedTaskKey = nextTask ? BuildTaskKey(nextTask) : "";
    }

    function SwitchSelectionByOffset(reviewState, offset) {
        if (!reviewState.filteredTaskList.length || !reviewState.selectedTaskKey) {
            return;
        }
        const selectedIndex = reviewState.filteredTaskList.findIndex(function FindTask(item) {
            return BuildTaskKey(item) === reviewState.selectedTaskKey;
        });
        if (selectedIndex < 0) {
            return;
        }
        const targetIndex = selectedIndex + offset;
        if (targetIndex < 0 || targetIndex >= reviewState.filteredTaskList.length) {
            return;
        }
        reviewState.selectedTaskKey = BuildTaskKey(reviewState.filteredTaskList[targetIndex]);
    }

    function GetSelectedTask(reviewState, taskList) {
        const safeTaskList = Array.isArray(taskList) ? taskList : [];
        if (!reviewState.selectedTaskKey) {
            return null;
        }
        return safeTaskList.find(function MatchTask(item) {
            return BuildTaskKey(item) === reviewState.selectedTaskKey;
        }) || null;
    }

    function BuildTaskKey(taskItem) {
        return `${taskItem.taskType}:${taskItem.taskId}`;
    }

    function ToggleActionDisabled(pageRefs, disabled) {
        [pageRefs.approveButton, pageRefs.rejectButton, pageRefs.prevButton, pageRefs.nextButton]
            .filter(Boolean)
            .forEach(function PatchDisabled(buttonNode) {
                buttonNode.disabled = !!disabled;
            });
    }

    function BuildImageUrlList(imageFileIds) {
        const safeFileIdList = Array.isArray(imageFileIds) ? imageFileIds : [];
        return safeFileIdList
            .map(function MapFileId(fileId) {
                if (!window.CampusShareApi || !window.CampusShareApi.BuildPublicFileUrl) {
                    return "";
                }
                return window.CampusShareApi.BuildPublicFileUrl(fileId);
            })
            .filter(Boolean);
    }

    function MapProductStatus(statusText) {
        const safeStatus = String(statusText || "").toUpperCase();
        if (safeStatus === "PENDING_REVIEW") {
            return "待审核";
        }
        if (safeStatus === "ON_SHELF") {
            return "已上架";
        }
        if (safeStatus === "REJECTED") {
            return "已驳回";
        }
        if (safeStatus === "OFFLINE") {
            return "已下架";
        }
        return safeStatus || "-";
    }

    function MapRecruitmentStatus(statusText) {
        const safeStatus = String(statusText || "").toUpperCase();
        if (safeStatus === "PENDING_REVIEW") {
            return "待审核";
        }
        if (safeStatus === "RECRUITING") {
            return "招募中";
        }
        if (safeStatus === "FULL") {
            return "已满员";
        }
        if (safeStatus === "CLOSED") {
            return "已关闭";
        }
        if (safeStatus === "EXPIRED") {
            return "已过期";
        }
        if (safeStatus === "REJECTED") {
            return "已驳回";
        }
        return safeStatus || "-";
    }

    function BuildMessageBar(pageMain) {
        const messageBar = document.createElement("div");
        messageBar.className = "hidden mx-8 mt-4 px-4 py-3 rounded-xl text-sm font-semibold";
        pageMain.insertBefore(messageBar, pageMain.firstElementChild.nextElementSibling);
        return messageBar;
    }

    function ShowSuccess(messageBar, messageText) {
        ShowMessage(messageBar, messageText, "success");
    }

    function ShowError(messageBar, messageText) {
        ShowMessage(messageBar, messageText, "error");
    }

    function ShowMessage(messageBar, messageText, messageType) {
        if (!messageBar) {
            return;
        }
        messageBar.classList.remove("hidden", "bg-red-50", "text-red-700", "bg-green-50", "text-green-700");
        if (messageType === "error") {
            messageBar.classList.add("bg-red-50", "text-red-700");
        } else {
            messageBar.classList.add("bg-green-50", "text-green-700");
        }
        messageBar.textContent = messageText || "";
    }

    function HideMessage(messageBar) {
        if (!messageBar) {
            return;
        }
        messageBar.classList.add("hidden");
        messageBar.textContent = "";
    }

    function ResolveTimeValue(timeText) {
        const timeValue = new Date(timeText || "");
        if (Number.isNaN(timeValue.getTime())) {
            return 0;
        }
        return timeValue.getTime();
    }

    function FormatTime(timeText) {
        if (!timeText) {
            return "-";
        }
        const dateValue = new Date(timeText);
        if (Number.isNaN(dateValue.getTime())) {
            return String(timeText);
        }
        return `${dateValue.getFullYear()}-${PadTime(dateValue.getMonth() + 1)}-${PadTime(dateValue.getDate())} ${PadTime(dateValue.getHours())}:${PadTime(dateValue.getMinutes())}`;
    }

    function PadTime(value) {
        return value < 10 ? `0${value}` : `${value}`;
    }

    function FormatPrice(value) {
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) {
            return "0.00";
        }
        return numberValue.toFixed(2);
    }

    function SafeNumber(value) {
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) {
            return 0;
        }
        return numberValue;
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
