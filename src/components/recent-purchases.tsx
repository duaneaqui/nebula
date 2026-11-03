"use client";

type Supporter = {
  username: string;
  summary: string;
  at: string;
};

function headUrl(username: string, size = 72) {
  const clean = username.trim();
  if (!clean || clean.startsWith(".")) {
    return `https://mc-heads.net/avatar/MHF_Steve/${size}`;
  }
  return `https://mc-heads.net/avatar/${encodeURIComponent(clean)}/${size}`;
}

export function RecentPurchases({ supporters }: { supporters: Supporter[] }) {
  if (supporters.length === 0) {
    return (
      <section className="supporters-board plaza-card p-6 sm:p-8">
        <Header live={false} />
        <p className="mt-6 text-sm leading-6 text-[#5c6d73]">
          No store deliveries yet. The first paid packages will light up this rail.
        </p>
      </section>
    );
  }

  return (
    <section className="supporters-board plaza-card p-0">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#12343c]/8 px-6 py-5 sm:px-8">
        <Header live />
      </div>
      <ul className="supporters-rail flex flex-wrap gap-3 px-6 pt-5 pb-10 sm:px-8">
        {supporters.map((supporter) => (
          <li key={`${supporter.username}-${supporter.at}`} className="supporters-chip group relative shrink-0">
            <button
              type="button"
              className="supporters-head"
              aria-label={`${supporter.username} bought ${supporter.summary}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={headUrl(supporter.username)}
                alt=""
                width={72}
                height={72}
                decoding="async"
                className="h-[72px] w-[72px] rounded-2xl object-cover"
                style={{ imageRendering: "pixelated" }}
              />
            </button>
            <span className="supporters-tip" role="tooltip">
              <span className="block font-semibold text-[#f4fbf9]">{supporter.username}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-[#9ee6dc]">{supporter.summary}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Header({ live }: { live: boolean }) {
  return (
    <div className="flex w-full flex-wrap items-end justify-between gap-3">
      <div>
        <p className="kicker">Community</p>
        <h2 className="mt-1 font-display text-3xl text-[#14242b] sm:text-4xl">Recent purchases</h2>
        <p className="mt-1 text-sm text-[#5c6d73]">Heads from the plaza — hover a face for their IGN.</p>
      </div>
      {live ? (
        <span className="supporters-live">
          <span className="supporters-live-dot" aria-hidden="true" />
          Live
        </span>
      ) : null}
    </div>
  );
}
