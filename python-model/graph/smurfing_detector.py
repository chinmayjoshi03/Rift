"""Detect smurfing patterns: fan-in/fan-out with below-threshold amounts."""

from typing import List, Set
from datetime import timedelta
from models.graph_data import GraphData


SMURFING_THRESHOLD = 10000.0  # Typical reporting threshold
TIME_WINDOW_HOURS = 72  # 3 days


def detect_smurfing(graph: GraphData) -> Set[str]:
    """
    Detect accounts involved in smurfing patterns.
    
    Fan-out: One account sends to many accounts in short time, amounts below threshold
    Fan-in: Many accounts send to one account in short time, amounts below threshold
    """
    flagged = set()
    
    # Check fan-out patterns
    for node, stats in graph.node_stats.items():
        if stats.out_degree >= 5:  # Minimum fan-out degree
            # Check if transactions are within time window
            outgoing = graph.adjacency_list.get(node, [])
            if _check_smurfing_pattern(outgoing, stats):
                flagged.add(node)
    
    # Check fan-in patterns
    for node, stats in graph.node_stats.items():
        if stats.in_degree >= 5:  # Minimum fan-in degree
            # Check if transactions are within time window
            incoming = graph.reverse_adj.get(node, [])
            if _check_smurfing_pattern(incoming, stats):
                flagged.add(node)
    
    return flagged


def _check_smurfing_pattern(edges: List, stats) -> bool:
    """Check if edges match smurfing pattern."""
    if not edges:
        return False
    
    # Sort by timestamp
    sorted_edges = sorted(edges, key=lambda e: e.timestamp)
    
    # Sliding window check
    for i in range(len(sorted_edges)):
        window_start = sorted_edges[i].timestamp
        window_end = window_start + timedelta(hours=TIME_WINDOW_HOURS)
        
        # Count transactions in window
        window_txs = [
            e for e in sorted_edges[i:]
            if e.timestamp <= window_end
        ]
        
        if len(window_txs) >= 5:
            # Check if amounts are below threshold
            below_threshold = sum(1 for e in window_txs if e.amount < SMURFING_THRESHOLD)
            
            if below_threshold >= len(window_txs) * 0.8:  # 80% below threshold
                return True
    
    return False
