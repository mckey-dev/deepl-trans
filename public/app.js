const LANGUAGES = [
  { name: "アラビア語", source: "AR", target: "AR" },
  { name: "ブルガリア語", source: "BG", target: "BG" },
  { name: "チェコ語", source: "CS", target: "CS" },
  { name: "デンマーク語", source: "DA", target: "DA" },
  { name: "ドイツ語", source: "DE", target: "DE" },
  { name: "ギリシャ語", source: "EL", target: "EL" },
  { name: "英語", source: "EN", target: null },
  { name: "英語（アメリカ）", source: null, target: "EN-US" },
  { name: "英語（イギリス）", source: null, target: "EN-GB" },
  { name: "スペイン語", source: "ES", target: "ES" },
  { name: "スペイン語（ラテンアメリカ）", source: null, target: "ES-419" },
  { name: "エストニア語", source: "ET", target: "ET" },
  { name: "フィンランド語", source: "FI", target: "FI" },
  { name: "フランス語", source: "FR", target: "FR" },
  { name: "フランス語（カナダ）", source: null, target: "FR-CA" },
  { name: "ヘブライ語", source: "HE", target: "HE" },
  { name: "ハンガリー語", source: "HU", target: "HU" },
  { name: "インドネシア語", source: "ID", target: "ID" },
  { name: "イタリア語", source: "IT", target: "IT" },
  { name: "日本語", source: "JA", target: "JA" },
  { name: "韓国語", source: "KO", target: "KO" },
  { name: "リトアニア語", source: "LT", target: "LT" },
  { name: "ラトビア語", source: "LV", target: "LV" },
  { name: "ノルウェー語（ブークモール）", source: "NB", target: "NB" },
  { name: "オランダ語", source: "NL", target: "NL" },
  { name: "ポーランド語", source: "PL", target: "PL" },
  { name: "ポルトガル語", source: "PT", target: null },
  { name: "ポルトガル語（ブラジル）", source: null, target: "PT-BR" },
  { name: "ポルトガル語（ポルトガル）", source: null, target: "PT-PT" },
  { name: "ルーマニア語", source: "RO", target: "RO" },
  { name: "ロシア語", source: "RU", target: "RU" },
  { name: "スロバキア語", source: "SK", target: "SK" },
  { name: "スロベニア語", source: "SL", target: "SL" },
  { name: "スウェーデン語", source: "SV", target: "SV" },
  { name: "タイ語", source: "TH", target: "TH" },
  { name: "トルコ語", source: "TR", target: "TR" },
  { name: "ウクライナ語", source: "UK", target: "UK" },
  { name: "ベトナム語", source: "VI", target: "VI" },
  { name: "中国語", source: "ZH", target: null },
  { name: "中国語（簡体字）", source: null, target: "ZH-HANS" },
  { name: "中国語（繁体字）", source: null, target: "ZH-HANT" },
].sort((a, b) => a.name.localeCompare(b.name, "ja"));

const SOURCE_OF_TARGET = {
  "EN-US": "EN",
  "EN-GB": "EN",
  "PT-BR": "PT",
  "PT-PT": "PT",
  "ZH-HANS": "ZH",
  "ZH-HANT": "ZH",
  "ES-419": "ES",
  "FR-CA": "FR",
};

const TARGET_OF_SOURCE = {
  EN: "EN-US",
  PT: "PT-BR",
  ZH: "ZH-HANS",
};

const state = {
  sourceMode: "auto",
  sourceLang: null,
  detectedLang: null,
  targetLang: "JA",
  translation: "",
  error: "",
  loading: false,
  menuSide: null,
};

const sourceText = document.querySelector("#sourceText");
const output = document.querySelector("#output");
const sourceLangBtn = document.querySelector("#sourceLangBtn");
const targetLangBtn = document.querySelector("#targetLangBtn");
const sourceLangLabel = document.querySelector("#sourceLangLabel");
const targetLangLabel = document.querySelector("#targetLangLabel");
const swapBtn = document.querySelector("#swapBtn");
const clearBtn = document.querySelector("#clearBtn");
const copySourceBtn = document.querySelector("#copySourceBtn");
const copyTargetBtn = document.querySelector("#copyTargetBtn");
const charCount = document.querySelector("#charCount");
const statusEl = document.querySelector("#status");
const langMenu = document.querySelector("#langMenu");
const langList = document.querySelector("#langList");
const langSearch = document.querySelector("#langSearch");
const toast = document.querySelector("#toast");
const apiKeyBtn = document.querySelector("#apiKeyBtn");
const apiKeyDialog = document.querySelector("#apiKeyDialog");
const apiKeyForm = document.querySelector("#apiKeyForm");
const apiKeyInput = document.querySelector("#apiKeyInput");
const apiKeyToggle = document.querySelector("#apiKeyToggle");
const apiKeyError = document.querySelector("#apiKeyError");
const apiKeyClear = document.querySelector("#apiKeyClear");
const apiKeyCancel = document.querySelector("#apiKeyCancel");
const API_KEY_STORAGE = "deeplApiKey";

let requestId = 0;
let debounceTimer = 0;
let toastTimer = 0;
let activeOption = 0;

function languageName(code) {
  if (!code) return "";
  const upper = code.toUpperCase();
  const exact = LANGUAGES.find((lang) => lang.source === upper || lang.target === upper);
  if (exact && (exact.source === upper || exact.target === upper)) {
    if (upper === "EN-US") return "英語（アメリカ）";
    if (upper === "EN-GB") return "英語（イギリス）";
    if (upper === "EN") return "英語";
    if (upper === "PT") return "ポルトガル語";
    if (upper === "ZH") return "中国語";
    return exact.name;
  }
  return upper;
}

function toSourceCode(code) {
  const upper = code.toUpperCase();
  return SOURCE_OF_TARGET[upper] || upper;
}

function toTargetCode(code) {
  const upper = code.toUpperCase();
  return TARGET_OF_SOURCE[upper] || upper;
}

function sameLanguage(source, target) {
  if (!source || !target) return false;
  const sourceCode = source.toUpperCase();
  const targetCode = target.toUpperCase();
  if (sourceCode === targetCode) return true;
  const sourceBase = sourceCode.split("-")[0];
  const targetBase = targetCode.split("-")[0];
  if (sourceBase !== targetBase) return false;
  if (sourceBase === "ZH") {
    const script = (code) => (code.includes("HANT") ? "HANT" : "HANS");
    return script(sourceCode) === script(targetCode);
  }
  return true;
}

function currentSourceCode() {
  if (state.sourceMode === "manual") return state.sourceLang;
  return state.detectedLang;
}

function sourceLabel() {
  if (state.sourceMode === "auto") {
    return state.detectedLang ? `${languageName(state.detectedLang)}（自動検出）` : "言語を自動検出";
  }
  return languageName(state.sourceLang);
}

function canSwap() {
  if (!sourceText.value.trim()) return false;
  return Boolean(currentSourceCode());
}

function render() {
  sourceLangLabel.textContent = sourceLabel();
  targetLangLabel.textContent = languageName(state.targetLang);
  const hasSource = sourceText.value.length > 0;
  clearBtn.hidden = !hasSource;
  charCount.textContent = hasSource ? String(sourceText.value.length) : "";
  copySourceBtn.disabled = !sourceText.value;
  copyTargetBtn.disabled = !state.translation;
  swapBtn.disabled = !canSwap();

  output.classList.toggle("is-error", Boolean(state.error));
  output.classList.toggle("is-loading", state.loading && !state.translation && !state.error);
  if (state.error) {
    output.textContent = state.error;
  } else if (state.translation) {
    output.textContent = state.translation;
  } else if (state.loading) {
    output.textContent = "翻訳しています…";
  } else {
    output.textContent = "";
  }
  statusEl.textContent = state.loading && state.translation ? "翻訳しています…" : "";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1600);
}

async function copyText(text, button) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  button.classList.add("is-copied");
  const previous = button.getAttribute("aria-label");
  button.setAttribute("aria-label", "コピーしました");
  showToast("コピーしました");
  window.setTimeout(() => {
    button.classList.remove("is-copied");
    button.setAttribute("aria-label", previous);
  }, 1600);
}

function menuItems() {
  const query = langSearch.value.trim().toLocaleLowerCase("ja");
  const side = state.menuSide;
  const items = [];
  if (side === "source") {
    items.push({ id: "auto", name: "言語を自動検出", code: null });
  }
  for (const lang of LANGUAGES) {
    const code = side === "source" ? lang.source : lang.target;
    if (!code) continue;
    if (query && !lang.name.toLocaleLowerCase("ja").includes(query) && !code.toLocaleLowerCase().includes(query)) {
      continue;
    }
    items.push({ id: code, name: lang.name, code });
  }
  if (query) {
    return items.filter((item) => item.id !== "auto" || "言語を自動検出".includes(langSearch.value.trim()));
  }
  return items;
}

function selectedMenuId() {
  if (state.menuSide === "source" && state.sourceMode === "auto") return "auto";
  if (state.menuSide === "source") return state.sourceLang;
  return state.targetLang;
}

function renderMenu() {
  const items = menuItems();
  langList.innerHTML = "";
  if (!items.length) {
    langList.style.removeProperty("--rows");
    const empty = document.createElement("p");
    empty.className = "lang-empty";
    empty.textContent = "一致する言語がありません";
    langList.appendChild(empty);
    return;
  }
  langList.style.setProperty("--rows", String(Math.ceil(items.length / 2)));
  if (activeOption >= items.length) activeOption = 0;
  const selected = selectedMenuId();
  items.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lang-option";
    button.setAttribute("role", "option");
    button.dataset.code = item.code || "";
    button.dataset.auto = item.id === "auto" ? "true" : "false";
    const isSelected = item.id === selected || item.code === selected;
    button.setAttribute("aria-selected", isSelected ? "true" : "false");
    if (isSelected) button.classList.add("is-selected");
    if (index === activeOption) button.classList.add("is-active");
    const check = document.createElement("span");
    check.className = "check";
    check.textContent = isSelected ? "✓" : "";
    button.append(check, document.createTextNode(item.name));
    button.addEventListener("click", () => chooseLanguage(item));
    langList.appendChild(button);
  });
}

function openMenu(side) {
  state.menuSide = side;
  activeOption = 0;
  langSearch.value = "";
  langMenu.hidden = false;
  sourceLangBtn.setAttribute("aria-expanded", side === "source" ? "true" : "false");
  targetLangBtn.setAttribute("aria-expanded", side === "target" ? "true" : "false");
  renderMenu();
  const anchor = side === "source" ? sourceLangBtn : targetLangBtn;
  const rect = anchor.getBoundingClientRect();
  const width = langMenu.offsetWidth;
  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
  let top = rect.bottom + 8;
  const height = langMenu.offsetHeight;
  if (top + height > window.innerHeight - 12) {
    top = Math.max(12, rect.top - height - 8);
  }
  langMenu.style.left = `${left}px`;
  langMenu.style.top = `${top}px`;
  langSearch.focus();
}

function closeMenu() {
  if (langMenu.hidden) return;
  langMenu.hidden = true;
  state.menuSide = null;
  sourceLangBtn.setAttribute("aria-expanded", "false");
  targetLangBtn.setAttribute("aria-expanded", "false");
}

function chooseLanguage(item) {
  if (state.menuSide === "source") {
    if (!item.code) {
      state.sourceMode = "auto";
      state.sourceLang = null;
    } else {
      state.sourceMode = "manual";
      state.sourceLang = item.code;
      state.detectedLang = null;
    }
  } else if (item.code) {
    state.targetLang = item.code;
  }
  closeMenu();
  scheduleTranslate(0);
}

function clearTranslation() {
  state.translation = "";
  state.error = "";
  state.loading = false;
  state.detectedLang = state.sourceMode === "auto" ? null : state.detectedLang;
}

async function translateNow() {
  const text = sourceText.value;
  const id = ++requestId;
  if (!text.trim()) {
    clearTranslation();
    if (state.sourceMode === "auto") state.detectedLang = null;
    render();
    return;
  }

  const source = state.sourceMode === "manual" ? state.sourceLang : null;
  if (source && sameLanguage(source, state.targetLang)) {
    state.loading = false;
    state.translation = "";
    state.error = "原文と訳文の言語が同じため、翻訳できません。訳文の言語を変えてください。";
    render();
    return;
  }

  state.loading = true;
  state.error = "";
  render();

  try {
    const headers = { "Content-Type": "application/json" };
    const apiKey = readApiKey();
    if (apiKey) headers["X-DeepL-Auth-Key"] = apiKey;
    const response = await fetch("/api/translate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        text,
        target_lang: state.targetLang,
        source_lang: source,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (id !== requestId) return;
    if (!response.ok) {
      state.translation = "";
      state.error = data.message || "翻訳に失敗しました。";
      state.loading = false;
      render();
      return;
    }
    if (state.sourceMode === "auto" && data.detected_source_language) {
      state.detectedLang = data.detected_source_language.toUpperCase();
      if (sameLanguage(state.detectedLang, state.targetLang)) {
        state.translation = "";
        state.error = "検出した言語と訳文の言語が同じです。訳文の言語を変えてください。";
        state.loading = false;
        render();
        return;
      }
    }
    state.translation = data.text || "";
    state.error = "";
    state.loading = false;
    render();
  } catch {
    if (id !== requestId) return;
    state.translation = "";
    state.error = "翻訳サーバーに接続できませんでした。";
    state.loading = false;
    render();
  }
}

function scheduleTranslate(delay = 450) {
  window.clearTimeout(debounceTimer);
  if (!sourceText.value.trim()) {
    requestId += 1;
    clearTranslation();
    if (state.sourceMode === "auto") state.detectedLang = null;
    render();
    return;
  }
  state.loading = true;
  state.error = "";
  render();
  debounceTimer = window.setTimeout(translateNow, delay);
}

function swapLanguages() {
  const source = currentSourceCode();
  if (!source || !sourceText.value.trim()) return;
  const nextSource = toSourceCode(state.targetLang);
  const nextTarget = toTargetCode(source);
  if (sameLanguage(nextSource, nextTarget)) {
    state.error = "入れ替えると原文と訳文が同じ言語になります。どちらかの言語を変えてください。";
    render();
    return;
  }
  const previousTranslation = state.translation;
  state.sourceMode = "manual";
  state.sourceLang = nextSource;
  state.detectedLang = null;
  state.targetLang = nextTarget;
  state.error = "";
  if (previousTranslation) {
    const previousSource = sourceText.value;
    sourceText.value = previousTranslation;
    state.translation = previousSource;
    state.loading = false;
    render();
    return;
  }
  state.translation = "";
  scheduleTranslate(0);
}

sourceLangBtn.addEventListener("click", () => {
  if (state.menuSide === "source") closeMenu();
  else openMenu("source");
});

targetLangBtn.addEventListener("click", () => {
  if (state.menuSide === "target") closeMenu();
  else openMenu("target");
});

langSearch.addEventListener("input", () => {
  activeOption = 0;
  renderMenu();
});

langSearch.addEventListener("keydown", (event) => {
  const options = [...langList.querySelectorAll(".lang-option")];
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (!options.length) return;
    activeOption += event.key === "ArrowDown" ? 1 : -1;
    if (activeOption < 0) activeOption = options.length - 1;
    if (activeOption >= options.length) activeOption = 0;
    renderMenu();
    langList.querySelector(".lang-option.is-active")?.scrollIntoView({ block: "nearest" });
    return;
  }
  if (event.key === "Enter" && options[activeOption]) {
    event.preventDefault();
    options[activeOption].click();
  }
});

document.addEventListener("click", (event) => {
  if (langMenu.hidden) return;
  const target = event.target;
  if (langMenu.contains(target) || sourceLangBtn.contains(target) || targetLangBtn.contains(target)) return;
  closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!apiKeyDialog.hidden) {
    event.preventDefault();
    closeApiKeyDialog();
    return;
  }
  closeMenu();
});

window.addEventListener("resize", () => {
  if (!langMenu.hidden && state.menuSide) openMenu(state.menuSide);
});

sourceText.addEventListener("input", () => scheduleTranslate());

clearBtn.addEventListener("click", () => {
  sourceText.value = "";
  requestId += 1;
  clearTranslation();
  if (state.sourceMode === "auto") state.detectedLang = null;
  render();
  sourceText.focus();
});

swapBtn.addEventListener("click", swapLanguages);
copySourceBtn.addEventListener("click", () => copyText(sourceText.value, copySourceBtn));
copyTargetBtn.addEventListener("click", () => copyText(state.translation, copyTargetBtn));

function readApiKey() {
  try {
    return (localStorage.getItem(API_KEY_STORAGE) || "").trim();
  } catch {
    return "";
  }
}

function writeApiKey(key) {
  try {
    if (key) localStorage.setItem(API_KEY_STORAGE, key);
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    /* プライベートモードなどで保存できない場合は、この表示中だけは使えない */
  }
}

function refreshApiKeyButton() {
  const saved = Boolean(readApiKey());
  apiKeyBtn.classList.toggle("is-set", saved);
  apiKeyBtn.textContent = saved ? "APIキー設定済み" : "APIキー";
}

function openApiKeyDialog() {
  closeMenu();
  const saved = readApiKey();
  apiKeyInput.value = saved;
  apiKeyInput.type = "password";
  apiKeyToggle.textContent = "表示";
  apiKeyError.hidden = true;
  apiKeyError.textContent = "";
  apiKeyClear.hidden = !saved;
  apiKeyDialog.hidden = false;
  apiKeyInput.focus();
  apiKeyInput.select();
}

function closeApiKeyDialog() {
  if (apiKeyDialog.hidden) return;
  apiKeyDialog.hidden = true;
  apiKeyBtn.focus();
}

function saveApiKey(key) {
  if (key && !/^[\x21-\x7E]{8,200}$/.test(key)) {
    apiKeyError.hidden = false;
    apiKeyError.textContent = "APIキーの形式を確認してください。";
    apiKeyInput.focus();
    return;
  }
  writeApiKey(key);
  refreshApiKeyButton();
  closeApiKeyDialog();
  showToast(key ? "APIキーを保存しました" : "APIキーを削除しました");
  if (sourceText.value.trim()) scheduleTranslate(0);
}

apiKeyBtn.addEventListener("click", openApiKeyDialog);
apiKeyCancel.addEventListener("click", closeApiKeyDialog);
apiKeyClear.addEventListener("click", () => saveApiKey(""));
apiKeyDialog.addEventListener("click", (event) => {
  if (event.target === apiKeyDialog) closeApiKeyDialog();
});
apiKeyToggle.addEventListener("click", () => {
  const show = apiKeyInput.type === "password";
  apiKeyInput.type = show ? "text" : "password";
  apiKeyToggle.textContent = show ? "隠す" : "表示";
  apiKeyInput.focus();
});
apiKeyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveApiKey(apiKeyInput.value.trim());
});
apiKeyForm.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const focusable = [...apiKeyForm.querySelectorAll("input, button")].filter((element) => !element.hidden);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

refreshApiKeyButton();
render();
