import asyncio
import json
import re
import uuid
from pathlib import Path
from typing import Any, Dict, List

import yaml
from fastapi import (
    FastAPI,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import BaseModel

from api.jobs import JobRecord, JobStore
from api.runner import JobEventHub, run_job
from fedguardlab.config.loader import load_config
from fedguardlab.reporting.comparison import (
    COMPARISON_LABELS,
    COMPARISONS_DIR,
    generate_comparison_report,
    normalize_comparison_lang,
)
from fedguardlab.reporting.generator import (
    REPORT_LABELS,
    generate_html_report,
    normalize_report_lang,
)

app = FastAPI(title="FedGuardLab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REPORTS_DIR = Path("reports/jobs")
TEMPLATE_DIR = Path("fedguardlab/reporting/templates")
TEMPLATE_ENV = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)
JOB_STORE = JobStore(storage_path=REPORTS_DIR / "index.json")
EVENT_HUB = JobEventHub()
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

    metadata = build_job_artifacts(job_id)
    JOB_STORE.set_artifacts(
        job_id,
        has_report=metadata["has_report"],
        artifacts=metadata["artifacts"],
    )


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


def _read_config_metadata(config_path: Path) -> Dict[str, Any]:
    """Read optional metadata from a config YAML file.

    Falls back to sensible defaults if the file has no metadata block.
    """
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f)
        meta = raw.get("metadata") if isinstance(raw, dict) else None
        if isinstance(meta, dict):
            return {
                "name": meta.get("name", config_path.stem),
                "description": meta.get("description", ""),
                "category": meta.get("category", "uncategorized"),
                "tags": meta.get("tags", []) or [],
            }
    except Exception:
        pass

    return {
        "name": config_path.stem,
        "description": "",
        "category": "uncategorized",
        "tags": [],
    }


def validate_job_id(job_id: str) -> None:
    if not JOB_ID_PATTERN.fullmatch(job_id):
        raise HTTPException(status_code=400, detail="invalid job_id")


def _job_artifact_url(job_id: str, filename: str) -> str:
    return f"http://127.0.0.1:8000/reports/{job_id}/{filename}"


def _comparison_artifact_url(comparison_id: str, filename: str) -> str:
    return f"http://127.0.0.1:8000/comparisons/{comparison_id}/{filename}"


def build_job_artifacts(job_id: str) -> dict:
    job_dir = REPORTS_DIR / job_id
    artifacts = {
        "config_json": str(job_dir / "config.json"),
        "metrics_json": str(job_dir / "metrics.json"),
        "metrics_csv": str(job_dir / "metrics.csv"),
        "summary_md": str(job_dir / "report.md"),
        "report_html": str(job_dir / "report.html"),
        "config_json_url": _job_artifact_url(job_id, "config.json"),
        "metrics_json_url": _job_artifact_url(job_id, "metrics.json"),
        "metrics_csv_url": _job_artifact_url(job_id, "metrics.csv"),
        "summary_md_url": _job_artifact_url(job_id, "report.md"),
        "report_html_url": f"http://127.0.0.1:8000/reports/{job_id}",
    }
    return {
        "has_report": (job_dir / "report.html").exists(),
        "artifacts": artifacts,
    }


def _final_metric(metrics: list[dict[str, Any]]) -> dict[str, Any]:
    return metrics[-1] if metrics else {}


def _job_summary(job: JobRecord) -> dict[str, Any]:
    config = job.config or {}
    final_metric = _final_metric(job.metrics)
    artifacts_info = build_job_artifacts(job.job_id)

    return {
        "job_id": job.job_id,
        "status": job.status,
        "config_path": job.config_path,
        "experiment_name": config.get("experiment", {}).get("name"),
        "aggregation": config.get("federated", {}).get("aggregation"),
        "defense": config.get("defense", {}).get("type"),
        "attack": config.get("attack", {}).get("type"),
        "final_accuracy": final_metric.get("accuracy"),
        "final_loss": final_metric.get("loss"),
        "final_asr": final_metric.get("attack_success_rate"),
        "final_metric": final_metric,
        "metrics_count": len(job.metrics),
        "error": job.error,
        "created_at": job.created_at,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
        "has_report": artifacts_info["has_report"],
        "artifacts": artifacts_info["artifacts"],
    }


def _download_file(path: Path, filename: str) -> FileResponse:
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="artifact not found")
    return FileResponse(path=path, filename=filename)


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

        metadata = _read_config_metadata(config_path)

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
                "metadata": metadata,
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

    return _job_summary(job)


VALID_JOB_STATUSES = {"queued", "running", "finished", "failed", "cancelled"}
VALID_SORT_OPTIONS = {"created_at_desc", "created_at_asc"}


@app.get("/jobs")
def list_jobs(
    status: str | None = None,
    limit: int | None = None,
    sort: str = "created_at_desc",
):
    if status is not None and status not in VALID_JOB_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"invalid status: {status}",
        )

    if sort not in VALID_SORT_OPTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"invalid sort: {sort}",
        )

    if limit is not None and limit <= 0:
        raise HTTPException(
            status_code=400,
            detail="limit must be greater than 0",
        )

    jobs = JOB_STORE.list()

    if status is not None:
        jobs = [j for j in jobs if j.status == status]

    reverse = sort == "created_at_desc"
    jobs.sort(key=lambda j: j.created_at, reverse=reverse)

    effective_limit = min(limit, 100) if limit is not None else None
    if effective_limit is not None:
        jobs = jobs[:effective_limit]

    return {"jobs": [_job_summary(job) for job in jobs]}


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
def get_report(job_id: str, lang: str = Query(default="zh")):
    validate_job_id(job_id)

    job_dir = REPORTS_DIR / job_id
    config_path = job_dir / "config.json"
    metrics_path = job_dir / "metrics.json"

    if not config_path.exists() or not metrics_path.exists():
        raise HTTPException(status_code=404, detail="report not found")

    config = json.loads(config_path.read_text(encoding="utf-8"))
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))

    final_metric = metrics[-1] if metrics else {}

    lang = normalize_report_lang(lang)
    labels = REPORT_LABELS[lang]

    job_record = JOB_STORE.get(job_id)
    status = job_record.status if job_record else "finished"

    template = TEMPLATE_ENV.get_template("report.html.j2")
    html = template.render(
        lang=lang,
        labels=labels,
        job_id=job_id,
        status=status,
        experiment_name=config.get("experiment", {}).get("name", job_id),
        config_json=json.dumps(config, indent=2, ensure_ascii=False),
        metrics=metrics,
        final_metric=final_metric,
        artifact_urls=build_job_artifacts(job_id)["artifacts"],
    )

    return HTMLResponse(content=html)


JOB_ARTIFACT_FILENAMES = {
    "config.json",
    "metrics.json",
    "metrics.csv",
    "report.md",
}


@app.get("/reports/{job_id}/{filename}")
def get_report_artifact(job_id: str, filename: str):
    validate_job_id(job_id)
    if filename not in JOB_ARTIFACT_FILENAMES:
        raise HTTPException(status_code=404, detail="artifact not found")

    return _download_file(REPORTS_DIR / job_id / filename, filename)


@app.post("/comparisons")
def create_comparison(request: ComparisonRequest):
    try:
        output_path = generate_comparison_report(
            job_ids=request.job_ids,
            title=request.title,
            api_base_url="http://127.0.0.1:8000",
        )

        comparison_id = output_path.parent.name

        return {
            "comparison_id": comparison_id,
            "comparison_path": str(output_path),
            "comparison_url": f"http://127.0.0.1:8000/comparisons/{comparison_id}",
            "artifacts": {
                "comparison_html_url": f"http://127.0.0.1:8000/comparisons/{comparison_id}",
                "comparison_csv_url": _comparison_artifact_url(
                    comparison_id, "comparison.csv"
                ),
                "comparison_json_url": _comparison_artifact_url(
                    comparison_id, "comparison.json"
                ),
            },
        }

    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/comparisons/{comparison_id}")
def get_comparison_report(comparison_id: str, lang: str = Query(default="zh")):
    validate_job_id(comparison_id)

    comparison_dir = COMPARISONS_DIR / comparison_id
    metadata_path = comparison_dir / "comparison.json"

    if not metadata_path.exists():
        raise HTTPException(status_code=404, detail="comparison report not found")

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))

    lang = normalize_comparison_lang(lang)
    labels = COMPARISON_LABELS[lang]

    template = TEMPLATE_ENV.get_template("comparison.html.j2")
    html = template.render(
        lang=lang,
        labels=labels,
        comparison_id=comparison_id,
        title=metadata.get("title", "Comparison"),
        experiments=metadata.get("experiments", []),
        api_base_url="http://127.0.0.1:8000",
        artifact_urls={
            "comparison_html_url": f"http://127.0.0.1:8000/comparisons/{comparison_id}",
            "comparison_csv_url": _comparison_artifact_url(
                comparison_id, "comparison.csv"
            ),
            "comparison_json_url": _comparison_artifact_url(
                comparison_id, "comparison.json"
            ),
        },
    )

    return HTMLResponse(content=html)


COMPARISON_ARTIFACT_FILENAMES = {"comparison.csv", "comparison.json"}


@app.get("/comparisons/{comparison_id}/{filename}")
def get_comparison_artifact(comparison_id: str, filename: str):
    validate_job_id(comparison_id)
    if filename not in COMPARISON_ARTIFACT_FILENAMES:
        raise HTTPException(status_code=404, detail="artifact not found")

    return _download_file(COMPARISONS_DIR / comparison_id / filename, filename)


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
