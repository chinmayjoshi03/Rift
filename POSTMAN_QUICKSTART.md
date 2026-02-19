# Postman Quick Start (5 Minutes)

## Step 1: Import Collection (30 seconds)

1. Open Postman
2. Click **"Import"** button (top left)
3. Drag and drop `Fraud_Detection_API.postman_collection.json`
4. Click **"Import"**
5. Done! You'll see "Fraud Detection API" collection with 6 requests

## Step 2: Start Services (1 minute)

Open terminal and run:
```bash
./start-local.sh
```

Wait for:
```
✅ All services running!
```

## Step 3: Test in Postman (3 minutes)

### Test 1: Health Check ✓
1. Click **"1. Health Check - Backend"**
2. Click **"Send"**
3. ✅ Should see: `"status": "healthy"`

### Test 2: Upload CSV ✓
1. Click **"3. Upload CSV for Analysis"**
2. In **Body** tab, click **"Select Files"** next to `file`
3. Choose `sample_transactions.csv` from your project folder
4. Click **"Send"**
5. ✅ Should see: `{"jobId": "some-uuid"}`
6. ✅ jobId is automatically saved!

### Test 3: Get Results ✓
1. **Wait 5 seconds** (let analysis complete)
2. Click **"4. Get Analysis Results"**
3. Click **"Send"**
4. ✅ Should see complete JSON with:
   - `suspicious_accounts` (12 accounts)
   - `fraud_rings` (3 rings)
   - `summary` statistics

## That's It! 🎉

You've successfully tested the entire fraud detection system!

---

## What Each Request Does

| # | Request | What It Does |
|---|---------|--------------|
| 1 | Health Check - Backend | Verifies Node.js + Python are running |
| 2 | Health Check - Python | Verifies Python service directly |
| 3 | Upload CSV | Uploads file, starts analysis, returns jobId |
| 4 | Get Results | Retrieves complete analysis results |
| 5 | SSE Stream | Shows progress events (view only) |
| 6 | Direct Python | Calls Python directly (bypasses Node.js) |

---

## Troubleshooting

### "Could not send request"
**Fix**: Make sure services are running
```bash
./start-local.sh
```

### "Job not found"
**Fix**: Re-run "Upload CSV" to get a new jobId

### "Analysis in progress"
**Fix**: Wait 5 more seconds and try "Get Results" again

---

## Expected Results from Sample Data

```json
{
  "suspicious_accounts": 12,
  "fraud_rings_detected": 3,
  "total_accounts": 17,
  "total_transactions": 16
}
```

**Highest Risk Account**: `acc004` (score: 70)
- Flags: smurfing, high velocity, below threshold

**Fraud Rings**:
- Ring 0: 4 members (acc010, acc011, acc012, acc013)
- Ring 1: 4 members (acc014, acc015, acc016, acc017)
- Ring 2: 3 members (acc001, acc002, acc003)

---

## Pro Tips

### Auto-Save jobId
The collection automatically saves jobId after upload!
- No need to copy/paste
- Just run requests in order

### Run All Tests
1. Click collection → **"Run"**
2. Select all requests
3. Set delay: 10000ms (for request 4)
4. Click **"Run Fraud Detection API"**
5. Watch all tests pass! ✅

### View Test Results
After sending a request:
- Click **"Test Results"** tab
- See all assertions pass ✓

---

## Next Steps

1. ✅ Try with your own CSV file
2. ✅ Test error cases (invalid file, wrong format)
3. ✅ Check the detailed guide: `POSTMAN_GUIDE.md`
4. ✅ Deploy to production (see `DEPLOYMENT.md`)

---

## Need More Help?

- **Detailed Guide**: See `POSTMAN_GUIDE.md`
- **API Docs**: See `README.md`
- **Testing**: See `TESTING.md`
- **Deployment**: See `DEPLOYMENT.md`
