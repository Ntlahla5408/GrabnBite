namespace GrabnBite.Services
{
    /// <summary>
    /// Development-only payment simulator. It never contacts a payment provider
    /// and must not be enabled as a production payment processor.
    /// </summary>
    public sealed class FakePaymentGateway
    {
        public FakePaymentResult Complete(decimal amount, bool succeed, string paymentReference)
        {
            if (amount <= 0)
                throw new ArgumentOutOfRangeException(nameof(amount), "Payment amount must be greater than zero.");

            if (string.IsNullOrWhiteSpace(paymentReference))
                throw new ArgumentException("A payment reference is required.", nameof(paymentReference));

            return new FakePaymentResult(
                Succeeded: succeed,
                TransactionReference: $"FAKE-{paymentReference}",
                Message: succeed
                    ? "Simulated payment succeeded. No money was charged."
                    : "Simulated payment failed. No money was charged.");
        }
    }

    public sealed record FakePaymentResult(
        bool Succeeded,
        string TransactionReference,
        string Message);
}
