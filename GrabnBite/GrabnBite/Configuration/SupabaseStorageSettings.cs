namespace GrabnBite.Configuration
{
    public sealed class SupabaseStorageSettings
    {
        public string ProjectUrl { get; set; } = string.Empty;

        public string ServiceRoleKey { get; set; } = string.Empty;

        public string BucketName { get; set; } = "grabnbite-policies";

        public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;
    }
}