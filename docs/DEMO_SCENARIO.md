# CYBERTRACE — Demo Scenario & Demonstration Specification

**Document:** `docs/DEMO_SCENARIO.md`
**Version:** 1.0
**Status:** Draft for MVP implementation
**Purpose:** Hackathon PoC / 3-minute demonstration

---

# 1. Purpose

This document defines the single fictional investigation scenario that will be used to demonstrate the CYBERTRACE MVP.

The scenario is designed to demonstrate the core capabilities required by the problem statement:

```text
Evidence Ingestion
        ↓
SHA-256 Preservation
        ↓
Parsing & Normalization
        ↓
Entity Resolution
        ↓
Cross-Artifact Correlation
        ↓
Transaction Network
        ↓
Risk Scoring
        ↓
Investigation Graph
        ↓
AI Investigation Assistant
        ↓
Investigative Brief
```

The demo dataset must be deterministic.

Both developers should build and test against the same expected entities, relationships, findings, and risk outputs.

---

# 2. Important Demo Constraint

All people, accounts, phone numbers, identifiers, transactions, email addresses, IP addresses, and other information in this scenario are **fictional mock data**.

The demo must not use real personal, banking, telecom, or law-enforcement data.

The dataset exists solely to demonstrate the CYBERTRACE processing pipeline.

---

# 3. Investigation Case

## Case ID

```text
CASE-2026-001
```

## Case Title

```text
UPI Fraud — Multi-Hop Mule Network
```

## Case Type

```text
Digital Financial Fraud
```

## Case Status

```text
ACTIVE
```

## Scenario Summary

A victim is deceived into transferring money to a UPI-linked bank account.

The received funds are rapidly transferred through multiple intermediary accounts.

Additional telecom and device evidence reveals that two phone numbers are associated with the same IMEI.

The resulting evidence forms a small interconnected fraud network.

CYBERTRACE must identify the validated relationships, highlight suspicious transaction behavior, calculate risk, and provide an investigator-readable explanation.

---

# 4. Fictional Entities

The demo should use the following entities.

## 4.1 Victim

```text
Entity Type: PHONE
Entity Value: 9876500001
Role: Victim
```

The victim's associated bank/UPI identifier:

```text
UPI: victim001@upi
```

---

## 4.2 Mule Account A

```text
Entity Type: BANK_ACCOUNT
Entity Value: 9000012345
Role: Intermediary Mule
```

Associated UPI:

```text
mulea001@upi
```

Associated phone:

```text
9876500002
```

Associated IMEI:

```text
356789012345671
```

---

## 4.3 Mule Account B

```text
Entity Type: BANK_ACCOUNT
Entity Value: 9000012346
Role: Intermediary Mule
```

Associated UPI:

```text
muleb001@upi
```

Associated phone:

```text
9876500003
```

Associated IMEI:

```text
356789012345671
```

This creates the shared-device signal:

```text
Phone 9876500002
        │
        ▼
IMEI 356789012345671
        ▲
        │
Phone 9876500003
```

---

## 4.4 Cash-Out Account

```text
Entity Type: BANK_ACCOUNT
Entity Value: 9000012347
Role: Downstream Account
```

Associated UPI:

```text
cashout001@upi
```

---

# 5. Fictional IP Evidence

The demo may include:

```text
IP Address:
203.0.113.25
```

This address belongs to the documentation/example IP range and is used here as mock data.

The IP is associated with the relevant device activity in the IPDR dataset.

The demo must not imply that this represents a real user.

---

# 6. Fictional Device Data

Primary device:

```text
IMEI:
356789012345671

MAC:
02:00:00:00:00:01
```

The device relationship should be represented as:

```text
Phone 9876500002
        │
        ├── USES ──► IMEI 356789012345671
        │
        └── Device association
                         │
                         └── CONNECTED_FROM ──► 203.0.113.25

Phone 9876500003
        │
        └── USES ──► IMEI 356789012345671
```

---

# 7. Transaction Flow

The central fraud flow is:

```text
Victim
9876500001
      │
      │ ₹25,000
      ▼
Mule Account A
9000012345
      │
      │ ₹24,000
      ▼
Mule Account B
9000012346
      │
      │ ₹23,500
      ▼
Cash-Out Account
9000012347
```

The amounts intentionally decrease between hops to demonstrate transaction flow.

The demo should display the actual transaction amounts from the dataset rather than calculating them dynamically from assumptions.

---

# 8. Transaction Timeline

Use the following fictional timeline.

| Time     | Event                                                |
| -------- | ---------------------------------------------------- |
| 10:00:00 | Victim transfers ₹25,000 to Mule Account A           |
| 10:03:00 | Mule Account A transfers ₹24,000 to Mule Account B   |
| 10:07:00 | Mule Account B transfers ₹23,500 to Cash-Out Account |
| 10:15:00 | Related device activity recorded                     |
| 10:20:00 | Additional communication activity recorded           |

The timestamps are deliberately close enough to demonstrate temporal correlation.

---

# 9. Evidence Files

The demo should contain multiple small evidence files rather than one combined dataset.

Recommended mock evidence set:

```text
mock-data/
  case-001/
    cdr.csv
    ipdr.csv
    bank_transactions.csv
    upi_transactions.csv
    android_logs.json
    email_headers.eml
```

The exact parser coverage can be implemented incrementally.

The minimum working demo should process:

1. Bank/UPI transactions.
2. CDR or telecom data.
3. IPDR/device data.

The remaining artifacts can be included where implementation time permits.

---

# 10. CDR Dataset

Suggested file:

```text
cdr.csv
```

Example records:

```csv
timestamp,caller,receiver,duration_seconds,imei,imsi
2026-09-20T10:20:00,9876500002,9876500003,42,356789012345671,404450123456789
2026-09-20T10:21:30,9876500003,9876500002,18,356789012345671,404450987654321
```

The important relationship is:

```text
Phone 9876500002
        │
        │ CALLED
        ▼
Phone 9876500003
```

The shared IMEI provides an additional cross-artifact correlation.

---

# 11. IPDR Dataset

Suggested file:

```text
ipdr.csv
```

Example:

```csv
timestamp,phone,imei,ip_address,mac_address
2026-09-20T10:15:00,9876500002,356789012345671,203.0.113.25,02:00:00:00:00:01
2026-09-20T10:16:00,9876500003,356789012345671,203.0.113.25,02:00:00:00:00:01
```

This produces validated identifiers:

```text
Phone A → IMEI X
Phone B → IMEI X
Device → IP X
Device → MAC X
```

---

# 12. Bank Transaction Dataset

Suggested file:

```text
bank_transactions.csv
```

Example:

```csv
timestamp,transaction_id,source_account,destination_account,amount,currency,channel
2026-09-20T10:00:00,TXN001,VICTIM001,9000012345,25000,INR,BANK
2026-09-20T10:03:00,TXN002,9000012345,9000012346,24000,INR,BANK
2026-09-20T10:07:00,TXN003,9000012346,9000012347,23500,INR,BANK
```

The system should normalize `VICTIM001` to the appropriate mock account entity used by the demo.

---

# 13. UPI Dataset

Suggested file:

```text
upi_transactions.csv
```

Example:

```csv
timestamp,transaction_id,source_upi,destination_upi,amount,currency
2026-09-20T10:00:00,UPI001,victim001@upi,mulea001@upi,25000,INR
2026-09-20T10:03:00,UPI002,mulea001@upi,muleb001@upi,24000,INR
2026-09-20T10:07:00,UPI003,muleb001@upi,cashout001@upi,23500,INR
```

This provides a second representation of the transaction network.

The correlation engine should avoid creating duplicate logical transaction relationships merely because both bank and UPI datasets describe the same transaction.

---

# 14. Android Log Dataset

Suggested file:

```text
android_logs.json
```

Example:

```json
[
  {
    "timestamp": "2026-09-20T10:15:00",
    "phone": "9876500002",
    "imei": "356789012345671",
    "event": "NETWORK_ACTIVITY"
  },
  {
    "timestamp": "2026-09-20T10:16:00",
    "phone": "9876500003",
    "imei": "356789012345671",
    "event": "NETWORK_ACTIVITY"
  }
]
```

This provides an additional corroborating source for the shared-device relationship.

---

# 15. Email Header Dataset

Suggested file:

```text
email_headers.eml
```

The MVP email artifact may contain a fictional suspicious header pattern.

The parser should extract relevant header information.

The demo does not need to make email analysis the central finding.

The purpose is to demonstrate that CYBERTRACE can ingest heterogeneous artifact types.

---

# 16. Expected Entity Set

After processing, the system should identify entities approximately equivalent to:

```text
PHONE
  9876500001
  9876500002
  9876500003

BANK_ACCOUNT
  9000012345
  9000012346
  9000012347

UPI
  victim001@upi
  mulea001@upi
  muleb001@upi
  cashout001@upi

IMEI
  356789012345671

IP
  203.0.113.25

MAC
  02:00:00:00:00:01
```

The exact internal IDs are generated by the application.

---

# 17. Expected Relationships

The correlation engine should identify relationships such as:

```text
Phone 9876500002
    └── USES ──► IMEI 356789012345671

Phone 9876500003
    └── USES ──► IMEI 356789012345671

Device / IMEI
    └── CONNECTED_FROM ──► 203.0.113.25

Phone 9876500002
    └── CALLED ──► Phone 9876500003

Victim Account
    └── TRANSFERRED_TO ──► Mule Account A

Mule Account A
    └── TRANSFERRED_TO ──► Mule Account B

Mule Account B
    └── TRANSFERRED_TO ──► Cash-Out Account
```

Each relationship must contain supporting evidence references and confidence.

---

# 18. Expected Key Findings

The demo should surface findings such as:

```text
1. MULTI_HOP_TRANSACTION

2. RAPID_ONWARD_TRANSFER

3. SHARED_IMEI

4. MULTIPLE_INCOMING_SOURCES
   if supported by the final dataset

5. HIGH_TRANSACTION_VELOCITY
   if the configured threshold is satisfied
```

Only findings actually triggered by implemented rules should appear.

The demo must not display a finding merely because it is listed in this document.

---

# 19. Expected High-Risk Entity

The intended demonstration focus is:

```text
Mule Account A
9000012345
```

and/or:

```text
Mule Account B
9000012346
```

depending on the final configured risk rules and dataset.

The application must calculate the actual score using the implemented Risk Engine.

The demo documentation must not hard-code an unsupported score merely to match the presentation.

The score shown during the demo must be the result of the deterministic Risk Engine.

---

# 20. Risk Demonstration

The demo should show the factors contributing to the selected high-risk entity.

Example UI:

```text
ACCOUNT A

Risk Score: [CALCULATED SCORE]
Severity:   [CALCULATED SEVERITY]

Risk Factors
────────────────────────────────
Multi-hop transaction      ✓
Rapid onward transfer      ✓
High transaction velocity  ✓
Shared device identifier   ✓
────────────────────────────────

Supporting Evidence
EVID-001
EVID-003
EVID-005
```

The exact score and severity are generated by the implementation.

---

# 21. Investigation Graph

The graph is the visual centerpiece of the demonstration.

Expected conceptual graph:

```text
                         ┌──────────────┐
                         │  Phone A     │
                         │ 9876500002   │
                         └──────┬───────┘
                                │
                              USES
                                │
                                ▼
                         ┌──────────────┐
                         │   IMEI X     │
                         └──────┬───────┘
                                ▲
                              USES
                                │
                         ┌──────┴───────┐
                         │  Phone B     │
                         │ 9876500003   │
                         └──────────────┘

Victim
  │
  │ ₹25,000
  ▼
Mule A
  │
  │ ₹24,000
  ▼
Mule B
  │
  │ ₹23,500
  ▼
Cash-Out
```

The actual UI should use a graph visualization library as defined in `ARCHITECTURE.md`.

---

# 22. Graph Interaction

The demo should demonstrate at least:

### Node selection

Selecting an account displays:

* entity type;
* identifier;
* risk score;
* associated identifiers;
* related evidence.

### Edge selection

Selecting a relationship displays:

* relationship type;
* confidence;
* reason;
* supporting evidence.

### Risk visualization

Higher-risk entities should receive a distinct visual treatment.

The exact colors and visual language are UI implementation decisions.

---

# 23. Evidence Vault Demonstration

Before showing the graph, the demo should briefly demonstrate the Evidence Vault.

Example:

```text
EVIDENCE VAULT

✓ cdr.csv
  SHA-256: 8f...a21
  Status: PROCESSED

✓ ipdr.csv
  SHA-256: 3c...91b
  Status: PROCESSED

✓ bank_transactions.csv
  SHA-256: 7d...42e
  Status: PROCESSED
```

The complete SHA-256 value should be available when the investigator opens the evidence item.

---

# 24. Processing Demonstration

After upload, the application should show a concise processing sequence:

```text
✓ Evidence validated
✓ SHA-256 calculated
✓ Artifact parsed
✓ Records normalized
✓ Entities resolved
✓ Relationships correlated
✓ Risk calculated
✓ Investigation graph generated
```

The interface should not require the investigator to manually run every stage.

---

# 25. AI Demonstration

After the graph and risk assessment are visible, use one or two concise questions.

Recommended first query:

> Why is this account high risk?

Expected response structure:

```text
The account received its current risk assessment because it
participates in a validated multi-hop transaction path and
shows rapid onward transfers. It is also associated with an
IMEI that appears in multiple phone records.

Supporting evidence:
EVID-001
EVID-003
EVID-005
```

The exact response must be generated from the current case data.

---

# 26. Second AI Query

Recommended second query:

> Show the fund flow from the victim.

Expected result:

```text
Victim
  ↓ ₹25,000
Mule Account A
  ↓ ₹24,000
Mule Account B
  ↓ ₹23,500
Cash-Out Account
```

The AI should explain the validated transaction sequence without introducing additional entities.

---

# 27. Investigative Brief Demonstration

The final demo stage should generate the investigative brief.

The report should contain:

```text
CASE SUMMARY

KEY ENTITIES

TRANSACTION FLOW

KEY RELATIONSHIPS

RISK ASSESSMENTS

TIMELINE

INVESTIGATION FINDINGS

EVIDENCE INTEGRITY

SHA-256 REFERENCES

IMMEDIATE INVESTIGATION LEADS
```

The report must be generated from structured application data.

---

# 28. Immediate Investigation Leads

The demo may present evidence-backed next steps such as:

* review the shared IMEI associations;
* examine the transaction chain;
* review the supporting CDR/IPDR records;
* examine the accounts involved in the onward transfers;
* preserve and verify the referenced evidence artifacts.

These are investigative leads, not conclusions of guilt.

---

# 29. Three-Minute Demo Flow

The complete presentation should fit within approximately three minutes.

## 0:00–0:20 — Problem

Show fragmented evidence:

```text
CDR
IPDR
Bank Data
UPI Data
Logs
Email
```

Narration:

> Cyber-fraud investigations often begin with fragmented digital artifacts. CYBERTRACE converts those artifacts into one evidence-backed investigation view.

---

## 0:20–0:45 — Upload & Integrity

Upload the mock evidence files.

Show:

```text
SHA-256
Processing
Evidence Status
```

Narration:

> Every artifact is hashed and preserved before processing, giving investigators a traceable integrity reference.

---

## 0:45–1:15 — Automated Correlation

Show entities appearing automatically.

Example:

```text
Phone A ──► IMEI X ◄── Phone B
```

Narration:

> CYBERTRACE normalizes identifiers and automatically correlates validated relationships across telecom, device, and financial evidence.

---

## 1:15–1:50 — Fraud Graph

Open the investigation graph.

Show:

```text
Victim
 ↓
Mule A
 ↓
Mule B
 ↓
Cash-Out
```

Then show the shared IMEI relationship.

Narration:

> The investigator can immediately see the movement of funds and the digital identifiers connecting the entities.

---

## 1:50–2:15 — Risk

Select the high-risk entity.

Show:

```text
Risk Score
Risk Factors
Supporting Evidence
```

Narration:

> The Risk Engine prioritizes entities using explainable, deterministic patterns such as multi-hop routing and rapid onward transfers.

---

## 2:15–2:40 — AI Investigation

Ask:

> Why is this account high risk?

Then:

> Show the fund flow from the victim.

Narration:

> Instead of searching through individual files, the investigator can ask questions directly against the structured case intelligence.

---

## 2:40–3:00 — Report

Generate the investigative brief.

Show:

```text
Summary
Timeline
Entities
Transaction Flow
Findings
Evidence Hashes
```

Closing statement:

> CYBERTRACE turns fragmented digital evidence into a traceable, actionable fraud network within the investigation's critical initial window.

---

# 30. Demo State Reset

The demo environment should support a clean reset.

A reset should:

1. remove the previous demo case;
2. recreate the fictional case;
3. load the mock evidence;
4. process all artifacts;
5. recreate entities;
6. recreate relationships;
7. calculate risk;
8. prepare the graph.

This prevents inconsistent demo states.

---

# 31. Demo Data Seeding

The repository should contain:

```text
mock-data/
  case-001/
    cdr.csv
    ipdr.csv
    bank_transactions.csv
    upi_transactions.csv
    android_logs.json
    email_headers.eml
```

A seed command should ideally prepare the complete demo.

Example:

```bash
npm run seed:demo
```

The exact command can be changed during implementation.

---

# 32. Expected Demo Environment

The MVP should run locally.

Minimum intended environment:

```text
Browser
   │
   ▼
Next.js Application
   │
   ├── PostgreSQL
   └── Local Evidence Storage
```

An external distributed infrastructure stack is not required for the demo.

---

# 33. Demo Failure Protection

Because the project will be demonstrated live, the team should avoid depending on unpredictable external services where possible.

Recommended protections:

* seeded mock data;
* deterministic risk rules;
* local database;
* local evidence files;
* AI mock/fallback mode;
* pre-generated test case;
* error handling;
* reset capability.

The demo should remain functional even if the external AI provider is unavailable.

---

# 34. Demo Success Criteria

The demo is successful when the audience can see the following complete chain:

```text
FRAGMENTED EVIDENCE
        ↓
SHA-256
        ↓
AUTOMATED PROCESSING
        ↓
ENTITY CORRELATION
        ↓
FRAUD NETWORK
        ↓
RISK PRIORITIZATION
        ↓
AI EXPLANATION
        ↓
INVESTIGATIVE BRIEF
```

The audience should not need to understand the implementation details to understand this workflow.

---

# 35. Implementation Priority

If development time becomes limited, implement the demo in this order:

### Priority 1

Evidence upload + SHA-256

### Priority 2

Bank/UPI transaction ingestion

### Priority 3

Entity resolution

### Priority 4

Transaction graph

### Priority 5

CDR/IPDR correlation

### Priority 6

Risk Engine

### Priority 7

Evidence-backed AI question answering

### Priority 8

PDF investigative brief

Additional artifact types should only be implemented if the core demonstration is already stable.

---

# 36. What Must Not Be Faked

The demo may use fictional data, but the processing itself should be genuine.

The following must not be hard-coded merely for visual effect:

* entity relationships;
* risk scores;
* correlation results;
* transaction paths;
* evidence hashes;
* AI evidence references.

The system should actually derive these results from the mock evidence.

The mock dataset is fictional; the processing pipeline is real.

---

# 37. Final Demo Architecture

The final demonstration should communicate the following architecture:

```text
┌─────────────────────────────────────────────────────┐
│                    CYBERTRACE                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Evidence Vault                                     │
│  CDR | IPDR | Bank | UPI | Logs | Email            │
│                       │                             │
│                       ▼                             │
│               SHA-256 Integrity                    │
│                       │                             │
│                       ▼                             │
│            Parse + Normalize                        │
│                       │                             │
│                       ▼                             │
│             Entity Resolution                      │
│                       │                             │
│                       ▼                             │
│              Correlation Engine                    │
│                       │                             │
│                       ▼                             │
│                Risk Engine                         │
│                       │                             │
│              ┌────────┴────────┐                    │
│              ▼                 ▼                    │
│       Investigation       AI Assistant              │
│           Graph                                    │
│              │                 │                    │
│              └────────┬────────┘                    │
│                       ▼                             │
│              Investigative Brief                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

# 38. Guiding Principle

The CYBERTRACE demo should tell one simple story:

```text
Before CYBERTRACE

CDR     Bank Data     IPDR     UPI     Logs
 │          │           │       │        │
 └──────────┴───────────┴───────┴────────┘
                    ↓
             Manual Investigation


After CYBERTRACE

Fragmented Evidence
        ↓
Integrity Verified
        ↓
Entities Connected
        ↓
Fraud Network Revealed
        ↓
Risk Explained
        ↓
Investigator Acts
```

The objective of the demonstration is not to show the largest number of features.

It is to demonstrate that CYBERTRACE can take fragmented digital evidence and turn it into a **traceable, explainable, actionable investigation view**.
