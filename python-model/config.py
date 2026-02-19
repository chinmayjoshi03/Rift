"""
Configuration file for fraud detection parameters.
Tune these values to improve accuracy without changing code.
"""

import os
from typing import Dict, List, Set


class DetectionConfig:
    """Centralized configuration for all detection algorithms."""
    
    # ============ SMURFING DETECTION ============
    SMURFING_THRESHOLD = float(os.getenv('SMURFING_THRESHOLD', 10000.0))
    TIME_WINDOW_HOURS = int(os.getenv('TIME_WINDOW_HOURS', 72))
    MIN_FAN_DEGREE = int(os.getenv('MIN_FAN_DEGREE', 5))
    BELOW_THRESHOLD_RATIO = float(os.getenv('BELOW_THRESHOLD_RATIO', 0.8))
    
    # ============ SHELL ACCOUNT DETECTION ============
    PASS_THROUGH_RATIO_MIN = float(os.getenv('PASS_THROUGH_RATIO_MIN', 0.8))
    PASS_THROUGH_RATIO_MAX = float(os.getenv('PASS_THROUGH_RATIO_MAX', 1.2))
    MIN_CHAIN_LENGTH = int(os.getenv('MIN_CHAIN_LENGTH', 3))
    VELOCITY_THRESHOLD_HOURS = int(os.getenv('VELOCITY_THRESHOLD_HOURS', 24))
    
    # ============ CYCLE DETECTION ============
    MIN_CYCLE_LENGTH = int(os.getenv('MIN_CYCLE_LENGTH', 3))
    MAX_CYCLE_LENGTH = int(os.getenv('MAX_CYCLE_LENGTH', 5))
    CYCLE_VARIANCE_THRESHOLD = float(os.getenv('CYCLE_VARIANCE_THRESHOLD', 0.1))
    
    # ============ SCORING WEIGHTS ============
    SCORE_CYCLE_MEMBER = int(os.getenv('SCORE_CYCLE_MEMBER', 50))
    SCORE_FAN_IN = int(os.getenv('SCORE_FAN_IN', 30))
    SCORE_FAN_OUT = int(os.getenv('SCORE_FAN_OUT', 30))
    SCORE_SHELL = int(os.getenv('SCORE_SHELL', 20))
    SCORE_HIGH_VELOCITY = int(os.getenv('SCORE_HIGH_VELOCITY', 10))
    SCORE_BELOW_THRESHOLD = int(os.getenv('SCORE_BELOW_THRESHOLD', 20))
    SCORE_MULTIPLE_PATTERNS = int(os.getenv('SCORE_MULTIPLE_PATTERNS', 10))
    
    # ============ FALSE POSITIVE FILTERING ============
    MIN_SUSPICION_SCORE = float(os.getenv('MIN_SUSPICION_SCORE', 40.0))
    MERCHANT_MIN_TX = int(os.getenv('MERCHANT_MIN_TX', 50))
    MERCHANT_MIN_IN_DEGREE = int(os.getenv('MERCHANT_MIN_IN_DEGREE', 20))
    MERCHANT_DIVERSITY_RATIO = float(os.getenv('MERCHANT_DIVERSITY_RATIO', 0.7))
    PAYROLL_REGULARITY = float(os.getenv('PAYROLL_REGULARITY', 0.6))
    PAYROLL_MIN_TX = int(os.getenv('PAYROLL_MIN_TX', 10))
    EXCHANGE_MIN_DEGREE = int(os.getenv('EXCHANGE_MIN_DEGREE', 15))
    EXCHANGE_FLOW_RATIO_MIN = float(os.getenv('EXCHANGE_FLOW_RATIO_MIN', 0.7))
    EXCHANGE_FLOW_RATIO_MAX = float(os.getenv('EXCHANGE_FLOW_RATIO_MAX', 1.3))
    
    # ============ VELOCITY THRESHOLDS ============
    TX_PER_DAY_THRESHOLD = int(os.getenv('TX_PER_DAY_THRESHOLD', 10))
    HIGH_VELOCITY_HOURS = int(os.getenv('HIGH_VELOCITY_HOURS', 24))
    
    # ============ BUSINESS RULES ============
    KNOWN_MERCHANTS: Set[str] = {
        "AMAZON", "WALMART", "PAYPAL", "STRIPE", "SQUARE",
        "SHOPIFY", "EBAY", "ETSY", "ALIBABA"
    }
    
    KNOWN_PAYROLL_PROVIDERS: Set[str] = {
        "ADP", "PAYCHEX", "GUSTO", "QUICKBOOKS", "ZENEFITS"
    }
    
    WHITELISTED_ACCOUNTS: Set[str] = {
        "BANK_RESERVE", "CLEARING_HOUSE", "FED_RESERVE"
    }
    
    HIGH_RISK_PATTERNS: List[str] = [
        "CRYPTO", "CASINO", "OFFSHORE", "SHELL"
    ]
    
    # ============ DATA QUALITY ============
    MIN_TRANSACTIONS_FOR_ANALYSIS = int(os.getenv('MIN_TRANSACTIONS', 10))
    MIN_ACCOUNTS_FOR_NETWORK = int(os.getenv('MIN_ACCOUNTS', 5))
    
    @classmethod
    def is_whitelisted(cls, account_id: str) -> bool:
        """Check if account is whitelisted."""
        account_upper = account_id.upper()
        return (
            account_upper in cls.WHITELISTED_ACCOUNTS or
            any(merchant in account_upper for merchant in cls.KNOWN_MERCHANTS) or
            any(provider in account_upper for provider in cls.KNOWN_PAYROLL_PROVIDERS)
        )
    
    @classmethod
    def is_high_risk_pattern(cls, account_id: str) -> bool:
        """Check if account matches high-risk patterns."""
        account_upper = account_id.upper()
        return any(pattern in account_upper for pattern in cls.HIGH_RISK_PATTERNS)
    
    @classmethod
    def get_config_summary(cls) -> Dict:
        """Get current configuration as dictionary."""
        return {
            "smurfing": {
                "threshold": cls.SMURFING_THRESHOLD,
                "time_window_hours": cls.TIME_WINDOW_HOURS,
                "min_fan_degree": cls.MIN_FAN_DEGREE,
                "below_threshold_ratio": cls.BELOW_THRESHOLD_RATIO
            },
            "shell_detection": {
                "pass_through_min": cls.PASS_THROUGH_RATIO_MIN,
                "pass_through_max": cls.PASS_THROUGH_RATIO_MAX,
                "min_chain_length": cls.MIN_CHAIN_LENGTH,
                "velocity_threshold_hours": cls.VELOCITY_THRESHOLD_HOURS
            },
            "scoring": {
                "cycle_member": cls.SCORE_CYCLE_MEMBER,
                "fan_in": cls.SCORE_FAN_IN,
                "fan_out": cls.SCORE_FAN_OUT,
                "shell": cls.SCORE_SHELL,
                "high_velocity": cls.SCORE_HIGH_VELOCITY,
                "below_threshold": cls.SCORE_BELOW_THRESHOLD,
                "multiple_patterns": cls.SCORE_MULTIPLE_PATTERNS
            },
            "filtering": {
                "min_suspicion_score": cls.MIN_SUSPICION_SCORE,
                "merchant_min_tx": cls.MERCHANT_MIN_TX,
                "payroll_regularity": cls.PAYROLL_REGULARITY
            }
        }


# Preset configurations for different use cases
class PresetConfigs:
    """Predefined configuration presets."""
    
    @staticmethod
    def aggressive():
        """Aggressive detection - catches more, more false positives."""
        config = DetectionConfig()
        config.SMURFING_THRESHOLD = 9000.0
        config.TIME_WINDOW_HOURS = 96
        config.MIN_FAN_DEGREE = 3
        config.MIN_SUSPICION_SCORE = 35.0
        config.TX_PER_DAY_THRESHOLD = 5
        return config
    
    @staticmethod
    def conservative():
        """Conservative detection - fewer false positives, might miss some."""
        config = DetectionConfig()
        config.SMURFING_THRESHOLD = 12000.0
        config.TIME_WINDOW_HOURS = 48
        config.MIN_FAN_DEGREE = 7
        config.MIN_SUSPICION_SCORE = 55.0
        config.TX_PER_DAY_THRESHOLD = 15
        return config
    
    @staticmethod
    def balanced():
        """Balanced detection - default settings."""
        return DetectionConfig()
