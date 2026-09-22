# CYBERTRACE — Investigative Report Specification

**Document:** `docs/REPORT_SPECIFICATION.md`
**Version:** 1.0
**Status:** MVP Specification
**Purpose:** Define the structure, content, evidence requirements, and generation rules for CYBERTRACE investigative reports.

---

# 1. Purpose

CYBERTRACE must convert structured investigation results into a standardized investigative brief that can be reviewed by a field officer or investigator.

The report must provide a concise view of:

* case information;
* evidence processed;
* identified entities;
* relevant relationships;
* transaction flow;
* communication links;
* risk assessments;
* investigation findings;
* timeline;
* supporting evidence;
* immediate investigation leads.

The report is an **investigative intelligence summary**, not a legal judgment or final determination of guilt.

---

# 2. Report Formats

CYBERTRACE MVP supports two output formats:

1. **PDF**
2. **JSON**

Both formats must represent the same underlying structured report data.

```text
Investigation Data
        │
        ▼
Structured Report Data
        │
        ├──────────────► JSON
        │
        └──────────────► PDF
```

The PDF is intended for human consumption.

The JSON is intended for machine-readable access, archival, and future interoperability.

---

# 3. Report Generation Principle

The report must be generated from structured investigation data.

```text
Evidence
   ↓
Parsed Records
   ↓
Entities
   ↓
Relationships
   ↓
Transactions
   ↓
Risk
   ↓
Findings
   ↓
Timeline
   ↓
Structured Report
   ↓
PDF / JSON
```

The report generator must not independently invent investigative relationships.

---

# 4. Source-of-Truth Hierarchy

When generating a report, the following hierarchy applies:

```text
Original Evidence
      ↓
Evidence Records
      ↓
Normalized Data
      ↓
Entities / Transactions
      ↓
Relationships
      ↓
Risk Assessments
      ↓
Findings
      ↓
Report
```

Higher-level narrative must remain traceable to lower-level structured evidence.

---

# 5. Report Metadata

Every report must contain:

```text
reportId
caseId
reportVersion
generatedAt
generatedBy
generationStatus
```

Example:

```json
{
  "reportId": "RPT-2026-001",
  "caseId": "CASE-2026-001",
  "reportVersion": "1.0",
  "generatedAt": "2026-09-22T10:30:00Z",
  "generatedBy": "CYBERTRACE",
  "generationStatus": "COMPLETED"
}
```

---

# 6. Case Summary

The first section of the report should identify the case.

Required fields:

```text
Case Number
Case Title
Case Status
Description
Report Generated At
```

Example:

```text
CASE-2026-001
UPI Fraud — Multi-Hop Mule Network

Status: ACTIVE
```

The summary should remain concise.

---

# 7. Executive Investigation Summary

The report should provide a short summary of the structured investigation results.

It should describe:

* what evidence was processed;
* what major entities were identified;
* what important relationships were detected;
* whether a transaction flow was identified;
* which entities received elevated risk scores;
* the main findings requiring investigator attention.

The summary must be based on available structured data.

---

# 8. Evidence Summary

The report must identify the evidence artifacts used in the investigation.

For every evidence file, include:

```text
Evidence ID
Original Filename
Artifact Type
File Size
SHA-256
Processing Status
Integrity Status
Upload/Processing Timestamp
```

Example:

```text
Evidence: EV-001
Filename: bank_transactions.csv
Type: BANK_TRANSACTION
SHA-256: <64-character hash>
Integrity: VERIFIED
Processing: PROCESSED
```

---

# 9. Evidence Integrity

SHA-256 values must be included in the report where applicable.

The report must never modify the stored hash.

If an evidence artifact has an integrity mismatch, the report must explicitly identify the mismatch.

Example:

```text
Integrity Status: MISMATCH
```

The report must not silently treat a mismatched artifact as verified.

---

# 10. Evidence Traceability

Important investigative statements should be traceable to evidence.

A finding may reference:

```text
Evidence ID
Evidence Record ID
Source Record ID
Raw Reference
```

Examples of raw references:

```text
CSV row 17
JSON path $.transactions[4]
EML header field
Spreadsheet Sheet1 row 22
```

---

# 11. Entity Summary

The report should identify relevant entities discovered during processing.

Supported entity types include:

```text
PHONE
IMEI
IMSI
DEVICE
IP
MAC
UPI
BANK_ACCOUNT
TRANSACTION
EMAIL
LOCATION
```

Each relevant entity may include:

```text
Entity ID
Entity Type
Display Value
Risk Score
Risk Severity
Relationship Count
Evidence References
```

---

# 12. Prime Investigation Entities

The report should identify entities requiring investigator attention.

This section must be generated from structured risk and finding data.

It should not label an entity as a criminal or guilty party.

Preferred terminology:

```text
High-Risk Entity
Investigative Lead
Entity Requiring Review
Observed Mule-Pattern Entity
```

Avoid unsupported legal conclusions.

---

# 13. Entity Detail

For each important entity, the report may include:

```text
Entity Type
Canonical Value
Observed Identifiers
Linked Entities
Observed Transactions
Risk Assessment
Supporting Evidence
```

Example:

```text
Entity
Type: BANK_ACCOUNT
Value: 9000012345

Linked UPI:
mulea001@upi

Linked Phone:
9876500002

Risk:
68 / 100
HIGH
```

---

# 14. Relationship Summary

The report should summarize significant relationships discovered by the deterministic correlation engine.

Supported relationship examples:

```text
USES
HAS
LINKED_TO
TRANSFERRED_TO
FROM
TO
CALLED
CONNECTED_FROM
ASSOCIATED_WITH
```

Each important relationship should contain:

```text
Source Entity
Relationship
Target Entity
Confidence
Reason
Evidence References
```

---

# 15. Relationship Confidence

Relationship confidence represents the strength of supporting evidence.

Supported values:

```text
HIGH
MEDIUM
LOW
```

Confidence must not be interpreted as legal certainty.

The report should distinguish:

```text
Relationship Confidence
```

from:

```text
Risk Score
```

They are different measurements.

---

# 16. Transaction Flow

The report should provide a directional representation of important financial flows.

Example:

```text
Victim
   │ ₹25,000
   ▼
Mule Account A
   │ ₹24,000
   ▼
Mule Account B
   │ ₹23,500
   ▼
Cash-out Account
```

The report should include, where available:

```text
Transaction Reference
Source Account
Destination Account
Amount
Currency
Timestamp
Channel
Supporting Evidence
```

---

# 17. Multi-Hop Flow

When a multi-hop transaction pattern is detected, the report should explicitly identify:

```text
Number of hops
Initial source
Intermediate accounts
Final observed destination
Time between transfers
Amounts transferred
```

Example:

```text
Hop 1: Victim → Mule A
Hop 2: Mule A → Mule B
Hop 3: Mule B → Cash-out Account
```

The report should not claim that the final account represents an actual cash withdrawal unless the evidence explicitly supports that conclusion.

---

# 18. Communication Links

Where CDR or other communication evidence supports them, relevant communication relationships should be summarized.

Example:

```text
Phone A
   │ CALLED
   ▼
Phone B
```

Include:

```text
Source Phone
Target Phone
Timestamp
Call/communication metadata available
Evidence Reference
```

Only observed communication should be reported.

---

# 19. Device Correlation

Device relationships may include:

```text
Phone → IMEI
Phone → IMSI
Device → IP
Device → MAC
```

Example:

```text
Phone A ──USES──► IMEI X
Phone B ──USES──► IMEI X
```

If the same IMEI is associated with multiple phone numbers, the report may identify this as a correlation finding.

It must not independently conclude who operated the device.

---

# 20. IP Correlation

If multiple entities are associated with an IP address, the report should display:

```text
IP Address
Associated Entity
Observed Timestamp
Evidence Source
```

A shared IP should be described as an observed association.

It should not automatically be treated as proof that two entities belong to the same person.

---

# 21. MAC Correlation

Where MAC addresses are available, the report may show:

```text
MAC Address
Associated Device
Associated Entity
Timestamp
Evidence Reference
```

The same evidentiary caution used for IP correlations applies.

---

# 22. Risk Assessment

Every reported risk assessment should contain:

```text
Entity
Score
Severity
Engine Version
Calculation Timestamp
Risk Factors
Evidence References
```

Risk score range:

```text
0–100
```

Severity:

```text
0–24     LOW
25–49    MEDIUM
50–74    HIGH
75–100   CRITICAL
```

These thresholds follow the MVP risk engine specification.

---

# 23. Risk Factor Detail

Each risk factor should contain:

```text
Factor Type
Weight
Description
Supporting Evidence
```

Example:

```text
Risk Factor:
Rapid Onward Transfer

Weight:
20

Description:
Funds were transferred onward shortly after receipt.

Evidence:
EV-004 / Record 17
```

---

# 24. Risk Explanation

The report should explain why an entity received its score.

Example structure:

```text
Risk Score: 68 / 100
Severity: HIGH

Contributing factors:
• Rapid onward transfer
• Multi-hop routing
• Shared device identifier
• Recurring beneficiary relationship
```

The explanation must correspond to actual calculated factors.

---

# 25. Investigation Findings

Findings are structured conclusions generated from evidence-backed rules.

Each finding should contain:

```text
Finding ID
Finding Type
Title
Description
Confidence
Evidence References
Related Entities
Related Transactions
Created At
```

---

# 26. Finding Language

Findings should describe observed patterns.

Preferred:

```text
"Multiple accounts were observed using the same IMEI."

"Funds were transferred onward within minutes of receipt."

"A three-hop transaction flow was identified."
```

Avoid unsupported claims such as:

```text
"This person is the fraudster."

"This account belongs to a criminal."

"The suspect definitely committed the fraud."
```

---

# 27. Investigation Leads

The report should include actionable investigative leads based on observed data.

Examples:

```text
Review linked phone numbers.
Review activity associated with the shared IMEI.
Review onward transfers from the identified account.
Review communication records around transaction timestamps.
Verify supporting evidence for the identified IP association.
```

These are investigative leads, not legal conclusions.

---

# 28. Timeline

The report should contain a chronological timeline of significant events.

Possible event types:

```text
Evidence Event
Transaction
Communication
Device Activity
Entity Discovery
Correlation Finding
Risk Assessment
```

Example:

```text
10:00
Victim → Mule A
₹25,000

10:03
Mule A → Mule B
₹24,000

10:07
Mule B → Cash-out Account
₹23,500

10:15
Device activity observed

10:20
Communication event observed
```

---

# 29. Timeline Ordering

Timeline events should be sorted chronologically.

Where timestamps are missing:

* preserve the event;
* do not invent a timestamp;
* identify the timestamp as unavailable where appropriate.

---

# 30. Evidence References Section

The report should contain a consolidated evidence reference section.

Example:

```text
EV-001
bank_transactions.csv
SHA-256: ...

EV-002
upi_transactions.csv
SHA-256: ...

EV-003
cdr.csv
SHA-256: ...
```

This allows investigators to connect report statements to source artifacts.

---

# 31. Data Quality / Limitations

The report should identify relevant limitations.

Examples:

```text
Missing timestamp
Incomplete transaction record
Unresolved entity
Conflicting identifiers
Unavailable artifact
Low-confidence relationship
Integrity mismatch
```

Missing data must not automatically be interpreted as negative evidence.

---

# 32. Contradictory Evidence

If structured evidence contains conflicting information, the report should preserve the conflict.

Example:

```text
Data Quality Note:

Two source records associate the entity with different device identifiers.

The records have not been automatically reconciled.
```

The system should not silently choose one record.

---

# 33. AI-Generated Narrative

AI may assist with:

* executive summary wording;
* explanation of calculated risk;
* concise description of transaction flow;
* natural-language explanation of findings.

AI-generated content must remain grounded in structured investigation data.

---

# 34. AI Attribution

Where practical, AI-generated narrative should be distinguishable from deterministic report data.

For example:

```text
Generated Investigation Summary
```

while structured facts remain separately represented.

The MVP should not represent AI-generated narrative as an independently verified forensic fact.

---

# 35. AI Failure Handling

If the AI provider fails:

```text
Structured Report
        ↓
Still Generated
```

The PDF/JSON report must remain usable without AI-generated narrative.

Example:

```text
AI Summary:
Unavailable — AI provider did not respond.

Structured findings remain available below.
```

---

# 36. JSON Report Structure

The JSON report should follow a predictable structure.

Example:

```json
{
  "report": {
    "id": "RPT-2026-001",
    "version": "1.0",
    "generatedAt": "2026-09-22T10:30:00Z"
  },
  "case": {},
  "summary": {},
  "evidence": [],
  "entities": [],
  "relationships": [],
  "transactions": [],
  "riskAssessments": [],
  "findings": [],
  "timeline": [],
  "investigationLeads": [],
  "limitations": []
}
```

---

# 37. JSON Evidence Object

Example:

```json
{
  "id": "EV-001",
  "filename": "bank_transactions.csv",
  "artifactType": "BANK_TRANSACTION",
  "sha256": "...",
  "processingStatus": "PROCESSED",
  "integrityStatus": "VERIFIED"
}
```

---

# 38. JSON Entity Object

Example:

```json
{
  "id": "ENT-001",
  "type": "BANK_ACCOUNT",
  "displayValue": "9000012345",
  "risk": {
    "score": 68,
    "severity": "HIGH"
  },
  "evidenceReferences": [
    "EV-004:record-17"
  ]
}
```

---

# 39. JSON Relationship Object

Example:

```json
{
  "id": "REL-001",
  "sourceEntityId": "ENT-001",
  "relationshipType": "TRANSFERRED_TO",
  "targetEntityId": "ENT-002",
  "confidence": "HIGH",
  "reason": "Explicit transaction record",
  "evidenceReferences": [
    "EV-004:record-17"
  ]
}
```

---

# 40. JSON Transaction Object

Example:

```json
{
  "id": "TX-001",
  "sourceAccount": "9000012345",
  "destinationAccount": "9000012346",
  "amount": 24000,
  "currency": "INR",
  "timestamp": "2026-09-22T10:03:00Z",
  "channel": "UPI",
  "evidenceReferences": [
    "EV-004:record-18"
  ]
}
```

---

# 41. PDF Layout

The PDF should prioritize fast investigator comprehension.

Recommended structure:

```text
PAGE 1
────────────────────────────
CYBERTRACE
Investigative Brief

Case Summary
Executive Summary
Key Entities
Risk Overview
────────────────────────────

PAGE 2+
Evidence
Transaction Flow
Relationships
Timeline
Findings
Investigation Leads
Evidence References
Limitations
```

The final page count may vary according to case size.

The report should not artificially force a single page when the underlying investigation requires more space.

---

# 42. Visual Hierarchy

The PDF should prioritize:

1. Case identity
2. Key findings
3. High-risk entities
4. Transaction flow
5. Important relationships
6. Timeline
7. Evidence references
8. Limitations

Use tables and diagrams where they improve comprehension.

Avoid dense uninterrupted paragraphs.

---

# 43. Graph Representation in PDF

Where practical, the PDF may include a simplified investigation graph.

Example:

```text
Victim
  │
  ▼
Mule A
  │
  ▼
Mule B
  │
  ▼
Cash-out
```

The graph must be generated from the same structured graph data used by the application.

The PDF must not contain a manually constructed graph that differs from the investigation graph.

---

# 44. Report Versioning

Reports should be versioned.

Example:

```text
1.0
1.1
2.0
```

A regenerated report must not overwrite historical report records without preserving version information.

---

# 45. Reproducibility

A report should be reproducible from:

```text
Case Data
+
Evidence Metadata
+
Structured Investigation Results
+
Risk Engine Version
+
Report Version
```

Where applicable, the report should record engine/version metadata.

---

# 46. Report Integrity

The generated report itself may have a SHA-256 hash stored as report metadata if implemented.

Example:

```text
Report SHA-256:
<64-character hash>
```

This is separate from the hashes of source evidence artifacts.

---

# 47. Report Status

Supported report generation states may include:

```text
GENERATING
COMPLETED
FAILED
```

A failed report generation should retain the error information.

---

# 48. Report API Mapping

The report specification maps to the API contract:

```text
POST /api/cases/:caseId/reports
GET  /api/cases/:caseId/reports
GET  /api/cases/:caseId/reports/:reportId
```

Download endpoints may expose:

```text
PDF
JSON
```

The exact route shape must remain consistent with `API_SPECIFICATION.md`.

---

# 49. Report Service Responsibilities

`lib/reports/report-service.ts` should coordinate:

```text
Load Case
    ↓
Load Evidence
    ↓
Load Entities
    ↓
Load Relationships
    ↓
Load Transactions
    ↓
Load Risk
    ↓
Load Findings
    ↓
Build Timeline
    ↓
Build Structured Report
    ↓
Generate JSON
    ↓
Generate PDF
```

---

# 50. Report Builder Responsibilities

The report builder should:

* assemble structured data;
* preserve identifiers;
* preserve evidence references;
* preserve confidence;
* preserve risk values;
* preserve timestamps;
* include limitations;
* prepare report-ready data.

It should not modify investigation results.

---

# 51. PDF Generator Responsibilities

The PDF generator should:

* format report data;
* render tables;
* render timeline;
* render transaction flow;
* render evidence references;
* render risk information;
* render optional graph;
* preserve report metadata.

It should not calculate risk or discover relationships.

---

# 52. Report Validation

Before a report is marked `COMPLETED`, validate:

* required metadata exists;
* case exists;
* evidence references resolve;
* entity references resolve;
* relationship references resolve;
* risk scores are within 0–100;
* severity matches configured thresholds;
* timestamps are valid where present;
* report structure is valid;
* PDF generation succeeds;
* JSON serialization succeeds.

---

# 53. Security Requirements

The report must not expose:

* API keys;
* database credentials;
* internal server paths;
* AI provider credentials;
* unrelated case data.

Evidence should remain scoped to the requested case.

---

# 54. Sensitive Data Handling

Because cyber-fraud evidence may contain sensitive personal information:

* include only relevant evidence;
* avoid unnecessary duplication;
* avoid logging raw evidence contents;
* do not send the complete evidence repository to an AI provider;
* keep credentials and secrets outside generated reports.

---

# 55. Demo Report

For the canonical demo case:

```text
CASE-2026-001
UPI Fraud — Multi-Hop Mule Network
```

the report should demonstrate:

```text
Victim
 ↓
Mule A
 ↓
Mule B
 ↓
Cash-out Account
```

and include:

* shared IMEI correlation;
* relevant phone relationships;
* transaction chain;
* risk factors;
* timeline;
* evidence references;
* investigative leads.

---

# 56. Demo Accuracy Requirement

The demo report must be generated from the mock evidence defined in:

```text
docs/DEMO_SCENARIO.md
```

No findings should be manually inserted solely to make the demonstration appear successful.

---

# 57. Testing Requirements

Report tests must verify:

### Structure

* required fields exist;
* JSON schema is valid;
* PDF generation succeeds.

### Integrity

* evidence SHA-256 values remain unchanged;
* evidence references point to existing records.

### Accuracy

* transaction amounts match source data;
* timestamps match source data;
* entities match database records;
* risk scores match Risk Engine output.

### Consistency

* PDF and JSON represent the same investigation data.

### Failure handling

* AI failure does not prevent structured report generation;
* invalid case IDs are rejected;
* missing referenced records are handled safely.

---

# 58. End-to-End Report Test

The canonical end-to-end test should perform:

```text
Load mock evidence
      ↓
Hash evidence
      ↓
Parse evidence
      ↓
Normalize
      ↓
Resolve entities
      ↓
Generate relationships
      ↓
Calculate risk
      ↓
Generate findings
      ↓
Build timeline
      ↓
Generate report
      ↓
Validate PDF + JSON
```

The resulting report should contain the expected investigation relationships and transaction flow defined by the demo scenario.

---

# 59. MVP Acceptance Criteria

The reporting module is complete when:

* [ ] PDF generation works.
* [ ] JSON generation works.
* [ ] Case information is included.
* [ ] Evidence metadata is included.
* [ ] SHA-256 values are preserved.
* [ ] Entities are included.
* [ ] Relationships are included.
* [ ] Transactions are included.
* [ ] Risk assessments are included.
* [ ] Findings are included.
* [ ] Timeline is included.
* [ ] Investigation leads are included.
* [ ] Evidence references are included.
* [ ] Limitations are included.
* [ ] AI failure does not break report generation.
* [ ] PDF and JSON are consistent.
* [ ] Canonical demo produces the expected report.
* [ ] No unsupported legal conclusion is generated.

---

# 60. Final Principle

The CYBERTRACE investigative report should answer five questions quickly:

```text
WHAT happened?
        ↓
WHO / WHAT is connected?
        ↓
HOW did the transaction or communication flow?
        ↓
WHY is an entity receiving elevated risk?
        ↓
WHAT evidence supports each observation?
```

The report's purpose is to transform fragmented forensic artifacts into a traceable, evidence-backed investigative brief.

**Evidence first. Intelligence second.**
