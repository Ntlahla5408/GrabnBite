namespace GrabnBite.Models.Entities
{
    public enum RestaurantApplicationStatus
    {
        Draft,
        PendingReview,
        DocumentsRequired,
        UnderVerification,
        Approved,
        Rejected
    }

    public enum RestaurantDocumentType
    {
        CipcCertificate,
        FoodPremisesCertificate,
        IdentityOrAuthority,
        BankConfirmation,
        Other
    }

    public enum RestaurantVerificationStatus
    {
        Pending,
        Approved,
        Rejected,
        NotApplicable
    }

    public enum RestaurantReviewCategory
    {
        BusinessInformation,
        BusinessDocuments,
        FoodSafety,
        Banking,
        Agreement,
        Commission
    }
}
