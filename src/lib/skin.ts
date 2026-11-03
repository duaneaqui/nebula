export type SkinPlayer = {
  username: string;
  uuid: string | null;
  bedrock: boolean;
};

/** Public head render — Java uses Mojang uuid; Bedrock has no Mojang skin, so Steve. */
export function playerHeadUrl(player: SkinPlayer, size = 64): string {
  if (player.bedrock || !player.uuid) {
    return `https://mc-heads.net/avatar/MHF_Steve/${size}`;
  }
  return `https://mc-heads.net/avatar/${encodeURIComponent(player.uuid)}/${size}`;
}
