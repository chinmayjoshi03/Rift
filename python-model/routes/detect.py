"""POST /detect endpoint handler."""

from fastapi import APIRouter, UploadFile, File, HTTPException
from graph.builder import build_graph_from_csv
from graph.cycle_detector import detect_cycles
from graph.smurfing_detector import detect_smurfing
from graph.shell_detector import detect_shell_accounts
from graph.scorer import score_accounts
from graph.false_positive_guard import filter_false_positives
from utils.json_builder import build_output


router = APIRouter()


@router.post("/detect")
async def detect_fraud(file: UploadFile = File(...)):
    """
    Main detection endpoint.
    
    Accepts CSV file and returns complete fraud detection results.
    """
    import time
    start_time = time.time()
    
    try:
        # Read CSV bytes
        csv_bytes = await file.read()
        
        # Step 1: Build graph (PARSING + GRAPH_BUILT)
        graph = build_graph_from_csv(csv_bytes)
        
        # Step 2: Detect cycles (CYCLES_DONE)
        fraud_rings = detect_cycles(graph)
        cycle_members = set()
        for ring in fraud_rings:
            cycle_members.update(ring['members'])
        
        # Step 3: Detect smurfing patterns (SMURFING_DONE)
        smurfing_accounts = detect_smurfing(graph)
        
        # Step 4: Detect shell accounts (SHELLS_DONE)
        shell_accounts = detect_shell_accounts(graph)
        
        # Step 5: Score all flagged accounts (SCORING_DONE)
        scored_accounts = score_accounts(
            graph,
            cycle_members,
            smurfing_accounts,
            shell_accounts,
            fraud_rings
        )
        
        # Step 6: Filter false positives
        filtered_accounts = filter_false_positives(
            scored_accounts,
            graph,
            cycle_members
        )
        
        # Step 7: Build final output
        processing_time = time.time() - start_time
        result = build_output(filtered_accounts, fraud_rings, graph, processing_time)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
