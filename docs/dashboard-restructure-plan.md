# Dashboard Restructure Plan

This document records the planned Dashboard restructuring path before starting larger v2.0.0 feature work.

The current `web/src/App.vue` is functional but overloaded. It currently combines experiment launch, runtime status, recent jobs, job detail, archive / restore, comparison creation, comparison history, reports cleanup, report/artifact links, localization, and most Dashboard styling in one file.

The goal is to reduce Dashboard complexity without changing backend API behavior, training core logic, report artifact URLs, or existing safety controls.

---

## Current Observations

Current `web/src/App.vue` structure is large:

- `<script setup>` contains experiment state, API calls, job history mapping, comparison logic, cleanup logic, formatting helpers, localStorage helpers, and localization.
- `<template>` renders the main runtime dashboard, job history, job detail, comparison controls, comparison history, and reports cleanup controls.
- `<style scoped>` contains base layout styles, responsive overrides, report/artifact link styles, job detail styles, comparison styles, cleanup styles, and accumulated UI polish overrides.

A previous CSS scan found many duplicate selectors, but most are override layers or responsive variants. Direct automatic deletion is risky and already proved unsafe because it can break CSS structure or build output.

---

## Restructure Principles

Use small PRs with one clear goal per PR.

Do not change:

- training core logic;
- existing API routes or response semantics;
- existing report/artifact URL paths;
- archive / restore semantics;
- reports cleanup safety model;
- default dry-run behavior for cleanup;
- explicit confirmation requirement for real cleanup deletion;
- current Chinese / English bilingual behavior.

Avoid introducing new dependencies in the first restructuring phase.

Avoid adding `vue-router` until the soft navigation approach is proven insufficient.

---

## Target Information Architecture

The Dashboard should move from one overloaded homepage to a section-based layout.

Recommended sections:

1. **Run**
   - experiment config selection;
   - config preview;
   - run / cancel controls;
   - current job id;
   - live runtime status;
   - runtime metrics;
   - current report entry.

2. **Jobs**
   - recent jobs table;
   - status and archive filters;
   - job detail;
   - archive / restore controls;
   - job report and artifact entries.

3. **Comparisons**
   - comparable job selection;
   - selected job preview;
   - comparison creation;
   - comparison result links;
   - comparison insights;
   - comparison history.

4. **Reports**
   - report/artifact entry conventions;
   - reports cleanup summary;
   - cleanup dry-run preview;
   - confirmed cleanup run controls;
   - cleanup result feedback.

This can initially be implemented as a soft section navigation inside `App.vue`, using local component state such as `activeDashboardSection`, without changing browser routing or adding dependencies.

---

## Suggested PR Sequence

### PR A — Add Dashboard Section Navigation Shell

Goal:

- Add a lightweight section navigation state.
- Add visible section tabs or buttons for Run, Jobs, Comparisons, and Reports.
- Keep existing logic in `App.vue`.
- Do not move API logic yet.
- Do not change backend behavior.
- Do not change report/artifact URLs.

Validation:

- `git diff --check`
- `python -m ruff check .`
- `python quick_test.py`
- `python -m pytest`
- `cd web && npm run build`
- `python api_smoke_test.py`

### PR B — Move Jobs UI Into Jobs Section

Goal:

- Show recent jobs, filters, selected job detail, archive / restore, and job artifacts in the Jobs section.
- Keep the underlying state and helper functions unchanged.
- Preserve localStorage behavior.
- Preserve archive / restore API calls.
- Preserve job report/artifact URL generation.

### PR C — Move Comparison UI Into Comparisons Section

Goal:

- Show comparable job selection, selected job preview, comparison creation, comparison result, insights, and comparison history in the Comparisons section.
- Preserve comparison API calls.
- Preserve comparison artifact URL generation.
- Preserve comparison history behavior.

### PR D — Move Reports Cleanup UI Into Reports Section

Goal:

- Show reports cleanup summary, dry-run preview, confirmed cleanup action, and cleanup result feedback in the Reports section.
- Preserve cleanup API calls.
- Preserve dry-run default.
- Preserve explicit confirmation requirement before real deletion.

### PR E — Start Component Extraction

Only after section navigation is stable, extract small components.

Candidate components:

- `RunPanel.vue`
- `JobHistoryPanel.vue`
- `JobDetailPanel.vue`
- `ComparisonPanel.vue`
- `ComparisonHistoryPanel.vue`
- `ReportsCleanupPanel.vue`
- `ArtifactLinks.vue`
- `DashboardSectionNav.vue`

Each extraction PR should move one component or one small group of related view-only markup.

---

## CSS Strategy

Do not blindly delete repeated CSS selectors.

Preferred order:

1. Add section comments to the CSS.
2. Group styles by Dashboard section.
3. Keep responsive overrides near the section they affect where practical.
4. Extract shared visual primitives only after behavior is stable.
5. Delete CSS only when it is proven unused or exactly redundant and the frontend build passes.

Suggested CSS sections:

- page shell and global toolbar;
- run panel and runtime summary;
- config preview;
- jobs table;
- job detail and artifacts;
- comparison controls and result;
- comparison history;
- reports cleanup;
- responsive overrides.

---

## Acceptance Criteria For Restructure Work

Each UI restructuring PR must confirm:

- no backend API changes;
- no training core logic changes;
- no report/artifact URL changes;
- no cleanup safety model changes;
- no new dependency unless explicitly justified;
- frontend build passes;
- API smoke still passes;
- job report links still open;
- comparison artifact links still use existing paths;
- cleanup controls still require dry-run / confirmation semantics.

---

## Deferred Until Later

Do not prioritize these during the first restructuring phase:

- full router migration;
- new UI framework;
- new charting library;
- backend route redesign;
- database introduction;
- report artifact path redesign;
- training algorithm changes.

These belong in a later v2.0.0 planning phase after the Dashboard is easier to maintain.
