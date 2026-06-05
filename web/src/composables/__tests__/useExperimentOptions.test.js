import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ref, computed, nextTick } from "vue";
import { useExperimentOptions } from "../useExperimentOptions.js";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockMessages() {
  return {
    noConfigsForCategory: "当前分类没有可用配置",
    configPreview: "配置预览",
  };
}

function makeDeps(overrides = {}) {
  const errorMessage = ref("");
  const t = computed(() => mockMessages());

  return {
    API_BASE: "http://localhost:8000",
    errorMessage,
    t,
    getLocalizedConfigDisplay: vi.fn((option) => ({
      name: option?.metadata?.name || option?.label || option?.value || "",
      description: option?.metadata?.description || option?.description || "",
    })),
    formatConfigTag: vi.fn((tag) => `tag:${tag}`),
    formatAttackDisplay: vi.fn((_attack, fallback) => `attack:${fallback ?? ""}`),
    formatDefenseDisplay: vi.fn((_defense, fallback) => `defense:${fallback ?? ""}`),
    ...overrides,
  };
}

function makeOption(overrides = {}) {
  return {
    value: "mnist_fedavg_demo",
    label: "MNIST FedAvg Demo",
    valid: true,
    metadata: {
      name: "MNIST FedAvg Demo",
      description: "Baseline MNIST experiment",
      category: "baseline",
      tags: ["fedavg", "mnist"],
    },
    preview: {
      dataset: "MNIST",
      partition: "iid",
      aggregation: "FedAvg",
      attack: { type: "none" },
      defense: { type: "none" },
      rounds: 5,
      clients: 4,
    },
    attack: { type: "none" },
    defense: { type: "none" },
    ...overrides,
  };
}

const API_URL = "http://localhost:8000/configs";

// ---------------------------------------------------------------------------
// fetch mock setup
// ---------------------------------------------------------------------------

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.fetch;
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("useExperimentOptions – initial state", () => {
  it("selectedConfig is empty string", () => {
    const { selectedConfig } = useExperimentOptions(makeDeps());
    expect(selectedConfig.value).toBe("");
  });

  it("experimentOptions is empty array", () => {
    const { experimentOptions } = useExperimentOptions(makeDeps());
    expect(experimentOptions.value).toEqual([]);
  });

  it("selectedCategory defaults to 'all'", () => {
    const { selectedCategory } = useExperimentOptions(makeDeps());
    expect(selectedCategory.value).toBe("all");
  });

  it("selectedConfigOption is undefined when no config selected", () => {
    const { selectedConfigOption } = useExperimentOptions(makeDeps());
    expect(selectedConfigOption.value).toBeUndefined();
  });

  it("selectedConfigPreview is null when no config selected", () => {
    const { selectedConfigPreview } = useExperimentOptions(makeDeps());
    expect(selectedConfigPreview.value).toBeNull();
  });

  it("displayConfigPreview is null when no config selected", () => {
    const { displayConfigPreview } = useExperimentOptions(makeDeps());
    expect(displayConfigPreview.value).toBeNull();
  });

  it("selectedConfigMetadata is null when no config selected", () => {
    const { selectedConfigMetadata } = useExperimentOptions(makeDeps());
    expect(selectedConfigMetadata.value).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// loadExperimentOptions – success
// ---------------------------------------------------------------------------

describe("useExperimentOptions – loadExperimentOptions success", () => {
  it("populates experimentOptions from API response, filtering valid items", async () => {
    const opt1 = makeOption({ value: "cfg1" });
    const opt2 = makeOption({ value: "cfg2" });
    const invalid = makeOption({ value: "cfg_invalid", valid: false });

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt1, invalid, opt2] }),
    });

    const { experimentOptions, loadExperimentOptions } = useExperimentOptions(makeDeps());
    await loadExperimentOptions();

    expect(experimentOptions.value).toHaveLength(2);
    expect(experimentOptions.value[0].value).toBe("cfg1");
    expect(experimentOptions.value[1].value).toBe("cfg2");
  });

  it("calls fetch with correct URL", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [] }),
    });

    const { loadExperimentOptions } = useExperimentOptions(makeDeps());
    await loadExperimentOptions();

    expect(fetchMock).toHaveBeenCalledWith(API_URL);
  });
});

// ---------------------------------------------------------------------------
// loadExperimentOptions – auto-select first config
// ---------------------------------------------------------------------------

describe("useExperimentOptions – auto-select", () => {
  it("selects first config when selectedConfig is empty", async () => {
    const opt = makeOption({ value: "first_config" });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const { selectedConfig, loadExperimentOptions } = useExperimentOptions(makeDeps());
    expect(selectedConfig.value).toBe("");
    await loadExperimentOptions();
    expect(selectedConfig.value).toBe("first_config");
  });

  it("keeps existing selectedConfig when it exists in results", async () => {
    const optA = makeOption({ value: "cfg_a" });
    const optB = makeOption({ value: "cfg_b" });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [optA, optB] }),
    });

    const deps = makeDeps();
    const { selectedConfig, loadExperimentOptions } = useExperimentOptions(deps);
    selectedConfig.value = "cfg_b";
    await loadExperimentOptions();
    expect(selectedConfig.value).toBe("cfg_b");
  });

  it("does not change selectedConfig when it does not match any result", async () => {
    const opt = makeOption({ value: "cfg_new" });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const { selectedConfig, loadExperimentOptions } = useExperimentOptions(makeDeps());
    selectedConfig.value = "cfg_old";
    await loadExperimentOptions();
    // loadExperimentOptions only auto-selects when selectedConfig is falsy
    expect(selectedConfig.value).toBe("cfg_old");
  });
});

// ---------------------------------------------------------------------------
// loadExperimentOptions – API failure
// ---------------------------------------------------------------------------

describe("useExperimentOptions – loadExperimentOptions failure", () => {
  it("sets errorMessage on HTTP error", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: "Server error" }),
    });

    const deps = makeDeps();
    const { loadExperimentOptions } = useExperimentOptions(deps);
    await loadExperimentOptions();
    expect(deps.errorMessage.value).toBe("Server error");
  });

  it("sets errorMessage on network error", async () => {
    fetchMock.mockRejectedValue(new Error("Network fail"));

    const deps = makeDeps();
    const { loadExperimentOptions } = useExperimentOptions(deps);
    await loadExperimentOptions();
    expect(deps.errorMessage.value).toBe("Network fail");
  });

  it("does not throw on API failure", async () => {
    fetchMock.mockRejectedValue(new Error("fail"));

    const deps = makeDeps();
    const { loadExperimentOptions } = useExperimentOptions(deps);
    await expect(loadExperimentOptions()).resolves.toBeUndefined();
  });

  it("uses default message when response has no detail", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const deps = makeDeps();
    const { loadExperimentOptions } = useExperimentOptions(deps);
    await loadExperimentOptions();
    expect(deps.errorMessage.value).toBe("Failed to load configs");
  });
});

// ---------------------------------------------------------------------------
// selectedConfigOption
// ---------------------------------------------------------------------------

describe("useExperimentOptions – selectedConfigOption", () => {
  it("returns matching config object after load", async () => {
    const opt = makeOption({ value: "target_cfg" });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const { selectedConfigOption, loadExperimentOptions } = useExperimentOptions(makeDeps());
    await loadExperimentOptions();
    expect(selectedConfigOption.value.value).toBe("target_cfg");
  });

  it("is undefined when selectedConfig has no match", () => {
    const { selectedConfig, selectedConfigOption } = useExperimentOptions(makeDeps());
    selectedConfig.value = "nonexistent";
    expect(selectedConfigOption.value).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// selectedExperimentDescription
// ---------------------------------------------------------------------------

describe("useExperimentOptions – selectedExperimentDescription", () => {
  it("returns description from getLocalizedConfigDisplay", async () => {
    const opt = makeOption({
      value: "cfg1",
      metadata: { name: "Test", description: "Test desc", category: "baseline", tags: [] },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const deps = makeDeps();
    const { selectedExperimentDescription, loadExperimentOptions } =
      useExperimentOptions(deps);
    await loadExperimentOptions();
    expect(selectedExperimentDescription.value).toBe("Test desc");
    expect(deps.getLocalizedConfigDisplay).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// configCategories
// ---------------------------------------------------------------------------

describe("useExperimentOptions – configCategories", () => {
  it("returns sorted unique categories from options", async () => {
    const optA = makeOption({ value: "a", metadata: { ...makeOption().metadata, category: "attack" } });
    const optB = makeOption({ value: "b", metadata: { ...makeOption().metadata, category: "baseline" } });
    const optC = makeOption({ value: "c", metadata: { ...makeOption().metadata, category: "attack" } });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [optA, optB, optC] }),
    });

    const { configCategories, loadExperimentOptions } = useExperimentOptions(makeDeps());
    await loadExperimentOptions();
    expect(configCategories.value).toEqual(["attack", "baseline"]);
  });

  it("defaults to 'uncategorized' when metadata.category is missing", async () => {
    const opt = makeOption({ value: "a" });
    delete opt.metadata.category;
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const { configCategories, loadExperimentOptions } = useExperimentOptions(makeDeps());
    await loadExperimentOptions();
    expect(configCategories.value).toEqual(["uncategorized"]);
  });
});

// ---------------------------------------------------------------------------
// filteredExperimentOptions
// ---------------------------------------------------------------------------

describe("useExperimentOptions – filteredExperimentOptions", () => {
  async function setupFiltered() {
    const optA = makeOption({ value: "a", metadata: { ...makeOption().metadata, category: "attack" } });
    const optB = makeOption({ value: "b", metadata: { ...makeOption().metadata, category: "baseline" } });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [optA, optB] }),
    });

    const deps = makeDeps();
    const result = useExperimentOptions(deps);
    await result.loadExperimentOptions();
    return result;
  }

  it("returns all options when selectedCategory is 'all'", async () => {
    const { filteredExperimentOptions, selectedCategory } = await setupFiltered();
    expect(selectedCategory.value).toBe("all");
    expect(filteredExperimentOptions.value).toHaveLength(2);
  });

  it("filters by selectedCategory", async () => {
    const { filteredExperimentOptions, selectedCategory } = await setupFiltered();
    selectedCategory.value = "attack";
    expect(filteredExperimentOptions.value).toHaveLength(1);
    expect(filteredExperimentOptions.value[0].value).toBe("a");
  });

  it("returns empty when category has no matches", async () => {
    const { filteredExperimentOptions, selectedCategory } = await setupFiltered();
    selectedCategory.value = "nonexistent";
    expect(filteredExperimentOptions.value).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// selectedConfigMetadata
// ---------------------------------------------------------------------------

describe("useExperimentOptions – selectedConfigMetadata", () => {
  it("returns formatted metadata after config is selected", async () => {
    const opt = makeOption({
      value: "cfg1",
      metadata: {
        name: "Config One",
        description: "Desc",
        category: "baseline",
        tags: ["fedavg", "mnist"],
      },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const deps = makeDeps();
    const { selectedConfigMetadata, loadExperimentOptions } =
      useExperimentOptions(deps);
    await loadExperimentOptions();

    const meta = selectedConfigMetadata.value;
    expect(meta.name).toBe("Config One");
    expect(meta.description).toBe("Desc");
    expect(meta.category).toBe("baseline");
    expect(meta.tags).toEqual(["tag:fedavg", "tag:mnist"]);
    expect(deps.formatConfigTag).toHaveBeenCalledTimes(2);
  });

  it("returns null when selected option has no metadata", async () => {
    const opt = makeOption({ value: "cfg1" });
    delete opt.metadata;
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const { selectedConfigMetadata, loadExperimentOptions } =
      useExperimentOptions(makeDeps());
    await loadExperimentOptions();
    expect(selectedConfigMetadata.value).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// displayConfigPreview
// ---------------------------------------------------------------------------

describe("useExperimentOptions – displayConfigPreview", () => {
  it("formats attack and defense via injected helpers", async () => {
    const opt = makeOption({
      value: "cfg1",
      preview: {
        dataset: "MNIST",
        attack: { type: "label_flipping", source_label: 3, target_label: 7 },
        defense: { type: "krum" },
      },
      attack: { type: "label_flipping" },
      defense: { type: "krum" },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const deps = makeDeps();
    const { displayConfigPreview, loadExperimentOptions } =
      useExperimentOptions(deps);
    await loadExperimentOptions();

    const dp = displayConfigPreview.value;
    expect(dp).not.toBeNull();
    expect(dp.dataset).toBe("MNIST");
    expect(dp.attack).toBe("attack:[object Object]");
    expect(dp.defense).toBe("defense:[object Object]");
    // Verify formatAttackDisplay called with attack config and preview attack
    expect(deps.formatAttackDisplay).toHaveBeenCalledWith(
      { type: "label_flipping" },
      { type: "label_flipping", source_label: 3, target_label: 7 }
    );
    expect(deps.formatDefenseDisplay).toHaveBeenCalledWith(
      { type: "krum" },
      { type: "krum" }
    );
  });

  it("returns null when selected option has no preview", async () => {
    const opt = makeOption({ value: "cfg1" });
    delete opt.preview;
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const { displayConfigPreview, loadExperimentOptions } =
      useExperimentOptions(makeDeps());
    await loadExperimentOptions();
    expect(displayConfigPreview.value).toBeNull();
  });

  it("passes undefined attack/defense when option has none", async () => {
    const opt = makeOption({
      value: "cfg1",
      preview: { dataset: "MNIST", attack: "raw_attack", defense: "raw_defense" },
    });
    delete opt.attack;
    delete opt.defense;
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const deps = makeDeps();
    const { displayConfigPreview, loadExperimentOptions } =
      useExperimentOptions(deps);
    await loadExperimentOptions();

    // Must read .value to trigger lazy computed evaluation
    const dp = displayConfigPreview.value;
    expect(dp).not.toBeNull();
    expect(deps.formatAttackDisplay).toHaveBeenCalledWith(undefined, "raw_attack");
    expect(deps.formatDefenseDisplay).toHaveBeenCalledWith(undefined, "raw_defense");
  });
});

// ---------------------------------------------------------------------------
// getSelectedExperimentLabel
// ---------------------------------------------------------------------------

describe("useExperimentOptions – getSelectedExperimentLabel", () => {
  it("returns localized name when config exists", async () => {
    const opt = makeOption({
      value: "cfg1",
      metadata: { name: "My Config", description: "", category: "baseline", tags: [] },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ configs: [opt] }),
    });

    const deps = makeDeps();
    const { getSelectedExperimentLabel, loadExperimentOptions } =
      useExperimentOptions(deps);
    await loadExperimentOptions();
    expect(getSelectedExperimentLabel()).toBe("My Config");
  });

  it("returns raw selectedConfig value when no matching option", () => {
    const { selectedConfig, getSelectedExperimentLabel } =
      useExperimentOptions(makeDeps());
    selectedConfig.value = "orphan_cfg";
    expect(getSelectedExperimentLabel()).toBe("orphan_cfg");
  });
});
