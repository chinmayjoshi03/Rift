# Testing Guide

## Quick Start

### 1. Start Both Services

```bash
./start-local.sh
```

This will:
- Install all dependencies
- Start Python service on port 8000
- Start Node.js backend on port 3001

### 2. Test Health Endpoints

```bash
# Python service
curl http://localhost:8000/health

# Node.js backend
curl http://localhost:3001/api/health
```

### 3. Run Complete Analysis

```bash
# Upload CSV and get jobId
curl -X POST http://localhost:3001/api/analyze \
  -F "file=@sample_transactions.csv"

# Response: {"jobId":"uuid-here"}

# Get results (replace with your jobId)
curl http://localhost:3001/api/results/YOUR_JOB_ID | python -m json.tool
```

## Manual Testing Steps

### Test 1: Python Service Direct Call

```bash
curl -X POST http://localhost:8000/detect \
  -F "file=@sample_transactions.csv" \
  -s | python -m json.tool
```

Expected: Full JSON response with suspicious_accounts, fraud_rings, and summary

### Test 2: Node.js Upload

```bash
curl -X POST http://localhost:3001/api/analyze \
  -F "file=@sample_transactions.csv" \
  -v
```

Expected: 
- Status 200
- Response: `{"jobId":"uuid"}`

### Test 3: SSE Stream

```bash
# Get jobId from Test 2, then:
curl -N http://localhost:3001/api/stream/YOUR_JOB_ID
```

Expected events:
```
data: {"type":"connected","message":"Connected to job stream","jobId":"..."}

data: {"type":"PARSING","stage":"parsing","message":"Parsing CSV file","progress":10}

data: {"type":"GRAPH_BUILT","stage":"graph_built","message":"Building transaction graph","progress":25}

data: {"type":"CYCLES_DONE","stage":"cycles_done","message":"Cycle detection complete","progress":50}

data: {"type":"SMURFING_DONE","stage":"smurfing_done","message":"Smurfing detection complete","progress":65}

data: {"type":"SHELLS_DONE","stage":"shells_done","message":"Shell account detection complete","progress":80}

data: {"type":"SCORING_DONE","stage":"scoring_done","message":"Scoring complete","progress":95}

data: {"type":"DONE","stage":"complete","message":"Analysis complete","progress":100}
```

### Test 4: Get Results

```bash
curl http://localhost:3001/api/results/YOUR_JOB_ID \
  -s | python -m json.tool
```

Expected: Complete analysis results

## Sample Data Analysis

The `sample_transactions.csv` contains:
- 3 fraud rings (cycles)
- 1 smurfing pattern (acc004 → multiple accounts)
- 16 total transactions
- 17 unique accounts

Expected detection results:
- 3 fraud rings detected
- 12 suspicious accounts
- Highest risk score: 70 (acc004 - smurfing)
- Cycle members: 60 score each

## Creating Custom Test Data

### Cycle Pattern (Fraud Ring)
```csv
transaction_id,sender_id,receiver_id,amount,timestamp
tx1,A,B,1000,2024-01-01T10:00:00Z
tx2,B,C,950,2024-01-01T11:00:00Z
tx3,C,A,900,2024-01-01T12:00:00Z
```

### Smurfing Pattern (Fan-out)
```csv
transaction_id,sender_id,receiver_id,amount,timestamp
tx1,SMURF,ACC1,9000,2024-01-01T10:00:00Z
tx2,SMURF,ACC2,8500,2024-01-01T10:30:00Z
tx3,SMURF,ACC3,9500,2024-01-01T11:00:00Z
tx4,SMURF,ACC4,8000,2024-01-01T11:30:00Z
tx5,SMURF,ACC5,9200,2024-01-01T12:00:00Z
```

### Shell Account Pattern
```csv
transaction_id,sender_id,receiver_id,amount,timestamp
tx1,SOURCE,SHELL,10000,2024-01-01T10:00:00Z
tx2,SHELL,MID1,3000,2024-01-01T10:15:00Z
tx3,SHELL,MID2,3500,2024-01-01T10:20:00Z
tx4,SHELL,DEST,3000,2024-01-01T10:25:00Z
```

## Troubleshooting

### Port Already in Use

```bash
# Kill processes on port 8000
lsof -ti:8000 | xargs kill -9

# Kill processes on port 3001
lsof -ti:3001 | xargs kill -9
```

### Python Module Not Found

```bash
cd python-model
pip install -r requirements.txt
```

### Node Modules Missing

```bash
cd backend
npm install
```

### Check Running Processes

```bash
# Python service
ps aux | grep "python.*main.py"

# Node.js backend
ps aux | grep "node.*server.js"
```

## Performance Testing

### Load Test with Multiple Files

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/analyze \
    -F "file=@sample_transactions.csv" \
    -s &
done
wait
```

### Measure Response Time

```bash
time curl -X POST http://localhost:8000/detect \
  -F "file=@sample_transactions.csv" \
  -s > /dev/null
```

Expected: < 2 seconds for sample data

## Validation Checklist

- [ ] Python service starts without errors
- [ ] Node.js backend starts without errors
- [ ] Health endpoints return 200
- [ ] CSV upload returns jobId
- [ ] SSE stream sends progress events
- [ ] Results endpoint returns complete JSON
- [ ] Fraud rings detected correctly
- [ ] Suspicious accounts scored properly
- [ ] Summary statistics accurate
- [ ] No memory leaks after multiple requests

## Expected Output Format

```json
{
  "suspicious_accounts": [
    {
      "account_id": "string",
      "suspicion_score": 0-100,
      "flags": ["array", "of", "flags"],
      "total_transactions": 0,
      "total_sent": 0.0,
      "total_received": 0.0,
      "connected_rings": [0, 1]
    }
  ],
  "fraud_rings": [
    {
      "ring_id": 0,
      "members": ["acc1", "acc2", "acc3"],
      "total_flow": 0.0,
      "transaction_count": 0,
      "risk_score": 0-100,
      "cycle_length": 3
    }
  ],
  "summary": {
    "total_accounts": 0,
    "total_transactions": 0,
    "suspicious_accounts_count": 0,
    "fraud_rings_detected": 0,
    "total_flagged_volume": 0.0,
    "analysis_timestamp": "ISO-8601"
  }
}
```

## Stop Services

```bash
# Kill all related processes
pkill -f "python.*main.py"
pkill -f "node.*server.js"

# Or press Ctrl+C if using start-local.sh
```
