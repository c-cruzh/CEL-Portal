import crypto from "node:crypto";
import type { Request } from "express";
import { getClerkProxyHost } from "../middlewares/clerkProxyMiddleware";

export type IcsEvent = {
  uid: string;
  title: string;
  description?: string | null;
  /** All-day date in UTC; only YYYY-MM-DD portion is used. */
  date: Date;
  /** ISO date-time used for DTSTAMP / LAST-MODIFIED. */
  updatedAt?: Date;
  category?: string | null;
};

function getFeedSecret(): string {
  const explicit = process.env.CALENDAR_FEED_SECRET;
  if (explicit && explicit.trim().length > 0) return explicit;
  // Fallback so the feed works in dev without requiring a new secret.
  const fallback =
    process.env.CLERK_SECRET_KEY ||
    process.env.DATABASE_URL ||
    "cel-portal-calendar-feed-dev-secret";
  return `cel-calendar-feed::${fallback}`;
}

/**
 * Returns a deterministic, unguessable token that authorizes anonymous
 * access to the project calendar feed.
 */
export function getCalendarFeedToken(): string {
  return crypto
    .createHmac("sha256", getFeedSecret())
    .update("calendar-feed-v1")
    .digest("base64url")
    .slice(0, 32);
}

export function isValidCalendarFeedToken(candidate: string): boolean {
  const expected = getCalendarFeedToken();
  if (candidate.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(candidate),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

/**
 * Builds the publicly reachable base URL (scheme + host) for the API,
 * honouring x-forwarded-* headers when behind the Replit proxy.
 */
export function getPublicBaseUrl(req: Request): string {
  const proto =
    (Array.isArray(req.headers["x-forwarded-proto"])
      ? req.headers["x-forwarded-proto"][0]
      : req.headers["x-forwarded-proto"]) || req.protocol || "https";
  const host = getClerkProxyHost(req) || req.headers.host || "localhost";
  return `${proto}://${host}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatDate(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function formatDateTime(d: Date): string {
  return (
    `${formatDate(d)}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Folds a single content line per RFC 5545 (75 octets) — lines longer than
 * that get split with CRLF + a single leading space on continuation lines.
 */
function foldLine(line: string): string {
  const max = 73; // leave room for CRLF
  if (Buffer.byteLength(line, "utf8") <= max + 2) return line;
  const out: string[] = [];
  let buf = "";
  let size = 0;
  for (const ch of line) {
    const chSize = Buffer.byteLength(ch, "utf8");
    if (size + chSize > (out.length === 0 ? max : max - 1)) {
      out.push(buf);
      buf = ch;
      size = chSize;
    } else {
      buf += ch;
      size += chSize;
    }
  }
  if (buf) out.push(buf);
  return out.map((seg, i) => (i === 0 ? seg : ` ${seg}`)).join("\r\n");
}

export function renderIcs(opts: {
  calendarName: string;
  description?: string;
  events: IcsEvent[];
  now?: Date;
}): string {
  const now = opts.now ?? new Date();
  const dtstamp = formatDateTime(now);
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//CEL Portal//Calendario del Piloto//ES");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(`X-WR-CALNAME:${escapeText(opts.calendarName)}`);
  if (opts.description) {
    lines.push(`X-WR-CALDESC:${escapeText(opts.description)}`);
  }
  for (const ev of opts.events) {
    const startStr = formatDate(ev.date);
    const endDate = new Date(
      Date.UTC(
        ev.date.getUTCFullYear(),
        ev.date.getUTCMonth(),
        ev.date.getUTCDate() + 1,
      ),
    );
    const endStr = formatDate(endDate);
    const lastMod = formatDateTime(ev.updatedAt ?? now);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`LAST-MODIFIED:${lastMod}`);
    lines.push(`DTSTART;VALUE=DATE:${startStr}`);
    lines.push(`DTEND;VALUE=DATE:${endStr}`);
    lines.push(`SUMMARY:${escapeText(ev.title)}`);
    if (ev.description) {
      lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
    }
    if (ev.category) {
      lines.push(`CATEGORIES:${escapeText(ev.category)}`);
    }
    lines.push("TRANSP:TRANSPARENT");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
