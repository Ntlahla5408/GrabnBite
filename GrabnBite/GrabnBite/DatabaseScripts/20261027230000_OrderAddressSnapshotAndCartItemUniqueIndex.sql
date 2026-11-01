-- GrabnBite PostgreSQL schema update
-- Migration: 20261027230000_OrderAddressSnapshotAndCartItemUniqueIndex
-- IMPORTANT:
-- 1. Back up the database first.
-- 2. Run this script OR use "dotnet ef database update" after installing the migration.
--    Do not apply the same migration by both methods.
-- 3. This script intentionally stops if duplicate cart items exist. It does not delete data.

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "CartItems"
        GROUP BY "CartId", "MenuItemId"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'GrabnBite schema update stopped: duplicate CartItems exist for the same CartId and MenuItemId. Review and merge these rows deliberately, then rerun this script.';
    END IF;
END $$;

ALTER TABLE "Orders"
    ADD COLUMN "DeliveryAddressLabel" text,
    ADD COLUMN "DeliveryStreetAddress" text,
    ADD COLUMN "DeliveryCity" text,
    ADD COLUMN "DeliveryProvince" text,
    ADD COLUMN "DeliveryPostalCode" text,
    ADD COLUMN "DeliveryLatitude" double precision,
    ADD COLUMN "DeliveryLongitude" double precision;

UPDATE "Orders" AS o
SET
    "DeliveryAddressLabel" = a."Label",
    "DeliveryStreetAddress" = a."StreetAddress",
    "DeliveryCity" = a."City",
    "DeliveryProvince" = a."Province",
    "DeliveryPostalCode" = a."PostalCode",
    "DeliveryLatitude" = a."Latitude",
    "DeliveryLongitude" = a."Longitude"
FROM "Addresses" AS a
WHERE a."AddressId" = o."DeliveryAddressId";

-- Refuse to add NOT NULL if any historical order could not be backfilled.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Orders"
        WHERE "DeliveryAddressLabel" IS NULL
           OR "DeliveryStreetAddress" IS NULL
           OR "DeliveryCity" IS NULL
           OR "DeliveryProvince" IS NULL
           OR "DeliveryPostalCode" IS NULL
           OR "DeliveryLatitude" IS NULL
           OR "DeliveryLongitude" IS NULL
    ) THEN
        RAISE EXCEPTION 'GrabnBite schema update stopped: one or more order address snapshots could not be backfilled. Check Orders.DeliveryAddressId and Addresses before retrying.';
    END IF;
END $$;

ALTER TABLE "Orders"
    ALTER COLUMN "DeliveryAddressLabel" SET NOT NULL,
    ALTER COLUMN "DeliveryStreetAddress" SET NOT NULL,
    ALTER COLUMN "DeliveryCity" SET NOT NULL,
    ALTER COLUMN "DeliveryProvince" SET NOT NULL,
    ALTER COLUMN "DeliveryPostalCode" SET NOT NULL,
    ALTER COLUMN "DeliveryLatitude" SET NOT NULL,
    ALTER COLUMN "DeliveryLongitude" SET NOT NULL;

CREATE UNIQUE INDEX "IX_CartItems_CartId_MenuItemId"
    ON "CartItems" ("CartId", "MenuItemId");

-- Record this migration so EF Core will not try to apply it again.
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261027230000_OrderAddressSnapshotAndCartItemUniqueIndex', '8.0.4');

COMMIT;
