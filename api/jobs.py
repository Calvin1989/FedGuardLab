from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

JobStatus = Literal[
    "created",
    "running",
    "finished",
    "failed",
    "cancelled",
    "disconnected",
]


@dataclass
class JobRecord:
    job_id: str
    config_path: str
    config: dict[str, Any]
    status: JobStatus = "created"
    metrics: list[dict[str, Any]] = field(default_factory=list)
    error: str | None = None
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    started_at: str | None = None
    finished_at: str | None = None
    cancel_requested: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "job_id": self.job_id,
            "config_path": self.config_path,
            "config": self.config,
            "status": self.status,
            "metrics": self.metrics,
            "error": self.error,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "cancel_requested": self.cancel_requested,
        }


class JobStore:
    def __init__(self, storage_path: Path | None = None) -> None:
        self._jobs: dict[str, JobRecord] = {}
        self._storage_path = storage_path
        if storage_path is not None:
            self._load()

    def _load(self) -> None:
        assert self._storage_path is not None
        try:
            raw = json.loads(self._storage_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return
        if not isinstance(raw, list):
            return
        for entry in raw:
            if not isinstance(entry, dict):
                continue
            try:
                job_id = entry["job_id"]
                config_path = entry["config_path"]
                config = entry["config"]
            except KeyError:
                continue
            job = JobRecord(
                job_id=job_id,
                config_path=config_path,
                config=config,
                status=entry.get("status", "created"),
                metrics=entry.get("metrics", []),
                error=entry.get("error"),
                created_at=entry.get("created_at", ""),
                started_at=entry.get("started_at"),
                finished_at=entry.get("finished_at"),
                cancel_requested=entry.get("cancel_requested", False),
            )
            self._jobs[job.job_id] = job

    def _save(self) -> None:
        if self._storage_path is None:
            return
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        data = [job.to_dict() for job in self._jobs.values()]
        self._storage_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def create(self, job: JobRecord) -> None:
        self._jobs[job.job_id] = job
        self._save()

    def get(self, job_id: str) -> JobRecord | None:
        return self._jobs.get(job_id)

    def list(self) -> list[JobRecord]:
        return list(self._jobs.values())

    def set_status(
        self,
        job_id: str,
        status: JobStatus,
        error: str | None = None,
    ) -> None:
        job = self._jobs[job_id]
        job.status = status
        job.error = error

        if status == "running" and job.started_at is None:
            job.started_at = datetime.now(UTC).isoformat()

        if status in {"finished", "failed", "cancelled"}:
            job.finished_at = datetime.now(UTC).isoformat()

        self._save()

    def request_cancel(self, job_id: str) -> None:
        job = self._jobs[job_id]
        job.cancel_requested = True
        self.set_status(job_id, "cancelled")

    def is_cancel_requested(self, job_id: str) -> bool:
        job = self._jobs.get(job_id)
        if job is None:
            return True
        return job.cancel_requested or job.status == "cancelled"

    def append_metric(self, job_id: str, metric: dict[str, Any]) -> None:
        self._jobs[job_id].metrics.append(metric)
        self._save()

    def to_dict(self, job_id: str) -> dict[str, Any]:
        job = self._jobs[job_id]
        return {
            "job_id": job.job_id,
            "config_path": job.config_path,
            "config": job.config,
            "status": job.status,
            "metrics": job.metrics,
            "metrics_count": len(job.metrics),
            "error": job.error,
            "created_at": job.created_at,
            "started_at": job.started_at,
            "finished_at": job.finished_at,
            "cancel_requested": job.cancel_requested,
        }
