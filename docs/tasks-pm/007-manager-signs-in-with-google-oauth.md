# 007 — Manager signs in with Google (OAuth)

**Status:** Deferred / Out of MVP

Google Login is intentionally excluded from the MVP.

The approved authentication flow for the MVP is:

**Mobile number → OTP → Authenticate**

Adding Google OAuth is not necessary for the current target market and would make
the authentication experience and backend logic more complex than needed.

A specific complexity in the original story is account matching and merging:
if a Google account email matches an existing Flowra account, the system must decide
whether to automatically link the accounts or require an explicit linking flow.
This introduces additional product decisions, implementation complexity, and security risk.

For the MVP, Flowra should support only mobile-number + OTP authentication.

Google OAuth may be reconsidered in a future phase if there is a clear product need.

This file is retained only to preserve backlog numbering and references.
