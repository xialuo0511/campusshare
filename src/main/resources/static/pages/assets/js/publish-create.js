/**
 * 发布页面逻辑
 */
(function InitPublishCreatePage() {
    /** 图片选择限制 */
    const PRODUCT_IMAGE_ACCEPT = ".jpg,.jpeg,.png";
    /** 发布页路径 */
    const PUBLISH_PAGE_PATH = "/pages/publish_create.html";

    /**
     * 绑定页面行为
     */
    async function BindPublishPage() {
        const publishForm = document.querySelector("section form");
        if (!publishForm || !window.CampusShareApi) {
            return;
        }

        const conditionButtonList = publishForm.querySelectorAll("button[type='button']");
        const submitButton = publishForm.querySelector("button[type='submit']");
        const titleInput = publishForm.querySelector("input[type='text']");
        const categorySelect = publishForm.querySelector("select");
        const locationSelect = publishForm.querySelectorAll("select")[1];
        const priceInput = publishForm.querySelector("input[type='number']");
        const descriptionInput = publishForm.querySelector("textarea");
        const uploadPanel = publishForm.querySelector(".border-dashed");
        const browseFileButton = uploadPanel ? uploadPanel.querySelector("button[type='button']") : null;
        const uploadTipText = CreateUploadTip(uploadPanel);
        const hiddenFileInput = BuildHiddenFileInput(publishForm);
        const pageTitle = document.querySelector("main h1");
        const editingProductId = ResolveEditingProductId();
        const isEditMode = editingProductId > 0;

        if (!submitButton || !titleInput || !categorySelect || !locationSelect || !priceInput || !descriptionInput) {
            return;
        }

        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant";
        messageBar.style.display = "none";
        publishForm.insertBefore(messageBar, publishForm.firstChild);

        ApplyPageMode(isEditMode, pageTitle, submitButton);

        if (!window.CampusShareApi.GetAuthToken()) {
            ShowError(messageBar, "请先登录后再发布商品");
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
        if (!isEditMode && !HasPublishPermission(currentProfile)) {
            ShowError(messageBar, "当前账号未通过认证卖家审核，暂不能发布商品");
            submitButton.disabled = true;
            submitButton.classList.add("opacity-70");
            return;
        }

        let selectedCondition = "";
        let uploadedFileMeta = null;
        let existingImageFileIdList = [];
        let isUploadingFile = false;
        const usableConditionButtonList = Array.from(conditionButtonList).slice(0, 3);
        selectedCondition = ApplyConditionSelection(usableConditionButtonList, "");

        usableConditionButtonList.forEach(function BindConditionButton(button) {
            button.addEventListener("click", function HandleConditionClick() {
                selectedCondition = ApplyConditionSelection(usableConditionButtonList, button.textContent || "");
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
        BindDropUpload(uploadPanel, hiddenFileInput, UploadSelectedFile);

        if (isEditMode) {
            LoadEditDraft();
        }

        publishForm.addEventListener("submit", async function HandleSubmit(event) {
            event.preventDefault();
            HideMessage(messageBar);
            submitButton.disabled = true;
            submitButton.classList.add("opacity-70");
            try {
                if (isUploadingFile) {
                    throw new Error("图片上传中，请稍后重试");
                }
                const imageFileIdList = ResolveSubmitImageFileIdList(uploadedFileMeta, existingImageFileIdList);
                const productPayload = BuildProductPayload(
                    titleInput,
                    categorySelect,
                    selectedCondition,
                    priceInput,
                    locationSelect,
                    descriptionInput,
                    imageFileIdList
                );
                const result = isEditMode
                    ? await window.CampusShareApi.UpdateProduct(editingProductId, productPayload)
                    : await window.CampusShareApi.PublishProduct(productPayload);

                ShowSuccess(messageBar, isEditMode
                    ? `编辑成功，商品ID：${result.productId}`
                    : `发布成功，商品ID：${result.productId}`);

                if (!isEditMode) {
                    publishForm.reset();
                    selectedCondition = ApplyConditionSelection(usableConditionButtonList, "");
                    uploadedFileMeta = null;
                    existingImageFileIdList = [];
                    SetUploadTip(uploadTipText, "尚未上传商品图片");
                }

                if (result && result.productId) {
                    window.setTimeout(function JumpToDetailPage() {
                        window.location.href = `/pages/market_item_detail.html?productId=${encodeURIComponent(result.productId)}`;
                    }, 900);
                }
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "提交失败，请稍后重试");
            } finally {
                submitButton.disabled = false;
                submitButton.classList.remove("opacity-70");
            }
        });

        /**
         * 加载编辑草稿
         */
        async function LoadEditDraft() {
            submitButton.disabled = true;
            submitButton.classList.add("opacity-70");
            try {
                await window.CampusShareApi.SyncSessionProfile();
                const detailResult = await window.CampusShareApi.GetProductDetail(editingProductId);
                ValidateEditPermission(detailResult);
                titleInput.value = detailResult.title || "";
                SetSelectValue(categorySelect, detailResult.category || "");
                selectedCondition = ApplyConditionSelection(usableConditionButtonList, detailResult.conditionLevel || "");
                SetSelectValue(locationSelect, detailResult.tradeLocation || "");
                priceInput.value = detailResult.price == null ? "" : String(detailResult.price);
                descriptionInput.value = detailResult.description || "";

                existingImageFileIdList = ResolveImageFileIdList(detailResult);
                if (existingImageFileIdList.length > 0) {
                    SetUploadTip(uploadTipText, "已加载现有图片，可重新上传替换");
                } else {
                    SetUploadTip(uploadTipText, "当前商品暂无图片，请上传新图片", true);
                }
                HideMessage(messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "商品详情加载失败");
                submitButton.disabled = true;
                submitButton.classList.add("opacity-70");
                return;
            }
            submitButton.disabled = false;
            submitButton.classList.remove("opacity-70");
        }

        /**
         * 上传选中图片
         */
        async function UploadSelectedFile(selectedFile) {
            if (!selectedFile) {
                return;
            }
            if (!window.CampusShareApi.GetAuthToken()) {
                ShowError(messageBar, "请先登录后再上传图片");
                return;
            }
            if (!IsSupportedImageFile(selectedFile)) {
                SetUploadTip(uploadTipText, "仅支持 JPG/PNG 图片", true);
                ShowError(messageBar, "仅支持 JPG/PNG 图片");
                return;
            }

            isUploadingFile = true;
            submitButton.disabled = true;
            submitButton.classList.add("opacity-70");
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
                ShowError(messageBar, error instanceof Error ? error.message : "图片上传失败");
            } finally {
                isUploadingFile = false;
                submitButton.disabled = false;
                submitButton.classList.remove("opacity-70");
                if (hiddenFileInput) {
                    hiddenFileInput.value = "";
                }
            }
        }
    }

    /**
     * 应用页面模式
     */
    function ApplyPageMode(isEditMode, pageTitle, submitButton) {
        if (!isEditMode) {
            return;
        }
        if (pageTitle) {
            pageTitle.textContent = "编辑商品";
        }
        submitButton.textContent = "保存修改";
    }

    /**
     * 获取编辑商品ID
     */
    function ResolveEditingProductId() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const productId = Number(searchParams.get("productId") || "0");
        if (!productId || Number.isNaN(productId)) {
            return 0;
        }
        return productId;
    }

    /**
     * 当前路径+查询
     */
    function ResolveCurrentPagePathWithQuery() {
        return `${PUBLISH_PAGE_PATH}${window.location.search || ""}`;
    }

    /**
     * 获取当前用户资料
     */
    async function ResolveCurrentProfile() {
        if (!window.CampusShareApi) {
            return null;
        }
        try {
            if (window.CampusShareApi.SyncSessionProfile) {
                await window.CampusShareApi.SyncSessionProfile();
            }
        } catch (error) {
            // 会话同步失败时继续使用本地资料兜底
        }
        return window.CampusShareApi.GetCurrentUserProfile
            ? window.CampusShareApi.GetCurrentUserProfile()
            : null;
    }

    /**
     * 是否具备发布权限
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
     * 解析提交图片ID
     */
    function ResolveSubmitImageFileIdList(uploadedFileMeta, existingImageFileIdList) {
        if (uploadedFileMeta && uploadedFileMeta.fileId) {
            return [String(uploadedFileMeta.fileId)];
        }
        const imageFileIdList = Array.isArray(existingImageFileIdList) ? existingImageFileIdList : [];
        const normalizedImageFileIdList = imageFileIdList
            .map(function NormalizeFileId(fileId) {
                return String(fileId || "").trim();
            })
            .filter(function FilterFileId(fileId) {
                return !!fileId;
            });
        if (normalizedImageFileIdList.length === 0) {
            throw new Error("请先上传商品图片");
        }
        return normalizedImageFileIdList;
    }

    /**
     * 构建商品发布参数
     */
    function BuildProductPayload(
        titleInput,
        categorySelect,
        selectedCondition,
        priceInput,
        locationSelect,
        descriptionInput,
        imageFileIdList
    ) {
        const title = titleInput && titleInput.value ? titleInput.value.trim() : "";
        if (!title) {
            throw new Error("商品标题不能为空");
        }

        const categoryText = categorySelect && categorySelect.value ? categorySelect.value.trim() : "";
        if (!categoryText || categoryText === "选择分类") {
            throw new Error("请选择商品分类");
        }

        const conditionLevel = selectedCondition ? selectedCondition.trim() : "";
        if (!conditionLevel) {
            throw new Error("请选择商品成色");
        }

        const tradeLocation = locationSelect && locationSelect.value ? locationSelect.value.trim() : "";
        if (!tradeLocation) {
            throw new Error("交易地点不能为空");
        }

        const priceText = priceInput && priceInput.value ? priceInput.value.trim() : "";
        const priceNumber = Number(priceText);
        if (!priceText || Number.isNaN(priceNumber)) {
            throw new Error("请输入正确价格");
        }
        if (priceNumber < 0) {
            throw new Error("价格不能小于0");
        }

        const description = descriptionInput && descriptionInput.value ? descriptionInput.value.trim() : "";
        return {
            title,
            category: categoryText,
            conditionLevel,
            price: Number(priceNumber.toFixed(2)),
            tradeLocation,
            description,
            imageFileIds: imageFileIdList
        };
    }

    /**
     * 是否为受支持图片
     */
    function IsSupportedImageFile(selectedFile) {
        if (!selectedFile || !selectedFile.name) {
            return false;
        }
        const lowerFileName = selectedFile.name.toLowerCase();
        return lowerFileName.endsWith(".jpg")
            || lowerFileName.endsWith(".jpeg")
            || lowerFileName.endsWith(".png");
    }

    /**
     * 构建隐藏文件输入
     */
    function BuildHiddenFileInput(publishForm) {
        if (!publishForm) {
            return null;
        }
        const hiddenFileInput = document.createElement("input");
        hiddenFileInput.type = "file";
        hiddenFileInput.accept = PRODUCT_IMAGE_ACCEPT;
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
        uploadTipText.textContent = "尚未上传商品图片";
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
     * 格式化文件大小
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
     * 显示成功信息
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200";
        messageBar.textContent = message;
    }

    /**
     * 显示错误信息
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200";
        messageBar.textContent = message;
    }

    /**
     * 隐藏提示信息
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindPublishPage);
})();
