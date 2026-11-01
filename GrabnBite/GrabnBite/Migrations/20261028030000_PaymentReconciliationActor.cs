using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrabnBite.Migrations
{
    public partial class PaymentReconciliationActor : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActorUserId",
                table: "PaymentReconciliationEvents",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActorRole",
                table: "PaymentReconciliationEvents",
                type: "text",
                nullable: false,
                defaultValue: "SYSTEM");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentReconciliationEvents_ActorUserId",
                table: "PaymentReconciliationEvents",
                column: "ActorUserId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PaymentReconciliationEvents_ActorUserId",
                table: "PaymentReconciliationEvents");

            migrationBuilder.DropColumn(
                name: "ActorUserId",
                table: "PaymentReconciliationEvents");

            migrationBuilder.DropColumn(
                name: "ActorRole",
                table: "PaymentReconciliationEvents");
        }
    }
}