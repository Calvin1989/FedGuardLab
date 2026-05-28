import json
from pathlib import Path
from typing import Any, Dict, List

from jinja2 import Environment, FileSystemLoader, select_autoescape


TEMPLATE_DIR = Path(__file__).parent / "templates"


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

    return output_path
