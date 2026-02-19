"""
Calibration and feedback system for continuous improvement.
"""

import json
from typing import Dict, List, Tuple
from datetime import datetime
import os


class FeedbackCollector:
    """Collects and stores feedback on detection results."""
    
    def __init__(self, feedback_file: str = "feedback_data.json"):
        self.feedback_file = feedback_file
        self.feedback_data = self._load_feedback()
    
    def _load_feedback(self) -> List[Dict]:
        """Load existing feedback data."""
        if os.path.exists(self.feedback_file):
            try:
                with open(self.feedback_file, 'r') as f:
                    return json.load(f)
            except:
                return []
        return []
    
    def add_feedback(
        self,
        account_id: str,
        predicted_score: float,
        predicted_flags: List[str],
        actual_fraud: bool,
        fraud_type: str = None,
        notes: str = None
    ):
        """Add feedback for a single account."""
        feedback = {
            "account_id": account_id,
            "predicted_score": predicted_score,
            "predicted_flags": predicted_flags,
            "actual_fraud": actual_fraud,
            "fraud_type": fraud_type,
            "notes": notes,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.feedback_data.append(feedback)
        self._save_feedback()
    
    def _save_feedback(self):
        """Save feedback data to file."""
        with open(self.feedback_file, 'w') as f:
            json.dump(self.feedback_data, f, indent=2)
    
    def get_metrics(self) -> Dict:
        """Calculate performance metrics from feedback."""
        if not self.feedback_data:
            return {
                "total_reviews": 0,
                "precision": 0,
                "recall": 0,
                "f1_score": 0
            }
        
        true_positives = sum(1 for f in self.feedback_data if f['actual_fraud'] and f['predicted_score'] >= 40)
        false_positives = sum(1 for f in self.feedback_data if not f['actual_fraud'] and f['predicted_score'] >= 40)
        true_negatives = sum(1 for f in self.feedback_data if not f['actual_fraud'] and f['predicted_score'] < 40)
        false_negatives = sum(1 for f in self.feedback_data if f['actual_fraud'] and f['predicted_score'] < 40)
        
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            "total_reviews": len(self.feedback_data),
            "true_positives": true_positives,
            "false_positives": false_positives,
            "true_negatives": true_negatives,
            "false_negatives": false_negatives,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1_score, 4),
            "accuracy": round((true_positives + true_negatives) / len(self.feedback_data), 4)
        }
    
    def get_false_positive_patterns(self) -> List[Dict]:
        """Identify common patterns in false positives."""
        false_positives = [f for f in self.feedback_data if not f['actual_fraud'] and f['predicted_score'] >= 40]
        
        patterns = {}
        for fp in false_positives:
            for flag in fp['predicted_flags']:
                if flag not in patterns:
                    patterns[flag] = 0
                patterns[flag] += 1
        
        return [{"flag": flag, "count": count} for flag, count in sorted(patterns.items(), key=lambda x: x[1], reverse=True)]
    
    def get_false_negative_patterns(self) -> List[Dict]:
        """Identify common patterns in false negatives."""
        false_negatives = [f for f in self.feedback_data if f['actual_fraud'] and f['predicted_score'] < 40]
        
        return [
            {
                "account_id": fn['account_id'],
                "score": fn['predicted_score'],
                "fraud_type": fn['fraud_type'],
                "notes": fn['notes']
            }
            for fn in false_negatives
        ]


class ConfigurationOptimizer:
    """Optimizes configuration based on feedback."""
    
    def __init__(self, feedback_collector: FeedbackCollector):
        self.feedback = feedback_collector
    
    def suggest_threshold_adjustment(self) -> Dict:
        """Suggest threshold adjustments based on feedback."""
        metrics = self.feedback.get_metrics()
        
        suggestions = {
            "current_metrics": metrics,
            "suggestions": []
        }
        
        # If too many false positives, increase threshold
        if metrics['precision'] < 0.7 and metrics['false_positives'] > 10:
            suggestions['suggestions'].append({
                "parameter": "MIN_SUSPICION_SCORE",
                "current": 40,
                "suggested": 50,
                "reason": f"Precision is low ({metrics['precision']:.2%}), increase threshold to reduce false positives"
            })
        
        # If too many false negatives, decrease threshold
        if metrics['recall'] < 0.7 and metrics['false_negatives'] > 10:
            suggestions['suggestions'].append({
                "parameter": "MIN_SUSPICION_SCORE",
                "current": 40,
                "suggested": 35,
                "reason": f"Recall is low ({metrics['recall']:.2%}), decrease threshold to catch more fraud"
            })
        
        # Analyze false positive patterns
        fp_patterns = self.feedback.get_false_positive_patterns()
        if fp_patterns:
            top_pattern = fp_patterns[0]
            if top_pattern['flag'] == 'fan_out_smurfing' and top_pattern['count'] > 5:
                suggestions['suggestions'].append({
                    "parameter": "MIN_FAN_DEGREE",
                    "current": 5,
                    "suggested": 7,
                    "reason": f"Many false positives with fan_out_smurfing ({top_pattern['count']} cases)"
                })
        
        return suggestions
    
    def generate_optimal_config(self) -> Dict:
        """Generate optimized configuration based on feedback."""
        suggestions = self.suggest_threshold_adjustment()
        
        optimal_config = {
            "MIN_SUSPICION_SCORE": 40,
            "MIN_FAN_DEGREE": 5,
            "TIME_WINDOW_HOURS": 72,
            "SMURFING_THRESHOLD": 10000.0
        }
        
        # Apply suggestions
        for suggestion in suggestions['suggestions']:
            optimal_config[suggestion['parameter']] = suggestion['suggested']
        
        return optimal_config


class PerformanceTracker:
    """Tracks detection performance over time."""
    
    def __init__(self, metrics_file: str = "performance_metrics.json"):
        self.metrics_file = metrics_file
        self.metrics_history = self._load_metrics()
    
    def _load_metrics(self) -> List[Dict]:
        """Load metrics history."""
        if os.path.exists(self.metrics_file):
            try:
                with open(self.metrics_file, 'r') as f:
                    return json.load(f)
            except:
                return []
        return []
    
    def record_analysis(
        self,
        total_accounts: int,
        total_transactions: int,
        suspicious_accounts: int,
        fraud_rings: int,
        processing_time: float,
        config_used: Dict
    ):
        """Record metrics for an analysis run."""
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "total_accounts": total_accounts,
            "total_transactions": total_transactions,
            "suspicious_accounts": suspicious_accounts,
            "fraud_rings": fraud_rings,
            "processing_time_seconds": processing_time,
            "fraud_rate": suspicious_accounts / total_accounts if total_accounts > 0 else 0,
            "config_used": config_used
        }
        
        self.metrics_history.append(metrics)
        self._save_metrics()
    
    def _save_metrics(self):
        """Save metrics history."""
        with open(self.metrics_file, 'w') as f:
            json.dump(self.metrics_history, f, indent=2)
    
    def get_trends(self) -> Dict:
        """Get performance trends over time."""
        if not self.metrics_history:
            return {"message": "No metrics available"}
        
        recent = self.metrics_history[-10:]  # Last 10 runs
        
        return {
            "total_runs": len(self.metrics_history),
            "recent_avg_fraud_rate": sum(m['fraud_rate'] for m in recent) / len(recent),
            "recent_avg_processing_time": sum(m['processing_time_seconds'] for m in recent) / len(recent),
            "recent_avg_suspicious_accounts": sum(m['suspicious_accounts'] for m in recent) / len(recent),
            "recent_avg_fraud_rings": sum(m['fraud_rings'] for m in recent) / len(recent)
        }
