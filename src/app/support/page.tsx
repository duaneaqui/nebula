import { CopyAddress } from "@/components/copy-address";
import { serverAddress, supportEmail } from "@/lib/config";
import Link from "next/link";

export const metadata = { title: "Support" };

export default function SupportPage() {
  const email = supportEmail();
  const address = serverAddress();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="kicker">Help</p>
      <h1 className="mt-2 font-display text-5xl">Support</h1>
      <div className="mt-6 grid gap-4">
        <section className="plaza-card p-6">
          <h2 className="font-display text-2xl">How to join</h2>
          <p className="mt-3 text-sm leading-6 text-[#3d5158]">
            NebulaCraft is open for both Java Edition and Bedrock Edition.
          </p>
          {address ? (
            <div className="mt-4">
              <CopyAddress address={address} />
            </div>
          ) : null}
        </section>
        <section className="plaza-card p-6">
          <h2 className="font-display text-2xl">The package has not arrived</h2>
          <ol className="mt-3 grid list-decimal gap-2 pl-5 text-sm leading-6 text-[#3d5158]">
            <li>Open the order page and confirm the Minecraft username.</li>
            <li>Give the server a minute. It picks up paid orders on a short timer.</li>
            <li>Join the server. Crate keys wait until that player is online.</li>
            <li>Ranks and Stardust can arrive while you are offline.</li>
            <li>Extra claim chunks are only bought in game with Stardust via /claimshop.</li>
          </ol>
        </section>
        <section className="plaza-card p-6">
          <h2 className="font-display text-2xl">Billing</h2>
          <p className="mt-3 text-sm leading-6 text-[#3d5158]">
            Payments go through PayMongo (QR Ph) and/or PayPal. This store never sees your wallet PIN or PayPal password. If a charge succeeded and the
            commands did not, send the order id from the confirmation page.
            {email ? (
              <>
                {" "}
                Email <a className="underline" href={`mailto:${email}`}>{email}</a>.
              </>
            ) : (
              " Contact the server staff with that order id."
            )}
          </p>
        </section>
        <section className="plaza-card p-6">
          <h2 className="font-display text-2xl">What a rank changes</h2>
          <p className="mt-3 text-sm leading-6 text-[#3d5158]">
            A paid rank replaces Voyager, Nova, Pulsar, Quasar, or Singularity. It does not replace Ascension. The kit
            for the new rank is the only paid kit you keep.
          </p>
          <Link href="/ranks" className="mt-3 inline-block text-sm font-semibold underline">
            Open the comparison
          </Link>
        </section>
      </div>
    </div>
  );
}
