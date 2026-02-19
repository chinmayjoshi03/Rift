"""Pydantic models for API output validation."""

from pydantic import BaseModel, Field
from typing import List, Optional


class SuspiciousAccount(BaseModel):
    """Individual suspicious account details."""
    account_id: str
    suspicion_score: float = Field(ge=0, le=100)
    flags: List[str]
    total_transactions: int
    total_sent: float
    total_received: float
    connected_rings: List[int] = Field(default_factory=list)


class FraudRing(BaseModel):
    """Detected fraud ring (cycle) details."""
    ring_id: int
    members: List[str]
    total_flow: float
    transaction_count: int
    risk_score: float = Field(ge=0, le=100)
    cycle_length: int


class Summary(BaseModel):
    """Overall analysis summary statistics."""
    total_accounts: int
    total_transactions: int
    suspicious_accounts_count: int
    fraud_rings_detected: int
    total_flagged_volume: float
    analysis_timestamp: str


class DetectionResult(BaseModel):
    """Complete detection result output."""
    suspicious_accounts: List[SuspiciousAccount]
    fraud_rings: List[FraudRing]
    summary: Summary
