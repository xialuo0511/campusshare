/**
 * 发布页面逻辑
 */
(function InitPublishCreatePage() {
    /** 文件选择限制 */
    const MATERIAL_FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf";

    /**
     * 绑定页面行为
     */
    function BindPublishPage() {
        const publishForm = document.querySelector("section form");
        if (!publishForm || !window.CampusShareApi) {
            return;
        }

        const conditionButtons = publishForm.querySelectorAll("button[type='button']");
        const submitButton = publishForm.querySelector("button[type='submit']");
        const titleInput = publishForm.querySelector("input[type='text']");
        const categorySelect = publishForm.querySelector("select");
        const locationSelect = publishForm.querySelectorAll("select")[1];
        const priceInput = publishForm.querySelector("input[type='number']");
        const descriptionInput = publishForm.querySelector("textarea");
        const copyrightCheckbox = publishForm.querySelector("input[type='checkbox']");
        const uploadPanel = publishForm.querySelector(".border-dashed");
        const browseFileButton = uploadPanel ? uploadPanel.querySelector("button[type='button']") : null;
        const uploadTipText = CreateUploadTip(uploadPanel);
        const hiddenFileInput = BuildHiddenFileInput(publishForm);

        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant";
        messageBar.style.display = "none";
        publishForm.insertBefore(messageBar, publishForm.firstChild);

        if (!window.CampusShareApi.GetAuthToken()) {
            ShowError(messageBar, "请先登录后再发布资源");
            window.setTimeout(function RedirectToAuthPage() {
                if (window.CampusShareApi.RedirectToAuthPage) {
                    window.CampusShareApi.RedirectToAuthPage("/pages/publish_create.html");
                    return;
                }
                window.location.href = "/pages/auth_access.html?redirect=%2Fpages%2Fpublish_create.html";
            }, 700);
            return;
        }

        let selectedCondition = "";
        let uploadedFileMeta = null;
        let isUploadingFile = false;
        const usableConditionButtons = Array.from(conditionButtons).slice(0, 3);
        usableConditionButtons.forEach(function BindConditionButton(button, index) {
            button.setAttribute("data-condition", String(index));
            button.addEventListener("click", function HandleConditionClick() {
                selectedCondition = button.textContent ? button.textContent.trim() : "";
                usableConditionButtons.forEach(function ResetStyle(itemButton) {
                    itemButton.classList.remove("border-primary", "bg-primary-container/10", "text-primary");
                    itemButton.classList.add("border-transparent", "bg-surface-container", "text-slate-600");
                });
                button.classList.remove("border-transparent", "bg-surface-container", "text-slate-600");
                button.classList.add("border-primary", "bg-primary-container/10", "text-primary");
                HideMessage(messageBar);
            });
        });
        if (usableConditionButtons[0] && usableConditionButtons[0].textContent) {
            selectedCondition = usableConditionButtons[0].textContent.trim();
        }

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

        publishForm.addEventListener("submit", async function HandleSubmit(event) {
            event.preventDefault();
            HideMessage(messageBar);
            submitButton.disabled = true;
            submitButton.classList.add("opacity-70");
            try {
                if (isUploadingFile) {
                    throw new Error("文件上传中，请稍后重试");
                }
                const materialPayload = BuildMaterialPayload(
                    titleInput,
                    categorySelect,
                    selectedCondition,
                    priceInput,
                    locationSelect,
                    descriptionInput,
                    copyrightCheckbox,
                    uploadedFileMeta
                );
                const result = await window.CampusShareApi.UploadMaterial(materialPayload);
                ShowSuccess(
                    messageBar,
                    `发布成功，资料ID：${result.materialId}，状态：${result.materialStatus}`
                );
                publishForm.reset();
                selectedCondition = usableConditionButtons[0] && usableConditionButtons[0].textContent
                    ? usableConditionButtons[0].textContent.trim()
                    : "";
                uploadedFileMeta = null;
                SetUploadTip(uploadTipText, "尚未上传文件");
                ResetConditionButtons(usableConditionButtons);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "发布失败，请稍后重试");
            } finally {
                submitButton.disabled = false;
                submitButton.classList.remove("opacity-70");
            }
        });

        /**
         * 上传选中文件
         */
        async function UploadSelectedFile(selectedFile) {
            if (!selectedFile) {
                return;
            }
            if (!window.CampusShareApi.GetAuthToken()) {
                ShowError(messageBar, "请先登录后再上传文件");
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
                ShowError(messageBar, error instanceof Error ? error.message : "文件上传失败");
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
     * 构建资料上传参数
     */
    function BuildMaterialPayload(
        titleInput,
        categorySelect,
        selectedCondition,
        priceInput,
        locationSelect,
        descriptionInput,
        copyrightCheckbox,
        uploadedFileMeta
    ) {
        if (!uploadedFileMeta || !uploadedFileMeta.fileId) {
            throw new Error("请先上传资料文件");
        }
        const courseName = titleInput && titleInput.value ? titleInput.value.trim() : "";
        const categoryText = categorySelect && categorySelect.value ? categorySelect.value.trim() : "";
        const locationText = locationSelect && locationSelect.value ? locationSelect.value.trim() : "";
        const detailText = descriptionInput && descriptionInput.value ? descriptionInput.value.trim() : "";
        const priceText = priceInput && priceInput.value ? priceInput.value.trim() : "";
        const tags = [categoryText, selectedCondition]
            .filter(function FilterEmptyTag(item) {
                return !!item && item !== "选择分类";
            });

        let mergedDescription = detailText;
        const extraLines = [];
        if (priceText) {
            extraLines.push(`参考价格：${priceText}`);
        }
        if (locationText) {
            extraLines.push(`交易地点：${locationText}`);
        }
        if (extraLines.length > 0) {
            mergedDescription = mergedDescription
                ? `${mergedDescription}\n${extraLines.join("；")}`
                : extraLines.join("；");
        }

        return {
            courseName,
            tags,
            description: mergedDescription,
            fileId: uploadedFileMeta.fileId,
            fileType: uploadedFileMeta.fileType,
            fileSizeBytes: uploadedFileMeta.fileSizeBytes,
            copyrightDeclared: !!(copyrightCheckbox && copyrightCheckbox.checked)
        };
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
        hiddenFileInput.accept = MATERIAL_FILE_ACCEPT;
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
     * 重置新旧程度按钮样式
     */
    function ResetConditionButtons(usableConditionButtons) {
        usableConditionButtons.forEach(function ResetConditionButtonStyle(button, index) {
            if (index === 0) {
                button.classList.remove("border-transparent", "bg-surface-container", "text-slate-600");
                button.classList.add("border-primary", "bg-primary-container/10", "text-primary");
                return;
            }
            button.classList.remove("border-primary", "bg-primary-container/10", "text-primary");
            button.classList.add("border-transparent", "bg-surface-container", "text-slate-600");
        });
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
