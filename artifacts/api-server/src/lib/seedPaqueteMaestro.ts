import fs from "node:fs/promises";
import path from "node:path";
import { and, asc, eq, ne, notLike } from "drizzle-orm";
import { db, documentFoldersTable, documentsTable, usersTable } from "@workspace/db";
import { objectStorageClient } from "./objectStorage";
import { logger } from "./logger";

// The Paquete Maestro documents need a real `uploaded_by` user so the FK is
// satisfied. We pick a stable owner (Camila → project lead → any active real
// user) instead of creating a synthetic "system" user.
async function resolveOwnerUserId(): Promise<string | null> {
  const [camila] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, "camila@c2labs.ai"))
    .limit(1);
  if (camila) return camila.id;
  const [fallback] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.status, "active"),
        ne(usersTable.id, "system"),
        notLike(usersTable.id, "placeholder_%"),
      ),
    )
    .orderBy(asc(usersTable.createdAt))
    .limit(1);
  return fallback?.id ?? null;
}

type FolderSeed = { key: string; label: string; sortOrder: number };
type FileSeed = {
  slug: string;
  folder: string;
  name: string;
  description: string;
  mime: string;
  phaseId: string | null;
  relativePath: string;
};

const FOLDERS: FolderSeed[] = [
  {
    key: "pm_v1_00_zip",
    label: "Paquete Maestro v1 / 00 — Paquete completo (ZIP)",
    sortOrder: 100,
  },
  {
    key: "pm_v1_01_alineacion",
    label: "Paquete Maestro v1 / 01 — Alineación Técnica-Contractual",
    sortOrder: 101,
  },
  {
    key: "pm_v1_02_bom_diagramas",
    label: "Paquete Maestro v1 / 02 — Anexo BOM y Diagramas",
    sortOrder: 102,
  },
  {
    key: "pm_v1_03_handoff",
    label: "Paquete Maestro v1 / 03 — Handoff de Alcance",
    sortOrder: 103,
  },
  {
    key: "pm_v1_04_complementario",
    label: "Paquete Maestro v1 / 04 — Paquete Complementario",
    sortOrder: 104,
  },
  {
    key: "pm_v1_05_minuta",
    label: "Paquete Maestro v1 / 05 — Minuta formal de sesión",
    sortOrder: 105,
  },
  {
    key: "pm_v1_06_seguimiento",
    label: "Paquete Maestro v1 / 06 — Comunicación de Seguimiento",
    sortOrder: 106,
  },
  {
    key: "pm_v1_07_aceptacion",
    label: "Paquete Maestro v1 / 07 — Aceptación Oferta Martinexsa",
    sortOrder: 107,
  },
  {
    key: "pm_v1_08_diagramas",
    label: "Paquete Maestro v1 / 08 — Diagramas PNG",
    sortOrder: 108,
  },
  {
    key: "pm_v1_09_contexto",
    label: "Paquete Maestro v1 / 09 — Contexto Maestro (TXT)",
    sortOrder: 109,
  },
];

const PM = "attached_assets/Paquete_Maestro_Piloto_CEL";

const FILES: FileSeed[] = [
  {
    slug: "pm-v1-00-paquete-maestro-zip",
    folder: "pm_v1_00_zip",
    name: "Paquete_Maestro_Piloto_CEL.zip",
    description:
      "Paquete maestro completo del traspaso del piloto, en un único ZIP (todos los anexos, diagramas y referencias).",
    mime: "application/zip",
    phaseId: "F0",
    relativePath: "attached_assets/Paquete_Maestro_Piloto_CEL_1_1779262253256.zip",
  },
  {
    slug: "pm-v1-01-alineacion-tecnica-contractual",
    folder: "pm_v1_01_alineacion",
    name: "Alineacion_Tecnica_Contractual_AI_Silo_CEL_Fase0.docx",
    description:
      "Documento maestro de Alineación Técnica-Contractual (7 partes: anexo sustitutivo, matriz de cambios, alcance, checklist Fase 0, gates, cláusulas y carta formal).",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    phaseId: "F0",
    relativePath: `${PM}/01_Alineacion_Tecnica_y_Contractual/Alineacion_Tecnica_Contractual_AI_Silo_CEL_Fase0.docx`,
  },
  {
    slug: "pm-v1-02-anexo-bom-diagramas",
    folder: "pm_v1_02_bom_diagramas",
    name: "Anexo_Complementario_BOM_Diagrama_AI_Silo_CEL_Fase0.docx",
    description:
      "Anexo Complementario con BOM HW/SW actualizado, arquitectura por capas y texto sustitutivo de Anexos B/C.",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    phaseId: "F0",
    relativePath: `${PM}/03_Infraestructura_BOM_y_Handoff/Anexo_Complementario_BOM_Diagrama_AI_Silo_CEL_Fase0.docx`,
  },
  {
    slug: "pm-v1-03-handoff-alcance",
    folder: "pm_v1_03_handoff",
    name: "Handoff_Alcance_CEL_Martinexsa_Informacion_Requerida_Fase0.docx",
    description:
      "Handoff de Alcance: responsabilidades CEL/Martinexsa/Dell, información requerida (INF-01..24), gates y exclusiones.",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    phaseId: "F0",
    relativePath: `${PM}/03_Infraestructura_BOM_y_Handoff/Handoff_Alcance_CEL_Martinexsa_Informacion_Requerida_Fase0.docx`,
  },
  {
    slug: "pm-v1-04-paquete-complementario",
    folder: "pm_v1_04_complementario",
    name: "Paquete_Complementario_AI_Silo_CEL_Fase0_v2.docx",
    description:
      "Documento de ensamblaje/uso de los anexos del Paquete Complementario (v2).",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    phaseId: "F0",
    relativePath: `${PM}/03_Infraestructura_BOM_y_Handoff/Paquete_Complementario_AI_Silo_CEL_Fase0_v2.docx`,
  },
  {
    slug: "pm-v1-05-minuta-formal",
    folder: "pm_v1_05_minuta",
    name: "Minuta_formal_sesion_Piloto_CEL.docx",
    description:
      "Minuta formal de la sesión de coordinación del Piloto CEL.",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    phaseId: "F0",
    relativePath: `${PM}/02_Gobernanza_Roles_y_Sesiones/Minuta_formal_sesion_Piloto_CEL.docx`,
  },
  {
    slug: "pm-v1-06-comunicacion-seguimiento",
    folder: "pm_v1_06_seguimiento",
    name: "Comunicacion_de_Seguimiento_Apr_1.pdf",
    description:
      "Comunicación de Seguimiento (Apr 1, 2026): refresh Sección 10 + RACI + modelo FTE.",
    mime: "application/pdf",
    phaseId: "F0",
    relativePath: `${PM}/02_Gobernanza_Roles_y_Sesiones/Comunicacion_Seguimiento_Apr1_Seccion10_RACI_FTE.pdf`,
  },
  {
    slug: "pm-v1-07-aceptacion-oferta-martinexsa",
    folder: "pm_v1_07_aceptacion",
    name: "ACEPTACION_OFERTA_MARTINEXSA.pdf",
    description:
      "Aceptación de Oferta Martinexsa/Dell — fuente de verdad de la infraestructura adquirida.",
    mime: "application/pdf",
    phaseId: "F0",
    relativePath: `${PM}/04_Referencia_Proveedor/Aceptacion_Oferta_Martinexsa_Dell.pdf`,
  },
  {
    slug: "pm-v1-08-diagrama-architecture-scope",
    folder: "pm_v1_08_diagramas",
    name: "architecture_scope_final.png",
    description:
      "Diagrama de arquitectura del AI Silo y frontera de alcance (PNG, frozen).",
    mime: "image/png",
    phaseId: "F0",
    relativePath: `${PM}/05_Diagramas/architecture_scope_final.png`,
  },
  {
    slug: "pm-v1-08-diagrama-handoff-boundary",
    folder: "pm_v1_08_diagramas",
    name: "handoff_scope_boundary.png",
    description: "Diagrama de handoff y gates (PNG, frozen).",
    mime: "image/png",
    phaseId: "F0",
    relativePath: `${PM}/05_Diagramas/handoff_scope_boundary.png`,
  },
  {
    slug: "pm-v1-09-contexto-maestro",
    folder: "pm_v1_09_contexto",
    name: "Contexto_Maestro_Piloto_CEL.txt",
    description:
      "Contexto Maestro del piloto (TXT indexable): estado, decisiones, gobernanza, reconciliaciones y diagramas en código fuente.",
    mime: "text/plain; charset=utf-8",
    phaseId: "F0",
    relativePath:
      "attached_assets/Pasted--CONTEXTO-MAESTRO-Piloto-de-Pron-stico-Hidrol-gico-con-_1779262270102.txt",
  },
];

function parseObjectPath(p: string): { bucketName: string; objectName: string } {
  const full = p.startsWith("/") ? p : `/${p}`;
  const parts = full.split("/");
  if (parts.length < 3) throw new Error(`Invalid object path: ${p}`);
  return { bucketName: parts[1]!, objectName: parts.slice(2).join("/") };
}

function resolveAssetPath(relativePath: string): string | null {
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(process.cwd(), "..", "..", relativePath),
    path.resolve(process.cwd(), "..", "..", "..", relativePath),
  ];
  for (const c of candidates) {
    try {
      // require sync existence check via statSync would need import; use fs/promises elsewhere.
      // We'll do an async existence check in the caller; here we return the first candidate
      // and let the caller verify.
      void c;
    } catch {
      // ignore
    }
  }
  return candidates[0] ?? null;
}

async function findExistingAsset(relativePath: string): Promise<string | null> {
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(process.cwd(), "..", "..", relativePath),
    path.resolve(process.cwd(), "..", "..", "..", relativePath),
  ];
  for (const c of candidates) {
    try {
      await fs.access(c);
      return c;
    } catch {
      // try next
    }
  }
  return null;
}

async function ensureFolders(): Promise<void> {
  for (const f of FOLDERS) {
    await db
      .insert(documentFoldersTable)
      .values(f)
      .onConflictDoUpdate({
        target: documentFoldersTable.key,
        set: { label: f.label, sortOrder: f.sortOrder },
      });
  }
}

async function uploadFile(
  privateDir: string,
  objectKey: string,
  absPath: string,
  mime: string,
): Promise<{ sizeBytes: number }> {
  const buf = await fs.readFile(absPath);
  // objectKey is `/objects/documents/<slug>` → storage path is
  // `${privateDir}/documents/<slug>`.
  const entityId = objectKey.replace(/^\/objects\//, "");
  const dir = privateDir.endsWith("/") ? privateDir.slice(0, -1) : privateDir;
  const fullPath = `${dir}/${entityId}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  await file.save(buf, {
    contentType: mime,
    resumable: false,
    metadata: { contentType: mime },
  });
  return { sizeBytes: buf.byteLength };
}

export async function seedPaqueteMaestro(): Promise<void> {
  const privateDir = process.env.PRIVATE_OBJECT_DIR;
  if (!privateDir) {
    logger.info(
      "[paqueteMaestro] PRIVATE_OBJECT_DIR not set, skipping seed.",
    );
    return;
  }

  await ensureFolders();
  const ownerUserId = await resolveOwnerUserId();
  if (!ownerUserId) {
    logger.warn(
      "[paqueteMaestro] no active owner user found, skipping document seeding.",
    );
    return;
  }

  let created = 0;
  let skipped = 0;
  let missing = 0;

  for (const f of FILES) {
    const objectKey = `/objects/documents/${f.slug}`;
    const [existing] = await db
      .select({ id: documentsTable.id })
      .from(documentsTable)
      .where(
        and(
          eq(documentsTable.objectKey, objectKey),
          eq(documentsTable.folder, f.folder),
        ),
      )
      .limit(1);
    if (existing) {
      skipped += 1;
      continue;
    }

    const absPath = await findExistingAsset(f.relativePath);
    if (!absPath) {
      missing += 1;
      logger.warn(
        { file: f.relativePath },
        "[paqueteMaestro] asset not found on disk, skipping",
      );
      continue;
    }

    try {
      const { sizeBytes } = await uploadFile(
        privateDir,
        objectKey,
        absPath,
        f.mime,
      );
      await db
        .insert(documentsTable)
        .values({
          name: f.name,
          description: f.description,
          folder: f.folder,
          phaseId: f.phaseId,
          version: 1,
          objectKey,
          mimeType: f.mime,
          sizeBytes,
          uploadedBy: ownerUserId,
          isActive: true,
        });
      created += 1;
    } catch (err) {
      logger.error(
        { err, slug: f.slug },
        "[paqueteMaestro] failed to upload/insert document",
      );
    }
  }

  logger.info(
    { created, skipped, missing },
    "[paqueteMaestro] seed complete",
  );

  // Keep `resolveAssetPath` referenced to satisfy noUnusedLocals while leaving
  // the helper available for future callers that may need a sync-style resolver.
  void resolveAssetPath;
}
