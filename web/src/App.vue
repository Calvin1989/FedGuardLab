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
    heroSubtitle: "运行 FL 安全实验，实时查看指标，对比攻防效果",
    categoryLabel: "分类",
    allCategories: "全部分类",
    experimentLabel: "实验配置",
    noConfigsForCategory: "当前分类没有可用配置",
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
    noneValue: "无",
    runExperiment: "运行实验",
    running: "运行中...",
    cancelExperiment: "取消实验",
    statusLabel: "状态",
    jobLabel: "任务 ID",
    errorLabel: "错误",
    reportLabel: "报告",
    openHtmlReport: "查看 HTML 报告",
    openHtmlReportShort: "HTML 报告",
    round: "轮次",
    accuracy: "准确率",
    loss: "损失",
    asr: "攻击成功率",
    chartTitle: "实时联邦学习指标",
    emptyChart: "启动实验后可查看实时指标，完成任务会进入对比历史",
    heroEmptyHint: "选择配置并运行实验，实时指标会在这里更新",
    comparisonTitle: "实验对比",
    comparisonHint: "选择至少两个已完成的实验，生成对比报告",
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
    emptyAll: "已完成且有报告的实验会显示在这里",
    emptyAllStatuses: "暂无任务记录",
    emptyAllStatusesHint: "运行一次实验后，完成的任务会显示在这里",
    emptyAllHint: "切换状态筛选或运行新的实验后再查看",
    emptyFilteredHint: "可以切换状态筛选或稍后刷新历史记录",
    emptyFiltered: "没有找到{status}任务",
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
    jobDetailHint: "选择任务后查看详情",
    comparisonLabel: "对比",
    openComparisonReport: "查看对比报告",
    selectAtLeastTwo: "请至少选择两个已完成的实验",
    selectedJobsTitle: "已选择实验",
    selectedJobsCount: "已选择 {count} 个实验",
    selectedJobsHint: "至少需要选择 2 个实验才能生成对比报告",
    comparisonCreating: "正在生成对比报告…",
    comparisonSuccess: "对比报告已生成",
    comparisonSuccessDescription: "已生成 HTML、CSV、JSON 三种导出文件，可用于分享、归档或继续分析",
    comparisonHtmlShort: "HTML 报告",
    comparisonCsvShort: "CSV",
    comparisonJsonShort: "JSON",
    comparisonFailed: "对比报告生成失败",
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
    lifecycleEvents: "生命周期",
    trainingRoundsTitle: "训练轮次详情",
    trainingRoundsCount: "{count} 条轮次记录",
    trainingRoundsHint: "默认收起轮次日志，展开后在固定高度区域滚动查看，避免页面过长",
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
    heroSubtitle: "Run FL security experiments, stream live metrics, compare outcomes",
    categoryLabel: "Category",
    allCategories: "All categories",
    experimentLabel: "Experiment config",
    noConfigsForCategory: "No configs available for this category",
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
    noneValue: "None",
    runExperiment: "Run Experiment",
    running: "Running...",
    cancelExperiment: "Cancel Experiment",
    statusLabel: "Status",
    jobLabel: "Job ID",
    errorLabel: "Error",
    reportLabel: "Report",
    openHtmlReport: "Open HTML Report",
    openHtmlReportShort: "HTML report",
    round: "Round",
    accuracy: "Accuracy",
    loss: "Loss",
    asr: "Attack Success Rate",
    chartTitle: "Live Federated Learning Metrics",
    emptyChart: "Start an experiment to see live metrics; finished jobs appear in comparison history",
    heroEmptyHint: "Choose a config and run an experiment; live metrics will update here",
    comparisonTitle: "Experiment Comparison",
    comparisonHint: "Select at least two finished experiments and generate a comparison report",
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
    emptyAll: "Finished experiments with reports will appear here",
    emptyAllStatuses: "No jobs recorded yet",
    emptyAllStatusesHint: "Run an experiment and completed jobs will appear here",
    emptyAllHint: "Change the status filter or run another experiment",
    emptyFilteredHint: "Change the status filter or refresh the history later",
    emptyFiltered: "No {status} jobs found",
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
    jobDetailHint: "Select a job to inspect details",
    comparisonLabel: "Comparison",
    openComparisonReport: "Open Comparison Report",
    selectAtLeastTwo: "Please select at least two finished experiments",
    selectedJobsTitle: "Selected Jobs",
    selectedJobsCount: "{count} job(s) selected",
    selectedJobsHint: "Select at least 2 experiments to generate a comparison report",
    comparisonCreating: "Generating comparison report…",
    comparisonSuccess: "Comparison report generated",
    comparisonSuccessDescription: "HTML, CSV, and JSON artifacts are ready for sharing, archiving, or follow-up analysis",
    comparisonHtmlShort: "HTML Report",
    comparisonCsvShort: "CSV",
    comparisonJsonShort: "JSON",
    comparisonFailed: "Failed to generate comparison report",
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
    lifecycleEvents: "Lifecycle",
    trainingRoundsTitle: "Training Round Details",
    trainingRoundsCount: "{count} round records",
    trainingRoundsHint: "Round logs are collapsed by default and scroll inside a fixed-height panel to keep the page compact",
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


const CONFIG_DISPLAY_TEXT = {
  zh: {
    label_flip_demo: {
      name: "标签翻转演示",
      description: "使用 FedAvg 的模拟标签翻转攻击实验",
    },
    mnist_fedavg_demo: {
      name: "MNIST FedAvg 基线实验",
      description: "使用 MNIST 与 FedAvg 的基线训练实验，无攻击",
    },
    mnist_fedavg_dirichlet_demo: {
      name: "MNIST FedAvg 非 IID 实验",
      description: "使用 Dirichlet 数据划分的 MNIST FedAvg 非 IID 训练实验",
    },
    mnist_fedavg_backdoor_demo: {
      name: "MNIST FedAvg 后门攻击",
      description: "使用 MNIST 与 FedAvg 的后门攻击实验，无防御",
    },
    mnist_fedavg_label_flip_demo: {
      name: "MNIST FedAvg 标签翻转",
      description: "使用 MNIST 与 FedAvg 的标签翻转攻击实验，无防御",
    },
    mnist_krum_backdoor_demo: {
      name: "MNIST Krum 后门防御",
      description: "使用 Krum 聚合防御后门攻击的 MNIST 实验",
    },
    mnist_krum_label_flip_demo: {
      name: "MNIST Krum 标签翻转防御",
      description: "使用 Krum 聚合防御标签翻转攻击的 MNIST 实验",
    },
    mnist_median_backdoor_demo: {
      name: "MNIST Median 后门防御",
      description: "使用 Median 聚合防御后门攻击的 MNIST 实验",
    },
    mnist_median_label_flip_demo: {
      name: "MNIST Median 标签翻转防御",
      description: "使用 Median 聚合防御标签翻转攻击的 MNIST 实验",
    },
    mnist_trimmed_mean_backdoor_demo: {
      name: "MNIST Trimmed Mean 后门防御",
      description: "使用 Trimmed Mean 聚合防御后门攻击的 MNIST 实验",
    },
    mnist_trimmed_mean_label_flip_demo: {
      name: "MNIST Trimmed Mean 标签翻转防御",
      description: "使用 Trimmed Mean 聚合防御标签翻转攻击的 MNIST 实验",
    },
  },
};

const TAG_DISPLAY_TEXT = {
  zh: {
    simulated: "模拟",
    label_flipping: "标签翻转",
    fedavg: "FedAvg",
    mnist: "MNIST",
    backdoor: "后门",
    baseline: "基线",
    attack: "攻击",
    defense: "防御",
    dirichlet: "Dirichlet",
    "non-iid": "非 IID",
    krum: "Krum",
    median: "Median",
    trimmed_mean: "Trimmed Mean",
  },
};

function setLanguage(lang) {
  language.value = lang;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

function withLang(url) {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}lang=${language.value}`;
}


function getConfigKey(option) {
  if (!option) {
    return "";
  }

  const rawValue = option.value || option.path || option.label || "";
  const normalized = String(rawValue)
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .replace(/\.ya?ml$/i, "");

  return option.experiment?.name || option.metadata?.name_key || normalized;
}

function getLocalizedConfigDisplay(option) {
  const key = getConfigKey(option);
  const localized = CONFIG_DISPLAY_TEXT[language.value]?.[key];

  return {
    name: localized?.name || option?.metadata?.name || option?.label || key,
    description:
      localized?.description ||
      option?.metadata?.description ||
      option?.description ||
      "",
  };
}

function formatConfigTag(tag) {
  return TAG_DISPLAY_TEXT[language.value]?.[tag] || tag;
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


const selectedConfigOption = computed(() =>
  experimentOptions.value.find((item) => item.value === selectedConfig.value)
);


const selectedExperimentDescription = computed(() => {
  return getLocalizedConfigDisplay(selectedConfigOption.value).description;
});


const selectedConfigPreview = computed(() => {
  return selectedConfigOption.value?.preview || null;
});


const displayConfigPreview = computed(() => {
  const preview = selectedConfigPreview.value;

  if (!preview) {
    return null;
  }

  return {
    ...preview,
    attack: formatAttackDisplay(
      selectedConfigOption.value?.attack,
      preview.attack
    ),
    defense: formatDefenseDisplay(
      selectedConfigOption.value?.defense,
      preview.defense
    ),
  };
});


const selectedConfigMetadata = computed(() => {
  const option = experimentOptions.value.find(
    (item) => item.value === selectedConfig.value
  );

  if (!option?.metadata) {
    return null;
  }

  const meta = option.metadata;
  const display = getLocalizedConfigDisplay(option);

  return {
    name: display.name,
    description: display.description,
    category: meta.category || "",
    tags: Array.isArray(meta.tags) ? meta.tags.map(formatConfigTag) : [],
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

  return option ? getLocalizedConfigDisplay(option).name : selectedConfig.value;
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


function titleizeDisplayValue(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}


function formatAttackDisplay(attackConfig, fallbackValue = "") {
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


function formatDefenseDisplay(defenseConfig, fallbackValue = "") {
  const type = defenseConfig?.type || fallbackValue;

  if (!type || type === "—") {
    return "—";
  }

  if (type === "none") {
    return t.value.noneValue;
  }

  return titleizeDisplayValue(type);
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


const selectedLifecycleEvents = computed(() => {
  const events = selectedDetailJob.value?.events || [];
  return events.filter((event) => event.type !== "round_progress");
});


const selectedRoundEvents = computed(() => {
  const events = selectedDetailJob.value?.events || [];
  return events.filter((event) => event.type === "round_progress");
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
    <div class="global-toolbar" aria-label="Global toolbar">
      <div class="topbar-brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>FedGuardLab</span>
      </div>

      <div class="lang-switcher" aria-label="Language switcher">
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

    <section class="dashboard-shell dashboard-shell-v7">
      <section class="command-card">
        <div class="command-main">
          <div class="command-copy">
            <h1>{{ t.heroTitle }}</h1>
            <p class="subtitle">{{ t.heroSubtitle }}</p>
          </div>
        </div>

        <div class="command-controls">
          <label class="field-control" for="category-filter">
            <span>{{ t.categoryLabel }}</span>
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
          </label>

          <label class="field-control field-control-wide" for="experiment-select">
            <span>{{ t.experimentLabel }}</span>
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
            <span v-else class="config-empty-filter">
              {{ t.noConfigsForCategory }}
            </span>
          </label>

          <div class="command-run-group">
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

        <div v-if="selectedConfigMetadata" class="selected-config-summary">
          <div class="selected-config-copy">
            <span class="selected-config-kicker">{{ t.configPreview }}</span>
            <strong>{{ selectedConfigMetadata.name || getSelectedExperimentLabel() }}</strong>
            <p>
              {{ selectedConfigMetadata.description || selectedExperimentDescription }}
            </p>
          </div>

          <div
            v-if="selectedConfigMetadata.tags.length > 0"
            class="selected-config-tags"
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

        <div v-if="displayConfigPreview" class="config-preview compact config-preview-line">
          <div class="preview-grid compact">
            <div class="preview-item">
              <span class="preview-label">{{ t.previewDataset }}</span>
              <strong>{{ displayConfigPreview.dataset }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewAggregation }}</span>
              <strong>{{ displayConfigPreview.aggregation }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewAttack }}</span>
              <strong class="preview-value" :title="displayConfigPreview.attack">{{ displayConfigPreview.attack }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewDefense }}</span>
              <strong class="preview-value" :title="displayConfigPreview.defense">{{ displayConfigPreview.defense }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewRounds }}</span>
              <strong>{{ displayConfigPreview.rounds }}</strong>
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ t.previewClients }}</span>
              <strong>{{ displayConfigPreview.clients }}</strong>
            </div>
            <div class="preview-item risk-preview">
              <span class="preview-label">{{ t.previewRiskLevel }}</span>
              <strong>
                <span class="risk-badge" :class="'risk-' + displayConfigPreview.risk_level">
                  {{ t.riskLevels[displayConfigPreview.risk_level] || displayConfigPreview.risk_level }}
                </span>
              </strong>
            </div>
          </div>

          <details class="preview-details">
            <summary>{{ t.previewDetails }}</summary>
            <div class="preview-detail-grid">
              <div class="preview-item">
                <span class="preview-label">{{ t.previewPartition }}</span>
                <strong>{{ displayConfigPreview.partition }}</strong>
              </div>
              <div class="preview-item">
                <span class="preview-label">{{ t.previewMalicious }}</span>
                <strong>{{ displayConfigPreview.malicious_clients }}</strong>
              </div>
              <div class="preview-item">
                <span class="preview-label">{{ t.previewLocalEpochs }}</span>
                <strong>{{ displayConfigPreview.local_epochs }}</strong>
              </div>
              <div class="preview-item">
                <span class="preview-label">{{ t.previewBatchSize }}</span>
                <strong>{{ displayConfigPreview.batch_size }}</strong>
              </div>
              <div class="preview-item">
                <span class="preview-label">{{ t.previewLearningRate }}</span>
                <strong>{{ displayConfigPreview.learning_rate }}</strong>
              </div>
            </div>
            <div v-if="displayConfigPreview.recommended_use" class="preview-recommended">
              <span class="preview-label">{{ t.previewRecommendedUse }}</span>
              <p>{{ displayConfigPreview.recommended_use }}</p>
            </div>
            <div v-if="displayConfigPreview.explanations" class="explanation-list">
              <p v-for="(val, key) in displayConfigPreview.explanations" :key="key">
                <strong>{{ key }}:</strong> {{ val }}
              </p>
            </div>
          </details>
        </div>
      </section>

      <section class="monitor-card">
        <div class="runtime-panel">
          <div class="runtime-row">
            <div class="runtime-item">
              <span class="runtime-label">{{ t.statusLabel }}</span>
              <strong class="runtime-value runtime-text-value">{{ t.statusValues[status] || status }}</strong>
            </div>

            <div v-if="jobId" class="runtime-item wide">
              <span class="runtime-label">{{ t.jobLabel }}</span>
              <strong class="runtime-value">{{ jobId }}</strong>
            </div>

            <div v-if="latestMetric" class="hero-metric-item">
              <span class="runtime-label">{{ t.round }}</span>
              <strong class="runtime-value">{{ latestMetric.round }}</strong>
            </div>
            <div v-if="latestMetric" class="hero-metric-item">
              <span class="runtime-label">{{ t.accuracy }}</span>
              <strong class="runtime-value">{{ latestMetric.accuracy }}</strong>
            </div>
            <div v-if="latestMetric" class="hero-metric-item">
              <span class="runtime-label">{{ t.loss }}</span>
              <strong class="runtime-value">{{ latestMetric.loss }}</strong>
            </div>
            <div v-if="latestMetric" class="hero-metric-item">
              <span class="runtime-label">{{ t.asr }}</span>
              <strong class="runtime-value">{{ latestMetric.attack_success_rate }}</strong>
            </div>
            <div v-if="jobId || reportUrl" class="runtime-item runtime-action" :class="{ 'is-disabled': !reportUrl }">
              <span class="runtime-label">{{ t.reportLabel }}</span>
              <a
                v-if="reportUrl"
                class="runtime-value runtime-text-value runtime-report-link runtime-report-value"
                :href="withLang(reportUrl)"
                target="_blank"
              >
                {{ t.openHtmlReportShort || t.openHtmlReport }}
              </a>
              <strong v-else class="runtime-value runtime-text-value runtime-report-value">{{ t.notReady }}</strong>
            </div>
          </div>

          <div v-if="errorMessage" class="runtime-error">
            <strong>{{ t.errorLabel }}:</strong>
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <section class="chart-card" :class="{ 'is-empty': metrics.length === 0 }">
          <Line
            v-if="metrics.length > 0"
            :data="chartData"
            :options="chartOptions"
          />

          <div v-else class="empty-state">
            {{ t.emptyChart }}
          </div>
        </section>
      </section>
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

      <div v-if="recentJobs.length === 0" class="empty-state small comparison-empty-state">
        <template v-if="jobStatusFilter === 'all'">
          <strong>{{ t.emptyAllStatuses }}</strong>
          <span>{{ t.emptyAllStatusesHint }}</span>
        </template>
        <template v-else-if="jobStatusFilter === 'finished_report'">
          <strong>{{ t.emptyAll }}</strong>
          <span>{{ t.emptyAllHint }}</span>
        </template>
        <template v-else>
          <strong>{{ t.emptyFiltered.replace('{status}', t.statusValues[jobStatusFilter] || jobStatusFilter) }}</strong>
          <span>{{ t.emptyFilteredHint }}</span>
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

      <div v-if="recentJobs.length > 0" class="job-detail-card">
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

          <div class="detail-events compact-events">
            <div class="detail-events-heading">
              <div>
                <h3 class="detail-events-title">{{ t.eventTimeline }}</h3>
                <p class="detail-events-subtitle">{{ t.lifecycleEvents }}</p>
              </div>
              <span v-if="selectedRoundEvents.length > 0" class="round-count-pill">
                {{ t.trainingRoundsCount.replace('{count}', selectedRoundEvents.length) }}
              </span>
            </div>

            <div v-if="selectedLifecycleEvents.length > 0" class="event-timeline lifecycle-timeline">
              <div
                v-for="(ev, idx) in selectedLifecycleEvents"
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
                  <div v-if="ev.type === 'failed' && ev.details" class="event-failure">
                    <p><strong>{{ t.eventFailureReason }}:</strong> {{ ev.details.error }}</p>
                    <pre v-if="ev.details.traceback_summary" class="event-traceback">{{ ev.details.traceback_summary }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <details v-if="selectedRoundEvents.length > 0" class="round-log-panel">
              <summary>
                <span>{{ t.trainingRoundsTitle }}</span>
                <strong>{{ t.trainingRoundsCount.replace('{count}', selectedRoundEvents.length) }}</strong>
              </summary>
              <p class="round-log-hint">{{ t.trainingRoundsHint }}</p>
              <div class="round-log-list">
                <div
                  v-for="(ev, idx) in selectedRoundEvents"
                  :key="idx"
                  class="round-log-row"
                >
                  <div class="round-log-main">
                    <span class="event-badge badge-round_progress">{{ t.eventType.round_progress }}</span>
                    <strong>{{ t.eventRound }} {{ ev.round }}/{{ ev.total_rounds }}</strong>
                    <span>{{ formatEventTime(ev.created_at) }}</span>
                  </div>
                  <div v-if="ev.metrics" class="round-log-metrics">
                    <span>{{ t.accuracy }}: {{ ev.metrics.accuracy }}</span>
                    <span>{{ t.loss }}: {{ ev.metrics.loss }}</span>
                    <span>{{ t.asr }}: {{ ev.metrics.attack_success_rate }}</span>
                  </div>
                </div>
              </div>
            </details>

            <div
              v-if="selectedLifecycleEvents.length === 0 && selectedRoundEvents.length === 0"
              class="empty-state small"
            >
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

      <div v-if="comparisonStatus === 'finished' && comparisonUrl" class="comparison-feedback success comparison-result-card">
        <div class="comparison-result-copy">
          <strong>{{ t.comparisonSuccess }}</strong>
          <span>{{ t.comparisonSuccessDescription }}</span>
        </div>
        <div class="comparison-exports" :aria-label="t.comparisonExportsTitle">
          <a
            class="comparison-export-item"
            :href="withLang(comparisonArtifactUrl('comparison_html_url'))"
            target="_blank"
            rel="noreferrer"
          >
            <span class="detail-export-label">{{ t.comparisonHtmlShort }}</span>
          </a>
          <a
            v-if="comparisonArtifactUrl('comparison_csv_url')"
            class="comparison-export-item"
            :href="comparisonArtifactUrl('comparison_csv_url')"
            target="_blank"
            rel="noreferrer"
          >
            <span class="detail-export-label">{{ t.comparisonCsvShort }}</span>
          </a>
          <span v-else class="comparison-export-item disabled">
            <span class="detail-export-label">{{ t.comparisonCsvShort }}</span>
          </span>
          <a
            v-if="comparisonArtifactUrl('comparison_json_url')"
            class="comparison-export-item"
            :href="comparisonArtifactUrl('comparison_json_url')"
            target="_blank"
            rel="noreferrer"
          >
            <span class="detail-export-label">{{ t.comparisonJsonShort }}</span>
          </a>
          <span v-else class="comparison-export-item disabled">
            <span class="detail-export-label">{{ t.comparisonJsonShort }}</span>
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
    radial-gradient(circle at 10% 0%, rgba(99, 102, 241, 0.16), transparent 30%),
    radial-gradient(circle at 90% 4%, rgba(56, 189, 248, 0.18), transparent 32%),
    linear-gradient(135deg, #f7f8ff 0%, #f8fbff 50%, #f7f3ff 100%);
}

:global(body) {
  margin: 0;
  min-height: 100vh;
}

.page {
  min-height: 100vh;
  padding: 28px 24px 72px;
  color: #101828;
  font-family:
    Inter, "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", system-ui,
    -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.page > *,
.global-toolbar,
.dashboard-shell,
.comparison-card {
  width: min(1180px, calc(100vw - 48px));
  margin-left: auto;
  margin-right: auto;
}

/* Top bar */
.global-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 42px;
  margin-bottom: 18px;
}

.topbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.brand-mark {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #22c55e, #2563eb);
  box-shadow:
    0 0 0 5px rgba(59, 130, 246, 0.10),
    0 8px 20px rgba(37, 99, 235, 0.20);
}

.lang-switcher {
  display: grid;
  grid-template-columns: 76px 76px;
  width: 160px;
  height: 40px;
  padding: 4px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.10);
  backdrop-filter: blur(14px);
}

.lang-button {
  width: 76px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
  line-height: 32px;
  white-space: nowrap;
  cursor: pointer;
}

.lang-button.active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}

/* Shared cards */
.dashboard-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  margin-bottom: 26px;
}

.command-card,
.monitor-card,
.comparison-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 26px;
  background:
    radial-gradient(circle at 96% 96%, rgba(59, 130, 246, 0.12), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 251, 255, 0.86));
  box-shadow:
    0 22px 70px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.command-card::after,
.monitor-card::after {
  content: "";
  position: absolute;
  right: -120px;
  bottom: -180px;
  width: 340px;
  height: 340px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.13), transparent 68%);
  pointer-events: none;
}

.command-card > *,
.monitor-card > *,
.comparison-card > * {
  position: relative;
  z-index: 1;
}

/* Command card */
.command-card {
  padding: 28px 30px 24px;
}

.command-main {
  margin-bottom: 20px;
}

.command-copy h1 {
  max-width: 720px;
  margin: 0;
  color: #0f172a;
  font-size: clamp(32px, 4.1vw, 50px);
  line-height: 1.04;
  letter-spacing: -0.055em;
}

.subtitle {
  max-width: 620px;
  margin: 10px 0 0;
  color: #5f6f87;
  font-size: 14px;
  line-height: 1.55;
}

.command-controls {
  display: grid;
  grid-template-columns: 180px minmax(280px, 420px) auto;
  align-items: end;
  gap: 12px;
}

.field-control {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.field-control > span:first-child,
.field-label {
  color: #172033;
  font-size: 12px;
  font-weight: 900;
}

.experiment-select,
.status-filter select,
select,
input {
  width: 100%;
  min-height: 38px;
  padding: 7px 12px;
  border: 1px solid rgba(148, 163, 184, 0.46);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.94);
  color: #172033;
  font-size: 13px;
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
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10);
}

.config-empty-filter {
  min-height: 38px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 1px dashed rgba(148, 163, 184, 0.46);
  border-radius: 13px;
  color: #64748b;
  font-size: 12px;
}

.command-run-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.run-button,
.secondary-button,
.report-link,
.detail-report-link,
.detail-export-item,
.comparison-export-item {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 13px;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  word-break: keep-all;
  cursor: pointer;
}

.run-button {
  border: 1px solid #1d4ed8;
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
}

.run-button:disabled,
.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.secondary-button,
.report-link,
.detail-report-link,
.detail-export-item,
.comparison-export-item {
  border: 1px solid rgba(96, 165, 250, 0.48);
  background: rgba(239, 246, 255, 0.78);
  color: #2563eb;
}

.selected-config-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.62);
}

.selected-config-copy {
  min-width: 0;
}

.selected-config-kicker {
  display: block;
  margin-bottom: 3px;
  color: #2563eb;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.selected-config-copy strong {
  display: block;
  color: #111827;
  font-size: 14px;
  line-height: 1.25;
}

.selected-config-copy p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.selected-config-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 360px;
}

.config-tag,
.job-badge,
.status-badge,
.risk-badge,
.selected-job-status,
.event-badge,
.round-count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  background: #edf2ff;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.config-preview-line {
  margin-top: 12px;
}

.preview-grid.compact {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.preview-item,
.runtime-item,
.hero-metric-item,
.detail-item,
.insight-metric-card,
.insight-extra-card {
  min-width: 0;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.70);
}

.preview-item {
  min-height: 52px;
  padding: 9px 10px;
}

.preview-label,
.runtime-item span,
.hero-metric-item span,
.detail-item span,
.insight-metric-label,
.insight-extra-label {
  display: block;
  margin-bottom: 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
}

.preview-item strong,
.detail-item strong {
  display: block;
  color: #111827;
  font-size: 14px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.risk-badge {
  background: #fef3c7;
  color: #92400e;
}

.risk-low {
  background: #dcfce7;
  color: #166534;
}

.risk-high {
  background: #fee2e2;
  color: #991b1b;
}

.preview-details {
  margin-top: 10px;
  color: #475569;
  font-size: 12px;
}

.preview-details summary {
  width: max-content;
  cursor: pointer;
  color: #64748b;
  font-weight: 900;
}

.preview-detail-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.preview-recommended,
.explanation-list {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.80);
}

.preview-recommended p,
.explanation-list p {
  margin: 4px 0 0;
  color: #475569;
  line-height: 1.55;
}

/* Runtime monitor */
.monitor-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  padding: 20px;
}

.runtime-panel {
  min-width: 0;
}

.runtime-row {
  display: grid;
  grid-template-columns: minmax(112px, 0.75fr) minmax(220px, 1.6fr) minmax(130px, 0.9fr) repeat(4, minmax(100px, 1fr));
  align-items: stretch;
  gap: 10px;
}

.runtime-item,
.hero-metric-item {
  min-height: 64px;
  padding: 10px 12px;
}

.runtime-item.wide strong {
  display: block;
  color: #111827;
  font-size: 11px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.runtime-item strong,
.hero-metric-item strong {
  display: block;
  color: #111827;
  font-size: 20px;
  line-height: 1.05;
}

.runtime-action .report-link {
  width: 100%;
  max-width: 150px;
  min-height: 34px;
  padding: 0 10px;
}

.status-idle,
.status-queued {
  background: #eef2ff;
  color: #475569;
}

.status-running,
.status-creating {
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
  color: #991b1b;
}

.runtime-error {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff1f2;
  color: #9f1239;
  font-size: 12px;
}

.chart-card {
  width: 100%;
  min-height: 300px;
  height: 300px;
  padding: 16px 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.74);
}

.chart-card > div,
.chart-card canvas {
  width: 100% !important;
  height: 100% !important;
  max-height: none !important;
}

.chart-card.is-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  width: 100%;
  min-height: 82px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 18px;
  color: #64748b;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
}

.chart-card .empty-state {
  height: 100%;
  min-height: 100%;
}

.empty-state.small {
  min-height: 70px;
  margin-top: 16px;
}

/* Comparison */
.comparison-card {
  padding: 26px 28px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.section-header h2,
.job-detail-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  letter-spacing: -0.035em;
}

.section-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.section-actions,
.job-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.section-actions {
  justify-content: flex-end;
}

.job-filters {
  margin-top: 14px;
}

.status-filter {
  display: grid;
  gap: 5px;
  min-width: 170px;
  color: #172033;
  font-size: 12px;
  font-weight: 900;
}

.jobs-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  font-size: 12px;
}

.jobs-table th,
.jobs-table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.88);
  text-align: left;
  vertical-align: middle;
}

.jobs-table th {
  background: rgba(248, 250, 252, 0.90);
  color: #334155;
  font-size: 12px;
  font-weight: 900;
}

.jobs-table tr:last-child td {
  border-bottom: 0;
}

.job-row {
  cursor: pointer;
}

.job-row:hover,
.job-row-selected,
.job-row.selected {
  background: rgba(239, 246, 255, 0.72);
}

.jobs-table input[type="checkbox"] {
  width: 22px;
  height: 22px;
  min-height: 0;
  padding: 0;
  border-radius: 5px;
  cursor: pointer;
}

.job-label {
  color: #111827;
  font-weight: 900;
}

.job-id {
  margin-top: 2px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
}

.job-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.job-badge.success {
  background: #dcfce7;
  color: #166534;
}

.job-badge.muted {
  background: #f1f5f9;
  color: #64748b;
}

.job-detail-card {
  margin-top: 18px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
}

.job-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-kicker {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.job-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-item {
  padding: 12px 14px;
}

.detail-item-wide {
  grid-column: 1 / -1;
}

.detail-exports {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.70);
}

.detail-exports-title,
.detail-events-title,
.insight-section-title {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 14px;
}

.detail-exports-grid,
.comparison-exports {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-export-item.disabled,
.comparison-export-item.disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.detail-events {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(226, 232, 240, 0.90);
}

.detail-events-heading,
.selected-jobs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-events-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.event-timeline {
  display: grid;
  gap: 10px;
}

.event-item {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
}

.event-icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #eef2ff;
  font-size: 12px;
}

.event-body {
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.80);
}

.event-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.event-time {
  color: #94a3b8;
  font-size: 11px;
}

.event-message {
  margin: 5px 0 0;
  color: #475569;
  font-size: 12px;
  line-height: 1.5;
}

.event-failure,
.event-traceback,
.round-log-panel {
  margin-top: 10px;
}

.event-traceback {
  overflow: auto;
  max-height: 140px;
  padding: 10px;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 11px;
}

.round-log-panel {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.72);
}

.round-log-panel summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
  color: #0f172a;
  font-weight: 900;
}

.round-log-hint {
  margin: 0 14px 10px;
  color: #64748b;
  font-size: 12px;
}

.round-log-list {
  max-height: 260px;
  overflow: auto;
  padding: 0 14px 14px;
}

.round-log-row {
  padding: 10px 0;
  border-top: 1px solid rgba(226, 232, 240, 0.90);
}

.round-log-main,
.round-log-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: #475569;
  font-size: 12px;
}

.round-log-main strong {
  color: #111827;
}

.round-log-metrics {
  margin-top: 6px;
}

.selected-jobs-preview,
.comparison-feedback,
.insight-section,
.comparison-hint {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.72);
}

.selected-jobs-count {
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
}

.selected-jobs-list {
  display: grid;
  gap: 8px;
}

.selected-job-chip {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
}

.selected-job-id {
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.selected-job-name {
  min-width: 0;
  overflow: hidden;
  color: #111827;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comparison-feedback.success {
  background: #f0fdf4;
  color: #166534;
}

.comparison-feedback.creating {
  color: #2563eb;
}

.error-feedback {
  background: #fff1f2;
  color: #9f1239;
}

.feedback-spinner {
  width: 16px;
  height: 16px;
  display: inline-flex;
  margin-right: 8px;
  border: 2px solid rgba(37, 99, 235, 0.22);
  border-top-color: #2563eb;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.insight-cards-grid,
.insight-extra-cards {
  display: grid;
  gap: 10px;
}

.insight-cards-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.insight-extra-cards {
  margin-top: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.insight-metric-card,
.insight-extra-card {
  padding: 12px 14px;
}

.insight-metric-value {
  display: block;
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
}

.insight-metric-exp,
.insight-extra-reason,
.insight-extra-body {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 1180px) {
  .preview-grid.compact {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .runtime-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .runtime-item.wide {
    grid-column: span 2;
  }

  .jobs-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}

@media (max-width: 860px) {
  .page {
    padding: 18px 14px 56px;
  }

  .page > *,
  .global-toolbar,
  .dashboard-shell,
  .comparison-card {
    width: min(100%, calc(100vw - 28px));
  }

  .global-toolbar {
    align-items: flex-start;
  }

  .command-card,
  .monitor-card,
  .comparison-card {
    border-radius: 22px;
  }

  .command-card {
    padding: 22px 16px 18px;
  }

  .command-controls,
  .selected-config-summary,
  .section-header,
  .job-detail-header {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .selected-config-tags,
  .section-actions {
    justify-content: flex-start;
  }

  .command-copy h1 {
    font-size: clamp(30px, 9vw, 42px);
  }

  .preview-grid.compact,
  .preview-detail-grid,
  .runtime-row,
  .job-detail-grid,
  .insight-cards-grid,
  .insight-extra-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .runtime-item.wide,
  .detail-item-wide {
    grid-column: 1 / -1;
  }

  .chart-card {
    height: 240px;
    min-height: 240px;
  }

  .selected-job-chip {
    grid-template-columns: 80px minmax(0, 1fr);
  }
}

@media (max-width: 560px) {
  .topbar-brand {
    font-size: 11px;
  }

  .lang-switcher {
    grid-template-columns: 58px 58px;
    width: 124px;
  }

  .lang-button {
    width: 58px;
    font-size: 10px;
  }

  .preview-grid.compact,
  .preview-detail-grid,
  .runtime-row,
  .job-detail-grid,
  .insight-cards-grid,
  .insight-extra-cards {
    grid-template-columns: 1fr;
  }
}


/* v1.8.3 unified product UI polish */
:global(html) {
  background:
    radial-gradient(circle at 8% 0%, rgba(37, 99, 235, 0.08), transparent 28%),
    radial-gradient(circle at 92% 2%, rgba(14, 165, 233, 0.09), transparent 30%),
    linear-gradient(135deg, #f8fafc 0%, #f6f8fb 46%, #f7f5fb 100%);
}

.page {
  padding: 22px 24px 64px;
}

.page > *,
.global-toolbar,
.dashboard-shell,
.comparison-card {
  width: min(1200px, calc(100vw - 48px));
}

.global-toolbar {
  min-height: 36px;
  margin-bottom: 14px;
}

.topbar-brand {
  color: #172554;
  font-size: 12px;
  letter-spacing: 0.16em;
}

.lang-switcher {
  height: 36px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.command-card,
.monitor-card,
.comparison-card {
  border-color: rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.07);
}

.command-card::after,
.monitor-card::after {
  display: none;
}

.command-card {
  padding: 24px 26px 20px;
}

.command-main {
  margin-bottom: 16px;
}

.command-copy h1 {
  max-width: 680px;
  font-size: clamp(30px, 3.1vw, 42px);
  letter-spacing: -0.045em;
}

.subtitle {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.55;
}

.command-controls {
  grid-template-columns: 190px minmax(300px, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.experiment-select,
.status-filter select,
select,
input {
  min-height: 36px;
  border-radius: 10px;
  background: #ffffff;
}

.run-button,
.secondary-button,
.report-link,
.detail-report-link,
.detail-export-item,
.comparison-export-item {
  min-height: 36px;
  border-radius: 10px;
  box-shadow: none;
}

.run-button {
  background: #1d4ed8;
}

.secondary-button,
.report-link,
.detail-report-link,
.detail-export-item,
.comparison-export-item {
  background: #eff6ff;
}

.report-link.disabled,
.runtime-action.is-disabled .report-link {
  border-color: rgba(148, 163, 184, 0.28);
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.selected-config-summary,
.preview-item,
.runtime-item,
.hero-metric-item,
.detail-item,
.insight-metric-card,
.insight-extra-card,
.job-detail-card,
.selected-jobs-preview,
.comparison-feedback,
.insight-section,
.comparison-hint {
  border-color: rgba(148, 163, 184, 0.22);
  background: #ffffff;
  box-shadow: none;
}

.selected-config-summary {
  margin-top: 14px;
}

.preview-grid.compact {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.preview-item {
  min-height: 58px;
}

.monitor-card {
  padding: 18px;
  gap: 12px;
}

.runtime-row {
  grid-template-columns: minmax(108px, 0.7fr) minmax(230px, 1.7fr) minmax(130px, 0.8fr) repeat(4, minmax(96px, 1fr));
  gap: 10px;
}

.runtime-item,
.hero-metric-item {
  min-height: 62px;
}

.runtime-action .report-link {
  max-width: none;
}

.chart-card {
  height: 270px;
  min-height: 270px;
  border-radius: 18px;
  background: #ffffff;
}

.comparison-card {
  padding: 24px 26px;
}

.section-header {
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.86);
}

.section-header h2,
.job-detail-header h2 {
  font-size: 22px;
}

.job-filters {
  margin-top: 12px;
}

.section-actions {
  align-items: flex-end;
}

.jobs-table {
  border-radius: 14px;
  background: #ffffff;
}

.jobs-table th,
.jobs-table td {
  padding: 11px 12px;
}

.jobs-table th {
  background: #f8fafc;
  color: #334155;
}

.job-row:hover,
.job-row-selected,
.job-row.selected {
  background: #f8fbff;
}

.jobs-table input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.job-detail-card {
  border-radius: 18px;
}

.detail-exports,
.round-log-panel {
  border-color: rgba(148, 163, 184, 0.22);
  background: #f8fafc;
}

.detail-export-icon {
  display: none;
}

.selected-job-chip {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
}

.comparison-feedback.success {
  border-color: rgba(34, 197, 94, 0.26);
  background: #f0fdf4;
}

.insight-cards-grid,
.insight-extra-cards {
  gap: 12px;
}

.insight-metric-value {
  font-size: 24px;
}

@media (max-width: 1180px) {
  .runtime-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .page > *,
  .global-toolbar,
  .dashboard-shell,
  .comparison-card {
    width: min(100%, calc(100vw - 28px));
  }

  .command-controls {
    grid-template-columns: 1fr;
  }

  .preview-grid.compact,
  .preview-detail-grid,
  .runtime-row,
  .job-detail-grid,
  .insight-cards-grid,
  .insight-extra-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .preview-grid.compact,
  .preview-detail-grid,
  .runtime-row,
  .job-detail-grid,
  .insight-cards-grid,
  .insight-extra-cards {
    grid-template-columns: 1fr;
  }
}


/* v1.8.4 final UI polish: typography, alignment, motion, and export layout */
:global(html) {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.page {
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "PingFang SC",
    "Microsoft YaHei",
    "Noto Sans CJK SC",
    sans-serif;
  font-variant-numeric: tabular-nums;
}

.topbar-brand {
  font-weight: 800;
  letter-spacing: 0.13em;
}

.lang-switcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: 34px;
  padding: 3px;
  gap: 3px;
  border-color: rgba(148, 163, 184, 0.26);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
}

.lang-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 74px;
  height: 28px;
  min-height: 28px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  transform: none;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.lang-button.active {
  transform: none;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.16);
}

.command-copy h1 {
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

.section-header h2,
.job-detail-header h2 {
  font-weight: 800;
  letter-spacing: -0.02em;
}

.field-control > span:first-child,
.field-label,
.preview-label,
.runtime-label,
.detail-label,
.insight-metric-label,
.insight-extra-label {
  font-weight: 800;
  line-height: 1.35;
}

.subtitle,
.section-header p,
.preview-description,
.detail-value,
.round-log-metrics,
.insight-extra-body,
.insight-extra-reason,
.comparison-result-copy span {
  line-height: 1.65;
}

.run-button,
.secondary-button,
.report-link,
.detail-report-link,
.detail-export-item,
.comparison-export-item,
.status-badge,
.selected-job-status,
.risk-badge {
  min-height: 34px;
  line-height: 1;
  align-items: center;
  font-weight: 800;
}

.status-badge,
.selected-job-status,
.risk-badge {
  display: inline-flex;
  justify-content: center;
  padding-top: 0;
  padding-bottom: 0;
}

.command-card,
.monitor-card,
.comparison-card,
.job-detail-card,
.insight-section,
.selected-jobs-preview {
  animation: cardFadeIn 0.28s ease-out both;
}

.comparison-feedback.success,
.comparison-feedback.creating,
.error-feedback {
  animation: cardFadeIn 0.22s ease-out both;
}

.run-button,
.secondary-button,
.report-link,
.detail-report-link,
.detail-export-item,
.comparison-export-item,
.job-row,
.lang-button {
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.run-button:not(:disabled):hover,
.secondary-button:not(:disabled):hover,
.report-link:not(.disabled):hover,
.detail-report-link:hover,
.detail-export-item:not(.disabled):hover,
.comparison-export-item:not(.disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.comparison-result-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
}

.comparison-result-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.comparison-result-copy strong {
  color: #14532d;
  font-size: 14px;
  font-weight: 800;
}

.comparison-result-copy span {
  color: #3f684d;
  font-size: 12px;
}

.comparison-result-card .comparison-exports {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.comparison-result-card .comparison-export-item {
  min-width: 92px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  background: #ffffff;
}

.job-detail-card {
  margin-top: 18px;
}

.job-detail-grid {
  gap: 10px;
}

.detail-item {
  border-color: rgba(226, 232, 240, 0.9);
  background: #ffffff;
}

.insight-extra-card,
.insight-metric-card {
  padding: 16px;
}

.insight-extra-body,
.insight-extra-reason {
  margin-bottom: 0;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 760px) {
  .comparison-result-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .comparison-result-card .comparison-exports {
    justify-content: flex-start;
    width: 100%;
  }
}

@media (max-width: 560px) {
  .lang-switcher {
    height: 32px;
  }

  .lang-button {
    width: 62px;
    height: 26px;
    min-height: 26px;
    font-size: 10px;
  }
}


/* v1.8.5 dashboard microcopy, empty-state, and alignment polish */
.command-controls {
  grid-template-columns: 180px minmax(300px, 560px) auto;
  justify-content: start;
}

.command-controls .field-control:nth-child(2),
.experiment-select {
  max-width: 560px;
}

.preview-value {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: keep-all;
}

.runtime-item,
.hero-metric-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.runtime-label {
  display: block;
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
}

.runtime-value {
  display: flex;
  align-items: center;
  min-height: 30px;
  margin: 0;
  line-height: 1.15;
}

.runtime-item.wide .runtime-value {
  min-height: auto;
  align-items: flex-start;
  line-height: 1.35;
}

.runtime-action {
  gap: 6px;
}

.runtime-action .runtime-report-link {
  align-self: flex-start;
  width: auto;
  min-width: 88px;
  height: 30px;
  min-height: 30px;
  max-width: 100%;
  padding: 0 12px;
  border-radius: 999px;
}

.status-badge {
  height: 30px;
  min-height: 30px;
  padding: 0 13px;
  font-size: 12px;
  line-height: 1;
}

.report-link.disabled,
.runtime-action.is-disabled .runtime-report-link {
  border-color: rgba(148, 163, 184, 0.26);
  background: #f8fafc;
  color: #94a3b8;
  box-shadow: none;
}

.comparison-empty-state {
  min-height: 112px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 22px 24px;
  text-align: center;
}

.comparison-empty-state strong {
  display: block;
  color: #475569;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
}

.comparison-empty-state span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.45;
}

.section-actions .secondary-button:disabled,
.section-actions .run-button:disabled {
  opacity: 0.48;
  transform: none;
  box-shadow: none;
}

@media (max-width: 860px) {
  .command-controls,
  .command-controls .field-control:nth-child(2),
  .experiment-select {
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}


/* v1.8.6 dashboard alignment and config preview i18n polish */
.command-controls {
  grid-template-columns: 180px minmax(280px, 460px) auto;
}

.command-controls .field-control:nth-child(2) {
  width: min(460px, 100%);
  max-width: 460px;
}

.command-controls .field-control:nth-child(2) .experiment-select {
  max-width: 460px;
}

.selected-config-copy strong,
.selected-config-copy p {
  text-wrap: pretty;
}

.selected-config-tags {
  align-items: center;
}

.runtime-item,
.hero-metric-item {
  padding: 12px 14px;
}

.runtime-label {
  margin-bottom: 0;
  line-height: 1.1;
}

.runtime-value,
.runtime-status-value,
.runtime-muted-value {
  display: flex;
  min-height: 28px;
  align-items: center;
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
}

.runtime-status-text,
.runtime-muted-value {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  line-height: 1.2;
  white-space: nowrap;
}

.runtime-status-idle,
.runtime-muted-value {
  color: #64748b;
}

.runtime-status-running,
.runtime-status-creating {
  color: #1d4ed8;
}

.runtime-status-finished {
  color: #047857;
}

.runtime-status-cancelled,
.runtime-status-disconnected,
.runtime-status-failed,
.runtime-status-error {
  color: #b91c1c;
}

.runtime-action .runtime-report-link {
  align-self: flex-start;
  min-width: auto;
  min-height: 28px;
  height: 28px;
  padding: 0 10px;
  border-radius: 9px;
  font-size: 12px;
  line-height: 1;
}

@media (max-width: 860px) {
  .command-controls,
  .command-controls .field-control:nth-child(2),
  .command-controls .field-control:nth-child(2) .experiment-select {
    width: 100%;
    max-width: none;
  }
}


/* v1.8.7 runtime summary alignment and disclosure affordance polish */
.runtime-row {
  grid-template-columns:
    minmax(112px, 0.72fr)
    minmax(260px, 1.65fr)
    repeat(4, minmax(108px, 1fr))
    minmax(150px, 0.95fr);
}

.runtime-action {
  grid-column: -2 / -1;
}

.runtime-item,
.hero-metric-item {
  justify-content: center;
  gap: 7px;
  min-height: 68px;
  padding: 13px 15px;
}

.runtime-label {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.runtime-value,
.runtime-status-value,
.runtime-muted-value,
.runtime-status-text {
  min-height: 30px;
  margin: 0;
  align-items: center;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.runtime-value,
.runtime-status-value,
.runtime-muted-value {
  display: flex;
}

.runtime-status-text {
  display: inline-flex;
  white-space: nowrap;
}

.runtime-item.wide .runtime-value {
  min-height: 30px;
  align-items: center;
  font-size: 15px;
  letter-spacing: -0.015em;
  line-height: 1.25;
}

.runtime-action .runtime-report-link {
  width: 100%;
  max-width: none;
  min-height: 30px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
  justify-content: flex-start;
  letter-spacing: -0.01em;
  text-decoration: none;
  transform: none;
}

.runtime-action .runtime-report-link:hover {
  background: transparent;
  box-shadow: none;
  color: #1d4ed8;
  text-decoration: underline;
  transform: none;
}

.runtime-action .runtime-muted-value {
  color: #64748b;
}

.round-log-panel summary {
  justify-content: flex-start;
  padding-right: 16px;
}

.round-log-panel summary::-webkit-details-marker {
  display: none;
}

.round-log-panel summary::marker {
  content: "";
}

.round-log-panel summary strong {
  margin-left: auto;
  margin-right: 14px;
}

.round-log-panel summary::after {
  width: 8px;
  height: 8px;
  border-right: 2px solid #64748b;
  border-bottom: 2px solid #64748b;
  content: "";
  flex: 0 0 auto;
  transform: rotate(45deg);
  transform-origin: center;
  transition: transform 0.16s ease, border-color 0.16s ease;
}

.round-log-panel[open] summary::after {
  transform: rotate(225deg);
}

.round-log-panel summary:hover::after {
  border-color: #1d4ed8;
}

@media (max-width: 1180px) {
  .runtime-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .runtime-action {
    grid-column: auto;
  }
}

@media (max-width: 680px) {
  .runtime-row {
    grid-template-columns: 1fr;
  }

  .runtime-item.wide .runtime-value,
  .runtime-action .runtime-report-link {
    font-size: 14px;
  }
}


/* v1.8.8 runtime value parity and deferred report card */
.runtime-row {
  grid-template-columns:
    minmax(112px, 0.72fr)
    minmax(260px, 1.65fr)
    repeat(4, minmax(108px, 1fr))
    minmax(150px, 0.95fr);
}

.runtime-value,
.runtime-muted-value,
.runtime-action .runtime-report-link {
  min-height: 30px;
  align-items: center;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.runtime-muted-value {
  color: #64748b;
}

.runtime-action .runtime-report-link {
  display: inline-flex;
  width: auto;
  max-width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  justify-content: flex-start;
  text-decoration: none;
  transform: none;
}

.runtime-action .runtime-report-link:hover {
  background: transparent;
  box-shadow: none;
  color: #1d4ed8;
  text-decoration: underline;
  transform: none;
}

.runtime-status-idle,
.runtime-status-running,
.runtime-status-creating,
.runtime-status-finished,
.runtime-status-cancelled,
.runtime-status-disconnected,
.runtime-status-failed,
.runtime-status-error {
  color: inherit;
}

@media (max-width: 980px) {
  .runtime-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .runtime-row {
    grid-template-columns: 1fr;
  }
}



/* v1.8.8 final runtime report value consistency */
.runtime-row .runtime-action .runtime-report-value {
  display: flex;
  min-height: 30px;
  align-items: center;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  text-decoration: none;
  transform: none;
}

.runtime-row .runtime-action .runtime-report-link.runtime-report-value {
  width: 100%;
  max-width: 100%;
  justify-content: flex-start;
}

.runtime-row .runtime-action .runtime-report-link.runtime-report-value:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.runtime-row .runtime-action.is-disabled .runtime-report-value {
  color: #111827;
}

@media (max-width: 680px) {
  .runtime-row .runtime-action .runtime-report-value {
    font-size: 20px;
  }
}


/* v1.8.8 final text-value balance for runtime summary */
.runtime-row .runtime-text-value {
  display: flex;
  min-height: 30px;
  align-items: center;
  max-width: 100%;
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.012em;
  line-height: 1.15;
  white-space: nowrap;
}

.runtime-row .runtime-action .runtime-report-link.runtime-text-value {
  width: auto;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: #2563eb;
  justify-content: flex-start;
  text-decoration: underline;
  text-decoration-color: rgba(37, 99, 235, 0.42);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  text-overflow: ellipsis;
}

.runtime-row .runtime-action .runtime-report-link.runtime-text-value:hover {
  color: #1d4ed8;
  text-decoration-color: currentColor;
}

.runtime-row .runtime-action.is-disabled .runtime-text-value {
  color: #111827;
}

@media (max-width: 680px) {
  .runtime-row .runtime-text-value {
    font-size: 17px;
  }
}

</style>
