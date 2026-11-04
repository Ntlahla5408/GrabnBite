using GrabnBite.DTOs.Chat;
using GrabnBite.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public sealed class ChatController : ControllerBase
    {
        private const int MaximumMessageLength = 2000;
        private const int MaximumHistoryItems = 8;
        private readonly IGeminiChatService _chatService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            IGeminiChatService chatService,
            ILogger<ChatController> logger)
        {
            _chatService = chatService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<ChatResponseDto>> SendMessage(
            [FromBody] ChatRequestDto request,
            CancellationToken cancellationToken)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new
                {
                    message = "Please enter a message."
                });
            }

            var message = request.Message.Trim();
            if (message.Length > MaximumMessageLength)
            {
                return BadRequest(new
                {
                    message = $"Your message must not exceed {MaximumMessageLength} characters."
                });
            }

            var history = (request.History ?? new List<ChatMessageDto>())
                .Where(item =>
                    item != null &&
                    !string.IsNullOrWhiteSpace(item.Content) &&
                    item.Content.Length <= 1500 &&
                    (string.Equals(item.Role, "user", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(item.Role, "assistant", StringComparison.OrdinalIgnoreCase)))
                .TakeLast(MaximumHistoryItems)
                .ToList();

            try
            {
                var reply = await _chatService.GenerateResponseAsync(
                    message,
                    history,
                    cancellationToken);

                return Ok(new ChatResponseDto
                {
                    Reply = reply
                });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (InvalidOperationException exception)
            {
                _logger.LogError(
                    exception,
                    "GrabnBite chat is not correctly configured or returned an invalid response.");

                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        message = "The support assistant is temporarily unavailable. Please try again later."
                    });
            }
            catch (HttpRequestException exception)
            {
                _logger.LogWarning(
                    exception,
                    "The GrabnBite support assistant could not reach its AI provider.");

                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        message = "The support assistant is temporarily unavailable. Please try again later."
                    });
            }
        }
    }
}
