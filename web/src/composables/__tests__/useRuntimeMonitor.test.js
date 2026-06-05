import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { computed, ref } from "vue";

// ---------------------------------------------------------------------------
// Mock onBeforeUnmount before importing the composable
// ---------------------------------------------------------------------------

const lifecycleCallbacks = [];
vi.mock("vue", async () => {
  const actual = await vi.importActual("vue");
  return {
    ...actual,
    onBeforeUnmount: (cb) => {
      lifecycleCallbacks.push(cb);
    },
  };
});

import { useRuntimeMonitor } from "../useRuntimeMonitor.js";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const mockMessages = {
  accuracy: "Accuracy",
  loss: "Loss",
  asr: "ASR",
  chartTitle: "Training Metrics",
};

function makeDeps(overrides = {}) {
  return {
    API_BASE: "http://localhost:8000",
    WS_BASE: "ws://localhost:8000",
    t: computed(() => mockMessages),
    selectedConfig: ref("configs/demo.yaml"),
    getSelectedExperimentLabel: vi.fn(() => "Demo Experiment"),
    onExperimentFinished: vi.fn(),
    errorMessage: ref(""),
    ...overrides,
  };
}

function makeMetric(overrides = {}) {
  return {
    round: 1,
    accuracy: 0.85,
    loss: 0.35,
    attack_success_rate: 0.05,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fake WebSocket
// ---------------------------------------------------------------------------

class FakeWebSocket {
  constructor(url) {
    this.url = url;
    this.send = vi.fn();
    this.close = vi.fn();
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    FakeWebSocket.instances.push(this);
  }

  static instances = [];
  static reset() {
    FakeWebSocket.instances = [];
  }
}

// ---------------------------------------------------------------------------
// fetch / WebSocket mock setup
// ---------------------------------------------------------------------------

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock;
  globalThis.WebSocket = FakeWebSocket;
  FakeWebSocket.reset();
  lifecycleCallbacks.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.fetch;
  delete globalThis.WebSocket;
});

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – initial state", () => {
  it("jobId is empty", () => {
    const { jobId } = useRuntimeMonitor(makeDeps());
    expect(jobId.value).toBe("");
  });

  it("status is idle", () => {
    const { status } = useRuntimeMonitor(makeDeps());
    expect(status.value).toBe("idle");
  });

  it("metrics is empty array", () => {
    const { metrics } = useRuntimeMonitor(makeDeps());
    expect(metrics.value).toEqual([]);
  });

  it("reportUrl is empty", () => {
    const { reportUrl } = useRuntimeMonitor(makeDeps());
    expect(reportUrl.value).toBe("");
  });

  it("errorMessage uses the provided ref", () => {
    const deps = makeDeps();
    deps.errorMessage.value = "preset";
    const { errorMessage } = useRuntimeMonitor(deps);
    expect(errorMessage.value).toBe("preset");
  });
});

// ---------------------------------------------------------------------------
// latestMetric
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – latestMetric", () => {
  it("returns null when metrics is empty", () => {
    const { latestMetric } = useRuntimeMonitor(makeDeps());
    expect(latestMetric.value).toBeNull();
  });

  it("returns the last metric after startExperiment", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { latestMetric, metrics, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({ data: JSON.stringify(makeMetric({ round: 1 })) });
    expect(latestMetric.value.round).toBe(1);

    socket.onmessage({ data: JSON.stringify(makeMetric({ round: 2 })) });
    expect(latestMetric.value.round).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// chartData
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – chartData", () => {
  it("has correct labels, datasets structure with no metrics", () => {
    const { chartData } = useRuntimeMonitor(makeDeps());
    expect(chartData.value.labels).toEqual([]);
    expect(chartData.value.datasets).toHaveLength(3);
    expect(chartData.value.datasets[0].label).toBe("Accuracy");
    expect(chartData.value.datasets[1].label).toBe("Loss");
    expect(chartData.value.datasets[2].label).toBe("ASR");
  });

  it("maps metrics to chart labels and data", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { chartData, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({
      data: JSON.stringify(
        makeMetric({ round: 1, accuracy: 0.9, loss: 0.2, attack_success_rate: 0.01 })
      ),
    });
    socket.onmessage({
      data: JSON.stringify(
        makeMetric({ round: 2, accuracy: 0.95, loss: 0.1, attack_success_rate: 0.005 })
      ),
    });

    expect(chartData.value.labels).toEqual([1, 2]);
    expect(chartData.value.datasets[0].data).toEqual([0.9, 0.95]);
    expect(chartData.value.datasets[1].data).toEqual([0.2, 0.1]);
    expect(chartData.value.datasets[2].data).toEqual([0.01, 0.005]);
  });

  it("datasets have correct styling properties", () => {
    const { chartData } = useRuntimeMonitor(makeDeps());
    const ds = chartData.value.datasets[0];
    expect(ds.borderColor).toBe("#2563eb");
    expect(ds.borderWidth).toBe(3);
    expect(ds.tension).toBe(0.35);
    expect(ds.pointRadius).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// chartOptions
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – chartOptions", () => {
  it("has responsive and maintainAspectRatio false", () => {
    const { chartOptions } = useRuntimeMonitor(makeDeps());
    expect(chartOptions.value.responsive).toBe(true);
    expect(chartOptions.value.maintainAspectRatio).toBe(false);
  });

  it("has legend at top", () => {
    const { chartOptions } = useRuntimeMonitor(makeDeps());
    expect(chartOptions.value.plugins.legend.position).toBe("top");
  });

  it("has title with chartTitle text", () => {
    const { chartOptions } = useRuntimeMonitor(makeDeps());
    expect(chartOptions.value.plugins.title.display).toBe(true);
    expect(chartOptions.value.plugins.title.text).toBe("Training Metrics");
  });

  it("has y-axis beginAtZero", () => {
    const { chartOptions } = useRuntimeMonitor(makeDeps());
    expect(chartOptions.value.scales.y.beginAtZero).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// startExperiment – success
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – startExperiment success", () => {
  it("POSTs to /run with config_path", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/run",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"config_path":"configs/demo.yaml"'),
      })
    );
  });

  it("sets jobId from response", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-abc" }),
    });

    const { jobId, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();

    expect(jobId.value).toBe("job-abc");
  });

  it("sets status to running after successful job creation", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { status, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();

    expect(status.value).toBe("running");
  });

  it("creates WebSocket with correct URL", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-42" }),
    });

    const { startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0].url).toBe(
      "ws://localhost:8000/ws/job-42"
    );
  });

  it("clears metrics, jobId, reportUrl, and errorMessage before start", async () => {
    const deps = makeDeps();
    deps.errorMessage.value = "old error";

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { metrics, reportUrl, errorMessage, status, startExperiment } =
      useRuntimeMonitor(deps);

    // Pre-set some state
    metrics.value = [makeMetric()];

    await startExperiment();

    expect(metrics.value).toEqual([]);
    expect(reportUrl.value).toBe("");
    expect(errorMessage.value).toBe("");
    expect(status.value).toBe("running");
  });
});

// ---------------------------------------------------------------------------
// startExperiment – HTTP failure
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – startExperiment HTTP failure", () => {
  it("sets errorMessage and status to error on non-ok response", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const { errorMessage, status, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();

    expect(errorMessage.value).toContain("Failed to create run");
    expect(status.value).toBe("error");
  });

  it("includes the status code in the error message", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });

    const { errorMessage, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();

    expect(errorMessage.value).toContain("404");
  });
});

// ---------------------------------------------------------------------------
// startExperiment – network error
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – startExperiment network error", () => {
  it("sets errorMessage and status to error on network failure", async () => {
    const deps = makeDeps();
    fetchMock.mockRejectedValue(new Error("Network fail"));

    const { errorMessage, status, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();

    expect(errorMessage.value).toBe("Network fail");
    expect(status.value).toBe("error");
  });

  it("does not throw", async () => {
    const deps = makeDeps();
    fetchMock.mockRejectedValue(new Error("fail"));

    const { startExperiment } = useRuntimeMonitor(deps);
    await expect(startExperiment()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// WebSocket – metric messages
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – WebSocket metric messages", () => {
  it("appends metric data to metrics array", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { metrics, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({ data: JSON.stringify(makeMetric({ round: 1 })) });
    expect(metrics.value).toHaveLength(1);
    expect(metrics.value[0].round).toBe(1);

    socket.onmessage({ data: JSON.stringify(makeMetric({ round: 2 })) });
    expect(metrics.value).toHaveLength(2);
    expect(metrics.value[1].round).toBe(2);
  });

  it("preserves accuracy, loss, and attack_success_rate from messages", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { metrics, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({
      data: JSON.stringify(
        makeMetric({ accuracy: 0.92, loss: 0.18, attack_success_rate: 0.03 })
      ),
    });

    expect(metrics.value[0].accuracy).toBe(0.92);
    expect(metrics.value[0].loss).toBe(0.18);
    expect(metrics.value[0].attack_success_rate).toBe(0.03);
  });
});

// ---------------------------------------------------------------------------
// WebSocket – progress/status messages
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – WebSocket status messages", () => {
  it("handles error messages from WebSocket", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { errorMessage, status, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({
      data: JSON.stringify({ error: "Training diverged" }),
    });

    expect(errorMessage.value).toBe("Training diverged");
    expect(status.value).toBe("error");
    expect(socket.close).toHaveBeenCalled();
  });

  it("handles cancelled event from WebSocket", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { status, errorMessage, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({
      data: JSON.stringify({ event: "cancelled" }),
    });

    expect(status.value).toBe("cancelled");
    expect(errorMessage.value).toBe("");
    expect(socket.close).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// WebSocket – finished message
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – WebSocket finished message", () => {
  it("sets status to finished", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { status, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({
      data: JSON.stringify({ event: "finished" }),
    });

    expect(status.value).toBe("finished");
  });

  it("sets reportUrl with job id", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-99" }),
    });

    const { reportUrl, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({
      data: JSON.stringify({ event: "finished" }),
    });

    expect(reportUrl.value).toBe("http://localhost:8000/reports/job-99");
  });

  it("calls onExperimentFinished with correct data", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    // Add a metric first so finalMetric is not empty
    socket.onmessage({ data: JSON.stringify(makeMetric({ round: 1 })) });

    socket.onmessage({
      data: JSON.stringify({ event: "finished" }),
    });

    expect(deps.onExperimentFinished).toHaveBeenCalledWith({
      jobId: "job-1",
      finalMetric: makeMetric({ round: 1 }),
      experimentName: "Demo Experiment",
      selectedConfig: "configs/demo.yaml",
      metricsCount: 1,
      reportUrl: "http://localhost:8000/reports/job-1",
    });
  });

  it("calls onExperimentFinished with empty finalMetric when no metrics", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({
      data: JSON.stringify({ event: "finished" }),
    });

    expect(deps.onExperimentFinished).toHaveBeenCalledWith(
      expect.objectContaining({
        finalMetric: {},
        metricsCount: 0,
      })
    );
  });

  it("closes socket on finished", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({
      data: JSON.stringify({ event: "finished" }),
    });

    expect(socket.close).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// WebSocket – error
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – WebSocket error", () => {
  it("sets errorMessage and status to error on socket error", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { errorMessage, status, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onerror();

    expect(errorMessage.value).toBe("WebSocket connection error");
    expect(status.value).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// WebSocket – close while running
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – WebSocket close while running", () => {
  it("sets status to disconnected when close fires while running", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { status, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    expect(status.value).toBe("running");
    socket.onclose();

    expect(status.value).toBe("disconnected");
  });

  it("does not change status if already finished when close fires", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { status, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onmessage({
      data: JSON.stringify({ event: "finished" }),
    });
    expect(status.value).toBe("finished");

    socket.onclose();
    expect(status.value).toBe("finished");
  });

  it("does not change status if error when close fires", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { status, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    socket.onerror();
    expect(status.value).toBe("error");

    socket.onclose();
    expect(status.value).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// cancelCurrentJob – no jobId
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – cancelCurrentJob no jobId", () => {
  it("returns early when jobId is empty", async () => {
    const deps = makeDeps();
    const { cancelCurrentJob } = useRuntimeMonitor(deps);

    await cancelCurrentJob();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// cancelCurrentJob – success
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – cancelCurrentJob success", () => {
  it("POSTs to /jobs/{jobId}/cancel", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ job_id: "job-1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    const { cancelCurrentJob, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    await cancelCurrentJob();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/jobs/job-1/cancel",
      { method: "POST" }
    );
  });

  it("sets status to cancelled on success", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ job_id: "job-1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    const { status, cancelCurrentJob, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();
    await cancelCurrentJob();

    expect(status.value).toBe("cancelled");
  });

  it("clears errorMessage on success", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ job_id: "job-1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    const { errorMessage, cancelCurrentJob, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();
    await cancelCurrentJob();

    expect(errorMessage.value).toBe("");
  });

  it("closes socket on successful cancel", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ job_id: "job-1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    const { cancelCurrentJob, startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const socket = FakeWebSocket.instances[0];

    await cancelCurrentJob();

    expect(socket.close).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// cancelCurrentJob – failure
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – cancelCurrentJob failure", () => {
  it("sets errorMessage on HTTP failure", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ job_id: "job-1" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: "Cannot cancel" }),
      });

    const { errorMessage, cancelCurrentJob, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();
    await cancelCurrentJob();

    expect(errorMessage.value).toBe("Cannot cancel");
  });

  it("sets errorMessage with status code when detail is missing", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ job_id: "job-1" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

    const { errorMessage, cancelCurrentJob, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();
    await cancelCurrentJob();

    expect(errorMessage.value).toContain("Failed to cancel job");
    expect(errorMessage.value).toContain("500");
  });

  it("sets errorMessage on network error", async () => {
    const deps = makeDeps();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ job_id: "job-1" }),
      })
      .mockRejectedValueOnce(new Error("Network fail"));

    const { errorMessage, cancelCurrentJob, startExperiment } =
      useRuntimeMonitor(deps);
    await startExperiment();
    await cancelCurrentJob();

    expect(errorMessage.value).toBe("Network fail");
  });
});

// ---------------------------------------------------------------------------
// startExperiment – cleans up existing socket
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – startExperiment cleanup", () => {
  it("closes previous socket when starting a new experiment", async () => {
    const deps = makeDeps();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-1" }),
    });

    const { startExperiment } = useRuntimeMonitor(deps);
    await startExperiment();
    const firstSocket = FakeWebSocket.instances[0];

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: "job-2" }),
    });

    await startExperiment();

    expect(firstSocket.close).toHaveBeenCalled();
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(FakeWebSocket.instances[1].url).toBe("ws://localhost:8000/ws/job-2");
  });
});

// ---------------------------------------------------------------------------
// Returned interface
// ---------------------------------------------------------------------------

describe("useRuntimeMonitor – returned interface", () => {
  it("returns all expected properties", () => {
    const result = useRuntimeMonitor(makeDeps());

    const expectedKeys = [
      "jobId",
      "status",
      "metrics",
      "errorMessage",
      "reportUrl",
      "latestMetric",
      "chartData",
      "chartOptions",
      "cancelCurrentJob",
      "startExperiment",
    ];

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });
});
