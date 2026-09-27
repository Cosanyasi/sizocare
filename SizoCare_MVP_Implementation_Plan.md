# SizoCare — MVP AI Implementation Plan

> Implementation-ready instructions for an AI-assisted software-development workflow. This is not a roadmap pitch. It defines ordered work, technical constraints, tests, and release blockers, consistent with the PRD, ARD, and Data/API Specifications.

## Document Control

| Field | Value |
|---|---|
| Document | MVP AI Implementation Plan |
| System | SizoCare |
| Version | 0.1 |
| Status | Draft — pending clinical, legal, and security review |
| Target release | Invite-only MVP beta (PRD §13.1) |
| Platforms | Responsive web (Next.js) |
| Audience | AI coding agents, engineers, QA |
| Source documents | SizoCare PRD v0.1, SizoCare ARD v0.1, SizoCare Data and API Specifications v0.1 |
| Scope | MVP only |

# 1. Purpose

This document converts approved requirements into:

- Executable functional requirements
- Technical implementation requirements
- Ordered implementation tasks
- Module and data boundaries
- Client, API, data, event, security, privacy, and infrastructure requirements
- Required automated tests
- Acceptance criteria and release gates
- Explicit out-of-scope controls

Requirements marked `MUST` are release blockers. `SHOULD` items require a documented exception if deferred.

# 2. MVP Objective

Implement a production-capable invite-only beta in which a caregiver can:

1. Create a secure account, acknowledge SizoCare's non-clinical/non-emergency nature, and build an initial Case Profile through story text, a guided questionnaire, or a document upload.
2. Have a contextual, safety-bounded conversation with the Companion, grounded in that Case Profile and recent observations.
3. Record daily logs and medication events quickly enough to sustain regular use, and browse a timeline of what has been recorded.
4. See a rule-based Change Signal when recent logs meaningfully differ from the person's own baseline, and generate a doctor-ready summary to bring to the next appointment.
5. Trust that crisis-indicative content is met with escalation guidance first, and that account data can be exported or deleted on request.

# 3. MVP Scope Boundary

## 3.1 Included

- Caregiver account, onboarding, Case Profile, document upload/extraction
- Companion chat (Gemini-only, provider-abstracted)
- Daily logs, symptom timeline, medication tracking
- Rule-based change detection
- Doctor-ready summaries
- Crisis and escalation UX, country-configurable resources
- Privacy/security foundations: encryption at rest/in transit, consent capture, export/deletion orchestration

## 3.2 Excluded

- WhatsApp/Telegram messaging integrations
- Multi-caregiver collaboration
- BYOK and additional AI providers beyond Gemini
- Additional condition modules
- Native mobile app store release
- Voice/regional-language layer
- Any API or interface that allows the AI to recommend a medication dose change, re-diagnose, or normalize covert medication administration

Data models may preserve extension points (e.g., a `collaborators` table designed but unused), but excluded capabilities must remain inaccessible and disabled behind feature flags (§13).

# 4. Mandatory Product Invariants

1. No Companion or Summary output ever asserts a persecutory, referential, somatic, or command-hallucination belief as objectively true.
2. No Companion output recommends starting, stopping, or changing a medication dose, or normalizes covert medication administration.
3. A crisis-flagged Companion response always renders escalation resources before any other content.
4. No caregiver data is sent to the Gemini API without an active, unrevoked consent record of the correct type.
5. No cross-caregiver data is ever readable through any route (RLS-enforced, integration-tested).

Any test failure against an invariant blocks release.

# 5. Prescribed Technical Baseline

## 5.1 Client Architecture

### Shared Application

- Framework: Next.js (App Router)
- Language: TypeScript
- Architecture: Server components for data-heavy screens, client components for interactive flows (Companion chat, log entry)
- State management: React Query for server state, React Context/Zustand for local UI state
- Navigation: Next.js file-based routing
- Networking: Supabase JS client (RLS-scoped direct queries) + typed `fetch` wrappers for Edge Function routes
- Models: TypeScript types generated from the Supabase schema (`supabase gen types typescript`)
- Local persistence: React Query cache only; no offline database at MVP
- Analytics: Thin privacy-safe event wrapper (ARD-13)
- Testing: Vitest (unit), Playwright (end-to-end)
- Accessibility: WCAG 2.1 AA

The shared client owns:

- All presentation logic and client-side validation (mirrored, not replaced, by server-side validation)
- Direct RLS-scoped reads for Case Profile, Logs, Medication, Timeline

The shared client must not be the authoritative enforcement boundary for:

- Consent checks before AI/document processing (enforced in Edge Functions)
- Crisis detection and boundary-language enforcement (enforced in Edge Functions)
- Any Gemini API credential (never present in client code or bundle)

### iOS Native Adapter

- Status: Deferred to V1 (PRD §6.2). Not built in MVP.
- Planned language: Swift, via Expo's native module bridge when built
- Planned secure storage: Keychain/Secure Enclave via Expo SecureStore
- Testing: XCTest/XCUITest, deferred

### Android Native Adapter

- Status: Deferred to V1. Not built in MVP.
- Planned language: Kotlin, via Expo's native module bridge when built
- Planned secure storage: Android Keystore via Expo SecureStore
- Testing: JUnit/Robolectric/instrumentation, deferred

### Shared-to-Native Communication

- Not applicable in MVP (no native shell exists). When built at V1, Expo's typed module bridge is the only sanctioned mechanism; sockets, local HTTP servers, and plaintext files remain prohibited, consistent with ARD-4 §3.

## 5.2 Backend

- Default language: TypeScript (Supabase Edge Functions, Deno runtime)
- Public API: REST via Edge Functions + direct RLS-scoped Postgres access (Data/API Spec §2.1, §9)
- Internal API: Authenticated HTTPS/JSON between Edge Functions (Data/API Spec §2.2, ADR-001) — not gRPC
- Gateway: Supabase-managed API gateway
- Event bus: `pgmq` (Postgres queue extension) + Supabase Database Webhooks (Data/API Spec §2.3)
- Relational database: Supabase Postgres
- Specialised database: `pgvector` extension on the same Postgres instance (RAG embeddings)
- Cache: None dedicated at MVP; React Query client-side caching plus Supabase Realtime for ephemeral presence
- Object storage: Supabase Storage
- Encryption: Provider-managed at rest baseline + application-level envelope encryption for Restricted fields (ARD-9, ADR-002)
- Authentication: Supabase Auth (GoTrue), JWT bearer
- Containers: None self-managed (Supabase/Vercel are managed platforms)
- Orchestration: None self-managed
- Infrastructure as code: Supabase CLI migrations, versioned in the repository
- Deployment packaging: Git-based Vercel deploys + Supabase CLI migration pipeline in CI
- Observability: Vercel/Supabase built-in logs and metrics at MVP, exported to a lightweight external dashboard if needed (tool TBD)

## 5.3 Approved MVP Simplifications

| Area | MVP choice | Future option | Boundary that must remain |
|---|---|---|---|
| AI provider | Gemini only | BYOK, OpenRouter-compatible, multi-provider | Provider-abstraction interface must exist in code even though only one provider is enabled |
| Change detection | Rule/threshold-based on personal baseline | More sophisticated statistical or ML approach | Explainable, per-signal reasoning must remain available regardless of method (DL-004) |
| Mobile | Web-only (responsive) | Expo/React Native native app | Backend and data model must not assume a web-only client (Data/API Spec is platform-agnostic) |
| Caching | None dedicated | Redis or equivalent if latency requires it | No sensitive data cached beyond short-TTL idempotency keys |
| Multi-caregiver | Single owner only | Collaboration with roles/permissions | Schema must not require a breaking migration to add collaborators (`collaborators` table reserved, Data/API Spec Appendix D) |

## 5.4 Deployment Region

Supabase project region selected for proximity to India and a data-residency-conscious posture, confirmed during Phase 0 setup (exact region is an infrastructure task, not a product decision, and is recorded in the Phase 0 completion gate). Multi-AZ/compliance posture beyond the Supabase-managed default is not pursued at MVP scale; revisit if legal review (PRD OQ-001–OQ-003) requires it.

# 6. Repository Structure

```text
sizocare/
├── apps/
│   └── web/                     # Next.js app
├── packages/
│   ├── shared-types/             # Generated Supabase types + shared event schemas
│   ├── ui/                       # Shared design-system components
│   └── validation/                # Shared client/server validation schemas
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   ├── case-api/
│   │   ├── document-api/
│   │   ├── companion-api/
│   │   ├── log-api/
│   │   ├── medication-api/
│   │   ├── change-detection-job/
│   │   ├── summary-api/
│   │   └── crisis-api/
│   └── seed/
├── contracts/
│   └── openapi/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
```

# 7. AI Agent Execution Rules

1. Read the relevant PRD, ARD, and Data/API Specification sections before editing code.
2. Trace each task to requirement IDs (FR-*, ARD section, API section).
3. Do not invent functionality outside the approved MVP scope (§3).
4. Prefer the prescribed stack (§5). Any deviation requires a new ADR appended to the ARD.
5. Implement RLS policies and Edge Function contracts before client consumers.
6. Implement the smallest vertical slice that satisfies the phase's acceptance criteria.
7. Add tests in the same change.
8. Run linting, type checks, tests, and security checks before marking a task complete.
9. Update documentation and traceability (PRD §15).
10. Stop and report conflicts between source documents instead of silently choosing one.

## 7A. Client-Native Boundary Rules

- Not applicable in MVP (no native shell). Documented for V1 continuity: any future native adapter must not receive raw Gemini API responses containing unfiltered case content without passing through the same boundary-language post-check the web client relies on.
- Prohibited data flow: the client, of any kind, must never hold the Gemini API key.

## Required Platform Spike

| Question | Prototype | Pass condition | Output |
|---|---|---|---|
| Can `pgvector` similarity search over Case Facts and document chunks return relevant, correctly-scoped results within the Companion latency budget (Data/API Spec §20)? | A minimal retrieval spike against a seeded test Case Profile | p95 retrieval latency contributes ≤ 1.5s of the 6s Companion budget | ADR (if a different retrieval approach is needed) + test evidence |
| Does application-level envelope encryption (ADR-002) add acceptable latency to Case Profile reads/writes? | A minimal encrypt/decrypt spike on `case_facts.content` | p95 added latency ≤ 100ms | ADR + test evidence, informs whether ADR-002's MVP deferral is exercised |

# 8. Implementation Phases

# Phase 0 — Bootstrap and Contract Foundation

## Goal

Stand up the Supabase project, base schema, RLS scaffolding, CI/CD, and the shared TypeScript contracts every later phase depends on.

## Functional Requirements

- None user-facing; this phase is pure foundation.

## Technical Requirements

### Repository

- Initialize the monorepo structure (§6); configure TypeScript project references

### Contracts

- Generate initial Supabase types; scaffold the shared event-schema package (Data/API Spec §8.1, §11.1)

### Shared Libraries

- Shared validation schemas for every entity in Data/API Spec §6

### Infrastructure

- Create the dedicated SizoCare Supabase project (DL-002); confirm region (§5.4); enable `pgvector` and `pgmq` extensions

### CI/CD

- CI pipeline: lint, type-check, unit tests, Supabase migration dry-run, OpenAPI lint (Data/API Spec §24)

## Required Tests

- Migration apply/rollback smoke test on a disposable Supabase branch

## Completion Gate

- [ ] Supabase project exists with region confirmed and recorded
- [ ] Base migrations apply cleanly in CI
- [ ] Shared types package builds and is consumed by a placeholder Next.js page

---

# Phase 1 — Caregiver Account & Onboarding

## Goal

A caregiver can sign up, acknowledge the non-clinical disclaimer, and reach an Onboarding-state account.

## Functional Requirements

- FR-AUTH-001, FR-AUTH-002, FR-AUTH-003 (PRD §7.1)

## Technical Requirements

### Client

- Signup/login screens (Supabase Auth email/password + magic link)
- Non-clinical disclaimer acknowledgment screen, blocking further progress until confirmed

### Backend

- `onboarding_state` table and RLS policy
- Edge Function or direct-table logic to mark onboarding milestones

### Data

- `auth.users` (Supabase-managed), `onboarding_state`, `consent_records` (initial rows for future consent types, unset)

### Events and Integrations

- None yet (Companion, Document Intake come later)

### Security and Privacy

- Password policy per Supabase Auth defaults; rate limiting on auth endpoints (Data/API Spec §13)

## Client UX Requirements

- Loading: standard spinner/skeleton on auth actions
- Empty: N/A (first screen)
- Error: safe, non-technical auth error messages
- Offline: block auth actions with a clear message
- Accessibility: form labels, focus management, WCAG 2.1 AA

## Required Tests

- Unit: disclaimer-acknowledgment gating logic
- Contract: Supabase Auth flow against documented session shape
- Integration: RLS denies access to `onboarding_state` for a different caregiver
- End-to-end: signup → disclaimer → Onboarding state reached
- Security/privacy: no email/phone in analytics events (Data/API Spec §8.2)
- Performance: N/A (auth latency is Supabase-managed)

## Completion Gate

- [ ] A new caregiver reaches Onboarding state end-to-end
- [ ] RLS cross-caregiver denial test passes
- [ ] Analytics event `auth.signup_completed` fires with only approved properties

---

# Phase 2 — Case Profile, Story Context, and Document Intake

## Goal

A caregiver can build a Case Profile via story text, guided questionnaire, or document upload, with every fact provenance-tagged and reviewable.

## Functional Requirements

- FR-CASE-001–003, FR-DOC-001–003 (PRD §7.2, §7.3)

## Technical Requirements

### Client

- Case Profile view/edit UI with provenance badges
- Guided questionnaire flow
- Document upload UI (signed-URL upload to Supabase Storage) + review queue for pending facts

### Backend

- `case-api` Edge Function (Data/API Spec §9.2)
- `document-api` Edge Function (Data/API Spec §9.3) + async OCR/extraction pipeline (ARD-6)
- Prompt-injection containment in the extraction pipeline (FR-DOC-002)

### Data

- `care_recipients`, `case_facts`, `documents`, `extracted_facts` migrations and RLS (Data/API Spec §6.1–6.3)

### Events and Integrations

- `document.processed.v1`

### Security and Privacy

- `document_ai_processing` consent capture before any document is queued for AI-assisted extraction
- Envelope-encryption spike outcome (§7 Required Platform Spike) informs whether `case_facts.content`/`care_recipients.diagnosis_summary` ship encrypted in this phase or as a fast-follow within Phase 2

## Client UX Requirements

- Loading: processing state shown while a document is OCR'd/extracted
- Empty: "No case context yet" prompt with three clear entry points (write, answer questions, upload)
- Error: upload-failed retry flow
- Offline: block uploads/edits with a clear message
- Accessibility: file-picker keyboard accessibility, screen-reader labels on provenance badges

## Required Tests

- Unit: provenance-tag assignment logic, conflict-surfacing logic
- Contract: `case-api` and `document-api` routes against Data/API Spec §9.2–9.3
- Integration: document deletion cascades correctly to not-yet-confirmed facts only
- End-to-end: upload → extraction → review → confirm → fact usable by Companion (verified once Phase 3 exists; stub retrieval check acceptable here)
- Security/privacy: injection-pattern test suite (documents containing instruction-like text) confirms no behavioural change in extraction output
- Performance: document processing p95 within Data/API Spec §20 target

## Completion Gate

- [ ] A caregiver can reach a reviewable Case Profile via all three input paths
- [ ] AC-DOC-002 (prompt-injection containment) passes
- [ ] AC-CASE-001/002 pass

---

# Phase 3 — Caregiver AI Companion (Gemini-backed RAG Chat)

## Goal

A caregiver can have a safety-bounded, context-grounded conversation with the Companion, including first-pass crisis detection.

## Functional Requirements

- FR-COMPANION-001–004 (PRD §7.4); FR-CRISIS-001–003 (PRD §7.10, integrated here for Companion; Logging integration follows in Phase 4)

## Technical Requirements

### Client

- Conversation list/detail UI, message composer, crisis-banner rendering with highest visual priority

### Backend

- `companion-api` Edge Function implementing the pipeline in ARD-3 §2 (context assembly, Gemini call via provider-abstraction interface, boundary post-check)
- `crisis-api` / `CrisisEvaluationService` internal contract (Data/API Spec §10.2)
- Fixed, non-editable system-policy prompt, versioned (`policy_version`)

### Data

- `conversations`, `messages` migrations and RLS (Data/API Spec §6.4–6.5)

### Events and Integrations

- `companion.message_sent.v1`, `crisis.flagged.v1`
- Gemini API integration behind the provider-abstraction interface (only Gemini enabled per §5.3)

### Security and Privacy

- `ai_processing` consent gating before any Companion call
- Gemini API key stored only in Supabase Function secrets

## Client UX Requirements

- Loading: typing/awaiting-response indicator
- Empty: conversation-starter suggestions once Case Profile is minimally complete
- Error: safe provider-unavailable message (FR-COMPANION error case)
- Offline: block sending, allow reading cached history
- Accessibility: screen-reader-announced new messages, crisis banner with non-colour-only distinction

## Required Tests

- Unit: prompt-assembly context-selection logic, boundary post-check logic
- Contract: `companion-api` route against Data/API Spec §9.1
- Integration: consent-gating denial path (`COMPANION_CONSENT_REQUIRED`)
- End-to-end: full conversation flow including a crisis-triggering message
- Security/privacy: adversarial boundary-language suite (dosage requests, diagnosis requests, covert-medication requests) — 100% pass required (release-blocking, ARD-16 invariant 1)
- Performance: Companion p95 latency target (Data/API Spec §20)

## Completion Gate

- [ ] AC-COMPANION-001 and AC-COMPANION-002 pass
- [ ] AC-CRISIS-001 and AC-CRISIS-002 pass for Companion-sourced messages
- [ ] Adversarial boundary-language suite passes at 100% for release-blocking categories

---

# Phase 4 — Daily Logs, Symptom Timeline, and Log-Sourced Crisis Detection

## Goal

A caregiver can log observations quickly, browse a timeline, and have crisis-indicative log free-text detected with the same rigor as Companion messages.

## Functional Requirements

- FR-LOG-001–003, FR-SYMPTOM-001–003 (PRD §7.5, §7.6); FR-CRISIS-001 extended to the `log` source

## Technical Requirements

### Client

- Fast log-entry UI (category chips, optional intensity, optional free text)
- Timeline UI with category/date filters and trend views

### Backend

- `log-api` Edge Function (Data/API Spec §9.4)
- Crisis evaluation invoked on log free-text via the same `CrisisEvaluationService` contract used by Companion

### Data

- `daily_logs`, `daily_log_history` migrations and RLS (Data/API Spec §6.6)

### Events and Integrations

- `log.created.v1`

### Security and Privacy

- No additional consent required for caregiver-authored log text (it is not sent to the AI provider unless later retrieved by Companion, which is already consent-gated)

## Client UX Requirements

- Loading: optimistic UI on log save, with rollback on failure
- Empty: "No logs yet" state per PRD §9
- Error: future-date rejection message, save-failure retry
- Offline: block writes, allow reading cached logs
- Accessibility: category selection reachable by keyboard, trend charts have a text-equivalent summary

## Required Tests

- Unit: category taxonomy validation, future-date rejection
- Contract: `log-api` route against Data/API Spec §9.4
- Integration: edit-history retention on log edit
- End-to-end: log entry → appears in Timeline → feeds a later Change Detection run (stubbed check acceptable here, full check in Phase 6)
- Security/privacy: crisis-flag-on-log-text adversarial suite
- Performance: log write p95 within Data/API Spec §20 target

## Completion Gate

- [ ] AC-LOG-001/002 and AC-SYMPTOM-001/002 pass
- [ ] Log-sourced crisis detection passes the same adversarial suite standard as Phase 3

---

# Phase 5 — Medication Tracking

## Goal

A caregiver can track medications and dose events, with a persistent boundary notice and no dosage-guidance surface anywhere in the feature.

## Functional Requirements

- FR-MED-001–003 (PRD §7.7)

## Technical Requirements

### Client

- Medication list/detail UI, dose-logging UI, persistent boundary notice component

### Backend

- `medication-api` Edge Function (Data/API Spec §9.5)

### Data

- `medications`, `medication_events` migrations and RLS (Data/API Spec §6.7–6.8)

### Events and Integrations

- `medication_event.recorded.v1`

### Security and Privacy

- No dosage-recommendation code path exists anywhere in this module (verified by the adversarial suite in Phase 3, re-run against medication-context questions)

## Client UX Requirements

- Loading: standard
- Empty: "No medications added yet" state
- Error: discontinued-medication confirmation flow (FR-MED error case)
- Offline: block writes
- Accessibility: status controls (taken/missed/unknown) reachable by keyboard

## Required Tests

- Unit: discontinued-medication flag logic
- Contract: `medication-api` route against Data/API Spec §9.5
- Integration: adherence history computation correctness
- End-to-end: add medication → log 5 doses → adherence view correct (AC-MED-001)
- Security/privacy: Companion dosage-request redirect re-verified with medication context present (AC-MED-002)
- Performance: standard write latency target

## Completion Gate

- [ ] AC-MED-001/002 pass

---

# Phase 6 — Change Detection

## Goal

Rule-based, explainable Change Signals are generated nightly (and on-demand for summary generation) against each individual's own baseline.

## Functional Requirements

- FR-CHANGE-001–003 (PRD §7.8)

## Technical Requirements

### Client

- Change Signal surfacing in Timeline; acknowledge/dismiss controls

### Backend

- `change-detection-job` scheduled Edge Function (`pg_cron` trigger); `ChangeDetectionService` internal contract (Data/API Spec §10.1)

### Data

- `change_signals` migration and RLS (Data/API Spec §6.9)

### Events and Integrations

- `change_signal.detected.v1`

### Security and Privacy

- Signal payloads never include raw log values (Data/API Spec §8.2, §11.5)

## Client UX Requirements

- Loading: N/A (async job; UI reflects existing data)
- Empty: "Not enough history yet" state (FR-SYMPTOM error case reused)
- Error: fail-closed — a failed job run produces no signal rather than a wrong one
- Offline: N/A (server-side job)
- Accessibility: signal cards distinguishable without relying on colour alone

## Required Tests

- Unit: baseline-comparison threshold logic, minimum-data-point gating
- Contract: `ChangeDetectionService` internal contract
- Integration: job failure results in no signal, not a partial one
- End-to-end: seeded log history → nightly job → Change Signal appears with correct explanation fields (AC-CHANGE-001)
- Security/privacy: signal payload contains no raw values
- Performance: job completes within the nightly maintenance window at beta scale

## Completion Gate

- [ ] AC-CHANGE-001/002 pass
- [ ] Job-failure fail-closed behaviour verified

---

# Phase 7 — Doctor-Ready Summaries

## Goal

A caregiver can generate, review, edit, and approve a structured summary for a reporting period.

## Functional Requirements

- FR-SUMMARY-001–003 (PRD §7.9)

## Technical Requirements

### Client

- Summary generation flow, section-by-section review UI with source labels, export (PDF) action

### Backend

- `summary-api` Edge Function (Data/API Spec §9.6), pulling from Logs, Medication, Change Signals

### Data

- `clinical_summaries` migration and RLS (Data/API Spec §6.10)

### Events and Integrations

- `summary.generated.v1`

### Security and Privacy

- Exported PDF includes no compliance/certification claims (PRD FR-SUMMARY BR2)

## Client UX Requirements

- Loading: generation-in-progress state
- Empty: `INSUFFICIENT_HISTORY` handling with a clear explanation
- Error: unreviewed-sections export confirmation (FR-SUMMARY error case)
- Offline: block generation/export
- Accessibility: exported PDF meets basic accessibility (tagged headings) where the chosen PDF library supports it

## Required Tests

- Unit: section-assembly logic, source-labeling correctness
- Contract: `summary-api` route against Data/API Spec §9.6
- Integration: regeneration versioning (`superseded_by`) behaves correctly
- End-to-end: seeded period with signals and logs → summary draft contains all required sections (AC-SUMMARY-001)
- Security/privacy: no unlabeled AI-generated text in the export
- Performance: generation completes within a reasonable interactive wait (target documented in Data/API Spec §20 backlog if not already covered)

## Completion Gate

- [ ] AC-SUMMARY-001/002 pass

---

# Phase 8 — Crisis & Escalation Hardening

## Goal

Harden crisis detection across both entry points (Companion, Logs), ship the persistent "Get help now" control, and complete country-resource configuration.

## Functional Requirements

- FR-CRISIS-001–003 (PRD §7.10), completed end-to-end

## Technical Requirements

### Client

- Persistent "Get help now" control available from any screen
- Country-resource configuration setting in caregiver Settings

### Backend

- `GET /v1/crisis-resources` (Data/API Spec §9.7)
- Country-resource configuration table/store (not hard-coded to India only, per FR-CRISIS-002)

### Data

- `risk_events` migration and RLS (Data/API Spec §6.11) if not already shipped in Phase 3/4

### Events and Integrations

- `crisis.flagged.v1` finalized end-to-end, including the monitored DLQ alert path (Data/API Spec §11.6)

### Security and Privacy

- Crisis resource resolution never depends on a successful Gemini call (must work even if the AI provider is down)

## Client UX Requirements

- Loading: N/A (static resource lookup)
- Empty: safe international default when country is unset
- Error: N/A (this feature must not itself fail closed into silence — a resource-lookup failure shows a hard-coded minimal fallback, e.g. a generic "call your local emergency number" message)
- Offline: cached default resources available even offline (this is the one MVP feature that SHOULD work offline, given the stakes)
- Accessibility: crisis banner meets the highest accessibility bar in the product (large touch targets, clear language, no jargon)

## Required Tests

- Unit: country-resolution logic, safe-default fallback
- Contract: `/v1/crisis-resources` route
- Integration: crisis resources render correctly even when Gemini is simulated as unavailable
- End-to-end: AC-CRISIS-001/002 re-verified end-to-end across Companion and Log entry points
- Security/privacy: no message/log content in `risk_events` (Data/API Spec §6.11 field rules)
- Performance: crisis-resource lookup is fast enough to never be the bottleneck in a crisis-flagged response

## Completion Gate

- [ ] AC-CRISIS-001/002 pass from both Companion and Log entry points
- [ ] Crisis resources render correctly under simulated Gemini outage

---

# Phase 9 — Privacy, Security, and Release Hardening

## Goal

Close out envelope encryption, consent-flow completeness, export/deletion orchestration, observability, and the full adversarial/boundary test suite before inviting the beta cohort.

## Functional Requirements

- Cross-cutting: PRD §10, §13.2; ARD-9; Data/API Spec §15–22

## Technical Requirements

### Client

- Consent capture/revocation UI for both `ai_processing` and `document_ai_processing`
- Export and account-deletion request UI

### Backend

- Envelope encryption finalized for all Restricted fields (ADR-002 resolution)
- Export orchestration Edge Function (Data/API Spec §17)
- Deletion orchestration Edge Function (Data/API Spec §16)

### Data

- `consent_records`, `audit_events` fully wired across every module (Data/API Spec §6.12–6.13)

### Events and Integrations

- `deletion.requested.v1` orchestration event

### Security and Privacy

- Full penetration-test-readiness checklist (Data/API Spec §21)
- Full adversarial boundary-language suite re-run against the final, integrated system (not per-phase in isolation)

## Client UX Requirements

- Loading/empty/error/offline: consistent with the rest of the product per PRD §9
- Accessibility: full WCAG 2.1 AA pass across the product

## Required Tests

- Unit: consent revocation immediately blocks dependent calls
- Contract: export/deletion routes against Data/API Spec §16–17
- Integration: full account deletion reconciles every owned table and Storage bucket within the SLO
- End-to-end: export → deletion → re-signup with the same email produces a fresh account with no residual data
- Security/privacy: all 5 mandatory product invariants (§4) re-verified in one integrated pass
- Performance: full-system load test at beta scale

## Completion Gate

- [ ] All 5 mandatory product invariants pass
- [ ] Export and deletion orchestration tested end-to-end
- [ ] PRD §13.2 launch gates all checked

# 9. Cross-Cutting Functional Requirements

## 9.1 Error Handling

- Stable, catalogued error codes (Data/API Spec §14)
- Safe, non-technical user messages
- Retryability explicitly specified per error code
- `X-Request-ID` propagated end-to-end for correlation
- No sensitive implementation details exposed in any error response

## 9.2 Idempotency

All mutating routes require `Idempotency-Key` (Data/API Spec §3.6); duplicate submissions return the original stored response.

## 9.3 Pagination

Cursor-based pagination on every list route (Data/API Spec §3.4); no offset pagination at MVP.

## 9.4 Optimistic Concurrency

`ETag`/`If-Match` on Case Facts, Medications, and Clinical Summaries (Data/API Spec §3.5).

## 9.5 Accessibility

- Standard: WCAG 2.1 AA
- Non-colour cues: Required for Change Signals and crisis banners (PRD §9)
- Screen-reader semantics: Required on all interactive controls
- Dynamic type/text scaling: Respect browser/OS text-size settings
- Keyboard/switch support: Full keyboard navigability, no keyboard traps

## 9.6 Localisation

- Default locale: `en-IN`
- Externalised strings: required from Phase 1 onward, even though only English ships in MVP, to avoid a costly retrofit for the Phase 3 roadmap (regional-language support)
- Server messages: code-based (Data/API Spec §14), client-localised
- Date/time/number handling: RFC 3339 storage, locale-formatted display

# 10. Data Requirements

## 10.1 Data Ownership

See Data and API Specifications §5 (authoritative source; not duplicated here to avoid drift).

## 10.2 Data Retention

See Data and API Specifications §15 (authoritative source).

# 11. Required Event Contracts

See Data and API Specifications §11 (authoritative source: `document.processed.v1`, `log.created.v1`, `medication_event.recorded.v1`, `change_signal.detected.v1`, `crisis.flagged.v1`, `summary.generated.v1`).

# 12. Mandatory Automated Test Suite

## 12.1 Safety and Privacy

- Adversarial boundary-language suite (dosage, diagnosis, covert medication, restraint/confinement) — 100% pass required, release-blocking
- Crisis-flag-first rendering across the full country-resource set
- Prompt-injection containment suite for document extraction

## 12.2 Authentication and Authorization

- RLS cross-caregiver denial across every table in Data/API Spec §6
- Consent-gating denial paths for AI and document processing

## 12.3 Core Domain

- Case Profile provenance and conflict-resolution logic
- Log/Timeline correctness, including edit-history retention
- Medication adherence computation
- Change Detection threshold and minimum-data-point logic
- Summary section assembly and source-labeling

## 12.4 Account Lifecycle

- Signup → onboarding → active flow
- Export completeness
- Deletion reconciliation across all owned tables/Storage

## 12.5 Secondary Domain

- Document OCR/extraction accuracy on representative sample documents (manual review, not automatable to 100%)
- Notification delivery for Change Signal and Summary events

# 13. Required Feature Flags

| Flag | Default | Environments | Owner | Kill-switch behaviour |
|---|---:|---|---|---|
| `companion_enabled` | On | dev, staging, prod | Founder | Disabling shows a maintenance message on the Companion screen; other features unaffected |
| `document_upload_enabled` | On | dev, staging, prod | Founder | Disabling hides the upload entry point; existing documents remain viewable |
| `change_detection_enabled` | On | dev, staging, prod | Founder | Disabling stops the scheduled job; no new signals generated, existing ones remain visible |
| `collab_enabled` | Off | dev, staging, prod | Founder | Reserved for V1; must remain off throughout MVP (§3.2) |
| `byok_enabled` | Off | dev, staging, prod | Founder | Reserved for future roadmap; must remain off throughout MVP |
| `messaging_integrations_enabled` | Off | dev, staging, prod | Founder | Reserved for future roadmap; must remain off throughout MVP |
| `envelope_encryption_enforced` | Off until ADR-002 resolved | dev, staging, prod | Founder + Security Reviewer | Flips on once envelope encryption ships; release-blocking for public launch (PRD §13.2) |

# 14. Required Deliverables from the AI Development Platform

## 14.1 Source Code

- Next.js web app, Supabase Edge Functions, shared TypeScript packages (§6)

## 14.2 Contracts

- OpenAPI 3.1 spec (Data/API Spec §24)
- Shared event-schema package
- Generated Supabase TypeScript types

## 14.3 Data

- Versioned Supabase migrations
- Seed data for local development and testing
- Retention/deletion job implementation
- Backup/restore verification evidence (ARD-15 §3)

## 14.4 Operations

- Supabase CLI-managed infrastructure as code
- Vercel deployment configuration
- Dashboards and alerts (ARD-15 §2, Data/API Spec §19)
- Runbooks for KMS/secret failure, provider outage, and crisis-DLQ alert response
- Feature flags (§13)

## 14.5 Security and Privacy Evidence

- Threat model (PRD §10.1)
- Dependency and secret scans
- RLS authorization tests
- Data-flow diagram (ARD-1)
- Retention/deletion evidence
- Privacy invariant test report (Data/API Spec §22)

## 14.6 Release Evidence

- Test reports across §12
- Performance results (Data/API Spec §20)
- Accessibility report (WCAG 2.1 AA)
- Rollback evidence (ARD-15 §3)
- Signed release checklist (PRD §13.2)

# 15. Definition of Ready for an AI Task

- Requirement IDs identified
- Acceptance criteria are testable
- Dependencies available
- Data/API contracts approved
- UX states defined
- Security/privacy implications identified
- Test strategy specified
- No unresolved source conflict

# 16. Definition of Done for an AI Task

- Code implemented
- Tests added and passing
- Contracts preserved
- Security/privacy checks pass
- Observability added
- Documentation updated
- Traceability updated
- Reviewable change produced
- No out-of-scope behaviour introduced

# 17. MVP Release Gate

## Product

- [ ] Onboarding → Companion → Log → Change Signal → Summary core loop passes end to end

## Privacy

- [ ] Consent, export, deletion, and retention pass (Data/API Spec §22–23)

## Safety

- [ ] Adversarial boundary-language suite passes at 100% for release-blocking categories
- [ ] Crisis-flag-first rendering verified across both entry points and the full country-resource set

## Security

- [ ] No critical/high unresolved findings
- [ ] Envelope encryption resolved per ADR-002 (or explicit, signed-off deferral for the internal-dogfood-only stage)

## Quality

- [ ] Mandatory suites pass (§12)
- [ ] Accessibility validated (WCAG 2.1 AA)
- [ ] Performance targets met (Data/API Spec §20)

## Operations

- [ ] Dashboards, alerts, backups, and runbooks verified

## Distribution

- [ ] Invite-only beta access mechanism ready (no app-store distribution required for web MVP)

# 18. Final Acceptance Scenario

```gherkin
Feature: MVP acceptance
  Scenario: A caregiver completes the safe core loop
    Given a newly invited caregiver with no existing SizoCare account
    When they sign up, acknowledge the non-clinical disclaimer, build a Case Profile via the guided questionnaire,
     ask Companion a practical caregiving question, log 10 daily observations over two weeks,
     record 5 medication events, and request a doctor-ready summary
    Then the Companion response contains no unhedged clinical assertion, no dosage recommendation, and correctly
     hedges caregiver-report versus AI interpretation
    And any crisis-indicative test message in the scenario surfaces escalation resources before any other content
    And no data is sent to Gemini without an active, unrevoked consent record
    And the generated summary contains every required section, correctly source-labeled
    And every lifecycle transition (signup, consent grant, document upload, deletion request) has a corresponding
     audit event
```

# 19. Final Instruction to the AI Agent

Build only the approved MVP (§3). Treat the PRD, ARD, and Data/API Specifications as authoritative alongside the mandatory invariants in §4. Do not trade safety, privacy, security, contract compatibility, or data integrity for delivery speed. Report contradictions between source documents explicitly rather than resolving them silently.
