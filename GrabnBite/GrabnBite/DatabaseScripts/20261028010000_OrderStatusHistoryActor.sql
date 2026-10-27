-- GrabnBite: add actor information to order status history
-- Back up first. Run this script OR apply the matching EF migration, not both.

BEGIN;

ALTER TABLE "OrderStatusHistories"
    ADD COLUMN "ChangedByUserId" integer NULL,
    ADD COLUMN "ChangedByRole" text NULL;

CREATE INDEX "IX_OrderStatusHistories_ChangedByUserId"
    ON "OrderStatusHistories" ("ChangedByUserId");

ALTER TABLE "OrderStatusHistories"
    ADD CONSTRAINT "FK_OrderStatusHistories_Users_ChangedByUserId"
    FOREIGN KEY ("ChangedByUserId")
    REFERENCES "Users" ("UserId")
    ON DELETE SET NULL;

-- Existing historical rows remain with a NULL actor because the old schema
-- did not record who initiated each change.

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261028010000_OrderStatusHistoryActor', '8.0.4');

COMMIT;
