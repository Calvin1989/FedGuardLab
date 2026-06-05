import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ref, computed, nextTick } from "vue";
import { useSystemStatus } from "../useSystemStatus.js";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function makeDeps(overrides = {}) {
  const language = ref("zh");
  const t = computed(() => ({}));

  return {
    API_BASE: "http://localhost:8000",
    t,
    language,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useSystemStatus", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------

  it("starts with idle status", () => {
    const deps = makeDeps();
    const { apiStatus, apiStatusError, lastCheckedAt, apiStatusLabel, apiStatusTone } =
      useSystemStatus(deps);

    expect(apiStatus.value).toBe("idle");
    expect(apiStatusError.value).toBe("");
    expect(lastCheckedAt.value).toBeNull();
    expect(apiStatusLabel.value).toBe("未知");
    expect(apiStatusTone.value).toBe("neutral");
  });

  it("starts with English labels when language is en", () => {
    const deps = makeDeps({ language: ref("en") });
    const { apiStatusLabel } = useSystemStatus(deps);

    expect(apiStatusLabel.value).toBe("Unknown");
  });

  // ---------------------------------------------------------------------------
  // checkApiStatus success
  // ---------------------------------------------------------------------------

  it("sets online status on successful fetch", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const deps = makeDeps();
    const { apiStatus, apiStatusError, lastCheckedAt, apiStatusLabel, apiStatusTone, checkApiStatus } =
      useSystemStatus(deps);

    await checkApiStatus();

    expect(globalThis.fetch).toHaveBeenCalledWith("http://localhost:8000/configs");
    expect(apiStatus.value).toBe("online");
    expect(apiStatusError.value).toBe("");
    expect(lastCheckedAt.value).toBeTruthy();
    expect(apiStatusLabel.value).toBe("在线");
    expect(apiStatusTone.value).toBe("success");
  });

  it("sets online status with English labels on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const deps = makeDeps({ language: ref("en") });
    const { apiStatusLabel, apiStatusTone, checkApiStatus } = useSystemStatus(deps);

    await checkApiStatus();

    expect(apiStatusLabel.value).toBe("Online");
    expect(apiStatusTone.value).toBe("success");
  });

  // ---------------------------------------------------------------------------
  // checkApiStatus HTTP failure
  // ---------------------------------------------------------------------------

  it("sets offline status on HTTP error response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const deps = makeDeps();
    const { apiStatus, apiStatusError, lastCheckedAt, apiStatusLabel, apiStatusTone, checkApiStatus } =
      useSystemStatus(deps);

    await checkApiStatus();

    expect(apiStatus.value).toBe("offline");
    expect(apiStatusError.value).toBe("HTTP 500");
    expect(lastCheckedAt.value).toBeTruthy();
    expect(apiStatusLabel.value).toBe("离线");
    expect(apiStatusTone.value).toBe("error");
  });

  // ---------------------------------------------------------------------------
  // checkApiStatus network error
  // ---------------------------------------------------------------------------

  it("sets offline status on network error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    const deps = makeDeps();
    const { apiStatus, apiStatusError, lastCheckedAt, apiStatusLabel, apiStatusTone, checkApiStatus } =
      useSystemStatus(deps);

    await checkApiStatus();

    expect(apiStatus.value).toBe("offline");
    expect(apiStatusError.value).toBe("Failed to fetch");
    expect(lastCheckedAt.value).toBeTruthy();
    expect(apiStatusLabel.value).toBe("离线");
    expect(apiStatusTone.value).toBe("error");
  });

  it("sets offline status with fallback message on network error without message", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error());

    const deps = makeDeps();
    const { apiStatus, apiStatusError, checkApiStatus } = useSystemStatus(deps);

    await checkApiStatus();

    expect(apiStatus.value).toBe("offline");
    expect(apiStatusError.value).toBe("Network error");
  });

  // ---------------------------------------------------------------------------
  // Checking state
  // ---------------------------------------------------------------------------

  it("sets checking status during fetch", async () => {
    let resolveFetch;
    globalThis.fetch = vi.fn().mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );

    const deps = makeDeps();
    const { apiStatus, apiStatusLabel, apiStatusTone, checkApiStatus } = useSystemStatus(deps);

    const checkPromise = checkApiStatus();

    expect(apiStatus.value).toBe("checking");
    expect(apiStatusLabel.value).toBe("检查中...");
    expect(apiStatusTone.value).toBe("pending");

    resolveFetch({ ok: true, status: 200 });
    await checkPromise;

    expect(apiStatus.value).toBe("online");
  });

  // ---------------------------------------------------------------------------
  // Repeatable refresh
  // ---------------------------------------------------------------------------

  it("supports repeated refresh calls", async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: false, status: 503 });

    const deps = makeDeps();
    const { apiStatus, apiStatusError, checkApiStatus } = useSystemStatus(deps);

    await checkApiStatus();
    expect(apiStatus.value).toBe("online");
    expect(apiStatusError.value).toBe("");

    await checkApiStatus();
    expect(apiStatus.value).toBe("offline");
    expect(apiStatusError.value).toBe("HTTP 503");
  });

  // ---------------------------------------------------------------------------
  // apiStatusTone computed
  // ---------------------------------------------------------------------------

  it("returns correct tone for each status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const deps = makeDeps();
    const { apiStatusTone, apiStatus, checkApiStatus } = useSystemStatus(deps);

    expect(apiStatusTone.value).toBe("neutral");

    apiStatus.value = "checking";
    expect(apiStatusTone.value).toBe("pending");

    await checkApiStatus();
    expect(apiStatusTone.value).toBe("success");

    apiStatus.value = "offline";
    expect(apiStatusTone.value).toBe("error");
  });
});
