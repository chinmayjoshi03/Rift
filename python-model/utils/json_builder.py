"""Build final JSON output in exact required format."""

from datetime import datetime
from typing import Dict, List
from models.output_schema import DetectionResult, SuspiciousAccount, FraudRing, Summary
from models.graph_data import GraphData


def build_output(
    scored_accounts: Dict[str, dict],
    fraud_rings: List[dict],
    graph: GraphData
) -> dict:
    """
    Assemble complete output in exact format.
    
    Returns dict that matches DetectionResult schema.
    """
    # Build suspicious accounts list
    suspicious_accounts = []
    for account_id, data in scored_accounts.items():
        suspicious_accounts.append(
            SuspiciousAccount(
                account_id=account_id,
                suspicion_score=data['suspicion_score'],
                flags=data['flags'],
                total_transactions=data['total_transactions'],
                total_sent=data['total_sent'],
                total_received=data['total_received'],
                connected_rings=data['connected_rings']
            )
        )
    
    # Sort by suspicion score descending
    suspicious_accounts.sort(key=lambda x: x.suspicion_score, reverse=True)
    
    # Build fraud rings list
    fraud_rings_output = []
    for i, ring in enumerate(fraud_rings):
        fraud_rings_output.append(
            FraudRing(
                ring_id=i,
                members=ring['members'],
                total_flow=ring['total_flow'],
                transaction_count=ring['transaction_count'],
                risk_score=ring['risk_score'],
                cycle_length=ring['cycle_length']
            )
        )
    
    # Calculate summary statistics
    total_flagged_volume = sum(
        acc.total_sent + acc.total_received
        for acc in suspicious_accounts
    )
    
    summary = Summary(
        total_accounts=len(graph.node_set),
        total_transactions=len(graph.transactions) if graph.transactions is not None else 0,
        suspicious_accounts_count=len(suspicious_accounts),
        fraud_rings_detected=len(fraud_rings_output),
        total_flagged_volume=round(total_flagged_volume, 2),
        analysis_timestamp=datetime.utcnow().isoformat() + "Z"
    )
    
    # Build final result
    result = DetectionResult(
        suspicious_accounts=suspicious_accounts,
        fraud_rings=fraud_rings_output,
        summary=summary
    )
    
    return result.model_dump()
