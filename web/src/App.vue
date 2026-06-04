<script setup>
import DashboardSectionHeading from "./components/DashboardSectionHeading.vue";
import GlobalToolbar from "./components/GlobalToolbar.vue";
import HistoryManagementStrip from "./components/HistoryManagementStrip.vue";
import JobsEmptyState from "./components/JobsEmptyState.vue";
import JobsSectionHeader from "./components/JobsSectionHeader.vue";
import RuntimeMetricTile from "./components/RuntimeMetricTile.vue";
import RuntimeInfoTile from "./components/RuntimeInfoTile.vue";
import RuntimeReportAction from "./components/RuntimeReportAction.vue";
import ConfigPreview from "./components/ConfigPreview.vue";
import DashboardSectionNav from "./components/DashboardSectionNav.vue";
import RuntimeChartPanel from "./components/RuntimeChartPanel.vue";
import ComparisonInsightsPanel from "./components/ComparisonInsightsPanel.vue";
import ComparisonResultCard from "./components/ComparisonResultCard.vue";
import ComparisonHistoryPanel from "./components/ComparisonHistoryPanel.vue";
import ComparisonStatusFeedback from "./components/ComparisonStatusFeedback.vue";
import JobDetailPanel from "./components/JobDetailPanel.vue";
import SelectedJobsPreview from "./components/SelectedJobsPreview.vue";
import { computed, onMounted, ref, watch } from "vue";

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
const jobArchiveFilter = ref("active");
const recentJobsLimit = ref(20);
const recentJobsSort = ref("created_at_desc");
const selectedJobIds = ref([]);
const selectedDetailJobId = ref("");
const RECENT_JOBS_STORAGE_KEY = "fedguardlab_recent_jobs";
const HIDDEN_JOBS_STORAGE_KEY = "fedguardlab_hidden_jobs";
const LANGUAGE_STORAGE_KEY = "fedguardlab_language";
const DASHBOARD_SECTION_STORAGE_KEY = "fedguardlab_dashboard_section";

const language = ref(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || "zh");

const dashboardSections = ["run", "jobs", "comparisons", "reports"];

const dashboardSectionIds = new Set(dashboardSections);

function getInitialDashboardSection() {
  const savedSection = window.localStorage.getItem(DASHBOARD_SECTION_STORAGE_KEY);
  return dashboardSectionIds.has(savedSection) ? savedSection : "run";
}

const activeDashboardSection = ref(getInitialDashboardSection());

function setDashboardSection(sectionId) {
  if (!dashboardSectionIds.has(sectionId)) {
    return;
  }

  activeDashboardSection.value = sectionId;
  window.localStorage.setItem(DASHBOARD_SECTION_STORAGE_KEY, sectionId);
}

const messages = {
  zh: {
    eyebrow: "FedGuardLab",
    heroTitle: "联邦学习安全实验平台",
    heroSubtitle: "运行 FL 安全实验，实时查看指标，对比攻防效果",
    dashboardSectionLabels: {
      run: "运行",
      jobs: "任务",
      comparisons: "对比",
      reports: "报告",
    },
    dashboardSectionCopy: {
      jobs: {
        kicker: "Job history",
        title: "历史实验与任务管理",
        hint: "查看实验记录、筛选任务状态，并管理归档 / 恢复操作。",
      },
      comparisons: {
        kicker: "Experiment comparison",
        title: "实验对比与对比报告",
        hint: "选择已完成且有报告的实验，生成对比报告并查看历史对比结果。",
      },
      reports: {
        kicker: "Reports maintenance",
        title: "报告清理与存储维护",
        hint: "预览 reports 存储占用，并通过安全 dry-run 流程检查清理候选。",
      },
    },
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
    openHtmlReport: "HTML 报告",
    openHtmlReportShort: "HTML 报告",
    round: "轮次",
    accuracy: "准确率",
    loss: "损失",
    asr: "攻击成功率",
    chartTitle: "实时联邦学习指标",
    emptyChart: "启动实验后可查看实时指标，完成任务会进入对比历史",
    heroEmptyHint: "选择配置并运行实验，实时指标会在这里更新",
    comparisonTitle: "历史实验与对比",
    comparisonHint: "管理已完成、运行中和异常实验，选择可对比实验生成对比报告",
    historyManagementTitle: "历史实验管理",
    historyManagementDescription: "当前列表来自后端任务记录；只有已完成、含指标并生成报告的实验可加入对比。",
    historyTotalJobs: "列表实验",
    historyComparableJobs: "可对比",
    historySelectedJobs: "已选择",
    historyCurrentFilter: "当前筛选",
    historyArchiveFilter: "归档",
    archiveActive: "未归档",
    archiveArchived: "已归档",
    archiveAll: "全部",
    archiveAction: "归档",
    restoreAction: "恢复",
    archivedBadge: "已归档",
    archiveHint: "归档后将从默认历史列表隐藏，但报告文件仍保留。",
    archiveFailed: "归档失败",
    restoreFailed: "恢复失败",
    comparisonReady: "可对比",
    comparisonUnavailable: "不可对比",
    reportReady: "报告可用",
    reportUnavailable: "报告未就绪",
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
    tableSelect: "对比",
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
    jobDetailHint: "选择一条历史实验查看详情、导出文件和事件时间线",
    comparisonLabel: "对比",
    openComparisonReport: "查看对比报告",
    selectAtLeastTwo: "请至少选择两个已完成的实验",
    selectedJobsTitle: "已选择实验",
    selectedJobsCount: "已选择 {count} 个实验",
    selectedJobsHint: "当前只选择了 1 个可对比实验，请继续勾选另一个已完成报告后再生成对比报告",
    comparisonCreating: "正在生成对比报告…",
    comparisonSuccess: "对比报告已生成",
    comparisonSuccessDescription: "报告与导出文件已就绪，可用于分享、归档或继续分析",
    comparisonHtmlShort: "HTML 报告",
    comparisonCsvShort: "CSV",
    comparisonJsonShort: "JSON",
    comparisonFailed: "对比报告生成失败",
    comparisonExportsTitle: "对比导出",
    comparisonHistoryTitle: "对比报告历史",
    comparisonHistoryHint: "最近生成的对比报告会保留在这里，可直接打开或下载。",
    comparisonHistoryRefresh: "刷新历史",
    comparisonHistoryLoading: "正在加载对比报告历史…",
    comparisonHistoryEmpty: "暂无对比报告历史",
    comparisonHistoryFailed: "对比报告历史加载失败",
    comparisonHistoryCreated: "创建时间",
    comparisonHistoryJobs: "实验数",
    comparisonHistoryBestAccuracy: "最佳准确率",
    comparisonHistoryLowestLoss: "最低损失",
    comparisonHistoryLowestAsr: "最低 ASR",
    comparisonHistoryExports: "报告入口",
    comparisonHistoryUntitled: "未命名对比",
    reportsCleanupTitle: "本地 reports 清理策略",
    reportsCleanupHint: "只读预览当前 reports 占用和可清理候选，不会删除任何文件。",
    reportsCleanupRefresh: "刷新统计",
    reportsCleanupLoading: "正在加载 reports 统计…",
    reportsCleanupFailed: "reports 统计加载失败",
    reportsCleanupDryRun: "只读预览",
    reportsCleanupSafeMode: "不会删除文件",
    reportsCleanupTotalSize: "总大小",
    reportsCleanupJobReports: "实验报告",
    reportsCleanupComparisonReports: "对比报告",
    reportsCleanupCandidates: "候选项",
    reportsCleanupCandidateSize: "候选大小",
    reportsCleanupKeepLatest: "每类保留",
    reportsCleanupOldest: "最早修改",
    reportsCleanupLatest: "最新修改",
    reportsCleanupCandidatePreview: "候选预览",
    reportsCleanupNoCandidates: "暂无清理候选",
    reportsCleanupPath: "路径",
    reportsCleanupRunDryRun: "执行预览",
    reportsCleanupDeleteRun: "清理候选",
    reportsCleanupRunning: "执行中...",
    reportsCleanupDeleting: "清理中...",
    reportsCleanupRunFailed: "reports 清理执行失败",
    reportsCleanupRunResult: "清理执行结果",
    reportsCleanupRunDryResult: "预览完成，未删除文件",
    reportsCleanupRunDeleteResult: "清理完成",
    reportsCleanupDeleted: "已删除",
    reportsCleanupDeletedSize: "释放空间",
    reportsCleanupSkipped: "跳过",
    reportsCleanupErrors: "错误",
    reportsCleanupConfirm: "确认删除 cleanup preview 中的候选 reports？此操作不可撤销。",
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
    exportCsvMetrics: "CSV",
    exportMarkdownReport: "Markdown",
    exportMetricsJson: "指标 JSON",
    exportConfigJson: "配置 JSON",
    comparisonHtmlReport: "HTML 报告",
    comparisonCsv: "CSV",
    comparisonJson: "JSON",
    eventTimeline: "事件时间线",
    lifecycleEvents: "创建、启动、产物与完成记录",
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
      archived: "已归档",
      restored: "已恢复",
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
    dashboardSectionLabels: {
      run: "Run",
      jobs: "Jobs",
      comparisons: "Comparisons",
      reports: "Reports",
    },
    dashboardSectionCopy: {
      jobs: {
        kicker: "Job history",
        title: "Job History and Task Management",
        hint: "Review experiment records, filter job status, and manage archive / restore actions.",
      },
      comparisons: {
        kicker: "Experiment comparison",
        title: "Experiment Comparisons and Reports",
        hint: "Select completed jobs with reports, generate comparison reports, and review comparison history.",
      },
      reports: {
        kicker: "Reports maintenance",
        title: "Report Cleanup and Storage Maintenance",
        hint: "Preview reports storage usage and inspect cleanup candidates through the safe dry-run workflow.",
      },
    },
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
    openHtmlReport: "HTML Report",
    openHtmlReportShort: "HTML Report",
    round: "Round",
    accuracy: "Accuracy",
    loss: "Loss",
    asr: "Attack Success Rate",
    chartTitle: "Live Federated Learning Metrics",
    emptyChart: "Start an experiment to see live metrics; finished jobs appear in comparison history",
    heroEmptyHint: "Choose a config and run an experiment; live metrics will update here",
    comparisonTitle: "Experiment History & Comparison",
    comparisonHint: "Manage finished, running, and failed jobs; select comparable jobs to generate a comparison report",
    historyManagementTitle: "Experiment history management",
    historyManagementDescription: "This list comes from backend job records; only finished jobs with metrics and reports can be selected for comparison.",
    historyTotalJobs: "Listed jobs",
    historyComparableJobs: "Comparable",
    historySelectedJobs: "Selected",
    historyCurrentFilter: "Active filter",
    historyArchiveFilter: "Archive",
    archiveActive: "Active",
    archiveArchived: "Archived",
    archiveAll: "All",
    archiveAction: "Archive",
    restoreAction: "Restore",
    archivedBadge: "Archived",
    archiveHint: "Archived jobs are hidden from the default history list, but report files are preserved.",
    archiveFailed: "Archive failed",
    restoreFailed: "Restore failed",
    comparisonReady: "Comparable",
    comparisonUnavailable: "Not comparable",
    reportReady: "Report ready",
    reportUnavailable: "Report not ready",
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
    tableSelect: "Compare",
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
    jobDetailHint: "Select a historical job to inspect details, exports, and event timeline",
    comparisonLabel: "Comparison",
    openComparisonReport: "Open Comparison Report",
    selectAtLeastTwo: "Please select at least two finished experiments",
    selectedJobsTitle: "Selected Jobs",
    selectedJobsCount: "{count} job(s) selected",
    selectedJobsHint: "Only 1 comparable experiment is selected; choose another finished report before generating a comparison",
    comparisonCreating: "Generating comparison report…",
    comparisonSuccess: "Comparison report generated",
    comparisonSuccessDescription: "Report and export artifacts are ready for sharing, archiving, or follow-up analysis",
    comparisonHtmlShort: "HTML Report",
    comparisonCsvShort: "CSV",
    comparisonJsonShort: "JSON",
    comparisonFailed: "Failed to generate comparison report",
    comparisonExportsTitle: "Comparison Exports",
    comparisonHistoryTitle: "Comparison Report History",
    comparisonHistoryHint: "Recently generated comparison reports stay here for direct access or download.",
    comparisonHistoryRefresh: "Refresh history",
    comparisonHistoryLoading: "Loading comparison report history…",
    comparisonHistoryEmpty: "No comparison reports yet",
    comparisonHistoryFailed: "Failed to load comparison history",
    comparisonHistoryCreated: "Created",
    comparisonHistoryJobs: "Jobs",
    comparisonHistoryBestAccuracy: "Best Accuracy",
    comparisonHistoryLowestLoss: "Lowest Loss",
    comparisonHistoryLowestAsr: "Lowest ASR",
    comparisonHistoryExports: "Report Links",
    comparisonHistoryUntitled: "Untitled comparison",
    reportsCleanupTitle: "Local reports cleanup strategy",
    reportsCleanupHint: "Read-only preview of current reports storage and cleanup candidates. No files are deleted.",
    reportsCleanupRefresh: "Refresh stats",
    reportsCleanupLoading: "Loading reports stats…",
    reportsCleanupFailed: "Failed to load reports stats",
    reportsCleanupDryRun: "Dry-run preview",
    reportsCleanupSafeMode: "No files deleted",
    reportsCleanupTotalSize: "Total size",
    reportsCleanupJobReports: "Job reports",
    reportsCleanupComparisonReports: "Comparison reports",
    reportsCleanupCandidates: "Candidates",
    reportsCleanupCandidateSize: "Candidate size",
    reportsCleanupKeepLatest: "Keep per kind",
    reportsCleanupOldest: "Oldest modified",
    reportsCleanupLatest: "Latest modified",
    reportsCleanupCandidatePreview: "Candidate preview",
    reportsCleanupNoCandidates: "No cleanup candidates",
    reportsCleanupPath: "Path",
    reportsCleanupRunDryRun: "Run preview",
    reportsCleanupDeleteRun: "Clean candidates",
    reportsCleanupRunning: "Running...",
    reportsCleanupDeleting: "Cleaning...",
    reportsCleanupRunFailed: "Failed to run reports cleanup",
    reportsCleanupRunResult: "Cleanup run result",
    reportsCleanupRunDryResult: "Preview complete. No files deleted.",
    reportsCleanupRunDeleteResult: "Cleanup complete",
    reportsCleanupDeleted: "Deleted",
    reportsCleanupDeletedSize: "Freed space",
    reportsCleanupSkipped: "Skipped",
    reportsCleanupErrors: "Errors",
    reportsCleanupConfirm: "Delete the cleanup preview candidates? This cannot be undone.",
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
    exportCsvMetrics: "CSV",
    exportMarkdownReport: "Markdown",
    exportMetricsJson: "Metrics JSON",
    exportConfigJson: "Config JSON",
    comparisonHtmlReport: "HTML Report",
    comparisonCsv: "CSV",
    comparisonJson: "JSON",
    eventTimeline: "Event Timeline",
    lifecycleEvents: "Created, started, artifacts, and completion",
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
      archived: "Archived",
      restored: "Restored",
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

const dashboardNavigationSections = computed(() =>
  dashboardSections.map((sectionId) => ({
    id: sectionId,
    label: t.value.dashboardSectionLabels?.[sectionId] || sectionId,
  }))
);

const currentDashboardSectionCopy = computed(
  () => t.value.dashboardSectionCopy?.[activeDashboardSection.value] || {}
);

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
const historyActionError = ref("");
const historyActionStatus = ref("idle");
const comparisonUrl = ref("");
const comparisonArtifacts = ref({});
const comparisonInsights = ref({});
const comparisonHistory = ref([]);
const comparisonHistoryStatus = ref("idle");
const comparisonHistoryError = ref("");
const reportsCleanupSummary = ref(null);
const reportsCleanupStatus = ref("idle");
const reportsCleanupError = ref("");
const reportsCleanupRunStatus = ref("idle");
const reportsCleanupRunMode = ref("");
const reportsCleanupRunError = ref("");
const reportsCleanupRunResult = ref(null);

const reportsCleanupPreview = computed(() =>
  reportsCleanupSummary.value?.cleanup_preview || {
    candidate_count: 0,
    candidate_size_bytes: 0,
    candidates: [],
  }
);
const reportsCleanupPreviewCandidates = computed(() =>
  reportsCleanupPreview.value.candidates.slice(0, 5)
);
const reportsCleanupOldestModifiedAt = computed(() =>
  reportsCleanupSummary.value?.jobs?.oldest_modified_at ||
  reportsCleanupSummary.value?.comparisons?.oldest_modified_at ||
  ""
);
const reportsCleanupLatestModifiedAt = computed(() =>
  reportsCleanupSummary.value?.jobs?.latest_modified_at ||
  reportsCleanupSummary.value?.comparisons?.latest_modified_at ||
  ""
);
const reportsCleanupHasCandidates = computed(
  () => reportsCleanupPreview.value.candidate_count > 0
);
const reportsCleanupRunBusy = computed(
  () => reportsCleanupRunStatus.value === "running"
);

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

  try {
    await loadComparisonHistory();
  } catch (error) {
    console.warn("Failed to load comparison history:", error);
  }

  try {
    await loadReportsCleanupSummary();
  } catch (error) {
    console.warn("Failed to load reports cleanup summary:", error);
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
    job.archived !== true &&
    job.status === "finished" &&
    job.metrics_count > 0 &&
    job.has_report === true &&
    Boolean(job.report_url)
  );
}

const comparableJobsCount = computed(() =>
  recentJobs.value.filter((job) => canSelectJobForComparison(job)).length
);

const historyArchiveFilterLabel = computed(() => {
  if (jobArchiveFilter.value === "archived") {
    return t.value.archiveArchived;
  }

  if (jobArchiveFilter.value === "all") {
    return t.value.archiveAll;
  }

  return t.value.archiveActive;
});

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
    loadComparisonHistory().catch((error) => {
      console.warn("Failed to refresh comparison history:", error);
    });
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
    archived: job.archived === true,
    archived_at: job.archived_at || null,
  };
}

async function loadRecentJobsFromApi() {
  const filter = jobStatusFilter.value;
  const params = new URLSearchParams();
  params.set("limit", String(recentJobsLimit.value));
  params.set("sort", recentJobsSort.value);
  params.set("archived", jobArchiveFilter.value);

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
    archived: "📌",
    restored: "↩️",
  };
  return icons[type] || "📌";
}

function formatEventMessage(ev) {
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

function comparisonHistoryArtifactUrl(item, key) {
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

function formatComparisonMetric(value) {
  const rawValue = typeof value === "object" && value !== null ? value.value : value;
  return formatMetricValue(rawValue);
}

function mapComparisonHistoryItem(item) {
  const artifacts = item.artifacts || {};
  return {
    comparison_id: item.comparison_id || "",
    title: item.title || t.value.comparisonHistoryUntitled,
    created_at: item.created_at || "",
    job_ids: Array.isArray(item.job_ids) ? item.job_ids : [],
    job_count: item.job_count ?? (Array.isArray(item.job_ids) ? item.job_ids.length : 0),
    best_accuracy: formatComparisonMetric(item.best_accuracy),
    lowest_loss: formatComparisonMetric(item.lowest_loss),
    lowest_asr: formatComparisonMetric(item.lowest_asr),
    has_report: item.has_report !== false,
    artifacts,
  };
}

const comparisonHistoryItemsForDisplay = computed(() =>
  comparisonHistory.value.map((item) => {
    const htmlUrl = comparisonHistoryArtifactUrl(item, "comparison_html_url");
    const csvUrl = comparisonHistoryArtifactUrl(item, "comparison_csv_url");
    const jsonUrl = comparisonHistoryArtifactUrl(item, "comparison_json_url");

    return {
      comparison_id: item.comparison_id,
      title: item.title,
      createdAtLabel: formatEventTime(item.created_at),
      job_count: item.job_count,
      best_accuracy: item.best_accuracy,
      lowest_loss: item.lowest_loss,
      lowest_asr: item.lowest_asr,
      htmlUrl: htmlUrl ? withLang(htmlUrl) : "",
      csvUrl: csvUrl || "",
      jsonUrl: jsonUrl || "",
    };
  })
);

const EXPORT_ARTIFACT_KEYS = [
  { key: "report_html", icon: "📊", labelKey: "exportHtmlReport" },
  { key: "metrics_csv", icon: "📄", labelKey: "exportCsvMetrics" },
  { key: "summary_md", icon: "📝", labelKey: "exportMarkdownReport" },
  { key: "metrics_json", icon: "{ }", labelKey: "exportMetricsJson" },
  { key: "config_json", icon: "⚙", labelKey: "exportConfigJson" },
];

const detailExportItems = computed(() => {
  const job = selectedDetailJob.value;
  if (!job || !job.has_report) {
    return [];
  }

  return EXPORT_ARTIFACT_KEYS.map((entry) => {
    const url = jobArtifactUrl(job, entry.key);
    const href =
      entry.key === "report_html" ? withLang(url || "") : url || "";
    return {
      key: entry.key,
      url: href,
      icon: entry.icon,
      label: t.value[entry.labelKey] || entry.labelKey,
      disabled: !url,
    };
  });
});

const lifecycleDisplayEvents = computed(() =>
  selectedLifecycleEvents.value.map((ev) => ({
    icon: eventIcon(ev.type),
    eventClass: "event-" + ev.type,
    badgeClass: "badge-" + ev.type,
    badgeText: t.value.eventType[ev.type] || ev.type,
    time: formatEventTime(ev.created_at),
    message: formatEventMessage(ev),
    isFailed: ev.type === "failed" && Boolean(ev.details),
    error: ev.details?.error || "",
    traceback: ev.details?.traceback_summary || "",
  }))
);

const roundDisplayEvents = computed(() =>
  selectedRoundEvents.value.map((ev) => ({
    badgeText: t.value.eventType.round_progress,
    roundLabel: `${t.value.eventRound} ${ev.round}/${ev.total_rounds}`,
    time: formatEventTime(ev.created_at),
    hasMetrics: Boolean(ev.metrics),
    accuracy: ev.metrics?.accuracy ?? "",
    loss: ev.metrics?.loss ?? "",
    asr: ev.metrics?.attack_success_rate ?? "",
  }))
);

async function loadComparisonHistory() {
  comparisonHistoryStatus.value = "loading";
  comparisonHistoryError.value = "";

  try {
    const params = new URLSearchParams();
    params.set("limit", "10");
    params.set("sort", "created_at_desc");

    const response = await fetch(`${API_BASE}/comparisons?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || t.value.comparisonHistoryFailed);
    }

    comparisonHistory.value = Array.isArray(data.comparisons)
      ? data.comparisons.map(mapComparisonHistoryItem)
      : [];
    comparisonHistoryStatus.value = "idle";
  } catch (error) {
    comparisonHistoryError.value = error.message;
    comparisonHistoryStatus.value = "error";
    throw error;
  }
}

function formatStorageBytes(value) {
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

function mapReportsCleanupSummary(data) {
  const preview = data.cleanup_preview || {};

  return {
    dry_run: Boolean(data.dry_run),
    deletes_files: Boolean(data.deletes_files),
    reports_root: data.reports_root || "",
    keep_latest_per_kind: data.keep_latest_per_kind ?? 20,
    total_size_bytes: data.total_size_bytes || 0,
    jobs: data.jobs || {},
    comparisons: data.comparisons || {},
    cleanup_preview: {
      candidate_count: preview.candidate_count || 0,
      candidate_size_bytes: preview.candidate_size_bytes || 0,
      candidates: Array.isArray(preview.candidates) ? preview.candidates : [],
    },
  };
}

async function loadReportsCleanupSummary() {
  reportsCleanupStatus.value = "loading";
  reportsCleanupError.value = "";

  try {
    const params = new URLSearchParams();
    params.set("keep_latest", "20");

    const response = await fetch(
      `${API_BASE}/reports/cleanup/summary?${params.toString()}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || t.value.reportsCleanupFailed);
    }

    reportsCleanupSummary.value = mapReportsCleanupSummary(data);
    reportsCleanupStatus.value = "idle";
  } catch (error) {
    reportsCleanupError.value = error.message;
    reportsCleanupStatus.value = "error";
    throw error;
  }
}

function mapReportsCleanupRunResult(data) {
  return {
    dry_run: Boolean(data.dry_run),
    deletes_files: Boolean(data.deletes_files),
    candidate_count: data.candidate_count || 0,
    deleted_count: data.deleted_count || 0,
    deleted_size_bytes: data.deleted_size_bytes || 0,
    skipped: Array.isArray(data.skipped) ? data.skipped : [],
    errors: Array.isArray(data.errors) ? data.errors : [],
  };
}

async function runReportsCleanup(dryRun = true) {
  if (reportsCleanupRunBusy.value) {
    return;
  }

  if (!dryRun && !window.confirm(t.value.reportsCleanupConfirm)) {
    return;
  }

  reportsCleanupRunStatus.value = "running";
  reportsCleanupRunMode.value = dryRun ? "dry-run" : "delete";
  reportsCleanupRunError.value = "";
  reportsCleanupRunResult.value = null;

  try {
    const response = await fetch(`${API_BASE}/reports/cleanup/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keep_latest: reportsCleanupSummary.value?.keep_latest_per_kind ?? 20,
        dry_run: dryRun,
        confirm: !dryRun,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.detail || t.value.reportsCleanupRunFailed);
    }

    reportsCleanupRunResult.value = mapReportsCleanupRunResult(data);
    reportsCleanupRunStatus.value = "idle";
    reportsCleanupRunMode.value = "";

    await loadReportsCleanupSummary();

    if (!dryRun) {
      const refreshTasks = [];

      if (typeof loadComparisonHistory === "function") {
        refreshTasks.push(
          loadComparisonHistory().catch((error) => {
            console.warn("Failed to refresh comparison history:", error);
          })
        );
      }

      if (typeof loadRecentJobs === "function") {
        refreshTasks.push(
          loadRecentJobs().catch((error) => {
            console.warn("Failed to refresh job history:", error);
          })
        );
      }

      await Promise.all(refreshTasks);
    }
  } catch (error) {
    reportsCleanupRunError.value = error.message;
    reportsCleanupRunStatus.value = "error";
    reportsCleanupRunMode.value = "";
  }
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

const selectedJobsForPreview = computed(() =>
  selectedJobIds.value
    .map((selectedJobId) =>
      recentJobs.value.find((job) => job.job_id === selectedJobId)
    )
    .filter(Boolean)
);

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

async function setJobArchived(job, archived) {
  if (!job?.job_id) {
    return;
  }

  historyActionError.value = "";
  historyActionStatus.value = archived ? "archiving" : "restoring";

  try {
    const action = archived ? "archive" : "restore";
    const response = await fetch(`${API_BASE}/jobs/${job.job_id}/${action}`, {
      method: "POST",
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const fallbackMessage = archived ? t.value.archiveFailed : t.value.restoreFailed;
      throw new Error(data.detail || `${fallbackMessage}: ${response.status}`);
    }

    if (archived) {
      selectedJobIds.value = selectedJobIds.value.filter((id) => id !== job.job_id);
    }

    await loadRecentJobsFromApi();

    const stillVisible = recentJobs.value.some((item) => item.job_id === job.job_id);
    selectedDetailJobId.value = stillVisible ? job.job_id : "";
  } catch (error) {
    historyActionError.value = error.message;
  } finally {
    historyActionStatus.value = "idle";
  }
}

watch([jobStatusFilter, jobArchiveFilter, recentJobsLimit, recentJobsSort], () => {
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
    <GlobalToolbar :language="language" @select-language="setLanguage" />

    <DashboardSectionNav
      :sections="dashboardNavigationSections"
      :active-section="activeDashboardSection"
      @select="setDashboardSection"
    />

    <section v-show="activeDashboardSection === 'run'" class="dashboard-shell dashboard-shell-v7">
      <section class="command-card">
        <DashboardSectionHeading
          :copy="{ kicker: t.eyebrow, title: t.heroTitle, hint: t.heroSubtitle }"
        />

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

        <ConfigPreview
          v-if="displayConfigPreview"
          :preview="displayConfigPreview"
          :copy="t"
        />
      </section>

      <section class="monitor-card">
        <div class="runtime-panel">
          <div class="runtime-row">
            <RuntimeInfoTile
              :label="t.statusLabel"
              :value="t.statusValues[status] || status"
            />

            <RuntimeInfoTile
              v-if="jobId"
              :label="t.jobLabel"
              :value="jobId"
              wide
            />

            <RuntimeMetricTile
              v-if="latestMetric"
              :label="t.round"
              :value="latestMetric.round"
            />
            <RuntimeMetricTile
              v-if="latestMetric"
              :label="t.accuracy"
              :value="latestMetric.accuracy"
            />
            <RuntimeMetricTile
              v-if="latestMetric"
              :label="t.loss"
              :value="latestMetric.loss"
            />
            <RuntimeMetricTile
              v-if="latestMetric"
              :label="t.asr"
              :value="latestMetric.attack_success_rate"
            />
            <RuntimeReportAction
              v-if="jobId || reportUrl"
              :label="t.reportLabel"
              :href="reportUrl ? withLang(reportUrl) : ''"
              :link-label="t.openHtmlReportShort || t.openHtmlReport"
              :not-ready-label="t.notReady"
            />
          </div>

          <div v-if="errorMessage" class="runtime-error">
            <strong>{{ t.errorLabel }}:</strong>
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <RuntimeChartPanel
          :metrics="metrics"
          :chart-data="chartData"
          :chart-options="chartOptions"
          :copy="t"
        />
      </section>
    </section>

    <section v-show="activeDashboardSection !== 'run'" class="comparison-card">
      <DashboardSectionHeading :copy="currentDashboardSectionCopy" />

      <div
        v-show="activeDashboardSection === 'jobs' || activeDashboardSection === 'comparisons'"
        class="dashboard-section-panel dashboard-jobs-panel"
      >
      <JobsSectionHeader
        v-model:status-filter="jobStatusFilter"
        v-model:archive-filter="jobArchiveFilter"
        v-model:limit="recentJobsLimit"
        v-model:sort="recentJobsSort"
        :copy="t"
        :show-filters="activeDashboardSection === 'jobs'"
      >
        <template #default>
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
        </template>
      </JobsSectionHeader>

      <HistoryManagementStrip
        v-if="activeDashboardSection === 'jobs'"
        :copy="t"
        :total-jobs="recentJobs.length"
        :comparable-jobs="comparableJobsCount"
        :selected-jobs="selectedJobIds.length"
        :active-filter-label="historyArchiveFilterLabel"
      />

      <div v-if="historyActionError" class="comparison-feedback error-feedback history-action-error">
        <span>{{ historyActionError }}</span>
      </div>

      <JobsEmptyState
        v-if="recentJobs.length === 0"
        :copy="t"
        :status-filter="jobStatusFilter"
      />

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
            :class="{ 'job-row-selected': selectedDetailJobId === job.job_id, 'selected': selectedDetailJobId === job.job_id, 'archived': job.archived }"
            @click="toggleDetailJob(job.job_id)"
          >
            <td class="job-select-cell">
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
                <span v-if="job.archived" class="job-badge archived">{{ t.archivedBadge }}</span>
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
                {{ t.openHtmlReportShort || t.openHtmlReport }}
              </a>
              <span v-else>{{ t.notReady }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="recentJobs.length > 0" class="job-detail-card">
        <JobDetailPanel
          v-if="selectedDetailJob"
          :copy="t"
          :job="selectedDetailJob"
          :artifacts-count="selectedDetailArtifactsCount"
          :is-comparable="canSelectJobForComparison(selectedDetailJob)"
          :is-action-disabled="historyActionStatus !== 'idle'"
          :report-html-url="selectedDetailJob.report_url ? withLang(selectedDetailJob.report_url) : ''"
          :export-items="detailExportItems"
          :lifecycle-events="lifecycleDisplayEvents"
          :round-events="roundDisplayEvents"
          @archive="setJobArchived(selectedDetailJob, !selectedDetailJob.archived)"
        />

        <div v-else class="empty-state small">
          {{ t.jobDetailHint }}
        </div>
      </div>
      </div>

      <div
        v-show="activeDashboardSection === 'comparisons'"
        class="dashboard-section-panel dashboard-comparisons-panel"
      >
      <SelectedJobsPreview
        v-if="selectedJobIds.length > 0"
        :copy="t"
        :selected-jobs="selectedJobsForPreview"
      />

      <ComparisonStatusFeedback
        kind="creating"
        :copy="t"
        :status="comparisonStatus"
        :error="comparisonError"
      />

      <ComparisonResultCard
        v-if="comparisonStatus === 'finished' && comparisonUrl"
        :copy="t"
        :html-url="withLang(comparisonArtifactUrl('comparison_html_url'))"
        :csv-url="comparisonArtifactUrl('comparison_csv_url')"
        :json-url="comparisonArtifactUrl('comparison_json_url')"
      />

      <ComparisonInsightsPanel
        v-if="comparisonStatus === 'finished' && comparisonInsights && (comparisonInsights.best_accuracy || comparisonInsights.winner)"
        :copy="t"
        :insights="comparisonInsights"
      />

      <ComparisonHistoryPanel
        :copy="t"
        :status="comparisonHistoryStatus"
        :error="comparisonHistoryError"
        :items="comparisonHistoryItemsForDisplay"
        @refresh="loadComparisonHistory"
      />

      <ComparisonStatusFeedback
        kind="error"
        :copy="t"
        :status="comparisonStatus"
        :error="comparisonError"
      />

      <div v-if="selectedJobIds.length < 2 && selectedJobIds.length > 0 && comparisonStatus !== 'finished'" class="comparison-hint">
        {{ t.selectedJobsHint }}
      </div>
      </div>

      <section v-show="activeDashboardSection === 'reports'" class="reports-cleanup-panel dashboard-info-panel">
        <div class="reports-cleanup-heading">
          <div class="reports-cleanup-heading-copy">
            <span class="detail-section-title">{{ t.reportsCleanupTitle }}</span>
            <span class="detail-section-subtitle">{{ t.reportsCleanupHint }}</span>
          </div>
          <div class="reports-cleanup-actions">
            <button
              class="secondary-button reports-cleanup-action"
              :disabled="reportsCleanupStatus === 'loading' || reportsCleanupRunBusy"
              @click="loadReportsCleanupSummary"
            >
              {{ t.reportsCleanupRefresh }}
            </button>
            <button
              class="secondary-button reports-cleanup-action"
              :disabled="reportsCleanupStatus === 'loading' || reportsCleanupRunBusy"
              @click="runReportsCleanup(true)"
            >
              {{ reportsCleanupRunStatus === 'running' && reportsCleanupRunMode === 'dry-run' ? t.reportsCleanupRunning : t.reportsCleanupRunDryRun }}
            </button>
            <button
              class="secondary-button reports-cleanup-action reports-cleanup-delete-button"
              :disabled="reportsCleanupStatus === 'loading' || reportsCleanupRunBusy || !reportsCleanupHasCandidates"
              @click="runReportsCleanup(false)"
            >
              {{ reportsCleanupRunStatus === 'running' && reportsCleanupRunMode === 'delete' ? t.reportsCleanupDeleting : t.reportsCleanupDeleteRun }}
            </button>
          </div>
        </div>

        <div v-if="reportsCleanupStatus === 'loading'" class="empty-state small reports-cleanup-empty">
          {{ t.reportsCleanupLoading }}
        </div>

        <div v-else-if="reportsCleanupError" class="comparison-feedback error-feedback reports-cleanup-error">
          <strong>{{ t.reportsCleanupFailed }}</strong>
          <span>{{ reportsCleanupError }}</span>
        </div>

        <div v-else-if="reportsCleanupSummary" class="reports-cleanup-content">
          <div class="reports-cleanup-mode-row">
            <span class="reports-cleanup-mode-pill safe">
              {{ t.reportsCleanupDryRun }}
            </span>
            <span class="reports-cleanup-mode-pill muted">
              {{ t.reportsCleanupSafeMode }}
            </span>
            <span class="reports-cleanup-root" :title="reportsCleanupSummary.reports_root">
              {{ reportsCleanupSummary.reports_root }}
            </span>
          </div>

          <div v-if="reportsCleanupRunError" class="comparison-feedback error-feedback reports-cleanup-error">
            <strong>{{ t.reportsCleanupRunFailed }}</strong>
            <span>{{ reportsCleanupRunError }}</span>
          </div>

          <div v-if="reportsCleanupRunResult" class="reports-cleanup-run-result">
            <div class="reports-cleanup-run-result-heading">
              <strong>{{ t.reportsCleanupRunResult }}</strong>
              <span>
                {{ reportsCleanupRunResult.dry_run ? t.reportsCleanupRunDryResult : t.reportsCleanupRunDeleteResult }}
              </span>
            </div>
            <div class="reports-cleanup-stats reports-cleanup-run-stats">
              <span class="history-stat">
                <strong>{{ reportsCleanupRunResult.candidate_count }}</strong>
                <small>{{ t.reportsCleanupCandidates }}</small>
              </span>
              <span class="history-stat">
                <strong>{{ reportsCleanupRunResult.deleted_count }}</strong>
                <small>{{ t.reportsCleanupDeleted }}</small>
              </span>
              <span class="history-stat">
                <strong>{{ formatStorageBytes(reportsCleanupRunResult.deleted_size_bytes) }}</strong>
                <small>{{ t.reportsCleanupDeletedSize }}</small>
              </span>
              <span class="history-stat">
                <strong>{{ reportsCleanupRunResult.skipped.length }}</strong>
                <small>{{ t.reportsCleanupSkipped }}</small>
              </span>
              <span class="history-stat">
                <strong>{{ reportsCleanupRunResult.errors.length }}</strong>
                <small>{{ t.reportsCleanupErrors }}</small>
              </span>
            </div>
          </div>

          <div class="reports-cleanup-stats">
            <span class="history-stat">
              <strong>{{ formatStorageBytes(reportsCleanupSummary.total_size_bytes) }}</strong>
              <small>{{ t.reportsCleanupTotalSize }}</small>
            </span>
            <span class="history-stat">
              <strong>{{ reportsCleanupSummary.jobs.count || 0 }}</strong>
              <small>{{ t.reportsCleanupJobReports }}</small>
            </span>
            <span class="history-stat">
              <strong>{{ reportsCleanupSummary.comparisons.count || 0 }}</strong>
              <small>{{ t.reportsCleanupComparisonReports }}</small>
            </span>
            <span class="history-stat">
              <strong>{{ reportsCleanupPreview.candidate_count }}</strong>
              <small>{{ t.reportsCleanupCandidates }}</small>
            </span>
            <span class="history-stat">
              <strong>{{ formatStorageBytes(reportsCleanupPreview.candidate_size_bytes) }}</strong>
              <small>{{ t.reportsCleanupCandidateSize }}</small>
            </span>
            <span class="history-stat">
              <strong>{{ reportsCleanupSummary.keep_latest_per_kind }}</strong>
              <small>{{ t.reportsCleanupKeepLatest }}</small>
            </span>
          </div>

          <div class="reports-cleanup-meta">
            <span>
              <strong>{{ t.reportsCleanupOldest }}</strong>
              {{ formatEventTime(reportsCleanupOldestModifiedAt) }}
            </span>
            <span>
              <strong>{{ t.reportsCleanupLatest }}</strong>
              {{ formatEventTime(reportsCleanupLatestModifiedAt) }}
            </span>
          </div>

          <div class="reports-cleanup-candidates">
            <div class="reports-cleanup-candidates-heading">
              <strong>{{ t.reportsCleanupCandidatePreview }}</strong>
              <span>{{ reportsCleanupPreview.candidate_count }}</span>
            </div>

            <div
              v-if="reportsCleanupPreviewCandidates.length === 0"
              class="empty-state small reports-cleanup-empty"
            >
              {{ t.reportsCleanupNoCandidates }}
            </div>

            <div v-else class="reports-cleanup-candidate-list">
              <div
                v-for="item in reportsCleanupPreviewCandidates"
                :key="`${item.kind}:${item.id}`"
                class="reports-cleanup-candidate"
              >
                <div>
                  <strong>{{ item.id }}</strong>
                  <span>{{ item.kind }}</span>
                </div>
                <div class="reports-cleanup-candidate-meta">
                  <span>{{ formatStorageBytes(item.size_bytes) }}</span>
                  <span>{{ formatEventTime(item.modified_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
/* Dashboard section shell and shared page layout */
.dashboard-section-panel {
  display: contents;
}

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
.dashboard-shell,
.comparison-card {
  width: min(1180px, calc(100vw - 48px));
  margin-left: auto;
  margin-right: auto;
}

/* Top bar */

/* Shared dashboard card surfaces */
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

/* Run command panel, config selector, and config preview */
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

.runtime-item,
.hero-metric-item {
  min-width: 0;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.70);
}

.runtime-item span,
.hero-metric-item span {
  display: block;
  margin-bottom: 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
}

/* Runtime monitor */
.monitor-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  padding: 20px;
}

/* Runtime summary, live metrics, report link, and chart */
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

.empty-state.small {
  min-height: 70px;
  margin-top: 16px;
}

/* Comparison */
.comparison-card {
  padding: 26px 28px;
}

/* Jobs, comparison controls, and section actions */
.section-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
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

.comparison-feedback,
.comparison-hint {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.72);
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

/* Responsive overrides */
@media (max-width: 1180px) {
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
  .dashboard-shell,
  .comparison-card {
    width: min(100%, calc(100vw - 28px));
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
  .selected-config-summary {
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

  .runtime-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .runtime-item.wide {
    grid-column: 1 / -1;
  }

}

@media (max-width: 560px) {
  .runtime-row {
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
.dashboard-shell,
.comparison-card {
  width: min(1200px, calc(100vw - 48px));
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
.runtime-item,
.hero-metric-item,
.comparison-feedback,
.comparison-hint {
  border-color: rgba(148, 163, 184, 0.22);
  background: #ffffff;
  box-shadow: none;
}

.selected-config-summary {
  margin-top: 14px;
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

.comparison-card {
  padding: 24px 26px;
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

.comparison-feedback.success {
  border-color: rgba(34, 197, 94, 0.26);
  background: #f0fdf4;
}

@media (max-width: 1180px) {
  .runtime-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .page > *,
  .dashboard-shell,
  .comparison-card {
    width: min(100%, calc(100vw - 28px));
  }

  .command-controls {
    grid-template-columns: 1fr;
  }

  .runtime-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .runtime-row {
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

.command-copy h1 {
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

.field-control > span:first-child,
.field-label,
.runtime-label,
.detail-label {
  font-weight: 800;
  line-height: 1.35;
}

.subtitle,
.preview-description,
.detail-value {
  line-height: 1.65;
}

.run-button,
.secondary-button,
.report-link,
.detail-report-link,
.detail-export-item,
.comparison-export-item,
.status-badge {
  min-height: 34px;
  line-height: 1;
  align-items: center;
  font-weight: 800;
}

.status-badge {
  display: inline-flex;
  justify-content: center;
  padding-top: 0;
  padding-bottom: 0;
}

.command-card,
.monitor-card,
.comparison-card,
.job-detail-card {
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
.job-row {
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

/* Historical dashboard polish overrides: v1.8.5 microcopy, empty-state, and alignment */
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

/* Historical dashboard polish overrides: v1.8.6 alignment and config preview i18n */
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

/* Historical dashboard polish overrides: v1.8.7 runtime summary and disclosure affordance */
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

/* v1.8.8 final report text sizing parity */
.runtime-row .runtime-action .runtime-report-value,
.runtime-row .runtime-action .runtime-report-link.runtime-report-value {
  min-height: 30px;
  align-items: center;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.012em;
  line-height: 1.15;
  white-space: nowrap;
}

.runtime-row .runtime-action .runtime-report-link.runtime-report-value {
  color: #2563eb;
  text-decoration: underline;
  text-decoration-color: rgba(37, 99, 235, 0.42);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
}

.runtime-row .runtime-action.is-disabled .runtime-report-value {
  color: #111827;
}

@media (max-width: 680px) {
  .runtime-row .runtime-action .runtime-report-value,
  .runtime-row .runtime-action .runtime-report-link.runtime-report-value {
    font-size: 17px;
  }
}

/* Dashboard detail density and comparison layout */
.comparison-card .job-detail-card {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
}

/* Comparison completion layout */
.comparison-card .comparison-feedback,
.comparison-card .comparison-hint {
  margin-top: 12px;
}

/* Experiment history management */
.history-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 12px;
  background: #ffffff;
}

.history-stat strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 14px;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-stat small {
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
}

.job-select-cell {
  min-width: 46px;
}

.job-select-cell input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.job-select-cell input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

.job-badge.archived {
  border-color: rgba(203, 213, 225, 0.95);
  background: #e2e8f0;
  color: #475569;
}

.history-action-error {
  margin-top: 10px;
}

.job-row.archived {
  opacity: 0.76;
}

.job-row.archived .job-label,
.job-row.archived .job-id {
  color: #64748b;
}

/* Detail section heading layout (shared with reports cleanup heading) */
.detail-section-heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

/* Comparison history */
.dashboard-info-panel {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.jobs-table .report-link {
  min-height: 30px;
  padding: 0 11px;
  border-radius: 9px;
  font-size: 11px;
}

/* Unified report and artifact entry system */
.report-link,
.detail-report-link,
.detail-export-item,
.comparison-export-item {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  gap: 6px;
}

.jobs-table .report-link {
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

/* Reports cleanup panel and cleanup run result */
.reports-cleanup-content {
  display: grid;
  gap: 12px;
}

.reports-cleanup-mode-pill {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.reports-cleanup-mode-pill.safe {
  border: 1px solid rgba(34, 197, 94, 0.28);
  background: rgba(240, 253, 244, 0.92);
  color: #15803d;
}

.reports-cleanup-mode-pill.muted {
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(248, 250, 252, 0.92);
  color: #64748b;
}

.reports-cleanup-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.reports-cleanup-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: #64748b;
  font-size: 12px;
}

.reports-cleanup-meta strong {
  margin-right: 6px;
  color: #334155;
}

.reports-cleanup-candidates {
  display: grid;
  gap: 8px;
  padding-top: 2px;
}

.reports-cleanup-candidates-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #0f172a;
  font-size: 13px;
}

.reports-cleanup-candidates-heading span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.reports-cleanup-candidate-list {
  display: grid;
  gap: 6px;
}

.reports-cleanup-candidate {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.82);
}

.reports-cleanup-candidate strong {
  display: block;
  overflow: hidden;
  color: #0f172a;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reports-cleanup-candidate span {
  color: #64748b;
  font-size: 11px;
}

.reports-cleanup-candidate-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .reports-cleanup-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .reports-cleanup-stats,
  .reports-cleanup-candidate {
    grid-template-columns: 1fr;
  }

  .reports-cleanup-candidate-meta {
    align-items: flex-start;
  }
}

/* Reports cleanup run controls */
.reports-cleanup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.reports-cleanup-action {
  min-height: 34px;
  padding: 0 12px;
  white-space: nowrap;
}

.reports-cleanup-delete-button {
  border-color: rgba(248, 113, 113, 0.42);
  background: rgba(255, 241, 242, 0.92);
  color: #be123c;
}

.reports-cleanup-delete-button:not(:disabled):hover {
  border-color: rgba(244, 63, 94, 0.5);
  background: rgba(255, 228, 230, 0.94);
  color: #9f1239;
}

.reports-cleanup-run-result {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(96, 165, 250, 0.22);
  border-radius: 14px;
  background: rgba(239, 246, 255, 0.64);
}

.reports-cleanup-run-result-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
  justify-content: space-between;
  color: #0f172a;
  font-size: 13px;
}

.reports-cleanup-run-result-heading span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.reports-cleanup-run-stats {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

@media (max-width: 760px) {
  .reports-cleanup-run-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Run and reports page layout polish */
.command-card > .dashboard-section-heading {
  margin-bottom: 20px;
}

.command-controls {
  align-items: end;
}

.command-card .field-control > span:first-child {
  color: #172033;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.35;
}

.command-card .experiment-select {
  min-height: 36px;
  padding: 0 34px 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  outline: none;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.command-card .experiment-select:focus {
  border-color: rgba(37, 99, 235, 0.48);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
}

.reports-cleanup-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.92);
}

.reports-cleanup-heading-copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.reports-cleanup-heading .detail-section-title {
  display: block;
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.25;
}

.reports-cleanup-heading .detail-section-subtitle {
  display: block;
  max-width: 760px;
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.55;
}

.reports-cleanup-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.reports-cleanup-mode-row {
  display: flex;
  align-items: center;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(191, 219, 254, 0.75);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.72), rgba(248, 250, 252, 0.94));
}

.reports-cleanup-mode-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.reports-cleanup-mode-pill.safe {
  background: #dcfce7;
  color: #166534;
}

.reports-cleanup-mode-pill.muted {
  background: #e2e8f0;
  color: #475569;
}

.reports-cleanup-root {
  min-width: 0;
  overflow: hidden;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .reports-cleanup-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .reports-cleanup-actions {
    justify-content: stretch;
  }

  .reports-cleanup-actions .reports-cleanup-action {
    flex: 1 1 140px;
  }
}

</style>
