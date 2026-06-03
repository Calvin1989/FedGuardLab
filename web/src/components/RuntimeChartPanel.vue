<script setup>
/**
 * RuntimeChartPanel — displays the live training metrics line chart
 * or an empty-state placeholder when no data is available.
 *
 * Chart.js registration is handled here so the component is self-contained.
 * All data (chartData, chartOptions) is received via props from App.vue.
 */
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

defineProps({
  /** Raw metrics array — used only to check emptiness */
  metrics: {
    type: Array,
    required: true,
  },
  /** Chart.js data object (labels + datasets) */
  chartData: {
    type: Object,
    required: true,
  },
  /** Chart.js options object */
  chartOptions: {
    type: Object,
    required: true,
  },
  /** Localised UI copy (the `t` computed from App.vue) */
  copy: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section class="chart-card" :class="{ 'is-empty': metrics.length === 0 }">
    <Line
      v-if="metrics.length > 0"
      :data="chartData"
      :options="chartOptions"
    />

    <div v-else class="empty-state">
      {{ copy.emptyChart }}
    </div>
  </section>
</template>

<style scoped>
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
  border: none;
  border-radius: 0;
}
</style>
