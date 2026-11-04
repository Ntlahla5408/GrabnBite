namespace GrabnBite.Models.Entities
{
    public class RestaurantAgreementAcceptanceDocument
    {
        public int AgreementAcceptanceDocumentId { get; set; }
        public int RestaurantAgreementAcceptanceId { get; set; }
        public int? PolicyDocumentId { get; set; }
        public string DocumentTitle { get; set; } = string.Empty;
        public int DocumentVersion { get; set; }
        public DateTime? EffectiveDate { get; set; }
        public string ContentHash { get; set; } = string.Empty;

        // Snapshot of the accepted document's storage location.
        public string? StoragePath { get; set; }

        public RestaurantAgreementAcceptance RestaurantAgreementAcceptance { get; set; } = null!;
        public PolicyDocument? PolicyDocument { get; set; }
    }
}
