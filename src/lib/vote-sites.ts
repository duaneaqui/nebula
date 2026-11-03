export type VoteSite = {
  id: string;
  name: string;
  blurb: string;
  /** Empty or "#" until the real NebulaCraft listing vote URL is ready */
  href: string;
  placeholder?: boolean;
};

/**
 * Vote buttons on /vote.
 * After you create each listing, set href to the vote page and placeholder: false.
 * Server IP for listings: nebulacraft.atbp.fun · Votifier port 8192
 * (public key + token: /votekey in-game or SimpleVote config)
 */
export const VOTE_SITES: VoteSite[] = [
  {
    id: "minecraft-servers-org",
    name: "MinecraftServers.org",
    blurb: "Daily vote — claim your vote key in game after.",
    href: "#",
    placeholder: true,
  },
  {
    id: "minecraft-mp",
    name: "Minecraft-MP",
    blurb: "Public server list. Vote, then join for the reward.",
    href: "#",
    placeholder: true,
  },
  {
    id: "planet-minecraft",
    name: "Planet Minecraft",
    blurb: "Server listing vote. One click a day helps the plaza climb.",
    href: "#",
    placeholder: true,
  },
  {
    id: "topg",
    name: "TopG",
    blurb: "Top gaming servers board. Keeps NebulaCraft discoverable.",
    href: "#",
    placeholder: true,
  },
  {
    id: "minecraft-server-list",
    name: "Minecraft Server List",
    blurb: "Another daily vote slot for vote crate keys.",
    href: "#",
    placeholder: true,
  },
  {
    id: "minecraft-buzz",
    name: "minecraft.buzz",
    blurb: "Buzz board listing — vote once per day.",
    href: "#",
    placeholder: true,
  },
];
