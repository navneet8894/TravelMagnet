# TravelMagnet implementation status

The reconstructed application provides a runnable Next.js/Express/MongoDB foundation for all requested domains.

## Implemented flows

### Property, verification, media, inventory and pricing foundation

- Typed hotel verification evidence for registration, tax/identity/bank/property documents, map coordinates, property/room/bathroom photos and safety declarations.
- Enforced verification transition matrix, completeness reporting, internal admin review, reasons, re-verification dates, history and evidence-derived badges.
- Expanded room status/capacity/charge fields, duplicate/archive support, controlled facility categories and admin facility updates.
- Multi-file media endpoint with binary-signature, size, count and supported-dimension checks; checksum duplicate detection; source/date/status metadata; primary/order/report/fresh-photo/admin-removal workflows. Blur detection remains explicitly `not_implemented`, so the product makes no AI-verification claim.
- Date inventory adjustment history, allocation invariant checks, concurrency-safe final-room reservation primitive and active-hold expiry release service.
- Backend-only transparent pricing now itemizes nightly price, extra adults/children/beds, meal, cleaning, tourism fee, GST, platform fee, coupon/loyalty discounts, deposit, refundable amount and payable total.
- Owner operational summary includes property/room/inventory counts and verification, photo, price and low-inventory alerts.

### Authentication and authorization foundation

- Verified-email registration gate, strong password schemas, account lockout, generic password recovery, hashed one-time secrets, optional user/mandatory production-admin 2FA, rotating refresh families with reuse detection, token-version invalidation, device session management, fine-grained admin permissions, safe admin update allowlists, account-state errors and expanded audit history.
- Security regression tests cover public role escalation, password/status validation, owner/booking isolation and access-token invalidation.
- Transactional email delivery remains an environment adapter: configure the provider variables documented in `SECURITY.md`; no verification/reset/OTP secret is returned by the API.

- Customer and hotel-owner registration, admin/customer/owner login, rotating refresh sessions, forgot/reset password and account status enforcement.
- Role-protected customer, owner and admin dashboards and resource pages.
- Multi-property owner catalog, dedicated room types, date inventory, blocks, maintenance counters and pricing rules.
- Hotel verification draft/submission/admin approval with badges and audit entries.
- Published/approved hotel search using real room capacity, date inventory and backend price quotes.
- Inventory holds, pay-at-hotel confirmation, Stripe Checkout, signed webhooks, cancellation release and refund records.
- Check-in/check-out lifecycle APIs, verified-stay review eligibility, complaints, notifications, wishlist, coupons, loyalty, referrals, saved trips and experiences.
- Admin users, verification, reports and operational resource views.
- Safe AI conversation service with a structured-search fallback when no provider key is configured.
- Responsive light/dark UI and loading, empty and error states.

## External production services

Set values from `.env.example`. Stripe online payment requires real Stripe keys and a webhook forwarding to `/api/payments/webhook`. AI advanced generation requires a provider adapter/key; without it, the deterministic TravelMagnet-data fallback remains active. Media URLs are supported, while production binary uploads require an object-storage provider.

## Run locally

1. Start MongoDB.
2. Run `npm install`, `npm run seed`, and `npm run dev` in `backend`.
3. Run `npm install` and `npm run dev` in `frontend`.
4. Open `http://localhost:3000`.

Seed credentials are development-only and must never be used in production.
