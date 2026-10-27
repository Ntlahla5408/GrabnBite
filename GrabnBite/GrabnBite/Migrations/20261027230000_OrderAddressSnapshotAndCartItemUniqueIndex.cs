using GrabnBite.Data;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrabnBite.Migrations
{
    public partial class OrderAddressSnapshotAndCartItemUniqueIndex : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fail clearly rather than silently deleting/merging customer cart data.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM "CartItems"
                        GROUP BY "CartId", "MenuItemId"
                        HAVING COUNT(*) > 1
                    ) THEN
                        RAISE EXCEPTION 'GrabnBite migration stopped: duplicate CartItems exist for the same CartId and MenuItemId. Review and merge these rows deliberately, then rerun the migration.';
                    END IF;
                END $$;
                """);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryAddressLabel",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryStreetAddress",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryCity",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryProvince",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryPostalCode",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DeliveryLatitude",
                table: "Orders",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DeliveryLongitude",
                table: "Orders",
                type: "double precision",
                nullable: true);

            // Preserve the address as it existed when each historical order was placed.
            migrationBuilder.Sql("""
                UPDATE "Orders" AS o
                SET
                    "DeliveryAddressLabel" = a."Label",
                    "DeliveryStreetAddress" = a."StreetAddress",
                    "DeliveryCity" = a."City",
                    "DeliveryProvince" = a."Province",
                    "DeliveryPostalCode" = a."PostalCode",
                    "DeliveryLatitude" = a."Latitude",
                    "DeliveryLongitude" = a."Longitude"
                FROM "Addresses" AS a
                WHERE a."AddressId" = o."DeliveryAddressId";
                """);

            migrationBuilder.AlterColumn<string>(
                name: "DeliveryAddressLabel",
                table: "Orders",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeliveryStreetAddress",
                table: "Orders",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeliveryCity",
                table: "Orders",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeliveryProvince",
                table: "Orders",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeliveryPostalCode",
                table: "Orders",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "DeliveryLatitude",
                table: "Orders",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "DeliveryLongitude",
                table: "Orders",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_MenuItemId",
                table: "CartItems",
                columns: new[] { "CartId", "MenuItemId" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_MenuItemId",
                table: "CartItems");

            migrationBuilder.DropColumn(name: "DeliveryAddressLabel", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryStreetAddress", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryCity", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryProvince", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryPostalCode", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryLatitude", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryLongitude", table: "Orders");
        }
    }
}
