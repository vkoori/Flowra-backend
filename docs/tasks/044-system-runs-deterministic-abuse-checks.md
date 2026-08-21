# 044 — System runs deterministic checks on a comment and records a moderation decision

**Phase:** 7 — Moderation, deterministic layer only · **Priority:** P2 · **Depends on:** [014](014-system-ingests-a-comment-webhook.md)
**Access control:** System-internal

## Story

As the system, I want to run cheap, deterministic abuse checks (blocklist, links,
repetition) on every inbound comment and record a scored decision, so that obviously
abusive content can be flagged or hidden without waiting on (or paying for) an LLM
call.

## Acceptance criteria

```gherkin
Feature: Deterministic moderation checks

  Scenario: A comment matching the blocklist is flagged
    Given a blocklist contains the word "scam"
    When an InboundEvent's normalized text contains "scam"
    Then a ModerationDecision is created with state "pending", a score, and reasons
      including which check(s) fired

  Scenario: A comment with excessive repetition is flagged
    Given a comment's text is the same word repeated an excessive number of times
    When it is checked
    Then a ModerationDecision is created flagging it for repetition

  Scenario: A clean comment produces no moderation decision at all
    Given a comment's text triggers no deterministic check
    Then no ModerationDecision is created for it — clean content doesn't get a
      "pending, score 0" row cluttering the review queue

  Scenario: Reasons and score are always populated together
    Given any ModerationDecision is created by this deterministic layer
    Then its `reasons` array is non-empty and its `score` reflects why it was flagged
      (design doc §6.7: "the stored score and reasons are what let the manager tune
      the threshold — without them the threshold is guesswork forever")
```

## Considerations

- **LLM classifier is explicitly excluded from this backlog** (per the earlier scope
  decision) — design doc §6.7's sequence diagram includes an "uncertain → LLM
  classifier" branch that this task does NOT implement; this task covers only the
  deterministic pre-filter. The `ModerationDecision` entity itself (already built) has
  no notion of "which layer produced this decision," which is fine since only one
  layer exists right now.
- **This is still "just a rule" per the design doc's own framing** (§6.7, last line):
  "matcher.mode = 'any'`, condition `content.is_abusive`, action `platform.hide_comment`.
  No separate subsystem." Consider implementing the deterministic checks as condition
  types within the *same* condition-tree engine built for task 018, rather than a
  parallel bespoke moderation pipeline — reduces the amount of genuinely new
  infrastructure this task needs.
- **Blocklist source/management isn't specified** — is it global, per social account,
  or manager-editable? Not addressed in the design doc; a reasonable MVP default is a
  single global blocklist with no management UI yet, documented as a placeholder.
- **What exactly counts as "deterministic"**: blocklist match and repetition are
  clearly rule-based; "links" detection (flagging comments containing URLs) is also
  purely deterministic (regex) and explicitly named in the design doc's own §6.7 list
  — all three should ship together in this task, not split further.
