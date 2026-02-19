"""Build graph data structure from CSV transaction data."""

import pandas as pd
from datetime import datetime
from typing import Dict, Set
from models.graph_data import GraphData, Edge, NodeStats


def build_graph_from_csv(csv_bytes: bytes) -> GraphData:
    """
    Parse CSV and build complete graph data structure.
    
    Required columns: transaction_id, sender_id, receiver_id, amount, timestamp
    """
    # Read CSV
    df = pd.read_csv(pd.io.common.BytesIO(csv_bytes))
    
    # Validate required columns
    required_cols = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp']
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    # Parse timestamps
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Initialize graph
    graph = GraphData()
    graph.transactions = df
    
    # Build adjacency lists and indices
    for _, row in df.iterrows():
        edge = Edge(
            transaction_id=str(row['transaction_id']),
            sender_id=str(row['sender_id']),
            receiver_id=str(row['receiver_id']),
            amount=float(row['amount']),
            timestamp=row['timestamp']
        )
        
        # Add to adjacency list
        if edge.sender_id not in graph.adjacency_list:
            graph.adjacency_list[edge.sender_id] = []
        graph.adjacency_list[edge.sender_id].append(edge)
        
        # Add to reverse adjacency list
        if edge.receiver_id not in graph.reverse_adj:
            graph.reverse_adj[edge.receiver_id] = []
        graph.reverse_adj[edge.receiver_id].append(edge)
        
        # Add to edge index
        key = (edge.sender_id, edge.receiver_id)
        if key not in graph.edge_index:
            graph.edge_index[key] = []
        graph.edge_index[key].append(edge)
        
        # Track nodes
        graph.node_set.add(edge.sender_id)
        graph.node_set.add(edge.receiver_id)
        
        # Update node stats
        _update_node_stats(graph, edge)
    
    return graph


def _update_node_stats(graph: GraphData, edge: Edge):
    """Update statistics for sender and receiver nodes."""
    # Sender stats
    if edge.sender_id not in graph.node_stats:
        graph.node_stats[edge.sender_id] = NodeStats()
    
    sender_stats = graph.node_stats[edge.sender_id]
    sender_stats.total_sent += edge.amount
    sender_stats.out_degree += 1
    sender_stats.unique_receivers.add(edge.receiver_id)
    sender_stats.transaction_count += 1
    
    if sender_stats.first_tx is None or edge.timestamp < sender_stats.first_tx:
        sender_stats.first_tx = edge.timestamp
    if sender_stats.last_tx is None or edge.timestamp > sender_stats.last_tx:
        sender_stats.last_tx = edge.timestamp
    
    # Receiver stats
    if edge.receiver_id not in graph.node_stats:
        graph.node_stats[edge.receiver_id] = NodeStats()
    
    receiver_stats = graph.node_stats[edge.receiver_id]
    receiver_stats.total_received += edge.amount
    receiver_stats.in_degree += 1
    receiver_stats.unique_senders.add(edge.sender_id)
    receiver_stats.transaction_count += 1
    
    if receiver_stats.first_tx is None or edge.timestamp < receiver_stats.first_tx:
        receiver_stats.first_tx = edge.timestamp
    if receiver_stats.last_tx is None or edge.timestamp > receiver_stats.last_tx:
        receiver_stats.last_tx = edge.timestamp
