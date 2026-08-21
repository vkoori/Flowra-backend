# 014 — System ingests an inbound comment webhook idempotently

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P0 · **Depends on:** [008](008-manager-connects-a-telegram-bot.md), [009](009-system-probes-connection-capabilities.md)
**Access control:** Public (the platform calls this, not an end user or manager)

## Story

As the system, I want to receive a platform's webhook for a new comment, normalize it,
and record it exactly once even if the platform redelivers it, so that downstream
automation never double-fires on a duplicate delivery.

## Acceptance criteria

```gherkin
Feature: Idempotent comment webhook ingestion

  Scenario: First delivery is accepted and recorded
    Given a platform sends a webhook for a new comment with external id "ext-42"
    When the webhook is received and its signature verified
    Then the raw and normalized text are computed and stored
    And an InboundEvent is inserted with dedupeKey "telegram:sa-1:comment_created:ext-42"
    And the response is 200 OK within roughly 200ms

  Scenario: Redelivery of the same webhook is a no-op
    Given an InboundEvent already exists with dedupeKey "telegram:sa-1:comment_created:ext-42"
    When the same webhook is delivered again
    Then the insert is rejected by the unique constraint on dedupeKey
    And no second InboundEvent is created
    And the response is still 200 OK (never signal an error back to the platform for a duplicate)

  Scenario: Invalid signature is rejected
    Given a webhook payload whose signature does not verify against the connection's secret
    When the webhook is received
    Then the request is rejected before any InboundEvent is created
    And the response is not 200 OK

  Scenario: No active subscription still returns 200 but creates no downstream work
    Given social account "sa-1" has no active subscription (see task 028)
    When a comment webhook arrives for "sa-1"
    Then the response is still 200 OK
    And no Execution is ever created for this event (though the InboundEvent itself may
      still be recorded — see Considerations)
```

## Considerations

- **Idempotency key**: `dedupeKey = platform:accountId:type:externalId` exactly as
  specified in design doc §9.1 — built via the existing `buildDedupeKey()` helper
  (`shared/domain/idempotency/`), which hashes a sorted attribute bag; pass
  `{platform, accountId, type, externalId}` as the attributes.
  the `inbound_events.dedupe_key` column already carries the unique constraint.
- **Must respond fast**: design doc §6.4 explicitly calls out "must return within
  ~200ms" — signature verification and the insert must happen synchronously in the
  webhook handler, but nothing else (matching, dispatch) — those happen downstream via
  the matcher job, not inline in the webhook response path.
- **Returning 200 on failure paths that aren't really failures** (duplicate,
  no-subscription) is deliberate per design doc §6.4's own failure-path table:
  "Returning an error would make the platform disable the webhook permanently."
  Never let an internal business rule (no subscription) leak into an HTTP error status
  the platform sees.
- **Text normalization happens here, at ingestion time** — `raw_text` and
  `normalized_text` both stored (design doc §10), using the already-built
  `normalizeText()` (`shared/domain/text-normalisation/`), version-stamped via
  `normalizerVersion`.
- **Whether to still write the InboundEvent row when there's no active subscription**
  is an open product decision — recording it preserves history/audit value even though
  no automation fires; discarding it entirely saves storage. Design doc doesn't say
  explicitly; default to still recording it (cheap, reversible, and useful if the
  manager later asks "did you even receive my customer's message?").
- **Depends on the Telegram connector's `verifyWebhook()`/`normalize()`** (design doc
  §8's `PlatformAdapter` interface) — same connector-adapter dependency as task 008.
