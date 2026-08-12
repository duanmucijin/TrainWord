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

const elements = {
  apiBaseInput: document.querySelector("#apiBaseInput"),
  saveApiButton: document.querySelector("#saveApiButton"),
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

function normalizeApiBase(value) {
  return (value || defaultApiBase()).trim().replace(/\/+$/, "");
}

function getApiBase() {
  return normalizeApiBase(localStorage.getItem(API_STORAGE_KEY) || defaultApiBase());
}

function setStatus(label, mode = "") {
  elements.statusPill.textContent = label;
  elements.statusPill.className = `status ${mode}`.trim();
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
  try {
    const payload = await apiFetch("/health");
    setStatus(payload.ok ? "已连接" : "异常", payload.ok ? "ok" : "error");
  } catch {
    setStatus("未连接", "error");
  }
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
          appendDownloadLink(list, format.video_url, `${quality} 视频轨`, format.video_ext || "video");
          appendDownloadLink(list, format.audio_url, `${quality} 音频轨`, format.audio_ext || "audio");
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
    setStatus("待输入", "error");
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

elements.apiBaseInput.value = getApiBase();
elements.saveApiButton.addEventListener("click", () => {
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

checkHealth();
