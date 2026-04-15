/**
 * 市场总览页面脚本
 */
(function InitMarketOverviewPage() {
    const RECRUITMENT_HIGHLIGHT_SIZE = 2;
    const FALLBACK_PRODUCT_IMAGE_LIST = [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuApdsaVW3k1rzHTiDBbt9C8imJfX2GeM8ktoMJcLKshJ-s4j-Kl3vGCKjeEOOprwxXNoCFivzhW996tfni4B6i8ALn0fF1ZxG4pyLiS29_KFoFP7WNDPPhYK7wZjGuMqZlSsX5E4fqdggYUCoPqOlFMOGMbEvrKXuba5FLPRrq0KYLU3P0mBn7d7V8ErooQX5PVn6dl5YycT3IpTfFZ-h6KJoy_YL7pACzuoC6KPn778cYD9vVz1SDoGHAA8c1cluhoukLhA9ieyy8",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBN2BWozkoCD8G1NuF9UkPfYJItLL0Mgp3N_fpjU4lGYDs1slryVrlD77nZtVI55nhkSOIt5PJX_e_Iih0M6-SsH2CRMo6N-lo3gxoGiWQfpr4w3Cz6dou_-JAfO4VWcHD_DX2BX-fBN59OG4dnUdIWeCv2x_3LugMfjXeyaZzEQEyHOGSB4Q3H_nefzu3tdnWKVqMyn0JMkxSvMTFwZ_K91Ecp7o3qZH5xUWk088PFzIitje1JvqW1imSCA38j2CK1yPqjkJQeBPo",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCHfby1lJKMbOsYV5_szwUuC5lOqca90AturQRz6jGH1blLWQ8nWYqD5j00_q3qVuh2H5AynP55_KCNJeSyTPXfSr4ubdZADwPbfeGxdcLmoftTD3dI6WnZHu8-hotIcxEba23fFgkMaSWon_pJOCvTDkOH9b0Nw55RfJ8szS1MwAV6GwMGdKwVd1npODxLAZ1l4ogUJp184y2GHT1Zfu-ZOQ8chtWCbyfVGppWuaPmNUmAykwlZ2p04IQF2nHmqcw9TFAZksxHHeQ",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAo7pPcp6JjLS2QFFEPQ3KjJfWbrtwiWxs2XKQ6lwFVhYnJEv16KIFLU1Z8kutOSad6YWA_6qQPAAVPsvtxVlaS5irP1rxAsB9xKxOfPkt8xzpoo9v6gykwOQv_avF48pLsVtLJWEE5ddIj8yPlopkGLsQFlRYUoydZBUum1WNy2Us3Cs5lkS_67F0Ica5wjHx5pKkRDWxwiLn1soMTPpkXrl1QK5kU2IGlyMqTM-dvC_o__lcJbE6Bz5SgfAI2jogL3r562MxzzD8"
    ];
    const RECRUITMENT_STATUS_TEXT_MAP = {
        RECRUITING: "招募中",
        FULL: "已满员",
        CLOSED: "已关闭",
        EXPIRED: "已过期"
    };

    /**
     * 页面初始化
     */
    function BindMarketOverviewPage() {
        if (!window.CampusShareApi) {
            return;
        }

        const pageSection = document.querySelector("main section.flex-1.min-w-0");
        if (!pageSection) {
            return;
        }

        const view = {
            pageSection,
            primaryActionButton: document.querySelector("[data-role='overview-primary-action']"),
            profileNameNode: document.querySelector("[data-role='overview-profile-name']"),
            profileRoleNode: document.querySelector("[data-role='overview-profile-role']"),
            profileAvatarNode: document.querySelector("[data-role='overview-profile-avatar']"),
            noticeListNode: document.querySelector("[data-role='overview-notice-list']"),
            recommendedSummaryNode: document.querySelector("[data-role='overview-recommended-summary']"),
            productGridNode: document.querySelector("[data-role='overview-product-grid']"),
            materialListNode: document.querySelector("[data-role='overview-material-list']"),
            recruitmentListNode: document.querySelector("[data-role='overview-recruitment-list']")
        };
        view.messageBarNode = BuildMessageBar(pageSection);

        SyncTopActionButton(view.primaryActionButton);
        SyncProfilePanel(view);
        BindRecommendedProductClick(view.productGridNode);
        BindMaterialDownload(view, view.materialListNode);
        RenderLoadingState(view);

        LoadOverviewData(view);
        LoadNoticeData(view.noticeListNode);
    }

    /**
     * 同步顶部主按钮
     */
    function SyncTopActionButton(actionButton) {
        if (!actionButton) {
            return;
        }
        const hasLoginSession = !!window.CampusShareApi.GetAuthToken();
        if (hasLoginSession) {
            actionButton.textContent = "发布";
            actionButton.setAttribute("data-nav-target", "/pages/publish_create.html");
            return;
        }
        const authPath = window.CampusShareApi.BuildAuthPageUrl
            ? window.CampusShareApi.BuildAuthPageUrl("/pages/market_overview.html")
            : "/pages/auth_access.html";
        actionButton.textContent = "登录";
        actionButton.setAttribute("data-nav-target", authPath);
    }

    /**
     * 同步左侧用户信息
     */
    function SyncProfilePanel(view) {
        const profile = window.CampusShareApi.GetCurrentUserProfile();
        const hasLoginSession = profile && profile.userId;
        if (!view.profileNameNode || !view.profileRoleNode || !view.profileAvatarNode) {
            return;
        }
        if (!hasLoginSession) {
            view.profileNameNode.textContent = "未登录用户";
            view.profileRoleNode.textContent = "游客模式";
            view.profileAvatarNode.textContent = "未";
            return;
        }
        const displayName = profile.displayName || profile.account || "已登录用户";
        const roleText = profile.userRole === "ADMINISTRATOR" ? "管理员" : "普通用户";
        view.profileNameNode.textContent = displayName;
        view.profileRoleNode.textContent = roleText;
        view.profileAvatarNode.textContent = ResolveAvatarText(displayName);
    }

    /**
     * 推荐商品点击跳转
     */
    function BindRecommendedProductClick(productGridNode) {
        if (!productGridNode) {
            return;
        }
        productGridNode.addEventListener("click", function HandleRecommendedClick(event) {
            const cardNode = event.target.closest("[data-product-id]");
            if (!cardNode) {
                return;
            }
            const productId = cardNode.getAttribute("data-product-id");
            if (!productId) {
                return;
            }
            window.location.href = `/pages/market_item_detail.html?productId=${encodeURIComponent(productId)}`;
        });
    }

    /**
     * 资料下载动作
     */
    function BindMaterialDownload(view, materialListNode) {
        if (!materialListNode) {
            return;
        }
        materialListNode.addEventListener("click", async function HandleMaterialDownload(event) {
            const buttonNode = event.target.closest("button[data-material-id]");
            if (!buttonNode) {
                return;
            }
            const materialId = buttonNode.getAttribute("data-material-id");
            if (!materialId) {
                return;
            }
            if (!window.CampusShareApi.GetAuthToken()) {
                ShowError(view.messageBarNode, "请先登录后再下载资料");
                window.setTimeout(function RedirectLoginForDownload() {
                    window.CampusShareApi.RedirectToAuthPage("/pages/market_overview.html");
                }, 600);
                return;
            }
            buttonNode.disabled = true;
            try {
                const result = await window.CampusShareApi.DownloadMaterial(materialId);
                ShowSuccess(view.messageBarNode, "资料下载授权成功，正在打开文件");
                if (result && result.fileAccessUrl) {
                    window.open(result.fileAccessUrl, "_blank");
                }
            } catch (error) {
                ShowError(view.messageBarNode, GetErrorMessage(error, "资料下载失败"));
            } finally {
                buttonNode.disabled = false;
            }
        });
    }

    /**
     * 渲染初始加载态
     */
    function RenderLoadingState(view) {
        if (view.noticeListNode) {
            view.noticeListNode.innerHTML = "<p class=\"text-xs text-outline px-2\">加载中...</p>";
        }
        if (view.productGridNode) {
            view.productGridNode.innerHTML = "<div class=\"col-span-full text-center text-sm text-outline py-10\">加载中...</div>";
        }
        if (view.materialListNode) {
            view.materialListNode.innerHTML = "<div class=\"text-center text-sm text-outline py-6\">加载中...</div>";
        }
        if (view.recruitmentListNode) {
            view.recruitmentListNode.innerHTML = "<div class=\"p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-xs opacity-80\">加载中...</div>";
        }
    }

    /**
     * 加载首页数据
     */
    async function LoadOverviewData(view) {
        try {
            const resultList = await Promise.all([
                window.CampusShareApi.GetMarketOverview(),
                window.CampusShareApi.ListTeamRecruitments({
                    pageNo: 1,
                    pageSize: RECRUITMENT_HIGHLIGHT_SIZE
                })
            ]);

            const overviewResult = resultList[0] || {};
            const recruitmentResult = resultList[1] || {};
            const recommendedProductList = Array.isArray(overviewResult.recommendedProductList)
                ? overviewResult.recommendedProductList
                : [];
            const featuredMaterialList = Array.isArray(overviewResult.featuredMaterialList)
                ? overviewResult.featuredMaterialList
                : [];
            const recruitmentList = Array.isArray(recruitmentResult.recruitmentList)
                ? recruitmentResult.recruitmentList
                : [];

            RenderRecommendedProducts(view.productGridNode, recommendedProductList);
            RenderFeaturedMaterials(view.materialListNode, featuredMaterialList);
            RenderRecruitmentHighlights(view.recruitmentListNode, recruitmentList);

            if (view.recommendedSummaryNode) {
                view.recommendedSummaryNode.textContent = `当前在架商品 ${SafeNumber(overviewResult.publishedProductCount)} 件，资料 ${SafeNumber(overviewResult.publishedMaterialCount)} 份`;
            }
            HideMessage(view.messageBarNode);
        } catch (error) {
            RenderRecommendedProducts(view.productGridNode, []);
            RenderFeaturedMaterials(view.materialListNode, []);
            RenderRecruitmentHighlights(view.recruitmentListNode, []);
            if (view.recommendedSummaryNode) {
                view.recommendedSummaryNode.textContent = "暂无推荐交易";
            }
            ShowError(view.messageBarNode, GetErrorMessage(error, "首页数据加载失败"));
        }
    }

    /**
     * 加载消息提醒
     */
    async function LoadNoticeData(noticeListNode) {
        if (!noticeListNode) {
            return;
        }
        if (!window.CampusShareApi.GetAuthToken()) {
            noticeListNode.innerHTML = "<p class=\"text-xs text-outline px-2\">登录后可查看消息提醒</p>";
            return;
        }
        try {
            const notificationList = await window.CampusShareApi.ListMyNotifications();
            RenderNoticeList(noticeListNode, notificationList);
        } catch (error) {
            noticeListNode.innerHTML = `<p class="text-xs text-red-500 px-2">${EscapeHtml(GetErrorMessage(error, "消息加载失败"))}</p>`;
        }
    }

    /**
     * 渲染消息提醒
     */
    function RenderNoticeList(noticeListNode, notificationList) {
        const safeList = Array.isArray(notificationList) ? notificationList.slice(0, 3) : [];
        if (!safeList.length) {
            noticeListNode.innerHTML = "<p class=\"text-xs text-outline px-2\">暂无消息提醒</p>";
            return;
        }
        noticeListNode.innerHTML = safeList.map(function BuildNoticeItem(item) {
            const unreadClass = item.readFlag ? "bg-outline-variant/30" : "bg-primary";
            return [
                "<div class=\"flex gap-3 px-2\">",
                `<div class="w-2 h-2 rounded-full ${unreadClass} mt-1.5 shrink-0"></div>`,
                "<div class=\"min-w-0\">",
                `<p class="text-xs font-semibold truncate">${EscapeHtml(item.title || "系统通知")}</p>`,
                `<p class="text-[10px] text-outline">${EscapeHtml(FormatRelativeTime(item.sendTime))}</p>`,
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 渲染推荐商品
     */
    function RenderRecommendedProducts(productGridNode, productList) {
        if (!productGridNode) {
            return;
        }
        const safeList = Array.isArray(productList) ? productList : [];
        if (!safeList.length) {
            productGridNode.innerHTML = "<div class=\"col-span-full text-center text-sm text-outline py-10\">暂无推荐交易</div>";
            return;
        }
        productGridNode.innerHTML = safeList.map(function BuildProductCard(item, index) {
            return [
                `<div class="bg-surface-container-lowest rounded-xl p-3 border-transparent hover:bg-surface-container-low transition-all cursor-pointer group" data-product-id="${EscapeHtml(String(item.productId || ""))}">`,
                "<div class=\"aspect-square rounded-lg overflow-hidden mb-3 bg-surface-container\">",
                `<img class="w-full h-full object-cover group-hover:scale-105 transition-transform" src="${ResolveProductImage(item, index)}" alt="推荐商品"/>`,
                "</div>",
                "<div class=\"flex flex-col gap-1\">",
                "<div class=\"flex justify-between items-start\">",
                `<h3 class="text-sm font-semibold truncate flex-1">${EscapeHtml(item.title || "-")}</h3>`,
                `<span class="text-primary font-bold ml-2">¥${EscapeHtml(FormatAmount(item.price))}</span>`,
                "</div>",
                "<div class=\"flex items-center gap-2 mb-2\">",
                `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${ResolveConditionClass(item.conditionLevel)}">${EscapeHtml(item.conditionLevel || "-")}</span>`,
                `<span class="text-[10px] text-outline flex items-center gap-0.5"><span class="material-symbols-outlined text-[10px]">location_on</span>${EscapeHtml(item.tradeLocation || "-")}</span>`,
                "</div>",
                `<p class="text-[10px] text-outline truncate">发布者：${EscapeHtml(item.sellerDisplayName || "匿名用户")} · ${EscapeHtml(FormatRelativeTime(item.createTime))}</p>`,
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 渲染精选资料
     */
    function RenderFeaturedMaterials(materialListNode, materialList) {
        if (!materialListNode) {
            return;
        }
        const safeList = Array.isArray(materialList) ? materialList : [];
        if (!safeList.length) {
            materialListNode.innerHTML = "<div class=\"text-center text-sm text-outline py-6\">暂无精选资料</div>";
            return;
        }
        materialListNode.innerHTML = safeList.map(function BuildMaterialCard(item) {
            return [
                "<div class=\"bg-white p-4 rounded-lg flex items-center justify-between hover:shadow-sm transition-shadow\">",
                "<div class=\"flex items-center gap-4 min-w-0\">",
                `<div class="w-10 h-10 rounded ${ResolveFileBgClass(item.fileType)} flex items-center justify-center shrink-0">`,
                `<span class="material-symbols-outlined ${ResolveFileTextClass(item.fileType)}">${ResolveFileIcon(item.fileType)}</span>`,
                "</div>",
                "<div class=\"min-w-0\">",
                `<h4 class="text-sm font-semibold truncate">${EscapeHtml(item.courseName || "-")}</h4>`,
                `<p class="text-[10px] text-outline truncate">由 ${EscapeHtml(item.uploaderDisplayName || "匿名用户")} 分享 · ${EscapeHtml(FormatFileSize(item.fileSizeBytes))} · ${EscapeHtml(String(SafeNumber(item.downloadCount)))} 次下载</p>`,
                "</div>",
                "</div>",
                `<button type="button" data-material-id="${EscapeHtml(String(item.materialId || ""))}" class="material-symbols-outlined text-outline hover:text-primary transition-colors">download</button>`,
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 渲染招募精选
     */
    function RenderRecruitmentHighlights(recruitmentListNode, recruitmentList) {
        if (!recruitmentListNode) {
            return;
        }
        const safeList = Array.isArray(recruitmentList)
            ? recruitmentList.slice(0, RECRUITMENT_HIGHLIGHT_SIZE)
            : [];
        if (!safeList.length) {
            recruitmentListNode.innerHTML = "<div class=\"p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-xs opacity-80\">暂无招募精选</div>";
            return;
        }
        recruitmentListNode.innerHTML = safeList.map(function BuildRecruitmentCard(item, index) {
            const directionText = item.direction || "综合";
            const memberLimit = SafeNumber(item.memberLimit);
            const currentMemberCount = SafeNumber(item.currentMemberCount);
            const remainingSeats = Math.max(0, memberLimit - currentMemberCount);
            const statusText = ResolveRecruitmentStatusText(item.recruitmentStatus);
            const tagClass = index % 2 === 0
                ? "bg-tertiary-fixed-dim text-on-tertiary"
                : "bg-secondary-container text-on-secondary-container";
            return [
                "<div class=\"p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20\">",
                "<div class=\"flex items-center gap-2 mb-2\">",
                `<span class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${tagClass}">${EscapeHtml(directionText)}</span>`,
                `<span class="text-[10px] opacity-70">${EscapeHtml(statusText)} · 剩余 ${EscapeHtml(String(remainingSeats))} 个名额</span>`,
                "</div>",
                `<h4 class="text-sm font-bold mb-1">${EscapeHtml(item.eventName || "未命名招募")}</h4>`,
                `<p class="text-xs opacity-80 line-clamp-2">${EscapeHtml(item.skillRequirement || "暂无技能要求")}</p>`,
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 解析商品图片
     */
    function ResolveProductImage(productItem, index) {
        const imageFileIds = productItem && Array.isArray(productItem.imageFileIds)
            ? productItem.imageFileIds
            : [];
        const fileId = imageFileIds.find(function FindFileId(item) {
            return item && String(item).trim();
        });
        if (fileId && window.CampusShareApi.BuildPublicFileUrl) {
            const url = window.CampusShareApi.BuildPublicFileUrl(fileId);
            if (url) {
                return url;
            }
        }
        return FALLBACK_PRODUCT_IMAGE_LIST[index % FALLBACK_PRODUCT_IMAGE_LIST.length];
    }

    /**
     * 创建消息栏
     */
    function BuildMessageBar(pageSection) {
        const messageBarNode = document.createElement("div");
        messageBarNode.className = "rounded-lg px-3 py-2 text-sm border mb-4";
        messageBarNode.style.display = "none";
        pageSection.insertBefore(messageBarNode, pageSection.firstChild);
        return messageBarNode;
    }

    /**
     * 成功提示
     */
    function ShowSuccess(messageBarNode, message) {
        if (!messageBarNode) {
            return;
        }
        messageBarNode.style.display = "block";
        messageBarNode.className = "rounded-lg px-3 py-2 text-sm border border-green-200 bg-green-50 text-green-700 mb-4";
        messageBarNode.textContent = message;
    }

    /**
     * 错误提示
     */
    function ShowError(messageBarNode, message) {
        if (!messageBarNode) {
            return;
        }
        messageBarNode.style.display = "block";
        messageBarNode.className = "rounded-lg px-3 py-2 text-sm border border-red-200 bg-red-50 text-red-700 mb-4";
        messageBarNode.textContent = message;
    }

    /**
     * 隐藏提示
     */
    function HideMessage(messageBarNode) {
        if (!messageBarNode) {
            return;
        }
        messageBarNode.style.display = "none";
        messageBarNode.textContent = "";
    }

    /**
     * 用户头像字
     */
    function ResolveAvatarText(displayName) {
        const safeText = String(displayName || "").trim();
        if (!safeText) {
            return "U";
        }
        return safeText.slice(0, 1).toUpperCase();
    }

    /**
     * 成色样式
     */
    function ResolveConditionClass(conditionLevel) {
        const text = (conditionLevel || "").trim();
        if (text.includes("新")) {
            return "bg-secondary-container text-on-secondary-container";
        }
        return "bg-surface-container-highest text-on-surface-variant";
    }

    /**
     * 文件图标
     */
    function ResolveFileIcon(fileType) {
        const typeText = (fileType || "").toLowerCase();
        if (typeText.includes("pdf")) {
            return "picture_as_pdf";
        }
        if (typeText.includes("sheet") || typeText.includes("excel")) {
            return "table_chart";
        }
        return "description";
    }

    /**
     * 文件背景色
     */
    function ResolveFileBgClass(fileType) {
        const typeText = (fileType || "").toLowerCase();
        if (typeText.includes("pdf")) {
            return "bg-red-50";
        }
        if (typeText.includes("sheet") || typeText.includes("excel")) {
            return "bg-green-50";
        }
        return "bg-blue-50";
    }

    /**
     * 文件图标色
     */
    function ResolveFileTextClass(fileType) {
        const typeText = (fileType || "").toLowerCase();
        if (typeText.includes("pdf")) {
            return "text-red-500";
        }
        if (typeText.includes("sheet") || typeText.includes("excel")) {
            return "text-green-500";
        }
        return "text-blue-500";
    }

    /**
     * 招募状态文案
     */
    function ResolveRecruitmentStatusText(recruitmentStatus) {
        return RECRUITMENT_STATUS_TEXT_MAP[recruitmentStatus] || "状态未知";
    }

    /**
     * 金额格式化
     */
    function FormatAmount(price) {
        const numberValue = Number(price || 0);
        if (Number.isNaN(numberValue)) {
            return "0.00";
        }
        return numberValue.toFixed(2);
    }

    /**
     * 文件大小格式化
     */
    function FormatFileSize(fileSizeBytes) {
        const size = Number(fileSizeBytes || 0);
        if (Number.isNaN(size) || size <= 0) {
            return "0KB";
        }
        if (size >= 1024 * 1024) {
            return `${(size / (1024 * 1024)).toFixed(1)}MB`;
        }
        return `${Math.max(1, Math.round(size / 1024))}KB`;
    }

    /**
     * 相对时间格式化
     */
    function FormatRelativeTime(timeText) {
        if (!timeText) {
            return "-";
        }
        const timeValue = new Date(timeText).getTime();
        if (Number.isNaN(timeValue)) {
            return "-";
        }
        const diffMinutes = Math.floor((Date.now() - timeValue) / (1000 * 60));
        if (diffMinutes < 1) {
            return "刚刚";
        }
        if (diffMinutes < 60) {
            return `${diffMinutes} 分钟前`;
        }
        if (diffMinutes < 24 * 60) {
            return `${Math.floor(diffMinutes / 60)} 小时前`;
        }
        return `${Math.floor(diffMinutes / (24 * 60))} 天前`;
    }

    /**
     * 数字兜底
     */
    function SafeNumber(value) {
        const numberValue = Number(value || 0);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }

    /**
     * 错误文案兜底
     */
    function GetErrorMessage(error, fallback) {
        if (!error) {
            return fallback;
        }
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return fallback;
    }

    /**
     * HTML转义
     */
    function EscapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    document.addEventListener("DOMContentLoaded", BindMarketOverviewPage);
})();
