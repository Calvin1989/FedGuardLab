import random
from collections import defaultdict
from typing import List, Optional, Tuple

import numpy as np
from torch.utils.data import DataLoader, Dataset, Subset
from torchvision import datasets, transforms


def load_mnist_datasets(
    data_dir: str = "data",
    max_train_samples: Optional[int] = None,
    max_test_samples: Optional[int] = None,
) -> Tuple[Dataset, Dataset]:
    transform = transforms.Compose(
        [
            transforms.ToTensor(),
            transforms.Normalize((0.1307,), (0.3081,)),
        ]
    )

    train_dataset = datasets.MNIST(
        root=data_dir,
        train=True,
        download=True,
        transform=transform,
    )

    test_dataset = datasets.MNIST(
        root=data_dir,
        train=False,
        download=True,
        transform=transform,
    )

    if max_train_samples is not None:
        train_dataset = Subset(train_dataset, list(range(max_train_samples)))

    if max_test_samples is not None:
        test_dataset = Subset(test_dataset, list(range(max_test_samples)))

    return train_dataset, test_dataset


def get_targets(dataset: Dataset) -> np.ndarray:
    if isinstance(dataset, Subset):
        base_targets = get_targets(dataset.dataset)
        return base_targets[np.array(dataset.indices)]

    if hasattr(dataset, "targets"):
        targets = dataset.targets

        if hasattr(targets, "numpy"):
            return targets.numpy()

        return np.array(targets)

    labels = []

    for index in range(len(dataset)):
        _, label = dataset[index]
        labels.append(int(label))

    return np.array(labels)


def iid_partition(
    dataset: Dataset,
    num_clients: int,
    seed: int = 42,
) -> List[Subset]:
    indices = list(range(len(dataset)))
    random.Random(seed).shuffle(indices)

    shard_size = len(indices) // num_clients
    client_subsets = []

    for client_id in range(num_clients):
        start = client_id * shard_size

        if client_id == num_clients - 1:
            end = len(indices)
        else:
            end = start + shard_size

        client_indices = indices[start:end]
        client_subsets.append(Subset(dataset, client_indices))

    return client_subsets


def dirichlet_partition(
    dataset: Dataset,
    num_clients: int,
    alpha: float,
    seed: int = 42,
    min_size: int = 10,
) -> List[Subset]:
    if alpha <= 0:
        raise ValueError("alpha must be positive for Dirichlet partition")

    rng = np.random.default_rng(seed)
    targets = get_targets(dataset)
    num_classes = int(targets.max()) + 1

    while True:
        client_indices = [[] for _ in range(num_clients)]

        for class_id in range(num_classes):
            class_indices = np.where(targets == class_id)[0]
            rng.shuffle(class_indices)

            proportions = rng.dirichlet(np.repeat(alpha, num_clients))
            split_points = (np.cumsum(proportions)[:-1] * len(class_indices)).astype(int)
            class_splits = np.split(class_indices, split_points)

            for client_id, split in enumerate(class_splits):
                client_indices[client_id].extend(split.tolist())

        sizes = [len(indices) for indices in client_indices]

        if min(sizes) >= min_size:
            break

    for indices in client_indices:
        rng.shuffle(indices)

    return [Subset(dataset, indices) for indices in client_indices]


def partition_dataset(
    dataset: Dataset,
    num_clients: int,
    partition: str,
    alpha: Optional[float] = None,
    seed: int = 42,
) -> List[Subset]:
    partition = partition.lower()

    if partition == "iid":
        return iid_partition(dataset, num_clients, seed)

    if partition == "dirichlet":
        if alpha is None:
            raise ValueError("alpha is required for Dirichlet partition")

        return dirichlet_partition(
            dataset=dataset,
            num_clients=num_clients,
            alpha=alpha,
            seed=seed,
        )

    raise ValueError(f"Unsupported partition type: {partition}")


def summarize_client_labels(client_datasets: List[Dataset]) -> List[dict]:
    summaries = []

    for client_id, dataset in enumerate(client_datasets):
        targets = get_targets(dataset)
        label_counts = defaultdict(int)

        for label in targets:
            label_counts[int(label)] += 1

        summaries.append(
            {
                "client_id": client_id,
                "num_samples": len(dataset),
                "label_counts": dict(sorted(label_counts.items())),
            }
        )

    return summaries


def create_dataloaders(
    client_datasets: List[Dataset],
    test_dataset: Dataset,
    batch_size: int,
) -> Tuple[List[DataLoader], DataLoader]:
    client_loaders = [
        DataLoader(dataset, batch_size=batch_size, shuffle=True)
        for dataset in client_datasets
    ]

    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    return client_loaders, test_loader
