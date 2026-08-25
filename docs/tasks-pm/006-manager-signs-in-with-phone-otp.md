# 006 — Manager signs in with a phone number (SMS OTP)

**Status:** Merged / Superseded by Stories 001 and 002

This story is no longer implemented separately.

The mobile-number + OTP authentication flow described here has been merged into:

- Story 001 — Manager registers with mobile number and OTP
- Story 002 — Manager logs in with mobile number and OTP

The user-facing authentication flow is:

**Mobile number → OTP → Authenticate**

If the mobile number belongs to an existing account, the manager is logged in.
If it does not, a new account is created and the manager is logged in.

This file is retained only to preserve backlog numbering and references.
