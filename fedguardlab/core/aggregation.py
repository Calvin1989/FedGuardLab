from collections import OrderedDict
from typing import Dict, List

import torch

StateDict = Dict[str, torch.Tensor]


def fedavg(client_states: List[StateDict], client_sizes: List[int]) -> StateDict:
    if len(client_states) == 0:
        raise ValueError("client_states cannot be empty")

    total_size = sum(client_sizes)

    if total_size <= 0:
        raise ValueError("total client size must be positive")

    averaged_state = OrderedDict()

    for key in client_states[0].keys():
        averaged_state[key] = sum(
            client_states[i][key] * (client_sizes[i] / total_size)
            for i in range(len(client_states))
        )

    return averaged_state


def median(client_states: List[StateDict]) -> StateDict:
    if len(client_states) == 0:
        raise ValueError("client_states cannot be empty")

    median_state = OrderedDict()

    for key in client_states[0].keys():
        stacked = torch.stack([state[key] for state in client_states], dim=0)
        median_state[key] = torch.median(stacked, dim=0).values

    return median_state


def trimmed_mean(
    client_states: List[StateDict],
    trim_ratio: float = 0.2,
) -> StateDict:
    if len(client_states) == 0:
        raise ValueError("client_states cannot be empty")

    if trim_ratio < 0 or trim_ratio >= 0.5:
        raise ValueError("trim_ratio must be in [0, 0.5)")

    num_clients = len(client_states)
    trim_count = int(num_clients * trim_ratio)

    if num_clients - 2 * trim_count <= 0:
        raise ValueError("trim_ratio removes all client updates")

    trimmed_state = OrderedDict()

    for key in client_states[0].keys():
        stacked = torch.stack([state[key] for state in client_states], dim=0)
        sorted_values, _ = torch.sort(stacked, dim=0)

        if trim_count > 0:
            trimmed_values = sorted_values[trim_count:-trim_count]
        else:
            trimmed_values = sorted_values

        trimmed_state[key] = trimmed_values.mean(dim=0)

    return trimmed_state


def flatten_state(state: StateDict) -> torch.Tensor:
    return torch.cat([tensor.detach().float().reshape(-1) for tensor in state.values()])


def krum(
    client_states: List[StateDict],
    num_malicious: int,
) -> StateDict:
    if len(client_states) == 0:
        raise ValueError("client_states cannot be empty")

    num_clients = len(client_states)

    if num_malicious < 0:
        raise ValueError("num_malicious cannot be negative")

    if num_clients <= 2 * num_malicious + 2:
        raise ValueError(
            "Krum requires num_clients > 2 * num_malicious + 2"
        )

    flattened_states = [flatten_state(state) for state in client_states]

    scores = []

    for i in range(num_clients):
        distances = []

        for j in range(num_clients):
            if i == j:
                continue

            distance = torch.sum((flattened_states[i] - flattened_states[j]) ** 2)
            distances.append(distance)

        distances = sorted(distances)
        neighbor_count = num_clients - num_malicious - 2
        score = sum(distances[:neighbor_count])
        scores.append(score)

    selected_index = int(torch.argmin(torch.stack(scores)).item())

    return OrderedDict(
        (key, value.clone())
        for key, value in client_states[selected_index].items()
    )


def aggregate(
    client_states: List[StateDict],
    client_sizes: List[int],
    method: str,
    trim_ratio: float = 0.2,
    num_malicious: int = 0,
) -> StateDict:
    method = method.lower()

    if method == "fedavg":
        return fedavg(client_states, client_sizes)

    if method == "median":
        return median(client_states)

    if method == "trimmed_mean":
        return trimmed_mean(client_states, trim_ratio=trim_ratio)

    if method == "krum":
        return krum(client_states, num_malicious=num_malicious)

    raise ValueError(f"Unsupported aggregation method: {method}")
