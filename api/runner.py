from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable

from api.jobs import JobStore
from fedguardlab.config.loader import load_config
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

    job_store.set_status(job_id, "running")

    try:
        config = load_config(job.config_path)

        async for metric in run_experiment(config):
            if job_store.is_cancel_requested(job_id):
                await event_hub.publish(job_id, {"event": "cancelled"})
                return

            job_store.append_metric(job_id, metric)
            await event_hub.publish(job_id, metric)

        job_store.set_status(job_id, "finished")
        save_results(job_id)
        await event_hub.publish(job_id, {"event": "finished"})

    except Exception as exc:
        logger.exception("Job %s failed", job_id)
        job_store.set_status(job_id, "failed", error=str(exc))
        await event_hub.publish(job_id, {"event": "failed", "error": str(exc)})
