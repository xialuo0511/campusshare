/**
 * 发布页面逻辑
 */
(function InitPublishCreatePage() {
    /** 资料业务默认文件类型 */
    const DEFAULT_FILE_TYPE = "application/octet-stream";
    /** 资料业务默认文件大小 */
    const DEFAULT_FILE_SIZE_BYTES = 1024;

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

        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant";
        messageBar.style.display = "none";
        publishForm.insertBefore(messageBar, publishForm.firstChild);

        let selectedCondition = "";
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

        publishForm.addEventListener("submit", async function HandleSubmit(event) {
            event.preventDefault();
            HideMessage(messageBar);
            submitButton.disabled = true;
            submitButton.classList.add("opacity-70");
            try {
                const materialPayload = BuildMaterialPayload(
                    titleInput,
                    categorySelect,
                    selectedCondition,
                    priceInput,
                    locationSelect,
                    descriptionInput,
                    copyrightCheckbox
                );
                const result = await window.CampusShareApi.UploadMaterial(materialPayload);
                ShowSuccess(
                    messageBar,
                    `发布成功，资料ID：${result.materialId}，状态：${result.materialStatus}`
                );
                publishForm.reset();
                selectedCondition = "";
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "发布失败，请稍后重试");
            } finally {
                submitButton.disabled = false;
                submitButton.classList.remove("opacity-70");
            }
        });
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
        copyrightCheckbox
    ) {
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
            fileId: `web-${Date.now()}`,
            fileType: DEFAULT_FILE_TYPE,
            fileSizeBytes: DEFAULT_FILE_SIZE_BYTES,
            copyrightDeclared: !!(copyrightCheckbox && copyrightCheckbox.checked)
        };
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

