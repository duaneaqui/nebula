export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="kicker">Store</p>
      <h1 className="mt-2 font-display text-5xl">Privacy</h1>
      <div className="mt-6 grid gap-4 text-sm leading-7 text-[#314249]">
        <p>
          Checkout stores the email you enter, the Minecraft username, the Mojang id when the account is Java, the
          packages, and the payment status. Wallet and PayPal credentials go to PayMongo / PayPal (or Stripe if enabled), not to this store.
        </p>
        <p>
          The game server plugin receives paid delivery commands: the username and the specific grant, such as a rank
          or a Stardust amount. Recent paid usernames and package names may be shown on the store as recent deliveries.
        </p>
        <p>The order page is available to anyone with the order link. Treat that link like a receipt.</p>
      </div>
    </div>
  );
}
