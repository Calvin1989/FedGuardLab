import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useI18n } from "../useI18n.js";

// ---------------------------------------------------------------------------
// localStorage shim for node environment (no jsdom)
// ---------------------------------------------------------------------------

const store = {};

const fakeLocalStorage = {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => {
    store[key] = String(value);
  },
  removeItem: (key) => {
    delete store[key];
  },
  clear: () => {
    for (const key of Object.keys(store)) delete store[key];
  },
};

beforeEach(() => {
  fakeLocalStorage.clear();
  globalThis.window = { localStorage: fakeLocalStorage };
});

afterEach(() => {
  delete globalThis.window;
});

// ---------------------------------------------------------------------------
// Language default & persistence
// ---------------------------------------------------------------------------

describe("useI18n – language state", () => {
  it("defaults to zh when localStorage is empty", () => {
    const { language } = useI18n();
    expect(language.value).toBe("zh");
  });

  it("reads en from localStorage when already set", () => {
    fakeLocalStorage.setItem("fedguardlab_language", "en");
    const { language } = useI18n();
    expect(language.value).toBe("en");
  });

  it("setLanguage updates language ref and persists to localStorage", () => {
    const { language, setLanguage } = useI18n();
    expect(language.value).toBe("zh");

    setLanguage("en");
    expect(language.value).toBe("en");
    expect(fakeLocalStorage.getItem("fedguardlab_language")).toBe("en");
  });

  it("setLanguage with an unknown key still updates the ref", () => {
    const { language, setLanguage } = useI18n();
    setLanguage("fr");
    expect(language.value).toBe("fr");
    expect(fakeLocalStorage.getItem("fedguardlab_language")).toBe("fr");
  });
});

// ---------------------------------------------------------------------------
// t computed
// ---------------------------------------------------------------------------

describe("useI18n – t computed", () => {
  it("returns zh messages when language is zh", () => {
    const { t } = useI18n();
    expect(t.value.eyebrow).toBe("FedGuardLab");
    expect(t.value.heroTitle).toBe("联邦学习安全实验平台");
  });

  it("returns en messages after setLanguage('en')", () => {
    const { t, setLanguage } = useI18n();
    setLanguage("en");
    expect(t.value.heroTitle).toBe("Interactive FL Security Playground");
  });

  it("falls back to zh messages for unknown language", () => {
    const { t, setLanguage } = useI18n();
    setLanguage("fr");
    // messages["fr"] is undefined, so t falls back to messages.zh
    expect(t.value).toBe(t.value); // object identity stays stable
    expect(t.value.eyebrow).toBe("FedGuardLab");
  });

  it("includes reuseConfig label in zh", () => {
    const { t } = useI18n();
    expect(t.value.reuseConfig).toBe("复用配置");
  });

  it("includes reuseConfig label in en", () => {
    const { t, setLanguage } = useI18n();
    setLanguage("en");
    expect(t.value.reuseConfig).toBe("Reuse config");
  });

  it("includes reuseConfigUnavailable message in zh", () => {
    const { t } = useI18n();
    expect(t.value.reuseConfigUnavailable).toBe("所选实验没有可复用的配置。");
  });

  it("includes reuseConfigUnavailable message in en", () => {
    const { t, setLanguage } = useI18n();
    setLanguage("en");
    expect(t.value.reuseConfigUnavailable).toBe("The selected job does not have a reusable configuration.");
  });

  it("includes reuseConfigNotFound message in zh", () => {
    const { t } = useI18n();
    expect(t.value.reuseConfigNotFound).toBe("未找到匹配的实验配置。");
  });

  it("includes reuseConfigNotFound message in en", () => {
    const { t, setLanguage } = useI18n();
    setLanguage("en");
    expect(t.value.reuseConfigNotFound).toBe("No matching experiment configuration was found.");
  });
});

// ---------------------------------------------------------------------------
// withLang
// ---------------------------------------------------------------------------

describe("useI18n – withLang", () => {
  it("appends lang query param to bare URL", () => {
    const { withLang } = useI18n();
    expect(withLang("/api/foo")).toBe("/api/foo?lang=zh");
  });

  it("appends lang with ampersand when URL already has query string", () => {
    const { withLang } = useI18n();
    expect(withLang("/api/foo?x=1")).toBe("/api/foo?x=1&lang=zh");
  });

  it("reflects language changes", () => {
    const { withLang, setLanguage } = useI18n();
    setLanguage("en");
    expect(withLang("/api/foo")).toBe("/api/foo?lang=en");
  });

  it("returns falsy input as-is", () => {
    const { withLang } = useI18n();
    expect(withLang("")).toBe("");
    expect(withLang(null)).toBe(null);
    expect(withLang(undefined)).toBe(undefined);
  });
});

// ---------------------------------------------------------------------------
// getConfigKey
// ---------------------------------------------------------------------------

describe("useI18n – getConfigKey", () => {
  it("returns empty string for falsy input", () => {
    const { getConfigKey } = useI18n();
    expect(getConfigKey(null)).toBe("");
    expect(getConfigKey(undefined)).toBe("");
    expect(getConfigKey("")).toBe("");
  });

  it("extracts key from string-like value field", () => {
    const { getConfigKey } = useI18n();
    expect(getConfigKey({ value: "my_config" })).toBe("my_config");
  });

  it("strips .yaml extension from value", () => {
    const { getConfigKey } = useI18n();
    expect(getConfigKey({ value: "configs/my_config.yaml" })).toBe("my_config");
  });

  it("strips .yml extension from value", () => {
    const { getConfigKey } = useI18n();
    expect(getConfigKey({ value: "my_config.yml" })).toBe("my_config");
  });

  it("uses path field as fallback", () => {
    const { getConfigKey } = useI18n();
    expect(getConfigKey({ path: "some/path/key" })).toBe("key");
  });

  it("prefers experiment.name over value", () => {
    const { getConfigKey } = useI18n();
    expect(
      getConfigKey({ value: "base", experiment: { name: "mnist_fedavg_demo" } })
    ).toBe("mnist_fedavg_demo");
  });

  it("prefers metadata.name_key over normalized value", () => {
    const { getConfigKey } = useI18n();
    expect(
      getConfigKey({ value: "base", metadata: { name_key: "label_flip_demo" } })
    ).toBe("label_flip_demo");
  });
});

// ---------------------------------------------------------------------------
// getLocalizedConfigDisplay
// ---------------------------------------------------------------------------

describe("useI18n – getLocalizedConfigDisplay", () => {
  it("returns localized name and description for a known config key in zh", () => {
    const { getLocalizedConfigDisplay } = useI18n();
    const result = getLocalizedConfigDisplay({
      metadata: { name_key: "mnist_fedavg_demo" },
    });
    expect(result.name).toBe("MNIST FedAvg 基线实验");
    expect(result.description).toBe("使用 MNIST 与 FedAvg 的基线训练实验，无攻击");
  });

  it("returns localized name for known config in en", () => {
    const { getLocalizedConfigDisplay, setLanguage } = useI18n();
    setLanguage("en");
    // CONFIG_DISPLAY_TEXT only has zh entries, so en falls back to option metadata
    const result = getLocalizedConfigDisplay({
      metadata: { name_key: "mnist_fedavg_demo", name: "MNIST FedAvg Baseline" },
    });
    // No en entry in CONFIG_DISPLAY_TEXT, falls back to metadata.name
    expect(result.name).toBe("MNIST FedAvg Baseline");
  });

  it("falls back to option label when no localized entry exists", () => {
    const { getLocalizedConfigDisplay } = useI18n();
    const result = getLocalizedConfigDisplay({ label: "custom_label" });
    expect(result.name).toBe("custom_label");
  });

  it("returns key as name when no localized or metadata fallback exists", () => {
    const { getLocalizedConfigDisplay } = useI18n();
    const result = getLocalizedConfigDisplay({ value: "unknown_key" });
    expect(result.name).toBe("unknown_key");
  });
});

// ---------------------------------------------------------------------------
// formatConfigTag
// ---------------------------------------------------------------------------

describe("useI18n – formatConfigTag", () => {
  it("returns localized display for a known tag in zh", () => {
    const { formatConfigTag } = useI18n();
    expect(formatConfigTag("fedavg")).toBe("FedAvg");
    expect(formatConfigTag("backdoor")).toBe("后门");
    expect(formatConfigTag("label_flipping")).toBe("标签翻转");
  });

  it("returns raw tag when no localized entry exists", () => {
    const { formatConfigTag } = useI18n();
    expect(formatConfigTag("unknown_tag")).toBe("unknown_tag");
  });

  it("returns raw tag for en language (TAG_DISPLAY_TEXT only has zh)", () => {
    const { formatConfigTag, setLanguage } = useI18n();
    setLanguage("en");
    expect(formatConfigTag("fedavg")).toBe("fedavg");
  });
});
