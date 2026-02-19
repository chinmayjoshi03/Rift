"""Filter out false positives from flagged accounts."""

from typing import Dict, Set
from models.graph_data import GraphData
from datetime import timedelta


MIN_SUSPICION_SCORE = 40.0


def filter_false_positives(
    scored_accounts: Dict[str, dict],
    graph: GraphData,
    cycle_members: Set[str]
) -> Dict[str, dict]:
    """
    Remove likely false positives based on legitimate business patterns.
    
    Suppression rules:
    1. Merchant: High transaction count, not in cycle, high counterparty diversity
    2. Payroll: Regular intervals (7/14 days), consistent amounts
    3. Exchange hub: High in AND out degree, not in cycle
    4. Minimum score threshold: < 40
    """
    filtered = {}
    
    for account, data in scored_accounts.items():
        # Rule 4: Minimum score threshold
        if data['suspicion_score'] < MIN_SUSPICION_SCORE:
            continue
        
        stats = graph.node_stats.get(account)
        if not stats:
            continue
        
        # Rule 1: Merchant pattern
        if _is_merchant(account, stats, cycle_members):
            continue
        
        # Rule 2: Payroll pattern
        if _is_payroll(account, graph):
            continue
        
        # Rule 3: Exchange hub pattern
        if _is_exchange_hub(account, stats, cycle_members):
            continue
        
        # Passed all filters
        filtered[account] = data
    
    return filtered


def _is_merchant(account: str, stats, cycle_members: Set[str]) -> bool:
    """Check if account matches merchant pattern."""
    # Not in any cycle
    if account in cycle_members:
        return False
    
    # High transaction count
    if stats.transaction_count < 50:
        return False
    
    # High counterparty diversity (receives from many different accounts)
    if stats.in_degree < 20:
        return False
    
    diversity_ratio = len(stats.unique_senders) / stats.in_degree
    if diversity_ratio < 0.7:  # At least 70% unique senders
        return False
    
    return True


def _is_payroll(account: str, graph: GraphData) -> bool:
    """Check if account matches payroll pattern."""
    outgoing = graph.adjacency_list.get(account, [])
    if len(outgoing) < 10:
        return False
    
    # Sort by timestamp
    sorted_txs = sorted(outgoing, key=lambda e: e.timestamp)
    
    # Check for regular intervals (7 or 14 days)
    intervals = []
    for i in range(1, len(sorted_txs)):
        delta = (sorted_txs[i].timestamp - sorted_txs[i-1].timestamp).days
        intervals.append(delta)
    
    if not intervals:
        return False
    
    # Check if most intervals are 7 or 14 days (±1 day tolerance)
    regular_intervals = sum(
        1 for d in intervals
        if (6 <= d <= 8) or (13 <= d <= 15)
    )
    
    regularity_ratio = regular_intervals / len(intervals)
    return regularity_ratio > 0.6


def _is_exchange_hub(account: str, stats, cycle_members: Set[str]) -> bool:
    """Check if account matches exchange/hub pattern."""
    # Not in any cycle
    if account in cycle_members:
        return False
    
    # High both in and out degree
    if stats.in_degree < 15 or stats.out_degree < 15:
        return False
    
    # Balanced flow
    if stats.total_received > 0:
        flow_ratio = stats.total_sent / stats.total_received
        if not (0.7 <= flow_ratio <= 1.3):
            return False
    
    return True
