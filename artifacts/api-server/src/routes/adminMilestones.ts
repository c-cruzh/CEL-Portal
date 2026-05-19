import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import { parse as parseCsvSync } from "csv-parse/sync";
import { z } from "zod";
import { db, milestonesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requirePM } from "../middlewares/requirePM";
import { ensureSystemWeeklies, DEFAULT_WEEKLY_COUNT } from "../lib/weeklies";
import { logAdminActionAsync } from "../lib/audit";
import { serialize } from "./milestones";
import { eq } from "drizzle-orm";
import { projectConfigTable } from "@workspace/db";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const router: IRouter = Router();

const KINDS = [
  "phase_milestone",
  "deliverable",
  "weekly_session",
  "presentation",
  "workshop",
  "decision",
] as const;

const BatchSessionSchema = z
  .object({
    kind: z.enum(KINDS),
    title: z.string().min(1).max(200),
    weekOffset: z.number().int().min(1).max(60).nullish(),
    dateOverride: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado YYYY-MM-DD")
      .nullish(),
    durationMinutes: z.number().int().min(1).max(1440).nullish(),
    location: z.string().max(200).nullish(),
    notes: z.string().max(2000).nullish(),
    phaseId: z.string().nullish(),
    ownersRoles: z.array(z.string()).optional(),
    description: z.string().max(2000).nullish(),
  })
  .refine(
    (s) =>
      (s.weekOffset != null && s.weekOffset >= 1) ||
      (s.dateOverride != null && s.dateOverride.length > 0),
    {
      message: "Debe indicar weekOffset o dateOverride",
      path: ["weekOffset"],
    },
  );

const BatchBodySchema = z.object({
  sessions: z.array(z.unknown()).min(1).max(500),
});

const ARRAY_FIELDS = new Set(["ownersRoles"]);
const NUMBER_FIELDS = new Set(["weekOffset", "durationMinutes"]);

function coerceCsvRow(row: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, vRaw] of Object.entries(row)) {
    const v = (vRaw ?? "").trim();
    if (v === "") {
      out[k] = null;
      continue;
    }
    if (NUMBER_FIELDS.has(k)) {
      const n = Number(v);
      out[k] = Number.isFinite(n) ? n : v;
    } else if (ARRAY_FIELDS.has(k)) {
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

function extractSessions(req: Request): {
  sessions: unknown[] | null;
  error: string | null;
} {
  // Multipart upload: a CSV file field named "file".
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
      return { sessions: rows.map(coerceCsvRow), error: null };
    } catch (err) {
      return {
        sessions: null,
        error: `CSV inválido: ${err instanceof Error ? err.message : "no se pudo parsear"}`,
      };
    }
  }
  const parsed = BatchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      sessions: null,
      error:
        "Cuerpo inválido: se esperaba { sessions: [...] } con al menos una fila.",
    };
  }
  return { sessions: parsed.data.sessions, error: null };
}

router.post(
  "/admin/milestones/regenerate-weeklies",
  requireAuth,
  requirePM,
  async (req, res): Promise<void> => {
    const [cfg] = await db
      .select()
      .from(projectConfigTable)
      .where(eq(projectConfigTable.id, 1))
      .limit(1);
    const startDate = cfg?.startDate ?? null;
    const count = await ensureSystemWeeklies(startDate, DEFAULT_WEEKLY_COUNT);
    logAdminActionAsync({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "milestones.regenerate_weeklies",
      targetType: "milestones",
      targetId: null,
      payload: { count, hasStartDate: !!startDate },
    });
    res.json({ count, hasStartDate: !!startDate });
  },
);

router.post(
  "/admin/milestones/batch",
  requireAuth,
  requirePM,
  upload.single("file"),
  async (req, res): Promise<void> => {
    const extracted = extractSessions(req);
    if (extracted.error || !extracted.sessions) {
      res.status(400).json({
        created: 0,
        updated: 0,
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

    const errors: Array<{ row: number; field: string | null; message: string }> = [];
    const validated: Array<z.infer<typeof BatchSessionSchema>> = [];
    extracted.sessions.forEach((raw, idx) => {
      const parsed = BatchSessionSchema.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({
            row: idx + 1,
            field: issue.path.join(".") || null,
            message: issue.message,
          });
        }
      } else {
        validated.push(parsed.data);
      }
    });

    if (errors.length > 0) {
      const rejectedRows = new Set(errors.map((e) => e.row));
      res.status(400).json({
        created: 0,
        updated: 0,
        rejected: rejectedRows.size,
        errors,
      });
      return;
    }

    const createdBy = req.userEmail ?? req.userId ?? null;
    try {
      const inserted = await db.transaction(async (tx) => {
        const rows: Array<typeof milestonesTable.$inferSelect> = [];
        for (const s of validated) {
          const [row] = await tx
            .insert(milestonesTable)
            .values({
              title: s.title,
              description: s.description ?? null,
              kind: s.kind,
              weekOffset: s.weekOffset ?? 1,
              phaseId: s.phaseId ?? null,
              ownersRoles: s.ownersRoles ?? [],
              dateOverride: s.dateOverride ?? null,
              durationMinutes: s.durationMinutes ?? null,
              location: s.location ?? null,
              notes: s.notes ?? null,
              source: "import",
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
        targetType: "milestones",
        targetId: null,
        payload: {
          subject: "milestones",
          count: inserted.length,
        },
      });

      res.json({
        created: inserted.length,
        updated: 0,
        rejected: 0,
        errors: [],
        milestones: inserted.map(serialize),
      });
    } catch (err) {
      req.log.error({ err }, "Batch milestone import failed");
      res.status(500).json({
        created: 0,
        updated: 0,
        rejected: validated.length,
        errors: [
          {
            row: 1,
            field: null,
            message:
              "Error inesperado al guardar las sesiones. No se insertó ninguna fila.",
          },
        ],
      });
    }
  },
);

export default router;
