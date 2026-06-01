import csv
import json
import uuid
from pathlib import Path
from typing import Any, Dict, List

from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATE_DIR = Path(__file__).parent / "templates"
JOBS_DIR = Path("reports/jobs")
COMPARISONS_DIR = Path("reports/comparisons")


def build_comparison_artifact_urls(
    comparison_id: str,
    api_base_url: str = "http://127.0.0.1:8000",
) -> dict[str, str]:
    base_url = api_base_url.rstrip("/")
    comparison_url = f"{base_url}/comparisons/{comparison_id}"
    return {
        "comparison_html_url": comparison_url,
        "comparison_csv_url": f"{comparison_url}/comparison.csv",
        "comparison_json_url": f"{comparison_url}/comparison.json",
    }


COMPARISON_LABELS = {
    "zh": {
        "title": "FedGuardLab 对比报告",
        "comparison_id": "对比 ID",
        "num_experiments": "实验数量",
        "final_metrics": "最终指标",
        "experiment": "实验",
        "aggregation": "聚合方式",
        "defense": "防御",
        "attack": "攻击",
        "final_accuracy": "最终准确率",
        "final_loss": "最终损失",
        "final_asr": "最终 ASR",
        "job_id": "任务 ID",
        "report": "报告",
        "open": "查看",
        "note": (
            "较低的 ASR 通常表示对目标攻击有更强的抵抗力。"
            "当前结果用于轻量演示，不作为正式基准测试。"
        ),
        "exported_files": "导出文件",
        "export_comparison_html": "对比 HTML 报告",
        "export_comparison_csv": "对比 CSV",
        "export_comparison_json": "对比 JSON",
        "and": "和",
        "compared_jobs": "参与实验",
        "config_path": "配置路径",
        "status": "状态",
        "created_at": "创建时间",
        "finished_at": "完成时间",
        "report_link": "报告",
        "view_report": "查看报告",
    },
    "en": {
        "title": "FedGuardLab Comparison Report",
        "comparison_id": "Comparison ID",
        "num_experiments": "Number of Experiments",
        "final_metrics": "Final Metrics",
        "experiment": "Experiment",
        "aggregation": "Aggregation",
        "defense": "Defense",
        "attack": "Attack",
        "final_accuracy": "Final Accuracy",
        "final_loss": "Final Loss",
        "final_asr": "Final ASR",
        "job_id": "Job ID",
        "report": "Report",
        "open": "Open",
        "note": (
            "Lower ASR usually indicates stronger resistance "
            "to the configured target attack. Current results "
            "are intended for lightweight demonstration, "
            "not formal benchmarking."
        ),
        "exported_files": "Exported files",
        "export_comparison_html": "Comparison HTML Report",
        "export_comparison_csv": "Comparison CSV",
        "export_comparison_json": "Comparison JSON",
        "and": "and",
        "compared_jobs": "Compared Jobs",
        "config_path": "Config Path",
        "status": "Status",
        "created_at": "Created At",
        "finished_at": "Finished At",
        "report_link": "Report",
        "view_report": "View Report",
    },
}


def normalize_comparison_lang(lang):
    if lang in COMPARISON_LABELS:
        return lang
    return "zh"


def generate_comparison_csv(
    experiments: List[Dict[str, Any]],
    output_dir: Path,
) -> Path:
    output_path = output_dir / "comparison.csv"

    fieldnames = [
        "experiment_name",
        "aggregation",
        "defense",
        "attack",
        "final_accuracy",
        "final_loss",
        "final_asr",
        "job_id",
    ]

    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()

        for experiment in experiments:
            writer.writerow(
                {
                    key: experiment.get(key, "")
                    for key in fieldnames
                }
            )

    return output_path


def load_job_summary(job_id: str) -> Dict[str, Any]:
    job_dir = JOBS_DIR / job_id
    config_path = job_dir / "config.json"
    metrics_path = job_dir / "metrics.json"

    if not config_path.exists():
        raise FileNotFoundError(f"config.json not found for job_id={job_id}")

    if not metrics_path.exists():
        raise FileNotFoundError(f"metrics.json not found for job_id={job_id}")

    config = json.loads(config_path.read_text(encoding="utf-8"))
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))

    if len(metrics) == 0:
        raise ValueError(f"metrics.json is empty for job_id={job_id}")

    final_metric = metrics[-1]

    return {
        "job_id": job_id,
        "experiment_name": config["experiment"]["name"],
        "aggregation": config["federated"]["aggregation"],
        "defense": config["defense"]["type"],
        "attack": config["attack"]["type"],
        "final_accuracy": final_metric.get("accuracy", 0),
        "final_loss": final_metric.get("loss", 0),
        "final_asr": final_metric.get("attack_success_rate", 0),
    }


def load_job_metadata(job_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """Load job metadata from the persisted JobStore index.

    Returns a dict keyed by job_id. Each value contains
    config_path, status, created_at, finished_at.
    Falls back gracefully if the index file is missing.
    """
    index_path = JOBS_DIR / "index.json"
    result: Dict[str, Dict[str, Any]] = {}

    try:
        entries = json.loads(index_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return result

    if not isinstance(entries, list):
        return result

    for entry in entries:
        if not isinstance(entry, dict):
            continue
        jid = entry.get("job_id")
        if jid in job_ids:
            result[jid] = {
                "config_path": entry.get("config_path", ""),
                "status": entry.get("status", ""),
                "created_at": entry.get("created_at", ""),
                "finished_at": entry.get("finished_at"),
            }

    return result


def generate_comparison_report(
    job_ids: List[str],
    title: str = "Robust Aggregation Comparison",
    api_base_url: str = "http://127.0.0.1:8000",
    lang: str = "zh",
) -> Path:
    if len(job_ids) == 0:
        raise ValueError("job_ids cannot be empty")

    comparison_id = str(uuid.uuid4())
    output_dir = COMPARISONS_DIR / comparison_id
    output_dir.mkdir(parents=True, exist_ok=True)

    experiments = [load_job_summary(job_id) for job_id in job_ids]
    job_metadata = load_job_metadata(job_ids)

    compared_jobs = []
    for exp in experiments:
        jid = exp["job_id"]
        meta = job_metadata.get(jid, {})
        compared_jobs.append({
            "job_id": jid,
            "experiment_name": exp.get("experiment_name", ""),
            "config_path": meta.get("config_path", ""),
            "status": meta.get("status", ""),
            "created_at": meta.get("created_at", ""),
            "finished_at": meta.get("finished_at"),
        })

    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )

    template = env.get_template("comparison.html.j2")

    lang = normalize_comparison_lang(lang)
    labels = COMPARISON_LABELS[lang]

    html = template.render(
        lang=lang,
        labels=labels,
        comparison_id=comparison_id,
        title=title,
        experiments=experiments,
        compared_jobs=compared_jobs,
        api_base_url=api_base_url,
        artifact_urls=build_comparison_artifact_urls(comparison_id, api_base_url),
    )

    output_path = output_dir / "comparison.html"
    output_path.write_text(html, encoding="utf-8")

    metadata_path = output_dir / "comparison.json"
    metadata_path.write_text(
        json.dumps(
            {
                "comparison_id": comparison_id,
                "title": title,
                "job_ids": job_ids,
                "experiments": experiments,
                "compared_jobs": compared_jobs,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    generate_comparison_csv(experiments, output_dir)

    return output_path
