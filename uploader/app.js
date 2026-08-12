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

const accountMessages = {
  invalid_username: "用户名需为 3 至 20 位中文、字母、数字或下划线。",
  weak_password: "密码需为 8 至 72 位，并同时包含字母和数字。",
  username_taken: "这个用户名已经被使用，请换一个。",
  invalid_credentials: "用户名或密码不正确。",
  login_locked: "尝试次数过多，请 15 分钟后再试。",
  rate_limited: "当前网络请求过多，请稍后再试。",
  unauthenticated: "登录状态已失效，请重新登录。",
  account_upstream_unavailable: "账号服务暂时不可用。",
  origin_forbidden: "当前网站地址未获账号服务授权。",
  request_failed: "账号服务暂时不可用。",
};

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
};

let lastText = "";
let accountMode = "login";
let currentAccount = null;

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
  elements.extractButtonText.textContent = isBusy ? "正在提取" : "开始提取";
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
      accountMessages[error.code] ||
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
  elements.submitAccountButton.textContent = isLogin ? "登录" : "注册";
  elements.passwordInput.autocomplete = isLogin ? "current-password" : "new-password";
  setAccountMessage("");
}

function renderAccount(account) {
  currentAccount = account;
  if (account) {
    elements.accountToggleButton.textContent = account.displayName || account.username;
    elements.logoutButton.classList.remove("hidden");
    elements.submitAccountButton.classList.add("hidden");
    setAccountMessage("已登录账号。", "ok");
    return;
  }
  elements.accountToggleButton.textContent = "登录账号";
  elements.logoutButton.classList.add("hidden");
  elements.submitAccountButton.classList.remove("hidden");
}

async function loadAccountSession() {
  try {
    const payload = await accountFetch("session");
    renderAccount(payload.account);
  } catch (error) {
    if (error.code !== "unauthenticated") {
      setAccountMessage(error.message || "账号服务暂时不可用。", "error");
    }
    renderAccount(null);
  }
}

async function submitAccount() {
  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value;
  if (!username || !password) {
    setAccountMessage("请输入用户名和密码。", "error");
    return;
  }
  elements.submitAccountButton.disabled = true;
  setAccountMessage(accountMode === "login" ? "登录中" : "注册中");
  try {
    const payload = await accountFetch(accountMode, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    renderAccount(payload.account);
    elements.passwordInput.value = "";
  } catch (error) {
    setAccountMessage(error.message || "账号服务暂时不可用。", "error");
  } finally {
    elements.submitAccountButton.disabled = false;
  }
}

async function logoutAccount() {
  elements.logoutButton.disabled = true;
  try {
    await accountFetch("logout", { method: "POST" });
    renderAccount(null);
    setAccountMessage("已退出登录。");
  } catch (error) {
    setAccountMessage(error.message || "退出失败。", "error");
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
    throw new Error("登录接口没有返回 token");
  }
  localStorage.setItem(TOKEN_KEY, payload.token);
  return payload.token;
}

async function checkHealth() {
  if (!isDebugMode()) return;
  try {
    const payload = await apiFetch("/health");
    setStatus(payload.ok ? "已连接" : "异常", payload.ok ? "ok" : "error");
  } catch {
    setStatus("未连接", "error");
  }
}

function isDebugMode() {
  return new URLSearchParams(location.search).get("debug") === "1";
}

function showInlineError(message) {
  elements.emptyState.classList.add("hidden");
  elements.resultContent.classList.remove("hidden");
  elements.platformName.textContent = "提示";
  elements.resultTitle.textContent = "需要补充内容";
  elements.textOutput.textContent = message;
  elements.mediaGrid.innerHTML = "";
}

function clearResults() {
  lastText = "";
  elements.textOutput.textContent = "";
  elements.mediaGrid.innerHTML = "";
  elements.emptyState.classList.remove("hidden");
  elements.resultContent.classList.add("hidden");
}

function mediaLabel(media) {
  if (media.media_type === "image") return "图片";
  if (media.media_type === "audio") return "音频";
  return "视频";
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
  meta.textContent = note || "打开";
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
    node.querySelector(".format-count").textContent = formats.length ? `${formats.length} 档` : "原图";

    const list = node.querySelector(".format-list");
    if (formats.length) {
      formats.forEach((format) => {
        const quality = format.quality_note || format.quality || "默认";
        if (format.separate) {
          appendDownloadLink(list, format.video_url, `${quality} 高清画面`, format.video_ext || "video");
          appendDownloadLink(list, format.audio_url, `${quality} 配套声音`, format.audio_ext || "audio");
        } else {
          appendDownloadLink(list, format.video_url || format.audio_url, quality, format.video_ext || format.audio_ext || "media");
        }
      });
    } else {
      appendDownloadLink(list, media.resource_url, mediaLabel(media), "原始资源");
    }
    elements.mediaGrid.append(node);
  }
}

function renderPayload(payload) {
  const warnings = payload.warnings || [];
  lastText = payload.text || "";
  elements.platformName.textContent = payload.platform?.name || payload.platform?.id || "平台";
  elements.resultTitle.textContent = payload.medias?.length ? "提取结果" : "无媒体结果";
  elements.textOutput.textContent = lastText || "无文案";
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
    showInlineError("先粘贴分享文案或链接");
    elements.shareInput.focus();
    return;
  }

  setBusy(true);
  setStatus("处理中");
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
    setStatus("已完成", "ok");
  } catch (error) {
    setStatus("失败", "error");
    elements.emptyState.classList.add("hidden");
    elements.resultContent.classList.remove("hidden");
    elements.platformName.textContent = "错误";
    elements.resultTitle.textContent = "提取失败";
    elements.textOutput.textContent = error.message || String(error);
    elements.mediaGrid.innerHTML = "";
    if (/401|登录/.test(error.message || "")) {
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
elements.accountToggleButton.addEventListener("click", () => {
  setAccountPanel(elements.accountPanel.classList.contains("hidden"));
});
elements.loginTabButton.addEventListener("click", () => setAccountMode("login"));
elements.registerTabButton.addEventListener("click", () => setAccountMode("register"));
elements.submitAccountButton.addEventListener("click", submitAccount);
elements.logoutButton.addEventListener("click", logoutAccount);
elements.saveApiButton.addEventListener("click", () => {
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

setAccountMode("login");
loadAccountSession();
checkHealth();
