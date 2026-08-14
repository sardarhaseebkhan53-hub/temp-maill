# Payments

Haven supports two rails: Stripe (automatic) and operator-configured manual
methods (JazzCash, Easypaisa, bank transfer, or anything else you add).

**Premium is never activated from a client claim.** The only two paths that
grant a plan are a signature-verified Stripe webhook and an explicit admin
approval, and both funnel through `activateSubscription()`.

## Configuring methods

Admin → Payments → *Payment methods*. Each method exposes:

- Enable/disable and status (active/hidden)
- Internal name and customer-facing display name
- Description and customer instructions
- Account number, account title, merchant ID, IBAN, bank name, QR image URL
- Currency, minimum and maximum amount
- Plan mapping (which plans it may sell — empty means all paid plans)
- Sort order

Methods ship **disabled and empty**. No account numbers or credentials are
committed to source.

> Stripe API keys and the webhook secret are read from `STRIPE_SECRET_KEY` and
> `STRIPE_WEBHOOK_SECRET`. They are never stored in the database or exposed in
> the admin UI.

## Manual flow

1. The customer picks a plan and a method that the operator enabled.
2. Haven shows that method's admin-configured instructions and account details.
3. The customer submits a transaction ID and, optionally, a receipt URL.
4. A `Payment` (`PENDING`) plus a `ManualPayment` (`PENDING`) row are created.
5. Admin → Payments lists it for review.

Server-side checks on submission (`assertMethodAccepts`):

- the method exists, is enabled, and is active
- the method is permitted to sell the selected plan
- the amount is inside the configured min/max

The charged amount is always read from the plan's `PlanPrice`, **never** from
the submitted form.

### Review

- **Approve** → payment `SUCCEEDED`, subscription activated, customer notified.
- **Reject** → payment `FAILED`, premium stays inactive, reason sent to the
  customer. A reason is required.
- **Request info** → stays pending with a note.

Every decision is written to the audit log with the actor and IP.

## Stripe

`startCheckout()` creates a session with `userId`, `planKey`, and `interval` in
the metadata. The webhook reads the plan from that metadata, so the purchased
plan can never be chosen by the browser.

`checkout.session.completed` is idempotent — a retried delivery for a session
that already produced a payment is ignored, so Stripe's retry policy cannot
create duplicate subscriptions. `customer.subscription.deleted` cancels the
matching subscription.

Configure the endpoint as `POST /api/v1/billing/stripe/webhook`.
