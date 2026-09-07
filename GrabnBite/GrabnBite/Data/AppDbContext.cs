using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
                
        }
    }
}
