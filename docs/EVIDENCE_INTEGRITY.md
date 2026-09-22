# CYBERTRACE — Evidence Integrity & Forensic Handling Specification

**Document:** `docs/EVIDENCE_INTEGRITY.md`
**Version:** 1.0
**Status:** Draft for MVP implementation

---

## 1. Purpose

The Evidence Integrity Layer defines how CYBERTRACE receives, preserves, identifies, validates, processes, and references digital evidence.

The primary objective is to ensure that the system can demonstrate:

> **The evidence analyzed by CYBERTRACE is the same evidence that was originally uploaded.**

The system must preserve the original artifact and maintain a traceable relationship between:

```text
Original Evidence
      ↓
SHA-256 Hash
      ↓
Stored Artifact
      ↓
Parsed Records
      ↓
Entities / Relationships
      ↓
Findings / Risk
      ↓
Investigative Report
```

Evidence integrity is foundational to the CYBERTRACE principle:

> **Evidence first. Intelligence second.**

---

# 2. Scope

The Evidence Integrity Layer covers:

* evidence upload;
* file validation;
* original artifact preservation;
* SHA-256 hashing;
* evidence identification;
* storage metadata;
* processing status;
* parser interaction;
* evidence-to-record traceability;
* evidence-to-finding traceability;
* evidence-to-report traceability;
* integrity verification;
* error handling;
* audit metadata.

Supported MVP evidence formats are defined in `PRD.md`.

These include:

* CSV;
* XLSX;
* JSON;
* TXT;
* EML.

Supported artifact categories include:

* CDR;
* IPDR;
* bank transactions;
* UPI transactions;
* email headers;
* Android/system logs.

---

# 3. Core Integrity Principle

The original evidence file must be treated as immutable.

CYBERTRACE may:

* read it;
* hash it;
* parse it;
* extract structured records;
* generate derived intelligence.

CYBERTRACE must not:

* rewrite the original file;
* modify its contents;
* normalize its contents in place;
* overwrite it with parsed data;
* alter its hash;
* delete it as part of ordinary processing.

Conceptually:

```text
                    ORIGINAL
                      FILE
                       │
                 SHA-256 HASH
                       │
          ┌────────────┴────────────┐
          │                         │
      PRESERVED                 PROCESSING
      ARTIFACT                     COPY
                                    │
                              Parser / Normalizer
                                    │
                                    ▼
                             Structured Data
```

The original artifact remains the authoritative source.

---

# 4. Evidence Identity

Each uploaded evidence file receives a unique internal identifier.

Example:

```text
EVID-001
```

The identifier is an application-level identifier.

It must not replace the cryptographic hash.

The system should retain both:

```text
Evidence ID:
EVID-001

SHA-256:
<64-character hexadecimal hash>
```

The Evidence ID provides application reference.

The SHA-256 provides content integrity verification.

---

# 5. SHA-256 Requirement

Every uploaded evidence file must have a SHA-256 hash calculated.

The hash must be calculated from the file bytes.

Example:

```text
File:
bank_transactions.xlsx

SHA-256:
a3f5...<64 hexadecimal characters>...
```

The exact hash must be stored in the `EvidenceFile.sha256` field defined by `DATA_MODEL.md`.

---

# 6. Hashing Workflow

The MVP hashing sequence should be:

```text
File Upload
    │
    ▼
Receive File
    │
    ▼
Validate File
    │
    ▼
Read Original Bytes
    │
    ▼
Calculate SHA-256
    │
    ▼
Store Hash
    │
    ▼
Preserve Original File
    │
    ▼
Begin Processing
```

Hashing should occur before parsing.

This ensures that the hash represents the original uploaded artifact rather than a transformed representation.

---

# 7. Hash Calculation

The implementation should use a standard cryptographic SHA-256 implementation available in the runtime.

Conceptual TypeScript interface:

```text
calculateSha256(file): Promise<string>
```

The function should return the lowercase hexadecimal SHA-256 digest.

Example format:

```text
64 hexadecimal characters
```

The implementation must not use:

* filename;
* file path;
* file size;
* database ID;

as substitutes for the content hash.

---

# 8. Hash Verification

CYBERTRACE should support verification of an existing evidence artifact.

Conceptually:

```text
Stored Evidence
      │
      ▼
Read Current Bytes
      │
      ▼
Calculate SHA-256
      │
      ▼
Compare With Stored Hash
      │
      ├── Match ──► INTEGRITY VERIFIED
      │
      └── Mismatch ► INTEGRITY FAILURE
```

If the calculated hash differs from the stored hash, the system must not silently continue as if the artifact were unchanged.

---

# 9. Integrity Status

The evidence system should maintain an integrity status.

Suggested states:

```text
PENDING
VERIFIED
MISMATCH
ERROR
```

### PENDING

Hash has not yet been verified.

### VERIFIED

Current file hash matches the stored SHA-256 hash.

### MISMATCH

Current file hash differs from the stored SHA-256 hash.

### ERROR

Verification could not be completed.

The exact persistence representation may be implemented as an enum or equivalent field.

---

# 10. Evidence Processing Status

Evidence integrity status is separate from processing status.

Example:

```text
Integrity:
VERIFIED

Processing:
FAILED
```

This means:

> The evidence file has not changed, but its parser failed.

Conversely:

```text
Integrity:
MISMATCH

Processing:
PROCESSED
```

must not be treated as a valid final state.

An integrity mismatch should trigger investigation of the artifact state.

---

# 11. Evidence Metadata

For every evidence file, CYBERTRACE should retain:

```text
Evidence ID
Case ID
Original Filename
Stored Filename
MIME Type
File Extension
File Size
SHA-256
Artifact Type
Integrity Status
Processing Status
Storage Path
Upload Timestamp
Processing Timestamp
Error Message
```

These correspond to the EvidenceFile model defined in `DATA_MODEL.md`, with integrity status added as an implementation-level requirement if not already represented.

---

# 12. Original Filename vs Stored Filename

The original filename should be preserved as metadata.

Example:

```text
Original:
March_2026_CDR.xlsx
```

The physical storage filename should not be trusted directly.

A safer internal storage identifier may be generated:

```text
<evidence-id>.<extension>
```

Example:

```text
EVID-001.xlsx
```

This reduces risks caused by:

* duplicate filenames;
* path traversal;
* special characters;
* unexpected filesystem behavior.

The original filename remains available for investigator reference.

---

# 13. File Upload Validation

Uploaded files must be treated as untrusted input.

Validation should occur before processing.

Minimum validation should include:

* allowed extension;
* expected MIME type where available;
* file size limit;
* readable file content;
* case association;
* storage destination validation.

The system should not trust the filename extension alone.

---

# 14. File Size Limits

The MVP should define configurable upload limits.

Example configuration:

```text
MAX_EVIDENCE_FILE_SIZE_MB
```

The exact production limit can be changed according to deployment constraints.

The important requirement is that the limit is:

* explicit;
* configurable;
* enforced before expensive processing.

Large files should not be allowed to exhaust application memory.

---

# 15. Streaming and Memory Safety

Where practical, hashing should operate through streams or chunked reads.

Conceptually:

```text
Large File
   │
   ├── Chunk 1 ──┐
   ├── Chunk 2   │
   ├── Chunk 3   ├──► SHA-256
   ├── Chunk 4   │
   └── Chunk N ──┘
```

The application should avoid loading unnecessarily large evidence files completely into memory.

This supports the hackathon requirement for lightweight, practical processing.

---

# 16. Evidence Storage

The storage abstraction should be independent from the application logic.

Conceptually:

```text
Evidence Service
      │
      ▼
Storage Interface
      │
      ├── Local Filesystem
      ├── Object Storage
      └── Test Storage
```

The MVP can use local storage for development/demo environments.

The application should not hard-code assumptions that prevent later migration to object storage.

---

# 17. Case Isolation

Every evidence file must belong to a specific case.

Conceptually:

```text
CASE-001
 ├── EVID-001
 ├── EVID-002
 └── EVID-003

CASE-002
 ├── EVID-004
 └── EVID-005
```

Queries must always enforce case boundaries.

An investigator working on one case must not accidentally receive evidence belonging to another case.

---

# 18. Duplicate Evidence Detection

SHA-256 can be used to identify identical file content.

Example:

```text
Evidence A
SHA-256 = X

Evidence B
SHA-256 = X
```

The system can flag:

> Duplicate content detected.

However, duplicate content does not necessarily mean duplicate evidence.

The system should preserve the individual evidence records and case associations rather than automatically deleting one.

---

# 19. Evidence Processing Pipeline

The complete evidence lifecycle is:

```text
                UPLOAD
                  │
                  ▼
           Input Validation
                  │
                  ▼
          Original Preservation
                  │
                  ▼
             SHA-256
                  │
                  ▼
          Integrity Recorded
                  │
                  ▼
              Parsing
                  │
                  ▼
            Normalization
                  │
                  ▼
          Evidence Records
                  │
                  ▼
         Entity Extraction
                  │
                  ▼
             Correlation
                  │
                  ▼
                Risk
                  │
                  ▼
              Findings
                  │
                  ▼
               Report
```

Every downstream result must remain traceable to the evidence that produced it.

---

# 20. Evidence Record Traceability

Parsed records must retain a reference to their source evidence file.

Example:

```text
EvidenceFile:
EVID-001

EvidenceRecord:
REC-001

Relationship:
REL-004

Finding:
FIND-002
```

The traceability chain becomes:

```text
FIND-002
   ↓
REL-004
   ↓
REC-001
   ↓
EVID-001
   ↓
SHA-256
```

This allows investigators to move from an investigative finding back to the original artifact.

---

# 21. Raw Reference

Each EvidenceRecord should retain a `rawReference` where practical.

This may identify:

* source row number;
* sheet name;
* JSON path;
* line number;
* email header section;
* source record identifier.

Example:

```text
rawReference:
{
  "sheet": "Transactions",
  "row": 27
}
```

or:

```text
rawReference:
{
  "line": 143
}
```

The exact format depends on the parser.

The purpose is to allow an investigator to locate the originating data inside the evidence artifact.

---

# 22. Raw Data vs Normalized Data

CYBERTRACE should distinguish between:

### Raw evidence

The original artifact.

### Parsed record

A structured representation of information extracted from the artifact.

### Normalized data

A canonical representation used for correlation.

Example:

```text
Original:
+91 98765 43210

Normalized:
9876543210
```

The normalized value must never replace the original evidence.

The system should retain sufficient metadata to explain how the normalized value originated.

---

# 23. Evidence Immutability

After an evidence artifact has been uploaded and hashed, the original artifact should be immutable through normal application workflows.

Investigators should not have a normal UI operation such as:

```text
Edit Evidence File
```

Instead, if a new artifact is provided, it should be uploaded as a new evidence item.

Example:

```text
EVID-001
Original file

EVID-002
Newly supplied file
```

This preserves the distinction between the two artifacts.

---

# 24. Reprocessing Evidence

The system should support reprocessing without changing the original evidence.

Example:

```text
EVID-001
   │
   ├── Parser v1
   │      ↓
   │   Records
   │
   └── Parser v2
          ↓
       Records
```

The source artifact and SHA-256 hash remain unchanged.

Only derived processing results may change.

If parser versions are stored, the system should retain:

```text
parserVersion
processingTimestamp
processingStatus
```

---

# 25. Processing Failures

A parser failure must not invalidate the original evidence.

Example:

```text
Evidence:
EVID-001
Integrity:
VERIFIED

Parser:
FAILED
```

The system should preserve the artifact and record the processing error.

Example:

```text
errorMessage:
"Unable to parse XLSX worksheet: missing required columns."
```

The investigator should be able to retry processing after the underlying parser or configuration issue is corrected.

---

# 26. Partial Processing

Where an artifact contains multiple independent records, the processing architecture may support partial parsing.

Example:

```text
1000 records
│
├── 980 successfully parsed
└── 20 rejected
```

The system should retain information about rejected records rather than silently discarding them.

However, the MVP implementation may choose to fail the entire artifact if the parser cannot guarantee reliable interpretation.

The selected behavior must be explicit for each parser.

---

# 27. Unsupported Files

If an uploaded artifact is unsupported:

```text
Processing Status:
FAILED

Reason:
UNSUPPORTED_ARTIFACT
```

The original file should remain preserved.

Unsupported content must not be passed into an incompatible parser simply to force processing.

---

# 28. Malicious or Executable Content

CYBERTRACE must never execute uploaded evidence.

In particular, the MVP must not:

* execute uploaded APKs;
* execute scripts contained in evidence;
* launch macros;
* execute shell commands from artifact contents;
* interpret uploaded files as application code.

For APK-related evidence, the MVP should limit itself to safe metadata extraction where explicitly implemented.

---

# 29. Filename and Path Security

The application must sanitize or replace user-controlled filenames before filesystem storage.

Unsafe patterns include:

```text
../../file
..\..\file
/absolute/path
```

Storage paths must be generated by the application.

The original filename should be treated as display metadata, not as a trusted filesystem path.

---

# 30. Access Control

Evidence access should require authorization for the associated case.

At minimum:

```text
User
  │
  ▼
Case Authorization
  │
  ▼
Evidence Authorization
  │
  ▼
Evidence Access
```

An evidence download or preview request must verify that the requesting user has access to the corresponding case.

---

# 31. Evidence Downloads

When an investigator downloads an evidence artifact, the system should preserve the original bytes.

It must not:

* reformat the file;
* rewrite the contents;
* change encoding unnecessarily;
* alter metadata inside the artifact.

The downloaded file should correspond to the preserved evidence artifact.

---

# 32. Integrity Verification Before Reporting

Before generating a final investigative brief, the application should be able to verify that the source evidence remains intact.

Conceptually:

```text
Report Request
      │
      ▼
Check Evidence Integrity
      │
      ├── Verified ──► Generate Report
      │
      └── Mismatch ─► Flag / Stop
```

The exact report policy can be configured, but an integrity mismatch must never be silently ignored.

---

# 33. Integrity Information in the Report

The investigative brief should include evidence integrity information.

Example:

```text
EVIDENCE INTEGRITY

Evidence ID: EVID-001
Artifact: bank_transactions.xlsx
SHA-256: <hash>
Integrity Status: VERIFIED
```

For multiple artifacts, the report can provide an evidence table.

Example:

| Evidence ID | Artifact  | SHA-256  | Status   |
| ----------- | --------- | -------- | -------- |
| EVID-001    | CDR.xlsx  | `<hash>` | VERIFIED |
| EVID-002    | bank.csv  | `<hash>` | VERIFIED |
| EVID-003    | logs.json | `<hash>` | VERIFIED |

The exact report layout will be defined in the reporting specification.

---

# 34. Audit Events

The application should maintain audit events for significant evidence operations.

Suggested events:

```text
EVIDENCE_UPLOADED
EVIDENCE_HASHED
EVIDENCE_VERIFIED
EVIDENCE_INTEGRITY_MISMATCH
EVIDENCE_PROCESSING_STARTED
EVIDENCE_PROCESSING_COMPLETED
EVIDENCE_PROCESSING_FAILED
EVIDENCE_ACCESSED
REPORT_GENERATED
```

Each event may include:

```text
eventId
caseId
evidenceId
eventType
timestamp
actorId
metadata
```

The exact audit implementation may be simplified for the MVP.

---

# 35. Integrity Mismatch Handling

If a mismatch is detected:

```text
Stored Hash:
HASH-A

Calculated Hash:
HASH-B
```

the system must:

1. mark the evidence as integrity-mismatched;
2. record the verification event;
3. prevent the mismatch from being hidden;
4. identify affected derived results where practical;
5. require explicit handling before treating the artifact as verified.

The system must not simply update the stored hash to `HASH-B`.

Changing the stored hash would destroy the original integrity reference.

---

# 36. Evidence Chain

The complete evidence chain should be reconstructable:

```text
┌──────────────────────────┐
│ Original Evidence File   │
└────────────┬─────────────┘
             │
             ▼
       SHA-256 Hash
             │
             ▼
      Evidence Record
             │
             ▼
      Parsed Records
             │
             ▼
       Normalization
             │
             ▼
      Entity Resolution
             │
             ▼
       Relationships
             │
             ▼
       Risk / Findings
             │
             ▼
     Investigative Report
```

Every transformation after the original file is derived data.

---

# 37. Evidence and AI

AI must not be given authority over evidence integrity.

The AI can receive:

```text
Evidence ID
Artifact type
SHA-256
Integrity status
Evidence-derived findings
```

It cannot:

* calculate the authoritative stored hash;
* replace a hash;
* mark evidence as verified;
* modify evidence metadata;
* decide that a mismatch is harmless.

Evidence integrity remains an application-level responsibility.

---

# 38. Evidence and Risk

Risk calculations must use processed evidence whose provenance is known.

A risk factor should ultimately be traceable to:

```text
Risk Factor
    ↓
Finding / Relationship
    ↓
Evidence Record
    ↓
Evidence File
    ↓
SHA-256
```

This ensures that a risk assessment is not detached from its source evidence.

---

# 39. Evidence and Correlation

The Correlation Engine should only use records that have successfully passed the relevant ingestion and validation stages.

For each relationship, the system should preserve:

```text
ruleId
sourceEvidenceRecordId
supportingEvidence
confidence
reason
```

This allows the graph to answer:

> Why does this relationship exist?

and ultimately:

> Which evidence supports it?

---

# 40. Testing Requirements

The Evidence Integrity Layer must include tests for:

### Hashing

* correct SHA-256 calculation;
* deterministic hash output;
* large file handling.

### Verification

* matching hash;
* mismatching hash;
* unreadable file;
* missing artifact.

### Upload validation

* supported file;
* unsupported extension;
* oversized file;
* malformed content.

### Storage security

* path traversal attempts;
* duplicate filenames;
* unsafe filenames.

### Immutability

* original artifact remains unchanged after parsing;
* reprocessing does not alter original bytes.

### Traceability

* EvidenceRecord references correct EvidenceFile;
* relationship references correct EvidenceRecord;
* findings retain evidence references;
* reports retain evidence references.

### Security

* executable content is not executed;
* uploaded content cannot modify application files;
* unauthorized users cannot access another case's evidence.

---

# 41. MVP Acceptance Criteria

The Evidence Integrity Layer is complete when:

* [ ] Every uploaded evidence file receives a SHA-256 hash.
* [ ] The original artifact is preserved.
* [ ] SHA-256 is stored with the evidence metadata.
* [ ] Evidence has a unique application identifier.
* [ ] Evidence belongs to a specific case.
* [ ] File uploads are validated.
* [ ] Storage paths are application-generated.
* [ ] Uploaded evidence is never executed.
* [ ] Evidence integrity can be verified.
* [ ] Hash mismatches are explicitly surfaced.
* [ ] The system does not silently replace a stored hash.
* [ ] Parsed records reference their source evidence.
* [ ] Raw references can identify the originating record where practical.
* [ ] Derived intelligence remains traceable to evidence.
* [ ] Reports can include evidence hashes.
* [ ] Reprocessing does not modify original evidence.
* [ ] AI cannot modify evidence integrity state.
* [ ] Core integrity and traceability tests pass.

---

# 42. Design Principle

CYBERTRACE must maintain a clear distinction between:

```text
ORIGINAL EVIDENCE
        ↓
VERIFIED DERIVED DATA
        ↓
INVESTIGATIVE INTELLIGENCE
        ↓
AI EXPLANATION
```

The further a result is from the original artifact, the more important its provenance becomes.

The system should therefore make it possible for an investigator to move backward from an investigative conclusion to the exact evidence that supports it:

```text
Report
  ↓
Finding
  ↓
Risk Factor
  ↓
Relationship
  ↓
Evidence Record
  ↓
Original Evidence
  ↓
SHA-256
```

This traceability is a core requirement of CYBERTRACE and not an optional reporting feature.
