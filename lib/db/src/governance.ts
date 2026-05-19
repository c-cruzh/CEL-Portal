export type GovernanceRoleEntry = {
  roleId: string;
  assignees: string[];
  tbd: boolean;
  pendingOnCommittee: boolean;
};

export const GOVERNANCE_ROLE_ASSIGNEES: GovernanceRoleEntry[] = [
  {
    roleId: "pm_lead",
    assignees: ["Camila Cruz", "Kevin Centeno"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "pm_cel",
    assignees: ["Ing. José Mauricio Herrera Mercado"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "pm_director_cel",
    assignees: [],
    tbd: true,
    pendingOnCommittee: true,
  },
  {
    roleId: "hydrology_lead_cel",
    assignees: ["Ing. Víctor Alabí"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "geospatial_expert_cel",
    assignees: ["Ing. Fernando Garay"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "infra_devops",
    assignees: [
      "Ing. José Manuel Guardado",
      "Lic. Lorena Pineda",
      "Nelson Flores",
    ],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "data_engineer",
    assignees: [
      "Ing. William Juarez",
      "Ing. José Mauricio Herrera Mercado",
    ],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "hydrology_ops_cel",
    assignees: [],
    tbd: true,
    pendingOnCommittee: true,
  },
];

export const GOVERNANCE_BY_ROLE: Map<string, GovernanceRoleEntry> = new Map(
  GOVERNANCE_ROLE_ASSIGNEES.map((g) => [g.roleId, g]),
);
