import { ne } from "drizzle-orm";
import { db, usersTable, notificationRecipientsTable } from "@workspace/db";
import { logger } from "./logger";

type NotificationEvent =
  | {
      kind: "member_joined";
      actor: { id: string; email: string; displayName: string };
    }
  | {
      kind: "cv_uploaded";
      actor: { id: string; email: string; displayName: string };
      fileName: string;
    }
  | {
      kind: "roles_changed";
      actor: { id: string; email: string; displayName: string };
      previousRoles: string[];
      newRoles: string[];
    };

function renderEmail(ev: NotificationEvent): {
  subject: string;
  text: string;
} {
  const who = `${ev.actor.displayName} <${ev.actor.email}>`;
  switch (ev.kind) {
    case "member_joined":
      return {
        subject: `[Portal CEL] Nuevo miembro: ${ev.actor.displayName}`,
        text: `Se registró un nuevo miembro en el Portal CEL.\n\nNombre: ${ev.actor.displayName}\nCorreo: ${ev.actor.email}\n`,
      };
    case "cv_uploaded":
      return {
        subject: `[Portal CEL] CV actualizado: ${ev.actor.displayName}`,
        text: `${who} subió o actualizó su CV.\n\nArchivo: ${ev.fileName}\n`,
      };
    case "roles_changed": {
      const added = ev.newRoles.filter((r) => !ev.previousRoles.includes(r));
      const removed = ev.previousRoles.filter(
        (r) => !ev.newRoles.includes(r),
      );
      return {
        subject: `[Portal CEL] Cambio de roles: ${ev.actor.displayName}`,
        text:
          `${who} cambió sus roles.\n\n` +
          `Antes: ${ev.previousRoles.join(", ") || "(ninguno)"}\n` +
          `Ahora: ${ev.newRoles.join(", ") || "(ninguno)"}\n` +
          (added.length ? `Agregados: ${added.join(", ")}\n` : "") +
          (removed.length ? `Quitados: ${removed.join(", ")}\n` : ""),
      };
    }
  }
}

function parseStaticRecipients(): string[] {
  const raw = process.env.TEAM_NOTIFICATION_RECIPIENTS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function resolveRecipients(actorId: string): Promise<string[]> {
  const set = new Set<string>();

  for (const addr of parseStaticRecipients()) {
    set.add(addr.toLowerCase());
  }

  try {
    const fixed = await db
      .select({ email: notificationRecipientsTable.email })
      .from(notificationRecipientsTable);
    for (const r of fixed) {
      if (r.email) set.add(r.email.toLowerCase());
    }
  } catch (err) {
    logger.warn(
      { err },
      "Failed to load fixed notification recipients from database",
    );
  }

  try {
    const subscribers = await db
      .select({
        email: usersTable.email,
        optOut: usersTable.emailNotificationsOptOut,
      })
      .from(usersTable)
      .where(ne(usersTable.id, actorId));
    for (const u of subscribers) {
      if (!u.optOut && u.email) set.add(u.email.toLowerCase());
    }
  } catch (err) {
    logger.warn({ err }, "Failed to resolve dynamic notification recipients");
  }

  return Array.from(set);
}

async function sendViaResend(
  to: string[],
  subject: string,
  text: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const from =
    process.env.TEAM_NOTIFICATION_FROM ?? "Portal CEL <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error(
        { status: res.status, body },
        "Resend API returned non-OK status",
      );
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "Resend API request failed");
    return false;
  }
}

export async function sendTeamNotification(
  ev: NotificationEvent,
): Promise<void> {
  try {
    const recipients = await resolveRecipients(ev.actor.id);
    const { subject, text } = renderEmail(ev);

    if (recipients.length === 0) {
      logger.info(
        { kind: ev.kind, actorId: ev.actor.id },
        "No recipients for team notification; skipping send",
      );
      return;
    }

    const sent = await sendViaResend(recipients, subject, text);
    if (!sent) {
      logger.info(
        {
          kind: ev.kind,
          actorId: ev.actor.id,
          recipients,
          subject,
          text,
        },
        "Team notification (no email provider configured; logged only)",
      );
    } else {
      logger.info(
        { kind: ev.kind, actorId: ev.actor.id, recipients: recipients.length },
        "Team notification sent",
      );
    }
  } catch (err) {
    logger.error({ err, kind: ev.kind }, "Failed to send team notification");
  }
}

export function notifyAsync(ev: NotificationEvent): void {
  void sendTeamNotification(ev);
}
