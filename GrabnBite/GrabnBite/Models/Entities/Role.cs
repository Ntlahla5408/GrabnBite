namespace GrabnBite.Models.Entities
{
    public class Role
    {
        public int RoleId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public ICollection<User> Users { get; set; } = new List<User>();
    }
}