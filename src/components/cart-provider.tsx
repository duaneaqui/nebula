"use client";

import { PlayerHead } from "@/components/player-head";
import { getProduct } from "@/lib/catalog";
import type { SkinPlayer } from "@/lib/skin";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Line = { productId: string; quantity: number };

type CartContextValue = {
  ready: boolean;
  username: string;
  player: SkinPlayer | null;
  lines: Line[];
  count: number;
  add: (productId: string, quantity: number) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  ensureUsername: () => Promise<boolean>;
  changeUsername: () => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nebula.store";

type PlayerPayload = SkinPlayer;

export function CartProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerPayload | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PlayerPayload | null>(null);
  const [checking, setChecking] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const pending = useRef<((ok: boolean) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSeq = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          username?: string;
          uuid?: string | null;
          bedrock?: boolean;
          player?: PlayerPayload;
          lines?: Line[];
        };
        if (saved.player?.username) {
          setPlayer(saved.player);
        } else if (typeof saved.username === "string" && saved.username) {
          setPlayer({
            username: saved.username,
            uuid: typeof saved.uuid === "string" ? saved.uuid : null,
            bedrock: Boolean(saved.bedrock) || saved.username.startsWith("."),
          });
        }
        if (Array.isArray(saved.lines)) {
          setLines(
            saved.lines.filter(
              (line) =>
                line && typeof line.productId === "string" && Number.isInteger(line.quantity) && getProduct(line.productId),
            ),
          );
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ player, lines }));
  }, [ready, player, lines]);

  // Refresh Mojang uuid for saved Java names that predate skin storage.
  const needsUuid = Boolean(ready && player?.username && !player.bedrock && !player.uuid);
  useEffect(() => {
    if (!needsUuid || !player?.username) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/player?name=${encodeURIComponent(player.username)}`);
        const data = (await response.json()) as PlayerPayload & { error?: string };
        if (cancelled || !response.ok || !data.username) return;
        setPlayer({ username: data.username, uuid: data.uuid ?? null, bedrock: Boolean(data.bedrock) });
      } catch {
        /* keep saved name */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsUuid, player?.username]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (dialogOpen) inputRef.current?.focus();
  }, [dialogOpen]);

  // Live Mojang check + head preview while typing.
  useEffect(() => {
    if (!dialogOpen) return;
    const name = draft.trim();
    if (name.length < 3) {
      setPreview(null);
      setPreviewing(false);
      setDialogError(null);
      return;
    }

    const seq = ++previewSeq.current;
    setPreviewing(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/player?name=${encodeURIComponent(name)}`);
          const data = (await response.json()) as PlayerPayload & { error?: string };
          if (seq !== previewSeq.current) return;
          if (!response.ok || !data.username) {
            setPreview(null);
            setDialogError(data.error ?? "Could not check that username.");
            setPreviewing(false);
            return;
          }
          setPreview({ username: data.username, uuid: data.uuid ?? null, bedrock: Boolean(data.bedrock) });
          setDialogError(null);
        } catch {
          if (seq !== previewSeq.current) return;
          setPreview(null);
          setDialogError("Could not check that username.");
        } finally {
          if (seq === previewSeq.current) setPreviewing(false);
        }
      })();
    }, 420);

    return () => window.clearTimeout(timer);
  }, [draft, dialogOpen]);

  const finishDialog = useCallback((ok: boolean) => {
    setDialogOpen(false);
    setChecking(false);
    setPreview(null);
    setPreviewing(false);
    setDialogError(null);
    pending.current?.(ok);
    pending.current = null;
  }, []);

  const openUsernameDialog = useCallback((seed: string) => {
    setDraft(seed);
    setDialogError(null);
    setPreview(null);
    setDialogOpen(true);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
    });
  }, []);

  const ensureUsername = useCallback(() => {
    if (player?.username) return Promise.resolve(true);
    return openUsernameDialog("");
  }, [player, openUsernameDialog]);

  const changeUsername = useCallback(() => openUsernameDialog(player?.username ?? ""), [player, openUsernameDialog]);

  const add = useCallback(
    async (productId: string, quantity: number) => {
      const product = getProduct(productId);
      if (!product) return;
      const ok = await ensureUsername();
      if (!ok) return;

      setLines((current) => {
        if (product.delivery.type === "rank") {
          const previous = current.find(
            (line) => line.productId !== productId && getProduct(line.productId)?.delivery.type === "rank",
          );
          const withoutRanks = current.filter((line) => getProduct(line.productId)?.delivery.type !== "rank");
          setNotice(
            previous
              ? `${product.name} replaced ${getProduct(previous.productId)?.name ?? "the other rank"} in your cart.`
              : `${product.name} added. In game it replaces any lower paid rank.`,
          );
          return [...withoutRanks, { productId, quantity: 1 }];
        }

        const existing = current.find((line) => line.productId === productId);
        const nextQuantity = Math.min(product.maxQuantity, (existing?.quantity ?? 0) + quantity);
        setNotice(`${product.name} added.`);
        if (existing) {
          return current.map((line) => (line.productId === productId ? { ...line, quantity: nextQuantity } : line));
        }
        return [...current, { productId, quantity: nextQuantity }];
      });
    },
    [ensureUsername],
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const product = getProduct(productId);
    if (!product) return;
    const next = Math.min(product.maxQuantity, Math.max(1, quantity));
    setLines((current) => current.map((line) => (line.productId === productId ? { ...line, quantity: next } : line)));
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const saveUsername = async () => {
    if (!preview) {
      setDialogError("Wait for the name check, or fix the username.");
      return;
    }
    setChecking(true);
    setPlayer(preview);
    setNotice(`Purchases will be delivered to ${preview.username}.`);
    finishDialog(true);
  };

  const username = player?.username ?? "";
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const value = useMemo<CartContextValue>(
    () => ({
      ready,
      username,
      player,
      lines,
      count,
      add,
      setQuantity,
      remove,
      clear,
      ensureUsername,
      changeUsername,
    }),
    [ready, username, player, lines, count, add, setQuantity, remove, clear, ensureUsername, changeUsername],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {notice ? (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-full bg-[#12343c] px-4 py-3 text-center text-sm text-[#f6f0e4] shadow-lg"
        >
          {notice}
        </div>
      ) : null}
      {dialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#102026]/55 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="username-title"
            className="plaza-card w-full max-w-md p-6"
          >
            <p className="kicker">Deliver to</p>
            <h2 id="username-title" className="mt-2 text-2xl">
              Which Minecraft name gets this?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#3d5158]">
              Java names are checked against Mojang&apos;s account list. Bedrock names on this server start with a dot,
              like .Alex. The purchase goes to this name, so type it carefully.
            </p>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void saveUsername();
              }}
            >
              <label className="grid gap-1 text-sm font-semibold" htmlFor="minecraft-name">
                Minecraft username
                <input
                  ref={inputRef}
                  id="minecraft-name"
                  className="field font-normal"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={16}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              {preview ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[#12343c]/12 bg-[#fff9f0] px-3 py-2.5">
                  <PlayerHead player={preview} size={40} rounded="md" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#12343c]">{preview.username}</p>
                    <p className="text-xs font-bold tracking-wide text-[#0f766e] uppercase">
                      {preview.bedrock ? "Bedrock · Floodgate name" : "Java · skin matched"}
                    </p>
                  </div>
                </div>
              ) : previewing ? (
                <p className="text-sm text-[#5c6d73]">Checking Mojang…</p>
              ) : null}
              {dialogError ? <p className="text-sm text-[#9d2348]">{dialogError}</p> : null}
              <div className="flex gap-2">
                <button className="btn btn-orange" type="submit" disabled={checking || !preview}>
                  {checking ? "Saving…" : "Use this name"}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => finishDialog(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
