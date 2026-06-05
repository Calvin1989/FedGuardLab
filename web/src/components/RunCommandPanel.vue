<script setup>
import DashboardSectionHeading from "./DashboardSectionHeading.vue";
import ConfigPreview from "./ConfigPreview.vue";
import { ref } from "vue";

const selectedCategory = defineModel("selectedCategory", { type: String, default: "all" });
const selectedConfig = defineModel("selectedConfig", { type: String, default: "" });

defineProps({
  copy: { type: Object, required: true },
  categoryOptions: { type: Array, default: () => [] },
  configOptions: { type: Array, default: () => [] },
  configMetadata: { type: Object, default: null },
  configDescription: { type: String, default: "" },
  configPreview: { type: Object, default: null },
  configLabel: { type: String, default: "" },
  isRunning: { type: Boolean, default: false },
  configOverrides: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["start", "cancel", "reset-overrides", "apply-preset"]);

const showTweakPanel = ref(false);
const hasApplied = ref(false);

function toggleTweakPanel() {
  showTweakPanel.value = !showTweakPanel.value;
}

function handleApplyPreset(type) {
  emit('apply-preset', type);
  triggerAppliedFeedback();
}

function triggerAppliedFeedback() {
  hasApplied.value = true;
  setTimeout(() => {
    hasApplied.value = false;
  }, 2000);
}
</script>

<template>
  <section class="card-base animate-fade-in">
    <DashboardSectionHeading
      :copy="{ kicker: copy.eyebrow, title: copy.heroTitle, hint: copy.heroSubtitle }"
    />

    <div class="command-controls">
      <label class="field-control" for="category-filter">
        <span>{{ copy.categoryLabel }}</span>
        <select
          id="category-filter"
          v-model="selectedCategory"
          class="select-base"
          :disabled="isRunning"
        >
          <option value="all">{{ copy.allCategories }}</option>
          <option
            v-for="cat in categoryOptions"
            :key="cat"
            :value="cat"
          >
            {{ cat }}
          </option>
        </select>
      </label>

      <label class="field-control field-control-wide" for="experiment-select">
        <span>{{ copy.experimentLabel }}</span>
        <select
          v-if="configOptions.length > 0"
          id="experiment-select"
          v-model="selectedConfig"
          class="select-base"
          :disabled="isRunning"
        >
          <option
            v-for="option in configOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <span v-else class="config-empty-filter">
          {{ copy.noConfigsForCategory }}
        </span>
      </label>

      <div class="command-run-group">
        <button
          class="btn btn-outline tweak-btn"
          :class="{ active: showTweakPanel }"
          :disabled="isRunning || configOptions.length === 0"
          @click="toggleTweakPanel"
        >
          {{ copy.tweakParameters }}
        </button>

        <button
          class="btn btn-primary"
          :disabled="isRunning || configOptions.length === 0"
          @click="emit('start')"
        >
          {{ isRunning ? copy.running : copy.runExperiment }}
        </button>

        <button
          v-if="isRunning"
          class="btn btn-secondary"
          @click="emit('cancel')"
        >
          {{ copy.cancelExperiment }}
        </button>
      </div>
    </div>

    <div v-if="showTweakPanel && configOverrides" class="tweak-panel animate-fade-in">
      <div class="tweak-header">
        <div class="preset-group">
          <span class="preset-label">{{ copy.parameterPresets }}</span>
          <div class="preset-buttons">
            <button class="btn btn-xs btn-outline" @click="handleApplyPreset('quick')">{{ copy.presetQuick }}</button>
            <button class="btn btn-xs btn-outline" @click="handleApplyPreset('standard')">{{ copy.presetStandard }}</button>
            <button class="btn btn-xs btn-outline" @click="handleApplyPreset('high_intensity')">{{ copy.presetHighIntensity }}</button>
            <button class="btn btn-xs btn-outline" @click="handleApplyPreset('long_term')">{{ copy.presetLongTerm }}</button>
          </div>
        </div>
        <div class="applied-badge" :class="{ show: hasApplied }">
          ✅ {{ copy.applyParameters }}
        </div>
      </div>

      <div class="tweak-grid">
        <label class="tweak-field">
          <span>{{ copy.roundsLabel }}</span>
          <input type="number" v-model.number="configOverrides.experiment.rounds" min="1" max="200" class="input-base" />
        </label>
        <label class="tweak-field">
          <span>{{ copy.clientsLabel }}</span>
          <input type="number" v-model.number="configOverrides.federated.num_clients" min="1" max="100" class="input-base" />
        </label>
        <label class="tweak-field">
          <span>{{ copy.maliciousClientsLabel }}</span>
          <input type="number" v-model.number="configOverrides.federated.malicious_clients" min="0" :max="configOverrides.federated.num_clients" class="input-base" />
        </label>
        <label class="tweak-field">
          <span>{{ copy.lrLabel }}</span>
          <input type="number" v-model.number="configOverrides.training.learning_rate" step="0.001" min="0.0001" max="1" class="input-base" />
        </label>
        <label class="tweak-field">
          <span>{{ copy.batchSizeLabel }}</span>
          <input type="number" v-model.number="configOverrides.training.batch_size" min="1" max="512" class="input-base" />
        </label>
        <label class="tweak-field">
          <span>{{ copy.epochsLabel }}</span>
          <input type="number" v-model.number="configOverrides.training.local_epochs" min="1" max="50" class="input-base" />
        </label>
        <label class="tweak-field">
          <span>{{ copy.poisonFractionLabel }}</span>
          <input type="number" v-model.number="configOverrides.attack.poison_fraction" step="0.1" min="0" max="1" class="input-base" />
        </label>
        <div class="tweak-actions">
          <button class="btn btn-secondary btn-sm" @click="emit('reset-overrides')">
            {{ copy.resetParameters }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="configMetadata" class="selected-config-summary">
      <div class="selected-config-copy">
        <span class="selected-config-kicker">{{ copy.configPreview }}</span>
        <strong class="text-h3">{{ configMetadata.name || configLabel }}</strong>
        <p class="text-secondary text-sm">
          {{ configMetadata.description || configDescription }}
        </p>
      </div>

      <div
        v-if="configMetadata.tags.length > 0"
        class="selected-config-tags"
      >
        <span
          v-for="tag in configMetadata.tags"
          :key="tag"
          class="tag tag-primary"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <ConfigPreview
      v-if="configPreview"
      :preview="configPreview"
      :copy="copy"
    />
  </section>
</template>

<style scoped>
.command-controls {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  align-items: end;
  gap: 16px;
  margin-top: 24px;
}

.field-control {
  display: grid;
  gap: 8px;
}

.field-control > span:first-child {
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.config-empty-filter {
  height: 42px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border: 1px dashed var(--color-border-card);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 13px;
}

.command-run-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tweak-btn.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tweak-panel {
  margin-top: 24px;
  padding: 24px;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tweak-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-primary-border);
}

.preset-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.preset-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.preset-buttons {
  display: flex;
  gap: 8px;
}

.applied-badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-success);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.applied-badge.show {
  opacity: 1;
  transform: translateY(0);
}

.tweak-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  align-items: end;
}

.tweak-field {
  display: grid;
  gap: 8px;
}

.tweak-field > span {
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tweak-actions {
  display: flex;
  align-items: flex-end;
  height: 100%;
}

.selected-config-summary {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;
  margin-top: 24px;
  padding: 20px;
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-lg);
  background: white;
}

.selected-config-copy {
  display: grid;
  gap: 6px;
}

.selected-config-kicker {
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.selected-config-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  max-width: 400px;
}

@media (max-width: 860px) {
  .command-controls {
    grid-template-columns: 1fr;
  }

  .selected-config-summary {
    grid-template-columns: 1fr;
  }

  .selected-config-tags {
    justify-content: flex-start;
  }
}
</style>
