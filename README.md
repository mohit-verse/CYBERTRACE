# CYBERTRACE

## AI-Powered Cyber Fraud Investigation & Digital Artifact Correlation Platform

> **From fragmented evidence to an actionable fraud network.**

**Core Principle:** Evidence first. Intelligence second.

---

## 1. Overview

CYBERTRACE is an AI-assisted cyber-fraud investigation platform designed to help investigators process fragmented digital evidence during the critical early stage of an investigation.

It ingests structured and semi-structured artifacts such as:

* Call Detail Records (CDR)
* Internet Protocol Detail Records (IPDR)
* Bank transaction records
* UPI transaction records
* Email headers
* Android system/application logs

The platform then:

```text
Evidence
   ↓
SHA-256 Integrity
   ↓
Validation
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
Investigation Graph
   ↓
AI-Assisted Explanation
   ↓
Investigative Brief
```

The goal is to transform fragmented evidence into traceable, evidence-backed investigative intelligence.

---

# 2. Core Design Principle

CYBERTRACE separates deterministic forensic processing from AI assistance.

### Deterministic Layer

Responsible for:

* evidence hashing;
* parsing;
* normalization;
* entity resolution;
* relationship correlation;
* transaction analysis;
* risk scoring;
* timeline construction;
* structured findings.

### AI Layer

Responsible for:

* explanation;
* summarization;
* investigation questions;
* narrative assistance;
* report explanation.

AI does **not** determine forensic relationships or modify structured investigation data.

---

# 3. Key Features

### Evidence Vault

Upload and manage investigation artifacts with:

* SHA-256 hashing;
* processing status;
* integrity status;
* artifact metadata;
* record-level traceability.

### Multi-Source Ingestion

Process:

```text
CSV
XLSX
JSON
TXT
EML
```

for supported cyber-fraud artifact types.

### Entity Correlation

Identify evidence-backed relationships between:

* phone numbers;
* IMEI;
* IMSI;
* devices;
* IP addresses;
* MAC addresses;
* UPI IDs;
* bank accounts;
* transactions;
* email identifiers.

### Investigation Graph

Visualize relationships and transaction flows as an interactive graph.

### Explainable Risk

Calculate deterministic risk scores from defined investigation patterns.

Risk range:

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

### Ask Investigation

Ask structured questions such as:

> Why is this account high risk?

The AI answers using structured investigation context and supporting evidence.

### Investigative Brief

Generate:

* PDF;
* JSON.

Reports contain case information, entities, relationships, transaction flows, risk factors, findings, timeline, evidence references, and investigation leads.

---

# 4. Technology Stack

## Frontend / Application

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
```

## Investigation Visualization

```text
Cytoscape.js
```

## Backend / Persistence

```text
Next.js server-side logic
PostgreSQL
Prisma
```

## Processing

```text
TypeScript
```

Python should only be introduced where a specific implementation requirement justifies it.

---

# 5. Architecture

CYBERTRACE is implemented as a modular monolith.

```text
┌───────────────────────────────┐
│        Next.js / React        │
│       UI + Application        │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│      Application Services     │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│      Intelligence Layer       │
│                               │
│ Ingestion                     │
│ Normalization                 │
│ Entity Resolution             │
│ Correlation                   │
│ Risk                          │
│ Graph                         │
│ AI                            │
│ Reports                       │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       Prisma / PostgreSQL     │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│       Evidence Storage        │
└───────────────────────────────┘
```

The MVP does not require microservices or a dedicated graph database.

---

# 6. Repository Structure

```text
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
│
├── public/
│
├── AGENTS.md
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.example
└── .gitignore
```

---

# 7. Documentation

Detailed specifications are maintained under `docs/`.

Current documentation:

```text
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
├── PROJECT_STRUCTURE.md
├── REPORT_SPECIFICATION.md
├── INGESTION_SPECIFICATION.md
└── SECURITY_SPECIFICATION.md
```

For implementation decisions, these documents and `AGENTS.md` are the source of truth.

---

# 8. Prerequisites

Before running CYBERTRACE locally, install:

* Node.js;
* npm;
* PostgreSQL;
* Git.

Verify:

```bash
node --version
npm --version
git --version
psql --version
```

Use versions compatible with the project's installed Next.js, Prisma, and TypeScript dependencies.

---

# 9. Installation

Clone the repository:

```bash
git clone <repository-url>
cd cybertrace
```

Install dependencies:

```bash
npm install
```

---

# 10. Environment Configuration

Create the local environment file from the example:

```bash
cp .env.example .env
```

Configure the required values.

Example:

```env
DATABASE_URL=

AI_PROVIDER=
AI_MODEL=
AI_API_KEY=
AI_BASE_URL=

EVIDENCE_STORAGE_PATH=

MAX_EVIDENCE_FILE_SIZE_MB=
```

Never commit `.env`.

---

# 11. Database Setup

CYBERTRACE requires PostgreSQL.

### Step 1: Create the database

```bash
psql -U postgres -c "CREATE DATABASE cybertrace;"
```

### Step 2: Configure DATABASE_URL

In your `.env` file:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/cybertrace"
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Apply database schema

```bash
npx prisma db push
```

### Step 5: Verify database connectivity

```bash
npx ts-node scripts/preflight.ts
```

### Canonical Demo Setup

To prepare the canonical CASE-2026-001 demo from a clean state:

```bash
npx ts-node scripts/reset-demo.ts
```

To run the full end-to-end validation (requires the dev server running):

```bash
npm run dev          # In terminal 1
npx ts-node scripts/run-e2e.ts  # In terminal 2
```

Do not modify the production database manually.

---

# 12. Development Server

Start the development server:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

---

# 13. Production Build

Build the application:

```bash
npm run build
```

Start the production build:

```bash
npm run start
```

The exact scripts should remain aligned with `package.json`.

---

# 14. Linting and Type Checking

Run linting:

```bash
npm run lint
```

Run TypeScript validation using the project's configured command.

Before considering a feature complete, ensure there are no newly introduced type or lint errors.

---

# 15. Testing

The test suite follows the module structure.

```text
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

Core testing areas include:

* evidence integrity;
* parser behavior;
* normalization;
* entity resolution;
* correlation;
* risk;
* graph generation;
* AI grounding;
* report generation;
* security;
* end-to-end investigation flow.

Use the project's configured test command.

---

# 16. Canonical Demo Dataset

The canonical demo evidence is stored under:

```text
mock-data/case-001/
```

Expected files:

```text
cdr.csv
ipdr.csv
bank_transactions.csv
upi_transactions.csv
android_logs.json
email_headers.eml
```

These files correspond to the investigation defined in:

```text
docs/DEMO_SCENARIO.md
```

---

# 17. Canonical Demo Case

```text
Case ID:
CASE-2026-001

Title:
UPI Fraud — Multi-Hop Mule Network
```

The primary transaction flow is:

```text
Victim
   │
   │ ₹25,000
   ▼
Mule Account A
   │
   │ ₹24,000
   ▼
Mule Account B
   │
   │ ₹23,500
   ▼
Cash-out Account
```

Additional evidence may establish relationships involving:

* phone numbers;
* shared IMEI;
* IP address;
* MAC address;
* communication activity.

The system must derive these results from the actual mock evidence.

---

# 18. Running the Demo

The intended demo sequence is:

```text
1. Open CYBERTRACE
        ↓
2. Create/open CASE-2026-001
        ↓
3. Upload evidence
        ↓
4. Show SHA-256
        ↓
5. Process evidence
        ↓
6. Review discovered entities
        ↓
7. Open investigation graph
        ↓
8. Review transaction flow
        ↓
9. Review risk assessment
        ↓
10. Ask Investigation
        ↓
11. Generate investigative brief
```

The demo must use the real application pipeline.

Do not hard-code the final investigation results.

---

# 19. Evidence Integrity

Every uploaded artifact must be treated as untrusted evidence.

The system must:

1. validate the artifact;
2. calculate SHA-256 from original bytes;
3. store the original artifact;
4. parse a derived representation;
5. preserve record-level traceability.

The original evidence must remain unchanged.

---

# 20. Correlation

Relationships are created by deterministic correlation rules.

Examples include:

```text
Phone → IMEI
Phone → IMSI
Phone → Phone
Device → IP
Device → MAC
UPI → Bank Account
Bank Account → Bank Account
```

Only relationships supported by the evidence and correlation rules should be created.

---

# 21. Risk

Risk is calculated by the deterministic Risk Engine.

Example factors include:

* multi-hop transaction routing;
* rapid onward transfer;
* transaction velocity;
* multiple incoming sources;
* shared device identifiers;
* rapid SIM/device switching;
* shared IP;
* shared MAC;
* recurring beneficiary patterns.

Risk is explainable and evidence-backed.

It is not a legal determination.

---

# 22. AI Investigation Assistant

The AI layer operates after deterministic processing.

Example query:

```text
Why is this account high risk?
```

The AI should explain existing structured findings using:

* risk score;
* risk factors;
* relationships;
* transactions;
* timeline;
* evidence references.

It must not invent evidence.

---

# 23. Reports

CYBERTRACE produces:

```text
PDF
JSON
```

Reports contain:

* case summary;
* evidence summary;
* SHA-256 values;
* relevant entities;
* relationships;
* transaction flow;
* risk assessments;
* findings;
* timeline;
* investigation leads;
* evidence references;
* limitations.

PDF and JSON should represent the same structured investigation state.

---

# 24. Security

Important security requirements:

* uploaded evidence is untrusted;
* uploaded files are never executed;
* evidence storage is not public;
* filenames cannot control storage paths;
* case isolation is enforced;
* database access is server-side;
* secrets remain server-side;
* AI receives controlled context;
* evidence-based prompt injection is treated as untrusted data;
* sensitive evidence is not unnecessarily logged.

See:

```text
docs/SECURITY_SPECIFICATION.md
```

for the complete security model.

---

# 25. Development Model

CYBERTRACE is being developed as a shared repository by two builders.

### Developer A — Core / Intelligence

Primary responsibility:

```text
Database
Evidence
Ingestion
Processing
Normalization
Entity Resolution
Correlation
Risk
```

### Developer B — Product / Interface

Primary responsibility:

```text
Application Routes
UI
Dashboard
Investigation Workspace
Graph
AI Interface
Reports Interface
```

Ownership does not prevent either developer from making necessary cross-module changes, but shared files must be coordinated.

---

# 26. Git Workflow

Use feature branches for implementation.

Example:

```text
main
├── feature/evidence-ingestion
├── feature/correlation
├── feature/risk-engine
├── feature/dashboard
├── feature/investigation-graph
└── feature/ai-assistant
```

Keep commits focused.

Examples:

```text
feat: add evidence hashing
feat: add CDR parser
feat: implement transaction correlation
feat: add investigation graph
fix: preserve evidence hash during reprocessing
test: add risk engine tests
```

---

# 27. AI Coding Agents

Antigravity and other coding agents must follow:

```text
AGENTS.md
```

before modifying the repository.

Implementation prompts should identify:

* objective;
* relevant specification;
* files to modify;
* constraints;
* expected behavior;
* tests;
* definition of done.

Agents must not silently change architecture.

---

# 28. Important Engineering Rules

### Do

* read existing code before editing;
* follow documented architecture;
* preserve evidence;
* keep correlation deterministic;
* keep risk calculation centralized;
* keep AI downstream;
* use strong TypeScript;
* test changes;
* preserve API contracts;
* coordinate shared files.

### Do not

* fabricate investigation results;
* hard-code risk scores;
* hard-code graph relationships;
* let AI create forensic relationships;
* execute uploaded files;
* expose secrets;
* bypass authorization;
* modify original evidence;
* silently change the database architecture;
* claim tests passed without running them.

---

# 29. Project Status

CYBERTRACE is being built as a hackathon MVP.

The priority order is:

```text
1. Evidence Integrity
2. Evidence Ingestion
3. Entity Extraction / Resolution
4. Transaction Correlation
5. Investigation Graph
6. Risk Engine
7. Investigation UI
8. AI Explanation
9. Investigative Report
10. Polish
```

The MVP should prioritize a reliable end-to-end investigation flow over unnecessary feature breadth.

---

# 30. MVP Scope

The MVP focuses on:

```text
Case Management
Evidence Upload
SHA-256 Integrity
CSV/XLSX/JSON/TXT/EML Processing
Normalization
Entity Resolution
Deterministic Correlation
Transaction Flow
Risk Scoring
Investigation Graph
AI Investigation Assistant
PDF / JSON Report
```

---

# 31. Explicitly Out of Scope

Unless explicitly added later, do not implement:

* live telecom integrations;
* live banking integrations;
* live police-system integrations;
* blockchain investigation;
* facial recognition;
* voice recognition;
* custom LLM training;
* mobile application;
* nationwide crime database;
* multi-tenant SaaS architecture;
* automated legal conclusions.

---

# 32. Architecture Change Policy

Do not introduce a major architectural change simply to solve a local implementation problem.

Examples requiring explicit approval:

```text
Adding a microservice
Replacing PostgreSQL
Replacing Prisma
Adding a graph database
Changing the AI architecture
Changing evidence storage architecture
Changing the authentication architecture
```

Prefer the simplest solution compatible with the specifications.

---

# 33. Definition of Done

A feature is complete when:

```text
Specification understood
        ↓
Implementation complete
        ↓
Correct module boundary
        ↓
Validation implemented
        ↓
Relevant tests pass
        ↓
Type-check / lint / build pass
        ↓
UI/API integration verified
        ↓
Documentation updated where required
```

Do not mark work complete merely because the code compiles.

---

# 34. Final Principle

CYBERTRACE is not simply a dashboard over uploaded files.

It is an evidence-processing pipeline:

```text
Raw Evidence
      ↓
Integrity
      ↓
Structured Data
      ↓
Entity Correlation
      ↓
Risk
      ↓
Investigation
      ↓
Explanation
      ↓
Actionable Brief
```

Every layer must preserve traceability to the evidence beneath it.

**Evidence first. Intelligence second.**
