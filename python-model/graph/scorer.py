"""Calculate suspicion scores for flagged accounts."""

from typing import Dict, Set, List
from models.graph_data import GraphData


def score_accounts(
    graph: GraphData,
    cycle_members: Set[str],
    smurfing_accounts: Set[str],
    shell_accounts: Set[str],
    fraud_rings: List[dict]
) -> Dict[str, dict]:
    """
    Calculate suspicion score for each flagged account.
    
    Scoring rules:
    - +50 if in a cycle
    - +30 if confirmed fan-in smurfing
    - +30 if confirmed fan-out smurfing
    - +20 if shell account (intermediary)
    - +10 if high velocity
    - +20 if below-threshold transactions
    - +10 if multiple pattern types
    
    Cap at 100.0
    """
    all_flagged = cycle_members | smurfing_accounts | shell_accounts
    scores = {}
    
    for account in all_flagged:
        score = 0.0
        flags = []
        
        # Cycle membership
        if account in cycle_members:
            score += 50.0
            flags.append("cycle_member")
        
        # Smurfing patterns
        if account in smurfing_accounts:
            stats = graph.node_stats.get(account)
            if stats:
                if stats.in_degree >= 5:
                    score += 30.0
                    flags.append("fan_in_smurfing")
                if stats.out_degree >= 5:
                    score += 30.0
                    flags.append("fan_out_smurfing")
        
        # Shell account
        if account in shell_accounts:
            score += 20.0
            flags.append("shell_account")
        
        # High velocity check
        if _has_high_velocity(account, graph):
            score += 10.0
            flags.append("high_velocity")
        
        # Below-threshold transactions
        if _has_below_threshold_txs(account, graph):
            score += 20.0
            flags.append("below_threshold_structuring")
        
        # Multi-pattern bonus
        if len(flags) >= 3:
            score += 10.0
            flags.append("multiple_patterns")
        
        # Cap at 100
        score = min(score, 100.0)
        
        # Find connected rings
        connected_rings = []
        for i, ring in enumerate(fraud_rings):
            if account in ring['members']:
                connected_rings.append(i)
        
        stats = graph.node_stats.get(account)
        scores[account] = {
            "suspicion_score": round(score, 2),
            "flags": flags,
            "total_transactions": stats.transaction_count if stats else 0,
            "total_sent": round(stats.total_sent, 2) if stats else 0.0,
            "total_received": round(stats.total_received, 2) if stats else 0.0,
            "connected_rings": connected_rings
        }
    
    return scores


def _has_high_velocity(account: str, graph: GraphData) -> bool:
    """Check if account has high transaction velocity."""
    stats = graph.node_stats.get(account)
    if not stats or not stats.first_tx or not stats.last_tx:
        return False
    
    time_span_days = (stats.last_tx - stats.first_tx).total_seconds() / 86400
    if time_span_days == 0:
        return True  # All transactions in same day
    
    tx_per_day = stats.transaction_count / time_span_days
    return tx_per_day > 10  # More than 10 transactions per day


def _has_below_threshold_txs(account: str, graph: GraphData, threshold: float = 10000.0) -> bool:
    """Check if account has many below-threshold transactions."""
    outgoing = graph.adjacency_list.get(account, [])
    incoming = graph.reverse_adj.get(account, [])
    
    all_txs = outgoing + incoming
    if not all_txs:
        return False
    
    below_threshold = sum(1 for e in all_txs if e.amount < threshold)
    ratio = below_threshold / len(all_txs)
    
    return ratio > 0.7 and len(all_txs) >= 5
