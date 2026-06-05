import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { computed } from "vue";
import { useRecentJobs } from "../useRecentJobs.js";

// ---------------------------------------------------------------------------
// localStorage shim (node environment, no jsdom)
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

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const mockMessages = {
  statusValues: {
    creating: "Creating",
    running: "Running",
    finished: "Finished",
    failed: "Failed",
    cancelled: "Cancelled",
  },
  archiveActive: "Active",
  archiveArchived: "Archived",
  archiveAll: "All",
  archiveFailed: "Archive failed",
  restoreFailed: "Restore failed",
  exportHtmlReport: "HTML Report",
  exportCsvMetrics: "CSV Metrics",
  exportMarkdownReport: "Markdown Report",
  exportMetricsJson: "Metrics JSON",
  exportConfigJson: "Config JSON",
  eventType: {
    started: "Started",
    finished: "Finished",
    failed: "Failed",
    round_progress: "Round Progress",
  },
  eventRound: "Round",
  comparisonUntitled: "Untitled Comparison",
};

function makeDeps(overrides = {}) {
  return {
    API_BASE: "http://localhost:8000",
    t: computed(() => mockMessages),
    withLang: vi.fn(
      (url) => url + (url.includes("?") ? "&" : "?") + "lang=zh"
    ),
    jobArtifactUrl: vi.fn((job, key) => job?.artifacts?.[key] || ""),
    hasArtifacts: vi.fn(
      (job) => Boolean(job?.artifacts && Object.keys(job.artifacts).length)
    ),
    formatDisplayValue: vi.fn((value) =>
      value == null || value === "" ? "—" : String(value)
    ),
    formatMetricValue: vi.fn((value) =>
      value == null || value === "" ? "—" : String(value)
    ),
    formatEventMessage: vi.fn((event) => event?.message || ""),
    formatEventTime: vi.fn((value) => (value ? `formatted:${value}` : "—")),
    eventIcon: vi.fn((type) => `icon:${type}`),
    onJobsCleared: vi.fn(),
    ...overrides,
  };
}

function makeJob(overrides = {}) {
  return {
    job_id: "job-1",
    status: "finished",
    config_path: "configs/demo.yaml",
    experiment_name: "Demo Experiment",
    aggregation: "FedAvg",
    defense: "None",
    attack: "Label Flipping",
    final_accuracy: 0.95,
    final_loss: 0.05,
    final_asr: 0.01,
    final_metric: { accuracy: 0.95 },
    metrics_count: 10,
    has_report: true,
    report_url: "http://localhost:8000/reports/job-1",
    artifacts: {
      report_html_url: "http://localhost:8000/reports/job-1",
      metrics_csv: "http://localhost:8000/artifacts/job-1/metrics.csv",
    },
    events: [
      { type: "started", created_at: "2025-01-01T00:00:00Z", message: "Job started" },
      { type: "round_progress", round: 1, total_rounds: 10, created_at: "2025-01-01T00:01:00Z", metrics: { accuracy: 0.5, loss: 0.5, attack_success_rate: 0.1 } },
      { type: "round_progress", round: 10, total_rounds: 10, created_at: "2025-01-01T00:10:00Z", metrics: { accuracy: 0.95, loss: 0.05, attack_success_rate: 0.01 } },
      { type: "finished", created_at: "2025-01-01T00:11:00Z", message: "Job finished" },
    ],
    created_at: "2025-01-01T00:00:00Z",
    started_at: "2025-01-01T00:00:05Z",
    finished_at: "2025-01-01T00:11:00Z",
    archived: false,
    archived_at: null,
    error: null,
    ...overrides,
  };
}

function makeApiJob(overrides = {}) {
  return {
    job_id: "job-1",
    status: "finished",
    config_path: "configs/demo.yaml",
    experiment_name: "Demo Experiment",
    aggregation: "FedAvg",
    defense: "None",
    attack: "Label Flipping",
    final_accuracy: 0.95,
    final_loss: 0.05,
    final_asr: 0.01,
    final_metric: { accuracy: 0.95 },
    metrics_count: 10,
    has_report: true,
    artifacts: {
      report_html_url: "http://localhost:8000/reports/job-1",
      metrics_csv: "http://localhost:8000/artifacts/job-1/metrics.csv",
    },
    events: [
      { type: "started", created_at: "2025-01-01T00:00:00Z", message: "Job started" },
    ],
    created_at: "2025-01-01T00:00:00Z",
    started_at: "2025-01-01T00:00:05Z",
    finished_at: "2025-01-01T00:11:00Z",
    archived: false,
    archived_at: null,
    error: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// fetch mock setup
// ---------------------------------------------------------------------------

let fetchMock;

beforeEach(() => {
  fakeLocalStorage.clear();
  globalThis.window = globalThis.window || {};
  globalThis.window.localStorage = fakeLocalStorage;
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.fetch;
  delete globalThis.window;
});

// ===========================================================================
// Initial state
// ===========================================================================

describe("useRecentJobs – initial state", () => {
  it("recentJobs is empty", () => {
    const { recentJobs } = useRecentJobs(makeDeps());
    expect(recentJobs.value).toEqual([]);
  });

  it("jobStatusFilter is all", () => {
    const { jobStatusFilter } = useRecentJobs(makeDeps());
    expect(jobStatusFilter.value).toBe("all");
  });

  it("jobArchiveFilter is active", () => {
    const { jobArchiveFilter } = useRecentJobs(makeDeps());
    expect(jobArchiveFilter.value).toBe("active");
  });

  it("recentJobsLimit is 20", () => {
    const { recentJobsLimit } = useRecentJobs(makeDeps());
    expect(recentJobsLimit.value).toBe(20);
  });

  it("recentJobsSort is created_at_desc", () => {
    const { recentJobsSort } = useRecentJobs(makeDeps());
    expect(recentJobsSort.value).toBe("created_at_desc");
  });

  it("selectedJobIds is empty", () => {
    const { selectedJobIds } = useRecentJobs(makeDeps());
    expect(selectedJobIds.value).toEqual([]);
  });

  it("selectedDetailJobId is empty", () => {
    const { selectedDetailJobId } = useRecentJobs(makeDeps());
    expect(selectedDetailJobId.value).toBe("");
  });

  it("historyActionError is empty", () => {
    const { historyActionError } = useRecentJobs(makeDeps());
    expect(historyActionError.value).toBe("");
  });

  it("historyActionStatus is idle", () => {
    const { historyActionStatus } = useRecentJobs(makeDeps());
    expect(historyActionStatus.value).toBe("idle");
  });

  it("comparableJobsCount is 0", () => {
    const { comparableJobsCount } = useRecentJobs(makeDeps());
    expect(comparableJobsCount.value).toBe(0);
  });

  it("selectedJobsForPreview is empty", () => {
    const { selectedJobsForPreview } = useRecentJobs(makeDeps());
    expect(selectedJobsForPreview.value).toEqual([]);
  });

  it("selectedDetailJob is null", () => {
    const { selectedDetailJob } = useRecentJobs(makeDeps());
    expect(selectedDetailJob.value).toBeNull();
  });

  it("selectedDetailArtifactsCount is 0", () => {
    const { selectedDetailArtifactsCount } = useRecentJobs(makeDeps());
    expect(selectedDetailArtifactsCount.value).toBe(0);
  });

  it("recentJobsForDisplay is empty", () => {
    const { recentJobsForDisplay } = useRecentJobs(makeDeps());
    expect(recentJobsForDisplay.value).toEqual([]);
  });

  it("selectedLifecycleEvents is empty", () => {
    const { selectedLifecycleEvents } = useRecentJobs(makeDeps());
    expect(selectedLifecycleEvents.value).toEqual([]);
  });

  it("selectedRoundEvents is empty", () => {
    const { selectedRoundEvents } = useRecentJobs(makeDeps());
    expect(selectedRoundEvents.value).toEqual([]);
  });

  it("detailExportItems is empty", () => {
    const { detailExportItems } = useRecentJobs(makeDeps());
    expect(detailExportItems.value).toEqual([]);
  });

  it("lifecycleDisplayEvents is empty", () => {
    const { lifecycleDisplayEvents } = useRecentJobs(makeDeps());
    expect(lifecycleDisplayEvents.value).toEqual([]);
  });

  it("roundDisplayEvents is empty", () => {
    const { roundDisplayEvents } = useRecentJobs(makeDeps());
    expect(roundDisplayEvents.value).toEqual([]);
  });
});

// ===========================================================================
// canSelectJobForComparison
// ===========================================================================

describe("useRecentJobs – canSelectJobForComparison", () => {
  it("returns true for a valid comparable job", () => {
    const { canSelectJobForComparison } = useRecentJobs(makeDeps());
    const job = makeJob();
    expect(canSelectJobForComparison(job)).toBe(true);
  });

  it("returns false when job is archived", () => {
    const { canSelectJobForComparison } = useRecentJobs(makeDeps());
    expect(canSelectJobForComparison(makeJob({ archived: true }))).toBe(false);
  });

  it("returns false when status is running", () => {
    const { canSelectJobForComparison } = useRecentJobs(makeDeps());
    expect(canSelectJobForComparison(makeJob({ status: "running" }))).toBe(false);
  });

  it("returns false when status is failed", () => {
    const { canSelectJobForComparison } = useRecentJobs(makeDeps());
    expect(canSelectJobForComparison(makeJob({ status: "failed" }))).toBe(false);
  });

  it("returns false when status is creating", () => {
    const { canSelectJobForComparison } = useRecentJobs(makeDeps());
    expect(canSelectJobForComparison(makeJob({ status: "creating" }))).toBe(false);
  });

  it("returns false when metrics_count is 0", () => {
    const { canSelectJobForComparison } = useRecentJobs(makeDeps());
    expect(canSelectJobForComparison(makeJob({ metrics_count: 0 }))).toBe(false);
  });

  it("returns false when has_report is false", () => {
    const { canSelectJobForComparison } = useRecentJobs(makeDeps());
    expect(canSelectJobForComparison(makeJob({ has_report: false }))).toBe(false);
  });

  it("returns false when report_url is empty", () => {
    const { canSelectJobForComparison } = useRecentJobs(makeDeps());
    expect(canSelectJobForComparison(makeJob({ report_url: "" }))).toBe(false);
  });
});

// ===========================================================================
// toggleJobSelection
// ===========================================================================

describe("useRecentJobs – toggleJobSelection", () => {
  it("adds job id to selectedJobIds", () => {
    const { selectedJobIds, toggleJobSelection } = useRecentJobs(makeDeps());
    toggleJobSelection("job-1");
    expect(selectedJobIds.value).toEqual(["job-1"]);
  });

  it("removes job id when already selected", () => {
    const { selectedJobIds, toggleJobSelection } = useRecentJobs(makeDeps());
    toggleJobSelection("job-1");
    toggleJobSelection("job-1");
    expect(selectedJobIds.value).toEqual([]);
  });

  it("supports multiple selections", () => {
    const { selectedJobIds, toggleJobSelection } = useRecentJobs(makeDeps());
    toggleJobSelection("job-1");
    toggleJobSelection("job-2");
    expect(selectedJobIds.value).toEqual(["job-1", "job-2"]);
  });

  it("removes only the toggled id", () => {
    const { selectedJobIds, toggleJobSelection } = useRecentJobs(makeDeps());
    toggleJobSelection("job-1");
    toggleJobSelection("job-2");
    toggleJobSelection("job-1");
    expect(selectedJobIds.value).toEqual(["job-2"]);
  });
});

// ===========================================================================
// comparableJobsCount
// ===========================================================================

describe("useRecentJobs – comparableJobsCount", () => {
  it("counts comparable jobs from recentJobs", () => {
    const deps = makeDeps();
    const { recentJobs, comparableJobsCount } = useRecentJobs(deps);
    recentJobs.value = [
      makeJob({ job_id: "j1" }),
      makeJob({ job_id: "j2", archived: true }),
      makeJob({ job_id: "j3" }),
    ];
    expect(comparableJobsCount.value).toBe(2);
  });

  it("returns 0 when no jobs are comparable", () => {
    const deps = makeDeps();
    const { recentJobs, comparableJobsCount } = useRecentJobs(deps);
    recentJobs.value = [
      makeJob({ job_id: "j1", status: "running" }),
      makeJob({ job_id: "j2", has_report: false }),
    ];
    expect(comparableJobsCount.value).toBe(0);
  });
});

// ===========================================================================
// selectedJobsForPreview
// ===========================================================================

describe("useRecentJobs – selectedJobsForPreview", () => {
  it("returns selected jobs in order", () => {
    const deps = makeDeps();
    const { recentJobs, selectedJobIds, selectedJobsForPreview } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({ job_id: "j1" }),
      makeJob({ job_id: "j2" }),
      makeJob({ job_id: "j3" }),
    ];
    selectedJobIds.value = ["j3", "j1"];
    expect(selectedJobsForPreview.value.map((j) => j.job_id)).toEqual([
      "j3",
      "j1",
    ]);
  });

  it("filters out missing jobs", () => {
    const deps = makeDeps();
    const { recentJobs, selectedJobIds, selectedJobsForPreview } =
      useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    selectedJobIds.value = ["j1", "j-missing"];
    expect(selectedJobsForPreview.value).toHaveLength(1);
    expect(selectedJobsForPreview.value[0].job_id).toBe("j1");
  });
});

// ===========================================================================
// historyArchiveFilterLabel
// ===========================================================================

describe("useRecentJobs – historyArchiveFilterLabel", () => {
  it("returns active label by default", () => {
    const { historyArchiveFilterLabel } = useRecentJobs(makeDeps());
    expect(historyArchiveFilterLabel.value).toBe("Active");
  });

  it("returns archived label when filter is archived", () => {
    const { jobArchiveFilter, historyArchiveFilterLabel } =
      useRecentJobs(makeDeps());
    jobArchiveFilter.value = "archived";
    expect(historyArchiveFilterLabel.value).toBe("Archived");
  });

  it("returns all label when filter is all", () => {
    const { jobArchiveFilter, historyArchiveFilterLabel } =
      useRecentJobs(makeDeps());
    jobArchiveFilter.value = "all";
    expect(historyArchiveFilterLabel.value).toBe("All");
  });
});

// ===========================================================================
// Hidden jobs – localStorage
// ===========================================================================

describe("useRecentJobs – hidden jobs localStorage", () => {
  it("loadHiddenJobIds returns empty set when nothing stored", () => {
    const { loadHiddenJobIds } = useRecentJobs(makeDeps());
    const ids = loadHiddenJobIds();
    expect(ids).toBeInstanceOf(Set);
    expect(ids.size).toBe(0);
  });

  it("loadHiddenJobIds reads stored ids", () => {
    window.localStorage.setItem(
      "fedguardlab_hidden_jobs",
      JSON.stringify(["j1", "j2"])
    );
    const { loadHiddenJobIds } = useRecentJobs(makeDeps());
    const ids = loadHiddenJobIds();
    expect(ids.has("j1")).toBe(true);
    expect(ids.has("j2")).toBe(true);
  });

  it("saveHiddenJobIds writes to localStorage", () => {
    const { saveHiddenJobIds } = useRecentJobs(makeDeps());
    saveHiddenJobIds(new Set(["j1", "j2"]));
    const stored = JSON.parse(
      window.localStorage.getItem("fedguardlab_hidden_jobs")
    );
    expect(stored).toEqual(expect.arrayContaining(["j1", "j2"]));
    expect(stored).toHaveLength(2);
  });

  it("hideJobIds adds to hidden list", () => {
    const { hideJobIds, loadHiddenJobIds } = useRecentJobs(makeDeps());
    hideJobIds(["j1", "j2"]);
    const ids = loadHiddenJobIds();
    expect(ids.has("j1")).toBe(true);
    expect(ids.has("j2")).toBe(true);
  });

  it("hideJobIds accumulates with existing hidden ids", () => {
    window.localStorage.setItem(
      "fedguardlab_hidden_jobs",
      JSON.stringify(["j0"])
    );
    const { hideJobIds, loadHiddenJobIds } = useRecentJobs(makeDeps());
    hideJobIds(["j1"]);
    const ids = loadHiddenJobIds();
    expect(ids.has("j0")).toBe(true);
    expect(ids.has("j1")).toBe(true);
  });

  it("unhideJobId removes from hidden list", () => {
    window.localStorage.setItem(
      "fedguardlab_hidden_jobs",
      JSON.stringify(["j1", "j2"])
    );
    const { unhideJobId, loadHiddenJobIds } = useRecentJobs(makeDeps());
    unhideJobId("j1");
    const ids = loadHiddenJobIds();
    expect(ids.has("j1")).toBe(false);
    expect(ids.has("j2")).toBe(true);
  });

  it("loadHiddenJobIds handles invalid JSON gracefully", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    window.localStorage.setItem("fedguardlab_hidden_jobs", "not-json");
    const { loadHiddenJobIds } = useRecentJobs(makeDeps());
    const ids = loadHiddenJobIds();
    expect(ids).toBeInstanceOf(Set);
    expect(ids.size).toBe(0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("loadHiddenJobIds returns empty for non-array data", () => {
    window.localStorage.setItem(
      "fedguardlab_hidden_jobs",
      JSON.stringify("not-an-array")
    );
    const { loadHiddenJobIds } = useRecentJobs(makeDeps());
    const ids = loadHiddenJobIds();
    expect(ids.size).toBe(0);
  });
});

// ===========================================================================
// loadRecentJobs (from localStorage)
// ===========================================================================

describe("useRecentJobs – loadRecentJobs from localStorage", () => {
  it("loads jobs from localStorage", () => {
    const jobs = [makeJob({ job_id: "j1" }), makeJob({ job_id: "j2" })];
    window.localStorage.setItem(
      "fedguardlab_recent_jobs",
      JSON.stringify(jobs)
    );
    const { recentJobs, loadRecentJobs } = useRecentJobs(makeDeps());
    loadRecentJobs();
    expect(recentJobs.value).toHaveLength(2);
    expect(recentJobs.value[0].job_id).toBe("j1");
  });

  it("filters out hidden jobs", () => {
    const jobs = [makeJob({ job_id: "j1" }), makeJob({ job_id: "j2" })];
    window.localStorage.setItem(
      "fedguardlab_recent_jobs",
      JSON.stringify(jobs)
    );
    window.localStorage.setItem(
      "fedguardlab_hidden_jobs",
      JSON.stringify(["j1"])
    );
    const { recentJobs, loadRecentJobs } = useRecentJobs(makeDeps());
    loadRecentJobs();
    expect(recentJobs.value).toHaveLength(1);
    expect(recentJobs.value[0].job_id).toBe("j2");
  });

  it("does nothing when localStorage is empty", () => {
    const { recentJobs, loadRecentJobs } = useRecentJobs(makeDeps());
    loadRecentJobs();
    expect(recentJobs.value).toEqual([]);
  });

  it("handles invalid JSON gracefully", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    window.localStorage.setItem("fedguardlab_recent_jobs", "bad-json");
    const { recentJobs, loadRecentJobs } = useRecentJobs(makeDeps());
    loadRecentJobs();
    expect(recentJobs.value).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("does nothing for non-array data", () => {
    window.localStorage.setItem(
      "fedguardlab_recent_jobs",
      JSON.stringify({ not: "array" })
    );
    const { recentJobs, loadRecentJobs } = useRecentJobs(makeDeps());
    loadRecentJobs();
    expect(recentJobs.value).toEqual([]);
  });
});

// ===========================================================================
// loadRecentJobsFromApi – success
// ===========================================================================

describe("useRecentJobs – loadRecentJobsFromApi success", () => {
  it("fetches with correct default params", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ jobs: [] }),
    });
    const { loadRecentJobsFromApi } = useRecentJobs(makeDeps());
    await loadRecentJobsFromApi();
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("/jobs?");
    expect(url).toContain("limit=20");
    expect(url).toContain("sort=created_at_desc");
    expect(url).toContain("archived=active");
  });

  it("maps API jobs to recentJobs", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ jobs: [makeApiJob({ job_id: "j1" })] }),
    });
    const { recentJobs, loadRecentJobsFromApi } = useRecentJobs(makeDeps());
    await loadRecentJobsFromApi();
    expect(recentJobs.value).toHaveLength(1);
    expect(recentJobs.value[0].job_id).toBe("j1");
  });

  it("filters out hidden jobs", async () => {
    window.localStorage.setItem(
      "fedguardlab_hidden_jobs",
      JSON.stringify(["j1"])
    );
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          jobs: [
            makeApiJob({ job_id: "j1" }),
            makeApiJob({ job_id: "j2" }),
          ],
        }),
    });
    const { recentJobs, loadRecentJobsFromApi } = useRecentJobs(makeDeps());
    await loadRecentJobsFromApi();
    expect(recentJobs.value).toHaveLength(1);
    expect(recentJobs.value[0].job_id).toBe("j2");
  });

  it("sets status filter param when not all", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ jobs: [] }),
    });
    const { jobStatusFilter, loadRecentJobsFromApi } =
      useRecentJobs(makeDeps());
    jobStatusFilter.value = "running";
    await loadRecentJobsFromApi();
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("status=running");
  });

  it("does not set status param for finished_report filter", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ jobs: [] }),
    });
    const { jobStatusFilter, loadRecentJobsFromApi } =
      useRecentJobs(makeDeps());
    jobStatusFilter.value = "finished_report";
    await loadRecentJobsFromApi();
    const url = fetchMock.mock.calls[0][0];
    expect(url).not.toContain("status=");
  });

  it("applies finished_report client-side filter", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          jobs: [
            makeApiJob({ job_id: "j1", status: "finished", has_report: true, metrics_count: 5 }),
            makeApiJob({ job_id: "j2", status: "finished", has_report: false }),
            makeApiJob({ job_id: "j3", status: "running" }),
            makeApiJob({ job_id: "j4", status: "finished", has_report: true, metrics_count: 0 }),
          ],
        }),
    });
    const { jobStatusFilter, recentJobs, loadRecentJobsFromApi } =
      useRecentJobs(makeDeps());
    jobStatusFilter.value = "finished_report";
    await loadRecentJobsFromApi();
    expect(recentJobs.value).toHaveLength(1);
    expect(recentJobs.value[0].job_id).toBe("j1");
  });
});

// ===========================================================================
// loadRecentJobsFromApi – HTTP failure
// ===========================================================================

describe("useRecentJobs – loadRecentJobsFromApi HTTP failure", () => {
  it("throws with detail message on non-ok response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: "Server error" }),
    });
    const { loadRecentJobsFromApi } = useRecentJobs(makeDeps());
    await expect(loadRecentJobsFromApi()).rejects.toThrow("Server error");
  });

  it("throws with default message when detail missing", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });
    const { loadRecentJobsFromApi } = useRecentJobs(makeDeps());
    await expect(loadRecentJobsFromApi()).rejects.toThrow("Failed to load jobs");
  });
});

// ===========================================================================
// loadRecentJobsFromApi – network error
// ===========================================================================

describe("useRecentJobs – loadRecentJobsFromApi network error", () => {
  it("rejects on network failure", async () => {
    fetchMock.mockRejectedValue(new Error("Network fail"));
    const { loadRecentJobsFromApi } = useRecentJobs(makeDeps());
    await expect(loadRecentJobsFromApi()).rejects.toThrow("Network fail");
  });
});

// ===========================================================================
// mapApiJobToRecentJob
// ===========================================================================

describe("useRecentJobs – mapApiJobToRecentJob", () => {
  it("maps core fields", () => {
    const { mapApiJobToRecentJob } = useRecentJobs(makeDeps());
    const mapped = mapApiJobToRecentJob(makeApiJob());
    expect(mapped.job_id).toBe("job-1");
    expect(mapped.status).toBe("finished");
    expect(mapped.config_path).toBe("configs/demo.yaml");
    expect(mapped.experiment_name).toBe("Demo Experiment");
    expect(mapped.name).toBe("Demo Experiment");
    expect(mapped.label).toBe("Demo Experiment");
  });

  it("maps metrics via formatMetricValue", () => {
    const deps = makeDeps();
    const { mapApiJobToRecentJob } = useRecentJobs(deps);
    const mapped = mapApiJobToRecentJob(makeApiJob());
    expect(deps.formatMetricValue).toHaveBeenCalledWith(0.95);
    expect(mapped.accuracy).toBe("0.95");
    expect(mapped.loss).toBe("0.05");
    expect(mapped.asr).toBe("0.01");
  });

  it("maps config fields via formatDisplayValue", () => {
    const deps = makeDeps();
    const { mapApiJobToRecentJob } = useRecentJobs(deps);
    const mapped = mapApiJobToRecentJob(makeApiJob());
    expect(deps.formatDisplayValue).toHaveBeenCalledWith("FedAvg");
    expect(mapped.aggregation).toBe("FedAvg");
    expect(mapped.defense).toBe("None");
    expect(mapped.attack).toBe("Label Flipping");
  });

  it("derives report_url from artifacts when has_report", () => {
    const { mapApiJobToRecentJob } = useRecentJobs(makeDeps());
    const mapped = mapApiJobToRecentJob(makeApiJob());
    expect(mapped.report_url).toBe(
      "http://localhost:8000/reports/job-1"
    );
    expect(mapped.has_report).toBe(true);
  });

  it("falls back to API_BASE/report_url when no artifact url", () => {
    const { mapApiJobToRecentJob } = useRecentJobs(makeDeps());
    const mapped = mapApiJobToRecentJob(
      makeApiJob({ artifacts: {}, has_report: true })
    );
    expect(mapped.report_url).toBe("http://localhost:8000/reports/job-1");
  });

  it("sets report_url to empty when no report", () => {
    const { mapApiJobToRecentJob } = useRecentJobs(makeDeps());
    const mapped = mapApiJobToRecentJob(makeApiJob({ has_report: false }));
    expect(mapped.report_url).toBe("");
    expect(mapped.has_report).toBe(false);
  });

  it("defaults experiment_name from config_path when missing", () => {
    const { mapApiJobToRecentJob } = useRecentJobs(makeDeps());
    const mapped = mapApiJobToRecentJob(
      makeApiJob({ experiment_name: "", config_path: "configs/test.yaml" })
    );
    expect(mapped.experiment_name).toBe("configs/test.yaml");
  });

  it("defaults experiment_name to Unknown Experiment when both missing", () => {
    const { mapApiJobToRecentJob } = useRecentJobs(makeDeps());
    const mapped = mapApiJobToRecentJob(
      makeApiJob({ experiment_name: "", config_path: "" })
    );
    expect(mapped.experiment_name).toBe("Unknown Experiment");
  });

  it("maps archived flag", () => {
    const { mapApiJobToRecentJob } = useRecentJobs(makeDeps());
    const mapped = mapApiJobToRecentJob(makeApiJob({ archived: true }));
    expect(mapped.archived).toBe(true);
  });

  it("defaults events to empty array", () => {
    const { mapApiJobToRecentJob } = useRecentJobs(makeDeps());
    const mapped = mapApiJobToRecentJob(makeApiJob({ events: undefined }));
    expect(mapped.events).toEqual([]);
  });

  it("preserves final_metric", () => {
    const { mapApiJobToRecentJob } = useRecentJobs(makeDeps());
    const mapped = mapApiJobToRecentJob(
      makeApiJob({ final_metric: { accuracy: 0.88 } })
    );
    expect(mapped.final_metric).toEqual({ accuracy: 0.88 });
  });
});

// ===========================================================================
// recentJobsForDisplay
// ===========================================================================

describe("useRecentJobs – recentJobsForDisplay", () => {
  it("adds statusLabel from t.statusValues", () => {
    const deps = makeDeps();
    const { recentJobs, recentJobsForDisplay } = useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1", status: "finished" })];
    expect(recentJobsForDisplay.value[0].statusLabel).toBe("Finished");
  });

  it("falls back to raw status for unknown status", () => {
    const deps = makeDeps();
    const { recentJobs, recentJobsForDisplay } = useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1", status: "unknown_status" })];
    expect(recentJobsForDisplay.value[0].statusLabel).toBe("unknown_status");
  });

  it("adds reportUrlWithLang using withLang", () => {
    const deps = makeDeps();
    const { recentJobs, recentJobsForDisplay } = useRecentJobs(deps);
    recentJobs.value = [
      makeJob({
        job_id: "j1",
        report_url: "http://localhost:8000/reports/j1",
      }),
    ];
    expect(recentJobsForDisplay.value[0].reportUrlWithLang).toBe(
      "http://localhost:8000/reports/j1?lang=zh"
    );
  });

  it("reportUrlWithLang is empty when no report_url", () => {
    const deps = makeDeps();
    const { recentJobs, recentJobsForDisplay } = useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1", report_url: "" })];
    expect(recentJobsForDisplay.value[0].reportUrlWithLang).toBe("");
  });

  it("adds canCompare flag", () => {
    const deps = makeDeps();
    const { recentJobs, recentJobsForDisplay } = useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    expect(recentJobsForDisplay.value[0].canCompare).toBe(true);
  });

  it("adds isSelected flag", () => {
    const deps = makeDeps();
    const { recentJobs, selectedJobIds, recentJobsForDisplay } =
      useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    selectedJobIds.value = ["j1"];
    expect(recentJobsForDisplay.value[0].isSelected).toBe(true);
  });

  it("adds isDetailSelected flag", () => {
    const deps = makeDeps();
    const { recentJobs, selectedDetailJobId, recentJobsForDisplay } =
      useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    selectedDetailJobId.value = "j1";
    expect(recentJobsForDisplay.value[0].isDetailSelected).toBe(true);
  });

  it("adds hasArtifacts via deps.hasArtifacts", () => {
    const deps = makeDeps();
    const { recentJobs, recentJobsForDisplay } = useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    expect(recentJobsForDisplay.value[0].hasArtifacts).toBe(true);
    expect(deps.hasArtifacts).toHaveBeenCalled();
  });
});

// ===========================================================================
// selectedDetailJob / selectedDetailArtifactsCount
// ===========================================================================

describe("useRecentJobs – selectedDetailJob", () => {
  it("returns null when no detail selected", () => {
    const { selectedDetailJob } = useRecentJobs(makeDeps());
    expect(selectedDetailJob.value).toBeNull();
  });

  it("returns the matching job", () => {
    const deps = makeDeps();
    const { recentJobs, selectedDetailJobId, selectedDetailJob } =
      useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    selectedDetailJobId.value = "j1";
    expect(selectedDetailJob.value.job_id).toBe("j1");
  });

  it("returns null when job not found", () => {
    const deps = makeDeps();
    const { selectedDetailJobId, selectedDetailJob } = useRecentJobs(deps);
    selectedDetailJobId.value = "nonexistent";
    expect(selectedDetailJob.value).toBeNull();
  });
});

describe("useRecentJobs – selectedDetailArtifactsCount", () => {
  it("counts non-empty artifact urls", () => {
    const deps = makeDeps();
    deps.jobArtifactUrl = vi.fn((job, key) => {
      const map = { report_html: "url", metrics_csv: "url", summary_md: "", metrics_json: "", config_json: "" };
      return map[key] || "";
    });
    const { recentJobs, selectedDetailJobId, selectedDetailArtifactsCount } =
      useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    selectedDetailJobId.value = "j1";
    expect(selectedDetailArtifactsCount.value).toBe(2);
  });

  it("returns 0 when no job selected", () => {
    const { selectedDetailArtifactsCount } = useRecentJobs(makeDeps());
    expect(selectedDetailArtifactsCount.value).toBe(0);
  });
});

// ===========================================================================
// Lifecycle / round events
// ===========================================================================

describe("useRecentJobs – selectedLifecycleEvents", () => {
  it("filters out round_progress events", () => {
    const deps = makeDeps();
    const { recentJobs, selectedDetailJobId, selectedLifecycleEvents } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({
        job_id: "j1",
        events: [
          { type: "started", created_at: "2025-01-01T00:00:00Z" },
          { type: "round_progress", round: 1, total_rounds: 10 },
          { type: "finished", created_at: "2025-01-01T00:10:00Z" },
        ],
      }),
    ];
    selectedDetailJobId.value = "j1";
    expect(selectedLifecycleEvents.value).toHaveLength(2);
    expect(selectedLifecycleEvents.value[0].type).toBe("started");
    expect(selectedLifecycleEvents.value[1].type).toBe("finished");
  });
});

describe("useRecentJobs – selectedRoundEvents", () => {
  it("filters only round_progress events", () => {
    const deps = makeDeps();
    const { recentJobs, selectedDetailJobId, selectedRoundEvents } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({
        job_id: "j1",
        events: [
          { type: "started", created_at: "2025-01-01T00:00:00Z" },
          { type: "round_progress", round: 1, total_rounds: 10 },
          { type: "round_progress", round: 2, total_rounds: 10 },
          { type: "finished", created_at: "2025-01-01T00:10:00Z" },
        ],
      }),
    ];
    selectedDetailJobId.value = "j1";
    expect(selectedRoundEvents.value).toHaveLength(2);
    expect(selectedRoundEvents.value[0].round).toBe(1);
    expect(selectedRoundEvents.value[1].round).toBe(2);
  });
});

// ===========================================================================
// lifecycleDisplayEvents
// ===========================================================================

describe("useRecentJobs – lifecycleDisplayEvents", () => {
  it("maps events with formatters", () => {
    const deps = makeDeps();
    const { recentJobs, selectedDetailJobId, lifecycleDisplayEvents } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({
        job_id: "j1",
        events: [
          { type: "started", created_at: "2025-01-01T00:00:00Z", message: "Job started" },
        ],
      }),
    ];
    selectedDetailJobId.value = "j1";
    const display = lifecycleDisplayEvents.value;
    expect(display).toHaveLength(1);
    expect(display[0].icon).toBe("icon:started");
    expect(display[0].eventClass).toBe("event-started");
    expect(display[0].badgeClass).toBe("badge-started");
    expect(display[0].badgeText).toBe("Started");
    expect(display[0].time).toBe("formatted:2025-01-01T00:00:00Z");
    expect(display[0].message).toBe("Job started");
    expect(display[0].isFailed).toBe(false);
  });

  it("marks failed events with details as isFailed", () => {
    const deps = makeDeps();
    const { recentJobs, selectedDetailJobId, lifecycleDisplayEvents } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({
        job_id: "j1",
        events: [
          {
            type: "failed",
            created_at: "2025-01-01T00:05:00Z",
            message: "Training failed",
            details: { error: "OOM", traceback_summary: "Traceback..." },
          },
        ],
      }),
    ];
    selectedDetailJobId.value = "j1";
    const display = lifecycleDisplayEvents.value;
    expect(display[0].isFailed).toBe(true);
    expect(display[0].error).toBe("OOM");
    expect(display[0].traceback).toBe("Traceback...");
  });

  it("does not mark failed events without details as isFailed", () => {
    const deps = makeDeps();
    const { recentJobs, selectedDetailJobId, lifecycleDisplayEvents } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({
        job_id: "j1",
        events: [
          { type: "failed", created_at: "2025-01-01T00:05:00Z", message: "Failed" },
        ],
      }),
    ];
    selectedDetailJobId.value = "j1";
    expect(lifecycleDisplayEvents.value[0].isFailed).toBe(false);
  });
});

// ===========================================================================
// roundDisplayEvents
// ===========================================================================

describe("useRecentJobs – roundDisplayEvents", () => {
  it("maps round events with formatters", () => {
    const deps = makeDeps();
    const { recentJobs, selectedDetailJobId, roundDisplayEvents } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({
        job_id: "j1",
        events: [
          {
            type: "round_progress",
            round: 3,
            total_rounds: 10,
            created_at: "2025-01-01T00:03:00Z",
            metrics: { accuracy: 0.8, loss: 0.2, attack_success_rate: 0.05 },
          },
        ],
      }),
    ];
    selectedDetailJobId.value = "j1";
    const display = roundDisplayEvents.value;
    expect(display).toHaveLength(1);
    expect(display[0].badgeText).toBe("Round Progress");
    expect(display[0].roundLabel).toBe("Round 3/10");
    expect(display[0].time).toBe("formatted:2025-01-01T00:03:00Z");
    expect(display[0].hasMetrics).toBe(true);
    expect(display[0].accuracy).toBe(0.8);
    expect(display[0].loss).toBe(0.2);
    expect(display[0].asr).toBe(0.05);
  });

  it("handles missing metrics", () => {
    const deps = makeDeps();
    const { recentJobs, selectedDetailJobId, roundDisplayEvents } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({
        job_id: "j1",
        events: [
          { type: "round_progress", round: 1, total_rounds: 10, created_at: "2025-01-01T00:01:00Z" },
        ],
      }),
    ];
    selectedDetailJobId.value = "j1";
    const display = roundDisplayEvents.value;
    expect(display[0].hasMetrics).toBe(false);
    expect(display[0].accuracy).toBe("");
    expect(display[0].loss).toBe("");
    expect(display[0].asr).toBe("");
  });
});

// ===========================================================================
// detailExportItems
// ===========================================================================

describe("useRecentJobs – detailExportItems", () => {
  it("returns empty when no job selected", () => {
    const { detailExportItems } = useRecentJobs(makeDeps());
    expect(detailExportItems.value).toEqual([]);
  });

  it("returns empty when job has no report", () => {
    const deps = makeDeps();
    const { recentJobs, selectedDetailJobId, detailExportItems } =
      useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1", has_report: false })];
    selectedDetailJobId.value = "j1";
    expect(detailExportItems.value).toEqual([]);
  });

  it("returns export items for job with report", () => {
    const deps = makeDeps();
    deps.jobArtifactUrl = vi.fn((job, key) => {
      const map = {
        report_html: "http://example.com/report.html",
        metrics_csv: "http://example.com/metrics.csv",
        summary_md: "",
        metrics_json: "",
        config_json: "http://example.com/config.json",
      };
      return map[key] || "";
    });
    const { recentJobs, selectedDetailJobId, detailExportItems } =
      useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1", has_report: true })];
    selectedDetailJobId.value = "j1";
    const items = detailExportItems.value;
    expect(items).toHaveLength(5);
    expect(items[0].key).toBe("report_html");
    expect(items[0].icon).toBe("📊");
    expect(items[0].label).toBe("HTML Report");
    expect(items[0].disabled).toBe(false);
    expect(items[0].url).toContain("lang=zh");
    expect(items[2].disabled).toBe(true);
    expect(items[2].url).toBe("");
  });
});

// ===========================================================================
// toggleDetailJob
// ===========================================================================

describe("useRecentJobs – toggleDetailJob", () => {
  it("sets selectedDetailJobId", () => {
    const { selectedDetailJobId, toggleDetailJob } =
      useRecentJobs(makeDeps());
    toggleDetailJob("j1");
    expect(selectedDetailJobId.value).toBe("j1");
  });

  it("clears selectedDetailJobId when same id toggled", () => {
    const { selectedDetailJobId, toggleDetailJob } =
      useRecentJobs(makeDeps());
    toggleDetailJob("j1");
    toggleDetailJob("j1");
    expect(selectedDetailJobId.value).toBe("");
  });

  it("switches to different job", () => {
    const { selectedDetailJobId, toggleDetailJob } =
      useRecentJobs(makeDeps());
    toggleDetailJob("j1");
    toggleDetailJob("j2");
    expect(selectedDetailJobId.value).toBe("j2");
  });
});

// ===========================================================================
// saveRecentJobs
// ===========================================================================

describe("useRecentJobs – saveRecentJobs", () => {
  it("writes jobs to localStorage", () => {
    const deps = makeDeps();
    const { recentJobs, saveRecentJobs } = useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" }), makeJob({ job_id: "j2" })];
    saveRecentJobs();
    const stored = JSON.parse(
      window.localStorage.getItem("fedguardlab_recent_jobs")
    );
    expect(stored).toHaveLength(2);
    expect(stored[0].job_id).toBe("j1");
  });

  it("limits saved jobs to 20", () => {
    const deps = makeDeps();
    const { recentJobs, saveRecentJobs } = useRecentJobs(deps);
    recentJobs.value = Array.from({ length: 25 }, (_, i) =>
      makeJob({ job_id: `j${i}` })
    );
    saveRecentJobs();
    const stored = JSON.parse(
      window.localStorage.getItem("fedguardlab_recent_jobs")
    );
    expect(stored).toHaveLength(20);
  });
});

// ===========================================================================
// setJobArchived – success
// ===========================================================================

describe("useRecentJobs – setJobArchived success", () => {
  it("POSTs to archive endpoint and reloads", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobs: [] }),
      });

    const deps = makeDeps();
    const { recentJobs, setJobArchived } = useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    await setJobArchived(makeJob({ job_id: "j1" }), true);

    expect(fetchMock.mock.calls[0][0]).toContain("/jobs/j1/archive");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("POSTs to restore endpoint when archived is false", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobs: [] }),
      });

    const { setJobArchived } = useRecentJobs(makeDeps());
    await setJobArchived(makeJob({ job_id: "j1" }), false);

    expect(fetchMock.mock.calls[0][0]).toContain("/jobs/j1/restore");
  });

  it("removes job from selectedJobIds when archiving", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobs: [] }),
      });

    const deps = makeDeps();
    const { selectedJobIds, setJobArchived } = useRecentJobs(deps);
    selectedJobIds.value = ["j1", "j2"];
    await setJobArchived(makeJob({ job_id: "j1" }), true);
    expect(selectedJobIds.value).toEqual(["j2"]);
  });

  it("sets historyActionStatus to archiving/restoring then idle", async () => {
    let resolveArchive;
    const archivePromise = new Promise((resolve) => {
      resolveArchive = resolve;
    });

    fetchMock.mockImplementation((url) => {
      if (url.includes("/archive")) {
        return archivePromise.then(() => ({
          ok: true,
          json: () => Promise.resolve({}),
        }));
      }
      // loadRecentJobsFromApi reload
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jobs: [] }),
      });
    });

    const deps = makeDeps();
    const { historyActionStatus, setJobArchived } = useRecentJobs(deps);

    const promise = setJobArchived(makeJob({ job_id: "j1" }), true);

    // Archive fetch is pending, status should be "archiving"
    expect(historyActionStatus.value).toBe("archiving");

    // Resolve the archive fetch
    resolveArchive();
    await promise;

    // After finally block, status returns to idle
    expect(historyActionStatus.value).toBe("idle");
  });

  it("clears selectedDetailJobId when job is no longer visible", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobs: [] }),
      });

    const deps = makeDeps();
    const { selectedDetailJobId, setJobArchived } = useRecentJobs(deps);
    selectedDetailJobId.value = "j1";
    await setJobArchived(makeJob({ job_id: "j1" }), true);
    expect(selectedDetailJobId.value).toBe("");
  });
});

// ===========================================================================
// setJobArchived – failure
// ===========================================================================

describe("useRecentJobs – setJobArchived failure", () => {
  it("sets historyActionError on HTTP failure", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: "Cannot archive" }),
    });

    const deps = makeDeps();
    const { historyActionError, setJobArchived } = useRecentJobs(deps);
    await setJobArchived(makeJob({ job_id: "j1" }), true);
    expect(historyActionError.value).toBe("Cannot archive");
  });

  it("uses fallback message when detail missing", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const deps = makeDeps();
    const { historyActionError, setJobArchived } = useRecentJobs(deps);
    await setJobArchived(makeJob({ job_id: "j1" }), true);
    expect(historyActionError.value).toContain("Archive failed");
  });

  it("sets historyActionError on network failure", async () => {
    fetchMock.mockRejectedValue(new Error("Network fail"));

    const deps = makeDeps();
    const { historyActionError, setJobArchived } = useRecentJobs(deps);
    await setJobArchived(makeJob({ job_id: "j1" }), true);
    expect(historyActionError.value).toBe("Network fail");
  });

  it("resets historyActionStatus to idle after failure", async () => {
    fetchMock.mockRejectedValue(new Error("fail"));

    const deps = makeDeps();
    const { historyActionStatus, setJobArchived } = useRecentJobs(deps);
    await setJobArchived(makeJob({ job_id: "j1" }), true);
    expect(historyActionStatus.value).toBe("idle");
  });

  it("returns early when job has no job_id", async () => {
    const { setJobArchived } = useRecentJobs(makeDeps());
    await setJobArchived(null, true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// buildComparisonTitle
// ===========================================================================

describe("useRecentJobs – buildComparisonTitle", () => {
  it("returns default when no jobs selected", () => {
    const deps = makeDeps();
    const { buildComparisonTitle } = useRecentJobs(deps);
    expect(buildComparisonTitle()).toBe("FedGuardLab Experiment Comparison");
  });

  it("returns attack-based title when single attack selected", () => {
    const deps = makeDeps();
    const { recentJobs, selectedJobIds, buildComparisonTitle } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({ job_id: "j1", attack: "Label Flipping" }),
      makeJob({ job_id: "j2", attack: "Label Flipping" }),
    ];
    selectedJobIds.value = ["j1", "j2"];
    expect(buildComparisonTitle()).toBe("Label Flipping Aggregation Comparison");
  });

  it("returns aggregation comparison when multiple aggregations", () => {
    const deps = makeDeps();
    const { recentJobs, selectedJobIds, buildComparisonTitle } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({ job_id: "j1", attack: "unknown", aggregation: "FedAvg" }),
      makeJob({ job_id: "j2", attack: "unknown", aggregation: "Krum" }),
    ];
    selectedJobIds.value = ["j1", "j2"];
    expect(buildComparisonTitle()).toBe("Robust Aggregation Comparison");
  });

  it("returns default when single unknown attack and single aggregation", () => {
    const deps = makeDeps();
    const { recentJobs, selectedJobIds, buildComparisonTitle } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({ job_id: "j1", attack: "unknown", aggregation: "FedAvg" }),
      makeJob({ job_id: "j2", attack: "unknown", aggregation: "FedAvg" }),
    ];
    selectedJobIds.value = ["j1", "j2"];
    expect(buildComparisonTitle()).toBe("FedGuardLab Experiment Comparison");
  });
});

// ===========================================================================
// clearRecentJobs
// ===========================================================================

describe("useRecentJobs – clearRecentJobs", () => {
  it("clears recentJobs and selectedJobIds", () => {
    const deps = makeDeps();
    const { recentJobs, selectedJobIds, clearRecentJobs } =
      useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    selectedJobIds.value = ["j1"];
    clearRecentJobs();
    expect(recentJobs.value).toEqual([]);
    expect(selectedJobIds.value).toEqual([]);
  });

  it("calls onJobsCleared", () => {
    const deps = makeDeps();
    const { clearRecentJobs } = useRecentJobs(deps);
    clearRecentJobs();
    expect(deps.onJobsCleared).toHaveBeenCalled();
  });

  it("hides current job ids", () => {
    const deps = makeDeps();
    const { recentJobs, clearRecentJobs, loadHiddenJobIds } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({ job_id: "j1" }),
      makeJob({ job_id: "j2" }),
    ];
    clearRecentJobs();
    const hidden = loadHiddenJobIds();
    expect(hidden.has("j1")).toBe(true);
    expect(hidden.has("j2")).toBe(true);
  });

  it("removes recent_jobs from localStorage", () => {
    window.localStorage.setItem(
      "fedguardlab_recent_jobs",
      JSON.stringify([makeJob()])
    );
    const deps = makeDeps();
    const { clearRecentJobs } = useRecentJobs(deps);
    clearRecentJobs();
    expect(
      window.localStorage.getItem("fedguardlab_recent_jobs")
    ).toBeNull();
  });
});

// ===========================================================================
// deleteSelectedJobs
// ===========================================================================

describe("useRecentJobs – deleteSelectedJobs", () => {
  it("removes selected jobs from recentJobs", () => {
    const deps = makeDeps();
    const { recentJobs, selectedJobIds, deleteSelectedJobs } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({ job_id: "j1" }),
      makeJob({ job_id: "j2" }),
      makeJob({ job_id: "j3" }),
    ];
    selectedJobIds.value = ["j1", "j3"];
    deleteSelectedJobs();
    expect(recentJobs.value).toHaveLength(1);
    expect(recentJobs.value[0].job_id).toBe("j2");
  });

  it("clears selectedJobIds", () => {
    const deps = makeDeps();
    const { selectedJobIds, deleteSelectedJobs } = useRecentJobs(deps);
    selectedJobIds.value = ["j1"];
    deleteSelectedJobs();
    expect(selectedJobIds.value).toEqual([]);
  });

  it("hides deleted job ids", () => {
    const deps = makeDeps();
    const { recentJobs, selectedJobIds, deleteSelectedJobs, loadHiddenJobIds } =
      useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    selectedJobIds.value = ["j1"];
    deleteSelectedJobs();
    const hidden = loadHiddenJobIds();
    expect(hidden.has("j1")).toBe(true);
  });

  it("calls onJobsCleared", () => {
    const deps = makeDeps();
    const { selectedJobIds, deleteSelectedJobs } = useRecentJobs(deps);
    selectedJobIds.value = ["j1"];
    deleteSelectedJobs();
    expect(deps.onJobsCleared).toHaveBeenCalled();
  });

  it("saves remaining jobs to localStorage", () => {
    const deps = makeDeps();
    const { recentJobs, selectedJobIds, deleteSelectedJobs } =
      useRecentJobs(deps);
    recentJobs.value = [
      makeJob({ job_id: "j1" }),
      makeJob({ job_id: "j2" }),
    ];
    selectedJobIds.value = ["j1"];
    deleteSelectedJobs();
    const stored = JSON.parse(
      window.localStorage.getItem("fedguardlab_recent_jobs")
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].job_id).toBe("j2");
  });

  it("does nothing when no jobs selected", () => {
    const deps = makeDeps();
    const { recentJobs, deleteSelectedJobs } = useRecentJobs(deps);
    recentJobs.value = [makeJob({ job_id: "j1" })];
    deleteSelectedJobs();
    expect(recentJobs.value).toHaveLength(1);
  });
});

// ===========================================================================
// Returned interface
// ===========================================================================

describe("useRecentJobs – returned interface", () => {
  it("returns all expected properties", () => {
    const result = useRecentJobs(makeDeps());
    const expectedKeys = [
      "recentJobs",
      "jobStatusFilter",
      "jobArchiveFilter",
      "recentJobsLimit",
      "recentJobsSort",
      "selectedJobIds",
      "selectedDetailJobId",
      "historyActionError",
      "historyActionStatus",
      "canSelectJobForComparison",
      "comparableJobsCount",
      "historyArchiveFilterLabel",
      "toggleJobSelection",
      "loadHiddenJobIds",
      "saveHiddenJobIds",
      "hideJobIds",
      "unhideJobId",
      "loadRecentJobs",
      "mapApiJobToRecentJob",
      "loadRecentJobsFromApi",
      "selectedDetailJob",
      "recentJobsForDisplay",
      "selectedDetailArtifactsCount",
      "selectedJobsForPreview",
      "selectedLifecycleEvents",
      "selectedRoundEvents",
      "detailExportItems",
      "lifecycleDisplayEvents",
      "roundDisplayEvents",
      "toggleDetailJob",
      "setJobArchived",
      "saveRecentJobs",
      "buildComparisonTitle",
      "clearRecentJobs",
      "deleteSelectedJobs",
    ];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });
});
