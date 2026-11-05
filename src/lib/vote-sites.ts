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
 * Server IP for listings: nebulacraft.atbp.fun · Votifier port 8192
 * (public key + token: /votekey in-game or SimpleVote config)
 */
export const VOTE_SITES: VoteSite[] = [
  {
    id: "minecraft-mp",
    name: "Minecraft-MP",
    blurb: "Public server list. Vote, then join for the reward.",
    href: "https://minecraft-mp.com/server/366421/vote/",
  },
  {
    id: "topg",
    name: "TopG",
    blurb: "Top gaming servers board. Keeps NebulaCraft discoverable.",
    href: "https://topg.org/minecraft-servers/server-688000#vote",
  },
  {
    id: "planet-minecraft",
    name: "Planet Minecraft",
    blurb: "Server listing vote. One click a day helps the plaza climb.",
    href: "https://www.planetminecraft.com/server/nebulacraft-7092794/vote/",
  },
  {
    id: "minecraft-server-list",
    name: "Minecraft Server List",
    blurb: "Another daily vote slot for vote crate keys.",
    href: "https://minecraft-server-list.com/server/524717/vote/",
  },
  {
    id: "minecraft-servers-org",
    name: "MinecraftServers.org",
    blurb: "Daily vote — claim your vote key in game after.",
    href: "https://minecraftservers.org/vote/695734",
  },
  {
    id: "minecraft-buzz",
    name: "minecraft.buzz",
    blurb: "Buzz board listing — vote once per day.",
    href: "https://minecraft.buzz/vote/nebulacraft",
  },
  {
    id: "minerank",
    name: "MineRank",
    blurb: "PH / ranked listing — vote daily for crate keys.",
    href: "https://www.minerank.com/nebulacraftph/vote",
  },
];
