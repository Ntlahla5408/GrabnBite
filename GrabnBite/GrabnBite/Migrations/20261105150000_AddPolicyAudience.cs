using Microsoft.EntityFrameworkCore.Migrations;

namespace GrabnBite.Migrations
{
    public partial class AddPolicyAudience : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Audience",
                table: "PolicyDocuments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Customer");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}