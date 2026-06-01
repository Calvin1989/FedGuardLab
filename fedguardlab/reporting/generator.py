import csv
import json
from pathlib import Path
from typing import Any, Dict, List

from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATE_DIR = Path(__file__).parent / "templates"

REPORT_LABELS = {
    "zh": {
        "title": "FedGuardLab 实验报告",
        "job_id": "任务 ID",
        "status": "状态",
        "final_round": "最终轮次",
        "final_accuracy": "最终准确率",
        "final_loss": "最终损失",
        "final_asr": "最终攻击成功率",
        "overview": "实验概览",
        "trainer": "训练器",
        "mode": "模式",
        "dataset": "数据集",
        "partition": "数据划分",
        "clients": "客户端数量",
        "malicious_clients": "恶意客户端",
        "aggregation": "聚合方式",
        "attack": "攻击类型",
        "defense": "防御方式",
        "device": "设备",
        "client_distribution": "客户端标签分布",
        "client_id": "客户端 ID",
        "samples": "样本数",
        "label_counts": "标签分布",
        "exported_files": "导出文件",
        "export_config": "实验配置",
        "export_metrics_json": "逐轮原始指标",
        "export_metrics_csv": "可导入表格的指标",
        "export_report_md": "Markdown 实验摘要",
        "config_details": "实验配置详情",
        "metrics": "指标",
        "round": "轮次",
        "accuracy": "准确率",
        "loss": "损失",
        "asr": "攻击成功率",
    },
    "en": {
        "title": "FedGuardLab Experiment Report",
        "job_id": "Job ID",
        "status": "Status",
        "final_round": "Final Round",
        "final_accuracy": "Final Accuracy",
        "final_loss": "Final Loss",
        "final_asr": "Final ASR",
        "overview": "Experiment Overview",
        "trainer": "Trainer",
        "mode": "Mode",
        "dataset": "Dataset",
        "partition": "Partition",
        "clients": "Clients",
        "malicious_clients": "Malicious Clients",
        "aggregation": "Aggregation",
        "attack": "Attack",
        "defense": "Defense",
        "device": "Device",
        "client_distribution": "Client Label Distribution",
        "client_id": "Client ID",
        "samples": "Samples",
        "label_counts": "Label Counts",
        "exported_files": "Exported Files",
        "export_config": "Experiment configuration",
        "export_metrics_json": "Raw round-by-round metrics",
        "export_metrics_csv": "Spreadsheet-ready metrics",
        "export_report_md": "Markdown experiment summary",
        "config_details": "Experiment Configuration",
        "metrics": "Metrics",
        "round": "Round",
        "accuracy": "Accuracy",
        "loss": "Loss",
        "asr": "Attack Success Rate",
    },
}


def normalize_report_lang(lang):
    if lang in REPORT_LABELS:
        return lang
    return "zh"


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
        "# FedGuardLab Experiment Report",
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
    lang: str = "zh",
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

    lang = normalize_report_lang(lang)
    labels = REPORT_LABELS[lang]

    html = template.render(
        lang=lang,
        labels=labels,
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
