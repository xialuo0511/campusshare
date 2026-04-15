/**
 * 错误状态页面逻辑
 */
(function InitErrorStatusPage() {
    /**
     * 绑定页面
     */
    function BindErrorStatusPage() {
        const cardList = Array.from(document.querySelectorAll("main section:first-of-type .grid > div"));
        if (!cardList.length) {
            return;
        }

        const errorCode = ResolveErrorCode();
        HighlightCard(cardList, errorCode);
        BindCardButtons(errorCode);
    }

    /**
     * 解析错误码
     */
    function ResolveErrorCode() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const code = Number(searchParams.get("code") || "404");
        if (code === 403 || code === 404 || code === 500) {
            return code;
        }
        return 404;
    }

    /**
     * 高亮卡片
     */
    function HighlightCard(cardList, errorCode) {
        const indexMap = { 403: 0, 404: 1, 500: 2 };
        const activeIndex = indexMap[errorCode] || 1;
        cardList.forEach(function PatchCard(cardElement, index) {
            if (index === activeIndex) {
                cardElement.classList.add("ring-2", "ring-primary", "scale-[1.01]");
                return;
            }
            cardElement.classList.remove("ring-2", "ring-primary", "scale-[1.01]");
        });
    }

    /**
     * 按钮行为
     */
    function BindCardButtons(errorCode) {
        const buttonList = Array.from(document.querySelectorAll("main section:first-of-type button"));
        buttonList.forEach(function BindButton(buttonElement) {
            const text = (buttonElement.textContent || "").trim();
            if (text.includes("返回首页")) {
                buttonElement.addEventListener("click", function HandleHomeClick() {
                    window.location.href = "/pages/market_overview.html";
                });
                return;
            }
            if (text.includes("重试") || text.includes("刷新")) {
                buttonElement.addEventListener("click", function HandleReloadClick() {
                    window.location.reload();
                });
                return;
            }
            if (text.includes("搜索")) {
                buttonElement.addEventListener("click", function HandleSearchClick() {
                    window.location.href = "/pages/market_listing.html";
                });
                return;
            }
        });

        if (errorCode === 403) {
            const topTitle = document.querySelector("main h1.text-\[3\.5rem\]");
            if (topTitle) {
                topTitle.textContent = "访问受限，请先完成登录与权限校验";
            }
        }
    }

    document.addEventListener("DOMContentLoaded", BindErrorStatusPage);
})();
