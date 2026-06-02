<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
);

const API_BASE = "http://127.0.0.1:8000";
const WS_BASE = "ws://127.0.0.1:8000";

const jobId = ref("");
const status = ref("idle");
const metrics = ref([]);
const errorMessage = ref("");
const reportUrl = ref("");
const selectedConfig = ref("");

const recentJobs = ref([]);
const jobStatusFilter = ref("all");
const recentJobsLimit = ref(20);
const recentJobsSort = ref("created_at_desc");
const selectedJobIds = ref([]);
const selectedDetailJobId = ref("");
const RECENT_JOBS_STORAGE_KEY = "fedguardlab_recent_jobs";
const HIDDEN_JOBS_STORAGE_KEY = "fedguardlab_hidden_jobs";
const LANGUAGE_STORAGE_KEY = "fedguardlab_language";

const language = ref(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || "zh");

const messages = {
  zh: {
    eyebrow: "FedGuardLab",
    heroTitle: "联邦学习安全实验平台",
    heroSubtitle: "运行 FL 安全实验，实时查看指标，对比攻防效果。",
    categoryLabel: "分类",
    allCategories: "全部分类",
    experimentLabel: "实验",
    noConfigsForCategory: "当前分类没有可用配置。",
    configPreview: "配置预览",
    previewDataset: "数据集",
    previewPartition: "数据分布",
    previewAggregation: "聚合方式",
    previewAttack: "攻击",
    previewDefense: "防御",
    previewRounds: "训练轮数",
    previewClients: "客户端数",
    previewMalicious: "恶意客户端",
    previewLocalEpochs: "本地 Epoch",
    previewBatchSize: "批大小",
    previewLearningRate: "学习率",
    previewRiskLevel: "风险级别",
    previewRecommendedUse: "推荐用途",
    previewExplanation: "参数说明",
    previewDetails: "展开详情",
    riskLevels: {
      none: "无风险",
      low: "低",
      medium: "中",
      high: "高",
    },
    runExperiment: "运行实验",
    running: "运行中...",
    cancelExperiment: "取消实验",
    statusLabel: "状态",
    jobLabel: "任务 ID",
    errorLabel: "错误",
    reportLabel: "报告",
    openHtmlReport: "查看 HTML 报告",
    round: "轮次",
    accuracy: "准确率",
    loss: "损失",
    asr: "攻击成功率",
    chartTitle: "实时联邦学习指标",
    emptyChart: "启动新实验以查看实时指标。已完成的实验将保存在下方的对比历史中。",
    comparisonTitle: "实验对比",
    comparisonHint: "选择至少两个已完成的实验，生成对比报告。",
    statusFilter: "状态",
    allStatuses: "全部状态",
    finishedWithReport: "已完成（报告）",
    limitFilter: "数量",
    sortFilter: "排序",
    newestFirst: "最新优先",
    oldestFirst: "最早优先",
    deleteSelected: "删除所选",
    clearHistory: "清空历史",
    generateReport: "生成对比报告",
    generating: "生成中...",
    emptyAll: "已完成且有报告的实验将显示在这里。",
    emptyAllStatuses: "暂无任务记录。",
    emptyFiltered: "没有找到{status}的任务。",
    tableSelect: "选择",
    tableExperiment: "实验",
    tableAggregation: "聚合",
    tableDefense: "防御",
    tableAttack: "攻击",
    tableAccuracy: "准确率",
    tableLoss: "损失",
    tableAsr: "ASR",
    tableArtifacts: "产物",
    tableReport: "报告",
    badgeReport: "报告",
    badgeArtifacts: "产物",
    badgeNoReport: "无报告",
    open: "查看",
    notReady: "未就绪",
    jobDetailTitle: "任务详情",
    jobDetailId: "任务 ID",
    jobDetailStatus: "状态",
    jobDetailConfig: "配置路径",
    jobDetailCreated: "创建时间",
    jobDetailStarted: "开始时间",
    jobDetailFinished: "完成时间",
    jobDetailReport: "报告",
    jobDetailArtifacts: "产物数量",
    openReport: "查看报告",
    notAvailable: "暂无",
    available: "可用",
    jobDetailHint: "点击任务行查看详情。",
    comparisonLabel: "对比",
    openComparisonReport: "查看对比报告",
    selectAtLeastTwo: "请至少选择两个已完成的实验。",
    selectedJobsTitle: "已选择实验",
    selectedJobsCount: "已选择 {count} 个实验",
    selectedJobsHint: "至少需要选择 2 个实验才能生成对比报告。",
    comparisonCreating: "正在生成对比报告…",
    comparisonSuccess: "对比报告已生成。",
    comparisonFailed: "对比报告生成失败。",
    comparisonExportsTitle: "对比导出",
    insightsTitle: "结果洞察",
    bestAccuracy: "最佳准确率",
    lowestLoss: "最低损失",
    lowestAsr: "最低 ASR",
    recommended: "推荐实验",
    tradeoff: "权衡分析",
    riskHint: "风险提示",
    noInsights: "暂无洞察数据",
    exportsTitle: "导出文件",
    exportHtmlReport: "HTML 报告",
    exportCsvMetrics: "CSV 指标",
    exportMarkdownReport: "Markdown 报告",
    comparisonHtmlReport: "对比 HTML 报告",
    comparisonCsv: "对比 CSV",
    comparisonJson: "对比 JSON",
    eventTimeline: "事件时间线",
    eventRound: "轮次",
    eventFailureReason: "失败原因",
    noEvents: "暂无事件记录",
    eventType: {
      created: "已创建",
      started: "已启动",
      round_progress: "训练进度",
      artifact_written: "产物已保存",
      finished: "已完成",
      failed: "失败",
      cancelled: "已取消",
    },
    statusValues: {
      idle: "空闲",
      creating: "创建中",
      running: "运行中",
      finished: "已完成",
      cancelled: "已取消",
      failed: "失败",
      error: "错误",
      disconnected: "已断开",
      queued: "排队中",
    },
  },
  en: {
    eyebrow: "FedGuardLab",
    heroTitle: "Interactive FL Security Playground",
    heroSubtitle: "Run FL security experiments, stream live metrics, compare outcomes.",
    categoryLabel: "Category",
    allCategories: "All categories",
    experimentLabel: "Experiment",
    noConfigsForCategory: "No configs available for this category.",
    configPreview: "Config Preview",
    previewDataset: "Dataset",
    previewPartition: "Partition",
    previewAggregation: "Aggregation",
    previewAttack: "Attack",
    previewDefense: "Defense",
    previewRounds: "Rounds",
    previewClients: "Clients",
    previewMalicious: "Malicious Clients",
    previewLocalEpochs: "Local Epochs",
    previewBatchSize: "Batch Size",
    previewLearningRate: "Learning Rate",
    previewRiskLevel: "Risk Level",
    previewRecommendedUse: "Recommended Use",
    previewExplanation: "Parameter Explanations",
    previewDetails: "Show details",
    riskLevels: {
      none: "None",
      low: "Low",
      medium: "Medium",
      high: "High",
    },
    runExperiment: "Run Experiment",
    running: "Running...",
    cancelExperiment: "Cancel Experiment",
    statusLabel: "Status",
    jobLabel: "Job ID",
    errorLabel: "Error",
    reportLabel: "Report",
    openHtmlReport: "Open HTML Report",
    round: "Round",
    accuracy: "Accuracy",
    loss: "Loss",
    asr: "Attack Success Rate",
    chartTitle: "Live Federated Learning Metrics",
    emptyChart: "Start a new experiment to see live metrics here. Finished experiments are saved in the comparison history below.",
    comparisonTitle: "Experiment Comparison",
    comparisonHint: "Select at least two finished experiments and generate a comparison report.",
    statusFilter: "Status",
    allStatuses: "All statuses",
    finishedWithReport: "Finished with report",
    limitFilter: "Limit",
    sortFilter: "Sort",
    newestFirst: "Newest first",
    oldestFirst: "Oldest first",
    deleteSelected: "Delete Selected",
    clearHistory: "Clear History",
    generateReport: "Generate Comparison Report",
    generating: "Generating...",
    emptyAll: "Finished experiments with reports will appear here.",
    emptyAllStatuses: "No jobs recorded yet.",
    emptyFiltered: "No {status} jobs found.",
    tableSelect: "Select",
    tableExperiment: "Experiment",
    tableAggregation: "Aggregation",
    tableDefense: "Defense",
    tableAttack: "Attack",
    tableAccuracy: "Accuracy",
    tableLoss: "Loss",
    tableAsr: "ASR",
    tableArtifacts: "Artifacts",
    tableReport: "Report",
    badgeReport: "Report",
    badgeArtifacts: "Artifacts",
    badgeNoReport: "No report",
    open: "Open",
    notReady: "Not ready",
    jobDetailTitle: "Job Detail",
    jobDetailId: "Job ID",
    jobDetailStatus: "Status",
    jobDetailConfig: "Config Path",
    jobDetailCreated: "Created",
    jobDetailStarted: "Started",
    jobDetailFinished: "Finished",
    jobDetailReport: "Report",
    jobDetailArtifacts: "Artifacts",
    openReport: "Open Report",
    notAvailable: "Not available",
    available: "Available",
    jobDetailHint: "Select a job to inspect details.",
    comparisonLabel: "Comparison",
    openComparisonReport: "Open Comparison Report",
    selectAtLeastTwo: "Please select at least two finished experiments.",
    selectedJobsTitle: "Selected Jobs",
    selectedJobsCount: "{count} job(s) selected",
    selectedJobsHint: "Select at least 2 experiments to generate a comparison report.",
    comparisonCreating: "Generating comparison report…",
    comparisonSuccess: "Comparison report generated.",
    comparisonFailed: "Failed to generate comparison report.",
    comparisonExportsTitle: "Comparison Exports",
    insightsTitle: "Result Insights",
    bestAccuracy: "Best Accuracy",
    lowestLoss: "Lowest Loss",
    lowestAsr: "Lowest ASR",
    recommended: "Recommended",
    tradeoff: "Trade-off",
    riskHint: "Risk Hint",
    noInsights: "No insights available",
    exportsTitle: "Exports",
    exportHtmlReport: "HTML Report",
    exportCsvMetrics: "CSV Metrics",
    exportMarkdownReport: "Markdown Report",
    comparisonHtmlReport: "Comparison HTML Report",
    comparisonCsv: "Comparison CSV",
    comparisonJson: "Comparison JSON",
    eventTimeline: "Event Timeline",
    eventRound: "Round",
    eventFailureReason: "Failure Reason",
    noEvents: "No events recorded",
    eventType: {
      created: "Created",
      started: "Started",
      round_progress: "Round Progress",
      artifact_written: "Artifacts Written",
      finished: "Finished",
      failed: "Failed",
      cancelled: "Cancelled",
    },
    statusValues: {
      idle: "idle",
      creating: "creating",
      running: "running",
      finished: "finished",
      cancelled: "cancelled",
      failed: "failed",
      error: "error",
      disconnected: "disconnected",
      queued: "queued",
    },
  },
};

const t = computed(() => messages[language.value] || messages.zh);

function setLanguage(lang) {
  language.value = lang;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

function withLang(url) {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}lang=${language.value}`;
}
const comparisonStatus = ref("idle");
const comparisonError = ref("");
const comparisonUrl = ref("");
const comparisonArtifacts = ref({});
const comparisonInsights = ref({});

const experimentOptions = ref([]);
const selectedCategory = ref("all");

let socket = null;

const latestMetric = computed(() => {
  if (metrics.value.length === 0) {
    return null;
  }
  return metrics.value[metrics.value.length - 1];
});

const chartData = computed(() => {
  return {
    labels: metrics.value.map((item) => item.round),
    datasets: [
      {
        label: t.value.accuracy,
        data: metrics.value.map((item) => item.accuracy),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: t.value.loss,
        data: metrics.value.map((item) => item.loss),
        borderColor: "#dc2626",
        backgroundColor: "rgba(220, 38, 38, 0.12)",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: t.value.asr,
        data: metrics.value.map((item) => item.attack_success_rate),
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.12)",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: t.value.chartTitle,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
}));

onMounted(async () => {
  await loadExperimentOptions();

  try {
    await loadRecentJobsFromApi();
  } catch (error) {
    loadRecentJobs();
  }
});


const selectedExperimentDescription = computed(() => {
  const option = experimentOptions.value.find(
    (item) => item.value === selectedConfig.value
  );

  return option?.description || "";
});


const selectedConfigPreview = computed(() => {
  const option = experimentOptions.value.find(
    (item) => item.value === selectedConfig.value
  );
  return option?.preview || null;
});


const selectedConfigMetadata = computed(() => {
  const option = experimentOptions.value.find(
    (item) => item.value === selectedConfig.value
  );

  if (!option?.metadata) {
    return null;
  }

  const meta = option.metadata;

  return {
    name: meta.name || option.label || selectedConfig.value,
    description: meta.description || "",
    category: meta.category || "",
    tags: Array.isArray(meta.tags) ? meta.tags : [],
  };
});


const configCategories = computed(() => {
  const cats = new Set(
    experimentOptions.value.map(
      (opt) => opt.metadata?.category || "uncategorized"
    )
  );
  return [...cats].sort();
});


const filteredExperimentOptions = computed(() => {
  if (selectedCategory.value === "all") {
    return experimentOptions.value;
  }
  return experimentOptions.value.filter(
    (opt) => (opt.metadata?.category || "uncategorized") === selectedCategory.value
  );
});


watch(selectedCategory, () => {
  const current = filteredExperimentOptions.value.find(
    (opt) => opt.value === selectedConfig.value
  );
  if (!current && filteredExperimentOptions.value.length > 0) {
    selectedConfig.value = filteredExperimentOptions.value[0].value;
  }
});


function getSelectedExperimentLabel() {
  const option = experimentOptions.value.find(
    (item) => item.value === selectedConfig.value
  );

  return option ? option.label : selectedConfig.value;
}


async function loadExperimentOptions() {
  try {
    const response = await fetch(`${API_BASE}/configs`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to load configs");
    }

    experimentOptions.value = data.configs.filter((item) => item.valid);

    if (!selectedConfig.value && experimentOptions.value.length > 0) {
      selectedConfig.value = experimentOptions.value[0].value;
    }
  } catch (error) {
    errorMessage.value = error.message;
  }
}


function canSelectJobForComparison(job) {
  return (
    job.status === "finished" &&
    job.metrics_count > 0 &&
    job.has_report === true &&
    Boolean(job.report_url)
  );
}


function toggleJobSelection(jobId) {
  if (selectedJobIds.value.includes(jobId)) {
    selectedJobIds.value = selectedJobIds.value.filter((id) => id !== jobId);
    return;
  }

  selectedJobIds.value = [...selectedJobIds.value, jobId];
}


async function createComparisonReport() {
  comparisonError.value = "";
  comparisonUrl.value = "";
  comparisonArtifacts.value = {};
  comparisonInsights.value = {};

  if (selectedJobIds.value.length < 2) {
    comparisonError.value = t.value.selectAtLeastTwo;
    return;
  }

  comparisonStatus.value = "creating";

  try {
    const response = await fetch(`${API_BASE}/comparisons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job_ids: selectedJobIds.value,
        title: buildComparisonTitle(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to create comparison report");
    }

    comparisonUrl.value = data.comparison_url;
    comparisonArtifacts.value = data.artifacts || {};
    comparisonInsights.value = data.insights || {};
    comparisonStatus.value = "finished";
  } catch (error) {
    comparisonError.value = error.message;
    comparisonStatus.value = "error";
  }
}


function loadHiddenJobIds() {
  const rawValue = window.localStorage.getItem(HIDDEN_JOBS_STORAGE_KEY);

  if (!rawValue) {
    return new Set();
  }

  try {
    const parsedIds = JSON.parse(rawValue);

    if (Array.isArray(parsedIds)) {
      return new Set(parsedIds);
    }
  } catch (error) {
    console.warn("Failed to load hidden jobs from localStorage:", error);
    window.localStorage.removeItem(HIDDEN_JOBS_STORAGE_KEY);
  }

  return new Set();
}


function saveHiddenJobIds(hiddenIds) {
  window.localStorage.setItem(
    HIDDEN_JOBS_STORAGE_KEY,
    JSON.stringify([...hiddenIds])
  );
}


function hideJobIds(jobIds) {
  const hiddenIds = loadHiddenJobIds();

  jobIds.forEach((jobId) => {
    if (jobId) {
      hiddenIds.add(jobId);
    }
  });

  saveHiddenJobIds(hiddenIds);
}


function unhideJobId(jobId) {
  const hiddenIds = loadHiddenJobIds();

  hiddenIds.delete(jobId);
  saveHiddenJobIds(hiddenIds);
}


function loadRecentJobs() {
  const rawValue = window.localStorage.getItem(RECENT_JOBS_STORAGE_KEY);

  if (!rawValue) {
    return;
  }

  try {
    const parsedJobs = JSON.parse(rawValue);
    const hiddenIds = loadHiddenJobIds();

    if (Array.isArray(parsedJobs)) {
      recentJobs.value = parsedJobs.filter(
        (job) => !hiddenIds.has(job.job_id)
      );
    }
  } catch (error) {
    console.warn("Failed to load recent jobs from localStorage:", error);
    window.localStorage.removeItem(RECENT_JOBS_STORAGE_KEY);
  }
}


function formatDisplayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}


function formatMetricValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(4);
  }

  return value;
}


function mapApiJobToRecentJob(job) {
  const artifacts = job.artifacts || {};
  const hasReport = job.has_report === true;
  const experimentName =
    job.experiment_name || job.config_path || "Unknown Experiment";

  return {
    job_id: job.job_id,
    status: job.status,
    config_path: job.config_path,
    experiment_name: experimentName,
    name: experimentName,
    label: experimentName,
    aggregation: formatDisplayValue(job.aggregation),
    defense: formatDisplayValue(job.defense),
    attack: formatDisplayValue(job.attack),
    accuracy: formatMetricValue(job.final_accuracy),
    loss: formatMetricValue(job.final_loss),
    attack_success_rate: formatMetricValue(job.final_asr),
    asr: formatMetricValue(job.final_asr),
    final_accuracy: formatMetricValue(job.final_accuracy),
    final_loss: formatMetricValue(job.final_loss),
    final_asr: formatMetricValue(job.final_asr),
    final_metric: job.final_metric || {},
    metrics_count: job.metrics_count || 0,
    error: job.error,
    created_at: job.created_at,
    started_at: job.started_at,
    finished_at: job.finished_at,
    report_url: hasReport
      ? artifacts.report_html_url || `${API_BASE}/reports/${job.job_id}`
      : "",
    has_report: hasReport,
    artifacts,
    events: job.events || [],
  };
}


async function loadRecentJobsFromApi() {
  const filter = jobStatusFilter.value;
  const params = new URLSearchParams();
  params.set("limit", String(recentJobsLimit.value));
  params.set("sort", recentJobsSort.value);

  if (filter !== "all" && filter !== "finished_report") {
    params.set("status", filter);
  }

  const response = await fetch(`${API_BASE}/jobs?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load jobs");
  }

  const hiddenIds = loadHiddenJobIds();
  const visibleJobs = data.jobs.filter((job) => !hiddenIds.has(job.job_id));

  if (filter === "finished_report") {
    recentJobs.value = visibleJobs
      .filter(
        (job) =>
          job.status === "finished" &&
          job.metrics_count > 0 &&
          job.has_report === true
      )
      .map(mapApiJobToRecentJob);
    return;
  }

  recentJobs.value = visibleJobs.map(mapApiJobToRecentJob);
}


function eventIcon(type) {
  const icons = {
    created: "🆕",
    started: "▶️",
    round_progress: "🔄",
    artifact_written: "📦",
    finished: "✅",
    failed: "❌",
    cancelled: "⛔",
  };
  return icons[type] || "📌";
}

function formatEventTime(ts) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return d.toLocaleString(language.value === "zh" ? "zh-CN" : "en-US");
  } catch {
    return ts;
  }
}

function jobArtifactUrl(job, key) {
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


function comparisonArtifactUrl(key) {
  const artifacts = comparisonArtifacts.value || {};

  if (artifacts[key]) {
    return artifacts[key];
  }

  if (!comparisonUrl.value) {
    return "";
  }

  const fallbackUrls = {
    comparison_html_url: comparisonUrl.value,
    comparison_csv_url: `${comparisonUrl.value}/comparison.csv`,
    comparison_json_url: `${comparisonUrl.value}/comparison.json`,
  };

  return fallbackUrls[key] || "";
}


function hasArtifacts(job) {
  return Boolean(
    jobArtifactUrl(job, "report_html") ||
      jobArtifactUrl(job, "metrics_csv") ||
      jobArtifactUrl(job, "summary_md") ||
      jobArtifactUrl(job, "metrics_json") ||
      jobArtifactUrl(job, "config_json")
  );
}


const selectedDetailJob = computed(() => {
  if (!selectedDetailJobId.value) {
    return null;
  }
  return recentJobs.value.find((j) => j.job_id === selectedDetailJobId.value) || null;
});


const selectedDetailArtifactsCount = computed(() => {
  const job = selectedDetailJob.value;
  if (!job) {
    return 0;
  }

  return [
    jobArtifactUrl(job, "report_html"),
    jobArtifactUrl(job, "metrics_csv"),
    jobArtifactUrl(job, "summary_md"),
    jobArtifactUrl(job, "metrics_json"),
    jobArtifactUrl(job, "config_json"),
  ].filter(Boolean).length;
});


function toggleDetailJob(jobId) {
  selectedDetailJobId.value =
    selectedDetailJobId.value === jobId ? "" : jobId;
}


watch([jobStatusFilter, recentJobsLimit, recentJobsSort], () => {
  loadRecentJobsFromApi().catch((error) => {
    console.warn("Failed to reload jobs after filter change:", error);
  });
});


function saveRecentJobs() {
  window.localStorage.setItem(
    RECENT_JOBS_STORAGE_KEY,
    JSON.stringify(recentJobs.value.slice(0, 20))
  );
}


function buildComparisonTitle() {
  const selectedJobs = recentJobs.value.filter((job) =>
    selectedJobIds.value.includes(job.job_id)
  );

  const attacks = [...new Set(selectedJobs.map((job) => job.attack))];
  const aggregations = [...new Set(selectedJobs.map((job) => job.aggregation))];

  if (attacks.length === 1 && attacks[0] !== "unknown") {
    return `${attacks[0]} Aggregation Comparison`;
  }

  if (aggregations.length > 1) {
    return "Robust Aggregation Comparison";
  }

  return "FedGuardLab Experiment Comparison";
}


function clearRecentJobs() {
  hideJobIds(recentJobs.value.map((job) => job.job_id));

  recentJobs.value = [];
  selectedJobIds.value = [];
  comparisonUrl.value = "";
  comparisonError.value = "";
  window.localStorage.removeItem(RECENT_JOBS_STORAGE_KEY);
}


function deleteSelectedJobs() {
  const selectedIds = new Set(selectedJobIds.value);

  hideJobIds([...selectedIds]);

  recentJobs.value = recentJobs.value.filter(
    (job) => !selectedIds.has(job.job_id)
  );

  selectedJobIds.value = [];
  comparisonUrl.value = "";
  comparisonError.value = "";

  saveRecentJobs();
}


async function cancelCurrentJob() {
  if (!jobId.value) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/jobs/${jobId.value}/cancel`, {
      method: "POST",
    });

    if (response.ok) {
      status.value = "cancelled";
      errorMessage.value = "";
      if (socket) {
        socket.close();
        socket = null;
      }
    } else {
      const data = await response.json();
      errorMessage.value = data.detail || `Failed to cancel job: ${response.status}`;
    }
  } catch (error) {
    errorMessage.value = error.message;
  }
}


async function startExperiment() {
  errorMessage.value = "";
  metrics.value = [];
  jobId.value = "";
  reportUrl.value = "";
  status.value = "creating";

  if (socket) {
    socket.close();
    socket = null;
  }

  try {
    const response = await fetch(
      `${API_BASE}/run?config_path=${encodeURIComponent(selectedConfig.value)}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create run: ${response.status}`);
    }

    const data = await response.json();
    jobId.value = data.job_id;
    status.value = "running";

    socket = new WebSocket(`${WS_BASE}/ws/${data.job_id}`);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.error) {
        errorMessage.value = message.error;
        status.value = "error";
        socket.close();
        return;
      }

      if (message.event === "cancelled") {
        status.value = "cancelled";
        errorMessage.value = "";
        socket.close();
        return;
      }

      if (message.event === "finished") {
        status.value = "finished";
        reportUrl.value = `${API_BASE}/reports/${jobId.value}`;

        const finalMetric = metrics.value[metrics.value.length - 1] || {};
        const experimentName = getSelectedExperimentLabel();

        unhideJobId(jobId.value);

        recentJobs.value = [
          {
            job_id: jobId.value,
            status: "finished",
            label: experimentName,
            name: experimentName,
            experiment_name: experimentName,
            config_path: selectedConfig.value,
            aggregation: finalMetric.aggregation || "unknown",
            defense: finalMetric.defense || "unknown",
            attack: finalMetric.attack || "unknown",
            final_accuracy: finalMetric.accuracy ?? 0,
            final_loss: finalMetric.loss ?? 0,
            final_asr: finalMetric.attack_success_rate ?? 0,
            metrics_count: metrics.value.length,
            report_url: `${API_BASE}/reports/${jobId.value}`,
            has_report: true,
            artifacts: {
              report_html_url: `${API_BASE}/reports/${jobId.value}`,
              metrics_csv_url: `${API_BASE}/reports/${jobId.value}/metrics.csv`,
              summary_md_url: `${API_BASE}/reports/${jobId.value}/report.md`,
              metrics_json_url: `${API_BASE}/reports/${jobId.value}/metrics.json`,
              config_json_url: `${API_BASE}/reports/${jobId.value}/config.json`,
            },
          },
          ...recentJobs.value.filter((job) => job.job_id !== jobId.value),
        ].slice(0, 20);

        saveRecentJobs();
        loadRecentJobsFromApi().catch((error) => {
          console.warn("Failed to refresh jobs after run finished:", error);
        });

        socket.close();
        return;
      }

      metrics.value = [...metrics.value, message];
    };

    socket.onerror = () => {
      errorMessage.value = "WebSocket connection error";
      status.value = "error";
    };

    socket.onclose = () => {
      if (status.value === "running") {
        status.value = "disconnected";
      }
    };
  } catch (error) {
    errorMessage.value = error.message;
    status.value = "error";
  }
}
</script>

<template>
  <main class="page">
    <section class="hero">
      <div class="hero-header">
        <div class="hero-text">
          <div class="hero-title-row">
            <p class="eyebrow">{{ t.eyebrow }}</p>
            <div class="lang-switcher">
              <button
                class="lang-button"
                :class="{ active: language === 'zh' }"
                @click="setLanguage('zh')"
              >
                中文
              </button>
              <button
                class="lang-button"
                :class="{ active: language === 'en' }"
                @click="setLanguage('en')"
              >
                English
              </button>
            </div>
          </div>
          <h1>{{ t.heroTitle }}</h1>
          <p class="subtitle">{{ t.heroSubtitle }}</p>
        </div>
      </div>

      <div class="control-panel">
        <label class="field-label" for="category-filter">
          {{ t.categoryLabel }}
        </label>

        <select
          id="category-filter"
          v-model="selectedCategory"
          class="experiment-select"
          :disabled="status === 'creating' || status === 'running'"
        >
          <option value="all">{{ t.allCategories }}</option>
          <option
            v-for="cat in configCategories"
            :key="cat"
            :value="cat"
          >
            {{ cat }}
          </option>
        </select>

        <label class="field-label" for="experiment-select">
          {{ t.experimentLabel }}
        </label>

        <select
          v-if="filteredExperimentOptions.length > 0"
          id="experiment-select"
          v-model="selectedConfig"
          class="experiment-select"
          :disabled="status === 'creating' || status === 'running'"
        >
          <option
            v-for="option in filteredExperimentOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <p v-else class="config-empty-filter">
          {{ t.noConfigsForCategory }}
        </p>

        <p class="option-description">
          {{ selectedExperimentDescription }}
        </p>

        <div v-if="selectedConfigMetadata" class="config-metadata">
          <div class="config-metadata-name">
            {{ selectedConfigMetadata.name }}
          </div>
          <div
            v-if="selectedConfigMetadata.description"
            class="config-metadata-description"
          >
            {{ selectedConfigMetadata.description }}
          </div>
          <div
            v-if="selectedConfigMetadata.category"
            class="config-metadata-category"
          >
            {{ selectedConfigMetadata.category }}
          </div>
          <div
            v-if="selectedConfigMetadata.tags.length > 0"
            class="config-metadata-tags"
          >
            <span
              v-for="tag in selectedConfigMetadata.tags"
              :key="tag"
              class="config-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div v-if="selectedConfigPreview" class="config-preview">
          <div class="preview-grid">
            <div class="preview-item">
              <span class="preview-label">{{ t.previewDataset }}</span>
              <strong>{{ selectedConfigPreview.dataset }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewAggregation }}</span>
              <strong>{{ selectedConfigPreview.aggregation }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewAttack }}</span>
              <strong>{{ selectedConfigPreview.attack }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewDefense }}</span>
              <strong>{{ selectedConfigPreview.defense }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewRounds }}</span>
              <strong>{{ selectedConfigPreview.rounds }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewClients }}</span>
              <strong>{{ selectedConfigPreview.clients }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewRiskLevel }}</span>
              <strong>
                <span class="risk-badge" :class="'risk-' + selectedConfigPreview.risk_level">
                  {{ t.riskLevels[selectedConfigPreview.risk_level] || selectedConfigPreview.risk_level }}
                </span>
              </strong>
            </div>
          </div>

          <details class="preview-details">
            <summary>{{ t.previewDetails }}</summary>
            <div class="preview-detail-grid">
              <div class="preview-item">
                <span class="preview-label">{{ t.previewPartition }}</span>
                <strong>{{ selectedConfigPreview.partition }}</strong>
              </div>
              <div class="preview-item">
                <span class="preview-label">{{ t.previewMalicious }}</span>
                <strong>{{ selectedConfigPreview.malicious_clients }}</strong>
              </div>
              <div class="preview-item">
                <span class="preview-label">{{ t.previewLocalEpochs }}</span>
                <strong>{{ selectedConfigPreview.local_epochs }}</strong>
              </div>
              <div class="preview-item">
                <span class="preview-label">{{ t.previewBatchSize }}</span>
                <strong>{{ selectedConfigPreview.batch_size }}</strong>
              </div>
              <div class="preview-item">
                <span class="preview-label">{{ t.previewLearningRate }}</span>
                <strong>{{ selectedConfigPreview.learning_rate }}</strong>
              </div>
            </div>
            <div v-if="selectedConfigPreview.recommended_use" class="preview-recommended">
              <span class="preview-label">{{ t.previewRecommendedUse }}</span>
              <p>{{ selectedConfigPreview.recommended_use }}</p>
            </div>
            <div v-if="selectedConfigPreview.explanations" class="explanation-list">
              <p v-for="(val, key) in selectedConfigPreview.explanations" :key="key">
                <strong>{{ key }}:</strong> {{ val }}
              </p>
            </div>
          </details>
        </div>

        <div class="button-row">
          <button
            class="run-button"
            :disabled="
              status === 'creating' ||
              status === 'running' ||
              filteredExperimentOptions.length === 0
            "
            @click="startExperiment"
          >
            {{ status === "running" ? t.running : t.runExperiment }}
          </button>

          <button
            v-if="status === 'creating' || status === 'running'"
            class="secondary-button"
            @click="cancelCurrentJob"
          >
            {{ t.cancelExperiment }}
          </button>
        </div>
      </div>
    </section>

    <section class="status-card">
      <div>
        <strong>{{ t.statusLabel }}:</strong>
        <span class="status-badge" :class="'status-' + status">{{ t.statusValues[status] || status }}</span>
      </div>

      <div v-if="jobId">
        <strong>{{ t.jobLabel }}:</strong>
        <span>{{ jobId }}</span>
      </div>

      <div v-if="errorMessage" class="error">
        <strong>{{ t.errorLabel }}:</strong>
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="reportUrl">
        <strong>{{ t.reportLabel }}:</strong>
        <a class="report-link" :href="withLang(reportUrl)" target="_blank">
          {{ t.openHtmlReport }}
        </a>
      </div>
    </section>

    <section v-if="latestMetric" class="metric-grid">
      <div class="metric-card">
        <span>{{ t.round }}</span>
        <strong>{{ latestMetric.round }}</strong>
      </div>

      <div class="metric-card">
        <span>{{ t.accuracy }}</span>
        <strong>{{ latestMetric.accuracy }}</strong>
      </div>

      <div class="metric-card">
        <span>{{ t.loss }}</span>
        <strong>{{ latestMetric.loss }}</strong>
      </div>

      <div class="metric-card">
        <span>{{ t.asr }}</span>
        <strong>{{ latestMetric.attack_success_rate }}</strong>
      </div>
    </section>

    <section class="chart-card">
      <Line
        v-if="metrics.length > 0"
        :data="chartData"
        :options="chartOptions"
      />

      <div v-else class="empty-state">
        {{ t.emptyChart }}
      </div>
    </section>

    <section class="comparison-card">
      <div class="section-header">
        <div>
          <h2>{{ t.comparisonTitle }}</h2>
          <p>{{ t.comparisonHint }}</p>
          <div class="job-filters">
            <label class="status-filter">
              {{ t.statusFilter }}:
              <select v-model="jobStatusFilter">
                <option value="all">{{ t.allStatuses }}</option>
                <option value="finished_report">{{ t.finishedWithReport }}</option>
                <option value="finished">{{ t.statusValues.finished }}</option>
                <option value="running">{{ t.statusValues.running }}</option>
                <option value="cancelled">{{ t.statusValues.cancelled }}</option>
                <option value="failed">{{ t.statusValues.failed }}</option>
                <option value="queued">{{ t.statusValues.queued }}</option>
              </select>
            </label>

            <label class="status-filter">
              {{ t.limitFilter }}:
              <select v-model.number="recentJobsLimit">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
            </label>

            <label class="status-filter">
              {{ t.sortFilter }}:
              <select v-model="recentJobsSort">
                <option value="created_at_desc">{{ t.newestFirst }}</option>
                <option value="created_at_asc">{{ t.oldestFirst }}</option>
              </select>
            </label>
          </div>
        </div>

        <div class="section-actions">
          <button
            class="secondary-button"
            :disabled="selectedJobIds.length === 0"
            @click="deleteSelectedJobs"
          >
            {{ t.deleteSelected }}
          </button>

          <button
            class="secondary-button"
            :disabled="recentJobs.length === 0"
            @click="clearRecentJobs"
          >
            {{ t.clearHistory }}
          </button>

          <button
            class="run-button"
            :disabled="selectedJobIds.length < 2 || comparisonStatus === 'creating'"
            @click="createComparisonReport"
          >
            {{ comparisonStatus === "creating" ? t.generating : t.generateReport }}
          </button>
        </div>
      </div>

      <div v-if="recentJobs.length === 0" class="empty-state small">
        <template v-if="jobStatusFilter === 'all'">
          {{ t.emptyAllStatuses }}
        </template>
        <template v-else-if="jobStatusFilter === 'finished_report'">
          {{ t.emptyAll }}
        </template>
        <template v-else>
          {{ t.emptyFiltered.replace('{status}', t.statusValues[jobStatusFilter] || jobStatusFilter) }}
        </template>
      </div>

      <table v-else class="jobs-table">
        <thead>
          <tr>
            <th>{{ t.tableSelect }}</th>
            <th>{{ t.tableExperiment }}</th>
            <th>{{ t.tableAggregation }}</th>
            <th>{{ t.tableDefense }}</th>
            <th>{{ t.tableAttack }}</th>
            <th>{{ t.tableAccuracy }}</th>
            <th>{{ t.tableLoss }}</th>
            <th>{{ t.tableAsr }}</th>
            <th>{{ t.tableArtifacts }}</th>
            <th>{{ t.tableReport }}</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="job in recentJobs"
            :key="job.job_id"
            class="job-row"
            :class="{ 'job-row-selected': selectedDetailJobId === job.job_id, 'selected': selectedDetailJobId === job.job_id }"
            @click="toggleDetailJob(job.job_id)"
          >
            <td>
              <input
                type="checkbox"
                :checked="selectedJobIds.includes(job.job_id)"
                :disabled="!canSelectJobForComparison(job)"
                @change="toggleJobSelection(job.job_id)"
              />
            </td>
            <td>
              <div class="job-label">{{ job.label }}</div>
              <div class="job-id">{{ job.job_id }}</div>
            </td>
            <td>{{ job.aggregation }}</td>
            <td>{{ job.defense }}</td>
            <td>{{ job.attack }}</td>
            <td>{{ job.final_accuracy }}</td>
            <td>{{ job.final_loss }}</td>
            <td>{{ job.final_asr }}</td>
            <td>
              <div class="job-badges">
                <span v-if="job.has_report" class="job-badge success">{{ t.badgeReport }}</span>
                <span v-if="hasArtifacts(job)" class="job-badge">{{ t.badgeArtifacts }}</span>
                <span v-if="!job.has_report && !hasArtifacts(job)" class="job-badge muted">{{ t.badgeNoReport }}</span>
              </div>
            </td>
            <td>
              <a
                v-if="job.status === 'finished' && job.has_report && job.report_url"
                class="report-link"
                :href="withLang(job.report_url)"
                target="_blank"
              >
                {{ t.open }}
              </a>
              <span v-else>{{ t.notReady }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="job-detail-card">
        <div v-if="selectedDetailJob" class="job-detail-panel">
          <div class="job-detail-header">
            <div>
              <p class="section-kicker">{{ t.jobDetailTitle }}</p>
              <h2>{{ selectedDetailJob.label || selectedDetailJob.experiment_name || selectedDetailJob.config_path || "—" }}</h2>
            </div>

            <a
              v-if="selectedDetailJob.has_report && selectedDetailJob.report_url"
              class="report-link detail-report-link"
              :href="withLang(selectedDetailJob.report_url)"
              target="_blank"
              rel="noreferrer"
            >
              {{ t.openReport }}
            </a>
          </div>

          <div class="job-detail-grid">
            <div class="detail-item detail-item-wide">
              <span>{{ t.jobDetailId }}</span>
              <strong>{{ selectedDetailJob.job_id || "—" }}</strong>
            </div>

            <div class="detail-item">
              <span>{{ t.jobDetailStatus }}</span>
              <strong>{{ t.statusValues[selectedDetailJob.status] || selectedDetailJob.status || "—" }}</strong>
            </div>

            <div class="detail-item">
              <span>{{ t.jobDetailArtifacts }}</span>
              <strong>{{ selectedDetailArtifactsCount }}</strong>
            </div>

            <div class="detail-item detail-item-wide">
              <span>{{ t.jobDetailConfig }}</span>
              <strong>{{ selectedDetailJob.config_path || "—" }}</strong>
            </div>

            <div class="detail-item">
              <span>{{ t.jobDetailCreated }}</span>
              <strong>{{ selectedDetailJob.created_at || "—" }}</strong>
            </div>

            <div class="detail-item">
              <span>{{ t.jobDetailStarted }}</span>
              <strong>{{ selectedDetailJob.started_at || "—" }}</strong>
            </div>

            <div class="detail-item">
              <span>{{ t.jobDetailFinished }}</span>
              <strong>{{ selectedDetailJob.finished_at || "—" }}</strong>
            </div>

            <div class="detail-item">
              <span>{{ t.jobDetailReport }}</span>
              <strong>{{ selectedDetailJob.has_report ? t.available : t.notReady }}</strong>
            </div>
          </div>

          <div v-if="selectedDetailJob.has_report" class="detail-exports">
            <h3 class="detail-exports-title">{{ t.exportsTitle }}</h3>
            <div class="detail-exports-grid">
              <a
                v-if="jobArtifactUrl(selectedDetailJob, 'report_html')"
                class="detail-export-item"
                :href="withLang(jobArtifactUrl(selectedDetailJob, 'report_html'))"
                target="_blank"
                rel="noreferrer"
              >
                <span class="detail-export-icon">📊</span>
                <span class="detail-export-label">{{ t.exportHtmlReport }}</span>
              </a>
              <span v-else class="detail-export-item disabled">
                <span class="detail-export-icon">📊</span>
                <span class="detail-export-label">{{ t.exportHtmlReport }}</span>
              </span>

              <a
                v-if="jobArtifactUrl(selectedDetailJob, 'metrics_csv')"
                class="detail-export-item"
                :href="jobArtifactUrl(selectedDetailJob, 'metrics_csv')"
                target="_blank"
                rel="noreferrer"
              >
                <span class="detail-export-icon">📄</span>
                <span class="detail-export-label">{{ t.exportCsvMetrics }}</span>
              </a>
              <span v-else class="detail-export-item disabled">
                <span class="detail-export-icon">📄</span>
                <span class="detail-export-label">{{ t.exportCsvMetrics }}</span>
              </span>

              <a
                v-if="jobArtifactUrl(selectedDetailJob, 'summary_md')"
                class="detail-export-item"
                :href="jobArtifactUrl(selectedDetailJob, 'summary_md')"
                target="_blank"
                rel="noreferrer"
              >
                <span class="detail-export-icon">📝</span>
                <span class="detail-export-label">{{ t.exportMarkdownReport }}</span>
              </a>
              <span v-else class="detail-export-item disabled">
                <span class="detail-export-icon">📝</span>
                <span class="detail-export-label">{{ t.exportMarkdownReport }}</span>
              </span>
            </div>
          </div>

          <div class="detail-events">
            <h3 class="detail-events-title">{{ t.eventTimeline }}</h3>
            <div v-if="selectedDetailJob.events && selectedDetailJob.events.length > 0" class="event-timeline">
              <div
                v-for="(ev, idx) in selectedDetailJob.events"
                :key="idx"
                class="event-item"
                :class="'event-' + ev.type"
              >
                <span class="event-icon">{{ eventIcon(ev.type) }}</span>
                <div class="event-body">
                  <div class="event-header">
                    <span class="event-badge" :class="'badge-' + ev.type">{{ t.eventType[ev.type] || ev.type }}</span>
                    <span class="event-time">{{ formatEventTime(ev.created_at) }}</span>
                  </div>
                  <p class="event-message">{{ ev.message }}</p>
                  <div v-if="ev.type === 'round_progress' && ev.metrics" class="event-metrics">
                    <span>{{ t.eventRound }} {{ ev.round }}/{{ ev.total_rounds }}</span>
                    <span>{{ t.accuracy }}: {{ ev.metrics.accuracy }}</span>
                    <span>{{ t.loss }}: {{ ev.metrics.loss }}</span>
                    <span>{{ t.asr }}: {{ ev.metrics.attack_success_rate }}</span>
                  </div>
                  <div v-if="ev.type === 'failed' && ev.details" class="event-failure">
                    <p><strong>{{ t.eventFailureReason }}:</strong> {{ ev.details.error }}</p>
                    <pre v-if="ev.details.traceback_summary" class="event-traceback">{{ ev.details.traceback_summary }}</pre>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small">
              <p>{{ t.noEvents }}</p>
            </div>
          </div>
        </div>

        <div v-else class="empty-state small">
          {{ t.jobDetailHint }}
        </div>
      </div>

      <div v-if="selectedJobIds.length > 0" class="selected-jobs-preview">
        <div class="selected-jobs-header">
          <p class="section-kicker">{{ t.selectedJobsTitle }}</p>
          <span class="selected-jobs-count">
            {{ t.selectedJobsCount.replace('{count}', selectedJobIds.length) }}
          </span>
        </div>

        <div class="selected-jobs-list">
          <div
            v-for="jobId in selectedJobIds"
            :key="jobId"
            class="selected-job-chip"
          >
            <span class="selected-job-id">{{ jobId.slice(0, 8) }}</span>
            <span class="selected-job-name">
              {{ (recentJobs.find(j => j.job_id === jobId) || {}).experiment_name || (recentJobs.find(j => j.job_id === jobId) || {}).config_path || '—' }}
            </span>
            <span
              class="selected-job-status"
              :class="'status-' + ((recentJobs.find(j => j.job_id === jobId) || {}).status || '')"
            >
              {{ t.statusValues[(recentJobs.find(j => j.job_id === jobId) || {}).status] || (recentJobs.find(j => j.job_id === jobId) || {}).status || '—' }}
            </span>
            <span class="selected-job-time">
              {{ (recentJobs.find(j => j.job_id === jobId) || {}).finished_at || (recentJobs.find(j => j.job_id === jobId) || {}).created_at || '—' }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="comparisonStatus === 'creating'" class="comparison-feedback creating">
        <span class="feedback-spinner"></span>
        {{ t.comparisonCreating }}
      </div>

      <div v-if="comparisonStatus === 'finished' && comparisonUrl" class="comparison-feedback success">
        <strong>{{ t.comparisonSuccess }}</strong>
        <div class="comparison-exports">
          <a
            class="comparison-export-item"
            :href="withLang(comparisonArtifactUrl('comparison_html_url'))"
            target="_blank"
            rel="noreferrer"
          >
            <span class="detail-export-icon">📊</span>
            <span class="detail-export-label">{{ t.comparisonHtmlReport }}</span>
          </a>
          <a
            v-if="comparisonArtifactUrl('comparison_csv_url')"
            class="comparison-export-item"
            :href="comparisonArtifactUrl('comparison_csv_url')"
            target="_blank"
            rel="noreferrer"
          >
            <span class="detail-export-icon">📄</span>
            <span class="detail-export-label">{{ t.comparisonCsv }}</span>
          </a>
          <span v-else class="comparison-export-item disabled">
            <span class="detail-export-icon">📄</span>
            <span class="detail-export-label">{{ t.comparisonCsv }}</span>
          </span>
          <a
            v-if="comparisonArtifactUrl('comparison_json_url')"
            class="comparison-export-item"
            :href="comparisonArtifactUrl('comparison_json_url')"
            target="_blank"
            rel="noreferrer"
          >
            <span class="detail-export-icon">📋</span>
            <span class="detail-export-label">{{ t.comparisonJson }}</span>
          </a>
          <span v-else class="comparison-export-item disabled">
            <span class="detail-export-icon">📋</span>
            <span class="detail-export-label">{{ t.comparisonJson }}</span>
          </span>
        </div>
      </div>

      <div v-if="comparisonStatus === 'finished' && comparisonInsights && (comparisonInsights.best_accuracy || comparisonInsights.winner)" class="insight-section">
        <h3 class="insight-section-title">{{ t.insightsTitle }}</h3>
        <div class="insight-cards-grid">
          <div v-if="comparisonInsights.best_accuracy" class="insight-metric-card">
            <span class="insight-metric-label">{{ t.bestAccuracy }}</span>
            <span class="insight-metric-value">{{ comparisonInsights.best_accuracy.value?.toFixed(4) || '—' }}</span>
            <span class="insight-metric-exp">{{ comparisonInsights.best_accuracy.experiment_name || '' }}</span>
          </div>
          <div v-if="comparisonInsights.lowest_loss" class="insight-metric-card">
            <span class="insight-metric-label">{{ t.lowestLoss }}</span>
            <span class="insight-metric-value">{{ comparisonInsights.lowest_loss.value?.toFixed(4) || '—' }}</span>
            <span class="insight-metric-exp">{{ comparisonInsights.lowest_loss.experiment_name || '' }}</span>
          </div>
          <div v-if="comparisonInsights.lowest_asr" class="insight-metric-card">
            <span class="insight-metric-label">{{ t.lowestAsr }}</span>
            <span class="insight-metric-value">{{ comparisonInsights.lowest_asr.value?.toFixed(4) || '—' }}</span>
            <span class="insight-metric-exp">{{ comparisonInsights.lowest_asr.experiment_name || '' }}</span>
          </div>
        </div>
        <div class="insight-extra-cards">
          <div v-if="comparisonInsights.winner" class="insight-extra-card insight-winner">
            <span class="insight-extra-label">{{ t.recommended }}</span>
            <p class="insight-extra-body"><strong>{{ comparisonInsights.winner.experiment_name }}</strong></p>
            <p v-if="comparisonInsights.winner_reason" class="insight-extra-reason">{{ comparisonInsights.winner_reason }}</p>
          </div>
          <div v-if="comparisonInsights.tradeoff_summary" class="insight-extra-card insight-tradeoff">
            <span class="insight-extra-label">{{ t.tradeoff }}</span>
            <p class="insight-extra-body">{{ comparisonInsights.tradeoff_summary }}</p>
          </div>
          <div v-if="comparisonInsights.risk_hint" class="insight-extra-card insight-risk">
            <span class="insight-extra-label">{{ t.riskHint }}</span>
            <p class="insight-extra-body">{{ comparisonInsights.risk_hint }}</p>
          </div>
        </div>
      </div>

      <div v-if="comparisonStatus === 'error' && comparisonError" class="comparison-feedback error-feedback">
        <strong>{{ t.comparisonFailed }}</strong>
        <span>{{ comparisonError }}</span>
      </div>

      <div v-if="selectedJobIds.length < 2 && selectedJobIds.length > 0" class="comparison-hint">
        {{ t.selectedJobsHint }}
      </div>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html) {
  min-height: 100%;
  background:
    radial-gradient(circle at 12% 0%, rgba(99, 102, 241, 0.16), transparent 28%),
    radial-gradient(circle at 90% 8%, rgba(56, 189, 248, 0.18), transparent 30%),
    linear-gradient(135deg, #f6f7ff 0%, #f8fbff 48%, #f6f2ff 100%);
}

:global(body) {
  margin: 0;
  min-height: 100vh;
}

.page {
  min-height: 100vh;
  padding: 36px 24px 64px;
  color: #111827;
  font-family:
    Inter, "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", system-ui,
    -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.page > * {
  width: min(100%, 1120px);
  margin-left: auto;
  margin-right: auto;
}

/* ---------------- Hero ---------------- */

.hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  grid-template-areas: "intro controls";
  align-items: start;
  gap: 28px;
  min-height: 0;
  margin-bottom: 18px;
  padding: 28px 32px 24px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 28px;
  background:
    radial-gradient(circle at 96% 85%, rgba(59, 130, 246, 0.14), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(249, 251, 255, 0.9));
  box-shadow:
    0 24px 60px rgba(79, 70, 229, 0.10),
    0 14px 32px rgba(15, 23, 42, 0.07);
}

.hero::before {
  content: "";
  position: absolute;
  right: -138px;
  bottom: -172px;
  width: 410px;
  height: 410px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.22), rgba(168, 85, 247, 0.09));
  pointer-events: none;
}

.hero::after {
  content: "";
  position: absolute;
  top: -150px;
  left: 38%;
  width: 330px;
  height: 330px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  filter: blur(16px);
  pointer-events: none;
}

.hero > * {
  position: relative;
  z-index: 1;
}

.hero-header {
  grid-area: intro;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  min-width: 0;
  padding-right: 12px;
}

.hero-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
  margin-bottom: 6px;
}

.hero-text {
  max-width: 620px;
}

.eyebrow,
.section-kicker {
  margin: 0;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 {
  max-width: 620px;
  margin: 0;
  color: #0f172a;
  font-size: clamp(26px, 3.2vw, 38px);
  line-height: 1.12;
  letter-spacing: -0.04em;
}

.subtitle {
  max-width: 620px;
  margin: 8px 0 0;
  color: #5f6f87;
  font-size: 13px;
  line-height: 1.5;
}

.lang-switcher {
  position: static;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 0;
  padding: 3px;
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(14px);
  flex-shrink: 0;
}

.lang-button {
  min-height: 28px;
  padding: 5px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.lang-button.active {
  background: #111827;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}

/* ---------------- Control panel ---------------- */

.control-panel {
  grid-area: controls;
  align-self: start;
  width: 100%;
  display: grid;
  gap: 7px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
}

.field-label {
  display: block;
  margin-bottom: 4px;
  color: #1f2a44;
  font-size: 12px;
  font-weight: 900;
}

.experiment-select,
.status-filter select,
select,
input {
  width: 100%;
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid rgba(148, 163, 184, 0.46);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
  color: #172033;
  font-size: 12px;
  line-height: 1.35;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.experiment-select:focus,
.status-filter select:focus,
select:focus,
input:focus {
  border-color: rgba(37, 99, 235, 0.78);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.option-description {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.55;
}

.config-empty-filter {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.config-metadata {
  display: grid;
  gap: 3px;
  margin-top: 4px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(255, 255, 255, 0.92));
  color: #475569;
  font-size: 11px;
  line-height: 1.4;
}

.config-metadata-name {
  color: #172033;
  font-weight: 900;
}

.config-metadata-description,
.config-metadata-category {
  color: #64748b;
}

.config-metadata-tags,
.job-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.config-tag,
.job-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 4px 9px;
  border-radius: 999px;
  background: #eef2ff;
  color: #334155;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.job-badge.success {
  background: #dcfce7;
  color: #166534;
}

.job-badge.muted {
  background: #eef2ff;
  color: #64748b;
}

/* ---------------- Config Preview ---------------- */

.config-preview {
  margin-top: 8px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.74),
    rgba(255, 255, 255, 0.92)
  );
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.preview-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.preview-item {
  padding: 6px 8px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
}

.preview-label {
  display: block;
  color: #64748b;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.preview-item strong {
  display: block;
  margin-top: 1px;
  color: #0f172a;
  font-size: 12px;
  font-weight: 800;
}

.risk-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.risk-none {
  background: #dcfce7;
  color: #166534;
}

.risk-low {
  background: #dbeafe;
  color: #1d4ed8;
}

.risk-medium {
  background: #fef9c3;
  color: #a16207;
}

.risk-high {
  background: #fee2e2;
  color: #dc2626;
}

.preview-details {
  margin-top: 6px;
}

.preview-details summary {
  cursor: pointer;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 0;
}

.preview-recommended {
  margin-top: 8px;
  padding: 6px 8px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
}

.preview-recommended p {
  margin: 2px 0 0;
  color: #475569;
  font-size: 12px;
}

.explanation-list {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
}

.explanation-list p {
  margin: 3px 0;
  color: #475569;
  font-size: 11px;
  line-height: 1.4;
}

.explanation-list strong {
  color: #334155;
}

/* ---------------- Buttons ---------------- */

.button-row,
.section-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.button-row {
  margin-top: 6px;
}

button,
.run-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 9px 15px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease, opacity 0.16s ease;
}

button:hover:not(:disabled),
.run-button:hover:not(:disabled),
.secondary-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:disabled,
.run-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
  box-shadow: none;
}

.run-button {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(135deg, #0f2a66, #1d4ed8);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(29, 78, 216, 0.22);
}

.secondary-button {
  border: 1px solid rgba(147, 197, 253, 0.55);
  background: #eff6ff;
  color: #1d4ed8;
}

.secondary-button:hover:not(:disabled) {
  background: #dbeafe;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.12);
}

/* ---------------- Cards ---------------- */

.status-card,
.chart-card,
.comparison-card,
.metric-card,
.job-detail-card {
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.07);
  backdrop-filter: blur(14px);
}

.status-card,
.chart-card,
.comparison-card {
  margin-bottom: 24px;
  border-radius: 26px;
}

.status-card {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 20px 24px;
}

.status-card > div {
  min-height: 52px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.74), rgba(255, 255, 255, 0.82));
}

.status-card strong {
  display: block;
  margin-bottom: 7px;
  color: #1f2a44;
  font-size: 12px;
  font-weight: 900;
}

.status-card span {
  color: #475569;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #334155;
  font-weight: 900;
}

.status-running,
.status-creating,
.status-queued {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-finished {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #f1f5f9;
  color: #475569;
}

.status-failed,
.status-error,
.status-disconnected {
  background: #fee2e2;
  color: #b91c1c;
}

.error {
  color: #b91c1c;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  display: grid;
  gap: 8px;
  min-height: 104px;
  padding: 20px;
  border-radius: 22px;
}

.metric-card span {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.metric-card strong {
  color: #0f172a;
  font-size: 30px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.chart-card {
  min-height: 230px;
  padding: 24px;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 160px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
  text-align: center;
  background: rgba(248, 250, 252, 0.58);
}

.empty-state.small {
  min-height: 72px;
  padding: 16px;
  font-size: 13px;
}

/* ---------------- Comparison / Jobs ---------------- */

.comparison-card {
  padding: 26px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0 0 6px;
  color: #111827;
  font-size: 24px;
  letter-spacing: -0.03em;
}

.section-header p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.job-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.status-filter {
  display: grid;
  gap: 6px;
  color: #1f2a44;
  font-size: 12px;
  font-weight: 900;
}

.status-filter select {
  min-width: 170px;
}

.jobs-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  background: #ffffff;
  font-size: 12px;
}

.jobs-table th,
.jobs-table td {
  padding: 13px 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.82);
  text-align: left;
  vertical-align: middle;
}

.jobs-table th {
  color: #334155;
  background: linear-gradient(180deg, #f8fafc, #f1f5f9);
  font-weight: 900;
  white-space: nowrap;
}

.jobs-table tr:last-child td {
  border-bottom: 0;
}

.job-row {
  cursor: pointer;
  transition: background 0.16s ease, box-shadow 0.16s ease;
}

.job-row:hover {
  background: rgba(37, 99, 235, 0.04);
}

.job-row-selected,
.job-row.selected {
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.12), rgba(219, 234, 254, 0.36));
  box-shadow: inset 4px 0 0 #2563eb;
}

.job-label {
  color: #172033;
  font-weight: 900;
}

.job-id {
  margin-top: 3px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.jobs-table input[type="checkbox"] {
  width: 22px;
  height: 22px;
  min-height: 22px;
  accent-color: #2563eb;
}

.report-link,
.detail-report-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 7px 12px;
  border: 1px solid rgba(147, 197, 253, 0.58);
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
}

.report-link:hover,
.detail-report-link:hover {
  background: #dbeafe;
}

.job-detail-card {
  margin-top: 22px;
  padding: 22px;
  border-radius: 22px;
}

.job-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.job-detail-header h2 {
  margin: 0;
  color: #111827;
  font-size: 23px;
  letter-spacing: -0.03em;
}

.job-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  min-width: 0;
  padding: 15px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.74), rgba(255, 255, 255, 0.92));
}

.detail-item-wide {
  grid-column: 1 / -1;
}

.detail-item span {
  display: block;
  margin-bottom: 7px;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.detail-item strong {
  display: block;
  color: #111827;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.comparison-message {
  margin-top: 18px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.72);
  color: #334155;
}

.muted {
  color: #64748b;
}

/* ---------------- Selected Jobs Preview ---------------- */

.selected-jobs-preview {
  margin-top: 20px;
  padding: 18px 20px;
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.3), rgba(255, 255, 255, 0.92));
}

.selected-jobs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.selected-jobs-header .section-kicker {
  margin: 0;
}

.selected-jobs-count {
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
}

.selected-jobs-list {
  display: grid;
  gap: 8px;
}

.selected-job-chip {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
  font-size: 12px;
}

.selected-job-id {
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
}

.selected-job-name {
  color: #172033;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-job-status {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: #eef2ff;
  color: #334155;
}

.selected-job-status.status-finished {
  background: #dcfce7;
  color: #166534;
}

.selected-job-status.status-running {
  background: #dbeafe;
  color: #1d4ed8;
}

.selected-job-status.status-failed {
  background: #fee2e2;
  color: #b91c1c;
}

.selected-job-status.status-cancelled {
  background: #f1f5f9;
  color: #475569;
}

.selected-job-time {
  color: #64748b;
  font-size: 11px;
  white-space: nowrap;
}

/* ---------------- Comparison Feedback ---------------- */

.comparison-feedback {
  margin-top: 18px;
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.6;
}

.comparison-feedback.creating {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(37, 99, 235, 0.24);
  background: rgba(219, 234, 254, 0.4);
  color: #1d4ed8;
}

.comparison-feedback.success {
  border: 1px solid rgba(22, 163, 74, 0.24);
  background: rgba(220, 252, 231, 0.4);
  color: #166534;
}

.comparison-feedback.success strong {
  display: block;
  margin-bottom: 8px;
}

.comparison-feedback.error-feedback {
  border: 1px solid rgba(220, 38, 38, 0.24);
  background: rgba(254, 226, 226, 0.4);
  color: #b91c1c;
}

.comparison-feedback.error-feedback strong {
  display: block;
  margin-bottom: 4px;
}

.feedback-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(29, 78, 216, 0.3);
  border-top-color: #1d4ed8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.comparison-hint {
  margin-top: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.7);
  color: #64748b;
  font-size: 12px;
}

/* ---------------- Insight Cards ---------------- */

.insight-section {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.74), rgba(255, 255, 255, 0.92));
}

.insight-section-title {
  margin: 0 0 14px;
  color: #1f2a44;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.insight-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.insight-metric-card {
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
}

.insight-metric-label {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.insight-metric-value {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.insight-metric-exp {
  display: block;
  margin-top: 4px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
}

.insight-extra-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.insight-extra-card {
  flex: 1 1 280px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
}

.insight-extra-card.insight-winner {
  border-color: rgba(34, 197, 94, 0.4);
  background: linear-gradient(180deg, rgba(240, 253, 244, 0.8), rgba(220, 252, 231, 0.6));
}

.insight-extra-card.insight-risk {
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(180deg, rgba(254, 242, 242, 0.8), rgba(254, 226, 226, 0.6));
}

.insight-extra-label {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.insight-extra-body {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.5;
}

.insight-extra-body strong {
  color: #0f172a;
}

.insight-extra-reason {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

/* ---------------- Detail Exports ---------------- */

.detail-exports {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.74), rgba(255, 255, 255, 0.92));
}

.detail-exports-title {
  margin: 0 0 12px;
  color: #1f2a44;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.detail-exports-grid,
.comparison-exports {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-export-item,
.comparison-export-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 9px 14px;
  border: 1px solid rgba(147, 197, 253, 0.5);
  border-radius: 12px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.detail-export-item:hover,
.comparison-export-item:hover {
  transform: translateY(-1px);
  background: #dbeafe;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
}

.detail-export-item.disabled,
.comparison-export-item.disabled {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(248, 250, 252, 0.6);
  color: #94a3b8;
  cursor: default;
  pointer-events: none;
}

.detail-export-icon {
  font-size: 15px;
  line-height: 1;
}

.detail-export-label {
  white-space: nowrap;
}

/* ---------------- Event Timeline ---------------- */

.detail-events {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.detail-events-title {
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.event-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  padding-left: 28px;
}

.event-timeline::before {
  content: "";
  position: absolute;
  left: 10px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: rgba(148, 163, 184, 0.3);
  border-radius: 1px;
}

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  position: relative;
}

.event-icon {
  position: absolute;
  left: -28px;
  top: 10px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background: #f8fafc;
  border-radius: 50%;
  z-index: 1;
}

.event-body {
  flex: 1;
  min-width: 0;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.event-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge-created {
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
}

.badge-started {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.badge-round_progress {
  background: rgba(14, 165, 233, 0.12);
  color: #0284c7;
}

.badge-artifact_written {
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
}

.badge-finished {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.badge-failed {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.badge-cancelled {
  background: rgba(148, 163, 184, 0.15);
  color: #64748b;
}

.event-time {
  font-size: 11px;
  color: #94a3b8;
}

.event-message {
  font-size: 13px;
  color: #475569;
  margin: 0;
}

.event-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

.event-metrics span {
  background: rgba(148, 163, 184, 0.1);
  padding: 2px 6px;
  border-radius: 6px;
}

.event-failure {
  margin-top: 6px;
  font-size: 12px;
  color: #dc2626;
}

.event-failure p {
  margin: 0;
}

.event-traceback {
  margin-top: 4px;
  padding: 8px;
  background: rgba(239, 68, 68, 0.06);
  border-radius: 8px;
  font-size: 11px;
  color: #991b1b;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ---------------- Responsive ---------------- */

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
    grid-template-areas:
      "intro"
      "controls";
    min-height: 0;
  }

  .control-panel {
    max-width: 540px;
  }

  .preview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .status-card,
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section-header {
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .page {
    padding: 18px 12px 36px;
  }

  .hero,
  .comparison-card,
  .chart-card,
  .status-card {
    border-radius: 20px;
  }

  .hero {
    padding: 20px 16px;
  }

  .hero-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  h1 {
    font-size: clamp(22px, 8vw, 32px);
  }

  .status-card,
  .metric-grid,
  .job-detail-grid,
  .preview-grid,
  .preview-detail-grid {
    grid-template-columns: 1fr;
  }

  .jobs-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }

  .section-actions,
  .job-filters {
    width: 100%;
  }

  .section-actions > *,
  .job-filters > * {
    flex: 1 1 100%;
  }

  .lang-switcher {
    margin-top: 22px;
  }

  .selected-job-chip {
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
  }

  .selected-job-id {
    grid-column: 1 / -1;
  }

  .selected-job-name {
    grid-column: 1 / -1;
  }
}
</style>
