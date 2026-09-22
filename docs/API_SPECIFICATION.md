# CYBERTRACE — API Specification

**Document:** `docs/API_SPECIFICATION.md`
**Version:** 1.0
**Status:** Draft for MVP implementation
**Purpose:** Define the application API contract for CYBERTRACE

---

# 1. Purpose

This document defines the internal API contract for the CYBERTRACE MVP.

The API connects the investigation interface with:

* case management;
* evidence ingestion;
* processing;
* entity resolution;
* correlation;
* risk assessment;
* investigation graph;
* AI investigation assistant;
* report generation.

The objective is to provide both developers with a stable contract between the UI and server-side application logic.

---

# 2. API Architecture

CYBERTRACE uses a Next.js modular-monolith architecture.

Conceptually:

```text
Browser
   │
   ▼
Next.js API / Server Actions
   │
   ▼
Application Services
   │
   ├── Case Service
   ├── Evidence Service
   ├── Processing Service
   ├── Entity Service
   ├── Correlation Service
   ├── Risk Service
   ├── Graph Service
   ├── AI Service
   └── Report Service
   │
   ▼
Prisma
   │
   ▼
PostgreSQL
```

The exact Next.js implementation mechanism may use Route Handlers, Server Actions, or a combination where appropriate.

The logical API contracts defined here must remain stable regardless of the internal transport mechanism.

---

# 3. API Design Principles

The API must:

1. Return structured data.
2. Validate all input.
3. Enforce case isolation.
4. Never trust client-provided IDs without validation.
5. Never expose secrets.
6. Return meaningful error codes.
7. Keep business logic out of UI components.
8. Preserve evidence traceability.
9. Avoid exposing unnecessary sensitive data.
10. Use deterministic server-side processing for forensic intelligence.

---

# 4. Base Response Structure

Successful responses should follow a consistent structure.

```json
{
  "success": true,
  "data": {}
}
```

Errors should follow:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

The exact HTTP status should also reflect the error category.

---

# 5. Common HTTP Status Codes

| Status | Usage                        |
| -----: | ---------------------------- |
|    200 | Successful request           |
|    201 | Resource created             |
|    400 | Invalid request              |
|    401 | Authentication required      |
|    403 | Unauthorized access          |
|    404 | Resource not found           |
|    409 | Conflict                     |
|    413 | File too large               |
|    422 | Validation failure           |
|    500 | Internal server error        |
|    503 | External service unavailable |

---

# 6. Case API

## 6.1 Create Case

### Endpoint

```text
POST /api/cases
```

### Request

```json
{
  "caseNumber": "CASE-2026-001",
  "title": "UPI Fraud — Multi-Hop Mule Network",
  "description": "Fictional investigation case"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "case-id",
    "caseNumber": "CASE-2026-001",
    "title": "UPI Fraud — Multi-Hop Mule Network",
    "status": "ACTIVE"
  }
}
```

---

# 7. List Cases

### Endpoint

```text
GET /api/cases
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "case-id",
      "caseNumber": "CASE-2026-001",
      "title": "UPI Fraud — Multi-Hop Mule Network",
      "status": "ACTIVE"
    }
  ]
}
```

---

# 8. Get Case

### Endpoint

```text
GET /api/cases/:caseId
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "case-id",
    "caseNumber": "CASE-2026-001",
    "title": "UPI Fraud — Multi-Hop Mule Network",
    "description": "Fictional investigation case",
    "status": "ACTIVE",
    "createdAt": "2026-09-20T10:00:00Z",
    "updatedAt": "2026-09-20T10:00:00Z"
  }
}
```

---

# 9. Case Dashboard

### Endpoint

```text
GET /api/cases/:caseId/dashboard
```

### Response

```json
{
  "success": true,
  "data": {
    "evidenceCount": 6,
    "entityCount": 12,
    "relationshipCount": 15,
    "transactionCount": 3,
    "findingCount": 4,
    "highRiskEntityCount": 2,
    "timelineEventCount": 8
  }
}
```

All values must be calculated from current case data.

They must not be hard-coded for the demo.

---

# 10. Evidence API

## 10.1 Upload Evidence

### Endpoint

```text
POST /api/cases/:caseId/evidence
```

### Request

Multipart form data:

```text
file=<evidence file>
artifactType=<artifact type>
```

Supported artifact types:

```text
CDR
IPDR
BANK_TRANSACTION
UPI_TRANSACTION
EMAIL
ANDROID_LOG
OTHER
```

---

# 11. Evidence Upload Response

```json
{
  "success": true,
  "data": {
    "id": "evidence-id",
    "originalFilename": "bank_transactions.csv",
    "artifactType": "BANK_TRANSACTION",
    "processingStatus": "UPLOADED",
    "integrityStatus": "PENDING"
  }
}
```

The API must not report `VERIFIED` before the hash has actually been calculated and stored.

---

# 12. Calculate Evidence Hash

Hashing may occur automatically during upload.

If exposed as a separate internal operation:

```text
POST /api/cases/:caseId/evidence/:evidenceId/hash
```

### Response

```json
{
  "success": true,
  "data": {
    "evidenceId": "evidence-id",
    "sha256": "<64-character-sha256>",
    "integrityStatus": "VERIFIED"
  }
}
```

---

# 13. Get Evidence

### Endpoint

```text
GET /api/cases/:caseId/evidence/:evidenceId
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "evidence-id",
    "originalFilename": "bank_transactions.csv",
    "mimeType": "text/csv",
    "fileSize": 12345,
    "artifactType": "BANK_TRANSACTION",
    "sha256": "<hash>",
    "integrityStatus": "VERIFIED",
    "processingStatus": "PROCESSED",
    "uploadedAt": "2026-09-20T10:00:00Z",
    "processedAt": "2026-09-20T10:00:03Z"
  }
}
```

---

# 14. List Evidence

### Endpoint

```text
GET /api/cases/:caseId/evidence
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "evidence-001",
      "originalFilename": "cdr.csv",
      "artifactType": "CDR",
      "sha256": "<hash>",
      "integrityStatus": "VERIFIED",
      "processingStatus": "PROCESSED"
    },
    {
      "id": "evidence-002",
      "originalFilename": "ipdr.csv",
      "artifactType": "IPDR",
      "sha256": "<hash>",
      "integrityStatus": "VERIFIED",
      "processingStatus": "PROCESSED"
    }
  ]
}
```

---

# 15. Process Evidence

### Endpoint

```text
POST /api/cases/:caseId/evidence/:evidenceId/process
```

### Response

```json
{
  "success": true,
  "data": {
    "evidenceId": "evidence-id",
    "processingStatus": "PROCESSING"
  }
}
```

Processing may be synchronous or asynchronous depending on implementation.

The API contract should not require the frontend to assume that processing completes immediately.

---

# 16. Evidence Processing Status

### Endpoint

```text
GET /api/cases/:caseId/evidence/:evidenceId/status
```

### Response

```json
{
  "success": true,
  "data": {
    "evidenceId": "evidence-id",
    "integrityStatus": "VERIFIED",
    "processingStatus": "PROCESSED",
    "processedAt": "2026-09-20T10:00:03Z",
    "errorMessage": null
  }
}
```

---

# 17. Verify Evidence Integrity

### Endpoint

```text
POST /api/cases/:caseId/evidence/:evidenceId/verify
```

### Response

```json
{
  "success": true,
  "data": {
    "evidenceId": "evidence-id",
    "storedSha256": "<hash>",
    "calculatedSha256": "<hash>",
    "integrityStatus": "VERIFIED"
  }
}
```

For a mismatch:

```json
{
  "success": true,
  "data": {
    "evidenceId": "evidence-id",
    "storedSha256": "<hash-a>",
    "calculatedSha256": "<hash-b>",
    "integrityStatus": "MISMATCH"
  }
}
```

The stored hash must not automatically be replaced.

---

# 18. Entity API

## 18.1 List Entities

### Endpoint

```text
GET /api/cases/:caseId/entities
```

### Optional query parameters

```text
type=PHONE
riskLevel=HIGH
search=9876500002
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "entity-id",
      "type": "PHONE",
      "canonicalValue": "9876500002",
      "displayValue": "9876500002"
    }
  ]
}
```

---

# 19. Get Entity

### Endpoint

```text
GET /api/cases/:caseId/entities/:entityId
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "entity-id",
    "type": "BANK_ACCOUNT",
    "canonicalValue": "9000012345",
    "displayValue": "9000012345",
    "metadata": {},
    "riskAssessment": {},
    "relationships": [],
    "evidenceReferences": []
  }
}
```

---

# 20. Entity Relationships

### Endpoint

```text
GET /api/cases/:caseId/entities/:entityId/relationships
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "relationship-id",
      "sourceEntityId": "entity-a",
      "targetEntityId": "entity-b",
      "relationshipType": "USES",
      "confidence": "HIGH",
      "reason": "Explicit association in IPDR evidence",
      "evidenceReferences": [
        "evidence-record-id"
      ]
    }
  ]
}
```

---

# 21. Relationship API

## 21.1 Get Relationship

### Endpoint

```text
GET /api/cases/:caseId/relationships/:relationshipId
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "relationship-id",
    "sourceEntityId": "entity-a",
    "targetEntityId": "entity-b",
    "relationshipType": "USES",
    "confidence": "HIGH",
    "reason": "Explicit structured association",
    "metadata": {},
    "evidenceReferences": [
      "record-id"
    ]
  }
}
```

---

# 22. Transaction API

## 22.1 List Transactions

### Endpoint

```text
GET /api/cases/:caseId/transactions
```

### Optional query parameters

```text
from=<timestamp>
to=<timestamp>
account=<entityId>
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "transaction-id",
      "transactionReference": "TXN001",
      "sourceAccountEntityId": "victim",
      "destinationAccountEntityId": "mule-a",
      "amount": 25000,
      "currency": "INR",
      "transactionTimestamp": "2026-09-20T10:00:00Z",
      "channel": "UPI"
    }
  ]
}
```

---

# 23. Transaction Detail

### Endpoint

```text
GET /api/cases/:caseId/transactions/:transactionId
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "transaction-id",
    "transactionReference": "TXN001",
    "amount": 25000,
    "currency": "INR",
    "channel": "UPI",
    "transactionTimestamp": "2026-09-20T10:00:00Z",
    "sourceAccountEntityId": "victim",
    "destinationAccountEntityId": "mule-a",
    "sourceEvidenceRecordId": "record-id"
  }
}
```

---

# 24. Correlation API

## 24.1 Run Correlation

### Endpoint

```text
POST /api/cases/:caseId/correlation/run
```

### Response

```json
{
  "success": true,
  "data": {
    "status": "COMPLETED",
    "relationshipsCreated": 12,
    "findingsCreated": 4
  }
}
```

The correlation service must use deterministic rules defined in `CORRELATION_ENGINE.md`.

---

# 25. Correlation Status

### Endpoint

```text
GET /api/cases/:caseId/correlation/status
```

### Response

```json
{
  "success": true,
  "data": {
    "status": "COMPLETED",
    "lastRunAt": "2026-09-20T10:02:00Z"
  }
}
```

---

# 26. Risk API

## 26.1 Calculate Risk

### Endpoint

```text
POST /api/cases/:caseId/risk/calculate
```

### Response

```json
{
  "success": true,
  "data": {
    "status": "COMPLETED",
    "assessmentsCalculated": 12,
    "engineVersion": "risk-engine-v1"
  }
}
```

---

# 27. List Risk Assessments

### Endpoint

```text
GET /api/cases/:caseId/risk
```

### Optional query parameters

```text
severity=HIGH
entityType=BANK_ACCOUNT
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "entityId": "entity-id",
      "score": 78,
      "severity": "CRITICAL",
      "modelVersion": "risk-engine-v1",
      "calculatedAt": "2026-09-20T10:03:00Z",
      "factors": []
    }
  ]
}
```

---

# 28. Entity Risk Assessment

### Endpoint

```text
GET /api/cases/:caseId/entities/:entityId/risk
```

### Response

```json
{
  "success": true,
  "data": {
    "entityId": "entity-id",
    "score": 78,
    "severity": "CRITICAL",
    "modelVersion": "risk-engine-v1",
    "factors": [
      {
        "factorType": "MULTI_HOP_TRANSACTION",
        "scoreContribution": 25,
        "description": "Entity participates in a validated multi-hop transaction path.",
        "evidenceReferences": []
      }
    ]
  }
}
```

---

# 29. Investigation Findings API

## 29.1 List Findings

### Endpoint

```text
GET /api/cases/:caseId/findings
```

### Optional query parameters

```text
severity=HIGH
type=SHARED_IMEI
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "finding-id",
      "findingType": "SHARED_IMEI",
      "severity": "HIGH",
      "title": "Shared IMEI association",
      "description": "Two phone numbers are associated with the same validated IMEI.",
      "status": "OPEN",
      "evidenceReferences": []
    }
  ]
}
```

---

# 30. Timeline API

## 30.1 Get Timeline

### Endpoint

```text
GET /api/cases/:caseId/timeline
```

### Optional query parameters

```text
from=<timestamp>
to=<timestamp>
entity=<entityId>
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "event-id",
      "eventType": "TRANSACTION",
      "timestamp": "2026-09-20T10:00:00Z",
      "title": "Victim transferred funds",
      "description": "₹25,000 transferred to Mule Account A.",
      "severity": "HIGH",
      "primaryEntityId": "mule-a",
      "sourceEvidenceRecordId": "record-id"
    }
  ]
}
```

---

# 31. Graph API

## 31.1 Get Investigation Graph

### Endpoint

```text
GET /api/cases/:caseId/graph
```

### Response

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "entity-a",
        "type": "BANK_ACCOUNT",
        "label": "9000012345",
        "riskScore": 78,
        "severity": "CRITICAL"
      }
    ],
    "edges": [
      {
        "id": "relationship-id",
        "source": "entity-a",
        "target": "entity-b",
        "type": "TRANSFERRED_TO",
        "confidence": "HIGH"
      }
    ]
  }
}
```

---

# 32. Graph Filtering

Optional query parameters:

```text
entityTypes=BANK_ACCOUNT,PHONE
relationshipTypes=TRANSFERRED_TO,USES
minRiskScore=50
```

The graph API should return only the requested subset where possible.

Filtering should occur server-side for larger datasets rather than transferring unnecessary records to the browser.

---

# 33. Transaction Path API

The investigation interface may request a transaction path.

### Endpoint

```text
GET /api/cases/:caseId/graph/transaction-path
```

### Query parameters

```text
fromEntity=<entityId>
toEntity=<entityId>
```

### Response

```json
{
  "success": true,
  "data": {
    "path": [
      {
        "entityId": "victim"
      },
      {
        "entityId": "mule-a"
      },
      {
        "entityId": "mule-b"
      },
      {
        "entityId": "cashout"
      }
    ],
    "transactions": [
      {
        "transactionId": "txn-001",
        "amount": 25000
      }
    ]
  }
}
```

The path must be based on validated transaction relationships.

---

# 34. AI API

## 34.1 Ask Investigation

### Endpoint

```text
POST /api/cases/:caseId/investigation/ask
```

### Request

```json
{
  "question": "Why is Account A high risk?"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "answer": "Account A received its current risk assessment because it participates in a validated multi-hop transaction path and shows rapid onward transfers.",
    "evidenceReferences": [
      "EVID-001",
      "EVID-003"
    ]
  }
}
```

---

# 35. AI Context Rules

The API must not simply send the entire database to the AI provider.

The server should first resolve relevant context.

Conceptually:

```text
User Question
      ↓
Context Resolver
      ↓
Relevant Entities
Relevant Transactions
Relevant Relationships
Relevant Findings
Relevant Risk
Relevant Evidence References
      ↓
AI Provider
```

---

# 36. AI Response Requirements

The AI response must:

* use structured case data;
* preserve uncertainty;
* avoid unsupported claims;
* reference evidence where applicable;
* never modify stored risk values;
* never create official relationships.

---

# 37. AI Provider Failure

If the external AI provider fails:

```json
{
  "success": false,
  "error": {
    "code": "AI_PROVIDER_UNAVAILABLE",
    "message": "The investigation assistant is temporarily unavailable."
  }
}
```

The rest of the investigation application must remain operational.

---

# 38. AI Mock Mode

Development should support:

```text
AI_PROVIDER=mock
```

The mock service should return deterministic responses for canonical demo questions.

Example:

```text
Why is Account A high risk?
```

The mock response should be generated from or aligned with the current structured demo data rather than containing arbitrary static claims.

---

# 39. Report API

## 39.1 Generate Investigative Brief

### Endpoint

```text
POST /api/cases/:caseId/reports
```

### Request

```json
{
  "type": "INVESTIGATIVE_BRIEF",
  "formats": [
    "PDF",
    "JSON"
  ]
}
```

### Response

```json
{
  "success": true,
  "data": {
    "reportId": "report-id",
    "status": "GENERATING",
    "formats": [
      "PDF",
      "JSON"
    ]
  }
}
```

---

# 40. Report Status

### Endpoint

```text
GET /api/cases/:caseId/reports/:reportId
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "report-id",
    "type": "INVESTIGATIVE_BRIEF",
    "status": "COMPLETED",
    "formats": [
      "PDF",
      "JSON"
    ],
    "generatedAt": "2026-09-20T10:10:00Z"
  }
}
```

---

# 41. Report Download

The implementation may expose separate download routes.

Conceptually:

```text
GET /api/cases/:caseId/reports/:reportId/pdf
```

and:

```text
GET /api/cases/:caseId/reports/:reportId/json
```

Access must verify case authorization.

---

# 42. Report Content Contract

The investigative brief should be able to represent:

```text
Case Summary
Key Entities
Transaction Flow
Key Relationships
Risk Assessments
Timeline
Investigation Findings
Evidence Integrity
SHA-256 References
Investigation Leads
```

The exact visual report layout is defined separately from this API contract.

---

# 43. Report Integrity Rule

Structured report fields must come from application data.

For example:

```text
Risk Score
Entity ID
Transaction Amount
SHA-256
Timestamp
Relationship Confidence
```

must not be obtained from free-form AI output.

AI may generate narrative text based on these values.

---

# 44. Evidence Record API

## Get Evidence Records

### Endpoint

```text
GET /api/cases/:caseId/evidence/:evidenceId/records
```

### Optional query parameters

```text
page=1
limit=50
recordType=TRANSACTION
```

### Response

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "record-id",
        "sourceRecordId": "TXN001",
        "recordType": "TRANSACTION",
        "recordTimestamp": "2026-09-20T10:00:00Z",
        "normalizedData": {},
        "rawReference": {
          "row": 2
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 3
    }
  }
}
```

---

# 45. Pagination

Endpoints returning potentially large datasets should support pagination.

Recommended query parameters:

```text
page=1
limit=50
```

The server should enforce a maximum limit.

For example:

```text
limit <= 100
```

The exact value can be configured.

---

# 46. Search

Entity and evidence endpoints may support server-side search.

Example:

```text
GET /api/cases/:caseId/entities?search=9876500002
```

Search must operate on normalized/canonical fields where appropriate.

---

# 47. Filtering

Filtering should use structured fields.

Examples:

```text
type=PHONE
severity=HIGH
artifactType=CDR
processingStatus=FAILED
```

Avoid free-form filtering logic that exposes database implementation details.

---

# 48. Authentication

If authentication is implemented in the MVP, every case-scoped endpoint must verify:

```text
Authenticated User
       ↓
Case Access
       ↓
Requested Resource
```

The client must never be trusted to determine authorization.

If authentication is deferred for the hackathon prototype, the architecture should still preserve the case-scoped API boundary so authentication can be added later.

---

# 49. Authorization

A user authorized for:

```text
CASE-001
```

must not automatically gain access to:

```text
CASE-002
```

Every case-scoped request must validate the case-resource relationship.

---

# 50. Input Validation

All API inputs must be validated before business logic executes.

Validate:

* UUID/ID format;
* enums;
* strings;
* timestamps;
* numbers;
* file size;
* file type;
* query parameters.

Use a consistent validation library or shared validation layer.

---

# 51. Error Codes

Suggested error codes:

```text
CASE_NOT_FOUND
CASE_ACCESS_DENIED
EVIDENCE_NOT_FOUND
EVIDENCE_INVALID
EVIDENCE_TOO_LARGE
EVIDENCE_UNSUPPORTED
EVIDENCE_INTEGRITY_MISMATCH
EVIDENCE_PROCESSING_FAILED
INVALID_INPUT
ENTITY_NOT_FOUND
RELATIONSHIP_NOT_FOUND
TRANSACTION_NOT_FOUND
CORRELATION_FAILED
RISK_CALCULATION_FAILED
AI_PROVIDER_UNAVAILABLE
AI_RESPONSE_INVALID
REPORT_GENERATION_FAILED
REPORT_NOT_FOUND
INTERNAL_ERROR
```

The exact set may expand during implementation.

---

# 52. Error Handling Principle

Errors should provide enough information for the UI to respond appropriately without exposing internal implementation details.

Bad:

```json
{
  "error": "PrismaClientKnownRequestError..."
}
```

Better:

```json
{
  "success": false,
  "error": {
    "code": "EVIDENCE_NOT_FOUND",
    "message": "The requested evidence file could not be found."
  }
}
```

Detailed technical errors belong in server-side logs.

---

# 53. Idempotency

Operations that may be retried should be designed to avoid unintended duplication.

Examples:

```text
Process Evidence
Run Correlation
Calculate Risk
Generate Report
```

Repeated requests should not blindly create duplicate:

* relationships;
* findings;
* risk factors;
* reports.

The exact idempotency strategy should follow the relevant module specification.

---

# 54. Processing State Machine

Evidence processing should follow explicit states.

```text
UPLOADED
   │
   ▼
HASHED
   │
   ▼
PROCESSING
   │
   ├──► PROCESSED
   │
   └──► FAILED
```

The API should expose the current state.

---

# 55. Correlation State

Correlation can use:

```text
NOT_STARTED
RUNNING
COMPLETED
FAILED
```

The exact persistence mechanism can be implemented as appropriate.

---

# 56. Risk Calculation State

Risk calculation can use:

```text
NOT_STARTED
RUNNING
COMPLETED
FAILED
```

Risk results should not be shown as current if the latest required calculation failed.

---

# 57. Report State

Report generation can use:

```text
QUEUED
GENERATING
COMPLETED
FAILED
```

The UI should poll or refresh status if report generation is asynchronous.

---

# 58. API Security Rules

The API must:

* validate all user input;
* enforce authorization;
* avoid exposing secrets;
* avoid raw database errors;
* limit uploads;
* prevent path traversal;
* protect sensitive evidence;
* rate-limit expensive operations where appropriate.

---

# 59. API and Evidence Integrity

The API must preserve the evidence chain:

```text
API Request
   ↓
Evidence
   ↓
SHA-256
   ↓
Evidence Record
   ↓
Relationship
   ↓
Risk / Finding
   ↓
Report
```

No API endpoint should allow a client to directly overwrite:

```text
sha256
confidence
risk score
source evidence
```

without going through the appropriate server-side processing logic.

---

# 60. API and AI Boundary

The frontend should never directly call the external AI provider.

Correct:

```text
Browser
   ↓
CYBERTRACE API
   ↓
AI Service
   ↓
AI Provider
```

Incorrect:

```text
Browser
   ↓
AI Provider
```

This protects API credentials and ensures that structured case context is controlled by CYBERTRACE.

---

# 61. API and Graph Boundary

The graph UI should consume structured graph data.

It should not independently reconstruct relationships from arbitrary database responses.

Preferred:

```text
GET /api/cases/:caseId/graph
```

returns:

```text
nodes[]
edges[]
```

The graph component renders that structure.

---

# 62. API Versioning

For the hackathon MVP, API versioning is optional because the API is an internal application contract.

If public API exposure becomes a future requirement, introduce explicit versioning such as:

```text
/api/v1/...
```

Do not add versioning complexity to the MVP unless required.

---

# 63. API Documentation

The implementation should keep API contracts synchronized with:

* TypeScript types;
* validation schemas;
* service interfaces;
* frontend consumers.

If the request/response structure changes materially, update this document.

---

# 64. Frontend Service Layer

The frontend should not scatter raw API calls throughout components.

Prefer:

```text
lib/
  api/
    cases.ts
    evidence.ts
    entities.ts
    graph.ts
    risk.ts
    investigation.ts
    reports.ts
```

Conceptually:

```ts
const caseData = await casesApi.get(caseId);
```

rather than embedding fetch logic inside every component.

---

# 65. Type Sharing

Where practical, request and response types should be shared between server and client.

Example:

```text
Case
Evidence
Entity
Relationship
RiskAssessment
Finding
GraphData
InvestigationAnswer
Report
```

Shared types reduce mismatches between frontend and backend.

---

# 66. API Testing Requirements

Each major endpoint should have tests covering:

### Success

Valid request returns expected structure.

### Validation

Invalid input is rejected.

### Authorization

Unauthorized access is rejected.

### Not found

Missing resources return appropriate errors.

### Processing failure

Internal processing errors return controlled responses.

### Case isolation

Resources from another case cannot be accessed.

---

# 67. Minimum MVP API Set

If development time becomes limited, the minimum API surface should be:

```text
POST /api/cases
GET  /api/cases/:caseId

POST /api/cases/:caseId/evidence
GET  /api/cases/:caseId/evidence
GET  /api/cases/:caseId/evidence/:evidenceId
POST /api/cases/:caseId/evidence/:evidenceId/process

GET  /api/cases/:caseId/entities
GET  /api/cases/:caseId/entities/:entityId

GET  /api/cases/:caseId/graph

GET  /api/cases/:caseId/risk
GET  /api/cases/:caseId/findings
GET  /api/cases/:caseId/timeline

POST /api/cases/:caseId/investigation/ask

POST /api/cases/:caseId/reports
GET  /api/cases/:caseId/reports/:reportId
```

Additional endpoints should be implemented only when required by the UI or workflow.

---

# 68. End-to-End API Flow

The primary application workflow should look like:

```text
POST /cases
       │
       ▼
POST /evidence
       │
       ▼
POST /evidence/:id/process
       │
       ▼
GET /entities
       │
       ▼
GET /graph
       │
       ▼
GET /risk
       │
       ▼
GET /findings
       │
       ▼
POST /investigation/ask
       │
       ▼
POST /reports
       │
       ▼
GET /reports/:id
```

The frontend should not need to understand the internal implementation of parsers, correlation rules, or risk calculations.

---

# 69. Final API Principle

The CYBERTRACE API should act as a controlled boundary between:

```text
Investigator
     ↓
Application
     ↓
Evidence & Intelligence Engines
     ↓
Database / Storage / AI
```

The API must preserve the most important system property:

> **Every meaningful investigative result must remain traceable to structured evidence, while sensitive processing remains controlled by the server.**

The API exists to expose that intelligence safely and consistently — not to bypass the application's evidence, correlation, risk, or integrity rules.
