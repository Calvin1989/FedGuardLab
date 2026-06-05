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
  <section class="monitor-card">
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

      <div v-if="errorMessage" class="runtime-error">
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
/* Card surface */
.monitor-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04);
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  animation: monitorFadeIn 0.28s ease-out both;
}

@keyframes monitorFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.monitor-card > * {
  position: relative;
  z-index: 1;
}

/* Layout */
.runtime-panel {
  min-width: 0;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.runtime-row {
  display: grid;
  grid-template-columns:
    minmax(112px, 0.72fr)
    minmax(260px, 1.65fr)
    repeat(4, minmax(108px, 1fr))
    minmax(150px, 0.95fr);
  align-items: stretch;
  gap: 8px;
}

/* Root element overrides (reach child component root via scoped) */
.runtime-item,
.hero-metric-item {
  min-height: 52px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  border-radius: 8px;
  transition: background 0.16s ease;
}

.runtime-item:hover,
.hero-metric-item:hover {
  background: rgba(248, 250, 252, 0.8);
}

.runtime-item.wide strong {
  display: block;
  color: #111827;
  font-size: 11px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.runtime-action {
  grid-column: -2 / -1;
  gap: 4px;
}

/* Error banner */
.runtime-error {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff1f2;
  color: #9f1239;
  font-size: 12px;
}

/* Responsive */
@media (max-width: 1180px) {
  .runtime-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .runtime-action {
    grid-column: auto;
  }

  .runtime-item.wide {
    grid-column: span 2;
  }
}

@media (max-width: 680px) {
  .runtime-row {
    grid-template-columns: 1fr;
  }

  .runtime-item.wide {
    grid-column: auto;
  }
}
</style>
