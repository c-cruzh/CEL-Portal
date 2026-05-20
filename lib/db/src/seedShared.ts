import { PHASES_FOR_SEED } from "@workspace/project-domain";

export type SeedMilestone = {
  seedKey: string;
  title: string;
  description: string | null;
  kind: string;
  weekOffset: number;
  phaseId: string | null;
  ownersRoles: string[];
};

export function buildSeedMilestones(): SeedMilestone[] {
  const items: SeedMilestone[] = [];

  items.push({
    seedKey: "kickoff",
    title: "Kickoff del piloto",
    description:
      "Reunión inicial con todo el equipo. Alineamiento, RACI y objetivos del piloto.",
    kind: "phase_milestone",
    weekOffset: 1,
    phaseId: "F0",
    ownersRoles: ["pm_lead", "pm_cel"],
  });

  for (const p of PHASES_FOR_SEED) {
    const endWeek = p.startWeek + p.durationWeeks - 1;

    items.push({
      seedKey: `phase_start_${p.id}`,
      title: `Inicio ${p.label}`,
      description: `Comienzo formal de ${p.label}.`,
      kind: "phase_milestone",
      weekOffset: p.startWeek,
      phaseId: p.id,
      ownersRoles: p.ownersRoles,
    });

    p.deliverables.forEach((d, i) => {
      items.push({
        seedKey: `deliverable_${p.id}_${i + 1}`,
        title: d,
        description: `Entregable principal de ${p.label}.`,
        kind: "deliverable",
        weekOffset: endWeek,
        phaseId: p.id,
        ownersRoles: p.ownersRoles,
      });
    });

    items.push({
      seedKey: `phase_review_${p.id}`,
      title: `Presentación de cierre — ${p.label}`,
      description:
        "Revisión formal de entregables contra criterios de aceptación.",
      kind: "presentation",
      weekOffset: endWeek,
      phaseId: p.id,
      ownersRoles: ["pm_lead", "pm_cel", "stakeholder_cel"],
    });
  }

  items.push({
    seedKey: "workshop_handoff",
    title: "Taller de capacitación y handoff",
    description: "Transferencia de conocimiento al equipo operativo de CEL.",
    kind: "workshop",
    weekOffset: 27,
    phaseId: "F4",
    ownersRoles: ["docs_training", "hydrology_lead_cel"],
  });

  return items;
}

export type SeedPlaceholderUser = {
  email: string;
  displayName: string;
  orgPosition: string | null;
  roles: string[];
};

export const SEED_PLACEHOLDER_USERS: SeedPlaceholderUser[] = [
  {
    email: "kevin@c2labs.ai",
    displayName: "Kevin Centeno",
    orgPosition: "Project Manager (C2 Labs) — Operaciones",
    roles: ["pm_lead"],
  },
  {
    email: "jmherreram@cel.gob.sv",
    displayName: "Ing. José Mauricio Herrera Mercado",
    orgPosition: "Gerencia de Producción (CEL) — PM CEL + Adm. del Contrato",
    roles: ["pm_cel"],
  },
  {
    email: "vialabi@cel.gob.sv",
    displayName: "Ing. Víctor Alabí",
    orgPosition: "Gerencia de Producción (CEL) — Líder Técnico en Hidrología",
    roles: ["hydrology_lead_cel"],
  },
  {
    email: "fgaray@cel.gob.sv",
    displayName: "Ing. Fernando Garay",
    orgPosition: "Catastro GIS (CEL) — Especialista SIG / Teledetección",
    roles: ["geospatial_expert_cel"],
  },
  {
    email: "wjuarez@cel.gob.sv",
    displayName: "Ing. William Juárez",
    orgPosition: "Gerencia Comercial (CEL) — Ingeniero de Datos y Backend",
    roles: ["data_engineer"],
  },
  {
    email: "jmguardado@cel.gob.sv",
    displayName: "Ing. José Manuel Guardado",
    orgPosition: "Unidad de Informática (CEL) — Adm. de Sistemas / DevOps",
    roles: ["infra_devops"],
  },
  {
    email: "alpineda@cel.gob.sv",
    displayName: "Lic. Lorena Pineda",
    orgPosition: "Unidad de Informática (CEL) — Jefa de Unidad",
    roles: ["it_committee_lead"],
  },
  {
    email: "nfloresc@cel.gob.sv",
    displayName: "Nelson Flores",
    orgPosition: "Unidad de Informática (CEL) — Jefe de Adm. de Redes",
    roles: ["it_committee_networks"],
  },
  {
    email: "ravila@cel.gob.sv",
    displayName: "Ing. Rigoberto Ávila",
    orgPosition: "Equipo de Dirección del Piloto (CEL)",
    roles: ["direccion_member"],
  },
];

export function placeholderIdFor(email: string): string {
  return `placeholder_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}
