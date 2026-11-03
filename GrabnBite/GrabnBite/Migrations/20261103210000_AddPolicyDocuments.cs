using GrabnBite.Data;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrabnBite.Migrations
{
    public partial class AddPolicyDocuments : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PolicyDocuments",
                columns: table => new
                {
                    PolicyDocumentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StoragePath = table.Column<string>(type: "text", nullable: false),
                    OriginalFileName = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    UpdatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyDocuments", x => x.PolicyDocumentId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PolicyDocuments_IsArchived_Status",
                table: "PolicyDocuments",
                columns: new[] { "IsArchived", "Status" });

            // The table is not intended to be queried directly through the Supabase Data API.
            // The ASP.NET Core backend accesses it using its database connection.
            migrationBuilder.Sql("ALTER TABLE \"PolicyDocuments\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("CREATE POLICY \"PolicyDocuments service role access\" ON \"PolicyDocuments\" FOR ALL TO service_role USING (true) WITH CHECK (true);");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PolicyDocuments");
        }
    }
}