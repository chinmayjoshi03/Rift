"""Build final JSON output in exact required format."""

from datetime import datetime
from typing import Dict, List, Optional
from models.output_schema import (
    DetectionResult, 
    SuspiciousAccount, 
    FraudRing, 
    Summary,
    GraphVisualization,
    TransactionEdge
)
from models.graph_data import GraphData


def build_output(
    scored_accounts: Dict[str, dict],
    fraud_rings: List[dict],
    graph: GraphData,
    processing_time: float = 0.0,
    include_graph_data: bool = True
) -> dict:
    """
    Assemble complete output in exact format.
    
    Args:
        scored_accounts: Dictionary of suspicious accounts with scores
        fraud_rings: List of detected fraud rings
        graph: Graph data structure
        processing_time: Time taken for analysis in seconds
        include_graph_data: Whether to include full graph data for visualization
    
    Returns dict that matches DetectionResult schema.
    """
    # Build suspicious accounts list
    suspicious_accounts = []
    for account_id, data in scored_accounts.items():
        # Determine primary ring_id (first connected ring)
        primary_ring_id = None
        if data['connected_rings']:
            primary_ring_id = f"RING_{data['connected_rings'][0]:03d}"
        
        suspicious_accounts.append(
            SuspiciousAccount(
                account_id=account_id,
                suspicion_score=data['suspicion_score'],
                detected_patterns=data['flags'],  # Renamed from 'flags'
                ring_id=primary_ring_id,  # Added primary ring ID
                total_transactions=data['total_transactions'],
                total_sent=data['total_sent'],
                total_received=data['total_received'],
                connected_rings=data['connected_rings']  # Keep for backward compatibility
            )
        )
    
    # Sort by suspicion score descending
    suspicious_accounts.sort(key=lambda x: x.suspicion_score, reverse=True)
    
    # Build fraud rings list
    fraud_rings_output = []
    for i, ring in enumerate(fraud_rings):
        ring_id_str = f"RING_{i:03d}"  # Format as "RING_001", "RING_002", etc.
        fraud_rings_output.append(
            FraudRing(
                ring_id=ring_id_str,  # String format
                member_accounts=ring['members'],  # Renamed from 'members'
                pattern_type="cycle",  # Added pattern type
                total_flow=ring['total_flow'],
                transaction_count=ring['transaction_count'],
                risk_score=ring['risk_score'],
                cycle_length=ring['cycle_length'],
                members=ring['members']  # Keep for backward compatibility
            )
        )
    
    # Calculate summary statistics
    total_flagged_volume = sum(
        acc.total_sent + acc.total_received
        for acc in suspicious_accounts
    )
    
    summary = Summary(
        total_accounts_analyzed=len(graph.node_set),  # Renamed
        total_transactions=len(graph.transactions) if graph.transactions is not None else 0,
        suspicious_accounts_flagged=len(suspicious_accounts),  # Renamed
        fraud_rings_detected=len(fraud_rings_output),
        total_flagged_volume=round(total_flagged_volume, 2),
        processing_time_seconds=round(processing_time, 2),  # Added
        analysis_timestamp=datetime.utcnow().isoformat() + "Z"
    )
    
    # Build graph visualization data if requested
    graph_data = None
    if include_graph_data and graph.transactions is not None:
        # Get all nodes
        nodes = list(graph.node_set)
        
        # Get all edges (transactions)
        edges = []
        for _, row in graph.transactions.iterrows():
            edges.append(
                TransactionEdge(
                    transaction_id=str(row['transaction_id']),
                    sender_id=str(row['sender_id']),
                    receiver_id=str(row['receiver_id']),
                    amount=float(row['amount']),
                    timestamp=row['timestamp'].isoformat() if hasattr(row['timestamp'], 'isoformat') else str(row['timestamp'])
                )
            )
        
        # Get suspicious nodes
        suspicious_nodes = [acc.account_id for acc in suspicious_accounts]
        
        graph_data = GraphVisualization(
            nodes=nodes,
            edges=edges,
            suspicious_nodes=suspicious_nodes
        )
    
    # Build final result
    result = DetectionResult(
        suspicious_accounts=suspicious_accounts,
        fraud_rings=fraud_rings_output,
        summary=summary,
        graph_data=graph_data
    )
    
    return result.model_dump()
