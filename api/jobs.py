from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
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


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, JobRecord] = {}

    def create(self, job: JobRecord) -> None:
        self._jobs[job.job_id] = job

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

    def append_metric(self, job_id: str, metric: dict[str, Any]) -> None:
        self._jobs[job_id].metrics.append(metric)

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
        }