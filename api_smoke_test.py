from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

BASE = os.environ.get("FEDGUARDLAB_API_BASE", "http://127.0.0.1:8000")


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


def main() -> None:
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


if __name__ == "__main__":
    main()
