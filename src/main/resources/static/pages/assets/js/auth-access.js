/**
 * 登录注册页面逻辑
 */
(function InitAuthAccessPage() {
    const AUTH_MODE_LOGIN = "login";
    const AUTH_MODE_REGISTER = "register";
    const FIELD_SWITCH_ANIMATION_MS = 240;
    const MODE_SWITCH_ANIMATION_MS = 260;

    /**
     * 绑定页面行为
     */
    function BindAuthPage() {
        const authForm = document.querySelector("main form");
        const tabButtons = document.querySelectorAll("main .border-b button");
        if (!authForm || tabButtons.length < 2 || !window.CampusShareApi) {
            return;
        }
        const formContainer = authForm.closest(".p-8.space-y-6") || authForm.parentElement;

        const existingToken = window.CampusShareApi.GetAuthToken();
        const existingProfile = window.CampusShareApi.GetCurrentUserProfile();
        if (existingToken && existingProfile && existingProfile.userId) {
            const redirectPath = ResolveRedirectPath(null);
            if (redirectPath) {
                window.location.href = redirectPath;
                return;
            }
        }

        const textInputs = authForm.querySelectorAll("input[type='text']");
        const accountInput = textInputs[0];
        const userNameInput = textInputs[1];
        const passwordInput = authForm.querySelector("input[type='password']");
        const passwordToggleButton = authForm.querySelector("[data-password-toggle]");
        const passwordToggleIcon = authForm.querySelector("[data-password-toggle-icon]");
        const emailInput = authForm.querySelector("input[type='email']");
        const collegeSelect = authForm.querySelectorAll("select")[0];
        const gradeSelect = authForm.querySelectorAll("select")[1];
        const submitButton = authForm.querySelector("button[type='submit']");
        const accountGroup = accountInput.closest(".space-y-1");
        const passwordGroup = passwordInput ? passwordInput.closest(".space-y-1") : null;
        const userNameGroup = userNameInput.closest(".space-y-1");
        const emailGroup = emailInput.closest(".space-y-1");

        const messageBar = BuildMessageBar(authForm);
        const verifyCodeRow = BuildVerifyCodeRow(emailInput, authForm);
        const verificationCodeInput = verifyCodeRow.querySelector("input");
        const sendCodeButton = verifyCodeRow.querySelector("button");

        SetupLabels(
            authForm,
            submitButton,
            sendCodeButton,
            accountInput,
            passwordInput,
            userNameInput,
            emailInput,
            verificationCodeInput
        );
        BindPasswordToggle(passwordInput, passwordToggleButton, passwordToggleIcon);

        let currentMode = AUTH_MODE_REGISTER;
        tabButtons[0].addEventListener("click", function HandleLoginModeClick() {
            PlayModeSwitchAnimation(formContainer);
            currentMode = AUTH_MODE_LOGIN;
            SetModeUi(
                currentMode,
                tabButtons,
                userNameInput,
                collegeSelect,
                gradeSelect,
                emailInput,
                verifyCodeRow,
                submitButton,
                true
            );
            HideMessage(messageBar);
        });
        tabButtons[1].addEventListener("click", function HandleRegisterModeClick() {
            PlayModeSwitchAnimation(formContainer);
            currentMode = AUTH_MODE_REGISTER;
            SetModeUi(
                currentMode,
                tabButtons,
                userNameInput,
                collegeSelect,
                gradeSelect,
                emailInput,
                verifyCodeRow,
                submitButton,
                true
            );
            HideMessage(messageBar);
        });

        sendCodeButton.addEventListener("click", async function HandleSendCode() {
            HideMessage(messageBar);
            ClearFieldErrorStyles(authForm);
            if (!emailInput.value.trim()) {
                ShowError(messageBar, "请先输入邮箱");
                MarkFieldError(emailGroup, emailInput);
                return;
            }
            if (!accountInput.value.trim()) {
                ShowError(messageBar, "请先输入学号");
                MarkFieldError(accountGroup, accountInput);
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
            ClearFieldErrorStyles(authForm);
            const validResult = ValidateBeforeSubmit(
                currentMode,
                {
                    accountInput,
                    passwordInput,
                    userNameInput,
                    emailInput,
                    verificationCodeInput,
                    accountGroup,
                    passwordGroup,
                    userNameGroup,
                    emailGroup,
                    verificationCodeGroup: verifyCodeRow
                },
                messageBar
            );
            if (!validResult) {
                return;
            }
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
                        window.location.href = ResolveRedirectPath(loginResult);
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

        SetModeUi(
            currentMode,
            tabButtons,
            userNameInput,
            collegeSelect,
            gradeSelect,
            emailInput,
            verifyCodeRow,
            submitButton,
            false
        );
    }

    /**
     * 配置页面标签
     */
    function SetupLabels(
        authForm,
        submitButton,
        sendCodeButton,
        accountInput,
        passwordInput,
        userNameInput,
        emailInput,
        verificationCodeInput
    ) {
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
        passwordInput.placeholder = "请输入密码";
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
     * 绑定密码显示切换
     */
    function BindPasswordToggle(passwordInput, passwordToggleButton, passwordToggleIcon) {
        if (!passwordInput || !passwordToggleButton || !passwordToggleIcon) {
            return;
        }

        function SyncPasswordToggleState() {
            const hiddenMode = passwordInput.type === "password";
            passwordToggleIcon.textContent = hiddenMode ? "visibility_off" : "visibility";
            passwordToggleButton.setAttribute("aria-label", hiddenMode ? "显示密码" : "隐藏密码");
        }

        SyncPasswordToggleState();
        passwordToggleButton.addEventListener("click", function HandlePasswordToggle() {
            passwordInput.type = passwordInput.type === "password" ? "text" : "password";
            SyncPasswordToggleState();
        });
    }

    /**
     * 切换动画
     */
    function PlayModeSwitchAnimation(formContainer) {
        if (!formContainer) {
            return;
        }
        formContainer.classList.remove("auth-mode-switching");
        void formContainer.offsetWidth;
        formContainer.classList.add("auth-mode-switching");
        window.setTimeout(function RemoveModeSwitchClass() {
            formContainer.classList.remove("auth-mode-switching");
        }, MODE_SWITCH_ANIMATION_MS);
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
        submitButton,
        withAnimation
    ) {
        const loginButton = tabButtons[0];
        const registerButton = tabButtons[1];
        const userNameGroup = userNameInput.closest(".space-y-1");
        const collegeGroup = collegeSelect.closest(".space-y-1");
        const gradeGroup = gradeSelect.closest(".space-y-1");
        const emailGroup = emailInput.closest(".space-y-1");
        const registerOnlyGroupList = [
            userNameGroup,
            collegeGroup,
            gradeGroup,
            emailGroup,
            verifyCodeRow
        ];

        registerOnlyGroupList.forEach(function InitTransition(group) {
            InitFieldTransition(group);
        });

        if (currentMode === AUTH_MODE_LOGIN) {
            loginButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-primary border-b-2 border-primary transition-all duration-200";
            registerButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-on-surface-variant hover:text-primary transition-all duration-200";
            registerOnlyGroupList.forEach(function HideRegisterField(group) {
                SetFieldVisible(group, false, withAnimation);
            });
            submitButton.textContent = "登录";
            return;
        }

        loginButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-on-surface-variant hover:text-primary transition-all duration-200";
        registerButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-primary border-b-2 border-primary transition-all duration-200";
        registerOnlyGroupList.forEach(function ShowRegisterField(group) {
            SetFieldVisible(group, true, withAnimation);
        });
        submitButton.textContent = "注册";
    }

    /**
     * 初始化字段过渡样式
     */
    function InitFieldTransition(fieldGroup) {
        if (!fieldGroup || fieldGroup.dataset.transitionReady === "true") {
            return;
        }
        fieldGroup.style.transition = "opacity 220ms ease, transform 220ms ease";
        fieldGroup.style.transformOrigin = "top";
        fieldGroup.style.willChange = "opacity, transform";
        fieldGroup.dataset.transitionReady = "true";
    }

    /**
     * 设置字段可见性
     */
    function SetFieldVisible(fieldGroup, visible, withAnimation) {
        if (!fieldGroup) {
            return;
        }
        const timerIdText = fieldGroup.dataset.visibilityTimerId;
        if (timerIdText) {
            window.clearTimeout(Number(timerIdText));
            delete fieldGroup.dataset.visibilityTimerId;
        }
        const visibleFlag = visible ? "true" : "false";
        const previousVisibleFlag = fieldGroup.dataset.visibleFlag;
        fieldGroup.dataset.visibleFlag = visibleFlag;

        if (!withAnimation || previousVisibleFlag === undefined) {
            fieldGroup.style.display = visible ? "" : "none";
            fieldGroup.style.opacity = visible ? "1" : "0";
            fieldGroup.style.transform = visible ? "translateY(0)" : "translateY(-10px)";
            fieldGroup.style.pointerEvents = visible ? "auto" : "none";
            return;
        }
        if (previousVisibleFlag === visibleFlag) {
            return;
        }

        if (visible) {
            fieldGroup.style.display = "";
            fieldGroup.style.opacity = "0";
            fieldGroup.style.transform = "translateY(-10px)";
            fieldGroup.style.pointerEvents = "none";
            window.requestAnimationFrame(function AnimateShow() {
                fieldGroup.style.opacity = "1";
                fieldGroup.style.transform = "translateY(0)";
                fieldGroup.style.pointerEvents = "auto";
            });
            return;
        }

        fieldGroup.style.opacity = "1";
        fieldGroup.style.transform = "translateY(0)";
        fieldGroup.style.pointerEvents = "none";
        window.requestAnimationFrame(function AnimateHide() {
            fieldGroup.style.opacity = "0";
            fieldGroup.style.transform = "translateY(-10px)";
        });
        const hideTimerId = window.setTimeout(function FinalizeHide() {
            if (fieldGroup.dataset.visibleFlag !== "false") {
                return;
            }
            fieldGroup.style.display = "none";
        }, FIELD_SWITCH_ANIMATION_MS);
        fieldGroup.dataset.visibilityTimerId = String(hideTimerId);
    }

    /**
     * 提交前校验
     */
    function ValidateBeforeSubmit(currentMode, fieldContext, messageBar) {
        const accountValue = ReadValue(fieldContext.accountInput);
        const passwordValue = ReadValue(fieldContext.passwordInput);
        const displayNameValue = ReadValue(fieldContext.userNameInput);
        const emailValue = ReadValue(fieldContext.emailInput);
        const verificationCodeValue = ReadValue(fieldContext.verificationCodeInput);

        if (!accountValue) {
            ShowError(messageBar, "学号不能为空");
            MarkFieldError(fieldContext.accountGroup, fieldContext.accountInput);
            return false;
        }
        if (!passwordValue) {
            ShowError(messageBar, "密码不能为空");
            MarkFieldError(fieldContext.passwordGroup, fieldContext.passwordInput);
            return false;
        }

        if (currentMode === AUTH_MODE_LOGIN) {
            return true;
        }

        if (!displayNameValue) {
            ShowError(messageBar, "用户名不能为空");
            MarkFieldError(fieldContext.userNameGroup, fieldContext.userNameInput);
            return false;
        }
        if (!emailValue) {
            ShowError(messageBar, "邮箱不能为空");
            MarkFieldError(fieldContext.emailGroup, fieldContext.emailInput);
            return false;
        }
        if (!verificationCodeValue) {
            ShowError(messageBar, "验证码不能为空");
            MarkFieldError(fieldContext.verificationCodeGroup, fieldContext.verificationCodeInput);
            return false;
        }
        if (passwordValue.length < 8) {
            ShowError(messageBar, "密码长度至少8位");
            MarkFieldError(fieldContext.passwordGroup, fieldContext.passwordInput);
            return false;
        }
        if (!IsValidEmail(emailValue)) {
            ShowError(messageBar, "邮箱格式不正确");
            MarkFieldError(fieldContext.emailGroup, fieldContext.emailInput);
            return false;
        }
        if (verificationCodeValue.length !== 6) {
            ShowError(messageBar, "验证码长度必须为6位");
            MarkFieldError(fieldContext.verificationCodeGroup, fieldContext.verificationCodeInput);
            return false;
        }
        return true;
    }

    /**
     * 读取输入值
     */
    function ReadValue(inputElement) {
        return inputElement && inputElement.value ? inputElement.value.trim() : "";
    }

    /**
     * 邮箱格式
     */
    function IsValidEmail(emailText) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailText);
    }

    /**
     * 标记字段错误
     */
    function MarkFieldError(fieldGroup, fieldInput) {
        if (fieldGroup) {
            fieldGroup.classList.remove("auth-field-shake");
            void fieldGroup.offsetWidth;
            fieldGroup.classList.add("auth-field-shake");
            window.setTimeout(function RemoveShakeClass() {
                fieldGroup.classList.remove("auth-field-shake");
            }, 380);
        }
        if (fieldInput) {
            fieldInput.classList.add("border-red-300", "ring-2", "ring-red-100");
            fieldInput.focus();
        }
    }

    /**
     * 清理字段错误样式
     */
    function ClearFieldErrorStyles(authForm) {
        const fieldList = authForm.querySelectorAll("input,select");
        fieldList.forEach(function ClearFieldClass(fieldElement) {
            fieldElement.classList.remove("border-red-300", "ring-2", "ring-red-100");
        });
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

    /**
     * 解析登录后跳转路径
     */
    function ResolveRedirectPath(loginResult) {
        if (window.CampusShareApi.ResolveLoginSuccessRedirect) {
            return window.CampusShareApi.ResolveLoginSuccessRedirect(loginResult);
        }
        const userRole = loginResult && loginResult.userRole ? loginResult.userRole : "";
        if (userRole === "ADMINISTRATOR") {
            return "/pages/admin_dashboard.html";
        }
        return "/pages/market_overview.html";
    }

    document.addEventListener("DOMContentLoaded", BindAuthPage);
})();
