import csv
import json
from pathlib import Path
from typing import Any, Dict, List

from jinja2 import Environment, FileSystemLoader, select_autoescape


TEMPLATE_DIR = Path(__file__).parent / "templates"


def generate_metrics_csv(metrics: list[dict], output_dir: Path) -> Path:
    output_path = output_dir / "metrics.csv"

    if len(metrics) == 0:
        output_path.write_text("", encoding="utf-8")
        return output_path

    fieldnames = sorted(
        {
            key
            for metric in metrics
            for key in metric.keys()
            if key not in {"client_label_summary", "clean_client_label_summary"}
        }
    )

    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()

        for metric in metrics:
            row = {
                key: metric.get(key, "")
                for key in fieldnames
            }
            writer.writerow(row)

    return output_path


def generate_markdown_report(
    job_id: str,
    job: Dict[str, Any],
    output_dir: Path,
) -> Path:
    config = job["config"]
    metrics = job["metrics"]
    final_metric = metrics[-1] if metrics else {}

    output_path = output_dir / "report.md"

    lines = [
        f"# FedGuardLab Experiment Report",
        "",
        f"**Experiment:** {config['experiment']['name']}",
        "",
        f"**Job ID:** `{job_id}`",
        "",
        f"**Status:** {job.get('status', 'unknown')}",
        "",
        "## Final Metrics",
        "",
        "| Metric | Value |",
        "|---|---:|",
        f"| Final Round | {final_metric.get('round', 0)} |",
        f"| Final Accuracy | {final_metric.get('accuracy', 0)} |",
        f"| Final Loss | {final_metric.get('loss', 0)} |",
        f"| Final ASR | {final_metric.get('attack_success_rate', 0)} |",
        "",
        "## Experiment Overview",
        "",
        "| Field | Value |",
        "|---|---|",
        f"| Trainer | {final_metric.get('trainer', 'unknown')} |",
        f"| Mode | {final_metric.get('mode', 'unknown')} |",
        f"| Dataset | {final_metric.get('dataset', 'unknown')} |",
        f"| Partition | {final_metric.get('partition', 'unknown')} |",
        f"| Clients | {final_metric.get('num_clients', 0)} |",
        f"| Malicious Clients | {final_metric.get('malicious_clients', 0)} |",
        f"| Aggregation | {final_metric.get('aggregation', 'unknown')} |",
        f"| Attack | {final_metric.get('attack', 'unknown')} |",
        f"| Defense | {final_metric.get('defense', 'unknown')} |",
        f"| Device | {final_metric.get('device', 'unknown')} |",
        "",
        "## Metrics",
        "",
        "| Round | Accuracy | Loss | ASR |",
        "|---:|---:|---:|---:|",
    ]

    for metric in metrics:
        lines.append(
            "| {round} | {accuracy} | {loss} | {asr} |".format(
                round=metric.get("round", ""),
                accuracy=metric.get("accuracy", ""),
                loss=metric.get("loss", ""),
                asr=metric.get("attack_success_rate", ""),
            )
        )

    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def generate_html_report(
    job_id: str,
    job: Dict[str, Any],
    output_dir: Path,
) -> Path:
    metrics: List[Dict[str, Any]] = job.get("metrics", [])

    if metrics:
        final_metric = metrics[-1]
    else:
        final_metric = {
            "round": 0,
            "accuracy": 0,
            "loss": 0,
            "attack_success_rate": 0,
            "trainer": "unknown",
            "mode": "unknown",
            "dataset": "unknown",
            "partition": "unknown",
            "num_clients": 0,
            "malicious_clients": 0,
            "aggregation": "unknown",
            "attack": "unknown",
            "defense": "unknown",
            "device": "unknown",
        }

    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )

    template = env.get_template("report.html.j2")

    html = template.render(
        job_id=job_id,
        status=job.get("status", "unknown"),
        experiment_name=job["config"]["experiment"]["name"],
        config_json=json.dumps(job["config"], indent=2, ensure_ascii=False),
        metrics=metrics,
        final_metric=final_metric,
    )

    output_path = output_dir / "report.html"
    output_path.write_text(html, encoding="utf-8")

    generate_metrics_csv(metrics, output_dir)
    generate_markdown_report(job_id, job, output_dir)

    return output_path
