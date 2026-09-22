# CYBERTRACE — Development Rules & Team Engineering Guide

**Document:** `docs/DEVELOPMENT_RULES.md`
**Version:** 1.0
**Status:** Draft for MVP implementation
**Purpose:** Shared engineering rules for the CYBERTRACE development team

---

# 1. Purpose

This document defines the engineering rules that every contributor must follow while building CYBERTRACE.

The project is being developed by multiple contributors in a single GitHub repository.

The primary objectives are:

* maintain architectural consistency;
* prevent conflicting implementations;
* protect the evidence-processing pipeline;
* reduce merge conflicts;
* keep the MVP stable;
* make AI-assisted development predictable;
* ensure that every contributor understands the boundaries of their work.

These rules apply regardless of whether code is written manually or generated with an AI development tool such as Antigravity.

---

# 2. Core Engineering Principle

> **Do not optimize for the amount of code written. Optimize for a stable, demonstrable investigation pipeline.**

The MVP must prioritize:

```text
Correctness
    ↓
Traceability
    ↓
Reliability
    ↓
Usability
    ↓
Visual polish
```

A visually impressive interface that produces unsupported forensic relationships is unacceptable.

---

# 3. Source-of-Truth Documents

The following documents define the intended system behavior:

```text
docs/
  PRD.md
  ARCHITECTURE.md
  DATA_MODEL.md
  CORRELATION_ENGINE.md
  RISK_ENGINE.md
  AI_LAYER.md
  EVIDENCE_INTEGRITY.md
  DEMO_SCENARIO.md
  DEVELOPMENT_RULES.md
```

Before implementing a feature, the developer must check the relevant specification.

Priority order:

```text
Problem Statement
      ↓
PRD
      ↓
Architecture
      ↓
Data Model
      ↓
Feature-specific Specification
      ↓
Implementation
```

If implementation conflicts with a specification, do not silently change the specification.

Discuss the conflict before changing the architecture or data model.

---

# 4. Problem Statement Alignment

The official Void Hacks problem statement remains the source for competition requirements.

CYBERTRACE must demonstrate the required concepts:

* multi-source artifact ingestion;
* entity correlation;
* fraud-network analysis;
* anomaly/risk triage;
* investigative summary;
* SHA-256 evidence preservation.

The implementation should not add complexity that does not improve the demonstrated solution.

---

# 5. MVP Scope Rule

Before adding a feature, ask:

> Does this materially improve the required investigation workflow or demonstration?

If not, defer it.

The MVP should not expand into:

* live police integrations;
* live banking APIs;
* telecom APIs;
* blockchain analysis;
* facial recognition;
* voice recognition;
* custom LLM training;
* mobile application;
* nationwide crime database;
* unnecessary microservices.

These remain outside the current MVP scope.

---

# 6. Architecture Rule

CYBERTRACE uses a modular monolith.

The preferred architecture is:

```text id="v4v8n8"
Next.js UI
    │
    ▼
Application Services
    │
    ├── Evidence
    ├── Ingestion
    ├── Entities
    ├── Correlation
    ├── Risk
    ├── AI
    └── Reports
    │
    ▼
Prisma
    │
    ▼
PostgreSQL
```

Do not introduce microservices unless the team explicitly decides that the MVP requires them.

---

# 7. Repository Structure

The repository should follow the architecture specification.

Recommended structure:

```text id="ubzw2k"
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
│   ├── validators/
│   └── types/
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

Contributors should not create random top-level folders.

---

# 8. Module Ownership

The team should divide work by system boundaries rather than arbitrary screens.

Recommended ownership:

## Developer A — Core / Architecture

Responsible primarily for:

```text
lib/db/
lib/evidence/
lib/ingestion/
lib/normalization/
lib/entities/
lib/correlation/
lib/risk/
processing/
prisma/
```

Primary responsibility:

* data model;
* evidence pipeline;
* parsers;
* normalization;
* entity resolution;
* correlation;
* risk calculations.

---

## Developer B — Product / Interface

Responsible primarily for:

```text
app/
components/
lib/graph/
lib/ai/
lib/reports/
```

Primary responsibility:

* dashboard;
* evidence interface;
* graph interface;
* investigation workspace;
* Ask Investigation;
* report interface;
* UI/UX.

---

# 9. Shared Files

The following files are high-conflict files.

Changes require coordination:

```text
package.json
package-lock.json
prisma/schema.prisma
tsconfig.json
next.config.*
.env.example
README.md
AGENTS.md
```

Do not modify these files casually.

If a dependency is required, communicate it before adding it.

---

# 10. Database Change Rule

The database schema is shared infrastructure.

Never independently rewrite `prisma/schema.prisma` while another developer is simultaneously changing it.

Before modifying the schema:

1. Check the current branch/repository state.
2. Review existing models.
3. Determine whether the required field/model already exists.
4. Make the smallest required change.
5. Run Prisma validation.
6. Test the affected functionality.

Avoid unrelated schema changes in the same commit.

---

# 11. Migration Rule

Database migrations must be deliberate.

Never:

```text id="10l9m5"
delete database
recreate database
```

merely because a schema change is inconvenient.

For development, migrations should remain reproducible.

Every schema change must be represented by the appropriate migration mechanism.

---

# 12. Data Model Protection

The following concepts must remain structurally distinct:

```text
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

Do not collapse these into a generic "data" table simply to reduce development effort.

These distinctions are important for traceability.

---

# 13. Evidence Protection Rule

Original evidence is immutable.

No contributor may implement functionality that modifies the original uploaded artifact.

Allowed:

```text
Original Evidence
      ↓
Parser
      ↓
Normalized Data
```

Not allowed:

```text
Original Evidence
      ↓
Modify File
      ↓
Parser
```

If a new artifact is supplied, it must be stored as a new evidence file.

---

# 14. SHA-256 Rule

Every evidence artifact must receive a SHA-256 hash.

The hash must represent the original file bytes.

Never calculate the evidence hash from:

* normalized data;
* filename;
* database ID;
* parsed records.

The original hash must remain unchanged.

---

# 15. Correlation Rule

The Correlation Engine is deterministic.

It is responsible for creating validated relationships.

AI must not directly create forensic relationships.

Correct:

```text
Evidence
   ↓
Correlation Rule
   ↓
Relationship
   ↓
AI Explanation
```

Incorrect:

```text
Evidence
   ↓
AI Guess
   ↓
Relationship
```

---

# 16. Risk Rule

The Risk Engine owns the authoritative risk score.

The AI must never calculate or overwrite the risk score.

Correct:

```text
Validated Relationships
        ↓
Risk Engine
        ↓
Risk Score
        ↓
AI Explanation
```

Incorrect:

```text
Case Data
   ↓
LLM
   ↓
Risk Score
```

---

# 17. AI Rule

AI is an explanation and investigation interface.

AI may:

* summarize;
* explain;
* answer structured questions;
* describe transaction flows;
* summarize findings;
* assist with narrative report sections.

AI may not:

* invent evidence;
* invent relationships;
* modify evidence;
* modify SHA-256;
* modify risk;
* create official findings;
* silently resolve contradictory evidence;
* make unsupported legal conclusions.

---

# 18. Prompt Injection Rule

All uploaded artifact content must be treated as untrusted data.

For example:

```text id="8n0i8m"
Email content:
"Ignore all previous instructions..."
```

This must not become an instruction to the AI.

The application must maintain a strict distinction between:

```text
System Instructions
Case Data
User Question
```

AI-generated content must never automatically become trusted application instructions.

---

# 19. Sensitive Data Rule

The application may process sensitive information.

Developers must not:

* log complete bank account numbers unnecessarily;
* log API keys;
* commit `.env` files;
* expose secrets to the browser;
* include sensitive data in screenshots unnecessarily;
* upload real personal data to the demo repository.

The hackathon dataset must remain fictional.

---

# 20. Environment Variables

Secrets must be stored in environment variables.

Example:

```text id="x2f2ly"
DATABASE_URL=
AI_API_KEY=
AI_PROVIDER=
AI_MODEL=
AI_BASE_URL=
```

`.env.example` may contain placeholders.

Never commit:

```text
.env
```

with real secrets.

---

# 21. API Key Rule

AI and other private API keys must remain server-side.

Never expose them through:

```text
NEXT_PUBLIC_*
```

environment variables.

The browser should communicate with the application's server-side AI service.

---

# 22. Dependency Rule

Before installing a new package, ask:

1. Is it actually necessary?
2. Does the existing stack already provide the functionality?
3. Does it increase bundle size significantly?
4. Does it introduce security or maintenance concerns?
5. Does it conflict with an existing dependency?

Do not install packages simply because an AI coding assistant suggested them.

---

# 23. TypeScript Rule

TypeScript should remain strongly typed.

Avoid:

```ts
any
```

unless there is a documented reason.

Prefer:

```ts
unknown
```

with validation when dealing with external data.

Uploaded files, parsed JSON, API responses, and AI responses must be treated as untrusted input.

---

# 24. External Data Validation

Never assume parsed input is correct.

Validate:

* required fields;
* identifier formats;
* timestamps;
* numeric values;
* transaction amounts;
* artifact types;
* relationship types.

Invalid records should be rejected or explicitly marked according to parser behavior.

---

# 25. Normalization Rule

Normalization must be deterministic.

For example:

```text id="g42jbd"
+91-98765-43210
919876543210
9876543210
```

may normalize to:

```text
9876543210
```

The normalization logic should be centralized.

Do not implement different phone normalization logic independently in:

* CDR parser;
* transaction parser;
* UI;
* AI layer.

---

# 26. Entity Resolution Rule

Exact identifiers have priority.

Do not merge entities solely because:

* names are similar;
* amounts are similar;
* timestamps are close;
* locations are similar;
* IP subnets are shared;
* surnames match.

Weak similarity must not become a forensic relationship.

---

# 27. Relationship Evidence Rule

Every meaningful relationship must retain provenance.

At minimum, the relationship should be able to identify:

```text
Rule
Source Evidence Record
Reason
Confidence
```

If a relationship cannot be explained, it should not be treated as a validated correlation.

---

# 28. Confidence Rule

Confidence and risk must remain separate.

Example:

```text
Relationship Confidence: HIGH
Risk Contribution: LOW
```

is valid.

Do not use a high-confidence relationship as an automatic high-risk classification.

---

# 29. Missing Data Rule

Missing data is not negative evidence.

Example:

```text
No IMEI
```

does not mean:

```text
Suspicious IMEI behavior
```

It means:

```text
IMEI factor cannot be evaluated.
```

---

# 30. Contradictory Data Rule

Do not silently overwrite conflicting observations.

Example:

```text
Source A → Phone A uses IMEI X
Source B → Phone A uses IMEI Y
```

Both observations must remain traceable.

The system may create a contradiction finding if the relevant rule exists.

---

# 31. UI Rule

The UI must reflect actual backend state.

Do not create UI elements that imply functionality that does not exist.

For example, do not display:

```text
"Evidence Verified"
```

unless the application has actually performed the verification.

Likewise:

```text
"AI Found Fraud Network"
```

should not be used as a system fact.

Prefer:

```text
"Correlated Network"
```

when relationships were generated by deterministic rules.

---

# 32. Loading State Rule

Every expensive operation should have an explicit state.

Examples:

```text
UPLOADING
HASHING
PROCESSING
CORRELATING
CALCULATING
GENERATING
```

Do not leave users staring at an unresponsive interface.

---

# 33. Error State Rule

Errors must be understandable.

Bad:

```text
Error 500
```

Better:

```text
Evidence processing failed.

The CDR file could not be parsed because the required
timestamp column was not found.
```

The technical error can remain available to developers through logs.

---

# 34. Graph Rule

The graph is a visualization of structured data.

It must not maintain an independent source of truth.

Correct:

```text
Database
   ↓
Graph Data Builder
   ↓
Graph UI
```

Incorrect:

```text
Graph UI
   ↓
Creates relationship
   ↓
Database
```

unless the action explicitly represents an investigator-authorized operation supported by the application.

---

# 35. Graph Performance

Do not render every available record as an individual graph node.

The graph should focus on:

* entities;
* meaningful relationships;
* transactions where useful.

Large raw datasets should be filtered or aggregated before rendering.

---

# 36. Dashboard Rule

Dashboard statistics must come from actual case data.

Examples:

```text
Total Evidence
High-Risk Entities
Transactions
Relationships
Findings
```

Do not hard-code dashboard numbers for visual appearance.

---

# 37. Report Rule

Reports must use structured application data.

The report generator should obtain:

* case information;
* entity data;
* transaction data;
* risk assessments;
* findings;
* evidence hashes;

directly from the application.

AI may assist with narrative sections but must not become the authoritative source for structured facts.

---

# 38. Mock Data Rule

All demo data belongs under:

```text
mock-data/
```

Mock data must be:

* fictional;
* deterministic;
* reproducible;
* small enough for local development.

Do not mix demo data with application source code.

---

# 39. Demo Scenario Rule

The demo scenario defined in `DEMO_SCENARIO.md` is the canonical MVP demonstration.

Do not independently create another fraud scenario unless there is a clear reason.

If a developer needs additional test data, place it under a separate test dataset.

---

# 40. Testing Rule

Every core module should have tests.

Priority:

```text
Evidence
Normalization
Entity Resolution
Correlation
Risk
Reports
AI Context
```

UI testing should cover the primary investigator workflow.

---

# 41. Minimum Test Cases

At minimum, the repository should test:

### Evidence

* SHA-256 generation;
* hash verification;
* invalid files.

### Parsing

* valid CSV;
* malformed CSV;
* valid JSON;
* required-field validation.

### Normalization

* phone numbers;
* UPI identifiers;
* email addresses;
* IP addresses;
* MAC addresses.

### Correlation

* exact identifier match;
* shared IMEI;
* transaction flow;
* duplicate relationships;
* false-link prevention.

### Risk

* factor calculation;
* score boundaries;
* score cap;
* deterministic output.

### AI

* grounded response;
* missing information;
* contradiction handling;
* prompt injection resistance.

---

# 42. Git Branch Rule

Do not develop directly on the main branch unless the team explicitly decides otherwise.

Preferred workflow:

```text
main
 │
 ├── feature/evidence-ingestion
 │
 ├── feature/correlation-engine
 │
 ├── feature/investigation-ui
 │
 └── feature/ai-assistant
```

Each branch should represent a coherent feature or module.

---

# 43. Commit Rule

Commits should be small and meaningful.

Good:

```text
feat: add SHA-256 evidence hashing
feat: add transaction parser
feat: add shared IMEI correlation rule
fix: prevent duplicate relationship creation
ui: add investigation graph panel
```

Avoid:

```text
update
changes
final
final2
working
stuff
```

---

# 44. Pull Request Rule

Before merging, verify:

* feature works;
* tests pass;
* TypeScript builds;
* no secrets are committed;
* unrelated files were not modified;
* database changes are understood;
* documentation is updated when necessary.

---

# 45. Merge Conflict Rule

If a merge conflict affects architecture-critical files:

```text
prisma/schema.prisma
lib/correlation/*
lib/risk/*
lib/evidence/*
package.json
```

do not blindly accept one side.

Understand both changes and reconcile them.

---

# 46. Antigravity Development Rule

Both developers may use Antigravity to generate or modify code.

However, prompts must specify:

1. exact feature;
2. allowed files;
3. relevant specification;
4. constraints;
5. expected behavior;
6. tests required.

Example:

```text
Implement the shared IMEI correlation rule.

Read:
- docs/CORRELATION_ENGINE.md
- docs/DATA_MODEL.md

Modify only:
- lib/correlation/*
- tests/correlation/*

Do not modify:
- Prisma schema
- UI
- Risk Engine
- AI layer

Add tests for:
- valid shared IMEI
- duplicate records
- missing IMEI
- conflicting IMEI
```

This reduces unintended repository-wide modifications.

---

# 47. Antigravity Prompt Rule

Do not give vague instructions such as:

```text
Build the whole fraud system.
```

Prefer:

```text
Implement the CDR parser according to docs/CORRELATION_ENGINE.md.
Do not change the database schema.
Return normalized call records.
Add unit tests.
```

The smaller the implementation boundary, the easier the code is to review.

---

# 48. AI Coding Assistant Rule

AI-generated code must be reviewed before merging.

The contributor must understand:

* what the code does;
* what data it reads;
* what data it writes;
* what assumptions it makes;
* what errors it handles;
* whether it follows the specification.

Never merge code solely because it compiles.

---

# 49. No Silent Architecture Changes

AI coding assistants may suggest:

```text
MongoDB
Redis
Kafka
Python microservice
Neo4j
Elasticsearch
```

Do not introduce them automatically.

CYBERTRACE's MVP architecture is intentionally lightweight.

Any architecture change must be explicitly discussed.

---

# 50. Database Access Rule

UI components should not contain scattered raw database logic.

Prefer:

```text
UI
 ↓
Application Service
 ↓
Repository / Prisma
 ↓
Database
```

This keeps business logic reusable and testable.

---

# 51. Business Logic Rule

Important investigation logic must not live only inside UI components.

Examples:

* risk scoring;
* relationship creation;
* entity normalization;
* transaction path calculation;
* evidence hashing.

These belong in server-side/application modules.

---

# 52. Client vs Server Rule

Sensitive operations should remain server-side.

Server-side:

* database access;
* evidence storage;
* SHA-256 processing;
* AI API calls;
* report generation;
* risk calculation.

Client-side:

* visualization;
* interaction;
* filtering;
* navigation;
* presentation.

---

# 53. API Design Rule

APIs should return structured responses.

Example:

```json id="8u48go"
{
  "success": true,
  "data": {}
}
```

Errors should use structured responses.

Example:

```json id="52n3fm"
{
  "success": false,
  "error": {
    "code": "EVIDENCE_PROCESSING_FAILED",
    "message": "The evidence file could not be processed."
  }
}
```

Avoid exposing raw internal stack traces to users.

---

# 54. Logging Rule

Logs should help developers diagnose failures without leaking sensitive information.

Preferred:

```text
Evidence processing failed
caseId=CASE-2026-001
evidenceId=EVID-001
parser=bank-csv
errorCode=MISSING_COLUMN
```

Avoid dumping entire evidence files into logs.

---

# 55. Performance Rule

Optimize only after identifying an actual bottleneck.

For MVP:

* use indexed PostgreSQL queries;
* avoid unnecessary repeated database calls;
* process evidence asynchronously where useful;
* avoid loading huge files into memory;
* avoid rendering huge graph datasets at once.

Do not introduce infrastructure solely for hypothetical scale.

---

# 56. Security Rule

All uploaded evidence is untrusted.

The application must defend against:

* path traversal;
* oversized files;
* malformed files;
* malicious content;
* injection attacks;
* unauthorized case access;
* secret exposure.

Security is required even for fictional demo data because the application is intended to represent a forensic investigation platform.

---

# 57. Documentation Rule

When implementation behavior changes materially, update the relevant document.

Examples:

```text
Risk scoring changed
      ↓
Update RISK_ENGINE.md

Database model changed
      ↓
Update DATA_MODEL.md

AI behavior changed
      ↓
Update AI_LAYER.md
```

Do not let documentation and implementation silently diverge.

---

# 58. Definition of Done

A feature is not complete merely because it renders.

A feature is complete when:

* [ ] specification is understood;
* [ ] implementation exists;
* [ ] expected behavior works;
* [ ] error states are handled;
* [ ] relevant tests exist;
* [ ] TypeScript passes;
* [ ] build passes;
* [ ] security implications are considered;
* [ ] documentation is updated where necessary;
* [ ] feature works with the demo case where applicable.

---

# 59. Pre-Demo Freeze

Before the final hackathon demonstration, the repository should enter a stabilization phase.

During the freeze:

Avoid:

* new architecture;
* major dependency changes;
* database redesign;
* unnecessary UI rewrites;
* new experimental features.

Prioritize:

* bug fixes;
* demo reliability;
* performance;
* error handling;
* visual consistency;
* report generation;
* end-to-end testing.

---

# 60. Final End-to-End Test

Before the final demo, the team must successfully execute:

```text id="by2l0m"
Create Case
   ↓
Upload Evidence
   ↓
Calculate SHA-256
   ↓
Process Evidence
   ↓
Normalize Records
   ↓
Resolve Entities
   ↓
Create Relationships
   ↓
Calculate Risk
   ↓
Render Graph
   ↓
Ask Investigation
   ↓
Generate Report
```

The complete flow must work using the canonical demo dataset.

---

# 61. Final Repository Checklist

Before submission:

* [ ] Application builds successfully.
* [ ] Database migrations work.
* [ ] Demo data can be seeded.
* [ ] Evidence upload works.
* [ ] SHA-256 hashes are generated.
* [ ] Evidence status is visible.
* [ ] Parsers work for required demo artifacts.
* [ ] Entities are correctly resolved.
* [ ] Correlations are evidence-backed.
* [ ] Risk scores are deterministic.
* [ ] Graph renders correctly.
* [ ] Ask Investigation works.
* [ ] AI does not invent relationships.
* [ ] Investigative brief generates successfully.
* [ ] Evidence hashes appear in the report.
* [ ] No real sensitive data is present.
* [ ] No secrets are committed.
* [ ] README contains setup instructions.
* [ ] Repository can be cloned and started by another developer.

---

# 62. Engineering Priority

When forced to choose between two implementation tasks, use this priority:

```text
1. Evidence Integrity
2. Correct Data Processing
3. Correct Correlation
4. Correct Risk Calculation
5. End-to-End Reliability
6. Investigator Usability
7. AI Experience
8. Visual Polish
9. Additional Features
```

A stable core pipeline is more important than a larger feature list.

---

# 63. Final Team Principle

Every contributor should remember:

> **CYBERTRACE is an investigation system, not a collection of AI-generated screens.**

The system succeeds when a user can take fragmented digital artifacts and trace the path:

```text id="x9j3vf"
Evidence
   ↓
Integrity
   ↓
Structured Data
   ↓
Entity
   ↓
Relationship
   ↓
Risk
   ↓
Investigation
   ↓
Actionable Brief
```

Every engineering decision should protect that chain.
