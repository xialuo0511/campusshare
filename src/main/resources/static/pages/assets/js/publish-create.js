/**
 * 发布页面逻辑
 */
(function InitPublishCreatePage() {
    const PRODUCT_IMAGE_ACCEPT = ".jpg,.jpeg,.png";
    const MATERIAL_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png";
    const PUBLISH_PAGE_PATH = "/pages/publish_create.html";

    const MODE_PRODUCT = "product";
    const MODE_MATERIAL = "material";
    const MODE_RECRUITMENT = "recruitment";

    /**
     * 页面初始化
     */
    async function BindPublishPage() {
        if (!window.CampusShareApi) {
            return;
        }

        const publishForm = document.querySelector("[data-role='publish-form']");
        if (!publishForm) {
            return;
        }

        const view = BuildView(publishForm);
        if (!view.submitButton) {
            return;
        }

        const mode = ResolvePublishMode();
        const isEditMode = mode === MODE_PRODUCT && ResolveEditingProductId() > 0;
        const messageBar = BuildMessageBar(publishForm);
        const uploadTipText = CreateUploadTip(view.uploadPanel);
        const hiddenFileInput = BuildHiddenFileInput(publishForm);
        const browseFileButton = view.browseFileButton;
        const editingProductId = ResolveEditingProductId();

        ApplyModeUi(mode, view, isEditMode);

        if (!window.CampusShareApi.GetAuthToken()) {
            ShowError(messageBar, "请先登录后再发布内容");
            window.setTimeout(function RedirectToAuthPage() {
                if (window.CampusShareApi.RedirectToAuthPage) {
                    window.CampusShareApi.RedirectToAuthPage(ResolveCurrentPagePathWithQuery());
                    return;
                }
                window.location.href = "/pages/auth_access.html?redirect=%2Fpages%2Fpublish_create.html";
            }, 700);
            return;
        }

        const currentProfile = await ResolveCurrentProfile();
        if ((mode === MODE_PRODUCT || isEditMode) && !HasPublishPermission(currentProfile)) {
            ShowError(messageBar, "当前账号未通过认证卖家审核，暂不能发布商品");
            view.submitButton.disabled = true;
            view.submitButton.classList.add("opacity-70");
            return;
        }

        let selectedCondition = "";
        let uploadedFileMeta = null;
        let existingImageFileIdList = [];
        let isUploadingFile = false;

        if (mode === MODE_PRODUCT) {
            selectedCondition = ApplyConditionSelection(view.conditionButtonList, "");
        } else {
            view.conditionSection.classList.add("hidden");
        }

        view.conditionButtonList.forEach(function BindConditionButton(button) {
            button.addEventListener("click", function HandleConditionClick() {
                selectedCondition = ApplyConditionSelection(view.conditionButtonList, button.textContent || "");
                HideMessage(messageBar);
            });
        });

        if (browseFileButton && hiddenFileInput) {
            browseFileButton.addEventListener("click", function HandleBrowseFile() {
                hiddenFileInput.click();
            });
            hiddenFileInput.addEventListener("change", function HandleFileChange() {
                const selectedFile = hiddenFileInput.files && hiddenFileInput.files[0]
                    ? hiddenFileInput.files[0]
                    : null;
                UploadSelectedFile(selectedFile);
            });
        }
        BindDropUpload(view.uploadPanel, hiddenFileInput, UploadSelectedFile);

        if (isEditMode) {
            await LoadEditDraft();
        } else {
            SetUploadTip(uploadTipText, mode === MODE_RECRUITMENT ? "招募发布无需上传文件" : "尚未上传文件");
        }

        publishForm.addEventListener("submit", async function HandleSubmit(event) {
            event.preventDefault();
            HideMessage(messageBar);
            view.submitButton.disabled = true;
            view.submitButton.classList.add("opacity-70");
            try {
                if (isUploadingFile) {
                    throw new Error("文件上传中，请稍后重试");
                }

                const submitResult = await SubmitByMode(
                    mode,
                    isEditMode,
                    editingProductId,
                    view,
                    selectedCondition,
                    uploadedFileMeta,
                    existingImageFileIdList
                );

                ShowSuccess(messageBar, submitResult.successText);
                if (!isEditMode) {
                    publishForm.reset();
                    selectedCondition = ApplyConditionSelection(view.conditionButtonList, "");
                    uploadedFileMeta = null;
                    existingImageFileIdList = [];
                    SetUploadTip(uploadTipText, mode === MODE_RECRUITMENT ? "招募发布无需上传文件" : "尚未上传文件");
                }

                window.setTimeout(function JumpAfterSubmit() {
                    window.location.href = submitResult.redirectPath;
                }, 900);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "提交失败，请稍后重试");
            } finally {
                view.submitButton.disabled = false;
                view.submitButton.classList.remove("opacity-70");
            }
        });

        /**
         * 上传选中文件
         */
        async function UploadSelectedFile(selectedFile) {
            if (!selectedFile || mode === MODE_RECRUITMENT) {
                return;
            }
            const acceptRule = mode === MODE_PRODUCT ? PRODUCT_IMAGE_ACCEPT : MATERIAL_FILE_ACCEPT;
            if (!IsSupportedFileByAccept(selectedFile, acceptRule)) {
                const errorText = mode === MODE_PRODUCT ? "仅支持 JPG/PNG 图片" : "仅支持 PDF/JPG/PNG 文件";
                SetUploadTip(uploadTipText, errorText, true);
                ShowError(messageBar, errorText);
                return;
            }

            isUploadingFile = true;
            view.submitButton.disabled = true;
            view.submitButton.classList.add("opacity-70");
            SetUploadTip(uploadTipText, `正在上传：${selectedFile.name}`);
            try {
                const uploadResult = await window.CampusShareApi.UploadMaterialFile(selectedFile);
                uploadedFileMeta = uploadResult;
                SetUploadTip(
                    uploadTipText,
                    `已上传：${uploadResult.fileName} (${FormatFileSize(uploadResult.fileSizeBytes)})`
                );
                HideMessage(messageBar);
            } catch (error) {
                uploadedFileMeta = null;
                SetUploadTip(uploadTipText, "上传失败，请重试", true);
                ShowError(messageBar, error instanceof Error ? error.message : "文件上传失败");
            } finally {
                isUploadingFile = false;
                view.submitButton.disabled = false;
                view.submitButton.classList.remove("opacity-70");
                if (hiddenFileInput) {
                    hiddenFileInput.value = "";
                }
            }
        }

        /**
         * 加载商品编辑草稿
         */
        async function LoadEditDraft() {
            view.submitButton.disabled = true;
            view.submitButton.classList.add("opacity-70");
            try {
                await window.CampusShareApi.SyncSessionProfile();
                const detailResult = await window.CampusShareApi.GetProductDetail(editingProductId);
                ValidateEditPermission(detailResult);
                view.titleInput.value = detailResult.title || "";
                SetSelectValue(view.categorySelect, detailResult.category || "");
                selectedCondition = ApplyConditionSelection(view.conditionButtonList, detailResult.conditionLevel || "");
                SetSelectValue(view.locationSelect, detailResult.tradeLocation || "");
                view.priceInput.value = detailResult.price == null ? "" : String(detailResult.price);
                view.descriptionInput.value = detailResult.description || "";

                existingImageFileIdList = ResolveImageFileIdList(detailResult);
                if (existingImageFileIdList.length > 0) {
                    SetUploadTip(uploadTipText, "已加载现有图片，可重新上传替换");
                } else {
                    SetUploadTip(uploadTipText, "当前商品暂无图片，请上传新图片", true);
                }
                HideMessage(messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "商品详情加载失败");
                return;
            } finally {
                view.submitButton.disabled = false;
                view.submitButton.classList.remove("opacity-70");
            }
        }
    }

    /**
     * 构建页面节点
     */
    function BuildView(publishForm) {
        const titleInput = publishForm.querySelector("[data-role='publish-title']");
        const categorySelect = publishForm.querySelector("[data-role='publish-category']");
        const locationSelect = publishForm.querySelector("[data-role='publish-location']");
        const priceInput = publishForm.querySelector("[data-role='publish-price']");
        const descriptionInput = publishForm.querySelector("[data-role='publish-description']");
        const submitButton = publishForm.querySelector("[data-role='publish-submit']");
        const browseFileButton = publishForm.querySelector("[data-role='publish-browse-file']");
        const uploadPanel = publishForm.querySelector("[data-role='publish-upload-panel']");
        const copyrightCheckbox = publishForm.querySelector("[data-role='publish-copyright']");

        return {
            pageTitle: document.querySelector("[data-role='publish-page-title']"),
            titleLabel: publishForm.querySelector("[data-role='publish-title-label']"),
            categoryLabel: publishForm.querySelector("[data-role='publish-category-label']"),
            priceLabel: publishForm.querySelector("[data-role='publish-price-label']"),
            locationLabel: publishForm.querySelector("[data-role='publish-location-label']"),
            descriptionLabel: publishForm.querySelector("[data-role='publish-description-label']"),
            copyrightText: publishForm.querySelector("[data-role='publish-copyright-text']"),
            conditionSection: publishForm.querySelector("[data-role='publish-condition-section']"),
            copyrightSection: publishForm.querySelector("[data-role='publish-copyright-section']"),
            titleInput: titleInput,
            categorySelect: categorySelect,
            locationSelect: locationSelect,
            priceInput: priceInput,
            descriptionInput: descriptionInput,
            submitButton: submitButton,
            browseFileButton: browseFileButton,
            uploadPanel: uploadPanel,
            copyrightCheckbox: copyrightCheckbox,
            conditionButtonList: Array.from(publishForm.querySelectorAll("[data-role='publish-condition-button']")),
            priceFieldWrapper: priceInput ? priceInput.closest(".space-y-2") : null,
            locationFieldWrapper: locationSelect ? locationSelect.closest(".space-y-2") : null
        };
    }

    /**
     * 应用模式 UI
     */
    function ApplyModeUi(mode, view, isEditMode) {
        if (mode === MODE_MATERIAL) {
            view.pageTitle.textContent = "上传学术资料";
            view.titleLabel.textContent = "资料标题";
            view.categoryLabel.textContent = "资料分类";
            view.descriptionLabel.textContent = "资料简介";
            view.submitButton.textContent = "上传资料";
            view.browseFileButton.textContent = "选择资料文件";
            view.conditionSection.classList.add("hidden");
            view.priceFieldWrapper.classList.add("hidden");
            view.locationFieldWrapper.classList.add("hidden");
            view.copyrightSection.classList.remove("hidden");
            view.copyrightText.textContent = "我确认拥有分享该资料的权限，不违反平台与学校版权规范";
            view.titleInput.placeholder = "例如：高等数学期末复习提纲";
            view.descriptionInput.placeholder = "简要描述资料内容、适用课程与章节";
            RenderSelectOptions(view.categorySelect, [
                { label: "选择分类", value: "" },
                { label: "课程讲义", value: "课程讲义" },
                { label: "实验报告", value: "实验报告" },
                { label: "考试资料", value: "考试资料" },
                { label: "项目文档", value: "项目文档" }
            ]);
            return;
        }

        if (mode === MODE_RECRUITMENT) {
            view.pageTitle.textContent = "发布组队招募";
            view.titleLabel.textContent = "招募主题";
            view.categoryLabel.textContent = "招募方向";
            view.priceLabel.textContent = "招募人数";
            view.locationLabel.textContent = "招募截止";
            view.descriptionLabel.textContent = "技能要求";
            view.submitButton.textContent = "发布招募";
            view.conditionSection.classList.add("hidden");
            view.uploadPanel.classList.add("hidden");
            view.copyrightSection.classList.add("hidden");
            view.titleInput.placeholder = "例如：算法竞赛组队";
            view.priceInput.placeholder = "请输入人数";
            view.descriptionInput.placeholder = "请输入需要的技能与协作要求";
            view.priceInput.step = "1";
            view.priceInput.min = "1";
            RenderSelectOptions(view.categorySelect, [
                { label: "选择方向", value: "" },
                { label: "算法", value: "算法" },
                { label: "前端", value: "前端" },
                { label: "后端", value: "后端" },
                { label: "产品/运营", value: "产品/运营" },
                { label: "综合", value: "综合" }
            ]);
            RenderSelectOptions(view.locationSelect, [
                { label: "3 天后截止", value: "3" },
                { label: "7 天后截止", value: "7" },
                { label: "14 天后截止", value: "14" }
            ]);
            return;
        }

        view.pageTitle.textContent = isEditMode ? "编辑商品" : "创建新发布";
        view.titleLabel.textContent = "商品标题";
        view.categoryLabel.textContent = "分类";
        view.priceLabel.textContent = "价格 (美元)";
        view.locationLabel.textContent = "交易地点";
        view.descriptionLabel.textContent = "详细描述";
        view.submitButton.textContent = isEditMode ? "保存修改" : "发布商品";
        view.browseFileButton.textContent = "浏览文件";
        view.conditionSection.classList.remove("hidden");
        view.uploadPanel.classList.remove("hidden");
        view.priceFieldWrapper.classList.remove("hidden");
        view.locationFieldWrapper.classList.remove("hidden");
        view.copyrightSection.classList.remove("hidden");
        view.copyrightText.textContent = "我声明此材料（如果是电子版）不违反机构版权政策，并且我有权在 CampusShare 网络内共享此内容。";
        view.titleInput.placeholder = "例如：有机化学第四版 - Smith";
        view.descriptionInput.placeholder = "描述物品新旧程度、包含的章节或任何缺页情况...";
    }

    /**
     * 根据模式提交
     */
    async function SubmitByMode(
        mode,
        isEditMode,
        editingProductId,
        view,
        selectedCondition,
        uploadedFileMeta,
        existingImageFileIdList
    ) {
        if (mode === MODE_MATERIAL) {
            const payload = BuildMaterialPayload(view, uploadedFileMeta);
            const result = await window.CampusShareApi.UploadMaterial(payload);
            return {
                successText: `上传成功，资料ID：${result.materialId}`,
                redirectPath: "/pages/market_listing.html?view=MATERIAL"
            };
        }

        if (mode === MODE_RECRUITMENT) {
            const payload = BuildRecruitmentPayload(view);
            const result = await window.CampusShareApi.PublishTeamRecruitment(payload);
            return {
                successText: `发布成功，招募ID：${result.recruitmentId}`,
                redirectPath: "/pages/market_listing.html?view=FORUM"
            };
        }

        const imageFileIdList = ResolveSubmitImageFileIdList(uploadedFileMeta, existingImageFileIdList);
        const productPayload = BuildProductPayload(view, selectedCondition, imageFileIdList);
        const result = isEditMode
            ? await window.CampusShareApi.UpdateProduct(editingProductId, productPayload)
            : await window.CampusShareApi.PublishProduct(productPayload);

        const productStatus = String(result && result.productStatus ? result.productStatus : "").toUpperCase();
        const redirectPath = ResolveProductRedirectPath(result.productId, isEditMode, productStatus);
        return {
            successText: isEditMode
                ? `编辑成功，商品ID：${result.productId}`
                : `发布成功，商品ID：${result.productId}`,
            redirectPath: redirectPath
        };
    }

    /**
     * 构建商品参数
     */
    function BuildProductPayload(view, selectedCondition, imageFileIdList) {
        const title = ReadText(view.titleInput);
        const category = ReadText(view.categorySelect);
        const conditionLevel = String(selectedCondition || "").trim();
        const tradeLocation = ReadText(view.locationSelect);
        const priceText = ReadText(view.priceInput);
        const description = ReadText(view.descriptionInput);

        if (!title) {
            throw new Error("商品标题不能为空");
        }
        if (!category) {
            throw new Error("请选择商品分类");
        }
        if (!conditionLevel) {
            throw new Error("请选择商品成色");
        }
        if (!tradeLocation) {
            throw new Error("交易地点不能为空");
        }
        const priceNumber = Number(priceText);
        if (!priceText || Number.isNaN(priceNumber)) {
            throw new Error("请输入正确价格");
        }
        if (priceNumber < 0) {
            throw new Error("价格不能小于0");
        }

        return {
            title: title,
            category: category,
            conditionLevel: conditionLevel,
            price: Number(priceNumber.toFixed(2)),
            tradeLocation: tradeLocation,
            description: description,
            imageFileIds: imageFileIdList
        };
    }

    /**
     * 构建资料参数
     */
    function BuildMaterialPayload(view, uploadedFileMeta) {
        const title = ReadText(view.titleInput);
        const category = ReadText(view.categorySelect);
        const description = ReadText(view.descriptionInput);
        const copyrightDeclared = !!(view.copyrightCheckbox && view.copyrightCheckbox.checked);

        if (!title) {
            throw new Error("资料标题不能为空");
        }
        if (!category) {
            throw new Error("请选择资料分类");
        }
        if (!uploadedFileMeta || !uploadedFileMeta.fileId) {
            throw new Error("请先上传资料文件");
        }
        if (!copyrightDeclared) {
            throw new Error("请勾选版权声明");
        }

        return {
            courseName: title,
            tags: [category],
            description: description,
            fileId: uploadedFileMeta.fileId,
            fileType: uploadedFileMeta.fileType || "UNKNOWN",
            fileSizeBytes: uploadedFileMeta.fileSizeBytes || 0,
            copyrightDeclared: true
        };
    }

    /**
     * 构建招募参数
     */
    function BuildRecruitmentPayload(view) {
        const eventName = ReadText(view.titleInput);
        const direction = ReadText(view.categorySelect);
        const memberLimitText = ReadText(view.priceInput);
        const skillRequirement = ReadText(view.descriptionInput);
        const deadlineDaysText = ReadText(view.locationSelect) || "7";
        const deadlineDays = Number(deadlineDaysText);
        const memberLimit = Number(memberLimitText);

        if (!eventName) {
            throw new Error("招募主题不能为空");
        }
        if (!direction) {
            throw new Error("请选择招募方向");
        }
        if (!memberLimitText || Number.isNaN(memberLimit) || memberLimit < 1) {
            throw new Error("招募人数需为大于 0 的整数");
        }

        return {
            eventName: eventName,
            direction: direction,
            memberLimit: Math.floor(memberLimit),
            deadline: FormatLocalDateTime(AddDays(new Date(), Number.isNaN(deadlineDays) ? 7 : deadlineDays)),
            skillRequirement: skillRequirement
        };
    }

    /**
     * 解析发布类型
     */
    function ResolvePublishMode() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const modeText = String(searchParams.get("type") || "").trim().toLowerCase();
        if (modeText === MODE_MATERIAL) {
            return MODE_MATERIAL;
        }
        if (modeText === MODE_RECRUITMENT) {
            return MODE_RECRUITMENT;
        }
        return MODE_PRODUCT;
    }

    /**
     * 编辑商品ID
     */
    function ResolveEditingProductId() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const productId = Number(searchParams.get("productId") || "0");
        return Number.isNaN(productId) ? 0 : productId;
    }

    /**
     * 当前路径+查询
     */
    function ResolveCurrentPagePathWithQuery() {
        return `${PUBLISH_PAGE_PATH}${window.location.search || ""}`;
    }

    /**
     * 读取当前用户
     */
    async function ResolveCurrentProfile() {
        try {
            if (window.CampusShareApi.SyncSessionProfile) {
                await window.CampusShareApi.SyncSessionProfile();
            }
        } catch (error) {
            // 会话同步失败时继续使用本地缓存
        }
        return window.CampusShareApi.GetCurrentUserProfile
            ? window.CampusShareApi.GetCurrentUserProfile()
            : null;
    }

    /**
     * 是否有商品发布权限
     */
    function HasPublishPermission(profile) {
        const userRole = profile && profile.userRole ? profile.userRole : "";
        return userRole === "VERIFIED_SELLER" || userRole === "ADMINISTRATOR";
    }

    /**
     * 校验编辑权限
     */
    function ValidateEditPermission(detailResult) {
        const profile = window.CampusShareApi.GetCurrentUserProfile() || {};
        const currentUserId = Number(profile.userId || 0);
        const userRole = profile.userRole || "";
        const sellerUserId = Number(detailResult && detailResult.sellerUserId ? detailResult.sellerUserId : 0);
        if (userRole === "ADMINISTRATOR") {
            return;
        }
        if (currentUserId > 0 && sellerUserId > 0 && currentUserId === sellerUserId) {
            return;
        }
        throw new Error("无权编辑该商品");
    }

    /**
     * 设置下拉值
     */
    function SetSelectValue(selectElement, targetText) {
        if (!selectElement) {
            return;
        }
        const normalizedTargetText = String(targetText || "").trim();
        if (!normalizedTargetText) {
            return;
        }
        const optionList = Array.from(selectElement.options || []);
        const matchedOption = optionList.find(function MatchOption(optionElement) {
            const optionText = String(optionElement.textContent || "").trim();
            const optionValue = String(optionElement.value || "").trim();
            return optionText === normalizedTargetText || optionValue === normalizedTargetText;
        });
        if (matchedOption) {
            selectElement.value = matchedOption.value;
        }
    }

    /**
     * 渲染下拉选项
     */
    function RenderSelectOptions(selectElement, optionList) {
        if (!selectElement) {
            return;
        }
        selectElement.innerHTML = (optionList || []).map(function BuildOption(optionItem) {
            const safeLabel = EscapeHtml(optionItem.label || "");
            const safeValue = EscapeHtml(optionItem.value == null ? (optionItem.label || "") : String(optionItem.value));
            return `<option value="${safeValue}">${safeLabel}</option>`;
        }).join("");
    }

    /**
     * 应用成色选择
     */
    function ApplyConditionSelection(conditionButtonList, conditionText) {
        if (!conditionButtonList || conditionButtonList.length === 0) {
            return "";
        }
        const normalizedConditionText = String(conditionText || "").trim();
        let selectedButton = conditionButtonList.find(function MatchCondition(buttonElement) {
            return String(buttonElement.textContent || "").trim() === normalizedConditionText;
        });
        if (!selectedButton) {
            selectedButton = conditionButtonList[0];
        }
        conditionButtonList.forEach(function ResetStyle(buttonElement) {
            buttonElement.classList.remove("border-primary", "bg-primary-container/10", "text-primary");
            buttonElement.classList.add("border-transparent", "bg-surface-container", "text-slate-600");
        });
        selectedButton.classList.remove("border-transparent", "bg-surface-container", "text-slate-600");
        selectedButton.classList.add("border-primary", "bg-primary-container/10", "text-primary");
        return String(selectedButton.textContent || "").trim();
    }

    /**
     * 解析图片ID
     */
    function ResolveImageFileIdList(detailResult) {
        const imageFileIdList = detailResult && Array.isArray(detailResult.imageFileIds)
            ? detailResult.imageFileIds
            : [];
        return imageFileIdList
            .map(function NormalizeFileId(fileId) {
                return String(fileId || "").trim();
            })
            .filter(function FilterFileId(fileId) {
                return !!fileId;
            });
    }

    /**
     * 提交时图片ID
     */
    function ResolveSubmitImageFileIdList(uploadedFileMeta, existingImageFileIdList) {
        if (uploadedFileMeta && uploadedFileMeta.fileId) {
            return [String(uploadedFileMeta.fileId)];
        }
        const normalizedList = (Array.isArray(existingImageFileIdList) ? existingImageFileIdList : [])
            .map(function NormalizeFileId(fileId) {
                return String(fileId || "").trim();
            })
            .filter(function FilterFileId(fileId) {
                return !!fileId;
            });
        if (!normalizedList.length) {
            throw new Error("请先上传商品图片");
        }
        return normalizedList;
    }

    /**
     * 商品发布后跳转
     */
    function ResolveProductRedirectPath(productId, isEditMode, productStatus) {
        const safeProductId = Number(productId || 0);
        if (!safeProductId || Number.isNaN(safeProductId)) {
            return "/pages/my_publish.html";
        }
        if (isEditMode) {
            return `/pages/market_item_detail.html?productId=${encodeURIComponent(String(safeProductId))}`;
        }
        if (productStatus === "PENDING_REVIEW") {
            return "/pages/my_publish.html";
        }
        return `/pages/market_item_detail.html?productId=${encodeURIComponent(String(safeProductId))}`;
    }

    /**
     * 文件类型校验
     */
    function IsSupportedFileByAccept(selectedFile, acceptText) {
        if (!selectedFile || !selectedFile.name) {
            return false;
        }
        const lowerName = selectedFile.name.toLowerCase();
        const extensionList = String(acceptText || "")
            .split(",")
            .map(function NormalizeExt(item) {
                return item.trim().toLowerCase();
            })
            .filter(function FilterExt(item) {
                return !!item;
            });
        return extensionList.some(function MatchExt(ext) {
            return lowerName.endsWith(ext);
        });
    }

    /**
     * 构建隐藏文件输入
     */
    function BuildHiddenFileInput(publishForm) {
        const hiddenFileInput = document.createElement("input");
        hiddenFileInput.type = "file";
        hiddenFileInput.accept = `${PRODUCT_IMAGE_ACCEPT},${MATERIAL_FILE_ACCEPT}`;
        hiddenFileInput.style.display = "none";
        publishForm.appendChild(hiddenFileInput);
        return hiddenFileInput;
    }

    /**
     * 创建上传提示
     */
    function CreateUploadTip(uploadPanel) {
        if (!uploadPanel) {
            return null;
        }
        const uploadTipText = document.createElement("p");
        uploadTipText.className = "mt-3 text-xs text-slate-500";
        uploadTipText.textContent = "尚未上传文件";
        uploadPanel.appendChild(uploadTipText);
        return uploadTipText;
    }

    /**
     * 设置上传提示
     */
    function SetUploadTip(uploadTipText, tipText, isError) {
        if (!uploadTipText) {
            return;
        }
        uploadTipText.textContent = tipText;
        if (isError) {
            uploadTipText.className = "mt-3 text-xs text-red-600";
            return;
        }
        uploadTipText.className = "mt-3 text-xs text-slate-500";
    }

    /**
     * 绑定拖拽上传
     */
    function BindDropUpload(uploadPanel, hiddenFileInput, uploadFunction) {
        if (!uploadPanel || !hiddenFileInput) {
            return;
        }
        uploadPanel.addEventListener("dragover", function HandleDragOver(event) {
            event.preventDefault();
            uploadPanel.classList.add("border-primary", "bg-primary-container/10");
        });
        uploadPanel.addEventListener("dragleave", function HandleDragLeave() {
            uploadPanel.classList.remove("border-primary", "bg-primary-container/10");
        });
        uploadPanel.addEventListener("drop", function HandleDrop(event) {
            event.preventDefault();
            uploadPanel.classList.remove("border-primary", "bg-primary-container/10");
            const droppedFile = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]
                ? event.dataTransfer.files[0]
                : null;
            uploadFunction(droppedFile);
        });
    }

    /**
     * 文本读取
     */
    function ReadText(inputElement) {
        if (!inputElement) {
            return "";
        }
        return String(inputElement.value || "").trim();
    }

    /**
     * 日期加天数
     */
    function AddDays(baseDate, days) {
        const nextDate = new Date(baseDate.getTime());
        nextDate.setDate(nextDate.getDate() + Math.max(1, days));
        return nextDate;
    }

    /**
     * 本地时间格式 yyyy-MM-ddTHH:mm:ss
     */
    function FormatLocalDateTime(dateValue) {
        const year = dateValue.getFullYear();
        const month = PadNumber(dateValue.getMonth() + 1);
        const day = PadNumber(dateValue.getDate());
        const hour = PadNumber(dateValue.getHours());
        const minute = PadNumber(dateValue.getMinutes());
        const second = PadNumber(dateValue.getSeconds());
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }

    /**
     * 补零
     */
    function PadNumber(value) {
        return value < 10 ? `0${value}` : String(value);
    }

    /**
     * 构建消息栏
     */
    function BuildMessageBar(publishForm) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant";
        messageBar.style.display = "none";
        publishForm.insertBefore(messageBar, publishForm.firstChild);
        return messageBar;
    }

    /**
     * 文件大小格式
     */
    function FormatFileSize(fileSizeBytes) {
        if (!fileSizeBytes || fileSizeBytes <= 0) {
            return "0 KB";
        }
        if (fileSizeBytes >= 1024 * 1024) {
            return `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
        }
        return `${(fileSizeBytes / 1024).toFixed(2)} KB`;
    }

    /**
     * HTML 转义
     */
    function EscapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * 成功提示
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200";
        messageBar.textContent = message;
    }

    /**
     * 错误提示
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200";
        messageBar.textContent = message;
    }

    /**
     * 隐藏提示
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindPublishPage);
})();
