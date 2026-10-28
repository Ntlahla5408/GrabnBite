using GrabnBite.Data;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrabnBite.Migrations
{
    public partial class PaymentRefundReconciliation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RefundStatus",
                table: "Payments",
                type: "text",
                nullable: false,
                defaultValue: "NOT_REQUIRED");

            migrationBuilder.AddColumn<decimal>(
                name: "RefundAmount",
                table: "Payments",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundProvider",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundProviderReference",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundRequestedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundCompletedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundFailedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresReconciliation",
                table: "Payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReconciliationReason",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReconciliationOpenedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReconciliationResolvedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReconciliationResolutionNotes",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PaymentReconciliationEvents",
                columns: table => new
                {
                    PaymentReconciliationEventId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PaymentId = table.Column<int>(type: "integer", nullable: false),
                    EventType = table.Column<string>(type: "text", nullable: false),
                    RefundStatus = table.Column<string>(type: "text", nullable: false),
                    ProviderReference = table.Column<string>(type: "text", nullable: true),
                    Details = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentReconciliationEvents", x => x.PaymentReconciliationEventId);
                    table.ForeignKey(
                        name: "FK_PaymentReconciliationEvents_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payments",
                        principalColumn: "PaymentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Payments_RefundStatus",
                table: "Payments",
                sql: "\"RefundStatus\" IN ('NOT_REQUIRED', 'REQUIRED', 'PENDING', 'SUCCEEDED', 'FAILED', 'MANUAL_REVIEW')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_PaymentReconciliationEvents_RefundStatus",
                table: "PaymentReconciliationEvents",
                sql: "\"RefundStatus\" IN ('NOT_REQUIRED', 'REQUIRED', 'PENDING', 'SUCCEEDED', 'FAILED', 'MANUAL_REVIEW')");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentReconciliationEvents_PaymentId_CreatedAt",
                table: "PaymentReconciliationEvents",
                columns: new[] { "PaymentId", "CreatedAt" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(name: "CK_PaymentReconciliationEvents_RefundStatus", table: "PaymentReconciliationEvents");
            migrationBuilder.DropCheckConstraint(name: "CK_Payments_RefundStatus", table: "Payments");
            migrationBuilder.DropTable(name: "PaymentReconciliationEvents");

            migrationBuilder.DropColumn(name: "RefundStatus", table: "Payments");
            migrationBuilder.DropColumn(name: "RefundAmount", table: "Payments");
            migrationBuilder.DropColumn(name: "RefundProvider", table: "Payments");
            migrationBuilder.DropColumn(name: "RefundProviderReference", table: "Payments");
            migrationBuilder.DropColumn(name: "RefundRequestedAt", table: "Payments");
            migrationBuilder.DropColumn(name: "RefundCompletedAt", table: "Payments");
            migrationBuilder.DropColumn(name: "RefundFailedAt", table: "Payments");
            migrationBuilder.DropColumn(name: "RequiresReconciliation", table: "Payments");
            migrationBuilder.DropColumn(name: "ReconciliationReason", table: "Payments");
            migrationBuilder.DropColumn(name: "ReconciliationOpenedAt", table: "Payments");
            migrationBuilder.DropColumn(name: "ReconciliationResolvedAt", table: "Payments");
            migrationBuilder.DropColumn(name: "ReconciliationResolutionNotes", table: "Payments");
        }
    }
}