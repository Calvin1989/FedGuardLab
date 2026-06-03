<script setup>
defineProps({
  copy: {
    type: Object,
    required: true,
  },
  insights: {
    type: Object,
    default: () => ({}),
  },
});
</script>

<template>
  <div class="insight-section">
    <h3 class="insight-section-title">{{ copy.insightsTitle }}</h3>
    <div class="insight-cards-grid">
      <div v-if="insights.best_accuracy" class="insight-metric-card">
        <span class="insight-metric-label">{{ copy.bestAccuracy }}</span>
        <span class="insight-metric-value">{{ insights.best_accuracy.value?.toFixed(4) || '—' }}</span>
        <span class="insight-metric-exp">{{ insights.best_accuracy.experiment_name || '' }}</span>
      </div>
      <div v-if="insights.lowest_loss" class="insight-metric-card">
        <span class="insight-metric-label">{{ copy.lowestLoss }}</span>
        <span class="insight-metric-value">{{ insights.lowest_loss.value?.toFixed(4) || '—' }}</span>
        <span class="insight-metric-exp">{{ insights.lowest_loss.experiment_name || '' }}</span>
      </div>
      <div v-if="insights.lowest_asr" class="insight-metric-card">
        <span class="insight-metric-label">{{ copy.lowestAsr }}</span>
        <span class="insight-metric-value">{{ insights.lowest_asr.value?.toFixed(4) || '—' }}</span>
        <span class="insight-metric-exp">{{ insights.lowest_asr.experiment_name || '' }}</span>
      </div>
    </div>
    <div class="insight-extra-cards">
      <div v-if="insights.winner" class="insight-extra-card insight-winner">
        <span class="insight-extra-label">{{ copy.recommended }}</span>
        <p class="insight-extra-body"><strong>{{ insights.winner.experiment_name }}</strong></p>
        <p v-if="insights.winner_reason" class="insight-extra-reason">{{ insights.winner_reason }}</p>
      </div>
      <div v-if="insights.tradeoff_summary" class="insight-extra-card insight-tradeoff">
        <span class="insight-extra-label">{{ copy.tradeoff }}</span>
        <p class="insight-extra-body">{{ insights.tradeoff_summary }}</p>
      </div>
      <div v-if="insights.risk_hint" class="insight-extra-card insight-risk">
        <span class="insight-extra-label">{{ copy.riskHint }}</span>
        <p class="insight-extra-body">{{ insights.risk_hint }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.insight-section {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: none;
  animation: cardFadeIn 0.28s ease-out both;
}

.insight-section-title {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
}

.insight-cards-grid,
.insight-extra-cards {
  display: grid;
  gap: 8px;
}

.insight-cards-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.insight-extra-cards {
  margin-top: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.insight-metric-card,
.insight-extra-card {
  min-width: 0;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: #ffffff;
}

.insight-metric-label,
.insight-extra-label {
  display: block;
  margin-bottom: 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.insight-metric-value {
  display: block;
  color: #0f172a;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.05;
}

.insight-metric-exp,
.insight-extra-reason,
.insight-extra-body {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.65;
}

.insight-extra-body,
.insight-extra-reason {
  margin-bottom: 0;
}

@media (min-width: 960px) {
  .insight-cards-grid,
  .insight-extra-cards {
    gap: 12px;
  }

  .insight-metric-value {
    font-size: 24px;
  }

  .insight-metric-card,
  .insight-extra-card {
    padding: 16px;
  }
}

@media (max-width: 1100px) {
  .insight-cards-grid,
  .insight-extra-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .insight-cards-grid,
  .insight-extra-cards {
    grid-template-columns: 1fr;
  }
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
</style>
