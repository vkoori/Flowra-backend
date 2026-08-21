# 049 — Structured logs redact message bodies, tokens, and external IDs

**Phase:** 8 — Retention, purge, and log redaction · **Priority:** P1 · **Depends on:** none (cross-cutting infrastructure; can and should ship early)
**Access control:** System-internal (no route — a logging-pipeline configuration concern)

## Story

As the business, I want every log line to automatically strip message bodies, tokens,
and external identifiers, so that the most common real-world leak vector — the log
pipeline, not the database — never exposes what it shouldn't.

## Acceptance criteria

```gherkin
Feature: Log redaction

  Scenario: A log call including a raw message body is redacted
    Given application code logs an object containing a rawText/normalizedText field
    When that log line is emitted
    Then the message-body fields are redacted/removed in the actual log output,
      regardless of which code path produced the log line

  Scenario: A log call including an access token is redacted
    Given application code logs an object containing an accessToken/authorization field
    When that log line is emitted
    Then that field is redacted in the output

  Scenario: Redaction applies uniformly, not just to HTTP access logs
    Given a Logger.error() call happens somewhere outside the HTTP request pipeline
      (e.g. inside a BullMQ processor)
    When that error object happens to include a sensitive field
    Then it is redacted exactly the same way an HTTP-access-log line would be —
      the redaction config is not scoped only to Fastify's own request/response logs
```

## Considerations

- **Already partially built this session**: `nestjs-pino`'s redact config in
  `app.module.ts` already covers `req.headers.authorization`, `req.headers.cookie`,
  `*.password`, `*.token`, `*.accessToken`, `*.refreshToken` — and the whole point of
  adopting `nestjs-pino` (replacing Nest's disconnected default `Logger`) was so this
  redaction applies to *every* `Logger.log/error/warn` call, not just Fastify's HTTP
  access logs (CLAUDE.md §4.F.20's own stated reasoning). This task's real remaining
  work is verifying/extending the redact path list to also cover message-body fields
  (`rawText`, `normalizedText`) and external-id-shaped fields, which aren't in the
  current list yet — the mechanism exists, the specific field coverage doesn't yet.
- **Explicit design-doc framing** (§6.12, verbatim): "Log redaction is mandatory... In
  systems of this kind the largest leak is almost always the log pipeline, not the
  database." Treat any gap here as a real security finding, not a style nit.
- **Test this directly, not just by inspection** — write a test that logs an object
  containing a known sensitive value and asserts it does not appear in the captured
  log output, covering at least one call site outside the HTTP pipeline (e.g. a worker/
  job context) to prove the "not just access logs" requirement actually holds.
- **Priority note**: unlike most of Phase 8, this doesn't depend on ingestion/messaging
  existing first — it's pure logging-pipeline configuration and could reasonably ship
  much earlier than its phase number suggests. Kept in Phase 8 here because it's most
  naturally grouped with the other privacy/retention tasks, but nothing blocks pulling
  it forward.
