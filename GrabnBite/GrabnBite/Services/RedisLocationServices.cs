using System.Text.Json;
using StackExchange.Redis;

namespace GrabnBite.Services
{
    public class RedisLocationService
    {
        private readonly IDatabase _database;

        public RedisLocationService(IConnectionMultiplexer redis)
        {
            _database = redis.GetDatabase();
        }

        private string GetKey(int deliveryId)
        {
            return $"delivery:{deliveryId}:location";
        }

        public async Task SaveLocationAsync(
            int deliveryId,
            double latitude,
            double longitude)
        {
            var location = new
            {
                deliveryId,
                latitude,
                longitude,
                updatedAt = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(location);

            await _database.StringSetAsync(
                GetKey(deliveryId),
                json,
                TimeSpan.FromMinutes(30));
        }

        public async Task<object?> GetLocationAsync(int deliveryId)
        {
            var value = await _database.StringGetAsync(
                GetKey(deliveryId));

            if (value.IsNullOrEmpty)
            {
                return null;
            }

            return JsonSerializer.Deserialize<object>(
                value.ToString());
        }

        public async Task DeleteLocationAsync(int deliveryId)
        {
            await _database.KeyDeleteAsync(
                GetKey(deliveryId));
        }
    }
}