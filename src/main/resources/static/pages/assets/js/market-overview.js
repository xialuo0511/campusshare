/**
 * 市场总览页面逻辑
 */
(function InitMarketOverviewPage() {
    const RECRUITMENT_HIGHLIGHT_SIZE = 2;
    const RECRUITMENT_STATUS_TEXT_MAP = {
        RECRUITING: "招募中",
        FULL: "已满员",
        CLOSED: "已关闭",
        EXPIRED: "已过期"
    };
    const PRODUCT_IMAGE_LIST = [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuApdsaVW3k1rzHTiDBbt9C8imJfX2GeM8ktoMJcLKshJ-s4j-Kl3vGCKjeEOOprwxXNoCFivzhW996tfni4B6i8ALn0fF1ZxG4pyLiS29_KFoFP7WNDPPhYK7wZjGuMqZlSsX5E4fqdggYUCoPqOlFMOGMbEvrKXuba5FLPRrq0KYLU3P0mBn7d7V8ErooQX5PVn6dl5YycT3IpTfFZ-h6KJoy_YL7pACzuoC6KPn778cYD9vVz1SDoGHAA8c1cluhoukLhA9ieyy8",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBN2BWozkoCD8G1NuF9UkPfYJItLL0Mgp3N_fpjU4lGYDs1slryVrlD77nZtVI55nhkSOIt5PJX_e_Iih0M6-SsH2CRMo6N-lo3gxoGiWQfpr4w3Cz6dou_-JAfO4VWcHD_DX2BX-fBN59OG4dnUdIWeCv2x_3LugMfjXeyaZzEQEyHOGSB4Q3H_nefzu3tdnWKVqMyn0JMkxSvMTFwZ_K91Ecp7o3qZH5xUWk088PFzIitje1JvqW1imSCA38j2CK1yPqjkJQeBPo",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCHfby1lJKMbOsYV5_szwUuC5lOqca90AturQRz6jGH1blLWQ8nWYqD5j00_q3qVuh2H5AynP55_KCNJeSyTPXfSr4ubdZADwPbfeGxdcLmoftTD3dI6WnZHu8-hotIcxEba23fFgkMaSWon_pJOCvTDkOH9b0Nw55RfJ8szS1MwAV6GwMGdKwVd1npODxLAZ1l4ogUJp184y2GHT1Zfu-ZOQ8chtWCbyfVGppWuaPmNUmAykwlZ2p04IQF2nHmqcw9TFAZksxHHeQ",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAo7pPcp6JjLS2QFFEPQ3KjJfWbrtwiWxs2XKQ6lwFVhYnJEv16KIFLU1Z8kutOSad6YWA_6qQPAAVPsvtxVlaS5irP1rxAsB9xKxOfPkt8xzpoo9v6gykwOQv_avF48pLsVtLJWEE5ddIj8yPlopkGLsQFlRYUoydZBUum1WNy2Us3Cs5lkS_67F0Ica5wjHx5pKkRDWxwiLn1soMTPpkXrl1QK5kU2IGlyMqTM-dvC_o__lcJbE6Bz5SgfAI2jogL3r562MxzzD8"
    ];

    /**
     * 绑定页面行为
     */
    function BindMarketOverviewPage() {
        if (!window.CampusShareApi) {
            return;
        }
        const pageSection = document.querySelector("main section.flex-1.min-w-0");
        if (!pageSection) {
            return;
        }

        const messageBar = BuildMessageBar(pageSection);
        SyncProfilePanel();
        const recommendedHeading = FindHeadingByText("h2", "推荐交易");
        const materialsHeading = FindHeadingByText("h2", "精选资料");
        if (!recommendedHeading || !materialsHeading) {
            return;
        }

        const recommendedBlock = recommendedHeading.closest("div.mb-12");
        const recommendedGrid = recommendedBlock ? recommendedBlock.querySelector("div.grid.grid-cols-2.lg\\:grid-cols-4.gap-6") : null;
        const recommendedSubtitle = recommendedBlock ? recommendedBlock.querySelector("p.text-sm.text-outline") : null;
        const materialsBlock = materialsHeading.closest("div.bg-surface-container-low.rounded-xl.p-6");
        const materialsList = materialsBlock ? materialsBlock.querySelector("div.space-y-3") : null;
        const recruitmentList = document.querySelector("[data-role='overview-recruitment-list']");
        if (!recommendedGrid || !materialsList || !recruitmentList) {
            return;
        }

        recommendedGrid.addEventListener("click", function HandleRecommendedClick(event) {
            const productCard = event.target.closest("[data-product-id]");
            if (!productCard) {
                return;
            }
            const productId = productCard.getAttribute("data-product-id");
            if (productId) {
                window.location.href = `/pages/market_item_detail.html?productId=${encodeURIComponent(productId)}`;
            }
        });

        materialsList.addEventListener("click", async function HandleMaterialDownload(event) {
            const downloadButton = event.target.closest("button[data-material-id]");
            if (!downloadButton) {
                return;
            }
            const materialId = downloadButton.getAttribute("data-material-id");
            if (!materialId) {
                return;
            }
            if (!window.CampusShareApi.GetAuthToken()) {
                ShowError(messageBar, "请先登录后再下载资料");
                window.setTimeout(function RedirectToAuthPage() {
                    if (window.CampusShareApi.RedirectToAuthPage) {
                        window.CampusShareApi.RedirectToAuthPage("/pages/market_overview.html");
                        return;
                    }
                    window.location.href = "/pages/auth_access.html?redirect=%2Fpages%2Fmarket_overview.html";
                }, 700);
                return;
            }
            downloadButton.disabled = true;
            try {
                const downloadResult = await window.CampusShareApi.DownloadMaterial(materialId);
                ShowSuccess(messageBar, "下载授权成功，正在打开文件");
                if (downloadResult && downloadResult.fileAccessUrl) {
                    window.open(downloadResult.fileAccessUrl, "_blank");
                }
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "资料下载失败");
            } finally {
                downloadButton.disabled = false;
            }
        });

        LoadOverviewData(recommendedGrid, recommendedSubtitle, materialsList, recruitmentList, messageBar);
    }

    /**
     * 加载总览数据
     */
    async function LoadOverviewData(recommendedGrid, recommendedSubtitle, materialsList, recruitmentList, messageBar) {
        try {
            const resultList = await Promise.all([
                window.CampusShareApi.GetMarketOverview(),
                window.CampusShareApi.ListTeamRecruitments({
                    pageNo: 1,
                    pageSize: RECRUITMENT_HIGHLIGHT_SIZE
                })
            ]);
            const overviewResult = resultList[0];
            const recruitmentResult = resultList[1];
            RenderRecommendedProducts(recommendedGrid, overviewResult && overviewResult.recommendedProductList);
            RenderFeaturedMaterials(materialsList, overviewResult && overviewResult.featuredMaterialList);
            RenderRecruitmentHighlights(recruitmentList, recruitmentResult && recruitmentResult.recruitmentList);
            if (recommendedSubtitle) {
                recommendedSubtitle.textContent = `当前在架商品 ${SafeNumber(overviewResult.publishedProductCount)} 件，资料 ${SafeNumber(overviewResult.publishedMaterialCount)} 份`;
            }
            HideMessage(messageBar);
        } catch (error) {
            RenderRecommendedProducts(recommendedGrid, []);
            RenderFeaturedMaterials(materialsList, []);
            RenderRecruitmentHighlights(recruitmentList, []);
            ShowError(messageBar, error instanceof Error ? error.message : "首页数据加载失败");
        }
    }

    /**
     * 同步侧边栏用户信息
     */
    function SyncProfilePanel() {
        const profileNameNode = document.querySelector("[data-role='overview-profile-name']");
        const profileRoleNode = document.querySelector("[data-role='overview-profile-role']");
        const profileAvatarNode = document.querySelector("[data-role='overview-profile-avatar']");
        const profile = window.CampusShareApi.GetCurrentUserProfile();
        const hasLoginSession = profile && profile.userId;
        if (!profileNameNode || !profileRoleNode || !profileAvatarNode) {
            return;
        }
        if (!hasLoginSession) {
            profileNameNode.textContent = "未登录用户";
            profileRoleNode.textContent = "游客模式";
            profileAvatarNode.textContent = "未";
            return;
        }

        const displayName = profile.displayName || profile.account || "已登录用户";
        const roleText = profile.userRole === "ADMINISTRATOR" ? "管理员" : "普通用户";
        profileNameNode.textContent = displayName;
        profileRoleNode.textContent = roleText;
        profileAvatarNode.textContent = ResolveAvatarText(displayName);
    }

    /**
     * 渲染推荐商品
     */
    function RenderRecommendedProducts(recommendedGrid, productList) {
        const safeList = Array.isArray(productList) ? productList : [];
        if (safeList.length === 0) {
            recommendedGrid.innerHTML = "<div class=\"col-span-full text-center text-sm text-slate-400 py-10\">暂无推荐商品</div>";
            return;
        }

        recommendedGrid.innerHTML = safeList.map(function BuildProductCard(item, index) {
            return [
                `<div class="bg-surface-container-lowest rounded-xl p-3 border-transparent hover:bg-surface-container-low transition-all cursor-pointer group" data-product-id="${EscapeHtml(String(item.productId || ""))}">`,
                "<div class=\"aspect-square rounded-lg overflow-hidden mb-3 bg-surface-container\">",
                `<img class="w-full h-full object-cover group-hover:scale-105 transition-transform" src="${ResolveProductImage(index)}" alt="推荐商品"/>`,
                "</div>",
                "<div class=\"flex flex-col gap-1\">",
                "<div class=\"flex justify-between items-start\">",
                `<h3 class="text-sm font-semibold truncate flex-1">${EscapeHtml(item.title || "-")}</h3>`,
                `<span class="text-primary font-bold ml-2">￥${EscapeHtml(FormatAmount(item.price))}</span>`,
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
    function RenderFeaturedMaterials(materialsList, materialList) {
        const safeList = Array.isArray(materialList) ? materialList : [];
        if (safeList.length === 0) {
            materialsList.innerHTML = "<div class=\"text-center text-sm text-slate-400 py-6\">暂无精选资料</div>";
            return;
        }
        materialsList.innerHTML = safeList.map(function BuildMaterialCard(item) {
            return [
                "<div class=\"bg-white p-4 rounded-lg flex items-center justify-between hover:shadow-sm transition-shadow\">",
                "<div class=\"flex items-center gap-4\">",
                `<div class="w-10 h-10 rounded ${ResolveFileBgClass(item.fileType)} flex items-center justify-center">`,
                `<span class="material-symbols-outlined ${ResolveFileTextClass(item.fileType)}">${ResolveFileIcon(item.fileType)}</span>`,
                "</div>",
                "<div>",
                `<h4 class="text-sm font-semibold">${EscapeHtml(item.courseName || "-")}</h4>`,
                `<p class="text-[10px] text-outline">由 ${EscapeHtml(item.uploaderDisplayName || "匿名用户")} 分享 • ${EscapeHtml(FormatFileSize(item.fileSizeBytes))} • ${EscapeHtml(String(SafeNumber(item.downloadCount)))} 次下载</p>`,
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
    function RenderRecruitmentHighlights(recruitmentList, teamRecruitmentList) {
        const safeList = Array.isArray(teamRecruitmentList)
            ? teamRecruitmentList.slice(0, RECRUITMENT_HIGHLIGHT_SIZE)
            : [];
        if (safeList.length === 0) {
            recruitmentList.innerHTML = "<div class=\"p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20\"><p class=\"text-xs opacity-80\">暂无招募项目</p></div>";
            return;
        }
        recruitmentList.innerHTML = safeList.map(function BuildRecruitmentCard(item, index) {
            const directionText = item.direction || "综合";
            const memberLimit = SafeNumber(item.memberLimit);
            const currentMemberCount = SafeNumber(item.currentMemberCount);
            const remainingSeats = Math.max(0, memberLimit - currentMemberCount);
            const statusText = ResolveRecruitmentStatusText(item.recruitmentStatus);
            return [
                "<div class=\"p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20\">",
                "<div class=\"flex items-center gap-2 mb-2\">",
                `<span class=\"text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ResolveRecruitmentTagClass(index)}\">${EscapeHtml(directionText)}</span>`,
                `<span class=\"text-[10px] opacity-70\">${EscapeHtml(statusText)} · 剩余 ${EscapeHtml(String(remainingSeats))} 个名额</span>`,
                "</div>",
                `<h4 class=\"text-sm font-bold mb-1\">${EscapeHtml(item.eventName || "未命名招募")}</h4>`,
                `<p class=\"text-xs opacity-80 line-clamp-2\">${EscapeHtml(item.skillRequirement || "暂无技能要求")}</p>`,
                "</div>"
            ].join("");
        }).join("");
    }

    /**
     * 构建消息条
     */
    function BuildMessageBar(pageSection) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm border mb-4";
        messageBar.style.display = "none";
        pageSection.insertBefore(messageBar, pageSection.firstChild);
        return messageBar;
    }

    /**
     * 查找标题元素
     */
    function FindHeadingByText(selector, text) {
        const headingList = Array.from(document.querySelectorAll(selector));
        return headingList.find(function MatchHeading(itemHeading) {
            return itemHeading.textContent && itemHeading.textContent.includes(text);
        }) || null;
    }

    /**
     * 解析商品图
     */
    function ResolveProductImage(index) {
        return PRODUCT_IMAGE_LIST[index % PRODUCT_IMAGE_LIST.length];
    }

    /**
     * 招募状态文本
     */
    function ResolveRecruitmentStatusText(recruitmentStatus) {
        return RECRUITMENT_STATUS_TEXT_MAP[recruitmentStatus] || "状态未知";
    }

    /**
     * 招募标签颜色
     */
    function ResolveRecruitmentTagClass(index) {
        if (index % 2 === 0) {
            return "bg-tertiary-fixed-dim text-on-tertiary";
        }
        return "bg-secondary-container text-on-secondary-container";
    }

    /**
     * 头像文本
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
     * 格式化金额
     */
    function FormatAmount(price) {
        const numberValue = Number(price || 0);
        if (Number.isNaN(numberValue)) {
            return "0.00";
        }
        return numberValue.toFixed(2);
    }

    /**
     * 格式化文件大小
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
     * 格式化相对时间
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
     * 安全数字
     */
    function SafeNumber(value) {
        const numberValue = Number(value || 0);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }

    /**
     * HTML转义
     */
    function EscapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * 显示成功
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm border border-green-200 bg-green-50 text-green-700 mb-4";
        messageBar.textContent = message;
    }

    /**
     * 显示错误
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm border border-red-200 bg-red-50 text-red-700 mb-4";
        messageBar.textContent = message;
    }

    /**
     * 隐藏消息
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindMarketOverviewPage);
})();
