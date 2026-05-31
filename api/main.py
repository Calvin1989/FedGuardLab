import asyncio
import json
import re
import uuid
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from api.jobs import JobRecord, JobStore
from api.runner import JobEventHub, run_job
from fedguardlab.config.loader import load_config
from fedguardlab.reporting.comparison import (
    COMPARISONS_DIR,
    generate_comparison_report,
)
from fedguardlab.reporting.generator import generate_html_report

app = FastAPI(title="FedGuardLab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JOB_STORE = JobStore()
EVENT_HUB = JobEventHub()
REPORTS_DIR = Path("reports/jobs")
CONFIGS_DIR = Path("configs")
JOB_ID_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)


class ComparisonRequest(BaseModel):
    job_ids: List[str]
    title: str = "FedGuardLab Experiment Comparison"


def save_job_results(job_id: str) -> None:
    job = JOB_STORE.get(job_id)

    if job is None:
        raise ValueError(f"job not found: {job_id}")

    job_dir = REPORTS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    with open(job_dir / "config.json", "w", encoding="utf-8") as f:
        json.dump(job.config, f, indent=2, ensure_ascii=False)

    with open(job_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(job.metrics, f, indent=2, ensure_ascii=False)

    generate_html_report(job_id, JOB_STORE.to_dict(job_id), job_dir)


def resolve_config_path(config_path: str) -> Path:
    requested_path = Path(config_path)

    if requested_path.is_absolute():
        raise HTTPException(status_code=400, detail="config_path must be relative")

    resolved_path = requested_path.resolve()
    configs_root = CONFIGS_DIR.resolve()

    if configs_root not in resolved_path.parents:
        raise HTTPException(
            status_code=400,
            detail="config_path must point to a file under configs/",
        )

    if resolved_path.suffix not in {".yaml", ".yml"}:
        raise HTTPException(status_code=400, detail="config_path must be a YAML file")

    if not resolved_path.exists():
        raise HTTPException(status_code=404, detail="config file not found")

    return resolved_path


def validate_job_id(job_id: str) -> None:
    if not JOB_ID_PATTERN.fullmatch(job_id):
        raise HTTPException(status_code=400, detail="invalid job_id")


@app.get("/")
def root():
    return {"message": "FedGuardLab API is running"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "fedguardlab-api"}


@app.get("/configs")
def list_configs():
    configs = []

    for config_path in sorted(CONFIGS_DIR.glob("*.yaml")):
        try:
            config = load_config(config_path)
        except Exception as exc:
            configs.append(
                {
                    "label": config_path.stem,
                    "value": config_path.as_posix(),
                    "description": f"Invalid config: {exc}",
                    "valid": False,
                }
            )
            continue

        configs.append(
            {
                "label": config.experiment.name,
                "value": config_path.as_posix(),
                "description": (
                    f"{config.training.mode} | "
                    f"{config.dataset.name}/{config.dataset.partition} | "
                    f"{config.attack.type} | "
                    f"{config.federated.aggregation}"
                ),
                "valid": True,
                "experiment": config.experiment.model_dump(),
                "training": config.training.model_dump(),
                "federated": config.federated.model_dump(),
                "dataset": config.dataset.model_dump(),
                "attack": config.attack.model_dump(),
                "defense": config.defense.model_dump(),
            }
        )

    return {"configs": configs}


@app.post("/run")
async def create_run(config_path: str = "configs/mnist_fedavg_demo.yaml"):
    resolved_config_path = resolve_config_path(config_path)

    job_id = str(uuid.uuid4())
    config = load_config(resolved_config_path)

    JOB_STORE.create(
        JobRecord(
            job_id=job_id,
            config_path=str(resolved_config_path),
            config=config.model_dump(),
        )
    )

    asyncio.create_task(
        run_job(
            job_id=job_id,
            job_store=JOB_STORE,
            event_hub=EVENT_HUB,
            save_results=save_job_results,
        )
    )

    return {
        "job_id": job_id,
        "status": "created",
    }


@app.get("/status/{job_id}")
def get_status(job_id: str):
    validate_job_id(job_id)

    job = JOB_STORE.get(job_id)

    if job is None:
        raise HTTPException(status_code=404, detail="job not found")

    return {
        "job_id": job_id,
        "status": job.status,
        "metrics_count": len(job.metrics),
        "error": job.error,
        "created_at": job.created_at,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
    }


@app.get("/jobs")
def list_jobs():
    return {
        "jobs": [
            {
                "job_id": job.job_id,
                "status": job.status,
                "config_path": job.config_path,
                "experiment_name": job.config.get("experiment", {}).get("name"),
                "metrics_count": len(job.metrics),
                "error": job.error,
                "created_at": job.created_at,
                "started_at": job.started_at,
                "finished_at": job.finished_at,
                "has_report": (
                    (REPORTS_DIR / job.job_id / "config.json").exists()
                    and (REPORTS_DIR / job.job_id / "report.html").exists()
                ),
            }
            for job in JOB_STORE.list()
        ]
    }


@app.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    validate_job_id(job_id)

    job = JOB_STORE.get(job_id)

    if job is None:
        raise HTTPException(status_code=404, detail="job not found")

    if job.status in {"finished", "failed", "cancelled"}:
        raise HTTPException(
            status_code=400,
            detail=f"cannot cancel job with status {job.status}",
        )

    JOB_STORE.request_cancel(job_id)
    await EVENT_HUB.publish(job_id, {"event": "cancelled"})

    return {
        "job_id": job_id,
        "status": "cancelled",
    }


@app.get("/results/{job_id}")
def get_results(job_id: str):
    validate_job_id(job_id)

    job = JOB_STORE.get(job_id)

    if job is None:
        raise HTTPException(status_code=404, detail="job not found")

    result = JOB_STORE.to_dict(job_id)
    result["report_dir"] = str(REPORTS_DIR / job_id)
    result["report_path"] = str(REPORTS_DIR / job_id / "report.html")

    return result


@app.get("/reports/{job_id}")
def get_report(job_id: str):
    validate_job_id(job_id)

    report_path = REPORTS_DIR / job_id / "report.html"

    if not report_path.exists():
        raise HTTPException(status_code=404, detail="report not found")

    return FileResponse(report_path)


@app.post("/comparisons")
def create_comparison(request: ComparisonRequest):
    try:
        output_path = generate_comparison_report(
            job_ids=request.job_ids,
            title=request.title,
        )

        comparison_id = output_path.parent.name

        return {
            "comparison_id": comparison_id,
            "comparison_path": str(output_path),
            "comparison_url": f"http://127.0.0.1:8000/comparisons/{comparison_id}",
        }

    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/comparisons/{comparison_id}")
def get_comparison_report(comparison_id: str):
    validate_job_id(comparison_id)

    report_path = COMPARISONS_DIR / comparison_id / "comparison.html"

    if not report_path.exists():
        raise HTTPException(status_code=404, detail="comparison report not found")

    return FileResponse(report_path)


@app.websocket("/ws/{job_id}")
async def websocket_run(websocket: WebSocket, job_id: str):
    await websocket.accept()

    job = JOB_STORE.get(job_id)

    if job is None:
        await websocket.send_json({"event": "failed", "error": "job not found"})
        await websocket.close()
        return

    if job.status in {"finished", "failed", "cancelled"}:
        for metric in job.metrics:
            await websocket.send_json(metric)

        if job.status == "finished":
            await websocket.send_json({"event": "finished"})
        elif job.status == "failed":
            await websocket.send_json(
                {"event": "failed", "error": job.error or "job failed"}
            )
        else:
            await websocket.send_json({"event": "cancelled"})

        await websocket.close()
        return

    queue = EVENT_HUB.subscribe(job_id)
    try:
        for metric in job.metrics:
            await websocket.send_json(metric)

        while True:
            event = await queue.get()
            await websocket.send_json(event)
            if event.get("event") in {"finished", "failed", "cancelled"}:
                break
    except WebSocketDisconnect:
        pass
    finally:
        EVENT_HUB.unsubscribe(job_id, queue)
