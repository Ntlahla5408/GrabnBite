using Microsoft.EntityFrameworkCore.Migrations;

namespace GrabnBite.Migrations
{
    public partial class EncryptDriverIdentityFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdOrPassportNumberEncrypted",
                table: "DriverApplications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SignatureIdOrPassportNumberEncrypted",
                table: "DriverApplications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccountHolderIdOrRegistrationNumberEncrypted",
                table: "DriverApplications",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new System.NotSupportedException(
                "Driver identity values may have been written only to encrypted columns. Do not drop them during rollback.");
        }
    }
}