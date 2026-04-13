/**
 * 登录注册页面逻辑
 */
(function InitAuthAccessPage() {
    const AUTH_MODE_LOGIN = "login";
    const AUTH_MODE_REGISTER = "register";

    /**
     * 绑定页面行为
     */
    function BindAuthPage() {
        const authForm = document.querySelector("main form");
        const tabButtons = document.querySelectorAll("main .border-b button");
        if (!authForm || tabButtons.length < 2 || !window.CampusShareApi) {
            return;
        }

        const textInputs = authForm.querySelectorAll("input[type='text']");
        const accountInput = textInputs[0];
        const userNameInput = textInputs[1];
        const passwordInput = authForm.querySelector("input[type='password']");
        const emailInput = authForm.querySelector("input[type='email']");
        const collegeSelect = authForm.querySelectorAll("select")[0];
        const gradeSelect = authForm.querySelectorAll("select")[1];
        const submitButton = authForm.querySelector("button[type='submit']");

        const messageBar = BuildMessageBar(authForm);
        const verifyCodeRow = BuildVerifyCodeRow(emailInput, authForm);
        const verificationCodeInput = verifyCodeRow.querySelector("input");
        const sendCodeButton = verifyCodeRow.querySelector("button");

        SetupLabels(authForm, submitButton, sendCodeButton, accountInput, userNameInput, emailInput, verificationCodeInput);

        let currentMode = AUTH_MODE_REGISTER;
        tabButtons[0].addEventListener("click", function HandleLoginModeClick() {
            currentMode = AUTH_MODE_LOGIN;
            SetModeUi(currentMode, tabButtons, userNameInput, collegeSelect, gradeSelect, emailInput, verifyCodeRow, submitButton);
            HideMessage(messageBar);
        });
        tabButtons[1].addEventListener("click", function HandleRegisterModeClick() {
            currentMode = AUTH_MODE_REGISTER;
            SetModeUi(currentMode, tabButtons, userNameInput, collegeSelect, gradeSelect, emailInput, verifyCodeRow, submitButton);
            HideMessage(messageBar);
        });

        sendCodeButton.addEventListener("click", async function HandleSendCode() {
            HideMessage(messageBar);
            if (!emailInput.value.trim()) {
                ShowError(messageBar, "请先输入邮箱");
                return;
            }
            if (!accountInput.value.trim()) {
                ShowError(messageBar, "请先输入学号");
                return;
            }
            sendCodeButton.disabled = true;
            try {
                const sendResult = await window.CampusShareApi.SendRegisterCode({
                    email: emailInput.value.trim(),
                    account: accountInput.value.trim()
                });
                ShowSuccess(messageBar, sendResult.tip || "验证码已发送");
                StartCountdown(sendCodeButton, 60);
            } catch (error) {
                sendCodeButton.disabled = false;
                ShowError(messageBar, error instanceof Error ? error.message : "验证码发送失败");
            }
        });

        authForm.addEventListener("submit", async function HandleSubmit(event) {
            event.preventDefault();
            HideMessage(messageBar);
            submitButton.disabled = true;
            submitButton.classList.add("opacity-70");
            try {
                if (currentMode === AUTH_MODE_LOGIN) {
                    const loginResult = await window.CampusShareApi.LoginUser({
                        account: (accountInput.value || "").trim(),
                        password: passwordInput.value || ""
                    });
                    window.CampusShareApi.SetSessionFromLogin(loginResult);
                    ShowSuccess(messageBar, `登录成功，欢迎你 ${loginResult.displayName}`);
                    window.setTimeout(function RedirectToOrderCenter() {
                        window.location.href = "/pages/order_center.html";
                    }, 800);
                    return;
                }

                const registerResult = await window.CampusShareApi.RegisterUser({
                    account: (accountInput.value || "").trim(),
                    password: passwordInput.value || "",
                    displayName: (userNameInput.value || "").trim(),
                    contact: (emailInput.value || "").trim(),
                    verificationCode: (verificationCodeInput.value || "").trim(),
                    college: collegeSelect ? collegeSelect.value : "",
                    grade: gradeSelect ? gradeSelect.value : ""
                });
                ShowSuccess(messageBar, registerResult.tip || "注册成功");
                authForm.reset();
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "提交失败，请稍后重试");
            } finally {
                submitButton.disabled = false;
                submitButton.classList.remove("opacity-70");
            }
        });

        SetModeUi(currentMode, tabButtons, userNameInput, collegeSelect, gradeSelect, emailInput, verifyCodeRow, submitButton);
    }

    /**
     * 配置页面标签
     */
    function SetupLabels(authForm, submitButton, sendCodeButton, accountInput, userNameInput, emailInput, verificationCodeInput) {
        const labelList = authForm.querySelectorAll("label");
        if (labelList[0]) {
            labelList[0].textContent = "学号";
        }
        if (labelList[1]) {
            labelList[1].textContent = "密码";
        }
        if (labelList[2]) {
            labelList[2].textContent = "用户名";
        }
        if (labelList[3]) {
            labelList[3].textContent = "学院(可选)";
        }
        if (labelList[4]) {
            labelList[4].textContent = "年级(可选)";
        }
        if (labelList[5]) {
            labelList[5].textContent = "邮箱";
        }

        accountInput.placeholder = "请输入学号";
        userNameInput.placeholder = "请输入用户名";
        emailInput.placeholder = "请输入邮箱";
        verificationCodeInput.placeholder = "请输入6位验证码";
        submitButton.textContent = "注册";
        sendCodeButton.textContent = "发送验证码";
    }

    /**
     * 创建消息条
     */
    function BuildMessageBar(authForm) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant";
        messageBar.style.display = "none";
        authForm.insertBefore(messageBar, authForm.firstChild);
        return messageBar;
    }

    /**
     * 创建验证码输入行
     */
    function BuildVerifyCodeRow(emailInput, authForm) {
        const verifyCodeRow = document.createElement("div");
        verifyCodeRow.className = "space-y-1 md:col-span-2";
        verifyCodeRow.innerHTML = [
            "<label class=\"text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1\">邮箱验证码</label>",
            "<div class=\"flex items-center gap-2\">",
            "<input class=\"flex-1 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm\" type=\"text\" maxlength=\"6\"/>",
            "<button type=\"button\" class=\"px-3 py-2.5 text-xs font-semibold rounded-lg border border-outline-variant/50 hover:bg-surface-container\">发送验证码</button>",
            "</div>"
        ].join("");
        const emailGroup = emailInput.closest(".space-y-1");
        emailGroup.insertAdjacentElement("afterend", verifyCodeRow);
        return verifyCodeRow;
    }

    /**
     * 切换模式UI
     */
    function SetModeUi(
        currentMode,
        tabButtons,
        userNameInput,
        collegeSelect,
        gradeSelect,
        emailInput,
        verifyCodeRow,
        submitButton
    ) {
        const loginButton = tabButtons[0];
        const registerButton = tabButtons[1];
        const userNameGroup = userNameInput.closest(".space-y-1");
        const collegeGroup = collegeSelect.closest(".space-y-1");
        const gradeGroup = gradeSelect.closest(".space-y-1");
        const emailGroup = emailInput.closest(".space-y-1");

        if (currentMode === AUTH_MODE_LOGIN) {
            loginButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-primary border-b-2 border-primary";
            registerButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-on-surface-variant hover:text-primary transition-colors";
            userNameGroup.style.display = "none";
            collegeGroup.style.display = "none";
            gradeGroup.style.display = "none";
            emailGroup.style.display = "none";
            verifyCodeRow.style.display = "none";
            submitButton.textContent = "登录";
            return;
        }

        loginButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-on-surface-variant hover:text-primary transition-colors";
        registerButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-primary border-b-2 border-primary";
        userNameGroup.style.display = "";
        collegeGroup.style.display = "";
        gradeGroup.style.display = "";
        emailGroup.style.display = "";
        verifyCodeRow.style.display = "";
        submitButton.textContent = "注册";
    }

    /**
     * 验证码倒计时
     */
    function StartCountdown(sendCodeButton, seconds) {
        let leftSeconds = seconds;
        sendCodeButton.disabled = true;
        sendCodeButton.textContent = `${leftSeconds}s后重试`;
        const timer = window.setInterval(function TickCountdown() {
            leftSeconds -= 1;
            if (leftSeconds <= 0) {
                window.clearInterval(timer);
                sendCodeButton.disabled = false;
                sendCodeButton.textContent = "发送验证码";
                return;
            }
            sendCodeButton.textContent = `${leftSeconds}s后重试`;
        }, 1000);
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

    document.addEventListener("DOMContentLoaded", BindAuthPage);
})();
