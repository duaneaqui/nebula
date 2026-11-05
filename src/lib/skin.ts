export type SkinPlayer = {
  username: string;
  uuid: string | null;
  bedrock: boolean;
  premium?: boolean;
  seenOnServer?: boolean;
};

/** Public head render — premium Java uses uuid; cracked/Bedrock fall back to name (Steve if unknown). */
export function playerHeadUrl(player: SkinPlayer, size = 64): string {
  if (player.bedrock) {
    return `https://mc-heads.net/avatar/MHF_Steve/${size}`;
  }
  const key = player.uuid || player.username;
  return `https://mc-heads.net/avatar/${encodeURIComponent(key)}/${size}`;
}
