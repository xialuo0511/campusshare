/**
 * 鍙戝竷椤甸潰閫昏緫
 */
(function InitPublishCreatePage() {
    const PRODUCT_IMAGE_ACCEPT = ".jpg,.jpeg,.png";
    const MATERIAL_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png";
    const PUBLISH_PAGE_PATH = "/pages/publish_create.html";

    const MODE_PRODUCT = "product";
    const MODE_MATERIAL = "material";
    const MODE_RECRUITMENT = "recruitment";

    /**
     * 椤甸潰鍒濆鍖?     */
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
            ShowError(messageBar, "璇峰厛鐧诲綍鍚庡啀鍙戝竷鍐呭");
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
            ShowError(messageBar, "褰撳墠璐﹀彿鏈€氳繃璁よ瘉鍗栧瀹℃牳锛屾殏涓嶈兘鍙戝竷鍟嗗搧");
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
            view.browseFileButton.textContent = "閫夋嫨闄勪欢";
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
            SetUploadTip(uploadTipText, mode === MODE_RECRUITMENT ? "鎷涘嫙鍙戝竷鏃犻渶涓婁紶鏂囦欢" : "灏氭湭涓婁紶鏂囦欢");
        }

        if (!isEditMode && mode === MODE_RECRUITMENT) {
            SetUploadTip(uploadTipText, "灏氭湭涓婁紶甯栧瓙闄勪欢");
        }

        publishForm.addEventListener("submit", async function HandleSubmit(event) {
            event.preventDefault();
            HideMessage(messageBar);
            view.submitButton.disabled = true;
            view.submitButton.classList.add("opacity-70");
            try {
                if (isUploadingFile) {
                    throw new Error("鏂囦欢涓婁紶涓紝璇风◢鍚庨噸璇?);
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
                    SetUploadTip(uploadTipText, mode === MODE_RECRUITMENT ? "鎷涘嫙鍙戝竷鏃犻渶涓婁紶鏂囦欢" : "灏氭湭涓婁紶鏂囦欢");
                }

                if (mode === MODE_RECRUITMENT) {
                    SetUploadTip(uploadTipText, "灏氭湭涓婁紶甯栧瓙闄勪欢");
                }

                window.setTimeout(function JumpAfterSubmit() {
                    window.location.href = submitResult.redirectPath;
                }, 900);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "鎻愪氦澶辫触锛岃绋嶅悗閲嶈瘯");
            } finally {
                view.submitButton.disabled = false;
                view.submitButton.classList.remove("opacity-70");
            }
        });

        /**
         * 涓婁紶閫変腑鏂囦欢
         */
        async function UploadSelectedFile(selectedFile) {
            if (!selectedFile) {
                return;
            }
            const acceptRule = mode === MODE_PRODUCT ? PRODUCT_IMAGE_ACCEPT : MATERIAL_FILE_ACCEPT;
            if (!IsSupportedFileByAccept(selectedFile, acceptRule)) {
                const errorText = mode === MODE_PRODUCT ? "浠呮敮鎸?JPG/PNG 鍥剧墖" : "浠呮敮鎸?PDF/JPG/PNG 鏂囦欢";
                SetUploadTip(uploadTipText, errorText, true);
                ShowError(messageBar, errorText);
                return;
            }

            isUploadingFile = true;
            view.submitButton.disabled = true;
            view.submitButton.classList.add("opacity-70");
            SetUploadTip(uploadTipText, `姝ｅ湪涓婁紶锛?{selectedFile.name}`);
            try {
                const uploadResult = await window.CampusShareApi.UploadMaterialFile(selectedFile);
                uploadedFileMeta = uploadResult;
                SetUploadTip(
                    uploadTipText,
                    `宸蹭笂浼狅細${uploadResult.fileName} (${FormatFileSize(uploadResult.fileSizeBytes)})`
                );
                HideMessage(messageBar);
            } catch (error) {
                uploadedFileMeta = null;
                SetUploadTip(uploadTipText, "涓婁紶澶辫触锛岃閲嶈瘯", true);
                ShowError(messageBar, error instanceof Error ? error.message : "鏂囦欢涓婁紶澶辫触");
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
         * 鍔犺浇鍟嗗搧缂栬緫鑽夌
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
                    SetUploadTip(uploadTipText, "宸插姞杞界幇鏈夊浘鐗囷紝鍙噸鏂颁笂浼犳浛鎹?);
                } else {
                    SetUploadTip(uploadTipText, "褰撳墠鍟嗗搧鏆傛棤鍥剧墖锛岃涓婁紶鏂板浘鐗?, true);
                }
                HideMessage(messageBar);
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "鍟嗗搧璇︽儏鍔犺浇澶辫触");
                return;
            } finally {
                view.submitButton.disabled = false;
                view.submitButton.classList.remove("opacity-70");
            }
        }
    }

    /**
     * 鏋勫缓椤甸潰鑺傜偣
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
            pricePrefix: publishForm.querySelector("[data-role='publish-price-prefix']"),
            locationLabel: publishForm.querySelector("[data-role='publish-location-label']"),
            descriptionLabel: publishForm.querySelector("[data-role='publish-description-label']"),
            uploadTitle: publishForm.querySelector("[data-role='publish-upload-title']"),
            uploadDescription: publishForm.querySelector("[data-role='publish-upload-description']"),
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
     * 搴旂敤妯″紡 UI
     */
    function ApplyModeUi(mode, view, isEditMode) {
        if (mode === MODE_MATERIAL) {
            view.pageTitle.textContent = "涓婁紶瀛︽湳璧勬枡";
            view.titleLabel.textContent = "璧勬枡鏍囬";
            view.categoryLabel.textContent = "璧勬枡鍒嗙被";
            view.descriptionLabel.textContent = "璧勬枡绠€浠?;
            view.submitButton.textContent = "涓婁紶璧勬枡";
            view.browseFileButton.textContent = "閫夋嫨璧勬枡鏂囦欢";
            view.conditionSection.classList.add("hidden");
            view.priceFieldWrapper.classList.add("hidden");
            view.locationFieldWrapper.classList.add("hidden");
            view.copyrightSection.classList.remove("hidden");
            view.copyrightText.textContent = "鎴戠‘璁ゆ嫢鏈夊垎浜璧勬枡鐨勬潈闄愶紝涓嶈繚鍙嶅钩鍙颁笌瀛︽牎鐗堟潈瑙勮寖";
            view.titleInput.placeholder = "渚嬪锛氶珮绛夋暟瀛︽湡鏈涔犳彁绾?;
            view.descriptionInput.placeholder = "绠€瑕佹弿杩拌祫鏂欏唴瀹广€侀€傜敤璇剧▼涓庣珷鑺?;
            RenderSelectOptions(view.categorySelect, [
                { label: "閫夋嫨鍒嗙被", value: "" },
                { label: "璇剧▼璁蹭箟", value: "璇剧▼璁蹭箟" },
                { label: "瀹為獙鎶ュ憡", value: "瀹為獙鎶ュ憡" },
                { label: "鑰冭瘯璧勬枡", value: "鑰冭瘯璧勬枡" },
                { label: "椤圭洰鏂囨。", value: "椤圭洰鏂囨。" }
            ]);
            return;
        }

        if (mode === MODE_RECRUITMENT) {
            view.pageTitle.textContent = "鍙戝竷缁勯槦鎷涘嫙";
            view.titleLabel.textContent = "鎷涘嫙涓婚";
            view.categoryLabel.textContent = "鎷涘嫙鏂瑰悜";
            view.priceLabel.textContent = "鎷涘嫙浜烘暟";
            view.locationLabel.textContent = "鎷涘嫙鎴";
            view.descriptionLabel.textContent = "鎶€鑳借姹?;
            view.submitButton.textContent = "鍙戝竷鎷涘嫙";
            view.conditionSection.classList.add("hidden");
            view.browseFileButton.textContent = "閫夋嫨闄勪欢";
            view.uploadPanel.classList.remove("hidden");
            view.copyrightSection.classList.add("hidden");
            SetPricePrefixVisible(view, false);
            SetUploadCopy(view, "涓婁紶甯栧瓙闄勪欢", "鏀寔 JPG銆丳NG銆丳DF锛屼笂浼犲悗浼氶殢鎷涘嫙璇存槑淇濆瓨鏂囦欢 ID銆?);
            view.titleInput.placeholder = "渚嬪锛氱畻娉曠珵璧涚粍闃?;
            view.priceInput.placeholder = "璇疯緭鍏ヤ汉鏁?;
            view.descriptionInput.placeholder = "璇疯緭鍏ラ渶瑕佺殑鎶€鑳戒笌鍗忎綔瑕佹眰";
            view.priceInput.step = "1";
            view.priceInput.min = "1";
            RenderSelectOptions(view.categorySelect, [
                { label: "閫夋嫨鏂瑰悜", value: "" },
                { label: "绠楁硶", value: "绠楁硶" },
                { label: "鍓嶇", value: "鍓嶇" },
                { label: "鍚庣", value: "鍚庣" },
                { label: "浜у搧/杩愯惀", value: "浜у搧/杩愯惀" },
                { label: "缁煎悎", value: "缁煎悎" }
            ]);
            RenderSelectOptions(view.locationSelect, [
                { label: "3 澶╁悗鎴", value: "3" },
                { label: "7 澶╁悗鎴", value: "7" },
                { label: "14 澶╁悗鎴", value: "14" }
            ]);
            return;
        }

        view.pageTitle.textContent = isEditMode ? "缂栬緫鍟嗗搧" : "鍒涘缓鏂板彂甯?;
        view.titleLabel.textContent = "鍟嗗搧鏍囬";
        view.categoryLabel.textContent = "鍒嗙被";
        view.priceLabel.textContent = "浠锋牸 (缇庡厓)";
        view.locationLabel.textContent = "浜ゆ槗鍦扮偣";
        view.descriptionLabel.textContent = "璇︾粏鎻忚堪";
        view.submitButton.textContent = isEditMode ? "淇濆瓨淇敼" : "鍙戝竷鍟嗗搧";
        view.browseFileButton.textContent = "娴忚鏂囦欢";
        view.conditionSection.classList.remove("hidden");
        view.uploadPanel.classList.remove("hidden");
        view.priceFieldWrapper.classList.remove("hidden");
        view.locationFieldWrapper.classList.remove("hidden");
        view.copyrightSection.classList.remove("hidden");
        view.copyrightText.textContent = "鎴戝０鏄庢鏉愭枡锛堝鏋滄槸鐢靛瓙鐗堬級涓嶈繚鍙嶆満鏋勭増鏉冩斂绛栵紝骞朵笖鎴戞湁鏉冨湪 CampusShare 缃戠粶鍐呭叡浜鍐呭銆?;
        view.titleInput.placeholder = "渚嬪锛氭湁鏈哄寲瀛︾鍥涚増 - Smith";
        view.descriptionInput.placeholder = "鎻忚堪鐗╁搧鏂版棫绋嬪害銆佸寘鍚殑绔犺妭鎴栦换浣曠己椤垫儏鍐?..";
    }

    /**
     * 鏍规嵁妯″紡鎻愪氦
     */
    function SetPricePrefixVisible(view, visible) {
        if (view.pricePrefix) {
            view.pricePrefix.classList.toggle("hidden", !visible);
        }
        if (!view.priceInput) {
            return;
        }
        view.priceInput.classList.toggle("pl-8", visible);
        view.priceInput.classList.toggle("px-4", !visible);
    }

    function SetUploadCopy(view, titleText, descriptionText) {
        if (view.uploadTitle) {
            view.uploadTitle.textContent = titleText;
        }
        if (view.uploadDescription) {
            view.uploadDescription.textContent = descriptionText;
        }
    }

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
                successText: `涓婁紶鎴愬姛锛岃祫鏂橧D锛?{result.materialId}`,
                redirectPath: "/pages/market_listing.html?view=MATERIAL"
            };
        }

        if (mode === MODE_RECRUITMENT) {
            const payload = BuildRecruitmentPayload(view, uploadedFileMeta);
            const result = await window.CampusShareApi.PublishTeamRecruitment(payload);
            return {
                successText: `鍙戝竷鎴愬姛锛屾嫑鍕烮D锛?{result.recruitmentId}`,
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
                ? `缂栬緫鎴愬姛锛屽晢鍝両D锛?{result.productId}`
                : `鍙戝竷鎴愬姛锛屽晢鍝両D锛?{result.productId}`,
            redirectPath: redirectPath
        };
    }

    /**
     * 鏋勫缓鍟嗗搧鍙傛暟
     */
    function BuildProductPayload(view, selectedCondition, imageFileIdList) {
        const title = ReadText(view.titleInput);
        const category = ReadText(view.categorySelect);
        const conditionLevel = String(selectedCondition || "").trim();
        const tradeLocation = ReadText(view.locationSelect);
        const priceText = ReadText(view.priceInput);
        const description = ReadText(view.descriptionInput);

        if (!title) {
            throw new Error("鍟嗗搧鏍囬涓嶈兘涓虹┖");
        }
        if (!category) {
            throw new Error("璇烽€夋嫨鍟嗗搧鍒嗙被");
        }
        if (!conditionLevel) {
            throw new Error("璇烽€夋嫨鍟嗗搧鎴愯壊");
        }
        if (!tradeLocation) {
            throw new Error("浜ゆ槗鍦扮偣涓嶈兘涓虹┖");
        }
        const priceNumber = Number(priceText);
        if (!priceText || Number.isNaN(priceNumber)) {
            throw new Error("璇疯緭鍏ユ纭环鏍?);
        }
        if (priceNumber < 0) {
            throw new Error("浠锋牸涓嶈兘灏忎簬0");
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
     * 鏋勫缓璧勬枡鍙傛暟
     */
    function BuildMaterialPayload(view, uploadedFileMeta) {
        const title = ReadText(view.titleInput);
        const category = ReadText(view.categorySelect);
        const description = ReadText(view.descriptionInput);
        const copyrightDeclared = !!(view.copyrightCheckbox && view.copyrightCheckbox.checked);

        if (!title) {
            throw new Error("璧勬枡鏍囬涓嶈兘涓虹┖");
        }
        if (!category) {
            throw new Error("璇烽€夋嫨璧勬枡鍒嗙被");
        }
        if (!uploadedFileMeta || !uploadedFileMeta.fileId) {
            throw new Error("璇峰厛涓婁紶璧勬枡鏂囦欢");
        }
        if (!copyrightDeclared) {
            throw new Error("璇峰嬀閫夌増鏉冨０鏄?);
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
     * 鏋勫缓鎷涘嫙鍙傛暟
     */
    function BuildRecruitmentPayload(view, uploadedFileMeta) {
        const eventName = ReadText(view.titleInput);
        const direction = ReadText(view.categorySelect);
        const memberLimitText = ReadText(view.priceInput);
        const skillRequirement = ReadText(view.descriptionInput);
        const deadlineDaysText = ReadText(view.locationSelect) || "7";
        const deadlineDays = Number(deadlineDaysText);
        const memberLimit = Number(memberLimitText);

        if (!eventName) {
            throw new Error("鎷涘嫙涓婚涓嶈兘涓虹┖");
        }
        if (!direction) {
            throw new Error("璇烽€夋嫨鎷涘嫙鏂瑰悜");
        }
        if (!memberLimitText || Number.isNaN(memberLimit) || memberLimit < 1) {
            throw new Error("鎷涘嫙浜烘暟闇€涓哄ぇ浜?0 鐨勬暣鏁?);
        }

        return {
            eventName: eventName,
            direction: direction,
            memberLimit: Math.floor(memberLimit),
            deadline: FormatLocalDateTime(AddDays(new Date(), Number.isNaN(deadlineDays) ? 7 : deadlineDays)),
            skillRequirement: BuildRecruitmentSkillRequirement(skillRequirement, uploadedFileMeta)
        };
    }

    function BuildRecruitmentSkillRequirement(skillRequirement, uploadedFileMeta) {
        const baseText = String(skillRequirement || "").trim();
        if (!uploadedFileMeta || !uploadedFileMeta.fileId) {
            return baseText;
        }
        const fileName = uploadedFileMeta.fileName || "闄勪欢";
        const attachmentText = `\n闄勪欢锛?{fileName}锛堟枃浠禝D锛?{uploadedFileMeta.fileId}锛塦;
        const maxBaseLength = Math.max(0, 500 - attachmentText.length);
        return `${baseText.slice(0, maxBaseLength)}${attachmentText}`;
    }

    /**
     * 瑙ｆ瀽鍙戝竷绫诲瀷
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
     * 缂栬緫鍟嗗搧ID
     */
    function ResolveEditingProductId() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const productId = Number(searchParams.get("productId") || "0");
        return Number.isNaN(productId) ? 0 : productId;
    }

    /**
     * 褰撳墠璺緞+鏌ヨ
     */
    function ResolveCurrentPagePathWithQuery() {
        return `${PUBLISH_PAGE_PATH}${window.location.search || ""}`;
    }

    /**
     * 璇诲彇褰撳墠鐢ㄦ埛
     */
    async function ResolveCurrentProfile() {
        try {
            if (window.CampusShareApi.SyncSessionProfile) {
                await window.CampusShareApi.SyncSessionProfile();
            }
        } catch (error) {
            // 浼氳瘽鍚屾澶辫触鏃剁户缁娇鐢ㄦ湰鍦扮紦瀛?        }
        return window.CampusShareApi.GetCurrentUserProfile
            ? window.CampusShareApi.GetCurrentUserProfile()
            : null;
    }

    /**
     * 鏄惁鏈夊晢鍝佸彂甯冩潈闄?     */
    function HasPublishPermission(profile) {
        const userRole = profile && profile.userRole ? profile.userRole : "";
        return userRole === "VERIFIED_SELLER" || userRole === "ADMINISTRATOR";
    }

    /**
     * 鏍￠獙缂栬緫鏉冮檺
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
        throw new Error("鏃犳潈缂栬緫璇ュ晢鍝?);
    }

    /**
     * 璁剧疆涓嬫媺鍊?     */
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
     * 娓叉煋涓嬫媺閫夐」
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
     * 搴旂敤鎴愯壊閫夋嫨
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
     * 瑙ｆ瀽鍥剧墖ID
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
     * 鎻愪氦鏃跺浘鐗嘔D
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
            throw new Error("璇峰厛涓婁紶鍟嗗搧鍥剧墖");
        }
        return normalizedList;
    }

    /**
     * 鍟嗗搧鍙戝竷鍚庤烦杞?     */
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
     * 鏂囦欢绫诲瀷鏍￠獙
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
     * 鏋勫缓闅愯棌鏂囦欢杈撳叆
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
     * 鍒涘缓涓婁紶鎻愮ず
     */
    function CreateUploadTip(uploadPanel) {
        if (!uploadPanel) {
            return null;
        }
        const uploadTipText = document.createElement("p");
        uploadTipText.className = "mt-3 text-xs text-slate-500";
        uploadTipText.textContent = "灏氭湭涓婁紶鏂囦欢";
        uploadPanel.appendChild(uploadTipText);
        return uploadTipText;
    }

    /**
     * 璁剧疆涓婁紶鎻愮ず
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
     * 缁戝畾鎷栨嫿涓婁紶
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
     * 鏂囨湰璇诲彇
     */
    function ReadText(inputElement) {
        if (!inputElement) {
            return "";
        }
        return String(inputElement.value || "").trim();
    }

    /**
     * 鏃ユ湡鍔犲ぉ鏁?     */
    function AddDays(baseDate, days) {
        const nextDate = new Date(baseDate.getTime());
        nextDate.setDate(nextDate.getDate() + Math.max(1, days));
        return nextDate;
    }

    /**
     * 鏈湴鏃堕棿鏍煎紡 yyyy-MM-ddTHH:mm:ss
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
     * 琛ラ浂
     */
    function PadNumber(value) {
        return value < 10 ? `0${value}` : String(value);
    }

    /**
     * 鏋勫缓娑堟伅鏍?     */
    function BuildMessageBar(publishForm) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant";
        messageBar.style.display = "none";
        publishForm.insertBefore(messageBar, publishForm.firstChild);
        return messageBar;
    }

    /**
     * 鏂囦欢澶у皬鏍煎紡
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
     * HTML 杞箟
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
     * 鎴愬姛鎻愮ず
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200";
        messageBar.textContent = message;
    }

    /**
     * 閿欒鎻愮ず
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200";
        messageBar.textContent = message;
    }

    /**
     * 闅愯棌鎻愮ず
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindPublishPage);
})();

