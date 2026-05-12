/**
 * Publish page logic.
 */
(function InitPublishCreatePage() {
    const PRODUCT_IMAGE_ACCEPT = ".jpg,.jpeg,.png";
    const MATERIAL_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png";
    const PUBLISH_PAGE_PATH = "/pages/publish_create.html";
    const MODE_PRODUCT = "product";
    const MODE_MATERIAL = "material";
    const MODE_RECRUITMENT = "recruitment";

    document.addEventListener("DOMContentLoaded", BindPublishPage);

    async function BindPublishPage() {
        if (!window.CampusShareApi) return;

        const publishForm = document.querySelector("[data-role='publish-form']");
        if (!publishForm) return;

        const view = BuildView(publishForm);
        if (!view.submitButton) return;

        const mode = ResolvePublishMode();
        const editingProductId = ResolveEditingProductId();
        const isEditMode = mode === MODE_PRODUCT && editingProductId > 0;
        const messageBar = BuildMessageBar(publishForm);
        const uploadTipText = CreateUploadTip(view.uploadPanel);
        const hiddenFileInput = BuildHiddenFileInput(publishForm);

        let selectedCondition = "";
        let uploadedFileMeta = null;
        let existingImageFileIdList = [];
        let isUploadingFile = false;

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

        if (view.browseFileButton && hiddenFileInput) {
            view.browseFileButton.addEventListener("click", function HandleBrowseFile() {
                hiddenFileInput.click();
            });
            hiddenFileInput.addEventListener("change", function HandleFileChange() {
                const selectedFile = hiddenFileInput.files && hiddenFileInput.files[0] ? hiddenFileInput.files[0] : null;
                UploadSelectedFile(selectedFile);
            });
        }
        BindDropUpload(view.uploadPanel, hiddenFileInput, UploadSelectedFile);

        SetUploadTip(uploadTipText, mode === MODE_RECRUITMENT ? "招募发布可不上传文件" : "尚未上传文件");

        if (isEditMode) {
            await LoadEditDraft();
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
                    SetUploadTip(uploadTipText, mode === MODE_RECRUITMENT ? "招募发布可不上传文件" : "尚未上传文件");
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

        async function UploadSelectedFile(selectedFile) {
            if (!selectedFile) return;

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
                SetUploadTip(uploadTipText, `已上传：${uploadResult.fileName} (${FormatFileSize(uploadResult.fileSizeBytes)})`);
                HideMessage(messageBar);
            } catch (error) {
                uploadedFileMeta = null;
                SetUploadTip(uploadTipText, "上传失败，请重试", true);
                ShowError(messageBar, error instanceof Error ? error.message : "文件上传失败");
            } finally {
                isUploadingFile = false;
                view.submitButton.disabled = false;
                view.submitButton.classList.remove("opacity-70");
                hiddenFileInput.value = "";
            }
        }

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
                SetUploadTip(
                    uploadTipText,
                    existingImageFileIdList.length > 0 ? "已加载现有图片，可重新上传替换" : "当前商品暂无图片，请上传新图片",
                    existingImageFileIdList.length === 0
                );
                HideMessage(messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "商品详情加载失败");
            } finally {
                view.submitButton.disabled = false;
                view.submitButton.classList.remove("opacity-70");
            }
        }
    }

    function BuildView(publishForm) {
        const priceInput = publishForm.querySelector("[data-role='publish-price']");
        const locationSelect = publishForm.querySelector("[data-role='publish-location']");
        return {
            pageTitle: document.querySelector("[data-role='publish-page-title']"),
            titleLabel: publishForm.querySelector("[data-role='publish-title-label']"),
            categoryLabel: publishForm.querySelector("[data-role='publish-category-label']"),
            priceLabel: publishForm.querySelector("[data-role='publish-price-label']"),
            pricePrefix: publishForm.querySelector("[data-role='publish-price-prefix']"),
            locationLabel: publishForm.querySelector("[data-role='publish-location-label']"),
            descriptionLabel: publishForm.querySelector("[data-role='publish-description-label']"),
            uploadTitle: publishForm.querySelector("[data-role='publish-upload-title']"),
            uploadDescription: publishForm.querySelector("[data-role='publish-upload-description']"),
            copyrightText: publishForm.querySelector("[data-role='publish-copyright-text']"),
            conditionSection: publishForm.querySelector("[data-role='publish-condition-section']"),
            copyrightSection: publishForm.querySelector("[data-role='publish-copyright-section']"),
            titleInput: publishForm.querySelector("[data-role='publish-title']"),
            categorySelect: publishForm.querySelector("[data-role='publish-category']"),
            locationSelect,
            priceInput,
            descriptionInput: publishForm.querySelector("[data-role='publish-description']"),
            submitButton: publishForm.querySelector("[data-role='publish-submit']"),
            browseFileButton: publishForm.querySelector("[data-role='publish-browse-file']"),
            uploadPanel: publishForm.querySelector("[data-role='publish-upload-panel']"),
            copyrightCheckbox: publishForm.querySelector("[data-role='publish-copyright']"),
            conditionButtonList: Array.from(publishForm.querySelectorAll("[data-role='publish-condition-button']")),
            priceFieldWrapper: priceInput ? priceInput.closest(".space-y-2") : null,
            locationFieldWrapper: locationSelect ? locationSelect.closest(".space-y-2") : null
        };
    }

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
            view.copyrightText.textContent = "我确认拥有分享该资料的权限，不违反平台与学校版权规范。";
            view.titleInput.placeholder = "例如：高等数学期末复习提纲";
            view.descriptionInput.placeholder = "简要描述资料内容、适用课程与章节";
            SetPricePrefixVisible(view, false);
            SetUploadCopy(view, "拖放资料文件", "支持 PDF、JPG、PNG，最大 25MB。");
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
            view.pageTitle.textContent = "发布团队招募";
            view.titleLabel.textContent = "招募主题";
            view.categoryLabel.textContent = "招募方向";
            view.priceLabel.textContent = "招募人数";
            view.locationLabel.textContent = "招募截止";
            view.descriptionLabel.textContent = "技能要求";
            view.submitButton.textContent = "发布招募";
            view.conditionSection.classList.add("hidden");
            view.browseFileButton.textContent = "选择附件";
            view.copyrightSection.classList.add("hidden");
            SetPricePrefixVisible(view, false);
            SetUploadCopy(view, "上传帖子附件", "支持 JPG、PNG、PDF，附件会随招募说明保存。");
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
        view.priceLabel.textContent = "价格（元）";
        view.locationLabel.textContent = "交易地点";
        view.descriptionLabel.textContent = "详细描述";
        view.submitButton.textContent = isEditMode ? "保存修改" : "发布商品";
        view.browseFileButton.textContent = "浏览文件";
        view.conditionSection.classList.remove("hidden");
        view.priceFieldWrapper.classList.remove("hidden");
        view.locationFieldWrapper.classList.remove("hidden");
        view.copyrightSection.classList.remove("hidden");
        view.copyrightText.textContent = "我声明此材料（如为电子版）不违反版权政策，并且我有权在 CampusShare 网络内共享此内容。";
        view.titleInput.placeholder = "例如：有机化学第四版 - Smith";
        view.descriptionInput.placeholder = "描述物品新旧程度、包含的章节或任何缺页情况...";
        SetPricePrefixVisible(view, true);
        SetUploadCopy(view, "拖放图片或文档", "支持 JPG、PNG、PDF，最大 25MB。建议为教材提供清晰图片。");
    }

    function SetPricePrefixVisible(view, visible) {
        if (view.pricePrefix) view.pricePrefix.classList.toggle("hidden", !visible);
        if (view.priceInput) {
            view.priceInput.classList.toggle("pl-9", visible);
            view.priceInput.classList.toggle("px-4", !visible);
        }
    }

    function SetUploadCopy(view, titleText, descriptionText) {
        if (view.uploadTitle) view.uploadTitle.textContent = titleText;
        if (view.uploadDescription) view.uploadDescription.textContent = descriptionText;
    }

    async function SubmitByMode(mode, isEditMode, editingProductId, view, selectedCondition, uploadedFileMeta, existingImageFileIdList) {
        if (mode === MODE_MATERIAL) {
            const result = await window.CampusShareApi.UploadMaterial(BuildMaterialPayload(view, uploadedFileMeta));
            return { successText: `上传成功，资料ID：${result.materialId}`, redirectPath: "/pages/market_listing.html?view=MATERIAL" };
        }
        if (mode === MODE_RECRUITMENT) {
            const result = await window.CampusShareApi.PublishTeamRecruitment(BuildRecruitmentPayload(view, uploadedFileMeta));
            return { successText: `发布成功，招募ID：${result.recruitmentId}`, redirectPath: "/pages/market_listing.html?view=FORUM" };
        }
        const imageFileIdList = ResolveSubmitImageFileIdList(uploadedFileMeta, existingImageFileIdList);
        const productPayload = BuildProductPayload(view, selectedCondition, imageFileIdList);
        const result = isEditMode
            ? await window.CampusShareApi.UpdateProduct(editingProductId, productPayload)
            : await window.CampusShareApi.PublishProduct(productPayload);
        const productStatus = String(result && result.productStatus ? result.productStatus : "").toUpperCase();
        return {
            successText: isEditMode ? `编辑成功，商品ID：${result.productId}` : `发布成功，商品ID：${result.productId}`,
            redirectPath: ResolveProductRedirectPath(result.productId, isEditMode, productStatus)
        };
    }

    function BuildProductPayload(view, selectedCondition, imageFileIdList) {
        const title = ReadText(view.titleInput);
        const category = ReadText(view.categorySelect);
        const conditionLevel = String(selectedCondition || "").trim();
        const tradeLocation = ReadText(view.locationSelect);
        const priceText = ReadText(view.priceInput);
        const priceNumber = Number(priceText);
        if (!title) throw new Error("商品标题不能为空");
        if (!category) throw new Error("请选择商品分类");
        if (!conditionLevel) throw new Error("请选择商品成色");
        if (!tradeLocation) throw new Error("交易地点不能为空");
        if (!priceText || Number.isNaN(priceNumber)) throw new Error("请输入正确价格");
        if (priceNumber < 0) throw new Error("价格不能小于 0");
        return {
            title,
            category,
            conditionLevel,
            price: Number(priceNumber.toFixed(2)),
            tradeLocation,
            description: ReadText(view.descriptionInput),
            imageFileIds: imageFileIdList
        };
    }

    function BuildMaterialPayload(view, uploadedFileMeta) {
        const title = ReadText(view.titleInput);
        const category = ReadText(view.categorySelect);
        if (!title) throw new Error("资料标题不能为空");
        if (!category) throw new Error("请选择资料分类");
        if (!uploadedFileMeta || !uploadedFileMeta.fileId) throw new Error("请先上传资料文件");
        if (!(view.copyrightCheckbox && view.copyrightCheckbox.checked)) throw new Error("请勾选版权声明");
        return {
            courseName: title,
            tags: [category],
            description: ReadText(view.descriptionInput),
            fileId: uploadedFileMeta.fileId,
            fileType: uploadedFileMeta.fileType || "UNKNOWN",
            fileSizeBytes: uploadedFileMeta.fileSizeBytes || 0,
            copyrightDeclared: true
        };
    }

    function BuildRecruitmentPayload(view, uploadedFileMeta) {
        const eventName = ReadText(view.titleInput);
        const direction = ReadText(view.categorySelect);
        const memberLimitText = ReadText(view.priceInput);
        const memberLimit = Number(memberLimitText);
        if (!eventName) throw new Error("招募主题不能为空");
        if (!direction) throw new Error("请选择招募方向");
        if (!memberLimitText || Number.isNaN(memberLimit) || memberLimit < 1) throw new Error("招募人数需为大于 0 的整数");
        const deadlineDaysText = ReadText(view.locationSelect) || "7";
        const deadlineDays = Number(deadlineDaysText);
        return {
            eventName,
            direction,
            memberLimit: Math.floor(memberLimit),
            deadline: FormatLocalDateTime(AddDays(new Date(), Number.isNaN(deadlineDays) ? 7 : deadlineDays)),
            skillRequirement: BuildRecruitmentSkillRequirement(ReadText(view.descriptionInput), uploadedFileMeta)
        };
    }

    function BuildRecruitmentSkillRequirement(skillRequirement, uploadedFileMeta) {
        const baseText = String(skillRequirement || "").trim();
        if (!uploadedFileMeta || !uploadedFileMeta.fileId) return baseText;
        const fileName = uploadedFileMeta.fileName || "附件";
        const attachmentText = `\n附件：${fileName}（文件ID：${uploadedFileMeta.fileId}）`;
        const maxBaseLength = Math.max(0, 500 - attachmentText.length);
        return `${baseText.slice(0, maxBaseLength)}${attachmentText}`;
    }

    function ResolvePublishMode() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const modeText = String(searchParams.get("type") || "").trim().toLowerCase();
        if (modeText === MODE_MATERIAL) return MODE_MATERIAL;
        if (modeText === MODE_RECRUITMENT) return MODE_RECRUITMENT;
        return MODE_PRODUCT;
    }

    function ResolveEditingProductId() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const productId = Number(searchParams.get("productId") || "0");
        return Number.isNaN(productId) ? 0 : productId;
    }

    function ResolveCurrentPagePathWithQuery() {
        return `${PUBLISH_PAGE_PATH}${window.location.search || ""}`;
    }

    async function ResolveCurrentProfile() {
        try {
            if (window.CampusShareApi.SyncSessionProfile) {
                await window.CampusShareApi.SyncSessionProfile();
            }
        } catch (error) {
            // Keep local profile as fallback when session sync fails.
        }
        return window.CampusShareApi.GetCurrentUserProfile ? window.CampusShareApi.GetCurrentUserProfile() : null;
    }

    function HasPublishPermission(profile) {
        const userRole = profile && profile.userRole ? profile.userRole : "";
        return userRole === "VERIFIED_SELLER" || userRole === "ADMINISTRATOR";
    }

    function ValidateEditPermission(detailResult) {
        const profile = window.CampusShareApi.GetCurrentUserProfile() || {};
        const currentUserId = Number(profile.userId || 0);
        const userRole = profile.userRole || "";
        const sellerUserId = Number(detailResult && detailResult.sellerUserId ? detailResult.sellerUserId : 0);
        if (userRole === "ADMINISTRATOR") return;
        if (currentUserId > 0 && sellerUserId > 0 && currentUserId === sellerUserId) return;
        throw new Error("无权编辑该商品");
    }

    function SetSelectValue(selectElement, targetText) {
        if (!selectElement) return;
        const normalizedTargetText = String(targetText || "").trim();
        if (!normalizedTargetText) return;
        const matchedOption = Array.from(selectElement.options || []).find(function MatchOption(optionElement) {
            const optionText = String(optionElement.textContent || "").trim();
            const optionValue = String(optionElement.value || "").trim();
            return optionText === normalizedTargetText || optionValue === normalizedTargetText;
        });
        if (matchedOption) selectElement.value = matchedOption.value;
    }

    function RenderSelectOptions(selectElement, optionList) {
        if (!selectElement) return;
        selectElement.innerHTML = (optionList || []).map(function BuildOption(optionItem) {
            const safeLabel = EscapeHtml(optionItem.label || "");
            const safeValue = EscapeHtml(optionItem.value == null ? (optionItem.label || "") : String(optionItem.value));
            return `<option value="${safeValue}">${safeLabel}</option>`;
        }).join("");
    }

    function ApplyConditionSelection(conditionButtonList, conditionText) {
        if (!conditionButtonList || conditionButtonList.length === 0) return "";
        const normalizedConditionText = String(conditionText || "").trim();
        let selectedButton = conditionButtonList.find(function MatchCondition(buttonElement) {
            return String(buttonElement.textContent || "").trim() === normalizedConditionText;
        }) || conditionButtonList[0];

        conditionButtonList.forEach(function ResetStyle(buttonElement) {
            buttonElement.className = "flex-1 rounded-xl border border-transparent bg-slate-100 py-2 text-xs font-bold text-slate-600";
        });
        selectedButton.className = "flex-1 rounded-xl border border-[#005d90] bg-[#eef6fb] py-2 text-xs font-bold text-[#005d90]";
        return String(selectedButton.textContent || "").trim();
    }

    function ResolveImageFileIdList(detailResult) {
        const imageFileIdList = detailResult && Array.isArray(detailResult.imageFileIds) ? detailResult.imageFileIds : [];
        return imageFileIdList.map(function NormalizeFileId(fileId) {
            return String(fileId || "").trim();
        }).filter(Boolean);
    }

    function ResolveSubmitImageFileIdList(uploadedFileMeta, existingImageFileIdList) {
        if (uploadedFileMeta && uploadedFileMeta.fileId) return [String(uploadedFileMeta.fileId)];
        const normalizedList = (Array.isArray(existingImageFileIdList) ? existingImageFileIdList : []).map(function NormalizeFileId(fileId) {
            return String(fileId || "").trim();
        }).filter(Boolean);
        if (!normalizedList.length) throw new Error("请先上传商品图片");
        return normalizedList;
    }

    function ResolveProductRedirectPath(productId, isEditMode, productStatus) {
        const safeProductId = Number(productId || 0);
        if (!safeProductId || Number.isNaN(safeProductId)) return "/pages/my_publish.html";
        if (isEditMode) return `/pages/market_item_detail.html?productId=${encodeURIComponent(String(safeProductId))}`;
        if (productStatus === "PENDING_REVIEW") return "/pages/my_publish.html";
        return `/pages/market_item_detail.html?productId=${encodeURIComponent(String(safeProductId))}`;
    }

    function IsSupportedFileByAccept(selectedFile, acceptText) {
        if (!selectedFile || !selectedFile.name) return false;
        const lowerName = selectedFile.name.toLowerCase();
        return String(acceptText || "").split(",").map(function NormalizeExt(item) {
            return item.trim().toLowerCase();
        }).filter(Boolean).some(function MatchExt(ext) {
            return lowerName.endsWith(ext);
        });
    }

    function BuildHiddenFileInput(publishForm) {
        const hiddenFileInput = document.createElement("input");
        hiddenFileInput.type = "file";
        hiddenFileInput.accept = `${PRODUCT_IMAGE_ACCEPT},${MATERIAL_FILE_ACCEPT}`;
        hiddenFileInput.style.display = "none";
        publishForm.appendChild(hiddenFileInput);
        return hiddenFileInput;
    }

    function CreateUploadTip(uploadPanel) {
        if (!uploadPanel) return null;
        const uploadTipText = document.createElement("p");
        uploadTipText.className = "mt-3 text-xs text-slate-500";
        uploadTipText.textContent = "尚未上传文件";
        uploadPanel.appendChild(uploadTipText);
        return uploadTipText;
    }

    function SetUploadTip(uploadTipText, tipText, isError) {
        if (!uploadTipText) return;
        uploadTipText.textContent = tipText;
        uploadTipText.className = isError ? "mt-3 text-xs text-red-600" : "mt-3 text-xs text-slate-500";
    }

    function BindDropUpload(uploadPanel, hiddenFileInput, uploadFunction) {
        if (!uploadPanel || !hiddenFileInput) return;
        uploadPanel.addEventListener("dragover", function HandleDragOver(event) {
            event.preventDefault();
            uploadPanel.classList.add("border-[#005d90]");
        });
        uploadPanel.addEventListener("dragleave", function HandleDragLeave() {
            uploadPanel.classList.remove("border-[#005d90]");
        });
        uploadPanel.addEventListener("drop", function HandleDrop(event) {
            event.preventDefault();
            uploadPanel.classList.remove("border-[#005d90]");
            const droppedFile = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]
                ? event.dataTransfer.files[0]
                : null;
            uploadFunction(droppedFile);
        });
    }

    function ReadText(inputElement) {
        return inputElement ? String(inputElement.value || "").trim() : "";
    }

    function AddDays(baseDate, days) {
        const nextDate = new Date(baseDate.getTime());
        nextDate.setDate(nextDate.getDate() + Math.max(1, days));
        return nextDate;
    }

    function FormatLocalDateTime(dateValue) {
        const year = dateValue.getFullYear();
        const month = PadNumber(dateValue.getMonth() + 1);
        const day = PadNumber(dateValue.getDate());
        const hour = PadNumber(dateValue.getHours());
        const minute = PadNumber(dateValue.getMinutes());
        const second = PadNumber(dateValue.getSeconds());
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }

    function PadNumber(value) {
        return value < 10 ? `0${value}` : String(value);
    }

    function BuildMessageBar(publishForm) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg border border-[rgba(120,133,150,0.16)] bg-white/82 px-3 py-2 text-sm text-slate-600";
        messageBar.style.display = "none";
        publishForm.insertBefore(messageBar, publishForm.firstChild);
        return messageBar;
    }

    function FormatFileSize(fileSizeBytes) {
        if (!fileSizeBytes || fileSizeBytes <= 0) return "0 KB";
        if (fileSizeBytes >= 1024 * 1024) return `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(fileSizeBytes / 1024).toFixed(2)} KB`;
    }

    function EscapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700";
        messageBar.textContent = message;
    }

    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700";
        messageBar.textContent = message;
    }

    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }
})();
