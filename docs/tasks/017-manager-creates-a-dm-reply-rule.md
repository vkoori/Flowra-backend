# 017 — Manager creates a rule that replies to a matching direct message

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P0 · **Depends on:** [016](016-manager-creates-a-comment-reply-rule.md)
**Access control:** Social-network administrator (scoped to the target social account)

## Story

As a manager, I want to configure a rule that automatically replies when a direct
message matches a keyword, so that customers messaging me directly get an instant
response too, not just public commenters.

## Acceptance criteria

```gherkin
Feature: Create a DM-reply rule

  Scenario: Successful creation
    Given I hold the active AccountTenure for social account "sa-1"
    When I create a rule with trigger "dm_received", matcher mode "contains",
      matcher values ["hours", "open"], and one action "platform.send_message"
    Then a new Rule is created, enabled by default, scoped to "sa-1", with no post scope
      (post scope only applies to comment triggers)

  Scenario: Trigger scope is rejected for a DM rule
    When I try to create a "dm_received" rule with a postIds trigger scope set
    Then the request is rejected with a validation error — postIds only makes sense for
      "comment_created" triggers
```

## Considerations

- **Same mechanics as task 016** — this task exists separately only because
  `trigger.type = 'dm.received'` has a real behavioral difference worth its own
  acceptance criteria: no `postIds` scope (design doc §6.5: "identical to 6.4... with no
  post scope"). Reuse the same use case/validation built for task 016 rather than
  duplicating it — parameterize by trigger type instead of writing a second code path.
  Consider merging this into 016's implementation once building starts, even though
  they're listed as separate backlog stories here.
- **Everything else** (capability checks, Zod validation, ownership scoping) is
  identical to task 016 — see that task's Considerations.
