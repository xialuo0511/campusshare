/**
 * 登录注册页面逻辑
 */
(function InitAuthAccessPage() {
    const AUTH_MODE_LOGIN = "login";
    const AUTH_MODE_REGISTER = "register";
    const STUDENT_ACCOUNT_PATTERN = /^\d{11}$/;
    const STRENGTH_COLORS = ["#cbd5e1", "#ef4444", "#f59e0b", "#0a8a4f", "#005d90"];
    const STRENGTH_LABELS = ["—", "弱", "一般", "良好", "极强"];

    function BindAuthPage() {
        const authForm = document.querySelector("main form");
        const tabButtons = document.querySelectorAll("main .tabs button");
        const campusShareApi = window.CampusShareApi || null;
        if (!authForm || tabButtons.length < 2) {
            return;
        }

        const textInputs = authForm.querySelectorAll("input[type='text']");
        const accountInput = textInputs[0];
        const userNameInput = textInputs[1];
        const passwordInput = authForm.querySelector("input[type='password']");
        const passwordToggleButton = authForm.querySelector("[data-password-toggle]");
        const passwordToggleIcon = authForm.querySelector("[data-password-toggle-icon]");
        const confirmPwInput = authForm.querySelector("[data-confirm-pw]");
        const confirmPwToggleButton = authForm.querySelector("[data-confirm-pw-toggle]");
        const confirmPwToggleIcon = authForm.querySelector("[data-confirm-pw-toggle-icon]");
        const emailInput = authForm.querySelector("input[type='email']");
        const collegeSelect = authForm.querySelectorAll("select")[0];
        const gradeSelect = authForm.querySelectorAll("select")[1];
        const submitButton = authForm.querySelector("button[type='submit']");
        if (!accountInput || !userNameInput || !passwordInput || !emailInput || !collegeSelect || !gradeSelect || !submitButton) {
            return;
        }

        const accountGroup = accountInput.closest(".space-y-1");
        const passwordGroup = passwordInput.closest(".space-y-1");
        const userNameGroup = userNameInput.closest(".space-y-1");
        const emailGroup = emailInput.closest(".space-y-1");
        const confirmPwGroup = confirmPwInput ? confirmPwInput.closest(".space-y-1") : null;
        const strengthMeter = passwordGroup ? passwordGroup.querySelector("[data-strength-meter]") : null;
        const strengthBars = strengthMeter ? Array.from(strengthMeter.querySelectorAll("[data-bar]")) : [];
        const strengthLabel = strengthMeter ? strengthMeter.querySelector("[data-strength-label]") : null;
        const authHeadTitle = document.querySelector(".auth-head h2");
        const authHeadSub = document.querySelector(".auth-head .sub");

        const messageBar = BuildMessageBar(authForm);
        const verifyCodeRow = BuildVerifyCodeRow(emailInput);
        const verificationCodeInput = verifyCodeRow.querySelector("input");
        const sendCodeButton = verifyCodeRow.querySelector("button");
        const registerFieldsContainer = BuildRegisterFieldsContainer(
            userNameInput,
            collegeSelect,
            gradeSelect,
            emailInput,
            verifyCodeRow,
            confirmPwInput
        );

        BindPasswordToggle(passwordInput, passwordToggleButton, passwordToggleIcon);
        BindPasswordToggle(confirmPwInput, confirmPwToggleButton, confirmPwToggleIcon);

        passwordInput.addEventListener("input", function HandlePasswordInput() {
            UpdateStrengthMeter(passwordInput.value, strengthBars, strengthLabel);
        });

        const authNoticeText = campusShareApi && campusShareApi.ConsumeAuthNotice ? campusShareApi.ConsumeAuthNotice() : "";
        if (authNoticeText) {
            ShowError(messageBar, authNoticeText);
        }

        let currentMode = AUTH_MODE_LOGIN;
        tabButtons[0].addEventListener("click", function HandleLoginModeClick() {
            currentMode = AUTH_MODE_LOGIN;
            SetModeUi(currentMode, tabButtons, registerFieldsContainer, submitButton, authHeadTitle, authHeadSub, strengthMeter);
            HideMessage(messageBar);
        });
        tabButtons[1].addEventListener("click", function HandleRegisterModeClick() {
            currentMode = AUTH_MODE_REGISTER;
            SetModeUi(currentMode, tabButtons, registerFieldsContainer, submitButton, authHeadTitle, authHeadSub, strengthMeter);
            HideMessage(messageBar);
        });

        sendCodeButton.addEventListener("click", async function HandleSendCode() {
            HideMessage(messageBar);
            ClearFieldErrorStyles(authForm);
            if (!campusShareApi) {
                ShowError(messageBar, "页面初始化失败，请刷新后重试");
                return;
            }
            if (!ReadValue(accountInput)) {
                ShowError(messageBar, "请先输入学号");
                MarkFieldError(accountGroup, accountInput);
                return;
            }
            if (!IsValidStudentAccount(ReadValue(accountInput))) {
                ShowError(messageBar, "学号必须为 11 位数字");
                MarkFieldError(accountGroup, accountInput);
                return;
            }
            if (!ReadValue(emailInput)) {
                ShowError(messageBar, "请先输入邮箱");
                MarkFieldError(emailGroup, emailInput);
                return;
            }
            if (!IsValidEmail(ReadValue(emailInput))) {
                ShowError(messageBar, "邮箱格式不正确");
                MarkFieldError(emailGroup, emailInput);
                return;
            }

            sendCodeButton.disabled = true;
            try {
                const sendResult = await campusShareApi.SendRegisterCode({
                    email: ReadValue(emailInput),
                    account: ReadValue(accountInput)
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
            if (!campusShareApi) {
                ShowError(messageBar, "页面初始化失败，请刷新后重试");
                return;
            }
            const isValid = ValidateBeforeSubmit(
                currentMode,
                {
                    accountInput,
                    passwordInput,
                    confirmPwInput,
                    userNameInput,
                    emailInput,
                    verificationCodeInput,
                    accountGroup,
                    passwordGroup,
                    confirmPwGroup,
                    userNameGroup,
                    emailGroup,
                    verificationCodeGroup: verifyCodeRow
                },
                messageBar
            );
            if (!isValid) {
                return;
            }

            submitButton.disabled = true;
            submitButton.classList.add("opacity-70");
            try {
                if (currentMode === AUTH_MODE_LOGIN) {
                    const loginResult = await campusShareApi.LoginUser({
                        account: ReadValue(accountInput),
                        password: passwordInput.value || ""
                    });
                    campusShareApi.SetSessionFromLogin(loginResult);
                    ShowSuccess(messageBar, `登录成功，欢迎你 ${loginResult.displayName || ""}`.trim());
                    window.setTimeout(function RedirectAfterLogin() {
                        window.location.href = ResolveRedirectPath(loginResult);
                    }, 500);
                    return;
                }

                const registerResult = await campusShareApi.RegisterUser({
                    account: ReadValue(accountInput),
                    password: passwordInput.value || "",
                    displayName: ReadValue(userNameInput),
                    contact: ReadValue(emailInput),
                    verificationCode: ReadValue(verificationCodeInput),
                    college: collegeSelect.value || "",
                    grade: gradeSelect.value || ""
                });
                ShowSuccess(messageBar, registerResult.tip || "注册成功，请等待管理员审核");
                authForm.reset();
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "提交失败，请稍后重试");
            } finally {
                submitButton.disabled = false;
                submitButton.classList.remove("opacity-70");
            }
        });

        SetModeUi(currentMode, tabButtons, registerFieldsContainer, submitButton, authHeadTitle, authHeadSub, strengthMeter);
    }

    function BuildMessageBar(authForm) {
        const messageBar = document.createElement("div");
        messageBar.className = "rounded-xl px-3 py-2 text-sm bg-slate-50 text-slate-600 border border-[rgba(120,133,150,0.18)]";
        messageBar.style.display = "none";
        authForm.insertBefore(messageBar, authForm.firstChild);
        return messageBar;
    }

    function BuildVerifyCodeRow(emailInput) {
        const verifyCodeRow = document.createElement("div");
        verifyCodeRow.className = "auth-field space-y-1 md:col-span-2";
        verifyCodeRow.innerHTML = [
            "<label class=\"ml-1 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500\">邮箱验证码</label>",
            "<div class=\"flex items-center gap-2\">",
            "<input class=\"flex-1 rounded-xl px-4 py-3 text-sm\" type=\"text\" maxlength=\"6\" placeholder=\"请输入 6 位验证码\"/>",
            "<button type=\"button\" class=\"rounded-xl border border-[rgba(120,133,150,0.24)] bg-white px-3 py-3 text-xs font-bold text-slate-700 hover:text-[#005d90]\">发送验证码</button>",
            "</div>"
        ].join("");
        const emailGroup = emailInput.closest(".space-y-1");
        emailGroup.insertAdjacentElement("afterend", verifyCodeRow);
        return verifyCodeRow;
    }

    function BuildRegisterFieldsContainer(userNameInput, collegeSelect, gradeSelect, emailInput, verifyCodeRow, confirmPwInput) {
        const userNameGroup = userNameInput.closest(".space-y-1");
        const collegeGroup = collegeSelect.closest(".space-y-1");
        const gradeGroup = gradeSelect.closest(".space-y-1");
        const emailGroup = emailInput.closest(".space-y-1");
        const confirmPwGroup = confirmPwInput ? confirmPwInput.closest(".space-y-1") : null;
        const gridContainer = userNameGroup ? userNameGroup.parentElement : null;
        if (!gridContainer || !userNameGroup || !collegeGroup || !gradeGroup || !emailGroup || !verifyCodeRow) {
            return null;
        }
        const registerFieldsContainer = document.createElement("div");
        registerFieldsContainer.className = "grid grid-cols-1 gap-4 md:grid-cols-2";
        registerFieldsContainer.setAttribute("data-register-fields", "true");
        registerFieldsContainer.style.overflow = "visible";
        gridContainer.insertAdjacentElement("afterend", registerFieldsContainer);
        gridContainer.style.display = "none";
        const groupsToMove = [userNameGroup, collegeGroup, gradeGroup, emailGroup, verifyCodeRow];
        if (confirmPwGroup) {
            groupsToMove.unshift(confirmPwGroup);
        }
        groupsToMove.forEach(function AppendGroup(group) {
            registerFieldsContainer.appendChild(group);
        });
        return registerFieldsContainer;
    }

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

    function SetModeUi(currentMode, tabButtons, registerFieldsContainer, submitButton, authHeadTitle, authHeadSub, strengthMeter) {
        const isLogin = currentMode === AUTH_MODE_LOGIN;
        tabButtons[0].classList.toggle("active", isLogin);
        tabButtons[1].classList.toggle("active", !isLogin);
        const tabsContainer = tabButtons[0].closest(".tabs");
        const indicator = tabsContainer && tabsContainer.querySelector(".tab-indicator");
        if (indicator) {
            indicator.style.transform = isLogin ? "translateX(0)" : "translateX(calc(100% + 4px))";
        }
        if (authHeadTitle) {
            authHeadTitle.textContent = isLogin ? "欢迎回来" : "加入 CampusShare";
        }
        if (authHeadSub) {
            authHeadSub.textContent = isLogin ? "使用学号登录校园资源共享平台" : "完成实名信息以加入校内可信交易";
        }
        if (strengthMeter) {
            strengthMeter.style.display = isLogin ? "none" : "flex";
        }
        SetRegisterContainerVisible(registerFieldsContainer, !isLogin);
        submitButton.innerHTML = isLogin
            ? "登录账号&nbsp;<span class=\"material-symbols-outlined\" style=\"font-size:18px;vertical-align:-4px;\">arrow_forward</span>"
            : "提交注册申请&nbsp;<span class=\"material-symbols-outlined\" style=\"font-size:18px;vertical-align:-4px;\">arrow_forward</span>";
    }

    function UpdateStrengthMeter(value, strengthBars, strengthLabel) {
        if (!strengthBars || !strengthBars.length || !strengthLabel) {
            return;
        }
        let score = 0;
        if (value.length >= 8) { score++; }
        if (/[A-Z]/.test(value) && /[a-z]/.test(value)) { score++; }
        if (/\d/.test(value)) { score++; }
        if (/[^A-Za-z0-9]/.test(value)) { score++; }
        const activeColor = STRENGTH_COLORS[score];
        strengthBars.forEach(function UpdateBar(bar, idx) {
            bar.style.background = idx < score ? activeColor : "var(--cs-line)";
        });
        strengthLabel.textContent = STRENGTH_LABELS[score];
        strengthLabel.style.color = score >= 3 ? activeColor : "var(--cs-muted)";
    }

    function SetRegisterContainerVisible(registerFieldsContainer, visible) {
        if (!registerFieldsContainer) {
            return;
        }
        registerFieldsContainer.style.height = visible ? "auto" : "0px";
        registerFieldsContainer.style.opacity = visible ? "1" : "0";
        registerFieldsContainer.style.marginTop = "0px";
        registerFieldsContainer.style.visibility = visible ? "visible" : "hidden";
        registerFieldsContainer.style.pointerEvents = visible ? "auto" : "none";
    }

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
        if (!IsValidStudentAccount(accountValue)) {
            ShowError(messageBar, "学号必须为 11 位数字");
            MarkFieldError(fieldContext.accountGroup, fieldContext.accountInput);
            return false;
        }
        if (!passwordValue) {
            ShowError(messageBar, "密码不能为空");
            MarkFieldError(fieldContext.passwordGroup, fieldContext.passwordInput);
            return false;
        }
        if (passwordValue.length < 8) {
            ShowError(messageBar, "密码长度至少 8 位");
            MarkFieldError(fieldContext.passwordGroup, fieldContext.passwordInput);
            return false;
        }
        if (currentMode === AUTH_MODE_LOGIN) {
            return true;
        }
        const confirmPwValue = fieldContext.confirmPwInput ? fieldContext.confirmPwInput.value : "";
        if (!confirmPwValue) {
            ShowError(messageBar, "请确认密码");
            MarkFieldError(fieldContext.confirmPwGroup, fieldContext.confirmPwInput);
            return false;
        }
        if (confirmPwValue !== (fieldContext.passwordInput ? fieldContext.passwordInput.value : "")) {
            ShowError(messageBar, "两次密码输入不一致");
            MarkFieldError(fieldContext.confirmPwGroup, fieldContext.confirmPwInput);
            return false;
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
        if (!IsValidEmail(emailValue)) {
            ShowError(messageBar, "邮箱格式不正确");
            MarkFieldError(fieldContext.emailGroup, fieldContext.emailInput);
            return false;
        }
        if (!verificationCodeValue) {
            ShowError(messageBar, "验证码不能为空");
            MarkFieldError(fieldContext.verificationCodeGroup, fieldContext.verificationCodeInput);
            return false;
        }
        if (verificationCodeValue.length !== 6) {
            ShowError(messageBar, "验证码长度必须为 6 位");
            MarkFieldError(fieldContext.verificationCodeGroup, fieldContext.verificationCodeInput);
            return false;
        }
        return true;
    }

    function ReadValue(inputElement) {
        return inputElement && inputElement.value ? inputElement.value.trim() : "";
    }

    function IsValidEmail(emailText) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailText);
    }

    function IsValidStudentAccount(accountText) {
        return STUDENT_ACCOUNT_PATTERN.test((accountText || "").trim());
    }

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

    function ClearFieldErrorStyles(authForm) {
        const fieldList = authForm.querySelectorAll("input,select");
        fieldList.forEach(function ClearFieldClass(fieldElement) {
            fieldElement.classList.remove("border-red-300", "ring-2", "ring-red-100");
        });
    }

    function StartCountdown(sendCodeButton, seconds) {
        let leftSeconds = seconds;
        sendCodeButton.disabled = true;
        sendCodeButton.textContent = `${leftSeconds}s 后重试`;
        const timer = window.setInterval(function TickCountdown() {
            leftSeconds -= 1;
            if (leftSeconds <= 0) {
                window.clearInterval(timer);
                sendCodeButton.disabled = false;
                sendCodeButton.textContent = "发送验证码";
                return;
            }
            sendCodeButton.textContent = `${leftSeconds}s 后重试`;
        }, 1000);
    }

    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700";
        messageBar.textContent = message;
    }

    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700";
        messageBar.textContent = message;
    }

    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    function ResolveRedirectPath(loginResult) {
        if (window.CampusShareApi && typeof window.CampusShareApi.ResolveLoginSuccessRedirect === "function") {
            return window.CampusShareApi.ResolveLoginSuccessRedirect(loginResult);
        }
        const userRole = loginResult && loginResult.userRole ? loginResult.userRole : "";
        if (userRole === "ADMINISTRATOR") {
            return "/pages/admin_dashboard.html";
        }
        return "/pages/user_workspace.html";
    }

    document.addEventListener("DOMContentLoaded", BindAuthPage);
})();
