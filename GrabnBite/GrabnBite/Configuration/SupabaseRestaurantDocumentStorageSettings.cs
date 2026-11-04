namespace GrabnBite.Configuration
{
    public sealed class SupabaseRestaurantDocumentStorageSettings
    {
        public string ProjectUrl { get; set; } = string.Empty;
        public string ServiceRoleKey { get; set; } = string.Empty;
        public string BucketName { get; set; } = "grabnbite-restaurant-documents";
        public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;
    }
}
