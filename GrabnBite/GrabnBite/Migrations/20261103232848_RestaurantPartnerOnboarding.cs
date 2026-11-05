using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GrabnBite.Migrations
{
    /// <inheritdoc />
    public partial class RestaurantPartnerOnboarding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Restaurants",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "RestaurantApplicationId",
                table: "Restaurants",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RestaurantApplications",
                columns: table => new
                {
                    RestaurantApplicationId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ApplicationReference = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TradingName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RegisteredBusinessName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CipcRegistrationNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RestaurantCategory = table.Column<string>(type: "text", nullable: true),
                    PhysicalAddress = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    RestaurantContactNumber = table.Column<string>(type: "text", nullable: true),
                    BusinessEmail = table.Column<string>(type: "text", nullable: true),
                    WebsiteOrSocialMediaUrl = table.Column<string>(type: "text", nullable: true),
                    RepresentativeFullName = table.Column<string>(type: "text", nullable: true),
                    RepresentativePosition = table.Column<string>(type: "text", nullable: true),
                    RepresentativeMobileNumber = table.Column<string>(type: "text", nullable: true),
                    RepresentativeEmail = table.Column<string>(type: "text", nullable: true),
                    HasAuthorityToRepresent = table.Column<bool>(type: "boolean", nullable: true),
                    OffersCustomerCollection = table.Column<bool>(type: "boolean", nullable: true),
                    OffersRestaurantDelivery = table.Column<bool>(type: "boolean", nullable: true),
                    OffersGrubnBiteDelivery = table.Column<bool>(type: "boolean", nullable: true),
                    AveragePreparationTimeMinutes = table.Column<int>(type: "integer", nullable: true),
                    MaximumDeliveryDistanceKm = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: true),
                    DeliveryInstructions = table.Column<string>(type: "text", nullable: true),
                    CommissionOfferAccepted = table.Column<bool>(type: "boolean", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AdminComments = table.Column<string>(type: "text", nullable: true),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    DocumentsRequestedMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantApplications", x => x.RestaurantApplicationId);
                    table.ForeignKey(
                        name: "FK_RestaurantApplications_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RestaurantApplications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantCommissionSettings",
                columns: table => new
                {
                    RestaurantCommissionSettingId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<int>(type: "integer", nullable: false),
                    ActivationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PromotionStartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    PromotionEndDateExclusive = table.Column<DateOnly>(type: "date", nullable: false),
                    PromotionCommissionRate = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    CollectionCommissionRate = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    RestaurantDeliveryCommissionRate = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    GrubnBiteDeliveryCommissionRate = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    IsPromotionActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantCommissionSettings", x => x.RestaurantCommissionSettingId);
                    table.CheckConstraint("CK_RestaurantCommissionSettings_PromotionDates", "\"PromotionEndDateExclusive\" > \"PromotionStartDate\"");
                    table.CheckConstraint("CK_RestaurantCommissionSettings_Rates", "\"PromotionCommissionRate\" BETWEEN 0 AND 1 AND \"CollectionCommissionRate\" BETWEEN 0 AND 1 AND \"RestaurantDeliveryCommissionRate\" BETWEEN 0 AND 1 AND \"GrubnBiteDeliveryCommissionRate\" BETWEEN 0 AND 1");
                    table.ForeignKey(
                        name: "FK_RestaurantCommissionSettings_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "RestaurantId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantAgreementAcceptances",
                columns: table => new
                {
                    RestaurantAgreementAcceptanceId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantApplicationId = table.Column<int>(type: "integer", nullable: false),
                    SignatoryFullName = table.Column<string>(type: "text", nullable: false),
                    SignatoryPosition = table.Column<string>(type: "text", nullable: false),
                    SignatoryEmail = table.Column<string>(type: "text", nullable: false),
                    SignatoryMobileNumber = table.Column<string>(type: "text", nullable: false),
                    ElectronicSignatureReference = table.Column<string>(type: "text", nullable: true),
                    OtpVerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantAgreementAcceptances", x => x.RestaurantAgreementAcceptanceId);
                    table.ForeignKey(
                        name: "FK_RestaurantAgreementAcceptances_RestaurantApplications_Resta~",
                        column: x => x.RestaurantApplicationId,
                        principalTable: "RestaurantApplications",
                        principalColumn: "RestaurantApplicationId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantApplicationHistories",
                columns: table => new
                {
                    RestaurantApplicationHistoryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantApplicationId = table.Column<int>(type: "integer", nullable: false),
                    PreviousStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    NewStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    PerformedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantApplicationHistories", x => x.RestaurantApplicationHistoryId);
                    table.ForeignKey(
                        name: "FK_RestaurantApplicationHistories_RestaurantApplications_Resta~",
                        column: x => x.RestaurantApplicationId,
                        principalTable: "RestaurantApplications",
                        principalColumn: "RestaurantApplicationId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RestaurantApplicationHistories_Users_PerformedByUserId",
                        column: x => x.PerformedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantApplicationReviewItems",
                columns: table => new
                {
                    RestaurantApplicationReviewItemId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantApplicationId = table.Column<int>(type: "integer", nullable: false),
                    ReviewCategory = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    VerificationStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ReviewedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AdminComment = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantApplicationReviewItems", x => x.RestaurantApplicationReviewItemId);
                    table.ForeignKey(
                        name: "FK_RestaurantApplicationReviewItems_RestaurantApplications_Res~",
                        column: x => x.RestaurantApplicationId,
                        principalTable: "RestaurantApplications",
                        principalColumn: "RestaurantApplicationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RestaurantApplicationReviewItems_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantBankingDetails",
                columns: table => new
                {
                    RestaurantBankingDetailId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantApplicationId = table.Column<int>(type: "integer", nullable: false),
                    AccountHolderName = table.Column<string>(type: "text", nullable: false),
                    BankName = table.Column<string>(type: "text", nullable: false),
                    AccountType = table.Column<string>(type: "text", nullable: false),
                    AccountNumberEncrypted = table.Column<string>(type: "text", nullable: false),
                    BranchCode = table.Column<string>(type: "text", nullable: false),
                    PayoutContactEmail = table.Column<string>(type: "text", nullable: false),
                    VerificationStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    VerifiedByUserId = table.Column<int>(type: "integer", nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantBankingDetails", x => x.RestaurantBankingDetailId);
                    table.ForeignKey(
                        name: "FK_RestaurantBankingDetails_RestaurantApplications_RestaurantA~",
                        column: x => x.RestaurantApplicationId,
                        principalTable: "RestaurantApplications",
                        principalColumn: "RestaurantApplicationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RestaurantBankingDetails_Users_VerifiedByUserId",
                        column: x => x.VerifiedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantDocuments",
                columns: table => new
                {
                    RestaurantDocumentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantApplicationId = table.Column<int>(type: "integer", nullable: false),
                    DocumentType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    DocumentDescription = table.Column<string>(type: "text", nullable: true),
                    StoragePath = table.Column<string>(type: "text", nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    VerificationStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    AdminComment = table.Column<string>(type: "text", nullable: true),
                    VerifiedByUserId = table.Column<int>(type: "integer", nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantDocuments", x => x.RestaurantDocumentId);
                    table.ForeignKey(
                        name: "FK_RestaurantDocuments_RestaurantApplications_RestaurantApplic~",
                        column: x => x.RestaurantApplicationId,
                        principalTable: "RestaurantApplications",
                        principalColumn: "RestaurantApplicationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RestaurantDocuments_Users_VerifiedByUserId",
                        column: x => x.VerifiedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantOperatingHours",
                columns: table => new
                {
                    RestaurantOperatingHourId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantApplicationId = table.Column<int>(type: "integer", nullable: false),
                    DayOfWeek = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    IsOpen = table.Column<bool>(type: "boolean", nullable: false),
                    OpeningTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    ClosingTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantOperatingHours", x => x.RestaurantOperatingHourId);
                    table.ForeignKey(
                        name: "FK_RestaurantOperatingHours_RestaurantApplications_RestaurantA~",
                        column: x => x.RestaurantApplicationId,
                        principalTable: "RestaurantApplications",
                        principalColumn: "RestaurantApplicationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantAgreementAcceptanceDocuments",
                columns: table => new
                {
                    AgreementAcceptanceDocumentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantAgreementAcceptanceId = table.Column<int>(type: "integer", nullable: false),
                    PolicyDocumentId = table.Column<int>(type: "integer", nullable: true),
                    DocumentTitle = table.Column<string>(type: "text", nullable: false),
                    DocumentVersion = table.Column<int>(type: "integer", nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ContentHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    StoragePath = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantAgreementAcceptanceDocuments", x => x.AgreementAcceptanceDocumentId);
                    table.ForeignKey(
                        name: "FK_RestaurantAgreementAcceptanceDocuments_PolicyDocuments_Poli~",
                        column: x => x.PolicyDocumentId,
                        principalTable: "PolicyDocuments",
                        principalColumn: "PolicyDocumentId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RestaurantAgreementAcceptanceDocuments_RestaurantAgreementA~",
                        column: x => x.RestaurantAgreementAcceptanceId,
                        principalTable: "RestaurantAgreementAcceptances",
                        principalColumn: "RestaurantAgreementAcceptanceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Restaurants_RestaurantApplicationId",
                table: "Restaurants",
                column: "RestaurantApplicationId",
                unique: true,
                filter: "\"RestaurantApplicationId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantAgreementAcceptanceDocuments_PolicyDocumentId",
                table: "RestaurantAgreementAcceptanceDocuments",
                column: "PolicyDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantAgreementAcceptanceDocuments_RestaurantAgreementA~",
                table: "RestaurantAgreementAcceptanceDocuments",
                column: "RestaurantAgreementAcceptanceId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantAgreementAcceptances_RestaurantApplicationId",
                table: "RestaurantAgreementAcceptances",
                column: "RestaurantApplicationId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantApplicationHistories_PerformedByUserId",
                table: "RestaurantApplicationHistories",
                column: "PerformedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantApplicationHistories_RestaurantApplicationId_Crea~",
                table: "RestaurantApplicationHistories",
                columns: new[] { "RestaurantApplicationId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantApplicationReviewItems_RestaurantApplicationId_Re~",
                table: "RestaurantApplicationReviewItems",
                columns: new[] { "RestaurantApplicationId", "ReviewCategory" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantApplicationReviewItems_ReviewedByUserId",
                table: "RestaurantApplicationReviewItems",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantApplications_ApplicationReference",
                table: "RestaurantApplications",
                column: "ApplicationReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantApplications_CreatedAt",
                table: "RestaurantApplications",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantApplications_ReviewedByUserId",
                table: "RestaurantApplications",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantApplications_UserId_Status",
                table: "RestaurantApplications",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantBankingDetails_RestaurantApplicationId",
                table: "RestaurantBankingDetails",
                column: "RestaurantApplicationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantBankingDetails_VerifiedByUserId",
                table: "RestaurantBankingDetails",
                column: "VerifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantCommissionSettings_RestaurantId",
                table: "RestaurantCommissionSettings",
                column: "RestaurantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantDocuments_RestaurantApplicationId",
                table: "RestaurantDocuments",
                column: "RestaurantApplicationId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantDocuments_VerifiedByUserId",
                table: "RestaurantDocuments",
                column: "VerifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantOperatingHours_RestaurantApplicationId_DayOfWeek",
                table: "RestaurantOperatingHours",
                columns: new[] { "RestaurantApplicationId", "DayOfWeek" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Restaurants_RestaurantApplications_RestaurantApplicationId",
                table: "Restaurants",
                column: "RestaurantApplicationId",
                principalTable: "RestaurantApplications",
                principalColumn: "RestaurantApplicationId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Restaurants_RestaurantApplications_RestaurantApplicationId",
                table: "Restaurants");

            migrationBuilder.DropTable(
                name: "RestaurantAgreementAcceptanceDocuments");

            migrationBuilder.DropTable(
                name: "RestaurantApplicationHistories");

            migrationBuilder.DropTable(
                name: "RestaurantApplicationReviewItems");

            migrationBuilder.DropTable(
                name: "RestaurantBankingDetails");

            migrationBuilder.DropTable(
                name: "RestaurantCommissionSettings");

            migrationBuilder.DropTable(
                name: "RestaurantDocuments");

            migrationBuilder.DropTable(
                name: "RestaurantOperatingHours");

            migrationBuilder.DropTable(
                name: "RestaurantAgreementAcceptances");

            migrationBuilder.DropTable(
                name: "RestaurantApplications");

            migrationBuilder.DropIndex(
                name: "IX_Restaurants_RestaurantApplicationId",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "RestaurantApplicationId",
                table: "Restaurants");
        }
    }
}
