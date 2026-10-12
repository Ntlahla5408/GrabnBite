# GrabnBite

GrabnBite is a food-delivery application with a .NET API and an Expo/React Native mobile app.

## Repository layout

- `GrabnBite/` — ASP.NET Core Web API and backend project.
- `GrabnBiteMobile/` — the canonical Expo mobile application. Keep its app source in `GrabnBiteMobile/src/`.
- `docs/YOCO_PAYMENT_SETUP.md` — Yoco payment configuration and pre-live test checklist.

The mobile app is intentionally kept inside `GrabnBiteMobile/`. Do not create a second Expo project at the repository root.

## Run the mobile app

From the repository root:

```bash
cd GrabnBiteMobile
npm ci
npm start
```

Use `npm run android`, `npm run ios`, or `npm run web` as appropriate for your development environment.

## Run the backend

Open the backend solution/project under `GrabnBite/` in Visual Studio, or use the .NET CLI from the relevant project directory. Check the backend project and environment configuration before running it.

Do not commit API keys, database passwords, JWT signing keys, or other secrets. Use local user-secrets or deployment environment variables.

## Payments

Read [the Yoco payment setup guide](docs/YOCO_PAYMENT_SETUP.md) before configuring or testing payment flows. Successful return navigation from the payment provider is not proof of payment; the backend must verify payment status with Yoco.
