"""Shared graph data structures used across all detection modules."""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Tuple
from datetime import datetime
import pandas as pd


@dataclass
class Edge:
    """Represents a single transaction edge."""
    transaction_id: str
    sender_id: str
    receiver_id: str
    amount: float
    timestamp: datetime


@dataclass
class NodeStats:
    """Statistics for a single node (account)."""
    total_sent: float = 0.0
    total_received: float = 0.0
    out_degree: int = 0
    in_degree: int = 0
    unique_receivers: Set[str] = field(default_factory=set)
    unique_senders: Set[str] = field(default_factory=set)
    transaction_count: int = 0
    first_tx: datetime = None
    last_tx: datetime = None


@dataclass
class GraphData:
    """Complete graph representation with all necessary indices."""
    adjacency_list: Dict[str, List[Edge]] = field(default_factory=dict)
    reverse_adj: Dict[str, List[Edge]] = field(default_factory=dict)
    node_stats: Dict[str, NodeStats] = field(default_factory=dict)
    node_set: Set[str] = field(default_factory=set)
    edge_index: Dict[Tuple[str, str], List[Edge]] = field(default_factory=dict)
    transactions: pd.DataFrame = None
