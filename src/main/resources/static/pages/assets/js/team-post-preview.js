/**
 * 甯栧瓙棰勮椤甸€昏緫锛堢敤浜庡鏍稿満鏅級
 */
(function InitTeamPostPreviewPage() {
    const STATUS_TEXT_MAP = {
        PENDING_REVIEW: "寰呭鏍?,
        RECRUITING: "鎷涘嫙涓?,
        FULL: "宸叉弧鍛?,
        CLOSED: "宸插叧闂?,
        EXPIRED: "宸茶繃鏈?,
        REJECTED: "宸查┏鍥?
    };

    document.addEventListener("DOMContentLoaded", async function HandleReady() {
        const recruitmentId = ResolveRecruitmentIdFromQuery();
        RenderPreviewId(recruitmentId);
        UpdateOpenBoardLink(recruitmentId);
        if (recruitmentId <= 0) {
            RenderErrorState("缂哄皯 recruitmentId 鍙傛暟");
            return;
        }
        if (!window.CampusShareApi || typeof window.CampusShareApi.GetTeamRecruitmentDetail !== "function") {
            RenderErrorState("API 鍒濆鍖栧け璐?);
            return;
        }
        try {
            const detail = await window.CampusShareApi.GetTeamRecruitmentDetail(recruitmentId);
            RenderDetail(detail || {});
        } catch (error) {
            RenderErrorState(error instanceof Error ? error.message : "甯栧瓙璇︽儏鍔犺浇澶辫触");
        }
    });

    function ResolveRecruitmentIdFromQuery() {
        const searchParams = new URLSearchParams(window.location.search || "");
        const recruitmentId = Number(searchParams.get("recruitmentId") || searchParams.get("focusRecruitmentId"));
        return Number.isFinite(recruitmentId) && recruitmentId > 0 ? recruitmentId : 0;
    }

    function RenderPreviewId(recruitmentId) {
        const idNode = document.querySelector("[data-role='preview-id']");
        if (idNode) {
            idNode.textContent = recruitmentId > 0 ? String(recruitmentId) : "-";
        }
    }

    function UpdateOpenBoardLink(recruitmentId) {
        const linkNode = document.querySelector("[data-role='open-board-link']");
        if (!linkNode) {
            return;
        }
        linkNode.href = recruitmentId > 0
            ? `/pages/recruitment_board.html?focusRecruitmentId=${encodeURIComponent(String(recruitmentId))}`
            : "/pages/recruitment_board.html";
    }

    function RenderDetail(detail) {
        SetText("[data-role='event-name']", detail.eventName || "鏈懡鍚嶅笘瀛?);
        SetText("[data-role='status-text']", ResolveStatusText(detail.recruitmentStatus));
        SetText("[data-role='direction']", detail.direction || "-");
        SetText("[data-role='publisher-name']", ResolvePublisherName(detail));
        SetText("[data-role='current-count']", String(SafeNumber(detail.currentMemberCount)));
        SetText("[data-role='member-limit']", String(SafeNumber(detail.memberLimit)));
        SetText("[data-role='application-count']", String(SafeNumber(detail.applicationCount)));
        SetText("[data-role='deadline']", FormatTime(detail.deadline));
        SetText("[data-role='skill-requirement']", detail.skillRequirement || "鏆傛棤鎶€鑳借姹?);
        SetText("[data-role='raw-json']", JSON.stringify(detail || {}, null, 2));
    }

    function RenderErrorState(message) {
        SetText("[data-role='event-name']", "鍔犺浇澶辫触");
        SetText("[data-role='status-text']", "寮傚父");
        SetText("[data-role='skill-requirement']", message || "甯栧瓙璇︽儏鍔犺浇澶辫触");
        SetText("[data-role='raw-json']", "{}");
    }

    function ResolveStatusText(statusValue) {
        const statusText = String(statusValue || "").trim();
        if (!statusText) {
            return "-";
        }
        return STATUS_TEXT_MAP[statusText] || statusText;
    }

    function ResolvePublisherName(detail) {
        const candidateList = [
            detail.publisherDisplayName,
            detail.publisherName,
            detail.nickname,
            detail.displayName
        ];
        for (let index = 0; index < candidateList.length; index += 1) {
            const candidateText = String(candidateList[index] || "").trim();
            if (candidateText) {
                return candidateText;
            }
        }
        const publisherUserId = SafeNumber(detail.publisherUserId);
        return publisherUserId > 0 ? `鐢ㄦ埛#${publisherUserId}` : "-";
    }

    function SetText(selector, value) {
        const node = document.querySelector(selector);
        if (node) {
            node.textContent = value == null ? "" : String(value);
        }
    }

    function FormatTime(timeText) {
        if (!timeText) {
            return "-";
        }
        const dateValue = new Date(timeText);
        if (Number.isNaN(dateValue.getTime())) {
            return String(timeText);
        }
        return `${dateValue.getFullYear()}-${PadTime(dateValue.getMonth() + 1)}-${PadTime(dateValue.getDate())} ${PadTime(dateValue.getHours())}:${PadTime(dateValue.getMinutes())}`;
    }

    function PadTime(value) {
        return value < 10 ? `0${value}` : `${value}`;
    }

    function SafeNumber(value) {
        const numberValue = Number(value || 0);
        return Number.isNaN(numberValue) ? 0 : numberValue;
    }
})();

