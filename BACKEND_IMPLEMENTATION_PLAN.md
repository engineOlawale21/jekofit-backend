# Jekofit Backend Implementation Plan

This document is the backend source of truth for the supplied Jekofit screens. It records the required API contract, what is implemented today, and the order in which remaining work should be delivered. A checked item means the backend code exists and is covered by the current contract; it does not imply that every frontend state is complete.

## Principles

- Keep pricing, tax, delivery charges, stock checks, order creation, and payment verification server authoritative.
- Treat a paid custom-design snapshot as immutable production data.
- Scope every account, cart, design, favourite, checkout, payment, and order lookup to its owner.
- Use DTO validation, rate limits, transactions, idempotency, and explicit status values at external boundaries.
- Add schema changes through reviewed TypeORM migrations. Production must never use schema synchronization.
- Preserve existing endpoint paths while adding missing capabilities so the current frontend is not broken.

## Screen contract matrix

### Authentication and account

- [x] Register, login, refresh, logout, password reset, OAuth, and current-user endpoints.
- [x] Read/update personal information.
- [x] Change password and verify email.
- [x] Read and update newsletter preferences.
- [ ] Persist multiple saved delivery addresses.
- [ ] Add a consent audit history.

### Catalogue and product details

- [x] List/search products by category and sort by newest/name.
- [x] Read products by slug or legacy ID with active variants.
- [x] Price/colour/size/tag filters and price sorting.
- [x] Curated collections for New & Trending, inspirations, and Design Specials.
- [x] Related-product recommendations and a default size-guide contract.
- [ ] Cursor pagination and admin-managed collection/size-guide persistence.

### Favourites

- [x] List, add, and remove a user's product favourites.
- [ ] Optional anonymous favourites and merge-on-login.

### Custom designs and My Designs

- [x] List, create, update, delete, and read a design.
- [x] Duplicate an existing design.
- [x] Query asynchronous render status.
- [x] Upload and process product assets.
- [ ] Replace the loose canvas object with a versioned layer/surface document.
- [ ] Persist preview/export URLs and design versions.
- [ ] Add export generation and version restore.

### Cart

- [x] Read cart; add, update, and remove standard or custom-design items.
- [x] Recheck active variants, ownership, quantity, and stock.
- [x] Preserve a design snapshot on the cart line.
- [x] Clear the cart and atomically repopulate it from an owned previous order.
- [ ] Guest carts and merge-on-login.
- [ ] Move-to-favourites command.
- [ ] Stock reservation during checkout.

### Checkout and payment

- [x] Create expiring checkout sessions from an authenticated cart.
- [x] Save contact, delivery address, shipping method, tax, and totals.
- [x] Initialize Paystack and validate signed webhooks.
- [x] Expose payment/checkout status for the browser return screen.
- [x] Create exactly one order for a successful payment through unique references.
- [ ] Guest checkout.
- [ ] Configurable delivery zones, pickup locations, discounts, and tax rules.
- [x] Explicit Paystack verification fallback and sanitized payment-event ledger.
- [ ] Idempotency-key records for checkout/payment commands.

### Orders and confirmation

- [x] List a user's orders and retrieve an owned order by number.
- [x] Return confirmation details after payment.
- [ ] Cursor/status pagination, reorder, and cancellation policy.
- [x] Owned order tracking event history.
- [ ] Asynchronous PDF receipt generation/download.

### Customer support

- [x] Submit a support ticket.
- [x] Read/search the FAQ content required by the support screen.
- [ ] Human-readable ticket numbers, authenticated ticket history, replies, and attachments.
- [ ] Persisted chat sessions/messages and a WebSocket gateway.

## Delivery phases

1. **Contract completion (current phase):** non-breaking read/status endpoints for designs, payment confirmation, FAQ search, and consolidated preferences; Swagger schemas and tests.
2. **Design production model:** design documents, surfaces/layers, versions, preview storage, rendering and exports.
3. **Commerce resilience:** guest carts, cart merging, stock reservations, idempotency, shipping rules, and server-side totals.
4. **Payment and fulfilment:** provider verification fallback, payment event ledger, receipts, tracking, reorder, and cancellation policy.
5. **Support platform:** ticket history/replies/attachments followed by persisted realtime chat.
6. **Hardening:** migrations, ownership/race-condition E2E tests, structured errors, health/readiness, metrics, tracing, and updated OpenAPI examples.

## Required acceptance flows

1. A user can create, save, reopen, duplicate, render, and purchase a custom design.
2. A guest can build a cart, sign in, merge it, and finish checkout without losing lines.
3. A replayed payment request or webhook creates only one payment and one order.
4. The payment-return screen can poll a safe status endpoint and open the resulting owned order.
5. Account profile, verification, password, newsletter, and marketing-consent states remain consistent.
6. Support FAQ search and ticket submission work without authentication; private ticket history requires ownership.

## Definition of done

- Database migrations are reviewed and reversible.
- Unit and integration tests cover success, validation, authorization, idempotency, and concurrency cases.
- Swagger documents request/response schemas and stable error codes.
- Frontend API types are generated from or checked against the OpenAPI contract.
- No endpoint trusts client-provided prices, totals, payment status, user IDs, or production snapshots.
