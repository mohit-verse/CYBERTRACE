# CYBERTRACE — Risk Engine Specification

**Document:** `docs/RISK_ENGINE.md`
**Version:** 1.0
**Status:** Draft for MVP implementation

---

## 1. Purpose

The CYBERTRACE Risk Engine evaluates entities and transaction networks for suspicious patterns identified by the deterministic correlation pipeline.

The Risk Engine converts validated investigative signals into an **explainable 0–100 risk score**.

The score is intended to help investigators prioritize attention during the initial triage stage. It is **not** a determination of guilt, criminal liability, or legal responsibility.

The Risk Engine operates only on structured evidence and relationships produced by the CYBERTRACE processing pipeline.

### Core principle

> **Evidence produces signals. Signals produce risk. Risk never creates evidence.**

The engine must never create a relationship, entity, transaction, or evidence record merely because doing so would increase a risk score.

---

# 2. Objectives

The Risk Engine must:

1. Assign a risk score between `0` and `100`.
2. Detect predefined suspicious behavioral patterns.
3. Provide an explanation for every material risk contribution.
4. Link risk factors to supporting evidence.
5. Distinguish evidence confidence from risk severity.
6. Support entity-level and case-level prioritization.
7. Produce deterministic and repeatable results.
8. Preserve the underlying evidence references.
9. Handle incomplete datasets without treating missing data as suspicious.
10. Allow investigators to understand why an entity received its score.

---

# 3. Relationship Between Correlation and Risk

The two systems have different responsibilities.

### Correlation Engine

Determines:

> **What is connected to what, and what evidence supports that connection?**

### Risk Engine

Determines:

> **Which validated patterns deserve investigative attention?**

Example:

```text
CDR
 │
 ├── Phone A
 │      │
 │      └── IMEI X
 │
 └── Phone B
        │
        └── IMEI X
```

The Correlation Engine establishes the shared IMEI relationship.

The Risk Engine may then identify:

```text
Shared IMEI
      +
Multiple phone associations
      +
Rapid transaction activity
      ↓
Elevated risk
```

The Risk Engine must not independently infer the shared IMEI relationship.

---

# 4. Risk Score Model

Each scored entity receives:

```text
Risk Score = 0–100
```

Suggested severity bands:

|  Score | Severity |
| -----: | -------- |
|   0–24 | LOW      |
|  25–49 | MEDIUM   |
|  50–74 | HIGH     |
| 75–100 | CRITICAL |

These thresholds are **MVP design decisions** and may be adjusted after testing.

The score represents the concentration of configured suspicious signals in the available evidence.

It does not represent:

* probability of guilt;
* probability of conviction;
* legal culpability;
* certainty of fraud;
* identity of a criminal suspect;
* an official law-enforcement classification.

---

# 5. Risk Factors

The MVP Risk Engine should support the following initial risk factors.

## 5.1 Multi-Hop Fund Routing

### Pattern

A transaction originating from a victim or upstream account moves through multiple intermediary accounts within a short period.

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
Cash-out Account
```

### Signal

Increase risk when an entity participates in a validated multi-hop transaction path.

### Required evidence

* Validated transaction relationships.
* Transaction timestamps.
* Source and destination account entities.

### Risk contribution

Higher contribution may be assigned when:

* multiple hops are present;
* transfers occur rapidly;
* funds are forwarded shortly after receipt.

---

# 5.2 High Transaction Velocity

### Pattern

An account receives or transfers an unusually large number of transactions within a defined time window.

Example:

```text
10:01  Incoming
10:04  Outgoing
10:07  Incoming
10:10  Outgoing
10:13  Outgoing
```

### Required evidence

* Transaction records.
* Valid timestamps.
* Account association.

The engine should use configurable time windows rather than hard-coding a universal definition of "high velocity."

---

# 5.3 Rapid Onward Transfer

### Pattern

Funds are transferred onward shortly after being received.

Example:

```text
10:00
Victim → Account A

10:03
Account A → Account B
```

The three-minute interval is an example of the pattern, not a mandatory threshold.

### Signal

The shorter the validated interval between receipt and onward transfer, the stronger the configurable risk contribution may become.

---

# 5.4 Multiple Incoming Sources

### Pattern

An account receives funds from multiple unrelated upstream entities within a relevant period.

Example:

```text
Victim A ──┐
Victim B ──┼──► Account X ──► Account Y
Victim C ──┘
```

### Required evidence

* Multiple validated source accounts.
* Transaction records.
* Transaction timestamps.

The engine must not classify an account as suspicious merely because it has multiple transactions.

The signal must be evaluated together with configured behavioral conditions.

---

# 5.5 Shared Device Identifier

### Pattern

Multiple phone numbers or other entities are associated with the same validated device identifier.

Examples:

```text
Phone A ──► IMEI X
Phone B ──► IMEI X
```

or:

```text
Device X ──► MAC Y
```

### Evidence requirement

The relationship must already exist in the correlation layer.

The Risk Engine uses the relationship as an input signal.

---

# 5.6 Rapid SIM / Device Switching

### Pattern

A device or identifier becomes associated with multiple phone/SIM identifiers within a short period.

Example:

```text
IMEI X
 │
 ├── Phone A
 │
 ├── Phone B
 │
 └── Phone C
```

where the associations occur within a configurable time period.

### Required evidence

* Phone/device associations.
* Timestamps where available.
* Source evidence records.

The engine should account for incomplete timestamps and avoid treating missing temporal information as evidence of rapid switching.

---

# 5.7 Shared IP Address

### Pattern

Multiple entities or devices are associated with the same IP address.

Example:

```text
Device A ──► IP X
Device B ──► IP X
```

This is an investigative signal, not proof that the devices belong to the same person.

Shared networks, NAT, institutional networks, VPNs, and other legitimate infrastructure can produce shared IP addresses.

Therefore this factor should generally have a controlled contribution unless corroborated by other evidence.

---

# 5.8 Shared MAC Address

Where reliable MAC-address evidence exists, multiple devices/entities associated with the same MAC identifier may produce a risk signal.

As with IP overlap, the signal must be interpreted in context.

The engine must not treat a shared MAC identifier alone as proof of common ownership or malicious activity.

---

# 5.9 Recurring UPI Beneficiary

### Pattern

Multiple transactions repeatedly route funds toward the same validated UPI identifier.

Example:

```text
Victim A ──┐
Victim B ──┼──► UPI X
Victim C ──┘
```

The signal becomes more relevant when combined with:

* multiple source accounts;
* high transaction velocity;
* rapid onward transfers;
* multi-hop routing.

---

# 5.10 Suspicious Email Header Pattern

The Risk Engine may consume validated findings from email-header analysis.

Potential signals include:

* inconsistent header information;
* suspicious routing patterns;
* validated spoofing indicators.

The Risk Engine must not independently claim that an email is spoofed unless the relevant parser/analysis layer has produced a supported finding.

---

# 6. Risk Factor Structure

Each factor should contain:

```text
factorType
weight
description
scoreContribution
evidenceReferences
relationshipReferences
calculationMetadata
```

Example:

```json
{
  "factorType": "RAPID_ONWARD_TRANSFER",
  "weight": 20,
  "description": "Funds were transferred onward shortly after receipt.",
  "scoreContribution": 16,
  "evidenceReferences": [
    "evidence-record-123",
    "evidence-record-127"
  ],
  "relationshipReferences": [
    "relationship-42"
  ]
}
```

The exact schema must remain compatible with `DATA_MODEL.md`.

---

# 7. Scoring Architecture

The Risk Engine should use a deterministic weighted model for the MVP.

Conceptually:

```text
Validated Risk Factors
        │
        ▼
Factor Evaluation
        │
        ▼
Weighted Contributions
        │
        ▼
Score Normalization
        │
        ▼
0–100 Risk Score
        │
        ▼
Severity
        │
        ▼
Explainable Findings
```

A risk score should be reproducible.

For the same:

* case;
* evidence;
* correlation results;
* rule configuration;
* engine version;

the engine should produce the same result.

---

# 8. Weighting Strategy

Each factor has a configurable maximum contribution.

Example MVP configuration:

| Risk Factor                   | Maximum Contribution |
| ----------------------------- | -------------------: |
| Multi-hop transaction routing |                   25 |
| Rapid onward transfer         |                   20 |
| High transaction velocity     |                   15 |
| Multiple incoming sources     |                   10 |
| Rapid SIM/device switching    |                   10 |
| Shared device identifier      |                    8 |
| Recurring UPI beneficiary     |                    7 |
| Shared IP                     |                    3 |
| Shared MAC                    |                    2 |

The numbers above are **initial implementation configuration**, not empirical forensic weights.

They must be stored centrally so that they can be changed without rewriting the scoring engine.

The final score must be capped at `100`.

---

# 9. Avoiding Double Counting

Related signals can describe the same underlying behavior.

For example:

```text
Victim → Mule A → Mule B
```

may simultaneously trigger:

* multi-hop routing;
* rapid onward transfer;
* high transaction velocity.

The engine must prevent uncontrolled score inflation.

Possible MVP strategy:

### Primary factor

Give the strongest contribution to the primary observed pattern.

### Supporting factors

Allow related factors to contribute, but with controlled weights.

### Score cap

Always cap the final score at `100`.

### Evidence deduplication

Multiple references to the same evidence record must not automatically produce multiple independent risk contributions.

---

# 10. Confidence vs Risk

These concepts must remain separate.

### Confidence

Answers:

> How strongly is a relationship or finding supported by evidence?

Example:

```text
Phone A ──USES──► IMEI X
Confidence: HIGH
```

### Risk

Answers:

> How strongly do the observed patterns justify investigative prioritization?

Example:

```text
Entity: Account X
Risk Score: 78
Severity: CRITICAL
```

A relationship may have:

```text
HIGH confidence
LOW risk relevance
```

Conversely, several individually moderate signals may collectively produce a higher risk score.

The system must never convert confidence directly into risk.

---

# 11. Temporal Analysis

Time is an important component of fraud-pattern detection.

The engine should evaluate:

* transaction intervals;
* transaction bursts;
* repeated activity windows;
* device/SIM changes;
* communication activity around transactions;
* sequence of fund transfers.

Example:

```text
12:00  Victim → Account A
12:03  Account A → Account B
12:07  Account B → Account C
```

The engine may identify:

```text
Rapid onward transfer
+
Multi-hop routing
```

provided the underlying transactions are validated.

---

# 12. Missing Data Handling

Missing information must **not** automatically increase risk.

Examples:

* missing timestamp;
* missing IMEI;
* missing IMSI;
* incomplete IPDR;
* unavailable email header;
* missing transaction reference.

Correct behavior:

```text
Missing evidence
      ↓
Unable to evaluate factor
      ↓
No contribution
```

Incorrect behavior:

```text
Missing evidence
      ↓
Assume suspicious
      ↓
Increase score
```

The system must distinguish between:

* `NOT_EVALUATED`
* `NOT_PRESENT`
* `PRESENT`
* `CONFLICTING_DATA`

where appropriate.

---

# 13. Contradictory Evidence

If two evidence sources conflict, the Risk Engine must not silently choose one.

Example:

```text
Source A:
Phone A → IMEI X

Source B:
Phone A → IMEI Y
```

The system should preserve both observations.

A contradiction may itself generate an investigative finding if a corresponding rule exists.

The risk contribution must be explicitly explainable.

---

# 14. Risk Assessment Output

Each assessment should contain:

```text
Entity
Risk Score
Severity
Engine Version
Calculation Timestamp
Risk Factors
Supporting Evidence
Explanation
```

Example:

```text
Entity:
Bank Account X

Risk Score:
78

Severity:
CRITICAL

Primary Factors:
- Multi-hop fund routing
- Rapid onward transfers
- Multiple incoming sources
- Shared device identifier

Supporting Evidence:
- 12 transaction records
- 2 CDR records
- 1 device association
```

---

# 15. Explainability Requirements

Every non-zero material contribution should be explainable.

The UI should be able to answer:

> Why did this entity receive this risk score?

Example:

```text
Risk Score: 78

+25  Multi-hop transaction routing
     3 validated transaction hops

+18  Rapid onward transfer
     Funds forwarded within configured time window

+12  Multiple incoming sources
     6 distinct validated source accounts

+8   Shared device identifier
     IMEI associated with 2 phone numbers

+15  High transaction velocity
     Activity exceeded configured threshold
```

The exact displayed values depend on the configured scoring model.

---

# 16. Risk Findings

The engine may generate structured findings such as:

```text
MULTI_HOP_TRANSACTION
HIGH_TRANSACTION_VELOCITY
RAPID_ONWARD_TRANSFER
MULTIPLE_INCOMING_SOURCES
SHARED_IMEI
RAPID_SIM_SWITCH
SHARED_IP
SHARED_MAC
RECURRING_UPI_BENEFICIARY
SUSPICIOUS_EMAIL_HEADER
```

Each finding should contain:

* finding type;
* severity;
* affected entity;
* description;
* supporting evidence;
* supporting relationships;
* timestamp/context where applicable.

---

# 17. Case-Level Risk

Entity-level risk is the primary MVP scoring mechanism.

A case-level summary can aggregate:

* number of high-risk entities;
* number of critical findings;
* number of suspicious transaction paths;
* number of linked entities;
* number of evidence files processed.

The case summary must not simply average entity scores and call the result a "case risk score" unless a specific, documented model is implemented.

For MVP, the dashboard should prefer **case indicators** over an unsupported single case-wide score.

---

# 18. Risk Configuration

Risk thresholds and weights should be configurable.

Example conceptual configuration:

```json
{
  "thresholds": {
    "low": 24,
    "medium": 49,
    "high": 74,
    "critical": 100
  },
  "factors": {
    "MULTI_HOP_TRANSACTION": 25,
    "RAPID_ONWARD_TRANSFER": 20,
    "HIGH_TRANSACTION_VELOCITY": 15,
    "MULTIPLE_INCOMING_SOURCES": 10,
    "RAPID_SIM_SWITCH": 10,
    "SHARED_IMEI": 8,
    "RECURRING_UPI_BENEFICIARY": 7,
    "SHARED_IP": 3,
    "SHARED_MAC": 2
  }
}
```

The actual implementation may use TypeScript configuration or database-backed configuration.

For the MVP, a versioned application configuration is sufficient.

---

# 19. Engine Versioning

Every Risk Assessment must store a `modelVersion`.

Example:

```text
risk-engine-v1
```

If weights or scoring rules change:

```text
risk-engine-v1
        ↓
risk-engine-v2
```

Existing assessments should remain traceable to the version that produced them.

This prevents unexplained changes to historical results.

---

# 20. Recalculation

Risk assessments should be recalculable when:

* new evidence is uploaded;
* correlation results change;
* a new transaction is processed;
* risk configuration changes;
* the investigator explicitly requests recalculation.

Recalculation should replace or version the assessment according to the persistence strategy defined in the implementation.

The original evidence must never be modified during recalculation.

---

# 21. Idempotency

Running the Risk Engine twice against the same processed case state should not create duplicate risk factors or duplicate findings.

Conceptually:

```text
Same Case State
      │
      ├── Run 1 → Assessment A
      │
      └── Run 2 → Same deterministic result
```

The implementation should use stable identifiers and/or versioning to maintain this behavior.

---

# 22. Risk Engine Pipeline

The complete MVP flow is:

```text
Validated Evidence
        │
        ▼
Correlated Entities & Relationships
        │
        ▼
Temporal Analysis
        │
        ▼
Risk Rule Evaluation
        │
        ▼
Risk Factors
        │
        ▼
Weighted Scoring
        │
        ▼
Score Normalization
        │
        ▼
Severity Classification
        │
        ▼
Investigation Findings
        │
        ▼
Risk Assessment
```

---

# 23. Integration With Investigation Graph

Risk information should be available directly from the graph.

Example:

```text
             Phone A
                │
                │
              IMEI X
                │
                │
             Phone B
                │
                ▼
            Account A
                │
                ▼
            Account B
```

The graph can visually emphasize entities with higher risk scores.

However, visual emphasis must remain consistent with the stored risk assessment.

The graph must not independently calculate a different risk score.

---

# 24. Integration With AI

The AI layer consumes Risk Engine output.

Example query:

> Why is Account A high risk?

The AI should receive structured information such as:

```text
Risk Score: 78
Severity: CRITICAL

Factors:
1. Multi-hop transaction routing
2. Rapid onward transfer
3. Multiple incoming sources
4. Shared IMEI

Evidence:
EVID-001
EVID-004
EVID-009
```

The AI can then produce a human-readable explanation.

The AI must not:

* invent additional risk factors;
* invent evidence;
* alter the score;
* create unsupported relationships;
* claim guilt;
* replace the deterministic Risk Engine.

---

# 25. Testing Requirements

The Risk Engine must include unit tests for:

### Score calculation

* zero risk factors;
* single factor;
* multiple factors;
* score cap at 100.

### Severity mapping

* boundary values;
* threshold transitions;
* invalid scores.

### Temporal rules

* rapid transfer;
* delayed transfer;
* missing timestamps.

### Transaction patterns

* multi-hop path;
* single transfer;
* multiple incoming sources;
* high transaction velocity.

### Entity signals

* shared IMEI;
* shared IP;
* shared MAC;
* rapid device/SIM switching.

### Data quality

* duplicate records;
* conflicting evidence;
* missing fields;
* malformed values.

### Determinism

Same input state must produce the same result.

### Negative cases

The engine must not increase risk merely because:

* an entity has many legitimate transactions;
* multiple devices use a shared network;
* an identifier is missing;
* two entities have similar names;
* two transactions have similar amounts.

---

# 26. Performance Requirements

The MVP should remain practical on low-resource systems.

The Risk Engine should:

* operate on structured records rather than repeatedly parsing raw files;
* use indexed database queries;
* avoid unnecessary graph-wide recomputation;
* calculate risk only for affected entities when possible;
* support incremental recalculation after new evidence.

The architecture should avoid requiring a dedicated distributed scoring cluster for the MVP.

---

# 27. Security Requirements

Risk calculations must operate on trusted structured application data.

Uploaded evidence is untrusted input.

The system must:

* validate input during ingestion;
* sanitize parsed values;
* prevent uploaded content from becoming executable code;
* isolate case data;
* protect sensitive evidence;
* avoid exposing evidence through client-side logs;
* protect AI prompts and API credentials.

Risk calculations must never execute arbitrary content originating from uploaded artifacts.

---

# 28. Auditability

For every risk assessment, the system should be able to reconstruct:

```text
Assessment
   ↓
Risk Factors
   ↓
Rules
   ↓
Relationships / Findings
   ↓
Evidence Records
   ↓
Original Evidence File
   ↓
SHA-256 Hash
```

This provides the investigator with a traceable path from the score back to the source evidence.

---

# 29. Design Constraints

The MVP Risk Engine must follow these constraints:

1. Deterministic scoring.
2. Explainable factors.
3. Evidence-backed inputs only.
4. No AI-generated risk scores.
5. No unsupported forensic conclusions.
6. No modification of original evidence.
7. Missing data is not automatically suspicious.
8. Confidence and risk remain separate.
9. Risk configuration is versioned.
10. Every material factor remains traceable to evidence.

---

# 30. MVP Acceptance Criteria

The Risk Engine is considered complete when:

* [ ] Entities can receive a deterministic 0–100 risk score.
* [ ] Risk severity is derived from documented thresholds.
* [ ] At least the initial transaction, device, communication, and identifier risk factors are implemented.
* [ ] Every material risk contribution has an explanation.
* [ ] Risk factors retain evidence references.
* [ ] Risk calculations are repeatable.
* [ ] Missing data does not automatically increase risk.
* [ ] Contradictory evidence is preserved.
* [ ] Scores are capped at 100.
* [ ] Risk assessment versions are recorded.
* [ ] The investigation graph can display risk information.
* [ ] The AI layer can explain existing risk assessments without changing them.
* [ ] Unit tests cover positive and negative cases.
* [ ] Risk results can be included in the investigative brief.

---

# 31. Guiding Principle

CYBERTRACE should never answer:

> **"Who is guilty?"**

The Risk Engine should answer:

> **"Which validated entities and patterns warrant closer investigative attention, and what evidence explains that prioritization?"**

That distinction is fundamental to maintaining an evidence-first forensic workflow.
