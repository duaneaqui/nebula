import { CopyAddress } from "@/components/copy-address";
import { discordUrl, serverAddress, supportEmail } from "@/lib/config";
import Link from "next/link";

export const metadata = { title: "Support" };

export default function SupportPage() {
  const email = supportEmail();
  const discord = discordUrl();
  const address = serverAddress();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="kicker">Help</p>
      <h1 className="mt-2 font-display text-5xl">Support</h1>
      <p className="mt-3 max-w-2xl text-[#3d5158]">
        Stuck on a purchase, rank, or join issue? Reach the team on Discord or email — include your Minecraft username
        and order id when you can.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {discord ? (
          <a
            href={discord}
            target="_blank"
            rel="noreferrer"
            className="plaza-card group flex flex-col gap-3 p-6 transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(18,52,60,0.1)]"
          >
            <span className="text-xs font-bold tracking-[0.16em] text-[#0f766e] uppercase">Discord</span>
            <span className="font-display text-2xl text-[#14242b]">Join the server</span>
            <span className="text-sm leading-6 text-[#3d5158]">
              Fastest way to reach staff for deliveries, ranks, and in-game help.
            </span>
            <span className="mt-auto pt-2 text-sm font-semibold text-[#0f766e] underline decoration-[#0f766e]/35 underline-offset-4 group-hover:decoration-[#0f766e]">
              discord.gg/GYpvPaMar
            </span>
          </a>
        ) : null}
        {email ? (
          <a
            href={`mailto:${email}?subject=NebulaCraft%20support`}
            className="plaza-card group flex flex-col gap-3 p-6 transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(18,52,60,0.1)]"
          >
            <span className="text-xs font-bold tracking-[0.16em] text-[#b42378] uppercase">Email</span>
            <span className="font-display text-2xl text-[#14242b]">Write support</span>
            <span className="text-sm leading-6 text-[#3d5158]">
              Best for billing and order ids. We reply as soon as we can.
            </span>
            <span className="mt-auto break-all pt-2 text-sm font-semibold text-[#b42378] underline decoration-[#b42378]/35 underline-offset-4 group-hover:decoration-[#b42378]">
              {email}
            </span>
          </a>
        ) : null}
      </div>

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
            Payments go through PayMongo (QR Ph) and/or PayPal. This store never sees your wallet PIN or PayPal
            password. If a charge succeeded and the commands did not, send the order id from the confirmation page
            {email ? (
              <>
                {" "}
                to{" "}
                <a className="font-semibold underline" href={`mailto:${email}`}>
                  {email}
                </a>
              </>
            ) : (
              " to staff"
            )}
            {discord ? (
              <>
                {" "}
                or ping us on{" "}
                <a className="font-semibold underline" href={discord} target="_blank" rel="noreferrer">
                  Discord
                </a>
              </>
            ) : null}
            .
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
