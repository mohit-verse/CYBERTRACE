# CYBERTRACE — Project Structure & Module Map

**Document:** `docs/PROJECT_STRUCTURE.md`
**Version:** 1.0
**Status:** Draft for MVP implementation
**Purpose:** Define the exact repository structure, module boundaries, naming conventions, and initial implementation layout for CYBERTRACE

---

# 1. Purpose

This document defines the physical project structure for the CYBERTRACE MVP.

It translates the architecture specifications into a concrete repository layout that both developers can follow.

The primary goals are:

* predictable file locations;
* clear ownership boundaries;
* minimal merge conflicts;
* separation of UI and business logic;
* separation of deterministic intelligence from AI;
* maintainable server-side processing;
* easy navigation for AI coding assistants;
* consistent naming across the repository.

---

# 2. Repository Root

The repository should have the following high-level structure:

```text id="x7r0ap"
cybertrace/
│
├── app/
├── components/
├── lib/
├── processing/
├── prisma/
├── mock-data/
├── tests/
├── docs/
├── public/
│
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.*
├── .env.example
├── .gitignore
└── ...
```

The exact framework-generated files may vary depending on the Next.js setup.

---

# 3. Architecture Mapping

The repository maps to the architecture as follows:

```text id="0v3yyq"
Presentation
    │
    ├── app/
    └── components/
            │
            ▼
Application / Intelligence
    │
    ├── lib/
    └── processing/
            │
            ▼
Persistence
    │
    └── prisma/
            │
            ▼
Evidence Storage
    │
    └── configured storage location
```

---

# 4. `app/`

The `app/` directory contains Next.js routes and page-level application composition.

Recommended structure:

```text id="1zcr6d"
app/
│
├── page.tsx
├── layout.tsx
├── globals.css
│
├── dashboard/
│   └── page.tsx
│
├── cases/
│   ├── page.tsx
│   └── [caseId]/
│       ├── page.tsx
│       ├── dashboard/
│       │   └── page.tsx
│       ├── evidence/
│       │   └── page.tsx
│       ├── investigation/
│       │   └── page.tsx
│       ├── graph/
│       │   └── page.tsx
│       └── reports/
│           └── page.tsx
│
└── api/
    └── ...
```

The exact route structure may be adjusted during implementation, but the conceptual separation should remain.

---

# 5. Page Responsibility

Page files should primarily handle:

* route-level composition;
* server-side data loading where appropriate;
* page metadata;
* layout;
* connecting application services to UI components.

They should not contain large amounts of:

* parsing logic;
* correlation rules;
* risk calculations;
* database queries;
* AI prompt construction.

---

# 6. Dashboard

Suggested location:

```text id="yr4y54"
app/dashboard/
```

or case-specific:

```text id="w9px7v"
app/cases/[caseId]/dashboard/
```

The dashboard should consume structured dashboard data from the application layer.

It should display:

* evidence count;
* entity count;
* transaction count;
* relationship count;
* high-risk entities;
* findings;
* recent activity;
* investigation overview.

---

# 7. Cases

Suggested location:

```text id="cqj5jv"
app/cases/
```

Responsibilities:

* list cases;
* create cases;
* open a case;
* display case-level navigation.

---

# 8. Evidence Page

Suggested location:

```text id="im6jqo"
app/cases/[caseId]/evidence/
```

Responsibilities:

* evidence list;
* upload interface;
* processing status;
* SHA-256 display;
* integrity status;
* evidence metadata;
* processing errors;
* evidence detail view.

The page must use the Evidence Service rather than implementing hashing or storage directly.

---

# 9. Investigation Workspace

Suggested location:

```text id="3z8dbq"
app/cases/[caseId]/investigation/
```

This is the primary investigator workspace.

It should combine:

* graph;
* selected entity;
* risk;
* findings;
* evidence;
* timeline;
* Ask Investigation.

The workspace should compose existing components rather than implement all logic itself.

---

# 10. Graph Route

Suggested location:

```text id="e17ifg"
app/cases/[caseId]/graph/
```

This route can provide a dedicated graph experience.

The graph itself belongs in:

```text id="4p6n1z"
components/graph/
```

The route should obtain graph data through the Graph Service.

---

# 11. Reports

Suggested location:

```text id="mdqk5d"
app/cases/[caseId]/reports/
```

Responsibilities:

* list generated reports;
* show generation status;
* generate report;
* download PDF;
* download JSON.

Report generation logic belongs in:

```text id="1h2a9f"
lib/reports/
```

---

# 12. `components/`

The `components/` directory contains reusable UI components.

Recommended structure:

```text id="kr6o9y"
components/
│
├── ui/
│
├── layout/
│
├── dashboard/
│
├── cases/
│
├── evidence/
│
├── graph/
│
├── investigation/
│
├── risk/
│
├── findings/
│
├── timeline/
│
└── reports/
```

---

# 13. `components/ui/`

Contains generic reusable interface primitives.

Examples:

```text id="0ty3cm"
button.tsx
card.tsx
dialog.tsx
badge.tsx
input.tsx
select.tsx
table.tsx
tabs.tsx
tooltip.tsx
dropdown-menu.tsx
```

These components should not contain investigation-specific business logic.

---

# 14. Dashboard Components

Suggested:

```text id="v1t83a"
components/dashboard/
├── dashboard-header.tsx
├── kpi-grid.tsx
├── evidence-summary.tsx
├── risk-summary.tsx
├── recent-findings.tsx
└── recent-activity.tsx
```

Components should receive data through props or server-provided state.

---

# 15. Evidence Components

Suggested:

```text id="3f3c89"
components/evidence/
├── evidence-list.tsx
├── evidence-card.tsx
├── evidence-upload.tsx
├── evidence-status.tsx
├── evidence-integrity.tsx
├── evidence-detail.tsx
└── evidence-records.tsx
```

Responsibilities:

* display evidence;
* trigger upload;
* display processing;
* display integrity information.

Hash calculation remains server-side.

---

# 16. Graph Components

Suggested:

```text id="9n1tqg"
components/graph/
├── investigation-graph.tsx
├── graph-controls.tsx
├── graph-node.tsx
├── graph-edge.tsx
├── graph-filters.tsx
└── graph-detail-panel.tsx
```

The graph component should consume a normalized graph data structure.

It must not query Prisma directly.

---

# 17. Investigation Components

Suggested:

```text id="4g9r3n"
components/investigation/
├── investigation-workspace.tsx
├── entity-panel.tsx
├── relationship-panel.tsx
├── evidence-panel.tsx
├── risk-panel.tsx
├── findings-panel.tsx
└── ask-investigation.tsx
```

---

# 18. Risk Components

Suggested:

```text id="s4ceg0"
components/risk/
├── risk-score.tsx
├── risk-badge.tsx
├── risk-factors.tsx
└── risk-explanation.tsx
```

These components display risk data.

They do not calculate risk.

---

# 19. Timeline Components

Suggested:

```text id="0d6n0q"
components/timeline/
├── investigation-timeline.tsx
├── timeline-event.tsx
└── timeline-filters.tsx
```

Timeline ordering and event generation belong to the application layer.

---

# 20. Report Components

Suggested:

```text id="6m0a7u"
components/reports/
├── report-list.tsx
├── report-card.tsx
├── report-status.tsx
├── report-preview.tsx
└── report-generator.tsx
```

---

# 21. `lib/`

The `lib/` directory contains application services and domain logic.

Recommended structure:

```text id="4x7vbn"
lib/
│
├── db/
├── evidence/
├── ingestion/
├── normalization/
├── entities/
├── correlation/
├── risk/
├── graph/
├── ai/
├── reports/
├── cases/
├── findings/
└── timeline/
```

---

# 22. `lib/db/`

Database access utilities.

Suggested:

```text id="nyn9h0"
lib/db/
├── prisma.ts
└── repositories/
```

Possible repositories:

```text id="t7o0i2"
case-repository.ts
evidence-repository.ts
entity-repository.ts
relationship-repository.ts
transaction-repository.ts
risk-repository.ts
finding-repository.ts
timeline-repository.ts
report-repository.ts
```

The repository layer should isolate persistence operations where useful.

---

# 23. `lib/cases/`

Case-specific business operations.

Suggested:

```text id="q3d7d4"
lib/cases/
├── case-service.ts
├── case-types.ts
└── case-validation.ts
```

Responsibilities:

* create case;
* retrieve case;
* update case state;
* calculate dashboard summaries.

---

# 24. `lib/evidence/`

Evidence management.

Suggested:

```text id="flx8g5"
lib/evidence/
├── evidence-service.ts
├── evidence-hasher.ts
├── evidence-storage.ts
├── evidence-validator.ts
├── evidence-integrity.ts
├── evidence-types.ts
└── evidence-errors.ts
```

Responsibilities:

* upload;
* validation;
* SHA-256;
* storage;
* integrity verification;
* metadata management.

---

# 25. Evidence Storage Interface

Use an abstraction such as:

```ts id="z3r0lw"
interface EvidenceStorage {
  save(...): Promise<...>;
  read(...): Promise<...>;
  exists(...): Promise<boolean>;
}
```

This allows local filesystem storage during development and potential object storage later.

---

# 26. `lib/ingestion/`

Coordinates artifact ingestion.

Suggested:

```text id="2n3s8f"
lib/ingestion/
├── ingestion-service.ts
├── ingestion-types.ts
├── ingestion-pipeline.ts
└── ingestion-errors.ts
```

Responsibilities:

```text id="7x4p1z"
Evidence
 ↓
Validate
 ↓
Hash
 ↓
Select Parser
 ↓
Parse
 ↓
Normalize
 ↓
Persist Records
```

---

# 27. `processing/`

The `processing/` directory contains lower-level artifact processing implementations.

Suggested:

```text id="v9c7ik"
processing/
│
├── parsers/
│   ├── csv/
│   ├── xlsx/
│   ├── json/
│   └── eml/
│
├── normalizers/
│   ├── phone.ts
│   ├── upi.ts
│   ├── email.ts
│   ├── ip.ts
│   ├── mac.ts
│   └── timestamp.ts
│
├── validators/
│   ├── cdr-validator.ts
│   ├── ipdr-validator.ts
│   ├── bank-validator.ts
│   ├── upi-validator.ts
│   └── common-validator.ts
│
└── types/
    ├── parsed-record.ts
    ├── artifact.ts
    └── normalized-record.ts
```

---

# 28. Parser Boundary

Parsers should perform parsing.

They should not independently:

* calculate risk;
* create graph nodes;
* call AI;
* determine final correlation;
* generate reports.

Correct:

```text id="g40bne"
Parser
 ↓
Parsed Record
 ↓
Normalization
 ↓
Correlation
```

---

# 29. `lib/normalization/`

The normalization layer provides application-level access to canonicalization functions.

Suggested:

```text id="i5d4u6"
lib/normalization/
├── normalization-service.ts
├── canonicalizers.ts
└── normalization-types.ts
```

The lower-level canonicalization implementations may live under `processing/normalizers/`.

---

# 30. `lib/entities/`

Entity extraction and resolution.

Suggested:

```text id="35e0bk"
lib/entities/
├── entity-service.ts
├── entity-resolver.ts
├── entity-types.ts
├── entity-canonicalization.ts
└── entity-errors.ts
```

Responsibilities:

* create/find entities;
* canonical identifier matching;
* entity metadata;
* entity resolution.

---

# 31. `lib/correlation/`

Deterministic relationship generation.

Suggested:

```text id="h6xq77"
lib/correlation/
├── correlation-service.ts
├── correlation-engine.ts
├── correlation-rules.ts
├── relationship-builder.ts
├── confidence.ts
├── temporal-analysis.ts
├── correlation-types.ts
└── correlation-errors.ts
```

---

# 32. Correlation Rule Organization

Rules should be explicit.

Possible structure:

```text id="q34t9s"
lib/correlation/rules/
├── phone-imei.ts
├── phone-imsi.ts
├── phone-call.ts
├── device-ip.ts
├── device-mac.ts
├── upi-bank.ts
├── transaction-flow.ts
├── shared-identifier.ts
└── recurring-beneficiary.ts
```

Each rule should be independently testable.

---

# 33. `lib/risk/`

Risk Engine implementation.

Suggested:

```text id="f4qg0j"
lib/risk/
├── risk-service.ts
├── risk-engine.ts
├── risk-rules.ts
├── risk-config.ts
├── risk-scoring.ts
├── risk-types.ts
└── risk-errors.ts
```

---

# 34. Risk Configuration

Risk weights and thresholds should be centralized.

Example:

```text id="exi3pz"
lib/risk/risk-config.ts
```

The UI must not contain risk weights.

---

# 35. `lib/graph/`

Graph data preparation.

Suggested:

```text id="t7r5d1"
lib/graph/
├── graph-service.ts
├── graph-builder.ts
├── graph-types.ts
└── graph-filters.ts
```

Responsibilities:

* transform entities into nodes;
* transform relationships into edges;
* attach risk metadata;
* filter graph data.

---

# 36. `lib/ai/`

AI abstraction and investigation assistant.

Suggested:

```text id="5xg3lw"
lib/ai/
├── ai-service.ts
├── ai-provider.ts
├── ai-context-builder.ts
├── ai-prompts.ts
├── ai-types.ts
├── ai-validator.ts
└── providers/
    ├── mock-provider.ts
    └── ...
```

---

# 37. AI Provider Boundary

The application should communicate with the AI through an interface.

Conceptually:

```ts id="n5ihk8"
interface AIProvider {
  answer(context: InvestigationContext): Promise<AIResponse>;
}
```

Provider-specific SDK calls must remain inside provider implementations.

---

# 38. `lib/reports/`

Report generation.

Suggested:

```text id="a9d0f1"
lib/reports/
├── report-service.ts
├── report-builder.ts
├── report-types.ts
├── report-data.ts
├── pdf/
│   ├── pdf-generator.ts
│   └── pdf-template.ts
└── json/
    └── json-generator.ts
```

---

# 39. Report Builder Boundary

The report builder should receive structured report data.

Example:

```text id="8k6h9f"
Case
Entities
Relationships
Transactions
Risk
Findings
Timeline
Evidence
        ↓
Report Builder
        ↓
PDF / JSON
```

It should not independently query unrelated database tables throughout the PDF generation code.

---

# 40. `lib/findings/`

Investigation finding management.

Suggested:

```text id="7i0e7b"
lib/findings/
├── finding-service.ts
├── finding-types.ts
└── finding-builder.ts
```

Findings should be generated from deterministic rules.

---

# 41. `lib/timeline/`

Timeline construction.

Suggested:

```text id="j5j6r9"
lib/timeline/
├── timeline-service.ts
├── timeline-builder.ts
└── timeline-types.ts
```

Timeline events should retain their source evidence references where applicable.

---

# 42. `prisma/`

Database schema and migrations.

```text id="s9j9as"
prisma/
├── schema.prisma
└── migrations/
    └── ...
```

The Prisma schema should reflect `DATA_MODEL.md`.

---

# 43. Prisma Model Naming

Use singular PascalCase model names.

Examples:

```text id="50kq8r"
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

Database table naming may follow Prisma conventions or an explicitly defined mapping.

---

# 44. `mock-data/`

Canonical demo artifacts.

Structure:

```text id="op6fwo"
mock-data/
└── case-001/
    ├── cdr.csv
    ├── ipdr.csv
    ├── bank_transactions.csv
    ├── upi_transactions.csv
    ├── android_logs.json
    └── email_headers.eml
```

These files correspond to `DEMO_SCENARIO.md`.

---

# 45. Demo Seed

The repository should contain a seed mechanism.

Possible location:

```text id="k7thfl"
scripts/
└── seed-demo.ts
```

If a `scripts/` directory is added, it should be documented in the repository structure.

Suggested command:

```bash id="x6o1pk"
npm run seed:demo
```

---

# 46. `tests/`

Recommended structure:

```text id="kjf4y7"
tests/
├── evidence/
├── ingestion/
├── normalization/
├── entities/
├── correlation/
├── risk/
├── graph/
├── ai/
├── reports/
├── integration/
└── e2e/
```

Tests should follow the module they validate.

---

# 47. Test Fixture Organization

Shared fixtures can live under:

```text id="c3o8rj"
tests/fixtures/
```

Example:

```text id="5oxdly"
tests/
└── fixtures/
    ├── evidence/
    ├── transactions/
    ├── entities/
    └── ai/
```

Do not duplicate large fixture files unnecessarily.

---

# 48. `public/`

Contains static assets.

Possible structure:

```text id="xwqypm"
public/
├── icons/
├── images/
└── branding/
```

Evidence artifacts should **not** be stored in `public/`.

---

# 49. `docs/`

The documentation source of truth.

Current specification set:

```text id="x5m3yr"
docs/
├── PRD.md
├── ARCHITECTURE.md
├── DATA_MODEL.md
├── CORRELATION_ENGINE.md
├── RISK_ENGINE.md
├── AI_LAYER.md
├── EVIDENCE_INTEGRITY.md
├── DEMO_SCENARIO.md
├── DEVELOPMENT_RULES.md
├── TESTING_STRATEGY.md
├── API_SPECIFICATION.md
└── PROJECT_STRUCTURE.md
```

---

# 50. `AGENTS.md`

`AGENTS.md` should provide concise repository instructions for AI coding agents.

It should include:

* architecture summary;
* source-of-truth documents;
* forbidden architectural changes;
* module boundaries;
* testing commands;
* coding conventions;
* evidence integrity rules.

It should point developers/agents to the detailed documentation rather than duplicating the entire specification.

---

# 51. README

`README.md` should contain:

```text id="9afzqx"
CYBERTRACE
│
├── Overview
├── Features
├── Architecture
├── Tech Stack
├── Setup
├── Environment Variables
├── Database Setup
├── Demo Data
├── Running Tests
└── Demo Instructions
```

The README should be practical rather than a replacement for the detailed specification.

---

# 52. Naming Conventions

## Files

Use lowercase kebab-case:

```text id="4x7qf1"
risk-engine.ts
evidence-service.ts
graph-builder.ts
```

Avoid:

```text id="9g0lxa"
RiskEngine.ts
risk_engine.ts
riskEngine.ts
```

unless a framework convention requires otherwise.

---

# 53. React Components

Use PascalCase component names:

```text id="6j6skq"
InvestigationGraph
EvidenceUpload
RiskScore
AskInvestigation
```

Files remain kebab-case:

```text id="vq24i1"
investigation-graph.tsx
evidence-upload.tsx
risk-score.tsx
ask-investigation.tsx
```

---

# 54. Type Names

Use PascalCase:

```ts id="r0f0j9"
EvidenceFile
EvidenceRecord
Entity
Relationship
RiskAssessment
```

---

# 55. Function Names

Use camelCase and descriptive names.

Good:

```ts id="7bkm72"
calculateSha256()
resolveEntity()
buildInvestigationGraph()
calculateRiskAssessment()
generateInvestigativeBrief()
```

Avoid ambiguous names:

```ts id="l7m7w0"
process()
handle()
run()
doThing()
```

unless the surrounding context makes the meaning explicit.

---

# 56. Constants

Use descriptive names.

Example:

```ts id="h4a7h7"
MAX_EVIDENCE_FILE_SIZE
RISK_SCORE_MAX
RISK_ENGINE_VERSION
```

---

# 57. Enum Naming

Use uppercase values.

Example:

```text id="83z4vi"
PROCESSING
PROCESSED
FAILED
```

```text id="4n2x7h"
HIGH
MEDIUM
LOW
```

---

# 58. Import Boundaries

Avoid circular dependencies.

Preferred dependency direction:

```text id="4duw9v"
UI
 ↓
Application Services
 ↓
Domain / Processing
 ↓
Persistence
```

Avoid:

```text id="6k7fqi"
Database
 ↓
UI
 ↓
Processing
```

---

# 59. UI-to-Database Rule

React components must not directly import Prisma.

Bad:

```ts id="6f7cym"
import { prisma } from "@/lib/db/prisma";
```

inside a client component.

Preferred:

```text id="zh6g6m"
Component
 ↓
API / Server Action
 ↓
Service
 ↓
Repository
 ↓
Prisma
```

---

# 60. Processing-to-UI Rule

Parsers and correlation engines must not import UI components.

The processing layer must remain independent of the presentation layer.

---

# 61. AI-to-Database Rule

The AI provider must not receive unrestricted database access.

Correct:

```text id="e8xw7q"
Database
 ↓
Context Builder
 ↓
Structured Context
 ↓
AI Provider
```

Incorrect:

```text id="c3o5s1"
AI Provider
 ↓
Direct Database Access
```

---

# 62. Report-to-AI Rule

The report builder may consume AI-generated narrative text.

However:

```text id="q1q88s"
Structured Facts
    ↓
Report Data
```

must remain authoritative for:

* amounts;
* timestamps;
* hashes;
* scores;
* identifiers;
* relationship confidence.

---

# 63. API Route Organization

API routes should mirror domain boundaries.

Possible structure:

```text id="b4q1nf"
app/api/
├── cases/
│   ├── route.ts
│   └── [caseId]/
│       ├── route.ts
│       ├── dashboard/
│       ├── evidence/
│       ├── entities/
│       ├── relationships/
│       ├── transactions/
│       ├── correlation/
│       ├── risk/
│       ├── findings/
│       ├── timeline/
│       ├── graph/
│       ├── investigation/
│       └── reports/
```

The exact route nesting may be simplified where Next.js conventions make another structure cleaner.

---

# 64. Server-Only Modules

Modules containing secrets or privileged operations should be server-only.

Examples:

```text id="l7k0sh"
AI provider
Database access
Evidence storage
File processing
Report generation
```

Use appropriate Next.js server-only boundaries where required.

---

# 65. Shared Types

If request/response types are shared, place them in a neutral location.

Possible:

```text id="3os5b6"
lib/types/
```

Structure:

```text id="v8z7a4"
lib/types/
├── case.ts
├── evidence.ts
├── entity.ts
├── relationship.ts
├── transaction.ts
├── risk.ts
├── graph.ts
├── investigation.ts
└── report.ts
```

Avoid duplicating the same type definition in frontend and backend.

---

# 66. Environment Configuration

The root `.env.example` should document required configuration.

Example:

```text id="e8m1kf"
DATABASE_URL=

AI_PROVIDER=
AI_MODEL=
AI_API_KEY=
AI_BASE_URL=

EVIDENCE_STORAGE_PATH=

MAX_EVIDENCE_FILE_SIZE_MB=
```

Real credentials must never be committed.

---

# 67. Configuration Boundary

Application configuration should be centralized where practical.

Possible:

```text id="y9tqvf"
lib/config/
├── env.ts
└── app-config.ts
```

The environment should be validated during startup.

---

# 68. Error Organization

Shared domain errors can be centralized.

Possible:

```text id="2g9cwm"
lib/errors/
├── application-error.ts
├── validation-error.ts
├── not-found-error.ts
├── authorization-error.ts
└── processing-error.ts
```

This is optional if the implementation remains small, but error behavior should remain consistent.

---

# 69. Logging Organization

Possible:

```text id="x4y5h7"
lib/logging/
└── logger.ts
```

Logs should avoid sensitive evidence contents.

---

# 70. Initial Implementation Order

Once the repository is initialized, implementation should proceed in this order:

```text id="f6j4ut"
1. Project Initialization
        ↓
2. Database Schema
        ↓
3. Evidence Storage
        ↓
4. SHA-256 Integrity
        ↓
5. Parsers
        ↓
6. Normalization
        ↓
7. Entity Resolution
        ↓
8. Correlation
        ↓
9. Risk Engine
        ↓
10. Graph Data
        ↓
11. Dashboard / Evidence UI
        ↓
12. Investigation Graph UI
        ↓
13. AI Layer
        ↓
14. Reports
        ↓
15. End-to-End Integration
```

The order can be adjusted when parallel development makes it beneficial, but downstream features should not be built against imaginary backend behavior.

---

# 71. Parallel Development Strategy

Two developers can work simultaneously.

Example:

```text id="j3jzpw"
Developer A
───────────
Database
Evidence
Processing
Correlation
Risk


Developer B
───────────
UI Shell
Dashboard
Evidence UI
Graph UI
Investigation UI
```

Developer B can use typed mock service responses until Developer A exposes the final service contract.

Once the real service is ready, replace the mock implementation without changing the UI contract.

---

# 72. Mock Service Strategy

During parallel development, services can temporarily use deterministic mock data.

Example:

```text id="o9t6h2"
lib/graph/mock-graph-service.ts
```

However, mock services must:

* follow the same types;
* follow the same response structure;
* be clearly labeled;
* not become the production implementation.

---

# 73. Avoiding Duplicate Logic

Do not implement the same rule in multiple places.

For example, phone normalization must not separately exist in:

```text id="s8k1pb"
CDR parser
UPI parser
UI
Graph
AI
```

Instead:

```text id="xj9q2w"
Shared Normalization Service
        ↓
All Consumers
```

---

# 74. Feature Completion Boundary

A feature should include all necessary layers.

For example, "shared IMEI correlation" is not complete if only the backend rule exists.

A complete feature may require:

```text id="5n6i1q"
Rule
 ↓
Database relationship
 ↓
API exposure
 ↓
Graph representation
 ↓
Finding
 ↓
UI display
 ↓
Test
```

The exact scope depends on the feature.

---

# 75. Do Not Over-Abstract

The repository should remain understandable.

Do not create:

```text id="8n6r0g"
FactoryFactory
ServiceManagerFactory
UniversalProcessor
GenericEntityEngine
```

unless there is a concrete need.

Prefer small, descriptive modules.

---

# 76. Do Not Under-Structure

Avoid putting all business logic into:

```text id="q8g0tj"
app/api/...
```

or one giant:

```text id="6h4e6p"
utils.ts
```

The architecture exists to keep the investigation pipeline understandable.

---

# 77. Initial Files Required

Before feature development begins, the repository should contain at minimum:

```text id="5j89f0"
app/layout.tsx
app/page.tsx

lib/db/prisma.ts

lib/evidence/evidence-service.ts
lib/evidence/evidence-hasher.ts
lib/evidence/evidence-storage.ts

lib/ingestion/ingestion-service.ts

lib/normalization/normalization-service.ts

lib/entities/entity-service.ts
lib/entities/entity-resolver.ts

lib/correlation/correlation-engine.ts

lib/risk/risk-engine.ts

lib/graph/graph-service.ts

lib/ai/ai-service.ts
lib/ai/ai-provider.ts

lib/reports/report-service.ts

prisma/schema.prisma

README.md
AGENTS.md
.env.example
```

Not all files need complete implementations immediately.

The purpose is to establish clear boundaries.

---

# 78. Initial Database Models

The initial Prisma schema should reflect:

```text id="w2lq7v"
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

Optional models should only be introduced when required by the implementation.

---

# 79. Initial UI Components

The first UI component set should include:

```text id="b1iy3j"
AppShell
Sidebar
Topbar

Dashboard
KpiCard
EvidenceSummary
RiskSummary

EvidenceUpload
EvidenceTable
EvidenceStatus

InvestigationGraph
GraphControls
EntityPanel
RiskPanel
FindingsPanel
Timeline

AskInvestigation

ReportGenerator
ReportList
```

The final visual design may change without changing the underlying module boundaries.

---

# 80. Project Structure Acceptance Criteria

The project structure is considered ready when:

* [ ] Repository folders are established.
* [ ] Documentation exists.
* [ ] Prisma location is established.
* [ ] Evidence modules have a defined location.
* [ ] Processing modules have a defined location.
* [ ] Correlation has a dedicated module.
* [ ] Risk has a dedicated module.
* [ ] AI has a dedicated provider boundary.
* [ ] Reports have a dedicated module.
* [ ] Tests mirror core modules.
* [ ] Mock data has a dedicated location.
* [ ] UI components are separated from business logic.
* [ ] API routes follow domain boundaries.
* [ ] Both developers understand file ownership.
* [ ] AI coding agents can identify the correct module before making changes.

---

# 81. Final Structure

The intended final repository should conceptually resemble:

```text id="l6d5dy"
cybertrace/
│
├── app/
│   ├── dashboard/
│   ├── cases/
│   │   └── [caseId]/
│   │       ├── dashboard/
│   │       ├── evidence/
│   │       ├── investigation/
│   │       ├── graph/
│   │       └── reports/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── evidence/
│   ├── graph/
│   ├── investigation/
│   ├── risk/
│   ├── findings/
│   ├── timeline/
│   └── reports/
│
├── lib/
│   ├── db/
│   ├── cases/
│   ├── evidence/
│   ├── ingestion/
│   ├── normalization/
│   ├── entities/
│   ├── correlation/
│   ├── risk/
│   ├── graph/
│   ├── ai/
│   ├── reports/
│   ├── findings/
│   ├── timeline/
│   └── types/
│
├── processing/
│   ├── parsers/
│   ├── normalizers/
│   ├── validators/
│   └── types/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── mock-data/
│   └── case-001/
│
├── tests/
│   ├── evidence/
│   ├── ingestion/
│   ├── normalization/
│   ├── entities/
│   ├── correlation/
│   ├── risk/
│   ├── graph/
│   ├── ai/
│   ├── reports/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── CORRELATION_ENGINE.md
│   ├── RISK_ENGINE.md
│   ├── AI_LAYER.md
│   ├── EVIDENCE_INTEGRITY.md
│   ├── DEMO_SCENARIO.md
│   ├── DEVELOPMENT_RULES.md
│   ├── TESTING_STRATEGY.md
│   ├── API_SPECIFICATION.md
│   └── PROJECT_STRUCTURE.md
│
├── public/
│
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.*
├── .env.example
└── .gitignore
```

This structure is the baseline for implementation.

The exact files may grow as features are implemented, but new files should fit into the established architectural boundaries rather than creating parallel structures.

---

# 82. Final Principle

The repository should make the architecture visible.

A developer opening the project should be able to understand:

```text id="w1m1c0"
Where evidence is handled
        ↓
Where records are normalized
        ↓
Where entities are resolved
        ↓
Where correlations are created
        ↓
Where risk is calculated
        ↓
Where graph data is prepared
        ↓
Where AI is invoked
        ↓
Where reports are generated
```

without searching through unrelated files.

The project structure is therefore part of CYBERTRACE's engineering design, not merely an organizational preference.
