# NebulaCraft Store

Self-hosted store for the NebulaCraft Paper server. Players buy ranks, Stardust, and crate keys. A plugin on the server runs the matching console commands after payment. Extra Lands claim chunks stay in the in-game `/claimshop` for Stardust.

There is no Tebex or CraftingStore subscription. Checkout uses **PayMongo QR Ph** (PHP — scan with GCash, Maya, or banks) and/or **PayPal** (USD or PHP). Optional Stripe remains if you have a supported Stripe account. You are the seller, so refunds, chargebacks, and tax are yours to handle.

## How delivery works

1. The player enters a Minecraft username. Java names are checked with Mojang. Bedrock names must include the Floodgate dot, like `.Alex`.
2. Checkout writes a pending order. PayMongo / PayPal / Stripe (or local test checkout) marks it paid.
3. Paid orders become allowlisted console commands. A rank purchase removes Voyager, Nova, Pulsar, Quasar, and Singularity, then sets the purchased rank. It does not use `parent clear`.
4. `NebulaStore` on the Paper server polls `GET /api/plugin/queue` with `STORE_PLUGIN_SECRET` and runs those commands. If `parent set` drops an Ascension `forge_*` group, the plugin puts that group back.
5. Crate keys wait until that player is online. Ranks and Stardust run even if they are offline.

The plugin refuses any command outside that allowlist, including operator permissions and gold.

## Run the site

```powershell
cd "C:\Users\Acer Nitro Gaming\Desktop\nebula website"
copy .env.example .env.local
npm install
npm run dev
```

Set `STORE_PLUGIN_SECRET` to a random string of at least 24 characters. For a local delivery test without Stripe, set `STORE_DEV_CHECKOUT=true`. That flag is ignored when `NODE_ENV` is `production`.

Prices and package text live in `src/lib/catalog.ts`. Change them before taking real money. The numbers there are starter defaults, not a pricing decision from the server docs.

Recent orders:

```powershell
npm run orders
```

## Payments

Catalog prices are USD cents. Set `PHP_PER_USD` (default `58`) for PHP conversion.

### PayMongo QR Ph

1. Create a PayMongo account and copy the secret key into `PAYMONGO_SECRET_KEY`.
2. Add a webhook to `https://<your-site>/api/paymongo/webhook` for `checkout_session.payment.paid`.
3. Put the webhook signing secret in `PAYMONGO_WEBHOOK_SECRET`.

Unregistered individuals can usually accept QR Ph. Named GCash/Maya buttons need a registered business later.

### PayPal

1. Create a REST app in the PayPal Developer dashboard.
2. Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_MODE` (`sandbox` or `live`).
3. After approval, PayPal returns to `/api/paypal/capture`, which captures and marks the order paid.

### Optional Stripe

1. Put `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env.local`.
2. Point Stripe at `https://<your-site>/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`.

Orders are stored in **Neon Postgres** (`DATABASE_URL`). Connect Neon from the Vercel Marketplace, then `vercel env pull --yes` so local `.env.local` gets the URL.

## Plugin

```powershell
cd "C:\Users\Acer Nitro Gaming\Desktop\nebula website\plugin\NebulaStore"
.\build.ps1 -Install
```

Restart the Paper server once so it writes `runtime/plugins/NebulaStore/config.yml`. Set `store-url` and the same `secret` as `STORE_PLUGIN_SECRET`, then `/nebulastore reload` or restart again.

`store-url` for a plugin on the same PC is `http://127.0.0.1:3000`. A public server needs the public `https` URL of this site.

After the first real rank purchase, run `/lp user <name> info` and confirm the `forge_*` group is still there.

## Not sold

Gold, vote keys, Seasonal keys, Ascendant keys, ItemEditor, operator permissions, and wildcard permissions. Ascension (Spark through Zenith) stays free.
