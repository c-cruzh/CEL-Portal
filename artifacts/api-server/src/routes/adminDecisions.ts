import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import { parse as parseCsvSync } from "csv-parse/sync";
import { z } from "zod";
import { db, decisionsTable } from "@workspace/db";
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
    const validated: Array<z.infer<typeof BatchDecisionSchema>> = [];
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

    const createdBy = req.userId ?? null;
    try {
      const inserted = await db.transaction(async (tx) => {
        const rows: Array<typeof decisionsTable.$inferSelect> = [];
        for (const d of validated) {
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
