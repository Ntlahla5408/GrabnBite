using GrabnBite.Data;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrabnBite.Migrations
{
    public partial class OrderStatusHistoryActor : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ChangedByUserId",
                table: "OrderStatusHistories",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChangedByRole",
                table: "OrderStatusHistories",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_ChangedByUserId",
                table: "OrderStatusHistories",
                column: "ChangedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderStatusHistories_Users_ChangedByUserId",
                table: "OrderStatusHistories",
                column: "ChangedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderStatusHistories_Users_ChangedByUserId",
                table: "OrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_OrderStatusHistories_ChangedByUserId",
                table: "OrderStatusHistories");

            migrationBuilder.DropColumn(name: "ChangedByUserId", table: "OrderStatusHistories");
            migrationBuilder.DropColumn(name: "ChangedByRole", table: "OrderStatusHistories");
        }
    }
}
