/**
 * 个人中心页面逻辑
 */
(function InitUserProfilePage() {
    const LEDGER_PREVIEW_SIZE = 5;

    /**
     * 绑定页面
     */
    function BindUserProfilePage() {
        if (!window.CampusShareApi) {
            return;
        }
        if (!window.CampusShareApi.GetAuthToken()) {
            window.CampusShareApi.RedirectToAuthPage("/pages/user_profile.html");
            return;
        }

        const mainElement = document.querySelector("main");
        if (!mainElement) {
            return;
        }

        const modalOverlay = document.querySelector("div.fixed.inset-0.z-50.flex.items-center.justify-center.p-4");
        const toastStack = document.querySelector("div.fixed.bottom-8.right-8.z-\[60\]");
        const editButton = mainElement.querySelector(".col-span-12.lg\\:col-span-8 button");
        const sellerActionButton = mainElement.querySelector(".col-span-12.lg\\:col-span-4 button");
        const messageBar = BuildMessageBar(mainElement);

        if (modalOverlay) {
            modalOverlay.classList.add("hidden");
        }
        if (toastStack) {
            toastStack.classList.add("hidden");
        }

        BindModalActions(modalOverlay, editButton, messageBar);
        BindSellerVerificationAction(sellerActionButton, messageBar);
        LoadProfileData(mainElement, messageBar);
        LoadPointLedger(mainElement, messageBar);
        LoadProfileStats(mainElement, messageBar);
    }

    /**
     * 加载用户资料
     */
    async function LoadProfileData(mainElement, messageBar) {
        try {
            const profileResult = await window.CampusShareApi.SyncSessionProfile();
            if (!profileResult || !profileResult.userId) {
                ShowError(messageBar, "用户信息获取失败");
                return;
            }

            const displayName = profileResult.displayName || profileResult.account || "未命名用户";
            const roleText = profileResult.userRole === "ADMINISTRATOR" ? "管理员" : "普通用户";

            PatchText(mainElement.querySelector("h2.text-2xl.font-bold.text-on-surface"), displayName);
            PatchText(mainElement.querySelector("main p.text-on-surface-variant.flex.items-center.gap-2"), `学术角色 · ${roleText}`);
            PatchText(mainElement.querySelector("aside p.font-headline.font-bold.text-on-surface"), displayName);
            PatchText(mainElement.querySelector("aside p.text-xs.text-slate-500"), roleText);

            const contactNodeList = Array.from(mainElement.querySelectorAll(".col-span-12.lg\\:col-span-8 p.text-on-surface.flex.items-center.gap-2"));
            if (contactNodeList.length >= 1) {
                contactNodeList[0].innerHTML = `<span class=\"material-symbols-outlined text-sm opacity-60\">mail</span> ${EscapeHtml(profileResult.contact || "未设置邮箱")}`;
            }
            if (contactNodeList.length >= 2) {
                contactNodeList[1].innerHTML = "<span class=\"material-symbols-outlined text-sm opacity-60\">badge</span> 已通过校园实名";
            }

            const modalForm = modalOverlayForm();
            if (modalForm) {
                const inputList = modalForm.querySelectorAll("input, select");
                if (inputList.length >= 1) {
                    inputList[0].value = displayName;
                }
                if (inputList.length >= 4) {
                    inputList[3].value = profileResult.contact || "";
                }
            }

            HideMessage(messageBar);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "用户信息加载失败");
        }
    }

    /**
     * 加载积分流水
     */
    async function LoadPointLedger(mainElement, messageBar) {
        try {
            const ledgerResult = await window.CampusShareApi.ListPointLedger(1, LEDGER_PREVIEW_SIZE);
            PatchPointBalance(mainElement, ledgerResult);
            RenderLedgerList(mainElement, ledgerResult);
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "积分数据加载失败");
        }
    }

    /**
     * 加载统计
     */
    async function LoadProfileStats(mainElement, messageBar) {
        try {
            const resultList = await Promise.all([
                window.CampusShareApi.ListMyProducts({ pageNo: 1, pageSize: 1 }),
                window.CampusShareApi.ListMyMaterials({ pageNo: 1, pageSize: 1 })
            ]);
            const productCount = Number(resultList[0].totalCount || 0);
            const materialCount = Number(resultList[1].totalCount || 0);
            const statNodeList = Array.from(mainElement.querySelectorAll(".col-span-12.lg\\:col-span-8 p.text-xl.font-bold.text-on-surface"));
            if (statNodeList.length >= 1) {
                statNodeList[0].textContent = String(productCount);
            }
            if (statNodeList.length >= 2) {
                statNodeList[1].textContent = String(materialCount);
            }
        } catch (error) {
            ShowError(messageBar, error instanceof Error ? error.message : "统计加载失败");
        }
    }

    /**
     * 绑定弹窗
     */
    function BindModalActions(modalOverlay, editButton, messageBar) {
        if (!modalOverlay || !editButton) {
            return;
        }

        const closeButton = modalOverlay.querySelector("button");
        const modalForm = modalOverlay.querySelector("form");
        const cancelButton = modalOverlay.querySelector("button[type='button']");

        editButton.addEventListener("click", function HandleEditClick() {
            modalOverlay.classList.remove("hidden");
        });

        if (closeButton) {
            closeButton.addEventListener("click", function HandleCloseClick() {
                modalOverlay.classList.add("hidden");
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener("click", function HandleCancelClick() {
                modalOverlay.classList.add("hidden");
            });
        }

        modalOverlay.addEventListener("click", function HandleOverlayClick(event) {
            if (event.target === modalOverlay || event.target.classList.contains("absolute")) {
                modalOverlay.classList.add("hidden");
            }
        });

        if (modalForm) {
            modalForm.addEventListener("submit", async function HandleFormSubmit(event) {
                event.preventDefault();
                const inputList = modalForm.querySelectorAll("input, select");
                const displayName = inputList.length >= 1 ? String(inputList[0].value || "").trim() : "";
                const contact = inputList.length >= 4 ? String(inputList[3].value || "").trim() : "";

                if (!displayName) {
                    ShowError(messageBar, "昵称不能为空");
                    return;
                }

                const submitButton = modalForm.querySelector("button[type='submit']");
                if (submitButton) {
                    submitButton.disabled = true;
                }
                try {
                    await window.CampusShareApi.UpdateMyProfile({ displayName, contact });
                    ShowSuccess(messageBar, "资料已更新");
                    modalOverlay.classList.add("hidden");
                    LoadProfileData(document.querySelector("main"), messageBar);
                } catch (error) {
                    ShowError(messageBar, error instanceof Error ? error.message : "资料更新失败");
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                    }
                }
            });
        }
    }

    /**
     * 绑定卖家认证按钮
     */
    function BindSellerVerificationAction(sellerActionButton, messageBar) {
        if (!sellerActionButton || !window.CampusShareApi || !window.CampusShareApi.ApplySellerVerification) {
            return;
        }
        RefreshSellerActionButton(sellerActionButton, messageBar);
        sellerActionButton.addEventListener("click", async function HandleSellerVerificationApply() {
            sellerActionButton.disabled = true;
            try {
                const profile = await ResolveCurrentProfile();
                const payload = {
                    realName: String((profile && profile.displayName) || "").trim() || "未命名用户",
                    contactPhone: String((profile && profile.phone) || "").trim(),
                    qualificationDesc: "申请开通认证卖家权限",
                    credentialFileIds: []
                };
                await window.CampusShareApi.ApplySellerVerification(payload);
                ShowSuccess(messageBar, "认证申请已提交，请等待管理员审核");
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "认证申请提交失败");
            } finally {
                await RefreshSellerActionButton(sellerActionButton, messageBar);
            }
        });
    }

    /**
     * 刷新卖家认证按钮状态
     */
    async function RefreshSellerActionButton(sellerActionButton, messageBar) {
        if (!sellerActionButton || !window.CampusShareApi) {
            return;
        }
        const profile = await ResolveCurrentProfile();
        const userRole = profile && profile.userRole ? profile.userRole : "";
        if (userRole === "VERIFIED_SELLER" || userRole === "ADMINISTRATOR") {
            sellerActionButton.disabled = true;
            sellerActionButton.textContent = "已认证卖家";
            sellerActionButton.classList.add("opacity-70", "cursor-not-allowed");
            return;
        }
        try {
            const latestApplication = await window.CampusShareApi.GetMyLatestSellerVerification();
            const applicationStatus = latestApplication && latestApplication.applicationStatus
                ? latestApplication.applicationStatus
                : "";
            if (applicationStatus === "PENDING_REVIEW") {
                sellerActionButton.disabled = true;
                sellerActionButton.textContent = "卖家认证审核中";
                sellerActionButton.classList.add("opacity-70", "cursor-not-allowed");
                return;
            }
        } catch (error) {
            if (messageBar && error instanceof Error && error.message) {
                ShowError(messageBar, error.message);
            }
        }

        sellerActionButton.disabled = false;
        sellerActionButton.textContent = "申请认证卖家";
        sellerActionButton.classList.remove("opacity-70", "cursor-not-allowed");
    }

    /**
     * 读取当前用户资料
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
            // 会话同步失败时使用本地资料兜底
        }
        return window.CampusShareApi.GetCurrentUserProfile
            ? window.CampusShareApi.GetCurrentUserProfile()
            : null;
    }

    /**
     * 更新积分余额
     */
    function PatchPointBalance(mainElement, ledgerResult) {
        const balanceNode = mainElement.querySelector(".col-span-12.lg\\:col-span-4 h3.text-5xl");
        if (!balanceNode) {
            return;
        }
        const availablePoints = Number(ledgerResult.availablePoints || 0);
        balanceNode.innerHTML = `${EscapeHtml(String(availablePoints))} <span class=\"text-lg font-normal opacity-60 ml-1\">Points</span>`;
    }

    /**
     * 渲染积分流水
     */
    function RenderLedgerList(mainElement, ledgerResult) {
        const listContainer = mainElement.querySelector(".col-span-12.bg-surface-container-low.rounded-xl .space-y-4");
        if (!listContainer) {
            return;
        }
        const transactionList = Array.isArray(ledgerResult.transactionList) ? ledgerResult.transactionList : [];
        if (!transactionList.length) {
            listContainer.innerHTML = "<div class=\"text-sm text-slate-500 p-4 bg-surface-container-lowest rounded-lg\">暂无积分流水</div>";
            return;
        }

        listContainer.innerHTML = transactionList.map(function BuildLedgerItem(transactionItem) {
            const changeAmount = Number(transactionItem.changeAmount || 0);
            const positive = changeAmount >= 0;
            const iconName = positive ? "add_circle" : "remove_circle";
            const iconClass = positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700";
            const amountClass = positive ? "text-green-700" : "text-red-700";
            return [
                "<div class=\"flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg hover:bg-white transition-all\">",
                "<div class=\"flex items-center gap-4\">",
                `<div class=\"p-2 ${iconClass} rounded-full\"><span class=\"material-symbols-outlined\">${iconName}</span></div>`,
                "<div>",
                `<p class=\"font-bold text-on-surface\">${EscapeHtml(transactionItem.transactionRemark || ResolveTransactionTypeText(transactionItem.transactionType))}</p>`,
                `<p class=\"text-xs text-on-surface-variant\">${EscapeHtml(FormatTime(transactionItem.transactionTime))}</p>`,
                "</div>",
                "</div>",
                `<p class=\"text-lg font-bold ${amountClass}\">${EscapeHtml(FormatAmount(changeAmount))}</p>`,
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 类型文案
     */
    function ResolveTransactionTypeText(transactionType) {
        if (transactionType === "UPLOAD_REWARD") {
            return "上传奖励";
        }
        if (transactionType === "DOWNLOAD_COST") {
            return "下载扣减";
        }
        if (transactionType === "SYSTEM_COMPENSATE") {
            return "系统补偿";
        }
        if (transactionType === "MANUAL_ADJUST") {
            return "人工调整";
        }
        return "积分变动";
    }

    /**
     * 金额文案
     */
    function FormatAmount(changeAmount) {
        const numberValue = Number(changeAmount || 0);
        if (Number.isNaN(numberValue)) {
            return "0";
        }
        return numberValue >= 0 ? `+${numberValue}` : `${numberValue}`;
    }

    /**
     * 时间格式化
     */
    function FormatTime(timeText) {
        if (!timeText) {
            return "-";
        }
        const timeValue = new Date(timeText);
        if (Number.isNaN(timeValue.getTime())) {
            return String(timeText);
        }
        return `${timeValue.getFullYear()}-${PadTime(timeValue.getMonth() + 1)}-${PadTime(timeValue.getDate())} ${PadTime(timeValue.getHours())}:${PadTime(timeValue.getMinutes())}`;
    }

    /**
     * 补零
     */
    function PadTime(value) {
        return value < 10 ? `0${value}` : `${value}`;
    }

    /**
     * 文本赋值
     */
    function PatchText(node, text) {
        if (!node) {
            return;
        }
        node.textContent = text;
    }

    /**
     * 表单节点
     */
    function modalOverlayForm() {
        return document.querySelector("div.fixed.inset-0.z-50.flex.items-center.justify-center.p-4 form");
    }

    /**
     * 构建消息栏
     */
    function BuildMessageBar(mainElement) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4";
        messageBar.style.display = "none";
        mainElement.insertBefore(messageBar, mainElement.firstChild);
        return messageBar;
    }

    /**
     * 成功消息
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4 border border-green-200 bg-green-50 text-green-700";
        messageBar.textContent = message;
    }

    /**
     * 错误消息
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm mb-4 border border-red-200 bg-red-50 text-red-700";
        messageBar.textContent = message;
    }

    /**
     * 隐藏消息
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    /**
     * 转义
     */
    function EscapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    document.addEventListener("DOMContentLoaded", BindUserProfilePage);
})();
