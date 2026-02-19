# Fraud Detection System - Backend & Python Model

Complete backend implementation for real-time fraud detection in financial transaction networks.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐
│  Node.js API    │────▶│  Python Model    │
│  (Railway)      │     │  (Render)        │
│  Port 3001      │     │  Port 8000       │
└─────────────────┘     └──────────────────┘
```

## Components

### Python Model Service (`python-model/`)
FastAPI service that runs fraud detection algorithms:
- **Cycle Detection**: Tarjan's SCC + DFS enumeration
- **Smurfing Detection**: Fan-in/fan-out pattern analysis
- **Shell Account Detection**: Intermediary node identification
- **Scoring Engine**: Multi-signal suspicion scoring
- **False Positive Guard**: Merchant/payroll/exchange filtering

### Node.js Backend (`backend/`)
Express.js API gateway that:
- Accepts CSV uploads
- Manages job state
- Streams progress via SSE
- Forwards requests to Python service
- Serves results to frontend

## Quick Start

### Python Model Service

```bash
cd python-model
pip install -r requirements.txt
python main.py
```

Service runs on `http://localhost:8000`

### Node.js Backend

```bash
cd backend
npm install
npm start
```

Service runs on `http://localhost:3001`

## API Endpoints

### Node.js Backend

#### POST /api/analyze
Upload CSV file for analysis
```bash
curl -X POST http://localhost:3001/api/analyze \
  -F "file=@transactions.csv"
```

Response:
```json
{
  "jobId": "uuid-here"
}
```

#### GET /api/stream/:jobId
Server-Sent Events stream for progress
```bash
curl http://localhost:3001/api/stream/uuid-here
```

Events:
- `PARSING` (10%)
- `GRAPH_BUILT` (25%)
- `CYCLES_DONE` (50%)
- `SMURFING_DONE` (65%)
- `SHELLS_DONE` (80%)
- `SCORING_DONE` (95%)
- `DONE` (100%)

#### GET /api/results/:jobId
Get final results
```bash
curl http://localhost:3001/api/results/uuid-here
```

#### GET /api/health
Health check
```bash
curl http://localhost:3001/api/health
```

### Python Model Service

#### POST /detect
Direct detection endpoint (used by Node.js)
```bash
curl -X POST http://localhost:8000/detect \
  -F "file=@transactions.csv"
```

#### GET /health
Health check
```bash
curl http://localhost:8000/health
```

## CSV Format

Required columns:
- `transaction_id`: Unique transaction identifier
- `sender_id`: Sender account ID
- `receiver_id`: Receiver account ID
- `amount`: Transaction amount (numeric)
- `timestamp`: Transaction timestamp (ISO 8601 or parseable format)

Example:
```csv
transaction_id,sender_id,receiver_id,amount,timestamp
tx001,acc001,acc002,5000.00,2024-01-01T10:00:00Z
tx002,acc002,acc003,4900.00,2024-01-01T11:00:00Z
```

## Output Format

```json
{
  "suspicious_accounts": [
    {
      "account_id": "acc001",
      "suspicion_score": 85.0,
      "flags": ["cycle_member", "high_velocity"],
      "total_transactions": 15,
      "total_sent": 50000.00,
      "total_received": 45000.00,
      "connected_rings": [0, 2]
    }
  ],
  "fraud_rings": [
    {
      "ring_id": 0,
      "members": ["acc001", "acc002", "acc003"],
      "total_flow": 15000.00,
      "transaction_count": 6,
      "risk_score": 75.0,
      "cycle_length": 3
    }
  ],
  "summary": {
    "total_accounts": 100,
    "total_transactions": 500,
    "suspicious_accounts_count": 12,
    "fraud_rings_detected": 3,
    "total_flagged_volume": 250000.00,
    "analysis_timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Environment Variables

### Python Model
```env
PORT=8000
```

### Node.js Backend
```env
PORT=3001
PYTHON_SERVICE_URL=http://localhost:8000
```

## Deployment

### Python Model (Render)
1. Connect GitHub repository
2. Select `python-model` directory
3. Set environment: Python 3.11+
4. Build command: `pip install -r requirements.txt`
5. Start command: `python main.py`
6. Set `PORT=8000`

### Node.js Backend (Railway)
1. Connect GitHub repository
2. Select `backend` directory
3. Railway auto-detects Node.js
4. Set environment variables:
   - `PORT=3001`
   - `PYTHON_SERVICE_URL=https://your-model.onrender.com`

## Testing

### Test Python Service
```bash
cd python-model
python -m pytest tests/  # Add tests as needed
```

### Test Node.js Backend
```bash
cd backend
npm test  # Add tests as needed
```

### Manual End-to-End Test
1. Start Python service: `cd python-model && python main.py`
2. Start Node.js backend: `cd backend && npm start`
3. Upload test CSV:
```bash
curl -X POST http://localhost:3001/api/analyze \
  -F "file=@test_transactions.csv"
```
4. Monitor progress:
```bash
curl http://localhost:3001/api/stream/<jobId>
```
5. Get results:
```bash
curl http://localhost:3001/api/results/<jobId>
```

## Detection Algorithms

### Cycle Detection
- Uses Tarjan's algorithm for Strongly Connected Components
- DFS enumeration for cycles of length 3-5
- Risk scoring based on flow uniformity and volume

### Smurfing Detection
- 72-hour sliding window analysis
- Fan-in/fan-out degree checking (≥5)
- Below-threshold amount validation (<$10,000)

### Shell Account Detection
- Pass-through ratio analysis (0.8-1.2)
- Chain length validation (≥3 hops)
- High velocity checking (<24 hours)

### Scoring System
- Cycle member: +50
- Fan-in/out smurfing: +30 each
- Shell account: +20
- High velocity: +10
- Below-threshold: +20
- Multiple patterns: +10
- Cap: 100.0

### False Positive Filtering
- Merchant pattern suppression
- Payroll pattern suppression
- Exchange hub suppression
- Minimum score threshold: 40

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── analyze.js          # API endpoints
│   │   ├── services/
│   │   │   ├── jobStore.js         # Job state management
│   │   │   ├── sseManager.js       # SSE broadcasting
│   │   │   ├── pythonClient.js     # Python service client
│   │   │   └── fileHandler.js      # File upload handling
│   │   └── server.js               # Express entry point
│   ├── package.json
│   └── .env.example
│
└── python-model/
    ├── graph/
    │   ├── builder.py              # Graph construction
    │   ├── cycle_detector.py       # Cycle detection
    │   ├── smurfing_detector.py    # Smurfing patterns
    │   ├── shell_detector.py       # Shell accounts
    │   ├── scorer.py               # Scoring engine
    │   └── false_positive_guard.py # FP filtering
    ├── models/
    │   ├── graph_data.py           # Data structures
    │   └── output_schema.py        # Pydantic schemas
    ├── routes/
    │   └── detect.py               # Detection endpoint
    ├── utils/
    │   └── json_builder.py         # Output formatting
    ├── main.py                     # FastAPI entry point
    ├── requirements.txt
    └── .env.example
```

## Performance

- Typical processing time: 10-25 seconds for 10,000 transactions
- Memory usage: ~500MB for 50,000 transactions
- Supports CSV files up to 50MB

## License

MIT
