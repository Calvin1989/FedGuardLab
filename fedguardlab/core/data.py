import random
from typing import List, Optional, Tuple

import torch
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
