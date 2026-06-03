from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

BASE = os.environ.get("FEDGUARDLAB_API_BASE", "http://127.0.0.1:8000")

EXPECTED_ARTIFACT_KEYS = {
    "config_json",
    "metrics_json",
    "metrics_csv",
    "summary_md",
    "report_html",
}
JOB_INDEX_PATH = Path("reports/jobs/index.json")


def _get(path: str) -> Any:
    url = f"{BASE}{path}"
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def _post(path: str) -> Any:
    url = f"{BASE}{path}"
    req = urllib.request.Request(url, data=b"", method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def _wait_until_status(job_id: str, timeout: float = 30.0) -> str:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        data = _get(f"/status/{job_id}")
        status = data["status"]
        if status in {"finished", "failed", "cancelled", "running"}:
            return status
        time.sleep(0.5)
    raise AssertionError(f"Timed out waiting for job {job_id} to leave 'created'")


def _wait_until_finished(job_id: str, timeout: float = 60.0) -> dict[str, Any]:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        data = _get(f"/status/{job_id}")
        status = data["status"]
        if status == "finished":
            return data
        if status in {"failed", "cancelled"}:
            raise AssertionError(f"Job {job_id} reached terminal status '{status}'")
        time.sleep(0.5)
    raise AssertionError(f"Timed out waiting for job {job_id} to finish")


def _assert_artifacts_complete(data: dict[str, Any], *, require_files: bool) -> None:
    assert isinstance(data.get("has_report"), bool), f"has_report not bool: {data}"
    artifacts = data.get("artifacts")
    assert isinstance(artifacts, dict), f"artifacts not dict: {data}"
    assert EXPECTED_ARTIFACT_KEYS <= artifacts.keys(), (
        f"missing artifact keys: {EXPECTED_ARTIFACT_KEYS - artifacts.keys()}"
    )
    for key in EXPECTED_ARTIFACT_KEYS:
        val = artifacts[key]
        assert isinstance(val, str) and val, (
            f"artifact {key} not non-empty string: {val!r}"
        )
        if require_files:
            assert Path(val).exists(), f"artifact file missing: {val}"


EXPECTED_SUMMARY_FIELDS = {
    "aggregation",
    "defense",
    "attack",
    "final_accuracy",
    "final_loss",
    "final_asr",
    "has_report",
    "archived",
    "archived_at",
}


def _assert_summary_fields(data: dict[str, Any]) -> None:
    """Verify that a /status or /jobs summary includes all expected fields."""
    missing = EXPECTED_SUMMARY_FIELDS - data.keys()
    assert not missing, f"missing summary fields: {missing}"
    assert isinstance(data["has_report"], bool), (
        f"has_report not bool: {data['has_report']}"
    )


EXPECTED_LIFECYCLE_EVENTS = {"created", "started", "finished"}


def _assert_events(
    data: dict[str, Any], expected_types: set[str] | None = None
) -> None:
    """Verify that a /status response includes events with expected types."""
    events = data.get("events")
    assert isinstance(events, list), f"events not list: {type(events)}"
    assert len(events) > 0, "events is empty"
    types = {e["type"] for e in events}
    required = expected_types or EXPECTED_LIFECYCLE_EVENTS
    missing = required - types
    assert not missing, f"missing event types: {missing}"
    for ev in events:
        assert "type" in ev, f"event missing type: {ev}"
        assert "message" in ev, f"event missing message: {ev}"
        assert "created_at" in ev, f"event missing created_at: {ev}"


def _assert_index_consistent(job_id: str, status_data: dict[str, Any]) -> None:
    assert JOB_INDEX_PATH.exists(), f"index file missing: {JOB_INDEX_PATH}"
    index = json.loads(JOB_INDEX_PATH.read_text(encoding="utf-8"))
    assert isinstance(index, list), f"index not a list: {type(index)}"
    matches = [entry for entry in index if entry.get("job_id") == job_id]
    assert len(matches) == 1, (
        f"job {job_id} not found in index (matches={len(matches)})"
    )
    entry = matches[0]
    assert entry["has_report"] == status_data["has_report"], (
        f"has_report mismatch: index={entry['has_report']} "
        f"status={status_data['has_report']}"
    )
    entry_artifacts = entry.get("artifacts", {})
    status_artifacts = status_data.get("artifacts", {})
    assert isinstance(entry_artifacts, dict), (
        f"index artifacts not dict: {entry_artifacts}"
    )
    assert isinstance(status_artifacts, dict), (
        f"status artifacts not dict: {status_artifacts}"
    )
    for key in EXPECTED_ARTIFACT_KEYS:
        assert key in status_artifacts, f"status artifact missing {key}"
    assert len(entry.get("metrics", [])) == status_data["metrics_count"], (
        f"metrics length mismatch: index={len(entry.get('metrics', []))} "
        f"status={status_data['metrics_count']}"
    )
    assert entry.get("archived", False) == status_data.get("archived", False), (
        f"archived mismatch: index={entry.get('archived')} "
        f"status={status_data.get('archived')}"
    )
    assert entry.get("archived_at") == status_data.get("archived_at"), (
        f"archived_at mismatch: index={entry.get('archived_at')} "
        f"status={status_data.get('archived_at')}"
    )



def _assert_reports_cleanup_summary() -> None:
    print("[RUN] GET /reports/cleanup/summary", flush=True)
    data = _get("/reports/cleanup/summary")
    assert data.get("dry_run") is True, f"dry_run not true: {data}"
    assert data.get("deletes_files") is False, f"deletes_files not false: {data}"
    assert isinstance(data.get("total_size_bytes"), int), (
        f"total_size_bytes not int: {data}"
    )

    for key in ("jobs", "comparisons"):
        section = data.get(key)
        assert isinstance(section, dict), f"{key} section not dict: {data}"
        assert isinstance(section.get("count"), int), f"{key}.count not int: {data}"
        assert isinstance(section.get("size_bytes"), int), (
            f"{key}.size_bytes not int: {data}"
        )

    preview = data.get("cleanup_preview")
    assert isinstance(preview, dict), f"cleanup_preview not dict: {data}"
    assert isinstance(preview.get("candidate_count"), int), (
        f"candidate_count not int: {data}"
    )
    assert isinstance(preview.get("candidate_size_bytes"), int), (
        f"candidate_size_bytes not int: {data}"
    )
    assert isinstance(preview.get("candidates"), list), (
        f"candidates not list: {data}"
    )
    print("[OK]  GET /reports/cleanup/summary", flush=True)


def _assert_reports_cleanup_run_dry_run() -> None:
    print("[RUN] POST /reports/cleanup/run dry-run", flush=True)
    code, data = _post_json_with_status(
        "/reports/cleanup/run",
        {"keep_latest": 20, "dry_run": True, "confirm": False},
    )
    assert code == 200, f"expected 200, got {code}: {data}"
    assert data.get("dry_run") is True, f"dry_run not true: {data}"
    assert data.get("deletes_files") is False, f"deletes_files not false: {data}"
    assert isinstance(data.get("candidate_count"), int), (
        f"candidate_count not int: {data}"
    )
    assert isinstance(data.get("deleted_count"), int), (
        f"deleted_count not int: {data}"
    )
    assert data.get("deleted_count") == 0, f"dry-run deleted files: {data}"
    assert isinstance(data.get("skipped"), list), f"skipped not list: {data}"
    print("[OK]  POST /reports/cleanup/run dry-run", flush=True)

def run_recovery_check(job_id: str) -> None:
    print("[RUN] GET /jobs (recovery check)", flush=True)
    data = _get("/jobs")
    assert isinstance(data["jobs"], list), f"jobs not list: {data}"
    job_ids = {j["job_id"] for j in data["jobs"]}
    assert job_id in job_ids, f"job {job_id} not found in /jobs list"
    print("[OK]  GET /jobs (recovery check)", flush=True)

    print(f"[RUN] GET /status/{job_id} (recovery check)", flush=True)
    data = _get(f"/status/{job_id}")
    assert data["job_id"] == job_id, f"job_id mismatch: {data['job_id']}"
    assert data["status"] == "finished", f"unexpected status: {data['status']}"
    assert data.get("metrics_count", 0) > 0, f"no metrics: {data}"
    assert data.get("has_report") is True, f"has_report not True: {data}"
    _assert_artifacts_complete(data, require_files=True)
    _assert_summary_fields(data)
    _assert_events(data)
    _assert_index_consistent(job_id, data)
    _assert_report_artifact_downloads(job_id)
    print(
        f"[OK]  recovery check passed for job_id={job_id} "
        f"({len(data.get('events', []))} events)",
        flush=True,
    )


def _get_with_status(path: str) -> tuple[int, Any]:
    url = f"{BASE}{path}"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        return exc.code, None


def _post_with_status(path: str) -> tuple[int, Any]:
    url = f"{BASE}{path}"
    req = urllib.request.Request(url, data=b"", method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read())
        except json.JSONDecodeError:
            return exc.code, None


def _post_json_with_status(path: str, payload: dict[str, Any]) -> tuple[int, Any]:
    url = f"{BASE}{path}"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read())
        except json.JSONDecodeError:
            return exc.code, None


def _get_raw_with_status(path: str) -> tuple[int, bytes]:
    url = f"{BASE}{path}"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()


def _assert_report_artifact_downloads(job_id: str) -> None:
    for artifact_path in (
        f"/reports/{job_id}/config.json",
        f"/reports/{job_id}/metrics.json",
        f"/reports/{job_id}/metrics.csv",
        f"/reports/{job_id}/report.md",
    ):
        print(f"[RUN] GET {artifact_path}", flush=True)
        code, content = _get_raw_with_status(artifact_path)
        assert code == 200, f"expected 200 for {artifact_path}, got {code}"
        assert content, f"empty artifact response for {artifact_path}"
        print(f"[OK]  GET {artifact_path}", flush=True)


def _assert_comparison_artifact_downloads(comparison_id: str) -> None:
    for artifact_path in (
        f"/comparisons/{comparison_id}",
        f"/comparisons/{comparison_id}/comparison.csv",
        f"/comparisons/{comparison_id}/comparison.json",
    ):
        print(f"[RUN] GET {artifact_path}", flush=True)
        code, content = _get_raw_with_status(artifact_path)
        assert code == 200, f"expected 200 for {artifact_path}, got {code}"
        assert content, f"empty artifact response for {artifact_path}"
        print(f"[OK]  GET {artifact_path}", flush=True)


def _assert_jobs_query_params() -> None:
    print("[RUN] GET /jobs?limit=1", flush=True)
    code, data = _get_with_status("/jobs?limit=1")
    assert code == 200, f"expected 200, got {code}"
    assert len(data["jobs"]) <= 1, (
        f"expected <=1 job, got {len(data['jobs'])}"
    )
    print("[OK]  GET /jobs?limit=1", flush=True)

    print("[RUN] GET /jobs?sort=created_at_desc", flush=True)
    code, data = _get_with_status("/jobs?sort=created_at_desc")
    assert code == 200, f"expected 200, got {code}"
    print("[OK]  GET /jobs?sort=created_at_desc", flush=True)

    print("[RUN] GET /jobs?sort=created_at_asc", flush=True)
    code, data = _get_with_status("/jobs?sort=created_at_asc")
    assert code == 200, f"expected 200, got {code}"
    print("[OK]  GET /jobs?sort=created_at_asc", flush=True)

    print("[RUN] GET /jobs?status=finished", flush=True)
    code, data = _get_with_status("/jobs?status=finished")
    assert code == 200, f"expected 200, got {code}"
    for job in data["jobs"]:
        assert job["status"] == "finished", (
            f"expected finished, got {job['status']}"
        )
    print("[OK]  GET /jobs?status=finished", flush=True)

    print("[RUN] GET /jobs?archived=active", flush=True)
    code, data = _get_with_status("/jobs?archived=active")
    assert code == 200, f"expected 200, got {code}"
    for job in data["jobs"]:
        assert job.get("archived") is False, f"expected active job, got {job}"
    print("[OK]  GET /jobs?archived=active", flush=True)

    print("[RUN] GET /jobs?archived=archived", flush=True)
    code, data = _get_with_status("/jobs?archived=archived")
    assert code == 200, f"expected 200, got {code}"
    for job in data["jobs"]:
        assert job.get("archived") is True, f"expected archived job, got {job}"
    print("[OK]  GET /jobs?archived=archived", flush=True)

    print("[RUN] GET /jobs?archived=all", flush=True)
    code, data = _get_with_status("/jobs?archived=all")
    assert code == 200, f"expected 200, got {code}"
    assert isinstance(data["jobs"], list), f"jobs not list: {data}"
    print("[OK]  GET /jobs?archived=all", flush=True)

    print("[RUN] GET /jobs?status=unknown (expect 400)", flush=True)
    code, _ = _get_with_status("/jobs?status=unknown")
    assert code == 400, f"expected 400, got {code}"
    print("[OK]  GET /jobs?status=unknown -> 400", flush=True)

    print("[RUN] GET /jobs?archived=unknown (expect 400)", flush=True)
    code, _ = _get_with_status("/jobs?archived=unknown")
    assert code == 400, f"expected 400, got {code}"
    print("[OK]  GET /jobs?archived=unknown -> 400", flush=True)

    print("[RUN] GET /jobs?limit=0 (expect 400)", flush=True)
    code, _ = _get_with_status("/jobs?limit=0")
    assert code == 400, f"expected 400, got {code}"
    print("[OK]  GET /jobs?limit=0 -> 400", flush=True)

    print("[RUN] GET /jobs?sort=unknown (expect 400)", flush=True)
    code, _ = _get_with_status("/jobs?sort=unknown")
    assert code == 400, f"expected 400, got {code}"
    print("[OK]  GET /jobs?sort=unknown -> 400", flush=True)


def _assert_comparison_history_query_params() -> None:
    print("[RUN] GET /comparisons", flush=True)
    code, data = _get_with_status("/comparisons")
    assert code == 200, f"expected 200, got {code}"
    assert isinstance(data["comparisons"], list), f"comparisons not list: {data}"
    print("[OK]  GET /comparisons", flush=True)

    print("[RUN] GET /comparisons?limit=1", flush=True)
    code, data = _get_with_status("/comparisons?limit=1")
    assert code == 200, f"expected 200, got {code}"
    assert len(data["comparisons"]) <= 1, (
        f"expected <=1 comparison, got {len(data['comparisons'])}"
    )
    print("[OK]  GET /comparisons?limit=1", flush=True)

    print("[RUN] GET /comparisons?sort=created_at_asc", flush=True)
    code, data = _get_with_status("/comparisons?sort=created_at_asc")
    assert code == 200, f"expected 200, got {code}"
    assert isinstance(data["comparisons"], list), f"comparisons not list: {data}"
    print("[OK]  GET /comparisons?sort=created_at_asc", flush=True)

    print("[RUN] GET /comparisons?limit=0 (expect 400)", flush=True)
    code, _ = _get_with_status("/comparisons?limit=0")
    assert code == 400, f"expected 400, got {code}"
    print("[OK]  GET /comparisons?limit=0 -> 400", flush=True)

    print("[RUN] GET /comparisons?sort=unknown (expect 400)", flush=True)
    code, _ = _get_with_status("/comparisons?sort=unknown")
    assert code == 400, f"expected 400, got {code}"
    print("[OK]  GET /comparisons?sort=unknown -> 400", flush=True)


def _assert_archive_restore_flow(job_id: str) -> None:
    print(f"[RUN] POST /jobs/{job_id}/archive", flush=True)
    code, data = _post_with_status(f"/jobs/{job_id}/archive")
    assert code == 200, f"expected 200, got {code}: {data}"
    assert data["job_id"] == job_id, f"job_id mismatch: {data}"
    assert data["archived"] is True, f"archived not True: {data}"
    assert data["archived_at"], f"archived_at missing: {data}"
    print(f"[OK]  POST /jobs/{job_id}/archive", flush=True)

    print(f"[RUN] GET /status/{job_id} (after archive)", flush=True)
    data = _get(f"/status/{job_id}")
    assert data["archived"] is True, f"archived not True: {data}"
    print(f"[OK]  GET /status/{job_id} -> archived", flush=True)

    print("[RUN] GET /jobs?archived=active (archived job hidden)", flush=True)
    data = _get("/jobs?archived=active")
    assert job_id not in {j["job_id"] for j in data["jobs"]}, (
        f"archived job still visible in active list: {job_id}"
    )
    print("[OK]  archived job hidden from active list", flush=True)

    print("[RUN] GET /jobs?archived=archived (archived job visible)", flush=True)
    data = _get("/jobs?archived=archived")
    archived_jobs = {j["job_id"] for j in data["jobs"]}
    assert job_id in archived_jobs, f"archived job not listed: {job_id}"
    print("[OK]  archived job visible in archived list", flush=True)

    print("[RUN] POST /comparisons with archived job (expect 400)", flush=True)
    code, _ = _post_json_with_status(
        "/comparisons",
        {"job_ids": [job_id], "title": "Archived job comparison"},
    )
    assert code == 400, f"expected 400, got {code}"
    print("[OK]  archived job rejected by comparison API", flush=True)

    print(f"[RUN] POST /jobs/{job_id}/restore", flush=True)
    code, data = _post_with_status(f"/jobs/{job_id}/restore")
    assert code == 200, f"expected 200, got {code}: {data}"
    assert data["archived"] is False, f"archived not False: {data}"
    assert data["archived_at"] is None, f"archived_at not None: {data}"
    print(f"[OK]  POST /jobs/{job_id}/restore", flush=True)

    print("[RUN] GET /jobs?archived=active (restored job visible)", flush=True)
    data = _get("/jobs?archived=active")
    assert job_id in {j["job_id"] for j in data["jobs"]}, (
        f"restored job not visible in active list: {job_id}"
    )
    print("[OK]  restored job visible in active list", flush=True)


def run_default() -> None:
    # GET /health
    print("[RUN] GET /health", flush=True)
    data = _get("/health")
    assert data["status"] == "ok", f"unexpected health: {data}"
    print("[OK]  GET /health", flush=True)

    # GET /configs
    print("[RUN] GET /configs", flush=True)
    data = _get("/configs")
    assert isinstance(data["configs"], list) and len(data["configs"]) > 0
    print("[OK]  GET /configs", flush=True)

    # GET /jobs query params
    _assert_jobs_query_params()

    # GET /comparisons query params
    _assert_comparison_history_query_params()

    # POST /run
    _assert_reports_cleanup_summary()
    _assert_reports_cleanup_run_dry_run()

    print("[RUN] POST /run", flush=True)
    data = _post("/run?config_path=configs/label_flip_demo.yaml")
    job_id = data["job_id"]
    assert isinstance(job_id, str) and len(job_id) > 0
    print(f"[OK]  POST /run -> job_id={job_id}", flush=True)

    # GET /status/{job_id}
    print("[RUN] GET /status/{job_id}", flush=True)
    status = _wait_until_status(job_id)
    assert status in {"created", "running", "finished"}, f"unexpected status: {status}"
    print(f"[OK]  GET /status/{job_id} -> {status}", flush=True)

    return job_id


def run_cancel() -> None:
    # POST /run (second job)
    print("[RUN] POST /run (second job)", flush=True)
    data = _post("/run?config_path=configs/label_flip_demo.yaml")
    job_id2 = data["job_id"]
    assert isinstance(job_id2, str) and len(job_id2) > 0
    print(f"[OK]  POST /run -> job_id={job_id2}", flush=True)

    # POST /jobs/{job_id}/cancel
    print("[RUN] POST /jobs/{job_id2}/cancel", flush=True)
    _post(f"/jobs/{job_id2}/cancel")
    time.sleep(1)
    print(f"[OK]  POST /jobs/{job_id2}/cancel", flush=True)

    # GET /status/{job_id} after cancel
    print("[RUN] GET /status/{job_id2} (after cancel)", flush=True)
    data = _get(f"/status/{job_id2}")
    assert data["status"] == "cancelled", f"unexpected status: {data['status']}"
    events = data.get("events", [])
    cancelled_events = [e for e in events if e["type"] == "cancelled"]
    assert len(cancelled_events) > 0, (
        f"cancelled job missing cancelled event: {events}"
    )
    print(f"[OK]  GET /status/{job_id2} -> cancelled (with event)", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="FedGuardLab API smoke test")
    parser.add_argument(
        "--wait-finished",
        action="store_true",
        default=False,
        help="Wait for the first job to finish (default: False)",
    )
    parser.add_argument(
        "--check-recovery",
        metavar="JOB_ID",
        default=None,
        help=(
            "Verify that a previously finished job is still "
            "available after API restart"
        ),
    )
    parser.add_argument(
        "--write-finished-job-id",
        metavar="PATH",
        default=None,
        help=(
            "Write the finished job UUID to the specified file "
            "(requires --wait-finished)"
        ),
    )
    args = parser.parse_args()

    if args.write_finished_job_id and not args.wait_finished:
        parser.error("--write-finished-job-id requires --wait-finished")

    if args.check_recovery:
        run_recovery_check(args.check_recovery)
        return

    job_id = run_default()

    if args.wait_finished:
        print(f"[RUN] Wait for job {job_id} to finish", flush=True)
        data = _wait_until_finished(job_id)
        assert data["status"] == "finished", f"unexpected status: {data['status']}"
        assert data.get("metrics_count", 0) > 0, f"no metrics: {data}"
        assert data.get("has_report") is True, f"has_report not True: {data}"
        assert isinstance(data.get("artifacts"), dict), f"artifacts not dict: {data}"
        assert "report_html" in data["artifacts"], f"report_html missing: {data}"
        _assert_artifacts_complete(data, require_files=True)
        _assert_summary_fields(data)
        _assert_events(data)
        _assert_index_consistent(job_id, data)
        _assert_report_artifact_downloads(job_id)
        _assert_archive_restore_flow(job_id)
        data = _get(f"/status/{job_id}")
        _assert_index_consistent(job_id, data)
        round_progress_count = sum(
            1 for e in data.get("events", []) if e["type"] == "round_progress"
        )
        assert round_progress_count > 0, "no round_progress events"
        print(
            f"[OK]  job {job_id} finished with {data['metrics_count']} metrics, "
            f"{len(data.get('events', []))} events",
            flush=True,
        )
        if args.write_finished_job_id:
            Path(args.write_finished_job_id).write_text(job_id + "\n", encoding="utf-8")
            print(
                f"[OK]  wrote finished job id to {args.write_finished_job_id}",
                flush=True,
            )

    run_cancel()

    print(
        "[INFO] Durable store check: restart the API and call GET /jobs "
        "to verify persisted jobs.",
        flush=True,
    )


if __name__ == "__main__":
    main()
