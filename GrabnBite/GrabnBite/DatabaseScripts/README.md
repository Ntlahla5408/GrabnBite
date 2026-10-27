# GrabnBite database schema updates and fake payments

## Database update approach

The backend uses Entity Framework Core 8 with PostgreSQL through Npgsql. The C# entity classes and `AppDbContext` describe the intended schema; a migration records the incremental changes needed to bring an existing database in line with that model.

For this update, use **one** of the following options, not both.

### Option A — Apply the EF Core migration (recommended)

1. Back up your PostgreSQL/Supabase database first.
2. Open a terminal in `GrabnBite/GrabnBite`.
3. Make sure the `DefaultConnection` connection string points to the database you intend to update.
4. Run:

   ```bash
   dotnet ef migrations list
   dotnet ef database update
   ```

   If the EF tool is not installed, install the matching EF Core 8 tool once with `dotnet tool install --global dotnet-ef --version 8.0.4`. If the repository contains a local tool manifest, use `dotnet tool restore` instead.

5. Check that both `20261027230000_OrderAddressSnapshotAndCartItemUniqueIndex` and `20261028010000_OrderStatusHistoryActor` appear in `__EFMigrationsHistory`.

The migrations add a checkout-time delivery address snapshot to each order, a unique index that prevents duplicate rows for the same cart/menu-item combination, and actor attribution on future order status history entries. They backfill old orders from their referenced saved addresses. The cart migration intentionally stops if duplicate cart items are found rather than deleting or merging customer data automatically. Existing status-history entries retain a null actor because the old schema did not record who initiated them.

### Option B — Run the SQL script manually

Run these scripts in timestamp order against the target PostgreSQL database (for example, in the Supabase SQL editor) after taking a backup:

- `DatabaseScripts/20261027230000_OrderAddressSnapshotAndCartItemUniqueIndex.sql`- `DatabaseScripts/20261028010000_OrderStatusHistoryActor.sql`

The SQL script also records the migration in `__EFMigrationsHistory`, so EF Core knows it has already been applied. Do not run the same schema update by both options.

### If the migration reports duplicate cart items

Run this read-only query to inspect them:

```sql
SELECT "CartId", "MenuItemId", COUNT(*) AS "DuplicateRows",
       SUM("Quantity") AS "CombinedQuantity"
FROM "CartItems"
GROUP BY "CartId", "MenuItemId"
HAVING COUNT(*) > 1
ORDER BY "CartId", "MenuItemId";
```

Review the actual rows before deciding how to reconcile them. The migration does not silently delete or merge them.

## Fake payment gateway (Development environment only)

The fake gateway does not contact Yoco, Stripe, or any payment provider and never charges money. All fake payment endpoints return `404 Not Found` outside the ASP.NET Core `Development` environment.

Use a valid customer JWT in the `Authorization: Bearer <token>` header.

1. Create a fake payment for an order that belongs to the logged-in customer:

   `POST /api/fake-payments/{orderId}`

   This records a `PENDING` payment using the order's server-calculated total.

2. Simulate success or failure using the returned `paymentId`:

   `POST /api/fake-payments/{paymentId}/complete`

   Success body:

   ```json
   { "succeed": true }
   ```

   Failure body:

   ```json
   { "succeed": false }
   ```

3. A final result cannot be overwritten by calling the completion endpoint again. A failed fake payment can be retried by calling the create endpoint again for the same order; the existing fake payment row is reset to pending with a new reference. A paid payment cannot be replaced.

These endpoints are intended for local API/Swagger workflow testing only. Do not expose a Development environment publicly, and do not treat a fake payment as evidence of a real transaction.

## Current scope and verification

These migrations do not delete tables or existing orders. The first adds these order snapshot columns: `DeliveryAddressLabel`, `DeliveryStreetAddress`, `DeliveryCity`, `DeliveryProvince`, `DeliveryPostalCode`, `DeliveryLatitude`, and `DeliveryLongitude`.

The new actor-audit migration and its SQL script have been authored but have not been applied or runtime-tested in this environment. The earlier address-snapshot/cart-uniqueness migration is separate. Run the build and apply pending migrations in your development environment before relying on the new actor fields.


The second migration adds nullable `ChangedByUserId` and `ChangedByRole` fields to `OrderStatusHistories`, so new status changes can identify the authenticated user and role. Older rows remain valid with no actor recorded.