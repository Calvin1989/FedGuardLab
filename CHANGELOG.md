# Changelog

## Unreleased

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
