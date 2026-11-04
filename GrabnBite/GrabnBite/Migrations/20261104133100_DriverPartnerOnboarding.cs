using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GrabnBite.Migrations
{
    /// <inheritdoc />
    public partial class DriverPartnerOnboarding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DriverApplications",
                columns: table => new
                {
                    DriverApplicationId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ApplicationReference = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    FullLegalName = table.Column<string>(type: "text", nullable: true),
                    Surname = table.Column<string>(type: "text", nullable: true),
                    PreferredName = table.Column<string>(type: "text", nullable: true),
                    IdOrPassportNumber = table.Column<string>(type: "text", nullable: true),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    Nationality = table.Column<string>(type: "text", nullable: true),
                    MobileNumber = table.Column<string>(type: "text", nullable: true),
                    AlternativeContactNumber = table.Column<string>(type: "text", nullable: true),
                    EmailAddress = table.Column<string>(type: "text", nullable: true),
                    ResidentialAddress = table.Column<string>(type: "text", nullable: true),
                    SuburbOrTownship = table.Column<string>(type: "text", nullable: true),
                    CityOrTown = table.Column<string>(type: "text", nullable: true),
                    Province = table.Column<string>(type: "text", nullable: true),
                    PostalCode = table.Column<string>(type: "text", nullable: true),
                    PartnerType = table.Column<string>(type: "text", nullable: true),
                    ApplyingAs = table.Column<string>(type: "text", nullable: true),
                    RegisteredBusinessName = table.Column<string>(type: "text", nullable: true),
                    CompanyRegistrationNumber = table.Column<string>(type: "text", nullable: true),
                    BusinessAddress = table.Column<string>(type: "text", nullable: true),
                    BusinessRepresentative = table.Column<string>(type: "text", nullable: true),
                    NumberOfDrivers = table.Column<int>(type: "integer", nullable: true),
                    VehicleMake = table.Column<string>(type: "text", nullable: true),
                    VehicleModel = table.Column<string>(type: "text", nullable: true),
                    VehicleYear = table.Column<int>(type: "integer", nullable: true),
                    VehicleRegistration = table.Column<string>(type: "text", nullable: true),
                    VehicleColour = table.Column<string>(type: "text", nullable: true),
                    VehicleType = table.Column<string>(type: "text", nullable: true),
                    VehicleOwner = table.Column<string>(type: "text", nullable: true),
                    IsRoadworthy = table.Column<bool>(type: "boolean", nullable: true),
                    IsLicensed = table.Column<bool>(type: "boolean", nullable: true),
                    IsInsured = table.Column<bool>(type: "boolean", nullable: true),
                    RequiresDriversLicence = table.Column<bool>(type: "boolean", nullable: false),
                    RequiresProfessionalDrivingPermit = table.Column<bool>(type: "boolean", nullable: false),
                    RequiresRoadworthiness = table.Column<bool>(type: "boolean", nullable: false),
                    VehicleOwnedByApplicant = table.Column<bool>(type: "boolean", nullable: true),
                    CommercialDeliveryInsurance = table.Column<string>(type: "text", nullable: true),
                    HasInsulatedDeliveryBag = table.Column<bool>(type: "boolean", nullable: false),
                    HasSecureTransportContainer = table.Column<bool>(type: "boolean", nullable: false),
                    HasSmartphone = table.Column<bool>(type: "boolean", nullable: false),
                    HasMobileInternet = table.Column<bool>(type: "boolean", nullable: false),
                    HasPhoneHolder = table.Column<bool>(type: "boolean", nullable: false),
                    HasProtectiveClothing = table.Column<bool>(type: "boolean", nullable: false),
                    HasHelmet = table.Column<bool>(type: "boolean", nullable: false),
                    HasReflectiveEquipment = table.Column<bool>(type: "boolean", nullable: false),
                    OtherEquipment = table.Column<string>(type: "text", nullable: true),
                    NeedsEquipmentAssistance = table.Column<bool>(type: "boolean", nullable: true),
                    PreferredProvince = table.Column<string>(type: "text", nullable: true),
                    PreferredCityOrTown = table.Column<string>(type: "text", nullable: true),
                    PreferredAreas = table.Column<string>(type: "text", nullable: true),
                    WorkingDays = table.Column<string>(type: "text", nullable: true),
                    Availability = table.Column<string>(type: "text", nullable: true),
                    OutsidePreferredArea = table.Column<string>(type: "text", nullable: true),
                    AccountHolderName = table.Column<string>(type: "text", nullable: true),
                    BankName = table.Column<string>(type: "text", nullable: true),
                    AccountNumberEncrypted = table.Column<string>(type: "text", nullable: true),
                    AccountType = table.Column<string>(type: "text", nullable: true),
                    BranchCode = table.Column<string>(type: "text", nullable: true),
                    AccountHolderIdOrRegistrationNumber = table.Column<string>(type: "text", nullable: true),
                    EmergencyContactName = table.Column<string>(type: "text", nullable: true),
                    EmergencyContactRelationship = table.Column<string>(type: "text", nullable: true),
                    EmergencyContactNumber = table.Column<string>(type: "text", nullable: true),
                    EmergencyContactAlternativeNumber = table.Column<string>(type: "text", nullable: true),
                    HasDeliveryExperience = table.Column<bool>(type: "boolean", nullable: true),
                    PreviousCompanyOrPlatform = table.Column<string>(type: "text", nullable: true),
                    ExperienceDuration = table.Column<string>(type: "text", nullable: true),
                    PreviousDeliveryTypes = table.Column<string>(type: "text", nullable: true),
                    HasFoodDeliveryExperience = table.Column<bool>(type: "boolean", nullable: true),
                    HasRelevantTraining = table.Column<bool>(type: "boolean", nullable: true),
                    TrainingDetails = table.Column<string>(type: "text", nullable: true),
                    AcknowledgedDeliveryPartnerAgreement = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedCollectionProcedures = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedCodeOfConduct = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedFailedDeliveryPolicy = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedAccidentAndLiabilityPolicy = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedPaymentSchedule = table.Column<bool>(type: "boolean", nullable: false),
                    PolicyVersionsOrLinks = table.Column<string>(type: "text", nullable: true),
                    ConfirmedInformationAccurate = table.Column<bool>(type: "boolean", nullable: false),
                    ConfirmedDocumentAuthority = table.Column<bool>(type: "boolean", nullable: false),
                    ConsentedToVerification = table.Column<bool>(type: "boolean", nullable: false),
                    ConfirmedLegalCompliance = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedNoGuaranteedAcceptance = table.Column<bool>(type: "boolean", nullable: false),
                    AcceptedPlatformPolicies = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedCompensationSeparation = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedWorkingRelationship = table.Column<bool>(type: "boolean", nullable: false),
                    ConsentedToPersonalInformationProcessing = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedPopia = table.Column<bool>(type: "boolean", nullable: false),
                    SignatureFullLegalName = table.Column<string>(type: "text", nullable: true),
                    SignatureIdOrPassportNumber = table.Column<string>(type: "text", nullable: true),
                    SignatureEmailAddress = table.Column<string>(type: "text", nullable: true),
                    SignatureMobileNumber = table.Column<string>(type: "text", nullable: true),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SignatureMethod = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("PK_DriverApplications", x => x.DriverApplicationId);
                    table.ForeignKey(
                        name: "FK_DriverApplications_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DriverApplications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DriverApplicationDocuments",
                columns: table => new
                {
                    DriverApplicationDocumentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DriverApplicationId = table.Column<int>(type: "integer", nullable: false),
                    DocumentType = table.Column<string>(type: "text", nullable: false),
                    DocumentDescription = table.Column<string>(type: "text", nullable: true),
                    StoragePath = table.Column<string>(type: "text", nullable: false),
                    OriginalFileName = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    VerificationStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    AdminComment = table.Column<string>(type: "text", nullable: true),
                    VerifiedByUserId = table.Column<int>(type: "integer", nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DriverApplicationDocuments", x => x.DriverApplicationDocumentId);
                    table.ForeignKey(
                        name: "FK_DriverApplicationDocuments_DriverApplications_DriverApplica~",
                        column: x => x.DriverApplicationId,
                        principalTable: "DriverApplications",
                        principalColumn: "DriverApplicationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DriverApplicationDocuments_Users_VerifiedByUserId",
                        column: x => x.VerifiedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DriverApplicationHistories",
                columns: table => new
                {
                    DriverApplicationHistoryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DriverApplicationId = table.Column<int>(type: "integer", nullable: false),
                    PreviousStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    NewStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    PerformedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DriverApplicationHistories", x => x.DriverApplicationHistoryId);
                    table.ForeignKey(
                        name: "FK_DriverApplicationHistories_DriverApplications_DriverApplica~",
                        column: x => x.DriverApplicationId,
                        principalTable: "DriverApplications",
                        principalColumn: "DriverApplicationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DriverApplicationHistories_Users_PerformedByUserId",
                        column: x => x.PerformedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DriverApplicationDocuments_DriverApplicationId_DocumentType",
                table: "DriverApplicationDocuments",
                columns: new[] { "DriverApplicationId", "DocumentType" });

            migrationBuilder.CreateIndex(
                name: "IX_DriverApplicationDocuments_VerifiedByUserId",
                table: "DriverApplicationDocuments",
                column: "VerifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DriverApplicationHistories_DriverApplicationId_CreatedAt",
                table: "DriverApplicationHistories",
                columns: new[] { "DriverApplicationId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DriverApplicationHistories_PerformedByUserId",
                table: "DriverApplicationHistories",
                column: "PerformedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DriverApplications_ApplicationReference",
                table: "DriverApplications",
                column: "ApplicationReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DriverApplications_ReviewedByUserId",
                table: "DriverApplications",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DriverApplications_Status_UpdatedAt",
                table: "DriverApplications",
                columns: new[] { "Status", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DriverApplications_UserId",
                table: "DriverApplications",
                column: "UserId",
                unique: true);

            // Protect driver application records from direct access through Supabase APIs.
            migrationBuilder.Sql(
                "ALTER TABLE \"DriverApplications\" ENABLE ROW LEVEL SECURITY;");

            migrationBuilder.Sql(
                "CREATE POLICY \"DriverApplications service role access\" " +
                "ON \"DriverApplications\" FOR ALL TO service_role " +
                "USING (true) WITH CHECK (true);");

            migrationBuilder.Sql(
                "ALTER TABLE \"DriverApplicationDocuments\" ENABLE ROW LEVEL SECURITY;");

            migrationBuilder.Sql(
                "CREATE POLICY \"DriverApplicationDocuments service role access\" " +
                "ON \"DriverApplicationDocuments\" FOR ALL TO service_role " +
                "USING (true) WITH CHECK (true);");

            migrationBuilder.Sql(
                "ALTER TABLE \"DriverApplicationHistories\" ENABLE ROW LEVEL SECURITY;");

            migrationBuilder.Sql(
                "CREATE POLICY \"DriverApplicationHistories service role access\" " +
                "ON \"DriverApplicationHistories\" FOR ALL TO service_role " +
                "USING (true) WITH CHECK (true);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "DROP POLICY IF EXISTS \"DriverApplications service role access\" ON \"DriverApplications\";");

            migrationBuilder.Sql(
                "DROP POLICY IF EXISTS \"DriverApplicationDocuments service role access\" ON \"DriverApplicationDocuments\";");

            migrationBuilder.Sql(
                "DROP POLICY IF EXISTS \"DriverApplicationHistories service role access\" ON \"DriverApplicationHistories\";");
            migrationBuilder.DropTable(
                name: "DriverApplicationDocuments");

            migrationBuilder.DropTable(
                name: "DriverApplicationHistories");

            migrationBuilder.DropTable(
                name: "DriverApplications");
        }
    }
}

