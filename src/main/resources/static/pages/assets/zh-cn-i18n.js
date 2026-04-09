(() => {
  const phraseMap = {
    "CampusShare - Login": "CampusShare - 登录",
    "CampusShare | Marketplace": "CampusShare | 闲置市场",
    "CampusShare | Notification Center": "CampusShare | 通知中心",
    "CampusShare | Order Center": "CampusShare | 订单中心",
    "CampusShare | Personal Center": "CampusShare | 个人中心",
    "CampusShare | Team Recruitment Square": "CampusShare | 组队广场",
    "CampusShare | Admin Analytics": "CampusShare | 管理分析",
    "CampusShare Admin Audit Workbench": "CampusShare 管理审核工作台",
    "Join CampusShare | Registration & Certification": "加入 CampusShare | 注册与认证",
    "Welcome Back": "欢迎回来",
    "Please enter your academic credentials.": "请输入校园认证信息",
    "Username or Email": "用户名或邮箱",
    "Password": "密码",
    "Keep me logged in": "保持登录状态",
    "Forgot Password?": "忘记密码？",
    "Login": "登录",
    "Sign Up": "注册",
    "New to the sanctuary?": "第一次使用平台？",
    "Continue": "继续",
    "Account Created!": "账号创建成功",
    "Redirecting to certification...": "正在跳转到认证流程...",
    "Market": "闲置市场",
    "Marketplace": "闲置市场",
    "Materials": "学习资料",
    "Study Materials": "学习资料",
    "Upload Study Materials": "上传学习资料",
    "Upload Material": "上传资料",
    "My Materials": "我的资料",
    "Home": "首页",
    "Orders": "订单",
    "Order Center": "订单中心",
    "My Orders": "我的订单",
    "My Active Orders": "我的进行中订单",
    "Active Orders (4)": "进行中订单（4）",
    "Notifications": "通知",
    "Notification Center": "通知中心",
    "Inbox": "收件箱",
    "Clear All": "全部清除",
    "Clear All Alerts": "清空全部提醒",
    "Mark as Read": "标记已读",
    "All Clear!": "已全部处理",
    "Your notification sanctuary is empty. Enjoy the academic peace while it lasts.": "当前暂无通知，先享受片刻安静吧",
    "System": "系统",
    "System Alerts": "系统提醒",
    "System Maintenance Scheduled": "系统维护已计划",
    "System Operational": "系统运行正常",
    "System Oversight": "系统监管",
    "Recent Activity": "最近动态",
    "Recent Activities": "最近动态",
    "Recent Reviews": "最新评价",
    "Messages": "消息",
    "Chat": "聊天",
    "Chat with Seller": "联系卖家",
    "Search": "搜索",
    "Search campus...": "搜索校园内容...",
    "Find books, teams, or bikes. Share resources, save money, and collaborate with fellow students.": "搜索教材、队伍或二手物品，分享资源、节省开销、协作成长",
    "Find high-quality textbooks, gear, and essentials within your student community. Trusted, sustainable, and local.": "在校园社区内发现高质量教材与装备，可信、可持续、近距离交易",
    "Find Your": "发现你的",
    "CampusShare": "CampusShare",
    "Campus": "校园",
    "Campus Journey.": "校园同行",
    "Our Mission": "我们的使命",
    "Unlock the power of your campus community.": "释放校园社区协作价值",
    "Connect with fellow students for hackathons, study groups, and creative projects. Your academic sanctuary for collaboration.": "连接同学一起参加黑客松、学习小组与创意项目，打造协作型校园社区",
    "A fluid exchange of knowledge and resources designed for the modern campus ecosystem.": "为现代校园生态打造流畅的知识与资源共享网络",
    "The Academic": "学术",
    "Sanctuary": "社区空间",
    "Sanctuary.": "社区空间",
    "Trade": "交易",
    "Trading": "交易中",
    "Trade Location": "交易地点",
    "Trade Completion": "交易完成",
    "Trade Volume": "交易量",
    "Trade volume": "交易量",
    "Completed": "已完成",
    "Pending": "待处理",
    "Confirmed": "已确认",
    "In Transit": "运输中",
    "Refund": "退款",
    "Payment Confirmed": "支付已确认",
    "Buyer Paid": "买家已支付",
    "Order Placed": "订单已创建",
    "Order Picked Up": "订单已取货",
    "Awaiting Payment": "待支付",
    "Waiting for seller to ship": "等待卖家发货",
    "Place Order": "发起下单",
    "Confirm Receipt": "确认收货",
    "View Receipt": "查看凭证",
    "Transaction Detail": "交易详情",
    "Transactions": "交易记录",
    "Transaction completed by both parties.": "交易双方已完成确认",
    "Payment secured in CampusShare Escrow.": "款项已由 CampusShare 托管保护",
    "Inspect the item before paying.": "付款前请先验货",
    "Use the in-app payment for protection.": "建议使用平台内支付保障",
    "Funds are released only after you confirm receipt.": "确认收货后才会放款给卖家",
    "Safety": "安全",
    "Safety Tips": "安全提示",
    "Safety Verified": "安全已校验",
    "Trust Center": "信任中心",
    "Trust Score": "信誉分",
    "Seller Credit Score": "卖家信用分",
    "Seller Certification": "卖家认证",
    "Approve Certification": "通过认证",
    "Reject & Notify User": "驳回并通知用户",
    "Certification": "认证",
    "Verification Queue": "认证队列",
    "Pending Audits": "待审核",
    "Pending Tasks": "待办任务",
    "Audit": "审核",
    "Audit Details": "审核详情",
    "Audit Workbench": "审核工作台",
    "Review": "审核",
    "Reviewing": "审核中",
    "Reviewer Notes": "审核备注",
    "Reported Post: \"MacBook Pro M1\"": "被举报帖子：\"MacBook Pro M1\"",
    "Reported for \"Suspiciously Low Price\" and potential counterfeit images.": "因“价格异常偏低”及疑似伪造图片被举报",
    "Report": "举报",
    "Reports": "举报单",
    "Report a Problem": "问题反馈",
    "Evidence Materials": "证据材料",
    "Priority High": "高优先级",
    "High": "高",
    "Low Risk": "低风险",
    "Medium Risk": "中风险",
    "High Risk": "高风险",
    "Risk": "风险",
    "Unassigned": "未分配",
    "Assignee: Alex M.": "处理人：Alex M.",
    "Resolved Today": "今日已处理",
    "Verification Queue": "认证待处理队列",
    "Pending user verifications exceeded threshold of 100.": "待审核用户已超过 100 阈值",
    "Showing 3 of 24 tasks in queue": "当前展示 24 条中的 3 条任务",
    "Category": "分类",
    "Filters": "筛选",
    "Filter": "筛选",
    "Price": "价格",
    "Price ($)": "价格（元）",
    "Price Range": "价格区间",
    "Condition": "成色",
    "Location": "地点",
    "Description": "描述",
    "Title": "标题",
    "Primary Contact": "主要联系方式",
    "College / Institution": "学院 / 学校",
    "Academic Year": "年级",
    "Department": "院系",
    "University Email": "学校邮箱",
    "Display Name": "显示昵称",
    "Account": "账号",
    "Profile": "个人资料",
    "Settings": "设置",
    "Privacy Policy": "隐私政策",
    "Terms of Service": "服务条款",
    "Save Draft": "保存草稿",
    "Save for later": "稍后保存",
    "Discard": "放弃",
    "Finish": "完成",
    "Post New Item": "发布新商品",
    "Post Item": "发布商品",
    "Publish Listing": "发布商品",
    "My Listings": "我的发布",
    "Active Listing": "在售商品",
    "All Items": "全部商品",
    "Hot Goods": "热门商品",
    "Favorites": "收藏",
    "Buy Again": "再次购买",
    "Sell Something": "发布闲置",
    "Sell or rent gear": "出售或出租装备",
    "Top Campus Sellers": "校园优质卖家",
    "Like New": "近乎全新",
    "Used": "二手",
    "New": "全新",
    "Excellent": "优秀",
    "EXCELLENT": "优秀",
    "Good": "良好",
    "Fair": "一般",
    "Poor": "较差",
    "Rating": "评分",
    "Rate User": "评价用户",
    "Based on 112 reviews": "基于 112 条评价",
    "Start a Team": "发起组队",
    "Create Team": "创建团队",
    "Create New Team": "新建团队",
    "Team Recruitment": "组队招募",
    "Team Name": "团队名称",
    "Team Goal": "团队目标",
    "Team Detail": "团队详情",
    "Current Members": "当前成员",
    "Required Skills": "技能要求",
    "Apply to Join Team": "申请加入团队",
    "Start your own recruitment": "开始你的招募",
    "Start Your Own Venture?": "想发起自己的项目？",
    "Build your squad": "组建你的队伍",
    "Simple 3-step setup to recruit your dream campus team.": "三步即可发起你的理想校园团队招募",
    "New Team Invite": "新的团队邀请",
    "New Team Application": "新的入队申请",
    "Upload student ID or enrollment proof": "上传学生证或在读证明",
    "Drag and drop your academic ID": "拖拽上传你的校园身份证明",
    "Supports JPG, PNG, PDF up to 5MB": "支持 JPG、PNG、PDF，最大 5MB",
    "PDF, DOC, PPT up to 25MB": "支持 PDF、DOC、PPT，最大 25MB",
    "Drag & drop files here": "将文件拖拽到此处",
    "Add Photo": "添加图片",
    "Main Photo": "主图",
    "Gallery": "图集",
    "Add up to 5 clear photos to help students trust your listing.": "最多添加 5 张清晰图片，提升发布可信度",
    "Please provide at least 20 characters for a quality listing.": "请至少填写 20 个字符，提升信息质量",
    "Great title! Specific and clear.": "标题很好，明确且清晰",
    "Copyright Declaration:": "版权声明：",
    "By downloading this file, you agree that this material is for personal academic use only. Redistribution or commercial use is strictly prohibited under campus guidelines.": "下载该文件即表示你同意仅用于个人学习，不得传播或商用，须遵守校园规范",
    "Download for 50 Credits": "50 积分下载",
    "Unlock the full document by using your campus credits.": "使用校园积分解锁完整文档",
    "Credit Cost": "积分消耗",
    "Credits": "积分",
    "Credit Flow": "积分流水",
    "Campus Points Balance": "校园积分余额",
    "Available Balance": "可用余额",
    "Top Up Balance": "充值余额",
    "Redeem Rewards": "兑换奖励",
    "Start Earning Now": "立即开始赚积分",
    "You earned 50 Campus Credits for sharing your \"Biology 101\" lab reports. These can be used for premium material access.": "你因分享“Biology 101”实验报告获得 50 校园积分，可用于解锁优质资料",
    "Weekly Login Bonus": "每周登录奖励",
    "System Bonus": "系统奖励",
    "System Reward": "系统奖励",
    "Boost Your Balance": "提升你的余额",
    "Boost this listing to the top of the campus feed for 24 hours.": "将此发布置顶 24 小时，提升曝光",
    "Refer a Student": "邀请同学",
    "Both get 1,000 CP after first trade.": "首笔交易后双方各得 1000 积分",
    "CP": "积分",
    "Security Alert: New Login": "安全提醒：检测到新的登录",
    "This wasn't me": "这不是我",
    "A new login was detected on a Mac OS device in Vancouver, Canada. If this wasn't you, please secure your account immediately.": "系统检测到来自新设备的登录，如非本人操作请立即保护账号",
    "Stay updated with your academic resources, team collaborations, and marketplace activities in your campus sanctuary.": "及时掌握资料、组队与交易动态",
    "View all": "查看全部",
    "View All": "查看全部",
    "Today at 4:30 PM": "今天 16:30",
    "Yesterday": "昨天",
    "1 hour ago": "1 小时前",
    "2 hours ago": "2 小时前",
    "3 hours ago": "3 小时前",
    "2 mins ago": "2 分钟前",
    "10 mins ago": "10 分钟前",
    "Posted 2 hours ago": "2 小时前发布",
    "4 active listings": "4 个在售发布",
    "No more active orders": "没有更多进行中订单",
    "Looks for something else?": "还想找点别的？",
    "Looking for something else?": "还想找点别的？",
    "Safety Tips": "安全提示",
    "Help in Forum": "到论坛求助",
    "Forum": "论坛",
    "Tech & Engineering": "技术与工程",
    "Design & Creative": "设计与创意",
    "Business & Strategy": "商业与策略",
    "Sports": "运动",
    "Others": "其他",
    "Textbooks": "教材",
    "Furniture": "家具",
    "Electronics": "电子产品",
    "Library": "图书馆",
    "Student Union": "学生活动中心",
    "Continue to Verification": "继续认证",
    "Continue to Requirements": "继续填写要求",
    "Upload file": "上传文件",
    "Upload File": "上传文件"
  };

  const regexRules = [
    [/\bCredits?\b/gi, "积分"],
    [/\bCredit Cost\b/gi, "积分消耗"],
    [/\bPending\b/gi, "待处理"],
    [/\bCompleted\b/gi, "已完成"],
    [/\bConfirmed\b/gi, "已确认"],
    [/\bMarketplace\b/gi, "闲置市场"],
    [/\bMaterials?\b/gi, "学习资料"],
    [/\bTeams?\b/gi, "组队"],
    [/\bOrders?\b/gi, "订单"],
    [/\bNotifications?\b/gi, "通知"],
    [/\bSearch\b/gi, "搜索"],
    [/\bPrice\b/gi, "价格"],
    [/\bCategory\b/gi, "分类"],
    [/\bLocation\b/gi, "地点"],
    [/\bDescription\b/gi, "描述"],
    [/\bTitle\b/gi, "标题"],
    [/\bProfile\b/gi, "个人资料"],
    [/\bSettings\b/gi, "设置"],
    [/\bReview\b/gi, "审核"],
    [/\bReport\b/gi, "举报"],
    [/\bUpload\b/gi, "上传"],
    [/\bDownload\b/gi, "下载"]
  ];

  const skipTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"]);

  function shouldSkipNode(node) {
    if (!node || !node.parentElement) {
      return true;
    }
    const parent = node.parentElement;
    if (skipTags.has(parent.tagName)) {
      return true;
    }
    if (parent.closest(".material-symbols-outlined")) {
      return true;
    }
    if (parent.hasAttribute("data-i18n-ignore")) {
      return true;
    }
    return false;
  }

  function replacePreserveWhitespace(original, translatedCore) {
    const leading = (original.match(/^\s*/) || [""])[0];
    const trailing = (original.match(/\s*$/) || [""])[0];
    return `${leading}${translatedCore}${trailing}`;
  }

  function translateCoreText(coreText) {
    if (!coreText) {
      return coreText;
    }
    if (phraseMap[coreText]) {
      return phraseMap[coreText];
    }
    let translated = coreText;
    for (const [pattern, replacement] of regexRules) {
      translated = translated.replace(pattern, replacement);
    }
    return translated;
  }

  function translateNodeText(node) {
    const original = node.nodeValue;
    if (!original || !original.trim()) {
      return;
    }
    const coreText = original.trim();
    const translated = translateCoreText(coreText);
    if (translated !== coreText) {
      node.nodeValue = replacePreserveWhitespace(original, translated);
    }
  }

  function translateAttributes() {
    const attrs = ["placeholder", "title", "aria-label", "alt", "data-alt"];
    for (const attrName of attrs) {
      const nodes = document.querySelectorAll(`[${attrName}]`);
      for (const node of nodes) {
        if (node.closest(".material-symbols-outlined")) {
          continue;
        }
        const original = node.getAttribute(attrName);
        if (!original || !original.trim()) {
          continue;
        }
        const translated = translateCoreText(original.trim());
        if (translated !== original.trim()) {
          node.setAttribute(attrName, translated);
        }
      }
    }
  }

  function translateDocumentText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (!shouldSkipNode(node)) {
        translateNodeText(node);
      }
      node = walker.nextNode();
    }
  }

  function applyZhCn() {
    document.documentElement.setAttribute("lang", "zh-CN");
    if (document.title) {
      const translatedTitle = translateCoreText(document.title.trim());
      if (translatedTitle) {
        document.title = translatedTitle;
      }
    }
    translateAttributes();
    translateDocumentText();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyZhCn);
  } else {
    applyZhCn();
  }
})();
