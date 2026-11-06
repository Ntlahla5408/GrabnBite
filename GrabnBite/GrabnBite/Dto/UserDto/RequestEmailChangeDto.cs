namespace GrabnBite.DTOs.User
{
    public class RequestEmailChangeDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewEmail { get; set; } = string.Empty;
    }
}