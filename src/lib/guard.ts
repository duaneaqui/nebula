import "server-only";

import { timingSafeEqual } from "node:crypto";

const hits = new Map<string, number[]>();

export function tooManyRequests(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "local";
}

export function pluginAuthorized(request: Request) {
  const expected = process.env.STORE_PLUGIN_SECRET ?? "";
  if (expected.length < 24 || expected === "change-me") return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

export function requestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && /^https?:\/\/[A-Za-z0-9.:-]+$/.test(origin)) return origin;
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && /^https?:\/\/[A-Za-z0-9.:-]+$/.test(configured)) return configured.replace(/\/$/, "");
  const host = request.headers.get("host");
  if (host && /^[A-Za-z0-9.:-]+$/.test(host)) return `http://${host}`;
  return "http://localhost:3000";
}
