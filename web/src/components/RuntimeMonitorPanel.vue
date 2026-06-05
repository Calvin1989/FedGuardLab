<script setup>
/**
 * RuntimeMonitorPanel — container for the live runtime monitor section.
 *
 * Displays status, job ID, per-round metrics, report link, error banner,
 * and the training metrics chart.  All state / WebSocket / API logic stays
 * in App.vue; this component is pure presentational.
 */
import RuntimeInfoTile from "./RuntimeInfoTile.vue";
import RuntimeMetricTile from "./RuntimeMetricTile.vue";
import RuntimeReportAction from "./RuntimeReportAction.vue";
import RuntimeChartPanel from "./RuntimeChartPanel.vue";

defineProps({
  /** Localised UI copy object (`t` from App.vue) */
  copy: { type: Object, required: true },
  /** Current experiment status string */
  status: { type: String, default: "idle" },
  /** Active job ID */
  jobId: { type: String, default: "" },
  /** Latest error message (empty = hidden) */
  errorMessage: { type: String, default: "" },
  /** HTML report URL (empty = not ready) */
  reportUrl: { type: String, default: "" },
  /** Latest metric object (null when no data) */
  latestMetric: { type: Object, default: null },
  /** Full metrics array (for chart) */
  metrics: { type: Array, required: true },
  /** Chart.js data object */
  chartData: { type: Object, required: true },
  /** Chart.js options object */
  chartOptions: { type: Object, required: true },
  /** URL helper that appends lang query param */
  withLang: { type: Function, required: true },
});
</script>

<template>
  <section class="card-base animate-fade-in">
    <div class="runtime-panel">
      <div class="runtime-row">
        <RuntimeInfoTile
          :label="copy.statusLabel"
          :value="copy.statusValues[status] || status"
        />

        <RuntimeInfoTile
          v-if="jobId"
          :label="copy.jobLabel"
          :value="jobId"
          wide
        />

        <RuntimeMetricTile
          v-if="latestMetric"
          :label="copy.round"
          :value="latestMetric.round"
        />
        <RuntimeMetricTile
          v-if="latestMetric"
          :label="copy.accuracy"
          :value="latestMetric.accuracy"
        />
        <RuntimeMetricTile
          v-if="latestMetric"
          :label="copy.loss"
          :value="latestMetric.loss"
        />
        <RuntimeMetricTile
          v-if="latestMetric"
          :label="copy.asr"
          :value="latestMetric.attack_success_rate"
        />
        <RuntimeReportAction
          v-if="jobId || reportUrl"
          :label="copy.reportLabel"
          :href="reportUrl ? withLang(reportUrl) : ''"
          :link-label="copy.openHtmlReportShort || copy.openHtmlReport"
          :not-ready-label="copy.notReady"
        />
      </div>

      <div v-if="errorMessage" class="error-feedback">
        <strong>{{ copy.errorLabel }}:</strong>
        <span>{{ errorMessage }}</span>
      </div>
    </div>

    <RuntimeChartPanel
      :metrics="metrics"
      :chart-data="chartData"
      :chart-options="chartOptions"
      :copy="copy"
    />
  </section>
</template>

<style scoped>
.runtime-panel {
  min-width: 0;
  margin-bottom: 24px;
}

.runtime-row {
  display: grid;
  grid-template-columns:
    minmax(120px, 0.8fr)
    minmax(280px, 1.8fr)
    repeat(4, minmax(110px, 1fr))
    minmax(160px, 1fr);
  align-items: stretch;
  gap: 12px;
}

/* Error banner */
.error-feedback {
  margin-top: 16px;
}

/* Responsive */
@media (max-width: 1280px) {
  .runtime-row {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 860px) {
  .runtime-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .runtime-row {
    grid-template-columns: 1fr;
  }
}
</style>
