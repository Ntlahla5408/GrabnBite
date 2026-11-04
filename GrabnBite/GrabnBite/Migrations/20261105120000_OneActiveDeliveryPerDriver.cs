using GrabnBite.Data;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrabnBite.Migrations
{
    public partial class OneActiveDeliveryPerDriver : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Deliveries_DriverId_Active",
                table: "Deliveries",
                column: "DriverId",
                unique: true,
                filter: "\"DriverId\" IS NOT NULL AND \"Status\" IN ('ASSIGNED', 'PICKED_UP', 'DELIVERING')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Deliveries_DriverId_Active",
                table: "Deliveries");
        }
    }
}