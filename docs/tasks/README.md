# Task backlog

Derived from [`docs/social-assistant-design-v2.md`](../social-assistant-design-v2.md),
decomposed into small, independently-shippable user stories, one per file. Not every
story below is explicit in the design doc — stories the doc assumes but never states
(registration, login, viewing a list) were written by inference from the domain model
and are marked **(inferred)** in their task file.

File numbers are priority order — lower number ships first. Numbering follows the
design doc's own build order (§12) with the missing identity/access-control phase
inserted at the front, since nothing else is reachable without it.

## Decisions locked in before writing these tasks

Open questions the design doc doesn't answer, resolved before writing the affected
tasks (see each task's Considerations for where they matter):

- **Auth methods**: email+password, phone number (SMS OTP), and OAuth (e.g. Google),
  all issuing a **JWT**. Phone and OAuth require schema additions not yet present
  (see tasks 006/007).
- **Access control**: every route in this backlog is tagged with exactly one of three
  levels — **Public** (no auth), **Social-network administrator** (the user holding
  the active `AccountTenure` for the target social account — scoped to that account
  only), or **System administrator** (a platform-wide staff role, unrelated to any one
  social account). Enforced via **RBAC** (task 003) — a role claim in the JWT checked
  by a route guard, not per-endpoint ad hoc checks.
- **Telegram connection**: bot-token paste (manager creates a bot via `@BotFather`,
  pastes the token; we call `getMe` to resolve identity), not an OAuth redirect —
  Telegram has no OAuth flow for bots, unlike Instagram.
- **Subscription activation**: gated behind the System administrator role, with real
  endpoints and Gherkin like everything else — not an out-of-band ops action.
- **Scope boundary**: assistant/LLM-dependent stories (knowledge ingestion, product
  Q&A, LLM-assisted moderation) are excluded entirely, matching the modules already
  built this session. If/when that changes, those stories resume at design doc §6.8/§6.9.

## Out of scope for this backlog

- `assistant` module and anything LLM-dependent (see above).
- The unofficial connector and its isolation/proxy strategy (design doc §11 — accepted
  in principle, not designed; build-order item 9, deliberately last).
- Payment gateway integration (design doc §11, explicitly undecided) — entitlement
  tasks below assume System-administrator manual activation only.
- Rule/flow builder UX (design doc §11, explicitly out of scope for the design doc itself).

## Phase 0 — Identity & access control (inferred; prerequisite for everything else)

| # | Task | Priority | Access |
|---|---|---|---|
| [001](001-manager-registers-with-email-and-password.md) | Manager registers with email and password | P0 | Public |
| [002](002-manager-logs-in-with-email-and-password.md) | Manager logs in with email and password (JWT issuance) | P0 | Public |
| [003](003-system-enforces-rbac-across-routes.md) | System enforces RBAC across public / social-network-admin / system-admin routes | P0 | System-internal |
| [004](004-manager-logs-out.md) | Manager logs out | P0 | Social-network administrator |
| [005](005-manager-resets-a-forgotten-password.md) | Manager resets a forgotten password | P0 | Public |
| [006](006-manager-signs-in-with-phone-otp.md) | Manager signs in with a phone number (SMS OTP) | P1 | Public |
| [007](007-manager-signs-in-with-google-oauth.md) | Manager signs in with Google (OAuth) | P1 | Public |

## Phase 1 — Accounts & Channels (design doc build order #1)

| # | Task | Priority | Access |
|---|---|---|---|
| [008](008-manager-connects-a-telegram-bot.md) | Manager connects a Telegram bot to a social account | P0 | Social-network administrator |
| [009](009-system-probes-connection-capabilities.md) | System probes and stores a connection's capabilities on connect | P0 | System-internal |
| [010](010-manager-views-connected-accounts.md) | Manager views their connected social accounts | P1 | Social-network administrator |
| [011](011-manager-disconnects-a-channel-connection.md) | Manager disconnects a channel connection | P1 | Social-network administrator |
| [012](012-system-refreshes-an-access-token.md) | System refreshes an access token ahead of expiry | P1 | System-internal |
| [013](013-system-parks-executions-on-reauth-needed.md) | System parks executions and notifies the manager on auth failure | P1 | System-internal |

## Phase 2 — Ingestion + Automation + Dispatch (the spine — design doc build order #2)

| # | Task | Priority | Access |
|---|---|---|---|
| [014](014-system-ingests-a-comment-webhook.md) | System ingests an inbound comment webhook idempotently | P0 | Public |
| [015](015-system-ingests-a-direct-message.md) | System ingests an inbound direct message into a conversation | P0 | Public |
| [016](016-manager-creates-a-comment-reply-rule.md) | Manager creates a rule that replies to a matching comment | P0 | Social-network administrator |
| [017](017-manager-creates-a-dm-reply-rule.md) | Manager creates a rule that replies to a matching direct message | P0 | Social-network administrator |
| [018](018-system-matches-an-event-against-rules.md) | System matches an inbound event against a social account's rules | P0 | System-internal |
| [019](019-system-enforces-per-author-cooldown.md) | System enforces a per-author cooldown before creating an execution | P0 | System-internal |
| [020](020-system-ignores-self-authored-events.md) | System ignores events authored by the managed account itself | P0 | System-internal |
| [021](021-manager-enables-or-disables-a-rule.md) | Manager enables or disables a rule | P1 | Social-network administrator |
| [022](022-system-dispatches-within-rate-limit.md) | System dispatches a pending execution within a connection's rate limit | P0 | System-internal |
| [023](023-system-retries-and-dead-letters-executions.md) | System retries a failed execution and dead-letters it after exhausting attempts | P0 | System-internal |
| [024](024-system-opens-a-circuit-breaker.md) | System opens a circuit breaker for a connection after repeated failures | P1 | System-internal |
| [025](025-manager-views-execution-log.md) | Manager views the execution log for a rule | P1 | Social-network administrator |

## Phase 3 — Instagram official adapter (design doc build order #3)

| # | Task | Priority | Access |
|---|---|---|---|
| [026](026-manager-connects-instagram-via-oauth.md) | Manager connects an Instagram account via OAuth | P1 | Social-network administrator |

## Phase 4 — Entitlement (design doc build order #4)

| # | Task | Priority | Access |
|---|---|---|---|
| [027](027-admin-activates-a-subscription.md) | Admin activates a subscription for a social account | P1 | System administrator |
| [028](028-system-blocks-execution-without-subscription.md) | System blocks automation execution when there's no active subscription | P1 | System-internal |
| [029](029-system-disables-automations-on-expiry.md) | System disables rules/flows (without deleting them) when a subscription expires | P1 | System-internal |
| [030](030-system-closes-flow-sessions-on-expiry.md) | System closes live flow sessions neutrally when a subscription expires | P1 | System-internal |
| [031](031-system-restores-automations-on-renewal.md) | System restores rules/flows automatically when a subscription is renewed | P1 | System-internal |

## Phase 5 — Flows (design doc build order #5)

| # | Task | Priority | Access |
|---|---|---|---|
| [032](032-manager-creates-a-multi-step-flow.md) | Manager creates a multi-step conversational flow | P1 | Social-network administrator |
| [033](033-system-advances-a-flow-session.md) | System advances a flow session when a reply matches an expected answer | P1 | System-internal |
| [034](034-system-reprompts-then-hands-off.md) | System reprompts a bounded number of times then hands off | P1 | System-internal |
| [035](035-system-times-out-a-flow-session.md) | System times out an abandoned flow session | P1 | System-internal |
| [036](036-system-serializes-concurrent-flow-messages.md) | System serializes concurrent messages to the same conversation | P1 | System-internal |
| [037](037-flow-session-pins-its-flow-version.md) | A running flow session keeps its pinned flow version when the flow is edited | P1 | System-internal |
| [038](038-manager-exits-a-flow-via-escape-keyword.md) | Manager exits an active flow via an escape keyword | P2 | Public (end customer, not the manager) |

## Phase 6 — Ownership transfer (design doc build order #6)

| # | Task | Priority | Access |
|---|---|---|---|
| [039](039-new-manager-claims-an-owned-account.md) | New manager claims a social account already owned by someone else | P2 | Social-network administrator |
| [040](040-current-owner-notified-with-objection-window.md) | Current owner is notified of a claim and given an objection window | P2 | System-internal |
| [041](041-current-owner-approves-or-objects.md) | Current owner approves or objects to a pending claim | P2 | Social-network administrator |
| [042](042-configuration-does-not-carry-over.md) | Configuration does not carry over to a new owner without explicit consent | P2 | System-internal |
| [043](043-every-transfer-decision-is-audited.md) | Every ownership decision is written to an immutable audit log | P2 | System-internal |

## Phase 7 — Moderation, deterministic layer only (design doc build order #7)

| # | Task | Priority | Access |
|---|---|---|---|
| [044](044-system-runs-deterministic-abuse-checks.md) | System runs deterministic checks on a comment and records a moderation decision | P2 | System-internal |
| [045](045-system-auto-hides-a-flagged-comment.md) | System auto-hides a flagged comment when the connection supports it | P2 | System-internal |
| [046](046-manager-approves-or-restores-a-decision.md) | Manager approves or restores a moderation decision | P2 | Social-network administrator |

## Phase 8 — Retention, purge, and log redaction (design doc §6.12, cross-cutting)

| # | Task | Priority | Access |
|---|---|---|---|
| [047](047-scheduled-purge-of-message-bodies.md) | Scheduled job purges message bodies past their retention TTL | P2 | System-internal |
| [048](048-scheduled-null-of-platform-user-id.md) | Scheduled job nulls a platform user ID once its conversation closes | P2 | System-internal |
| [049](049-logs-redact-sensitive-fields.md) | Structured logs redact message bodies, tokens, and external IDs | P1 | System-internal |
