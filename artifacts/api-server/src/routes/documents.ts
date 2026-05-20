import { Router, type IRouter } from "express";
import { and, asc, desc, eq, or } from "drizzle-orm";
import {
  db,
  documentsTable,
  documentFoldersTable,
  usersTable,
  userRolesTable,
} from "@workspace/db";
import {
  ListDocumentFoldersResponse,
  CreateDocumentFolderBody,
  ListDocumentsResponse,
  ListDocumentsQueryParams,
  CreateDocumentBody,
  UpdateDocumentBody,
  UpdateDocumentResponse,
  GetDocumentDownloadUrlResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { notifyAsync } from "../lib/notifications";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

const PM_ROLE_IDS = new Set(["project_lead", "pm_lead", "pm_cel"]);
const ALLOWED_PHASE_IDS = new Set(["F0", "F1", "F2", "F3", "F4"]);

async function isUserPM(userId: string): Promise<boolean> {
  const rows = await db
    .select({ roleId: userRolesTable.roleId })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId));
  return rows.some((r) => PM_ROLE_IDS.has(r.roleId));
}

type DocRow = typeof documentsTable.$inferSelect;

function serializeDoc(
  row: DocRow,
  uploaderName: string,
): {
  id: string;
  name: string;
  description: string | null;
  folder: string;
  phaseId: string | null;
  version: number;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  isActive: boolean;
} {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    folder: row.folder,
    phaseId: row.phaseId ?? null,
    version: row.version,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    uploadedBy: row.uploadedBy,
    uploadedByName: uploaderName,
    uploadedAt: row.uploadedAt,
    isActive: row.isActive,
  };
}

router.get(
  "/documents/folders",
  requireAuth,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(documentFoldersTable)
      .orderBy(asc(documentFoldersTable.sortOrder), asc(documentFoldersTable.label));
    res.json(
      ListDocumentFoldersResponse.parse(
        rows.map((r) => ({
          key: r.key,
          label: r.label,
          sortOrder: r.sortOrder,
        })),
      ),
    );
  },
);

function slugifyFolderKey(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

router.post(
  "/documents/folders",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = (req as { userId?: string }).userId;
    if (!userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (!(await isUserPM(userId))) {
      res
        .status(403)
        .json({ error: "Solo el PM puede crear carpetas en el repositorio." });
      return;
    }

    const parsed = CreateDocumentFolderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const label = parsed.data.label.trim();
    if (!label) {
      res.status(400).json({ error: "El nombre de la carpeta es obligatorio." });
      return;
    }
    let key = (parsed.data.key ?? slugifyFolderKey(label)).trim();
    if (!key) {
      res
        .status(400)
        .json({ error: "No se pudo generar una clave para la carpeta." });
      return;
    }

    const existing = await db
      .select()
      .from(documentFoldersTable)
      .where(eq(documentFoldersTable.key, key))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: `Ya existe una carpeta con la clave "${key}".` });
      return;
    }

    const allRows = await db
      .select({ sortOrder: documentFoldersTable.sortOrder })
      .from(documentFoldersTable);
    const nextSortOrder =
      allRows.length === 0
        ? 1
        : Math.max(...allRows.map((r) => r.sortOrder ?? 0)) + 1;

    const [created] = await db
      .insert(documentFoldersTable)
      .values({ key, label, sortOrder: nextSortOrder })
      .returning();

    res.status(201).json({
      key: created.key,
      label: created.label,
      sortOrder: created.sortOrder,
    });
  },
);

router.get("/documents", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { folder, phaseId, uploadedBy, search, includeInactive } = parsed.data;

  const conds = [] as Array<ReturnType<typeof eq>>;
  if (!includeInactive) {
    conds.push(eq(documentsTable.isActive, true));
  }
  if (folder) conds.push(eq(documentsTable.folder, folder));
  if (phaseId) conds.push(eq(documentsTable.phaseId, phaseId));
  if (uploadedBy) conds.push(eq(documentsTable.uploadedBy, uploadedBy));

  const whereClause = conds.length > 0 ? and(...conds) : undefined;

  let rows = await db
    .select()
    .from(documentsTable)
    .where(whereClause)
    .orderBy(desc(documentsTable.uploadedAt));

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }

  const uploaderIds = Array.from(new Set(rows.map((r) => r.uploadedBy)));
  const uploaders = uploaderIds.length
    ? await db
        .select({ id: usersTable.id, displayName: usersTable.displayName })
        .from(usersTable)
        .where(
          or(...uploaderIds.map((id) => eq(usersTable.id, id))) as ReturnType<
            typeof eq
          >,
        )
    : [];
  const nameById = new Map(uploaders.map((u) => [u.id, u.displayName]));

  res.json(
    ListDocumentsResponse.parse(
      rows.map((r) => serializeDoc(r, nameById.get(r.uploadedBy) ?? r.uploadedBy)),
    ),
  );
});

router.post("/documents", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, description, folder, phaseId, objectPath, mimeType, sizeBytes } =
    parsed.data;

  const trimmedName = name.trim();
  if (!trimmedName) {
    res.status(400).json({ error: "El nombre es obligatorio." });
    return;
  }

  if (phaseId && !ALLOWED_PHASE_IDS.has(phaseId)) {
    res.status(400).json({ error: "Fase inválida." });
    return;
  }

  if (!/^\/objects\/documents\/[A-Za-z0-9_-]+$/.test(objectPath)) {
    res.status(400).json({
      error: "objectPath inválido: debe provenir del flujo de subida de documentos.",
    });
    return;
  }
  try {
    await objectStorage.getObjectEntityFile(objectPath);
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(400).json({ error: "El archivo subido no se encontró en el almacenamiento." });
      return;
    }
    throw err;
  }

  const [folderRow] = await db
    .select()
    .from(documentFoldersTable)
    .where(eq(documentFoldersTable.key, folder))
    .limit(1);
  if (!folderRow) {
    res.status(400).json({ error: "Carpeta inválida." });
    return;
  }

  // Find any active version with same name+folder to bump version and deactivate
  const [previousActive] = await db
    .select()
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.name, trimmedName),
        eq(documentsTable.folder, folder),
        eq(documentsTable.isActive, true),
      ),
    )
    .orderBy(desc(documentsTable.version))
    .limit(1);

  let nextVersion = 1;
  let isNewVersion = false;
  if (previousActive) {
    nextVersion = previousActive.version + 1;
    isNewVersion = true;
  } else {
    // Also account for archived rows with same name+folder so versions keep growing
    const [latest] = await db
      .select({ version: documentsTable.version })
      .from(documentsTable)
      .where(
        and(
          eq(documentsTable.name, trimmedName),
          eq(documentsTable.folder, folder),
        ),
      )
      .orderBy(desc(documentsTable.version))
      .limit(1);
    if (latest) {
      nextVersion = latest.version + 1;
      isNewVersion = true;
    }
  }

  const inserted = await db.transaction(async (tx) => {
    if (previousActive) {
      await tx
        .update(documentsTable)
        .set({ isActive: false })
        .where(eq(documentsTable.id, previousActive.id));
    }
    const [row] = await tx
      .insert(documentsTable)
      .values({
        name: trimmedName,
        description: description?.trim() ? description.trim() : null,
        folder,
        phaseId: phaseId ?? null,
        version: nextVersion,
        objectKey: objectPath,
        mimeType,
        sizeBytes,
        uploadedBy: req.userId!,
        isActive: true,
      })
      .returning();
    return row!;
  });

  const [uploader] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (uploader) {
    notifyAsync({
      kind: "document_uploaded",
      actor: uploader,
      documentName: inserted.name,
      folderLabel: folderRow.label,
      version: inserted.version,
      isNewVersion,
    });
  }

  res.status(201).json(
    UpdateDocumentResponse.parse(
      serializeDoc(inserted, uploader?.displayName ?? req.userId!),
    ),
  );
});

router.put("/documents/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0]! : rawId;
  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, id))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Documento no encontrado." });
    return;
  }
  const isOwner = existing.uploadedBy === req.userId!;
  const pm = await isUserPM(req.userId!);
  if (!isOwner && !pm) {
    res.status(403).json({
      error: "Solo el autor o un PM pueden modificar este documento.",
    });
    return;
  }

  const patch: Partial<DocRow> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name.trim();
  if (parsed.data.description !== undefined)
    patch.description =
      parsed.data.description && parsed.data.description.trim()
        ? parsed.data.description.trim()
        : null;
  if (parsed.data.folder !== undefined) {
    const [f] = await db
      .select({ key: documentFoldersTable.key })
      .from(documentFoldersTable)
      .where(eq(documentFoldersTable.key, parsed.data.folder))
      .limit(1);
    if (!f) {
      res.status(400).json({ error: "Carpeta inválida." });
      return;
    }
    patch.folder = parsed.data.folder;
  }
  if (parsed.data.phaseId !== undefined) {
    if (parsed.data.phaseId && !ALLOWED_PHASE_IDS.has(parsed.data.phaseId)) {
      res.status(400).json({ error: "Fase inválida." });
      return;
    }
    patch.phaseId = parsed.data.phaseId ?? null;
  }

  // Preserve single-active-version invariant: if name or folder changes and
  // this row is active, ensure no other active row has the same (name, folder).
  const nextName = patch.name ?? existing.name;
  const nextFolder = patch.folder ?? existing.folder;
  const nameOrFolderChanged =
    (patch.name !== undefined && patch.name !== existing.name) ||
    (patch.folder !== undefined && patch.folder !== existing.folder);
  if (nameOrFolderChanged && existing.isActive) {
    const [collision] = await db
      .select({ id: documentsTable.id })
      .from(documentsTable)
      .where(
        and(
          eq(documentsTable.name, nextName),
          eq(documentsTable.folder, nextFolder),
          eq(documentsTable.isActive, true),
        ),
      )
      .limit(1);
    if (collision && collision.id !== existing.id) {
      res.status(409).json({
        error:
          "Ya existe un documento activo con ese nombre en esa carpeta. Sube una nueva versión en su lugar.",
      });
      return;
    }
  }

  const [updated] = Object.keys(patch).length
    ? await db
        .update(documentsTable)
        .set(patch)
        .where(eq(documentsTable.id, id))
        .returning()
    : [existing];

  const [uploader] = await db
    .select({ displayName: usersTable.displayName })
    .from(usersTable)
    .where(eq(usersTable.id, updated!.uploadedBy))
    .limit(1);

  res.json(
    UpdateDocumentResponse.parse(
      serializeDoc(updated!, uploader?.displayName ?? updated!.uploadedBy),
    ),
  );
});

router.delete(
  "/documents/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0]! : rawId;
    const [existing] = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Documento no encontrado." });
      return;
    }
    const isOwner = existing.uploadedBy === req.userId!;
    const pm = await isUserPM(req.userId!);
    if (!isOwner && !pm) {
      res.status(403).json({
        error: "Solo el autor o un PM pueden eliminar este documento.",
      });
      return;
    }
    await db.delete(documentsTable).where(eq(documentsTable.id, id));
    res.sendStatus(204);
  },
);

router.get(
  "/documents/:id/download",
  requireAuth,
  async (req, res): Promise<void> => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0]! : rawId;
    const [row] = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Documento no encontrado." });
      return;
    }
    try {
      const ttlSec = 300;
      const url = await objectStorage.getObjectEntityDownloadURL(row.objectKey, {
        ttlSec,
      });
      const expiresAt = new Date(Date.now() + ttlSec * 1000);
      res.json(
        GetDocumentDownloadUrlResponse.parse({ url, expiresAt }),
      );
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Archivo no encontrado en el almacenamiento." });
        return;
      }
      req.log.error({ err }, "Failed to sign document download URL");
      res.status(500).json({ error: "No se pudo generar el enlace de descarga." });
    }
  },
);

export default router;
