# CYBERTRACE

## System Architecture Document

**Document:** System Architecture
**Version:** 1.0
**Status:** Draft for Development
**Related Document:** `docs/PRD.md`

---

# 1. Architecture Overview

CYBERTRACE uses an **evidence-first, modular application architecture**.

The system separates:

1. Raw evidence
2. Evidence integrity
3. Parsing
4. Normalization
5. Entity extraction
6. Entity resolution
7. Correlation
8. Risk analysis
9. Graph representation
10. AI-assisted investigation
11. Report generation

The architecture follows this processing sequence:

```text
                    ┌──────────────────────┐
                    │     Investigator     │
                    │      Web Client      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   CYBERTRACE App     │
                    │      Next.js         │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Case Management    Evidence Layer    Investigation UI
              │                │                │
              │                ▼                │
              │       ┌────────────────┐        │
              │       │ SHA-256 Hashing│        │
              │       └───────┬────────┘        │
              │               ▼                 │
              │       ┌────────────────┐        │
              │       │ Artifact Parser│        │
              │       └───────┬────────┘        │
              │               ▼                 │
              │       ┌────────────────┐        │
              │       │ Normalization  │        │
              │       └───────┬────────┘        │
              │               ▼                 │
              │       ┌────────────────┐        │
              │       │ Entity Engine  │        │
              │       └───────┬────────┘        │
              │               ▼                 │
              │       ┌────────────────┐        │
              │       │ Correlation    │        │
              │       │ Engine         │        │
              │       └───────┬────────┘        │
              │               │                 │
              │       ┌───────┴────────┐        │
              │       ▼                ▼        │
              │  Risk Engine      Graph Engine │
              │       │                │        │
              │       └───────┬────────┘        │
              │               ▼                 │
              │       ┌────────────────┐        │
              │       │ AI Investigation│◄──────┘
              │       │ Layer           │
              │       └───────┬────────┘
              │               ▼
              │       ┌────────────────┐
              └──────►│ Report Engine  │
                      └────────────────┘
```

---

# 2. Architectural Principles

## 2.1 Evidence First

The raw evidence artifact is the source object.

Derived entities, relationships, risk assessments and AI responses must remain separate from the original evidence.

```text
RAW EVIDENCE
     │
     ├── Integrity Metadata
     │
     └── Derived Intelligence
```

---

## 2.2 Deterministic Processing Before AI

The core forensic processing pipeline must not depend on an LLM.

The required order is:

```text
Evidence
   ↓
Parsing
   ↓
Normalization
   ↓
Entity Resolution
   ↓
Correlation
   ↓
Risk Analysis
   ↓
Structured Findings
   ↓
AI
```

AI receives structured information produced by the preceding stages.

The AI layer must not be responsible for creating unsupported forensic relationships.

---

## 2.3 Traceability

Every important derived object should be traceable back to its evidence source.

```text
Finding
   ↓
Risk / Relationship
   ↓
Entity / Event
   ↓
Normalized Record
   ↓
Evidence File
   ↓
SHA-256
```

This allows an investigator to understand why a relationship or finding exists.

---

## 2.4 Modular Processing

Artifact-specific logic should remain isolated from the core correlation engine.

For example:

```text
CDR Parser
IPDR Parser
Bank Parser
UPI Parser
EML Parser
Android Log Parser
```

should all produce a common normalized representation.

The correlation engine should not need to know how a particular source file was parsed.

---

# 3. High-Level System Components

CYBERTRACE consists of the following logical components.

## 3.1 Web Application

Provides the investigator-facing interface.

Responsibilities:

* case management,
* evidence management,
* processing status,
* investigation dashboard,
* graph visualization,
* entity inspection,
* findings,
* timeline,
* AI investigation interface,
* report generation.

---

# 4. Application Layer

The application layer will be implemented using:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui

The frontend communicates with server-side application logic through the Next.js application layer.

The initial MVP should avoid unnecessary frontend/backend separation.

---

# 5. Evidence Layer

The Evidence Layer is responsible for managing uploaded investigation artifacts.

### Responsibilities

* receive uploads,
* validate file types,
* assign evidence IDs,
* preserve original files,
* calculate SHA-256,
* store evidence metadata,
* initiate processing,
* expose processing status.

### Flow

```text
Upload
  ↓
Validate
  ↓
Store Original
  ↓
Calculate SHA-256
  ↓
Create Evidence Record
  ↓
Queue / Start Processing
```

The original artifact must not be modified during processing.

---

# 6. Artifact Processing Layer

The processing layer converts source-specific files into normalized records.

```text
                 Raw Artifact
                      │
                      ▼
              Artifact Detector
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
     CDR/IPDR      Financial       Other
       │             │               │
       ▼             ▼               ▼
    Parser         Parser          Parser
       │             │               │
       └─────────────┼───────────────┘
                     ▼
              Raw Parsed Records
```

---

# 7. Parser Architecture

Each parser should implement a common interface.

Conceptually:

```text
Parser
├── canParse(input)
├── parse(input)
└── getMetadata()
```

Example:

```text
CDRParser
IPDRParser
BankTransactionParser
UPIParser
EMLParser
AndroidLogParser
```

The parser returns structured records rather than directly creating graph relationships.

---

# 8. Normalization Layer

The normalization layer converts source-specific fields into canonical representations.

Example:

```text
CDR:
MSISDN

Bank:
Mobile

UPI:
PhoneNumber
```

may all become:

```text
canonicalPhone
```

Similarly:

```text
IMEI
imei_number
device_imei
```

may map to:

```text
canonicalImei
```

---

# 9. Canonical Record Model

All parsers should ultimately produce a representation containing, where applicable:

```text
sourceEvidenceId
sourceRecordId
timestamp
recordType
entities
attributes
rawReference
```

Example:

```text
{
  sourceEvidenceId: "...",
  sourceRecordId: "CDR-001",
  timestamp: "...",
  recordType: "CALL",
  entities: {
    sourcePhone: "...",
    destinationPhone: "...",
    imei: "..."
  },
  attributes: {
    duration: 42
  }
}
```

The exact TypeScript interface will be defined during implementation.

---

# 10. Entity Layer

The Entity Layer converts normalized records into canonical entities.

Initial entity categories:

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

Each entity should have:

```text
Entity ID
Case ID
Entity Type
Canonical Value
Display Value
Metadata
```

---

# 11. Entity Resolution Architecture

Entity resolution occurs before relationship construction.

```text
Normalized Records
       ↓
Canonicalization
       ↓
Exact Matching
       ↓
Validation
       ↓
Canonical Entity
```

The initial MVP should prioritize deterministic matching.

### Example

```text
+91-98765-43210
919876543210
9876543210
```

become:

```text
PHONE: 9876543210
```

The system must avoid silently merging entities based solely on weak similarity.

---

# 12. Correlation Engine

The Correlation Engine consumes:

* normalized records,
* canonical entities,
* timestamps,
* source metadata.

It generates evidence-backed relationships.

### Flow

```text
Normalized Records
        +
Canonical Entities
        +
Temporal Information
        ↓
Correlation Rules
        ↓
Candidate Relationships
        ↓
Validation
        ↓
Relationship Records
```

---

# 13. Relationship Model

A relationship should contain:

```text
Relationship ID
Case ID
Source Entity
Target Entity
Relationship Type
Confidence
Reason
Supporting Evidence
Created At
```

Example:

```text
PHONE
  │
  │ USES
  │
  ▼
IMEI
```

Relationship metadata:

```text
Confidence: HIGH

Reason:
Exact IMEI match across two CDR records.

Evidence:
CDR-001
CDR-007
```

---

# 14. Temporal Correlation

Where timestamps exist, relationships may be evaluated within a defined time window.

Example:

```text
10:02:13
Account A receives funds

10:02:47
Account B receives funds

10:04:12
Account B transfers funds
```

The system can identify this as a transaction sequence.

Temporal rules must be explicit and configurable rather than hidden inside AI prompts.

---

# 15. Risk Engine

The Risk Engine operates after correlation.

```text
Entities
   +
Relationships
   +
Transactions
   +
Temporal Patterns
        ↓
Risk Rules
        ↓
Risk Factors
        ↓
Risk Score
```

The initial implementation will use an explainable rule-based model.

Example factors:

```text
Multiple incoming sources
Multi-hop transfers
High transaction velocity
Rapid onward transfer
Multiple linked devices
Multiple linked phone numbers
IP overlap
SIM/device switching
```

Each score must retain its contributing factors.

---

# 16. Graph Layer

The graph layer represents the investigation as a network.

### Graph node

```text
Entity
```

### Graph edge

```text
Relationship
```

### Graph metadata

```text
Confidence
Risk
Relationship Type
Evidence References
Timestamp
```

The graph visualization should allow:

* zoom,
* pan,
* node selection,
* relationship inspection,
* entity detail inspection,
* evidence inspection,
* risk highlighting.

---

# 17. Graph Technology

The MVP will use:

**Cytoscape.js**

The graph visualization layer should remain independent of the underlying database.

The graph component should receive a normalized graph representation:

```text
{
  nodes: [...],
  edges: [...]
}
```

This prevents UI code from directly depending on database implementation details.

---

# 18. Database Architecture

The MVP will use:

**PostgreSQL + Prisma**

The database stores structured investigation data.

Conceptual tables/models:

```text
Case
EvidenceFile
NormalizedRecord
Entity
Relationship
Transaction
RiskAssessment
RiskFactor
TimelineEvent
InvestigationFinding
Report
```

The detailed schema belongs in:

`docs/DATA_MODEL.md`

and must be derived from this architecture.

---

# 19. AI Layer

The AI layer is intentionally placed near the end of the pipeline.

```text
Structured Investigation Data
            ↓
      Context Builder
            ↓
       AI Service
            ↓
     Structured Response
            ↓
    Validation / Display
```

The AI should receive relevant structured context rather than indiscriminately receiving entire raw evidence files.

---

# 20. AI Responsibilities

The AI layer may perform:

### Investigation explanation

```text
Why is this entity high risk?
```

### Investigation summarization

```text
Summarize this case.
```

### Relationship explanation

```text
Explain the connection between Account A and Phone B.
```

### Transaction-flow explanation

```text
Explain the path from the victim to the final account.
```

### Report generation

Convert structured findings into readable investigative language.

---

# 21. AI Safety Boundary

The AI layer must not:

* create unsupported relationships,
* modify evidence,
* modify hashes,
* fabricate transactions,
* fabricate entities,
* declare guilt,
* replace the deterministic correlation engine,
* represent speculation as confirmed evidence.

If sufficient structured evidence does not exist, the AI should explicitly indicate that the information is unavailable or uncertain.

---

# 22. Report Layer

The Report Layer consumes structured case intelligence.

```text
Case
+
Entities
+
Relationships
+
Risk
+
Timeline
+
Findings
+
Evidence References
        ↓
Report Builder
        ↓
PDF / JSON
```

The report should not depend on the AI alone.

The factual sections should be generated from structured case data.

AI may improve narrative readability.

---

# 23. Data Flow

Complete system flow:

```text
┌─────────────────────┐
│ Investigator Upload │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Evidence Validation │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ SHA-256 Calculation │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Artifact Parser     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Normalization       │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Entity Extraction   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Entity Resolution   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Correlation Engine  │
└──────────┬──────────┘
           ↓
      ┌────┴────┐
      ↓         ↓
┌──────────┐ ┌──────────┐
│Risk      │ │Graph     │
│Engine    │ │Engine    │
└────┬─────┘ └────┬─────┘
     └──────┬─────┘
            ↓
┌─────────────────────┐
│ Structured Findings │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ AI Investigation    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Investigation Brief │
└─────────────────────┘
```

---

# 24. Application Architecture

The initial repository should use a modular monolithic architecture.

```text
CYBERTRACE
│
├── Presentation Layer
│   ├── Dashboard
│   ├── Cases
│   ├── Evidence
│   ├── Graph
│   ├── Investigation
│   └── Reports
│
├── Application Layer
│   ├── Case Services
│   ├── Evidence Services
│   ├── Investigation Services
│   └── Report Services
│
├── Intelligence Layer
│   ├── Parsers
│   ├── Normalizers
│   ├── Entity Resolver
│   ├── Correlation Engine
│   ├── Risk Engine
│   └── AI Layer
│
├── Persistence Layer
│   ├── Prisma
│   └── PostgreSQL
│
└── Evidence Storage
```

The project should not use microservices for the hackathon MVP.

---

# 25. Repository Architecture

Expected high-level structure:

```text
cybertrace/
│
├── app/
│   ├── dashboard/
│   ├── cases/
│   ├── evidence/
│   ├── investigation/
│   ├── graph/
│   ├── reports/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── evidence/
│   ├── graph/
│   ├── investigation/
│   └── reports/
│
├── lib/
│   ├── db/
│   ├── evidence/
│   ├── ingestion/
│   ├── normalization/
│   ├── entities/
│   ├── correlation/
│   ├── risk/
│   ├── graph/
│   ├── ai/
│   └── reports/
│
├── processing/
│   ├── parsers/
│   ├── normalizers/
│   └── validators/
│
├── prisma/
│   └── schema.prisma
│
├── mock-data/
│
├── tests/
│
├── docs/
│
├── public/
│
├── AGENTS.md
├── README.md
├── package.json
├── tsconfig.json
└── .env.example
```

This structure is a proposed implementation architecture and is not specified by the Void Hacks organizers.

---

# 26. Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

## Graph

* Cytoscape.js

## Backend/Application

* Next.js server-side capabilities
* TypeScript

## Database

* PostgreSQL
* Prisma

## Processing

* TypeScript-based parsers initially
* Python may be introduced only when a specific parser/processing requirement justifies it

## AI

* External LLM API through an isolated AI service abstraction

The exact provider should remain configurable through environment variables.

## Reports

* Server-side PDF generation
* JSON serialization

---

# 27. Environment Configuration

Secrets must never be hardcoded.

Example:

```text
DATABASE_URL=

AI_API_KEY=

AI_MODEL=

EVIDENCE_STORAGE_PATH=

NEXT_PUBLIC_APP_URL=
```

`.env.example` may contain variable names and safe placeholder values.

Actual secrets must remain in `.env.local` or the deployment environment.

---

# 28. Error Handling

Every processing stage should report explicit status.

Example:

```text
UPLOADED
   ↓
HASHED
   ↓
PARSING
   ↓
PARSED
   ↓
NORMALIZING
   ↓
NORMALIZED
   ↓
CORRELATING
   ↓
COMPLETED
```

Failures should be represented explicitly.

Example:

```text
PARSING_FAILED
NORMALIZATION_FAILED
CORRELATION_FAILED
```

A parser failure for one artifact should not unnecessarily destroy the entire case.

---

# 29. Processing Isolation

Uploaded evidence is untrusted input.

The system must:

* validate file type,
* validate file size,
* avoid executing uploaded files,
* parse files as data,
* sanitize values,
* prevent path traversal,
* avoid arbitrary command execution.

APK files, if supported, should be treated as metadata sources only in the MVP.

No uploaded APK should be executed by CYBERTRACE.

---

# 30. Performance Strategy

The MVP should optimize for:

* small-to-medium investigation datasets,
* fast parsing,
* normalized intermediate data,
* avoiding repeated parsing,
* indexed entity lookups,
* indexed timestamps,
* efficient graph retrieval.

The competition evaluates processing speed on bulk log data, so the architecture should not repeatedly parse the same evidence during every investigation query.

---

# 31. Scalability Strategy

The initial implementation is a modular monolith.

Future scaling can separate:

```text
Parser Service
Correlation Service
Risk Service
AI Service
Report Service
```

if processing volume requires it.

This is deliberately excluded from the MVP to keep the two-developer implementation manageable.

---

# 32. Offline / Low-Resource Strategy

The architecture should minimize mandatory external dependencies.

Potential offline-capable components:

* evidence storage,
* SHA-256,
* parsing,
* normalization,
* entity resolution,
* correlation,
* rule-based risk scoring,
* graph generation.

AI functionality may require an external model initially.

The AI interface should therefore be abstracted so that a local model can be introduced later.

This supports the problem statement's requirement for practicality in standard police workstation environments and consideration of offline/low-resource operation.

---

# 33. Security Boundaries

The architecture separates:

### Evidence

Original files.

### Derived Data

Parsed records, entities and relationships.

### Intelligence

Risk scores and findings.

### AI Output

Generated explanations and summaries.

These should not be treated as equivalent data classes.

---

# 34. Architecture Decision Summary

| Decision                 | Choice                          |
| ------------------------ | ------------------------------- |
| Application architecture | Modular monolith                |
| Frontend                 | Next.js + React                 |
| Language                 | TypeScript                      |
| Styling                  | Tailwind CSS                    |
| UI components            | shadcn/ui                       |
| Database                 | PostgreSQL                      |
| ORM                      | Prisma                          |
| Graph                    | Cytoscape.js                    |
| Processing               | Modular parser pipeline         |
| Entity resolution        | Deterministic-first             |
| Correlation              | Rule-based / evidence-backed    |
| Risk                     | Explainable rule-based MVP      |
| AI                       | Isolated AI service             |
| Reports                  | PDF + JSON                      |
| Deployment               | Lightweight web application     |
| Raw evidence             | Immutable-by-application-design |
| Integrity                | SHA-256                         |

---

# 35. Architecture Constraints

The implementation must respect these constraints:

1. Do not introduce microservices unnecessarily.
2. Do not make AI responsible for forensic correlation.
3. Do not modify original evidence.
4. Do not create unsupported relationships.
5. Do not hide risk-score reasoning.
6. Do not hardcode secrets.
7. Do not execute uploaded evidence.
8. Do not tightly couple the UI to database internals.
9. Do not make artifact-specific parsers responsible for graph logic.
10. Do not expand MVP scope without documenting the change.

---

# 36. Architectural Success Criteria

The architecture is considered successful when:

* a new artifact parser can be added without rewriting the correlation engine;
* normalized records can originate from multiple artifact types;
* entities can be resolved across different sources;
* relationships can reference supporting evidence;
* risk scores can reference contributing factors;
* the graph can be generated from structured entities and relationships;
* AI can consume structured investigation data without directly accessing the raw forensic pipeline;
* reports can be generated without depending entirely on AI-generated text;
* the complete workflow can run as a single deployable application.

---

# 37. Relationship to PRD

This document defines **how** the requirements in `docs/PRD.md` should be implemented.

It does not redefine the product requirements.

The following documents will further specify individual architectural areas:

```text
docs/
├── PRD.md
├── ARCHITECTURE.md          ← current document
├── DATA_MODEL.md
├── CORRELATION_ENGINE.md
├── RISK_ENGINE.md
├── AI_LAYER.md
├── EVIDENCE_INTEGRITY.md
├── DEMO_SCENARIO.md
└── DEVELOPMENT_RULES.md
```

Any implementation decision that conflicts with the PRD or this architecture document must be documented before implementation.
