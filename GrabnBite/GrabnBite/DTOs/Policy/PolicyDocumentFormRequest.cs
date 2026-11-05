using Microsoft.AspNetCore.Http;

namespace GrabnBite.DTOs.Policy
{
    public sealed class PolicyDocumentFormRequest
    {
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Status { get; set; } = "Draft";

        public string Audience { get; set; } = "Customer";

        public DateTime? EffectiveDate { get; set; }

        public IFormFile? PdfFile { get; set; }
    }
}