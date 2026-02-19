"""
Enhanced detection wrapper that uses configuration and validation.
Wraps existing detectors without modifying them.
"""

from typing import Dict, List, Set
from models.graph_data import GraphData
from config import DetectionConfig
from utils.data_validator import AccountEnricher


class EnhancedCycleDetector:
    """Enhanced cycle detection with configurable parameters."""
    
    def __init__(self, config: DetectionConfig = None):
        self.config = config or DetectionConfig()
    
    def detect(self, graph: GraphData, base_detector_func) -> List[dict]:
        """
        Enhance cycle detection results with configuration.
        """
        # Call original detector
        cycles = base_detector_func(graph)
        
        # Apply configuration-based filtering
        filtered_cycles = []
        for cycle in cycles:
            # Apply minimum risk score threshold
            if cycle['risk_score'] >= (self.config.MIN_SUSPICION_SCORE - 10):
                filtered_cycles.append(cycle)
        
        return filtered_cycles


class EnhancedSmurfingDetector:
    """Enhanced smurfing detection with configurable parameters."""
    
    def __init__(self, config: DetectionConfig = None):
        self.config = config or DetectionConfig()
    
    def detect(self, graph: GraphData, base_detector_func) -> Set[str]:
        """
        Enhance smurfing detection with configuration.
        """
        # Call original detector
        flagged = base_detector_func(graph)
        
        # Apply whitelist filtering
        filtered = set()
        for account in flagged:
            if not self.config.is_whitelisted(account):
                filtered.add(account)
        
        # Add high-risk pattern accounts
        for account in graph.node_set:
            if self.config.is_high_risk_pattern(account):
                stats = graph.node_stats.get(account)
                if stats and (stats.out_degree >= 3 or stats.in_degree >= 3):
                    filtered.add(account)
        
        return filtered


class EnhancedShellDetector:
    """Enhanced shell account detection with configurable parameters."""
    
    def __init__(self, config: DetectionConfig = None):
        self.config = config or DetectionConfig()
    
    def detect(self, graph: GraphData, base_detector_func) -> Set[str]:
        """
        Enhance shell detection with configuration.
        """
        # Call original detector
        flagged = base_detector_func(graph)
        
        # Apply whitelist filtering
        filtered = set()
        for account in flagged:
            if not self.config.is_whitelisted(account):
                filtered.add(account)
        
        return filtered


class EnhancedScorer:
    """Enhanced scoring with configurable weights."""
    
    def __init__(self, config: DetectionConfig = None):
        self.config = config or DetectionConfig()
    
    def score_accounts(
        self,
        graph: GraphData,
        cycle_members: Set[str],
        smurfing_accounts: Set[str],
        shell_accounts: Set[str],
        fraud_rings: List[dict]
    ) -> Dict[str, dict]:
        """
        Enhanced scoring with configurable weights.
        """
        all_flagged = cycle_members | smurfing_accounts | shell_accounts
        scores = {}
        
        for account in all_flagged:
            score = 0.0
            flags = []
            
            # Cycle membership (configurable weight)
            if account in cycle_members:
                score += self.config.SCORE_CYCLE_MEMBER
                flags.append("cycle_member")
            
            # Smurfing patterns (configurable weights)
            if account in smurfing_accounts:
                stats = graph.node_stats.get(account)
                if stats:
                    if stats.in_degree >= self.config.MIN_FAN_DEGREE:
                        score += self.config.SCORE_FAN_IN
                        flags.append("fan_in_smurfing")
                    if stats.out_degree >= self.config.MIN_FAN_DEGREE:
                        score += self.config.SCORE_FAN_OUT
                        flags.append("fan_out_smurfing")
            
            # Shell account (configurable weight)
            if account in shell_accounts:
                score += self.config.SCORE_SHELL
                flags.append("shell_account")
            
            # High velocity (configurable weight)
            if self._has_high_velocity(account, graph):
                score += self.config.SCORE_HIGH_VELOCITY
                flags.append("high_velocity")
            
            # Below-threshold transactions (configurable weight)
            if self._has_below_threshold_txs(account, graph):
                score += self.config.SCORE_BELOW_THRESHOLD
                flags.append("below_threshold_structuring")
            
            # Multiple patterns bonus (configurable weight)
            if len(flags) >= 3:
                score += self.config.SCORE_MULTIPLE_PATTERNS
                flags.append("multiple_patterns")
            
            # High-risk pattern bonus
            if self.config.is_high_risk_pattern(account):
                score += 15
                flags.append("high_risk_pattern")
            
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
                "connected_rings": connected_rings,
                "account_type": AccountEnricher.detect_account_type(account, {
                    'in_degree': stats.in_degree if stats else 0,
                    'out_degree': stats.out_degree if stats else 0
                })
            }
        
        return scores
    
    def _has_high_velocity(self, account: str, graph: GraphData) -> bool:
        """Check if account has high transaction velocity."""
        stats = graph.node_stats.get(account)
        if not stats or not stats.first_tx or not stats.last_tx:
            return False
        
        time_span_days = (stats.last_tx - stats.first_tx).total_seconds() / 86400
        if time_span_days == 0:
            return True
        
        tx_per_day = stats.transaction_count / time_span_days
        return tx_per_day > self.config.TX_PER_DAY_THRESHOLD
    
    def _has_below_threshold_txs(self, account: str, graph: GraphData) -> bool:
        """Check if account has many below-threshold transactions."""
        outgoing = graph.adjacency_list.get(account, [])
        incoming = graph.reverse_adj.get(account, [])
        
        all_txs = outgoing + incoming
        if not all_txs:
            return False
        
        below_threshold = sum(1 for e in all_txs if e.amount < self.config.SMURFING_THRESHOLD)
        ratio = below_threshold / len(all_txs)
        
        return ratio > self.config.BELOW_THRESHOLD_RATIO and len(all_txs) >= 5


class EnhancedFalsePositiveGuard:
    """Enhanced false positive filtering with configurable rules."""
    
    def __init__(self, config: DetectionConfig = None):
        self.config = config or DetectionConfig()
    
    def filter(
        self,
        scored_accounts: Dict[str, dict],
        graph: GraphData,
        cycle_members: Set[str]
    ) -> Dict[str, dict]:
        """
        Enhanced false positive filtering.
        """
        filtered = {}
        
        for account, data in scored_accounts.items():
            # Rule 1: Minimum score threshold (configurable)
            if data['suspicion_score'] < self.config.MIN_SUSPICION_SCORE:
                continue
            
            # Rule 2: Whitelist check
            if self.config.is_whitelisted(account):
                continue
            
            stats = graph.node_stats.get(account)
            if not stats:
                continue
            
            # Rule 3: Enhanced merchant detection (configurable)
            if self._is_merchant(account, stats, cycle_members):
                continue
            
            # Rule 4: Enhanced payroll detection (configurable)
            if self._is_payroll(account, graph):
                continue
            
            # Rule 5: Enhanced exchange hub detection (configurable)
            if self._is_exchange_hub(account, stats, cycle_members):
                continue
            
            # Passed all filters
            filtered[account] = data
        
        return filtered
    
    def _is_merchant(self, account: str, stats, cycle_members: Set[str]) -> bool:
        """Enhanced merchant detection with configurable thresholds."""
        if account in cycle_members:
            return False
        
        if stats.transaction_count < self.config.MERCHANT_MIN_TX:
            return False
        
        if stats.in_degree < self.config.MERCHANT_MIN_IN_DEGREE:
            return False
        
        diversity_ratio = len(stats.unique_senders) / stats.in_degree if stats.in_degree > 0 else 0
        if diversity_ratio < self.config.MERCHANT_DIVERSITY_RATIO:
            return False
        
        return True
    
    def _is_payroll(self, account: str, graph: GraphData) -> bool:
        """Enhanced payroll detection with configurable thresholds."""
        outgoing = graph.adjacency_list.get(account, [])
        if len(outgoing) < self.config.PAYROLL_MIN_TX:
            return False
        
        sorted_txs = sorted(outgoing, key=lambda e: e.timestamp)
        
        intervals = []
        for i in range(1, len(sorted_txs)):
            delta = (sorted_txs[i].timestamp - sorted_txs[i-1].timestamp).days
            intervals.append(delta)
        
        if not intervals:
            return False
        
        regular_intervals = sum(
            1 for d in intervals
            if (6 <= d <= 8) or (13 <= d <= 15) or (27 <= d <= 32)
        )
        
        regularity_ratio = regular_intervals / len(intervals)
        return regularity_ratio > self.config.PAYROLL_REGULARITY
    
    def _is_exchange_hub(self, account: str, stats, cycle_members: Set[str]) -> bool:
        """Enhanced exchange hub detection with configurable thresholds."""
        if account in cycle_members:
            return False
        
        if stats.in_degree < self.config.EXCHANGE_MIN_DEGREE or stats.out_degree < self.config.EXCHANGE_MIN_DEGREE:
            return False
        
        if stats.total_received > 0:
            flow_ratio = stats.total_sent / stats.total_received
            if not (self.config.EXCHANGE_FLOW_RATIO_MIN <= flow_ratio <= self.config.EXCHANGE_FLOW_RATIO_MAX):
                return False
        
        return True
