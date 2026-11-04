namespace GrabnBite.DTOs.Chat
{
    public sealed class ChatRequestDto
    {
        public string Message { get; set; } = string.Empty;

        public List<ChatMessageDto> History { get; set; } = new();
    }

    public sealed class ChatMessageDto
    {
        public string Role { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;
    }

    public sealed class ChatResponseDto
    {
        public string Reply { get; set; } = string.Empty;
    }
}
