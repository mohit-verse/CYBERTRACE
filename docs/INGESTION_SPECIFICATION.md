# CYBERTRACE — Ingestion Specification

**Document:** `docs/INGESTION_SPECIFICATION.md`
**Version:** 1.0
**Status:** MVP Specification
**Purpose:** Define how CYBERTRACE accepts, validates, hashes, parses, normalizes, traces, and persists digital-fraud evidence artifacts before entity correlation and risk analysis.

---

# 1. Purpose

The ingestion layer is the first processing stage of CYBERTRACE.

Its responsibility is to transform uploaded evidence artifacts into structured, traceable records while preserving the original evidence unchanged.

The ingestion pipeline must support fragmented cyber-fraud evidence from multiple sources, including:

* telecom records;
* financial transaction records;
* UPI records;
* email headers;
* Android system/application logs.

The ingestion layer must not determine criminal responsibility or independently create unsupported investigative conclusions.

Its primary responsibility is:

> **Convert raw evidence into reliable, traceable, normalized records for downstream investigation.**

---

# 2. Ingestion Principle

The ingestion pipeline follows:

```text
Raw Evidence
     ↓
Upload Validation
     ↓
SHA-256 Hash
     ↓
Evidence Storage
     ↓
Artifact Classification
     ↓
Parser Selection
     ↓
Parsing
     ↓
Record Validation
     ↓
Normalization
     ↓
Evidence Record Persistence
     ↓
Entity Extraction / Correlation
```

The original artifact remains immutable throughout this process.

---

# 3. Supported Artifact Types

The MVP supports the following artifact categories.

| Artifact Type    | Typical Source                                         | Supported Formats      |
| ---------------- | ------------------------------------------------------ | ---------------------- |
| CDR              | Telecom call-detail records                            | CSV, XLSX              |
| IPDR             | Internet protocol detail records                       | CSV, XLSX              |
| BANK_TRANSACTION | Bank transaction records                               | CSV, XLSX              |
| UPI_TRANSACTION  | UPI transaction/settlement records                     | CSV, XLSX              |
| EMAIL            | Email headers                                          | EML                    |
| ANDROID_LOG      | Android system/application logs                        | TXT, JSON              |
| OTHER            | Unsupported/extension artifacts retained for reference | Validated formats only |

The exact fields supported by each parser are defined later in this document.

---

# 4. Supported File Formats

The MVP supports:

```text
.csv
.xlsx
.json
.txt
.eml
```

Unsupported file types should be rejected unless an explicit parser has been implemented for them.

Examples:

```text
.pdf
.docx
.exe
.apk
.zip
.rar
```

must not automatically enter the processing pipeline merely because they can be uploaded.

---

# 5. APK Handling

CYBERTRACE does not execute uploaded APK files.

If APK metadata processing is introduced, the APK must be treated as an untrusted artifact.

The MVP should only process explicitly supported metadata representations.

The system must never:

* install an uploaded APK;
* execute APK code;
* execute embedded scripts;
* launch uploaded binaries.

---

# 6. Evidence Upload Flow

An evidence upload should follow:

```text
Client Upload
     ↓
Request Validation
     ↓
File Type / Size Validation
     ↓
Generate Evidence ID
     ↓
Calculate SHA-256
     ↓
Store Original Artifact
     ↓
Create EvidenceFile Record
     ↓
Set Processing Status
     ↓
Queue / Trigger Processing
```

The evidence should be associated with a specific case.

---

# 7. Case Association

Every evidence artifact must belong to exactly one case within the MVP data model.

Example:

```text
CASE-2026-001
    │
    ├── EV-001 cdr.csv
    ├── EV-002 ipdr.csv
    ├── EV-003 bank_transactions.csv
    ├── EV-004 upi_transactions.csv
    ├── EV-005 android_logs.json
    └── EV-006 email_headers.eml
```

Evidence must never be accidentally exposed across cases.

---

# 8. File Validation

Before processing, validate:

* filename;
* extension;
* MIME type where available;
* file size;
* file accessibility;
* case association;
* supported artifact type;
* parser availability.

Validation must occur before parsing.

---

# 9. File Size

The maximum evidence file size must be configurable.

Example environment variable:

```text
MAX_EVIDENCE_FILE_SIZE_MB
```

The exact production value should be determined during implementation according to the deployment environment.

The ingestion service must reject files exceeding the configured limit.

---

# 10. Filename Handling

The original filename must be preserved as metadata.

However, the original filename must not be trusted as a filesystem path.

Example:

```text
Original filename:
bank_transactions.csv

Stored filename:
generated-safe-identifier.csv
```

Never construct storage paths directly from user-controlled filenames.

---

# 11. Evidence Hashing

SHA-256 must be calculated from the original uploaded file bytes.

The intended sequence is:

```text
Uploaded Bytes
      ↓
SHA-256
      ↓
Stored Hash
```

Hashing must occur before parsing.

---

# 12. Hash Requirements

Every successfully accepted evidence artifact should have:

```text
Evidence ID
SHA-256
Original Filename
File Size
Artifact Type
```

The SHA-256 value must be represented as a 64-character hexadecimal string.

---

# 13. Hash and Parsing Independence

Hash calculation must not depend on:

* parser output;
* normalized records;
* database serialization;
* JSON formatting;
* CSV interpretation.

The hash represents the original evidence artifact itself.

---

# 14. Duplicate Evidence

Two uploaded files with identical SHA-256 values are byte-identical artifacts.

The system may identify them as duplicates.

However, duplicate detection must not automatically delete the new evidence record.

Each case evidence record should remain traceable.

Example:

```text
EV-001 → SHA-256 ABC...
EV-002 → SHA-256 ABC...
```

The system may display:

```text
Duplicate content detected
```

while retaining both evidence references.

---

# 15. Evidence Storage

Original artifacts must be stored separately from parsed/normalized records.

Conceptually:

```text
Evidence Storage
    │
    └── Original immutable artifact

Database
    │
    ├── EvidenceFile
    ├── EvidenceRecord
    └── normalized structured data
```

The parsed data must never replace the original artifact.

---

# 16. Processing States

Evidence processing should use explicit states.

Supported states:

```text
UPLOADED
HASHED
PROCESSING
PROCESSED
FAILED
```

Typical flow:

```text
UPLOADED
   ↓
HASHED
   ↓
PROCESSING
   ↓
PROCESSED
```

Failure:

```text
PROCESSING
   ↓
FAILED
```

---

# 17. Integrity Status

Processing status and integrity status are separate concepts.

Processing status:

```text
UPLOADED
HASHED
PROCESSING
PROCESSED
FAILED
```

Integrity status:

```text
PENDING
VERIFIED
MISMATCH
ERROR
```

A successfully parsed file is not automatically evidence of verified integrity if a later integrity check detects a mismatch.

---

# 18. Parser Selection

Parser selection should use explicit artifact classification.

Conceptually:

```text
Artifact Type
      +
File Format
      ↓
Parser Registry
      ↓
Parser
```

Example:

```text
BANK_TRANSACTION + CSV
        ↓
Bank CSV Parser
```

The ingestion system should not rely solely on filenames to determine parser behavior.

---

# 19. Parser Interface

All parsers should follow a common contract.

Conceptually:

```ts
interface ArtifactParser {
  canParse(input: ParserInput): boolean;

  parse(input: ParserInput): Promise<ParseResult>;
}
```

The exact TypeScript interface may evolve during implementation, but every parser must provide consistent output semantics.

---

# 20. Parser Input

A parser should receive sufficient information to identify the artifact without receiving unrelated application state.

Conceptually:

```text
Evidence ID
Artifact Type
Original Filename
File Format
File Bytes / Stream
```

The parser should not require direct access to Prisma.

---

# 21. Parser Output

A parser should return structured parsed records.

Conceptually:

```text
ParseResult
├── records[]
├── warnings[]
├── errors[]
└── statistics
```

Each parsed record should preserve its source location.

---

# 22. Record Traceability

Every parsed record must remain traceable to its original evidence artifact.

Minimum linkage:

```text
EvidenceFile ID
EvidenceRecord ID
Source Record ID
Raw Reference
```

Example:

```text
Evidence:
EV-003

Record:
EV-003-ROW-17

Raw Reference:
CSV row 17
```

---

# 23. Raw References

The raw reference identifies where the original information came from.

Examples:

### CSV

```text
CSV row 17
```

### XLSX

```text
Sheet: Transactions
Row: 22
```

### JSON

```text
$.transactions[4]
```

### EML

```text
Header: From
Header: Received
Header: Message-ID
```

### TXT

```text
Line 83
```

The exact reference representation may be standardized during implementation.

---

# 24. Record IDs

Record IDs must be deterministic or otherwise uniquely identifiable within the evidence file.

Example:

```text
EV-003:ROW-17
```

The record ID must not replace the evidence ID.

The relationship is:

```text
EvidenceFile
   │
   └── EvidenceRecord
          │
          └── RawReference
```

---

# 25. CDR Ingestion

CDR represents communication activity.

The MVP parser should support records containing fields relevant to:

```text
Calling Number
Called Number
Timestamp
Duration
Call Type / Direction
```

Additional source fields may be retained as metadata.

---

# 26. CDR Normalized Representation

A normalized CDR record should conceptually contain:

```text
sourcePhone
targetPhone
timestamp
duration
direction
```

Example:

```json
{
  "sourcePhone": "9876500002",
  "targetPhone": "9876500003",
  "timestamp": "2026-09-22T10:20:00",
  "duration": 120,
  "direction": "OUTGOING"
}
```

Actual source fields may differ and must be mapped through the parser.

---

# 27. CDR Validation

Validate:

* source phone exists where required;
* destination phone exists where required;
* timestamp is parseable where provided;
* duration is numeric where provided;
* unsupported call records are handled explicitly.

Invalid records should not silently become valid records.

---

# 28. IPDR Ingestion

IPDR represents network activity.

Relevant fields may include:

```text
Phone / Subscriber Identifier
IP Address
Timestamp
Destination / Remote Endpoint
Session Information
```

Only fields actually available in the source artifact should be populated.

---

# 29. IPDR Normalization

Normalize:

* IP address format;
* timestamps;
* subscriber identifiers where available;
* device/phone identifiers where explicitly provided.

Example:

```text
Raw:
203.0.113.025

Normalized:
203.0.113.25
```

Normalization must not invent missing associations.

---

# 30. Bank Transaction Ingestion

Bank transaction records are a primary source for financial flow analysis.

Relevant fields include:

```text
Transaction Reference
Source Account
Destination Account
Amount
Currency
Timestamp
Description
```

Additional bank-specific fields may be retained in metadata.

---

# 31. Bank Transaction Validation

Required transaction fields depend on source format, but a transaction should not be persisted as a valid financial relationship when essential fields are malformed.

Validate:

* transaction reference where available;
* amount;
* timestamp where required;
* source/destination identifiers where applicable;
* currency where available.

Negative or malformed monetary values must be handled according to explicit validation rules rather than silently corrected.

---

# 32. UPI Transaction Ingestion

UPI transaction records may contain:

```text
Transaction Reference
Payer / Source
Payee / Destination
UPI ID
Amount
Timestamp
Status
```

The parser should retain relevant source information.

---

# 33. UPI Normalization

UPI identifiers should be canonicalized consistently.

Example:

```text
Raw:
MuleA001@UPI

Canonical:
mulea001@upi
```

Whitespace should be removed where appropriate.

The system must not alter the semantic identifier.

---

# 34. UPI and Bank Correlation

Ingestion should preserve sufficient structured information for downstream correlation between:

```text
UPI ID
      ↕
Bank Account
```

However, ingestion itself should not infer an unsupported UPI-to-bank relationship.

Only explicit or validated source information should produce the association.

---

# 35. Android Log Ingestion

The MVP supports:

```text
.txt
.json
```

Android logs may contain:

* timestamps;
* device identifiers;
* IP addresses;
* application information;
* network events;
* system events.

The parser must preserve useful raw references.

---

# 36. Android JSON Logs

For JSON artifacts:

```text
Raw JSON
   ↓
JSON Parser
   ↓
Record Path
   ↓
Structured Record
```

Example raw reference:

```text
$.networkEvents[12]
```

The original JSON file remains unchanged.

---

# 37. Android TXT Logs

For text logs:

```text
Raw Text
   ↓
Line Parser
   ↓
Line Reference
   ↓
Structured Record
```

Example:

```text
Line 83
```

The parser should only extract fields supported by the implemented log patterns.

---

# 38. EML Ingestion

`.eml` files represent email messages and headers.

The MVP should focus on email-header metadata.

Potential fields:

```text
From
To
Subject
Date
Message-ID
Received
Return-Path
Reply-To
Authentication-related headers
```

Only headers actually present should be populated.

---

# 39. Email Header Traceability

Every extracted email header should remain traceable to:

```text
EvidenceFile
Header Name
Header Value
```

Where useful, the raw reference may identify the exact header occurrence.

---

# 40. Spoofed Header Analysis

Email header parsing should preserve fields needed by downstream analysis.

The ingestion layer may identify syntactic/header anomalies.

However, the ingestion layer must not independently conclude that an email was malicious or definitively spoofed.

Such analysis belongs to a dedicated deterministic rule or finding.

---

# 41. Generic JSON Ingestion

Generic JSON artifacts should be supported only when their structure can be mapped to a known artifact type.

Do not automatically interpret arbitrary JSON fields as investigative entities.

For example:

```text
{
  "phone": "..."
}
```

does not automatically establish a relationship unless the artifact specification supports that interpretation.

---

# 42. Generic TXT Ingestion

Generic text should not be aggressively interpreted.

The system should only extract structured information using an explicit parser or recognized format.

This prevents accidental entity creation from arbitrary text.

---

# 43. Normalization Stage

After parsing:

```text
Parsed Record
      ↓
Field Validation
      ↓
Canonicalization
      ↓
Normalized Record
```

Normalization should be deterministic.

---

# 44. Phone Number Normalization

Phone numbers should be canonicalized consistently.

For the MVP, the intended canonical representation is the 10-digit Indian mobile number where applicable.

Example:

```text
+91 98765 00002
        ↓
9876500002
```

The normalization layer must avoid incorrectly stripping meaningful digits from international or non-standard identifiers.

---

# 45. UPI Normalization

UPI IDs should:

* be trimmed;
* be converted to lowercase;
* preserve the complete identifier.

Example:

```text
MuleA001@UPI
    ↓
mulea001@upi
```

---

# 46. Email Normalization

Email identifiers should generally be:

* trimmed;
* normalized for case where appropriate;
* stored consistently.

Raw source values should remain available when necessary for evidence traceability.

---

# 47. IP Normalization

IPv4 addresses should be normalized to canonical dotted-decimal representation.

IPv6 values should be preserved in a valid canonical representation if supported.

Malformed IP addresses should fail validation rather than being silently modified.

---

# 48. MAC Normalization

MAC addresses should be normalized consistently.

Example:

```text
02-00-00-00-00-01
        ↓
02:00:00:00:00:01
```

The original value remains available through the raw evidence reference.

---

# 49. Timestamp Normalization

Timestamps from different artifacts may use different formats.

The normalization layer should convert valid timestamps into a consistent internal representation.

The system should preserve timezone information when present.

If the source does not specify a timezone, the system must not invent one without an explicit application rule.

---

# 50. Monetary Normalization

Amounts should be converted into a consistent numeric representation.

The system must avoid floating-point precision problems for financial values.

The implementation should use an appropriate decimal representation.

Example:

```text
₹25,000
    ↓
25000
```

Currency should remain separately represented.

---

# 51. Missing Fields

Missing data must remain missing.

Example:

```text
duration = null
```

must not become:

```text
duration = 0
```

unless the source explicitly indicates zero.

Missing data should not automatically contribute negative evidence to risk calculations.

---

# 52. Invalid Fields

Invalid fields should be handled according to severity.

Possible outcomes:

```text
Valid record
Valid record + warning
Rejected record
Processing failure
```

The system should prefer retaining valid portions of an artifact where doing so does not compromise traceability.

---

# 53. Partial Parsing

If an artifact contains:

```text
100 records
95 valid
5 invalid
```

the parser may process the 95 valid records while reporting the 5 invalid records, provided the parser's validation rules allow partial processing.

The result should clearly indicate the partial-processing condition.

---

# 54. Processing Statistics

Every processing operation should be able to report:

```text
Total Records
Successfully Parsed
Rejected
Warnings
Errors
Normalized
Persisted
```

Example:

```text
Records: 100
Parsed: 98
Rejected: 2
Warnings: 4
Persisted: 98
```

---

# 55. Processing Errors

Errors should include enough information for debugging without exposing sensitive evidence unnecessarily.

Example:

```text
Evidence:
EV-003

Error:
Invalid amount at CSV row 17

Field:
amount

Reason:
Expected numeric value
```

Do not log entire sensitive records by default.

---

# 56. Parser Errors vs Processing Errors

Distinguish:

### Parser error

The artifact cannot be interpreted correctly.

Example:

```text
Malformed XLSX file
Invalid EML structure
Unreadable JSON
```

### Record error

A specific record is invalid.

Example:

```text
Invalid timestamp at row 17
```

### Processing error

The system fails while persisting or processing otherwise valid input.

Example:

```text
Database unavailable
```

---

# 57. Reprocessing

Evidence should be reprocessable without modifying the original artifact.

Example:

```text
Original Evidence
       │
       ├── Processing Version 1
       │
       └── Processing Version 2
```

Reprocessing should not replace or modify the original SHA-256.

---

# 58. Idempotency

Processing the same evidence artifact repeatedly should not create uncontrolled duplicate records.

The ingestion service should use evidence identity and source record identity to detect previously processed records.

The exact implementation may use:

```text
Evidence ID
+
Source Record ID
```

or another deterministic identifier.

---

# 59. Parser Versioning

Where parser behavior changes, the system should be able to identify the parser version used for processing.

Example:

```text
parser:
bank-csv

version:
1.0.0
```

This supports reproducibility and debugging.

---

# 60. Normalizer Versioning

Where normalization behavior materially changes, the processing result should be attributable to the relevant normalization version.

This is particularly important for:

* phone normalization;
* timestamp conversion;
* identifier canonicalization.

---

# 61. Processing Metadata

Processing metadata may include:

```text
parser name
parser version
normalizer version
processing started
processing completed
record count
warning count
error count
```

This metadata should be separate from the original evidence content.

---

# 62. Ingestion Service

The main service should coordinate the entire pipeline.

Suggested location:

```text
lib/ingestion/ingestion-service.ts
```

Responsibilities:

```text
validateArtifact()
hashArtifact()
storeArtifact()
selectParser()
parseArtifact()
validateRecords()
normalizeRecords()
persistRecords()
updateProcessingStatus()
```

The service should coordinate these operations rather than duplicating parser logic.

---

# 63. Parser Registry

Suggested location:

```text
processing/parsers/parser-registry.ts
```

Conceptually:

```text
Artifact Type
+
Format
        ↓
Parser Registry
        ↓
Correct Parser
```

Example:

```text
CDR + CSV
→ CDR CSV Parser

BANK_TRANSACTION + XLSX
→ Bank XLSX Parser
```

---

# 64. Parser Independence

Each parser should be independently testable.

A parser test should not require:

* the full UI;
* the AI provider;
* the graph;
* the risk engine.

It should operate on a fixture and return deterministic parsed output.

---

# 65. Ingestion API Mapping

The ingestion specification maps to the API contract.

Primary endpoints include:

```text
POST /api/cases/:caseId/evidence
POST /api/cases/:caseId/evidence/:evidenceId/hash
POST /api/cases/:caseId/evidence/:evidenceId/process
GET  /api/cases/:caseId/evidence/:evidenceId
GET  /api/cases/:caseId/evidence
GET  /api/cases/:caseId/evidence/:evidenceId/records
GET  /api/cases/:caseId/evidence/status
POST /api/cases/:caseId/evidence/:evidenceId/verify
```

The exact route parameters and response structure must remain aligned with `API_SPECIFICATION.md`.

---

# 66. Upload Response

A successful upload should provide enough information for the UI to track processing.

Conceptually:

```json
{
  "success": true,
  "data": {
    "evidenceId": "EV-001",
    "filename": "bank_transactions.csv",
    "artifactType": "BANK_TRANSACTION",
    "processingStatus": "UPLOADED",
    "integrityStatus": "PENDING"
  }
}
```

The final API response may contain additional metadata.

---

# 67. Processing Response

A processing request should return the current processing state.

Example:

```json
{
  "success": true,
  "data": {
    "evidenceId": "EV-001",
    "processingStatus": "PROCESSED",
    "recordsProcessed": 25,
    "recordsRejected": 1
  }
}
```

---

# 68. Security Requirements

The ingestion pipeline must treat all uploaded evidence as untrusted input.

Required protections:

* file type validation;
* file size validation;
* safe filenames;
* safe storage paths;
* case isolation;
* no execution of uploaded files;
* no arbitrary code execution;
* no direct public access to evidence storage;
* controlled parser selection;
* input validation;
* safe error handling.

---

# 69. Path Traversal Protection

User-controlled filenames must never be allowed to construct arbitrary filesystem paths.

Reject or sanitize dangerous values such as:

```text
../../secret.txt
..\..\secret.txt
```

Storage paths should be generated by the application.

---

# 70. Evidence Access

Original evidence should not be served directly through a public static directory.

Access should occur through controlled server-side mechanisms.

Case authorization must be applied before returning evidence.

---

# 71. Resource Exhaustion

Parsers must be protected against excessively expensive inputs.

Examples:

* oversized CSV files;
* deeply nested JSON;
* malformed XLSX files;
* unexpectedly large EML content;
* huge text files.

The system should enforce configured limits.

---

# 72. Logging Rules

Do not log:

* complete bank records;
* complete phone records;
* complete email bodies;
* complete evidence files;
* secrets;
* API keys.

Logs should contain identifiers and processing metadata where possible.

Example:

```text
EV-003 processing failed at row 17
```

is preferable to logging the entire row.

---

# 73. AI Boundary

Raw uploaded evidence must not automatically be passed to the AI provider during ingestion.

The ingestion layer produces structured data.

The AI layer later receives controlled investigation context through:

```text
lib/ai/ai-context-builder.ts
```

This separation reduces unnecessary data exposure and keeps AI downstream from deterministic processing.

---

# 74. Ingestion and Correlation Boundary

Ingestion should prepare data.

Correlation should interpret relationships.

Therefore:

```text
Ingestion
    ↓
"Phone X appeared in record Y."

Correlation
    ↓
"Phone X USES IMEI Z."
```

The second statement requires a correlation rule and evidence support.

---

# 75. Ingestion and Risk Boundary

Ingestion must not calculate risk.

Correct:

```text
Evidence
 ↓
Ingestion
 ↓
Structured Data
 ↓
Correlation
 ↓
Risk Engine
```

The risk engine owns risk scoring.

---

# 76. Canonical Demo Dataset

The ingestion implementation must support the canonical files defined in `DEMO_SCENARIO.md`:

```text
mock-data/case-001/
├── cdr.csv
├── ipdr.csv
├── bank_transactions.csv
├── upi_transactions.csv
├── android_logs.json
└── email_headers.eml
```

---

# 77. Canonical Demo Processing

The demo ingestion sequence should be:

```text
Upload cdr.csv
      ↓
SHA-256
      ↓
CDR parser
      ↓
Normalized call records


Upload ipdr.csv
      ↓
SHA-256
      ↓
IPDR parser
      ↓
Normalized network records


Upload bank_transactions.csv
      ↓
SHA-256
      ↓
Bank parser
      ↓
Normalized transactions


Upload upi_transactions.csv
      ↓
SHA-256
      ↓
UPI parser
      ↓
Normalized UPI transactions


Upload android_logs.json
      ↓
SHA-256
      ↓
JSON parser
      ↓
Normalized device/network events


Upload email_headers.eml
      ↓
SHA-256
      ↓
EML parser
      ↓
Normalized email metadata
```

---

# 78. Expected Demo Data Availability

The ingestion system must only create downstream entities when the corresponding mock evidence contains the required information.

Expected relationships described in the demo scenario include:

```text
Phone → IMEI
Phone → IP
Device → MAC
Phone → Phone
Bank Account → Bank Account
UPI → Bank Account
```

Actual creation of each relationship remains the responsibility of the correlation engine.

---

# 79. Ingestion Test Categories

Tests must cover:

### Upload

* supported files;
* unsupported files;
* oversized files;
* malformed filenames;
* missing case.

### Hashing

* correct SHA-256;
* deterministic hash;
* unchanged hash after parsing.

### Parsers

* valid CSV;
* valid XLSX;
* valid JSON;
* valid TXT;
* valid EML;
* malformed artifacts.

### Normalization

* phone;
* UPI;
* email;
* IP;
* MAC;
* timestamps;
* amounts.

### Traceability

* evidence ID;
* record ID;
* raw reference;
* source record ID.

---

# 80. Negative Tests

The ingestion test suite must explicitly test:

```text
Unsupported extension
Malformed CSV
Malformed XLSX
Invalid JSON
Malformed EML
Invalid timestamp
Invalid amount
Invalid IP
Invalid MAC
Missing required field
Oversized file
Duplicate evidence
Path traversal attempt
```

---

# 81. Integration Test

At minimum, one integration test should process the canonical demo dataset.

Expected result:

```text
All supported artifacts
        ↓
Successfully parsed
        ↓
Normalized records persisted
        ↓
Traceability preserved
```

The test should verify that every persisted record can be traced back to its originating evidence artifact.

---

# 82. Processing Acceptance Criteria

The ingestion module is complete when:

* [ ] Supported artifact types are recognized.
* [ ] Supported formats are validated.
* [ ] Original evidence is preserved.
* [ ] SHA-256 is calculated from original bytes.
* [ ] Evidence is case-scoped.
* [ ] Parser selection is deterministic.
* [ ] Parsers return traceable records.
* [ ] Raw references are preserved.
* [ ] Normalization is deterministic.
* [ ] Missing values remain missing.
* [ ] Invalid records are handled explicitly.
* [ ] Processing states are tracked.
* [ ] Integrity status is separate from processing status.
* [ ] Duplicate artifacts are detected without destroying evidence records.
* [ ] Reprocessing does not modify original evidence.
* [ ] Uploaded files are never executed.
* [ ] Canonical demo artifacts can be processed.
* [ ] Ingestion tests pass.

---

# 83. Definition of Done

An evidence artifact is considered successfully ingested when:

```text
Original Artifact Stored
        +
SHA-256 Recorded
        +
Artifact Validated
        +
Correct Parser Selected
        +
Records Parsed
        +
Records Validated
        +
Records Normalized
        +
Records Persisted
        +
Source References Preserved
        +
Processing Status = PROCESSED
```

Only after this stage should the artifact's structured records become available to downstream entity resolution and correlation.

---

# 84. Final Principle

The ingestion system must preserve the distinction between:

```text
WHAT THE SOURCE CONTAINS
```

and:

```text
WHAT CYBERTRACE INFERS FROM THE SOURCE
```

Ingestion records what the evidence contains.

Normalization makes equivalent representations consistent.

Correlation establishes evidence-backed relationships.

Risk evaluates defined patterns.

AI explains structured results.

This separation is fundamental to CYBERTRACE's forensic integrity.

**Raw evidence is preserved. Processing is traceable. Interpretation happens downstream.**
