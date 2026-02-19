"""Detect shell accounts: intermediary nodes in transaction chains."""

from typing import Set, List
from models.graph_data import GraphData


def detect_shell_accounts(graph: GraphData) -> Set[str]:
    """
    Detect shell accounts that act as intermediaries.
    
    Characteristics:
    - High pass-through ratio (money in ≈ money out)
    - Part of chains >= 3 hops
    - Low transaction diversity
    - High velocity (short time between in/out)
    """
    flagged = set()
    
    for node, stats in graph.node_stats.items():
        # Must have both incoming and outgoing
        if stats.in_degree == 0 or stats.out_degree == 0:
            continue
        
        # Check pass-through ratio
        if stats.total_received > 0:
            pass_through_ratio = stats.total_sent / stats.total_received
            if 0.8 <= pass_through_ratio <= 1.2:  # Money in ≈ money out
                
                # Check if part of chains
                if _is_in_chain(node, graph):
                    
                    # Check velocity
                    if _has_high_velocity(node, graph):
                        flagged.add(node)
    
    return flagged


def _is_in_chain(node: str, graph: GraphData, min_chain_length: int = 3) -> bool:
    """Check if node is part of a transaction chain >= min_chain_length."""
    # DFS from entry nodes (nodes that send to this node)
    incoming = graph.reverse_adj.get(node, [])
    
    for edge in incoming:
        entry_node = edge.sender_id
        if _dfs_chain_length(entry_node, node, graph, set()) >= min_chain_length:
            return True
    
    return False


def _dfs_chain_length(current: str, target: str, graph: GraphData, visited: Set[str], depth: int = 0) -> int:
    """DFS to find chain length from current to target."""
    if depth > 10:  # Prevent infinite loops
        return 0
    
    if current == target:
        return depth
    
    if current in visited:
        return 0
    
    visited.add(current)
    max_length = 0
    
    for edge in graph.adjacency_list.get(current, []):
        length = _dfs_chain_length(edge.receiver_id, target, graph, visited.copy(), depth + 1)
        max_length = max(max_length, length)
    
    return max_length


def _has_high_velocity(node: str, graph: GraphData) -> bool:
    """Check if node has high transaction velocity (quick pass-through)."""
    incoming = graph.reverse_adj.get(node, [])
    outgoing = graph.adjacency_list.get(node, [])
    
    if not incoming or not outgoing:
        return False
    
    # Calculate average time between receiving and sending
    in_times = [e.timestamp for e in incoming]
    out_times = [e.timestamp for e in outgoing]
    
    if not in_times or not out_times:
        return False
    
    avg_in = sum(t.timestamp() for t in in_times) / len(in_times)
    avg_out = sum(t.timestamp() for t in out_times) / len(out_times)
    
    # If average time difference is less than 24 hours
    time_diff_hours = abs(avg_out - avg_in) / 3600
    
    return time_diff_hours < 24
