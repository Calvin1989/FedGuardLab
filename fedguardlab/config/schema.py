from typing import List, Optional

from pydantic import BaseModel, Field


class ExperimentConfig(BaseModel):
    name: str
    seed: int = 42
    rounds: int = 20


class TrainingConfig(BaseModel):
    mode: str = "simulated"
    local_epochs: int = 1
    batch_size: int = 64
    learning_rate: float = 0.01
    max_train_samples: Optional[int] = None
    max_test_samples: Optional[int] = None


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
    poison_fraction: float = 1.0
    trigger_size: int = 4
    trigger_value: float = 2.8


class DefenseConfig(BaseModel):
    type: str = "none"
    trim_ratio: float = 0.2
    krum_malicious_clients: int | None = None


class FedGuardConfig(BaseModel):
    experiment: ExperimentConfig
    training: TrainingConfig = Field(default_factory=TrainingConfig)
    federated: FederatedConfig
    dataset: DatasetConfig
    attack: AttackConfig
    defense: DefenseConfig
    metrics: List[str]
