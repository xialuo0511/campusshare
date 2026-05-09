/**
 * 绠＄悊绔唴瀹瑰鏍搁〉閫昏緫
 * - 鍟嗗搧瀹℃牳
 * - 缁勯槦甯栧瓙瀹℃牳
 * - 瀛︽湳璧勬枡瀹℃牳
 */
(function InitAdminContentReviewPage() {
    const FILTER_VALUE_LIST = ["ALL", "PRODUCT", "TEAM_RECRUITMENT", "MATERIAL", "USER", "HIGH_RISK", "RECENT"];
    const REJECT_TEMPLATE_LIST = [
        { value: "", text: "璇烽€夋嫨椹冲洖鎰忚妯℃澘" },
        { value: "鍐呭淇℃伅涓嶅畬鏁达紝璇疯ˉ鍏呭叧閿瓧娈靛悗閲嶆柊鎻愪氦銆?, text: "淇℃伅涓嶅畬鏁? },
        { value: "鎻忚堪瀛樺湪椋庨櫓瀵兼祦鎴栬繚瑙勮〃杈撅紝璇蜂慨鏀瑰悗閲嶆柊鎻愪氦銆?, text: "椋庨櫓鍐呭" },
        { value: "鍒嗙被涓庡唴瀹逛笉鍖归厤锛岃璋冩暣鍒嗙被鍚庨噸鏂版彁浜ゃ€?, text: "鍒嗙被涓嶅尮閰? },
        { value: "璇疯ˉ鍏呮竻鏅拌鏄庡悗閲嶆柊鎻愪氦銆?, text: "璇存槑涓嶆竻鏅? }
    ];
    const RISK_KEYWORD_LIST = ["浠ｈ", "棰勮", "绉佽亰", "vx", "寰俊", "瀵兼祦"];
    const DAY_MS = 24 * 60 * 60 * 1000;
    const IMAGE_FILE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];
    const EMPTY_DETAIL_TEXT = "<article class=\"rounded-xl bg-surface-container-low p-5 text-sm text-slate-600\">褰撳墠娌℃湁鍙睍绀虹殑瀹℃牳璇︽儏銆?/article>";

    const CORE_FIELD_META = {
        PRODUCT: {
            productId: { label: "鍟嗗搧ID", note: "鐢ㄤ簬瀹氫綅鍟嗗搧璁板綍涓庡鏍告棩蹇? },
            title: { label: "鍟嗗搧鏍囬", note: "鍓嶅彴灞曠ず涓绘爣棰? },
            category: { label: "鍟嗗搧鍒嗙被", note: "鐢ㄤ簬鍒嗙被绛涢€変笌鎺ㄨ崘" },
            conditionLevel: { label: "鏂版棫绋嬪害", note: "鍙戝竷鑰呭鍟嗗搧鐘舵€佺殑鎻忚堪" },
            price: { label: "浠锋牸", note: "鍗曚綅锛氬厓" },
            tradeLocation: { label: "浜ゆ槗鍦扮偣", note: "绾夸笅绾﹀畾浜ゆ槗浣嶇疆" },
            sellerUserId: { label: "鍙戝竷鑰匢D", note: "璐﹀彿鍞竴鏍囪瘑" },
            sellerDisplayName: { label: "鍙戝竷鑰呮樀绉?, note: "鍓嶅彴灞曠ず鍚? },
            productStatus: { label: "鍙戝竷鐘舵€?, note: "瀹℃牳/涓婁笅鏋剁姸鎬? },
            stockCount: { label: "搴撳瓨", note: "鍙敭鏁伴噺" },
            onShelf: { label: "鏄惁涓婃灦", note: "true 琛ㄧず鍓嶅彴鍙氦鏄? },
            createTime: { label: "鍙戝竷鏃堕棿", note: "鐢ㄤ簬鏃跺簭鎺掑簭" }
        },
        TEAM_RECRUITMENT: {
            recruitmentId: { label: "甯栧瓙ID", note: "缁勯槦甯栧敮涓€鏍囪瘑" },
            eventName: { label: "缁勯槦涓婚", note: "甯栧瓙涓绘爣棰? },
            direction: { label: "缁勯槦鏂瑰悜", note: "宀椾綅鎴栭」鐩柟鍚? },
            skillRequirement: { label: "鎶€鑳借姹?, note: "鐢宠闂ㄦ璇存槑" },
            memberLimit: { label: "浜烘暟涓婇檺", note: "鐩爣鎷涘嫙浜烘暟" },
            currentMemberCount: { label: "褰撳墠浜烘暟", note: "宸插姞鍏ユ垚鍛樻暟" },
            publisherUserId: { label: "鍙戝竷鑰匢D", note: "璐﹀彿鍞竴鏍囪瘑" },
            publisherDisplayName: { label: "鍙戝竷鑰呮樀绉?, note: "鍓嶅彴灞曠ず鍚? },
            recruitmentStatus: { label: "甯栧瓙鐘舵€?, note: "鎷涘嫙娴佺▼鐘舵€? },
            deadline: { label: "鎴鏃堕棿", note: "鎷涘嫙鎴鑺傜偣" },
            applicationCount: { label: "鐢宠鏁?, note: "绱鐢宠浜烘暟" },
            createTime: { label: "鍙戝竷鏃堕棿", note: "鐢ㄤ簬鏃跺簭鎺掑簭" }
        },
        MATERIAL: {
            materialId: { label: "璧勬枡ID", note: "璧勬枡鍞竴鏍囪瘑" },
            courseName: { label: "璧勬枡鏍囬", note: "璇剧▼/璧勬枡鍚嶇О" },
            uploaderUserId: { label: "涓婁紶鑰匢D", note: "璐﹀彿鍞竴鏍囪瘑" },
            uploaderDisplayName: { label: "涓婁紶鑰呮樀绉?, note: "鍓嶅彴灞曠ず鍚? },
            materialStatus: { label: "璧勬枡鐘舵€?, note: "瀹℃牳/鍙戝竷鐘舵€? },
            fileType: { label: "鏂囦欢绫诲瀷", note: "濡?PDF/JPG/PNG" },
            fileSizeBytes: { label: "鏂囦欢澶у皬", note: "鑷姩杩涗綅鏄剧ず锛圞B/MB/GB锛? },
            downloadCostPoints: { label: "涓嬭浇绉垎", note: "涓嬭浇鎵€闇€绉垎" },
            downloadCount: { label: "涓嬭浇娆℃暟", note: "绱涓嬭浇閲? },
            copyrightDeclared: { label: "鐗堟潈澹版槑", note: "涓婁紶鑰呯増鏉冨嬀閫夌姸鎬? },
            createTime: { label: "涓婁紶鏃堕棿", note: "鐢ㄤ簬鏃跺簭鎺掑簭" }
        },
        USER: {
            userId: { label: "鐢ㄦ埛ID", note: "鐢ㄦ埛鍞竴鏍囪瘑" },
            account: { label: "璐﹀彿", note: "鐧诲綍璐﹀彿" },
            displayName: { label: "鏄电О", note: "鍓嶅彴鏄剧ず鍚嶇О" },
            college: { label: "瀛﹂櫌", note: "娉ㄥ唽璧勬枡涓殑瀛﹂櫌淇℃伅" },
            grade: { label: "骞寸骇", note: "娉ㄥ唽璧勬枡涓殑骞寸骇淇℃伅" },
            phone: { label: "鎵嬫満鍙?, note: "鑱旂郴鏂瑰紡瀛楁" },
            email: { label: "閭", note: "鑱旂郴鏂瑰紡瀛楁" },
            userRole: { label: "瑙掕壊", note: "褰撳墠绯荤粺瑙掕壊" },
            userStatus: { label: "璐﹀彿鐘舵€?, note: "娉ㄥ唽瀹℃牳閫氳繃鍚庡皢鏇存柊鐘舵€? },
            pointBalance: { label: "绉垎浣欓", note: "璐︽埛绉垎淇℃伅" },
            registerTime: { label: "娉ㄥ唽鏃堕棿", note: "鑻ユ帴鍙ｆ湭杩斿洖鍒欐樉绀轰负-" },
            lastLoginTime: { label: "鏈€杩戠櫥褰?, note: "鏈€杩戜竴娆＄櫥褰曟椂闂? }
        }
    };

    document.addEventListener("DOMContentLoaded", function HandleReady() {
        BindPage().catch(function HandleInitError(error) {
            window.console.error(error);
        });
    });

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
        BindDetailPreview(refs);
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
            decisionPanelNode: pageMain.querySelector("[data-review-decision-panel]"),
            rejectTemplateSelect: document.getElementById("reject-template"),
            reviewNoteInput: document.getElementById("review-note"),
            prevButton: pageMain.querySelector("[data-review-prev]"),
            nextButton: pageMain.querySelector("[data-review-next]"),
            approveButton: pageMain.querySelector("[data-review-approve]"),
            rejectButton: pageMain.querySelector("[data-review-reject]"),
            imagePreviewModal: EnsureImagePreviewModal(),
            decisionConfirmModal: EnsureDecisionConfirmModal(),
            decisionHintNode: EnsureDecisionHintNode(pageMain.querySelector("[data-review-decision-panel]"))
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
            const templateValue = String(refs.rejectTemplateSelect.value || "").trim();
            if (!templateValue) {
                return;
            }
            const currentNote = String(refs.reviewNoteInput.value || "").trim();
            if (!currentNote || IsRejectTemplateValue(currentNote)) {
                refs.reviewNoteInput.value = templateValue;
            }
        });

        if (window.CampusShareApi.EnhanceSelectElements) {
            window.CampusShareApi.EnhanceSelectElements(refs.rejectTemplateSelect.parentElement || refs.rejectTemplateSelect);
        }
    }

    function IsRejectTemplateValue(text) {
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

    function BindDetailPreview(refs) {
        if (!refs.detailBodyNode || !refs.imagePreviewModal) {
            return;
        }
        refs.detailBodyNode.addEventListener("click", function HandleDetailPreviewClick(event) {
            const previewTrigger = event.target.closest("[data-review-image-preview]");
            if (!previewTrigger) {
                return;
            }
            const previewUrl = String(previewTrigger.getAttribute("data-preview-src") || "").trim();
            if (!previewUrl) {
                return;
            }
            const previewTitle = String(previewTrigger.getAttribute("data-preview-title") || "鍥剧墖棰勮").trim();
            OpenImagePreviewModal(refs.imagePreviewModal, previewUrl, previewTitle);
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
            refs.approveButton.addEventListener("click", function HandleApprove() {
                SubmitDecision(refs, state, messageBar, true);
            });
        }
        if (refs.rejectButton) {
            refs.rejectButton.addEventListener("click", function HandleReject() {
                SubmitDecision(refs, state, messageBar, false);
            });
        }
    }

    async function ReloadTaskQueue(refs, state, messageBar) {
        try {
            const [productResult, recruitmentResult, materialResult, pendingUserResult, pendingAvatarResult] = await Promise.all([
                window.CampusShareApi.ListPendingProductsByAdmin(1, 300),
                window.CampusShareApi.ListPendingTeamRecruitmentsByAdmin(1, 300),
                window.CampusShareApi.ListPendingMaterials(1, 300),
                window.CampusShareApi.ListPendingUsers(),
                window.CampusShareApi.ListPendingAvatarReviews ? window.CampusShareApi.ListPendingAvatarReviews() : []
            ]);

            const pendingProductList = productResult && Array.isArray(productResult.productList) ? productResult.productList : [];
            const pendingRecruitmentList = recruitmentResult && Array.isArray(recruitmentResult.recruitmentList) ? recruitmentResult.recruitmentList : [];
            const pendingMaterialList = materialResult && Array.isArray(materialResult.materialList) ? materialResult.materialList : [];
            const pendingUserList = Array.isArray(pendingUserResult) ? pendingUserResult : [];
            const pendingAvatarList = Array.isArray(pendingAvatarResult) ? pendingAvatarResult : [];

            state.taskList = BuildTaskList(pendingProductList, pendingRecruitmentList, pendingMaterialList, pendingUserList, pendingAvatarList);
            if (!state.selectedTaskKey && state.taskList.length) {
                state.selectedTaskKey = BuildTaskKey(state.taskList[0]);
            }
            HideMessage(messageBar);
            HideDecisionHint(refs.decisionHintNode);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "鍔犺浇瀹℃牳浠诲姟澶辫触");
            state.taskList = [];
            state.selectedTaskKey = "";
        }
    }

    function BuildTaskList(productList, recruitmentList, materialList, userList, avatarList) {
        const productTaskList = (Array.isArray(productList) ? productList : []).map(function MapProduct(item) {
            const productId = SafeNumber(item.productId);
            return {
                taskType: "PRODUCT",
                taskId: productId,
                title: item.title || `鍟嗗搧 #${productId}`,
                ownerText: item.sellerDisplayName || `鐢ㄦ埛ID ${SafeNumber(item.sellerUserId)}`,
                metaText: `${item.category || "-"} 路 ${item.conditionLevel || "-"} 路 楼${FormatPrice(item.price)}`,
                createTime: item.createTime,
                rawItem: item
            };
        });

        const recruitmentTaskList = (Array.isArray(recruitmentList) ? recruitmentList : []).map(function MapRecruitment(item) {
            const recruitmentId = SafeNumber(item.recruitmentId);
            return {
                taskType: "TEAM_RECRUITMENT",
                taskId: recruitmentId,
                title: item.eventName || `甯栧瓙 #${recruitmentId}`,
                ownerText: item.publisherDisplayName || `鐢ㄦ埛ID ${SafeNumber(item.publisherUserId)}`,
                metaText: `${item.direction || "-"} 路 ${SafeNumber(item.currentMemberCount)}/${SafeNumber(item.memberLimit)}`,
                createTime: item.createTime,
                rawItem: item
            };
        });

        const materialTaskList = (Array.isArray(materialList) ? materialList : []).map(function MapMaterial(item) {
            const materialId = SafeNumber(item.materialId);
            const tags = Array.isArray(item.tags) ? item.tags.filter(Boolean).join("/") : "";
            return {
                taskType: "MATERIAL",
                taskId: materialId,
                title: item.courseName || `璧勬枡 #${materialId}`,
                ownerText: ResolveMaterialUploaderDisplayName(item) || `鐢ㄦ埛ID ${SafeNumber(item.uploaderUserId)}`,
                metaText: `${item.fileType || "-"} 路 ${FormatFileSize(item.fileSizeBytes)}${tags ? ` 路 ${tags}` : ""}`,
                createTime: item.createTime,
                rawItem: item
            };
        });

        const userTaskList = (Array.isArray(userList) ? userList : []).map(function MapUser(item) {
            const userId = SafeNumber(item.userId);
            return {
                taskType: "USER",
                taskId: userId,
                title: item.displayName || item.account || `鐢ㄦ埛 #${userId}`,
                ownerText: item.account || `鐢ㄦ埛ID ${userId}`,
                metaText: ResolveUserMetaText(item),
                createTime: item.registerTime || item.createTime || item.lastLoginTime,
                rawItem: item
            };
        });

        const avatarTaskList = (Array.isArray(avatarList) ? avatarList : []).map(function MapAvatar(item) {
            const userId = SafeNumber(item.userId);
            return {
                taskType: "USER_AVATAR",
                taskId: userId,
                title: `${item.displayName || item.account || `鐢ㄦ埛 #${userId}`} 鐨勫ご鍍廯,
                ownerText: item.account || `鐢ㄦ埛ID ${userId}`,
                metaText: "澶村儚瀹℃牳",
                createTime: item.avatarReviewSubmitTime || item.updateTime || item.lastLoginTime,
                rawItem: item
            };
        });

        return productTaskList
            .concat(recruitmentTaskList, materialTaskList, userTaskList, avatarTaskList)
            .sort(function SortByTimeDesc(leftItem, rightItem) {
                return ResolveTimeValue(rightItem.createTime) - ResolveTimeValue(leftItem.createTime);
            });
    }

    function ResolveUserMetaText(userItem) {
        const safeItem = userItem || {};
        const statusText = ResolveUserStatusText(safeItem.userStatus);
        const contactText = ResolveUserPrimaryContact(safeItem);
        return `${statusText} 路 ${contactText}`;
    }

    function ResolveTaskTypeVisual(taskType) {
        if (taskType === "PRODUCT") {
            return { typeText: "鍟嗗搧", iconName: "inventory_2", tagClass: "bg-emerald-50 text-emerald-700" };
        }
        if (taskType === "MATERIAL") {
            return { typeText: "璧勬枡", iconName: "description", tagClass: "bg-amber-50 text-amber-700" };
        }
        if (taskType === "USER" || taskType === "USER_AVATAR") {
            return { typeText: "鐢ㄦ埛", iconName: "person_add", tagClass: "bg-cyan-50 text-cyan-700" };
        }
        return { typeText: "甯栧瓙", iconName: "forum", tagClass: "bg-indigo-50 text-indigo-700" };
    }

    function ApplyInitialFocusFromQuery(state) {
        const searchParams = new URLSearchParams(window.location.search || "");
        const taskType = String(searchParams.get("taskType") || "").toUpperCase();
        const taskId = SafeNumber(searchParams.get("taskId"));
        if (!taskType || taskId <= 0) {
            return;
        }
        const focusedTask = state.taskList.find(function MatchTask(item) {
            return item.taskType === taskType && item.taskId === taskId;
        });
        if (focusedTask) {
            state.selectedTaskKey = BuildTaskKey(focusedTask);
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
            if (state.filterType === "USER" && taskItem.taskType !== "USER" && taskItem.taskType !== "USER_AVATAR") return false;
            if (state.filterType === "HIGH_RISK" && !IsHighRiskTask(taskItem)) return false;
            if (state.filterType === "RECENT" && (Date.now() - ResolveTimeValue(taskItem.createTime)) > DAY_MS) return false;

            if (!state.keyword) {
                return true;
            }
            const text = [taskItem.taskType, taskItem.taskId, taskItem.title, taskItem.ownerText, taskItem.metaText]
                .join(" ")
                .toLowerCase();
            return text.includes(state.keyword);
        });
    }

    function IsHighRiskTask(taskItem) {
        const payloadText = [taskItem.title, taskItem.ownerText, taskItem.metaText, JSON.stringify(taskItem.rawItem || {})]
            .join(" ")
            .toLowerCase();
        return RISK_KEYWORD_LIST.some(function MatchRisk(keyword) {
            return payloadText.includes(String(keyword || "").toLowerCase());
        });
    }

    function RenderFilterButtons(refs, state) {
        refs.filterButtonList.forEach(function RenderButton(buttonNode, index) {
            const buttonFilter = FILTER_VALUE_LIST[index] || "ALL";
            const isActive = buttonFilter === state.filterType;
            buttonNode.classList.toggle("bg-primary", isActive);
            buttonNode.classList.toggle("text-white", isActive);
            buttonNode.classList.toggle("font-bold", isActive);
            buttonNode.classList.toggle("bg-surface-container-low", !isActive);
            buttonNode.classList.toggle("text-slate-600", !isActive);
            buttonNode.classList.toggle("font-semibold", !isActive);
        });
    }

    function RenderStats(refs, state, filteredTaskList) {
        if (!refs.statCardList || refs.statCardList.length < 4) {
            return;
        }
        const totalCount = filteredTaskList.length;
        const waitingHour = totalCount
            ? filteredTaskList.reduce(function SumWait(sum, item) {
                return sum + (Date.now() - ResolveTimeValue(item.createTime));
            }, 0) / totalCount / (60 * 60 * 1000)
            : 0;

        const queueText = [
            `鍟嗗搧 ${filteredTaskList.filter(item => item.taskType === "PRODUCT").length}`,
            `甯栧瓙 ${filteredTaskList.filter(item => item.taskType === "TEAM_RECRUITMENT").length}`,
            `璧勬枡 ${filteredTaskList.filter(item => item.taskType === "MATERIAL").length}`,
            `鐢ㄦ埛 ${filteredTaskList.filter(item => item.taskType === "USER").length}`
        ].join(" / ");

        refs.statCardList[0].querySelector("h2").textContent = String(totalCount);
        refs.statCardList[0].querySelector("p:last-child").textContent = `绛涢€夛細${ResolveFilterTypeText(state.filterType)}`;

        refs.statCardList[1].querySelector("h2").textContent = String(state.processedCount);
        refs.statCardList[1].querySelector("p:last-child").textContent = "褰撳墠浼氳瘽";

        refs.statCardList[2].querySelector("h2").textContent = `${waitingHour.toFixed(1)}h`;
        refs.statCardList[2].querySelector("p:last-child").textContent = "闃熷垪骞冲潎绛夊緟";

        refs.statCardList[3].querySelector("h2").textContent = String(totalCount);
        refs.statCardList[3].querySelector("p:last-child").textContent = queueText;
    }

    function ResolveFilterTypeText(filterType) {
        if (filterType === "PRODUCT") return "鍟嗗搧";
        if (filterType === "TEAM_RECRUITMENT") return "甯栧瓙";
        if (filterType === "MATERIAL") return "璧勬枡";
        if (filterType === "USER") return "鐢ㄦ埛";
        if (filterType === "HIGH_RISK") return "楂橀闄?;
        if (filterType === "RECENT") return "鏈€鏂?;
        return "鍏ㄩ儴";
    }

    function RenderQueue(refs, state, filteredTaskList) {
        if (!refs.queueListNode) {
            return;
        }
        if (!filteredTaskList.length) {
            refs.queueListNode.innerHTML = "<div class=\"p-4 rounded-xl bg-surface-container-low text-sm text-slate-500\">褰撳墠绛涢€夋潯浠朵笅鏆傛棤寰呭鏍镐换鍔°€?/div>";
            return;
        }
        refs.queueListNode.innerHTML = filteredTaskList.map(function BuildTaskCard(taskItem, index) {
            const taskKey = BuildTaskKey(taskItem);
            const isSelected = state.selectedTaskKey === taskKey;
            const taskTypeVisual = ResolveTaskTypeVisual(taskItem.taskType);
            const typeText = taskTypeVisual.typeText;
            const iconName = taskTypeVisual.iconName;
            const typeTagClass = taskTypeVisual.tagClass;
            return [
                `<article data-task-key="${EscapeHtml(taskKey)}" class="rounded-xl p-4 cursor-pointer transition-all ring-1 ${isSelected ? "bg-white ring-primary shadow-sm" : "bg-surface-container-low ring-outline/20 hover:ring-primary/40"}">`,
                "<div class=\"flex items-start justify-between gap-2\">",
                "<div class=\"min-w-0\">",
                `<div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${typeTagClass}"><span class="material-symbols-outlined !text-[13px]">${iconName}</span>${typeText}</div>`,
                `<h4 class="text-sm font-bold text-slate-800 mt-2 line-clamp-2">${EscapeHtml(taskItem.title || "-")}</h4>`,
                `<p class="text-xs text-slate-500 mt-1 line-clamp-1">${EscapeHtml(taskItem.ownerText || "-")}</p>`,
                `<p class="text-xs text-slate-500 mt-1 line-clamp-1">${EscapeHtml(taskItem.metaText || "-")}</p>`,
                "</div>",
                `<span class="text-[11px] text-slate-400">${EscapeHtml(String(index + 1))}</span>`,
                "</div>",
                `<p class="text-[11px] text-slate-400 mt-2">${EscapeHtml(FormatTime(taskItem.createTime))}</p>`,
                "</article>"
            ].join("");
        }).join("");
    }

    function RenderDecisionPanel(refs, state, filteredTaskList) {
        const selectedTask = GetSelectedTask(state, filteredTaskList);
        const disabled = !selectedTask;
        if (refs.currentStatusNode) {
            refs.currentStatusNode.textContent = selectedTask ? "寰呭鏍? : "鏈€夋嫨浠诲姟";
        }
        ToggleActionDisabled(refs, disabled);
        HideDecisionHint(refs.decisionHintNode);
    }

    async function RenderTaskDetail(refs, state) {
        const selectedTask = GetSelectedTask(state, state.filteredTaskList);
        if (!selectedTask) {
            refs.detailHeaderNode.innerHTML = "<h2 class=\"text-xl font-bold\">鏆傛棤浠诲姟</h2><p class=\"text-sm text-slate-500 mt-2\">璇疯皟鏁寸瓫閫夋潯浠跺悗閲嶈瘯銆?/p>";
            refs.detailBodyNode.innerHTML = EMPTY_DETAIL_TEXT;
            return;
        }

        const currentRenderToken = ++state.detailRenderToken;
        refs.detailBodyNode.innerHTML = "<article class=\"rounded-xl bg-surface-container-low p-5 text-sm text-slate-600\">姝ｅ湪鍔犺浇璇︽儏...</article>";

        try {
            const detailResult = await LoadTaskDetail(state, selectedTask);
            if (currentRenderToken !== state.detailRenderToken || state.selectedTaskKey !== BuildTaskKey(selectedTask)) {
                return;
            }
            PatchDetailHeader(refs.detailHeaderNode, selectedTask, detailResult);
            PatchDetailBody(refs.detailBodyNode, selectedTask, detailResult);
        } catch (error) {
            if (currentRenderToken !== state.detailRenderToken) {
                return;
            }
            PatchDetailHeader(refs.detailHeaderNode, selectedTask, null);
            refs.detailBodyNode.innerHTML = `<article class="rounded-xl bg-red-50 text-red-700 p-5 text-sm">鍔犺浇璇︽儏澶辫触锛?{EscapeHtml(error instanceof Error ? error.message : "鏈煡閿欒")}</article>`;
        }
    }

    async function LoadTaskDetail(state, taskItem) {
        const cacheKey = BuildTaskKey(taskItem);
        if (state.detailCacheMap.has(cacheKey)) {
            return state.detailCacheMap.get(cacheKey);
        }
        let detailResult = null;
        if (taskItem.taskType === "PRODUCT") {
            detailResult = await window.CampusShareApi.GetProductDetail(taskItem.taskId);
        } else if (taskItem.taskType === "MATERIAL") {
            detailResult = await window.CampusShareApi.GetMaterialDetail(taskItem.taskId);
        } else if (taskItem.taskType === "USER" || taskItem.taskType === "USER_AVATAR") {
            detailResult = taskItem.rawItem || {};
        } else {
            detailResult = await window.CampusShareApi.GetTeamRecruitmentDetail(taskItem.taskId);
        }
        state.detailCacheMap.set(cacheKey, detailResult);
        return detailResult;
    }

    function PatchDetailHeader(headerNode, taskItem, detailItem) {
        const typeText = taskItem.taskType === "PRODUCT"
            ? "鍟嗗搧鍙戝竷"
            : (taskItem.taskType === "MATERIAL"
                ? "璧勬枡鍙戝竷"
                : (taskItem.taskType === "USER" ? "鐢ㄦ埛娉ㄥ唽" : "缁勯槦甯栧瓙"));
        const idText = taskItem.taskType === "PRODUCT"
            ? `鍟嗗搧ID: ${taskItem.taskId}`
            : (taskItem.taskType === "MATERIAL"
                ? `璧勬枡ID: ${taskItem.taskId}`
                : (taskItem.taskType === "USER" ? `鐢ㄦ埛ID: ${taskItem.taskId}` : `甯栧瓙ID: ${taskItem.taskId}`));
        const createTimeText = FormatTime(
            (detailItem && (detailItem.createTime || detailItem.registerTime)) || taskItem.createTime
        );
        headerNode.innerHTML = [
            "<div class=\"flex items-start justify-between gap-6\">",
            "<div>",
            `<div class="flex items-center gap-2 mb-2"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">${EscapeHtml(typeText)}</span><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-container-low text-slate-600">寰呭鏍?/span></div>`,
            `<h2 class="text-2xl font-bold">${EscapeHtml(taskItem.title || "-")}</h2>`,
            `<p class="text-sm text-slate-500 mt-1">${EscapeHtml(idText)} 路 鍙戝竷鑰咃細${EscapeHtml(taskItem.ownerText || "-")}</p>`,
            "</div>",
            "<div class=\"text-right\">",
            "<p class=\"text-xs uppercase tracking-widest text-slate-500 font-semibold\">鎻愪氦鏃堕棿</p>",
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
        if (taskItem.taskType === "USER_AVATAR") {
            bodyNode.innerHTML = BuildUserAvatarDetailHtml(taskItem, detailItem || {});
            return;
        }
        if (taskItem.taskType === "USER") {
            bodyNode.innerHTML = BuildUserDetailHtml(taskItem, detailItem || {});
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
            stockCount: detailItem.stockCount,
            onShelf: detailItem.onShelf,
            createTime: detailItem.createTime
        };
        const imageUrlList = BuildProductImageUrlList(taskItem, detailItem);
        return [
            BuildFieldGridSection("鏍稿績瀛楁锛堝惈涓枃璇存槑锛?, summaryFieldMap, CORE_FIELD_META.PRODUCT),
            BuildImagePreviewSection("鍟嗗搧鍥剧墖棰勮锛堟敮鎸佹斁澶э級", imageUrlList),
            BuildLivePreviewSection("瀹屾暣鍟嗗搧棰勮", BuildProductPreviewUrl(taskItem, detailItem), "鍙洿鎺ュ湪瀹℃牳椤垫煡鐪嬪畬鏁村晢鍝佽鎯呫€?),
            BuildTextSection("鍐呭鎻忚堪", detailItem.description || "鏆傛棤鎻忚堪"),
            BuildObjectSection("瀹屾暣瀛楁锛堣鎯呮帴鍙ｏ級", detailItem),
            BuildObjectSection("瀹屾暣瀛楁锛堝緟瀹″揩鐓э級", taskItem.rawItem || {})
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
            deadline: detailItem.deadline,
            applicationCount: detailItem.applicationCount,
            createTime: detailItem.createTime
        };
        return [
            BuildFieldGridSection("鏍稿績瀛楁锛堝惈涓枃璇存槑锛?, summaryFieldMap, CORE_FIELD_META.TEAM_RECRUITMENT),
            BuildLivePreviewSection("瀹屾暣甯栧瓙棰勮", BuildRecruitmentPreviewUrl(taskItem, detailItem), "鍙洿鎺ュ湪瀹℃牳椤垫煡鐪嬪笘瀛愯鎯呴瑙堛€?),
            BuildTextSection("鎶€鑳借姹?, detailItem.skillRequirement || "鏈～鍐?),
            BuildObjectSection("瀹屾暣瀛楁锛堣鎯呮帴鍙ｏ級", detailItem),
            BuildObjectSection("瀹屾暣瀛楁锛堝緟瀹″揩鐓э級", taskItem.rawItem || {})
        ].join("");
    }

    function BuildMaterialDetailHtml(taskItem, detailItem) {
        const uploaderDisplayName = ResolveMaterialUploaderDisplayName(
            detailItem,
            taskItem && taskItem.rawItem
        );
        const summaryFieldMap = {
            materialId: detailItem.materialId,
            courseName: detailItem.courseName,
            uploaderUserId: detailItem.uploaderUserId,
            uploaderDisplayName: uploaderDisplayName,
            materialStatus: detailItem.materialStatus,
            fileType: detailItem.fileType,
            fileSizeBytes: FormatFileSize(detailItem.fileSizeBytes),
            downloadCostPoints: detailItem.downloadCostPoints,
            downloadCount: detailItem.downloadCount,
            copyrightDeclared: detailItem.copyrightDeclared,
            createTime: detailItem.createTime
        };
        const tagText = Array.isArray(detailItem.tags) ? detailItem.tags.join(" / ") : "";
        const fileUrl = BuildPublicFileUrl(detailItem && detailItem.fileId);
        return [
            BuildFieldGridSection("鏍稿績瀛楁锛堝惈涓枃璇存槑锛?, summaryFieldMap, CORE_FIELD_META.MATERIAL),
            BuildImagePreviewSection("璧勬枡鍥剧墖棰勮锛堟敮鎸佹斁澶э級", BuildMaterialImageUrlList(taskItem, detailItem)),
            BuildLivePreviewSection("璧勬枡鏂囦欢棰勮", fileUrl, "鑻ユ枃浠朵负鍥剧墖/PDF锛屽彲鐩存帴鎵撳紑杩涜鏍搁獙銆?),
            BuildTextSection("璧勬枡绠€浠?, detailItem.description || "鏆傛棤璧勬枡绠€浠?),
            BuildTextSection("鏍囩", tagText || "-"),
            BuildObjectSection("瀹屾暣瀛楁锛堣鎯呮帴鍙ｏ級", detailItem),
            BuildObjectSection("瀹屾暣瀛楁锛堝緟瀹″揩鐓э級", taskItem.rawItem || {})
        ].join("");
    }

    function BuildUserAvatarDetailHtml(taskItem, detailItem) {
        const pendingAvatarUrl = String(detailItem.pendingAvatarUrl || "").trim();
        const currentAvatarUrl = String(detailItem.avatarUrl || "").trim();
        const previewHtml = pendingAvatarUrl
            ? `<img src="${EscapeHtml(pendingAvatarUrl)}" alt="寰呭鏍稿ご鍍? class="h-32 w-32 rounded-2xl object-cover ring-1 ring-outline/30"/>`
            : "<div class=\"h-32 w-32 rounded-2xl bg-surface-container flex items-center justify-center text-sm text-slate-500\">鏃犲緟瀹″ご鍍?/div>";
        const currentHtml = currentAvatarUrl
            ? `<img src="${EscapeHtml(currentAvatarUrl)}" alt="褰撳墠澶村儚" class="h-20 w-20 rounded-xl object-cover ring-1 ring-outline/30"/>`
            : "<div class=\"h-20 w-20 rounded-xl bg-surface-container flex items-center justify-center text-sm text-slate-500\">榛樿澶村儚</div>";
        return [
            "<article class=\"rounded-xl bg-surface-container-low p-5 ring-1 ring-outline/20\">",
            "<h3 class=\"text-sm font-bold mb-4\">澶村儚瀹℃牳棰勮</h3>",
            "<div class=\"grid gap-5 sm:grid-cols-2\">",
            "<div>",
            "<p class=\"mb-3 text-xs font-semibold text-slate-500\">寰呭鏍稿ご鍍?/p>",
            previewHtml,
            "</div>",
            "<div>",
            "<p class=\"mb-3 text-xs font-semibold text-slate-500\">褰撳墠灞曠ず澶村儚</p>",
            currentHtml,
            "</div>",
            "</div>",
            "</article>",
            BuildFieldGridSection("鐢ㄦ埛淇℃伅", {
                userId: detailItem.userId,
                account: detailItem.account,
                displayName: detailItem.displayName,
                avatarReviewStatus: detailItem.avatarReviewStatus,
                avatarReviewSubmitTime: FormatTime(detailItem.avatarReviewSubmitTime)
            }, {
                userId: { label: "鐢ㄦ埛ID", note: "鐢ㄦ埛鍞竴鏍囪瘑" },
                account: { label: "璐﹀彿", note: "鐧诲綍璐﹀彿" },
                displayName: { label: "鏄电О", note: "鍓嶅彴灞曠ず鍚嶇О" },
                avatarReviewStatus: { label: "澶村儚瀹℃牳鐘舵€?, note: "褰撳墠澶村儚鎻愪氦鐘舵€? },
                avatarReviewSubmitTime: { label: "澶村儚鎻愪氦鏃堕棿", note: "鐢ㄦ埛涓婁紶澶村儚鐨勬椂闂? }
            }),
            BuildObjectSection("瀹屾暣瀛楁锛堝緟瀹″揩鐓э級", taskItem.rawItem || detailItem || {})
        ].join("");
    }

    function BuildUserDetailHtml(taskItem, detailItem) {
        const registerTime = detailItem.registerTime || detailItem.createTime || taskItem.createTime;
        const summaryFieldMap = {
            userId: detailItem.userId,
            account: detailItem.account,
            displayName: detailItem.displayName,
            college: detailItem.college,
            grade: detailItem.grade,
            phone: detailItem.phone,
            email: detailItem.email,
            userRole: detailItem.userRole,
            userStatus: detailItem.userStatus,
            pointBalance: detailItem.pointBalance,
            registerTime: FormatTime(registerTime),
            lastLoginTime: FormatTime(detailItem.lastLoginTime)
        };
        const contactText = ResolveUserPrimaryContact(detailItem);
        const statusText = ResolveUserStatusText(detailItem.userStatus);
        return [
            BuildFieldGridSection("鏍稿績瀛楁锛堝惈涓枃璇存槑锛?, summaryFieldMap, CORE_FIELD_META.USER),
            BuildTextSection("娉ㄥ唽瀹℃牳璇存槑", `璐﹀彿鐘舵€侊細${statusText}\n涓昏仈绯绘柟寮忥細${contactText}`),
            BuildObjectSection("瀹屾暣瀛楁锛堝緟瀹″揩鐓э級", taskItem.rawItem || detailItem || {})
        ].join("");
    }

    function BuildFieldGridSection(title, fieldMap, fieldMetaMap) {
        const safeFieldMap = fieldMap || {};
        const metaMap = fieldMetaMap || {};
        const rowHtml = Object.keys(safeFieldMap).map(function BuildRow(fieldKey) {
            const fieldMeta = metaMap[fieldKey] || { label: fieldKey, note: "瀛楁璇存槑鏈厤缃? };
            return [
                "<div class=\"py-3 border-b border-outline/20 grid grid-cols-[220px_1fr] gap-3 text-sm\">",
                "<dt class=\"text-slate-500 break-all\">",
                `<p class="font-semibold text-slate-700">${EscapeHtml(fieldMeta.label)}</p>`,
                `<p class="text-xs mt-1">${EscapeHtml(fieldMeta.note)}</p>`,
                "</dt>",
                `<dd class="font-semibold text-slate-800 break-all">${EscapeHtml(FormatValue(safeFieldMap[fieldKey]))}</dd>`,
                "</div>"
            ].join("");
        }).join("");
        return [
            "<article class=\"rounded-xl bg-surface-container-low p-5 ring-1 ring-outline/20\">",
            `<h3 class="text-sm font-bold mb-3">${EscapeHtml(title)}</h3>`,
            "<dl>",
            rowHtml || "<div class=\"text-sm text-slate-500\">鏃犳暟鎹?/div>",
            "</dl>",
            "</article>"
        ].join("");
    }

    function BuildTextSection(title, textValue) {
        return [
            "<article class=\"rounded-xl bg-surface-container-low p-5 ring-1 ring-outline/20\">",
            `<h3 class="text-sm font-bold mb-3">${EscapeHtml(title)}</h3>`,
            `<p class="text-sm text-slate-700 leading-7 whitespace-pre-wrap">${EscapeHtml(textValue || "-")}</p>`,
            "</article>"
        ].join("");
    }

    function BuildImagePreviewSection(title, imageUrlList) {
        const safeImageUrlList = Array.isArray(imageUrlList) ? imageUrlList.filter(Boolean) : [];
        if (!safeImageUrlList.length) {
            return BuildTextSection(title, "鏈娴嬪埌鍙瑙堝浘鐗?);
        }
        const thumbnailHtml = safeImageUrlList.map(function BuildThumbnail(imageUrl, index) {
            const imageTitle = `鍥剧墖 ${index + 1}`;
            return [
                `<button type="button" class="group relative overflow-hidden rounded-xl ring-1 ring-outline/20 hover:ring-primary/60 transition-all aspect-square bg-white" data-review-image-preview data-preview-src="${EscapeHtml(imageUrl)}" data-preview-title="${EscapeHtml(imageTitle)}">`,
                `<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" src="${EscapeHtml(imageUrl)}" alt="${EscapeHtml(imageTitle)}"/>`,
                "<span class=\"absolute right-2 top-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/65 text-white text-[10px]\">",
                "<span class=\"material-symbols-outlined !text-xs\">zoom_in</span>鏀惧ぇ",
                "</span>",
                "</button>"
            ].join("");
        }).join("");
        return [
            "<article class=\"rounded-xl bg-surface-container-low p-5 ring-1 ring-outline/20\">",
            `<h3 class="text-sm font-bold mb-3">${EscapeHtml(title)}</h3>`,
            "<div class=\"grid grid-cols-2 lg:grid-cols-3 gap-3\">",
            thumbnailHtml,
            "</div>",
            "<p class=\"text-xs text-slate-500 mt-3\">鐐瑰嚮缂╃暐鍥惧彲鏌ョ湅澶у浘銆?/p>",
            "</article>"
        ].join("");
    }

    function BuildLivePreviewSection(title, previewUrl, descriptionText) {
        const safeUrl = String(previewUrl || "").trim();
        if (!safeUrl) {
            return BuildTextSection(title, "褰撳墠鍐呭鏆傛棤鍙敤棰勮鍦板潃");
        }
        return [
            "<article class=\"rounded-xl bg-surface-container-low p-5 ring-1 ring-outline/20\">",
            "<div class=\"flex items-center justify-between gap-3 mb-3\">",
            `<h3 class="text-sm font-bold">${EscapeHtml(title)}</h3>`,
            `<a href="${EscapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-95 transition-opacity"><span class="material-symbols-outlined !text-sm">open_in_new</span>鏂扮獥鍙ｆ墦寮€</a>`,
            "</div>",
            `<p class="text-xs text-slate-500 mb-3">${EscapeHtml(descriptionText || "")}</p>`,
            `<div class="rounded-xl overflow-hidden ring-1 ring-outline/20 bg-white"><iframe src="${EscapeHtml(safeUrl)}" loading="lazy" class="w-full h-[520px] bg-white"></iframe></div>`,
            "</article>"
        ].join("");
    }

    function BuildObjectSection(title, objectValue) {
        const normalizedObject = objectValue && typeof objectValue === "object" ? objectValue : {};
        const keyList = Object.keys(normalizedObject).sort();
        const keyValueRows = keyList.map(function BuildRow(key) {
            return [
                "<div class=\"py-2 border-b border-outline/20 grid grid-cols-[220px_1fr] gap-3 text-sm\">",
                `<div class="text-slate-500 break-all">${EscapeHtml(key)}</div>`,
                `<div class="font-semibold text-slate-800 break-all">${EscapeHtml(FormatValue(normalizedObject[key]))}</div>`,
                "</div>"
            ].join("");
        }).join("");
        const jsonText = JSON.stringify(normalizedObject, null, 2);
        return [
            "<article class=\"rounded-xl bg-surface-container-low p-5 ring-1 ring-outline/20\">",
            `<h3 class="text-sm font-bold mb-3">${EscapeHtml(title)}</h3>`,
            "<div class=\"mb-4\">",
            keyValueRows || "<div class=\"text-sm text-slate-500\">鏃犲瓧娈?/div>",
            "</div>",
            "<details class=\"rounded-lg bg-white ring-1 ring-outline/20 p-3\">",
            "<summary class=\"cursor-pointer text-sm font-semibold text-slate-700\">鏌ョ湅瀹屾暣 JSON</summary>",
            `<pre class="mt-3 text-xs text-slate-700 whitespace-pre-wrap break-all">${EscapeHtml(jsonText || "{}")}</pre>`,
            "</details>",
            "</article>"
        ].join("");
    }

    function BuildProductPreviewUrl(taskItem, detailItem) {
        const productId = SafeNumber((detailItem && detailItem.productId) || (taskItem && taskItem.taskId));
        return productId > 0 ? `/pages/market_item_detail.html?productId=${encodeURIComponent(String(productId))}` : "";
    }

    function BuildRecruitmentPreviewUrl(taskItem, detailItem) {
        const recruitmentId = SafeNumber((detailItem && detailItem.recruitmentId) || (taskItem && taskItem.taskId));
        if (recruitmentId <= 0) {
            return "/pages/team_post_preview.html";
        }
        return `/pages/team_post_preview.html?recruitmentId=${encodeURIComponent(String(recruitmentId))}`;
    }

    function BuildProductImageUrlList(taskItem, detailItem) {
        const detailImageIds = detailItem && Array.isArray(detailItem.imageFileIds) ? detailItem.imageFileIds : [];
        const rawImageIds = taskItem && taskItem.rawItem && Array.isArray(taskItem.rawItem.imageFileIds)
            ? taskItem.rawItem.imageFileIds
            : [];
        return BuildPublicFileUrlList(detailImageIds.concat(rawImageIds));
    }

    function BuildMaterialImageUrlList(taskItem, detailItem) {
        const fileTypeText = String((detailItem && detailItem.fileType) || "").trim().toLowerCase();
        const candidateFileIds = [];
        CollectCandidateFileId(candidateFileIds, detailItem && detailItem.fileId);
        CollectCandidateFileId(candidateFileIds, detailItem && detailItem.previewFileId);
        CollectCandidateFileId(candidateFileIds, detailItem && detailItem.coverFileId);
        CollectCandidateFileId(candidateFileIds, taskItem && taskItem.rawItem && taskItem.rawItem.fileId);
        CollectCandidateFileId(candidateFileIds, taskItem && taskItem.rawItem && taskItem.rawItem.previewFileId);

        return candidateFileIds
            .filter(function FilterImageFile(fileId) {
                return LooksLikeImageByTypeOrFileId(fileTypeText, fileId);
            })
            .map(function BuildUrl(fileId) {
                return BuildPublicFileUrl(fileId);
            })
            .filter(Boolean);
    }

    function CollectCandidateFileId(resultList, fileId) {
        const safeFileId = String(fileId || "").trim();
        if (!safeFileId) {
            return;
        }
        if (resultList.includes(safeFileId)) {
            return;
        }
        resultList.push(safeFileId);
    }

    function LooksLikeImageByTypeOrFileId(fileTypeText, fileId) {
        const safeTypeText = String(fileTypeText || "").trim().toLowerCase();
        if (safeTypeText.startsWith("image/")) {
            return true;
        }
        if (safeTypeText.includes("png") || safeTypeText.includes("jpg") || safeTypeText.includes("jpeg")
            || safeTypeText.includes("webp") || safeTypeText.includes("gif") || safeTypeText.includes("bmp")) {
            return true;
        }
        const safeFileId = String(fileId || "").trim().toLowerCase();
        return IMAGE_FILE_EXTENSIONS.some(function MatchExtension(extension) {
            return safeFileId.endsWith(extension);
        });
    }

    function BuildPublicFileUrlList(fileIdList) {
        const safeFileIdList = Array.isArray(fileIdList) ? fileIdList : [];
        return safeFileIdList
            .map(function MapFileId(fileId) {
                return BuildPublicFileUrl(fileId);
            })
            .filter(Boolean)
            .filter(function KeepUnique(url, index, list) {
                return list.indexOf(url) === index;
            });
    }

    function BuildPublicFileUrl(fileId) {
        const safeFileId = String(fileId || "").trim();
        if (!safeFileId) {
            return "";
        }
        if (!window.CampusShareApi || !window.CampusShareApi.BuildPublicFileUrl) {
            return "";
        }
        return window.CampusShareApi.BuildPublicFileUrl(safeFileId) || "";
    }

    function ResolveMaterialUploaderDisplayName() {
        for (let index = 0; index < arguments.length; index += 1) {
            const source = arguments[index];
            if (!source || typeof source !== "object") {
                continue;
            }
            const candidateList = [
                source.uploaderDisplayName,
                source.uploaderName,
                source.uploaderNickname,
                source.publisherDisplayName,
                source.publisherName
            ];
            for (let candidateIndex = 0; candidateIndex < candidateList.length; candidateIndex += 1) {
                const candidateText = String(candidateList[candidateIndex] || "").trim();
                if (candidateText) {
                    return candidateText;
                }
            }
            const uploaderUserId = SafeNumber(source.uploaderUserId);
            if (uploaderUserId > 0) {
                return `鐢ㄦ埛#${uploaderUserId}`;
            }
        }
        return "";
    }

    function EnsureImagePreviewModal() {
        let modalNode = document.getElementById("admin-review-image-preview-modal");
        if (!modalNode) {
            modalNode = document.createElement("div");
            modalNode.id = "admin-review-image-preview-modal";
            modalNode.className = "fixed inset-0 z-[1200] bg-black/70 hidden items-center justify-center p-6";
            modalNode.innerHTML = [
                "<div class=\"relative w-full max-w-6xl max-h-full bg-black/40 rounded-2xl p-4 ring-1 ring-white/20\">",
                "<button type=\"button\" data-review-preview-close class=\"absolute right-4 top-4 w-9 h-9 rounded-full bg-white/90 text-slate-700 hover:bg-white transition-colors inline-flex items-center justify-center\">",
                "<span class=\"material-symbols-outlined\">close</span>",
                "</button>",
                "<div class=\"w-full h-full flex flex-col\">",
                "<p class=\"text-white text-sm mb-3\" data-review-preview-caption>鍥剧墖棰勮</p>",
                "<div class=\"flex-1 min-h-0 overflow-auto rounded-xl bg-black/30\">",
                "<img data-review-preview-image class=\"mx-auto max-w-full max-h-[78vh] object-contain\" src=\"\" alt=\"棰勮鍥剧墖\"/>",
                "</div>",
                "</div>",
                "</div>"
            ].join("");
            document.body.appendChild(modalNode);
        }

        const imageNode = modalNode.querySelector("[data-review-preview-image]");
        const captionNode = modalNode.querySelector("[data-review-preview-caption]");
        const closeButton = modalNode.querySelector("[data-review-preview-close]");

        if (!modalNode.getAttribute("data-bound")) {
            modalNode.setAttribute("data-bound", "1");
            modalNode.addEventListener("click", function HandleBackdropClick(event) {
                if (event.target === modalNode) {
                    CloseImagePreviewModal({ container: modalNode, image: imageNode });
                }
            });
            if (closeButton) {
                closeButton.addEventListener("click", function HandleCloseClick() {
                    CloseImagePreviewModal({ container: modalNode, image: imageNode });
                });
            }
            window.addEventListener("keydown", function HandleEsc(event) {
                if (event.key === "Escape" && !modalNode.classList.contains("hidden")) {
                    CloseImagePreviewModal({ container: modalNode, image: imageNode });
                }
            });
        }

        return {
            container: modalNode,
            image: imageNode,
            caption: captionNode
        };
    }

    function OpenImagePreviewModal(modalRef, imageUrl, titleText) {
        if (!modalRef || !modalRef.container || !modalRef.image) {
            return;
        }
        modalRef.image.src = imageUrl;
        if (modalRef.caption) {
            modalRef.caption.textContent = titleText || "鍥剧墖棰勮";
        }
        modalRef.container.classList.remove("hidden");
        modalRef.container.classList.add("flex");
    }

    function CloseImagePreviewModal(modalRef) {
        if (!modalRef || !modalRef.container) {
            return;
        }
        modalRef.container.classList.add("hidden");
        modalRef.container.classList.remove("flex");
        if (modalRef.image) {
            modalRef.image.src = "";
        }
    }

    function EnsureDecisionConfirmModal() {
        let modalNode = document.getElementById("admin-review-decision-confirm-modal");
        if (!modalNode) {
            modalNode = document.createElement("div");
            modalNode.id = "admin-review-decision-confirm-modal";
            modalNode.className = "fixed inset-0 z-[1250] bg-black/45 hidden items-center justify-center p-4";
            modalNode.innerHTML = [
                "<div class=\"w-full max-w-md rounded-2xl bg-white ring-1 ring-outline/30 shadow-soft overflow-hidden\">",
                "<div class=\"px-5 py-4 border-b border-outline/20 flex items-center justify-between\">",
                "<p class=\"text-base font-extrabold\" data-review-confirm-title>纭鎿嶄綔</p>",
                "<button type=\"button\" data-review-confirm-close class=\"w-8 h-8 rounded-full bg-surface-container-low text-slate-600 hover:bg-surface-container inline-flex items-center justify-center\">",
                "<span class=\"material-symbols-outlined !text-lg\">close</span>",
                "</button>",
                "</div>",
                "<div class=\"px-5 py-5\">",
                "<div class=\"flex items-start gap-3\">",
                "<div data-review-confirm-icon-badge class=\"w-10 h-10 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center shrink-0\">",
                "<span class=\"material-symbols-outlined\" data-review-confirm-icon>task_alt</span>",
                "</div>",
                "<div>",
                "<p class=\"text-sm text-slate-700 leading-6\" data-review-confirm-message>璇风‘璁ゆ槸鍚︾户缁瀹℃牳鎿嶄綔銆?/p>",
                "</div>",
                "</div>",
                "</div>",
                "<div class=\"px-5 py-4 border-t border-outline/20 bg-surface-container-low flex items-center justify-end gap-3\">",
                "<button type=\"button\" data-review-confirm-cancel class=\"px-4 py-2 rounded-lg bg-white ring-1 ring-outline/30 text-sm font-semibold text-slate-700 hover:bg-surface\">鍙栨秷</button>",
                "<button type=\"button\" data-review-confirm-submit class=\"px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-95 transition-opacity\">纭</button>",
                "</div>",
                "</div>"
            ].join("");
            document.body.appendChild(modalNode);
        }

        const modalRef = {
            container: modalNode,
            title: modalNode.querySelector("[data-review-confirm-title]"),
            message: modalNode.querySelector("[data-review-confirm-message]"),
            iconBadge: modalNode.querySelector("[data-review-confirm-icon-badge]"),
            icon: modalNode.querySelector("[data-review-confirm-icon]"),
            closeButton: modalNode.querySelector("[data-review-confirm-close]"),
            cancelButton: modalNode.querySelector("[data-review-confirm-cancel]"),
            submitButton: modalNode.querySelector("[data-review-confirm-submit]"),
            resolveCallback: null
        };

        if (!modalNode.getAttribute("data-bound")) {
            modalNode.setAttribute("data-bound", "1");
            modalNode.addEventListener("click", function HandleBackdropClick(event) {
                if (event.target === modalNode) {
                    ResolveDecisionConfirmModal(modalRef, false);
                }
            });
            if (modalRef.closeButton) {
                modalRef.closeButton.addEventListener("click", function HandleCloseClick() {
                    ResolveDecisionConfirmModal(modalRef, false);
                });
            }
            if (modalRef.cancelButton) {
                modalRef.cancelButton.addEventListener("click", function HandleCancelClick() {
                    ResolveDecisionConfirmModal(modalRef, false);
                });
            }
            if (modalRef.submitButton) {
                modalRef.submitButton.addEventListener("click", function HandleSubmitClick() {
                    ResolveDecisionConfirmModal(modalRef, true);
                });
            }
            window.addEventListener("keydown", function HandleEsc(event) {
                if (event.key === "Escape" && !modalNode.classList.contains("hidden")) {
                    ResolveDecisionConfirmModal(modalRef, false);
                }
            });
        }

        return modalRef;
    }

    function OpenDecisionConfirmModal(modalRef, options) {
        if (!modalRef || !modalRef.container) {
            return Promise.resolve(false);
        }
        if (typeof modalRef.resolveCallback === "function") {
            modalRef.resolveCallback(false);
            modalRef.resolveCallback = null;
        }

        const safeOptions = options || {};
        const isApprove = !!safeOptions.approved;
        const titleText = String(safeOptions.title || "纭鎿嶄綔").trim();
        const messageText = String(safeOptions.message || "璇风‘璁ゆ槸鍚︾户缁瀹℃牳鎿嶄綔銆?).trim();
        const confirmText = String(safeOptions.confirmText || "纭").trim();

        if (modalRef.title) {
            modalRef.title.textContent = titleText;
        }
        if (modalRef.message) {
            modalRef.message.textContent = messageText;
        }
        if (modalRef.submitButton) {
            modalRef.submitButton.textContent = confirmText;
            modalRef.submitButton.classList.remove("bg-primary", "bg-red-700");
            modalRef.submitButton.classList.add(isApprove ? "bg-primary" : "bg-red-700");
        }
        if (modalRef.iconBadge) {
            modalRef.iconBadge.classList.remove("bg-primary/10", "text-primary", "bg-red-100", "text-red-700");
            modalRef.iconBadge.classList.add(isApprove ? "bg-primary/10" : "bg-red-100");
            modalRef.iconBadge.classList.add(isApprove ? "text-primary" : "text-red-700");
        }
        if (modalRef.icon) {
            modalRef.icon.textContent = isApprove ? "task_alt" : "warning";
        }

        modalRef.container.classList.remove("hidden");
        modalRef.container.classList.add("flex");
        if (modalRef.submitButton) {
            modalRef.submitButton.focus();
        }

        return new Promise(function WaitUserConfirm(resolve) {
            modalRef.resolveCallback = resolve;
        });
    }

    function ResolveDecisionConfirmModal(modalRef, confirmed) {
        if (!modalRef || !modalRef.container) {
            return;
        }
        modalRef.container.classList.add("hidden");
        modalRef.container.classList.remove("flex");
        const resolveCallback = modalRef.resolveCallback;
        modalRef.resolveCallback = null;
        if (typeof resolveCallback === "function") {
            resolveCallback(!!confirmed);
        }
    }

    async function SubmitDecision(refs, state, messageBar, approved) {
        HideDecisionHint(refs.decisionHintNode);
        messageBar = null;
        const selectedTask = GetSelectedTask(state, state.filteredTaskList);
        if (!selectedTask) {
            ShowDecisionHint(refs.decisionHintNode, "璇峰厛閫夋嫨瀹℃牳浠诲姟", "error");
            ShowError(messageBar, "璇峰厛閫夋嫨瀹℃牳浠诲姟");
            return;
        }

        const reviewRemark = String(refs.reviewNoteInput ? refs.reviewNoteInput.value || "" : "").trim();
        if (!approved && !reviewRemark) {
            ShowDecisionHint(refs.decisionHintNode, "椹冲洖鏃惰濉啓瀹℃牳鎰忚", "error");
            ShowError(messageBar, "椹冲洖鏃惰濉啓瀹℃牳鎰忚");
            return;
        }
        const confirmed = await OpenDecisionConfirmModal(refs.decisionConfirmModal, {
            approved: approved,
            title: approved ? "纭閫氳繃璇ュ唴瀹癸紵" : "纭椹冲洖璇ュ唴瀹癸紵",
            message: approved
                ? "閫氳繃鍚庤鍐呭灏嗗彂甯冨埌鍓嶅彴锛屾槸鍚︾户缁紵"
                : "椹冲洖鍚庡彂甯冭€呭皢鏀跺埌椹冲洖閫氱煡锛屾槸鍚︾户缁紵",
            confirmText: approved ? "纭閫氳繃" : "纭椹冲洖"
        });
        if (!confirmed) {
            return;
        }

        ToggleActionDisabled(refs, true);
        try {
            if (selectedTask.taskType === "PRODUCT") {
                await window.CampusShareApi.ReviewProductByAdmin(
                    selectedTask.taskId,
                    approved,
                    reviewRemark || (approved ? "鍐呭瀹℃牳閫氳繃" : "鍐呭瀹℃牳椹冲洖")
                );
            } else if (selectedTask.taskType === "MATERIAL") {
                await window.CampusShareApi.ReviewMaterial(
                    selectedTask.taskId,
                    approved,
                    reviewRemark || (approved ? "鍐呭瀹℃牳閫氳繃" : "鍐呭瀹℃牳椹冲洖")
                );
            } else if (selectedTask.taskType === "USER_AVATAR") {
                await window.CampusShareApi.ReviewUserAvatar(
                    selectedTask.taskId,
                    approved,
                    reviewRemark || (approved ? "澶村儚瀹℃牳閫氳繃" : "澶村儚瀹℃牳椹冲洖")
                );
            } else if (selectedTask.taskType === "USER") {
                await window.CampusShareApi.ReviewUser(
                    selectedTask.taskId,
                    approved,
                    reviewRemark || (approved ? "鐢ㄦ埛娉ㄥ唽瀹℃牳閫氳繃" : "鐢ㄦ埛娉ㄥ唽瀹℃牳椹冲洖")
                );
            } else {
                await window.CampusShareApi.ReviewTeamRecruitmentByAdmin(
                    selectedTask.taskId,
                    approved,
                    reviewRemark || (approved ? "鍐呭瀹℃牳閫氳繃" : "鍐呭瀹℃牳椹冲洖")
                );
            }

            state.processedCount += 1;
            RemoveTaskAndSelectNext(state, selectedTask);
            if (refs.reviewNoteInput) refs.reviewNoteInput.value = "";
            if (refs.rejectTemplateSelect) refs.rejectTemplateSelect.value = "";
            ShowSuccess(messageBar, approved ? "瀹℃牳宸查€氳繃" : "瀹℃牳宸查┏鍥?);
            ShowDecisionHint(refs.decisionHintNode, approved ? "瀹℃牳宸查€氳繃" : "瀹℃牳宸查┏鍥?, "success");
            RenderAll(refs, state);
        } catch (error) {
            ShowDecisionHint(refs.decisionHintNode, error instanceof Error ? error.message : "瀹℃牳鎿嶄綔澶辫触", "error");
            ShowError(messageBar, error instanceof Error ? error.message : "瀹℃牳鎿嶄綔澶辫触");
        } finally {
            ToggleActionDisabled(refs, false);
        }
    }

    function RemoveTaskAndSelectNext(state, selectedTask) {
        const selectedKey = BuildTaskKey(selectedTask);
        const currentFilteredList = FilterTaskList(state);
        const selectedIndex = currentFilteredList.findIndex(function FindSelected(item) {
            return BuildTaskKey(item) === selectedKey;
        });

        state.taskList = state.taskList.filter(function FilterTask(item) {
            return BuildTaskKey(item) !== selectedKey;
        });
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
        const taskList = state.filteredTaskList;
        if (!Array.isArray(taskList) || !taskList.length || !state.selectedTaskKey) {
            return;
        }
        const currentIndex = taskList.findIndex(function FindSelected(item) {
            return BuildTaskKey(item) === state.selectedTaskKey;
        });
        if (currentIndex < 0) {
            return;
        }
        const targetIndex = currentIndex + offset;
        if (targetIndex < 0 || targetIndex >= taskList.length) {
            return;
        }
        state.selectedTaskKey = BuildTaskKey(taskList[targetIndex]);
    }

    function GetSelectedTask(state, taskList) {
        const safeTaskList = Array.isArray(taskList) ? taskList : [];
        if (!state.selectedTaskKey) {
            return null;
        }
        return safeTaskList.find(function MatchSelected(item) {
            return BuildTaskKey(item) === state.selectedTaskKey;
        }) || null;
    }

    function BuildTaskKey(taskItem) {
        return `${taskItem.taskType}:${taskItem.taskId}`;
    }

    function ToggleActionDisabled(refs, disabled) {
        [refs.prevButton, refs.nextButton, refs.approveButton, refs.rejectButton]
            .filter(Boolean)
            .forEach(function Toggle(buttonNode) {
                buttonNode.disabled = !!disabled;
            });
    }

    function ResolveUserPrimaryContact(userItem) {
        const safeItem = userItem || {};
        const phoneText = String(safeItem.phone || "").trim();
        if (phoneText) {
            return phoneText;
        }
        const emailText = String(safeItem.email || "").trim();
        if (emailText) {
            return emailText;
        }
        return "-";
    }

    function ResolveUserStatusText(userStatus) {
        const statusText = String(userStatus || "").toUpperCase();
        if (statusText === "PENDING_REVIEW") return "寰呭鏍?;
        if (statusText === "ACTIVE") return "宸插惎鐢?;
        if (statusText === "FROZEN") return "宸插喕缁?;
        if (statusText === "REJECTED") return "宸查┏鍥?;
        return statusText || "寰呭鏍?;
    }

    function FormatValue(value) {
        if (value == null) return "-";
        if (typeof value === "boolean") return value ? "鏄? : "鍚?;
        if (Array.isArray(value)) {
            if (!value.length) return "[]";
            return value.map(function MapItem(item) {
                return typeof item === "object" ? JSON.stringify(item) : String(item);
            }).join(", ");
        }
        if (typeof value === "object") return JSON.stringify(value);
        if (value === "") return "(绌?";
        return String(value);
    }

    function FormatPrice(value) {
        const numberValue = Number(value);
        return Number.isNaN(numberValue) ? "0.00" : numberValue.toFixed(2);
    }

    function FormatFileSize(value) {
        const size = Number(value || 0);
        if (Number.isNaN(size) || size <= 0) {
            return "-";
        }
        if (size < 1024) {
            return `${Math.floor(size)} B`;
        }
        if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(2)} KB`;
        }
        if (size < 1024 * 1024 * 1024) {
            return `${(size / (1024 * 1024)).toFixed(2)} MB`;
        }
        return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    function ResolveTimeValue(timeText) {
        const dateValue = new Date(timeText || "");
        return Number.isNaN(dateValue.getTime()) ? 0 : dateValue.getTime();
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

    function EnsureDecisionHintNode(decisionPanelNode) {
        if (!decisionPanelNode) {
            return null;
        }
        let hintNode = decisionPanelNode.querySelector("[data-review-decision-hint]");
        if (!hintNode) {
            hintNode = document.createElement("div");
            hintNode.setAttribute("data-review-decision-hint", "1");
            hintNode.className = "hidden mt-4 rounded-xl px-4 py-3 text-sm font-semibold";
            const panelScrollNode = decisionPanelNode.querySelector(".review-scrollbar");
            if (panelScrollNode) {
                panelScrollNode.appendChild(hintNode);
            } else {
                decisionPanelNode.appendChild(hintNode);
            }
        }
        return hintNode;
    }

    function ShowDecisionHint(hintNode, messageText, messageType) {
        if (!hintNode) {
            return;
        }
        hintNode.classList.remove(
            "hidden",
            "bg-red-50", "text-red-700", "ring-1", "ring-red-200",
            "bg-green-50", "text-green-700", "ring-green-200"
        );
        if (messageType === "success") {
            hintNode.classList.add("bg-green-50", "text-green-700", "ring-1", "ring-green-200");
        } else {
            hintNode.classList.add("bg-red-50", "text-red-700", "ring-1", "ring-red-200");
        }
        hintNode.textContent = messageText || "";
    }

    function HideDecisionHint(hintNode) {
        if (!hintNode) {
            return;
        }
        hintNode.classList.add("hidden");
        hintNode.textContent = "";
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

    function EscapeHtml(text) {
        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
})();

