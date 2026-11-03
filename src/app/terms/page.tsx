export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="kicker">Store</p>
      <h1 className="mt-2 font-display text-5xl">Terms</h1>
      <div className="mt-6 grid gap-4 text-sm leading-7 text-[#314249]">
        <p>
          Packages on this store are digital goods for the NebulaCraft Minecraft server. They are delivered to the
          username you enter at checkout. You are responsible for that username. A Bedrock delivery uses the Floodgate
          name, including the leading dot.
        </p>
        <p>
          A paid rank replaces any other paid rank on the account. It does not remove the free Ascension track. Rank
          kits do not stack. Applied cosmetics stay on the account after you use them.
        </p>
        <p>
          Once the server has run the delivery commands, the purchase is complete and is not refunded. If a command
          fails, contact support with the order id before asking your card issuer to reverse the charge.
        </p>
        <p>Prices can change. The price you pay is the price shown at checkout. Chargebacks on delivered orders may lead to the package being removed.</p>
        <p>NebulaCraft is not affiliated with Mojang Studios or Microsoft. Minecraft is their trademark.</p>
      </div>
    </div>
  );
}
