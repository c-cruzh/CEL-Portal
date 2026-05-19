import { desc, ne } from "drizzle-orm";
import {
  db,
  usersTable,
  notificationRecipientsTable,
  notificationLogTable,
} from "@workspace/db";
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

export type NotificationStatus =
  | "sent"
  | "no_provider"
  | "no_recipients"
  | "failed";

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

async function recordLog(entry: {
  eventKind: string;
  recipients: string[];
  status: NotificationStatus;
  providerMessage: string | null;
  triggeredBy: string | null;
}): Promise<void> {
  try {
    await db.insert(notificationLogTable).values({
      eventKind: entry.eventKind,
      recipients: entry.recipients,
      recipientCount: entry.recipients.length,
      status: entry.status,
      providerMessage: entry.providerMessage,
      triggeredBy: entry.triggeredBy,
    });
  } catch (err) {
    logger.error({ err }, "Failed to record notification log entry");
  }
}

async function sendViaResend(
  to: string[],
  subject: string,
  text: string,
): Promise<{ ok: boolean; message: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, message: "RESEND_API_KEY no configurada" };
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
      return {
        ok: false,
        message: `HTTP ${res.status}: ${body.slice(0, 500)}`,
      };
    }
    return { ok: true, message: null };
  } catch (err) {
    logger.error({ err }, "Resend API request failed");
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message };
  }
}

export async function sendTeamNotification(
  ev: NotificationEvent,
): Promise<void> {
  try {
    const recipients = await resolveRecipients(ev.actor.id);
    const { subject, text } = renderEmail(ev);
    const triggeredBy = `${ev.actor.displayName} <${ev.actor.email}>`;

    if (recipients.length === 0) {
      logger.info(
        { kind: ev.kind, actorId: ev.actor.id },
        "No recipients for team notification; skipping send",
      );
      await recordLog({
        eventKind: ev.kind,
        recipients,
        status: "no_recipients",
        providerMessage: "Sin destinatarios configurados",
        triggeredBy,
      });
      return;
    }

    if (!process.env.RESEND_API_KEY) {
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
      await recordLog({
        eventKind: ev.kind,
        recipients,
        status: "no_provider",
        providerMessage: "RESEND_API_KEY no configurada",
        triggeredBy,
      });
      return;
    }

    const result = await sendViaResend(recipients, subject, text);
    if (!result.ok) {
      await recordLog({
        eventKind: ev.kind,
        recipients,
        status: "failed",
        providerMessage: result.message,
        triggeredBy,
      });
    } else {
      logger.info(
        { kind: ev.kind, actorId: ev.actor.id, recipients: recipients.length },
        "Team notification sent",
      );
      await recordLog({
        eventKind: ev.kind,
        recipients,
        status: "sent",
        providerMessage: null,
        triggeredBy,
      });
    }
  } catch (err) {
    logger.error({ err, kind: ev.kind }, "Failed to send team notification");
    await recordLog({
      eventKind: ev.kind,
      recipients: [],
      status: "failed",
      providerMessage: err instanceof Error ? err.message : String(err),
      triggeredBy: `${ev.actor.displayName} <${ev.actor.email}>`,
    });
  }
}

export function notifyAsync(ev: NotificationEvent): void {
  void sendTeamNotification(ev);
}

export type TestNotificationResult =
  | { status: "sent"; recipientCount: number; recipients: string[]; message: string }
  | { status: "no_provider"; recipientCount: number; recipients: string[]; message: string }
  | { status: "no_recipients"; recipientCount: 0; recipients: []; message: string }
  | { status: "failed"; recipientCount: number; recipients: string[]; message: string };

export async function sendTestNotification(opts: {
  triggeredBy: { email: string; displayName: string };
}): Promise<TestNotificationResult> {
  const triggeredBy = `${opts.triggeredBy.displayName} <${opts.triggeredBy.email}>`;
  const recipients = await resolveRecipients("");
  if (recipients.length === 0) {
    const message =
      "No hay destinatarios configurados. Agrega correos fijos o registra miembros con avisos activados.";
    await recordLog({
      eventKind: "test",
      recipients,
      status: "no_recipients",
      providerMessage: message,
      triggeredBy,
    });
    return {
      status: "no_recipients",
      recipientCount: 0,
      recipients: [],
      message,
    };
  }

  const subject = "[Portal CEL] Correo de prueba";
  const text =
    `Este es un correo de prueba enviado desde el Portal CEL para confirmar que las notificaciones del equipo funcionan.\n\n` +
    `Solicitado por: ${opts.triggeredBy.displayName} <${opts.triggeredBy.email}>\n` +
    `Fecha: ${new Date().toISOString()}\n\n` +
    `Si recibiste este mensaje, la configuración de correos es correcta. Puedes ignorarlo.\n`;

  if (!process.env.RESEND_API_KEY) {
    logger.info(
      { recipients, subject },
      "Test notification skipped: RESEND_API_KEY not configured",
    );
    const message =
      "La variable RESEND_API_KEY no está configurada en el servidor, así que no se envió ningún correo real. Configúrala para activar el envío.";
    await recordLog({
      eventKind: "test",
      recipients,
      status: "no_provider",
      providerMessage: "RESEND_API_KEY no configurada",
      triggeredBy,
    });
    return {
      status: "no_provider",
      recipientCount: recipients.length,
      recipients,
      message,
    };
  }

  const result = await sendViaResend(recipients, subject, text);
  if (!result.ok) {
    await recordLog({
      eventKind: "test",
      recipients,
      status: "failed",
      providerMessage: result.message,
      triggeredBy,
    });
    return {
      status: "failed",
      recipientCount: recipients.length,
      recipients,
      message:
        "El proveedor de correo rechazó la solicitud. Revisa los registros del servidor para más detalles.",
    };
  }

  logger.info(
    { recipients: recipients.length, triggeredBy: opts.triggeredBy.email },
    "Test team notification sent",
  );
  await recordLog({
    eventKind: "test",
    recipients,
    status: "sent",
    providerMessage: null,
    triggeredBy,
  });
  return {
    status: "sent",
    recipientCount: recipients.length,
    recipients,
    message: `Correo de prueba enviado a ${recipients.length} destinatario${recipients.length === 1 ? "" : "s"}.`,
  };
}

export async function listRecentNotificationLog(
  limit = 20,
): Promise<
  Array<{
    id: string;
    eventKind: string;
    recipients: string[];
    recipientCount: number;
    status: NotificationStatus;
    providerMessage: string | null;
    triggeredBy: string | null;
    createdAt: Date;
  }>
> {
  const rows = await db
    .select()
    .from(notificationLogTable)
    .orderBy(desc(notificationLogTable.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    eventKind: r.eventKind,
    recipients: r.recipients ?? [],
    recipientCount: r.recipientCount,
    status: r.status as NotificationStatus,
    providerMessage: r.providerMessage,
    triggeredBy: r.triggeredBy,
    createdAt: r.createdAt,
  }));
}
