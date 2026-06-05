// Pure formatter helpers — no Vue imports, no App.vue state access.

export function titleizeDisplayValue(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDisplayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

export function formatMetricValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(4);
  }

  return value;
}

export function formatComparisonMetric(value) {
  const rawValue =
    typeof value === "object" && value !== null ? value.value : value;
  return formatMetricValue(rawValue);
}

export function formatStorageBytes(value) {
  const bytes = Number(value || 0);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const digits = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(digits)} ${units[unitIndex]}`;
}

export function eventIcon(type) {
  const icons = {
    created: "🆕",
    started: "▶️",
    round_progress: "🔄",
    artifact_written: "📦",
    finished: "✅",
    failed: "❌",
    cancelled: "⛔",
    archived: "📌",
    restored: "↩️",
  };
  return icons[type] || "📌";
}

// --- Context-dependent formatters ---

export function formatAttackDisplay(context, attackConfig, fallbackValue = "") {
  const { t, language } = context;
  const type = attackConfig?.type || fallbackValue;

  if (!type || type === "—") {
    return "—";
  }

  if (type === "none") {
    return t.value.noneValue;
  }

  if (type === "label_flipping") {
    const source = attackConfig?.source_label ?? "?";
    const target = attackConfig?.target_label ?? "?";
    return language.value === "zh"
      ? `标签翻转 · ${source}→${target}`
      : `Label flip · ${source}→${target}`;
  }

  if (type === "backdoor") {
    const target = attackConfig?.target_label ?? "?";
    return language.value === "zh"
      ? `后门攻击 · 目标 ${target}`
      : `Backdoor · target ${target}`;
  }

  return titleizeDisplayValue(type);
}

export function formatDefenseDisplay(
  context,
  defenseConfig,
  fallbackValue = ""
) {
  const { t } = context;
  const type = defenseConfig?.type || fallbackValue;

  if (!type || type === "—") {
    return "—";
  }

  if (type === "none") {
    return t.value.noneValue;
  }

  return titleizeDisplayValue(type);
}

export function formatEventMessage(context, ev) {
  const { language } = context;

  if (!ev) {
    return "";
  }

  if (language.value !== "zh") {
    return ev.message || "";
  }

  const messages = {
    created: "任务已创建",
    started: "任务已启动",
    artifact_written: "实验产物已保存",
    finished: "任务已完成",
    failed: "任务失败",
    cancelled: "任务已取消",
    archived: "任务已归档",
    restored: "任务已恢复",
    round_progress: "训练进度已更新",
  };

  return messages[ev.type] || ev.message || "";
}

export function formatEventTime(context, ts) {
  const { language } = context;

  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return d.toLocaleString(language.value === "zh" ? "zh-CN" : "en-US");
  } catch {
    return ts;
  }
}

// --- Artifact URL helpers ---

export function jobArtifactUrl(API_BASE, job, key) {
  if (!job?.job_id) {
    return "";
  }

  const artifacts = job.artifacts || {};
  const urlKeys = {
    report_html: "report_html_url",
    metrics_csv: "metrics_csv_url",
    summary_md: "summary_md_url",
    metrics_json: "metrics_json_url",
    config_json: "config_json_url",
  };

  const urlKey = urlKeys[key];
  if (urlKey && artifacts[urlKey]) {
    return artifacts[urlKey];
  }

  if (!job.has_report) {
    return "";
  }

  const fallbackUrls = {
    report_html: `${API_BASE}/reports/${job.job_id}`,
    metrics_csv: `${API_BASE}/reports/${job.job_id}/metrics.csv`,
    summary_md: `${API_BASE}/reports/${job.job_id}/report.md`,
    metrics_json: `${API_BASE}/reports/${job.job_id}/metrics.json`,
    config_json: `${API_BASE}/reports/${job.job_id}/config.json`,
  };

  return fallbackUrls[key] || "";
}

export function comparisonHistoryArtifactUrl(API_BASE, item, key) {
  const artifacts = item?.artifacts || {};

  if (artifacts[key]) {
    return artifacts[key];
  }

  if (!item?.comparison_id) {
    return "";
  }

  const baseUrl = `${API_BASE}/comparisons/${item.comparison_id}`;
  const fallbackUrls = {
    comparison_html_url: baseUrl,
    comparison_csv_url: `${baseUrl}/comparison.csv`,
    comparison_json_url: `${baseUrl}/comparison.json`,
  };

  return fallbackUrls[key] || "";
}

export function hasArtifacts(job, artifactUrlFn) {
  return Boolean(
    artifactUrlFn(job, "report_html") ||
      artifactUrlFn(job, "metrics_csv") ||
      artifactUrlFn(job, "summary_md") ||
      artifactUrlFn(job, "metrics_json") ||
      artifactUrlFn(job, "config_json")
  );
}
