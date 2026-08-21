# 007 — Manager signs in with Google (OAuth)

**Phase:** 0 — Identity & access control (inferred) · **Priority:** P1 · **Depends on:** [001](001-manager-registers-with-email-and-password.md) (schema), [002](002-manager-logs-in-with-email-and-password.md), [003](003-system-enforces-rbac-across-routes.md)
**Access control:** Public

## Story

As a manager, I want to sign in with my Google account, so that I don't need to create
or remember a separate password for Flowra.

## Acceptance criteria

```gherkin
Feature: Google OAuth sign-in

  Scenario: First-time sign-in creates an account
    Given no user exists linked to Google account "amir@gmail.com"
    When I complete the Google OAuth flow successfully
    Then a new user is created, linked to that Google account
    And I receive a signed JWT access token

  Scenario: Returning sign-in logs in the existing linked user
    Given a user already exists linked to Google account "amir@gmail.com"
    When I complete the Google OAuth flow successfully
    Then I receive a signed JWT access token for that existing user
    And no duplicate user is created

  Scenario: Google account email matches an existing password-based account
    Given a user already exists registered with email "amir@gmail.com" via password (task 001)
    And that user has never linked a Google account
    When I complete Google OAuth with a Google account whose email is "amir@gmail.com"
    Then [OPEN QUESTION — see Considerations: auto-link, or reject and ask the user to
      log in with a password first and link Google from settings?]

  Scenario: OAuth flow fails or is cancelled
    When the Google OAuth flow fails or I cancel it partway through
    Then no user is created and no token is issued
    And I'm returned to the sign-in page with a generic error
```

## Considerations

- **Schema addition required**: linking a `User` to a Google account needs storage for
  the external identity — a `provider`/`providerAccountId` pair, most cleanly a new
  small table (e.g. `oauth_identities: userId, provider, providerAccountId, createdAt`,
  unique on `(provider, providerAccountId)`) rather than adding Google-specific columns
  directly to `User`, so a second OAuth provider later doesn't require another
  migration. Owned by `identity`.
- **Open question flagged in the scenario above**: what happens when a Google sign-in's
  email matches an *existing* password-registered account that never linked Google?
  Silently auto-linking is convenient but has a real security implication (anyone who
  controls that Gmail address — which might not be the original registrant if the email
  was later compromised or reassigned — could take over the Flowra account). The safer
  default is to require the user to log in with their existing method first and link
  Google explicitly from an account-settings screen, not merge automatically on
  sign-in. **This needs a decision before implementation** — flagging rather than
  guessing.
- **This is a different mechanism from Telegram's bot-token connection (task 008)** —
  Google OAuth here authenticates the *manager* into Flowra; it has nothing to do with
  *connecting a social account* to automate. Don't conflate the two, even though both
  involve "OAuth" as a word.
- **Token/secret handling**: Google client secret is a real credential — store via
  config/env, never commit, never log (same discipline as encryption keys already
  established in this repo).
