# CYBERTRACE

## Correlation Engine Specification

**Document:** Correlation Engine Specification
**Version:** 1.0
**Status:** Draft for Development
**Related Documents:** `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`

---

# 1. Purpose

The Correlation Engine is the core deterministic intelligence component of CYBERTRACE.

Its purpose is to transform normalized investigation records into:

* canonical entities,
* evidence-backed relationships,
* relationship confidence,
* explainable correlation reasons,
* investigation findings.

The engine must connect information across heterogeneous evidence sources without relying on an LLM to determine forensic relationships.

---

# 2. Core Principle

> **Correlation must be evidence-driven, deterministic where possible, explainable, and traceable.**

The engine must never create a relationship merely because an AI model considers two entities "likely related."

The intended processing chain is:

```text
Raw Evidence
     ↓
Parsing
     ↓
Normalization
     ↓
Entity Extraction
     ↓
Entity Resolution
     ↓
Candidate Relationships
     ↓
Correlation Rules
     ↓
Validation
     ↓
Confidence
     ↓
Relationship
```

---

# 3. Correlation Inputs

The engine consumes structured data produced by the preceding processing stages.

### Primary inputs

* normalized records,
* canonical entities,
* timestamps,
* transaction information,
* communication records,
* network information,
* evidence references.

### The engine must not directly depend on:

* raw CSV formatting,
* raw XLSX column positions,
* raw JSON structure,
* UI state,
* AI-generated text.

Artifact-specific parsing belongs to the parser layer.

---

# 4. Correlation Outputs

The engine produces:

```text id="5pytl4"
Entity
Relationship
Relationship Evidence
Correlation Reason
Confidence
Investigation Finding
```

A relationship must contain enough information for an investigator to understand:

1. What is connected?
2. Why is it connected?
3. How strong is the connection?
4. Which evidence supports it?

---

# 5. Correlation Pipeline

```text id="p2dy88"
Normalized Records
        ↓
Canonicalization
        ↓
Entity Extraction
        ↓
Entity Resolution
        ↓
Candidate Generation
        ↓
Rule Evaluation
        ↓
Temporal Validation
        ↓
Evidence Validation
        ↓
Confidence Assignment
        ↓
Relationship Creation
        ↓
Finding Generation
```

---

# 6. Stage 1 — Canonicalization

Before correlation, values must be converted into canonical forms.

Examples:

### Phone

```text id="v3u5se"
+91-98765-43210
919876543210
9876543210
```

become:

```text id="7v5y7c"
9876543210
```

### UPI

```text id="2l0v8j"
ABC@UPI
abc@upi
```

becomes:

```text id="f5ah3h"
abc@upi
```

### Email

Email addresses should be normalized for:

* case,
* surrounding whitespace,
* obvious formatting inconsistencies.

### IP

IPv4/IPv6 values should be normalized into a consistent representation.

### MAC

MAC address separators should be normalized.

Example:

```text id="q0ts7d"
AA:BB:CC:DD:EE:FF
AA-BB-CC-DD-EE-FF
```

should resolve to one canonical representation.

---

# 7. Stage 2 — Entity Extraction

Each normalized record is inspected for recognized entity fields.

Example CDR record:

```text id="x5fkx9"
Calling Number
Called Number
IMEI
IMSI
Timestamp
Duration
```

may produce:

```text id="f8sy9f"
PHONE
PHONE
IMEI
IMSI
```

A bank transaction may produce:

```text id="73w6bn"
SOURCE ACCOUNT
DESTINATION ACCOUNT
UPI
TRANSACTION
```

The extraction layer must identify entities but should not automatically create every possible relationship.

---

# 8. Stage 3 — Entity Resolution

Entity resolution determines whether multiple references represent the same canonical entity.

## Resolution hierarchy

The initial implementation should use the following priority:

```text id="5kn8jd"
1. Exact canonical match
2. Exact identifier match
3. Validated contextual match
4. No match / create new entity
```

Weak similarity must not automatically merge entities.

---

# 9. Exact Matching

The strongest resolution mechanism is an exact match after normalization.

Example:

```text id="3y8h4n"
Record A:
IMEI = 356700123456789

Record B:
IMEI = 356700123456789
```

Result:

```text id="rj5j6r"
Same IMEI entity
```

This produces a high-confidence entity resolution.

---

# 10. Entity Resolution Constraints

The engine must not merge entities solely because:

* names look similar,
* two people share a surname,
* two IP addresses are in the same broad geographic area,
* two accounts have similar values,
* two transactions have similar amounts,
* two devices appear in the same general time period.

Such conditions may generate investigation signals, but they should not independently establish identity.

---

# 11. Candidate Relationship Generation

After entities are resolved, the engine generates relationship candidates.

Examples:

```text id="6cnm4r"
PHONE → IMEI
PHONE → IMSI
PHONE → UPI
UPI → BANK_ACCOUNT
BANK_ACCOUNT → BANK_ACCOUNT
DEVICE → IP
DEVICE → MAC
PHONE → PHONE
```

The candidate generator should only consider relationship types that are meaningful for the source data.

---

# 12. Relationship Rule Structure

Each correlation rule should conceptually contain:

```text id="9kfrx4"
Rule ID
Source Entity Type
Target Entity Type
Relationship Type
Required Conditions
Optional Conditions
Confidence Logic
Reason Generator
Evidence Requirements
```

Example:

```text id="zrlzch"
Rule:
PHONE → IMEI

Required:
Exact IMEI observed with phone.

Optional:
Repeated observation.

Output:
USES

Confidence:
HIGH
```

---

# 13. Rule: Phone → IMEI

### Relationship

```text id="ykgv7b"
PHONE ──USES──> IMEI
```

### Evidence

A CDR or device record explicitly associates the phone with an IMEI.

### High confidence

When the same phone and IMEI appear together in an authoritative structured record.

### Reason

```text
"Phone X and IMEI Y were explicitly observed together in the supplied evidence."
```

---

# 14. Rule: Phone → IMSI

### Relationship

```text id="jqcc13"
PHONE ──HAS──> IMSI
```

The relationship should be created when the source record explicitly associates the identifiers.

---

# 15. Rule: Phone → UPI

### Relationship

```text id="7n4m2q"
PHONE ──USES──> UPI
```

This requires explicit evidence connecting the phone and UPI identifier.

The system should not infer ownership of a UPI handle solely from a transaction.

---

# 16. Rule: UPI → Bank Account

### Relationship

```text id="jz5u5d"
UPI ──LINKED_TO──> BANK_ACCOUNT
```

Created when financial evidence explicitly associates the UPI identifier with the account.

---

# 17. Rule: Account → Account

### Relationship

```text id="w6qljq"
ACCOUNT_A
    │
    │ TRANSFERRED_TO
    ▼
ACCOUNT_B
```

This should normally be generated directly from a financial transaction record.

The transaction itself becomes the supporting evidence.

---

# 18. Rule: Device → IP

### Relationship

```text id="k4lj9v"
DEVICE ──CONNECTED_FROM──> IP
```

The relationship should consider:

* device identifier,
* IP,
* timestamp.

Where timestamped evidence exists, the association should be represented with temporal context.

---

# 19. Rule: Device → MAC

### Relationship

```text id="g8l93j"
DEVICE ──HAS──> MAC
```

Created when the device record explicitly associates the MAC address.

---

# 20. Rule: Phone → Phone

### Relationship

```text id="7iyc4e"
PHONE_A
   │
   │ CALLED
   ▼
PHONE_B
```

Generated from CDR communication records.

The underlying call record must be retained as supporting evidence.

---

# 21. Shared Identifier Correlation

Shared identifiers are one of the most important correlation mechanisms.

Example:

```text id="5v5b8z"
Phone A ── IMEI X
Phone B ── IMEI X
```

The graph becomes:

```text id="x1a3g2"
        IMEI X
        /    \
       /      \
 Phone A    Phone B
```

This can produce a finding such as:

> The same IMEI was observed in records associated with multiple phone numbers.

The finding must reference the records supporting both associations.

---

# 22. Shared IP Correlation

Example:

```text id="75cl9k"
Device A ── IP X
Device B ── IP X
```

A shared-IP relationship may be surfaced as an investigative signal.

However:

> Shared IP does not automatically imply shared ownership or identity.

The UI and finding description must preserve this distinction.

---

# 23. Shared MAC Correlation

Example:

```text id="l0q7aj"
Device A ── MAC X
Device B ── MAC X
```

The system may identify the shared identifier.

It must not automatically conclude that the same person controls both devices.

---

# 24. Recurring UPI Beneficiary Detection

The engine should identify UPI/bank accounts receiving funds from multiple distinct sources.

Example:

```text id="q2j7y4"
Victim A ─┐
Victim B ─┼──> Account X
Victim C ─┘
```

Potential finding:

```text
Account X received funds from multiple distinct source accounts.
```

The finding should include:

* number of distinct sources,
* total amount,
* relevant timestamps,
* supporting transactions.

---

# 25. Multi-Hop Transaction Detection

The engine should identify directional transaction chains.

Example:

```text id="4j7o3g"
A
↓
B
↓
C
↓
D
```

The system should preserve:

* source account,
* destination account,
* transaction amount,
* transaction timestamp,
* path length,
* supporting transaction records.

This supports the problem statement's requirement for mapping the movement from victim/intermediary nodes toward cash-out points.

---

# 26. Temporal Correlation

Time is an important correlation dimension.

Example:

```text id="y5j0zz"
10:02:13
A receives ₹25,000

10:02:47
A sends ₹20,000 to B

10:04:12
B sends ₹18,000 to C
```

The engine can identify a rapid multi-hop pattern.

Temporal rules must specify:

* event types,
* time window,
* required sequence,
* minimum evidence.

---

# 27. Temporal Windows

The implementation should use configurable time windows rather than hardcoding arbitrary values throughout the application.

Conceptually:

```text id="w1g3mt"
RULE:
Rapid onward transfer

Window:
Configurable

Condition:
Incoming transaction followed by
outgoing transaction within configured window.
```

The exact initial thresholds will be defined in `RISK_ENGINE.md` and should be treated as heuristic parameters, not universal forensic standards.

---

# 28. Evidence Requirements

A relationship should not be created if its required evidence is missing.

Example:

```text id="8f3x1v"
PHONE → IMEI

Required:
Explicit phone + IMEI association

Missing:
IMEI

Result:
No relationship
```

This is preferable to creating an inferred relationship.

---

# 29. Relationship Deduplication

The system must avoid creating duplicate relationships.

Example:

```text id="2k9h5y"
Phone A → IMEI X
```

appears in five CDR records.

The graph should contain one logical relationship:

```text id="0vrhgl"
Phone A ──USES──> IMEI X
```

with multiple supporting evidence references.

---

# 30. Relationship Evidence Aggregation

Multiple records supporting the same relationship should be aggregated.

Example:

```text id="3n88ro"
Relationship:
Phone A → IMEI X

Supporting records:
CDR-001
CDR-004
CDR-017
Android-008
```

This strengthens traceability without duplicating graph edges.

---

# 31. Confidence Model

The MVP uses categorical confidence:

```text id="nq8x6r"
HIGH
MEDIUM
LOW
```

Confidence is determined from evidence strength.

### HIGH

Typically:

* exact identifier match,
* explicit source association,
* direct transaction record,
* multiple independent supporting records.

### MEDIUM

Typically:

* valid temporal association,
* repeated indirect evidence,
* multiple supporting signals without explicit direct association.

### LOW

Typically:

* weak contextual association,
* limited supporting evidence,
* indirect relationship.

A low-confidence relationship may be shown as an investigative lead but should not be treated as confirmed.

---

# 32. Confidence Is Not Risk

These concepts must remain separate.

### Confidence

> How strongly does the evidence support this relationship?

### Risk

> How many defined suspicious patterns are associated with this entity?

Example:

```text id="n8y0o1"
Relationship Confidence:
HIGH

Entity Risk:
LOW
```

Both can legitimately occur.

---

# 33. False-Link Prevention

The engine must favor precision over aggressive linking.

### Do not create links solely from:

* similar names,
* similar transaction amounts,
* same broad location,
* same IP subnet without additional context,
* close timestamps without a relevant relationship rule,
* AI-generated suggestions.

### Use:

* exact identifiers,
* explicit source relationships,
* validated temporal relationships,
* multiple corroborating records.

---

# 34. Contradictory Evidence

If two evidence sources conflict, the system must not silently choose one.

Example:

```text id="o4m9f1"
CDR:
Phone A → IMEI X

Device Log:
Phone A → IMEI Y
```

The system should preserve both observations and surface a discrepancy.

Example finding:

> Conflicting device identifiers observed for Phone A across supplied evidence.

This is preferable to silently overwriting one record.

---

# 35. Missing Data

Missing values should not be treated as negative evidence.

Example:

```text id="u1qf7k"
Record:
Phone = X
IMEI = NULL
```

This means:

> IMEI unavailable in this record.

It does not mean:

> Phone X has no IMEI.

---

# 36. Correlation Provenance

Every generated relationship should store or be able to retrieve:

```text id="b1k3dg"
Rule ID
Source Record IDs
Source Evidence IDs
Reason
Confidence
Timestamp/context
```

This allows debugging and investigator review.

---

# 37. Correlation Findings

The engine may produce investigation findings when patterns meet defined criteria.

Example:

```text id="9zj1bl"
Finding:
SHARED_IMEI

Entities:
Phone A
Phone B
IMEI X

Evidence:
CDR-001
CDR-007

Severity:
HIGH

Description:
IMEI X was observed in records associated with two phone numbers.
```

The finding is a derived intelligence object, not raw evidence.

---

# 38. Graph Construction

The graph is generated from the resulting canonical entities and relationships.

```text id="5udkpr"
Entities
   ↓
Relationships
   ↓
Graph Nodes + Edges
```

The correlation engine must not depend on Cytoscape.js.

Cytoscape is a presentation layer.

---

# 39. Correlation Processing Order

The engine must process in this general order:

```text id="k5l4gd"
1. Normalize
2. Extract entities
3. Resolve canonical entities
4. Create direct relationships
5. Evaluate temporal relationships
6. Detect multi-hop patterns
7. Detect repeated/shared identifiers
8. Deduplicate relationships
9. Assign confidence
10. Generate findings
11. Persist results
```

This ordering may be optimized internally without changing logical behavior.

---

# 40. Idempotency

Processing the same evidence file twice should not create duplicate entities or relationships.

The engine should use:

* evidence IDs,
* source record IDs,
* canonical entity keys,
* deterministic relationship keys.

Example relationship uniqueness concept:

```text id="8jyh3x"
caseId
sourceEntityId
targetEntityId
relationshipType
```

Additional temporal/source information may be included where necessary.

---

# 41. Reprocessing

The system should support reprocessing an evidence file if:

* parser logic is updated,
* normalization rules change,
* processing previously failed.

Reprocessing must not silently destroy historical evidence metadata.

The system should distinguish:

```text id="c4j8z5"
Original Evidence
Processing Version
Derived Results
```

The exact versioning implementation may be introduced later if required by the MVP.

---

# 42. Error Handling

A correlation failure should produce an explicit processing error.

Example:

```text id="i2y1j3"
Correlation status:
FAILED

Reason:
Unable to resolve required entity field.
```

The engine should not create partial relationships and present the case as fully processed without indicating the failure.

---

# 43. Performance Requirements

The correlation engine should:

* avoid O(n²) comparison across every record where indexed lookups can be used,
* normalize each record once,
* reuse canonical entity lookups,
* aggregate duplicate relationships,
* index timestamps and identifiers,
* avoid repeatedly scanning raw evidence.

For the hackathon MVP, optimization should prioritize the expected mock dataset and demonstration workload.

---

# 44. Extensibility

New correlation rules should be independently implementable.

Conceptually:

```text id="xv7ih4"
rules/
├── phone-imei
├── phone-imsi
├── phone-upi
├── upi-account
├── account-account
├── device-ip
├── device-mac
├── phone-phone
├── shared-imei
├── shared-ip
└── multi-hop
```

The exact code organization may differ, but rule logic should remain modular.

---

# 45. Test Strategy

Every correlation rule must have tests.

### Example

Input:

```text id="4j65f4"
Phone A
IMEI X
```

Expected:

```text id="7f2a8c"
PHONE A
   │
   └──USES──> IMEI X
```

### Negative test

Input:

```text id="21q9b3"
Phone A
IMEI missing
```

Expected:

```text id="v5q0g1"
No PHONE → IMEI relationship
```

### Duplicate test

Five records showing the same phone/IMEI relationship should produce:

```text id="1m4r7b"
1 relationship
5 supporting records
```

not five graph edges.

---

# 46. Example End-to-End Correlation

Input records:

```text id="zzd0y7"
CDR-001
Phone A
IMEI X

CDR-002
Phone B
IMEI X

UPI-001
UPI A
Account A

BANK-001
Account A → Account B
₹25,000

BANK-002
Account B → Account C
₹20,000
```

The engine produces:

```text id="4i5jym"
Phone A ──USES──> IMEI X
Phone B ──USES──> IMEI X

UPI A ──LINKED_TO──> Account A

Account A ──TRANSFERRED_TO──> Account B

Account B ──TRANSFERRED_TO──> Account C
```

Then detects:

```text id="0q0j8p"
Finding:
SHARED_IMEI

Finding:
MULTI_HOP_TRANSACTION
```

---

# 47. Example Investigation Graph

```text id="d8qf2n"
               IMEI X
              /      \
             /        \
        Phone A      Phone B
           |            |
          UPI A       IP X
           |
       Account A
           |
        ₹25,000
           ↓
       Account B
           |
        ₹20,000
           ↓
       Account C
```

Each edge should be inspectable.

---

# 48. AI Boundary

The AI layer may consume the results:

```text id="3yrq3b"
Shared IMEI finding
+
Multi-hop finding
+
Transaction chain
+
Risk factors
```

and generate:

> "The case contains a transaction chain involving three accounts. The same IMEI was also observed in records associated with two phone numbers."

The AI must not independently invent the shared IMEI or transaction chain.

Those relationships originate from the correlation engine.

---

# 49. Acceptance Criteria

The correlation engine is considered complete when:

### Entity resolution

* equivalent identifiers normalize consistently;
* duplicate canonical entities are prevented;
* missing identifiers do not produce false relationships.

### Relationships

* supported direct relationships are detected;
* duplicate relationships are aggregated;
* relationships contain confidence and reason;
* supporting evidence can be retrieved.

### Financial analysis

* directional account transfers are represented;
* transaction chains can be identified;
* multi-hop patterns can be detected.

### Cross-artifact correlation

* shared identifiers can connect records from different evidence files;
* cross-source relationships remain within the case.

### Accuracy

* ambiguous relationships are not automatically marked high-confidence;
* conflicting observations are preserved rather than silently overwritten.

### Explainability

* every significant relationship has a reason;
* every significant finding identifies supporting evidence.

---

# 50. Correlation Engine Non-Goals

The engine will not:

* determine criminal guilt,
* identify a real-world person solely from weak metadata,
* infer ownership from shared IP alone,
* infer ownership from shared MAC alone,
* use an LLM as the primary correlation mechanism,
* modify original evidence,
* make legal determinations.

---

# 51. Relationship to Other Documents

This document defines **how entities and relationships are derived**.

Dependencies:

```text id="s5gy0u"
PRD.md
   ↓
ARCHITECTURE.md
   ↓
DATA_MODEL.md
   ↓
CORRELATION_ENGINE.md
```

The next major intelligence document is:

```text
docs/RISK_ENGINE.md
```

The Risk Engine will consume the entities, transactions, relationships and findings generated by this correlation engine.

---

# 52. Final Correlation Principle

> **CYBERTRACE should never say "these entities are connected" without being able to explain what evidence created that connection.**

The correlation engine therefore treats every relationship as:

```text id="5l4d0x"
RELATIONSHIP
    +
REASON
    +
CONFIDENCE
    +
EVIDENCE
```

This forms the foundation for the platform's forensic transparency and supports the Void Hacks requirement for accurate entity resolution and avoidance of false links.
