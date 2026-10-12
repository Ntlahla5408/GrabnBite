# GrabnBite Yoco payment configuration

This branch hardens the Yoco Checkout API flow. Do not merge or deploy until the checks below are completed.

## Render environment variables

Configure these in the Render API service. Keep secret values out of GitHub.

- `Yoco__SecretKey`: Yoco Checkout API secret key (use test key while testing).
- `Yoco__BaseUrl`: `https://payments.yoco.com` unless Yoco instructs otherwise.
- `Yoco__SuccessUrl`: public HTTPS page that can receive `?orderId=...`, e.g. `https://grubnbite.com/payment-success`.
- `Yoco__CancelUrl`: public HTTPS page that can receive `?orderId=...`, e.g. `https://grubnbite.com/payment-cancelled`.
- `Yoco__WebhookSecret`: signing secret for the webhook registered with Yoco (usually starts with `whsec_`).

The success/cancel URLs above are configuration examples, not proof that those web pages are already hosted. The verified domain must point to a real website or hosted return page before using it for live checkout. The browser redirect must never be treated as payment proof.

## Mobile app API URL

The mobile client defaults to `https://grubnbite.onrender.com`. For local development or another API host, set `EXPO_PUBLIC_API_URL` in the Expo environment (for example, `https://<your-ngrok-host>` when testing a local API). Do not put Yoco secret keys in this variable or in the app.

## Register the webhook in Yoco

Register this HTTPS endpoint in the Yoco Checkout API configuration:

`https://grubnbite.onrender.com/api/Payment/yoco/webhook`

Use the signing secret provided for that webhook as `Yoco__WebhookSecret`. The endpoint verifies the Standard Webhooks signature and timestamp, then asks Yoco's server API for the checkout status and validates checkout ID, amount in cents, and currency before updating the payment.

## Payment confirmation behaviour

- The app's authenticated confirmation request checks the checkout directly with Yoco.
- The return screen must not display a confirmed-success state unless the API confirms `PAID`.
- Payment simulation endpoints were removed so customers cannot mark an order paid through a test endpoint.
- Retry is allowed only when the prior checkout is absent or Yoco confirms it failed/cancelled. Unknown or still-active checkouts are not replaced automatically to avoid duplicate charges.

## Required validation before merge/live payments

1. Run `dotnet test` for the backend solution and the frontend TypeScript checks/build.
2. Test with Yoco sandbox keys: successful payment, cancellation, failed payment, duplicate webhook delivery, invalid webhook signature, expired webhook timestamp, amount/currency mismatch, and retry after a confirmed failure.
3. Confirm that the success/cancel return pages are actually hosted on the verified HTTPS domain.
4. Configure the webhook in Yoco and confirm delivery logs.
5. Use live keys only after sandbox verification. Never place secret keys in source control or mobile code.
