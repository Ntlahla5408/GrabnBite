using GrabnBite.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrabnBite.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261105120000_OneActiveDeliveryPerDriver")]
    public partial class OneActiveDeliveryPerDriver : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Deliveries_DriverId",
                table: "Deliveries");

            migrationBuilder.CreateIndex(
                name: "IX_Deliveries_DriverId",
                table: "Deliveries",
                column: "DriverId",
                unique: true,
                filter: "\"DriverId\" IS NOT NULL AND \"Status\" IN ('ASSIGNED', 'PICKED_UP', 'DELIVERING')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Deliveries_DriverId",
                table: "Deliveries");

            migrationBuilder.CreateIndex(
                name: "IX_Deliveries_DriverId",
                table: "Deliveries",
                column: "DriverId");
        }
    }
}