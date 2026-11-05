namespace GrabnBite.Models.Entities
{
    public enum DriverApplicationStatus
    {
        Draft,
        PendingReview,
        DocumentsRequired,
        UnderVerification,
        Approved,
        Rejected
    }

    public enum DriverVerificationStatus
    {
        Pending,
        Approved,
        Rejected,
        NotApplicable
    }
}