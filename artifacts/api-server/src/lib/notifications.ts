import { and, desc, eq, gte, ne, inArray } from "drizzle-orm";
import {
  db,
  usersTable,
  notificationRecipientsTable,
  notificationLogTable,
  decisionsTable,
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
    }
  | {
      kind: "document_uploaded";
      actor: { id: string; email: string; displayName: string };
      documentName: string;
      folderLabel: string;
      version: number;
      isNewVersion: boolean;
    }
  | {
      kind: "decision_created";
      actor: { id: string; email: string; displayName: string };
      title: string;
      ownerLabel: string | null;
      dueDate: string | null;
    }
  | {
      kind: "decision_resolved";
      actor: { id: string; email: string; displayName: string };
      title: string;
      resolution: string;
    }
  | {
      kind: "decision_status_changed";
      actor: { id: string; email: string; displayName: string };
      title: string;
      previousStatus: string;
      newStatus: string;
    };

type PersonalNotificationEvent =
  | {
      kind: "decision_assigned";
      actor: { id: string; email: string; displayName: string } | null;
      title: string;
      decisionId: string;
      dueDate: string | null;
      isReassignment: boolean;
      previousOwnerLabel: string | null;
    }
  | {
      kind: "decision_due_reminder";
      title: string;
      decisionId: string;
      dueDate: string;
      daysUntilDue: number;
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
    case "document_uploaded":
      return {
        subject: `[Portal CEL] ${ev.isNewVersion ? "Nueva versión" : "Documento nuevo"}: ${ev.documentName}`,
        text:
          `${who} ${ev.isNewVersion ? "subió una nueva versión de" : "agregó"} un documento al repositorio del piloto.\n\n` +
          `Documento: ${ev.documentName}\n` +
          `Carpeta: ${ev.folderLabel}\n` +
          `Versión: v${ev.version}\n`,
      };
    case "decision_created":
      return {
        subject: `[Portal CEL] Nueva decisión pendiente: ${ev.title}`,
        text:
          `${who} registró una nueva decisión pendiente.\n\n` +
          `Título: ${ev.title}\n` +
          `Dueño: ${ev.ownerLabel ?? "(sin asignar)"}\n` +
          `Fecha límite: ${ev.dueDate ?? "(sin definir)"}\n`,
      };
    case "decision_resolved":
      return {
        subject: `[Portal CEL] Decisión resuelta: ${ev.title}`,
        text:
          `${who} marcó como resuelta la decisión "${ev.title}".\n\n` +
          `Resolución:\n${ev.resolution}\n`,
      };
    case "decision_status_changed":
      return {
        subject: `[Portal CEL] Decisión actualizada: ${ev.title}`,
        text:
          `${who} cambió el estado de la decisión "${ev.title}".\n\n` +
          `Antes: ${ev.previousStatus}\n` +
          `Ahora: ${ev.newStatus}\n`,
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

function renderPersonalEmail(ev: PersonalNotificationEvent): {
  subject: string;
  text: string;
} {
  switch (ev.kind) {
    case "decision_assigned": {
      const who = ev.actor
        ? `${ev.actor.displayName} <${ev.actor.email}>`
        : "El equipo";
      const intro = ev.isReassignment
        ? `${who} te transfirió una decisión pendiente`
        : `${who} te asignó una nueva decisión pendiente`;
      const prev = ev.isReassignment && ev.previousOwnerLabel
        ? `Dueño anterior: ${ev.previousOwnerLabel}\n`
        : "";
      return {
        subject: `[Portal CEL] Te asignaron una decisión: ${ev.title}`,
        text:
          `${intro} en el Portal CEL.\n\n` +
          `Título: ${ev.title}\n` +
          `Fecha límite: ${ev.dueDate ?? "(sin definir)"}\n` +
          prev +
          `\nEntra al portal para revisar el contexto y avanzar la decisión.\n`,
      };
    }
    case "decision_due_reminder": {
      const when =
        ev.daysUntilDue < 0
          ? `venció hace ${Math.abs(ev.daysUntilDue)} día${Math.abs(ev.daysUntilDue) === 1 ? "" : "s"}`
          : ev.daysUntilDue === 0
            ? "vence hoy"
            : `vence mañana`;
      return {
        subject: `[Portal CEL] Recordatorio: decisión ${when} — ${ev.title}`,
        text:
          `Tienes una decisión asignada cuya fecha límite ${when}.\n\n` +
          `Título: ${ev.title}\n` +
          `Fecha límite: ${ev.dueDate}\n\n` +
          `Entra al portal para resolverla o reagendarla.\n`,
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

async function sendPersonalNotification(
  ev: PersonalNotificationEvent,
  recipient: { userId: string; email: string; displayName: string },
  opts: { triggeredBy?: string | null } = {},
): Promise<void> {
  const triggeredBy =
    opts.triggeredBy !== undefined
      ? opts.triggeredBy
      : "actor" in ev && ev.actor
        ? `${ev.actor.displayName} <${ev.actor.email}>`
        : "system";

  try {
    const [user] = await db
      .select({
        email: usersTable.email,
        optOut: usersTable.emailNotificationsOptOut,
      })
      .from(usersTable)
      .where(eq(usersTable.id, recipient.userId))
      .limit(1);

    const email = (user?.email ?? recipient.email).toLowerCase();
    const optOut = user?.optOut ?? false;

    if (optOut) {
      logger.info(
        { kind: ev.kind, userId: recipient.userId },
        "Personal notification skipped (user opted out)",
      );
      await recordLog({
        eventKind: ev.kind,
        recipients: [email],
        status: "no_recipients",
        providerMessage: "El dueño desactivó los avisos por correo",
        triggeredBy,
      });
      return;
    }

    const { subject, text } = renderPersonalEmail(ev);

    if (!process.env.RESEND_API_KEY) {
      logger.info(
        { kind: ev.kind, userId: recipient.userId, subject },
        "Personal notification (no email provider configured; logged only)",
      );
      await recordLog({
        eventKind: ev.kind,
        recipients: [email],
        status: "no_provider",
        providerMessage: "RESEND_API_KEY no configurada",
        triggeredBy,
      });
      return;
    }

    const result = await sendViaResend([email], subject, text);
    if (!result.ok) {
      await recordLog({
        eventKind: ev.kind,
        recipients: [email],
        status: "failed",
        providerMessage: result.message,
        triggeredBy,
      });
      return;
    }

    logger.info(
      { kind: ev.kind, userId: recipient.userId },
      "Personal notification sent",
    );
    await recordLog({
      eventKind: ev.kind,
      recipients: [email],
      status: "sent",
      providerMessage: null,
      triggeredBy,
    });
  } catch (err) {
    logger.error(
      { err, kind: ev.kind, userId: recipient.userId },
      "Failed to send personal notification",
    );
    await recordLog({
      eventKind: ev.kind,
      recipients: [recipient.email.toLowerCase()],
      status: "failed",
      providerMessage: err instanceof Error ? err.message : String(err),
      triggeredBy,
    });
  }
}

export function notifyDecisionAssignedAsync(args: {
  ownerUserId: string;
  actor: { id: string; email: string; displayName: string } | null;
  title: string;
  decisionId: string;
  dueDate: string | null;
  isReassignment: boolean;
  previousOwnerLabel: string | null;
}): void {
  void (async () => {
    const [owner] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        displayName: usersTable.displayName,
      })
      .from(usersTable)
      .where(eq(usersTable.id, args.ownerUserId))
      .limit(1);
    if (!owner) {
      logger.warn(
        { ownerUserId: args.ownerUserId },
        "Cannot send decision_assigned notification: owner not found",
      );
      return;
    }
    if (args.actor && args.actor.id === owner.id) {
      // Self-assignment: no need to email yourself.
      return;
    }
    await sendPersonalNotification(
      {
        kind: "decision_assigned",
        actor: args.actor,
        title: args.title,
        decisionId: args.decisionId,
        dueDate: args.dueDate,
        isReassignment: args.isReassignment,
        previousOwnerLabel: args.previousOwnerLabel,
      },
      { userId: owner.id, email: owner.email, displayName: owner.displayName },
    );
  })();
}

const DUE_REMINDER_KIND = "decision_due_reminder";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function diffDays(dueIso: string, todayIso: string): number {
  const due = new Date(`${dueIso}T00:00:00Z`).getTime();
  const today = new Date(`${todayIso}T00:00:00Z`).getTime();
  return Math.round((due - today) / 86_400_000);
}

export async function runDueDateReminders(now: Date = new Date()): Promise<{
  evaluated: number;
  sent: number;
  skipped: number;
  failed: number;
  noProvider: number;
}> {
  const todayIso = toDateOnly(now);
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const tomorrowIso = toDateOnly(tomorrow);

  let evaluated = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let noProvider = 0;

  try {
    const candidates = await db
      .select({
        id: decisionsTable.id,
        title: decisionsTable.title,
        dueDate: decisionsTable.dueDate,
        ownerUserId: decisionsTable.ownerUserId,
        status: decisionsTable.status,
      })
      .from(decisionsTable)
      .where(eq(decisionsTable.status, "open"));

    const due = candidates.filter(
      (d) =>
        d.ownerUserId &&
        d.dueDate &&
        (d.dueDate <= tomorrowIso),
    );
    evaluated = due.length;
    if (due.length === 0) return { evaluated, sent, skipped, failed, noProvider };

    // Dedup: load today's reminder log entries; providerMessage encodes the decision id.
    const startOfDay = new Date(`${todayIso}T00:00:00.000Z`);
    const recentLogs = await db
      .select({
        providerMessage: notificationLogTable.providerMessage,
        status: notificationLogTable.status,
      })
      .from(notificationLogTable)
      .where(
        and(
          eq(notificationLogTable.eventKind, DUE_REMINDER_KIND),
          gte(notificationLogTable.createdAt, startOfDay),
        ),
      );
    const alreadySentIds = new Set<string>();
    for (const log of recentLogs) {
      if (log.status !== "sent" && log.status !== "no_provider") continue;
      const tag = log.providerMessage ?? "";
      const m = /decision:([0-9a-f-]{36})/i.exec(tag);
      if (m && m[1]) alreadySentIds.add(m[1]);
    }

    const ownerIds = Array.from(
      new Set(due.map((d) => d.ownerUserId!).filter(Boolean)),
    );
    const owners = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        displayName: usersTable.displayName,
        optOut: usersTable.emailNotificationsOptOut,
      })
      .from(usersTable)
      .where(inArray(usersTable.id, ownerIds));
    const ownerById = new Map(owners.map((o) => [o.id, o]));

    for (const d of due) {
      if (alreadySentIds.has(d.id)) {
        skipped++;
        continue;
      }
      const owner = ownerById.get(d.ownerUserId!);
      if (!owner || owner.optOut) {
        skipped++;
        continue;
      }
      const daysUntilDue = diffDays(d.dueDate!, todayIso);
      const status = await sendPersonalNotificationWithTag(
        {
          kind: "decision_due_reminder",
          title: d.title,
          decisionId: d.id,
          dueDate: d.dueDate!,
          daysUntilDue,
        },
        { userId: owner.id, email: owner.email, displayName: owner.displayName },
        `decision:${d.id}`,
      );
      if (status === "sent") sent++;
      else if (status === "no_provider") noProvider++;
      else if (status === "failed") failed++;
      else skipped++;
    }
  } catch (err) {
    logger.error({ err }, "Failed to run due-date reminders job");
  }

  return { evaluated, sent, skipped, failed, noProvider };
}

async function sendPersonalNotificationWithTag(
  ev: PersonalNotificationEvent,
  recipient: { userId: string; email: string; displayName: string },
  tag: string,
): Promise<NotificationStatus> {
  // We piggyback the dedup tag onto providerMessage by wrapping sendViaResend
  // here so the log entry contains the tag, enabling daily dedup lookups.
  try {
    const [user] = await db
      .select({
        email: usersTable.email,
        optOut: usersTable.emailNotificationsOptOut,
      })
      .from(usersTable)
      .where(eq(usersTable.id, recipient.userId))
      .limit(1);

    const email = (user?.email ?? recipient.email).toLowerCase();
    const optOut = user?.optOut ?? false;
    const triggeredBy = "system";

    if (optOut) {
      await recordLog({
        eventKind: ev.kind,
        recipients: [email],
        status: "no_recipients",
        providerMessage: `${tag} opt_out`,
        triggeredBy,
      });
      return "no_recipients";
    }

    const { subject, text } = renderPersonalEmail(ev);

    if (!process.env.RESEND_API_KEY) {
      logger.info(
        { kind: ev.kind, userId: recipient.userId, subject, tag },
        "Personal notification (no email provider configured; logged only)",
      );
      await recordLog({
        eventKind: ev.kind,
        recipients: [email],
        status: "no_provider",
        providerMessage: `${tag} RESEND_API_KEY no configurada`,
        triggeredBy,
      });
      return "no_provider";
    }

    const result = await sendViaResend([email], subject, text);
    if (!result.ok) {
      await recordLog({
        eventKind: ev.kind,
        recipients: [email],
        status: "failed",
        providerMessage: `${tag} ${result.message ?? ""}`.trim(),
        triggeredBy,
      });
      return "failed";
    }

    await recordLog({
      eventKind: ev.kind,
      recipients: [email],
      status: "sent",
      providerMessage: tag,
      triggeredBy,
    });
    return "sent";
  } catch (err) {
    logger.error(
      { err, kind: ev.kind, userId: recipient.userId, tag },
      "Failed to send tagged personal notification",
    );
    await recordLog({
      eventKind: ev.kind,
      recipients: [recipient.email.toLowerCase()],
      status: "failed",
      providerMessage: `${tag} ${err instanceof Error ? err.message : String(err)}`,
      triggeredBy: "system",
    });
    return "failed";
  }
}

let dueReminderTimer: NodeJS.Timeout | null = null;

export function startDueDateReminderScheduler(): void {
  if (dueReminderTimer) return;
  const intervalMs = 6 * 60 * 60 * 1000; // every 6h; per-day dedup prevents duplicates
  // Run once shortly after boot so a freshly-deployed server still sends today's reminders.
  setTimeout(() => {
    void runDueDateReminders().then((r) => {
      logger.info({ result: r }, "Decision due-date reminders job finished");
    });
  }, 30_000);
  dueReminderTimer = setInterval(() => {
    void runDueDateReminders().then((r) => {
      logger.info({ result: r }, "Decision due-date reminders job finished");
    });
  }, intervalMs);
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
