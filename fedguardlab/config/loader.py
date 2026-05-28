from pathlib import Path

import yaml

from fedguardlab.config.schema import FedGuardConfig


def load_config(path: str | Path) -> FedGuardConfig:
    with open(path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    return FedGuardConfig(**raw)
