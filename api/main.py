import uuid
from typing import Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from fedguardlab.config.loader import load_config
from fedguardlab.core.trainer import run_fake_experiment


app = FastAPI(title="FedGuardLab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JOBS: Dict[str, Dict[str, Any]] = {}


@app.get("/")
def root():
    return {"message": "FedGuardLab API is running"}


@app.post("/run")
def create_run(config_path: str = "configs/label_flip_demo.yaml"):
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

    return JOBS[job_id]


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

        async for metric in run_fake_experiment(config):
            JOBS[job_id]["metrics"].append(metric)
            await websocket.send_json(metric)

        JOBS[job_id]["status"] = "finished"
        await websocket.send_json({"event": "finished"})

    except WebSocketDisconnect:
        JOBS[job_id]["status"] = "disconnected"
