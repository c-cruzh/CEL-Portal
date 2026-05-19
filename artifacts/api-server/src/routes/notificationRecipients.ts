import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, notificationRecipientsTable, usersTable } from "@workspace/db";
import {
  ListNotificationRecipientsResponse,
  AddNotificationRecipientBody,
  AddNotificationRecipientResponse,
  TestNotificationRecipientsResponse,
  ListNotificationLogResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import {
  sendTestNotification,
  listRecentNotificationLog,
} from "../lib/notifications";
import { logAdminActionAsync } from "../lib/audit";

const router: IRouter = Router();

router.get(
  "/admin/notification-recipients",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(notificationRecipientsTable)
      .orderBy(asc(notificationRecipientsTable.email));
    res.json(
      ListNotificationRecipientsResponse.parse(
        rows.map((r) => ({
          email: r.email,
          addedBy: r.addedBy ?? null,
          createdAt: r.createdAt,
        })),
      ),
    );
  },
);

router.post(
  "/admin/notification-recipients",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = AddNotificationRecipientBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    const [row] = await db
      .insert(notificationRecipientsTable)
      .values({ email, addedBy: req.userEmail ?? req.userId ?? null })
      .onConflictDoNothing()
      .returning();

    const [final] = row
      ? [row]
      : await db
          .select()
          .from(notificationRecipientsTable)
          .where(eq(notificationRecipientsTable.email, email))
          .limit(1);

    if (row) {
      logAdminActionAsync({
        actorId: req.userId ?? null,
        actorEmail: req.userEmail ?? null,
        action: "notification_recipient.add",
        targetType: "notification_recipient",
        targetId: email,
        payload: { email },
      });
    }
    res.status(row ? 201 : 200).json(
      AddNotificationRecipientResponse.parse({
        email: final!.email,
        addedBy: final!.addedBy ?? null,
        createdAt: final!.createdAt,
      }),
    );
  },
);

router.delete(
  "/admin/notification-recipients/:email",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = req.params.email;
    const emailRaw = Array.isArray(raw) ? raw[0] : raw;
    const email = decodeURIComponent(emailRaw ?? "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Email requerido" });
      return;
    }
    await db
      .delete(notificationRecipientsTable)
      .where(eq(notificationRecipientsTable.email, email));
    logAdminActionAsync({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "notification_recipient.remove",
      targetType: "notification_recipient",
      targetId: email,
      payload: { email },
    });
    res.sendStatus(204);
  },
);

router.post(
  "/admin/notification-recipients/test",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    let displayName = req.userEmail ?? "PM";
    if (req.userId) {
      const [u] = await db
        .select({ displayName: usersTable.displayName })
        .from(usersTable)
        .where(eq(usersTable.id, req.userId))
        .limit(1);
      if (u?.displayName) displayName = u.displayName;
    }

    const result = await sendTestNotification({
      triggeredBy: {
        email: req.userEmail ?? "desconocido",
        displayName,
      },
    });

    logAdminActionAsync({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "notification.test",
      targetType: "notification",
      payload: {
        status: result.status,
        recipientCount: result.recipientCount,
      },
    });

    res.json(TestNotificationRecipientsResponse.parse(result));
  },
);

router.get(
  "/admin/notification-log",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const entries = await listRecentNotificationLog(20);
    res.json(ListNotificationLogResponse.parse(entries));
  },
);

export default router;
