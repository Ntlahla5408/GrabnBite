using GrabnBite.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrabnBite.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261028190000_AddYocoReconciliationEventIdempotency")]
    public partial class AddYocoReconciliationEventIdempotency : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Do not silently discard audit records if an earlier race already created
            // duplicates. Fail safely and require a manual review before applying.
            migrationBuilder.Sql("""
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
                """);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentReconciliationEvents_YocoEventIdempotency",
                table: "PaymentReconciliationEvents",
                columns: new[] { "PaymentId", "EventType", "ProviderReference" },
                unique: true,
                filter: "\"ProviderReference\" IS NOT NULL AND \"EventType\" IN ('YOCO_MULTIPLE_CHECKOUTS_COMPLETED', 'YOCO_STALE_CHECKOUT_COMPLETED', 'YOCO_CHECKOUT_CREATED_AFTER_STATE_CHANGED')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PaymentReconciliationEvents_YocoEventIdempotency",
                table: "PaymentReconciliationEvents");
        }
    }
}
