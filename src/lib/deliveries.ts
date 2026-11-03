import "server-only";

import { CRATE_KEYS, PAID_RANKS, type Product } from "@/lib/catalog";

const PLAYER = "[A-Za-z0-9_.]{1,16}";
const RANK = PAID_RANKS.join("|");
const KEY = CRATE_KEYS.join("|");

const ALLOWED = [
  new RegExp(`^lp user ${PLAYER} parent remove (${RANK})$`),
  new RegExp(`^lp user ${PLAYER} parent set (${RANK})$`),
  new RegExp(`^stardust give ${PLAYER} [1-9][0-9]{0,6}$`),
  new RegExp(`^cratekey give ${PLAYER} (${KEY}) [1-9][0-9]{0,2}$`),
];

export type ExpandedCommand = {
  command: string;
  requireOnline: boolean;
};

export function expandCommands(product: Product, quantity: number, player: string): ExpandedCommand[] {
  if (!/^[A-Za-z0-9_.]{1,16}$/.test(player) || player.includes("..")) {
    throw new Error("Username can't be used in a delivery command.");
  }

  const templates = commandTemplates(product, quantity);
  const requireOnline = product.delivery.type === "key";

  return templates.map((template) => {
    const command = template.replaceAll("{player}", player);
    if (command.includes("\n") || command.includes("\r") || !ALLOWED.some((pattern) => pattern.test(command))) {
      throw new Error("Blocked a delivery command that is not on the allowlist.");
    }
    return { command, requireOnline };
  });
}

function commandTemplates(product: Product, quantity: number): string[] {
  const delivery = product.delivery;

  if (delivery.type === "rank") {
    if (quantity !== 1) throw new Error("A rank can only be bought once per checkout.");
    return [
      ...PAID_RANKS.map((group) => `lp user {player} parent remove ${group}`),
      `lp user {player} parent set ${delivery.group}`,
    ];
  }

  if (delivery.type === "stardust") {
    const amount = delivery.amount * quantity;
    if (!Number.isInteger(amount) || amount < 1 || amount > 1_000_000) {
      throw new Error("Stardust amount is out of range.");
    }
    return [`stardust give {player} ${amount}`];
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new Error("Key quantity is out of range.");
  }
  return [`cratekey give {player} ${delivery.keyId} ${quantity}`];
}
