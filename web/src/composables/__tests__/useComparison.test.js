import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ref, computed, nextTick } from "vue";
import { useComparison } from "../useComparison.js";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const mockMessages = {
  selectAtLeastTwo: "Please select at least two finished experiments",
  comparisonHistoryUntitled: "Untitled comparison",
  comparisonHistoryFailed: "Failed to load comparison history",
  comparisonCreating: "Generating comparison report…",
  comparisonSuccess: "Comparison report generated",
  comparisonFailed: "Failed to generate comparison report",
};

function makeDeps(overrides = {}) {
  const selectedJobIds = ref([]);
  return {
    API_BASE: "http://localhost:8000",
    t: computed(() => mockMessages),
    withLang: vi.fn(
      (url) => url + (url.includes("?") ? "&" : "?") + "lang=zh"
    ),
    selectedJobIds,
    buildComparisonTitle: vi.fn(() => "Comparison title"),
    formatComparisonMetric: vi.fn((value) => String(value)),
    formatEventTime: vi.fn((value) => "formatted:" + value),
    comparisonHistoryArtifactUrl: vi.fn(
      (item, key) => item?.artifacts?.[key] || ""
    ),
    ...overrides,
  };
}

function makeHistoryItem(overrides = {}) {
  return {
    comparison_id: "c1",
    title: "Comparison A",
    created_at: "2025-01-15T10:30:00Z",
    job_ids: ["j1", "j2"],
    job_count: 2,
    best_accuracy: 0.95,
    lowest_loss: 0.05,
    lowest_asr: 0.01,
    has_report: true,
    artifacts: {
      comparison_html_url: "http://example.com/comp.html",
      comparison_csv_url: "http://example.com/comp.csv",
      comparison_json_url: "http://example.com/comp.json",
    },
    ...overrides,
  };
}

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

describe("useComparison – initial state", () => {
  it("comparisonStatus is idle", () => {
    const { comparisonStatus } = useComparison(makeDeps());
    expect(comparisonStatus.value).toBe("idle");
  });

  it("comparisonError is empty", () => {
    const { comparisonError } = useComparison(makeDeps());
    expect(comparisonError.value).toBe("");
  });

  it("comparisonUrl is empty", () => {
    const { comparisonUrl } = useComparison(makeDeps());
    expect(comparisonUrl.value).toBe("");
  });

  it("comparisonArtifacts is empty object", () => {
    const { comparisonArtifacts } = useComparison(makeDeps());
    expect(comparisonArtifacts.value).toEqual({});
  });

  it("comparisonInsights is empty object", () => {
    const { comparisonInsights } = useComparison(makeDeps());
    expect(comparisonInsights.value).toEqual({});
  });

  it("comparisonHistory is empty array", () => {
    const { comparisonHistory } = useComparison(makeDeps());
    expect(comparisonHistory.value).toEqual([]);
  });

  it("comparisonHistoryStatus is idle", () => {
    const { comparisonHistoryStatus } = useComparison(makeDeps());
    expect(comparisonHistoryStatus.value).toBe("idle");
  });

  it("comparisonHistoryError is empty", () => {
    const { comparisonHistoryError } = useComparison(makeDeps());
    expect(comparisonHistoryError.value).toBe("");
  });
});

// ---------------------------------------------------------------------------
// resetComparisonResult
// ---------------------------------------------------------------------------

describe("useComparison – resetComparisonResult", () => {
  it("clears all result fields back to initial values", () => {
    const result = useComparison(makeDeps());

    // Set non-default values
    result.comparisonUrl.value = "http://example.com/comp";
    result.comparisonError.value = "some error";
    result.comparisonArtifacts.value = { html: "url" };
    result.comparisonInsights.value = { best: 0.9 };
    result.comparisonStatus.value = "finished";

    result.resetComparisonResult();

    expect(result.comparisonUrl.value).toBe("");
    expect(result.comparisonError.value).toBe("");
    expect(result.comparisonArtifacts.value).toEqual({});
    expect(result.comparisonInsights.value).toEqual({});
    expect(result.comparisonStatus.value).toBe("idle");
  });
});

// ---------------------------------------------------------------------------
// createComparisonReport – < 2 jobs
// ---------------------------------------------------------------------------

describe("useComparison – createComparisonReport with < 2 jobs", () => {
  it("sets error and does not call fetch when 0 jobs selected", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = [];
    const { comparisonError, comparisonStatus, createComparisonReport } =
      useComparison(deps);

    await createComparisonReport();

    expect(comparisonError.value).toBe(mockMessages.selectAtLeastTwo);
    expect(fetchMock).not.toHaveBeenCalled();
    // Status should remain idle (never set to "creating")
    expect(comparisonStatus.value).toBe("idle");
  });

  it("sets error and does not call fetch when 1 job selected", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1"];
    const { comparisonError, createComparisonReport } =
      useComparison(deps);

    await createComparisonReport();

    expect(comparisonError.value).toBe(mockMessages.selectAtLeastTwo);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// createComparisonReport – success
// ---------------------------------------------------------------------------

describe("useComparison – createComparisonReport success", () => {
  it("calls POST to /comparisons with correct body", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock
      // POST create
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            comparison_url: "http://api/c1",
            artifacts: { comparison_html_url: "http://api/c1.html" },
            insights: { best_accuracy: 0.95 },
          }),
      })
      // GET history refresh
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comparisons: [] }),
      });

    const { comparisonStatus, createComparisonReport } =
      useComparison(deps);
    await createComparisonReport();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/comparisons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_ids: ["j1", "j2"],
        title: "Comparison title",
      }),
    });
    expect(deps.buildComparisonTitle).toHaveBeenCalled();
  });

  it("updates url, artifacts, insights, and status on success", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            comparison_url: "http://api/c1",
            artifacts: { comparison_html_url: "http://api/c1.html" },
            insights: { best_accuracy: 0.95 },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comparisons: [] }),
      });

    const {
      comparisonUrl,
      comparisonArtifacts,
      comparisonInsights,
      comparisonStatus,
      createComparisonReport,
    } = useComparison(deps);
    await createComparisonReport();

    expect(comparisonUrl.value).toBe("http://api/c1");
    expect(comparisonArtifacts.value).toEqual({
      comparison_html_url: "http://api/c1.html",
    });
    expect(comparisonInsights.value).toEqual({ best_accuracy: 0.95 });
    expect(comparisonStatus.value).toBe("finished");
  });

  it("refreshes comparison history after success", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            comparison_url: "http://api/c1",
            artifacts: {},
            insights: {},
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comparisons: [] }),
      });

    const { createComparisonReport } = useComparison(deps);
    await createComparisonReport();
    // Allow the fire-and-forget history refresh to complete
    await nextTick();

    // Second fetch call is the history GET
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const historyCall = fetchMock.mock.calls[1][0];
    expect(historyCall).toContain("/comparisons?");
  });

  it("sets status to creating before fetch", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    let statusDuringFetch;
    fetchMock.mockImplementation(async () => {
      // Capture status while fetch is in-flight
      const { comparisonStatus } = useComparison(deps);
      // We need to read from the SAME instance, so use the one from the outer scope
      return {
        ok: true,
        json: () =>
          Promise.resolve({
            comparison_url: "http://api/c1",
            artifacts: {},
            insights: {},
          }),
      };
    });

    const { comparisonStatus, createComparisonReport } = useComparison(deps);

    // Intercept after status is set to "creating" but before fetch resolves
    const fetchPromise = createComparisonReport();
    expect(comparisonStatus.value).toBe("creating");
    await fetchPromise;
  });
});

// ---------------------------------------------------------------------------
// createComparisonReport – HTTP failure
// ---------------------------------------------------------------------------

describe("useComparison – createComparisonReport HTTP failure", () => {
  it("sets comparisonError and status to error on non-ok response", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: "Server error" }),
    });

    const { comparisonError, comparisonStatus, createComparisonReport } =
      useComparison(deps);
    await createComparisonReport();

    expect(comparisonError.value).toBe("Server error");
    expect(comparisonStatus.value).toBe("error");
  });

  it("uses default message when detail is missing", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const { comparisonError, createComparisonReport } = useComparison(deps);
    await createComparisonReport();

    expect(comparisonError.value).toBe("Failed to create comparison report");
  });
});

// ---------------------------------------------------------------------------
// createComparisonReport – network error
// ---------------------------------------------------------------------------

describe("useComparison – createComparisonReport network error", () => {
  it("sets comparisonError and status on network failure", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock.mockRejectedValue(new Error("Network fail"));

    const { comparisonError, comparisonStatus, createComparisonReport } =
      useComparison(deps);
    await createComparisonReport();

    expect(comparisonError.value).toBe("Network fail");
    expect(comparisonStatus.value).toBe("error");
  });

  it("does not throw", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock.mockRejectedValue(new Error("fail"));

    const { createComparisonReport } = useComparison(deps);
    await expect(createComparisonReport()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// comparisonArtifactUrl
// ---------------------------------------------------------------------------

describe("useComparison – comparisonArtifactUrl", () => {
  it("returns artifact URL when present in artifacts", () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            comparison_url: "http://api/c1",
            artifacts: { comparison_html_url: "http://api/c1.html" },
            insights: {},
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comparisons: [] }),
      });

    const { comparisonArtifactUrl, createComparisonReport } =
      useComparison(deps);

    // Before any report: no artifacts, no url
    expect(comparisonArtifactUrl("comparison_html_url")).toBe("");
  });

  it("returns direct artifact URL after report creation", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            comparison_url: "http://api/c1",
            artifacts: { comparison_html_url: "http://direct.html" },
            insights: {},
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comparisons: [] }),
      });

    const { comparisonArtifactUrl, createComparisonReport } =
      useComparison(deps);
    await createComparisonReport();

    expect(comparisonArtifactUrl("comparison_html_url")).toBe(
      "http://direct.html"
    );
  });

  it("falls back to comparisonUrl-based fallback for csv", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            comparison_url: "http://api/c1",
            artifacts: {},
            insights: {},
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comparisons: [] }),
      });

    const { comparisonArtifactUrl, createComparisonReport } =
      useComparison(deps);
    await createComparisonReport();

    expect(comparisonArtifactUrl("comparison_csv_url")).toBe(
      "http://api/c1/comparison.csv"
    );
  });

  it("falls back to comparisonUrl for html", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            comparison_url: "http://api/c1",
            artifacts: {},
            insights: {},
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comparisons: [] }),
      });

    const { comparisonArtifactUrl, createComparisonReport } =
      useComparison(deps);
    await createComparisonReport();

    expect(comparisonArtifactUrl("comparison_html_url")).toBe(
      "http://api/c1"
    );
  });

  it("falls back to comparisonUrl for json", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            comparison_url: "http://api/c1",
            artifacts: {},
            insights: {},
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comparisons: [] }),
      });

    const { comparisonArtifactUrl, createComparisonReport } =
      useComparison(deps);
    await createComparisonReport();

    expect(comparisonArtifactUrl("comparison_json_url")).toBe(
      "http://api/c1/comparison.json"
    );
  });

  it("returns empty string for unknown key with url set", async () => {
    const deps = makeDeps();
    deps.selectedJobIds.value = ["j1", "j2"];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            comparison_url: "http://api/c1",
            artifacts: {},
            insights: {},
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comparisons: [] }),
      });

    const { comparisonArtifactUrl, createComparisonReport } =
      useComparison(deps);
    await createComparisonReport();

    expect(comparisonArtifactUrl("unknown_key")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// loadComparisonHistory – success
// ---------------------------------------------------------------------------

describe("useComparison – loadComparisonHistory success", () => {
  it("fetches history with correct params", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ comparisons: [] }),
    });

    const { loadComparisonHistory } = useComparison(deps);
    await loadComparisonHistory();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("/comparisons?");
    expect(url).toContain("limit=10");
    expect(url).toContain("sort=created_at_desc");
  });

  it("populates history from response", async () => {
    const deps = makeDeps();
    const item = makeHistoryItem();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ comparisons: [item] }),
    });

    const { comparisonHistory, loadComparisonHistory } = useComparison(deps);
    await loadComparisonHistory();

    expect(comparisonHistory.value).toHaveLength(1);
    // mapComparisonHistoryItem is applied
    expect(comparisonHistory.value[0].comparison_id).toBe("c1");
    expect(comparisonHistory.value[0].title).toBe("Comparison A");
  });

  it("sets history status to idle on success", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ comparisons: [] }),
    });

    const { comparisonHistoryStatus, loadComparisonHistory } =
      useComparison(deps);
    await loadComparisonHistory();

    expect(comparisonHistoryStatus.value).toBe("idle");
  });
});

// ---------------------------------------------------------------------------
// loadComparisonHistory – failure
// ---------------------------------------------------------------------------

describe("useComparison – loadComparisonHistory failure", () => {
  it("sets history error on HTTP failure", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: "Server error" }),
    });

    const { comparisonHistoryError, comparisonHistoryStatus, loadComparisonHistory } =
      useComparison(deps);

    await expect(loadComparisonHistory()).rejects.toThrow();
    expect(comparisonHistoryError.value).toBe("Server error");
    expect(comparisonHistoryStatus.value).toBe("error");
  });

  it("sets history error on network failure", async () => {
    const deps = makeDeps();
    fetchMock.mockRejectedValue(new Error("Network fail"));

    const { comparisonHistoryError, comparisonHistoryStatus, loadComparisonHistory } =
      useComparison(deps);

    await expect(loadComparisonHistory()).rejects.toThrow("Network fail");
    expect(comparisonHistoryError.value).toBe("Network fail");
    expect(comparisonHistoryStatus.value).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// mapComparisonHistoryItem
// ---------------------------------------------------------------------------

describe("useComparison – mapComparisonHistoryItem", () => {
  it("maps all fields from a complete item", () => {
    const deps = makeDeps();
    const item = makeHistoryItem();
    const { mapComparisonHistoryItem } = useComparison(deps);
    const mapped = mapComparisonHistoryItem(item);

    expect(mapped.comparison_id).toBe("c1");
    expect(mapped.title).toBe("Comparison A");
    expect(mapped.created_at).toBe("2025-01-15T10:30:00Z");
    expect(mapped.job_ids).toEqual(["j1", "j2"]);
    expect(mapped.job_count).toBe(2);
    expect(mapped.best_accuracy).toBe("0.95");
    expect(mapped.lowest_loss).toBe("0.05");
    expect(mapped.lowest_asr).toBe("0.01");
    expect(mapped.has_report).toBe(true);
    expect(deps.formatComparisonMetric).toHaveBeenCalled();
  });

  it("falls back to defaults for missing fields", () => {
    const deps = makeDeps();
    const { mapComparisonHistoryItem } = useComparison(deps);
    const mapped = mapComparisonHistoryItem({});

    expect(mapped.comparison_id).toBe("");
    expect(mapped.title).toBe("Untitled comparison");
    expect(mapped.created_at).toBe("");
    expect(mapped.job_ids).toEqual([]);
    expect(mapped.job_count).toBe(0);
    expect(mapped.has_report).toBe(true); // !== false → true
  });

  it("has_report false is preserved", () => {
    const deps = makeDeps();
    const { mapComparisonHistoryItem } = useComparison(deps);
    const mapped = mapComparisonHistoryItem({ has_report: false });
    expect(mapped.has_report).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// comparisonHistoryItemsForDisplay
// ---------------------------------------------------------------------------

describe("useComparison – comparisonHistoryItemsForDisplay", () => {
  it("maps history items with formatters", async () => {
    const deps = makeDeps();
    const item = makeHistoryItem();

    // Make comparisonHistoryArtifactUrl return real URLs
    deps.comparisonHistoryArtifactUrl.mockImplementation((itm, key) => {
      return itm?.artifacts?.[key] || "";
    });

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ comparisons: [item] }),
    });

    const { comparisonHistoryItemsForDisplay, loadComparisonHistory } =
      useComparison(deps);
    await loadComparisonHistory();

    const display = comparisonHistoryItemsForDisplay.value;
    expect(display).toHaveLength(1);

    const d = display[0];
    expect(d.comparison_id).toBe("c1");
    expect(d.title).toBe("Comparison A");
    expect(d.createdAtLabel).toBe("formatted:2025-01-15T10:30:00Z");
    expect(d.job_count).toBe(2);
    expect(d.best_accuracy).toBe("0.95");
    expect(d.lowest_loss).toBe("0.05");
    expect(d.lowest_asr).toBe("0.01");
    // htmlUrl gets withLang applied
    expect(d.htmlUrl).toBe("http://example.com/comp.html?lang=zh");
    // csvUrl does NOT get withLang (per source code)
    expect(d.csvUrl).toBe("http://example.com/comp.csv");
    expect(d.jsonUrl).toBe("http://example.com/comp.json");
  });

  it("is empty when history is empty", () => {
    const deps = makeDeps();
    const { comparisonHistoryItemsForDisplay } = useComparison(deps);
    expect(comparisonHistoryItemsForDisplay.value).toEqual([]);
  });

  it("htmlUrl is empty when artifact url is empty", async () => {
    const deps = makeDeps();
    deps.comparisonHistoryArtifactUrl.mockReturnValue("");

    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          comparisons: [makeHistoryItem({ artifacts: {} })],
        }),
    });

    const { comparisonHistoryItemsForDisplay, loadComparisonHistory } =
      useComparison(deps);
    await loadComparisonHistory();

    expect(comparisonHistoryItemsForDisplay.value[0].htmlUrl).toBe("");
  });
});
