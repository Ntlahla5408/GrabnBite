namespace GrabnBite.Models.Entities
{
    public class DriverApplication
    {
        public int DriverApplicationId { get; set; }
        public int UserId { get; set; }
        public string ApplicationReference { get; set; } = string.Empty;
        public DriverApplicationStatus Status { get; set; } = DriverApplicationStatus.Draft;

        // Personal information
        public string? FullLegalName { get; set; }
        public string? Surname { get; set; }
        public string? PreferredName { get; set; }
        public string? IdOrPassportNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Nationality { get; set; }
        public string? MobileNumber { get; set; }
        public string? AlternativeContactNumber { get; set; }
        public string? EmailAddress { get; set; }
        public string? ResidentialAddress { get; set; }
        public string? SuburbOrTownship { get; set; }
        public string? CityOrTown { get; set; }
        public string? Province { get; set; }
        public string? PostalCode { get; set; }

        // Partner and business information
        public string? PartnerType { get; set; }
        public string? ApplyingAs { get; set; }
        public string? RegisteredBusinessName { get; set; }
        public string? CompanyRegistrationNumber { get; set; }
        public string? BusinessAddress { get; set; }
        public string? BusinessRepresentative { get; set; }
        public int? NumberOfDrivers { get; set; }

        // Vehicle information
        public string? VehicleMake { get; set; }
        public string? VehicleModel { get; set; }
        public int? VehicleYear { get; set; }
        public string? VehicleRegistration { get; set; }
        public string? VehicleColour { get; set; }
        public string? VehicleType { get; set; }
        public string? VehicleOwner { get; set; }
        public bool? IsRoadworthy { get; set; }
        public bool? IsLicensed { get; set; }
        public bool? IsInsured { get; set; }
        public bool RequiresDriversLicence { get; set; }
        public bool RequiresProfessionalDrivingPermit { get; set; }
        public bool RequiresRoadworthiness { get; set; }
        public bool? VehicleOwnedByApplicant { get; set; }
        public string? CommercialDeliveryInsurance { get; set; }

        // Delivery equipment
        public bool HasInsulatedDeliveryBag { get; set; }
        public bool HasSecureTransportContainer { get; set; }
        public bool HasSmartphone { get; set; }
        public bool HasMobileInternet { get; set; }
        public bool HasPhoneHolder { get; set; }
        public bool HasProtectiveClothing { get; set; }
        public bool HasHelmet { get; set; }
        public bool HasReflectiveEquipment { get; set; }
        public string? OtherEquipment { get; set; }
        public bool? NeedsEquipmentAssistance { get; set; }

        // Availability and service area
        public string? PreferredProvince { get; set; }
        public string? PreferredCityOrTown { get; set; }
        public string? PreferredAreas { get; set; }
        public string? WorkingDays { get; set; }
        public string? Availability { get; set; }
        public string? OutsidePreferredArea { get; set; }

        // Banking details (account number is encrypted at rest)
        public string? AccountHolderName { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumberEncrypted { get; set; }
        public string? AccountType { get; set; }
        public string? BranchCode { get; set; }
        public string? AccountHolderIdOrRegistrationNumber { get; set; }

        // Emergency contact
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactRelationship { get; set; }
        public string? EmergencyContactNumber { get; set; }
        public string? EmergencyContactAlternativeNumber { get; set; }

        // Experience and background
        public bool? HasDeliveryExperience { get; set; }
        public string? PreviousCompanyOrPlatform { get; set; }
        public string? ExperienceDuration { get; set; }
        public string? PreviousDeliveryTypes { get; set; }
        public bool? HasFoodDeliveryExperience { get; set; }
        public bool? HasRelevantTraining { get; set; }
        public string? TrainingDetails { get; set; }

        // Policy acknowledgements and declarations
        public bool AcknowledgedDeliveryPartnerAgreement { get; set; }
        public bool AcknowledgedCollectionProcedures { get; set; }
        public bool AcknowledgedCodeOfConduct { get; set; }
        public bool AcknowledgedFailedDeliveryPolicy { get; set; }
        public bool AcknowledgedAccidentAndLiabilityPolicy { get; set; }
        public bool AcknowledgedPaymentSchedule { get; set; }
        public string? PolicyVersionsOrLinks { get; set; }
        public bool ConfirmedInformationAccurate { get; set; }
        public bool ConfirmedDocumentAuthority { get; set; }
        public bool ConsentedToVerification { get; set; }
        public bool ConfirmedLegalCompliance { get; set; }
        public bool AcknowledgedNoGuaranteedAcceptance { get; set; }
        public bool AcceptedPlatformPolicies { get; set; }
        public bool AcknowledgedCompensationSeparation { get; set; }
        public bool AcknowledgedWorkingRelationship { get; set; }
        public bool ConsentedToPersonalInformationProcessing { get; set; }
        public bool AcknowledgedPopia { get; set; }

        // Electronic signature
        public string? SignatureFullLegalName { get; set; }
        public string? SignatureIdOrPassportNumber { get; set; }
        public string? SignatureEmailAddress { get; set; }
        public string? SignatureMobileNumber { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public string? SignatureMethod { get; set; }

        // Submission and administration
        public DateTime? SubmittedAt { get; set; }
        public int? ReviewedByUserId { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? AdminComments { get; set; }
        public string? RejectionReason { get; set; }
        public string? DocumentsRequestedMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public User? ReviewedByUser { get; set; }
        public ICollection<DriverApplicationDocument> Documents { get; set; } = new List<DriverApplicationDocument>();
        public ICollection<DriverApplicationHistory> History { get; set; } = new List<DriverApplicationHistory>();
    }
}