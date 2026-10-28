# GrabnBite payment lifecycle verification

This checklist is for the `fix/core-order-flow-theme` branch. Run it against a disposable/local database and Yoco test configuration. Do not use live payment credentials or apply migrations to production as part of verification.

## Build and migration-model checks

From the repository root:

```powershell
dotnet restore .\GrabnBite\GrabnBite.sln
dotnet build .\GrabnBite\GrabnBite.sln --configuration Release --no-restore
dotnet ef migrations has-pending-model-changes --project .\GrabnBite\GrabnBite\GrabnBite.csproj --startup-project .\GrabnBite\GrabnBite\GrabnBite.csproj
```

Expected: build succeeds and the EF model snapshot has no pending changes. Review the migration list and confirm the new `AddYocoReconciliationEventIdempotency` migration is present before applying it to a disposable database. The migration intentionally fails if duplicate qualifying audit events already exist; investigate those records rather than deleting them.

## Required payment safety scenarios

- [ ] **Duplicate webhook delivery:** deliver the same valid signed Yoco webhook twice. The payment must not be charged/recorded twice, duplicate reconciliation events must not be inserted, and a resolved case must not be reopened by a duplicate event.
- [ ] **Concurrent webhook delivery:** send the same event concurrently. Confirm the unique idempotency index allows at most one qualifying Yoco reconciliation event and that the losing request does not reset resolution fields.
- [ ] **Delayed old checkout:** start a retry after a previous checkout is verified failed/cancelled, then deliver a provider-confirmed success for the old checkout. Confirm the payment is marked as paid only from provider verification, reconciliation is opened, and restaurant acceptance is blocked until review.
- [ ] **Multiple completed checkouts:** simulate provider-confirmed success for two checkout IDs attached to one payment. Confirm the original transaction reference is not overwritten, reconciliation remains open, and restaurant acceptance is blocked.
- [ ] **Cancellation/payment race:** race order cancellation against provider-confirmed payment. A cancelled order must not be fulfilled; refund tracking/reconciliation must be recorded if payment succeeds.
- [ ] **Checkout creation race:** change the payment attempt while a Yoco checkout request is in flight. The returned checkout must not be exposed as the active checkout and must be recorded for reconciliation.
- [ ] **Restaurant acceptance guard:** acceptance is rejected for a missing payment, an unpaid non-cash payment, any payment with `RequiresReconciliation`, or any refund status other than `NOT_REQUIRED`. A valid cash order and a verified paid order with no reconciliation/refund flags should still follow the intended flow.
- [ ] **Fake-payment regression:** in Development, create/complete/fail/retry a fake payment and verify the existing workflow still works. Outside Development, every fake-payment action should return not found and must never call a payment provider.
- [ ] **Refund tracking:** verify status transitions and audit events. Confirm the endpoint only records an administrator-reported outcome and does not claim to initiate a provider refund.
- [ ] **Resolution race:** delay the Yoco status lookup while another request changes payment/refund state or adds a checkout event. The resolution endpoint must return a conflict and leave reconciliation open.

## Evidence to record

For each run, record the environment, scenario, expected/actual result, relevant payment/order IDs, and audit event types. Never include secrets, full card details, or live provider credentials in logs or evidence.

The repository currently has no automated payment test project, so this checklist is a manual/integration test plan, not proof that these scenarios have passed. The backend build workflow checks compilation only.
