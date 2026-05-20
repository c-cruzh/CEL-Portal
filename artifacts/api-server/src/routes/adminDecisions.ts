import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import { parse as parseCsvSync } from "csv-parse/sync";
import { z } from "zod";
import { db, decisionsTable, milestonesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { requirePM } from "../middlewares/requirePM";
import { logAdminActionAsync } from "../lib/audit";
import { serializeDecision } from "./decisions";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const router: IRouter = Router();

const BatchOptionSchema = z.object({
  label: z.string().min(1).max(240),
  body: z.string().max(2000).nullish(),
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BatchDecisionSchema = z.object({
  title: z.string().min(1).max(240),
  context: z.string().max(4000).nullish(),
  ownerRole: z.string().nullish(),
  ownerUserId: z.string().nullish(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado YYYY-MM-DD")
    .nullish(),
  phaseId: z.string().nullish(),
  priority: z.string().nullish(),
  options: z.array(BatchOptionSchema).optional(),
  blocksMilestoneId: z
    .string()
    .regex(UUID_RE, "Debe ser un UUID válido")
    .nullish(),
  blocksMilestoneSeedKey: z.string().min(1).max(240).nullish(),
});

const BatchBodySchema = z.object({
  decisions: z.array(z.unknown()).min(1).max(500),
});

const ARRAY_FIELDS = new Set(["options"]);

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
        .filter(Boolean)
        .map((label) => ({ label }));
    } else {
      out[k] = v;
    }
  }
  return out;
}

function extractRows(req: Request): {
  rows: unknown[] | null;
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
      return { rows: rows.map(coerceCsvRow), error: null };
    } catch (err) {
      return {
        rows: null,
        error: `CSV inválido: ${err instanceof Error ? err.message : "no se pudo parsear"}`,
      };
    }
  }
  const parsed = BatchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      rows: null,
      error:
        "Cuerpo inválido: se esperaba { decisions: [...] } con al menos una fila.",
    };
  }
  return { rows: parsed.data.decisions, error: null };
}

function optionsToText(
  opts: z.infer<typeof BatchOptionSchema>[] | undefined,
): string {
  if (!opts || opts.length === 0) return "";
  return opts
    .map((o) => (o.body ? `${o.label}: ${o.body}` : o.label))
    .join("\n");
}

router.post(
  "/admin/decisions/batch",
  requireAuth,
  requirePM,
  upload.single("file"),
  async (req, res): Promise<void> => {
    const extracted = extractRows(req);
    if (extracted.error || !extracted.rows) {
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

    const errors: Array<{ row: number; field: string | null; message: string }> =
      [];
    const validated: Array<{
      row: number;
      data: z.infer<typeof BatchDecisionSchema>;
    }> = [];
    extracted.rows.forEach((raw, idx) => {
      const parsed = BatchDecisionSchema.safeParse(raw);
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
      validated.push({ row: idx + 1, data: parsed.data });
    });

    // Resolve blocksMilestoneSeedKey → milestone UUID, in batch.
    const seedKeys = Array.from(
      new Set(
        validated
          .filter((v) => !v.data.blocksMilestoneId && v.data.blocksMilestoneSeedKey)
          .map((v) => v.data.blocksMilestoneSeedKey as string),
      ),
    );
    const seedKeyToId = new Map<string, string>();
    if (seedKeys.length > 0) {
      const rows = await db
        .select({
          id: milestonesTable.id,
          seedKey: milestonesTable.seedKey,
        })
        .from(milestonesTable)
        .where(inArray(milestonesTable.seedKey, seedKeys));
      for (const r of rows) {
        if (r.seedKey) seedKeyToId.set(r.seedKey, r.id);
      }
    }

    // Validate UUIDs against existing milestones too, so a stale UUID doesn't
    // silently violate the FK at insert time.
    const uuidIds = Array.from(
      new Set(
        validated
          .filter((v) => v.data.blocksMilestoneId)
          .map((v) => v.data.blocksMilestoneId as string),
      ),
    );
    const validUuids = new Set<string>();
    if (uuidIds.length > 0) {
      const rows = await db
        .select({ id: milestonesTable.id })
        .from(milestonesTable)
        .where(inArray(milestonesTable.id, uuidIds));
      for (const r of rows) validUuids.add(r.id);
    }

    const resolvedMilestoneByRow = new Map<number, string | null>();
    for (const v of validated) {
      const { blocksMilestoneId, blocksMilestoneSeedKey } = v.data;
      if (blocksMilestoneId) {
        if (!validUuids.has(blocksMilestoneId)) {
          errors.push({
            row: v.row,
            field: "blocksMilestoneId",
            message: `No existe un hito con id '${blocksMilestoneId}'.`,
          });
          continue;
        }
        resolvedMilestoneByRow.set(v.row, blocksMilestoneId);
      } else if (blocksMilestoneSeedKey) {
        const id = seedKeyToId.get(blocksMilestoneSeedKey);
        if (!id) {
          errors.push({
            row: v.row,
            field: "blocksMilestoneSeedKey",
            message: `No existe un hito con seed_key '${blocksMilestoneSeedKey}'.`,
          });
          continue;
        }
        resolvedMilestoneByRow.set(v.row, id);
      } else {
        resolvedMilestoneByRow.set(v.row, null);
      }
    }

    if (errors.length > 0) {
      const rejectedRows = new Set(errors.map((e) => e.row));
      res.status(400).json({
        created: 0,
        rejected: rejectedRows.size,
        errors,
      });
      return;
    }

    const createdBy = req.userId ?? null;
    try {
      const inserted = await db.transaction(async (tx) => {
        const rows: Array<typeof decisionsTable.$inferSelect> = [];
        for (const v of validated) {
          const d = v.data;
          const [row] = await tx
            .insert(decisionsTable)
            .values({
              title: d.title.trim(),
              context: d.context ?? "",
              optionsConsidered: optionsToText(d.options),
              phase: d.phaseId ?? null,
              ownerUserId: d.ownerUserId ?? null,
              ownerRole: d.ownerRole ?? null,
              dueDate: d.dueDate ?? null,
              status: "open",
              blocksMilestoneId: resolvedMilestoneByRow.get(v.row) ?? null,
              createdBy,
            })
            .returning();
          rows.push(row!);
        }
        return rows;
      });

      logAdminActionAsync({
        actorId: req.userId ?? null,
        actorEmail: req.userEmail ?? null,
        action: "batch.upload",
        targetType: "decisions",
        targetId: null,
        payload: {
          subject: "decisions",
          count: inserted.length,
        },
      });

      res.json({
        created: inserted.length,
        rejected: 0,
        errors: [],
        decisions: inserted.map(serializeDecision),
      });
    } catch (err) {
      req.log.error({ err }, "Batch decisions import failed");
      res.status(500).json({
        created: 0,
        rejected: validated.length,
        errors: [
          {
            row: 1,
            field: null,
            message:
              "Error inesperado al guardar las decisiones. No se insertó ninguna fila.",
          },
        ],
      });
    }
  },
);

export default router;
