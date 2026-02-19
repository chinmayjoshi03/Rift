"""
Data validation and preprocessing utilities.
Improves accuracy through data quality checks.
"""

import pandas as pd
from typing import Tuple, List, Dict
from datetime import datetime
import re


class DataValidator:
    """Validates and cleans transaction data."""
    
    @staticmethod
    def validate_csv(df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """
        Validate CSV data quality.
        Returns (is_valid, list_of_issues)
        """
        issues = []
        
        # Check required columns
        required_cols = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            issues.append(f"Missing required columns: {missing_cols}")
            return False, issues
        
        # Check for empty data
        if len(df) == 0:
            issues.append("CSV file is empty")
            return False, issues
        
        # Check for null values
        null_counts = df[required_cols].isnull().sum()
        for col, count in null_counts.items():
            if count > 0:
                issues.append(f"Column '{col}' has {count} null values")
        
        # Check for duplicate transaction IDs
        duplicates = df['transaction_id'].duplicated().sum()
        if duplicates > 0:
            issues.append(f"Found {duplicates} duplicate transaction IDs")
        
        # Check amount validity
        if (df['amount'] <= 0).any():
            issues.append("Found negative or zero amounts")
        
        # Check for self-transactions
        self_tx = (df['sender_id'] == df['receiver_id']).sum()
        if self_tx > 0:
            issues.append(f"Found {self_tx} self-transactions (sender = receiver)")
        
        return len(issues) == 0, issues
    
    @staticmethod
    def clean_data(df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and standardize transaction data.
        """
        df = df.copy()
        
        # Remove duplicates
        df = df.drop_duplicates(subset=['transaction_id'], keep='first')
        
        # Standardize account IDs (uppercase, strip whitespace)
        df['sender_id'] = df['sender_id'].astype(str).str.strip().str.upper()
        df['receiver_id'] = df['receiver_id'].astype(str).str.strip().str.upper()
        df['transaction_id'] = df['transaction_id'].astype(str).str.strip()
        
        # Remove self-transactions
        df = df[df['sender_id'] != df['receiver_id']]
        
        # Remove invalid amounts
        df = df[df['amount'] > 0]
        
        # Remove null values
        df = df.dropna(subset=['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'])
        
        # Sort by timestamp
        df = df.sort_values('timestamp')
        
        return df
    
    @staticmethod
    def get_data_quality_report(df: pd.DataFrame) -> Dict:
        """
        Generate data quality report.
        """
        if len(df) == 0:
            return {
                "total_transactions": 0,
                "unique_accounts": 0,
                "date_range": {"start": None, "end": None, "days": 0},
                "amount_stats": {"min": 0, "max": 0, "mean": 0, "median": 0},
                "duplicates_removed": 0,
                "self_transactions_removed": 0,
                "null_values_removed": 0
            }
        
        # Ensure timestamps are datetime objects
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return {
            "total_transactions": len(df),
            "unique_accounts": len(set(df['sender_id'].unique()) | set(df['receiver_id'].unique())),
            "date_range": {
                "start": str(df['timestamp'].min()),
                "end": str(df['timestamp'].max()),
                "days": int((df['timestamp'].max() - df['timestamp'].min()).days)
            },
            "amount_stats": {
                "min": float(df['amount'].min()),
                "max": float(df['amount'].max()),
                "mean": float(df['amount'].mean()),
                "median": float(df['amount'].median())
            },
            "duplicates_removed": 0,
            "self_transactions_removed": 0,
            "null_values_removed": 0
        }


class AccountEnricher:
    """Enriches account data with metadata and business rules."""
    
    @staticmethod
    def detect_account_type(account_id: str, stats: Dict) -> str:
        """
        Detect account type based on ID pattern and statistics.
        """
        account_upper = account_id.upper()
        
        # Check for known patterns
        if any(merchant in account_upper for merchant in ["MERCHANT", "STORE", "SHOP", "MARKET"]):
            return "merchant"
        
        if any(bank in account_upper for bank in ["BANK", "CREDIT", "SAVINGS"]):
            return "bank"
        
        if any(payroll in account_upper for payroll in ["PAYROLL", "SALARY", "WAGE"]):
            return "payroll"
        
        if any(crypto in account_upper for crypto in ["CRYPTO", "BITCOIN", "EXCHANGE"]):
            return "crypto"
        
        # Check statistics
        if stats.get('in_degree', 0) > 50 and stats.get('out_degree', 0) < 10:
            return "likely_merchant"
        
        if stats.get('out_degree', 0) > 50 and stats.get('in_degree', 0) < 10:
            return "likely_payroll"
        
        if stats.get('in_degree', 0) > 20 and stats.get('out_degree', 0) > 20:
            return "likely_exchange"
        
        return "individual"
    
    @staticmethod
    def calculate_risk_factors(account_id: str, stats: Dict) -> Dict:
        """
        Calculate additional risk factors for an account.
        """
        account_upper = account_id.upper()
        
        risk_factors = {
            "high_risk_keywords": any(word in account_upper for word in ["SHELL", "OFFSHORE", "CRYPTO", "CASINO"]),
            "suspicious_pattern": bool(re.search(r'ACC_[A-Z]$', account_id)),  # Generic account names
            "round_amounts": False,  # Would need transaction data
            "geographic_risk": False,  # Would need location data
            "velocity_risk": stats.get('transaction_count', 0) / max(stats.get('days_active', 1), 1) > 10
        }
        
        return risk_factors


class TransactionAnalyzer:
    """Analyzes transaction patterns for quality insights."""
    
    @staticmethod
    def detect_anomalies(df: pd.DataFrame) -> Dict:
        """
        Detect data anomalies that might affect accuracy.
        """
        anomalies = {
            "round_amounts": 0,
            "same_amount_clusters": 0,
            "time_gaps": 0,
            "burst_transactions": 0
        }
        
        # Round amounts (ending in 00)
        anomalies["round_amounts"] = (df['amount'] % 100 == 0).sum()
        
        # Same amount clusters (5+ transactions with exact same amount)
        amount_counts = df['amount'].value_counts()
        anomalies["same_amount_clusters"] = (amount_counts >= 5).sum()
        
        # Time gaps (>7 days between transactions)
        if len(df) > 1:
            df_sorted = df.sort_values('timestamp')
            time_diffs = df_sorted['timestamp'].diff()
            anomalies["time_gaps"] = (time_diffs > pd.Timedelta(days=7)).sum()
        
        # Burst transactions (10+ transactions in 1 hour)
        df['hour'] = df['timestamp'].dt.floor('H')
        hourly_counts = df.groupby('hour').size()
        anomalies["burst_transactions"] = (hourly_counts >= 10).sum()
        
        return anomalies
    
    @staticmethod
    def get_network_metrics(df: pd.DataFrame) -> Dict:
        """
        Calculate network-level metrics.
        """
        all_accounts = set(df['sender_id'].unique()) | set(df['receiver_id'].unique())
        
        return {
            "total_accounts": len(all_accounts),
            "total_transactions": len(df),
            "avg_transactions_per_account": len(df) / len(all_accounts) if all_accounts else 0,
            "network_density": len(df) / (len(all_accounts) * (len(all_accounts) - 1)) if len(all_accounts) > 1 else 0,
            "isolated_accounts": 0  # Would need graph analysis
        }
