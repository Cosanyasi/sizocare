# SizoCare Documentation Suite — Manifest

This manifest accompanies the five SizoCare product-development documents produced from the supplied templates. It lists each file's purpose, the major assumptions made in populating it, and the decisions that still require founder, clinical, legal, or security input before implementation begins.

## 1. Files Produced

| File | Purpose |
|---|---|
| `SizoCare_PRD.md` | Product Requirements Document. Vision, personas, evidence/hypotheses, MVP/V1/roadmap scope, 10 full feature-requirement blocks (FR-AUTH, FR-CASE, FR-DOC, FR-COMPANION, FR-LOG, FR-SYMPTOM, FR-MED, FR-CHANGE, FR-SUMMARY, FR-CRISIS), user journeys, UX direction, trust/safety/privacy/compliance, monetisation, metrics, rollout plan, 12 open questions, requirement traceability table. |
| `SizoCare_Architecture_Requirements.md` | Architecture Requirements Document suite (ARD-1 through ARD-16 plus Appendix A). Translates the PRD into a concrete architecture on Next.js + Expo/React Native + Supabase, with 2 filled Architecture Decision Records (RLS as the primary authorization boundary; envelope-encryption timing). |
| `SizoCare_Data_API_Specifications.md` | Normative data and API contract: 13 canonical entity schemas (with SQL DDL and RLS policy notes), 7 public API endpoints, 2 internal service contracts, 6 event contracts, authorization model, error catalogue, retention/deletion rules, and MVP/Later feature-flag boundary. |
| `SizoCare_MVP_Implementation_Plan.md` | Implementation-ready build plan: 5 mandatory product invariants, technical baseline, 10 ordered implementation phases (Phase 0–9) each with functional/technical requirements, UX states, required tests, and a completion gate; mandatory test suite; feature flags; MVP release gate; final acceptance scenario. |
| `SizoCare_AI_Agent_Instructions.md` | Operating instructions for AI engineering agents building SizoCare: agent roles (including a SizoCare-specific Clinical Safety & Caregiving Domain Agent), source-of-truth precedence, engineering/coding/repo/git standards, implementation workflow, SizoCare-specific AI prohibitions (no diagnosis, no medication changes, no delusion validation, no covert-medication guidance, prompt-injection defense against uploaded documents), Definition of Ready/Done, and failure-handling rules. |
| `SizoCare_Manifest.md` | This file. |

## 2. Major Assumptions Made

These were not explicitly specified in the founder's brief or templates and were filled in as clearly labelled, reasonable defaults so the documents could be implementation-ready rather than left as placeholders. Each is also recorded as a Decision Log entry (PRD §1.3, DL-001–DL-004) or an ADR (ARD Appendix A) where architecturally significant.

- **Technology stack**: Next.js (web, MVP) + Expo/React Native (mobile, deferred to V1) + a single dedicated Supabase project (Postgres + pgvector, Auth, Storage, Edge Functions, Realtime), matching the stack already standardized across the founder's other product bets rather than the generic gRPC/microservice-mesh pattern in the source templates.
- **Authorization boundary**: Postgres Row Level Security is treated as the primary, database-enforced authorization mechanism (ADR-001), replacing the templates' generic service-mesh/mTLS model. Internal service-to-service calls use authenticated HTTPS/JSON, not gRPC.
- **Async processing**: `pgmq` (Postgres queue extension) plus Supabase Database Webhooks stand in for the templates' generic Kafka/SQS/NATS event bus.
- **Launch market and regulatory reference**: India, with the DPDP Act 2023 as the primary regulatory anchor. HIPAA and GDPR are noted as future considerations, not treated as currently applicable or claimed as compliant.
- **MVP collaboration model**: single-caregiver-owner only. Multi-caregiver collaboration is designed at the data-model level (roles, permissions, invitations) but is explicitly excluded from the MVP build (DL-003).
- **Change detection method**: rule/threshold-based comparison against the individual's own historical baseline, not a machine-learning model, chosen specifically for explainability and to avoid presenting statistical pattern-matching as clinical inference (DL-004).
- **Entity consolidation**: the founder brief's separately listed `CaseProfile`/`StoryEntry`/`ExtractedFact` entities were consolidated into a single `case_facts` table with `fact_type` and provenance columns; `SymptomObservation` was folded into `daily_logs`; `SideEffectObservation` was folded into `medication_events`. This is a documented simplification for MVP schema manageability, not a silent scope reduction — all the same information is captured, with narrower normalization.
- **Envelope encryption timing**: application-level envelope encryption of Restricted-class data (diagnosis, story narrative, uploaded documents) is specified as release-blocking for any public launch, but is allowed to be deferred during an internal-dogfood-only stage, pending a security review sign-off (ADR-002).
- **Crisis resources**: the MVP default crisis-resource set (Tele-MANAS 14416, KIRAN 1800-599-0019, emergency 112) is carried over from the reference prototype as the India-market default. The architecture requires these to be country-configurable, not hard-coded, before any non-India launch.
- **AI provider**: Gemini API is the sole MVP provider, called only server-side through an Edge Function proxy, behind a provider-abstraction interface so BYOK and additional providers can be added later without a rearchitecture.
- **Payment processor**: not selected in the documents (flagged as an open decision below); ARD-10 describes the billing domain architecture generically so a processor can be slotted in once chosen.

## 3. Unresolved Decisions Requiring Founder, Clinical, Legal, or Security Input

These are carried through from PRD §14 (Open Questions OQ-001–OQ-012) plus two additional items surfaced during architecture and implementation planning. None of these were invented an answer to — they are structured as open items precisely because the brief asked that they not be guessed at.

| ID | Question | Needs input from |
|---|---|---|
| OQ-001–OQ-012 | See `SizoCare_PRD.md` §14 in full: legal ownership/management of the care-recipient profile; what consent is required from the care recipient; whether caregivers can create profiles without patient consent in each target jurisdiction; what information may be shared among multiple future caregivers; what is sent to and retained by third-party AI providers; which messaging integrations meet the required privacy model; what clinical review process is required before launch; whether any planned feature creates medical-device/regulatory implications; behaviour when AI providers are unavailable; how incorrect extracted facts get corrected; how conflicting caregiver reports are represented; how crisis escalation should vary by country. | Founder, clinical advisor, legal counsel (jurisdiction-dependent) |
| — | **Envelope-encryption timing** (ADR-002): whether Restricted-class data must be encrypted at the application level from day one of internal dogfooding, or only before public launch. | Security reviewer |
| — | **Payment processor selection** for the Paid tier (ARD-10 leaves this open; a India-focused processor such as Razorpay is a plausible MVP candidate but was not assumed as a decision). | Founder |

## 4. How to Use These Documents

Read in this order: PRD → Architecture Requirements → Data/API Specifications → MVP Implementation Plan → AI Agent Instructions. The AI Agent Instructions document is written to be handed directly to an AI coding agent (or engineering team) as its operating brief, and defers to the other four for all specific requirements, contracts, and sequencing. Requirement IDs (FR-*, ARD-*, AC-*) are consistent across all five files for traceability.
