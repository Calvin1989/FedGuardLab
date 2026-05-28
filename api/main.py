import uuid
import json
from pathlib import Path
from typing import Dict, Any, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from fedguardlab.config.loader import load_config
from fedguardlab.core.trainer import run_experiment
from fedguardlab.reporting.generator import generate_html_report
from fedguardlab.reporting.comparison import (
    COMPARISONS_DIR,
    generate_comparison_report,
)


app = FastAPI(title="FedGuardLab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JOBS: Dict[str, Dict[str, Any]] = {}
REPORTS_DIR = Path("reports/jobs")


class ComparisonRequest(BaseModel):
    job_ids: List[str]
    title: str = "FedGuardLab Experiment Comparison"


def save_job_results(job_id: str) -> None:
    job = JOBS[job_id]
    job_dir = REPORTS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    with open(job_dir / "config.json", "w", encoding="utf-8") as f:
        json.dump(job["config"], f, indent=2, ensure_ascii=False)

    with open(job_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(job["metrics"], f, indent=2, ensure_ascii=False)

    report_path = generate_html_report(job_id, job, job_dir)
    job["report_path"] = str(report_path)


@app.get("/")
def root():
    return {"message": "FedGuardLab API is running"}


@app.post("/run")
def create_run(config_path: str = "configs/mnist_fedavg_demo.yaml"):
    job_id = str(uuid.uuid4())
    config = load_config(config_path)

    JOBS[job_id] = {
        "status": "created",
        "config_path": config_path,
        "config": config.model_dump(),
        "metrics": [],
    }

    return {
        "job_id": job_id,
        "status": "created",
    }


@app.get("/status/{job_id}")
def get_status(job_id: str):
    if job_id not in JOBS:
        return {"error": "job not found"}

    return {
        "job_id": job_id,
        "status": JOBS[job_id]["status"],
        "metrics_count": len(JOBS[job_id]["metrics"]),
    }


@app.get("/results/{job_id}")
def get_results(job_id: str):
    if job_id not in JOBS:
        return {"error": "job not found"}

    result = JOBS[job_id].copy()
    result["report_dir"] = str(REPORTS_DIR / job_id)
    result["report_path"] = str(REPORTS_DIR / job_id / "report.html")

    return result


@app.get("/reports/{job_id}")
def get_report(job_id: str):
    report_path = REPORTS_DIR / job_id / "report.html"

    if not report_path.exists():
        return {"error": "report not found"}

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
    report_path = COMPARISONS_DIR / comparison_id / "comparison.html"

    if not report_path.exists():
        return {"error": "comparison report not found"}

    return FileResponse(report_path)


@app.websocket("/ws/{job_id}")
async def websocket_run(websocket: WebSocket, job_id: str):
    await websocket.accept()

    if job_id not in JOBS:
        await websocket.send_json({"error": "job not found"})
        await websocket.close()
        return

    try:
        JOBS[job_id]["status"] = "running"
        config = load_config(JOBS[job_id]["config_path"])

        async for metric in run_experiment(config):
            JOBS[job_id]["metrics"].append(metric)
            await websocket.send_json(metric)

        JOBS[job_id]["status"] = "finished"
        save_job_results(job_id)
        await websocket.send_json({"event": "finished"})

    except WebSocketDisconnect:
        JOBS[job_id]["status"] = "disconnected"
