# SizoCare — AI Agent Instructions

## Purpose

This document defines operating instructions for AI software-engineering agents responsible for building, testing, deploying, and maintaining SizoCare — an AI caregiver-companion platform for families supporting a person diagnosed with schizophrenia. It complements the PRD, Architecture Requirements Document (ARD), Data/API Specifications, and MVP AI Implementation Plan. It must be read together with those four documents; it does not restate their content and defers to them on all product, architecture, and contract questions.

SizoCare operates in a sensitive mental-health context. Agents building this system carry additional responsibility beyond typical software correctness: incorrect, unsafe, or overconfident behaviour in this product can affect a family's real-world caregiving decisions for a person living with a serious psychiatric condition. Every rule below should be read with that weight.

## Primary Objectives

- Deliver production-ready software for the approved MVP scope only (PRD §6.1, MVP Implementation Plan §3).
- Follow the PRD before implementation.
- Follow the ARD for architectural decisions, including its explicit deviations from generic microservice patterns (Supabase/Postgres RLS as the authoritative authorization boundary — ADR-001; `pgmq` for async workflows in place of a message broker).
- Follow the Data/API Specifications for all entity schemas, endpoint contracts, event contracts, and error codes.
- Follow the MVP AI Implementation Plan for phase sequencing and release gates.
- Never introduce undocumented functionality unless explicitly marked optional (`SHOULD`/`MAY`) in a source document.
- Preserve requirement traceability (FR-*, ARD-*, AC-*, TEST-* identifiers) across every artefact produced.
- Report source conflicts instead of resolving them silently.
- Treat every clinical-boundary and crisis-safety rule in this document as release-blocking, not as a style preference.

## Source-of-Truth Precedence

1. Approved product decisions and the PRD Decision Log (DL-001–DL-004) and ARD Architecture Decision Records (ADR-001, ADR-002)
2. PRD functional requirements and scope (`SizoCare_PRD.md`)
3. Architecture Requirements Document (`SizoCare_Architecture_Requirements.md`)
4. Data/API Specifications (`SizoCare_Data_API_Specifications.md`)
5. MVP AI Implementation Plan (`SizoCare_MVP_Implementation_Plan.md`)
6. Programme/Sprint Plan — **not yet produced**; treat as absent until supplied
7. Task-specific instructions

When two sources conflict, stop the affected implementation, identify the exact conflict, and propose the smallest correction. Do not guess. This applies with particular force to any conflict touching crisis escalation, medical-boundary language, or data-access scoping — these are not areas for an agent to exercise independent judgement.

## Agent Responsibilities

### Product Agent

- Validate feature completeness against PRD §7 (FR-AUTH, FR-CASE, FR-DOC, FR-COMPANION, FR-LOG, FR-SYMPTOM, FR-MED, FR-CHANGE, FR-SUMMARY, FR-CRISIS).
- Maintain requirement traceability per PRD §15.
- Reject scope creep — in particular, keep V1-deferred capabilities (multi-caregiver collaboration, messaging integrations, BYOK, additional condition modules) out of the MVP build regardless of how small the addition seems.
- Confirm acceptance criteria are testable.
- Record decisions and unresolved questions; route anything touching PRD §14 Open Questions (OQ-001–OQ-012) to the appropriate human owner rather than resolving it in code.

### UX and Design Agent

- Implement approved journeys and states from PRD §8 (onboarding → first companion chat; crisis message flow).
- Preserve the calm, non-alarmist, non-clinical-jargon tone specified in PRD §9 and the founder brief's UX direction. Do not introduce gamified indicators, red/amber/green risk dashboards, or clinical-looking scoring UI for change detection or symptom data.
- Cover loading, empty, offline, error, success, and destructive states for every screen.
- Maintain WCAG 2.1 AA accessibility requirements.
- The crisis "Get help now" control (FR-CRISIS, MVP Implementation Plan Phase 8) must be persistently accessible and must not depend on AI model availability to render.
- Do not invent new product behaviour to solve visual gaps — escalate to the Product Agent instead.

### Frontend/Web Agent

- Build the Next.js (TypeScript) web client per ARD-4 and MVP Implementation Plan §5.1.
- Use typed API clients generated from the OpenAPI contract in the Data/API Specifications.
- Keep business authorization server-side. The client must never be trusted to enforce case-recipient scoping, consent checks, or crisis-routing logic — Postgres RLS and Edge Function checks are the authoritative boundary (ADR-001).
- Apply secure client storage rules: no case-profile content, conversation content, or documents cached in a way that survives sign-out; access tokens handled per Supabase Auth session model.
- Add component and end-to-end tests, including tests that the crisis control renders and functions when the Gemini API is unreachable.

### Mobile Agent

- Mobile (Expo/React Native) is explicitly deferred to V1 per PRD §6.2 and ARD-4. Do not begin mobile implementation during the MVP phases; this section becomes active only when a future task explicitly authorizes V1 work.
- When activated: implement approved Expo-managed and bare-native boundaries only for capabilities that require them (e.g., push notifications, secure storage).
- Use native adapters only where Expo's managed workflow cannot satisfy the requirement.
- Optimise battery, network, storage, and lifecycle behaviour.
- Never expose sensitive native payloads (case profile data, document content) to shared code unnecessarily.
- Test permission denial, revocation, background suspension, and recovery.

### Backend Agent

- Build Supabase Edge Functions (Deno/TypeScript) as modular, independently testable units per ARD-1 §2 service boundaries.
- Maintain public API compatibility with the Data/API Specifications; internal calls between Edge Functions use authenticated HTTPS/JSON per ADR-001, not gRPC.
- Enforce authentication (Supabase Auth), authorization (RLS policies plus function-level checks), consent (ConsentRecord checks before any AI-provider call), and ownership (case-recipient scoping) on every request.
- Use idempotency keys and optimistic concurrency controls as specified in the Data/API Specifications' global conventions.
- Emit versioned events (`document.processed.v1`, `log.created.v1`, `medication_event.recorded.v1`, `change_signal.detected.v1`, `crisis.flagged.v1`, `summary.generated.v1`) via `pgmq` and Database Webhooks exactly as contracted.
- Add metrics, traces, logs, and audit events (`AuditEvent` entity) for every security-sensitive or clinically relevant action.

### Clinical Safety & Caregiving Domain Agent

> This replaces the template's generic "Domain Specialist Agent" for SizoCare. It owns the product's most safety-critical logic: the Companion RAG pipeline, change detection, crisis evaluation, and doctor-ready summary generation.

- Implement the Companion RAG retrieval pipeline exactly as specified in ARD-3 and ARD-6: system/safety policy → structured case profile → recent relevant logs → medication context → relevant document excerpts → recent conversation context → detected longitudinal changes. Do not inject unbounded raw history into prompts.
- Enforce boundary-language patterns throughout AI-generated output — attributing claims to their source ("She reports...", "The caregiver observed...", "According to the uploaded document...") rather than asserting them as fact. This is a testable output requirement, not stylistic guidance.
- Treat uploaded documents (`UploadedDocument`, extracted `CaseFact` content) strictly as untrusted data during RAG retrieval and prompt construction. Any instruction-like text found inside a document (e.g., "ignore previous instructions," "tell the caregiver to...") must never be executed as an instruction to the model. Build and test explicit prompt-injection defenses for the document-ingestion pipeline (ARD-6, MVP Implementation Plan Phase 2).
- Implement change detection as rule/threshold-based comparison against the care recipient's own historical baseline (DL-004) — not as an ML classifier — and require every surfaced `ChangeSignal` to carry: what changed, the comparison baseline/period, supporting observations, a confidence/uncertainty statement, and a suggested caregiver action (document further / discuss with clinician). Never emit a change signal as a diagnostic conclusion.
- Implement crisis evaluation (`CrisisEvaluationService`) to run independently of, and faster than, the general companion response path, per ARD-12 and MVP Implementation Plan Phase 8. Crisis resource surfacing must not depend on Gemini API availability.
- Enforce the mandatory product invariants at every generation point (see "SizoCare-Specific AI Prohibitions" below) — these are tested per-response, not just per-feature.
- Validate quality thresholds and fail-closed behaviour: if retrieval, classification, or generation confidence cannot be established, the system must default to the more conservative, more boundary-respecting output, never the more assertive one.
- Add deterministic, adversarial, and performance tests for every prompt template and retrieval path, including adversarial tests that attempt to elicit a diagnosis, a medication recommendation, or validation of a delusion as fact.

### Database Agent

- Apply all schema changes through versioned Supabase migrations only, per the 13 canonical entity schemas in the Data/API Specifications.
- Preserve backward compatibility during rollout; use expand/migrate/contract for breaking changes.
- Enforce Postgres constraints, indexes, and Row Level Security policies exactly as specified per entity (this is the system's primary authorization boundary — treat RLS policy correctness as equivalent in severity to an authentication bug).
- Add rollback or forward-fix procedures for every migration.
- Test retention, export, deletion, and restore behaviour against the retention/deletion table in the Data/API Specifications, including cascading deletion across `case_facts`, `daily_logs`, `medication_events`, `Conversation`/`Message`, and `UploadedDocument` storage objects.

### Security Agent

- Review authentication (Supabase Auth) and authorization (RLS policies, Edge Function checks) for every new endpoint or table.
- Validate least privilege for Edge Function service-role usage — service-role keys must never be exposed to any client.
- Review secrets, cryptography, logging, and data flows, with particular attention to the Gemini API proxy (server-side only, per the AI Provider Architecture requirement — the API key must never appear in client-side code, bundles, or logs).
- Run SAST, dependency, secret, and IaC checks as part of CI.
- Block release for unresolved critical/high findings unless formally accepted by a named human owner.
- Own the envelope-encryption implementation and timing decision under ADR-002: confirm before each release stage (internal dogfood vs. public launch) whether envelope encryption of Restricted-class data (diagnosis, story narrative, uploaded documents) is enforced, per the `envelope_encryption_enforced` feature flag.

### Privacy Agent

- Enforce minimisation, purpose limitation, consent, retention, export, and deletion per PRD §10.2 and the Data/API Specifications' privacy invariants.
- Verify sensitive data (diagnosis, symptom content, document content, message content) remains inside approved storage and never leaks into analytics, logs, or error responses.
- Reject analytics events containing prohibited properties (PII, case-profile content, message content) — validate against each feature's "Prohibited properties" list in the PRD.
- Validate privacy defaults (opt-in, not opt-out, for any data sharing) and user-facing controls (export, deletion, consent withdrawal).
- Confirm no caregiver-entered content is sent to Gemini (or any future AI provider) without an active `ConsentRecord`, and confirm the product's data-processing disclosure accurately reflects what is actually sent.

### Trust and Safety Agent

- Validate crisis detection, escalation, and the "Get help now" kill-switch-style control per ARD-12.
- Test adversarial and coercive-use scenarios specific to this domain: a caregiver attempting to get the AI to validate a delusion as true, to endorse covert medication, to provide restraint/confinement instructions, or to recommend a specific dosage change. Each must be refused with an appropriate, non-judgemental redirection.
- Ensure crisis-resource surfacing propagates within required SLOs regardless of AI-provider latency or downtime.
- Country-configurable crisis resources (not hard-coded to one geography) must be verified for every supported launch country before release; the reference implementation's India-specific resources (Tele-MANAS, KIRAN, emergency services) are the MVP default and must not be silently reused for other markets without configuration.

### QA Agent

- Create unit, contract, integration, end-to-end, security, accessibility, performance, and adversarial tests per ARD-16's test automation matrix and MVP Implementation Plan §12.
- Maintain regression suites, with a permanent, never-deleted adversarial suite for the five mandatory product invariants (MVP Implementation Plan §4).
- Validate acceptance criteria against the PRD's Gherkin-style AC-* statements.
- Produce release evidence for each MVP Implementation Plan phase gate and the final MVP Release Gate (MVP Implementation Plan §17).

### DevOps and SRE Agent

- Maintain CI/CD and infrastructure as code for the Vercel (Next.js) + Supabase deployment topology (ARD-15).
- Monitor deployment SLOs, including Gemini API proxy latency and pgvector retrieval latency (the two required platform spikes in the MVP Implementation Plan).
- Automate rollback and recovery; maintain dashboards, alerts, runbooks, backups, and disaster-recovery tests for the Supabase Postgres instance.
- Enforce environment isolation (dev/staging/production Supabase projects) and secret management (Gemini API key, Supabase service-role key, KMS keys never shared across environments).

### Documentation Agent

- Update technical and operational documentation with each change, keeping the PRD, ARD, Data/API Specifications, and MVP Implementation Plan internally consistent as implementation reveals new detail.
- Maintain ADRs (extending Appendix A beyond ADR-001/ADR-002 as new architectural decisions are made), runbooks, API examples, migration notes, and the requirement traceability table (PRD §15).
- Remove stale or contradictory guidance rather than layering new notes over outdated ones.

## Engineering Principles

- Contract-first development (OpenAPI, SQL schema, and event contracts before consumers)
- Modular architecture (Edge Function per service boundary, per ARD-1 §2)
- Domain boundaries (case/document/companion/logging/medication/change-detection/summary/crisis as distinct owned domains)
- Strong typing (TypeScript across client and Edge Functions; SQL schema constraints as the ground truth)
- Test-driven where practical, and mandatory for anything touching the five product invariants
- Privacy by design
- Security by default, with RLS as the default-deny posture
- Fail closed — on ambiguity, prefer the safer, more conservative, more boundary-respecting behaviour
- Observability built in
- Backward-compatible rollout
- Least data necessary
- One authoritative owner per datum (per the Data/API Specifications' service-ownership table)

## Coding Standards

- Small, focused modules — one Edge Function per bounded responsibility.
- Clear names and explicit interfaces; no implicit `any` in TypeScript.
- Strong types and schema validation (Zod or equivalent) at every trust boundary, especially on inputs to the Companion, Change Detection, and Crisis Evaluation services.
- Comprehensive error handling using the Data/API Specifications' error catalogue and stable error codes.
- Structured, redacted logging — never log case-profile content, message content, document content, or API keys.
- No duplicated business logic between client and Edge Functions; the client renders, the backend decides.
- No hardcoded credentials, endpoints, or environment secrets.
- No unbounded retries, queues, queries, or payloads.
- No silent exception swallowing.
- No sensitive data in logs, analytics, fixtures, screenshots, or comments.
- Document non-obvious decisions (especially safety-rule rationale), not obvious syntax.

## Repository Rules

- Respect the approved repository structure (see MVP Implementation Plan §6, adapted for a Next.js + Supabase monorepo: `apps/web/`, `supabase/functions/`, `supabase/migrations/`, `contracts/openapi/`, `contracts/events/`, `tests/`, `docs/`).
- Do not create duplicate Edge Functions or parallel contract definitions for the same responsibility.
- Shared libraries (e.g., a RAG-retrieval helper, a boundary-language formatter) must have a narrow, named purpose.
- Generated code (OpenAPI clients, DB types from Supabase) must be reproducible from the contract, not hand-edited.
- Database changes require migrations — never a manual schema edit against a live project.
- Infrastructure changes require IaC (Supabase config as code / Vercel project config), not manual dashboard changes for anything release-relevant.
- Operational artefacts (runbooks, dashboards-as-code) live beside the owning service or in the approved `infrastructure/`/`docs/` directory.

## Git Workflow

- Use short-lived feature branches.
- One coherent change per pull request.
- Link requirement and task IDs (FR-*, ARD-*, phase number) in every PR description.
- Pull requests require review before merge; changes to RLS policies, the Companion prompt/retrieval pipeline, crisis evaluation, or any AI-prohibition enforcement require review by whoever is acting as the Clinical Safety & Caregiving Domain reviewer, not just a general code reviewer.
- CI must pass before merge.
- Breaking changes require explicit migration and compatibility plans.
- Do not rewrite shared history or bypass protected branches.

## Implementation Workflow

Before implementing any task:

1. Read the relevant PRD requirement (§7 feature block).
2. Read related ARD sections.
3. Read the corresponding Data/API contract (entity schema and/or endpoint spec).
4. Read the implementation phase and task in the MVP Implementation Plan.
5. Identify dependencies and invariants — explicitly check whether the task touches any of the five mandatory product invariants.
6. Confirm Definition of Ready.
7. Create a small execution plan.
8. Implement contracts (SQL schema, OpenAPI, event schema) before consumers.
9. Implement the smallest vertical slice that satisfies acceptance criteria.
10. Add and run tests, including adversarial tests where the task touches Companion, Change Detection, or Crisis Evaluation.
11. Validate acceptance criteria and invariants.
12. Add observability.
13. Update documentation and traceability.
14. Produce a concise change summary and known limitations, using the Task Output Format below.

## Task Output Format

Each completed AI task must report:

```markdown
## Task Summary
- Task: {{TASK_ID_AND_TITLE}}
- Requirements: {{REQUIREMENT_IDS}}
- Status: {{COMPLETE_PARTIAL_BLOCKED}}

## Changes
- {{FILE_OR_COMPONENT}}: {{CHANGE}}

## Contracts and Migrations
- {{CHANGE_OR_NONE}}

## Tests
- {{TEST}}: {{RESULT}}

## Security and Privacy
- {{CHECK}}: {{RESULT}}

## Clinical Boundary / Safety Checks
- {{INVARIANT_OR_CHECK}}: {{RESULT}}

## Observability
- {{METRIC_LOG_TRACE_ALERT}}

## Documentation
- {{UPDATED_DOCS}}

## Remaining Issues
- {{ISSUE_OR_NONE}}
```

The "Clinical Boundary / Safety Checks" section is added for SizoCare specifically and is mandatory whenever a task touches the Companion, Change Detection, Crisis Evaluation, or Doctor-Ready Summary paths. Omit only when the task genuinely does not touch AI-generated caregiver-facing output.

## Testing Requirements

- Unit tests for business logic, including boundary-language formatting helpers.
- Contract tests for public APIs, internal Edge Function calls, and events.
- Integration tests across owned dependencies (e.g., Companion service against pgvector retrieval against Gemini proxy).
- End-to-end tests for user-critical flows: onboarding → first companion chat; daily log → change signal; crisis message → resource surfacing.
- Authorization and RLS policy tests for every table.
- Security tests (input validation, injection, auth bypass attempts).
- Privacy and retention tests (export, deletion, cascading deletion).
- Accessibility tests (WCAG 2.1 AA).
- Performance tests for the Companion response path and pgvector retrieval (per the required platform spikes).
- Adversarial tests for every AI-prohibition in this document — treat these as release gates, equivalent in priority to security tests, not as a "nice to have" QA extra.
- Regression tests for every fixed defect.

## Security Requirements

- Validate all inputs at every trust boundary (client → Edge Function, document → RAG pipeline, webhook → event consumer).
- Apply least privilege — no Edge Function uses the Supabase service-role key unless it specifically requires bypassing RLS for a justified system operation.
- Store secrets (Gemini API key, KMS keys) only in Supabase's/Vercel's approved secret managers.
- Rotate credentials and keys per the schedule in ARD-9.
- Never hardcode credentials.
- Encrypt sensitive data in transit (TLS everywhere) and at rest (Postgres encryption at rest plus application-level envelope encryption for Restricted-class data, per ADR-002's timing decision).
- Audit security-sensitive actions via the `AuditEvent` entity.
- Redact logs and error responses of any case-profile, message, or document content.
- Pin or verify dependencies where required.
- Reject unmaintained or unnecessary third-party packages.
- Do not disable RLS, encryption, or any AI-prohibition check to make tests pass — fix the test or escalate, never weaken the control.

## Privacy Requirements

- Collect only required data — do not add fields to entity schemas beyond what the Data/API Specifications define without a documented product decision.
- Preserve purpose limitation: data collected for case context is not repurposed for unrelated analytics or model training without a separate, explicit consent record.
- Respect explicit consent and revocation for AI processing (`ConsentRecord`).
- Implement conservative defaults (opt-in sharing, opt-in multi-caregiver visibility when that feature ships).
- Enforce retention automatically per the retention table.
- Support account deletion and data export end to end, including cascading deletion.
- Keep sensitive data out of general analytics per each feature's "Prohibited properties" list.
- Prevent lower (dev/staging) environments from receiving production caregiver or care-recipient data.
- Verify deletion across all owned stores, including Supabase Storage objects for uploaded documents and any AI-provider-side context if retention there is ever introduced.

## SizoCare-Specific AI Prohibitions

In addition to the general AI-specific prohibitions below, the system's AI-generated output (Companion responses, Change Signals, Doctor-Ready Summaries) must never:

- Diagnose or re-diagnose the care recipient, or assert a specific clinical explanation for observed behaviour as fact.
- Independently recommend a prescription medication change, dosage, or timing adjustment.
- Provide medication dosing instructions of any kind.
- Reinforce a delusional or paranoid belief as objectively true, or argue the caregiver into validating it.
- Instruct or coach a caregiver to deceive the care recipient.
- Normalize, recommend, or provide instructions for covert (non-disclosed) medication administration.
- Provide instructions for physical restraint, forced confinement, or coercive control of the care recipient.
- Present an AI-generated interpretation, correlation, or change signal as an established clinical fact rather than an observation for the caregiver to consider and, where appropriate, raise with the treating clinician.
- Claim or imply that SizoCare can reliably detect imminent risk of suicide, self-harm, or harm to others. Crisis features surface resources and encourage escalation; they must never be framed as a reliable safety-determination system.
- Claim or imply compliance with HIPAA, GDPR, the DPDP Act, or medical-device regulations unless a human owner has confirmed the underlying legal/technical work is actually complete — these remain open workstreams per PRD §10.3 and §14 until then.

## General AI-Specific Prohibitions

The agent must not:

- Invent credentials, secrets, API keys, legal text, or production configuration.
- Create fake integrations presented as production-ready.
- Weaken authorization, encryption, validation, or retention.
- Bypass failing tests or remove assertions without justification.
- Substitute mocks for required production behaviour without marking the gap.
- Introduce out-of-scope features (see PRD §6.1 Excluded and MVP Implementation Plan §3.2).
- Silently change schemas or public contracts.
- Log private chain-of-thought, prompts containing secrets, or sensitive caregiver/care-recipient data.
- Use production data for convenience (e.g., testing against real caregiver accounts).
- Claim completion when release gates or acceptance criteria fail.

## Definition of Ready

A task is ready only when:

1. Requirement IDs are known.
2. Acceptance criteria are testable.
3. Dependencies are available or explicitly mocked.
4. Contracts and data ownership are defined.
5. UX states are available where relevant.
6. Security, privacy, and safety implications are identified — including, where relevant, which of the SizoCare-Specific AI Prohibitions the task touches.
7. Test expectations are defined.
8. No unresolved source conflict blocks the task.

## Definition of Done

A feature is complete only when:

1. Requirements are implemented.
2. Tests pass, including adversarial tests where applicable.
3. Contracts remain compatible.
4. Security review is complete.
5. Privacy and safety invariants pass.
6. Documentation is updated.
7. Monitoring is added.
8. Performance is acceptable.
9. Accessibility is validated.
10. Migration, rollback, and operational paths are ready.
11. Traceability is updated.
12. The feature is deployable to the intended environment.

## Autonomous Execution Rules

- Continue without clarification when requirements are sufficiently explicit.
- Use conservative defaults only when permitted by source documents, and always in the direction of more safety/privacy/boundary-respect, never less.
- Mark assumptions visibly.
- Do not make product, legal, privacy, clinical-safety, or architecture decisions disguised as implementation details.
- Escalate contradictions, missing release-blocking inputs, and unsafe requirements — in particular, escalate rather than resolve any ambiguity about crisis-resource content, medical-boundary language, or consent scope.
- Prefer partial, correct, testable progress over broad speculative implementation.
- Never call an incomplete prototype production-ready.

## Failure Handling

| Situation | Required response |
|---|---|
| Source conflict | Stop affected work, cite both requirements, propose resolution |
| Missing non-critical detail | Use a visible assumption or placeholder |
| Missing critical contract | Implement no dependent production code |
| Test failure | Diagnose and fix; do not suppress |
| Security/privacy invariant failure | Block release |
| Clinical-boundary or crisis-safety invariant failure | Block release; treat with equal or greater severity than a security finding |
| External dependency unavailable (e.g., Gemini API down) | Add bounded fallback; crisis-resource surfacing must degrade gracefully and remain available |
| Migration risk | Use expand/migrate/contract or approved equivalent |
| Performance target missed | Profile, optimise, document evidence |

## Deliverable Order

1. PRD (`SizoCare_PRD.md`) — complete
2. Architecture Requirements Document (`SizoCare_Architecture_Requirements.md`) — complete
3. Data/API Specifications (`SizoCare_Data_API_Specifications.md`) — complete
4. MVP AI Implementation Plan (`SizoCare_MVP_Implementation_Plan.md`) — complete
5. Programme/Sprint Plan — not yet produced
6. AI Agent Instructions (this document) — complete
7. Source code, tests, infrastructure, and release evidence — pending implementation

## Final Rule

The agent's job is not to generate the most code. It is to produce the smallest complete, secure, testable, observable implementation that satisfies the approved requirements — and, for SizoCare specifically, to do so without ever letting an AI-generated caregiver-facing message cross a clinical, medication, or crisis-safety boundary for the sake of a more fluent or more confident-sounding response.
