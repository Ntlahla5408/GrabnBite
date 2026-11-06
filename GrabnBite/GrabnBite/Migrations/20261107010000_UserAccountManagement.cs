using GrabnBite.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrabnBite.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261107010000_UserAccountManagement")]
    public partial class UserAccountManagement : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfileImagePublicId",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfileImageUrl",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetEmail",
                table: "EmailVerificationChallenges",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "ProfileImagePublicId", table: "Users");
            migrationBuilder.DropColumn(name: "ProfileImageUrl", table: "Users");
            migrationBuilder.DropColumn(name: "TargetEmail", table: "EmailVerificationChallenges");
        }
    }
}