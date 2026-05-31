# Changelog

## Unreleased

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
