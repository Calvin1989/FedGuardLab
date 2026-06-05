import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { computed } from "vue";
import { useReportsCleanup } from "../useReportsCleanup.js";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const mockMessages = {
  reportsCleanupFailed: "Failed to load cleanup summary",
  reportsCleanupRunFailed: "Failed to run cleanup",
  reportsCleanupConfirm: "Are you sure?",
};

function makeDeps(overrides = {}) {
  return {
    API_BASE: "http://localhost:8000",
    t: computed(() => mockMessages),
    formatStorageBytes: vi.fn((bytes) => `${bytes} B`),
    formatEventTime: vi.fn((value) => `formatted:${value}`),
    loadRecentJobs: vi.fn().mockResolvedValue(undefined),
    loadComparisonHistory: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeSummaryResponse(overrides = {}) {
  return {
    dry_run: true,
    deletes_files: false,
    reports_root: "/reports",
    keep_latest_per_kind: 20,
    total_size_bytes: 1024,
    jobs: {
      total_count: 10,
      oldest_modified_at: "2025-01-01T00:00:00Z",
      latest_modified_at: "2025-06-01T12:00:00Z",
    },
    comparisons: {
      total_count: 5,
      oldest_modified_at: "2025-02-01T00:00:00Z",
      latest_modified_at: "2025-05-01T12:00:00Z",
    },
    cleanup_preview: {
      candidate_count: 3,
      candidate_size_bytes: 512,
      candidates: [
        {
          kind: "job",
          file_path: "/reports/job1.html",
          size_bytes: 200,
          modified_at: "2025-03-01T00:00:00Z",
        },
        {
          kind: "job",
          file_path: "/reports/job2.html",
          size_bytes: 200,
          modified_at: "2025-03-02T00:00:00Z",
        },
        {
          kind: "comparison",
          file_path: "/reports/comp1.html",
          size_bytes: 112,
          modified_at: "2025-03-03T00:00:00Z",
        },
      ],
    },
    ...overrides,
  };
}

function makeRunResponse(overrides = {}) {
  return {
    dry_run: true,
    deletes_files: false,
    candidate_count: 3,
    deleted_count: 0,
    deleted_size_bytes: 0,
    skipped: [],
    errors: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// fetch / window.confirm mock setup
// ---------------------------------------------------------------------------

let fetchMock;
let originalConfirm;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock;
  originalConfirm = globalThis.window?.confirm;
  globalThis.window = globalThis.window || {};
  globalThis.window.confirm = vi.fn(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.fetch;
  if (originalConfirm !== undefined) {
    globalThis.window.confirm = originalConfirm;
  } else {
    delete globalThis.window.confirm;
  }
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("useReportsCleanup – initial state", () => {
  it("reportsCleanupSummary is null", () => {
    const { reportsCleanupSummary } = useReportsCleanup(makeDeps());
    expect(reportsCleanupSummary.value).toBeNull();
  });

  it("reportsCleanupStatus is idle", () => {
    const { reportsCleanupStatus } = useReportsCleanup(makeDeps());
    expect(reportsCleanupStatus.value).toBe("idle");
  });

  it("reportsCleanupError is empty", () => {
    const { reportsCleanupError } = useReportsCleanup(makeDeps());
    expect(reportsCleanupError.value).toBe("");
  });

  it("reportsCleanupRunStatus is idle", () => {
    const { reportsCleanupRunStatus } = useReportsCleanup(makeDeps());
    expect(reportsCleanupRunStatus.value).toBe("idle");
  });

  it("reportsCleanupRunMode is empty", () => {
    const { reportsCleanupRunMode } = useReportsCleanup(makeDeps());
    expect(reportsCleanupRunMode.value).toBe("");
  });

  it("reportsCleanupRunError is empty", () => {
    const { reportsCleanupRunError } = useReportsCleanup(makeDeps());
    expect(reportsCleanupRunError.value).toBe("");
  });

  it("reportsCleanupRunResult is null", () => {
    const { reportsCleanupRunResult } = useReportsCleanup(makeDeps());
    expect(reportsCleanupRunResult.value).toBeNull();
  });

  it("reportsCleanupRunBusy is false", () => {
    const { reportsCleanupRunBusy } = useReportsCleanup(makeDeps());
    expect(reportsCleanupRunBusy.value).toBe(false);
  });

  it("reportsCleanupHasCandidates is false", () => {
    const { reportsCleanupHasCandidates } = useReportsCleanup(makeDeps());
    expect(reportsCleanupHasCandidates.value).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// loadReportsCleanupSummary – success
// ---------------------------------------------------------------------------

describe("useReportsCleanup – loadReportsCleanupSummary success", () => {
  it("calls the correct endpoint with keep_latest=20", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { loadReportsCleanupSummary } = useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("/reports/cleanup/summary");
    expect(url).toContain("keep_latest=20");
  });

  it("updates reportsCleanupSummary on success", async () => {
    const deps = makeDeps();
    const summaryData = makeSummaryResponse();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(summaryData),
    });

    const { reportsCleanupSummary, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    expect(reportsCleanupSummary.value).not.toBeNull();
    expect(reportsCleanupSummary.value.total_size_bytes).toBe(1024);
    expect(reportsCleanupSummary.value.keep_latest_per_kind).toBe(20);
    expect(reportsCleanupSummary.value.jobs.total_count).toBe(10);
  });

  it("sets status to idle after successful load", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { reportsCleanupStatus, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    expect(reportsCleanupStatus.value).toBe("idle");
  });

  it("sets status to loading before fetch resolves", async () => {
    const deps = makeDeps();
    let resolveFetch;
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const { reportsCleanupStatus, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    const promise = loadReportsCleanupSummary();
    expect(reportsCleanupStatus.value).toBe("loading");

    resolveFetch({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });
    await promise;
  });

  it("clears error on load", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { reportsCleanupError, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    reportsCleanupError.value = "previous error";
    await loadReportsCleanupSummary();

    expect(reportsCleanupError.value).toBe("");
  });
});

// ---------------------------------------------------------------------------
// loadReportsCleanupSummary – HTTP failure
// ---------------------------------------------------------------------------

describe("useReportsCleanup – loadReportsCleanupSummary HTTP failure", () => {
  it("sets error and status on non-ok response with detail", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: "Server error" }),
    });

    const { reportsCleanupError, reportsCleanupStatus, loadReportsCleanupSummary } =
      useReportsCleanup(deps);

    await expect(loadReportsCleanupSummary()).rejects.toThrow("Server error");
    expect(reportsCleanupError.value).toBe("Server error");
    expect(reportsCleanupStatus.value).toBe("error");
  });

  it("uses default i18n message when detail is missing", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const { reportsCleanupError, loadReportsCleanupSummary } =
      useReportsCleanup(deps);

    await expect(loadReportsCleanupSummary()).rejects.toThrow();
    expect(reportsCleanupError.value).toBe(mockMessages.reportsCleanupFailed);
  });
});

// ---------------------------------------------------------------------------
// loadReportsCleanupSummary – network error
// ---------------------------------------------------------------------------

describe("useReportsCleanup – loadReportsCleanupSummary network error", () => {
  it("sets error and status on network failure", async () => {
    const deps = makeDeps();
    fetchMock.mockRejectedValue(new Error("Network fail"));

    const { reportsCleanupError, reportsCleanupStatus, loadReportsCleanupSummary } =
      useReportsCleanup(deps);

    await expect(loadReportsCleanupSummary()).rejects.toThrow("Network fail");
    expect(reportsCleanupError.value).toBe("Network fail");
    expect(reportsCleanupStatus.value).toBe("error");
  });

  it("rejects on network failure", async () => {
    const deps = makeDeps();
    fetchMock.mockRejectedValue(new Error("fail"));

    const { loadReportsCleanupSummary } = useReportsCleanup(deps);
    await expect(loadReportsCleanupSummary()).rejects.toThrow("fail");
  });
});

// ---------------------------------------------------------------------------
// Computed properties – preview and candidates
// ---------------------------------------------------------------------------

describe("useReportsCleanup – preview and candidates computed", () => {
  it("reportsCleanupPreview defaults to empty when summary is null", () => {
    const { reportsCleanupPreview } = useReportsCleanup(makeDeps());
    expect(reportsCleanupPreview.value).toEqual({
      candidate_count: 0,
      candidate_size_bytes: 0,
      candidates: [],
    });
  });

  it("reportsCleanupPreview returns cleanup_preview after load", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { reportsCleanupPreview, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    expect(reportsCleanupPreview.value.candidate_count).toBe(3);
    expect(reportsCleanupPreview.value.candidate_size_bytes).toBe(512);
    expect(reportsCleanupPreview.value.candidates).toHaveLength(3);
  });

  it("reportsCleanupPreviewCandidates returns first 5 candidates", async () => {
    const deps = makeDeps();
    const manyCandidates = Array.from({ length: 10 }, (_, i) => ({
      kind: "job",
      file_path: `/reports/job${i}.html`,
      size_bytes: 100,
      modified_at: `2025-03-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
    }));

    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve(
          makeSummaryResponse({
            cleanup_preview: {
              candidate_count: 10,
              candidate_size_bytes: 1000,
              candidates: manyCandidates,
            },
          })
        ),
    });

    const { reportsCleanupPreviewCandidates, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    expect(reportsCleanupPreviewCandidates.value).toHaveLength(5);
  });

  it("reportsCleanupHasCandidates is true when candidates exist", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { reportsCleanupHasCandidates, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    expect(reportsCleanupHasCandidates.value).toBe(true);
  });

  it("reportsCleanupHasCandidates is false when candidate_count is 0", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve(
          makeSummaryResponse({
            cleanup_preview: {
              candidate_count: 0,
              candidate_size_bytes: 0,
              candidates: [],
            },
          })
        ),
    });

    const { reportsCleanupHasCandidates, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    expect(reportsCleanupHasCandidates.value).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Computed properties – labels
// ---------------------------------------------------------------------------

describe("useReportsCleanup – label computed properties", () => {
  it("reportsCleanupTotalSizeLabel formats total_size_bytes via formatStorageBytes", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse({ total_size_bytes: 2048 })),
    });

    const { reportsCleanupTotalSizeLabel, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    // Must read .value to trigger lazy computed evaluation
    expect(reportsCleanupTotalSizeLabel.value).toBe("2048 B");
    expect(deps.formatStorageBytes).toHaveBeenCalledWith(2048);
  });

  it("reportsCleanupTotalSizeLabel defaults to 0 when summary is null", () => {
    const deps = makeDeps();
    const { reportsCleanupTotalSizeLabel } = useReportsCleanup(deps);

    // Must read .value to trigger lazy computed evaluation
    expect(reportsCleanupTotalSizeLabel.value).toBe("0 B");
    expect(deps.formatStorageBytes).toHaveBeenCalledWith(0);
  });

  it("reportsCleanupCandidateSizeLabel formats candidate_size_bytes via formatStorageBytes", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { reportsCleanupCandidateSizeLabel, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    // Must read .value to trigger lazy computed evaluation
    expect(reportsCleanupCandidateSizeLabel.value).toBe("512 B");
    expect(deps.formatStorageBytes).toHaveBeenCalledWith(512);
  });

  it("reportsCleanupDeletedSizeLabel returns '0 B' when no run result", () => {
    const deps = makeDeps();
    const { reportsCleanupDeletedSizeLabel } = useReportsCleanup(deps);
    expect(reportsCleanupDeletedSizeLabel.value).toBe("0 B");
  });

  it("reportsCleanupDeletedSizeLabel uses formatStorageBytes after run", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeRunResponse({ deleted_size_bytes: 256 })),
    });

    const { reportsCleanupDeletedSizeLabel, runReportsCleanup } =
      useReportsCleanup(deps);
    await runReportsCleanup(true);

    // Must read .value to trigger lazy computed evaluation
    expect(reportsCleanupDeletedSizeLabel.value).toBe("256 B");
    expect(deps.formatStorageBytes).toHaveBeenCalledWith(256);
  });

  it("reportsCleanupOldestLabel formats oldest_modified_at via formatEventTime", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { reportsCleanupOldestLabel, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    // Must read .value to trigger lazy computed evaluation
    expect(reportsCleanupOldestLabel.value).toBe(
      "formatted:2025-01-01T00:00:00Z"
    );
    expect(deps.formatEventTime).toHaveBeenCalledWith(
      "2025-01-01T00:00:00Z"
    );
  });

  it("reportsCleanupLatestLabel formats latest_modified_at via formatEventTime", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { reportsCleanupLatestLabel, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    // Must read .value to trigger lazy computed evaluation
    expect(reportsCleanupLatestLabel.value).toBe(
      "formatted:2025-06-01T12:00:00Z"
    );
    expect(deps.formatEventTime).toHaveBeenCalledWith(
      "2025-06-01T12:00:00Z"
    );
  });

  it("reportsCleanupCandidatesForDisplay maps candidates with size and date labels", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { reportsCleanupCandidatesForDisplay, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    const display = reportsCleanupCandidatesForDisplay.value;
    expect(display).toHaveLength(3);
    expect(display[0].sizeLabel).toBe("200 B");
    expect(display[0].modifiedAtLabel).toBe("formatted:2025-03-01T00:00:00Z");
    expect(display[0].kind).toBe("job");
    expect(display[0].file_path).toBe("/reports/job1.html");
  });
});

// ---------------------------------------------------------------------------
// Computed properties – date fallbacks
// ---------------------------------------------------------------------------

describe("useReportsCleanup – date computed fallbacks", () => {
  it("reportsCleanupOldestModifiedAt prefers jobs oldest", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { reportsCleanupOldestModifiedAt, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    expect(reportsCleanupOldestModifiedAt.value).toBe(
      "2025-01-01T00:00:00Z"
    );
  });

  it("reportsCleanupLatestModifiedAt prefers jobs latest", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { reportsCleanupLatestModifiedAt, loadReportsCleanupSummary } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    expect(reportsCleanupLatestModifiedAt.value).toBe(
      "2025-06-01T12:00:00Z"
    );
  });

  it("reportsCleanupOldestModifiedAt returns empty when summary is null", () => {
    const deps = makeDeps();
    const { reportsCleanupOldestModifiedAt } = useReportsCleanup(deps);
    expect(reportsCleanupOldestModifiedAt.value).toBe("");
  });

  it("reportsCleanupLatestModifiedAt returns empty when summary is null", () => {
    const deps = makeDeps();
    const { reportsCleanupLatestModifiedAt } = useReportsCleanup(deps);
    expect(reportsCleanupLatestModifiedAt.value).toBe("");
  });
});

// ---------------------------------------------------------------------------
// runReportsCleanup – dry-run success
// ---------------------------------------------------------------------------

describe("useReportsCleanup – runReportsCleanup dry-run success", () => {
  it("calls POST to /reports/cleanup/run with dry_run=true", async () => {
    const deps = makeDeps();
    // First mock: loadReportsCleanupSummary (called after run succeeds)
    // We need to call loadReportsCleanupSummary first so keep_latest_per_kind is set
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeRunResponse({ dry_run: true })),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const { loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(true);

    const postCall = fetchMock.mock.calls.find(
      (call) => call[1]?.method === "POST"
    );
    expect(postCall).toBeDefined();
    expect(postCall[0]).toContain("/reports/cleanup/run");
    expect(postCall[1].body).toContain('"dry_run":true');
    expect(postCall[1].body).toContain('"confirm":false');
  });

  it("sets runResult and status to idle on success", async () => {
    const deps = makeDeps();
    const runResponse = makeRunResponse({
      dry_run: true,
      candidate_count: 3,
      deleted_count: 0,
    });

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(runResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const {
      reportsCleanupRunResult,
      reportsCleanupRunStatus,
      loadReportsCleanupSummary,
      runReportsCleanup,
    } = useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(true);

    expect(reportsCleanupRunResult.value).not.toBeNull();
    expect(reportsCleanupRunResult.value.candidate_count).toBe(3);
    expect(reportsCleanupRunStatus.value).toBe("idle");
  });

  it("clears runError and runMode on success", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeRunResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const {
      reportsCleanupRunError,
      reportsCleanupRunMode,
      loadReportsCleanupSummary,
      runReportsCleanup,
    } = useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(true);

    expect(reportsCleanupRunError.value).toBe("");
    expect(reportsCleanupRunMode.value).toBe("");
  });

  it("refreshes summary after dry-run success", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeRunResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse({ total_size_bytes: 500 })),
      });

    const {
      reportsCleanupSummary,
      loadReportsCleanupSummary,
      runReportsCleanup,
    } = useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(true);

    // 3 fetch calls: initial summary, run, refreshed summary
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(reportsCleanupSummary.value.total_size_bytes).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// runReportsCleanup – delete (non-dry-run) success
// ---------------------------------------------------------------------------

describe("useReportsCleanup – runReportsCleanup delete success", () => {
  it("calls POST with dry_run=false and confirm=true", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            makeRunResponse({ dry_run: false, deletes_files: true, deleted_count: 2 })
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const { loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(false);

    const postCall = fetchMock.mock.calls.find(
      (call) => call[1]?.method === "POST"
    );
    expect(postCall[1].body).toContain('"dry_run":false');
    expect(postCall[1].body).toContain('"confirm":true');
  });

  it("calls window.confirm before running delete", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeRunResponse({ dry_run: false })),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const { loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(false);

    expect(globalThis.window.confirm).toHaveBeenCalledWith(
      mockMessages.reportsCleanupConfirm
    );
  });

  it("does not run delete when window.confirm returns false", async () => {
    globalThis.window.confirm = vi.fn(() => false);
    const deps = makeDeps();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });

    const { loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    // Reset fetch mock to track only the run call
    fetchMock.mockClear();
    await runReportsCleanup(false);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls loadRecentJobs and loadComparisonHistory after non-dry-run", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeRunResponse({ dry_run: false })),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const { loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(false);

    expect(deps.loadRecentJobs).toHaveBeenCalled();
    expect(deps.loadComparisonHistory).toHaveBeenCalled();
  });

  it("does not call loadRecentJobs or loadComparisonHistory after dry-run", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeRunResponse({ dry_run: true })),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const { loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    deps.loadRecentJobs.mockClear();
    deps.loadComparisonHistory.mockClear();
    await runReportsCleanup(true);

    expect(deps.loadRecentJobs).not.toHaveBeenCalled();
    expect(deps.loadComparisonHistory).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// runReportsCleanup – HTTP failure
// ---------------------------------------------------------------------------

describe("useReportsCleanup – runReportsCleanup HTTP failure", () => {
  it("sets error and status on non-ok response with detail", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: "Run server error" }),
      });

    const {
      reportsCleanupRunError,
      reportsCleanupRunStatus,
      loadReportsCleanupSummary,
      runReportsCleanup,
    } = useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(true);

    expect(reportsCleanupRunError.value).toBe("Run server error");
    expect(reportsCleanupRunStatus.value).toBe("error");
  });

  it("uses default i18n message when detail is missing", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

    const { reportsCleanupRunError, loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(true);

    expect(reportsCleanupRunError.value).toBe(
      mockMessages.reportsCleanupRunFailed
    );
  });
});

// ---------------------------------------------------------------------------
// runReportsCleanup – network error
// ---------------------------------------------------------------------------

describe("useReportsCleanup – runReportsCleanup network error", () => {
  it("sets error and status on network failure", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockRejectedValueOnce(new Error("Network fail"));

    const {
      reportsCleanupRunError,
      reportsCleanupRunStatus,
      loadReportsCleanupSummary,
      runReportsCleanup,
    } = useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(true);

    expect(reportsCleanupRunError.value).toBe("Network fail");
    expect(reportsCleanupRunStatus.value).toBe("error");
  });

  it("clears runMode on network error", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockRejectedValueOnce(new Error("fail"));

    const { reportsCleanupRunMode, loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(true);

    expect(reportsCleanupRunMode.value).toBe("");
  });
});

// ---------------------------------------------------------------------------
// runReportsCleanup – busy state
// ---------------------------------------------------------------------------

describe("useReportsCleanup – runReportsCleanup busy state", () => {
  it("sets reportsCleanupRunBusy to true while running", async () => {
    const deps = makeDeps();
    let resolveRun;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRun = resolve;
          })
      );

    const {
      reportsCleanupRunBusy,
      reportsCleanupRunStatus,
      loadReportsCleanupSummary,
      runReportsCleanup,
    } = useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    const runPromise = runReportsCleanup(true);
    expect(reportsCleanupRunBusy.value).toBe(true);
    expect(reportsCleanupRunStatus.value).toBe("running");

    resolveRun({
      ok: true,
      json: () => Promise.resolve(makeRunResponse()),
    });
    // Mock the summary refresh after run
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });
    await runPromise;

    expect(reportsCleanupRunBusy.value).toBe(false);
  });

  it("sets runMode to dry-run for dry run", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeRunResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const { reportsCleanupRunMode, loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();
    await runReportsCleanup(true);

    expect(reportsCleanupRunMode.value).toBe("");
  });

  it("skips run when already busy", async () => {
    const deps = makeDeps();
    let resolveRun;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRun = resolve;
          })
      );

    const { loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    const firstRun = runReportsCleanup(true);
    // Try to run again while busy
    await runReportsCleanup(true);

    // Only 2 fetch calls (summary + first run), not 3
    expect(fetchMock).toHaveBeenCalledTimes(2);

    resolveRun({
      ok: true,
      json: () => Promise.resolve(makeRunResponse()),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeSummaryResponse()),
    });
    await firstRun;
  });
});

// ---------------------------------------------------------------------------
// runReportsCleanup – refresh error handling
// ---------------------------------------------------------------------------

describe("useReportsCleanup – runReportsCleanup refresh error handling", () => {
  it("does not throw when loadRecentJobs is synchronous (returns undefined)", async () => {
    const deps = makeDeps({
      loadRecentJobs: vi.fn(() => undefined),
    });

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeRunResponse({ dry_run: false })),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const { loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    await expect(runReportsCleanup(false)).resolves.toBeUndefined();
    expect(deps.loadRecentJobs).toHaveBeenCalled();
  });

  it("does not throw when loadRecentJobs fails after non-dry-run", async () => {
    const deps = makeDeps();
    deps.loadRecentJobs.mockRejectedValue(new Error("jobs refresh fail"));
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeRunResponse({ dry_run: false })),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const { loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    await expect(runReportsCleanup(false)).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("does not throw when loadComparisonHistory fails after non-dry-run", async () => {
    const deps = makeDeps();
    deps.loadComparisonHistory.mockRejectedValue(
      new Error("comparison refresh fail")
    );
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeRunResponse({ dry_run: false })),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummaryResponse()),
      });

    const { loadReportsCleanupSummary, runReportsCleanup } =
      useReportsCleanup(deps);
    await loadReportsCleanupSummary();

    await expect(runReportsCleanup(false)).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Returned interface
// ---------------------------------------------------------------------------

describe("useReportsCleanup – returned interface", () => {
  it("returns all expected properties", () => {
    const result = useReportsCleanup(makeDeps());

    const expectedKeys = [
      "reportsCleanupSummary",
      "reportsCleanupStatus",
      "reportsCleanupError",
      "reportsCleanupRunStatus",
      "reportsCleanupRunMode",
      "reportsCleanupRunError",
      "reportsCleanupRunResult",
      "reportsCleanupPreview",
      "reportsCleanupPreviewCandidates",
      "reportsCleanupOldestModifiedAt",
      "reportsCleanupLatestModifiedAt",
      "reportsCleanupHasCandidates",
      "reportsCleanupRunBusy",
      "reportsCleanupTotalSizeLabel",
      "reportsCleanupCandidateSizeLabel",
      "reportsCleanupDeletedSizeLabel",
      "reportsCleanupOldestLabel",
      "reportsCleanupLatestLabel",
      "reportsCleanupCandidatesForDisplay",
      "loadReportsCleanupSummary",
      "runReportsCleanup",
    ];

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });
});
