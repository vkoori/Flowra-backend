# 018 — System matches an inbound event against a social account's rules

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P0 · **Depends on:** [014](014-system-ingests-a-comment-webhook.md), [016](016-manager-creates-a-comment-reply-rule.md)
**Access control:** System-internal (BullMQ job triggered by ingestion)

## Story

As the system, when a new inbound event arrives, I want to evaluate it against the
relevant social account's enabled rules in priority order and create pending
executions for the ones that match, so that the right automations actually fire.

## Acceptance criteria

```gherkin
Feature: Rule matching

  Scenario: A matching, enabled rule creates a pending execution
    Given social account "sa-1" has an enabled rule matching comments containing "price"
    When an InboundEvent of type "comment_created" with text "what's the price?" arrives for "sa-1"
    Then the rule's matcher and conditions are evaluated
    And a pending Execution is created for each of the rule's actions, in order,
      with the correct originType "rule" and originId set to the rule's id

  Scenario: A disabled rule never matches
    Given social account "sa-1" has a disabled rule that would otherwise match
    When a matching InboundEvent arrives
    Then no Execution is created for that rule

  Scenario: Non-matching text creates no execution
    Given social account "sa-1" has a rule matching comments containing "price"
    When an InboundEvent with text "hello there" arrives
    Then no Execution is created

  Scenario: Multiple matching rules by priority
    Given social account "sa-1" has two enabled rules that both match the same event,
      with priorities 10 and 5
    When the matching InboundEvent arrives
    Then both rules produce executions
    And their relative ordering/scheduling reflects priority (higher priority first)

  Scenario: Post-scoped comment rule only matches comments on the right posts
    Given a rule has trigger scope postIds ["post-1"]
    When a comment event arrives on "post-2"
    Then that rule does not match, regardless of text content
```

## Considerations

- **Matching runs in memory, never as a JSONB SQL query** — design doc §7, stated as an
  explicit anti-pattern to avoid: "Pushing rule evaluation into SQL leaks domain logic
  into the database and is the easiest way to ruin this design." Rules for a social
  account are loaded and cached in memory, then evaluated against the event in
  application code.
- **This is the RuleMatcher** named in the design doc's module map (`automation: Rule,
  RuleMatcher, Execution`) — the piece explicitly deferred during the earlier
  domain-modeling session ("do NOT implement the actual rule-matching engine"). This
  task is where that deferred engine gets built.
- **Text matching uses `normalized_text`, not `raw_text`** — design doc §10: "Matching
  runs only on the normalised form... otherwise a manager typing Arabic ي will never
  match a user typing Persian ی." The same `normalizeText()` version must be applied to
  rule values at *save* time (task 016) as to inbound text at *ingestion* time (task
  014) — a mismatch between normalizer versions on either side silently breaks matches.
- **Conditions are evaluated here too** (cooldown, business hours, follower-check) —
  but per-author cooldown (task 019) and self-authorship exclusion (task 020) are split
  out as their own tasks since they're specific, independently-testable condition types
  the design doc calls out by name; this task covers the general matcher +
  generic-condition-tree evaluation loop they plug into.
- **One Execution per action, not one per rule** — design doc §5's unique constraint is
  `(originType, originId, eventId, actionIndex)`, confirming multiple actions on one
  rule become multiple Execution rows.
- **Transactional outbox**: the InboundEvent and its resulting pending Executions must
  be written in one transaction (design doc §9.2) — the dispatcher (task 022) publishes
  afterward, never in the same transaction.
