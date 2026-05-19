import { Router, type IRouter } from "express";
import { and, asc, eq, gte, gt, sql } from "drizzle-orm";
import {
  db,
  kanbanCardsTable,
  kanbanColumnsTable,
  userRolesTable,
} from "@workspace/db";
import {
  ListKanbanColumnsResponse,
  ListKanbanCardsResponse,
  ListKanbanCardsResponseItem,
  CreateKanbanCardBody,
  UpdateKanbanCardBody,
  UpdateKanbanCardResponse,
  MoveKanbanCardBody,
  MoveKanbanCardResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const PM_ROLE_IDS = new Set(["pm_lead", "pm_cel"]);

export function serializeCard(row: typeof kanbanCardsTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    columnKey: row.columnKey,
    position: row.position,
    phaseId: row.phaseId ?? null,
    assignedRoles: row.assignedRoles ?? [],
    priority: row.priority as "alta" | "media" | "baja",
    category: ((row as { category?: string }).category ?? "piloto") as
      | "preproyecto"
      | "piloto",
    dueDate: row.dueDate ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function isUserPM(userId: string): Promise<boolean> {
  const rows = await db
    .select({ roleId: userRolesTable.roleId })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId));
  return rows.some((r) => PM_ROLE_IDS.has(r.roleId));
}

router.get(
  "/kanban/columns",
  requireAuth,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(kanbanColumnsTable)
      .orderBy(asc(kanbanColumnsTable.sortOrder), asc(kanbanColumnsTable.key));
    res.json(ListKanbanColumnsResponse.parse(rows));
  },
);

router.get(
  "/kanban/cards",
  requireAuth,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(kanbanCardsTable)
      .orderBy(asc(kanbanCardsTable.columnKey), asc(kanbanCardsTable.position));
    res.json(ListKanbanCardsResponse.parse(rows.map(serializeCard)));
  },
);

router.post(
  "/kanban/cards",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = CreateKanbanCardBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const data = parsed.data;

    const [col] = await db
      .select()
      .from(kanbanColumnsTable)
      .where(eq(kanbanColumnsTable.key, data.columnKey))
      .limit(1);
    if (!col) {
      res.status(400).json({ error: "Columna inválida" });
      return;
    }

    const [maxRow] = await db
      .select({ m: sql<number>`COALESCE(MAX(${kanbanCardsTable.position}), -1)` })
      .from(kanbanCardsTable)
      .where(eq(kanbanCardsTable.columnKey, data.columnKey));
    const nextPosition = (maxRow?.m ?? -1) + 1;

    const dueDateStr = data.dueDate
      ? data.dueDate.toISOString().slice(0, 10)
      : null;

    const [created] = await db
      .insert(kanbanCardsTable)
      .values({
        title: data.title,
        description: data.description ?? "",
        columnKey: data.columnKey,
        position: nextPosition,
        phaseId: data.phaseId ?? null,
        assignedRoles: data.assignedRoles ?? [],
        priority: data.priority ?? "media",
        category: data.category ?? "piloto",
        dueDate: dueDateStr,
        createdBy: req.userId!,
      })
      .returning();

    res.status(201).json(ListKanbanCardsResponseItem.parse(serializeCard(created!)));
  },
);

router.patch(
  "/kanban/cards/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = UpdateKanbanCardBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const raw = req.params.id;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id) {
      res.status(400).json({ error: "id requerido" });
      return;
    }

    const [existing] = await db
      .select()
      .from(kanbanCardsTable)
      .where(eq(kanbanCardsTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Tarjeta no encontrada" });
      return;
    }

    const data = parsed.data;
    const update: Partial<typeof kanbanCardsTable.$inferInsert> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if ("phaseId" in data) update.phaseId = data.phaseId ?? null;
    if (data.assignedRoles !== undefined)
      update.assignedRoles = data.assignedRoles;
    if (data.priority !== undefined) update.priority = data.priority;
    if (data.category !== undefined) update.category = data.category;
    if ("dueDate" in data) {
      update.dueDate = data.dueDate
        ? data.dueDate.toISOString().slice(0, 10)
        : null;
    }

    const [updated] = await db
      .update(kanbanCardsTable)
      .set(update)
      .where(eq(kanbanCardsTable.id, id))
      .returning();

    res.json(UpdateKanbanCardResponse.parse(serializeCard(updated!)));
  },
);

router.delete(
  "/kanban/cards/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const raw = req.params.id;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id) {
      res.status(400).json({ error: "id requerido" });
      return;
    }
    const [existing] = await db
      .select()
      .from(kanbanCardsTable)
      .where(eq(kanbanCardsTable.id, id))
      .limit(1);
    if (!existing) {
      res.sendStatus(204);
      return;
    }
    const userId = req.userId!;
    const isOwner = existing.createdBy === userId;
    const isPM = isOwner ? true : await isUserPM(userId);
    if (!isOwner && !isPM) {
      res.status(403).json({
        error: "Solo el creador o un PM pueden borrar esta tarjeta.",
      });
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(kanbanCardsTable)
        .where(eq(kanbanCardsTable.id, id));
      await tx
        .update(kanbanCardsTable)
        .set({ position: sql`${kanbanCardsTable.position} - 1` })
        .where(
          and(
            eq(kanbanCardsTable.columnKey, existing.columnKey),
            gt(kanbanCardsTable.position, existing.position),
          ),
        );
    });

    res.sendStatus(204);
  },
);

router.post(
  "/kanban/cards/:id/move",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = MoveKanbanCardBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const raw = req.params.id;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id) {
      res.status(400).json({ error: "id requerido" });
      return;
    }
    const { columnKey: targetColumn, position: requestedPosition } = parsed.data;

    const [existing] = await db
      .select()
      .from(kanbanCardsTable)
      .where(eq(kanbanCardsTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Tarjeta no encontrada" });
      return;
    }
    const [col] = await db
      .select()
      .from(kanbanColumnsTable)
      .where(eq(kanbanColumnsTable.key, targetColumn))
      .limit(1);
    if (!col) {
      res.status(400).json({ error: "Columna inválida" });
      return;
    }

    await db.transaction(async (tx) => {
      if (existing.columnKey === targetColumn) {
        const countRows = await tx
          .select({ n: sql<number>`COUNT(*)::int` })
          .from(kanbanCardsTable)
          .where(eq(kanbanCardsTable.columnKey, targetColumn));
        const total = countRows[0]?.n ?? 1;
        const clamped = Math.max(0, Math.min(requestedPosition, total - 1));
        if (clamped === existing.position) return;

        if (clamped < existing.position) {
          await tx
            .update(kanbanCardsTable)
            .set({ position: sql`${kanbanCardsTable.position} + 1` })
            .where(
              and(
                eq(kanbanCardsTable.columnKey, targetColumn),
                gte(kanbanCardsTable.position, clamped),
                sql`${kanbanCardsTable.position} < ${existing.position}`,
              ),
            );
        } else {
          await tx
            .update(kanbanCardsTable)
            .set({ position: sql`${kanbanCardsTable.position} - 1` })
            .where(
              and(
                eq(kanbanCardsTable.columnKey, targetColumn),
                gt(kanbanCardsTable.position, existing.position),
                sql`${kanbanCardsTable.position} <= ${clamped}`,
              ),
            );
        }
        await tx
          .update(kanbanCardsTable)
          .set({ position: clamped })
          .where(eq(kanbanCardsTable.id, id));
      } else {
        await tx
          .update(kanbanCardsTable)
          .set({ position: sql`${kanbanCardsTable.position} - 1` })
          .where(
            and(
              eq(kanbanCardsTable.columnKey, existing.columnKey),
              gt(kanbanCardsTable.position, existing.position),
            ),
          );

        const countRows = await tx
          .select({ n: sql<number>`COUNT(*)::int` })
          .from(kanbanCardsTable)
          .where(eq(kanbanCardsTable.columnKey, targetColumn));
        const total = countRows[0]?.n ?? 0;
        const clamped = Math.max(0, Math.min(requestedPosition, total));

        await tx
          .update(kanbanCardsTable)
          .set({ position: sql`${kanbanCardsTable.position} + 1` })
          .where(
            and(
              eq(kanbanCardsTable.columnKey, targetColumn),
              gte(kanbanCardsTable.position, clamped),
            ),
          );

        await tx
          .update(kanbanCardsTable)
          .set({ columnKey: targetColumn, position: clamped })
          .where(eq(kanbanCardsTable.id, id));
      }
    });

    const rows = await db
      .select()
      .from(kanbanCardsTable)
      .orderBy(asc(kanbanCardsTable.columnKey), asc(kanbanCardsTable.position));
    res.json(MoveKanbanCardResponse.parse(rows.map(serializeCard)));
  },
);

export default router;
