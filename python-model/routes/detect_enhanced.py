"""
Enhanced detection endpoint with configuration support.
This is a NEW endpoint that doesn't modify the existing /detect endpoint.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Optional
import time
import pandas as pd

from graph.builder import build_graph_from_csv
from graph.cycle_detector import detect_cycles
from graph.smurfing_detector import detect_smurfing
from graph.shell_detector import detect_shell_accounts
from utils.json_builder import build_output
from utils.data_validator import DataValidator, TransactionAnalyzer
from utils.enhanced_detector import (
    EnhancedCycleDetector,
    EnhancedSmurfingDetector,
    EnhancedShellDetector,
    EnhancedScorer,
    EnhancedFalsePositiveGuard
)
from utils.calibration import PerformanceTracker
from utils.error_handlers import (
    safe_read_csv,
    safe_parse_datetime,
    validate_required_columns,
    validate_data_types,
    DataValidationError,
    DataProcessingError
)
from utils.file_processor import FileProcessor
from config import DetectionConfig, PresetConfigs


router = APIRouter()


@router.post("/detect/enhanced")
async def detect_fraud_enhanced(
    file: UploadFile = File(...),
    preset: Optional[str] = Query(None, description="Configuration preset: aggressive, conservative, balanced"),
    min_score: Optional[float] = Query(None, description="Minimum suspicion score threshold"),
    enable_validation: bool = Query(True, description="Enable data validation and cleaning")
):
    """
    Enhanced fraud detection endpoint with configurable parameters.
    
    Query Parameters:
    - preset: Use predefined configuration (aggressive, conservative, balanced)
    - min_score: Override minimum suspicion score threshold
    - enable_validation: Enable/disable data validation and cleaning
    
    Returns same format as /detect but with enhanced accuracy.
    """
    start_time = time.time()
    
    # Step 1: Async file reading (FastAPI best practice)
    csv_bytes = await FileProcessor.read_upload_file_async(file)
    
    # Step 2: Estimate file size and determine processing strategy
    size_info = FileProcessor.estimate_csv_size(csv_bytes)
    
    # Load configuration
    if preset == "aggressive":
        config = PresetConfigs.aggressive()
    elif preset == "conservative":
        config = PresetConfigs.conservative()
    else:
        config = DetectionConfig()
    
    # Override specific parameters if provided
    if min_score is not None:
        config.MIN_SUSPICION_SCORE = min_score
    
    # Step 3: Read and validate CSV with memory optimization
    if enable_validation:
        # Use optimized CSV reading
        df = FileProcessor.read_csv_optimized(
            csv_bytes,
            use_chunking=size_info['use_chunking']
        )
        
        # Get memory usage before optimization
        memory_before = FileProcessor.get_memory_usage(df)
        
        # Validate required columns
        required_cols = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp']
        validate_required_columns(df, required_cols)
        
        # Validate data types and values
        validate_data_types(df)
        
        # Safe datetime parsing
        df = safe_parse_datetime(df, 'timestamp')
        
        # Clean data
        df_clean = DataValidator.clean_data(df)
        
        # Get memory usage after optimization
        memory_after = FileProcessor.get_memory_usage(df_clean)
        
        # Get quality report
        quality_report = DataValidator.get_data_quality_report(df_clean)
        quality_report['memory_optimization'] = {
            "before_mb": memory_before['total_mb'],
            "after_mb": memory_after['total_mb'],
            "reduction_percent": round(
                (1 - memory_after['total_mb'] / memory_before['total_mb']) * 100, 2
            ) if memory_before['total_mb'] > 0 else 0
        }
        
        # Rebuild CSV bytes from cleaned data
        csv_bytes = df_clean.to_csv(index=False).encode()
    
    # Step 4: Build graph
    graph = build_graph_from_csv(csv_bytes)
    
    # Step 5: Enhanced cycle detection
    cycle_detector = EnhancedCycleDetector(config)
    fraud_rings = cycle_detector.detect(graph, lambda g: detect_cycles(g))
    
    cycle_members = set()
    for ring in fraud_rings:
        cycle_members.update(ring['members'])
    
    # Step 6: Enhanced smurfing detection
    smurfing_detector = EnhancedSmurfingDetector(config)
    smurfing_accounts = smurfing_detector.detect(graph, lambda g: detect_smurfing(g))
    
    # Step 7: Enhanced shell detection
    shell_detector = EnhancedShellDetector(config)
    shell_accounts = shell_detector.detect(graph, lambda g: detect_shell_accounts(g))
    
    # Step 8: Enhanced scoring
    scorer = EnhancedScorer(config)
    scored_accounts = scorer.score_accounts(
        graph,
        cycle_members,
        smurfing_accounts,
        shell_accounts,
        fraud_rings
    )
    
    # Step 9: Enhanced false positive filtering
    fp_guard = EnhancedFalsePositiveGuard(config)
    filtered_accounts = fp_guard.filter(
        scored_accounts,
        graph,
        cycle_members
    )
    
    # Step 10: Build output
    result = build_output(filtered_accounts, fraud_rings, graph, processing_time)
    
    # Step 11: Track performance
    processing_time = time.time() - start_time
    tracker = PerformanceTracker()
    tracker.record_analysis(
        total_accounts=len(graph.node_set),
        total_transactions=len(graph.transactions) if graph.transactions is not None else 0,
        suspicious_accounts=len(filtered_accounts),
        fraud_rings=len(fraud_rings),
        processing_time=processing_time,
        config_used=config.get_config_summary()
    )
    
    # Add metadata to response
    result['metadata'] = {
        "processing_time_seconds": round(processing_time, 2),
        "config_preset": preset or "default",
        "data_validation_enabled": enable_validation,
        "file_size_info": size_info,
        "configuration_used": config.get_config_summary()
    }
    
    if enable_validation:
        result['metadata']['data_quality'] = quality_report
    
    return result


@router.get("/config")
async def get_current_config():
    """Get current detection configuration."""
    config = DetectionConfig()
    return {
        "current_config": config.get_config_summary(),
        "available_presets": ["aggressive", "conservative", "balanced"],
        "description": {
            "aggressive": "Catches more fraud, more false positives",
            "conservative": "Fewer false positives, might miss some fraud",
            "balanced": "Default balanced configuration"
        }
    }


@router.get("/config/presets/{preset_name}")
async def get_preset_config(preset_name: str):
    """Get configuration for a specific preset."""
    if preset_name == "aggressive":
        config = PresetConfigs.aggressive()
    elif preset_name == "conservative":
        config = PresetConfigs.conservative()
    elif preset_name == "balanced":
        config = PresetConfigs.balanced()
    else:
        raise HTTPException(status_code=404, detail="Preset not found")
    
    return {
        "preset": preset_name,
        "config": config.get_config_summary()
    }


@router.get("/metrics")
async def get_performance_metrics():
    """Get performance metrics and trends."""
    tracker = PerformanceTracker()
    return {
        "trends": tracker.get_trends(),
        "recent_runs": tracker.metrics_history[-5:] if tracker.metrics_history else []
    }
