export type GovernanceRoleEntry = {
  roleId: string;
  assignees: string[];
  tbd: boolean;
  pendingOnCommittee: boolean;
  pendingPerPhase?: boolean;
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
    assignees: ["Ing. José Manuel Guardado"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "data_engineer",
    assignees: ["Ing. William Juárez"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "hydrology_ops_cel",
    assignees: [],
    tbd: true,
    pendingOnCommittee: true,
  },
  {
    roleId: "it_committee_lead",
    assignees: ["Lic. Lorena Pineda"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "it_committee_networks",
    assignees: ["Nelson Flores"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "it_committee_sysadmin",
    assignees: ["Adrián Miranda"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "it_committee_dba",
    assignees: ["Carlos Sánchez"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "it_committee_security",
    assignees: ["Miladis"],
    tbd: false,
    pendingOnCommittee: false,
  },
  {
    roleId: "direccion_member",
    assignees: [
      "Ing. Guillermo Colorado",
      "Ing. Gerardo Ávalos",
      "Ing. Mauricio Herrera Landaverde",
      "Ing. Rigoberto Ávila",
    ],
    tbd: false,
    pendingOnCommittee: false,
    pendingPerPhase: true,
  },
];

export const GOVERNANCE_BY_ROLE: Map<string, GovernanceRoleEntry> = new Map(
  GOVERNANCE_ROLE_ASSIGNEES.map((g) => [g.roleId, g]),
);
