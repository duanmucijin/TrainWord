function defaultApiBase() {
  const params = new URLSearchParams(location.search);
  if (params.get("local") === "1") {
    return "http://127.0.0.1:8765";
  }
  return "https://api.trainword.com";
}

const API_STORAGE_KEY = "uploader.extractor.apiBase";
const DEVICE_ID_KEY = "uploader.visitor.deviceId";
const TOKEN_KEY = "uploader.visitor.token";
const LANGUAGE_KEY = "uploader-language";

function normalizeLanguage(value) {
  const language = String(value || "").trim().toLowerCase();
  if (language.startsWith("zh")) return "zh";
  if (language.startsWith("en")) return "en";
  return null;
}

function readStoredLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_KEY));
  } catch {
    return null;
  }
}

function storeLanguage(language) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // The current page can still switch languages when storage is unavailable.
  }
}

const translations = {
  zh: {
    pageTitle: "大神水印神器", brand: "大神水印神器", extractMedia: "素材提取", checkAccount: "检查账号",
    accountLogin: "账号登录", accountActions: "账号操作", login: "登录", register: "注册", username: "用户名",
    password: "密码", logout: "退出", developerDebug: "开发调试", applyDebug: "应用调试配置", apply: "应用",
    checkingService: "服务检测中", sharedContent: "分享内容", sharePlaceholder: "粘贴平台分享文案或链接",
    startExtraction: "开始提取", extracting: "正在提取", clear: "清空", waitingForResults: "等待提取结果",
    platform: "平台", extractionResults: "提取结果", copyText: "复制文案", privacyPolicy: "隐私政策", support: "技术支持",
    loggedIn: "已登录账号。", loginAccount: "登录账号", enterCredentials: "请输入用户名和密码。", loggingIn: "登录中",
    registering: "注册中", accountUnavailable: "账号服务暂时不可用。", loggedOut: "已退出登录。", logoutFailed: "退出失败。",
    missingToken: "登录接口没有返回 token", connected: "已连接", abnormal: "异常", disconnected: "未连接", notice: "提示",
    addContent: "需要补充内容", pasteFirst: "先粘贴分享文案或链接", image: "图片", audio: "音频", video: "视频",
    open: "打开", originalImage: "原图", defaultQuality: "默认", videoPicture: "{quality} 高清画面",
    matchingAudio: "{quality} 配套声音", originalResource: "原始资源", formatCount: "{count} 档", noMedia: "无媒体结果",
    noText: "无文案", processing: "处理中", completed: "已完成", failed: "失败", error: "错误", extractionFailed: "提取失败",
    invalid_username: "用户名需为 3 至 20 位中文、字母、数字或下划线。", weak_password: "密码需为 8 至 72 位，并同时包含字母和数字。",
    username_taken: "这个用户名已经被使用，请换一个。", invalid_credentials: "用户名或密码不正确。",
    login_locked: "尝试次数过多，请 15 分钟后再试。", rate_limited: "当前网络请求过多，请稍后再试。",
    unauthenticated: "登录状态已失效，请重新登录。", account_upstream_unavailable: "账号服务暂时不可用。",
    origin_forbidden: "当前网站地址未获账号服务授权。", request_failed: "账号服务暂时不可用。",
  },
  en: {
    pageTitle: "Watermark Master", brand: "Watermark Master", extractMedia: "Media Extractor", checkAccount: "Check Account",
    accountLogin: "Account sign-in", accountActions: "Account actions", login: "Sign In", register: "Register", username: "Username",
    password: "Password", logout: "Sign Out", developerDebug: "Developer Debugging", applyDebug: "Apply debug settings", apply: "Apply",
    checkingService: "Checking service", sharedContent: "Shared Content", sharePlaceholder: "Paste a shared post or link",
    startExtraction: "Extract", extracting: "Extracting", clear: "Clear", waitingForResults: "Waiting for results",
    platform: "Platform", extractionResults: "Extraction Results", copyText: "Copy Text", privacyPolicy: "Privacy Policy", support: "Support",
    loggedIn: "Signed in.", loginAccount: "Sign In", enterCredentials: "Enter your username and password.", loggingIn: "Signing in",
    registering: "Registering", accountUnavailable: "The account service is temporarily unavailable.", loggedOut: "Signed out.",
    logoutFailed: "Could not sign out.", missingToken: "The sign-in service did not return a token.", connected: "Connected",
    abnormal: "Unavailable", disconnected: "Disconnected", notice: "Notice", addContent: "More Information Needed",
    pasteFirst: "Paste a shared post or link first.", image: "Image", audio: "Audio", video: "Video", open: "Open",
    originalImage: "Original", defaultQuality: "Default", videoPicture: "{quality} video", matchingAudio: "{quality} audio",
    originalResource: "Original resource", formatCount: "{count} options", noMedia: "No Media Found", noText: "No text",
    processing: "Processing", completed: "Complete", failed: "Failed", error: "Error", extractionFailed: "Extraction Failed",
    invalid_username: "Use 3–20 Chinese characters, letters, numbers, or underscores.",
    weak_password: "Use 8–72 characters with at least one letter and one number.", username_taken: "That username is already in use.",
    invalid_credentials: "The username or password is incorrect.", login_locked: "Too many attempts. Try again in 15 minutes.",
    rate_limited: "Too many requests. Try again shortly.", unauthenticated: "Your session has expired. Sign in again.",
    account_upstream_unavailable: "The account service is temporarily unavailable.",
    origin_forbidden: "This website is not authorized to use the account service.",
    request_failed: "The account service is temporarily unavailable.",
  },
};

const pageParameters = new URLSearchParams(location.search);
const requestedLanguage = normalizeLanguage(pageParameters.get("lang"));
const storedLanguage = readStoredLanguage();
const preferredLanguage = normalizeLanguage(navigator.languages?.[0] || navigator.language);
let currentLanguage = requestedLanguage || storedLanguage || preferredLanguage || "en";

function t(key, values = {}) {
  const template = translations[currentLanguage][key] || translations.zh[key] || key;
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

function accountMessage(code) {
  return translations[currentLanguage][code] || null;
}

const elements = {
  apiSettings: document.querySelector("#apiSettings"),
  apiBaseInput: document.querySelector("#apiBaseInput"),
  saveApiButton: document.querySelector("#saveApiButton"),
  accountToggleButton: document.querySelector("#accountToggleButton"),
  accountPanel: document.querySelector("#accountPanel"),
  loginTabButton: document.querySelector("#loginTabButton"),
  registerTabButton: document.querySelector("#registerTabButton"),
  usernameInput: document.querySelector("#usernameInput"),
  passwordInput: document.querySelector("#passwordInput"),
  submitAccountButton: document.querySelector("#submitAccountButton"),
  logoutButton: document.querySelector("#logoutButton"),
  accountMessage: document.querySelector("#accountMessage"),
  shareInput: document.querySelector("#shareInput"),
  extractButton: document.querySelector("#extractButton"),
  extractButtonText: document.querySelector("#extractButtonText"),
  clearButton: document.querySelector("#clearButton"),
  statusPill: document.querySelector("#statusPill"),
  progressBar: document.querySelector("#progressBar"),
  emptyState: document.querySelector("#emptyState"),
  resultContent: document.querySelector("#resultContent"),
  platformName: document.querySelector("#platformName"),
  resultTitle: document.querySelector("#resultTitle"),
  textOutput: document.querySelector("#textOutput"),
  mediaGrid: document.querySelector("#mediaGrid"),
  copyTextButton: document.querySelector("#copyTextButton"),
  mediaTemplate: document.querySelector("#mediaTemplate"),
  languageButtons: [...document.querySelectorAll("[data-set-language]")],
};

let lastText = "";
let accountMode = "login";
let currentAccount = null;
let currentPayload = null;

function applyLanguage(language, persist = true) {
  currentLanguage = language === "zh" ? "zh" : "en";
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
  document.title = t("pageTitle");
  const description = document.querySelector("#page-description");
  if (description) {
    description.content = currentLanguage === "zh"
      ? "大神水印神器在线素材提取工具。"
      : "Watermark Master online media extraction tool.";
  }
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((node) => {
    node.title = t(node.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
  });
  document.querySelectorAll("[data-localized-link]").forEach((node) => {
    node.search = `?lang=${currentLanguage}`;
  });
  elements.languageButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.setLanguage === currentLanguage));
  });
  setAccountMode(accountMode);
  renderAccount(currentAccount);
  if (currentPayload) renderPayload(currentPayload);
  if (persist) storeLanguage(currentLanguage);
}

function normalizeApiBase(value) {
  return (value || defaultApiBase()).trim().replace(/\/+$/, "");
}

function getApiBase() {
  return normalizeApiBase(localStorage.getItem(API_STORAGE_KEY) || defaultApiBase());
}

function setStatus(label, mode = "") {
  if (!isDebugMode()) return;
  elements.statusPill.textContent = label;
  elements.statusPill.className = `debug-status ${mode}`.trim();
}

function setBusy(isBusy) {
  elements.extractButton.disabled = isBusy;
  elements.extractButtonText.textContent = isBusy ? t("extracting") : t("startExtraction");
  elements.progressBar.classList.toggle("active", isBusy);
  elements.progressBar.setAttribute("aria-hidden", String(!isBusy));
}

function getDeviceId() {
  const saved = localStorage.getItem(DEVICE_ID_KEY);
  if (saved) {
    return saved;
  }
  const generated = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `HTTP ${response.status}`);
  }
  return payload;
}

async function accountFetch(path, options = {}) {
  const response = await fetch(`/uploader/api/account/${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload.error || {};
    const message =
      accountMessage(error.code) ||
      error.message ||
      payload.message ||
      `HTTP ${response.status}`;
    const thrown = new Error(message);
    thrown.code = error.code || "request_failed";
    throw thrown;
  }
  return payload;
}

function setAccountMessage(message = "", mode = "") {
  elements.accountMessage.textContent = message;
  elements.accountMessage.className = `account-message ${mode}`.trim();
}

function setAccountPanel(open) {
  elements.accountPanel.classList.toggle("hidden", !open);
}

function setAccountMode(mode) {
  accountMode = mode;
  const isLogin = mode === "login";
  elements.loginTabButton.classList.toggle("active", isLogin);
  elements.registerTabButton.classList.toggle("active", !isLogin);
  elements.loginTabButton.setAttribute("aria-pressed", String(isLogin));
  elements.registerTabButton.setAttribute("aria-pressed", String(!isLogin));
  elements.submitAccountButton.textContent = isLogin ? t("login") : t("register");
  elements.passwordInput.autocomplete = isLogin ? "current-password" : "new-password";
  setAccountMessage("");
}

function renderAccount(account) {
  currentAccount = account;
  if (account) {
    elements.accountToggleButton.textContent = account.displayName || account.username;
    elements.logoutButton.classList.remove("hidden");
    elements.submitAccountButton.classList.add("hidden");
    setAccountMessage(t("loggedIn"), "ok");
    return;
  }
  elements.accountToggleButton.textContent = t("loginAccount");
  elements.logoutButton.classList.add("hidden");
  elements.submitAccountButton.classList.remove("hidden");
}

async function loadAccountSession() {
  try {
    const payload = await accountFetch("session");
    renderAccount(payload.account);
  } catch (error) {
    if (error.code !== "unauthenticated") {
      setAccountMessage(error.message || t("accountUnavailable"), "error");
    }
    renderAccount(null);
  }
}

async function submitAccount() {
  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value;
  if (!username || !password) {
    setAccountMessage(t("enterCredentials"), "error");
    return;
  }
  elements.submitAccountButton.disabled = true;
  setAccountMessage(accountMode === "login" ? t("loggingIn") : t("registering"));
  try {
    const payload = await accountFetch(accountMode, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    renderAccount(payload.account);
    elements.passwordInput.value = "";
  } catch (error) {
    setAccountMessage(error.message || t("accountUnavailable"), "error");
  } finally {
    elements.submitAccountButton.disabled = false;
  }
}

async function logoutAccount() {
  elements.logoutButton.disabled = true;
  try {
    await accountFetch("logout", { method: "POST" });
    renderAccount(null);
    setAccountMessage(t("loggedOut"));
  } catch (error) {
    setAccountMessage(error.message || t("logoutFailed"), "error");
  } finally {
    elements.logoutButton.disabled = false;
  }
}

async function ensureToken() {
  const saved = localStorage.getItem(TOKEN_KEY);
  if (saved) {
    return saved;
  }
  const payload = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      loginMethod: "visitor",
      loginIdentifier: getDeviceId(),
    }),
  });
  if (!payload.token) {
    throw new Error(t("missingToken"));
  }
  localStorage.setItem(TOKEN_KEY, payload.token);
  return payload.token;
}

async function checkHealth() {
  if (!isDebugMode()) return;
  try {
    const payload = await apiFetch("/health");
    setStatus(payload.ok ? t("connected") : t("abnormal"), payload.ok ? "ok" : "error");
  } catch {
    setStatus(t("disconnected"), "error");
  }
}

function isDebugMode() {
  return new URLSearchParams(location.search).get("debug") === "1";
}

function showInlineError(message) {
  elements.emptyState.classList.add("hidden");
  elements.resultContent.classList.remove("hidden");
  elements.platformName.textContent = t("notice");
  elements.resultTitle.textContent = t("addContent");
  elements.textOutput.textContent = message;
  elements.mediaGrid.innerHTML = "";
}

function clearResults() {
  lastText = "";
  currentPayload = null;
  elements.textOutput.textContent = "";
  elements.mediaGrid.innerHTML = "";
  elements.emptyState.classList.remove("hidden");
  elements.resultContent.classList.add("hidden");
}

function mediaLabel(media) {
  if (media.media_type === "image") return t("image");
  if (media.media_type === "audio") return t("audio");
  return t("video");
}

function makePreview(media) {
  const wrapper = document.createElement("div");
  wrapper.className = "preview";
  const previewUrl = media.preview_url || media.resource_url;
  if (!previewUrl) {
    wrapper.textContent = mediaLabel(media);
    return wrapper;
  }
  if (media.media_type === "image") {
    const image = document.createElement("img");
    image.loading = "lazy";
    image.alt = "preview";
    image.src = previewUrl;
    wrapper.append(image);
    return wrapper;
  }
  if (media.media_type === "video" && media.resource_url && !hasSeparateFormats(media)) {
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.poster = media.preview_url || "";
    video.src = media.resource_url;
    wrapper.append(video);
    return wrapper;
  }
  const image = document.createElement("img");
  image.loading = "lazy";
  image.alt = "preview";
  image.src = previewUrl;
  wrapper.append(image);
  return wrapper;
}

function hasSeparateFormats(media) {
  return (media.formats || []).some((format) => format.separate);
}

function appendDownloadLink(container, href, label, note) {
  if (!href) return;
  const link = document.createElement("a");
  link.className = "download-link";
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.download = "";

  const title = document.createElement("span");
  title.textContent = label;
  const meta = document.createElement("em");
  meta.textContent = note || t("open");
  link.append(title, meta);
  container.append(link);
}

function renderMedia(payload) {
  elements.mediaGrid.innerHTML = "";

  for (const media of payload.medias || []) {
    const node = elements.mediaTemplate.content.firstElementChild.cloneNode(true);
    const preview = makePreview(media);
    node.querySelector(".preview").replaceWith(preview);
    node.querySelector(".media-type").textContent = mediaLabel(media);

    const formats = media.formats || [];
    node.querySelector(".format-count").textContent = formats.length
      ? t("formatCount", { count: formats.length })
      : t("originalImage");

    const list = node.querySelector(".format-list");
    if (formats.length) {
      formats.forEach((format) => {
        const quality = format.quality_note || format.quality || t("defaultQuality");
        if (format.separate) {
          appendDownloadLink(list, format.video_url, t("videoPicture", { quality }), format.video_ext || "video");
          appendDownloadLink(list, format.audio_url, t("matchingAudio", { quality }), format.audio_ext || "audio");
        } else {
          appendDownloadLink(list, format.video_url || format.audio_url, quality, format.video_ext || format.audio_ext || "media");
        }
      });
    } else {
      appendDownloadLink(list, media.resource_url, mediaLabel(media), t("originalResource"));
    }
    elements.mediaGrid.append(node);
  }
}

function renderPayload(payload) {
  currentPayload = payload;
  const warnings = payload.warnings || [];
  lastText = payload.text || "";
  elements.platformName.textContent = payload.platform?.name || payload.platform?.id || t("platform");
  elements.resultTitle.textContent = payload.medias?.length ? t("extractionResults") : t("noMedia");
  elements.textOutput.textContent = lastText || t("noText");
  renderMedia(payload);

  if (warnings.length) {
    const notice = document.createElement("p");
    notice.className = "notice";
    notice.textContent = warnings.join("；");
    elements.mediaGrid.prepend(notice);
  }

  elements.emptyState.classList.add("hidden");
  elements.resultContent.classList.remove("hidden");
}

async function extract() {
  const content = elements.shareInput.value.trim();
  if (!content) {
    showInlineError(t("pasteFirst"));
    elements.shareInput.focus();
    return;
  }

  setBusy(true);
  setStatus(t("processing"));
  try {
    const token = await ensureToken();
    const payload = await apiFetch("/api/media/extract/post", {
      method: "POST",
      headers: {
        "G-Token": token,
      },
      body: JSON.stringify({ content }),
    });
    renderPayload(payload);
    setStatus(t("completed"), "ok");
  } catch (error) {
    setStatus(t("failed"), "error");
    elements.emptyState.classList.add("hidden");
    elements.resultContent.classList.remove("hidden");
    elements.platformName.textContent = t("error");
    elements.resultTitle.textContent = t("extractionFailed");
    elements.textOutput.textContent = error.message || String(error);
    elements.mediaGrid.innerHTML = "";
    if (/401|登录|sign.?in/i.test(error.message || "")) {
      localStorage.removeItem(TOKEN_KEY);
    }
  } finally {
    setBusy(false);
  }
}

if (isDebugMode()) {
  elements.apiSettings.classList.remove("hidden");
  elements.apiBaseInput.value = getApiBase();
}
elements.languageButtons.forEach((button) => {
  button.addEventListener("click", () => applyLanguage(button.dataset.setLanguage));
});
elements.accountToggleButton.addEventListener("click", () => {
  setAccountPanel(elements.accountPanel.classList.contains("hidden"));
});
elements.loginTabButton.addEventListener("click", () => setAccountMode("login"));
elements.registerTabButton.addEventListener("click", () => setAccountMode("register"));
elements.submitAccountButton.addEventListener("click", submitAccount);
elements.logoutButton.addEventListener("click", logoutAccount);
elements.saveApiButton?.addEventListener("click", () => {
  if (!isDebugMode()) return;
  localStorage.setItem(API_STORAGE_KEY, normalizeApiBase(elements.apiBaseInput.value));
  localStorage.removeItem(TOKEN_KEY);
  checkHealth();
});
elements.extractButton.addEventListener("click", extract);
elements.clearButton.addEventListener("click", () => {
  elements.shareInput.value = "";
  clearResults();
});
elements.copyTextButton.addEventListener("click", async () => {
  if (!lastText) return;
  await navigator.clipboard.writeText(lastText);
});

applyLanguage(currentLanguage, false);
loadAccountSession();
checkHealth();
