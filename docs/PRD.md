# CYBERTRACE

## AI-Powered Cyber Fraud Investigation & Digital Artifact Correlation Platform

**Document:** Product Requirements Document
**Version:** 1.0
**Status:** Draft for Development
**Project Type:** Hackathon MVP / Proof of Concept
**Hackathon:** Void Hacks 8.0

---

# 1. Product Overview

CYBERTRACE is an AI-assisted digital forensic investigation platform designed to help investigators analyze fragmented cyber-fraud evidence from multiple sources and rapidly identify meaningful relationships between people, devices, communication records, digital identifiers, and financial transactions.

The platform follows an evidence-first architecture:

**Evidence → Integrity Verification → Parsing → Normalization → Entity Resolution → Correlation → Risk Analysis → Investigation Graph → AI-Assisted Intelligence → Investigative Brief**

The system is intended to demonstrate a lightweight, practical workflow suitable for cyber-fraud investigation and rapid evidence triage.

---

# 2. Problem Statement

Cyber-fraud investigations can involve multiple disconnected digital artifacts, including:

* Call Detail Records (CDRs)
* IP Detail Records (IPDRs)
* Bank transaction records
* UPI transaction records
* Email headers
* Android system/application logs
* Device identifiers and related metadata

Manually examining these artifacts and identifying relationships between them can be time-consuming.

The Void Hacks problem statement calls for an automated triage and correlation engine capable of ingesting fragmented investigation artifacts, identifying common entities, generating a transaction/communication graph, assigning risk based on anomaly patterns, and producing a structured investigative summary.

### Source Requirement

The competition specifically identifies:

* Multi-source ingestion and normalization
* Entity correlation
* Mule-account/network graph visualization
* Triage and risk scoring
* Investigative brief generation
* Evidence integrity through SHA-256 hashing

as core requirements.

---

# 3. Product Vision

### Vision

Transform fragmented cyber-fraud evidence into a unified, explainable investigation view.

### Product Principle

> **Evidence first. Intelligence second.**

CYBERTRACE must not treat an AI-generated statement as forensic evidence by itself.

Deterministic processing and evidence-backed correlation form the foundation. AI operates on structured investigation results to assist with explanation, summarization and investigator interaction.

---

# 4. Objectives

## 4.1 Primary Objectives

CYBERTRACE shall:

1. Allow investigators to create and manage investigation cases.
2. Allow multiple digital evidence artifacts to be uploaded to a case.
3. Calculate and preserve SHA-256 hashes for uploaded evidence.
4. Parse supported artifact formats.
5. Normalize heterogeneous records into a common representation.
6. Extract relevant digital entities.
7. Resolve equivalent representations of the same entity.
8. Identify relationships between entities.
9. Construct a unified investigation graph.
10. Identify suspicious transaction and communication patterns.
11. Generate explainable risk scores.
12. Provide an investigator-oriented dashboard.
13. Provide an AI-assisted investigation interface.
14. Generate an investigative brief in PDF and JSON formats.

## 4.2 Hackathon Objectives

The MVP must demonstrate the core workflow requested by Void Hacks:

**Input ingestion → automated entity linking → graph generation → intelligence summary**

The competition specifically requires a working parser or prototype demonstrating entity linking using mock telecom and financial records.

---

# 5. Target User

## Primary User

### Cyber-Fraud Investigator / Investigating Officer

The primary user needs to:

* ingest evidence from different sources,
* rapidly identify relationships,
* understand money and communication flows,
* identify suspicious entities,
* review supporting evidence,
* generate a concise investigation summary.

## User Characteristics

The application should assume that the primary user is an investigator rather than a software developer.

Therefore:

* terminology should be understandable,
* workflows should be simple,
* important findings should be visually prominent,
* evidence supporting a finding should be accessible,
* unnecessary technical complexity should remain hidden from the primary UI.

---

# 6. Core User Workflow

```text
CREATE CASE
     ↓
UPLOAD EVIDENCE
     ↓
VERIFY EVIDENCE INTEGRITY
     ↓
PARSE ARTIFACTS
     ↓
NORMALIZE RECORDS
     ↓
EXTRACT ENTITIES
     ↓
RESOLVE ENTITIES
     ↓
CORRELATE RELATIONSHIPS
     ↓
BUILD INVESTIGATION GRAPH
     ↓
ANALYZE RISK / ANOMALIES
     ↓
REVIEW FINDINGS
     ↓
ASK INVESTIGATION QUESTIONS
     ↓
GENERATE INVESTIGATIVE BRIEF
```

---

# 7. Functional Requirements

## FR-01 — Case Management

The system shall allow users to:

* create a case,
* provide a case identifier,
* provide a case title,
* provide a case description,
* view existing cases,
* open a case,
* view case-level statistics.

### Example

```text
Case ID: CYF-2026-001
Title: UPI Fraud Investigation
Status: Active
Created: 21 Sep 2026
```

---

# 8. Evidence Management

## FR-02 — Evidence Upload

The system shall allow users to upload investigation artifacts associated with a case.

### Initial supported categories

* CDR
* IPDR
* Bank transaction data
* UPI transaction data
* Email headers
* Android/system/application logs

### Initial supported formats

* CSV
* XLSX
* JSON
* TXT
* EML

The competition explicitly specifies CSV/Excel telecom records, bank/UPI settlement sheets, EML email headers and TXT/JSON Android system/application logs as input examples.

---

# 9. Evidence Integrity

## FR-03 — SHA-256 Verification

For every uploaded evidence file, the system shall:

1. Preserve the original file.
2. Calculate a SHA-256 hash.
3. Store the hash with the evidence metadata.
4. Associate the evidence with its case.
5. Make the hash visible to the investigator.
6. Allow later integrity verification.

### Evidence metadata

At minimum:

```text
Evidence ID
Case ID
Original Filename
File Type
File Size
SHA-256 Hash
Upload Timestamp
Processing Status
```

### Principle

The processing pipeline must not modify the original evidence artifact.

## The competition specifically requires handling evidentiary integrity through hash verification and evaluates forensic accuracy/integrity including SHA-256 preservation.

# 10. Artifact Parsing

## FR-04 — Parser System

The system shall identify an uploaded artifact's type and pass it to an appropriate parser.

The parser shall convert raw records into an internal normalized representation.

### Initial parser categories

```text
CSV/XLSX
 ├── CDR parser
 ├── IPDR parser
 ├── Bank transaction parser
 └── UPI transaction parser

JSON/TXT
 └── Android/system log parser

EML
 └── Email header parser
```

The architecture should allow additional parsers to be added without rewriting the correlation engine.

---

# 11. Data Normalization

## FR-05 — Canonical Representation

Different source formats may represent the same entity differently.

The system shall normalize supported fields into canonical representations before correlation.

### Example

```text
+91-98765-43210
919876543210
9876543210
```

shall resolve to a canonical phone representation:

```text
9876543210
```

Normalization shall be applied where appropriate to:

* phone numbers,
* UPI identifiers,
* email addresses,
* IP addresses,
* IMEI values,
* IMSI values,
* MAC addresses,
* timestamps,
* transaction identifiers,
* account identifiers.

Normalization rules must be deterministic and testable.

---

# 12. Entity Extraction

## FR-06 — Entity Identification

The system shall identify relevant entities from normalized records.

### Initial entity types

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

The implementation may extend this list when required by supported evidence formats.

---

# 13. Entity Resolution

## FR-07 — Entity Resolution

The system shall determine when multiple records refer to the same canonical entity.

### Example

```text
Record 1:
Phone = +91-98765-43210

Record 2:
MSISDN = 919876543210

Record 3:
Mobile = 9876543210
```

These should resolve to the same canonical phone entity.

Entity resolution shall prioritize deterministic matching.

The system should avoid creating relationships solely from weak or ambiguous similarities.

---

# 14. Correlation Engine

## FR-08 — Evidence-Based Relationship Detection

The correlation engine shall identify relationships between entities based on structured evidence.

### Initial relationship types

```text
PHONE ──USES──> IMEI
PHONE ──HAS──> IMSI
PHONE ──USES──> UPI
UPI ──LINKED_TO──> BANK_ACCOUNT
BANK_ACCOUNT ──TRANSFERRED_TO──> BANK_ACCOUNT
TRANSACTION ──FROM──> BANK_ACCOUNT
TRANSACTION ──TO──> BANK_ACCOUNT
DEVICE ──CONNECTED_FROM──> IP
DEVICE ──HAS──> MAC
PHONE ──CALLED──> PHONE
```

Additional relationship types may be introduced when required by the evidence model.

The competition specifically expects identification and linking of relationships such as shared IMEI/IMSI, recurring beneficiary UPI handles, common IP subnets and shared device MAC addresses.

---

# 15. Relationship Confidence

## FR-09 — Confidence and Explanation

Each automatically generated relationship should contain:

```text
Relationship Type
Confidence
Reason
Supporting Evidence
```

Example:

```text
Relationship:
PHONE → IMEI

Confidence:
HIGH

Reason:
Exact IMEI match across two CDR records.

Supporting Evidence:
CDR_001.csv
CDR_002.csv
```

The confidence value is intended to communicate the strength of the system's correlation, not to represent legal certainty.

---

# 16. Investigation Graph

## FR-10 — Graph Visualization

The system shall provide an interactive graph representing entities and their relationships.

### Nodes

Examples:

* Phone
* IMEI
* IMSI
* UPI
* Bank Account
* Transaction
* IP
* Device
* Email

### Edges

Examples:

* Uses
* Linked to
* Transferred to
* Called
* Connected from
* Associated with

### Graph interactions

Users should be able to:

* zoom,
* pan,
* select a node,
* inspect node details,
* inspect relationships,
* identify high-risk entities,
* view supporting evidence,
* trace a transaction path.

---

# 17. Transaction / Communication Flow

## FR-11 — Network Flow

The system shall represent directional flows where the underlying evidence supports them.

Example:

```text
Victim
  ↓
Mule Account A
  ↓
Mule Account B
  ↓
Cash-out Account
```

The competition explicitly calls for a directional transaction and communication flow graph mapping movement from victim/intermediary nodes toward ultimate cash-out points.

---

# 18. Risk Analysis

## FR-12 — Explainable Risk Scoring

The system shall calculate a risk score for selected entities based on defined anomaly indicators.

The score must be explainable.

### Initial indicators

Potential indicators include:

* multi-hop fund routing,
* high transaction velocity,
* multiple incoming sources,
* rapid onward transfers,
* multiple linked phone numbers,
* multiple linked devices,
* suspicious IP overlap,
* rapid SIM/device changes where supported by evidence,
* suspicious email/header indicators where supported.

The competition provides multi-hop routing, high-velocity SIM switching and spoofed-header signatures as examples of relevant anomaly patterns.

### Risk output

```text
Risk Score: 87 / 100

Contributing Factors:
+25 Multi-hop routing
+20 Multiple incoming sources
+15 High transaction velocity
+15 Rapid onward transfer
+12 Multiple linked devices
```

The initial MVP will use a transparent rule-based scoring model rather than claiming that an opaque AI model has determined criminality.

---

# 19. Timeline

## FR-13 — Investigation Timeline

The system shall construct a chronological timeline from timestamped evidence.

Example:

```text
10:02:13
Victim transaction

10:02:47
Mule account receives funds

10:04:12
Funds transferred onward

10:08:31
Final transaction / cash-out event
```

Timeline entries should retain links to their source evidence where available.

---

# 20. Intelligence Findings

## FR-14 — Automated Findings

The system shall surface notable patterns discovered during analysis.

Examples:

```text
Same IMEI associated with multiple phone numbers.

Account X received funds from multiple unrelated accounts.

Funds moved through multiple accounts within a short period.

An IP address is associated with multiple relevant devices.

A UPI identifier appears repeatedly as a beneficiary.
```

Each finding should include:

* finding type,
* severity,
* explanation,
* affected entities,
* supporting evidence.

---

# 21. AI Investigation Layer

## FR-15 — AI-Assisted Investigation

The AI layer shall operate on structured investigation data produced by the deterministic pipeline.

### Allowed AI functions

The AI may:

* summarize findings,
* explain risk factors,
* summarize transaction flows,
* summarize timelines,
* answer natural-language questions about structured case data,
* generate investigative briefs,
* convert structured findings into readable language.

### AI restrictions

The AI must not:

* fabricate evidence,
* invent relationships,
* alter evidence records,
* independently declare a person guilty,
* replace deterministic entity resolution,
* replace evidence integrity verification,
* present unsupported claims as established facts.

### Example query

> Why is Account X high risk?

The AI should answer using the actual risk factors and supporting evidence stored in the case.

---

# 22. Investigative Brief

## FR-16 — Report Generation

The system shall generate a concise investigative brief containing, where available:

```text
Case Information
Incident Summary
Key Entities
Transaction Flow
Communication Links
High-Risk Entities
Important Findings
Timeline
Supporting Evidence
Risk Factors
Immediate Investigation Leads
Evidence Integrity Information
```

### Export formats

* PDF
* JSON

The competition explicitly requests a standardized one-page timeline report in PDF/JSON summarizing prime suspects, linked phone/account clusters and immediate seizure recommendations.

For the MVP, recommendations shall be presented as **investigative leads derived from detected evidence**, not unsupported conclusions.

---

# 23. Dashboard Requirements

The primary case dashboard should display:

### Case statistics

```text
Evidence Files
Entities
Relationships
Transactions
High-Risk Entities
Amount Traced
```

### Main sections

1. Investigation overview
2. Fraud/network graph
3. High-risk entities
4. Detected findings
5. Timeline
6. Evidence status

The dashboard should prioritize information useful to a field investigator.

---

# 24. Evidence-to-Finding Traceability

Every significant automated finding should be traceable to its source.

Conceptually:

```text
Finding
   ↓
Relationship / Event
   ↓
Entity
   ↓
Evidence Record
   ↓
Original Evidence File
   ↓
SHA-256
```

This is a core design principle of CYBERTRACE.

---

# 25. Non-Functional Requirements

## NFR-01 — Usability

The system should be understandable to a non-technical investigator.

## NFR-02 — Performance

The MVP should process the supplied mock investigation dataset quickly enough for live demonstration.

The competition evaluates processing speed on bulk log data, so parsing and correlation should avoid unnecessary repeated processing.

## NFR-03 — Accuracy

The system should prefer fewer high-confidence relationships over a large number of weak relationships.

## NFR-04 — Explainability

Risk scores and relationships should have understandable reasons.

## NFR-05 — Integrity

Original evidence should remain unchanged after ingestion.

## NFR-06 — Modularity

Parsers, normalization rules, correlation rules and AI services should be independently extendable.

## NFR-07 — Low Resource Operation

The architecture should avoid unnecessary infrastructure and remain practical for a standard workstation.

The competition explicitly evaluates practicality in standard police workstation environments, including offline or low-resource operation.

---

# 26. MVP Scope

The hackathon MVP will prioritize:

### Required

* Case creation
* Evidence upload
* SHA-256 hashing
* CSV/XLSX ingestion
* JSON/TXT ingestion
* Basic EML parsing
* Data normalization
* Entity extraction
* Entity resolution
* Deterministic correlation
* Relationship confidence
* Fraud graph
* Rule-based risk scoring
* Timeline
* AI-assisted investigation
* Investigative brief
* PDF/JSON export
* Mock fraud investigation dataset

---

# 27. Explicitly Out of Scope for MVP

The following are not required for the hackathon MVP:

* Direct integration with police systems
* Live telecom APIs
* Live banking APIs
* Real-time telecom interception
* Facial recognition
* Voice recognition
* Blockchain
* Custom LLM training
* Large-scale distributed infrastructure
* Mobile application
* Nationwide crime database
* Production-grade multi-tenant SaaS
* Automated legal conclusions
* Automated arrest/seizure decisions

These may be considered future extensions but must not increase MVP complexity.

---

# 28. Security Requirements

The system should:

* validate uploaded files,
* restrict accepted file types,
* avoid executing uploaded files,
* sanitize parsed data,
* protect application secrets,
* avoid exposing API keys to the client,
* validate AI-generated outputs before displaying them as findings,
* maintain case-level data isolation.

Uploaded APKs, logs and other artifacts must be treated as untrusted input.

For the hackathon MVP, APK analysis should focus on metadata rather than executing an APK.

---

# 29. Privacy Considerations

CYBERTRACE is intended to process potentially sensitive investigation data.

The MVP should therefore:

* use fictional/mock data for demonstrations,
* avoid unnecessary external transmission of raw evidence,
* minimize sensitive data exposure in logs,
* avoid storing AI prompts containing unnecessary raw evidence,
* clearly distinguish mock/demo data from real investigative data.

---

# 30. Demonstration Scenario

The primary demonstration will use a fictional UPI cyber-fraud case.

### Scenario

A victim loses money through a fraudulent UPI transaction.

Evidence sources contain:

```text
CDR
IPDR
Bank transactions
UPI transactions
Android/device logs
```

The system should discover a relationship chain similar to:

```text
Victim
   ↓
Mule Account A
   ↓
Mule Account B
   ↓
Cash-out Account
```

Additional evidence will demonstrate:

```text
Phone A
   ↓
IMEI X
   ↑
Phone B
```

and potentially:

```text
Phone A ── IP X
Phone B ── IP X
```

The demo dataset must be internally consistent so that the relationships detected by the system are supported by multiple artifacts.

---

# 31. Demo Success Criteria

A successful demonstration should show:

### 1. Upload

Investigator uploads multiple evidence files.

### 2. Integrity

System calculates and displays SHA-256 hashes.

### 3. Processing

System parses and normalizes the evidence.

### 4. Entity discovery

System identifies phones, IMEIs, accounts, UPI handles, IPs and transactions.

### 5. Correlation

System discovers cross-artifact relationships.

### 6. Graph

System visualizes the fraud network.

### 7. Risk

System identifies high-risk entities and explains the contributing factors.

### 8. AI

Investigator asks a natural-language investigation question.

### 9. Report

System generates the investigative brief.

---

# 32. Technical Principles

The following principles are mandatory for implementation.

### Principle 1 — Evidence First

Raw evidence must remain distinct from derived intelligence.

### Principle 2 — Deterministic Before AI

Parsing, normalization and entity correlation should be deterministic wherever possible.

### Principle 3 — Traceability

Derived findings must be traceable to supporting evidence.

### Principle 4 — Explainability

Risk scores must have identifiable contributing factors.

### Principle 5 — Modular Processing

New artifact types should be addable without rewriting the entire system.

### Principle 6 — Fail Safely

Ambiguous relationships should not automatically become high-confidence relationships.

### Principle 7 — AI as an Assistant

AI assists investigation; it does not replace evidence or investigator judgment.

---

# 33. Success Metrics for the Hackathon MVP

The following are internal development targets, not organizer-provided benchmarks.

### Functional

* All demo artifacts successfully ingest.
* Cross-source entities are resolved correctly.
* Expected fraud relationships appear in the graph.
* Expected risk signals are detected.
* Investigative brief is generated successfully.

### Integrity

* Every uploaded demo artifact receives a SHA-256 hash.
* Original evidence is not modified.

### Traceability

* Every major relationship can identify supporting evidence.
* Every major risk score can identify contributing signals.

### Demonstrability

The complete pipeline should run reliably from:

**Upload → Analysis → Graph → AI → Report**

during the live demo.

---

# 34. Future Scope

Potential future extensions include:

* Additional forensic artifact parsers
* Advanced anomaly detection
* Offline local AI models
* Larger graph datasets
* Geographic visualization
* Advanced temporal analysis
* Cross-case entity correlation
* Additional forensic metadata extraction
* Integration with authorized investigative systems
* More advanced evidence-chain management

These are outside the hackathon MVP.

---

# 35. Product Definition

### CYBERTRACE is:

> An evidence-first, AI-assisted cyber-fraud investigation platform that unifies fragmented digital artifacts, resolves and correlates entities, visualizes fraud networks, identifies explainable risk patterns, and generates investigation-ready intelligence.

### CYBERTRACE is not:

> A generic AI chatbot, a criminal prediction system, or an automated replacement for forensic investigators.

---

# 36. Requirements Traceability to Void Hacks

| Void Hacks Requirement        | CYBERTRACE Component                   |
| ----------------------------- | -------------------------------------- |
| Multi-source ingestion        | Evidence ingestion + parsers           |
| CDR/IPDR processing           | Telecom parsers                        |
| Bank/UPI processing           | Financial parsers                      |
| EML processing                | Email parser                           |
| Android TXT/JSON processing   | Log parsers                            |
| Entity correlation            | Entity resolution + correlation engine |
| IMEI/IMSI relationships       | Device/telecom entity model            |
| UPI beneficiary relationships | Financial correlation                  |
| IP/MAC relationships          | Device/network correlation             |
| Fraud network graph           | Investigation graph                    |
| Risk scoring                  | Explainable risk engine                |
| Investigative brief           | AI + report generator                  |
| SHA-256 integrity             | Evidence integrity layer               |
| Working PoC                   | End-to-end mock investigation          |

The mapping above is derived from the competition's stated challenge and deliverables.

---

# 37. Current Development Status

**Status:** Requirements definition

### Completed

* Problem understanding
* Product concept
* Core workflow
* MVP scope
* AI role definition
* Initial entity model
* Initial correlation model
* Risk approach
* Evidence-integrity approach
* Demonstration scenario

### Next documentation

1. `ARCHITECTURE.md`
2. `DATA_MODEL.md`
3. `CORRELATION_ENGINE.md`
4. `RISK_ENGINE.md`
5. `AI_LAYER.md`
6. `EVIDENCE_INTEGRITY.md`
7. `DEMO_SCENARIO.md`
8. `DEVELOPMENT_RULES.md`

### Implementation has not started yet.

This PRD is the source of truth for subsequent technical documentation and implementation decisions.
