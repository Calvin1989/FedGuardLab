from typing import Literal

from pydantic import BaseModel, Field, model_validator


TrainingMode = Literal["simulated", "real"]
AggregationType = Literal["fedavg", "median", "trimmed_mean", "krum"]
DatasetName = Literal["mnist"]
PartitionType = Literal["iid", "dirichlet"]
AttackType = Literal["none", "label_flipping", "backdoor"]
DefenseType = Literal["none", "median", "trimmed_mean", "krum"]


class ExperimentConfig(BaseModel):
    name: str
    seed: int = 42
    rounds: int = Field(default=20, ge=1)


class TrainingConfig(BaseModel):
    mode: TrainingMode = "simulated"
    local_epochs: int = Field(default=1, ge=1)
    batch_size: int = Field(default=64, ge=1)
    learning_rate: float = Field(default=0.01, gt=0)
    max_train_samples: int | None = Field(default=None, ge=1)
    max_test_samples: int | None = Field(default=None, ge=1)


class FederatedConfig(BaseModel):
    num_clients: int = Field(default=10, ge=1)
    malicious_clients: int = Field(default=0, ge=0)
    aggregation: AggregationType = "fedavg"


class DatasetConfig(BaseModel):
    name: DatasetName = "mnist"
    partition: PartitionType = "iid"
    alpha: float | None = None


class AttackConfig(BaseModel):
    type: AttackType = "none"
    source_label: int | None = Field(default=None, ge=0, le=9)
    target_label: int | None = Field(default=None, ge=0, le=9)
    poison_fraction: float = Field(default=1.0, ge=0.0, le=1.0)
    trigger_size: int = Field(default=4, ge=1)
    trigger_value: float = 2.8


class DefenseConfig(BaseModel):
    type: DefenseType = "none"
    trim_ratio: float = Field(default=0.2, ge=0.0, lt=0.5)
    krum_malicious_clients: int | None = Field(default=None, ge=0)


class FedGuardConfig(BaseModel):
    experiment: ExperimentConfig
    training: TrainingConfig = Field(default_factory=TrainingConfig)
    federated: FederatedConfig
    dataset: DatasetConfig
    attack: AttackConfig
    defense: DefenseConfig = Field(default_factory=DefenseConfig)
    metrics: list[str] = Field(default_factory=lambda: ["accuracy", "loss"])

    @model_validator(mode="after")
    def validate_semantics(self) -> "FedGuardConfig":
        if self.federated.malicious_clients > self.federated.num_clients:
            raise ValueError("malicious_clients cannot exceed num_clients")

        if self.dataset.partition == "dirichlet" and self.dataset.alpha is None:
            raise ValueError("dataset.alpha is required for Dirichlet partition")

        if self.dataset.alpha is not None and self.dataset.alpha <= 0:
            raise ValueError("dataset.alpha must be positive")

        if self.attack.type == "label_flipping":
            if self.attack.source_label is None or self.attack.target_label is None:
                raise ValueError(
                    "source_label and target_label are required for label_flipping"
                )
            if self.attack.source_label == self.attack.target_label:
                raise ValueError("source_label and target_label must be different")

        if self.attack.type == "backdoor" and self.attack.target_label is None:
            raise ValueError("target_label is required for backdoor attack")

        if self.federated.aggregation == "fedavg":
            if self.defense.type != "none":
                raise ValueError("defense.type must be none when aggregation is fedavg")
        else:
            if self.defense.type != self.federated.aggregation:
                raise ValueError(
                    "defense.type must match federated.aggregation for robust defenses"
                )

        if self.federated.aggregation == "krum":
            krum_malicious_clients = (
                self.defense.krum_malicious_clients
                if self.defense.krum_malicious_clients is not None
                else self.federated.malicious_clients
            )
            if self.federated.num_clients <= 2 * krum_malicious_clients + 2:
                raise ValueError(
                    "Krum requires num_clients > 2 * krum_malicious_clients + 2"
                )

        return self