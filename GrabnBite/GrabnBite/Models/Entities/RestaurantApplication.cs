namespace GrabnBite.Models.Entities
{
    public class RestaurantApplication
    {
        public int RestaurantApplicationId { get; set; }

        public int UserId { get; set; }

        public string ApplicationReference { get; set; } = string.Empty;

        public RestaurantApplicationStatus Status { get; set; }
            = RestaurantApplicationStatus.Draft;

        // Business information
        public string? TradingName { get; set; }
        public string? RegisteredBusinessName { get; set; }
        public string? CipcRegistrationNumber { get; set; }
        public string? RestaurantCategory { get; set; }
        public string? PhysicalAddress { get; set; }
        public string? City { get; set; }
        public string? RestaurantContactNumber { get; set; }
        public string? BusinessEmail { get; set; }
        public string? WebsiteOrSocialMediaUrl { get; set; }

        // Authorised representative
        public string? RepresentativeFullName { get; set; }
        public string? RepresentativePosition { get; set; }
        public string? RepresentativeMobileNumber { get; set; }
        public string? RepresentativeEmail { get; set; }
        public bool? HasAuthorityToRepresent { get; set; }

        // Fulfilment preferences
        public bool? OffersCustomerCollection { get; set; }
        public bool? OffersRestaurantDelivery { get; set; }
        public bool? OffersGrubnBiteDelivery { get; set; }
        public int? AveragePreparationTimeMinutes { get; set; }
        public decimal? MaximumDeliveryDistanceKm { get; set; }
        public string? DeliveryInstructions { get; set; }

        // Commission offer
        public bool? CommissionOfferAccepted { get; set; }

        // Submission and review
        public DateTime? SubmittedAt { get; set; }
        public int? ReviewedByUserId { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? AdminComments { get; set; }
        public string? RejectionReason { get; set; }
        public string? DocumentsRequestedMessage { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Relationships
        public User User { get; set; } = null!;
        public User? ReviewedByUser { get; set; }
        public Restaurant? Restaurant { get; set; }

        public ICollection<RestaurantDocument> Documents { get; set; }
            = new List<RestaurantDocument>();

        public RestaurantBankingDetail? BankingDetails { get; set; }

        public ICollection<RestaurantAgreementAcceptance> AgreementAcceptances { get; set; }
            = new List<RestaurantAgreementAcceptance>();

        public ICollection<RestaurantOperatingHour> OperatingHours { get; set; }
            = new List<RestaurantOperatingHour>();

        public ICollection<RestaurantApplicationHistory> History { get; set; }
            = new List<RestaurantApplicationHistory>();

        public ICollection<RestaurantApplicationReviewItem> ReviewItems { get; set; }
            = new List<RestaurantApplicationReviewItem>();
    }
}
