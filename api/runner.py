from __future__ import annotations

import asyncio
import logging
import traceback
from typing import Any, Callable

from api.jobs import JobStore
from fedguardlab.config.schema import FedGuardConfig
from fedguardlab.core.trainer import run_experiment

logger = logging.getLogger(__name__)

SubscriberQueue = asyncio.Queue[dict[str, Any]]


class JobEventHub:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[SubscriberQueue]] = {}

    def subscribe(self, job_id: str) -> SubscriberQueue:
        queue: SubscriberQueue = asyncio.Queue()
        self._subscribers.setdefault(job_id, set()).add(queue)
        return queue

    def unsubscribe(self, job_id: str, queue: SubscriberQueue) -> None:
        queues = self._subscribers.get(job_id)
        if queues is not None:
            queues.discard(queue)
            if not queues:
                del self._subscribers[job_id]

    async def publish(self, job_id: str, event: dict[str, Any]) -> None:
        for queue in list(self._subscribers.get(job_id, set())):
            await queue.put(event)


async def run_job(
    job_id: str,
    job_store: JobStore,
    event_hub: JobEventHub,
    save_results: Callable[[str], None],
) -> None:
    job = job_store.get(job_id)
    if job is None:
        return

    if job_store.is_cancel_requested(job_id):
        job_store.set_status(job_id, "cancelled")
        job_store.add_event(job_id, {"type": "cancelled", "message": "Job cancelled"})
        await event_hub.publish(job_id, {"event": "cancelled"})
        return

    job_store.set_status(job_id, "running")
    job_store.add_event(job_id, {"type": "started", "message": "Job started"})
    await asyncio.sleep(0.1)

    try:
        config = FedGuardConfig(**job.config)
        total_rounds = config.experiment.rounds

        async for metric in run_experiment(config):
            if job_store.is_cancel_requested(job_id):
                job_store.set_status(job_id, "cancelled")
                job_store.add_event(
                    job_id, {"type": "cancelled", "message": "Job cancelled"}
                )
                await event_hub.publish(job_id, {"event": "cancelled"})
                return

            job_store.append_metric(job_id, metric)
            job_store.add_event(
                job_id,
                {
                    "type": "round_progress",
                    "message": f"Round {metric['round']}/{total_rounds}",
                    "round": metric["round"],
                    "total_rounds": total_rounds,
                    "metrics": {
                        "accuracy": metric.get("accuracy"),
                        "loss": metric.get("loss"),
                        "attack_success_rate": metric.get("attack_success_rate"),
                    },
                },
            )
            await event_hub.publish(job_id, metric)
            await asyncio.sleep(0)

        job_store.set_status(job_id, "finished")
        save_results(job_id)
        job_store.add_event(
            job_id,
            {"type": "artifact_written", "message": "Artifacts saved"},
        )
        job_store.add_event(
            job_id,
            {"type": "finished", "message": "Job finished successfully"},
        )
        await event_hub.publish(job_id, {"event": "finished"})
        await asyncio.sleep(0)

    except Exception as exc:
        logger.exception("Job %s failed", job_id)
        tb_lines = traceback.format_exception(type(exc), exc, exc.__traceback__)
        tb_summary = "".join(tb_lines[-3:]).strip()[-500:]
        job_store.set_status(job_id, "failed", error=str(exc))
        job_store.add_event(
            job_id,
            {
                "type": "failed",
                "message": "Job failed",
                "details": {
                    "error": str(exc),
                    "traceback_summary": tb_summary,
                },
            },
        )
        await event_hub.publish(job_id, {"event": "failed", "error": str(exc)})
