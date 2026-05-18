/**
 * AuthGate — 可选登录门禁，验证通过后解锁页面交互
 */
(function (global) {
  "use strict";

  const DEFAULTS = {
    formSelector: "#loginForm",
    usernameSelector: "#usernameInput",
    passwordSelector: "#passwordInput",
    rememberSelector: "#rememberInput",
    messageSelector: "#loginMessage",
    shellSelector: "#authShell",
    bodyLockedClass: "auth-locked",
    bodyAuthenticatedClass: "is-authenticated",
    account: "admin",
    password: "123456789",
    storageKey: "particle_flow_login_credential",
    onSuccess: null,
  };

  class AuthGate {
    constructor(options = {}) {
      this.options = { ...DEFAULTS, ...options };
      this.form = document.querySelector(this.options.formSelector);
      this.usernameInput = document.querySelector(this.options.usernameSelector);
      this.passwordInput = document.querySelector(this.options.passwordSelector);
      this.rememberInput = document.querySelector(this.options.rememberSelector);
      this.messageEl = document.querySelector(this.options.messageSelector);
      this.shell = document.querySelector(this.options.shellSelector);

      if (!this.form) {
        throw new Error("AuthGate: 找不到登录表单");
      }

      document.body.classList.add(this.options.bodyLockedClass);
      this._loadRemembered();
      this.form.addEventListener("submit", (e) => this._onSubmit(e));
    }

    isAuthenticated() {
      return document.body.classList.contains(this.options.bodyAuthenticatedClass);
    }

    setMessage(text, type) {
      if (!this.messageEl) return;
      this.messageEl.textContent = text;
      this.messageEl.classList.remove("is-error", "is-success");
      if (type === "error") this.messageEl.classList.add("is-error");
      if (type === "success") this.messageEl.classList.add("is-success");
    }

    unlock() {
      const { bodyLockedClass, bodyAuthenticatedClass } = this.options;
      document.body.classList.remove(bodyLockedClass);
      document.body.classList.add(bodyAuthenticatedClass);

      if (this.shell) {
        window.setTimeout(() => {
          this.shell.setAttribute("aria-hidden", "true");
        }, 620);
      }

      if (typeof this.options.onSuccess === "function") {
        this.options.onSuccess();
      }
    }

    _loadRemembered() {
      try {
        const raw = localStorage.getItem(this.options.storageKey);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (!saved || typeof saved !== "object") return;
        if (typeof saved.account === "string") this.usernameInput.value = saved.account;
        if (typeof saved.password === "string") this.passwordInput.value = saved.password;
        this.rememberInput.checked = true;
      } catch {
        localStorage.removeItem(this.options.storageKey);
      }
    }

    _saveCredential(account, password) {
      localStorage.setItem(
        this.options.storageKey,
        JSON.stringify({ account, password })
      );
    }

    _onSubmit(event) {
      event.preventDefault();
      const account = this.usernameInput.value.trim();
      const password = this.passwordInput.value;
      const opts = this.options;

      if (account === opts.account && password === opts.password) {
        if (this.rememberInput.checked) {
          this._saveCredential(account, password);
        } else {
          localStorage.removeItem(opts.storageKey);
        }
        this.setMessage("登录成功，正在进入页面…", "success");
        this.unlock();
        return;
      }

      this.setMessage("账号或密码错误，请重试。", "error");
      this.passwordInput.focus();
      this.passwordInput.select();
    }
  }

  global.AuthGate = AuthGate;
})(typeof window !== "undefined" ? window : globalThis);
