export type VoteSite = {
  id: string;
  name: string;
  blurb: string;
  /** Empty or "#" until the real listing URL is ready */
  href: string;
  placeholder?: boolean;
};

/** Swap `href` for the real vote URL when each listing is live. */
export const VOTE_SITES: VoteSite[] = [
  {
    id: "minecraft-servers-org",
    name: "MinecraftServers.org",
    blurb: "Daily vote — claim your vote key in game after.",
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
    id: "minecraft-mp",
    name: "Minecraft-MP",
    blurb: "Public server list. Vote, then join for the reward.",
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
    id: "server-list",
    name: "Minecraft Server List",
    blurb: "Another daily vote slot for Ascendant / vote crate keys.",
    href: "#",
    placeholder: true,
  },
  {
    id: "minehut-list",
    name: "ServerList101",
    blurb: "Placeholder listing — link coming soon.",
    href: "#",
    placeholder: true,
  },
  {
    id: "craftlist",
    name: "Craftlist",
    blurb: "Placeholder listing — link coming soon.",
    href: "#",
    placeholder: true,
  },
];
