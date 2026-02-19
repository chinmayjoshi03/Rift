"""Pydantic models for API output validation."""

from pydantic import BaseModel, Field
from typing import List, Optional


class TransactionEdge(BaseModel):
    """Transaction edge for graph visualization."""
    transaction_id: str
    sender_id: str
    receiver_id: str
    amount: float
    timestamp: str


class SuspiciousAccount(BaseModel):
    """Individual suspicious account details."""
    account_id: str
    suspicion_score: float = Field(ge=0, le=100)
    detected_patterns: List[str]  # Renamed from 'flags'
    ring_id: Optional[str] = None  # Primary ring ID (e.g., "RING_001")
    total_transactions: int
    total_sent: float
    total_received: float
    connected_rings: List[int] = Field(default_factory=list)  # Keep for backward compatibility


class FraudRing(BaseModel):
    """Detected fraud ring (cycle) details."""
    ring_id: str  # Changed to string format "RING_001"
    member_accounts: List[str]  # Renamed from 'members'
    pattern_type: str = "cycle"  # Added pattern type
    total_flow: float
    transaction_count: int
    risk_score: float = Field(ge=0, le=100)
    cycle_length: int
    members: List[str] = Field(default_factory=list)  # Keep for backward compatibility


class Summary(BaseModel):
    """Overall analysis summary statistics."""
    total_accounts_analyzed: int  # Renamed from 'total_accounts'
    total_transactions: int
    suspicious_accounts_flagged: int  # Renamed from 'suspicious_accounts_count'
    fraud_rings_detected: int
    total_flagged_volume: float
    processing_time_seconds: float = 0.0  # Added processing time
    analysis_timestamp: str


class GraphVisualization(BaseModel):
    """Graph data for visualization."""
    nodes: List[str]  # All account IDs
    edges: List[TransactionEdge]  # All transactions
    suspicious_nodes: List[str]  # Account IDs flagged as suspicious


class DetectionResult(BaseModel):
    """Complete detection result output."""
    suspicious_accounts: List[SuspiciousAccount]
    fraud_rings: List[FraudRing]
    summary: Summary
    graph_data: Optional[GraphVisualization] = None  # Added for visualization
