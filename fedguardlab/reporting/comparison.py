import json
import uuid
from pathlib import Path
from typing import Any, Dict, List

from jinja2 import Environment, FileSystemLoader, select_autoescape


TEMPLATE_DIR = Path(__file__).parent / "templates"
JOBS_DIR = Path("reports/jobs")
COMPARISONS_DIR = Path("reports/comparisons")


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


def generate_comparison_report(
    job_ids: List[str],
    title: str = "Robust Aggregation Comparison",
) -> Path:
    if len(job_ids) == 0:
        raise ValueError("job_ids cannot be empty")

    comparison_id = str(uuid.uuid4())
    output_dir = COMPARISONS_DIR / comparison_id
    output_dir.mkdir(parents=True, exist_ok=True)

    experiments = [load_job_summary(job_id) for job_id in job_ids]

    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )

    template = env.get_template("comparison.html.j2")

    html = template.render(
        comparison_id=comparison_id,
        title=title,
        experiments=experiments,
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
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    return output_path
