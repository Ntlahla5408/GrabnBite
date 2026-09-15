using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrabnBite.Migrations
{
    /// <inheritdoc />
    public partial class AddYocoCheckoutId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "YocoCheckoutId",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "YocoCheckoutId",
                table: "Payments");
        }
    }
}
