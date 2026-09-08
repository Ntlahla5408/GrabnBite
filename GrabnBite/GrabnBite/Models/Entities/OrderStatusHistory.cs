using System.Net.NetworkInformation;

namespace GrabnBite.Models.Entities
{
    public class OrderStatusHistory
    {
        public int OrderStatusHistoryId { get; set; }
        public int OrderId { get; set; }
        public int Status { get; set; }
        public int ChangedByUserId { get; set; }
        public int ChangedAt { get; set; }
        public int Notes { get; set; }
    }
}
