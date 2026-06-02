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
from fedguardlab.config.schema import FedGuardConfig
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


_AGGREGATION_EXPLANATIONS = {
    "zh": {
        "fedavg": (
            "FedAvg：标准联邦平均，对各客户端模型权重取加权平均。"
        ),
        "median": (
            "Median：中位数聚合，对每个参数取中位数，"
            "抗异常值能力较强。"
        ),
        "trimmed_mean": (
            "Trimmed Mean：截断均值聚合，"
            "去除两端极值后取均值。"
        ),
        "krum": (
            "Krum：选择距离最近的模型更新，"
            "对恶意更新有较强鲁棒性。"
        ),
    },
    "en": {
        "fedavg": (
            "FedAvg: standard federated averaging "
            "of client model weights."
        ),
        "median": (
            "Median: takes the element-wise median "
            "across clients, robust to outliers."
        ),
        "trimmed_mean": (
            "Trimmed Mean: trims extreme values "
            "before averaging."
        ),
        "krum": (
            "Krum: selects the model update with "
            "the smallest neighbor distance, "
            "robust to malicious updates."
        ),
    },
}

_ATTACK_EXPLANATIONS = {
    "zh": {
        "none": "无攻击：正常联邦学习训练。",
        "label_flipping": (
            "标签翻转攻击：恶意客户端将源标签替换为目标标签，"
            "破坏模型分类能力。"
        ),
        "backdoor": (
            "后门攻击：恶意客户端在训练数据中注入触发模式，"
            "使模型对特定输入产生错误输出。"
        ),
    },
    "en": {
        "none": "No attack: standard FL training.",
        "label_flipping": (
            "Label Flipping: malicious clients replace "
            "source labels with target labels, "
            "degrading classification."
        ),
        "backdoor": (
            "Backdoor: malicious clients inject trigger "
            "patterns into training data, causing "
            "misclassification on specific inputs."
        ),
    },
}

_DEFENSE_EXPLANATIONS = {
    "zh": {
        "none": "无防御：不使用鲁棒聚合防御。",
        "median": "Median 防御：使用中位数聚合抵御异常更新。",
        "trimmed_mean": (
            "Trimmed Mean 防御：使用截断均值聚合抵御异常更新。"
        ),
        "krum": (
            "Krum 防御：使用 Krum 算法选择最安全的模型更新。"
        ),
    },
    "en": {
        "none": "No defense: no robust aggregation defense.",
        "median": (
            "Median defense: uses median aggregation "
            "to resist anomalous updates."
        ),
        "trimmed_mean": (
            "Trimmed Mean defense: uses trimmed mean "
            "aggregation to resist anomalous updates."
        ),
        "krum": (
            "Krum defense: uses the Krum algorithm "
            "to select the safest model update."
        ),
    },
}

_PARTITION_EXPLANATIONS = {
    "zh": {
        "iid": (
            "IID：数据在各客户端间均匀分布（独立同分布）。"
        ),
        "dirichlet": (
            "Dirichlet：数据按 Dirichlet 分布划分，"
            "模拟非独立同分布场景。"
        ),
    },
    "en": {
        "iid": (
            "IID: data is uniformly distributed across "
            "clients (independent and identically "
            "distributed)."
        ),
        "dirichlet": (
            "Dirichlet: data is partitioned using a "
            "Dirichlet distribution, simulating "
            "non-IID scenarios."
        ),
    },
}


def _compute_risk_level(config: FedGuardConfig) -> str:
    attack = config.attack.type
    defense = config.defense.type

    if attack == "none":
        return "none"
    if attack == "label_flipping":
        return "low" if defense != "none" else "medium"
    if attack == "backdoor":
        return "medium" if defense != "none" else "high"
    return "none"


def _compute_recommended_use(config: FedGuardConfig, lang: str = "zh") -> str:
    attack = config.attack.type
    defense = config.defense.type

    if attack == "none" and defense == "none":
        return {
            "zh": "基线实验：验证联邦学习基本流程",
            "en": "Baseline: validate basic federated learning workflow",
        }[lang]
    if attack != "none" and defense == "none":
        return {
            "zh": "攻击演示：展示攻击对联邦学习的影响",
            "en": "Attack demo: demonstrate the impact of attacks on FL",
        }[lang]
    if attack != "none" and defense != "none":
        return {
            "zh": "防御对比：对比攻防效果",
            "en": "Defense comparison: compare attack-defense outcomes",
        }[lang]
    return {
        "zh": "鲁棒聚合演示：展示防御聚合方法",
        "en": "Robust aggregation demo: demonstrate defense aggregation methods",
    }[lang]


def _get_explanation(
    group: Dict[str, Dict[str, str]], lang: str, key: str
) -> str:
    lang_map = group.get(lang, group.get("zh", {}))
    return lang_map.get(key, key)


def compute_config_preview(
    config: FedGuardConfig, lang: str = "zh"
) -> Dict[str, Any]:
    """Compute a lightweight preview/explanation for a config."""
    agg = config.federated.aggregation
    attack = config.attack.type
    defense = config.defense.type
    partition = config.dataset.partition

    attack_desc = attack
    if attack == "label_flipping":
        src = config.attack.source_label
        tgt = config.attack.target_label
        src_str = str(src) if src is not None else "?"
        tgt_str = str(tgt) if tgt is not None else "?"
        if lang == "zh":
            attack_desc = f"标签翻转 ({src_str}→{tgt_str})"
        else:
            attack_desc = (
                f"Label Flipping ({src_str}→{tgt_str})"
            )
    elif attack == "backdoor":
        tgt = config.attack.target_label
        if lang == "zh":
            attack_desc = f"后门攻击 (目标标签={tgt})"
        else:
            attack_desc = f"Backdoor (target={tgt})"

    partition_desc = partition
    if partition == "dirichlet" and config.dataset.alpha is not None:
        partition_desc = f"Dirichlet (α={config.dataset.alpha})"

    explanations = {
        "aggregation": _get_explanation(
            _AGGREGATION_EXPLANATIONS, lang, agg
        ),
        "attack": _get_explanation(
            _ATTACK_EXPLANATIONS, lang, attack
        ),
        "defense": _get_explanation(
            _DEFENSE_EXPLANATIONS, lang, defense
        ),
        "partition": _get_explanation(
            _PARTITION_EXPLANATIONS, lang, partition
        ),
    }

    none_label = "无" if lang == "zh" else "None"
    defense_display = (
        defense.replace("_", " ").title()
        if defense != "none"
        else none_label
    )

    return {
        "dataset": config.dataset.name.upper(),
        "partition": partition_desc,
        "aggregation": agg.replace("_", " ").title(),
        "attack": attack_desc,
        "defense": defense_display,
        "rounds": config.experiment.rounds,
        "clients": config.federated.num_clients,
        "malicious_clients": config.federated.malicious_clients,
        "local_epochs": config.training.local_epochs,
        "batch_size": config.training.batch_size,
        "learning_rate": config.training.learning_rate,
        "risk_level": _compute_risk_level(config),
        "recommended_use": _compute_recommended_use(
            config, lang
        ),
        "explanations": explanations,
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
        "events": job.events,
        "archived": job.archived,
        "archived_at": job.archived_at,
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

        preview = compute_config_preview(config, lang="zh")

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
                "preview": preview,
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
    JOB_STORE.add_event(job_id, {"type": "created", "message": "Job created"})

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
VALID_ARCHIVED_FILTERS = {"active", "archived", "all"}
ARCHIVABLE_JOB_STATUSES = {"finished", "failed", "cancelled"}


@app.get("/jobs")
def list_jobs(
    status: str | None = None,
    limit: int | None = None,
    sort: str = "created_at_desc",
    archived: str = "active",
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

    if archived not in VALID_ARCHIVED_FILTERS:
        raise HTTPException(
            status_code=400,
            detail=f"invalid archived filter: {archived}",
        )

    if limit is not None and limit <= 0:
        raise HTTPException(
            status_code=400,
            detail="limit must be greater than 0",
        )

    jobs = JOB_STORE.list()

    if archived == "active":
        jobs = [j for j in jobs if not j.archived]
    elif archived == "archived":
        jobs = [j for j in jobs if j.archived]

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
    JOB_STORE.add_event(
        job_id, {"type": "cancelled", "message": "Job cancelled by user"}
    )
    await EVENT_HUB.publish(job_id, {"event": "cancelled"})

    return {
        "job_id": job_id,
        "status": "cancelled",
    }


@app.post("/jobs/{job_id}/archive")
def archive_job(job_id: str):
    validate_job_id(job_id)

    job = JOB_STORE.get(job_id)

    if job is None:
        raise HTTPException(status_code=404, detail="job not found")

    if job.status not in ARCHIVABLE_JOB_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"cannot archive job with status {job.status}",
        )

    was_archived = job.archived
    JOB_STORE.archive(job_id)
    if not was_archived:
        JOB_STORE.add_event(
            job_id,
            {"type": "archived", "message": "Job archived"},
        )

    updated = JOB_STORE.get(job_id)
    assert updated is not None
    return _job_summary(updated)


@app.post("/jobs/{job_id}/restore")
def restore_job(job_id: str):
    validate_job_id(job_id)

    job = JOB_STORE.get(job_id)

    if job is None:
        raise HTTPException(status_code=404, detail="job not found")

    was_archived = job.archived or job.archived_at is not None
    JOB_STORE.restore(job_id)
    if was_archived:
        JOB_STORE.add_event(
            job_id,
            {"type": "restored", "message": "Job restored"},
        )

    updated = JOB_STORE.get(job_id)
    assert updated is not None
    return _job_summary(updated)


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


def _ensure_comparison_jobs_available(job_ids: list[str]) -> None:
    for job_id in job_ids:
        validate_job_id(job_id)
        job = JOB_STORE.get(job_id)
        if job is not None and job.archived:
            raise HTTPException(
                status_code=400,
                detail=f"cannot compare archived job: {job_id}",
            )


@app.post("/comparisons")
def create_comparison(request: ComparisonRequest):
    _ensure_comparison_jobs_available(request.job_ids)

    try:
        output_path = generate_comparison_report(
            job_ids=request.job_ids,
            title=request.title,
            api_base_url="http://127.0.0.1:8000",
        )

        comparison_id = output_path.parent.name

        # Read insights from the generated comparison.json.
        insights = {}
        comparison_json_path = output_path.parent / "comparison.json"
        if comparison_json_path.exists():
            try:
                meta = json.loads(
                    comparison_json_path.read_text(encoding="utf-8")
                )
                insights = meta.get("insights", {})
            except (OSError, json.JSONDecodeError):
                pass

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
            "insights": insights,
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
