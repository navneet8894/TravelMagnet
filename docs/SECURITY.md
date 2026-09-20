# TravelMagnet authentication and authorization

## Implemented controls

- Public registration accepts only `user` or `vendor`; administrator creation is never public.
- Passwords require 10–128 characters with upper/lowercase letters and a number, and are hashed with bcrypt cost 12.
- Email verification tokens, password-reset tokens, OTPs, and refresh tokens are stored only as SHA-256 hashes.
- Password recovery always returns a generic response and never returns a reset token.
- Five failed password attempts lock an account for 15 minutes. Authentication routes also have IP rate limits.
- Access JWTs are short-lived and carry a token-version claim. Password reset, token reuse, and “sign out all” invalidate old access tokens.
- Refresh tokens rotate on every use. Reuse revokes the complete token family.
- Production administrators require a six-digit second factor; other accounts can opt into it.
- Account status and owner approval are checked on every protected request.
- Administrator routes support named permissions. A legacy admin without an assigned `AdminRole` remains a super-admin for migration compatibility; the security seed assigns the explicit system role.
- Sensitive status/role operations use allowlisted fields and require a reason. Audit records capture actor, role, IP, user agent, outcome, previous state, next state, and reason.
- State-changing browser requests are rejected when their `Origin` is outside `CLIENT_URL`.

## Email delivery adapter

The API never exposes verification, reset, or OTP secrets. Configure `EMAIL_PROVIDER_URL` and `EMAIL_PROVIDER_API_KEY` for the deployment's transactional-email adapter. Until a provider is connected, authentication notifications remain queued records and newly registered users cannot complete email ownership proof. Seed accounts are explicitly verified for local development.

## Session API

- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/:id`
- `DELETE /api/auth/sessions/all`

## Administrator permissions

Supported permission names currently include `users.read`, `users.status`, `roles.read`, `roles.manage`, `roles.assign`, `reports.read`, `content.read`, `content.manage`, `growth.manage`, `fraud.read`, `fraud.manage`, `audit.read`, `media.moderate`, `payouts.manage`, and `hotels.review`. The wildcard `*` is reserved for the system Super Admin role.
