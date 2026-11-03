namespace GrabnBite.Dto.AuthenticationDto
{
    public class RegisterUserDto
    {
        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        // Public registration is limited to Customer or Restaurant accounts.
        // The API never accepts privileged roles such as Admin or Driver.
        public string AccountType { get; set; } = "Customer";
    }
}