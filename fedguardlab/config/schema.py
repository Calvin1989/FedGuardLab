from pydantic import BaseModel
from typing import List, Optional


class ExperimentConfig(BaseModel):
    name: str
    seed: int = 42
    rounds: int = 20


class FederatedConfig(BaseModel):
    num_clients: int = 10
    malicious_clients: int = 0
    aggregation: str = "fedavg"


class DatasetConfig(BaseModel):
    name: str = "mnist"
    partition: str = "iid"
    alpha: Optional[float] = None


class AttackConfig(BaseModel):
    type: str = "none"
    source_label: Optional[int] = None
    target_label: Optional[int] = None


class DefenseConfig(BaseModel):
    type: str = "none"


class FedGuardConfig(BaseModel):
    experiment: ExperimentConfig
    federated: FederatedConfig
    dataset: DatasetConfig
    attack: AttackConfig
    defense: DefenseConfig
    metrics: List[str]
