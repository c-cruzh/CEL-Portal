import { db, adminAuditLogTable } from "@workspace/db";
import { logger } from "./logger";

export type AdminAuditAction =
  | "member.update"
  | "member.roles_changed"
  | "invitation.create"
  | "invitation.resend"
  | "invitation.revoke"
  | "invitation.accepted"
  | "role.update"
  | "project_config.update"
  | "notification_recipient.add"
  | "notification_recipient.remove"
  | "notification.test"
  | "batch.upload";

export interface LogAdminActionInput {
  actorId: string | null;
  actorEmail?: string | null;
  action: AdminAuditAction | string;
  targetType?: string | null;
  targetId?: string | null;
  payload?: Record<string, unknown>;
}

export async function logAdminAction(
  input: LogAdminActionInput,
): Promise<void> {
  try {
    await db.insert(adminAuditLogTable).values({
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      payload: input.payload ?? {},
    });
  } catch (err) {
    logger.error(
      { err, action: input.action, targetId: input.targetId },
      "Failed to record admin audit log entry",
    );
  }
}

export function logAdminActionAsync(input: LogAdminActionInput): void {
  void logAdminAction(input);
}
