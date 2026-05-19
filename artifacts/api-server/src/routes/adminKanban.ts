import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import { parse as parseCsvSync } from "csv-parse/sync";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db, kanbanCardsTable, kanbanColumnsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requirePM } from "../middlewares/requirePM";
import { logAdminActionAsync } from "../lib/audit";
import { serializeCard } from "./kanban";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const router: IRouter = Router();

const PRIORITIES = ["alta", "media", "baja"] as const;
const CATEGORIES = ["preproyecto", "piloto"] as const;

const BatchCardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullish(),
  columnKey: z.string().min(1),
  category: z.enum(CATEGORIES).optional(),
  phaseId: z.string().nullish(),
  assignedRoles: z.array(z.string()).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado YYYY-MM-DD")
    .nullish(),
});

const BatchBodySchema = z.object({
  cards: z.array(z.unknown()).min(1).max(500),
});

const ARRAY_FIELDS = new Set(["assignedRoles"]);

function coerceCsvRow(row: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, vRaw] of Object.entries(row)) {
    const v = (vRaw ?? "").trim();
    if (v === "") {
      out[k] = null;
      continue;
    }
    if (ARRAY_FIELDS.has(k)) {
      out[k] = v
        .split(/[|;]/)
        .map((x) => x.trim())
        .filter(Boolean);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function extractCards(req: Request): {
  cards: unknown[] | null;
  error: string | null;
} {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (file) {
    try {
      const text = file.buffer.toString("utf8");
      const rows = parseCsvSync(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      }) as Array<Record<string, string>>;
      return { cards: rows.map(coerceCsvRow), error: null };
    } catch (err) {
      return {
        cards: null,
        error: `CSV inválido: ${err instanceof Error ? err.message : "no se pudo parsear"}`,
      };
    }
  }
  const parsed = BatchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      cards: null,
      error:
        "Cuerpo inválido: se esperaba { cards: [...] } con al menos una fila.",
    };
  }
  return { cards: parsed.data.cards, error: null };
}

router.post(
  "/admin/kanban/cards/batch",
  requireAuth,
  requirePM,
  upload.single("file"),
  async (req, res): Promise<void> => {
    const extracted = extractCards(req);
    if (extracted.error || !extracted.cards) {
      res.status(400).json({
        created: 0,
        rejected: 0,
        errors: [
          {
            row: 1,
            field: null,
            message: extracted.error ?? "Cuerpo inválido.",
          },
        ],
      });
      return;
    }

    const columns = await db
      .select({ key: kanbanColumnsTable.key })
      .from(kanbanColumnsTable);
    const validColumnKeys = new Set(columns.map((c) => c.key));

    const errors: Array<{ row: number; field: string | null; message: string }> = [];
    const validated: Array<z.infer<typeof BatchCardSchema>> = [];
    extracted.cards.forEach((raw, idx) => {
      const parsed = BatchCardSchema.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({
            row: idx + 1,
            field: issue.path.join(".") || null,
            message: issue.message,
          });
        }
        return;
      }
      if (!validColumnKeys.has(parsed.data.columnKey)) {
        errors.push({
          row: idx + 1,
          field: "columnKey",
          message: `Columna '${parsed.data.columnKey}' no existe`,
        });
        return;
      }
      validated.push(parsed.data);
    });

    if (errors.length > 0) {
      const rejectedRows = new Set(errors.map((e) => e.row));
      res.status(400).json({
        created: 0,
        rejected: rejectedRows.size,
        errors,
      });
      return;
    }

    const createdBy = req.userId ?? "system";
    try {
      const inserted = await db.transaction(async (tx) => {
        const rows: Array<typeof kanbanCardsTable.$inferSelect> = [];
        // Cache next position per column inside the transaction so that
        // batch inserts within the same column keep stable, gap-free order.
        const nextPosByColumn = new Map<string, number>();
        for (const c of validated) {
          let next = nextPosByColumn.get(c.columnKey);
          if (next == null) {
            const [maxRow] = await tx
              .select({
                m: sql<number>`COALESCE(MAX(${kanbanCardsTable.position}), -1)`,
              })
              .from(kanbanCardsTable)
              .where(sql`${kanbanCardsTable.columnKey} = ${c.columnKey}`);
            next = (maxRow?.m ?? -1) + 1;
          }
          const [row] = await tx
            .insert(kanbanCardsTable)
            .values({
              title: c.title,
              description: c.description ?? "",
              columnKey: c.columnKey,
              position: next,
              phaseId: c.phaseId ?? null,
              assignedRoles: c.assignedRoles ?? [],
              priority: c.priority ?? "media",
              category: c.category ?? "piloto",
              dueDate: c.dueDate ?? null,
              createdBy,
            })
            .returning();
          rows.push(row!);
          nextPosByColumn.set(c.columnKey, next + 1);
        }
        return rows;
      });

      logAdminActionAsync({
        actorId: req.userId ?? null,
        actorEmail: req.userEmail ?? null,
        action: "batch.upload",
        targetType: "kanban_cards",
        targetId: null,
        payload: {
          subject: "kanban_cards",
          count: inserted.length,
        },
      });

      res.json({
        created: inserted.length,
        rejected: 0,
        errors: [],
        cards: inserted.map(serializeCard),
      });
    } catch (err) {
      req.log.error({ err }, "Batch kanban import failed");
      res.status(500).json({
        created: 0,
        rejected: validated.length,
        errors: [
          {
            row: 1,
            field: null,
            message:
              "Error inesperado al guardar las tarjetas. No se insertó ninguna fila.",
          },
        ],
      });
    }
  },
);

export default router;
