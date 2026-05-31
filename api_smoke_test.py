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

EXPECTED_ARTIFACT_KEYS = {"config_json", "metrics_csv", "summary_md", "report_html"}
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
    assert entry["artifacts"] == status_data["artifacts"], (
        f"artifacts mismatch: index={entry['artifacts']} "
        f"status={status_data['artifacts']}"
    )
    assert len(entry.get("metrics", [])) == status_data["metrics_count"], (
        f"metrics length mismatch: index={len(entry.get('metrics', []))} "
        f"status={status_data['metrics_count']}"
    )


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
    _assert_index_consistent(job_id, data)
    print(f"[OK]  recovery check passed for job_id={job_id}", flush=True)


def _get_with_status(path: str) -> tuple[int, Any]:
    url = f"{BASE}{path}"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        return exc.code, None


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

    print("[RUN] GET /jobs?status=unknown (expect 400)", flush=True)
    code, _ = _get_with_status("/jobs?status=unknown")
    assert code == 400, f"expected 400, got {code}"
    print("[OK]  GET /jobs?status=unknown -> 400", flush=True)

    print("[RUN] GET /jobs?limit=0 (expect 400)", flush=True)
    code, _ = _get_with_status("/jobs?limit=0")
    assert code == 400, f"expected 400, got {code}"
    print("[OK]  GET /jobs?limit=0 -> 400", flush=True)

    print("[RUN] GET /jobs?sort=unknown (expect 400)", flush=True)
    code, _ = _get_with_status("/jobs?sort=unknown")
    assert code == 400, f"expected 400, got {code}"
    print("[OK]  GET /jobs?sort=unknown -> 400", flush=True)


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

    # POST /run
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
    print(f"[OK]  GET /status/{job_id2} -> cancelled", flush=True)


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
        _assert_index_consistent(job_id, data)
        print(
            f"[OK]  job {job_id} finished with {data['metrics_count']} metrics",
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
