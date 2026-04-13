/**
 * 鐧诲綍娉ㄥ唽椤甸潰閫昏緫
 */
(function InitAuthAccessPage() {
    const AUTH_MODE_LOGIN = "login";
    const AUTH_MODE_REGISTER = "register";

    /**
     * 缁戝畾椤甸潰琛屼负
     */
    function BindAuthPage() {
        const authForm = document.querySelector("main form");
        const tabButtons = document.querySelectorAll("main .border-b button");
        if (!authForm || tabButtons.length < 2 || !window.CampusShareApi) {
            return;
        }

        const accountInput = authForm.querySelector("input[type='text']");
        const passwordInput = authForm.querySelector("input[type='password']");
        const registerOnlyInputs = [
            authForm.querySelectorAll("input[type='text']")[1],
            authForm.querySelector("select"),
            authForm.querySelectorAll("select")[1],
            authForm.querySelector("input[type='email']")
        ].filter(Boolean);
        const submitButton = authForm.querySelector("button[type='submit']");

        const messageBar = document.createElement("div");
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant";
        messageBar.style.display = "none";
        authForm.insertBefore(messageBar, authForm.firstChild);

        let currentMode = AUTH_MODE_REGISTER;
        tabButtons[0].addEventListener("click", function HandleLoginModeClick() {
            currentMode = AUTH_MODE_LOGIN;
            SetModeUi(tabButtons, registerOnlyInputs, submitButton, currentMode);
            HideMessage(messageBar);
        });
        tabButtons[1].addEventListener("click", function HandleRegisterModeClick() {
            currentMode = AUTH_MODE_REGISTER;
            SetModeUi(tabButtons, registerOnlyInputs, submitButton, currentMode);
            HideMessage(messageBar);
        });

        authForm.addEventListener("submit", async function HandleSubmit(event) {
            event.preventDefault();
            HideMessage(messageBar);
            submitButton.disabled = true;
            submitButton.classList.add("opacity-70");
            try {
                if (currentMode === AUTH_MODE_LOGIN) {
                    const loginPayload = {
                        account: (accountInput && accountInput.value ? accountInput.value : "").trim(),
                        password: passwordInput && passwordInput.value ? passwordInput.value : ""
                    };
                    const loginResult = await window.CampusShareApi.LoginUser(loginPayload);
                    window.CampusShareApi.SetSessionFromLogin(loginResult);
                    ShowSuccess(messageBar, `鐧诲綍鎴愬姛锛屾杩庝綘 ${loginResult.displayName}`);
                    window.setTimeout(function RedirectToPublish() {
                        window.location.href = "/pages/publish_create.html";
                    }, 800);
                    return;
                }

                const registerPayload = BuildRegisterPayload(authForm);
                await window.CampusShareApi.RegisterUser(registerPayload);
                ShowSuccess(messageBar, "娉ㄥ唽鎴愬姛锛岃绛夊緟绠＄悊鍛樺鏍搁€氳繃");
                authForm.reset();
            } catch (error) {
                ShowError(messageBar, error instanceof Error ? error.message : "鎻愪氦澶辫触锛岃绋嶅悗閲嶈瘯");
            } finally {
                submitButton.disabled = false;
                submitButton.classList.remove("opacity-70");
            }
        });

        SetModeUi(tabButtons, registerOnlyInputs, submitButton, currentMode);
    }

    /**
     * 鏋勫缓娉ㄥ唽鍙傛暟
     */
    function BuildRegisterPayload(authForm) {
        const textInputs = authForm.querySelectorAll("input[type='text']");
        const accountInput = textInputs[0];
        const displayNameInput = textInputs[1];
        const selectInputs = authForm.querySelectorAll("select");
        const collegeSelect = selectInputs[0];
        const gradeSelect = selectInputs[1];
        const passwordInput = authForm.querySelector("input[type='password']");
        const contactInput = authForm.querySelector("input[type='email']");

        return {
            account: accountInput && accountInput.value ? accountInput.value.trim() : "",
            password: passwordInput && passwordInput.value ? passwordInput.value : "",
            displayName: displayNameInput && displayNameInput.value ? displayNameInput.value.trim() : "",
            college: collegeSelect && collegeSelect.value ? collegeSelect.value.trim() : "",
            grade: gradeSelect && gradeSelect.value ? gradeSelect.value.trim() : "",
            contact: contactInput && contactInput.value ? contactInput.value.trim() : ""
        };
    }

    /**
     * 鍒囨崲妯″紡UI
     */
    function SetModeUi(tabButtons, registerOnlyInputs, submitButton, currentMode) {
        const loginButton = tabButtons[0];
        const registerButton = tabButtons[1];
        if (currentMode === AUTH_MODE_LOGIN) {
            loginButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-primary border-b-2 border-primary";
            registerButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-on-surface-variant hover:text-primary transition-colors";
            registerOnlyInputs.forEach(function HideRegisterInput(element) {
                const group = element.closest(".space-y-1");
                if (group) {
                    group.style.display = "none";
                }
            });
            submitButton.textContent = "鐧诲綍";
            return;
        }

        loginButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-on-surface-variant hover:text-primary transition-colors";
        registerButton.className = "flex-1 py-4 text-sm font-semibold headline-font text-primary border-b-2 border-primary";
        registerOnlyInputs.forEach(function ShowRegisterInput(element) {
            const group = element.closest(".space-y-1");
            if (group) {
                group.style.display = "";
            }
        });
        submitButton.textContent = "鍒涘缓璐﹀彿";
    }

    /**
     * 鏄剧ず鎴愬姛淇℃伅
     */
    function ShowSuccess(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200";
        messageBar.textContent = message;
    }

    /**
     * 鏄剧ず閿欒淇℃伅
     */
    function ShowError(messageBar, message) {
        messageBar.style.display = "block";
        messageBar.className = "rounded-lg px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200";
        messageBar.textContent = message;
    }

    /**
     * 闅愯棌鎻愮ず淇℃伅
     */
    function HideMessage(messageBar) {
        messageBar.style.display = "none";
        messageBar.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", BindAuthPage);
})();


