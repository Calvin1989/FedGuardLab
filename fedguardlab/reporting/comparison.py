import csv
import json
import uuid
from datetime import UTC, datetime
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


def build_comparison_artifacts(
    comparison_id: str,
    comparison_dir: Path | None = None,
    api_base_url: str = "http://127.0.0.1:8000",
) -> dict[str, str]:
    """Return local artifact paths and public URLs for a comparison."""
    if comparison_dir is None:
        comparison_dir = COMPARISONS_DIR / comparison_id

    return {
        "comparison_html": str(comparison_dir / "comparison.html"),
        "comparison_csv": str(comparison_dir / "comparison.csv"),
        "comparison_json": str(comparison_dir / "comparison.json"),
        **build_comparison_artifact_urls(comparison_id, api_base_url),
    }


def _comparison_created_at(
    metadata: dict[str, Any],
    metadata_path: Path,
) -> str:
    created_at = metadata.get("created_at")
    if isinstance(created_at, str) and created_at:
        return created_at

    try:
        return datetime.fromtimestamp(
            metadata_path.stat().st_mtime,
            UTC,
        ).isoformat()
    except OSError:
        return ""


def _insight_value(insights: dict[str, Any], key: str) -> Any:
    value = insights.get(key)
    if isinstance(value, dict):
        return value.get("value")
    return None


def build_comparison_summary(
    comparison_id: str,
    metadata: dict[str, Any],
    metadata_path: Path,
    api_base_url: str = "http://127.0.0.1:8000",
) -> dict[str, Any]:
    """Build a compact summary for comparison history views."""
    comparison_dir = metadata_path.parent
    experiments = metadata.get("experiments", [])
    if not isinstance(experiments, list):
        experiments = []
    job_ids = metadata.get("job_ids", [])
    if not isinstance(job_ids, list):
        job_ids = []
    insights = metadata.get("insights", {})
    if not isinstance(insights, dict):
        insights = {}

    return {
        "comparison_id": comparison_id,
        "title": metadata.get("title", ""),
        "created_at": _comparison_created_at(metadata, metadata_path),
        "job_ids": job_ids,
        "job_count": len(job_ids) if job_ids else len(experiments),
        "best_accuracy": _insight_value(insights, "best_accuracy"),
        "lowest_loss": _insight_value(insights, "lowest_loss"),
        "lowest_asr": _insight_value(insights, "lowest_asr"),
        "has_report": (comparison_dir / "comparison.html").exists(),
        "artifacts": build_comparison_artifacts(
            comparison_id,
            comparison_dir,
            api_base_url,
        ),
        "insights": insights,
    }


def list_comparison_summaries(
    *,
    limit: int | None = None,
    sort: str = "created_at_desc",
    api_base_url: str = "http://127.0.0.1:8000",
) -> list[dict[str, Any]]:
    """Load comparison history from reports/comparisons."""
    if not COMPARISONS_DIR.exists():
        return []

    summaries: list[dict[str, Any]] = []
    for metadata_path in COMPARISONS_DIR.glob("*/comparison.json"):
        comparison_id = metadata_path.parent.name
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if not isinstance(metadata, dict):
            continue
        summaries.append(
            build_comparison_summary(
                comparison_id,
                metadata,
                metadata_path,
                api_base_url,
            )
        )

    reverse = sort == "created_at_desc"
    summaries.sort(
        key=lambda item: item.get("created_at") or "",
        reverse=reverse,
    )

    if limit is not None:
        summaries = summaries[:limit]

    return summaries


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
        "insights_title": "结果洞察",
        "best_accuracy": "最佳准确率",
        "lowest_loss": "最低损失",
        "lowest_asr": "最低 ASR",
        "recommended": "推荐实验",
        "tradeoff": "权衡分析",
        "risk_hint": "风险提示",
        "no_insights": "暂无洞察数据",
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
        "insights_title": "Result Insights",
        "best_accuracy": "Best Accuracy",
        "lowest_loss": "Lowest Loss",
        "lowest_asr": "Lowest ASR",
        "recommended": "Recommended",
        "tradeoff": "Trade-off",
        "risk_hint": "Risk Hint",
        "no_insights": "No insights available",
    },
}


def normalize_comparison_lang(lang):
    if lang in COMPARISON_LABELS:
        return lang
    return "zh"


def compute_comparison_insights(
    experiments: list[dict[str, Any]],
    lang: str = "zh",
) -> dict[str, Any]:
    """Compute result insights from a list of experiment summaries.

    Each experiment dict is expected to have: job_id, experiment_name,
    final_accuracy, final_loss, final_asr.
    Returns a dict with best_accuracy, lowest_loss, lowest_asr, winner,
    tradeoff_summary, risk_hint.
    """
    if not experiments:
        return {}

    def _coerce_metric_value(value: Any) -> float | None:
        """Return a numeric metric value, or None when it is missing."""
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _find_best(
        key: str,
        *,
        reverse: bool = True,
        allow_zero: bool = False,
    ) -> dict[str, Any] | None:
        """Find the experiment with the best value for *key*.

        reverse=True means higher is better (accuracy);
        reverse=False means lower is better (loss, asr).

        Some legacy summaries used 0 as a fallback for missing metrics,
        so zero values remain ignored by default. ASR is different: a
        recorded ASR of 0 is a valid and important result, so callers can
        opt in with allow_zero=True.
        """
        valid: list[tuple[dict[str, Any], float]] = []
        for experiment in experiments:
            value = _coerce_metric_value(experiment.get(key))
            if value is None:
                continue
            if not allow_zero and value == 0:
                continue
            valid.append((experiment, value))

        if not valid:
            return None

        best, value = sorted(
            valid, key=lambda item: item[1], reverse=reverse
        )[0]
        return {
            "job_id": best.get("job_id", ""),
            "value": value,
            "experiment_name": best.get("experiment_name", ""),
        }

    best_acc = _find_best("final_accuracy", reverse=True)
    lowest_loss = _find_best("final_loss", reverse=False)
    lowest_asr = _find_best(
        "final_asr", reverse=False, allow_zero=True
    )

    # Winner: best accuracy; tie-break by lower loss.
    winner = None
    winner_reason = ""
    if best_acc:
        winner = best_acc.copy()
        if lang == "zh":
            winner_reason = (
                f"准确率最高（{best_acc['value']:.4f}）"
            )
        else:
            winner_reason = (
                f"Highest accuracy ({best_acc['value']:.4f})"
            )
        # Tie-break: if another job has similar accuracy but lower loss
        if lowest_loss and lowest_loss["job_id"] != best_acc["job_id"]:
            acc_diff = abs(
                best_acc["value"] - next(
                    e["final_accuracy"]
                    for e in experiments
                    if e["job_id"] == lowest_loss["job_id"]
                )
            )
            if acc_diff < 0.01:
                winner = lowest_loss.copy()
                if lang == "zh":
                    winner_reason = (
                        f"准确率与最高相近，损失更低"
                        f"（{lowest_loss['value']:.4f}）"
                    )
                else:
                    winner_reason = (
                        f"Similar accuracy but lower loss "
                        f"({lowest_loss['value']:.4f})"
                    )

    # Trade-off summary
    tradeoff_summary = ""
    if len(experiments) >= 2 and best_acc and lowest_loss:
        if best_acc["job_id"] != lowest_loss["job_id"]:
            if lang == "zh":
                tradeoff_summary = (
                    f"{best_acc['experiment_name']} 准确率最高，"
                    f"{lowest_loss['experiment_name']} 损失最低。"
                )
            else:
                tradeoff_summary = (
                    f"{best_acc['experiment_name']} has the highest accuracy, "
                    f"{lowest_loss['experiment_name']} has the lowest loss."
                )
        else:
            if lang == "zh":
                tradeoff_summary = (
                    f"{best_acc['experiment_name']} 同时具有最高准确率和最低损失。"
                )
            else:
                tradeoff_summary = (
                    f"{best_acc['experiment_name']} has both the highest "
                    f"accuracy and lowest loss."
                )

    # Risk hint: check for high ASR
    risk_hint = ""
    high_asr_jobs = [
        e for e in experiments
        if e.get("final_asr") is not None and e.get("final_asr", 0) > 0.5
    ]
    if high_asr_jobs:
        names = ", ".join(
            e.get("experiment_name", e.get("job_id", ""))
            for e in high_asr_jobs
        )
        if lang == "zh":
            risk_hint = (
                f"以下实验 ASR 较高（>0.5），表明对目标攻击抵抗力较弱：{names}。"
            )
        else:
            risk_hint = (
                f"The following experiments have high ASR (>0.5), "
                f"indicating weaker resistance to the target attack: {names}."
            )

    return {
        "best_accuracy": best_acc,
        "lowest_loss": lowest_loss,
        "lowest_asr": lowest_asr,
        "winner": winner,
        "winner_reason": winner_reason,
        "tradeoff_summary": tradeoff_summary,
        "risk_hint": risk_hint,
    }


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
        "final_asr": final_metric.get("attack_success_rate"),
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
    insights = compute_comparison_insights(experiments, lang=lang)

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
        insights=insights,
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
                "created_at": datetime.now(UTC).isoformat(),
                "job_ids": job_ids,
                "experiments": experiments,
                "compared_jobs": compared_jobs,
                "insights": insights,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    generate_comparison_csv(experiments, output_dir)

    return output_path
