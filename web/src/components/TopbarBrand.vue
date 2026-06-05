<template>
  <div class="topbar-brand">
    <span class="brand-mark" aria-hidden="true"></span>
    <span>FedGuardLab</span>
  </div>
</template>

<style scoped>
.topbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.brand-mark {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: linear-gradient(135deg, #22c55e, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
}

@media (max-width: 560px) {
  .topbar-brand {
    font-size: 12px;
  }
}
</style>
