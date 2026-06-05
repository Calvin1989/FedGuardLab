import { describe, it, expect } from "vitest";

import {
  titleizeDisplayValue,
  formatDisplayValue,
  formatMetricValue,
  formatComparisonMetric,
  formatStorageBytes,
  eventIcon,
  formatAttackDisplay,
  formatDefenseDisplay,
  formatEventMessage,
  formatEventTime,
  jobArtifactUrl,
  comparisonHistoryArtifactUrl,
  hasArtifacts,
} from "../dashboardFormatters.js";

// ---------------------------------------------------------------------------
// Pure value formatters
// ---------------------------------------------------------------------------

describe("titleizeDisplayValue", () => {
  it("returns em dash for null", () => {
    expect(titleizeDisplayValue(null)).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(titleizeDisplayValue(undefined)).toBe("—");
  });

  it("returns em dash for empty string", () => {
    expect(titleizeDisplayValue("")).toBe("—");
  });

  it("replaces underscores and capitalises words", () => {
    expect(titleizeDisplayValue("fed_avg")).toBe("Fed Avg");
  });

  it("capitalises single word", () => {
    expect(titleizeDisplayValue("none")).toBe("None");
  });

  it("handles mixed case", () => {
    expect(titleizeDisplayValue("label_flipping")).toBe("Label Flipping");
  });
});

describe("formatDisplayValue", () => {
  it("returns em dash for null", () => {
    expect(formatDisplayValue(null)).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(formatDisplayValue(undefined)).toBe("—");
  });

  it("returns em dash for empty string", () => {
    expect(formatDisplayValue("")).toBe("—");
  });

  it("returns string value as-is", () => {
    expect(formatDisplayValue("hello")).toBe("hello");
  });

  it("returns numeric value as-is", () => {
    expect(formatDisplayValue(42)).toBe(42);
  });
});

describe("formatMetricValue", () => {
  it("returns em dash for null", () => {
    expect(formatMetricValue(null)).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(formatMetricValue(undefined)).toBe("—");
  });

  it("returns em dash for empty string", () => {
    expect(formatMetricValue("")).toBe("—");
  });

  it("formats integer as string", () => {
    expect(formatMetricValue(10)).toBe("10");
  });

  it("formats float to 4 decimal places", () => {
    expect(formatMetricValue(0.123456789)).toBe("0.1235");
  });

  it("formats small float to 4 decimal places", () => {
    expect(formatMetricValue(0.1)).toBe("0.1000");
  });

  it("returns non-empty string as-is", () => {
    expect(formatMetricValue("n/a")).toBe("n/a");
  });
});

describe("formatComparisonMetric", () => {
  it("formats primitive number value", () => {
    expect(formatComparisonMetric(0.95)).toBe("0.9500");
  });

  it("extracts value from object", () => {
    expect(formatComparisonMetric({ value: 0.85 })).toBe("0.8500");
  });

  it("returns em dash for null", () => {
    expect(formatComparisonMetric(null)).toBe("—");
  });

  it("returns em dash for object with null value", () => {
    expect(formatComparisonMetric({ value: null })).toBe("—");
  });
});

describe("formatStorageBytes", () => {
  it("returns 0 B for zero", () => {
    expect(formatStorageBytes(0)).toBe("0 B");
  });

  it("returns 0 B for negative", () => {
    expect(formatStorageBytes(-100)).toBe("0 B");
  });

  it("returns 0 B for NaN", () => {
    expect(formatStorageBytes(NaN)).toBe("0 B");
  });

  it("returns 0 B for null", () => {
    expect(formatStorageBytes(null)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatStorageBytes(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatStorageBytes(1024)).toBe("1.00 KB");
  });

  it("formats megabytes", () => {
    expect(formatStorageBytes(1048576)).toBe("1.00 MB");
  });

  it("formats gigabytes", () => {
    expect(formatStorageBytes(1073741824)).toBe("1.00 GB");
  });

  it("formats fractional KB with 2 digits", () => {
    expect(formatStorageBytes(1536)).toBe("1.50 KB");
  });
});

describe("eventIcon", () => {
  it("returns icon for created", () => {
    expect(eventIcon("created")).toBe("🆕");
  });

  it("returns icon for started", () => {
    expect(eventIcon("started")).toBe("▶️");
  });

  it("returns icon for finished", () => {
    expect(eventIcon("finished")).toBe("✅");
  });

  it("returns icon for failed", () => {
    expect(eventIcon("failed")).toBe("❌");
  });

  it("returns icon for cancelled", () => {
    expect(eventIcon("cancelled")).toBe("⛔");
  });

  it("returns default icon for unknown type", () => {
    expect(eventIcon("unknown_event")).toBe("📌");
  });
});

// ---------------------------------------------------------------------------
// Context-dependent formatters
// ---------------------------------------------------------------------------

function makeEnContext(overrides = {}) {
  return {
    t: { value: { noneValue: "None", ...overrides.t } },
    language: { value: "en" },
  };
}

function makeZhContext(overrides = {}) {
  return {
    t: { value: { noneValue: "无", ...overrides.t } },
    language: { value: "zh" },
  };
}

describe("formatAttackDisplay", () => {
  it("returns em dash for null config", () => {
    expect(formatAttackDisplay(makeEnContext(), null)).toBe("—");
  });

  it("returns em dash for config with no type", () => {
    expect(formatAttackDisplay(makeEnContext(), {})).toBe("—");
  });

  it("returns noneValue for type none", () => {
    expect(formatAttackDisplay(makeEnContext(), { type: "none" })).toBe("None");
  });

  it("formats label_flipping in English", () => {
    const result = formatAttackDisplay(makeEnContext(), {
      type: "label_flipping",
      source_label: 3,
      target_label: 7,
    });
    expect(result).toBe("Label flip · 3→7");
  });

  it("formats label_flipping in Chinese", () => {
    const result = formatAttackDisplay(makeZhContext(), {
      type: "label_flipping",
      source_label: 3,
      target_label: 7,
    });
    expect(result).toBe("标签翻转 · 3→7");
  });

  it("formats backdoor in English", () => {
    const result = formatAttackDisplay(makeEnContext(), {
      type: "backdoor",
      target_label: 5,
    });
    expect(result).toBe("Backdoor · target 5");
  });

  it("formats backdoor in Chinese", () => {
    const result = formatAttackDisplay(makeZhContext(), {
      type: "backdoor",
      target_label: 5,
    });
    expect(result).toBe("后门攻击 · 目标 5");
  });

  it("titleizes unknown attack type", () => {
    expect(formatAttackDisplay(makeEnContext(), { type: "custom_attack" })).toBe(
      "Custom Attack"
    );
  });

  it("uses fallback value when type is missing", () => {
    expect(formatAttackDisplay(makeEnContext(), {}, "fallback")).toBe("Fallback");
  });
});

describe("formatDefenseDisplay", () => {
  it("returns em dash for null config", () => {
    expect(formatDefenseDisplay(makeEnContext(), null)).toBe("—");
  });

  it("returns noneValue for type none", () => {
    expect(formatDefenseDisplay(makeEnContext(), { type: "none" })).toBe("None");
  });

  it("titleizes known defense type", () => {
    expect(
      formatDefenseDisplay(makeEnContext(), { type: "trimmed_mean" })
    ).toBe("Trimmed Mean");
  });

  it("uses fallback value when type is missing", () => {
    expect(formatDefenseDisplay(makeEnContext(), {}, "fallback")).toBe("Fallback");
  });
});

describe("formatEventMessage", () => {
  it("returns empty string for null event", () => {
    expect(formatEventMessage(makeEnContext(), null)).toBe("");
  });

  it("returns English message as-is", () => {
    const ev = { type: "started", message: "Job started" };
    expect(formatEventMessage(makeEnContext(), ev)).toBe("Job started");
  });

  it("returns Chinese translation for known type", () => {
    const ev = { type: "finished", message: "done" };
    expect(formatEventMessage(makeZhContext(), ev)).toBe(
      "任务已完成"
    );
  });

  it("falls back to message for unknown Chinese type", () => {
    const ev = { type: "custom", message: "custom msg" };
    expect(formatEventMessage(makeZhContext(), ev)).toBe("custom msg");
  });
});

describe("formatEventTime", () => {
  it("returns em dash for null timestamp", () => {
    expect(formatEventTime(makeEnContext(), null)).toBe("—");
  });

  it("returns em dash for empty string", () => {
    expect(formatEventTime(makeEnContext(), "")).toBe("—");
  });

  it("formats valid ISO timestamp in English", () => {
    const result = formatEventTime(makeEnContext(), "2025-01-15T10:30:00Z");
    expect(result).not.toBe("—");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formats valid ISO timestamp in Chinese", () => {
    const result = formatEventTime(makeZhContext(), "2025-01-15T10:30:00Z");
    expect(result).not.toBe("—");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Artifact URL helpers
// ---------------------------------------------------------------------------

describe("jobArtifactUrl", () => {
  const API = "http://127.0.0.1:8000";

  it("returns empty string for null job", () => {
    expect(jobArtifactUrl(API, null, "report_html")).toBe("");
  });

  it("returns empty string for job without job_id", () => {
    expect(jobArtifactUrl(API, {}, "report_html")).toBe("");
  });

  it("returns artifact URL from artifacts object", () => {
    const job = {
      job_id: "j1",
      artifacts: { report_html_url: "http://example.com/report.html" },
    };
    expect(jobArtifactUrl(API, job, "report_html")).toBe(
      "http://example.com/report.html"
    );
  });

  it("returns fallback URL when artifacts key is missing but has_report is true", () => {
    const job = { job_id: "j1", has_report: true, artifacts: {} };
    expect(jobArtifactUrl(API, job, "report_html")).toBe(
      `${API}/reports/j1`
    );
  });

  it("returns fallback metrics_csv URL", () => {
    const job = { job_id: "j1", has_report: true, artifacts: {} };
    expect(jobArtifactUrl(API, job, "metrics_csv")).toBe(
      `${API}/reports/j1/metrics.csv`
    );
  });

  it("returns empty string when no artifacts and no report", () => {
    const job = { job_id: "j1", has_report: false, artifacts: {} };
    expect(jobArtifactUrl(API, job, "report_html")).toBe("");
  });

  it("returns empty string for unknown key", () => {
    const job = { job_id: "j1", has_report: true, artifacts: {} };
    expect(jobArtifactUrl(API, job, "unknown_key")).toBe("");
  });
});

describe("comparisonHistoryArtifactUrl", () => {
  const API = "http://127.0.0.1:8000";

  it("returns artifact URL from artifacts object", () => {
    const item = {
      comparison_id: "c1",
      artifacts: { comparison_html_url: "http://example.com/comp.html" },
    };
    expect(comparisonHistoryArtifactUrl(API, item, "comparison_html_url")).toBe(
      "http://example.com/comp.html"
    );
  });

  it("returns fallback URL when artifact key is missing", () => {
    const item = { comparison_id: "c1", artifacts: {} };
    expect(comparisonHistoryArtifactUrl(API, item, "comparison_html_url")).toBe(
      `${API}/comparisons/c1`
    );
  });

  it("returns fallback csv URL", () => {
    const item = { comparison_id: "c1", artifacts: {} };
    expect(comparisonHistoryArtifactUrl(API, item, "comparison_csv_url")).toBe(
      `${API}/comparisons/c1/comparison.csv`
    );
  });

  it("returns empty string for null item", () => {
    expect(comparisonHistoryArtifactUrl(API, null, "comparison_html_url")).toBe(
      ""
    );
  });

  it("returns empty string when no comparison_id", () => {
    expect(
      comparisonHistoryArtifactUrl(API, { artifacts: {} }, "comparison_html_url")
    ).toBe("");
  });
});

describe("hasArtifacts", () => {
  it("returns true when artifactUrlFn returns a non-empty string", () => {
    const fakeFn = (_job, key) => (key === "report_html" ? "http://x" : "");
    expect(hasArtifacts({ job_id: "j1" }, fakeFn)).toBe(true);
  });

  it("returns false when artifactUrlFn returns empty for all keys", () => {
    const fakeFn = () => "";
    expect(hasArtifacts({ job_id: "j1" }, fakeFn)).toBe(false);
  });
});
