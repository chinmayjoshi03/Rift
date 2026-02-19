# Postman Testing Guide

## Prerequisites

1. **Start both services locally**:
   ```bash
   ./start-local.sh
   ```

2. **Verify services are running**:
   - Python: http://localhost:8000
   - Node.js: http://localhost:3001

## Setup Postman Collection

### Create a New Collection

1. Open Postman
2. Click "New" → "Collection"
3. Name it: "Fraud Detection API"
4. Save

### Set Collection Variables

1. Click on your collection → "Variables" tab
2. Add these variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `base_url` | `http://localhost:3001` | `http://localhost:3001` |
| `python_url` | `http://localhost:8000` | `http://localhost:8000` |
| `job_id` | (leave empty) | (leave empty) |

3. Click "Save"

## Test Requests

### 1. Health Check - Node.js Backend

**Request Name**: Health Check - Backend

**Method**: GET

**URL**: `{{base_url}}/api/health`

**Expected Response** (200 OK):
```json
{
    "status": "healthy",
    "service": "fraud-detection-backend",
    "pythonService": {
        "status": "healthy",
        "service": "fraud-detection-model"
    }
}
```

**Steps**:
1. Click "New" → "Request"
2. Name: "Health Check - Backend"
3. Method: GET
4. URL: `{{base_url}}/api/health`
5. Click "Send"

---

### 2. Health Check - Python Service

**Request Name**: Health Check - Python

**Method**: GET

**URL**: `{{python_url}}/health`

**Expected Response** (200 OK):
```json
{
    "status": "healthy",
    "service": "fraud-detection-model"
}
```

---

### 3. Upload CSV for Analysis

**Request Name**: Upload CSV

**Method**: POST

**URL**: `{{base_url}}/api/analyze`

**Body Type**: form-data

**Body**:
| Key | Type | Value |
|-----|------|-------|
| `file` | File | Select `sample_transactions.csv` |

**Steps**:
1. Create new request
2. Method: POST
3. URL: `{{base_url}}/api/analyze`
4. Go to "Body" tab
5. Select "form-data"
6. Add key: `file`
7. Change type from "Text" to "File" (hover over key, click dropdown)
8. Click "Select Files" and choose `sample_transactions.csv`
9. Click "Send"

**Expected Response** (200 OK):
```json
{
    "jobId": "edbfe45b-dd49-4498-9aa8-8ccd34ca4905"
}
```

**Auto-save jobId** (Optional):
1. Go to "Tests" tab
2. Add this script:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set("job_id", response.jobId);
    console.log("Job ID saved:", response.jobId);
}
```
3. Now the `job_id` variable will be automatically set!

---

### 4. Get Analysis Results

**Request Name**: Get Results

**Method**: GET

**URL**: `{{base_url}}/api/results/{{job_id}}`

**Steps**:
1. Create new request
2. Method: GET
3. URL: `{{base_url}}/api/results/{{job_id}}`
4. **Important**: Wait 5-10 seconds after uploading before calling this
5. Click "Send"

**Expected Response** (200 OK):
```json
{
    "suspicious_accounts": [
        {
            "account_id": "acc004",
            "suspicion_score": 70,
            "flags": [
                "fan_out_smurfing",
                "high_velocity",
                "below_threshold_structuring",
                "multiple_patterns"
            ],
            "total_transactions": 5,
            "total_sent": 14000,
            "total_received": 0,
            "connected_rings": []
        }
    ],
    "fraud_rings": [
        {
            "ring_id": 0,
            "members": ["acc010", "acc011", "acc012", "acc013"],
            "total_flow": 57000,
            "transaction_count": 4,
            "risk_score": 80,
            "cycle_length": 4
        }
    ],
    "summary": {
        "total_accounts": 17,
        "total_transactions": 16,
        "suspicious_accounts_count": 12,
        "fraud_rings_detected": 3,
        "total_flagged_volume": 220200,
        "analysis_timestamp": "2024-01-15T10:30:00Z"
    }
}
```

**If still processing** (202 Accepted):
```json
{
    "status": "processing",
    "progress": 50,
    "message": "Analysis in progress"
}
```

---

### 5. Direct Python Detection (Optional)

**Request Name**: Direct Python Detection

**Method**: POST

**URL**: `{{python_url}}/detect`

**Body Type**: form-data

**Body**:
| Key | Type | Value |
|-----|------|-------|
| `file` | File | Select `sample_transactions.csv` |

**Steps**:
1. Create new request
2. Method: POST
3. URL: `{{python_url}}/detect`
4. Body → form-data
5. Add key: `file` (type: File)
6. Select `sample_transactions.csv`
7. Click "Send"

**Expected Response**: Same as "Get Results" above (full JSON)

**Note**: This bypasses Node.js and calls Python directly. Useful for testing Python service independently.

---

## Testing SSE Stream (Advanced)

Postman doesn't natively support Server-Sent Events well, but you can test it:

### Option 1: Use Browser or curl

```bash
curl -N http://localhost:3001/api/stream/YOUR_JOB_ID
```

### Option 2: Postman Workaround

**Request Name**: SSE Stream

**Method**: GET

**URL**: `{{base_url}}/api/stream/{{job_id}}`

**Steps**:
1. Create new request
2. Method: GET
3. URL: `{{base_url}}/api/stream/{{job_id}}`
4. Click "Send"

**Note**: Postman will show the response but won't stream in real-time. You'll see all events at once after completion.

---

## Complete Testing Workflow

### Step-by-Step Test Flow

1. **Test Health Checks**
   - Run "Health Check - Backend" ✓
   - Run "Health Check - Python" ✓
   - Both should return 200 OK

2. **Upload CSV**
   - Run "Upload CSV" ✓
   - Should return jobId
   - jobId automatically saved to collection variable

3. **Wait 5-10 seconds**
   - Let the analysis complete

4. **Get Results**
   - Run "Get Results" ✓
   - Should return complete analysis

5. **Verify Results**
   - Check `fraud_rings_detected` = 3
   - Check `suspicious_accounts_count` = 12
   - Check highest `suspicion_score` = 70

---

## Troubleshooting

### Error: "Cannot POST /api/analyze"
- **Cause**: Node.js backend not running
- **Fix**: Run `./start-local.sh`

### Error: "Python service not responding"
- **Cause**: Python service not running
- **Fix**: Check if port 8000 is in use: `lsof -ti:8000`

### Error: "Job not found"
- **Cause**: Invalid jobId
- **Fix**: Re-run "Upload CSV" to get new jobId

### Error: "Only CSV files are allowed"
- **Cause**: Wrong file type
- **Fix**: Ensure you're uploading a .csv file

### Response: 202 "Analysis in progress"
- **Cause**: Analysis not complete yet
- **Fix**: Wait a few more seconds and retry

---

## Advanced: Create Test Suite

### Runner Configuration

1. Click on collection → "Run"
2. Select requests to run:
   - ✓ Health Check - Backend
   - ✓ Health Check - Python
   - ✓ Upload CSV
   - ✓ Get Results (add 10s delay)
3. Set delay between requests: 10000ms (for Get Results)
4. Click "Run Fraud Detection API"

### Add Tests to Requests

#### For "Health Check - Backend":
```javascript
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Service is healthy", function () {
    const response = pm.response.json();
    pm.expect(response.status).to.eql("healthy");
});

pm.test("Python service is healthy", function () {
    const response = pm.response.json();
    pm.expect(response.pythonService.status).to.eql("healthy");
});
```

#### For "Upload CSV":
```javascript
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("JobId is returned", function () {
    const response = pm.response.json();
    pm.expect(response.jobId).to.be.a('string');
    pm.expect(response.jobId).to.have.lengthOf.above(0);
});

// Save jobId
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set("job_id", response.jobId);
}
```

#### For "Get Results":
```javascript
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Has suspicious accounts", function () {
    const response = pm.response.json();
    pm.expect(response.suspicious_accounts).to.be.an('array');
});

pm.test("Has fraud rings", function () {
    const response = pm.response.json();
    pm.expect(response.fraud_rings).to.be.an('array');
});

pm.test("Has summary", function () {
    const response = pm.response.json();
    pm.expect(response.summary).to.be.an('object');
    pm.expect(response.summary.total_accounts).to.be.above(0);
});

pm.test("Detected fraud rings", function () {
    const response = pm.response.json();
    pm.expect(response.summary.fraud_rings_detected).to.eql(3);
});
```

---

## Export/Import Collection

### Export Collection

1. Click on collection → "..." → "Export"
2. Choose "Collection v2.1"
3. Save as `Fraud_Detection_API.postman_collection.json`

### Import Collection

1. Click "Import"
2. Drag and drop the JSON file
3. Collection will be imported with all requests

---

## Testing with Different CSV Files

### Create Custom Test Data

1. Create new CSV file: `test_cycle.csv`
```csv
transaction_id,sender_id,receiver_id,amount,timestamp
tx1,A,B,1000,2024-01-01T10:00:00Z
tx2,B,C,950,2024-01-01T11:00:00Z
tx3,C,A,900,2024-01-01T12:00:00Z
```

2. In "Upload CSV" request, select this file instead
3. Run the request
4. Check results for cycle detection

### Test Edge Cases

**Empty CSV**:
- Expected: 400 Bad Request

**Invalid columns**:
- Expected: 400 Bad Request with error message

**Large file (>50MB)**:
- Expected: 413 Payload Too Large

---

## Quick Reference

### Base URLs
- Node.js Backend: `http://localhost:3001`
- Python Service: `http://localhost:8000`

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Backend health |
| `/health` | GET | Python health |
| `/api/analyze` | POST | Upload CSV |
| `/api/results/:jobId` | GET | Get results |
| `/api/stream/:jobId` | GET | SSE stream |
| `/detect` | POST | Direct Python |

### Expected Response Times
- Health checks: <100ms
- Upload: <500ms
- Analysis: 2-10 seconds
- Results: <100ms

---

## Video Tutorial Steps

1. **Open Postman**
2. **Create Collection**: "Fraud Detection API"
3. **Add Variables**: base_url, python_url
4. **Test Health**: Both services
5. **Upload CSV**: With form-data file
6. **Copy jobId**: From response
7. **Get Results**: Using jobId
8. **Verify**: 3 fraud rings detected

**Done!** ✅

---

## Need Help?

- Check services are running: `./start-local.sh`
- View logs: Check terminal output
- Test with curl: See TESTING.md
- Check ports: `lsof -ti:8000` and `lsof -ti:3001`
