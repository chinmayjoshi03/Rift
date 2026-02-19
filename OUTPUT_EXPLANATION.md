# Fraud Detection Output - Complete Field Explanation

## Overview

The API returns a JSON object with three main sections:
1. **suspicious_accounts** - Individual accounts flagged as suspicious
2. **fraud_rings** - Detected circular money flow patterns (cycles)
3. **summary** - Overall statistics about the analysis

---

## 1. Suspicious Accounts Array

Each suspicious account object contains detailed information about why it was flagged.

### Example Account:
```json
{
  "account_id": "ACC_K",
  "suspicion_score": 70,
  "flags": [
    "fan_out_smurfing",
    "high_velocity",
    "below_threshold_structuring",
    "multiple_patterns"
  ],
  "total_transactions": 7,
  "total_sent": 3220,
  "total_received": 0,
  "connected_rings": []
}
```

### Field Descriptions:

#### `account_id` (string)
- **What**: Unique identifier for the account
- **Example**: `"ACC_K"`, `"ACC_Z"`, `"MERCHANT_BIG"`
- **Purpose**: Identifies which account is suspicious

#### `suspicion_score` (number, 0-100)
- **What**: Overall risk score for this account
- **Range**: 0 (not suspicious) to 100 (highly suspicious)
- **Calculation**: Sum of all flag scores, capped at 100
- **Interpretation**:
  - **90-100**: Extremely high risk - immediate investigation
  - **70-89**: High risk - priority review
  - **50-69**: Medium risk - monitor closely
  - **40-49**: Low risk - routine check
  - **<40**: Filtered out (not included in results)

**Score Breakdown**:
- Cycle member: +50 points
- Fan-in smurfing: +30 points
- Fan-out smurfing: +30 points
- Shell account: +20 points
- High velocity: +10 points
- Below-threshold structuring: +20 points
- Multiple patterns: +10 points

#### `flags` (array of strings)
- **What**: List of suspicious patterns detected for this account
- **Purpose**: Explains WHY the account is flagged

**Possible Flags**:

1. **`"cycle_member"`**
   - Account is part of a circular money flow (fraud ring)
   - Money goes: A → B → C → A
   - Indicates potential money laundering

2. **`"fan_out_smurfing"`**
   - Account sends money to MANY accounts in short time
   - Pattern: ONE account → MANY accounts
   - Example: ACC_K sends to 7 different accounts
   - Indicates structuring to avoid reporting thresholds

3. **`"fan_in_smurfing"`**
   - Account receives money from MANY accounts in short time
   - Pattern: MANY accounts → ONE account
   - Example: ACC_Z receives from 7 different accounts
   - Indicates collection point for structured transactions

4. **`"shell_account"`**
   - Account acts as intermediary (pass-through)
   - Money in ≈ Money out
   - Part of transaction chains ≥3 hops
   - Indicates layering in money laundering

5. **`"high_velocity"`**
   - More than 10 transactions per day
   - OR all transactions within same day
   - Indicates rapid movement of funds

6. **`"below_threshold_structuring"`**
   - 70%+ of transactions below $10,000
   - AND at least 5 transactions
   - Indicates deliberate avoidance of reporting requirements

7. **`"multiple_patterns"`**
   - Account exhibits 3 or more different suspicious patterns
   - Bonus flag indicating complex fraud scheme

#### `total_transactions` (number)
- **What**: Total number of transactions (sent + received)
- **Example**: `7` means account was involved in 7 transactions
- **Purpose**: Shows activity level

#### `total_sent` (number)
- **What**: Total amount of money SENT by this account
- **Unit**: Currency units (e.g., dollars)
- **Example**: `3220` means $3,220 sent
- **Note**: `0` means account only receives money

#### `total_received` (number)
- **What**: Total amount of money RECEIVED by this account
- **Unit**: Currency units (e.g., dollars)
- **Example**: `3220` means $3,220 received
- **Note**: `0` means account only sends money

#### `connected_rings` (array of numbers)
- **What**: IDs of fraud rings this account belongs to
- **Example**: `[0]` means member of fraud ring #0
- **Example**: `[]` means not part of any detected ring
- **Purpose**: Links accounts to specific fraud rings

---

## 2. Fraud Rings Array

Each fraud ring represents a detected circular money flow pattern.

### Example Ring:
```json
{
  "ring_id": 0,
  "members": ["ACC_G", "ACC_H", "ACC_I", "ACC_J"],
  "total_flow": 37500,
  "transaction_count": 4,
  "risk_score": 80,
  "cycle_length": 4
}
```

### Field Descriptions:

#### `ring_id` (number)
- **What**: Unique identifier for this fraud ring
- **Example**: `0`, `1`, `2`
- **Purpose**: Reference number for this specific ring
- **Note**: Used in `connected_rings` field of suspicious accounts

#### `members` (array of strings)
- **What**: List of all accounts participating in this ring
- **Example**: `["ACC_G", "ACC_H", "ACC_I", "ACC_J"]`
- **Pattern**: Money flows in a circle through these accounts
- **Interpretation**: 
  - Ring 0: ACC_G → ACC_H → ACC_I → ACC_J → ACC_G
  - Ring 1: ACC_A → ACC_B → ACC_C → ACC_A
  - Ring 2: ACC_D → ACC_E → ACC_F → ACC_D

#### `total_flow` (number)
- **What**: Total amount of money that flowed through the ring
- **Unit**: Currency units
- **Example**: `37500` means $37,500 total
- **Calculation**: Sum of all transaction amounts in the cycle
- **Interpretation**: Higher flow = more significant fraud

#### `transaction_count` (number)
- **What**: Number of transactions that form this ring
- **Example**: `4` means 4 transactions complete the cycle
- **Note**: Can be higher than cycle_length if multiple transactions between same accounts

#### `risk_score` (number, 0-100)
- **What**: Risk level of this specific fraud ring
- **Range**: 0-100
- **Factors**:
  - Amount uniformity (similar amounts = higher risk)
  - Transaction volume (more transactions = higher risk)
  - Cycle length (longer cycles = higher risk)
- **Interpretation**:
  - **80-100**: Very high risk - sophisticated scheme
  - **70-79**: High risk - clear fraud pattern
  - **60-69**: Medium risk - suspicious pattern
  - **<60**: Lower risk - may be legitimate

#### `cycle_length` (number)
- **What**: Number of unique accounts in the cycle
- **Example**: `4` means 4 accounts form the ring
- **Range**: 3-5 (system detects cycles of length 3 to 5)
- **Interpretation**:
  - Length 3: Simple triangle (A→B→C→A)
  - Length 4: Square pattern (A→B→C→D→A)
  - Length 5: Pentagon pattern (A→B→C→D→E→A)

---

## 3. Summary Object

Overall statistics about the entire analysis.

### Example:
```json
{
  "total_accounts": 37,
  "total_transactions": 50,
  "suspicious_accounts_count": 13,
  "fraud_rings_detected": 3,
  "total_flagged_volume": 99050,
  "analysis_timestamp": "2026-02-19T09:08:20.456707Z"
}
```

### Field Descriptions:

#### `total_accounts` (number)
- **What**: Total number of unique accounts in the dataset
- **Example**: `37` means 37 different accounts
- **Includes**: Both suspicious and non-suspicious accounts
- **Purpose**: Shows dataset size

#### `total_transactions` (number)
- **What**: Total number of transactions analyzed
- **Example**: `50` means 50 transactions in the CSV
- **Purpose**: Shows data volume processed

#### `suspicious_accounts_count` (number)
- **What**: Number of accounts flagged as suspicious
- **Example**: `13` out of 37 accounts flagged
- **Percentage**: 13/37 = 35% of accounts are suspicious
- **Purpose**: Shows fraud prevalence

#### `fraud_rings_detected` (number)
- **What**: Number of circular money flow patterns found
- **Example**: `3` fraud rings detected
- **Purpose**: Shows organized fraud schemes

#### `total_flagged_volume` (number)
- **What**: Total money involved with ALL suspicious accounts
- **Unit**: Currency units
- **Example**: `99050` means $99,050 total
- **Calculation**: Sum of (total_sent + total_received) for all suspicious accounts
- **Purpose**: Shows financial impact of fraud

#### `analysis_timestamp` (string)
- **What**: When the analysis was completed
- **Format**: ISO 8601 (YYYY-MM-DDTHH:MM:SS.ffffffZ)
- **Example**: `"2026-02-19T09:08:20.456707Z"`
- **Timezone**: UTC (Z = Zulu time)
- **Purpose**: Audit trail and result freshness

---

## Real-World Interpretation

### Your Results Analysis:

#### High-Risk Accounts (Score 70):

**1. ACC_K - Fan-Out Smurfing**
```
Score: 70
Pattern: Sends to many accounts
Total sent: $3,220 across 7 transactions
Average per transaction: ~$460
Red flags: Below threshold, high velocity, multiple patterns
Interpretation: Likely structuring large amount into small pieces
```

**2. ACC_Z - Fan-In Smurfing**
```
Score: 70
Pattern: Receives from many accounts
Total received: $3,220 from 7 transactions
Average per transaction: ~$460
Red flags: Collection point, high velocity, multiple patterns
Interpretation: Likely collecting structured funds
```

**3. MERCHANT_BIG - Suspicious Merchant**
```
Score: 70
Pattern: Sends to many accounts
Total sent: $6,750 across 5 transactions
Average per transaction: ~$1,350
Red flags: High volume, below threshold, multiple patterns
Interpretation: May be complicit in structuring scheme
```

#### Medium-Risk Accounts (Score 60):

**Fraud Ring #0 Members (ACC_G, ACC_H, ACC_I, ACC_J)**
```
Score: 60 each
Pattern: Circular money flow
Total flow: $37,500
Red flags: Cycle member, high velocity
Interpretation: Sophisticated layering scheme
Money path: ACC_G → ACC_H → ACC_I → ACC_J → ACC_G
```

#### Lower-Risk Accounts (Score 50):

**Fraud Ring #1 & #2 Members**
```
Score: 50 each
Pattern: Smaller circular flows
Total flow: ~$2,600-$2,800 each ring
Red flags: Cycle member only
Interpretation: Possible legitimate business cycles or smaller fraud
```

---

## Fraud Pattern Summary

### Detected Schemes:

1. **Smurfing Operation**
   - ACC_K (sender) → 7 accounts → ACC_Z (receiver)
   - Total: $3,220 structured
   - Purpose: Avoid $10,000 reporting threshold

2. **Large Layering Ring**
   - 4 accounts moving $37,500 in circles
   - High velocity, same-day transactions
   - Purpose: Obscure money origin

3. **Two Smaller Rings**
   - 3 accounts each, ~$2,700 per ring
   - Lower risk, may be legitimate

### Risk Distribution:
- **High Risk (70)**: 3 accounts - $13,190 volume
- **Medium Risk (60)**: 4 accounts - $37,500 volume
- **Lower Risk (50)**: 6 accounts - $5,430 volume

### Recommended Actions:
1. **Immediate**: Investigate ACC_K and ACC_Z smurfing pair
2. **Priority**: Review Ring #0 (4-account, $37,500 cycle)
3. **Monitor**: Rings #1 and #2 for pattern changes
4. **Report**: File SARs for accounts with score ≥70

---

## Flag Combinations Meaning

### Common Patterns:

**Cycle + High Velocity (Score 60)**
- Part of fraud ring with rapid transactions
- Moderate risk - organized scheme

**Fan-out + High Velocity + Below Threshold + Multiple (Score 70)**
- Structuring operation
- High risk - deliberate evasion

**Fan-in + High Velocity + Below Threshold + Multiple (Score 70)**
- Collection point for structured funds
- High risk - receiving end of scheme

**Cycle Only (Score 50)**
- Simple circular flow
- Lower risk - may be legitimate business

---

## Using This Data

### For Compliance Officers:
1. Sort by `suspicion_score` (highest first)
2. Review `flags` to understand pattern type
3. Check `connected_rings` to find related accounts
4. Use `total_flagged_volume` for SAR filing decisions

### For Investigators:
1. Start with highest risk accounts
2. Map fraud rings using `members` arrays
3. Trace money flow using `total_sent`/`total_received`
4. Look for connections between rings

### For Analysts:
1. Calculate fraud rate: `suspicious_accounts_count / total_accounts`
2. Assess impact: `total_flagged_volume / total transaction volume`
3. Identify patterns: Group by common flags
4. Track trends: Compare `analysis_timestamp` across runs

---

## API Response Structure

```
Root Object
├── suspicious_accounts []        ← Individual flagged accounts
│   ├── account_id               ← Who
│   ├── suspicion_score          ← How risky (0-100)
│   ├── flags []                 ← Why flagged
│   ├── total_transactions       ← Activity level
│   ├── total_sent               ← Money out
│   ├── total_received           ← Money in
│   └── connected_rings []       ← Which rings
│
├── fraud_rings []               ← Circular money flows
│   ├── ring_id                  ← Ring number
│   ├── members []               ← Who's involved
│   ├── total_flow               ← How much money
│   ├── transaction_count        ← How many transactions
│   ├── risk_score               ← How risky (0-100)
│   └── cycle_length             ← Ring size (3-5)
│
└── summary {}                   ← Overall statistics
    ├── total_accounts           ← Dataset size
    ├── total_transactions       ← Data volume
    ├── suspicious_accounts_count ← How many flagged
    ├── fraud_rings_detected     ← How many rings
    ├── total_flagged_volume     ← Financial impact
    └── analysis_timestamp       ← When analyzed
```

---

## Quick Reference

| Field | Type | Range | Meaning |
|-------|------|-------|---------|
| suspicion_score | number | 0-100 | Overall risk level |
| risk_score | number | 0-100 | Ring risk level |
| total_sent | number | 0+ | Money sent out |
| total_received | number | 0+ | Money received |
| total_flow | number | 0+ | Money in ring |
| cycle_length | number | 3-5 | Ring size |
| transaction_count | number | 1+ | Number of transactions |
| connected_rings | array | [] | Ring memberships |

---

## Need More Help?

- **Algorithm Details**: See `README.md` - Detection Algorithms section
- **Testing**: See `TESTING.md` for more examples
- **API Usage**: See `POSTMAN_GUIDE.md` for testing
- **Deployment**: See `DEPLOYMENT.md` for production setup








{
    "suspicious_accounts": [
        {
            "account_id": "ACC_K",
            "suspicion_score": 70,
            "flags": [
                "fan_out_smurfing",
                "high_velocity",
                "below_threshold_structuring",
                "multiple_patterns"
            ],
            "total_transactions": 7,
            "total_sent": 3220,
            "total_received": 0,
            "connected_rings": []
        },
        {
            "account_id": "ACC_Z",
            "suspicion_score": 70,
            "flags": [
                "fan_in_smurfing",
                "high_velocity",
                "below_threshold_structuring",
                "multiple_patterns"
            ],
            "total_transactions": 7,
            "total_sent": 0,
            "total_received": 3220,
            "connected_rings": []
        },
        {
            "account_id": "MERCHANT_BIG",
            "suspicion_score": 70,
            "flags": [
                "fan_out_smurfing",
                "high_velocity",
                "below_threshold_structuring",
                "multiple_patterns"
            ],
            "total_transactions": 5,
            "total_sent": 6750,
            "total_received": 0,
            "connected_rings": []
        },
        {
            "account_id": "ACC_H",
            "suspicion_score": 60,
            "flags": [
                "cycle_member",
                "high_velocity"
            ],
            "total_transactions": 2,
            "total_sent": 9500,
            "total_received": 9800,
            "connected_rings": [
                0
            ]
        },
        {
            "account_id": "ACC_I",
            "suspicion_score": 60,
            "flags": [
                "cycle_member",
                "high_velocity"
            ],
            "total_transactions": 2,
            "total_sent": 9200,
            "total_received": 9500,
            "connected_rings": [
                0
            ]
        },
        {
            "account_id": "ACC_G",
            "suspicion_score": 60,
            "flags": [
                "cycle_member",
                "high_velocity"
            ],
            "total_transactions": 2,
            "total_sent": 9800,
            "total_received": 9000,
            "connected_rings": [
                0
            ]
        },
        {
            "account_id": "ACC_J",
            "suspicion_score": 60,
            "flags": [
                "cycle_member",
                "high_velocity"
            ],
            "total_transactions": 2,
            "total_sent": 9000,
            "total_received": 9200,
            "connected_rings": [
                0
            ]
        },
        {
            "account_id": "ACC_D",
            "suspicion_score": 50,
            "flags": [
                "cycle_member"
            ],
            "total_transactions": 4,
            "total_sent": 955,
            "total_received": 915,
            "connected_rings": [
                2
            ]
        },
        {
            "account_id": "ACC_B",
            "suspicion_score": 50,
            "flags": [
                "cycle_member"
            ],
            "total_transactions": 4,
            "total_sent": 875,
            "total_received": 895,
            "connected_rings": [
                1
            ]
        },
        {
            "account_id": "ACC_F",
            "suspicion_score": 50,
            "flags": [
                "cycle_member"
            ],
            "total_transactions": 4,
            "total_sent": 915,
            "total_received": 935,
            "connected_rings": [
                2
            ]
        },
        {
            "account_id": "ACC_C",
            "suspicion_score": 50,
            "flags": [
                "cycle_member"
            ],
            "total_transactions": 4,
            "total_sent": 855,
            "total_received": 875,
            "connected_rings": [
                1
            ]
        },
        {
            "account_id": "ACC_A",
            "suspicion_score": 50,
            "flags": [
                "cycle_member"
            ],
            "total_transactions": 4,
            "total_sent": 895,
            "total_received": 855,
            "connected_rings": [
                1
            ]
        },
        {
            "account_id": "ACC_E",
            "suspicion_score": 50,
            "flags": [
                "cycle_member"
            ],
            "total_transactions": 4,
            "total_sent": 935,
            "total_received": 955,
            "connected_rings": [
                2
            ]
        }
    ],
    "fraud_rings": [
        {
            "ring_id": 0,
            "members": [
                "ACC_G",
                "ACC_H",
                "ACC_I",
                "ACC_J"
            ],
            "total_flow": 37500,
            "transaction_count": 4,
            "risk_score": 80,
            "cycle_length": 4
        },
        {
            "ring_id": 1,
            "members": [
                "ACC_A",
                "ACC_B",
                "ACC_C"
            ],
            "total_flow": 2625,
            "transaction_count": 6,
            "risk_score": 70,
            "cycle_length": 3
        },
        {
            "ring_id": 2,
            "members": [
                "ACC_D",
                "ACC_E",
                "ACC_F"
            ],
            "total_flow": 2805,
            "transaction_count": 6,
            "risk_score": 70,
            "cycle_length": 3
        }
    ],
    "summary": {
        "total_accounts": 37,
        "total_transactions": 50,
        "suspicious_accounts_count": 13,
        "fraud_rings_detected": 3,
        "total_flagged_volume": 99050,
        "analysis_timestamp": "2026-02-19T09:08:20.456707Z"
    }
}