<script setup>
/**
 * ConfigPreview — pure display component for the selected experiment
 * configuration preview grid and expandable details.
 *
 * All data is received via props; no API calls or internal state.
 */
defineProps({
  /** The resolved preview object (dataset, aggregation, attack, defense, etc.) */
  preview: {
    type: Object,
    required: true,
  },
  /** Localised UI copy (the `t` computed from App.vue) */
  copy: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="config-preview compact config-preview-line">
    <div class="preview-grid compact">
      <div class="preview-item">
        <span class="preview-label">{{ copy.previewDataset }}</span>
        <strong>{{ preview.dataset }}</strong>
      </div>
      <div class="preview-item">
        <span class="preview-label">{{ copy.previewAggregation }}</span>
        <strong>{{ preview.aggregation }}</strong>
      </div>
      <div class="preview-item">
        <span class="preview-label">{{ copy.previewAttack }}</span>
        <strong class="preview-value" :title="preview.attack">{{ preview.attack }}</strong>
      </div>
      <div class="preview-item">
        <span class="preview-label">{{ copy.previewDefense }}</span>
        <strong class="preview-value" :title="preview.defense">{{ preview.defense }}</strong>
      </div>
      <div class="preview-item">
        <span class="preview-label">{{ copy.previewRounds }}</span>
        <strong>{{ preview.rounds }}</strong>
      </div>
      <div class="preview-item">
        <span class="preview-label">{{ copy.previewClients }}</span>
        <strong>{{ preview.clients }}</strong>
      </div>
      <div class="preview-item risk-preview">
        <span class="preview-label">{{ copy.previewRiskLevel }}</span>
        <strong>
          <span class="risk-badge" :class="'risk-' + preview.risk_level">
            {{ copy.riskLevels[preview.risk_level] || preview.risk_level }}
          </span>
        </strong>
      </div>
    </div>

    <details class="preview-details">
      <summary>{{ copy.previewDetails }}</summary>
      <div class="preview-detail-grid">
        <div class="preview-item">
          <span class="preview-label">{{ copy.previewPartition }}</span>
          <strong>{{ preview.partition }}</strong>
        </div>
        <div class="preview-item">
          <span class="preview-label">{{ copy.previewMalicious }}</span>
          <strong>{{ preview.malicious_clients }}</strong>
        </div>
        <div class="preview-item">
          <span class="preview-label">{{ copy.previewLocalEpochs }}</span>
          <strong>{{ preview.local_epochs }}</strong>
        </div>
        <div class="preview-item">
          <span class="preview-label">{{ copy.previewBatchSize }}</span>
          <strong>{{ preview.batch_size }}</strong>
        </div>
        <div class="preview-item">
          <span class="preview-label">{{ copy.previewLearningRate }}</span>
          <strong>{{ preview.learning_rate }}</strong>
        </div>
      </div>
      <div v-if="preview.recommended_use" class="preview-recommended">
        <span class="preview-label">{{ copy.previewRecommendedUse }}</span>
        <p>{{ preview.recommended_use }}</p>
      </div>
      <div v-if="preview.explanations" class="explanation-list">
        <p v-for="(val, key) in preview.explanations" :key="key">
          <strong>{{ key }}:</strong> {{ val }}
        </p>
      </div>
    </details>
  </div>
</template>

<style scoped>
.config-preview-line {
  margin-top: 12px;
}

.preview-grid.compact {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.preview-item {
  min-width: 0;
  min-height: 52px;
  padding: 9px 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.70);
}

.preview-label {
  display: block;
  margin-bottom: 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
}

.preview-item strong {
  display: block;
  color: #111827;
  font-size: 14px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.risk-badge {
  background: #fef3c7;
  color: #92400e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
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

@media (max-width: 1180px) {
  .preview-grid.compact {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .preview-grid.compact {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .preview-grid.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
