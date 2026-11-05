START TRANSACTION;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "PaymentReconciliationEvents"
        WHERE "ProviderReference" IS NOT NULL
          AND "EventType" IN (
              'YOCO_MULTIPLE_CHECKOUTS_COMPLETED',
              'YOCO_STALE_CHECKOUT_COMPLETED',
              'YOCO_CHECKOUT_CREATED_AFTER_STATE_CHANGED'
          )
        GROUP BY "PaymentId", "EventType", "ProviderReference"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate Yoco reconciliation events exist. Review the audit trail before applying the idempotency index.';
    END IF;
END $$;

CREATE UNIQUE INDEX "IX_PaymentReconciliationEvents_YocoEventIdempotency" ON "PaymentReconciliationEvents" ("PaymentId", "EventType", "ProviderReference") WHERE "ProviderReference" IS NOT NULL AND "EventType" IN ('YOCO_MULTIPLE_CHECKOUTS_COMPLETED', 'YOCO_STALE_CHECKOUT_COMPLETED', 'YOCO_CHECKOUT_CREATED_AFTER_STATE_CHANGED');

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261028190000_AddYocoReconciliationEventIdempotency', '8.0.4');

COMMIT;

START TRANSACTION;

ALTER TABLE "Restaurants" ADD "ImagePublicId" text;

ALTER TABLE "MenuItems" ADD "ImagePublicId" text;

ALTER TABLE "MenuItems" ADD "ImageUrl" text;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261101090000_AddCloudinaryImageReferences', '8.0.4');

COMMIT;

