# Changelog

## Unreleased

- Added Recent Jobs detail panel for inspecting job metadata.
  - Clicking a job row in the Recent Jobs table shows a lightweight detail card below the table.
  - Detail card displays: job_id, status, config_path, created_at, started_at, finished_at, report availability, and artifacts count.
  - If a report is available, an "Open Report" link is shown (reuses existing report URL).
  - Selected row gets a subtle highlight; clicking the same row again deselects it.
  - Shows "Select a job to inspect details." when no job is selected.
  - No new backend API, no modal, no router change.
- Added frontend category filtering for experiment config catalog.
  - New category filter dropdown above the experiment selector, defaulting to "All categories".
  - Category list is dynamically extracted from config metadata, deduplicated, and sorted.
  - Selecting a category filters the config dropdown; selecting a new category auto-selects the first available config if the current one is excluded.
  - Shows "No configs available for this category." when the filtered list is empty.
  - Configs without metadata category use "uncategorized" as fallback.
  - Preserves the v1.4.0-alpha.2 config metadata display block.
- Added frontend display for experiment config catalog metadata.
  - After selecting a config, a lightweight info block shows: display name, description, category, and tags.
  - Tags are rendered as small badges (same style as Recent Jobs badges).
  - Safe fallback when metadata is missing: name defaults to label/path, empty description/category are hidden, missing tags row is hidden.
  - No changes to API call path, backend, package.json, or CSS architecture.
- Added experiment config catalog metadata for v1.4 planning.
  - `GET /configs` now returns an optional `metadata` object per config item: `name`, `description`, `category`, `tags`.
  - Backward compatible: existing fields (`label`, `value`, `description`, `valid`, etc.) are unchanged.
  - If a config YAML has a `metadata` block, its values are used; otherwise fallback defaults apply.
  - `load_config` schema is not modified; metadata is read from raw YAML separately.
  - All existing configs under `configs/` now include metadata.
  - Documentation updated in `docs/configs.md`.
- Prepared v1.4 roadmap planning.
  - Documentation-only update; no runtime feature, no CI behavior change.
  - v1.3.0 release metadata cleanup and roadmap expansion.
  - v1.3.0 final checklist marked as completed in docs/roadmap.md.
  - v1.4.0 theme: Experiment Usability + Reproducibility + Project Polish.
  - Added v1.4.0-alpha.1 through alpha.4 planning and beta/rc/final placeholders.
- Prepared v1.3.0 final release readiness documentation.
  - No new runtime feature; focus is Developer Experience, validation, and release reliability.
  - v1.3.0 release scope:
    - CI workflow standardized as `.github/workflows/ci.yml`.
    - Manual Docker Smoke workflow added as `.github/workflows/docker-smoke.yml`.
    - Docker Smoke covers Docker Compose startup, API smoke, finished-job validation, and backend restart recovery.
    - `api_smoke_test.py` supports `--write-finished-job-id` for stable recovery validation.
    - Validation workflow documentation completed.
  - Final tag must be created on the main merge commit after PR is merged.
- Prepared v1.3.0-rc.1 release candidate readiness documentation.
  - No new runtime code, no new feature, no CI trigger change.
  - v1.3.0-beta.1 已完成 beta readiness 文档。
  - rc.1 阶段不新增功能，重点是 final release candidate validation。
- Prepared v1.3.0-beta.1 readiness documentation.
  - No new runtime code, no new feature, no CI trigger change.
  - Beta.1 focus: stability validation and release readiness.
  - Summarized v1.3 alpha series completion:
    - alpha.1: CI workflow standardized as `ci.yml`.
    - alpha.2: manual Docker Smoke workflow added.
    - alpha.3: `api_smoke_test.py` supports `--write-finished-job-id`; Docker Smoke no longer parses logs for finished job id.
    - alpha.4: validation workflow documentation completed.
- Updated documentation to reflect v1.3.0-alpha progress.
  - Documentation-only update; no new runtime code or CI behavior change.
  - CI workflow standardized as `.github/workflows/ci.yml` (covers ruff check, quick_test.py, frontend build).
  - Manual Docker Smoke workflow added as `.github/workflows/docker-smoke.yml` (`workflow_dispatch` only, not triggered on push / PR).
  - `api_smoke_test.py` supports `--write-finished-job-id <path>` to write the finished job UUID to a file.
  - Docker Smoke workflow reads `smoke_finished_job_id.txt` instead of parsing logs with regex for recovery check.
- Prepared v1.3.0-alpha.2 Docker smoke validation planning.
  - 文档规划变更，无运行时代码变更，无新增 CI 行为。
  - 规划独立 workflow（`docker-smoke.yml`），初期使用 `workflow_dispatch` 手动触发。
  - 规划 Docker smoke 覆盖范围：compose config/build/up、api_smoke_test.py、restart/recovery check、compose down。
- Prepared v1.3 roadmap planning.
  - Clarified v1.3.0-alpha.1 as CI workflow standardization for lint, quick tests, and frontend build.
  - Confirmed Docker Compose smoke validation should be deferred to v1.3.0-alpha.2.
  - No runtime code or CI behavior change is introduced in this documentation-only update.
- Prepared v1.2.0 final release documentation.
  - Consolidated v1.2 durable JobStore, artifact metadata, restart recovery, Jobs API filters, and Recent Jobs UX improvements.
  - Clarified final release validation path.
  - No new runtime feature is introduced in this documentation-only change.
- Prepared v1.2.0-rc.1 release candidate documentation.
  - Confirmed beta.1 validation path for backend, frontend, Docker Compose, API smoke tests, restart recovery, and artifact metadata consistency.
  - Clarified that rc.1 is a release-candidate readiness step with no new runtime features.
  - No new runtime feature is introduced in this documentation-only change.
- Prepared v1.2.0-beta.1 readiness documentation.
  - Consolidated v1.2 alpha milestones from alpha.1 through alpha.7.
  - Clarified release validation expectations for durable JobStore recovery, artifact metadata, Jobs API filters, and Recent Jobs UX.
  - No new runtime feature is introduced in this documentation-only change.
- Added frontend Recent Jobs report/artifact badges.
  - Recent Jobs now shows lightweight badges for: Report, Artifacts, No report.
  - Badges are based on persisted job metadata: `has_report`, `artifacts`.
  - This makes report/artifact availability easier to inspect when browsing recovered jobs.
- Added frontend Recent Jobs limit and sort controls.
  - Users can choose Recent Jobs limit: 10, 20, or 50.
  - Users can sort Recent Jobs by: Newest first, Oldest first.
  - Controls reuse the existing `GET /jobs?limit=...&sort=...` API introduced in alpha.4.
  - Controls work together with the alpha.5 status filter.
- Added frontend Recent Jobs status filter.
  - Users can filter recent jobs by: Finished with reports, Finished, Running, Cancelled, Failed, Queued.
  - The frontend uses the existing `GET /jobs?status=...` API introduced in alpha.4.
  - Non-finished jobs remain visible for status inspection but are not selectable for comparison.
  - This improves navigation when the durable JobStore contains many historical jobs.
- Added basic `GET /jobs` query parameters: `status`, `limit`, `sort`.
  - Supported status filtering: `queued`, `running`, `finished`, `failed`, `cancelled`.
  - Supported sorting: `created_at_desc` (default), `created_at_asc`.
  - Invalid status, limit, or sort values return HTTP 400.
  - `limit` values exceeding 100 are clamped to 100.
  - Added smoke test coverage for valid and invalid `/jobs` query parameters.
- Added restart recovery smoke test for durable JobStore.
  - `api_smoke_test.py --check-recovery <job_id>` verifies that a finished job remains available after backend restart.
  - Recovery check validates `/jobs`, `/status/{job_id}`, artifact metadata, artifact file existence, and `reports/jobs/index.json` consistency.
- Tightened artifact index consistency validation.
  - `api_smoke_test.py --wait-finished` now checks artifact keys, artifact file existence, and persisted index metadata.
  - Fixed `summary_md` artifact path to point to the generated `report.md`.
- Added job artifact index to `GET /jobs` and `GET /status/{job_id}`.
  - Response now includes `has_report` (bool) and `artifacts` (dict).
  - `artifacts` contains paths for `config_json`, `metrics_csv`, `summary_md`, `report_html`.
  - Artifact metadata is persisted to `index.json` alongside existing job data.
  - Frontend uses artifact metadata to gate report availability; actual file paths are never exposed — reports are still served via `GET /reports/{job_id}`.
  - API smoke test (`--wait-finished`) validates artifact metadata in status response.
- Added durable JSON JobStore (`reports/jobs/index.json`).
  - Job metadata and metrics survive backend restarts.
  - Lightweight JSON persistence — no database, ORM, or external dependency.
  - Limitations: single-process writes only; not suitable for multi-worker concurrency.
  - Corrupt or unreadable `index.json` is skipped on startup (empty store).
- Preparing v1.1.0 release candidate.

## v1.1.0-beta.3

- Added GET /health.
- Added Docker Compose backend healthcheck.
- Added live API smoke test.
- Fixed WebSocket subscribe/replay race.
- Fixed background runner cancellation race.

## v1.1.0-beta.2

- Added background job runner.
- Decoupled WebSocket from training execution.
- POST /run now starts background training.
- WebSocket now subscribes to existing job metrics/events.
- Added cancellation flag integration.
- Frontend handles cancelled event.

## v1.1.0-beta.1

- Added in-memory JobStore.
- Added GET /jobs.
- Added POST /jobs/{job_id}/cancel.
- Added job timestamps.
- Added report readiness metadata.
- Improved frontend comparison history behavior.

## v1.1.0-alpha.1

- Hardened config validation.
- Improved API error handling.
- Added frontend dynamic config loading.
- Switched frontend dependency lock to npm package-lock.json.
- Updated README/docs for v1.0.0 and v1.1.0 roadmap.
