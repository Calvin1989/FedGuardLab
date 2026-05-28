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


def aggregate(
    client_states: List[StateDict],
    client_sizes: List[int],
    method: str,
) -> StateDict:
    method = method.lower()

    if method == "fedavg":
        return fedavg(client_states, client_sizes)

    if method == "median":
        return median(client_states)

    raise ValueError(f"Unsupported aggregation method: {method}")
