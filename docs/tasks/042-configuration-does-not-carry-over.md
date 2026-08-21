# 042 — Configuration does not carry over to a new owner without explicit consent

**Phase:** 6 — Ownership transfer · **Priority:** P2 · **Depends on:** [041](041-current-owner-approves-or-objects.md)
**Access control:** Social-network administrator (the current owner, as part of approving a transfer)

## Story

As the current owner approving a transfer, I want my rules, flows, and knowledge to
stay private by default rather than automatically handed to the new owner, so that my
business logic and configuration aren't given away just because someone else claimed
the page.

## Acceptance criteria

```gherkin
Feature: Configuration carry-over on transfer

  Scenario: Default is no carry-over
    Given I am approving a transfer for social account "sa-1"
    When I approve it without explicitly opting to carry over configuration
    Then "sa-1"'s existing rules, flows, and knowledge sources are archived, not handed
      to the new owner
    And the new owner starts with a clean slate for configuration

  Scenario: Explicit consent carries configuration over
    Given I am approving a transfer for social account "sa-1"
    When I explicitly opt to carry over configuration
    Then "sa-1"'s rules/flows/knowledge remain attached and usable by the new owner

  Scenario: Conversational data never carries over, regardless of choice
    Given social account "sa-1" has existing conversations/messages/moderation decisions
      tied to the outgoing owner's tenure
    When the transfer completes, with or without configuration carry-over
    Then that conversational data remains scoped to the closed tenure and is never
      visible to the new owner (design doc §4's data ownership boundary — tenure-scoped
      data "never" transfers, no exception)
```

## Considerations

- **This encodes design doc §4's ownership-boundary table directly**: "Configuration —
  rules, flows, knowledge sources... Only with explicit consent at transfer time;
  default no" vs. "Conversational data... tenure_id... Never." The distinction between
  these two data classes is the single most important thing to get right in this task
  — conflating them (e.g. accidentally carrying over conversations because
  configuration carry-over was granted) would be a real privacy breach, per the design
  doc's own reasoning: "direct messages contain the personal data of third parties who
  spoke to a *different business*. Handing them to the next owner is a privacy breach,
  not a feature."
- **"Archived, not deleted"**: design doc §6.3's sequence diagram says "archive A's
  rules, flows, knowledge" when not carried over — archiving, not hard-deleting,
  preserves the outgoing owner's data in case of a dispute (ties into task 043's audit
  trail being what "settles the dispute when two customers claim the same page").
- **Knowledge sources are explicitly out of scope for this backlog** (assistant/LLM
  module excluded) — this task's Gherkin mentions them for completeness against the
  design doc's own wording, but the actual carry-over/archival mechanism for knowledge
  sources can't be built until that module exists. Rules and flows are fully in scope
  now and should be the actual deliverable.
