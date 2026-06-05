<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: false,
    default: "",
  },
  wide: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="stat-card" :class="{ wide }">
    <span class="text-secondary text-xs font-bold uppercase tracking-wider">{{ label }}</span>
    <strong class="text-h3">{{ value }}</strong>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  min-height: 64px;
}

.stat-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.text-xs { font-size: 11px; }
.font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; }
.tracking-wider { letter-spacing: 0.05em; }

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  word-break: break-all;
}

.wide {
  grid-column: span 2;
}

@media (max-width: 860px) {
  .wide {
    grid-column: auto;
  }
}
</style>
