# 032 — Manager creates a multi-step conversational flow

**Phase:** 5 — Flows · **Priority:** P1 · **Depends on:** [008](008-manager-connects-a-telegram-bot.md)
**Access control:** Social-network administrator (scoped to the target social account)

## Story

As a manager, I want to define a multi-turn dialogue — ask a question, branch on the
answer, send different follow-ups — so that I can automate conversations more complex
than a single keyword-triggered reply.

## Acceptance criteria

```gherkin
Feature: Create a flow

  Scenario: Successful creation of a flow and its first version
    Given I hold the active AccountTenure for social account "sa-1"
    When I create a flow named "Pricing dialogue" with a graph containing an "ask" step,
      two branches, and two "action" steps
    Then a new Flow is created for "sa-1"
    And a new FlowVersion (version 1) is created holding that graph
    And the graph is not yet validated against a step-type schema beyond basic shape
      checks (see Considerations — the full registry is deferred)

  Scenario: Editing an existing flow creates a new version, not a mutation
    Given flow "flow-1" already has version 1
    When I edit "flow-1"'s graph
    Then a new FlowVersion (version 2) is created
    And version 1 is left completely unchanged — FlowVersion is immutable by design

  Scenario: Graph references a step that doesn't exist
    When I submit a graph whose "entry" points at a step id not defined in "steps"
    Then the request is rejected with a validation error
    And no FlowVersion is created
```

## Considerations

- **This is where the deferred step-type Zod registry (design doc §6.6/§7) actually
  needs to exist** — `FlowVersion.graph` was deliberately left as loosely-typed
  `Record<string, unknown>` in the earlier domain-modeling pass specifically because
  "a registry keyed on step type only earns its keep once the step executor... exists."
  This task and task 033 are exactly that trigger point — building at least the step
  types the design doc names (`send`, `ask`, `branch`, `action`, `handoff`, `end`,
  design doc §6.6) is in scope here.
- **Reuses existing structures rather than inventing new ones** (design doc §6.6,
  "what is reused rather than rebuilt"): `ask` steps' `expects` use the *same* matcher
  structure as rules (task 016's matcher mode/values); `action` steps use the *same*
  ActionRunner registry rules do; `branch` uses the *same* condition tree. Don't build
  a second parallel matcher/action/condition system for flows.
- **Timeout and reprompt bounds are part of the graph itself** (`timeoutSeconds`,
  `onNoMatch.max`, per the design doc's example JSON) — validate these are present and
  sane (e.g. `timeoutSeconds` shorter than the platform's messaging window — see task
  035) at save time, not left to fail at runtime.
- **Immutability is already enforced at the entity level** —
  `FlowVersionRepository.create()` (not `save()`) was built this session specifically
  to make "no update path" obvious; this task's use case must call `create()` for a
  new version, never attempt to mutate an existing one.
