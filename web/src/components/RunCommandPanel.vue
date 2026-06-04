<script setup>
import DashboardSectionHeading from "./DashboardSectionHeading.vue";
import ConfigPreview from "./ConfigPreview.vue";

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
});

const emit = defineEmits(["start", "cancel"]);
</script>

<template>
  <section class="command-card">
    <DashboardSectionHeading
      :copy="{ kicker: copy.eyebrow, title: copy.heroTitle, hint: copy.heroSubtitle }"
    />

    <div class="command-controls">
      <label class="field-control" for="category-filter">
        <span>{{ copy.categoryLabel }}</span>
        <select
          id="category-filter"
          v-model="selectedCategory"
          class="experiment-select"
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
          class="experiment-select"
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
          class="run-button"
          :disabled="isRunning || configOptions.length === 0"
          @click="emit('start')"
        >
          {{ isRunning ? copy.running : copy.runExperiment }}
        </button>

        <button
          v-if="isRunning"
          class="secondary-button"
          @click="emit('cancel')"
        >
          {{ copy.cancelExperiment }}
        </button>
      </div>
    </div>

    <div v-if="configMetadata" class="selected-config-summary">
      <div class="selected-config-copy">
        <span class="selected-config-kicker">{{ copy.configPreview }}</span>
        <strong>{{ configMetadata.name || configLabel }}</strong>
        <p>
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
          class="config-tag"
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
/* Card surface (migrated from App.vue) */
.command-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.07);
  padding: 24px 26px;
  animation: commandFadeIn 0.28s ease-out both;
}

@keyframes commandFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.command-card > * {
  position: relative;
  z-index: 1;
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

.field-control > span:first-child {
  color: #172033;
  font-size: 12px;
  font-weight: 900;
}

.experiment-select {
  width: 100%;
  min-height: 36px;
  padding: 0 34px 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
  outline: none;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.experiment-select:focus {
  border-color: rgba(37, 99, 235, 0.48);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
}

.run-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid #1d4ed8;
  border-radius: 13px;
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  word-break: keep-all;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
}

.run-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.secondary-button {
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

.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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

.selected-config-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: none;
}

.selected-config-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.selected-config-kicker {
  display: block;
  margin: 0;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.selected-config-copy strong {
  display: block;
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.25;
}

.selected-config-copy p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
}

.selected-config-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 360px;
}

.config-tag {
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

@media (max-width: 860px) {
  .command-card {
    border-radius: 22px;
  }

  .command-controls {
    grid-template-columns: 1fr;
  }

  .selected-config-summary {
    flex-direction: column;
    align-items: stretch;
  }

  .selected-config-tags {
    justify-content: flex-start;
  }
}
</style>
