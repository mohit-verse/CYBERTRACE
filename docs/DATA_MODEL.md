# CYBERTRACE

## Data Model & Database Specification

**Document:** Data Model & Database Specification
**Version:** 1.0
**Status:** Draft for Development
**Related Documents:** `docs/PRD.md`, `docs/ARCHITECTURE.md`

---

# 1. Purpose

This document defines the logical data model for CYBERTRACE.

It specifies:

* core domain entities,
* database models,
* relationships,
* identifiers,
* evidence traceability,
* risk-analysis structures,
* investigation findings,
* timeline events,
* report metadata,
* indexing requirements,
* data integrity rules.

The purpose is to provide a stable data contract for implementation.

The physical PostgreSQL/Prisma schema may adapt implementation details where necessary, but it must preserve the logical relationships defined here.

---

# 2. Data Architecture

CYBERTRACE data is divided into five conceptual layers:

```text
┌─────────────────────────────┐
│  CASE MANAGEMENT            │
│  Case                       │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  EVIDENCE                   │
│  EvidenceFile               │
│  EvidenceRecord             │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  INVESTIGATION DATA         │
│  Entity                     │
│  Relationship               │
│  Transaction                │
│  TimelineEvent              │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  DERIVED INTELLIGENCE       │
│  RiskAssessment             │
│  RiskFactor                 │
│  InvestigationFinding       │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  OUTPUT                     │
│  Report                     │
└─────────────────────────────┘
```

---

# 3. Core Design Principles

## 3.1 Case Isolation

Every investigation-specific object must belong to a case directly or indirectly.

No evidence, entity, transaction, relationship, risk assessment or finding should accidentally cross case boundaries.

---

## 3.2 Evidence Traceability

Derived data must retain references to the evidence from which it originated.

The system should support tracing:

```text
Finding
   ↓
Risk / Relationship / Event
   ↓
Entity
   ↓
Normalized Record
   ↓
Evidence File
   ↓
SHA-256
```

---

## 3.3 Raw vs Derived Data

Raw evidence metadata and derived intelligence must remain separate.

```text
RAW
EvidenceFile

DERIVED
EvidenceRecord
Entity
Relationship
Transaction
RiskAssessment
Finding
TimelineEvent
```

The original uploaded artifact must never be represented as mutable normalized data.

---

## 3.4 Stable Entity Identity

A canonical entity must have a stable internal identifier independent of its display value.

For example:

```text
Entity ID:
ent_01HX...

Type:
PHONE

Canonical Value:
9876543210
```

The internal ID should be used for relationships.

---

# 4. Case

## Purpose

Represents one investigation.

### Fields

```text
id
caseNumber
title
description
status
createdAt
updatedAt
```

### Status

Initial statuses:

```text
ACTIVE
ARCHIVED
```

Additional statuses may be introduced later if required.

### Constraints

* `caseNumber` must be unique.
* `title` is required.
* `createdAt` and `updatedAt` are required.

---

# 5. EvidenceFile

## Purpose

Represents an original uploaded investigation artifact.

### Fields

```text
id
caseId
originalFilename
storedFilename
mimeType
fileExtension
fileSize
sha256
artifactType
processingStatus
storagePath
uploadedAt
processedAt
errorMessage
```

### Artifact Types

Initial supported logical categories:

```text
CDR
IPDR
BANK_TRANSACTION
UPI_TRANSACTION
EMAIL
ANDROID_LOG
OTHER
```

### Processing Status

```text
UPLOADED
HASHED
PROCESSING
PROCESSED
FAILED
```

### Integrity Requirements

`sha256` is mandatory after successful hashing.

The original artifact must not be modified by the parsing pipeline.

---

# 6. EvidenceFile Relationships

```text
Case
 │
 └──< EvidenceFile
```

One case can contain multiple evidence files.

Each evidence file belongs to exactly one case.

---

# 7. EvidenceRecord

## Purpose

Represents one parsed record originating from an evidence file.

This is the bridge between raw evidence and structured investigation data.

### Fields

```text
id
evidenceFileId
sourceRecordId
recordType
recordTimestamp
normalizedData
rawReference
createdAt
```

### `normalizedData`

A structured JSON field may be used initially to retain normalized source-specific attributes that do not justify dedicated columns.

Example:

```json
{
  "duration": 42,
  "sourcePhone": "9876543210",
  "destinationPhone": "9123456780"
}
```

Frequently queried fields should eventually receive dedicated database columns or indexes where performance requires them.

### `rawReference`

Contains a reference to the source record/location within the original evidence.

Examples:

```text
CSV row number
JSON object path
EML header reference
log line range
```

---

# 8. Entity

## Purpose

Represents a canonical digital entity discovered or resolved during investigation.

### Entity Types

Initial types:

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

### Fields

```text
id
caseId
type
canonicalValue
displayValue
metadata
createdAt
updatedAt
```

### Example

```text
id:
ent_phone_001

type:
PHONE

canonicalValue:
9876543210

displayValue:
+91 98765 43210
```

---

# 9. Entity Identity Rules

The combination of:

```text
caseId
type
canonicalValue
```

should normally identify one canonical entity within a case.

Therefore, the database should enforce a uniqueness constraint on:

```text
(caseId, type, canonicalValue)
```

This prevents duplicate canonical entities.

---

# 10. Entity Metadata

`metadata` may contain additional non-core attributes.

Example:

```json
{
  "countryCode": "91",
  "operator": "Example Telecom",
  "firstSeen": "2026-09-20T10:00:00Z",
  "lastSeen": "2026-09-21T18:20:00Z"
}
```

Metadata should not be used to store relationships.

Relationships belong in the `Relationship` model.

---

# 11. Relationship

## Purpose

Represents an evidence-backed relationship between two entities.

### Fields

```text
id
caseId
sourceEntityId
targetEntityId
relationshipType
confidence
reason
metadata
createdAt
updatedAt
```

### Relationship Types

Initial types:

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

The relationship vocabulary may expand as additional artifact types are implemented.

---

# 12. Relationship Direction

Relationships are directional where the underlying meaning is directional.

Example:

```text
ACCOUNT_A
   │
   │ TRANSFERRED_TO
   ▼
ACCOUNT_B
```

For relationships where direction is inherently irrelevant, the implementation may represent them using a consistent canonical direction.

---

# 13. Relationship Confidence

Confidence is represented as:

```text
HIGH
MEDIUM
LOW
```

The confidence describes the strength of the correlation produced by the system.

It does **not** represent legal certainty or proof of criminal activity.

---

# 14. Relationship Reason

Every automatically generated relationship should have an explainable reason where practical.

Example:

```text
relationshipType:
USES

source:
PHONE 9876543210

target:
IMEI 3567XXXXXXXXXXX

confidence:
HIGH

reason:
Exact IMEI observed for the phone in two CDR records.
```

This field is important for investigator transparency.

---

# 15. Relationship Evidence Mapping

A relationship may be supported by multiple evidence files and/or records.

Therefore, the data model must support a many-to-many relationship:

```text
Relationship
     │
     ├── EvidenceRecord
     ├── EvidenceRecord
     └── EvidenceRecord
```

Conceptually:

```text
RelationshipEvidence
--------------------
relationshipId
evidenceRecordId
```

This mapping allows the system to answer:

> "Which evidence supports this relationship?"

---

# 16. Transaction

## Purpose

Represents a financial transaction extracted from financial evidence.

A transaction is also an entity in the investigation graph when appropriate, but financial transaction-specific information should be represented separately for efficient querying.

### Fields

```text
id
caseId
sourceEvidenceRecordId
transactionReference
sourceAccountEntityId
destinationAccountEntityId
amount
currency
transactionTimestamp
channel
description
metadata
createdAt
```

### Initial channels

```text
UPI
BANK
OTHER
```

---

# 17. Transaction Relationships

Conceptually:

```text
Account A
    │
    │ source
    ▼
Transaction
    │
    │ destination
    ▼
Account B
```

This allows the system to build directional money-flow graphs.

---

# 18. RiskAssessment

## Purpose

Stores the current risk assessment for an entity.

### Fields

```text
id
caseId
entityId
score
severity
calculatedAt
modelVersion
```

### Score

Range:

```text
0–100
```

### Initial Severity

```text
LOW
MEDIUM
HIGH
CRITICAL
```

The thresholds are implementation decisions and may be tuned during MVP development.

---

# 19. RiskFactor

## Purpose

Stores the individual factors contributing to a risk assessment.

### Fields

```text
id
riskAssessmentId
factorType
weight
description
evidenceReferences
```

### Example

```text
factorType:
MULTI_HOP_TRANSFER

weight:
25

description:
Funds moved through multiple intermediary accounts.
```

This prevents the risk score from becoming an unexplained number.

---

# 20. Risk Calculation Relationship

```text
Entity
   │
   ▼
RiskAssessment
   │
   ├── RiskFactor
   ├── RiskFactor
   └── RiskFactor
```

Example:

```text
Account X

Risk Score: 87

├── Multi-hop routing       +25
├── Multiple sources        +20
├── High velocity           +15
├── Rapid onward transfer   +15
└── Device overlap          +12
```

The actual calculation rules will be defined in:

`docs/RISK_ENGINE.md`

---

# 21. TimelineEvent

## Purpose

Represents an event in the chronological investigation timeline.

### Fields

```text
id
caseId
eventType
timestamp
title
description
severity
sourceEvidenceRecordId
primaryEntityId
metadata
createdAt
```

### Example

```text
timestamp:
2026-09-21 10:02:13

eventType:
TRANSACTION

title:
Victim transaction

description:
₹25,000 transaction initiated by victim.
```

---

# 22. InvestigationFinding

## Purpose

Represents a significant pattern or observation detected by the system.

### Fields

```text
id
caseId
findingType
severity
title
description
status
createdAt
updatedAt
```

### Initial Finding Types

```text
SHARED_IMEI
MULTIPLE_PHONE_ASSOCIATION
MULTI_HOP_TRANSACTION
HIGH_TRANSACTION_VELOCITY
SHARED_IP
RECURRING_UPI_BENEFICIARY
RAPID_SIM_SWITCH
SUSPICIOUS_EMAIL_HEADER
```

The exact supported finding types will evolve with the implemented parsers.

---

# 23. Finding Evidence

A finding may be supported by:

* entities,
* relationships,
* transactions,
* timeline events,
* evidence records.

Therefore, findings should have traceability mappings rather than embedding arbitrary evidence text.

Conceptually:

```text
InvestigationFinding
       │
       ├── FindingEntity
       ├── FindingRelationship
       ├── FindingTransaction
       └── FindingEvidence
```

The implementation may simplify these mappings where a generic evidence-reference mechanism is more appropriate.

---

# 24. Report

## Purpose

Represents a generated investigative report.

### Fields

```text
id
caseId
reportType
format
status
generatedAt
filePath
metadata
```

### Initial report types

```text
INVESTIGATIVE_BRIEF
```

### Formats

```text
PDF
JSON
```

---

# 25. Report Generation

Reports must be generated primarily from structured investigation data.

```text
Case
+
Entities
+
Relationships
+
Transactions
+
Risk
+
Timeline
+
Findings
+
Evidence Metadata
       ↓
Report Builder
       ↓
PDF / JSON
```

AI may generate narrative summaries, but factual structured sections should originate from database data.

---

# 26. AI Conversation / Investigation Queries

The MVP may maintain a lightweight record of investigation questions and responses.

Conceptual model:

```text
InvestigationQuery
------------------
id
caseId
question
response
createdAt
```

The stored response should not be treated as forensic evidence.

AI-generated responses are derived intelligence and should remain distinguishable from source evidence.

---

# 27. Entity-to-Evidence Traceability

An entity may be discovered from multiple evidence records.

Conceptual mapping:

```text
EntityEvidence
--------------
entityId
evidenceRecordId
```

Example:

```text
IMEI X
 │
 ├── CDR record 17
 ├── CDR record 24
 └── Android log record 8
```

This enables investigators to inspect where an entity originated.

---

# 28. Relationship Graph Representation

The application graph should be generated from:

```text
Entity
+
Relationship
```

rather than stored as a separate duplicate graph database for the MVP.

### Node

```text
Entity
```

### Edge

```text
Relationship
```

### Edge metadata

```text
relationshipType
confidence
reason
evidenceReferences
```

This avoids maintaining two competing sources of truth.

---

# 29. Database Indexing Strategy

Initial indexes should prioritize investigation queries.

## Case

```text
caseNumber
status
createdAt
```

## EvidenceFile

```text
caseId
artifactType
processingStatus
sha256
```

## EvidenceRecord

```text
evidenceFileId
recordTimestamp
recordType
```

## Entity

```text
caseId
type
canonicalValue
```

Composite uniqueness:

```text
(caseId, type, canonicalValue)
```

## Relationship

```text
caseId
sourceEntityId
targetEntityId
relationshipType
confidence
```

## Transaction

```text
caseId
transactionTimestamp
sourceAccountEntityId
destinationAccountEntityId
transactionReference
```

## TimelineEvent

```text
caseId
timestamp
eventType
```

## RiskAssessment

```text
caseId
entityId
score
severity
```

---

# 30. Referential Integrity

The database should enforce foreign-key relationships.

Examples:

```text
EvidenceFile.caseId
→ Case.id

EvidenceRecord.evidenceFileId
→ EvidenceFile.id

Entity.caseId
→ Case.id

Relationship.sourceEntityId
→ Entity.id

Relationship.targetEntityId
→ Entity.id

Transaction.caseId
→ Case.id

RiskAssessment.entityId
→ Entity.id

TimelineEvent.caseId
→ Case.id

Report.caseId
→ Case.id
```

---

# 31. Deletion Strategy

Because investigation data has evidence-traceability requirements, hard deletion should be avoided for evidence-related records in the MVP unless explicitly required.

Preferred approach:

```text
Case
Evidence
Derived Intelligence
```

should use controlled lifecycle/status management.

The application should not casually delete evidence records because a UI object was removed.

---

# 32. Data Consistency Rules

The implementation must enforce:

1. Every entity belongs to a case.
2. Every relationship belongs to a case.
3. A relationship's source and target entities must belong to the same case.
4. Every transaction belongs to a case.
5. Evidence records reference an existing evidence file.
6. Evidence files reference an existing case.
7. Risk assessments reference an entity in the same case.
8. Findings reference entities/relationships/evidence belonging to the same case.
9. Cross-case relationships are prohibited.
10. Original evidence metadata cannot be silently overwritten.

---

# 33. Case-Level Isolation Rule

The following must never occur:

```text
Case A
  │
  └── Entity X
          │
          └── Relationship
                  │
                  └── Entity Y from Case B
```

All graph relationships must remain inside a single investigation case for the MVP.

Cross-case correlation is a future capability.

---

# 34. Identifier Strategy

Use internal generated identifiers for database objects.

Recommended format:

```text
UUID
```

or an equivalent collision-resistant identifier.

Identifiers should not expose sensitive information.

Examples:

```text
case ID:
UUID

entity ID:
UUID

evidence ID:
UUID
```

Human-readable case numbers may be separate from internal IDs.

---

# 35. Sensitive Data Handling

Entities such as:

* phone numbers,
* bank accounts,
* email addresses,
* IP addresses,
* IMEI/IMSI values

may contain sensitive information.

The application should:

* avoid exposing unnecessary values in logs,
* avoid including raw sensitive values in error messages,
* mask sensitive values in overview UI where appropriate,
* reveal full values only where necessary for investigation.

Example:

```text
Overview:
XXXXXX3210

Detail:
9876543210
```

---

# 36. Auditability

The MVP should record important processing timestamps.

At minimum:

```text
Evidence uploaded
Evidence hashed
Evidence processing started
Evidence processing completed
Risk calculated
Report generated
```

A dedicated audit-log model is optional for the initial MVP and may be added if required.

---

# 37. Prisma Implementation Guidance

The Prisma schema should reflect the logical model defined here.

However, implementation should avoid prematurely creating dozens of specialized tables for every possible artifact field.

Prefer:

```text
Dedicated columns
```

for frequently queried core attributes.

Use:

```text
JSON / JSONB
```

for source-specific metadata that does not yet justify dedicated schema fields.

This allows the MVP to remain flexible while retaining a stable core data model.

---

# 38. Initial Logical Relationship Diagram

```text
                          ┌──────────────┐
                          │     CASE     │
                          └──────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
              EvidenceFile    Entity      Report
                    │            │
                    ▼            │
              EvidenceRecord     │
                    │            │
                    └──────┬─────┘
                           │
                           ▼
                     Relationship
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
           Entity                    Entity

              Entity
                 │
                 ├──────────────► RiskAssessment
                 │                       │
                 │                       ▼
                 │                  RiskFactor
                 │
                 ├──────────────► TimelineEvent
                 │
                 └──────────────► InvestigationFinding

              EvidenceRecord
                    │
                    ▼
               Transaction
```

---

# 39. MVP Data Model Summary

The initial implementation should contain these primary models:

```text
Case
EvidenceFile
EvidenceRecord
Entity
Relationship
Transaction
RiskAssessment
RiskFactor
TimelineEvent
InvestigationFinding
Report
```

Optional/secondary models:

```text
InvestigationQuery
EntityEvidence
RelationshipEvidence
```

The exact join-table implementation may be determined during Prisma implementation.

---

# 40. Data Model Acceptance Criteria

The data model is considered ready for implementation when:

* every PRD-required feature has an associated data representation;
* every relationship can be traced to supporting evidence;
* entities cannot accidentally cross case boundaries;
* transactions can represent directional financial flows;
* risk scores can store their contributing factors;
* findings can reference supporting investigation data;
* timeline events can be ordered chronologically;
* reports can be generated from structured data;
* the graph can be derived from `Entity` + `Relationship`;
* Prisma can implement the model without requiring architectural changes.

---

# 41. Relationship to Other Documents

This document defines the **data contract**.

The following documents build upon it:

```text
PRD.md
   ↓
ARCHITECTURE.md
   ↓
DATA_MODEL.md
   ↓
CORRELATION_ENGINE.md
   ↓
RISK_ENGINE.md
   ↓
AI_LAYER.md
   ↓
IMPLEMENTATION
```

`CORRELATION_ENGINE.md` must not introduce entity or relationship concepts that contradict this document without explicitly documenting the change.
