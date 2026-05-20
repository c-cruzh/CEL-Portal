import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, allowedEmailDomainsTable, usersTable } from "@workspace/db";
import {
  ListAllowedDomainsResponse,
  AddAllowedDomainBody,
  AddAllowedDomainResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { logAdminActionAsync } from "../lib/audit";
import {
  invalidateAllowedDomainsCache,
  normalizeDomainInput,
} from "../lib/allowedDomains";

const router: IRouter = Router();

router.get(
  "/admin/allowed-domains",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(allowedEmailDomainsTable)
      .orderBy(asc(allowedEmailDomainsTable.domain));
    res.json(
      ListAllowedDomainsResponse.parse(
        rows.map((r) => ({
          domain: r.domain,
          addedBy: r.addedBy ?? null,
          note: r.note ?? null,
          createdAt: r.createdAt,
        })),
      ),
    );
  },
);

router.post(
  "/admin/allowed-domains",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = AddAllowedDomainBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const domain = normalizeDomainInput(parsed.data.domain);
    if (!domain) {
      res.status(400).json({
        error:
          "Dominio inválido. Usa el formato 'ejemplo.com' (sin protocolo ni @).",
        code: "invalid_domain",
      });
      return;
    }
    const note = parsed.data.note?.trim() || null;

    const [row] = await db
      .insert(allowedEmailDomainsTable)
      .values({
        domain,
        addedBy: req.userEmail ?? req.userId ?? null,
        note,
      })
      .onConflictDoNothing()
      .returning();

    const [final] = row
      ? [row]
      : await db
          .select()
          .from(allowedEmailDomainsTable)
          .where(eq(allowedEmailDomainsTable.domain, domain))
          .limit(1);

    if (row) {
      invalidateAllowedDomainsCache();
      logAdminActionAsync({
        actorId: req.userId ?? null,
        actorEmail: req.userEmail ?? null,
        action: "allowed_domain.add",
        targetType: "allowed_domain",
        targetId: domain,
        payload: { domain, note },
      });
    }

    res.status(row ? 201 : 200).json(
      AddAllowedDomainResponse.parse({
        domain: final!.domain,
        addedBy: final!.addedBy ?? null,
        note: final!.note ?? null,
        createdAt: final!.createdAt,
      }),
    );
  },
);

router.delete(
  "/admin/allowed-domains/:domain",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = req.params.domain;
    const domainRaw = Array.isArray(raw) ? raw[0] : raw;
    const domain = normalizeDomainInput(decodeURIComponent(domainRaw ?? ""));
    if (!domain) {
      res.status(400).json({ error: "Dominio requerido" });
      return;
    }

    // Safety: refuse to remove the last allowed domain, otherwise no new
    // sign-ups would be possible (and existing non-admin users would be
    // locked out on next request).
    const all = await db
      .select({ domain: allowedEmailDomainsTable.domain })
      .from(allowedEmailDomainsTable);
    if (all.length <= 1 && all.some((d) => d.domain === domain)) {
      res.status(400).json({
        error:
          "No puedes eliminar el último dominio permitido. Agrega otro antes de quitar este.",
        code: "last_allowed_domain",
      });
      return;
    }

    // Safety: refuse to remove a domain that would lock out an existing
    // member (including the requesting admin). Surface the affected accounts
    // so the admin can act on them deliberately.
    const members = await db
      .select({ email: usersTable.email })
      .from(usersTable);
    const inUse = members
      .map((m) => m.email)
      .filter((e) => e.split("@")[1]?.toLowerCase() === domain);
    if (inUse.length > 0) {
      res.status(409).json({
        error: `Este dominio aún tiene ${inUse.length} miembro${inUse.length === 1 ? "" : "s"} activo${inUse.length === 1 ? "" : "s"} en el portal. Elimínalos o cámbialos antes de quitar el dominio.`,
        code: "domain_in_use",
        affectedEmails: inUse,
      });
      return;
    }

    const result = await db
      .delete(allowedEmailDomainsTable)
      .where(eq(allowedEmailDomainsTable.domain, domain))
      .returning({ domain: allowedEmailDomainsTable.domain });

    if (result.length === 0) {
      res.status(404).json({ error: "Dominio no encontrado" });
      return;
    }

    invalidateAllowedDomainsCache();
    logAdminActionAsync({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "allowed_domain.remove",
      targetType: "allowed_domain",
      targetId: domain,
      payload: { domain },
    });
    res.sendStatus(204);
  },
);

export default router;
